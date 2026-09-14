import React from 'react';
import { Project, Concept } from '../../types';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Brain, Sparkles, BookOpen } from 'lucide-react';

export interface LearningContextProps {
  project: Project | null;
  concepts: Concept[];
}

export const LearningContext: React.FC<LearningContextProps> = ({ project, concepts }) => {
  if (!project) return null;

  const weakConcepts = concepts.filter((c) => c.score < 70);

  return (
    <Card variant="flat" className="p-4 border border-signal/20 bg-signal-soft/20">
      <div className="flex items-center space-x-2 text-signal-strong mb-2">
        <Brain className="w-4 h-4" />
        <h4 className="text-xs font-semibold uppercase tracking-wider font-mono">
          Persistent Study Context
        </h4>
      </div>

      <p className="text-xs font-semibold text-ink leading-tight">{project.title}</p>
      <p className="text-[11px] text-ink-soft mt-1 leading-snug">Target: {project.targetGoal}</p>

      {weakConcepts.length > 0 && (
        <div className="mt-3 pt-3 border-t border-line/60">
          <p className="text-[10px] font-mono text-ink-faint uppercase mb-1.5 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber" />
            Focus Areas ({weakConcepts.length})
          </p>
          <div className="flex flex-wrap gap-1">
            {weakConcepts.map((c) => (
              <Badge key={c.id} variant="amber" size="sm">
                {c.name} ({c.score}%)
              </Badge>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};
