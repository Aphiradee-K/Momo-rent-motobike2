const express = require("express");
const { db } = require("../db");
const { staffOnly } = require("../auth");

const router = express.Router();

router.get("/summary", staffOnly, (_req, res) => {
  const total = db.prepare("SELECT COUNT(*) AS n FROM bookings WHERE status <> 'cancelled'").get().n;
  const pending = db.prepare("SELECT COUNT(*) AS n FROM bookings WHERE status = 'pending'").get().n;
  const active = db.prepare("SELECT COUNT(*) AS n FROM bookings WHERE status = 'active'").get().n;
  const revenue = db.prepare("SELECT COALESCE(SUM(total), 0) AS n FROM bookings WHERE status <> 'cancelled'").get().n;
  const bikes = db.prepare("SELECT COUNT(*) AS n FROM bikes").get().n;
  const customers = db.prepare("SELECT COUNT(*) AS n FROM users WHERE role = 'customer'").get().n;

  res.json({ summary: { total, pending, active, revenue, bikes, customers } });
});

router.get("/revenue", staffOnly, (req, res) => {
  const requested = Number(req.query.year);
  const currentYear = new Date().getFullYear();
  const year = Number.isInteger(requested) ? requested : currentYear;

  const demoRows = db.prepare("SELECT year, month, amount FROM demo_revenue").all();
  const bookingRows = db.prepare(`
    SELECT CAST(substr(start_date, 1, 4) AS INTEGER) AS year,
           CAST(substr(start_date, 6, 2) AS INTEGER) AS month,
           SUM(total) AS amount,
           COUNT(*) AS count
    FROM bookings
    WHERE status <> 'cancelled'
    GROUP BY year, month
  `).all();

  const years = [...new Set([
    ...demoRows.map((r) => r.year),
    ...bookingRows.map((r) => r.year),
    currentYear,
  ])].sort((a, b) => b - a);

  const demoByYear = new Map();
  for (const r of demoRows) {
    if (!demoByYear.has(r.year)) demoByYear.set(r.year, Array(12).fill(0));
    demoByYear.get(r.year)[r.month - 1] = r.amount;
  }

  const actualByYear = new Map();
  const countByYear = new Map();
  for (const r of bookingRows) {
    if (!actualByYear.has(r.year)) actualByYear.set(r.year, Array(12).fill(0));
    actualByYear.get(r.year)[r.month - 1] += r.amount;
    countByYear.set(r.year, (countByYear.get(r.year) || 0) + r.count);
  }

  const monthlyFor = (y) => {
    const base = (demoByYear.get(y) || Array(12).fill(0)).slice();
    const actual = actualByYear.get(y) || Array(12).fill(0);
    return base.map((v, i) => Math.round(v + actual[i]));
  };

  const monthly = monthlyFor(year);
  const total = monthly.reduce((s, n) => s + n, 0);
  const best = monthly.length ? Math.max(...monthly) : 0;

  res.json({
    year,
    years,
    monthly,
    total,
    average: Math.round(total / 12),
    best,
    realBookings: countByYear.get(year) || 0,
    yearly: years.map((y) => {
      const data = monthlyFor(y);
      const sum = data.reduce((s, n) => s + n, 0);
      return { year: y, total: sum, average: Math.round(sum / 12) };
    }),
  });
});

module.exports = router;
