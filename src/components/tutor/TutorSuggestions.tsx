import React from 'react';
import { Lightbulb } from 'lucide-react';

export interface TutorSuggestionsProps {
  suggestions?: string[];
  onSelect: (prompt: string) => void;
}

export const TutorSuggestions: React.FC<TutorSuggestionsProps> = ({ suggestions, onSelect }) => {
  if (!suggestions || suggestions.length === 0) return null;

  return (
    <div className="py-2">
      <p className="text-[10px] font-mono text-ink-faint uppercase tracking-wider mb-2 flex items-center gap-1">
        <Lightbulb className="w-3 h-3 text-amber" /> Suggested Prompts
      </p>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => onSelect(prompt)}
            className="text-xs text-ink-soft bg-paper-sunken hover:bg-paper-raised hover:text-ink border border-line px-3 py-1.5 rounded-full transition-all text-left shadow-sm"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
};
