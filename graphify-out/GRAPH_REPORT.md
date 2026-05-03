# Graph Report - /home/soubhikchakraborty/Desktop/qa-management  (2026-05-01)

## Corpus Check
- Large corpus: 78 files · ~517,773 words. Semantic extraction will be expensive (many Claude tokens). Consider running on a subfolder, or use --no-semantic to run AST-only.

## Summary
- 543 nodes · 708 edges · 23 communities detected
- Extraction: 90% EXTRACTED · 10% INFERRED · 0% AMBIGUOUS · INFERRED: 71 edges (avg confidence: 0.83)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Frontend API & Project Actions|Frontend API & Project Actions]]
- [[_COMMUNITY_UI Navigation & Dark Theme|UI Navigation & Dark Theme]]
- [[_COMMUNITY_Bug Detail Edit Fields (Headless)|Bug Detail Edit Fields (Headless)]]
- [[_COMMUNITY_E2E Test Infrastructure & Docs|E2E Test Infrastructure & Docs]]
- [[_COMMUNITY_Backend Auth & Route Layer|Backend Auth & Route Layer]]
- [[_COMMUNITY_Frontend Core Architecture|Frontend Core Architecture]]
- [[_COMMUNITY_Developer Mode UI|Developer Mode UI]]
- [[_COMMUNITY_Settings & Team Management|Settings & Team Management]]
- [[_COMMUNITY_Bug Tracker & Test Case Views|Bug Tracker & Test Case Views]]
- [[_COMMUNITY_Bug Form Components (Visible)|Bug Form Components (Visible)]]
- [[_COMMUNITY_Playwright Test Helpers|Playwright Test Helpers]]
- [[_COMMUNITY_Test Runner & Configuration|Test Runner & Configuration]]
- [[_COMMUNITY_Project Dashboard Cards|Project Dashboard Cards]]
- [[_COMMUNITY_ProjectShell Tab Component|ProjectShell Tab Component]]
- [[_COMMUNITY_DB Migration Scripts|DB Migration Scripts]]
- [[_COMMUNITY_HR Dashboard & Reports|HR Dashboard & Reports]]
- [[_COMMUNITY_Automation Script Templates|Automation Script Templates]]
- [[_COMMUNITY_Theme System|Theme System]]
- [[_COMMUNITY_Tailwind Config (Semantic)|Tailwind Config (Semantic)]]
- [[_COMMUNITY_PostCSS Config (Semantic)|PostCSS Config (Semantic)]]
- [[_COMMUNITY_Confirm Delete Modal|Confirm Delete Modal]]
- [[_COMMUNITY_Input UI Primitive|Input UI Primitive]]
- [[_COMMUNITY_Select UI Primitive|Select UI Primitive]]

## God Nodes (most connected - your core abstractions)
1. `Bug Expanded Edit Panel Screen` - 24 edges
2. `run_all_tests() — dual-pass headless/visible runner` - 20 edges
3. `Landing Screen - Role Selection` - 17 edges
4. `authenticate Middleware` - 16 edges
5. `Settings Screen - Bug Status Chips Tab` - 16 edges
6. `Supabase Service-Role Client` - 14 edges
7. `Test Case Expanded Detail Row Screen` - 13 edges
8. `Developer Read-Only Projects List Screen` - 13 edges
9. `AppInner Component (screen state machine)` - 12 edges
10. `QA Team Sign In Screen` - 12 edges

## Surprising Connections (you probably didn't know these)
- `ProjectShell Page (tabs: Overview, Test Cases, Bugs, Automation, Docs)` --implements--> `Bug Tracker Tab`  [EXTRACTED]
  frontend/src/pages/ProjectShell.tsx → Tests/qa-test-screenshots/visible/11-bug-created.png
- `CLAUDE.md — Project Architecture Guide` --references--> `AuthContext Provider`  [EXTRACTED]
  CLAUDE.md → frontend/src/context/AuthContext.tsx
- `ProjectShell Page (tabs: Overview, Test Cases, Bugs, Automation, Docs)` --implements--> `Test Cases Tab`  [EXTRACTED]
  frontend/src/pages/ProjectShell.tsx → Tests/qa-test-screenshots/visible/08-testcase-created.png
- `ProjectShell Page (tabs: Overview, Test Cases, Bugs, Automation, Docs)` --shares_data_with--> `Left Sidebar Navigation`  [EXTRACTED]
  frontend/src/pages/ProjectShell.tsx → Tests/qa-test-screenshots/visible/08-testcase-created.png
- `ProjectShell Page (tabs: Overview, Test Cases, Bugs, Automation, Docs)` --implements--> `Project Header (Test Project with tags and meta)`  [EXTRACTED]
  frontend/src/pages/ProjectShell.tsx → Tests/qa-test-screenshots/visible/08-testcase-created.png

## Hyperedges (group relationships)
- **JWT Authentication Flow across middleware and routes** — auth_middleware, jwt_token_verification, db_users_table, db_hr_users_table [EXTRACTED 1.00]
- **Project creation auto-scaffolds automation scripts via buildScriptTemplates** — projects_router, projects_buildscripttemplates, db_automation_scripts_table [EXTRACTED 1.00]
- **Settings fallback chain: DB → DEFAULTS constant → frontend constants** — settings_router, settings_defaults_constant, db_system_settings_table [EXTRACTED 0.95]
- **State-based Navigation Flow (screen var + localStorage + AuthContext)** — screen_state_machine, localstorage_auth_persistence, auth_context, app_inner_component [EXTRACTED 0.95]
- **Provider Composition Root (QueryClient + BrowserRouter + ThemeProvider + AuthProvider)** — main_entry, react_query_client, theme_context, auth_context [EXTRACTED 1.00]
- **Theme-Aware Background Rendering (ThemeContext → AnimBg canvas + CSS vars)** — theme_context, anim_bg_component, theme_css_vars [EXTRACTED 0.95]
- **E2E Test Infrastructure: Playwright + Frontend + Backend API** — qa_tests_py, base_url_5173, api_url_5000 [EXTRACTED 1.00]
- **Dual-Pass Test Execution: Headless and Visible Runs** — run_all_tests_fn, test_report_headless, test_report_visible [EXTRACTED 1.00]
- **QA Team Members (O2H Technology)** — user_soubhik, user_bhargav, user_abhinav, user_darshan [EXTRACTED 1.00]
- **Authentication Flow Test Coverage** — test_qa_login, test_wrong_password, test_sign_out_flow [EXTRACTED 1.00]
- **Developer Mode Test Coverage** — test_developer_flow, test_dev_readonly_view, test_dev_updates_bug [EXTRACTED 1.00]
- **Bug Tracker Feature Test Coverage** — test_navigate_bug_tracker, test_log_new_bug, test_kanban_view [EXTRACTED 1.00]
- **Full-stack Deployment: Vercel + Railway + Supabase** — vercel_deployment, railway_deployment, supabase_db [EXTRACTED 1.00]
- **Landing Screen Role-Based Navigation Flow** — landing_screen, landing_qa_engineer_card, landing_developer_card, login_screen, dev_flow_screen [INFERRED 0.90]
- **QA Engineer Authentication Flow** — landing_qa_engineer_card, login_screen, login_username_field, login_password_field, login_sign_in_button, projects_screen [INFERRED 0.85]
- **Developer Access Flow Without Auth** — landing_developer_card, dev_flow_screen, dev_flow_qa_cards, projects_screen [INFERRED 0.85]
- **Project Card UI Component Set** — projects_card_test_project, project_card_active_badge, project_card_platform_chips, project_card_pass_rate, project_card_stats_row [EXTRACTED 1.00]
- **Projects Dashboard Layout Structure** — projects_screen, projects_sidebar, projects_header, projects_search_bar, projects_card_test_project, projects_card_otoimune, projects_card_darshan [EXTRACTED 1.00]
- **Dark Theme Applied Across All Screens** — landing_screen, login_screen, projects_screen, dev_flow_screen, app_dark_theme [EXTRACTED 1.00]
- **Test Case Lifecycle: Empty -> Created -> Expanded with Status/Comments** — testcases_empty_screen, testcases_list_screen, testcase_expanded_screen, testcase_execution_status_field, testcase_result_field, testcase_comments_section [EXTRACTED 1.00]
- **Bug Lifecycle: Empty -> Table -> Expanded Edit -> Kanban** — bugtracker_empty_screen, bugtracker_list_screen, bug_expanded_screen, kanban_board_screen [EXTRACTED 1.00]
- **All Kanban Status Columns forming the Board** — kanban_open_column, kanban_in_progress_column, kanban_fixed_column, kanban_fixed_to_test_column, kanban_closed_column, kanban_wont_fix_column, kanban_wont_fix_invalid_column [EXTRACTED 1.00]
- **Bug Tracker Table/Kanban View Toggle Controls** — bug_table_view_toggle, bug_kanban_view_toggle, bugtracker_list_screen, kanban_board_screen [EXTRACTED 1.00]
- **Bug Expanded Edit Panel - All Editable Fields** — bug_expanded_assignee_field, bug_expanded_developed_by_field, bug_expanded_dev_comment_field, bug_expanded_qa_comment_field, bug_expanded_qa_status_field, bug_expanded_ba_comment_field, bug_expanded_resources_field [EXTRACTED 1.00]
- **Project-Level Tab Navigation (Overview, Test Cases, Bug Tracker, Automation, Documents)** — project_shell_component, testcases_tab, bugtracker_tab, testcases_empty_screen, bugtracker_empty_screen [EXTRACTED 1.00]
- **Shared Empty State UI Pattern across Test Cases and Bug Tracker** — testcases_empty_screen, bugtracker_empty_screen, empty_state_ui [EXTRACTED 1.00]
- **Project Overview Stat Cards Group** — test_cases_stat_card, total_bugs_stat_card, pass_rate_stat_card, open_bugs_stat_card [EXTRACTED 1.00]
- **Project Shell Tab Navigation Group** — project_overview_tab, bug_tracker_tab, settings_test_result_tab [EXTRACTED 1.00]
- **Bug Status Chips Configuration Group** — bug_status_chip_open, bug_status_chip_in_progress, bug_status_chip_fixed, bug_status_chip_closed, bug_status_chip_wont_fix [EXTRACTED 1.00]
- **Settings Page Tab Navigation Group** — settings_bug_status_tab, settings_qa_status_tab, settings_labels_tab, settings_priority_tab, settings_platform_tab, settings_exec_status_tab, settings_test_result_tab, settings_team_tab [EXTRACTED 1.00]
- **QA Team Members in Settings** — team_member_soubhik, team_member_darshan, team_member_abhinav, team_member_ashok, team_member_bhargav [EXTRACTED 1.00]
- **Landing Screen Role Selection Cards** — qa_engineer_role_card, developer_role_card, hr_login_link [EXTRACTED 1.00]
- **Bug Form Action Buttons Group** — bug_save_changes_btn, bug_discard_btn, bug_pdf_btn [EXTRACTED 1.00]
- **Developer View Project Cards Group** — dev_project_card_test_project, dev_project_card_otoimmune, dev_project_card_darshan [EXTRACTED 1.00]
- **Landing Screen Role Selection Flow** — landing_screen, qa_engineer_card, developer_card, login_screen, dev_choose_qa_screen [EXTRACTED 1.00]
- **QA Authentication Flow** — login_screen, login_username_field, login_password_field, sign_in_button, login_error_state, back_button_login [EXTRACTED 1.00]
- **Developer QA Selection Flow** — dev_choose_qa_screen, qa_selector_cards, back_button_dev, projects_dashboard [EXTRACTED 0.90]
- **Project Dashboard UI Components** — projects_dashboard, sidebar_nav, user_profile_widget, project_search_bar, new_project_button, team_button, light_mode_toggle, sign_out_button [EXTRACTED 1.00]
- **Project Card UI Anatomy** — project_card_test_project, project_pass_rate_indicator, project_platform_chips, project_stats_row, active_status_badge [EXTRACTED 1.00]
- **Project Creation Flow** — new_project_button, projects_dashboard_after_create, project_card_test_project, project_created_toast [EXTRACTED 0.95]
- **Test Case Creation and Expansion Lifecycle** — testcases_empty_screen, testcase_created_screen, testcase_expanded_screen, new_test_case_btn, testcase_row_tprj001 [EXTRACTED 1.00]
- **Bug Logging and Detail Expansion Lifecycle** — bugs_empty_screen, bug_created_screen, bug_expanded_screen, log_bug_btn, bug_row_1 [EXTRACTED 1.00]
- **Bug Tracker Table and Kanban Dual View** — bug_created_screen, bug_expanded_screen, kanban_screen, table_view_toggle, kanban_view_toggle, kanban_board [EXTRACTED 1.00]
- **All Kanban Status Columns** — kanban_col_open, kanban_col_in_progress, kanban_col_fixed, kanban_col_fixed_to_test, kanban_col_closed, kanban_col_wont_fix, kanban_col_invalid [EXTRACTED 1.00]
- **Bug Detail Multi-Role Comment Fields** — bug_developer_comment, bug_qa_comment, bug_ba_comment, bug_expanded_screen [EXTRACTED 1.00]
- **Project Shell Tab Navigation** — project_shell_tprj, testcases_tab, bug_tracker_tab [EXTRACTED 1.00]
- **Project Overview Statistics Panel** — stat_card_test_cases, stat_card_total_bugs, stat_card_pass_rate, stat_card_open_bugs [EXTRACTED 1.00]
- **Project Overview Content Sections** — qa_engineers_section, developer_roster_section, figma_frd_links_section [EXTRACTED 1.00]
- **Developer Mode Project Cards** — project_card_test_project, project_card_otoimmune, project_card_darshan [EXTRACTED 1.00]
- **Bug Status Chip Values Group** — chip_open, chip_in_progress, chip_fixed, chip_closed, chip_wont_fix [EXTRACTED 1.00]
- **QA Team Members in Settings** — team_member_soubhik, team_member_darshan, team_member_abhinav, team_member_ashok, team_member_bhargav [EXTRACTED 1.00]
- **Bug Edit Form Fields for Developer** — bug_developer_comment_field, bug_qa_comment_field, bug_qa_status_dropdown, bug_assignee_dropdown, bug_resources_proof_section [EXTRACTED 1.00]
- **Landing Screen Entry Points** — qa_engineer_entry_card, developer_entry_card, hr_login_link [EXTRACTED 1.00]
- **Settings Category Tabs** — settings_chips_screen, settings_team_screen, bug_status_values_section [EXTRACTED 1.00]

## Communities

### Community 0 - "Frontend API & Project Actions"
Cohesion: 0.04
Nodes (2): login(), go()

### Community 1 - "UI Navigation & Dark Theme"
Cohesion: 0.05
Nodes (52): Dark Theme UI Design System, Back Button on Dev Choose QA Screen, Back Button on Login Screen, Developer Choose Project QA Screen, Back Navigation Link on Dev Flow Screen, QA Engineer Selection Cards Grid, Developer Choose QA Screen, Choose Your Project QA Heading (+44 more)

### Community 2 - "Bug Detail Edit Fields (Headless)"
Cohesion: 0.05
Nodes (51): Bug Assignee Field - Unassigned/Not Set, Bug BA Comment Field, Bug Developed By Field - Unassigned/Not Set, Bug Developer Comment Field, Bug Expanded - Assignee Dropdown Field, Bug Expanded - BA Comment Textarea, Bug Expanded - Developer Comment Textarea, Bug Expanded - Developed By Dropdown Field (+43 more)

### Community 3 - "E2E Test Infrastructure & Docs"
Cohesion: 0.08
Nodes (42): API Helper: api_delete_tprj (clean test project), API Helper: get_soubhik_token (bypass-UI login), App.tsx — State-based Navigation Root, Backend Route: /api/auth, Backend Route: /api/bugs, Backend Route: /api/projects, Backend Route: /api/settings, Backend Route: /api/testcases (+34 more)

### Community 4 - "Backend Auth & Route Layer"
Cohesion: 0.12
Nodes (37): authenticate Middleware, Auth Router, Automation Router, Role-based field filter in bugs PATCH, Bugs Router, Comments Router, DB: automation_scripts table, DB: bug_resources table (+29 more)

### Community 5 - "Frontend Core Architecture"
Cohesion: 0.1
Nodes (35): AnimBg Canvas Background Component, API Client (Axios), App Root Component, AppInner Component (screen state machine), AuthContext Provider, Auto-logout on 401 Axios Interceptor, Btn UI Primitive, Chip UI Primitive (+27 more)

### Community 6 - "Developer Mode UI"
Cohesion: 0.07
Nodes (35): App Title Header: Quality Analysis by O2H Technology, Bug Table View (Table/Kanban toggle), Developer Bug Tracker Screen with Editable Expanded Row, Developer Project Card: Darshan, Developer Project Card: OtoImmune Webapp, Developer Project Card: Test Project, Developer Read-Only Projects List Screen, Developer Search Projects Field (+27 more)

### Community 7 - "Settings & Team Management"
Cohesion: 0.07
Nodes (31): Add HR User Button, Add HR User Button, Add QA User Button, Add QA User Button, Add Value Button in Settings, Bug Status Values Section with Chips, Chip: Closed (Bug Status), Chip: Fixed (Bug Status) (+23 more)

### Community 8 - "Bug Tracker & Test Case Views"
Cohesion: 0.08
Nodes (28): Bug Created - Table Row View, Bug Tracker Tab in Project Shell, Bug Tracker Empty State Screen, Export Button, Export Button on Test Cases Tab, New Test Case Button (CTA), New Test Case Button, Post Comment Button in Test Case Comments (+20 more)

### Community 9 - "Bug Form Components (Visible)"
Cohesion: 0.11
Nodes (22): Bug Assignee Dropdown (Unassigned/Not set), Bug BA Comment Textarea, Bug Developed By Dropdown (Unassigned/Not set), Bug Developer Comment Textarea, Discard Button on Bug Form, Expanded Bug Row (Login bug), PDF Export Button on Bug Form, Bug QA Comment Textarea (+14 more)

### Community 10 - "Playwright Test Helpers"
Cohesion: 0.21
Nodes (18): api_delete_tprj(), api_request(), click_tab(), close_all_modals(), ensure_in_project(), force_click(), get_soubhik_token(), login_as_soubhik() (+10 more)

### Community 11 - "Test Runner & Configuration"
Cohesion: 0.17
Nodes (18): Backend API URL: localhost:5000/api, Frontend Base URL: localhost:5173, Express Backend (port 5000), Playwright (Python sync_api), QA Playwright Test Suite, Railway (Backend Deployment), Setup Guide (SETUP_GUIDE.md), QA Test Report (Headless Run) (+10 more)

### Community 12 - "Project Dashboard Cards"
Cohesion: 0.16
Nodes (18): Active Status Badge on Project Card, Light Mode Toggle, New Project Button, Project Card - Darshan, Project Cards Grid Layout, Project Card - OtoImmune Webapp, Project Card - Test Project, Project Created Toast Notification (+10 more)

### Community 13 - "ProjectShell Tab Component"
Cohesion: 0.13
Nodes (2): get(), normalizeRow()

### Community 15 - "DB Migration Scripts"
Cohesion: 0.57
Nodes (7): log(), mapLabels(), mapPlatform(), migrateSettings(), migrateTestCases(), run(), verify()

### Community 16 - "HR Dashboard & Reports"
Cohesion: 0.25
Nodes (2): getHRReport(), generateReport()

### Community 17 - "Automation Script Templates"
Cohesion: 0.53
Nodes (4): buildScriptTemplates(), playwrightFunctional(), playwrightVisual(), seleniumTemplate()

### Community 18 - "Theme System"
Cohesion: 0.4
Nodes (2): useTheme(), AnimBg()

### Community 44 - "Tailwind Config (Semantic)"
Cohesion: 1.0
Nodes (1): Tailwind Config

### Community 45 - "PostCSS Config (Semantic)"
Cohesion: 1.0
Nodes (1): PostCSS Config

### Community 46 - "Confirm Delete Modal"
Cohesion: 1.0
Nodes (1): ConfirmDeleteModal UI Primitive

### Community 47 - "Input UI Primitive"
Cohesion: 1.0
Nodes (1): Inp (Input) UI Primitive

### Community 48 - "Select UI Primitive"
Cohesion: 1.0
Nodes (1): Sel (Select) UI Primitive

## Knowledge Gaps
- **166 isolated node(s):** `Delete TPRJ project via API so test 05 always starts clean.`, `Close any open modals safely.     Uses JavaScript to only click Cancel/✕ inside`, `Navigate to landing fresh, clear stale state, log in as Soubhik.`, `Navigate into the TPRJ project from the projects list.`, `Click an overhead project tab.` (+161 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Frontend API & Project Actions`** (56 nodes): `api.ts`, `auth.tsx`, `addAdditionalQA()`, `addBugResource()`, `addComment()`, `addDeveloper()`, `addDocument()`, `addHRUser()`, `addMember()`, `addQAUser()`, `addSetting()`, `bulkImportBugs()`, `bulkImportTestCases()`, `changePassword()`, `createBug()`, `createProject()`, `createTestCase()`, `deleteAutomationScript()`, `deleteBug()`, `deleteBugResource()`, `deleteDocument()`, `deleteHRUser()`, `deleteProject()`, `deleteQAUser()`, `deleteSetting()`, `deleteTestCase()`, `getAutomation()`, `getBugs()`, `getComments()`, `getDocuments()`, `getHRUsers()`, `getProject()`, `getProjects()`, `getProjectsForQA()`, `getRoster()`, `getSettings()`, `getTeam()`, `getTestCase()`, `getTestCases()`, `hrLogin()`, `login()`, `reassignProject()`, `removeDeveloper()`, `removeMember()`, `saveRunConfig()`, `updateBug()`, `updateMember()`, `updateProject()`, `updateRoster()`, `updateScript()`, `updateSetting()`, `updateTestCase()`, `uploadAvatar()`, `uploadScript()`, `go()`, `handleHRLogin()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `ProjectShell Tab Component`** (16 nodes): `ProjectShell.tsx`, `addSection()`, `confirm()`, `downloadAllScripts()`, `downloadScript()`, `exportBugs()`, `exportProjectBugReportPDF()`, `exportTestCases()`, `get()`, `handleDeleteConfirm()`, `handleFile()`, `handler()`, `handleSheetImport()`, `normalizeRow()`, `postComment()`, `resetTcForm()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `HR Dashboard & Reports`** (8 nodes): `HRDashboard.tsx`, `getHRReport()`, `exportBugReport()`, `exportCSV()`, `exportHRReportPDF()`, `generateReport()`, `handleBack()`, `handleProjectClick()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Theme System`** (5 nodes): `ThemeProvider()`, `useTheme()`, `AnimBg.tsx`, `ThemeContext.tsx`, `AnimBg()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Tailwind Config (Semantic)`** (1 nodes): `Tailwind Config`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `PostCSS Config (Semantic)`** (1 nodes): `PostCSS Config`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Confirm Delete Modal`** (1 nodes): `ConfirmDeleteModal UI Primitive`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Input UI Primitive`** (1 nodes): `Inp (Input) UI Primitive`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Select UI Primitive`** (1 nodes): `Sel (Select) UI Primitive`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Settings Screen - Bug Status Chips Tab` connect `Settings & Team Management` to `Bug Form Components (Visible)`, `E2E Test Infrastructure & Docs`, `UI Navigation & Dark Theme`?**
  _High betweenness centrality (0.181) - this node is a cross-community bridge._
- **Why does `Left Sidebar Navigation` connect `UI Navigation & Dark Theme` to `Frontend Core Architecture`, `Developer Mode UI`, `Settings & Team Management`, `Bug Tracker & Test Case Views`, `Project Dashboard Cards`?**
  _High betweenness centrality (0.178) - this node is a cross-community bridge._
- **Why does `Bug QA Status Dropdown (Open)` connect `Bug Form Components (Visible)` to `Bug Detail Edit Fields (Headless)`, `Settings & Team Management`?**
  _High betweenness centrality (0.093) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `Landing Screen - Role Selection` (e.g. with `Back Navigation Link on Login Screen` and `Back Navigation Link on Dev Flow Screen`) actually correct?**
  _`Landing Screen - Role Selection` has 5 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `authenticate Middleware` (e.g. with `Public Developer View Endpoint` and `requireAdminOrLead Middleware`) actually correct?**
  _`authenticate Middleware` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Delete TPRJ project via API so test 05 always starts clean.`, `Close any open modals safely.     Uses JavaScript to only click Cancel/✕ inside`, `Navigate to landing fresh, clear stale state, log in as Soubhik.` to the rest of the system?**
  _166 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Frontend API & Project Actions` be split into smaller, more focused modules?**
  _Cohesion score 0.04 - nodes in this community are weakly interconnected._