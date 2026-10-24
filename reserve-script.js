"use strict";
/* ===== reserve-script.js — رزرو پنج‌مرحله‌ای ===== */

const $ = id => document.getElementById(id);
const fa = n => String(n).replace(/[0-9]/g, d => "۰۱۲۳۴۵۶۷۸۹"[d]);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const money = n => fa(Number(n || 0).toLocaleString("fa-IR"));
const mins = t => { const [h, m] = HHmm(t).split(":").map(Number); return (h || 0) * 60 + (m || 0); };
const tm = m => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

const S = {
  step: 1,
  settings: { opening_time: "09:00", closing_time: "21:00", slot_interval: 30, booking_days_ahead: 30 },
  services: [], barbers: [],
  serviceKey: null, barberId: null, date: null, time: null
};

let toastTimer;
function toast(msg, ok = true) {
  const t = $("toast");
  t.textContent = msg; t.classList.remove("hidden"); t.classList.toggle("err", !ok);
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.add("hidden"), 2600);
}

function applyTheme() {
  const dark = localStorage.getItem("theme") === "dark";
  document.body.classList.toggle("dark", dark);
  $("btnTheme").textContent = dark ? "☀️" : "🌙";
}
function toggleTheme() {
  const dark = document.body.classList.toggle("dark");
  localStorage.setItem("theme", dark ? "dark" : "light");
  $("btnTheme").textContent = dark ? "☀️" : "🌙";
}

function goStep(n) {
  S.step = n;
  document.querySelectorAll(".panel").forEach(p => p.classList.remove("active"));
  $("step" + n).classList.add("active");
  document.querySelectorAll(".step").forEach(s => s.classList.toggle("active", +s.dataset.step === n));
  window.scrollTo({ top: 0 });
}

/* ---------- گام ۱: خدمات ---------- */
function renderServices() {
  const box = $("svcGrid");
  box.innerHTML = S.services.map(s => `
    <div class="pick" data-key="${esc(s.service_key)}">
      <h3>${esc(s.name)}</h3>
      <p>${fa(s.duration || 0)} دقیقه</p>
      <span class="price">${money(s.price)} تومان</span>
    </div>`).join("") || '<p class="empty">فعلاً خدمتی ثبت نشده است.</p>';
  box.querySelectorAll(".pick").forEach(el => el.onclick = () => {
    S.serviceKey = el.dataset.key;
    box.querySelectorAll(".pick").forEach(p => p.classList.toggle("sel", p === el));
    setTimeout(() => goStep(2), 200);
  });
}

/* ---------- گام ۲: آرایشگر ---------- */
function renderBarbers() {
  const box = $("barberGrid");
  box.innerHTML =
    `<div class="pick" data-id=""><h3>فرقی نمی‌کند</h3><p>اولین آرایشگر آزاد</p></div>` +
    S.barbers.map(b => `<div class="pick" data-id="${esc(b.id)}"><h3>💈 ${esc(b.name)}</h3></div>`).join("");
  box.querySelectorAll(".pick").forEach(el => el.onclick = () => {
    S.barberId = el.dataset.id || null;
    box.querySelectorAll(".pick").forEach(p => p.classList.toggle("sel", p === el));
    setTimeout(() => goStep(3), 200);
  });
}

/* ---------- گام ۳: تاریخ ---------- */
function initDate() {
  const inp = $("resDate");
  inp.min = TodayStr(0);
  inp.max = TodayStr(S.settings.booking_days_ahead || 30);
  inp.value = TodayStr(0);
  $("btnToDate").onclick = () => {
    if (!inp.value) return toast("تاریخ را انتخاب کنید", false);
    S.date = inp.value;
    renderTimes();
    goStep(4);
  };
}

/* ---------- گام ۴: ساعت‌ها (با محاسبه بازه‌های بسته) ---------- */
function blockCovers(block, m) {
  /* بلاک کل روز: بدون start/end */
  if (!block.start_time || !block.end_time) return true;
  return m >= mins(block.start_time) && m < mins(block.end_time);
}

async function renderTimes() {
  const box = $("timesBox");
  box.innerHTML = '<p class="empty">در حال بارگذاری…</p>';

  const open = mins(S.settings.opening_time);
  const close = mins(S.settings.closing_time);
  const step = S.settings.slot_interval || 30;
  const now = new Date();
  const nowM = now.getHours() * 60 + now.getMinutes();
  const today = TodayStr(0);

  /* بازه‌های بستهٔ این روز (کل سالن + آرایشگر انتخابی) */
  const { data: blocks } = await getAvailabilityBlocks(S.date, S.barberId);
  /* رزروهای این روز */
  const dayRes = await getReservationsByDate(S.date);

  let html = "";
  let anyFree = false;
  for (let m = open; m < close; m += step) {
    const t = tm(m);
    let reason = null;

    const block = (blocks || []).find(b => blockCovers(b, m));
    if (block) reason = block.title ? "بسته: " + block.title : "بسته";
    else if (dayRes.some(r => HHmm(r.time) === t && r.status !== "cancelled" &&
      (!S.barberId || !r.barber_id || String(r.barber_id) === String(S.barberId))))
      reason = "رزرو شده";
    else if (S.date === today && m < nowM + 15) reason = "گذشته";

    if (reason) html += `<button type="button" class="tbtn off" disabled title="${esc(reason)}">${fa(t)}</button>`;
    else { anyFree = true; html += `<button type="button" class="tbtn" data-t="${t}">${fa(t)}</button>`; }
  }
  box.innerHTML = anyFree ? html : '<p class="empty">برای این روز ساعت آزادی نیست؛ روز دیگری را انتخاب کنید.</p>';

  box.querySelectorAll(".tbtn:not(.off)").forEach(b => b.onclick = () => {
    S.time = b.dataset.t;
    box.querySelectorAll(".tbtn").forEach(x => x.classList.remove("sel"));
    b.classList.add("sel");
    renderSummary();
    setTimeout(() => goStep(5), 200);
  });
}

/* ---------- گام ۵: تأیید ---------- */
function renderSummary() {
  const svc = S.services.find(s => s.service_key === S.serviceKey);
  const br = S.barbers.find(b => String(b.id) === String(S.barberId));
  $("summary").innerHTML = `
    <div class="row"><span>خدمت</span><b>${esc(svc ? svc.name : "—")}</b></div>
    <div class="row"><span>مدت</span><b>${fa(svc ? svc.duration : 0)} دقیقه</b></div>
    <div class="row"><span>قیمت</span><b>${money(svc ? svc.price : 0)} تومان</b></div>
    <div class="row"><span>آرایشگر</span><b>${esc(br ? br.name : "فرقی نمی‌کند")}</b></div>
    <div class="row"><span>تاریخ</span><b>${DateFa(S.date)}</b></div>
    <div class="row"><span>ساعت</span><b>${fa(S.time || "—")}</b></div>`;
}

/* بررسی نهایی آزاد بودن ساعت، قبل از ثبت */
async function stillFree() {
  const { data: blocks } = await getAvailabilityBlocks(S.date, S.barberId);
  if ((blocks || []).some(b => blockCovers(b, mins(S.time)))) return "متأسفانه این ساعت هم‌اکنون بسته شده است";
  const dayRes = await getReservationsByDate(S.date);
  if (dayRes.some(r => HHmm(r.time) === S.time && r.status !== "cancelled" &&
    (!S.barberId || !r.barber_id || String(r.barber_id) === String(S.barberId))))
    return "متأسفانه این ساعت هم‌اکنون رزرو شده است";
  return null;
}

document.addEventListener("DOMContentLoaded", async () => {
  applyTheme();
  $("btnTheme").onclick = toggleTheme;

  /* اگر کاربر وارد شده، نام و شماره‌اش را پیش‌فرض بگذار */
  getCurrentUser().then(async u => {
    if (!u) return;
    $("btnAccount").textContent = "پروفایل من";
    $("btnAccount").href = "profile.html";
    const prof = await getUserProfile(u.id);
    const phone = (prof && prof.phone) || (u.user_metadata && u.user_metadata.phone);
    if (prof && prof.customer_id) {
      const { data: c } = await sb.from(TABLES.customers).select("name,phone").eq("id", prof.customer_id).maybeSingle();
      if (c) { $("fName").value = c.name || ""; $("fPhone").value = c.phone || ""; }
    } else if (phone) {
      const c = await getCustomerByPhone(phone);
      if (c) { $("fName").value = c.name || ""; $("fPhone").value = c.phone || ""; }
      else if (u.user_metadata && u.user_metadata.name) $("fName").value = u.user_metadata.name;
    }
  });

  S.settings = await getBookingSettings();
  S.services = await getServices(true);
  S.barbers = await getBarbers(true);

  renderServices();
  renderBarbers();
  initDate();

  /* دکمه‌های بازگشت */
  document.querySelectorAll("[data-go]").forEach(b => b.onclick = () => goStep(+b.dataset.go));

  $("formConfirm").onsubmit = async e => {
    e.preventDefault();
    const name = $("fName").value.trim();
    const phone = NormPhone($("fPhone").value);
    const notes = $("fNotes").value.trim();
    const m = $("msg");
    const show = (t, ok) => { m.textContent = t; m.className = "msg " + (ok ? "ok" : "err"); };

    if (!name) return show("نام را وارد کنید", false);
    if (!/^09\d{9}$/.test(phone)) return show("شماره موبایل معتبر نیست (۰۹xxxxxxxxx)", false);

    const svc = S.services.find(s => s.service_key === S.serviceKey);
    if (!svc || !S.date || !S.time) return show("اطلاعات رزرو کامل نیست", false);

    $("btnSubmit").disabled = true;
    const conflict = await stillFree();
    if (conflict) {
      $("btnSubmit").disabled = false;
      show(conflict + "؛ لطفاً ساعت دیگری انتخاب کنید.", false);
      renderTimes();
      goStep(4);
      return;
    }

    const { error } = await createReservation({
      customer_name: name, phone,
      service_key: svc.service_key, service_name: svc.name,
      service_duration: svc.duration, price: svc.price,
      barber_id: S.barberId, date: S.date, time: S.time,
      display_date: DateFa(S.date), status: "pending", source: "online", notes
    });

    if (error) {
      $("btnSubmit").disabled = false;
      if (error.code === "23505") {
        show("این ساعت همین حالا رزرو شد؛ ساعت دیگری انتخاب کنید.", false);
        renderTimes(); goStep(4);
      } else show("خطا در ثبت رزرو: " + error.message, false);
      return;
    }

    show("رزرو شما ثبت شد و در انتظار تأیید سالن است ✓", true);
    toast("رزرو ثبت شد ✓");
    setTimeout(() => location.href = "profile.html", 1600);
  };
});