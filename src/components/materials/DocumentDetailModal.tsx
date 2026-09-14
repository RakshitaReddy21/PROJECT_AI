import React from 'react';
import { Material, Concept } from '../../types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import {
  FileText,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Trash2,
  ExternalLink,
  BookOpen,
  Calendar,
  HardDrive,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export interface DocumentDetailModalProps {
  material: Material | null;
  isOpen: boolean;
  onClose: () => void;
  concepts?: Concept[];
  onReprocess?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export const DocumentDetailModal: React.FC<DocumentDetailModalProps> = ({
  material,
  isOpen,
  onClose,
  concepts = [],
  onReprocess,
  onDelete,
}) => {
  const navigate = useNavigate();

  if (!material) return null;

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const relatedConcepts = concepts.filter((c) =>
    c.relatedMaterialIds?.includes(material.id)
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={material.title}
      description="Inspect ingested source metadata, vector chunk indexing, and extracted concept linkages."
    >
      <div className="space-y-6 animate-fade-in text-xs">
        {/* Document Primary Info Card */}
        <div className="p-4 bg-[#FFF8F5] rounded-xl border border-[#F1E8E3] space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#F1E8E3]">
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4 text-[#F29B73]" />
              <span className="font-mono font-medium text-ink truncate max-w-xs">
                {material.fileName}
              </span>
            </div>
            <span
              className={`px-2.5 py-0.5 rounded-full font-mono text-[10px] font-semibold ${
                material.stage === 'ready'
                  ? 'bg-[#E6F4EA] text-[#059669] border border-[#10B981]/20'
                  : material.stage === 'failed'
                  ? 'bg-[#FEE2E2] text-[#DC2626] border border-[#EF4444]/30'
                  : 'bg-[#FFF0E8] text-[#E9825B] border border-[#F8C9B0]'
              }`}
            >
              {material.stage === 'ready' ? 'Searchable Index' : material.stage}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px] font-mono">
            <div>
              <span className="text-ink-faint block">Page Count</span>
              <span className="font-semibold text-ink">{material.pageCount || 24} Pages</span>
            </div>
            <div>
              <span className="text-ink-faint block">File Size</span>
              <span className="font-semibold text-ink">{formatBytes(material.fileSize)}</span>
            </div>
            <div>
              <span className="text-ink-faint block">Vector Chunks</span>
              <span className="font-semibold text-ink">{material.chunkCount} Chunks</span>
            </div>
            <div>
              <span className="text-ink-faint block">Uploaded</span>
              <span className="font-semibold text-ink">
                {new Date(material.uploadedAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Extracted Concepts Mapping */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="font-mono uppercase font-semibold text-[10px] text-ink-faint flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#10B981]" />
              Extracted Knowledge Concepts ({relatedConcepts.length || material.extractedConceptsCount})
            </span>
            <span className="text-[10px] text-ink-faint">Linked in Tutor Context</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {relatedConcepts.length > 0 ? (
              relatedConcepts.map((concept) => (
                <div
                  key={concept.id}
                  className="px-3 py-1.5 bg-white border border-[#F1E8E3] rounded-lg flex items-center justify-between gap-3 text-xs"
                >
                  <span className="font-semibold text-ink">{concept.name}</span>
                  <span className="text-[10px] font-mono text-[#059669] bg-[#E6F4EA] px-1.5 py-0.5 rounded">
                    {concept.score}% Mastery
                  </span>
                </div>
              ))
            ) : (
              <p className="text-ink-faint text-xs">
                {material.extractedConceptsCount} concepts indexed across dense embedding space.
              </p>
            )}
          </div>
        </div>

        {/* Floating Contextual Actions */}
        <div className="pt-4 border-t border-[#F1E8E3] flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            {onReprocess && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onReprocess(material.id);
                  onClose();
                }}
                className="gap-1.5 text-xs font-mono"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Reprocess Pipeline
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onDelete(material.id);
                  onClose();
                }}
                className="gap-1.5 text-xs text-rust hover:bg-rust-soft/50 font-mono"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </Button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                onClose();
                navigate(`/projects/${material.projectId}/tutor`);
              }}
              className="gap-1.5 font-semibold text-xs shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5" /> Query in AI Tutor
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
