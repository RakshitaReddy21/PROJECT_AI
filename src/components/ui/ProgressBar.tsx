import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface ProgressBarProps {
  value: number; // 0 - 100
  variant?: 'signal' | 'indigo' | 'amber' | 'rust';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  variant = 'signal',
  size = 'md',
  showLabel = false,
  className,
}) => {
  const clampedValue = Math.min(100, Math.max(0, value));

  const variants = {
    signal: 'bg-signal',
    indigo: 'bg-[#F29B73]',
    amber: 'bg-amber',
    rust: 'bg-rust',
  };

  const sizes = {
    xs: 'h-1',
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  return (
    <div className={twMerge('w-full', className)}>
      {showLabel && (
        <div className="flex justify-between items-center text-xs font-mono mb-1 text-ink-faint">
          <span>Progress</span>
          <span>{clampedValue}%</span>
        </div>
      )}
      <div className={twMerge('w-full bg-[#FFF0E8]/70 rounded-full overflow-hidden border border-[#F1E8E3]', sizes[size])}>
        <div
          className={twMerge('h-full transition-all duration-500 rounded-full', variants[variant])}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
    </div>
  );
};
