import { TutorMessage } from '../types';
import { appStorage } from './storage/localStorageStore';
import { ragService } from './rag.service';
import { activityService } from './activity.service';
import { authService } from './auth.service';
import { projectsService } from './projects.service';

export class TutorService {
  async getTutorMessages(projectId: string): Promise<TutorMessage[]> {
    projectsService.assertProjectAccess(projectId);
    const all = appStorage.get('tutorMessages');
    return all[projectId] || [];
  }

  async sendTutorMessage(
    projectId: string,
    userText: string,
    actionType?: string
  ): Promise<TutorMessage> {
    const project = projectsService.assertProjectAccess(projectId);

    // 1. Add user message
    const userMsg: TutorMessage = {
      id: `msg-${Date.now()}-user`,
      projectId,
      sender: 'user',
      text: userText,
      isGrounded: true,
      citations: [],
      isUnsupported: false,
      timestamp: new Date().toISOString(),
    };

    appStorage.update('tutorMessages', (prev) => {
      const existing = prev[projectId] || [];
      return {
        ...prev,
        [projectId]: [...existing, userMsg],
      };
    });

    // 2. Query grounded RAG engine
    const ragResult = await ragService.retrieveAndGenerate(projectId, userText, actionType);

    // 3. Add tutor response with citations
    const tutorMsg: TutorMessage = {
      id: `msg-${Date.now()}-tutor`,
      projectId,
      sender: 'tutor',
      text: ragResult.text,
      isGrounded: ragResult.isGrounded,
      citations: ragResult.citations,
      isUnsupported: ragResult.isUnsupported,
      suggestedFollowups: ragResult.suggestedFollowups,
      timestamp: new Date().toISOString(),
    };

    appStorage.update('tutorMessages', (prev) => {
      const existing = prev[projectId] || [];
      return {
        ...prev,
        [projectId]: [...existing, tutorMsg],
      };
    });

    const currentUser = authService.getCurrentUser();
    const activeUserId = currentUser?.id || project.userId;
    if (activeUserId) {
      await activityService.logActivity({
        userId: activeUserId,
        userName: currentUser?.name || 'Learner',
        projectId,
        projectTitle: project.title,
        type: 'tutor_queried',
        description: `Queried AI Tutor: "${userText.slice(0, 45)}..." (${ragResult.isGrounded ? 'Grounded' : 'Unsupported'})`,
      });
    }

    return tutorMsg;
  }
}

export const tutorService = new TutorService();
