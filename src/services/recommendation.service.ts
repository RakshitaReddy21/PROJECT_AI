import { Recommendation } from '../types';
import { appStorage } from './storage/localStorageStore';
import { calculateStreak } from '../utils/date';
import { RECOMMENDATION_V1 } from '../prompts';
import { authService } from './auth.service';

export class RecommendationService {
  async getRecommendations(): Promise<Recommendation[]> {
    return this.refreshRecommendations();
  }

  async refreshRecommendations(): Promise<Recommendation[]> {
    const currentUser = authService.getCurrentUser();
    const allProjects = appStorage.get('projects');
    const projects = currentUser?.role === 'admin'
      ? allProjects
      : (currentUser?.id ? allProjects.filter((p) => p.userId === currentUser.id) : []);

    const concepts = appStorage.get('concepts');
    const contexts = appStorage.get('learningContexts');
    const newRecommendations: Recommendation[] = [];

    for (const proj of projects) {
      const projConcepts = concepts.filter((c) => c.projectId === proj.id);
      const weakConcepts = projConcepts.filter((c) => c.isWeakness || c.score < 65);
      const context = contexts[proj.id];

      // 1. High Priority: Address Weakest Concept
      if (weakConcepts.length > 0) {
        const weakest = weakConcepts.sort((a, b) => a.score - b.score)[0];
        newRecommendations.push({
          id: `rec-weak-${proj.id}-${Date.now()}`,
          projectId: proj.id,
          projectTitle: proj.title,
          type: 'review_concept',
          title: `Reinforce ${weakest.name} (${weakest.score}% Mastery)`,
          reason: weakest.changeReason || `Mastery is currently at ${weakest.score}%, below the 65% target threshold.`,
          evidence: `Last assessed on ${new Date(weakest.lastAssessedAt).toLocaleDateString()}. Trend: ${weakest.trend || 'neutral'}.`,
          actionUrl: `/projects/${proj.id}/tutor`,
          priority: 'high',
        });

        newRecommendations.push({
          id: `rec-quiz-${proj.id}-${Date.now()}`,
          projectId: proj.id,
          projectTitle: proj.title,
          type: 'take_quiz',
          title: `Take Adaptive Quiz: ${weakest.name}`,
          reason: 'A short adaptive checkpoint will reinforce retention and recalibrate concept mastery.',
          evidence: `Tested concept: ${weakest.name}. Target score: >80%.`,
          actionUrl: `/projects/${proj.id}/quiz`,
          priority: 'medium',
        });
      }

      // 2. High Priority: Practice after recent mistakes
      if (context && context.recentMistakes && context.recentMistakes.length > 0) {
        const latestMistake = context.recentMistakes[0];
        newRecommendations.push({
          id: `rec-mistake-${proj.id}-${Date.now()}`,
          projectId: proj.id,
          projectTitle: proj.title,
          type: 'review_concept',
          title: `Clarify Misconception: ${latestMistake.conceptName}`,
          reason: `You recently chose "${latestMistake.selectedOption}" instead of the correct answer on this topic.`,
          evidence: latestMistake.explanation,
          actionUrl: `/projects/${proj.id}/tutor`,
          priority: 'high',
        });
      }

      // 3. Complete open-ended assessment if mastery is strong but unverified
      const strongConcepts = projConcepts.filter((c) => c.score >= 80);
      if (strongConcepts.length >= 2) {
        newRecommendations.push({
          id: `rec-assess-${proj.id}-${Date.now()}`,
          projectId: proj.id,
          projectTitle: proj.title,
          type: 'complete_assessment',
          title: `Synthesize Knowledge in ${proj.title}`,
          reason: 'You have demonstrated solid multiple-choice accuracy. Cement deep understanding with an open-ended synthesis.',
          evidence: `${strongConcepts.length} concepts currently at proficient/master level.`,
          actionUrl: `/projects/${proj.id}/assessment`,
          priority: 'medium',
        });
      }
    }

    if (newRecommendations.length === 0) {
      if (projects.length > 0) {
        const activeProj = projects[0];
        const allActivities = appStorage.get('activities');
        const userActivities = currentUser?.role === 'admin'
          ? allActivities
          : (currentUser?.id ? allActivities.filter((a) => a.userId === currentUser.id) : []);
        const streak = calculateStreak(userActivities);

        newRecommendations.push({
          id: `rec-default-${activeProj.id}`,
          projectId: activeProj.id,
          projectTitle: activeProj.title,
          type: 'take_quiz',
          title: `Complete Review Quiz for ${activeProj.title}`,
          reason: 'Maintain your learning momentum and keep concept embeddings fresh in working memory.',
          evidence: streak > 0 ? `Active learning streak: ${streak} day${streak === 1 ? '' : 's'}.` : 'Start your daily study session today.',
          actionUrl: `/projects/${activeProj.id}/quiz`,
          priority: 'medium',
        });
      } else {
        newRecommendations.push({
          id: 'rec-onboarding-1',
          projectId: '',
          projectTitle: 'Getting Started',
          type: 'upload_material',
          title: 'Create Your First Learning Project',
          reason: 'Organize your study goals by creating a subject space and uploading reference materials.',
          evidence: 'No active projects detected in your learning workspace.',
          actionUrl: '/spaces',
          priority: 'high',
        });
      }
    }

    // Persist refreshed recommendations
    appStorage.set('recommendations', newRecommendations);
    return newRecommendations;
  }
}

export const recommendationService = new RecommendationService();
