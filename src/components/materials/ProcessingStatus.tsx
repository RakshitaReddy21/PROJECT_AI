import React from 'react';
import { MaterialProcessingStage } from '../../types';
import { CheckCircle2, Loader2, AlertCircle, RefreshCw, FileText, Layers, Brain, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '../ui/Button';
import { AnimatedNumber, FadeIn, SlideUp } from '../motion';

export interface ProcessingStatusProps {
  stage: MaterialProcessingStage;
  progress: number;
  onRetry?: () => void;
}

export const ProcessingStatus: React.FC<ProcessingStatusProps> = ({
  stage,
  progress,
  onRetry,
}) => {
  const steps: { key: MaterialProcessingStage; label: string }[] = [
    { key: 'uploading', label: 'PDF Upload' },
    { key: 'extracting', label: 'Reading Content' },
    { key: 'chunking', label: 'Understanding Structure' },
    { key: 'embedding', label: 'Extracting Concepts' },
    { key: 'graphing', label: 'Building Search Index' },
  ];

  if (stage === 'ready') {
    return (
      <SlideUp duration={0.4} className="p-4 bg-[#E6F4EA] border border-[#10B981]/30 rounded-xl space-y-3 shadow-sm">
        {/* Header Status */}
        <div className="flex items-center justify-between text-xs text-[#059669] font-mono font-semibold">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
            Knowledge Processing Complete & Grounded
          </span>
          <span className="bg-white/80 px-2.5 py-0.5 rounded text-[10px] border border-[#10B981]/30 font-bold text-[#059669]">
            100% Ingested
          </span>
        </div>

        {/* DOCUMENT KNOWLEDGE TRANSFORMATION VISUAL */}
        <div className="p-3 bg-white border border-[#10B981]/20 rounded-lg flex items-center justify-between gap-1 text-[11px] font-mono shadow-sm">
          <div className="flex items-center space-x-1.5 text-ink-soft">
            <FileText className="w-3.5 h-3.5 text-[#F29B73]" />
            <span>Document</span>
          </div>

          <Sparkles className="w-3.5 h-3.5 text-[#E9825B] animate-pulse" />

          <div className="flex items-center space-x-1.5 text-ink-soft">
            <Layers className="w-3.5 h-3.5 text-[#F29B73]" />
            <span>Content Chunks</span>
          </div>

          <Sparkles className="w-3.5 h-3.5 text-[#059669] animate-pulse" />

          <div className="flex items-center space-x-1.5 text-[#059669] font-semibold">
            <Brain className="w-3.5 h-3.5 text-[#10B981]" />
            <span>Concepts Mapped</span>
          </div>
        </div>
      </SlideUp>
    );
  }

  if (stage === 'failed') {
    return (
      <FadeIn className="p-3.5 bg-[#FEE2E2] border border-[#EF4444]/30 rounded-xl space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-[#DC2626] font-semibold">
            <AlertCircle className="w-4 h-4 text-[#EF4444] flex-shrink-0" />
            <span>Processing halted during document extraction.</span>
          </div>
          {onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="text-[#DC2626] border-[#EF4444]/40 hover:bg-white text-xs font-mono py-1 px-2.5 h-auto"
            >
              <RefreshCw className="w-3 h-3 mr-1" /> Retry
            </Button>
          )}
        </div>
        <p className="text-[11px] text-ink-soft">
          We encountered an issue reading document structure. Click retry to re-queue the pipeline.
        </p>
      </FadeIn>
    );
  }

  const currentIdx = steps.findIndex((s) => s.key === stage);

  return (
    <div className="w-full space-y-3 p-4 bg-[#FFF8F5] border border-[#F1E8E3] rounded-xl shadow-card">
      <div className="flex items-center justify-between text-xs font-mono">
        <span className="flex items-center gap-2 text-[#E9825B] font-semibold capitalize">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-[#F29B73]" />
          Pipeline Stage: {steps[currentIdx]?.label || stage}...
        </span>
        <span className="text-[#E9825B] font-bold font-mono">
          <AnimatedNumber value={progress} suffix="%" />
        </span>
      </div>

      {/* Visual Pipeline Bar with Active Node Glow */}
      <div className="relative pt-2 pb-1">
        {/* Background Connecting Line */}
        <div className="absolute left-2 right-2 top-4 h-0.5 bg-[#F1E8E3] z-0" />

        {/* Traveling Active Glowing Line */}
        <div
          className="absolute left-2 top-4 h-0.5 bg-gradient-to-r from-[#F29B73] via-[#F8C9B0] to-[#10B981] z-0 transition-all duration-300"
          style={{ width: `${Math.max(0, Math.min(100, (currentIdx / (steps.length - 1)) * 100))}%` }}
        />

        <div className="flex items-center justify-between relative z-10">
          {steps.map((s, idx) => {
            const isDone = idx < currentIdx;
            const isCurrent = idx === currentIdx;

            return (
              <div key={s.key} className="flex flex-col items-center">
                <div
                  className={`w-4 h-4 rounded-full flex items-center justify-center transition-all duration-200 ${
                    isDone
                      ? 'bg-[#10B981] text-white shadow-sm'
                      : isCurrent
                      ? 'bg-[#F29B73] ring-4 ring-[#FFF0E8] text-white shadow-sm'
                      : 'bg-white border border-[#F1E8E3] text-[#A8A29E]'
                  }`}
                >
                  {isDone ? <span className="text-[9px] font-bold">✓</span> : isCurrent ? <span className="w-1.5 h-1.5 rounded-full bg-white" /> : null}
                </div>
                <span
                  className={`text-[10px] font-mono mt-1 text-center max-w-[70px] ${
                    isCurrent ? 'text-[#E9825B] font-semibold' : isDone ? 'text-ink' : 'text-ink-faint'
                  }`}
                >
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
