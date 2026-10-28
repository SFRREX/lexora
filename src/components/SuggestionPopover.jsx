import { useEffect } from 'react';
import { Check, X } from 'lucide-react';

export default function SuggestionPopover({
  correction,
  position,
  onApply,
  onDismiss,
}) {
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        onApply();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onDismiss();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onApply, onDismiss]);

  if (!correction) return null;

  const typeConfig = {
    grammar: {
      label: 'Grammar',
      badgeClass: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-900',
    },
    spelling: {
      label: 'Spelling',
      badgeClass: 'bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 border-red-200 dark:border-red-900',
    },
    clarity: {
      label: 'Clarity',
      badgeClass: 'bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border-sky-200 dark:border-sky-900',
    },
    punctuation: {
      label: 'Punctuation',
      badgeClass: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-900',
    },
    style: {
      label: 'Style',
      badgeClass: 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-900',
    },
  }[correction.type] || {
    label: 'Suggestion',
    badgeClass: 'bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700',
  };

  const style = position
    ? {
        top: `${Math.max(8, position.top)}px`,
        left: `${Math.max(8, position.left)}px`,
      }
    : {};

  return (
    <div
      style={style}
      onClick={(e) => e.stopPropagation()}
      className="absolute z-50 w-72 sm:w-80 rounded-2xl bg-white dark:bg-[#141824] border border-slate-200/90 dark:border-[#2a324b] shadow-2xl shadow-slate-900/20 p-3.5 text-xs animate-in fade-in zoom-in-95 duration-150"
      role="dialog"
      aria-modal="false"
      aria-label="Suggestion details"
    >
      <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-slate-100 dark:border-[#22293d]">
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${typeConfig.badgeClass}`}
        >
          {typeConfig.label}
        </span>
        <button
          onClick={onDismiss}
          className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="Dismiss suggestion"
          title="Dismiss (Esc)"
        >
          <X size={14} />
        </button>
      </div>

      <div className="flex items-center gap-2 mb-2 font-mono flex-wrap">
        <span className="line-through text-red-500/90 dark:text-red-400/90 bg-red-50 dark:bg-red-950/40 px-2 py-0.5 rounded text-xs">
          {correction.original}
        </span>
        <span className="text-slate-400 text-xs">→</span>
        <button
          onClick={onApply}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm shadow-emerald-600/30 transition-all cursor-pointer"
          aria-label={`Apply: ${correction.replacement}`}
        >
          <Check size={13} />
          {correction.replacement}
          <kbd className="hidden sm:inline px-1 py-0.2 bg-emerald-700/60 rounded text-[9px] font-mono opacity-80">
            ↵ Enter
          </kbd>
        </button>
      </div>

      {correction.explanation && (
        <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
          {correction.explanation}
        </p>
      )}
    </div>
  );
}
