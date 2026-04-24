import { useState, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { C } from '../../lib/constants';

// ── GCard ─────────────────────────────────────────────────────
export function GCard({ children, style, glow, onClick, hover }: {
  children: ReactNode; style?: any; glow?: string; onClick?: () => void; hover?: boolean;
}) {
  const [h, setH] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => hover && setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        background: 'var(--qa-card)',
        border: `1px solid ${h && glow ? glow + '35' : C.border}`,
        borderRadius: '12px',
        boxShadow: h && glow
          ? `0 1px 3px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.03), 0 8px 32px ${glow}18`
          : '0 1px 3px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.02)',
        transform: h && onClick ? 'translateY(-2px)' : 'none',
        transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
        cursor: onClick ? 'pointer' : 'default',
        ...style,
      }}
    >{children}</div>
  );
}

// ── Chip ──────────────────────────────────────────────────────
export function Chip({ text, color = C.textDim, sm }: { text: string; color?: string; sm?: boolean }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      background: color + '12',
      border: `1px solid ${color}30`,
      color,
      borderRadius: '5px',
      padding: sm ? '2px 6px' : '3px 10px',
      fontSize: sm ? '10px' : '11px',
      fontWeight: '600',
      fontFamily: "'JetBrains Mono', monospace",
      whiteSpace: 'nowrap',
      letterSpacing: '0.02em',
    }}>{text}</span>
  );
}

// ── Btn ───────────────────────────────────────────────────────
type BtnVariant = 'primary' | 'ghost' | 'danger' | 'purple' | 'green' | 'yellow';
export function Btn({ children, onClick, v = 'primary', sm, icon, style: s, disabled }: {
  children: ReactNode; onClick?: () => void; v?: BtnVariant;
  sm?: boolean; icon?: string; style?: any; disabled?: boolean;
}) {
  const [h, setH] = useState(false);

  const styles: Record<BtnVariant, any> = {
    primary: {
      background: h ? 'linear-gradient(135deg,#9d8ff9,#7c6af7)' : 'linear-gradient(135deg,#7c6af7,#6a5ae0)',
      border: 'none',
      color: '#ffffff',
      boxShadow: h
        ? '0 4px 12px rgba(124,106,247,0.4), inset 0 1px 0 rgba(255,255,255,0.15)'
        : '0 1px 3px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
      transform: h ? 'translateY(-1px)' : 'none',
    },
    ghost: {
      background: h ? 'rgba(124,106,247,0.06)' : 'transparent',
      border: `1px solid ${h ? 'var(--qa-border-foc)' : 'var(--qa-border-lt)'}`,
      color: h ? C.text : C.textMid,
      boxShadow: 'none',
      transform: 'none',
    },
    danger: {
      background: h ? 'rgba(248,113,113,0.2)' : 'rgba(248,113,113,0.1)',
      border: '1px solid rgba(248,113,113,0.3)',
      color: '#f87171',
      boxShadow: 'none',
      transform: h ? 'translateY(-1px)' : 'none',
    },
    purple: {
      background: h ? 'rgba(192,132,252,0.2)' : 'rgba(192,132,252,0.1)',
      border: `1px solid rgba(192,132,252,0.3)`,
      color: C.purple,
      boxShadow: 'none',
      transform: h ? 'translateY(-1px)' : 'none',
    },
    green: {
      background: h ? 'rgba(52,211,153,0.2)' : 'rgba(52,211,153,0.1)',
      border: `1px solid rgba(52,211,153,0.3)`,
      color: C.green,
      boxShadow: 'none',
      transform: h ? 'translateY(-1px)' : 'none',
    },
    yellow: {
      background: h ? 'rgba(251,191,36,0.2)' : 'rgba(251,191,36,0.1)',
      border: `1px solid rgba(251,191,36,0.3)`,
      color: C.yellow,
      boxShadow: 'none',
      transform: h ? 'translateY(-1px)' : 'none',
    },
  };

  const t = styles[v];
  return (
    <button
      onClick={onClick} disabled={disabled}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        ...t,
        borderRadius: '8px',
        padding: sm ? '5px 11px' : '8px 16px',
        fontSize: sm ? '11px' : '12px',
        fontWeight: '600',
        fontFamily: "'JetBrains Mono', monospace",
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        whiteSpace: 'nowrap',
        transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
        opacity: disabled ? 0.45 : 1,
        ...s,
      }}
    >
      {icon && <span style={{ fontSize: sm ? '11px' : '13px' }}>{icon}</span>}
      {children}
    </button>
  );
}

// ── Modal ─────────────────────────────────────────────────────
export function Modal({ title, children, onClose, wide }: {
  title: string; children: ReactNode; onClose: () => void; wide?: boolean;
}) {
  return createPortal(
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(8px)',
        padding: '20px',
      }}
    >
      <div
        className="fu"
        style={{
          background: 'var(--qa-modal)',
          border: `1px solid ${C.border}`,
          borderRadius: '14px',
          width: '100%',
          maxWidth: wide ? '820px' : '520px',
          maxHeight: 'calc(100vh - 40px)',
          overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 25px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(124,106,247,0.1)',
        }}
      >
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '16px 22px',
          borderBottom: `1px solid ${C.border}`,
          background: 'rgba(124,106,247,0.03)',
          borderRadius: '14px 14px 0 0',
        }}>
          <h3 style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: C.text, fontFamily: "'JetBrains Mono',monospace", letterSpacing: '-0.2px' }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'rgba(124,106,247,0.06)', border: `1px solid ${C.border}`, color: C.textMid, cursor: 'pointer', fontSize: '12px', borderRadius: '6px', width: '26px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}>✕</button>
        </div>
        <div style={{ padding: '22px', overflowY: 'auto', flex: 1 }}>{children}</div>
      </div>
    </div>,
    document.body
  );
}

// ── ConfirmDeleteModal ────────────────────────────────────────
export function ConfirmDeleteModal({ message, onConfirm, onCancel, isPending }: {
  message?: string; onConfirm: () => void; onCancel: () => void; isPending?: boolean;
}) {
  return createPortal(
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '20px' }}>
      <div className="fu" style={{ background: 'var(--qa-modal)', border: `1px solid ${C.border}`, borderRadius: '16px', padding: '32px 28px', maxWidth: '400px', width: '100%', textAlign: 'center', boxShadow: '0 25px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(239,68,68,0.15)' }}>
        <div style={{ fontSize: '36px', marginBottom: '14px' }}>🗑</div>
        <div style={{ fontSize: '14px', fontWeight: '700', color: C.text, fontFamily: "'JetBrains Mono',monospace", marginBottom: '8px' }}>Delete Confirmation</div>
        <div style={{ fontSize: '12px', color: C.textMid, fontFamily: "'JetBrains Mono',monospace", marginBottom: '24px', lineHeight: '1.7' }}>{message || 'Are you sure? This cannot be undone.'}</div>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <Btn v="ghost" onClick={onCancel} disabled={isPending}>Cancel</Btn>
          <Btn v="danger" onClick={onConfirm} disabled={isPending}>{isPending ? 'Deleting…' : 'Delete'}</Btn>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── Inp ───────────────────────────────────────────────────────
export function Inp({ label, ph, value, onChange, onKeyDown, type = 'text', req, eye, area }: {
  label?: string; ph?: string; value?: string; onChange?: (v: string) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  type?: string; req?: boolean; eye?: boolean; area?: boolean;
}) {
  const [show, setShow] = useState(false);
  const [focused, setFocused] = useState(false);
  const base: any = {
    width: '100%',
    background: 'var(--qa-input)',
    border: `1px solid ${focused ? C.borderFocus : C.border}`,
    borderRadius: '8px',
    padding: '9px 12px',
    color: C.text,
    fontSize: '13px',
    fontFamily: "'JetBrains Mono', monospace",
    outline: 'none',
    transition: 'border-color 0.15s, box-shadow 0.15s',
    boxShadow: focused ? '0 0 0 3px rgba(124,106,247,0.1)' : 'none',
  };
  return (
    <div style={{ marginBottom: '14px' }}>
      {label && (
        <label style={{ display: 'block', fontSize: '10px', fontWeight: '600', color: C.textMid, marginBottom: '6px', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '.08em', textTransform: 'uppercase' }}>
          {label}{req && <span style={{ color: C.red }}> *</span>}
        </label>
      )}
      {area
        ? <textarea rows={3} placeholder={ph} value={value ?? ''} onChange={e => onChange?.(e.target.value)} onKeyDown={onKeyDown} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} style={base} />
        : <div style={{ position: 'relative' }}>
            <input
              type={eye ? (show ? 'text' : 'password') : type}
              placeholder={ph} value={value ?? ''} onChange={e => onChange?.(e.target.value)}
              onKeyDown={onKeyDown}
              onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
              style={{ ...base, paddingRight: eye ? '38px' : '12px' }}
            />
            {eye && (
              <button type="button" onClick={() => setShow(!show)} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: show ? C.accent : C.textDim, fontSize: '15px', display: 'flex', alignItems: 'center', padding: 0 }}>
                {show ? '🙈' : '👁'}
              </button>
            )}
          </div>
      }
    </div>
  );
}

// ── Sel ───────────────────────────────────────────────────────
export function Sel({ label, opts, value, onChange }: {
  label?: string; opts: Array<string | { v: string; l: string }>;
  value?: string; onChange?: (v: string) => void;
}) {
  return (
    <div style={{ marginBottom: '14px' }}>
      {label && <label style={{ display: 'block', fontSize: '10px', fontWeight: '600', color: C.textMid, marginBottom: '6px', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '.08em', textTransform: 'uppercase' }}>{label}</label>}
      <select value={value ?? ''} onChange={e => onChange?.(e.target.value)} style={{ width: '100%', background: 'var(--qa-input)', border: `1px solid ${C.border}`, borderRadius: '8px', padding: '9px 12px', color: C.text, fontSize: '13px', fontFamily: "'JetBrains Mono', monospace", outline: 'none', cursor: 'pointer' }}>
        {opts.map(o => {
          const val = typeof o === 'string' ? o : o.v;
          const lbl = typeof o === 'string' ? o : o.l;
          return <option key={val} value={val}>{lbl}</option>;
        })}
      </select>
    </div>
  );
}
