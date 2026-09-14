import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message,
  onRetry,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-6 bg-rust-soft/30 border border-rust/30 rounded-xl text-center">
      <div className="p-2.5 bg-rust-soft text-rust rounded-full mb-2">
        <AlertTriangle className="w-5 h-5" />
      </div>
      <h4 className="font-sans text-sm font-semibold text-rust">{title}</h4>
      <p className="text-xs text-ink-soft mt-1 mb-3 max-w-md">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="gap-1.5 border-rust/30 text-rust hover:bg-rust-soft">
          <RefreshCw className="w-3.5 h-3.5" />
          Try Again
        </Button>
      )}
    </div>
  );
};
