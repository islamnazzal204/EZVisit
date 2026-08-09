// ============================================================
// EZVisit — Groq API Client (Free Alternative to OpenRouter)
// ============================================================

import OpenAI from 'openai';

// --- Error types for clean error handling ---

export class GroqError extends Error {
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
    this.name = 'GroqError';
    this.code = opts.code;
    this.statusCode = opts.statusCode;
    this.userMessage = opts.userMessage;
    this.userMessageAr = opts.userMessageAr;
  }
}

/**
 * Parse an error response from Groq and return a user-friendly error.
 */
function parseGroqError(statusCode: number, body: string): GroqError {
  let parsed: { error?: { message?: string; code?: string | number } } = {};
  try {
    parsed = JSON.parse(body);
  } catch {
    // body is not JSON
  }

  const rawMessage = parsed?.error?.message || body;
  const code = String(parsed?.error?.code || statusCode);

  // Map known errors to user-friendly messages
  if (statusCode === 400) {
    return new GroqError({
      message: rawMessage,
      code: 'BAD_REQUEST',
      statusCode,
      userMessage: `Invalid request to Groq: ${rawMessage}. This often happens with incorrect model names or empty transcripts.`,
      userMessageAr: `طلب غير صالح لـ Groq: ${rawMessage}. يحدث هذا غالباً مع أسماء النماذج غير الصحيحة.`,
    });
  }

  if (statusCode === 429) {
    return new GroqError({
      message: rawMessage,
      code: 'RATE_LIMITED',
      statusCode,
      userMessage: 'Too many requests. Groq free tier has rate limits. Please wait a moment and try again.',
      userMessageAr: 'طلبات كثيرة جداً. لدى Groq حدود معدل للمستخدمين المجانيين. يرجى الانتظار قليلاً ثم المحاولة مرة أخرى.',
    });
  }

  if (statusCode === 401 || rawMessage.includes('Invalid API key') || rawMessage.includes('unauthorized')) {
    return new GroqError({
      message: rawMessage,
      code: 'INVALID_API_KEY',
      statusCode,
      userMessage: 'Groq says your API key is invalid. Please check your Groq key in Settings.',
      userMessageAr: 'يقول Groq أن مفتاح API الخاص بك غير صالح. يرجى التحقق من مفتاح Groq في الإعدادات.',
    });
  }

  if (statusCode === 503 || statusCode === 502) {
    return new GroqError({
      message: rawMessage,
      code: 'SERVICE_UNAVAILABLE',
      statusCode,
      userMessage: 'The Groq service is temporarily unavailable. Please try again in a few minutes.',
      userMessageAr: 'خدمة Groq غير متوفرة مؤقتاً. يرجى المحاولة بعد بضع دقائق.',
    });
  }

  // Default
  return new GroqError({
    message: rawMessage,
    code: code,
    statusCode,
    userMessage: `Something went wrong (Error ${statusCode}). Please try again.`,
    userMessageAr: `حدث خطأ (${statusCode}). يرجى المحاولة مرة أخرى.`,
  });
}

/**
 * Create a Groq-compatible OpenAI client.
 * Groq API is compatible with OpenAI SDK by changing the base URL.
 */
export function createGroqClient(apiKey?: string): OpenAI {
  const key = (apiKey && apiKey.trim()) || (process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim());
  if (!key) {
    throw new GroqError({
      message: 'GROQ_API_KEY is not set',
      code: 'NO_API_KEY',
      statusCode: 401,
      userMessage: 'No Groq API key configured. Go to Settings and enter your Groq API key (free at console.groq.com).',
      userMessageAr: 'لم يتم تعيين مفتاح Groq API. اذهب إلى الإعدادات وأدخل مفتاح Groq الخاص بك (مجاني على console.groq.com).',
    });
  }

  return new OpenAI({
    baseURL: 'https://api.groq.com/openai/v1',
    apiKey: key,
  });
}

/**
 * Transcribe audio using Groq's Whisper API.
 * Groq provides free Whisper transcription with generous rate limits.
 */
export async function transcribeAudioGroq(
  audioFile: File | Blob,
  apiKey?: string
): Promise<{ text: string; segments: Array<{ start: number; end: number; text: string }> }> {
  const key = (apiKey && apiKey.trim()) || (process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim());
  if (!key) {
    throw new GroqError({
      message: 'No API key',
      code: 'NO_API_KEY',
      statusCode: 401,
      userMessage: 'No Groq API key configured. Go to Settings and enter your Groq API key.',
      userMessageAr: 'لم يتم تعيين مفتاح Groq API. اذهب إلى الإعدادات وأدخل مفتاح Groq الخاص بك.',
    });
  }

  // Ensure the audio blob has the correct content type for Groq's API
  const audioBuffer = await audioFile.arrayBuffer();
  const mimeType = audioFile.type || 'audio/webm';
  const safeBlob = new Blob([audioBuffer], { type: mimeType });

  // Determine file extension from MIME type
  const extMap: Record<string, string> = {
    'audio/webm': 'webm',
    'audio/mp4': 'mp4',
    'audio/mpeg': 'mp3',
    'audio/wav': 'wav',
    'audio/ogg': 'ogg',
    'audio/flac': 'flac',
  };
  const ext = extMap[mimeType] || 'webm';
  const fileName = `audio.${ext}`;

  const formData = new FormData();
  formData.append('file', safeBlob, fileName);
  formData.append('model', 'whisper-large-v3-turbo');
  formData.append('language', 'ar');
  formData.append('response_format', 'verbose_json');

  console.log(`Sending to Groq: ${(audioBuffer.byteLength / 1024).toFixed(1)} KB, mime: ${mimeType}, filename: ${fileName}`);

  const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw parseGroqError(response.status, errorBody);
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
 * Send a chat completion request to Groq.
 * Uses Llama 3.1 70B for medical analysis (free tier available).
 */
export async function chatCompletionGroq(
  systemPrompt: string,
  userPrompt: string,
  model: string = 'llama-3.3-70b-versatile',
  apiKey?: string
): Promise<string> {
  console.log(`Groq Chat Completion with model: ${model}`);
  const client = createGroqClient(apiKey);

  try {
    const response = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 8192,
    });

    return response.choices[0]?.message?.content || '';
  } catch (err: unknown) {
    // Re-throw our own errors as-is
    if (err instanceof GroqError) throw err;

    // Parse OpenAI SDK errors
    if (err && typeof err === 'object' && 'status' in err) {
      const apiErr = err as { status: number; message?: string };
      throw parseGroqError(
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
export function parseJsonResponseGroq<T>(text: string): T {
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
