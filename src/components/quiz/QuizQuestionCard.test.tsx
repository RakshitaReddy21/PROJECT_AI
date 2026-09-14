import { render, screen } from '@testing-library/react';
import { QuizQuestionCard } from './QuizQuestionCard';
import { QuizQuestion } from '../../types';
import { describe, it, expect } from 'vitest';

const sampleQuestion: QuizQuestion = {
  id: 'q-test-1',
  conceptId: 'c-1',
  conceptName: 'Vector Embeddings',
  type: 'multiple_choice',
  question: 'What is a vector embedding in latent space?',
  options: [
    { id: 'opt-1', text: 'Floating point array in high-dimensional continuous space.' },
    { id: 'opt-2', text: 'SQL primary key identifier.' },
  ],
  correctOptionId: 'opt-1',
  explanation: 'Vector embeddings map semantic meanings to distance in metric space.',
};

describe('QuizQuestionCard Component', () => {
  it('does NOT display explanation prior to submission', () => {
    render(
      <QuizQuestionCard
        question={sampleQuestion}
        selectedOptionId={null}
        onSelectOption={() => {}}
        showExplanation={false}
      />
    );

    expect(screen.queryByText('Vector embeddings map semantic meanings to distance in metric space.')).not.toBeInTheDocument();
  });

  it('displays explanation when showExplanation is true', () => {
    render(
      <QuizQuestionCard
        question={sampleQuestion}
        selectedOptionId="opt-1"
        onSelectOption={() => {}}
        showExplanation={true}
      />
    );

    expect(screen.getByText('Vector embeddings map semantic meanings to distance in metric space.')).toBeInTheDocument();
  });
});
