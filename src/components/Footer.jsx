const CURRENT_YEAR = new Date().getFullYear();

export default function Footer({ onSelectView }) {
  const SUITE_LINKS = [
    { label: 'Writing Studio', view: 'studio' },
    { label: 'AI Checker', view: 'checker' },
    { label: 'Academic Refiner', view: 'academic' },
    { label: 'Research Lab', view: 'lab' },
  ];

  const SECONDARY_LINKS = [
    { label: 'Grammar Checker', href: '#editor' },
    { label: 'Word Enhancer', href: '#word-enhancer' },
    { label: 'Features', href: '#features' },
    { label: 'FAQ', href: '#faq' },
    { label: 'Privacy Policy', href: '#', placeholder: true },
    { label: 'Terms of Service', href: '#', placeholder: true },
  ];

  return (
    <footer className="bg-stone-900 dark:bg-[#080706] text-stone-400 py-12 border-t border-stone-800 dark:border-stone-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8 mb-8">
          {/* Brand */}
          <div className="max-w-sm">
            <button
              type="button"
              onClick={() => onSelectView && onSelectView('studio')}
              className="flex items-center gap-2.5 mb-2 group text-left cursor-pointer rounded-lg p-1 -m-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
              aria-label="Lexora – return to Writing Studio"
            >
              <img
                src="/logo.png"
                alt="Lexora Logo"
                className="w-7 h-7 rounded-md object-cover shadow-xs border border-teal-500/30 group-hover:scale-105 transition-transform"
              />
              <span className="text-lg font-semibold text-white tracking-tight">Lexora</span>
              <span className="text-[10px] text-teal-400 font-medium px-1.5 py-0.5 rounded bg-teal-950/80 border border-teal-800/60">
                Suite
              </span>
            </button>
            <p className="text-xs text-stone-400 leading-relaxed">
              The Art of Better Words. Empowering scholars, writers, and researchers with AI text detection,
              unslop academic refinement, and empirical detector research.
            </p>
          </div>

          {/* Suite Features Navigation */}
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-stone-300 mb-2">
              Intelligence Suite
            </div>
            <ul className="flex flex-col sm:flex-row sm:flex-wrap gap-x-5 gap-y-1.5">
              {SUITE_LINKS.map((link) => (
                <li key={link.label}>
                  <button
                    type="button"
                    onClick={() => onSelectView && onSelectView(link.view)}
                    className="text-xs text-stone-400 hover:text-teal-400 transition-colors cursor-pointer text-left rounded focus:outline-none focus-visible:ring-1 focus-visible:ring-teal-400"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Secondary & Legal Links */}
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-stone-300 mb-2">
              Resources & Legal
            </div>
            <ul className="flex flex-wrap gap-x-4 gap-y-1.5">
              {SECONDARY_LINKS.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className={`text-xs hover:text-teal-400 transition-colors rounded focus:outline-none focus-visible:ring-1 focus-visible:ring-teal-400 ${
                      link.placeholder ? 'cursor-default text-stone-500' : 'text-stone-400'
                    }`}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-stone-800 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 gap-2">
          <div>© {CURRENT_YEAR} Lexora Intelligence Suite. All rights reserved.</div>
          <div className="text-[11px] text-stone-500 dark:text-stone-500">
            Research-backed implementation adhering to NAACL, Cambridge Data & Policy, and Springer benchmarks.
          </div>
        </div>
      </div>
    </footer>
  );
}
