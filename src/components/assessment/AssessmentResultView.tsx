import React from 'react';
import { AssessmentSubmission } from '../../types';
import { Card } from '../ui/Card';
import { FeedbackSection } from './FeedbackSection';
import { CheckCircle2, AlertCircle, ArrowLeft, Brain, Sparkles, HelpCircle, ArrowRight } from 'lucide-react';
import { Button } from '../ui/Button';
import { useNavigate } from 'react-router-dom';

export interface AssessmentResultViewProps {
  submission: AssessmentSubmission;
  onReset?: () => void;
}

export const AssessmentResultView: React.FC<AssessmentResultViewProps> = ({
  submission,
  onReset,
}) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Overview Score Card */}
      <Card className="p-6 bg-gradient-to-r from-[#FFF0E8] via-white to-white border border-[#F8C9B0] flex flex-col md:flex-row items-center justify-between gap-6 rounded-2xl shadow-sm">
        <div className="flex items-center space-x-5">
          <div className="w-16 h-16 bg-[#F29B73] text-white rounded-2xl flex flex-col items-center justify-center font-display font-bold text-2xl shadow-sm flex-shrink-0">
            <span>{submission.score}%</span>
            <span className="text-[9px] font-mono uppercase tracking-tight -mt-1 opacity-80">Score</span>
          </div>
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-[10px] font-mono text-[#E9825B] font-semibold uppercase tracking-wider bg-[#FFF0E8] px-2 py-0.5 rounded-full border border-[#F8C9B0]">
                AI Rubric Evaluation Complete
              </span>
              <span className="text-xs font-mono text-[#78716C]">
                {submission.rubricScores.length} Dimensions Assessed
              </span>
            </div>
            <h3 className="font-display text-xl font-semibold text-[#292524]">
              Synthesis & Mastery Assessment Result
            </h3>
            <p className="text-xs text-[#78716C] mt-1 max-w-xl leading-relaxed">
              {submission.overallFeedback}
            </p>
          </div>
        </div>

        {onReset && (
          <Button variant="outline" size="sm" onClick={onReset} className="whitespace-nowrap text-xs font-mono">
            <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Submit Another Draft
          </Button>
        )}
      </Card>

      {/* 5-Criteria Rubric Breakdown (PRD #22) */}
      <FeedbackSection rubricScores={submission.rubricScores} />

      {/* WHAT YOU EXPLAINED WELL vs WHAT YOU'RE MISSING (PRD #22) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Strengths */}
        <Card className="p-5 bg-[#E6F4EA]/40 border border-[#34A853]/30 rounded-xl space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-[#137333] font-mono flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-[#34A853]" />
            What You Explained Well
          </h4>
          <ul className="space-y-2 text-xs text-[#78716C]">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#34A853] mt-1.5 flex-shrink-0" />
              <span>
                Accurate mathematical and algorithmic distinction between bi-encoder pre-computed embeddings and cross-encoder full attention.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#34A853] mt-1.5 flex-shrink-0" />
              <span>
                Concrete analysis of real-world latency trade-offs (15-30ms single stage vs 100-250ms reranking).
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#34A853] mt-1.5 flex-shrink-0" />
              <span>
                Appropriate use of enterprise information retrieval benchmarks (MRR@10 and NDCG@5).
              </span>
            </li>
          </ul>
        </Card>

        {/* Areas for Improvement */}
        <Card className="p-5 bg-[#FFF0E8]/60 border border-[#F8C9B0] rounded-xl space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-[#E9825B] font-mono flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-[#E9825B]" />
            What You're Missing
          </h4>
          <ul className="space-y-2 text-xs text-[#78716C]">
            {submission.growthTips.map((tip, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E9825B] mt-1.5 flex-shrink-0" />
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* RECOMMENDED NEXT STEP (PRD #22) */}
      <Card className="p-5 bg-[#FFF0E8] border border-[#F8C9B0] rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-[#F29B73] text-white rounded-xl shadow-sm">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-[#E9825B] uppercase font-semibold">
              ✦ Recommended Next Step
            </span>
            <h4 className="font-display text-sm font-semibold text-[#292524]">
              Ask Tutor About Lexical Pre-filtering & Quantization
            </h4>
            <p className="text-xs text-[#78716C]">
              Deepen your understanding of hybrid BM25 pipelines to achieve complete concept mastery.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 flex-shrink-0">
          <Button
            variant="signal"
            size="sm"
            onClick={() => navigate(`/projects/${submission.projectId}/tutor`)}
            className="gap-1.5 text-xs font-semibold bg-[#F29B73] hover:bg-[#E9825B] text-white"
          >
            <Brain className="w-3.5 h-3.5" /> Ask AI Tutor <ArrowRight className="w-3 h-3" />
          </Button>
        </div>
      </Card>

      {/* Student Response Copy */}
      <Card className="p-5 bg-paper-sunken/50 border border-line/60 rounded-xl space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-[11px] font-semibold uppercase font-mono text-ink-faint">
            Your Submitted Response
          </h4>
          <span className="text-[10px] font-mono text-ink-faint">
            {submission.studentResponse.split(/\s+/).filter(Boolean).length} Words
          </span>
        </div>
        <p className="text-xs font-mono text-ink leading-relaxed whitespace-pre-wrap bg-paper-raised p-4 rounded-lg border border-line/60">
          {submission.studentResponse}
        </p>
      </Card>
    </div>
  );
};
