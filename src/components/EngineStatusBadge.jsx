import { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  ChevronDown,
  CheckCircle2,
  Activity,
  Zap,
  ShieldCheck,
  RefreshCw,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchSystemStatus, pingEngineLatency } from '../services/suiteServices.js';

export default function EngineStatusBadge() {
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState({
    geminiConfigured: false,
    cloudflareConfigured: false,
  });
  const [pingData, setPingData] = useState(null);
  const [isPinging, setIsPinging] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    fetchSystemStatus().then(setStatus);
  }, []);

  // Handle outside click and ESC key
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e) {
      if (e.key === 'Escape') setIsOpen(false);
    }

    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  async function handlePing() {
    setIsPinging(true);
    try {
      const res = await pingEngineLatency();
      setPingData(res);
      setStatus({
        geminiConfigured: res.geminiConfigured,
        cloudflareConfigured: res.cloudflareConfigured,
      });
    } finally {
      setIsPinging(false);
    }
  }

  const { geminiConfigured, cloudflareConfigured } = status;
  const isHybrid = geminiConfigured && cloudflareConfigured;
  const isCloudOnly = geminiConfigured || cloudflareConfigured;

  // Determine pill display text & color scheme
  let pillText = 'Local Engine';
  let pillSubtext = 'Offline';
  if (isHybrid) {
    pillText = 'Hybrid AI Active';
    pillSubtext = 'Gemini & Llama 70B';
  } else if (geminiConfigured) {
    pillText = 'Gemini Active';
    pillSubtext = 'Flash 3.8';
  } else if (cloudflareConfigured) {
    pillText = 'Cloudflare AI';
    pillSubtext = 'Llama 70B';
  }

  return (
    <div className="relative inline-block" ref={containerRef}>
      {/* Interactive Trigger Button (Theme Matched) */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`group relative inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer select-none bg-slate-100/90 hover:bg-slate-200/80 dark:bg-[#1c202a] dark:hover:bg-[#252b39] border ${
          isOpen
            ? 'border-[#4fa3a8] dark:border-[#4fa3a8] ring-1 ring-[#4fa3a8]/30 shadow-xs bg-slate-200/70 dark:bg-[#252b39]'
            : 'border-slate-200/80 dark:border-[#262c3b] hover:border-slate-300 dark:hover:border-[#384156]'
        } text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4fa3a8] focus-visible:ring-offset-1`}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label={`AI Engine Status: ${pillText}. Click for full model diagnostic.`}
        title="Click to view connected AI models, latency, and status"
      >
        {/* Status Indicator Dot (Refined subtle beacon) */}
        <span className="relative flex h-2 w-2 shrink-0">
          {isCloudOnly ? (
            <>
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 dark:bg-emerald-400" />
            </>
          ) : (
            <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-400 dark:bg-slate-500" />
          )}
        </span>

        {/* Text */}
        <span className="tracking-tight font-semibold text-slate-800 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
          {pillText}
        </span>

        <span className="hidden xl:inline text-[11px] font-normal text-slate-500 dark:text-slate-400 border-l border-slate-300 dark:border-slate-700/80 pl-2 ml-0.5 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">
          {pillSubtext}
        </span>

        {/* Chevron */}
        <ChevronDown
          size={12}
          className={`text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-[#2c6e73] dark:text-[#5eaeb3]' : 'rotate-0'
          }`}
        />
      </button>

      {/* Floating Diagnostics Popover */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            className="absolute right-0 top-full mt-2 w-80 sm:w-96 z-50 bg-white/98 dark:bg-[#14171f]/98 backdrop-blur-xl border border-slate-200/90 dark:border-[#262c3b] shadow-2xl rounded-2xl p-4 text-left antialiased"
            role="dialog"
            aria-label="Intelligence Engine Telemetry"
          >
            {/* Popover Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#222734]">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-[#eef6f7] dark:bg-[#142226] text-[#286468] dark:text-[#74b6ba] border border-[#c4e1e3] dark:border-[#224448]">
                  <Activity size={16} />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    Engine Telemetry
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Live status of connected neural services
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1c202a] transition-colors cursor-pointer"
                aria-label="Close telemetry dialog"
              >
                <X size={14} />
              </button>
            </div>

            {/* Health Banner */}
            <div className="my-3 p-2.5 rounded-xl bg-slate-50/80 dark:bg-[#181d28]/80 border border-slate-200/80 dark:border-[#262c3b] flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
                <CheckCircle2 size={15} className="text-emerald-500 dark:text-emerald-400 shrink-0" />
                <span>
                  {isCloudOnly ? 'Neural Engines Operational' : 'Offline Mode Active'}
                </span>
              </div>
              <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300/60 dark:border-slate-700/60">
                {isHybrid ? '2/2 Cloud Models' : isCloudOnly ? '1/2 Cloud Model' : 'Local Fallback'}
              </span>
            </div>

            {/* Connected Engines List */}
            <div className="space-y-2.5 text-xs">
              {/* Google Gemini Card */}
              <div className="p-3 rounded-xl border border-slate-200/70 dark:border-[#262c3b] bg-slate-50/60 dark:bg-[#181d28]/60 flex items-start justify-between gap-2 transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                    <Sparkles size={14} className="text-teal-600 dark:text-teal-400" />
                    <span>Google Gemini 3.8 / 3.5 Flash</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    Multimodal neural reasoning, grammar span forensics, and AI detection.
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  {geminiConfigured ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                      Unconfigured
                    </span>
                  )}
                </div>
              </div>

              {/* Cloudflare Workers AI Card */}
              <div className="p-3 rounded-xl border border-slate-200/70 dark:border-[#262c3b] bg-slate-50/60 dark:bg-[#181d28]/60 flex items-start justify-between gap-2 transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                    <Zap size={14} className="text-amber-500 dark:text-amber-400" />
                    <span>Cloudflare Workers AI</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    Meta Llama 3.1 70B & 8B at edge. High-velocity academic refinement.
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  {cloudflareConfigured ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                      Unconfigured
                    </span>
                  )}
                </div>
              </div>

              {/* Local Stylometrics & Rules Engine */}
              <div className="p-3 rounded-xl border border-slate-200/70 dark:border-[#262c3b] bg-slate-50/60 dark:bg-[#181d28]/60 flex items-start justify-between gap-2 transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                    <ShieldCheck size={14} className="text-blue-500 dark:text-blue-400" />
                    <span>Local Stylometrics & Rules</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    Zero-API offline fallback. Perplexity heuristics & Zipf burstiness.
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    Ready
                  </span>
                </div>
              </div>
            </div>

            {/* Footer / Diagnostic Ping Action */}
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-[#222734] flex items-center justify-between">
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                {pingData?.latencyMs ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                    Round-trip: {pingData.latencyMs}ms
                  </span>
                ) : (
                  <span>Air-gapped privacy</span>
                )}
              </div>

              <button
                type="button"
                onClick={handlePing}
                disabled={isPinging}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-[#1c202a] dark:hover:bg-[#252b39] border border-slate-200/80 dark:border-[#262c3b] transition-colors disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw size={12} className={isPinging ? 'animate-spin' : ''} />
                <span>{isPinging ? 'Pinging…' : 'Ping Telemetry'}</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
