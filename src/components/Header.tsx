/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { FileText, ShieldCheck, RotateCcw } from 'lucide-react';

interface HeaderProps {
  onReset?: () => void;
  hasFile?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onReset, hasFile }) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-navy-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-18 sm:h-20 flex items-center justify-between">
        {/* Brand Lockup */}
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-[#010736] flex items-center justify-center text-white shadow-navy-sm ring-1 ring-white/10 shrink-0">
            <FileText className="w-5 h-5 text-[#FFF3D0]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg sm:text-xl font-extrabold tracking-tight text-[#010736] block leading-tight">
                AI Resume Analyzer
              </span>
              <span className="hidden sm:inline-flex items-center text-[11px] font-bold uppercase tracking-wider text-[#010736] bg-[#FFF3D0] px-2.5 py-0.5 rounded-md border border-[#29437A]/30">
                Enterprise
              </span>
            </div>
            <span className="text-xs sm:text-sm text-[#29437A] font-medium hidden sm:block leading-none mt-1">
              Executive Career &amp; ATS Intelligence Platform
            </span>
          </div>
        </div>

        {/* Right Action & Security Badge */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="hidden md:flex items-center gap-2 text-xs sm:text-sm text-[#29437A] font-medium bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
            <ShieldCheck className="w-4 h-4 text-[#29437A]" />
            <span>100% Client Extraction</span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span className="text-emerald-700 font-semibold">Zero Data Stored</span>
          </div>

          {hasFile && onReset && (
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white bg-[#010736] hover:bg-[#0D1B3D] active:bg-[#010736] border border-[#010736] rounded-xl transition-all shadow-navy-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#29437A] focus:ring-offset-2 shrink-0 min-h-[44px]"
            >
              <RotateCcw className="w-4 h-4 text-[#FFF3D0]" />
              <span className="whitespace-nowrap">Start New Analysis</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
