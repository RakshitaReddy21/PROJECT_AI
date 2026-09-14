import React from 'react';
import { Card } from '../ui/Card';
import { Sparkles, Brain, Zap } from 'lucide-react';

export interface QuizHeaderProps {
  adaptationRationale?: string;
  adaptiveState?: 'focus' | 'increased' | 'normal';
}

export const QuizHeader: React.FC<QuizHeaderProps> = ({
  adaptationRationale,
  adaptiveState = 'normal',
}) => {
  const defaultText =
    adaptiveState === 'focus'
      ? "We're focusing more on this concept to strengthen your understanding based on recent struggles."
      : adaptiveState === 'increased'
      ? 'Difficulty increased based on your recent high-accuracy performance.'
      : 'Next question selected adaptively based on your recent performance and concept retention gaps.';

  return (
    <Card className="p-4 bg-indigo-soft/30 border border-indigo/20 flex items-start gap-3 rounded-xl shadow-sm">
      <div className="p-2 bg-indigo text-white rounded-lg flex-shrink-0">
        <Sparkles className="w-4 h-4" />
      </div>
      <div>
        <div className="flex items-center space-x-2">
          <h4 className="text-xs font-semibold text-indigo-strong uppercase tracking-wider font-mono">
            Adaptive Engine Telemetry
          </h4>
          <span className="text-[10px] font-mono bg-indigo-soft text-indigo-strong px-2 py-0.5 rounded-full border border-indigo/20">
            Real-time Calibrated
          </span>
        </div>
        <p className="text-xs text-ink-soft mt-1 leading-relaxed">
          {adaptationRationale || defaultText}
        </p>
      </div>
    </Card>
  );
};
