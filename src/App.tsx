/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback } from 'react';
import { Header } from './components/Header.tsx';
import { Hero } from './components/Hero.tsx';
import { UploadCard } from './components/UploadCard.tsx';
import { ResumeInfoCard } from './components/ResumeInfoCard.tsx';
import { ResumePreviewCard } from './components/ResumePreviewCard.tsx';
import { ResumeAnalysisDashboard } from './components/ResumeAnalysisDashboard.tsx';
import { AtsAnalysisSection } from './components/AtsAnalysisSection.tsx';
import { JobMatchSection } from './components/JobMatchSection.tsx';
import { ResumeImprovementsSection } from './components/ResumeImprovementsSection.tsx';
import { AnalysisLoadingCard } from './components/AnalysisLoadingCard.tsx';
import { AnalysisErrorCard } from './components/AnalysisErrorCard.tsx';
import {
  validateResumeFile,
  UploadError,
} from './services/resumeUpload.ts';
import {
  parseResume,
  ParseMetrics,
  calculateTextMetrics,
} from './services/resumeParser.ts';
import {
  analyzeResumeWithGemini,
  ResumeAnalysisResult,
  AnalysisError,
} from './services/resumeAnalyzer.ts';
import { SampleResume } from './data/sampleResumes.ts';
import { PrintableReport } from './components/PrintableReport.tsx';
import { ConfirmResetModal } from './components/ConfirmResetModal.tsx';
import { JobMatchResult } from './services/jobMatcher.ts';
import { ResumeImprovementsResult } from './services/resumeImprover.ts';
import { downloadResumeAnalysisPdf } from './services/pdfGenerator.ts';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  FileText,
  BarChart3,
  FileCheck,
  Target,
  Compass,
  Printer,
  Download,
  RotateCcw,
} from 'lucide-react';

type AppState =
  | 'empty'
  | 'uploading'
  | 'processing'
  | 'extracted'
  | 'analyzing'
  | 'analyzed'
  | 'analysis_error';

interface AnalysisErrorInfo {
  message: string;
  isRateLimit?: boolean;
  retryAfterSeconds?: number;
}

export default function App() {
  const [appState, setAppState] = useState<AppState>('empty');
  const [fileName, setFileName] = useState<string>('');
  const [fileSize, setFileSize] = useState<number>(0);
  const [fileType, setFileType] = useState<'pdf' | 'docx'>('pdf');
  const [extractedText, setExtractedText] = useState<string>('');
  const [metrics, setMetrics] = useState<ParseMetrics>({
    wordCount: 0,
    charCount: 0,
    lineCount: 0,
    paragraphCount: 0,
    estimatedReadingTimeMinutes: 0,
  });
  const [warnings, setWarnings] = useState<string[]>([]);
  const [uploadError, setUploadError] = useState<UploadError | null>(null);

  // Gemini Analysis Results & State
  const [analysisResult, setAnalysisResult] = useState<ResumeAnalysisResult | null>(null);
  const [jobMatchResult, setJobMatchResult] = useState<JobMatchResult | null>(null);
  const [improvementsResult, setImprovementsResult] = useState<ResumeImprovementsResult | null>(null);
  const [analysisError, setAnalysisError] = useState<AnalysisErrorInfo | null>(null);
  const [activeViewTab, setActiveViewTab] = useState<
    'analysis' | 'ats' | 'jobMatch' | 'skillGap' | 'improvements' | 'rawText'
  >('analysis');

  // Print Mode & Accidental Loss Prevention Modals
  const [isPrintReportMode, setIsPrintReportMode] = useState<boolean>(false);
  const [showResetConfirmModal, setShowResetConfirmModal] = useState<boolean>(false);
  const [pendingFileToReplace, setPendingFileToReplace] = useState<File | null>(null);

  // Direct reset of state
  const handleReset = useCallback(() => {
    setAppState('empty');
    setFileName('');
    setFileSize(0);
    setFileType('pdf');
    setExtractedText('');
    setWarnings([]);
    setUploadError(null);
    setAnalysisResult(null);
    setJobMatchResult(null);
    setImprovementsResult(null);
    setAnalysisError(null);
    setActiveViewTab('analysis');
    setIsPrintReportMode(false);
    setShowResetConfirmModal(false);
    setPendingFileToReplace(null);
  }, []);

  // Download Analysis as PDF locally (clean, complete, navy/blue/cream styled)
  const handleDownloadPdf = useCallback(() => {
    if (!analysisResult) return;
    downloadResumeAnalysisPdf({
      fileName,
      analysis: analysisResult,
      jobMatch: jobMatchResult,
      improvements: improvementsResult,
    });
  }, [fileName, analysisResult, jobMatchResult, improvementsResult]);

  // Guarded reset to prevent accidental data loss
  const handleRequestReset = useCallback(() => {
    if (analysisResult || extractedText) {
      setShowResetConfirmModal(true);
    } else {
      handleReset();
    }
  }, [analysisResult, extractedText, handleReset]);

  // Handle confirmed reset (with optional pending replace)
  const handleConfirmReset = useCallback(() => {
    setShowResetConfirmModal(false);
    if (pendingFileToReplace) {
      const file = pendingFileToReplace;
      setPendingFileToReplace(null);
      processUploadedFile(file);
    } else {
      handleReset();
    }
  }, [pendingFileToReplace, handleReset]);

  // Handle incoming file selection (drag & drop or file dialog)
  const processUploadedFile = useCallback(async (file: File) => {
    setUploadError(null);
    setAnalysisResult(null);
    setAnalysisError(null);

    // 1. Validate file constraints
    const validation = validateResumeFile(file);
    if (!validation.valid) {
      setUploadError(validation.error);
      return;
    }

    setFileName(validation.fileName);
    setFileSize(validation.fileSize);
    setFileType(validation.fileType);

    // 2. Simulated upload stage
    setAppState('uploading');
    await new Promise((r) => setTimeout(r, 180));

    // 3. Processing / Text extraction stage
    setAppState('processing');

    try {
      const parseResult = await parseResume(file);

      if (!parseResult.success) {
        setUploadError({
          code: 'UNSUPPORTED_TYPE',
          title: 'Extraction Failed',
          message: parseResult.error || 'Failed to extract text from the file.',
          details: parseResult.errorDetails,
        });
        setAppState('empty');
        return;
      }

      setExtractedText(parseResult.text);
      setMetrics(parseResult.metrics);
      setWarnings(parseResult.warnings);
      setAppState('extracted');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setUploadError({
        code: 'INVALID_FILE',
        title: 'Parsing Error',
        message: 'An unexpected error occurred while parsing the resume.',
        details: msg,
      });
      setAppState('empty');
    }
  }, []);

  // Handle sample resume selection
  const handleSampleSelect = useCallback(async (sample: SampleResume) => {
    setUploadError(null);
    setAnalysisResult(null);
    setAnalysisError(null);
    setFileName(sample.fileName);
    setFileType(sample.fileType);
    setFileSize(sample.rawText.length * 1.8);

    setAppState('uploading');
    await new Promise((r) => setTimeout(r, 150));

    setAppState('processing');
    await new Promise((r) => setTimeout(r, 180));

    const sampleMetrics = calculateTextMetrics(sample.rawText);
    setExtractedText(sample.rawText);
    setMetrics(sampleMetrics);
    setWarnings([]);
    setAppState('extracted');
  }, []);

  // Simulate specific error states for testing
  const handleSimulateError = useCallback(
    (type: 'invalid' | 'large' | 'empty' | 'corrupt') => {
      if (type === 'invalid') {
        const mockFile = new File(['image content'], 'portfolio_photo.jpg', {
          type: 'image/jpeg',
        });
        processUploadedFile(mockFile);
      } else if (type === 'large') {
        const largeFile = new File([new ArrayBuffer(1024)], 'giant_resume.pdf', {
          type: 'application/pdf',
        });
        Object.defineProperty(largeFile, 'size', { value: 14 * 1024 * 1024 });
        processUploadedFile(largeFile);
      } else if (type === 'empty') {
        const emptyFile = new File([], 'empty_resume.docx', {
          type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        });
        processUploadedFile(emptyFile);
      } else if (type === 'corrupt') {
        const corruptFile = new File(['not a real pdf binary stream'], 'corrupted_sample.pdf', {
          type: 'application/pdf',
        });
        processUploadedFile(corruptFile);
      }
    },
    [processUploadedFile]
  );

  // Trigger Gemini AI Resume Analysis
  const handleAnalyzeResume = useCallback(async () => {
    if (!extractedText) return;

    setAppState('analyzing');
    setAnalysisError(null);

    try {
      const result = await analyzeResumeWithGemini(extractedText, fileName);
      setAnalysisResult(result);
      setActiveViewTab('analysis');
      setAppState('analyzed');
    } catch (err: unknown) {
      if (err instanceof AnalysisError) {
        setAnalysisError({
          message: err.message,
          isRateLimit: err.isRateLimit,
          retryAfterSeconds: err.retryAfterSeconds,
        });
      } else {
        const msg = err instanceof Error ? err.message : String(err);
        const isRate =
          msg.toLowerCase().includes('quota') ||
          msg.toLowerCase().includes('resource_exhausted') ||
          msg.includes('429');
        setAnalysisError({
          message: msg,
          isRateLimit: isRate,
          retryAfterSeconds: isRate ? 25 : undefined,
        });
      }
      setAppState('analysis_error');
    }
  }, [extractedText, fileName]);

  const hasLoadedResume =
    appState === 'extracted' ||
    appState === 'analyzing' ||
    appState === 'analyzed' ||
    appState === 'analysis_error';

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] text-[#0D1B3D] selection:bg-[#FFF3D0] selection:text-[#010736]">
      {/* Compact Top Bar */}
      <Header onReset={handleRequestReset} hasFile={hasLoadedResume} />

      {/* Confirmation Modal to Prevent Accidental Loss */}
      <ConfirmResetModal
        isOpen={showResetConfirmModal}
        onCancel={() => {
          setShowResetConfirmModal(false);
          setPendingFileToReplace(null);
        }}
        onConfirm={handleConfirmReset}
        onDownloadPdf={analysisResult ? handleDownloadPdf : undefined}
      />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* Printable Report View (When triggered) */}
        {isPrintReportMode && analysisResult ? (
          <PrintableReport
            fileName={fileName}
            analysis={analysisResult}
            jobMatch={jobMatchResult}
            improvements={improvementsResult}
            onClose={() => setIsPrintReportMode(false)}
          />
        ) : (
          <>
            {/* Balanced Hero Section */}
            {!hasLoadedResume && <Hero />}

            {/* Content View */}
            <div className={hasLoadedResume ? 'mt-2' : 'mt-6'}>
              {appState === 'empty' || appState === 'uploading' || appState === 'processing' ? (
                /* Upload View */
                <UploadCard
                  onFileSelect={processUploadedFile}
                  onSampleSelect={handleSampleSelect}
                  isUploading={appState === 'uploading'}
                  isProcessing={appState === 'processing'}
                  error={uploadError}
                  onClearError={() => setUploadError(null)}
                  onSimulateError={handleSimulateError}
                />
              ) : (
                /* Document Loaded View */
                <div className="space-y-6">
                  {/* Resume Information Card */}
                  <ResumeInfoCard
                    fileName={fileName}
                    fileSize={fileSize}
                    fileType={fileType}
                    warnings={warnings}
                    onRemove={handleRequestReset}
                    onReplaceFile={(file) => {
                      if (analysisResult) {
                        setPendingFileToReplace(file);
                        setShowResetConfirmModal(true);
                      } else {
                        processUploadedFile(file);
                      }
                    }}
                  />

                  {/* View Selector Tabs & Actions */}
                  {(appState === 'analyzed' || (appState === 'extracted' && extractedText)) && (
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white p-2.5 sm:p-3 rounded-2xl border border-slate-200/90 shadow-navy-xs">
                      {/* Clean 5-Tab Navigation Strip */}
                      <nav
                        aria-label="Resume Analysis Sections"
                        className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-xl max-w-full overflow-x-auto border border-slate-200/60 scrollbar-none py-1 px-1 touch-pan-x"
                      >
                        {/* 1. Resume Analysis */}
                        <button
                          type="button"
                          onClick={() => setActiveViewTab('analysis')}
                          className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm rounded-lg transition-all cursor-pointer shrink-0 whitespace-nowrap min-h-[42px] ${
                            activeViewTab === 'analysis'
                              ? 'bg-[#010736] text-white shadow-navy-xs ring-1 ring-[#010736]/30 font-bold'
                              : 'text-slate-700 hover:text-[#010736] hover:bg-white/80 font-semibold'
                          }`}
                        >
                          <BarChart3 className={`w-4 h-4 ${activeViewTab === 'analysis' ? 'text-[#FFF3D0]' : 'text-[#29437A]'}`} />
                          <span>Resume Analysis</span>
                          {analysisResult && (
                            <span
                              className={`font-mono text-[11px] px-2 py-0.5 rounded font-bold ${
                                activeViewTab === 'analysis'
                                  ? 'bg-[#FFF3D0] text-[#010736]'
                                  : 'bg-white text-slate-700 border border-slate-200'
                              }`}
                            >
                              {analysisResult.overallScore}/100
                            </span>
                          )}
                        </button>

                        {/* 2. ATS Analysis */}
                        <button
                          type="button"
                          onClick={() => setActiveViewTab('ats')}
                          className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm rounded-lg transition-all cursor-pointer shrink-0 whitespace-nowrap min-h-[42px] ${
                            activeViewTab === 'ats'
                              ? 'bg-[#010736] text-white shadow-navy-xs ring-1 ring-[#010736]/30 font-bold'
                              : 'text-slate-700 hover:text-[#010736] hover:bg-white/80 font-semibold'
                          }`}
                        >
                          <FileCheck className={`w-4 h-4 ${activeViewTab === 'ats' ? 'text-[#FFF3D0]' : 'text-[#29437A]'}`} />
                          <span>ATS Analysis</span>
                          {analysisResult?.atsAnalysis && (
                            <span
                              className={`font-mono text-[11px] px-2 py-0.5 rounded font-bold ${
                                activeViewTab === 'ats'
                                  ? 'bg-[#FFF3D0] text-[#010736]'
                                  : 'bg-white text-slate-700 border border-slate-200'
                              }`}
                            >
                              {analysisResult.atsAnalysis.atsScore}/100
                            </span>
                          )}
                        </button>

                        {/* 3. Job Match */}
                        <button
                          type="button"
                          onClick={() => setActiveViewTab('jobMatch')}
                          className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm rounded-lg transition-all cursor-pointer shrink-0 whitespace-nowrap min-h-[42px] ${
                            activeViewTab === 'jobMatch'
                              ? 'bg-[#010736] text-white shadow-navy-xs ring-1 ring-[#010736]/30 font-bold'
                              : 'text-slate-700 hover:text-[#010736] hover:bg-white/80 font-semibold'
                          }`}
                        >
                          <Target className={`w-4 h-4 ${activeViewTab === 'jobMatch' ? 'text-[#FFF3D0]' : 'text-[#29437A]'}`} />
                          <span>Job Match</span>
                          {jobMatchResult && (
                            <span
                              className={`font-mono text-[11px] px-2 py-0.5 rounded font-bold ${
                                activeViewTab === 'jobMatch'
                                  ? 'bg-[#FFF3D0] text-[#010736]'
                                  : 'bg-white text-slate-700 border border-slate-200'
                              }`}
                            >
                              {jobMatchResult.matchScore}/100
                            </span>
                          )}
                        </button>

                        {/* 4. Skill Gaps */}
                        <button
                          type="button"
                          onClick={() => setActiveViewTab('skillGap')}
                          className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm rounded-lg transition-all cursor-pointer shrink-0 whitespace-nowrap min-h-[42px] ${
                            activeViewTab === 'skillGap'
                              ? 'bg-[#010736] text-white shadow-navy-xs ring-1 ring-[#010736]/30 font-bold'
                              : 'text-slate-700 hover:text-[#010736] hover:bg-white/80 font-semibold'
                          }`}
                        >
                          <Compass className={`w-4 h-4 ${activeViewTab === 'skillGap' ? 'text-[#FFF3D0]' : 'text-[#29437A]'}`} />
                          <span>Skill Gaps</span>
                          {jobMatchResult?.importantGaps && jobMatchResult.importantGaps.length > 0 ? (
                            <span
                              className={`font-mono text-[11px] px-2 py-0.5 rounded font-bold ${
                                activeViewTab === 'skillGap'
                                  ? 'bg-[#FFF3D0] text-[#010736]'
                                  : 'bg-white text-amber-700 border border-amber-200'
                              }`}
                            >
                              {jobMatchResult.importantGaps.length} gaps
                            </span>
                          ) : null}
                        </button>

                        {/* 5. AI Improvements */}
                        <button
                          type="button"
                          onClick={() => setActiveViewTab('improvements')}
                          className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm rounded-lg transition-all cursor-pointer shrink-0 whitespace-nowrap min-h-[42px] ${
                            activeViewTab === 'improvements'
                              ? 'bg-[#010736] text-white shadow-navy-xs ring-1 ring-[#010736]/30 font-bold'
                              : 'text-slate-700 hover:text-[#010736] hover:bg-white/80 font-semibold'
                          }`}
                        >
                          <Sparkles className={`w-4 h-4 ${activeViewTab === 'improvements' ? 'text-[#FFF3D0]' : 'text-[#29437A]'}`} />
                          <span>AI Improvements</span>
                          {improvementsResult && (
                            <span
                              className={`font-mono text-[11px] px-2 py-0.5 rounded font-bold ${
                                activeViewTab === 'improvements'
                                  ? 'bg-[#FFF3D0] text-[#010736]'
                                  : 'bg-white text-emerald-700 border border-emerald-200'
                              }`}
                            >
                              Ready
                            </span>
                          )}
                        </button>

                        {/* 6. Extracted Text */}
                        <button
                          type="button"
                          onClick={() => setActiveViewTab('rawText')}
                          className={`inline-flex items-center gap-2 px-3 py-2 text-xs sm:text-sm rounded-lg transition-all cursor-pointer shrink-0 whitespace-nowrap min-h-[42px] ${
                            activeViewTab === 'rawText'
                              ? 'bg-[#010736] text-white shadow-navy-xs ring-1 ring-[#010736]/30 font-bold'
                              : 'text-slate-600 hover:text-[#010736] hover:bg-white/80 font-medium'
                          }`}
                          title="View raw extracted text and document statistics"
                        >
                          <FileText className={`w-4 h-4 ${activeViewTab === 'rawText' ? 'text-[#FFF3D0]' : 'text-slate-500'}`} />
                          <span className="hidden sm:inline">Extracted Text</span>
                        </button>
                      </nav>

                      {/* Header Actions: Back, Start New Analysis, Download PDF */}
                      <div className="flex items-center gap-2 flex-wrap shrink-0 justify-end">
                        {activeViewTab !== 'analysis' && (
                          <button
                            type="button"
                            onClick={() => setActiveViewTab('analysis')}
                            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl text-[#010736] bg-slate-100 hover:bg-slate-200 transition-all cursor-pointer min-h-[40px]"
                            title="Return to Resume Analysis dashboard"
                          >
                            <ArrowLeft className="w-4 h-4 text-[#29437A]" />
                            <span>Back to Overview</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={handleRequestReset}
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold rounded-xl text-slate-700 hover:text-[#010736] bg-white hover:bg-slate-50 border border-slate-200 transition-all cursor-pointer min-h-[40px]"
                          title="Start a fresh analysis"
                        >
                          <RotateCcw className="w-4 h-4 text-slate-500" />
                          <span className="hidden sm:inline">Start New Analysis</span>
                        </button>

                        {/* Download PDF Quick Action in Header */}
                        {appState === 'analyzed' && analysisResult && (
                          <button
                            type="button"
                            onClick={handleDownloadPdf}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold rounded-xl bg-[#FFF3D0] text-[#010736] hover:bg-[#ffeab3] border border-[#29437A]/30 transition-all cursor-pointer shadow-navy-xs min-h-[40px]"
                            title="Download complete analysis report as PDF"
                          >
                            <Download className="w-4 h-4 text-[#010736]" />
                            <span>Download PDF</span>
                          </button>
                        )}

                        {appState === 'analyzed' && (
                          <button
                            type="button"
                            onClick={() => setIsPrintReportMode(true)}
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium rounded-xl bg-white text-[#010736] hover:bg-slate-50 border border-slate-200 transition-all cursor-pointer shadow-2xs min-h-[40px]"
                            title="Preview full report and print"
                          >
                            <Printer className="w-4 h-4 text-[#29437A]" />
                            <span className="hidden sm:inline">Print Report</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Main Content Render based on state */}
                  {appState === 'analyzing' ? (
                    <AnalysisLoadingCard fileName={fileName} />
                  ) : appState === 'analysis_error' ? (
                    <AnalysisErrorCard
                      error={analysisError?.message || 'An error occurred during analysis.'}
                      isRateLimit={analysisError?.isRateLimit}
                      retryAfterSeconds={analysisError?.retryAfterSeconds}
                      onRetry={handleAnalyzeResume}
                      onBackToPreview={() => setAppState('extracted')}
                    />
                  ) : activeViewTab === 'improvements' ? (
                    <ResumeImprovementsSection
                      resumeText={extractedText}
                      fileName={fileName}
                      onDownloadPdf={handleDownloadPdf}
                      existingImprovements={improvementsResult}
                      onImprovementsChange={setImprovementsResult}
                      onViewGeneralDashboard={() => {
                        if (analysisResult) {
                          setActiveViewTab('analysis');
                        } else {
                          handleAnalyzeResume();
                        }
                      }}
                      onStartNewAnalysis={handleRequestReset}
                    />
                  ) : activeViewTab === 'jobMatch' || activeViewTab === 'skillGap' ? (
                    <JobMatchSection
                      resumeText={extractedText}
                      fileName={fileName}
                      initialTab={activeViewTab === 'skillGap' ? 'skillGap' : 'match'}
                      onDownloadPdf={handleDownloadPdf}
                      existingMatchResult={jobMatchResult}
                      onMatchResultChange={setJobMatchResult}
                      onViewGeneralDashboard={() => {
                        if (analysisResult) {
                          setActiveViewTab('analysis');
                        } else {
                          handleAnalyzeResume();
                        }
                      }}
                      onTabChange={(tab) => setActiveViewTab(tab === 'skillGap' ? 'skillGap' : 'jobMatch')}
                      onStartNewAnalysis={handleRequestReset}
                    />
                  ) : activeViewTab === 'ats' ? (
                    analysisResult?.atsAnalysis ? (
                      <AtsAnalysisSection
                        atsData={analysisResult.atsAnalysis}
                        fileName={fileName}
                        onReanalyze={handleAnalyzeResume}
                        onViewGeneralDashboard={() => setActiveViewTab('analysis')}
                        onDownloadPdf={handleDownloadPdf}
                        onStartNewAnalysis={handleRequestReset}
                      />
                    ) : (
                      <div className="bg-white rounded-3xl border border-slate-200/90 p-8 sm:p-10 shadow-navy-xs text-center max-w-xl mx-auto space-y-4">
                        <div className="w-14 h-14 rounded-2xl bg-[#010736] text-[#FFF3D0] flex items-center justify-center mx-auto shadow-navy-xs">
                          <FileCheck className="w-7 h-7 text-[#FFF3D0]" />
                        </div>
                        <h3 className="text-lg sm:text-xl font-bold text-[#010736]">
                          Run Full Analysis for ATS Compatibility
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                          Run the AI evaluation to calculate machine parser compatibility, keyword density, and formatting compliance for {fileName}.
                        </p>
                        <div className="flex items-center justify-center gap-3 pt-2">
                          <button
                            type="button"
                            onClick={() => setActiveViewTab('analysis')}
                            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold text-[#010736] bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer min-h-[44px]"
                          >
                            <ArrowLeft className="w-4 h-4 text-[#29437A]" />
                            <span>Back to Overview</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleAnalyzeResume}
                            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-[#010736] hover:bg-[#0D1B3D] rounded-xl transition-all shadow-navy-xs cursor-pointer min-h-[44px]"
                          >
                            <Sparkles className="w-4 h-4 text-[#FFF3D0]" />
                            <span>Analyze Resume Now</span>
                            <ArrowRight className="w-4 h-4 text-white/70" />
                          </button>
                        </div>
                      </div>
                    )
                  ) : activeViewTab === 'rawText' ? (
                    <div className="space-y-5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-navy-xs">
                        <div className="flex items-center gap-2.5">
                          <button
                            type="button"
                            onClick={() => setActiveViewTab('analysis')}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold text-[#010736] bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer min-h-[36px]"
                          >
                            <ArrowLeft className="w-4 h-4 text-[#29437A]" />
                            <span>Back to Resume Analysis</span>
                          </button>
                          <span className="text-xs text-slate-500 font-mono">Raw Parsed Text &amp; Metrics</span>
                        </div>
                        {appState !== 'analyzed' && (
                          <button
                            type="button"
                            onClick={handleAnalyzeResume}
                            className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-[#010736] hover:bg-[#0D1B3D] rounded-xl transition-all shadow-navy-xs cursor-pointer min-h-[36px]"
                          >
                            <Sparkles className="w-4 h-4 text-[#FFF3D0]" />
                            <span>Analyze Resume</span>
                          </button>
                        )}
                      </div>
                      <ResumePreviewCard
                        extractedText={extractedText}
                        metrics={metrics}
                      />
                    </div>
                  ) : appState === 'analyzed' && activeViewTab === 'analysis' && analysisResult ? (
                    <ResumeAnalysisDashboard
                      analysis={analysisResult}
                      fileName={fileName}
                      onReanalyze={handleAnalyzeResume}
                      onViewRawText={() => setActiveViewTab('rawText')}
                      onViewAts={() => setActiveViewTab('ats')}
                      onViewJobMatch={() => setActiveViewTab('jobMatch')}
                      onViewSkillGap={() => setActiveViewTab('skillGap')}
                      onViewImprovements={() => setActiveViewTab('improvements')}
                      onDownloadPdf={handleDownloadPdf}
                      onViewPrintReport={() => setIsPrintReportMode(true)}
                      onStartNewAnalysis={handleRequestReset}
                      jobMatch={jobMatchResult}
                      aiImprovements={improvementsResult}
                    />
                  ) : (
                /* Extracted Text Preview + CTA */
                <div className="space-y-6">
                  <ResumePreviewCard
                    extractedText={extractedText}
                    metrics={metrics}
                  />

                  {/* Primary CTA Area */}
                  <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-5 shadow-navy-xs">
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-[#010736]">
                        Ready to evaluate your resume
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                        Run a full recruiter &amp; ATS audit, or match directly against a job description.
                      </p>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
                      <button
                        type="button"
                        onClick={() => setActiveViewTab('improvements')}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold text-[#010736] bg-white hover:bg-slate-50 border border-slate-200 hover:border-[#29437A] rounded-xl transition-all shadow-navy-xs cursor-pointer whitespace-nowrap min-h-[44px]"
                      >
                        <Sparkles className="w-4 h-4 text-[#29437A]" />
                        <span>AI Improvements</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveViewTab('jobMatch')}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold text-[#010736] bg-white hover:bg-slate-50 border border-slate-200 hover:border-[#29437A] rounded-xl transition-all shadow-navy-xs cursor-pointer whitespace-nowrap min-h-[44px]"
                      >
                        <Target className="w-4 h-4 text-[#29437A]" />
                        <span>Match Job Description</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleAnalyzeResume}
                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-[#010736] hover:bg-[#0D1B3D] rounded-xl transition-all shadow-navy-xs cursor-pointer whitespace-nowrap min-h-[44px]"
                      >
                        <Sparkles className="w-4 h-4 text-[#FFF3D0]" />
                        <span>Analyze Resume</span>
                        <ArrowRight className="w-4 h-4 text-white/70" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </>
    )}
  </main>

      {/* Quiet Footer */}
      <footer className="mt-auto py-6 border-t border-slate-200/90 text-center text-xs sm:text-sm text-slate-500 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="font-bold text-[#010736]">AI Resume Analyzer</span>
          <span className="text-slate-400">Strictly evaluates actual resume content · Fact-grounded AI</span>
        </div>
      </footer>
    </div>
  );
}
