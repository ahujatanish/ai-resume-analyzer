/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  AtsAnalysisResult,
} from '../services/resumeAnalyzer.ts';
import {
  CheckCircle2,
  AlertCircle,
  FileCheck,
  Search,
  KeyRound,
  UserCheck,
  Eye,
  TrendingUp,
  FileText,
  RotateCcw,
  Printer,
  Download,
  Check,
  ArrowLeft,
} from 'lucide-react';

interface AtsAnalysisSectionProps {
  atsData: AtsAnalysisResult;
  fileName: string;
  onReanalyze: () => void;
  onViewGeneralDashboard: () => void;
  onDownloadPdf?: () => void;
  onStartNewAnalysis?: () => void;
}

export const AtsAnalysisSection: React.FC<AtsAnalysisSectionProps> = ({
  atsData,
  fileName,
  onReanalyze,
  onViewGeneralDashboard,
  onDownloadPdf,
  onStartNewAnalysis,
}) => {
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [keywordFilter, setKeywordFilter] = useState<'all' | 'technical' | 'tools' | 'other'>('all');
  const [suggestionFilter, setSuggestionFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  const {
    atsScore,
    atsGrade,
    atsSummary,
    keywordUsage,
    missingKeywords,
    formattingIssues,
    sectionHeadingIssues,
    skillsVisibility,
    contactInfoVisibility,
    readabilityIssues,
    specificSuggestions,
  } = atsData;

  const getSeverityBadge = (severity: string) => {
    const s = severity.toLowerCase();
    if (s === 'high') {
      return 'bg-rose-50 text-rose-700 border-rose-200';
    }
    if (s === 'medium') {
      return 'bg-amber-50 text-amber-700 border-amber-200';
    }
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  const filteredKeywords = keywordUsage.filter((item) => {
    if (keywordFilter === 'all') return true;
    const cat = item.category.toLowerCase();
    if (keywordFilter === 'technical') return cat.includes('tech') || cat.includes('skill') || cat.includes('language');
    if (keywordFilter === 'tools') return cat.includes('tool') || cat.includes('platform') || cat.includes('framework');
    return !cat.includes('tech') && !cat.includes('tool');
  });

  const filteredSuggestions = specificSuggestions.filter((item) => {
    if (suggestionFilter === 'all') return true;
    return item.priority.toLowerCase() === suggestionFilter;
  });

  const totalIssuesCount =
    formattingIssues.length + sectionHeadingIssues.length + readabilityIssues.length;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Top ATS Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/90 shadow-navy-xs">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-[#010736] text-[#FFF3D0] flex items-center justify-center shrink-0 shadow-navy-xs">
            <FileCheck className="w-5 h-5 text-[#FFF3D0]" />
          </div>
          <div className="truncate">
            <h2 className="text-base sm:text-lg font-bold text-[#010736] truncate">
              ATS Compatibility &amp; Machine Parser Audit
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-mono truncate">
              Targeted algorithm check for {fileName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          {onDownloadPdf && (
            <button
              type="button"
              onClick={() => {
                onDownloadPdf();
                setDownloadSuccess(true);
                setTimeout(() => setDownloadSuccess(false), 3000);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold text-[#010736] bg-[#FFF3D0] hover:bg-[#ffeab3] border border-[#29437A]/30 rounded-xl transition-all cursor-pointer shadow-navy-xs min-h-[40px]"
              title="Download complete analysis report as PDF"
            >
              {downloadSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-700" />
                  <span className="text-emerald-900 font-bold">Downloaded!</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 text-[#010736]" />
                  <span>Download PDF</span>
                </>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={onViewGeneralDashboard}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-[#010736] bg-white hover:bg-slate-50 border border-slate-200 hover:border-[#29437A] rounded-xl transition-all cursor-pointer min-h-[40px]"
            title="Return to comprehensive resume analysis"
          >
            <ArrowLeft className="w-4 h-4 text-[#29437A]" />
            <span>Back to Resume Analysis</span>
          </button>

          {onStartNewAnalysis && (
            <button
              type="button"
              onClick={onStartNewAnalysis}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all cursor-pointer min-h-[40px]"
              title="Start a fresh analysis"
            >
              <RotateCcw className="w-4 h-4 text-slate-500" />
              <span>Start New Analysis</span>
            </button>
          )}

          <button
            type="button"
            onClick={onReanalyze}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer min-h-[40px]"
            title="Re-run ATS scan"
          >
            <RotateCcw className="w-4 h-4 text-slate-500" />
            <span>Re-Scan</span>
          </button>
        </div>
      </div>

      {/* 1. Main ATS Score & Overview Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-9 shadow-navy-xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Main ATS Score Dial */}
          <div className="lg:col-span-4 flex flex-col items-center justify-center p-7 rounded-2xl bg-slate-50/80 border border-slate-200 text-center">
            <span className="text-xs sm:text-sm font-bold text-[#29437A] uppercase tracking-wider mb-4">
              ATS Compatibility Score
            </span>

            <div className="w-32 h-32 rounded-full border-4 border-[#010736] bg-white flex flex-col items-center justify-center shadow-navy-xs">
              <span className="text-5xl font-extrabold font-mono text-[#010736] tabular-nums leading-none">
                {atsScore}
              </span>
              <span className="text-xs font-semibold text-slate-500 mt-1.5">/ 100</span>
            </div>

            <div className="mt-4">
              <span className="text-xs sm:text-sm font-extrabold text-[#010736] px-3.5 py-1 rounded-full bg-[#FFF3D0] border border-[#29437A]/30">
                Grade: {atsGrade}
              </span>
            </div>

            <p className="mt-2.5 text-xs text-slate-500 font-medium">
              Parser algorithm pass probability
            </p>
          </div>

          {/* ATS Overview & Quick Health Check */}
          <div className="lg:col-span-8 space-y-5">
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-[#29437A] uppercase tracking-wider">
                Parser Compatibility Summary
              </h3>
              <p className="mt-2 text-base sm:text-lg text-slate-700 leading-relaxed font-normal">
                {atsSummary}
              </p>
            </div>

            {/* Quick Status Pill Matrix */}
            <div className="pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3.5 text-xs sm:text-sm">
              <div className="p-3.5 rounded-xl bg-slate-50/90 border border-slate-200/80">
                <span className="text-xs text-slate-500 font-medium block">Contact Info</span>
                <span
                  className={`text-sm font-bold capitalize mt-1 block ${
                    contactInfoVisibility.status === 'complete'
                      ? 'text-emerald-700'
                      : contactInfoVisibility.status === 'partial'
                      ? 'text-amber-700'
                      : 'text-rose-700'
                  }`}
                >
                  {contactInfoVisibility.status}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50/90 border border-slate-200/80">
                <span className="text-xs text-slate-500 font-medium block">Skills Index</span>
                <span
                  className={`text-sm font-bold capitalize mt-1 block ${
                    skillsVisibility.status === 'excellent' || skillsVisibility.status === 'good'
                      ? 'text-emerald-700'
                      : 'text-amber-700'
                  }`}
                >
                  {skillsVisibility.status.replace('_', ' ')}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50/90 border border-slate-200/80">
                <span className="text-xs text-slate-500 font-medium block">Keywords Found</span>
                <span className="text-sm font-bold text-[#010736] font-mono tabular-nums mt-1 block">
                  {keywordUsage.length} detected
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50/90 border border-slate-200/80">
                <span className="text-xs text-slate-500 font-medium block">Parsing Flags</span>
                <span
                  className={`text-sm font-bold font-mono tabular-nums mt-1 block ${
                    totalIssuesCount === 0 ? 'text-emerald-700' : 'text-amber-700'
                  }`}
                >
                  {totalIssuesCount} {totalIssuesCount === 1 ? 'flag' : 'flags'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Keywords Analysis (Keywords Used vs Missing Important Keywords) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Identified Keywords */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-navy-xs flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#010736]/5 text-[#29437A] flex items-center justify-center">
                <KeyRound className="w-4 h-4 text-[#29437A]" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-[#010736]">
                Identified ATS Keywords
              </h3>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl text-xs">
              {(['all', 'technical', 'tools'] as const).map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setKeywordFilter(filter)}
                  className={`px-3 py-1 font-bold rounded-lg capitalize cursor-pointer transition-all ${
                    keywordFilter === filter
                      ? 'bg-[#010736] text-white shadow-navy-xs'
                      : 'text-slate-600 hover:text-[#010736]'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          <p className="text-xs sm:text-sm text-slate-600 mb-4 leading-relaxed">
            Core terms and technical keywords successfully parsed by the ATS scanner:
          </p>

          {filteredKeywords.length === 0 ? (
            <p className="text-xs sm:text-sm text-slate-500 italic py-6 text-center">
              No matching keywords found in this category.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2 flex-1 content-start">
              {filteredKeywords.map((item, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800 shadow-navy-xs"
                >
                  <span className="font-semibold">{item.keyword}</span>
                  <span className="text-[11px] font-mono font-bold text-[#29437A] bg-white px-1.5 py-0.5 rounded border border-slate-200">
                    {item.frequency}x
                  </span>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Missing Important Keywords */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-navy-xs flex flex-col">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Search className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-[#010736]">
                Missing Important Keywords
              </h3>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-slate-600 mb-4 leading-relaxed">
            Expected industry keywords missing for this candidate profile:
          </p>

          {missingKeywords.length === 0 ? (
            <div className="p-5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-sm text-emerald-900 flex items-center gap-3 flex-1">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>Great coverage! No critical industry keywords appear to be missing.</span>
            </div>
          ) : (
            <div className="space-y-3 flex-1">
              {missingKeywords.map((kw, idx) => {
                const isCritical = kw.importance.toLowerCase() === 'critical';
                return (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-100 text-xs sm:text-sm"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-bold text-[#010736]">
                        {kw.keyword}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border ${
                          isCritical
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {kw.importance}
                      </span>
                    </div>
                    <p className="text-slate-600 leading-relaxed text-xs">
                      {kw.reason}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 3. Visibility Audits: Contact Info & Skills Visibility */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Contact Information Visibility Card */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-navy-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                  <UserCheck className="w-4 h-4 text-[#29437A]" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-[#010736]">
                  Contact Information Visibility
                </h3>
              </div>
              <span className="text-sm font-mono tabular-nums font-bold text-[#010736]">
                {contactInfoVisibility.score}/100
              </span>
            </div>

            {/* Checklist of parsed contact items */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs sm:text-sm mb-4">
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <CheckCircle2
                  className={`w-4 h-4 shrink-0 ${
                    contactInfoVisibility.nameFound ? 'text-emerald-600' : 'text-slate-300'
                  }`}
                />
                <span className={contactInfoVisibility.nameFound ? 'text-slate-900 font-semibold' : 'text-slate-400'}>
                  Full Name
                </span>
              </div>

              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <CheckCircle2
                  className={`w-4 h-4 shrink-0 ${
                    contactInfoVisibility.emailFound ? 'text-emerald-600' : 'text-slate-300'
                  }`}
                />
                <span className={contactInfoVisibility.emailFound ? 'text-slate-900 font-semibold' : 'text-slate-400'}>
                  Email
                </span>
              </div>

              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <CheckCircle2
                  className={`w-4 h-4 shrink-0 ${
                    contactInfoVisibility.phoneFound ? 'text-emerald-600' : 'text-slate-300'
                  }`}
                />
                <span className={contactInfoVisibility.phoneFound ? 'text-slate-900 font-semibold' : 'text-slate-400'}>
                  Phone
                </span>
              </div>

              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <CheckCircle2
                  className={`w-4 h-4 shrink-0 ${
                    contactInfoVisibility.locationFound ? 'text-emerald-600' : 'text-slate-300'
                  }`}
                />
                <span className={contactInfoVisibility.locationFound ? 'text-slate-900 font-semibold' : 'text-slate-400'}>
                  Location
                </span>
              </div>

              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 sm:col-span-2">
                <CheckCircle2
                  className={`w-4 h-4 shrink-0 ${
                    contactInfoVisibility.linksFound ? 'text-emerald-600' : 'text-slate-300'
                  }`}
                />
                <span className={contactInfoVisibility.linksFound ? 'text-slate-900 font-semibold' : 'text-slate-400'}>
                  LinkedIn / Portfolio
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-3">
              {contactInfoVisibility.observation}
            </p>
          </div>

          {contactInfoVisibility.recommendation && (
            <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-600">
              <span className="font-bold text-[#010736]">Recommendation: </span>
              {contactInfoVisibility.recommendation}
            </div>
          )}
        </div>

        {/* Skills Visibility Card */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-navy-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                  <Eye className="w-4 h-4 text-[#29437A]" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-[#010736]">
                  Skills Section Visibility
                </h3>
              </div>
              <span className="text-sm font-mono tabular-nums font-bold text-[#010736]">
                {skillsVisibility.score}/100
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-100 mb-3 text-xs sm:text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-600 font-medium">Dedicated Skills Header:</span>
                <span
                  className={`font-bold ${
                    skillsVisibility.dedicatedSectionFound ? 'text-emerald-700' : 'text-rose-700'
                  }`}
                >
                  {skillsVisibility.dedicatedSectionFound ? 'Detected' : 'Missing'}
                </span>
              </div>
              <p className="mt-2 text-slate-700 leading-relaxed text-xs sm:text-sm">
                {skillsVisibility.observation}
              </p>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-600">
            <span className="font-bold text-[#010736]">ATS Strategy: </span>
            {skillsVisibility.recommendation}
          </div>
        </div>
      </div>

      {/* 4. Formatting, Section & Readability Issues */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-navy-xs">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center">
            <AlertCircle className="w-4 h-4 text-rose-600" />
          </div>
          <div>
            <h3 className="text-base sm:text-xl font-bold text-[#010736]">
              ATS Parsing Risks &amp; Formatting Issues
            </h3>
          </div>
        </div>

        {totalIssuesCount === 0 ? (
          <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-sm text-emerald-900 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>Zero parsing obstacles detected. Document structure and typography are fully safe for automated ingestion.</span>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Formatting Issues */}
            {formattingIssues.length > 0 && (
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-[#29437A] uppercase tracking-wider mb-3">
                  Formatting &amp; Character Ingestion ({formattingIssues.length})
                </h4>
                <div className="space-y-3">
                  {formattingIssues.map((f, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm shadow-navy-xs"
                    >
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border ${getSeverityBadge(
                            f.severity
                          )}`}
                        >
                          {f.severity} Risk
                        </span>
                        <span className="font-bold text-[#010736]">{f.issue}</span>
                      </div>
                      <p className="text-slate-600 text-xs sm:text-sm leading-relaxed mt-1">
                        <span className="font-semibold text-slate-800">Impact: </span>
                        {f.impact}
                      </p>
                      <p className="text-slate-600 text-xs leading-relaxed mt-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        <span className="font-bold text-[#010736]">Fix: </span>
                        {f.recommendation}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Section Heading Issues */}
            {sectionHeadingIssues.length > 0 && (
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-[#29437A] uppercase tracking-wider mb-3">
                  Section Header Standards ({sectionHeadingIssues.length})
                </h4>
                <div className="space-y-3">
                  {sectionHeadingIssues.map((h, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm shadow-navy-xs"
                    >
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border ${getSeverityBadge(
                            h.severity
                          )}`}
                        >
                          {h.severity}
                        </span>
                        <span className="font-bold text-[#010736] font-mono">
                          "{h.heading}"
                        </span>
                      </div>
                      <p className="text-slate-600 text-xs sm:text-sm leading-relaxed mt-1">{h.issue}</p>
                      <p className="text-slate-600 text-xs leading-relaxed mt-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        <span className="font-bold text-[#010736]">Fix: </span>
                        {h.recommendation}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Readability Issues */}
            {readabilityIssues.length > 0 && (
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-[#29437A] uppercase tracking-wider mb-3">
                  Readability &amp; Parser Density ({readabilityIssues.length})
                </h4>
                <div className="space-y-3">
                  {readabilityIssues.map((r, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm shadow-navy-xs"
                    >
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border ${getSeverityBadge(
                            r.severity
                          )}`}
                        >
                          {r.severity}
                        </span>
                        <span className="font-bold text-[#010736]">{r.issue}</span>
                      </div>
                      <p className="text-slate-600 text-xs leading-relaxed mt-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        <span className="font-bold text-[#010736]">Fix: </span>
                        {r.recommendation}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 5. Specific ATS Improvement Suggestions */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-navy-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#010736]/5 text-[#29437A] flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-[#29437A]" />
            </div>
            <div>
              <h3 className="text-base sm:text-xl font-bold text-[#010736]">
                Specific ATS Improvement Suggestions
              </h3>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs sm:text-sm self-start sm:self-auto border border-slate-200">
            {(['all', 'high', 'medium', 'low'] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setSuggestionFilter(filter)}
                className={`px-3.5 py-1.5 font-bold rounded-lg capitalize cursor-pointer transition-all ${
                  suggestionFilter === filter
                    ? 'bg-[#010736] text-white shadow-navy-xs'
                    : 'text-slate-600 hover:text-[#010736]'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3.5">
          {filteredSuggestions.map((item, idx) => {
            const p = item.priority.toLowerCase();
            const badgeColor =
              p === 'high'
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : p === 'medium'
                ? 'bg-[#FFF3D0] text-[#010736] border-[#29437A]/30'
                : 'bg-slate-100 text-slate-700 border-slate-200';

            return (
              <div
                key={idx}
                className="p-5 rounded-2xl border border-slate-200/90 bg-white text-xs sm:text-sm shadow-navy-xs hover:border-[#29437A]/40 transition-all"
              >
                <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
                  <span
                    className={`font-bold uppercase text-xs px-2.5 py-0.5 rounded-md border ${badgeColor}`}
                  >
                    {item.priority} Priority
                  </span>
                  <span className="font-extrabold text-[#010736] text-sm sm:text-base">
                    {item.category}
                  </span>
                </div>

                <p className="text-slate-800 text-sm sm:text-base leading-relaxed mt-1.5">
                  {item.suggestion}
                </p>

                <p className="mt-3 text-slate-600 text-xs sm:text-sm leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="font-bold text-[#010736]">Expected ATS Benefit: </span>
                  {item.expectedBenefit}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
