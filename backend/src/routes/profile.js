import express from 'express';
import bcrypt from 'bcryptjs';
import supabase from '../lib/supabase.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// POST /api/profile/avatar — stores base64 data URL in users.avatar_url
router.post('/avatar', authenticate, async (req, res) => {
  try {
    const { avatar_url } = req.body;
    if (!avatar_url || !avatar_url.startsWith('data:image/')) {
      return res.status(400).json({ error: 'Invalid image data' });
    }
    if (Buffer.byteLength(avatar_url, 'utf8') > 2 * 1024 * 1024) {
      return res.status(400).json({ error: 'Image too large (max 2MB)' });
    }
    const { data, error } = await supabase
      .from('users')
      .update({ avatar_url })
      .eq('id', req.user.id)
      .select('id,name,username,role,avatar_url')
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/profile/change-password
router.post('/change-password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Both fields required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }
    const { data: user, error } = await supabase
      .from('users')
      .select('password_hash')
      .eq('id', req.user.id)
      .single();
    if (error) throw error;
    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) return res.status(400).json({ error: 'Current password is incorrect' });
    const password_hash = await bcrypt.hash(newPassword, 10);
    await supabase.from('users').update({ password_hash }).eq('id', req.user.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;
