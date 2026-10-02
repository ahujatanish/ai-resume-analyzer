/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  SkillGapAnalysis,
} from '../services/jobMatcher.ts';
import {
  Compass,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lightbulb,
  Layers,
  Sparkles,
  Copy,
  Check,
  FileEdit,
  Flame,
  Clock,
  Target,
} from 'lucide-react';

interface SkillGapSectionProps {
  skillGap: SkillGapAnalysis;
  jobTitle?: string;
  onJumpToJobMatch?: () => void;
  onReanalyzeJob?: () => void;
}

type TabKey = 'overview' | 'missing' | 'evidence' | 'recommended' | 'roadmap';

export const SkillGapSection: React.FC<SkillGapSectionProps> = ({
  skillGap,
  onJumpToJobMatch,
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [copiedRoadmap, setCopiedRoadmap] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState<'All' | 'High' | 'Medium' | 'Low'>('All');

  const {
    summary,
    currentSkills,
    requiredSkills,
    missingSkills,
    skillsNeedingEvidence,
    recommendedSkillsToLearn,
    learningRoadmap,
  } = skillGap;

  const totalRequired = requiredSkills.length;
  const metRequired = requiredSkills.filter((s) => s.isMet).length;
  const coveragePercent = totalRequired > 0 ? Math.round((metRequired / totalRequired) * 100) : 0;
  const highPriorityMissing = missingSkills.filter((s) => s.priority.toLowerCase() === 'high').length;

  const filteredMissing =
    priorityFilter === 'All'
      ? missingSkills
      : missingSkills.filter((s) => s.priority.toLowerCase() === priorityFilter.toLowerCase());

  const handleCopyRoadmap = async () => {
    const text = `Skill Gap Learning Roadmap
${summary}

${learningRoadmap
  .map(
    (phase, idx) => `Milestone ${idx + 1}: ${phase.phase} - ${phase.title}
Focus Skills: ${phase.focusSkills.join(', ')}
Objectives:
${phase.learningObjectives.map((obj) => `  • ${obj}`).join('\n')}
Practical Project: ${phase.practicalProjectIdea}
Resume Bullet Draft: ${phase.resumeBulletDraft}
`
  )
  .join('\n---\n\n')}`;

    try {
      await navigator.clipboard.writeText(text);
      setCopiedRoadmap(true);
      setTimeout(() => setCopiedRoadmap(false), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopiedRoadmap(true);
      setTimeout(() => setCopiedRoadmap(false), 2000);
    }
  };

  const getPriorityBadge = (priority: string) => {
    const p = priority.toLowerCase();
    if (p === 'high') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
          <Flame className="w-3 h-3 text-rose-500" />
          <span>High Priority</span>
        </span>
      );
    }
    if (p === 'medium') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-[#FFF3D0] text-[#010736] border border-[#29437A]/30">
          <span>Medium Priority</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
        <span>Low Priority</span>
      </span>
    );
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Top Banner & High-Level Metrics */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-9 shadow-navy-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-[#010736] text-[#FFF3D0] flex items-center justify-center shrink-0 shadow-navy-xs">
              <Compass className="w-6 h-6 text-[#FFF3D0]" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-lg sm:text-xl font-bold text-[#010736]">
                  Skill Gap Analysis &amp; Action Plan
                </h2>
                <span className="text-xs font-bold text-[#010736] bg-[#FFF3D0] px-2.5 py-0.5 rounded-md border border-[#29437A]/30">
                  Target Role Alignment
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                Objective comparison of your evidenced capabilities against job expectations with a personalized learning roadmap.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {onJumpToJobMatch && (
              <button
                type="button"
                onClick={onJumpToJobMatch}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold text-[#010736] bg-white hover:bg-slate-50 border border-slate-200 hover:border-[#29437A] rounded-xl transition-all cursor-pointer min-h-[40px]"
              >
                <Target className="w-4 h-4 text-[#29437A]" />
                <span>Job Match Score</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleCopyRoadmap}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-[#010736] hover:bg-[#0D1B3D] rounded-xl transition-all cursor-pointer shadow-navy-xs min-h-[40px]"
            >
              {copiedRoadmap ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span className="text-white">Roadmap Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-[#FFF3D0]" />
                  <span>Copy Roadmap</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="mt-5 p-4 rounded-xl bg-slate-50/90 border border-slate-200/80 text-sm sm:text-base text-slate-800 leading-relaxed">
          <span className="font-bold text-[#010736] mr-2">Executive Summary:</span>
          {summary}
        </div>

        {/* 4 Key Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5">
          <div className="p-4 rounded-xl bg-slate-50/90 border border-slate-200/80">
            <span className="text-xs text-slate-500 font-medium block">Required Skills Coverage</span>
            <div className="flex items-baseline gap-2 mt-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold font-mono text-[#010736] tabular-nums">
                {coveragePercent}%
              </span>
              <span className="text-xs text-slate-500 font-mono">
                ({metRequired}/{totalRequired} met)
              </span>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full mt-2.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  coveragePercent >= 75
                    ? 'bg-emerald-600'
                    : coveragePercent >= 50
                    ? 'bg-[#29437A]'
                    : 'bg-rose-500'
                }`}
                style={{ width: `${coveragePercent}%` }}
              />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50/90 border border-slate-200/80">
            <span className="text-xs text-slate-500 font-medium block">Current Skills Evidenced</span>
            <div className="flex items-baseline gap-1.5 mt-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-700 tabular-nums">
                {currentSkills.length}
              </span>
              <span className="text-xs text-slate-500 font-medium">skills</span>
            </div>
            <span className="text-xs text-emerald-600 font-semibold block mt-1">
              Verified in resume text
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50/90 border border-slate-200/80">
            <span className="text-xs text-slate-500 font-medium block">Critical Missing Skills</span>
            <div className="flex items-baseline gap-1.5 mt-1.5">
              <span
                className={`text-2xl sm:text-3xl font-extrabold font-mono tabular-nums ${
                  highPriorityMissing === 0 ? 'text-emerald-700' : 'text-rose-700'
                }`}
              >
                {highPriorityMissing}
              </span>
              <span className="text-xs text-slate-500 font-medium">of {missingSkills.length} total</span>
            </div>
            <span className="text-xs text-slate-500 font-medium block mt-1">
              High priority for hiring
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50/90 border border-slate-200/80">
            <span className="text-xs text-slate-500 font-medium block">Need Stronger Evidence</span>
            <div className="flex items-baseline gap-1.5 mt-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold font-mono text-amber-700 tabular-nums">
                {skillsNeedingEvidence.length}
              </span>
              <span className="text-xs text-slate-500 font-medium">skills</span>
            </div>
            <span className="text-xs text-amber-600 font-semibold block mt-1">
              Need metrics or proof
            </span>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 rounded-2xl w-fit border border-slate-200 max-w-full overflow-x-auto scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap min-h-[38px] ${
            activeTab === 'overview'
              ? 'bg-[#010736] text-white shadow-navy-xs'
              : 'text-slate-600 hover:text-[#010736]'
          }`}
        >
          <Layers className={`w-4 h-4 ${activeTab === 'overview' ? 'text-[#FFF3D0]' : 'text-[#29437A]'}`} />
          <span>All Skills ({totalRequired})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('missing')}
          className={`inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap min-h-[38px] ${
            activeTab === 'missing'
              ? 'bg-[#010736] text-white shadow-navy-xs'
              : 'text-slate-600 hover:text-[#010736]'
          }`}
        >
          <XCircle className={`w-4 h-4 ${activeTab === 'missing' ? 'text-rose-400' : 'text-rose-600'}`} />
          <span>Missing Skills ({missingSkills.length})</span>
          {highPriorityMissing > 0 && (
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
              activeTab === 'missing' ? 'bg-[#FFF3D0] text-[#010736]' : 'bg-rose-100 text-rose-700'
            }`}>
              {highPriorityMissing} High
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('evidence')}
          className={`inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap min-h-[38px] ${
            activeTab === 'evidence'
              ? 'bg-[#010736] text-white shadow-navy-xs'
              : 'text-slate-600 hover:text-[#010736]'
          }`}
        >
          <FileEdit className={`w-4 h-4 ${activeTab === 'evidence' ? 'text-amber-300' : 'text-amber-600'}`} />
          <span>Needs Stronger Evidence ({skillsNeedingEvidence.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('recommended')}
          className={`inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap min-h-[38px] ${
            activeTab === 'recommended'
              ? 'bg-[#010736] text-white shadow-navy-xs'
              : 'text-slate-600 hover:text-[#010736]'
          }`}
        >
          <Lightbulb className={`w-4 h-4 ${activeTab === 'recommended' ? 'text-[#FFF3D0]' : 'text-indigo-600'}`} />
          <span>Recommended to Learn ({recommendedSkillsToLearn.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('roadmap')}
          className={`inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap min-h-[38px] ${
            activeTab === 'roadmap'
              ? 'bg-[#010736] text-white shadow-navy-xs'
              : 'text-slate-600 hover:text-[#010736]'
          }`}
        >
          <Compass className={`w-4 h-4 ${activeTab === 'roadmap' ? 'text-[#FFF3D0]' : 'text-[#29437A]'}`} />
          <span>Learning Roadmap ({learningRoadmap.length} Phases)</span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW MATRIX (Current vs Required) */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Required Skills Matrix */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-navy-xs flex flex-col">
            <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#010736]/5 text-[#29437A] flex items-center justify-center">
                  <Layers className="w-4 h-4 text-[#29437A]" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-[#010736]">
                  Required Skills by Role ({requiredSkills.length})
                </h3>
              </div>
              <span className="text-xs text-slate-500 font-mono font-medium">
                {metRequired} of {totalRequired} met
              </span>
            </div>

            <div className="space-y-3 flex-1">
              {requiredSkills.map((req, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border text-xs sm:text-sm transition-all shadow-navy-xs ${
                    req.isMet
                      ? 'bg-emerald-50/40 border-emerald-100'
                      : 'bg-rose-50/40 border-rose-100'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                    <span className="font-bold text-[#010736] flex items-center gap-2">
                      {req.isMet ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      )}
                      <span>{req.skill}</span>
                    </span>
                    <div className="flex items-center gap-2">
                      {getPriorityBadge(req.priority)}
                      <span
                        className={`text-xs px-2 py-0.5 rounded-md font-bold ${
                          req.isMet
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {req.isMet ? 'Met in Resume' : 'Missing'}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed mt-1">
                    {req.rationale}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Current Skills in Resume */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-navy-xs flex flex-col">
            <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-[#010736]">
                  Current Skills in Resume ({currentSkills.length})
                </h3>
              </div>
              <span className="text-xs text-slate-500 font-mono font-medium">
                Extracted from document
              </span>
            </div>

            <div className="space-y-3 flex-1">
              {currentSkills.length === 0 ? (
                <div className="p-5 rounded-xl bg-slate-50 text-xs sm:text-sm text-slate-500 text-center italic">
                  No technical skills found in resume text.
                </div>
              ) : (
                currentSkills.map((curr, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200 text-xs sm:text-sm flex items-center justify-between gap-2 flex-wrap shadow-navy-xs"
                  >
                    <div>
                      <span className="font-bold text-[#010736]">{curr.skill}</span>
                      <span className="text-xs text-slate-500 block mt-0.5">
                        Category: {curr.category}
                      </span>
                    </div>
                    <span
                      className={`text-xs uppercase font-bold px-2.5 py-0.5 rounded-full border ${
                        curr.evidenceStrength === 'strong'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : curr.evidenceStrength === 'moderate'
                          ? 'bg-[#FFF3D0] text-[#010736] border-[#29437A]/30'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                    >
                      {curr.evidenceStrength} Evidence
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MISSING SKILLS WITH PRIORITY FILTER */}
      {activeTab === 'missing' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-navy-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-[#010736]">
                Missing Skills Breakdown
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                Skills expected by the employer that were not identified in your resume.
              </p>
            </div>

            {/* Filter buttons */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs sm:text-sm">
              {(['All', 'High', 'Medium', 'Low'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriorityFilter(p)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    priorityFilter === p
                      ? 'bg-[#010736] text-white shadow-navy-xs'
                      : 'text-slate-600 hover:text-[#010736]'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {filteredMissing.length === 0 ? (
            <div className="p-8 text-center bg-emerald-50/50 border border-emerald-100 rounded-2xl">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-3" />
              <h4 className="text-base font-bold text-emerald-900">
                No missing skills in this filter!
              </h4>
              <p className="text-xs sm:text-sm text-emerald-700 mt-1">
                Your resume demonstrates the required skills for this priority level.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredMissing.map((item, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-[#29437A]/40 transition-all shadow-navy-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                      <span className="text-sm sm:text-base font-bold text-[#010736] flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>{item.skill}</span>
                      </span>
                      {getPriorityBadge(item.priority)}
                    </div>

                    <div className="text-xs text-slate-500 mb-2.5">
                      <span className="font-semibold text-slate-700">Category: </span>
                      {item.category}
                    </div>

                    <div className="p-3 rounded-xl bg-rose-50/50 border border-rose-100 text-xs sm:text-sm text-rose-900">
                      <span className="font-bold block text-xs text-rose-700 mb-0.5">
                        Impact on Hiring Decision:
                      </span>
                      {item.impactOnHiring}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SKILLS NEEDING STRONGER EVIDENCE */}
      {activeTab === 'evidence' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-navy-xs">
          <div className="mb-6 pb-4 border-b border-slate-100">
            <h3 className="text-base sm:text-lg font-bold text-[#010736]">
              Skills Needing Stronger Evidence ({skillsNeedingEvidence.length})
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
              These skills appear on your resume, but lack measurable achievements, technical depth, or clear business outcomes.
            </p>
          </div>

          {skillsNeedingEvidence.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-2xl">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-3" />
              <h4 className="text-base font-bold text-slate-900">
                Strong evidence across all mentioned skills!
              </h4>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Your resume provides quantified proof and project context for your core capabilities.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {skillsNeedingEvidence.map((item, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-2xl border border-amber-200/80 bg-amber-50/20 shadow-navy-xs"
                >
                  <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                    <span className="text-sm sm:text-base font-bold text-[#010736] flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <span>{item.skill}</span>
                    </span>
                    {getPriorityBadge(item.priority)}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 text-xs sm:text-sm">
                    <div className="p-3.5 rounded-xl bg-white border border-slate-200">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                        Current Resume Evidence
                      </span>
                      <p className="text-slate-700 italic">
                        "{item.currentEvidence}"
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200">
                      <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block mb-1">
                        How to Strengthen with Proof
                      </span>
                      <p className="text-emerald-950 font-semibold">
                        {item.howToStrengthen}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: RECOMMENDED SKILLS TO LEARN */}
      {activeTab === 'recommended' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-navy-xs">
          <div className="mb-6 pb-4 border-b border-slate-100">
            <h3 className="text-base sm:text-lg font-bold text-[#010736]">
              Recommended Skills to Learn ({recommendedSkillsToLearn.length})
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
              Strategic additions that maximize your hiring appeal for this role and market demand.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendedSkillsToLearn.map((item, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-[#29437A]/40 transition-all shadow-navy-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-base font-bold text-[#010736]">
                      {item.skill}
                    </span>
                    {getPriorityBadge(item.priority)}
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-[#29437A] bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 mb-3 w-fit font-medium">
                    <Clock className="w-3.5 h-3.5 text-[#29437A]" />
                    <span>Estimated: {item.estimatedTimeToLearn}</span>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    <span className="font-bold text-slate-800">Market Demand &amp; ROI: </span>
                    {item.marketDemand}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: PRACTICAL LEARNING ROADMAP */}
      {activeTab === 'roadmap' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-navy-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2.5">
                <Compass className="w-5 h-5 text-[#29437A]" />
                <h3 className="text-base sm:text-xl font-bold text-[#010736]">
                  Step-by-Step Learning Roadmap
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                Structured progressive milestones to acquire high-priority missing skills and craft verifiable portfolio proof.
              </p>
            </div>

            <button
              type="button"
              onClick={handleCopyRoadmap}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-[#010736] hover:bg-[#0D1B3D] rounded-xl transition-all cursor-pointer shadow-navy-xs w-fit min-h-[40px]"
            >
              {copiedRoadmap ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-[#FFF3D0]" />
                  <span>Copy Roadmap</span>
                </>
              )}
            </button>
          </div>

          <div className="space-y-6">
            {learningRoadmap.map((phase, idx) => (
              <div
                key={idx}
                className="relative pl-7 sm:pl-9 border-l-2 border-[#29437A]/30 last:border-transparent pb-6 last:pb-0"
              >
                {/* Step indicator circle */}
                <div className="absolute -left-[18px] top-0 w-9 h-9 rounded-full bg-[#010736] text-[#FFF3D0] flex items-center justify-center font-bold text-xs shadow-navy-xs">
                  {idx + 1}
                </div>

                <div className="bg-slate-50/80 rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-navy-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-bold text-[#29437A] uppercase tracking-wider">
                      {phase.phase}
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {phase.focusSkills.map((sk, sIdx) => (
                        <span
                          key={sIdx}
                          className="text-xs font-bold bg-white px-2.5 py-0.5 rounded-md border border-slate-200 text-[#010736]"
                        >
                          {sk}
                        </span>
                      ))}
                    </div>
                  </div>

                  <h4 className="text-base sm:text-lg font-bold text-[#010736] mb-3">
                    {phase.title}
                  </h4>

                  {/* Objectives */}
                  <div className="mb-4">
                    <span className="text-xs sm:text-sm font-bold text-slate-800 block mb-1.5">
                      Key Learning Objectives:
                    </span>
                    <ul className="list-disc list-inside text-xs sm:text-sm text-slate-600 space-y-1">
                      {phase.learningObjectives.map((obj, oIdx) => (
                        <li key={oIdx}>{obj}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Hands-on Project */}
                  <div className="mt-3.5 p-4 rounded-xl bg-white border border-slate-200 text-xs sm:text-sm shadow-navy-xs">
                    <span className="font-bold text-[#010736] flex items-center gap-2 mb-1.5">
                      <Sparkles className="w-4 h-4 text-[#29437A]" />
                      <span>Hands-on Project to Build:</span>
                    </span>
                    <p className="text-slate-600 leading-relaxed">
                      {phase.practicalProjectIdea}
                    </p>
                  </div>

                  {/* Target Resume Bullet Draft */}
                  <div className="mt-3 p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs sm:text-sm">
                    <span className="font-bold text-emerald-950 flex items-center gap-2 mb-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Resume Bullet to Add When Completed:</span>
                    </span>
                    <p className="text-emerald-950 font-mono text-xs sm:text-sm leading-relaxed">
                      • {phase.resumeBulletDraft}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
