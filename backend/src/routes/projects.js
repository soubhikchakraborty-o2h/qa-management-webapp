import express from 'express';
import supabase from '../lib/supabase.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

const BASE_SELECT = `*, project_assignments(user_id, users(id,name,username,role)), created_by_user:users!projects_created_by_fkey(id,name)`;
const STATUS_ORDER = { active: 0, in_review: 1, on_hold: 2, completed: 3 };
const sortByStatus = arr => [...arr].sort((a, b) => (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9));

const withCounts = async (projects) => {
  if (!projects || !projects.length) return projects;
  const ids = projects.map(p => p.id);
  const [{ data: tcs }, { data: bugsData }, { data: passTcs }] = await Promise.all([
    supabase.from('test_cases').select('project_id').in('project_id', ids),
    supabase.from('bugs').select('project_id').in('project_id', ids),
    supabase.from('test_cases').select('project_id').eq('test_result', 'Pass').in('project_id', ids),
  ]);
  const tcMap = {}, bugMap = {}, passMap = {};
  (tcs || []).forEach(r => { tcMap[r.project_id] = (tcMap[r.project_id] || 0) + 1; });
  (bugsData || []).forEach(r => { bugMap[r.project_id] = (bugMap[r.project_id] || 0) + 1; });
  (passTcs || []).forEach(r => { passMap[r.project_id] = (passMap[r.project_id] || 0) + 1; });
  return projects.map(p => ({ ...p, test_case_count: tcMap[p.id] || 0, bug_count: bugMap[p.id] || 0, pass_count: passMap[p.id] || 0 }));
};

// GET projects — own projects by default; ?teamView=true&owner=<userId> for team view
router.get('/', authenticate, async (req, res) => {
  try {
    const { teamView, owner } = req.query;
    let query = supabase.from('projects').select(BASE_SELECT);
    let readOnly = false;

    if (teamView === 'true' && owner) {
      query = query.eq('created_by', owner);
      readOnly = true;
    } else if (req.user.role === 'admin' || req.user.role === 'qa_lead' || req.user.role === 'hr') {
      // admin, qa_lead, and HR see all projects
      if (req.user.role === 'hr') readOnly = true;
    } else {
      query = query.or(`created_by.eq.${req.user.id},additional_qas.cs.{${req.user.id}}`);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ projects: sortByStatus(await withCounts(data)), readOnly });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET projects for developer view — public, no token required
router.get('/dev-view', async (req, res) => {
  try {
    const qaName = (req.query.qa || '').trim();
    if (!qaName) return res.status(400).json({ error: 'qa param required' });

    const { data: matches } = await supabase
      .from('users')
      .select('id, name, role')
      .ilike('name', `${qaName}%`)
      .eq('is_active', true)
      .limit(1);

    const qaUser = matches?.[0];
    if (!qaUser) return res.json([]);

    let query = supabase.from('projects').select(BASE_SELECT);
    // Always restrict to only the selected QA's own projects, regardless of their role
    query = query.or(`created_by.eq.${qaUser.id},additional_qas.cs.{${qaUser.id}}`);

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    res.json(sortByStatus(await withCounts(data || [])));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET single project
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select(`*, project_assignments(user_id, users(id,name,username,role)), project_developers(*), documents(*), created_by_user:users!projects_created_by_fkey(id,name)`)
      .eq('id', req.params.id).single();
    if (error) throw error;
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST create project — creator becomes owner via created_by
router.post('/', authenticate, async (req, res) => {
  try {
    const { name, project_code, app_type, figma_url, frd_url, description, start_date, end_date, ba_name, designer_name, project_type } = req.body;
    if (!name || !project_code || !app_type) return res.status(400).json({ error: 'name, project_code, app_type required' });

    // Reject duplicate project names (case-insensitive)
    const { data: existing } = await supabase.from('projects').select('id').ilike('name', name.trim()).single();
    if (existing) return res.status(409).json({ error: 'A project with this name already exists' });

    const { data: project, error } = await supabase
      .from('projects')
      .insert({ name, project_code: project_code.toUpperCase(), app_type, figma_url, frd_url, description, start_date: start_date || null, end_date: end_date || null, ba_name: ba_name || null, designer_name: designer_name || null, project_type: project_type || null, created_by: req.user.id })
      .select().single();
    if (error) throw error;

    const scripts = buildScriptTemplates(app_type, name, project_code.toUpperCase());
    if (scripts.length) await supabase.from('automation_scripts').insert(scripts.map(s => ({ ...s, project_id: project.id })));

    res.status(201).json(project);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PATCH update project — only owner, admin, or qa_lead can update
router.patch('/:id', authenticate, async (req, res) => {
  try {
    const { data: proj } = await supabase.from('projects').select('created_by').eq('id', req.params.id).single();
    if (!proj) return res.status(404).json({ error: 'Project not found' });
    if (proj.created_by !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'qa_lead') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const allowed = ['name', 'app_type', 'status', 'figma_url', 'frd_url', 'description', 'project_code', 'additional_qas', 'start_date', 'end_date', 'ba_name', 'designer_name', 'project_type'];
    const updates = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));
    const { data, error } = await supabase.from('projects').update(updates).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT reassign project ownership — qa_lead and admin only
router.put('/:id/reassign', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'qa_lead' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }
    const { newOwnerId } = req.body;
    if (!newOwnerId) return res.status(400).json({ error: 'newOwnerId required' });
    const { data, error } = await supabase
      .from('projects')
      .update({ created_by: newOwnerId, additional_qas: [] })
      .eq('id', req.params.id)
      .select().single();
    if (error) throw error;
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT add an additional QA to a project — qa_lead and admin only
router.put('/:id/add-qa', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'qa_lead' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }
    const { additionalQAId } = req.body;
    if (!additionalQAId) return res.status(400).json({ error: 'additionalQAId required' });

    const { data: project, error: fetchErr } = await supabase
      .from('projects')
      .select('additional_qas, created_by')
      .eq('id', req.params.id)
      .single();
    if (fetchErr) throw fetchErr;

    if (project.created_by === additionalQAId) {
      return res.status(400).json({ error: 'This QA is already the project owner' });
    }
    const current = project.additional_qas || [];
    if (current.includes(additionalQAId)) {
      return res.status(400).json({ error: 'This QA is already assigned to this project' });
    }

    const { data, error } = await supabase
      .from('projects')
      .update({ additional_qas: [...current, additionalQAId] })
      .eq('id', req.params.id)
      .select().single();
    if (error) throw error;
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET developer roster for a project
router.get('/:id/roster', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase.from('project_developers')
      .select('developer_name').eq('project_id', req.params.id).order('created_at');
    if (error) throw error;
    res.json((data || []).map(d => d.developer_name));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT add or remove developer from roster
router.put('/:id/roster', authenticate, async (req, res) => {
  try {
    const { name, action } = req.body;
    if (!name || !action) return res.status(400).json({ error: 'name and action required' });
    if (action === 'add') {
      await supabase.from('project_developers')
        .insert({ project_id: req.params.id, developer_name: name.trim(), added_by: req.user.id })
        .select().single();
    } else if (action === 'remove') {
      await supabase.from('project_developers')
        .delete().eq('project_id', req.params.id).eq('developer_name', name);
    }
    const { data } = await supabase.from('project_developers')
      .select('developer_name').eq('project_id', req.params.id).order('created_at');
    res.json((data || []).map(d => d.developer_name));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST add developer to project
router.post('/:id/developers', authenticate, async (req, res) => {
  try {
    const { developer_name, developer_email } = req.body;
    if (!developer_name) return res.status(400).json({ error: 'developer_name required' });
    const { data, error } = await supabase.from('project_developers')
      .insert({ project_id: req.params.id, developer_name, developer_email, added_by: req.user.id })
      .select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE remove developer from project
router.delete('/:id/developers/:devId', authenticate, async (req, res) => {
  try {
    await supabase.from('project_developers').delete().eq('id', req.params.devId);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/projects/:id — owner, admin, qa_lead only; cascades related data
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { data: proj } = await supabase.from('projects').select('created_by').eq('id', req.params.id).single();
    if (!proj) return res.status(404).json({ error: 'Project not found' });
    if (req.user.role !== 'admin' && req.user.role !== 'qa_lead' && proj.created_by !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    // Fetch bug IDs to clean up bug_resources (FK: bug_resources.bug_id → bugs.id)
    const { data: projectBugs } = await supabase.from('bugs').select('id').eq('project_id', req.params.id);
    const bugIds = (projectBugs || []).map(b => b.id);
    if (bugIds.length) await supabase.from('bug_resources').delete().in('bug_id', bugIds);
    // Delete bugs before test_cases (bugs.test_case_id → test_cases.id FK)
    await supabase.from('bugs').delete().eq('project_id', req.params.id);
    // Delete remaining children in parallel
    await Promise.all([
      supabase.from('test_cases').delete().eq('project_id', req.params.id),
      supabase.from('automation_scripts').delete().eq('project_id', req.params.id),
      supabase.from('documents').delete().eq('project_id', req.params.id),
      supabase.from('project_developers').delete().eq('project_id', req.params.id),
      supabase.from('project_assignments').delete().eq('project_id', req.params.id),
    ]);
    await supabase.from('projects').delete().eq('id', req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

function buildScriptTemplates(appType, projectName, code) {
  const templates = [];
  if (appType === 'web' || appType === 'both') {
    templates.push({ type: 'playwright', script_name: `${code}_visual.spec.ts`, script_content: playwrightVisual(projectName) });
    templates.push({ type: 'playwright', script_name: `${code}_functional.spec.ts`, script_content: playwrightFunctional(projectName) });
  }
  if (appType === 'mobile' || appType === 'both') {
    templates.push({ type: 'selenium', script_name: `${code}_mobile.py`, script_content: seleniumTemplate(projectName) });
  }
  return templates;
}

const playwrightVisual = (name) => `import { test, expect } from '@playwright/test';
// Visual Tests — ${name}
test.describe('Visual — ${name}', () => {
  test.beforeEach(async ({ page }) => { await page.goto(process.env.APP_URL || ''); });
  test('homepage snapshot', async ({ page }) => { await expect(page).toHaveScreenshot('home.png'); });
  test('mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await expect(page).toHaveScreenshot('home-mobile.png');
  });
});`;

const playwrightFunctional = (name) => `import { test, expect } from '@playwright/test';
// Functional Tests — ${name}
test.describe('Auth — ${name}', () => {
  test('valid login', async ({ page }) => {
    await page.goto(process.env.APP_URL + '/login');
    await page.fill('[data-testid="username"]', process.env.TEST_USER || '');
    await page.fill('[data-testid="password"]', process.env.TEST_PASS || '');
    await page.click('[data-testid="login-btn"]');
    await expect(page).toHaveURL(/dashboard/);
  });
  test('invalid login shows error', async ({ page }) => {
    await page.goto(process.env.APP_URL + '/login');
    await page.fill('[data-testid="username"]', 'bad@user.com');
    await page.fill('[data-testid="password"]', 'wrong');
    await page.click('[data-testid="login-btn"]');
    await expect(page.locator('[data-testid="error"]')).toBeVisible();
  });
});`;

const seleniumTemplate = (name) => `# Mobile Tests — ${name}
from appium import webdriver
import unittest, os

class ${name.replace(/\s+/g, '')}Tests(unittest.TestCase):
  def setUp(self):
    caps = { 'platformName': 'Android', 'deviceName': os.getenv('DEVICE','emulator'), 'app': os.getenv('APP_PATH',''), 'automationName': 'UiAutomator2' }
    self.driver = webdriver.Remote(os.getenv('APPIUM_URL','http://localhost:4723/wd/hub'), caps)
  def test_launches(self): self.assertIsNotNone(self.driver.current_activity)
  def tearDown(self):
    if self.driver: self.driver.quit()

if __name__ == '__main__': unittest.main()`;

export default router;
