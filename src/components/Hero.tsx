/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Sparkles, FileCheck, Target, TrendingUp, ShieldCheck } from 'lucide-react';

export const Hero: React.FC = () => {
  return (
    <section className="text-center pt-8 sm:pt-14 pb-10 sm:pb-14 px-4 max-w-5xl mx-auto">
      {/* Trust & Category Pill */}
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#FFF3D0] border border-[#29437A]/25 text-[#010736] text-xs sm:text-sm font-semibold tracking-wide mb-6 shadow-navy-xs">
        <Sparkles className="w-4 h-4 text-[#29437A]" />
        <span>Enterprise Career Intelligence · ATS Algorithm Auditor</span>
      </div>

      {/* Main Title */}
      <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#010736] max-w-4xl mx-auto leading-[1.12] text-balance">
        Evaluate, Optimize &amp; Align Your Resume with Precision
      </h1>

      {/* Subtitle */}
      <p className="mt-5 sm:mt-6 text-base sm:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed font-normal">
        Upload your resume in PDF or DOCX format for deep recruiter-grade scoring, ATS parsability validation, targeted job description matching, and verified fact-grounded bullet enhancements.
      </p>

      {/* 3 Core Value Highlights */}
      <div className="mt-10 sm:mt-12 pt-8 sm:pt-10 border-t border-slate-200/90 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 text-left">
        <div className="flex items-start gap-4 p-5 rounded-2xl bg-white border border-slate-200/90 shadow-navy-xs hover:border-[#29437A]/40 transition-all">
          <div className="w-10 h-10 rounded-xl bg-[#010736]/5 text-[#29437A] flex items-center justify-center shrink-0 mt-0.5">
            <FileCheck className="w-5 h-5 text-[#29437A]" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#010736]">Recruiter &amp; ATS Audit</h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
              Objective 100-point scoring on quantifiable impact, formatting, keyword density, and parsability.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4 p-5 rounded-2xl bg-white border border-slate-200/90 shadow-navy-xs hover:border-[#29437A]/40 transition-all">
          <div className="w-10 h-10 rounded-xl bg-[#010736]/5 text-[#29437A] flex items-center justify-center shrink-0 mt-0.5">
            <Target className="w-5 h-5 text-[#29437A]" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#010736]">Targeted Job Match</h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
              Cross-reference skills and experience directly against any target job description or role requisition.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4 p-5 rounded-2xl bg-white border border-slate-200/90 shadow-navy-xs hover:border-[#29437A]/40 transition-all">
          <div className="w-10 h-10 rounded-xl bg-[#FFF3D0] text-[#010736] flex items-center justify-center shrink-0 mt-0.5">
            <TrendingUp className="w-5 h-5 text-[#010736]" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#010736]">Skill Gap &amp; Improvements</h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
              Actionable learning roadmaps and fact-grounded Original → Improved bullet enhancements.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
