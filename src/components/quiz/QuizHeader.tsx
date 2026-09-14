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
    <Card className="p-4 bg-[#FFEBE0]/90 border border-[#FFC8B0] flex items-start gap-3 rounded-xl shadow-sm">
      <div className="p-2 bg-gradient-to-r from-[#FF6B35] to-[#FF7A18] text-white rounded-lg flex-shrink-0 shadow-sm">
        <Sparkles className="w-4 h-4" />
      </div>
      <div>
        <div className="flex items-center space-x-2">
          <h4 className="text-xs font-bold text-[#C94518] uppercase tracking-wider font-mono">
            Adaptive Engine Telemetry
          </h4>
          <span className="text-[10px] font-mono bg-white text-[#E85A2A] px-2 py-0.5 rounded-full border border-[#FFC8B0] font-semibold">
            Real-time Calibrated
          </span>
        </div>
        <p className="text-xs text-[#574E4A] mt-1 leading-relaxed font-medium">
          {adaptationRationale || defaultText}
        </p>
      </div>
    </Card>
  );
};
