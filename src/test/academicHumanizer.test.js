import { describe, it, expect } from 'vitest';
import {
  refineWithRules,
  extractCitations,
  maskCitationsWithPlaceholders,
  unmaskCitationsFromPlaceholders,
  expandContractions,
  addAcademicTransitions,
  replaceWithFormalSynonyms,
} from '../../server/academicRefinerService.js';
import {
  extractCitations as clientExtractCitations,
  refineAcademicWithRules as clientRefineAcademicWithRules,
} from '../utils/textRules.js';

describe('Academic Humanizer Engine Core (DadaNanjesha Integration)', () => {
  const sampleAcademicText = `We conducted the study to find out if this gives good results (Smith et al., 2023, p. 14). We didn't expect that it'll fail. It's a big deal to make sure the data is clear [1, 2].`;

  it('preserves all APA, MLA, and bracketed citations verbatim', () => {
    const citations = extractCitations(sampleAcademicText);
    expect(citations).toContain('(Smith et al., 2023, p. 14)');
    expect(citations).toContain('[1, 2]');

    const { text: masked, mapping } = maskCitationsWithPlaceholders(sampleAcademicText);
    expect(masked).not.toContain('Smith et al.');
    expect(masked).not.toContain('[1, 2]');

    const restored = unmaskCitationsFromPlaceholders(masked, mapping);
    expect(restored).toBe(sampleAcademicText);
  });

  it('modulates synonym replacement by intensity slider', () => {
    const text = 'This is a good method to get big help and fix problems.';
    
    // Intensity 0: No substitutions
    const zeroRes = replaceWithFormalSynonyms(text, 0);
    expect(zeroRes.count).toBe(0);
    expect(zeroRes.text).toBe(text);

    // Intensity 100: Maximum substitutions
    const maxRes = replaceWithFormalSynonyms(text, 100);
    expect(maxRes.count).toBeGreaterThan(0);
    expect(maxRes.text).toContain('favorable');
    expect(maxRes.text).toContain('obtain');
    expect(maxRes.text).toContain('substantial');
    expect(maxRes.text).toContain('facilitate');
    expect(maxRes.text).toContain('resolve');

    // Intensity 50: Partial substitutions
    const midRes = replaceWithFormalSynonyms(text, 50);
    expect(midRes.count).toBeGreaterThan(0);
    expect(midRes.count).toBeLessThanOrEqual(maxRes.count);
  });

  it('expands contractions with casing preservation', () => {
    const text = "We didn't know it'll work, but won't quit. Don't worry.";
    const { text: expanded, count } = expandContractions(text);
    expect(count).toBe(4);
    expect(expanded).toContain('did not');
    expect(expanded).toContain('it will');
    expect(expanded).toContain('will not');
    expect(expanded).toContain('Do not');
  });

  it('modulates academic transitions based on rate and intensity', () => {
    const text = 'The initial trial succeeded. The second trial confirmed the effect. The third trial verified reproducibility.';
    
    const zeroTrans = addAcademicTransitions(text, 0, 0);
    expect(zeroTrans.count).toBe(0);

    const activeTrans = addAcademicTransitions(text, 0.5, 80);
    expect(activeTrans.count).toBeGreaterThan(0);
  });

  it('runs complete refineWithRules pipeline with intensity and returns metadata', () => {
    const result = refineWithRules(sampleAcademicText, 'academic', 'balanced', {
      intensity: 85,
      expandContractions: true,
      formalSynonyms: true,
      addTransitions: true,
      passiveVoice: true,
    });

    expect(result.refinedText).toBeDefined();
    expect(result.refinedText).toContain('(Smith et al., 2023, p. 14)');
    expect(result.refinedText).toContain('[1, 2]');
    expect(result.refinedText).not.toContain("didn't");
    expect(result.refinedText).not.toContain("it'll");
    expect(result.refinedText).not.toContain("It's");
    expect(result.intensity).toBe(85);
  });

  it('supports client-side mirror in textRules.js for zero-latency execution', () => {
    const citations = clientExtractCitations(sampleAcademicText);
    expect(citations).toContain('[1, 2]');
    expect(citations).toContain('(Smith et al., 2023, p. 14)');

    const localResult = clientRefineAcademicWithRules(sampleAcademicText, {
      intensity: 75,
      expandContractions: true,
      formalSynonyms: true,
    });
    expect(localResult.refinedText).toContain('(Smith et al., 2023, p. 14)');
    expect(localResult.refinedText).toContain('[1, 2]');
    expect(localResult.contractionCount).toBeGreaterThan(0);
  });
});
