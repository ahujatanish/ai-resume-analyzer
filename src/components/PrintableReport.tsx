/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ResumeAnalysisResult } from '../services/resumeAnalyzer.ts';
import { JobMatchResult } from '../services/jobMatcher.ts';
import { ResumeImprovementsResult } from '../services/resumeImprover.ts';
import { downloadResumeAnalysisPdf } from '../services/pdfGenerator.ts';
import {
  Printer,
  Download,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Target,
  Sparkles,
  XCircle,
  Briefcase,
  Layers,
  ArrowLeft,
  Compass,
  Check,
  Award,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';

interface PrintableReportProps {
  fileName: string;
  analysis: ResumeAnalysisResult;
  jobMatch?: JobMatchResult | null;
  improvements?: ResumeImprovementsResult | null;
  onClose?: () => void;
}

export const PrintableReport: React.FC<PrintableReportProps> = ({
  fileName,
  analysis,
  jobMatch,
  improvements,
  onClose,
}) => {
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    downloadResumeAnalysisPdf({
      fileName,
      analysis,
      jobMatch,
      improvements,
    });
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3500);
  };

  const {
    overallScore,
    scoreGrade,
    scoreSummary,
    scoreBreakdown,
    strengths,
    weaknesses,
    improvements: actionItems,
    atsAnalysis,
    skills,
  } = analysis;

  return (
    <div className="printable-report-wrapper w-full pb-16">
      {/* Non-printed Floating Action Bar */}
      <div className="no-print bg-[#010736] text-white px-4 sm:px-6 py-3.5 rounded-2xl mb-6 shadow-navy-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 sticky top-4 z-40 border border-[#29437A]/40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#FFF3D0] text-[#010736] flex items-center justify-center shrink-0 shadow-xs">
            <Download className="w-5 h-5 text-[#010736]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                Download Analysis &amp; Print Report
              </h3>
              <span className="bg-[#29437A] text-[#FFF3D0] text-[10px] uppercase font-mono px-2 py-0.5 rounded font-bold">
                Client-Side Export
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Export complete evaluation: Scores, Skills, ATS, Job Match, Skill Gaps, and Improvements.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:text-white bg-white/10 hover:bg-white/15 rounded-xl transition-all cursor-pointer min-h-[40px]"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Dashboard</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleDownloadPdf}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold text-[#010736] bg-[#FFF3D0] hover:bg-[#ffeab3] rounded-xl transition-all shadow-xs cursor-pointer min-h-[40px]"
          >
            {downloadSuccess ? (
              <>
                <Check className="w-4 h-4 text-emerald-700" />
                <span className="text-emerald-900">Downloaded .PDF!</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4 text-[#010736]" />
                <span>Download PDF File</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white bg-[#29437A] hover:bg-[#1f3460] rounded-xl transition-all cursor-pointer min-h-[40px]"
            title="Open browser print dialog / Save as PDF"
          >
            <Printer className="w-3.5 h-3.5 text-[#FFF3D0]" />
            <span className="hidden sm:inline">Print / Browser PDF</span>
          </button>
        </div>
      </div>

      {/* Actual Printable Document Container */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-10 lg:p-12 shadow-navy-sm print:p-0 print:border-none print:shadow-none max-w-4xl mx-auto space-y-8 text-[#0D1B3D] print:text-black">
        {/* Document Header Banner */}
        <div className="border-b-2 border-[#010736] pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-5">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#FFF3D0] text-[#010736] text-[11px] font-bold uppercase tracking-wider font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-[#29437A]" />
              <span>Official AI Candidate Evaluation</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-[#010736]">
              Resume Analysis &amp; ATS Audit
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 font-mono">
              Document: <span className="font-bold text-[#010736]">{fileName || 'Resume.pdf'}</span> · Generated: {currentDate}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Overall Score Badge */}
            <div className="px-5 py-3 rounded-2xl bg-[#010736] text-white text-center shadow-navy-xs min-w-[110px]">
              <span className="text-[10px] uppercase tracking-wider text-[#FFF3D0] block font-mono font-bold">
                Recruiter Score
              </span>
              <span className="text-3xl font-black font-mono tracking-tight">
                {overallScore}<span className="text-sm text-slate-400 font-normal">/100</span>
              </span>
              <span className="text-xs block font-bold text-emerald-400 mt-0.5">
                {scoreGrade}
              </span>
            </div>

            {/* ATS Score Badge */}
            {atsAnalysis && (
              <div className="px-5 py-3 rounded-2xl border-2 border-[#010736] bg-slate-50/50 text-center min-w-[110px]">
                <span className="text-[10px] uppercase tracking-wider text-slate-500 block font-mono font-bold">
                  ATS Match
                </span>
                <span className="text-3xl font-black font-mono text-[#010736] tracking-tight">
                  {atsAnalysis.atsScore}<span className="text-sm text-slate-400 font-normal">/100</span>
                </span>
                <span className="text-xs block font-bold text-[#29437A] mt-0.5">
                  {atsAnalysis.atsGrade}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Section 1: Executive Verdict */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-6 rounded-xs bg-[#29437A]"></div>
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#010736] font-mono">
              1. Executive Recruiter Verdict &amp; Impressions
            </h2>
          </div>
          <div className="p-5 rounded-2xl bg-[#f8fafc] border border-slate-200 text-xs sm:text-sm leading-relaxed text-[#0D1B3D] border-l-4 border-l-[#29437A]">
            {scoreSummary}
          </div>
        </section>

        {/* Section 2: Core Dimension Ratings */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-6 rounded-xs bg-[#29437A]"></div>
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#010736] font-mono">
              2. Core Evaluation Dimensions
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            {[
              { name: 'Impact & Metrics', score: scoreBreakdown.impactAndMetrics },
              { name: 'Clarity & Formatting', score: scoreBreakdown.clarityAndFormatting },
              { name: 'Experience Relevance', score: scoreBreakdown.experienceRelevance },
              { name: 'Skills & Tech Depth', score: scoreBreakdown.skillsDepth },
            ].map((dim, idx) => (
              <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs">
                <span className="text-[11px] text-slate-500 uppercase block font-bold truncate">
                  {dim.name}
                </span>
                <span className="text-xl font-black font-mono text-[#010736] mt-1 block">
                  {dim.score}<span className="text-xs text-slate-400 font-normal">/100</span>
                </span>
                <div className="w-full bg-slate-100 h-2 rounded-full mt-2.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      dim.score >= 80
                        ? 'bg-emerald-600'
                        : dim.score >= 60
                        ? 'bg-[#29437A]'
                        : 'bg-amber-500'
                    }`}
                    style={{ width: `${dim.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 3: Skills Inventory */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-6 rounded-xs bg-[#29437A]"></div>
              <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#010736] font-mono">
                3. Skills Inventory ({skills.length} Categories Extracted)
              </h2>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {skills.map((skillCat, idx) => (
              <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                <span className="text-xs font-bold text-[#010736] block mb-2">
                  {skillCat.category}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {skillCat.items.map((item, sIdx) => (
                    <span
                      key={sIdx}
                      className="px-2.5 py-1 text-xs rounded-lg bg-white border border-slate-200 text-[#0D1B3D] font-medium"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 4: Key Strengths & Priority Fixes */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Strengths */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-6 rounded-xs bg-emerald-600"></div>
              <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-emerald-800 font-mono">
                4. Key Strengths ({strengths.length})
              </h2>
            </div>
            <div className="space-y-2.5">
              {strengths.map((s, idx) => (
                <div key={idx} className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/30 text-xs">
                  <div className="flex items-center gap-1.5 mb-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-bold text-[#010736]">{s.title}</span>
                  </div>
                  <p className="text-slate-700 leading-relaxed pl-5.5">{s.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Weaknesses / Improvements */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-6 rounded-xs bg-rose-600"></div>
              <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-rose-800 font-mono">
                5. Areas for Improvement ({weaknesses.length})
              </h2>
            </div>
            <div className="space-y-2.5">
              {weaknesses.map((w, idx) => (
                <div key={idx} className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/30 text-xs">
                  <div className="flex items-center gap-1.5 mb-1">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span className="font-bold text-[#010736]">{w.title}</span>
                  </div>
                  <p className="text-slate-700 leading-relaxed pl-5.5">{w.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 5: ATS Compatibility Audit */}
        {atsAnalysis && (
          <section className="space-y-4 pt-2">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-6 rounded-xs bg-[#29437A]"></div>
              <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#010736] font-mono">
                6. ATS Compatibility &amp; Machine Parsability
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                <span className="text-xs font-bold text-[#010736] block">File Formatting</span>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                  {atsAnalysis.formattingIssues.length === 0
                    ? '✓ Clean layout without unparseable tables or text boxes.'
                    : atsAnalysis.formattingIssues.map((f) => f.issue).join('; ')}
                </p>
              </div>
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                <span className="text-xs font-bold text-[#010736] block">Section Headings</span>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                  {atsAnalysis.sectionHeadingIssues.length === 0
                    ? '✓ Standard recognized headings (Experience, Education, Skills).'
                    : atsAnalysis.sectionHeadingIssues.map((h) => h.issue).join('; ')}
                </p>
              </div>
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                <span className="text-xs font-bold text-[#010736] block">Keyword Density</span>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                  {atsAnalysis.keywordUsage.length} primary technical &amp; domain terms indexed.
                </p>
              </div>
            </div>

            {atsAnalysis.missingKeywords && atsAnalysis.missingKeywords.length > 0 && (
              <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200 text-xs">
                <span className="font-bold text-amber-900 block mb-1">
                  High-Priority Missing Keywords to Add:
                </span>
                <p className="text-amber-800">
                  {atsAnalysis.missingKeywords.map((k) => `${k.keyword} (${k.importance})`).join(' · ')}
                </p>
              </div>
            )}
          </section>
        )}

        {/* Section 6: Target Job Match & Skill Gaps */}
        <section className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-6 rounded-xs bg-[#29437A]"></div>
              <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#010736] font-mono">
                7. Target Job Match &amp; Skill Gaps
              </h2>
            </div>
            {jobMatch && (
              <span className="text-xs font-bold font-mono text-[#010736] bg-[#FFF3D0] px-2.5 py-1 rounded-md">
                Match Score: {jobMatch.matchScore}/100 ({jobMatch.matchGrade})
              </span>
            )}
          </div>

          {jobMatch ? (
            <div className="space-y-3.5 text-xs">
              <div className="p-4 rounded-xl bg-blue-50/40 border border-blue-100">
                <span className="font-bold text-[#010736] block text-sm mb-1">
                  Target Role Alignment &amp; Match Verdict
                </span>
                <p className="text-slate-700 leading-relaxed">{jobMatch.matchSummary}</p>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-blue-200/50">
                  <div>
                    <span className="font-bold text-emerald-800 block mb-1">
                      Matched Skills ({jobMatch.matchingSkills.length}):
                    </span>
                    <span className="text-slate-700">
                      {jobMatch.matchingSkills.map((s) => s.skill).join(', ')}
                    </span>
                  </div>
                  <div>
                    <span className="font-bold text-rose-800 block mb-1">
                      Missing Qualifications ({jobMatch.missingSkills.length}):
                    </span>
                    <span className="text-slate-700">
                      {jobMatch.missingSkills.map((s) => `${s.skill} (${s.importance})`).join(', ')}
                    </span>
                  </div>
                </div>
              </div>

              {jobMatch.importantGaps && jobMatch.importantGaps.length > 0 && (
                <div className="space-y-2">
                  <span className="font-bold text-xs text-[#010736] block">Critical Skill Gaps &amp; Mitigation:</span>
                  {jobMatch.importantGaps.map((gap, idx) => (
                    <div key={idx} className="p-3 rounded-lg border border-slate-200 bg-white">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-100 text-rose-800">
                          {gap.severity}
                        </span>
                        <span className="font-bold text-[#010736]">{gap.area}</span>
                      </div>
                      <p className="text-slate-600 mb-1">{gap.gapDescription}</p>
                      <p className="text-xs text-[#29437A] font-semibold">Action to Bridge: {gap.mitigation}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
              <p>
                Target Job Match is active. Paste a specific job description in the Job Match tab to benchmark requirements, view matched skills vs gaps, and receive targeted tailoring tips.
              </p>
            </div>
          )}
        </section>

        {/* Section 7: AI Resume Improvements */}
        <section className="space-y-4 pt-2">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-6 rounded-xs bg-[#29437A]"></div>
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#010736] font-mono">
              8. AI Resume Improvements (Original → Enhanced)
            </h2>
          </div>

          {improvements ? (
            <div className="space-y-4 text-xs">
              {/* Summary */}
              {improvements.professionalSummary && (
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                  <span className="text-xs font-bold text-[#010736] block mb-2">
                    Professional Summary Enhancement
                  </span>
                  <div className="space-y-2">
                    <div className="p-3 rounded-lg bg-white border border-slate-200">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Original</span>
                      <p className="text-slate-600 italic">"{improvements.professionalSummary.original}"</p>
                    </div>
                    <div className="p-3 rounded-lg bg-[#FFF3D0]/30 border border-[#29437A]/30">
                      <span className="text-[10px] uppercase font-bold text-[#29437A] block mb-1">AI Improved</span>
                      <p className="text-[#010736] font-medium leading-relaxed">
                        {improvements.professionalSummary.improved}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Top Bullets */}
              {improvements.experienceBulletPoints && improvements.experienceBulletPoints.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-[#010736] block">
                    High-Impact Experience Bullet Rewrites:
                  </span>
                  {improvements.experienceBulletPoints.slice(0, 4).map((b, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1.5">
                      <span className="text-[11px] font-bold text-[#29437A] block">
                        {b.roleOrCompany} (Verb: {b.actionVerbUsed})
                      </span>
                      <p className="text-slate-500 line-through text-[11px]">
                        Original: {b.originalBullet}
                      </p>
                      <p className="text-[#010736] font-semibold text-xs leading-relaxed">
                        • {b.improvedBullet}
                      </p>
                      <p className="text-[11px] text-emerald-700 font-medium">
                        Measurability Tip: {b.measurabilityTip}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2.5 text-xs">
              <p className="text-slate-600">
                Strategic improvement recommendations from candidate audit:
              </p>
              {actionItems.slice(0, 4).map((imp, idx) => (
                <div key={idx} className="p-3 rounded-xl border border-slate-200 bg-slate-50">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-800">
                      {imp.priority} Priority
                    </span>
                    <span className="font-bold text-[#010736]">{imp.area}</span>
                  </div>
                  <p className="text-slate-700">{imp.suggestion}</p>
                  <p className="text-[11px] text-slate-500 mt-1 italic">Rationale: {imp.rationale}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Footer Note */}
        <div className="pt-6 border-t border-slate-200 text-[11px] text-slate-400 font-mono flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>AI Resume Analyzer · Verified Candidate Report</span>
          <span>Confidential · Strictly Grounded in Original Text</span>
        </div>
      </div>
    </div>
  );
};
