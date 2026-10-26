import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const FAQ_ITEMS = [
  {
    question: 'Does Lexora fix grammar and improve sentences automatically?',
    answer:
      'Yes. Lexora analyzes your text for grammar, punctuation, and style issues using Google Gemini AI when connected, with an offline deterministic fallback. You can choose whether to correct grammar, shorten, simplify, or adjust the tone.',
  },
  {
    question: 'How does Lexora provide free AI text detection?',
    answer:
      'Commercial detectors like GPTZero often charge expensive monthly subscriptions. Lexora provides free detection out of the box using our Google Gemini neural detector and local stylometrics engine (analyzing burstiness and type-token ratio) with zero subscription fees.',
  },
  {
    question: 'What is Academic Unslop and citation protection?',
    answer:
      'The Academic Refiner detects and strips stereotypical AI filler phrases (e.g. "delve into", "pivotal role", "testament to") while safeguarding scholarly citations (e.g. [1, 2], Smith et al., 2023) and empirical statistics from modification.',
  },
  {
    question: 'Can I replace individual words?',
    answer:
      'Yes. The Word Enhancer allows you to look up context-aware alternatives grouped by tone (Professional, Casual, Stronger, Simpler) and apply them directly to your sentences.',
  },
  {
    question: 'Will rewriting alter my scientific or scholarly meaning?',
    answer:
      'Lexora is engineered to preserve core factual meaning and statistical values. We offer balanced and conservative refinement levels so you maintain complete control over the degree of transformation.',
  },
  {
    question: 'Can I use Lexora for manuscripts, emails, and essays?',
    answer:
      'Lexora is built for academic papers, journal manuscripts, thesis drafts, professional correspondence, and daily writing tasks.',
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  function toggle(index) {
    setOpenIndex(openIndex === index ? null : index);
  }

  return (
    <section id="faq" className="py-20 scroll-mt-16 transition-colors">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold font-heading text-slate-900 dark:text-white mb-3 tracking-tight">
            Frequently Asked Questions.
          </h2>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
            Everything you need to know about Lexora and text processing.
          </p>
        </div>

        <div className="space-y-3.5" role="list">
          {FAQ_ITEMS.map((item, i) => {
            const isOpen = openIndex === i;
            return (
              <div
                key={i}
                className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                  isOpen
                    ? 'border-[#4fa3a8] dark:border-[#224448] bg-[#f0f7f8] dark:bg-[#121c1f] shadow-xs'
                    : 'border-slate-200 dark:border-[#242936] bg-white dark:bg-[#14171f] hover:border-slate-300 dark:hover:border-[#2d3444]'
                }`}
                role="listitem"
              >
                <button
                  onClick={() => toggle(i)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggle(i);
                    }
                  }}
                  className="w-full flex items-center justify-between px-5 py-4 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#4fa3a8]"
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${i}`}
                >
                  <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 pr-4">
                    {item.question}
                  </span>
                  <ChevronDown
                    size={18}
                    className={`text-slate-400 dark:text-slate-500 shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      id={`faq-answer-${i}`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                      role="region"
                      aria-labelledby={`faq-q-${i}`}
                    >
                      <div className="px-5 pb-4 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                        {item.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
