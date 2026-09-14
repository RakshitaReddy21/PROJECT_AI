import { describe, it, expect, beforeEach } from 'vitest';
import { appStorage } from '../services/storage/localStorageStore';
import { quizService } from '../services/quiz.service';
import { masteryService } from '../services/mastery.service';
import { growthService } from '../services/growth.service';
import { recommendationService } from '../services/recommendation.service';
import { activityService } from '../services/activity.service';

describe('End-to-End Connected Learning Loop', () => {
  beforeEach(() => {
    appStorage.resetToSeed();
  });

  it('cascades quiz answers to concept mastery, growth, recommendations, and activity', async () => {
    const projectId = 'proj-1';

    // 1. Submit quiz attempts:
    // q-2 (Cross-Encoder): select opt-tf-2 (Correct)
    // q-1 (RRF): select opt-a (Incorrect, correct is opt-b)
    const attempts = [
      { questionId: 'q-2', selectedOptionId: 'opt-tf-2' }, // Correct
      { questionId: 'q-1', selectedOptionId: 'opt-a' },    // Incorrect
    ];

    const result = await quizService.submitQuiz(projectId, attempts);

    // Verify Quiz result
    expect(result.totalQuestions).toBe(2);
    expect(result.correctCount).toBe(1);
    expect(result.score).toBe(50);

    // 2. Verify Concept Mastery changed
    const updatedConcepts = await masteryService.getConcepts(projectId);
    const crossEncoderConcept = updatedConcepts.find((c) => c.name.includes('Cross-Encoder'));
    const rrfConcept = updatedConcepts.find((c) => c.name.includes('Reciprocal Rank Fusion'));

    expect(crossEncoderConcept).toBeDefined();
    expect(rrfConcept).toBeDefined();
    expect(crossEncoderConcept!.score).toBeGreaterThanOrEqual(75);
    expect(rrfConcept!.score).toBeLessThanOrEqual(64);
    expect(rrfConcept!.isWeakness).toBe(true);
    expect(rrfConcept!.trend).toBe('down');

    // 3. Verify Learning Context retained the mistake
    const context = appStorage.get('learningContexts')[projectId];
    expect(context).toBeDefined();
    expect(context.recentMistakes.length).toBeGreaterThan(0);
    expect(context.recentMistakes[0].conceptName).toContain('Reciprocal Rank Fusion');

    // 4. Verify Recommendations dynamically updated to address the weak concept
    const recommendations = await recommendationService.getRecommendations();
    expect(recommendations.length).toBeGreaterThan(0);
    const topRec = recommendations[0];
    expect(topRec.projectId).toBe(projectId);
    expect(topRec.title).toContain('Reciprocal Rank Fusion');
    expect(topRec.actionUrl).toBeDefined();

    // 5. Verify Growth Narrative updated to reflect the retention gap
    const updatedGrowth = await growthService.getGrowthInsight(projectId);
    expect(updatedGrowth.narrative).toContain('Reciprocal Rank Fusion');
    expect(updatedGrowth.weakestConcepts.some((c) => c.name.includes('Reciprocal Rank Fusion'))).toBe(true);

    // 6. Verify Activity Event was logged
    const activities = await activityService.getActivities(projectId);
    const quizActivity = activities.find((a) => a.type === 'quiz_completed');
    expect(quizActivity).toBeDefined();
    expect(quizActivity!.description).toContain('50%');
  });
});
