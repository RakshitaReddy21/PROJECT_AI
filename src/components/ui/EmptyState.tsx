import React from 'react';
import { LucideIcon, Inbox } from 'lucide-react';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Inbox,
  title,
  description,
  actionLabel,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-white border border-dashed border-[#F1E8E3] rounded-xl">
      <div className="p-3 bg-[#FFF0E8] rounded-full text-[#F29B73] mb-3 shadow-sm">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="font-sans text-base font-semibold text-ink">{title}</h3>
      <p className="text-xs text-ink-faint max-w-sm mt-1 mb-4">{description}</p>
      {actionLabel && onAction && (
        <Button variant="outline" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
