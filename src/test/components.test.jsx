import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import WritingEditor from '../components/WritingEditor.jsx';
import WordEnhancer from '../components/WordEnhancer.jsx';
import ResultPanel from '../components/ResultPanel.jsx';
import BeforeAfter from '../components/BeforeAfter.jsx';
import FinalCTA from '../components/FinalCTA.jsx';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';

describe('React Components', () => {
  describe('WritingEditor component', () => {
    it('renders editor input, action buttons, and word counts', () => {
      render(<WritingEditor />);
      expect(screen.getByLabelText(/Original text input/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Improve text/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Example text/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Clear/i })).toBeInTheDocument();
    });

    it('loads example text when "Example Text" button is clicked', () => {
      render(<WritingEditor />);
      const exampleBtn = screen.getByRole('button', { name: /Example text/i });
      fireEvent.click(exampleBtn);
      const textarea = screen.getByLabelText(/Original text input/i);
      expect(textarea.value).toContain('I am writing this email');
    });

    it('clears text when "Clear" button is clicked', () => {
      render(<WritingEditor />);
      const textarea = screen.getByLabelText(/Original text input/i);
      fireEvent.change(textarea, { target: { value: 'Some sample text' } });
      expect(textarea.value).toBe('Some sample text');

      const clearBtn = screen.getByRole('button', { name: /Clear/i });
      fireEvent.click(clearBtn);
      expect(textarea.value).toBe('');
    });

    it('shows validation error when Improve Text is clicked on empty input', async () => {
      render(<WritingEditor />);
      const improveBtn = screen.getByRole('button', { name: /Improve text/i });
      fireEvent.click(improveBtn);
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText(/Please enter some text/i)).toBeInTheDocument();
      });
    });

    it('displays professional "Document Canvas" header instead of "Original text"', () => {
      render(<WritingEditor />);
      // Default tool is grammar
      expect(screen.getByText(/Document Canvas/i)).toBeInTheDocument();
      expect(screen.queryByText(/^Original text$/i)).not.toBeInTheDocument();
    });

    it('does not prematurely display "All Clear" badge when text is freshly entered', () => {
      render(<WritingEditor />);
      const textarea = screen.getByLabelText(/Original text input/i);
      fireEvent.change(textarea, { target: { value: 'This are an bad sentence with grammer issues.' } });

      // Must NOT claim "All Clear · No Issues" prematurely on freshly entered unscanned text
      expect(screen.queryByText(/All Clear · No Issues/i)).not.toBeInTheDocument();
      // Should show checking or unchecked draft indicator
      expect(
        screen.queryByTestId('grammar-status-analyzing') || screen.queryByTestId('grammar-status-unscanned')
      ).toBeTruthy();
    });

    it('shows checking draft badge while grammar scan is in progress', () => {
      render(<WritingEditor />);
      const textarea = screen.getByLabelText(/Original text input/i);
      fireEvent.change(textarea, { target: { value: 'Analyzing this new paragraph of text.' } });

      expect(screen.getByTestId('grammar-status-analyzing')).toBeInTheDocument();
      expect(screen.getByText(/Checking draft…/i)).toBeInTheDocument();
    });
  });

  describe('WordEnhancer component', () => {
    it('renders input field and quick lookup buttons', () => {
      render(<WordEnhancer />);
      expect(screen.getByLabelText(/Word to find alternatives for/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Find word alternatives/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'good' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'important' })).toBeInTheDocument();
    });

    it('triggers word search when popular word chip is clicked', async () => {
      render(<WordEnhancer />);
      const chip = screen.getByRole('button', { name: 'good' });
      fireEvent.click(chip);

      await waitFor(() => {
        expect(screen.getByText(/Professional/i)).toBeInTheDocument();
        expect(screen.getByText('excellent')).toBeInTheDocument();
      });
    });
  });

  describe('ResultPanel component', () => {
    it('renders empty placeholder state when result is empty', () => {
      render(<ResultPanel result="" source="" />);
      expect(screen.getByText(/Your improved text will appear here/i)).toBeInTheDocument();
    });

    it('renders improved text and action buttons when result is provided', () => {
      render(
        <ResultPanel
          result="This is improved text."
          source="demo"
          model=""
          wordCount={4}
          originalWordCount={5}
          originalText="This is not improved text."
          onRetry={vi.fn()}
          onReplaceOriginal={vi.fn()}
          onSelectView={vi.fn()}
        />
      );
      expect(screen.getByText('This is improved text.')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Copy improved text/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Try again/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Replace original text/i })).toBeInTheDocument();
    });
  });

  describe('BeforeAfter component', () => {
    it('renders comparison cards and handles onSelectView callback', () => {
      const onSelectView = vi.fn();
      render(<BeforeAfter onSelectView={onSelectView} />);
      expect(screen.getByText(/See the Difference/i)).toBeInTheDocument();
      expect(screen.getByText(/Wordy & Clunky/i)).toBeInTheDocument();

      const tryBtn = screen.getByRole('link', { name: /Try It Yourself/i });
      fireEvent.click(tryBtn);
      expect(onSelectView).toHaveBeenCalledWith('studio');
    });
  });

  describe('FinalCTA component', () => {
    it('renders CTA heading and calls onSelectView on click', () => {
      const onSelectView = vi.fn();
      render(<FinalCTA onSelectView={onSelectView} />);
      expect(screen.getByText(/Your Ideas Deserve Better Words/i)).toBeInTheDocument();

      const startBtn = screen.getByRole('link', { name: /Start Improving Your Writing/i });
      fireEvent.click(startBtn);
      expect(onSelectView).toHaveBeenCalledWith('studio');
    });
  });

  describe('Navbar component', () => {
    it('renders brand and navigation tabs', () => {
      const onSelectView = vi.fn();
      render(<Navbar currentView="studio" onSelectView={onSelectView} />);
      expect(screen.getAllByText(/Lexora/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByRole('button', { name: /Writing Studio/i }).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByRole('button', { name: /AI Checker/i }).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByRole('button', { name: /Academic Refiner/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Research Lab/i })).toBeInTheDocument();
    });

    it('switches view when navigation tab is clicked', () => {
      const onSelectView = vi.fn();
      render(<Navbar currentView="studio" onSelectView={onSelectView} />);
      const checkerTabs = screen.getAllByRole('button', { name: /AI Checker/i });
      fireEvent.click(checkerTabs[0]);
      expect(onSelectView).toHaveBeenCalledWith('checker');
    });
  });

  describe('Footer component', () => {
    it('renders footer links and branding', () => {
      const onSelectView = vi.fn();
      render(<Footer onSelectView={onSelectView} />);
      expect(screen.getAllByText(/Intelligence Suite/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Resources & Legal')).toBeInTheDocument();
      expect(screen.getByText(/All rights reserved/i)).toBeInTheDocument();
    });
  });
});
