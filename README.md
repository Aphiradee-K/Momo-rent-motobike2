# 🏍️ MOMO TRAVEL — Full-Stack Motorcycle Rental

เว็บไซต์เช่ารถมอเตอร์ไซค์ **Full-Stack** (Frontend + Backend + Database) พัฒนาต่อจากโปรเจกต์ต้นแบบ
[`Aphiradee-K/project-rent-motobike`](https://github.com/Aphiradee-K/project-rent-motobike)
ที่เดิมเก็บข้อมูลใน `localStorage` ทั้งหมด — เวอร์ชันนี้ย้ายข้อมูลทั้งหมดไปเก็บในฐานข้อมูลจริง
พร้อมระบบล็อกอินด้วย JWT และ API ฝั่งเซิร์ฟเวอร์

---

## ✨ ฟีเจอร์

### ฝั่งลูกค้า (Customer)
- สมัครสมาชิก / เข้าสู่ระบบ (รหัสผ่านเข้ารหัสด้วย bcrypt)
- ดูแคตตาล็อกมอเตอร์ไซค์ 20 คัน กรองตามประเภท ดูรายละเอียด/สเปก
- จองรถออนไลน์ เลือกวันรับ–คืนรถ ระบบคำนวณราคาและกันการจองทับซ้อน
- ดูรายการจองของตัวเอง + ยกเลิกการจองที่ยังรออนุมัติ
- แก้ไขโปรไฟล์ พร้อมอัปโหลดรูปบัตรประชาชน/พาสปอร์ต
- แชทกับพนักงาน
- การแจ้งเตือนกำหนดคืนรถ (เลยกำหนด / วันนี้ / พรุ่งนี้ / อีก 2 วัน)

### ฝั่งพนักงาน (Staff)
- จัดการการจองทั้งหมด: อนุมัติ (`pending → active`), รับคืนรถ (`active → done`), ยกเลิก, ลบรายการที่จบแล้ว
- สรุปรายได้รายเดือน (กราฟ 12 เดือน) เลือกดูย้อนหลังได้หลายปี
- Dashboard สรุปจำนวนการจอง / รถ / ลูกค้า / รายได้
- เพิ่ม / แก้ไข / ลบรถในแคตตาล็อก
- กล่องข้อความแชทของลูกค้าแต่ละราย + ตอบกลับ

### เทคนิค
- REST API + JWT Authentication + Role-based access (customer / staff)
- PostgreSQL เป็นฐานข้อมูลหลัก (ตั้งค่า `DATABASE_URL`) ข้อมูลถาวรได้แม้รันบน Vercel
- รันในเครื่องโดยไม่ตั้ง `DATABASE_URL` จะใช้ SQLite (`data/momo.db`) แทนได้สบาย ๆ
- อัปโหลดไฟล์ด้วย `multer` เก็บไว้ที่ `public/uploads/`
- Frontend เป็น Vanilla HTML/CSS/JS SPA (ไม่ต้อง build)

---

## 🧰 Tech Stack

| Layer    | Technology |
|----------|------------|
| Frontend | HTML5, CSS3, Vanilla JavaScript (SPA) |
| Backend  | Node.js, Express 4 |
| Database | PostgreSQL (`pg`) — SQLite fallback via `node:sqlite` |
| Auth     | JSON Web Token (`jsonwebtoken`) + `bcryptjs` |
| Upload   | `multer` (JPG/PNG สูงสุด 5 MB) |

> **ต้องใช้ Node.js ≥ 22.5** (สำหรับ SQLite fallback) แนะนำ Node 24.x — ทดสอบบน Node v26

---

## 🚀 วิธีติดตั้งและรัน

```bash
# 1) ติดตั้ง dependencies
npm install

# 2) สร้างไฟล์ .env จากตัวอย่าง แล้วใส่ DATABASE_URL + JWT_SECRET
copy .env.example .env        # Windows
# cp .env.example .env        # macOS / Linux

# 3) รันเซิร์ฟเวอร์
npm start
```

เปิดเบราว์เซอร์ที่ **http://localhost:3000**

ฐานข้อมูลจะถูกสร้าง schema และ seed ข้อมูลตัวอย่างอัตโนมัติเมื่อรันครั้งแรก
(บัญชีทดลอง, รถ 20 คัน, รายได้ย้อนหลังปี 2024–2026, การจองตัวอย่าง 2 รายการ)

ถ้าไม่ใส่ `DATABASE_URL` ระบบจะใช้ SQLite ที่ `data/momo.db` (เหมาะสำหรับลองในเครื่อง)
ถ้าใส่ `DATABASE_URL` ระบบจะใช้ PostgreSQL และเก็บข้อมูลถาวรบน Vercel

### Scripts

| คำสั่ง | คำอธิบาย |
|--------|----------|
| `npm start` | รันเซิร์ฟเวอร์ (port 3000) |
| `npm run dev` | รันพร้อม `--watch` (auto-restart) |
| `npm run seed` | Seed ข้อมูลถ้าฐานข้อมูลว่าง (ไม่ลบข้อมูลเดิม) |
| `npm run reset-db` | **ลบและสร้างฐานข้อมูลใหม่** พร้อม seed ข้อมูลตัวอย่าง |

---

## 🔑 บัญชีทดลอง

| Role | Email | Password |
|------|-------|----------|
| ลูกค้า | `customer@test.com` | `1234` |
| พนักงาน | `staff@momo.com` | `staff123` |

> เมื่อรีเซ็ตฐานข้อมูล ข้อมูลที่ผู้ใช้สร้างระหว่างทดลองจะหายทั้งหมด

---

## ⚙️ Environment Variables (`.env`)

| ตัวแปร | ค่าเริ่มต้น | คำอธิบาย |
|--------|-------------|----------|
| `PORT` | `3000` | พอร์ตของเซิร์ฟเวอร์ |
| `JWT_SECRET` | — | Secret สำหรับเซ็น token (ต้องตั้งใน production) |
| `DATABASE_URL` | — | Connection string ของ PostgreSQL (ใช้บน Vercel) — แนะนำตัวที่เป็น **pooler** |
| `PGPOOL_MAX` | `5` | จำนวน connection สูงสุดต่อ instance |
| `DB_FILE` | `data/momo.db` | ใช้เฉพาะตอนไม่ได้ตั้ง `DATABASE_URL` (SQLite fallback) |

---

## 📁 โครงสร้างโปรเจกต์

```
momomo/
├── server/
│   ├── index.js            # Express app, mount API + static + SPA fallback
│   ├── auth.js             # JWT sign/verify, attachUser, authRequired, staffOnly
│   ├── serializers.js      # แปลง row → JSON ที่ frontend ใช้
│   ├── validate.js         # ตรวจอีเมล/เบอร์โทร/วันที่, helpers
│   ├── asyncHandler.js     # จับ error จาก async route ส่งให้ Express
│   ├── db/
│   │   ├── index.js        # schema + seed + PostgreSQL/SQLite adapter
│   │   ├── bikes.js        # ข้อมูลรถตั้งต้น 20 คัน
│   │   ├── demoRevenue.js  # รายได้ย้อนหลังสำหรับกราฟ
│   │   ├── seed.js         # npm run seed
│   │   └── reset.js        # npm run reset-db
│   └── routes/
│       ├── auth.js         # register / login / me / profile
│       ├── bikes.js        # CRUD รถ
│       ├── bookings.js     # จอง / เปลี่ยนสถานะ / ลบ
│       ├── messages.js     # แชทลูกค้า–พนักงาน
│       ├── notifications.js# แจ้งเตือนกำหนดคืนรถ
│       ├── stats.js        # summary + revenue
│       └── uploads.js      # อัปโหลดรูปบัตรประชาชน
├── public/
│   ├── index.html          # SPA markup
│   ├── style.css           # ดีไซน์ (อ้างอิงจากโปรเจกต์ต้นแบบ)
│   ├── app.js              # logic ทั้งหมด + API client
│   ├── img/                # รูปรถ
│   └── uploads/            # ไฟล์ที่ผู้ใช้อัปโหลด
├── data/momo.db            # SQLite fallback (สร้างอัตโนมัติถ้าไม่ตั้ง DATABASE_URL)
├── .env.example
└── package.json
```

---

## 🔌 API Endpoints

ทุก endpoint อยู่ใต้ `/api` — endpoint ที่ต้องล็อกอินให้ส่ง header:
`Authorization: Bearer <token>`

### Auth
| Method | Path | สิทธิ์ | คำอธิบาย |
|--------|------|--------|----------|
| POST | `/auth/register` | สาธารณะ | สมัครสมาชิก → คืน `token` + `user` |
| POST | `/auth/login` | สาธารณะ | เข้าสู่ระบบ → คืน `token` + `user` |
| GET | `/auth/me` | ล็อกอิน | ข้อมูลผู้ใช้ปัจจุบัน |
| PUT | `/auth/profile` | ล็อกอิน | แก้ไขชื่อ/ที่อยู่/เบอร์/รูปบัตรประชาชน |

### Bikes
| Method | Path | สิทธิ์ | คำอธิบาย |
|--------|------|--------|----------|
| GET | `/bikes` | สาธารณะ | รายการรถทั้งหมด (รองรับ `?type=`) |
| GET | `/bikes/:id` | สาธารณะ | รายละเอียดรถ |
| POST | `/bikes` | พนักงาน | เพิ่มรถ |
| PUT | `/bikes/:id` | พนักงาน | แก้ไขรถ |
| DELETE | `/bikes/:id` | พนักงาน | ลบรถ (ถ้าไม่มีการจองผูกอยู่) |

### Bookings
| Method | Path | สิทธิ์ | คำอธิบาย |
|--------|------|--------|----------|
| GET | `/bookings/mine` | ลูกค้า | การจองของฉัน |
| GET | `/bookings` | พนักงาน | การจองทั้งหมด |
| POST | `/bookings` | ลูกค้า | สร้างการจอง `{ bikeId, start, end, phone }` |
| PATCH | `/bookings/:id/status` | ลูกค้า/พนักงาน | เปลี่ยนสถานะ `{ status }` |
| DELETE | `/bookings/:id` | พนักงาน | ลบเฉพาะ `done` / `cancelled` |

สถานะที่อนุญาต: `pending → active | cancelled`, `active → done`

### Messages (แชท)
| Method | Path | สิทธิ์ | คำอธิบาย |
|--------|------|--------|----------|
| GET | `/messages` | ล็อกอิน | บทสนทนาของตัวเอง (ลูกค้า) |
| GET | `/messages/threads` | พนักงาน | รายการลูกค้าที่มีข้อความ |
| GET | `/messages/unread-count` | ล็อกอิน | จำนวนข้อความที่ยังไม่อ่าน |
| GET | `/messages/:userId` | พนักงาน | บทสนทนาของลูกค้ารายนั้น |
| POST | `/messages` | ล็อกอิน | ส่งข้อความ `{ text, toUserId? }` |

### Notifications & Stats
| Method | Path | สิทธิ์ | คำอธิบาย |
|--------|------|--------|----------|
| GET | `/notifications` | ล็อกอิน | แจ้งเตือนกำหนดคืนรถ |
| GET | `/stats/summary` | พนักงาน | สรุปจำนวนการจอง/รถ/ลูกค้า/รายได้ |
| GET | `/stats/revenue?year=YYYY` | พนักงาน | รายได้รายเดือน + ปีที่เลือกได้ |

### Upload
| Method | Path | สิทธิ์ | คำอธิบาย |
|--------|------|--------|----------|
| POST | `/uploads/id-card` | ล็อกอิน | อัปโหลดรูป (field: `image`) → คืน `{ url }` |

### Health
| Method | Path | คำอธิบาย |
|--------|------|----------|
| GET | `/health` | ตรวจว่า API ทำงานอยู่ |

---

## 🗄️ หมายเหตุด้านฐานข้อมูล

- ถ้าตั้ง `DATABASE_URL` → ใช้ PostgreSQL ตารางถูกสร้างอัตโนมัติ พร้อม seed แบบมี advisory lock ไม่ให้หลาย instance seed พร้อมกัน
- ถ้าไม่ตั้ง → ใช้ไฟล์ `data/momo.db` (เปิด `WAL` mode)
- ตาราง: `users`, `bikes`, `bookings`, `messages`, `demo_revenue`
- `demo_revenue` เก็บรายได้ย้อนหลังเพื่อให้กราฟดูสมจริง ส่วนรายได้จากการจองจริงจะถูกบวกเพิ่มตามเดือนของ `start_date`
- การลบรถจะถูกบล็อกหากยังมี booking อ้างอิงอยู่ (`ON DELETE RESTRICT`)

---

## ☁️ Deploy

### GitHub
```bash
git add -A
git commit -m "MOMO TRAVEL full-stack"
git push origin master
```

### Vercel + PostgreSQL (แนะนำ)

โปรเจกต์นี้มีไฟล์พร้อม deploy แล้ว:
- `api/index.js` — entry point สำหรับ Vercel Serverless Function
- `vercel.json` — rewrite ทุก request เข้า Express + ตั้ง `UPLOAD_DIR=/tmp/uploads`
- `server/index.js` จะ `listen` เฉพาะตอนรัน `npm start` (ไม่ listen บน Vercel)

**1) สร้างฐานข้อมูล Neon (ฟรี)**
1. ไปที่ [neon.tech](https://neon.tech) → Sign up ด้วย GitHub
2. Create project → ตั้งชื่อ เช่น `momo-travel` → เลือก Region ที่ใกล้ผู้ใช้ (เช่น Singapore ถ้ามี)
3. ในหน้า Project → **Connection strings** → เลือก branch `main`, database `neondb`, role `neon_owner`
4. เปิด **Pooled connection** แล้วCopy connection string จะได้หน้าตาแบบนี้:
   ```
   postgresql://neondb_owner:xxxx@ep-xxx-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
   ```

**2) ตั้ง Environment Variable ใน Vercel**

เข้า Project → **Settings → Environment Variables** เพิ่ม:

| ตัวแปร | ค่า | หมายเหตุ |
|--------|-----|----------|
| `DATABASE_URL` | connection string จาก Neon | เลือกให้ครบ Production / Preview / Development |
| `JWT_SECRET` | สุ่มสตริงยาว ๆ | จำเป็น — เปลี่ยนจากค่าตั้งต้น |

สร้าง random secret ได้ด้วย: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

**3) Deploy ใหม่**

```bash
git add -A
git commit -m "Use PostgreSQL for persistent storage"
git push origin master
```

หรือ `vercel --prod` ถ้าใช้ CLI อยู่ หลัง deploy ให้ลองสมัครสมาชิกแล้ว refresh หรือเปิดอีก browser — ข้อมูลจะยังอยู่ครับ

> ตรวจสอบได้ที่ `https://<your-app>.vercel.app/api/health` ควรเห็น `"storage": "postgres"`

> **ข้อจำกัดที่เหลือ:** รูปบัตรประชาชนยังอัปโหลดลง `/tmp/uploads` ( ephemeral ) ของ Vercel
> ข้อมูลในตาราง `users` ถาวรแล้ว แต่ไฟล์รูปอาจหายตอน instance ใหม่ ถ้าต้องการให้รูปถาวรต้องใช้ Vercel Blob / S3 เพิ่มเติม

## 📝 Credit

ดีไซน์และเนื้อหาภาษาไทยต้นฉบับจาก
[project-rent-motobike](https://github.com/Aphiradee-K/project-rent-motobike)
— เวอร์ชันนี้ปรับเป็นสถาปัตยกรรม Full-Stack เพื่อการศึกษา/สาธิต
