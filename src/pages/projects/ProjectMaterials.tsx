import React, { useState, useEffect } from 'react';
import { useProject } from '../../context/ProjectContext';
import { uploadMaterialApi, retryMaterialApi } from '../../api/materials';
import { UploadDropzone } from '../../components/materials/UploadDropzone';
import { MaterialCard } from '../../components/materials/MaterialCard';
import { DocumentDetailModal } from '../../components/materials/DocumentDetailModal';
import { EmptyState } from '../../components/ui/EmptyState';
import { FileText, Sparkles, Layers, RefreshCw } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { Material } from '../../types';

export const ProjectMaterials: React.FC = () => {
  const { projectId, materials, concepts, refreshMaterials, refreshConcepts } = useProject();
  const [isUploading, setIsUploading] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const { success, info } = useToast();

  // Background polling simulation while materials are processing
  useEffect(() => {
    const hasProcessing = materials.some(
      (m) => m.stage !== 'ready' && m.stage !== 'failed'
    );
    if (!hasProcessing) return;

    const interval = setInterval(() => {
      refreshMaterials();
      refreshConcepts();
    }, 1500);

    return () => clearInterval(interval);
  }, [materials, refreshMaterials, refreshConcepts]);

  const handleUpload = async (file: { name: string; size: number; type: string }, fileContent?: string) => {
    setIsUploading(true);
    info('Upload started', `Ingesting ${file.name} into vector processing pipeline.`);
    try {
      await uploadMaterialApi(projectId, file, fileContent);
      await refreshMaterials();
      success('Processing initiated', 'Text extraction and concept chunking underway.');
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRetry = async (materialId: string) => {
    try {
      await retryMaterialApi(materialId);
      await refreshMaterials();
      info('Reprocessing queued', 'Re-submitting document to embedding engine.');
    } catch (err) {
      console.error(err);
    }
  };

  const handleViewDetails = (material: Material) => {
    setSelectedMaterial(material);
    setIsDetailOpen(true);
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
      <div>
        <div className="flex items-center space-x-2 mb-1">
          <span className="text-[10px] font-mono text-indigo-strong font-semibold uppercase tracking-wider bg-indigo-soft px-2.5 py-0.5 rounded-full">
            Ingestion Pipeline
          </span>
          <span className="text-xs font-mono text-ink-faint">
            PDF & Textbook Embeddings
          </span>
        </div>
        <h2 className="font-display text-2xl font-semibold text-ink">
          Study Materials & Knowledge Base
        </h2>
        <p className="text-xs text-ink-faint mt-1 leading-relaxed">
          Uploaded documents are converted into dense vector chunks, indexed in HNSW vector tables, and grounded in your AI Tutor context.
        </p>
      </div>

      {/* Upload Dropzone */}
      <UploadDropzone onUpload={handleUpload} isLoading={isUploading} />

      {/* Ingested List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-line">
          <h3 className="font-sans text-sm font-semibold text-ink uppercase tracking-wider font-mono flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo" />
            Ingested Document Sources ({materials.length})
          </h3>
          <span className="text-xs font-mono text-ink-faint">
            Click any document to inspect chunk telemetry
          </span>
        </div>

        {materials.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No materials uploaded yet"
            description="Add a PDF to give your AI Tutor knowledge to work with."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {materials.map((m) => (
              <MaterialCard
                key={m.id}
                material={m}
                onRetry={handleRetry}
                onViewDetails={handleViewDetails}
              />
            ))}
          </div>
        )}
      </div>

      {/* Document Detail Modal */}
      <DocumentDetailModal
        material={selectedMaterial}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        concepts={concepts}
        onReprocess={handleRetry}
      />
    </div>
  );
};
