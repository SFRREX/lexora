import { useState, useCallback, useRef } from 'react';
import {
  Wand2,
  Trash2,
  FileText,
  Loader2,
  ClipboardPaste,
  Sparkles,
  Clock,
  AlignLeft,
  CheckCheck,
} from 'lucide-react';
import ToolSelector from './ToolSelector.jsx';
import ResultPanel from './ResultPanel.jsx';
import InteractiveGrammarCanvas from './InteractiveGrammarCanvas.jsx';
import GrammarInspector from './GrammarInspector.jsx';
import { TOOL_LIST, processText, checkGrammarSpans } from '../services/textProcessor.js';
import { calculateHealthScore, EXAMPLE_TEXT } from '../utils/textRules.js';

function countWords(text) {
  if (!text || !text.trim()) return 0;
  return text.trim().split(/\s+/).length;
}

function countSentences(text) {
  if (!text || !text.trim()) return 0;
  return text.split(/[.!?]+/).filter(Boolean).length;
}

function estimateReadingTime(words) {
  if (words === 0) return '0 min';
  const minutes = Math.ceil(words / 200);
  return `${minutes} min read`;
}

export default function WritingEditor({ onSelectView }) {
  const [inputText, setInputText] = useState(() => {
    try {
      const saved = sessionStorage.getItem('lexora_studio_draft');
      if (saved) {
        sessionStorage.removeItem('lexora_studio_draft');
        return saved;
      }
    } catch {
      // ignore
    }
    return '';
  });
  const [selectedTool, setSelectedTool] = useState('grammar');
  const [result, setResult] = useState('');
  const [source, setSource] = useState('');
  const [model, setModel] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [corrections, setCorrections] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [hasFixedGrammar, setHasFixedGrammar] = useState(false);
  const [replacedFromAI, setReplacedFromAI] = useState(false);
  const [isAnalyzingSpans, setIsAnalyzingSpans] = useState(false);
  const [hasScannedSpans, setHasScannedSpans] = useState(false);
  const scanSeqRef = useRef(0);

  const inputWords = countWords(inputText);
  const inputChars = inputText.length;
  const inputSentences = countSentences(inputText);
  const readingTime = estimateReadingTime(inputWords);
  const resultWords = countWords(result);
  const healthScore = calculateHealthScore(inputText, corrections);

  const handleProcess = useCallback(async () => {
    if (loading) return; // prevent duplicate requests
    setError('');
    setResult('');
    setSource('');
    setModel('');

    if (!inputText.trim()) {
      setError('Please enter some text before processing.');
      return;
    }

    const currentSeq = ++scanSeqRef.current;
    setLoading(true);
    if (selectedTool === 'grammar') {
      setIsAnalyzingSpans(true);
    }

    try {
      if (selectedTool === 'grammar') {
        const spanRes = await checkGrammarSpans(inputText);

        if (currentSeq !== scanSeqRef.current) return;

        const foundCorrections = Array.isArray(spanRes?.corrections) ? spanRes.corrections : [];
        setCorrections(foundCorrections);
        setHasScannedSpans(true);
        if (foundCorrections.length === 0) {
          setHasFixedGrammar(false);
        }
      } else {
        const { result: processed, source: src, model: mdl } = await processText(inputText, selectedTool);
        if (currentSeq !== scanSeqRef.current) return;
        setResult(processed);
        setSource(src);
        setModel(mdl || '');
      }
    } catch (err) {
      if (currentSeq === scanSeqRef.current) {
        setError(err.message || 'Something went wrong. Please try again.');
      }
    } finally {
      if (currentSeq === scanSeqRef.current) {
        setLoading(false);
        setIsAnalyzingSpans(false);
      }
    }
  }, [inputText, selectedTool, loading]);

  function handleInputChange(e) {
    const val = e.target.value;
    scanSeqRef.current++;
    setInputText(val);
    if (hasFixedGrammar) setHasFixedGrammar(false);
    if (replacedFromAI) setReplacedFromAI(false);
    setHasScannedSpans(false);
    setIsAnalyzingSpans(false);
    if (!val.trim()) {
      setCorrections([]);
    }
  }

  function handleClear() {
    scanSeqRef.current++;
    setInputText('');
    setResult('');
    setSource('');
    setError('');
    setCorrections([]);
    setHasFixedGrammar(false);
    setReplacedFromAI(false);
    setHasScannedSpans(false);
    setIsAnalyzingSpans(false);
  }

  function handleLoadExample() {
    scanSeqRef.current++;
    setInputText(EXAMPLE_TEXT);
    setResult('');
    setSource('');
    setError('');
    setCorrections([]);
    setHasFixedGrammar(false);
    setReplacedFromAI(false);
    setHasScannedSpans(false);
    setIsAnalyzingSpans(false);
  }

  function handleApplyCorrection(corr) {
    if (!corr) return;
    let newText;
    if (
      typeof corr.startIndex === 'number' &&
      typeof corr.endIndex === 'number' &&
      inputText.slice(corr.startIndex, corr.endIndex) === corr.original
    ) {
      newText = inputText.slice(0, corr.startIndex) + corr.replacement + inputText.slice(corr.endIndex);
    } else if (inputText.includes(corr.original)) {
      newText = inputText.replace(corr.original, corr.replacement);
    } else {
      return;
    }
    scanSeqRef.current++;
    setInputText(newText);
    setCorrections((prev) => {
      const next = prev.filter((c) => c !== corr);
      if (next.length === 0) {
        setHasFixedGrammar(true);
        setHasScannedSpans(true);
        setIsAnalyzingSpans(false);
      }
      return next;
    });
  }

  function handleDismissCorrection(corr) {
    setCorrections((prev) => {
      const next = prev.filter((c) => c !== corr);
      if (next.length === 0) {
        setHasScannedSpans(true);
        setIsAnalyzingSpans(false);
      }
      return next;
    });
  }

  function handleApplyAllCorrections() {
    if (corrections.length === 0) return;
    // Apply backwards so earlier span indices remain intact
    const sorted = [...corrections].sort((a, b) => (b.startIndex || 0) - (a.startIndex || 0));
    let newText = inputText;

    for (const corr of sorted) {
      if (
        typeof corr.startIndex === 'number' &&
        typeof corr.endIndex === 'number' &&
        newText.slice(corr.startIndex, corr.endIndex) === corr.original
      ) {
        newText = newText.slice(0, corr.startIndex) + corr.replacement + newText.slice(corr.endIndex);
      } else if (newText.includes(corr.original)) {
        newText = newText.replace(corr.original, corr.replacement);
      }
    }
    scanSeqRef.current++;
    setInputText(newText);
    setCorrections([]);
    setHasFixedGrammar(true);
    setHasScannedSpans(true);
    setIsAnalyzingSpans(false);
  }

  async function handlePaste() {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        scanSeqRef.current++;
        setInputText(text);
        setResult('');
        setSource('');
        setError('');
        setCorrections([]);
        setHasFixedGrammar(false);
        setReplacedFromAI(false);
        setHasScannedSpans(false);
        setIsAnalyzingSpans(false);
      }
    } catch {
      const el = document.getElementById('editor-input');
      if (el) el.focus();
    }
  }

  function handleReplaceOriginal() {
    if (result) {
      setInputText(result);
      setResult('');
      setSource('');
      setReplacedFromAI(true);
      setHasFixedGrammar(false);
    }
  }

  function handleRetry() {
    handleProcess();
  }

  return (
    <section id="editor" className="py-20 scroll-mt-16 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-8">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-[#23585c] dark:text-[#74b6ba] bg-[#eef6f7] dark:bg-[#121f24] border border-[#a2d0d3]/80 dark:border-[#224448] rounded-full mb-3 shadow-xs">
            <Sparkles size={13} className="text-[#38858a] dark:text-[#4fa3a8]" />
            AI-Powered Writing Studio
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold font-heading text-slate-900 dark:text-slate-100 mb-3 tracking-tight">
            Your Personal Writing Assistant
          </h2>
          <p className="text-base sm:text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Real-time grammar proofreading, interactive suggestions, and intelligent prose refining.
          </p>
        </div>

        {/* Tool selector */}
        <div className="mb-8 flex justify-center">
          <ToolSelector
            tools={TOOL_LIST}
            selectedTool={selectedTool}
            onSelect={setSelectedTool}
          />
        </div>

        {/* Editor container */}
        <div className="bg-white dark:bg-[#14171f] rounded-3xl border border-slate-200/90 dark:border-[#222734] shadow-md shadow-slate-200/40 dark:shadow-none p-4 sm:p-6 lg:p-8 transition-colors">
          {/* Editor grid */}
          <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">
            {/* Left panel: Interactive Canvas or Textarea */}
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <label
                    htmlFor="editor-input"
                    className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2"
                  >
                    {selectedTool === 'grammar' ? (
                      <Sparkles size={16} className="text-[#38858a] dark:text-[#4fa3a8]" />
                    ) : (
                      <AlignLeft size={16} className="text-slate-400 dark:text-slate-500" />
                    )}
                    {selectedTool === 'grammar' ? 'Document Canvas' : 'Document Draft'}
                  </label>

                  {selectedTool === 'grammar' ? (
                    !inputText.trim() ? null : isAnalyzingSpans || loading ? (
                      <span
                        data-testid="grammar-status-analyzing"
                        className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#38858a] dark:text-[#4fa3a8] bg-[#38858a]/10 dark:bg-[#38858a]/20 px-2.5 py-0.5 rounded-full border border-[#38858a]/30 shadow-xs animate-in fade-in duration-200"
                      >
                        <Loader2 size={12} className="animate-spin text-[#38858a] dark:text-[#4fa3a8]" />
                        Checking draft…
                      </span>
                    ) : hasScannedSpans && (hasFixedGrammar || corrections.length === 0) ? (
                      <span
                        data-testid="grammar-status-clear"
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 shadow-xs animate-in fade-in duration-200"
                      >
                        <CheckCheck size={12} className="text-emerald-600 dark:text-emerald-400" />
                        {hasFixedGrammar ? 'Fixed · Clean & Polished' : 'All Clear · No Issues'}
                      </span>
                    ) : corrections.length > 0 ? (
                      <span
                        data-testid="grammar-status-issues"
                        className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 px-2.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-800 shadow-xs"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                        {corrections.length} {corrections.length === 1 ? 'issue' : 'issues'} found
                      </span>
                    ) : (
                      <span
                        data-testid="grammar-status-unscanned"
                        className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-[#1a1e27] px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-[#282f3d] shadow-xs"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500" />
                        Unchecked draft
                      </span>
                    )
                  ) : replacedFromAI ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 shadow-xs">
                      <CheckCheck size={12} className="text-emerald-600 dark:text-emerald-400" />
                      Updated with AI result
                    </span>
                  ) : null}
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-400 dark:text-slate-500">
                  <span>
                    <strong className="text-slate-600 dark:text-slate-300 font-semibold">{inputWords}</strong>{' '}
                    {inputWords === 1 ? 'word' : 'words'}
                  </span>
                  <span>·</span>
                  <span>{inputChars} chars</span>
                  <span className="hidden sm:inline">·</span>
                  <span className="hidden sm:inline">
                    {inputSentences} {inputSentences === 1 ? 'sentence' : 'sentences'}
                  </span>
                  <span className="hidden sm:inline">·</span>
                  <span className="hidden sm:inline-flex items-center gap-1">
                    <Clock size={12} />
                    {readingTime}
                  </span>
                </div>
              </div>

              {selectedTool === 'grammar' ? (
                <InteractiveGrammarCanvas
                  text={inputText}
                  onChange={handleInputChange}
                  onKeyDown={(e) => {
                    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                      e.preventDefault();
                      handleProcess();
                    }
                  }}
                  corrections={corrections}
                  onApplyCorrection={handleApplyCorrection}
                  onDismissCorrection={handleDismissCorrection}
                  placeholder="Paste or type your text here. Check grammar, find better words, or improve your sentences..."
                  className="flex-1 min-h-65 lg:min-h-80"
                />
              ) : (
                <textarea
                  id="editor-input"
                  value={inputText}
                  onChange={handleInputChange}
                  onKeyDown={(e) => {
                    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                      e.preventDefault();
                      handleProcess();
                    }
                  }}
                  placeholder="Paste or type your text here. Check grammar, find better words, or improve your sentences..."
                  className="flex-1 min-h-65 lg:min-h-80 w-full rounded-2xl border border-slate-200 dark:border-[#262c3b] bg-slate-50/70 dark:bg-[#0c0e12] p-4 sm:p-5 text-sm sm:text-base text-slate-800 dark:text-slate-100 leading-relaxed resize-y placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#38858a]/20 focus:border-[#38858a] dark:focus:border-[#4fa3a8] focus:bg-white dark:focus:bg-[#10131a] transition-all shadow-inner"
                  aria-label="Original text input"
                />
              )}

              {/* Input action toolbar */}
              <div className="flex flex-wrap items-center gap-2 mt-4">
                <button
                  onClick={handlePaste}
                  className="inline-flex items-center gap-1.5 px-3 py-2 min-h-10 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-[#1a1e27] border border-slate-200 dark:border-[#282f3d] rounded-xl hover:bg-slate-50 dark:hover:bg-[#202634] hover:text-slate-900 dark:hover:text-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-[#38858a] cursor-pointer"
                  aria-label="Paste text from clipboard"
                  title="Paste from clipboard"
                >
                  <ClipboardPaste size={15} />
                  Paste
                </button>

                <button
                  onClick={handleLoadExample}
                  className="inline-flex items-center gap-1.5 px-3 py-2 min-h-10 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-[#1a1e27] border border-slate-200 dark:border-[#282f3d] rounded-xl hover:bg-slate-50 dark:hover:bg-[#202634] hover:text-slate-900 dark:hover:text-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-[#38858a] cursor-pointer"
                  aria-label="Load example text"
                >
                  <FileText size={15} />
                  Example Text
                </button>

                <button
                  onClick={handleClear}
                  className="inline-flex items-center gap-1.5 px-3 py-2 min-h-10 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-[#1a1e27] border border-slate-200 dark:border-[#282f3d] rounded-xl hover:bg-slate-50 dark:hover:bg-[#202634] hover:text-slate-900 dark:hover:text-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-[#38858a] cursor-pointer"
                  aria-label="Clear all text"
                >
                  <Trash2 size={15} />
                  Clear
                </button>

                <div className="ml-auto flex items-center gap-3">
                  <span className="hidden sm:inline text-xs text-slate-400 dark:text-slate-500">
                    <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-[#1a1e27] border border-slate-200 dark:border-[#282f3d] rounded text-[10px] font-mono text-slate-600 dark:text-slate-400">
                      Ctrl
                    </kbd>{' '}
                    +{' '}
                    <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-[#1a1e27] border border-slate-200 dark:border-[#282f3d] rounded text-[10px] font-mono text-slate-600 dark:text-slate-400">
                      Enter
                    </kbd>
                  </span>
                  <button
                    onClick={
                      selectedTool === 'grammar' && corrections.length > 0
                        ? handleApplyAllCorrections
                        : handleProcess
                    }
                    disabled={loading}
                    className={`inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-2.5 min-h-10.5 text-sm font-semibold text-white rounded-xl disabled:opacity-60 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-[#14171f] cursor-pointer ${
                      selectedTool === 'grammar' && corrections.length > 0
                        ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20 focus:ring-emerald-500'
                        : 'bg-[#38858a] hover:bg-[#2c6e73] shadow-[#38858a]/20 focus:ring-[#38858a]'
                    }`}
                    aria-label="Improve text"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Processing…
                      </>
                    ) : selectedTool === 'grammar' ? (
                      corrections.length > 0 ? (
                        <>
                          <CheckCheck size={16} />
                          Fix All Errors ({corrections.length})
                        </>
                      ) : (
                        <>
                          <CheckCheck size={16} />
                          Check Grammar
                        </>
                      )
                    ) : (
                      <>
                        <Wand2 size={16} />
                        Improve Text
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Right panel: Grammar Inspector or Rewrite Result */}
            <div>
              {error ? (
                <div className="flex flex-col h-full">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Improved text
                  </label>
                  <div
                    className="flex-1 min-h-65 lg:min-h-80 rounded-2xl border border-red-200 dark:border-red-900/60 bg-red-50/70 dark:bg-red-950/40 p-5 text-sm text-red-700 dark:text-red-300 flex flex-col items-center justify-center text-center transition-colors"
                    role="alert"
                  >
                    <p className="font-medium mb-1">Processing Error</p>
                    <p className="text-xs text-red-600 dark:text-red-400 max-w-sm">{error}</p>
                    <button
                      onClick={handleRetry}
                      className="mt-3 px-3 py-1.5 text-xs font-semibold text-red-700 dark:text-red-300 bg-white dark:bg-red-900/50 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/80 transition-colors cursor-pointer"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              ) : selectedTool === 'grammar' ? (
                <GrammarInspector
                  healthScore={healthScore}
                  corrections={corrections}
                  categoryFilter={categoryFilter}
                  onSelectCategory={setCategoryFilter}
                  onApplyCorrection={handleApplyCorrection}
                  onApplyAll={handleApplyAllCorrections}
                  onDismissCorrection={handleDismissCorrection}
                  hasScanned={hasScannedSpans}
                  isAnalyzing={isAnalyzingSpans || loading}
                  hasText={Boolean(inputText.trim())}
                  hasFixed={hasFixedGrammar}
                  className="flex-1 min-h-65 lg:min-h-80"
                />
              ) : loading ? (
                <div className="flex flex-col h-full">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Improved text
                  </label>
                  <div className="flex-1 min-h-65 lg:min-h-80 rounded-2xl border border-slate-200 dark:border-[#222734] bg-slate-50/50 dark:bg-[#0c0e12] p-5 flex flex-col items-center justify-center transition-colors">
                    <Loader2 size={24} className="animate-spin text-[#38858a] dark:text-[#4fa3a8] mb-3" />
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Refining your words…</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                      Applying {TOOL_LIST.find((t) => t.id === selectedTool)?.label || 'corrections'}
                    </p>
                  </div>
                </div>
              ) : (
                <ResultPanel
                  result={result}
                  source={source}
                  model={model}
                  wordCount={resultWords}
                  originalWordCount={inputWords}
                  originalText={inputText}
                  onRetry={handleRetry}
                  onReplaceOriginal={handleReplaceOriginal}
                  onSelectView={onSelectView}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
