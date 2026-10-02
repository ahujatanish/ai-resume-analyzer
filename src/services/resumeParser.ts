/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import mammoth from 'mammoth';

// Initialize PDF.js worker using Vite-bundled asset URL
if (typeof window !== 'undefined') {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
  } catch {
    // Fallback if needed
  }
}

export interface ParseMetrics {
  wordCount: number;
  charCount: number;
  lineCount: number;
  paragraphCount: number;
  estimatedReadingTimeMinutes: number;
  pageCount?: number;
}

export interface ParseResult {
  success: boolean;
  text: string;
  metrics: ParseMetrics;
  warnings: string[];
  error?: string;
  errorDetails?: string;
}

/**
 * Calculates readable text metrics (words, chars, lines, reading time)
 */
export function calculateTextMetrics(rawText: string, pageCount?: number): ParseMetrics {
  const trimmed = rawText.trim();
  if (!trimmed) {
    return {
      wordCount: 0,
      charCount: 0,
      lineCount: 0,
      paragraphCount: 0,
      estimatedReadingTimeMinutes: 0,
      pageCount,
    };
  }

  // Count words by splitting whitespace
  const words = trimmed.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const charCount = rawText.length;

  // Count meaningful lines and paragraphs
  const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const paragraphs = rawText.split(/\n\s*\n/).filter(p => p.trim().length > 0);

  // Average reading speed: 200 words per minute
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  return {
    wordCount,
    charCount,
    lineCount: lines.length,
    paragraphCount: paragraphs.length || 1,
    estimatedReadingTimeMinutes: readingTime,
    pageCount,
  };
}

/**
 * Clean and format raw extracted text to be human-readable and ATS-friendly
 */
export function cleanExtractedText(text: string): string {
  if (!text) return '';

  return (
    text
      // Remove null characters and control chars except newlines and tabs
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      // Standardize carriage returns to standard newlines
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      // Collapse excessive blank lines to max 2
      .replace(/\n{3,}/g, '\n\n')
      // Trim overall whitespace
      .trim()
  );
}

/**
 * Extract plain text from PDF file or ArrayBuffer using pdfjs-dist
 */
export async function extractTextFromPdf(input: File | ArrayBuffer): Promise<ParseResult> {
  const warnings: string[] = [];

  try {
    const arrayBuffer = input instanceof File ? await input.arrayBuffer() : input;

    // Load PDF document
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      useWorkerFetch: false,
      useSystemFonts: true,
    });

    const pdfDoc = await loadingTask.promise;
    const numPages = pdfDoc.numPages;

    if (numPages === 0) {
      return {
        success: false,
        text: '',
        metrics: calculateTextMetrics(''),
        warnings,
        error: 'The PDF file has 0 pages or is empty.',
      };
    }

    const pageTexts: string[] = [];

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const textContent = await page.getTextContent();

      // Collect text tokens and respect line breaks based on Y-position changes
      let lastY: number | null = null;
      let pageText = '';

      for (const item of textContent.items) {
        if ('str' in item) {
          const currentY = 'transform' in item ? item.transform[5] : null;

          if (lastY !== null && currentY !== null && Math.abs(currentY - lastY) > 5) {
            pageText += '\n';
          } else if (pageText.length > 0 && !pageText.endsWith(' ') && !pageText.endsWith('\n')) {
            pageText += ' ';
          }

          pageText += item.str;
          lastY = currentY;
        }
      }

      pageTexts.push(pageText.trim());
    }

    const combinedRaw = pageTexts.join('\n\n');
    const cleanedText = cleanExtractedText(combinedRaw);
    const metrics = calculateTextMetrics(cleanedText, numPages);

    // Check if the document has little or no extractable text (e.g. scanned image PDF)
    if (cleanedText.length < 30) {
      if (numPages > 0) {
        warnings.push(
          'Very little machine-readable text was detected. This PDF may be a scanned image or photograph without an OCR text layer.'
        );
      } else {
        return {
          success: false,
          text: '',
          metrics,
          warnings,
          error: 'No readable text could be extracted from this PDF.',
        };
      }
    }

    return {
      success: true,
      text: cleanedText,
      metrics,
      warnings,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    const isEncrypted =
      errorMsg.toLowerCase().includes('password') ||
      errorMsg.toLowerCase().includes('encrypted');

    return {
      success: false,
      text: '',
      metrics: calculateTextMetrics(''),
      warnings,
      error: isEncrypted
        ? 'The PDF document is password-protected or encrypted. Please remove password protection.'
        : 'Failed to read PDF document. The file may be damaged or in an unsupported format.',
      errorDetails: errorMsg,
    };
  }
}

/**
 * Extract plain text from DOCX file or ArrayBuffer using mammoth
 */
export async function extractTextFromDocx(input: File | ArrayBuffer): Promise<ParseResult> {
  const warnings: string[] = [];

  try {
    const arrayBuffer = input instanceof File ? await input.arrayBuffer() : input;

    const result = await mammoth.extractRawText({ arrayBuffer });
    const rawText = result.value || '';
    const cleanedText = cleanExtractedText(rawText);
    const metrics = calculateTextMetrics(cleanedText);

    if (result.messages && result.messages.length > 0) {
      result.messages.forEach(msg => {
        if (msg.type === 'warning') {
          warnings.push(msg.message);
        }
      });
    }

    if (!cleanedText || cleanedText.length === 0) {
      return {
        success: false,
        text: '',
        metrics,
        warnings,
        error: 'The Word document appears to be empty or contains no readable text.',
      };
    }

    return {
      success: true,
      text: cleanedText,
      metrics,
      warnings,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      text: '',
      metrics: calculateTextMetrics(''),
      warnings,
      error: 'Failed to process DOCX file. Please make sure the document is a valid Microsoft Word (.docx) file.',
      errorDetails: errorMsg,
    };
  }
}

/**
 * General parser dispatcher that routes by file extension / type
 */
export async function parseResume(file: File): Promise<ParseResult> {
  const nameLower = file.name.toLowerCase();

  if (nameLower.endsWith('.pdf') || file.type === 'application/pdf') {
    return extractTextFromPdf(file);
  }

  if (
    nameLower.endsWith('.docx') ||
    file.type ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    file.type === 'application/msword'
  ) {
    return extractTextFromDocx(file);
  }

  return {
    success: false,
    text: '',
    metrics: calculateTextMetrics(''),
    warnings: [],
    error: `Unsupported file type for parsing: ${file.name}. Only PDF and DOCX documents are accepted.`,
  };
}
