import { useState, useCallback } from 'react';
import {
  Wand2,
  Trash2,
  FileText,
  Loader2,
  ClipboardPaste,
  Sparkles,
  Clock,
  AlignLeft,
  Check,
  CheckCheck,
  Layers,
} from 'lucide-react';
import ToolSelector from './ToolSelector.jsx';
import ResultPanel from './ResultPanel.jsx';
import { TOOL_LIST, processText, checkGrammarSpans } from '../services/textProcessor.js';
import { EXAMPLE_TEXT } from '../utils/textRules.js';

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
  const [inputText, setInputText] = useState('');
  const [selectedTool, setSelectedTool] = useState('grammar');
  const [result, setResult] = useState('');
  const [source, setSource] = useState('');
  const [model, setModel] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [corrections, setCorrections] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('all');

  const inputWords = countWords(inputText);
  const inputChars = inputText.length;
  const inputSentences = countSentences(inputText);
  const readingTime = estimateReadingTime(inputWords);
  const resultWords = countWords(result);

  const handleProcess = useCallback(async () => {
    if (loading) return; // prevent duplicate requests
    setError('');
    setResult('');
    setSource('');
    setModel('');
    setCorrections([]);

    if (!inputText.trim()) {
      setError('Please enter some text before processing.');
      return;
    }

    setLoading(true);
    try {
      if (selectedTool === 'grammar') {
        const [processRes, spanRes] = await Promise.allSettled([
          processText(inputText, selectedTool),
          checkGrammarSpans(inputText),
        ]);

        if (processRes.status === 'fulfilled') {
          setResult(processRes.value.result);
          setSource(processRes.value.source);
          setModel(processRes.value.model || '');
        } else {
          throw processRes.reason;
        }

        if (spanRes.status === 'fulfilled' && spanRes.value?.corrections) {
          setCorrections(spanRes.value.corrections);
        }
      } else {
        const { result: processed, source: src, model: mdl } = await processText(inputText, selectedTool);
        setResult(processed);
        setSource(src);
        setModel(mdl || '');
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [inputText, selectedTool, loading]);

  function handleClear() {
    setInputText('');
    setResult('');
    setSource('');
    setError('');
    setCorrections([]);
  }

  function handleLoadExample() {
    setInputText(EXAMPLE_TEXT);
    setResult('');
    setSource('');
    setError('');
    setCorrections([]);
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
    setInputText(newText);
    setCorrections((prev) => prev.filter((c) => c !== corr));
  }

  function handleApplyAllCorrections() {
    if (corrections.length === 0) return;
    const hasValidIndices = corrections.every(
      (c) =>
        typeof c.startIndex === 'number' &&
        typeof c.endIndex === 'number' &&
        inputText.slice(c.startIndex, c.endIndex) === c.original
    );

    let newText = inputText;
    if (hasValidIndices) {
      // Apply backwards so earlier span indices remain intact
      const sorted = [...corrections].sort((a, b) => b.startIndex - a.startIndex);
      for (const corr of sorted) {
        newText = newText.slice(0, corr.startIndex) + corr.replacement + newText.slice(corr.endIndex);
      }
    } else {
      for (const corr of corrections) {
        if (newText.includes(corr.original)) {
          newText = newText.replace(corr.original, corr.replacement);
        }
      }
    }
    setInputText(newText);
    setCorrections([]);
  }

  async function handlePaste() {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setInputText(text);
        setResult('');
        setSource('');
        setError('');
      }
    } catch {
      // Fallback: focus the input
      const el = document.getElementById('editor-input');
      if (el) el.focus();
    }
  }

  function handleReplaceOriginal() {
    if (result) {
      setInputText(result);
      setResult('');
      setSource('');
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
            Paste your text, choose an improvement, and make every sentence clearer.
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
            {/* Input panel */}
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="editor-input" className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <AlignLeft size={16} className="text-slate-400 dark:text-slate-500" />
                  Original text
                </label>
                <div className="flex items-center gap-3 text-xs text-slate-400 dark:text-slate-500">
                  <span>
                    <strong className="text-slate-600 dark:text-slate-300 font-semibold">{inputWords}</strong> {inputWords === 1 ? 'word' : 'words'}
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

              <textarea
                id="editor-input"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                    e.preventDefault();
                    handleProcess();
                  }
                }}
                placeholder="Paste or type your text here. Check grammar, find better words, or improve your sentences..."
                className="flex-1 min-h-55 lg:min-h-70 w-full rounded-2xl border border-slate-200 dark:border-[#262c3b] bg-slate-50/70 dark:bg-[#0c0e12] p-4 sm:p-5 text-sm sm:text-base text-slate-800 dark:text-slate-100 leading-relaxed resize-y placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#38858a]/20 focus:border-[#38858a] dark:focus:border-[#4fa3a8] focus:bg-white dark:focus:bg-[#10131a] transition-all shadow-inner"
                aria-label="Original text input"
              />

              {/* Input actions */}
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
                    <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-[#1a1e27] border border-slate-200 dark:border-[#282f3d] rounded text-[10px] font-mono text-slate-600 dark:text-slate-400">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-[#1a1e27] border border-slate-200 dark:border-[#282f3d] rounded text-[10px] font-mono text-slate-600 dark:text-slate-400">Enter</kbd>
                  </span>
                  <button
                    onClick={handleProcess}
                    disabled={loading}
                    className="inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-2.5 min-h-10.5 text-sm font-semibold text-white bg-[#38858a] hover:bg-[#2c6e73] rounded-xl disabled:opacity-60 disabled:cursor-not-allowed shadow-md shadow-[#38858a]/20 hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-[#38858a] focus:ring-offset-2 dark:focus:ring-offset-[#14171f] cursor-pointer"
                    aria-label="Improve text"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Processing…
                      </>
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

            {/* Output panel */}
            <div>
              {error ? (
                <div className="flex flex-col h-full">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Improved text
                  </label>
                  <div
                    className="flex-1 min-h-55 lg:min-h-70 rounded-2xl border border-red-200 dark:border-red-900/60 bg-red-50/70 dark:bg-red-950/40 p-5 text-sm text-red-700 dark:text-red-300 flex flex-col items-center justify-center text-center transition-colors"
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
              ) : loading ? (
                <div className="flex flex-col h-full">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Improved text
                  </label>
                  <div className="flex-1 min-h-55 lg:min-h-70 rounded-2xl border border-slate-200 dark:border-[#222734] bg-slate-50/50 dark:bg-[#0c0e12] p-5 flex flex-col items-center justify-center transition-colors">
                    <Loader2 size={24} className="animate-spin text-[#38858a] dark:text-[#4fa3a8] mb-3" />
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Refining your words…</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Applying {TOOL_LIST.find(t => t.id === selectedTool)?.label || 'corrections'}</p>
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

          {/* Granular proofreading suggestions panel */}
          {corrections.length > 0 && (
            <div className="mt-8 pt-8 border-t border-slate-200/90 dark:border-[#222734]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#38858a]/15 dark:bg-[#38858a]/25 text-[#23585c] dark:text-[#74b6ba] text-xs font-bold">
                      {corrections.length}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <Layers size={16} className="text-[#38858a] dark:text-[#4fa3a8]" />
                      Granular Proofreading Suggestions
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Minimal-span editorial recommendations. Apply individually or accept all at once.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex bg-slate-100 dark:bg-[#1a1e27] p-1 rounded-xl text-xs">
                    {['all', 'grammar', 'spelling', 'punctuation', 'style'].map((cat) => {
                      const count =
                        cat === 'all'
                          ? corrections.length
                          : corrections.filter((c) => c.type === cat).length;
                      if (cat !== 'all' && count === 0) return null;
                      return (
                        <button
                          key={cat}
                          onClick={() => setCategoryFilter(cat)}
                          className={`px-2.5 py-1 rounded-lg font-medium capitalize transition-all cursor-pointer ${
                            categoryFilter === cat
                              ? 'bg-white dark:bg-[#282f3d] text-slate-900 dark:text-white shadow-xs'
                              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                          }`}
                        >
                          {cat} ({count})
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={handleApplyAllCorrections}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors cursor-pointer"
                    aria-label="Apply all corrections"
                  >
                    <CheckCheck size={14} />
                    Apply All
                  </button>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
                {corrections
                  .filter((c) => categoryFilter === 'all' || c.type === categoryFilter)
                  .map((c, i) => {
                    const badgeStyles =
                      {
                        grammar:
                          'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800',
                        spelling:
                          'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
                        punctuation:
                          'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
                        style:
                          'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800',
                      }[c.type] || 'bg-slate-50 text-slate-700 border-slate-200';

                    return (
                      <div
                        key={i}
                        className="p-3.5 rounded-2xl border border-slate-200 dark:border-[#222734] bg-slate-50/70 dark:bg-[#10131a] flex flex-col justify-between text-xs transition-colors hover:border-[#38858a]/40"
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border uppercase tracking-wider ${badgeStyles}`}
                          >
                            {c.type}
                          </span>
                          <button
                            onClick={() => handleApplyCorrection(c)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 font-semibold transition-colors cursor-pointer"
                            aria-label={`Apply correction: replace ${c.original} with ${c.replacement}`}
                          >
                            <Check size={12} />
                            Apply
                          </button>
                        </div>

                        <div className="flex items-center gap-2 font-mono text-xs mb-1.5 flex-wrap">
                          <span className="line-through text-red-500/90 dark:text-red-400/90 bg-red-50 dark:bg-red-950/40 px-1.5 py-0.5 rounded">
                            {c.original}
                          </span>
                          <span className="text-slate-400">→</span>
                          <span className="font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded">
                            {c.replacement}
                          </span>
                        </div>

                        {c.explanation && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                            {c.explanation}
                          </p>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
