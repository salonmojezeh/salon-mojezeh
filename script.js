"use strict";
/* ===== script.js — صفحه اصلی سالن معجزه ===== */

const fa = n => String(n).replace(/[0-9]/g, d => "۰۱۲۳۴۵۶۷۸۹"[d]);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const money = n => fa(Number(n || 0).toLocaleString("fa-IR"));

function applyTheme() {
  const dark = localStorage.getItem("theme") === "dark";
  document.body.classList.toggle("dark", dark);
  document.getElementById("btnTheme").textContent = dark ? "☀️" : "🌙";
}
function toggleTheme() {
  const dark = document.body.classList.toggle("dark");
  localStorage.setItem("theme", dark ? "dark" : "light");
  document.getElementById("btnTheme").textContent = dark ? "☀️" : "🌙";
}

async function loadAccountBtn() {
  const btn = document.getElementById("btnAccount");
  try {
    const user = await getCurrentUser();
    if (user) { btn.textContent = "پروفایل من"; btn.href = "profile.html"; }
  } catch { /* مهم نیست */ }
}

async function loadServices() {
  const box = document.getElementById("servicesGrid");
  const list = await getServices(true);
  if (!list.length) { box.innerHTML = '<p class="empty">فعلاً خدمتی ثبت نشده است.</p>'; return; }
  box.innerHTML = list.map(s => `
    <div class="cardbox">
      ${s.image_url ? `<img class="img" src="${esc(s.image_url)}" alt="${esc(s.name)}">` : ""}
      <h3>${esc(s.name)}</h3>
      ${s.description ? `<p>${esc(s.description)}</p>` : ""}
      <span class="price">${money(s.price)} تومان</span>
    </div>`).join("");
}

async function loadBarbers() {
  const box = document.getElementById("barbersGrid");
  const list = await getBarbers(true);
  if (!list.length) { box.innerHTML = '<p class="empty">فعلاً آرایشگری ثبت نشده است.</p>'; return; }
  box.innerHTML = list.map(b => `
    <div class="cardbox">
      <h3>💈 ${esc(b.name)}</h3>
      <p>${b.active === false ? "غیرفعال" : "آماده پذیرش نوبت"}</p>
    </div>`).join("");
}

document.addEventListener("DOMContentLoaded", () => {
  applyTheme();
  document.getElementById("btnTheme").onclick = toggleTheme;
  loadAccountBtn();
  loadServices();
  loadBarbers();
});