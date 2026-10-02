/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  matchJobWithGemini,
  JobMatchResult,
} from '../services/jobMatcher.ts';
import { AnalysisError } from '../services/resumeAnalyzer.ts';
import {
  SAMPLE_JOB_DESCRIPTIONS,
  SampleJobDescription,
} from '../data/sampleJobDescriptions.ts';
import {
  Target,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Check,
  XCircle,
  Briefcase,
  KeyRound,
  Clock,
  FileText,
  Loader2,
  Edit3,
  Compass,
  TrendingUp,
  Download,
  ArrowLeft,
  RotateCcw,
} from 'lucide-react';
import { SkillGapSection } from './SkillGapSection.tsx';

interface JobMatchSectionProps {
  resumeText: string;
  fileName: string;
  onViewGeneralDashboard: () => void;
  initialTab?: 'match' | 'skillGap';
  onDownloadPdf?: () => void;
  existingMatchResult?: JobMatchResult | null;
  onMatchResultChange?: (result: JobMatchResult) => void;
  onTabChange?: (tab: 'match' | 'skillGap') => void;
  onStartNewAnalysis?: () => void;
}

const MATCHING_STEPS = [
  'Ingesting job requirements, qualifications, and responsibilities...',
  'Extracting core skills, tools, and experience expectations from job posting...',
  'Cross-referencing candidate resume against job criteria...',
  'Calculating verified skill matches and missing prerequisite gaps...',
  'Generating tailored resume optimization recommendations...',
];

export const JobMatchSection: React.FC<JobMatchSectionProps> = ({
  resumeText,
  fileName,
  onViewGeneralDashboard,
  initialTab,
  onDownloadPdf,
  existingMatchResult,
  onMatchResultChange,
  onTabChange,
  onStartNewAnalysis,
}) => {
  const [jobDescription, setJobDescription] = useState<string>('');
  const [matchResult, setMatchResult] = useState<JobMatchResult | null>(existingMatchResult || null);
  const [activeResultTab, setActiveResultTab] = useState<'match' | 'skillGap'>(initialTab || 'match');
  const [isMatching, setIsMatching] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);

  React.useEffect(() => {
    if (existingMatchResult) {
      setMatchResult(existingMatchResult);
      setIsEditingJob(false);
    }
  }, [existingMatchResult]);

  React.useEffect(() => {
    if (initialTab) {
      setActiveResultTab(initialTab);
    }
  }, [initialTab]);

  const [matchingStepIndex, setMatchingStepIndex] = useState<number>(0);
  const [errorInfo, setErrorInfo] = useState<{
    message: string;
    isRateLimit?: boolean;
    retryAfterSeconds?: number;
  } | null>(null);
  const [isEditingJob, setIsEditingJob] = useState<boolean>(true);
  const [cooldownCountdown, setCooldownCountdown] = useState<number>(0);

  // Handle sample selection
  const handleLoadSample = (sample: SampleJobDescription) => {
    setJobDescription(sample.text);
    setErrorInfo(null);
  };

  // Run the comparison
  const handleRunMatch = async () => {
    if (!jobDescription.trim() || jobDescription.trim().length < 30) {
      setErrorInfo({
        message: 'Please paste a job description with at least 30 characters.',
      });
      return;
    }

    setIsMatching(true);
    setErrorInfo(null);
    setMatchingStepIndex(0);

    const stepInterval = setInterval(() => {
      setMatchingStepIndex((prev) => (prev < MATCHING_STEPS.length - 1 ? prev + 1 : prev));
    }, 1800);

    try {
      const result = await matchJobWithGemini(resumeText, jobDescription, fileName);
      setMatchResult(result);
      onMatchResultChange?.(result);
      setIsEditingJob(false);
    } catch (err: unknown) {
      if (err instanceof AnalysisError) {
        setErrorInfo({
          message: err.message,
          isRateLimit: err.isRateLimit,
          retryAfterSeconds: err.retryAfterSeconds,
        });
        if (err.isRateLimit) {
          startCooldown(err.retryAfterSeconds || 25);
        }
      } else {
        const msg = err instanceof Error ? err.message : String(err);
        const isRate =
          msg.toLowerCase().includes('quota') ||
          msg.toLowerCase().includes('resource_exhausted') ||
          msg.includes('429');
        setErrorInfo({
          message: msg,
          isRateLimit: isRate,
          retryAfterSeconds: isRate ? 25 : undefined,
        });
        if (isRate) {
          startCooldown(25);
        }
      }
    } finally {
      clearInterval(stepInterval);
      setIsMatching(false);
    }
  };

  const startCooldown = (seconds: number) => {
    setCooldownCountdown(seconds);
    const interval = setInterval(() => {
      setCooldownCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Top Header Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/90 shadow-navy-xs">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-[#010736] text-[#FFF3D0] flex items-center justify-center shrink-0 shadow-navy-xs">
            <Target className="w-5 h-5 text-[#FFF3D0]" />
          </div>
          <div className="truncate">
            <h2 className="text-base sm:text-lg font-bold text-[#010736] truncate">
              Job Description Matching
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-mono truncate">
              Targeted role alignment for {fileName}
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

          {matchResult && !isEditingJob && (
            <button
              type="button"
              onClick={() => setIsEditingJob(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-[#010736] bg-white hover:bg-slate-50 border border-slate-200 hover:border-[#29437A] rounded-xl transition-all cursor-pointer min-h-[40px]"
            >
              <Edit3 className="w-4 h-4 text-[#29437A]" />
              <span>Edit Job Description</span>
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
        </div>
      </div>

      {/* 1. Job Description Input Box */}
      {(isEditingJob || !matchResult) && (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-navy-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-[#010736]">
                Target Job Description
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                Paste the full job posting to evaluate your match score, skills alignment, and missing keywords.
              </p>
            </div>

            {/* Quick Sample Buttons */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs text-slate-400 font-medium">Presets:</span>
              {SAMPLE_JOB_DESCRIPTIONS.map((sample) => (
                <button
                  key={sample.id}
                  type="button"
                  onClick={() => handleLoadSample(sample)}
                  className="px-2.5 py-1 text-xs font-semibold bg-slate-50 hover:bg-slate-100 hover:border-[#29437A] text-[#010736] border border-slate-200 rounded-lg transition-all cursor-pointer"
                >
                  {sample.title.split(' ')[0]} {sample.title.split(' ')[1]}
                </button>
              ))}
            </div>
          </div>

          <div className="relative">
            <textarea
              value={jobDescription}
              onChange={(e) => {
                setJobDescription(e.target.value);
                if (errorInfo) setErrorInfo(null);
              }}
              rows={8}
              placeholder="Paste job title, responsibilities, requirements, and qualifications here..."
              className="w-full text-xs sm:text-sm font-sans text-slate-900 bg-slate-50/50 border border-slate-300 rounded-xl p-4 focus:outline-none focus:bg-white focus:border-[#29437A] focus:ring-2 focus:ring-[#29437A]/20 leading-relaxed placeholder:text-slate-400 transition-all resize-y"
            />

            <div className="mt-2.5 flex items-center justify-between text-xs sm:text-sm text-slate-500 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="font-mono tabular-nums">{jobDescription.trim().length} characters</span>
                <span aria-hidden="true" className="text-slate-300">·</span>
                <span className="font-mono tabular-nums">
                  {jobDescription.trim() ? jobDescription.trim().split(/\s+/).length : 0} words
                </span>
              </div>

              {jobDescription.trim().length > 0 && (
                <button
                  type="button"
                  onClick={() => setJobDescription('')}
                  className="text-xs text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                >
                  Clear text
                </button>
              )}
            </div>
          </div>

          {/* Error Notice */}
          {errorInfo && (
            <div className="mt-4 p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs sm:text-sm text-rose-900">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1 leading-relaxed">
                  <span className="font-bold">
                    {errorInfo.isRateLimit ? 'Notice: ' : 'Comparison Notice: '}
                  </span>
                  <span>
                    {errorInfo.isRateLimit
                      ? 'Free AI usage limit reached. Please try again later.'
                      : errorInfo.message}
                  </span>
                  {errorInfo.isRateLimit && cooldownCountdown > 0 && (
                    <span className="block mt-1 font-mono text-xs text-rose-700">
                      Free tier cooldown: {cooldownCountdown}s remaining...
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Action Button */}
          <div className="mt-6 flex items-center justify-end gap-3 pt-5 border-t border-slate-100">
            {matchResult && (
              <button
                type="button"
                onClick={() => setIsEditingJob(false)}
                className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer min-h-[44px]"
              >
                Cancel
              </button>
            )}

            <button
              type="button"
              disabled={isMatching || !jobDescription.trim() || cooldownCountdown > 0}
              onClick={handleRunMatch}
              className={`inline-flex items-center justify-center gap-2.5 px-6 py-3 text-xs sm:text-sm font-semibold text-white rounded-xl transition-all shadow-navy-xs min-h-[44px] ${
                isMatching || !jobDescription.trim() || cooldownCountdown > 0
                  ? 'bg-slate-300 cursor-not-allowed text-slate-500'
                  : 'bg-[#010736] hover:bg-[#0D1B3D] cursor-pointer'
              }`}
            >
              {isMatching ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Matching with Resume...</span>
                </>
              ) : cooldownCountdown > 0 ? (
                <>
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span>Wait {cooldownCountdown}s</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-[#FFF3D0]" />
                  <span>Compare with Resume</span>
                  <ArrowRight className="w-4 h-4 text-white/70" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* 2. Loading State */}
      {isMatching && (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-8 sm:p-12 shadow-navy-xs text-center max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-[#010736] text-[#FFF3D0] flex items-center justify-center mx-auto mb-4 shadow-navy-sm animate-pulse">
            <Target className="w-7 h-7" />
          </div>

          <h3 className="text-lg sm:text-xl font-bold text-[#010736] tracking-tight">
            Comparing Resume to Job Description
          </h3>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 font-mono">
            {fileName}
          </p>

          <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-100 max-w-sm mx-auto">
            <div className="flex items-center gap-3 text-left">
              <Loader2 className="w-5 h-5 text-[#29437A] animate-spin shrink-0" />
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-semibold text-slate-900">
                  {MATCHING_STEPS[matchingStepIndex]}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Strictly cross-referencing candidate text with job requirements
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-center gap-1.5">
              {MATCHING_STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === matchingStepIndex
                      ? 'w-6 bg-[#010736]'
                      : i < matchingStepIndex
                      ? 'w-2 bg-emerald-500'
                      : 'w-2 bg-slate-200'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. Match Results View */}
      {matchResult && !isMatching && (
        <div className="space-y-6 sm:space-y-8">
          {/* Sub Navigation between Match Matrix and Skill Gap Analysis */}
          {matchResult.skillGapAnalysis && (
            <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-2xl w-fit border border-slate-200 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  setActiveResultTab('match');
                  onTabChange?.('match');
                }}
                className={`inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer min-h-[38px] ${
                  activeResultTab === 'match'
                    ? 'bg-[#010736] text-white shadow-navy-xs'
                    : 'text-slate-600 hover:text-[#010736]'
                }`}
              >
                <Target className={`w-4 h-4 ${activeResultTab === 'match' ? 'text-[#FFF3D0]' : 'text-[#29437A]'}`} />
                <span>Job Match Score &amp; Matrix</span>
                <span className={`font-mono text-xs px-2 py-0.5 rounded font-bold ${
                  activeResultTab === 'match'
                    ? 'bg-[#FFF3D0] text-[#010736]'
                    : 'bg-white text-slate-700 border border-slate-200'
                }`}>
                  {matchResult.matchScore}/100
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveResultTab('skillGap');
                  onTabChange?.('skillGap');
                }}
                className={`inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer min-h-[38px] ${
                  activeResultTab === 'skillGap'
                    ? 'bg-[#010736] text-white shadow-navy-xs'
                    : 'text-slate-600 hover:text-[#010736]'
                }`}
              >
                <Compass className={`w-4 h-4 ${activeResultTab === 'skillGap' ? 'text-[#FFF3D0]' : 'text-[#29437A]'}`} />
                <span>Skill Gap Analysis &amp; Roadmap</span>
                <span className={`font-mono text-xs px-2 py-0.5 rounded font-bold ${
                  activeResultTab === 'skillGap'
                    ? 'bg-[#FFF3D0] text-[#010736]'
                    : 'bg-white text-purple-700 border border-purple-200'
                }`}>
                  {matchResult.skillGapAnalysis.missingSkills.length} Gaps
                </span>
              </button>
            </div>
          )}

          {activeResultTab === 'skillGap' && matchResult.skillGapAnalysis ? (
            <SkillGapSection
              skillGap={matchResult.skillGapAnalysis}
              onJumpToJobMatch={() => setActiveResultTab('match')}
            />
          ) : (
            <>
              {/* Main Score & Fit Summary */}
              <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-9 shadow-navy-xs">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  {/* Dial Gauge */}
                  <div className="lg:col-span-4 flex flex-col items-center justify-center p-7 rounded-2xl bg-slate-50/80 border border-slate-200 text-center">
                    <span className="text-xs sm:text-sm font-bold text-[#29437A] uppercase tracking-wider mb-4">
                      Job Match Score
                    </span>

                    <div className="w-32 h-32 rounded-full border-4 border-[#010736] bg-white flex flex-col items-center justify-center shadow-navy-xs">
                      <span className="text-5xl font-extrabold font-mono text-[#010736] tabular-nums leading-none">
                        {matchResult.matchScore}
                      </span>
                      <span className="text-xs font-semibold text-slate-500 mt-1.5">/ 100</span>
                    </div>

                    <div className="mt-4">
                      <span className="text-xs sm:text-sm font-extrabold text-[#010736] px-3.5 py-1 rounded-full bg-[#FFF3D0] border border-[#29437A]/30">
                        {matchResult.matchGrade}
                      </span>
                    </div>

                    <p className="mt-2.5 text-xs text-slate-500 font-medium">
                      Targeted role compatibility
                    </p>
                  </div>

                  {/* Match Summary & Matrix */}
                  <div className="lg:col-span-8 space-y-5">
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold text-[#29437A] uppercase tracking-wider">
                        Role Alignment Summary
                      </h3>
                      <p className="mt-2 text-base sm:text-lg text-slate-700 leading-relaxed font-normal">
                        {matchResult.matchSummary}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3.5 text-xs sm:text-sm">
                      <div className="p-3.5 rounded-xl bg-slate-50/90 border border-slate-200/80">
                        <span className="text-xs text-slate-500 font-medium block">Matched Skills</span>
                        <span className="text-sm font-bold text-emerald-700 font-mono tabular-nums mt-1 block">
                          {matchResult.matchingSkills.length} verified
                        </span>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-50/90 border border-slate-200/80">
                        <span className="text-xs text-slate-500 font-medium block">Missing Skills</span>
                        <span
                          className={`text-sm font-bold font-mono tabular-nums mt-1 block ${
                            matchResult.missingSkills.length === 0
                              ? 'text-emerald-700'
                              : 'text-rose-700'
                          }`}
                        >
                          {matchResult.missingSkills.length} missing
                        </span>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-50/90 border border-slate-200/80">
                        <span className="text-xs text-slate-500 font-medium block">Matched Keywords</span>
                        <span className="text-sm font-bold text-[#010736] font-mono tabular-nums mt-1 block">
                          {matchResult.matchingKeywords.length} terms
                        </span>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-50/90 border border-slate-200/80">
                        <span className="text-xs text-slate-500 font-medium block">Critical Gaps</span>
                        <span
                          className={`text-sm font-bold font-mono tabular-nums mt-1 block ${
                            matchResult.importantGaps.length === 0
                              ? 'text-emerald-700'
                              : 'text-amber-700'
                          }`}
                        >
                          {matchResult.importantGaps.length} noted
                        </span>
                      </div>
                    </div>

                    {matchResult.skillGapAnalysis && (
                      <div className="pt-2">
                        <div className="p-4 rounded-2xl bg-[#FFF3D0]/70 border border-[#29437A]/25 flex items-center justify-between gap-3 flex-wrap">
                          <div className="flex items-center gap-2.5 text-xs sm:text-sm text-[#010736]">
                            <Compass className="w-5 h-5 text-[#29437A] shrink-0" />
                            <span>
                              Want to bridge <strong>{matchResult.skillGapAnalysis.missingSkills.length} missing skills</strong> and get step-by-step project roadmaps?
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setActiveResultTab('skillGap')}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs sm:text-sm font-bold text-white bg-[#010736] hover:bg-[#0D1B3D] rounded-xl transition-all cursor-pointer shadow-navy-xs"
                          >
                            <span>Explore Skill Gap Roadmap</span>
                            <ArrowRight className="w-3.5 h-3.5 text-[#FFF3D0]" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 2. Skills Comparison (Matched vs Missing Skills) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Matching Skills */}
                <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-navy-xs flex flex-col">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-[#010736]">
                        Matching Skills ({matchResult.matchingSkills.length})
                      </h3>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-600 mb-4 leading-relaxed">
                    Skills required or preferred by the job that are evidenced in your resume:
                  </p>

                  {matchResult.matchingSkills.length === 0 ? (
                    <div className="p-4 rounded-xl bg-slate-50 text-xs sm:text-sm text-slate-500 italic">
                      No direct skill matches identified for this job description.
                    </div>
                  ) : (
                    <div className="space-y-3 flex-1">
                      {matchResult.matchingSkills.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 rounded-xl bg-emerald-50/40 border border-emerald-100 text-xs sm:text-sm"
                        >
                          <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                            <span className="font-bold text-[#010736] flex items-center gap-2">
                              <Check className="w-4 h-4 text-emerald-600" />
                              <span>{item.skill}</span>
                            </span>
                            <span className="text-[10px] font-bold uppercase bg-white px-2 py-0.5 rounded-md border border-emerald-200 text-emerald-800">
                              {item.category}
                            </span>
                          </div>
                          <p className="text-slate-600 text-xs leading-relaxed mt-1">
                            <span className="font-semibold text-slate-800">Evidenced in resume: </span>
                            {item.foundInResume}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Missing Skills */}
                <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-navy-xs flex flex-col">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center">
                      <XCircle className="w-5 h-5 text-rose-600" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-[#010736]">
                        Missing Skills ({matchResult.missingSkills.length})
                      </h3>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-600 mb-4 leading-relaxed">
                    Key technologies or qualifications listed in the job description that are missing from your resume:
                  </p>

                  {matchResult.missingSkills.length === 0 ? (
                    <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-sm text-emerald-900 flex items-center gap-3 flex-1">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      <span>Outstanding! All required skills from this job description were found in your resume.</span>
                    </div>
                  ) : (
                    <div className="space-y-3 flex-1">
                      {matchResult.missingSkills.map((item, idx) => {
                        const isRequired = item.importance.toLowerCase() === 'required';
                        return (
                          <div
                            key={idx}
                            className="p-3.5 rounded-xl bg-rose-50/40 border border-rose-100 text-xs sm:text-sm"
                          >
                            <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                              <span className="font-bold text-[#010736] flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-rose-600" />
                                <span>{item.skill}</span>
                              </span>
                              <span
                                className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border ${
                                  isRequired
                                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                                    : 'bg-amber-50 text-amber-700 border-amber-200'
                                }`}
                              >
                                {item.importance}
                              </span>
                            </div>
                            <p className="text-slate-600 text-xs leading-relaxed mt-1">
                              <span className="font-semibold text-slate-800">Role Context: </span>
                              {item.contextInJob}
                            </p>
                            {item.advice && (
                              <p className="text-slate-600 text-xs mt-1.5 pt-1.5 border-t border-rose-100/70 bg-white/70 p-2 rounded-lg">
                                <span className="font-bold text-[#010736]">Tip: </span>
                                {item.advice}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* 3. Keywords Comparison */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Matching Keywords */}
                <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-navy-xs">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-xl bg-[#010736]/5 text-[#29437A] flex items-center justify-center">
                      <KeyRound className="w-4 h-4 text-[#29437A]" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-[#010736]">
                        Matching Keywords ({matchResult.matchingKeywords.length})
                      </h3>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {matchResult.matchingKeywords.map((kw, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800 shadow-navy-xs"
                      >
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="font-semibold">{kw.keyword}</span>
                        <span className="text-[11px] text-slate-400 font-mono">({kw.category})</span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Missing Keywords */}
                <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-navy-xs">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                      <KeyRound className="w-4 h-4 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-[#010736]">
                        Missing Keywords ({matchResult.missingKeywords.length})
                      </h3>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    {matchResult.missingKeywords.map((kw, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-slate-50/80 border border-slate-100 text-xs sm:text-sm flex items-baseline justify-between gap-2"
                      >
                        <div>
                          <span className="font-bold text-[#010736]">{kw.keyword}</span>
                          <p className="text-slate-600 text-xs mt-0.5">{kw.reason}</p>
                        </div>
                        <span className="text-[10px] uppercase font-bold font-mono text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 shrink-0">
                          {kw.importance}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 4. Relevant Experience Highlights */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-navy-xs">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                    <Briefcase className="w-4 h-4 text-[#29437A]" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-[#010736]">
                      Relevant Experience Highlights
                    </h3>
                  </div>
                </div>

                <div className="space-y-4">
                  {matchResult.relevantExperience.map((exp, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm shadow-navy-xs"
                    >
                      <div className="flex items-baseline justify-between gap-2 mb-1.5">
                        <span className="font-bold text-sm sm:text-base text-[#010736]">
                          {exp.roleOrProject}
                        </span>
                        <span className="text-xs font-bold text-[#29437A] bg-slate-100 px-2 py-0.5 rounded">
                          Direct Fit
                        </span>
                      </div>
                      <p className="text-slate-800 text-xs sm:text-sm font-semibold leading-relaxed">
                        {exp.alignment}
                      </p>
                      <p className="mt-2 text-slate-600 text-xs bg-slate-50 p-3 rounded-lg border border-slate-100 italic leading-relaxed">
                        "{exp.evidence}"
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 5. Important Gaps & Mitigations */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-navy-xs">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-[#010736]">
                      Important Role Gaps &amp; Risk Factors
                    </h3>
                  </div>
                </div>

                {matchResult.importantGaps.length === 0 ? (
                  <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 text-sm text-emerald-900 flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>No severe qualification gaps identified between your resume and this job description.</span>
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {matchResult.importantGaps.map((gap, idx) => {
                      const isCritical = gap.severity.toLowerCase() === 'critical';
                      return (
                        <div
                          key={idx}
                          className="p-4 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm shadow-navy-xs"
                        >
                          <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                            <span className="font-bold text-[#010736] text-sm sm:text-base">
                              {gap.area}
                            </span>
                            <span
                              className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border ${
                                isCritical
                                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}
                            >
                              {gap.severity} Gap
                            </span>
                          </div>
                          <p className="text-slate-700 text-xs sm:text-sm leading-relaxed">
                            {gap.gapDescription}
                          </p>
                          <div className="mt-2.5 pt-2 border-t border-slate-100 text-xs text-slate-600">
                            <span className="font-bold text-[#010736]">Mitigation Strategy: </span>
                            {gap.mitigation}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 6. Specific Tailored Recommendations */}
              <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-navy-xs">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-8 h-8 rounded-xl bg-[#010736]/5 text-[#29437A] flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-[#29437A]" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-xl font-bold text-[#010736]">
                      Targeted Resume Tailoring Recommendations
                    </h3>
                  </div>
                </div>

                <div className="space-y-3.5">
                  {matchResult.recommendations.map((rec, idx) => {
                    const p = rec.priority.toLowerCase();
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
                            className={`font-bold uppercase text-[10px] px-2 py-0.5 rounded-md border ${badgeColor}`}
                          >
                            {rec.priority}
                          </span>
                          <span className="font-bold text-[#010736] text-sm sm:text-base">
                            Target Section: {rec.targetSection}
                          </span>
                        </div>

                        <p className="text-slate-800 text-sm sm:text-base leading-relaxed mt-1.5">
                          {rec.recommendation}
                        </p>

                        <p className="mt-2.5 text-slate-600 text-xs sm:text-sm leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                          <span className="font-bold text-[#010736]">Why this matters: </span>
                          {rec.rationale}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
