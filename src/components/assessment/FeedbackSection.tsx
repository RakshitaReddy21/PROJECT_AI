import React from 'react';
import { AssessmentRubricScore } from '../../types';
import { Card } from '../ui/Card';
import { ProgressBar } from '../ui/ProgressBar';

export interface FeedbackSectionProps {
  rubricScores: AssessmentRubricScore[];
}

export const FeedbackSection: React.FC<FeedbackSectionProps> = ({ rubricScores }) => {
  return (
    <div className="space-y-3">
      <h4 className="text-xs font-semibold uppercase font-mono text-ink-faint">
        Rubric Dimension Breakdown
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {rubricScores.map((rubric, idx) => (
          <Card key={idx} className="p-4 space-y-2 bg-white border border-[#F1E8E3] shadow-sm">
            <div className="flex justify-between items-center text-xs font-semibold text-ink">
              <span className="truncate max-w-[140px]">{rubric.criterion}</span>
              <span className="font-mono text-signal-strong">{rubric.score}%</span>
            </div>
            <ProgressBar value={rubric.score} size="sm" variant="signal" />
            <p className="text-[11px] text-ink-soft leading-relaxed pt-1">
              {rubric.feedback}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
};
