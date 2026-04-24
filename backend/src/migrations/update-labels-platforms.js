/**
 * Migration: update-labels-platforms
 *
 * Updates test_cases and system_settings to use the new label/platform taxonomy:
 *
 *   Labels  (old → new)
 *     Functional → Regression
 *     Positive   → Smoke
 *     Edge       → Sanity
 *     UI/UX      → (removed — no semantic equivalent)
 *     Negative   → (removed — no semantic equivalent)
 *     Security   → (removed — no semantic equivalent)
 *
 *   Platforms (old → new)
 *     Mobile → Android
 *     Web, Both unchanged
 *
 * Run once after deploying schema changes:
 *   node src/migrations/update-labels-platforms.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { persistSession: false } }
);

// ── Mapping tables ────────────────────────────────────────────

const LABEL_MAP = {
  'Functional': 'Regression',
  'Positive':   'Smoke',
  'Edge':       'Sanity',
  'UI/UX':      null,   // removed
  'Negative':   null,   // removed
  'Security':   null,   // removed
};

const PLATFORM_MAP = {
  'Mobile': 'Android',
};

// ── New settings seed values ──────────────────────────────────

const NEW_LABELS = [
  { value: 'Smoke',       color: '#60a5fa', sort_order: 1 },
  { value: 'Regression',  color: '#c084fc', sort_order: 2 },
  { value: 'Sanity',      color: '#fbbf24', sort_order: 3 },
  { value: 'Integration', color: '#34d399', sort_order: 4 },
  { value: 'E2E',         color: '#f472b6', sort_order: 5 },
];

const NEW_PLATFORMS = [
  { value: 'Web',     color: '#60a5fa', sort_order: 1 },
  { value: 'Android', color: '#34d399', sort_order: 2 },
  { value: 'iOS',     color: '#c084fc', sort_order: 3 },
  { value: 'Both',    color: '#7c6af7', sort_order: 4 },
];

const OLD_LABEL_VALUES   = Object.keys(LABEL_MAP);
const OLD_PLATFORM_VALUES = Object.keys(PLATFORM_MAP);

// ── Helpers ───────────────────────────────────────────────────

function mapLabels(labels) {
  if (!Array.isArray(labels)) return [];
  const result = [];
  for (const l of labels) {
    if (OLD_LABEL_VALUES.includes(l)) {
      const mapped = LABEL_MAP[l];
      if (mapped) result.push(mapped);
      // null → drop silently
    } else {
      result.push(l); // already a new value, keep it
    }
  }
  // deduplicate
  return [...new Set(result)];
}

function mapPlatform(platform) {
  return PLATFORM_MAP[platform] ?? platform;
}

function log(msg) {
  console.log(`[${new Date().toISOString()}] ${msg}`);
}

// ── Migration steps ───────────────────────────────────────────

async function migrateTestCases() {
  log('── Test Cases ──────────────────────────────────────────');

  const { data: rows, error } = await supabase
    .from('test_cases')
    .select('id, test_case_id, labels, platform');

  if (error) throw new Error(`Fetch test_cases failed: ${error.message}`);
  log(`  Found ${rows.length} test cases`);

  let labelChanges = 0;
  let platformChanges = 0;
  let skipped = 0;

  for (const row of rows) {
    const newLabels   = mapLabels(row.labels);
    const newPlatform = mapPlatform(row.platform);

    const labelsChanged   = JSON.stringify(row.labels) !== JSON.stringify(newLabels);
    const platformChanged = row.platform !== newPlatform;

    if (!labelsChanged && !platformChanged) { skipped++; continue; }

    const updates = {};
    if (labelsChanged)   updates.labels   = newLabels;
    if (platformChanged) updates.platform = newPlatform;

    const { error: updateErr } = await supabase
      .from('test_cases')
      .update(updates)
      .eq('id', row.id);

    if (updateErr) {
      log(`  ERROR updating ${row.test_case_id}: ${updateErr.message}`);
      continue;
    }

    if (labelsChanged) {
      log(`  [LABELS]   ${row.test_case_id}: [${(row.labels || []).join(', ')}] → [${newLabels.join(', ')}]`);
      labelChanges++;
    }
    if (platformChanged) {
      log(`  [PLATFORM] ${row.test_case_id}: ${row.platform} → ${newPlatform}`);
      platformChanges++;
    }
  }

  log(`  Done — ${labelChanges} label update(s), ${platformChanges} platform update(s), ${skipped} unchanged`);
}

async function migrateSettings() {
  log('── System Settings ─────────────────────────────────────');

  // ── Labels ────────────────────────────────────────────────
  const { data: existingLabels } = await supabase
    .from('system_settings')
    .select('id, value')
    .eq('category', 'label');

  const existingLabelValues = (existingLabels || []).map(r => r.value);
  const obsoleteLabels = (existingLabels || []).filter(r => OLD_LABEL_VALUES.includes(r.value));

  if (obsoleteLabels.length > 0) {
    const ids = obsoleteLabels.map(r => r.id);
    const { error } = await supabase.from('system_settings').delete().in('id', ids);
    if (error) throw new Error(`Delete old labels failed: ${error.message}`);
    log(`  Removed old label settings: ${obsoleteLabels.map(r => r.value).join(', ')}`);
  } else {
    log('  No obsolete label settings to remove');
  }

  const labelsToInsert = NEW_LABELS.filter(l => !existingLabelValues.includes(l.value));
  if (labelsToInsert.length > 0) {
    const { error } = await supabase.from('system_settings').insert(
      labelsToInsert.map(l => ({ category: 'label', ...l, is_default: false }))
    );
    if (error) throw new Error(`Insert new labels failed: ${error.message}`);
    log(`  Inserted new label settings: ${labelsToInsert.map(l => l.value).join(', ')}`);
  } else {
    log('  New label settings already present — skipped insert');
  }

  // ── Platforms ─────────────────────────────────────────────
  const { data: existingPlatforms } = await supabase
    .from('system_settings')
    .select('id, value')
    .eq('category', 'platform');

  const existingPlatformValues = (existingPlatforms || []).map(r => r.value);
  const obsoletePlatforms = (existingPlatforms || []).filter(r => OLD_PLATFORM_VALUES.includes(r.value));

  if (obsoletePlatforms.length > 0) {
    const ids = obsoletePlatforms.map(r => r.id);
    const { error } = await supabase.from('system_settings').delete().in('id', ids);
    if (error) throw new Error(`Delete old platforms failed: ${error.message}`);
    log(`  Removed old platform settings: ${obsoletePlatforms.map(r => r.value).join(', ')}`);
  } else {
    log('  No obsolete platform settings to remove');
  }

  const platformsToInsert = NEW_PLATFORMS.filter(p => !existingPlatformValues.includes(p.value));
  if (platformsToInsert.length > 0) {
    const { error } = await supabase.from('system_settings').insert(
      platformsToInsert.map(p => ({ category: 'platform', ...p, is_default: false }))
    );
    if (error) throw new Error(`Insert new platforms failed: ${error.message}`);
    log(`  Inserted new platform settings: ${platformsToInsert.map(p => p.value).join(', ')}`);
  } else {
    log('  New platform settings already present — skipped insert');
  }
}

async function verify() {
  log('── Verification ────────────────────────────────────────');

  const { data: tcSample } = await supabase
    .from('test_cases')
    .select('test_case_id, labels, platform')
    .limit(5);

  if (tcSample?.length) {
    log('  Sample test cases after migration:');
    for (const t of tcSample) {
      log(`    ${t.test_case_id}  labels=[${(t.labels || []).join(', ')}]  platform=${t.platform}`);
    }
  }

  const { data: labelSettings } = await supabase
    .from('system_settings').select('value').eq('category', 'label').order('sort_order');
  const { data: platformSettings } = await supabase
    .from('system_settings').select('value').eq('category', 'platform').order('sort_order');

  log(`  Labels in settings:    ${(labelSettings || []).map(r => r.value).join(', ')}`);
  log(`  Platforms in settings: ${(platformSettings || []).map(r => r.value).join(', ')}`);
}

// ── Entry point ───────────────────────────────────────────────

async function run() {
  log('Migration: update-labels-platforms — START');
  log('');

  try {
    await migrateTestCases();
    log('');
    await migrateSettings();
    log('');
    await verify();
    log('');
    log('Migration complete — SUCCESS');
  } catch (err) {
    log(`\nMigration FAILED: ${err.message}`);
    process.exit(1);
  }
}

run();
