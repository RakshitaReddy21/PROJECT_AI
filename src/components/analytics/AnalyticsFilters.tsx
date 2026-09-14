import React from 'react';

export interface AnalyticsFiltersProps {
  selectedPeriod: string;
  onPeriodChange: (period: string) => void;
}

export const AnalyticsFilters: React.FC<AnalyticsFiltersProps> = ({
  selectedPeriod,
  onPeriodChange,
}) => {
  const periods = [
    { key: '7d', label: '7 Days' },
    { key: '30d', label: '30 Days' },
    { key: '90d', label: '90 Days' },
    { key: 'all', label: 'All Time' },
  ];

  return (
    <div className="inline-flex p-1 bg-[#FFF8F5] border border-[#F1E8E3] rounded-lg text-xs font-mono">
      {periods.map((p) => (
        <button
          key={p.key}
          onClick={() => onPeriodChange(p.key)}
          className={`px-3 py-1.5 rounded-md transition-colors ${
            selectedPeriod === p.key
              ? 'bg-white text-[#292524] font-semibold shadow-sm border border-[#F1E8E3]'
              : 'text-[#78716C] hover:text-[#292524]'
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
};
