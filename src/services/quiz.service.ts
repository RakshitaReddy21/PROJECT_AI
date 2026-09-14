import {
  QuizQuestion,
  QuizResult,
  Concept,
  DocumentChunk,
  Material,
  TopicPerformance,
  AIRecommendationResult,
} from '../types';
import { appStorage } from './storage/localStorageStore';
import { masteryService } from './mastery.service';
import { recommendationService } from './recommendation.service';
import { activityService } from './activity.service';
import { aiUsageService } from './aiUsage.service';
import { authService } from './auth.service';
import { QUIZ_GENERATION_V1, WEAK_AREA_ANALYSIS_V1 } from '../prompts';
import { projectsService } from './projects.service';
import { aiProviderService } from './aiProvider.service';
import { localLlmService } from './localLlm.service';
import { isTableOfContentsLike, isBlockedConceptName, scoreChunkRelevance } from './materials.service';

export interface QuestionEvaluationResult {
  questionId: string;
  isCorrect: boolean;
  selectedOptionId: string;
  correctOptionId: string;
  explanation: string;
  conceptAffected: {
    id: string;
    name: string;
    oldScore: number;
    newScore: number;
    delta: number;
    masteryLevel: string;
  };
  newProjectScore: number;
}

export type QuizUnavailableReason = 'no_material' | 'processing' | 'insufficient_content' | 'generation_failed';

export class QuizUnavailableError extends Error {
  reason: QuizUnavailableReason;
  constructor(reason: QuizUnavailableReason, message: string) {
    super(message);
    this.reason = reason;
    this.name = 'QuizUnavailableError';
  }
}

interface RawQuizQuestion {
  conceptName?: string;
  difficulty?: string;
  question?: string;
  options?: { id?: string; text?: string }[];
  correctOptionId?: string;
  explanation?: string;
}

const MIN_VALID_QUESTIONS = 3;

/** How many questions a single adaptive quiz attempt asks, even when the generated pool is larger. */
export const ADAPTIVE_SESSION_LENGTH = 8;

export type AdaptiveState = 'focus' | 'increased' | 'normal';

export interface AdaptiveOutcome {
  questionId: string;
  conceptId: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  isCorrect: boolean;
}

export interface AdaptivePick {
  question: QuizQuestion | null;
  state: AdaptiveState;
}

const DIFFICULTY_RANK: Record<string, number> = { easy: 0, medium: 1, hard: 2 };

/**
 * Picks the next question from the generated pool based on the outcome of
 * the previous one — this is what actually makes the quiz "adaptive" (vs.
 * just working through a fixed pre-generated list):
 *   - First question: random pick, preferring medium difficulty.
 *   - After a WRONG answer: reinforce the same concept, at an equal-or-easier
 *     difficulty, so the learner gets another shot at what they just missed.
 *   - After a RIGHT answer: escalate difficulty and prefer a different
 *     concept, to keep testing breadth rather than over-drilling a mastered topic.
 * Pure function (no I/O) so it's trivially testable and reusable client-side
 * without a network round-trip between every question.
 */
export function pickAdaptiveNextQuestion(
  pool: QuizQuestion[],
  askedQuestionIds: string[],
  lastOutcome?: AdaptiveOutcome
): AdaptivePick {
  const remaining = pool.filter((q) => !askedQuestionIds.includes(q.id));
  if (remaining.length === 0) return { question: null, state: 'normal' };

  const pickRandom = (candidates: QuizQuestion[]): QuizQuestion =>
    candidates[Math.floor(Math.random() * candidates.length)];

  if (!lastOutcome) {
    const mediums = remaining.filter((q) => q.difficulty === 'medium');
    return { question: pickRandom(mediums.length > 0 ? mediums : remaining), state: 'normal' };
  }

  if (!lastOutcome.isCorrect) {
    const sameConcept = remaining.filter((q) => q.conceptId === lastOutcome.conceptId);
    const candidatePool = sameConcept.length > 0 ? sameConcept : remaining;
    const targetLevel = DIFFICULTY_RANK[lastOutcome.difficulty || 'medium'] ?? 1;
    const equalOrEasier = candidatePool.filter((q) => (DIFFICULTY_RANK[q.difficulty || 'medium'] ?? 1) <= targetLevel);
    return { question: pickRandom(equalOrEasier.length > 0 ? equalOrEasier : candidatePool), state: 'focus' };
  }

  const targetLevel = Math.min(2, (DIFFICULTY_RANK[lastOutcome.difficulty || 'medium'] ?? 1) + 1);
  const harderAndDifferent = remaining.filter(
    (q) => q.conceptId !== lastOutcome.conceptId && (DIFFICULTY_RANK[q.difficulty || 'medium'] ?? 1) >= targetLevel
  );
  const harderAny = remaining.filter((q) => (DIFFICULTY_RANK[q.difficulty || 'medium'] ?? 1) >= targetLevel);
  const differentConceptAny = remaining.filter((q) => q.conceptId !== lastOutcome.conceptId);
  const candidatePool =
    harderAndDifferent.length > 0
      ? harderAndDifferent
      : harderAny.length > 0
      ? harderAny
      : differentConceptAny.length > 0
      ? differentConceptAny
      : remaining;
  return { question: pickRandom(candidatePool), state: 'increased' };
}

export class QuizService {
  /**
   * Returns the cached quiz for a project, generating a real, PDF-grounded
   * quiz on first access. Throws QuizUnavailableError with a specific reason
   * when there isn't enough indexed material to build one.
   */
  async getQuizQuestions(projectId: string): Promise<QuizQuestion[]> {
    projectsService.assertProjectAccess(projectId);
    const all = appStorage.get('quizQuestions');
    if (all[projectId] && all[projectId].length > 0) {
      return all[projectId];
    }
    return this.generateQuiz(projectId);
  }

  /**
   * Explicitly (re)generates a quiz from the project's uploaded materials,
   * discarding any previously cached questions. This is the real "Generate
   * Quiz" pipeline: grounded document context -> LLM -> validated structured
   * questions -> persisted.
   */
  async generateQuiz(projectId: string, questionCount?: number): Promise<QuizQuestion[]> {
    const project = projectsService.assertProjectAccess(projectId);

    const materials = appStorage.get('materials').filter((m) => m.projectId === projectId);
    if (materials.length === 0) {
      throw new QuizUnavailableError('no_material', 'Upload a learning material first to generate a quiz.');
    }

    const readyMaterials = materials.filter((m) => m.stage === 'ready');
    if (readyMaterials.length === 0) {
      throw new QuizUnavailableError(
        'processing',
        'Your material is still being processed. Please wait for indexing to finish before generating a quiz.'
      );
    }

    const allConcepts = appStorage.get('concepts').filter((c) => c.projectId === projectId);

    // One-time self-healing cleanup: purge any document-structure-noise
    // concepts ("Table", "Level", "Basics"...) left over from before this
    // blocklist existed, so they stop appearing anywhere in the app -- not
    // just in newly generated quizzes.
    const blockedConcepts = allConcepts.filter((c) => isBlockedConceptName(c.name));
    if (blockedConcepts.length > 0) {
      const blockedIds = new Set(blockedConcepts.map((c) => c.id));
      appStorage.update('concepts', (all) => all.filter((c) => !blockedIds.has(c.id)));
      appStorage.update('projects', (projects) =>
        projects.map((p) =>
          p.id === projectId ? { ...p, conceptCount: Math.max(0, p.conceptCount - blockedConcepts.length) } : p
        )
      );
    }

    // Placeholder concepts are inserted by the ingestion pipeline when no real
    // text could be extracted (e.g. a scanned/unreadable PDF) — they don't
    // represent real content and shouldn't be quizzed on.
    const concepts = allConcepts.filter(
      (c) => !c.name.startsWith('Unindexed:') && !isBlockedConceptName(c.name)
    );

    const allChunks = appStorage.get('documentChunks').filter((c) => c.projectId === projectId);
    const realChunks = allChunks.filter((c) => c.content && c.content.length > 30 && !c.content.startsWith('No extractable text'));

    if (concepts.length === 0 || realChunks.length === 0) {
      throw new QuizUnavailableError(
        'insufficient_content',
        "This material doesn't contain enough information to generate a meaningful quiz."
      );
    }

    const materialMap = new Map<string, Material>(materials.map((m) => [m.id, m]));

    // Prioritize weaker concepts slightly, but cap and keep coverage broad.
    const targetConcepts = [...concepts].sort((a, b) => a.score - b.score).slice(0, 8);
    // Generate a POOL larger than a single session's length, so the adaptive
    // engine below has real material to branch through based on live
    // performance, and so retakes/regenerations don't show a fixed sequence.
    const count = questionCount ?? Math.min(18, Math.max(6, targetConcepts.length * 3));

    const conceptContext = targetConcepts.map((concept) => ({
      name: concept.name,
      definition: concept.definition,
      category: concept.category,
      currentMastery: concept.score,
      groundedExcerpt: this.findGroundedExcerpt(concept, realChunks),
    }));

    const systemInstruction = QUIZ_GENERATION_V1.systemInstruction;
    const basePrompt = QUIZ_GENERATION_V1.formatTemplate({
      projectName: project.title,
      concepts: conceptContext,
      targetDifficulty: 'adaptive',
      questionCount: count,
    });

    const { questions: rawQuestions, isLiveAI, modelUsed, promptChars, completionChars } =
      await this.callQuizGenerationModel(projectId, systemInstruction, basePrompt);

    let validated = this.validateAndNormalizeQuestions(rawQuestions, targetConcepts, projectId);

    if (validated.length < MIN_VALID_QUESTIONS && isLiveAI) {
      // One retry with a stricter, explicit instruction — LLM JSON output can
      // occasionally be malformed or too short on the first pass.
      const retryPrompt = `${basePrompt}\n\nIMPORTANT: Your previous response was invalid or incomplete. Return ONLY a single valid JSON object matching the schema above, with at least ${Math.min(
        MIN_VALID_QUESTIONS,
        count
      )} questions. No markdown fences, no prose before or after the JSON.`;
      const retryResult = await this.callQuizGenerationModel(projectId, systemInstruction, retryPrompt);
      const retryValidated = this.validateAndNormalizeQuestions(retryResult.questions, targetConcepts, projectId);
      if (retryValidated.length > validated.length) {
        validated = retryValidated;
      }
    }

    if (validated.length < MIN_VALID_QUESTIONS) {
      // Deterministic, clearly-non-AI fallback used only when no model (local
      // or Gemini) is configured/available or generation kept failing. Still
      // grounded in the same real extracted concepts and PDF excerpts.
      validated = this.deterministicFallbackQuestions(targetConcepts, realChunks, projectId, count);
      if (validated.length < MIN_VALID_QUESTIONS) {
        throw new QuizUnavailableError(
          'generation_failed',
          "We couldn't generate the quiz. Please try again."
        );
      }
    }

    appStorage.update('quizQuestions', (prev) => ({
      ...prev,
      [projectId]: validated,
    }));

    await aiUsageService.recordAIUsage({
      model: modelUsed,
      promptTokens: Math.round(promptChars / 4),
      completionTokens: Math.round(completionChars / 4),
      latencyMs: isLiveAI ? 900 : 60,
      operation: isLiveAI ? 'quiz_generation' : 'quiz_generation_fallback',
      projectId,
    });

    void materialMap; // retained for future citation linking (see generateWeakAreaAnalysis)
    return validated;
  }

  /** Finds the most relevant real chunk of source text for a given concept, for grounding. */
  private findGroundedExcerpt(concept: Concept, chunks: DocumentChunk[]): string | undefined {
    const nameLower = concept.name.toLowerCase();
    let best: { chunk: DocumentChunk; score: number } | null = null;

    for (const chunk of chunks) {
      if (isTableOfContentsLike(chunk.content)) continue;
      let score = scoreChunkRelevance(concept.name, chunk.content);
      if (chunk.conceptsMentioned.some((c) => c.toLowerCase() === nameLower)) score += 5;
      if (score > 0 && (!best || score > best.score)) {
        best = { chunk, score };
      }
    }

    if (!best) return undefined;
    const content = best.chunk.content;
    return content.length > 500 ? `${content.slice(0, 497)}...` : content;
  }

  /** Runs quiz generation through local LLM -> Gemini -> null, mirroring rag.service's provider chain. */
  private async callQuizGenerationModel(
    projectId: string,
    systemInstruction: string,
    prompt: string
  ): Promise<{ questions: RawQuizQuestion[]; isLiveAI: boolean; modelUsed: string; promptChars: number; completionChars: number }> {
    let text: string | null = null;
    let isLiveAI = false;
    let modelUsed = QUIZ_GENERATION_V1.targetModel as string;

    if (localLlmService.isEnabled() && localLlmService.isReady()) {
      const localResult = await localLlmService.generate({
        systemInstruction,
        prompt,
        temperature: QUIZ_GENERATION_V1.temperature,
        maxOutputTokens: QUIZ_GENERATION_V1.maxOutputTokens,
      });
      if (localResult && localResult.text.trim().length > 0) {
        text = localResult.text.trim();
        isLiveAI = true;
        modelUsed = localResult.model;
      }
    } else if (aiProviderService.hasApiKey()) {
      const result = await aiProviderService.generate({
        model: QUIZ_GENERATION_V1.targetModel,
        systemInstruction,
        prompt,
        temperature: QUIZ_GENERATION_V1.temperature,
        maxOutputTokens: QUIZ_GENERATION_V1.maxOutputTokens,
        responseFormat: 'json',
        operationName: 'quiz_generation',
        projectId,
      });
      if (result && result.text.trim().length > 0) {
        text = result.text.trim();
        isLiveAI = true;
        modelUsed = result.model;
      }
    }

    if (!text) {
      return { questions: [], isLiveAI: false, modelUsed, promptChars: prompt.length, completionChars: 0 };
    }

    const parsed = this.parseJsonLenient(text);
    const questions: RawQuizQuestion[] = Array.isArray(parsed?.questions) ? (parsed?.questions as RawQuizQuestion[]) : [];
    return { questions, isLiveAI, modelUsed, promptChars: prompt.length, completionChars: text.length };
  }

  /** Tolerates markdown code fences or stray text around the JSON payload. */
  private parseJsonLenient(text: string): { questions?: unknown } | null {
    const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    try {
      return JSON.parse(cleaned);
    } catch {
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          return JSON.parse(match[0]);
        } catch {
          return null;
        }
      }
      return null;
    }
  }

  /** Validates raw AI output against the QuizQuestion schema, dropping malformed items. */
  private validateAndNormalizeQuestions(
    raw: RawQuizQuestion[],
    concepts: Concept[],
    projectId: string
  ): QuizQuestion[] {
    const seenQuestionText = new Set<string>();
    const validDifficulties = new Set(['easy', 'medium', 'hard']);
    const result: QuizQuestion[] = [];

    raw.forEach((item, idx) => {
      if (!item || typeof item.question !== 'string' || item.question.trim().length < 8) return;
      if (!Array.isArray(item.options) || item.options.length < 2) return;

      const options = item.options
        .filter((o) => o && typeof o.text === 'string' && o.text.trim().length > 0)
        .map((o, optIdx) => ({
          id: typeof o.id === 'string' && o.id.trim() ? o.id : `opt-${idx}-${optIdx}`,
          text: (o.text as string).trim(),
        }));

      if (options.length < 2) return;

      const correctOptionId =
        typeof item.correctOptionId === 'string' && options.some((o) => o.id === item.correctOptionId)
          ? item.correctOptionId
          : options[0]?.id;
      if (!correctOptionId) return;

      const questionKey = item.question.trim().toLowerCase();
      if (seenQuestionText.has(questionKey)) return;
      seenQuestionText.add(questionKey);

      // Fuzzy-match the AI's conceptName back to a real extracted concept.
      const conceptNameRaw = typeof item.conceptName === 'string' ? item.conceptName.trim() : '';
      const matchedConcept =
        concepts.find((c) => c.name.toLowerCase() === conceptNameRaw.toLowerCase()) ||
        concepts.find(
          (c) =>
            conceptNameRaw.length > 0 &&
            (c.name.toLowerCase().includes(conceptNameRaw.toLowerCase()) ||
              conceptNameRaw.toLowerCase().includes(c.name.toLowerCase()))
        ) ||
        concepts[idx % concepts.length];

      if (!matchedConcept) return;

      const difficulty = validDifficulties.has(String(item.difficulty))
        ? (item.difficulty as 'easy' | 'medium' | 'hard')
        : 'medium';

      const explanation =
        typeof item.explanation === 'string' && item.explanation.trim().length > 0
          ? item.explanation.trim()
          : `${matchedConcept.name} is defined as: ${matchedConcept.definition}`;

      result.push({
        id: `q-${projectId}-${matchedConcept.id}-${idx}-${Date.now()}`,
        conceptId: matchedConcept.id,
        conceptName: matchedConcept.name,
        type: 'multiple_choice',
        difficulty,
        question: item.question.trim(),
        options,
        correctOptionId,
        explanation,
      });
    });

    return result;
  }

  /**
   * Deterministic, clearly-non-AI fallback used only when no model (local or
   * Gemini) is configured/available. Instead of generic templated distractor
   * sentences (which read identically across every question), this uses a
   * "definition matching" design: the correct option is this concept's real,
   * grounded definition; the wrong options are OTHER real concepts' real
   * definitions from the same document. Every option is therefore concrete,
   * distinct, and actually requires knowing the material to answer correctly.
   */
  private deterministicFallbackQuestions(
    concepts: Concept[],
    chunks: DocumentChunk[],
    projectId: string,
    count: number
  ): QuizQuestion[] {
    const pool = concepts.length > 0 ? concepts : [];
    const questions: QuizQuestion[] = [];
    const difficulties: ('easy' | 'medium' | 'hard')[] = ['easy', 'medium', 'hard'];

    const statementFor = (concept: Concept): string => {
      const cleaned = concept.definition.trim();
      return cleaned.length > 220 ? `${cleaned.slice(0, 217)}...` : cleaned;
    };

    for (let i = 0; i < Math.min(count, pool.length * 2); i += 1) {
      const concept = pool[i % pool.length];
      const excerpt = this.findGroundedExcerpt(concept, chunks);

      // Distractors: real definitions of OTHER concepts in this same document,
      // cycled so different questions get different distractor combinations.
      const others = pool.filter((c) => c.id !== concept.id);
      const distractorConcepts: Concept[] = [];
      for (let j = 0; j < others.length && distractorConcepts.length < 3; j += 1) {
        distractorConcepts.push(others[(i + j) % others.length]);
      }

      const correctId = `opt-${concept.id}-${i}-correct`;
      const options = [
        { id: correctId, text: statementFor(concept) },
        ...distractorConcepts.map((d, idx) => ({
          id: `opt-${concept.id}-${i}-d${idx}`,
          text: statementFor(d),
        })),
      ];

      // With no other concepts at all, a definition-matching question isn't
      // possible -- skip rather than pad with repeated/fake distractor text.
      if (options.length < 2) continue;

      questions.push({
        id: `q-${projectId}-${concept.id}-fallback-${i}-${Date.now()}`,
        conceptId: concept.id,
        conceptName: concept.name,
        type: 'multiple_choice',
        difficulty: difficulties[i % difficulties.length],
        question: excerpt
          ? `Based on your uploaded material ("${excerpt.slice(0, 140)}${excerpt.length > 140 ? '...' : ''}"), which of these is the correct definition of "${concept.name}"?`
          : `Which of these is the correct definition of "${concept.name}", as covered in your uploaded material?`,
        explanation: `${concept.name}: ${concept.definition}${excerpt ? `\n\nSource excerpt: "${excerpt}"` : ''}`,
        options,
        correctOptionId: correctId,
      });
    }

    return questions;
  }

  async submitSingleAttempt(
    projectId: string,
    questionId: string,
    selectedOptionId: string
  ): Promise<QuestionEvaluationResult> {
    const project = projectsService.assertProjectAccess(projectId);
    const questions = appStorage.get('quizQuestions')[projectId] || [];
    const question = questions.find((q) => q.id === questionId);

    if (!question) {
      throw new Error(`Question ${questionId} not found`);
    }

    const isCorrect = question.correctOptionId === selectedOptionId;
    const allConcepts = appStorage.get('concepts');
    const concept = allConcepts.find((c) => c.id === question.conceptId);
    const oldScore = concept ? concept.score : 50;

    const { updatedConcepts, newProjectScore } = await masteryService.updateMasteryFromQuiz(
      projectId,
      [
        {
          conceptId: question.conceptId,
          conceptName: question.conceptName,
          isCorrect,
        },
      ]
    );

    const updatedConcept = updatedConcepts.find((c) => c.id === question.conceptId);
    const newScore = updatedConcept ? updatedConcept.score : oldScore;
    const delta = newScore - oldScore;

    if (!isCorrect) {
      const selectedOpt = question.options.find((o) => o.id === selectedOptionId);
      const correctOpt = question.options.find((o) => o.id === question.correctOptionId);

      appStorage.update('learningContexts', (contexts) => {
        const current = contexts[projectId] || {
          projectId,
          userId: project.userId,
          projectTitle: project.title,
          learningGoal: project.targetGoal || 'Mastery syllabus',
          masteredConcepts: [],
          weakConcepts: [],
          recentMistakes: [],
          assessmentHistory: [],
          learningPreferences: { explanationDepth: 'balanced', pacing: 'standard' },
          importantInsights: [],
        };

        const newMistake = {
          questionId: question.id,
          question: question.question,
          conceptName: question.conceptName,
          selectedOption: selectedOpt ? selectedOpt.text : 'Selected Option',
          correctOption: correctOpt ? correctOpt.text : 'Correct Option',
          explanation: question.explanation,
        };

        return {
          ...contexts,
          [projectId]: {
            ...current,
            recentMistakes: [newMistake, ...(current.recentMistakes || [])].slice(0, 5),
          },
        };
      });
    }

    const currentUser = authService.getCurrentUser();
    const activeUserId = currentUser?.id || project.userId;
    if (activeUserId) {
      await activityService.logActivity({
        userId: activeUserId,
        userName: currentUser?.name || 'Learner',
        projectId,
        projectTitle: project.title,
        type: 'quiz_completed',
        description: `Answered question on ${question.conceptName} (${isCorrect ? 'Correct ✓' : 'Incorrect ✗'}). Mastery changed by ${delta > 0 ? '+' : ''}${delta}%.`,
      });
    }

    await aiUsageService.recordAIUsage({
      model: QUIZ_GENERATION_V1.targetModel,
      promptTokens: 180,
      completionTokens: 60,
      latencyMs: 120,
      operation: 'quiz_adaptive_grading',
      projectId,
    });

    return {
      questionId,
      isCorrect,
      selectedOptionId,
      correctOptionId: question.correctOptionId,
      explanation: question.explanation,
      conceptAffected: {
        id: question.conceptId,
        name: question.conceptName,
        oldScore,
        newScore,
        delta,
        masteryLevel: updatedConcept?.masteryLevel || 'competent',
      },
      newProjectScore,
    };
  }

  async submitQuiz(
    projectId: string,
    attempts: { questionId: string; selectedOptionId: string }[]
  ): Promise<QuizResult> {
    const project = projectsService.assertProjectAccess(projectId);
    const questions = await this.getQuizQuestions(projectId);
    let correctCount = 0;
    const evaluatedAttempts: {
      conceptId: string;
      conceptName: string;
      isCorrect: boolean;
      question: QuizQuestion;
      selectedOptionText: string;
    }[] = [];

    attempts.forEach((att) => {
      const q = questions.find((item) => item.id === att.questionId);
      if (q) {
        const isCorrect = q.correctOptionId === att.selectedOptionId;
        if (isCorrect) correctCount += 1;
        const selectedOpt = q.options.find((o) => o.id === att.selectedOptionId);
        evaluatedAttempts.push({
          conceptId: q.conceptId,
          conceptName: q.conceptName,
          isCorrect,
          question: q,
          selectedOptionText: selectedOpt ? selectedOpt.text : 'Unknown',
        });
      }
    });

    const totalQuestions = Math.max(1, attempts.length);
    const score = Math.round((correctCount / totalQuestions) * 100);

    // 1. Real topic-wise performance, computed strictly from THIS quiz's
    // answers (PRD §9) — independent of the cumulative, randomized mastery
    // delta used elsewhere. This is what weak-area detection is based on.
    const topicPerformance = this.computeTopicPerformance(evaluatedAttempts);
    const weakAreas = topicPerformance
      .filter((t) => t.classification === 'weak')
      .map((t) => t.conceptName);

    // 2. Cascading Mastery Update (cumulative concept mastery, separate concern)
    const { updatedConcepts, newProjectScore } = await masteryService.updateMasteryFromQuiz(
      projectId,
      evaluatedAttempts.map((e) => ({
        conceptId: e.conceptId,
        conceptName: e.conceptName,
        isCorrect: e.isCorrect,
      }))
    );

    // 3. Update Structured Learning Context with Mistakes
    const wrongAttempts = evaluatedAttempts.filter((e) => !e.isCorrect);
    if (wrongAttempts.length > 0) {
      appStorage.update('learningContexts', (contexts) => {
        const current = contexts[projectId] || {
          projectId,
          userId: project.userId,
          projectTitle: project.title,
          learningGoal: project.targetGoal || 'Mastery syllabus',
          masteredConcepts: [],
          weakConcepts: [],
          recentMistakes: [],
          assessmentHistory: [],
          learningPreferences: { explanationDepth: 'balanced', pacing: 'standard' },
          importantInsights: [],
        };

        const newMistakes = wrongAttempts.map((w) => ({
          questionId: w.question.id,
          question: w.question.question,
          conceptName: w.conceptName,
          selectedOption: w.selectedOptionText,
          correctOption:
            w.question.options.find((o) => o.id === w.question.correctOptionId)?.text || 'Correct Option',
          explanation: w.question.explanation,
        }));

        return {
          ...contexts,
          [projectId]: {
            ...current,
            recentMistakes: [...newMistakes, ...(current.recentMistakes || [])].slice(0, 5),
          },
        };
      });
    }

    // 4. AI-generated (or data-derived) weak-area analysis, grounded in the
    // real per-topic accuracy above plus relevant PDF excerpts.
    const aiRecommendation = await this.generateWeakAreaAnalysis(projectId, project.title, topicPerformance);

    // 5. Recompute Recommendations
    await recommendationService.refreshRecommendations();

    const currentUser = authService.getCurrentUser();
    const quizUserId = currentUser?.id || project.userId;
    if (quizUserId) {
      await activityService.logActivity({
        userId: quizUserId,
        userName: currentUser?.name || 'Learner',
        projectId,
        projectTitle: project.title,
        type: 'quiz_completed',
        description: `Completed quiz: ${score}% (${correctCount}/${totalQuestions} correct). Project score is now ${newProjectScore}%.`,
      });
    }

    await aiUsageService.recordAIUsage({
      model: QUIZ_GENERATION_V1.targetModel,
      promptTokens: 180,
      completionTokens: 60,
      latencyMs: 140,
      operation: 'quiz_adaptive_grading',
      projectId,
    });

    const result: QuizResult = {
      id: `qr-${Date.now()}`,
      userId: project.userId || currentUser?.id,
      projectId,
      score,
      totalQuestions,
      correctCount,
      adaptationRationale: `Evaluated ${evaluatedAttempts.length} answers across ${topicPerformance.length} topic(s). Accuracy: ${score}%.`,
      conceptPerformance: updatedConcepts.map((c) => ({
        conceptId: c.id,
        conceptName: c.name,
        score: c.score,
        delta: c.recentChange || 0,
      })),
      topicPerformance,
      weakAreas,
      aiRecommendation,
      completedAt: new Date().toISOString(),
    };

    appStorage.update('quizResults', (prev) => {
      const existing = prev[projectId] || [];
      return {
        ...prev,
        [projectId]: [result, ...existing],
      };
    });

    return result;
  }

  /** Groups evaluated attempts by concept/topic and computes real accuracy + classification for this attempt only. */
  private computeTopicPerformance(
    evaluatedAttempts: { conceptId: string; conceptName: string; isCorrect: boolean }[]
  ): TopicPerformance[] {
    const byTopic = new Map<string, { conceptId: string; conceptName: string; correct: number; total: number }>();

    for (const attempt of evaluatedAttempts) {
      const key = attempt.conceptId || attempt.conceptName;
      const entry = byTopic.get(key) || {
        conceptId: attempt.conceptId,
        conceptName: attempt.conceptName,
        correct: 0,
        total: 0,
      };
      entry.total += 1;
      if (attempt.isCorrect) entry.correct += 1;
      byTopic.set(key, entry);
    }

    return Array.from(byTopic.values())
      .map((t) => {
        const accuracy = Math.round((t.correct / t.total) * 100);
        const classification: TopicPerformance['classification'] =
          accuracy >= 75 ? 'strong' : accuracy >= 50 ? 'needs_improvement' : 'weak';
        return { ...t, accuracy, classification };
      })
      .sort((a, b) => a.accuracy - b.accuracy);
  }

  /** Generates the post-quiz AI analysis, grounded in per-topic accuracy and real PDF excerpts. Never hardcoded. */
  private async generateWeakAreaAnalysis(
    projectId: string,
    projectTitle: string,
    topicPerformance: TopicPerformance[]
  ): Promise<AIRecommendationResult> {
    if (topicPerformance.length === 0) {
      return {
        summary: 'No topic-level data was available for this attempt.',
        recommendations: [],
        nextStep: 'Take a quiz to get a personalized study analysis.',
        isLiveAI: false,
      };
    }

    const allChunks = appStorage.get('documentChunks').filter((c) => c.projectId === projectId);
    const allConcepts = appStorage.get('concepts').filter((c) => c.projectId === projectId);

    const focusTopics = topicPerformance.filter((t) => t.classification !== 'strong').slice(0, 3);
    const topicsForExcerpts = focusTopics.length > 0 ? focusTopics : topicPerformance.slice(0, 2);

    const groundedExcerpts = topicsForExcerpts
      .map((t) => {
        const concept = allConcepts.find((c) => c.id === t.conceptId || c.name === t.conceptName);
        const excerpt = concept ? this.findGroundedExcerpt(concept, allChunks) : undefined;
        return excerpt ? { topic: t.conceptName, excerpt } : null;
      })
      .filter((x): x is { topic: string; excerpt: string } => x !== null);

    const systemInstruction = WEAK_AREA_ANALYSIS_V1.systemInstruction;
    const prompt = WEAK_AREA_ANALYSIS_V1.formatTemplate({
      projectName: projectTitle,
      topicPerformance: topicPerformance.map((t) => ({
        topic: t.conceptName,
        correct: t.correct,
        total: t.total,
        accuracy: t.accuracy,
        classification: t.classification,
      })),
      groundedExcerpts,
    });

    let text: string | null = null;
    let modelUsed = WEAK_AREA_ANALYSIS_V1.targetModel as string;
    let isLiveAI = false;

    if (localLlmService.isEnabled() && localLlmService.isReady()) {
      const localResult = await localLlmService.generate({
        systemInstruction,
        prompt,
        temperature: WEAK_AREA_ANALYSIS_V1.temperature,
        maxOutputTokens: WEAK_AREA_ANALYSIS_V1.maxOutputTokens,
      });
      if (localResult && localResult.text.trim().length > 0) {
        text = localResult.text.trim();
        modelUsed = localResult.model;
        isLiveAI = true;
      }
    } else if (aiProviderService.hasApiKey()) {
      const result = await aiProviderService.generate({
        model: WEAK_AREA_ANALYSIS_V1.targetModel,
        systemInstruction,
        prompt,
        temperature: WEAK_AREA_ANALYSIS_V1.temperature,
        maxOutputTokens: WEAK_AREA_ANALYSIS_V1.maxOutputTokens,
        responseFormat: 'json',
        operationName: 'quiz_weak_area_analysis',
        projectId,
      });
      if (result && result.text.trim().length > 0) {
        text = result.text.trim();
        modelUsed = result.model;
        isLiveAI = true;
      }
    }

    const weakest = topicPerformance[0];
    const strongest = topicPerformance[topicPerformance.length - 1];

    if (text) {
      const parsed = this.parseJsonLenient(text) as Partial<AIRecommendationResult> | null;
      if (
        parsed &&
        typeof parsed.summary === 'string' &&
        parsed.summary.trim().length > 0 &&
        Array.isArray(parsed.recommendations)
      ) {
        await aiUsageService.recordAIUsage({
          model: modelUsed,
          promptTokens: Math.round(prompt.length / 4),
          completionTokens: Math.round(text.length / 4),
          latencyMs: 700,
          operation: 'quiz_weak_area_analysis',
          projectId,
        });
        return {
          summary: parsed.summary.trim(),
          strongestTopic: typeof parsed.strongestTopic === 'string' ? parsed.strongestTopic : strongest.conceptName,
          weakestTopic: typeof parsed.weakestTopic === 'string' ? parsed.weakestTopic : weakest.conceptName,
          recommendations: parsed.recommendations.filter((r): r is string => typeof r === 'string' && r.trim().length > 0),
          nextStep:
            typeof parsed.nextStep === 'string' && parsed.nextStep.trim().length > 0
              ? parsed.nextStep.trim()
              : `Review the ${weakest.conceptName} section of your uploaded material, then retake a short quiz.`,
          isLiveAI: true,
        };
      }
    }

    // Deterministic fallback — still fully derived from this attempt's real
    // topic-level numbers, never a hardcoded topic name.
    const weakList = topicPerformance.filter((t) => t.classification !== 'strong');
    return {
      summary:
        topicPerformance.length > 1
          ? `Your strongest area is ${strongest.conceptName} with ${strongest.accuracy}% accuracy. Your weakest area is ${weakest.conceptName} with ${weakest.accuracy}% accuracy.`
          : `You scored ${weakest.accuracy}% on ${weakest.conceptName}.`,
      strongestTopic: strongest.conceptName,
      weakestTopic: weakest.conceptName,
      recommendations:
        weakList.length > 0
          ? weakList.map((t) => `Review ${t.conceptName} (${t.accuracy}% accuracy on this attempt).`)
          : ['Keep practicing periodically to maintain your current mastery.'],
      nextStep: `Review the ${weakest.conceptName} section of your uploaded material and then attempt a short practice quiz.`,
      isLiveAI: false,
    };
  }
}

export const quizService = new QuizService();
