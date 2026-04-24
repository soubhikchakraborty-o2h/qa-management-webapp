import jwt from 'jsonwebtoken';
import supabase from '../lib/supabase.js';

export const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role === 'hr') {
      const { data: hrUser } = await supabase
        .from('hr_users').select('id,name,email').eq('id', decoded.id).single();
      if (!hrUser) return res.status(401).json({ error: 'User not found' });
      req.user = { ...hrUser, role: 'hr', username: hrUser.email, is_active: true };
      return next();
    }

    const { data: user } = await supabase
      .from('users').select('id,name,username,role,is_active').eq('id', decoded.id).single();
    if (!user || !user.is_active) return res.status(401).json({ error: 'User not found' });
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};

export const requireAdminOrLead = (req, res, next) => {
  if (!['admin', 'qa_lead'].includes(req.user.role))
    return res.status(403).json({ error: 'Admin or QA Lead access required' });
  next();
};
