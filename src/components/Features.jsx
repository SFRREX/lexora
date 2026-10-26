import {
  CheckCircle2,
  RefreshCw,
  PenTool,
  MessageSquare,
  FileDown,
  Scissors,
} from 'lucide-react';
import { motion } from 'framer-motion';

const FEATURES = [
  {
    icon: CheckCircle2,
    title: 'Grammar Checker',
    description: 'Correct supported grammar, spelling, and punctuation issues.',
  },
  {
    icon: RefreshCw,
    title: 'Smart Word Replacement',
    description: 'Explore alternatives and reduce repetitive vocabulary.',
  },
  {
    icon: PenTool,
    title: 'Sentence Rewriter',
    description: 'Make awkward sentences clearer and more natural.',
  },
  {
    icon: MessageSquare,
    title: 'Tone Adjustment',
    description: 'Adapt writing for formal, professional, friendly, or casual contexts.',
  },
  {
    icon: FileDown,
    title: 'Text Simplifier',
    description: 'Turn complicated sentences into more straightforward language.',
  },
  {
    icon: Scissors,
    title: 'Shorten and Refine',
    description: 'Remove unnecessary wording and make text more concise.',
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4 },
  }),
};

export default function Features() {
  return (
    <section id="features" className="py-20 bg-white dark:bg-[#0c0a09] scroll-mt-16 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold font-heading text-stone-900 dark:text-stone-100 mb-3 tracking-tight">
            Everything You Need to Write with Confidence.
          </h2>
          <p className="text-base sm:text-lg text-stone-500 dark:text-stone-400 max-w-2xl mx-auto leading-relaxed">
            From small grammar mistakes to better word choices, improve your writing one sentence at a time.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-40px' }}
                variants={cardVariants}
                className="group p-6 sm:p-7 rounded-3xl border border-stone-200/90 dark:border-stone-800 bg-white dark:bg-stone-900/80 hover:border-teal-400/80 dark:hover:border-teal-500/80 hover:shadow-lg hover:shadow-stone-200/50 dark:hover:shadow-none hover:-translate-y-0.5 transition-all duration-200"
              >
                <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/60 border border-teal-100 dark:border-teal-900/60 flex items-center justify-center text-teal-700 dark:text-teal-400 mb-5 group-hover:bg-teal-600 dark:group-hover:bg-teal-500 group-hover:text-white transition-all duration-200 shadow-xs">
                  <Icon size={22} />
                </div>
                <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-100 mb-2 font-heading tracking-tight">{feature.title}</h3>
                <p className="text-sm text-stone-500 dark:text-stone-400 leading-relaxed">{feature.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
