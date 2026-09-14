import React, { useEffect, useState } from 'react';
import { fetchAIEvaluationApi } from '../../api/admin';
import { AIEvaluationMetrics } from '../../types';
import { EvaluationPanel } from '../../components/admin/EvaluationPanel';

export const AdminAIEvaluation: React.FC = () => {
  const [evalMetrics, setEvalMetrics] = useState<AIEvaluationMetrics | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await fetchAIEvaluationApi();
        setEvalMetrics(data);
      } catch (err) {
        console.error(err);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in text-gray-200">
      <div>
        <h1 className="text-xl font-bold text-white">AI Groundedness & Evaluation Metrics</h1>
        <p className="text-xs text-gray-400 font-mono mt-1">
          Quantitative benchmarking: Groundedness recall, hallucination detection rate, and recommendation CTR.
        </p>
      </div>

      {evalMetrics && <EvaluationPanel evaluation={evalMetrics} />}
    </div>
  );
};
