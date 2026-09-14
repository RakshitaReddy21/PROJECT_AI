import React, { useState } from 'react';
import { Recommendation } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  ArrowRight,
  Lightbulb,
  CheckCircle,
  FileText,
  Brain,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Target,
  Zap,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export interface RecommendationCardProps {
  recommendation: Recommendation;
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({ recommendation }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const iconMap = {
    review_concept: Lightbulb,
    take_quiz: CheckCircle,
    upload_material: FileText,
    complete_assessment: Brain,
  };

  const Icon = iconMap[recommendation.type] || Lightbulb;

  const priorityVariant = {
    high: 'rust',
    medium: 'amber',
    low: 'neutral',
  }[recommendation.priority] as 'rust' | 'amber' | 'neutral';

  return (
    <Card className="p-5 bg-white border border-[#F1E8E3] rounded-xl transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-float border-l-4 border-l-[#F29B73] group">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-[#FFF0E8] text-[#E9825B] rounded-lg">
            <Icon className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-ink-faint uppercase tracking-wider font-semibold">
              {recommendation.projectTitle}
            </span>
            <h4 className="font-display text-sm font-semibold text-[#292524] group-hover:text-[#E9825B] transition-colors">
              {recommendation.title}
            </h4>
          </div>
        </div>
        <Badge variant={priorityVariant} size="sm" className="capitalize">
          {recommendation.priority} priority
        </Badge>
      </div>

      <p className="text-xs text-ink-soft mt-1 leading-relaxed">{recommendation.reason}</p>

      {/* Expandable "Why is Aurelia recommending this?" Inspector */}
      {isExpanded && (
        <div className="mt-3 p-3 bg-[#FFF8F5] rounded-xl border border-[#F1E8E3] text-xs font-mono space-y-2 animate-fade-in">
          <div className="flex items-center space-x-1.5 text-[#E9825B] font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-[#F29B73]" />
            <span className="text-[11px] uppercase tracking-wider">Aurelia Cognitive Signals</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
            <div className="p-2 bg-white border border-[#F1E8E3] rounded-lg">
              <span className="text-ink-faint block text-[10px] uppercase font-semibold">Cognitive Trigger</span>
              <span className="text-ink-soft">{recommendation.evidence || 'Pattern identified from recent study session'}</span>
            </div>
            <div className="p-2 bg-white border border-[#F1E8E3] rounded-lg">
              <span className="text-ink-faint block text-[10px] uppercase font-semibold">Learning Alignment</span>
              <span className="text-ink-soft">Direct prerequisite for core project learning goal</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] pt-1 px-1 text-ink-faint">
            <span className="flex items-center gap-1">
              <Target className="w-3 h-3 text-[#10B981]" /> Expected Gain: +10-15% mastery
            </span>
            <span className="flex items-center gap-1 text-[#E9825B] font-semibold">
              <Zap className="w-3 h-3 text-[#F59E0B]" /> High Retention Impact
            </span>
          </div>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs font-mono text-[#F29B73] hover:text-[#E9825B] inline-flex items-center gap-1 font-medium transition-colors"
        >
          <Brain className="w-3.5 h-3.5" />
          <span>Why is Aurelia recommending this?</span>
          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>

        <Link to={recommendation.actionUrl}>
          <Button variant="primary" size="sm" className="gap-1.5 font-semibold">
            Take Action
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </div>
    </Card>
  );
};
