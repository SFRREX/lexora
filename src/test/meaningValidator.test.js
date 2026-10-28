import { describe, it, expect } from 'vitest';
import {
  extractNumbersAndStats,
  extractCitations,
  extractTechnicalTerms,
  detectNegationInversions,
  validateMeaningAndFacts,
} from '../utils/meaningValidator.js';

describe('Meaning, Fact, and Citation Validator', () => {
  describe('extractNumbersAndStats', () => {
    it('extracts p-values, regression metrics, and confidence intervals', () => {
      const text = 'Statistical significance was achieved (p < 0.01, R² = 0.89) with 95% CI 0.46-0.84 and hazard ratio 0.62.';
      const stats = extractNumbersAndStats(text);
      expect(stats.some((s) => s.includes('p < 0.01'))).toBe(true);
      expect(stats.some((s) => s.includes('r² = 0.89'))).toBe(true);
      expect(stats.some((s) => s.includes('95% ci'))).toBe(true);
      expect(stats.some((s) => s.includes('hazard ratio 0.62'))).toBe(true);
    });

    it('extracts percentages, formatted numbers, and metrics', () => {
      const text = 'Across 1,420 participants, efficacy reached 87.4% after 24 months of 50mg daily treatment.';
      const stats = extractNumbersAndStats(text);
      expect(stats).toContain('1,420');
      expect(stats).toContain('87.4%');
      expect(stats.some((s) => s.includes('24 months'))).toBe(true);
      expect(stats.some((s) => s.includes('50mg'))).toBe(true);
    });

    it('handles null, undefined, and non-string inputs safely', () => {
      expect(extractNumbersAndStats(null)).toEqual([]);
      expect(extractNumbersAndStats(undefined)).toEqual([]);
      expect(extractNumbersAndStats(123)).toEqual([]);
    });
  });

  describe('extractCitations', () => {
    it('extracts bracketed numerical references', () => {
      const text = 'Prior research [1] established this baseline, corroborated by multiple cohorts [2, 3] and recent meta-analyses [4-7].';
      const citations = extractCitations(text);
      expect(citations).toContain('[1]');
      expect(citations).toContain('[2, 3]');
      expect(citations).toContain('[4-7]');
    });

    it('extracts parenthetical author-year citations', () => {
      const text = 'Cellular signaling dynamics (Smith et al., 2023) and metabolic pathways (Johnson & Doe, 2021) were evaluated.';
      const citations = extractCitations(text);
      expect(citations).toContain('(Smith et al., 2023)');
      expect(citations).toContain('(Johnson & Doe, 2021)');
    });

    it('extracts narrative citations and DOIs', () => {
      const text = 'As demonstrated by Miller et al. (2022), the dataset published under 10.1038/s41586-020-2649-2 confirms the hypothesis.';
      const citations = extractCitations(text);
      expect(citations).toContain('Miller et al. (2022)');
      expect(citations).toContain('10.1038/s41586-020-2649-2');
    });
  });

  describe('extractTechnicalTerms', () => {
    it('extracts biomedical and machine learning acronyms', () => {
      const text = 'The CRISPR-Cas9 genome editing was validated with mRNA sequencing and analyzed using BERT and LLM architectures.';
      const terms = extractTechnicalTerms(text);
      expect(terms).toContain('CRISPR-Cas9');
      expect(terms).toContain('mRNA');
      expect(terms).toContain('BERT');
      expect(terms).toContain('LLM');
    });
  });

  describe('detectNegationInversions', () => {
    it('flags when original negative claim is omitted or turned positive', () => {
      const original = 'The therapeutic agent did not show an increase in tumor cell apoptosis.';
      const invertedRefined = 'The therapeutic agent demonstrated an increase in tumor cell apoptosis.';
      const audit = detectNegationInversions(original, invertedRefined);
      expect(audit.hasInversion).toBe(true);
      expect(audit.warnings.length).toBeGreaterThan(0);
    });

    it('passes when negation is properly retained', () => {
      const original = 'The intervention failed to produce statistically significant results.';
      const preservedRefined = 'The intervention did not produce statistically significant results.';
      const audit = detectNegationInversions(original, preservedRefined);
      expect(audit.hasInversion).toBe(false);
      expect(audit.warnings).toEqual([]);
    });
  });

  describe('validateMeaningAndFacts', () => {
    it('scores 100% and reports isValid: true when all facts, numbers, and citations are intact', () => {
      const original = 'In our cohort of 1,420 patients, 85.5% achieved remission [1] (Smith et al., 2023) with p < 0.01 for mRNA therapy.';
      const refined = 'Across the cohort of 1,420 patients, 85.5% achieved sustained remission [1] (Smith et al., 2023) with p < 0.01 for mRNA therapy.';
      const audit = validateMeaningAndFacts(original, refined);

      expect(audit.isValid).toBe(true);
      expect(audit.preservationScore).toBe(100);
      expect(audit.numbers.missing).toHaveLength(0);
      expect(audit.citations.missing).toHaveLength(0);
      expect(audit.negationIntegrity).toBe(true);
      expect(audit.warnings).toHaveLength(0);
    });

    it('identifies altered or missing numbers and warns accordingly', () => {
      const original = 'The trial achieved 94.2% accuracy across 500 samples.';
      const refined = 'The trial achieved favorable accuracy across multiple samples.';
      const audit = validateMeaningAndFacts(original, refined);

      expect(audit.isValid).toBe(false);
      expect(audit.preservationScore).toBeLessThan(100);
      expect(audit.numbers.missing).toContain('94.2%');
      expect(audit.numbers.missing).toContain('500');
      expect(audit.warnings.some((w) => w.includes('Numerical divergence'))).toBe(true);
    });

    it('auto-heals and appends dropped citations into restoredText', () => {
      const original = 'Novel biomarkers were validated in recent clinical oncology trials [14, 15].';
      const refinedWithoutCitation = 'Novel biomarkers were systematically validated in clinical oncology trials.';
      const audit = validateMeaningAndFacts(original, refinedWithoutCitation);

      expect(audit.isValid).toBe(false);
      expect(audit.citations.missing).toContain('[14, 15]');
      expect(audit.restoredText).toContain('[14, 15]');
    });
  });
});
