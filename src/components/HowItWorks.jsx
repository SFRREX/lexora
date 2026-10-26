import { ClipboardPaste, Settings2, ClipboardCheck } from 'lucide-react';
import { motion } from 'framer-motion';

const STEPS = [
  {
    icon: ClipboardPaste,
    number: '1',
    title: 'Paste Your Text',
    description: 'Enter a sentence, paragraph, email, assignment, or other text.',
  },
  {
    icon: Settings2,
    number: '2',
    title: 'Choose an Improvement',
    description: 'Select grammar correction, word replacement, rewriting, or tone adjustment.',
  },
  {
    icon: ClipboardCheck,
    number: '3',
    title: 'Copy Your Results',
    description: 'Review the result and copy or apply it.',
  },
];

export default function HowItWorks() {
  return (
    <section className="py-20 transition-colors">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold font-heading text-slate-900 dark:text-white mb-3 tracking-tight">
            Better Writing in Three Simple Steps.
          </h2>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
            Transform any draft in seconds with our streamlined workflow.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 sm:gap-8 relative">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ delay: i * 0.12, duration: 0.4 }}
                className="bg-white dark:bg-[#14171f] rounded-3xl border border-slate-200 dark:border-[#252b38] p-7 text-center relative shadow-xs hover:shadow-md hover:border-[#4fa3a8]/50 transition-all"
              >
                <div className="w-14 h-14 rounded-2xl bg-[#eef6f7] dark:bg-[#122023] border border-[#c2e2e5] dark:border-[#1f3f44] flex items-center justify-center text-[#2c6e73] dark:text-[#74b6ba] mx-auto mb-5 shadow-xs">
                  <Icon size={24} />
                </div>
                <span className="inline-block text-xs font-bold text-[#286468] dark:text-[#74b6ba] bg-[#dbeff1] dark:bg-[#162e32] border border-[#b2dce0] dark:border-[#23484d] px-2.5 py-0.5 rounded-full mb-3">
                  Step {step.number}
                </span>
                <h3 className="text-lg font-semibold font-heading text-slate-900 dark:text-white mb-2">{step.title}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{step.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
