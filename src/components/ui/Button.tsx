import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'signal';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-sans font-medium transition-all duration-150 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none rounded';

  const variants = {
    primary: 'bg-[#F29B73] text-white hover:bg-[#E9825B] focus:ring-[#F29B73] shadow-sm hover:shadow active:scale-[0.98]',
    secondary: 'bg-[#FFF0E8] text-[#292524] hover:bg-[#F8C9B0]/60 border border-[#F1E8E3] focus:ring-[#F29B73]',
    outline: 'border border-[#EADFD9] bg-white text-[#292524] hover:bg-[#FFF0E8] hover:border-[#F8C9B0] focus:ring-[#F29B73]',
    ghost: 'text-[#78716C] hover:text-[#292524] hover:bg-[#FFF0E8] focus:ring-[#F29B73]',
    danger: 'bg-rust text-white hover:bg-rust/90 focus:ring-rust shadow-sm',
    signal: 'bg-signal text-white hover:bg-signal-strong focus:ring-signal shadow-sm',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs rounded-sm gap-1.5',
    md: 'px-4 py-2 text-sm rounded gap-2',
    lg: 'px-6 py-3 text-base rounded-lg gap-2.5',
  };

  return (
    <button
      className={twMerge(clsx(baseStyles, variants[variant], sizes[size], className))}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading...
        </>
      ) : (
        children
      )}
    </button>
  );
};
