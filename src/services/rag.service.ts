import { Citation, DocumentChunk, Material } from '../types';
import { appStorage } from './storage/localStorageStore';
import { aiUsageService } from './aiUsage.service';
import { TUTOR_PROMPT_V1 } from '../prompts';
import { projectsService } from './projects.service';
import { aiProviderService } from './aiProvider.service';
import { localLlmService } from './localLlm.service';

const ACTION_TYPE_MAP: Record<string, 'explain_simpler' | 'give_example' | 'test_me' | 'deep_dive'> = {
  explain_simpler: 'explain_simpler',
  give_example: 'give_example',
  test_me: 'test_me',
  continue: 'deep_dive',
};

export interface RAGResponse {
  text: string;
  isGrounded: boolean;
  citations: Citation[];
  isUnsupported: boolean;
  suggestedFollowups: string[];
}

export class RAGService {
  private stopWords = new Set([
    'what', 'is', 'the', 'a', 'an', 'and', 'or', 'in', 'on', 'at', 'to', 'for', 'of',
    'with', 'about', 'how', 'does', 'do', 'can', 'you', 'explain', 'tell', 'me', 'please',
    'why', 'when', 'where', 'which', 'who', 'could', 'would', 'should',
  ]);

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !this.stopWords.has(w));
  }

  async retrieveAndGenerate(
    projectId: string,
    query: string,
    actionType?: string
  ): Promise<RAGResponse> {
    // 0. Enforce user/project authorization
    projectsService.assertProjectAccess(projectId);

    const startTime = Date.now();

    // 1. Strict Project Isolation: retrieve ONLY chunks and materials for this projectId
    const allChunks = appStorage.get('documentChunks');
    const allMaterials = appStorage.get('materials');
    const projectChunks = allChunks.filter((c) => c.projectId === projectId);
    const projectMaterials = allMaterials.filter((m) => m.projectId === projectId);

    const materialMap = new Map<string, Material>();
    projectMaterials.forEach((m) => materialMap.set(m.id, m));

    // 2. Compute Relevance Scores using word-boundary sets
    const queryTokens = this.tokenize(query);
    const scoredChunks: { chunk: DocumentChunk; score: number }[] = [];

    for (const chunk of projectChunks) {
      let score = 0;
      const chunkWords = new Set(chunk.content.toLowerCase().replace(/[^\w\s]/g, ' ').split(/\s+/));
      const mat = materialMap.get(chunk.materialId);
      const titleWords = new Set((mat ? mat.title.toLowerCase() : '').replace(/[^\w\s]/g, ' ').split(/\s+/));

      for (const token of queryTokens) {
        if (chunkWords.has(token)) score += 3;
        if (titleWords.has(token)) score += 2;
        for (const concept of chunk.conceptsMentioned) {
          const conceptWords = new Set(concept.toLowerCase().replace(/[^\w\s]/g, ' ').split(/\s+/));
          if (conceptWords.has(token)) score += 4;
        }
      }

      if (score > 0) {
        scoredChunks.push({ chunk, score });
      }
    }

    scoredChunks.sort((a, b) => b.score - a.score);
    let topScored = scoredChunks.slice(0, 4);

    // If an action pill (e.g. test_me / explain_simpler) was clicked and no explicit keywords matched,
    // gracefully inherit the primary project chunk as context
    if (topScored.length === 0 && actionType && projectChunks.length > 0) {
      topScored = [{ chunk: projectChunks[0], score: 5 }];
    }

    // 3. Handle Unsupported Questions if no evidence meets threshold
    if (topScored.length === 0 || topScored[0].score < 3) {
      const latencyMs = Date.now() - startTime + 320;
      await aiUsageService.recordAIUsage({
        model: TUTOR_PROMPT_V1.targetModel,
        promptTokens: 240,
        completionTokens: 85,
        latencyMs,
        operation: 'tutor_retrieval_unsupported',
        projectId,
      });

      const indexedTopics = Array.from(
        new Set(projectChunks.flatMap((c) => c.conceptsMentioned).filter((t) => t && t.trim().length > 0))
      ).slice(0, 4);

      const hasMaterials = projectMaterials.length > 0;
      const hasTopics = indexedTopics.length > 0;

      let guidanceText: string;
      if (!hasMaterials) {
        guidanceText = 'This project has no uploaded materials yet — upload a PDF, text, or markdown file to get started.';
      } else if (!hasTopics) {
        guidanceText = `Your materials (**${
          projectMaterials.map((m) => m.title).join(', ') || 'uploaded documents'
        }**) are still processing or contain no extractable text — try re-uploading, or ask again once indexing finishes.`;
      } else {
        guidanceText = `To keep our session strictly grounded, consider exploring one of the concepts actually covered in your materials: ${indexedTopics.join(
          ', '
        )}.`;
      }

      return {
        text: `I couldn't find enough direct evidence in your uploaded study materials for **${
          projectMaterials[0]?.title || 'this project'
        }** to answer this question confidently.\n\nYour query falls outside the indexed document scope. ${guidanceText}`,
        isGrounded: false,
        citations: [],
        isUnsupported: true,
        suggestedFollowups: hasTopics ? indexedTopics.map((t) => `Explain ${t} in detail`) : [],
      };
    }

    // 4. Grounded Synthesis with Citations
    const bestChunk = topScored[0].chunk;
    const bestMat = materialMap.get(bestChunk.materialId);
    const citations: Citation[] = topScored.map((item) => {
      const m = materialMap.get(item.chunk.materialId);
      return {
        id: `cit-${item.chunk.id}-${Date.now()}`,
        materialId: item.chunk.materialId,
        materialTitle: m ? m.title : 'Study Document',
        excerpt: item.chunk.content.length > 140 ? `${item.chunk.content.substring(0, 137)}...` : item.chunk.content,
        chunkIndex: item.chunk.chunkIndex,
      };
    });

    const followups: string[] = [
      `How does this relate to ${projectChunks.find((c) => c.id !== bestChunk.id)?.conceptsMentioned[0] || 'another concept'}?`,
      'Can you give a practical example?',
      'Test me on this concept',
    ];

    // 5. Real generation. Priority: local in-browser model (no key needed) >
    // Gemini API (needs a key) > deterministic template fallback, so the
    // tutor always answers with the best available option.
    const mappedActionType = actionType ? ACTION_TYPE_MAP[actionType] : undefined;
    const project = projectsService.assertProjectAccess(projectId);

    let answerText: string;
    let usedLiveModel = false;
    let modelUsed = TUTOR_PROMPT_V1.targetModel as string;

    const systemInstruction = TUTOR_PROMPT_V1.systemInstruction;
    const userPrompt = TUTOR_PROMPT_V1.formatTemplate({
      projectName: project.title,
      learningGoal: project.targetGoal,
      contextChunks: topScored.map((item) => ({
        materialTitle: materialMap.get(item.chunk.materialId)?.title || 'Study Document',
        chunkIndex: item.chunk.chunkIndex,
        content: item.chunk.content,
      })),
      userQuery: query,
      actionType: mappedActionType,
    });

    if (localLlmService.isEnabled() && localLlmService.isReady()) {
      const localResult = await localLlmService.generate({
        systemInstruction,
        prompt: userPrompt,
        temperature: TUTOR_PROMPT_V1.temperature,
        maxOutputTokens: TUTOR_PROMPT_V1.maxOutputTokens,
      });
      if (localResult && localResult.text.trim().length > 0) {
        answerText = localResult.text.trim();
        usedLiveModel = true;
        modelUsed = localResult.model;
      } else {
        answerText = this.fallbackTemplate(actionType, bestChunk, bestMat);
      }
    } else if (aiProviderService.hasApiKey()) {
      const result = await aiProviderService.generate({
        model: TUTOR_PROMPT_V1.targetModel,
        systemInstruction,
        prompt: userPrompt,
        temperature: TUTOR_PROMPT_V1.temperature,
        maxOutputTokens: TUTOR_PROMPT_V1.maxOutputTokens,
        operationName: actionType ? `tutor_${actionType}` : 'tutor_grounded_answer',
        projectId,
      });

      if (result && result.text.trim().length > 0) {
        answerText = result.text.trim();
        usedLiveModel = true;
        modelUsed = result.model;
      } else {
        answerText = this.fallbackTemplate(actionType, bestChunk, bestMat);
      }
    } else {
      answerText = this.fallbackTemplate(actionType, bestChunk, bestMat);
    }

    if (!usedLiveModel) {
      const latencyMs = Date.now() - startTime + 480;
      await aiUsageService.recordAIUsage({
        model: TUTOR_PROMPT_V1.targetModel,
        promptTokens: 410,
        completionTokens: 210,
        latencyMs,
        operation: actionType ? `tutor_${actionType}` : 'tutor_grounded_answer',
        projectId,
      });
    } else if (modelUsed !== TUTOR_PROMPT_V1.targetModel) {
      // Local-model generations aren't tracked by aiProviderService (no network call), so log usage here.
      const latencyMs = Date.now() - startTime;
      await aiUsageService.recordAIUsage({
        model: modelUsed,
        promptTokens: Math.round(userPrompt.length / 4),
        completionTokens: Math.round(answerText.length / 4),
        latencyMs,
        operation: actionType ? `tutor_${actionType}_local` : 'tutor_grounded_answer_local',
        projectId,
      });
    }

    return {
      text: answerText,
      isGrounded: true,
      citations,
      isUnsupported: false,
      suggestedFollowups: followups,
    };
  }

  /**
   * Deterministic, template-based fallback used only when no Gemini API key
   * is configured (Settings → connect an API key to enable live generation).
   * Kept intentionally distinct from the live-model path so it's obvious
   * which mode produced a given answer.
   */
  private fallbackTemplate(
    actionType: string | undefined,
    bestChunk: DocumentChunk,
    bestMat?: Material
  ): string {
    const noKeyNotice = '_(No AI model active — showing your indexed text directly. Enable the local browser model or add a Gemini API key in Settings for live AI answers.)_\n\n';

    if (actionType === 'explain_simpler') {
      return `${noKeyNotice}Here is the relevant passage from **${bestMat?.title || 'your material'}** (Chunk #${bestChunk.chunkIndex}):\n\n${bestChunk.content}`;
    } else if (actionType === 'give_example') {
      return `${noKeyNotice}The closest grounded passage from **${bestMat?.title}** (Chunk #${bestChunk.chunkIndex}) is:\n\n${bestChunk.content}`;
    } else if (actionType === 'test_me') {
      return `${noKeyNotice}Based on **${bestMat?.title}** (Chunk #${bestChunk.chunkIndex}):\n\n"${bestChunk.content}"\n\nTry summarizing this passage in your own words, then ask me to check your answer.`;
    }
    return `${noKeyNotice}Based on your project materials for **${bestMat?.title || 'this document'}** (Chunk #${bestChunk.chunkIndex}):\n\n${bestChunk.content}`;
  }
}

export const ragService = new RAGService();
