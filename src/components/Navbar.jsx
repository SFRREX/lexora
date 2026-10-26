import { useState, useEffect } from 'react';
import {
  Menu,
  X,
  ShieldAlert,
  BookOpen,
  FlaskConical,
  Sparkles,
  ChevronRight,
  Sparkle,
  Sun,
  Moon,
  Laptop,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { checkGeminiStatus } from '../services/textProcessor.js';
import { useTheme } from '../utils/theme.js';

export default function Navbar({ currentView, onSelectView }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isGemini, setIsGemini] = useState(false);
  const { theme, effectiveTheme, setTheme } = useTheme();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    checkGeminiStatus().then(setIsGemini);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [menuOpen]);

  function handleViewSelect(viewId) {
    if (onSelectView) onSelectView(viewId);
    setMenuOpen(false);
  }

  function cycleTheme() {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  }

  const SUITE_TABS = [
    { id: 'studio', label: 'Writing Studio', shortLabel: 'Studio', icon: Sparkles },
    { id: 'checker', label: 'AI Checker', shortLabel: 'AI Checker', icon: ShieldAlert },
    { id: 'academic', label: 'Academic Refiner', shortLabel: 'Academic', icon: BookOpen },
    { id: 'lab', label: 'Research Lab', shortLabel: 'Research', icon: FlaskConical },
  ];

  const STUDIO_SECTIONS = [
    { label: 'Editor', href: '#editor' },
    { label: 'Word Enhancer', href: '#word-enhancer' },
    { label: 'Features', href: '#features' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'FAQ', href: '#faq' },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-250 ${
        scrolled
          ? 'bg-white/95 dark:bg-stone-900/95 backdrop-blur-md shadow-sm border-b border-stone-200/80 dark:border-stone-800'
          : 'bg-white/90 dark:bg-stone-900/90 backdrop-blur-sm border-b border-stone-200/50 dark:border-stone-800/60'
      }`}
    >
      <nav
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4"
        aria-label="Main navigation"
      >
        {/* Brand */}
        <button
          type="button"
          onClick={() => handleViewSelect('studio')}
          className="flex items-center gap-2.5 group text-left cursor-pointer shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 rounded-lg p-1"
          aria-label="Lexora – return to Writing Studio"
        >
          <img
            src="/logo.png"
            alt="Lexora Logo"
            className="w-8 h-8 rounded-lg object-cover shadow-xs border border-teal-500/30 group-hover:scale-105 transition-transform"
          />
          <span className="text-xl font-bold text-stone-900 dark:text-stone-50 tracking-tight">
            Lexora
          </span>
          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-teal-800 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/70 px-2 py-0.5 rounded-full border border-teal-200/70 dark:border-teal-800">
            <Sparkle size={10} className="text-teal-600 dark:text-teal-400" />
            Suite
          </span>
        </button>

        {/* Desktop Suite View Tabs (Segmented pill) */}
        <div className="hidden md:flex items-center bg-stone-100/90 dark:bg-stone-800/90 p-1 rounded-xl border border-stone-200/80 dark:border-stone-700 shadow-inner shrink-0">
          {SUITE_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentView === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleViewSelect(tab.id)}
                className={`relative px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 flex items-center gap-1.5 cursor-pointer whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-1 select-none ${
                  isActive
                    ? 'bg-white dark:bg-stone-700 text-teal-950 dark:text-teal-200 shadow-xs font-bold'
                    : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/60 dark:hover:bg-stone-700/60'
                }`}
              >
                <Icon size={14} className={isActive ? 'text-teal-600 dark:text-teal-400' : 'text-stone-400 dark:text-stone-400'} />
                <span className="hidden lg:inline">{tab.label}</span>
                <span className="inline lg:hidden">{tab.shortLabel}</span>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-600 dark:bg-teal-400 shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Desktop Actions: AI Status, Theme Toggle, CTA */}
        <div className="hidden md:flex items-center gap-2.5 shrink-0">
          {isGemini ? (
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800 rounded-full whitespace-nowrap"
              title="Google Gemini AI is active"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Gemini Active
            </span>
          ) : (
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-full whitespace-nowrap"
              title="Local rules engine active"
            >
              Local Engine
            </span>
          )}

          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={cycleTheme}
            className="p-2 text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-50 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700/80 rounded-xl border border-stone-200/80 dark:border-stone-700 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 cursor-pointer"
            title={`Current theme: ${theme} (${effectiveTheme}). Click to cycle Light → Dark → System.`}
            aria-label={`Current theme is ${theme}. Click to switch theme.`}
          >
            {theme === 'dark' ? (
              <Moon size={15} className="text-teal-400" />
            ) : theme === 'light' ? (
              <Sun size={15} className="text-amber-500" />
            ) : (
              <Laptop size={15} className="text-teal-600 dark:text-teal-400" />
            )}
          </button>

          <button
            type="button"
            onClick={() => handleViewSelect(currentView === 'checker' ? 'studio' : 'checker')}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-teal-600 rounded-lg hover:bg-teal-700 shadow-xs transition-colors cursor-pointer whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
          >
            {currentView === 'checker' ? (
              <>
                <Sparkles size={13} />
                Open Studio
              </>
            ) : (
              <>
                <ShieldAlert size={13} />
                Check AI Text
              </>
            )}
          </button>
        </div>

        {/* Mobile menu toggle */}
        <div className="flex md:hidden items-center gap-2">
          {/* Mobile Theme Toggle */}
          <button
            type="button"
            onClick={cycleTheme}
            className="p-2 rounded-lg text-stone-600 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Moon size={18} className="text-teal-400" />
            ) : theme === 'light' ? (
              <Sun size={18} className="text-amber-500" />
            ) : (
              <Laptop size={18} className="text-teal-600 dark:text-teal-400" />
            )}
          </button>

          <button
            className="p-2 rounded-lg text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 cursor-pointer"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 shadow-lg overflow-hidden"
          >
            <div className="px-4 py-4 space-y-4">
              {/* Suite Tools Section */}
              <div>
                <div className="text-[11px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider px-2 mb-2">
                  Intelligence Suite Tools
                </div>
                <div className="grid grid-cols-1 gap-1">
                  {SUITE_TABS.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = currentView === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => handleViewSelect(tab.id)}
                        className={`w-full text-left px-3 py-2.5 text-sm font-semibold rounded-xl transition-colors flex items-center justify-between cursor-pointer ${
                          isActive
                            ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-900 dark:text-teal-200 border border-teal-200/80 dark:border-teal-800 shadow-xs'
                            : 'text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon size={18} className={isActive ? 'text-teal-600 dark:text-teal-400' : 'text-stone-400 dark:text-stone-500'} />
                          <span>{tab.label}</span>
                        </div>
                        {isActive ? (
                          <span className="text-[11px] font-bold text-teal-700 dark:text-teal-300 bg-teal-100/80 dark:bg-teal-900/60 px-2 py-0.5 rounded-md">
                            Active
                          </span>
                        ) : (
                          <ChevronRight size={16} className="text-stone-300 dark:text-stone-600" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Studio On-Page Anchor Links (when on studio) */}
              {currentView === 'studio' && (
                <div className="pt-2 border-t border-stone-100 dark:border-stone-800">
                  <div className="text-[11px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider px-2 mb-2">
                    Studio Sections
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-xs">
                    {STUDIO_SECTIONS.map((link) => (
                      <a
                        key={link.href}
                        href={link.href}
                        onClick={() => setMenuOpen(false)}
                        className="px-3 py-2 rounded-lg text-stone-600 dark:text-stone-400 hover:text-teal-700 dark:hover:text-teal-300 hover:bg-stone-50 dark:hover:bg-stone-800/60 font-medium"
                      >
                        {link.label}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Mobile Theme Switcher Row */}
              <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
                <span className="text-xs font-semibold text-stone-600 dark:text-stone-400">
                  Theme Appearance
                </span>
                <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-800 p-1 rounded-lg border border-stone-200 dark:border-stone-700">
                  <button
                    type="button"
                    onClick={() => setTheme('light')}
                    className={`px-2.5 py-1 text-xs rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                      theme === 'light'
                        ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-50 shadow-xs font-bold'
                        : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
                    }`}
                  >
                    <Sun size={12} className={theme === 'light' ? 'text-amber-500' : ''} />
                    Light
                  </button>
                  <button
                    type="button"
                    onClick={() => setTheme('dark')}
                    className={`px-2.5 py-1 text-xs rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                      theme === 'dark'
                        ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-50 shadow-xs font-bold'
                        : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
                    }`}
                  >
                    <Moon size={12} className={theme === 'dark' ? 'text-teal-400' : ''} />
                    Dark
                  </button>
                  <button
                    type="button"
                    onClick={() => setTheme('system')}
                    className={`px-2.5 py-1 text-xs rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                      theme === 'system'
                        ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-50 shadow-xs font-bold'
                        : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
                    }`}
                  >
                    <Laptop size={12} />
                    Auto
                  </button>
                </div>
              </div>

              {/* Status & CTA */}
              <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-stone-600 dark:text-stone-400">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isGemini ? 'bg-emerald-500 animate-pulse' : 'bg-stone-400'
                    }`}
                  />
                  <span>{isGemini ? 'Gemini AI Active' : 'Local Demo Active'}</span>
                </div>

                <button
                  type="button"
                  onClick={() => handleViewSelect('checker')}
                  className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 rounded-lg hover:bg-teal-700 shadow-xs"
                >
                  Scan AI Text
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
