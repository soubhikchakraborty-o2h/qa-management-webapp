import express from 'express';
import jwt from 'jsonwebtoken';
import supabase from '../lib/supabase.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { project_id } = req.query;
    if (!project_id) return res.status(400).json({ error: 'project_id required' });
    // Verify token if provided; reject invalid tokens but allow no-token (developer flow)
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        jwt.verify(token, process.env.JWT_SECRET);
      } catch {
        return res.status(401).json({ error: 'Invalid token' });
      }
    }
    const { data, error } = await supabase.from('bugs')
      .select('*, bug_resources(*), reported_by_user:users!bugs_reported_by_fkey(id,name), test_case:test_cases(test_case_id,summary)')
      .eq('project_id', project_id).order('sl_no');
    if (error) throw error;
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', authenticate, async (req, res) => {
  try {
    const { project_id, test_case_id, module, summary, assignee, developed_by } = req.body;
    if (!project_id || !module || !summary) return res.status(400).json({ error: 'project_id, module, summary required' });
    const { data: slNo } = await supabase.rpc('get_next_bug_sl_no', { p_project_id: project_id });
    const { data: bug, error } = await supabase.from('bugs')
      .insert({ project_id, test_case_id, sl_no: slNo, module, summary, assignee: assignee || null, developed_by: developed_by || '', reported_by: req.user.id })
      .select().single();
    if (error) throw error;
    res.status(201).json(bug);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/bulk', authenticate, async (req, res) => {
  try {
    const { project_id, bugs } = req.body;
    if (!project_id || !Array.isArray(bugs) || bugs.length === 0)
      return res.status(400).json({ error: 'project_id and bugs[] required' });
    const { data: existing } = await supabase.from('bugs').select('sl_no').eq('project_id', project_id).order('sl_no', { ascending: false }).limit(1);
    const startSlNo = (existing?.[0]?.sl_no || 0) + 1;
    const toInsert = bugs.map((bug, i) => ({
      project_id,
      sl_no: startSlNo + i,
      module: bug.module || 'General',
      summary: bug.summary || '',
      assignee: bug.assignee || null,
      developed_by: bug.developed_by || '',
      status: bug.status || 'Open',
      developer_comment: bug.developer_comment || '',
      qa_status: bug.qa_status || 'Open',
      qa_comment: bug.qa_comment || '',
      ba_comment: bug.ba_comment || '',
      reported_by: req.user.id,
    }));
    const { data, error } = await supabase.from('bugs').insert(toInsert).select();
    if (error) throw error;
    res.status(201).json({ imported: data.length, bugs: data });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/bugs/export/all — HR + admin, all projects with optional date range
router.get('/export/all', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'hr' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }
    const { from, to } = req.query;
    let query = supabase.from('bugs')
      .select('*, projects(name, project_code), reported_by_user:users!bugs_reported_by_fkey(id,name)')
      .order('created_at', { ascending: false });
    if (from) query = query.gte('created_at', from);
    if (to) query = query.lte('created_at', to + 'T23:59:59');
    const { data, error } = await query;
    if (error) throw error;
    res.json(data || []);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/bugs/export/:projectId — authenticated users, single project with optional date range
router.get('/export/:projectId', authenticate, async (req, res) => {
  try {
    const { from, to } = req.query;
    let query = supabase.from('bugs')
      .select('*, projects(name, project_code), reported_by_user:users!bugs_reported_by_fkey(id,name)')
      .eq('project_id', req.params.projectId)
      .order('sl_no', { ascending: true });
    if (from) query = query.gte('created_at', from);
    if (to) query = query.lte('created_at', to + 'T23:59:59');
    const { data, error } = await query;
    if (error) throw error;
    res.json(data || []);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/:id', async (req, res) => {
  try {
    let userRole = null;
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const { data: user } = await supabase.from('users').select('role').eq('id', decoded.id).single();
        userRole = user?.role || null;
      } catch {
        return res.status(401).json({ error: 'Invalid token' });
      }
    }

    const isQA = ['admin', 'qa_lead', 'qa_engineer'].includes(userRole);
    const allowed = isQA
      ? ['module', 'summary', 'assignee', 'developed_by', 'status', 'developer_comment', 'qa_status', 'qa_comment', 'ba_comment']
      : ['assignee', 'developed_by', 'developer_comment', 'ba_comment', 'status'];
    const updates = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));
    if (Object.keys(updates).length === 0) return res.status(400).json({ error: 'No valid fields to update' });
    const { data, error } = await supabase.from('bugs').update(updates).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/:id/resources', authenticate, async (req, res) => {
  try {
    const { type, label, url, file_path, file_mime } = req.body;
    const { data, error } = await supabase.from('bug_resources')
      .insert({ bug_id: req.params.id, type: type || 'link', label, url, file_path, file_mime }).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id/resources/:resourceId', authenticate, async (req, res) => {
  try {
    await supabase.from('bug_resources').delete().eq('id', req.params.resourceId);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { data: bug } = await supabase.from('bugs').select('project_id').eq('id', req.params.id).single();
    if (!bug) return res.status(404).json({ error: 'Bug not found' });
    await supabase.from('bugs').delete().eq('id', req.params.id);
    const { data: remaining } = await supabase.from('bugs').select('id').eq('project_id', bug.project_id).order('sl_no');
    if (remaining) {
      for (let i = 0; i < remaining.length; i++) {
        await supabase.from('bugs').update({ sl_no: i + 1 }).eq('id', remaining[i].id);
      }
    }
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;
