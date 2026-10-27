import {
  processWithGemini,
  getAlternativesWithGemini,
  checkGrammarSpansWithGemini,
  isGeminiConfigured,
} from './geminiService.js';
import { detectorManager } from './detectors/detectorManager.js';
import { refineAcademicText } from './academicRefinerService.js';
import { extractRuleBasedGrammarSpans } from '../src/utils/textRules.js';

const MAX_PAYLOAD_CHARS = 100000;
const MAX_BODY_BYTES = 2 * 1024 * 1024; // 2MB stream limit

/**
 * Safely parse JSON body from either a pre-parsed request (e.g. Vercel serverless)
 * or incoming request streams (e.g. Node / Vite dev server middleware).
 */
export async function getJsonBody(req) {
  if (req.body !== undefined && req.body !== null) {
    if (typeof req.body === 'object') return req.body;
    if (typeof req.body === 'string' && req.body.trim()) {
      if (req.body.length > MAX_BODY_BYTES) {
        throw new Error('Payload exceeds maximum allowed size of 2MB.');
      }
      try {
        return JSON.parse(req.body);
      } catch {
        return {};
      }
    }
  }

  return new Promise((resolve, reject) => {
    let raw = '';
    let bytesReceived = 0;

    const onData = (chunk) => {
      bytesReceived += chunk.length;
      if (bytesReceived > MAX_BODY_BYTES) {
        req.removeListener('data', onData);
        req.destroy();
        reject(new Error('Payload exceeds maximum allowed size of 2MB.'));
        return;
      }
      raw += chunk;
    };

    req.on('data', onData);
    req.on('end', () => {
      try {
        resolve(raw.trim() ? JSON.parse(raw) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

/**
 * Helper to respond with JSON and defensive security headers.
 */
function sendJson(res, statusCode, data) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.end(JSON.stringify(data));
}

/**
 * Strips sensitive tokens (like Google API keys, Bearer tokens, credentials) from error descriptions.
 */
function sanitizeErrorMessage(err) {
  if (!err || !err.message) return 'Internal processing error.';
  return err.message
    .replace(/AIza[0-9A-Za-z-_]{35}/g, '[REDACTED_API_KEY]')
    .replace(/(?:Bearer\s+)[A-Za-z0-9\-_.]+/gi, 'Bearer [REDACTED_TOKEN]')
    .replace(/(?:key=)[A-Za-z0-9\-_]+/gi, 'key=[REDACTED]');
}

/**
 * Core unified API router for Lexora intelligence endpoints.
 * Usable seamlessly in both Vite dev server middleware and Vercel serverless functions.
 */
export async function handleApiRequest(req, res) {
  const url = new URL(req.url || '', 'http://localhost');
  const pathname = url.pathname;

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.end();
    return true;
  }

  // 1. GET /api/status or /status
  if ((pathname === '/api/status' || pathname === '/status') && req.method === 'GET') {
    const gptzeroAdapter = detectorManager.getAdapter('gptzero');
    const copyleaksAdapter = detectorManager.getAdapter('copyleaks');
    sendJson(res, 200, {
      geminiConfigured: isGeminiConfigured(),
      gptzeroConfigured: gptzeroAdapter ? gptzeroAdapter.isConfigured() : false,
      copyleaksConfigured: copyleaksAdapter ? copyleaksAdapter.isConfigured() : false,
    });
    return true;
  }

  // 2. GET /api/detectors/status or /detectors/status
  if (
    (pathname === '/api/detectors/status' || pathname === '/detectors/status') &&
    req.method === 'GET'
  ) {
    sendJson(res, 200, { providers: detectorManager.getStatuses() });
    return true;
  }

  // 3. POST /api/detectors/scan or /detectors/scan
  if (
    (pathname === '/api/detectors/scan' || pathname === '/detectors/scan') &&
    req.method === 'POST'
  ) {
    try {
      const body = await getJsonBody(req);
      const { text, providers } = body;
      if (!text || !text.trim()) {
        sendJson(res, 400, { error: 'Text is required for AI detection.' });
        return true;
      }
      if (text.length > MAX_PAYLOAD_CHARS) {
        sendJson(res, 413, { error: 'Payload exceeds maximum allowed length of 100,000 characters.' });
        return true;
      }

      const targetProviders =
        Array.isArray(providers) && providers.length > 0
          ? providers
          : ['gemini', 'stylometrics'];

      const scanResponse = await detectorManager.runDetection(text, targetProviders);
      sendJson(res, 200, scanResponse);
    } catch (err) {
      sendJson(res, 500, { error: sanitizeErrorMessage(err) });
    }
    return true;
  }

  // 4. POST /api/refine-academic or /refine-academic
  if (
    (pathname === '/api/refine-academic' || pathname === '/refine-academic') &&
    req.method === 'POST'
  ) {
    try {
      const body = await getJsonBody(req);
      const { text, mode, level, expandContractions, addTransitions, passiveVoice, formalSynonyms } = body;
      if (!text || !text.trim()) {
        sendJson(res, 400, { error: 'Text is required for academic refinement.' });
        return true;
      }
      if (text.length > MAX_PAYLOAD_CHARS) {
        sendJson(res, 413, { error: 'Payload exceeds maximum allowed length of 100,000 characters.' });
        return true;
      }

      const result = await refineAcademicText(text, {
        mode,
        level,
        expandContractions,
        addTransitions,
        passiveVoice,
        formalSynonyms,
      });
      sendJson(res, 200, result);
    } catch (err) {
      sendJson(res, 500, { error: sanitizeErrorMessage(err) });
    }
    return true;
  }

  // 5. POST /api/process-text or /process-text
  if (
    (pathname === '/api/process-text' || pathname === '/process-text') &&
    req.method === 'POST'
  ) {
    try {
      if (!isGeminiConfigured()) {
        sendJson(res, 503, {
          error: 'GEMINI_API_KEY is not set in environment',
          geminiConfigured: false,
        });
        return true;
      }

      const body = await getJsonBody(req);
      const { text, tool } = body;
      if (!text || !text.trim()) {
        sendJson(res, 400, { error: 'Text is required.' });
        return true;
      }
      if (text.length > MAX_PAYLOAD_CHARS) {
        sendJson(res, 413, { error: 'Payload exceeds maximum allowed length of 100,000 characters.' });
        return true;
      }

      const processed = await processWithGemini(text, tool);
      const result = typeof processed === 'string' ? processed : processed.text;
      const model =
        typeof processed === 'object' && processed.model
          ? processed.model
          : 'gemini-3.5-flash';

      sendJson(res, 200, { result, model, source: 'gemini' });
    } catch (err) {
      sendJson(res, 500, { error: sanitizeErrorMessage(err) });
    }
    return true;
  }

  // 6. POST /api/word-alternatives or /word-alternatives
  if (
    (pathname === '/api/word-alternatives' || pathname === '/word-alternatives') &&
    req.method === 'POST'
  ) {
    try {
      if (!isGeminiConfigured()) {
        sendJson(res, 503, {
          error: 'GEMINI_API_KEY is not set in environment',
          geminiConfigured: false,
        });
        return true;
      }

      const body = await getJsonBody(req);
      const { word, context } = body;
      if (!word || !word.trim()) {
        sendJson(res, 400, { error: 'Word is required.' });
        return true;
      }
      if (word.length > 100 || (context && context.length > MAX_PAYLOAD_CHARS)) {
        sendJson(res, 413, { error: 'Payload exceeds maximum allowed length.' });
        return true;
      }

      const alternatives = await getAlternativesWithGemini(word, context);
      sendJson(res, 200, { alternatives, source: 'gemini' });
    } catch (err) {
      sendJson(res, 500, { error: sanitizeErrorMessage(err) });
    }
    return true;
  }

  // 7. POST /api/grammar-check or /grammar-check
  if (
    (pathname === '/api/grammar-check' || pathname === '/grammar-check') &&
    req.method === 'POST'
  ) {
    try {
      const body = await getJsonBody(req);
      const { text } = body;
      if (!text || !text.trim()) {
        sendJson(res, 400, { error: 'Text is required for grammar check.' });
        return true;
      }
      if (text.length > MAX_PAYLOAD_CHARS) {
        sendJson(res, 413, { error: 'Payload exceeds maximum allowed length of 100,000 characters.' });
        return true;
      }

      if (isGeminiConfigured()) {
        try {
          const result = await checkGrammarSpansWithGemini(text);
          sendJson(res, 200, result);
          return true;
        } catch (geminiErr) {
          console.warn('[GrammarCheck] Gemini span check failed, falling back to local rule engine:', geminiErr.message);
        }
      }

      // Local rule engine fallback
      const corrections = extractRuleBasedGrammarSpans(text);
      sendJson(res, 200, {
        corrections,
        count: corrections.length,
        source: 'local',
      });
    } catch (err) {
      sendJson(res, 500, { error: sanitizeErrorMessage(err) });
    }
    return true;
  }

  return false;
}
