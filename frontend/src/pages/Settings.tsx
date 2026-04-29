import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { C } from '../lib/constants';
import { getSettings, addSetting, deleteSetting, getTeam, addQAUser, deleteQAUser, getHRUsers, addHRUser, deleteHRUser, updateMember } from '../lib/api';
import { GCard, Chip, Btn, Inp, Sel, Modal, ConfirmDeleteModal } from '../components/ui/index';
import { useAuth } from '../context/AuthContext';

const SETTING_TABS = [
  { id: 'bug_status', l: 'Bug Status' }, { id: 'qa_status', l: 'QA Status' },
  { id: 'label', l: 'Labels' }, { id: 'priority', l: 'Priority' },
  { id: 'platform', l: 'Platform' }, { id: 'execution_status', l: 'Exec Status' },
  { id: 'test_result', l: 'Test Result' },
];

const PRESET_COLORS = ['#f87171','#fbbf24','#4ade80','#60a5fa','#a78bfa','#f472b6','#fb923c','#6ee7f7','#64748b'];

// ── Team Management ───────────────────────────────────────────
function TeamManagement({ isAdmin }: { isAdmin: boolean }) {
  const qc = useQueryClient();
  const [showAddQA, setShowAddQA] = useState(false);
  const [showAddHR, setShowAddHR] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'qa' | 'hr'; id: string; name: string } | null>(null);
  const [editUser, setEditUser] = useState<any>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('');

  // QA user form
  const [qaName, setQaName] = useState('');
  const [qaUsername, setQaUsername] = useState('');
  const [qaPassword, setQaPassword] = useState('');
  const [qaRole, setQaRole] = useState('qa_engineer');

  // HR user form
  const [hrName, setHrName] = useState('');
  const [hrEmail, setHrEmail] = useState('');
  const [hrPassword, setHrPassword] = useState('');

  const { data: qaUsers = [], isLoading: loadingQA } = useQuery({
    queryKey: ['team'],
    queryFn: getTeam,
    select: (d: any[]) => d.filter((u: any) => u.is_active),
  });

  const { data: hrUsers = [], isLoading: loadingHR } = useQuery({
    queryKey: ['team-hr'],
    queryFn: getHRUsers,
    enabled: isAdmin,
  });

  const addQAMut = useMutation({
    mutationFn: () => addQAUser({ name: qaName, username: qaUsername, password: qaPassword, role: qaRole }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['team'] });
      toast.success('QA user added');
      setShowAddQA(false); setQaName(''); setQaUsername(''); setQaPassword(''); setQaRole('qa_engineer');
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed'),
  });

  const delQAMut = useMutation({
    mutationFn: (id: string) => deleteQAUser(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['team'] }); toast.success('User removed'); setConfirmDelete(null); },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed'),
  });

  const addHRMut = useMutation({
    mutationFn: () => addHRUser({ name: hrName, email: hrEmail, password: hrPassword }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['team-hr'] });
      toast.success('HR user added');
      setShowAddHR(false); setHrName(''); setHrEmail(''); setHrPassword('');
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed'),
  });

  const delHRMut = useMutation({
    mutationFn: (id: string) => deleteHRUser(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['team-hr'] }); toast.success('HR user removed'); setConfirmDelete(null); },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed'),
  });

  const editQAMut = useMutation({
    mutationFn: () => updateMember(editUser.id, { name: editName, ...(isAdmin && editUser.role !== 'admin' ? { role: editRole } : {}) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['team'] }); toast.success('User updated'); setEditUser(null); },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed'),
  });

  const ROLE_COLOR: Record<string, string> = {
    admin: C.accent, qa_lead: C.purple, qa_engineer: '#60a5fa',
  };

  return (
    <div>
      {/* QA Team */}
      <GCard style={{ padding: '20px', marginBottom: '20px' }} glow={C.accent}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <span style={{ fontSize: '13px', fontWeight: '700', color: C.text, fontFamily: "'JetBrains Mono',monospace" }}>QA Team</span>
          <Btn sm icon="＋" onClick={() => setShowAddQA(true)}>Add QA User</Btn>
        </div>
        {loadingQA
          ? <div style={{ color: C.textDim, fontSize: '12px', fontFamily: "'JetBrains Mono',monospace" }}>Loading…</div>
          : <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {(qaUsers as any[]).map((u: any) => (
                <div key={u.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--qa-input)', borderRadius: '8px', border: `1px solid ${C.border}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: `${ROLE_COLOR[u.role] || C.textDim}20`, border: `1px solid ${ROLE_COLOR[u.role] || C.textDim}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', color: ROLE_COLOR[u.role] || C.textDim }}>
                      {u.name[0]}
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: '600', color: C.text, fontFamily: "'JetBrains Mono',monospace" }}>{u.name}</div>
                      <div style={{ fontSize: '10px', color: C.textDim, fontFamily: "'JetBrains Mono',monospace" }}>@{u.username}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Chip text={u.role} color={ROLE_COLOR[u.role] || C.textDim} sm />
                    {u.role !== 'admin' && (
                      <button onClick={() => { setEditUser(u); setEditName(u.name); setEditRole(u.role); }}
                        style={{ background: `${C.accent}15`, border: `1px solid ${C.accent}40`, color: C.accent, borderRadius: '6px', width: '26px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '12px' }}>
                        ✎
                      </button>
                    )}
                    {u.role !== 'admin' && (
                      <button onClick={() => setConfirmDelete({ type: 'qa', id: u.id, name: u.name })}
                        style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', color: '#f87171', borderRadius: '6px', width: '26px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '12px' }}>
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
        }
      </GCard>

      {/* HR Team (admin only) */}
      {isAdmin && (
        <GCard style={{ padding: '20px' }} glow='#34d399'>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ fontSize: '13px', fontWeight: '700', color: C.text, fontFamily: "'JetBrains Mono',monospace" }}>HR Team</span>
            <Btn sm icon="＋" v="green" onClick={() => setShowAddHR(true)}>Add HR User</Btn>
          </div>
          {loadingHR
            ? <div style={{ color: C.textDim, fontSize: '12px', fontFamily: "'JetBrains Mono',monospace" }}>Loading…</div>
            : <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {(hrUsers as any[]).length === 0 && <div style={{ color: C.textMid, fontSize: '12px', fontFamily: "'JetBrains Mono',monospace" }}>No HR users yet. Add one.</div>}
                {(hrUsers as any[]).map((u: any) => (
                  <div key={u.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--qa-input)', borderRadius: '8px', border: `1px solid ${C.border}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', color: '#34d399' }}>
                        {u.name[0]}
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: '600', color: C.text, fontFamily: "'JetBrains Mono',monospace" }}>{u.name}</div>
                        <div style={{ fontSize: '10px', color: C.textDim, fontFamily: "'JetBrains Mono',monospace" }}>{u.email}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Chip text="hr" color="#34d399" sm />
                      <button onClick={() => setConfirmDelete({ type: 'hr', id: u.id, name: u.name })}
                        style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', color: '#f87171', borderRadius: '6px', width: '26px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '12px' }}>
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
          }
        </GCard>
      )}

      {/* Add QA modal */}
      {showAddQA && (
        <Modal title="Add QA User" onClose={() => setShowAddQA(false)}>
          <Inp label="Name" ph="Full name" value={qaName} onChange={setQaName} req />
          <Inp label="Username" ph="e.g. john" value={qaUsername} onChange={setQaUsername} req />
          <Inp label="Password" ph="Set password" value={qaPassword} onChange={setQaPassword} eye req />
          <Sel label="Role" opts={[{ v: 'qa_engineer', l: 'QA Engineer' }, { v: 'qa_lead', l: 'QA Lead' }]} value={qaRole} onChange={setQaRole} />
          <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
            <Btn onClick={() => addQAMut.mutate()} disabled={addQAMut.isPending || !qaName || !qaUsername || !qaPassword}>
              {addQAMut.isPending ? 'Adding…' : 'Add User'}
            </Btn>
            <Btn v="ghost" onClick={() => setShowAddQA(false)}>Cancel</Btn>
          </div>
        </Modal>
      )}

      {/* Edit QA user modal */}
      {editUser && (
        <Modal title="Edit User" onClose={() => setEditUser(null)}>
          <Inp label="Name" ph="Full name" value={editName} onChange={setEditName} req />
          {isAdmin && editUser.role !== 'admin' && (
            <Sel label="Role" opts={[{ v: 'qa_engineer', l: 'QA Engineer' }, { v: 'qa_lead', l: 'QA Lead' }]} value={editRole} onChange={setEditRole} />
          )}
          {!isAdmin && (
            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontSize: '10px', fontWeight: '700', color: C.textMid, fontFamily: "'JetBrains Mono',monospace", marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '.07em' }}>Role</div>
              <div style={{ fontSize: '12px', color: C.textDim, fontFamily: "'JetBrains Mono',monospace", padding: '10px 12px', background: 'var(--qa-input)', borderRadius: '8px', border: `1px solid ${C.border}` }}>{editUser.role} <span style={{ color: C.textMid, fontSize: '10px' }}>(only admin can change roles)</span></div>
            </div>
          )}
          <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
            <Btn onClick={() => editQAMut.mutate()} disabled={editQAMut.isPending || !editName.trim()}>
              {editQAMut.isPending ? 'Saving…' : 'Save Changes'}
            </Btn>
            <Btn v="ghost" onClick={() => setEditUser(null)}>Cancel</Btn>
          </div>
        </Modal>
      )}

      {/* Add HR modal */}
      {showAddHR && (
        <Modal title="Add HR User" onClose={() => setShowAddHR(false)}>
          <Inp label="Name" ph="Full name" value={hrName} onChange={setHrName} req />
          <Inp label="Email" ph="work@email.com" type="email" value={hrEmail} onChange={setHrEmail} req />
          <Inp label="Password" ph="Set password" value={hrPassword} onChange={setHrPassword} eye req />
          <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
            <Btn v="green" onClick={() => addHRMut.mutate()} disabled={addHRMut.isPending || !hrName || !hrEmail || !hrPassword}>
              {addHRMut.isPending ? 'Adding…' : 'Add HR User'}
            </Btn>
            <Btn v="ghost" onClick={() => setShowAddHR(false)}>Cancel</Btn>
          </div>
        </Modal>
      )}

      {/* Confirm delete */}
      {confirmDelete && (
        <ConfirmDeleteModal
          message={`Remove ${confirmDelete.name} from the team? This cannot be undone.`}
          onConfirm={() => confirmDelete.type === 'qa' ? delQAMut.mutate(confirmDelete.id) : delHRMut.mutate(confirmDelete.id)}
          onCancel={() => setConfirmDelete(null)}
          isPending={delQAMut.isPending || delHRMut.isPending}
        />
      )}
    </div>
  );
}

// ── Settings Page ─────────────────────────────────────────────
export function SettingsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const isAdmin = user?.role === 'admin';
  const isAdminOrLead = ['admin', 'qa_lead'].includes(user?.role ?? '');

  const TABS = [
    ...SETTING_TABS,
    ...(isAdminOrLead ? [{ id: 'team', l: 'Team' }] : []),
  ];

  const [tab, setTab] = useState('bug_status');
  const [showAdd, setShowAdd] = useState(false);
  const [newValue, setNewValue] = useState('');
  const [newColor, setNewColor] = useState('#64748b');

  const { data: settings = {}, isLoading } = useQuery({ queryKey: ['settings'], queryFn: getSettings });

  const addMut = useMutation({
    mutationFn: () => addSetting({ category: tab, value: newValue, color: newColor }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['settings'] }); setShowAdd(false); setNewValue(''); toast.success('Value added!'); },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed'),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteSetting(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['settings'] }); toast.success('Removed'); },
  });

  const currentValues: any[] = (settings as any)[tab] || [];

  return (
    <div style={{ padding: '28px 36px 48px', width: '100%' }} className="fu">
      <div style={{ marginBottom: '22px' }}>
        <h1 style={{ margin: '0 0 6px', fontSize: '24px', fontWeight: 600, color: 'var(--qa-text)', fontFamily: "'JetBrains Mono',monospace", letterSpacing: '-0.02em' }}>Settings</h1>
        <div style={{ fontSize: '12px', color: 'var(--qa-text-mid)', fontFamily: "'JetBrains Mono',monospace" }}>Manage dropdown chips and status values · Admin & QA Lead only</div>
      </div>

      {/* Pill-style tab switcher */}
      <div style={{
        display: 'inline-flex',
        gap: '2px',
        background: 'var(--qa-surface)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '10px',
        padding: '3px',
        marginBottom: '22px',
        flexWrap: 'wrap',
      }}>
        {TABS.map(t => {
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              onMouseEnter={e => { if (!active) e.currentTarget.style.color = 'var(--qa-text)'; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.color = 'var(--qa-text-mid)'; }}
              style={{
                padding: '7px 16px',
                borderRadius: '7px',
                fontSize: '12px',
                fontWeight: active ? 600 : 500,
                fontFamily: "'JetBrains Mono',monospace",
                cursor: 'pointer',
                background: active ? 'var(--qa-card)' : 'transparent',
                border: 'none',
                color: active ? 'var(--qa-text)' : 'var(--qa-text-mid)',
                boxShadow: active ? '0 1px 3px rgba(0,0,0,0.15)' : 'none',
                transition: 'color 0.15s, background 0.15s',
                letterSpacing: '.01em',
              }}>{t.l}</button>
          );
        })}
      </div>

      {tab === 'team' ? (
        <TeamManagement isAdmin={isAdmin} />
      ) : (
        <>
          <div style={{
            background: 'var(--qa-card)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '12px',
            padding: '18px 20px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--qa-text)', fontFamily: "'JetBrains Mono',monospace" }}>
                {SETTING_TABS.find(t => t.id === tab)?.l} Values
              </span>
              <Btn sm icon="＋" onClick={() => setShowAdd(true)}>Add Value</Btn>
            </div>

            {isLoading
              ? <div style={{ color: 'var(--qa-text-mid)', fontSize: '12px', fontFamily: "'JetBrains Mono',monospace" }}>Loading…</div>
              : <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {currentValues.map((item: any) => (
                    <div key={item.id} style={{
                      display: 'inline-flex', alignItems: 'center', gap: '8px',
                      background: `${item.color}1f`,
                      border: `1px solid ${item.color}38`,
                      borderRadius: '999px',
                      padding: '4px 6px 4px 10px',
                    }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: item.color, display: 'inline-block' }} />
                      <span style={{ fontSize: '11.5px', color: item.color, fontFamily: "'JetBrains Mono',monospace", fontWeight: 600 }}>{item.value}</span>
                      <button onClick={() => deleteMut.mutate(item.id)}
                        onMouseEnter={e => { e.currentTarget.style.opacity = '1'; }}
                        onMouseLeave={e => { e.currentTarget.style.opacity = '0.6'; }}
                        style={{
                          background: 'none', border: 'none', color: 'inherit',
                          cursor: 'pointer', fontSize: '12px',
                          padding: '0 4px', lineHeight: 1, opacity: 0.6,
                          transition: 'opacity .15s',
                        }}>×</button>
                    </div>
                  ))}
                  {currentValues.length === 0 && <div style={{ color: 'var(--qa-text-mid)', fontSize: '12px', fontFamily: "'JetBrains Mono',monospace" }}>No values yet. Add one.</div>}
                </div>
            }
          </div>

          {showAdd && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }} onClick={e => e.target === e.currentTarget && setShowAdd(false)}>
              <GCard style={{ padding: '24px', width: '100%', maxWidth: '400px' }} glow={C.accent}>
                <div style={{ fontSize: '14px', fontWeight: '700', color: C.text, fontFamily: "'JetBrains Mono',monospace", marginBottom: '20px' }}>Add Value to {SETTING_TABS.find(t => t.id === tab)?.l}</div>
                <Inp label="Value" ph="e.g. Pending Review" value={newValue} onChange={setNewValue} req />
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '10px', fontWeight: '700', color: C.textMid, marginBottom: '8px', fontFamily: "'JetBrains Mono',monospace", letterSpacing: '.07em', textTransform: 'uppercase' }}>Colour</label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {PRESET_COLORS.map(c => (
                      <div key={c} onClick={() => setNewColor(c)} style={{ width: '28px', height: '28px', borderRadius: '6px', background: c, cursor: 'pointer', border: newColor === c ? `3px solid ${C.text}` : '3px solid transparent', transition: 'border .15s' }} />
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <Btn onClick={() => addMut.mutate()} disabled={addMut.isPending || !newValue.trim()}>Add</Btn>
                  <Btn v="ghost" onClick={() => setShowAdd(false)}>Cancel</Btn>
                </div>
              </GCard>
            </div>
          )}
        </>
      )}
    </div>
  );
}
