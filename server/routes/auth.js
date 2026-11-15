const express = require("express");
const bcrypt = require("bcryptjs");
const { db } = require("../db");
const { publicUser, signToken, authRequired } = require("../auth");
const { isValidEmail, isValidPhone, cleanText } = require("../validate");

const router = express.Router();

router.post("/register", (req, res) => {
  const firstName = cleanText(req.body.firstName, 80);
  const lastName = cleanText(req.body.lastName, 80);
  const email = cleanText(req.body.email, 160).toLowerCase();
  const password = String(req.body.password || "");
  const address = cleanText(req.body.address, 300);
  const phone = cleanText(req.body.phone, 30);
  const idCardImg = cleanText(req.body.idCardImg, 500) || null;

  if (!firstName || !lastName) return res.status(400).json({ error: "กรุณากรอกชื่อและนามสกุล" });
  if (!isValidEmail(email)) return res.status(400).json({ error: "อีเมลไม่ถูกต้อง" });
  if (password.length < 4) return res.status(400).json({ error: "รหัสผ่านต้องมีอย่างน้อย 4 ตัวอักษร" });
  if (!address) return res.status(400).json({ error: "กรุณากรอกที่อยู่" });
  if (!isValidPhone(phone)) return res.status(400).json({ error: "เบอร์โทรศัพท์ไม่ถูกต้อง" });

  const exists = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
  if (exists) return res.status(409).json({ error: "อีเมลนี้ถูกใช้แล้ว" });

  const result = db.prepare(`
    INSERT INTO users (first_name, last_name, email, password_hash, role, address, phone, id_card_img)
    VALUES (?, ?, ?, ?, 'customer', ?, ?, ?)
  `).run(firstName, lastName, email, bcrypt.hashSync(password, 10), address, phone, idCardImg);

  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(Number(result.lastInsertRowid));
  res.status(201).json({ token: signToken(user), user: publicUser(user) });
});

router.post("/login", (req, res) => {
  const email = cleanText(req.body.email, 160).toLowerCase();
  const password = String(req.body.password || "");
  if (!email || !password) return res.status(400).json({ error: "กรุณากรอกอีเมลและรหัสผ่าน" });

  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" });
  }
  res.json({ token: signToken(user), user: publicUser(user) });
});

router.get("/me", authRequired, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

router.put("/profile", authRequired, (req, res) => {
  const firstName = cleanText(req.body.firstName, 80);
  const lastName = cleanText(req.body.lastName, 80);
  const address = cleanText(req.body.address, 300);
  const phone = cleanText(req.body.phone, 30);
  const idCardImg = req.body.idCardImg === undefined
    ? (req.user.id_card_img || null)
    : (cleanText(req.body.idCardImg, 500) || null);

  if (!firstName || !lastName) return res.status(400).json({ error: "กรุณากรอกชื่อและนามสกุล" });
  if (!isValidPhone(phone)) return res.status(400).json({ error: "เบอร์โทรศัพท์ไม่ถูกต้อง" });

  db.prepare(`
    UPDATE users
    SET first_name = ?, last_name = ?, address = ?, phone = ?, id_card_img = ?
    WHERE id = ?
  `).run(firstName, lastName, address, phone, idCardImg, req.user.id);

  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user.id);
  res.json({ user: publicUser(user) });
});

module.exports = router;
