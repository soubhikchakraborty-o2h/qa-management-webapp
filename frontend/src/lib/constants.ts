export const C = {
  bg:          'var(--qa-bg)',
  surface:     'var(--qa-surface)',
  card:        'var(--qa-card)',
  cardHover:   'var(--qa-card-hover)',
  border:      'var(--qa-border)',
  borderLight: 'var(--qa-border-lt)',
  borderFocus: 'var(--qa-border-foc)',
  accent:      '#7c6af7',
  accentBright:'#9d8ff9',
  accentDim:   'var(--qa-accent-dim)',
  accentGlow:  'rgba(124,106,247,0.15)',
  green:       '#10b981',
  greenDim:    'var(--qa-green-dim)',
  yellow:      '#f59e0b',
  yellowDim:   'var(--qa-yellow-dim)',
  red:         '#ef4444',
  redDim:      'var(--qa-red-dim)',
  blue:        '#3b82f6',
  blueDim:     'var(--qa-blue-dim)',
  pink:        '#f472b6',
  purple:      '#c084fc',
  purpleDim:   'var(--qa-purple-dim)',
  orange:      '#f97316',
  text:        'var(--qa-text)',
  textMid:     'var(--qa-text-mid)',
  // Keep as hex — used in hex-opacity concatenation (e.g. color + '12') inside Chip
  textDim:     '#6b7280',
  white:       '#ffffff',
};

export const STATUS_COLORS: Record<string, string> = {
  'Open': '#ef4444', 'In Progress': '#f59e0b', 'Fixed': '#10b981',
  'Closed': '#6b7280', "Won't Fix": '#8b5cf6',
  'To Test': '#f59e0b', 'In Test': '#3b82f6', 'Done': '#10b981',
  'Reopen': '#f97316', 'No Action': '#6b7280',
  'active': '#10b981', 'in_review': '#f59e0b', 'completed': '#6b7280', 'on_hold': '#f97316',
  'Pass': '#10b981', 'Fail': '#ef4444', 'Blocked': '#f97316', 'N/A': '#6b7280',
  'Not Executed': '#6b7280', 'Executed': '#7c6af7',
};

export const PRIORITY_COLORS: Record<string, string> = {
  Critical: '#ef4444', High: '#f97316', Medium: '#eab308', Low: '#3b82f6',
};

export const QA_STATUS_COLORS: Record<string, string> = {
  'Open': '#ef4444', 'To Test': '#f59e0b', 'In Test': '#3b82f6',
  'Done': '#10b981', 'Reopen': '#f97316', 'No Action': '#6b7280',
};

export const LABELS = ['Smoke', 'Regression', 'Sanity', 'Integration', 'E2E'] as const;
export type Label = typeof LABELS[number];

export const LABEL_COLORS: Record<string, string> = {
  'Smoke':       '#7c6af7',
  'Regression':  '#7c6af7',
  'Sanity':      '#14b8a6',
  'Integration': '#f59e0b',
  'E2E':         '#3b82f6',
};

export const PLATFORMS = ['Web', 'Android', 'iOS', 'Both'] as const;
export type Platform = typeof PLATFORMS[number];

export const PLATFORM_COLORS: Record<string, string> = {
  'Web':     '#6b7280',
  'Android': '#10b981',
  'iOS':     '#3b82f6',
  'Both':    '#7c6af7',
};

export const TEST_RESULT_COLORS: Record<string, string> = {
  'Pass': '#10b981', 'Fail': '#ef4444', 'Blocked': '#f97316', 'N/A': '#6b7280',
};

export const STATUS_LABELS: Record<string, string> = {
  active: 'Active', in_review: 'In Review', completed: 'Completed', on_hold: 'On Hold',
};

export const APP_TYPE_ICON: Record<string, string> = {
  web: '🌐', mobile: '📱', both: '⚡',
};
