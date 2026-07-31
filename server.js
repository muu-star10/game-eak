const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Block access to sensitive files
app.use((req, res, next) => {
  const forbiddenFiles = ['/.env', '/.git', '/.gitignore', '/package.json', '/package-lock.json', '/schema.sql'];
  const reqPath = req.path.toLowerCase();
  if (forbiddenFiles.some(file => reqPath === file || reqPath.startsWith(file + '/'))) {
    return res.status(403).send('Access Forbidden');
  }
  next();
});

// Serve static frontend files
app.use(express.static(__dirname));

// Initialize PostgreSQL Pool
const connectionString = process.env.DATABASE_URL;

if (!connectionString || connectionString.includes('[YOUR-PASSWORD]')) {
  console.warn('\x1b[33m%s\x1b[0m', '⚠️ WARNING: DATABASE_URL is not configured or still contains [YOUR-PASSWORD] in the .env file.');
  console.warn('\x1b[33m%s\x1b[0m', 'Please edit your .env file with your actual database password before proceeding.');
}

const pool = new Pool({
  connectionString: connectionString,
  ssl: connectionString && connectionString.includes('supabase.com') ? { rejectUnauthorized: false } : false
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
});

// Table mapping identical to frontend
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

// Seeding order to satisfy Foreign Key constraints
const SEED_ORDER = [
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

// Helper to format values for PostgreSQL
function formatValues(keys, row) {
  return keys.map(k => {
    let val = row[k];
    // Convert empty strings for foreign keys to null
    if (['assigned_to', 'user_id', 'workspace_id', 'quest_id'].includes(k) && val === '') {
      return null;
    }
    return val === undefined ? null : val;
  });
}

// 1. Check if database has users
app.get('/api/sync/check-users', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT id FROM "users" LIMIT 1');
    res.json({ hasUsers: rows.length > 0 });
  } catch (err) {
    console.error('Error checking users:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// 2. Seed database from localStorage mock data
app.post('/api/sync/seed', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    console.log('🌱 Starting database seeding...');

    const payload = req.body;

    for (const localKey of SEED_ORDER) {
      const tableName = TABLE_MAP[localKey];
      const rows = payload[localKey] || [];

      if (rows.length > 0) {
        // Truncate table first to clean any leftovers
        await client.query(`TRUNCATE TABLE "${tableName}" RESTART IDENTITY CASCADE`);

        for (const row of rows) {
          const keys = Object.keys(row);
          const values = formatValues(keys, row);
          const cols = keys.map(k => `"${k}"`).join(', ');
          const placeholders = keys.map((_, idx) => `$${idx + 1}`).join(', ');

          const insertQuery = `INSERT INTO "${tableName}" (${cols}) VALUES (${placeholders})`;
          await client.query(insertQuery, values);
        }
        console.log(`✅ Seeded table "${tableName}" with ${rows.length} rows.`);
      }
    }

    await client.query('COMMIT');
    res.json({ success: true, message: 'Database seeded successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seeding failed:', err.message);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// 3. Pull all database rows
app.get('/api/sync/pull', async (req, res) => {
  try {
    const result = {};
    for (const [localKey, tableName] of Object.entries(TABLE_MAP)) {
      const { rows } = await pool.query(`SELECT * FROM "${tableName}" ORDER BY id ASC`);
      result[localKey] = rows;
    }
    res.json(result);
  } catch (err) {
    console.error('❌ Pull failed:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// 4. Insert row
app.post('/api/sync/insert', async (req, res) => {
  try {
    const { localKey, row } = req.body;
    const tableName = TABLE_MAP[localKey];
    if (!tableName) return res.status(400).json({ error: 'Invalid localKey' });

    const keys = Object.keys(row);
    const values = formatValues(keys, row);
    const cols = keys.map(k => `"${k}"`).join(', ');
    const placeholders = keys.map((_, idx) => `$${idx + 1}`).join(', ');

    const query = `INSERT INTO "${tableName}" (${cols}) VALUES (${placeholders}) ON CONFLICT (id) DO NOTHING`;
    await pool.query(query, values);
    console.log(`⚡ Inserted row ID ${row.id} into table "${tableName}"`);
    res.json({ success: true });
  } catch (err) {
    console.error('❌ Insert failed:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// 5. Update row
app.put('/api/sync/update', async (req, res) => {
  try {
    const { localKey, id, updates } = req.body;
    const tableName = TABLE_MAP[localKey];
    if (!tableName) return res.status(400).json({ error: 'Invalid localKey' });

    const keys = Object.keys(updates);
    if (keys.length === 0) return res.json({ success: true, message: 'No updates provided' });

    const values = formatValues(keys, updates);
    const setClause = keys.map((k, idx) => `"${k}" = $${idx + 1}`).join(', ');

    const query = `UPDATE "${tableName}" SET ${setClause} WHERE id = $${keys.length + 1}`;
    await pool.query(query, [...values, id]);
    console.log(`⚡ Updated row ID ${id} in table "${tableName}"`);
    res.json({ success: true });
  } catch (err) {
    console.error('❌ Update failed:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// 6. Delete row
app.delete('/api/sync/delete', async (req, res) => {
  try {
    const { localKey, id } = req.body;
    const tableName = TABLE_MAP[localKey];
    if (!tableName) return res.status(400).json({ error: 'Invalid localKey' });

    const query = `DELETE FROM "${tableName}" WHERE id = $1`;
    await pool.query(query, [id]);
    console.log(`⚡ Deleted row ID ${id} from table "${tableName}"`);
    res.json({ success: true });
  } catch (err) {
    console.error('❌ Delete failed:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Fallback to serve index.html for undefined routes (useful for SPA behavior if needed)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start Server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 QuestBoard server running locally at http://localhost:${PORT}`);
  });
}

module.exports = app;
