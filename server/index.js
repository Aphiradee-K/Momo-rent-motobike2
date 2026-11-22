require("dotenv").config();

const { app } = require("./app");
const { init, dbFile, usePostgres } = require("./db");

const PORT = Number(process.env.PORT) || 3000;

async function start() {
  await init();

  const server = app.listen(PORT, () => {
    console.log("\n  🏍️  MOMO TRAVEL — full-stack server");
    console.log(`  ➜  Website : http://localhost:${PORT}`);
    console.log(`  ➜  API     : http://localhost:${PORT}/api/health`);
    console.log(`  ➜  Database: ${usePostgres ? "PostgreSQL" : "SQLite"} — ${dbFile}`);
    console.log("\n  Demo accounts:");
    console.log("     customer@test.com / 1234");
    console.log("     staff@momo.com / staff123\n");
  });

  function shutdown() {
    server.close(() => process.exit(0));
  }
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
  return server;
}

// Only listen when run directly (`npm start`); Vercel imports the app instead.
if (require.main === module) {
  start().catch((err) => {
    console.error("Failed to start server:", err);
    process.exit(1);
  });
}

module.exports = { app, start };
