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
    <section id="features" className="py-20 bg-white dark:bg-[#0f1115] scroll-mt-16 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold font-heading text-slate-900 dark:text-white mb-3 tracking-tight">
            Everything You Need to Write with Confidence.
          </h2>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
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
                className="group p-6 sm:p-7 rounded-3xl border border-slate-200 dark:border-[#242936] bg-white dark:bg-[#14171f] hover:border-[#4fa3a8] dark:hover:border-[#4fa3a8] hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-black/40 hover:-translate-y-0.5 transition-all duration-200"
              >
                <div className="w-12 h-12 rounded-2xl bg-[#eef6f7] dark:bg-[#122023] border border-[#c2e2e5] dark:border-[#1f3f44] flex items-center justify-center text-[#2c6e73] dark:text-[#74b6ba] mb-5 group-hover:bg-[#2c6e73] dark:group-hover:bg-[#38858a] group-hover:text-white transition-all duration-200 shadow-xs">
                  <Icon size={22} />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2 font-heading tracking-tight">{feature.title}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{feature.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
