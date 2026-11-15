function isValidPhone(value) {
  return /^0\d{8,9}$/.test(String(value || "").replace(/[-\s]/g, ""));
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

function isISODate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))) return false;
  const d = new Date(value + "T00:00:00Z");
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

function daysBetween(start, end) {
  const a = Date.parse(start + "T00:00:00Z");
  const b = Date.parse(end + "T00:00:00Z");
  return Math.round((b - a) / 86400000);
}

function todayISO() {
  const d = new Date();
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function cleanText(value, max = 500) {
  return String(value ?? "").trim().slice(0, max);
}

module.exports = { isValidPhone, isValidEmail, isISODate, daysBetween, todayISO, cleanText };
