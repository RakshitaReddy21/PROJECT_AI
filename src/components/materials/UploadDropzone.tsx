import React, { useState, useRef } from 'react';
import { UploadCloud, File, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { extractPdfText } from '../../utils/pdfExtract';

export interface UploadDropzoneProps {
  onUpload: (file: { name: string; size: number; type: string }, fileContent?: string) => void;
  isLoading?: boolean;
}

export const UploadDropzone: React.FC<UploadDropzoneProps> = ({ onUpload, isLoading }) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const [extractError, setExtractError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (selectedFile) {
      let fileContent: string | undefined = undefined;
      setExtractError(null);
      try {
        const name = selectedFile.name.toLowerCase();
        if (name.endsWith('.pdf') || selectedFile.type === 'application/pdf') {
          // Real client-side PDF text extraction (pdf.js). Pages are joined
          // with a form-feed marker so the ingestion pipeline can preserve
          // accurate page numbers for citations.
          const extracted = await extractPdfText(selectedFile);
          fileContent = extracted.pages.map((p) => p.text).join('\f');
        } else if (
          selectedFile.type.includes('text') ||
          name.endsWith('.txt') ||
          name.endsWith('.md') ||
          name.endsWith('.json')
        ) {
          fileContent = await selectedFile.text();
        }
        // .docx / .epub: no client-side extractor wired up yet, so these
        // still fall back to placeholder content further down the pipeline.
      } catch (err) {
        console.error('Failed to extract file content:', err);
        setExtractError(
          'Could not read text from this PDF (it may be scanned/image-based). Falling back to limited processing.'
        );
      }
      onUpload(
        {
          name: selectedFile.name,
          size: selectedFile.size,
          type: selectedFile.type,
        },
        fileContent
      );
      setSelectedFile(null);
    }
  };

  return (
    <div className="w-full">
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
          dragActive
            ? 'border-[#F29B73] bg-[#FFF0E8]/60 scale-[1.01]'
            : 'border-[#F1E8E3] hover:border-[#F8C9B0] bg-white'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.epub,.docx,.txt,.md"
          className="hidden"
          onChange={handleChange}
        />

        <div className="p-3 bg-[#FFF0E8] text-[#F29B73] rounded-full mb-3 shadow-sm border border-[#F8C9B0]/50">
          <UploadCloud className="w-6 h-6" />
        </div>

        <p className="font-sans text-sm font-semibold text-ink">
          Drag and drop study materials, or <span className="text-[#F29B73] underline">browse</span>
        </p>
        <p className="text-xs text-ink-faint mt-1 font-mono">
          Supports PDF, EPUB, DOCX, TXT, MD (Up to 50MB)
        </p>
      </div>

      {extractError && (
        <div className="mt-3 p-2 text-xs font-mono text-amber-700 bg-amber-50 border border-amber-200 rounded-lg">
          {extractError}
        </div>
      )}

      {selectedFile && (
        <div className="mt-3 p-3 bg-[#FFF8F5] border border-[#F1E8E3] rounded-lg flex items-center justify-between animate-fade-in">
          <div className="flex items-center space-x-2 text-xs font-mono truncate">
            <File className="w-4 h-4 text-[#F29B73] flex-shrink-0" />
            <span className="truncate text-ink font-medium">{selectedFile.name}</span>
            <span className="text-ink-faint">({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)</span>
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="primary" size="sm" onClick={handleSubmit} isLoading={isLoading}>
              Ingest & Extract
            </Button>
            <button
              onClick={() => setSelectedFile(null)}
              className="p-1 text-ink-faint hover:text-ink hover:bg-white rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
