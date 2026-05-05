import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'dark' | 'light';

interface ThemeCtx {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeCtx>(null!);
export const useTheme = () => useContext(ThemeContext);

const VARS: Record<Theme, Record<string, string>> = {
  dark: {
    '--qa-bg':          '#0a0f1c',
    '--qa-surface':     '#0d1525',
    '--qa-card':        '#141e30',
    '--qa-card-hover':  '#1a2540',
    '--qa-border':      'rgba(59,130,246,0.2)',
    '--qa-border-lt':   'rgba(255,255,255,0.06)',
    '--qa-border-foc':  'rgba(59,130,246,0.3)',
    '--qa-text':        '#f0f4ff',
    '--qa-text-mid':    '#8899bb',
    '--qa-text-faint':  '#4a5a7a',
    '--qa-text-xfaint': '#2a3550',
    '--qa-sidebar':     '#0d1525',
    '--qa-sidebar-bdr': '#141e30',
    '--qa-nav-active':  'rgba(59,130,246,0.12)',
    '--qa-nav-act-bdr': 'rgba(59,130,246,0.3)',
    '--qa-input':       '#0d1525',
    '--qa-select-bg':   'rgba(13,21,37,0.95)',
    '--qa-modal':       '#141e30',
    '--qa-accent-dim':  'rgba(59,130,246,0.12)',
    '--qa-green-dim':   '#052d1a',
    '--qa-yellow-dim':  '#1c1500',
    '--qa-red-dim':     '#200a0a',
    '--qa-blue-dim':    '#061528',
    '--qa-purple-dim':  '#1a0a2e',
    '--qa-canvas-bg':   '#0a0f1c',
    '--qa-dot-grid':    'rgba(59,130,246,0.08)',
    '--qa-particle':    'rgba(255,255,255,VAL)',
    '--qa-scroll-thumb':'#1e2d4a',
    '--qa-shadow':      '0 8px 32px rgba(0,0,0,0.4)',
    '--qa-glass':       'rgba(13,21,37,0.8)',
    '--qa-accent':      '#3B82F6',
    '--qa-accent-glow': 'rgba(59,130,246,0.4)',
  },
  light: {
    '--qa-bg':          '#EFF6FF',
    '--qa-surface':     '#E0EFFE',
    '--qa-card':        '#FFFFFF',
    '--qa-card-hover':  '#F5F9FF',
    '--qa-border':      'rgba(59,130,246,0.2)',
    '--qa-border-lt':   '#E2EDF8',
    '--qa-border-foc':  'rgba(37,99,235,0.3)',
    '--qa-text':        '#0F172A',
    '--qa-text-mid':    '#475569',
    '--qa-text-faint':  '#94A3B8',
    '--qa-text-xfaint': '#CBD5E1',
    '--qa-sidebar':     '#E0EFFE',
    '--qa-sidebar-bdr': '#C7DDFB',
    '--qa-nav-active':  'rgba(37,99,235,0.08)',
    '--qa-nav-act-bdr': 'rgba(37,99,235,0.25)',
    '--qa-input':       '#FFFFFF',
    '--qa-select-bg':   '#F5F9FF',
    '--qa-modal':       '#FFFFFF',
    '--qa-accent-dim':  'rgba(37,99,235,0.08)',
    '--qa-green-dim':   '#d1fae5',
    '--qa-yellow-dim':  '#fef3c7',
    '--qa-red-dim':     '#fee2e2',
    '--qa-blue-dim':    '#dbeafe',
    '--qa-purple-dim':  '#f3e8ff',
    '--qa-canvas-bg':   '#EFF6FF',
    '--qa-dot-grid':    'rgba(59,130,246,0.06)',
    '--qa-particle':    'rgba(37,99,235,VAL)',
    '--qa-scroll-thumb':'#BFDBFE',
    '--qa-shadow':      '0 4px 20px rgba(15,23,42,0.08)',
    '--qa-glass':       'rgba(255,255,255,0.85)',
    '--qa-accent':      '#2563EB',
    '--qa-accent-glow': 'rgba(37,99,235,0.3)',
  },
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem('qa-theme') as Theme) || 'dark';
  });
  const isDark = theme === 'dark';

  useEffect(() => {
    const root = document.documentElement;
    Object.entries(VARS[theme]).forEach(([k, v]) => root.style.setProperty(k, v));
    root.setAttribute('data-theme', theme);
    localStorage.setItem('qa-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
