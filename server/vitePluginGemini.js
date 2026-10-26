import { processWithGemini, getAlternativesWithGemini, isGeminiConfigured } from './geminiService.js';
import { detectorManager } from './detectors/detectorManager.js';
import { refineAcademicText } from './academicRefinerService.js';

export function geminiApiPlugin() {
  return {
    name: 'lexora-gemini-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url || !req.url.startsWith('/api/')) {
          return next();
        }

        // Endpoint: GET /api/status
        if (req.url === '/api/status' && req.method === 'GET') {
          const gptzeroAdapter = detectorManager.getAdapter('gptzero');
          const copyleaksAdapter = detectorManager.getAdapter('copyleaks');
          res.setHeader('Content-Type', 'application/json');
          res.end(
            JSON.stringify({
              geminiConfigured: isGeminiConfigured(),
              gptzeroConfigured: gptzeroAdapter ? gptzeroAdapter.isConfigured() : false,
              copyleaksConfigured: copyleaksAdapter ? copyleaksAdapter.isConfigured() : false,
            })
          );
          return;
        }

        // Endpoint: GET /api/detectors/status
        if (req.url === '/api/detectors/status' && req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ providers: detectorManager.getStatuses() }));
          return;
        }

        // Endpoint: POST /api/detectors/scan
        if (req.url === '/api/detectors/scan' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', async () => {
            try {
              const { text, providers } = JSON.parse(body || '{}');
              if (!text || !text.trim()) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Text is required for AI detection.' }));
                return;
              }

              const targetProviders = Array.isArray(providers) && providers.length > 0
                ? providers
                : ['gemini', 'stylometrics'];

              const scanResponse = await detectorManager.runDetection(text, targetProviders);
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(scanResponse));
            } catch (err) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: err.message || 'Detection failed.' }));
            }
          });
          return;
        }

        // Endpoint: POST /api/refine-academic
        if (req.url === '/api/refine-academic' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', async () => {
            try {
              const { text, mode, level } = JSON.parse(body || '{}');
              if (!text || !text.trim()) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Text is required for academic refinement.' }));
                return;
              }

              const result = await refineAcademicText(text, { mode, level });
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(result));
            } catch (err) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: err.message || 'Refinement failed.' }));
            }
          });
          return;
        }

        // Endpoint: POST /api/process-text
        if (req.url === '/api/process-text' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', async () => {
            try {
              if (!isGeminiConfigured()) {
                res.statusCode = 503;
                res.setHeader('Content-Type', 'application/json');
                res.end(
                  JSON.stringify({
                    error: 'GEMINI_API_KEY is not set in .env',
                    geminiConfigured: false,
                  })
                );
                return;
              }

              const { text, tool } = JSON.parse(body || '{}');
              if (!text || !text.trim()) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Text is required.' }));
                return;
              }

              const processed = await processWithGemini(text, tool);
              const result = typeof processed === 'string' ? processed : processed.text;
              const model = typeof processed === 'object' && processed.model ? processed.model : 'gemini-3.5-flash';
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ result, model, source: 'gemini' }));
            } catch (err) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(
                JSON.stringify({
                  error: err.message || 'Gemini processing failed.',
                })
              );
            }
          });
          return;
        }

        // Endpoint: POST /api/word-alternatives
        if (req.url === '/api/word-alternatives' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', async () => {
            try {
              if (!isGeminiConfigured()) {
                res.statusCode = 503;
                res.setHeader('Content-Type', 'application/json');
                res.end(
                  JSON.stringify({
                    error: 'GEMINI_API_KEY is not set in .env',
                    geminiConfigured: false,
                  })
                );
                return;
              }

              const { word, context } = JSON.parse(body || '{}');
              if (!word || !word.trim()) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Word is required.' }));
                return;
              }

              const alternatives = await getAlternativesWithGemini(word, context);
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ alternatives, source: 'gemini' }));
            } catch (err) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(
                JSON.stringify({
                  error: err.message || 'Gemini alternatives failed.',
                })
              );
            }
          });
          return;
        }

        next();
      });
    },
  };
}
