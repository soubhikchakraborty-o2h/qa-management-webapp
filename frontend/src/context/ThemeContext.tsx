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
    '--qa-bg':          '#050508',
    '--qa-surface':     '#0c0c12',
    '--qa-card':        '#111118',
    '--qa-card-hover':  '#14141d',
    '--qa-border':      'rgba(124,106,247,0.18)',
    '--qa-border-lt':   'rgba(255,255,255,0.06)',
    '--qa-border-foc':  'rgba(255,255,255,0.06)',
    '--qa-text':        '#ffffff',
    '--qa-text-mid':    '#a0a0a0',
    '--qa-text-faint':  '#6b7280',
    '--qa-text-xfaint': '#3a3a5a',
    '--qa-sidebar':     '#07070d',
    '--qa-sidebar-bdr': '#111118',
    '--qa-nav-active':  'rgba(124,106,247,0.06)',
    '--qa-nav-act-bdr': 'rgba(124,106,247,0.22)',
    '--qa-input':       '#0a0a10',
    '--qa-select-bg':   'rgba(10,10,22,0.95)',
    '--qa-modal':       '#0e0e16',
    '--qa-accent-dim':  'rgba(124,106,247,0.12)',
    '--qa-green-dim':   '#052d1a',
    '--qa-yellow-dim':  '#1c1500',
    '--qa-red-dim':     '#200a0a',
    '--qa-blue-dim':    '#061528',
    '--qa-purple-dim':  '#1a0a2e',
    '--qa-canvas-bg':   '#050508',
    '--qa-dot-grid':    'rgba(255,255,255,0.07)',
    '--qa-particle':    'rgba(255,255,255,VAL)',
    '--qa-scroll-thumb':'#252535',
    '--qa-shadow':      '0 8px 30px rgba(0,0,0,0.5)',
    '--qa-glass':       'rgba(17,17,24,0.65)',
    '--qa-accent':      '#7c6af7',
    '--qa-accent-glow': 'rgba(124,106,247,0.45)',
  },
  light: {
    '--qa-bg':          '#fafbfc',
    '--qa-surface':     '#f3f4f6',
    '--qa-card':        '#ffffff',
    '--qa-card-hover':  '#fafbfc',
    '--qa-border':      'rgba(124,106,247,0.22)',
    '--qa-border-lt':   'rgba(17,24,39,0.08)',
    '--qa-border-foc':  'rgba(17,24,39,0.06)',
    '--qa-text':        '#111827',
    '--qa-text-mid':    '#4b5563',
    '--qa-text-faint':  '#9ca3af',
    '--qa-text-xfaint': '#9ca3af',
    '--qa-sidebar':     '#ffffff',
    '--qa-sidebar-bdr': '#e2e2ef',
    '--qa-nav-active':  'rgba(124,106,247,0.06)',
    '--qa-nav-act-bdr': 'rgba(124,106,247,0.22)',
    '--qa-input':       '#ffffff',
    '--qa-select-bg':   '#f7f7fd',
    '--qa-modal':       '#ffffff',
    '--qa-accent-dim':  'rgba(124,106,247,0.12)',
    '--qa-green-dim':   '#d1fae5',
    '--qa-yellow-dim':  '#fef3c7',
    '--qa-red-dim':     '#fee2e2',
    '--qa-blue-dim':    '#dbeafe',
    '--qa-purple-dim':  '#f3e8ff',
    '--qa-canvas-bg':   '#fafbfc',
    '--qa-dot-grid':    'rgba(0,0,0,0.04)',
    '--qa-particle':    'rgba(100,100,150,VAL)',
    '--qa-scroll-thumb':'#c0c0d8',
    '--qa-shadow':      '0 8px 30px rgba(17,24,39,0.08)',
    '--qa-glass':       'rgba(255,255,255,0.75)',
    '--qa-accent':      '#7c6af7',
    '--qa-accent-glow': 'rgba(124,106,247,0.45)',
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
