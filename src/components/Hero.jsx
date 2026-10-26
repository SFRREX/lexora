import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, ShieldAlert, BookOpen, FlaskConical } from 'lucide-react';

export default function Hero({ onSelectView }) {
  return (
    <section
      id="top"
      className="relative min-h-[90vh] flex items-center overflow-hidden pt-16 pb-12 transition-colors duration-250"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Copy */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center lg:text-left"
          >
            {/* Badge */}
            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-[#286468] dark:text-[#74b6ba] bg-[#eef6f7] dark:bg-[#142226] border border-[#c4e1e3] dark:border-[#224448] rounded-full mb-6 shadow-xs">
              <Sparkles size={13} className="text-[#2c6e73] dark:text-[#5eaeb3]" />
              AI Writing, Detection & Research Suite
            </span>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-heading text-slate-900 dark:text-white leading-[1.1] tracking-tight mb-5">
              Write Better.{' '}
              <span className="text-[#2c6e73] dark:text-[#5eaeb3]">Say It Right.</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 leading-relaxed max-w-xl mx-auto lg:mx-0 mb-8 font-normal">
              Fix grammar, refine academic prose, and verify AI-generated text.
              Lexora delivers production-minded AI tools to polish sentences without losing your authentic voice or academic integrity.
            </p>

            {/* Primary Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 justify-center lg:justify-start mb-6">
              <a
                href="#editor"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-base font-semibold text-white bg-[#2c6e73] hover:bg-[#23585c] dark:bg-[#38858a] dark:hover:bg-[#459da2] rounded-xl shadow-md shadow-[#2c6e73]/20 dark:shadow-[#38858a]/20 transition-all hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4fa3a8] cursor-pointer"
              >
                Improve My Writing
                <ArrowRight size={18} />
              </a>

              <button
                type="button"
                onClick={() => onSelectView && onSelectView('checker')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-base font-semibold text-slate-800 dark:text-slate-200 bg-white dark:bg-[#151820] border border-slate-300 dark:border-[#252b38] rounded-xl hover:border-[#4fa3a8] dark:hover:border-[#4fa3a8] hover:text-[#2c6e73] dark:hover:text-[#74b6ba] hover:shadow-xs transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4fa3a8] cursor-pointer"
              >
                <ShieldAlert size={18} className="text-[#38858a] dark:text-[#5eaeb3]" />
                Free AI Text Checker
              </button>
            </div>

            {/* Suite Quick Launch Pills */}
            <div className="pt-3 border-t border-slate-200/80 dark:border-[#222734] max-w-xl mx-auto lg:mx-0">
              <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                Launch Intelligence Suite Tools:
              </div>
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2">
                <button
                  type="button"
                  onClick={() => onSelectView && onSelectView('checker')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-[#151820] hover:bg-slate-50 dark:hover:bg-[#1a1e28] border border-slate-200 dark:border-[#242a37] rounded-lg shadow-xs hover:border-[#4fa3a8] dark:hover:border-[#4fa3a8] transition-all cursor-pointer"
                >
                  <ShieldAlert size={13} className="text-[#38858a] dark:text-[#5eaeb3]" />
                  AI Checker (Free)
                </button>

                <button
                  type="button"
                  onClick={() => onSelectView && onSelectView('academic')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-[#151820] hover:bg-slate-50 dark:hover:bg-[#1a1e28] border border-slate-200 dark:border-[#242a37] rounded-lg shadow-xs hover:border-[#4fa3a8] dark:hover:border-[#4fa3a8] transition-all cursor-pointer"
                >
                  <BookOpen size={13} className="text-[#38858a] dark:text-[#5eaeb3]" />
                  Academic Refiner
                </button>

                <button
                  type="button"
                  onClick={() => onSelectView && onSelectView('lab')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-[#151820] hover:bg-slate-50 dark:hover:bg-[#1a1e28] border border-slate-200 dark:border-[#242a37] rounded-lg shadow-xs hover:border-[#4fa3a8] dark:hover:border-[#4fa3a8] transition-all cursor-pointer"
                >
                  <FlaskConical size={13} className="text-[#38858a] dark:text-[#5eaeb3]" />
                  Research Lab
                </button>
              </div>
            </div>
          </motion.div>

          {/* Product preview */}
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="hidden lg:block"
          >
            <div className="relative bg-white dark:bg-[#14171f] rounded-3xl shadow-xl dark:shadow-2xl dark:shadow-black/70 border border-slate-200 dark:border-[#242936] p-6 max-w-md mx-auto transition-colors">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-400/80" />
                <div className="w-3 h-3 rounded-full bg-amber-400/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-400/80" />
                <span className="ml-auto text-xs text-slate-400 dark:text-slate-500 font-medium">
                  Lexora Writing Studio
                </span>
              </div>

              {/* Mock input */}
              <div className="rounded-xl bg-slate-50 dark:bg-[#0c0e12] border border-slate-200 dark:border-[#1d222d] p-4 mb-3 text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-normal">
                <span className="text-slate-400 dark:text-slate-500 line-through decoration-red-300 dark:decoration-red-400/60">
                  I am writing this email to tell you that
                </span>{' '}
                <span className="text-slate-700 dark:text-slate-200">I cannot come to the meeting</span>{' '}
                <span className="text-slate-400 dark:text-slate-500 line-through decoration-red-300 dark:decoration-red-400/60">
                  because I have
                </span>{' '}
                <span className="text-slate-400 dark:text-slate-500 line-through decoration-red-300 dark:decoration-red-400/60">
                  some important work
                </span>{' '}
                <span className="text-slate-700 dark:text-slate-200">to do.</span>
              </div>

              {/* Arrow */}
              <div className="flex justify-center my-2">
                <span className="text-[#38858a] dark:text-[#5eaeb3] text-lg font-bold">↓</span>
              </div>

              {/* Mock output */}
              <div className="rounded-xl bg-[#f0f7f8] dark:bg-[#101b1e] border border-[#c2e2e5] dark:border-[#1f3f44] p-4 text-sm text-slate-800 dark:text-slate-100 leading-relaxed font-medium">
                I&apos;m writing to let you know that I can&apos;t attend the meeting because I have an important task to complete.
              </div>

              {/* Labels */}
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs text-[#286468] dark:text-[#74b6ba] font-semibold bg-[#dbeff1] dark:bg-[#162e32] px-2.5 py-0.5 rounded-md">
                  ✓ Meaning Preserved
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  26 → 18 words (-31%)
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
