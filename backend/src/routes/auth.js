import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import supabase from '../lib/supabase.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

    const { data: user, error } = await supabase
      .from('users').select('*').eq('username', username.toLowerCase()).eq('is_active', true).single();

    if (error || !user) return res.status(401).json({ error: 'Invalid credentials' });
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: { id: user.id, name: user.name, username: user.username, role: user.role, is_first_login: user.is_first_login, has_claude_key: !!user.claude_api_key }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/save-claude-key
router.post('/save-claude-key', authenticate, async (req, res) => {
  try {
    const { claude_api_key } = req.body;
    await supabase.from('users').update({ claude_api_key, is_first_login: false }).eq('id', req.user.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/skip-claude-key
router.post('/skip-claude-key', authenticate, async (req, res) => {
  try {
    await supabase.from('users').update({ is_first_login: false }).eq('id', req.user.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, (req, res) => res.json({ user: req.user }));

// POST /api/auth/hr-login
router.post('/hr-login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const { data: hr, error } = await supabase
      .from('hr_users').select('*').eq('email', email.toLowerCase()).single();

    if (error || !hr) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, hr.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { id: hr.id, role: 'hr', name: hr.name, email: hr.email },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    return res.json({ token, user: { id: hr.id, name: hr.name, role: 'hr', email: hr.email } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
