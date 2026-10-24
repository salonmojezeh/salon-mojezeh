"use strict";
/* ===== profile.js — پروفایل بر اساس نقش ===== */

const $ = id => document.getElementById(id);
const fa = n => String(n).replace(/[0-9]/g, d => "۰۱۲۳۴۵۶۷۸۹"[d]);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const money = n => fa(Number(n || 0).toLocaleString("fa-IR"));
const statusLabel = s => ({ pending: "در انتظار تأیید", confirmed: "تأیید شده", completed: "انجام شده", cancelled: "لغو شده", no_show: "عدم حضور" }[s] || s || "—");
const statusColor = s => ({ pending: "#f59e0b", confirmed: "#1976d2", completed: "#2e7d32", cancelled: "#b71c1c", no_show: "#757575" }[s] || "#999");
const levelLabel = p => (p >= 100 ? "طلایی" : p >= 50 ? "نقره‌ای" : "برنزی");

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

function nextBirthdayDays(bd) {
  if (!bd) return null;
  const [, m, d] = String(bd).split("-").map(Number);
  if (!m || !d) return null;
  const now = new Date();
  let t = new Date(now.getFullYear(), m - 1, d);
  if (t < new Date(now.toDateString())) t = new Date(now.getFullYear() + 1, m - 1, d);
  return Math.round((t - new Date(now.toDateString())) / 86400000);
}

/* ---------- حالت مشتری ---------- */
async function renderCustomer(prof) {
  $("custSec").classList.remove("hidden");
  const phone = prof.phone || (prof.customer_id ? "" : "");
  const cust = prof.customer_id
    ? (await sb.from(TABLES.customers).select("*").eq("id", prof.customer_id).maybeSingle()).data
    : (phone ? await getCustomerByPhone(phone) : null);

  /* باشگاه */
  const club = $("clubBox");
  if (cust) {
    const days = nextBirthdayDays(cust.birth_date);
    club.innerHTML = `
      <div class="lrow"><div class="lmain">
        <div class="ltitle">امتیاز شما: ${fa(cust.club_points || 0)}</div>
        <div class="lsub">سطح <span class="badge">${levelLabel(cust.club_points || 0)}</span> • ${fa(cust.visit_count || 0)} مراجعه</div>
      </div></div>
      ${days !== null && days <= 30 ? `<div class="lrow"><div class="lmain">
        <div class="ltitle">🎂 تولدت نزدیک است!</div>
        <div class="lsub">${days === 0 ? "امروز تولدته!" : fa(days) + " روز مانده"}${cust.free_gift ? " — هدیه‌ات آماده است 🎁" : " — هدیه تولد در نوبت بعدی منتظرت است"}</div>
      </div></div>` : ""}`;
  } else club.innerHTML = '<p class="empty">اطلاعات باشگاه یافت نشد.</p>';

  /* رزروها */
  const myPhone = (cust && cust.phone) || phone;
  const list = myPhone ? await getReservationsByPhone(myPhone) : [];
  const box = $("myRes");
  if (!list.length) { box.innerHTML = '<p class="empty">هنوز رزروی ندارید. <a href="reserve.html">رزرو نوبت</a></p>'; return; }
  box.innerHTML = list.map(r => {
    const st = r.status || "pending";
    const up = ["pending", "confirmed"].includes(st) && r.date >= TodayStr(0);
    return `<div class="lrow">
      <div class="lmain">
        <div class="ltitle">${esc(r.service_name || "")} — ${DateFa(r.date)} ساعت ${fa(HHmm(r.time))}</div>
        <div class="lsub">${r.barber_message ? "💬 " + esc(r.barber_message) + " • " : ""}${money(r.price)} تومان</div>
      </div>
      <span class="chip" style="background:${statusColor(st)}">${statusLabel(st)}</span>
      ${up ? `<button class="btn small danger" data-cancel="${r.id}">لغو</button>` : ""}
    </div>`;
  }).join("");
  box.querySelectorAll("[data-cancel]").forEach(b => b.onclick = async () => {
    if (!confirm("این رزرو لغو شود؟")) return;
    const { error } = await cancelReservation(b.dataset.cancel);
    if (error) return toast("خطا: " + error.message, false);
    toast("رزرو لغو شد");
    renderCustomer(prof);
  });
}

/* ---------- حالت آرایشگر ---------- */
async function renderBarber(prof) {
  $("barberSec").classList.remove("hidden");
  const inp = $("brDate");
  inp.value = TodayStr(0);
  const load = async () => {
    const date = inp.value || TodayStr(0);
    const { data } = await sb.from(TABLES.reservations).select("*").eq("date", date).eq("barber_id", prof.barber_id).order("time");
    const list = data || [];
    $("barberRes").innerHTML = list.length ? list.map(r => {
      const st = r.status || "pending";
      const acts = [];
      if (st === "pending") acts.push(`<button class="btn small main" data-act="confirmed" data-id="${r.id}">✓ تأیید</button>`);
      if (st === "confirmed" || st === "pending") acts.push(`<button class="btn small" data-act="completed" data-id="${r.id}">✔ انجام شد</button>`);
      return `<div class="lrow">
        <div class="lmain">
          <div class="ltitle">${esc(r.customer_name || "—")} — ${fa(HHmm(r.time))}</div>
          <div class="lsub">${esc(r.service_name || "")} • ${esc(r.phone || "")}${r.barber_message ? " • 💬 " + esc(r.barber_message) : ""}</div>
        </div>
        <span class="chip" style="background:${statusColor(st)}">${statusLabel(st)}</span>
        ${acts.join("")}
      </div>`;
    }).join("") : '<p class="empty">رزروی برای این روز نیست.</p>';
    $("barberRes").querySelectorAll("[data-act]").forEach(b => b.onclick = async () => {
      const { error } = await setReservationStatus(b.dataset.id, b.dataset.act);
      if (error) return toast("خطا: " + error.message, false);
      toast("ثبت شد ✓"); load();
    });
  };
  $("btnBrLoad").onclick = load;
  load();
}

/* ---------- راه‌اندازی ---------- */
document.addEventListener("DOMContentLoaded", async () => {
  applyTheme();
  $("btnTheme").onclick = toggleTheme;

  const user = await getCurrentUser();
  if (!user) { location.href = "login.html"; return; }

  $("btnLogout").onclick = async () => { await signOutUser(); location.href = "login.html"; };

  const prof = await getUserProfile(user.id);
  const isAdmin = !!(prof && prof.is_admin);
  $("btnAdmin").classList.toggle("hidden", !isAdmin);

  const role = prof ? (prof.role || (isAdmin ? "admin" : prof.barber_id ? "barber" : "customer")) : "customer";
  const name = (user.user_metadata && user.user_metadata.name) || "کاربر";

  $("who").innerHTML = `
    <div class="ltitle" style="font-size:17px">سلام ${esc(name)} 👋</div>
    <div class="lsub" style="margin-top:4px">
      ${role === "admin" ? "مدیر سالن" : role === "barber" ? "آرایشگر" : "مشتری"}
      ${isAdmin ? ' <span class="badge">مدیر</span>' : ""}
    </div>`;

  if (role === "barber" && prof && prof.barber_id) await renderBarber(prof);
  else await renderCustomer(prof || {});
});