import React, { useEffect, useState } from 'react';
import { fetchAIUsageApi } from '../../api/admin';
import { AIUsageMetrics } from '../../types';
import { AIUsageTable } from '../../components/admin/AIUsageTable';

export const AdminAIUsage: React.FC = () => {
  const [metrics, setMetrics] = useState<AIUsageMetrics[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await fetchAIUsageApi();
        setMetrics(data);
      } catch (err) {
        console.error(err);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in text-gray-200">
      <div>
        <h1 className="text-xl font-bold text-white">AI Token Usage & Cost Observability</h1>
        <p className="text-xs text-gray-400 font-mono mt-1">
          Detailed breakdown of prompt tokens, completion tokens, latency, and estimated cost per model.
        </p>
      </div>

      <AIUsageTable metrics={metrics} />
    </div>
  );
};
