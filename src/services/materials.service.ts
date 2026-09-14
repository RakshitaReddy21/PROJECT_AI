import { Material, MaterialProcessingStage, DocumentChunk, Concept, BackgroundJob } from '../types';
import { appStorage } from './storage/localStorageStore';
import { activityService } from './activity.service';
import { authService } from './auth.service';
import { aiUsageService } from './aiUsage.service';
import { CONCEPT_EXTRACTION_V1, DOCUMENT_UNDERSTANDING_V1 } from '../prompts';
import { projectsService } from './projects.service';
import { aiProviderService } from './aiProvider.service';
import { localLlmService } from './localLlm.service';

const CHUNK_TARGET_CHARS = 700; // matches the reference pdf_service.py chunk_size
const CHUNK_OVERLAP_CHARS = 100; // matches the reference pdf_service.py chunk_overlap
const BREAK_MARKERS = ['. ', '.\n', '? ', '!\n', '\n\n', '\n', ' '];
const STOPWORDS = new Set([
  'the', 'and', 'or', 'but', 'if', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from',
  'is', 'are', 'was', 'were', 'what', 'which', 'who', 'whom', 'this', 'that', 'these', 'those',
  'does', 'do', 'did', 'have', 'has', 'had', 'it', 'its', 'how', 'why', 'can', 'could', 'would',
  'should', 'you', 'your', 'a', 'an', 'be', 'as', 'not', 'will', 'each', 'their', 'there', 'when',
  'also', 'into', 'than', 'then', 'such', 'more', 'other', 'some', 'may', 'any', 'all', 'we',
]);
// Words/phrases that are document-structure noise, not real teachable topics.
// Concept extraction (both AI and heuristic fallbacks) must never surface these.
const CONCEPT_BLOCKLIST = new Set([
  'table', 'contents', 'chapter', 'chapters', 'notes', 'note', 'basics', 'basic', 'page', 'pages',
  'prepared', 'complete', 'beginner', 'friendly', 'level', 'levels', 'supports', 'support',
  'appendix', 'index', 'introduction', 'overview', 'summary', 'section', 'sections', 'study',
  'self', 'fundamentals', 'guide', 'copyright', 'title', 'author', 'preface', 'quick', 'fact',
]);

/**
 * Splits a page of text into overlapping, boundary-aware chunks.
 * Ported from a proven server-side implementation (Python's PDFService.chunk_document):
 * sliding window that prefers to break on a sentence/paragraph boundary once past
 * 60% of the target chunk size, and overlaps consecutive chunks so a concept split
 * across a chunk boundary doesn't lose context in either chunk.
 */
function splitIntoChunks(text: string): string[] {
  if (!text || !text.trim()) return [];
  const trimmed = text.trim();

  if (trimmed.length <= CHUNK_TARGET_CHARS) {
    return [trimmed];
  }

  const chunks: string[] = [];
  let start = 0;
  const textLen = trimmed.length;

  while (start < textLen) {
    const end = start + CHUNK_TARGET_CHARS;
    if (end >= textLen) {
      const tail = trimmed.slice(start).trim();
      if (tail) chunks.push(tail);
      break;
    }

    const slice = trimmed.slice(start, end);
    let breakPoint = -1;
    for (const marker of BREAK_MARKERS) {
      const idx = slice.lastIndexOf(marker);
      if (idx > Math.floor(CHUNK_TARGET_CHARS * 0.6)) {
        breakPoint = idx + marker.length;
        break;
      }
    }

    let nextStart: number;
    if (breakPoint !== -1) {
      const piece = trimmed.slice(start, start + breakPoint).trim();
      if (piece) chunks.push(piece);
      nextStart = start + breakPoint - CHUNK_OVERLAP_CHARS;
    } else {
      const piece = trimmed.slice(start, end).trim();
      if (piece) chunks.push(piece);
      nextStart = end - CHUNK_OVERLAP_CHARS;
    }

    // Safety: guarantee forward progress even if overlap math stalls
    start = nextStart > start ? nextStart : start + 1;
  }

  return chunks.length > 0 ? chunks : [trimmed.slice(0, CHUNK_TARGET_CHARS)];
}

/** Pulls the most frequent non-trivial words out of a chunk as lightweight per-chunk tags (used only for retrieval hints, not as standalone concepts). */
function extractKeywords(text: string, count = 2): string[] {
  const counts = new Map<string, number>();
  const words = text.toLowerCase().replace(/[^\w\s]/g, ' ').split(/\s+/);
  for (const w of words) {
    if (w.length > 4 && !STOPWORDS.has(w) && !CONCEPT_BLOCKLIST.has(w) && !/^\d+$/.test(w)) {
      counts.set(w, (counts.get(w) || 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(([w]) => w.charAt(0).toUpperCase() + w.slice(1));
}

/**
 * Builds real, retrievable DocumentChunks from actual extracted file text.
 * Pages are delimited by the form-feed (\f) marker inserted during upload
 * (see UploadDropzone) so real page numbers survive into citations.
 */
function buildChunksFromContent(
  fileContent: string,
  ids: { ownerId: string; materialId: string; projectId: string },
  title: string
): DocumentChunk[] {
  const rawPages = fileContent.split('\f');
  const chunks: DocumentChunk[] = [];
  let chunkIndex = 0;

  rawPages.forEach((pageText, pageIdx) => {
    const pageChunks = splitIntoChunks(pageText);
    for (const content of pageChunks) {
      if (content.trim().length < 20) continue;
      chunkIndex += 1;
      const keywords = extractKeywords(content);
      chunks.push({
        id: `chk-${Date.now()}-${chunkIndex}`,
        userId: ids.ownerId,
        materialId: ids.materialId,
        projectId: ids.projectId,
        chunkIndex,
        pageNumber: pageIdx + 1,
        content,
        tokenCount: Math.round(content.length / 4),
        conceptsMentioned: keywords.length > 0 ? keywords : [`Knowledge from ${title.slice(0, 18)}`],
      });
    }
  });

  return chunks.length > 0
    ? chunks
    : [
        {
          id: `chk-${Date.now()}-1`,
          userId: ids.ownerId,
          materialId: ids.materialId,
          projectId: ids.projectId,
          chunkIndex: 1,
          pageNumber: 1,
          content: fileContent.slice(0, CHUNK_TARGET_CHARS),
          tokenCount: Math.round(Math.min(fileContent.length, CHUNK_TARGET_CHARS) / 4),
          conceptsMentioned: [`Knowledge from ${title.slice(0, 18)}`],
        },
      ];
}

interface ExtractedConceptCandidate {
  name: string;
  definition: string;
  category: string;
}

/** True if a candidate concept name is document-structure noise rather than a real topic. */
export function isBlockedConceptName(name: string): boolean {
  const cleaned = name.trim().toLowerCase();
  if (cleaned.length < 3 || cleaned.length > 70) return true;
  const words = cleaned.split(/\s+/);
  // Block if EVERY word in the candidate is a blocklisted structural word
  // (e.g. "Table", "Notes"), but allow it if it's a real multi-word topic
  // that merely contains a common word (e.g. "Study Habits" is fine, but not "Study" alone).
  return words.every((w) => CONCEPT_BLOCKLIST.has(w) || STOPWORDS.has(w) || /^\d+$/.test(w));
}

/** Builds a spread sample of real chunk content (not just the intro) for feeding to the AI/heuristics, capped to a char budget. */
function buildRepresentativeExcerpt(chunks: DocumentChunk[], maxChars = 6000): string {
  const substantive = chunks.filter((c) => c.content.trim().length > 40);
  if (substantive.length === 0) return '';
  // Sample evenly across the whole document rather than only the first N chunks,
  // so title pages / tables of contents don't dominate the sample.
  const targetSamples = Math.min(substantive.length, 18);
  const stride = Math.max(1, Math.floor(substantive.length / targetSamples));
  const picked: string[] = [];
  let budget = maxChars;
  for (let i = 0; i < substantive.length && budget > 0; i += stride) {
    const piece = substantive[i].content.trim();
    picked.push(piece);
    budget -= piece.length;
  }
  return picked.join('\n---\n');
}

/**
 * Structural fallback: real study PDFs/notes are usually organized with numbered
 * chapters and/or a table of contents. When no AI model is available, extracting
 * those real headings is far more reliable than blind word-frequency counting.
 */
function extractStructuralHeadings(rawText: string): string[] {
  const results: string[] = [];

  // "1. Variables and Data Types 7" style table-of-contents lines.
  const tocPattern = /^\s*\d{1,2}\.\s+(.{3,60}?)\s+\d{1,4}\s*$/gm;
  let match: RegExpExecArray | null;
  while ((match = tocPattern.exec(rawText)) !== null) {
    results.push(match[1].trim());
  }

  // "CHAPTER 3\nVariables and Data Types" style headings.
  const chapterPattern = /CHAPTER\s+\d+\s*\n+\s*(.{3,60})/gi;
  while ((match = chapterPattern.exec(rawText)) !== null) {
    results.push(match[1].trim());
  }

  const cleaned = results
    .map((r) => r.replace(/[\u2022■]/g, '').replace(/\s+/g, ' ').trim())
    .filter((r) => r.length > 0 && !isBlockedConceptName(r));

  // Dedupe case-insensitively, preserving first-seen casing.
  const seen = new Map<string, string>();
  for (const name of cleaned) {
    const key = name.toLowerCase();
    if (!seen.has(key)) seen.set(key, name);
  }
  return Array.from(seen.values());
}

/** Last-resort fallback: whole-document (not per-chunk) word-frequency, with a strict stoplist. */
function extractFrequencyFallback(rawText: string, count: number): string[] {
  const counts = new Map<string, number>();
  const words = rawText.toLowerCase().replace(/[^\w\s]/g, ' ').split(/\s+/);
  for (const w of words) {
    if (w.length > 4 && !STOPWORDS.has(w) && !CONCEPT_BLOCKLIST.has(w) && !/^\d+$/.test(w)) {
      counts.set(w, (counts.get(w) || 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(([w]) => w.charAt(0).toUpperCase() + w.slice(1));
}

/** True if a chunk looks like a table-of-contents / index block rather than real explanatory prose. */
export function isTableOfContentsLike(content: string): boolean {
  if (/table of contents/i.test(content)) return true;
  const tocLineMatches = content.match(/^\s*\d{1,2}\.\s+.{3,60}?\s+\d{1,4}\s*$/gm);
  return !!tocLineMatches && tocLineMatches.length >= 3;
}

/** Counts (non-overlapping) occurrences of a substring in a string. */
function countOccurrences(haystack: string, needle: string): number {
  if (!needle) return 0;
  let count = 0;
  let idx = haystack.indexOf(needle);
  while (idx !== -1) {
    count += 1;
    idx = haystack.indexOf(needle, idx + needle.length);
  }
  return count;
}

/**
 * Scores how relevant a chunk's content is to a candidate concept name.
 * Weighted by occurrence COUNT (not just presence) and boosted when the name
 * appears near the very start of the chunk (i.e. the chunk is likely headed
 * by that concept) -- otherwise a concept name that's merely mentioned once
 * in passing (e.g. in an intro's bullet list) ties with, and can beat by
 * iteration order, the chunk that's actually ABOUT that concept.
 */
export function scoreChunkRelevance(name: string, content: string): number {
  const nameLower = name.toLowerCase();
  const contentLower = content.toLowerCase();
  const nameWords = nameLower.split(/\s+/).filter((w) => w.length > 3);

  let score = 0;
  const exactOccurrences = countOccurrences(contentLower, nameLower);
  score += exactOccurrences * 5;
  if (exactOccurrences > 0 && contentLower.indexOf(nameLower) < 40) {
    score += 8; // likely a heading -- this chunk is probably ABOUT the concept, not just mentioning it
  }
  for (const w of nameWords) {
    score += countOccurrences(contentLower, w);
  }
  return score;
}

/** Finds the chunk whose content best overlaps with a candidate concept name, for building a grounded definition. */
function findBestMatchingChunk(name: string, chunks: DocumentChunk[]): DocumentChunk | undefined {
  let best: { chunk: DocumentChunk; score: number } | undefined;
  for (const chunk of chunks) {
    if (isTableOfContentsLike(chunk.content)) continue;
    const score = scoreChunkRelevance(name, chunk.content);
    if (score > 0 && (!best || score > best.score)) {
      best = { chunk, score };
    }
  }
  return best?.chunk;
}

/**
 * Extracts real, teachable concepts from a processed document: tries an LLM
 * first (grounded in a spread sample of the actual text), falls back to
 * structural heading/table-of-contents detection, and only as a last resort
 * to whole-document word frequency. Never returns document-structure noise
 * ("Table", "Contents", "Basics", etc.) regardless of which path is used.
 */
async function extractConcepts(
  title: string,
  rawFileContent: string,
  chunks: DocumentChunk[],
  projectId: string
): Promise<ExtractedConceptCandidate[]> {
  const excerpt = buildRepresentativeExcerpt(chunks);
  let candidates: ExtractedConceptCandidate[] = [];
  let isLiveAI = false;
  let modelUsed = CONCEPT_EXTRACTION_V1.targetModel as string;

  if (excerpt.length > 0) {
    const systemInstruction = CONCEPT_EXTRACTION_V1.systemInstruction;
    const prompt = CONCEPT_EXTRACTION_V1.formatTemplate({ documentTitle: title, rawTextExcerpt: excerpt });

    let text: string | null = null;
    if (localLlmService.isEnabled() && localLlmService.isReady()) {
      const localResult = await localLlmService.generate({
        systemInstruction,
        prompt,
        temperature: CONCEPT_EXTRACTION_V1.temperature,
        maxOutputTokens: CONCEPT_EXTRACTION_V1.maxOutputTokens,
      });
      if (localResult && localResult.text.trim().length > 0) {
        text = localResult.text.trim();
        modelUsed = localResult.model;
        isLiveAI = true;
      }
    } else if (aiProviderService.hasApiKey()) {
      const result = await aiProviderService.generate({
        model: CONCEPT_EXTRACTION_V1.targetModel,
        systemInstruction,
        prompt,
        temperature: CONCEPT_EXTRACTION_V1.temperature,
        maxOutputTokens: CONCEPT_EXTRACTION_V1.maxOutputTokens,
        responseFormat: 'json',
        operationName: 'concept_graph_extraction',
        projectId,
      });
      if (result && result.text.trim().length > 0) {
        text = result.text.trim();
        modelUsed = result.model;
        isLiveAI = true;
      }
    }

    if (text) {
      const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
      try {
        const parsed = JSON.parse(cleaned);
        const raw = Array.isArray(parsed?.concepts) ? parsed.concepts : [];
        candidates = raw
          .filter(
            (c: unknown): c is { name: string; definition?: string; category?: string } =>
              !!c && typeof (c as { name?: unknown }).name === 'string'
          )
          .map((c: { name: string; definition?: string; category?: string }) => ({
            name: c.name.trim(),
            definition: typeof c.definition === 'string' && c.definition.trim() ? c.definition.trim() : `${c.name.trim()} is a concept covered in "${title}".`,
            category: typeof c.category === 'string' && c.category.trim() ? c.category.trim() : 'Extracted Material',
          }))
          .filter((c: ExtractedConceptCandidate) => !isBlockedConceptName(c.name));
      } catch {
        candidates = [];
      }
    }

    if (isLiveAI) {
      await aiUsageService.recordAIUsage({
        model: modelUsed,
        promptTokens: Math.round(prompt.length / 4),
        completionTokens: Math.round((text?.length || 0) / 4),
        latencyMs: 700,
        operation: 'concept_graph_extraction',
        projectId,
      });
    }
  }

  if (candidates.length >= 3) {
    return candidates.slice(0, 10);
  }

  // Structural fallback: real chapter/TOC headings, grounded with a real excerpt per concept.
  const structural = extractStructuralHeadings(rawFileContent).slice(0, 10);
  if (structural.length >= 2) {
    return structural.map((name) => {
      const matchChunk = findBestMatchingChunk(name, chunks);
      const excerptText = matchChunk ? matchChunk.content.slice(0, 220).trim() : undefined;
      return {
        name,
        definition: excerptText
          ? `${name}: ${excerptText}${excerptText.length >= 220 ? '...' : ''}`
          : `${name} is a topic covered in "${title}".`,
        category: 'Extracted Material',
      };
    });
  }

  // Last resort: whole-document word frequency (still better than the old per-chunk version).
  const frequencyNames = extractFrequencyFallback(rawFileContent, 5);
  if (frequencyNames.length > 0) {
    return frequencyNames.map((name) => {
      const matchChunk = findBestMatchingChunk(name, chunks);
      const excerptText = matchChunk ? matchChunk.content.slice(0, 220).trim() : undefined;
      return {
        name,
        definition: excerptText
          ? `${name}: ${excerptText}${excerptText.length >= 220 ? '...' : ''}`
          : `Key term identified in "${title}" during document parsing.`,
        category: 'Extracted Material',
      };
    });
  }

  return [];
}

export class MaterialsService {
  async getMaterials(projectId: string): Promise<Material[]> {
    projectsService.assertProjectAccess(projectId);
    const materials = appStorage.get('materials');
    return materials.filter((m) => m.projectId === projectId);
  }

  async uploadMaterial(
    projectId: string,
    file: { name: string; size: number; type: string },
    fileContent?: string
  ): Promise<Material> {
    const project = projectsService.assertProjectAccess(projectId);
    const currentUser = authService.getCurrentUser();
    const ownerId = project.userId || currentUser?.id;
    if (!ownerId) {
      throw new Error('Unauthorized: Owner identity required to upload material');
    }

    const materialId = `mat-${Date.now()}`;
    const cleanTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');

    const newMaterial: Material = {
      id: materialId,
      userId: ownerId,
      projectId,
      title: cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1),
      fileName: file.name,
      fileSize: file.size,
      fileType: file.name.split('.').pop() || 'pdf',
      stage: 'uploading',
      progress: 15,
      pageCount: Math.max(1, Math.floor(file.size / 150000) + 1),
      searchableStatus: 'processing',
      extractedConceptsCount: 0,
      chunkCount: 0,
      uploadedAt: new Date().toISOString(),
    };

    appStorage.update('materials', (prev) => [newMaterial, ...prev]);

    // Update project count
    appStorage.update('projects', (projects) =>
      projects.map((p) =>
        p.id === projectId ? { ...p, materialCount: p.materialCount + 1 } : p
      )
    );

    // Track Background Job
    const job: BackgroundJob = {
      id: `job-${Date.now()}`,
      type: 'document_processing',
      status: 'processing',
      progress: 15,
      targetEntityId: materialId,
      startedAt: new Date().toISOString(),
    };
    appStorage.update('backgroundJobs', (jobs) => [job, ...jobs]);

    // Log Activity
    await activityService.logActivity({
      userId: ownerId,
      userName: currentUser?.name || 'Learner',
      projectId,
      projectTitle: project.title,
      type: 'material_uploaded',
      description: `Uploaded study material "${file.name}" for vector indexing.`,
    });

    // Start Async Pipeline Simulation with actual text if provided
    this.runPipeline(materialId, projectId, cleanTitle, ownerId, fileContent);

    return newMaterial;
  }

  private async runPipeline(
    materialId: string,
    projectId: string,
    title: string,
    ownerId: string,
    fileContent?: string
  ) {
    const stages: MaterialProcessingStage[] = [
      'extracting',
      'chunking',
      'embedding',
      'graphing',
      'ready',
    ];

    let progress = 20;
    for (const stage of stages) {
      await new Promise((resolve) => setTimeout(resolve, 800));

      const allMaterials = appStorage.get('materials');
      const mat = allMaterials.find((m) => m.id === materialId);
      if (!mat) break;

      progress += 16;
      const isReady = stage === 'ready';

      appStorage.update('materials', (materials) =>
        materials.map((m) =>
          m.id === materialId
            ? {
                ...m,
                stage,
                progress: isReady ? 100 : Math.min(95, progress),
                searchableStatus: isReady ? 'indexed' : 'processing',
                chunkCount: isReady ? 2 : m.chunkCount,
                extractedConceptsCount: isReady ? 1 : m.extractedConceptsCount,
              }
            : m
        )
      );

      // Update background job progress
      appStorage.update('backgroundJobs', (jobs) =>
        jobs.map((j) =>
          j.targetEntityId === materialId
            ? {
                ...j,
                progress: isReady ? 100 : progress,
                status: isReady ? 'completed' : 'processing',
                completedAt: isReady ? new Date().toISOString() : undefined,
              }
            : j
        )
      );

      if (isReady) {
        const hasRealContent = Boolean(fileContent && fileContent.trim().length > 50);

        const newChunks: DocumentChunk[] = hasRealContent
          ? buildChunksFromContent(fileContent as string, { ownerId, materialId, projectId }, title)
          : [
              {
                id: `chk-${Date.now()}-1`,
                userId: ownerId,
                materialId,
                projectId,
                chunkIndex: 1,
                pageNumber: 1,
                content: `No extractable text was found for "${title}". This file format (or a scanned/image-based PDF) can't be parsed for real content in this client-side demo pipeline yet, so the tutor cannot ground answers in it. Try uploading a .txt, .md, or text-based .pdf instead.`,
                tokenCount: 60,
                conceptsMentioned: [`Unindexed: ${title.slice(0, 18)}`],
              },
            ];

        appStorage.update('documentChunks', (chunks) => [...chunks, ...newChunks]);

        const chunkCount = newChunks.length;

        // Extract real, teachable concepts (AI-first, with grounded structural
        // and frequency fallbacks — never document-structure noise like "Table" or "Basics").
        const extractedCandidates = hasRealContent
          ? await extractConcepts(title, fileContent as string, newChunks, projectId)
          : [{ name: `Unindexed: ${title.slice(0, 18)}`, definition: `Placeholder concept — no real text could be extracted from "${title}".`, category: 'Extracted Material' }];

        const newConcepts: Concept[] = extractedCandidates.map((candidate, i) => ({
          id: `c-${Date.now()}-${i}`,
          projectId,
          name: candidate.name,
          definition: candidate.definition,
          category: candidate.category,
          masteryLevel: 'novice',
          score: 30,
          trend: 'neutral',
          isWeakness: true,
          recentChange: 0,
          lastAssessedAt: new Date().toISOString(),
          changeReason: 'Newly extracted from document ingestion pipeline.',
          relatedMaterialIds: [materialId],
        }));

        appStorage.update('concepts', (concepts) => [...concepts, ...newConcepts]);
        appStorage.update('materials', (materials) =>
          materials.map((m) => (m.id === materialId ? { ...m, chunkCount, extractedConceptsCount: newConcepts.length } : m))
        );
        appStorage.update('projects', (projects) =>
          projects.map((p) =>
            p.id === projectId ? { ...p, conceptCount: p.conceptCount + newConcepts.length } : p
          )
        );

        await aiUsageService.recordAIUsage({
          model: DOCUMENT_UNDERSTANDING_V1.targetModel,
          promptTokens: 350,
          completionTokens: 120,
          latencyMs: 380,
          operation: 'document_chunking_extraction',
          projectId,
        });
      }
    }
  }

  async retryMaterial(materialId: string): Promise<Material> {
    const materials = appStorage.get('materials');
    const mat = materials.find((m) => m.id === materialId);
    if (!mat) throw new Error('Material not found');

    const project = projectsService.assertProjectAccess(mat.projectId);

    const updated: Material = {
      ...mat,
      stage: 'uploading',
      progress: 15,
      errorMessage: undefined,
      searchableStatus: 'processing',
    };

    appStorage.update('materials', (list) =>
      list.map((m) => (m.id === materialId ? updated : m))
    );

    const ownerId = project.userId || authService.getCurrentUser()?.id || 'user-unknown';
    this.runPipeline(materialId, mat.projectId, mat.title, ownerId);
    return updated;
  }

  async deleteMaterial(materialId: string): Promise<boolean> {
    const materials = appStorage.get('materials');
    const mat = materials.find((m) => m.id === materialId);
    if (!mat) return false;

    projectsService.assertProjectAccess(mat.projectId);

    appStorage.update('materials', (list) => list.filter((m) => m.id !== materialId));
    appStorage.update('documentChunks', (list) => list.filter((c) => c.materialId !== materialId));
    appStorage.update('projects', (projects) =>
      projects.map((p) =>
        p.id === mat.projectId ? { ...p, materialCount: Math.max(0, p.materialCount - 1) } : p
      )
    );
    return true;
  }
}

export const materialsService = new MaterialsService();
