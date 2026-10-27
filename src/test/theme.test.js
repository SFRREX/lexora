import { describe, it, expect, beforeEach } from 'vitest';
import {
  getSystemPreference,
  getSavedTheme,
  getEffectiveTheme,
  applyTheme,
} from '../utils/theme.js';

describe('theme utilities', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = '';
  });

  it('returns system preference based on mediaQuery', () => {
    const pref = getSystemPreference();
    expect(['light', 'dark']).toContain(pref);
  });

  it('reads saved theme or defaults to system', () => {
    expect(getSavedTheme()).toBe('system');
    localStorage.setItem('lexora_theme_preference', 'dark');
    expect(getSavedTheme()).toBe('dark');
  });

  it('computes effective theme correctly', () => {
    expect(getEffectiveTheme('dark')).toBe('dark');
    expect(getEffectiveTheme('light')).toBe('light');
    expect(['light', 'dark']).toContain(getEffectiveTheme('system'));
  });

  it('applies dark theme to document root', () => {
    applyTheme('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.style.colorScheme).toBe('dark');
    expect(localStorage.getItem('lexora_theme_preference')).toBe('dark');
  });

  it('applies light theme to document root', () => {
    applyTheme('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(document.documentElement.style.colorScheme).toBe('light');
    expect(localStorage.getItem('lexora_theme_preference')).toBe('light');
  });
});
