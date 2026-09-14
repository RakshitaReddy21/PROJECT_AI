import React, { useState } from 'react';
import { TutorMessage, Citation } from '../../types';
import { Sparkles, FileText, Search, HelpCircle, Lightbulb, CheckCircle2, ArrowRight } from 'lucide-react';
import { motion } from '../motion';

export interface ChatMessageBubbleProps {
  message: TutorMessage;
  onCitationClick?: (citation: Citation) => void;
  onActionClick?: (actionType: string) => void;
}

export const ChatMessageBubble: React.FC<ChatMessageBubbleProps> = ({
  message,
  onCitationClick,
  onActionClick,
}) => {
  const isUser = message.sender === 'user';
  const [hoveredCitationId, setHoveredCitationId] = useState<string | null>(null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} my-4 group`}
    >
      <div className="flex items-center space-x-1.5 mb-1.5 text-[11px] text-ink-faint font-mono">
        {!isUser && (
          <span className="flex items-center gap-1 text-indigo-strong font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-indigo" /> AI Grounded Companion
          </span>
        )}
        <span>{new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
      </div>

      <div
        className={`max-w-2xl rounded-2xl p-5 shadow-card border transition-all ${
          isUser
            ? 'bg-ink text-paper border-ink rounded-tr-none'
            : message.isUnsupported
            ? 'bg-amber-soft/40 border-amber/30 text-ink rounded-tl-none'
            : 'bg-paper-raised border-line/70 text-ink rounded-tl-none hover:shadow-panel'
        }`}
      >
        {/* GROUNDED BADGE */}
        {!isUser && !message.isUnsupported && (
          <div className="mb-3.5 flex items-center justify-between pb-2.5 border-b border-line/40">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono font-medium rounded-md bg-signal-soft text-signal-strong border border-signal/20">
              <CheckCircle2 className="w-3.5 h-3.5 text-signal" /> Grounded in project materials
            </span>
            {message.citations.length > 0 && (
              <span className="text-[10px] font-mono text-ink-faint">
                {message.citations.length} direct citation{message.citations.length > 1 ? 's' : ''} verified
              </span>
            )}
          </div>
        )}

        {/* CALM UNSUPPORTED QUESTIONS NOTICE */}
        {!isUser && message.isUnsupported && (
          <div className="mb-4 p-3.5 bg-paper-raised border border-amber/40 rounded-xl space-y-2">
            <div className="flex items-center space-x-2 text-amber-strong text-xs font-semibold">
              <HelpCircle className="w-4 h-4 flex-shrink-0 text-amber" />
              <span>⚠ Insufficient Document Evidence</span>
            </div>
            <p className="text-xs text-ink-soft leading-relaxed">
              I couldn't find enough evidence in your learning materials to answer this confidently.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                onClick={() => onActionClick?.('show_search')}
                className="px-2.5 py-1 text-[11px] font-mono bg-paper-sunken border border-line/60 text-ink-soft rounded-md hover:bg-line transition-colors flex items-center gap-1"
              >
                <Search className="w-3 h-3" /> Show what I searched
              </button>
              <button
                onClick={() => onActionClick?.('ask_related')}
                className="px-2.5 py-1 text-[11px] font-mono bg-paper-sunken border border-line/60 text-ink-soft rounded-md hover:bg-line transition-colors flex items-center gap-1"
              >
                <Lightbulb className="w-3 h-3 text-amber" /> Ask something related to your materials
              </button>
            </div>
          </div>
        )}

        {/* Message Text */}
        <div className="text-sm leading-relaxed whitespace-pre-wrap font-sans">
          {message.text}
        </div>

        {/* FLOATING CITATION CHIPS & EXPANDABLE HOVER PREVIEW */}
        {!isUser && message.citations.length > 0 && (
          <div className="mt-4 pt-3 border-t border-line/60">
            <p className="text-[10px] font-mono text-ink-faint uppercase tracking-wider mb-2 flex items-center gap-1 font-semibold">
              <FileText className="w-3 h-3 text-indigo" /> Source Material Citations ({message.citations.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {message.citations.map((cit) => (
                <div key={cit.id} className="relative">
                  <button
                    onClick={() => onCitationClick?.(cit)}
                    onMouseEnter={() => setHoveredCitationId(cit.id)}
                    onMouseLeave={() => setHoveredCitationId(null)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-soft/60 hover:bg-indigo-soft border border-indigo/30 rounded-full text-xs font-mono text-indigo-strong transition-all shadow-sm"
                  >
                    <FileText className="w-3 h-3" />
                    <span>{cit.materialTitle} • p.14</span>
                  </button>

                  {/* CITATION FLOATING HOVER PREVIEW POPOVER */}
                  {hoveredCitationId === cit.id && (
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.2 }}
                      className="absolute left-0 bottom-full mb-2 w-72 p-3 bg-[#11141F] border border-indigo/40 rounded-xl shadow-float z-50 pointer-events-none"
                    >
                      <div className="flex items-center justify-between text-[10px] font-mono text-indigo-strong font-semibold mb-1">
                        <span className="truncate">{cit.materialTitle}</span>
                        <span>Chunk #{cit.chunkIndex}</span>
                      </div>
                      <p className="text-[11px] text-ink-soft italic leading-snug">
                        "{cit.excerpt}"
                      </p>
                    </motion.div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CONTEXTUAL RESPONSE ACTION PILLS */}
        {!isUser && !message.isUnsupported && (
          <div className="mt-4 pt-3 border-t border-line/40 flex flex-wrap gap-2 text-xs font-mono">
            <button
              onClick={() => onActionClick?.('explain_simpler')}
              className="px-2.5 py-1 bg-paper-sunken/80 hover:bg-paper-sunken border border-line/60 rounded-lg text-ink-soft hover:text-ink transition-colors flex items-center gap-1"
            >
              💡 Explain simpler
            </button>
            <button
              onClick={() => onActionClick?.('give_example')}
              className="px-2.5 py-1 bg-paper-sunken/80 hover:bg-paper-sunken border border-line/60 rounded-lg text-ink-soft hover:text-ink transition-colors flex items-center gap-1"
            >
              📝 Give example
            </button>
            <button
              onClick={() => onActionClick?.('test_me')}
              className="px-2.5 py-1 bg-paper-sunken/80 hover:bg-paper-sunken border border-line/60 rounded-lg text-ink-soft hover:text-ink transition-colors flex items-center gap-1"
            >
              🎯 Test me
            </button>
            <button
              onClick={() => onActionClick?.('continue')}
              className="px-2.5 py-1 bg-paper-sunken/80 hover:bg-paper-sunken border border-line/60 rounded-lg text-ink-soft hover:text-ink transition-colors flex items-center gap-1"
            >
              ➡️ Continue
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};
