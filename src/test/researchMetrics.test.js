import { describe, it, expect } from 'vitest';
import {
  calculateEvaluationMetrics,
  calculateRocAuc,
  calculateInterDetectorAgreement,
} from '../utils/researchMetrics.js';

describe('Research Metrics Utility', () => {
  it('calculates precision, recall, F1, FPR, FNR, and ROC-AUC correctly', () => {
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
    expect(metrics.tp).toBe(3);
    expect(metrics.fn).toBe(1);
    expect(metrics.tn).toBe(3);
    expect(metrics.fp).toBe(1);
    expect(metrics.precision).toBe(0.75);
    expect(metrics.recall).toBe(0.75);
    expect(metrics.f1Score).toBe(0.75);
    expect(metrics.fpr).toBe(0.25);
    expect(metrics.fnr).toBe(0.25);
    expect(metrics.rocAuc).toBeGreaterThan(0.8);

    const directAuc = calculateRocAuc(evalSamples);
    expect(Math.round(directAuc * 1000) / 1000).toBe(metrics.rocAuc);
  });

  it('calculates Cohen kappa for inter-detector agreement', () => {
    const predsA = ['ai', 'ai', 'human', 'human', 'mixed'];
    const predsB = ['ai', 'ai', 'human', 'ai', 'mixed'];
    const result = calculateInterDetectorAgreement(predsA, predsB);
    expect(result.cohensKappa).toBeGreaterThan(0.5);
    expect(result.interpretation).toBe('Substantial agreement');
  });

  it('handles empty evaluation sets gracefully', () => {
    const emptyMetrics = calculateEvaluationMetrics([]);
    expect(emptyMetrics.tp).toBe(0);
    expect(emptyMetrics.accuracy).toBeNull();
    expect(emptyMetrics.rocAuc).toBeNull();
    expect(emptyMetrics.insufficientData).toBe(true);
  });
});
