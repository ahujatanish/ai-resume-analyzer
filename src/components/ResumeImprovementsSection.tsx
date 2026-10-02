/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ResumeImprovementsResult,
  improveResumeWithGemini,
} from '../services/resumeImprover.ts';
import { AnalysisError } from '../services/resumeAnalyzer.ts';
import { SAMPLE_JOB_DESCRIPTIONS, SampleJobDescription } from '../data/sampleJobDescriptions.ts';
import {
  Sparkles,
  ArrowRight,
  Check,
  Copy,
  Briefcase,
  FileText,
  FolderGit2,
  Wrench,
  Zap,
  TrendingUp,
  Tag,
  Loader2,
  RotateCcw,
  Target,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  Download,
  ArrowLeft,
} from 'lucide-react';

interface ResumeImprovementsSectionProps {
  resumeText: string;
  fileName: string;
  initialJobDescription?: string;
  onViewGeneralDashboard: () => void;
  onDownloadPdf?: () => void;
  existingImprovements?: ResumeImprovementsResult | null;
  onImprovementsChange?: (result: ResumeImprovementsResult) => void;
  onStartNewAnalysis?: () => void;
}

type ImprovementTab =
  | 'all'
  | 'summary'
  | 'bullets'
  | 'projects'
  | 'skills'
  | 'verbs'
  | 'measurable'
  | 'keywords';

const IMPROVEMENT_STEPS = [
  'Auditing resume text against executive resume standards...',
  'Extracting original statements without inventing new facts...',
  'Elevating passive phrasing with high-impact power verbs...',
  'Structuring achievements with quantifiable result frameworks...',
  'Organizing skills for ATS parsing and recruiter readability...',
  'Finalizing Original → Improved side-by-side enhancements...',
];

export const ResumeImprovementsSection: React.FC<ResumeImprovementsSectionProps> = ({
  resumeText,
  fileName,
  initialJobDescription = '',
  onViewGeneralDashboard,
  onDownloadPdf,
  existingImprovements,
  onImprovementsChange,
  onStartNewAnalysis,
}) => {
  const [jobDescription, setJobDescription] = useState<string>(initialJobDescription);
  const [showJobInput, setShowJobInput] = useState<boolean>(!initialJobDescription);
  const [improvements, setImprovements] = useState<ResumeImprovementsResult | null>(existingImprovements || null);
  const [isImproving, setIsImproving] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);

  React.useEffect(() => {
    if (existingImprovements) {
      setImprovements(existingImprovements);
    }
  }, [existingImprovements]);
  const [improvementStepIndex, setImprovementStepIndex] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<ImprovementTab>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [errorInfo, setErrorInfo] = useState<{
    message: string;
    isRateLimit?: boolean;
    retryAfterSeconds?: number;
  } | null>(null);
  const [cooldownCountdown, setCooldownCountdown] = useState<number>(0);

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

  const handleCopyText = async (text: string, id: string) => {
    const cleanText = text.trim();
    let succeeded = false;

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(cleanText);
        succeeded = true;
      }
    } catch {
      // Fallback below
    }

    if (!succeeded) {
      try {
        const ta = document.createElement('textarea');
        ta.value = cleanText;
        ta.style.position = 'fixed';
        ta.style.top = '0';
        ta.style.left = '0';
        ta.style.opacity = '0';
        ta.setAttribute('readonly', '');
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        ta.setSelectionRange(0, 99999);
        succeeded = document.execCommand('copy');
        document.body.removeChild(ta);
      } catch (err) {
        console.error('Failed to copy text', err);
      }
    }

    if (succeeded) {
      setCopiedId(id);
      setTimeout(() => {
        setCopiedId((curr) => (curr === id ? null : curr));
      }, 2000);
    }
  };

  const handleGenerateImprovements = async () => {
    setIsImproving(true);
    setErrorInfo(null);
    setImprovementStepIndex(0);

    const stepInterval = setInterval(() => {
      setImprovementStepIndex((prev) =>
        prev < IMPROVEMENT_STEPS.length - 1 ? prev + 1 : prev
      );
    }, 1700);

    try {
      const result = await improveResumeWithGemini(
        resumeText,
        jobDescription.trim() || undefined,
        fileName
      );
      setImprovements(result);
      onImprovementsChange?.(result);
      setShowJobInput(false);
    } catch (err: unknown) {
      if (err instanceof AnalysisError) {
        setErrorInfo({
          message: err.message,
          isRateLimit: err.isRateLimit,
          retryAfterSeconds: err.retryAfterSeconds,
        });
        if (err.isRateLimit) {
          startCooldown(err.retryAfterSeconds || 30);
        }
      } else {
        const msg = err instanceof Error ? err.message : String(err);
        const isRate =
          msg.toLowerCase().includes('quota') ||
          msg.toLowerCase().includes('resource_exhausted') ||
          msg.includes('429');
        setErrorInfo({
          message: isRate ? 'Free AI usage limit reached. Please try again later.' : msg,
          isRateLimit: isRate,
          retryAfterSeconds: isRate ? 30 : undefined,
        });
        if (isRate) {
          startCooldown(30);
        }
      }
    } finally {
      clearInterval(stepInterval);
      setIsImproving(false);
    }
  };

  // Compile clean improved text of all improved sections without markdown noise or UI labels
  const handleCopyAllImprovements = () => {
    if (!improvements) return;

    const sections: string[] = [];

    // 1. Professional Summary
    if (improvements.professionalSummary?.improved) {
      sections.push(improvements.professionalSummary.improved.trim());
    }

    // 2. Experience Bullets
    if (improvements.experienceBulletPoints?.length > 0) {
      const bulletsText = improvements.experienceBulletPoints
        .map((b) => b.improvedBullet.trim())
        .join('\n');
      sections.push(bulletsText);
    }

    // 3. Projects
    if (improvements.projectDescriptions?.length > 0) {
      const projectsText = improvements.projectDescriptions
        .map((p) => `${p.projectTitle}\n${p.improvedDescription.trim()}`)
        .join('\n\n');
      sections.push(projectsText);
    }

    // 4. Skills
    if (improvements.skillsSection?.improvedCategorizedSkills?.length > 0) {
      const skillsText = improvements.skillsSection.improvedCategorizedSkills
        .map((cat) => `${cat.category}: ${cat.skills.join(', ')}`)
        .join('\n');
      sections.push(skillsText);
    }

    const cleanImprovedResumeText = sections.join('\n\n');
    handleCopyText(cleanImprovedResumeText, 'copy-all');
  };

  const handleSelectSampleJob = (sample: SampleJobDescription) => {
    setJobDescription(sample.text);
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Top Banner & Context */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-9 shadow-navy-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-[#010736] text-[#FFF3D0] flex items-center justify-center shrink-0 shadow-navy-xs">
              <Sparkles className="w-6 h-6 text-[#FFF3D0]" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-lg sm:text-xl font-bold text-[#010736]">
                  AI Resume Improvements
                </h2>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#010736] bg-[#FFF3D0] px-3 py-1 rounded-full border border-[#29437A]/30">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#29437A]" />
                  <span>Strictly Truthful · Zero Fabrication</span>
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                Elevates passive phrasing into executive power verbs, applies measurable frameworks, and shows side-by-side Original → Improved comparisons.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            {onDownloadPdf && (
              <button
                type="button"
                onClick={() => {
                  onDownloadPdf();
                  setDownloadSuccess(true);
                  setTimeout(() => setDownloadSuccess(false), 3000);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold text-[#010736] bg-[#FFF3D0] hover:bg-[#ffeab3] border border-[#29437A]/30 rounded-xl transition-all shadow-navy-xs cursor-pointer min-h-[40px]"
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

            {improvements && (
              <button
                type="button"
                onClick={handleCopyAllImprovements}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold text-white bg-[#010736] hover:bg-[#0D1B3D] rounded-xl transition-all shadow-navy-xs cursor-pointer min-h-[40px]"
                title="Copy all improved sections to clipboard"
              >
                {copiedId === 'copy-all' ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" />
                    <span>Copied All Improvements!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-[#FFF3D0]" />
                    <span>Copy All Improvements</span>
                  </>
                )}
              </button>
            )}

            {onViewGeneralDashboard && (
              <button
                type="button"
                onClick={onViewGeneralDashboard}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-[#010736] bg-white hover:bg-slate-50 border border-slate-200 hover:border-[#29437A] rounded-xl transition-all cursor-pointer min-h-[40px]"
                title="Return to comprehensive resume analysis"
              >
                <ArrowLeft className="w-4 h-4 text-[#29437A]" />
                <span>Back to Resume Analysis</span>
              </button>
            )}

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
              onClick={() => setShowJobInput((prev) => !prev)}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-[#010736] bg-white hover:bg-slate-50 border border-slate-200 hover:border-[#29437A] rounded-xl transition-all cursor-pointer min-h-[40px]"
            >
              <Target className="w-4 h-4 text-[#29437A]" />
              <span>{showJobInput ? 'Hide Job Target' : 'Tailor to Job Description'}</span>
            </button>
          </div>
        </div>

        {/* Optional Job Description Input */}
        {showJobInput && (
          <div className="mt-5 pt-5 border-t border-slate-100 space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <label className="text-xs sm:text-sm font-bold text-[#010736] block">
                  Target Job Description (Optional)
                </label>
                <p className="text-xs text-slate-500 mt-0.5">
                  Paste a job description to tailor action verbs, skills organization, and keywords specifically for the role.
                </p>
              </div>

              {/* Sample presets */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-400 font-medium">Presets:</span>
                {SAMPLE_JOB_DESCRIPTIONS.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleSelectSampleJob(s)}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-[#010736] font-semibold transition-colors cursor-pointer border border-slate-200"
                  >
                    {s.title.split(' ')[1] || s.title}
                  </button>
                ))}
              </div>
            </div>

            <textarea
              rows={3}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste target job description here..."
              className="w-full text-xs font-mono p-3.5 rounded-xl border border-slate-300 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-[#29437A] focus:ring-2 focus:ring-[#29437A]/20 transition-all resize-y"
            />
          </div>
        )}

        {/* Prompt Button when no improvements yet */}
        {!improvements && !isImproving && (
          <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="text-xs sm:text-sm text-slate-600">
              Ready to generate Original → Improved versions for Summary, Experience Bullets, Projects, and Skills.
            </div>

            <button
              type="button"
              disabled={isImproving || cooldownCountdown > 0}
              onClick={handleGenerateImprovements}
              className={`inline-flex items-center justify-center gap-2.5 px-6 py-3 text-xs sm:text-sm font-semibold text-white rounded-xl transition-all shadow-navy-xs min-h-[44px] ${
                isImproving || cooldownCountdown > 0
                  ? 'bg-slate-400 cursor-not-allowed'
                  : 'bg-[#010736] hover:bg-[#0D1B3D] cursor-pointer'
              }`}
            >
              <Sparkles className="w-4 h-4 text-[#FFF3D0]" />
              <span>
                {cooldownCountdown > 0
                  ? `Cooldown (${cooldownCountdown}s)`
                  : 'Generate AI Resume Improvements'}
              </span>
              <ArrowRight className="w-4 h-4 text-white/70" />
            </button>
          </div>
        )}

        {/* Error Notice */}
        {errorInfo && (
          <div className="mt-4 p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs sm:text-sm text-rose-900">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">
                <span className="font-bold">
                  {errorInfo.isRateLimit ? 'Notice: ' : 'Improvement Error: '}
                </span>
                <span>{errorInfo.message}</span>
                {errorInfo.isRateLimit && cooldownCountdown > 0 && (
                  <span className="block mt-1 font-mono text-xs text-rose-700">
                    Free tier cooldown: {cooldownCountdown}s remaining...
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. Loading State */}
      {isImproving && (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-8 sm:p-12 shadow-navy-xs text-center max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-[#010736] text-[#FFF3D0] flex items-center justify-center mx-auto mb-4 shadow-navy-sm animate-pulse">
            <Sparkles className="w-7 h-7" />
          </div>

          <h3 className="text-lg sm:text-xl font-bold text-[#010736] tracking-tight">
            Polishing &amp; Elevating Your Resume
          </h3>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 font-mono">
            {fileName}
          </p>

          <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-100 max-w-sm mx-auto">
            <div className="flex items-center gap-3 text-left">
              <Loader2 className="w-5 h-5 text-[#29437A] animate-spin shrink-0" />
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-semibold text-slate-900">
                  {IMPROVEMENT_STEPS[improvementStepIndex]}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Only improving facts present in resume — zero fabrication
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-center gap-1.5">
              {IMPROVEMENT_STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === improvementStepIndex
                      ? 'w-6 bg-[#010736]'
                      : i < improvementStepIndex
                      ? 'w-2 bg-emerald-500'
                      : 'w-2 bg-slate-200'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. Results View */}
      {improvements && !isImproving && (
        <div className="space-y-6 sm:space-y-8">
          {/* Strategy Overview Card */}
          <div className="p-5 sm:p-6 rounded-2xl bg-[#010736] text-white shadow-navy-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-white/10 text-[#FFF3D0] flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5" />
              </div>
              <div className="text-xs sm:text-base leading-relaxed text-slate-200">
                <span className="font-bold text-white mr-2">Improvement Strategy:</span>
                {improvements.overview}
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
              <button
                type="button"
                onClick={handleCopyAllImprovements}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-bold text-[#010736] bg-[#FFF3D0] hover:bg-[#ffeab3] rounded-xl transition-all shadow-navy-xs cursor-pointer min-h-[38px]"
                title="Copy all improved sections"
              >
                {copiedId === 'copy-all' ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-700" />
                    <span className="text-emerald-900 font-bold">Copied All!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-[#010736]" />
                    <span>Copy All Improvements</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleGenerateImprovements}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white bg-white/15 hover:bg-white/25 rounded-xl transition-all cursor-pointer min-h-[38px]"
              >
                <RotateCcw className="w-4 h-4 text-[#FFF3D0]" />
                <span>Regenerate</span>
              </button>
            </div>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 rounded-2xl w-fit border border-slate-200 max-w-full overflow-x-auto scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap min-h-[38px] ${
                activeTab === 'all'
                  ? 'bg-[#010736] text-white shadow-navy-xs'
                  : 'text-slate-600 hover:text-[#010736]'
              }`}
            >
              <Layers className={`w-4 h-4 ${activeTab === 'all' ? 'text-[#FFF3D0]' : 'text-[#29437A]'}`} />
              <span>All Improvements</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('summary')}
              className={`inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap min-h-[38px] ${
                activeTab === 'summary'
                  ? 'bg-[#010736] text-white shadow-navy-xs'
                  : 'text-slate-600 hover:text-[#010736]'
              }`}
            >
              <FileText className={`w-4 h-4 ${activeTab === 'summary' ? 'text-[#FFF3D0]' : 'text-[#29437A]'}`} />
              <span>Summary</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('bullets')}
              className={`inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap min-h-[38px] ${
                activeTab === 'bullets'
                  ? 'bg-[#010736] text-white shadow-navy-xs'
                  : 'text-slate-600 hover:text-[#010736]'
              }`}
            >
              <Briefcase className={`w-4 h-4 ${activeTab === 'bullets' ? 'text-[#FFF3D0]' : 'text-[#29437A]'}`} />
              <span>Experience Bullets ({improvements.experienceBulletPoints.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('projects')}
              className={`inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap min-h-[38px] ${
                activeTab === 'projects'
                  ? 'bg-[#010736] text-white shadow-navy-xs'
                  : 'text-slate-600 hover:text-[#010736]'
              }`}
            >
              <FolderGit2 className={`w-4 h-4 ${activeTab === 'projects' ? 'text-[#FFF3D0]' : 'text-[#29437A]'}`} />
              <span>Projects ({improvements.projectDescriptions.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('skills')}
              className={`inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap min-h-[38px] ${
                activeTab === 'skills'
                  ? 'bg-[#010736] text-white shadow-navy-xs'
                  : 'text-slate-600 hover:text-[#010736]'
              }`}
            >
              <Wrench className={`w-4 h-4 ${activeTab === 'skills' ? 'text-[#FFF3D0]' : 'text-[#29437A]'}`} />
              <span>Skills Section</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('verbs')}
              className={`inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap min-h-[38px] ${
                activeTab === 'verbs'
                  ? 'bg-[#010736] text-white shadow-navy-xs'
                  : 'text-slate-600 hover:text-[#010736]'
              }`}
            >
              <Zap className={`w-4 h-4 ${activeTab === 'verbs' ? 'text-[#FFF3D0]' : 'text-[#29437A]'}`} />
              <span>Power Action Verbs ({improvements.actionVerbUpgrades.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('measurable')}
              className={`inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap min-h-[38px] ${
                activeTab === 'measurable'
                  ? 'bg-[#010736] text-white shadow-navy-xs'
                  : 'text-slate-600 hover:text-[#010736]'
              }`}
            >
              <TrendingUp className={`w-4 h-4 ${activeTab === 'measurable' ? 'text-[#FFF3D0]' : 'text-[#29437A]'}`} />
              <span>Make Measurable ({improvements.measurableAchievementSuggestions.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('keywords')}
              className={`inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap min-h-[38px] ${
                activeTab === 'keywords'
                  ? 'bg-[#010736] text-white shadow-navy-xs'
                  : 'text-slate-600 hover:text-[#010736]'
              }`}
            >
              <Tag className={`w-4 h-4 ${activeTab === 'keywords' ? 'text-[#FFF3D0]' : 'text-[#29437A]'}`} />
              <span>Keywords ({improvements.keywordEnhancements.length})</span>
            </button>
          </div>

          {/* SECTION 1: PROFESSIONAL SUMMARY */}
          {(activeTab === 'all' || activeTab === 'summary') && (
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-navy-xs">
              <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#010736]/5 text-[#29437A] flex items-center justify-center">
                    <FileText className="w-4 h-4 text-[#29437A]" />
                  </div>
                  <h3 className="text-base sm:text-xl font-bold text-[#010736]">
                    Professional Summary Enhancement
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    handleCopyText(
                      improvements.professionalSummary.improved,
                      'summary-copy'
                    )
                  }
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-[#010736] bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-[#29437A] rounded-xl transition-all cursor-pointer min-h-[36px]"
                >
                  {copiedId === 'summary-copy' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700 font-bold">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-[#29437A]" />
                      <span>Copy Improved Summary</span>
                    </>
                  )}
                </button>
              </div>

              {/* Original vs Improved Comparison Card */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Original */}
                <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/70 flex flex-col justify-between shadow-navy-xs">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Original Summary in Resume
                      </span>
                      <span className="text-xs text-slate-500 bg-slate-200/70 px-2 py-0.5 rounded font-mono font-medium">
                        Before
                      </span>
                    </div>
                    <p className="text-sm sm:text-base text-slate-600 leading-relaxed italic">
                      "{improvements.professionalSummary.original || 'No formal professional summary present in resume.'}"
                    </p>
                  </div>
                  <div className="mt-4 text-xs text-slate-400 font-medium">
                    Baseline extracted from document
                  </div>
                </div>

                {/* Improved */}
                <div className="p-5 rounded-2xl border border-emerald-200 bg-emerald-50/30 flex flex-col justify-between shadow-navy-xs">
                  <div>
                    <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Improved Executive Hook</span>
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleCopyText(improvements.professionalSummary.improved, 'summary-card-copy')}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-emerald-900 bg-white hover:bg-emerald-50 border border-emerald-200 rounded-lg transition-all cursor-pointer shadow-2xs"
                          title="Copy improved summary"
                        >
                          {copiedId === 'summary-card-copy' ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-emerald-700 font-bold">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-emerald-700" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                          Optimized
                        </span>
                      </div>
                    </div>
                    <p className="text-sm sm:text-base text-slate-900 leading-relaxed font-semibold">
                      {improvements.professionalSummary.improved}
                    </p>

                    <div className="mt-4 pt-3.5 border-t border-emerald-100 space-y-2.5">
                      <div className="text-xs text-emerald-950">
                        <span className="font-bold">Why this works: </span>
                        {improvements.professionalSummary.changesSummary}
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-slate-500 font-medium">Power Verbs:</span>
                        {improvements.professionalSummary.keyActionVerbs.map((v, i) => (
                          <span
                            key={i}
                            className="text-xs bg-white text-emerald-800 font-bold px-2 py-0.5 rounded-md border border-emerald-200 shadow-navy-xs"
                          >
                            {v}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: EXPERIENCE BULLET POINTS */}
          {(activeTab === 'all' || activeTab === 'bullets') && (
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-navy-xs">
              <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#010736]/5 text-[#29437A] flex items-center justify-center">
                    <Briefcase className="w-4 h-4 text-[#29437A]" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-xl font-bold text-[#010736]">
                      Experience Bullet Points ({improvements.experienceBulletPoints.length})
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                      Re-engineered with [Power Action Verb] + [Specific Technical Context] + [Measurable Business Impact].
                    </p>
                  </div>
                </div>

                {improvements.experienceBulletPoints.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      const bulletsText = improvements.experienceBulletPoints
                        .map((b) => b.improvedBullet.trim())
                        .join('\n');
                      handleCopyText(bulletsText, 'all-bullets-copy');
                    }}
                    className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-[#010736] bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-[#29437A] rounded-xl transition-all cursor-pointer min-h-[36px]"
                    title="Copy all improved experience bullets"
                  >
                    {copiedId === 'all-bullets-copy' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700 font-bold">Copied All Bullets!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-[#29437A]" />
                        <span>Copy All Bullets</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              <div className="space-y-5">
                {improvements.experienceBulletPoints.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-[#29437A]/40 transition-all shadow-navy-xs"
                  >
                    <div className="flex items-center justify-between gap-3 mb-3.5 pb-2.5 border-b border-slate-100 flex-wrap">
                      <span className="text-sm font-bold text-[#010736] flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-[#010736] text-[#FFF3D0] flex items-center justify-center text-xs font-mono font-bold">
                          {idx + 1}
                        </span>
                        <span>{item.roleOrCompany}</span>
                      </span>

                      <div className="flex items-center gap-2.5">
                        <span className="text-xs font-bold bg-[#FFF3D0] text-[#010736] px-2.5 py-0.5 rounded-md border border-[#29437A]/30">
                          Verb: {item.actionVerbUsed}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            handleCopyText(item.improvedBullet, `bullet-${idx}`)
                          }
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#010736] bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                        >
                          {copiedId === `bullet-${idx}` ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-emerald-700 font-bold">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-[#29437A]" />
                              <span>Copy Bullet</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Original vs Improved */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
                      {/* Original */}
                      <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200">
                        <span className="text-xs font-bold uppercase text-slate-400 block mb-1.5">
                          Original Bullet
                        </span>
                        <p className="text-slate-600 leading-relaxed italic">
                          "{item.originalBullet}"
                        </p>
                      </div>

                      {/* Improved */}
                      <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200">
                        <span className="text-xs font-bold uppercase text-emerald-800 flex items-center gap-1.5 mb-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Improved Bullet</span>
                        </span>
                        <p className="text-slate-900 font-semibold leading-relaxed">
                          • {item.improvedBullet}
                        </p>
                      </div>
                    </div>

                    {/* Measurability Tip & Keywords */}
                    <div className="mt-3.5 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                      <div className="text-slate-600">
                        <span className="font-bold text-[#010736]">Measurability Advice: </span>
                        {item.measurabilityTip}
                      </div>

                      {item.keywordsIncorporated.length > 0 && (
                        <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                          <span className="text-slate-400 font-medium">Keywords:</span>
                          {item.keywordsIncorporated.map((kw, kIdx) => (
                            <span
                              key={kIdx}
                              className="text-xs bg-slate-100 text-slate-800 font-semibold px-2 py-0.5 rounded-md border border-slate-200"
                            >
                              {kw}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION 3: PROJECT DESCRIPTIONS */}
          {(activeTab === 'all' || activeTab === 'projects') && (
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-navy-xs">
              <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#010736]/5 text-[#29437A] flex items-center justify-center">
                    <FolderGit2 className="w-4 h-4 text-[#29437A]" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-xl font-bold text-[#010736]">
                      Project Descriptions ({improvements.projectDescriptions.length})
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                      Technical challenges, architectural highlights, and concrete deliverables.
                    </p>
                  </div>
                </div>

                {improvements.projectDescriptions.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      const projectsText = improvements.projectDescriptions
                        .map((p) => `${p.projectTitle}\n${p.improvedDescription.trim()}`)
                        .join('\n\n');
                      handleCopyText(projectsText, 'all-projects-copy');
                    }}
                    className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-[#010736] bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-[#29437A] rounded-xl transition-all cursor-pointer min-h-[36px]"
                    title="Copy all improved project descriptions"
                  >
                    {copiedId === 'all-projects-copy' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700 font-bold">Copied All Projects!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-[#29437A]" />
                        <span>Copy All Projects</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {improvements.projectDescriptions.length === 0 ? (
                <div className="p-6 rounded-2xl bg-slate-50 text-sm text-slate-500 text-center italic">
                  No projects identified in resume to enhance.
                </div>
              ) : (
                <div className="space-y-5">
                  {improvements.projectDescriptions.map((proj, idx) => (
                    <div
                      key={idx}
                      className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-[#29437A]/40 transition-all shadow-navy-xs"
                    >
                      <div className="flex items-center justify-between gap-3 mb-3 pb-2.5 border-b border-slate-100 flex-wrap">
                        <span className="text-sm sm:text-base font-bold text-[#010736]">
                          {proj.projectTitle}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            handleCopyText(proj.improvedDescription, `proj-${idx}`)
                          }
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#010736] bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                        >
                          {copiedId === `proj-${idx}` ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-emerald-700 font-bold">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-[#29437A]" />
                              <span>Copy Description</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
                        <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200">
                          <span className="text-xs font-bold uppercase text-slate-400 block mb-1.5">
                            Original Description
                          </span>
                          <p className="text-slate-600 leading-relaxed italic">
                            "{proj.originalDescription}"
                          </p>
                        </div>

                        <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200">
                          <span className="text-xs font-bold uppercase text-emerald-800 flex items-center gap-1.5 mb-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>Improved Description</span>
                          </span>
                          <p className="text-slate-900 font-semibold leading-relaxed">
                            {proj.improvedDescription}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3.5 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                        <div className="text-slate-600">
                          <span className="font-bold text-[#010736]">Measurability: </span>
                          {proj.measurabilityTip}
                        </div>

                        {proj.technicalHighlights.length > 0 && (
                          <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                            <span className="text-slate-400 font-medium">Tech Stack:</span>
                            {proj.technicalHighlights.map((tech, tIdx) => (
                              <span
                                key={tIdx}
                                className="text-xs bg-slate-100 text-slate-800 font-semibold px-2 py-0.5 rounded-md border border-slate-200 font-mono"
                              >
                                {tech}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SECTION 4: SKILLS SECTION REORGANIZATION */}
          {(activeTab === 'all' || activeTab === 'skills') && (
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-navy-xs">
              <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                    <Wrench className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-xl font-bold text-[#010736]">
                      ATS-Optimized Skills Section Organization
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                      {improvements.skillsSection.organizationRationale}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const skillsText = improvements.skillsSection.improvedCategorizedSkills
                      .map((c) => `${c.category}: ${c.skills.join(', ')}`)
                      .join('\n');
                    handleCopyText(skillsText, 'skills-copy');
                  }}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-[#010736] bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-[#29437A] rounded-xl transition-all cursor-pointer min-h-[36px]"
                >
                  {copiedId === 'skills-copy' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700 font-bold">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-[#29437A]" />
                      <span>Copy Categorized Skills</span>
                    </>
                  )}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {improvements.skillsSection.improvedCategorizedSkills.map((cat, idx) => (
                  <div
                    key={idx}
                    className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between shadow-navy-xs"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-200">
                        <span className="text-sm font-bold text-[#010736]">
                          {cat.category}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyText(`${cat.category}: ${cat.skills.join(', ')}`, `skill-cat-${idx}`)}
                          className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold text-[#010736] bg-white hover:bg-slate-100 border border-slate-200 rounded-md transition-all cursor-pointer shadow-2xs"
                          title={`Copy ${cat.category} skills`}
                        >
                          {copiedId === `skill-cat-${idx}` ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span className="text-emerald-700 font-bold text-[11px]">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 text-[#29437A]" />
                              <span className="text-[11px]">Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {cat.skills.map((skill, sIdx) => (
                          <span
                            key={sIdx}
                            className="text-xs bg-white text-slate-800 font-semibold px-2.5 py-1 rounded-lg border border-slate-200 shadow-navy-xs"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION 5: ACTION VERB UPGRADES */}
          {(activeTab === 'all' || activeTab === 'verbs') && (
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-navy-xs">
              <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-xl font-bold text-[#010736]">
                      Action Verb Upgrades ({improvements.actionVerbUpgrades.length})
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                      Replace passive, generic phrasing with dynamic, executive-level verbs that capture leadership and ownership.
                    </p>
                  </div>
                </div>

                {improvements.actionVerbUpgrades.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      const verbsText = improvements.actionVerbUpgrades
                        .map((v) => v.recommendedVerb)
                        .join(', ');
                      handleCopyText(verbsText, 'all-verbs-copy');
                    }}
                    className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-[#010736] bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-[#29437A] rounded-xl transition-all cursor-pointer min-h-[36px]"
                    title="Copy all recommended action verbs"
                  >
                    {copiedId === 'all-verbs-copy' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700 font-bold">Copied All Verbs!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-[#29437A]" />
                        <span>Copy All Verbs</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {improvements.actionVerbUpgrades.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-[#29437A]/40 transition-all shadow-navy-xs flex flex-col justify-between"
                  >
                    <div>
                      {/* From -> To */}
                      <div className="flex items-center justify-between gap-2 mb-2.5 flex-wrap">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="line-through text-slate-400 font-medium text-xs sm:text-sm">
                            {item.originalVerbOrPhrase}
                          </span>
                          <ArrowRight className="w-4 h-4 text-[#29437A]" />
                          <span className="font-bold text-[#010736] bg-[#FFF3D0] px-2.5 py-0.5 rounded-md border border-[#29437A]/30 text-xs sm:text-sm">
                            {item.recommendedVerb}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleCopyText(item.recommendedVerb, `verb-${idx}`)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-[#010736] bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                          title={`Copy verb: ${item.recommendedVerb}`}
                        >
                          {copiedId === `verb-${idx}` ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span className="text-emerald-700 font-bold">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 text-[#29437A]" />
                              <span>Copy Verb</span>
                            </>
                          )}
                        </button>
                      </div>

                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-3">
                        <span className="font-bold text-slate-800">Why upgrade: </span>
                        {item.rationale}
                      </p>

                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700">
                        <span className="font-bold text-[#010736] block mb-1">
                          Example Application:
                        </span>
                        "{item.exampleSentence}"
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION 6: MEASURABLE ACHIEVEMENT SUGGESTIONS */}
          {(activeTab === 'all' || activeTab === 'measurable') && (
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-navy-xs">
              <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-rose-600" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-xl font-bold text-[#010736]">
                      Suggestions to Make Achievements Measurable
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                      How to insert realistic metrics and outcomes using Google's X-Y-Z formula without fabricating numbers.
                    </p>
                  </div>
                </div>

                {improvements.measurableAchievementSuggestions.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      const suggestionsText = improvements.measurableAchievementSuggestions
                        .map((item, i) => `${i + 1}. ${item.suggestionToQuantify.trim()}`)
                        .join('\n\n');
                      handleCopyText(suggestionsText, 'all-measurable-copy');
                    }}
                    className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-[#010736] bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-[#29437A] rounded-xl transition-all cursor-pointer min-h-[36px]"
                    title="Copy all measurability suggestions"
                  >
                    {copiedId === 'all-measurable-copy' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700 font-bold">Copied All Suggestions!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-[#29437A]" />
                        <span>Copy All Suggestions</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              <div className="space-y-4">
                {improvements.measurableAchievementSuggestions.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-5 rounded-2xl border border-slate-200 bg-white shadow-navy-xs"
                  >
                    <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-100">
                      <span className="text-xs font-bold text-[#010736]">
                        Measurable Formula #{idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyText(item.suggestionToQuantify.trim(), `measurable-${idx}`)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-[#010736] bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                        title="Copy this measurability recommendation"
                      >
                        {copiedId === `measurable-${idx}` ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-700 font-bold">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-[#29437A]" />
                            <span>Copy Suggestion</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
                      {/* Current Claim */}
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="text-xs font-bold uppercase text-slate-400 block mb-1.5">
                          Current Unquantified Claim
                        </span>
                        <p className="text-slate-700 italic">
                          "{item.currentClaim}"
                        </p>
                      </div>

                      {/* Suggestion */}
                      <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200">
                        <span className="text-xs font-bold uppercase text-emerald-800 block mb-1.5">
                          How to Quantify with Real Data
                        </span>
                        <p className="text-emerald-950 font-semibold">
                          {item.suggestionToQuantify}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3.5 pt-3 border-t border-slate-100 text-xs text-slate-600 font-mono">
                      <span className="font-bold text-[#010736]">Formula / Framework: </span>
                      {item.metricFramework}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION 7: KEYWORD ENHANCEMENTS */}
          {(activeTab === 'all' || activeTab === 'keywords') && (
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-navy-xs">
              <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#010736]/5 text-[#29437A] flex items-center justify-center">
                    <Tag className="w-4 h-4 text-[#29437A]" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-xl font-bold text-[#010736]">
                      Job-Specific Keyword Improvements ({improvements.keywordEnhancements.length})
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                      Essential industry terminology and role keywords strategically integrated across your resume.
                    </p>
                  </div>
                </div>

                {improvements.keywordEnhancements.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      const keywordsText = improvements.keywordEnhancements
                        .map((k) => k.keyword)
                        .join(', ');
                      handleCopyText(keywordsText, 'all-keywords-copy');
                    }}
                    className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-[#010736] bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-[#29437A] rounded-xl transition-all cursor-pointer min-h-[36px]"
                    title="Copy all recommended keywords"
                  >
                    {copiedId === 'all-keywords-copy' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700 font-bold">Copied All Keywords!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-[#29437A]" />
                        <span>Copy All Keywords</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {improvements.keywordEnhancements.map((kw, idx) => (
                  <div
                    key={idx}
                    className="p-5 rounded-2xl border border-slate-200 bg-white shadow-navy-xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2.5">
                        <span className="text-xs sm:text-sm font-bold text-[#010736] font-mono">
                          {kw.keyword}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-md font-bold uppercase ${
                              kw.status === 'integrated'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {kw.status}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyText(kw.keyword, `kw-${idx}`)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold text-[#010736] bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md transition-colors cursor-pointer"
                            title={`Copy keyword: ${kw.keyword}`}
                          >
                            {copiedId === `kw-${idx}` ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span className="text-emerald-700 font-bold text-[11px]">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3 text-[#29437A]" />
                                <span className="text-[11px]">Copy</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-3">
                        <span className="font-bold text-slate-800">Placement: </span>
                        {kw.placementSuggestion}
                      </p>

                      <div className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        {kw.relevanceToRole}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bottom Action Card */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-navy-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-base sm:text-lg font-bold text-[#010736]">
                Ready to update your resume?
              </h4>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Copy all improved sections at once or download the complete candidate evaluation report.
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={handleCopyAllImprovements}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-bold text-white bg-[#010736] hover:bg-[#0D1B3D] rounded-xl transition-all shadow-navy-xs cursor-pointer min-h-[42px]"
                title="Copy all improved sections to clipboard"
              >
                {copiedId === 'copy-all' ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" />
                    <span>Copied All Improvements!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-[#FFF3D0]" />
                    <span>Copy All Improvements</span>
                  </>
                )}
              </button>

              {onDownloadPdf && (
                <button
                  type="button"
                  onClick={() => {
                    onDownloadPdf();
                    setDownloadSuccess(true);
                    setTimeout(() => setDownloadSuccess(false), 3000);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold text-[#010736] bg-[#FFF3D0] hover:bg-[#ffeab3] border border-[#29437A]/30 rounded-xl transition-all shadow-navy-xs cursor-pointer min-h-[42px]"
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
