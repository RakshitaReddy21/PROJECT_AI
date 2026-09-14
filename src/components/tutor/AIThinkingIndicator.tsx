import React, { useState, useEffect } from 'react';
import { Sparkles, Brain, Search, Cpu, Loader2 } from 'lucide-react';

export const AIThinkingIndicator: React.FC = () => {
  const [phaseIndex, setPhaseIndex] = useState(0);

  const phases = [
    { label: 'Parsing prompt intent & key search terms...', icon: Search },
    { label: 'Querying vector database for top matching passages...', icon: Cpu },
    { label: 'Analyzing learner context & mastery state...', icon: Brain },
    { label: 'Synthesizing grounded explanation & citations...', icon: Sparkles },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setPhaseIndex((prev) => (prev + 1) % phases.length);
    }, 1200);
    return () => clearInterval(interval);
  }, [phases.length]);

  const CurrentIcon = phases[phaseIndex].icon;

  return (
    <div className="flex items-start my-4 animate-fade-in">
      <div className="max-w-md rounded-2xl p-4 bg-paper-raised border border-indigo/30 rounded-tl-none shadow-card flex items-center space-x-3.5">
        <div className="p-2 bg-indigo-soft text-indigo-strong rounded-xl flex-shrink-0">
          <CurrentIcon className="w-4 h-4" />
        </div>
        <div className="space-y-0.5">
          <div className="flex items-center space-x-2 text-[11px] font-mono font-semibold text-indigo-strong">
            <Loader2 className="w-3 h-3 animate-spin text-indigo" />
            <span>RAG Grounded Engine Processing</span>
            <span className="text-[9px] text-ink-faint bg-paper-sunken px-1.5 py-0.5 rounded border border-line">
              Step {phaseIndex + 1}/4
            </span>
          </div>
          <p className="text-xs text-ink-soft font-mono leading-relaxed">
            {phases[phaseIndex].label}
          </p>
        </div>
      </div>
    </div>
  );
};
