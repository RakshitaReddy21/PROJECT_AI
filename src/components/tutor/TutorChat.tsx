import React, { useState, useRef, useEffect } from 'react';
import { TutorMessage, Citation } from '../../types';
import { ChatMessageBubble } from './ChatMessageBubble';
import { TutorSuggestions } from './TutorSuggestions';
import { AIThinkingIndicator } from './AIThinkingIndicator';
import { Send, Sparkles, RefreshCw, Bot } from 'lucide-react';
import { Button } from '../ui/Button';

export interface TutorChatProps {
  messages: TutorMessage[];
  onSendMessage: (text: string, actionType?: string) => Promise<void>;
  onCitationClick?: (citation: Citation) => void;
  isLoading?: boolean;
  initialPrompt?: string;
}

export const TutorChat: React.FC<TutorChatProps> = ({
  messages,
  onSendMessage,
  onCitationClick,
  isLoading,
  initialPrompt,
}) => {
  const [inputText, setInputText] = useState(initialPrompt || '');

  useEffect(() => {
    if (initialPrompt) {
      setInputText(initialPrompt);
    }
  }, [initialPrompt]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    const text = inputText;
    setInputText('');
    await onSendMessage(text);
  };

  const handleActionClick = async (actionType: string) => {
    if (isLoading) return;
    if (actionType === 'explain_simpler') {
      await onSendMessage('Could you explain this in simpler, intuitive terms with an analogy?', 'explain_simpler');
    } else if (actionType === 'give_example') {
      await onSendMessage('Can you give a concrete real-world implementation example of this concept?', 'give_example');
    } else if (actionType === 'test_me') {
      await onSendMessage('Can you give me a quick practice question to test my understanding of this topic?', 'test_me');
    } else if (actionType === 'continue') {
      await onSendMessage('Please elaborate further on the next logical concept in this study journey.', 'continue');
    } else if (actionType === 'show_search') {
      await onSendMessage('What exact search terms and vector chunks were queried for this answer?');
    } else if (actionType === 'ask_related') {
      await onSendMessage('What related topics from my uploaded materials can I ask about?');
    }
  };

  const lastMessage = messages[messages.length - 1];

  return (
    <div className="flex flex-col h-[calc(100vh-13rem)] bg-paper-raised border border-line/70 rounded-2xl shadow-card overflow-hidden">
      {/* Top Bar Header */}
      <div className="px-6 py-3.5 border-b border-line/60 bg-paper-sunken/40 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 bg-indigo-soft text-indigo-strong rounded-lg">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-display text-sm font-semibold text-ink">AI Learning Workspace Companion</h3>
            <p className="text-[10px] font-mono text-ink-faint">Grounded RAG Engine Active • Cross-Referencing Source Embeddings</p>
          </div>
        </div>
        <span className="px-2.5 py-1 text-[11px] font-mono bg-signal-soft text-signal-strong border border-signal/20 rounded-full font-semibold">
          Grounded Mode
        </span>
      </div>

      {/* Chat Messages Log */}
      <div className="flex-1 p-6 overflow-y-auto space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 text-ink-faint space-y-3">
            <div className="p-4 bg-indigo-soft/60 text-indigo-strong rounded-2xl shadow-inner">
              <Sparkles className="w-8 h-8" />
            </div>
            <div className="max-w-sm space-y-1">
              <h4 className="font-display text-base font-semibold text-ink">No conversation yet</h4>
              <p className="text-xs text-ink-faint leading-relaxed">
                Ask your first question about this project.
              </p>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <ChatMessageBubble
              key={msg.id}
              message={msg}
              onCitationClick={onCitationClick}
              onActionClick={handleActionClick}
            />
          ))
        )}

        {isLoading && <AIThinkingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Followups */}
      {lastMessage?.suggestedFollowups && lastMessage.suggestedFollowups.length > 0 && (
        <div className="px-6 border-t border-line/40 bg-paper-sunken/20">
          <TutorSuggestions
            suggestions={lastMessage.suggestedFollowups}
            onSelect={(prompt) => setInputText(prompt)}
          />
        </div>
      )}

      {/* Input Bar */}
      <form onSubmit={handleSend} className="p-4 border-t border-line/60 bg-paper-sunken/40 flex items-center gap-3">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Ask tutor a question about this project's materials..."
          className="flex-1 px-4 py-3 text-xs md:text-sm bg-paper-raised border border-line/80 rounded-xl text-ink focus:outline-none focus:border-indigo focus:ring-2 focus:ring-indigo-soft shadow-inner font-sans transition-all"
        />
        <Button variant="primary" type="submit" disabled={!inputText.trim() || isLoading} className="px-5 py-3 font-semibold shadow-sm">
          <Send className="w-4 h-4 mr-1.5" /> Ask
        </Button>
      </form>
    </div>
  );
};
