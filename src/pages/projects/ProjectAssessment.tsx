import React, { useEffect, useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import { fetchAssessmentApi, submitAssessmentApi } from '../../api/assessment';
import { AssessmentSubmission } from '../../types';
import { AssessmentEditor } from '../../components/assessment/AssessmentEditor';
import { AssessmentResultView } from '../../components/assessment/AssessmentResultView';

export const ProjectAssessment: React.FC = () => {
  const { projectId, project, refreshProject, refreshConcepts } = useProject();
  const [submission, setSubmission] = useState<AssessmentSubmission | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const defaultPrompt = project
    ? (project.id === 'proj-1'
        ? 'Analyze the architectural trade-offs between a single-stage Dense Vector Search versus a Two-Stage (Dense + Cross-Encoder Reranker) pipeline for an enterprise search system.'
        : `Synthesize the core mechanisms, trade-offs, and practical implications of "${project.title}" to achieve your target goal: "${project.targetGoal}".`)
    : 'Synthesize the core mechanisms and trade-offs of this subject domain.';

  useEffect(() => {
    async function loadAssessment() {
      try {
        const data = await fetchAssessmentApi(projectId);
        setSubmission(data);
      } catch (err) {
        console.error(err);
      }
    }
    loadAssessment();
  }, [projectId]);

  const handleSubmit = async (responseText: string) => {
    setIsLoading(true);
    try {
      const result = await submitAssessmentApi(projectId, defaultPrompt, responseText);
      setSubmission(result);
      await refreshProject();
      await refreshConcepts();
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h2 className="font-sans text-xl font-semibold text-ink">
          Open-Ended Synthesizing Assessment
        </h2>
        <p className="text-xs text-ink-faint mt-1">
          Demonstrate deep conceptual mastery. AI will score your response against a multi-dimensional rubric.
        </p>
      </div>

      {submission ? (
        <AssessmentResultView submission={submission} onReset={() => setSubmission(null)} />
      ) : (
        <AssessmentEditor prompt={defaultPrompt} onSubmit={handleSubmit} isLoading={isLoading} />
      )}
    </div>
  );
};
