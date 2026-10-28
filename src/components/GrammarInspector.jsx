import { Check, CheckCheck, Sparkles, X, Loader2 } from 'lucide-react';

export default function GrammarInspector({
  healthScore = 100,
  corrections = [],
  categoryFilter = 'all',
  onSelectCategory = () => {},
  onApplyCorrection = () => {},
  onApplyAll = () => {},
  onDismissCorrection = () => {},
  onFocusCorrection = () => {},
  hasScanned = false,
  isAnalyzing = false,
  hasText = false,
  hasFixed = false,
  className = '',
}) {
  const grammarCount = corrections.filter((c) => c.type === 'grammar').length;
  const spellingCount = corrections.filter((c) => c.type === 'spelling').length;
  const clarityCount = corrections.filter((c) => c.type === 'clarity').length;
  const punctuationCount = corrections.filter((c) => c.type === 'punctuation').length;
  const styleCount = corrections.filter((c) => c.type === 'style').length;

  const categories = [
    { id: 'all', label: 'All', count: corrections.length },
    { id: 'grammar', label: 'Grammar', count: grammarCount },
    { id: 'spelling', label: 'Spelling', count: spellingCount },
    { id: 'clarity', label: 'Clarity', count: clarityCount },
    { id: 'punctuation', label: 'Punctuation', count: punctuationCount },
    { id: 'style', label: 'Style', count: styleCount },
  ].filter((cat) => cat.id === 'all' || cat.count > 0);

  const filteredCorrections = corrections.filter((c) => {
    if (categoryFilter === 'all') return true;
    return c.type === categoryFilter;
  });

  const hasIssues = corrections.length > 0;
  const effectiveHasText = hasText || hasIssues;
  const effectiveHasScanned = hasScanned || hasIssues;

  const statusLabel =
    healthScore >= 90
      ? 'Excellent'
      : healthScore >= 75
      ? 'Good Draft'
      : healthScore >= 50
      ? 'Needs Polish'
      : 'Dense Issues';

  const scoreColor =
    healthScore >= 90
      ? 'text-emerald-500'
      : healthScore >= 75
      ? 'text-[#2dd4bf]'
      : healthScore >= 50
      ? 'text-amber-500'
      : 'text-rose-500';

  return (
    <div
      className={`flex flex-col h-full rounded-2xl border border-slate-200/90 dark:border-[#222734] bg-white dark:bg-[#14171f] p-4 sm:p-5 shadow-sm transition-colors ${className}`}
    >
      {/* Header with Health Score & Accept All */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-[#222734] mb-4">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
            <Sparkles size={12} className="text-[#38858a] dark:text-[#4fa3a8]" />
            Document Health
          </div>
          <div className="flex items-baseline gap-1 mt-0.5">
            {!effectiveHasText ? (
              <>
                <span className="text-2xl font-extrabold text-slate-300 dark:text-slate-600">--</span>
                <span className="text-xs text-slate-400">/ 100</span>
                <span className="ml-2 text-xs font-semibold text-slate-400 dark:text-slate-500">
                  · Ready
                </span>
              </>
            ) : isAnalyzing ? (
              <>
                <span className="text-2xl font-extrabold text-[#38858a] dark:text-[#4fa3a8] animate-pulse">--</span>
                <span className="text-xs text-slate-400">/ 100</span>
                <span className="ml-2 text-xs font-semibold text-[#38858a] dark:text-[#4fa3a8]">
                  · Analyzing draft…
                </span>
              </>
            ) : !effectiveHasScanned ? (
              <>
                <span className="text-2xl font-extrabold text-slate-400 dark:text-slate-500">--</span>
                <span className="text-xs text-slate-400">/ 100</span>
                <span className="ml-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  · Ready to scan
                </span>
              </>
            ) : (
              <>
                <span className={`text-2xl font-extrabold ${scoreColor}`}>{healthScore}</span>
                <span className="text-xs text-slate-400">/ 100</span>
                <span className="ml-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                  · {statusLabel}
                </span>
              </>
            )}
          </div>
        </div>

        {corrections.length > 0 && (
          <button
            onClick={onApplyAll}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors cursor-pointer"
            aria-label="Accept All suggestions"
          >
            <CheckCheck size={14} />
            Accept All ({corrections.length})
          </button>
        )}
      </div>

      {/* Category Filter Pills (rendered only when issues exist) */}
      {corrections.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {categories.map((cat) => {
            const isActive = categoryFilter === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                    : 'bg-slate-100 dark:bg-[#1a1e27] text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-[#252b38]'
                }`}
              >
                <span>{cat.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isActive
                      ? 'bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900'
                      : 'bg-slate-200 dark:bg-[#282f3d] text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Suggestions List */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 min-h-50 max-h-120">
        {filteredCorrections.length === 0 ? (
          !effectiveHasText ? (
            <div className="flex flex-col items-center justify-center h-full py-10 text-center text-slate-400 dark:text-slate-500">
              <Sparkles size={28} className="text-slate-300 dark:text-slate-600 mb-2" />
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                No document content
              </p>
              <p className="text-xs mt-0.5 max-w-xs text-center text-slate-400 dark:text-slate-500">
                Paste or type text into the canvas to start proofreading.
              </p>
            </div>
          ) : isAnalyzing ? (
            <div className="flex flex-col items-center justify-center h-full py-10 text-center text-slate-400 dark:text-slate-500">
              <Loader2 size={28} className="animate-spin text-[#38858a] dark:text-[#4fa3a8] mb-2" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                Analyzing document…
              </p>
              <p className="text-xs mt-0.5 max-w-xs text-center text-slate-500 dark:text-slate-400">
                Scanning for grammar, spelling, and clarity improvements.
              </p>
            </div>
          ) : !effectiveHasScanned ? (
            <div className="flex flex-col items-center justify-center h-full py-10 text-center text-slate-400 dark:text-slate-500">
              <Sparkles size={28} className="text-[#38858a] dark:text-[#4fa3a8] mb-2 opacity-80" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                Ready to Review
              </p>
              <p className="text-xs mt-0.5 max-w-xs text-center text-slate-500 dark:text-slate-400">
                Draft modified. Click &quot;Check Grammar&quot; below to review.
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-10 text-center text-slate-400 dark:text-slate-500">
              {hasFixed ? (
                <>
                  <CheckCheck size={28} className="text-emerald-500 mb-2" />
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Clean &amp; Polished
                  </p>
                  <p className="text-xs mt-0.5 text-slate-500 dark:text-slate-400">
                    All suggestions applied. Your writing is polished and error-free.
                  </p>
                </>
              ) : (
                <>
                  <Check size={28} className="text-emerald-500 mb-2" />
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    No issues detected
                  </p>
                  <p className="text-xs mt-0.5 text-slate-500 dark:text-slate-400">
                    Your writing appears clean and grammatically sound.
                  </p>
                </>
              )}
            </div>
          )
        ) : (
          filteredCorrections.map((c, i) => {
            const badgeConfig = {
              grammar: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
              spelling: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800',
              clarity: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800',
              punctuation: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
              style: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800',
            }[c.type] || 'bg-slate-50 text-slate-700 border-slate-200';

            return (
              <div
                key={i}
                role="button"
                tabIndex={0}
                aria-label={`Suggestion: replace "${c.original}" with "${c.replacement}". ${c.explanation || ''}`}
                onClick={() => onFocusCorrection(c)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onFocusCorrection(c);
                  }
                }}
                className="p-3 rounded-xl border border-slate-200/80 dark:border-[#222734] bg-slate-50/50 dark:bg-[#10131a] hover:border-[#38858a]/50 transition-all text-xs flex flex-col gap-2 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#38858a]"
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${badgeConfig}`}
                  >
                    {c.type}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onApplyCorrection(c);
                      }}
                      className="px-2.5 py-1 rounded-lg text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 font-bold transition-colors cursor-pointer"
                      aria-label="Apply"
                    >
                      Apply
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDismissCorrection(c);
                      }}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                      aria-label="Dismiss"
                      title="Dismiss"
                    >
                      <X size={13} />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 font-mono flex-wrap">
                  <span className="line-through text-red-500/90 dark:text-red-400/90 bg-red-50 dark:bg-red-950/40 px-1.5 py-0.5 rounded">
                    {c.original}
                  </span>
                  <span className="text-slate-400">→</span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded">
                    {c.replacement}
                  </span>
                </div>

                {c.explanation && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                    {c.explanation}
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
