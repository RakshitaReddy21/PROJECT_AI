import React from 'react';
import { MasteryLevel } from '../../types';
import { Badge } from '../ui/Badge';

export interface MasteryStatusBadgeProps {
  level: MasteryLevel;
  score?: number;
}

export const MasteryStatusBadge: React.FC<MasteryStatusBadgeProps> = ({ level, score }) => {
  const configs: Record<MasteryLevel, { label: string; variant: 'signal' | 'amber' | 'rust' | 'indigo' | 'neutral' }> = {
    novice: { label: 'Novice', variant: 'neutral' },
    developing: { label: 'Developing', variant: 'amber' },
    competent: { label: 'Competent', variant: 'indigo' },
    proficient: { label: 'Proficient', variant: 'signal' },
    master: { label: 'Master', variant: 'signal' },
  };

  const config = configs[level] || configs.novice;

  return (
    <Badge variant={config.variant} size="sm">
      {config.label} {score !== undefined && `(${score}%)`}
    </Badge>
  );
};
