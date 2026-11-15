const path = require("node:path");
require("dotenv").config();

const { app, dbFile } = require("./app");
const { db } = require("./db");

const PORT = Number(process.env.PORT) || 3000;

function start() {
  const server = app.listen(PORT, () => {
    console.log("\n  🏍️  MOMO TRAVEL — full-stack server");
    console.log(`  ➜  Website : http://localhost:${PORT}`);
    console.log(`  ➜  API     : http://localhost:${PORT}/api/health`);
    console.log(`  ➜  Database: ${path.relative(process.cwd(), dbFile)}`);
    console.log("\n  Demo accounts:");
    console.log("     customer@test.com / 1234");
    console.log("     staff@momo.com / staff123\n");
  });

  function shutdown() {
    server.close(() => {
      try { db.close(); } catch {}
      process.exit(0);
    });
  }
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
  return server;
}

// Only listen when run directly (`npm start`); Vercel imports the app instead.
if (require.main === module) start();

module.exports = { app, start };
