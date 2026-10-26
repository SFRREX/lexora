/**
 * Lexora Research Lab — Rigorous Statistical Metrics Engine
 * Implements standard classification metrics, confusion matrices, and ROC-AUC.
 */

/**
 * Calculates classification metrics from a list of items having:
 * - groundTruth: 'ai' | 'human' (positive = 'ai')
 * - predicted: 'ai' | 'human' | 'mixed'
 * - probability: number (0.0 to 1.0, optional)
 */
export function calculateEvaluationMetrics(evaluations, threshold = 0.5) {
  if (!evaluations || evaluations.length === 0) {
    return {
      sampleSize: 0,
      tp: 0,
      fp: 0,
      tn: 0,
      fn: 0,
      precision: null,
      recall: null,
      specificity: null,
      f1Score: null,
      fpr: null,
      fnr: null,
      accuracy: null,
      rocAuc: null,
      insufficientData: true,
      message: 'No evaluation samples provided.',
    };
  }

  let tp = 0;
  let fp = 0;
  let tn = 0;
  let fn = 0;
  let unclassified = 0;

  evaluations.forEach((item) => {
    const truth = item.groundTruth?.toLowerCase();
    // Support threshold on probability if available, otherwise direct prediction label
    let predicted = item.predicted?.toLowerCase();
    if (typeof item.probability === 'number') {
      predicted = item.probability >= threshold ? 'ai' : 'human';
    }

    if (truth === 'ai') {
      if (predicted === 'ai') tp++;
      else if (predicted === 'human') fn++;
      else unclassified++;
    } else if (truth === 'human') {
      if (predicted === 'human') tn++;
      else if (predicted === 'ai') fp++;
      else unclassified++;
    } else {
      unclassified++;
    }
  });

  const totalClassified = tp + fp + tn + fn;
  if (totalClassified === 0) {
    return {
      sampleSize: evaluations.length,
      tp: 0,
      fp: 0,
      tn: 0,
      fn: 0,
      unclassified,
      insufficientData: true,
      message: 'Zero samples with binary human/ai ground truth labels.',
    };
  }

  const precision = tp + fp > 0 ? tp / (tp + fp) : null;
  const recall = tp + fn > 0 ? tp / (tp + fn) : null; // Sensitivity
  const specificity = tn + fp > 0 ? tn / (tn + fp) : null;
  const f1Score =
    precision !== null && recall !== null && precision + recall > 0
      ? (2 * (precision * recall)) / (precision + recall)
      : null;
  const fpr = fp + tn > 0 ? fp / (fp + tn) : null; // False Positive Rate
  const fnr = fn + tp > 0 ? fn / (fn + tp) : null; // False Negative Rate
  const accuracy = (tp + tn) / totalClassified;

  // ROC-AUC calculation if continuous probabilities exist
  const rocAuc = calculateRocAuc(evaluations);

  return {
    sampleSize: evaluations.length,
    totalClassified,
    unclassified,
    threshold,
    tp,
    fp,
    tn,
    fn,
    precision: precision !== null ? roundMetric(precision) : null,
    recall: recall !== null ? roundMetric(recall) : null,
    specificity: specificity !== null ? roundMetric(specificity) : null,
    f1Score: f1Score !== null ? roundMetric(f1Score) : null,
    fpr: fpr !== null ? roundMetric(fpr) : null,
    fnr: fnr !== null ? roundMetric(fnr) : null,
    accuracy: roundMetric(accuracy),
    rocAuc: rocAuc !== null ? roundMetric(rocAuc) : null,
    insufficientData: evaluations.length < 5,
    sampleWarning:
      evaluations.length < 10
        ? 'Small sample size (N < 10). Metric values have high variance and must not be interpreted as definitive.'
        : null,
  };
}

/**
 * Calculates Area Under the ROC Curve using trapezoidal numerical integration
 */
export function calculateRocAuc(items) {
  const pairs = items
    .filter(
      (item) =>
        typeof item.probability === 'number' &&
        (item.groundTruth === 'ai' || item.groundTruth === 'human')
    )
    .map((item) => ({
      score: item.probability,
      label: item.groundTruth === 'ai' ? 1 : 0,
    }));

  const numPos = pairs.filter((p) => p.label === 1).length;
  const numNeg = pairs.filter((p) => p.label === 0).length;

  if (numPos === 0 || numNeg === 0) return null;

  // Sort descending by score
  pairs.sort((a, b) => b.score - a.score);

  // Mann-Whitney U rank statistic for AUC
  let rankSum = 0;
  for (let i = 0; i < pairs.length; i++) {
    if (pairs[i].label === 1) {
      rankSum += pairs.length - i;
    }
  }

  const u = rankSum - (numPos * (numPos + 1)) / 2;
  return u / (numPos * numNeg);
}

/**
 * Calculates inter-detector agreement (Cohen's Kappa & raw agreement)
 */
export function calculateInterDetectorAgreement(predListA, predListB) {
  if (!predListA || !predListB || predListA.length === 0 || predListA.length !== predListB.length) {
    return null;
  }

  const n = predListA.length;
  let matches = 0;

  // Contingency
  const countsA = { ai: 0, human: 0, mixed: 0 };
  const countsB = { ai: 0, human: 0, mixed: 0 };

  for (let i = 0; i < n; i++) {
    const a = (predListA[i] || 'mixed').toLowerCase();
    const b = (predListB[i] || 'mixed').toLowerCase();

    if (a === b) matches++;
    countsA[a] = (countsA[a] || 0) + 1;
    countsB[b] = (countsB[b] || 0) + 1;
  }

  const pObserved = matches / n;

  // Expected chance agreement
  let pExpected = 0;
  ['ai', 'human', 'mixed'].forEach((cat) => {
    pExpected += ((countsA[cat] || 0) / n) * ((countsB[cat] || 0) / n);
  });

  const kappa = pExpected < 1 ? (pObserved - pExpected) / (1 - pExpected) : 1;

  return {
    sampleCount: n,
    rawAgreement: roundMetric(pObserved),
    cohensKappa: roundMetric(kappa),
    interpretation:
      kappa > 0.8
        ? 'Almost perfect agreement'
        : kappa > 0.6
        ? 'Substantial agreement'
        : kappa > 0.4
        ? 'Moderate agreement'
        : kappa > 0.2
        ? 'Fair agreement'
        : 'Slight or poor agreement',
  };
}

function roundMetric(val) {
  return Math.round(val * 1000) / 1000;
}
