import { useState, useEffect, useRef } from 'react';
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
  Upload,
  Download,
  Activity,
} from 'lucide-react';
import { runAiDetection, fetchDetectorStatuses } from '../services/suiteServices.js';
import { INITIAL_RESEARCH_DATASET } from '../utils/researchDataset.js';
import { extractTextFromDocument } from '../utils/documentExtractor.js';

export default function AIChecker({ onSelectView }) {
  const [text, setText] = useState(() => {
    try {
      const saved = sessionStorage.getItem('lexora_checker_text');
      if (saved) {
        sessionStorage.removeItem('lexora_checker_text');
        return saved;
      }
    } catch {
      // ignore
    }
    return '';
  });
  const [selectedProviders, setSelectedProviders] = useState(['cloudflare', 'stylometrics']);
  const [providers, setProviders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFileLoading, setIsFileLoading] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [activeResultProviderId, setActiveResultProviderId] = useState(null);
  const [error, setError] = useState(null);
  const [activeSentence, setActiveSentence] = useState(null);
  const [activeSampleId, setActiveSampleId] = useState(null);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const fileInputRef = useRef(null);
  const requestSeqRef = useRef(0);

  // Load available provider statuses on mount and monitor incoming drafts
  useEffect(() => {
    fetchDetectorStatuses().then((list) => {
      setProviders(list);
      if (Array.isArray(list) && list.length > 0) {
        // Auto-select configured free providers
        const activeFree = list.filter((p) => p.configured && p.isFree).map((p) => p.id);
        if (activeFree.length > 0) {
          setSelectedProviders((prev) => {
            const preserved = prev.filter((id) => list.some((p) => p.id === id && p.configured));
            return preserved.length > 0 ? preserved : activeFree;
          });
        }
      }
    });

    function checkIncomingDraft() {
      try {
        const saved = sessionStorage.getItem('lexora_checker_text');
        if (saved) {
          sessionStorage.removeItem('lexora_checker_text');
          setText(saved);
          setScanResult(null);
          setActiveResultProviderId(null);
          setError(null);
          setActiveSentence(null);
        }
      } catch {
        // ignore
      }
    }

    checkIncomingDraft();
    window.addEventListener('focus', checkIncomingDraft);
    window.addEventListener('hashchange', checkIncomingDraft);
    return () => {
      window.removeEventListener('focus', checkIncomingDraft);
      window.removeEventListener('hashchange', checkIncomingDraft);
    };
  }, []);

  const geminiConfig = providers.find((p) => p.id === 'gemini');
  const isGeminiConfigured = geminiConfig?.configured;
  const cloudflareConfig = providers.find((p) => p.id === 'cloudflare');
  const isCloudflareConfigured = cloudflareConfig?.configured;
  const gptzeroConfig = providers.find((p) => p.id === 'gptzero');
  const isGptzeroConfigured = gptzeroConfig?.configured;

  const wordCount = text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0;
  const charCount = text.length;

  async function handleCheckText(overrideProviders, overrideText) {
    const textToScan = typeof overrideText === 'string' ? overrideText : text;
    const providersToUse = Array.isArray(overrideProviders) && overrideProviders.length > 0
      ? overrideProviders
      : selectedProviders;

    if (!textToScan.trim()) {
      setError('Please enter or paste some text to analyze.');
      return;
    }
    const currentWordCount = textToScan.trim().split(/\s+/).filter(Boolean).length;
    if (currentWordCount < 10) {
      setError('Please provide at least 10 words for statistical text analysis.');
      return;
    }

    const currentReq = ++requestSeqRef.current;

    setIsLoading(true);
    setError(null);

    try {
      const data = await runAiDetection(textToScan, providersToUse);
      // Discard stale request if a newer request was triggered in the interim
      if (currentReq !== requestSeqRef.current) {
        return;
      }
      setScanResult({
        ...data,
        scannedText: textToScan,
      });
      setActiveSentence(null);
    } catch (err) {
      if (currentReq === requestSeqRef.current) {
        setError(err.message || 'An error occurred during AI detection.');
      }
    } finally {
      if (currentReq === requestSeqRef.current) {
        setIsLoading(false);
      }
    }
  }

  function handleClear() {
    setText('');
    setActiveSampleId(null);
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

  async function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsFileLoading(true);
    setError(null);
    try {
      const content = await extractTextFromDocument(file);
      if (typeof content === 'string') {
        setText(content);
        setScanResult(null);
        setError(null);
      }
    } catch (err) {
      setError(err.message || 'Failed to extract text from document.');
    } finally {
      setIsFileLoading(false);
      e.target.value = '';
    }
  }

  function handleDownloadReport() {
    if (!primaryResult) return;
    const dist = primaryResult.fourTierDistribution || {};
    const reportDate = new Date(primaryResult.scanTimestamp || 0);
    const formattedTimestamp = primaryResult.scanTimestamp ? reportDate.toLocaleString() : 'N/A';
    const fileTimestamp = primaryResult.scanTimestamp
      ? reportDate.toISOString().slice(0, 19).replace(/[:T]/g, '-')
      : 'scan';

    const lines = [
      '=================================================================',
      '                   LEXORA AI CONTENT DETECTION REPORT            ',
      '=================================================================',
      `Scan Timestamp:     ${formattedTimestamp}`,
      `Detection Provider: ${primaryResult.providerName}`,
      `Model Version:      ${primaryResult.modelVersion}`,
      `Word Count:         ${primaryResult.wordCount || wordCount}`,
      `Character Count:    ${primaryResult.characterCount || charCount}`,
      '',
      '-----------------------------------------------------------------',
      'EXECUTIVE SUMMARY',
      '-----------------------------------------------------------------',
      `Overall Classification:   ${primaryResult.classification.toUpperCase()}`,
      `Reported AI Probability:  ${primaryResult.probabilityScore !== null ? Math.round(primaryResult.probabilityScore * 100) + '%' : 'N/A'}`,
      `Confidence Level:         ${primaryResult.confidence.toUpperCase()}`,
      `Sentence Burstiness:      ${primaryResult.burstiness ?? 'N/A'}`,
      `Perplexity Rating:        ${primaryResult.perplexity ?? 'N/A'}`,
      '',
      '-----------------------------------------------------------------',
      'FOUR-TIER PROVENANCE DISTRIBUTION',
      '-----------------------------------------------------------------',
      `1. Human-written:               ${dist.humanWritten ?? 0}% (${dist.counts?.humanWritten ?? 0} sentences)`,
      `2. Human-written & AI-refined:  ${dist.humanWrittenAiRefined ?? 0}% (${dist.counts?.humanWrittenAiRefined ?? 0} sentences)`,
      `3. AI-generated & AI-refined:   ${dist.aiGeneratedAiRefined ?? 0}% (${dist.counts?.aiGeneratedAiRefined ?? 0} sentences)`,
      `4. AI-generated:                ${dist.aiGenerated ?? 0}% (${dist.counts?.aiGenerated ?? 0} sentences)`,
      '',
      '-----------------------------------------------------------------',
      'SENTENCE-BY-SENTENCE FORENSIC EVALUATION',
      '-----------------------------------------------------------------',
    ];

    (primaryResult.sentences || []).forEach((s, idx) => {
      lines.push(`[Sentence ${idx + 1}] Tier: ${s.tierLabel || s.label} | AI Score: ${Math.round((s.score || 0) * 100)}% | Perplexity: ${s.perplexity ?? 'N/A'}`);
      lines.push(`"${s.text}"`);
      if (s.reason) {
        lines.push(`Linguistic Note: ${s.reason}`);
      }
      lines.push('');
    });

    lines.push('=================================================================');
    lines.push('Lexora text detection reports evaluate statistical perplexity and');
    lines.push('burstiness cadence. They should be considered analytical guidance.');
    lines.push('=================================================================');

    const content = lines.join('\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lexora-ai-detection-report-${fileTimestamp}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
      setActiveSampleId(sampleId);
      setScanResult(null);
      setError(null);
    }
  }

  const ALL_DETECTOR_IDS = isGptzeroConfigured
    ? ['cloudflare', 'stylometrics', 'gemini', 'gptzero']
    : ['cloudflare', 'stylometrics', 'gemini'];
  const DEFAULT_DETECTOR_IDS = ['cloudflare', 'stylometrics'];

  function toggleProvider(id) {
    if (selectedProviders.includes(id)) {
      if (selectedProviders.length > 1) {
        setSelectedProviders(selectedProviders.filter((p) => p !== id));
      }
    } else {
      setSelectedProviders([...selectedProviders, id]);
    }
  }

  function handleSelectAll() {
    if (selectedProviders.length === ALL_DETECTOR_IDS.length) {
      setSelectedProviders(DEFAULT_DETECTOR_IDS);
    } else {
      setSelectedProviders(ALL_DETECTOR_IDS);
    }
  }

  function handleSelectDefault() {
    setSelectedProviders(DEFAULT_DETECTOR_IDS);
  }

  function handleSelectAllAndRun() {
    setSelectedProviders(ALL_DETECTOR_IDS);
    if (text.trim() && wordCount >= 10) {
      handleCheckText(ALL_DETECTOR_IDS, text);
    } else if (!text.trim()) {
      const sample = INITIAL_RESEARCH_DATASET.find((item) => item.id === 'sample-ai1') || INITIAL_RESEARCH_DATASET[0];
      setText(sample.text);
      setActiveSampleId(sample.id);
      setScanResult(null);
      setError(null);
      handleCheckText(ALL_DETECTOR_IDS, sample.text);
    } else {
      setError('Please provide at least 10 words for statistical text analysis.');
    }
  }

  const DETECTOR_ITEMS = [
    {
      id: 'cloudflare',
      name: 'Cloudflare Llama 70B',
      tier: 'Major • Edge Free',
      isMajor: true,
      isConfigured: isCloudflareConfigured,
      tooltip: 'Major online neural classifier: Meta Llama 3.1 70B at edge (10,000 neurons/day included)',
    },
    {
      id: 'stylometrics',
      name: 'Local Stylometrics',
      tier: 'Consensus • Offline',
      isMajor: false,
      isConfigured: true,
      tooltip: 'Instant 1ms offline statistical engine: Perplexity cadence & Zipf burstiness',
    },
    {
      id: 'gemini',
      name: 'Gemini Neural',
      tier: 'Secondary • Free Tier',
      isMajor: false,
      isConfigured: isGeminiConfigured,
      tooltip: 'Google Gemini 3.8 / 3.5 Flash neural forensic stylometrics (Free tier)',
    },
    {
      id: 'gptzero',
      name: 'GPTZero',
      tier: 'Benchmark • Commercial',
      isMajor: false,
      isConfigured: isGptzeroConfigured,
      tooltip: isGptzeroConfigured
        ? 'Official GPTZero API: Industry reference perplexity and burstiness detection'
        : 'Official GPTZero API benchmark: Add GPTZERO_API_KEY in .env to enable',
    },
  ];

  // Get selected or primary successful result
  const activeResultObj = scanResult?.results?.find(
    (r) => r.success && r.data && (activeResultProviderId ? r.providerId === activeResultProviderId : true)
  );
  const primaryResult = activeResultObj?.data || scanResult?.results?.find((r) => r.success && r.data)?.data;
  const missingConfigResults = scanResult?.results?.filter((r) => r.notConfigured) || [];
  const isResultOutdated = Boolean(
    scanResult &&
      scanResult.scannedText !== undefined &&
      scanResult.scannedText.trim() !== text.trim()
  );

  return (
    <section id="ai-checker" className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto transition-colors">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#eef6f7] dark:bg-[#121f24] border border-[#a2d0d3]/80 dark:border-[#224448] text-[#23585c] dark:text-[#74b6ba] text-xs font-semibold tracking-wide uppercase mb-3 shadow-xs">
          <ShieldAlert size={14} className="text-[#38858a] dark:text-[#4fa3a8]" />
          Feature A &bull; 100% Free Multi-Engine AI Text Detection
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold font-heading text-slate-900 dark:text-slate-100 tracking-tight">
          Lexora AI Checker
        </h1>
        <p className="mt-3 text-base sm:text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
          AI text detection with sentence-level highlights, perplexity scoring, and burstiness analysis.
          Powered by <strong>Cloudflare Meta Llama 3.1 70B</strong> (Major Neural Classifier), <strong>Local Stylometrics</strong> (1ms Consensus Engine), and <strong>Google Gemini</strong>. 100% free with zero paywalls.
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
              Zero-Cost Multi-Engine AI Detection Active
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-[#d2ebed] dark:bg-[#1c3542] text-[#1b4346] dark:text-[#a0dfe4] text-[11px] font-bold">
              100% Free Tiers
            </span>
          </div>
          <p className="mt-1 text-slate-600 dark:text-slate-300 leading-relaxed">
            Lexora provides enterprise-grade multi-engine detection without subscription paywalls:
          </p>
          <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <div className="p-2.5 bg-white dark:bg-[#161f28] rounded-lg border border-[#cbe6e8] dark:border-[#263a48]">
              <span className="font-bold text-[#1b4346] dark:text-[#a0dfe4]">1. Cloudflare Llama 70B (Major):</span>{' '}
              {isCloudflareConfigured ? (
                <span className="text-[#23585c] dark:text-[#74b6ba] font-semibold">
                  Active (Meta Llama 3.1 70B at edge)
                </span>
              ) : (
                <span className="text-slate-500 dark:text-slate-400">Configured via Cloudflare Token</span>
              )}
            </div>
            <div className="p-2.5 bg-white dark:bg-[#161f28] rounded-lg border border-[#cbe6e8] dark:border-[#263a48]">
              <span className="font-bold text-[#1b4346] dark:text-[#a0dfe4]">2. Local Stylometrics (1ms):</span>{' '}
              <span className="text-[#23585c] dark:text-[#74b6ba] font-semibold">
                100% Free &amp; Offline (Air-Gapped)
              </span>
            </div>
            <div className="p-2.5 bg-white dark:bg-[#161f28] rounded-lg border border-[#cbe6e8] dark:border-[#263a48]">
              <span className="font-bold text-[#1b4346] dark:text-[#a0dfe4]">3. Google Gemini Neural:</span>{' '}
              {isGeminiConfigured ? (
                <span className="text-[#23585c] dark:text-[#74b6ba] font-semibold">
                  Connected &amp; Ready (Free Tier)
                </span>
              ) : (
                <span className="text-slate-500 dark:text-slate-400">Requires free GEMINI_API_KEY</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Provider Selector and Presets Bar */}
      <div className="bg-slate-50/80 dark:bg-[#14171f] border border-slate-200/80 dark:border-[#222734] rounded-2xl p-4 sm:p-5 mb-6 space-y-3.5 transition-colors">
        {/* Top Header of the Bar: Label + Quick Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 tracking-wide uppercase">
              Active Detectors:
            </span>
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              ({selectedProviders.length} of {ALL_DETECTOR_IDS.length} active)
            </span>
          </div>

          {/* Quick Select Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleSelectAll}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer border ${
                selectedProviders.length === ALL_DETECTOR_IDS.length
                  ? 'bg-[#2c6e73]/10 dark:bg-[#4fa3a8]/20 text-[#1b4346] dark:text-[#a0dfe4] border-[#2c6e73]/40 dark:border-[#4fa3a8]/40'
                  : 'bg-white dark:bg-[#1c202a] text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border-slate-200 dark:border-[#262c3b] hover:border-slate-300 dark:hover:border-[#384156]'
              }`}
            >
              {selectedProviders.length === ALL_DETECTOR_IDS.length ? 'Deselect Extra' : 'Select All (3)'}
            </button>
            <button
              type="button"
              onClick={handleSelectDefault}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer border ${
                selectedProviders.length === DEFAULT_DETECTOR_IDS.length &&
                DEFAULT_DETECTOR_IDS.every((id) => selectedProviders.includes(id))
                  ? 'bg-[#2c6e73]/10 dark:bg-[#4fa3a8]/20 text-[#1b4346] dark:text-[#a0dfe4] border-[#2c6e73]/40 dark:border-[#4fa3a8]/40'
                  : 'bg-white dark:bg-[#1c202a] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border-slate-200 dark:border-[#262c3b]'
              }`}
              title="Activate the recommended Major Neural (Cloudflare) + Local Stylometrics pair"
            >
              Recommended (2)
            </button>
            <button
              type="button"
              onClick={handleSelectAllAndRun}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-white bg-[#38858a] hover:bg-[#2c6e73] rounded-lg shadow-xs transition-all cursor-pointer disabled:opacity-50"
              title="Select all 3 detectors and run detection immediately"
            >
              <Sparkles size={12} />
              Select All &amp; Run (3)
            </button>
          </div>
        </div>

        {/* Detector Chips Grid */}
        <div className="flex flex-wrap items-center gap-2">
          {DETECTOR_ITEMS.map((item) => {
            const isSelected = selectedProviders.includes(item.id);
            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => toggleProvider(item.id)}
                className={`group inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-150 cursor-pointer select-none border ${
                  isSelected
                    ? 'bg-[#2c6e73]/10 dark:bg-[#4fa3a8]/15 text-[#1b4346] dark:text-[#a0dfe4] border-[#2c6e73]/40 dark:border-[#4fa3a8]/40 ring-1 ring-[#4fa3a8]/25 shadow-xs font-semibold'
                    : 'bg-white dark:bg-[#181d28] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-[#262c3b] hover:border-slate-300 dark:hover:border-[#384156] hover:bg-slate-50 dark:hover:bg-[#1e2534] hover:text-slate-800 dark:hover:text-slate-200'
                }`}
                title={item.tooltip}
              >
                {/* Checkbox square indicator */}
                <span
                  className={`w-3.5 h-3.5 rounded-md flex items-center justify-center transition-colors shrink-0 ${
                    isSelected
                      ? 'bg-[#2c6e73] dark:bg-[#4fa3a8] text-white'
                      : 'border border-slate-300 dark:border-slate-600 bg-transparent'
                  }`}
                >
                  {isSelected && <Check size={10} className="stroke-3" />}
                </span>

                {/* Status Beacon Dot */}
                <span
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    item.isConfigured
                      ? isSelected
                        ? 'bg-emerald-500 animate-pulse'
                        : 'bg-emerald-500'
                      : 'bg-slate-400 dark:bg-slate-500'
                  }`}
                />

                {/* Name */}
                <span className="tracking-tight">{item.name}</span>

                {/* Major Indicator if applicable */}
                {item.isMajor && (
                  <span className="text-[10px] px-1 py-0.2 rounded font-bold bg-[#38858a]/20 text-[#1b4346] dark:text-[#a0dfe4] border border-[#38858a]/40 shrink-0">
                    Major
                  </span>
                )}

                {/* Tier Badge */}
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-normal transition-colors shrink-0 ${
                    isSelected
                      ? 'bg-[#2c6e73]/15 dark:bg-[#4fa3a8]/20 text-[#1b4346] dark:text-[#a0dfe4]'
                      : 'bg-slate-100 dark:bg-[#202736] text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {item.tier}
                </span>
              </button>
            );
          })}
        </div>

        {/* Multi-Example Research Presets */}
        <div className="pt-3 border-t border-slate-200/70 dark:border-[#222734] flex flex-col gap-2.5 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-slate-500 dark:text-slate-400 font-semibold mr-1">Load Research Sample:</span>

            {/* Human Samples */}
            <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-900/60 ml-0.5">
              Human
            </span>
            <button
              type="button"
              onClick={() => loadSample('sample-h1')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer border ${
                activeSampleId === 'sample-h1'
                  ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700 font-semibold'
                  : 'bg-white dark:bg-[#1a1e27] hover:bg-slate-100 dark:hover:bg-[#222835] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-[#282f3d]'
              }`}
              title="Biophysics peer-reviewed excerpt (1998, pre-LLM)"
            >
              Academic (CRISPR)
            </button>
            <button
              type="button"
              onClick={() => loadSample('sample-h3')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer border ${
                activeSampleId === 'sample-h3'
                  ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700 font-semibold'
                  : 'bg-white dark:bg-[#1a1e27] hover:bg-slate-100 dark:hover:bg-[#222835] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-[#282f3d]'
              }`}
              title="Byzantine systems consensus paper (2016, pre-LLM)"
            >
              Systems (PBFT)
            </button>

            {/* AI Samples */}
            <span className="text-[10px] uppercase font-bold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-1.5 py-0.5 rounded border border-rose-200 dark:border-rose-900/60 ml-1.5">
              AI
            </span>
            <button
              type="button"
              onClick={() => loadSample('sample-ai1')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer border ${
                activeSampleId === 'sample-ai1'
                  ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-900 dark:text-rose-200 border-rose-300 dark:border-rose-700 font-semibold'
                  : 'bg-white dark:bg-[#1a1e27] hover:bg-slate-100 dark:hover:bg-[#222835] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-[#282f3d]'
              }`}
              title="Autonomous multi-agent essay (Gemini)"
            >
              AI Multi-Agent
            </button>
            <button
              type="button"
              onClick={() => loadSample('sample-ai2')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer border ${
                activeSampleId === 'sample-ai2'
                  ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-900 dark:text-rose-200 border-rose-300 dark:border-rose-700 font-semibold'
                  : 'bg-white dark:bg-[#1a1e27] hover:bg-slate-100 dark:hover:bg-[#222835] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-[#282f3d]'
              }`}
              title="Sustainable urban logistics essay (GPT-4o)"
            >
              AI Logistics (GPT-4o)
            </button>
            <button
              type="button"
              onClick={() => loadSample('sample-ai3')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer border ${
                activeSampleId === 'sample-ai3'
                  ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-900 dark:text-rose-200 border-rose-300 dark:border-rose-700 font-semibold'
                  : 'bg-white dark:bg-[#1a1e27] hover:bg-slate-100 dark:hover:bg-[#222835] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-[#282f3d]'
              }`}
              title="Quantum cryptography memo (Claude 3.5 Sonnet)"
            >
              AI Cryptography (Sonnet)
            </button>

            {/* Mixed Samples */}
            <span className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-900/60 ml-1.5">
              Mixed
            </span>
            <button
              type="button"
              onClick={() => loadSample('sample-mix1')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer border ${
                activeSampleId === 'sample-mix1'
                  ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-700 font-semibold'
                  : 'bg-white dark:bg-[#1a1e27] hover:bg-slate-100 dark:hover:bg-[#222835] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-[#282f3d]'
              }`}
              title="Oncology clinical trial notes (Human draft + Claude 3.5 pass)"
            >
              Mixed Oncology
            </button>
            <button
              type="button"
              onClick={() => loadSample('sample-mix2')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer border ${
                activeSampleId === 'sample-mix2'
                  ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-700 font-semibold'
                  : 'bg-white dark:bg-[#1a1e27] hover:bg-slate-100 dark:hover:bg-[#222835] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-[#282f3d]'
              }`}
              title="Remote work review (AI draft + human survey citations)"
            >
              Mixed Remote Work
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1">
            <span>
              {activeSampleId ? (
                <>
                  Loaded:{' '}
                  <strong className="text-slate-700 dark:text-slate-200">
                    {INITIAL_RESEARCH_DATASET.find((item) => item.id === activeSampleId)?.title}
                  </strong>{' '}
                  &bull; Ground Truth:{' '}
                  <span className="capitalize font-semibold text-[#1b4346] dark:text-[#a0dfe4]">
                    {INITIAL_RESEARCH_DATASET.find((item) => item.id === activeSampleId)?.groundTruth}
                  </span>
                </>
              ) : (
                'Select any research sample above to test and compare detection accuracy across models.'
              )}
            </span>
            <span className="hidden sm:inline">
              Cloudflare Llama 70B (Major) + Local Stylometrics provide instant dual-layer consensus.
            </span>
          </div>
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
            onChange={(e) => {
              setText(e.target.value);
              setActiveSampleId(null);
            }}
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

            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.md,.pdf"
                className="hidden"
                onChange={handleFileUpload}
              />

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
                disabled={!text.trim()}
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

      {/* Outdated Result Warning Banner */}
      {isResultOutdated && (
        <div
          data-testid="outdated-scan-banner"
          className="mb-6 p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-900 dark:text-amber-200 text-xs sm:text-sm shadow-xs transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <AlertTriangle size={18} className="text-amber-600 dark:text-amber-400 shrink-0" />
            <div>
              <span className="font-bold">Text Modified Since Last Scan:</span> The analysis below reflects an earlier draft. Re-scan to analyze your current text.
            </div>
          </div>
          <button
            type="button"
            onClick={handleCheckText}
            disabled={isLoading}
            className="px-3.5 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-xs transition-colors shrink-0 cursor-pointer disabled:opacity-50"
          >
            Re-analyze Current Text
          </button>
        </div>
      )}

      {/* Scan Results Dashboard */}
      {primaryResult && (
        <div className={`space-y-6 mb-12 ${isResultOutdated ? 'opacity-75 transition-opacity' : ''}`}>
          {/* Provider selector tabs when multiple providers succeed */}
          {scanResult.results?.filter((r) => r.success && r.data).length > 1 && (
            <div className="flex flex-wrap items-center gap-2 p-2 bg-slate-50/80 dark:bg-[#14171f] rounded-2xl border border-slate-200/80 dark:border-[#222734]">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide ml-2 mr-1">
                Active Provider Report:
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                {scanResult.results
                  .filter((r) => r.success && r.data)
                  .map((r) => {
                    const isSelected = primaryResult?.providerId === r.providerId;
                    const score = r.data?.probabilityScore !== null ? `${Math.round(r.data.probabilityScore * 100)}%` : 'N/A';
                    return (
                      <button
                        key={r.providerId}
                        type="button"
                        onClick={() => {
                          setActiveResultProviderId(r.providerId);
                          setActiveSentence(null);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border cursor-pointer ${
                          isSelected
                            ? 'bg-[#2c6e73] text-white border-[#2c6e73] shadow-sm'
                            : 'bg-white dark:bg-[#1b202c] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-[#2a3142] hover:border-slate-300'
                        }`}
                      >
                        <span>{r.providerName}</span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                            isSelected
                              ? 'bg-white/20 text-white'
                              : r.data?.classification === 'ai'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300'
                              : r.data?.classification === 'human'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                          }`}
                        >
                          {score} {r.data?.classification}
                        </span>
                      </button>
                    );
                  })}
              </div>
            </div>
          )}

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
                  <div className="flex items-center gap-2 flex-wrap">
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
                    {isResultOutdated && (
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                        Outdated Result
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Provider: <strong>{primaryResult.providerName}</strong> &bull; Model:{' '}
                    <code>{primaryResult.modelVersion}</code>
                    {primaryResult.scanTimestamp ? ` • Timestamp: ${new Date(primaryResult.scanTimestamp).toLocaleTimeString()}` : ''}
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

            {/* Four-Tier Provenance Distribution Section */}
            {primaryResult.fourTierDistribution && (
              <div className="mt-6 pt-6 border-t border-slate-100 dark:border-[#222734]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Activity size={16} className="text-[#38858a] dark:text-[#4fa3a8]" />
                      Four-Tier Provenance Classification
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Granular categorization distinguishing pure human authorship, human-with-AI polish, and autonomous generation.
                    </p>
                  </div>
                </div>

                {/* Visual Distribution Segmented Bar */}
                <div className="w-full h-3 rounded-full overflow-hidden bg-slate-100 dark:bg-[#1a1e27] flex mb-4 border border-slate-200 dark:border-[#222734]">
                  {primaryResult.fourTierDistribution.humanWritten > 0 && (
                    <div
                      style={{ width: `${primaryResult.fourTierDistribution.humanWritten}%` }}
                      className="bg-emerald-500 transition-all duration-500"
                      title={`Human-written: ${primaryResult.fourTierDistribution.humanWritten}%`}
                    />
                  )}
                  {primaryResult.fourTierDistribution.humanWrittenAiRefined > 0 && (
                    <div
                      style={{ width: `${primaryResult.fourTierDistribution.humanWrittenAiRefined}%` }}
                      className="bg-sky-500 transition-all duration-500"
                      title={`Human-written & AI-refined: ${primaryResult.fourTierDistribution.humanWrittenAiRefined}%`}
                    />
                  )}
                  {primaryResult.fourTierDistribution.aiGeneratedAiRefined > 0 && (
                    <div
                      style={{ width: `${primaryResult.fourTierDistribution.aiGeneratedAiRefined}%` }}
                      className="bg-amber-500 transition-all duration-500"
                      title={`AI-generated & AI-refined: ${primaryResult.fourTierDistribution.aiGeneratedAiRefined}%`}
                    />
                  )}
                  {primaryResult.fourTierDistribution.aiGenerated > 0 && (
                    <div
                      style={{ width: `${primaryResult.fourTierDistribution.aiGenerated}%` }}
                      className="bg-rose-500 transition-all duration-500"
                      title={`AI-generated: ${primaryResult.fourTierDistribution.aiGenerated}%`}
                    />
                  )}
                </div>

                {/* 4 Cards Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-900/40">
                    <div className="flex items-center gap-1.5 font-semibold text-emerald-800 dark:text-emerald-300">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      Human-written
                    </div>
                    <div className="text-xl font-bold text-emerald-900 dark:text-emerald-100 mt-1">
                      {primaryResult.fourTierDistribution.humanWritten}%
                    </div>
                    <div className="text-[11px] text-emerald-700/80 dark:text-emerald-400 mt-0.5">
                      {primaryResult.fourTierDistribution.counts?.humanWritten || 0} sentences
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-sky-50/60 dark:bg-sky-950/20 border border-sky-200/70 dark:border-sky-900/40">
                    <div className="flex items-center gap-1.5 font-semibold text-sky-800 dark:text-sky-300">
                      <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                      Human & AI-Refined
                    </div>
                    <div className="text-xl font-bold text-sky-900 dark:text-sky-100 mt-1">
                      {primaryResult.fourTierDistribution.humanWrittenAiRefined}%
                    </div>
                    <div className="text-[11px] text-sky-700/80 dark:text-sky-400 mt-0.5">
                      {primaryResult.fourTierDistribution.counts?.humanWrittenAiRefined || 0} sentences
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/40">
                    <div className="flex items-center gap-1.5 font-semibold text-amber-800 dark:text-amber-300">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                      AI & AI-Refined
                    </div>
                    <div className="text-xl font-bold text-amber-900 dark:text-amber-100 mt-1">
                      {primaryResult.fourTierDistribution.aiGeneratedAiRefined}%
                    </div>
                    <div className="text-[11px] text-amber-700/80 dark:text-amber-400 mt-0.5">
                      {primaryResult.fourTierDistribution.counts?.aiGeneratedAiRefined || 0} sentences
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/70 dark:border-rose-900/40">
                    <div className="flex items-center gap-1.5 font-semibold text-rose-800 dark:text-rose-300">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                      AI-generated
                    </div>
                    <div className="text-xl font-bold text-rose-900 dark:text-rose-100 mt-1">
                      {primaryResult.fourTierDistribution.aiGenerated}%
                    </div>
                    <div className="text-[11px] text-rose-700/80 dark:text-rose-400 mt-0.5">
                      {primaryResult.fourTierDistribution.counts?.aiGenerated || 0} sentences
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Sentence-level analysis view */}
            <div className="mt-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Layers size={16} className="text-[#38858a] dark:text-[#4fa3a8]" />
                  Sentence-Level Evaluation & Perplexity
                </h3>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-sm bg-emerald-200 dark:bg-emerald-900/80 border border-emerald-400" />
                    Human
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-sm bg-sky-200 dark:bg-sky-900/80 border border-sky-400" />
                    Human & AI-Refined
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-sm bg-amber-200 dark:bg-amber-800 border border-amber-400" />
                    AI & AI-Refined
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-sm bg-rose-200 dark:bg-rose-900/80 border border-rose-400" />
                    AI-generated
                  </span>
                </div>
              </div>

              <div className="p-4 bg-slate-50/70 dark:bg-[#0c0e12] border border-slate-200/70 dark:border-[#222734] rounded-xl leading-relaxed text-sm sm:text-base text-slate-900 dark:text-slate-100">
                {primaryResult.sentences?.map((s) => {
                  const isSelected = activeSentence?.id === s.id;
                  const tier = s.tier || (s.label === 'ai' ? 'ai-generated' : s.label === 'mixed' ? 'ai-refined-ai' : 'human-written');
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
                        tier === 'ai-generated'
                          ? 'bg-rose-100 dark:bg-rose-950/80 hover:bg-rose-200 dark:hover:bg-rose-900/80 text-slate-900 dark:text-rose-200 border-b-2 border-rose-400 dark:border-rose-600'
                          : tier === 'ai-refined-ai'
                          ? 'bg-amber-100 dark:bg-amber-950/80 hover:bg-amber-200 dark:hover:bg-amber-900/80 text-slate-900 dark:text-amber-200 border-b-2 border-amber-400 dark:border-amber-600'
                          : tier === 'ai-refined-human'
                          ? 'bg-sky-100 dark:bg-sky-950/80 hover:bg-sky-200 dark:hover:bg-sky-900/80 text-slate-900 dark:text-sky-200 border-b-2 border-sky-400 dark:border-sky-600'
                          : 'bg-emerald-50 dark:bg-[#12241d] hover:bg-emerald-100 dark:hover:bg-[#163027] text-slate-900 dark:text-emerald-200 border-b-2 border-emerald-400/60'
                      }`}
                      aria-label={`Sentence: ${s.tierLabel || s.label} (${Math.round((s.score || 0) * 100)}% AI)`}
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
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="flex items-center gap-1.5">
                        Tier:{' '}
                        <strong className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#1a2333] text-[#7dd3fc] border border-[#2b3952]">
                          {activeSentence.tierLabel || activeSentence.label}
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
                  💡 Tip: Click or tap any colored sentence above to inspect its forensic perplexity, tier classification, and token reasoning.
                </div>
              )}

              {/* Action bar for results: Copy Report + Download Report + Optional Academic Refine */}
              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-[#222734] flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopySummary}
                    className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-[#1a1e27] hover:bg-slate-200 dark:hover:bg-[#252c3a] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#282f3d] transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedSummary ? <Check size={13} className="text-[#38858a] dark:text-[#4fa3a8]" /> : <Copy size={13} />}
                    {copiedSummary ? 'Copied Report!' : 'Copy Summary Report'}
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadReport}
                    className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-[#1a1e27] hover:bg-slate-200 dark:hover:bg-[#252c3a] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#282f3d] transition-colors flex items-center gap-1.5 cursor-pointer"
                    title="Download complete sentence-level forensic evaluation report as .txt"
                  >
                    <Download size={13} />
                    Download Analysis Report (.txt)
                  </button>
                </div>

                {(primaryResult.classification === 'ai' || primaryResult.classification === 'mixed') && onSelectView && (
                  <button
                    type="button"
                    onClick={() => {
                      if (text) {
                        try {
                          sessionStorage.setItem('lexora_academic_draft', text);
                        } catch {
                          // ignore
                        }
                      }
                      onSelectView('academic');
                    }}
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
                    {r.success && r.data && (
                      <div className="mt-3 pt-2 border-t border-slate-200/60 dark:border-[#222734] flex justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveResultProviderId(r.providerId);
                            setActiveSentence(null);
                            const el = document.getElementById('ai-checker');
                            if (el) el.scrollIntoView({ behavior: 'smooth' });
                          }}
                          className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                            primaryResult?.providerId === r.providerId
                              ? 'bg-[#2c6e73] text-white'
                              : 'bg-white dark:bg-[#1b202c] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#282f3d] hover:border-slate-300'
                          }`}
                        >
                          {primaryResult?.providerId === r.providerId ? '✓ Currently Viewing' : 'Inspect Sentence Highlights'}
                        </button>
                      </div>
                    )}
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
