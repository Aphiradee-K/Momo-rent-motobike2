/* ============================================================
   MOMO TRAVEL — frontend (talks to the Express + SQLite API)
   ============================================================ */

const TOKEN_KEY = "momo_token";

let token = localStorage.getItem(TOKEN_KEY) || "";
let currentUser = null;

let bikes = [];
let bookings = [];
let statsSummary = null;
let notifications = [];
let chatMessages = [];
let chatThreads = [];
let currentChatUser = null;

let currentBike = null;
let editingBikeId = null;

let revMode = "month";
let revData = null;

let pendingRegFile = null;
let pendingProfileFile = null;
let profileIdCardCleared = false;

let pollTimer = null;
let requestCount = 0;

const TYPE_LABEL = {
  family: "ครอบครัว", scooter: "สกู๊ตเตอร์", sport: "สปอร์ต",
  premium: "พรีเมี่ยม", classic: "คลาสสิก", adventure: "แอดแวนเจอร์",
};
const STATUS_LABEL = { pending: "รอรับรถ", active: "กำลังเช่า", done: "เสร็จสิ้น", cancelled: "ยกเลิก" };
const MONTHS = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

/* ---------------- tiny helpers ---------------- */
const $ = (id) => document.getElementById(id);
const isStaff = () => !!currentUser && currentUser.role === "staff";

function escHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function escAttr(value) {
  return escHtml(value).replace(/`/g, "&#96;");
}
function money(value) {
  return "฿" + Number(value || 0).toLocaleString("th-TH");
}
function parseDateOnly(value) {
  return new Date(String(value) + "T00:00:00");
}
function fmtDate(value) {
  if (!value) return "-";
  return parseDateOnly(value).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
}
function parseServerTime(value) {
  if (!value) return new Date();
  // SQLite stores UTC as "YYYY-MM-DD HH:MM:SS"
  const iso = String(value).includes("T") ? String(value) : String(value).replace(" ", "T") + "Z";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}
function timeOnly(value) {
  return parseServerTime(value).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
}
function days(start, end) {
  if (!start || !end) return 0;
  const d = Math.ceil((parseDateOnly(end) - parseDateOnly(start)) / 86400000);
  return d > 0 ? d : 0;
}
function todayISO() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}
function addDaysISO(dateStr, daysToAdd) {
  const d = parseDateOnly(dateStr);
  d.setDate(d.getDate() + daysToAdd);
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}
function typeName(t) { return TYPE_LABEL[t] || t; }
function statusName(s) { return STATUS_LABEL[s] || s; }
function statusBadge(s) { return `<span class="badge ${escAttr(s)}">${escHtml(statusName(s))}</span>`; }
function initials(user) {
  const a = (user.firstName || user.name || "").trim();
  const b = (user.lastName || "").trim();
  return ((a[0] || "") + (b[0] || "")).toUpperCase() || "👤";
}

/* ---------------- HTTP client ---------------- */
function showProgress() {
  requestCount += 1;
  const bar = $("topProgress");
  if (bar) {
    bar.classList.add("show");
    bar.style.width = "65%";
  }
}
function hideProgress() {
  requestCount = Math.max(0, requestCount - 1);
  if (requestCount > 0) return;
  const bar = $("topProgress");
  if (!bar) return;
  bar.style.width = "100%";
  setTimeout(() => {
    bar.classList.remove("show");
    bar.style.width = "0";
  }, 280);
}

async function api(path, options = {}) {
  const { method = "GET", body, raw } = options;
  const headers = {};
  if (token) headers.Authorization = "Bearer " + token;

  let payload;
  if (raw !== undefined) {
    payload = raw;
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  showProgress();
  try {
    const res = await fetch("/api" + path, { method, headers, body: payload });
    let data = null;
    const text = await res.text();
    if (text) {
      try { data = JSON.parse(text); } catch { data = { error: text }; }
    }
    if (!res.ok) {
      if (res.status === 401 && token && !path.startsWith("/auth/login")) {
        clearSession();
        throw new Error("เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่");
      }
      throw new Error((data && data.error) || "เกิดข้อผิดพลาด กรุณาลองใหม่");
    }
    return data || {};
  } catch (err) {
    if (err instanceof TypeError) throw new Error("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาตรวจสอบว่าเซิร์ฟเวอร์ทำงานอยู่");
    throw err;
  } finally {
    hideProgress();
  }
}

async function uploadIdCard(file) {
  const form = new FormData();
  form.append("idCard", file);
  const data = await api("/uploads/id-card", { method: "POST", raw: form });
  return data.url;
}

/* ---------------- toast ---------------- */
let toastTimer;
function toast(message) {
  const el = $("toast");
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2800);
}

/* ---------------- session ---------------- */
function setSession(data) {
  token = data.token;
  currentUser = data.user;
  localStorage.setItem(TOKEN_KEY, token);
}

function clearSession() {
  token = "";
  currentUser = null;
  bookings = [];
  bikes = [];
  chatMessages = [];
  chatThreads = [];
  currentChatUser = null;
  statsSummary = null;
  revData = null;
  localStorage.removeItem(TOKEN_KEY);
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
  $("appView").style.display = "none";
  $("authView").style.display = "flex";
  $("liPass").value = "";
}

function doLogout() {
  clearSession();
  toast("👋 ออกจากระบบแล้ว");
}

/* ---------------- auth ---------------- */
function switchAuth(tab) {
  $("tabLogin").classList.toggle("active", tab === "login");
  $("tabReg").classList.toggle("active", tab === "register");
  $("formLogin").style.display = tab === "login" ? "" : "none";
  $("formReg").style.display = tab === "register" ? "" : "none";
  $("loginError").textContent = "";
  $("regError").textContent = "";
}

async function doLogin(event) {
  event.preventDefault();
  const email = $("liEmail").value.trim().toLowerCase();
  const password = $("liPass").value;
  const err = $("loginError");
  const btn = $("loginBtn");
  err.textContent = "";

  btn.disabled = true;
  btn.textContent = "กำลังเข้าสู่ระบบ...";
  try {
    const data = await api("/auth/login", { method: "POST", body: { email, password } });
    setSession(data);
    await enterApp();
  } catch (ex) {
    err.textContent = "❌ " + ex.message;
  } finally {
    btn.disabled = false;
    btn.textContent = "เข้าสู่ระบบ →";
  }
}

async function doRegister(event) {
  event.preventDefault();
  const firstName = $("rgFirstName").value.trim();
  const lastName = $("rgLastName").value.trim();
  const email = $("rgEmail").value.trim().toLowerCase();
  const password = $("rgPass").value;
  const address = $("rgAddress").value.trim();
  const phone = $("rgPhone").value.trim();
  const err = $("regError");
  const btn = $("registerBtn");
  err.textContent = "";

  if (!/^0\d{8,9}$/.test(phone.replace(/[-\s]/g, ""))) {
    err.textContent = "❌ เบอร์โทรศัพท์ไม่ถูกต้อง";
    return;
  }

  btn.disabled = true;
  btn.textContent = "กำลังสมัครสมาชิก...";
  try {
    let idCardImg = null;
    if (pendingRegFile) idCardImg = await uploadIdCard(pendingRegFile);

    const data = await api("/auth/register", {
      method: "POST",
      body: { firstName, lastName, email, password, address, phone, idCardImg },
    });
    setSession(data);
    pendingRegFile = null;
    await enterApp();
    toast("🎉 สมัครสมาชิกสำเร็จ ยินดีต้อนรับ!");
  } catch (ex) {
    err.textContent = "❌ " + ex.message;
  } finally {
    btn.disabled = false;
    btn.textContent = "สมัครสมาชิก 🎉";
  }
}

/* ---------------- app shell ---------------- */
async function enterApp() {
  if (!currentUser) return;
  $("authView").style.display = "none";
  $("appView").style.display = "";

  $("userName").textContent = "👤 " + currentUser.name;
  const tag = $("roleTag");
  tag.textContent = isStaff() ? "พนักงาน" : "ลูกค้า";
  tag.classList.toggle("staff", isStaff());

  $("heroName").textContent = currentUser.firstName || currentUser.name.split(" ")[0];
  $("heroDesc").textContent = isStaff()
    ? "โหมดพนักงาน — ตรวจสอบ เปลี่ยนสถานะ และจัดการการจองทั้งหมดได้ที่แท็บจัดการการจอง"
    : "มอเตอร์ไซค์คุณภาพดี พร้อมหมวกกันน็อกฟรี จองออนไลน์ รับรถได้ทันทีที่สาขาใกล้คุณ";

  applyNav();
  setDefaultDates();

  try {
    await refreshData();
  } catch (ex) {
    toast("⚠️ " + ex.message);
    if (!currentUser) return;
  }

  showSection(isStaff() ? "manage" : "bikes");
  await updateBadges();
  startPolling();
}

function applyNav() {
  const staff = isStaff();
  const show = (id, visible) => { $(id).style.display = visible ? "" : "none"; };
  show("navBikes", !staff);
  show("navMyBookings", !staff);
  show("navProfile", !staff);
  show("navChat", !staff);
  show("navNotifications", !staff);
  show("navManage", staff);
  show("navRevenue", staff);
  show("navStaffBikes", staff);
  show("navStaffChat", staff);
}

function toggleNav() {
  $("mainNav").classList.toggle("open");
}

function closeNav() {
  $("mainNav").classList.remove("open");
}

function setDefaultDates() {
  const start = $("startDate");
  const end = $("endDate");
  if (!start.value) start.value = todayISO();
  if (!end.value) end.value = addDaysISO(start.value, 2);
  start.min = todayISO();
  end.min = start.value;
}

function showSection(name) {
  const sections = [
    "secBikes", "secBookings", "secProfile", "secChat", "secStaffChat",
    "secNotifications", "secManage", "secRevenue", "secStaffBikes",
  ];
  for (const id of sections) $(id).style.display = "none";
  $("searchCard").style.display = "none";
  closeNav();

  if (isStaff()) {
    if (name === "revenue") {
      $("secRevenue").style.display = "";
      loadRevenue().catch((e) => toast("⚠️ " + e.message));
    } else if (name === "staffBikes") {
      $("secStaffBikes").style.display = "";
      loadBikes().then(renderStaffBikes).catch((e) => toast("⚠️ " + e.message));
    } else if (name === "staffChat") {
      $("secStaffChat").style.display = "";
      loadThreads().catch((e) => toast("⚠️ " + e.message));
    } else {
      $("secManage").style.display = "";
      loadManage().catch((e) => toast("⚠️ " + e.message));
    }
    const staffTarget = name === "revenue" ? "secRevenue"
      : name === "staffBikes" ? "secStaffBikes"
      : name === "staffChat" ? "secStaffChat" : "secManage";
    $(staffTarget).scrollIntoView({ behavior: "smooth" });
    return;
  }

  if (name === "bookings") {
    $("secBookings").style.display = "";
    loadBookings().then(renderMyBookings).catch((e) => toast("⚠️ " + e.message));
  } else if (name === "profile") {
    $("secProfile").style.display = "";
    renderProfile();
  } else if (name === "chat") {
    $("secChat").style.display = "";
    loadChat().catch((e) => toast("⚠️ " + e.message));
  } else if (name === "notifications") {
    $("secNotifications").style.display = "";
    loadNotifications().catch((e) => toast("⚠️ " + e.message));
  } else {
    $("secBikes").style.display = "";
    $("searchCard").style.display = "";
    loadBikes().catch((e) => toast("⚠️ " + e.message));
  }
  const target = name === "bookings" ? "secBookings"
    : name === "profile" ? "secProfile"
    : name === "chat" ? "secChat"
    : name === "notifications" ? "secNotifications" : "secBikes";
  $(target).scrollIntoView({ behavior: "smooth" });
}

/* ---------------- data loaders ---------------- */
function dateQuery() {
  const start = $("startDate").value;
  const end = $("endDate").value;
  return start && end ? `?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}` : "";
}

async function loadBikes(render = true) {
  const type = $("filterType").value || "all";
  const qs = new URLSearchParams();
  if (type !== "all") qs.set("type", type);
  const start = $("startDate").value;
  const end = $("endDate").value;
  if (start && end) { qs.set("start", start); qs.set("end", end); }
  const data = await api("/bikes" + (qs.toString() ? "?" + qs.toString() : ""));
  bikes = data.bikes || [];
  if (render) {
    renderBikeGrid();
    if (isStaff()) renderStaffBikes();
  }
}

async function loadBookings(render = true) {
  const data = await api(isStaff() ? "/bookings" : "/bookings/mine");
  bookings = data.bookings || [];
  if (render) {
    renderMyBookings();
    renderManage();
  }
}

async function loadManage() {
  const [bookingData, summaryData] = await Promise.all([
    api("/bookings"),
    api("/stats/summary"),
  ]);
  bookings = bookingData.bookings || [];
  statsSummary = summaryData.summary || null;
  renderManage();
}

async function refreshData() {
  const tasks = [loadBikes(false), loadBookings(false)];
  if (isStaff()) tasks.push(api("/stats/summary").then((d) => { statsSummary = d.summary; }));
  await Promise.all(tasks);
  renderBikeGrid();
  renderMyBookings();
  renderManage();
  if (isStaff()) renderStaffBikes();
}

async function loadNotifications() {
  const data = await api("/notifications");
  notifications = data.notifications || [];
  renderNotifications();
  setBadge($("notifyBadge"), data.count || 0);
}

function setBadge(el, count) {
  if (!el) return;
  if (count > 0) {
    el.style.display = "";
    el.textContent = count;
  } else {
    el.style.display = "none";
  }
}

async function updateBadges() {
  if (!currentUser) return;
  try {
    const [notif, unread] = await Promise.all([
      api("/notifications"),
      api("/messages/unread-count"),
    ]);
    notifications = notif.notifications || [];
    setBadge($("notifyBadge"), notif.count || 0);
    setBadge(isStaff() ? $("chatBadgeStaff") : $("chatBadge"), unread.count || 0);
    if ($("secNotifications").style.display !== "none") renderNotifications();
  } catch {
    /* silent — the user may be logged out */
  }
}

function startPolling() {
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = setInterval(async () => {
    if (!currentUser) return;
    await updateBadges();
    if (isStaff() && $("secStaffChat").style.display !== "none") {
      loadThreads(true).catch(() => {});
      if (currentChatUser) loadThreadMessages(currentChatUser, true).catch(() => {});
    } else if (!isStaff() && $("secChat").style.display !== "none") {
      loadChat(true).catch(() => {});
    }
  }, 8000);
}

/* ---------------- bikes grid ---------------- */
function renderBikeGrid() {
  const grid = $("bikeGrid");
  if (!grid) return;
  if (!bikes.length) {
    grid.innerHTML = `<div class="empty">ไม่พบรถในหมวดนี้ — ลองเปลี่ยนประเภทรถหรือช่วงวันที่</div>`;
    return;
  }

  grid.innerHTML = bikes.map((b) => {
    const busy = !!b.busy;
    const img = b.img
      ? `<img src="${escAttr(b.img)}" alt="${escAttr(b.name)}" class="bike-thumb-img" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
         <div class="bike-thumb-fallback" style="display:none">🏍️</div>`
      : `<div class="bike-thumb-fallback" style="display:flex">🏍️</div>`;
    const action = isStaff()
      ? `<span class="status ok" style="font-size:.75rem">ให้บริการ</span>`
      : `<button type="button" class="rent-btn" onclick="openModal(${b.id})" ${busy ? "disabled" : ""}>จองเลย</button>`;
    return `
      <div class="card">
        <div class="thumb" style="background:#eef5fb">
          ${img}
          <span class="badge-type">${escHtml(typeName(b.type))}</span>
        </div>
        <div class="card-body">
          <h3>${escHtml(b.name)}</h3>
          <div class="specs">${(b.specs || []).map((s) => `<span class="spec">${escHtml(s)}</span>`).join("")}</div>
          <div class="card-foot">
            <div>
              <div class="price">${money(b.price)} <small>/วัน</small></div>
              <div class="status ${busy ? "busy" : "ok"}">${busy ? "● ถูกจองในช่วงนี้" : "● ว่าง"}</div>
            </div>
            <div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end">
              <button type="button" class="detail-btn" onclick="openDetail(${b.id})">รายละเอียด</button>
              ${action}
            </div>
          </div>
        </div>
      </div>`;
  }).join("");
}

/* ---------------- search ---------------- */
function updateAll() {
  const start = $("startDate").value;
  const endEl = $("endDate");
  endEl.min = start;
  if (endEl.value <= start) endEl.value = addDaysISO(start, 1);
  loadBikes().catch((e) => toast("⚠️ " + e.message));
}

/* ---------------- booking modal ---------------- */
function openModal(id) {
  currentBike = bikes.find((b) => b.id === id);
  if (!currentBike) return;
  $("mTitle").textContent = currentBike.name;
  $("mSub").innerHTML =
    `<img src="${escAttr(currentBike.img)}" alt="" style="width:100%;max-height:160px;object-fit:cover;border-radius:10px;margin-bottom:12px" onerror="this.style.display='none'">` +
    `${escHtml(typeName(currentBike.type))} • ${money(currentBike.price)}/วัน • ${(currentBike.specs || []).map(escHtml).join(" • ")}`;
  $("mStart").value = $("startDate").value;
  $("mEnd").value = $("endDate").value;
  $("mStart").min = todayISO();
  $("mEnd").min = $("mStart").value;
  $("mPhone").value = currentUser.phone || "";
  calc();
  $("overlay").classList.add("show");
}

function closeModal() {
  $("overlay").classList.remove("show");
}

function calc() {
  const start = $("mStart").value;
  const end = $("mEnd").value;
  const endEl = $("mEnd");
  endEl.min = start;
  const d = days(start, end);
  $("mDays").textContent = d;
  $("mTotal").textContent = money(currentBike ? d * currentBike.price : 0);
}

async function confirmBooking() {
  if (!currentBike) return;
  const start = $("mStart").value;
  const end = $("mEnd").value;
  const phone = $("mPhone").value.trim();
  const d = days(start, end);

  if (!d) return toast("⚠️ กรุณาเลือกวันที่ให้ถูกต้อง");
  if (!/^0\d{8,9}$/.test(phone.replace(/[-\s]/g, ""))) return toast("⚠️ เบอร์โทรไม่ถูกต้อง");

  const btn = $("confirmBookingBtn");
  btn.disabled = true;
  btn.textContent = "กำลังจอง...";
  try {
    await api("/bookings", {
      method: "POST",
      body: { bikeId: currentBike.id, start, end, phone },
    });
    closeModal();
    toast(`✅ จอง ${currentBike.name} สำเร็จ! รอพนักงานยืนยันรับรถ`);
    await refreshData();
    await updateBadges();
  } catch (ex) {
    toast("⚠️ " + ex.message);
  } finally {
    btn.disabled = false;
    btn.textContent = "ยืนยันการจอง ✅";
  }
}

/* ---------------- bike detail ---------------- */
function openDetail(id) {
  const b = bikes.find((x) => x.id === id);
  if (!b) return;
  const d = b.detail || {};
  const busy = !!b.busy;

  $("detailImg").src = b.img || "";
  $("detailImg").alt = b.name;
  $("detailTypeBadge").textContent = typeName(b.type);
  $("detailName").textContent = b.name;
  $("detailPrice").innerHTML = `${money(b.price)} <small>/วัน</small>`;

  $("detailSpecs").innerHTML = (b.specs || []).map((x) => `<span class="spec">${escHtml(x)}</span>`).join("");

  const cells = [
    ["⚙️", "เครื่องยนต์", d.cc], ["⛽", "เชื้อเพลิง", d.fuel], ["🛣️", "ประหยัด", d.mpg],
    ["💨", "ความเร็วสูงสุด", d.topSpeed], ["🪑", "ความสูงเบาะ", d.seat], ["⚖️", "น้ำหนัก", d.weight],
    ["🔑", "สตาร์ท", d.starter], ["🛑", "เบรก", d.brake], ["🎨", "สีที่มี", d.color],
  ];
  $("detailGrid").innerHTML = cells.map(([icon, label, value]) => `
    <div class="dg-item">
      <div class="dg-icon">${icon}</div>
      <div class="dg-label">${escHtml(label)}</div>
      <div class="dg-val">${escHtml(value || "-")}</div>
    </div>`).join("");

  const features = d.feature || [];
  $("detailFeatures").innerHTML = features.length
    ? `<h4>✨ ฟีเจอร์เด่น</h4><div class="feature-list">${features.map((f) => `<span class="feature-tag">${escHtml(f)}</span>`).join("")}</div>`
    : "";

  $("detailAvailability").innerHTML = `<div style="margin-bottom:14px">${
    busy
      ? `<span class="badge busy" style="font-size:.85rem;padding:8px 16px">● ถูกจองในช่วงวันที่เลือก</span>`
      : `<span class="badge done" style="font-size:.85rem;padding:8px 16px">● ว่าง — พร้อมให้เช่า</span>`
  }</div>`;

  let actions = `<button type="button" class="btn btn-ghost" onclick="closeDetail()">ปิด</button>`;
  if (!isStaff() && !busy) {
    actions += `<button type="button" class="btn btn-primary" onclick="closeDetail();openModal(${b.id})">จองรถคันนี้ ✅</button>`;
  }
  $("detailActions").innerHTML = actions;

  $("detailOverlay").classList.add("show");
}

function closeDetail() {
  $("detailOverlay").classList.remove("show");
}

/* ---------------- my bookings ---------------- */
function dueAlertFor(b) {
  if (b.status !== "active" && b.status !== "pending") return "";
  const today = parseDateOnly(todayISO());
  const endDate = parseDateOnly(b.end);
  const diff = Math.ceil((endDate - today) / 86400000);
  if (diff < 0) return `<div class="due-alert overdue">🚨 เลยกำหนดคืนรถ ${Math.abs(diff)} วัน!</div>`;
  if (diff === 0) return `<div class="due-alert due-today">⏰ คืนรถวันนี้!</div>`;
  if (diff <= 2) return `<div class="due-alert due-soon">📅 อีก ${diff} วันครบกำหนดคืนรถ</div>`;
  return "";
}

function renderMyBookings() {
  const list = $("bookingList");
  if (!list || isStaff()) return;

  if (!bookings.length) {
    list.innerHTML = `<div class="empty">ยังไม่มีการจอง — เลือกรถด้านบนเพื่อเริ่มเช่าได้เลย 🏍️</div>`;
    return;
  }

  list.innerHTML = bookings.map((b) => `
    <div class="booking-item">
      <div>
        <img src="${escAttr(b.img || "")}" alt="" style="width:48px;height:36px;object-fit:cover;border-radius:6px;vertical-align:middle;margin-right:8px" onerror="this.style.display='none'">
        <b>${escHtml(b.name)} ${statusBadge(b.status)}</b>
        <small>${fmtDate(b.start)} → ${fmtDate(b.end)} • ${money(b.total)}</small>
        ${dueAlertFor(b)}
      </div>
      <div>${b.status === "pending"
        ? `<button type="button" class="cancel-btn" onclick="setStatus(${b.id}, 'cancelled')">ยกเลิก</button>`
        : `<small>${escHtml(statusName(b.status))}</small>`}</div>
    </div>`).join("");
}

async function setStatus(id, status) {
  if (status === "cancelled" && !confirm("ต้องการยกเลิกการจองนี้ใช่หรือไม่?")) return;
  try {
    await api(`/bookings/${id}/status`, { method: "PATCH", body: { status } });
    toast(`📌 อัปเดตสถานะ: ${statusName(status)}`);
    await refreshData();
    await updateBadges();
  } catch (ex) {
    toast("⚠️ " + ex.message);
  }
}

async function deleteBooking(id) {
  if (!confirm("ต้องการลบรายการจองนี้ใช่หรือไม่?")) return;
  try {
    await api(`/bookings/${id}`, { method: "DELETE" });
    toast("🗑️ ลบรายการแล้ว");
    await refreshData();
  } catch (ex) {
    toast("⚠️ " + ex.message);
  }
}

/* ---------------- staff: manage bookings ---------------- */
function renderManage() {
  if (!isStaff()) return;
  const grid = $("statGrid");
  if (!grid) return;

  const activeAndPending = bookings.filter((b) => b.status === "pending" || b.status === "active").length;
  const summary = statsSummary || {
    total: bookings.filter((b) => b.status !== "cancelled").length,
    pending: bookings.filter((b) => b.status === "pending").length,
    active: bookings.filter((b) => b.status === "active").length,
    revenue: bookings.filter((b) => b.status !== "cancelled").reduce((s, b) => s + b.total, 0),
  };

  grid.innerHTML = `
    <div class="stat-card"><div class="num">${summary.total}</div><div class="lbl">การจองทั้งหมด</div></div>
    <div class="stat-card dark"><div class="num">${summary.pending}</div><div class="lbl">รอรับรถ</div></div>
    <div class="stat-card dark"><div class="num">${summary.active}</div><div class="lbl">กำลังเช่า</div></div>
    <div class="stat-card"><div class="num">${money(summary.revenue)}</div><div class="lbl">รายได้รวม</div></div>`;

  const rows = bookings.map((b) => {
    const prof = b.renterProfile || {};
    const renterDetail = `${escHtml(prof.firstName || "")} ${escHtml(prof.lastName || "")}${prof.idCardImg ? " • 🪪 มีเอกสาร" : ""}`;
    const renterAddr = prof.address ? escHtml(prof.address) : `<span style="color:#b0b7c3">-</span>`;
    let actions = "";
    if (b.status === "pending") {
      actions = `<button type="button" class="act-btn act-ok" onclick="setStatus(${b.id}, 'active')">✅ รับรถ</button>
                 <button type="button" class="act-btn act-cancel" onclick="setStatus(${b.id}, 'cancelled')">✕ ยกเลิก</button>`;
    } else if (b.status === "active") {
      actions = `<button type="button" class="act-btn act-done" onclick="setStatus(${b.id}, 'done')">🔑 คืนรถ</button>`;
    } else {
      actions = `<button type="button" class="act-btn act-cancel" onclick="deleteBooking(${b.id})">🗑️ ลบ</button>`;
    }
    return `<tr>
      <td><b>${escHtml(b.name)}</b></td>
      <td>${escHtml(b.renter)}<br><small style="color:#7f8c9a">${renterDetail}</small></td>
      <td>${escHtml(b.phone)}</td>
      <td>${renterAddr}</td>
      <td>${fmtDate(b.start)}</td>
      <td>${fmtDate(b.end)}</td>
      <td><b>${money(b.total)}</b></td>
      <td>${statusBadge(b.status)}</td>
      <td><div class="row-actions">${actions}</div></td>
    </tr>`;
  }).join("");

  $("manageBody").innerHTML = rows || `<tr><td colspan="9" class="empty">ไม่มีรายการจอง</td></tr>`;
  if (!activeAndPending) { /* all caught up */ }
}

/* ---------------- staff: bikes ---------------- */
function renderStaffBikes() {
  const grid = $("staffBikeGrid");
  if (!grid || !isStaff()) return;
  if (!bikes.length) {
    grid.innerHTML = `<div class="empty">ยังไม่มีรถในระบบ — กดปุ่ม "+ เพิ่มรถใหม่" เพื่อเริ่มต้น</div>`;
    return;
  }

  grid.innerHTML = bikes.map((b) => {
    const count = b.activeBookings || 0;
    return `
      <div class="card">
        <div class="thumb" style="background:#eef5fb">
          ${b.img ? `<img src="${escAttr(b.img)}" alt="${escAttr(b.name)}" class="bike-thumb-img" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
          <div class="bike-thumb-fallback" style="display:none">🏍️</div>` : `<div class="bike-thumb-fallback" style="display:flex">🏍️</div>`}
          <span class="badge-type">${escHtml(typeName(b.type))}</span>
        </div>
        <div class="card-body">
          <h3>${escHtml(b.name)}</h3>
          <div class="specs">${(b.specs || []).map((x) => `<span class="spec">${escHtml(x)}</span>`).join("")}</div>
          <div class="card-foot">
            <div>
              <div class="price">${money(b.price)} <small>/วัน</small></div>
              <div class="status ${count ? "busy" : "ok"}">${count ? "● มี " + count + " การจอง" : "● ว่าง"}</div>
            </div>
            <div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end">
              <button type="button" class="detail-btn" onclick="openDetail(${b.id})">รายละเอียด</button>
              <button type="button" class="act-btn act-ok" onclick="openBikeForm(${b.id})">✏️ แก้ไข</button>
              <button type="button" class="act-btn act-cancel" onclick="deleteBike(${b.id})">🗑️ ลบ</button>
            </div>
          </div>
        </div>
      </div>`;
  }).join("");
}

function openBikeForm(id) {
  editingBikeId = id || null;
  const form = $("bikeForm");
  const title = $("bikeFormTitle");

  if (editingBikeId) {
    const b = bikes.find((x) => x.id === editingBikeId);
    if (!b) return;
    const d = b.detail || {};
    title.textContent = "✏️ แก้ไขข้อมูลรถ";
    $("bfName").value = b.name;
    $("bfType").value = b.type;
    $("bfPrice").value = b.price;
    $("bfImg").value = b.img || "";
    $("bfSpecs").value = (b.specs || []).join(", ");
    $("bfCc").value = d.cc || "";
    $("bfFuel").value = d.fuel || "";
    $("bfMpg").value = d.mpg || "";
    $("bfTopSpeed").value = d.topSpeed || "";
    $("bfSeat").value = d.seat || "";
    $("bfWeight").value = d.weight || "";
    $("bfStarter").value = d.starter || "";
    $("bfBrake").value = d.brake || "";
    $("bfColor").value = d.color || "";
    $("bfFeature").value = (d.feature || []).join(", ");
  } else {
    title.textContent = "🏍️ เพิ่มรถใหม่";
    form.reset();
    $("bfType").value = "scooter";
  }

  $("bikeFormOverlay").classList.add("show");
}

function closeBikeForm() {
  $("bikeFormOverlay").classList.remove("show");
  editingBikeId = null;
}

function splitList(value) {
  return String(value || "").split(",").map((s) => s.trim()).filter(Boolean);
}

async function saveBike(event) {
  event.preventDefault();
  const name = $("bfName").value.trim();
  const price = parseInt($("bfPrice").value, 10);
  if (!name) return toast("⚠️ กรุณากรอกชื่อรถ");
  if (!Number.isFinite(price) || price < 0) return toast("⚠️ กรุณากรอกราคา");

  const payload = {
    name,
    type: $("bfType").value,
    price,
    img: $("bfImg").value.trim(),
    specs: splitList($("bfSpecs").value),
    detail: {
      cc: $("bfCc").value.trim(),
      fuel: $("bfFuel").value.trim(),
      mpg: $("bfMpg").value.trim(),
      topSpeed: $("bfTopSpeed").value.trim(),
      seat: $("bfSeat").value.trim(),
      weight: $("bfWeight").value.trim(),
      starter: $("bfStarter").value.trim(),
      brake: $("bfBrake").value.trim(),
      color: $("bfColor").value.trim(),
      feature: splitList($("bfFeature").value),
    },
  };

  const btn = $("saveBikeBtn");
  btn.disabled = true;
  btn.textContent = "กำลังบันทึก...";
  try {
    if (editingBikeId) {
      await api(`/bikes/${editingBikeId}`, { method: "PUT", body: payload });
      toast("✅ แก้ไขข้อมูลรถสำเร็จ!");
    } else {
      await api("/bikes", { method: "POST", body: payload });
      toast("✅ เพิ่มรถใหม่สำเร็จ!");
    }
    closeBikeForm();
    await refreshData();
  } catch (ex) {
    toast("⚠️ " + ex.message);
  } finally {
    btn.disabled = false;
    btn.textContent = "💾 บันทึก";
  }
}

async function deleteBike(id) {
  const b = bikes.find((x) => x.id === id);
  if (!b) return;
  if (b.activeBookings > 0) return toast("⚠️ ไม่สามารถลบรถได้ — มีการจองที่ยังไม่เสร็จสิ้น");
  if (!confirm("ต้องการลบ " + b.name + " ออกจากระบบใช่หรือไม่?")) return;
  try {
    await api(`/bikes/${id}`, { method: "DELETE" });
    toast("🗑️ ลบรถออกจากระบบแล้ว");
    await refreshData();
  } catch (ex) {
    toast("⚠️ " + ex.message);
  }
}

/* ---------------- profile ---------------- */
function renderProfile() {
  if (!currentUser || isStaff()) return;
  const u = currentUser;
  $("profileDisplayName").textContent = u.name;
  $("profileDisplayEmail").textContent = u.email;
  $("profileAvatar").textContent = initials(u);
  $("pfFirstName").value = u.firstName || "";
  $("pfLastName").value = u.lastName || "";
  $("pfAddress").value = u.address || "";
  $("pfPhone").value = u.phone || "";

  const complete = u.firstName && u.lastName && u.address && u.phone;
  $("profileStatus").innerHTML = complete
    ? `<span class="badge done">✓ ข้อมูลครบถ้วน</span>`
    : `<span class="badge pending">⚠️ ยังไม่ได้กรอกข้อมูล — กรุณากรอกก่อนทำการจอง</span>`;

  if (u.idCardImg) {
    $("previewImg").src = u.idCardImg;
    $("uploadPreview").style.display = "";
    document.querySelector("#profileForm .upload-box").style.display = "none";
  } else {
    $("previewImg").src = "";
    $("uploadPreview").style.display = "none";
    document.querySelector("#profileForm .upload-box").style.display = "";
  }
}

function handleIdUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) return toast("⚠️ ไฟล์มีขนาดใหญ่เกิน 5MB");
  if (!file.type.startsWith("image/")) return toast("⚠️ กรุณาเลือกไฟล์รูปภาพ");

  pendingProfileFile = file;
  profileIdCardCleared = false;
  $("previewImg").src = URL.createObjectURL(file);
  $("uploadPreview").style.display = "";
  document.querySelector("#profileForm .upload-box").style.display = "none";
}

function removeIdImage() {
  pendingProfileFile = null;
  profileIdCardCleared = true;
  $("pfIdCard").value = "";
  $("previewImg").src = "";
  $("uploadPreview").style.display = "none";
  document.querySelector("#profileForm .upload-box").style.display = "";
}

async function saveProfile(event) {
  event.preventDefault();
  if (!currentUser) return;

  const firstName = $("pfFirstName").value.trim();
  const lastName = $("pfLastName").value.trim();
  const address = $("pfAddress").value.trim();
  const phone = $("pfPhone").value.trim();
  if (!/^0\d{8,9}$/.test(phone.replace(/[-\s]/g, ""))) return toast("⚠️ เบอร์โทรศัพท์ไม่ถูกต้อง");

  const btn = $("saveProfileBtn");
  btn.disabled = true;
  btn.textContent = "กำลังบันทึก...";
  try {
    let idCardImg = profileIdCardCleared ? null : (currentUser.idCardImg || null);
    if (pendingProfileFile) idCardImg = await uploadIdCard(pendingProfileFile);

    const data = await api("/auth/profile", {
      method: "PUT",
      body: { firstName, lastName, address, phone, idCardImg },
    });
    currentUser = data.user;
    pendingProfileFile = null;
    profileIdCardCleared = false;
    $("userName").textContent = "👤 " + currentUser.name;
    $("heroName").textContent = currentUser.firstName || currentUser.name;
    renderProfile();
    toast("✅ บันทึกข้อมูลโปรไฟล์สำเร็จ!");
  } catch (ex) {
    toast("⚠️ " + ex.message);
  } finally {
    btn.disabled = false;
    btn.textContent = "💾 บันทึกข้อมูล";
  }
}

function handleRegIdUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) return toast("⚠️ ไฟล์มีขนาดใหญ่เกิน 5MB");
  if (!file.type.startsWith("image/")) return toast("⚠️ กรุณาเลือกไฟล์รูปภาพ");

  pendingRegFile = file;
  $("regPreviewImg").src = URL.createObjectURL(file);
  $("regUploadPreview").style.display = "";
  $("regUploadIcon").textContent = "📸";
  $("regUploadText").textContent = "อัพรูปแล้ว";
  document.querySelector("#formReg .upload-hint").style.display = "none";
}

function removeRegIdImage() {
  pendingRegFile = null;
  $("rgIdCard").value = "";
  $("regPreviewImg").src = "";
  $("regUploadPreview").style.display = "none";
  $("regUploadIcon").textContent = "📤";
  $("regUploadText").textContent = "คลิกเพื่ออัพรูปบัตรประชาชน หรือ พาสปอร์ต";
  document.querySelector("#formReg .upload-hint").style.display = "";
}

/* ---------------- chat: customer ---------------- */
function renderChatMessages() {
  const box = $("chatBox");
  if (!box || !currentUser) return;
  if (!chatMessages.length) {
    box.innerHTML = `<div class="chat-empty">ยังไม่มีข้อความ — เริ่มพิมพ์เพื่อสอบถามพนักงานได้เลย</div>`;
    return;
  }
  box.innerHTML = chatMessages.map((m) => {
    const mine = m.from === currentUser.id;
    return `<div class="chat-msg ${mine ? "customer" : "staff"}">
      <div class="msg-sender">${mine ? "คุณ" : "พนักงาน"}</div>
      <div>${escHtml(m.text)}</div>
      <div class="msg-time">${timeOnly(m.time)}</div>
    </div>`;
  }).join("");
  box.scrollTop = box.scrollHeight;
}

async function loadChat(silent = false) {
  const data = await api("/messages");
  chatMessages = data.messages || [];
  renderChatMessages();
  if (!silent) setBadge($("chatBadge"), 0);
}

async function sendChat() {
  const input = $("chatInput");
  const text = input.value.trim();
  if (!text) return;
  input.value = "";
  try {
    const data = await api("/messages", { method: "POST", body: { text } });
    chatMessages.push(data.message);
    renderChatMessages();
  } catch (ex) {
    input.value = text;
    toast("⚠️ " + ex.message);
  }
}

/* ---------------- chat: staff ---------------- */
function renderThreads() {
  const list = $("chatUserList");
  if (!list) return;
  if (!chatThreads.length) {
    list.innerHTML = `<div class="empty">ยังไม่มีลูกค้าส่งข้อความมา</div>`;
    return;
  }
  list.innerHTML = chatThreads.map((t) => `
    <button type="button" class="chat-user-btn ${currentChatUser === t.userId ? "active" : ""}" onclick="selectChatUser(${t.userId})">
      <div style="text-align:left">
        <b>${escHtml(t.name)}</b>
        <div style="font-size:.75rem;color:var(--gray);font-weight:400;margin-top:2px">${escHtml(t.preview)}</div>
      </div>
      ${t.unread ? `<span class="unread-dot" title="${t.unread} ข้อความใหม่"></span>` : ""}
    </button>`).join("");
}

async function loadThreads(silent = false) {
  const data = await api("/messages/threads");
  chatThreads = data.threads || [];
  renderThreads();
  if (!silent && currentChatUser && !chatThreads.some((t) => t.userId === currentChatUser)) {
    currentChatUser = null;
    $("staffChatWrapper").style.display = "none";
  }
}

async function selectChatUser(userId) {
  currentChatUser = userId;
  await loadThreadMessages(userId);
  await loadThreads(true);
}

async function loadThreadMessages(userId, silent = false) {
  const data = await api("/messages/" + userId);
  if (currentChatUser !== userId) return;
  $("chatHeaderBar").textContent = "💬 กำลังแชทกับ " + data.customer.name;
  $("staffChatWrapper").style.display = "";
  const box = $("staffChatBox");
  if (!data.messages.length) {
    box.innerHTML = `<div class="chat-empty">ยังไม่มีข้อความจากลูกค้าคนนี้</div>`;
  } else {
    box.innerHTML = data.messages.map((m) => {
      const mine = m.role === "staff";
      return `<div class="chat-msg ${mine ? "staff" : "customer"}">
        <div class="msg-sender">${mine ? "พนักงาน" : "ลูกค้า"}</div>
        <div>${escHtml(m.text)}</div>
        <div class="msg-time">${timeOnly(m.time)}</div>
      </div>`;
    }).join("");
    box.scrollTop = box.scrollHeight;
  }
  if (!silent) setBadge($("chatBadgeStaff"), 0);
}

async function sendStaffChat() {
  if (!currentChatUser) return;
  const input = $("staffChatInput");
  const text = input.value.trim();
  if (!text) return;
  input.value = "";
  try {
    await api("/messages", { method: "POST", body: { text, toUserId: currentChatUser } });
    await loadThreadMessages(currentChatUser);
  } catch (ex) {
    input.value = text;
    toast("⚠️ " + ex.message);
  }
}

/* ---------------- notifications ---------------- */
function renderNotifications() {
  const list = $("notificationList");
  if (!list) return;
  if (!notifications.length) {
    list.innerHTML = `<div class="empty">✅ ไม่มีการแจ้งเตือน — ทุกอย่างปกติ</div>`;
    return;
  }
  list.innerHTML = notifications.map((n) => `
    <div class="notif-item ${n.urgent ? "urgent" : ""}">
      <div class="notif-icon">${n.icon}</div>
      <div class="notif-body">
        <div class="notif-title">${escHtml(n.title)}</div>
        <div class="notif-desc">${escHtml(n.desc)}</div>
      </div>
    </div>`).join("");
}

/* ---------------- revenue ---------------- */
function setRevMode(mode) {
  revMode = mode;
  $("revTabMonth").classList.toggle("active", mode === "month");
  $("revTabYear").classList.toggle("active", mode === "year");
  renderRevenue();
}

async function loadRevenue() {
  const sel = $("revYear");
  const requested = Number(sel.value) || new Date().getFullYear();
  const data = await api("/stats/revenue?year=" + requested);
  revData = data;

  sel.innerHTML = (data.years || []).map((y) => `<option value="${y}">${y}</option>`).join("");
  sel.value = String(data.year);

  renderRevenue();
}

function renderRevenue() {
  if (!revData || !isStaff()) return;
  const year = revData.year;
  const monthly = revData.monthly || Array(12).fill(0);
  const max = Math.max(...monthly, 1);
  const total = revData.total || 0;

  let body;
  if (revMode === "month") {
    const bars = monthly.map((v, i) => `
      <div class="rev-col" title="${MONTHS[i]} ${year}: ${money(v)}">
        <div class="rev-bar">
          <div class="rev-bar-fill" style="height:${Math.max(4, Math.round(v / max * 100))}%"><span>${(v / 1000).toFixed(1)}k</span></div>
        </div>
        <div class="rev-lbl">${MONTHS[i]}</div>
      </div>`).join("");

    body = `
      <div class="rev-chart">${bars}</div>
      <div class="tbl-wrap"><table>
        <thead><tr><th>เดือน</th><th>รายได้</th><th>สัดส่วน</th></tr></thead>
        <tbody>${MONTHS.map((m, i) => `<tr>
          <td><b>${m} ${year}</b></td>
          <td><b>${money(monthly[i])}</b></td>
          <td><div class="rev-cell-bar"><div style="width:${monthly[i] ? Math.round(monthly[i] / max * 100) : 0}%"></div></div></td>
        </tr>`).join("")}</tbody>
      </table></div>
      <div class="rev-total">รวมทั้งปี ${year}: <b>${money(total)}</b></div>`;
  } else {
    body = `<div class="tbl-wrap"><table>
      <thead><tr><th>ปี</th><th>รายได้รวม</th><th>ค่าเฉลี่ยต่อเดือน</th></tr></thead>
      <tbody>${(revData.yearly || []).map((y) => `
        <tr>
          <td><b>${y.year}</b></td>
          <td><b>${money(y.total)}</b></td>
          <td>${money(y.average)} / เดือน</td>
        </tr>`).join("")}</tbody>
    </table></div>`;
  }

  $("revStats").innerHTML = `
    <div class="stat-card"><div class="num">${money(total)}</div><div class="lbl">รายได้ปี ${year}</div></div>
    <div class="stat-card dark"><div class="num">${money(revData.average)}</div><div class="lbl">เฉลี่ย/เดือน</div></div>
    <div class="stat-card dark"><div class="num">${money(revData.best)}</div><div class="lbl">เดือนทำรายได้สูงสุด</div></div>
    <div class="stat-card"><div class="num">${revData.realBookings || 0}</div><div class="lbl">การจองจริง</div></div>`;
  $("revBody").innerHTML = body;
}

/* ---------------- overlay helpers ---------------- */
function bindOverlayClose() {
  for (const id of ["overlay", "detailOverlay", "bikeFormOverlay"]) {
    const overlay = $(id);
    if (!overlay) continue;
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) overlay.classList.remove("show");
    });
  }
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    for (const id of ["overlay", "detailOverlay", "bikeFormOverlay"]) {
      $(id).classList.remove("show");
    }
  });
}

/* ---------------- boot ---------------- */
async function init() {
  bindOverlayClose();
  setDefaultDates();

  if (!token) return;

  try {
    const data = await api("/auth/me");
    currentUser = data.user;
    await enterApp();
  } catch {
    clearSession();
  }
}

init();
