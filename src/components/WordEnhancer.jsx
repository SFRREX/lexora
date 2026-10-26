import { useState } from 'react';
import { Search, Copy, Check, ArrowRight, Loader2, BookOpen } from 'lucide-react';
import { fetchWordAlternatives } from '../services/textProcessor.js';

const GROUP_CONFIG = {
  professional: {
    label: 'Professional',
    badge: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200/80 dark:border-indigo-800',
    dot: 'bg-indigo-500',
  },
  casual: {
    label: 'Casual',
    badge: 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200/80 dark:border-amber-800',
    dot: 'bg-amber-500',
  },
  stronger: {
    label: 'Stronger',
    badge: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800',
    dot: 'bg-emerald-500',
  },
  simpler: {
    label: 'Simpler',
    badge: 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700',
    dot: 'bg-stone-400',
  },
};

const POPULAR_WORDS = ['good', 'important', 'effective', 'challenging', 'problem', 'happy', 'fast'];

export default function WordEnhancer() {
  const [word, setWord] = useState('');
  const [context, setContext] = useState('');
  const [alternatives, setAlternatives] = useState(null);
  const [source, setSource] = useState('');
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [copiedWord, setCopiedWord] = useState('');
  const [applied, setApplied] = useState('');

  async function executeSearch(targetWord, targetContext = context) {
    if (!targetWord.trim() || loading) return;
    setNotFound(false);
    setApplied('');
    setLoading(true);

    try {
      const res = await fetchWordAlternatives(targetWord, targetContext);
      if (res && res.alternatives) {
        setAlternatives(res.alternatives);
        setSource(res.source);
        setNotFound(false);
      } else {
        setAlternatives(null);
        setNotFound(true);
      }
    } catch {
      setAlternatives(null);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }

  function handleSearch() {
    executeSearch(word, context);
  }

  function handleQuickWord(w) {
    setWord(w);
    executeSearch(w, context);
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') handleSearch();
  }

  async function handleCopyWord(w) {
    try {
      await navigator.clipboard.writeText(w);
      setCopiedWord(w);
      setTimeout(() => setCopiedWord(''), 2000);
    } catch {
      setCopiedWord('');
    }
  }

  function handleApply(suggestion) {
    if (!context.trim() || !word.trim()) return;
    const regex = new RegExp(`\\b${word.trim()}\\b`, 'gi');
    const updated = context.replace(regex, (match) => {
      if (match[0] === match[0].toUpperCase()) {
        return suggestion.charAt(0).toUpperCase() + suggestion.slice(1);
      }
      return suggestion.toLowerCase();
    });
    setContext(updated);
    setApplied(suggestion);
    setTimeout(() => setApplied(''), 2000);
  }

  return (
    <section id="word-enhancer" className="py-20 bg-stone-50/60 dark:bg-stone-950/40 scroll-mt-16 transition-colors">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/50 border border-teal-200/80 dark:border-teal-800/80 rounded-full mb-3 shadow-xs">
            <BookOpen size={13} className="text-teal-600 dark:text-teal-400" />
            Context-Aware Vocabulary
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold font-heading text-stone-900 dark:text-stone-100 mb-3 tracking-tight">
            Find the Right Word, Every Time.
          </h2>
          <p className="text-base sm:text-lg text-stone-500 dark:text-stone-400 max-w-2xl mx-auto leading-relaxed">
            Discover alternatives that help you express your ideas more clearly,
            naturally, and confidently.
          </p>
        </div>

        {/* Input container */}
        <div className="bg-white dark:bg-stone-900/90 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-md shadow-stone-200/40 dark:shadow-none p-6 sm:p-8 mb-6 transition-colors">
          <div className="grid sm:grid-cols-[1fr_auto] gap-3 mb-3">
            <div>
              <label htmlFor="word-input" className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                Enter a word
              </label>
              <input
                id="word-input"
                type="text"
                value={word}
                onChange={(e) => setWord(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="e.g. good, happy, important, effective…"
                className="w-full px-4 py-2.5 text-sm sm:text-base border border-stone-300 dark:border-stone-700 rounded-xl bg-stone-50/70 dark:bg-stone-950/70 text-stone-800 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-600 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 dark:focus:border-teal-500 focus:bg-white dark:focus:bg-stone-900 transition-all shadow-inner"
                aria-label="Word to find alternatives for"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleSearch}
                disabled={!word.trim() || loading}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 min-h-[42px] text-sm font-semibold text-white bg-teal-600 dark:bg-teal-500 rounded-xl hover:bg-teal-700 dark:hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-teal-700/20 hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 dark:focus:ring-offset-stone-900 cursor-pointer"
                aria-label="Find word alternatives"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                {loading ? 'Finding…' : 'Find Alternatives'}
              </button>
            </div>
          </div>

          {/* Quick word suggestions */}
          <div className="flex items-center gap-1.5 flex-wrap mb-4">
            <span className="text-xs text-stone-400 dark:text-stone-500 mr-1">Quick try:</span>
            {POPULAR_WORDS.map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => handleQuickWord(w)}
                className="px-2.5 py-1 text-xs font-medium text-stone-600 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 hover:bg-teal-50 dark:hover:bg-teal-950/60 hover:text-teal-800 dark:hover:text-teal-200 border border-stone-200 dark:border-stone-700 rounded-lg transition-colors cursor-pointer"
              >
                {w}
              </button>
            ))}
          </div>

          {/* Optional context */}
          <div>
            <label htmlFor="context-input" className="block text-sm font-medium text-stone-600 dark:text-stone-300 mb-1.5">
              Context sentence <span className="text-stone-400 dark:text-stone-500 text-xs font-normal">(optional — tailors suggestions to your sentence)</span>
            </label>
            <input
              id="context-input"
              type="text"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="e.g. This was an effective strategy for our team…"
              className="w-full px-4 py-2.5 text-sm sm:text-base border border-stone-300 dark:border-stone-700 rounded-xl bg-stone-50/70 dark:bg-stone-950/70 text-stone-800 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-600 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 dark:focus:border-teal-500 focus:bg-white dark:focus:bg-stone-900 transition-all shadow-inner"
              aria-label="Optional context sentence"
            />
          </div>
        </div>

        {/* Not found */}
        {notFound && (
          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-6 text-center text-stone-500 dark:text-stone-400 text-sm shadow-xs transition-colors">
            No alternatives found for <strong className="text-stone-700 dark:text-stone-200">"{word}"</strong>.
            Try one of the quick suggestions above or another common word.
          </div>
        )}

        {/* Results */}
        {alternatives && (
          <div className="bg-white dark:bg-stone-900/90 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-md shadow-stone-200/40 dark:shadow-none p-6 sm:p-8 transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 pb-4 border-b border-stone-100 dark:border-stone-800">
              <div>
                <p className="text-sm font-semibold text-stone-800 dark:text-stone-100">
                  Alternatives for <span className="text-teal-700 dark:text-teal-400">"{word}"</span>
                </p>
                <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">
                  The ideal choice depends on nuance and tone.
                </p>
              </div>

              {source === 'gemini' ? (
                <span className="text-xs text-emerald-800 dark:text-emerald-300 font-medium bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800 px-2.5 py-1 rounded-full inline-flex items-center gap-1.5 self-start sm:self-auto shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  ✨ Powered by Gemini Neural AI
                </span>
              ) : (
                <span className="text-xs text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-stone-800 px-2.5 py-1 rounded-full self-start sm:self-auto border border-stone-200 dark:border-stone-700">
                  Local Thesaurus
                </span>
              )}
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              {Object.entries(alternatives).map(([group, words]) => {
                const config = GROUP_CONFIG[group] || {
                  label: group,
                  badge: 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700',
                  dot: 'bg-stone-400',
                };

                return (
                  <div key={group} className="rounded-2xl border border-stone-100 dark:border-stone-800 bg-stone-50/40 dark:bg-stone-950/50 p-4 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-semibold rounded-full border ${config.badge}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
                        {config.label}
                      </span>
                    </div>

                    <ul className="space-y-2">
                      {words.map((w) => (
                        <li
                          key={w}
                          className="flex items-center justify-between px-3 py-2 rounded-xl bg-white dark:bg-stone-800 border border-stone-200/70 dark:border-stone-700 hover:border-teal-300 dark:hover:border-teal-600 hover:shadow-xs transition-all group"
                        >
                          <span className="text-sm text-stone-800 dark:text-stone-200 font-medium">{w}</span>
                          <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                            {context.trim() && (
                              <button
                                onClick={() => handleApply(w)}
                                className="px-2 py-1 text-xs font-medium text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 dark:hover:bg-teal-900/60 rounded-md transition-colors flex items-center gap-1 focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer"
                                aria-label={`Apply "${w}" to context sentence`}
                                title="Apply to context sentence"
                              >
                                {applied === w ? <Check size={12} /> : <ArrowRight size={12} />}
                                {applied === w ? 'Applied' : 'Apply'}
                              </button>
                            )}
                            <button
                              onClick={() => handleCopyWord(w)}
                              className="p-1.5 text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-md transition-colors focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer"
                              aria-label={`Copy "${w}"`}
                              title="Copy word"
                            >
                              {copiedWord === w ? <Check size={14} className="text-teal-600 dark:text-teal-400" /> : <Copy size={14} />}
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
