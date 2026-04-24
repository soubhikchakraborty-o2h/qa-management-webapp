import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { C } from './lib/constants';
import { Sidebar } from './components/layout/index';
import AnimBg from './components/ui/AnimBg';
import { Landing, Login, DevEntry, ChooseQA } from './pages/auth';
import { ProjectsPage } from './pages/Projects';
import { ProjectShell } from './pages/ProjectShell';
import { SettingsPage } from './pages/Settings';
import { HRDashboard } from './pages/HRDashboard';

type Screen = 'landing' | 'login' | 'dev_entry' | 'choose_qa' | 'app';

function AppInner() {
  const { user, devName, setDevName, selectedQA, setSelectedQA, logout, loginAsDeveloper } = useAuth();

  const [screen, setScreen] = useState<Screen>(() => {
    const cached = localStorage.getItem('qa_role_choice');
    if (user) return 'app';
    if (cached === 'developer') {
      const savedName = localStorage.getItem('qa_dev_name');
      const savedQA   = localStorage.getItem('qa_selected_qa');
      console.log('[DevFlow] Init — devName:', savedName, '| selectedQA:', savedQA);
      if (savedName && savedQA) return 'app';      // fully completed — skip straight to app
      if (savedName)            return 'choose_qa'; // name entered but QA not yet picked
      return 'dev_entry';
    }
    if (cached === 'qa') return 'login';
    return 'landing';
  });

  const [sPage, setSPage] = useState('projects');
  const [project, setProject] = useState<any>(null);
  // For returning developers, restore the QA filter from localStorage
  const [filterQA, setFilterQA] = useState<string | null>(() => {
    if (localStorage.getItem('qa_role_choice') === 'developer') {
      return localStorage.getItem('qa_selected_qa') || null;
    }
    return null;
  });
  // Team view: which QA's projects is the current user browsing (read-only)
  const [teamViewMember, setTeamViewMember] = useState<{ id: string; name: string } | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  // Redirect to app once logged in
  useEffect(() => {
    if (user && screen !== 'app') setScreen('app');
  }, [user]);

  const inside = !!project;

  const openProject = (p: any) => {
    if (p._viewQA) {
      if (typeof p._viewQA === 'string') {
        // Developer mode — filter by QA name
        setFilterQA(p._viewQA);
      } else {
        // QA team view — browse another QA's projects (read-only)
        setTeamViewMember(p._viewQA);
      }
      setProject(null); setSPage('projects'); return;
    }
    setProject(p); setSPage('overview');
    if (!user) return; // developer mode — preserve filterQA
    setFilterQA(null);
  };

  const closeProject = () => {
    setProject(null);
    setSPage('projects');
    // Restore QA filter for developer mode
    if (!user) setFilterQA(localStorage.getItem('qa_selected_qa') || null);
    // teamViewMember preserved — user returns to the team view list they came from
  };

  const clearTeamView = () => setTeamViewMember(null);

  const handleReassignComplete = () => {
    setTeamViewMember(null);
    setProject(null);
    setSPage('projects');
  };

  const clearDevState = () => {
    localStorage.removeItem('qa_role_choice');
    localStorage.removeItem('qa_dev_name');
    localStorage.removeItem('qa_selected_qa');
    setDevName('');
    setSelectedQA('');
    setFilterQA(null);
  };

  const handleSignOut = () => {
    logout();          // clears all auth + dev localStorage and state
    setFilterQA(null);
    setProject(null);
    setSPage('projects');
    setScreen('landing');
  };

  const handleChooseRole = (role: 'qa' | 'developer') => {
    localStorage.setItem('qa_role_choice', role);
    setScreen(role === 'qa' ? 'login' : 'dev_entry');
  };

  if (screen === 'landing') return <Landing onChoose={handleChooseRole} />;

  if (screen === 'login') return (
    <Login
      onBack={() => { localStorage.removeItem('qa_role_choice'); setScreen('landing'); }}
    />
  );

  if (screen === 'dev_entry') return (
    <DevEntry
      onBack={() => { clearDevState(); setScreen('landing'); }}
      onContinue={name => {
        console.log('[DevFlow] Name entered:', name, '— moving to choose_qa');
        setDevName(name);
        setScreen('choose_qa');
      }}
    />
  );

  if (screen === 'choose_qa') return (
    <ChooseQA
      devName={devName}
      onChoose={qa => {
        console.log('[DevFlow] QA selected:', qa.name, '— navigating to app');
        loginAsDeveloper(devName, qa.name);
        setFilterQA(qa.name);
        setScreen('app');
      }}
      onBack={() => {
        console.log('[DevFlow] Back to dev_entry — clearing selectedQA');
        setSelectedQA('');
        setFilterQA(null);
        setScreen('dev_entry');
      }}
    />
  );

  // ── HR Dashboard ──────────────────────────────────────────
  if (screen === 'app' && user?.role === 'hr') {
    return <HRDashboard user={user} onSignOut={handleSignOut} />;
  }

  // ── Main App Shell ────────────────────────────────────────
  const effectiveUser = user || { name: devName || 'Developer', role: 'developer', id: null };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: C.bg, color: C.text, position: 'relative', transition: 'background-color 0.25s ease' }}>
      <AnimBg />
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', width: '100%', minHeight: '100vh' }}>
        <Sidebar
          page={sPage} setPage={setSPage} user={effectiveUser}
          insideProject={inside} onBackToProjects={closeProject} collapsed={collapsed}
          onSignOut={handleSignOut}
        />

        {/* Sidebar toggle */}
        <button onClick={() => setCollapsed(!collapsed)} style={{ position: 'fixed', left: collapsed ? '8px' : '202px', top: '50%', transform: 'translateY(-50%)', zIndex: 110, background: 'var(--qa-sidebar)', border: `1px solid ${C.border}`, borderRadius: '8px', width: '22px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: C.text, fontSize: '11px', transition: 'left .25s ease', boxShadow: '0 2px 12px rgba(0,0,0,0.15)' }}>
          {collapsed ? '›' : '‹'}
        </button>

        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', marginLeft: collapsed ? '0' : '210px', transition: 'margin-left 0.25s ease' }}>
          {!inside && sPage === 'projects' && (
            <ProjectsPage
              user={effectiveUser}
              onProjectClick={openProject}
              filterByQA={filterQA}
              teamViewMember={teamViewMember}
              onClearTeamView={clearTeamView}
            />
          )}
          {!inside && sPage === 'settings' && <SettingsPage />}
          {inside && (
            <ProjectShell
              project={project}
              onBack={closeProject}
              user={effectiveUser}
              page={sPage}
              setPage={setSPage}
              readOnly={!!teamViewMember}
              onReassignComplete={handleReassignComplete}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
