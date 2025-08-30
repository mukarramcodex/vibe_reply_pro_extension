// Theme management utilities
export const themeManager = {
  getSystemTheme(): 'light' | 'dark' {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  },

  getSavedTheme(): 'light' | 'dark' | null {
    const saved = localStorage.getItem('theme');
    return saved === 'light' || saved === 'dark' ? saved : null;
  },

  getCurrentTheme(): 'light' | 'dark' {
    return this.getSavedTheme() || this.getSystemTheme();
  },

  setTheme(theme: 'light' | 'dark'): void {
    localStorage.setItem('theme', theme);
    this.applyTheme(theme);
  },

  applyTheme(theme: 'light' | 'dark'): void {
    const root = document.documentElement;
    
    if (theme === 'dark') {
      document.body.classList.add('dark');
      root.style.setProperty('--bg-primary', '#000000');
      root.style.setProperty('--bg-secondary', '#111111');
      root.style.setProperty('--text-primary', '#FAFAFA');
      root.style.setProperty('--text-secondary', '#9CA3AF');
      root.style.setProperty('--border', '#374151');
      root.style.setProperty('--shadow', 'rgba(255, 255, 255, 0.1)');
    } else {
      document.body.classList.remove('dark');
      root.style.setProperty('--bg-primary', '#F9FAFB');
      root.style.setProperty('--bg-secondary', '#FFFFFF');
      root.style.setProperty('--text-primary', '#000000');
      root.style.setProperty('--text-secondary', '#6B7280');
      root.style.setProperty('--border', '#E5E7EB');
      root.style.setProperty('--shadow', 'rgba(0, 0, 0, 0.1)');
    }
    
    // Common theme variables
    root.style.setProperty('--accent', '#CC001F');
    root.style.setProperty('--accent-hover', '#A50018');
  },

  toggleTheme(): 'light' | 'dark' {
    const current = this.getCurrentTheme();
    const newTheme = current === 'dark' ? 'light' : 'dark';
    this.setTheme(newTheme);
    return newTheme;
  },

  initTheme(): void {
    const theme = this.getCurrentTheme();
    this.applyTheme(theme);
    
    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!this.getSavedTheme()) {
        this.applyTheme(e.matches ? 'dark' : 'light');
      }
    });
  }
};