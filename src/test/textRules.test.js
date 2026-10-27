import { describe, it, expect } from 'vitest';
import {
  fixGrammar,
  improveWriting,
  replaceWords,
  simplifyText,
  professionalTone,
  casualTone,
  shortenText,
  getWordAlternatives,
  extractRuleBasedGrammarSpans,
  EXAMPLE_TEXT,
} from '../utils/textRules.js';

describe('textRules utility', () => {
  describe('fixGrammar', () => {
    it('corrects subject-verb agreement and common spelling errors', () => {
      const input = 'Their is alot of misteaks. He have a apple. They was happy.';
      const output = fixGrammar(input);
      expect(output).toContain('There is');
      expect(output).toContain('a lot');
      expect(output).toContain('mistakes');
      expect(output).toContain('He has an apple');
      expect(output).toContain('They were happy');
    });

    it('capitalizes standalone lowercase i and opening letter', () => {
      const input = 'when i go home, i am happy';
      const output = fixGrammar(input);
      expect(output).toBe('When I go home, I am happy');
    });

    it('corrects double negatives', () => {
      const input = "I don't got no time";
      const output = fixGrammar(input);
      expect(output).toBe("I don't have any time");
    });

    it('handles empty or non-string inputs gracefully', () => {
      expect(fixGrammar('')).toBe('');
      expect(fixGrammar(null)).toBe('');
      expect(fixGrammar(undefined)).toBe('');
    });
  });

  describe('simplifyText', () => {
    it('transforms wordy phrases into direct constructions', () => {
      const input = 'In order to make a decision, we took it into consideration due to the fact that time was short.';
      const output = simplifyText(input);
      expect(output.toLowerCase()).toContain('to decide');
      expect(output.toLowerCase()).toContain('considered');
      expect(output.toLowerCase()).toContain('because');
    });
  });

  describe('improveWriting & replaceWords', () => {
    it('enhances sentence clarity and eliminates filler phrases', () => {
      const input = 'In order to make a decision, we took it into consideration.';
      const output = improveWriting(input);
      expect(output).toBeTruthy();
      expect(output.toLowerCase()).toContain('to decide');
    });

    it('replaces common weak words with stronger alternatives', () => {
      const input = 'This is a good thing that will help us.';
      const output = replaceWords(input);
      expect(output).not.toContain('a good thing');
    });
  });

  describe('Tone transformations', () => {
    it('adapts informal drafts to professional tone', () => {
      const input = 'hey guys thanks gonna try and fix this stuff';
      const output = professionalTone(input);
      expect(output).toContain('Hello everyone');
      expect(output).toContain('thank you');
      expect(output).toContain('going to');
    });

    it('adapts formal prose to casual tone with contractions', () => {
      const input = 'Hello, I will not purchase this item because I cannot utilize it.';
      const output = casualTone(input);
      expect(output).toContain('Hey');
      expect(output).toContain("won't");
      expect(output).toContain("can't");
    });
  });

  describe('shortenText', () => {
    it('removes throat-clearing prepositions and deadwood', () => {
      const input = 'I am writing this email to tell you that basically we should meet.';
      const output = shortenText(input);
      expect(output).toBe('We should meet.');
    });
  });

  describe('getWordAlternatives', () => {
    it('returns categorical alternatives for supported words', () => {
      const alts = getWordAlternatives('good');
      expect(alts).toBeDefined();
      expect(alts.professional).toContain('excellent');
      expect(alts.stronger).toContain('exceptional');
      expect(alts.casual).toContain('great');
    });

    it('returns null for unknown words', () => {
      expect(getWordAlternatives('supercalifragilistic')).toBeNull();
    });
  });

  describe('extractRuleBasedGrammarSpans', () => {
    it('extracts non-overlapping spans with exact substring slices', () => {
      const text = 'Their is alot of misteaks in this writting.';
      const spans = extractRuleBasedGrammarSpans(text);
      expect(spans.length).toBeGreaterThanOrEqual(3);

      for (const span of spans) {
        expect(text.slice(span.startIndex, span.endIndex)).toBe(span.original);
        expect(span.startIndex).toBeLessThan(span.endIndex);
      }
    });

    it('handles repeated words correctly', () => {
      const text = 'She went to the the store.';
      const spans = extractRuleBasedGrammarSpans(text);
      const repeated = spans.find((s) => s.original === 'the the');
      expect(repeated).toBeDefined();
      expect(repeated.replacement).toBe('the');
    });

    it('returns empty array on empty input', () => {
      expect(extractRuleBasedGrammarSpans('')).toEqual([]);
      expect(extractRuleBasedGrammarSpans('   ')).toEqual([]);
    });
  });

  describe('EXAMPLE_TEXT integration', () => {
    it('successfully processes full example text without crashing', () => {
      const result = fixGrammar(EXAMPLE_TEXT);
      expect(result).toBeTruthy();
      expect(result).not.toContain('Their is');
      expect(result).not.toContain('alot');
    });
  });
});
