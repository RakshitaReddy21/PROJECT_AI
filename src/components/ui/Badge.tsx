import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'signal' | 'amber' | 'rust' | 'indigo' | 'neutral' | 'outline';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({ children, className, variant = 'neutral', size = 'md', ...props }) => {
  const base = 'inline-flex items-center font-mono font-medium rounded-full border transition-colors';

  const variants = {
    signal: 'bg-[#E6F4EA] text-[#059669] border-[#10B981]/30',
    amber: 'bg-[#FEF3C7] text-[#D97706] border-[#F59E0B]/30',
    rust: 'bg-[#FEE2E2] text-[#DC2626] border-[#EF4444]/30',
    indigo: 'bg-[#FFF0E8] text-[#E9825B] border-[#F8C9B0]',
    neutral: 'bg-paper-sunken text-ink-soft border-line',
    outline: 'bg-transparent text-ink border-line',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-1 text-xs',
  };

  return (
    <span className={twMerge(clsx(base, variants[variant], sizes[size], className))} {...props}>
      {children}
    </span>
  );
};
