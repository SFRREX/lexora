import { handleApiRequest } from './apiRouter.js';

/**
 * Vite development server plugin that routes /api/* requests to the unified Lexora API router.
 */
export function geminiApiPlugin() {
  return {
    name: 'lexora-gemini-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url || !req.url.startsWith('/api/')) {
          return next();
        }

        const handled = await handleApiRequest(req, res);
        if (!handled) {
          next();
        }
      });
    },
  };
}
