// Applies pending Drizzle SQL migrations to the SQLite database. Run once before the
// server starts (see the Dockerfile CMD) — safe to run on every container start, it's a no-op
// once the schema is up to date.
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
	console.error('DATABASE_URL is not set');
	process.exit(1);
}

const __dirname = dirname(fileURLToPath(import.meta.url));

const sqlite = new Database(databaseUrl);
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

const db = drizzle(sqlite);

migrate(db, { migrationsFolder: join(__dirname, '..', 'drizzle') });

console.log(`Database migrated: ${databaseUrl}`);
sqlite.close();
