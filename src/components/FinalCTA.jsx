import { ArrowRight } from 'lucide-react';

export default function FinalCTA() {
  return (
    <section className="py-20 sm:py-28 relative transition-colors">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-white dark:bg-[#14171f] border border-slate-200 dark:border-[#252b38] p-8 sm:p-14 text-center shadow-xl dark:shadow-2xl dark:shadow-black/60 relative overflow-hidden">
          {/* Subtle logo accent hairline */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-0.5 bg-linear-to-r from-transparent via-[#4fa3a8] to-transparent" />

          {/* Logo icon */}
          <div className="inline-flex p-2 rounded-2xl bg-[#f0f7f8] dark:bg-[#101b1e] border border-[#c2e2e5] dark:border-[#1f3f44] mb-5 shadow-xs">
            <img
              src="/icon-light.png"
              alt="Lexora Logo"
              className="w-10 h-10 object-contain rounded-xl dark:hidden"
            />
            <img
              src="/icon-dark.png"
              alt="Lexora Logo"
              className="w-10 h-10 object-contain rounded-xl hidden dark:block"
            />
          </div>

          <h2 className="text-3xl sm:text-4xl font-bold font-heading text-slate-900 dark:text-white mb-4 tracking-tight">
            Your Ideas Deserve Better Words.
          </h2>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 mb-8 max-w-xl mx-auto leading-relaxed">
            Fix mistakes, refine academic drafts, and express yourself with professional clarity and confidence.
          </p>

          <a
            href="#editor"
            className="inline-flex items-center gap-2 px-8 py-3.5 min-h-11.5 text-base font-semibold text-white bg-[#2c6e73] hover:bg-[#23585c] dark:bg-[#38858a] dark:hover:bg-[#459da2] rounded-xl shadow-md shadow-[#2c6e73]/25 dark:shadow-[#38858a]/25 transition-all hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4fa3a8]"
          >
            Start Improving Your Writing
            <ArrowRight size={18} />
          </a>
        </div>
      </div>
    </section>
  );
}
