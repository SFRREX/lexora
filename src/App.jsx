import { useState, useEffect, lazy, Suspense } from 'react';
import Navbar from './components/Navbar.jsx';
import Hero from './components/Hero.jsx';
import WritingEditor from './components/WritingEditor.jsx';
import WordEnhancer from './components/WordEnhancer.jsx';
import Features from './components/Features.jsx';
import HowItWorks from './components/HowItWorks.jsx';
import BeforeAfter from './components/BeforeAfter.jsx';
import UseCases from './components/UseCases.jsx';
import FAQ from './components/FAQ.jsx';
import FinalCTA from './components/FinalCTA.jsx';
import Footer from './components/Footer.jsx';

// Dynamic code splitting for complex standalone modules
const AIChecker = lazy(() => import('./components/AIChecker.jsx'));
const AcademicRefiner = lazy(() => import('./components/AcademicRefiner.jsx'));
const DetectorResearchLab = lazy(() => import('./components/DetectorResearchLab.jsx'));

function ViewLoadingSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 animate-pulse">
      <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-xl w-64 mb-3" />
      <div className="h-4 bg-slate-200/80 dark:bg-slate-800/80 rounded w-96 mb-8" />
      <div className="h-96 bg-white dark:bg-[#14171f] rounded-3xl border border-slate-200 dark:border-[#222734] p-8 shadow-xs" />
    </div>
  );
}

export default function App() {
  const [currentView, setCurrentView] = useState('studio'); // 'studio' | 'checker' | 'academic' | 'lab'

  // Sync with URL hash or pathname on initial load and hashchange
  useEffect(() => {
    function parseRoute() {
      const hash = window.location.hash.toLowerCase();
      const path = window.location.pathname.toLowerCase();

      if (hash.includes('ai-checker') || path.includes('ai-checker')) {
        setCurrentView('checker');
      } else if (hash.includes('academic') || path.includes('academic')) {
        setCurrentView('academic');
      } else if (hash.includes('detector-lab') || hash.includes('research') || path.includes('detector-lab')) {
        setCurrentView('lab');
      } else {
        setCurrentView('studio');
        if (hash && hash !== '#studio' && hash !== '#top') {
          setTimeout(() => {
            try {
              const targetEl = document.querySelector(hash);
              if (targetEl) {
                targetEl.scrollIntoView({ behavior: 'smooth' });
              }
            } catch {
              // Ignore invalid selector
            }
          }, 80);
        }
      }
    }

    parseRoute();
    window.addEventListener('hashchange', parseRoute);
    return () => window.removeEventListener('hashchange', parseRoute);
  }, []);

  function handleSelectView(viewId) {
    setCurrentView(viewId);
    if (viewId === 'studio') {
      window.location.hash = '#studio';
    } else if (viewId === 'checker') {
      window.location.hash = '#ai-checker';
    } else if (viewId === 'academic') {
      window.location.hash = '#academic-refiner';
    } else if (viewId === 'lab') {
      window.location.hash = '#detector-lab';
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0f1115] text-slate-900 dark:text-slate-100 antialiased flex flex-col justify-between transition-colors duration-250">
      <Navbar currentView={currentView} onSelectView={handleSelectView} />
      <main className="pt-16 grow">
        {currentView === 'studio' && (
          <>
            <Hero onSelectView={handleSelectView} />
            <WritingEditor onSelectView={handleSelectView} />
            <WordEnhancer />
            <Features />
            <HowItWorks />
            <BeforeAfter onSelectView={handleSelectView} />
            <UseCases />
            <FAQ />
            <FinalCTA onSelectView={handleSelectView} />
          </>
        )}

        {currentView === 'checker' && (
          <Suspense fallback={<ViewLoadingSkeleton />}>
            <AIChecker onSelectView={handleSelectView} />
          </Suspense>
        )}

        {currentView === 'academic' && (
          <Suspense fallback={<ViewLoadingSkeleton />}>
            <AcademicRefiner onSelectView={handleSelectView} />
          </Suspense>
        )}

        {currentView === 'lab' && (
          <Suspense fallback={<ViewLoadingSkeleton />}>
            <DetectorResearchLab onSelectView={handleSelectView} />
          </Suspense>
        )}
      </main>
      <Footer onSelectView={handleSelectView} />
    </div>
  );
}
