import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AcademicRefiner from '../components/AcademicRefiner.jsx';

// Mock suiteServices
vi.mock('../services/suiteServices.js', () => ({
  runAcademicRefinement: vi.fn().mockImplementation((text, options) => {
    return Promise.resolve({
      originalText: text,
      refinedText: 'At a median follow-up, the study demonstrated positive outcomes [1, 2].',
      mode: options.mode || 'academic',
      level: options.level || 'balanced',
      intensity: options.intensity ?? 65,
      source: 'local-rules',
      preservedCitations: ['[1, 2]'],
      unslopCount: 2,
      detectedSlop: [],
      editorialHighlights: ['Purged 2 stock clichés', 'Protected 1 citations'],
      refinedMetrics: { burstiness: 45.2, fleschReadingEase: 62 },
    });
  }),
}));

describe('AcademicRefiner Component (Task 5)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it('renders intensity slider with presets and responds to change', () => {
    render(<AcademicRefiner onSelectView={vi.fn()} />);

    // Slider exists
    const slider = screen.getByRole('slider', { name: /intensity/i });
    expect(slider).toBeInTheDocument();
    expect(slider.value).toBe('65');

    // Click 90% Deep Humanize preset
    const deepPreset = screen.getByRole('button', { name: /90%|deep/i });
    fireEvent.click(deepPreset);
    expect(slider.value).toBe('90');
  });

  it('detects citations in input and displays Citation Shield badge', () => {
    render(<AcademicRefiner onSelectView={vi.fn()} />);

    const textarea = screen.getByPlaceholderText(/paste your abstract/i);
    fireEvent.change(textarea, {
      target: { value: 'This study delves into frameworks (Smith et al., 2023) and [1, 2].' },
    });

    // Citation Shield badge shows detected count
    expect(screen.getByText(/citation shield/i)).toBeInTheDocument();
    expect(screen.getByText(/2 protected/i)).toBeInTheDocument();
  });

  it('sends refined draft to Studio via sessionStorage and onSelectView', async () => {
    const onSelectView = vi.fn();
    render(<AcademicRefiner onSelectView={onSelectView} />);

    const textarea = screen.getByPlaceholderText(/paste your abstract/i);
    fireEvent.change(textarea, {
      target: { value: 'We delve into the study [1, 2].' },
    });

    const refineBtn = screen.getByRole('button', { name: /refine academic prose/i });
    fireEvent.click(refineBtn);

    await waitFor(() => {
      expect(screen.getByText(/refinement complete/i)).toBeInTheDocument();
    });

    // Find Open in Studio / Send to Studio button
    const studioBtn = screen.getByRole('button', { name: /studio/i });
    fireEvent.click(studioBtn);

    expect(sessionStorage.getItem('lexora_studio_draft')).toContain('[1, 2]');
    expect(onSelectView).toHaveBeenCalledWith('studio');
  });
});
