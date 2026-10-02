/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SkillCategory {
  category: string;
  items: string[];
}

export interface ExperienceItem {
  title: string;
  company: string;
  period?: string;
  location?: string;
  highlights: string[];
}

export interface EducationItem {
  degree: string;
  institution: string;
  graduationYear?: string;
  details?: string;
}

export interface ProjectItem {
  name: string;
  technologies?: string[];
  description: string;
  link?: string;
}

export interface QualityPoint {
  title: string;
  description: string;
}

export interface MissingSectionItem {
  sectionName: string;
  status: 'missing' | 'weak';
  description: string;
  impact: string;
}

export interface ImprovementItem {
  priority: 'high' | 'medium' | 'low';
  area: string;
  suggestion: string;
  rationale: string;
}

export interface ScoreBreakdown {
  impactAndMetrics: number; // 0-100
  clarityAndFormatting: number; // 0-100
  experienceRelevance: number; // 0-100
  skillsDepth: number; // 0-100
}

export interface AtsKeywordItem {
  keyword: string;
  category: string;
  frequency: number;
  context?: string;
}

export interface AtsMissingKeywordItem {
  keyword: string;
  importance: 'critical' | 'recommended';
  reason: string;
}

export interface AtsFormattingIssue {
  severity: 'high' | 'medium' | 'low';
  issue: string;
  impact: string;
  recommendation: string;
}

export interface AtsHeadingIssue {
  severity: 'high' | 'medium' | 'low';
  heading: string;
  issue: string;
  recommendation: string;
}

export interface AtsSkillsVisibility {
  status: 'excellent' | 'good' | 'needs_improvement' | 'poor';
  score: number;
  dedicatedSectionFound: boolean;
  observation: string;
  recommendation: string;
}

export interface AtsContactVisibility {
  status: 'complete' | 'partial' | 'missing';
  score: number;
  nameFound: boolean;
  emailFound: boolean;
  phoneFound: boolean;
  locationFound: boolean;
  linksFound: boolean;
  observation: string;
  recommendation: string;
}

export interface AtsReadabilityIssue {
  severity: 'high' | 'medium' | 'low';
  issue: string;
  recommendation: string;
}

export interface AtsSpecificSuggestion {
  priority: 'high' | 'medium' | 'low';
  category: string;
  suggestion: string;
  expectedBenefit: string;
}

export interface AtsAnalysisResult {
  atsScore: number;
  atsGrade: string;
  atsSummary: string;
  keywordUsage: AtsKeywordItem[];
  missingKeywords: AtsMissingKeywordItem[];
  formattingIssues: AtsFormattingIssue[];
  sectionHeadingIssues: AtsHeadingIssue[];
  skillsVisibility: AtsSkillsVisibility;
  contactInfoVisibility: AtsContactVisibility;
  readabilityIssues: AtsReadabilityIssue[];
  specificSuggestions: AtsSpecificSuggestion[];
}

export interface ResumeAnalysisResult {
  overallScore: number;
  scoreGrade: string;
  scoreSummary: string;
  scoreBreakdown: ScoreBreakdown;
  skills: SkillCategory[];
  experience: ExperienceItem[];
  education: EducationItem[];
  projects: ProjectItem[];
  certifications: string[];
  strengths: QualityPoint[];
  weaknesses: QualityPoint[];
  missingSections: MissingSectionItem[];
  improvements: ImprovementItem[];
  atsAnalysis: AtsAnalysisResult;
}

export class AnalysisError extends Error {
  isRateLimit?: boolean;
  retryAfterSeconds?: number;

  constructor(message: string, isRateLimit?: boolean, retryAfterSeconds?: number) {
    super(message);
    this.name = 'AnalysisError';
    this.isRateLimit = isRateLimit;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

/**
 * Call the backend Gemini-powered analysis endpoint
 */
export async function analyzeResumeWithGemini(
  resumeText: string,
  fileName: string
): Promise<ResumeAnalysisResult> {
  const trimmed = resumeText.trim();
  if (!trimmed || trimmed.length < 20) {
    throw new Error('Resume text contains insufficient content to perform an analysis.');
  }

  const response = await fetch('/api/analyze-resume', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      resumeText: trimmed,
      fileName,
    }),
  });

  if (!response.ok) {
    let errorDetail = 'Failed to analyze resume with Gemini.';
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

  const result: ResumeAnalysisResult = await response.json();
  return result;
}
