import express from 'express';
import supabase from '../lib/supabase.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// GET /api/reports/hr?from=2025-03-01&to=2025-03-31
router.get('/hr', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'hr' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const { from, to } = req.query;
    if (!from || !to) return res.status(400).json({ error: 'from and to dates required' });

    const toEnd = to + 'T23:59:59';

    const [bugsRes, testCasesRes, qaUsersRes, projectsRes] = await Promise.all([
      supabase.from('bugs').select('*, projects(name, project_code)').gte('created_at', from).lte('created_at', toEnd),
      supabase.from('test_cases').select('*, projects(name, project_code)').gte('created_at', from).lte('created_at', toEnd),
      supabase.from('users').select('id, name, role').eq('is_active', true),
      supabase.from('projects').select('id, name, project_code, status'),
    ]);

    const bugs = bugsRes.data || [];
    const testCases = testCasesRes.data || [];
    const qaUsers = qaUsersRes.data || [];
    const allProjects = projectsRes.data || [];

    // Project-wise breakdown
    const projectBreakdown = {};
    allProjects.forEach(p => {
      projectBreakdown[p.name] = { project_code: p.project_code, status: p.status, bugs: [], testCases: [] };
    });
    bugs.forEach(bug => {
      const proj = bug.projects?.name;
      if (proj && projectBreakdown[proj]) projectBreakdown[proj].bugs.push(bug);
    });
    testCases.forEach(tc => {
      const proj = tc.projects?.name;
      if (proj && projectBreakdown[proj]) projectBreakdown[proj].testCases.push(tc);
    });

    // QA performance
    const qaPerformance = {};
    qaUsers.forEach(u => {
      qaPerformance[u.name] = {
        role: u.role,
        bugsLogged: bugs.filter(b => b.reported_by === u.id || b.created_by === u.id).length,
        testCasesCreated: testCases.filter(tc => tc.created_by === u.id).length,
      };
    });

    // Developer analysis from bug fields
    const developerStats = {};
    bugs.forEach(bug => {
      const dev = bug.developed_by || bug.assignee;
      if (dev) {
        if (!developerStats[dev]) developerStats[dev] = { bugsInCode: 0, bugsFixed: 0, bugsOpen: 0 };
        developerStats[dev].bugsInCode++;
        const status = (bug.status || '').toLowerCase();
        if (['fixed', 'closed', 'resolved'].includes(status)) developerStats[dev].bugsFixed++;
        else developerStats[dev].bugsOpen++;
      }
    });

    // Bug status breakdown
    const bugsByStatus = {};
    bugs.forEach(bug => {
      const s = bug.status || 'Unknown';
      bugsByStatus[s] = (bugsByStatus[s] || 0) + 1;
    });

    // Bug priority breakdown
    const bugsByPriority = {};
    bugs.forEach(bug => {
      const p = bug.priority || 'Unknown';
      bugsByPriority[p] = (bugsByPriority[p] || 0) + 1;
    });

    return res.json({
      period: { from, to },
      projectBreakdown,
      qaPerformance,
      developerStats,
      bugsByStatus,
      bugsByPriority,
      totals: {
        totalBugs: bugs.length,
        totalTestCases: testCases.length,
        totalProjects: allProjects.length,
        activeProjects: allProjects.filter(p => p.status === 'active').length,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
