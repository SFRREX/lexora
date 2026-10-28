import { GoogleGenAI, Type } from '@google/genai';

export const TOOL_PROMPTS = {
  grammar: {
    instruction:
      'You are an elite, publication-grade copy editor for Lexora adhering strictly to the Chicago Manual of Style. Correct all grammatical errors, spelling mistakes, punctuation issues (commas, hyphens, em-dashes, apostrophes, colons, semicolons), capitalization, dangling modifiers, comma splices, and syntax flaws. Strictly preserve the original tone, intent, factual assertions, citations, and markdown/formatting. Do not add any introductory or explanatory text, notes, or surrounding quotes. Return ONLY the perfected, corrected text directly.',
    temperature: 0.1,
  },
  improve: {
    instruction:
      'You are a master writing coach for Lexora. Enhance the prose for dynamic sentence rhythm, natural cadence, clarity, and authentic human voice while strictly preserving the author\'s original meaning and intent. Dynamically vary sentence length (combining crisp, short sentences with longer compound ones) to avoid monotonic rhythms. Eliminate repetitive sentence structures and robotic AI transitions (never begin sentences with "Consequently,", "Moreover,", "Furthermore,", "Therefore,", or "Notably,"). Preserve all names, numbers, facts, and citations verbatim. Return ONLY the improved text directly without notes or commentary.',
    temperature: 0.55,
  },
  replace: {
    instruction:
      'You are a master vocabulary specialist for Lexora. Upgrade weak, overused, or repetitive words with richer, contextually accurate, and vivid alternatives. Ensure the elevated vocabulary matches the tone and flows naturally without sounding pretentious or forced. Preserve all factual claims and citations. Return ONLY the revised text directly with no added commentary.',
    temperature: 0.25,
  },
  simplify: {
    instruction:
      'You are a plain-language editor for Lexora following the Federal Plain Language Guidelines. Simplify dense jargon, untangle convoluted clauses, and transform overly complex sentences into crisp, direct, and accessible prose. Maintain 100% of the core information, nuances, and factual accuracy. Return ONLY the simplified text directly.',
    temperature: 0.15,
  },
  professional: {
    instruction:
      'You are an executive communications editor for Lexora. Transform the draft into an authoritative, polished, articulate, and diplomatic professional register suitable for high-stakes business and leadership communications. Ensure the message is constructive, clear, and confident without being bureaucratic or overly stiff. Return ONLY the revised text directly.',
    temperature: 0.2,
  },
  casual: {
    instruction:
      'You are a conversational writing editor for Lexora. Adapt the text into a warm, natural, friendly, and engaging conversational tone with standard contractions and fluid cadence. Ensure the prose feels authentic and human while maintaining coherence and intelligence. Return ONLY the revised text directly.',
    temperature: 0.35,
  },
  shorten: {
    instruction:
      'You are an elite conciseness editor for Lexora. Eliminate wordiness, redundancies, throat-clearing prepositions, and deadwood phrases. Maximize the signal-to-noise ratio and make the text punchy and succinct while preserving 100% of the essential meaning, critical facts, and conclusions. Return ONLY the shortened text directly.',
    temperature: 0.15,
  },
};

const GEMINI_MODELS = ['gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-3.8-flash'];

// ── Cache & In-Flight Request Deduplication ─────────────────────────────
const cache = new Map();
const inFlight = new Map();
const CACHE_MAX = 200;

export function cacheKey(kind, model, text) {
  return `${kind}:${model}:${text}`;
}

export function cacheGet(key) {
  return cache.get(key) || null;
}

export function cachePut(key, value) {
  if (cache.size >= CACHE_MAX) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey !== undefined) {
      cache.delete(oldestKey);
    }
  }
  cache.set(key, value);
}

export function clearCache() {
  cache.clear();
  inFlight.clear();
}

export function getCacheStats() {
  return {
    size: cache.size,
    max: CACHE_MAX,
    inFlightCount: inFlight.size,
  };
}

// ── Rate Limiting Queue & 429 Graceful Backoff ──────────────────────────
let backoffUntil = 0;
let queue = Promise.resolve();

export function getBackoffUntil() {
  return backoffUntil;
}

export function setBackoffUntil(timestamp) {
  backoffUntil = timestamp;
}

export function resetBackoff() {
  backoffUntil = 0;
}

export function enqueue(fn) {
  const run = queue.then(async () => {
    const wait = backoffUntil - Date.now();
    if (wait > 0) {
      await new Promise((r) => setTimeout(r, wait));
    }
    return fn();
  }, async () => {
    const wait = backoffUntil - Date.now();
    if (wait > 0) {
      await new Promise((r) => setTimeout(r, wait));
    }
    return fn();
  });

  queue = run.catch(() => {});
  return run;
}

export function isRateLimitError(err) {
  if (!err) return false;
  const msg = (err.message || '').toLowerCase();
  const status = err.status || err.statusCode || 0;
  return status === 429 || msg.includes('429') || msg.includes('quota') || msg.includes('resource_exhausted');
}

export function isDailyQuotaError(err) {
  if (!err) return false;
  const msg = (err.message || '').toLowerCase();
  return (
    msg.includes('quota') ||
    msg.includes('daily') ||
    msg.includes('resource_exhausted') ||
    msg.includes('limit: 20')
  );
}

/**
 * Creates a GoogleGenAI client if an API key is present.
 */
function getClient(apiKey) {
  const key = apiKey || process.env.GEMINI_API_KEY;
  if (!key || key.trim() === '' || key === 'your_gemini_api_key_here') {
    return null;
  }
  return new GoogleGenAI({ apiKey: key });
}

export function isGeminiConfigured(apiKey) {
  return Boolean(getClient(apiKey));
}

/**
 * Process text using Gemini API with tool-specific system instructions,
 * sliding-window response cache, in-flight request deduplication, and 429 backoff queue.
 */
export async function processWithGemini(text, toolId, apiKey) {
  const client = getClient(apiKey);
  if (!client) {
    throw new Error('GEMINI_API_KEY is not configured on the server.');
  }

  const key = cacheKey(toolId || 'grammar', 'auto', text);
  const cached = cacheGet(key);
  if (cached) return cached;

  if (inFlight.has(key)) {
    return inFlight.get(key);
  }

  const toolConfig = TOOL_PROMPTS[toolId] || TOOL_PROMPTS.grammar;

  const promise = enqueue(async () => {
    let lastError = null;

    for (const model of GEMINI_MODELS) {
      try {
        const response = await client.models.generateContent({
          model,
          contents: text,
          config: {
            systemInstruction: toolConfig.instruction,
            temperature: toolConfig.temperature,
          },
        });

        const output = response.text ? response.text.trim() : '';
        if (output) {
          const result = { text: output, model };
          cachePut(key, result);
          return result;
        }
      } catch (err) {
        lastError = err;
        if (isRateLimitError(err)) {
          if (isDailyQuotaError(err)) {
            console.warn(`[Gemini] Daily quota exhausted on ${model}. Fast-failing immediately to secondary fallback without delay.`);
          } else {
            backoffUntil = Date.now() + 1500;
            console.warn(`[Gemini] Transient throttle on ${model}. Brief 1.5s backoff.`);
          }
        } else {
          console.info(`Model ${model} unavailable, trying fallback:`, err.message);
        }
      }
    }

    throw lastError || new Error('All Gemini models were unavailable.');
  }).finally(() => {
    inFlight.delete(key);
  });

  inFlight.set(key, promise);
  return promise;
}

/**
 * Generate context-aware word alternatives using structured JSON schema,
 * in-flight deduplication, and LRU cache.
 */
export async function getAlternativesWithGemini(word, context, apiKey) {
  const client = getClient(apiKey);
  if (!client) {
    throw new Error('GEMINI_API_KEY is not configured on the server.');
  }

  const key = cacheKey('alternatives', word, context || '');
  const cached = cacheGet(key);
  if (cached) return cached;

  if (inFlight.has(key)) {
    return inFlight.get(key);
  }

  const prompt = `You are an expert lexicographer and context-aware thesaurus specialist. Suggest 3 to 4 distinct, highly natural alternatives for the word "${word}"${
    context && context.trim() ? ` as used in the following sentence context: "${context.trim()}"` : ''
  }. Every suggestion MUST match the grammatical part of speech, inflection, and syntactic function of the target word in context so it can be directly swapped into the sentence without causing grammatical errors. Provide alternatives for: professional, casual, stronger, and simpler.`;

  const promise = enqueue(async () => {
    let lastError = null;

    for (const model of GEMINI_MODELS) {
      try {
        const response = await client.models.generateContent({
          model,
          contents: prompt,
          config: {
            temperature: 0.25,
            responseMimeType: 'application/json',
            responseJsonSchema: {
              type: Type.OBJECT,
              properties: {
                professional: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'Professional or formal alternatives matching grammatical context',
                },
                casual: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'Casual or conversational alternatives matching grammatical context',
                },
                stronger: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'More impactful, vivid, or powerful alternatives matching grammatical context',
                },
                simpler: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'Clear, direct, and simpler alternatives matching grammatical context',
                },
              },
              required: ['professional', 'casual', 'stronger', 'simpler'],
            },
          },
        });

        if (response.text) {
          const parsed = JSON.parse(response.text);
          parsed._model = model;
          cachePut(key, parsed);
          return parsed;
        }
      } catch (err) {
        lastError = err;
        if (isRateLimitError(err)) {
          if (isDailyQuotaError(err)) {
            console.warn(`[Gemini] Daily quota exhausted on ${model} during alternatives. Fast-failing immediately.`);
          } else {
            backoffUntil = Date.now() + 1500;
            console.warn(`[Gemini] Transient throttle on ${model} during alternatives: 1.5s backoff.`);
          }
        } else {
          console.info(`Model ${model} unavailable for alternatives:`, err.message);
        }
      }
    }

    throw lastError || new Error('All Gemini models were unavailable for word alternatives.');
  }).finally(() => {
    inFlight.delete(key);
  });

  inFlight.set(key, promise);
  return promise;
}

// ── Granular Span-Level Grammar Checking ────────────────────────────────
const GRAMMAR_SPAN_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    corrections: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          original: {
            type: Type.STRING,
            description: 'The exact verbatim substring copied directly from the text that contains the issue.',
          },
          replacement: {
            type: Type.STRING,
            description: 'The precise corrected replacement for that exact substring.',
          },
          explanation: {
            type: Type.STRING,
            description: 'A concise explanation of the error or style improvement under 15 words.',
          },
          type: {
            type: Type.STRING,
            enum: ['grammar', 'spelling', 'punctuation', 'clarity', 'style'],
            description: 'The category of the issue.',
          },
        },
        required: ['original', 'replacement', 'explanation', 'type'],
      },
    },
  },
  required: ['corrections'],
};

const GRAMMAR_SPAN_INSTRUCTION = `You are a thorough, publication-grade proofreader. Detect all grammar, spelling, punctuation, clarity, and style issues in the text.
Rules:
1. Always prefer the MINIMAL edit that makes the sentence grammatically sound. Keep original wording, tone, and citations.
2. "original" MUST be the exact verbatim substring from the input text (the shortest span containing the error).
3. "replacement" MUST be the corrected version of that same span.
4. "type" MUST be one of: "grammar", "spelling", "punctuation", "clarity", or "style".
5. Keep "explanation" under 15 words.
6. Do not flag personal names or correct informal idioms if they are grammatically sound.
7. If the text has no errors, return an empty corrections array.`;

/**
 * Validates, locates character indices, and removes overlapping spans for safe text substitution.
 */
export function sanitizeAndLocateCorrections(rawCorrections, sourceText) {
  if (!Array.isArray(rawCorrections) || !sourceText) return [];

  const located = [];
  let cursor = 0;

  for (const c of rawCorrections) {
    if (
      !c ||
      typeof c.original !== 'string' ||
      typeof c.replacement !== 'string' ||
      c.original.trim() === c.replacement.trim() ||
      c.original.length === 0
    ) {
      continue;
    }

    let startIndex = sourceText.indexOf(c.original, cursor);
    if (startIndex === -1) {
      startIndex = sourceText.indexOf(c.original, 0);
    }

    if (startIndex !== -1) {
      const endIndex = startIndex + c.original.length;
      located.push({
        original: c.original,
        replacement: c.replacement,
        explanation: typeof c.explanation === 'string' && c.explanation.trim()
          ? c.explanation.trim()
          : 'Grammar correction',
        type: ['grammar', 'spelling', 'punctuation', 'clarity', 'style'].includes(c.type) ? c.type : 'grammar',
        startIndex,
        endIndex,
      });
      cursor = endIndex;
    }
  }

  // Sort chronologically by start index
  located.sort((a, b) => a.startIndex - b.startIndex);

  // Eliminate any overlapping spans
  const nonOverlapping = [];
  let lastEnd = -1;
  for (const item of located) {
    if (item.startIndex >= lastEnd) {
      nonOverlapping.push(item);
      lastEnd = item.endIndex;
    }
  }

  return nonOverlapping;
}

/**
 * Run granular span-level grammar analysis using Gemini with schema enforcement.
 */
export async function checkGrammarSpansWithGemini(text, apiKey) {
  const client = getClient(apiKey);
  if (!client) {
    throw new Error('GEMINI_API_KEY is not configured on the server.');
  }

  const key = cacheKey('grammar-spans', 'auto', text);
  const cached = cacheGet(key);
  if (cached) return cached;

  if (inFlight.has(key)) {
    return inFlight.get(key);
  }

  const promise = enqueue(async () => {
    let lastError = null;

    for (const model of GEMINI_MODELS) {
      try {
        const response = await client.models.generateContent({
          model,
          contents: `TEXT TO PROOFREAD:\n${text}`,
          config: {
            systemInstruction: GRAMMAR_SPAN_INSTRUCTION,
            temperature: 0,
            responseMimeType: 'application/json',
            responseJsonSchema: GRAMMAR_SPAN_SCHEMA,
          },
        });

        if (response.text) {
          const parsed = JSON.parse(response.text);
          const corrections = sanitizeAndLocateCorrections(parsed.corrections || [], text);
          const result = {
            corrections,
            count: corrections.length,
            model,
            source: 'gemini',
          };
          cachePut(key, result);
          return result;
        }
      } catch (err) {
        lastError = err;
        if (isRateLimitError(err)) {
          if (isDailyQuotaError(err)) {
            console.warn(`[Gemini] Daily quota exhausted on ${model} during grammar check. Fast-failing immediately.`);
          } else {
            backoffUntil = Date.now() + 1500;
            console.warn(`[Gemini] Transient throttle on ${model} during grammar check: 1.5s backoff.`);
          }
        } else {
          console.info(`Model ${model} unavailable for grammar check:`, err.message);
        }
      }
    }

    throw lastError || new Error('All Gemini models were unavailable for grammar span analysis.');
  }).finally(() => {
    inFlight.delete(key);
  });

  inFlight.set(key, promise);
  return promise;
}
