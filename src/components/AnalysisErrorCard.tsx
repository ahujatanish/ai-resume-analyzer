/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AlertCircle, RotateCcw, ArrowLeft, Clock } from 'lucide-react';

interface AnalysisErrorCardProps {
  error: string;
  isRateLimit?: boolean;
  retryAfterSeconds?: number;
  onRetry: () => void;
  onBackToPreview: () => void;
}

export const AnalysisErrorCard: React.FC<AnalysisErrorCardProps> = ({
  error,
  isRateLimit = false,
  retryAfterSeconds = 25,
  onRetry,
  onBackToPreview,
}) => {
  const [countdown, setCountdown] = useState<number>(isRateLimit ? retryAfterSeconds : 0);

  useEffect(() => {
    if (!isRateLimit) return;
    setCountdown(retryAfterSeconds);

    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [isRateLimit, retryAfterSeconds]);

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-9 shadow-navy-xs max-w-lg mx-auto text-center">
      <div
        className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
          isRateLimit ? 'bg-[#FFF3D0] text-[#010736]' : 'bg-rose-50 text-rose-600'
        }`}
      >
        {isRateLimit ? <Clock className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
      </div>

      <h3 className="text-base sm:text-lg font-bold text-[#010736]">
        {isRateLimit ? 'Free AI Usage Limit Reached' : 'Analysis Unavailable'}
      </h3>

      <p
        className={`mt-3 text-xs sm:text-sm p-4 rounded-xl border text-left whitespace-pre-wrap break-words leading-relaxed ${
          isRateLimit
            ? 'bg-[#FFF3D0]/60 border-[#29437A]/25 text-[#010736]'
            : 'bg-rose-50/80 border-rose-200 text-rose-900 font-mono'
        }`}
      >
        {isRateLimit ? 'Free AI usage limit reached. Please try again in a few moments.' : error}
      </p>

      {isRateLimit && (
        <div className="mt-3.5 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs sm:text-sm text-slate-700 flex items-center justify-between">
          <span className="text-slate-500 font-medium">Free tier quota cooldown:</span>
          <span className="font-mono font-bold tabular-nums text-[#010736]">
            {countdown > 0 ? `${countdown}s remaining` : 'Ready to retry'}
          </span>
        </div>
      )}

      <p className="mt-3 text-xs text-slate-500">
        {isRateLimit
          ? 'The free tier request window automatically refreshes every minute.'
          : 'You can retry in a few moments or return to inspect your extracted resume text.'}
      </p>

      <div className="mt-6 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={onBackToPreview}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs sm:text-sm font-semibold text-[#010736] bg-white hover:bg-slate-50 border border-slate-200 hover:border-[#29437A] rounded-xl transition-all cursor-pointer min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4 text-[#29437A]" />
          <span>Back to Preview</span>
        </button>

        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-[#010736] hover:bg-[#0D1B3D] rounded-xl transition-all shadow-navy-xs cursor-pointer min-h-[44px]"
        >
          <RotateCcw className="w-4 h-4 text-[#FFF3D0]" />
          <span>{countdown > 0 ? `Retry (${countdown}s)` : 'Retry Analysis'}</span>
        </button>
      </div>
    </div>
  );
};
