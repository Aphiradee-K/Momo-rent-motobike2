// Recreates the database from scratch with seed data.
// Usage: npm run reset-db
const fs = require("node:fs");
const path = require("node:path");
require("dotenv").config();

const dbFile = path.resolve(process.cwd(), process.env.DB_FILE || "data/momo.db");
for (const f of [dbFile, dbFile + "-wal", dbFile + "-shm"]) {
  if (fs.existsSync(f)) fs.rmSync(f);
}
require("./index");
console.log("\nDatabase reset complete: " + dbFile);
