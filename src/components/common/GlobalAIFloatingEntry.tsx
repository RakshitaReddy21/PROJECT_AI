import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, Brain, ArrowRight, X } from 'lucide-react';
import { appStorage } from '../../services/storage/localStorageStore';
import { authService } from '../../services/auth.service';
import { motion, AnimatePresence } from '../motion';

export const GlobalAIFloatingEntry: React.FC = () => {
  const [isHovered, setIsHovered] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [quickQuestion, setQuickQuestion] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  const user = authService.getCurrentUser();
  const allProjects = appStorage.get('projects');
  const userProjects = user ? allProjects.filter((p) => p.userId === user.id) : [];
  const projectMatch = location.pathname.match(/projects\/([^/]+)/);
  const matchedProject = userProjects.find((p) => p.id === projectMatch?.[1]);
  const activeProject = matchedProject || userProjects[0] || null;
  const activeProjectId = activeProject ? activeProject.id : null;

  const handleOpenTutor = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsOpen(false);
    if (activeProjectId) {
      navigate(`/projects/${activeProjectId}/tutor`);
    } else {
      navigate('/spaces');
    }
  };

  return (
    <>
      {/* Floating Widget Trigger */}
      <div className="fixed bottom-6 right-6 z-40">
        <div className="relative">
          {/* Tooltip on Hover when drawer is closed */}
          {isHovered && !isOpen && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-[#11141F] text-ink text-xs font-mono font-medium rounded-lg shadow-float whitespace-nowrap flex items-center gap-1.5 pointer-events-none border border-line"
            >
              <Sparkles className="w-3.5 h-3.5 text-signal-strong" />
              <span>Ask your learning companion</span>
            </motion.div>
          )}

          <motion.button
            onClick={() => setIsOpen(!isOpen)}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            whileHover={{ scale: 1.08, y: -2 }}
            whileTap={{ scale: 0.92 }}
            transition={{ duration: 0.2 }}
            aria-label="Open AI Learning Companion"
            className={`w-13 h-13 p-3.5 rounded-full shadow-float flex items-center justify-center transition-colors ${
              isOpen
                ? 'bg-ink text-paper rotate-90 border border-line'
                : 'bg-gradient-to-tr from-signal-strong to-signal text-white shadow-glow-signal'
            }`}
          >
            {isOpen ? <X className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
          </motion.button>
        </div>
      </div>

      {/* Quick Companion Drawer / Popover */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.25, ease: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
            className="fixed bottom-22 right-6 z-40 w-80 md:w-96 bg-paper-raised border border-line rounded-2xl shadow-float p-5"
          >
            <div className="flex items-start justify-between pb-3 border-b border-line/60">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-signal-soft text-signal-strong rounded-xl border border-signal/20">
                  <Brain className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-display text-sm font-semibold text-ink">Aurelia AI Companion</h4>
                  <p className="text-[10px] font-mono text-signal-strong">
                    Context: {activeProject ? activeProject.title : 'All Subjects'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-ink-faint hover:text-ink p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-3 space-y-2">
              <p className="text-xs text-ink-soft leading-relaxed">
                Have a question about your study materials or need a quick concept refresher?
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {activeProject ? (
                  <>
                    <button
                      onClick={() => {
                        navigate(`/projects/${activeProjectId}/tutor`);
                        setIsOpen(false);
                      }}
                      className="text-[11px] font-mono bg-paper-sunken hover:bg-line text-ink px-2.5 py-1 rounded-md border border-line transition-colors"
                    >
                      Ask Tutor
                    </button>
                    <button
                      onClick={() => {
                        navigate(`/projects/${activeProjectId}/quiz`);
                        setIsOpen(false);
                      }}
                      className="text-[11px] font-mono bg-indigo-soft text-indigo-strong hover:bg-indigo-soft/80 px-2.5 py-1 rounded-md border border-indigo/20 transition-colors"
                    >
                      Practice Quiz
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      navigate('/spaces');
                      setIsOpen(false);
                    }}
                    className="text-[11px] font-mono bg-paper-sunken hover:bg-line text-ink px-2.5 py-1 rounded-md border border-line transition-colors"
                  >
                    Explore Subject Spaces
                  </button>
                )}
              </div>
            </div>

            <form onSubmit={handleOpenTutor} className="mt-2 pt-2 border-t border-line/60 flex gap-2">
              <input
                type="text"
                placeholder="Ask anything about your materials..."
                value={quickQuestion}
                onChange={(e) => setQuickQuestion(e.target.value)}
                className="flex-1 px-3 py-1.5 text-xs bg-paper-sunken border border-line rounded-lg text-ink focus:outline-none focus:border-ink-soft"
              />
              <button
                type="submit"
                className="p-2 bg-signal text-white rounded-lg hover:bg-signal-strong transition-colors"
              >
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
