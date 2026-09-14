import { Concept, MasteryLevel } from '../types';
import { appStorage } from './storage/localStorageStore';
import { activityService } from './activity.service';
import { authService } from './auth.service';
import { projectsService } from './projects.service';

export class MasteryService {
  async getConcepts(projectId: string): Promise<Concept[]> {
    projectsService.assertProjectAccess(projectId);
    const concepts = appStorage.get('concepts');
    return concepts.filter((c) => c.projectId === projectId);
  }

  private calculateLevel(score: number): MasteryLevel {
    if (score >= 90) return 'master';
    if (score >= 80) return 'proficient';
    if (score >= 65) return 'competent';
    if (score >= 50) return 'developing';
    return 'novice';
  }

  async updateMasteryFromQuiz(
    projectId: string,
    results: { conceptId: string; conceptName: string; isCorrect: boolean }[]
  ): Promise<{ updatedConcepts: Concept[]; newProjectScore: number }> {
    projectsService.assertProjectAccess(projectId);
    const allConcepts = appStorage.get('concepts');
    const updatedConcepts: Concept[] = [];
    const changedConceptNames: string[] = [];

    const newConcepts = allConcepts.map((c) => {
      if (c.projectId !== projectId) return c;

      // Check if this concept was tested in the quiz
      const match = results.find(
        (r) => r.conceptId === c.id || r.conceptName.toLowerCase() === c.name.toLowerCase()
      );

      if (match) {
        const delta = match.isCorrect ? Math.floor(Math.random() * 3) + 6 : -(Math.floor(Math.random() * 3) + 5);
        const newScore = Math.max(0, Math.min(100, c.score + delta));
        const newLevel = this.calculateLevel(newScore);
        const trend = delta > 0 ? ('up' as const) : ('down' as const);

        const updated: Concept = {
          ...c,
          score: newScore,
          masteryLevel: newLevel,
          trend,
          recentChange: delta,
          isWeakness: newScore < 65,
          lastAssessedAt: new Date().toISOString(),
          changeReason: match.isCorrect
            ? `Answered correctly on adaptive quiz (+${delta}%).`
            : `Missed practice question on adaptive quiz (${delta}%).`,
        };

        updatedConcepts.push(updated);
        changedConceptNames.push(c.name);
        return updated;
      }
      return c;
    });

    appStorage.set('concepts', newConcepts);

    // Update Project overall mastery score as the average of its concepts
    const projectConcepts = newConcepts.filter((c) => c.projectId === projectId);
    const avgScore = projectConcepts.length > 0
      ? Math.round(projectConcepts.reduce((sum, c) => sum + c.score, 0) / projectConcepts.length)
      : 0;

    appStorage.update('projects', (projects) =>
      projects.map((p) =>
        p.id === projectId
          ? {
              ...p,
              masteryScore: avgScore,
              lastStudiedAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }
          : p
      )
    );

    // Update LearningGoal currentScore
    appStorage.update('learningGoals', (goals) => {
      const g = goals[projectId];
      if (g) {
        return {
          ...goals,
          [projectId]: {
            ...g,
            currentScore: avgScore,
            status: avgScore >= g.targetScore ? 'achieved' : 'in_progress',
            updatedAt: new Date().toISOString(),
          },
        };
      }
      return goals;
    });

    // Log Activity
    if (changedConceptNames.length > 0) {
      const currentUser = authService.getCurrentUser();
      const currentProj = appStorage.get('projects').find((p) => p.id === projectId);
      const activeUserId = currentUser?.id || currentProj?.userId;
      if (activeUserId) {
        await activityService.logActivity({
          userId: activeUserId,
          userName: currentUser?.name || 'Learner',
          projectId,
          projectTitle: currentProj?.title || 'Project',
          type: 'mastery_changed',
          description: `Concept mastery updated for ${changedConceptNames.slice(0, 2).join(', ')}. Project mastery at ${avgScore}%.`,
        });
      }
    }

    return { updatedConcepts, newProjectScore: avgScore };
  }

  async updateMasteryFromAssessment(
    projectId: string,
    overallScore: number,
    weaknesses: string[]
  ): Promise<number> {
    projectsService.assertProjectAccess(projectId);
    const allConcepts = appStorage.get('concepts');

    const newConcepts = allConcepts.map((c) => {
      if (c.projectId !== projectId) return c;

      const isMentionedWeak = weaknesses.some((w) =>
        w.toLowerCase().includes(c.name.toLowerCase()) || c.name.toLowerCase().includes(w.toLowerCase())
      );

      let delta = 0;
      if (isMentionedWeak) {
        delta = -4;
      } else if (overallScore >= 80) {
        delta = 4;
      }

      const newScore = Math.max(0, Math.min(100, c.score + delta));
      return {
        ...c,
        score: newScore,
        masteryLevel: this.calculateLevel(newScore),
        trend: delta >= 0 ? ('up' as const) : ('down' as const),
        recentChange: delta,
        isWeakness: newScore < 65,
        lastAssessedAt: new Date().toISOString(),
        changeReason: isMentionedWeak
          ? 'Weakness identified in open-ended assessment.'
          : 'Synthesizing assessment verified conceptual depth.',
      };
    });

    appStorage.set('concepts', newConcepts);

    const projectConcepts = newConcepts.filter((c) => c.projectId === projectId);
    const avgScore = Math.round(
      projectConcepts.reduce((sum, c) => sum + c.score, 0) / Math.max(1, projectConcepts.length)
    );

    appStorage.update('projects', (projects) =>
      projects.map((p) => (p.id === projectId ? { ...p, masteryScore: avgScore } : p))
    );

    return avgScore;
  }
}

export const masteryService = new MasteryService();
