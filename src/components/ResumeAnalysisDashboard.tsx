/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ResumeAnalysisResult,
} from '../services/resumeAnalyzer.ts';
import { JobMatchResult } from '../services/jobMatcher.ts';
import { ResumeImprovementsResult } from '../services/resumeImprover.ts';
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Award,
  Briefcase,
  GraduationCap,
  FolderGit2,
  Wrench,
  Sparkles,
  TrendingUp,
  FileText,
  RotateCcw,
  Copy,
  Check,
  Target,
  Compass,
  Printer,
  Download,
} from 'lucide-react';

interface ResumeAnalysisDashboardProps {
  analysis: ResumeAnalysisResult;
  fileName: string;
  onReanalyze: () => void;
  onViewRawText: () => void;
  onViewAts?: () => void;
  onViewJobMatch?: () => void;
  onViewSkillGap?: () => void;
  onViewImprovements?: () => void;
  onDownloadPdf?: () => void;
  onViewPrintReport?: () => void;
  onStartNewAnalysis?: () => void;
  jobMatch?: JobMatchResult | null;
  aiImprovements?: ResumeImprovementsResult | null;
}

export const ResumeAnalysisDashboard: React.FC<ResumeAnalysisDashboardProps> = ({
  analysis,
  fileName,
  onReanalyze,
  onViewRawText,
  onViewAts,
  onViewJobMatch,
  onViewSkillGap,
  onViewImprovements,
  onDownloadPdf,
  onViewPrintReport,
  onStartNewAnalysis,
  jobMatch,
  aiImprovements,
}) => {
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  const {
    overallScore,
    scoreGrade,
    scoreSummary,
    scoreBreakdown,
    skills,
    experience,
    education,
    projects,
    certifications,
    strengths,
    weaknesses,
    missingSections,
    improvements,
  } = analysis;

  const handleCopySummary = async () => {
    const summaryText = `AI Resume Analysis for ${fileName}
Overall Score: ${overallScore}/100 (${scoreGrade})
${scoreSummary}

Key Strengths:
${strengths.map((s) => `• ${s.title}: ${s.description}`).join('\n')}

Key Areas to Improve:
${improvements.map((imp) => `• [${imp.priority.toUpperCase()}] ${imp.area}: ${imp.suggestion}`).join('\n')}`;

    try {
      await navigator.clipboard.writeText(summaryText);
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = summaryText;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 2000);
    }
  };

  const filteredImprovements =
    selectedFilter === 'all'
      ? improvements
      : improvements.filter((item) => item.priority.toLowerCase() === selectedFilter);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Top Header Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/90 shadow-navy-xs">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-[#010736] text-[#FFF3D0] flex items-center justify-center shrink-0 shadow-navy-xs">
            <Sparkles className="w-5 h-5 text-[#FFF3D0]" />
          </div>
          <div className="truncate">
            <h2 className="text-base sm:text-lg font-bold text-[#010736] truncate">
              Comprehensive Analysis Results
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-mono truncate">
              {fileName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          {onViewImprovements && (
            <button
              type="button"
              onClick={onViewImprovements}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white bg-[#010736] hover:bg-[#0D1B3D] rounded-xl transition-all cursor-pointer shadow-navy-xs min-h-[40px]"
            >
              <Sparkles className="w-4 h-4 text-[#FFF3D0]" />
              <span>AI Improvements</span>
            </button>
          )}

          {onViewSkillGap && (
            <button
              type="button"
              onClick={onViewSkillGap}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-[#010736] bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-[#29437A] rounded-xl transition-all cursor-pointer min-h-[40px]"
            >
              <Compass className="w-4 h-4 text-[#29437A]" />
              <span>Skill Gap</span>
            </button>
          )}

          {onViewJobMatch && (
            <button
              type="button"
              onClick={onViewJobMatch}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-[#010736] bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-[#29437A] rounded-xl transition-all cursor-pointer min-h-[40px]"
            >
              <Target className="w-4 h-4 text-[#29437A]" />
              <span>Job Match</span>
            </button>
          )}

          {onViewAts && analysis.atsAnalysis && (
            <button
              type="button"
              onClick={onViewAts}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-[#29437A] bg-[#29437A]/10 hover:bg-[#29437A]/20 border border-[#29437A]/30 rounded-xl transition-all cursor-pointer min-h-[40px]"
            >
              <span>ATS: {analysis.atsAnalysis.atsScore}/100</span>
            </button>
          )}

          {onDownloadPdf && (
            <button
              type="button"
              onClick={() => {
                onDownloadPdf();
                setDownloadSuccess(true);
                setTimeout(() => setDownloadSuccess(false), 3000);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold text-[#010736] bg-[#FFF3D0] hover:bg-[#ffeab3] border border-[#29437A]/30 rounded-xl transition-all cursor-pointer shadow-navy-xs min-h-[40px]"
              title="Download complete resume analysis as PDF"
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

          {onViewPrintReport && (
            <button
              type="button"
              onClick={onViewPrintReport}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium text-[#010736] bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all cursor-pointer min-h-[40px]"
              title="Preview full printable report"
            >
              <Printer className="w-4 h-4 text-[#29437A]" />
              <span className="hidden sm:inline">Print Report</span>
            </button>
          )}

          <button
            type="button"
            onClick={onViewRawText}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all cursor-pointer min-h-[40px]"
          >
            <FileText className="w-4 h-4 text-slate-500" />
            <span>Text</span>
          </button>

          <button
            type="button"
            onClick={handleCopySummary}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all cursor-pointer min-h-[40px]"
          >
            {copiedSummary ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700 font-semibold">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-400" />
                <span>Copy Summary</span>
              </>
            )}
          </button>

          {onStartNewAnalysis && (
            <button
              type="button"
              onClick={onStartNewAnalysis}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-[#010736] bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-[#29437A] rounded-xl transition-all cursor-pointer min-h-[40px]"
              title="Start a new resume analysis"
            >
              <RotateCcw className="w-4 h-4 text-[#29437A]" />
              <span>Start New Analysis</span>
            </button>
          )}

          <button
            type="button"
            onClick={onReanalyze}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer min-h-[40px]"
          >
            <RotateCcw className="w-4 h-4 text-slate-500" />
            <span>Re-Scan</span>
          </button>
        </div>
      </div>

      {/* 1. Overall Score & Sub-scores Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-9 shadow-navy-xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Main Score Gauge */}
          <div className="lg:col-span-4 flex flex-col items-center justify-center p-7 rounded-2xl bg-slate-50/80 border border-slate-200 text-center">
            <span className="text-xs sm:text-sm font-bold text-[#29437A] uppercase tracking-wider mb-4">
              Overall Resume Score
            </span>

            <div className="w-32 h-32 rounded-full border-4 border-[#010736] bg-white flex flex-col items-center justify-center shadow-navy-xs">
              <span className="text-5xl font-extrabold font-mono text-[#010736] tabular-nums leading-none">
                {overallScore}
              </span>
              <span className="text-xs font-semibold text-slate-500 mt-1.5">/ 100</span>
            </div>

            <div className="mt-4">
              <span className="text-xs sm:text-sm font-extrabold text-[#010736] px-3.5 py-1 rounded-full bg-[#FFF3D0] border border-[#29437A]/30">
                Grade: {scoreGrade}
              </span>
            </div>
            <p className="mt-2.5 text-xs text-slate-500 font-medium">
              Evaluated against modern hiring benchmarks
            </p>
          </div>

          {/* Sub-Score Breakdown & Summary */}
          <div className="lg:col-span-8 space-y-5">
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-[#29437A] uppercase tracking-wider">
                Recruiter Evaluation Summary
              </h3>
              <p className="mt-2 text-base sm:text-lg text-slate-700 leading-relaxed font-normal">
                {scoreSummary}
              </p>
            </div>

            <div className="pt-5 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Impact & Metrics */}
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="font-bold text-[#010736]">Impact &amp; Metrics</span>
                  <span className="font-mono tabular-nums font-bold text-[#010736]">
                    {scoreBreakdown.impactAndMetrics}/100
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#010736] transition-all duration-300"
                    style={{ width: `${Math.min(100, scoreBreakdown.impactAndMetrics)}%` }}
                  />
                </div>
              </div>

              {/* Clarity & Formatting */}
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="font-bold text-[#010736]">Clarity &amp; Formatting</span>
                  <span className="font-mono tabular-nums font-bold text-[#010736]">
                    {scoreBreakdown.clarityAndFormatting}/100
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#29437A] transition-all duration-300"
                    style={{ width: `${Math.min(100, scoreBreakdown.clarityAndFormatting)}%` }}
                  />
                </div>
              </div>

              {/* Experience Relevance */}
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="font-bold text-[#010736]">Experience Relevance</span>
                  <span className="font-mono tabular-nums font-bold text-[#010736]">
                    {scoreBreakdown.experienceRelevance}/100
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#29437A] transition-all duration-300"
                    style={{ width: `${Math.min(100, scoreBreakdown.experienceRelevance)}%` }}
                  />
                </div>
              </div>

              {/* Skills Depth */}
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="font-bold text-[#010736]">Skills Depth</span>
                  <span className="font-mono tabular-nums font-bold text-[#010736]">
                    {scoreBreakdown.skillsDepth}/100
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#010736] transition-all duration-300"
                    style={{ width: `${Math.min(100, scoreBreakdown.skillsDepth)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Strengths & Weaknesses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Strengths */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-navy-xs flex flex-col">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-[#010736]">
                Key Strengths
              </h3>
            </div>
          </div>

          <div className="space-y-3 flex-1">
            {strengths.map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-slate-50/70 border border-slate-100 text-xs sm:text-sm"
              >
                <div className="font-bold text-[#010736] text-sm sm:text-base">
                  {item.title}
                </div>
                <p className="mt-1 text-slate-600 leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Weaknesses */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-navy-xs flex flex-col">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center font-bold">
              <AlertCircle className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-[#010736]">
                Weaknesses &amp; Gaps
              </h3>
            </div>
          </div>

          <div className="space-y-3 flex-1">
            {weaknesses.map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-slate-50/70 border border-slate-100 text-xs sm:text-sm"
              >
                <div className="font-bold text-[#010736] text-sm sm:text-base">
                  {item.title}
                </div>
                <p className="mt-1 text-slate-600 leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Missing or Weak Resume Sections */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-navy-xs">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-[#010736]">
              Missing or Weak Resume Sections
            </h3>
          </div>
        </div>

        {missingSections.length === 0 ? (
          <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 text-sm text-emerald-900 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>All standard resume sections are present and adequately developed.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {missingSections.map((sec, idx) => {
              const isMissing = sec.status.toLowerCase() === 'missing';
              return (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 text-xs sm:text-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="font-bold text-sm sm:text-base text-[#010736]">
                        {sec.sectionName}
                      </span>
                      <span
                        className={`text-xs font-bold uppercase px-2.5 py-0.5 rounded-md ${
                          isMissing
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {sec.status}
                      </span>
                    </div>
                    <p className="text-slate-600 leading-relaxed text-xs sm:text-sm">
                      {sec.description}
                    </p>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-slate-200/60 text-xs text-slate-500">
                    <span className="font-bold text-[#010736]">Impact: </span>
                    {sec.impact}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Prioritized Improvement Suggestions */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-navy-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#010736]/5 text-[#010736] flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-[#29437A]" />
            </div>
            <div>
              <h3 className="text-base sm:text-xl font-bold text-[#010736]">
                Actionable Improvement Suggestions
              </h3>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs sm:text-sm self-start sm:self-auto border border-slate-200">
            {(['all', 'high', 'medium', 'low'] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setSelectedFilter(filter)}
                className={`px-3.5 py-1.5 font-bold rounded-lg capitalize cursor-pointer transition-all ${
                  selectedFilter === filter
                    ? 'bg-[#010736] text-white shadow-navy-xs'
                    : 'text-slate-600 hover:text-[#010736]'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {filteredImprovements.map((item, idx) => {
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
                className="p-5 rounded-2xl border border-slate-200/90 bg-white hover:border-[#29437A]/40 transition-all text-xs sm:text-sm shadow-navy-xs"
              >
                <div className="flex items-center gap-2.5 mb-2 flex-wrap">
                  <span
                    className={`font-bold uppercase text-xs px-2.5 py-0.5 rounded-md border ${badgeColor}`}
                  >
                    {item.priority}
                  </span>
                  <span className="font-extrabold text-[#010736] text-sm sm:text-base">
                    {item.area}
                  </span>
                </div>

                <p className="text-slate-800 text-sm sm:text-base leading-relaxed mt-1.5">
                  {item.suggestion}
                </p>

                <p className="mt-3 text-slate-600 text-xs sm:text-sm leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  <span className="font-bold text-[#010736]">Rationale: </span>
                  {item.rationale}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Skills Inventory Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-navy-xs">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <Wrench className="w-4 h-4 text-[#29437A]" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-[#010736]">
              Skills Inventory
            </h3>
          </div>
        </div>

        {skills.length === 0 ? (
          <p className="text-xs sm:text-sm text-slate-500 italic">
            No explicit skills section found in resume.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {skills.map((cat, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-slate-50/70 border border-slate-100 text-xs sm:text-sm"
              >
                <h4 className="font-bold text-[#010736] text-sm sm:text-base mb-2.5">
                  {cat.category}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {cat.items.map((skill, sIdx) => (
                    <span
                      key={sIdx}
                      className="px-2.5 py-1 bg-white border border-slate-200 text-slate-800 font-medium rounded-lg text-xs shadow-navy-xs"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 6. Experience History Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-navy-xs">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <Briefcase className="w-4 h-4 text-[#29437A]" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-[#010736]">
              Work Experience
            </h3>
          </div>
        </div>

        {experience.length === 0 ? (
          <p className="text-xs sm:text-sm text-slate-500 italic">
            No work experience entries identified.
          </p>
        ) : (
          <div className="space-y-4">
            {experience.map((exp, idx) => (
              <div
                key={idx}
                className="p-5 rounded-xl border border-slate-200 bg-white"
              >
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1.5 mb-2">
                  <div>
                    <h4 className="text-sm sm:text-base font-bold text-[#010736]">
                      {exp.title}
                    </h4>
                    <div className="text-xs sm:text-sm text-slate-600 font-medium mt-0.5">
                      {exp.company}
                      {exp.location && (
                        <>
                          <span aria-hidden="true" className="mx-1.5 text-slate-300">·</span>
                          <span className="text-slate-500">{exp.location}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {exp.period && (
                    <span className="text-xs sm:text-sm font-mono text-slate-500 tabular-nums">
                      {exp.period}
                    </span>
                  )}
                </div>

                <ul className="mt-3 space-y-1.5 pl-4 text-xs sm:text-sm text-slate-700 list-disc leading-relaxed">
                  {exp.highlights.map((h, hIdx) => (
                    <li key={hIdx}>{h}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 7. Education & Certifications Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Education */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-navy-xs flex flex-col">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-[#29437A]" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-[#010736]">
                Education
              </h3>
            </div>
          </div>

          {education.length === 0 ? (
            <p className="text-xs sm:text-sm text-slate-500 italic">
              No education entries found.
            </p>
          ) : (
            <div className="space-y-3 flex-1">
              {education.map((edu, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-slate-50/70 border border-slate-100 text-xs sm:text-sm"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-bold text-[#010736] text-sm sm:text-base">
                      {edu.degree}
                    </span>
                    {edu.graduationYear && (
                      <span className="font-mono text-slate-500 tabular-nums text-xs">
                        {edu.graduationYear}
                      </span>
                    )}
                  </div>
                  <div className="text-slate-600 mt-1 font-medium">{edu.institution}</div>
                  {edu.details && (
                    <div className="text-slate-500 text-xs mt-1.5">
                      {edu.details}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Certifications */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-navy-xs flex flex-col">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <Award className="w-4 h-4 text-[#29437A]" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-[#010736]">
                Certifications
              </h3>
            </div>
          </div>

          {certifications.length === 0 ? (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs sm:text-sm text-slate-500 italic flex-1 flex items-center justify-center">
              No certifications listed in this resume.
            </div>
          ) : (
            <div className="space-y-2.5 flex-1">
              {certifications.map((cert, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-100 text-xs sm:text-sm font-semibold text-slate-800 flex items-center gap-2.5"
                >
                  <Award className="w-4 h-4 text-[#29437A] shrink-0" />
                  <span>{cert}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 8. Projects Card (if present) */}
      {projects && projects.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-navy-xs">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <FolderGit2 className="w-4 h-4 text-[#29437A]" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-[#010736]">
                Notable Projects
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map((proj, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-baseline justify-between gap-2 mb-1.5">
                    <span className="font-bold text-sm sm:text-base text-[#010736]">
                      {proj.name}
                    </span>
                    {proj.link && (
                      <span className="text-xs text-[#29437A] font-mono hover:underline">
                        {proj.link}
                      </span>
                    )}
                  </div>
                  <p className="text-slate-600 leading-relaxed text-xs sm:text-sm">
                    {proj.description}
                  </p>
                </div>

                {proj.technologies && proj.technologies.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap gap-1.5">
                    {proj.technologies.map((t, tIdx) => (
                      <span
                        key={tIdx}
                        className="px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200 text-slate-700 text-xs font-mono"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
