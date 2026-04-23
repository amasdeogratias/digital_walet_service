import fs from 'fs/promises';
import path from 'path';
import { getPostgresPool } from '../postgres';

const run = async (): Promise<void> => {
  const sqlDirectory = path.resolve(__dirname, '../sql');
  const filenames = (await fs.readdir(sqlDirectory)).filter((file) => file.endsWith('.sql')).sort();
  const pool = getPostgresPool();

  for (const filename of filenames) {
    const sql = await fs.readFile(path.join(sqlDirectory, filename), 'utf8');
    console.log(`Running migration ${filename}`);
    await pool.query(sql);
  }

  await pool.end();
};

run().catch((error) => {
  console.error('Migration failed', error);
  process.exit(1);
});
