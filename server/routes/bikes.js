const express = require("express");
const { db } = require("../db");
const { authRequired, staffOnly } = require("../auth");
const { bikeOut } = require("../serializers");
const { isISODate, cleanText } = require("../validate");
const asyncHandler = require("../asyncHandler");

const router = express.Router();

const ALLOWED_TYPES = ["family", "classic", "scooter", "sport", "adventure", "premium"];

async function activeBikeIds(start, end) {
  if (!start || !end) return new Set();
  const rows = await db.prepare(`
    SELECT DISTINCT bike_id FROM bookings
    WHERE status IN ('pending', 'active') AND start_date <= ? AND end_date >= ?
  `).all(end, start);
  return new Set(rows.map((r) => r.bike_id));
}

async function activeBookingCounts() {
  const rows = await db.prepare(`
    SELECT bike_id, COUNT(*) AS n FROM bookings
    WHERE status IN ('pending', 'active') GROUP BY bike_id
  `).all();
  return new Map(rows.map((r) => [r.bike_id, r.n]));
}

router.get("/", asyncHandler(async (req, res) => {
  const { type, start, end } = req.query;
  let rows;
  if (type && type !== "all" && ALLOWED_TYPES.includes(type)) {
    rows = await db.prepare("SELECT * FROM bikes WHERE type = ? ORDER BY id").all(type);
  } else {
    rows = await db.prepare("SELECT * FROM bikes ORDER BY id").all();
  }

  const busy = await activeBikeIds(isISODate(start) ? start : null, isISODate(end) ? end : null);
  const counts = req.user && req.user.role === "staff" ? await activeBookingCounts() : new Map();
  res.json({
    bikes: rows.map((row) => bikeOut(row, {
      busy: busy.has(row.id),
      activeBookings: counts.get(row.id) || 0,
    })),
  });
}));

router.get("/:id", asyncHandler(async (req, res) => {
  const row = await db.prepare("SELECT * FROM bikes WHERE id = ?").get(Number(req.params.id));
  if (!row) return res.status(404).json({ error: "ไม่พบรถคันนี้" });
  const { start, end } = req.query;
  const busy = isISODate(start) && isISODate(end)
    ? (await activeBikeIds(start, end)).has(row.id)
    : false;
  res.json({ bike: bikeOut(row, { busy }) });
}));

function readBikeBody(body) {
  const name = cleanText(body.name, 120);
  const type = cleanText(body.type, 30);
  const price = Number(body.price);
  const img = cleanText(body.img, 500);
  const specs = Array.isArray(body.specs)
    ? body.specs.map((s) => cleanText(s, 80)).filter(Boolean).slice(0, 12)
    : [];
  const d = body.detail && typeof body.detail === "object" ? body.detail : {};
  const detail = {
    cc: cleanText(d.cc, 60),
    fuel: cleanText(d.fuel, 100),
    mpg: cleanText(d.mpg, 60),
    topSpeed: cleanText(d.topSpeed, 60),
    seat: cleanText(d.seat, 60),
    weight: cleanText(d.weight, 60),
    starter: cleanText(d.starter, 80),
    brake: cleanText(d.brake, 100),
    color: cleanText(d.color, 80),
    feature: Array.isArray(d.feature)
      ? d.feature.map((f) => cleanText(f, 300)).filter(Boolean).slice(0, 12)
      : [],
  };

  if (!name) return { error: "กรุณากรอกชื่อรถ" };
  if (!ALLOWED_TYPES.includes(type)) return { error: "ประเภทรถไม่ถูกต้อง" };
  if (!Number.isFinite(price) || price < 0) return { error: "ราคาไม่ถูกต้อง" };

  return { value: { name, type, price: Math.round(price), img, specs, detail } };
}

router.post("/", staffOnly, asyncHandler(async (req, res) => {
  const parsed = readBikeBody(req.body);
  if (parsed.error) return res.status(400).json({ error: parsed.error });
  const { name, type, price, img, specs, detail } = parsed.value;

  const result = await db.prepare(`
    INSERT INTO bikes (name, type, price, img, specs, cc, fuel, mpg, top_speed, seat, weight, starter, brake, color, features)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    name, type, price, img, JSON.stringify(specs),
    detail.cc, detail.fuel, detail.mpg, detail.topSpeed, detail.seat, detail.weight,
    detail.starter, detail.brake, detail.color, JSON.stringify(detail.feature)
  );

  const row = await db.prepare("SELECT * FROM bikes WHERE id = ?").get(Number(result.lastInsertRowid));
  res.status(201).json({ bike: bikeOut(row) });
}));

router.put("/:id", staffOnly, asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const existing = await db.prepare("SELECT * FROM bikes WHERE id = ?").get(id);
  if (!existing) return res.status(404).json({ error: "ไม่พบรถคันนี้" });

  const parsed = readBikeBody(req.body);
  if (parsed.error) return res.status(400).json({ error: parsed.error });
  const { name, type, price, img, specs, detail } = parsed.value;

  await db.prepare(`
    UPDATE bikes SET name = ?, type = ?, price = ?, img = ?, specs = ?,
      cc = ?, fuel = ?, mpg = ?, top_speed = ?, seat = ?, weight = ?,
      starter = ?, brake = ?, color = ?, features = ?
    WHERE id = ?
  `).run(
    name, type, price, img, JSON.stringify(specs),
    detail.cc, detail.fuel, detail.mpg, detail.topSpeed, detail.seat, detail.weight,
    detail.starter, detail.brake, detail.color, JSON.stringify(detail.feature), id
  );

  const row = await db.prepare("SELECT * FROM bikes WHERE id = ?").get(id);
  res.json({ bike: bikeOut(row) });
}));

router.delete("/:id", staffOnly, asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const existing = await db.prepare("SELECT * FROM bikes WHERE id = ?").get(id);
  if (!existing) return res.status(404).json({ error: "ไม่พบรถคันนี้" });

  const active = (await db.prepare(`
    SELECT COUNT(*) AS n FROM bookings WHERE bike_id = ? AND status IN ('pending', 'active')
  `).get(id)).n;
  if (active > 0) {
    return res.status(409).json({ error: "ไม่สามารถลบรถได้ — มีการจองที่ยังไม่เสร็จสิ้น" });
  }

  await db.prepare("DELETE FROM bikes WHERE id = ?").run(id);
  res.json({ ok: true, id });
}));

module.exports = { router, activeBikeIds };
