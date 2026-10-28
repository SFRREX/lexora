import { CloudflareDetectorAdapter } from './cloudflareDetector.js';
import { GeminiDetectorAdapter } from './geminiDetector.js';
import { LocalStylometricsAdapter } from './localStylometrics.js';
import { GPTZeroAdapter } from './gptzero.js';
import { CopyleaksAdapter } from './copyleaks.js';

class DetectorManager {
  constructor() {
    this.adapters = {
      cloudflare: new CloudflareDetectorAdapter(),
      gemini: new GeminiDetectorAdapter(),
      stylometrics: new LocalStylometricsAdapter(),
      gptzero: new GPTZeroAdapter(),
      copyleaks: new CopyleaksAdapter(),
    };

    // Catalog of available providers with free tier flags and roles
    this.catalog = [
      {
        id: 'cloudflare',
        name: 'Lexora Neural AI Detector (Cloudflare Llama 3.1 70B)',
        role: 'Open-weight neural forensic classifier. Advanced stylistic perplexity & burstiness modeling.',
        docUrl: 'https://developers.cloudflare.com/workers-ai/',
        envKeys: ['CLOUDFLARE_ACCOUNT_ID', 'CLOUDFLARE_API_TOKEN'],
        isFree: true,
        status: 'implemented',
      },
      {
        id: 'gemini',
        name: 'Lexora Neural AI Detector (Gemini)',
        role: 'Multi-turn neural detection provider. Advanced linguistic perplexity & cadence modeling.',
        docUrl: 'https://ai.google.dev/docs',
        envKeys: ['GEMINI_API_KEY'],
        isFree: true,
        status: 'implemented',
      },
      {
        id: 'stylometrics',
        name: 'Lexora Local Stylometrics Engine',
        role: '100% free and offline. Statistical analysis of burstiness, TTR, and n-gram uniformity.',
        docUrl: 'https://github.com/KalarisLabs/research-agent-skills',
        envKeys: [],
        isFree: true,
        isOffline: true,
        status: 'implemented',
      },
      {
        id: 'gptzero',
        name: 'GPTZero',
        role: 'Commercial detection provider (Requires paid API subscription).',
        docUrl: 'https://docs.gptzero.me/api-reference/',
        envKeys: ['GPTZERO_API_KEY'],
        isFree: false,
        status: 'implemented',
      },
      {
        id: 'copyleaks',
        name: 'Copyleaks',
        role: 'Commercial multilingual classifier (Requires paid enterprise credentials).',
        docUrl: 'https://docs.copyleaks.com/concepts/products/ai-text-detection-api',
        envKeys: ['COPYLEAKS_EMAIL', 'COPYLEAKS_API_KEY'],
        isFree: false,
        status: 'implemented',
      },
      {
        id: 'originality',
        name: 'Originality.ai',
        role: 'Commercial comparative provider for web content (Paid API).',
        docUrl: 'https://docs.originality.ai/',
        envKeys: ['ORIGINALITY_API_KEY'],
        isFree: false,
        status: 'adapter-ready',
      },
      {
        id: 'pangram',
        name: 'Pangram',
        role: 'Research token-level analysis provider (Paid API).',
        docUrl: 'https://www.pangram.work/research/how-it-works',
        envKeys: ['PANGRAM_API_KEY'],
        isFree: false,
        status: 'adapter-ready',
      },
      {
        id: 'winston',
        name: 'Winston AI',
        role: 'Alternative sentence classifier with OCR support (Paid API).',
        docUrl: 'https://winstonai.ai/api-docs',
        envKeys: ['WINSTON_API_KEY'],
        isFree: false,
        status: 'adapter-ready',
      },
    ];
  }

  getStatuses() {
    return this.catalog.map((item) => {
      const adapter = this.adapters[item.id];
      const isConfigured = adapter ? adapter.isConfigured() : false;
      const capabilities = adapter ? adapter.getCapabilities() : null;
      return {
        ...item,
        configured: isConfigured,
        capabilities,
      };
    });
  }

  getAdapter(id) {
    return this.adapters[id] || null;
  }

  calculateAgreement(results) {
    const valid = results.filter((r) => r.success && r.data?.classification);
    if (valid.length < 2) {
      return {
        status: 'insufficient_results',
        label: 'Single Provider Scan',
        explanation: 'Run two or more active providers to inspect inter-detector agreement.',
      };
    }

    const classes = valid.map((r) => r.data.classification);
    const uniqueClasses = new Set(classes);

    if (uniqueClasses.size === 1) {
      const countLabel = valid.length === 2 ? 'Both' : `All ${valid.length}`;
      return {
        status: 'agree',
        label: 'Detectors agree',
        detail: `${countLabel} detectors classified this text as "${classes[0].toUpperCase()}".`,
        explanation:
          'Statistical agreement between independent models increases confidence in surface patterns, but does not constitute forensic proof of authorship.',
      };
    }

    if (uniqueClasses.has('human') && uniqueClasses.has('ai')) {
      return {
        status: 'strongly_disagree',
        label: 'Detectors strongly disagree',
        detail: 'One detector classified the text as Human while another classified it as AI.',
        explanation:
          'Strong disagreement highlights the inherent fragility of statistical detection. Authorship should never be penalized based on conflicting classifier scores.',
      };
    }

    return {
      status: 'partially_disagree',
      label: 'Detectors partially disagree',
      detail: 'Detectors returned mixed classifications or differing boundary probabilities.',
      explanation:
        'Partial disagreement is common in edited, technical, or non-native academic writing where sentence perplexity varies.',
    };
  }

  async runDetection(text, providerIds = ['gemini', 'stylometrics'], options = {}) {
    const trimmed = (text || '').trim();
    if (!trimmed) {
      throw new Error('Text input cannot be empty.');
    }

    // Default to free providers if none specified or if only unconfigured paid providers passed
    const targetProviders = Array.isArray(providerIds) && providerIds.length > 0
      ? providerIds
      : ['gemini', 'stylometrics'];

    const results = [];

    for (const pid of targetProviders) {
      const adapter = this.getAdapter(pid);
      if (!adapter) {
        results.push({
          providerId: pid,
          providerName: pid,
          success: false,
          error: `Provider "${pid}" is not supported or not implemented.`,
        });
        continue;
      }

      if (!adapter.isConfigured()) {
        results.push({
          providerId: adapter.id,
          providerName: adapter.name,
          success: false,
          notConfigured: true,
          error: `${adapter.name} credentials are not configured in your environment.`,
          setupInfo: {
            envKeys: this.catalog.find((c) => c.id === pid)?.envKeys || [],
            docs: adapter.getCapabilities()?.apiDocs || '',
          },
        });
        continue;
      }

      try {
        const normalized = await adapter.detect(trimmed, options);
        results.push({
          providerId: adapter.id,
          providerName: adapter.name,
          success: true,
          data: normalized,
        });
      } catch (err) {
        results.push({
          providerId: adapter.id,
          providerName: adapter.name,
          success: false,
          error: err.message || 'Detection failed.',
        });
      }
    }

    const agreement = this.calculateAgreement(results);

    return {
      results,
      agreement,
      timestamp: new Date().toISOString(),
    };
  }
}

export const detectorManager = new DetectorManager();
