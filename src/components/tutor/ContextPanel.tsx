import React from 'react';
import { Project, Material, Concept, Citation } from '../../types';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { BookOpen, Layers, Sparkles, X, Brain, AlertTriangle, CheckCircle2, Target } from 'lucide-react';

export interface ContextPanelProps {
  project?: Project | null;
  materials: Material[];
  concepts: Concept[];
  selectedCitation?: Citation | null;
  onClearCitation?: () => void;
}

export const ContextPanel: React.FC<ContextPanelProps> = ({
  project,
  materials,
  concepts,
  selectedCitation,
  onClearCitation,
}) => {
  const weakConcepts = concepts.filter((c) => c.isWeakness || c.score < 70);
  const masteryScore = project?.masteryScore ?? 0;
  const masteryTier = masteryScore >= 80 ? 'Proficient' : masteryScore >= 65 ? 'Competent' : 'Developing';

  return (
    <div className="space-y-4">
      {/* Active Citation Highlight Card */}
      {selectedCitation && (
        <Card className="p-4 bg-indigo-soft/40 border border-indigo/30 rounded-xl relative animate-fade-in shadow-panel">
          <button
            onClick={onClearCitation}
            className="absolute right-3 top-3 p-1 text-ink-faint hover:text-ink rounded"
            aria-label="Close citation preview"
          >
            <X className="w-3.5 h-3.5" />
          </button>
          <span className="text-[10px] font-mono text-indigo-strong font-semibold uppercase">
            📄 Grounded Citation Preview
          </span>
          <h5 className="text-xs font-semibold text-ink mt-1 font-display">{selectedCitation.materialTitle}</h5>
          <p className="text-xs text-ink-soft italic mt-2 p-3 bg-paper-raised rounded-lg border border-line/60 leading-relaxed font-sans">
            "{selectedCitation.excerpt}"
          </p>
          <div className="flex items-center justify-between text-[10px] font-mono text-ink-faint mt-2">
            <span>Target Chunk #{selectedCitation.chunkIndex}</span>
            <span className="text-signal-strong font-medium">✓ Grounded Excerpt</span>
          </div>
        </Card>
      )}

      {/* PROJECT LEARNING CONTEXT PANEL */}
      <Card className="p-5 bg-paper-raised border border-line/70 rounded-xl shadow-card space-y-4">
        <div className="flex items-center space-x-2 text-indigo-strong border-b border-line/60 pb-3">
          <Brain className="w-4 h-4 text-indigo" />
          <h4 className="text-xs font-semibold uppercase tracking-wider font-mono">
            Active Learning Context
          </h4>
        </div>

        {/* Current Topic & Mastery */}
        <div className="space-y-2.5">
          <div className="flex justify-between items-start text-xs gap-2">
            <span className="text-ink-faint font-mono flex-shrink-0">Subject Topic</span>
            <span className="font-semibold text-ink font-sans text-right truncate">
              {project?.title || 'Subject Workspace'}
            </span>
          </div>
          {project?.targetGoal && (
            <div className="flex justify-between items-start text-xs gap-2">
              <span className="text-ink-faint font-mono flex-shrink-0">Target Goal</span>
              <span className="font-medium text-ink-soft text-[11px] text-right line-clamp-2" title={project.targetGoal}>
                {project.targetGoal}
              </span>
            </div>
          )}
          <div className="flex justify-between items-center text-xs">
            <span className="text-ink-faint font-mono">Mastery State</span>
            <span className="font-semibold text-indigo-strong font-mono">
              {masteryScore}% ({masteryTier})
            </span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-ink-faint font-mono">Indexed Concepts</span>
            <span className="font-semibold text-signal-strong font-mono">{concepts.length} active nodes</span>
          </div>
        </div>

        {/* Weak Concepts */}
        {weakConcepts.length > 0 && (
          <div className="pt-3 border-t border-line/60 space-y-2">
            <span className="text-[10px] font-mono text-amber uppercase font-semibold tracking-wider flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Targeted Remediation Areas
            </span>
            <div className="space-y-1.5">
              {weakConcepts.map((c) => (
                <div key={c.id} className="flex items-center justify-between text-xs p-2 bg-amber-soft/40 border border-amber/20 rounded-md font-mono">
                  <span className="truncate text-ink font-medium max-w-[150px]">{c.name}</span>
                  <span className="text-amber font-semibold">{c.score}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Relevant Sources */}
        <div className="pt-3 border-t border-line/60 space-y-2">
          <span className="text-[10px] font-mono text-ink-faint uppercase font-semibold tracking-wider flex items-center gap-1">
            <BookOpen className="w-3 h-3 text-indigo" /> Grounded Project Sources ({materials.length})
          </span>
          <div className="space-y-1.5">
            {materials.map((m) => (
              <div key={m.id} className="p-2 bg-paper-sunken/60 rounded border border-line/40 text-[11px] font-mono flex items-center justify-between">
                <span className="truncate text-ink font-medium max-w-[140px]">{m.title}</span>
                <span className="text-signal-strong text-[10px] font-semibold">Indexed</span>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
};
