import { Copy, RotateCcw, ArrowLeftRight, Check, Eye, FileText, Sparkles, ShieldAlert } from 'lucide-react';
import { useState } from 'react';

/**
 * Simple word-level diff between original and improved text for visual feedback.
 */
function renderDiff(original, improved) {
  if (!original || !improved) return improved;

  const origWords = original.trim().split(/(\s+)/);
  const impWords = improved.trim().split(/(\s+)/);

  // If identical, return clean text
  if (original.trim() === improved.trim()) {
    return <span className="text-slate-700 dark:text-slate-300">{improved}</span>;
  }

  // Create a simple token comparison map
  const origSet = new Set(origWords.map((w) => w.toLowerCase()));

  return (
    <div className="space-y-3">
      <div className="p-3 bg-white dark:bg-[#14171f] rounded-xl border border-slate-200 dark:border-[#222734] text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
        <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Key Changes Highlighted:</span>
        <div className="flex flex-wrap gap-1 leading-normal">
          {impWords.map((word, idx) => {
            if (/^\s+$/.test(word)) return <span key={idx}> </span>;
            const isNew = !origSet.has(word.toLowerCase());
            if (isNew) {
              return (
                <mark
                  key={idx}
                  className="bg-[#eef6f7] dark:bg-[#152329] text-[#1c4b4f] dark:text-[#a0dfe4] border border-[#a2d0d3]/80 dark:border-[#224448] font-medium px-1 rounded transition-colors"
                  title="Improved / Replaced"
                >
                  {word}
                </mark>
              );
            }
            return <span key={idx} className="text-slate-700 dark:text-slate-300">{word}</span>;
          })}
        </div>
      </div>

      <div className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-3">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-[#b0d8db] dark:bg-[#224448] border border-[#38858a] dark:border-[#4fa3a8] inline-block" />
          Enhanced word choices
        </span>
      </div>
    </div>
  );
}

export default function ResultPanel({
  result,
  source,
  model,
  wordCount,
  originalWordCount,
  originalText,
  onRetry,
  onReplaceOriginal,
  onSelectView,
}) {
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState('final'); // 'final' | 'diff'

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = result;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const delta = originalWordCount && wordCount ? wordCount - originalWordCount : 0;
  const deltaText =
    delta < 0
      ? `(${Math.abs(delta)} fewer words)`
      : delta > 0
      ? `(+${delta} words)`
      : '';

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Improved text</label>
          {result && (
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#1a1e27] rounded-lg p-0.5 border border-slate-200 dark:border-[#282f3d]">
              <button
                type="button"
                onClick={() => setViewMode('final')}
                className={`px-2 py-0.5 text-xs font-medium rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                  viewMode === 'final'
                    ? 'bg-white dark:bg-[#252c3a] text-slate-900 dark:text-slate-100 shadow-xs font-semibold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
                aria-pressed={viewMode === 'final'}
                title="View clean improved text"
              >
                <FileText size={11} />
                Final
              </button>
              <button
                type="button"
                onClick={() => setViewMode('diff')}
                className={`px-2 py-0.5 text-xs font-medium rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                  viewMode === 'diff'
                    ? 'bg-white dark:bg-[#252c3a] text-slate-900 dark:text-slate-100 shadow-xs font-semibold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
                aria-pressed={viewMode === 'diff'}
                title="Highlight improvements"
              >
                <Eye size={11} />
                Changes
              </button>
            </div>
          )}
        </div>

        {result && (
          <span className="text-xs text-slate-400 dark:text-slate-500">
            <strong className="text-slate-600 dark:text-slate-300 font-semibold">{wordCount}</strong> {wordCount === 1 ? 'word' : 'words'}{' '}
            {deltaText && <span className="text-[#38858a] dark:text-[#4fa3a8] font-medium">{deltaText}</span>}
          </span>
        )}
      </div>

      <div
        className={`flex-1 min-h-[220px] lg:min-h-[280px] rounded-2xl border p-4 sm:p-5 text-sm sm:text-base leading-relaxed whitespace-pre-wrap transition-colors ${
          result
            ? 'bg-[#f0f7f8] dark:bg-[#121c21] border-[#c0e0e3] dark:border-[#204045] text-slate-800 dark:text-slate-100'
            : 'bg-slate-50/70 dark:bg-[#0c0e12] border-slate-200 dark:border-[#222734] text-slate-400 dark:text-slate-500'
        }`}
        aria-live="polite"
        aria-label="Improved text output"
      >
        {result ? (
          viewMode === 'diff' ? (
            renderDiff(originalText, result)
          ) : (
            result
          )
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center py-10">
            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-[#1a1e27] flex items-center justify-center text-slate-400 dark:text-slate-500 mb-2">
              <Sparkles size={18} />
            </div>
            <p className="text-slate-400 dark:text-slate-500 text-sm">Your improved text will appear here.</p>
            <p className="text-slate-400 dark:text-slate-600 text-xs mt-1">Select an improvement tool above and click "Improve Text"</p>
          </div>
        )}
      </div>

      {/* Source label */}
      {result && source && (
        <div className="mt-2.5 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          {source === 'gemini' ? (
            <span className="text-[#23585c] dark:text-[#74b6ba] font-medium bg-[#eef6f7] dark:bg-[#121f24] border border-[#a2d0d3]/80 dark:border-[#224448] px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5 shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-[#38858a] animate-pulse" />
              Powered by Google Gemini {model ? `(${model})` : 'Neural AI'}
            </span>
          ) : (
            <span className="text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-[#1a1e27] px-2 py-0.5 rounded-md">
              ⚙ Demo mode: limited local corrections
            </span>
          )}
        </div>
      )}

      {/* Actions */}
      {result && (
        <div className="flex flex-wrap items-center gap-2 mt-4">
          <button
            onClick={handleCopy}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] text-xs sm:text-sm font-semibold rounded-xl border transition-all focus:outline-none focus:ring-2 focus:ring-[#38858a] cursor-pointer ${
              copied
                ? 'bg-[#2c6e73] text-white border-[#2c6e73]'
                : 'text-[#1c4b4f] dark:text-[#a0dfe4] bg-[#eef6f7] dark:bg-[#152329] border-[#a2d0d3] dark:border-[#224448] hover:bg-[#deeff1] dark:hover:bg-[#1a2d35]'
            }`}
            aria-label="Copy improved text"
          >
            {copied ? <Check size={15} /> : <Copy size={15} />}
            {copied ? 'Copied to Clipboard!' : 'Copy Text'}
          </button>

          <button
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[40px] text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-[#1a1e27] border border-slate-200 dark:border-[#282f3d] rounded-xl hover:bg-slate-50 dark:hover:bg-[#202634] hover:text-slate-900 dark:hover:text-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-[#38858a] cursor-pointer"
            aria-label="Try again"
          >
            <RotateCcw size={14} />
            Try Again
          </button>

          {onSelectView && (
            <button
              onClick={() => {
                navigator.clipboard.writeText(result);
                onSelectView('checker');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[40px] text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-[#1a1e27] border border-slate-200 dark:border-[#282f3d] rounded-xl hover:bg-[#eef6f7] dark:hover:bg-[#152329] hover:text-[#23585c] dark:hover:text-[#a0dfe4] hover:border-[#a2d0d3] dark:hover:border-[#224448] transition-colors focus:outline-none focus:ring-2 focus:ring-[#38858a] cursor-pointer"
              title="Copy result and scan in AI Checker"
            >
              <ShieldAlert size={14} className="text-[#38858a] dark:text-[#4fa3a8]" />
              Check for AI
            </button>
          )}

          <button
            onClick={onReplaceOriginal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-[#1a1e27] border border-slate-200 dark:border-[#282f3d] rounded-xl hover:border-[#38858a] dark:hover:border-[#4fa3a8] hover:text-[#23585c] dark:hover:text-[#a0dfe4] hover:bg-[#eef6f7]/60 dark:hover:bg-[#152329] transition-colors focus:outline-none focus:ring-2 focus:ring-[#38858a] ml-auto cursor-pointer"
            aria-label="Replace original text with improved version"
            title="Send this version back to the original text input"
          >
            <ArrowLeftRight size={14} />
            Replace Original
          </button>
        </div>
      )}
    </div>
  );
}
