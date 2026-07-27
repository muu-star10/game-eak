// supabase-sync.js - Connects and synchronizes In-Memory DB Cache with Local Express Backend

let supabase = null;

const TABLE_MAP = {
  'qb_users': 'users',
  'qb_characters': 'characters',
  'qb_workspaces': 'workspaces',
  'qb_workspace_members': 'workspace_members',
  'qb_quests': 'quests',
  'qb_sub_quests': 'sub_quests',
  'qb_comments': 'comments',
  'qb_rewards': 'rewards',
  'qb_adventure_logs': 'adventure_logs'
};

/**
 * Initializes the connection to the local Express backend
 */
async function initSupabase() {
  try {
    const res = await fetch('/api/sync/check-users');
    // A 200 or 500 status means the Express server is running and reachable
    if (res.ok || res.status === 500) {
      console.log("✅ Local Express sync server detected.");
      supabase = true; // Use truthy value as handle
      return true;
    }
    throw new Error('Server not responding with expected statuses.');
  } catch (e) {
    console.warn("⚠️ Local sync server is not running. Running in LocalStorage-only mode.");
    supabase = null;
    return null;
  }
}

/**
 * Syncs DB cache with PostgreSQL via local Express API on page load.
 * If database is empty, it seeds it with DEFAULT_MOCK_DATA.
 * Otherwise, it pulls down all data to populate DB cache.
 */
async function syncWithSupabase(client) {
  console.log("🔄 Synchronizing data with Local Express Backend...");

  try {
    // 1. Check if the database has any users
    const res = await fetch('/api/sync/check-users');
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Server returned an error checking database users.');
    }
    const { hasUsers } = await res.json();

    // 2. If database is empty, seed it with DEFAULT_MOCK_DATA
    if (!hasUsers) {
      console.log("🌱 Database is empty. Seeding default mock data to PostgreSQL...");
      
      const payload = window.DEFAULT_MOCK_DATA || {};

      const seedRes = await fetch('/api/sync/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!seedRes.ok) {
        const errData = await seedRes.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to seed local data to PostgreSQL.');
      }

      // Populate DB in-memory cache with the default mock data we just seeded
      for (const [localKey, rows] of Object.entries(payload)) {
        DB.set(localKey, rows || []);
        console.log(`✅ Loaded seed table '${TABLE_MAP[localKey]}': ${rows.length} rows.`);
      }

      console.log("🎉 Database seeding and cache initialization completed successfully!");
    } else {
      // 3. Database is already seeded, pull all records to populate DB cache
      console.log("📥 Database is already seeded. Fetching latest data from PostgreSQL...");

      const pullRes = await fetch('/api/sync/pull');
      if (!pullRes.ok) {
        const errData = await pullRes.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to pull data from PostgreSQL.');
      }

      const data = await pullRes.json();
      for (const [localKey, rows] of Object.entries(data)) {
        DB.set(localKey, rows || []);
        console.log(`✅ Pulled table '${TABLE_MAP[localKey]}': ${rows.length} rows.`);
      }
      console.log("🎉 In-memory cache synced successfully with PostgreSQL!");
    }
  } catch (e) {
    console.error("❌ Exception during PostgreSQL synchronization:", e);
    alert("⚠️ Database Sync Error: " + e.message + "\nCheck terminal output or browser console for details.");
  }
}

/**
 * Background Sync Helpers for DB write operations
 */
async function syncInsert(localKey, row) {
  if (!supabase) return;
  try {
    const res = await fetch('/api/sync/insert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ localKey, row })
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      console.error(`❌ Sync insert failed for ${localKey} ID ${row.id}:`, errData.error || 'Server error');
    } else {
      console.log(`⚡ Sync insert succeeded for ${localKey} ID ${row.id}`);
    }
  } catch (err) {
    console.error(`❌ Sync connection error during insert into ${localKey}:`, err);
  }
}

async function syncUpdate(localKey, id, updates) {
  if (!supabase) return;
  try {
    const res = await fetch('/api/sync/update', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ localKey, id, updates })
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      console.error(`❌ Sync update failed for ${localKey} ID ${id}:`, errData.error || 'Server error');
    } else {
      console.log(`⚡ Sync update succeeded for ${localKey} ID ${id}`);
    }
  } catch (err) {
    console.error(`❌ Sync connection error during update of ${localKey} ID ${id}:`, err);
  }
}

async function syncDelete(localKey, id) {
  if (!supabase) return;
  try {
    const res = await fetch('/api/sync/delete', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ localKey, id })
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      console.error(`❌ Sync delete failed for ${localKey} ID ${id}:`, errData.error || 'Server error');
    } else {
      console.log(`⚡ Sync delete succeeded for ${localKey} ID ${id}`);
    }
  } catch (err) {
    console.error(`❌ Sync connection error during delete of ${localKey} ID ${id}:`, err);
  }
}
