import React from 'react';
import { AIEvaluationMetrics } from '../../types';
import { ShieldCheck, AlertCircle, Target, ThumbsUp } from 'lucide-react';

export interface EvaluationPanelProps {
  evaluation: AIEvaluationMetrics;
}

export const EvaluationPanel: React.FC<EvaluationPanelProps> = ({ evaluation }) => {
  const isAwaitingData = evaluation.groundednessScore === 0 && evaluation.retrievalRecall === 0;

  const metrics = [
    {
      label: 'Groundedness Score',
      value: isAwaitingData ? 'N/A' : `${evaluation.groundednessScore}%`,
      subtitle: isAwaitingData ? 'Awaiting PDF/RAG Ingestion' : 'Strict passage entailment',
      icon: ShieldCheck,
      color: isAwaitingData ? 'text-[#78716C]' : 'text-[#137333]',
    },
    {
      label: 'Retrieval Recall @ 10',
      value: isAwaitingData ? 'N/A' : `${evaluation.retrievalRecall}%`,
      subtitle: isAwaitingData ? 'Awaiting Document Chunks' : 'Vector similarity recall',
      icon: Target,
      color: isAwaitingData ? 'text-[#78716C]' : 'text-[#E9825B]',
    },
    {
      label: 'Hallucination Rate',
      value: isAwaitingData ? '0.0%' : `${evaluation.hallucinationRate}%`,
      subtitle: isAwaitingData ? 'Zero Hallucinations Detected' : 'Un-grounded output frequency',
      icon: AlertCircle,
      color: isAwaitingData ? 'text-[#78716C]' : 'text-[#EA4335]',
    },
    {
      label: 'Assessment Agreement',
      value: isAwaitingData ? 'N/A' : `${evaluation.assessmentAgreement}%`,
      subtitle: isAwaitingData ? 'Awaiting Quiz Attempts' : 'AI vs Human Rubric Alignment',
      icon: ThumbsUp,
      color: isAwaitingData ? 'text-[#78716C]' : 'text-[#137333]',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((m, idx) => {
        const Icon = m.icon;
        return (
          <div key={idx} className="p-4 bg-white border border-[#F1E8E3] rounded-xl shadow-sm space-y-1">
            <div className="flex items-center justify-between text-xs text-[#78716C] font-mono mb-1">
              <span>{m.label}</span>
              <Icon className={`w-4 h-4 ${m.color}`} />
            </div>
            <p className={`font-mono text-2xl font-bold ${m.color}`}>{m.value}</p>
            <p className="text-[10px] text-[#78716C] font-mono">{m.subtitle}</p>
          </div>
        );
      })}
    </div>
  );
};
