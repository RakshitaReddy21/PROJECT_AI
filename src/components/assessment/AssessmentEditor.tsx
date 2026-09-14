import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Sparkles, Send } from 'lucide-react';

export interface AssessmentEditorProps {
  prompt: string;
  onSubmit: (responseText: string) => Promise<void>;
  isLoading?: boolean;
}

export const AssessmentEditor: React.FC<AssessmentEditorProps> = ({
  prompt,
  onSubmit,
  isLoading,
}) => {
  const [text, setText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim() && !isLoading) {
      onSubmit(text);
    }
  };

  return (
    <Card className="p-6 space-y-4 bg-white border border-[#F1E8E3] shadow-sm">
      <div>
        <span className="text-[10px] font-mono text-[#E9825B] uppercase tracking-wider font-semibold">
          Open-Ended Synthesizing Prompt
        </span>
        <h3 className="font-sans text-base font-semibold text-[#292524] mt-1 leading-relaxed">
          {prompt}
        </h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={8}
            placeholder="Write your comprehensive technical analysis here... Reference specific concepts, tradeoffs, and materials."
            className="w-full p-4 text-xs font-mono bg-[#FFF8F5] border border-[#F1E8E3] rounded-lg text-[#292524] focus:outline-none focus:border-[#F29B73] leading-relaxed shadow-inner"
          />
          <div className="flex justify-between items-center text-[11px] font-mono text-ink-faint mt-1.5">
            <span>Minimum 50 words recommended for deep evaluation</span>
            <span>{text.split(/\s+/).filter(Boolean).length} words</span>
          </div>
        </div>

        <div className="flex justify-end">
          <Button variant="signal" type="submit" disabled={!text.trim() || isLoading} isLoading={isLoading} className="bg-[#F29B73] hover:bg-[#E9825B] text-white font-semibold shadow-sm">
            <Sparkles className="w-4 h-4 mr-1.5" /> Submit for AI Rubric Evaluation
          </Button>
        </div>
      </form>
    </Card>
  );
};
