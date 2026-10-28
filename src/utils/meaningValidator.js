/**
 * Lexora Meaning, Fact, and Citation Validator
 * 
 * Verifies that AI rewrites and refinements strictly preserve:
 * 1. Quantitative and numerical facts (sample sizes, percentages, p-values, dates)
 * 2. Academic citations (bracketed references, author-year formats, DOIs)
 * 3. Technical terminology and domain entities
 * 4. Semantic polarity (prevents negation inversion)
 */

/**
 * Extracts quantitative, empirical, and statistical figures from text.
 */
export function extractNumbersAndStats(text) {
  if (!text || typeof text !== 'string') return [];

  const found = new Set();

  // 1. Statistical and p-value expressions (e.g. "p < 0.01", "p = 0.002", "R² = 0.89")
  const pValMatches = text.match(/\b(?:p|r|t|z|f|r²)\s*[<>=≤≥]\s*\d+(?:\.\d+)?/gi) || [];
  pValMatches.forEach((m) => found.add(m.trim().toLowerCase()));

  // 2. Confidence intervals & hazard ratios (e.g. "95% CI 0.46-0.84", "hazard ratio 0.62")
  const ciMatches = text.match(/(?:hazard\s+ratio|\d+%\s*CI)\s*[\d.\-\s,]+/gi) || [];
  ciMatches.forEach((m) => found.add(m.trim().toLowerCase()));

  // 3. Percentages (e.g. "34.6%", "100%", "0.5%")
  const pctMatches = text.match(/\b\d+(?:\.\d+)?%/g) || [];
  pctMatches.forEach((m) => found.add(m.trim()));

  // 4. Formatted numbers and quantities (e.g. "1,420", "250,000", "21.4", "100")
  // Excluding single digits 0-9 to avoid matching trivial articles/indexes unless part of a metric
  const numMatches = text.match(/\b\d{1,3}(?:,\d{3})+(?:\.\d+)?\b|\b\d+\.\d+\b|\b\d{2,}\b/g) || [];
  numMatches.forEach((m) => found.add(m.trim()));

  // 5. Currencies and metrics (e.g. "$45.2M", "5.4x", "10mg", "24 months")
  const metricMatches = text.match(/\$\d+(?:\.\d+)?[MBK]?|\b\d+(?:\.\d+)?\s*(?:mg|ml|kg|km|months?|years?|days?|hours?|ms|trials?|patients?)\b/gi) || [];
  metricMatches.forEach((m) => found.add(m.trim().toLowerCase()));

  return Array.from(found);
}

/**
 * Extracts academic citations across author-year, bracketed references, and DOIs.
 */
export function extractCitations(text) {
  if (!text || typeof text !== 'string') return [];

  const citations = new Set();

  // 1. Bracketed numerical citations: [1], [1, 2], [1-4], [12, 14-16]
  const bracketMatches = text.match(/\[\s*\d+(?:[\s,–-]+\d+)*\s*\]/g) || [];
  bracketMatches.forEach((c) => citations.add(c.trim()));

  // 2. Author-year citations: (Smith et al., 2023), (Johnson & Doe, 2021)
  const authorMatches = text.match(/\([A-Z][A-Za-z\s.,&]+(?:\s+et\s+al\.?)?,?\s+\d{4}[a-z]?(?:[;,]\s*p\s*[<>=]\s*[\d.]+)?\)/g) || [];
  authorMatches.forEach((c) => citations.add(c.trim()));

  // 3. Narrative citations: Smith et al. (2023), Miller (2021)
  const narrativeMatches = text.match(/\b[A-Z][a-zA-Z]+(?:\s+et\s+al\.?)?\s+\(\d{4}[a-z]?\)/g) || [];
  narrativeMatches.forEach((c) => citations.add(c.trim()));

  // 4. DOIs: 10.1016/..., 10.1038/...
  const doiMatches = text.match(/\b10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+\b/g) || [];
  doiMatches.forEach((c) => citations.add(c.trim()));

  return Array.from(citations);
}

/**
 * Extracts technical acronyms and specialized domain terms.
 */
export function extractTechnicalTerms(text) {
  if (!text || typeof text !== 'string') return [];

  const terms = new Set();

  // Capitalized acronyms (e.g. "NSCLC", "CRISPR", "mRNA", "BERT", "LLM", "ROC-AUC", "DNA", "RNA")
  const acronymMatches = text.match(/\b[A-Z]{2,}(?:-[A-Za-z0-9]+)?\b|\bmRNA\b|\bfMRI\b|\bCRISPR(?:-Cas9)?\b/g) || [];
  acronymMatches.forEach((t) => terms.add(t.trim()));

  return Array.from(terms);
}

/**
 * Checks for negation polarity inversions between original and refined text.
 * E.g. "did not show an increase" inverted into "showed an increase" is a catastrophic hallucination.
 */
export function detectNegationInversions(originalText, refinedText) {
  if (!originalText || !refinedText) return { hasInversion: false, warnings: [] };

  const NEGATION_PATTERNS = [
    /\b(?:did\s+not|does\s+not|do\s+not|cannot|can\s+not|never|neither|failed\s+to|no\s+evidence\s+of)\b/gi,
  ];

  const origNegCount = NEGATION_PATTERNS.reduce((acc, p) => acc + (originalText.match(p) || []).length, 0);
  const refNegCount = NEGATION_PATTERNS.reduce((acc, p) => acc + (refinedText.match(p) || []).length, 0);

  // If original had strong negation but refined dropped it completely
  if (origNegCount > 0 && refNegCount === 0) {
    return {
      hasInversion: true,
      warnings: ['Potential negation loss: original text contained negative assertions that were removed in the output.'],
    };
  }

  return { hasInversion: false, warnings: [] };
}

/**
 * Comprehensive Validation Audit
 */
export function validateMeaningAndFacts(originalText, refinedText) {
  if (!originalText || !refinedText) {
    return {
      isValid: true,
      preservationScore: 100,
      numbers: { original: [], refined: [], missing: [], accuracy: 100 },
      citations: { original: [], refined: [], missing: [], accuracy: 100 },
      technicalTerms: { original: [], refined: [], missing: [], accuracy: 100 },
      negationIntegrity: true,
      warnings: [],
      restoredText: refinedText || '',
    };
  }

  const warnings = [];

  // 1. Verify Numerical Integrity
  const originalNumbers = extractNumbersAndStats(originalText);
  const refinedNumbers = extractNumbersAndStats(refinedText);

  // Check which original numbers are missing in refined
  const missingNumbers = originalNumbers.filter((num) => {
    // Normalization check (e.g. "1,420" vs "1420" or "p < 0.01")
    const cleanNum = num.replace(/,/g, '').toLowerCase();
    const cleanRefined = refinedText.replace(/,/g, '').toLowerCase();
    return !cleanRefined.includes(cleanNum) && !cleanRefined.includes(num.toLowerCase());
  });

  const numAccuracy =
    originalNumbers.length === 0
      ? 100
      : Math.round(((originalNumbers.length - missingNumbers.length) / originalNumbers.length) * 100);

  if (missingNumbers.length > 0) {
    warnings.push(`Numerical divergence: ${missingNumbers.length} number(s) or statistic(s) missing or altered: ${missingNumbers.join(', ')}`);
  }

  // 2. Verify Citation Integrity
  const originalCitations = extractCitations(originalText);
  const refinedCitations = extractCitations(refinedText);

  const missingCitations = originalCitations.filter((cit) => !refinedText.includes(cit));
  const citAccuracy =
    originalCitations.length === 0
      ? 100
      : Math.round(((originalCitations.length - missingCitations.length) / originalCitations.length) * 100);

  if (missingCitations.length > 0) {
    warnings.push(`Citation discrepancy: ${missingCitations.length} citation(s) missing: ${missingCitations.join(', ')}`);
  }

  // 3. Verify Technical Terminology
  const originalTerms = extractTechnicalTerms(originalText);
  const refinedTerms = extractTechnicalTerms(refinedText);

  const missingTerms = originalTerms.filter((term) => !refinedText.includes(term));
  const termAccuracy =
    originalTerms.length === 0
      ? 100
      : Math.round(((originalTerms.length - missingTerms.length) / originalTerms.length) * 100);

  if (missingTerms.length > 0) {
    warnings.push(`Technical term omission: ${missingTerms.join(', ')}`);
  }

  // 4. Verify Negation Polarity
  const negationAudit = detectNegationInversions(originalText, refinedText);
  if (negationAudit.hasInversion) {
    warnings.push(...negationAudit.warnings);
  }

  // 5. Overall Preservation Score
  const weights = [
    { score: numAccuracy, weight: 0.4 },
    { score: citAccuracy, weight: 0.4 },
    { score: termAccuracy, weight: 0.2 },
  ];
  const preservationScore = Math.round(
    weights.reduce((acc, curr) => acc + curr.score * curr.weight, 0)
  );

  // 6. Auto-heal: Ensure missing citations or critical numbers are restored if necessary
  let restoredText = refinedText;
  if (missingCitations.length > 0) {
    missingCitations.forEach((cit) => {
      if (!restoredText.includes(cit)) {
        restoredText = `${restoredText.trim()} ${cit}`;
      }
    });
  }

  return {
    isValid: warnings.length === 0,
    preservationScore,
    numbers: {
      original: originalNumbers,
      refined: refinedNumbers,
      missing: missingNumbers,
      accuracy: numAccuracy,
    },
    citations: {
      original: originalCitations,
      refined: refinedCitations,
      missing: missingCitations,
      accuracy: citAccuracy,
    },
    technicalTerms: {
      original: originalTerms,
      refined: refinedTerms,
      missing: missingTerms,
      accuracy: termAccuracy,
    },
    negationIntegrity: !negationAudit.hasInversion,
    warnings,
    restoredText,
  };
}
