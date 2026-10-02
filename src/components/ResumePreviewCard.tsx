/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  Copy,
  Check,
  Search,
  Maximize2,
  Minimize2,
  Clock,
  Type,
  Hash,
  Layers,
  FileText,
} from 'lucide-react';
import { ParseMetrics } from '../services/resumeParser.ts';

interface ResumePreviewCardProps {
  extractedText: string;
  metrics: ParseMetrics;
}

export const ResumePreviewCard: React.FC<ResumePreviewCardProps> = ({
  extractedText,
  metrics,
}) => {
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(extractedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = extractedText;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const highlightedContent = useMemo(() => {
    return extractedText;
  }, [extractedText]);

  return (
    <div
      className={`bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col transition-all ${
        isExpanded
          ? 'fixed inset-4 z-50 shadow-xl overflow-hidden'
          : 'relative'
      }`}
    >
      {/* Header Bar */}
      <div className="px-4 py-3.5 sm:px-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/80 rounded-t-xl">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#010736] text-[#FFF3D0] flex items-center justify-center shadow-xs">
            <FileText className="w-4 h-4" />
          </div>
          <h2 className="text-sm sm:text-base font-bold text-[#010736] tracking-tight">
            Extracted Text Preview
          </h2>
        </div>

        {/* Toolbar: Search, Copy, Expand */}
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Find in document..."
              className="pl-8 pr-3 py-2 text-xs rounded-lg border border-slate-200 bg-white placeholder-slate-400 text-slate-900 focus:outline-none focus:border-[#29437A] focus:ring-2 focus:ring-[#29437A]/20 w-36 sm:w-48 transition-all"
            />
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-white border border-slate-200 text-[#010736] hover:bg-slate-50 hover:border-[#29437A] transition-all shadow-2xs cursor-pointer min-h-[36px]"
            title="Copy extracted text"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-bold">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-[#29437A]" />
                <span>Copy Text</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-[#010736] hover:bg-slate-50 transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
            title={isExpanded ? 'Exit full screen' : 'Expand full screen'}
          >
            {isExpanded ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="px-4 sm:px-6 py-2.5 border-b border-slate-100 bg-white flex items-center justify-between flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500 font-mono tabular-nums">
        <div className="flex items-center gap-1.5">
          <Type className="w-3.5 h-3.5 text-[#29437A]" />
          <span className="font-bold text-[#010736]">{metrics.wordCount.toLocaleString()}</span>
          <span className="font-sans text-slate-500 text-xs">words</span>
        </div>

        <div className="flex items-center gap-1.5">
          <Hash className="w-3.5 h-3.5 text-[#29437A]" />
          <span className="font-bold text-[#010736]">{metrics.charCount.toLocaleString()}</span>
          <span className="font-sans text-slate-500 text-xs">characters</span>
        </div>

        <div className="flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-[#29437A]" />
          <span className="font-bold text-[#010736]">{metrics.paragraphCount}</span>
          <span className="font-sans text-slate-500 text-xs">paragraphs</span>
        </div>

        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-[#29437A]" />
          <span className="font-bold text-[#010736]">~{metrics.estimatedReadingTimeMinutes}m</span>
          <span className="font-sans text-slate-500 text-xs">read time</span>
        </div>

        {metrics.pageCount !== undefined && metrics.pageCount > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="font-sans text-slate-500 text-xs">Pages:</span>
            <span className="font-bold text-[#010736]">{metrics.pageCount}</span>
          </div>
        )}
      </div>

      {/* High-Contrast Scrollable Preview Area */}
      <div
        className={`p-4 sm:p-5 overflow-y-auto text-xs leading-relaxed text-slate-900 bg-slate-50/20 select-text ${
          isExpanded ? 'flex-1 max-h-none' : 'max-h-[380px]'
        }`}
      >
        <pre className="whitespace-pre-wrap font-sans text-xs sm:text-sm text-slate-900 leading-relaxed font-normal">
          {searchQuery.trim() ? (
            <SearchHighlight text={highlightedContent} query={searchQuery.trim()} />
          ) : (
            highlightedContent
          )}
        </pre>
      </div>

      {/* Preview Footer note */}
      <div className="px-4 sm:px-5 py-2 border-t border-slate-100 bg-white rounded-b-xl flex items-center justify-between text-[11px] text-slate-400">
        <span>Preserves original document line structure</span>
        <span>Client-side reader</span>
      </div>
    </div>
  );
};

interface SearchHighlightProps {
  text: string;
  query: string;
}

const SearchHighlight: React.FC<SearchHighlightProps> = ({ text, query }) => {
  if (!query) return <>{text}</>;

  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-[#FFF3D0] text-[#010736] font-semibold rounded-xs px-1 border border-[#29437A]/30">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
};
