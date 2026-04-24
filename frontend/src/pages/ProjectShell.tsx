import { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { C, STATUS_COLORS, STATUS_LABELS, APP_TYPE_ICON, PRIORITY_COLORS, LABEL_COLORS, PLATFORM_COLORS } from '../lib/constants';
import { getTestCases, createTestCase, updateTestCase, deleteTestCase, getBugs, createBug, updateBug, deleteBug, addComment, getComments, getAutomation, updateScript, deleteAutomationScript, uploadScript, getDocuments, addDocument, deleteDocument, updateProject, getSettings, getTeam, reassignProject, addAdditionalQA, getRoster, updateRoster, addBugResource, deleteBugResource, bulkImportTestCases, bulkImportBugs } from '../lib/api';
import { GCard, Chip, Btn, Modal, Inp, Sel, ConfirmDeleteModal } from '../components/ui/index';
import { OverheadTabs } from '../components/layout/index';

// ── DeveloperComboInput ───────────────────────────────────────
function DeveloperComboInput({ value, onChange, roster, onNewName, borderColor }: {
  value: string; onChange: (v: string) => void; roster: string[];
  onNewName: (name: string) => void; borderColor?: string;
}) {
  const [typing, setTyping] = useState(false);
  const [inputVal, setInputVal] = useState('');
  const bc = borderColor || C.blue;

  const confirm = (v: string) => {
    const name = v.trim();
    if (!name) { setTyping(false); return; }
    if (!roster.includes(name)) onNewName(name);
    onChange(name);
    setTyping(false);
    setInputVal('');
  };

  if (typing) {
    return (
      <input
        autoFocus
        value={inputVal}
        onChange={e => setInputVal(e.target.value)}
        placeholder="Type developer name…"
        onBlur={() => confirm(inputVal)}
        onKeyDown={e => {
          if (e.key === 'Enter') confirm(inputVal);
          if (e.key === 'Escape') { setTyping(false); setInputVal(''); }
        }}
        style={{ width: '100%', background: 'var(--qa-select-bg)', border: `1px solid ${bc}35`, borderRadius: '9px', padding: '9px 12px', color: C.text, fontSize: '13px', fontFamily: "'JetBrains Mono',monospace", outline: 'none', boxSizing: 'border-box' }}
      />
    );
  }

  return (
    <select
      value={value}
      onChange={e => e.target.value === '__new__' ? setTyping(true) : onChange(e.target.value)}
      style={{ width: '100%', background: 'var(--qa-select-bg)', border: `1px solid ${bc}35`, borderRadius: '9px', padding: '9px 12px', color: C.text, fontSize: '13px', fontFamily: "'JetBrains Mono',monospace", outline: 'none' }}
    >
      <option value="">Unassigned / Not set</option>
      {roster.map(n => <option key={n} value={n}>{n}</option>)}
      {value && !roster.includes(value) && <option value={value}>{value}</option>}
      <option value="__new__">＋ Add new name…</option>
    </select>
  );
}

// ── PDF helpers ────────────────────────────────────────────────
function exportSingleBugPDF(bug: any, projectName: string, projectCode: string) {
  const doc = new jsPDF();
  const pw = doc.internal.pageSize.getWidth();
  let y = 20;

  // Header bar
  doc.setFillColor(124, 106, 247);
  doc.rect(0, 0, pw, 12, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('O2H TECHNOLOGY — QUALITY ANALYSIS', 14, 8);

  y = 25;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(18);
  doc.text('BUG REPORT', 14, y);

  y += 8;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`${projectName} (${projectCode})`, 14, y);

  y += 6;
  doc.setDrawColor(124, 106, 247);
  doc.setLineWidth(0.5);
  doc.line(14, y, pw - 14, y);

  y += 10;
  const meta: [string, string][] = [
    ['Bug ID', `#${bug.sl_no}`],
    ['Module', bug.module],
    ['Status', bug.status],
    ['QA Status', bug.qa_status || 'Open'],
    ['Reported By', bug.reported_by_user?.name || '—'],
    ['Developed By', bug.developed_by || 'Not specified'],
    ['Assigned To', bug.assignee || 'Not assigned'],
    ['Reported On', new Date(bug.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })],
  ];
  doc.setFontSize(10);
  meta.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(80, 80, 80);
    doc.text(`${label}:`, 14, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text(value, 70, y);
    y += 7;
  });

  const addSection = (title: string, content: string) => {
    if (!content) return;
    y += 4;
    doc.setDrawColor(220, 220, 220);
    doc.line(14, y, pw - 14, y);
    y += 8;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(124, 106, 247);
    doc.text(title, 14, y);
    y += 6;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    const lines = doc.splitTextToSize(content, pw - 28);
    doc.text(lines, 14, y);
    y += (lines as string[]).length * 6;
  };

  addSection('SUMMARY', bug.summary);
  addSection('DEVELOPER COMMENT', bug.developer_comment || 'No comment added');
  addSection('QA COMMENT', bug.qa_comment || 'No comment added');
  addSection('BA COMMENT', bug.ba_comment || 'No comment added');

  const ph = doc.internal.pageSize.getHeight();
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(`Generated on ${new Date().toLocaleDateString()} — O2H Technology Quality Analysis`, 14, ph - 10);

  doc.save(`Bug_${projectCode}_${bug.sl_no}.pdf`);
}

// ── BugExpandedRow ─────────────────────────────────────────────
function BugExpandedRow({ bug, user, onClose, projectId, readOnly, roster, projectName, projectCode }: { bug: any; user: any; onClose: () => void; projectId: string; readOnly?: boolean; roster: string[]; projectName: string; projectCode: string }) {
  const qc = useQueryClient();
  const [devComment, setDevComment] = useState(bug.developer_comment || '');
  const [qaComment, setQaComment] = useState(bug.qa_comment || '');
  const [baComment, setBaComment] = useState(bug.ba_comment || '');
  const [qaStatus, setQaStatus] = useState(bug.qa_status || 'Open');
  const [assignee, setAssignee] = useState(bug.assignee || '');
  const [developedBy, setDevelopedBy] = useState(bug.developed_by || '');
  const [resourceUrl, setResourceUrl] = useState('');
  const [resourceLabel, setResourceLabel] = useState('');
  const [proofResource, setProofResource] = useState<any>(null);

  const isQA = ['admin', 'qa_lead', 'qa_engineer'].includes(user.role);
  const isDev = user.role === 'developer';

  const rosterAddMut = useMutation({
    mutationFn: (name: string) => updateRoster(projectId, { name, action: 'add' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['roster', projectId] }),
  });

  const mut = useMutation({
    mutationFn: (data: any) => updateBug(bug.id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['bugs', projectId] }); toast.success('Bug updated'); onClose(); },
    onError: () => toast.error('Failed to update bug'),
  });

  const addResourceMut = useMutation({
    mutationFn: (data: any) => addBugResource(bug.id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['bugs', projectId] }); setResourceUrl(''); setResourceLabel(''); toast.success('Resource added'); },
    onError: () => toast.error('Failed to add resource'),
  });

  const deleteResourceMut = useMutation({
    mutationFn: (resourceId: string) => deleteBugResource(bug.id, resourceId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bugs', projectId] }),
  });

  const save = () => mut.mutate({ developer_comment: devComment, qa_comment: qaComment, ba_comment: baComment, qa_status: qaStatus, assignee: assignee || null, developed_by: developedBy });

  const handleAddResource = () => {
    if (!resourceUrl.trim()) return;
    addResourceMut.mutate({ type: 'link', url: resourceUrl.trim(), label: resourceLabel.trim() || resourceUrl.trim() });
  };

  const isImageUrl = (url: string) => /\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?.*)?$/i.test(url) || /imgur\.com|cloudinary\.com|ibb\.co|i\.postimg\.cc/.test(url);
  const resources: any[] = bug.bug_resources || [];

  return (
    <tr>
      <td colSpan={8} style={{ padding: 0 }}>
        <div style={{ padding: '16px 20px', background: 'rgba(124,106,247,0.03)', borderTop: '1px solid rgba(124,106,247,0.1)', borderBottom: `1px solid ${C.border}` }}>

          {/* Assignee + Developed By */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 20px', marginBottom: '12px' }}>
            <div>
              <div style={{ fontSize: '10px', fontWeight: '700', color: C.blue, fontFamily: "'JetBrains Mono',monospace", letterSpacing: '.07em', textTransform: 'uppercase', marginBottom: '6px' }}>Assignee</div>
              {isDev && !readOnly ? (
                <DeveloperComboInput value={assignee} onChange={setAssignee} roster={roster} onNewName={n => rosterAddMut.mutate(n)} borderColor={C.blue} />
              ) : (
                <select value={assignee} onChange={e => setAssignee(e.target.value)} disabled={readOnly} style={{ width: '100%', background: 'var(--qa-select-bg)', border: `1px solid ${C.blue}35`, borderRadius: '9px', padding: '9px 12px', color: C.text, fontSize: '13px', fontFamily: "'JetBrains Mono',monospace", outline: 'none', opacity: readOnly ? 0.6 : 1 }}>
                  <option value="">Unassigned</option>
                  {roster.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              )}
            </div>
            <div>
              <div style={{ fontSize: '10px', fontWeight: '700', color: C.green, fontFamily: "'JetBrains Mono',monospace", letterSpacing: '.07em', textTransform: 'uppercase', marginBottom: '6px' }}>Developed By</div>
              {isDev && !readOnly ? (
                <DeveloperComboInput value={developedBy} onChange={setDevelopedBy} roster={roster} onNewName={n => rosterAddMut.mutate(n)} borderColor={C.green} />
              ) : (
                <select value={developedBy} onChange={e => setDevelopedBy(e.target.value)} disabled={readOnly} style={{ width: '100%', background: 'var(--qa-select-bg)', border: `1px solid ${C.green}35`, borderRadius: '9px', padding: '9px 12px', color: C.text, fontSize: '13px', fontFamily: "'JetBrains Mono',monospace", outline: 'none', opacity: readOnly ? 0.6 : 1 }}>
                  <option value="">Not set</option>
                  {roster.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 20px', marginBottom: '14px' }}>
            <div>
              <div style={{ fontSize: '10px', fontWeight: '700', color: C.purple, fontFamily: "'JetBrains Mono',monospace", letterSpacing: '.07em', textTransform: 'uppercase', marginBottom: '6px' }}>
                Developer Comment
              </div>
              <textarea rows={3} value={devComment} onChange={e => setDevComment(e.target.value)} readOnly={readOnly} placeholder="Explain the fix, reason not to fix, or technical notes…" style={{ width: '100%', background: 'rgba(167,139,250,0.05)', border: `1px solid ${C.purple}35`, borderRadius: '9px', padding: '9px 12px', color: C.text, fontSize: '12px', fontFamily: "'JetBrains Mono',monospace", outline: 'none', resize: 'vertical', opacity: readOnly ? 0.6 : 1 }} />
            </div>
            <div>
              <div style={{ fontSize: '10px', fontWeight: '700', color: C.accent, fontFamily: "'JetBrains Mono',monospace", letterSpacing: '.07em', textTransform: 'uppercase', marginBottom: '6px' }}>
                QA Comment
              </div>
              <textarea rows={3} value={qaComment} onChange={e => setQaComment(e.target.value)} disabled={isDev || readOnly} placeholder="Reopen reason, test notes, discussion with devs…" style={{ width: '100%', background: (isDev || readOnly) ? 'rgba(255,255,255,.02)' : 'rgba(110,231,247,0.05)', border: `1px solid ${C.accent}35`, borderRadius: '9px', padding: '9px 12px', color: (isDev || readOnly) ? C.textDim : C.text, fontSize: '12px', fontFamily: "'JetBrains Mono',monospace", outline: 'none', resize: 'vertical', opacity: (isDev || readOnly) ? 0.6 : 1 }} />
            </div>
            <div>
              <div style={{ fontSize: '10px', fontWeight: '700', color: C.yellow, fontFamily: "'JetBrains Mono',monospace", letterSpacing: '.07em', textTransform: 'uppercase', marginBottom: '6px' }}>QA Status</div>
              <select value={qaStatus} onChange={e => setQaStatus(e.target.value)} disabled={isDev || readOnly} style={{ width: '100%', background: 'var(--qa-select-bg)', border: `1px solid ${STATUS_COLORS[qaStatus] || C.border}`, borderRadius: '9px', padding: '9px 12px', color: STATUS_COLORS[qaStatus] || C.text, fontSize: '13px', fontFamily: "'JetBrains Mono',monospace", outline: 'none', opacity: (isDev || readOnly) ? 0.6 : 1 }}>
                {['Open','To Test','In Test','Done','Reopen','No Action'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize: '10px', fontWeight: '700', color: C.pink, fontFamily: "'JetBrains Mono',monospace", letterSpacing: '.07em', textTransform: 'uppercase', marginBottom: '6px' }}>BA Comment</div>
              <textarea rows={2} value={baComment} onChange={e => setBaComment(e.target.value)} readOnly={readOnly} placeholder="Business requirement notes…" style={{ width: '100%', background: 'rgba(244,114,182,0.04)', border: `1px solid ${C.pink}30`, borderRadius: '9px', padding: '9px 12px', color: C.text, fontSize: '12px', fontFamily: "'JetBrains Mono',monospace", outline: 'none', resize: 'vertical', opacity: readOnly ? 0.6 : 1 }} />
            </div>
          </div>

          {/* Resources / Proof */}
          <div style={{ marginBottom: '14px' }}>
            <div style={{ fontSize: '10px', fontWeight: '700', color: C.textMid, fontFamily: "'JetBrains Mono',monospace", letterSpacing: '.07em', textTransform: 'uppercase', marginBottom: '8px' }}>📎 Resources / Proof</div>
            {resources.length > 0 && (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
                {resources.map((r: any) => (
                  <div key={r.id} style={{ position: 'relative', flexShrink: 0 }}>
                    <div onClick={() => setProofResource(r)} style={{ width: '64px', height: '64px', borderRadius: '8px', border: `1px solid ${C.accent}35`, cursor: 'pointer', overflow: 'hidden', background: `${C.accent}08`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {isImageUrl(r.url) ? (
                        <img src={r.url} alt={r.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', padding: '4px', textAlign: 'center' }}>
                          <span style={{ fontSize: '20px' }}>🔗</span>
                          <span style={{ fontSize: '8px', color: C.textDim, fontFamily: "'JetBrains Mono',monospace", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '54px', display: 'block' }}>{r.label || 'Link'}</span>
                        </div>
                      )}
                    </div>
                    {!readOnly && (
                      <button onClick={() => deleteResourceMut.mutate(r.id)} style={{ position: 'absolute', top: '-6px', right: '-6px', background: C.red, border: 'none', borderRadius: '50%', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '10px', color: '#fff', lineHeight: 1, padding: 0 }}>×</button>
                    )}
                  </div>
                ))}
              </div>
            )}
            {!readOnly && (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input value={resourceUrl} onChange={e => setResourceUrl(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleAddResource(); }} placeholder="Paste screenshot URL, drive link, or recording…" style={{ flex: 1, background: 'var(--qa-input)', border: `1px solid ${C.border}`, borderRadius: '8px', padding: '8px 12px', color: C.text, fontSize: '12px', fontFamily: "'JetBrains Mono',monospace", outline: 'none' }} />
                <input value={resourceLabel} onChange={e => setResourceLabel(e.target.value)} placeholder="Label (optional)" style={{ width: '130px', background: 'var(--qa-input)', border: `1px solid ${C.border}`, borderRadius: '8px', padding: '8px 12px', color: C.text, fontSize: '12px', fontFamily: "'JetBrains Mono',monospace", outline: 'none' }} />
                <Btn sm v="ghost" onClick={handleAddResource} disabled={addResourceMut.isPending || !resourceUrl.trim()}>＋ Add</Btn>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            {!readOnly && <Btn sm onClick={save} disabled={mut.isPending}>Save Changes</Btn>}
            <Btn sm v="ghost" onClick={onClose}>{readOnly ? 'Close' : 'Discard'}</Btn>
            <Btn sm v="ghost" onClick={() => exportSingleBugPDF(bug, projectName, projectCode)}>📄 PDF</Btn>
          </div>
        </div>

        {/* Proof Viewer Overlay */}
        {proofResource && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(14px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '20px' }} onClick={() => setProofResource(null)}>
            <div style={{ position: 'relative', background: 'var(--qa-modal)', border: `1px solid ${C.border}`, borderRadius: '16px', padding: '28px', maxWidth: '92vw', maxHeight: '92vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
              <button onClick={() => setProofResource(null)} style={{ position: 'absolute', top: '12px', right: '16px', background: 'none', border: 'none', color: C.textDim, fontSize: '22px', cursor: 'pointer', lineHeight: 1 }}>×</button>
              {isImageUrl(proofResource.url) ? (
                <img src={proofResource.url} alt={proofResource.label} style={{ maxWidth: '80vw', maxHeight: '80vh', borderRadius: '10px', display: 'block' }} />
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 60px' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔗</div>
                  <div style={{ fontSize: '13px', color: C.text, fontFamily: "'JetBrains Mono',monospace", marginBottom: '20px', wordBreak: 'break-all' }}>{proofResource.label || proofResource.url}</div>
                  <a href={proofResource.url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', padding: '10px 28px', background: C.accent, color: '#fff', borderRadius: '9px', textDecoration: 'none', fontFamily: "'JetBrains Mono',monospace", fontSize: '13px', fontWeight: '700' }}>Open Link →</a>
                </div>
              )}
            </div>
          </div>
        )}
      </td>
    </tr>
  );
}

// ── TCExpandedRow ─────────────────────────────────────────────
function TCExpandedRow({ tc, user, onClose, projectId, readOnly }: { tc: any; user: any; onClose: () => void; projectId: string; readOnly?: boolean }) {
  const qc = useQueryClient();
  const [comment, setComment] = useState('');
  const [execStatus, setExecStatus] = useState(tc.execution_status);
  const [testResult, setTestResult] = useState(tc.test_result);

  const { data: comments = [] } = useQuery({ queryKey: ['comments', tc.id], queryFn: () => getComments('test_case', tc.id) });
  const isQA = ['admin', 'qa_lead', 'qa_engineer'].includes(user.role);

  const updateMut = useMutation({
    mutationFn: (data: any) => updateTestCase(tc.id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['testcases', projectId] }); toast.success('Test case updated'); onClose(); },
  });

  const commentMut = useMutation({
    mutationFn: (data: any) => addComment(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['comments', tc.id] }); setComment(''); toast.success('Comment posted'); },
  });

  const postComment = () => {
    if (!comment.trim()) return;
    commentMut.mutate({ entity_type: 'test_case', entity_id: tc.id, author_name: user.name, author_type: user.role === 'developer' ? 'developer' : 'qa', author_id: user.id || null, body: comment });
  };

  const stepsText = Array.isArray(tc.steps) ? tc.steps.map((s: any, i: number) => typeof s === 'object' ? `${i + 1}. ${s.action || s}` : `${i + 1}. ${s}`).join('\n') : tc.steps || '';

  return (
    <tr>
      <td colSpan={9} style={{ padding: 0 }}>
        <div style={{ padding: '16px 20px', background: 'rgba(124,106,247,0.03)', borderTop: '1px solid rgba(124,106,247,0.1)', borderBottom: `1px solid ${C.border}` }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px 20px', marginBottom: '14px' }}>
            <div style={{ gridColumn: '1/-1', padding: '12px 16px', background: 'rgba(255,255,255,.02)', border: `1px solid ${C.border}`, borderRadius: '9px' }}>
              <div style={{ fontSize: '10px', fontWeight: '700', color: C.textDim, fontFamily: "'JetBrains Mono',monospace", letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: '8px' }}>STEPS</div>
              <div style={{ color: C.text, fontSize: '12px', lineHeight: '1.9', whiteSpace: 'pre-wrap' }}>{stepsText || tc.preconditions || '—'}</div>
              {tc.expected_result && (
                <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: `1px solid ${C.border}` }}>
                  <div style={{ fontSize: '10px', fontWeight: '700', color: C.textDim, fontFamily: "'JetBrains Mono',monospace", letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: '6px' }}>EXPECTED RESULT</div>
                  <div style={{ color: C.green, fontSize: '12px', lineHeight: '1.6' }}>{tc.expected_result}</div>
                </div>
              )}
            </div>
            {isQA && <>
              <div>
                <div style={{ fontSize: '10px', fontWeight: '700', color: C.accent, fontFamily: "'JetBrains Mono',monospace", letterSpacing: '.07em', textTransform: 'uppercase', marginBottom: '6px' }}>Execution Status</div>
                <select value={execStatus} onChange={e => setExecStatus(e.target.value)} style={{ width: '100%', background: 'var(--qa-select-bg)', border: `1px solid ${STATUS_COLORS[execStatus] || C.border}`, borderRadius: '9px', padding: '9px 12px', color: STATUS_COLORS[execStatus] || C.text, fontSize: '13px', fontFamily: "'JetBrains Mono',monospace", outline: 'none' }}>
                  {['Not Executed','Executed'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <div style={{ fontSize: '10px', fontWeight: '700', color: C.accent, fontFamily: "'JetBrains Mono',monospace", letterSpacing: '.07em', textTransform: 'uppercase', marginBottom: '6px' }}>Test Result</div>
                <select value={testResult} onChange={e => setTestResult(e.target.value)} style={{ width: '100%', background: 'var(--qa-select-bg)', border: `1px solid ${STATUS_COLORS[testResult] || C.border}`, borderRadius: '9px', padding: '9px 12px', color: STATUS_COLORS[testResult] || C.text, fontSize: '13px', fontFamily: "'JetBrains Mono',monospace", outline: 'none' }}>
                  {['N/A','Pass','Fail','Blocked'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </>}
          </div>

          {/* Comments */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '10px', fontWeight: '700', color: C.textMid, fontFamily: "'JetBrains Mono',monospace", letterSpacing: '.07em', textTransform: 'uppercase', marginBottom: '10px' }}>💬 COMMENTS ({comments.length})</div>
            {comments.length === 0 && <div style={{ fontSize: '12px', color: C.textDim, fontFamily: "'JetBrains Mono',monospace", padding: '8px 0' }}>No comments yet — be the first</div>}
            {comments.map((cm: any) => (
              <div key={cm.id} style={{ marginBottom: '8px', padding: '10px 12px', background: 'rgba(255,255,255,.025)', border: `1px solid ${C.border}`, borderRadius: '9px', borderLeft: `3px solid ${cm.author_type === 'developer' ? C.purple : C.accent}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                  <div style={{ width: '22px', height: '22px', borderRadius: '6px', background: cm.author_type === 'developer' ? `${C.purple}25` : `${C.accent}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '800', color: cm.author_type === 'developer' ? C.purple : C.accent }}>{cm.author_name[0]}</div>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: cm.author_type === 'developer' ? C.purple : C.accent }}>{cm.author_name}</span>
                  <Chip text={cm.author_type === 'developer' ? '</> Dev' : '✓ QA'} color={cm.author_type === 'developer' ? C.purple : C.accent} sm />
                  <span style={{ fontSize: '10px', color: C.textDim, fontFamily: "'JetBrains Mono',monospace", marginLeft: 'auto' }}>{new Date(cm.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div style={{ fontSize: '12px', color: C.text, lineHeight: '1.6' }}>{cm.body}</div>
              </div>
            ))}
          </div>
          {!readOnly && (
            <div style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: user.role === 'developer' ? `${C.purple}25` : `${C.accent}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '800', color: user.role === 'developer' ? C.purple : C.accent, flexShrink: 0, marginTop: '1px' }}>{user.name[0]}</div>
                <textarea rows={2} value={comment} onChange={e => setComment(e.target.value)} placeholder={`Comment as ${user.name}…  Ctrl+Enter to post`} onKeyDown={e => { if (e.ctrlKey && e.key === 'Enter') postComment(); }} style={{ flex: 1, minWidth: 0, background: 'var(--qa-input)', border: `1px solid ${user.role === 'developer' ? C.purple + '40' : C.accent + '40'}`, borderRadius: '9px', padding: '9px 12px', color: C.text, fontSize: '12px', fontFamily: "'JetBrains Mono',monospace", outline: 'none', resize: 'none' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                <Btn sm onClick={postComment} v={user.role === 'developer' ? 'purple' : 'primary'} disabled={commentMut.isPending}>Post Comment</Btn>
              </div>
            </div>
          )}
          <div style={{ display: 'flex', gap: '8px' }}>
            {isQA && !readOnly && <Btn sm onClick={() => updateMut.mutate({ execution_status: execStatus, test_result: testResult })} disabled={updateMut.isPending}>Save Status</Btn>}
            <Btn sm v="ghost" onClick={onClose}>Close</Btn>
          </div>
        </div>
      </td>
    </tr>
  );
}

// ── ImportTestCasesModal ──────────────────────────────────────
function ImportTestCasesModal({ projectCode, onClose, onImport }: {
  projectCode: string;
  onClose: () => void;
  onImport: (rows: any[]) => void;
}) {
  const [preview, setPreview] = useState<any[]>([]);
  const [sheetUrl, setSheetUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const normalizeRow = (row: any) => {
    const n: any = {};
    Object.keys(row).forEach(k => { n[k.trim().toLowerCase().replace(/\s+/g, '_')] = typeof row[k] === 'string' ? row[k].trim() : row[k]; });
    console.log('[TC Import] Parsed keys:', Object.keys(n));
    const rawSteps = n['steps'] || '';
    const steps = typeof rawSteps === 'string'
      ? rawSteps.split(/\n|;/).map((s: string) => s.trim()).filter(Boolean).map((s: string) => s.replace(/^\d+\.\s*/, ''))
      : Array.isArray(rawSteps) ? rawSteps : [];
    const rawLabels = n['labels'] || '';
    return {
      module: n['module'] || 'General',
      summary: n['summary'] || '',
      preconditions: n['preconditions'] || '',
      steps,
      expected_result: n['expected_result'] || '',
      priority: n['priority'] || 'Medium',
      labels: typeof rawLabels === 'string' ? rawLabels.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
      platform: n['platform'] || 'Web',
      execution_status: 'Not Executed',
    };
  };

  const handleFile = (file: File) => {
    setError('');
    const reader = new FileReader();
    if (file.name.endsWith('.csv')) {
      reader.onload = e => {
        const result = Papa.parse(e.target?.result as string, { header: true, skipEmptyLines: true });
        setPreview((result.data as any[]).map(normalizeRow));
      };
      reader.readAsText(file);
    } else {
      reader.onload = e => {
        const wb = XLSX.read(new Uint8Array(e.target?.result as ArrayBuffer), { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        setPreview((XLSX.utils.sheet_to_json(ws) as any[]).map(normalizeRow));
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const handleSheetImport = async () => {
    const match = sheetUrl.match(/\/spreadsheets\/d\/([\w-]+)/);
    if (!match) { setError('Invalid Google Sheets URL'); return; }
    const csvUrl = `https://docs.google.com/spreadsheets/d/${match[1]}/export?format=csv`;
    setLoading(true);
    setError('');
    try {
      const resp = await fetch(csvUrl);
      const text = await resp.text();
      const result = Papa.parse(text, { header: true, skipEmptyLines: true });
      setPreview((result.data as any[]).map(normalizeRow));
    } catch {
      setError('Failed to fetch Google Sheet. Make sure it is publicly shared.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title={`Import Test Cases — ${projectCode}`} onClose={onClose} wide>
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '10px', fontWeight: '700', color: C.textMid, fontFamily: "'JetBrains Mono',monospace", letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: '8px' }}>Upload File (CSV or XLSX)</div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }} />
          <Btn sm v="ghost" onClick={() => fileRef.current?.click()}>📂 Choose File</Btn>
          <span style={{ fontSize: '11px', color: C.textDim, fontFamily: "'JetBrains Mono',monospace" }}>CSV or Excel (.xlsx)</span>
        </div>
      </div>
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '10px', fontWeight: '700', color: C.textMid, fontFamily: "'JetBrains Mono',monospace", letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: '8px' }}>Or Google Sheets URL</div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input value={sheetUrl} onChange={e => setSheetUrl(e.target.value)} placeholder="https://docs.google.com/spreadsheets/d/…" style={{ flex: 1, background: 'var(--qa-input)', border: `1px solid ${C.border}`, borderRadius: '8px', padding: '8px 12px', color: C.text, fontSize: '12px', fontFamily: "'JetBrains Mono',monospace", outline: 'none' }} />
          <Btn sm v="primary" onClick={handleSheetImport} disabled={loading || !sheetUrl.trim()}>{loading ? 'Fetching…' : 'Import'}</Btn>
        </div>
      </div>
      {error && <div style={{ fontSize: '12px', color: C.red, fontFamily: "'JetBrains Mono',monospace", marginBottom: '12px' }}>⚠ {error}</div>}
      {preview.length === 0 && (
        <div style={{ fontSize: '11px', color: C.textDim, fontFamily: "'JetBrains Mono',monospace", marginBottom: '14px' }}>
          <div style={{ fontWeight: '600', color: C.textMid, marginBottom: '6px' }}>Expected columns (case-insensitive):</div>
          <div>module, summary, preconditions, steps, expected_result, priority, labels, platform</div>
        </div>
      )}
      {preview.length > 0 && (
        <div>
          <div style={{ fontSize: '11px', color: C.green, fontFamily: "'JetBrains Mono',monospace", marginBottom: '8px' }}>✓ {preview.length} rows ready to import</div>
          <div style={{ overflowX: 'auto', maxHeight: '250px', overflowY: 'auto', borderRadius: '8px', border: `1px solid ${C.border}`, marginBottom: '14px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', fontFamily: "'JetBrains Mono',monospace" }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.03)', position: 'sticky', top: 0 }}>
                  {['Module', 'Summary', 'Priority', 'Platform', 'Labels'].map(h => (
                    <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: C.textMid, fontWeight: '600', letterSpacing: '.08em', textTransform: 'uppercase', fontSize: '10px', whiteSpace: 'nowrap', borderBottom: `1px solid ${C.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.map((row, i) => (
                  <tr key={i} style={{ borderBottom: i < preview.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                    <td style={{ padding: '6px 10px', color: C.textMid, whiteSpace: 'nowrap' }}>{row.module}</td>
                    <td style={{ padding: '6px 10px', color: C.text, maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.summary}</td>
                    <td style={{ padding: '6px 10px', whiteSpace: 'nowrap' }}><Chip text={row.priority} color={PRIORITY_COLORS[row.priority] || C.textDim} sm /></td>
                    <td style={{ padding: '6px 10px', color: C.textMid, whiteSpace: 'nowrap' }}>{row.platform}</td>
                    <td style={{ padding: '6px 10px', color: C.textDim }}>{Array.isArray(row.labels) ? row.labels.join(', ') : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <Btn onClick={() => onImport(preview)}>Import {preview.length} Test Cases</Btn>
            <Btn v="ghost" onClick={() => setPreview([])}>Clear</Btn>
            <Btn v="ghost" onClick={onClose}>Cancel</Btn>
          </div>
        </div>
      )}
    </Modal>
  );
}

// ── ImportBugsModal ───────────────────────────────────────────
function ImportBugsModal({ projectCode, onClose, onImport }: {
  projectCode: string;
  onClose: () => void;
  onImport: (rows: any[]) => void;
}) {
  const [preview, setPreview] = useState<any[]>([]);
  const [sheetUrl, setSheetUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const normalizeBugRow = (row: any) => {
    const n: any = {};
    Object.keys(row).forEach(k => { n[k.trim().toLowerCase().replace(/\s+/g, '_')] = typeof row[k] === 'string' ? row[k].trim() : row[k]; });
    console.log('[Bug Import] Parsed keys:', Object.keys(n));
    return {
      module: n['module'] || 'General',
      summary: n['summary'] || n['bug_summary'] || '',
      assignee: n['assignee'] || '',
      developed_by: n['developed_by'] || '',
      status: n['status'] || 'Open',
      developer_comment: n['developer_comment'] || '',
      qa_status: n['qa_status'] || 'Open',
      qa_comment: n['qa_comment'] || '',
      ba_comment: n['ba_comment'] || '',
    };
  };

  const handleFile = (file: File) => {
    setError('');
    const reader = new FileReader();
    if (file.name.endsWith('.csv')) {
      reader.onload = e => {
        const result = Papa.parse(e.target?.result as string, { header: true, skipEmptyLines: true });
        setPreview((result.data as any[]).map(normalizeBugRow));
      };
      reader.readAsText(file);
    } else {
      reader.onload = e => {
        const wb = XLSX.read(new Uint8Array(e.target?.result as ArrayBuffer), { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        setPreview((XLSX.utils.sheet_to_json(ws) as any[]).map(normalizeBugRow));
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const handleSheetImport = async () => {
    const match = sheetUrl.match(/\/spreadsheets\/d\/([\w-]+)/);
    if (!match) { setError('Invalid Google Sheets URL'); return; }
    const csvUrl = `https://docs.google.com/spreadsheets/d/${match[1]}/export?format=csv`;
    setLoading(true); setError('');
    try {
      const resp = await fetch(csvUrl);
      const text = await resp.text();
      const result = Papa.parse(text, { header: true, skipEmptyLines: true });
      setPreview((result.data as any[]).map(normalizeBugRow));
    } catch {
      setError('Failed to fetch Google Sheet. Make sure it is publicly shared.');
    } finally { setLoading(false); }
  };

  return (
    <Modal title={`Import Bugs — ${projectCode}`} onClose={onClose} wide>
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '10px', fontWeight: '700', color: C.textMid, fontFamily: "'JetBrains Mono',monospace", letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: '8px' }}>Upload File (CSV or XLSX)</div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }} />
          <Btn sm v="ghost" onClick={() => fileRef.current?.click()}>📂 Choose File</Btn>
          <span style={{ fontSize: '11px', color: C.textDim, fontFamily: "'JetBrains Mono',monospace" }}>CSV or Excel (.xlsx)</span>
        </div>
      </div>
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '10px', fontWeight: '700', color: C.textMid, fontFamily: "'JetBrains Mono',monospace", letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: '8px' }}>Or Google Sheets URL</div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input value={sheetUrl} onChange={e => setSheetUrl(e.target.value)} placeholder="https://docs.google.com/spreadsheets/d/…" style={{ flex: 1, background: 'var(--qa-input)', border: `1px solid ${C.border}`, borderRadius: '8px', padding: '8px 12px', color: C.text, fontSize: '12px', fontFamily: "'JetBrains Mono',monospace", outline: 'none' }} />
          <Btn sm v="primary" onClick={handleSheetImport} disabled={loading || !sheetUrl.trim()}>{loading ? 'Fetching…' : 'Import'}</Btn>
        </div>
      </div>
      {error && <div style={{ fontSize: '12px', color: C.red, fontFamily: "'JetBrains Mono',monospace", marginBottom: '12px' }}>⚠ {error}</div>}
      {preview.length === 0 && (
        <div style={{ fontSize: '11px', color: C.textDim, fontFamily: "'JetBrains Mono',monospace", marginBottom: '14px' }}>
          <div style={{ fontWeight: '600', color: C.textMid, marginBottom: '6px' }}>Expected columns (case-insensitive):</div>
          <div>Module, Summary, Assignee, Developed By, Status, Developer Comment, QA Status, QA Comment, BA Comment</div>
        </div>
      )}
      {preview.length > 0 && (
        <div>
          <div style={{ fontSize: '11px', color: C.green, fontFamily: "'JetBrains Mono',monospace", marginBottom: '8px' }}>✓ {preview.length} rows ready to import</div>
          <div style={{ overflowX: 'auto', maxHeight: '250px', overflowY: 'auto', borderRadius: '8px', border: `1px solid ${C.border}`, marginBottom: '14px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', fontFamily: "'JetBrains Mono',monospace" }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.03)', position: 'sticky', top: 0 }}>
                  {['Module', 'Summary', 'Assignee', 'Status', 'QA Status'].map(h => (
                    <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: C.textMid, fontWeight: '600', letterSpacing: '.08em', textTransform: 'uppercase', fontSize: '10px', whiteSpace: 'nowrap', borderBottom: `1px solid ${C.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.map((row, i) => (
                  <tr key={i} style={{ borderBottom: i < preview.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                    <td style={{ padding: '6px 10px', color: C.textMid, whiteSpace: 'nowrap' }}>{row.module}</td>
                    <td style={{ padding: '6px 10px', color: C.text, maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.summary}</td>
                    <td style={{ padding: '6px 10px', color: C.textDim, whiteSpace: 'nowrap' }}>{row.assignee || '—'}</td>
                    <td style={{ padding: '6px 10px', whiteSpace: 'nowrap' }}><Chip text={row.status} color={STATUS_COLORS[row.status] || C.textDim} sm /></td>
                    <td style={{ padding: '6px 10px', whiteSpace: 'nowrap' }}><Chip text={row.qa_status} color={STATUS_COLORS[row.qa_status] || C.textDim} sm /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <Btn v="danger" onClick={() => onImport(preview)}>Import {preview.length} Bugs</Btn>
            <Btn v="ghost" onClick={() => setPreview([])}>Clear</Btn>
            <Btn v="ghost" onClick={onClose}>Cancel</Btn>
          </div>
        </div>
      )}
    </Modal>
  );
}

// ── ProjectShell ──────────────────────────────────────────────
export function ProjectShell({ project, onBack, user, page, setPage, readOnly, onReassignComplete }: {
  project: any; onBack: () => void; user: any; page: string; setPage: (p: string) => void;
  readOnly?: boolean; onReassignComplete?: () => void;
}) {
  const qc = useQueryClient();
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [localStatus, setLocalStatus] = useState(project.status);
  const statusDropdownRef = useRef<HTMLDivElement>(null);
  const [editingCode, setEditingCode] = useState(false);
  const [codeValue, setCodeValue] = useState(project.project_code);
  const [expandedBug, setExpandedBug] = useState<string | null>(null);
  const [expandedTC, setExpandedTC] = useState<string | null>(null);
  const [addBug, setAddBug] = useState(false);
  const [addTC, setAddTC] = useState(false);
  const [showReassign, setShowReassign] = useState(false);
  const [reassignOwnerId, setReassignOwnerId] = useState('');
  const [reassignAction, setReassignAction] = useState<'transfer' | 'additional' | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ type: string; id: string; label: string } | null>(null);
  const [showAddChoice, setShowAddChoice] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showBugAddChoice, setShowBugAddChoice] = useState(false);
  const [showBugImport, setShowBugImport] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showBugExportMenu, setShowBugExportMenu] = useState(false);
  const [bugView, setBugView] = useState<'table' | 'kanban'>('table');
  const [uploadingScriptId, setUploadingScriptId] = useState<string | null>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const bugExportMenuRef = useRef<HTMLDivElement>(null);
  const scriptFileRef = useRef<HTMLInputElement>(null);
  const [newDevName, setNewDevName] = useState('');
  const [figmaInputVal, setFigmaInputVal] = useState('');
  const [frdInputVal, setFrdInputVal] = useState('');

  // Bug form
  const [bModule, setBModule] = useState(''); const [bSummary, setBSummary] = useState('');
  const [bAssignee, setBAssignee] = useState(''); const [bDevelopedBy, setBDevelopedBy] = useState('');
  const [bStatus, setBStatus] = useState('Open');
  const [bQAStatus, setBQAStatus] = useState('Open'); const [bQAComment, setBQAComment] = useState('');

  // TC form
  const [tcModule, setTcModule] = useState(''); const [tcSummary, setTcSummary] = useState('');
  const [tcPriority, setTcPriority] = useState('Medium'); const [tcPlatform, setTcPlatform] = useState('Web');
  const [tcPre, setTcPre] = useState(''); const [tcExec, setTcExec] = useState('Not Executed');
  const [tcLabels, setTcLabels] = useState<string[]>([]); const [tcSteps, setTcSteps] = useState('');


  const { data: testCases = [], isSuccess: tcFetched } = useQuery({ queryKey: ['testcases', project.id], queryFn: () => getTestCases(project.id), enabled: page === 'testcases' || page === 'overview' });
  const { data: bugs = [], isSuccess: bugsFetched } = useQuery({ queryKey: ['bugs', project.id], queryFn: () => getBugs(project.id), enabled: page === 'bugs' || page === 'overview' });
  const { data: scripts = [] } = useQuery({ queryKey: ['automation', project.id], queryFn: () => getAutomation(project.id), enabled: page === 'automation' });
  const { data: documents = [] } = useQuery({ queryKey: ['documents', project.id], queryFn: () => getDocuments(project.id), enabled: page === 'documents' });
  const { data: settings } = useQuery({ queryKey: ['settings'], queryFn: getSettings });
  const { data: roster = [] } = useQuery<string[]>({ queryKey: ['roster', project.id], queryFn: () => getRoster(project.id) });
  const canReassign = user.role === 'admin' || user.role === 'qa_lead';
  const { data: teamForReassign = [] } = useQuery({
    queryKey: ['team'],
    queryFn: getTeam,
    enabled: canReassign && !!localStorage.getItem('qa_token'),
  });

  const labelOptions: string[] = (settings?.label || []).map((s: any) => s.value);
  const platformOptions: string[] = (settings?.platform || []).map((s: any) => s.value).filter(Boolean);
  const effectivePlatforms = platformOptions.length > 0 ? platformOptions : ['Web', 'Android', 'iOS', 'Both'];

  const resetTcForm = () => {
    setTcModule(''); setTcSummary(''); setTcPriority('Medium');
    setTcPlatform('Web'); setTcPre(''); setTcExec('Not Executed');
    setTcLabels([]); setTcSteps('');
  };

  // Owner, admin, or additional QA has write access; team view is always read-only
  const canEdit = !readOnly && (user.role === 'admin' || project.created_by === user.id || (project.additional_qas || []).includes(user.id));
  // qa_lead can also delete anything
  const canDelete = !readOnly && (user.role === 'admin' || user.role === 'qa_lead' || project.created_by === user.id);

  const createBugMut = useMutation({
    mutationFn: createBug,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['bugs', project.id] }); setAddBug(false); toast.success('Bug logged!'); },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed'),
  });

  const createTCMut = useMutation({
    mutationFn: createTestCase,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['testcases', project.id] }); setAddTC(false); resetTcForm(); toast.success('Test case created!'); },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed'),
  });

  const saveBugStatusMut = useMutation({
    mutationFn: ({ id, status }: any) => updateBug(id, { status }),
    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: ['bugs', project.id] });
      const previousBugs = qc.getQueryData(['bugs', project.id]);
      qc.setQueryData(['bugs', project.id], (old: any) =>
        (old || []).map((b: any) => b.id === id ? { ...b, status } : b)
      );
      return { previousBugs };
    },
    onError: (_err: any, _vars: any, context: any) => {
      if (context?.previousBugs) qc.setQueryData(['bugs', project.id], context.previousBugs);
    },
    onSuccess: () => {
      if (localStorage.getItem('qa_token')) qc.invalidateQueries({ queryKey: ['bugs', project.id] });
    },
  });

  const reassignMut = useMutation({
    mutationFn: (newOwnerId: string) => reassignProject(project.id, newOwnerId),
    onSuccess: (_data: any, newOwnerId: string) => {
      const newOwner = (teamForReassign as any[]).find((m: any) => m.id === newOwnerId);
      toast.success(`Project transferred to ${newOwner?.name || 'new owner'}`);
      setShowReassign(false); setReassignOwnerId(''); setReassignAction(null);
      onReassignComplete?.();
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed to reassign project'),
  });

  const addAdditionalQAMut = useMutation({
    mutationFn: (qaId: string) => addAdditionalQA(project.id, qaId),
    onSuccess: (_data: any, qaId: string) => {
      const qa = (teamForReassign as any[]).find((m: any) => m.id === qaId);
      toast.success(`${qa?.name || 'QA'} added to project`);
      qc.invalidateQueries({ queryKey: ['project', project.id] });
      setShowReassign(false); setReassignOwnerId(''); setReassignAction(null);
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed to add QA'),
  });

  const removeAdditionalQAMut = useMutation({
    mutationFn: (qaId: string) => updateProject(project.id, { additional_qas: (project.additional_qas || []).filter((id: string) => id !== qaId) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['project', project.id] }); toast.success('QA removed'); },
    onError: () => toast.error('Failed to remove QA'),
  });

  const deleteTCMut = useMutation({
    mutationFn: (id: string) => deleteTestCase(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['testcases', project.id] }); setConfirmDelete(null); toast.success('Test case deleted'); },
    onError: () => toast.error('Failed to delete'),
  });

  const deleteBugMut = useMutation({
    mutationFn: (id: string) => deleteBug(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['bugs', project.id] }); setConfirmDelete(null); toast.success('Bug deleted'); },
    onError: () => toast.error('Failed to delete'),
  });

  const deleteScriptMut = useMutation({
    mutationFn: (id: string) => deleteAutomationScript(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['automation', project.id] }); setConfirmDelete(null); toast.success('Script deleted'); },
    onError: () => toast.error('Failed to delete'),
  });

  const deleteDocMut = useMutation({
    mutationFn: (id: string) => deleteDocument(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['documents', project.id] }); setConfirmDelete(null); toast.success('Document deleted'); },
    onError: () => toast.error('Failed to delete'),
  });

  const handleDeleteConfirm = () => {
    if (!confirmDelete) return;
    const { type, id } = confirmDelete;
    if (type === 'tc') deleteTCMut.mutate(id);
    else if (type === 'bug') deleteBugMut.mutate(id);
    else if (type === 'script') deleteScriptMut.mutate(id);
    else if (type === 'doc') deleteDocMut.mutate(id);
  };

  const isDeleting = deleteTCMut.isPending || deleteBugMut.isPending || deleteScriptMut.isPending || deleteDocMut.isPending;

  const rosterMut = useMutation({
    mutationFn: (data: { name: string; action: 'add' | 'remove' }) => updateRoster(project.id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['roster', project.id] }); setNewDevName(''); },
    onError: () => toast.error('Failed to update roster'),
  });

  const bulkImportMut = useMutation({
    mutationFn: (testCases: any[]) => bulkImportTestCases(project.id, testCases),
    onSuccess: (data: any) => {
      qc.invalidateQueries({ queryKey: ['testcases', project.id] });
      setShowImport(false);
      setShowAddChoice(false);
      toast.success(`Imported ${data.imported} test cases!`);
    },
    onError: () => toast.error('Import failed'),
  });

  const bulkImportBugsMut = useMutation({
    mutationFn: (bugs: any[]) => bulkImportBugs(project.id, bugs),
    onSuccess: (data: any) => {
      qc.invalidateQueries({ queryKey: ['bugs', project.id] });
      setShowBugImport(false);
      setShowBugAddChoice(false);
      toast.success(`Imported ${data.imported} bugs!`);
    },
    onError: () => toast.error('Bug import failed'),
  });

  const updateProjectMut = useMutation({
    mutationFn: (data: any) => updateProject(project.id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['projects'] }); toast.success('Project updated!'); },
  });

  const uploadScriptMut = useMutation({
    mutationFn: ({ id, content, file_name }: { id: string; content: string; file_name: string }) =>
      uploadScript(id, { content, file_name }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['automation', project.id] });
      setUploadingScriptId(null);
      toast.success('Script uploaded!');
    },
    onError: () => toast.error('Upload failed'),
  });

  const exportTestCases = (format: 'csv' | 'xlsx') => {
    const rows = (testCases as any[]).map((t: any) => {
      const steps = Array.isArray(t.steps)
        ? t.steps.map((s: any, i: number) => `${i + 1}. ${typeof s === 'object' ? (s.action || s) : s}`).join('\n')
        : (t.steps || '');
      return {
        'Test Case ID': t.test_case_id,
        'Module': t.module,
        'Test Case Summary': t.summary,
        'Test Case Pre-conditions': t.preconditions || '',
        'Test Case Steps': steps,
        'Expected Results': t.expected_result || '',
        'Test Case Priority': t.priority,
        'Test Case Label': Array.isArray(t.labels) ? t.labels.join(', ') : (t.labels || ''),
        'Platform': t.platform,
        'Execution Status': t.execution_status,
        'Test Result': t.test_result,
      };
    });
    const fileName = `${project.project_code}_test_cases`;
    if (format === 'csv') {
      const csv = Papa.unparse(rows);
      saveAs(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), `${fileName}.csv`);
    } else {
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Test Cases');
      XLSX.writeFile(wb, `${fileName}.xlsx`);
    }
    setShowExportMenu(false);
  };

  const exportBugs = (format: 'csv' | 'xlsx') => {
    const rows = (bugs as any[]).map((b: any) => ({
      'Sl No': b.sl_no,
      'Module': b.module,
      'Summary': b.summary,
      'Reported By': b.reported_by_user?.name || '',
      'Developed By': b.developed_by || '',
      'Assignee': b.assignee || '',
      'Status': b.status,
      'Developer Comment': b.developer_comment || '',
      'QA Status': b.qa_status || '',
      'QA Comment': b.qa_comment || '',
      'BA Comment': b.ba_comment || '',
      'Created At': new Date(b.created_at).toLocaleDateString(),
    }));
    const fileName = `${project.project_code}_bugs`;
    if (format === 'csv') {
      const csv = Papa.unparse(rows);
      saveAs(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), `${fileName}.csv`);
    } else {
      const ws = XLSX.utils.json_to_sheet(rows);
      ws['!cols'] = [
        { wch: 8 }, { wch: 20 }, { wch: 40 }, { wch: 20 }, { wch: 20 },
        { wch: 20 }, { wch: 15 }, { wch: 40 }, { wch: 15 }, { wch: 40 }, { wch: 40 }, { wch: 15 },
      ];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Bugs');
      XLSX.writeFile(wb, `${fileName}.xlsx`);
    }
    setShowBugExportMenu(false);
  };

  const exportProjectBugReportPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape' });
    const pw = doc.internal.pageSize.getWidth();
    let y = 20;

    doc.setFillColor(124, 106, 247);
    doc.rect(0, 0, pw, 12, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('O2H TECHNOLOGY — QUALITY ANALYSIS', 14, 8);

    y = 25;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(20);
    doc.text('PROJECT BUG REPORT', 14, y);

    y += 8;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(`${project.name} (${project.project_code})  —  Generated: ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}`, 14, y);

    y += 6;
    doc.setDrawColor(124, 106, 247);
    doc.line(14, y, pw - 14, y);

    y += 10;
    const bugList = bugs as any[];
    const stats = [
      `Total: ${bugList.length}`,
      `Open: ${bugList.filter((b: any) => b.status === 'Open').length}`,
      `In Progress: ${bugList.filter((b: any) => b.status === 'In Progress').length}`,
      `Fixed: ${bugList.filter((b: any) => b.status === 'Fixed').length}`,
      `Closed: ${bugList.filter((b: any) => b.status === 'Closed').length}`,
    ];
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('OVERVIEW', 14, y);
    y += 7;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    stats.forEach((s, i) => doc.text(s, 14 + i * 55, y));

    const devCounts: Record<string, number> = {};
    bugList.forEach((b: any) => { if (b.developed_by) devCounts[b.developed_by] = (devCounts[b.developed_by] || 0) + 1; });
    if (Object.keys(devCounts).length > 0) {
      y += 12;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('BUGS BY DEVELOPER', 14, y);
      y += 6;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      Object.entries(devCounts).forEach(([dev, count], i) => doc.text(`${dev}: ${count}`, 14 + i * 60, y));
    }

    y += 14;
    autoTable(doc, {
      startY: y,
      head: [['#', 'Module', 'Summary', 'Developed By', 'Assignee', 'Status', 'QA Status']],
      body: bugList.map((b: any) => [`#${b.sl_no}`, b.module, b.summary, b.developed_by || '—', b.assignee || '—', b.status, b.qa_status || 'Open']),
      headStyles: { fillColor: [124, 106, 247], textColor: 255, fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      alternateRowStyles: { fillColor: [248, 248, 255] },
      columnStyles: { 0: { cellWidth: 14 }, 1: { cellWidth: 28 }, 2: { cellWidth: 82 }, 3: { cellWidth: 34 }, 4: { cellWidth: 34 }, 5: { cellWidth: 24 }, 6: { cellWidth: 24 } },
      margin: { left: 14, right: 14 },
    });

    const ph = doc.internal.pageSize.getHeight();
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Generated on ${new Date().toLocaleDateString()} — O2H Technology Quality Analysis`, 14, ph - 10);

    doc.save(`${project.project_code}_Bug_Report.pdf`);
    setShowBugExportMenu(false);
  };

  const downloadScript = (s: any) => {
    const ext = s.type === 'playwright' ? '.spec.ts' : '.py';
    const name = s.file_name || `${s.script_name}${ext}`;
    saveAs(new Blob([s.content || ''], { type: 'text/plain;charset=utf-8' }), name);
  };

  const downloadAllScripts = async () => {
    const zip = new JSZip();
    (scripts as any[]).forEach((s: any) => {
      const ext = s.type === 'playwright' ? '.spec.ts' : '.py';
      zip.file(s.file_name || `${s.script_name}${ext}`, s.content || '');
    });
    const blob = await zip.generateAsync({ type: 'blob' });
    saveAs(blob, `${project.project_code}_automation_scripts.zip`);
  };

  const statusMut = useMutation({
    mutationFn: (newStatus: string) => updateProject(project.id, { status: newStatus }),
    onSuccess: (_data: any, newStatus: string) => {
      setLocalStatus(newStatus);
      qc.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Status updated');
    },
  });

  const codeUpdateMut = useMutation({
    mutationFn: (newCode: string) => updateProject(project.id, { project_code: newCode }),
    onSuccess: (_data: any, newCode: string) => {
      setCodeValue(newCode);
      setEditingCode(false);
      qc.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project code updated');
    },
  });

  useEffect(() => {
    if (!showStatusDropdown) return;
    const handler = (e: MouseEvent) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(e.target as Node)) {
        setShowStatusDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showStatusDropdown]);

  useEffect(() => {
    if (!showExportMenu) return;
    const handler = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showExportMenu]);

  useEffect(() => {
    if (!showBugExportMenu) return;
    const handler = (e: MouseEvent) => {
      if (bugExportMenuRef.current && !bugExportMenuRef.current.contains(e.target as Node)) {
        setShowBugExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showBugExportMenu]);

  return (
    <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }} className="fu">
      {/* Project header */}
      <div style={{ padding: '13px 32px', borderBottom: '1px solid var(--qa-sidebar-bdr)', background: 'var(--qa-sidebar)', position: 'sticky', top: 0, zIndex: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={onBack} style={{ background: 'rgba(124,106,247,0.08)', border: '1px solid rgba(124,106,247,0.2)', color: '#7c6af7', cursor: 'pointer', fontFamily: "'JetBrains Mono',monospace", fontSize: '11px', fontWeight: '600', borderRadius: '7px', padding: '5px 12px' }}>← Projects</button>
          <span style={{ color: C.border }}>│</span>
          {canEdit && editingCode ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <input
                autoFocus
                value={codeValue}
                onChange={e => setCodeValue(e.target.value.toUpperCase().slice(0, 10))}
                onKeyDown={e => {
                  if (e.key === 'Escape') { setCodeValue(project.project_code); setEditingCode(false); }
                  if (e.key === 'Enter') codeUpdateMut.mutate(codeValue);
                }}
                style={{ background: 'var(--qa-input)', border: `1px solid ${C.accent}`, borderRadius: '6px', padding: '4px 10px', color: C.accent, fontSize: '11px', fontFamily: "'JetBrains Mono',monospace", width: '100px', outline: 'none' }}
              />
              <Btn sm onClick={() => codeUpdateMut.mutate(codeValue)} disabled={codeUpdateMut.isPending || codeValue.length < 2}>Save</Btn>
            </div>
          ) : (
            <div onClick={canEdit ? () => setEditingCode(true) : undefined} style={{ cursor: canEdit ? 'pointer' : 'default' }}>
              <Chip text={codeValue} color={C.accent} />
            </div>
          )}
          <span style={{ fontSize: '16px', fontWeight: '800', color: C.text, fontFamily: "'JetBrains Mono',monospace" }}>{project.name}</span>
          <div ref={statusDropdownRef} style={{ position: 'relative' }}>
            <div onClick={canEdit ? () => setShowStatusDropdown(v => !v) : undefined} style={{ cursor: canEdit ? 'pointer' : 'default' }}>
              <Chip text={STATUS_LABELS[localStatus] || localStatus} color={STATUS_COLORS[localStatus]} />
            </div>
            {canEdit && showStatusDropdown && (
              <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 50, background: 'var(--qa-modal)', border: `1px solid ${C.border}`, borderRadius: '10px', padding: '6px', minWidth: '140px' }}>
                {[
                  { v: 'active', l: 'Active', c: C.green },
                  { v: 'in_review', l: 'In Review', c: C.yellow },
                  { v: 'on_hold', l: 'On Hold', c: '#fb923c' },
                  { v: 'completed', l: 'Completed', c: C.textDim },
                ].map(opt => (
                  <div
                    key={opt.v}
                    onClick={() => { statusMut.mutate(opt.v); setShowStatusDropdown(false); }}
                    style={{ padding: '8px 14px', fontSize: '12px', fontFamily: "'JetBrains Mono',monospace", cursor: 'pointer', color: opt.c, borderRadius: '6px' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                  >
                    {opt.l}
                  </div>
                ))}
              </div>
            )}
          </div>
          <Chip text={`${APP_TYPE_ICON[project.app_type]} ${project.app_type?.toUpperCase()}`} color={C.blue} />
          {readOnly && <Chip text="Read Only" color={C.yellow} />}
          {canReassign && (
            <Btn sm v="ghost" onClick={() => { setReassignOwnerId(''); setReassignAction(null); setShowReassign(true); }}>Manage QA</Btn>
          )}
        </div>
      </div>
      <OverheadTabs page={page} setPage={setPage} />

      <div style={{ padding: '28px 32px', width: '100%', flex: 1 }}>

        {/* OVERVIEW */}
        {page === 'overview' && (
          <div className="fu">
            <h3 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: '700', color: C.text, fontFamily: "'JetBrains Mono',monospace", letterSpacing: '-0.3px' }}>Overview</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(175px,1fr))', gap: '14px', marginBottom: '24px' }}>
              {[
                { l: 'Test Cases', v: tcFetched ? testCases.length : (project.test_case_count || 0), c: C.accent },
                { l: 'Open Bugs', v: bugsFetched ? bugs.length : (project.bug_count || 0), c: C.red },
                { l: 'Assigned QAs', v: (project.project_assignments || []).length, c: C.purple },
              ].map(s => (
                <GCard key={s.l} style={{ padding: '18px 20px' }} glow={s.c}>
                  <div style={{ fontSize: '28px', fontWeight: '800', color: s.c, fontFamily: "'JetBrains Mono',monospace", letterSpacing: '-1px' }}>{s.v}</div>
                  <div style={{ fontSize: '11px', color: C.textMid, marginTop: '4px' }}>{s.l}</div>
                </GCard>
              ))}
            </div>
            {/* QA Assignments */}
            <GCard style={{ padding: '20px', marginBottom: '16px' }} glow={C.accent}>
              <div style={{ fontSize: '10px', fontWeight: '700', color: C.textMid, fontFamily: "'JetBrains Mono',monospace", letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: '12px' }}>🧪 QA Engineers</div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {/* Primary owner */}
                {project.created_by_user && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: `${C.accent}12`, border: `1px solid ${C.accent}35`, borderRadius: '20px' }}>
                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: `${C.accent}20`, border: `1px solid ${C.accent}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: '700', color: C.accent }}>{project.created_by_user.name[0]}</div>
                    <span style={{ fontSize: '12px', color: C.text, fontFamily: "'JetBrains Mono',monospace" }}>{project.created_by_user.name}</span>
                    <span style={{ fontSize: '9px', color: C.accent, fontFamily: "'JetBrains Mono',monospace", letterSpacing: '.05em' }}>OWNER</span>
                  </div>
                )}
                {/* Additional QAs */}
                {(project.additional_qas || []).map((qaId: string) => {
                  const qa = (teamForReassign as any[]).find((m: any) => m.id === qaId);
                  if (!qa) return null;
                  return (
                    <div key={qaId} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: 'var(--qa-input)', border: `1px solid ${C.border}`, borderRadius: '20px' }}>
                      <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: `${C.purple}20`, border: `1px solid ${C.purple}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: '700', color: C.purple }}>{qa.name[0]}</div>
                      <span style={{ fontSize: '12px', color: C.text, fontFamily: "'JetBrains Mono',monospace" }}>{qa.name}</span>
                      {canReassign && (
                        <button onClick={() => removeAdditionalQAMut.mutate(qaId)} disabled={removeAdditionalQAMut.isPending}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '14px', padding: '0', lineHeight: 1, display: 'flex', alignItems: 'center' }}>×</button>
                      )}
                    </div>
                  );
                })}
                {(project.additional_qas || []).length === 0 && !project.created_by_user && (
                  <span style={{ fontSize: '12px', color: C.textDim, fontFamily: "'JetBrains Mono',monospace" }}>No QAs assigned</span>
                )}
              </div>
            </GCard>

            {/* Developer Roster */}
            <GCard style={{ padding: '20px', marginBottom: '16px' }}>
              <div style={{ fontSize: '10px', fontWeight: '700', color: C.textMid, fontFamily: "'JetBrains Mono',monospace", letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: '12px' }}>👥 Developer Roster</div>
              {roster.length === 0 && <div style={{ fontSize: '12px', color: C.textDim, fontFamily: "'JetBrains Mono',monospace", marginBottom: '10px' }}>No developers added yet</div>}
              {roster.length > 0 && (
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
                  {roster.map((name: string) => (
                    <div key={name} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 10px', background: `${C.blue}12`, border: `1px solid ${C.blue}30`, borderRadius: '7px' }}>
                      <span style={{ fontSize: '12px', color: C.blue, fontFamily: "'JetBrains Mono',monospace", fontWeight: '600' }}>{name}</span>
                      {canEdit && (
                        <button onClick={() => rosterMut.mutate({ name, action: 'remove' })} disabled={rosterMut.isPending} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textDim, fontSize: '14px', lineHeight: 1, padding: '0 0 0 2px', display: 'flex', alignItems: 'center' }}>×</button>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {canEdit && (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    value={newDevName}
                    onChange={e => setNewDevName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && newDevName.trim()) rosterMut.mutate({ name: newDevName.trim(), action: 'add' }); }}
                    placeholder="Developer name…"
                    style={{ flex: 1, maxWidth: '260px', background: 'var(--qa-input)', border: `1px solid ${C.border}`, borderRadius: '8px', padding: '8px 12px', color: C.text, fontSize: '12px', fontFamily: "'JetBrains Mono',monospace", outline: 'none' }}
                  />
                  <Btn sm v="primary" onClick={() => { if (newDevName.trim()) rosterMut.mutate({ name: newDevName.trim(), action: 'add' }); }} disabled={rosterMut.isPending || !newDevName.trim()}>＋ Add</Btn>
                </div>
              )}
            </GCard>

            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
              {project.figma_url ? (
                <a href={project.figma_url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 18px', background: `${C.purple}18`, border: `1px solid ${C.purple}35`, borderRadius: '8px', color: C.purple, textDecoration: 'none', fontFamily: "'JetBrains Mono',monospace", fontSize: '12px', fontWeight: '600' }}>🎨 Figma →</a>
              ) : canEdit ? (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input value={figmaInputVal} onChange={e => setFigmaInputVal(e.target.value)} placeholder="Figma URL…" style={{ width: '200px', background: 'var(--qa-input)', border: `1px solid ${C.border}`, borderRadius: '8px', padding: '8px 12px', color: C.text, fontSize: '12px', fontFamily: "'JetBrains Mono',monospace", outline: 'none' }} />
                  <Btn sm v="purple" onClick={() => { if (figmaInputVal) { updateProjectMut.mutate({ figma_url: figmaInputVal }); setFigmaInputVal(''); } }}>Link Figma</Btn>
                </div>
              ) : (
                <span style={{ fontSize: '12px', color: C.textDim, fontFamily: "'JetBrains Mono',monospace", padding: '9px 0' }}>No Figma linked</span>
              )}
              {project.frd_url ? (
                <a href={project.frd_url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 18px', background: `${C.blue}18`, border: `1px solid ${C.blue}35`, borderRadius: '8px', color: C.blue, textDecoration: 'none', fontFamily: "'JetBrains Mono',monospace", fontSize: '12px', fontWeight: '600' }}>📄 FRD →</a>
              ) : canEdit ? (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input value={frdInputVal} onChange={e => setFrdInputVal(e.target.value)} placeholder="FRD URL…" style={{ width: '200px', background: 'var(--qa-input)', border: `1px solid ${C.border}`, borderRadius: '8px', padding: '8px 12px', color: C.text, fontSize: '12px', fontFamily: "'JetBrains Mono',monospace", outline: 'none' }} />
                  <Btn sm v="green" onClick={() => { if (frdInputVal) { updateProjectMut.mutate({ frd_url: frdInputVal }); setFrdInputVal(''); } }}>Link FRD</Btn>
                </div>
              ) : (
                <span style={{ fontSize: '12px', color: C.textDim, fontFamily: "'JetBrains Mono',monospace", padding: '9px 0' }}>No FRD linked</span>
              )}
            </div>
          </div>
        )}

        {/* TEST CASES */}
        {page === 'testcases' && (
          <div className="fu">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: '700', color: C.text, fontFamily: "'JetBrains Mono',monospace", letterSpacing: '-0.3px' }}>Test Cases</h3>
                <div style={{ fontSize: '11px', color: 'var(--qa-text-faint)', fontFamily: "'JetBrains Mono',monospace" }}>
                  <span style={{ color: C.textMid }}>{testCases.length} total</span> · <span style={{ color: C.green }}>{testCases.filter((t: any) => t.test_result === 'Pass').length} pass</span> · <span style={{ color: C.red }}>{testCases.filter((t: any) => t.test_result === 'Fail').length} fail</span>
                  {' · '}<span style={{ color: 'var(--qa-text-faint)' }}>Click row to expand</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <div ref={exportMenuRef} style={{ position: 'relative' }}>
                  <Btn sm v="ghost" onClick={() => setShowExportMenu(v => !v)}>Export ▾</Btn>
                  {showExportMenu && (
                    <div style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 50, background: 'var(--qa-modal)', border: `1px solid ${C.border}`, borderRadius: '10px', padding: '6px', minWidth: '140px' }}>
                      {[{ label: '📄 CSV', fmt: 'csv' as const }, { label: '📊 Excel (.xlsx)', fmt: 'xlsx' as const }].map(opt => (
                        <div key={opt.fmt} onClick={() => exportTestCases(opt.fmt)}
                          style={{ padding: '8px 14px', fontSize: '12px', fontFamily: "'JetBrains Mono',monospace", cursor: 'pointer', color: C.text, borderRadius: '6px' }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
                          {opt.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {canEdit && <Btn sm onClick={() => setShowAddChoice(true)} icon="＋">New Test Case</Btn>}
              </div>
            </div>
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', borderRadius: '16px' }}>
              <GCard style={{ minWidth: '880px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                      {['ID','Module','Summary','Priority','Labels','Platform','Exec','Result',''].map(h => (
                        <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '10px', color: '#4a4a6a', fontFamily: "'JetBrains Mono',monospace", fontWeight: '600', letterSpacing: '.1em', textTransform: 'uppercase', whiteSpace: 'nowrap', borderBottom: `1px solid ${C.border}` }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {testCases.map((t: any, i: number) => {
                      const isOpen = expandedTC === t.id;
                      return (
                        <>
                          <tr key={t.id} onClick={() => setExpandedTC(isOpen ? null : t.id)}
                            style={{ borderBottom: !isOpen && i < testCases.length - 1 ? `1px solid ${C.border}` : 'none', cursor: 'pointer', background: isOpen ? 'rgba(124,106,247,0.04)' : 'transparent', transition: 'background .15s' }}
                            onMouseEnter={e => { if (!isOpen) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)'; }}
                            onMouseLeave={e => { if (!isOpen) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
                            <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}><span style={{ fontSize: '11px', color: C.accent, fontFamily: "'JetBrains Mono',monospace", fontWeight: '700' }}>{t.test_case_id}</span></td>
                            <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}><span style={{ fontSize: '12px', color: C.textMid, fontFamily: "'JetBrains Mono',monospace" }}>{t.module}</span></td>
                            <td style={{ padding: '12px 14px', minWidth: '200px' }}><span style={{ fontSize: '12px', color: C.text }}>{t.summary}</span></td>
                            <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}><Chip text={t.priority} color={PRIORITY_COLORS[t.priority]} /></td>
                            <td style={{ padding: '12px 14px', minWidth: '120px' }}><div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>{(t.labels || []).map((l: string) => <Chip key={l} text={l} color={LABEL_COLORS[l] || C.textDim} sm />)}</div></td>
                            <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}><Chip text={t.platform} color={PLATFORM_COLORS[t.platform] || C.blue} /></td>
                            <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}><Chip text={t.execution_status === 'Executed' ? 'Executed' : 'Not Run'} color={STATUS_COLORS[t.execution_status]} /></td>
                            <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}><Chip text={t.test_result} color={STATUS_COLORS[t.test_result]} /></td>
                            <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontSize: '11px', color: isOpen ? C.accent : C.textDim, fontFamily: "'JetBrains Mono',monospace" }}>{isOpen ? '▲' : '▼'}</span>
                                {canDelete && (
                                  <button onClick={e => { e.stopPropagation(); setConfirmDelete({ type: 'tc', id: t.id, label: t.test_case_id }); }} title="Delete" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '12px', padding: '2px 4px', borderRadius: '4px', opacity: 0.65, lineHeight: 1 }}>🗑</button>
                                )}
                              </div>
                            </td>
                          </tr>
                          {isOpen && <TCExpandedRow tc={t} user={user} onClose={() => setExpandedTC(null)} projectId={project.id} readOnly={readOnly} />}
                        </>
                      );
                    })}
                  </tbody>
                </table>
              </GCard>
            </div>
            {testCases.length === 0 && (
              <div style={{ textAlign: 'center', padding: '60px 20px', fontFamily: "'JetBrains Mono',monospace" }}>
                <div style={{ fontSize: '28px', marginBottom: '12px' }}>✓</div>
                <div style={{ color: C.textMid, fontWeight: '600', marginBottom: '6px', fontSize: '13px' }}>No test cases yet</div>
                <div style={{ fontSize: '11px', color: 'var(--qa-text-faint)' }}>Click "New Test Case" to add your first one</div>
              </div>
            )}
            {addTC && (
              <Modal title={`New Test Case — ${project.project_code}`} onClose={() => { setAddTC(false); resetTcForm(); }} wide>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                  <Inp label="Module" ph="e.g. Authentication" value={tcModule} onChange={setTcModule} req />
                  <Sel label="Priority" opts={['Critical','High','Medium','Low']} value={tcPriority} onChange={setTcPriority} />
                  <div style={{ gridColumn: '1/-1' }}><Inp label="Summary" ph="What is being tested?" value={tcSummary} onChange={setTcSummary} req /></div>
                  <div style={{ gridColumn: '1/-1' }}><Inp label="Test Case Pre-conditions" ph="What must be true before executing this test?" value={tcPre} onChange={setTcPre} area /></div>
                  <div style={{ gridColumn: '1/-1', marginBottom: '14px' }}>
                    <label style={{ display: 'block', fontSize: '10px', fontWeight: '600', color: C.textMid, marginBottom: '8px', fontFamily: "'JetBrains Mono',monospace", letterSpacing: '.08em', textTransform: 'uppercase' }}>Steps</label>
                    <textarea
                      rows={4}
                      placeholder={'1. Navigate to login page\n2. Enter valid credentials\n3. Click Sign In button\n4. Verify redirect to dashboard'}
                      value={tcSteps}
                      onChange={e => setTcSteps(e.target.value)}
                      style={{ width: '100%', background: 'var(--qa-input)', border: `1px solid ${C.border}`, borderRadius: '8px', padding: '9px 12px', color: C.text, fontSize: '13px', fontFamily: "'JetBrains Mono',monospace", outline: 'none', resize: 'vertical', lineHeight: '1.7' }}
                    />
                    <div style={{ fontSize: '10px', color: '#4a4a6a', fontFamily: "'JetBrains Mono',monospace", marginTop: '4px' }}>One step per line — numbers are optional</div>
                  </div>
                  <div style={{ gridColumn: '1/-1', marginBottom: '14px' }}>
                    <label style={{ display: 'block', fontSize: '10px', fontWeight: '600', color: C.textMid, marginBottom: '8px', fontFamily: "'JetBrains Mono',monospace", letterSpacing: '.08em', textTransform: 'uppercase' }}>Labels</label>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {(labelOptions.length > 0 ? labelOptions : ['Smoke','Regression','Sanity','Integration','E2E']).map((l: string) => {
                        const selected = tcLabels.includes(l);
                        const color = LABEL_COLORS[l] || '#7c6af7';
                        return (
                          <div key={l} onClick={() => setTcLabels(prev => selected ? prev.filter(x => x !== l) : [...prev, l])}
                            style={{ cursor: 'pointer', padding: '4px 12px', borderRadius: '5px', fontSize: '11px', fontFamily: "'JetBrains Mono',monospace", fontWeight: '600', letterSpacing: '0.02em', transition: 'all 0.15s',
                              background: selected ? color + '20' : 'var(--qa-input)',
                              border: `1px solid ${selected ? color + '50' : C.border}`,
                              color: selected ? color : C.textMid,
                            }}>
                            {selected && <span style={{ marginRight: '4px', fontSize: '9px' }}>✓</span>}{l}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <Sel label="Platform" opts={effectivePlatforms} value={tcPlatform} onChange={setTcPlatform} />
                  <Sel label="Execution Status" opts={['Not Executed','Executed']} value={tcExec} onChange={setTcExec} />
                </div>
                <div style={{ background: 'rgba(124,106,247,0.06)', border: '1px solid rgba(124,106,247,0.15)', borderRadius: '8px', padding: '10px 14px', fontSize: '11px', color: '#4a4a6a', fontFamily: "'JetBrains Mono',monospace", marginBottom: '16px' }}>
                  Auto ID: <span style={{ color: '#7c6af7', fontWeight: '600' }}>{project.project_code}{String((testCases.length || 0) + 1).padStart(3, '0')}</span>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <Btn
                    onClick={() => {
                      const stepsArray = tcSteps.split('\n').map(s => s.trim()).filter(Boolean).map(s => s.replace(/^\d+\.\s*/, ''));
                      createTCMut.mutate({ project_id: project.id, module: tcModule, summary: tcSummary, preconditions: tcPre, priority: tcPriority, platform: tcPlatform, execution_status: tcExec, labels: tcLabels, steps: stepsArray });
                    }}
                    disabled={createTCMut.isPending || !tcModule || !tcSummary}
                  >
                    {createTCMut.isPending ? 'Creating…' : 'Create Test Case'}
                  </Btn>
                  <Btn v="ghost" onClick={() => { setAddTC(false); resetTcForm(); }}>Cancel</Btn>
                </div>
              </Modal>
            )}
          </div>
        )}

        {/* BUG TRACKER */}
        {page === 'bugs' && (
          <div className="fu">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: '700', color: C.text, fontFamily: "'JetBrains Mono',monospace", letterSpacing: '-0.3px' }}>Bug Tracker</h3>
                <div style={{ fontSize: '11px', color: 'var(--qa-text-faint)', fontFamily: "'JetBrains Mono',monospace" }}><span style={{ color: C.textMid }}>{bugs.length} bugs</span> · <span style={{ color: 'var(--qa-text-faint)' }}>Click row to expand</span></div>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {/* Table / Kanban toggle */}
                <div style={{ display: 'flex', gap: '2px', background: 'var(--qa-input)', padding: '3px', borderRadius: '8px', border: `1px solid ${C.border}` }}>
                  {(['table', 'kanban'] as const).map(v => (
                    <button key={v} onClick={() => setBugView(v)} style={{
                      padding: '4px 10px', borderRadius: '5px', border: 'none',
                      background: bugView === v ? C.accent : 'transparent',
                      color: bugView === v ? '#fff' : 'var(--qa-text-faint)',
                      fontFamily: "'JetBrains Mono',monospace", fontSize: '10px', fontWeight: '600',
                      cursor: 'pointer', transition: 'all .15s', letterSpacing: '.04em',
                    }}>{v === 'table' ? '≡ Table' : '⊞ Kanban'}</button>
                  ))}
                </div>
                {user.role !== 'developer' && bugs.length > 0 && (
                  <div ref={bugExportMenuRef} style={{ position: 'relative' }}>
                    <Btn sm v="ghost" onClick={() => setShowBugExportMenu(v => !v)}>Export ▾</Btn>
                    {showBugExportMenu && (
                      <div style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 50, background: 'var(--qa-modal)', border: `1px solid ${C.border}`, borderRadius: '10px', padding: '6px', minWidth: '140px' }}>
                        {[{ label: '📄 CSV', fmt: 'csv' as const }, { label: '📊 Excel (.xlsx)', fmt: 'xlsx' as const }].map(opt => (
                          <div key={opt.fmt} onClick={() => exportBugs(opt.fmt)}
                            style={{ padding: '8px 14px', fontSize: '12px', fontFamily: "'JetBrains Mono',monospace", cursor: 'pointer', color: C.text, borderRadius: '6px' }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
                            {opt.label}
                          </div>
                        ))}
                        <div onClick={exportProjectBugReportPDF}
                          style={{ padding: '8px 14px', fontSize: '12px', fontFamily: "'JetBrains Mono',monospace", cursor: 'pointer', color: C.text, borderRadius: '6px' }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
                          📑 Project Report (PDF)
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {canEdit && <Btn sm v="danger" onClick={() => setShowBugAddChoice(true)} icon="＋">Log Bug</Btn>}
              </div>
            </div>
            {bugView === 'kanban' && bugs.length > 0 && (
              <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px', alignItems: 'flex-start' }}>
                {(['Open','In Progress','Fixed','Closed',"Won't Fix"] as const).map(status => {
                  const colBugs = (bugs as any[]).filter((b: any) => b.status === status);
                  const col = STATUS_COLORS[status] || C.textDim;
                  return (
                    <div key={status} style={{ minWidth: '210px', maxWidth: '210px', background: 'var(--qa-card)', border: `1px solid ${C.border}`, borderRadius: '12px', padding: '12px', flexShrink: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', paddingBottom: '8px', borderBottom: `1px solid ${C.border}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: col, flexShrink: 0 }} />
                          <span style={{ fontSize: '10px', fontWeight: '700', color: C.text, fontFamily: "'JetBrains Mono',monospace" }}>{status}</span>
                        </div>
                        <span style={{ background: `${C.accent}18`, color: C.accent, borderRadius: '10px', padding: '1px 7px', fontSize: '9px', fontFamily: "'JetBrains Mono',monospace", fontWeight: '700' }}>{colBugs.length}</span>
                      </div>
                      {colBugs.length === 0 && <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--qa-text-faint)', fontSize: '10px', fontFamily: "'JetBrains Mono',monospace", opacity: .5 }}>No bugs</div>}
                      {colBugs.map((b: any) => (
                        <div key={b.id} onClick={() => { setBugView('table'); setExpandedBug(b.id); }}
                          style={{ background: 'var(--qa-input)', border: `1px solid ${C.border}`, borderLeft: `3px solid ${col}`, borderRadius: '8px', padding: '10px', marginBottom: '8px', cursor: 'pointer', transition: 'all .15s' }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = `${C.accent}50`; (e.currentTarget as HTMLElement).style.borderLeftColor = col; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = C.border; (e.currentTarget as HTMLElement).style.borderLeftColor = col; (e.currentTarget as HTMLElement).style.transform = 'none'; }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                            <span style={{ color: C.accent, fontFamily: "'JetBrains Mono',monospace", fontSize: '10px', fontWeight: '700' }}>#{b.sl_no}</span>
                            <span style={{ color: C.textMid, fontFamily: "'JetBrains Mono',monospace", fontSize: '9px', background: C.card, padding: '1px 5px', borderRadius: '4px', maxWidth: '85px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.module}</span>
                          </div>
                          <div style={{ fontSize: '11px', color: C.text, lineHeight: 1.4, marginBottom: '6px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' } as React.CSSProperties}>{b.summary}</div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: C.textDim, fontFamily: "'JetBrains Mono',monospace" }}>
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '90px' }}>{b.assignee || 'Unassigned'}</span>
                            <span style={{ background: 'var(--qa-card)', padding: '1px 5px', borderRadius: '4px' }}>{b.qa_status || 'Open'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
            {bugView === 'table' && <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', borderRadius: '16px' }}>
              <GCard style={{ minWidth: '960px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                      {['#','Module','Summary','Reported By','Assignee','Bug Status','QA Status',''].map(h => (
                        <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '10px', color: '#4a4a6a', fontFamily: "'JetBrains Mono',monospace", fontWeight: '600', letterSpacing: '.1em', textTransform: 'uppercase', whiteSpace: 'nowrap', borderBottom: `1px solid ${C.border}` }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {bugs.map((b: any, i: number) => {
                      const isOpen = expandedBug === b.id;
                      const canUpdateBugStatus = !readOnly && (canEdit || user.role === 'developer');
                      return (
                        <>
                          <tr key={b.id}
                            style={{ borderBottom: !isOpen && i < bugs.length - 1 ? `1px solid ${C.border}` : 'none', cursor: 'pointer', background: isOpen ? 'rgba(124,106,247,0.04)' : 'transparent', transition: 'background .15s' }}
                            onClick={() => setExpandedBug(isOpen ? null : b.id)}
                            onMouseEnter={e => { if (!isOpen) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)'; }}
                            onMouseLeave={e => { if (!isOpen) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
                            <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}><span style={{ fontSize: '11px', color: C.textDim, fontFamily: "'JetBrains Mono',monospace" }}>#{b.sl_no}</span></td>
                            <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}><span style={{ fontSize: '12px', color: C.textMid, fontFamily: "'JetBrains Mono',monospace" }}>{b.module}</span></td>
                            <td style={{ padding: '12px 14px', minWidth: '200px' }}><span style={{ fontSize: '12px', color: C.text }}>{b.summary}</span></td>
                            <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}><span style={{ fontSize: '12px', color: C.textMid }}>{b.reported_by_user?.name || '—'}</span></td>
                            <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}><span style={{ fontSize: '12px', color: b.assignee === 'Unassigned' || !b.assignee ? C.textDim : C.text }}>{b.assignee || 'Unassigned'}</span></td>
                            <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                              <select value={b.status} disabled={!canUpdateBugStatus} onClick={e => e.stopPropagation()} onChange={e => { e.stopPropagation(); canUpdateBugStatus && saveBugStatusMut.mutate({ id: b.id, status: e.target.value }); }} style={{ background: 'var(--qa-select-bg)', border: `1px solid ${STATUS_COLORS[b.status] || C.border}`, borderRadius: '6px', padding: '4px 8px', color: STATUS_COLORS[b.status] || C.text, fontSize: '11px', fontFamily: "'JetBrains Mono',monospace", cursor: canUpdateBugStatus ? 'pointer' : 'default', outline: 'none', opacity: canUpdateBugStatus ? 1 : 0.7 }}>
                                {['Open','In Progress','Fixed','Closed',"Won't Fix"].map(s => <option key={s} value={s} style={{ background: C.card, color: C.text }}>{s}</option>)}
                              </select>
                            </td>
                            <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}><Chip text={b.qa_status || 'Open'} color={STATUS_COLORS[b.qa_status] || C.textDim} /></td>
                            <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                {b.developer_comment && <Chip text="Dev ✓" color={C.purple} sm />}
                                {b.qa_comment && <Chip text="QA ✓" color={C.accent} sm />}
                                <span style={{ fontSize: '11px', color: isOpen ? C.accent : C.textDim, fontFamily: "'JetBrains Mono',monospace" }}>{isOpen ? '▲' : '▼'}</span>
                                {canDelete && (
                                  <button onClick={e => { e.stopPropagation(); setConfirmDelete({ type: 'bug', id: b.id, label: `#${b.sl_no} ${b.module}` }); }} title="Delete" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '12px', padding: '2px 4px', borderRadius: '4px', opacity: 0.65, lineHeight: 1 }}>🗑</button>
                                )}
                              </div>
                            </td>
                          </tr>
                          {isOpen && <BugExpandedRow bug={b} user={user} onClose={() => setExpandedBug(null)} projectId={project.id} readOnly={readOnly} roster={roster} projectName={project.name} projectCode={project.project_code} />}
                        </>
                      );
                    })}
                  </tbody>
                </table>
              </GCard>
            </div>}
            {bugs.length === 0 && (
              <div style={{ textAlign: 'center', padding: '60px 20px', fontFamily: "'JetBrains Mono',monospace" }}>
                <div style={{ fontSize: '28px', marginBottom: '12px' }}>🐛</div>
                <div style={{ color: C.textMid, fontWeight: '600', marginBottom: '6px', fontSize: '13px' }}>No bugs logged</div>
                <div style={{ fontSize: '11px', color: 'var(--qa-text-faint)' }}>Click "Log Bug" to report the first one</div>
              </div>
            )}
            {addBug && (
              <Modal title="🐛 Log New Bug" onClose={() => setAddBug(false)} wide>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                  <Inp label="Module" ph="Which module?" value={bModule} onChange={setBModule} req />
                  <Sel label="Assignee" opts={['', ...roster]} value={bAssignee} onChange={setBAssignee} />
                  <div style={{ gridColumn: '1/-1' }}><Inp label="Summary" ph="Describe the bug clearly" value={bSummary} onChange={setBSummary} req /></div>
                  <Sel label="Developed By" opts={['', ...roster]} value={bDevelopedBy} onChange={setBDevelopedBy} />
                  <Sel label="Bug Status" opts={['Open','In Progress','Fixed','Closed',"Won't Fix"]} value={bStatus} onChange={setBStatus} />
                  <Sel label="QA Status" opts={['Open','To Test','In Test','Done','Reopen','No Action']} value={bQAStatus} onChange={setBQAStatus} />
                  <div style={{ gridColumn: '1/-1' }}><Inp label="QA Comment" ph="Notes, reopen reason…" value={bQAComment} onChange={setBQAComment} area /></div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <Btn v="danger" onClick={() => createBugMut.mutate({ project_id: project.id, module: bModule, summary: bSummary, assignee: bAssignee || null, developed_by: bDevelopedBy || '', status: bStatus, qa_status: bQAStatus, qa_comment: bQAComment })} disabled={createBugMut.isPending || !bModule || !bSummary}>
                    {createBugMut.isPending ? 'Logging…' : 'Log Bug'}
                  </Btn>
                  <Btn v="ghost" onClick={() => setAddBug(false)}>Cancel</Btn>
                </div>
              </Modal>
            )}
          </div>
        )}

        {/* AUTOMATION */}
        {page === 'automation' && (
          <div className="fu">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: C.text, fontFamily: "'JetBrains Mono',monospace", letterSpacing: '-0.3px' }}>Automation Scripts</h3>
              {(scripts as any[]).length > 0 && (
                <Btn sm v="ghost" onClick={downloadAllScripts}>⬇ Download All as ZIP</Btn>
              )}
            </div>

            {/* Hidden file input for script upload */}
            <input
              ref={scriptFileRef}
              type="file"
              accept=".ts,.py,.js,.spec.ts,.spec.js"
              style={{ display: 'none' }}
              onChange={e => {
                const file = e.target.files?.[0];
                if (!file || !uploadingScriptId) return;
                const reader = new FileReader();
                reader.onload = ev => {
                  uploadScriptMut.mutate({ id: uploadingScriptId, content: ev.target?.result as string, file_name: file.name });
                };
                reader.readAsText(file);
                e.target.value = '';
              }}
            />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(290px,1fr))', gap: '14px' }}>
              {(scripts as any[]).map((s: any) => (
                <GCard key={s.id} style={{ padding: '20px' }} glow={s.type === 'playwright' ? C.green : C.purple}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <Chip text={s.type.toUpperCase()} color={s.type === 'playwright' ? C.green : C.purple} />
                  </div>
                  <div style={{ fontSize: '12px', color: C.text, fontFamily: "'JetBrains Mono',monospace", marginBottom: '4px', fontWeight: '600' }}>{s.script_name}</div>
                  <div style={{ fontSize: '11px', color: C.textDim, marginBottom: '10px' }}>{s.type === 'playwright' ? 'Playwright test script' : 'Selenium mobile script'}</div>
                  {s.file_name ? (
                    <div style={{ fontSize: '10px', color: C.green, fontFamily: "'JetBrains Mono',monospace", marginBottom: '14px', padding: '7px 10px', background: `${C.green}10`, borderRadius: '6px', border: `1px solid ${C.green}20` }}>
                      <div>📄 {s.file_name}</div>
                      {s.uploaded_at && <div style={{ color: C.textDim, marginTop: '2px' }}>Uploaded {new Date(s.uploaded_at).toLocaleDateString()}</div>}
                    </div>
                  ) : (
                    <div style={{ fontSize: '10px', color: C.textDim, fontFamily: "'JetBrains Mono',monospace", marginBottom: '14px', padding: '7px 10px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', border: `1px solid ${C.border}` }}>No script uploaded</div>
                  )}
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {canEdit && (
                      <Btn sm v="ghost" onClick={() => { setUploadingScriptId(s.id); scriptFileRef.current?.click(); }} disabled={uploadScriptMut.isPending && uploadingScriptId === s.id}>
                        ⬆ Upload
                      </Btn>
                    )}
                    {s.file_name && <Btn sm v="ghost" onClick={() => downloadScript(s)}>⬇ Download</Btn>}
                    {canDelete && <Btn sm v="danger" onClick={() => setConfirmDelete({ type: 'script', id: s.id, label: s.script_name })}>Delete</Btn>}
                  </div>
                </GCard>
              ))}
              {(scripts as any[]).length === 0 && <div style={{ color: C.textMid, fontFamily: "'JetBrains Mono',monospace", fontSize: '12px' }}>No scripts yet. They are auto-created when you create a project.</div>}
            </div>

          </div>
        )}

        {/* DOCUMENTS */}
        {page === 'documents' && (
          <div className="fu">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: C.text, fontFamily: "'JetBrains Mono',monospace", letterSpacing: '-0.3px' }}>Documents</h3>
              {canEdit && <Btn sm icon="＋">Add Document</Btn>}
            </div>
            {['figma','frd','additional'].map(cat => {
              const catDocs = documents.filter((d: any) => d.doc_category === cat);
              const catLabel: Record<string, string> = { figma: '🎨 Figma', frd: '📄 FRD', additional: '📁 Additional Documents' };
              return (
                <div key={cat} style={{ marginBottom: '20px' }}>
                  <div style={{ fontSize: '10px', color: C.textMid, fontFamily: "'JetBrains Mono',monospace", fontWeight: '700', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: '8px' }}>{catLabel[cat]}</div>
                  {catDocs.length === 0
                    ? <div style={{ fontSize: '12px', color: 'var(--qa-text-faint)', fontFamily: "'JetBrains Mono',monospace", padding: '8px 0' }}>— Not added yet</div>
                    : catDocs.map((d: any) => (
                      <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'rgba(255,255,255,.02)', border: `1px solid ${C.border}`, borderRadius: '10px', marginBottom: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '16px' }}>{d.type === 'link' ? '🔗' : '📑'}</span>
                          <span style={{ fontSize: '13px', color: C.text }}>{d.label}</span>
                          <Chip text={d.type} color={d.type === 'link' ? C.blue : C.yellow} sm />
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <Btn sm v="ghost">Open</Btn>
                          {canDelete && <Btn sm v="danger" onClick={() => setConfirmDelete({ type: 'doc', id: d.id, label: d.label })}>Delete</Btn>}
                        </div>
                      </div>
                    ))
                  }
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      {confirmDelete && (
        <ConfirmDeleteModal
          message={`Delete "${confirmDelete.label}"? This cannot be undone.`}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setConfirmDelete(null)}
          isPending={isDeleting}
        />
      )}

      {/* Add Test Case — choice modal */}
      {showAddChoice && !showImport && !addTC && (
        <Modal title="Add Test Cases" onClose={() => setShowAddChoice(false)}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div
              onClick={() => { setShowAddChoice(false); setAddTC(true); }}
              style={{ flex: 1, padding: '28px 20px', background: `${C.accent}08`, border: `1px solid ${C.accent}25`, borderRadius: '12px', cursor: 'pointer', textAlign: 'center', transition: 'border-color .15s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = `${C.accent}55`; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = `${C.accent}25`; }}
            >
              <div style={{ fontSize: '28px', marginBottom: '10px' }}>✏️</div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: C.text, fontFamily: "'JetBrains Mono',monospace", marginBottom: '4px' }}>Manual</div>
              <div style={{ fontSize: '11px', color: C.textDim }}>Fill in a form</div>
            </div>
            <div
              onClick={() => { setShowImport(true); }}
              style={{ flex: 1, padding: '28px 20px', background: `${C.green}08`, border: `1px solid ${C.green}25`, borderRadius: '12px', cursor: 'pointer', textAlign: 'center', transition: 'border-color .15s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = `${C.green}55`; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = `${C.green}25`; }}
            >
              <div style={{ fontSize: '28px', marginBottom: '10px' }}>📥</div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: C.text, fontFamily: "'JetBrains Mono',monospace", marginBottom: '4px' }}>Import</div>
              <div style={{ fontSize: '11px', color: C.textDim }}>CSV / XLSX / Google Sheets</div>
            </div>
          </div>
        </Modal>
      )}

      {/* Import Test Cases Modal */}
      {showImport && (
        <ImportTestCasesModal
          projectCode={project.project_code}
          onClose={() => { setShowImport(false); setShowAddChoice(false); }}
          onImport={(rows) => bulkImportMut.mutate(rows)}
        />
      )}

      {/* Add Bug — choice modal */}
      {showBugAddChoice && !showBugImport && !addBug && (
        <Modal title="Log Bug" onClose={() => setShowBugAddChoice(false)}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div
              onClick={() => { setBModule(''); setBSummary(''); setBAssignee(''); setBDevelopedBy(''); setBStatus('Open'); setBQAStatus('Open'); setBQAComment(''); setShowBugAddChoice(false); setAddBug(true); }}
              style={{ flex: 1, padding: '28px 20px', background: `${C.red}08`, border: `1px solid ${C.red}25`, borderRadius: '12px', cursor: 'pointer', textAlign: 'center', transition: 'border-color .15s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = `${C.red}55`; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = `${C.red}25`; }}
            >
              <div style={{ fontSize: '28px', marginBottom: '10px' }}>✏️</div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: C.text, fontFamily: "'JetBrains Mono',monospace", marginBottom: '4px' }}>Log Manually</div>
              <div style={{ fontSize: '11px', color: C.textDim }}>Fill in a form</div>
            </div>
            <div
              onClick={() => { setShowBugImport(true); }}
              style={{ flex: 1, padding: '28px 20px', background: `${C.green}08`, border: `1px solid ${C.green}25`, borderRadius: '12px', cursor: 'pointer', textAlign: 'center', transition: 'border-color .15s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = `${C.green}55`; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = `${C.green}25`; }}
            >
              <div style={{ fontSize: '28px', marginBottom: '10px' }}>📥</div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: C.text, fontFamily: "'JetBrains Mono',monospace", marginBottom: '4px' }}>Import</div>
              <div style={{ fontSize: '11px', color: C.textDim }}>CSV / XLSX / Google Sheets</div>
            </div>
          </div>
        </Modal>
      )}

      {/* Import Bugs Modal */}
      {showBugImport && (
        <ImportBugsModal
          projectCode={project.project_code}
          onClose={() => { setShowBugImport(false); setShowBugAddChoice(false); }}
          onImport={(rows) => bulkImportBugsMut.mutate(rows)}
        />
      )}

      {/* Manage QA Modal */}
      {showReassign && (
        <Modal title="Manage Project QA" onClose={() => { setShowReassign(false); setReassignOwnerId(''); setReassignAction(null); }}>
          <div style={{ marginBottom: '16px', fontSize: '12px', color: C.textMid, fontFamily: "'JetBrains Mono',monospace" }}>
            Current owner: <span style={{ color: C.accent }}>{project.created_by_user?.name || '—'}</span>
          </div>
          <Sel
            label="Select QA Engineer"
            opts={[{ v: '', l: 'Choose a QA…' }, ...(teamForReassign as any[])
              .filter((m: any) => m.role !== 'developer' && m.role !== 'hr' && m.id !== project.created_by && !(project.additional_qas || []).includes(m.id))
              .map((m: any) => ({ v: m.id, l: `${m.name} (${m.role})` }))]}
            value={reassignOwnerId}
            onChange={(v: string) => { setReassignOwnerId(v); setReassignAction(null); }}
          />
          {reassignOwnerId && (
            <div style={{ display: 'flex', gap: '10px', margin: '16px 0' }}>
              {([
                { key: 'transfer', icon: '⇄', title: 'Transfer Ownership', desc: 'New QA becomes sole owner. Current owner loses access.' },
                { key: 'additional', icon: '＋', title: 'Assign as Additional QA', desc: 'Both QAs share the project with full write access.' },
              ] as const).map(opt => (
                <div key={opt.key} onClick={() => setReassignAction(opt.key)}
                  style={{ flex: 1, padding: '12px', background: reassignAction === opt.key ? `${C.accent}15` : 'var(--qa-input)', border: `1px solid ${reassignAction === opt.key ? C.accent : C.border}`, borderRadius: '10px', cursor: 'pointer', transition: 'all .15s' }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: C.text, fontFamily: "'JetBrains Mono',monospace", marginBottom: '4px' }}>{opt.icon} {opt.title}</div>
                  <div style={{ fontSize: '10px', color: C.textDim, fontFamily: "'JetBrains Mono',monospace", lineHeight: 1.5 }}>{opt.desc}</div>
                </div>
              ))}
            </div>
          )}
          {reassignOwnerId && reassignAction === 'transfer' && (
            <div style={{ padding: '9px 12px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '8px', fontSize: '11px', color: '#f59e0b', fontFamily: "'JetBrains Mono',monospace", marginBottom: '14px' }}>
              ⚠ {(teamForReassign as any[]).find((m: any) => m.id === reassignOwnerId)?.name} will become sole owner. Current owner loses access.
            </div>
          )}
          {reassignOwnerId && reassignAction === 'additional' && (
            <div style={{ padding: '9px 12px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '8px', fontSize: '11px', color: '#10b981', fontFamily: "'JetBrains Mono',monospace", marginBottom: '14px' }}>
              ✓ {(teamForReassign as any[]).find((m: any) => m.id === reassignOwnerId)?.name} will be added. Both QAs will see this project.
            </div>
          )}
          <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
            <Btn
              onClick={() => {
                if (reassignAction === 'transfer') reassignMut.mutate(reassignOwnerId);
                else if (reassignAction === 'additional') addAdditionalQAMut.mutate(reassignOwnerId);
              }}
              disabled={!reassignOwnerId || !reassignAction || reassignMut.isPending || addAdditionalQAMut.isPending}
            >
              {(reassignMut.isPending || addAdditionalQAMut.isPending) ? 'Saving…' : 'Confirm'}
            </Btn>
            <Btn v="ghost" onClick={() => { setShowReassign(false); setReassignOwnerId(''); setReassignAction(null); }}>Cancel</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
