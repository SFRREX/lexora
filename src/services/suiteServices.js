/**
 * suiteServices.js — Client-side API wrappers for the Lexora AI Intelligence Suite:
 * - AI Checker (GPTZero / Copyleaks)
 * - Academic Refiner
 * - Research Benchmarking
 */

export async function fetchDetectorStatuses() {
  try {
    const res = await fetch('/api/detectors/status');
    if (!res.ok) {
      throw new Error(`Failed to fetch detector statuses (HTTP ${res.status})`);
    }
    const data = await res.json();
    return data.providers || [];
  } catch (err) {
    console.warn('Could not fetch detector status from backend:', err.message);
    return [];
  }
}

export async function runAiDetection(text, providers = ['gemini', 'stylometrics']) {
  if (!text || !text.trim()) {
    throw new Error('Please enter text to analyze.');
  }

  const response = await fetch('/api/detectors/scan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, providers }),
  });

  if (!response.ok) {
    const errorJson = await response.json().catch(() => ({}));
    throw new Error(errorJson.error || `Detection request failed with HTTP ${response.status}`);
  }

  return await response.json();
}

export async function runAcademicRefinement(text, options = {}) {
  if (!text || !text.trim()) {
    throw new Error('Please enter text for academic refinement.');
  }

  const {
    mode = 'academic',
    level = 'balanced',
    expandContractions = true,
    addTransitions = false,
    passiveVoice = false,
    formalSynonyms = true,
  } = options;

  const response = await fetch('/api/refine-academic', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text,
      mode,
      level,
      expandContractions,
      addTransitions,
      passiveVoice,
      formalSynonyms,
    }),
  });

  if (!response.ok) {
    const errorJson = await response.json().catch(() => ({}));
    throw new Error(errorJson.error || `Academic refinement failed with HTTP ${response.status}`);
  }

  return await response.json();
}
