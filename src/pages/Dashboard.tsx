import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Project, Recommendation, ActivityItem, Concept } from '../types';
import { fetchProjectsApi } from '../api/projects';
import { fetchRecommendationsApi, fetchActivitiesApi, fetchGlobalAnalyticsApi } from '../api/analytics';
import { fetchConceptsApi } from '../api/mastery';
import { formatRelativeTime } from '../utils/date';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { RecommendationCard } from '../components/learning/RecommendationCard';
import { ActivityTimeline } from '../components/learning/ActivityTimeline';
import { ConceptCard } from '../components/learning/ConceptCard';
import { ProgressBar } from '../components/ui/ProgressBar';
import {
  PageTransition,
  StaggerContainer,
  StaggerItem,
  AnimatedNumber,
  MouseParallax,
  FloatingCard,
} from '../components/motion';
import {
  Sparkles,
  ArrowRight,
  BookOpen,
  Brain,
  Zap,
  Clock,
  TrendingUp,
  Flame,
  ChevronDown,
  ChevronUp,
  Target,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isHeroWhyExpanded, setIsHeroWhyExpanded] = useState(false);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [pData, rData, aData, gData] = await Promise.all([
          fetchProjectsApi(),
          fetchRecommendationsApi(),
          fetchActivitiesApi(),
          fetchGlobalAnalyticsApi(),
        ]);
        setProjects(pData);
        setRecommendations(rData);
        setActivities(aData);
        setAnalytics(gData);

        if (pData.length > 0) {
          const cData = await fetchConceptsApi(pData[0].id);
          setConcepts(cData);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  const getGreetingTime = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const activeProject = projects[0];
  const heroRecommendation = recommendations[0];
  const weakConcepts = concepts.filter((c) => c.score < 75);
  const projectLatestActivity = activeProject
    ? activities.find((a) => a.projectId === activeProject.id)
    : null;

  const journeySteps = [
    { label: 'Material', icon: BookOpen, done: !!activeProject && activeProject.materialCount > 0 },
    { label: 'Knowledge', icon: Zap, done: !!activeProject && activeProject.conceptCount > 0 },
    { label: 'Tutor', icon: Brain, done: activities.some((a) => a.type?.includes('tutor')) },
    { label: 'Quiz', icon: HelpCircle, done: activities.some((a) => a.type?.includes('quiz')) },
    { label: 'Mastery', icon: Target, done: !!activeProject && activeProject.masteryScore >= 60 },
    { label: 'Growth', icon: TrendingUp, done: !!analytics && analytics.masteryGain > 0 },
  ];

  return (
    <PageTransition className="space-y-8 max-w-6xl mx-auto pb-12">
      <StaggerContainer staggerDelay={0.1} baseDelay={0.05} className="space-y-8">
        {/* TOP GREETING HEADER */}
        <StaggerItem>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#F1E8E3]">
            <div>
              <h1 className="font-display text-3xl md:text-4xl font-semibold text-ink tracking-tight">
                {getGreetingTime()}, {user?.name ? user.name.split(' ')[0] : 'Learner'}
              </h1>
              <p className="text-xs text-ink-faint mt-1 font-sans">
                Your AI learning journey continues. Intelligently grounded & ready.
              </p>
            </div>

            <Link to="/spaces">
              <Button variant="primary" className="gap-2 font-semibold">
                <Sparkles className="w-4 h-4" /> Explore Subjects & Projects
              </Button>
            </Link>
          </div>
        </StaggerItem>

        {/* HERO SECTION: YOUR NEXT BEST ACTION + PARALLAX KNOWLEDGE VISUAL */}
        {heroRecommendation && (
          <StaggerItem>
            <Card className="p-7 bg-gradient-to-r from-[#FFEBE0] via-white to-white border border-[#FFC8B0] rounded-2xl shadow-panel relative overflow-hidden group">
              <div className="space-y-3">
                <div className="flex items-center space-x-2 px-3 py-1 bg-[#FFEBE0] border border-[#FFC8B0] rounded-full w-fit">
                  <Sparkles className="w-3.5 h-3.5 text-[#FF6B35]" />
                  <span className="text-xs font-mono font-semibold text-[#E85A2A] uppercase tracking-wider">
                    ✦ YOUR NEXT BEST ACTION
                  </span>
                </div>

                <h2 className="font-display text-xl md:text-2xl font-semibold text-[#1F1917] leading-tight">
                  {heroRecommendation.title}
                </h2>
                <p className="text-xs md:text-sm text-[#574E4A] leading-relaxed">
                  {heroRecommendation.reason}
                </p>

                {heroRecommendation.evidence && (
                  <div className="mt-3 p-3 bg-[#FFF8F5] rounded-lg border border-[#F1E8E3] text-xs font-mono text-[#78716C]">
                    <span className="font-semibold text-[#E9825B]">Context Rationale: </span>
                    {heroRecommendation.evidence}
                  </div>
                )}

                {/* Expandable Why Aurelia Recommending This */}
                {isHeroWhyExpanded && (
                  <div className="mt-4 p-3.5 bg-[#FFF8F5] rounded-xl border border-[#F1E8E3] text-xs font-mono space-y-2.5">
                    <div className="flex items-center space-x-1.5 text-[#E9825B] font-semibold">
                      <Sparkles className="w-3.5 h-3.5 text-[#F29B73]" />
                      <span className="text-[11px] uppercase tracking-wider">Cognitive Signals</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                      <div className="p-2.5 bg-white border border-[#F1E8E3] rounded-lg">
                        <span className="text-ink-faint block text-[10px] uppercase font-semibold">Mastery Baseline</span>
                        <span className="text-ink font-semibold">
                          {activeProject ? `${activeProject.masteryScore}% across ${concepts.length} concepts` : 'Baseline calibrating'}
                        </span>
                      </div>
                      <div className="p-2.5 bg-white border border-[#F1E8E3] rounded-lg">
                        <span className="text-ink-faint block text-[10px] uppercase font-semibold">Cognitive Trigger</span>
                        <span className="text-ink-soft">{heroRecommendation.evidence || 'Targeted retention interval reached'}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-1 flex items-center">
                  <button
                    type="button"
                    onClick={() => setIsHeroWhyExpanded(!isHeroWhyExpanded)}
                    className="text-xs font-mono text-[#F29B73] hover:text-[#E9825B] inline-flex items-center gap-1 font-medium transition-colors"
                  >
                    <Brain className="w-3.5 h-3.5" />
                    <span>Why is this recommended?</span>
                    {isHeroWhyExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                </div>

                <div className="pt-2 flex flex-wrap items-center gap-3">
                  {activeProject && (
                    <>
                      <Link to={`/projects/${activeProject.id}/tutor`}>
                        <Button variant="primary" size="md" className="gap-1.5 font-semibold shadow-md">
                          Continue Learning →
                        </Button>
                      </Link>
                      <Link to={`/projects/${activeProject.id}/materials`}>
                        <Button variant="outline" size="md" className="gap-1.5 font-medium shadow-sm">
                          <BookOpen className="w-4 h-4 text-[#F29B73]" /> Review Material
                        </Button>
                      </Link>
                      <Link to={`/projects/${activeProject.id}/quiz`}>
                        <Button variant="secondary" size="md" className="gap-1.5 font-semibold shadow-sm">
                          <Sparkles className="w-4 h-4 text-[#E9825B]" /> Take Quiz
                        </Button>
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </Card>
          </StaggerItem>
        )}

        {/* LEARNING PULSE VELOCITY BAR WITH ANIMATED NUMBERS */}
        <StaggerItem>
          <Card className="p-6 bg-white border border-[#F1E8E3] rounded-xl shadow-card">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#F1E8E3]">
              <div>
                <span className="text-[10px] font-mono text-[#E9825B] font-semibold uppercase tracking-wider">
                  Learning Momentum & Consistency
                </span>
                <h3 className="font-display text-lg font-semibold text-[#292524]">
                  7-Day Activity Velocity
                </h3>
              </div>
              <div className="flex items-center space-x-2 px-3 py-1 bg-[#FFEBE0] border border-[#FFC8B0] rounded-full text-[#E85A2A] font-mono text-xs font-semibold">
                <TrendingUp className="w-4 h-4 text-[#FF6B35]" />
                <span>
                  +<AnimatedNumber value={analytics?.learningVelocityPercent ?? 0} />% Learning Velocity
                </span>
              </div>
            </div>

            {/* Connected Pulse Nodes */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-5">
              <div className="space-y-1">
                <span className="text-xs font-mono text-ink-faint flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-[#FF6B35]" /> Active Streak
                </span>
                <div className="font-display text-2xl font-semibold text-[#1F1917] inline-block border-b-2 border-[#FFC8B0]">
                  <AnimatedNumber value={analytics?.activeStreakDays ?? 0} /> Days {analytics?.activeStreakDays ? '🔥' : ''}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-mono text-ink-faint">Total Study Time</span>
                <p className="font-display text-2xl font-semibold text-[#1F1917]">
                  <AnimatedNumber value={analytics?.hoursLearned ?? 0} /> Hours
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-mono text-ink-faint">Questions Answered</span>
                <p className="font-display text-2xl font-semibold text-[#1F1917]">
                  <AnimatedNumber value={analytics?.totalQuestionsAnswered ?? 0} /> Questions
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-mono text-ink-faint">Mastery Gain</span>
                <p className="font-display text-2xl font-semibold text-[#FF6B35]">
                  +<AnimatedNumber value={analytics?.masteryGain ?? 0} />% Gain
                </p>
              </div>
            </div>

            {/* Sparkline Daily Intensity */}
            <div className="mt-5 pt-4 border-t border-[#F4E3D8] flex items-center justify-between">
              <span className="text-xs font-mono text-ink-faint">Daily Intensity (Mon - Sun):</span>
              <div className="flex items-end space-x-2 h-8 font-mono text-xs text-[#E85A2A]">
                {(analytics?.weeklyIntensity || [
                  { day: 'Mon', count: 0, heightPercent: 15, title: 'Mon: 0 actions' },
                  { day: 'Tue', count: 0, heightPercent: 15, title: 'Tue: 0 actions' },
                  { day: 'Wed', count: 0, heightPercent: 15, title: 'Wed: 0 actions' },
                  { day: 'Thu', count: 0, heightPercent: 15, title: 'Thu: 0 actions' },
                  { day: 'Fri', count: 0, heightPercent: 15, title: 'Fri: 0 actions' },
                  { day: 'Sat', count: 0, heightPercent: 15, title: 'Sat: 0 actions' },
                  { day: 'Sun', count: 0, heightPercent: 15, title: 'Sun: 0 actions' },
                ]).map((w: any) => (
                  <div
                    key={w.day}
                    className={`w-5 rounded-t transition-all ${
                      w.count > 0
                        ? w.heightPercent > 70
                          ? 'bg-[#FF6B35] border border-[#E85A2A]'
                          : 'bg-[#FFC8B0] border border-[#FF6B35]'
                        : 'bg-[#FFEBE0] border border-[#FFC8B0]/50'
                    }`}
                    style={{ height: `${w.heightPercent}%` }}
                    title={w.title}
                  />
                ))}
              </div>
            </div>
          </Card>
        </StaggerItem>

        {/* STEPPER: CONTINUOUS LEARNING JOURNEY */}
        <StaggerItem>
          <Card className="p-5 bg-white border border-[#F4E3D8] rounded-xl shadow-card">
            <span className="text-[10px] font-mono text-ink-faint font-semibold uppercase tracking-wider mb-3 block">
              Continuous Learning Progression
            </span>
            <div className="flex items-center justify-between overflow-x-auto no-scrollbar py-2">
              {journeySteps.map((step, idx) => {
                const Icon = step.icon;
                return (
                  <React.Fragment key={step.label}>
                    <div className="flex flex-col items-center space-y-1.5 min-w-[70px]">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all ${
                          step.done
                            ? 'bg-[#FFEBE0] border-[#FFC8B0] text-[#E85A2A] shadow-sm font-semibold'
                            : 'bg-[#FFF8F4] border-[#F4E3D8] text-[#8C827A]'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className={`text-[11px] font-mono font-medium ${step.done ? 'text-[#1F1917]' : 'text-ink-faint'}`}>
                        {step.label}
                      </span>
                    </div>

                    {idx < journeySteps.length - 1 && (
                      <div className={`flex-1 h-0.5 min-w-[24px] mx-2 ${step.done ? 'bg-[#FF6B35]' : 'bg-[#F4E3D8]'}`} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </Card>
        </StaggerItem>

        {/* MAIN GRID: ACTIVE PROJECT & WEAK CONCEPTS */}
        <StaggerItem>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Active Project Card */}
            {activeProject ? (
              <FloatingCard className="lg:col-span-2 p-6 bg-white border border-[#F4E3D8] rounded-xl shadow-card flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-mono text-[#E85A2A] bg-[#FFEBE0] border border-[#FFC8B0] px-2.5 py-0.5 rounded font-semibold uppercase">
                      Active Learning Journey
                    </span>
                    <span className="text-xs font-mono text-ink-faint flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[#FF6B35]" />
                      Last studied {formatRelativeTime(projectLatestActivity?.timestamp || activeProject.updatedAt)}
                    </span>
                  </div>

                  <h3 className="font-display text-xl font-semibold text-[#1F1917] leading-tight">
                    {activeProject.title}
                  </h3>
                  <p className="text-xs text-ink-soft mt-1.5 leading-relaxed">
                    {activeProject.description}
                  </p>

                  <div className="mt-5 space-y-2">
                    <div className="flex justify-between items-center text-xs font-mono">
                      <span className="text-ink-soft">Mastery Progress</span>
                      <span className="font-semibold text-[#E9825B]">
                        <AnimatedNumber value={activeProject.masteryScore} suffix="%" />
                      </span>
                    </div>
                    <ProgressBar value={activeProject.masteryScore} size="md" variant="indigo" />
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-[#F1E8E3] flex items-center justify-between">
                  <span className="text-xs font-mono text-ink-faint">
                    {activeProject.materialCount} Materials • {activeProject.conceptCount} Concepts
                  </span>
                  <Link to={`/projects/${activeProject.id}/tutor`}>
                    <Button variant="primary" size="sm" className="gap-1.5 font-semibold">
                      Launch AI Tutor <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>
              </FloatingCard>
            ) : (
              <Card className="lg:col-span-2 p-8 bg-white border border-[#F1E8E3] rounded-xl shadow-card flex flex-col items-center justify-center text-center">
                <Brain className="w-10 h-10 text-[#F29B73]/60 mb-3" />
                <h3 className="font-display text-lg font-semibold text-ink">No active projects yet</h3>
                <p className="text-xs text-ink-soft max-w-sm mt-1 mb-4">
                  Create your first subject space and project to start generating adaptive study plans and AI tutor sessions.
                </p>
                <Link to="/spaces">
                  <Button variant="primary" size="sm">Create Subject Space</Button>
                </Link>
              </Card>
            )}

            {/* Weak Concepts Widget */}
            <Card className="p-6 bg-white border border-[#F1E8E3] rounded-xl shadow-card flex flex-col justify-between">
              <div>
                <div className="flex items-center space-x-2 text-[#D97706] mb-3">
                  <Zap className="w-4 h-4 text-[#F59E0B]" />
                  <h3 className="font-display text-sm font-semibold text-ink uppercase tracking-wider font-mono">
                    Areas Needing Review
                  </h3>
                </div>
                <p className="text-xs text-ink-faint mb-4">
                  Targeted concepts identified from quiz responses:
                </p>

                <div className="space-y-3">
                  {weakConcepts.length > 0 ? (
                    weakConcepts.slice(0, 2).map((c) => (
                      <ConceptCard key={c.id} concept={c} />
                    ))
                  ) : (
                    <div className="p-4 bg-[#FFF8F5] rounded-lg border border-[#F1E8E3] text-center">
                      <p className="text-xs text-ink-soft font-mono">
                        {concepts.length > 0
                          ? 'All concepts currently above 75% mastery!'
                          : 'No concepts mapped yet. Add materials to get started.'}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <Link to={activeProject ? `/projects/${activeProject.id}/quiz` : '/spaces'} className="mt-4 block">
                <Button variant="outline" size="sm" className="w-full text-xs">
                  Take Target Practice Quiz →
                </Button>
              </Link>
            </Card>
          </div>
        </StaggerItem>

        {/* AI RECOMMENDATIONS & ACTIVITY LOG */}
        <StaggerItem>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center space-x-2">
                <Brain className="w-5 h-5 text-[#F29B73]" />
                <h2 className="font-display text-lg font-semibold text-ink">
                  Adaptive Learning Recommendations
                </h2>
              </div>
              <div className="space-y-4">
                {recommendations.length > 0 ? (
                  (recommendations.length > 1 ? recommendations.slice(1) : recommendations).map((rec) => (
                    <RecommendationCard key={rec.id} recommendation={rec} />
                  ))
                ) : (
                  <Card className="p-6 bg-white border border-[#F1E8E3] rounded-xl text-center space-y-2">
                    <Brain className="w-8 h-8 text-[#F29B73]/50 mx-auto" />
                    <p className="font-semibold text-ink text-sm">No recommendations yet</p>
                    <p className="text-xs text-ink-faint max-w-sm mx-auto">
                      Start learning to receive personalized recommendations based on your actual activity.
                    </p>
                  </Card>
                )}
              </div>
            </div>

            {/* Activity Timeline */}
            <Card className="p-6 space-y-4 bg-white border border-[#F1E8E3] rounded-xl shadow-card">
              <h3 className="font-display text-sm font-semibold text-ink uppercase tracking-wider font-mono">
                Recent Activity Log
              </h3>
              <ActivityTimeline activities={activities} />
            </Card>
          </div>
        </StaggerItem>
      </StaggerContainer>
    </PageTransition>
  );
};
