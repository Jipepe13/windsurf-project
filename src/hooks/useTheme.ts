import { useState, useEffect } from 'react';

type Theme = 'light' | 'dark' | 'system';

export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem('theme') as Theme;
    return savedTheme || 'system';
  });

  useEffect(() => {
    const updateTheme = (newTheme: Theme) => {
      const root = document.documentElement;
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      
      const effectiveTheme = newTheme === 'system'
        ? (prefersDark ? 'dark' : 'light')
        : newTheme;

      root.setAttribute('data-theme', effectiveTheme);
      localStorage.setItem('theme', newTheme);
    };

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') {
        updateTheme('system');
      }
    };

    updateTheme(theme);
    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [theme]);

  return { theme, setTheme };
};

export default useTheme;
