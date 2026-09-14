import React from 'react';
import { QuizQuestion } from '../../types';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { CheckCircle2, AlertCircle, TrendingUp, Sparkles, HelpCircle } from 'lucide-react';

export interface QuizQuestionCardProps {
  question: QuizQuestion;
  selectedOptionId: string | null;
  onSelectOption: (optionId: string) => void;
  showExplanation?: boolean;
  questionNumber?: number;
  totalQuestions?: number;
  conceptScore?: number;
}

export const QuizQuestionCard: React.FC<QuizQuestionCardProps> = ({
  question,
  selectedOptionId,
  onSelectOption,
  showExplanation = false,
  questionNumber,
  totalQuestions,
  conceptScore = 50,
}) => {
  const typeBadgeVariant = {
    multiple_choice: 'neutral',
    true_false: 'indigo',
    scenario: 'amber',
  }[question.type] as 'neutral' | 'indigo' | 'amber';

  const isSelected = selectedOptionId !== null;
  const isCorrect = selectedOptionId === question.correctOptionId;

  // Dynamic mastery score transition calculation
  const baseMastery = conceptScore;
  const newMastery = isCorrect ? Math.min(100, baseMastery + 6) : Math.max(0, baseMastery - 4);
  const delta = isCorrect ? '+6%' : '-4%';

  return (
    <Card className="p-6 space-y-5 bg-paper-raised border border-line/70 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-line/50">
        <div className="flex items-center space-x-2">
          {questionNumber && totalQuestions && (
            <span className="text-xs font-mono font-semibold text-ink">
              Question {questionNumber} / {totalQuestions}
            </span>
          )}
          <span className="text-[11px] font-mono text-signal-strong bg-signal-soft/60 px-2.5 py-0.5 rounded font-medium border border-signal/20">
            Concept: {question.conceptName}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <Badge variant={typeBadgeVariant} size="sm" className="capitalize font-mono">
            {question.type.replace('_', ' ')}
          </Badge>
          <span className="text-[10px] font-mono uppercase bg-paper-sunken border border-line px-2 py-0.5 rounded text-ink-faint font-semibold">
            Difficulty: {question.difficulty || 'Medium'}
          </span>
        </div>
      </div>

      <h3 className="font-sans text-base md:text-lg font-semibold text-ink leading-relaxed">
        {question.question}
      </h3>

      {/* Options List */}
      <div className="space-y-2.5">
        {question.options.map((opt) => {
          const isThisSelected = selectedOptionId === opt.id;
          const isThisCorrect = opt.id === question.correctOptionId;

          let optionStyle = 'border-line hover:border-ink-soft bg-paper-raised text-ink';

          if (showExplanation) {
            if (isThisCorrect) {
              optionStyle = 'border-signal bg-signal-soft/40 text-signal-strong font-semibold shadow-sm';
            } else if (isThisSelected && !isThisCorrect) {
              optionStyle = 'border-rust bg-rust-soft/40 text-rust font-semibold shadow-sm';
            } else {
              optionStyle = 'border-line/40 opacity-60 bg-paper-sunken text-ink-faint';
            }
          } else if (isThisSelected) {
            optionStyle = 'border-[#FF6B35] bg-[#FFEBE0] font-semibold shadow-sm text-[#1F1917]';
          }

          return (
            <button
              key={opt.id}
              onClick={() => !showExplanation && onSelectOption(opt.id)}
              disabled={showExplanation}
              className={`w-full text-left p-3.5 text-xs rounded-xl border transition-all duration-150 flex items-start gap-3 ${optionStyle}`}
            >
              <div
                className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                  isThisSelected ? 'border-[#FF6B35] bg-[#FF6B35] text-white' : 'border-line'
                }`}
              >
                {isThisSelected && <div className="w-1.5 h-1.5 rounded-full bg-paper" />}
              </div>
              <span className="leading-relaxed flex-1">{opt.text}</span>
            </button>
          );
        })}
      </div>

      {/* EXPLANATION & SUBTLE ANIMATED MASTERY TRANSITION (PRD #20) */}
      {showExplanation && (
        <div className="p-4.5 bg-paper-sunken rounded-xl border border-line/70 space-y-3 animate-fade-in">
          {/* Result Alert Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {isCorrect ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-signal" />
                  <span className="text-xs font-semibold text-signal-strong font-mono uppercase">
                    Correct Answer
                  </span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-rust" />
                  <span className="text-xs font-semibold text-rust font-mono uppercase">
                    Incorrect
                  </span>
                </>
              )}
            </div>

            {/* Requirement-Driven Concept Mastery Delta Transition */}
            <div className="flex items-center space-x-2 text-xs font-mono bg-paper-raised px-3 py-1 rounded-lg border border-line shadow-sm animate-slide-up">
              <span className="text-ink-faint text-[11px]">Node [{question.conceptName}]:</span>
              <span className="line-through text-ink-faint">{baseMastery}%</span>
              <span className="text-ink font-bold">→</span>
              <span className={`font-bold ${isCorrect ? 'text-signal-strong' : 'text-rust'}`}>
                {newMastery}%
              </span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isCorrect ? 'bg-signal-soft text-signal-strong' : 'bg-rust-soft text-rust'}`}>
                {delta}
              </span>
            </div>
          </div>

          <div className="space-y-1 pt-1 border-t border-line/40">
            <p className="text-[11px] font-semibold text-ink font-mono uppercase tracking-wider">
              Explanation & Technical Reasoning
            </p>
            <p className="text-xs text-ink-soft leading-relaxed">{question.explanation}</p>
          </div>
        </div>
      )}
    </Card>
  );
};
