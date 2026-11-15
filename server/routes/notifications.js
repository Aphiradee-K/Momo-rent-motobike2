const express = require("express");
const { db } = require("../db");
const { authRequired } = require("../auth");
const { BOOKING_SELECT } = require("../serializers");
const { daysBetween, todayISO, isISODate } = require("../validate");

const router = express.Router();

router.get("/", authRequired, (req, res) => {
  const isStaff = req.user.role === "staff";
  const rows = isStaff
    ? db.prepare(BOOKING_SELECT + " WHERE b.status IN ('pending','active')").all()
    : db.prepare(BOOKING_SELECT + " WHERE b.user_id = ? AND b.status IN ('pending','active')").all(req.user.id);

  const today = todayISO();
  const items = [];

  for (const b of rows) {
    if (!isISODate(b.end_date)) continue;
    const diff = daysBetween(today, b.end_date);
    if (diff > 2) continue;

    const overdue = diff < 0;
    const label = overdue ? `เลยกำหนด ${Math.abs(diff)} วัน` : diff === 0 ? "วันนี้!" : diff === 1 ? "พรุ่งนี้" : "อีก 2 วัน";
    items.push({
      id: b.id,
      urgent: overdue || diff === 0,
      icon: overdue ? "🚨" : diff === 0 ? "⏰" : "📅",
      title: `${b.bike_name} — ${overdue ? "เลยกำหนดคืนรถ!" : "คืนรถ" + label}`,
      desc: `กำหนดคืน ${b.end_date} / ผู้เช่า ${b.renter_name} / ${b.phone}`,
      daysLeft: diff,
      bookingId: b.id,
    });
  }

  items.sort((a, b) => a.daysLeft - b.daysLeft);
  res.json({ notifications: items, count: items.length });
});

module.exports = router;
