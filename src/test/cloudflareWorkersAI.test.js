import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  SimpleLRUCache,
  isCloudflareConfigured,
  getCloudflareModels,
  runCloudflareWorkersAI,
  clearCloudflareCache,
} from '../../server/cloudflareAiService.js';

describe('Cloudflare Workers AI Service', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.restoreAllMocks();
    clearCloudflareCache();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    clearCloudflareCache();
  });

  describe('SimpleLRUCache', () => {
    it('sets and retrieves cached values', () => {
      const cache = new SimpleLRUCache(3);
      cache.set('a', 1);
      cache.set('b', 2);
      expect(cache.get('a')).toBe(1);
      expect(cache.get('b')).toBe(2);
      expect(cache.get('c')).toBeNull();
    });

    it('evicts the least recently used item when capacity is exceeded', () => {
      const cache = new SimpleLRUCache(2);
      cache.set('k1', 'v1');
      cache.set('k2', 'v2');
      // Access k1 to make k2 the oldest
      cache.get('k1');
      cache.set('k3', 'v3');

      expect(cache.get('k1')).toBe('v1');
      expect(cache.get('k3')).toBe('v3');
      expect(cache.get('k2')).toBeNull();
    });

    it('clears all items on clear()', () => {
      const cache = new SimpleLRUCache(2);
      cache.set('x', 10);
      cache.clear();
      expect(cache.get('x')).toBeNull();
    });
  });

  describe('isCloudflareConfigured', () => {
    it('returns false when credentials are empty or undefined', () => {
      delete process.env.CLOUDFLARE_ACCOUNT_ID;
      delete process.env.CLOUDFLARE_API_TOKEN;
      expect(isCloudflareConfigured()).toBe(false);

      process.env.CLOUDFLARE_ACCOUNT_ID = '   ';
      process.env.CLOUDFLARE_API_TOKEN = '';
      expect(isCloudflareConfigured()).toBe(false);
    });

    it('returns true when both account ID and API token are provided', () => {
      process.env.CLOUDFLARE_ACCOUNT_ID = 'mock_cf_account_123';
      process.env.CLOUDFLARE_API_TOKEN = 'mock_cf_token_456';
      expect(isCloudflareConfigured()).toBe(true);
    });
  });

  describe('getCloudflareModels', () => {
    it('returns default model hierarchy when no custom model is set', () => {
      delete process.env.CLOUDFLARE_AI_MODEL;
      const models = getCloudflareModels();
      expect(models).toContain('@cf/meta/llama-3.1-70b-instruct');
      expect(models).toContain('@cf/meta/llama-3.1-8b-instruct');
    });

    it('prioritizes custom model when specified', () => {
      process.env.CLOUDFLARE_AI_MODEL = '@cf/mistral/mistral-7b-instruct-v0.2';
      const models = getCloudflareModels();
      expect(models[0]).toBe('@cf/mistral/mistral-7b-instruct-v0.2');
    });
  });

  describe('runCloudflareWorkersAI', () => {
    it('throws error when credentials are not configured', async () => {
      delete process.env.CLOUDFLARE_ACCOUNT_ID;
      delete process.env.CLOUDFLARE_API_TOKEN;

      await expect(runCloudflareWorkersAI('Sample text')).rejects.toThrow(
        /Cloudflare Workers AI credentials.*missing/i
      );
    });

    it('executes API request and caches response', async () => {
      process.env.CLOUDFLARE_ACCOUNT_ID = 'test_acc';
      process.env.CLOUDFLARE_API_TOKEN = 'test_tok';

      const mockResponse = {
        success: true,
        result: {
          response: 'Refined academic output with preserved clarity.',
        },
      };

      const fetchSpy = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });
      global.fetch = fetchSpy;

      const result = await runCloudflareWorkersAI('Raw draft text', {
        temperature: 0.3,
      });

      expect(result.text).toBe('Refined academic output with preserved clarity.');
      expect(result.source).toBe('cloudflare-workers-ai');
      expect(fetchSpy).toHaveBeenCalledTimes(1);

      // Verify second call hits cache without calling fetch again
      const cachedResult = await runCloudflareWorkersAI('Raw draft text', {
        temperature: 0.3,
      });
      expect(cachedResult.cached).toBe(true);
      expect(cachedResult.text).toBe(result.text);
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    it('falls back to secondary model if primary model fails', async () => {
      process.env.CLOUDFLARE_ACCOUNT_ID = 'test_acc';
      process.env.CLOUDFLARE_API_TOKEN = 'test_tok';

      let callCount = 0;
      global.fetch = vi.fn().mockImplementation(async () => {
        callCount += 1;
        if (callCount === 1) {
          // First model fails with 503 Overloaded
          return {
            ok: false,
            status: 503,
            text: async () => 'Service Temporarily Unavailable',
          };
        }
        // Second model succeeds
        return {
          ok: true,
          status: 200,
          json: async () => ({
            success: true,
            result: { response: 'Fallback model refined text.' },
          }),
        };
      });

      const result = await runCloudflareWorkersAI('Draft text to refine');
      expect(callCount).toBe(2);
      expect(result.text).toBe('Fallback model refined text.');
    });
  });
});
