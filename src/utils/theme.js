import { useState, useEffect } from 'react';

const STORAGE_KEY = 'lexora_theme_preference';

/**
 * Resolves whether the system prefers dark mode
 */
export function getSystemPreference() {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Returns saved theme or 'system' default
 */
export function getSavedTheme() {
  if (typeof window === 'undefined') return 'system';
  try {
    const val = localStorage.getItem(STORAGE_KEY);
    if (val === 'light' || val === 'dark' || val === 'system') return val;
  } catch {
    // localStorage may be disabled
  }
  return 'system';
}

/**
 * Computes active applied theme ('light' or 'dark')
 */
export function getEffectiveTheme(preference) {
  if (preference === 'system') {
    return getSystemPreference();
  }
  return preference === 'dark' ? 'dark' : 'light';
}

/**
 * Applies the theme to <html> element and syncs color-scheme
 */
export function applyTheme(preference) {
  if (typeof document === 'undefined') return;

  const effective = getEffectiveTheme(preference);
  const root = document.documentElement;

  if (effective === 'dark') {
    root.classList.add('dark');
    root.style.colorScheme = 'dark';
  } else {
    root.classList.remove('dark');
    root.style.colorScheme = 'light';
  }

  try {
    localStorage.setItem(STORAGE_KEY, preference);
  } catch {
    // ignore
  }

  // Dispatch custom event for cross-component synchrony
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('lexora-theme-change', {
        detail: { preference, effective },
      })
    );
  }
}

/**
 * Custom React hook for theme management
 */
export function useTheme() {
  const [theme, setThemeState] = useState(() => getSavedTheme());
  const [effectiveTheme, setEffectiveTheme] = useState(() =>
    getEffectiveTheme(getSavedTheme())
  );

  useEffect(() => {
    // Apply current on mount
    applyTheme(getSavedTheme());

    // Listen for OS system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = () => {
      const currentPref = getSavedTheme();
      if (currentPref === 'system') {
        applyTheme('system');
        setEffectiveTheme(getSystemPreference());
      }
    };

    mediaQuery.addEventListener('change', handleSystemChange);

    // Listen for cross-component theme change events
    const handleThemeEvent = (e) => {
      if (e.detail) {
        setThemeState((prev) => (prev !== e.detail.preference ? e.detail.preference : prev));
        setEffectiveTheme((prev) => (prev !== e.detail.effective ? e.detail.effective : prev));
      }
    };

    window.addEventListener('lexora-theme-change', handleThemeEvent);

    return () => {
      mediaQuery.removeEventListener('change', handleSystemChange);
      window.removeEventListener('lexora-theme-change', handleThemeEvent);
    };
  }, []);

  function setTheme(newTheme) {
    applyTheme(newTheme);
    setThemeState(newTheme);
    setEffectiveTheme(getEffectiveTheme(newTheme));
  }

  return { theme, effectiveTheme, setTheme };
}
