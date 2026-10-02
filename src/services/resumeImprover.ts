/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AnalysisError } from './resumeAnalyzer.ts';

export interface ProfessionalSummaryImprovement {
  original: string;
  improved: string;
  changesSummary: string;
  keyActionVerbs: string[];
  addedKeywords: string[];
}

export interface ExperienceBulletImprovement {
  roleOrCompany: string;
  originalBullet: string;
  improvedBullet: string;
  actionVerbUsed: string;
  measurabilityTip: string;
  keywordsIncorporated: string[];
}

export interface ProjectDescriptionImprovement {
  projectTitle: string;
  originalDescription: string;
  improvedDescription: string;
  technicalHighlights: string[];
  measurabilityTip: string;
}

export interface SkillCategoryImprovement {
  category: string;
  skills: string[];
}

export interface SkillsSectionImprovement {
  originalSkills: string[];
  improvedCategorizedSkills: SkillCategoryImprovement[];
  organizationRationale: string;
  keywordAlignment: string[];
}

export interface ActionVerbUpgrade {
  originalVerbOrPhrase: string;
  recommendedVerb: string;
  rationale: string;
  exampleSentence: string;
}

export interface MeasurableAchievementSuggestion {
  currentClaim: string;
  suggestionToQuantify: string;
  metricFramework: string;
}

export interface KeywordEnhancement {
  keyword: string;
  status: 'integrated' | 'recommended';
  placementSuggestion: string;
  relevanceToRole: string;
}

export interface ResumeImprovementsResult {
  overview: string;
  professionalSummary: ProfessionalSummaryImprovement;
  experienceBulletPoints: ExperienceBulletImprovement[];
  projectDescriptions: ProjectDescriptionImprovement[];
  skillsSection: SkillsSectionImprovement;
  actionVerbUpgrades: ActionVerbUpgrade[];
  measurableAchievementSuggestions: MeasurableAchievementSuggestion[];
  keywordEnhancements: KeywordEnhancement[];
}

export async function improveResumeWithGemini(
  resumeText: string,
  jobDescription?: string,
  fileName?: string
): Promise<ResumeImprovementsResult> {
  const trimmedResume = resumeText.trim();

  if (!trimmedResume || trimmedResume.length < 20) {
    throw new Error('Resume text is too brief to generate improvements.');
  }

  const response = await fetch('/api/improve-resume', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      resumeText: trimmedResume,
      jobDescription: jobDescription?.trim() || undefined,
      fileName,
    }),
  });

  if (!response.ok) {
    let errorDetail = 'Failed to generate resume improvements with Gemini.';
    let isRateLimit = response.status === 429;
    let retryAfterSeconds = 30;

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

  const result: ResumeImprovementsResult = await response.json();
  return result;
}
