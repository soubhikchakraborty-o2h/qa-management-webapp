import { useState, useRef } from 'react';
import { C } from '../../lib/constants';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { uploadAvatar, changePassword as apiChangePassword } from '../../lib/api';
import toast from 'react-hot-toast';

const RED = '#ef4444';

// ── NavItem ───────────────────────────────────────────────────
function NavItem({ label, icon, active, onClick, indent, collapsed }: {
  label: string; icon: string; active: boolean; onClick: () => void; indent?: boolean; collapsed?: boolean;
}) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      title={collapsed ? label : undefined}
      style={{
        display: 'flex', alignItems: 'center',
        gap: collapsed ? 0 : '12px',
        justifyContent: collapsed ? 'center' : 'flex-start',
        padding: collapsed ? '10px 0' : `9px 10px 9px ${indent ? '22px' : '10px'}`,
        borderRadius: '8px', cursor: 'pointer', marginBottom: '2px',
        background: active ? 'rgba(124,106,247,0.12)' : hov ? 'rgba(124,106,247,0.06)' : 'transparent',
        color: active ? 'var(--qa-accent)' : hov ? 'var(--qa-text)' : 'var(--qa-text-mid)',
        fontSize: '12px', fontWeight: active ? 600 : 500,
        fontFamily: "'JetBrains Mono', monospace",
        transition: 'background 0.15s, color 0.15s',
      }}
    >
      <span style={{ fontSize: '13px', flexShrink: 0, width: '18px', textAlign: 'center' }}>{icon}</span>
      {!collapsed && label}
    </div>
  );
}

const DICEBEAR_URL = (name: string) =>
  `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name.toLowerCase().trim())}&backgroundColor=b6e3f4,c0aede,d1d4f9`;

// ── Sidebar ───────────────────────────────────────────────────
export function Sidebar({ page, setPage, user, insideProject, onBackToProjects, collapsed, onSignOut }: {
  page: string; setPage: (p: string) => void; user: any;
  insideProject: boolean; onBackToProjects: () => void; collapsed: boolean;
  onSignOut: () => void;
}) {
  const { isDark, toggleTheme } = useTheme();
  const { updateUser } = useAuth();
  const [confirming, setConfirming] = useState(false);
  const [hovSign, setHovSign] = useState(false);
  const [hovTheme, setHovTheme] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [avatarHov, setAvatarHov] = useState(false);
  const [hovChangePw, setHovChangePw] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [showChangePw, setShowChangePw] = useState(false);
  const [pwCurrent, setPwCurrent] = useState('');
  const [pwNew, setPwNew] = useState('');
  const [pwConfirm, setPwConfirm] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwPending, setPwPending] = useState(false);

  const isQAUser = user.role !== 'developer' && user.role !== 'hr';

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Only image files allowed'); return; }
    if (file.size > 1.5 * 1024 * 1024) { toast.error('Image must be under 1.5 MB'); return; }
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setUploadingAvatar(true);
      try {
        const updated = await uploadAvatar(dataUrl);
        updateUser({ ...user, avatar_url: updated.avatar_url });
        setShowAvatarModal(false);
        toast.success('Avatar updated');
      } catch { toast.error('Upload failed'); }
      finally { setUploadingAvatar(false); }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleChangePassword = async () => {
    setPwError('');
    if (pwNew !== pwConfirm) { setPwError('Passwords do not match'); return; }
    if (pwNew.length < 6) { setPwError('Minimum 6 characters'); return; }
    setPwPending(true);
    try {
      await apiChangePassword(pwCurrent, pwNew);
      toast.success('Password updated');
      setShowChangePw(false);
      setPwCurrent(''); setPwNew(''); setPwConfirm('');
    } catch (err: any) {
      setPwError(err.response?.data?.error || 'Failed to update password');
    } finally { setPwPending(false); }
  };

  const avatarSrc = user.role === 'developer'
    ? DICEBEAR_URL(user.name)
    : (user.avatar_url || null);

  const modalOverlay: React.CSSProperties = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,.65)', backdropFilter: 'blur(10px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px',
  };
  const modalCard: React.CSSProperties = {
    background: 'var(--qa-card)', border: '1px solid var(--qa-border-lt)', borderRadius: '14px',
    padding: '24px', width: '100%', maxWidth: '360px',
  };
  const modalTitle: React.CSSProperties = {
    fontSize: '14px', fontWeight: '700', color: C.text,
    fontFamily: "'JetBrains Mono',monospace", marginBottom: '20px',
  };
  const pwInput: React.CSSProperties = {
    width: '100%', padding: '9px 12px', background: 'var(--qa-input)',
    border: `1px solid ${C.border}`, borderRadius: '8px', color: C.text,
    fontFamily: "'JetBrains Mono',monospace", fontSize: '13px', outline: 'none',
    boxSizing: 'border-box', marginBottom: '10px',
  };

  return (
    <>
    <div style={{
      width: collapsed ? '0' : '220px',
      height: '100vh',
      background: 'var(--qa-surface)',
      borderRight: collapsed ? 'none' : '1px solid rgba(255,255,255,0.06)',
      display: 'flex', flexDirection: 'column', flexShrink: 0,
      position: 'fixed', top: 0, left: 0, zIndex: 100,
      overflowX: 'hidden', overflowY: 'auto',
      transition: 'width 0.25s ease',
    }}>
      <div style={{ width: '220px', display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {/* Logo */}
        <div style={{ padding: '18px 16px 14px' }}>
          <div style={{ fontSize: '9px', letterSpacing: '0.2em', color: 'var(--qa-text-faint)', fontFamily: "'JetBrains Mono', monospace", marginBottom: '3px', textTransform: 'uppercase' }}>O2H Technology</div>
          <div style={{ fontSize: '15px', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: 'var(--qa-text)', letterSpacing: '-0.3px' }}>Quality Analysis</div>
        </div>

        {/* Divider */}
        <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '8px 0' }} />

        {/* User */}
        <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Avatar */}
          <div
            style={{
              position: 'relative', flexShrink: 0,
              width: '36px', height: '36px', borderRadius: '50%',
              border: `2px solid ${avatarHov && isQAUser ? 'var(--qa-accent)' : 'rgba(124,106,247,0.22)'}`,
              overflow: 'hidden',
              cursor: isQAUser ? 'pointer' : 'default',
              transition: 'border-color .15s',
            }}
            onClick={() => isQAUser && setShowAvatarModal(true)}
            onMouseEnter={() => setAvatarHov(true)}
            onMouseLeave={() => setAvatarHov(false)}
            title={isQAUser ? 'Change profile picture' : undefined}
          >
            {avatarSrc ? (
              <img src={avatarSrc} alt={user.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            ) : (
              <div style={{
                width: '100%', height: '100%',
                background: 'linear-gradient(135deg,#7c6af7,#6a5ae0)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '14px', fontWeight: 700, color: '#ffffff',
                fontFamily: "'JetBrains Mono', monospace",
              }}>{user.name[0]}</div>
            )}
            {isQAUser && avatarHov && (
              <div style={{
                position: 'absolute', inset: 0,
                background: 'rgba(0,0,0,0.5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '11px', color: '#fff', fontFamily: "'JetBrains Mono',monospace",
              }}>✎</div>
            )}
          </div>
          <div style={{ overflow: 'hidden', flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--qa-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: "'JetBrains Mono', monospace", marginBottom: '3px' }}>{user.name}</div>
            <div style={{
              display: 'inline-block',
              padding: '2px 7px',
              borderRadius: '4px',
              fontSize: '9px',
              fontWeight: 600,
              background: 'rgba(124,106,247,0.12)',
              color: 'var(--qa-accent)',
              border: '1px solid rgba(124,106,247,0.22)',
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: '.05em',
            }}>
              {user.role === 'admin' ? 'ADMIN' : user.role === 'qa_lead' ? 'QA LEAD' : user.role === 'developer' ? 'DEVELOPER' : 'QA ENGINEER'}
            </div>
            {isQAUser && (
              <button onClick={() => setShowChangePw(true)}
                onMouseEnter={() => setHovChangePw(true)}
                onMouseLeave={() => setHovChangePw(false)}
                style={{
                  display: 'block', marginTop: '4px',
                  background: 'none', border: 'none',
                  color: hovChangePw ? 'var(--qa-accent)' : 'var(--qa-text-faint)',
                  fontFamily: "'JetBrains Mono',monospace", fontSize: '10px',
                  cursor: 'pointer', padding: '0', textDecoration: 'underline',
                  textUnderlineOffset: '2px', transition: 'color .15s',
                }}>change password</button>
            )}
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '8px 0' }} />

        {/* Nav */}
        <nav style={{ flex: 1, padding: '6px 10px' }}>
          <NavItem label="Projects" icon="◈" active={page === 'projects' && !insideProject} onClick={() => { setPage('projects'); onBackToProjects(); }} />
          {insideProject && <>
            <div style={{ padding: '12px 10px 6px', fontSize: '9px', color: 'var(--qa-text-xfaint)', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '.2em', textTransform: 'uppercase' }}>In Project</div>
            <NavItem label="Overview"    icon="◉" active={page === 'overview'}   onClick={() => setPage('overview')}   indent />
            <NavItem label="Test Cases"  icon="✓" active={page === 'testcases'}  onClick={() => setPage('testcases')}  indent />
            <NavItem label="Bug Tracker" icon="⬡" active={page === 'bugs'}       onClick={() => setPage('bugs')}       indent />
            <NavItem label="Automation"  icon="▶" active={page === 'automation'} onClick={() => setPage('automation')} indent />
            <NavItem label="Documents"   icon="◫" active={page === 'documents'}  onClick={() => setPage('documents')}  indent />
            <div style={{ margin: '10px 2px', borderTop: '1px solid rgba(255,255,255,0.06)' }} />
          </>}
          {['admin', 'qa_lead'].includes(user.role) && (
            <NavItem label="Settings" icon="⚙" active={page === 'settings'} onClick={() => { setPage('settings'); if (insideProject) onBackToProjects(); }} />
          )}
        </nav>

        {/* Bottom section: theme + sign out + version */}
        <div style={{ padding: '10px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          {/* Theme Toggle */}
          <div
            onClick={toggleTheme}
            onMouseEnter={() => setHovTheme(true)}
            onMouseLeave={() => setHovTheme(false)}
            style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '9px 10px',
              borderRadius: '8px', cursor: 'pointer',
              marginBottom: '2px',
              background: hovTheme ? 'rgba(124,106,247,0.06)' : 'transparent',
              color: hovTheme ? 'var(--qa-text)' : 'var(--qa-text-mid)',
              fontSize: '12px', fontWeight: 500, fontFamily: "'JetBrains Mono', monospace",
              transition: 'background 0.15s, color 0.15s',
            }}
          >
            <span style={{ fontSize: '13px', flexShrink: 0, width: '18px', textAlign: 'center' }}>{isDark ? '☀' : '☾'}</span>
            {isDark ? 'Light Mode' : 'Dark Mode'}
          </div>

          {/* Sign Out */}
          {confirming ? (
            <div style={{
              margin: '2px 0',
              background: `${RED}10`,
              border: `1px solid ${RED}30`,
              borderRadius: '8px',
              padding: '10px',
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              <div style={{ fontSize: '10px', color: 'var(--qa-text)', marginBottom: '8px', fontWeight: 600 }}>Sign out?</div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  onClick={() => { setConfirming(false); onSignOut(); }}
                  style={{
                    flex: 1, padding: '6px 0', borderRadius: '6px', border: 'none', cursor: 'pointer',
                    background: RED, color: '#fff', fontSize: '10px', fontWeight: 700,
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >Yes</button>
                <button
                  onClick={() => setConfirming(false)}
                  style={{
                    flex: 1, padding: '6px 0', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer',
                    background: 'transparent', color: 'var(--qa-text-mid)', fontSize: '10px', fontWeight: 600,
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >No</button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => setConfirming(true)}
              onMouseEnter={() => setHovSign(true)}
              onMouseLeave={() => setHovSign(false)}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '9px 10px',
                borderRadius: '8px', cursor: 'pointer',
                background: hovSign ? 'rgba(239,68,68,0.08)' : 'transparent',
                color: hovSign ? RED : 'var(--qa-text-mid)',
                fontSize: '12px', fontWeight: 500, fontFamily: "'JetBrains Mono', monospace",
                transition: 'background 0.15s, color 0.15s',
              }}
            >
              <span style={{ fontSize: '13px', flexShrink: 0, width: '18px', textAlign: 'center' }}>→</span>
              Sign Out
            </div>
          )}

          {/* Version */}
          <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.18)', fontFamily: "'JetBrains Mono', monospace", textAlign: 'center', padding: '10px 8px 2px' }}>v1.0.0 — O2H Technology</div>
        </div>
      </div>
    </div>

    {/* Hidden avatar file input */}
    <input ref={avatarInputRef} type="file" accept="image/*" hidden onChange={handleAvatarChange} />

    {/* Avatar upload modal */}
    {showAvatarModal && (
      <div style={modalOverlay} onClick={e => e.target === e.currentTarget && setShowAvatarModal(false)}>
        <div style={modalCard}>
          <div style={modalTitle}>Profile Picture</div>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            {user.avatar_url ? (
              <img src={user.avatar_url} alt={user.name}
                style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(124,106,247,0.4)', margin: '0 auto', display: 'block' }} />
            ) : (
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg,#7c6af7,#6a5ae0)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: '700', color: '#fff', margin: '0 auto' }}>{user.name[0]}</div>
            )}
          </div>
          <button onClick={() => avatarInputRef.current?.click()} disabled={uploadingAvatar} style={{
            display: 'block', width: '100%', padding: '10px',
            background: uploadingAvatar ? 'rgba(124,106,247,0.4)' : 'rgba(124,106,247,0.15)',
            border: '1px solid rgba(124,106,247,0.4)', borderRadius: '8px',
            color: C.accent, fontFamily: "'JetBrains Mono',monospace", fontSize: '12px',
            cursor: uploadingAvatar ? 'not-allowed' : 'pointer', marginBottom: '10px',
          }}>{uploadingAvatar ? 'Uploading…' : '⬆ Choose Image'}</button>
          <div style={{ fontSize: '10px', color: 'var(--qa-text-faint)', fontFamily: "'JetBrains Mono',monospace", textAlign: 'center' }}>Max 1.5 MB · JPG, PNG, or WebP</div>
          <button onClick={() => setShowAvatarModal(false)} style={{
            display: 'block', width: '100%', padding: '9px',
            background: 'transparent', border: `1px solid ${C.border}`, borderRadius: '8px',
            color: 'var(--qa-text-faint)', fontFamily: "'JetBrains Mono',monospace", fontSize: '12px',
            cursor: 'pointer', marginTop: '10px',
          }}>Cancel</button>
        </div>
      </div>
    )}

    {/* Change password modal */}
    {showChangePw && (
      <div style={modalOverlay} onClick={e => e.target === e.currentTarget && (setShowChangePw(false), setPwError(''), setPwCurrent(''), setPwNew(''), setPwConfirm(''))}>
        <div style={modalCard}>
          <div style={modalTitle}>Change Password</div>
          <input type="password" placeholder="Current password" value={pwCurrent} onChange={e => setPwCurrent(e.target.value)} style={pwInput} />
          <input type="password" placeholder="New password" value={pwNew} onChange={e => setPwNew(e.target.value)} style={pwInput} />
          <input type="password" placeholder="Confirm new password" value={pwConfirm} onChange={e => setPwConfirm(e.target.value)} style={{ ...pwInput, marginBottom: '0' }}
            onKeyDown={e => e.key === 'Enter' && handleChangePassword()} />
          {pwError && <div style={{ fontSize: '11px', color: '#ef4444', fontFamily: "'JetBrains Mono',monospace", margin: '8px 0 0' }}>⚠ {pwError}</div>}
          <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
            <button onClick={handleChangePassword} disabled={pwPending || !pwCurrent || !pwNew || !pwConfirm} style={{
              flex: 1, padding: '9px', background: 'rgba(124,106,247,0.2)', border: '1px solid rgba(124,106,247,0.4)',
              borderRadius: '8px', color: C.accent, fontFamily: "'JetBrains Mono',monospace", fontSize: '12px',
              cursor: pwPending ? 'not-allowed' : 'pointer', fontWeight: '600',
            }}>{pwPending ? 'Updating…' : 'Update Password'}</button>
            <button onClick={() => { setShowChangePw(false); setPwError(''); setPwCurrent(''); setPwNew(''); setPwConfirm(''); }} style={{
              padding: '9px 16px', background: 'transparent', border: `1px solid ${C.border}`,
              borderRadius: '8px', color: 'var(--qa-text-faint)', fontFamily: "'JetBrains Mono',monospace",
              fontSize: '12px', cursor: 'pointer',
            }}>Cancel</button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}

// ── Overhead Tabs ─────────────────────────────────────────────
const PROJ_TABS = [
  { id: 'overview',   label: 'Overview',    icon: '◉' },
  { id: 'testcases',  label: 'Test Cases',  icon: '✓' },
  { id: 'bugs',       label: 'Bug Tracker', icon: '⬡' },
  { id: 'automation', label: 'Automation',  icon: '▶' },
  { id: 'documents',  label: 'Documents',   icon: '◫' },
];

function TabBadge({ count }: { count: number | undefined }) {
  if (count === undefined || count === null) return null;
  return (
    <span style={{
      background: 'rgba(124,106,247,0.12)',
      color: 'var(--qa-accent)',
      borderRadius: '4px',
      padding: '1px 5px',
      fontSize: '8px',
      fontWeight: 700,
      fontFamily: "'JetBrains Mono', monospace",
      letterSpacing: '.04em',
      lineHeight: 1.4,
    }}>{count}</span>
  );
}

export function OverheadTabs({ page, setPage, counts }: { page: string; setPage: (p: string) => void; counts?: { testcases?: number; bugs?: number } }) {
  const [hov, setHov] = useState<string | null>(null);
  return (
    <div style={{
      display: 'flex', gap: '0',
      padding: '0 32px',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      background: 'var(--qa-sidebar)',
      overflowX: 'auto',
    }}>
      {PROJ_TABS.map(t => {
        const active = page === t.id;
        const isHov = hov === t.id;
        const badgeCount = t.id === 'testcases' ? counts?.testcases : t.id === 'bugs' ? counts?.bugs : undefined;
        return (
          <button key={t.id}
            onClick={() => setPage(t.id)}
            onMouseEnter={() => setHov(t.id)}
            onMouseLeave={() => setHov(null)}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '10px 16px',
              background: 'none', border: 'none',
              borderBottom: `2px solid ${active ? 'var(--qa-accent)' : 'transparent'}`,
              color: active ? 'var(--qa-accent)' : isHov ? 'var(--qa-text)' : 'var(--qa-text-mid)',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '12px', fontWeight: active ? 600 : 500,
              cursor: 'pointer', whiteSpace: 'nowrap',
              transition: 'color 0.15s, border-color 0.15s',
              marginBottom: '-1px',
              letterSpacing: '.01em',
            }}>
            <span style={{ fontSize: '11px' }}>{t.icon}</span>
            {t.label}
            <TabBadge count={badgeCount} />
          </button>
        );
      })}
    </div>
  );
}
