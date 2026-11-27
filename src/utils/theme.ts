import { useCallback, useEffect, useState } from 'react';

export type ThemeMode = 'light' | 'dark';
const THEME_KEY = 'pl300_theme';

function currentTheme(): ThemeMode {
  return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
}

/** Theme state; index.html sets the initial value before first paint. */
export function useTheme(): [ThemeMode, () => void] {
  const [theme, setTheme] = useState<ThemeMode>(currentTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', theme === 'light' ? '#f5f1e4' : '#0f1712');
  }, [theme]);

  const toggle = useCallback(() => {
    setTheme((t) => {
      const next = t === 'light' ? 'dark' : 'light';
      try {
        localStorage.setItem(THEME_KEY, next);
      } catch {
        // storage unavailable — theme still applies for this session
      }
      return next;
    });
  }, []);

  return [theme, toggle];
}
