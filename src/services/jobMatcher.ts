/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AnalysisError } from './resumeAnalyzer.ts';

export interface MatchingSkillItem {
  skill: string;
  category: string;
  foundInResume: string;
  relevance?: string;
}

export interface MissingSkillItem {
  skill: string;
  importance: 'required' | 'preferred';
  contextInJob: string;
  advice?: string;
}

export interface MatchingKeywordItem {
  keyword: string;
  category: string;
  resumeContext?: string;
}

export interface MissingKeywordItem {
  keyword: string;
  importance: 'high' | 'medium';
  reason: string;
}

export interface RelevantExperienceItem {
  roleOrProject: string;
  alignment: string;
  evidence: string;
}

export interface ImportantGapItem {
  area: string;
  gapDescription: string;
  severity: 'critical' | 'moderate';
  mitigation: string;
}

export interface TailoredRecommendation {
  priority: 'high' | 'medium' | 'low';
  targetSection: string;
  recommendation: string;
  rationale: string;
}

export interface CurrentSkillItem {
  skill: string;
  category: string;
  evidenceStrength: 'strong' | 'moderate' | 'weak';
}

export interface RequiredSkillItem {
  skill: string;
  priority: 'High' | 'Medium' | 'Low';
  isMet: boolean;
  rationale: string;
}

export interface MissingSkillGapItem {
  skill: string;
  priority: 'High' | 'Medium' | 'Low';
  category: string;
  impactOnHiring: string;
}

export interface SkillNeedingEvidenceItem {
  skill: string;
  currentEvidence: string;
  howToStrengthen: string;
  priority: 'High' | 'Medium' | 'Low';
}

export interface RecommendedSkillToLearn {
  skill: string;
  priority: 'High' | 'Medium' | 'Low';
  estimatedTimeToLearn: string;
  marketDemand: string;
}

export interface RoadmapPhase {
  phase: string;
  title: string;
  focusSkills: string[];
  learningObjectives: string[];
  practicalProjectIdea: string;
  resumeBulletDraft: string;
}

export interface SkillGapAnalysis {
  summary: string;
  currentSkills: CurrentSkillItem[];
  requiredSkills: RequiredSkillItem[];
  missingSkills: MissingSkillGapItem[];
  skillsNeedingEvidence: SkillNeedingEvidenceItem[];
  recommendedSkillsToLearn: RecommendedSkillToLearn[];
  learningRoadmap: RoadmapPhase[];
}

export interface JobMatchResult {
  matchScore: number;
  matchGrade: string;
  matchSummary: string;
  matchingSkills: MatchingSkillItem[];
  missingSkills: MissingSkillItem[];
  matchingKeywords: MatchingKeywordItem[];
  missingKeywords: MissingKeywordItem[];
  relevantExperience: RelevantExperienceItem[];
  importantGaps: ImportantGapItem[];
  recommendations: TailoredRecommendation[];
  skillGapAnalysis?: SkillGapAnalysis;
}

export async function matchJobWithGemini(
  resumeText: string,
  jobDescription: string,
  fileName?: string
): Promise<JobMatchResult> {
  const trimmedResume = resumeText.trim();
  const trimmedJob = jobDescription.trim();

  if (!trimmedResume || trimmedResume.length < 20) {
    throw new Error('Resume text is too brief to perform a job comparison.');
  }

  if (!trimmedJob || trimmedJob.length < 30) {
    throw new Error('Please enter a more detailed job description (minimum 30 characters).');
  }

  const response = await fetch('/api/match-job', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      resumeText: trimmedResume,
      jobDescription: trimmedJob,
      fileName,
    }),
  });

  if (!response.ok) {
    let errorDetail = 'Failed to compare resume with job description.';
    let isRateLimit = response.status === 429;
    let retryAfterSeconds = 25;

    try {
      const errorJson = await response.json();
      errorDetail = errorJson.error || errorJson.details || errorDetail;
      if (errorJson.isRateLimit !== undefined) isRateLimit = Boolean(errorJson.isRateLimit);
      if (errorJson.retryAfterSeconds) retryAfterSeconds = errorJson.retryAfterSeconds;
    } catch {
      errorDetail = `Server returned error (${response.status}: ${response.statusText})`;
    }

    throw new AnalysisError(errorDetail, isRateLimit, retryAfterSeconds);
  }

  const result: JobMatchResult = await response.json();
  return result;
}
