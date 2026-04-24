import { C } from '../../lib/constants';

export const BeetleIcon = ({ size = 48, color }: { size?: number; color: string }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <ellipse cx="24" cy="30" rx="10" ry="12" fill={color} opacity=".92"/>
    <circle cx="24" cy="16" r="6.5" fill={color}/>
    <line x1="24" y1="18" x2="24" y2="40" stroke={C.bg} strokeWidth="1.5" strokeDasharray="2.5 2"/>
    <circle cx="20" cy="27" r="2" fill={C.bg} opacity=".45"/>
    <circle cx="28" cy="27" r="2" fill={C.bg} opacity=".45"/>
    <circle cx="20" cy="34" r="2" fill={C.bg} opacity=".45"/>
    <circle cx="28" cy="34" r="2" fill={C.bg} opacity=".45"/>
    <path d="M21 11 Q15 5 11 3" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <path d="M27 11 Q33 5 37 3" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <circle cx="11" cy="3" r="1.8" fill={color}/>
    <circle cx="37" cy="3" r="1.8" fill={color}/>
    <path d="M15 23 Q8 21 5 19" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
    <path d="M15 29 Q7 29 4 27" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
    <path d="M15 35 Q8 38 6 41" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
    <path d="M33 23 Q40 21 43 19" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
    <path d="M33 29 Q41 29 44 27" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
    <path d="M33 35 Q40 38 42 41" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);

export const DevIcon = ({ size = 48, color }: { size?: number; color: string }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <path d="M19 14L9 24L19 34" stroke={color} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M29 14L39 24L29 34" stroke={color} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M27 9L21 39" stroke={color} strokeWidth="2.5" strokeLinecap="round" opacity=".6"/>
  </svg>
);

export const AdminBadge = () => (
  <div style={{ position: 'absolute', top: '8px', right: '8px', background: `${C.yellow}20`, border: `1px solid ${C.yellow}55`, borderRadius: '5px', padding: '2px 6px', display: 'flex', alignItems: 'center', gap: '2px' }}>
    <svg width="11" height="11" viewBox="0 0 14 14" fill="none">
      <path d="M3 4L1 7L3 10" stroke={C.yellow} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M11 4L13 7L11 10" stroke={C.yellow} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9 2L5 12" stroke={C.yellow} strokeWidth="1.5" strokeLinecap="round" opacity=".7"/>
    </svg>
    <span style={{ fontSize: '9px', color: C.yellow, fontFamily: "'JetBrains Mono', monospace", fontWeight: '700' }}>ADM</span>
  </div>
);
