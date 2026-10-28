import { describe, it, expect } from 'vitest';
import { refineWithRules, calculateTextMetrics } from '../../server/academicRefinerService.js';
import { validateMeaningAndFacts } from '../utils/meaningValidator.js';

describe('Human-Written vs. AI-Assisted Draft Evaluation Suite', () => {
  describe('Human-Written Scholarly Drafts (Preservation & Non-Disruption)', () => {
    const humanDraft = `
      Across a prospective cohort of 1,420 oncology patients, the combination therapy demonstrated 
      a 34.6% reduction in recurrence rates over 36 months (Smith et al., 2023). Statistical analysis 
      confirmed significance (hazard ratio 0.65; 95% CI 0.48-0.88; p < 0.001). However, the secondary 
      endpoint did not show a statistically significant difference between cohorts [1, 2].
    `.trim();

    it('preserves all empirical facts, sample sizes, and citations without distortion', () => {
      const result = refineWithRules(humanDraft, 'academic', 'balanced');
      const audit = validateMeaningAndFacts(humanDraft, result.refinedText);

      expect(audit.isValid).toBe(true);
      expect(audit.preservationScore).toBe(100);
      expect(result.refinedText).toContain('1,420');
      expect(result.refinedText).toContain('34.6%');
      expect(result.refinedText).toContain('36 months');
      expect(result.refinedText).toContain('p < 0.001');
      expect(result.refinedText).toContain('(Smith et al., 2023)');
      expect(result.refinedText).toContain('[1, 2]');
    });

    it('maintains strict negation integrity to avoid hallucinating positive outcomes', () => {
      const result = refineWithRules(humanDraft, 'academic', 'balanced');
      const audit = validateMeaningAndFacts(humanDraft, result.refinedText);

      expect(audit.negationIntegrity).toBe(true);
      // The original stated that secondary endpoint "did not show"
      expect(result.refinedText.toLowerCase()).toMatch(/did not|failed to|no statistically significant/);
    });

    it('preserves high readability metrics and sentence variation on human drafts', () => {
      const metricsBefore = calculateTextMetrics(humanDraft);
      const result = refineWithRules(humanDraft, 'academic', 'balanced');
      const metricsAfter = calculateTextMetrics(result.refinedText);

      expect(metricsAfter.wordsCount).toBeGreaterThan(30);
      expect(metricsAfter.sentencesCount).toBeGreaterThanOrEqual(2);
      expect(Math.abs(metricsAfter.fleschReadingEase - metricsBefore.fleschReadingEase)).toBeLessThan(35);
    });
  });

  describe('AI-Assisted Drafts (Purging AI Slop & Restoring Rigor)', () => {
    const rawAiDraft = `
      In recent years, it is important to note that researchers delve into the intricate tapestry 
      of neural architectures. This plays a pivotal role in accelerating computer vision workflows, 
      serving as a testament to transformative deep learning [3]. Moreover, in order to harness 
      these models, we must utilize robust benchmarks.
    `.trim();

    it('purges superficial AI cliches and buzzwords', () => {
      const result = refineWithRules(rawAiDraft, 'academic', 'balanced');

      // Cliché phrases should be eliminated
      expect(result.refinedText).not.toContain('delve into');
      expect(result.refinedText).not.toContain('intricate tapestry');
      expect(result.refinedText).not.toContain('plays a pivotal role');
      expect(result.refinedText).not.toContain('testament to');
    });

    it('replaces wordy filler with concise academic phrasing while retaining citations', () => {
      const result = refineWithRules(rawAiDraft, 'academic', 'balanced');

      // Citation must remain intact
      expect(result.refinedText).toContain('[3]');
      // Result should be cleaner and tighter
      expect(result.refinedText.length).toBeLessThan(rawAiDraft.length + 30);
    });
  });

  describe('Ethical Architecture & Anti-Evasion Safeguards', () => {
    const sampleDraft = 'The CRISPR-Cas9 genome editing was conducted in 500 murine models [4].';

    it('does NOT inject zero-width spaces, invisible characters, or homoglyphs', () => {
      const result = refineWithRules(sampleDraft, 'academic', 'balanced');

      // Verify absence of zero-width space (\u200B), zero-width non-joiner (\u200C), etc.
      const invisibleChars = ['\u200B', '\u200C', '\u200D', '\uFEFF', '\u00A0', '\u200E', '\u200F'];
      const hasInvisible = invisibleChars.some((ch) => result.refinedText.includes(ch));
      expect(hasInvisible).toBe(false);
    });

    it('does NOT claim 100% human score or detector bypass in refinement metadata', () => {
      const result = refineWithRules(sampleDraft, 'academic', 'balanced');

      // Output object must never claim to bypass detectors or evade Turnitin
      const resultString = JSON.stringify(result).toLowerCase();
      expect(resultString).not.toContain('bypass');
      expect(resultString).not.toContain('undetectable');
      expect(resultString).not.toContain('beat turnitin');
    });
  });
});
