import { useState, useRef, useEffect } from 'react';
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
  Upload,
  Download,
  CheckSquare,
  Square,
} from 'lucide-react';
import { runAcademicRefinement } from '../services/suiteServices.js';
import { extractTextFromDocument } from '../utils/documentExtractor.js';
import { extractCitations } from '../utils/textRules.js';

/**
 * Computes exact word-by-word sequence diff using Longest Common Subsequence (LCS)
 */
function computeTokenDiff(original, refined) {
  if (!original || !refined) return [];
  const origWords = original.trim().split(/\s+/).filter(Boolean);
  const refWords = refined.trim().split(/\s+/).filter(Boolean);

  const n = origWords.length;
  const m = refWords.length;

  if (n === 0) return refWords.map((w) => ({ word: w, type: 'added' }));
  if (m === 0) return [];

  // Memory guard for huge documents
  if (n * m > 400000) {
    const origSet = new Set(origWords.map((w) => w.toLowerCase()));
    return refWords.map((w) => ({
      word: w,
      type: origSet.has(w.toLowerCase()) ? 'equal' : 'added',
    }));
  }

  // LCS Matrix
  const dp = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < m; j++) {
      if (origWords[i].toLowerCase() === refWords[j].toLowerCase()) {
        dp[i + 1][j + 1] = dp[i][j] + 1;
      } else {
        dp[i + 1][j + 1] = Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
  }

  // Backtrack diff path
  let i = n;
  let j = m;
  const ops = [];
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && origWords[i - 1].toLowerCase() === refWords[j - 1].toLowerCase()) {
      ops.push({ type: 'equal', word: refWords[j - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      ops.push({ type: 'added', word: refWords[j - 1] });
      j--;
    } else if (i > 0) {
      ops.push({ type: 'removed', word: origWords[i - 1] });
      i--;
    }
  }

  return ops.reverse();
}

function renderRefinedDiff(original, refined) {
  if (!original || !refined) return refined;
  const diffOps = computeTokenDiff(original, refined);

  return (
    <div className="space-y-3">
      <div className="leading-relaxed flex flex-wrap gap-1 text-sm sm:text-base font-normal">
        {diffOps.map((op, idx) => {
          if (op.type === 'removed') {
            return null;
          }
          if (op.type === 'added') {
            return (
              <mark
                key={idx}
                className="bg-[#dff3e8] dark:bg-[#132d20] text-[#0f5b33] dark:text-[#7ce3ab] border border-[#a3e2bc] dark:border-[#1d5234] font-medium px-1.5 py-0.5 rounded text-sm transition-colors"
                title="Upgraded scholarly phrasing / formal substitution"
              >
                {op.word}
              </mark>
            );
          }
          return (
            <span key={idx} className="text-slate-900 dark:text-slate-200">
              {op.word}
            </span>
          );
        })}
      </div>
      <div className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-[#222734]">
        <span className="w-2.5 h-2.5 rounded bg-[#dff3e8] dark:bg-[#132d20] border border-[#38858a] dark:border-[#4fa3a8] inline-block" />
        <span className="text-slate-600 dark:text-slate-400 font-medium">
          Highlighted tokens indicate contractions expanded, transitions added, active phrases made passive, and upgraded synonyms
        </span>
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
    label: 'Conversational Draft (Contractions & Active Voice)',
    text: `We conducted the trials last month, but we didn't find any major defects in the model. It's really important to look at the dataset because it'll help us get good outcomes for the study [1, 2]. The researchers observed that this can't operate without substantial training samples (Johnson et al., 2023). In order to make sure the pipeline runs fast, we need to fix the memory allocation.`,
  },
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
  const [text, setText] = useState(() => {
    try {
      const draft = sessionStorage.getItem('lexora_academic_draft');
      if (draft && typeof draft === 'string' && draft.trim()) {
        sessionStorage.removeItem('lexora_academic_draft');
        return draft;
      }
    } catch {
      // ignore
    }
    return '';
  });
  const [mode, setMode] = useState('academic');
  const [level, setLevel] = useState('balanced'); // 'conservative' | 'balanced'
  const [intensity, setIntensity] = useState(65); // 0 - 100%
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState('side-by-side'); // 'side-by-side' | 'highlighted' | 'clean'

  // Transformation Method Toggles
  const [expandContractions, setExpandContractions] = useState(true);
  const [addTransitions, setAddTransitions] = useState(false);
  const [passiveVoice, setPassiveVoice] = useState(false);
  const [formalSynonyms, setFormalSynonyms] = useState(true);

  const [isFileLoading, setIsFileLoading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    function checkIncomingDraft() {
      try {
        const draft = sessionStorage.getItem('lexora_academic_draft');
        if (draft && typeof draft === 'string' && draft.trim()) {
          sessionStorage.removeItem('lexora_academic_draft');
          setText(draft);
          setResult(null);
          setError(null);
        }
      } catch {
        // ignore
      }
    }
    window.addEventListener('focus', checkIncomingDraft);
    window.addEventListener('hashchange', checkIncomingDraft);
    return () => {
      window.removeEventListener('focus', checkIncomingDraft);
      window.removeEventListener('hashchange', checkIncomingDraft);
    };
  }, []);

  function handleVerifyInChecker() {
    const textToVerify = result?.refinedText || text;
    if (textToVerify && typeof textToVerify === 'string') {
      try {
        sessionStorage.setItem('lexora_checker_text', textToVerify);
      } catch {
        // ignore
      }
    }
    if (onSelectView) {
      onSelectView('checker');
    }
  }

  function handleSendToStudio() {
    if (!result?.refinedText) return;
    try {
      sessionStorage.setItem('lexora_studio_draft', result.refinedText);
    } catch {
      // ignore
    }
    if (onSelectView) {
      onSelectView('studio');
    }
  }

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

  async function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsFileLoading(true);
    setError(null);
    try {
      const content = await extractTextFromDocument(file);
      if (typeof content === 'string') {
        setText(content);
        setResult(null);
        setError(null);
      }
    } catch (err) {
      setError(err.message || 'Failed to extract readable text from document.');
    } finally {
      setIsFileLoading(false);
      e.target.value = '';
    }
  }

  function handleDownload() {
    if (!result?.refinedText) return;
    const blob = new Blob([result.refinedText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lexora-refined-${mode}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
      const data = await runAcademicRefinement(text, {
        mode,
        level,
        intensity,
        expandContractions,
        addTransitions,
        passiveVoice,
        formalSynonyms,
      });
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
  const sentenceCount = text.trim() ? (text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || []).length : 0;
  const detectedCitations = extractCitations(text);

  const refinedWordCount = result?.refinedText?.trim()
    ? result.refinedText.trim().split(/\s+/).filter(Boolean).length
    : 0;
  const refinedSentenceCount = result?.refinedText?.trim()
    ? (result.refinedText.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || []).length
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
          Strips AI slop, expands contractions, adds scholarly transitions, and converts active voice while strictly preserving citations and empirical data.
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

          {/* Intensity Slider & Presets */}
          <div className="flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="humanizer-intensity-slider"
                  className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                >
                  <Sliders size={14} className="text-[#38858a] dark:text-[#4fa3a8]" />
                  Humanization Intensity: <span className="text-[#1c4b4f] dark:text-[#a0dfe4] font-mono text-sm">{intensity}%</span>
                </label>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#eef6f7] dark:bg-[#152329] text-[#23585c] dark:text-[#a0dfe4] border border-[#a2d0d3]/70 dark:border-[#224448]">
                  {intensity < 40 ? 'Subtle' : intensity > 75 ? 'Deep' : 'Balanced'}
                </span>
              </div>

              {/* Intensity Slider Input */}
              <div className="space-y-1">
                <input
                  id="humanizer-intensity-slider"
                  type="range"
                  min="0"
                  max="100"
                  value={intensity}
                  aria-label="Humanization Intensity"
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setIntensity(val);
                    if (val < 40) setLevel('conservative');
                    else setLevel('balanced');
                  }}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#38858a] dark:accent-[#4fa3a8]"
                />
                <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 font-mono px-0.5">
                  <span>0% (Preserve)</span>
                  <span>50% (Standard)</span>
                  <span>100% (Maximum)</span>
                </div>
              </div>

              {/* Preset buttons */}
              <div className="grid grid-cols-3 gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIntensity(35);
                    setLevel('conservative');
                  }}
                  className={`py-1.5 px-2 text-xs font-medium rounded-lg border text-center transition-all cursor-pointer ${
                    intensity === 35
                      ? 'border-[#38858a] dark:border-[#4fa3a8] bg-[#eef6f7] dark:bg-[#16272e] text-[#1c4b4f] dark:text-[#a0dfe4] font-semibold'
                      : 'border-slate-200 dark:border-[#262c3b] hover:border-slate-300 dark:hover:border-[#333b4d] text-slate-600 dark:text-slate-400 bg-slate-50/50 dark:bg-[#0c0e12]'
                  }`}
                >
                  Subtle 35%
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIntensity(65);
                    setLevel('balanced');
                  }}
                  className={`py-1.5 px-2 text-xs font-medium rounded-lg border text-center transition-all cursor-pointer ${
                    intensity === 65
                      ? 'border-[#38858a] dark:border-[#4fa3a8] bg-[#eef6f7] dark:bg-[#16272e] text-[#1c4b4f] dark:text-[#a0dfe4] font-semibold'
                      : 'border-slate-200 dark:border-[#262c3b] hover:border-slate-300 dark:hover:border-[#333b4d] text-slate-600 dark:text-slate-400 bg-slate-50/50 dark:bg-[#0c0e12]'
                  }`}
                >
                  Balanced 65%
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIntensity(90);
                    setLevel('balanced');
                  }}
                  className={`py-1.5 px-2 text-xs font-medium rounded-lg border text-center transition-all cursor-pointer ${
                    intensity === 90
                      ? 'border-[#38858a] dark:border-[#4fa3a8] bg-[#eef6f7] dark:bg-[#16272e] text-[#1c4b4f] dark:text-[#a0dfe4] font-semibold'
                      : 'border-slate-200 dark:border-[#262c3b] hover:border-slate-300 dark:hover:border-[#333b4d] text-slate-600 dark:text-slate-400 bg-slate-50/50 dark:bg-[#0c0e12]'
                  }`}
                >
                  Deep 90%
                </button>
              </div>

              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                {intensity < 40
                  ? 'Subtle Polish: Preserves exact sentence structures, fixes syntax and clumsy phrasing only.'
                  : intensity > 75
                  ? 'Deep Humanize: Maximum scholarly vocabulary elevation, active-to-passive conversions, and discourse flow.'
                  : 'Balanced Scholar: Elevates vocabulary, cuts stock AI clichés, refines rhythmic flow.'}
              </p>
            </div>

            {/* Presets */}
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-[#222734] flex flex-wrap items-center gap-2">
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

        {/* Scholarly Transformation Methods */}
        <div className="pt-5 pb-2">
          <div className="flex items-center justify-between mb-2.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Sparkles size={14} className="text-[#38858a] dark:text-[#4fa3a8]" />
              Scholarly Transformation Methods
            </label>
            <span className="text-[11px] text-slate-400 dark:text-slate-500">
              Select desired transformation methods for formalization
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {/* 1. Formal Contractions */}
            <button
              type="button"
              onClick={() => setExpandContractions((prev) => !prev)}
              className={`p-3 text-left rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 ${
                expandContractions
                  ? 'border-[#38858a] dark:border-[#4fa3a8] bg-[#eef6f7] dark:bg-[#152329] text-[#1c4b4f] dark:text-[#a0dfe4] shadow-xs'
                  : 'border-slate-200 dark:border-[#262c3b] hover:border-slate-300 dark:hover:border-[#2e3748] text-slate-700 dark:text-slate-400 bg-slate-50/40 dark:bg-[#0c0e12]'
              }`}
            >
              {expandContractions ? (
                <CheckSquare size={16} className="text-[#38858a] dark:text-[#4fa3a8] shrink-0 mt-0.5" />
              ) : (
                <Square size={16} className="text-slate-400 dark:text-slate-600 shrink-0 mt-0.5" />
              )}
              <div>
                <div className="font-semibold text-xs sm:text-sm">Expand Contractions</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                  don't &rarr; do not, can't &rarr; cannot
                </div>
              </div>
            </button>

            {/* 2. Academic Transitions */}
            <button
              type="button"
              onClick={() => setAddTransitions((prev) => !prev)}
              className={`p-3 text-left rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 ${
                addTransitions
                  ? 'border-[#38858a] dark:border-[#4fa3a8] bg-[#eef6f7] dark:bg-[#152329] text-[#1c4b4f] dark:text-[#a0dfe4] shadow-xs'
                  : 'border-slate-200 dark:border-[#262c3b] hover:border-slate-300 dark:hover:border-[#2e3748] text-slate-700 dark:text-slate-400 bg-slate-50/40 dark:bg-[#0c0e12]'
              }`}
            >
              {addTransitions ? (
                <CheckSquare size={16} className="text-[#38858a] dark:text-[#4fa3a8] shrink-0 mt-0.5" />
              ) : (
                <Square size={16} className="text-slate-400 dark:text-slate-600 shrink-0 mt-0.5" />
              )}
              <div>
                <div className="font-semibold text-xs sm:text-sm">Academic Transitions</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                  Injects Moreover, Consequently, Therefore
                </div>
              </div>
            </button>

            {/* 3. Objective Passive Voice */}
            <button
              type="button"
              onClick={() => setPassiveVoice((prev) => !prev)}
              className={`p-3 text-left rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 ${
                passiveVoice
                  ? 'border-[#38858a] dark:border-[#4fa3a8] bg-[#eef6f7] dark:bg-[#152329] text-[#1c4b4f] dark:text-[#a0dfe4] shadow-xs'
                  : 'border-slate-200 dark:border-[#262c3b] hover:border-slate-300 dark:hover:border-[#2e3748] text-slate-700 dark:text-slate-400 bg-slate-50/40 dark:bg-[#0c0e12]'
              }`}
            >
              {passiveVoice ? (
                <CheckSquare size={16} className="text-[#38858a] dark:text-[#4fa3a8] shrink-0 mt-0.5" />
              ) : (
                <Square size={16} className="text-slate-400 dark:text-slate-600 shrink-0 mt-0.5" />
              )}
              <div>
                <div className="font-semibold text-xs sm:text-sm">Passive Voice</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                  We conducted &rarr; Was conducted
                </div>
              </div>
            </button>

            {/* 4. Scholarly Synonyms */}
            <button
              type="button"
              onClick={() => setFormalSynonyms((prev) => !prev)}
              className={`p-3 text-left rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 ${
                formalSynonyms
                  ? 'border-[#38858a] dark:border-[#4fa3a8] bg-[#eef6f7] dark:bg-[#152329] text-[#1c4b4f] dark:text-[#a0dfe4] shadow-xs'
                  : 'border-slate-200 dark:border-[#262c3b] hover:border-slate-300 dark:hover:border-[#2e3748] text-slate-700 dark:text-slate-400 bg-slate-50/40 dark:bg-[#0c0e12]'
              }`}
            >
              {formalSynonyms ? (
                <CheckSquare size={16} className="text-[#38858a] dark:text-[#4fa3a8] shrink-0 mt-0.5" />
              ) : (
                <Square size={16} className="text-slate-400 dark:text-slate-600 shrink-0 mt-0.5" />
              )}
              <div>
                <div className="font-semibold text-xs sm:text-sm">Scholarly Synonyms</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                  help &rarr; facilitate, big &rarr; substantial
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Input Textarea */}
        <div className="mt-5">
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="academic-input" className="block text-sm font-semibold text-slate-800 dark:text-slate-200">
              Draft Text for Refinement
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.md,.pdf"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>

          {detectedCitations.length > 0 && (
            <div className="mb-3 p-3 bg-emerald-50/80 dark:bg-[#10241b] border border-emerald-200/90 dark:border-emerald-800/60 rounded-xl flex flex-wrap items-center justify-between gap-2.5 text-xs transition-all">
              <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-300 font-semibold">
                <ShieldCheck size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Citation Shield: {detectedCitations.length} protected</span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {detectedCitations.slice(0, 5).map((cit, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-md font-mono text-[11px] bg-white dark:bg-[#163828] text-emerald-800 dark:text-emerald-200 border border-emerald-300/80 dark:border-emerald-700/60 shadow-2xs"
                    title="Verbatim protected citation token"
                  >
                    {cit}
                  </span>
                ))}
                {detectedCitations.length > 5 && (
                  <span className="text-[11px] text-emerald-700 dark:text-emerald-300 font-medium">
                    +{detectedCitations.length - 5} more
                  </span>
                )}
              </div>
            </div>
          )}

          <textarea
            id="academic-input"
            rows={7}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste your abstract, literature review, grant proposal, or manuscript section here, or click Import Document..."
            className="w-full p-4 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 bg-slate-50/70 dark:bg-[#0c0e12] border border-slate-200 dark:border-[#262c3b] rounded-xl focus:bg-white dark:focus:bg-[#10131a] focus:outline-none focus:ring-2 focus:ring-[#38858a]/20 focus:border-[#38858a] dark:focus:border-[#4fa3a8] transition-all font-normal leading-relaxed text-sm sm:text-base resize-y shadow-inner"
          />

          {/* Action buttons footer */}
          <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-[#222734]">
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {wordCount} words &bull; {sentenceCount} sentences &bull; {text.length} characters
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading || isFileLoading}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 bg-slate-100 dark:bg-[#1a1e27] hover:bg-slate-200 dark:hover:bg-[#222835] border border-slate-200 dark:border-[#282f3d] rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                title="Import from a .pdf, .txt, or .md document"
              >
                {isFileLoading ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-slate-400 border-t-slate-800 dark:border-t-slate-200 rounded-full animate-spin" />
                    Extracting...
                  </>
                ) : (
                  <>
                    <Upload size={14} />
                    Import (PDF, TXT, MD)
                  </>
                )}
              </button>

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
                onClick={handleDownload}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-[#1a1e27] hover:bg-slate-200 dark:hover:bg-[#242b38] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-[#282f3d] shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Download text file (.txt)"
              >
                <Download size={14} />
                Download .txt
              </button>

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

          {/* Diagnostics badges & Stats Dashboard */}
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
                Word & Sentence Stats
              </div>
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                <span>{wordCount}w, {sentenceCount}s</span>
                <span className="text-slate-400 mx-1">&rarr;</span>
                <span className="text-[#38858a] dark:text-[#4fa3a8]">{refinedWordCount}w, {refinedSentenceCount}s</span>
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
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center justify-between">
                  <span>Original Draft</span>
                  <span className="text-slate-400 font-normal">{wordCount} words &bull; {sentenceCount} sentences</span>
                </div>
                <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap font-normal">
                  {result.originalText}
                </div>
              </div>

              <div className="p-4 bg-[#f0f7f8] dark:bg-[#121c21] rounded-xl border border-[#c0e0e3] dark:border-[#204045]">
                <div className="text-xs font-bold uppercase tracking-wider text-[#1c4b4f] dark:text-[#a0dfe4] mb-2 flex items-center justify-between">
                  <span>Refined Output ({result.mode})</span>
                  <span className="text-[#23585c] dark:text-[#74b6ba] text-[11px] font-semibold">
                    {refinedWordCount} words &bull; {refinedSentenceCount} sentences
                  </span>
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
                onClick={handleDownload}
                className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-[#1a1e27] hover:bg-slate-200 dark:hover:bg-[#242b38] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-[#282f3d] shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Download text file (.txt)"
              >
                <Download size={14} />
                Download .txt
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
                  onClick={handleVerifyInChecker}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 bg-slate-100 dark:bg-[#1a1e27] hover:bg-slate-200 dark:hover:bg-[#202634] border border-slate-200 dark:border-[#282f3d] rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <ShieldAlert size={14} className="text-[#38858a] dark:text-[#4fa3a8]" />
                  <span>Verify in AI Checker</span>
                  <ArrowRight size={13} />
                </button>

                <button
                  type="button"
                  onClick={handleSendToStudio}
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
