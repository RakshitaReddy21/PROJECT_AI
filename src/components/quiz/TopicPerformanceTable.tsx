import React from 'react';
import { TopicPerformance } from '../../types';

export interface TopicPerformanceTableProps {
  performance: TopicPerformance[];
}

const CLASSIFICATION_META: Record<
  TopicPerformance['classification'],
  { label: string; dot: string; text: string }
> = {
  strong: { label: 'Strong', dot: 'bg-signal', text: 'text-signal-strong' },
  needs_improvement: { label: 'Needs Improvement', dot: 'bg-amber-500', text: 'text-amber-700' },
  weak: { label: 'Weak', dot: 'bg-rust', text: 'text-rust' },
};

export const TopicPerformanceTable: React.FC<TopicPerformanceTableProps> = ({ performance }) => {
  if (!performance || performance.length === 0) return null;

  return (
    <div className="space-y-2">
      <h5 className="text-xs font-semibold uppercase font-mono text-ink-faint">
        Topic-Wise Performance (this attempt)
      </h5>
      <div className="space-y-2">
        {performance.map((item) => {
          const meta = CLASSIFICATION_META[item.classification];
          return (
            <div
              key={item.conceptId || item.conceptName}
              className="flex items-center justify-between p-3 bg-paper-raised border border-line rounded-lg text-xs"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${meta.dot}`} aria-hidden />
                <span className="font-semibold text-ink truncate">{item.conceptName}</span>
              </div>
              <div className="flex items-center space-x-3 flex-shrink-0">
                <span className="font-mono text-ink-faint">
                  {item.correct}/{item.total} correct
                </span>
                <span className={`font-mono font-semibold ${meta.text}`}>{item.accuracy}%</span>
                <span
                  className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border ${meta.text}`}
                >
                  {meta.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
