import { describe, it, expect } from 'vitest';
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
  calculateTextMetrics,
} from '../../server/academicRefinerService.js';

describe('Academic Refiner Service', () => {
  it('extracts and preserves bracketed, author-year, and DOI citations', () => {
    const text = 'Recent breakthroughs [1, 2] and studies (Smith et al., 2023) alongside DOI 10.1038/s41586-020-2649-2 clarify mechanisms.';
    const citations = extractCitations(text);
    expect(citations).toContain('[1, 2]');
    expect(citations).toContain('(Smith et al., 2023)');
    expect(citations).toContain('10.1038/s41586-020-2649-2');
  });

  it('masks citations with placeholders and restores them verbatim', () => {
    const text = 'Autonomous agents delve into environments (Karaman & Frazzoli, 2011, pp. 83–86) and [1, 2].';
    const { text: masked, mapping } = maskCitationsWithPlaceholders(text);
    expect(masked).toContain('[[REF_1]]');
    expect(masked).not.toContain('Karaman & Frazzoli');

    const restored = unmaskCitationsFromPlaceholders(masked, mapping);
    expect(restored).toBe(text);
  });

  it('extracts numerical percentages and p-values', () => {
    const text = 'A 42.5% increase was observed with p < 0.05 and ratio 1:4.';
    const stats = extractStatistics(text);
    expect(stats).toContain('42.5%');
    expect(stats.some((s) => s.includes('0.05'))).toBe(true);
  });

  it('expands contractions accurately with capitalization preservation', () => {
    const text = "Don't assume we can't test it. It's working.";
    const { text: expanded, count } = expandContractions(text);
    expect(expanded).toContain('Do not');
    expect(expanded).toContain('cannot');
    expect(expanded).toContain('It is');
    expect(count).toBe(3);
  });

  it('converts personal active formulations to academic passive voice', () => {
    const text = 'We conducted the experiment and observed positive results.';
    const { text: converted } = convertToAcademicPassive(text);
    expect(converted).toContain('The experiment was conducted');
  });

  it('replaces common informal terms with formal academic synonyms', () => {
    const text = 'This is a good result that will fix the issue.';
    const { text: replaced } = replaceWithFormalSynonyms(text);
    expect(replaced).toContain('favorable');
    expect(replaced).toContain('resolve');
  });

  it('adds academic transitions between sentences when requested', () => {
    const text = 'The initial trial succeeded. The subsequent evaluation showed positive progress.';
    const { text: result, count } = addAcademicTransitions(text, 1.0);
    expect(count).toBeGreaterThan(0);
    expect(result).toBeTruthy();
  });

  it('strips AI filler phrases while protecting citations in full pipeline', () => {
    const text = 'In recent years, we delve into the intricate tapestry of genomics [1, 2]. It is important to note that this plays a pivotal role in 42.5% of cases (Smith et al., 2023).';
    const result = refineWithRules(text, 'academic', 'balanced');
    expect(result.refinedText).not.toContain('delve into');
    expect(result.refinedText).not.toContain('intricate tapestry');
    expect(result.refinedText).not.toContain('plays a pivotal role');
    expect(result.refinedText).toContain('[1, 2]');
    expect(result.refinedText).toContain('(Smith et al., 2023)');
    expect(result.refinedText).toContain('42.5%');
  });

  it('calculates text metrics correctly', () => {
    const text = 'This is the first sentence. Here is the second sentence with more complexity and varied length.';
    const metrics = calculateTextMetrics(text);
    expect(metrics).toBeDefined();
    expect(metrics.wordsCount).toBeGreaterThan(10);
    expect(metrics.sentencesCount).toBe(2);
    expect(typeof metrics.fleschReadingEase).toBe('number');
  });
});
