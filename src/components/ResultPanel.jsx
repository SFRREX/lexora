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
    return <span className="text-stone-700 dark:text-stone-300">{improved}</span>;
  }

  // Create a simple token comparison map
  const origSet = new Set(origWords.map((w) => w.toLowerCase()));

  return (
    <div className="space-y-3">
      <div className="p-3 bg-white dark:bg-stone-900/90 rounded-xl border border-stone-200 dark:border-stone-800 text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
        <span className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">Key Changes Highlighted:</span>
        <div className="flex flex-wrap gap-1 leading-normal">
          {impWords.map((word, idx) => {
            if (/^\s+$/.test(word)) return <span key={idx}> </span>;
            const isNew = !origSet.has(word.toLowerCase());
            if (isNew) {
              return (
                <mark
                  key={idx}
                  className="bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-medium px-1 rounded transition-colors"
                  title="Improved / Replaced"
                >
                  {word}
                </mark>
              );
            }
            return <span key={idx} className="text-stone-700 dark:text-stone-300">{word}</span>;
          })}
        </div>
      </div>

      <div className="text-xs text-stone-400 dark:text-stone-500 flex items-center gap-3">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-emerald-200 dark:bg-emerald-800 border border-emerald-400 dark:border-emerald-600 inline-block" />
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
          <label className="text-sm font-semibold text-stone-700 dark:text-stone-300">Improved text</label>
          {result && (
            <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-800 rounded-lg p-0.5 border border-stone-200 dark:border-stone-700">
              <button
                type="button"
                onClick={() => setViewMode('final')}
                className={`px-2 py-0.5 text-xs font-medium rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                  viewMode === 'final'
                    ? 'bg-white dark:bg-stone-700 text-stone-800 dark:text-stone-100 shadow-xs font-semibold'
                    : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
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
                    ? 'bg-white dark:bg-stone-700 text-stone-800 dark:text-stone-100 shadow-xs font-semibold'
                    : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
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
          <span className="text-xs text-stone-400 dark:text-stone-500">
            <strong className="text-stone-600 dark:text-stone-300 font-semibold">{wordCount}</strong> {wordCount === 1 ? 'word' : 'words'}{' '}
            {deltaText && <span className="text-teal-600 dark:text-teal-400 font-medium">{deltaText}</span>}
          </span>
        )}
      </div>

      <div
        className={`flex-1 min-h-[220px] lg:min-h-[280px] rounded-2xl border p-4 sm:p-5 text-sm sm:text-base leading-relaxed whitespace-pre-wrap transition-colors ${
          result
            ? 'bg-teal-50/30 dark:bg-teal-950/20 border-teal-200/70 dark:border-teal-900/50 text-stone-800 dark:text-stone-100'
            : 'bg-stone-50/60 dark:bg-stone-950/40 border-stone-200 dark:border-stone-800 text-stone-400 dark:text-stone-500'
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
            <div className="w-10 h-10 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-400 dark:text-stone-500 mb-2">
              <Sparkles size={18} />
            </div>
            <p className="text-stone-400 dark:text-stone-500 text-sm">Your improved text will appear here.</p>
            <p className="text-stone-300 dark:text-stone-600 text-xs mt-1">Select an improvement tool above and click "Improve Text"</p>
          </div>
        )}
      </div>

      {/* Source label */}
      {result && source && (
        <div className="mt-2.5 flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
          {source === 'gemini' ? (
            <span className="text-emerald-800 dark:text-emerald-300 font-medium bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/80 dark:border-emerald-800 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5 shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Powered by Google Gemini {model ? `(${model})` : 'Neural AI'}
            </span>
          ) : (
            <span className="text-stone-400 dark:text-stone-500 bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded-md">
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
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] text-xs sm:text-sm font-semibold rounded-xl border transition-all focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer ${
              copied
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'text-teal-800 dark:text-teal-200 bg-teal-50/80 dark:bg-teal-950/60 border-teal-200 dark:border-teal-800 hover:bg-teal-100 dark:hover:bg-teal-900/60'
            }`}
            aria-label="Copy improved text"
          >
            {copied ? <Check size={15} /> : <Copy size={15} />}
            {copied ? 'Copied to Clipboard!' : 'Copy Text'}
          </button>

          <button
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[40px] text-xs sm:text-sm font-medium text-stone-600 dark:text-stone-300 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-700/80 hover:text-stone-900 dark:hover:text-stone-100 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
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
              className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[40px] text-xs sm:text-sm font-medium text-stone-700 dark:text-stone-300 bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-xl hover:bg-teal-50 dark:hover:bg-teal-950/50 hover:text-teal-800 dark:hover:text-teal-200 hover:border-teal-200 dark:hover:border-teal-800 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
              title="Copy result and scan in AI Checker"
            >
              <ShieldAlert size={14} className="text-emerald-600 dark:text-emerald-400" />
              Check for AI
            </button>
          )}

          <button
            onClick={onReplaceOriginal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] text-xs sm:text-sm font-medium text-stone-700 dark:text-stone-300 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl hover:border-teal-300 dark:hover:border-teal-700 hover:text-teal-700 dark:hover:text-teal-300 hover:bg-teal-50/30 dark:hover:bg-teal-950/30 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 ml-auto cursor-pointer"
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
