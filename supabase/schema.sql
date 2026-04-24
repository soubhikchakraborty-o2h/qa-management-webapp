-- ============================================================
-- QUALITY ANALYSIS — SUPABASE SCHEMA
-- O2H Technology · QA Team
-- Run this entire file in Supabase SQL Editor
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── USERS ────────────────────────────────────────────────────
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin','qa_lead','qa_engineer')),
  claude_api_key TEXT,
  is_first_login BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── SYSTEM SETTINGS (chips/dropdown values) ──────────────────
CREATE TABLE system_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category TEXT NOT NULL,
  value TEXT NOT NULL,
  color TEXT DEFAULT '#64748b',
  sort_order INT DEFAULT 0,
  is_default BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(category, value)
);

-- ── PROJECTS ─────────────────────────────────────────────────
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  project_code TEXT UNIQUE NOT NULL,
  app_type TEXT NOT NULL CHECK (app_type IN ('web','mobile','both')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','in_review','completed','on_hold')),
  figma_url TEXT,
  frd_url TEXT,
  frd_file_path TEXT,
  description TEXT,
  created_by UUID REFERENCES users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── PROJECT ASSIGNMENTS ───────────────────────────────────────
CREATE TABLE project_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

-- ── PROJECT DEVELOPERS (per-project roster) ───────────────────
CREATE TABLE project_developers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  developer_name TEXT NOT NULL,
  developer_email TEXT,
  added_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, developer_name)
);

-- ── DOCUMENTS ────────────────────────────────────────────────
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('link','file')),
  label TEXT NOT NULL,
  url TEXT,
  file_path TEXT,
  file_size INT,
  file_mime TEXT,
  folder TEXT DEFAULT 'additional_documents',
  doc_category TEXT DEFAULT 'additional' CHECK (doc_category IN ('figma','frd','additional')),
  uploaded_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── TEST CASES ────────────────────────────────────────────────
CREATE TABLE test_cases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  test_case_id TEXT NOT NULL,
  module TEXT NOT NULL,
  summary TEXT NOT NULL,
  preconditions TEXT,
  steps JSONB NOT NULL DEFAULT '[]',
  expected_result TEXT,
  priority TEXT NOT NULL DEFAULT 'Medium',
  labels TEXT[] DEFAULT '{}',
  platform TEXT NOT NULL DEFAULT 'Web',
  execution_status TEXT NOT NULL DEFAULT 'Not Executed',
  test_result TEXT DEFAULT 'N/A',
  is_auto_generated BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, test_case_id)
);

-- ── BUGS ─────────────────────────────────────────────────────
CREATE TABLE bugs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  test_case_id UUID REFERENCES test_cases(id),
  sl_no INT NOT NULL,
  module TEXT NOT NULL,
  summary TEXT NOT NULL,
  reported_by UUID REFERENCES users(id),
  assignee TEXT,
  status TEXT NOT NULL DEFAULT 'Open',
  developer_comment TEXT,
  qa_status TEXT NOT NULL DEFAULT 'Open',
  qa_comment TEXT,
  ba_comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── BUG RESOURCES ────────────────────────────────────────────
CREATE TABLE bug_resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bug_id UUID REFERENCES bugs(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('file','link')),
  label TEXT,
  url TEXT,
  file_path TEXT,
  file_mime TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── TEST CASE COMMENTS ────────────────────────────────────────
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('test_case','bug')),
  entity_id UUID NOT NULL,
  author_name TEXT NOT NULL,
  author_type TEXT NOT NULL CHECK (author_type IN ('qa','developer','ba')),
  author_id UUID REFERENCES users(id),
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── AUTOMATION SCRIPTS ────────────────────────────────────────
CREATE TABLE automation_scripts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('playwright','selenium')),
  script_name TEXT NOT NULL,
  script_content TEXT NOT NULL DEFAULT '',
  run_config JSONB,
  last_run_at TIMESTAMPTZ,
  last_run_status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── AUTO-INCREMENT HELPERS ────────────────────────────────────
CREATE OR REPLACE FUNCTION get_next_test_case_id(p_project_code TEXT, p_project_id UUID)
RETURNS TEXT AS $$
DECLARE next_num INT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(test_case_id FROM LENGTH(p_project_code) + 1) AS INT)), 0) + 1
  INTO next_num FROM test_cases WHERE project_id = p_project_id;
  RETURN p_project_code || LPAD(next_num::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_next_bug_sl_no(p_project_id UUID)
RETURNS INT AS $$
DECLARE next_num INT;
BEGIN
  SELECT COALESCE(MAX(sl_no), 0) + 1 INTO next_num FROM bugs WHERE project_id = p_project_id;
  RETURN next_num;
END;
$$ LANGUAGE plpgsql;

-- ── UPDATED_AT TRIGGER ────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_test_cases_updated_at BEFORE UPDATE ON test_cases FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_bugs_updated_at BEFORE UPDATE ON bugs FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_scripts_updated_at BEFORE UPDATE ON automation_scripts FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── DEFAULT SYSTEM SETTINGS ───────────────────────────────────
INSERT INTO system_settings (category, value, color, sort_order, is_default) VALUES
  ('bug_status','Open','#f87171',1,true),
  ('bug_status','In Progress','#fbbf24',2,false),
  ('bug_status','Fixed','#4ade80',3,false),
  ('bug_status','Closed','#64748b',4,false),
  ('bug_status','Won''t Fix','#94a3b8',5,false),
  ('qa_status','Open','#f87171',1,true),
  ('qa_status','To Test','#fb923c',2,false),
  ('qa_status','In Test','#fbbf24',3,false),
  ('qa_status','Done','#4ade80',4,false),
  ('qa_status','Reopen','#f43f5e',5,false),
  ('qa_status','No Action','#64748b',6,false),
  ('label','Smoke','#60a5fa',1,false),
  ('label','Regression','#a78bfa',2,false),
  ('label','Sanity','#fbbf24',3,false),
  ('label','Integration','#34d399',4,false),
  ('label','E2E','#f472b6',5,false),
  ('priority','Critical','#ef4444',1,false),
  ('priority','High','#f97316',2,false),
  ('priority','Medium','#fbbf24',3,true),
  ('priority','Low','#4ade80',4,false),
  ('platform','Web','#60a5fa',1,false),
  ('platform','Android','#34d399',2,false),
  ('platform','iOS','#a78bfa',3,false),
  ('platform','Both','#7c6af7',4,false),
  ('execution_status','Not Executed','#64748b',1,true),
  ('execution_status','Executed','#4ade80',2,false),
  ('test_result','Pass','#4ade80',1,false),
  ('test_result','Fail','#f87171',2,false),
  ('test_result','Blocked','#fbbf24',3,false),
  ('test_result','N/A','#64748b',4,true);

-- ── SCHEMA MIGRATIONS (run in Supabase SQL Editor after initial setup) ────────
ALTER TABLE bugs ADD COLUMN IF NOT EXISTS developed_by TEXT DEFAULT '';
