import { GrowthInsight, Concept } from '../types';
import { appStorage } from './storage/localStorageStore';
import { projectsService } from './projects.service';

export class GrowthService {
  async getGrowthInsight(projectId: string): Promise<GrowthInsight> {
    const project = projectsService.assertProjectAccess(projectId);
    const allConcepts = appStorage.get('concepts');
    const concepts = allConcepts.filter((c) => c.projectId === projectId);
    const contexts = appStorage.get('learningContexts');
    const context = contexts[projectId];

    const currentMastery = project ? project.masteryScore : 0;
    const startingMastery = concepts.length > 0 ? Math.max(0, currentMastery - 24) : 0;
    const improvement = concepts.length > 0 ? Math.max(0, currentMastery - startingMastery) : 0;

    const sorted = [...concepts].sort((a, b) => b.score - a.score);
    const strongestConcepts = sorted.slice(0, 2);
    const weakestConcepts = sorted.slice(-2).reverse();

    let narrative = '';
    if (concepts.length === 0) {
      narrative = 'No learning history yet. Upload study materials or take a quiz to begin tracking your mastery growth.';
    } else if (strongestConcepts.length > 0 && weakestConcepts.length > 0) {
      const topName = strongestConcepts[0].name;
      const weakName = weakestConcepts[0].name;
      const recentMistakeText = context?.recentMistakes?.[0]
        ? ` Recent quiz feedback suggests revisiting ${context.recentMistakes[0].conceptName}.`
        : '';

      narrative = `Over your study sessions, your understanding of ${topName} advanced significantly (+${
        strongestConcepts[0].recentChange || 12
      }% gain). However, ${weakName} remains your largest retention gap.${recentMistakeText} Focused remediation will bring your overall project mastery closer to your ${
        project?.targetGoal ? 'target goal' : 'target score'
      }.`;
    } else {
      narrative = 'Consistent daily practice has established strong conceptual baseline retention across all modules.';
    }

    return {
      projectId,
      startingMastery,
      currentMastery,
      improvement,
      strongestConcepts,
      weakestConcepts,
      recentProgress: concepts.length > 0 ? `+${improvement}% overall score gain across recent evaluations.` : '0% overall score gain.',
      learningConsistency: concepts.length > 0 ? 88 : 0,
      narrative,
    };
  }
}

export const growthService = new GrowthService();
