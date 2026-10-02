/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize Gemini client strictly on server-side
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const analysisSchema = {
  type: Type.OBJECT,
  properties: {
    overallScore: {
      type: Type.INTEGER,
      description: 'Overall resume quality score between 0 and 100 based on completeness, impact, and standard ATS practices.',
    },
    scoreGrade: {
      type: Type.STRING,
      description: 'High level score assessment: e.g. "Excellent", "Strong", "Good", "Needs Improvement", "Needs Significant Work".',
    },
    scoreSummary: {
      type: Type.STRING,
      description: '2-3 sentence executive evaluation summarizing the primary strengths and key opportunity areas of this resume.',
    },
    scoreBreakdown: {
      type: Type.OBJECT,
      properties: {
        impactAndMetrics: {
          type: Type.INTEGER,
          description: 'Score 0-100 on quantifiable achievements, numerical metrics, and concrete business outcomes.',
        },
        clarityAndFormatting: {
          type: Type.INTEGER,
          description: 'Score 0-100 on structural organization, brevity, readability, and strong action verbs.',
        },
        experienceRelevance: {
          type: Type.INTEGER,
          description: 'Score 0-100 on role depth, career trajectory, and professional responsibility.',
        },
        skillsDepth: {
          type: Type.INTEGER,
          description: 'Score 0-100 on clarity, relevance, and categorization of core technical and domain skills.',
        },
      },
      required: ['impactAndMetrics', 'clarityAndFormatting', 'experienceRelevance', 'skillsDepth'],
    },
    skills: {
      type: Type.ARRAY,
      description: 'Categorized list of skills extracted strictly from the resume content.',
      items: {
        type: Type.OBJECT,
        properties: {
          category: {
            type: Type.STRING,
            description: 'E.g., "Languages", "Frameworks & Libraries", "Cloud & DevOps", "Tools & Platforms", "Leadership & Methodologies"',
          },
          items: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Skills explicitly stated in the resume.',
          },
        },
        required: ['category', 'items'],
      },
    },
    experience: {
      type: Type.ARRAY,
      description: 'Work history parsed from the resume.',
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: 'Job title' },
          company: { type: Type.STRING, description: 'Company / organization name' },
          period: { type: Type.STRING, description: 'Dates of employment, e.g. "March 2022 – Present"' },
          location: { type: Type.STRING, description: 'City, state, or remote' },
          highlights: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Key bullet points and achievements found in the resume.',
          },
        },
        required: ['title', 'company', 'highlights'],
      },
    },
    education: {
      type: Type.ARRAY,
      description: 'Educational background found in the resume.',
      items: {
        type: Type.OBJECT,
        properties: {
          degree: { type: Type.STRING, description: 'Degree name and major' },
          institution: { type: Type.STRING, description: 'College, university, or institution' },
          graduationYear: { type: Type.STRING, description: 'Graduation year or date range' },
          details: { type: Type.STRING, description: 'Honors, GPA, coursework, or relevant distinctions if mentioned' },
        },
        required: ['degree', 'institution'],
      },
    },
    projects: {
      type: Type.ARRAY,
      description: 'Notable projects explicitly listed in the resume. Return empty array if none present.',
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: 'Project name' },
          technologies: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Technologies or tools used in this project',
          },
          description: { type: Type.STRING, description: 'Concise summary of what was accomplished' },
          link: { type: Type.STRING, description: 'Link or repository if mentioned' },
        },
        required: ['name', 'description'],
      },
    },
    certifications: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Certifications, licenses, or professional credentials explicitly listed in the resume. Empty array if none.',
    },
    strengths: {
      type: Type.ARRAY,
      description: 'Concrete strengths demonstrated in this specific candidate resume.',
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: 'Concise strength title' },
          description: { type: Type.STRING, description: 'Specific evidence from the resume supporting this strength' },
        },
        required: ['title', 'description'],
      },
    },
    weaknesses: {
      type: Type.ARRAY,
      description: 'Concrete areas where the resume falls short or could lose candidate points.',
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: 'Concise weakness title' },
          description: { type: Type.STRING, description: 'Specific observation of what is lacking or needs revision' },
        },
        required: ['title', 'description'],
      },
    },
    missingSections: {
      type: Type.ARRAY,
      description: 'Resume sections that are either completely missing or noticeably weak/underdeveloped.',
      items: {
        type: Type.OBJECT,
        properties: {
          sectionName: { type: Type.STRING, description: 'E.g., "Professional Summary", "Quantifiable Metrics", "Projects Portfolio", "Certifications"' },
          status: { type: Type.STRING, description: '"missing" or "weak"' },
          description: { type: Type.STRING, description: 'Why this section is missing or weak in the candidate resume' },
          impact: { type: Type.STRING, description: 'How this deficiency impacts recruiter evaluation or ATS scanning' },
        },
        required: ['sectionName', 'status', 'description', 'impact'],
      },
    },
    improvements: {
      type: Type.ARRAY,
      description: 'Prioritized actionable recommendations to elevate the resume.',
      items: {
        type: Type.OBJECT,
        properties: {
          priority: { type: Type.STRING, description: '"high", "medium", or "low"' },
          area: { type: Type.STRING, description: 'Resume area (e.g., "Experience Bullet Points", "Header Contact Info", "Skills Presentation")' },
          suggestion: { type: Type.STRING, description: 'Concrete, actionable revision instruction' },
          rationale: { type: Type.STRING, description: 'The strategic reason for making this revision' },
        },
        required: ['priority', 'area', 'suggestion', 'rationale'],
      },
    },
    atsAnalysis: {
      type: Type.OBJECT,
      description: 'Comprehensive Applicant Tracking System (ATS) compatibility analysis.',
      properties: {
        atsScore: {
          type: Type.INTEGER,
          description: 'ATS Compatibility Score from 0 to 100 based on keyword match, parsing safety, standard headings, and contact info visibility.',
        },
        atsGrade: {
          type: Type.STRING,
          description: 'High level ATS status: e.g. "High ATS Compatibility", "Moderate ATS Compatibility", "Low ATS Compatibility", "Severe Parsing Risk".',
        },
        atsSummary: {
          type: Type.STRING,
          description: '2-3 sentence summary evaluating how successfully this resume will parse through modern ATS algorithms (Workday, Greenhouse, Lever, Taleo).',
        },
        keywordUsage: {
          type: Type.ARRAY,
          description: 'Top industry & technical keywords found in the resume.',
          items: {
            type: Type.OBJECT,
            properties: {
              keyword: { type: Type.STRING },
              category: { type: Type.STRING, description: 'e.g., "Technical Skill", "Tool & Platform", "Methodology", "Domain Term"' },
              frequency: { type: Type.INTEGER, description: 'Approximate frequency in text' },
              context: { type: Type.STRING, description: 'Brief context of usage in resume' },
            },
            required: ['keyword', 'category', 'frequency'],
          },
        },
        missingKeywords: {
          type: Type.ARRAY,
          description: 'Crucial industry-standard keywords expected for this role/field that are missing from the resume.',
          items: {
            type: Type.OBJECT,
            properties: {
              keyword: { type: Type.STRING },
              importance: { type: Type.STRING, description: '"critical" or "recommended"' },
              reason: { type: Type.STRING, description: 'Why ATS scanners filter for this term' },
            },
            required: ['keyword', 'importance', 'reason'],
          },
        },
        formattingIssues: {
          type: Type.ARRAY,
          description: 'Document formatting issues that may disrupt automated ATS text ingestion (e.g. non-standard bullets, complex characters, unusual date styles). Empty array if clean.',
          items: {
            type: Type.OBJECT,
            properties: {
              severity: { type: Type.STRING, description: '"high", "medium", or "low"' },
              issue: { type: Type.STRING },
              impact: { type: Type.STRING },
              recommendation: { type: Type.STRING },
            },
            required: ['severity', 'issue', 'impact', 'recommendation'],
          },
        },
        sectionHeadingIssues: {
          type: Type.ARRAY,
          description: 'Section heading problems (e.g., creative non-standard headings that ATS scanners cannot categorize). Empty array if standard.',
          items: {
            type: Type.OBJECT,
            properties: {
              severity: { type: Type.STRING, description: '"high", "medium", or "low"' },
              heading: { type: Type.STRING },
              issue: { type: Type.STRING },
              recommendation: { type: Type.STRING },
            },
            required: ['severity', 'heading', 'issue', 'recommendation'],
          },
        },
        skillsVisibility: {
          type: Type.OBJECT,
          description: 'Audit of skills structure for ATS indexing.',
          properties: {
            status: { type: Type.STRING, description: '"excellent", "good", "needs_improvement", or "poor"' },
            score: { type: Type.INTEGER, description: '0-100 score for skills indexing' },
            dedicatedSectionFound: { type: Type.BOOLEAN },
            observation: { type: Type.STRING },
            recommendation: { type: Type.STRING },
          },
          required: ['status', 'score', 'dedicatedSectionFound', 'observation', 'recommendation'],
        },
        contactInfoVisibility: {
          type: Type.OBJECT,
          description: 'Audit of candidate contact details parsed by ATS.',
          properties: {
            status: { type: Type.STRING, description: '"complete", "partial", or "missing"' },
            score: { type: Type.INTEGER, description: '0-100 score for contact completeness' },
            nameFound: { type: Type.BOOLEAN },
            emailFound: { type: Type.BOOLEAN },
            phoneFound: { type: Type.BOOLEAN },
            locationFound: { type: Type.BOOLEAN },
            linksFound: { type: Type.BOOLEAN },
            observation: { type: Type.STRING },
            recommendation: { type: Type.STRING },
          },
          required: ['status', 'score', 'nameFound', 'emailFound', 'phoneFound', 'locationFound', 'linksFound', 'observation', 'recommendation'],
        },
        readabilityIssues: {
          type: Type.ARRAY,
          description: 'Factors impairing readability and human recruiter skim rate after ATS ingestion (dense text, excessive acronyms, run-on bullets). Empty array if clean.',
          items: {
            type: Type.OBJECT,
            properties: {
              severity: { type: Type.STRING, description: '"high", "medium", or "low"' },
              issue: { type: Type.STRING },
              recommendation: { type: Type.STRING },
            },
            required: ['severity', 'issue', 'recommendation'],
          },
        },
        specificSuggestions: {
          type: Type.ARRAY,
          description: 'Targeted action items to optimize this resume specifically for ATS screening systems.',
          items: {
            type: Type.OBJECT,
            properties: {
              priority: { type: Type.STRING, description: '"high", "medium", or "low"' },
              category: { type: Type.STRING, description: 'e.g., "Keyword Optimization", "Header Formatting", "Structure", "Layout"' },
              suggestion: { type: Type.STRING },
              expectedBenefit: { type: Type.STRING },
            },
            required: ['priority', 'category', 'suggestion', 'expectedBenefit'],
          },
        },
      },
      required: [
        'atsScore',
        'atsGrade',
        'atsSummary',
        'keywordUsage',
        'missingKeywords',
        'formattingIssues',
        'sectionHeadingIssues',
        'skillsVisibility',
        'contactInfoVisibility',
        'readabilityIssues',
        'specificSuggestions',
      ],
    },
  },
  required: [
    'overallScore',
    'scoreGrade',
    'scoreSummary',
    'scoreBreakdown',
    'skills',
    'experience',
    'education',
    'projects',
    'certifications',
    'strengths',
    'weaknesses',
    'missingSections',
    'improvements',
    'atsAnalysis',
  ],
};

// API endpoint for Resume Analysis using Gemini
app.post('/api/analyze-resume', async (req: Request, res: Response) => {
  const { resumeText, fileName } = req.body;

  if (!resumeText || typeof resumeText !== 'string' || resumeText.trim().length < 20) {
    return res.status(400).json({
      error: 'Invalid request: Resume text must contain readable document content (minimum 20 characters).',
    });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: 'GEMINI_API_KEY environment variable is not configured on the server.',
    });
  }

  try {
    const prompt = `Analyze the following extracted resume text thoroughly and objectively.

=== DOCUMENT INFORMATION ===
File Name: ${fileName || 'Resume Document'}
Character Count: ${resumeText.length}

=== RESUME EXTRACTED CONTENT ===
${resumeText}
=== END OF RESUME CONTENT ===

CRITICAL INSTRUCTIONS:
1. ONLY utilize information explicitly found in the resume. Do NOT fabricate experience, dates, schools, or credentials.
2. If sections like "Projects", "Certifications", or "Summary" do not exist in the resume, leave those lists empty and flag them in "missingSections".
3. Evaluate the resume rigorously like an ATS parser and senior hiring manager:
   - Calculate an accurate, fair Overall Score (0-100) reflecting impact, clarity, metrics, and completeness.
   - High scores (85-100) require strong quantifiable metrics, clean bullet points, clear technical stack, and consistent progression.
   - Medium scores (60-84) indicate solid baseline experience but missing key metrics, vague bullet points, or missing sections.
   - Lower scores (<60) indicate sparse details, lack of measurable accomplishments, or significant missing information.
4. Extract all actual skills mentioned and categorize them logically.
5. Provide actionable, specific improvements with clear guidance.
6. Conduct an in-depth ATS Compatibility Audit:
   - Calculate ATS Compatibility Score (0-100) assessing machine parsability, keyword coverage, standard headers, and contact info visibility.
   - List keyword usage (top technical and domain keywords found in the text).
   - Identify missing important keywords for this candidate profile.
   - Flag any formatting issues, non-standard section headings, or readability issues that could cause ATS parsing errors or rejections.
   - Evaluate skills visibility and contact information visibility.
   - Provide concrete ATS improvement suggestions.`;

    let lastError: any = null;
    let responseText: string | undefined;

    // Model fallback chain: try primary gemini-3.8-flash first, then gemini-3.1-flash-lite if busy
    const candidateModels = ['gemini-3.8-flash', 'gemini-3.1-flash-lite'];

    for (const model of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            systemInstruction:
              'You are an expert career consultant, ATS engineering auditor, and executive recruiter. You evaluate resumes with strict fidelity to actual document text, providing precise, structured analysis with zero hallucination.',
            responseMimeType: 'application/json',
            responseSchema: analysisSchema,
          },
        });

        responseText = response.text;
        if (responseText) {
          break;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`Model ${model} failed, trying next candidate:`, err?.message || err);
      }
    }

    if (!responseText && lastError) {
      throw lastError;
    }

    if (!responseText) {
      throw new Error('Gemini returned an empty response.');
    }

    const parsedData = JSON.parse(responseText.trim());
    return res.json(parsedData);
  } catch (error: any) {
    console.error('Error analyzing resume with Gemini:', error);
    let errorMessage = error?.message || 'Failed to analyze resume with Gemini.';

    try {
      if (typeof errorMessage === 'string') {
        const jsonMatch = errorMessage.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.error?.message) {
            errorMessage = parsed.error.message;
          }
        }
      }
    } catch {
      // keep original
    }

    const isRateLimit =
      errorMessage.toLowerCase().includes('quota') ||
      errorMessage.toLowerCase().includes('resource_exhausted') ||
      errorMessage.includes('429');

    if (isRateLimit) {
      errorMessage = 'Free AI usage limit reached. Please try again later.';
    } else if (
      errorMessage.includes('503') ||
      errorMessage.includes('high demand') ||
      errorMessage.includes('UNAVAILABLE')
    ) {
      errorMessage =
        'Gemini is currently experiencing high demand. Please click Retry Analysis in a few moments.';
    }

    return res.status(isRateLimit ? 429 : 500).json({
      error: errorMessage,
      isRateLimit,
      retryAfterSeconds: isRateLimit ? 30 : undefined,
      details: error?.message,
    });
  }
});

// JSON Schema for Job Description Matching
const jobMatchSchema = {
  type: Type.OBJECT,
  properties: {
    matchScore: {
      type: Type.INTEGER,
      description: 'Job match score from 0 to 100 based on exact requirement overlap, skills, experience, and responsibilities.',
    },
    matchGrade: {
      type: Type.STRING,
      description: 'e.g., "Strong Match", "Moderate Match", "Low Match", "Significant Mismatch"',
    },
    matchSummary: {
      type: Type.STRING,
      description: '2-3 sentence overview explaining how well this candidate fits the role requirements.',
    },
    matchingSkills: {
      type: Type.ARRAY,
      description: 'Skills explicitly mentioned or required in the job description that are evidenced in the resume.',
      items: {
        type: Type.OBJECT,
        properties: {
          skill: { type: Type.STRING },
          category: { type: Type.STRING, description: 'e.g., "Technical Skill", "Framework", "Cloud/DevOps", "Soft Skill"' },
          foundInResume: { type: Type.STRING, description: 'Where/how evidenced in the resume' },
          relevance: { type: Type.STRING, description: 'Why critical for this job posting' },
        },
        required: ['skill', 'category', 'foundInResume'],
      },
    },
    missingSkills: {
      type: Type.ARRAY,
      description: 'Required or preferred skills mentioned in the job description that are NOT found in the resume.',
      items: {
        type: Type.OBJECT,
        properties: {
          skill: { type: Type.STRING },
          importance: { type: Type.STRING, description: '"required" or "preferred"' },
          contextInJob: { type: Type.STRING, description: 'How it is referenced in the job description' },
          advice: { type: Type.STRING, description: 'Actionable guidance if the candidate has adjacent knowledge' },
        },
        required: ['skill', 'importance', 'contextInJob'],
      },
    },
    matchingKeywords: {
      type: Type.ARRAY,
      description: 'Important domain, industry, and tooling keywords from the job description found in the resume.',
      items: {
        type: Type.OBJECT,
        properties: {
          keyword: { type: Type.STRING },
          category: { type: Type.STRING },
          resumeContext: { type: Type.STRING },
        },
        required: ['keyword', 'category'],
      },
    },
    missingKeywords: {
      type: Type.ARRAY,
      description: 'Important keywords and buzzwords from the job description missing from the resume.',
      items: {
        type: Type.OBJECT,
        properties: {
          keyword: { type: Type.STRING },
          importance: { type: Type.STRING, description: '"high" or "medium"' },
          reason: { type: Type.STRING, description: 'Why the job description emphasizes this term' },
        },
        required: ['keyword', 'importance', 'reason'],
      },
    },
    relevantExperience: {
      type: Type.ARRAY,
      description: 'Specific work experience items or accomplishments from the resume that directly align with this job posting.',
      items: {
        type: Type.OBJECT,
        properties: {
          roleOrProject: { type: Type.STRING },
          alignment: { type: Type.STRING, description: 'How this matches the job requirements' },
          evidence: { type: Type.STRING, description: 'Specific bullet or metric from the resume' },
        },
        required: ['roleOrProject', 'alignment', 'evidence'],
      },
    },
    importantGaps: {
      type: Type.ARRAY,
      description: 'Key gaps between what the job description requires and what the resume presents (e.g. years of experience, specific domain, leadership).',
      items: {
        type: Type.OBJECT,
        properties: {
          area: { type: Type.STRING },
          gapDescription: { type: Type.STRING },
          severity: { type: Type.STRING, description: '"critical" or "moderate"' },
          mitigation: { type: Type.STRING, description: 'How the candidate could address or compensate for this gap' },
        },
        required: ['area', 'gapDescription', 'severity', 'mitigation'],
      },
    },
    recommendations: {
      type: Type.ARRAY,
      description: 'Specific, actionable edits and recommendations to tailor this resume specifically for this job description.',
      items: {
        type: Type.OBJECT,
        properties: {
          priority: { type: Type.STRING, description: '"high", "medium", or "low"' },
          targetSection: { type: Type.STRING, description: 'Section to modify (e.g., "Summary", "Experience", "Skills")' },
          recommendation: { type: Type.STRING },
          rationale: { type: Type.STRING },
        },
        required: ['priority', 'targetSection', 'recommendation', 'rationale'],
      },
    },
    skillGapAnalysis: {
      type: Type.OBJECT,
      description: 'Comprehensive skill gap analysis between the candidate resume and target job description.',
      properties: {
        summary: {
          type: Type.STRING,
          description: 'A 2-sentence executive summary of the candidate skill gap for this position.',
        },
        currentSkills: {
          type: Type.ARRAY,
          description: 'Skills detected in the candidate resume that are relevant to this domain.',
          items: {
            type: Type.OBJECT,
            properties: {
              skill: { type: Type.STRING },
              category: { type: Type.STRING },
              evidenceStrength: { type: Type.STRING, description: '"strong", "moderate", or "weak"' },
            },
            required: ['skill', 'category', 'evidenceStrength'],
          },
        },
        requiredSkills: {
          type: Type.ARRAY,
          description: 'All core skills required or expected by the job description.',
          items: {
            type: Type.OBJECT,
            properties: {
              skill: { type: Type.STRING },
              priority: { type: Type.STRING, description: '"High", "Medium", or "Low"' },
              isMet: { type: Type.BOOLEAN, description: 'True if candidate demonstrates this in resume' },
              rationale: { type: Type.STRING, description: 'Why this skill is needed for this role' },
            },
            required: ['skill', 'priority', 'isMet', 'rationale'],
          },
        },
        missingSkills: {
          type: Type.ARRAY,
          description: 'Key skills required or preferred in the job description that the candidate lacks.',
          items: {
            type: Type.OBJECT,
            properties: {
              skill: { type: Type.STRING },
              priority: { type: Type.STRING, description: '"High", "Medium", or "Low"' },
              category: { type: Type.STRING },
              impactOnHiring: { type: Type.STRING, description: 'How missing this affects hiring chances' },
            },
            required: ['skill', 'priority', 'category', 'impactOnHiring'],
          },
        },
        skillsNeedingEvidence: {
          type: Type.ARRAY,
          description: 'Skills mentioned or hinted in the resume that lack measurable achievements, context, or strong proof.',
          items: {
            type: Type.OBJECT,
            properties: {
              skill: { type: Type.STRING },
              currentEvidence: { type: Type.STRING, description: 'What is currently written in the resume' },
              howToStrengthen: { type: Type.STRING, description: 'Specific bullet rewrite or metric to add' },
              priority: { type: Type.STRING, description: '"High", "Medium", or "Low"' },
            },
            required: ['skill', 'currentEvidence', 'howToStrengthen', 'priority'],
          },
        },
        recommendedSkillsToLearn: {
          type: Type.ARRAY,
          description: 'Top strategic skills to acquire to close the gap for this and similar positions.',
          items: {
            type: Type.OBJECT,
            properties: {
              skill: { type: Type.STRING },
              priority: { type: Type.STRING, description: '"High", "Medium", or "Low"' },
              estimatedTimeToLearn: { type: Type.STRING, description: 'e.g. "1-2 weeks", "3-4 weeks"' },
              marketDemand: { type: Type.STRING, description: 'Why this skill provides high return on time' },
            },
            required: ['skill', 'priority', 'estimatedTimeToLearn', 'marketDemand'],
          },
        },
        learningRoadmap: {
          type: Type.ARRAY,
          description: 'Step-by-step practical roadmap to bridge the high-priority missing skills.',
          items: {
            type: Type.OBJECT,
            properties: {
              phase: { type: Type.STRING, description: 'e.g. "Phase 1: Core Fundamentals (Weeks 1-2)"' },
              title: { type: Type.STRING },
              focusSkills: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              learningObjectives: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              practicalProjectIdea: { type: Type.STRING, description: 'Concrete hands-on project to prove capability' },
              resumeBulletDraft: { type: Type.STRING, description: 'Target resume bullet point to add once completed' },
            },
            required: ['phase', 'title', 'focusSkills', 'learningObjectives', 'practicalProjectIdea', 'resumeBulletDraft'],
          },
        },
      },
      required: [
        'summary',
        'currentSkills',
        'requiredSkills',
        'missingSkills',
        'skillsNeedingEvidence',
        'recommendedSkillsToLearn',
        'learningRoadmap',
      ],
    },
  },
  required: [
    'matchScore',
    'matchGrade',
    'matchSummary',
    'matchingSkills',
    'missingSkills',
    'matchingKeywords',
    'missingKeywords',
    'relevantExperience',
    'importantGaps',
    'recommendations',
    'skillGapAnalysis',
  ],
};

// API endpoint for Job Description Matching using Gemini
app.post('/api/match-job', async (req: Request, res: Response) => {
  const { resumeText, jobDescription, fileName } = req.body;

  if (!resumeText || typeof resumeText !== 'string' || resumeText.trim().length < 20) {
    return res.status(400).json({
      error: 'Invalid request: Resume text must contain readable document content (minimum 20 characters).',
    });
  }

  if (!jobDescription || typeof jobDescription !== 'string' || jobDescription.trim().length < 30) {
    return res.status(400).json({
      error: 'Invalid request: Please provide a job description with at least 30 characters.',
    });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: 'GEMINI_API_KEY environment variable is not configured on the server.',
    });
  }

  try {
    // Keep requests efficient by sending only the necessary resume/job-description text
    const sanitizedResume = resumeText.trim().slice(0, 16000);
    const sanitizedJob = jobDescription.trim().slice(0, 8000);

    const prompt = `Compare the following candidate resume against the target job description thoroughly and objectively.

=== TARGET JOB DESCRIPTION ===
${sanitizedJob}
=== END OF JOB DESCRIPTION ===

=== CANDIDATE RESUME ===
File Name: ${fileName || 'Candidate Resume'}
${sanitizedResume}
=== END OF RESUME ===

CRITICAL INSTRUCTIONS:
1. Ground your evaluation strictly in the provided resume and job description. Do NOT invent skills, achievements, or requirements.
2. Evaluate the match score (0-100) based on realistic hiring criteria:
   - 85-100: Exceptional candidate matching virtually all core requirements, tech stack, and experience level.
   - 70-84: Strong candidate matching main technical skills with a few minor gaps in secondary requirements.
   - 50-69: Moderate match with transferable skills but missing key required technologies or necessary seniority.
   - Below 50: Significant misalignment in role, technology stack, or domain.
3. Identify Matching Skills and Missing Skills with exact fidelity to the text.
4. Highlight Matching Keywords and Missing Keywords from the job description.
5. Identify Relevant Experience that proves suitability for the job duties.
6. Note any Important Gaps (e.g., specific framework experience, degree requirements, years of experience, certifications).
7. Provide specific, tailored recommendations to help the candidate optimize their resume for this exact role.
8. Conduct an in-depth Skill Gap Analysis:
   - Identify Current Skills from the candidate resume with evidence strength ("strong", "moderate", "weak").
   - Identify Required Skills from the job description with priority ("High", "Medium", "Low") and whether met.
   - Detail Missing Skills with priority ("High", "Medium", "Low"), category, and impact on hiring.
   - Pinpoint Skills Needing Evidence: skills mentioned or implied in the resume that lack measurable metrics, depth, or concrete project context, with specific rewrite advice.
   - Recommend Top Skills to Learn: high-ROI skills to bridge the gap with estimated time to learn and market demand.
   - Build a Practical Learning Roadmap: actionable phased milestones for high-priority missing skills, with focus skills, objectives, a hands-on project idea, and an example resume bullet point to add upon completion.`;

    let lastError: any = null;
    let responseText: string | undefined;

    // Strict Free Tier models only: gemini-3.8-flash primary with gemini-3.1-flash-lite fallback
    const candidateModels = ['gemini-3.8-flash', 'gemini-3.1-flash-lite'];

    for (const model of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            systemInstruction:
              'You are a senior technical recruiter and talent acquisition leader. You evaluate candidate resumes against job descriptions with rigorous precision and zero hallucination.',
            responseMimeType: 'application/json',
            responseSchema: jobMatchSchema,
          },
        });

        responseText = response.text;
        if (responseText) {
          break;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`Job match model ${model} failed, trying next candidate:`, err?.message || err);
      }
    }

    if (!responseText && lastError) {
      throw lastError;
    }

    if (!responseText) {
      throw new Error('Gemini returned an empty response.');
    }

    const parsedData = JSON.parse(responseText.trim());
    return res.json(parsedData);
  } catch (error: any) {
    console.error('Error matching job description with Gemini:', error);
    let errorMessage = error?.message || 'Failed to match job description with Gemini.';

    try {
      if (typeof errorMessage === 'string') {
        const jsonMatch = errorMessage.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.error?.message) {
            errorMessage = parsed.error.message;
          }
        }
      }
    } catch {
      // keep original
    }

    const isRateLimit =
      errorMessage.toLowerCase().includes('quota') ||
      errorMessage.toLowerCase().includes('resource_exhausted') ||
      errorMessage.includes('429');

    if (isRateLimit) {
      errorMessage = 'Free AI usage limit reached. Please try again later.';
    } else if (
      errorMessage.includes('503') ||
      errorMessage.includes('high demand') ||
      errorMessage.includes('UNAVAILABLE')
    ) {
      errorMessage =
        'Gemini is currently experiencing high demand. Please click Retry in a few moments.';
    }

    return res.status(isRateLimit ? 429 : 500).json({
      error: errorMessage,
      isRateLimit,
      retryAfterSeconds: isRateLimit ? 30 : undefined,
      details: error?.message,
    });
  }
});

// JSON Schema for AI Resume Improvements
const improvementsSchema = {
  type: Type.OBJECT,
  properties: {
    overview: {
      type: Type.STRING,
      description: 'A 2-sentence summary of the key enhancement strategy applied to this resume.',
    },
    professionalSummary: {
      type: Type.OBJECT,
      description: 'Original vs improved professional summary.',
      properties: {
        original: { type: Type.STRING },
        improved: { type: Type.STRING },
        changesSummary: { type: Type.STRING },
        keyActionVerbs: { type: Type.ARRAY, items: { type: Type.STRING } },
        addedKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: ['original', 'improved', 'changesSummary', 'keyActionVerbs', 'addedKeywords'],
    },
    experienceBulletPoints: {
      type: Type.ARRAY,
      description: 'Original vs improved experience bullet points transformed with strong action verbs and structure.',
      items: {
        type: Type.OBJECT,
        properties: {
          roleOrCompany: { type: Type.STRING },
          originalBullet: { type: Type.STRING },
          improvedBullet: { type: Type.STRING },
          actionVerbUsed: { type: Type.STRING },
          measurabilityTip: { type: Type.STRING },
          keywordsIncorporated: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: [
          'roleOrCompany',
          'originalBullet',
          'improvedBullet',
          'actionVerbUsed',
          'measurabilityTip',
          'keywordsIncorporated',
        ],
      },
    },
    projectDescriptions: {
      type: Type.ARRAY,
      description: 'Original vs improved project descriptions highlighting technical challenges and outcomes.',
      items: {
        type: Type.OBJECT,
        properties: {
          projectTitle: { type: Type.STRING },
          originalDescription: { type: Type.STRING },
          improvedDescription: { type: Type.STRING },
          technicalHighlights: { type: Type.ARRAY, items: { type: Type.STRING } },
          measurabilityTip: { type: Type.STRING },
        },
        required: [
          'projectTitle',
          'originalDescription',
          'improvedDescription',
          'technicalHighlights',
          'measurabilityTip',
        ],
      },
    },
    skillsSection: {
      type: Type.OBJECT,
      description: 'Optimized, categorized skills section formatted for maximum ATS readability and recruiter scanning.',
      properties: {
        originalSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
        improvedCategorizedSkills: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              category: { type: Type.STRING },
              skills: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ['category', 'skills'],
          },
        },
        organizationRationale: { type: Type.STRING },
        keywordAlignment: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: [
        'originalSkills',
        'improvedCategorizedSkills',
        'organizationRationale',
        'keywordAlignment',
      ],
    },
    actionVerbUpgrades: {
      type: Type.ARRAY,
      description: 'Weak or passive verbs replaced with dynamic, executive-level power verbs.',
      items: {
        type: Type.OBJECT,
        properties: {
          originalVerbOrPhrase: { type: Type.STRING },
          recommendedVerb: { type: Type.STRING },
          rationale: { type: Type.STRING },
          exampleSentence: { type: Type.STRING },
        },
        required: ['originalVerbOrPhrase', 'recommendedVerb', 'rationale', 'exampleSentence'],
      },
    },
    measurableAchievementSuggestions: {
      type: Type.ARRAY,
      description: 'Concrete suggestions showing candidate how to insert realistic metrics using the X-Y-Z formula without fabricating data.',
      items: {
        type: Type.OBJECT,
        properties: {
          currentClaim: { type: Type.STRING },
          suggestionToQuantify: { type: Type.STRING },
          metricFramework: { type: Type.STRING },
        },
        required: ['currentClaim', 'suggestionToQuantify', 'metricFramework'],
      },
    },
    keywordEnhancements: {
      type: Type.ARRAY,
      description: 'Targeted keywords added or recommended based on the job description and industry standards.',
      items: {
        type: Type.OBJECT,
        properties: {
          keyword: { type: Type.STRING },
          status: { type: Type.STRING, description: '"integrated" or "recommended"' },
          placementSuggestion: { type: Type.STRING },
          relevanceToRole: { type: Type.STRING },
        },
        required: ['keyword', 'status', 'placementSuggestion', 'relevanceToRole'],
      },
    },
  },
  required: [
    'overview',
    'professionalSummary',
    'experienceBulletPoints',
    'projectDescriptions',
    'skillsSection',
    'actionVerbUpgrades',
    'measurableAchievementSuggestions',
    'keywordEnhancements',
  ],
};

// API endpoint for AI Resume Improvements using Gemini Free Tier
app.post('/api/improve-resume', async (req: Request, res: Response) => {
  const { resumeText, jobDescription, fileName } = req.body;

  if (!resumeText || typeof resumeText !== 'string' || resumeText.trim().length < 20) {
    return res.status(400).json({
      error: 'Invalid request: Resume text must contain readable document content (minimum 20 characters).',
    });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: 'GEMINI_API_KEY environment variable is not configured on the server.',
    });
  }

  try {
    const sanitizedResume = resumeText.trim().slice(0, 16000);
    const sanitizedJob = typeof jobDescription === 'string' && jobDescription.trim().length > 20
      ? jobDescription.trim().slice(0, 8000)
      : '';

    const prompt = `You are a master executive resume writer, ATS optimization architect, and career coach.
Analyze the candidate's resume and generate high-impact, professional improvements.

=== CANDIDATE RESUME ===
File Name: ${fileName || 'Resume Document'}
${sanitizedResume}
=== END OF RESUME ===
${
  sanitizedJob
    ? `\n=== TARGET JOB DESCRIPTION ===\n${sanitizedJob}\n=== END OF TARGET JOB DESCRIPTION ===\n`
    : ''
}
CRITICAL INSTRUCTIONS & STRICT TRUTHFULNESS GUARDRAILS:
1. NEVER INVENT experience, skills, education, achievements, metrics, companies, dates, or numbers.
2. ONLY improve, polish, restructure, and elevate information ALREADY present in the resume.
3. For bullet points and summaries, if the original resume lacks specific metrics, do NOT fabricate fake numbers (like "increased sales by 47%"). Instead, use phrasing with bracketed suggestions like "[quantify: e.g. % reduction or team size]" or rephrase with strong qualitative impact.
4. Provide clear Original -> Improved pairs for every section:
   - Professional Summary (crisp, compelling 3-4 sentence hook highlighting candidate's genuine background).
   - Experience Bullet Points (transform weak passive wording into [Power Verb] + [Specific Technical Context] + [Business Impact]).
   - Project Descriptions (highlight real tech stack, problem solved, and architecture).
   - Skills Section (reorganized into logical ATS-friendly categories based on what candidate has).
   - Action Verb Upgrades (show weak phrasing like "Responsible for", "Helped with", "Worked on" replaced by power verbs like "Architected", "Engineered", "Spearheaded").
   - Measurable Achievement Suggestions (show candidate how to quantify their existing bullets using Google's X-Y-Z formula: "Accomplished [X] as measured by [Y], by doing [Z]").
   - Keyword Enhancements (seamlessly integrate relevant keywords from the job description if provided, or domain best practices).`;

    let lastError: any = null;
    let responseText: string | undefined;

    // Strict Free Tier models only
    const candidateModels = ['gemini-3.8-flash', 'gemini-3.1-flash-lite'];

    for (const model of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            systemInstruction:
              'You are a elite executive resume writer and ATS auditor. You improve resumes with extreme fidelity to the text, zero hallucination of facts or numbers, and maximum linguistic power.',
            responseMimeType: 'application/json',
            responseSchema: improvementsSchema,
          },
        });

        responseText = response.text;
        if (responseText) {
          break;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`Improve resume model ${model} failed, trying next candidate:`, err?.message || err);
      }
    }

    if (!responseText && lastError) {
      throw lastError;
    }

    if (!responseText) {
      throw new Error('Gemini returned an empty response.');
    }

    const parsedData = JSON.parse(responseText.trim());
    return res.json(parsedData);
  } catch (error: any) {
    console.error('Error improving resume with Gemini:', error);
    let errorMessage = error?.message || 'Failed to generate resume improvements with Gemini.';

    try {
      if (typeof errorMessage === 'string') {
        const jsonMatch = errorMessage.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.error?.message) {
            errorMessage = parsed.error.message;
          }
        }
      }
    } catch {
      // keep original
    }

    const isRateLimit =
      errorMessage.toLowerCase().includes('quota') ||
      errorMessage.toLowerCase().includes('resource_exhausted') ||
      errorMessage.includes('429');

    if (isRateLimit) {
      errorMessage = 'Free AI usage limit reached. Please try again later.';
    } else if (
      errorMessage.includes('503') ||
      errorMessage.includes('high demand') ||
      errorMessage.includes('UNAVAILABLE')
    ) {
      errorMessage =
        'Gemini is currently experiencing high demand. Please click Retry in a few moments.';
    }

    return res.status(isRateLimit ? 429 : 500).json({
      error: errorMessage,
      isRateLimit,
      retryAfterSeconds: isRateLimit ? 30 : undefined,
      details: error?.message,
    });
  }
});

async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
