import React, { useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import { Concept } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ProgressBar } from '../../components/ui/ProgressBar';
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  HelpCircle,
  BookOpen,
  ArrowRight,
  Search,
  Layers,
  AlertTriangle,
  CheckCircle2,
  GitBranch,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ProjectMastery: React.FC = () => {
  const { project, concepts, materials } = useProject();
  const [selectedConcept, setSelectedConcept] = useState<Concept | null>(concepts[0] || null);
  const [hoveredConcept, setHoveredConcept] = useState<Concept | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [statusBucket, setStatusBucket] = useState<'all' | 'strong' | 'improving' | 'stable' | 'needs_attention'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  if (!project) return null;

  const categories = Array.from(new Set(concepts.map((c) => c.category)));

  const filteredConcepts = concepts.filter((c) => {
    const matchesCat = filterCategory === 'all' || c.category === filterCategory;
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.definition.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusBucket === 'all' ||
      (statusBucket === 'strong' && c.score >= 80) ||
      (statusBucket === 'improving' && c.score >= 65 && c.score < 80) ||
      (statusBucket === 'stable' && c.score >= 50 && c.score < 65) ||
      (statusBucket === 'needs_attention' && c.score < 50);
    return matchesCat && matchesSearch && matchesStatus;
  });

  const activeDetail = hoveredConcept || selectedConcept;

  return (
    <div className="space-y-8 animate-fade-in max-w-6xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-line">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-[10px] font-mono text-signal-strong font-semibold uppercase tracking-wider bg-signal-soft px-2.5 py-0.5 rounded-full">
              Dynamic Cognitive State
            </span>
            <span className="text-xs font-mono text-ink-faint">
              {concepts.length} Concepts Tracked
            </span>
          </div>
          <h2 className="font-display text-2xl md:text-3xl font-semibold text-ink">
            Concept Mastery & Knowledge Landscape
          </h2>
          <p className="text-xs text-ink-faint mt-1">
            Explore hierarchical concept dependencies, real-time confidence scores, and targeted mastery intervention paths.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/projects/${project.id}/quiz`)}
            className="gap-1.5 text-xs font-mono"
          >
            <HelpCircle className="w-3.5 h-3.5 text-signal" /> Run Mastery Check
          </Button>
          <Button
            variant="signal"
            size="sm"
            onClick={() => navigate(`/projects/${project.id}/tutor`)}
            className="gap-1.5 text-xs font-mono"
          >
            <Brain className="w-3.5 h-3.5" /> Tutor Study Session
          </Button>
        </div>
      </div>

      {/* CONCEPT LANDSCAPE HIERARCHY TREE VIEW */}
      {concepts.length === 0 ? (
        <Card className="p-8 text-center bg-paper-raised border border-line/70 rounded-2xl shadow-card space-y-3">
          <Brain className="w-10 h-10 text-indigo/50 mx-auto" />
          <h3 className="font-display text-lg font-semibold text-ink">No concepts indexed yet</h3>
          <p className="text-xs text-ink-faint max-w-md mx-auto leading-relaxed">
            Upload study materials for this project to automatically extract and map concept mastery tree.
          </p>
          <Button variant="signal" size="sm" onClick={() => navigate(`/projects/${project.id}/materials`)}>
            Upload Study Materials
          </Button>
        </Card>
      ) : (
        <div className="p-6 bg-paper-raised border border-line/70 rounded-2xl shadow-card space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-line/60 pb-3">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-indigo-soft text-indigo-strong rounded-lg">
              <GitBranch className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display text-base font-semibold text-ink">
                Hierarchical Concept Landscape
              </h3>
              <p className="text-[11px] font-mono text-ink-faint">
                Knowledge graph representation: Root Subject Domain → Architectural Layers → Sub-topics
              </p>
            </div>
          </div>
          <span className="text-xs font-mono text-indigo-strong bg-indigo-soft px-2.5 py-1 rounded-full font-semibold">
            {project.title} Root
          </span>
        </div>

        {/* Visual Relational Tree */}
        <div className="bg-paper-sunken/60 rounded-xl p-6 border border-line/60 overflow-x-auto">
          <div className="font-mono text-xs space-y-3 min-w-[500px]">
            {/* Root Node */}
            <div className="flex items-center space-x-3 text-ink font-semibold">
              <span className="w-3 h-3 rounded-full bg-signal ring-4 ring-signal-soft" />
              <span className="bg-paper-raised px-3 py-1.5 rounded-lg border border-line shadow-sm font-display text-sm">
                {project.title}
              </span>
              <span className="text-[11px] font-mono text-signal-strong bg-signal-soft px-2 py-0.5 rounded">
                Avg. {project.masteryScore}% Mastery
              </span>
            </div>

            {/* Tree Branch Items */}
            <div className="pl-6 space-y-3 border-l-2 border-dashed border-line ml-1.5 mt-2">
              {concepts.map((concept, idx) => {
                const isSelected = activeDetail?.id === concept.id;
                const isLast = idx === concepts.length - 1;

                return (
                  <div
                    key={concept.id}
                    onMouseEnter={() => setHoveredConcept(concept)}
                    onMouseLeave={() => setHoveredConcept(null)}
                    onClick={() => setSelectedConcept(concept)}
                    className="flex items-center group cursor-pointer"
                  >
                    {/* Connecting line */}
                    <span className="w-6 border-b border-line -ml-6 mr-3 text-ink-faint">
                      {isLast ? '└' : '├'}─
                    </span>

                    {/* Node pill */}
                    <div
                      className={`flex items-center justify-between gap-4 px-4 py-2 rounded-xl border transition-all duration-150 ${
                        isSelected
                          ? 'bg-paper-raised border-indigo shadow-float scale-[1.02]'
                          : 'bg-paper-raised/80 border-line hover:border-ink-soft hover:bg-paper-raised'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            concept.score >= 80
                              ? 'bg-signal'
                              : concept.score >= 70
                              ? 'bg-indigo'
                              : 'bg-amber'
                          }`}
                        />
                        <span className="font-sans font-semibold text-xs text-ink group-hover:text-indigo">
                          {concept.name}
                        </span>
                        <span className="text-[10px] font-mono text-ink-faint bg-paper-sunken px-2 py-0.5 rounded">
                          {concept.category}
                        </span>
                      </div>

                      <div className="flex items-center space-x-3 text-xs font-mono">
                        {/* Trend badge */}
                        <div className="flex items-center gap-0.5 text-[11px]">
                          {concept.trend === 'up' && (
                            <span className="text-signal flex items-center">
                              <TrendingUp className="w-3 h-3 mr-0.5" /> +{concept.recentChange || 6}%
                            </span>
                          )}
                          {concept.trend === 'down' && (
                            <span className="text-rust flex items-center">
                              <TrendingDown className="w-3 h-3 mr-0.5" /> {concept.recentChange || -4}%
                            </span>
                          )}
                          {(!concept.trend || concept.trend === 'neutral') && (
                            <span className="text-ink-faint flex items-center">
                              <Minus className="w-3 h-3 mr-0.5" /> 0%
                            </span>
                          )}
                        </div>

                        {/* Score pill */}
                        <span
                          className={`font-semibold px-2 py-0.5 rounded text-xs ${
                            concept.score >= 80
                              ? 'bg-signal-soft text-signal-strong'
                              : concept.score >= 70
                              ? 'bg-indigo-soft text-indigo-strong'
                              : 'bg-amber-soft text-amber'
                          }`}
                        >
                          {concept.score}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      )}

      {/* SPLIT VIEW: CONCEPT CARDS GRID + FLOATING DETAIL PANEL */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Concepts Grid (2 Cols on lg) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-line">
            <h3 className="font-sans text-sm font-semibold text-ink uppercase tracking-wider font-mono">
              Individual Concept Cards ({filteredConcepts.length})
            </h3>

            {/* Filter controls */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3 h-3 text-ink-faint absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter concepts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-7 pr-2.5 py-1 text-xs bg-paper-sunken border border-line rounded-md text-ink w-32 md:w-36 focus:outline-none"
                />
              </div>
              <select
                value={statusBucket}
                onChange={(e) => setStatusBucket(e.target.value as any)}
                className="px-2 py-1 text-xs bg-paper-sunken border border-line rounded-md text-ink focus:outline-none font-mono"
              >
                <option value="all">All Statuses ({concepts.length})</option>
                <option value="strong">Strong ≥80% ({concepts.filter((c) => c.score >= 80).length})</option>
                <option value="improving">Improving 65-79% ({concepts.filter((c) => c.score >= 65 && c.score < 80).length})</option>
                <option value="stable">Stable 50-64% ({concepts.filter((c) => c.score >= 50 && c.score < 65).length})</option>
                <option value="needs_attention">Needs Attention &lt;50% ({concepts.filter((c) => c.score < 50).length})</option>
              </select>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-2 py-1 text-xs bg-paper-sunken border border-line rounded-md text-ink focus:outline-none font-mono"
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredConcepts.map((concept) => {
              const isSelected = activeDetail?.id === concept.id;
              return (
                <div
                  key={concept.id}
                  onClick={() => setSelectedConcept(concept)}
                  onMouseEnter={() => setHoveredConcept(concept)}
                  onMouseLeave={() => setHoveredConcept(null)}
                  className="cursor-pointer"
                >
                  <Card
                    className={`p-5 bg-paper-raised border rounded-xl transition-all duration-200 hover:-translate-y-1 hover:shadow-float ${
                      isSelected ? 'border-indigo shadow-float ring-2 ring-indigo-soft' : 'border-line/70'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <span className="text-[10px] font-mono uppercase text-ink-faint">
                          {concept.category}
                        </span>
                        <h4 className="font-display text-sm font-semibold text-ink leading-snug">
                          {concept.name}
                        </h4>
                      </div>
                      <div className="text-right">
                        <span className="text-base font-display font-semibold text-indigo-strong">
                          {concept.score}%
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-ink-soft line-clamp-2 leading-relaxed mb-3">
                      {concept.definition}
                    </p>

                    <div className="space-y-2 pt-2 border-t border-line/60">
                      <ProgressBar value={concept.score} size="xs" variant="indigo" />

                      <div className="flex items-center justify-between text-[10px] font-mono text-ink-faint pt-1">
                        <span className="capitalize">
                          Level: <strong className="text-ink">{concept.masteryLevel}</strong>
                        </span>
                        <span>Confidence: {concept.confidence || 'High'}</span>
                      </div>
                    </div>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>

        {/* FLOATING CONCEPT DETAIL PANEL (Right Column) */}
        <div className="space-y-4">
          <h3 className="font-sans text-sm font-semibold text-ink uppercase tracking-wider font-mono">
            Concept Diagnostics Panel
          </h3>

          {activeDetail ? (
            <div className="p-6 bg-paper-raised border border-line rounded-2xl shadow-card space-y-5 sticky top-20 animate-fade-in">
              {/* Header */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono text-indigo-strong uppercase font-semibold bg-indigo-soft px-2 py-0.5 rounded">
                    {activeDetail.category}
                  </span>
                  <span className="text-xs font-mono text-ink-faint">
                    Assessed {new Date(activeDetail.lastAssessedAt).toLocaleDateString()}
                  </span>
                </div>
                <h3 className="font-display text-xl font-semibold text-ink mt-1">
                  {activeDetail.name}
                </h3>
              </div>

              {/* Score & Confidence */}
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-paper-sunken/60 rounded-xl border border-line/60">
                <div>
                  <span className="text-[10px] font-mono text-ink-faint uppercase font-semibold">
                    Mastery Score
                  </span>
                  <div className="text-2xl font-display font-semibold text-signal-strong">
                    {activeDetail.score}%
                  </div>
                  <span className="text-[10px] font-mono text-ink-faint capitalize">
                    {activeDetail.masteryLevel}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-ink-faint uppercase font-semibold">
                    Confidence Metric
                  </span>
                  <div className="text-2xl font-display font-semibold text-ink capitalize">
                    {activeDetail.confidence || 'High'}
                  </div>
                  <span className="text-[10px] font-mono text-signal-strong flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Grounded Evidence
                  </span>
                </div>
              </div>

              {/* Definition */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono uppercase text-ink-faint font-semibold">
                  Canonical Definition
                </span>
                <p className="text-xs text-ink-soft leading-relaxed bg-paper-sunken/40 p-3 rounded-lg border border-line/50">
                  {activeDetail.definition}
                </p>
              </div>

              {/* Recent Change Rationale */}
              {activeDetail.changeReason && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono uppercase text-ink-faint font-semibold">
                    Why Mastery Score Changed
                  </span>
                  <p className="text-xs text-ink-soft leading-relaxed p-3 bg-amber-soft/20 border border-amber/20 rounded-lg">
                    {activeDetail.changeReason}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 border-t border-line/60 space-y-2">
                <Button
                  variant="signal"
                  className="w-full justify-center gap-2 text-xs font-semibold"
                  onClick={() => navigate(`/projects/${project.id}/tutor`)}
                >
                  <Brain className="w-3.5 h-3.5" /> Ask Tutor About {activeDetail.name}
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-center gap-2 text-xs font-mono"
                  onClick={() => navigate(`/projects/${project.id}/quiz`)}
                >
                  <HelpCircle className="w-3.5 h-3.5 text-signal" /> Practice Quiz on this Topic
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center bg-paper-raised border border-line rounded-2xl text-xs text-ink-faint">
              Hover or click a concept to inspect detailed telemetry.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
