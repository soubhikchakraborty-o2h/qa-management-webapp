import express from 'express';
import supabase from '../lib/supabase.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const { project_id } = req.query;
    if (!project_id) return res.status(400).json({ error: 'project_id required' });
    const { data, error } = await supabase.from('automation_scripts')
      .select('*').eq('project_id', project_id).order('type');
    if (error) throw error;
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/:id', authenticate, async (req, res) => {
  try {
    const { script_content, script_name } = req.body;
    const { data, error } = await supabase.from('automation_scripts')
      .update({ script_content, script_name }).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/:id/upload', authenticate, async (req, res) => {
  try {
    const { content, file_name } = req.body;
    const { data, error } = await supabase.from('automation_scripts')
      .update({ content, file_name, uploaded_at: new Date().toISOString() })
      .eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    await supabase.from('automation_scripts').delete().eq('id', req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/:id/run-config', async (req, res) => {
  try {
    const run_config = { ...req.body, saved_at: new Date().toISOString() };
    const { data, error } = await supabase.from('automation_scripts')
      .update({ run_config, last_run_at: new Date().toISOString(), last_run_status: 'configured' })
      .eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;
