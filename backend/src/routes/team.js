import express from 'express';
import bcrypt from 'bcryptjs';
import supabase from '../lib/supabase.js';
import { authenticate, requireAdminOrLead } from '../middleware/auth.js';

const router = express.Router();

// ── QA Users ──────────────────────────────────────────────────

router.get('/', authenticate, async (_req, res) => {
  try {
    const { data, error } = await supabase.from('users').select('id,name,username,role,is_active,created_at').order('role');
    if (error) throw error;
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', authenticate, requireAdminOrLead, async (req, res) => {
  try {
    const { name, username, password, role } = req.body;
    if (!name || !username || !password || !role) return res.status(400).json({ error: 'All fields required' });
    const password_hash = await bcrypt.hash(password, 10);
    const { data, error } = await supabase.from('users')
      .insert({ name, username: username.toLowerCase(), password_hash, role })
      .select('id,name,username,role').single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Explicit QA path (same as POST /) — used by Settings page
router.post('/qa', authenticate, requireAdminOrLead, async (req, res) => {
  try {
    const { name, username, password, role } = req.body;
    if (!name || !username || !password || !role) return res.status(400).json({ error: 'All fields required' });
    const password_hash = await bcrypt.hash(password, 10);
    const { data, error } = await supabase.from('users')
      .insert({ name, username: username.toLowerCase(), password_hash, role })
      .select('id,name,username,role').single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/:id', authenticate, requireAdminOrLead, async (req, res) => {
  try {
    const { name, role, is_active, password } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (role) updates.role = role;
    if (typeof is_active === 'boolean') updates.is_active = is_active;
    if (password) updates.password_hash = await bcrypt.hash(password, 10);
    const { data, error } = await supabase.from('users').update(updates).eq('id', req.params.id).select('id,name,username,role,is_active').single();
    if (error) throw error;
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', authenticate, requireAdminOrLead, async (req, res) => {
  try {
    const { data: target } = await supabase.from('users').select('role').eq('id', req.params.id).single();
    if (target?.role === 'admin') return res.status(403).json({ error: 'Cannot delete admin user' });
    await supabase.from('users').update({ is_active: false }).eq('id', req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── HR Users ──────────────────────────────────────────────────

router.get('/hr', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    const { data, error } = await supabase.from('hr_users').select('id,name,email,created_at').order('created_at');
    if (error) throw error;
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/hr', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'All fields required' });
    const hashed = await bcrypt.hash(password, 10);
    const { data, error } = await supabase.from('hr_users')
      .insert({ name, email: email.toLowerCase(), password: hashed, created_by: req.user.id })
      .select('id,name,email,created_at').single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/hr/:id', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    await supabase.from('hr_users').delete().eq('id', req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;
