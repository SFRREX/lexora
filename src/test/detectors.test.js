import { describe, it, expect, beforeEach } from 'vitest';
import { GPTZeroAdapter } from '../../server/detectors/gptzero.js';
import { CopyleaksAdapter } from '../../server/detectors/copyleaks.js';
import { GeminiDetectorAdapter } from '../../server/detectors/geminiDetector.js';
import { LocalStylometricsAdapter } from '../../server/detectors/localStylometrics.js';
import { detectorManager } from '../../server/detectors/detectorManager.js';
import {
  classifySentenceFourTier,
  computeFourTierDistribution,
} from '../../server/detectors/baseDetector.js';
import {
  cachePut,
  cacheGet,
  clearCache,
  getCacheStats,
  enqueue,
  setBackoffUntil,
  resetBackoff,
  sanitizeAndLocateCorrections,
} from '../../server/geminiService.js';

describe('Detectors & Service Layer', () => {
  beforeEach(() => {
    clearCache();
    resetBackoff();
  });

  describe('Adapters', () => {
    it('normalizes GPTZero responses accurately', () => {
      const gptzero = new GPTZeroAdapter();
      const mock = {
        documents: [
          {
            completely_generated_prob: 0.94,
            overall_burstiness: 32.5,
            predicted_class: 'ai',
            confidence_category: 'high',
            sentences: [
              { sentence: 'Autonomous agents delve into environments.', generated_prob: 0.95, highlight_sentence_for_ai: true, perplexity: 14.2 },
              { sentence: 'They coordinate effectively.', generated_prob: 0.20, highlight_sentence_for_ai: false, perplexity: 45.1 }
            ]
          }
        ]
      };

      const normalized = gptzero.normalizeDetectionResult(mock, 'Autonomous agents delve into environments. They coordinate effectively.');
      expect(normalized.classification).toBe('ai');
      expect(normalized.probabilityScore).toBe(0.94);
      expect(normalized.confidence).toBe('high');
      expect(normalized.sentences).toHaveLength(2);
      expect(normalized.sentences[0].label).toBe('ai');
      expect(normalized.sentences[1].label).toBe('human');
    });

    it('reports Copyleaks unconfigured without env keys', () => {
      const copyleaks = new CopyleaksAdapter();
      expect(copyleaks.isConfigured()).toBe(false);
      const normalized = copyleaks.normalizeDetectionResult({ summary: { ai: 0.85, human: 0.15 } }, 'Test document.');
      expect(normalized.classification).toBe('ai');
      expect(normalized.probabilityScore).toBe(0.85);
    });

    it('runs free offline Local Stylometrics without external API keys', async () => {
      const stylometrics = new LocalStylometricsAdapter();
      expect(stylometrics.isConfigured()).toBe(true);
      const text = 'In recent years, we delve into the intricate tapestry of multi-agent architectures. Furthermore, this plays a pivotal role in modern software systems.';
      const result = await stylometrics.detect(text);
      expect(result.providerId).toBe('stylometrics');
      expect(result.probabilityScore).toBeGreaterThan(0.6);
      expect(result.sentences.length).toBeGreaterThanOrEqual(2);
      expect(typeof result.burstiness).toBe('number');
      expect(result.fourTierDistribution).toBeDefined();
    });

    it('normalizes Gemini Neural Detector responses', () => {
      const geminiDetector = new GeminiDetectorAdapter();
      const mock = {
        overall_classification: 'ai',
        probability_score: 0.91,
        confidence_category: 'high',
        burstiness_score: 24.5,
        perplexity_score: 31.0,
        reasoning_summary: 'Predictable sentence cadence with stock generative formulations.',
        sentences: [
          { text: 'We delve into the tapestry.', classification: 'ai', score: 0.95, perplexity: 18.0 }
        ]
      };
      const normalized = geminiDetector.normalizeDetectionResult(mock, 'We delve into the tapestry.');
      expect(normalized.classification).toBe('ai');
      expect(normalized.probabilityScore).toBe(0.91);
      expect(normalized.burstiness).toBe(24.5);
    });
  });

  describe('Inter-detector agreement matrix', () => {
    it('evaluates agreement, disagreement, and single provider states', () => {
      const agree = [
        { success: true, data: { classification: 'ai' } },
        { success: true, data: { classification: 'ai' } }
      ];
      expect(detectorManager.calculateAgreement(agree).status).toBe('agree');
      expect(detectorManager.calculateAgreement(agree).detail).toContain('Both detectors');

      const agreeThree = [
        { success: true, data: { classification: 'ai' } },
        { success: true, data: { classification: 'ai' } },
        { success: true, data: { classification: 'ai' } }
      ];
      expect(detectorManager.calculateAgreement(agreeThree).detail).toContain('All 3 detectors');

      const strongDisagree = [
        { success: true, data: { classification: 'human' } },
        { success: true, data: { classification: 'ai' } }
      ];
      expect(detectorManager.calculateAgreement(strongDisagree).status).toBe('strongly_disagree');

      const partialDisagree = [
        { success: true, data: { classification: 'mixed' } },
        { success: true, data: { classification: 'ai' } }
      ];
      expect(detectorManager.calculateAgreement(partialDisagree).status).toBe('partially_disagree');

      const single = [{ success: true, data: { classification: 'ai' } }];
      expect(detectorManager.calculateAgreement(single).status).toBe('insufficient_results');
    });
  });

  describe('Four-Tier Granular Classification', () => {
    it('accurately classifies four-tier sentence tiers and distributions', () => {
      expect(classifySentenceFourTier(0.12, 'human').tier).toBe('human-written');
      expect(classifySentenceFourTier(0.38, 'mixed').tier).toBe('ai-refined-human');
      expect(classifySentenceFourTier(0.62, 'mixed').tier).toBe('ai-refined-ai');
      expect(classifySentenceFourTier(0.91, 'ai').tier).toBe('ai-generated');

      const sentences = [
        { tier: 'human-written' },
        { tier: 'human-written' },
        { tier: 'ai-refined-human' },
        { tier: 'ai-refined-ai' },
        { tier: 'ai-generated' },
      ];
      const dist = computeFourTierDistribution(sentences);
      expect(dist.humanWritten).toBe(40);
      expect(dist.humanWrittenAiRefined).toBe(20);
      expect(dist.aiGeneratedAiRefined).toBe(20);
      expect(dist.aiGenerated).toBe(20);
    });
  });

  describe('LRU Cache & Rate-limit Queue in geminiService', () => {
    it('strictly caps cache size at 200 items with eviction', () => {
      expect(getCacheStats().size).toBe(0);
      for (let i = 0; i < 205; i++) {
        cachePut(`k_${i}`, { val: i });
      }
      expect(getCacheStats().size).toBe(200);
      expect(cacheGet('k_0')).toBeNull();
      expect(cacheGet('k_4')).toBeNull();
      expect(cacheGet('k_204')).toEqual({ val: 204 });
    });

    it('serializes requests and respects backoff window', async () => {
      setBackoffUntil(Date.now() + 25);
      const start = Date.now();
      const elapsed = await enqueue(async () => Date.now() - start);
      expect(elapsed).toBeGreaterThanOrEqual(15);
    });

    it('sanitizes and eliminates overlapping spans', () => {
      const source = 'I has a alot of misteaks and I was was there.';
      const candidates = [
        { original: 'I has', replacement: 'I have', type: 'grammar' },
        { original: 'has a', replacement: 'has an', type: 'grammar' },
        { original: 'missing text', replacement: 'none', type: 'spelling' },
        { original: 'alot', replacement: 'a lot', type: 'spelling' },
        { original: 'was was', replacement: 'was', type: 'grammar' },
      ];
      const spans = sanitizeAndLocateCorrections(candidates, source);
      expect(spans).toHaveLength(3);
      expect(spans[0].original).toBe('I has');
      expect(spans[1].original).toBe('alot');
      expect(spans[2].original).toBe('was was');

      for (let i = 1; i < spans.length; i++) {
        expect(spans[i].startIndex).toBeGreaterThanOrEqual(spans[i - 1].endIndex);
      }
    });
  });
});
