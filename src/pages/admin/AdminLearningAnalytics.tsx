import React, { useEffect, useState } from 'react';
import { fetchGlobalAnalyticsApi, fetchActivitiesApi } from '../../api/analytics';
import { fetchUsersApi } from '../../api/admin';

export const AdminLearningAnalytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [userCount, setUserCount] = useState(0);
  const [tutorQueryCount, setTutorQueryCount] = useState(0);

  useEffect(() => {
    async function load() {
      try {
        const [gData, uData, aData] = await Promise.all([
          fetchGlobalAnalyticsApi(),
          fetchUsersApi(),
          fetchActivitiesApi(),
        ]);
        setAnalytics(gData);
        setUserCount(uData.length);
        const tutorCount = aData.filter((a) => a.type === 'tutor_queried').length;
        setTutorQueryCount(tutorCount);
      } catch (e) {
        console.error(e);
      }
    }
    load();
  }, []);

  const avgTutorQueries = userCount > 0 ? Math.round((tutorQueryCount / userCount) * 10) / 10 : 0;
  const accuracy = analytics?.averageMastery ?? 0;

  return (
    <div className="space-y-6 animate-fade-in text-[#292524]">
      <div>
        <h1 className="text-xl font-bold text-[#292524]">Platform Cohort & Learning Analytics</h1>
        <p className="text-xs text-[#78716C] font-mono mt-1">
          Aggregate mastery trends, retention cohorts, and feature utilization stats.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
        <div className="p-4 bg-white border border-[#F1E8E3] rounded-xl shadow-sm">
          <span className="text-xs text-[#78716C] uppercase">Active Platform Learners</span>
          <p className="text-2xl font-bold text-[#292524] mt-1">{userCount}</p>
        </div>
        <div className="p-4 bg-white border border-[#F1E8E3] rounded-xl shadow-sm">
          <span className="text-xs text-[#78716C] uppercase">Average Mastery Level</span>
          <p className="text-2xl font-bold text-[#137333] mt-1">{accuracy}%</p>
        </div>
        <div className="p-4 bg-white border border-[#F1E8E3] rounded-xl shadow-sm">
          <span className="text-xs text-[#78716C] uppercase">Avg Tutor Queries/User</span>
          <p className="text-2xl font-bold text-[#E9825B] mt-1">{avgTutorQueries}</p>
        </div>
      </div>
    </div>
  );
};
