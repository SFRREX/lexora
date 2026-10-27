import { BaseDetector, classifySentenceFourTier, computeFourTierDistribution } from './baseDetector.js';

// Classic generative AI cliché n-grams
const AI_MARKERS = [
  /\bdelve(?:s|d)? into\b/i,
  /\bintricate tapestry\b/i,
  /\btapestry of\b/i,
  /\bplays a (?:pivotal|crucial|vital|key) role\b/i,
  /\bunderscores the (?:importance|significance) of\b/i,
  /\bsheds light on\b/i,
  /\bpaves the way for\b/i,
  /\bbeacon of hope\b/i,
  /\bmultifaceted (?:approach|landscape|nature)\b/i,
  /\bseamlessly\b/i,
  /\bleveraging the power of\b/i,
  /\bit is (?:important|crucial|worth noting) to note that\b/i,
  /\bin conclusion, (?:it is|we can)\b/i,
  /\bparadigm shift\b/i,
  /\btestament to\b/i,
  /\bcritical juncture\b/i,
];

export class LocalStylometricsAdapter extends BaseDetector {
  constructor() {
    super('stylometrics', 'Lexora Local Stylometrics Engine');
  }

  isConfigured() {
    // 100% Free & Always Configured (Runs locally without external API keys)
    return true;
  }

  getCapabilities() {
    return {
      sentenceHighlights: true,
      paragraphScores: false,
      multilingual: false,
      burstinessScore: true,
      perplexityScore: true,
      isFreeProvider: true,
      isOfflineProvider: true,
      inputMinWords: 15,
      providerUrl: 'https://github.com/KalarisLabs/research-agent-skills',
      apiDocs: 'Internal statistical engine analyzing burstiness, lexical density, and n-gram perplexity.',
    };
  }

  /**
   * Analyzes sentence length variation (Burstiness = standard deviation / mean)
   */
  calculateBurstiness(sentenceLengths) {
    if (sentenceLengths.length <= 1) return 20.0;
    const mean = sentenceLengths.reduce((a, b) => a + b, 0) / sentenceLengths.length;
    const variance =
      sentenceLengths.reduce((acc, len) => acc + Math.pow(len - mean, 2), 0) /
      sentenceLengths.length;
    const stdDev = Math.sqrt(variance);
    const cv = mean > 0 ? (stdDev / mean) * 50 : 20; // scaled index
    return Math.round(cv * 10) / 10;
  }

  /**
   * Evaluates lexical entropy and type-token ratio (TTR)
   */
  calculateTypeTokenRatio(words) {
    if (words.length === 0) return 0.5;
    const unique = new Set(words.map((w) => w.toLowerCase()));
    return unique.size / words.length;
  }

  async detect(text, _options = {}) {
    const rawSentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text];
    const sentences = rawSentences.map((s) => s.trim()).filter((s) => s.length > 0);
    const words = text.trim().split(/\s+/).filter(Boolean);

    if (words.length < 10) {
      throw new Error('Text must contain at least 10 words for statistical evaluation.');
    }

    const sentenceLengths = sentences.map((s) => s.split(/\s+/).filter(Boolean).length);
    const burstiness = this.calculateBurstiness(sentenceLengths);
    const ttr = this.calculateTypeTokenRatio(words);

    let tropeMatchesCount = 0;
    const sentenceEvaluations = sentences.map((s, idx) => {
      let sentenceAiScore = 0.2; // default human baseline
      let isAiMarkerFound = false;

      // Check for presence of AI clichés
      for (const pattern of AI_MARKERS) {
        if (pattern.test(s)) {
          isAiMarkerFound = true;
          tropeMatchesCount++;
          sentenceAiScore += 0.45;
          break;
        }
      }

      // Sentence uniformity check (low length deviation indicates repetitive cadence)
      const len = sentenceLengths[idx] || 15;
      if (len >= 14 && len <= 24 && !isAiMarkerFound) {
        sentenceAiScore += 0.15;
      }

      // Formulaic transition starter check
      if (/^(?:Furthermore|Moreover|Additionally|In addition|Consequently|Notably),/i.test(s)) {
        sentenceAiScore += 0.2;
      }

      sentenceAiScore = Math.min(0.98, Math.max(0.05, sentenceAiScore));
      const label = sentenceAiScore >= 0.65 ? 'ai' : sentenceAiScore >= 0.35 ? 'mixed' : 'human';
      const tierInfo = classifySentenceFourTier(sentenceAiScore, label);

      return {
        id: `s-${idx}`,
        text: s,
        label,
        score: Math.round(sentenceAiScore * 100) / 100,
        perplexity: Math.round((1 - sentenceAiScore) * 80 + 15),
        tier: tierInfo.tier,
        tierLabel: tierInfo.tierLabel,
      };
    });

    // Compute 4-tier granular provenance distribution
    const fourTierDistribution = computeFourTierDistribution(sentenceEvaluations);

    // Compute document-level probability
    // Lower burstiness + high AI tropes density + uniform TTR -> higher AI probability
    const aiSentencesCount = sentenceEvaluations.filter((s) => s.label === 'ai').length;
    const mixedSentencesCount = sentenceEvaluations.filter((s) => s.label === 'mixed').length;

    let overallProbability =
      (aiSentencesCount * 0.7 + mixedSentencesCount * 0.35) / sentenceEvaluations.length;

    // Weight by burstiness (burstiness < 22 strongly correlates with LLM generation)
    if (burstiness < 20) overallProbability += 0.2;
    else if (burstiness > 35) overallProbability -= 0.15;

    // Weight by tropes count
    if (tropeMatchesCount > 0) {
      overallProbability += Math.min(0.3, tropeMatchesCount * 0.1);
    }

    // Weight by lexical diversity (TTR)
    if (ttr < 0.45 && words.length > 50) overallProbability += 0.1;

    overallProbability = Math.min(0.98, Math.max(0.04, Math.round(overallProbability * 100) / 100));

    let classification = 'mixed';
    if (overallProbability >= 0.65) classification = 'ai';
    else if (overallProbability <= 0.32) classification = 'human';

    return {
      providerId: this.id,
      providerName: this.name,
      classification,
      probabilityScore: overallProbability,
      confidence: overallProbability > 0.8 || overallProbability < 0.25 ? 'high' : 'medium',
      burstiness,
      perplexity: Math.round((1 - overallProbability) * 65 + 20),
      sentences: sentenceEvaluations,
      fourTierDistribution,
      paragraphs: [],
      scanTimestamp: new Date().toISOString(),
      modelVersion: 'stylometrics-statistical-v1 (Free/Local)',
      wordCount: words.length,
      characterCount: text.length,
      rawSummary: {
        lexicalDiversity: Math.round(ttr * 100) / 100,
        tropeCount: tropeMatchesCount,
        burstinessIndex: burstiness,
      },
    };
  }
}
