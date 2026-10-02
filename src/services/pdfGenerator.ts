/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { jsPDF } from 'jspdf';
import { ResumeAnalysisResult } from './resumeAnalyzer.ts';
import { JobMatchResult } from './jobMatcher.ts';
import { ResumeImprovementsResult } from './resumeImprover.ts';

export interface GeneratePdfOptions {
  fileName: string;
  analysis: ResumeAnalysisResult;
  jobMatch?: JobMatchResult | null;
  improvements?: ResumeImprovementsResult | null;
}

export function generateResumeAnalysisPdf({
  fileName,
  analysis,
  jobMatch,
  improvements,
}: GeneratePdfOptions): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  const bottomThreshold = pageHeight - 20;

  let y = margin;

  // Color constants (Navy, Blue, Cream theme)
  const COLOR_DEEP_NAVY = [1, 7, 54] as const; // #010736
  const COLOR_DARK_NAVY = [13, 27, 61] as const; // #0D1B3D
  const COLOR_BLUE = [41, 67, 122] as const; // #29437A
  const COLOR_CREAM = [255, 243, 208] as const; // #FFF3D0
  const COLOR_SLATE_BG = [248, 250, 252] as const; // #F8FAFC
  const COLOR_SLATE_BORDER = [226, 232, 240] as const; // #E2E8F0
  const COLOR_SLATE_TEXT = [100, 116, 139] as const; // #64748B
  const COLOR_EMERALD = [5, 150, 105] as const; // #059669
  const COLOR_AMBER = [217, 119, 6] as const; // #D97706
  const COLOR_ROSE = [225, 29, 72] as const; // #E11D48

  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Helper: check page bounds and auto-page break
  const ensureSpace = (neededHeight: number): void => {
    if (y + neededHeight > bottomThreshold) {
      doc.addPage();
      y = margin + 8;
      drawRunningHeader();
    }
  };

  // Helper: Running header on pages 2+
  const drawRunningHeader = () => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...COLOR_SLATE_TEXT);
    doc.text('AI Resume Analyzer · Candidate Evaluation & Audit Report', margin, margin);
    const rightText = fileName ? fileName.substring(0, 32) : 'Resume Analysis';
    doc.text(rightText, pageWidth - margin, margin, { align: 'right' });

    doc.setDrawColor(...COLOR_SLATE_BORDER);
    doc.setLineWidth(0.3);
    doc.line(margin, margin + 2.5, pageWidth - margin, margin + 2.5);
    y = margin + 7;
  };

  // Helper: Section title bar with navy text and cream accent
  const drawSectionHeader = (title: string, tag?: string) => {
    ensureSpace(14);
    doc.setFillColor(...COLOR_SLATE_BG);
    doc.roundedRect(margin, y, contentWidth, 8, 1.5, 1.5, 'F');

    // Navy accent bar on left
    doc.setFillColor(...COLOR_BLUE);
    doc.roundedRect(margin, y, 2.5, 8, 1, 1, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(...COLOR_DEEP_NAVY);
    doc.text(title, margin + 5, y + 5.5);

    if (tag) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...COLOR_BLUE);
      doc.text(tag, pageWidth - margin - 3, y + 5.5, { align: 'right' });
    }

    y += 11;
  };

  // Helper: Wrapped multiline paragraph
  const drawParagraph = (
    text: string,
    fontSize = 9,
    color: readonly [number, number, number] = COLOR_DARK_NAVY,
    lineSpacing = 4.2
  ): void => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(fontSize);
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(text, contentWidth);
    ensureSpace(lines.length * lineSpacing + 2);
    lines.forEach((line: string) => {
      doc.text(line, margin, y);
      y += lineSpacing;
    });
    y += 1.5;
  };

  // -------------------------------------------------------------
  // 1. PAGE 1: HERO HEADER BANNER
  // -------------------------------------------------------------
  const headerBannerHeight = 36;
  doc.setFillColor(...COLOR_DEEP_NAVY);
  doc.roundedRect(margin, y, contentWidth, headerBannerHeight, 3, 3, 'F');

  // Gold / Cream top accent line
  doc.setFillColor(...COLOR_CREAM);
  doc.roundedRect(margin + 4, y + 3, 32, 2, 1, 1, 'F');

  // Brand and document title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...COLOR_CREAM);
  doc.text('AI RESUME ANALYZER  ·  EXECUTIVE AUDIT REPORT', margin + 4, y + 10);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text('Comprehensive Resume & ATS Analysis', margin + 4, y + 18);

  // File and date metadata
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225); // Slate 300
  const cleanFileName = fileName || 'Uploaded_Resume.pdf';
  doc.text(`Candidate File: ${cleanFileName}  |  Generated: ${currentDate}`, margin + 4, y + 25);
  doc.text('Verified AI Evaluation  ·  Strictly Grounded in Original Resume Content', margin + 4, y + 31);

  // Score Badges in top-right of banner
  const scoreCardWidth = 32;
  const scoreCardHeight = 28;
  const scoreCardX = pageWidth - margin - scoreCardWidth - 4;
  const scoreCardY = y + 4;

  doc.setFillColor(...COLOR_DARK_NAVY);
  doc.roundedRect(scoreCardX, scoreCardY, scoreCardWidth, scoreCardHeight, 2, 2, 'F');
  doc.setDrawColor(...COLOR_BLUE);
  doc.setLineWidth(0.4);
  doc.roundedRect(scoreCardX, scoreCardY, scoreCardWidth, scoreCardHeight, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...COLOR_CREAM);
  doc.text('OVERALL SCORE', scoreCardX + scoreCardWidth / 2, scoreCardY + 6, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text(`${analysis.overallScore}`, scoreCardX + scoreCardWidth / 2 - 4, scoreCardY + 16, {
    align: 'right',
  });
  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225);
  doc.text('/100', scoreCardX + scoreCardWidth / 2 - 3, scoreCardY + 16);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  const gradeColor =
    analysis.overallScore >= 80 ? COLOR_CREAM : analysis.overallScore >= 60 ? [147, 197, 253] : [253, 186, 116];
  doc.setTextColor(gradeColor[0], gradeColor[1], gradeColor[2]);
  doc.text(`${analysis.scoreGrade}`, scoreCardX + scoreCardWidth / 2, scoreCardY + 23, { align: 'center' });

  y += headerBannerHeight + 6;

  // -------------------------------------------------------------
  // 2. EXECUTIVE RECRUITER VERDICT & DIMENSIONS
  // -------------------------------------------------------------
  drawSectionHeader('1. Executive Recruiter Verdict & Score Breakdown');

  // Executive summary callout box
  const summaryLines = doc.splitTextToSize(analysis.scoreSummary, contentWidth - 10);
  const summaryBoxHeight = Math.max(16, summaryLines.length * 4.2 + 8);

  doc.setFillColor(...COLOR_SLATE_BG);
  doc.roundedRect(margin, y, contentWidth, summaryBoxHeight, 2, 2, 'F');
  doc.setDrawColor(...COLOR_BLUE);
  doc.setLineWidth(0.8);
  doc.line(margin, y, margin, y + summaryBoxHeight);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...COLOR_DEEP_NAVY);
  doc.text('Key Recruiter Impression:', margin + 4, y + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...COLOR_DARK_NAVY);
  summaryLines.forEach((line: string, idx: number) => {
    doc.text(line, margin + 4, y + 10.5 + idx * 4.2);
  });

  y += summaryBoxHeight + 5;

  // 4 Dimensions 2x2 Grid
  const dimWidth = (contentWidth - 4) / 4;
  const dimHeight = 16;
  const dimensions = [
    { label: 'Impact & Metrics', score: analysis.scoreBreakdown.impactAndMetrics },
    { label: 'Clarity & Formatting', score: analysis.scoreBreakdown.clarityAndFormatting },
    { label: 'Experience Relevance', score: analysis.scoreBreakdown.experienceRelevance },
    { label: 'Skills & Tech Depth', score: analysis.scoreBreakdown.skillsDepth },
  ];

  dimensions.forEach((dim, idx) => {
    const dimX = margin + idx * (dimWidth + 1.3);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(dimX, y, dimWidth, dimHeight, 1.5, 1.5, 'F');
    doc.setDrawColor(...COLOR_SLATE_BORDER);
    doc.setLineWidth(0.3);
    doc.roundedRect(dimX, y, dimWidth, dimHeight, 1.5, 1.5, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...COLOR_SLATE_TEXT);
    const shortLabel = doc.splitTextToSize(dim.label, dimWidth - 4)[0];
    doc.text(shortLabel, dimX + 3, y + 4.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...COLOR_DEEP_NAVY);
    doc.text(`${dim.score}`, dimX + 3, y + 10.5);
    doc.setFontSize(7.5);
    doc.setTextColor(...COLOR_SLATE_TEXT);
    doc.text('/100', dimX + 13, y + 10.5);

    // Progress bar
    const barWidth = dimWidth - 6;
    const fillWidth = (dim.score / 100) * barWidth;
    doc.setFillColor(226, 232, 240);
    doc.roundedRect(dimX + 3, y + 12.5, barWidth, 1.5, 0.5, 0.5, 'F');
    const barColor = dim.score >= 80 ? COLOR_EMERALD : dim.score >= 60 ? COLOR_BLUE : COLOR_AMBER;
    doc.setFillColor(barColor[0], barColor[1], barColor[2]);
    doc.roundedRect(dimX + 3, y + 12.5, Math.max(1, fillWidth), 1.5, 0.5, 0.5, 'F');
  });

  y += dimHeight + 7;

  // -------------------------------------------------------------
  // 3. SKILLS INVENTORY (CATEGORIZED)
  // -------------------------------------------------------------
  drawSectionHeader('2. Skills Inventory', `${analysis.skills.length} Categories Extracted`);

  if (analysis.skills && analysis.skills.length > 0) {
    analysis.skills.forEach((skillCat) => {
      ensureSpace(12);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(...COLOR_DEEP_NAVY);
      doc.text(skillCat.category, margin, y + 3.5);

      const itemsStr = skillCat.items.join('  •  ');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...COLOR_DARK_NAVY);
      const skillLines = doc.splitTextToSize(itemsStr, contentWidth - 3);
      skillLines.forEach((sLine: string) => {
        y += 4;
        ensureSpace(5);
        doc.text(sLine, margin + 2, y + 2.5);
      });
      y += 5;
    });
  } else {
    drawParagraph('No categorized skills detected in original text.', 8.5, COLOR_SLATE_TEXT);
  }
  y += 3;

  // -------------------------------------------------------------
  // 4. STRENGTHS & WEAKNESSES
  // -------------------------------------------------------------
  drawSectionHeader('3. Strengths & Weaknesses Assessment');

  const halfWidth = (contentWidth - 4) / 2;

  // Render Strengths
  const renderQualityPoints = (
    title: string,
    items: { title: string; description: string }[],
    isPositive: boolean
  ) => {
    ensureSpace(12);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    const qColor = isPositive ? COLOR_EMERALD : COLOR_ROSE;
    doc.setTextColor(qColor[0], qColor[1], qColor[2]);
    doc.text(`${isPositive ? '✓' : '▲'} ${title} (${items.length})`, margin, y + 4);
    y += 6;

    items.forEach((item, idx) => {
      const descLines = doc.splitTextToSize(item.description, contentWidth - 8);
      const cardHeight = descLines.length * 3.8 + 8;
      ensureSpace(cardHeight + 2);

      doc.setFillColor(isPositive ? 240 : 255, isPositive ? 253 : 241, isPositive ? 244 : 242);
      doc.roundedRect(margin, y, contentWidth, cardHeight, 1.5, 1.5, 'F');
      doc.setDrawColor(isPositive ? 167 : 254, isPositive ? 243 : 205, isPositive ? 208 : 211);
      doc.setLineWidth(0.3);
      doc.roundedRect(margin, y, contentWidth, cardHeight, 1.5, 1.5, 'S');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(...COLOR_DEEP_NAVY);
      doc.text(`${idx + 1}. ${item.title}`, margin + 3, y + 4.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...COLOR_DARK_NAVY);
      descLines.forEach((line: string, lIdx: number) => {
        doc.text(line, margin + 3, y + 8.5 + lIdx * 3.8);
      });

      y += cardHeight + 2.5;
    });
  };

  renderQualityPoints('Key Strengths', analysis.strengths || [], true);
  y += 2;
  renderQualityPoints('Identified Weaknesses & Deficiencies', analysis.weaknesses || [], false);
  y += 4;

  // -------------------------------------------------------------
  // 5. ATS ANALYSIS & MACHINE PARSABILITY
  // -------------------------------------------------------------
  const ats = analysis.atsAnalysis;
  drawSectionHeader(
    '4. ATS Compatibility & Machine Parsability',
    `ATS Score: ${ats ? ats.atsScore : 'N/A'}/100 (${ats ? ats.atsGrade : ''})`
  );

  if (ats) {
    // ATS Summary card
    ensureSpace(18);
    doc.setFillColor(...COLOR_SLATE_BG);
    doc.roundedRect(margin, y, contentWidth, 14, 1.5, 1.5, 'F');
    doc.setDrawColor(...COLOR_SLATE_BORDER);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, y, contentWidth, 14, 1.5, 1.5, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...COLOR_DEEP_NAVY);
    doc.text('ATS Audit Summary:', margin + 3, y + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...COLOR_DARK_NAVY);
    const atsSummaryLines = doc.splitTextToSize(ats.atsSummary, contentWidth - 6);
    doc.text(atsSummaryLines[0] || '', margin + 3, y + 9);
    if (atsSummaryLines[1]) {
      doc.text(atsSummaryLines[1], margin + 3, y + 12.5);
    }
    y += 17;

    // ATS Checkboxes row
    const atsChecks = [
      {
        name: 'File Formatting',
        status: ats.formattingIssues.length === 0 ? 'Clean / Compliant' : `${ats.formattingIssues.length} Issue(s)`,
        pass: ats.formattingIssues.length === 0,
      },
      {
        name: 'Standard Headings',
        status:
          ats.sectionHeadingIssues.length === 0 ? 'Industry Standard' : `${ats.sectionHeadingIssues.length} Issue(s)`,
        pass: ats.sectionHeadingIssues.length === 0,
      },
      {
        name: 'Skills Visibility',
        status: ats.skillsVisibility.status.replace('_', ' ').toUpperCase(),
        pass: ats.skillsVisibility.score >= 70,
      },
      {
        name: 'Contact Header',
        status: ats.contactInfoVisibility.status.toUpperCase(),
        pass: ats.contactInfoVisibility.score >= 70,
      },
    ];

    const checkWidth = (contentWidth - 4.5) / 4;
    atsChecks.forEach((chk, idx) => {
      const cX = margin + idx * (checkWidth + 1.5);
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(cX, y, checkWidth, 12, 1, 1, 'F');
      doc.setDrawColor(...COLOR_SLATE_BORDER);
      doc.setLineWidth(0.3);
      doc.roundedRect(cX, y, checkWidth, 12, 1, 1, 'S');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(...COLOR_SLATE_TEXT);
      doc.text(chk.name, cX + 2.5, y + 4);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      const chkColor = chk.pass ? COLOR_EMERALD : COLOR_AMBER;
      doc.setTextColor(chkColor[0], chkColor[1], chkColor[2]);
      doc.text(`${chk.pass ? '✓' : '▲'} ${chk.status}`, cX + 2.5, y + 9);
    });
    y += 15;

    // Indexed Keywords and Missing Keywords
    ensureSpace(20);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...COLOR_DEEP_NAVY);
    doc.text('Key Technical & Domain Keywords Found in Resume:', margin, y + 3);
    y += 5;

    const foundKws = ats.keywordUsage.slice(0, 16).map((k) => `${k.keyword} (${k.frequency}x)`);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...COLOR_DARK_NAVY);
    const kwLines = doc.splitTextToSize(foundKws.join('  •  '), contentWidth);
    kwLines.forEach((kLine: string) => {
      ensureSpace(4);
      doc.text(kLine, margin, y + 2);
      y += 4;
    });
    y += 2;

    if (ats.missingKeywords && ats.missingKeywords.length > 0) {
      ensureSpace(14);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(...COLOR_ROSE);
      doc.text('Recommended ATS Keywords to Add:', margin, y + 3);
      y += 5;

      const missingKws = ats.missingKeywords.map((m) => `${m.keyword} [${m.importance}]`);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...COLOR_DARK_NAVY);
      const mLines = doc.splitTextToSize(missingKws.join('  •  '), contentWidth);
      mLines.forEach((mLine: string) => {
        ensureSpace(4);
        doc.text(mLine, margin, y + 2);
        y += 4;
      });
      y += 2;
    }
  }
  y += 4;

  // -------------------------------------------------------------
  // 6. TARGET JOB MATCH
  // -------------------------------------------------------------
  if (jobMatch) {
    drawSectionHeader(
      '5. Targeted Job Match Analysis',
      `Match Score: ${jobMatch.matchScore}/100 (${jobMatch.matchGrade})`
    );

    ensureSpace(16);
    doc.setFillColor(245, 247, 255);
    doc.roundedRect(margin, y, contentWidth, 14, 1.5, 1.5, 'F');
    doc.setDrawColor(218, 225, 247);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, y, contentWidth, 14, 1.5, 1.5, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...COLOR_DEEP_NAVY);
    doc.text('Target Role Alignment & Match Verdict', margin + 3, y + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...COLOR_DARK_NAVY);
    const jmLines = doc.splitTextToSize(jobMatch.matchSummary, contentWidth - 6);
    doc.text(jmLines[0] || '', margin + 3, y + 9);
    if (jmLines[1]) {
      doc.text(jmLines[1], margin + 3, y + 12.5);
    }
    y += 17;

    // Matched skills vs Missing skills
    ensureSpace(18);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...COLOR_EMERALD);
    doc.text(`✓ Verified Matching Skills (${jobMatch.matchingSkills.length}):`, margin, y + 3);
    y += 5;

    const matchedList = jobMatch.matchingSkills.map((m) => m.skill).join('  •  ');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...COLOR_DARK_NAVY);
    const mLines = doc.splitTextToSize(matchedList, contentWidth);
    mLines.forEach((l: string) => {
      ensureSpace(4);
      doc.text(l, margin, y + 2);
      y += 4;
    });
    y += 3;

    if (jobMatch.missingSkills && jobMatch.missingSkills.length > 0) {
      ensureSpace(18);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(...COLOR_ROSE);
      doc.text(`▲ Missing Job Requirements (${jobMatch.missingSkills.length}):`, margin, y + 3);
      y += 5;

      const missingList = jobMatch.missingSkills.map((m) => `${m.skill} (${m.importance})`).join('  •  ');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...COLOR_DARK_NAVY);
      const missLines = doc.splitTextToSize(missingList, contentWidth);
      missLines.forEach((l: string) => {
        ensureSpace(4);
        doc.text(l, margin, y + 2);
        y += 4;
      });
      y += 3;
    }
  } else {
    // Guidelines when specific job match has not yet been run
    drawSectionHeader('5. Job Match & Role Alignment Strategy');
    drawParagraph(
      'Target Job Match is active in the application. To benchmark this resume against a specific target job opening, open the "Job Match" tab to compare requirements, analyze skill alignment, and identify job-specific missing keywords.',
      8.5,
      COLOR_DARK_NAVY
    );
  }
  y += 4;

  // -------------------------------------------------------------
  // 7. SKILL GAPS
  // -------------------------------------------------------------
  drawSectionHeader('6. Skill Gaps & Capability Deficiencies');

  if (jobMatch && jobMatch.importantGaps && jobMatch.importantGaps.length > 0) {
    jobMatch.importantGaps.forEach((gap, idx) => {
      const descLines = doc.splitTextToSize(gap.gapDescription, contentWidth - 8);
      const mitLines = doc.splitTextToSize(`Action to Bridge: ${gap.mitigation}`, contentWidth - 8);
      const totalH = descLines.length * 3.8 + mitLines.length * 3.8 + 10;
      ensureSpace(totalH);

      doc.setFillColor(255, 255, 255);
      doc.roundedRect(margin, y, contentWidth, totalH, 1.5, 1.5, 'F');
      doc.setDrawColor(...COLOR_SLATE_BORDER);
      doc.setLineWidth(0.3);
      doc.roundedRect(margin, y, contentWidth, totalH, 1.5, 1.5, 'S');

      // Tag
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      const gapColor = gap.severity === 'critical' ? COLOR_ROSE : COLOR_AMBER;
      doc.setTextColor(gapColor[0], gapColor[1], gapColor[2]);
      doc.text(`[${gap.severity.toUpperCase()}] ${gap.area}`, margin + 3, y + 4.5);

      let curY = y + 8.5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...COLOR_DARK_NAVY);
      descLines.forEach((l: string) => {
        doc.text(l, margin + 3, curY);
        curY += 3.8;
      });

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(...COLOR_BLUE);
      mitLines.forEach((l: string) => {
        doc.text(l, margin + 3, curY);
        curY += 3.8;
      });

      y += totalH + 2.5;
    });
  } else {
    // Show priority improvement items and missing section audits
    const prioFixes = analysis.improvements.slice(0, 4);
    prioFixes.forEach((fix, idx) => {
      const suggLines = doc.splitTextToSize(fix.suggestion, contentWidth - 8);
      const ratLines = doc.splitTextToSize(`Recruiter Rationale: ${fix.rationale}`, contentWidth - 8);
      const totalH = suggLines.length * 3.8 + ratLines.length * 3.8 + 10;
      ensureSpace(totalH);

      doc.setFillColor(255, 255, 255);
      doc.roundedRect(margin, y, contentWidth, totalH, 1.5, 1.5, 'F');
      doc.setDrawColor(...COLOR_SLATE_BORDER);
      doc.setLineWidth(0.3);
      doc.roundedRect(margin, y, contentWidth, totalH, 1.5, 1.5, 'S');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      const fixColor = fix.priority === 'high' ? COLOR_ROSE : COLOR_BLUE;
      doc.setTextColor(fixColor[0], fixColor[1], fixColor[2]);
      doc.text(`[${fix.priority.toUpperCase()} PRIORITY] ${fix.area}`, margin + 3, y + 4.5);

      let curY = y + 8.5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...COLOR_DARK_NAVY);
      suggLines.forEach((l: string) => {
        doc.text(l, margin + 3, curY);
        curY += 3.8;
      });

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(...COLOR_SLATE_TEXT);
      ratLines.forEach((l: string) => {
        doc.text(l, margin + 3, curY);
        curY += 3.8;
      });

      y += totalH + 2.5;
    });
  }
  y += 4;

  // -------------------------------------------------------------
  // 8. AI IMPROVEMENTS (ORIGINAL → IMPROVED)
  // -------------------------------------------------------------
  drawSectionHeader(
    '7. AI Resume Improvements (Original → Enhanced)',
    improvements ? 'Tailored Copy' : 'Audit Recommendations'
  );

  if (improvements) {
    // 1. Professional Summary (Original vs Improved)
    if (improvements.professionalSummary) {
      ensureSpace(28);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(...COLOR_DEEP_NAVY);
      doc.text('Professional Summary Enhancement:', margin, y + 3);
      y += 5.5;

      const origLines = doc.splitTextToSize(
        `Original: "${improvements.professionalSummary.original}"`,
        contentWidth - 6
      );
      const impLines = doc.splitTextToSize(
        `Improved: "${improvements.professionalSummary.improved}"`,
        contentWidth - 6
      );
      const blockH = origLines.length * 3.8 + impLines.length * 3.8 + 12;
      ensureSpace(blockH);

      doc.setFillColor(...COLOR_SLATE_BG);
      doc.roundedRect(margin, y, contentWidth, blockH, 1.5, 1.5, 'F');
      doc.setDrawColor(...COLOR_SLATE_BORDER);
      doc.setLineWidth(0.3);
      doc.roundedRect(margin, y, contentWidth, blockH, 1.5, 1.5, 'S');

      let curY = y + 4.5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...COLOR_SLATE_TEXT);
      origLines.forEach((l: string) => {
        doc.text(l, margin + 3, curY);
        curY += 3.8;
      });

      curY += 2;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(...COLOR_DEEP_NAVY);
      impLines.forEach((l: string) => {
        doc.text(l, margin + 3, curY);
        curY += 3.8;
      });

      y += blockH + 3;
    }

    // 2. Experience Bullets with Action Verbs & Metrics
    if (improvements.experienceBulletPoints && improvements.experienceBulletPoints.length > 0) {
      ensureSpace(16);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(...COLOR_DEEP_NAVY);
      doc.text('High-Impact Experience Bullet Enhancements:', margin, y + 3);
      y += 5.5;

      improvements.experienceBulletPoints.slice(0, 4).forEach((bullet, bIdx) => {
        const origLines = doc.splitTextToSize(`Original: ${bullet.originalBullet}`, contentWidth - 6);
        const impLines = doc.splitTextToSize(`Improved: ${bullet.improvedBullet}`, contentWidth - 6);
        const tipLines = doc.splitTextToSize(
          `Measurability Tip: ${bullet.measurabilityTip} (Verb: ${bullet.actionVerbUsed})`,
          contentWidth - 6
        );
        const cardH = origLines.length * 3.8 + impLines.length * 3.8 + tipLines.length * 3.8 + 12;
        ensureSpace(cardH);

        doc.setFillColor(255, 255, 255);
        doc.roundedRect(margin, y, contentWidth, cardH, 1.5, 1.5, 'F');
        doc.setDrawColor(...COLOR_SLATE_BORDER);
        doc.setLineWidth(0.3);
        doc.roundedRect(margin, y, contentWidth, cardH, 1.5, 1.5, 'S');

        // Role badge
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(...COLOR_BLUE);
        doc.text(`${bIdx + 1}. ${bullet.roleOrCompany}`, margin + 3, y + 4.5);

        let curY = y + 8.5;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(...COLOR_SLATE_TEXT);
        origLines.forEach((l: string) => {
          doc.text(l, margin + 3, curY);
          curY += 3.6;
        });

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(...COLOR_DEEP_NAVY);
        impLines.forEach((l: string) => {
          doc.text(l, margin + 3, curY);
          curY += 3.8;
        });

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(...COLOR_EMERALD);
        tipLines.forEach((l: string) => {
          doc.text(l, margin + 3, curY);
          curY += 3.5;
        });

        y += cardH + 2.5;
      });
    }

    // 3. Action Verb Upgrades
    if (improvements.actionVerbUpgrades && improvements.actionVerbUpgrades.length > 0) {
      ensureSpace(16);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(...COLOR_DEEP_NAVY);
      doc.text('Key Action Verb Upgrades:', margin, y + 3);
      y += 5.5;

      const verbsList = improvements.actionVerbUpgrades
        .slice(0, 8)
        .map((v) => `"${v.originalVerbOrPhrase}" → ${v.recommendedVerb.toUpperCase()}`)
        .join('   •   ');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...COLOR_DARK_NAVY);
      const vLines = doc.splitTextToSize(verbsList, contentWidth);
      vLines.forEach((l: string) => {
        ensureSpace(4);
        doc.text(l, margin, y + 2);
        y += 4;
      });
      y += 3;
    }
  } else {
    // Show top prioritized fixes and measurability guidance from analysis
    drawParagraph(
      'AI Resume Improvements can generate live bullet rewrites and summary enhancements. Based on the initial audit, here are the top strategic improvements to make achievements measurable:',
      8.5,
      COLOR_DARK_NAVY
    );
    y += 1;

    analysis.improvements.forEach((imp, iIdx) => {
      const textLines = doc.splitTextToSize(`${iIdx + 1}. [${imp.area}] ${imp.suggestion}`, contentWidth - 4);
      ensureSpace(textLines.length * 3.8 + 3);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...COLOR_DARK_NAVY);
      textLines.forEach((l: string) => {
        doc.text(l, margin + 2, y + 2);
        y += 3.8;
      });
      y += 1.5;
    });
  }

  // -------------------------------------------------------------
  // 9. FOOTERS ON ALL PAGES
  // -------------------------------------------------------------
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Bottom divider line
    doc.setDrawColor(...COLOR_SLATE_BORDER);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

    // Left notice
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...COLOR_SLATE_TEXT);
    doc.text('AI Resume Analyzer  ·  Strictly Local Client-Side PDF Generation  ·  Confidential', margin, pageHeight - 7.5);

    // Right page number
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...COLOR_DARK_NAVY);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 7.5, { align: 'right' });
  }

  return doc;
}

/**
 * Convenience helper to generate and trigger instant browser download of the PDF file
 */
export function downloadResumeAnalysisPdf(options: GeneratePdfOptions): void {
  const doc = generateResumeAnalysisPdf(options);
  const cleanName = (options.fileName || 'Resume')
    .replace(/\.[^/.]+$/, '')
    .replace(/[^a-zA-Z0-9_-]/g, '_');
  const finalFilename = `${cleanName}_AI_Analysis_Report.pdf`;
  doc.save(finalFilename);
}
