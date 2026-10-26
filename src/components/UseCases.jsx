import { GraduationCap, Briefcase, Feather, MessageCircle, Users } from 'lucide-react';

const CASES = [
  {
    icon: GraduationCap,
    title: 'Students',
    description: 'Improve readability and catch supported mistakes in assignments.',
  },
  {
    icon: Briefcase,
    title: 'Professionals',
    description: 'Write clearer emails, reports, and business messages.',
  },
  {
    icon: Feather,
    title: 'Content Creators',
    description: 'Refine articles, captions, blog posts, and social content.',
  },
  {
    icon: MessageCircle,
    title: 'Everyday Writers',
    description: 'Express thoughts more clearly in everyday communication.',
  },
];

export default function UseCases() {
  return (
    <section className="py-20 bg-stone-50/60 dark:bg-stone-950/40 border-t border-stone-200/60 dark:border-stone-800/80 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/70 border border-teal-200/80 dark:border-teal-800/80 rounded-full mb-3 shadow-xs">
            <Users size={13} className="text-teal-600 dark:text-teal-400" />
            Versatile Applications
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold font-heading text-stone-900 dark:text-stone-100 mb-3 tracking-tight">
            Better Writing for Every Situation.
          </h2>
          <p className="text-base sm:text-lg text-stone-500 dark:text-stone-400 max-w-xl mx-auto">
            Tailored enhancements for the documents you work on every day.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {CASES.map((c) => {
            const Icon = c.icon;
            return (
              <div
                key={c.title}
                className="p-6 rounded-3xl bg-white dark:bg-stone-900/90 border border-stone-200/80 dark:border-stone-800 hover:border-teal-400/80 dark:hover:border-teal-500/80 hover:shadow-lg dark:hover:shadow-stone-950/50 hover:-translate-y-1 transition-all duration-200 text-center group"
              >
                <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/60 border border-teal-100 dark:border-teal-800/60 flex items-center justify-center text-teal-700 dark:text-teal-400 mx-auto mb-4 group-hover:bg-teal-600 group-hover:text-white dark:group-hover:bg-teal-600 dark:group-hover:text-white transition-all duration-200 shadow-xs">
                  <Icon size={22} />
                </div>
                <h3 className="text-lg font-semibold font-heading text-stone-900 dark:text-stone-100 mb-2">{c.title}</h3>
                <p className="text-sm text-stone-500 dark:text-stone-400 leading-relaxed">{c.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
