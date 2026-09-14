import { describe, it, expect, beforeEach } from 'vitest';
import { appStorage } from '../services/storage/localStorageStore';
import { authService } from '../services/auth.service';
import { spacesService } from '../services/spaces.service';
import { projectsService } from '../services/projects.service';
import { quizService, QuizUnavailableError } from '../services/quiz.service';
import { Material, Concept, DocumentChunk } from '../types';

/**
 * Verifies the PDF -> Quiz -> Evaluate -> Topic-wise Weak-Area Analysis loop
 * for a brand-new project, simulating a fully-processed PDF upload by
 * seeding materials/concepts/documentChunks directly (the ingestion pipeline
 * itself is untouched and already covered by spaces_projects_materials.test.ts).
 *
 * No live LLM API key is configured in the test environment, so this
 * exercises the deterministic, PDF-grounded fallback path -- the same path
 * a user without a Gemini key would hit. It intentionally does NOT assert
 * on live-model output, only on the real, non-hardcoded computation:
 * generation is grounded in the seeded concepts/excerpts, and topic
 * performance / weak areas are derived strictly from the submitted answers.
 */
describe('PDF -> Quiz -> Weak Area Learning Loop', () => {
  let projectId: string;

  beforeEach(async () => {
    appStorage.resetToSeed();
    sessionStorage.clear();

    const { user } = await authService.register({
      name: 'Test Learner',
      email: `learner-${Date.now()}@test.edu`,
      password: 'password123',
    });
    sessionStorage.setItem('aurelia_auth_user', JSON.stringify(user));

    const space = await spacesService.createSpace({
      name: 'OS Fundamentals',
      description: 'Operating systems course notes',
      color: '#4A6FA5',
    });

    const project = await projectsService.createProject({
      spaceId: space.id,
      title: 'Operating Systems 101',
      description: 'Process scheduling, deadlocks, and virtual memory',
      targetGoal: 'Pass the midterm',
    });
    projectId = project.id;
  });

  it('refuses to generate a quiz when no material has been uploaded', async () => {
    await expect(quizService.getQuizQuestions(projectId)).rejects.toThrow(QuizUnavailableError);
    try {
      await quizService.getQuizQuestions(projectId);
      expect.fail('should have thrown');
    } catch (err) {
      expect((err as QuizUnavailableError).reason).toBe('no_material');
    }
  });

  it('generates PDF-grounded questions once material, concepts, and chunks exist', async () => {
    const material: Material = {
      id: 'mat-os-1',
      projectId,
      title: 'OS Notes.pdf',
      fileName: 'OS Notes.pdf',
      fileSize: 102400,
      fileType: 'application/pdf',
      stage: 'ready',
      progress: 100,
      extractedConceptsCount: 2,
      chunkCount: 2,
      uploadedAt: new Date().toISOString(),
    };

    const concepts: Concept[] = [
      {
        id: 'c-deadlock',
        projectId,
        name: 'Deadlocks',
        definition: 'A state where a set of processes are blocked because each is waiting for a resource held by another.',
        category: 'Process Management',
        masteryLevel: 'novice',
        score: 30,
        lastAssessedAt: new Date().toISOString(),
        relatedMaterialIds: [material.id],
      },
      {
        id: 'c-vm',
        projectId,
        name: 'Virtual Memory',
        definition: 'A memory management technique that provides an idealized abstraction of storage resources.',
        category: 'Memory Management',
        masteryLevel: 'competent',
        score: 70,
        lastAssessedAt: new Date().toISOString(),
        relatedMaterialIds: [material.id],
      },
    ];

    const chunks: DocumentChunk[] = [
      {
        id: 'chunk-1',
        materialId: material.id,
        projectId,
        chunkIndex: 0,
        content:
          'A deadlock occurs when four conditions hold simultaneously: mutual exclusion, hold and wait, no preemption, and circular wait. The Banker\'s Algorithm can be used to avoid deadlocks by only granting requests that leave the system in a safe state.',
        tokenCount: 40,
        conceptsMentioned: ['Deadlocks'],
      },
      {
        id: 'chunk-2',
        materialId: material.id,
        projectId,
        chunkIndex: 1,
        content:
          'Virtual memory allows a process to execute without requiring its entire address space to be resident in physical memory, using techniques such as paging and segmentation.',
        tokenCount: 30,
        conceptsMentioned: ['Virtual Memory'],
      },
    ];

    appStorage.update('materials', (prev) => [...prev, material]);
    appStorage.update('concepts', (prev) => [...prev, ...concepts]);
    appStorage.update('documentChunks', (prev) => [...prev, ...chunks]);

    const questions = await quizService.getQuizQuestions(projectId);

    expect(questions.length).toBeGreaterThanOrEqual(3);
    // Every question must reference one of the real extracted concepts -- never a generic/unrelated topic.
    const validConceptNames = new Set(concepts.map((c) => c.name));
    questions.forEach((q) => {
      expect(validConceptNames.has(q.conceptName)).toBe(true);
      expect(q.options.length).toBeGreaterThanOrEqual(2);
      expect(q.options.some((o) => o.id === q.correctOptionId)).toBe(true);
    });
    // At least one question should be grounded in the actual PDF excerpt text (not generic trivia).
    const hasGroundedContent = questions.some(
      (q) => q.question.toLowerCase().includes('deadlock') || q.explanation.toLowerCase().includes('deadlock')
    );
    expect(hasGroundedContent).toBe(true);
  });

  it('computes real per-topic accuracy and identifies weak areas strictly from submitted answers', async () => {
    const material: Material = {
      id: 'mat-os-2',
      projectId,
      title: 'OS Notes.pdf',
      fileName: 'OS Notes.pdf',
      fileSize: 102400,
      fileType: 'application/pdf',
      stage: 'ready',
      progress: 100,
      extractedConceptsCount: 2,
      chunkCount: 2,
      uploadedAt: new Date().toISOString(),
    };
    const concepts: Concept[] = [
      {
        id: 'c-deadlock',
        projectId,
        name: 'Deadlocks',
        definition: 'A state where processes are blocked waiting on each other\'s resources.',
        category: 'Process Management',
        masteryLevel: 'novice',
        score: 30,
        lastAssessedAt: new Date().toISOString(),
        relatedMaterialIds: [material.id],
      },
      {
        id: 'c-vm',
        projectId,
        name: 'Virtual Memory',
        definition: 'Abstraction that decouples logical and physical memory via paging.',
        category: 'Memory Management',
        masteryLevel: 'proficient',
        score: 85,
        lastAssessedAt: new Date().toISOString(),
        relatedMaterialIds: [material.id],
      },
    ];
    const chunks: DocumentChunk[] = [
      {
        id: 'chunk-1',
        materialId: material.id,
        projectId,
        chunkIndex: 0,
        content: 'Deadlock prevention, avoidance, and detection strategies including the Banker\'s Algorithm.',
        tokenCount: 20,
        conceptsMentioned: ['Deadlocks'],
      },
      {
        id: 'chunk-2',
        materialId: material.id,
        projectId,
        chunkIndex: 1,
        content: 'Paging divides virtual address space into fixed-size pages mapped to physical frames.',
        tokenCount: 20,
        conceptsMentioned: ['Virtual Memory'],
      },
    ];

    appStorage.update('materials', (prev) => [...prev, material]);
    appStorage.update('concepts', (prev) => [...prev, ...concepts]);
    appStorage.update('documentChunks', (prev) => [...prev, ...chunks]);

    const questions = await quizService.getQuizQuestions(projectId);
    const deadlockQuestions = questions.filter((q) => q.conceptName === 'Deadlocks');
    const vmQuestions = questions.filter((q) => q.conceptName === 'Virtual Memory');
    expect(deadlockQuestions.length).toBeGreaterThan(0);
    expect(vmQuestions.length).toBeGreaterThan(0);

    // Deliberately get every Deadlocks question WRONG and every Virtual Memory question RIGHT.
    const attempts = [
      ...deadlockQuestions.map((q) => ({
        questionId: q.id,
        selectedOptionId: q.options.find((o) => o.id !== q.correctOptionId)?.id || q.options[0].id,
      })),
      ...vmQuestions.map((q) => ({ questionId: q.id, selectedOptionId: q.correctOptionId })),
    ];

    const result = await quizService.submitQuiz(projectId, attempts);

    expect(result.totalQuestions).toBe(attempts.length);
    expect(result.correctCount).toBe(vmQuestions.length);

    const deadlockPerf = result.topicPerformance?.find((t) => t.conceptName === 'Deadlocks');
    const vmPerf = result.topicPerformance?.find((t) => t.conceptName === 'Virtual Memory');

    expect(deadlockPerf?.accuracy).toBe(0);
    expect(deadlockPerf?.classification).toBe('weak');
    expect(vmPerf?.accuracy).toBe(100);
    expect(vmPerf?.classification).toBe('strong');

    // Weak areas must be derived from the answers, not hardcoded.
    expect(result.weakAreas).toContain('Deadlocks');
    expect(result.weakAreas).not.toContain('Virtual Memory');

    // The AI/data-derived recommendation must point at the topic that was actually weak.
    expect(result.aiRecommendation?.weakestTopic).toBe('Deadlocks');
    expect(result.aiRecommendation?.recommendations.join(' ')).toMatch(/deadlock/i);
  });
});
