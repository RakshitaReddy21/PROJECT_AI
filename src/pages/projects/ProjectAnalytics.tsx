import React, { useState, useEffect } from 'react';
import { useProject } from '../../context/ProjectContext';
import { Card } from '../../components/ui/Card';
import { MetricCard } from '../../components/analytics/MetricCard';
import { MasteryChart } from '../../components/learning/MasteryChart';
import { MessageSquare, CheckCircle, FileText, Brain } from 'lucide-react';
import { fetchProjectAnalyticsApi } from '../../api/analytics';

export const ProjectAnalytics: React.FC = () => {
  const { project, materials, concepts } = useProject();
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    const currentProjectId = project?.id;
    if (!currentProjectId) return;
    const load = async (id: string) => {
      try {
        const data = await fetchProjectAnalyticsApi(id);
        setAnalytics(data);
      } catch (err) {
        console.error(err);
      }
    };
    load(currentProjectId);
  }, [project?.id]);

  if (!project) return null;

  const quizAccuracy = analytics?.averageQuizScore ?? 0;
  const quizAttempts = analytics?.questionsAttempted ?? 0;
  const tutorQueries = analytics?.tutorQueriesCount ?? 0;
  const masteryGain = analytics?.masteryGain ?? 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="font-sans text-xl font-semibold text-ink">Project Learning Analytics</h2>
        <p className="text-xs text-ink-faint mt-0.5">
          Quantitative metrics on quiz accuracy, tutor query volume, and study consistency.
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Mastery Score"
          value={`${project.masteryScore}%`}
          change={masteryGain > 0 ? `+${masteryGain}%` : `${masteryGain}%`}
          subtitle="Target: 100%"
          icon={Brain}
        />
        <MetricCard
          title="Quiz Accuracy"
          value={`${quizAccuracy}%`}
          change={quizAttempts > 0 ? `${quizAttempts} answers` : 'No attempts'}
          subtitle={`${quizAttempts} questions attempted`}
          icon={CheckCircle}
        />
        <MetricCard
          title="Tutor Sessions"
          value={tutorQueries}
          change={tutorQueries > 0 ? `${tutorQueries} queries` : '0 queries'}
          subtitle="Grounded queries asked"
          icon={MessageSquare}
        />
        <MetricCard
          title="Ingested Materials"
          value={materials.length}
          subtitle={`${concepts.length} concepts extracted`}
          icon={FileText}
        />
      </div>

      {/* Chart */}
      <Card className="p-6 space-y-4">
        <h3 className="font-sans text-sm font-semibold text-ink uppercase tracking-wider font-mono">
          Mastery Trend
        </h3>
        <MasteryChart />
      </Card>
    </div>
  );
};
