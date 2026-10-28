import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import InteractiveGrammarCanvas from '../components/InteractiveGrammarCanvas.jsx';

describe('InteractiveGrammarCanvas & SuggestionPopover', () => {
  const sampleText = 'The researcher have conducted the experiment.';
  const sampleCorrection = {
    original: 'have conducted',
    replacement: 'has conducted',
    explanation: 'Subject-verb agreement: singular noun requires "has"',
    type: 'grammar',
    startIndex: 15,
    endIndex: 29,
  };

  it('renders input textarea and mirrors text in backdrop', () => {
    render(
      <InteractiveGrammarCanvas
        text={sampleText}
        onChange={() => {}}
        corrections={[]}
      />
    );

    const textarea = screen.getByLabelText(/original text input/i);
    expect(textarea).toBeInTheDocument();
    expect(textarea.value).toBe(sampleText);
  });

  it('renders color-coded wavy underline mark for corrections and opens popover on click', () => {
    const onApply = vi.fn();
    const onDismiss = vi.fn();

    render(
      <InteractiveGrammarCanvas
        text={sampleText}
        onChange={() => {}}
        corrections={[sampleCorrection]}
        onApplyCorrection={onApply}
        onDismissCorrection={onDismiss}
      />
    );

    const mark = screen.getByTestId('error-mark-15');
    expect(mark).toBeInTheDocument();
    expect(mark.textContent).toBe('have conducted');
    expect(mark.className).toContain('lexora-underline-grammar');

    // Click mark to open popover
    fireEvent.click(mark);

    // Popover elements should now be visible
    expect(screen.getByText(/Subject-verb agreement/i)).toBeInTheDocument();
    expect(screen.getByText('has conducted')).toBeInTheDocument();

    // Click the replacement pill
    const replaceBtn = screen.getByRole('button', { name: /Apply: has conducted/i });
    fireEvent.click(replaceBtn);
    expect(onApply).toHaveBeenCalledWith(sampleCorrection);
  });

  it('dismisses popover when dismiss button is clicked', () => {
    const onDismiss = vi.fn();

    render(
      <InteractiveGrammarCanvas
        text={sampleText}
        onChange={() => {}}
        corrections={[sampleCorrection]}
        onDismissCorrection={onDismiss}
      />
    );

    const mark = screen.getByTestId('error-mark-15');
    fireEvent.click(mark);

    const dismissBtn = screen.getByRole('button', { name: /Dismiss suggestion/i });
    fireEvent.click(dismissBtn);
    expect(onDismiss).toHaveBeenCalledWith(sampleCorrection);
  });
});
