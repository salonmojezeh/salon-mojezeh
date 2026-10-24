"use strict";
/* ===== signup.js — ثبت‌نام مشتری ===== */

const $ = id => document.getElementById(id);
const fa = n => String(n).replace(/[0-9]/g, d => "۰۱۲۳۴۵۶۷۸۹"[d]);

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

  /* اگر قبلاً وارد شده، برو پروفایل */
  getCurrentUser().then(u => { if (u) location.href = "profile.html"; });

  $("formSignup").onsubmit = async e => {
    e.preventDefault();
    const name = $("suName").value.trim();
    const phone = NormPhone($("suPhone").value);
    const birth = $("suBirth").value || null;
    const pass = $("suPass").value, pass2 = $("suPass2").value;

    if (!/^09\d{9}$/.test(phone)) return showMsg("شماره موبایل معتبر نیست (۰۹xxxxxxxxx)", false);
    if (pass.length < 6) return showMsg("رمز عبور باید حداقل ۶ کاراکتر باشد", false);
    if (pass !== pass2) return showMsg("رمز عبور و تکرار آن یکسان نیستند", false);

    $("btnSubmit").disabled = true;
    const { error } = await signUpCustomer({ name, phone, password: pass, birthDate: birth });
    if (error) {
      $("btnSubmit").disabled = false;
      if (String(error.message).includes("already registered") || String(error.message).includes("already exists"))
        return showMsg("این شماره قبلاً ثبت‌نام کرده است؛ وارد شوید.", false);
      return showMsg("خطا در ثبت‌نام: " + error.message, false);
    }

    /* همگام‌سازی جدول مشتریان */
    try {
      const { error: cerr } = await createCustomer({
        name, phone, birth_date: birth,
        club_points: 0, visit_count: 0, free_gift: false
      });
      if (cerr && cerr.code === "23505") {
        /* مشتری از قبل بوده — فقط تاریخ تولد را به‌روز کن */
        await updateCustomerByPhone(phone, birth ? { birth_date: birth } : {});
      }
    } catch { /* جدول مشتریان مانع ثبت‌نام نمی‌شود */ }

    showMsg("ثبت‌نام انجام شد ✓ در حال انتقال…", true);
    setTimeout(() => location.href = "profile.html", 1200);
  };
});