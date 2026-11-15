const express = require("express");
const { db } = require("../db");
const { authRequired, staffOnly } = require("../auth");
const { BOOKING_SELECT, bookingOut } = require("../serializers");
const { isISODate, daysBetween, todayISO, isValidPhone, cleanText } = require("../validate");
const { activeBikeIds } = require("./bikes");

const router = express.Router();

function getBooking(id) {
  return db.prepare(BOOKING_SELECT + " WHERE b.id = ?").get(id);
}

router.get("/mine", authRequired, (req, res) => {
  const rows = db.prepare(BOOKING_SELECT + " WHERE b.user_id = ? ORDER BY b.id DESC")
    .all(req.user.id);
  res.json({ bookings: rows.map(bookingOut) });
});

router.get("/", staffOnly, (_req, res) => {
  const rows = db.prepare(BOOKING_SELECT + " ORDER BY b.id DESC").all();
  res.json({ bookings: rows.map(bookingOut) });
});

router.post("/", authRequired, (req, res) => {
  if (req.user.role !== "customer") {
    return res.status(403).json({ error: "เฉพาะลูกค้าเท่านั้นที่สามารถจองรถได้" });
  }

  const bikeId = Number(req.body.bikeId);
  const start = cleanText(req.body.start, 10);
  const end = cleanText(req.body.end, 10);
  const phone = cleanText(req.body.phone, 30);

  if (!isISODate(start) || !isISODate(end)) {
    return res.status(400).json({ error: "กรุณาเลือกวันที่ให้ถูกต้อง" });
  }
  const days = daysBetween(start, end);
  if (days < 1) return res.status(400).json({ error: "วันที่คืนรถต้องหลังวันที่รับรถ" });
  if (start < todayISO()) return res.status(400).json({ error: "ไม่สามารถจองย้อนหลังได้" });
  if (!isValidPhone(phone)) return res.status(400).json({ error: "เบอร์โทรศัพท์ไม่ถูกต้อง" });

  const bike = db.prepare("SELECT * FROM bikes WHERE id = ?").get(bikeId);
  if (!bike) return res.status(404).json({ error: "ไม่พบรถคันนี้" });

  if (activeBikeIds(start, end).has(bikeId)) {
    return res.status(409).json({ error: "รถคันนี้ถูกจองในช่วงเวลานี้แล้ว" });
  }

  const renterName = `${req.user.first_name} ${req.user.last_name}`.trim() || req.user.email;
  const total = days * bike.price;

  const result = db.prepare(`
    INSERT INTO bookings (user_id, bike_id, renter_name, phone, start_date, end_date, total, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
  `).run(req.user.id, bikeId, renterName, phone, start, end, total);

  res.status(201).json({ booking: bookingOut(getBooking(Number(result.lastInsertRowid))) });
});

router.patch("/:id/status", authRequired, (req, res) => {
  const id = Number(req.params.id);
  const booking = getBooking(id);
  if (!booking) return res.status(404).json({ error: "ไม่พบรายการจอง" });

  const next = cleanText(req.body.status, 20);
  const isStaff = req.user.role === "staff";
  const isOwner = booking.user_id === req.user.id;

  const transitions = {
    pending: ["active", "cancelled"],
    active: ["done"],
    done: [],
    cancelled: [],
  };

  if (!isStaff && !(isOwner && booking.status === "pending" && next === "cancelled")) {
    return res.status(403).json({ error: "ไม่มีสิทธิ์เปลี่ยนสถานะการจองนี้" });
  }
  if (!(transitions[booking.status] || []).includes(next)) {
    return res.status(400).json({ error: "ไม่สามารถเปลี่ยนสถานะจาก " + booking.status + " เป็น " + next + " ได้" });
  }

  db.prepare("UPDATE bookings SET status = ? WHERE id = ?").run(next, id);
  res.json({ booking: bookingOut(getBooking(id)) });
});

router.delete("/:id", staffOnly, (req, res) => {
  const id = Number(req.params.id);
  const booking = getBooking(id);
  if (!booking) return res.status(404).json({ error: "ไม่พบรายการจอง" });
  if (!["done", "cancelled"].includes(booking.status)) {
    return res.status(409).json({ error: "ลบได้เฉพาะรายการที่เสร็จสิ้นหรือยกเลิกแล้ว" });
  }
  db.prepare("DELETE FROM bookings WHERE id = ?").run(id);
  res.json({ ok: true, id });
});

module.exports = router;
