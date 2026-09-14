import { describe, it, expect } from 'vitest';
import { pickAdaptiveNextQuestion } from '../services/quiz.service';
import { QuizQuestion } from '../types';

function makeQ(id: string, conceptId: string, difficulty: 'easy' | 'medium' | 'hard'): QuizQuestion {
  return {
    id,
    conceptId,
    conceptName: conceptId,
    type: 'multiple_choice',
    difficulty,
    question: `Question ${id}`,
    options: [
      { id: 'a', text: 'A' },
      { id: 'b', text: 'B' },
    ],
    correctOptionId: 'a',
    explanation: 'because',
  };
}

describe('pickAdaptiveNextQuestion (real adaptive engine, not cosmetic)', () => {
  const pool: QuizQuestion[] = [
    makeQ('deadlock-easy', 'deadlocks', 'easy'),
    makeQ('deadlock-medium', 'deadlocks', 'medium'),
    makeQ('deadlock-hard', 'deadlocks', 'hard'),
    makeQ('vm-easy', 'virtual-memory', 'easy'),
    makeQ('vm-medium', 'virtual-memory', 'medium'),
    makeQ('vm-hard', 'virtual-memory', 'hard'),
  ];

  it('picks a first question at random without an outcome, preferring medium difficulty', () => {
    const results = new Set<string>();
    for (let i = 0; i < 30; i++) {
      const pick = pickAdaptiveNextQuestion(pool, []);
      expect(pick.question).not.toBeNull();
      results.add(pick.question!.id);
    }
    // Should only ever pick medium-difficulty questions when available.
    results.forEach((id) => expect(id.endsWith('medium')).toBe(true));
  });

  it('reinforces the SAME concept, at equal-or-easier difficulty, after a WRONG answer', () => {
    const pick = pickAdaptiveNextQuestion(pool, ['deadlock-medium'], {
      questionId: 'deadlock-medium',
      conceptId: 'deadlocks',
      difficulty: 'medium',
      isCorrect: false,
    });
    expect(pick.question).not.toBeNull();
    expect(pick.question!.conceptId).toBe('deadlocks');
    expect(['easy', 'medium']).toContain(pick.question!.difficulty);
    expect(pick.state).toBe('focus');
  });

  it('escalates difficulty and prefers a DIFFERENT concept after a CORRECT answer', () => {
    const pick = pickAdaptiveNextQuestion(pool, ['deadlock-medium'], {
      questionId: 'deadlock-medium',
      conceptId: 'deadlocks',
      difficulty: 'medium',
      isCorrect: true,
    });
    expect(pick.question).not.toBeNull();
    expect(pick.question!.conceptId).not.toBe('deadlocks');
    expect(pick.question!.difficulty).toBe('hard');
    expect(pick.state).toBe('increased');
  });

  it('never repeats an already-asked question', () => {
    const asked = ['deadlock-easy', 'deadlock-medium', 'deadlock-hard', 'vm-easy', 'vm-medium'];
    const pick = pickAdaptiveNextQuestion(pool, asked, {
      questionId: 'vm-medium',
      conceptId: 'virtual-memory',
      difficulty: 'medium',
      isCorrect: true,
    });
    expect(pick.question?.id).toBe('vm-hard');
  });

  it('returns null once the entire pool has been asked', () => {
    const allIds = pool.map((q) => q.id);
    const pick = pickAdaptiveNextQuestion(pool, allIds, {
      questionId: 'vm-hard',
      conceptId: 'virtual-memory',
      difficulty: 'hard',
      isCorrect: true,
    });
    expect(pick.question).toBeNull();
  });

  it('produces a different question sequence across repeated sessions (real randomness, not a fixed order)', () => {
    const sequences = new Set<string>();
    for (let i = 0; i < 20; i++) {
      const first = pickAdaptiveNextQuestion(pool, []);
      sequences.add(first.question!.id);
    }
    // With two medium-difficulty candidates to choose from, we should see variety across runs.
    expect(sequences.size).toBeGreaterThan(1);
  });
});
