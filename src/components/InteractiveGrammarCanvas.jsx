import { useState, useRef } from 'react';
import SuggestionPopover from './SuggestionPopover.jsx';

export default function InteractiveGrammarCanvas({
  text = '',
  onChange,
  onKeyDown,
  corrections = [],
  onApplyCorrection,
  onDismissCorrection,
  placeholder = 'Paste or type your text here. Real-time grammar & spelling check will analyze your writing...',
  className = '',
}) {
  const [activeCorrection, setActiveCorrection] = useState(null);
  const [popoverPos, setPopoverPos] = useState(null);
  const textareaRef = useRef(null);
  const backdropRef = useRef(null);
  const containerRef = useRef(null);

  // Synchronize scroll between textarea and backdrop
  function handleScroll() {
    if (textareaRef.current && backdropRef.current) {
      backdropRef.current.scrollTop = textareaRef.current.scrollTop;
      backdropRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  }

  // Derive active correction if present in corrections
  const currentActiveCorrection =
    activeCorrection && corrections.includes(activeCorrection) ? activeCorrection : null;

  function handleMarkClick(e, corr) {
    e.stopPropagation();
    if (activeCorrection === corr) {
      setActiveCorrection(null);
      setPopoverPos(null);
      return;
    }

    const markRect = e.currentTarget.getBoundingClientRect();
    const containerRect = containerRef.current
      ? containerRef.current.getBoundingClientRect()
      : { top: 0, left: 0 };

    setPopoverPos({
      top: markRect.bottom - containerRect.top + 6,
      left: Math.min(markRect.left - containerRect.left, (containerRect.width || 360) - 300),
    });
    setActiveCorrection(corr);
  }

  function handleApply() {
    if (activeCorrection && onApplyCorrection) {
      onApplyCorrection(activeCorrection);
      setActiveCorrection(null);
      setPopoverPos(null);
    }
  }

  function handleDismiss() {
    if (activeCorrection && onDismissCorrection) {
      onDismissCorrection(activeCorrection);
    }
    setActiveCorrection(null);
    setPopoverPos(null);
  }

  // Build rendered markup for backdrop with highlights
  function renderBackdropContent() {
    if (!text) return null;
    if (!corrections || corrections.length === 0) {
      return text;
    }

    // Sort corrections chronologically
    const sorted = [...corrections].sort((a, b) => a.startIndex - b.startIndex);
    const nodes = [];
    let lastIndex = 0;

    sorted.forEach((corr, idx) => {
      // Unhighlighted text before this error
      if (corr.startIndex > lastIndex) {
        nodes.push(
          <span key={`text-${lastIndex}`}>{text.slice(lastIndex, corr.startIndex)}</span>
        );
      }

      // Validating span bounds against current text
      if (
        typeof corr.startIndex === 'number' &&
        typeof corr.endIndex === 'number' &&
        corr.startIndex >= 0 &&
        corr.endIndex <= text.length &&
        corr.startIndex < corr.endIndex
      ) {
        const errorText = text.slice(corr.startIndex, corr.endIndex);
        const underlineClass = `lexora-underline-${corr.type || 'grammar'}`;
        const isCurrent = activeCorrection === corr;

        nodes.push(
          <mark
            key={`corr-${idx}-${corr.startIndex}`}
            data-testid={`error-mark-${corr.startIndex}`}
            role="button"
            tabIndex={0}
            aria-label={`Suggestion: replace "${errorText}" with "${corr.replacement}". Type: ${corr.type}.`}
            onClick={(e) => handleMarkClick(e, corr)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleMarkClick(e, corr);
              }
            }}
            className={`${underlineClass} ${isCurrent ? 'lexora-underline-active' : ''} bg-transparent pointer-events-auto select-none cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-[#38858a] rounded-xs`}
            title={`${corr.type}: ${corr.explanation || corr.replacement}`}
          >
            {errorText}
          </mark>
        );
        lastIndex = corr.endIndex;
      }
    });

    if (lastIndex < text.length) {
      nodes.push(<span key={`text-end-${lastIndex}`}>{text.slice(lastIndex)}</span>);
    }

    return nodes;
  }

  return (
    <div
      ref={containerRef}
      className={`relative w-full rounded-2xl border border-slate-200 dark:border-[#262c3b] bg-slate-50/70 dark:bg-[#0c0e12] overflow-hidden transition-all ${className}`}
      onClick={() => {
        if (activeCorrection) {
          setActiveCorrection(null);
          setPopoverPos(null);
        }
      }}
    >
      {/* Mirrored Backdrop Highlight Layer */}
      <div
        ref={backdropRef}
        aria-hidden="true"
        className="absolute inset-0 p-4 sm:p-5 text-sm sm:text-base leading-relaxed whitespace-pre-wrap wrap-break-word overflow-y-auto pointer-events-none select-none text-transparent font-sans"
        style={{
          fontFamily: 'inherit',
          letterSpacing: 'normal',
          wordSpacing: 'normal',
        }}
      >
        {renderBackdropContent()}
        {/* Invisible trailing break to preserve bottom scrolling alignment */}
        <br />
      </div>

      {/* Primary Editable Textarea */}
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => {
          if (activeCorrection) {
            setActiveCorrection(null);
            setPopoverPos(null);
          }
          if (onChange) onChange(e);
        }}
        onScroll={handleScroll}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        className="relative z-10 w-full min-h-60 sm:min-h-75 p-4 sm:p-5 text-sm sm:text-base text-slate-800 dark:text-slate-100 leading-relaxed bg-transparent resize-y placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none transition-colors"
        id="editor-input"
        aria-label="Original text input"
        spellCheck={false}
      />

      {/* Suggestion Popover */}
      {currentActiveCorrection && (
        <SuggestionPopover
          correction={currentActiveCorrection}
          position={popoverPos}
          onApply={handleApply}
          onDismiss={handleDismiss}
        />
      )}
    </div>
  );
}
