const express = require("express");
const multer = require("multer");
const path = require("node:path");
const fs = require("node:fs");
const crypto = require("node:crypto");

const router = express.Router();

// On Vercel the project folder is read-only; set UPLOAD_DIR=/tmp/uploads there.
const uploadsDir = path.resolve(
  process.cwd(),
  process.env.UPLOAD_DIR || (process.env.VERCEL ? "/tmp/uploads" : "public/uploads")
);
fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase().slice(0, 10) || ".jpg";
    cb(null, `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!/^image\/(jpe?g|png|webp|gif)$/i.test(file.mimetype)) {
      return cb(new Error("รองรับเฉพาะไฟล์รูปภาพ JPG, PNG, WEBP หรือ GIF"));
    }
    cb(null, true);
  },
});

// No auth required: this is also used during the registration form.
router.post("/id-card", (req, res, next) => {
  upload.single("idCard")(req, res, (err) => {
    if (err) {
      const message = err.code === "LIMIT_FILE_SIZE"
        ? "ไฟล์มีขนาดใหญ่เกิน 5MB"
        : err.message || "อัพโหลดไม่สำเร็จ";
      return res.status(400).json({ error: message });
    }
    if (!req.file) return res.status(400).json({ error: "กรุณาเลือกไฟล์รูปภาพ" });
    res.status(201).json({ url: "/uploads/" + req.file.filename });
  });
});

module.exports = router;
