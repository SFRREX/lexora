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
    <section className="py-20 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-[#286468] dark:text-[#74b6ba] bg-[#eef6f7] dark:bg-[#142226] border border-[#c4e1e3] dark:border-[#224448] rounded-full mb-3 shadow-xs">
            <Users size={13} className="text-[#2c6e73] dark:text-[#5eaeb3]" />
            Versatile Applications
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold font-heading text-slate-900 dark:text-white mb-3 tracking-tight">
            Better Writing for Every Situation.
          </h2>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
            Tailored enhancements for the documents you work on every day.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {CASES.map((c) => {
            const Icon = c.icon;
            return (
              <div
                key={c.title}
                className="p-6 rounded-3xl bg-white dark:bg-[#14171f] border border-slate-200 dark:border-[#242936] hover:border-[#4fa3a8] dark:hover:border-[#4fa3a8] hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-black/40 hover:-translate-y-1 transition-all duration-200 text-center group"
              >
                <div className="w-12 h-12 rounded-2xl bg-[#eef6f7] dark:bg-[#122023] border border-[#c2e2e5] dark:border-[#1f3f44] flex items-center justify-center text-[#2c6e73] dark:text-[#74b6ba] mx-auto mb-4 group-hover:bg-[#2c6e73] dark:group-hover:bg-[#38858a] group-hover:text-white transition-all duration-200 shadow-xs">
                  <Icon size={22} />
                </div>
                <h3 className="text-lg font-semibold font-heading text-slate-900 dark:text-white mb-2">{c.title}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{c.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
