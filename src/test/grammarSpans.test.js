import { describe, it, expect } from 'vitest';
import {
  extractRuleBasedGrammarSpans,
  calculateHealthScore,
} from '../utils/textRules.js';

describe('Enhanced Grammar Span Engine & Categorization', () => {
  it('detects and categorizes subject-verb agreement errors as grammar', () => {
    const text = 'The researcher have conducted the experiment.';
    const spans = extractRuleBasedGrammarSpans(text);
    const agreement = spans.find((s) => s.original.toLowerCase() === 'researcher have');
    expect(agreement).toBeDefined();
    expect(agreement.replacement).toBe('researcher has');
    expect(agreement.type).toBe('grammar');
    expect(agreement.explanation).toMatch(/subject-verb|singular/i);
    expect(text.slice(agreement.startIndex, agreement.endIndex)).toBe(agreement.original);
  });

  it('detects and categorizes wordiness and redundancies as clarity', () => {
    const text = 'We examined the results in order to verify accuracy.';
    const spans = extractRuleBasedGrammarSpans(text);
    const wordy = spans.find((s) => s.original.toLowerCase() === 'in order to');
    expect(wordy).toBeDefined();
    expect(wordy.replacement).toBe('to');
    expect(wordy.type).toBe('clarity');
  });

  it('detects spacing punctuation errors as punctuation', () => {
    const text = 'The results were clear , although unexpected .';
    const spans = extractRuleBasedGrammarSpans(text);
    const punct = spans.filter((s) => s.type === 'punctuation');
    expect(punct.length).toBeGreaterThanOrEqual(1);
    for (const p of punct) {
      expect(text.slice(p.startIndex, p.endIndex)).toBe(p.original);
    }
  });

  it('calculates Document Health Score correctly (0-100)', () => {
    const cleanText = 'The study demonstrates that solar efficiency increased by twenty percent.';
    expect(calculateHealthScore(cleanText, [])).toBe(100);

    const errorText = 'Their is alot of misteaks in this writting.';
    const spans = extractRuleBasedGrammarSpans(errorText);
    const score = calculateHealthScore(errorText, spans);
    expect(score).toBeLessThan(85);
    expect(score).toBeGreaterThanOrEqual(0);
  });
});
