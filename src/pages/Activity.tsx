import React, { useEffect, useState } from 'react';
import { ActivityItem } from '../types';
import { fetchActivitiesApi } from '../api/analytics';
import { Card } from '../components/ui/Card';
import { ActivityTimeline } from '../components/learning/ActivityTimeline';

export const Activity: React.FC = () => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    async function loadActivities() {
      try {
        const data = await fetchActivitiesApi();
        setActivities(data);
      } catch (err) {
        console.error(err);
      }
    }
    loadActivities();
  }, []);

  const filtered = filter === 'all' ? activities : activities.filter((a) => a.type === filter);

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-line">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-semibold text-ink">
            Activity Timeline Log
          </h1>
          <p className="text-xs text-ink-faint mt-1">
            Complete audit trail of uploads, tutor interactions, and quiz score submissions.
          </p>
        </div>

        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-3 py-1.5 text-xs font-mono bg-paper-sunken border border-line rounded-lg text-ink focus:outline-none"
        >
          <option value="all">All Activities</option>
          <option value="tutor_queried">Tutor Queries</option>
          <option value="material_uploaded">Material Ingestions</option>
          <option value="quiz_completed">Quiz Submissions</option>
          <option value="mastery_changed">Mastery Changes</option>
        </select>
      </div>

      <Card className="p-6">
        <ActivityTimeline activities={filtered} />
      </Card>
    </div>
  );
};
