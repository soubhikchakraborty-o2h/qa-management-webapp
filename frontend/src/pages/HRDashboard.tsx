import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { C } from '../lib/constants';
import { useTheme } from '../context/ThemeContext';
import { GCard, Btn, Chip } from '../components/ui/index';
import AnimBg from '../components/ui/AnimBg';
import { ProjectShell } from './ProjectShell';
import { getProjects, getHRReport } from '../lib/api';

// ── HR Sidebar ────────────────────────────────────────────────
function HRSidebar({ tab, setTab, user, onSignOut, collapsed }: {
  tab: string; setTab: (t: string) => void; user: any;
  onSignOut: () => void; collapsed: boolean;
}) {
  const { isDark, toggleTheme } = useTheme();
  const [confirming, setConfirming] = useState(false);
  const [hovSign, setHovSign] = useState(false);
  const [hovTheme, setHovTheme] = useState(false);
  const RED = '#ef4444';

  const NavItem = ({ label, icon, active, onClick }: any) => {
    const [hov, setHov] = useState(false);
    return (
      <div onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
        style={{ display: 'flex', alignItems: 'center', gap: '9px', padding: active ? '8px 10px 8px 8px' : '8px 10px', borderRadius: '7px', cursor: 'pointer', marginBottom: '1px', background: active ? 'var(--qa-nav-active)' : hov ? 'rgba(124,106,247,0.04)' : 'transparent', border: active ? '1px solid var(--qa-nav-act-bdr)' : '1px solid transparent', borderLeft: active ? '2px solid #7c6af7' : '2px solid transparent', color: active ? C.text : hov ? C.textMid : 'var(--qa-text-faint)', fontSize: '12px', fontWeight: active ? '600' : '400', fontFamily: "'JetBrains Mono', monospace", transition: 'all 0.15s' }}>
        <span style={{ fontSize: '11px', flexShrink: 0 }}>{icon}</span>{label}
      </div>
    );
  };

  return (
    <div style={{ width: collapsed ? '0' : '210px', height: '100vh', background: 'var(--qa-sidebar)', borderRight: collapsed ? 'none' : '1px solid var(--qa-sidebar-bdr)', display: 'flex', flexDirection: 'column', flexShrink: 0, position: 'fixed', top: 0, left: 0, zIndex: 100, overflowX: 'hidden', overflowY: 'auto', transition: 'width 0.25s ease' }}>
      <div style={{ width: '210px', display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {/* Logo */}
        <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid var(--qa-sidebar-bdr)' }}>
          <div style={{ fontSize: '9px', letterSpacing: '.3em', color: 'var(--qa-text-faint)', fontFamily: "'JetBrains Mono', monospace", marginBottom: '5px', textTransform: 'uppercase' }}>O2H TECHNOLOGY</div>
          <div style={{ fontSize: '15px', fontWeight: '800', fontFamily: "'JetBrains Mono', monospace", color: C.text, letterSpacing: '-0.3px' }}>Quality Analysis</div>
        </div>

        {/* User */}
        <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--qa-sidebar-bdr)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '34px', height: '34px', borderRadius: '9px', flexShrink: 0, background: 'linear-gradient(135deg,#34d399,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '700', color: '#ffffff' }}>{user.name[0]}</div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: '12px', fontWeight: '600', color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</div>
            <div style={{ fontSize: '9px', color: '#34d399', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '.1em', marginTop: '1px' }}>HR</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '10px 8px' }}>
          <NavItem label="Projects" icon="◈" active={tab === 'projects'} onClick={() => setTab('projects')} />
          <NavItem label="Reports" icon="◎" active={tab === 'reports'} onClick={() => setTab('reports')} />
        </nav>

        {/* Theme Toggle */}
        <div style={{ padding: '0 8px', borderTop: '1px solid var(--qa-sidebar-bdr)' }}>
          <div onClick={toggleTheme} onMouseEnter={() => setHovTheme(true)} onMouseLeave={() => setHovTheme(false)}
            style={{ display: 'flex', alignItems: 'center', gap: '9px', padding: '8px 10px', margin: '6px 0', borderRadius: '7px', cursor: 'pointer', background: hovTheme ? 'rgba(124,106,247,0.06)' : 'transparent', border: `1px solid ${hovTheme ? 'rgba(124,106,247,0.2)' : 'transparent'}`, color: hovTheme ? C.accent : 'var(--qa-text-faint)', fontSize: '12px', fontFamily: "'JetBrains Mono', monospace", transition: 'all 0.15s' }}>
            <span style={{ fontSize: '13px', flexShrink: 0 }}>{isDark ? '☀️' : '🌙'}</span>
            {isDark ? 'Light Mode' : 'Dark Mode'}
          </div>
        </div>

        {/* Sign Out */}
        <div style={{ padding: '0 8px 0', borderTop: '1px solid var(--qa-sidebar-bdr)' }}>
          {confirming ? (
            <div style={{ margin: '6px 2px 8px', background: `${RED}10`, border: `1px solid ${RED}30`, borderRadius: '8px', padding: '9px 10px', fontFamily: "'JetBrains Mono', monospace" }}>
              <div style={{ fontSize: '10px', color: C.text, marginBottom: '8px', fontWeight: '600' }}>Sign out?</div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button onClick={() => { setConfirming(false); onSignOut(); }} style={{ flex: 1, padding: '5px 0', borderRadius: '6px', border: 'none', cursor: 'pointer', background: RED, color: '#fff', fontSize: '10px', fontWeight: '700', fontFamily: "'JetBrains Mono', monospace" }}>Yes</button>
                <button onClick={() => setConfirming(false)} style={{ flex: 1, padding: '5px 0', borderRadius: '6px', border: '1px solid var(--qa-border-lt)', cursor: 'pointer', background: 'var(--qa-nav-active)', color: 'var(--qa-text-faint)', fontSize: '10px', fontWeight: '600', fontFamily: "'JetBrains Mono', monospace" }}>No</button>
              </div>
            </div>
          ) : (
            <div onClick={() => setConfirming(true)} onMouseEnter={() => setHovSign(true)} onMouseLeave={() => setHovSign(false)}
              style={{ display: 'flex', alignItems: 'center', gap: '9px', padding: '8px 10px', margin: '6px 0', borderRadius: '7px', cursor: 'pointer', background: hovSign ? `${RED}10` : 'transparent', border: `1px solid ${hovSign ? RED + '30' : 'transparent'}`, color: hovSign ? RED : 'var(--qa-text-faint)', fontSize: '12px', fontFamily: "'JetBrains Mono', monospace", transition: 'all 0.15s' }}>
              <span style={{ fontSize: '12px', flexShrink: 0 }}>→</span>Sign Out
            </div>
          )}
        </div>

        <div style={{ padding: '6px 14px 12px' }}>
          <div style={{ fontSize: '9px', color: 'var(--qa-text-xfaint)', fontFamily: "'JetBrains Mono', monospace" }}>v1.0.0 · O2H Technology</div>
        </div>
      </div>
    </div>
  );
}

// ── HR Projects Grid ──────────────────────────────────────────
function HRProjectsView({ onProjectClick }: { onProjectClick: (p: any) => void }) {
  const { data, isLoading } = useQuery({ queryKey: ['projects', 'hr'], queryFn: () => getProjects() });
  const projects: any[] = data?.projects || [];

  const STATUS_COLOR: Record<string, string> = {
    active: '#4ade80', in_review: '#60a5fa', on_hold: '#fbbf24', completed: '#a78bfa',
  };

  if (isLoading) return (
    <div style={{ padding: '40px', color: C.textDim, fontFamily: "'JetBrains Mono', monospace", fontSize: '13px' }}>Loading projects…</div>
  );

  return (
    <div style={{ padding: '28px 32px' }} className="fu">
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ margin: '0 0 6px', fontSize: '24px', fontWeight: '800', color: C.text, fontFamily: "'JetBrains Mono',monospace" }}>Projects</h1>
        <div style={{ fontSize: '11px', color: C.textDim, fontFamily: "'JetBrains Mono',monospace" }}>Read-only view · {projects.length} projects</div>
      </div>

      {projects.length === 0 ? (
        <div style={{ color: C.textMid, fontSize: '13px', fontFamily: "'JetBrains Mono',monospace" }}>No projects found.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {projects.map((p: any) => (
            <GCard key={p.id} hover glow={C.accent} onClick={() => onProjectClick(p)} style={{ padding: '20px', cursor: 'pointer' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: C.text, fontFamily: "'JetBrains Mono',monospace", marginBottom: '3px' }}>{p.name}</div>
                  <div style={{ fontSize: '10px', color: C.accent, fontFamily: "'JetBrains Mono',monospace" }}>{p.project_code}</div>
                </div>
                <Chip text={p.status?.replace('_', ' ') || 'active'} color={STATUS_COLOR[p.status] || C.textDim} sm />
              </div>
              {p.description && (
                <div style={{ fontSize: '11px', color: C.textMid, lineHeight: '1.6', marginBottom: '12px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.description}</div>
              )}
              <div style={{ display: 'flex', gap: '12px', fontSize: '10px', color: C.textDim, fontFamily: "'JetBrains Mono',monospace" }}>
                <span>Type: {p.type || '—'}</span>
                {p.created_by_user && <span>QA: {p.created_by_user.name}</span>}
              </div>
            </GCard>
          ))}
        </div>
      )}
    </div>
  );
}

// ── HR Reports View ───────────────────────────────────────────
function HRReportsView() {
  const today = new Date().toISOString().split('T')[0];
  const firstOfMonth = today.slice(0, 8) + '01';
  const [dateFrom, setDateFrom] = useState(firstOfMonth);
  const [dateTo, setDateTo] = useState(today);
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generateReport = async () => {
    if (!dateFrom || !dateTo) return;
    setLoading(true); setError('');
    try {
      const data = await getHRReport(dateFrom, dateTo);
      setReportData(data);
    } catch (e: any) {
      setError(e.response?.data?.error || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const exportBugReport = (format: 'csv' | 'xlsx') => {
    if (!reportData) return;
    const rows: any[] = [];
    Object.entries(reportData.projectBreakdown).forEach(([projName, d]: any) => {
      (d.bugs as any[]).forEach((bug: any) => {
        rows.push({
          'Project': projName,
          'Sl No': bug.sl_no,
          'Module': bug.module,
          'Summary': bug.summary,
          'Developed By': bug.developed_by || '',
          'Assignee': bug.assignee || '',
          'Status': bug.status,
          'Developer Comment': bug.developer_comment || '',
          'QA Status': bug.qa_status || '',
          'QA Comment': bug.qa_comment || '',
          'BA Comment': bug.ba_comment || '',
          'Created At': new Date(bug.created_at).toLocaleDateString(),
        });
      });
    });
    const fileName = `bugs_report_${dateFrom}_${dateTo}`;
    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [
      { wch: 22 }, { wch: 8 }, { wch: 20 }, { wch: 40 }, { wch: 20 },
      { wch: 20 }, { wch: 15 }, { wch: 40 }, { wch: 15 }, { wch: 40 }, { wch: 40 }, { wch: 15 },
    ];
    if (format === 'csv') {
      const csv = XLSX.utils.sheet_to_csv(ws);
      saveAs(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), `${fileName}.csv`);
    } else {
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Bugs');
      XLSX.writeFile(wb, `${fileName}.xlsx`);
    }
  };

  const exportCSV = () => {
    if (!reportData) return;
    const rows: string[][] = [];
    rows.push(['QA Performance Report', `${reportData.period.from} to ${reportData.period.to}`]);
    rows.push([]);
    rows.push(['TOTALS']);
    rows.push(['Total Bugs', String(reportData.totals.totalBugs)]);
    rows.push(['Total Test Cases', String(reportData.totals.totalTestCases)]);
    rows.push(['Total Projects', String(reportData.totals.totalProjects)]);
    rows.push([]);
    rows.push(['QA PERFORMANCE']);
    rows.push(['Name', 'Role', 'Bugs Logged', 'Test Cases Created']);
    Object.entries(reportData.qaPerformance).forEach(([name, d]: any) => {
      rows.push([name, d.role, String(d.bugsLogged), String(d.testCasesCreated)]);
    });
    rows.push([]);
    rows.push(['PROJECT BREAKDOWN']);
    rows.push(['Project', 'Code', 'Status', 'Bugs', 'Test Cases']);
    Object.entries(reportData.projectBreakdown).forEach(([name, d]: any) => {
      rows.push([name, d.project_code || '', d.status || '', String(d.bugs.length), String(d.testCases.length)]);
    });
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `qa-report-${dateFrom}-${dateTo}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const exportHRReportPDF = () => {
    if (!reportData) return;
    const doc = new jsPDF();
    const pw = doc.internal.pageSize.getWidth();
    let y = 20;

    const addPageIfNeeded = () => {
      if (y > 252) { doc.addPage(); y = 20; }
    };

    const addSectionHeader = (title: string) => {
      addPageIfNeeded();
      y += 4;
      doc.setFillColor(245, 244, 255);
      doc.rect(14, y - 4, pw - 28, 10, 'F');
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(124, 106, 247);
      doc.text(title, 16, y + 2);
      y += 10;
      doc.setTextColor(0, 0, 0);
    };

    // Header
    doc.setFillColor(124, 106, 247);
    doc.rect(0, 0, pw, 14, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('O2H TECHNOLOGY — QUALITY ANALYSIS', 14, 9);

    y = 28;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(18);
    doc.text('QA & DEVELOPER PERFORMANCE REPORT', 14, y);

    y += 8;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    const fromStr = new Date(dateFrom).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
    const toStr = new Date(dateTo).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
    doc.text(`Period: ${fromStr} — ${toStr}`, 14, y);

    y += 4;
    doc.setDrawColor(124, 106, 247);
    doc.line(14, y, pw - 14, y);

    y += 10;
    const tot = reportData.totals;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text(`Total Bugs: ${tot.totalBugs}     Total Test Cases: ${tot.totalTestCases}     Total Projects: ${tot.totalProjects}     Active Projects: ${tot.activeProjects}`, 14, y);

    // Section 1: Project breakdown
    y += 8;
    addSectionHeader('SECTION 1: PROJECT-WISE BREAKDOWN');
    Object.entries(reportData.projectBreakdown).forEach(([projName, d]: [string, any]) => {
      addPageIfNeeded();
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(projName, 14, y);
      y += 6;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(`  Bugs: ${d.bugs.length}   Test Cases: ${d.testCases.length}   Open: ${d.bugs.filter((b: any) => b.status === 'Open').length}   Fixed: ${d.bugs.filter((b: any) => b.status === 'Fixed').length}`, 14, y);
      y += 8;
    });

    // Section 2: QA Performance table
    addSectionHeader('SECTION 2: QA ENGINEER PERFORMANCE');
    autoTable(doc, {
      startY: y,
      head: [['Name', 'Role', 'Bugs Logged', 'Test Cases Created']],
      body: Object.entries(reportData.qaPerformance).map(([name, s]: [string, any]) => [name, s.role, s.bugsLogged, s.testCasesCreated]),
      headStyles: { fillColor: [124, 106, 247], textColor: 255, fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      alternateRowStyles: { fillColor: [248, 248, 255] },
      margin: { left: 14, right: 14 },
    });
    y = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 10 : y + 40;

    // Section 3: Developer analysis
    addSectionHeader('SECTION 3: DEVELOPER BUG ANALYSIS');
    if (Object.keys(reportData.developerStats).length > 0) {
      autoTable(doc, {
        startY: y,
        head: [['Developer', 'Bugs in Code', 'Fixed', 'Open']],
        body: Object.entries(reportData.developerStats).map(([dev, s]: [string, any]) => [dev, s.bugsInCode, s.bugsFixed, s.bugsOpen]),
        headStyles: { fillColor: [124, 106, 247], textColor: 255, fontStyle: 'bold', fontSize: 9 },
        bodyStyles: { fontSize: 9 },
        alternateRowStyles: { fillColor: [248, 248, 255] },
        margin: { left: 14, right: 14 },
      });
    } else {
      doc.setFontSize(9);
      doc.setTextColor(150, 150, 150);
      doc.text('No developer data in this period.', 14, y);
    }

    // Footer on all pages
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      const ph = doc.internal.pageSize.getHeight();
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Generated on ${new Date().toLocaleDateString()} — O2H Technology Quality Analysis — Page ${i} of ${totalPages}`, 14, ph - 10);
    }

    doc.save(`HR_Report_${dateFrom}_${dateTo}.pdf`);
  };

  const exportPDF = exportHRReportPDF;

  const inputStyle: any = {
    background: 'var(--qa-input)', border: `1px solid ${C.border}`, borderRadius: '8px',
    padding: '8px 12px', color: C.text, fontSize: '12px',
    fontFamily: "'JetBrains Mono', monospace", outline: 'none',
    colorScheme: 'dark',
  };

  return (
    <div style={{ padding: '28px 32px', width: '100%' }} className="fu">
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ margin: '0 0 6px', fontSize: '24px', fontWeight: '800', color: C.text, fontFamily: "'JetBrains Mono',monospace" }}>HR Reports</h1>
        <div style={{ fontSize: '11px', color: C.textDim, fontFamily: "'JetBrains Mono',monospace" }}>Generate reports for any date range</div>
      </div>

      {/* Date picker */}
      <GCard style={{ padding: '20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div>
            <label style={{ display: 'block', fontSize: '10px', fontWeight: '600', color: C.textMid, marginBottom: '6px', fontFamily: "'JetBrains Mono',monospace", textTransform: 'uppercase', letterSpacing: '.07em' }}>From</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '10px', fontWeight: '600', color: C.textMid, marginBottom: '6px', fontFamily: "'JetBrains Mono',monospace", textTransform: 'uppercase', letterSpacing: '.07em' }}>To</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={inputStyle} />
          </div>
          <Btn onClick={generateReport} disabled={loading || !dateFrom || !dateTo} style={{ alignSelf: 'flex-end' }}>
            {loading ? 'Generating…' : 'Generate Report'}
          </Btn>
        </div>
        {error && <div style={{ marginTop: '10px', fontSize: '12px', color: '#f87171', fontFamily: "'JetBrains Mono',monospace" }}>{error}</div>}
      </GCard>

      {reportData && (
        <>
          {/* Export buttons */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <Btn v="ghost" sm onClick={exportCSV}>Report CSV</Btn>
            <Btn v="ghost" sm onClick={exportPDF}>Report PDF</Btn>
            <Btn v="ghost" sm onClick={() => exportBugReport('csv')}>Bugs CSV</Btn>
            <Btn v="ghost" sm onClick={() => exportBugReport('xlsx')}>Bugs Excel</Btn>
          </div>

          {/* Totals */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px', marginBottom: '24px' }}>
            {[
              { label: 'Total Bugs', value: reportData.totals.totalBugs, color: '#f87171' },
              { label: 'Test Cases', value: reportData.totals.totalTestCases, color: '#60a5fa' },
              { label: 'Projects', value: reportData.totals.totalProjects, color: C.accent },
              { label: 'Active Projects', value: reportData.totals.activeProjects, color: '#4ade80' },
            ].map(stat => (
              <GCard key={stat.label} style={{ padding: '16px' }} glow={stat.color}>
                <div style={{ fontSize: '28px', fontWeight: '800', color: stat.color, fontFamily: "'JetBrains Mono',monospace", lineHeight: 1 }}>{stat.value}</div>
                <div style={{ fontSize: '10px', color: C.textDim, fontFamily: "'JetBrains Mono',monospace", marginTop: '6px', textTransform: 'uppercase', letterSpacing: '.07em' }}>{stat.label}</div>
              </GCard>
            ))}
          </div>

          {/* QA Performance */}
          <GCard style={{ padding: '20px', marginBottom: '20px' }}>
            <div style={{ fontSize: '13px', fontWeight: '700', color: C.text, fontFamily: "'JetBrains Mono',monospace", marginBottom: '16px' }}>QA Performance</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', fontFamily: "'JetBrains Mono',monospace" }}>
                <thead>
                  <tr>
                    {['Name', 'Role', 'Bugs Logged', 'Test Cases Created'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontSize: '10px', color: C.textDim, fontWeight: '600', borderBottom: `1px solid ${C.border}`, textTransform: 'uppercase', letterSpacing: '.07em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(reportData.qaPerformance).map(([name, d]: any) => (
                    <tr key={name} style={{ borderBottom: `1px solid ${C.border}20` }}>
                      <td style={{ padding: '10px 12px', color: C.text, fontWeight: '600' }}>{name}</td>
                      <td style={{ padding: '10px 12px' }}><Chip text={d.role} color={C.accent} sm /></td>
                      <td style={{ padding: '10px 12px', color: '#f87171' }}>{d.bugsLogged}</td>
                      <td style={{ padding: '10px 12px', color: '#60a5fa' }}>{d.testCasesCreated}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GCard>

          {/* Project Breakdown */}
          <GCard style={{ padding: '20px', marginBottom: '20px' }}>
            <div style={{ fontSize: '13px', fontWeight: '700', color: C.text, fontFamily: "'JetBrains Mono',monospace", marginBottom: '16px' }}>Project Breakdown</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', fontFamily: "'JetBrains Mono',monospace" }}>
                <thead>
                  <tr>
                    {['Project', 'Code', 'Status', 'Bugs', 'Test Cases'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontSize: '10px', color: C.textDim, fontWeight: '600', borderBottom: `1px solid ${C.border}`, textTransform: 'uppercase', letterSpacing: '.07em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(reportData.projectBreakdown).map(([name, d]: any) => (
                    <tr key={name} style={{ borderBottom: `1px solid ${C.border}20` }}>
                      <td style={{ padding: '10px 12px', color: C.text, fontWeight: '600' }}>{name}</td>
                      <td style={{ padding: '10px 12px', color: C.accent }}>{d.project_code || '—'}</td>
                      <td style={{ padding: '10px 12px' }}><Chip text={d.status || 'unknown'} color='#a78bfa' sm /></td>
                      <td style={{ padding: '10px 12px', color: '#f87171' }}>{d.bugs.length}</td>
                      <td style={{ padding: '10px 12px', color: '#60a5fa' }}>{d.testCases.length}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GCard>

          {/* Bug breakdown */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <GCard style={{ padding: '20px' }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: C.text, fontFamily: "'JetBrains Mono',monospace", marginBottom: '14px' }}>Bugs by Status</div>
              {Object.entries(reportData.bugsByStatus).map(([s, count]: any) => (
                <div key={s} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: `1px solid ${C.border}20` }}>
                  <span style={{ fontSize: '12px', color: C.textMid, fontFamily: "'JetBrains Mono',monospace" }}>{s}</span>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: C.text, fontFamily: "'JetBrains Mono',monospace" }}>{count}</span>
                </div>
              ))}
            </GCard>
            <GCard style={{ padding: '20px' }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: C.text, fontFamily: "'JetBrains Mono',monospace", marginBottom: '14px' }}>Bugs by Priority</div>
              {Object.entries(reportData.bugsByPriority).map(([p, count]: any) => (
                <div key={p} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: `1px solid ${C.border}20` }}>
                  <span style={{ fontSize: '12px', color: C.textMid, fontFamily: "'JetBrains Mono',monospace" }}>{p}</span>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: C.text, fontFamily: "'JetBrains Mono',monospace" }}>{count}</span>
                </div>
              ))}
            </GCard>
          </div>
        </>
      )}
    </div>
  );
}

// ── HR Dashboard ──────────────────────────────────────────────
export function HRDashboard({ user, onSignOut }: { user: any; onSignOut: () => void }) {
  const [tab, setTab] = useState<'projects' | 'reports'>('projects');
  const [project, setProject] = useState<any>(null);
  const [sPage, setSPage] = useState('overview');
  const [collapsed, setCollapsed] = useState(false);

  const handleProjectClick = (p: any) => { setProject(p); setSPage('overview'); };
  const handleBack = () => { setProject(null); setSPage('overview'); };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: C.bg, color: C.text, position: 'relative', transition: 'background-color 0.25s ease' }}>
      <AnimBg />
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', width: '100%', minHeight: '100vh' }}>
        <HRSidebar tab={project ? '' : tab} setTab={(t) => { setTab(t as any); setProject(null); }} user={user} onSignOut={onSignOut} collapsed={collapsed} />

        {/* Sidebar toggle */}
        <button onClick={() => setCollapsed(!collapsed)} style={{ position: 'fixed', left: collapsed ? '8px' : '202px', top: '50%', transform: 'translateY(-50%)', zIndex: 110, background: 'var(--qa-sidebar)', border: `1px solid ${C.border}`, borderRadius: '8px', width: '22px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: C.text, fontSize: '11px', transition: 'left .25s ease', boxShadow: '0 2px 12px rgba(0,0,0,0.15)' }}>
          {collapsed ? '›' : '‹'}
        </button>

        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', marginLeft: collapsed ? '0' : '210px', transition: 'margin-left 0.25s ease' }}>
          {!project && tab === 'projects' && <HRProjectsView onProjectClick={handleProjectClick} />}
          {!project && tab === 'reports' && <HRReportsView />}
          {project && (
            <ProjectShell
              project={project}
              onBack={handleBack}
              user={user}
              page={sPage}
              setPage={setSPage}
              readOnly={true}
            />
          )}
        </main>
      </div>
    </div>
  );
}
