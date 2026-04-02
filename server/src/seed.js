import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../../.env') });

const { default: pool } = await import('./db.js');

async function seed() {
  const sql = readFileSync(join(__dirname, '../seeds/001_quiz_data.sql'), 'utf8');
  await pool.query(sql);
  console.log('Seed complete');
  await pool.end();
}

seed().catch(err => { console.error(err); process.exit(1); });
