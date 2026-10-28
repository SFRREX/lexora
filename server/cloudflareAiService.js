/**
 * Lexora Cloudflare Workers AI Service
 * 
 * Interacts with Cloudflare Workers AI REST API to execute high-performance,
 * open-weight models (@cf/meta/llama-3.3-70b-instruct, @cf/meta/llama-3.1-8b-instruct, @cf/qwen/qwen2.5-7b-instruct)
 * with robust error handling, LRU response caching, and zero single-point-of-failure fallbacks.
 */

const DEFAULT_MODELS = [
  '@cf/meta/llama-3.1-70b-instruct',
  '@cf/meta/llama-3.1-8b-instruct',
  '@cf/meta/llama-3.2-3b-instruct',
  '@cf/deepseek-ai/deepseek-r1-distill-qwen-32b',
];

// In-memory LRU Cache (Capacity: 200 items)
export class SimpleLRUCache {
  constructor(capacity = 200) {
    this.capacity = capacity;
    this.cache = new Map();
  }

  get(key) {
    if (!this.cache.has(key)) return null;
    const value = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  set(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.capacity) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
    this.cache.set(key, value);
  }

  clear() {
    this.cache.clear();
  }
}

const cfResponseCache = new SimpleLRUCache(200);

export function clearCloudflareCache() {
  cfResponseCache.clear();
}

/**
 * Checks whether Cloudflare Workers AI credentials are configured in the environment.
 */
export function isCloudflareConfigured() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  return Boolean(
    accountId &&
    typeof accountId === 'string' &&
    accountId.trim() !== '' &&
    apiToken &&
    typeof apiToken === 'string' &&
    apiToken.trim() !== ''
  );
}

/**
 * Returns the configured or available Cloudflare model.
 */
export function getCloudflareModels() {
  const customModel = process.env.CLOUDFLARE_AI_MODEL;
  if (customModel && typeof customModel === 'string' && customModel.trim()) {
    return [customModel.trim(), ...DEFAULT_MODELS.filter((m) => m !== customModel.trim())];
  }
  return DEFAULT_MODELS;
}

/**
 * Executes text refinement using Cloudflare Workers AI open-weight models.
 * 
 * @param {string} prompt - User draft prompt
 * @param {object} options - Refinement options (systemInstructions, temperature, maxTokens)
 * @returns {Promise<{ text: string, model: string, source: string }>}
 */
export async function runCloudflareWorkersAI(prompt, options = {}) {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
  const apiToken = process.env.CLOUDFLARE_API_TOKEN?.trim();

  if (!accountId || !apiToken) {
    throw new Error('Cloudflare Workers AI credentials (CLOUDFLARE_ACCOUNT_ID or CLOUDFLARE_API_TOKEN) are missing.');
  }

  const {
    systemInstruction = 'You are an expert scientific and academic editor. Refine the text for clarity, precision, and natural flow while preserving all factual and quantitative meaning.',
    temperature = 0.3,
    maxTokens = 2048,
    model: requestedModel,
  } = options;

  // Check LRU cache
  const cacheKey = `${requestedModel || 'auto'}:${temperature}:${prompt}`;
  const cached = cfResponseCache.get(cacheKey);
  if (cached) {
    return { ...cached, cached: true };
  }

  const modelsToTry = requestedModel ? [requestedModel, ...DEFAULT_MODELS.filter((m) => m !== requestedModel)] : getCloudflareModels();

  let lastError = null;

  for (const model of modelsToTry) {
    const endpoint = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000); // 25s timeout

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: systemInstruction },
            { role: 'user', content: prompt },
          ],
          max_tokens: maxTokens,
          temperature,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Cloudflare Workers AI HTTP ${response.status}: ${errText.slice(0, 200)}`);
      }

      const data = await response.json();

      if (!data.success && (!data.result || !data.result.response)) {
        const errMsg = data.errors && data.errors.length > 0 ? data.errors[0].message : 'Unknown Cloudflare Workers AI error';
        throw new Error(errMsg);
      }

      const outputText = (data.result?.response || '').trim();
      if (!outputText) {
        throw new Error('Empty response returned from Cloudflare Workers AI model.');
      }

      const result = {
        text: outputText,
        model,
        source: 'cloudflare-workers-ai',
      };

      cfResponseCache.set(cacheKey, result);
      return result;
    } catch (err) {
      clearTimeout(timeoutId);
      lastError = err;
      console.info(`Cloudflare Workers AI model ${model} failed, attempting fallback:`, err.message);
    }
  }

  throw new Error(`All Cloudflare Workers AI models failed. Last error: ${lastError?.message || 'Unknown error'}`);
}
