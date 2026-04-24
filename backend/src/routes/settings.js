import express from 'express';
import supabase from '../lib/supabase.js';
import { authenticate, requireAdminOrLead } from '../middleware/auth.js';

const router = express.Router();
const VALID_CATS = ['bug_status','qa_status','label','priority','platform','execution_status','test_result'];

const DEFAULTS = {
  label: [
    { value: 'Smoke',       color: '#60a5fa', sort_order: 1, is_default: false },
    { value: 'Regression',  color: '#c084fc', sort_order: 2, is_default: false },
    { value: 'Sanity',      color: '#fbbf24', sort_order: 3, is_default: false },
    { value: 'Integration', color: '#34d399', sort_order: 4, is_default: false },
    { value: 'E2E',         color: '#f472b6', sort_order: 5, is_default: false },
  ],
  platform: [
    { value: 'Web',     color: '#60a5fa', sort_order: 1, is_default: false },
    { value: 'Android', color: '#34d399', sort_order: 2, is_default: false },
    { value: 'iOS',     color: '#c084fc', sort_order: 3, is_default: false },
    { value: 'Both',    color: '#7c6af7', sort_order: 4, is_default: false },
  ],
};

router.get('/', async (_req, res) => {
  try {
    const { data, error } = await supabase.from('system_settings').select('*').order('category').order('sort_order');
    if (error) throw error;
    const grouped = VALID_CATS.reduce((acc, cat) => {
      const rows = data.filter(d => d.category === cat);
      acc[cat] = rows.length > 0 ? rows : (DEFAULTS[cat] || []).map(d => ({ ...d, category: cat, id: null }));
      return acc;
    }, {});
    res.json(grouped);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', authenticate, requireAdminOrLead, async (req, res) => {
  try {
    const { category, value, color, sort_order } = req.body;
    if (!category || !value) return res.status(400).json({ error: 'category and value required' });
    if (!VALID_CATS.includes(category)) return res.status(400).json({ error: 'Invalid category' });
    const { data, error } = await supabase.from('system_settings')
      .insert({ category, value, color: color || '#64748b', sort_order: sort_order || 99, created_by: req.user.id })
      .select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/:id', authenticate, requireAdminOrLead, async (req, res) => {
  try {
    const { value, color, sort_order, is_default } = req.body;
    const { data, error } = await supabase.from('system_settings')
      .update({ value, color, sort_order, is_default }).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', authenticate, requireAdminOrLead, async (req, res) => {
  try {
    await supabase.from('system_settings').delete().eq('id', req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;
