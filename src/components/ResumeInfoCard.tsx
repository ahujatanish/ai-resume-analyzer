/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, ChangeEvent } from 'react';
import { CheckCircle2, Trash2, RefreshCw, AlertTriangle } from 'lucide-react';
import { formatFileSize } from '../services/resumeUpload.ts';

interface ResumeInfoCardProps {
  fileName: string;
  fileSize: number;
  fileType: 'pdf' | 'docx';
  warnings?: string[];
  onRemove: () => void;
  onReplaceFile: (file: File) => void;
}

export const ResumeInfoCard: React.FC<ResumeInfoCardProps> = ({
  fileName,
  fileSize,
  fileType,
  warnings,
  onRemove,
  onReplaceFile,
}) => {
  const replaceInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onReplaceFile(e.target.files[0]);
      e.target.value = '';
    }
  };

  const isPdf = fileType === 'pdf';

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-7 shadow-navy-xs">
      <input
        ref={replaceInputRef}
        type="file"
        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        onChange={handleFileChange}
        className="hidden"
        aria-label="Replace resume file"
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        {/* File Information */}
        <div className="flex items-center gap-4 min-w-0">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 font-extrabold text-sm shadow-navy-xs ${
              isPdf
                ? 'bg-[#010736] text-[#FFF3D0] border border-[#29437A]/30'
                : 'bg-[#29437A] text-white border border-[#010736]/20'
            }`}
          >
            {isPdf ? 'PDF' : 'DOCX'}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-base sm:text-lg font-bold text-[#010736] truncate">
                {fileName}
              </h2>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Text Extracted
              </span>
            </div>

            <div className="mt-1.5 flex items-center gap-2.5 text-xs sm:text-sm text-slate-500 font-mono">
              <span className="uppercase font-bold text-[#29437A]">{fileType}</span>
              <span aria-hidden="true" className="text-slate-300 font-sans">·</span>
              <span className="tabular-nums font-semibold">{formatFileSize(fileSize)}</span>
              <span aria-hidden="true" className="text-slate-300 font-sans">·</span>
              <span className="font-sans text-slate-600 font-medium">Ready for AI evaluation</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 shrink-0 self-start sm:self-center">
          <button
            type="button"
            onClick={() => replaceInputRef.current?.click()}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold text-[#010736] bg-white hover:bg-slate-50 border border-slate-200 hover:border-[#29437A] rounded-xl transition-all cursor-pointer shadow-navy-xs min-h-[44px]"
          >
            <RefreshCw className="w-4 h-4 text-[#29437A]" />
            <span>Replace File</span>
          </button>

          <button
            type="button"
            onClick={onRemove}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer min-h-[44px]"
          >
            <Trash2 className="w-4 h-4" />
            <span>Remove</span>
          </button>
        </div>
      </div>

      {/* Warnings Banner */}
      {warnings && warnings.length > 0 && (
        <div className="mt-5 p-4 rounded-xl bg-amber-50/90 border border-amber-200 text-amber-900 text-xs sm:text-sm">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-bold">Notice: </span>
              {warnings.map((w, idx) => (
                <span key={idx}>{w} </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
