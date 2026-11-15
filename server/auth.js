const jwt = require("jsonwebtoken");
const { db } = require("./db");

const JWT_SECRET = process.env.JWT_SECRET || "momo-travel-dev-secret-change-me";
const TOKEN_TTL = "7d";

function publicUser(row) {
  if (!row) return null;
  const first = row.first_name || "";
  const last = row.last_name || "";
  const name = `${first} ${last}`.trim() || row.email;
  return {
    id: row.id,
    firstName: first,
    lastName: last,
    name,
    email: row.email,
    role: row.role,
    address: row.address || "",
    phone: row.phone || "",
    idCardImg: row.id_card_img || null,
    createdAt: row.created_at,
  };
}

function signToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, JWT_SECRET, { expiresIn: TOKEN_TTL });
}

function readToken(req) {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) return null;
  try {
    return jwt.verify(header.slice(7), JWT_SECRET);
  } catch {
    return null;
  }
}

// Attaches req.user when a valid bearer token is present (never rejects).
function attachUser(req, _res, next) {
  const payload = readToken(req);
  if (payload) {
    req.user = db.prepare("SELECT * FROM users WHERE id = ?").get(payload.sub) || null;
  }
  next();
}

function authRequired(req, res, next) {
  if (!req.user) return res.status(401).json({ error: "กรุณาเข้าสู่ระบบก่อน" });
  next();
}

function staffOnly(req, res, next) {
  if (!req.user) return res.status(401).json({ error: "กรุณาเข้าสู่ระบบก่อน" });
  if (req.user.role !== "staff") return res.status(403).json({ error: "สำหรับพนักงานเท่านั้น" });
  next();
}

module.exports = { JWT_SECRET, publicUser, signToken, attachUser, authRequired, staffOnly };
