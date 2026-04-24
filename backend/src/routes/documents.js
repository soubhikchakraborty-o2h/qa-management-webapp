import express from 'express';
import supabase from '../lib/supabase.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const { project_id } = req.query;
    if (!project_id) return res.status(400).json({ error: 'project_id required' });
    const { data, error } = await supabase.from('documents')
      .select('*, uploaded_by_user:users!documents_uploaded_by_fkey(id,name)')
      .eq('project_id', project_id).order('doc_category').order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', authenticate, async (req, res) => {
  try {
    const { project_id, type, label, url, file_path, file_size, file_mime, folder, doc_category } = req.body;
    if (!project_id || !type || !label) return res.status(400).json({ error: 'project_id, type, label required' });
    const { data, error } = await supabase.from('documents')
      .insert({ project_id, type, label, url, file_path, file_size, file_mime, folder: folder || 'additional_documents', doc_category: doc_category || 'additional', uploaded_by: req.user.id })
      .select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    await supabase.from('documents').delete().eq('id', req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;
