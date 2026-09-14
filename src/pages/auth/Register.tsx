import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Sparkles, ArrowRight, UserCheck, FolderPlus, Compass, ShieldCheck } from 'lucide-react';

const registerSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters long'),
    confirmPassword: z.string().min(8, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export const Register: React.FC = () => {
  const { register: authRegister } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setServerError(null);
    try {
      const registeredUser = await authRegister(data.name, data.email, data.password);
      if (registeredUser?.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setServerError(err?.message || 'Registration failed.');
    }
  };

  const setupSteps = [
    { label: 'IDENTITY', desc: 'Secure salted Web Crypto credentials', icon: UserCheck },
    { label: 'WORKSPACES', desc: 'Custom domain spaces & project maps', icon: FolderPlus },
    { label: 'AI TUTOR', desc: 'Grounded RAG citation engine ready', icon: Compass },
  ];

  return (
    <div className="min-h-screen bg-[#FFFCF9] text-[#292524] flex flex-col lg:flex-row relative overflow-hidden ambient-bg-tutor">
      {/* Background Ambient Grid */}
      <div className="absolute inset-0 ambient-grid opacity-60 pointer-events-none" />

      {/* LEFT COLUMN: 60% Cinematic Experience */}
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
              Create Your AI Study Companion Workspace
            </span>
            <h1 className="font-display text-4xl xl:text-5xl font-bold text-[#1F1917] leading-tight tracking-tight">
              Embark on grounded <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6B35] via-[#FF7A18] to-[#E85A2A]">
                mastery & discovery.
              </span>
            </h1>
            <p className="text-sm text-[#574E4A] leading-relaxed">
              Join Aurelia to organize your academic materials, engage with instant RAG tutors, track mastery score progressions, and conquer complex topics systematically.
            </p>
          </div>

          {/* Setup Milestones */}
          <div className="space-y-4 pt-4">
            {setupSteps.map((step, idx) => {
              const StepIcon = step.icon;
              return (
                <div key={step.label} className="flex items-center space-x-4 group">
                  <div className="w-10 h-10 rounded-2xl bg-white border border-[#F4E3D8] text-[#E85A2A] flex items-center justify-center shadow-sm group-hover:border-[#FF6B35] transition-all">
                    <StepIcon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 p-3.5 bg-white/80 border border-[#F4E3D8] rounded-xl group-hover:border-[#FFC8B0] transition-all shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-[#1F1917] tracking-wider">
                        STEP 0{idx + 1}. {step.label}
                      </span>
                      <span className="text-[10px] font-mono text-[#E85A2A] font-semibold">Requirement #0{idx + 1}</span>
                    </div>
                    <p className="text-[11px] text-[#574E4A] mt-0.5">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="pt-6 border-t border-[#F4E3D8] flex items-center justify-between text-xs text-ink-faint font-mono">
          <span>AI Study Companion Platform Engine</span>
          <span>Security & Isolation Enabled</span>
        </div>
      </div>

      {/* RIGHT COLUMN: 40% Clean Form Area */}
      <div className="w-full lg:w-2/5 p-6 sm:p-12 flex flex-col justify-center relative z-10">
        <div className="max-w-md w-full mx-auto space-y-6">
          <div className="text-center lg:text-left space-y-1">
            <div className="inline-flex lg:hidden p-3 bg-[#FFEBE0] text-[#E85A2A] rounded-2xl border border-[#FFC8B0] mb-2">
              <Sparkles className="w-6 h-6" />
            </div>
            <h2 className="font-display text-2xl font-bold text-[#1F1917]">Create Learner Account</h2>
            <p className="text-xs text-[#574E4A]">Set up your personal learning companion workspace</p>
          </div>

          <Card className="p-6 bg-white border border-[#F4E3D8] rounded-2xl shadow-card space-y-4">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {serverError && (
                <div className="p-3 bg-[#FEE2E2] text-[#C5221F] text-xs rounded-xl border border-[#FCA5A5] font-mono">
                  {serverError}
                </div>
              )}

              <Input
                label="Full Name"
                placeholder="e.g. Alex Rivera"
                error={errors.name?.message}
                {...register('name')}
              />

              <Input
                label="Email Address"
                type="email"
                placeholder="alex@university.edu"
                error={errors.email?.message}
                {...register('email')}
              />

              <Input
                label="Password"
                type="password"
                placeholder="At least 6 characters"
                error={errors.password?.message}
                {...register('password')}
              />

              <Button variant="signal" type="submit" className="w-full py-3 font-semibold text-xs uppercase tracking-wider bg-[#FF6B35] hover:bg-[#E85A2A] text-white shadow-sm" isLoading={isSubmitting}>
                Create Workspace Account <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </form>
          </Card>

          <p className="text-center text-xs text-[#78716C]">
            Already have an account?{' '}
            <Link to="/login" className="text-[#E9825B] font-semibold hover:underline">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

