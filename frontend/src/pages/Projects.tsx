import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { C, STATUS_COLORS, STATUS_LABELS, APP_TYPE_ICON, PRIORITY_COLORS } from '../lib/constants';
import { getProjects, getProjectsForQA, createProject, deleteProject, getTeam, addMember } from '../lib/api';
import { GCard, Chip, Btn, Modal, Inp, Sel, ConfirmDeleteModal } from '../components/ui/index';

function ProjCard({ p, onClick, onDelete }: { p: any; onClick: () => void; onDelete?: () => void }) {
  const ownerName = p.created_by_user?.name || '';
  const passRate = p.test_case_count ? Math.round((p.pass_count / p.test_case_count) * 100) : 0;
  const bc = p.status === 'active' ? C.accent : p.status === 'in_review' ? C.yellow : C.border;

  return (
    <GCard onClick={onClick} hover glow={bc} style={{ padding: '20px', opacity: p.status === 'completed' ? 0.6 : 1, position: 'relative' }}>
      {onDelete && (
        <button onClick={e => { e.stopPropagation(); onDelete(); }} title="Delete project" style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '6px', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '12px', color: '#ef4444', zIndex: 1 }}>🗑</button>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div>
          <div style={{ fontSize: '10px', color: C.accent, fontFamily: "'JetBrains Mono',monospace", marginBottom: '5px', letterSpacing: '0.05em' }}>{APP_TYPE_ICON[p.app_type]} {p.project_code}</div>
          <div style={{ fontSize: '14px', fontWeight: '600', color: C.text, lineHeight: 1.3 }}>{p.name}</div>
        </div>
        <Chip text={STATUS_LABELS[p.status] || p.status} color={STATUS_COLORS[p.status]} />
      </div>
      <div style={{ display: 'flex', gap: '5px', marginBottom: '14px', flexWrap: 'wrap' }}>
        <Chip text={p.figma_url ? 'Figma ✓' : 'Figma —'} color={p.figma_url ? C.purple : C.textDim} sm />
        <Chip text={p.frd_url ? 'FRD ✓' : 'FRD —'} color={p.frd_url ? C.blue : C.textDim} sm />
      </div>
      <div style={{ marginBottom: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
          <span style={{ fontSize: '10px', color: 'var(--qa-text-faint)', fontFamily: "'JetBrains Mono',monospace" }}>Pass Rate</span>
          <span style={{ fontSize: '10px', color: passRate > 80 ? C.green : passRate > 50 ? C.yellow : C.red, fontFamily: "'JetBrains Mono',monospace" }}>{passRate}%</span>
        </div>
        <div style={{ height: '2px', background: C.border, borderRadius: '2px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${passRate}%`, background: passRate > 80 ? C.green : passRate > 50 ? C.yellow : C.red, borderRadius: '2px', transition: 'width 0.4s ease' }} />
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          <span style={{ fontSize: '11px', color: 'var(--qa-text-faint)', fontFamily: "'JetBrains Mono',monospace" }}>🐛 {p.bug_count || 0}</span>
          <span style={{ fontSize: '11px', color: 'var(--qa-text-faint)', fontFamily: "'JetBrains Mono',monospace" }}>✓ {p.test_case_count || 0}</span>
        </div>
        {ownerName && (
          <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: `linear-gradient(135deg,${C.accent},${C.purple})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '800', color: '#ffffff', border: `2px solid ${C.card}`, fontFamily: "'JetBrains Mono',monospace" }}>
            {ownerName[0]}
          </div>
        )}
      </div>
    </GCard>
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
    <div style={{ padding: '28px 32px', width: '100%' }} className="fu">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: C.text, fontFamily: "'JetBrains Mono',monospace", letterSpacing: '-0.5px' }}>
            {pageTitle}
          </h1>
          <div style={{ fontSize: '12px', color: 'var(--qa-text-faint)', fontFamily: "'JetBrains Mono',monospace", marginTop: '4px' }}>
            <span style={{ color: C.green }}>{filtered.filter((p: any) => p.status === 'active').length} active</span> · {filtered.length} total
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginLeft: 'auto' }}>
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

      <input placeholder="Search projects…" value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%', maxWidth: '300px', background: 'var(--qa-input)', border: `1px solid ${C.border}`, borderRadius: '8px', padding: '8px 14px', color: C.text, fontSize: '12px', fontFamily: "'JetBrains Mono',monospace", outline: 'none', marginBottom: '22px' }} />

      {isDevMode && !qaForFetch
        ? <div style={{ textAlign: 'center', padding: '60px 20px', fontFamily: "'JetBrains Mono',monospace" }}>
            <div style={{ fontSize: '28px', marginBottom: '14px' }}>◈</div>
            <div style={{ color: 'var(--qa-text-faint)', fontWeight: '600', marginBottom: '6px', fontSize: '13px' }}>No QA selected</div>
            <div style={{ fontSize: '11px', color: 'var(--qa-text-xfaint)', maxWidth: '280px', margin: '0 auto', lineHeight: '1.7' }}>
              Select a QA engineer to view their projects.
            </div>
          </div>
        : isLoading
          ? <div style={{ color: 'var(--qa-text-faint)', fontFamily: "'JetBrains Mono',monospace", fontSize: '13px' }}>Loading projects…</div>
          : filtered.length === 0
            ? <div style={{ textAlign: 'center', padding: '60px 20px', fontFamily: "'JetBrains Mono',monospace" }}>
                <div style={{ fontSize: '28px', marginBottom: '12px' }}>◈</div>
                <div style={{ color: 'var(--qa-text-xfaint)', fontWeight: '600', marginBottom: '6px', fontSize: '13px' }}>No projects found</div>
                <div style={{ fontSize: '11px', color: 'var(--qa-text-xfaint)' }}>{search ? 'Try a different search term' : isTeamView ? 'This QA has no projects yet' : 'Click "New Project" to create one'}</div>
              </div>
            : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(268px,1fr))', gap: '16px' }}>
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
