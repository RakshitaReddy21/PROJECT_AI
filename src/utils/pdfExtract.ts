/**
 * Client-side PDF text extraction using pdfjs-dist.
 *
 * Runs entirely in the browser (no server round-trip needed): pulls real text
 * out of an uploaded .pdf file, per page, so the RAG pipeline has actual
 * source material to index instead of a placeholder string.
 */
import * as pdfjsLib from 'pdfjs-dist';
// Vite-friendly worker import: bundles the worker as its own asset and gives
// us a URL to point pdf.js at, avoiding manual copy steps.
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.js?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

/**
 * Cleans and normalizes raw extracted PDF text.
 * Ported from a proven server-side implementation (Python's PDFService.clean_text):
 * de-hyphenates words split across a line wrap, collapses excess whitespace/blank
 * lines, and strips non-printable control characters.
 */
function cleanExtractedText(text: string): string {
  if (!text) return '';

  let cleaned = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Re-join hyphenated line wraps, e.g. "excep-\ntion" -> "exception"
  cleaned = cleaned.replace(/(\w+)-\n(\w+)/g, '$1$2');

  // Collapse 3+ newlines down to a double newline (paragraph break)
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

  // Collapse runs of spaces/tabs to a single space
  cleaned = cleaned.replace(/[ \t]+/g, ' ');

  // Strip non-printable control characters, keeping newlines/tabs
  cleaned = Array.from(cleaned)
    .filter((ch) => ch === '\n' || ch === '\t' || ch.charCodeAt(0) >= 32)
    .join('');

  return cleaned.trim();
}

export interface ExtractedPage {
  pageNumber: number;
  text: string;
}

export interface ExtractedPdf {
  pages: ExtractedPage[];
  fullText: string;
  pageCount: number;
}

/**
 * Extracts text content from every page of a PDF file.
 * Returns per-page text (so we can preserve accurate page-number citations)
 * as well as the concatenated full text.
 */
export async function extractPdfText(file: File): Promise<ExtractedPdf> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;

  const pages: ExtractedPage[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();

    // Join text items with spaces, and insert a newline where pdf.js detects
    // a line break (via the `hasEOL` flag on text runs) so paragraph
    // structure survives well enough for chunking.
    let pageText = '';
    for (const item of textContent.items as Array<{ str: string; hasEOL?: boolean }>) {
      pageText += item.str;
      pageText += item.hasEOL ? '\n' : ' ';
    }

    pages.push({
      pageNumber: pageNum,
      text: cleanExtractedText(pageText),
    });
  }

  const fullText = pages.map((p) => p.text).join('\n\n');

  return {
    pages,
    fullText,
    pageCount: pdf.numPages,
  };
}

/** True for files we know how to extract real text from client-side. */
export function isExtractableFile(file: { name: string; type: string }): boolean {
  const name = file.name.toLowerCase();
  return (
    file.type.includes('text') ||
    name.endsWith('.txt') ||
    name.endsWith('.md') ||
    name.endsWith('.json') ||
    name.endsWith('.pdf') ||
    file.type === 'application/pdf'
  );
}
