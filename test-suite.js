import assert from 'node:assert/strict';
import { GPTZeroAdapter } from './server/detectors/gptzero.js';
import { CopyleaksAdapter } from './server/detectors/copyleaks.js';
import { GeminiDetectorAdapter } from './server/detectors/geminiDetector.js';
import { LocalStylometricsAdapter } from './server/detectors/localStylometrics.js';
import { detectorManager } from './server/detectors/detectorManager.js';
import {
  refineWithRules,
  extractCitations,
  maskCitationsWithPlaceholders,
  unmaskCitationsFromPlaceholders,
  extractStatistics,
  expandContractions,
  addAcademicTransitions,
  convertToAcademicPassive,
  replaceWithFormalSynonyms,
} from './server/academicRefinerService.js';
import {
  classifySentenceFourTier,
  computeFourTierDistribution,
} from './server/detectors/baseDetector.js';
import {
  calculateEvaluationMetrics,
  calculateRocAuc,
  calculateInterDetectorAgreement,
} from './src/utils/researchMetrics.js';
import {
  cachePut,
  cacheGet,
  clearCache,
  getCacheStats,
  enqueue,
  setBackoffUntil,
  resetBackoff,
  sanitizeAndLocateCorrections,
} from './server/geminiService.js';
import { extractRuleBasedGrammarSpans } from './src/utils/textRules.js';

console.log('--- Running Lexora AI Intelligence Suite Tests ---\n');

// 1. Test GPTZero Adapter Normalization
console.log('1. Testing GPTZero Adapter Normalization...');
const gptzero = new GPTZeroAdapter();

const mockGptZeroResponse = {
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

const normalized = gptzero.normalizeDetectionResult(
  mockGptZeroResponse,
  'Autonomous agents delve into environments. They coordinate effectively.'
);

assert.equal(normalized.classification, 'ai', 'Expected classification to be ai');
assert.equal(normalized.probabilityScore, 0.94, 'Expected probability score 0.94');
assert.equal(normalized.confidence, 'high', 'Expected confidence high');
assert.equal(normalized.sentences.length, 2, 'Expected 2 normalized sentences');
assert.equal(normalized.sentences[0].label, 'ai', 'First sentence should be ai');
assert.equal(normalized.sentences[1].label, 'human', 'Second sentence should be human');
console.log('   ✓ GPTZero response normalization passed.');

// 1b. Test Copyleaks Adapter instantiation & normalization
console.log('1b. Testing Copyleaks Adapter Normalization...');
const copyleaks = new CopyleaksAdapter();
assert.equal(copyleaks.isConfigured(), false, 'Copyleaks should report unconfigured without env keys');
const copyleaksNorm = copyleaks.normalizeDetectionResult({ summary: { ai: 0.85, human: 0.15 } }, 'Test document.');
assert.equal(copyleaksNorm.classification, 'ai');
assert.equal(copyleaksNorm.probabilityScore, 0.85);
console.log('   ✓ Copyleaks normalization passed.');

// 1c. Test Free Local Stylometrics Adapter
console.log('1c. Testing Free Local Stylometrics Adapter...');
const stylometrics = new LocalStylometricsAdapter();
assert.equal(stylometrics.isConfigured(), true, 'Local Stylometrics should always be configured and free');
const testAiText = 'In recent years, we delve into the intricate tapestry of multi-agent architectures. Furthermore, this plays a pivotal role in modern software systems.';
const localResult = await stylometrics.detect(testAiText);
assert.equal(localResult.providerId, 'stylometrics');
assert.ok(localResult.probabilityScore > 0.6, 'Should detect high AI probability due to multiple AI tropes');
assert.ok(localResult.sentences.length >= 2, 'Should evaluate multiple sentences');
assert.ok(typeof localResult.burstiness === 'number', 'Burstiness should be a number');
console.log(`   ✓ Local Stylometrics passed (Score: ${localResult.probabilityScore}, Burstiness: ${localResult.burstiness}).`);

// 1d. Test Free Gemini Neural Detector Adapter
console.log('1d. Testing Free Gemini Neural Detector Adapter...');
const geminiDetector = new GeminiDetectorAdapter();
assert.equal(typeof geminiDetector.isConfigured(), 'boolean');
const mockGeminiDetection = {
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
const geminiNorm = geminiDetector.normalizeDetectionResult(mockGeminiDetection, 'We delve into the tapestry.');
assert.equal(geminiNorm.classification, 'ai');
assert.equal(geminiNorm.probabilityScore, 0.91);
assert.equal(geminiNorm.burstiness, 24.5);
console.log('   ✓ Gemini Neural Detector normalization passed.');

// 2. Test Missing Credentials Error Handling
console.log('2. Testing Honest Unconfigured Provider Handling...');
const originalKey = process.env.GPTZERO_API_KEY;
delete process.env.GPTZERO_API_KEY;

assert.equal(gptzero.isConfigured(), false, 'isConfigured should return false when key is missing');
await assert.rejects(
  async () => await gptzero.detect('Sample text for testing that has enough words to analyze properly.'),
  /GPTZero API key is not configured/,
  'Expected clear unconfigured error without faking results'
);
if (originalKey) process.env.GPTZERO_API_KEY = originalKey;
console.log('   ✓ Honest unconfigured state passed.');

// 3. Test Inter-Detector Agreement Matrix
console.log('3. Testing Multi-Provider Agreement Matrix...');
const agreeCases = [
  { success: true, data: { classification: 'ai' } },
  { success: true, data: { classification: 'ai' } }
];
assert.equal(detectorManager.calculateAgreement(agreeCases).status, 'agree');

const strongDisagree = [
  { success: true, data: { classification: 'human' } },
  { success: true, data: { classification: 'ai' } }
];
assert.equal(detectorManager.calculateAgreement(strongDisagree).status, 'strongly_disagree');

const partialDisagree = [
  { success: true, data: { classification: 'mixed' } },
  { success: true, data: { classification: 'ai' } }
];
assert.equal(detectorManager.calculateAgreement(partialDisagree).status, 'partially_disagree');

const singleProvider = [
  { success: true, data: { classification: 'ai' } }
];
assert.equal(detectorManager.calculateAgreement(singleProvider).status, 'insufficient_results');
console.log('   ✓ Inter-detector agreement calculation passed.');

// 4. Test Research Metrics Engine (Precision, Recall, F1, FPR, FNR, ROC-AUC)
console.log('4. Testing Statistical Classification Metrics...');
// Ground truth vs predictions:
// 4 AI items: 3 predicted AI (TP=3), 1 predicted Human (FN=1)
// 4 Human items: 3 predicted Human (TN=3), 1 predicted AI (FP=1)
const evalSamples = [
  { groundTruth: 'ai', predicted: 'ai', probability: 0.95 },
  { groundTruth: 'ai', predicted: 'ai', probability: 0.88 },
  { groundTruth: 'ai', predicted: 'ai', probability: 0.76 },
  { groundTruth: 'ai', predicted: 'human', probability: 0.35 },
  { groundTruth: 'human', predicted: 'human', probability: 0.10 },
  { groundTruth: 'human', predicted: 'human', probability: 0.15 },
  { groundTruth: 'human', predicted: 'human', probability: 0.22 },
  { groundTruth: 'human', predicted: 'ai', probability: 0.70 },
];

const metrics = calculateEvaluationMetrics(evalSamples, 0.5);
assert.equal(metrics.tp, 3, 'TP should be 3');
assert.equal(metrics.fn, 1, 'FN should be 1');
assert.equal(metrics.tn, 3, 'TN should be 3');
assert.equal(metrics.fp, 1, 'FP should be 1');

// Precision: 3 / (3 + 1) = 0.75
assert.equal(metrics.precision, 0.75, 'Precision should be 0.75');
// Recall: 3 / (3 + 1) = 0.75
assert.equal(metrics.recall, 0.75, 'Recall should be 0.75');
// F1: 2 * (0.75 * 0.75) / 1.5 = 0.75
assert.equal(metrics.f1Score, 0.75, 'F1 score should be 0.75');
// FPR: 1 / (1 + 3) = 0.25
assert.equal(metrics.fpr, 0.25, 'FPR should be 0.25');
// FNR: 1 / (1 + 3) = 0.25
assert.equal(metrics.fnr, 0.25, 'FNR should be 0.25');
assert.ok(metrics.rocAuc > 0.8, 'ROC-AUC should be greater than 0.8');
const directAuc = calculateRocAuc(evalSamples);
assert.equal(Math.round(directAuc * 1000) / 1000, metrics.rocAuc);
console.log(`   ✓ Research metrics passed (Precision: ${metrics.precision}, Recall: ${metrics.recall}, F1: ${metrics.f1Score}, ROC-AUC: ${metrics.rocAuc}).`);

// 5. Test Inter-Detector Cohen's Kappa
console.log('5. Testing Inter-Detector Agreement Index...');
const predsA = ['ai', 'ai', 'human', 'human', 'mixed'];
const predsB = ['ai', 'ai', 'human', 'ai', 'mixed'];
const kappaResult = calculateInterDetectorAgreement(predsA, predsB);
assert.ok(kappaResult.cohensKappa > 0.5, 'Kappa should show substantial agreement');
console.log(`   ✓ Inter-detector Cohen's kappa passed (Kappa: ${kappaResult.cohensKappa}, Interpretation: "${kappaResult.interpretation}").`);

// 6. Test Academic Refiner Unslop Engine & Citation Protection
console.log('6. Testing Academic Refiner Unslop & Citation Protection...');
const draftText = `In recent years, we delve into the intricate tapestry of genomics [1, 2]. It is important to note that this plays a pivotal role in 42.5% of cases (Smith et al., 2023).`;

const citations = extractCitations(draftText);
assert.deepEqual(citations, ['[1, 2]', '(Smith et al., 2023)'], 'Should extract bracketed and author-year citations');

const stats = extractStatistics(draftText);
assert.ok(stats.includes('42.5%'), 'Should extract 42.5%');

const refined = refineWithRules(draftText, 'academic', 'balanced');
assert.ok(!refined.refinedText.includes('delve into'), 'Should strip "delve into"');
assert.ok(!refined.refinedText.includes('tapestry of'), 'Should strip "tapestry of"');
assert.ok(!refined.refinedText.includes('plays a pivotal role'), 'Should strip "plays a pivotal role"');
assert.ok(refined.refinedText.includes('[1, 2]'), 'Must preserve [1, 2] citations');
assert.ok(refined.refinedText.includes('(Smith et al., 2023)'), 'Must preserve (Smith et al., 2023)');
assert.ok(refined.refinedText.includes('42.5%'), 'Must preserve empirical statistics');
console.log('   ✓ Academic unslop and citation protection passed.');

// 7. Test Scholarly Transformation Methods (Contraction Expansion, Transitions, Passive Voice, Synonyms)
console.log('7. Testing Scholarly Transformation Methods...');
const informalText = "Don't assume we can't test it. We conducted the experiment and we didn't find errors. It's good to fix this.";

// 7a. Contraction Expansion
const expanded = expandContractions(informalText);
assert.ok(expanded.text.includes('Do not'), 'Should expand capitalized Don\'t -> Do not');
assert.ok(expanded.text.includes('cannot'), 'Should expand can\'t -> cannot');
assert.ok(expanded.text.includes('did not'), 'Should expand didn\'t -> did not');
assert.ok(expanded.text.includes('It is'), 'Should expand It\'s -> It is');
assert.equal(expanded.count, 4, 'Should count 4 contractions');
console.log('   ✓ Contraction expansion passed.');

// 7b. Academic Passive Voice
const passive = convertToAcademicPassive(informalText);
assert.ok(passive.text.includes('The experiment was conducted'), 'Should convert "We conducted the experiment" to passive');
console.log('   ✓ Academic passive voice transformation passed.');

// 7c. Academic Synonyms
const synonyms = replaceWithFormalSynonyms("This is a good result and will fix the issue.");
assert.ok(synonyms.text.includes('favorable'), 'Should replace "good" with "favorable"');
assert.ok(synonyms.text.includes('resolve'), 'Should replace "fix" with "resolve"');
console.log('   ✓ Academic synonym replacement passed.');

// 7d. Academic Transitions
const withTransitions = addAcademicTransitions("The study began with sample gathering. We observed significant variations across groups.");
assert.ok(withTransitions.text && withTransitions.text.length > 0, 'Transitions method should return augmented text');
console.log('   ✓ Academic transition insertion passed.');

// 7e. Full Pipeline with Toggles
const pipelineResult = refineWithRules(informalText, 'academic', 'balanced', {
  expandContractions: true,
  passiveVoice: true,
  formalSynonyms: true,
  addTransitions: true,
});
assert.ok(!pipelineResult.refinedText.includes("don't"), 'Pipeline should eliminate contractions');
assert.ok(pipelineResult.contractionCount >= 3, 'Pipeline should track contraction count');
console.log('   ✓ Full scholarly transformation pipeline passed.');

// 8. Test Citation Placeholder Isolation & Restoration
console.log('8. Testing Citation Placeholder Isolation & Verbatim Restoration...');
const academicDraftWithCitations =
  'Sampling methods delve into motion planning (Karaman & Frazzoli, 2011, pp. 83–86) and decentralized agents [1, 2]. As demonstrated by (Smith et al., 2023), it is worth noting that DOI 10.1038/s41586-020-2649-2 is pivotal.';

const { text: maskedCitations, mapping: citMap } = maskCitationsWithPlaceholders(academicDraftWithCitations);
assert.ok(maskedCitations.includes('[[REF_1]]'), 'Should replace first citation with [[REF_1]]');
assert.ok(maskedCitations.includes('[[REF_2]]'), 'Should replace bracket citation with placeholder');
assert.ok(!maskedCitations.includes('Karaman & Frazzoli'), 'Author names should be masked inside placeholders');

const unmaskedCitations = unmaskCitationsFromPlaceholders(maskedCitations, citMap);
assert.equal(unmaskedCitations, academicDraftWithCitations, 'Unmasking should restore exact original citations verbatim');

const refinedWithCitationIsolation = refineWithRules(academicDraftWithCitations, 'academic', 'balanced');
assert.ok(refinedWithCitationIsolation.refinedText.includes('(Karaman & Frazzoli, 2011, pp. 83–86)'), 'Refiner must preserve APA citation with page numbers');
assert.ok(refinedWithCitationIsolation.refinedText.includes('[1, 2]'), 'Refiner must preserve bracket citation');
assert.ok(refinedWithCitationIsolation.refinedText.includes('10.1038/s41586-020-2649-2'), 'Refiner must preserve DOI citation');
assert.ok(!refinedWithCitationIsolation.refinedText.includes('delve into'), 'Refiner should remove slop outside citations');
assert.equal(refinedWithCitationIsolation.isolatedCitationsCount, 4, 'Should count 4 isolated citations');
console.log('   ✓ Citation placeholder isolation and verbatim restoration passed.');

// 9. Test Four-Tier Granular Classification Framework
console.log('9. Testing Four-Tier Granular Provenance Classification...');
const humanSentence = classifySentenceFourTier(0.12, 'human');
assert.equal(humanSentence.tier, 'human-written', 'Low score should be classified as human-written');
assert.equal(humanSentence.tierLabel, 'Human-written');

const humanRefinedSentence = classifySentenceFourTier(0.38, 'mixed');
assert.equal(humanRefinedSentence.tier, 'ai-refined-human', '0.38 score should be classified as human-written & ai-refined');

const aiRefinedSentence = classifySentenceFourTier(0.62, 'mixed');
assert.equal(aiRefinedSentence.tier, 'ai-refined-ai', '0.62 score should be classified as ai-generated & ai-refined');

const aiSentence = classifySentenceFourTier(0.91, 'ai');
assert.equal(aiSentence.tier, 'ai-generated', '0.91 score should be classified as ai-generated');

const mockSentences = [
  { tier: 'human-written' },
  { tier: 'human-written' },
  { tier: 'ai-refined-human' },
  { tier: 'ai-refined-ai' },
  { tier: 'ai-generated' },
];
const distribution = computeFourTierDistribution(mockSentences);
assert.equal(distribution.humanWritten, 40, '2/5 should be 40% humanWritten');
assert.equal(distribution.humanWrittenAiRefined, 20, '1/5 should be 20% humanWrittenAiRefined');
assert.equal(distribution.aiGeneratedAiRefined, 20, '1/5 should be 20% aiGeneratedAiRefined');
assert.equal(distribution.aiGenerated, 20, '1/5 should be 20% aiGenerated');
console.log('   ✓ Four-tier classification and distribution calculation passed.');

// 10. Test Local Stylometrics 4-Tier Distribution Integration
console.log('10. Testing Local Stylometrics 4-Tier Distribution Output...');
const stylometricsResult = await stylometrics.detect(
  'Sampling methods in motion planning coordinate decentralized agents. These techniques provide provable completeness and asymptotic optimality. In addition, experimental validation demonstrates significant reductions in trajectory planning overhead.'
);
assert.ok(stylometricsResult.fourTierDistribution, 'Stylometrics must include fourTierDistribution');
assert.equal(typeof stylometricsResult.fourTierDistribution.humanWritten, 'number', 'humanWritten percentage must be numeric');
assert.ok(Array.isArray(stylometricsResult.sentences), 'Must have sentences array');
assert.ok(stylometricsResult.sentences[0].tier, 'Sentences must include provenance tier');
assert.ok(stylometricsResult.sentences[0].tierLabel, 'Sentences must include provenance tierLabel');
console.log('   ✓ Local Stylometrics 4-tier distribution integration passed.');

// 11. Test LRU Sliding-Window Cache & Eviction (Resilient Architecture)
console.log('11. Testing LRU Sliding-Window Cache & Capacity Eviction...');
clearCache();
assert.equal(getCacheStats().size, 0, 'Cache should start empty after clearCache');

for (let i = 0; i < 205; i++) {
  cachePut(`key_${i}`, { data: `value_${i}` });
}

const cacheStats = getCacheStats();
assert.equal(cacheStats.size, 200, 'Cache size must be strictly capped at 200 entries');
assert.equal(cacheGet('key_0'), null, 'Oldest item key_0 must be evicted');
assert.equal(cacheGet('key_4'), null, 'key_4 should be evicted as part of the first 5 evictions');
assert.deepEqual(cacheGet('key_204'), { data: 'value_204' }, 'Latest item must be present');
console.log('   ✓ LRU sliding-window cache and 200-item eviction passed.');

// 12. Test Rate-Limit 429 Queue & Serialization
console.log('12. Testing Rate-Limit Queue & Backoff Serialization...');
resetBackoff();
const queueResult = await enqueue(async () => 'success_payload');
assert.equal(queueResult, 'success_payload', 'Enqueue should execute and resolve task');

setBackoffUntil(Date.now() + 30);
const startWait = Date.now();
const backoffTask = await enqueue(async () => {
  return Date.now() - startWait;
});
assert.ok(backoffTask >= 20, 'Enqueue must wait for backoff window before executing');
resetBackoff();
console.log('   ✓ 429 queue and backoff serialization passed.');

// 13. Test Span-Level Grammar Correction Validation & Non-Overlapping Spans
console.log('13. Testing Span-Level Grammar Correction Validation & Overlap Elimination...');
const sourceDoc = 'I has a alot of misteaks and I was was there.';
const rawCandidates = [
  { original: 'I has', replacement: 'I have', type: 'grammar', explanation: 'Subject-verb agreement' },
  { original: 'has a', replacement: 'has an', type: 'grammar', explanation: 'Overlapping candidate' },
  { original: 'ghost substring', replacement: 'replacement', type: 'spelling', explanation: 'Not in text' },
  { original: 'alot', replacement: 'a lot', type: 'spelling', explanation: 'Spelling fix' },
  { original: 'was was', replacement: 'was', type: 'grammar', explanation: 'Repeated word' },
];

const sanitizedSpans = sanitizeAndLocateCorrections(rawCandidates, sourceDoc);
assert.equal(sanitizedSpans.length, 3, 'Must retain exactly 3 valid, non-overlapping spans');
assert.equal(sanitizedSpans[0].original, 'I has');
assert.equal(sanitizedSpans[0].replacement, 'I have');
assert.equal(sourceDoc.slice(sanitizedSpans[0].startIndex, sanitizedSpans[0].endIndex), 'I has');

assert.equal(sanitizedSpans[1].original, 'alot');
assert.equal(sanitizedSpans[1].replacement, 'a lot');
assert.equal(sourceDoc.slice(sanitizedSpans[1].startIndex, sanitizedSpans[1].endIndex), 'alot');

assert.equal(sanitizedSpans[2].original, 'was was');
assert.equal(sanitizedSpans[2].replacement, 'was');
assert.equal(sourceDoc.slice(sanitizedSpans[2].startIndex, sanitizedSpans[2].endIndex), 'was was');

// Confirm no overlap between consecutive spans
for (let i = 1; i < sanitizedSpans.length; i++) {
  assert.ok(
    sanitizedSpans[i].startIndex >= sanitizedSpans[i - 1].endIndex,
    'Consecutive spans must not overlap'
  );
}
console.log('   ✓ Span-level grammar correction validation and overlap elimination passed.');

// 14. Test Rule-Based Granular Span Extraction
console.log('14. Testing Rule-Based Granular Span Extraction...');
const testDoc = 'Their is alot of misteaks in this writting.';
const extractedSpans = extractRuleBasedGrammarSpans(testDoc);
assert.ok(extractedSpans.length >= 3, 'Should extract at least 3 errors (their is, alot, misteaks, writting)');

for (const span of extractedSpans) {
  assert.equal(
    testDoc.slice(span.startIndex, span.endIndex),
    span.original,
    `Span slice must exactly match original string: ${span.original}`
  );
  assert.ok(span.startIndex < span.endIndex, 'Start index must be strictly less than end index');
}
console.log('   ✓ Rule-based granular span extraction passed.');

console.log('\n========================================');
console.log('ALL LEXORA SUITE TESTS PASSED SUCCESSFULLY!');
console.log('========================================\n');
