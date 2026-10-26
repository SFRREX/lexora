import { useState, useEffect } from 'react';
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
import AIChecker from './components/AIChecker.jsx';
import AcademicRefiner from './components/AcademicRefiner.jsx';
import DetectorResearchLab from './components/DetectorResearchLab.jsx';

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
    <div className="min-h-screen bg-[#fafaf9] dark:bg-[#0c0a09] text-stone-900 dark:text-stone-100 antialiased flex flex-col justify-between transition-colors duration-250">
      <Navbar currentView={currentView} onSelectView={handleSelectView} />
      <main className="pt-16 flex-grow">
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

        {currentView === 'checker' && <AIChecker onSelectView={handleSelectView} />}

        {currentView === 'academic' && <AcademicRefiner onSelectView={handleSelectView} />}

        {currentView === 'lab' && <DetectorResearchLab onSelectView={handleSelectView} />}
      </main>
      <Footer onSelectView={handleSelectView} />
    </div>
  );
}
