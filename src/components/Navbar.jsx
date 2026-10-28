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
import { useTheme } from '../utils/theme.js';
import EngineStatusBadge from './EngineStatusBadge.jsx';

export default function Navbar({ currentView, onSelectView }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { theme, effectiveTheme, setTheme } = useTheme();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
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
          ? 'bg-white/95 dark:bg-[#14171f]/95 backdrop-blur-md shadow-sm border-b border-slate-200/80 dark:border-[#222734]'
          : 'bg-white/90 dark:bg-[#14171f]/90 backdrop-blur-sm border-b border-slate-200/50 dark:border-[#222734]/60'
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
          className="flex items-center gap-2.5 group text-left cursor-pointer shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4fa3a8] rounded-lg p-1"
          aria-label="Lexora – return to Writing Studio"
        >
          <img
            src="/icon-light.png"
            alt="Lexora Logo"
            className="w-8 h-8 rounded-lg object-contain shadow-xs border border-slate-200 dark:hidden group-hover:scale-105 transition-transform bg-white"
          />
          <img
            src="/icon-dark.png"
            alt="Lexora Logo"
            className="w-8 h-8 rounded-lg object-contain shadow-xs border border-[#4fa3a8]/30 hidden dark:block group-hover:scale-105 transition-transform bg-[#121417]"
          />
          <span className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Lexora
          </span>
          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-[#286468] dark:text-[#74b6ba] bg-[#eef6f7] dark:bg-[#142226] px-2 py-0.5 rounded-full border border-[#c4e1e3] dark:border-[#224448]">
            <Sparkle size={10} className="text-[#2c6e73] dark:text-[#5eaeb3]" />
            Suite
          </span>
        </button>

        {/* Desktop Suite View Tabs (Segmented pill with gliding motion indicator) */}
        <div className="hidden md:flex items-center bg-slate-100/90 dark:bg-[#1c202a] p-1 rounded-xl border border-slate-200/80 dark:border-[#262c3b] shadow-inner shrink-0 relative">
          {SUITE_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentView === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleViewSelect(tab.id)}
                className={`relative px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors duration-150 flex items-center gap-1.5 cursor-pointer whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4fa3a8] focus-visible:ring-offset-1 select-none ${
                  isActive
                    ? 'text-slate-900 dark:text-white font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-[#202532]/60'
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="navbar-active-suite-tab"
                    className="absolute inset-0 bg-white dark:bg-[#252c3a] rounded-lg shadow-xs border border-slate-200/90 dark:border-[#353e50]/80 z-0"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  <Icon
                    size={14}
                    className={
                      isActive
                        ? 'text-[#2c6e73] dark:text-[#5eaeb3]'
                        : 'text-slate-400 dark:text-slate-500'
                    }
                  />
                  <span className="hidden lg:inline">{tab.label}</span>
                  <span className="inline lg:hidden">{tab.shortLabel}</span>
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2c6e73] dark:bg-[#5eaeb3] shrink-0" />
                  )}
                </span>
              </button>
            );
          })}
        </div>

        {/* Desktop Actions: AI Telemetry Status Badge, Theme Toggle, Smart CTA */}
        <div className="hidden md:flex items-center gap-2.5 shrink-0">
          <EngineStatusBadge />

          {/* Theme Toggle Button with micro-rotation */}
          <button
            type="button"
            onClick={cycleTheme}
            className="group p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-[#1c202a] hover:bg-slate-200 dark:hover:bg-[#252c3a] rounded-xl border border-slate-200/80 dark:border-[#262c3b] transition-all hover:scale-105 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4fa3a8] cursor-pointer"
            title={`Theme: ${theme} (${effectiveTheme}). Click to cycle.`}
            aria-label={`Current theme is ${theme}. Click to switch theme.`}
          >
            {theme === 'dark' ? (
              <Moon size={15} className="text-[#5eaeb3] transition-transform duration-300 group-hover:-rotate-12" />
            ) : theme === 'light' ? (
              <Sun size={15} className="text-amber-500 transition-transform duration-300 group-hover:rotate-45" />
            ) : (
              <Laptop size={15} className="text-[#2c6e73] dark:text-[#5eaeb3] transition-transform duration-300 group-hover:scale-110" />
            )}
          </button>

          {/* Contextual Suite CTA Button */}
          <button
            type="button"
            onClick={() => {
              if (currentView === 'studio') handleViewSelect('checker');
              else if (currentView === 'checker') handleViewSelect('academic');
              else if (currentView === 'academic') handleViewSelect('lab');
              else handleViewSelect('studio');
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#2c6e73] hover:bg-[#23585c] dark:bg-[#38858a] dark:hover:bg-[#459da2] rounded-lg shadow-xs transition-all hover:shadow hover:scale-[1.02] active:scale-[0.98] cursor-pointer whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4fa3a8] focus-visible:ring-offset-2"
          >
            {currentView === 'studio' ? (
              <>
                <ShieldAlert size={13} />
                Check AI Text
              </>
            ) : currentView === 'checker' ? (
              <>
                <BookOpen size={13} />
                Academic Polish
              </>
            ) : currentView === 'academic' ? (
              <>
                <FlaskConical size={13} />
                Research Lab
              </>
            ) : (
              <>
                <Sparkles size={13} />
                Open Studio
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
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-[#1c202a] hover:bg-slate-200 dark:hover:bg-[#252c3a] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4fa3a8]"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Moon size={18} className="text-[#5eaeb3]" />
            ) : theme === 'light' ? (
              <Sun size={18} className="text-amber-500" />
            ) : (
              <Laptop size={18} className="text-[#2c6e73] dark:text-[#5eaeb3]" />
            )}
          </button>

          <button
            className="p-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1c202a] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4fa3a8] cursor-pointer"
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
            className="md:hidden bg-white dark:bg-[#14171f] border-b border-slate-200 dark:border-[#222734] shadow-lg overflow-hidden"
          >
            <div className="px-4 py-4 space-y-4">
              {/* Suite Tools Section */}
              <div>
                <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2 mb-2">
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
                            ? 'bg-[#eef6f7] dark:bg-[#192428] text-[#1c4b4f] dark:text-[#a0dfe4] border border-[#a2d0d3]/80 dark:border-[#224448] shadow-xs'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1a1e27]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon size={18} className={isActive ? 'text-[#38858a] dark:text-[#4fa3a8]' : 'text-slate-400 dark:text-slate-500'} />
                          <span>{tab.label}</span>
                        </div>
                        {isActive ? (
                          <span className="text-[11px] font-bold text-[#23585c] dark:text-[#74b6ba] bg-[#deeff1] dark:bg-[#1c3238] px-2 py-0.5 rounded-md">
                            Active
                          </span>
                        ) : (
                          <ChevronRight size={16} className="text-slate-300 dark:text-slate-600" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Studio On-Page Anchor Links (when on studio) */}
              {currentView === 'studio' && (
                <div className="pt-2 border-t border-slate-100 dark:border-[#222734]">
                  <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2 mb-2">
                    Studio Sections
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-xs">
                    {STUDIO_SECTIONS.map((link) => (
                      <a
                        key={link.href}
                        href={link.href}
                        onClick={() => setMenuOpen(false)}
                        className="px-3 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:text-[#38858a] dark:hover:text-[#4fa3a8] hover:bg-slate-50 dark:hover:bg-[#1a1e27] font-medium"
                      >
                        {link.label}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Mobile Theme Switcher Row */}
              <div className="pt-3 border-t border-slate-100 dark:border-[#222734] flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Theme Appearance
                </span>
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#1c202a] p-1 rounded-lg border border-slate-200 dark:border-[#262c3b]">
                  <button
                    type="button"
                    onClick={() => setTheme('light')}
                    className={`px-2.5 py-1 text-xs rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                      theme === 'light'
                        ? 'bg-white dark:bg-[#252c3a] text-slate-900 dark:text-slate-50 shadow-xs font-bold'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
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
                        ? 'bg-white dark:bg-[#252c3a] text-slate-900 dark:text-slate-50 shadow-xs font-bold'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    <Moon size={12} className={theme === 'dark' ? 'text-[#4fa3a8]' : ''} />
                    Dark
                  </button>
                  <button
                    type="button"
                    onClick={() => setTheme('system')}
                    className={`px-2.5 py-1 text-xs rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                      theme === 'system'
                        ? 'bg-white dark:bg-[#252c3a] text-slate-900 dark:text-slate-50 shadow-xs font-bold'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    <Laptop size={12} />
                    Auto
                  </button>
                </div>
              </div>

              {/* Status & CTA */}
              <div className="pt-3 border-t border-slate-100 dark:border-[#222734] flex items-center justify-between gap-2">
                <EngineStatusBadge />

                <button
                  type="button"
                  onClick={() => handleViewSelect('checker')}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#2c6e73] hover:bg-[#23585c] dark:bg-[#38858a] dark:hover:bg-[#459da2] rounded-lg shadow-xs cursor-pointer transition-colors"
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
