const { DatabaseSync } = require("node:sqlite");
const fs = require("node:fs");
const path = require("node:path");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const seedBikes = require("./bikes");
const demoRevenue = require("./demoRevenue");

const dbFile = path.resolve(
  process.cwd(),
  process.env.DB_FILE || (process.env.VERCEL ? "/tmp/momo.db" : "data/momo.db")
);
fs.mkdirSync(path.dirname(dbFile), { recursive: true });

const db = new DatabaseSync(dbFile);
db.exec("PRAGMA journal_mode = WAL;");
db.exec("PRAGMA foreign_keys = ON;");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name    TEXT NOT NULL DEFAULT '',
    last_name     TEXT NOT NULL DEFAULT '',
    email         TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    role          TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'staff')),
    address       TEXT NOT NULL DEFAULT '',
    phone         TEXT NOT NULL DEFAULT '',
    id_card_img   TEXT,
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS bikes (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL,
    type       TEXT NOT NULL,
    price      INTEGER NOT NULL CHECK (price >= 0),
    img        TEXT NOT NULL DEFAULT '',
    specs      TEXT NOT NULL DEFAULT '[]',
    cc         TEXT NOT NULL DEFAULT '',
    fuel       TEXT NOT NULL DEFAULT '',
    mpg        TEXT NOT NULL DEFAULT '',
    top_speed  TEXT NOT NULL DEFAULT '',
    seat       TEXT NOT NULL DEFAULT '',
    weight     TEXT NOT NULL DEFAULT '',
    starter    TEXT NOT NULL DEFAULT '',
    brake      TEXT NOT NULL DEFAULT '',
    color      TEXT NOT NULL DEFAULT '',
    features   TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS bookings (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    bike_id     INTEGER NOT NULL REFERENCES bikes(id) ON DELETE RESTRICT,
    renter_name TEXT NOT NULL,
    phone       TEXT NOT NULL,
    start_date  TEXT NOT NULL,
    end_date    TEXT NOT NULL,
    total       INTEGER NOT NULL DEFAULT 0,
    status      TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'active', 'done', 'cancelled')),
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS messages (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    from_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    to_user_id   INTEGER REFERENCES users(id) ON DELETE CASCADE,
    text         TEXT NOT NULL,
    is_read      INTEGER NOT NULL DEFAULT 0,
    created_at   TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS demo_revenue (
    year   INTEGER NOT NULL,
    month  INTEGER NOT NULL,
    amount INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (year, month)
  );

  CREATE INDEX IF NOT EXISTS idx_bookings_bike   ON bookings (bike_id, status);
  CREATE INDEX IF NOT EXISTS idx_bookings_user   ON bookings (user_id);
  CREATE INDEX IF NOT EXISTS idx_messages_from   ON messages (from_user_id);
  CREATE INDEX IF NOT EXISTS idx_messages_to     ON messages (to_user_id);
`);

function dateStr(offsetDays = 0) {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

function seed() {
  const userCount = db.prepare("SELECT COUNT(*) AS n FROM users").get().n;
  if (userCount === 0) {
    const insertUser = db.prepare(`
      INSERT INTO users (first_name, last_name, email, password_hash, role, address, phone)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    insertUser.run(
      "สมชาย", "ใจดี", "customer@test.com", bcrypt.hashSync("1234", 10), "customer",
      "123 ถ.สุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพฯ 10110", "081-234-5678"
    );
    insertUser.run(
      "พนักงาน", "Momo", "staff@momo.com", bcrypt.hashSync("staff123", 10), "staff",
      "MOMO TRAVEL สำนักงานใหญ่ กรุงเทพฯ", "02-123-4567"
    );
    console.log("  ✔ seeded demo accounts");
  }

  const bikeCount = db.prepare("SELECT COUNT(*) AS n FROM bikes").get().n;
  if (bikeCount === 0) {
    const insertBike = db.prepare(`
      INSERT INTO bikes (name, type, price, img, specs, cc, fuel, mpg, top_speed, seat, weight, starter, brake, color, features)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const b of seedBikes) {
      const d = b.detail || {};
      insertBike.run(
        b.name, b.type, b.price, b.img, JSON.stringify(b.specs || []),
        d.cc || "", d.fuel || "", d.mpg || "", d.topSpeed || "", d.seat || "",
        d.weight || "", d.starter || "", d.brake || "", d.color || "",
        JSON.stringify(d.feature || [])
      );
    }
    console.log(`  ✔ seeded ${seedBikes.length} motorcycles`);
  }

  const revenueCount = db.prepare("SELECT COUNT(*) AS n FROM demo_revenue").get().n;
  if (revenueCount === 0) {
    const insertRevenue = db.prepare("INSERT INTO demo_revenue (year, month, amount) VALUES (?, ?, ?)");
    for (const [year, months] of Object.entries(demoRevenue)) {
      months.forEach((amount, i) => insertRevenue.run(Number(year), i + 1, amount));
    }
    console.log("  ✔ seeded historical revenue");
  }

  const bookingCount = db.prepare("SELECT COUNT(*) AS n FROM bookings").get().n;
  if (bookingCount === 0) {
    const customer = db.prepare("SELECT * FROM users WHERE email = ?").get("customer@test.com");
    const activeBike = db.prepare("SELECT * FROM bikes WHERE name = ?").get("Honda Click 160");
    const doneBike = db.prepare("SELECT * FROM bikes WHERE name = ?").get("Honda PCX 160");
    if (customer && activeBike && doneBike) {
      const insertBooking = db.prepare(`
        INSERT INTO bookings (user_id, bike_id, renter_name, phone, start_date, end_date, total, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const renter = `${customer.first_name} ${customer.last_name}`;
      insertBooking.run(
        customer.id, activeBike.id, renter, customer.phone,
        dateStr(-2), dateStr(1), 3 * activeBike.price, "active",
        new Date(Date.now() - 2 * 86400000).toISOString()
      );
      insertBooking.run(
        customer.id, doneBike.id, renter, customer.phone,
        dateStr(-40), dateStr(-37), 4 * doneBike.price, "done",
        new Date(Date.now() - 40 * 86400000).toISOString()
      );
      console.log("  ✔ seeded sample bookings");
    }
  }
}

seed();

module.exports = { db, dbFile };
