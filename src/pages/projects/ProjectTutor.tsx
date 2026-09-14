import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useProject } from '../../context/ProjectContext';
import { fetchTutorMessagesApi, sendTutorMessageApi } from '../../api/tutor';
import { TutorMessage, Citation } from '../../types';
import { TutorChat } from '../../components/tutor/TutorChat';
import { ContextPanel } from '../../components/tutor/ContextPanel';

export const ProjectTutor: React.FC = () => {
  const { projectId, project, materials, concepts } = useProject();
  const [searchParams] = useSearchParams();
  const initialPrompt = searchParams.get('prompt') || undefined;
  const [messages, setMessages] = useState<TutorMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCitation, setSelectedCitation] = useState<Citation | null>(null);

  useEffect(() => {
    async function loadMessages() {
      try {
        const data = await fetchTutorMessagesApi(projectId);
        setMessages(data);
      } catch (err) {
        console.error(err);
      }
    }
    loadMessages();
  }, [projectId]);

  const handleSendMessage = async (text: string, actionType?: string) => {
    setIsLoading(true);
    try {
      await sendTutorMessageApi(projectId, text, actionType);
      const data = await fetchTutorMessagesApi(projectId);
      setMessages(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
      <div className="lg:col-span-2">
        <TutorChat
          messages={messages}
          onSendMessage={handleSendMessage}
          onCitationClick={(cit) => setSelectedCitation(cit)}
          isLoading={isLoading}
          initialPrompt={initialPrompt}
        />
      </div>

      <div className="space-y-4">
        <ContextPanel
          project={project}
          materials={materials}
          concepts={concepts}
          selectedCitation={selectedCitation}
          onClearCitation={() => setSelectedCitation(null)}
        />
      </div>
    </div>
  );
};
