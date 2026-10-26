import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, ShieldAlert, BookOpen, FlaskConical } from 'lucide-react';

export default function Hero({ onSelectView }) {
  return (
    <section
      id="top"
      className="relative min-h-[90vh] flex items-center overflow-hidden bg-gradient-to-br from-stone-50 via-white to-teal-50/40 dark:from-[#0c0a09] dark:via-[#1c1917] dark:to-teal-950/20 pt-16 pb-12 transition-colors duration-250"
    >
      {/* Decorative ambient gradients */}
      <div className="absolute top-20 -left-32 w-80 h-80 bg-teal-100/40 dark:bg-teal-900/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-0 w-96 h-96 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-full blur-3xl pointer-events-none" />

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
            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 border border-teal-200/70 dark:border-teal-800 rounded-full mb-6 shadow-xs">
              <Sparkles size={13} className="text-teal-600 dark:text-teal-400" />
              AI Writing, Detection & Research Suite
            </span>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-heading text-stone-900 dark:text-stone-50 leading-[1.1] tracking-tight mb-5">
              Write Better.{' '}
              <span className="text-teal-600 dark:text-teal-400">Say It Right.</span>
            </h1>

            <p className="text-base sm:text-lg text-stone-600 dark:text-stone-300 leading-relaxed max-w-xl mx-auto lg:mx-0 mb-8 font-normal">
              Fix grammar, refine academic prose, and verify AI-generated text.
              Lexora delivers production-minded AI tools to polish sentences without losing your authentic voice or academic integrity.
            </p>

            {/* Primary Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 justify-center lg:justify-start mb-6">
              <a
                href="#editor"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-base font-semibold text-white bg-teal-600 hover:bg-teal-700 dark:bg-teal-600 dark:hover:bg-teal-500 rounded-xl shadow-md shadow-teal-600/20 transition-all hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 cursor-pointer"
              >
                Improve My Writing
                <ArrowRight size={18} />
              </a>

              <button
                type="button"
                onClick={() => onSelectView && onSelectView('checker')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-base font-semibold text-stone-800 dark:text-stone-100 bg-white dark:bg-stone-800/90 border border-stone-300 dark:border-stone-700 rounded-xl hover:border-teal-400 dark:hover:border-teal-500 hover:text-teal-700 dark:hover:text-teal-300 hover:shadow-xs transition-all focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 cursor-pointer"
              >
                <ShieldAlert size={18} className="text-emerald-600 dark:text-emerald-400" />
                Free AI Text Checker
              </button>
            </div>

            {/* Suite Quick Launch Pills */}
            <div className="pt-3 border-t border-stone-200/60 dark:border-stone-800 max-w-xl mx-auto lg:mx-0">
              <div className="text-[11px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider mb-2">
                Launch Intelligence Suite Tools:
              </div>
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2">
                <button
                  type="button"
                  onClick={() => onSelectView && onSelectView('checker')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-700 dark:text-stone-300 bg-white dark:bg-stone-800 hover:bg-stone-50 dark:hover:bg-stone-700/80 border border-stone-200 dark:border-stone-700 rounded-lg shadow-xs hover:border-teal-300 dark:hover:border-teal-500 transition-all cursor-pointer"
                >
                  <ShieldAlert size={13} className="text-emerald-600 dark:text-emerald-400" />
                  AI Checker (Free)
                </button>

                <button
                  type="button"
                  onClick={() => onSelectView && onSelectView('academic')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-700 dark:text-stone-300 bg-white dark:bg-stone-800 hover:bg-stone-50 dark:hover:bg-stone-700/80 border border-stone-200 dark:border-stone-700 rounded-lg shadow-xs hover:border-teal-300 dark:hover:border-teal-500 transition-all cursor-pointer"
                >
                  <BookOpen size={13} className="text-teal-600 dark:text-teal-400" />
                  Academic Refiner
                </button>

                <button
                  type="button"
                  onClick={() => onSelectView && onSelectView('lab')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-700 dark:text-stone-300 bg-white dark:bg-stone-800 hover:bg-stone-50 dark:hover:bg-stone-700/80 border border-stone-200 dark:border-stone-700 rounded-lg shadow-xs hover:border-teal-300 dark:hover:border-teal-500 transition-all cursor-pointer"
                >
                  <FlaskConical size={13} className="text-teal-600 dark:text-teal-400" />
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
            <div className="relative bg-white dark:bg-stone-900 rounded-3xl shadow-xl dark:shadow-2xl dark:shadow-black/60 border border-stone-200/80 dark:border-stone-800 p-6 max-w-md mx-auto transition-colors">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
                <span className="ml-auto text-xs text-stone-400 dark:text-stone-500 font-medium">
                  Lexora Writing Studio
                </span>
              </div>

              {/* Mock input */}
              <div className="rounded-xl bg-stone-50 dark:bg-stone-950/70 border border-stone-200 dark:border-stone-800 p-4 mb-3 text-sm text-stone-500 dark:text-stone-400 leading-relaxed font-normal">
                <span className="text-stone-400 dark:text-stone-500 line-through decoration-red-300">
                  I am writing this email to tell you that
                </span>{' '}
                <span className="text-stone-700 dark:text-stone-200">I cannot come to the meeting</span>{' '}
                <span className="text-stone-400 dark:text-stone-500 line-through decoration-red-300">
                  because I have
                </span>{' '}
                <span className="text-stone-400 dark:text-stone-500 line-through decoration-red-300">
                  some important work
                </span>{' '}
                <span className="text-stone-700 dark:text-stone-200">to do.</span>
              </div>

              {/* Arrow */}
              <div className="flex justify-center my-2">
                <span className="text-teal-600 dark:text-teal-400 text-lg font-bold">↓</span>
              </div>

              {/* Mock output */}
              <div className="rounded-xl bg-teal-50/70 dark:bg-teal-950/50 border border-teal-200/80 dark:border-teal-800 p-4 text-sm text-stone-800 dark:text-stone-100 leading-relaxed font-medium">
                I&apos;m writing to let you know that I can&apos;t attend the meeting because I have an important task to complete.
              </div>

              {/* Labels */}
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs text-teal-700 dark:text-teal-300 font-semibold bg-teal-100/80 dark:bg-teal-900/50 px-2 py-0.5 rounded-md">
                  ✓ Meaning Preserved
                </span>
                <span className="text-xs text-stone-500 dark:text-stone-400 font-medium">
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
