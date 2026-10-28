/**
 * Base Detector Adapter Interface
 * Every detector provider adapter must implement this interface.
 */
export class BaseDetector {
  constructor(id, name) {
    this.id = id;
    this.name = name;
  }

  /**
   * Check if the detector has valid credentials configured in the environment.
   * @returns {boolean}
   */
  isConfigured() {
    throw new Error('isConfigured() must be implemented');
  }

  /**
   * Returns provider capabilities (sentence highlights, paragraph analysis, languages, etc.)
   * @returns {object}
   */
  getCapabilities() {
    return {
      sentenceHighlights: false,
      paragraphScores: false,
      multilingual: false,
      burstinessScore: false,
      perplexityScore: false,
    };
  }

  /**
   * Runs detection on text and normalizes output.
   * @param {string} text
   * @param {object} options
   * @returns {Promise<NormalizedDetectionResult>}
   */
  async detect(_text, _options = {}) {
    throw new Error('detect() must be implemented');
  }
}

/**
 * 4-Tier Provenance Classification
 * Categorizes sentence-level provenance into four granular tiers:
 * 1. 'human-written' (Human-written)
 * 2. 'ai-refined-human' (Human-written & AI-refined)
 * 3. 'ai-refined-ai' (AI-generated & AI-refined)
 * 4. 'ai-generated' (AI-generated)
 */
export function classifySentenceFourTier(score, label) {
  const rawScore =
    typeof score === 'number'
      ? score
      : label === 'ai'
      ? 0.85
      : label === 'mixed'
      ? 0.5
      : 0.15;

  // Defensively normalize percentage-scale scores (0-100) to unit interval (0.0-1.0)
  const s = rawScore > 1 ? rawScore / 100 : Math.max(0, rawScore);

  if (s >= 0.82) {
    return {
      tier: 'ai-generated',
      tierLabel: 'AI-generated',
      color: '#ef4444',
      lightBg: 'rgba(239, 68, 68, 0.15)',
    };
  } else if (s >= 0.55) {
    return {
      tier: 'ai-refined-ai',
      tierLabel: 'AI-generated & AI-refined',
      color: '#f97316',
      lightBg: 'rgba(249, 115, 22, 0.15)',
    };
  } else if (s >= 0.28) {
    return {
      tier: 'ai-refined-human',
      tierLabel: 'Human-written & AI-refined',
      color: '#3b82f6',
      lightBg: 'rgba(59, 130, 246, 0.15)',
    };
  } else {
    return {
      tier: 'human-written',
      tierLabel: 'Human-written',
      color: '#10b981',
      lightBg: 'rgba(16, 185, 129, 0.15)',
    };
  }
}

/**
 * Calculates percentage and count distribution across the 4 provenance tiers
 */
export function computeFourTierDistribution(sentences) {
  if (!Array.isArray(sentences) || sentences.length === 0) {
    return {
      humanWritten: 0,
      humanWrittenAiRefined: 0,
      aiGeneratedAiRefined: 0,
      aiGenerated: 0,
      counts: {
        humanWritten: 0,
        humanWrittenAiRefined: 0,
        aiGeneratedAiRefined: 0,
        aiGenerated: 0,
      },
    };
  }

  const counts = {
    humanWritten: 0,
    humanWrittenAiRefined: 0,
    aiGeneratedAiRefined: 0,
    aiGenerated: 0,
  };

  sentences.forEach((s) => {
    const tier = s.tier || classifySentenceFourTier(s.score, s.label).tier;
    if (tier === 'ai-generated') counts.aiGenerated++;
    else if (tier === 'ai-refined-ai') counts.aiGeneratedAiRefined++;
    else if (tier === 'ai-refined-human') counts.humanWrittenAiRefined++;
    else counts.humanWritten++;
  });

  const total = sentences.length;
  return {
    humanWritten: Math.round((counts.humanWritten / total) * 1000) / 10,
    humanWrittenAiRefined: Math.round((counts.humanWrittenAiRefined / total) * 1000) / 10,
    aiGeneratedAiRefined: Math.round((counts.aiGeneratedAiRefined / total) * 1000) / 10,
    aiGenerated: Math.round((counts.aiGenerated / total) * 1000) / 10,
    counts,
  };
}

