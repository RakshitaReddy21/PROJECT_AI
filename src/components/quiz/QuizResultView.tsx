import React from 'react';
import { QuizResult } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { ConceptPerformance } from './ConceptPerformance';
import { TopicPerformanceTable } from './TopicPerformanceTable';
import { AnimatedNumber, SlideUp } from '../motion';
import { Trophy, RefreshCw, ArrowRight, Sparkles, Brain, Layers } from 'lucide-react';
import { Link } from 'react-router-dom';

export interface QuizResultViewProps {
  result: QuizResult;
  onRetake: () => void;
  projectId: string;
}

export const QuizResultView: React.FC<QuizResultViewProps> = ({ result, onRetake, projectId }) => {
  const isHighScorer = result.score >= 75;
  const weakPerformers = result.conceptPerformance?.filter((c) => c.delta < 0 || c.score < 65) || [];

  // Prefer the real, this-attempt topic accuracy + AI analysis when present.
  // Older cached QuizResults (generated before this feature) won't have
  // these fields, so everything below falls back gracefully.
  const topicPerformance = result.topicPerformance || [];
  const weakestTopicName =
    result.aiRecommendation?.weakestTopic ||
    (topicPerformance.length > 0 ? topicPerformance[0].conceptName : weakPerformers[0]?.conceptName);

  return (
    <SlideUp className="p-8 space-y-6 max-w-2xl mx-auto text-center">
      <Card className="p-8 space-y-6 bg-paper-raised border border-line/70 rounded-2xl shadow-card">
        <div className="w-16 h-16 bg-signal-soft/60 text-signal-strong rounded-full flex items-center justify-center mx-auto border border-signal/20 shadow-glow-signal">
          <Trophy className="w-8 h-8" />
        </div>

        <div>
          <span className="text-xs font-mono text-ink-faint uppercase tracking-wider">
            Adaptive Checkpoint Complete
          </span>
          <h2 className="font-display text-4xl font-semibold text-ink mt-1">
            <AnimatedNumber value={result.score} suffix="%" /> Accuracy Score
          </h2>
          <p className="text-xs text-ink-faint mt-1">
            Answered {result.correctCount} of {result.totalQuestions} questions correctly. Concept mastery state updated.
          </p>
        </div>

        {/* Rationale Banner */}
        {result.adaptationRationale && (
          <div className="p-3 bg-paper-sunken/60 rounded-xl border border-line/60 text-xs font-mono text-ink-soft text-left">
            <span className="font-semibold text-indigo-strong">Telemetry: </span>
            {result.adaptationRationale}
          </div>
        )}

        {/* AI WEAK-AREA ANALYSIS (grounded in this attempt's real topic accuracy + PDF excerpts) */}
        <div className="p-4 bg-indigo-soft/30 border border-indigo/40 rounded-xl text-left space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Brain className="w-4 h-4 text-indigo" />
              <span className="text-xs font-mono font-bold text-indigo-strong tracking-wider uppercase">
                AI Study Analysis
              </span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 bg-indigo-soft text-indigo-strong rounded-full border border-indigo/20 font-semibold">
              {result.aiRecommendation?.isLiveAI ? 'AI Generated' : 'Data-Derived'}
            </span>
          </div>
          {result.aiRecommendation ? (
            <>
              <p className="text-xs text-ink-soft leading-relaxed">{result.aiRecommendation.summary}</p>
              {result.aiRecommendation.recommendations.length > 0 && (
                <ul className="text-xs text-ink-soft leading-relaxed list-disc pl-4 space-y-1 pt-1">
                  {result.aiRecommendation.recommendations.map((rec, idx) => (
                    <li key={idx}>{rec}</li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <p className="text-xs text-ink-soft leading-relaxed">
              {weakPerformers.length > 0 ? (
                <>
                  Mastery updated: <strong className="text-ink font-semibold">"{weakPerformers[0].conceptName}"</strong> calibrated by {weakPerformers[0].delta > 0 ? `+${weakPerformers[0].delta}%` : `${weakPerformers[0].delta}%`} to {weakPerformers[0].score}%.
                </>
              ) : (
                <>Mastery scores successfully updated across all evaluated concepts.</>
              )}
            </p>
          )}
        </div>

        {/* Topic-Wise Performance (real accuracy for this attempt) */}
        {topicPerformance.length > 0 && (
          <div className="text-left border-t border-line/60 pt-4">
            <TopicPerformanceTable performance={topicPerformance} />
          </div>
        )}

        {/* Concept Performance Table (cumulative mastery recalibration) */}
        {result.conceptPerformance && result.conceptPerformance.length > 0 && (
          <div className="text-left border-t border-line/60 pt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-ink-faint">
                Mastery Recalibration
              </h4>
              <span className="text-[11px] font-mono text-signal-strong font-medium">
                Live updates applied
              </span>
            </div>
            <ConceptPerformance performance={result.conceptPerformance} />
          </div>
        )}

        {/* DOWNSTREAM CONTINUITY: RECOMMENDED NEXT STEP */}
        <div className="p-5 bg-gradient-to-r from-indigo-soft/40 via-paper-raised to-paper-raised border border-indigo/30 rounded-xl text-left space-y-3">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-indigo" />
            <span className="text-xs font-mono font-semibold text-indigo-strong uppercase tracking-wider">
              ✦ Recommended Next Step
            </span>
          </div>

          {isHighScorer ? (
            <div>
              <h4 className="font-display text-base font-semibold text-ink">
                Advance to Open-Ended Synthesis Assessment
              </h4>
              <p className="text-xs text-ink-soft mt-0.5 leading-relaxed">
                Your multiple-choice accuracy demonstrates solid baseline recall. Now articulate the nuanced trade-offs in an open-ended response evaluated against our 5-dimension rubric.
              </p>
              <div className="pt-3 flex flex-wrap gap-2">
                <Link to={`/projects/${projectId}/assessment`}>
                  <Button variant="signal" size="sm" className="gap-1.5 font-semibold text-xs shadow-sm">
                    Start Open Assessment <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
                <Link to={`/projects/${projectId}/mastery`}>
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs font-mono">
                    <Layers className="w-3.5 h-3.5 text-indigo" /> View Concept Landscape
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div>
              <h4 className="font-display text-base font-semibold text-ink">
                Review {weakestTopicName || 'Identified Gaps'} with AI Tutor
              </h4>
              <p className="text-xs text-ink-soft mt-0.5 leading-relaxed">
                {result.aiRecommendation?.nextStep ||
                  `You had difficulty with ${weakestTopicName || 'key concepts'}. Review the grounded document chunks or ask the Tutor for a simplified analogy before retaking.`}
              </p>
              <div className="pt-3 flex flex-wrap gap-2">
                <Link to={`/projects/${projectId}/tutor?prompt=${encodeURIComponent(`Can you explain ${weakestTopicName || 'the concepts I missed'} in simpler terms and clarify where I might have gone wrong?`)}`}>
                  <Button variant="signal" size="sm" className="gap-1.5 font-semibold text-xs shadow-sm">
                    <Brain className="w-3.5 h-3.5" /> Ask AI Tutor to Explain <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
                <Link to={`/projects/${projectId}/materials`}>
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs font-mono">
                    Review Source Materials
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Action Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-line/60">
          <Button variant="outline" onClick={onRetake} className="gap-1.5 text-xs font-mono">
            <RefreshCw className="w-3.5 h-3.5" /> Retake Adaptive Quiz
          </Button>
          <Link to={`/projects/${projectId}/overview`}>
            <Button variant="ghost" className="gap-1.5 text-xs font-mono text-ink-soft hover:text-ink">
              Return to Overview <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </Card>
    </SlideUp>
  );
};
