import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { Brain } from 'lucide-react';

export interface MasteryChartProps {
  data?: { date: string; mastery: number }[];
}

export const MasteryChart: React.FC<MasteryChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-56 text-center text-ink-faint font-mono text-xs p-6 border border-dashed border-line/80 rounded-xl">
        <Brain className="w-8 h-8 mb-2 text-ink-faint/50" />
        <p className="font-semibold text-ink">No learning history yet</p>
        <p className="text-ink-soft text-[11px] mt-1 max-w-xs font-sans">
          Complete practice quizzes and tutor sessions to record your historical mastery progression.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-56">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="masteryGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#F29B73" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#F29B73" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1E8E3" vertical={false} />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#78716C' }} stroke="#F1E8E3" />
          <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#78716C' }} stroke="#F1E8E3" />
          <Tooltip
            contentStyle={{
              backgroundColor: '#FFFFFF',
              borderColor: '#F8C9B0',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#292524',
              boxShadow: '0 4px 16px rgba(242,155,115,0.12)',
            }}
            formatter={(value: number) => [`${value}% Mastery`, 'Score']}
          />
          <Area
            type="monotone"
            dataKey="mastery"
            stroke="#F29B73"
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#masteryGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
