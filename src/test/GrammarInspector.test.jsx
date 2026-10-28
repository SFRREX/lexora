import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import GrammarInspector from '../components/GrammarInspector.jsx';

describe('GrammarInspector Component', () => {
  const sampleCorrections = [
    {
      original: 'have conducted',
      replacement: 'has conducted',
      explanation: 'Subject-verb agreement: singular noun requires "has"',
      type: 'grammar',
      startIndex: 15,
      endIndex: 29,
    },
    {
      original: 'in order to',
      replacement: 'to',
      explanation: 'Wordiness: simplify "in order to" to "to"',
      type: 'clarity',
      startIndex: 45,
      endIndex: 56,
    },
  ];

  it('renders overall document health score and status', () => {
    render(
      <GrammarInspector
        healthScore={88}
        corrections={sampleCorrections}
        onApplyAll={() => {}}
        onApplyCorrection={() => {}}
      />
    );

    expect(screen.getByText('88')).toBeInTheDocument();
    expect(screen.getByText(/100/i)).toBeInTheDocument();
    expect(screen.getByText(/Document Health/i)).toBeInTheDocument();
  });

  it('renders category count filters and changes filter on click', () => {
    const onSelectCat = vi.fn();
    render(
      <GrammarInspector
        healthScore={88}
        corrections={sampleCorrections}
        categoryFilter="all"
        onSelectCategory={onSelectCat}
        onApplyAll={() => {}}
        onApplyCorrection={() => {}}
      />
    );

    const clarityBtn = screen.getByRole('button', { name: /clarity/i });
    expect(clarityBtn).toBeInTheDocument();
    fireEvent.click(clarityBtn);
    expect(onSelectCat).toHaveBeenCalledWith('clarity');
  });

  it('calls onApplyAll when Accept All button is clicked', () => {
    const onApplyAll = vi.fn();
    render(
      <GrammarInspector
        healthScore={88}
        corrections={sampleCorrections}
        onApplyAll={onApplyAll}
        onApplyCorrection={() => {}}
      />
    );

    const acceptAllBtn = screen.getByRole('button', { name: /Accept All/i });
    fireEvent.click(acceptAllBtn);
    expect(onApplyAll).toHaveBeenCalled();
  });

  it('calls onApplyCorrection when single Apply button is clicked', () => {
    const onApplySingle = vi.fn();
    render(
      <GrammarInspector
        healthScore={88}
        corrections={sampleCorrections}
        onApplyAll={() => {}}
        onApplyCorrection={onApplySingle}
      />
    );

    const applyBtns = screen.getAllByRole('button', { name: /^Apply$/i });
    fireEvent.click(applyBtns[0]);
    expect(onApplySingle).toHaveBeenCalledWith(sampleCorrections[0]);
  });

  it('renders empty draft state with "-- / 100 · Ready" when no text is present', () => {
    render(
      <GrammarInspector
        healthScore={100}
        corrections={[]}
        hasText={false}
        hasScanned={false}
        isAnalyzing={false}
      />
    );

    expect(screen.getByText('--')).toBeInTheDocument();
    expect(screen.getByText(/Ready/i)).toBeInTheDocument();
    expect(screen.getByText(/No document content/i)).toBeInTheDocument();
    expect(screen.queryByText(/No issues detected/i)).not.toBeInTheDocument();
  });

  it('renders analyzing state with spinner and "-- / 100" while scanning is in progress', () => {
    render(
      <GrammarInspector
        healthScore={100}
        corrections={[]}
        hasText={true}
        hasScanned={false}
        isAnalyzing={true}
      />
    );

    expect(screen.getByText('--')).toBeInTheDocument();
    expect(screen.getByText(/Analyzing draft…/i)).toBeInTheDocument();
    expect(screen.getByText(/Analyzing document…/i)).toBeInTheDocument();
    expect(screen.queryByText(/No issues detected/i)).not.toBeInTheDocument();
  });

  it('renders unscanned modified draft state with "-- / 100 · Ready to scan"', () => {
    render(
      <GrammarInspector
        healthScore={100}
        corrections={[]}
        hasText={true}
        hasScanned={false}
        isAnalyzing={false}
      />
    );

    expect(screen.getByText('--')).toBeInTheDocument();
    expect(screen.getByText(/Ready to scan/i)).toBeInTheDocument();
    expect(screen.getByText(/Ready to Review/i)).toBeInTheDocument();
    expect(screen.queryByText(/No issues detected/i)).not.toBeInTheDocument();
  });

  it('renders "No issues detected" ONLY after verified scan with 0 issues', () => {
    render(
      <GrammarInspector
        healthScore={100}
        corrections={[]}
        hasText={true}
        hasScanned={true}
        isAnalyzing={false}
      />
    );

    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText(/Excellent/i)).toBeInTheDocument();
    expect(screen.getByText(/No issues detected/i)).toBeInTheDocument();
    expect(screen.getByText(/clean and grammatically sound/i)).toBeInTheDocument();
  });

  it('renders "Clean & Polished" after user applied all fixes', () => {
    render(
      <GrammarInspector
        healthScore={100}
        corrections={[]}
        hasText={true}
        hasScanned={true}
        isAnalyzing={false}
        hasFixed={true}
      />
    );

    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText(/Clean & Polished/i)).toBeInTheDocument();
    expect(screen.getByText(/All suggestions applied/i)).toBeInTheDocument();
  });
});
