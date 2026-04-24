import express from 'express';
import supabase from '../lib/supabase.js';

const router = express.Router();

// GET comments for an entity
router.get('/', async (req, res) => {
  try {
    const { entity_type, entity_id } = req.query;
    if (!entity_type || !entity_id) return res.status(400).json({ error: 'entity_type and entity_id required' });
    const { data, error } = await supabase.from('comments')
      .select('*').eq('entity_type', entity_type).eq('entity_id', entity_id).order('created_at');
    if (error) throw error;
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST add comment
router.post('/', async (req, res) => {
  try {
    const { entity_type, entity_id, author_name, author_type, author_id, body } = req.body;
    if (!entity_type || !entity_id || !author_name || !author_type || !body)
      return res.status(400).json({ error: 'All fields required' });
    const { data, error } = await supabase.from('comments')
      .insert({ entity_type, entity_id, author_name, author_type, author_id, body }).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;
