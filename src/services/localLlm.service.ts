/**
 * Local, in-browser LLM inference via WebLLM (github.com/mlc-ai/web-llm).
 *
 * Runs a real quantized open model (Llama 3.2) entirely client-side using
 * WebGPU — no API key, no server, no per-request cost, and nothing ever
 * leaves the browser. Trade-off: the model weights (several hundred MB to a
 * few GB) have to download once and then live in the browser's Cache
 * Storage; a WebGPU-capable browser (recent Chrome/Edge) is required.
 */
import type { MLCEngine, InitProgressReport } from '@mlc-ai/web-llm';

export interface LocalModelOption {
  id: string;
  label: string;
  approxSizeMb: number;
  description: string;
}

// A short, curated subset of WebLLM's prebuilt catalog — small/fast enough
// to be reasonable to download in a browser tab. Bigger = better answers,
// slower first load and generation.
export const LOCAL_MODEL_OPTIONS: LocalModelOption[] = [
  {
    id: 'Llama-3.2-1B-Instruct-q4f16_1-MLC',
    label: 'Llama 3.2 1B (fastest)',
    approxSizeMb: 880,
    description: 'Smallest and quickest to download/run. Good default for most devices.',
  },
  {
    id: 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC',
    label: 'Qwen2.5 1.5B (balanced)',
    approxSizeMb: 1100,
    description: 'A bit larger, generally sharper answers than the 1B model.',
  },
  {
    id: 'Llama-3.2-3B-Instruct-q4f16_1-MLC',
    label: 'Llama 3.2 3B (best quality)',
    approxSizeMb: 2300,
    description: 'Best answer quality of the three, but a much bigger download and needs a stronger GPU.',
  },
];

export type LocalLlmStatus = 'idle' | 'loading' | 'ready' | 'error' | 'unsupported';

export interface LocalLlmProgress {
  status: LocalLlmStatus;
  progressText: string;
  progressPercent: number; // 0-100, best-effort
  errorMessage?: string;
}

const ENABLED_KEY = 'aurelia_local_llm_enabled';
const MODEL_KEY = 'aurelia_local_llm_model_id';

type Listener = (p: LocalLlmProgress) => void;

class LocalLlmService {
  private engine: MLCEngine | null = null;
  private loadedModelId: string | null = null;
  private loadingPromise: Promise<void> | null = null;
  private listeners = new Set<Listener>();
  private current: LocalLlmProgress = { status: 'idle', progressText: '', progressPercent: 0 };

  isWebGpuSupported(): boolean {
    return typeof navigator !== 'undefined' && Boolean((navigator as unknown as { gpu?: unknown }).gpu);
  }

  isEnabled(): boolean {
    return localStorage.getItem(ENABLED_KEY) === 'true';
  }

  setEnabled(enabled: boolean) {
    localStorage.setItem(ENABLED_KEY, enabled ? 'true' : 'false');
  }

  getSelectedModelId(): string {
    return localStorage.getItem(MODEL_KEY) || LOCAL_MODEL_OPTIONS[0].id;
  }

  setSelectedModelId(modelId: string) {
    localStorage.setItem(MODEL_KEY, modelId);
  }

  isReady(): boolean {
    return this.current.status === 'ready' && this.loadedModelId === this.getSelectedModelId();
  }

  getStatus(): LocalLlmProgress {
    return this.current;
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    fn(this.current);
    return () => this.listeners.delete(fn);
  }

  private emit(p: LocalLlmProgress) {
    this.current = p;
    this.listeners.forEach((fn) => fn(p));
  }

  /** Downloads (if needed) and initializes the selected model. Safe to call repeatedly. */
  async loadModel(modelId?: string): Promise<void> {
    const targetModel = modelId || this.getSelectedModelId();

    if (!this.isWebGpuSupported()) {
      this.emit({
        status: 'unsupported',
        progressText: '',
        progressPercent: 0,
        errorMessage: 'This browser does not support WebGPU. Try a recent Chrome or Edge desktop build, or use a Gemini API key instead.',
      });
      return;
    }

    if (this.engine && this.loadedModelId === targetModel) {
      this.emit({ status: 'ready', progressText: 'Model ready.', progressPercent: 100 });
      return;
    }

    if (this.loadingPromise) {
      return this.loadingPromise;
    }

    this.emit({ status: 'loading', progressText: 'Starting model download...', progressPercent: 0 });

    this.loadingPromise = (async () => {
      try {
        const webllm = await import('@mlc-ai/web-llm');
        const engine = await webllm.CreateMLCEngine(targetModel, {
          initProgressCallback: (report: InitProgressReport) => {
            this.emit({
              status: 'loading',
              progressText: report.text,
              progressPercent: Math.round((report.progress || 0) * 100),
            });
          },
        });
        this.engine = engine;
        this.loadedModelId = targetModel;
        this.setSelectedModelId(targetModel);
        this.emit({ status: 'ready', progressText: 'Model ready.', progressPercent: 100 });
      } catch (err) {
        console.error('WebLLM load failed:', err);
        this.engine = null;
        this.loadedModelId = null;
        this.emit({
          status: 'error',
          progressText: '',
          progressPercent: 0,
          errorMessage: (err as Error).message || 'Failed to load local model.',
        });
      } finally {
        this.loadingPromise = null;
      }
    })();

    return this.loadingPromise;
  }

  async unload(): Promise<void> {
    if (this.engine) {
      try {
        await this.engine.unload();
      } catch {
        // best-effort
      }
    }
    this.engine = null;
    this.loadedModelId = null;
    this.emit({ status: 'idle', progressText: '', progressPercent: 0 });
  }

  /** Runs a single grounded generation against the loaded local model. */
  async generate(params: {
    systemInstruction: string;
    prompt: string;
    temperature?: number;
    maxOutputTokens?: number;
  }): Promise<{ text: string; model: string } | null> {
    if (!this.engine || this.current.status !== 'ready') {
      return null;
    }
    try {
      const response = await this.engine.chat.completions.create({
        messages: [
          { role: 'system', content: params.systemInstruction },
          { role: 'user', content: params.prompt },
        ],
        temperature: params.temperature ?? 0.3,
        max_tokens: params.maxOutputTokens ?? 768,
      });
      const text = response.choices?.[0]?.message?.content || '';
      return { text, model: this.loadedModelId || 'local-webllm' };
    } catch (err) {
      console.error('WebLLM generation failed:', err);
      return null;
    }
  }
}

export const localLlmService = new LocalLlmService();
