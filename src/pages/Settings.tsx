import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import {
  User,
  Sparkles,
  Shield,
  Bell,
  Palette,
  Sliders,
  Lock,
  Download,
  CheckCircle2,
  Brain,
  Clock,
  Laptop,
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { aiProviderService } from '../services/aiProvider.service';
import { localLlmService, LOCAL_MODEL_OPTIONS, LocalLlmProgress } from '../services/localLlm.service';

export const Settings: React.FC = () => {
  const { user } = useAuth();
  const { success, error } = useToast();

  const [activeTab, setActiveTab] = useState<
    'profile' | 'learning' | 'account' | 'security'
  >('profile');

  // Form states
  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState('');
  const [model, setModel] = useState('gemini-pro-latest');
  const [targetHours, setTargetHours] = useState('8');
  const [adaptiveMode, setAdaptiveMode] = useState('balanced');
  const [themeDensity, setThemeDensity] = useState('comfortable');
  const [reduceMotion, setReduceMotion] = useState(false);
  const [notifyQuiz, setNotifyQuiz] = useState(true);
  const [notifyMastery, setNotifyMastery] = useState(true);
  const [notifyDigest, setNotifyDigest] = useState(false);
  const [geminiApiKey, setGeminiApiKey] = useState(aiProviderService.getApiKey() || '');
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [keyStatus, setKeyStatus] = useState<string | null>(
    aiProviderService.getApiKey() ? 'Gemini Key Stored' : null
  );
  const [localEnabled, setLocalEnabled] = useState(localLlmService.isEnabled());
  const [localModelId, setLocalModelId] = useState(localLlmService.getSelectedModelId());
  const [localStatus, setLocalStatus] = useState<LocalLlmProgress>(localLlmService.getStatus());

  React.useEffect(() => {
    const unsubscribe = localLlmService.subscribe(setLocalStatus);
    return unsubscribe;
  }, []);

  const handleToggleLocal = (enabled: boolean) => {
    setLocalEnabled(enabled);
    localLlmService.setEnabled(enabled);
    if (enabled) {
      success('Local model enabled', 'Answers will use the in-browser model once it finishes loading below.');
    }
  };

  const handleLoadLocalModel = async () => {
    localLlmService.setSelectedModelId(localModelId);
    await localLlmService.loadModel(localModelId);
    if (localLlmService.getStatus().status === 'ready') {
      success('Model ready', 'The local model is loaded and will answer your tutor questions with no API key needed.');
    } else if (localLlmService.getStatus().status === 'error') {
      error('Load failed', localLlmService.getStatus().errorMessage || 'Could not load the local model.');
    } else if (localLlmService.getStatus().status === 'unsupported') {
      error('Not supported', localLlmService.getStatus().errorMessage || 'WebGPU is not available in this browser.');
    }
  };

  const handleTestKey = async () => {
    setIsTestingKey(true);
    aiProviderService.setApiKey(geminiApiKey);
    const res = await aiProviderService.testApiKey();
    setIsTestingKey(false);
    if (res.success) {
      setKeyStatus('Connected (Gemini)');
      success('Gemini API Connected', res.message);
    } else {
      setKeyStatus('Error Connecting');
      error('Gemini API request failed', res.message);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    aiProviderService.setApiKey(geminiApiKey);
    success('Settings saved', 'Your profile, AI provider credentials, and preferences have been updated.');
  };

  const handleExportData = () => {
    const dataStr = JSON.stringify(
      {
        user,
        exportDate: new Date().toISOString(),
        settings: { model, targetHours, adaptiveMode },
      },
      null,
      2
    );
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aurelia-study-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    success('Data Exported', 'Your study history and profile telemetry downloaded.');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      {/* Top Header */}
      <div className="pb-4 border-b border-line">
        <h1 className="font-display text-2xl md:text-3xl font-semibold text-ink">
          Companion & Account Settings
        </h1>
        <p className="text-xs text-ink-faint mt-1">
          Customize your profile, learning cadence, grounded LLM parameters, and notification alerts.
        </p>
      </div>

      {/* Settings Navigation Tabs */}
      <div className="flex border-b border-line gap-2 overflow-x-auto pb-1 text-xs font-mono">
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-3.5 py-2 rounded-t-lg transition-colors flex items-center gap-2 ${
            activeTab === 'profile'
              ? 'bg-paper-raised text-signal-strong font-semibold border-b-2 border-signal'
              : 'text-ink-soft hover:text-ink hover:bg-paper-raised/40'
          }`}
        >
          <User className="w-3.5 h-3.5" /> Profile
        </button>
        <button
          onClick={() => setActiveTab('learning')}
          className={`px-3.5 py-2 rounded-t-lg transition-colors flex items-center gap-2 ${
            activeTab === 'learning'
              ? 'bg-paper-raised text-signal-strong font-semibold border-b-2 border-signal'
              : 'text-ink-soft hover:text-ink hover:bg-paper-raised/40'
          }`}
        >
          <Brain className="w-3.5 h-3.5" /> Learning Preferences
        </button>
        <button
          onClick={() => setActiveTab('account')}
          className={`px-3.5 py-2 rounded-t-lg transition-colors flex items-center gap-2 ${
            activeTab === 'account'
              ? 'bg-paper-raised text-signal-strong font-semibold border-b-2 border-signal'
              : 'text-ink-soft hover:text-ink hover:bg-paper-raised/40'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" /> Account & Data
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`px-3.5 py-2 rounded-t-lg transition-colors flex items-center gap-2 ${
            activeTab === 'security'
              ? 'bg-paper-raised text-signal-strong font-semibold border-b-2 border-signal'
              : 'text-ink-soft hover:text-ink hover:bg-paper-raised/40'
          }`}
        >
          <Shield className="w-3.5 h-3.5" /> Security
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* PROFILE TAB */}
        {activeTab === 'profile' && (
          <div className="space-y-5 animate-fade-in">
            <Card className="p-6 space-y-4 bg-paper-raised border-line/70">
              <div className="flex items-center space-x-2 text-ink font-semibold text-sm">
                <User className="w-4 h-4 text-signal-strong" />
                <span>Learner Identity</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Full Name" value={name} onChange={(e) => setName(e.target.value)} />
                <Input label="Email Address" value={user?.email || ''} disabled readOnly />
              </div>
            </Card>
          </div>
        )}

        {/* LEARNING PREFERENCES TAB */}
        {activeTab === 'learning' && (
          <div className="space-y-5 animate-fade-in">
            <Card className="p-6 space-y-4 bg-paper-raised border-line/70">
              <div className="flex items-center space-x-2 text-ink font-semibold text-sm">
                <Brain className="w-4 h-4 text-indigo" />
                <span>AI Tutor & Adaptive Engine Settings</span>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-medium text-ink-soft mb-1">Grounded LLM Routing Model</label>
                  <select
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs font-mono bg-paper-sunken border border-line rounded-md text-ink focus:outline-none"
                  >
                    <option value="gemini-pro-latest">Gemini Pro (Recommended: Complex synthesis & citation precision)</option>
                    <option value="gemini-flash-latest">Gemini Flash (Low-latency responsive queries)</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-medium text-ink-soft mb-1">Weekly Target Study Hours</label>
                    <input
                      type="number"
                      value={targetHours}
                      onChange={(e) => setTargetHours(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs bg-paper-sunken border border-line rounded-md text-ink focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-ink-soft mb-1">Adaptive Quiz Difficulty Bias</label>
                    <select
                      value={adaptiveMode}
                      onChange={(e) => setAdaptiveMode(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs bg-paper-sunken border border-line rounded-md text-ink focus:outline-none"
                    >
                      <option value="balanced">Balanced (Interleave review & challenge)</option>
                      <option value="rigorous">Rigorous (Accelerate difficulty on streaks)</option>
                      <option value="reinforcing">Reinforcing (Focus heavily on weak spots)</option>
                    </select>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* ACCOUNT TAB */}
        {activeTab === 'account' && (
          <div className="space-y-5 animate-fade-in">
            <Card className="p-6 space-y-4 bg-paper-raised border-line/70 text-xs">
              <div className="flex items-center space-x-2 text-ink font-semibold text-sm">
                <Sliders className="w-4 h-4 text-indigo" />
                <span>Account Tier & Data Sovereignty</span>
              </div>

              <div className="p-4 bg-paper-sunken rounded-xl border border-line space-y-2">
                <div className="flex justify-between">
                  <span className="font-mono text-ink-faint">Account Role:</span>
                  <span className="font-mono font-semibold text-signal-strong uppercase">{user?.role}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-mono text-ink-faint">Member Since:</span>
                  <span className="font-mono text-ink">{new Date(user?.createdAt || Date.now()).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  variant="outline"
                  type="button"
                  onClick={handleExportData}
                  className="gap-2 text-xs font-mono"
                >
                  <Download className="w-3.5 h-3.5" /> Export All Study Telemetry (JSON)
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* SECURITY & AI PROVIDER TAB */}
        {activeTab === 'security' && (
          <div className="space-y-5 animate-fade-in">
            <Card className="p-6 space-y-4 bg-paper-raised border-line/70 text-xs">
              <div className="flex items-center space-x-2 text-ink font-semibold text-sm">
                <Laptop className="w-4 h-4 text-signal-strong" />
                <span>Local Browser Model (No API Key Needed)</span>
              </div>

              <div className="space-y-3">
                <p className="text-ink-soft leading-relaxed">
                  Runs a real open model (Llama 3.2 / Qwen2.5) directly in your browser via WebGPU —
                  no API key, no server, no per-message cost, and nothing leaves your device. The
                  model weights download once (see sizes below) and are cached by the browser after that.
                  Requires a WebGPU-capable browser (recent desktop Chrome or Edge).
                </p>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={localEnabled}
                    onChange={(e) => handleToggleLocal(e.target.checked)}
                    className="w-3.5 h-3.5"
                  />
                  <span className="font-medium text-ink-soft">
                    Use the local browser model for tutor answers instead of Gemini
                  </span>
                </label>

                {localEnabled && (
                  <div className="space-y-3 pt-1">
                    <div className="space-y-1.5">
                      <label className="block font-medium text-ink-soft">Model</label>
                      <select
                        value={localModelId}
                        onChange={(e) => setLocalModelId(e.target.value)}
                        disabled={localStatus.status === 'loading'}
                        className="w-full px-3.5 py-2 text-xs font-mono bg-paper-sunken border border-line rounded-md text-ink focus:outline-none"
                      >
                        {LOCAL_MODEL_OPTIONS.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.label} — ~{(m.approxSizeMb / 1000).toFixed(1)} GB
                          </option>
                        ))}
                      </select>
                      <p className="text-ink-faint text-[11px]">
                        {LOCAL_MODEL_OPTIONS.find((m) => m.id === localModelId)?.description}
                      </p>
                    </div>

                    <Button
                      variant="outline"
                      type="button"
                      onClick={handleLoadLocalModel}
                      disabled={localStatus.status === 'loading'}
                      className="text-xs font-mono"
                    >
                      {localStatus.status === 'loading'
                        ? 'Loading...'
                        : localStatus.status === 'ready'
                        ? 'Reload Model'
                        : 'Load Model'}
                    </Button>

                    {localStatus.status === 'loading' && (
                      <div className="space-y-1">
                        <div className="w-full h-1.5 bg-paper-sunken rounded-full overflow-hidden">
                          <div
                            className="h-full bg-signal-strong transition-all"
                            style={{ width: `${Math.max(4, localStatus.progressPercent)}%` }}
                          />
                        </div>
                        <p className="text-ink-faint text-[11px] font-mono">{localStatus.progressText}</p>
                      </div>
                    )}

                    {localStatus.status === 'ready' && (
                      <div className="flex items-center gap-1.5 text-[11px] font-mono">
                        <span className="w-2 h-2 rounded-full bg-signal" />
                        <span className="text-ink-soft">Model loaded and ready — no API key needed.</span>
                      </div>
                    )}

                    {(localStatus.status === 'error' || localStatus.status === 'unsupported') && (
                      <div className="flex items-center gap-1.5 text-[11px] font-mono">
                        <span className="w-2 h-2 rounded-full bg-amber" />
                        <span className="text-ink-soft">{localStatus.errorMessage}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>

            <Card className="p-6 space-y-4 bg-paper-raised border-line/70 text-xs">
              <div className="flex items-center space-x-2 text-ink font-semibold text-sm">
                <Shield className="w-4 h-4 text-signal-strong" />
                <span>Google Gemini AI Provider Configuration (PRD §41, §75)</span>
              </div>

              <div className="space-y-3">
                <p className="text-ink-soft leading-relaxed">
                  Optional: if you'd rather use Google's hosted models instead of (or as a fallback for)
                  the local browser model above, enter a Gemini API key here to enable live generation
                  with <span className="font-mono text-ink font-semibold">Gemini Pro</span> (tutor & rubric
                  essay scoring) and <span className="font-mono text-ink font-semibold">Gemini Flash</span> (adaptive
                  quizzes & recommendations). If the local model is enabled above, it takes priority over this key.
                  If neither is configured, Aurelia operates in offline deterministic mode.
                </p>

                <div className="space-y-1.5">
                  <label className="block font-medium text-ink-soft">Gemini API Key</label>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      placeholder="AIzaSy..."
                      value={geminiApiKey}
                      onChange={(e) => setGeminiApiKey(e.target.value)}
                      className="flex-1 px-3.5 py-2 font-mono text-xs bg-paper-sunken border border-line rounded-md text-ink focus:outline-none focus:border-ink-soft"
                    />
                    <Button
                      variant="outline"
                      type="button"
                      onClick={handleTestKey}
                      disabled={isTestingKey || !geminiApiKey.trim()}
                      className="text-xs font-mono shrink-0"
                    >
                      {isTestingKey ? 'Pinging API...' : 'Test Connection'}
                    </Button>
                  </div>
                  {keyStatus && (
                    <div className="flex items-center gap-1.5 pt-1 text-[11px] font-mono">
                      <span className={`w-2 h-2 rounded-full ${keyStatus.includes('Connected') ? 'bg-signal' : 'bg-amber'}`} />
                      <span className="text-ink-soft">{keyStatus}</span>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            <Card className="p-6 space-y-2 bg-paper-raised border-line/70 text-xs">
              <div className="flex items-center space-x-2 text-ink font-semibold text-sm">
                <Lock className="w-4 h-4 text-signal-strong" />
                <span>Authentication & User Session</span>
              </div>
              <p className="text-ink-soft leading-relaxed">
                All requests to the study engine are signed with session tokens. Client state automatically purges on session termination.
              </p>
            </Card>
          </div>
        )}

        <div className="flex justify-end pt-2 border-t border-line/60">
          <Button variant="signal" type="submit">
            Save Preferences
          </Button>
        </div>
      </form>
    </div>
  );
};
