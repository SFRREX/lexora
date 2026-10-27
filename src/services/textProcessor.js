/**
 * textProcessor.js — Service layer for text processing and word enhancement.
 *
 * Automatically connects to the local Gemini proxy endpoint (/api/process-text).
 * When GEMINI_API_KEY is configured in .env, requests are powered by Google Gemini (gemini-3.8-flash).
 * When no key is provided, it gracefully falls back to the local demo rules engine.
 */

import {
  fixGrammar,
  improveWriting,
  replaceWords,
  simplifyText,
  professionalTone,
  casualTone,
  shortenText,
  getWordAlternatives,
  extractRuleBasedGrammarSpans,
} from '../utils/textRules.js';

const TOOLS = {
  grammar: { label: 'Fix Grammar', fn: fixGrammar },
  improve: { label: 'Improve Writing', fn: improveWriting },
  replace: { label: 'Replace Words', fn: replaceWords },
  simplify: { label: 'Simplify Text', fn: simplifyText },
  professional: { label: 'Professional Tone', fn: professionalTone },
  casual: { label: 'Casual Tone', fn: casualTone },
  shorten: { label: 'Shorten Text', fn: shortenText },
};

export const TOOL_LIST = Object.entries(TOOLS).map(([id, { label }]) => ({
  id,
  label,
}));

/**
 * Checks whether the backend Gemini proxy has an active GEMINI_API_KEY.
 */
export async function checkGeminiStatus() {
  try {
    const res = await fetch('/api/status');
    if (!res.ok) return false;
    const data = await res.json();
    return Boolean(data.geminiConfigured);
  } catch {
    return false;
  }
}

/**
 * Process text with the selected tool.
 * Tries the Gemini backend first; falls back to demo rules if not configured or offline.
 * Returns { result, source } where source is 'gemini' | 'demo'.
 */
export async function processText(text, toolId) {
  if (!text || !text.trim()) {
    throw new Error('Please enter some text to process.');
  }

  const tool = TOOLS[toolId];
  if (!tool) {
    throw new Error(`Unknown tool: ${toolId}`);
  }

  // 1. Attempt Gemini backend
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    const response = await fetch('/api/process-text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, tool: toolId }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (response.ok) {
      const data = await response.json();
      if (data && typeof data.result === 'string') {
        return { result: data.result, model: data.model || 'gemini', source: 'gemini' };
      }
    }
  } catch (err) {
    // If server is unreachable or timed out, fall through to demo
    console.info('Gemini backend not reached, using local engine:', err.message);
  }

  // 2. Fall back to local rules engine with subtle simulated delay
  await new Promise((resolve) => setTimeout(resolve, 350 + Math.random() * 300));
  const result = tool.fn(text);
  return { result, source: 'demo' };
}

/**
 * Fetch word alternatives.
 * Uses Gemini API when available for contextual suggestions; falls back to local thesaurus.
 */
export async function fetchWordAlternatives(word, context = '') {
  if (!word || !word.trim()) return null;

  // 1. Attempt Gemini backend
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const response = await fetch('/api/word-alternatives', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ word: word.trim(), context: context.trim() }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (response.ok) {
      const data = await response.json();
      if (data && data.alternatives) {
        return { alternatives: data.alternatives, source: 'gemini' };
      }
    }
  } catch (err) {
    console.info('Gemini word alternatives not reached, using local thesaurus:', err.message);
  }

  // 2. Fall back to local thesaurus
  const local = getWordAlternatives(word);
  return local ? { alternatives: local, source: 'demo' } : null;
}

/**
 * Perform granular span-level proofreading and grammar analysis.
 * Uses Gemini API when available for minimal-span corrections;
 * falls back to high-speed deterministic local rule analysis if offline.
 */
export async function checkGrammarSpans(text) {
  if (!text || !text.trim()) {
    return { corrections: [], count: 0, source: 'none' };
  }

  // 1. Attempt server / Gemini endpoint
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const response = await fetch('/api/grammar-check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (response.ok) {
      const data = await response.json();
      if (data && Array.isArray(data.corrections)) {
        return {
          corrections: data.corrections,
          count: data.corrections.length,
          model: data.model || null,
          source: data.source || 'gemini',
        };
      }
    }
  } catch (err) {
    console.info('Grammar check endpoint unreachable, using client rule analysis:', err.message);
  }

  // 2. Client-side deterministic rule fallback
  const corrections = extractRuleBasedGrammarSpans(text);
  return {
    corrections,
    count: corrections.length,
    source: 'local',
  };
}
