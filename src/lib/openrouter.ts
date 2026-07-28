// ============================================================
// EZVisit — OpenRouter API Client
// ============================================================

import OpenAI from 'openai';

// --- Error types for clean error handling ---

export class OpenRouterError extends Error {
  public code: string;
  public statusCode: number;
  public userMessage: string;
  public userMessageAr: string;

  constructor(opts: {
    message: string;
    code: string;
    statusCode: number;
    userMessage: string;
    userMessageAr: string;
  }) {
    super(opts.message);
    this.name = 'OpenRouterError';
    this.code = opts.code;
    this.statusCode = opts.statusCode;
    this.userMessage = opts.userMessage;
    this.userMessageAr = opts.userMessageAr;
  }
}

/**
 * Parse an error response from OpenRouter and return a user-friendly error.
 */
function parseOpenRouterError(statusCode: number, body: string): OpenRouterError {
  let parsed: { error?: { message?: string; code?: string | number } } = {};
  try {
    parsed = JSON.parse(body);
  } catch {
    // body is not JSON
  }

  const rawMessage = parsed?.error?.message || body;
  const code = String(parsed?.error?.code || statusCode);

  // Map known errors to user-friendly messages
  if (statusCode === 402 || rawMessage.includes('Insufficient credits')) {
    return new OpenRouterError({
      message: rawMessage,
      code: 'INSUFFICIENT_CREDITS',
      statusCode,
      userMessage: 'Your OpenRouter account has no credits. Please add credits at openrouter.ai/settings/credits, or use a different API key.',
      userMessageAr: 'حسابك في OpenRouter لا يحتوي على رصيد. يرجى إضافة رصيد في openrouter.ai/settings/credits أو استخدام مفتاح API مختلف.',
    });
  }

  if (statusCode === 401 || rawMessage.includes('Invalid API key')) {
    return new OpenRouterError({
      message: rawMessage,
      code: 'INVALID_API_KEY',
      statusCode,
      userMessage: 'OpenRouter says your API key is invalid. Please check your OpenRouter key in Settings.',
      userMessageAr: 'يقول OpenRouter أن مفتاح API الخاص بك غير صالح. يرجى التحقق من مفتاح OpenRouter في الإعدادات.',
    });
  }

  if (statusCode === 429) {
    return new OpenRouterError({
      message: rawMessage,
      code: 'RATE_LIMITED',
      statusCode,
      userMessage: 'Too many requests. Please wait a moment and try again.',
      userMessageAr: 'طلبات كثيرة جداً. يرجى الانتظار قليلاً ثم المحاولة مرة أخرى.',
    });
  }

  if (statusCode === 503 || statusCode === 502) {
    return new OpenRouterError({
      message: rawMessage,
      code: 'SERVICE_UNAVAILABLE',
      statusCode,
      userMessage: 'The AI service is temporarily unavailable. Please try again in a few minutes.',
      userMessageAr: 'خدمة الذكاء الاصطناعي غير متوفرة مؤقتاً. يرجى المحاولة بعد بضع دقائق.',
    });
  }

  // Default
  return new OpenRouterError({
    message: rawMessage,
    code: code,
    statusCode,
    userMessage: `Something went wrong (Error ${statusCode}). Please try again.`,
    userMessageAr: `حدث خطأ (${statusCode}). يرجى المحاولة مرة أخرى.`,
  });
}

/**
 * Create an OpenRouter-compatible OpenAI client.
 */
export function createOpenRouterClient(apiKey?: string): OpenAI {
  const key = (apiKey && apiKey.trim()) || (process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_API_KEY.trim());
  if (!key) {
    throw new OpenRouterError({
      message: 'OPENROUTER_API_KEY is not set',
      code: 'NO_API_KEY',
      statusCode: 401,
      userMessage: 'No API key configured. Go to Settings and enter your OpenRouter API key.',
      userMessageAr: 'لم يتم تعيين مفتاح API. اذهب إلى الإعدادات وأدخل مفتاح OpenRouter الخاص بك.',
    });
  }

  return new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: key,
    defaultHeaders: {
      'HTTP-Referer': 'https://ezvisit.app',
      'X-Title': 'EZVisit Medical Communication Research',
    },
  });
}

/**
 * Transcribe audio using OpenRouter's Whisper API.
 */
export async function transcribeAudio(
  audioFile: File | Blob,
  apiKey?: string
): Promise<{ text: string; segments: Array<{ start: number; end: number; text: string }> }> {
  const key = (apiKey && apiKey.trim()) || (process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_API_KEY.trim());
  if (!key) {
    throw new OpenRouterError({
      message: 'No API key',
      code: 'NO_API_KEY',
      statusCode: 401,
      userMessage: 'No API key configured. Go to Settings and enter your OpenRouter API key.',
      userMessageAr: 'لم يتم تعيين مفتاح API. اذهب إلى الإعدادات وأدخل مفتاح OpenRouter الخاص بك.',
    });
  }

  const formData = new FormData();
  formData.append('file', audioFile, 'audio.webm');
  formData.append('model', 'openai/whisper-1');
  formData.append('language', 'ar');
  formData.append('response_format', 'verbose_json');
  formData.append('timestamp_granularities[]', 'segment');

  const response = await fetch('https://openrouter.ai/api/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key}`,
      'HTTP-Referer': 'https://ezvisit.app',
      'X-Title': 'EZVisit',
    },
    body: formData,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw parseOpenRouterError(response.status, errorBody);
  }

  const data = await response.json();

  return {
    text: data.text || '',
    segments: (data.segments || []).map((seg: { start: number; end: number; text: string }) => ({
      start: seg.start,
      end: seg.end,
      text: seg.text,
    })),
  };
}

/**
 * Send a chat completion request to OpenRouter.
 */
export async function chatCompletion(
  systemPrompt: string,
  userPrompt: string,
  model: string = 'anthropic/claude-sonnet-4',
  apiKey?: string
): Promise<string> {
  const client = createOpenRouterClient(apiKey);

  try {
    const response = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 4096,
    });

    return response.choices[0]?.message?.content || '';
  } catch (err: unknown) {
    // Re-throw our own errors as-is
    if (err instanceof OpenRouterError) throw err;

    // Parse OpenAI SDK errors
    if (err && typeof err === 'object' && 'status' in err) {
      const apiErr = err as { status: number; message?: string };
      throw parseOpenRouterError(
        apiErr.status,
        apiErr.message || 'Unknown error'
      );
    }

    throw err;
  }
}

/**
 * Parse a JSON response from the LLM, stripping markdown code fences if present.
 */
export function parseJsonResponse<T>(text: string): T {
  let cleaned = text.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3);
  }
  cleaned = cleaned.trim();

  return JSON.parse(cleaned) as T;
}
