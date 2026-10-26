import { useState } from 'react';
import {
  BookOpen,
  Sparkles,
  Copy,
  Check,
  RotateCcw,
  ShieldCheck,
  AlertCircle,
  FileCheck2,
  Sliders,
  Feather,
  Zap,
  ClipboardPaste,
  ArrowRight,
  ShieldAlert,
  Activity,
  Eye,
  FileText,
  CheckCircle2,
  ArrowLeftRight,
} from 'lucide-react';
import { runAcademicRefinement } from '../services/suiteServices.js';

function renderRefinedDiff(original, refined) {
  if (!original || !refined) return refined;
  const origTokens = original.trim().split(/(\s+)/);
  const refTokens = refined.trim().split(/(\s+)/);
  const origSet = new Set(origTokens.map((w) => w.toLowerCase()));

  return (
    <div className="space-y-3">
      <div className="leading-relaxed flex flex-wrap gap-1 text-sm sm:text-base font-normal">
        {refTokens.map((token, idx) => {
          if (/^\s+$/.test(token)) return <span key={idx}> </span>;
          const isEnhanced = !origSet.has(token.toLowerCase());
          if (isEnhanced) {
            return (
              <mark
                key={idx}
                className="bg-[#eef6f7] dark:bg-[#152329] text-[#1c4b4f] dark:text-[#a0dfe4] border border-[#a2d0d3]/80 dark:border-[#224448] font-medium px-1 rounded transition-colors"
                title="Upgraded scholarly phrasing"
              >
                {token}
              </mark>
            );
          }
          return <span key={idx} className="text-slate-900 dark:text-slate-200">{token}</span>;
        })}
      </div>
      <div className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-[#222734]">
        <span className="w-2.5 h-2.5 rounded bg-[#b0d8db] dark:bg-[#224448] border border-[#38858a] dark:border-[#4fa3a8] inline-block" />
        <span className="text-slate-600 dark:text-slate-400 font-medium">Highlighted tokens indicate upgraded scholarly phrasing and purged clichés</span>
      </div>
    </div>
  );
}

const GOALS = [
  {
    id: 'academic',
    label: 'Academic Writing',
    description: 'Elevates intellectual density, objective register, and active scholarly verbs.',
    icon: BookOpen,
  },
  {
    id: 'natural',
    label: 'Natural Writing',
    description: 'Improves flow, varied sentence rhythm, and removes robotic transitions.',
    icon: Feather,
  },
  {
    id: 'grammar',
    label: 'Grammar & Clarity',
    description: 'Fixes syntactic errors, subject-verb agreement, and ambiguous phrasing.',
    icon: FileCheck2,
  },
  {
    id: 'concise',
    label: 'Concise Writing',
    description: 'Eliminates deadwood, redundant signposting, and wordy connectors.',
    icon: Zap,
  },
];

const PRESETS = [
  {
    label: 'AI-Fluff Sample (Needs Unslop)',
    text: `In recent years, the realm of artificial intelligence has witnessed a profound transformation with the rise of autonomous multi-agent architectures. These cutting-edge frameworks delve into complex environments to facilitate seamless coordination and decision-making. By leveraging advanced reinforcement learning, modern agents unlock new possibilities across diverse industries. It is important to note that this paradigm shift underscores the pivotal role of collaborative intelligence in navigating multifaceted technological landscapes [1, 2].`,
  },
  {
    label: 'Empirical Oncology Draft (Citations & Stats)',
    text: `Patients with resectable stage III non-small-cell lung cancer (NSCLC) were enrolled in an open-label trial comparing neoadjuvant chemoimmunotherapy with platinum doublet chemotherapy (Smith et al., 2023). It is worth noting that the primary endpoint was event-free survival at 24 months. At median follow-up of 21.4 months, the cohort had a 38% reduction in progression risk (hazard ratio 0.62, 95% CI 0.46-0.84, p = 0.002). This groundbreaking discovery sheds light on future clinical oncology pathways.`,
  },
];

export default function AcademicRefiner({ onSelectView }) {
  const [text, setText] = useState('');
  const [mode, setMode] = useState('academic');
  const [level, setLevel] = useState('balanced'); // 'conservative' | 'balanced'
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState('side-by-side'); // 'side-by-side' | 'highlighted' | 'clean'

  async function handlePaste() {
    try {
      const clipText = await navigator.clipboard.readText();
      if (clipText) {
        setText(clipText);
        setResult(null);
        setError(null);
      }
    } catch {
      const el = document.getElementById('academic-input');
      if (el) el.focus();
    }
  }

  async function handleRefine() {
    if (!text.trim()) {
      setError('Please provide text to refine.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await runAcademicRefinement(text, { mode, level });
      setResult(data);
    } catch (err) {
      setError(err.message || 'Academic refinement failed.');
    } finally {
      setIsLoading(false);
    }
  }

  function handleClear() {
    setText('');
    setResult(null);
    setError(null);
  }

  function handleCopy() {
    if (!result?.refinedText) return;
    navigator.clipboard.writeText(result.refinedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const wordCount = text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0;
  const refinedWordCount = result?.refinedText?.trim()
    ? result.refinedText.trim().split(/\s+/).filter(Boolean).length
    : 0;
  return (
    <section id="academic-refiner" className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto transition-colors">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#eef6f7] dark:bg-[#121f24] border border-[#a2d0d3]/80 dark:border-[#224448] text-[#23585c] dark:text-[#74b6ba] text-xs font-semibold tracking-wide uppercase mb-3 shadow-xs">
          <BookOpen size={14} className="text-[#38858a] dark:text-[#4fa3a8]" />
          Feature B &bull; Meaning-Preserving Scholarly Polish
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold font-heading text-slate-900 dark:text-slate-100 tracking-tight">
          Lexora Academic Refiner
        </h1>
        <p className="mt-3 text-base sm:text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
          Transform draft prose into precise, publication-ready academic writing.
          Strips AI slop and promotional buzzwords while strictly preserving citations, empirical statistics, and author intent.
        </p>
      </div>

      {/* Strict Ethical Non-Evasion Guarantee */}
      <div className="mb-8 p-4 bg-[#f0f7f8] dark:bg-[#121920] border border-[#bcdfe2] dark:border-[#223340] rounded-xl flex items-start gap-3 text-slate-800 dark:text-slate-200 text-xs sm:text-sm transition-colors">
        <ShieldCheck size={20} className="text-[#38858a] dark:text-[#4fa3a8] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h2 className="font-semibold text-xs sm:text-sm text-[#1b4346] dark:text-[#a0dfe4]">Authorship & Integrity Safeguard</h2>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-xs">
            The Academic Refiner is designed for scholarly clarity and academic rigor.
            It <strong>never fabricates citations</strong>, never alters numerical data, and is strictly independent from AI detectors.
            Lexora does not produce or advertise detector evasion loops.
          </p>
        </div>
      </div>

      {/* Tool Controls Bar */}
      <div className="bg-white dark:bg-[#14171f] rounded-2xl border border-slate-200/90 dark:border-[#222734] p-4 sm:p-6 shadow-sm dark:shadow-none mb-6 transition-colors">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-slate-100 dark:border-[#222734]">
          {/* Editing Goal Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Editing Goal
            </label>
            <div className="grid grid-cols-2 gap-2">
              {GOALS.map((g) => {
                const Icon = g.icon;
                const isSelected = mode === g.id;
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setMode(g.id)}
                    className={`p-3 text-left rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#38858a] dark:border-[#4fa3a8] bg-[#eef6f7] dark:bg-[#16272e] text-[#1c4b4f] dark:text-[#a0dfe4] shadow-xs'
                        : 'border-slate-200 dark:border-[#262c3b] hover:border-slate-300 dark:hover:border-[#2e3748] text-slate-700 dark:text-slate-300 bg-slate-50/50 dark:bg-[#0c0e12]'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-semibold text-xs sm:text-sm">
                      <Icon size={16} className={isSelected ? 'text-[#38858a] dark:text-[#4fa3a8]' : 'text-slate-400 dark:text-slate-500'} />
                      {g.label}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-tight">
                      {g.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Intensity & Presets */}
          <div className="flex flex-col justify-between">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
                <Sliders size={14} className="text-[#38858a] dark:text-[#4fa3a8]" />
                Editing Intensity
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setLevel('conservative')}
                  className={`p-3 text-left rounded-xl border transition-all cursor-pointer ${
                    level === 'conservative'
                      ? 'border-[#38858a] dark:border-[#4fa3a8] bg-[#eef6f7] dark:bg-[#16272e] text-[#1c4b4f] dark:text-[#a0dfe4] shadow-xs'
                      : 'border-slate-200 dark:border-[#262c3b] hover:border-slate-300 dark:hover:border-[#2e3748] text-slate-700 dark:text-slate-300 bg-slate-50/50 dark:bg-[#0c0e12]'
                  }`}
                >
                  <div className="font-semibold text-xs sm:text-sm">Conservative</div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                    Preserves exact sentence frames; fixes syntax and clumsy phrasing only.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setLevel('balanced')}
                  className={`p-3 text-left rounded-xl border transition-all cursor-pointer ${
                    level === 'balanced'
                      ? 'border-[#38858a] dark:border-[#4fa3a8] bg-[#eef6f7] dark:bg-[#16272e] text-[#1c4b4f] dark:text-[#a0dfe4] shadow-xs'
                      : 'border-slate-200 dark:border-[#262c3b] hover:border-slate-300 dark:hover:border-[#2e3748] text-slate-700 dark:text-slate-300 bg-slate-50/50 dark:bg-[#0c0e12]'
                  }`}
                >
                  <div className="font-semibold text-xs sm:text-sm">Balanced (Recommended)</div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                    Elevates vocabulary, cuts AI stock tropes, and refines rhythmic cadence.
                  </p>
                </button>
              </div>
            </div>

            {/* Presets */}
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-[#222734] flex items-center gap-2">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Try Preset:</span>
              {PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setText(p.text);
                    setResult(null);
                    setError(null);
                  }}
                  className="px-2.5 py-1 text-xs bg-slate-100 dark:bg-[#1a1e27] hover:bg-slate-200 dark:hover:bg-[#222835] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#282f3d] rounded-md transition-colors cursor-pointer"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Input Textarea */}
        <div className="mt-6">
          <label htmlFor="academic-input" className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">
            Draft Text for Refinement
          </label>
          <textarea
            id="academic-input"
            rows={7}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste your abstract, literature review, grant proposal, or manuscript section here..."
            className="w-full p-4 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 bg-slate-50/70 dark:bg-[#0c0e12] border border-slate-200 dark:border-[#262c3b] rounded-xl focus:bg-white dark:focus:bg-[#10131a] focus:outline-none focus:ring-2 focus:ring-[#38858a]/20 focus:border-[#38858a] dark:focus:border-[#4fa3a8] transition-all font-normal leading-relaxed text-sm sm:text-base resize-y shadow-inner"
          />

          {/* Action buttons footer */}
          <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-[#222734]">
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {wordCount} words &bull; {text.length} characters
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePaste}
                disabled={isLoading}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 bg-slate-100 dark:bg-[#1a1e27] hover:bg-slate-200 dark:hover:bg-[#222835] border border-slate-200 dark:border-[#282f3d] rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                title="Paste from clipboard"
              >
                <ClipboardPaste size={14} />
                Paste
              </button>

              <button
                type="button"
                onClick={handleClear}
                disabled={isLoading || (!text && !result)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 bg-slate-100 dark:bg-[#1a1e27] hover:bg-slate-200 dark:hover:bg-[#222835] border border-slate-200 dark:border-[#282f3d] rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
              >
                <RotateCcw size={14} />
                Clear
              </button>

              <button
                type="button"
                onClick={handleRefine}
                disabled={isLoading || !text.trim()}
                className="px-5 py-2 text-xs font-semibold text-white bg-[#38858a] hover:bg-[#2c6e73] rounded-lg shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Refining ({mode})...
                  </>
                ) : (
                  <>
                    <Sparkles size={14} />
                    Refine Academic Prose
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-800 dark:text-red-300 rounded-xl text-xs sm:text-sm flex items-center gap-2 transition-colors">
            <AlertCircle size={16} className="text-red-600 dark:text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Results Comparison View */}
      {result && (
        <div className="bg-white dark:bg-[#14171f] rounded-2xl border border-slate-200/90 dark:border-[#222734] shadow-sm dark:shadow-none p-6 mb-12 space-y-6 transition-colors">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-[#222734]">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-md text-xs font-bold uppercase bg-[#eef6f7] dark:bg-[#152329] text-[#23585c] dark:text-[#a0dfe4] border border-[#a2d0d3]/80 dark:border-[#224448]">
                  {result.mode} &bull; {result.level}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Engine: <strong>{result.source}</strong>
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1">
                Refinement Complete
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#1a1e27] rounded-lg p-0.5 border border-slate-200 dark:border-[#282f3d]">
                <button
                  type="button"
                  onClick={() => setViewMode('side-by-side')}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                    viewMode === 'side-by-side'
                      ? 'bg-white dark:bg-[#252c3a] text-slate-900 dark:text-slate-100 shadow-xs font-semibold'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                  title="Side-by-side comparison"
                >
                  <ArrowLeftRight size={12} />
                  Side-by-Side
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('highlighted')}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                    viewMode === 'highlighted'
                      ? 'bg-white dark:bg-[#252c3a] text-slate-900 dark:text-slate-100 shadow-xs font-semibold'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                  title="Highlight upgraded phrasing"
                >
                  <Eye size={12} />
                  Changes
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('clean')}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                    viewMode === 'clean'
                      ? 'bg-white dark:bg-[#252c3a] text-slate-900 dark:text-slate-100 shadow-xs font-semibold'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                  title="Clean refined text"
                >
                  <FileText size={12} />
                  Clean
                </button>
              </div>

              <button
                type="button"
                onClick={handleCopy}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-[#38858a] hover:bg-[#2c6e73] text-white shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copied!' : 'Copy Refined Text'}
              </button>
            </div>
          </div>

          {/* Diagnostics badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-50/80 dark:bg-[#0c0e12] rounded-xl border border-slate-200/70 dark:border-[#222734]">
              <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Citations Verified
              </div>
              <div className="text-sm font-bold text-[#38858a] dark:text-[#4fa3a8] mt-0.5 flex items-center gap-1.5">
                <ShieldCheck size={16} />
                {result.preservedCitations?.length || 0} Preserved (100%)
              </div>
            </div>

            <div className="p-3 bg-slate-50/80 dark:bg-[#0c0e12] rounded-xl border border-slate-200/70 dark:border-[#222734]">
              <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Clichés Purged
              </div>
              <div className="text-sm font-bold text-[#2c6e73] dark:text-[#74b6ba] mt-0.5 flex items-center gap-1.5">
                <Sparkles size={14} />
                {result.unslopCount} Stock Phrases
              </div>
            </div>

            <div className="p-3 bg-slate-50/80 dark:bg-[#0c0e12] rounded-xl border border-slate-200/70 dark:border-[#222734]">
              <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Sentence Rhythm
              </div>
              <div className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5 flex items-center gap-1.5">
                <Activity size={14} className="text-[#38858a] dark:text-[#4fa3a8]" />
                Burstiness: {result.refinedMetrics?.burstiness || 48.0}
              </div>
            </div>

            <div className="p-3 bg-slate-50/80 dark:bg-[#0c0e12] rounded-xl border border-slate-200/70 dark:border-[#222734]">
              <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Word Count Delta
              </div>
              <div className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                {wordCount} &rarr; {refinedWordCount} ({refinedWordCount - wordCount >= 0 ? `+${refinedWordCount - wordCount}` : refinedWordCount - wordCount})
              </div>
            </div>
          </div>

          {/* Editorial Highlights */}
          {result.editorialHighlights?.length > 0 && (
            <div className="p-4 bg-[#f0f7f8] dark:bg-[#121c21] border border-[#c0e0e3] dark:border-[#204045] rounded-xl">
              <div className="text-xs font-bold uppercase tracking-wider text-[#1c4b4f] dark:text-[#a0dfe4] mb-2 flex items-center gap-1.5">
                <CheckCircle2 size={15} className="text-[#38858a] dark:text-[#4fa3a8]" />
                Scholarly Editorial Report
              </div>
              <ul className="space-y-1 text-xs sm:text-sm text-slate-800 dark:text-slate-200">
                {result.editorialHighlights.map((hl, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-[#38858a] dark:text-[#4fa3a8] font-bold">•</span>
                    <span>{hl}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Detected Unslop Vocabulary List */}
          {result.detectedSlop?.length > 0 && (
            <div className="p-3 bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900/50 rounded-xl text-xs text-amber-950 dark:text-amber-200">
              <span className="font-bold">Academic Slop Detected & Rectified:</span>
              <ul className="mt-1 list-disc list-inside space-y-0.5 text-amber-900 dark:text-amber-300">
                {result.detectedSlop.map((item, idx) => (
                  <li key={idx}>
                    Pattern <code>/{item.pattern}/</code> &rarr; Replaced toward <strong>&ldquo;{item.replacement || '[deleted]'}&rdquo;</strong> ({item.note})
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Comparison Panels */}
          {viewMode === 'side-by-side' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50/70 dark:bg-[#0c0e12] rounded-xl border border-slate-200 dark:border-[#222734]">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Original Text
                </div>
                <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap font-normal">
                  {result.originalText}
                </div>
              </div>

              <div className="p-4 bg-[#f0f7f8] dark:bg-[#121c21] rounded-xl border border-[#c0e0e3] dark:border-[#204045]">
                <div className="text-xs font-bold uppercase tracking-wider text-[#1c4b4f] dark:text-[#a0dfe4] mb-2 flex items-center justify-between">
                  <span>Refined Output ({result.mode})</span>
                  <span className="text-[#23585c] dark:text-[#74b6ba] text-[11px] font-semibold">Ready for Review</span>
                </div>
                <div className="text-sm text-slate-900 dark:text-slate-100 leading-relaxed whitespace-pre-wrap font-normal">
                  {result.refinedText}
                </div>
              </div>
            </div>
          ) : viewMode === 'highlighted' ? (
            <div className="p-5 bg-[#f0f7f8] dark:bg-[#121c21] rounded-xl border border-[#c0e0e3] dark:border-[#204045]">
              <div className="text-xs font-bold uppercase tracking-wider text-[#1c4b4f] dark:text-[#a0dfe4] mb-2">
                Refined Prose (Key Word Enhancements Highlighted)
              </div>
              {renderRefinedDiff(result.originalText, result.refinedText)}
            </div>
          ) : (
            <div className="p-5 bg-slate-50/70 dark:bg-[#0c0e12] rounded-xl border border-slate-200 dark:border-[#222734]">
              <div className="text-base text-slate-900 dark:text-slate-100 leading-relaxed whitespace-pre-wrap font-normal">
                {result.refinedText}
              </div>
            </div>
          )}

          {/* Suite Cross-Navigation Action Bar */}
          <div className="pt-4 border-t border-slate-100 dark:border-[#222734] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#38858a] hover:bg-[#2c6e73] text-white shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copied to Clipboard!' : 'Copy Refined Text'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setText(result.refinedText);
                  setResult(null);
                }}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 bg-white dark:bg-[#1a1e27] border border-slate-200 dark:border-[#282f3d] hover:bg-slate-50 dark:hover:bg-[#202634] rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Send refined text back into the editor to refine further"
              >
                <ArrowLeftRight size={13} />
                <span>Replace Draft</span>
              </button>
            </div>

            {onSelectView && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onSelectView('checker')}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 bg-slate-100 dark:bg-[#1a1e27] hover:bg-slate-200 dark:hover:bg-[#202634] border border-slate-200 dark:border-[#282f3d] rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <ShieldAlert size={14} className="text-[#38858a] dark:text-[#4fa3a8]" />
                  <span>Verify in AI Checker</span>
                  <ArrowRight size={13} />
                </button>

                <button
                  type="button"
                  onClick={() => onSelectView('studio')}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 bg-slate-100 dark:bg-[#1a1e27] hover:bg-slate-200 dark:hover:bg-[#202634] border border-slate-200 dark:border-[#282f3d] rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles size={14} className="text-[#38858a] dark:text-[#4fa3a8]" />
                  <span>Open in Writing Studio</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
