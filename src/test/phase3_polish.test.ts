import { describe, it, expect, beforeEach } from 'vitest';
import { appStorage } from '../services/storage/localStorageStore';
import { projectsService } from '../services/projects.service';
import { masteryService } from '../services/mastery.service';
import { ragService } from '../services/rag.service';
import { recommendationService } from '../services/recommendation.service';

describe('Phase 3 Production Polish & Consistency Verification', () => {
  beforeEach(() => {
    appStorage.resetToSeed();
  });

  it('verifies exact numerical and conceptual alignment for the hero demo project', async () => {
    const project = await projectsService.getProject('proj-1');
    expect(project).toBeDefined();
    expect(project!.spaceName).toBe('AI & Machine Learning');
    expect(project!.title).toBe('Retrieval-Augmented Generation (RAG)');
    expect(project!.targetGoal).toBe(
      'Understand how RAG systems retrieve relevant knowledge and generate grounded answers.'
    );
    expect(project!.masteryScore).toBe(76);

    const concepts = await masteryService.getConcepts('proj-1');
    expect(concepts.length).toBe(6);

    const avgScore = Math.round(concepts.reduce((sum, c) => sum + c.score, 0) / concepts.length);
    expect(avgScore).toBe(76);
  });

  it('guarantees strict project isolation in RAG retrieval', async () => {
    // proj-1 query for RAG architecture
    const proj1Result = await ragService.retrieveAndGenerate('proj-1', 'What is chunking and vector search?');
    expect(proj1Result.isUnsupported).toBe(false);
    expect(proj1Result.citations.length).toBeGreaterThan(0);
    // Every citation must belong to proj-1 materials
    for (const cit of proj1Result.citations) {
      expect(['mat-1', 'mat-2', 'mat-3', 'mat-4']).toContain(cit.materialId);
    }

    // proj-2 query: must only retrieve proj-2 materials or be isolated
    const proj2Result = await ragService.retrieveAndGenerate('proj-2', 'Tell me about scaled dot product attention');
    for (const cit of proj2Result.citations) {
      expect(['mat-t1']).toContain(cit.materialId);
    }
  });

  it('handles completely out-of-corpus queries with calm unsupported fallback', async () => {
    const outOfScopeResult = await ragService.retrieveAndGenerate('proj-1', 'How do I bake chocolate chip cookies with sea salt?');
    expect(outOfScopeResult.isUnsupported).toBe(true);
    expect(outOfScopeResult.citations.length).toBe(0);
    expect(outOfScopeResult.text).toContain("couldn't find enough direct evidence");
  });

  it('correctly categorizes concepts into status buckets', async () => {
    const concepts = await masteryService.getConcepts('proj-1');

    const strong = concepts.filter((c) => c.score >= 80);
    const improving = concepts.filter((c) => c.score >= 65 && c.score < 80);
    const stable = concepts.filter((c) => c.score >= 50 && c.score < 65);
    const needsAttention = concepts.filter((c) => c.score < 50);

    // Initial seed has scores: 92, 84, 64, 75, 70, 68
    expect(strong.length).toBe(2); // 92, 84
    expect(improving.length).toBe(3); // 75, 70, 68
    expect(stable.length).toBe(1); // 64
    expect(needsAttention.length).toBe(0);

    // Sum matches total
    expect(strong.length + improving.length + stable.length + needsAttention.length).toBe(concepts.length);
  });

  it('generates rich cognitive recommendation signals with valid routes', async () => {
    const recommendations = await recommendationService.getRecommendations();
    expect(recommendations.length).toBeGreaterThan(0);

    for (const rec of recommendations) {
      expect(rec.id).toBeDefined();
      expect(rec.title).toBeTruthy();
      expect(rec.reason).toBeTruthy();
      expect(rec.evidence).toBeTruthy();
      expect(rec.actionUrl).toMatch(/^\/projects\/[a-zA-Z0-9-]+\/(tutor|quiz|assessment|materials)/);
      expect(['high', 'medium', 'low']).toContain(rec.priority);
    }
  });
});
