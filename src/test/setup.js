import '@testing-library/jest-dom';

// Mock window.matchMedia for JSDOM environment
if (typeof window !== 'undefined' && !window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

// Mock window.scrollTo
if (typeof window !== 'undefined' && !window.scrollTo) {
  window.scrollTo = () => {};
}

// Mock navigator.clipboard if not present in JSDOM
if (typeof navigator !== 'undefined' && !navigator.clipboard) {
  Object.defineProperty(navigator, 'clipboard', {
    writable: true,
    value: {
      writeText: async () => {},
      readText: async () => '',
    },
  });
}
