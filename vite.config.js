import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { geminiApiPlugin } from './server/vitePluginGemini.js';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  Object.assign(process.env, env);

  return {
    plugins: [react(), tailwindcss(), geminiApiPlugin()],
    test: {
      globals: true,
      environment: 'jsdom',
      include: ['src/test/**/*.{test,spec}.?(c|m)[jt]s?(x)'],
      setupFiles: ['./src/test/setup.js'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html'],
        exclude: ['node_modules/', 'dist/', 'test-suite.js', 'test-rules.js', 'api/'],
      },
    },
  };
});
