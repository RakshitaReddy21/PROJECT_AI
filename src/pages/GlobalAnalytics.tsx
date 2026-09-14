import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { MetricCard } from '../components/analytics/MetricCard';
import { MasteryChart } from '../components/learning/MasteryChart';
import { Brain, BookOpen, CheckCircle, Sparkles } from 'lucide-react';
import { fetchGlobalAnalyticsApi } from '../api/analytics';

export const GlobalAnalytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchGlobalAnalyticsApi();
        setAnalytics(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="pb-4 border-b border-line">
        <h1 className="font-display text-2xl md:text-3xl font-semibold text-ink">
          Global Learning Analytics
        </h1>
        <p className="text-xs text-ink-faint mt-1">
          Aggregated performance metrics across all active study spaces and projects.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Average Mastery"
          value={analytics ? `${analytics.averageMastery}%` : '0%'}
          change={analytics?.masteryGain ? `+${analytics.masteryGain}%` : '0%'}
          icon={Brain}
        />
        <MetricCard
          title="Total Projects"
          value={analytics ? `${analytics.totalProjects}` : '0'}
          change={analytics ? `${analytics.totalSpaces} spaces` : '0 spaces'}
          icon={BookOpen}
        />
        <MetricCard
          title="Quizzes Passed"
          value={analytics ? `${analytics.quizzesPassed}` : '0'}
          change={analytics ? `${analytics.totalQuestionsAnswered} questions` : '0 questions'}
          icon={CheckCircle}
        />
        <MetricCard
          title="Concepts Mastered"
          value={analytics ? `${analytics.conceptsMastered}` : '0'}
          change={analytics ? `${analytics.totalConcepts} total` : '0 total'}
          icon={Sparkles}
        />
      </div>

      <Card className="p-6 space-y-4">
        <h3 className="font-sans text-sm font-semibold text-ink uppercase tracking-wider font-mono">
          Cross-Domain Mastery Evolution
        </h3>
        <MasteryChart />
      </Card>
    </div>
  );
};
