import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import {
  Sparkles,
  ArrowRight,
  Brain,
  BookOpen,
  CheckCircle2,
  TrendingUp,
  ShieldCheck,
} from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  // Mode state
  const [loginMode, setLoginMode] = useState<'learner' | 'admin'>('learner');
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setServerError(null);
    try {
      const forcedRole = loginMode === 'admin' ? 'admin' : undefined;
      const loggedInUser = await login(data.email, data.password, forcedRole);
      if (loggedInUser?.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setServerError(err?.message || 'Invalid email or password.');
    }
  };

  const journeySteps = [
    { label: 'LEARN', desc: 'Ingest textbooks & papers', icon: BookOpen, active: true },
    { label: 'UNDERSTAND', desc: 'Grounded RAG synthesis', icon: Brain, active: true },
    { label: 'PRACTICE', desc: 'Adaptive evaluation drills', icon: Sparkles, active: true },
    { label: 'MASTER', desc: 'Concept landscape tree', icon: CheckCircle2, active: true },
    { label: 'GROW', desc: 'Longitudinal skill story', icon: TrendingUp, active: true },
  ];

  return (
    <div className="min-h-screen bg-[#FFFCF9] text-[#292524] flex flex-col lg:flex-row relative overflow-hidden ambient-bg-tutor">
      {/* Background Ambient Grid & Particles */}
      <div className="absolute inset-0 ambient-grid opacity-60 pointer-events-none" />

      {/* LEFT COLUMN: 60% Cinematic Knowledge Landscape Visual */}
      <div className="hidden lg:flex lg:w-3/5 p-12 flex-col justify-between relative z-10 border-r border-[#F4E3D8]">
        {/* Brand Top Header */}
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-[#FFEBE0] border border-[#FFC8B0] text-[#FF6B35] rounded-2xl shadow-sm">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="font-display font-bold text-lg text-[#1F1917] tracking-tight">
              ✦ AI Study Companion
            </span>
            <span className="text-[10px] font-mono font-semibold text-[#E85A2A] uppercase bg-[#FFEBE0] px-2 py-0.5 rounded-full ml-2 border border-[#FFC8B0]">
              Study Smarter. Score Better.
            </span>
          </div>
        </div>

        {/* Abstract Floating Knowledge Landscape Journey */}
        <div className="my-auto space-y-8 max-w-xl">
          <div className="space-y-3">
            <span className="text-xs font-mono text-[#E85A2A] font-semibold uppercase tracking-wider bg-[#FFEBE0] px-3 py-1 rounded-full border border-[#FFC8B0]">
              Personal AI Learning Universe
            </span>
            <h1 className="font-display text-4xl xl:text-5xl font-bold text-[#1F1917] leading-tight tracking-tight">
              Learn deeply. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6B35] via-[#FF7A18] to-[#E85A2A]">
                Grow intelligently.
              </span>
            </h1>
            <p className="text-sm text-[#574E4A] leading-relaxed">
              An intelligent, grounded learning environment where your study materials transform into a dynamic concept network, adaptive evaluations, and personalized AI tutor interactions.
            </p>
          </div>

          {/* Interactive Floating Journey Stages */}
          <div className="relative pt-4">
            <div className="absolute left-4 top-6 bottom-6 w-0.5 bg-gradient-to-b from-[#FF6B35] via-[#FF7A18] to-[#E85A2A] opacity-40" />

            <div className="space-y-4">
              {journeySteps.map((stepItem, idx) => {
                const StepIcon = stepItem.icon;
                return (
                  <div key={stepItem.label} className="flex items-center space-x-4 relative z-10 group">
                    <div className="w-8 h-8 rounded-xl bg-white border border-[#F4E3D8] text-[#E85A2A] flex items-center justify-center shadow-sm group-hover:border-[#FF6B35] transition-all">
                      <StepIcon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 p-3 bg-white/80 border border-[#F4E3D8] rounded-xl group-hover:border-[#FFC8B0] transition-all shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-[#1F1917] tracking-wider">
                          0{idx + 1}. {stepItem.label}
                        </span>
                        <span className="text-[10px] font-mono text-[#E85A2A] font-semibold">Active Engine</span>
                      </div>
                      <p className="text-[11px] text-[#574E4A] mt-0.5">{stepItem.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Guarantee */}
        <div className="flex items-center space-x-2 text-xs font-mono text-[#78716C]">
          <ShieldCheck className="w-4 h-4 text-[#E9825B]" />
          <span>Grounded RAG Architecture • Zero Hallucination Guardrails</span>
        </div>
      </div>

      {/* RIGHT COLUMN: 40% Floating Login Panel */}
      <div className="w-full lg:w-2/5 p-6 md:p-12 flex items-center justify-center relative z-10">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2 lg:text-left">
            <div className="inline-flex lg:hidden p-3 bg-[#FFF0E8] text-[#E9825B] rounded-2xl border border-[#F8C9B0] mb-2">
              <Sparkles className="w-6 h-6" />
            </div>
            <h2 className="font-display text-2xl md:text-3xl font-semibold text-[#292524] tracking-tight">
              {loginMode === 'admin' ? 'Admin Portal Sign In' : 'Sign in to AI Study Companion'}
            </h2>
            <p className="text-xs text-[#78716C]">
              {loginMode === 'admin'
                ? 'Enter administrator credentials to access platform governance & telemetry'
                : 'Access your personal grounded learning workspace'}
            </p>
          </div>

          <Card className="p-7 space-y-5 bg-white border border-[#F1E8E3] rounded-2xl shadow-xl">
            {/* EXPLICIT MODE TOGGLE TABS (LEARNER VS ADMIN PORTAL) */}
            <div className="flex bg-[#FFF8F5] p-1 rounded-xl border border-[#F1E8E3] text-xs font-mono">
              <button
                type="button"
                onClick={() => {
                  setLoginMode('learner');
                  setServerError(null);
                }}
                className={`flex-1 py-2 rounded-lg font-semibold transition-all flex items-center justify-center gap-1.5 ${
                  loginMode === 'learner'
                    ? 'bg-white text-[#292524] shadow-sm border border-[#F1E8E3]'
                    : 'text-[#78716C] hover:text-[#292524]'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 text-[#E9825B]" /> Learner Sign In
              </button>

              <button
                type="button"
                onClick={() => {
                  setLoginMode('admin');
                  setServerError(null);
                }}
                className={`flex-1 py-2 rounded-lg font-semibold transition-all flex items-center justify-center gap-1.5 ${
                  loginMode === 'admin'
                    ? 'bg-[#FFEBE0] text-[#E85A2A] border border-[#FFC8B0] shadow-sm'
                    : 'text-[#574E4A] hover:text-[#1F1917]'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#FF6B35]" /> Admin Portal
              </button>
            </div>

            {/* DIRECT CREDENTIALS FORM */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {serverError && (
                <div className="p-3 bg-[#FEE2E2] text-[#C5221F] text-xs rounded-xl border border-[#FCA5A5] font-mono">
                  {serverError}
                </div>
              )}

              {loginMode === 'admin' && (
                <div className="p-2.5 bg-[#FFEBE0] border border-[#FFC8B0] rounded-xl text-[11px] font-mono text-[#E85A2A] flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 flex-shrink-0" />
                  <span>System Admin Mode: Direct secure sign-in to governance telemetry.</span>
                </div>
              )}

              <Input
                label={loginMode === 'admin' ? 'Admin Email Address' : 'Email Address'}
                type="email"
                placeholder="name@example.com"
                error={errors.email?.message}
                {...register('email', { onChange: () => setServerError(null) })}
              />

              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                error={errors.password?.message}
                {...register('password', { onChange: () => setServerError(null) })}
              />

              <Button
                variant="signal"
                type="submit"
                className="w-full py-3 font-semibold text-xs uppercase tracking-wider bg-[#FF6B35] hover:bg-[#E85A2A] text-white shadow-sm"
                isLoading={isSubmitting}
              >
                {loginMode === 'admin' ? 'Sign In To Admin Portal' : 'Sign In To Workspace'} <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </form>
          </Card>

          <p className="text-center text-xs text-[#574E4A]">
            Don't have an account?{' '}
            <Link to="/register" className="text-[#FF6B35] font-semibold hover:underline">
              Create workspace account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

