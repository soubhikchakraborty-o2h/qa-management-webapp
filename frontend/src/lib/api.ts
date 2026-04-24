import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('qa_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-logout on 401 — but only when a QA/admin session exists.
// Developer flow has no token, so a 401 is expected; redirecting would cause an infinite reload loop.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      const hadToken = !!localStorage.getItem('qa_token');
      if (hadToken) {
        localStorage.removeItem('qa_token');
        localStorage.removeItem('qa_user');
        window.location.href = '/';
      }
    }
    return Promise.reject(err);
  }
);

// ── Auth ──────────────────────────────────────────────────────
export const login = (username: string, password: string) =>
  api.post('/auth/login', { username, password }).then(r => r.data);
export const hrLogin = (email: string, password: string) =>
  api.post('/auth/hr-login', { email, password }).then(r => r.data);

// ── Profile ───────────────────────────────────────────────────
export const uploadAvatar = (avatar_url: string) =>
  api.post('/profile/avatar', { avatar_url }).then(r => r.data);
export const changePassword = (currentPassword: string, newPassword: string) =>
  api.post('/profile/change-password', { currentPassword, newPassword }).then(r => r.data);

// ── Team ──────────────────────────────────────────────────────
export const getTeam = () => api.get('/team').then(r => r.data);
export const addMember = (data: any) => api.post('/team', data).then(r => r.data);
export const updateMember = (id: string, data: any) => api.patch(`/team/${id}`, data).then(r => r.data);
export const removeMember = (id: string) => api.delete(`/team/${id}`).then(r => r.data);
export const addQAUser = (data: any) => api.post('/team/qa', data).then(r => r.data);
export const deleteQAUser = (id: string) => api.delete(`/team/${id}`).then(r => r.data);
export const getHRUsers = () => api.get('/team/hr').then(r => r.data);
export const addHRUser = (data: any) => api.post('/team/hr', data).then(r => r.data);
export const deleteHRUser = (id: string) => api.delete(`/team/hr/${id}`).then(r => r.data);

// ── Projects ──────────────────────────────────────────────────
export const getProjects = (params?: { teamView?: boolean; owner?: string }) => {
  const qs = params?.teamView && params.owner ? `?teamView=true&owner=${params.owner}` : '';
  return api.get(`/projects${qs}`).then(r => r.data);
};
export const getProjectsForQA = (qaName: string) => api.get(`/projects/dev-view?qa=${encodeURIComponent(qaName)}`).then(r => r.data);
export const getProject = (id: string) => api.get(`/projects/${id}`).then(r => r.data);
export const createProject = (data: any) => api.post('/projects', data).then(r => r.data);
export const updateProject = (id: string, data: any) => api.patch(`/projects/${id}`, data).then(r => r.data);
export const deleteProject = (id: string) => api.delete(`/projects/${id}`).then(r => r.data);
export const reassignProject = (id: string, newOwnerId: string) => api.put(`/projects/${id}/reassign`, { newOwnerId }).then(r => r.data);
export const addAdditionalQA = (id: string, additionalQAId: string) => api.put(`/projects/${id}/add-qa`, { additionalQAId }).then(r => r.data);
export const getRoster = (projectId: string) => api.get(`/projects/${projectId}/roster`).then(r => r.data);
export const updateRoster = (projectId: string, data: { name: string; action: 'add' | 'remove' }) => api.put(`/projects/${projectId}/roster`, data).then(r => r.data);
export const addDeveloper = (projectId: string, data: any) => api.post(`/projects/${projectId}/developers`, data).then(r => r.data);
export const removeDeveloper = (projectId: string, devId: string) => api.delete(`/projects/${projectId}/developers/${devId}`).then(r => r.data);

// ── Test Cases ────────────────────────────────────────────────
export const getTestCases = (projectId: string) => api.get(`/test-cases?project_id=${projectId}`).then(r => r.data);
export const bulkImportTestCases = (projectId: string, testCases: any[]) =>
  api.post('/test-cases/bulk', { project_id: projectId, test_cases: testCases }).then(r => r.data);
export const getTestCase = (id: string) => api.get(`/test-cases/${id}`).then(r => r.data);
export const createTestCase = (data: any) => api.post('/test-cases', data).then(r => r.data);
export const updateTestCase = (id: string, data: any) => api.patch(`/test-cases/${id}`, data).then(r => r.data);
export const deleteTestCase = (id: string) => api.delete(`/test-cases/${id}`).then(r => r.data);

// ── Bugs ──────────────────────────────────────────────────────
export const getBugs = (projectId: string) => api.get(`/bugs?project_id=${projectId}`).then(r => r.data);
export const createBug = (data: any) => api.post('/bugs', data).then(r => r.data);
export const updateBug = (id: string, data: any) => api.patch(`/bugs/${id}`, data).then(r => r.data);
export const deleteBug = (id: string) => api.delete(`/bugs/${id}`).then(r => r.data);
export const bulkImportBugs = (projectId: string, bugs: any[]) =>
  api.post('/bugs/bulk', { project_id: projectId, bugs }).then(r => r.data);
export const addBugResource = (bugId: string, data: any) => api.post(`/bugs/${bugId}/resources`, data).then(r => r.data);
export const deleteBugResource = (bugId: string, resourceId: string) => api.delete(`/bugs/${bugId}/resources/${resourceId}`).then(r => r.data);

// ── Comments ──────────────────────────────────────────────────
export const getComments = (entityType: string, entityId: string) =>
  api.get(`/comments?entity_type=${entityType}&entity_id=${entityId}`).then(r => r.data);
export const addComment = (data: any) => api.post('/comments', data).then(r => r.data);

// ── Automation ────────────────────────────────────────────────
export const getAutomation = (projectId: string) => api.get(`/automation?project_id=${projectId}`).then(r => r.data);
export const updateScript = (id: string, data: any) => api.patch(`/automation/${id}`, data).then(r => r.data);
export const deleteAutomationScript = (id: string) => api.delete(`/automation/${id}`).then(r => r.data);
export const saveRunConfig = (id: string, data: any) => api.post(`/automation/${id}/run-config`, data).then(r => r.data);
export const uploadScript = (id: string, data: { content: string; file_name: string }) =>
  api.post(`/automation/${id}/upload`, data).then(r => r.data);

// ── Documents ─────────────────────────────────────────────────
export const getDocuments = (projectId: string) => api.get(`/documents?project_id=${projectId}`).then(r => r.data);
export const addDocument = (data: any) => api.post('/documents', data).then(r => r.data);
export const deleteDocument = (id: string) => api.delete(`/documents/${id}`).then(r => r.data);

// ── Settings ──────────────────────────────────────────────────
export const getSettings = () => api.get('/settings').then(r => r.data);
export const addSetting = (data: any) => api.post('/settings', data).then(r => r.data);
export const updateSetting = (id: string, data: any) => api.patch(`/settings/${id}`, data).then(r => r.data);
export const deleteSetting = (id: string) => api.delete(`/settings/${id}`).then(r => r.data);

// ── Reports ───────────────────────────────────────────────────
export const getHRReport = (from: string, to: string) =>
  api.get(`/reports/hr?from=${from}&to=${to}`).then(r => r.data);

export default api;
