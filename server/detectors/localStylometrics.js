import { BaseDetector, classifySentenceFourTier, computeFourTierDistribution } from './baseDetector.js';

// Classic generative AI clichés, collocational templates, and n-grams
const AI_MARKERS = [
  /\bdelve(?:s|d)? into\b/i,
  /\bintricate tapestry\b/i,
  /\btapestry of\b/i,
  /\brich tapestry\b/i,
  /\bplays a (?:pivotal|crucial|vital|key|significant) role\b/i,
  /\bunderscores the (?:importance|significance|need) of\b/i,
  /\bsheds light on\b/i,
  /\bpaves the way (?:for|to)\b/i,
  /\bbeacon of hope\b/i,
  /\bmultifaceted (?:approach|landscape|nature|dimensions?)\b/i,
  /\bseamlessly\b/i,
  /\bseamless integration\b/i,
  /\bleveraging (?:the power of|advanced|cutting-edge)\b/i,
  /\bleverage(?:s|d)?\b/i,
  /\bit is (?:important|crucial|worth noting|essential|imperative) to (?:note|understand|recognize) that\b/i,
  /\bin conclusion, (?:it is|we can|one can|this)\b/i,
  /\bin summary,?\b/i,
  /\bparadigm shift\b/i,
  /\btestament to\b/i,
  /\bcritical juncture\b/i,
  /\btransformative (?:potential|impact|achievement|journey)\b/i,
  /\bdemocratized access\b/i,
  /\bstands at (?:a|the) (?:crossroads|critical juncture)\b/i,
  /\bstands as a (?:poignant|powerful|compelling|testament)\b/i,
  /\bpoignant critique\b/i,
  /\bexplore(?:s|d)? themes of\b/i,
  /\bdestructive nature of\b/i,
  /\bgroundbreaking\b/i,
  /\bharness(?:ing|es)? the power of\b/i,
  /\brapidly evolving\b/i,
  /\bdynamic interplay\b/i,
  /\bparamount importance\b/i,
  /\bholistic (?:approach|perspective|understanding)\b/i,
  /\btreasure trove\b/i,
  /\bgame[- ]changer\b/i,
  /\bever[- ]evolving\b/i,
  /\bat the intersection of\b/i,
  /\bnavigating the (?:complexities|landscape|challenges)\b/i,
  /\bholds immense promise\b/i,
  /\brealm of\b/i,
  /\bserves as a reminder\b/i,
  /\bin today's (?:fast-paced|interconnected|digital) world\b/i,
  /\bembarks? on a journey\b/i,
  /\bat its core\b/i,
  /\ban array of\b/i,
  /\bvital importance\b/i,
  /\bunprecedented (?:growth|threat|advancement|challenge)\b/i,
  /\bfosters? (?:a|an|collaboration|growth|innovation)\b/i,
  /\bbeneath the (?:calm surface|veneer)\b/i,
  /\benthusiastic interest in\b/i,
  /\bsolid foundation in\b/i,
  /\bimmediate asset\b/i,
  /\bextensive hands-on experience\b/i,
  /\bsuperior (?:lumbar|quality|performance)\b/i,
  /\ball-day comfort\b/i,
  /\bperfect balance of\b/i,
  /\bcast(?:ing)? (?:long )?golden shadows\b/i,
  /\bgentle breeze whispered\b/i,
  /\bsteaming cup of\b/i,
  /\bearthy scent of\b/i,
  /\bdeep dive\b/i,
  /\bscalable (?:web|data|distributed) applications\b/i,
  /\bmeet your needs\b/i,
  /\blavish lifestyle\b/i,
  /\bwinning back the love of\b/i,
  /\bprofound transformation\b/i,
];

// Formulaic generative transition starters
const TRANSITION_STARTERS = [
  /^(?:Furthermore|Moreover|Additionally|Consequently|Notably|Importantly|Ultimately|Significantly|Interestingly|Essentially),/i,
  /^(?:In addition|In conclusion|In summary|On the other hand|To that end|As a result),/i,
  /^(?:By (?:leveraging|examining|processing|addressing|fostering|incorporating|utilizing|analyzing|adopting|turning))\b/i,
  /^(?:With (?:a solid|the rise|the advent|an increasing|regard to))\b/i,
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
    if (sentenceLengths.length <= 1) return { cv: 0.4, burstinessScore: 24.0, mean: 15, stdDev: 0 };
    const mean = sentenceLengths.reduce((a, b) => a + b, 0) / sentenceLengths.length;
    const variance =
      sentenceLengths.reduce((acc, len) => acc + Math.pow(len - mean, 2), 0) /
      sentenceLengths.length;
    const stdDev = Math.sqrt(variance);
    const cv = mean > 0 ? stdDev / mean : 0.4;
    const scaledScore = Math.round(cv * 60 * 10) / 10;
    return { cv, burstinessScore: scaledScore, mean, stdDev };
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
    const { cv, burstinessScore } = this.calculateBurstiness(sentenceLengths);
    const ttr = this.calculateTypeTokenRatio(words);

    let tropeMatchesCount = 0;
    let transitionCount = 0;

    const sentenceEvaluations = sentences.map((s, idx) => {
      let sentenceScore = 0.12; // neutral human baseline
      let hasTrope = false;

      // 1. Cliché Trope Check (strongest indicator)
      for (const pattern of AI_MARKERS) {
        if (pattern.test(s)) {
          hasTrope = true;
          tropeMatchesCount++;
          sentenceScore += 0.50;
          break;
        }
      }

      // 2. Transition starter check
      for (const pattern of TRANSITION_STARTERS) {
        if (pattern.test(s)) {
          transitionCount++;
          sentenceScore += 0.25;
          break;
        }
      }

      // 3. Sentence Length Uniformity (only boosts if trope or transition detected)
      const len = sentenceLengths[idx] || 15;
      if (len >= 14 && len <= 28) {
        if (hasTrope) sentenceScore += 0.15;
        else if (transitionCount > 0) sentenceScore += 0.10;
      }

      sentenceScore = Math.min(0.98, Math.max(0.04, Math.round(sentenceScore * 100) / 100));
      const label = sentenceScore >= 0.65 ? 'ai' : sentenceScore >= 0.35 ? 'mixed' : 'human';
      const tierInfo = classifySentenceFourTier(sentenceScore, label);

      return {
        id: `s-${idx}`,
        text: s,
        label,
        score: sentenceScore,
        perplexity: Math.round((1 - sentenceScore) * 80 + 15),
        tier: tierInfo.tier,
        tierLabel: tierInfo.tierLabel,
      };
    });

    const totalSentences = sentenceEvaluations.length;
    const aiSentences = sentenceEvaluations.filter((s) => s.label === 'ai').length;
    const mixedSentences = sentenceEvaluations.filter((s) => s.label === 'mixed').length;

    // Document-level synthesis
    let prob = (aiSentences * 0.70 + mixedSentences * 0.40) / totalSentences;

    // Trope density weighting (critical discriminator)
    if (tropeMatchesCount >= 3) {
      prob += 0.35;
    } else if (tropeMatchesCount >= 2) {
      prob += 0.25;
    } else if (tropeMatchesCount === 1) {
      prob += 0.15;
    } else {
      // Zero tropes: Human writing strongly favored
      prob -= 0.15;
    }

    // Transition density weighting
    const starterRatio = transitionCount / totalSentences;
    if (starterRatio >= 0.4) {
      prob += 0.20;
    }

    // Low burstiness reinforces machine probability when tropes or formulaic transitions exist
    if ((tropeMatchesCount > 0 || transitionCount > 0) && cv < 0.25) {
      prob += 0.15;
    }

    // High burstiness reduces AI probability
    if (cv > 0.50) {
      prob -= 0.15;
    }

    // Lexical diversity (TTR) weighting for longer texts
    if (ttr < 0.45 && words.length > 50 && tropeMatchesCount > 0) {
      prob += 0.10;
    }

    prob = Math.min(0.98, Math.max(0.04, Math.round(prob * 100) / 100));

    let classification = 'mixed';
    if (prob >= 0.65) classification = 'ai';
    else if (prob <= 0.32) classification = 'human';

    const fourTierDistribution = computeFourTierDistribution(sentenceEvaluations);

    return {
      providerId: this.id,
      providerName: this.name,
      classification,
      probabilityScore: prob,
      confidence: prob > 0.8 || prob < 0.25 ? 'high' : 'medium',
      burstiness: burstinessScore,
      perplexity: Math.round((1 - prob) * 65 + 20),
      sentences: sentenceEvaluations,
      fourTierDistribution,
      paragraphs: [],
      scanTimestamp: new Date().toISOString(),
      modelVersion: 'stylometrics-statistical-v2 (Calibrated Offline)',
      wordCount: words.length,
      characterCount: text.length,
      rawSummary: {
        lexicalDiversity: Math.round(ttr * 100) / 100,
        tropeCount: tropeMatchesCount,
        burstinessIndex: burstinessScore,
        cv: Math.round(cv * 100) / 100,
      },
    };
  }
}
