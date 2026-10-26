import { ArrowRight, CheckCircle2, ArrowRightLeft } from 'lucide-react';

export default function BeforeAfter() {
  return (
    <section className="py-20 bg-white dark:bg-[#0c0a09] transition-colors">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/70 border border-teal-200/80 dark:border-teal-800/80 rounded-full mb-3 shadow-xs">
            <ArrowRightLeft size={13} className="text-teal-600 dark:text-teal-400" />
            Clear Comparison
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold font-heading text-stone-900 dark:text-stone-100 mb-3 tracking-tight">
            See the Difference.
          </h2>
          <p className="text-base sm:text-lg text-stone-500 dark:text-stone-400 max-w-xl mx-auto">
            Witness how concise, active phrasing transforms clarity.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Original */}
          <div className="rounded-3xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-900/60 p-6 sm:p-7 shadow-xs">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-stone-200/60 dark:border-stone-800">
              <span className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                Original
              </span>
              <span className="text-xs text-stone-400 dark:text-stone-500">Wordy & Clunky</span>
            </div>
            <p className="text-sm sm:text-base text-stone-600 dark:text-stone-300 leading-relaxed italic">
              "I am writing this email to tell you that I cannot come to the meeting because I have some important work to do."
            </p>
          </div>

          {/* Improved */}
          <div className="rounded-3xl border border-teal-200 dark:border-teal-900/60 bg-teal-50/40 dark:bg-teal-950/20 p-6 sm:p-7 shadow-xs relative">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-teal-200/60 dark:border-teal-900/40">
              <span className="text-xs font-bold text-teal-700 dark:text-teal-300 uppercase tracking-wider flex items-center gap-1">
                <CheckCircle2 size={13} />
                Improved
              </span>
              <span className="text-xs font-medium text-teal-700 dark:text-teal-300 bg-teal-100/80 dark:bg-teal-900/60 px-2 py-0.5 rounded-full">
                26 → 18 words (-31%)
              </span>
            </div>
            <p className="text-sm sm:text-base text-stone-800 dark:text-stone-100 leading-relaxed font-medium">
              "I'm writing to let you know that I can't attend the meeting because I have an important task to complete."
            </p>
          </div>
        </div>

        {/* Explanation */}
        <div className="text-center mb-8 max-w-xl mx-auto">
          <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
            <strong className="text-stone-800 dark:text-stone-200 font-semibold">Explanation:</strong> Reduced unnecessary wording, improved sentence flow, and preserved the basic meaning.
          </p>
          <p className="text-xs text-stone-400 dark:text-stone-500 mt-1.5">
            This is a static illustrative example — not a live-generated result.
          </p>
        </div>

        <div className="text-center">
          <a
            href="#editor"
            className="inline-flex items-center gap-2 px-6 py-3 min-h-[44px] text-sm font-semibold text-teal-800 dark:text-teal-200 bg-teal-50 dark:bg-teal-950/60 border border-teal-200/90 dark:border-teal-800 rounded-xl hover:bg-teal-100 dark:hover:bg-teal-900/60 hover:shadow-xs transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
          >
            Try It Yourself
            <ArrowRight size={16} />
          </a>
        </div>
      </div>
    </section>
  );
}
