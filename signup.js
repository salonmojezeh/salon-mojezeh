import { supabase, getCurrentUser, normalizePhoneE164, normalizePhoneLocal } from "./supabase.js";

const $ = (s) => document.querySelector(s);
const form = $("#signupForm");
const submit = $("#signupBtn");
const message = $("#signupMessage");

function digits(v = "") {
  return String(v).replace(/[۰-۹]/g, d => "۰۱۲۳۴۵۶۷۸۹".indexOf(d)).replace(/[٠-٩]/g, d => "٠١٢٣٤٥٦٧٨٩".indexOf(d));
}
function show(text, type = "error") {
  message.hidden = false;
  message.className = `form-message ${type}`;
  message.textContent = text;
}
function clearMessage() {
  message.hidden = true;
  message.textContent = "";
}
function validIranPhone(value) {
  const p = digits(value).replace(/[\s-]/g, "");
  return /^(09\d{9}|\+989\d{9}|00989\d{9})$/.test(p);
}

(async () => {
  try {
    if (await getCurrentUser()) location.replace("profile.html");
  } catch {}
})();

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearMessage();

  const firstName = $("#firstName").value.trim();
  const lastName = $("#lastName").value.trim();
  const rawPhone = digits($("#phone").value.trim()).replace(/[\s-]/g, "");
  const email = $("#email").value.trim().toLowerCase();
  const birthDate = $("#birthDate").value || null;
  const password = $("#password").value;
  const password2 = $("#password2").value;

  if (!firstName || !lastName) return show("نام و نام خانوادگی را کامل کنید.");
  if (!validIranPhone(rawPhone)) return show("شماره موبایل معتبر ایرانی وارد کنید.");
  if (email && !/^\S+@\S+\.\S+$/.test(email)) return show("ایمیل معتبر وارد کنید.");
  if (password.length < 8) return show("رمز عبور باید حداقل ۸ کاراکتر باشد.");
  if (password !== password2) return show("تکرار رمز عبور با رمز عبور یکسان نیست.");
  if (!$("#terms").checked) return show("پذیرش قوانین الزامی است.");

  submit.disabled = true;
  submit.querySelector("span:first-child").textContent = "در حال ایجاد حساب...";
  submit.querySelector(".btn-loader").hidden = false;

  try {
    const phoneE164 = normalizePhoneE164(rawPhone);
    const phoneLocal = normalizePhoneLocal(rawPhone);

    const payload = {
      first_name: firstName,
      last_name: lastName,
      phone_local: phoneLocal,
      birth_date: birthDate
    };

    const signupInput = email
      ? { email, password, options: { data: payload } }
      : { phone: phoneE164, password, options: { data: payload } };

    const { data, error } = await supabase.auth.signUp(signupInput);
    if (error) throw error;

    if (data?.session && data?.user) {
      /* اگر trigger حساب مشتری را ساخته باشد، تاریخ تولد را هم بلافاصله همگام می‌کنیم. */
      try {
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("customer_id")
          .eq("id", data.user.id)
          .maybeSingle();

        if (profile?.customer_id && birthDate) {
          await supabase.from("customers").update({ birth_date: birthDate }).eq("id", profile.customer_id);
        }
      } catch {}

      show("حساب با موفقیت ساخته شد.", "success");
      setTimeout(() => location.replace("profile.html"), 600);
    } else {
      show("ثبت‌نام انجام شد. اگر تأیید حساب فعال باشد، مرحله تأیید را انجام بده و سپس وارد حساب شو.", "success");
    }
  } catch (err) {
    let text = err?.message || "ثبت‌نام انجام نشد.";
    if (/already registered|already exists|duplicate/i.test(text)) text = "این شماره یا ایمیل قبلاً ثبت شده است.";
    show(text);
  } finally {
    submit.disabled = false;
    submit.querySelector("span:first-child").textContent = "ایجاد حساب";
    submit.querySelector(".btn-loader").hidden = true;
  }
});
