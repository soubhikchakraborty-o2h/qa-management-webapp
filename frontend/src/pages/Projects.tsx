import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { C, STATUS_COLORS, STATUS_LABELS, APP_TYPE_ICON, PRIORITY_COLORS } from '../lib/constants';
import { getProjects, getProjectsForQA, createProject, deleteProject, getTeam, addMember } from '../lib/api';
import { GCard, Chip, Btn, Modal, Inp, Sel, ConfirmDeleteModal } from '../components/ui/index';

const DICEBEAR = (name: string) =>
  `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name.toLowerCase().trim())}&backgroundColor=b6e3f4,c0aede,d1d4f9`;

function StatusPill({ status }: { status: string }) {
  const isActive = status === 'active';
  const color = isActive ? '#10b981' : status === 'in_review' ? '#f59e0b' : status === 'on_hold' ? '#f97316' : '#6b7280';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '6px',
      padding: '3px 10px 3px 8px', borderRadius: '999px',
      background: `${color}1f`, color, border: `1px solid ${color}38`,
      fontSize: '10px', fontWeight: 600, fontFamily: "'JetBrains Mono',monospace",
      letterSpacing: '.02em', whiteSpace: 'nowrap',
    }}>
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: color, flexShrink: 0 }} />
      {STATUS_LABELS[status] || status}
    </span>
  );
}

function ProjCard({ p, onClick, onDelete }: { p: any; onClick: () => void; onDelete?: () => void }) {
  const ownerName = p.created_by_user?.name || '';
  const passRate = p.test_case_count ? Math.round((p.pass_count / p.test_case_count) * 100) : 0;
  const [hov, setHov] = useState(false);

  // Build QA avatar list: owner + additional QAs (if available on project)
  const qaNames: string[] = [];
  if (ownerName) qaNames.push(ownerName);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        position: 'relative',
        background: 'var(--qa-card)',
        border: `1px solid ${hov ? 'var(--qa-accent)' : 'rgba(255,255,255,0.06)'}`,
        borderRadius: '14px',
        padding: '18px',
        cursor: 'pointer',
        opacity: p.status === 'completed' ? 0.6 : 1,
        transform: hov ? 'translateY(-2px)' : 'none',
        boxShadow: hov ? '0 10px 30px -10px rgba(124,106,247,0.45)' : 'none',
        transition: 'transform .2s, border-color .2s, box-shadow .2s',
        overflow: 'hidden',
      }}
    >
      {/* Gradient top line on hover */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
        background: hov ? 'linear-gradient(90deg, var(--qa-accent), transparent)' : 'transparent',
        transition: 'background .2s',
      }} />
      {onDelete && (
        <button onClick={e => { e.stopPropagation(); onDelete(); }} title="Delete project"
          style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '6px', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '11px', color: '#ef4444', zIndex: 1 }}>🗑</button>
      )}

      {/* Top row: code badge + status */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', paddingRight: onDelete ? '30px' : '0' }}>
        <span style={{
          padding: '3px 8px',
          borderRadius: '6px',
          background: 'rgba(124,106,247,0.12)',
          border: '1px solid rgba(124,106,247,0.22)',
          color: 'var(--qa-accent)',
          fontSize: '10.5px', fontWeight: 700,
          fontFamily: "'JetBrains Mono',monospace",
          letterSpacing: '.02em',
        }}>{p.project_code}</span>
        <StatusPill status={p.status} />
      </div>

      {/* Project name */}
      <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--qa-text)', lineHeight: 1.35, marginBottom: '6px', fontFamily: "'JetBrains Mono',monospace" }}>{p.name}</div>

      {/* Description */}
      <div style={{
        fontSize: '11.5px', color: 'var(--qa-text-mid)', lineHeight: 1.5,
        marginBottom: '14px',
        minHeight: '2.9em',
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        fontFamily: "'JetBrains Mono',monospace",
      } as React.CSSProperties}>{p.description || ' '}</div>

      {/* Tags row */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', flexWrap: 'wrap' }}>
        <span style={{
          fontSize: '10px', padding: '3px 8px', borderRadius: '6px',
          background: p.figma_url ? 'rgba(124,106,247,0.12)' : 'rgba(255,255,255,0.04)',
          color: p.figma_url ? 'var(--qa-accent)' : 'var(--qa-text-faint)',
          fontFamily: "'JetBrains Mono',monospace", fontWeight: 600,
        }}>{p.figma_url ? 'Figma ✓' : 'Figma —'}</span>
        <span style={{
          fontSize: '10px', padding: '3px 8px', borderRadius: '6px',
          background: p.frd_url ? 'rgba(124,106,247,0.12)' : 'rgba(255,255,255,0.04)',
          color: p.frd_url ? 'var(--qa-accent)' : 'var(--qa-text-faint)',
          fontFamily: "'JetBrains Mono',monospace", fontWeight: 600,
        }}>{p.frd_url ? 'FRD ✓' : 'FRD —'}</span>
        <span style={{
          fontSize: '10px', padding: '3px 8px', borderRadius: '6px',
          background: 'rgba(255,255,255,0.04)',
          color: 'var(--qa-text-mid)',
          fontFamily: "'JetBrains Mono',monospace", fontWeight: 600,
        }}>{APP_TYPE_ICON[p.app_type]} {p.app_type?.toUpperCase()}</span>
      </div>

      {/* Pass rate */}
      <div style={{ marginBottom: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
          <span style={{ fontSize: '9px', color: 'var(--qa-text-mid)', fontFamily: "'JetBrains Mono',monospace", letterSpacing: '.1em', textTransform: 'uppercase', fontWeight: 600 }}>Pass Rate</span>
          <span style={{ fontSize: '11px', color: 'var(--qa-text)', fontFamily: "'JetBrains Mono',monospace", fontWeight: 700 }}>{passRate}%</span>
        </div>
        <div style={{ height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '999px', overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${passRate}%`,
            background: 'linear-gradient(90deg, var(--qa-accent), #10b981)',
            borderRadius: '999px',
            transition: 'width 0.4s ease',
          }} />
        </div>
      </div>

      {/* Bottom row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', gap: '14px' }}>
          <span style={{ fontSize: '11px', color: 'var(--qa-text-mid)', fontFamily: "'JetBrains Mono',monospace" }}>🪲 <strong style={{ color: 'var(--qa-text)', fontWeight: 700 }}>{p.bug_count || 0}</strong></span>
          <span style={{ fontSize: '11px', color: 'var(--qa-text-mid)', fontFamily: "'JetBrains Mono',monospace" }}>✓ <strong style={{ color: 'var(--qa-text)', fontWeight: 700 }}>{p.test_case_count || 0}</strong></span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {qaNames.slice(0, 3).map((name, i) => (
            <div key={name + i} style={{
              width: '24px', height: '24px', borderRadius: '50%',
              border: '2px solid var(--qa-card)',
              marginLeft: i === 0 ? 0 : '-8px',
              overflow: 'hidden',
              background: `linear-gradient(135deg,${C.accent},${C.purple})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '9px', fontWeight: 700, color: '#fff',
              fontFamily: "'JetBrains Mono',monospace",
              position: 'relative', zIndex: qaNames.length - i,
            }} title={name}>
              <img src={DICEBEAR(name)} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ProjectsPage({ user, onProjectClick, filterByQA, teamViewMember, onClearTeamView }: {
  user: any;
  onProjectClick: (p: any) => void;
  filterByQA?: string | null;
  teamViewMember?: { id: string; name: string } | null;
  onClearTeamView?: () => void;
}) {
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [confirmDeleteProj, setConfirmDeleteProj] = useState<{ id: string; name: string } | null>(null);
  const [showTeam, setShowTeam] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [search, setSearch] = useState('');

  // Form state - new project
  const [pName, setPName] = useState(''); const [pCode, setPCode] = useState('');
  const [pType, setPType] = useState('web'); const [pFigma, setPFigma] = useState('');
  const [pFrd, setPFrd] = useState(''); const [pDesc, setPDesc] = useState('');

  // Form state - new member
  const [mName, setMName] = useState(''); const [mUsername, setMUsername] = useState('');
  const [mPassword, setMPassword] = useState(''); const [mRole, setMRole] = useState('qa_engineer');

  const hasSession = !!localStorage.getItem('qa_token');
  const isDevMode = user.role === 'developer';
  const isTeamView = !isDevMode && !!teamViewMember;
  const qaForFetch = filterByQA || '';

  const { data: rawData, isLoading } = useQuery({
    queryKey: isDevMode
      ? ['projects-dev', qaForFetch]
      : isTeamView
        ? ['projects-team', teamViewMember!.id]
        : ['projects'],
    queryFn: isDevMode
      ? () => getProjectsForQA(qaForFetch)
      : isTeamView
        ? () => getProjects({ teamView: true, owner: teamViewMember!.id })
        : () => getProjects(),
    enabled: isDevMode ? !!qaForFetch : hasSession,
  });

  // Dev mode returns an array; QA mode returns { projects, readOnly }
  const projects: any[] = isDevMode ? (rawData || []) : (rawData?.projects || []);

  const { data: team = [] } = useQuery({ queryKey: ['team'], queryFn: getTeam, enabled: hasSession });

  const deleteProjMut = useMutation({
    mutationFn: (id: string) => deleteProject(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['projects'] }); setConfirmDeleteProj(null); toast.success('Project deleted'); },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed to delete project'),
  });

  const createMut = useMutation({
    mutationFn: createProject,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['projects'] }); setShowAdd(false); toast.success('Project created!'); resetProjectForm(); },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed to create project'),
  });

  const addMemberMut = useMutation({
    mutationFn: addMember,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['team'] }); setShowAddMember(false); toast.success('Member added!'); resetMemberForm(); },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed to add member'),
  });

  const resetProjectForm = () => { setPName(''); setPCode(''); setPType('web'); setPFigma(''); setPFrd(''); setPDesc(''); };
  const resetMemberForm = () => { setMName(''); setMUsername(''); setMPassword(''); setMRole('qa_engineer'); };

  const filtered = projects.filter((p: any) => p.name.toLowerCase().includes(search.toLowerCase()));

  const roleLabel: Record<string, string> = { admin: 'Admin + QA Engineer', qa_lead: 'QA Lead', qa_engineer: 'QA Engineer' };

  const pageTitle = isTeamView
    ? `${teamViewMember!.name}'s Projects`
    : (isDevMode && filterByQA)
      ? `${filterByQA}'s Projects`
      : 'My Projects';

  return (
    <div style={{ padding: '28px 36px 48px', width: '100%' }} className="fu">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '22px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 600, color: 'var(--qa-text)', fontFamily: "'JetBrains Mono',monospace", letterSpacing: '-0.02em' }}>
            {pageTitle}
          </h1>
          <div style={{ fontSize: '12px', color: 'var(--qa-text-mid)', fontFamily: "'JetBrains Mono',monospace", marginTop: '6px' }}>
            <span style={{ color: '#10b981' }}>{filtered.filter((p: any) => p.status === 'active').length} active</span>
            <span style={{ opacity: 0.4, margin: '0 6px' }}>·</span>
            {filtered.length} total
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginLeft: 'auto' }}>
          {!isDevMode && <Btn v="ghost" onClick={() => setShowTeam(true)} icon="👥">Team</Btn>}
          {!isDevMode && !isTeamView && <Btn onClick={() => setShowAdd(true)} icon="＋">New Project</Btn>}
        </div>
      </div>

      {/* Team view banner */}
      {isTeamView && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: `${C.yellow}10`, border: `1px solid ${C.yellow}30`, borderRadius: '10px', padding: '10px 16px', marginBottom: '20px' }}>
          <span style={{ fontSize: '12px', color: C.yellow, fontFamily: "'JetBrains Mono',monospace", fontWeight: '600' }}>
            👁 Read-only view — {teamViewMember!.name}'s projects
          </span>
          <button onClick={onClearTeamView} style={{ marginLeft: 'auto', background: 'none', border: `1px solid ${C.border}`, borderRadius: '6px', padding: '4px 10px', fontSize: '11px', color: C.textMid, cursor: 'pointer', fontFamily: "'JetBrains Mono',monospace" }}>
            ← My Projects
          </button>
        </div>
      )}

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: '22px', maxWidth: '100%' }}>
        <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--qa-text-mid)', fontSize: '14px', pointerEvents: 'none' }}>⌕</span>
        <input
          placeholder="Search projects…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          onFocus={e => { e.currentTarget.style.borderColor = 'var(--qa-accent)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(124,106,247,0.12)'; }}
          onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.boxShadow = 'none'; }}
          style={{
            width: '100%',
            background: 'var(--qa-card)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '10px',
            padding: '10px 12px 10px 38px',
            color: 'var(--qa-text)',
            fontSize: '13px',
            fontFamily: "'JetBrains Mono',monospace",
            outline: 'none',
            boxSizing: 'border-box',
            transition: 'border-color .15s, box-shadow .15s',
          }}
        />
      </div>

      {isDevMode && !qaForFetch
        ? <div style={{ textAlign: 'center', padding: '60px 20px', fontFamily: "'JetBrains Mono',monospace" }}>
            <div style={{ fontSize: '28px', marginBottom: '14px' }}>◈</div>
            <div style={{ color: 'var(--qa-text-mid)', fontWeight: '600', marginBottom: '6px', fontSize: '13px' }}>No QA selected</div>
            <div style={{ fontSize: '11px', color: 'var(--qa-text-faint)', maxWidth: '280px', margin: '0 auto', lineHeight: '1.7' }}>
              Select a QA engineer to view their projects.
            </div>
          </div>
        : isLoading
          ? <div style={{ color: 'var(--qa-text-mid)', fontFamily: "'JetBrains Mono',monospace", fontSize: '13px' }}>Loading projects…</div>
          : filtered.length === 0
            ? <div style={{ textAlign: 'center', padding: '80px 20px', fontFamily: "'JetBrains Mono',monospace" }}>
                <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'rgba(124,106,247,0.08)', border: '1px solid rgba(124,106,247,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', margin: '0 auto 16px' }}>◈</div>
                <div style={{ color: 'var(--qa-text)', fontWeight: '600', marginBottom: '6px', fontSize: '14px' }}>
                  {search ? 'No results' : isTeamView ? 'No projects assigned' : 'No projects yet'}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--qa-text-faint)', maxWidth: '260px', margin: '8px auto 0', lineHeight: 1.6 }}>
                  {search ? 'Try a different search term.' : isTeamView ? 'This QA has no projects assigned yet.' : 'Create your first project to start tracking test cases, bugs, and automation.'}
                </div>
                {!search && !isTeamView && !isDevMode && (
                  <button
                    onClick={() => setShowAdd(true)}
                    style={{ marginTop: '20px', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 20px', borderRadius: '8px', background: 'var(--qa-accent)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '700', fontFamily: "'JetBrains Mono',monospace", letterSpacing: '.02em' }}
                  >
                    ＋ New Project
                  </button>
                )}
              </div>
            : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(340px,1fr))', gap: '18px' }}>
                {filtered.map((p: any) => (
                  <ProjCard
                    key={p.id}
                    p={p}
                    onClick={() => onProjectClick(p)}
                    onDelete={!isDevMode && !isTeamView && (user.role === 'admin' || user.role === 'qa_lead' || p.created_by === user.id)
                      ? () => setConfirmDeleteProj({ id: p.id, name: p.name })
                      : undefined}
                  />
                ))}
              </div>
      }

      {/* Team Modal */}
      {showTeam && (
        <Modal title="👥 QA Team — Click to view their projects" onClose={() => setShowTeam(false)}>
          {team.map((m: any) => (
            <div key={m.id} onClick={() => { setShowTeam(false); onProjectClick({ _viewQA: { id: m.id, name: m.name } }); }}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', borderBottom: `1px solid ${C.border}`, cursor: 'pointer', borderRadius: '8px', transition: 'background .15s' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,.04)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '9px', background: `${C.accent}20`, border: `1px solid ${C.accent}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '800', color: C.accent }}>{m.name[0]}</div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: C.text }}>{m.name}</div>
                  <div style={{ fontSize: '10px', color: C.accent, fontFamily: "'JetBrains Mono',monospace" }}>{roleLabel[m.role] || m.role}</div>
                </div>
              </div>
              <span style={{ fontSize: '12px', color: C.textDim }}>→</span>
            </div>
          ))}
          {['admin', 'qa_lead'].includes(user.role) && (
            <div style={{ marginTop: '16px' }}>
              <Btn icon="＋" onClick={() => { setShowTeam(false); setShowAddMember(true); }}>Add Member</Btn>
            </div>
          )}
        </Modal>
      )}

      {/* Add Member Modal */}
      {showAddMember && (
        <Modal title="Add Team Member" onClose={() => setShowAddMember(false)}>
          <Inp label="Full Name" ph="e.g. Raj Kumar" value={mName} onChange={setMName} req />
          <Inp label="Username" ph="e.g. rajkumar" value={mUsername} onChange={setMUsername} req />
          <Inp label="Password" ph="Temporary password" value={mPassword} onChange={setMPassword} eye req />
          <Sel label="Role" opts={[{ v: 'qa_engineer', l: 'QA Engineer' }, { v: 'qa_lead', l: 'QA Lead' }, { v: 'admin', l: 'Admin' }]} value={mRole} onChange={setMRole} />
          <div style={{ display: 'flex', gap: '10px' }}>
            <Btn onClick={() => addMemberMut.mutate({ name: mName, username: mUsername, password: mPassword, role: mRole })} disabled={addMemberMut.isPending}>Add Member</Btn>
            <Btn v="ghost" onClick={() => setShowAddMember(false)}>Cancel</Btn>
          </div>
        </Modal>
      )}

      {/* Delete Project Confirmation */}
      {confirmDeleteProj && (
        <ConfirmDeleteModal
          message={`Delete "${confirmDeleteProj.name}"? All test cases, bugs, documents, and automation scripts will be permanently removed.`}
          onConfirm={() => deleteProjMut.mutate(confirmDeleteProj.id)}
          onCancel={() => setConfirmDeleteProj(null)}
          isPending={deleteProjMut.isPending}
        />
      )}

      {/* Add Project Modal */}
      {showAdd && (
        <Modal title="＋ New Project" onClose={() => setShowAdd(false)}>
          <Inp label="Project Name" ph="e.g. Crypto AI Agent" value={pName} onChange={setPName} req />
          <Inp label="Project Code (max 10 chars)" ph="e.g. CAA or CRYPTOAI" value={pCode} onChange={v => setPCode(v.toUpperCase().slice(0, 10))} req />
          <Sel label="Application Type" opts={[{ v: 'web', l: '🌐 Web / Web App' }, { v: 'mobile', l: '📱 Mobile App' }, { v: 'both', l: '⚡ Both' }]} value={pType} onChange={setPType} />
          <Inp label="Figma Link" ph="https://figma.com/…" value={pFigma} onChange={setPFigma} />
          <Inp label="FRD Link" ph="https://drive.google.com/…" value={pFrd} onChange={setPFrd} />
          <Inp label="Description" ph="Brief project description" value={pDesc} onChange={setPDesc} />
          <div style={{ background: `${C.accent}08`, border: `1px solid ${C.accent}20`, borderRadius: '9px', padding: '10px 12px', fontSize: '11px', color: C.textMid, fontFamily: "'JetBrains Mono',monospace", marginBottom: '16px' }}>
            💡 Automation scripts will be auto-scaffolded based on app type. Figma & FRD can be added later.
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <Btn onClick={() => createMut.mutate({ name: pName, project_code: pCode, app_type: pType, figma_url: pFigma || null, frd_url: pFrd || null, description: pDesc })} disabled={createMut.isPending || !pName || pCode.length < 2}>
              {createMut.isPending ? 'Creating…' : 'Create Project'}
            </Btn>
            <Btn v="ghost" onClick={() => setShowAdd(false)}>Cancel</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
