import React from 'react';
import { Card } from '../ui/Card';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

export interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  change?: string;
  isPositive?: boolean;
  icon?: LucideIcon;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  change,
  isPositive = true,
  icon: Icon,
}) => {
  return (
    <Card className="p-5 bg-white border border-[#F1E8E3] shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono uppercase tracking-wider text-[#78716C]">{title}</span>
        {Icon && (
          <div className="p-2 bg-[#FFF0E8] text-[#E9825B] rounded-lg">
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="mt-2 flex items-baseline justify-between">
        <span className="font-display text-2xl font-semibold text-[#292524] tracking-tight">{value}</span>
        {change && (
          <span
            className={`text-xs font-mono font-medium flex items-center gap-0.5 ${
              isPositive ? 'text-[#E9825B]' : 'text-[#EA4335]'
            }`}
          >
            {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {change}
          </span>
        )}
      </div>

      {subtitle && <p className="text-[11px] text-[#78716C] mt-1">{subtitle}</p>}
    </Card>
  );
};
