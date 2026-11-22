const express = require("express");
const { db } = require("../db");
const { authRequired, staffOnly } = require("../auth");
const { cleanText } = require("../validate");
const asyncHandler = require("../asyncHandler");

const router = express.Router();

function displayName(row) {
  return `${row.first_name || ""} ${row.last_name || ""}`.trim() || row.email || "ลูกค้า #" + row.user_id;
}

function messageOut(m) {
  return {
    id: m.id,
    from: m.from_user_id,
    fromName: displayName(m),
    role: m.sender_role,
    text: m.text,
    time: m.created_at,
    to: m.to_user_id,
  };
}

// --- Customer: my conversation with staff ---
router.get("/", authRequired, asyncHandler(async (req, res) => {
  const rows = await db.prepare(`
    SELECT m.*, u.first_name, u.last_name, u.role AS sender_role
    FROM messages m JOIN users u ON u.id = m.from_user_id
    WHERE (m.from_user_id = ? AND m.to_user_id IS NULL)
       OR (m.to_user_id = ? AND m.from_user_id <> ?)
    ORDER BY m.id ASC
  `).all(req.user.id, req.user.id, req.user.id);

  // Mark staff replies as read once the customer opens the conversation.
  await db.prepare(`
    UPDATE messages SET is_read = 1
    WHERE to_user_id = ? AND from_user_id <> ? AND is_read = 0
  `).run(req.user.id, req.user.id);

  res.json({ messages: rows.map(messageOut) });
}));

// --- Staff: list of customer threads ---
router.get("/threads", staffOnly, asyncHandler(async (_req, res) => {
  const customers = await db.prepare(`
    SELECT DISTINCT u.id, u.first_name, u.last_name, u.email
    FROM messages m JOIN users u ON u.id = m.from_user_id
    WHERE m.to_user_id IS NULL AND u.role = 'customer'
  `).all();

  const threads = await Promise.all(customers.map(async (c) => {
    const last = await db.prepare(`
      SELECT * FROM messages
      WHERE (from_user_id = ? AND to_user_id IS NULL)
         OR (to_user_id = ? AND from_user_id <> ?)
      ORDER BY id DESC LIMIT 1
    `).get(c.id, c.id, c.id);
    const unread = (await db.prepare(`
      SELECT COUNT(*) AS n FROM messages
      WHERE from_user_id = ? AND to_user_id IS NULL AND is_read = 0
    `).get(c.id)).n;
    return {
      userId: c.id,
      name: displayName(c),
      preview: last ? last.text.slice(0, 60) : "",
      lastAt: last ? last.created_at : null,
      unread,
    };
  }));

  threads.sort((a, b) => String(b.lastAt || "").localeCompare(String(a.lastAt || "")));
  res.json({ threads });
}));

router.get("/unread-count", authRequired, asyncHandler(async (req, res) => {
  let row;
  if (req.user.role === "staff") {
    row = await db.prepare(`
      SELECT COUNT(*) AS n FROM messages WHERE to_user_id IS NULL AND is_read = 0
    `).get();
  } else {
    row = await db.prepare(`
      SELECT COUNT(*) AS n FROM messages
      WHERE to_user_id = ? AND from_user_id <> ? AND is_read = 0
    `).get(req.user.id, req.user.id);
  }
  res.json({ count: row.n });
}));

// --- Staff: one customer thread ---
router.get("/:userId", staffOnly, asyncHandler(async (req, res) => {
  const userId = Number(req.params.userId);
  const customer = await db.prepare("SELECT * FROM users WHERE id = ? AND role = 'customer'").get(userId);
  if (!customer) return res.status(404).json({ error: "ไม่พบลูกค้ารายนี้" });

  const rows = await db.prepare(`
    SELECT m.*, u.first_name, u.last_name, u.role AS sender_role
    FROM messages m JOIN users u ON u.id = m.from_user_id
    WHERE (m.from_user_id = ? AND m.to_user_id IS NULL)
       OR (m.to_user_id = ? AND m.from_user_id <> ?)
    ORDER BY m.id ASC
  `).all(userId, userId, userId);

  await db.prepare(`
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
    messages: rows.map(messageOut),
  });
}));

router.post("/", authRequired, asyncHandler(async (req, res) => {
  const text = cleanText(req.body.text, 1000);
  if (!text) return res.status(400).json({ error: "กรุณาพิมพ์ข้อความ" });

  let toUserId = null;
  if (req.user.role === "staff") {
    toUserId = Number(req.body.toUserId);
    const customer = await db.prepare("SELECT id FROM users WHERE id = ? AND role = 'customer'").get(toUserId);
    if (!customer) return res.status(400).json({ error: "กรุณาเลือกลูกค้าที่จะตอบ" });
  }

  const result = await db.prepare(`
    INSERT INTO messages (from_user_id, to_user_id, text) VALUES (?, ?, ?)
  `).run(req.user.id, toUserId, text);

  const row = await db.prepare(`
    SELECT m.*, u.first_name, u.last_name, u.role AS sender_role
    FROM messages m JOIN users u ON u.id = m.from_user_id WHERE m.id = ?
  `).get(Number(result.lastInsertRowid));

  res.status(201).json({ message: messageOut(row) });
}));

module.exports = router;
