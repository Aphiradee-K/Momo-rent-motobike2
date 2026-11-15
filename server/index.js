const path = require("node:path");
const express = require("express");
require("dotenv").config();

const { db, dbFile } = require("./db");
const { attachUser } = require("./auth");

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const PUBLIC_DIR = path.resolve(process.cwd(), "public");

app.disable("x-powered-by");
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: false, limit: "2mb" }));

// Tiny request logger (skip static assets)
app.use((req, res, next) => {
  if (req.path.startsWith("/api/")) {
    const start = Date.now();
    res.on("finish", () => {
      console.log(`${req.method} ${req.originalUrl} -> ${res.statusCode} (${Date.now() - start}ms)`);
    });
  }
  next();
});

// All API routes know who is calling (when a bearer token is present)
app.use("/api", attachUser);

app.use("/api/auth", require("./routes/auth"));
app.use("/api/bikes", require("./routes/bikes").router);
app.use("/api/bookings", require("./routes/bookings"));
app.use("/api/messages", require("./routes/messages"));
app.use("/api/notifications", require("./routes/notifications"));
app.use("/api/stats", require("./routes/stats"));
app.use("/api/uploads", require("./routes/uploads"));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "momo-travel-api", time: new Date().toISOString() });
});

app.use("/api", (_req, res) => {
  res.status(404).json({ error: "ไม่พบ API นี้" });
});

app.use(express.static(PUBLIC_DIR, { extensions: ["html"] }));

// Single-page fallback for non-API routes
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/")) return next();
  res.sendFile(path.join(PUBLIC_DIR, "index.html"));
});

// Central error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" });
});

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
