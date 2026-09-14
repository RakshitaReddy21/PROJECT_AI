import React from 'react';
import { AIUsageMetrics } from '../../types';

export interface AIUsageTableProps {
  metrics: AIUsageMetrics[];
}

export const AIUsageTable: React.FC<AIUsageTableProps> = ({ metrics }) => {
  return (
    <div className="w-full overflow-x-auto border border-[#F1E8E3] rounded-lg bg-white shadow-sm">
      <table className="w-full text-left text-xs text-[#292524]">
        <thead className="bg-[#FFF8F5] text-[#78716C] font-mono uppercase text-[10px] border-b border-[#F1E8E3]">
          <tr>
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3">LLM Model</th>
            <th className="px-4 py-3">Prompt Tokens</th>
            <th className="px-4 py-3">Completion Tokens</th>
            <th className="px-4 py-3">Avg Latency</th>
            <th className="px-4 py-3 text-right">Cost (USD)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#F1E8E3] font-mono">
          {metrics.length > 0 ? (
            metrics.map((m) => (
              <tr key={m.id} className="hover:bg-[#FFF0E8]/40 transition-colors">
                <td className="px-4 py-3 font-semibold text-[#292524]">{m.date}</td>
                <td className="px-4 py-3 text-[#E9825B] font-semibold">{m.model}</td>
                <td className="px-4 py-3 text-[#78716C]">{m.totalPromptTokens.toLocaleString()}</td>
                <td className="px-4 py-3 text-[#78716C]">{m.totalCompletionTokens.toLocaleString()}</td>
                <td className="px-4 py-3 text-[#78716C]">{m.averageLatencyMs} ms</td>
                <td className="px-4 py-3 text-right text-[#137333] font-semibold">
                  ${m.totalCostUSD.toFixed(2)}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-[#78716C] font-sans">
                <p className="font-semibold text-xs text-[#292524]">No AI token usage recorded yet</p>
                <p className="text-[11px] text-[#78716C] mt-1 font-mono">
                  Token consumption, model latency, and cost estimates are automatically recorded in real time when users query the AI Tutor or generate quizzes.
                </p>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};
