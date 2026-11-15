const express = require("express");
const { db } = require("../db");
const { authRequired, staffOnly } = require("../auth");
const { cleanText } = require("../validate");

const router = express.Router();

function displayName(row) {
  return `${row.first_name || ""} ${row.last_name || ""}`.trim() || row.email || "ลูกค้า #" + row.user_id;
}

// --- Customer: my conversation with staff ---
router.get("/", authRequired, (req, res) => {
  const rows = db.prepare(`
    SELECT m.*, u.first_name, u.last_name, u.role AS sender_role
    FROM messages m JOIN users u ON u.id = m.from_user_id
    WHERE (m.from_user_id = ? AND m.to_user_id IS NULL)
       OR (m.to_user_id = ? AND m.from_user_id <> ?)
    ORDER BY m.id ASC
  `).all(req.user.id, req.user.id, req.user.id);

  // Mark staff replies as read once the customer opens the conversation.
  db.prepare(`
    UPDATE messages SET is_read = 1
    WHERE to_user_id = ? AND from_user_id <> ? AND is_read = 0
  `).run(req.user.id, req.user.id);

  res.json({
    messages: rows.map((m) => ({
      id: m.id,
      from: m.from_user_id,
      fromName: displayName(m),
      role: m.sender_role,
      text: m.text,
      time: m.created_at,
      to: m.to_user_id,
    })),
  });
});

// --- Staff: list of customer threads ---
router.get("/threads", staffOnly, (_req, res) => {
  const customers = db.prepare(`
    SELECT DISTINCT u.id, u.first_name, u.last_name, u.email
    FROM messages m JOIN users u ON u.id = m.from_user_id
    WHERE m.to_user_id IS NULL AND u.role = 'customer'
  `).all();

  const threads = customers.map((c) => {
    const last = db.prepare(`
      SELECT * FROM messages
      WHERE (from_user_id = ? AND to_user_id IS NULL)
         OR (to_user_id = ? AND from_user_id <> ?)
      ORDER BY id DESC LIMIT 1
    `).get(c.id, c.id, c.id);
    const unread = db.prepare(`
      SELECT COUNT(*) AS n FROM messages
      WHERE from_user_id = ? AND to_user_id IS NULL AND is_read = 0
    `).get(c.id).n;
    return {
      userId: c.id,
      name: displayName(c),
      preview: last ? last.text.slice(0, 60) : "",
      lastAt: last ? last.created_at : null,
      unread,
    };
  }).sort((a, b) => String(b.lastAt || "").localeCompare(String(a.lastAt || "")));

  res.json({ threads });
});

router.get("/unread-count", authRequired, (req, res) => {
  let row;
  if (req.user.role === "staff") {
    row = db.prepare(`
      SELECT COUNT(*) AS n FROM messages WHERE to_user_id IS NULL AND is_read = 0
    `).get();
  } else {
    row = db.prepare(`
      SELECT COUNT(*) AS n FROM messages
      WHERE to_user_id = ? AND from_user_id <> ? AND is_read = 0
    `).get(req.user.id, req.user.id);
  }
  res.json({ count: row.n });
});

// --- Staff: one customer thread ---
router.get("/:userId", staffOnly, (req, res) => {
  const userId = Number(req.params.userId);
  const customer = db.prepare("SELECT * FROM users WHERE id = ? AND role = 'customer'").get(userId);
  if (!customer) return res.status(404).json({ error: "ไม่พบลูกค้ารายนี้" });

  const rows = db.prepare(`
    SELECT m.*, u.first_name, u.last_name, u.role AS sender_role
    FROM messages m JOIN users u ON u.id = m.from_user_id
    WHERE (m.from_user_id = ? AND m.to_user_id IS NULL)
       OR (m.to_user_id = ? AND m.from_user_id <> ?)
    ORDER BY m.id ASC
  `).all(userId, userId, userId);

  db.prepare(`
    UPDATE messages SET is_read = 1
    WHERE from_user_id = ? AND to_user_id IS NULL AND is_read = 0
  `).run(userId);

  res.json({
    customer: {
      id: customer.id,
      name: displayName(customer),
      email: customer.email,
      phone: customer.phone,
    },
    messages: rows.map((m) => ({
      id: m.id,
      from: m.from_user_id,
      fromName: displayName(m),
      role: m.sender_role,
      text: m.text,
      time: m.created_at,
      to: m.to_user_id,
    })),
  });
});

router.post("/", authRequired, (req, res) => {
  const text = cleanText(req.body.text, 1000);
  if (!text) return res.status(400).json({ error: "กรุณาพิมพ์ข้อความ" });

  let toUserId = null;
  if (req.user.role === "staff") {
    toUserId = Number(req.body.toUserId);
    const customer = db.prepare("SELECT id FROM users WHERE id = ? AND role = 'customer'").get(toUserId);
    if (!customer) return res.status(400).json({ error: "กรุณาเลือกลูกค้าที่จะตอบ" });
  }

  const result = db.prepare(`
    INSERT INTO messages (from_user_id, to_user_id, text) VALUES (?, ?, ?)
  `).run(req.user.id, toUserId, text);

  const row = db.prepare(`
    SELECT m.*, u.first_name, u.last_name, u.role AS sender_role
    FROM messages m JOIN users u ON u.id = m.from_user_id WHERE m.id = ?
  `).get(Number(result.lastInsertRowid));

  res.status(201).json({
    message: {
      id: row.id,
      from: row.from_user_id,
      fromName: displayName(row),
      role: row.sender_role,
      text: row.text,
      time: row.created_at,
      to: row.to_user_id,
    },
  });
});

module.exports = router;
