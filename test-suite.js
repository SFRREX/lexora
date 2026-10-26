import assert from 'node:assert/strict';
import { GPTZeroAdapter } from './server/detectors/gptzero.js';
import { CopyleaksAdapter } from './server/detectors/copyleaks.js';
import { GeminiDetectorAdapter } from './server/detectors/geminiDetector.js';
import { LocalStylometricsAdapter } from './server/detectors/localStylometrics.js';
import { detectorManager } from './server/detectors/detectorManager.js';
import {
  refineWithRules,
  extractCitations,
  extractStatistics,
} from './server/academicRefinerService.js';
import {
  calculateEvaluationMetrics,
  calculateRocAuc,
  calculateInterDetectorAgreement,
} from './src/utils/researchMetrics.js';

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

console.log('\n========================================');
console.log('ALL LEXORA SUITE TESTS PASSED SUCCESSFULLY!');
console.log('========================================\n');
