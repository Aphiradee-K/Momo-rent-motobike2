const path = require("node:path");
const express = require("express");
require("dotenv").config();

const { init } = require("./db");
const { attachUser } = require("./auth");

const app = express();
const PUBLIC_DIR = path.resolve(process.cwd(), "public");
const UPLOAD_DIR = path.resolve(
  process.cwd(),
  process.env.UPLOAD_DIR || (process.env.VERCEL ? "/tmp/uploads" : "public/uploads")
);

app.disable("x-powered-by");
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: false, limit: "2mb" }));

// Make sure the database (schema + seed) is ready before handling any request.
app.use(async (_req, _res, next) => {
  try {
    await init();
    next();
  } catch (err) {
    next(err);
  }
});

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
  res.json({
    ok: true,
    service: "momo-travel-api",
    storage: (process.env.DATABASE_URL || process.env.database) ? "postgres" : (process.env.VERCEL ? "ephemeral" : "local"),
    time: new Date().toISOString(),
  });
});

app.use("/api", (_req, res) => {
  res.status(404).json({ error: "ไม่พบ API นี้" });
});

// Uploaded images (may live outside public/ on serverless platforms)
app.use("/uploads", express.static(UPLOAD_DIR, { maxAge: "1h" }));

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

module.exports = { app, PUBLIC_DIR, UPLOAD_DIR };
