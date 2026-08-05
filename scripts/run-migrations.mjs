import { Client } from "pg";
import { readFileSync, readdirSync, existsSync } from "fs";
import { join } from "path";

// This machine may have a DATABASE_URL set in the shell for an unrelated project,
// so .env.local must win over any inherited environment variable here.
const envLocalPath = join(import.meta.dirname, "..", ".env.local");
if (existsSync(envLocalPath)) {
  for (const line of readFileSync(envLocalPath, "utf-8").split("\n")) {
    const match = line.match(/^([\w.-]+)=(.*)$/);
    if (match) process.env[match[1]] = match[2];
  }
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("Missing DATABASE_URL env var");
  process.exit(1);
}

const migrationsDir = process.argv[2];
const files = readdirSync(migrationsDir).filter((f) => f.endsWith(".sql")).sort();

const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
await client.connect();

await client.query(
  "create table if not exists _migrations (filename text primary key, applied_at timestamptz not null default now())"
);
const { rows } = await client.query("select filename from _migrations");
const applied = new Set(rows.map((r) => r.filename));

for (const file of files) {
  if (applied.has(file)) {
    console.log(`Skipping ${file} (already applied)`);
    continue;
  }
  const sql = readFileSync(join(migrationsDir, file), "utf-8");
  console.log(`Applying ${file}...`);
  try {
    await client.query("begin");
    await client.query(sql);
    await client.query("insert into _migrations (filename) values ($1)", [file]);
    await client.query("commit");
    console.log(`OK: ${file}`);
  } catch (err) {
    await client.query("rollback");
    console.error(`FAILED: ${file}`);
    console.error(err.message);
    await client.end();
    process.exit(1);
  }
}

await client.end();
console.log("All migrations applied.");
