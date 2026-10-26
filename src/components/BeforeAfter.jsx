import { ArrowRight, CheckCircle2, ArrowRightLeft } from 'lucide-react';

export default function BeforeAfter() {
  return (
    <section className="py-20 bg-white dark:bg-[#0f1115] transition-colors">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-[#286468] dark:text-[#74b6ba] bg-[#eef6f7] dark:bg-[#142226] border border-[#c4e1e3] dark:border-[#224448] rounded-full mb-3 shadow-xs">
            <ArrowRightLeft size={13} className="text-[#2c6e73] dark:text-[#5eaeb3]" />
            Clear Comparison
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold font-heading text-slate-900 dark:text-white mb-3 tracking-tight">
            See the Difference.
          </h2>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
            Witness how concise, active phrasing transforms clarity.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Original */}
          <div className="rounded-3xl border border-slate-200 dark:border-[#232834] bg-slate-50/70 dark:bg-[#14171f] p-6 sm:p-7 shadow-xs">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200/60 dark:border-[#222734]">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Original
              </span>
              <span className="text-xs text-slate-400 dark:text-slate-500">Wordy & Clunky</span>
            </div>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed italic">
              "I am writing this email to tell you that I cannot come to the meeting because I have some important work to do."
            </p>
          </div>

          {/* Improved */}
          <div className="rounded-3xl border border-[#c2e2e5] dark:border-[#224448] bg-[#f0f7f8] dark:bg-[#111c1f] p-6 sm:p-7 shadow-xs relative">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#c2e2e5]/60 dark:border-[#224448]/60">
              <span className="text-xs font-bold text-[#286468] dark:text-[#74b6ba] uppercase tracking-wider flex items-center gap-1">
                <CheckCircle2 size={13} />
                Improved
              </span>
              <span className="text-xs font-medium text-[#286468] dark:text-[#74b6ba] bg-[#dbeff1] dark:bg-[#172e32] px-2 py-0.5 rounded-full">
                26 → 18 words (-31%)
              </span>
            </div>
            <p className="text-sm sm:text-base text-slate-900 dark:text-white leading-relaxed font-medium">
              "I'm writing to let you know that I can't attend the meeting because I have an important task to complete."
            </p>
          </div>
        </div>

        {/* Explanation */}
        <div className="text-center mb-8 max-w-xl mx-auto">
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            <strong className="text-slate-900 dark:text-slate-200 font-semibold">Explanation:</strong> Reduced unnecessary wording, improved sentence flow, and preserved the basic meaning.
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">
            This is a static illustrative example — not a live-generated result.
          </p>
        </div>

        <div className="text-center">
          <a
            href="#editor"
            className="inline-flex items-center gap-2 px-7 py-3 min-h-11 text-sm font-semibold text-white bg-[#2c6e73] hover:bg-[#23585c] dark:bg-[#38858a] dark:hover:bg-[#459da2] rounded-xl shadow-md shadow-[#2c6e73]/20 dark:shadow-[#38858a]/20 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4fa3a8]"
          >
            Try It Yourself
            <ArrowRight size={16} />
          </a>
        </div>
      </div>
    </section>
  );
}
