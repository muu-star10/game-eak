// supabase-sync.js - Connects and synchronizes LocalStorage DB with Supabase

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
 * Initializes the Supabase client
 */
async function initSupabase() {
  let url = window.SUPABASE_URL;
  let key = window.SUPABASE_KEY;

  // Try to load credentials from Vercel Serverless Function first
  try {
    const res = await fetch('/api/env');
    if (res.ok) {
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        if (data.SUPABASE_URL && data.SUPABASE_KEY) {
          url = data.SUPABASE_URL;
          key = data.SUPABASE_KEY;
          console.log("Supabase config loaded dynamically from Vercel API.");
        }
      } else {
        console.log("/api/env response is not JSON (likely running on local static dev server).");
      }
    }
  } catch (e) {
    console.log("Vercel Serverless API not available. Using local config.");
  }

  // Check if credentials are valid
  if (!url || !key || url.includes("YOUR_") || key.includes("YOUR_")) {
    console.warn("Supabase configuration is incomplete. Running in LocalStorage-only mode.");
    return null;
  }

  try {
    supabase = window.supabase.createClient(url, key);
    window.supabaseClient = supabase; // global handle for debugging
    return supabase;
  } catch (err) {
    console.error("Failed to initialize Supabase client:", err);
    return null;
  }
}

/**
 * Syncs localStorage data with Supabase on page load.
 * If Supabase has no users, it seeds Supabase with current localStorage mock data.
 * Otherwise, it pulls down all data from Supabase to overwrite local storage.
 */
async function syncWithSupabase(client) {
  console.log("🔄 Synchronizing data with Supabase...");

  try {
    // 1. Check if the database has any users
    const { data: users, error } = await client.from('users').select('id').limit(1);

    if (error) {
      console.error("❌ Error reading from Supabase. Make sure you have created the tables in Supabase SQL editor and disabled RLS.", error);
      alert("⚠️ Supabase Sync Error: Make sure your schema is initialized and RLS is disabled in Supabase. Check console log for details.");
      return;
    }

    // 2. If Supabase is empty, seed it with current localStorage data
    if (!users || users.length === 0) {
      console.log("🌱 Supabase is empty. Seeding local mock data to Supabase...");
      
      // Order of seeding matters due to Foreign Keys
      const seedOrder = [
        'qb_users',
        'qb_characters',
        'qb_workspaces',
        'qb_workspace_members',
        'qb_quests',
        'qb_sub_quests',
        'qb_comments',
        'qb_rewards',
        'qb_adventure_logs'
      ];

      for (const localKey of seedOrder) {
        const table = TABLE_MAP[localKey];
        const data = JSON.parse(localStorage.getItem(localKey)) || [];

        if (data.length > 0) {
          // Format data to fit schema
          const formatted = data.map(item => {
            const row = { ...item };
            
            // Handle specific table columns constraints
            if (localKey === 'qb_workspaces' && row.description === undefined) {
              row.description = '';
            }
            if (localKey === 'qb_quests') {
              if (row.description === undefined) row.description = '';
              if (!row.assigned_to) delete row.assigned_to; // must be null or valid ID
            }
            return row;
          });

          const { error: insertErr } = await client.from(table).insert(formatted);
          if (insertErr) {
            console.error(`❌ Failed to seed table '${table}':`, insertErr);
          } else {
            console.log(`✅ Seeded table '${table}' with ${data.length} records.`);
          }
        }
      }
      console.log("🎉 Database seeding completed successfully!");
    } else {
      // 3. Database is already seeded, pull all records to replace LocalStorage
      console.log("📥 Database is already seeded. Fetching latest data from Supabase...");

      for (const [localKey, table] of Object.entries(TABLE_MAP)) {
        const { data, error: pullErr } = await client.from(table).select('*').order('id', { ascending: true });
        if (pullErr) {
          console.error(`❌ Failed to pull table '${table}':`, pullErr);
        } else {
          localStorage.setItem(localKey, JSON.stringify(data || []));
          console.log(`✅ Pulled table '${table}': ${data ? data.length : 0} rows.`);
        }
      }
      console.log("🎉 LocalStorage synced successfully with Supabase!");
    }
  } catch (e) {
    console.error("❌ Exception during Supabase synchronization:", e);
  }
}

/**
 * Background Sync Helpers for DB write operations
 */
async function syncInsert(localKey, row) {
  if (!supabase) return;
  const table = TABLE_MAP[localKey];
  if (!table) return;

  const formattedRow = { ...row };
  // Ensure optional properties exist or match PostgreSQL constraints
  if (localKey === 'qb_workspaces' && formattedRow.description === undefined) {
    formattedRow.description = '';
  }
  if (localKey === 'qb_quests') {
    if (formattedRow.description === undefined) formattedRow.description = '';
    if (!formattedRow.assigned_to) delete formattedRow.assigned_to;
  }

  try {
    const { error } = await supabase.from(table).insert(formattedRow);
    if (error) {
      console.error(`❌ Supabase Sync: Failed to insert into ${table} ID ${row.id}:`, error);
    } else {
      console.log(`⚡ Supabase Sync: Inserted into ${table} ID ${row.id}`);
    }
  } catch (err) {
    console.error(`❌ Supabase Sync: Error inserting into ${table}:`, err);
  }
}

async function syncUpdate(localKey, id, updates) {
  if (!supabase) return;
  const table = TABLE_MAP[localKey];
  if (!table) return;

  // Formatting updates if needed
  const formattedUpdates = { ...updates };
  if (localKey === 'qb_quests' && formattedUpdates.hasOwnProperty('assigned_to') && !formattedUpdates.assigned_to) {
    formattedUpdates.assigned_to = null;
  }

  try {
    const { error } = await supabase.from(table).update(formattedUpdates).eq('id', id);
    if (error) {
      console.error(`❌ Supabase Sync: Failed to update ${table} ID ${id}:`, error);
    } else {
      console.log(`⚡ Supabase Sync: Updated ${table} ID ${id}`);
    }
  } catch (err) {
    console.error(`❌ Supabase Sync: Error updating ${table} ID ${id}:`, err);
  }
}

async function syncDelete(localKey, id) {
  if (!supabase) return;
  const table = TABLE_MAP[localKey];
  if (!table) return;

  try {
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) {
      console.error(`❌ Supabase Sync: Failed to delete from ${table} ID ${id}:`, error);
    } else {
      console.log(`⚡ Supabase Sync: Deleted from ${table} ID ${id}`);
    }
  } catch (err) {
    console.error(`❌ Supabase Sync: Error deleting from ${table} ID ${id}:`, err);
  }
}
