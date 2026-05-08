import express from 'express';
import supabase from '../lib/supabase.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router({ mergeParams: true });

// GET — public (developers can view via dev-flow)
router.get('/', async (req, res) => {
  try {
    const { id: projectId } = req.params;
    const { data, error } = await supabase
      .from('project_credentials')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST — QA only
router.post('/', authenticate, async (req, res) => {
  try {
    const { id: projectId } = req.params;
    const { user_role, username, password, url, notes } = req.body;
    if (!user_role) return res.status(400).json({ error: 'user_role is required' });
    const { data, error } = await supabase
      .from('project_credentials')
      .insert({ project_id: projectId, user_role, username: username || '', password: password || '', url: url || '', notes: notes || '', created_by: req.user.id })
      .select().single();
    if (error) throw error;
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PATCH — QA only
router.patch('/:credId', authenticate, async (req, res) => {
  try {
    const { user_role, username, password, url, notes } = req.body;
    const updates = {};
    if (user_role !== undefined) updates.user_role = user_role;
    if (username !== undefined) updates.username = username;
    if (password !== undefined) updates.password = password;
    if (url !== undefined) updates.url = url;
    if (notes !== undefined) updates.notes = notes;
    const { data, error } = await supabase.from('project_credentials').update(updates).eq('id', req.params.credId).select().single();
    if (error) throw error;
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE — QA only
router.delete('/:credId', authenticate, async (req, res) => {
  try {
    const { error } = await supabase.from('project_credentials').delete().eq('id', req.params.credId);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;
