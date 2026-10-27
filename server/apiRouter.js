import { processWithGemini, getAlternativesWithGemini, isGeminiConfigured } from './geminiService.js';
import { detectorManager } from './detectors/detectorManager.js';
import { refineAcademicText } from './academicRefinerService.js';

/**
 * Safely parse JSON body from either a pre-parsed request (e.g. Vercel serverless)
 * or incoming request streams (e.g. Node / Vite dev server middleware).
 */
export async function getJsonBody(req) {
  if (req.body !== undefined && req.body !== null) {
    if (typeof req.body === 'object') return req.body;
    if (typeof req.body === 'string' && req.body.trim()) {
      try {
        return JSON.parse(req.body);
      } catch {
        return {};
      }
    }
  }

  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
    });
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
 * Helper to respond with JSON.
 */
function sendJson(res, statusCode, data) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.end(JSON.stringify(data));
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

      const targetProviders =
        Array.isArray(providers) && providers.length > 0
          ? providers
          : ['gemini', 'stylometrics'];

      const scanResponse = await detectorManager.runDetection(text, targetProviders);
      sendJson(res, 200, scanResponse);
    } catch (err) {
      sendJson(res, 500, { error: err.message || 'Detection failed.' });
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
      sendJson(res, 500, { error: err.message || 'Refinement failed.' });
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

      const processed = await processWithGemini(text, tool);
      const result = typeof processed === 'string' ? processed : processed.text;
      const model =
        typeof processed === 'object' && processed.model
          ? processed.model
          : 'gemini-3.5-flash';

      sendJson(res, 200, { result, model, source: 'gemini' });
    } catch (err) {
      sendJson(res, 500, { error: err.message || 'Gemini processing failed.' });
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

      const alternatives = await getAlternativesWithGemini(word, context);
      sendJson(res, 200, { alternatives, source: 'gemini' });
    } catch (err) {
      sendJson(res, 500, { error: err.message || 'Gemini alternatives failed.' });
    }
    return true;
  }

  return false;
}
