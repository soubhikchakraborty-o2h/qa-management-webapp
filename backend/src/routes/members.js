import express from 'express';
import supabase from '../lib/supabase.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/', async (req, res) => {
  const { type } = req.query;
  let query = supabase.from('global_members').select('*').order('name');
  if (type) query = query.eq('type', type);
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  return res.json(data);
});

router.post('/', authenticate, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'qa_lead') {
    return res.status(403).json({ error: 'Not authorized' });
  }
  const { name, type, department } = req.body;
  if (!name || !type) return res.status(400).json({ error: 'name and type required' });
  const { data, error } = await supabase
    .from('global_members')
    .insert({ name, type, department: department || '' })
    .select().single();
  if (error) return res.status(500).json({ error: error.message });
  return res.json(data);
});

router.delete('/:id', authenticate, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'qa_lead') {
    return res.status(403).json({ error: 'Not authorized' });
  }
  const { error } = await supabase
    .from('global_members').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  return res.json({ success: true });
});

export default router;
