import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AIChecker from '../components/AIChecker.jsx';
import AcademicRefiner from '../components/AcademicRefiner.jsx';
import {
  classifySentenceFourTier,
} from '../../server/detectors/baseDetector.js';
import { GeminiDetectorAdapter } from '../../server/detectors/geminiDetector.js';
import { GPTZeroAdapter } from '../../server/detectors/gptzero.js';
import { CopyleaksAdapter } from '../../server/detectors/copyleaks.js';
import {
  refineWithRules,
  maskCitationsWithPlaceholders,
  unmaskCitationsFromPlaceholders,
  ensureCitationIntegrity,
  ACADEMIC_TRANSITIONS,
} from '../../server/academicRefinerService.js';
import * as suiteServices from '../services/suiteServices.js';

// Mock suite services for React component tests
vi.mock('../services/suiteServices.js', () => ({
  fetchDetectorStatuses: vi.fn().mockResolvedValue([
    { id: 'gemini', name: 'Lexora Neural AI Detector (Gemini)', configured: true, isFree: true },
    { id: 'stylometrics', name: 'Lexora Local Stylometrics Engine', configured: true, isFree: true },
  ]),
  runAiDetection: vi.fn(),
  runAcademicRefinement: vi.fn(),
}));

describe('Humanizer & AI Detector Regression Suite (Phases 1 - 8)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  // ── TEST A: Correct text is analyzed ────────────────────────────────────
  describe('Test A: Refiner Output Hand-off to Detector', () => {
    it('passes refined text B from AcademicRefiner to AIChecker via sessionStorage', async () => {
      const textA = 'We conducted the study and we delve into the dataset [1, 2].';
      const textB = 'The study was conducted, and the dataset was examined with empirical methods [1, 2].';

      suiteServices.runAcademicRefinement.mockResolvedValueOnce({
        originalText: textA,
        refinedText: textB,
        mode: 'academic',
        level: 'balanced',
        intensity: 65,
        source: 'local-rules',
        preservedCitations: ['[1, 2]'],
        unslopCount: 1,
        editorialHighlights: ['Purged stock cliché', 'Preserved 1 citation'],
        refinedMetrics: { burstiness: 34.5 },
      });

      const onSelectView = vi.fn();
      render(<AcademicRefiner onSelectView={onSelectView} />);

      const textarea = screen.getByPlaceholderText(/paste your abstract/i);
      fireEvent.change(textarea, { target: { value: textA } });

      const refineBtn = screen.getByRole('button', { name: /refine academic prose/i });
      fireEvent.click(refineBtn);

      await waitFor(() => {
        expect(screen.getByText(/refinement complete/i)).toBeInTheDocument();
      });

      // Click "Verify in AI Checker"
      const verifyBtn = screen.getByRole('button', { name: /verify in ai checker/i });
      fireEvent.click(verifyBtn);

      // Verify that sessionStorage holds refined text B and onSelectView was triggered
      expect(sessionStorage.getItem('lexora_checker_text')).toBe(textB);
      expect(onSelectView).toHaveBeenCalledWith('checker');

      // Now render AIChecker and ensure it mounts with exactly text B
      suiteServices.runAiDetection.mockResolvedValueOnce({
        results: [
          {
            providerId: 'stylometrics',
            success: true,
            data: {
              providerId: 'stylometrics',
              providerName: 'Lexora Local Stylometrics Engine',
              classification: 'human',
              probabilityScore: 0.15,
              confidence: 'high',
              burstiness: 38.2,
              perplexity: 65.0,
              sentences: [
                {
                  id: 's-0',
                  text: textB,
                  label: 'human',
                  score: 0.15,
                  tier: 'human-written',
                  tierLabel: 'Human-written',
                },
              ],
              fourTierDistribution: {
                humanWritten: 100,
                humanWrittenAiRefined: 0,
                aiGeneratedAiRefined: 0,
                aiGenerated: 0,
              },
            },
          },
        ],
      });

      render(<AIChecker onSelectView={vi.fn()} />);

      const checkerInput = screen.getByLabelText(/document for verification/i);
      expect(checkerInput.value).toBe(textB);

      // Click check text
      const checkBtn = screen.getByRole('button', { name: /check text/i });
      fireEvent.click(checkBtn);

      await waitFor(() => {
        expect(suiteServices.runAiDetection).toHaveBeenCalledWith(textB, expect.any(Array));
      });
    });
  });

  // ── TEST B: Manual edits invalidate previous scan results ───────────────
  describe('Test B: Manual Edits Invalidate Stale Scan Results', () => {
    it('marks result as outdated when text B is manually edited to text C', async () => {
      const textB = 'The evaluation demonstrated significant improvements in computational efficiency across both primary cohorts in the clinical trial.';
      const textC = 'The evaluation demonstrated major improvements in computational efficiency across both primary cohorts in the clinical trial after manual revision.';

      suiteServices.runAiDetection.mockResolvedValueOnce({
        results: [
          {
            providerId: 'gemini',
            success: true,
            data: {
              providerId: 'gemini',
              providerName: 'Lexora Neural AI Detector (Gemini)',
              modelVersion: 'gemini-3.5-flash',
              scanTimestamp: new Date().toISOString(),
              classification: 'mixed',
              probabilityScore: 0.45,
              confidence: 'medium',
              burstiness: 29.1,
              perplexity: 42.0,
              sentences: [
                {
                  id: 's-0',
                  text: textB,
                  label: 'mixed',
                  score: 0.45,
                  tier: 'ai-refined-human',
                  tierLabel: 'Human-written & AI-refined',
                },
              ],
              fourTierDistribution: {
                humanWritten: 0,
                humanWrittenAiRefined: 100,
                aiGeneratedAiRefined: 0,
                aiGenerated: 0,
              },
            },
          },
        ],
      });

      render(<AIChecker onSelectView={vi.fn()} />);

      const checkerInput = screen.getByLabelText(/document for verification/i);
      fireEvent.change(checkerInput, { target: { value: textB } });

      const checkBtn = screen.getByRole('button', { name: /check text/i });
      fireEvent.click(checkBtn);

      await waitFor(() => {
        expect(screen.getByText(/reported ai probability/i)).toBeInTheDocument();
      });

      // No outdated banner initially
      expect(screen.queryByText(/text modified since last scan/i)).not.toBeInTheDocument();

      // User manually edits B into C
      fireEvent.change(checkerInput, { target: { value: textC } });

      // Outdated banner and badge must appear immediately to prevent stale confusion
      expect(screen.getByText(/text modified since last scan/i)).toBeInTheDocument();
      expect(screen.getByText(/outdated result/i)).toBeInTheDocument();
    });
  });

  // ── TEST C: Correct score handling (0, 1, 42.5, 99.9, 100, percentages) ─
  describe('Test C: Score Normalization and Defensive Fallbacks', () => {
    it('normalizes percentage-scale numbers (0-100) vs unit intervals (0-1) correctly', () => {
      // 0.12 unit scale -> human-written
      expect(classifySentenceFourTier(0.12, 'human').tier).toBe('human-written');

      // 12% percentage scale -> human-written
      expect(classifySentenceFourTier(12, 'human').tier).toBe('human-written');

      // 42.5% -> ai-refined-human (0.425)
      expect(classifySentenceFourTier(42.5, 'mixed').tier).toBe('ai-refined-human');

      // 0.65 -> ai-refined-ai
      expect(classifySentenceFourTier(0.65, 'mixed').tier).toBe('ai-refined-ai');

      // 65% -> ai-refined-ai
      expect(classifySentenceFourTier(65, 'mixed').tier).toBe('ai-refined-ai');

      // 99.9% -> ai-generated
      expect(classifySentenceFourTier(99.9, 'ai').tier).toBe('ai-generated');

      // 1.0 (or 100%) -> ai-generated
      expect(classifySentenceFourTier(1.0, 'ai').tier).toBe('ai-generated');
      expect(classifySentenceFourTier(100, 'ai').tier).toBe('ai-generated');

      // 0.0 -> human-written
      expect(classifySentenceFourTier(0.0, 'human').tier).toBe('human-written');
    });

    it('handles null, undefined, and non-numeric scores defensively', () => {
      expect(classifySentenceFourTier(null, 'human').tier).toBe('human-written');
      expect(classifySentenceFourTier(undefined, 'ai').tier).toBe('ai-generated');
      expect(classifySentenceFourTier('invalid', 'mixed').tier).toBe('ai-refined-human');
    });

    it('normalizes Gemini responses with percentage scores (e.g. 95) to unit interval', () => {
      const adapter = new GeminiDetectorAdapter();
      const raw = {
        overall_classification: 'ai',
        probability_score: 95, // 95 instead of 0.95
        confidence_category: 'high',
        burstiness_score: 22.0,
        perplexity_score: 18.0,
        sentences: [
          { text: 'Sample sentence.', classification: 'ai', score: 95 },
        ],
      };
      const normalized = adapter.normalizeDetectionResult(raw, 'Sample sentence.');
      expect(normalized.probabilityScore).toBe(0.95);
      expect(normalized.sentences[0].score).toBe(0.95);
      expect(normalized.sentences[0].tier).toBe('ai-generated');
    });

    it('normalizes Copyleaks percentage scores defensively', () => {
      const adapter = new CopyleaksAdapter();
      const raw = {
        summary: { ai: 75, human: 25 }, // percentage values
      };
      const normalized = adapter.normalizeDetectionResult(raw, 'Sample text with sufficient length.');
      expect(normalized.probabilityScore).toBe(0.75);
      expect(normalized.classification).toBe('ai');
    });

    it('normalizes GPTZero percentage scores defensively', () => {
      const adapter = new GPTZeroAdapter();
      const raw = {
        document: {
          completely_generated_prob: 88, // 88%
          sentences: [
            { sentence: 'One.', generated_prob: 88, highlight_sentence_for_ai: true },
          ],
        },
      };
      const normalized = adapter.normalizeDetectionResult(raw, 'One.');
      expect(normalized.probabilityScore).toBe(0.88);
      expect(normalized.sentences[0].score).toBe(0.88);
      expect(normalized.sentences[0].tier).toBe('ai-generated');
    });
  });

  // ── TEST D: Request ordering & race conditions ──────────────────────────
  describe('Test D: Request Sequencing & Race Condition Protection', () => {
    it('discards older out-of-order response when a newer request resolves earlier', async () => {
      let resolveFirst;
      const firstPromise = new Promise((resolve) => {
        resolveFirst = resolve;
      });

      const secondResult = {
        results: [
          {
            providerId: 'gemini',
            success: true,
            data: {
              providerId: 'gemini',
              providerName: 'Lexora Neural AI Detector (Gemini)',
              modelVersion: 'gemini-3.5-flash',
              scanTimestamp: new Date().toISOString(),
              classification: 'human',
              probabilityScore: 0.10,
              confidence: 'high',
              burstiness: 45.0,
              perplexity: 70.0,
              sentences: [
                {
                  id: 's-0',
                  text: 'Second long draft submitted for analysis to evaluate neural classifier responses across groups.',
                  label: 'human',
                  score: 0.10,
                  tier: 'human-written',
                  tierLabel: 'Human-written',
                },
              ],
              fourTierDistribution: { humanWritten: 100, humanWrittenAiRefined: 0, aiGeneratedAiRefined: 0, aiGenerated: 0 },
            },
          },
        ],
      };

      suiteServices.runAiDetection
        .mockImplementationOnce(() => firstPromise) // Request 1: delayed
        .mockResolvedValueOnce(secondResult); // Request 2: resolves immediately

      render(<AIChecker onSelectView={vi.fn()} />);

      const checkerInput = screen.getByLabelText(/document for verification/i);
      const checkBtn = screen.getByRole('button', { name: /check text/i });

      // Trigger Request 1
      fireEvent.change(checkerInput, {
        target: { value: 'First long draft submitted for analysis to evaluate neural classifier responses across groups.' },
      });
      fireEvent.click(checkBtn);

      // Trigger Request 2 with different text
      fireEvent.change(checkerInput, {
        target: { value: 'Second long draft submitted for analysis to evaluate neural classifier responses across groups.' },
      });
      fireEvent.click(checkBtn);

      // Wait for Request 2 to finish and display
      await waitFor(() => {
        expect(screen.getByText('10%')).toBeInTheDocument();
      });

      // Now resolve the older Request 1 (which would report 90% AI)
      resolveFirst({
        results: [
          {
            providerId: 'gemini',
            success: true,
            data: {
              providerId: 'gemini',
              providerName: 'Lexora Neural AI Detector (Gemini)',
              modelVersion: 'gemini-3.5-flash',
              scanTimestamp: new Date().toISOString(),
              classification: 'ai',
              probabilityScore: 0.90,
              confidence: 'high',
              burstiness: 15.0,
              perplexity: 20.0,
              sentences: [],
              fourTierDistribution: { humanWritten: 0, humanWrittenAiRefined: 0, aiGeneratedAiRefined: 0, aiGenerated: 100 },
            },
          },
        ],
      });

      // Verify that the UI remains on Request 2 (10%), not overwritten by Request 1 (90%)
      await new Promise((r) => setTimeout(r, 50));
      expect(screen.getByText('10%')).toBeInTheDocument();
      expect(screen.queryByText('90%')).not.toBeInTheDocument();
    });
  });

  // ── TEST E: Humanizer failures & honest error reporting ─────────────────
  describe('Test E: Humanizer Error Handling', () => {
    it('displays error message when humanizer encounters API failure or timeout', async () => {
      suiteServices.runAcademicRefinement.mockRejectedValueOnce(
        new Error('Network connection timeout to intelligence service.')
      );

      render(<AcademicRefiner onSelectView={vi.fn()} />);

      const textarea = screen.getByPlaceholderText(/paste your abstract/i);
      fireEvent.change(textarea, { target: { value: 'Draft text for analysis that will fail.' } });

      const refineBtn = screen.getByRole('button', { name: /refine academic prose/i });
      fireEvent.click(refineBtn);

      await waitFor(() => {
        expect(screen.getByText(/network connection timeout/i)).toBeInTheDocument();
      });

      // Refinement complete must NOT be displayed
      expect(screen.queryByText(/refinement complete/i)).not.toBeInTheDocument();
    });

    it('requires text input and validates empty drafts', () => {
      render(<AcademicRefiner onSelectView={vi.fn()} />);

      const refineBtn = screen.getByRole('button', { name: /refine academic prose/i });
      expect(refineBtn).toBeDisabled();
    });
  });

  // ── TEST F: Meaning preservation & citation integrity ───────────────────
  describe('Test F: Meaning, Facts, Numbers & Citation Preservation', () => {
    it('preserves academic citations, percentages, hazard ratios, and p-values verbatim', () => {
      const empiricalText =
        'Patients with resectable NSCLC were enrolled in an open-label trial (Smith et al., 2023) [1, 2]. At median follow-up of 21.4 months, the cohort had a 38% reduction in progression risk (hazard ratio 0.62, 95% CI 0.46-0.84, p = 0.002). We conducted the evaluation to delve into the intricate tapestry of genomics.';

      const result = refineWithRules(empiricalText, 'academic', 'balanced', {
        expandContractions: true,
        passiveVoice: true,
        formalSynonyms: true,
        addTransitions: false,
      });

      // Citations must be preserved verbatim
      expect(result.refinedText).toContain('(Smith et al., 2023)');
      expect(result.refinedText).toContain('[1, 2]');

      // Numerical facts and empirical metrics must remain intact
      expect(result.refinedText).toContain('21.4 months');
      expect(result.refinedText).toContain('38%');
      expect(result.refinedText).toContain('hazard ratio 0.62');
      expect(result.refinedText).toContain('p = 0.002');

      // Stock clichés must be unsloped
      expect(result.refinedText).not.toContain('delve into');
      expect(result.refinedText).not.toContain('intricate tapestry');
    });

    it('restores isolated citation placeholders safely through placeholder isolation', () => {
      const draft = 'Prior research (Johnson et al., 2024) demonstrated utility [3, 4].';
      const { text: masked, mapping } = maskCitationsWithPlaceholders(draft);

      expect(masked).toContain('[[REF_1]]');
      expect(masked).toContain('[[REF_2]]');

      const restored = unmaskCitationsFromPlaceholders(masked, mapping);
      expect(restored).toBe(draft);

      const protectedResult = ensureCitationIntegrity(restored, ['(Johnson et al., 2024)', '[3, 4]']);
      expect(protectedResult).toContain('(Johnson et al., 2024)');
      expect(protectedResult).toContain('[3, 4]');
    });
  });

  // ── TEST G: Honest results & no score rigging ───────────────────────────
  describe('Test G: Honest Results Verification', () => {
    it('preserves an authentic 100% or 95% AI score without artificial manipulation', async () => {
      const rawAiText =
        'Technology has become integral to contemporary educational environments. Students frequently utilize digital resources to conduct academic research and retrieve information.';

      suiteServices.runAiDetection.mockResolvedValueOnce({
        results: [
          {
            providerId: 'gemini',
            success: true,
            data: {
              providerId: 'gemini',
              providerName: 'Lexora Neural AI Detector (Gemini)',
              modelVersion: 'gemini-3.5-flash',
              scanTimestamp: new Date().toISOString(),
              classification: 'ai',
              probabilityScore: 0.95,
              confidence: 'high',
              burstiness: 18.5,
              perplexity: 13.5,
              sentences: [
                {
                  id: 's-0',
                  text: 'Technology has become integral to contemporary educational environments.',
                  label: 'ai',
                  score: 0.95,
                  tier: 'ai-generated',
                  tierLabel: 'AI-generated',
                },
              ],
              fourTierDistribution: {
                humanWritten: 0,
                humanWrittenAiRefined: 0,
                aiGeneratedAiRefined: 0,
                aiGenerated: 100,
              },
            },
          },
        ],
      });

      render(<AIChecker onSelectView={vi.fn()} />);

      const checkerInput = screen.getByLabelText(/document for verification/i);
      fireEvent.change(checkerInput, { target: { value: rawAiText } });

      const checkBtn = screen.getByRole('button', { name: /check text/i });
      fireEvent.click(checkBtn);

      await waitFor(() => {
        // Must honestly display 95% AI probability — NOT artificially lowered
        expect(screen.getByText('95%')).toBeInTheDocument();
        expect(screen.getByText('High AI Probability')).toBeInTheDocument();
      });
    });

    it('ensures ACADEMIC_TRANSITIONS do not contain banned robotic AI signposts', () => {
      // Banned repetitive AI markers
      const bannedSignposts = ['Consequently,', 'Moreover,', 'Furthermore,', 'Therefore,', 'Notably,'];
      bannedSignposts.forEach((marker) => {
        expect(ACADEMIC_TRANSITIONS).not.toContain(marker);
      });
    });
  });
});
