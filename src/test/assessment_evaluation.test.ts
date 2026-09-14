import { describe, it, expect, beforeEach } from 'vitest';
import { appStorage } from '../services/storage/localStorageStore';
import { assessmentService } from '../services/assessment.service';
import { activityService } from '../services/activity.service';

describe('Open-Ended Assessment & 5-Dimension Rubric Scoring', () => {
  beforeEach(() => {
    appStorage.resetToSeed();
  });

  it('evaluates student response across 5 rubric dimensions and updates mastery', async () => {
    const projectId = 'proj-1';
    const prompt = 'Analyze trade-offs between single-stage dense search and two-stage reranked pipelines.';
    const responseText =
      'Single-stage dense retrieval uses precomputed vector embeddings with approximate nearest neighbors (HNSW) to achieve low 15ms latency. However, it suffers from projection bias. A two-stage pipeline adds a Cross-Encoder reranker which performs joint full attention over query and candidates, boosting recall and NDCG significantly at the cost of higher 150ms latency.';

    const submission = await assessmentService.submitAssessment(projectId, prompt, responseText);

    expect(submission.id).toBeDefined();
    expect(submission.projectId).toBe(projectId);
    expect(submission.score).toBeGreaterThanOrEqual(80);
    expect(submission.rubricScores.length).toBe(5);

    // Verify each criterion is present
    const criteria = submission.rubricScores.map((r) => r.criterion);
    expect(criteria).toContain('Conceptual Depth & Understanding');
    expect(criteria).toContain('Accuracy & Technical Terminology');
    expect(criteria).toContain('Relevance & Prompt Alignment');
    expect(criteria).toContain('Concept Coverage & Scope');
    expect(criteria).toContain('Reasoning & Trade-off Clarity');

    // Verify strengths and growth tips
    expect(submission.overallFeedback).toBeDefined();
    expect(submission.growthTips.length).toBeGreaterThan(0);

    // Verify activity was logged
    const activities = await activityService.getActivities(projectId);
    const assessActivity = activities.find((a) => a.type === 'assessment_submitted');
    expect(assessActivity).toBeDefined();

    // Verify stored submission can be retrieved
    const stored = await assessmentService.getAssessment(projectId);
    expect(stored).toBeDefined();
    expect(stored!.score).toBe(submission.score);
  });
});
