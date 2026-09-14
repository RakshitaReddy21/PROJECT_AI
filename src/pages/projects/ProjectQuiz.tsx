import React, { useCallback, useEffect, useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import { QuizQuestion, QuizResult } from '../../types';
import { fetchQuizQuestionsApi, submitQuizApi, regenerateQuizApi } from '../../api/quiz';
import {
  QuizUnavailableReason,
  pickAdaptiveNextQuestion,
  ADAPTIVE_SESSION_LENGTH,
  AdaptiveState,
} from '../../services/quiz.service';
import { QuizHeader } from '../../components/quiz/QuizHeader';
import { QuizProgress } from '../../components/quiz/QuizProgress';
import { QuizQuestionCard } from '../../components/quiz/QuizQuestionCard';
import { QuizResultView } from '../../components/quiz/QuizResultView';
import { Button } from '../../components/ui/Button';
import { ArrowRight, CheckCircle2, Clock, Sparkles, RefreshCw, AlertTriangle } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { Link } from 'react-router-dom';

type LoadState = 'loading' | 'ready' | 'empty';

const UNAVAILABLE_COPY: Record<QuizUnavailableReason, { title: string; body: string }> = {
  no_material: {
    title: 'Upload a Learning Material First',
    body: 'Upload a learning material first to generate a quiz.',
  },
  processing: {
    title: 'Material Still Processing',
    body: 'Your material is still being processed. Please wait for indexing to finish before generating a quiz.',
  },
  insufficient_content: {
    title: 'Not Enough Content to Quiz On',
    body: "This material doesn't contain enough information to generate a meaningful quiz.",
  },
  generation_failed: {
    title: "We Couldn't Generate the Quiz",
    body: 'Please try again in a moment.',
  },
};

export const ProjectQuiz: React.FC = () => {
  const { projectId, project, refreshProject, refreshConcepts } = useProject();
  // `pool` is the full set of PDF-grounded questions generated for this project.
  // `askedQuestions` is the live, adaptively-built sequence actually shown this
  // attempt -- it only grows one question at a time, in response to the
  // previous answer, via pickAdaptiveNextQuestion. This is what makes retakes
  // vary and makes "adaptive" mean something rather than just being a label.
  const [pool, setPool] = useState<QuizQuestion[]>([]);
  const [askedQuestions, setAskedQuestions] = useState<QuizQuestion[]>([]);
  const [adaptiveState, setAdaptiveState] = useState<AdaptiveState>('normal');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [showExplanation, setShowExplanation] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [unavailableReason, setUnavailableReason] = useState<QuizUnavailableReason | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const { success, error: toastError } = useToast();

  const sessionLength = Math.min(ADAPTIVE_SESSION_LENGTH, pool.length || ADAPTIVE_SESSION_LENGTH);

  const startSession = useCallback((generatedPool: QuizQuestion[]) => {
    setPool(generatedPool);
    const first = pickAdaptiveNextQuestion(generatedPool, []);
    setAskedQuestions(first.question ? [first.question] : []);
    setAdaptiveState(first.state);
    setCurrentIndex(0);
    setSelectedAnswers({});
    setShowExplanation(false);
    setResult(null);
    setSecondsElapsed(0);
  }, []);

  const loadQuiz = useCallback(async () => {
    setLoadState('loading');
    setUnavailableReason(null);
    try {
      const data = await fetchQuizQuestionsApi(projectId);
      startSession(data);
      setLoadState('ready');
    } catch (err) {
      const reason = (err as { reason?: QuizUnavailableReason })?.reason;
      setUnavailableReason(reason && UNAVAILABLE_COPY[reason] ? reason : 'generation_failed');
      setLoadState('empty');
      console.error(err);
    }
  }, [projectId, startSession]);

  useEffect(() => {
    loadQuiz();
  }, [loadQuiz]);

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    setUnavailableReason(null);
    try {
      const data = await regenerateQuizApi(projectId);
      startSession(data);
      setLoadState('ready');
      success('New Quiz Generated', `Generated ${data.length} PDF-grounded questions to adaptively draw from.`);
    } catch (err) {
      const reason = (err as { reason?: QuizUnavailableReason })?.reason;
      setUnavailableReason(reason && UNAVAILABLE_COPY[reason] ? reason : 'generation_failed');
      setLoadState('empty');
      toastError('Quiz Generation Failed', "We couldn't generate the quiz. Please try again.");
      console.error(err);
    } finally {
      setIsRegenerating(false);
    }
  };

  // Quiz timer
  useEffect(() => {
    if (result) return;
    const timer = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [result]);

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const currentQuestion = askedQuestions[currentIndex];

  const handleSelectOption = (optId: string) => {
    if (!currentQuestion) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: optId,
    }));
  };

  const isFinalQuestion = askedQuestions.length >= sessionLength;

  const handleNext = () => {
    if (!currentQuestion) return;
    setShowExplanation(false);

    // Already have a "next" question queued up from a previous adaptive pick? Just advance to it.
    if (currentIndex < askedQuestions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      return;
    }

    // Otherwise, pick the next question live, based on how the learner just did.
    const isCorrect = selectedAnswers[currentQuestion.id] === currentQuestion.correctOptionId;
    const pick = pickAdaptiveNextQuestion(
      pool,
      askedQuestions.map((q) => q.id),
      {
        questionId: currentQuestion.id,
        conceptId: currentQuestion.conceptId,
        difficulty: currentQuestion.difficulty,
        isCorrect,
      }
    );

    if (!pick.question || askedQuestions.length >= sessionLength) {
      return; // pool exhausted or session length reached -- user submits from here
    }

    setAskedQuestions((prev) => [...prev, pick.question as QuizQuestion]);
    setAdaptiveState(pick.state);
    setCurrentIndex((prev) => prev + 1);
  };

  const handleSubmitQuiz = async () => {
    setIsSubmitting(true);
    try {
      const attempts = askedQuestions.map((q) => ({
        questionId: q.id,
        selectedOptionId: selectedAnswers[q.id] || '',
      }));
      const res = await submitQuizApi(projectId, attempts);
      setResult(res);
      await refreshProject();
      await refreshConcepts();
      success('Quiz Completed!', `You scored ${res.score}% across ${res.totalQuestions} questions. Mastery updated.`);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetake = () => {
    startSession(pool);
  };

  if (result) {
    return <QuizResultView result={result} onRetake={handleRetake} projectId={projectId} />;
  }

  if (loadState === 'loading' || isRegenerating) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16 px-4 bg-paper-raised border border-line/70 rounded-2xl shadow-card space-y-4">
        <Sparkles className="w-10 h-10 text-indigo/60 mx-auto animate-pulse" />
        <h3 className="font-display text-xl font-semibold text-ink">Generating your quiz from the uploaded PDF...</h3>
        <p className="text-xs text-ink-soft max-w-md mx-auto leading-relaxed">
          Retrieving grounded context from your material and drafting questions. This can take a few seconds.
        </p>
      </div>
    );
  }

  if (loadState === 'empty' || pool.length === 0) {
    const copy = UNAVAILABLE_COPY[unavailableReason || 'generation_failed'];
    const showUploadCta = unavailableReason === 'no_material';
    const showRetryCta = unavailableReason === 'generation_failed' || unavailableReason === 'insufficient_content';
    return (
      <div className="max-w-2xl mx-auto text-center py-16 px-4 bg-paper-raised border border-line/70 rounded-2xl shadow-card space-y-4">
        {unavailableReason === 'generation_failed' ? (
          <AlertTriangle className="w-10 h-10 text-rust/70 mx-auto" />
        ) : (
          <Sparkles className="w-10 h-10 text-indigo/60 mx-auto" />
        )}
        <h3 className="font-display text-xl font-semibold text-ink">{copy.title}</h3>
        <p className="text-xs text-ink-soft max-w-md mx-auto leading-relaxed">{copy.body}</p>
        <div className="flex items-center justify-center gap-2">
          {showUploadCta && (
            <Link to={`/projects/${projectId}/materials`}>
              <Button variant="signal" size="sm" className="gap-2">
                Upload Study Materials
              </Button>
            </Link>
          )}
          {showRetryCta && (
            <Button variant="signal" size="sm" className="gap-2" onClick={handleRegenerate} isLoading={isRegenerating}>
              <RefreshCw className="w-3.5 h-3.5" /> Try Again
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (!currentQuestion) return null;

  const currentSelected = selectedAnswers[currentQuestion.id] || null;
  const isLast = isFinalQuestion && currentIndex === askedQuestions.length - 1;
  const answeredCount = askedQuestions.filter((q) => Boolean(selectedAnswers[q.id])).length;

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Top Header & Timer */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono text-ink-faint">
          Target Session: <strong className="text-ink">{project?.title || 'Project Mastery'}</strong>
        </span>
        <div className="flex items-center gap-2">
          <div className="flex items-center space-x-1.5 text-xs font-mono bg-paper-raised px-2.5 py-1 rounded-lg border border-line shadow-sm text-ink-soft">
            <Clock className="w-3.5 h-3.5 text-indigo" />
            <span>{formatTimer(secondsElapsed)}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-[11px] font-mono"
            onClick={handleRegenerate}
            isLoading={isRegenerating}
            title="Generate a fresh pool of questions from your uploaded material"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Regenerate Quiz
          </Button>
        </div>
      </div>

      <QuizHeader adaptiveState={adaptiveState} />

      <QuizProgress current={currentIndex} total={sessionLength} />

      <QuizQuestionCard
        question={currentQuestion}
        selectedOptionId={currentSelected}
        onSelectOption={handleSelectOption}
        showExplanation={showExplanation}
        questionNumber={currentIndex + 1}
        totalQuestions={sessionLength}
      />

      <div className="flex items-center justify-between pt-2">
        {!showExplanation ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowExplanation(true)}
            disabled={!currentSelected}
          >
            Reveal Explanation & Verify
          </Button>
        ) : (
          <span className="text-xs font-mono text-signal-strong font-semibold flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Explanation Active
          </span>
        )}

        {isLast ? (
          <Button
            variant="signal"
            onClick={handleSubmitQuiz}
            disabled={answeredCount < askedQuestions.length || isSubmitting}
            isLoading={isSubmitting}
          >
            <CheckCircle2 className="w-4 h-4 mr-1.5" /> Submit Quiz Score
          </Button>
        ) : (
          <Button variant="primary" onClick={handleNext} disabled={!currentSelected}>
            Next Question <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        )}
      </div>
    </div>
  );
};
