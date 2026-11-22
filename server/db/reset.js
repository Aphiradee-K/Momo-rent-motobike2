// Recreates the database from scratch with seed data.
// Usage: npm run reset-db
const fs = require("node:fs");
const path = require("node:path");
require("dotenv").config();

const usePostgres = Boolean(process.env.DATABASE_URL || process.env.database);

async function reset() {
  if (!usePostgres) {
    const file = path.resolve(process.cwd(), process.env.DB_FILE || "data/momo.db");
    for (const f of [file, file + "-wal", file + "-shm"]) {
      if (fs.existsSync(f)) fs.rmSync(f);
    }
  }

  // Load index.js only after old SQLite files are gone so it opens a fresh file.
  const { db, init, dbFile } = require("./index");

  if (usePostgres) {
    await db.query(`
      TRUNCATE TABLE messages, bookings, demo_revenue, bikes, users
      RESTART IDENTITY CASCADE
    `);
  }

  await init();
  console.log("\nDatabase reset complete: " + dbFile);
}

reset().catch((err) => {
  console.error("Reset failed:", err);
  process.exitCode = 1;
});
