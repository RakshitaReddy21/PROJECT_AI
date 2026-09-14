import React, { useState } from 'react';
import { Concept } from '../../types';
import { Card } from '../ui/Card';
import { MasteryStatusBadge } from './MasteryStatusBadge';
import { TrendingUp, TrendingDown, Minus, Sparkles, Clock, AlertTriangle } from 'lucide-react';

function formatRelativeTime(dateStr?: string): string {
  if (!dateStr) return 'Recent';
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export interface ConceptCardProps {
  concept: Concept;
  onClick?: () => void;
}

export const ConceptCard: React.FC<ConceptCardProps> = ({ concept, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative group"
    >
      <Card
        onClick={onClick}
        className={`p-4 bg-white border border-[#F1E8E3] rounded-xl transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-float ${
          onClick ? 'cursor-pointer' : ''
        }`}
      >
        <div className="flex items-start justify-between gap-3 mb-2">
          <div>
            <span className="text-[10px] font-mono text-ink-faint uppercase tracking-wider font-semibold">
              {concept.category}
            </span>
            <h4 className="font-display text-sm font-semibold text-[#292524] leading-snug group-hover:text-[#E9825B] transition-colors">
              {concept.name}
            </h4>
          </div>
          <MasteryStatusBadge level={concept.masteryLevel} score={concept.score} />
        </div>

        <p className="text-xs text-ink-soft line-clamp-2 leading-relaxed mb-3">
          {concept.definition}
        </p>

        {/* Dynamic Hover Popover Breakdown Details */}
        {isHovered ? (
          <div className="mt-2 p-2.5 bg-[#FFF0E8] border border-[#F8C9B0] rounded-lg text-[11px] font-mono space-y-1.5 animate-fade-in">
            <div className="flex items-center justify-between text-[#E9825B] font-semibold">
              <span className="flex items-center gap-1">
                {concept.trend === 'down' ? (
                  <>
                    <TrendingDown className="w-3 h-3 text-rust" />
                    <span className="text-rust">Trend: Regressing ↓</span>
                  </>
                ) : concept.trend === 'up' ? (
                  <>
                    <TrendingUp className="w-3 h-3 text-signal" />
                    <span className="text-signal-strong">Trend: Improving ↑</span>
                  </>
                ) : (
                  <>
                    <Minus className="w-3 h-3 text-ink-faint" />
                    <span className="text-ink-soft">Trend: Stable →</span>
                  </>
                )}
              </span>
              <span>Score: {concept.score}%</span>
            </div>
            <div className="flex items-center justify-between text-ink-faint text-[10px]">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" /> Assessed {formatRelativeTime(concept.lastAssessedAt)}
              </span>
              {concept.isWeakness ? (
                <span className="text-[#D97706] flex items-center gap-1 font-semibold">
                  <AlertTriangle className="w-3 h-3 text-[#F59E0B]" /> Needs Attention
                </span>
              ) : (
                <span className="text-ink-faint flex items-center gap-1">
                  Confidence: <span className="text-ink capitalize">{concept.confidence || (concept.score >= 75 ? 'high' : 'medium')}</span>
                </span>
              )}
            </div>
          </div>
        ) : (
          concept.changeReason && (
            <div className="flex items-center text-[11px] text-[#059669] bg-[#E6F4EA] px-2.5 py-1 rounded gap-1.5 font-mono">
              <Sparkles className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{concept.changeReason}</span>
            </div>
          )
        )}
      </Card>
    </div>
  );
};
