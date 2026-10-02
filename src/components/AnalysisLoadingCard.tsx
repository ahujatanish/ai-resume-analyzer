/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';

const ANALYSIS_STEPS = [
  'Ingesting resume text and evaluating structure...',
  'Extracting verified skills, roles, and education history...',
  'Evaluating impact metrics and quantifiable achievements...',
  'Auditing resume sections for ATS compliance...',
  'Compiling strengths, weaknesses, and improvement suggestions...',
];

interface AnalysisLoadingCardProps {
  fileName: string;
}

export const AnalysisLoadingCard: React.FC<AnalysisLoadingCardProps> = ({ fileName }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStepIndex((prev) => (prev < ANALYSIS_STEPS.length - 1 ? prev + 1 : prev));
    }, 1800);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 p-8 sm:p-12 shadow-navy-xs text-center max-w-lg mx-auto">
      <div className="w-14 h-14 rounded-2xl bg-[#010736] text-[#FFF3D0] flex items-center justify-center mx-auto mb-4 shadow-navy-sm animate-pulse">
        <Sparkles className="w-7 h-7" />
      </div>

      <h3 className="text-xl sm:text-2xl font-bold text-[#010736] tracking-tight">
        Analyzing Resume
      </h3>
      <p className="mt-1 text-xs sm:text-sm text-slate-500 font-mono">
        {fileName}
      </p>

      {/* Progress step */}
      <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-100 max-w-sm mx-auto">
        <div className="flex items-center gap-3 text-left">
          <Loader2 className="w-5 h-5 text-[#29437A] animate-spin shrink-0" />
          <div className="min-w-0">
            <p className="text-xs sm:text-sm font-semibold text-slate-900">
              {ANALYSIS_STEPS[currentStepIndex]}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Evaluating strictly against actual document content
            </p>
          </div>
        </div>

        {/* Progress step indicator */}
        <div className="mt-4 flex items-center justify-center gap-1.5">
          {ANALYSIS_STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === currentStepIndex
                  ? 'w-6 bg-[#010736]'
                  : i < currentStepIndex
                  ? 'w-2 bg-emerald-500'
                  : 'w-2 bg-slate-200'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
