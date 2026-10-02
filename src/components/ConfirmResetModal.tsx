/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AlertTriangle, X, Download, RotateCcw } from 'lucide-react';

interface ConfirmResetModalProps {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  onDownloadPdf?: () => void;
}

export const ConfirmResetModal: React.FC<ConfirmResetModalProps> = ({
  isOpen,
  onCancel,
  onConfirm,
  onDownloadPdf,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#010736]/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-reset-title"
        className="bg-white rounded-3xl border border-slate-200 shadow-navy-lg max-w-md w-full p-6 sm:p-7 space-y-5"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200/80 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 id="confirm-reset-title" className="text-lg font-bold text-[#010736]">
                Start a New Analysis?
              </h3>
              <span className="text-xs text-slate-500 font-medium">
                Prevent accidental loss of current report
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-slate-600 leading-relaxed font-normal">
          Starting a new analysis will clear your current evaluation, ATS score breakdown, job match matrix, and tailored recommendations.
        </p>

        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-700 leading-relaxed">
          <span className="font-bold text-[#010736] block mb-0.5">Tip:</span>
          You can download or print your report first to keep a copy of your scores and recommendations.
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-3">
          {onDownloadPdf && (
            <button
              type="button"
              onClick={() => {
                onDownloadPdf();
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold text-[#010736] bg-white hover:bg-slate-50 border border-slate-200 hover:border-[#29437A] rounded-xl transition-all cursor-pointer min-h-[44px]"
            >
              <Download className="w-4 h-4 text-[#29437A]" />
              <span>Download PDF First</span>
            </button>
          )}

          <button
            type="button"
            onClick={onCancel}
            className="w-full sm:w-auto px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-all cursor-pointer min-h-[44px]"
          >
            Keep Report
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-[#010736] hover:bg-[#0D1B3D] rounded-xl transition-all shadow-navy-xs cursor-pointer min-h-[44px]"
          >
            <RotateCcw className="w-4 h-4 text-[#FFF3D0]" />
            <span>Yes, Start New</span>
          </button>
        </div>
      </div>
    </div>
  );
};
