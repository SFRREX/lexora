import { BaseDetector, classifySentenceFourTier, computeFourTierDistribution } from './baseDetector.js';

export class CopyleaksAdapter extends BaseDetector {
  constructor() {
    super('copyleaks', 'Copyleaks');
    this.cachedToken = null;
    this.tokenExpiry = 0;
  }

  isConfigured() {
    const key = process.env.COPYLEAKS_API_KEY;
    const email = process.env.COPYLEAKS_EMAIL;
    return Boolean(key && email && key.trim() && email.trim() && key !== 'your_copyleaks_api_key_here');
  }

  getCapabilities() {
    return {
      sentenceHighlights: false,
      paragraphScores: false,
      multilingual: true,
      burstinessScore: false,
      perplexityScore: false,
      inputMinWords: 25,
      providerUrl: 'https://copyleaks.com',
      apiDocs: 'https://docs.copyleaks.com/concepts/products/ai-text-detection-api',
    };
  }

  async getAuthToken() {
    if (this.cachedToken && Date.now() < this.tokenExpiry) {
      return this.cachedToken;
    }

    const email = process.env.COPYLEAKS_EMAIL.trim();
    const key = process.env.COPYLEAKS_API_KEY.trim();

    const res = await fetch('https://id.copyleaks.com/v3/account/login/api', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, key }),
    });

    if (!res.ok) {
      throw new Error(`Copyleaks authentication failed: HTTP ${res.status}`);
    }

    const data = await res.json();
    this.cachedToken = data.access_token;
    // Expire 5 minutes early
    this.tokenExpiry = Date.now() + (data['.expires'] ? new Date(data['.expires']).getTime() - Date.now() - 300000 : 3600000);
    return this.cachedToken;
  }

  normalizeDetectionResult(raw, originalText) {
    // Copyleaks summary format
    // Summary: { summary: { human: 0.2, ai: 0.8 } }
    const summary = raw?.summary || {};
    const aiProb = typeof summary.ai === 'number' ? summary.ai : typeof raw.score === 'number' ? raw.score : 0.5;

    let classification = 'mixed';
    if (aiProb >= 0.7) classification = 'ai';
    else if (aiProb <= 0.3) classification = 'human';

    const sentences = this._splitFallbackSentences(originalText, classification, aiProb);
    const fourTierDistribution = computeFourTierDistribution(sentences);
    const words = originalText.trim().split(/\s+/).filter(Boolean);

    return {
      providerId: this.id,
      providerName: this.name,
      classification,
      probabilityScore: Math.round(aiProb * 100) / 100,
      confidence: aiProb > 0.85 || aiProb < 0.15 ? 'high' : 'medium',
      burstiness: null,
      perplexity: null,
      sentences,
      fourTierDistribution,
      paragraphs: [],
      scanTimestamp: new Date().toISOString(),
      modelVersion: 'copyleaks-writer-detector-v2',
      wordCount: words.length,
      characterCount: originalText.length,
      rawSummary: summary,
    };
  }

  _splitFallbackSentences(text, overallClass, score) {
    const raw = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text];
    const roundedScore = Math.round(score * 100) / 100;
    const tierInfo = classifySentenceFourTier(roundedScore, overallClass);
    return raw.map((s, idx) => ({
      id: `s-${idx}`,
      text: s.trim(),
      label: overallClass,
      score: roundedScore,
      perplexity: null,
      tier: tierInfo.tier,
      tierLabel: tierInfo.tierLabel,
    })).filter((s) => s.text.length > 0);
  }

  async detect(text, options = {}) {
    if (!this.isConfigured()) {
      throw new Error(
        'Copyleaks is not configured. Please set COPYLEAKS_EMAIL and COPYLEAKS_API_KEY in your .env file.'
      );
    }

    const token = await this.getAuthToken();
    const scanId = `lexora_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const endpoint = `https://api.copyleaks.com/v2/writer-detector/${scanId}/check`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeoutMs || 25000);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(`Copyleaks API returned HTTP ${response.status}: ${errorText}`);
      }

      const json = await response.json();
      return this.normalizeDetectionResult(json, text);
    } catch (err) {
      clearTimeout(timeout);
      if (err.name === 'AbortError') {
        throw new Error('Copyleaks scan timed out after 25 seconds.');
      }
      throw err;
    }
  }
}
