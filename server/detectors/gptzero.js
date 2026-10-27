import { BaseDetector, classifySentenceFourTier, computeFourTierDistribution } from './baseDetector.js';

export class GPTZeroAdapter extends BaseDetector {
  constructor() {
    super('gptzero', 'GPTZero');
  }

  isConfigured() {
    const key = process.env.GPTZERO_API_KEY;
    return Boolean(key && key.trim() && key !== 'your_gptzero_api_key_here');
  }

  getCapabilities() {
    return {
      sentenceHighlights: true,
      paragraphScores: true,
      multilingual: true,
      burstinessScore: true,
      perplexityScore: true,
      inputMinWords: 250, // recommended minimum for statistical confidence
      providerUrl: 'https://gptzero.me',
      apiDocs: 'https://docs.gptzero.me/api-reference/',
    };
  }

  /**
   * Normalizes raw GPTZero response into the Lexora standard schema.
   */
  normalizeDetectionResult(raw, originalText) {
    const doc = raw?.documents?.[0] || raw?.document || {};
    
    // Determine overall class: 'ai' | 'human' | 'mixed'
    const predictedClass = (doc.predicted_class || 'unknown').toLowerCase();
    let classification = 'mixed';
    if (predictedClass === 'ai' || predictedClass === 'completely_generated_prob') {
      classification = 'ai';
    } else if (predictedClass === 'human' || predictedClass === 'human_prob') {
      classification = 'human';
    } else if (predictedClass === 'mixed') {
      classification = 'mixed';
    } else if (typeof doc.completely_generated_prob === 'number') {
      if (doc.completely_generated_prob >= 0.7) classification = 'ai';
      else if (doc.completely_generated_prob <= 0.3) classification = 'human';
      else classification = 'mixed';
    }

    // AI probability (0 to 1)
    const probabilityScore =
      typeof doc.completely_generated_prob === 'number'
        ? Math.round(doc.completely_generated_prob * 100) / 100
        : typeof doc.class_probabilities?.ai === 'number'
        ? Math.round(doc.class_probabilities.ai * 100) / 100
        : null;

    // Sentence-level breakdown
    const rawSentences = doc.sentences || [];
    const sentences = rawSentences.map((s, idx) => {
      const text = s.sentence || '';
      const prob = typeof s.generated_prob === 'number' ? s.generated_prob : 0;
      const isAI = s.highlight_sentence_for_ai || prob > 0.65;
      const isMixed = !isAI && prob >= 0.35;
      const label = isAI ? 'ai' : isMixed ? 'mixed' : 'human';
      const score = Math.round(prob * 100) / 100;
      const tierInfo = classifySentenceFourTier(score, label);
      
      return {
        id: `s-${idx}`,
        text,
        label,
        score,
        perplexity: typeof s.perplexity === 'number' ? Math.round(s.perplexity * 10) / 10 : null,
        tier: tierInfo.tier,
        tierLabel: tierInfo.tierLabel,
      };
    });

    const evaluatedSentences = sentences.length > 0 ? sentences : this._splitFallbackSentences(originalText, classification);
    const fourTierDistribution = computeFourTierDistribution(evaluatedSentences);

    // Paragraph-level breakdown
    const rawParagraphs = doc.paragraphs || [];
    const paragraphs = rawParagraphs.map((p, idx) => ({
      id: `p-${idx}`,
      completelyGeneratedProb: p.completely_generated_prob,
      numSentences: p.num_sentences,
    }));

    return {
      providerId: this.id,
      providerName: this.name,
      classification,
      probabilityScore, // 0.0 - 1.0
      confidence: doc.confidence_category || (probabilityScore > 0.8 || probabilityScore < 0.2 ? 'high' : 'medium'),
      burstiness: typeof doc.overall_burstiness === 'number' ? Math.round(doc.overall_burstiness * 10) / 10 : null,
      perplexity: typeof doc.average_generated_prob === 'number' ? Math.round(doc.average_generated_prob * 100) / 100 : null,
      sentences: evaluatedSentences,
      fourTierDistribution,
      paragraphs,
      scanTimestamp: new Date().toISOString(),
      modelVersion: doc.version || 'v2-predict',
      wordCount: originalText.trim().split(/\s+/).filter(Boolean).length,
      characterCount: originalText.length,
      rawSummary: {
        predicted_class: doc.predicted_class,
        class_probabilities: doc.class_probabilities,
      },
    };
  }

  _splitFallbackSentences(text, overallClass) {
    const raw = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text];
    const score = overallClass === 'ai' ? 0.9 : overallClass === 'human' ? 0.1 : 0.5;
    const tierInfo = classifySentenceFourTier(score, overallClass);
    return raw.map((s, idx) => ({
      id: `s-${idx}`,
      text: s.trim(),
      label: overallClass,
      score,
      perplexity: null,
      tier: tierInfo.tier,
      tierLabel: tierInfo.tierLabel,
    })).filter((s) => s.text.length > 0);
  }

  async detect(text, options = {}) {
    if (!this.isConfigured()) {
      throw new Error(
        'GPTZero API key is not configured. Please set GPTZERO_API_KEY in your .env file.'
      );
    }

    const apiKey = process.env.GPTZERO_API_KEY.trim();
    const endpoint = 'https://api.gptzero.me/v2/predict/text';

    const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
    if (wordCount < 10) {
      throw new Error('Text must contain at least 10 words for statistical evaluation.');
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeoutMs || 20000);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          document: text,
          multiquery: false,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (response.status === 401 || response.status === 403) {
        throw new Error('Invalid GPTZero API key. Please check your credentials in .env');
      }

      if (response.status === 429) {
        throw new Error('GPTZero rate limit reached or quota exhausted. Please try again later.');
      }

      if (!response.ok) {
        const errorBody = await response.text().catch(() => '');
        throw new Error(`GPTZero API returned HTTP ${response.status}: ${errorBody || response.statusText}`);
      }

      const json = await response.json();
      return this.normalizeDetectionResult(json, text);
    } catch (err) {
      clearTimeout(timeout);
      if (err.name === 'AbortError') {
        throw new Error('GPTZero request timed out after 20 seconds.');
      }
      throw err;
    }
  }
}
