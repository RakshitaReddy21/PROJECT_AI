/**
 * Real Google Gemini AI Model Service (PRD v2.0 §41, §42, §48, §75)
 *
 * Implements actual HTTP calls to Google Generative Language API endpoints,
 * Gemini provider routing, timeout management, structured JSON validation, and token usage telemetry.
 */

import { aiUsageService } from './aiUsage.service';

export interface GenerateContentParams {
  model?: 'gemini-3.8-flash' | 'gemini-pro-latest' | 'gemini-flash-latest' | string;
  systemInstruction?: string;
  prompt: string;
  temperature?: number;
  maxOutputTokens?: number;
  responseFormat?: 'text' | 'json';
  operationName: string;
  projectId?: string;
}

export interface GenerateContentResult {
  text: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  latencyMs: number;
  isLiveApi: boolean;
}

export class AIProviderService {
  private customGeminiApiKey: string | null = null;

  constructor() {
    this.customGeminiApiKey = localStorage.getItem('aurelia_gemini_api_key') || null;
  }

  // --- Gemini Credentials ---
  getApiKey(): string | null {
    if (this.customGeminiApiKey) return this.customGeminiApiKey;
    return null;
  }

  setApiKey(key: string) {
    this.customGeminiApiKey = key.trim() || null;
    if (this.customGeminiApiKey) {
      localStorage.setItem('aurelia_gemini_api_key', this.customGeminiApiKey);
    } else {
      localStorage.removeItem('aurelia_gemini_api_key');
    }
  }

  hasApiKey(): boolean {
    return Boolean(this.getApiKey());
  }

  /**
   * Health check / ping against Gemini API to verify API key validity
   */
  async testApiKey(): Promise<{ success: boolean; message: string; model?: string }> {
    const key = this.getApiKey();
    if (!key) {
      return { success: false, message: 'Invalid Gemini API Key: No Gemini API key configured.' };
    }

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${key}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Respond with the word: pong' }] }],
          generationConfig: { maxOutputTokens: 10 },
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const errMsg = errorData?.error?.message || `HTTP ${res.status}: ${res.statusText}`;
        if (res.status === 400 || res.status === 403 || errMsg.toLowerCase().includes('key')) {
          return { success: false, message: `Invalid Gemini API Key: ${errMsg}` };
        }
        return {
          success: false,
          message: `Gemini API request failed: ${errMsg}`,
        };
      }

      return { success: true, message: 'Connected successfully to Gemini!', model: 'gemini-3.8-flash' };
    } catch (err) {
      return { success: false, message: `Gemini Connection Failed: ${(err as Error).message || 'Network error connecting to Gemini API.'}` };
    }
  }

  /**
   * Calls Gemini API
   */
  async generateGemini(params: GenerateContentParams): Promise<GenerateContentResult | null> {
    const key = this.getApiKey();
    if (!key) return null;

    const targetModel = params.model || 'gemini-3.8-flash';
    const startTime = Date.now();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${key}`;

      const requestBody: Record<string, unknown> = {
        contents: [
          {
            parts: [{ text: params.prompt }],
          },
        ],
        generationConfig: {
          temperature: params.temperature ?? 0.3,
          maxOutputTokens: params.maxOutputTokens ?? 1024,
          ...(params.responseFormat === 'json' ? { responseMimeType: 'application/json' } : {}),
        },
      };

      if (params.systemInstruction) {
        requestBody.systemInstruction = {
          parts: [{ text: params.systemInstruction }],
        };
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.warn(`Gemini API request failed: returned HTTP status ${response.status}.`);
        return null;
      }

      const data = await response.json();
      const latencyMs = Date.now() - startTime;

      const generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const promptTokens = data?.usageMetadata?.promptTokenCount || Math.round(params.prompt.length / 4);
      const completionTokens = data?.usageMetadata?.candidatesTokenCount || Math.round(generatedText.length / 4);

      await aiUsageService.recordAIUsage({
        model: targetModel,
        promptTokens,
        completionTokens,
        latencyMs,
        operation: params.operationName,
        projectId: params.projectId,
      });

      return {
        text: generatedText,
        model: targetModel,
        promptTokens,
        completionTokens,
        latencyMs,
        isLiveApi: true,
      };
    } catch (err) {
      clearTimeout(timeoutId);
      console.warn('Gemini Connection Failed or timed out:', err);
      return null;
    }
  }

  /**
   * Unified dispatcher: Routes to Gemini API if key is available.
   */
  async generate(params: GenerateContentParams): Promise<GenerateContentResult | null> {
    if (this.getApiKey()) {
      return this.generateGemini(params);
    }

    return null;
  }
}

export const aiProviderService = new AIProviderService();
