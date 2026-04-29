#!/usr/bin/env python3
"""
QA Management App — Comprehensive Playwright Test Suite (Dual-Pass)
"""
import os, time, datetime, json, urllib.request
from playwright.sync_api import sync_playwright, Page

BASE_URL    = "http://localhost:5173"
API_URL     = "http://localhost:5000/api"

_HERE       = os.path.dirname(os.path.abspath(__file__))
SS_HEADLESS = os.path.join(_HERE, "qa-test-screenshots", "headless")
SS_VISIBLE  = os.path.join(_HERE, "qa-test-screenshots", "visible")
_REPORT_HL  = os.path.join(_HERE, "qa-test-report-headless.txt")
_REPORT_VIS = os.path.join(_HERE, "qa-test-report-visible.txt")

os.makedirs(SS_HEADLESS, exist_ok=True)
os.makedirs(SS_VISIBLE,  exist_ok=True)

# ── API helpers (bypass UI for setup/teardown) ────────────────────────────────

def api_request(method, path, data=None, token=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    body = json.dumps(data).encode() if data else None
    req = urllib.request.Request(f"{API_URL}{path}", data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=5) as r:
            return json.loads(r.read())
    except Exception:
        return None

def get_soubhik_token():
    r = api_request("POST", "/auth/login", {"username": "soubhik", "password": "soubhik@o2h"})
    return r["token"] if r else None

def api_delete_tprj():
    """Delete TPRJ project via API so test 05 always starts clean."""
    token = get_soubhik_token()
    if not token: return
    data = api_request("GET", "/projects", token=token)
    projects = data.get("projects", []) if data else []
    for p in projects:
        if p["project_code"] == "TPRJ":
            api_request("DELETE", f"/projects/{p['id']}", token=token)
            print("  → (API) deleted existing TPRJ")
            time.sleep(0.5)
            break

# ── Page helpers ──────────────────────────────────────────────────────────────

def ss(page, name, folder):
    page.screenshot(path=os.path.join(folder, name), full_page=True)

def close_all_modals(page):
    """Close any open modals safely.
    Uses JavaScript to only click Cancel/✕ inside actual modal overlays
    (position:fixed, zIndex>=1000), which avoids accidentally triggering
    page-level ✕ delete buttons (e.g. team member rows in Settings)."""
    for _ in range(5):
        try:
            result = page.evaluate("""() => {
                const btns = [...document.querySelectorAll('button')];
                // Priority 1: Cancel button inside ConfirmDeleteModal (zIndex>=2000)
                for (const btn of btns) {
                    if (btn.textContent.trim() !== 'Cancel') continue;
                    let p = btn.parentElement;
                    while (p) {
                        const cs = window.getComputedStyle(p);
                        if (cs.position === 'fixed' && +cs.zIndex >= 2000) {
                            btn.click(); return true;
                        }
                        p = p.parentElement;
                    }
                }
                // Priority 2: ✕ button inside regular Modal (zIndex>=1000)
                for (const btn of btns) {
                    if (btn.textContent.trim() !== '✕') continue;
                    let p = btn.parentElement;
                    while (p) {
                        const cs = window.getComputedStyle(p);
                        if (cs.position === 'fixed' && +cs.zIndex >= 1000) {
                            btn.click(); return true;
                        }
                        p = p.parentElement;
                    }
                }
                return false;
            }""")
            if result:
                time.sleep(0.2)
            else:
                break
        except Exception:
            break

def force_click(page, selector, timeout=8000):
    page.locator(selector).first.click(force=True, timeout=timeout)

def login_as_soubhik(page, verbose=False):
    """Navigate to landing fresh, clear stale state, log in as Soubhik."""
    close_all_modals(page)
    if verbose: print("  → (API) cleaning up TPRJ if it exists")
    api_delete_tprj()
    if verbose: print("  → hard-navigating to landing")
    page.goto(BASE_URL)
    page.wait_for_load_state("networkidle")
    page.evaluate("""() => {
        localStorage.removeItem('qa_role_choice');
        localStorage.removeItem('qa_dev_name');
        localStorage.removeItem('qa_selected_qa');
    }""")
    page.reload()
    page.wait_for_load_state("networkidle")
    time.sleep(0.4)
    if verbose: print("  → clicking QA Engineer card")
    page.locator("text=QA Engineer").first.click(force=True)
    page.wait_for_load_state("networkidle")
    time.sleep(0.4)
    if verbose: print("  → entering credentials")
    page.locator("input[placeholder='username']").fill("soubhik")
    time.sleep(0.2)
    page.locator("input[placeholder='Enter password']").fill("soubhik@o2h")
    time.sleep(0.2)
    if verbose: print("  → clicking Sign In →")
    page.locator("text=Sign In →").click(force=True)
    page.wait_for_selector("text=New Project", timeout=12000)
    if verbose: print("  → logged in as Soubhik ✓")

def sign_out(page, verbose=False):
    close_all_modals(page)
    if verbose: print("  → clicking Sign Out")
    force_click(page, "text=Sign Out")
    time.sleep(0.5)
    if verbose: print("  → confirming Yes")
    force_click(page, "text=Yes")
    page.wait_for_selector("h1:has-text('Quality Analysis')", timeout=8000)
    time.sleep(0.3)

def open_project(page, verbose=False):
    """Navigate into the TPRJ project from the projects list."""
    close_all_modals(page)
    if verbose: print("  → clicking Test Project card")
    page.locator("text=Test Project").first.click(force=True, timeout=12000)
    page.wait_for_selector("text=← All projects", timeout=10000)
    time.sleep(0.5)

def click_tab(page, label, verbose=False):
    """Click an overhead project tab."""
    close_all_modals(page)
    if verbose: print(f"  → clicking tab: {label}")
    page.locator(f"text={label}").first.click(force=True, timeout=8000)
    time.sleep(0.6)

def ensure_in_project(page, verbose=False):
    """If we're not inside a project, navigate into TPRJ."""
    close_all_modals(page)
    if not page.locator("text=← All projects").is_visible(timeout=800):
        if verbose: print("  → recovering: navigating into TPRJ")
        # Check if we need to log in first
        if page.locator("text=New Project").is_visible(timeout=1000):
            open_project(page, verbose)
        elif page.locator("h1:has-text('Quality Analysis')").is_visible(timeout=500):
            login_as_soubhik(page, verbose)
            open_project(page, verbose)


# ── test runner ───────────────────────────────────────────────────────────────

def run_all_tests(headless: bool, slow_mo: int = 0) -> dict:
    folder  = SS_HEADLESS if headless else SS_VISIBLE
    verbose = not headless
    results = {}

    def record(name, passed, reason=""):
        icon = "✓ PASS" if passed else "✗ FAIL"
        print(f"{icon}: {name}" + (f" — {reason}" if reason else ""))
        results[name] = {"passed": passed, "reason": reason}

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=headless, slow_mo=slow_mo)
        ctx = browser.new_context(viewport={"width": 1400, "height": 900})
        page: Page = ctx.new_page()

        # ── 01 Landing page loads ─────────────────────────────────────────────
        T = "01 Landing page loads"
        if verbose: print(f"\n▶ [{T}] starting...")
        try:
            if verbose: print("  → navigating to app")
            page.goto(BASE_URL)
            page.wait_for_load_state("networkidle")
            time.sleep(0.5)
            h_ok  = page.locator("h1:has-text('Quality Analysis')").is_visible(timeout=5000)
            qa_ok = page.locator("text=QA Engineer").first.is_visible(timeout=3000)
            dv_ok = page.locator("text=Developer").first.is_visible(timeout=3000)
            hr_ok = page.locator("text=Are you from HR?").is_visible(timeout=3000)
            ss(page, "01-landing.png", folder)
            if h_ok and qa_ok and dv_ok and hr_ok:
                record(T, True)
            else:
                miss = [x for ok,x in [(h_ok,"heading"),(qa_ok,"QA card"),(dv_ok,"Dev card"),(hr_ok,"HR link")] if not ok]
                record(T, False, "Missing: " + ", ".join(miss))
        except Exception as e:
            try: ss(page, "01-landing.png", folder)
            except: pass
            record(T, False, str(e)[:120])

        # ── 02 QA Login — Soubhik ─────────────────────────────────────────────
        T = "02 QA Login – Soubhik"
        if verbose: print(f"\n▶ [{T}] starting...")
        try:
            if verbose: print("  → clicking QA Engineer card")
            page.locator("text=QA Engineer").first.click(force=True)
            page.wait_for_load_state("networkidle")
            time.sleep(0.4)
            if verbose: print("  → entering soubhik / soubhik@o2h")
            page.locator("input[placeholder='username']").fill("soubhik")
            time.sleep(0.2)
            page.locator("input[placeholder='Enter password']").fill("soubhik@o2h")
            time.sleep(0.2)
            if verbose: print("  → clicking Sign In →")
            page.locator("text=Sign In →").click(force=True)
            page.wait_for_selector("text=New Project", timeout=12000)
            time.sleep(0.8)
            ss(page, "02-projects.png", folder)
            record(T, True)
        except Exception as e:
            try: ss(page, "02-projects.png", folder)
            except: pass
            record(T, False, str(e)[:120])

        # ── 03 Wrong password shows error ─────────────────────────────────────
        T = "03 Wrong password shows error"
        if verbose: print(f"\n▶ [{T}] starting...")
        try:
            if verbose: print("  → signing out first")
            sign_out(page, verbose)
            if verbose: print("  → clicking QA Engineer card")
            page.locator("text=QA Engineer").first.click(force=True)
            page.wait_for_load_state("networkidle")
            time.sleep(0.4)
            if verbose: print("  → entering wrong credentials")
            page.locator("input[placeholder='username']").fill("soubhik")
            time.sleep(0.2)
            page.locator("input[placeholder='Enter password']").fill("wrongpassword")
            time.sleep(0.2)
            if verbose: print("  → clicking Sign In →")
            page.locator("text=Sign In →").click(force=True)
            time.sleep(2.0)
            err_ok = page.locator("text=Invalid credentials").is_visible(timeout=5000)
            ss(page, "03-login-error.png", folder)
            record(T, err_ok, "" if err_ok else "Error message not shown")
        except Exception as e:
            try: ss(page, "03-login-error.png", folder)
            except: pass
            record(T, False, str(e)[:120])

        # ── 04 Developer flow ─────────────────────────────────────────────────
        T = "04 Developer flow"
        if verbose: print(f"\n▶ [{T}] starting...")
        try:
            if verbose: print("  → going to landing & clearing dev state")
            page.goto(BASE_URL)
            page.wait_for_load_state("networkidle")
            page.evaluate("""() => {
                localStorage.removeItem('qa_role_choice');
                localStorage.removeItem('qa_dev_name');
                localStorage.removeItem('qa_selected_qa');
            }""")
            page.reload()
            page.wait_for_load_state("networkidle")
            time.sleep(0.4)
            if verbose: print("  → clicking Developer card")
            page.locator("text=Developer").first.click(force=True)
            page.wait_for_load_state("networkidle")
            time.sleep(0.4)
            if verbose: print("  → entering name: Test Developer")
            page.locator("input[placeholder=\"e.g. Raj Kumar\"]").fill("Test Developer")
            time.sleep(0.3)
            page.locator("text=Continue →").click(force=True)
            time.sleep(0.8)
            qa_ok = page.locator("text=Soubhik").first.is_visible(timeout=5000)
            ss(page, "04-dev-flow.png", folder)
            record(T, qa_ok, "" if qa_ok else "QA selection screen not shown")
        except Exception as e:
            try: ss(page, "04-dev-flow.png", folder)
            except: pass
            record(T, False, str(e)[:120])

        # ── 05 Create new project ─────────────────────────────────────────────
        T = "05 Create new project"
        if verbose: print(f"\n▶ [{T}] starting...")
        try:
            # login_as_soubhik already calls api_delete_tprj to ensure clean state
            login_as_soubhik(page, verbose)
            time.sleep(0.5)
            if verbose: print("  → clicking New Project button")
            force_click(page, "text=New Project", timeout=6000)
            time.sleep(0.5)
            if verbose: print("  → filling project name")
            page.locator("input[placeholder='e.g. Crypto AI Agent']").fill("Test Project")
            time.sleep(0.2)
            if verbose: print("  → filling project code: TPRJ")
            page.locator("input[placeholder='e.g. CAA or CRYPTOAI']").fill("TPRJ")
            time.sleep(0.2)
            if verbose: print("  → filling description")
            page.locator("input[placeholder='Brief project description']").fill("Test project for QA testing")
            time.sleep(0.2)
            if verbose: print("  → clicking Create Project")
            page.locator("text=Create Project").click(force=True)
            time.sleep(1.5)
            tprj_ok = page.locator("text=TPRJ").is_visible(timeout=8000)
            ss(page, "05-new-project.png", folder)
            record(T, tprj_ok, "" if tprj_ok else "TPRJ card not found after creation")
        except Exception as e:
            try: ss(page, "05-new-project.png", folder)
            except: pass
            record(T, False, str(e)[:120])

        # ── 06 Project card elements ──────────────────────────────────────────
        T = "06 Project card elements"
        if verbose: print(f"\n▶ [{T}] starting...")
        try:
            close_all_modals(page)
            time.sleep(0.3)
            code_ok   = page.locator("text=TPRJ").is_visible(timeout=4000)
            active_ok = page.locator("text=Active").first.is_visible(timeout=3000)
            ss(page, "06-project-card.png", folder)
            if code_ok and active_ok:
                record(T, True)
            else:
                miss = [x for ok,x in [(code_ok,"TPRJ badge"),(active_ok,"Active chip")] if not ok]
                record(T, False, "Missing: " + ", ".join(miss))
        except Exception as e:
            try: ss(page, "06-project-card.png", folder)
            except: pass
            record(T, False, str(e)[:120])

        # ── 07 Navigate to Test Cases tab ─────────────────────────────────────
        T = "07 Navigate to Test Cases tab"
        if verbose: print(f"\n▶ [{T}] starting...")
        try:
            close_all_modals(page)
            open_project(page, verbose)
            click_tab(page, "Test Cases", verbose)
            in_tc = (
                page.locator("text=No test cases").is_visible(timeout=3000)
                or page.locator("text=Add Test Case").is_visible(timeout=2000)
                or page.locator("text=Module").first.is_visible(timeout=2000)
            )
            ss(page, "07-testcases-empty.png", folder)
            record(T, in_tc, "" if in_tc else "Test Cases tab content not found")
        except Exception as e:
            try: ss(page, "07-testcases-empty.png", folder)
            except: pass
            record(T, False, str(e)[:120])

        # ── 08 Create test case manually ──────────────────────────────────────
        T = "08 Create test case manually"
        if verbose: print(f"\n▶ [{T}] starting...")
        try:
            close_all_modals(page)
            ensure_in_project(page, verbose)
            # make sure we're on Test Cases tab
            click_tab(page, "Test Cases", verbose)

            if verbose: print("  → clicking Add Test Case / New Test Case")
            clicked_add = False
            for selector in ["button:has-text('Add Test Case')", "button:has-text('New Test Case')"]:
                try:
                    page.locator(selector).first.click(force=True, timeout=3000)
                    clicked_add = True
                    break
                except Exception:
                    pass
            if not clicked_add:
                raise Exception("Could not find Add Test Case / New Test Case button")
            time.sleep(0.5)

            # Choice modal: click "Manual" card.
            # get_by_text(exact=True) matches ONLY the leaf <div>Manual</div>
            # (text content = exactly "Manual"), not any ancestor that merely
            # contains "Manual" somewhere — avoiding accidental backdrop click.
            if verbose: print("  → clicking Manual option")
            manual_el = page.get_by_text("Manual", exact=True).first
            if manual_el.is_visible(timeout=3000):
                manual_el.click(force=True)
                time.sleep(0.5)

            # Verify form opened
            if not page.locator("input[placeholder='e.g. Authentication']").is_visible(timeout=5000):
                raise Exception("Test case form did not open after clicking Manual")

            if verbose: print("  → filling Module: Login")
            page.locator("input[placeholder='e.g. Authentication']").fill("Login")
            time.sleep(0.2)
            if verbose: print("  → filling Summary")
            page.locator("input[placeholder='What is being tested?']").fill("Verify login with valid credentials")
            time.sleep(0.2)
            # Add a step if button available
            try:
                step_btn = page.locator("text=＋ Add Step").first
                if step_btn.is_visible(timeout=1500):
                    step_btn.click(force=True)
                    time.sleep(0.3)
            except Exception:
                pass

            if verbose: print("  → saving test case")
            try:
                # Button text is "Create Test Case" (not "Save Test Case")
                page.locator("text=Create Test Case").click(force=True, timeout=3000)
            except Exception:
                page.locator("button:has-text('Create')").last.click(force=True, timeout=3000)
            time.sleep(2.0)
            close_all_modals(page)
            # Wait for React Query to refetch and render the new test case
            page.wait_for_load_state("networkidle")
            time.sleep(0.5)

            tc_ok = page.locator("text=Verify login with valid credentials").is_visible(timeout=12000)
            ss(page, "08-testcase-created.png", folder)
            record(T, tc_ok, "" if tc_ok else "Test case summary not found in table")
        except Exception as e:
            close_all_modals(page)
            try: ss(page, "08-testcase-created.png", folder)
            except: pass
            record(T, False, str(e)[:120])

        # ── 09 Expand test case row ───────────────────────────────────────────
        T = "09 Expand test case row"
        if verbose: print(f"\n▶ [{T}] starting...")
        try:
            close_all_modals(page)
            ensure_in_project(page, verbose)
            # Ensure on Test Cases tab
            click_tab(page, "Test Cases", verbose)
            if verbose: print("  → clicking test case row to expand")
            page.locator("text=Verify login with valid credentials").first.click(force=True)
            time.sleep(0.8)
            expanded_ok = (
                page.locator("text=Pre-conditions").is_visible(timeout=3000)
                or page.locator("text=Steps").is_visible(timeout=2000)
                or page.locator("text=Expected").is_visible(timeout=2000)
                or page.locator("text=Discard").is_visible(timeout=2000)
            )
            ss(page, "09-testcase-expanded.png", folder)
            record(T, expanded_ok, "" if expanded_ok else "Expanded row content not visible")
        except Exception as e:
            try: ss(page, "09-testcase-expanded.png", folder)
            except: pass
            record(T, False, str(e)[:120])

        # ── 10 Navigate to Bug Tracker ────────────────────────────────────────
        T = "10 Navigate to Bug Tracker"
        if verbose: print(f"\n▶ [{T}] starting...")
        try:
            close_all_modals(page)
            ensure_in_project(page, verbose)
            click_tab(page, "Bug Tracker", verbose)
            bug_ok = (
                page.locator("text=No bugs logged").is_visible(timeout=3000)
                or page.locator("button:has-text('Log Bug')").is_visible(timeout=2000)
                or page.locator("th:has-text('#')").is_visible(timeout=2000)
                or page.locator("text=Bug Status").first.is_visible(timeout=2000)
            )
            ss(page, "10-bugs-empty.png", folder)
            record(T, bug_ok, "" if bug_ok else "Bug Tracker content not found")
        except Exception as e:
            try: ss(page, "10-bugs-empty.png", folder)
            except: pass
            record(T, False, str(e)[:120])

        # ── 11 Log new bug ────────────────────────────────────────────────────
        T = "11 Log new bug"
        if verbose: print(f"\n▶ [{T}] starting...")
        try:
            close_all_modals(page)
            ensure_in_project(page, verbose)
            # navigate to bug tracker tab (in case we left it)
            click_tab(page, "Bug Tracker", verbose)

            if verbose: print("  → clicking Log Bug button")
            clicked_bug = False
            for selector in ["button:has-text('Log Bug')"]:
                try:
                    page.locator(selector).first.click(force=True, timeout=4000)
                    clicked_bug = True
                    break
                except Exception:
                    pass
            if not clicked_bug:
                raise Exception("Could not find Log Bug button")
            time.sleep(0.5)

            # If choice modal appeared, click "Log Manually" (exact text on the div)
            if page.locator("text=Log Manually").is_visible(timeout=1500):
                if verbose: print("  → choosing Log Manually")
                page.locator("text=Log Manually").first.click(force=True)
                time.sleep(0.5)

            if not page.locator("text=Log New Bug").is_visible(timeout=4000):
                raise Exception("Log bug modal did not open")

            if verbose: print("  → filling Module: Login")
            page.locator("input[placeholder='Which module?']").fill("Login")
            time.sleep(0.2)
            if verbose: print("  → filling Summary")
            page.locator("input[placeholder='Describe the bug clearly']").fill("Login button unresponsive on click")
            time.sleep(0.2)
            if verbose: print("  → submitting")
            page.locator("button:has-text('Log Bug')").last.click(force=True)
            time.sleep(2.0)
            close_all_modals(page)
            # Wait for React Query to refetch and render the new bug
            page.wait_for_load_state("networkidle")
            time.sleep(0.5)

            bug_ok = (
                page.locator("text=Login button unresponsive on click").is_visible(timeout=10000)
                or page.locator("text=#001").is_visible(timeout=3000)
            )
            ss(page, "11-bug-created.png", folder)
            record(T, bug_ok, "" if bug_ok else "Bug not found after logging")
        except Exception as e:
            close_all_modals(page)
            try: ss(page, "11-bug-created.png", folder)
            except: pass
            record(T, False, str(e)[:120])

        # ── 12 Expand bug row ─────────────────────────────────────────────────
        T = "12 Expand bug row"
        if verbose: print(f"\n▶ [{T}] starting...")
        try:
            close_all_modals(page)
            ensure_in_project(page, verbose)
            click_tab(page, "Bug Tracker", verbose)
            if verbose: print("  → clicking bug row to expand")
            page.locator("text=Login button unresponsive on click").first.click(force=True)
            time.sleep(0.8)
            dev_ok  = page.locator("text=Developer Comment").is_visible(timeout=3000)
            qa_ok   = page.locator("text=QA Comment").is_visible(timeout=3000)
            ba_ok   = page.locator("text=BA Comment").is_visible(timeout=3000)
            res_ok  = page.locator("text=Resources / Proof").is_visible(timeout=3000)
            ss(page, "12-bug-expanded.png", folder)
            if dev_ok and qa_ok and ba_ok and res_ok:
                record(T, True)
            else:
                miss = [x for ok,x in [(dev_ok,"Dev Comment"),(qa_ok,"QA Comment"),(ba_ok,"BA Comment"),(res_ok,"Resources")] if not ok]
                record(T, False, "Missing: " + ", ".join(miss))
        except Exception as e:
            try: ss(page, "12-bug-expanded.png", folder)
            except: pass
            record(T, False, str(e)[:120])

        # ── 13 Kanban view ────────────────────────────────────────────────────
        T = "13 Kanban view"
        if verbose: print(f"\n▶ [{T}] starting...")
        try:
            close_all_modals(page)
            ensure_in_project(page, verbose)
            click_tab(page, "Bug Tracker", verbose)
            # close any expanded row
            try:
                page.locator("text=Discard").first.click(force=True, timeout=1500)
                time.sleep(0.2)
            except Exception:
                pass
            if verbose: print("  → clicking ⊞ Kanban toggle")
            page.locator("text=⊞ Kanban").click(force=True, timeout=5000)
            time.sleep(0.8)
            open_ok  = page.locator("text=Open").first.is_visible(timeout=3000)
            prog_ok  = page.locator("text=In Progress").is_visible(timeout=3000)
            fixed_ok = page.locator("text=Fixed").first.is_visible(timeout=3000)
            close_ok = page.locator("text=Closed").is_visible(timeout=3000)
            ss(page, "13-kanban.png", folder)
            if open_ok and prog_ok and fixed_ok and close_ok:
                record(T, True)
            else:
                miss = [x for ok,x in [(open_ok,"Open"),(prog_ok,"In Progress"),(fixed_ok,"Fixed"),(close_ok,"Closed")] if not ok]
                record(T, False, "Missing columns: " + ", ".join(miss))
        except Exception as e:
            try: ss(page, "13-kanban.png", folder)
            except: pass
            record(T, False, str(e)[:120])

        # ── 14 Overview stats ─────────────────────────────────────────────────
        T = "14 Overview stats"
        if verbose: print(f"\n▶ [{T}] starting...")
        try:
            close_all_modals(page)
            ensure_in_project(page, verbose)
            click_tab(page, "Overview", verbose)
            time.sleep(0.5)
            tc_ok   = page.locator("text=Test Cases").first.is_visible(timeout=3000)
            bug_ok  = page.locator("text=Total Bugs").is_visible(timeout=3000)
            pass_ok = page.locator("text=Pass Rate").is_visible(timeout=3000)
            open_ok = page.locator("text=Open Bugs").is_visible(timeout=3000)
            ss(page, "14-overview-stats.png", folder)
            if tc_ok and bug_ok and pass_ok and open_ok:
                record(T, True)
            else:
                miss = [x for ok,x in [(tc_ok,"Test Cases"),(bug_ok,"Total Bugs"),(pass_ok,"Pass Rate"),(open_ok,"Open Bugs")] if not ok]
                record(T, False, "Missing cards: " + ", ".join(miss))
        except Exception as e:
            try: ss(page, "14-overview-stats.png", folder)
            except: pass
            record(T, False, str(e)[:120])

        # ── 15 Developer read-only view ───────────────────────────────────────
        T = "15 Developer read-only view"
        if verbose: print(f"\n▶ [{T}] starting...")
        try:
            close_all_modals(page)
            sign_out(page, verbose)
            time.sleep(0.3)
            if verbose: print("  → clicking Developer card")
            page.locator("text=Developer").first.click(force=True)
            page.wait_for_load_state("networkidle")
            time.sleep(0.4)
            if verbose: print("  → entering name: Aman Developer")
            page.locator("input[placeholder=\"e.g. Raj Kumar\"]").fill("Aman Developer")
            time.sleep(0.3)
            page.locator("text=Continue →").click(force=True)
            time.sleep(0.8)
            if verbose: print("  → selecting Soubhik as QA")
            page.locator("text=Soubhik").first.click(force=True)
            # Wait for the projects page to load — not necessarily "Test Project"
            # in case tests 05-11 failed and no project exists
            page.wait_for_selector("text=Projects", timeout=8000)
            time.sleep(0.8)
            # Check any project is visible OR empty state
            proj_ok = (
                page.locator("text=TPRJ").is_visible(timeout=3000)
                or page.locator("text=Test Project").is_visible(timeout=2000)
                or page.locator("text=No projects yet").is_visible(timeout=1000)
                or page.locator("text=active").first.is_visible(timeout=1000)
            )
            no_new_btn = not page.locator("text=New Project").is_visible(timeout=800)
            ss(page, "15-dev-readonly.png", folder)
            if proj_ok and no_new_btn:
                record(T, True)
            else:
                issues = [x for ok,x in [(proj_ok,"dev view rendered"),(no_new_btn,"New Project absent")] if not ok]
                record(T, False, "Issues: " + ", ".join(issues))
        except Exception as e:
            try: ss(page, "15-dev-readonly.png", folder)
            except: pass
            record(T, False, str(e)[:120])

        # ── 16 Developer updates bug ──────────────────────────────────────────
        T = "16 Developer updates bug"
        if verbose: print(f"\n▶ [{T}] starting...")
        try:
            close_all_modals(page)
            # In developer mode, open TPRJ
            open_project(page, verbose)
            click_tab(page, "Bug Tracker", verbose)
            # Wait for Bug Tracker data to load
            page.wait_for_load_state("networkidle")
            time.sleep(0.5)
            # Find any bug row (from prior tests or DB)
            bug_exists = page.locator("text=Login button unresponsive on click").is_visible(timeout=8000)
            if not bug_exists:
                # fallback: look for any bug row by sl_no badge
                bug_exists = page.locator("text=#001").is_visible(timeout=3000)
            if not bug_exists:
                raise Exception("No bug found in table to expand for developer test")
            if verbose: print("  → expanding bug row")
            # click the first bug summary or #001
            try:
                page.locator("text=Login button unresponsive on click").first.click(force=True, timeout=3000)
            except Exception:
                page.locator("text=#001").first.click(force=True, timeout=3000)
            time.sleep(0.8)
            dev_ta = page.locator("textarea[placeholder*='fix, reason']").first
            qa_ta  = page.locator("textarea[placeholder*='Reopen reason']").first
            dev_editable = not dev_ta.is_disabled(timeout=3000)
            qa_disabled  = qa_ta.is_disabled(timeout=3000)
            if verbose: print(f"  → dev comment editable={dev_editable}, qa comment disabled={qa_disabled}")
            ss(page, "16-dev-bug-edit.png", folder)
            if dev_editable and qa_disabled:
                record(T, True)
            else:
                issues = []
                if not dev_editable: issues.append("dev comment not editable")
                if not qa_disabled:  issues.append("qa comment should be disabled")
                record(T, False, "; ".join(issues))
        except Exception as e:
            try: ss(page, "16-dev-bug-edit.png", folder)
            except: pass
            record(T, False, str(e)[:120])

        # ── 17 Settings — Chip Values ─────────────────────────────────────────
        T = "17 Settings – Chip Values"
        if verbose: print(f"\n▶ [{T}] starting...")
        try:
            # Log in as Soubhik (resets state, clears TPRJ — but we don't need it here)
            # Don't delete TPRJ here since test 16 ran as developer; just navigate fresh
            close_all_modals(page)
            # If still in developer mode (no qa_token), log in
            token = page.evaluate("() => localStorage.getItem('qa_token')")
            if not token:
                if verbose: print("  → logging in as Soubhik for settings")
                page.goto(BASE_URL)
                page.wait_for_load_state("networkidle")
                page.evaluate("""() => {
                    localStorage.removeItem('qa_role_choice');
                    localStorage.removeItem('qa_dev_name');
                    localStorage.removeItem('qa_selected_qa');
                }""")
                page.reload()
                page.wait_for_load_state("networkidle")
                time.sleep(0.4)
                page.locator("text=QA Engineer").first.click(force=True)
                page.wait_for_load_state("networkidle")
                page.locator("input[placeholder='username']").fill("soubhik")
                page.locator("input[placeholder='Enter password']").fill("soubhik@o2h")
                page.locator("text=Sign In →").click(force=True)
                page.wait_for_selector("text=New Project", timeout=12000)
            if verbose: print("  → clicking Settings")
            force_click(page, "text=Settings")
            time.sleep(0.8)
            # Use .first on all to avoid strict-mode violations
            bug_ok  = page.locator("text=Bug Status").first.is_visible(timeout=3000)
            qa_ok   = page.locator("text=QA Status").first.is_visible(timeout=3000)
            lbl_ok  = page.locator("text=Labels").first.is_visible(timeout=3000)
            pri_ok  = page.locator("text=Priority").first.is_visible(timeout=3000)
            plat_ok = page.locator("text=Platform").first.is_visible(timeout=3000)
            ss(page, "17-settings-chips.png", folder)
            all_ok = bug_ok and qa_ok and lbl_ok and pri_ok and plat_ok
            if all_ok:
                record(T, True)
            else:
                miss = [x for ok,x in [(bug_ok,"Bug Status"),(qa_ok,"QA Status"),(lbl_ok,"Labels"),(pri_ok,"Priority"),(plat_ok,"Platform")] if not ok]
                record(T, False, "Missing: " + ", ".join(miss))
        except Exception as e:
            try: ss(page, "17-settings-chips.png", folder)
            except: pass
            record(T, False, str(e)[:120])

        # ── 18 Settings — Team Management ────────────────────────────────────
        T = "18 Settings – Team Management"
        if verbose: print(f"\n▶ [{T}] starting...")
        try:
            close_all_modals(page)
            if verbose: print("  → clicking Team tab")
            page.locator("text=Team").first.click(force=True)
            time.sleep(0.8)
            # Use JS to find leaf-node text matches (avoids strict-mode violations)
            members_found = page.evaluate("""() => {
                const expected = ['Soubhik','Bhargav','Abhinav','Darshan','Ashok'];
                return expected.filter(name => {
                    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
                    let n;
                    while (n = walker.nextNode()) {
                        if (n.textContent.trim() === name) return true;
                    }
                    return false;
                });
            }""")
            all_found = set(members_found) == {'Soubhik', 'Bhargav', 'Abhinav', 'Darshan', 'Ashok'}
            ss(page, "18-settings-team.png", folder)
            if all_found:
                record(T, True)
            else:
                missing = {'Soubhik','Bhargav','Abhinav','Darshan','Ashok'} - set(members_found)
                record(T, False, "Missing: " + ", ".join(missing))
        except Exception as e:
            try: ss(page, "18-settings-team.png", folder)
            except: pass
            record(T, False, str(e)[:120])

        # ── 19 Sign out flow ──────────────────────────────────────────────────
        T = "19 Sign out flow"
        if verbose: print(f"\n▶ [{T}] starting...")
        try:
            close_all_modals(page)
            if verbose: print("  → clicking Sign Out")
            force_click(page, "text=Sign Out")
            time.sleep(0.5)
            if verbose: print("  → confirming Yes")
            force_click(page, "text=Yes")
            time.sleep(0.8)
            landing_ok    = page.locator("h1:has-text('Quality Analysis')").is_visible(timeout=6000)
            token_cleared = page.evaluate("() => localStorage.getItem('qa_token')") in (None, "")
            ss(page, "19-signout.png", folder)
            if landing_ok and token_cleared:
                record(T, True)
            else:
                issues = [x for ok,x in [(landing_ok,"back at landing"),(token_cleared,"token cleared")] if not ok]
                record(T, False, "Issues: " + ", ".join(issues))
        except Exception as e:
            try: ss(page, "19-signout.png", folder)
            except: pass
            record(T, False, str(e)[:120])

        browser.close()
    return results


# ── report writer ─────────────────────────────────────────────────────────────

def write_report(results, path, label, folder):
    passed   = sum(1 for v in results.values() if v["passed"])
    failed   = len(results) - passed
    failures = {k: v for k, v in results.items() if not v["passed"]}
    lines = [
        "═══════════════════════════════════════",
        f"QA MANAGEMENT APP — TEST REPORT ({label})",
        "═══════════════════════════════════════",
        f"Date:        {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
        f"Total Tests: {len(results)}",
        f"Passed:      {passed} ✓",
        f"Failed:      {failed} ✗",
        "",
    ]
    if failures:
        lines.append("FAILURES:")
        for name, info in failures.items():
            lines.append(f"  - {name}: {info['reason']}")
        lines.append("")
    lines += [f"SCREENSHOTS: {folder}", "═══════════════════════════════════════"]
    report = "\n".join(lines)
    with open(path, "w") as f:
        f.write(report)
    return report


# ── entrypoint ────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print("\n" + "═"*55)
    print("PASS 1 — HEADLESS (no browser window)")
    print("═"*55)
    h_res = run_all_tests(headless=True, slow_mo=0)
    h_rep = write_report(h_res, _REPORT_HL, "HEADLESS", SS_HEADLESS)
    print("\n" + h_rep)

    print("\n" + "═"*55)
    print("PASS 2 — VISIBLE (slow_mo=800ms)")
    print("═"*55)
    v_res = run_all_tests(headless=False, slow_mo=800)
    v_rep = write_report(v_res, _REPORT_VIS, "VISIBLE", SS_VISIBLE)
    print("\n" + v_rep)

    h_p = sum(1 for v in h_res.values() if v["passed"])
    v_p = sum(1 for v in v_res.values() if v["passed"])
    n   = len(h_res)

    diffs = []
    for name in h_res:
        h_ok = h_res[name]["passed"]
        v_ok = v_res.get(name, {}).get("passed", False)
        if h_ok != v_ok:
            diffs.append(f"  {name}: headless={'PASS' if h_ok else 'FAIL'}, visible={'PASS' if v_ok else 'FAIL'}")

    print("\n═══════════════════════════════════════")
    print("COMBINED TEST SUMMARY")
    print("═══════════════════════════════════════")
    print(f"Headless:  {h_p}/{n} passed")
    print(f"Visible:   {v_p}/{n} passed")
    print("═══════════════════════════════════════")
    if diffs:
        print("Any differences between the two runs? Yes:")
        for d in diffs: print(d)
    else:
        print("Any differences between the two runs? No")
    print("═══════════════════════════════════════")
