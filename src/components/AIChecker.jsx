import { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Info,
  Layers,
  CheckCircle2,
  ClipboardPaste,
  Copy,
  Check,
  ArrowRight,
} from 'lucide-react';
import { runAiDetection, fetchDetectorStatuses } from '../services/suiteServices.js';
import { INITIAL_RESEARCH_DATASET } from '../utils/researchDataset.js';

export default function AIChecker({ onSelectView }) {
  const [text, setText] = useState('');
  const [selectedProviders, setSelectedProviders] = useState(['gemini', 'stylometrics']);
  const [providers, setProviders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState(null);
  const [activeSentence, setActiveSentence] = useState(null);
  const [copiedSummary, setCopiedSummary] = useState(false);

  // Load available provider statuses on mount
  useEffect(() => {
    fetchDetectorStatuses().then((list) => {
      setProviders(list);
    });
  }, []);

  const geminiConfig = providers.find((p) => p.id === 'gemini');
  const isGeminiConfigured = geminiConfig?.configured;
  const gptzeroConfig = providers.find((p) => p.id === 'gptzero');
  const isGptzeroConfigured = gptzeroConfig?.configured;
  const copyleaksConfig = providers.find((p) => p.id === 'copyleaks');

  const wordCount = text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0;
  const charCount = text.length;

  async function handleCheckText() {
    if (!text.trim()) {
      setError('Please enter or paste some text to analyze.');
      return;
    }
    if (wordCount < 10) {
      setError('Please provide at least 10 words for statistical text analysis.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setScanResult(null);

    try {
      const data = await runAiDetection(text, selectedProviders);
      setScanResult(data);
    } catch (err) {
      setError(err.message || 'An error occurred during AI detection.');
    } finally {
      setIsLoading(false);
    }
  }

  function handleClear() {
    setText('');
    setScanResult(null);
    setError(null);
    setActiveSentence(null);
  }

  async function handlePaste() {
    try {
      const clipText = await navigator.clipboard.readText();
      if (clipText) {
        setText(clipText);
        setScanResult(null);
        setError(null);
      }
    } catch {
      const el = document.getElementById('ai-checker-input');
      if (el) el.focus();
    }
  }

  function handleCopySummary() {
    if (!primaryResult) return;
    const summaryText = `Lexora AI Detection Report:
Classification: ${primaryResult.classification.toUpperCase()}
Reported AI Probability: ${primaryResult.probabilityScore !== null ? Math.round(primaryResult.probabilityScore * 100) + '%' : 'N/A'}
Burstiness Index: ${primaryResult.burstiness || 'N/A'}
Confidence: ${primaryResult.confidence}
Model: ${primaryResult.modelVersion}
Timestamp: ${primaryResult.scanTimestamp}`;

    navigator.clipboard.writeText(summaryText);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  }

  function loadSample(sampleId) {
    const s = INITIAL_RESEARCH_DATASET.find((item) => item.id === sampleId);
    if (s) {
      setText(s.text);
      setScanResult(null);
      setError(null);
    }
  }

  function toggleProvider(id) {
    if (selectedProviders.includes(id)) {
      if (selectedProviders.length > 1) {
        setSelectedProviders(selectedProviders.filter((p) => p !== id));
      }
    } else {
      setSelectedProviders([...selectedProviders, id]);
    }
  }

  // Get primary successful result (if any)
  const primaryResult = scanResult?.results?.find((r) => r.success && r.data)?.data;
  const missingConfigResults = scanResult?.results?.filter((r) => r.notConfigured) || [];

  return (
    <section id="ai-checker" className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto transition-colors">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#eef6f7] dark:bg-[#121f24] border border-[#a2d0d3]/80 dark:border-[#224448] text-[#23585c] dark:text-[#74b6ba] text-xs font-semibold tracking-wide uppercase mb-3 shadow-xs">
          <ShieldAlert size={14} className="text-[#38858a] dark:text-[#4fa3a8]" />
          Feature A &bull; 100% Free AI Text Detection
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold font-heading text-slate-900 dark:text-slate-100 tracking-tight">
          Lexora AI Checker
        </h1>
        <p className="mt-3 text-base sm:text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
          AI text detection with sentence-level highlights, perplexity scoring, and burstiness analysis.
          Powered by <strong>free, accessible engines</strong> (Gemini AI & Local Stylometrics) with optional paid commercial adapters.
        </p>
      </div>

      {/* Free Providers Banner */}
      <div className="mb-8 p-4 sm:p-5 bg-[#f0f7f8] dark:bg-[#121920] border border-[#bcdfe2] dark:border-[#223340] rounded-2xl flex flex-col sm:flex-row gap-4 items-start shadow-xs transition-colors">
        <div className="p-2.5 bg-[#deeff1] dark:bg-[#172530] rounded-xl text-[#23585c] dark:text-[#74b6ba] shrink-0">
          <ShieldCheck size={22} />
        </div>
        <div className="flex-1 text-xs sm:text-sm text-slate-800 dark:text-slate-200">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-sm sm:text-base font-bold text-[#1b4346] dark:text-[#a0dfe4]">
              Free AI Detection Active
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-[#d2ebed] dark:bg-[#1c3542] text-[#1b4346] dark:text-[#a0dfe4] text-[11px] font-bold">
              Zero Subscription Fees
            </span>
          </div>
          <p className="mt-1 text-slate-600 dark:text-slate-300 leading-relaxed">
            You don't need expensive paid API subscriptions (like GPTZero or Copyleaks). Lexora includes:
          </p>
          <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 bg-white dark:bg-[#161f28] rounded-lg border border-[#cbe6e8] dark:border-[#263a48]">
              <span className="font-bold text-[#1b4346] dark:text-[#a0dfe4]">1. Lexora Neural AI Detector:</span>{' '}
              {isGeminiConfigured ? (
                <span className="text-[#23585c] dark:text-[#74b6ba] font-semibold">
                  Connected & Ready via Google Gemini AI Studio (Free Tier)
                </span>
              ) : (
                <span className="text-slate-500 dark:text-slate-400">Requires free GEMINI_API_KEY in .env</span>
              )}
            </div>
            <div className="p-2.5 bg-white dark:bg-[#161f28] rounded-lg border border-[#cbe6e8] dark:border-[#263a48]">
              <span className="font-bold text-[#1b4346] dark:text-[#a0dfe4]">2. Local Stylometrics Engine:</span>{' '}
              <span className="text-[#23585c] dark:text-[#74b6ba] font-semibold">
                100% Free & Runs Locally (Zero API Keys Needed)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Provider Selector and Presets Bar */}
      <div className="bg-slate-50/80 dark:bg-[#14171f] border border-slate-200/80 dark:border-[#222734] rounded-xl p-4 mb-6 flex flex-wrap items-center justify-between gap-4 transition-colors">
        {/* Provider Toggles */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mr-1">
            Active Detectors:
          </span>

          {/* Free Provider: Gemini */}
          <button
            type="button"
            onClick={() => toggleProvider('gemini')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              selectedProviders.includes('gemini')
                ? 'bg-[#38858a] text-white shadow-xs'
                : 'bg-white dark:bg-[#1a1e27] text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-[#282f3d] hover:bg-slate-100 dark:hover:bg-[#202634]'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isGeminiConfigured ? 'bg-[#4fa3a8]' : 'bg-slate-400'
              }`}
            />
            Gemini Neural (Free)
          </button>

          {/* Free Provider: Local Stylometrics */}
          <button
            type="button"
            onClick={() => toggleProvider('stylometrics')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              selectedProviders.includes('stylometrics')
                ? 'bg-[#2c6e73] text-white shadow-xs'
                : 'bg-white dark:bg-[#1a1e27] text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-[#282f3d] hover:bg-slate-100 dark:hover:bg-[#202634]'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-[#4fa3a8]" />
            Local Stylometrics (Free/Offline)
          </button>

          {/* Commercial Provider: GPTZero */}
          <button
            type="button"
            onClick={() => toggleProvider('gptzero')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              selectedProviders.includes('gptzero')
                ? 'bg-slate-800 dark:bg-[#252c3a] text-white shadow-xs'
                : 'bg-white dark:bg-[#1a1e27] text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-[#282f3d] hover:bg-slate-100 dark:hover:bg-[#202634]'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isGptzeroConfigured ? 'bg-[#4fa3a8]' : 'bg-amber-400'
              }`}
            />
            GPTZero {isGptzeroConfigured ? '(Active)' : '(Paid API)'}
          </button>

          {/* Commercial Provider: Copyleaks */}
          <button
            type="button"
            onClick={() => toggleProvider('copyleaks')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              selectedProviders.includes('copyleaks')
                ? 'bg-slate-800 dark:bg-[#252c3a] text-white shadow-xs'
                : 'bg-white dark:bg-[#1a1e27] text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-[#282f3d] hover:bg-slate-100 dark:hover:bg-[#202634]'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                copyleaksConfig?.configured ? 'bg-[#4fa3a8]' : 'bg-slate-400'
              }`}
            />
            Copyleaks (Paid API)
          </button>
        </div>

        {/* Preset Samples */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-500 dark:text-slate-400 font-medium">Load Research Sample:</span>
          <button
            type="button"
            onClick={() => loadSample('sample-h1')}
            className="px-2.5 py-1 bg-white dark:bg-[#1a1e27] hover:bg-slate-100 dark:hover:bg-[#222835] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#282f3d] rounded-md transition-colors cursor-pointer"
          >
            Human Academic
          </button>
          <button
            type="button"
            onClick={() => loadSample('sample-ai1')}
            className="px-2.5 py-1 bg-white dark:bg-[#1a1e27] hover:bg-slate-100 dark:hover:bg-[#222835] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#282f3d] rounded-md transition-colors cursor-pointer"
          >
            AI Essay
          </button>
          <button
            type="button"
            onClick={() => loadSample('sample-mix1')}
            className="px-2.5 py-1 bg-white dark:bg-[#1a1e27] hover:bg-slate-100 dark:hover:bg-[#222835] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#282f3d] rounded-md transition-colors cursor-pointer"
          >
            Mixed / Edited
          </button>
        </div>
      </div>

      {/* Main Input Area */}
      <div className="bg-white dark:bg-[#14171f] rounded-2xl border border-slate-200/90 dark:border-[#222734] shadow-sm dark:shadow-none overflow-hidden mb-8 transition-colors">
        <div className="p-4 sm:p-6">
          <label htmlFor="ai-checker-input" className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">
            Document for Verification
          </label>
          <textarea
            id="ai-checker-input"
            rows={9}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste your paper, essay, abstract, or draft text here for external AI text detection analysis (recommended 250+ words for statistical reliability)..."
            className="w-full p-4 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 bg-slate-50/70 dark:bg-[#0c0e12] border border-slate-200 dark:border-[#262c3b] rounded-xl focus:bg-white dark:focus:bg-[#10131a] focus:outline-none focus:ring-2 focus:ring-[#38858a]/20 focus:border-[#38858a] dark:focus:border-[#4fa3a8] transition-all font-normal leading-relaxed text-sm sm:text-base resize-y shadow-inner"
          />

          {/* Action and counters footer */}
          <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-[#222734]">
            <div className="flex items-center gap-4 text-xs font-medium text-slate-500 dark:text-slate-400">
              <span>{wordCount} words</span>
              <span>&bull;</span>
              <span>{charCount} characters</span>
              {wordCount > 0 && wordCount < 250 && (
                <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <AlertTriangle size={12} />
                  Short texts (&lt;250 words) have lower statistical confidence
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePaste}
                disabled={isLoading}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 bg-slate-100 dark:bg-[#1a1e27] hover:bg-slate-200 dark:hover:bg-[#222835] border border-slate-200 dark:border-[#282f3d] rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Paste from clipboard"
              >
                <ClipboardPaste size={14} />
                Paste
              </button>

              <button
                type="button"
                onClick={handleClear}
                disabled={isLoading || (!text && !scanResult)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 bg-slate-100 dark:bg-[#1a1e27] hover:bg-slate-200 dark:hover:bg-[#222835] border border-slate-200 dark:border-[#282f3d] rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <RotateCcw size={14} />
                Clear
              </button>

              <button
                type="button"
                onClick={handleCheckText}
                disabled={isLoading || !text.trim()}
                className="px-5 py-2 text-xs font-semibold text-white bg-[#38858a] hover:bg-[#2c6e73] rounded-lg shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Scanning with {selectedProviders.join(', ')}...
                  </>
                ) : (
                  <>
                    <Sparkles size={14} />
                    Check Text
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Error notification */}
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-950/40 border-t border-red-200 dark:border-red-900/60 flex items-start gap-3 text-red-800 dark:text-red-300 text-xs sm:text-sm transition-colors">
            <AlertTriangle size={16} className="shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
            <div className="flex-1">
              <strong>Scan Error:</strong> {error}
            </div>
          </div>
        )}
      </div>

      {/* Missing configuration notice during scan */}
      {missingConfigResults.length > 0 && (
        <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl text-amber-900 dark:text-amber-200 text-xs sm:text-sm transition-colors">
          <p className="font-semibold flex items-center gap-1.5">
            <AlertTriangle size={15} />
            Unconfigured Provider Alert:
          </p>
          <ul className="mt-1 list-disc list-inside space-y-0.5">
            {missingConfigResults.map((r) => (
              <li key={r.providerId}>
                <strong>{r.providerName}:</strong> {r.error} Please add{' '}
                <code>{r.setupInfo?.envKeys?.join(', ')}</code> to your server environment.
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Scan Results Dashboard */}
      {primaryResult && (
        <div className="space-y-6 mb-12">
          {/* Main classification card */}
          <div className="bg-white dark:bg-[#14171f] rounded-2xl border border-slate-200/90 dark:border-[#222734] shadow-sm dark:shadow-none p-6 transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-[#222734]">
              <div className="flex items-center gap-3">
                <span
                  className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${
                    primaryResult.classification === 'human'
                      ? 'bg-[#eef6f7] dark:bg-[#121f24] text-[#23585c] dark:text-[#74b6ba] border border-[#a2d0d3]/80 dark:border-[#224448]'
                      : primaryResult.classification === 'ai'
                      ? 'bg-red-100 dark:bg-red-950/80 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800'
                      : 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                  }`}
                >
                  {primaryResult.classification === 'human' ? (
                    <ShieldCheck size={26} />
                  ) : primaryResult.classification === 'ai' ? (
                    <ShieldAlert size={26} />
                  ) : (
                    <AlertTriangle size={26} />
                  )}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 capitalize">
                      {primaryResult.classification === 'human'
                        ? 'Likely Human-Authored'
                        : primaryResult.classification === 'ai'
                        ? 'High AI Probability'
                        : 'Mixed or Uncertain'}
                    </h2>
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold uppercase bg-slate-100 dark:bg-[#1a1e27] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#282f3d]">
                      Confidence: {primaryResult.confidence}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Provider: <strong>{primaryResult.providerName}</strong> &bull; Model:{' '}
                    <code>{primaryResult.modelVersion}</code> &bull; Timestamp:{' '}
                    {new Date(primaryResult.scanTimestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>

              {/* Score pill */}
              <div className="flex items-center gap-4 bg-slate-50/80 dark:bg-[#0c0e12] px-4 py-2.5 rounded-xl border border-slate-200/80 dark:border-[#222734]">
                <div>
                  <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Reported AI Probability
                  </div>
                  <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
                    {primaryResult.probabilityScore !== null
                      ? `${Math.round(primaryResult.probabilityScore * 100)}%`
                      : 'N/A'}
                  </div>
                </div>
                {typeof primaryResult.burstiness === 'number' && (
                  <div className="border-l border-slate-200 dark:border-[#222734] pl-4">
                    <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Burstiness
                    </div>
                    <div className="text-base font-bold text-slate-800 dark:text-slate-200">
                      {primaryResult.burstiness}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sentence-level analysis view */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Layers size={16} className="text-[#38858a] dark:text-[#4fa3a8]" />
                  Sentence-Level Evaluation & Perplexity
                </h3>
                <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-sm bg-[#b0d8db] dark:bg-[#224448] border border-[#38858a] dark:border-[#4fa3a8]" />
                    Human
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-sm bg-amber-200 dark:bg-amber-800 border border-amber-300 dark:border-amber-600" />
                    Mixed
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-sm bg-red-200 dark:bg-red-800 border border-red-300 dark:border-red-600" />
                    Likely AI
                  </span>
                </div>
              </div>

              <div className="p-4 bg-slate-50/70 dark:bg-[#0c0e12] border border-slate-200/70 dark:border-[#222734] rounded-xl leading-relaxed text-sm sm:text-base text-slate-900 dark:text-slate-100">
                {primaryResult.sentences?.map((s) => {
                  const isSelected = activeSentence?.id === s.id;
                  return (
                    <span
                      key={s.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => setActiveSentence(isSelected ? null : s)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setActiveSentence(isSelected ? null : s);
                        }
                      }}
                      onMouseEnter={() => setActiveSentence(s)}
                      className={`cursor-pointer transition-all px-1.5 py-0.5 rounded mr-1 inline-block my-0.5 outline-hidden ${
                        isSelected ? 'ring-2 ring-slate-900 dark:ring-[#4fa3a8] ring-offset-1 dark:ring-offset-[#14171f] font-medium' : ''
                      } ${
                        s.label === 'ai'
                          ? 'bg-red-100 dark:bg-red-950/80 hover:bg-red-200 dark:hover:bg-red-900/80 text-slate-900 dark:text-red-200 border-b-2 border-red-400 dark:border-red-600'
                          : s.label === 'mixed'
                          ? 'bg-amber-100 dark:bg-amber-950/80 hover:bg-amber-200 dark:hover:bg-amber-900/80 text-slate-900 dark:text-amber-200 border-b-2 border-amber-400 dark:border-amber-600'
                          : 'bg-[#eef6f7] dark:bg-[#122026] hover:bg-[#e1f0f2] dark:hover:bg-[#182c35] text-slate-900 dark:text-[#a0dfe4] border-b-2 border-[#5baeb4]/50'
                      }`}
                      aria-label={`Sentence: ${s.label} (${Math.round((s.score || 0) * 100)}% AI)`}
                    >
                      {s.text}{' '}
                    </span>
                  );
                })}
              </div>

              {/* Active sentence inspector tooltip or hint */}
              {activeSentence ? (
                <div className="mt-3 p-4 bg-[#14171f] dark:bg-[#0a0c10] text-white rounded-xl text-xs space-y-2 shadow-md animate-fade-in border border-[#252c3a]">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#252c3a] pb-2">
                    <span className="font-semibold text-slate-300">Inspecting Selected Sentence</span>
                    <div className="flex items-center gap-3">
                      <span>
                        Classification:{' '}
                        <strong className="uppercase text-[#a0dfe4]">
                          {activeSentence.label}
                        </strong>
                      </span>
                      {activeSentence.score !== undefined && (
                        <span>
                          AI Probability: <strong>{Math.round(activeSentence.score * 100)}%</strong>
                        </span>
                      )}
                      {activeSentence.perplexity !== null && (
                        <span>
                          Perplexity: <strong>{activeSentence.perplexity}</strong>
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-slate-300 italic font-mono text-[11px]">
                    &ldquo;{activeSentence.text}&rdquo;
                  </p>
                  {activeSentence.reason && (
                    <p className="text-[#a0dfe4] text-[11px]">
                      <strong>Linguistic Reason:</strong> {activeSentence.reason}
                    </p>
                  )}
                </div>
              ) : (
                <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 italic text-center py-1">
                  💡 Tip: Click or tap any colored sentence above to inspect its forensic perplexity and token reasoning.
                </div>
              )}

              {/* Action bar for results: Copy Report + Optional Academic Refine */}
              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-[#222734] flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleCopySummary}
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-[#1a1e27] hover:bg-slate-200 dark:hover:bg-[#252c3a] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#282f3d] transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedSummary ? <Check size={13} className="text-[#38858a] dark:text-[#4fa3a8]" /> : <Copy size={13} />}
                  {copiedSummary ? 'Copied Report!' : 'Copy Summary Report'}
                </button>

                {(primaryResult.classification === 'ai' || primaryResult.classification === 'mixed') && onSelectView && (
                  <button
                    type="button"
                    onClick={() => onSelectView('academic')}
                    className="px-4 py-1.5 text-xs font-semibold text-white bg-[#38858a] hover:bg-[#2c6e73] rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Polish in Academic Refiner</span>
                    <ArrowRight size={13} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Multi-provider comparison matrix (when > 1 result) */}
          {scanResult.results?.length > 1 && (
            <div className="bg-white dark:bg-[#14171f] rounded-2xl border border-slate-200/90 dark:border-[#222734] shadow-sm dark:shadow-none p-6 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Layers size={18} className="text-[#38858a] dark:text-[#4fa3a8]" />
                  Multi-Provider Cross-Verification
                </h3>
                {scanResult.agreement && (
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5 ${
                      scanResult.agreement.status === 'agree'
                        ? 'bg-[#eef6f7] dark:bg-[#121f24] text-[#23585c] dark:text-[#74b6ba] border border-[#a2d0d3]/80 dark:border-[#224448]'
                        : scanResult.agreement.status === 'strongly_disagree'
                        ? 'bg-red-100 dark:bg-red-950/80 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800'
                        : 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                    }`}
                  >
                    <CheckCircle2 size={13} />
                    {scanResult.agreement.label}
                  </span>
                )}
              </div>

              {scanResult.agreement?.explanation && (
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 bg-slate-50 dark:bg-[#0c0e12] p-3 rounded-lg border border-slate-200/60 dark:border-[#222734] leading-relaxed">
                  <strong>Agreement Assessment:</strong> {scanResult.agreement.explanation}
                </p>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {scanResult.results.map((r) => (
                  <div
                    key={r.providerId}
                    className="p-4 rounded-xl border border-slate-200 dark:border-[#222734] bg-slate-50/60 dark:bg-[#0c0e12] flex flex-col justify-between transition-colors"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-slate-800 dark:text-slate-200">
                          {r.providerName}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-semibold uppercase ${
                            r.success
                              ? 'bg-[#eef6f7] dark:bg-[#152329] text-[#23585c] dark:text-[#a0dfe4] border border-[#a2d0d3]/70 dark:border-[#224448]'
                              : 'bg-slate-200 dark:bg-[#1a1e27] text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {r.success ? r.data?.classification : 'Unavailable'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {r.success
                          ? `Reported AI Probability: ${
                              r.data?.probabilityScore !== null
                                ? Math.round(r.data.probabilityScore * 100) + '%'
                                : 'N/A'
                            }`
                          : r.error}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mandatory Educational Notice on Limits of AI Text Detection */}
      <div className="bg-slate-100/90 dark:bg-[#14171f] border border-slate-200/90 dark:border-[#222734] rounded-2xl p-6 text-slate-700 dark:text-slate-300 transition-colors">
        <div className="flex items-start gap-3">
          <Info size={20} className="text-[#38858a] dark:text-[#4fa3a8] shrink-0 mt-0.5" />
          <div className="space-y-2 text-xs sm:text-sm leading-relaxed">
            <h4 className="font-bold font-heading text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              Crucial Notice: Limitations of AI Text Detection
            </h4>
            <p>
              AI text detectors are <strong>statistical surface classifiers</strong>, not forensic evidence of authorship.
              They evaluate textual characteristics like token predictability (perplexity) and variation in sentence structure (burstiness).
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-400">
              <li>
                <strong>Not Word-by-Word Percentages:</strong> An AI score of 80% denotes a calculated probabilistic score across the text, <em>never</em> that 80% of the words were written by an AI.
              </li>
              <li>
                <strong>Disproportionate Impact on Non-Native English Authors:</strong> Empirical academic studies (e.g. NAACL 2025; OpenAI 2023) show non-native English writing often exhibits lower perplexity and is frequently misclassified as AI.
              </li>
              <li>
                <strong>Document Length Threshold:</strong> Analyses of texts with fewer than 250 words have significantly higher error rates and should not be used for high-stakes evaluations.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
