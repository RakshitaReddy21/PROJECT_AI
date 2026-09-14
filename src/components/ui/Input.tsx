import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-xs font-medium text-ink-soft mb-1">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={twMerge(
            clsx(
              'w-full px-3.5 py-2 text-sm bg-white border rounded-md text-ink placeholder:text-ink-faint transition-all focus:outline-none focus:ring-2 focus:ring-[#F8C9B0]/40 focus:border-[#F29B73]',
              error ? 'border-rust text-rust focus:border-rust focus:ring-rust/20' : 'border-[#F1E8E3]',
              className
            )
          )}
          {...props}
        />
        {error && <p className="text-xs text-rust mt-1 font-mono">{error}</p>}
        {hint && !error && <p className="text-[11px] text-ink-faint mt-1">{hint}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
