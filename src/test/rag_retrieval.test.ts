import { describe, it, expect, beforeEach } from 'vitest';
import { appStorage } from '../services/storage/localStorageStore';
import { ragService } from '../services/rag.service';
import { tutorService } from '../services/tutor.service';

describe('RAG Grounded Retrieval & Project Isolation', () => {
  beforeEach(() => {
    appStorage.resetToSeed();
  });

  it('retrieves relevant document chunks and synthesizes grounded answers with citations', async () => {
    const projectId = 'proj-1';
    const query = 'How does Reciprocal Rank Fusion calculate document scores?';

    const response = await ragService.retrieveAndGenerate(projectId, query);

    expect(response.isGrounded).toBe(true);
    expect(response.isUnsupported).toBe(false);
    expect(response.citations.length).toBeGreaterThan(0);
    expect(response.citations[0].materialTitle).toBeDefined();
    expect(response.citations[0].excerpt).toContain('Reciprocal Rank Fusion');
    expect(response.text).toContain('Reciprocal Rank Fusion');
    expect(response.suggestedFollowups.length).toBeGreaterThan(0);
  });

  it('triggers calm unsupported notice when query falls outside project materials (Project Isolation)', async () => {
    const projectId = 'proj-1';
    // proj-1 only has RAG documents; query about Transformers is only in proj-2 or out of scope
    const outOfScopeQuery = 'What is the recipe for baking chocolate chip cookies with sea salt?';

    const response = await ragService.retrieveAndGenerate(projectId, outOfScopeQuery);

    expect(response.isGrounded).toBe(false);
    expect(response.isUnsupported).toBe(true);
    expect(response.citations.length).toBe(0);
    expect(response.text).toContain("couldn't find enough direct evidence");
  });

  it('adapts grounded explanation when explain_simpler action is triggered', async () => {
    const projectId = 'proj-1';
    const query = 'Explain vector indexing';

    const response = await ragService.retrieveAndGenerate(projectId, query, 'explain_simpler');

    expect(response.isGrounded).toBe(true);
    expect(response.text).toContain('simplified explanation');
    expect(response.text).toContain('library');
  });

  it('generates an interactive practice question derived from retrieved chunk when test_me is triggered', async () => {
    const projectId = 'proj-1';
    const query = 'Test me on Cross-Encoders';

    const response = await ragService.retrieveAndGenerate(projectId, query, 'test_me');

    expect(response.isGrounded).toBe(true);
    expect(response.text).toContain('Practice Checkpoint');
    expect(response.text).toContain('Question:');
  });

  it('stores multi-turn conversation and emits activity through TutorService', async () => {
    const projectId = 'proj-1';
    const userText = 'Explain the difference between dense and sparse retrieval';

    const message = await tutorService.sendTutorMessage(projectId, userText);

    expect(message.sender).toBe('tutor');
    expect(message.citations.length).toBeGreaterThan(0);

    const history = await tutorService.getTutorMessages(projectId);
    expect(history.length).toBeGreaterThanOrEqual(2);
    const lastUser = history[history.length - 2];
    const lastTutor = history[history.length - 1];

    expect(lastUser.sender).toBe('user');
    expect(lastUser.text).toBe(userText);
    expect(lastTutor.sender).toBe('tutor');
  });
});
