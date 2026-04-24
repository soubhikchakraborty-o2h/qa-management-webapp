import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import projectRoutes from './routes/projects.js';
import testCaseRoutes from './routes/testcases.js';
import bugRoutes from './routes/bugs.js';
import automationRoutes from './routes/automation.js';
import documentRoutes from './routes/documents.js';
import settingsRoutes from './routes/settings.js';
import teamRoutes from './routes/team.js';
import commentRoutes from './routes/comments.js';
import reportsRoutes from './routes/reports.js';
import profileRoutes from './routes/profile.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/test-cases', testCaseRoutes);
app.use('/api/bugs', bugRoutes);
app.use('/api/automation', automationRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/profile', profileRoutes);

app.get('/health', (_, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

app.listen(PORT, () => console.log(`🚀 QA API running on port ${PORT}`));
