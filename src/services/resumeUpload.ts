/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
export const MAX_FILE_SIZE_LABEL = '10 MB';

export const ALLOWED_EXTENSIONS = ['.pdf', '.docx'] as const;
export type AllowedExtension = (typeof ALLOWED_EXTENSIONS)[number];

export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  // Common fallback mime types for docx in some browsers/OS:
  'application/msword',
  'application/x-zip-compressed', // Some Windows systems send docx as zip
  'application/octet-stream',
] as const;

export type UploadErrorCode =
  | 'NO_FILE'
  | 'FILE_TOO_LARGE'
  | 'UNSUPPORTED_TYPE'
  | 'EMPTY_FILE'
  | 'INVALID_FILE'
  | 'EXTRACTION_FAILED';

export interface UploadError {
  code: UploadErrorCode;
  title: string;
  message: string;
  details?: string;
}

export interface ValidationSuccess {
  valid: true;
  fileType: 'pdf' | 'docx';
  fileName: string;
  fileSize: number;
}

export interface ValidationFailure {
  valid: false;
  error: UploadError;
}

export type ValidationResult = ValidationSuccess | ValidationFailure;

/**
 * Format bytes into human-readable string (KB, MB)
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const formatted = (bytes / Math.pow(k, i)).toFixed(i === 1 ? 1 : 2);
  return `${formatted} ${sizes[i]}`;
}

/**
 * Extract lowercased extension with dot from filename (e.g. '.pdf')
 */
export function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  if (lastDot === -1) return '';
  return filename.slice(lastDot).toLowerCase();
}

/**
 * Determine resume document type from extension and mime type
 */
export function resolveFileType(file: File): 'pdf' | 'docx' | null {
  const ext = getFileExtension(file.name);
  if (ext === '.pdf') return 'pdf';
  if (ext === '.docx') return 'docx';

  if (file.type === 'application/pdf') return 'pdf';
  if (
    file.type ===
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    return 'docx';
  }

  return null;
}

/**
 * Validates the uploaded file against size, format, and empty file constraints
 */
export function validateResumeFile(file: File | null | undefined): ValidationResult {
  if (!file) {
    return {
      valid: false,
      error: {
        code: 'NO_FILE',
        title: 'No file selected',
        message: 'Please choose or drag a resume file to upload.',
      },
    };
  }

  // 1. Check if file is completely empty (0 bytes)
  if (file.size === 0) {
    return {
      valid: false,
      error: {
        code: 'EMPTY_FILE',
        title: 'Empty document',
        message: 'The selected file is empty (0 bytes). Please upload a valid resume.',
      },
    };
  }

  // 2. Check file type / extension
  const detectedType = resolveFileType(file);
  const ext = getFileExtension(file.name);

  if (!detectedType) {
    const displayExt = ext ? `(${ext.toUpperCase()})` : '';
    return {
      valid: false,
      error: {
        code: 'UNSUPPORTED_TYPE',
        title: 'Unsupported file format',
        message: `Only PDF and DOCX files are supported. ${
          displayExt ? `The file type ${displayExt} cannot be processed.` : ''
        }`,
        details: 'Please convert your resume to a standard PDF or DOCX format and try again.',
      },
    };
  }

  // 3. Check file size limit (10 MB)
  if (file.size > MAX_FILE_SIZE_BYTES) {
    const currentSize = formatFileSize(file.size);
    return {
      valid: false,
      error: {
        code: 'FILE_TOO_LARGE',
        title: 'File too large',
        message: `Your file is ${currentSize}, which exceeds the ${MAX_FILE_SIZE_LABEL} limit.`,
        details: 'Please reduce the file size or compress the document before uploading.',
      },
    };
  }

  return {
    valid: true,
    fileType: detectedType,
    fileName: file.name,
    fileSize: file.size,
  };
}
