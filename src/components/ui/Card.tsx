import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'raised' | 'flat' | 'dark';
}

export const Card: React.FC<CardProps> = ({ children, className, variant = 'default', ...props }) => {
  const baseStyles = 'rounded-lg border transition-all';
  
  const variants = {
    default: 'bg-white border-line shadow-card',
    raised: 'bg-white border-line shadow-panel',
    flat: 'bg-paper-sunken border-line/60 shadow-none',
    dark: 'bg-white border-line text-ink shadow-card',
  };

  return (
    <div className={twMerge(clsx(baseStyles, variants[variant], className))} {...props}>
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className, ...props }) => (
  <div className={twMerge(clsx('p-5 border-b border-line/60', className))} {...props}>
    {children}
  </div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ children, className, ...props }) => (
  <h3 className={twMerge(clsx('font-sans text-lg font-semibold text-ink', className))} {...props}>
    {children}
  </h3>
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({ children, className, ...props }) => (
  <p className={twMerge(clsx('text-xs text-ink-faint mt-1', className))} {...props}>
    {children}
  </p>
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className, ...props }) => (
  <div className={twMerge(clsx('p-5', className))} {...props}>
    {children}
  </div>
);

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className, ...props }) => (
  <div className={twMerge(clsx('p-4 bg-paper-sunken/60 border-t border-line/60 rounded-b-lg flex items-center justify-between', className))} {...props}>
    {children}
  </div>
);
