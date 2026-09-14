import React, { useState } from 'react';
import { Material } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { ProcessingStatus } from './ProcessingStatus';
import { FileText, RefreshCw, Layers, Sparkles, ExternalLink, Eye } from 'lucide-react';

export interface MaterialCardProps {
  material: Material;
  onRetry?: (id: string) => void;
  onViewDetails?: (material: Material) => void;
}

export const MaterialCard: React.FC<MaterialCardProps> = ({
  material,
  onRetry,
  onViewDetails,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative group"
    >
      <Card
        onClick={() => onViewDetails?.(material)}
        className="p-5 bg-white border border-[#F1E8E3] rounded-xl transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-float cursor-pointer group-hover:border-[#F8C9B0]"
      >
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex items-start space-x-3">
            <div className="p-3 bg-[#FFF0E8] text-[#F29B73] rounded-xl border border-[#F8C9B0]/60 shadow-sm flex-shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h4 className="font-display text-sm font-semibold text-ink group-hover:text-[#E9825B] transition-colors leading-snug">
                  {material.title}
                </h4>
                {material.stage === 'ready' && (
                  <span className="px-2 py-0.5 text-[10px] font-mono bg-[#E6F4EA] text-[#059669] border border-[#10B981]/20 rounded-full font-semibold">
                    Searchable
                  </span>
                )}
              </div>
              <p className="text-[11px] font-mono text-ink-faint mt-0.5">
                {material.fileName} • {formatBytes(material.fileSize)} • {material.pageCount || 24} Pages
              </p>
            </div>
          </div>

          {material.stage === 'failed' && onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onRetry(material.id);
              }}
              className="text-rust border-rust/30 hover:bg-rust-soft"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1" /> Retry
            </Button>
          )}
        </div>

        {/* Live Processing Timeline */}
        <div className="mt-4 pt-3 border-t border-[#F1E8E3]">
          <ProcessingStatus
            stage={material.stage}
            progress={material.progress}
            onRetry={onRetry ? () => onRetry(material.id) : undefined}
          />
        </div>

        {/* Ready Info Bar */}
        {material.stage === 'ready' && (
          <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-ink-faint pt-2 border-t border-[#F1E8E3]">
            <span className="flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-[#F29B73]" />
              {material.chunkCount} vector chunks
            </span>
            <span className="flex items-center gap-1 text-[#059669] font-medium">
              <Sparkles className="w-3.5 h-3.5 text-[#10B981]" />
              {material.extractedConceptsCount} concepts extracted
            </span>
          </div>
        )}

        {/* Floating Quick Action Bar on Hover */}
        {isHovered && material.stage === 'ready' && (
          <div
            className="mt-3 pt-3 border-t border-[#F1E8E3] flex items-center justify-end space-x-2 animate-fade-in font-mono text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => onViewDetails?.(material)}
              className="px-2.5 py-1 bg-[#FFF8F5] hover:bg-[#FFF0E8] border border-[#F1E8E3] text-[#78716C] rounded-md flex items-center gap-1 transition-colors"
            >
              <Eye className="w-3 h-3 text-[#F29B73]" /> View Concepts
            </button>
            {onRetry && (
              <button
                onClick={() => onRetry(material.id)}
                className="px-2.5 py-1 bg-[#FFF8F5] hover:bg-[#FFF0E8] border border-[#F1E8E3] text-[#78716C] rounded-md flex items-center gap-1 transition-colors"
              >
                <RefreshCw className="w-3 h-3" /> Reprocess
              </button>
            )}
            <button
              onClick={() => onViewDetails?.(material)}
              className="px-2.5 py-1 bg-[#F29B73] hover:bg-[#E9825B] text-white rounded-md flex items-center gap-1 transition-colors font-semibold shadow-sm"
            >
              <ExternalLink className="w-3 h-3" /> Open
            </button>
          </div>
        )}
      </Card>
    </div>
  );
};
