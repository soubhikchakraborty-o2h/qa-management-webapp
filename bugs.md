# QAMS — Bug & Feature Tracker
Last Updated: 2026-05-06

---

## 🆕 FEATURES PENDING

| # | Feature | Status |
|---|---------|--------|
| F1 | HR XLSX Export (project-wise + time-frame) | 🟢 Fixed — 3-sheet workbook (Summary, Project Breakdown, All Bugs) |
| F2 | HR Report: Project-wise bugs section (dev bugs + QA bugs per project) | 🟢 Fixed — expanded project breakdown with dev bug counts + QA status summary |
| F3 | Global Developer + BA managed dropdown (type-to-search, CRUD by Admin/QA Lead) | 🟢 Fixed — global_members table + /api/members route |
| F4 | Priority field in Bug table | 🟢 Fixed — priority column in table, chip in kanban, field in form + expanded row |
| F5 | Project header — remove Owner tag, show QA names list | 🟢 Fixed — meta row now shows "Soubhik & Bhargav" style names, removed Owner label + QA count |
| F6 | Actual Result field on Test Cases when result is Fail | 🟢 Fixed — red textarea appears on Fail, auto-focuses, debounced save, clears on non-Fail, included in export |
| F7 | Developer login — Continue button disabled until valid name selected | 🟢 Fixed — nameValid state, disabled + tooltip when name not in approved list |
| F8 | My Projects / All Projects tab for admin and qa_lead | 🟢 Fixed — tab switcher above search; "mine" filters by created_by, "all" shows other QAs' projects as read-only; New Project hidden on All tab; backend now returns all projects for qa_lead too |
| F9 | Add Designers to global_members | 🟢 Fixed — DB constraint updated to allow 'designer' type; Kinjal & Tanvi inserted; Settings page shows Designers section (pink chips); Add Member dropdown includes Designer option |
| F10 | Project Details card in Overview | 🟢 Fixed — projects table gets start_date, end_date, ba_name, designer_name, project_type columns; backend allows these in PATCH/POST; Overview shows editable Project Details card with BA/Designer dropdowns from global_members |
| F11 | Internal/External type chip on project cards | 🟢 Fixed — project_type chip shown in tags row on ProjCard (green for internal, amber for external); hidden when not set |
| F12 | ChevronDown icon on status chip dropdown | 🟢 Fixed — ChevronDown from lucide-react added inside status chip; only shows when canEdit |
| F13 | About popup on version click | 🟢 Fixed — version text in sidebar is clickable; About modal with app description and author card (Soubhik Chakraborty) |
| F14 | Automation tab — ZIP upload replaces predefined cards | 🟢 Fixed — predefined Playwright/Selenium cards removed; clean ZIP upload UI with drag-and-drop, ZIP list with download/delete; base64 stored in DB |
| F15 | Credentials tab between Automation and Documents | 🟢 Fixed — project_credentials table + backend routes; Credentials tab shows credential cards with masked password, Eye toggle, Copy buttons for username/password/URL; QA can add/delete, developers read-only |

---

## 🐛 BUGS

| # | Bug | Status |
|---|-----|--------|
| 1 | Developer can add test cases via empty state button — should be read-only | 🟢 Fixed — empty state buttons now check canEdit |
| 2 | Dev can't see test cases unless QA logged in first (session/fetch issue) | 🟢 Fixed — GET /test-cases now uses optional-auth; no-token (dev flow) allowed |
| 3 | No option to switch QA in developer flow — must sign out and back in | 🟢 Fixed — Switch QA button added to sidebar for developer role |
| 4 | HR date picker in US format — should be DD/MM/YYYY | 🟢 Fixed — DateInput component shows DD/MM/YYYY, click opens calendar |
| 5 | HR Projects shows "Type: QA Soubhik" — should show "QA: Name" and "Developer: roster" | 🟢 Fixed — shows QA: name + developer roster |
| 6 | No theme toggle on landing page — theme not persisted across login | 🟢 Fixed — floating theme toggle added (fixed bottom-right) |
| 7 | Bug report missing filters: Assignee, Bug Status, QA Status, Priority | 🟢 Fixed — filter bar added with all 4 filters + clear button |
| 8 | Comment chip breaks table layout — expand arrow goes out of bounds | 🟢 Fixed — comment chips moved to top of expanded row |
| 9 | Bug status text not updating with status change — colour changes but text doesn't | 🟢 Fixed — cancelQueries no longer awaited; optimistic update now synchronous |
| 10 | Settings in sidebar closes project instead of navigating to Settings page | 🟢 Fixed — onExitProject prop added; Settings no longer resets page to projects |
| 11 | HR can move bug tickets in Kanban — should be Dev/QA only | 🟢 Fixed — draggable gated to canEdit && user.role !== 'hr' |
| 12 | Remove "Fixed" (keep "Fixed (To Test)") and "Won't Fix" (keep "Won't Fix (Invalid)") | 🟢 Fixed — DB migrated, Kanban/select options updated, existing bugs migrated |
| 13 | Test case import mapping broken for CSV files — works for Google Sheets only | 🟢 Fixed — transformHeader added to CSV uploads; TC/bug mappers rewritten with exact headers |
| 14 | Bulk delete missing for Test Cases and Bugs | 🟢 Fixed — checkbox column, bulk action bar with delete + confirm |
| 15 | Empty state "Log Bug" button shows only manual — no import option | 🟢 Fixed — empty state now opens showBugAddChoice (import or manual) |
| 16 | Developer name added to one bug only — not synced to project roster or other fields | 🟢 Fixed — rosterAddMut called for both developed_by + assignee on every bug save |
| 17 | Some Kanban bug cards don't open the specific bug on click | 🟢 Fixed — kanban click sets bugView+expandedBug and scrolls to bug-row-{id} |
| 18 | HR Projects page — "active" status tag is lowercase | 🟢 Fixed — status chip text capitalized |
| 19 | All icons too small (bug, tick, search etc) — need to be larger | 🟢 Fixed — replaced emoji icons with lucide-react SVGs across Projects, ProjectShell, layout sidebar, HRDashboard, and ui/index; DevIcon updated to clean code chevrons; Eye/EyeOff for password toggle; Trash2 for all deletes; Bug for bug count; ChevronLeft/Right for nav arrows; Calendar for dates; User for QA label; Link/FileText for resources/docs |
| 20 | All exports need dropdown: PDF, CSV, XLSX, DOCX, ZIP where applicable | 🟢 Fixed — TC export: CSV/Excel/PDF/Word/ZIP; Bug export: CSV/Excel/Word/ZIP + existing PDF report |
| 21 | Remove agent/manual distinction from test cases and bugs — unnecessary | 🟢 Fixed — filter removed, is_auto_generated badge removed |
| 22 | Import preview table header not opaque — text overlaps on scroll | 🟢 Fixed — sticky + background applied to import preview headers |
| 23 | Field mapping wrong for CSV/Sheets imports (exact headers now confirmed) | 🟢 Fixed — TC ID, Test Case Title, Type, Developer's Comment all mapped correctly |
| 24 | Light/Dark mode should be a toggle switch not a button | 🟢 Fixed — pill toggle switch in sidebar with sliding circle + moon/sun emoji |
| 25 | HR Reports date field — clicking date doesn't open calendar, must click icon | 🟢 Fixed — DateInput uses showPicker() on click |
| 26 | Bulk edit missing for Bug Status and Test Case Execution Status | 🟢 Fixed — bulk action bar with status dropdown + Apply button |
| 27 | Team switching bug — Darshan → Soubhik → back to Darshan shows no projects | 🟢 Fixed — clicking own profile in team modal clears teamView instead of browsing self |
| 28 | Imported bugs show correct colour but wrong status text ("Open") | 🟢 Fixed — normalizeBugRow now maps "Fixed"→"Fixed (To Test)", "Won't Fix"→"Won't Fix (Invalid)" so select value always matches an option |
| 29 | Bug filter — can't replace same-field filter without clearing first; assignee text input inconsistent | 🟢 Fixed — assignee is now a select from roster (exact match); pills show active filters with individual × dismiss; "Clear All" resets all; count shows "X of Y bugs" |
| 30 | Delete operations slow — no indexes on FK columns, sequential awaits, O(n) re-sequencing after each delete | 🟢 Fixed — 9 DB indexes added; project delete parallelized (5 concurrent); TC/bug re-sequencing removed; 6 mutations get optimistic UI (instant removal) |
| 31 | Project card shows 0 for test case count (✓) and bug count (🪲) even when data exists | 🟢 Fixed — backend now runs 3 parallel count queries per request and injects test_case_count, bug_count, pass_count onto every project; pass rate bar also now correct |
| 32 | Delete confirmation modal stays open during network delay | 🟢 Fixed — setConfirmDelete(null) now called immediately in handleDeleteConfirm before mutation fires |
| 33 | Developer Roster in Overview allows free-text — should restrict to DB names like dev login | 🟢 Fixed — replaced free-text input with TypeSearch (type="all", allowCustom=false) |
| 34 | Project Details date fields don't open calendar on field click | 🟢 Fixed — onClick calls showPicker() on both start/end date inputs |
| 35 | Credentials: username and password required when they should be optional | 🟢 Fixed — only User Role is required; backend validation updated too |
| 36 | Credentials URL placeholder unhelpful ("https://…") | 🟢 Fixed — placeholder changed to "https://www.exampleapplication.com" |
| 37 | Password field in Add Credential form has no show/hide toggle | 🟢 Fixed — Eye/EyeOff toggle added to password field in both add and edit forms |
| 38 | Credentials can only be deleted, not edited | 🟢 Fixed — Pencil edit button added; inline edit form with all fields + PATCH backend route |
| 39 | Importing test cases twice when Import button clicked rapidly | 🟢 Fixed — Import button disabled while bulkImportMut.isPending |

---

## 📋 EXACT IMPORT COLUMN MAPPINGS (Confirmed)

### Test Cases Sheet
| Sheet Column | DB Field |
|---|---|
| TC ID | test_case_id |
| Module | module |
| Test Case Title | summary |
| Preconditions | preconditions |
| Test Steps | steps |
| Expected Result | expected_result |
| Priority | priority |
| Type | labels |
| Execution Status | execution_status |
| Test Result | test_result |

### Bugs Sheet
| Sheet Column | DB Field |
|---|---|
| Sl. No | sl_no (auto, ignore) |
| Module | module |
| Summary | summary |
| Reported By | reported_by (auto, ignore) |
| Resources/Proof | resources |
| Assignee | assignee |
| Status | status |
| Developer's Comment | developer_comment |
| QA Status | qa_status |
| QA Comment | qa_comment |
| BA Comment | ba_comment |

---

## 👥 GLOBAL DEVELOPER + BA LIST

### BA Team
Jaini, Maitri, Ankit, Prasanna, Smita, Dhruvi, Piyush, Farhad, Muskan

### Dev Team
**CTO:** Akshay
**Frontend:** Juned, Hardik, Aayushi, Husena
**Fullstack:** Gopal, Keyur, Nikhil, Manav, Aman Kumar, Dhyey, Ajay, Sachin, Vinit, Asmita, Bhavesh, Chirag, Dhruvil, Vipul, Aman Singh, Jayraj, Riya Thakkar, Shreya, Rituraj, Sundaram, Chahat, Shubham, Atul, Rishi
**Mobile:** Vimal, Naimee, Vijay
**DevOps:** Riyaz


