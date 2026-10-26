import { ArrowRight } from 'lucide-react';

export default function FinalCTA() {
  return (
    <section className="py-20 bg-gradient-to-br from-teal-700 via-teal-800 to-emerald-900 dark:from-teal-950 dark:via-stone-900 dark:to-emerald-950 border-t border-teal-600/30 dark:border-stone-800 relative overflow-hidden transition-colors">
      <div className="absolute inset-0 bg-radial from-teal-500/10 via-transparent to-transparent pointer-events-none" />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <h2 className="text-3xl sm:text-4xl font-bold font-heading text-white mb-4 tracking-tight">
          Your Ideas Deserve Better Words.
        </h2>
        <p className="text-lg text-teal-100 dark:text-stone-300 mb-8 max-w-xl mx-auto">
          Fix mistakes, improve your sentences, and express yourself with confidence.
        </p>
        <a
          href="#editor"
          className="inline-flex items-center gap-2 px-7 py-3.5 min-h-[44px] text-base font-semibold text-teal-900 dark:text-teal-950 bg-white dark:bg-teal-100 rounded-xl hover:bg-teal-50 dark:hover:bg-white shadow-lg shadow-teal-950/30 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-teal-800"
        >
          Start Improving Your Writing
          <ArrowRight size={18} />
        </a>
      </div>
    </section>
  );
}
