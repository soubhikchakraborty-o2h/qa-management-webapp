import express from 'express';
import supabase from '../lib/supabase.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

const canEdit = async (projectId, user) => {
  if (['admin', 'qa_lead'].includes(user.role)) return true;
  const { data } = await supabase.from('project_assignments').select('id').eq('project_id', projectId).eq('user_id', user.id).single();
  return !!data;
};

router.get('/', authenticate, async (req, res) => {
  try {
    const { project_id } = req.query;
    if (!project_id) return res.status(400).json({ error: 'project_id required' });
    const { data, error } = await supabase.from('test_cases')
      .select('*, created_by_user:users!test_cases_created_by_fkey(id,name)')
      .eq('project_id', project_id).order('test_case_id');
    if (error) throw error;
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase.from('test_cases')
      .select('*, created_by_user:users!test_cases_created_by_fkey(id,name)')
      .eq('id', req.params.id).single();
    if (error) throw error;
    const { data: comments } = await supabase.from('comments')
      .select('*').eq('entity_type', 'test_case').eq('entity_id', req.params.id).order('created_at');
    res.json({ ...data, comments: comments || [] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', authenticate, async (req, res) => {
  try {
    const { project_id, module, summary, preconditions, steps, expected_result, priority, labels, platform } = req.body;
    if (!project_id || !module || !summary) return res.status(400).json({ error: 'project_id, module, summary required' });
    if (!await canEdit(project_id, req.user)) return res.status(403).json({ error: 'No edit access' });

    const { data: proj } = await supabase.from('projects').select('project_code').eq('id', project_id).single();
    const { data: tcId } = await supabase.rpc('get_next_test_case_id', { p_project_code: proj.project_code, p_project_id: project_id });

    const { data, error } = await supabase.from('test_cases').insert({
      project_id, test_case_id: tcId, module, summary, preconditions,
      steps: steps || [], expected_result, priority: priority || 'Medium',
      labels: labels || [], platform: platform || 'Web', created_by: req.user.id
    }).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/bulk', authenticate, async (req, res) => {
  try {
    const { project_id, test_cases } = req.body;
    if (!project_id || !Array.isArray(test_cases) || test_cases.length === 0)
      return res.status(400).json({ error: 'project_id and test_cases[] required' });

    const { data: proj } = await supabase.from('projects').select('project_code').eq('id', project_id).single();
    const { data: existing } = await supabase.from('test_cases').select('test_case_id').eq('project_id', project_id);

    const maxNum = (existing || []).reduce((max, tc) => {
      const num = parseInt(tc.test_case_id.slice(proj.project_code.length), 10) || 0;
      return Math.max(max, num);
    }, 0);

    const toInsert = test_cases.map((tc, i) => ({
      project_id,
      test_case_id: `${proj.project_code}${String(maxNum + i + 1).padStart(3, '0')}`,
      module: tc.module || 'General',
      summary: tc.summary || '',
      preconditions: tc.preconditions || '',
      steps: Array.isArray(tc.steps) ? tc.steps : [],
      expected_result: tc.expected_result || '',
      priority: tc.priority || 'Medium',
      labels: Array.isArray(tc.labels) ? tc.labels : [],
      platform: tc.platform || 'Web',
      execution_status: 'Not Executed',
      test_result: 'N/A',
      is_auto_generated: false,
      created_by: req.user.id,
    }));

    const { data, error } = await supabase.from('test_cases').insert(toInsert).select();
    if (error) throw error;
    res.status(201).json({ imported: data.length, test_cases: data });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/:id', authenticate, async (req, res) => {
  try {
    const { data: tc } = await supabase.from('test_cases').select('project_id').eq('id', req.params.id).single();
    if (!await canEdit(tc.project_id, req.user)) return res.status(403).json({ error: 'No edit access' });
    const allowed = ['module', 'summary', 'preconditions', 'steps', 'expected_result', 'priority', 'labels', 'platform', 'execution_status', 'test_result'];
    const updates = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));
    const { data, error } = await supabase.from('test_cases').update(updates).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { data: tc } = await supabase.from('test_cases').select('project_id').eq('id', req.params.id).single();
    if (!tc) return res.status(404).json({ error: 'Test case not found' });
    if (!await canEdit(tc.project_id, req.user)) return res.status(403).json({ error: 'No edit access' });
    await supabase.from('test_cases').delete().eq('id', req.params.id);
    const { data: proj } = await supabase.from('projects').select('project_code').eq('id', tc.project_id).single();
    const { data: remaining } = await supabase.from('test_cases').select('id').eq('project_id', tc.project_id).order('created_at');
    if (proj && remaining) {
      for (let i = 0; i < remaining.length; i++) {
        const newId = `${proj.project_code}${String(i + 1).padStart(3, '0')}`;
        await supabase.from('test_cases').update({ test_case_id: newId }).eq('id', remaining[i].id);
      }
    }
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;
