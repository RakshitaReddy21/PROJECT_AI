import React from 'react';
import { Badge } from '../ui/Badge';
import { TrendingUp, TrendingDown } from 'lucide-react';

export interface ConceptPerformanceProps {
  performance: {
    conceptId: string;
    conceptName: string;
    score: number;
    delta: number;
  }[];
}

export const ConceptPerformance: React.FC<ConceptPerformanceProps> = ({ performance }) => {
  return (
    <div className="space-y-2">
      <h5 className="text-xs font-semibold uppercase font-mono text-ink-faint">
        Concept Mastery Delta
      </h5>
      <div className="space-y-2">
        {performance.map((item) => {
          const isPositive = item.delta >= 0;
          return (
            <div
              key={item.conceptId}
              className="flex items-center justify-between p-3 bg-paper-raised border border-line rounded-lg text-xs"
            >
              <span className="font-semibold text-ink">{item.conceptName}</span>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-ink-faint">Score: {item.score}%</span>
                <Badge variant={isPositive ? 'signal' : 'rust'} size="sm" className="gap-1">
                  {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {isPositive ? `+${item.delta}%` : `${item.delta}%`}
                </Badge>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
