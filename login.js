"use strict";
/* ===== login.js — ورود کاربران ===== */

const $ = id => document.getElementById(id);

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

function showMsg(text, ok) {
  const m = $("msg");
  m.textContent = text;
  m.className = "msg " + (ok ? "ok" : "err");
}

document.addEventListener("DOMContentLoaded", () => {
  applyTheme();
  $("btnTheme").onclick = toggleTheme;

  $("formLogin").onsubmit = async e => {
    e.preventDefault();
    const phone = NormPhone($("liPhone").value);
    const pass = $("liPass").value;
    if (!/^09\d{9}$/.test(phone)) return showMsg("شماره موبایل معتبر نیست (۰۹xxxxxxxxx)", false);

    $("btnSubmit").disabled = true;
    const { error } = await signInCustomer(phone, pass);
    if (error) {
      $("btnSubmit").disabled = false;
      return showMsg("شماره یا رمز عبور اشتباه است", false);
    }

    const user = await getCurrentUser();
    if (user) {
      const prof = await getUserProfile(user.id);
      showMsg("ورود موفق ✓ در حال انتقال…", true);
      setTimeout(() => {
        location.href = (prof && prof.is_admin) ? "admin.html" : "profile.html";
      }, 800);
    } else {
      $("btnSubmit").disabled = false;
      showMsg("خطای غیرمنتظره؛ دوباره تلاش کنید", false);
    }
  };
});