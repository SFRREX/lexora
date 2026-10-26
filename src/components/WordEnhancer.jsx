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
    badge: 'bg-[#eef6f7] dark:bg-[#122026] text-[#23585c] dark:text-[#74b6ba] border-[#a2d0d3]/80 dark:border-[#224448]',
    dot: 'bg-[#38858a]',
  },
  simpler: {
    label: 'Simpler',
    badge: 'bg-slate-100 dark:bg-[#1a1e27] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-[#282f3d]',
    dot: 'bg-slate-400',
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
    <section id="word-enhancer" className="py-20 scroll-mt-16 transition-colors">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-[#23585c] dark:text-[#74b6ba] bg-[#eef6f7] dark:bg-[#121f24] border border-[#a2d0d3]/80 dark:border-[#224448] rounded-full mb-3 shadow-xs">
            <BookOpen size={13} className="text-[#38858a] dark:text-[#4fa3a8]" />
            Context-Aware Vocabulary
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold font-heading text-slate-900 dark:text-slate-100 mb-3 tracking-tight">
            Find the Right Word, Every Time.
          </h2>
          <p className="text-base sm:text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Discover alternatives that help you express your ideas more clearly,
            naturally, and confidently.
          </p>
        </div>

        {/* Input container */}
        <div className="bg-white dark:bg-[#14171f] rounded-3xl border border-slate-200 dark:border-[#222734] shadow-md shadow-slate-200/40 dark:shadow-none p-6 sm:p-8 mb-6 transition-colors">
          <div className="grid sm:grid-cols-[1fr_auto] gap-3 mb-3">
            <div>
              <label htmlFor="word-input" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Enter a word
              </label>
              <input
                id="word-input"
                type="text"
                value={word}
                onChange={(e) => setWord(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="e.g. good, happy, important, effective…"
                className="w-full px-4 py-2.5 text-sm sm:text-base border border-slate-300 dark:border-[#262c3b] rounded-xl bg-slate-50/70 dark:bg-[#0c0e12] text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#38858a]/20 focus:border-[#38858a] dark:focus:border-[#4fa3a8] focus:bg-white dark:focus:bg-[#10131a] transition-all shadow-inner"
                aria-label="Word to find alternatives for"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleSearch}
                disabled={!word.trim() || loading}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 min-h-10.5 text-sm font-semibold text-white bg-[#38858a] hover:bg-[#2c6e73] rounded-xl disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-[#38858a]/20 hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-[#38858a] focus:ring-offset-2 dark:focus:ring-offset-[#14171f] cursor-pointer"
                aria-label="Find word alternatives"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                {loading ? 'Finding…' : 'Find Alternatives'}
              </button>
            </div>
          </div>

          {/* Quick word suggestions */}
          <div className="flex items-center gap-1.5 flex-wrap mb-4">
            <span className="text-xs text-slate-400 dark:text-slate-500 mr-1">Quick try:</span>
            {POPULAR_WORDS.map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => handleQuickWord(w)}
                className="px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-[#1a1e27] hover:bg-[#eef6f7] dark:hover:bg-[#152329] hover:text-[#23585c] dark:hover:text-[#a0dfe4] border border-slate-200 dark:border-[#282f3d] rounded-lg transition-colors cursor-pointer"
              >
                {w}
              </button>
            ))}
          </div>

          {/* Optional context */}
          <div>
            <label htmlFor="context-input" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5">
              Context sentence <span className="text-slate-400 dark:text-slate-500 text-xs font-normal">(optional — tailors suggestions to your sentence)</span>
            </label>
            <input
              id="context-input"
              type="text"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="e.g. This was an effective strategy for our team…"
              className="w-full px-4 py-2.5 text-sm sm:text-base border border-slate-300 dark:border-[#262c3b] rounded-xl bg-slate-50/70 dark:bg-[#0c0e12] text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#38858a]/20 focus:border-[#38858a] dark:focus:border-[#4fa3a8] focus:bg-white dark:focus:bg-[#10131a] transition-all shadow-inner"
              aria-label="Optional context sentence"
            />
          </div>
        </div>

        {/* Not found */}
        {notFound && (
          <div className="bg-white dark:bg-[#14171f] rounded-2xl border border-slate-200 dark:border-[#222734] p-6 text-center text-slate-500 dark:text-slate-400 text-sm shadow-xs transition-colors">
            No alternatives found for <strong className="text-slate-700 dark:text-slate-200">"{word}"</strong>.
            Try one of the quick suggestions above or another common word.
          </div>
        )}

        {/* Results */}
        {alternatives && (
          <div className="bg-white dark:bg-[#14171f] rounded-3xl border border-slate-200 dark:border-[#222734] shadow-md shadow-slate-200/40 dark:shadow-none p-6 sm:p-8 transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 pb-4 border-b border-slate-100 dark:border-[#222734]">
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  Alternatives for <span className="text-[#23585c] dark:text-[#74b6ba]">"{word}"</span>
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                  The ideal choice depends on nuance and tone.
                </p>
              </div>

              {source === 'gemini' ? (
                <span className="text-xs text-[#23585c] dark:text-[#74b6ba] font-medium bg-[#eef6f7] dark:bg-[#121f24] border border-[#a2d0d3]/80 dark:border-[#224448] px-2.5 py-1 rounded-full inline-flex items-center gap-1.5 self-start sm:self-auto shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#38858a] animate-pulse" />
                  ✨ Powered by Gemini Neural AI
                </span>
              ) : (
                <span className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-[#1a1e27] px-2.5 py-1 rounded-full self-start sm:self-auto border border-slate-200 dark:border-[#282f3d]">
                  Local Thesaurus
                </span>
              )}
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              {Object.entries(alternatives).map(([group, words]) => {
                const config = GROUP_CONFIG[group] || {
                  label: group,
                  badge: 'bg-slate-100 dark:bg-[#1a1e27] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-[#282f3d]',
                  dot: 'bg-slate-400',
                };

                return (
                  <div key={group} className="rounded-2xl border border-slate-100 dark:border-[#222734] bg-slate-50/40 dark:bg-[#0c0e12] p-4 transition-colors">
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
                          className="flex items-center justify-between px-3 py-2 rounded-xl bg-white dark:bg-[#1a1e27] border border-slate-200/70 dark:border-[#282f3d] hover:border-[#38858a]/60 dark:hover:border-[#4fa3a8]/60 hover:shadow-xs transition-all group"
                        >
                          <span className="text-sm text-slate-800 dark:text-slate-200 font-medium">{w}</span>
                          <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                            {context.trim() && (
                              <button
                                onClick={() => handleApply(w)}
                                className="px-2 py-1 text-xs font-medium text-[#23585c] dark:text-[#74b6ba] bg-[#eef6f7] dark:bg-[#152329] hover:bg-[#deeff1] dark:hover:bg-[#1c3038] rounded-md transition-colors flex items-center gap-1 focus:outline-none focus:ring-1 focus:ring-[#38858a] cursor-pointer"
                                aria-label={`Apply "${w}" to context sentence`}
                                title="Apply to context sentence"
                              >
                                {applied === w ? <Check size={12} /> : <ArrowRight size={12} />}
                                {applied === w ? 'Applied' : 'Apply'}
                              </button>
                            )}
                            <button
                              onClick={() => handleCopyWord(w)}
                              className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#252c3a] rounded-md transition-colors focus:outline-none focus:ring-1 focus:ring-[#38858a] cursor-pointer"
                              aria-label={`Copy "${w}"`}
                              title="Copy word"
                            >
                              {copiedWord === w ? <Check size={14} className="text-[#38858a] dark:text-[#4fa3a8]" /> : <Copy size={14} />}
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
