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
    signal: 'bg-[#FFEBE0] text-[#E85A2A] border-[#FFC8B0]',
    amber: 'bg-[#FFF0E5] text-[#E66300] border-[#FFD3B8]',
    rust: 'bg-[#FEE2E2] text-[#DC2626] border-[#EF4444]/30',
    indigo: 'bg-[#FFEBE0] text-[#FF6B35] border-[#FFC8B0]',
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
