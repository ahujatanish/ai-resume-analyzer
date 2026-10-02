/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { UploadCloud, AlertCircle, Loader2, Lock, ChevronDown, ChevronUp, ArrowRight, Sparkles } from 'lucide-react';
import { MAX_FILE_SIZE_LABEL, UploadError } from '../services/resumeUpload.ts';
import { SAMPLE_RESUMES, SampleResume } from '../data/sampleResumes.ts';

interface UploadCardProps {
  onFileSelect: (file: File) => void;
  onSampleSelect: (sample: SampleResume) => void;
  isUploading: boolean;
  isProcessing: boolean;
  error: UploadError | null;
  onClearError: () => void;
  onSimulateError: (type: 'invalid' | 'large' | 'empty' | 'corrupt') => void;
}

export const UploadCard: React.FC<UploadCardProps> = ({
  onFileSelect,
  onSampleSelect,
  isUploading,
  isProcessing,
  error,
  onClearError,
  onSimulateError,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [showEdgeTesters, setShowEdgeTesters] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      onFileSelect(droppedFile);
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = e.target.files[0];
      onFileSelect(selected);
      e.target.value = '';
    }
  };

  const handleBrowseClick = () => {
    onClearError();
    fileInputRef.current?.click();
  };

  const isLoading = isUploading || isProcessing;

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 sm:space-y-8">
      {/* Error Banner */}
      {error && (
        <div
          role="alert"
          className="p-4 sm:p-5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-sm shadow-navy-xs transition-all"
        >
          <div className="flex items-start gap-3.5">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-bold text-base text-rose-900">{error.title}</h3>
              <p className="mt-1 text-rose-700 leading-relaxed text-sm">
                {error.message}
              </p>
              {error.details && (
                <p className="mt-2 text-rose-600 font-mono text-xs bg-rose-100/70 p-2.5 rounded-lg border border-rose-200/50">
                  {error.details}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClearError}
              className="text-xs font-semibold text-rose-700 hover:text-rose-950 px-3 py-1.5 rounded-lg hover:bg-rose-100 transition-colors cursor-pointer shrink-0"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Main Upload Dropzone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={!isLoading ? handleBrowseClick : undefined}
        className={`relative rounded-3xl border-2 border-dashed transition-all cursor-pointer bg-white p-8 sm:p-14 text-center shadow-navy-xs ${
          isDragOver
            ? 'border-[#29437A] bg-[#29437A]/5 ring-4 ring-[#29437A]/15 scale-[1.005]'
            : 'border-slate-300 hover:border-[#29437A] hover:bg-slate-50/60'
        } ${isLoading ? 'pointer-events-none opacity-85' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={handleFileInputChange}
          className="hidden"
          aria-label="Upload resume file"
        />

        {isLoading ? (
          <div className="py-6 sm:py-8 flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-[#010736] text-[#FFF3D0] flex items-center justify-center mb-5 shadow-navy-md animate-pulse">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-[#010736]">
              {isUploading ? 'Uploading Resume...' : 'Extracting Document Text...'}
            </h3>
            <p className="text-sm sm:text-base text-slate-600 mt-2 max-w-md mx-auto leading-relaxed">
              {isUploading
                ? 'Validating file format and size constraints'
                : 'Parsing clean text, sections, and structural metrics in client memory'}
            </p>
            <div className="w-56 h-2 bg-slate-100 rounded-full mt-6 overflow-hidden">
              <div className="h-full bg-[#010736] rounded-full animate-pulse w-3/4" />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center">
            {/* Center Upload Icon */}
            <div
              className={`w-18 h-18 rounded-2xl flex items-center justify-center mb-5 transition-all shadow-navy-sm ${
                isDragOver
                  ? 'bg-[#010736] text-[#FFF3D0] scale-110'
                  : 'bg-[#010736] text-[#FFF3D0]'
              }`}
            >
              <UploadCloud className="w-9 h-9" />
            </div>

            <h3 className="text-2xl sm:text-3xl font-extrabold text-[#010736] tracking-tight">
              Upload Your Resume
            </h3>

            <p className="mt-2 text-sm sm:text-base text-slate-600 max-w-lg leading-relaxed">
              Drag and drop your file here, or choose from your computer
            </p>

            <div className="mt-6 sm:mt-7">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleBrowseClick();
                }}
                className="px-7 py-3.5 text-sm sm:text-base font-semibold text-white bg-[#010736] hover:bg-[#0D1B3D] active:scale-[0.98] rounded-xl transition-all shadow-navy-xs hover:shadow-navy-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#29437A] focus:ring-offset-2 min-h-[48px]"
              >
                Browse Files
              </button>
            </div>

            {/* Document Specs Row */}
            <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-center gap-3 sm:gap-5 text-xs sm:text-sm text-slate-500 flex-wrap">
              <span className="font-bold text-[#010736] bg-slate-100 px-2.5 py-1 rounded-md">PDF or DOCX</span>
              <span aria-hidden="true" className="text-slate-300">·</span>
              <span className="font-medium">Up to {MAX_FILE_SIZE_LABEL}</span>
              <span aria-hidden="true" className="text-slate-300">·</span>
              <span className="inline-flex items-center gap-1.5 font-medium text-[#29437A]">
                <Lock className="w-4 h-4 text-[#29437A]" />
                <span>Processed securely in memory</span>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Structured Sample Resumes Panel */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-navy-xs">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#010736]/5 text-[#29437A] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-[#29437A]" />
            </div>
            <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#010736]">
              Instant Pre-Loaded Resumes
            </h4>
          </div>
          <span className="text-xs sm:text-sm text-slate-500">Test the complete evaluation suite instantly</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {SAMPLE_RESUMES.map((sample) => (
            <button
              key={sample.id}
              type="button"
              onClick={() => onSampleSelect(sample)}
              className="text-left p-4 rounded-xl border border-slate-200 hover:border-[#29437A] hover:bg-slate-50/80 transition-all flex items-center justify-between gap-3 group cursor-pointer min-h-[64px]"
            >
              <div className="min-w-0">
                <span className="text-sm sm:text-base font-bold text-[#010736] block group-hover:text-[#29437A] transition-colors truncate">
                  {sample.name}
                </span>
                <span className="text-xs sm:text-sm text-slate-500 truncate block mt-0.5">
                  {sample.role}
                </span>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#010736] bg-[#FFF3D0] group-hover:bg-[#010736] group-hover:text-[#FFF3D0] px-3 py-1.5 rounded-lg border border-[#29437A]/20 transition-all shrink-0">
                <span>Load</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </button>
          ))}
        </div>

        {/* Quiet Validation Testing Toggle */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setShowEdgeTesters(!showEdgeTesters)}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors cursor-pointer py-1"
          >
            <span>Test upload validation edge cases</span>
            {showEdgeTesters ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          {showEdgeTesters && (
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <button
                type="button"
                onClick={() => onSimulateError('invalid')}
                className="px-2.5 py-1.5 rounded-md bg-slate-50 border border-slate-200 hover:border-slate-300 text-xs text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              >
                Invalid .jpg
              </button>
              <button
                type="button"
                onClick={() => onSimulateError('large')}
                className="px-2.5 py-1.5 rounded-md bg-slate-50 border border-slate-200 hover:border-slate-300 text-xs text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              >
                &gt;10MB
              </button>
              <button
                type="button"
                onClick={() => onSimulateError('empty')}
                className="px-2.5 py-1.5 rounded-md bg-slate-50 border border-slate-200 hover:border-slate-300 text-xs text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              >
                Empty
              </button>
              <button
                type="button"
                onClick={() => onSimulateError('corrupt')}
                className="px-2.5 py-1.5 rounded-md bg-slate-50 border border-slate-200 hover:border-slate-300 text-xs text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              >
                Corrupt
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
