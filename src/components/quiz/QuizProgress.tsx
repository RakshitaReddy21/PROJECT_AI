import React from 'react';
import { ProgressBar } from '../ui/ProgressBar';

export interface QuizProgressProps {
  current: number;
  total: number;
}

export const QuizProgress: React.FC<QuizProgressProps> = ({ current, total }) => {
  const percentage = Math.round(((current + 1) / total) * 100);

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center text-xs font-mono text-ink-faint">
        <span>
          Question <strong className="text-ink">{current + 1}</strong> of {total}
        </span>
        <span>{percentage}% Complete</span>
      </div>
      <ProgressBar value={percentage} size="sm" variant="indigo" />
    </div>
  );
};
