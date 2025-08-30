import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { themeManager } from '../utils/theme';

interface ThemeToggleProps {
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '' }) => {
  const [isDark, setIsDark] = React.useState(themeManager.getCurrentTheme() === 'dark');

  const toggleTheme = () => {
    const newTheme = themeManager.toggleTheme();
    setIsDark(newTheme === 'dark');
  };

  return (
    <button
      onClick={toggleTheme}
      className={`
        p-2 rounded-lg transition-all duration-200
        bg-theme-bg-secondary border border-theme-border
        text-theme-text-secondary hover:text-theme-text-primary
        hover:bg-theme-bg-primary hover:scale-105
        focus:outline-none focus:ring-2 focus:ring-theme-accent focus:ring-opacity-20
        ${className}
      `}
      aria-label="Toggle theme"
    >
      {isDark ? (
        <Sun className="w-4 h-4" />
      ) : (
        <Moon className="w-4 h-4" />
      )}
    </button>
  );
};