import { useState } from 'react';
import { C } from '../lib/constants';
import AnimBg from '../components/ui/AnimBg';
import { GCard, Btn, Inp, Modal } from '../components/ui/index';
import { BeetleIcon, DevIcon, AdminBadge } from '../components/ui/Icons';
import { useAuth } from '../context/AuthContext';

// ── LANDING ───────────────────────────────────────────────────
export function Landing({ onChoose }: { onChoose: (role: 'qa' | 'developer') => void }) {
  const [hov, setHov] = useState<string | null>(null);
  const [showHRLogin, setShowHRLogin] = useState(false);
  const [hrEmail, setHrEmail] = useState('');
  const [hrPassword, setHrPassword] = useState('');
  const [hrError, setHrError] = useState('');
  const [hrLoading, setHrLoading] = useState(false);
  const { loginAsHR } = useAuth();

  const handleHRLogin = async () => {
    if (!hrEmail || !hrPassword) return;
    setHrLoading(true); setHrError('');
    try {
      await loginAsHR(hrEmail, hrPassword);
      // App.tsx detects user set → navigates to 'app' automatically
    } catch (e: any) {
      setHrError(e.response?.data?.error || 'Invalid credentials');
      setHrLoading(false);
    }
  };

  return (
    <>
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px 120px', position: 'relative', overflow: 'hidden' }}>
        <AnimBg />
        <div className="fu" style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: '11px', letterSpacing: '.22em', color: C.accent, fontFamily: "'JetBrains Mono', monospace", marginBottom: '24px', textTransform: 'uppercase' }}>O2H TECHNOLOGY</div>
          <h1 style={{ fontSize: 'clamp(38px,6vw,62px)', fontWeight: '900', margin: '0 0 40px', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '-2.5px', background: `linear-gradient(150deg,${C.text} 10%,${C.accent} 60%,${C.purple} 100%)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1.05 }}>Quality<br />Analysis</h1>
          <div style={{ display: 'inline-block', padding: '7px 22px', borderRadius: '8px', background: 'var(--qa-card)', border: `1px solid ${C.border}`, marginBottom: '30px' }}>
            <span style={{ fontSize: '13px', color: C.text, fontFamily: "'JetBrains Mono', monospace", fontWeight: '600', letterSpacing: '.05em' }}>— SELECT YOUR ROLE —</span>
          </div>
          <div style={{ display: 'flex', gap: '24px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {([
              { id: 'qa', Icon: BeetleIcon, title: 'QA Engineer', sub: 'Access your projects,\ntest cases & bugs', color: C.accent },
              { id: 'developer', Icon: DevIcon, title: 'Developer', sub: 'View projects, comment on\ntest cases & update bugs', color: C.purple },
            ] as const).map(card => (
              <div key={card.id} onClick={() => onChoose(card.id as any)}
                onMouseEnter={() => setHov(card.id)} onMouseLeave={() => setHov(null)}
                style={{ background: hov === card.id ? `${card.color}0e` : 'var(--qa-card)', backdropFilter: 'blur(28px)', border: `1px solid ${hov === card.id ? card.color + '60' : C.border}`, borderRadius: '22px', padding: '38px 42px', cursor: 'pointer', textAlign: 'center', width: '215px', transition: 'all .28s', transform: hov === card.id ? 'translateY(-6px) scale(1.02)' : 'none', boxShadow: hov === card.id ? `0 24px 70px ${card.color}28, 0 0 0 1px ${card.color}20` : '0 4px 28px rgba(0,0,0,.2)' }}>
                <div style={{ color: card.color, marginBottom: '16px', display: 'flex', justifyContent: 'center' }}><card.Icon size={48} color={card.color} /></div>
                <div style={{ fontSize: '16px', fontWeight: '800', color: C.text, fontFamily: "'JetBrains Mono', monospace", marginBottom: '8px' }}>{card.title}</div>
                <div style={{ fontSize: '11px', color: C.textMid, lineHeight: '1.7', whiteSpace: 'pre-line' }}>{card.sub}</div>
              </div>
            ))}
          </div>
        </div>

        {/* HR login link */}
        <div style={{ position: 'absolute', bottom: '48px', left: '50%', transform: 'translateX(-50%)', zIndex: 2 }}>
          <button
            onClick={() => setShowHRLogin(true)}
            style={{ background: 'none', border: 'none', color: C.textMid, fontFamily: "'JetBrains Mono', monospace", fontSize: '13px', cursor: 'pointer', padding: '8px 16px', borderRadius: '8px', transition: 'all .2s', letterSpacing: '.02em' }}
            onMouseEnter={e => { e.currentTarget.style.color = C.accent; e.currentTarget.style.background = 'rgba(124,106,247,0.08)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = C.textMid; e.currentTarget.style.background = 'none'; }}
          >
            Are you from HR? Login here →
          </button>
        </div>
      </div>

      {showHRLogin && (
        <Modal title="HR Login" onClose={() => { setShowHRLogin(false); setHrError(''); setHrEmail(''); setHrPassword(''); }}>
          <Inp label="Email" ph="your@email.com" type="email" value={hrEmail} onChange={setHrEmail} req />
          <Inp label="Password" ph="Enter password" value={hrPassword} onChange={setHrPassword} eye req
            onKeyDown={e => e.key === 'Enter' && handleHRLogin()} />
          {hrError && <div style={{ fontSize: '12px', color: '#f87171', fontFamily: "'JetBrains Mono',monospace", marginBottom: '10px' }}>{hrError}</div>}
          <Btn onClick={handleHRLogin} disabled={hrLoading || !hrEmail || !hrPassword} style={{ width: '100%', justifyContent: 'center', padding: '11px' }}>
            {hrLoading ? 'Signing in…' : 'Sign In →'}
          </Btn>
        </Modal>
      )}
    </>
  );
}

// ── LOGIN ─────────────────────────────────────────────────────
export function Login({ onBack, onFirstLogin: _onFirstLogin }: { onBack: () => void; onFirstLogin?: () => void }) {
  const { login } = useAuth();
  const [u, setU] = useState(''); const [p, setP] = useState('');
  const [load, setLoad] = useState(false);
  const [err, setErr] = useState('');

  const go = async () => {
    if (!u || !p) return;
    setLoad(true); setErr('');
    try {
      await login(u, p);
    } catch (e: any) {
      setErr(e.response?.data?.error || 'Invalid credentials');
      setLoad(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', position: 'relative' }}>
      <AnimBg />
      <div className="fu" style={{ width: '100%', maxWidth: '400px', position: 'relative', zIndex: 1 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: C.yellow, cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', fontWeight: '700', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '6px', textShadow: `0 0 12px ${C.yellow}80` }}>← Back</button>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ fontSize: '22px', fontWeight: '800', fontFamily: "'JetBrains Mono', monospace", background: `linear-gradient(135deg,${C.text},${C.accent})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Quality Analysis</div>
          <div style={{ fontSize: '11px', color: C.textDim, fontFamily: "'JetBrains Mono', monospace", marginTop: '5px' }}>QA Team Sign In</div>
        </div>
        <GCard style={{ padding: '28px' }} glow={C.accent}>
          <Inp label="Username" ph="username" value={u} onChange={setU} req />
          <Inp label="Password" ph="Enter password" value={p} onChange={v => { setP(v); }} onKeyDown={e => e.key === 'Enter' && go()} eye req />
          {err && <div style={{ fontSize: '12px', color: '#f87171', fontFamily: "'JetBrains Mono',monospace", marginBottom: '10px' }}>{err}</div>}
          <Btn onClick={go} disabled={load} style={{ width: '100%', justifyContent: 'center', padding: '11px' }}>{load ? 'Signing in…' : 'Sign In →'}</Btn>
        </GCard>
      </div>
    </div>
  );
}

// ── DEV ENTRY ─────────────────────────────────────────────────
export function DevEntry({ onContinue, onBack }: { onContinue: (name: string) => void; onBack: () => void }) {
  const [name, setName] = useState('');
  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', position: 'relative' }}>
      <AnimBg />
      <div className="fu" style={{ width: '100%', maxWidth: '380px', position: 'relative', zIndex: 1, textAlign: 'center' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: C.yellow, cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', fontWeight: '700', marginBottom: '28px', display: 'block', textShadow: `0 0 12px ${C.yellow}80` }}>← Back</button>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}><DevIcon size={52} color={C.purple} /></div>
        <h2 style={{ fontSize: '22px', fontWeight: '800', color: C.text, fontFamily: "'JetBrains Mono', monospace", marginBottom: '8px' }}>What's your name?</h2>
        <p style={{ fontSize: '12px', color: C.textMid, fontFamily: "'JetBrains Mono', monospace", marginBottom: '28px', lineHeight: '1.7' }}>Your name appears on bug comments<br />and test case notes</p>
        <GCard style={{ padding: '24px' }} glow={C.purple}>
          <Inp ph="e.g. Raj Kumar" value={name} onChange={setName} onKeyDown={e => e.key === 'Enter' && name.trim() && onContinue(name.trim())} />
          <Btn v="purple" onClick={() => name.trim() && onContinue(name.trim())} style={{ width: '100%', justifyContent: 'center', padding: '11px' }}>Continue →</Btn>
        </GCard>
      </div>
    </div>
  );
}

// ── CHOOSE QA ─────────────────────────────────────────────────
const QA_LIST = [
  { name: 'Soubhik', role: 'QA Engineer', isAdmin: true,  color: C.accent  },
  { name: 'Bhargav', role: 'QA Lead',     isAdmin: false, color: C.purple  },
  { name: 'Abhinav', role: 'QA Engineer', isAdmin: false, color: C.green   },
  { name: 'Darshan', role: 'QA Engineer', isAdmin: false, color: C.yellow  },
  { name: 'Ashok',   role: 'QA Engineer', isAdmin: false, color: C.blue    },
];

export function ChooseQA({ devName, onChoose, onBack }: {
  devName: string; onChoose: (qa: any) => void; onBack: () => void;
}) {
  const [hov, setHov] = useState<string | null>(null);
  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', position: 'relative' }}>
      <AnimBg />
      <div className="fu" style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: C.yellow, cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', fontWeight: '700', marginBottom: '20px', display: 'block', margin: '0 auto 20px', textShadow: `0 0 12px ${C.yellow}80` }}>← Back</button>
        <div style={{ display: 'inline-block', padding: '4px 14px', borderRadius: '20px', border: `1px solid ${C.purple}40`, background: `${C.purple}0e`, fontSize: '10px', color: C.purple, fontFamily: "'JetBrains Mono', monospace", marginBottom: '14px' }}>Developer View · {devName}</div>
        <h2 style={{ fontSize: '24px', fontWeight: '800', color: C.text, fontFamily: "'JetBrains Mono', monospace", marginBottom: '6px' }}>Choose your project QA</h2>
        <p style={{ fontSize: '11px', color: C.textMid, fontFamily: "'JetBrains Mono', monospace", marginBottom: '36px' }}>View projects · Comment on test cases · Update bug status & add dev comments</p>
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', justifyContent: 'center' }}>
          {QA_LIST.map(q => (
            <div key={q.name} onClick={() => onChoose(q)}
              onMouseEnter={() => setHov(q.name)} onMouseLeave={() => setHov(null)}
              style={{ background: hov === q.name ? `${q.color}0e` : 'var(--qa-card)', backdropFilter: 'blur(24px)', border: `1px solid ${hov === q.name ? q.color + '55' : C.border}`, borderRadius: '14px', padding: '22px 18px', cursor: 'pointer', textAlign: 'center', width: '118px', transition: 'all .22s', transform: hov === q.name ? 'translateY(-4px)' : 'none', boxShadow: hov === q.name ? `0 14px 40px ${q.color}28` : 'none', position: 'relative' }}>
              {q.isAdmin && <AdminBadge />}
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', margin: '0 auto 12px', background: `${q.color}20`, border: `1px solid ${q.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: '800', color: q.color }}>{q.name[0]}</div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: C.text, marginBottom: '4px' }}>{q.name}</div>
              <div style={{ fontSize: '10px', color: q.color, fontFamily: "'JetBrains Mono', monospace" }}>{q.role}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
