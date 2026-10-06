import { signUpCustomer, getCurrentUser } from "./supabase.js";

const $ = (id) => document.getElementById(id);
const form = $("signupForm");
const message = $("signupMessage");
const button = $("signupBtn");
const buttonText = button?.querySelector("span");
const buttonLoader = button?.querySelector(".btn-loader");

function normalizeDigits(value = "") {
  return String(value).replace(/[۰-۹]/g, d => "۰۱۲۳۴۵۶۷۸۹".indexOf(d))
    .replace(/[٠-٩]/g, d => "٠١٢٣٤٥٦٧٨٩".indexOf(d));
}

function normalizePhone(value = "") {
  let p = normalizeDigits(value).replace(/[^\d+]/g, "");
  if (p.startsWith("+98")) p = "0" + p.slice(3);
  if (p.startsWith("0098")) p = "0" + p.slice(4);
  if (!/^09\d{9}$/.test(p)) throw new Error("شماره موبایل باید یک شماره معتبر ایرانی باشد.");
  return p;
}

function showMessage(text, type = "error") {
  message.hidden = false;
  message.className = `form-message ${type}`;
  message.textContent = text;
}

function setLoading(loading) {
  button.disabled = loading;
  buttonText.textContent = loading ? "در حال ساخت حساب..." : "ثبت‌نام";
  buttonLoader.hidden = !loading;
}

function readableError(error) {
  const text = String(error?.message || error || "");
  if (/already registered|already exists|User already registered/i.test(text))
    return "این شماره یا ایمیل قبلاً ثبت شده است. از صفحه ورود استفاده کن.";
  if (/invalid.*email/i.test(text)) return "فرمت ایمیل صحیح نیست.";
  if (/password/i.test(text) && /weak|short/i.test(text))
    return "رمز عبور باید حداقل ۸ کاراکتر باشد.";
  if (/rate limit|too many/i.test(text))
    return "تعداد تلاش‌ها زیاد بوده. چند دقیقه بعد دوباره امتحان کن.";
  return text || "ثبت‌نام انجام نشد. دوباره تلاش کن.";
}

form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  message.hidden = true;

  try {
    const firstName = $("firstName").value.trim();
    const lastName = $("lastName").value.trim();
    const phone = normalizePhone($("phone").value);
    const email = $("email").value.trim().toLowerCase();
    const password = $("password").value;
    const password2 = $("password2").value;

    if (!firstName || !lastName) throw new Error("نام و نام خانوادگی را کامل وارد کن.");
    if (password.length < 8) throw new Error("رمز عبور باید حداقل ۸ کاراکتر باشد.");
    if (password !== password2) throw new Error("تکرار رمز عبور با رمز اصلی یکسان نیست.");
    if (!$("terms").checked) throw new Error("برای ادامه باید قوانین را بپذیری.");

    setLoading(true);

    const result = await signUpCustomer({
      firstName, lastName, phone, email: email || null, password
    });

    const error = result?.error;
    if (error) throw error;

    const user = result?.data?.user || result?.user || await getCurrentUser();

    if (user) {
      showMessage("ثبت‌نام با موفقیت انجام شد. در حال انتقال به پروفایل...", "success");
      setTimeout(() => location.href = "profile.html", 700);
      return;
    }

    showMessage(
      "حساب ساخته شد. اگر تأیید ایمیل یا کد پیامکی برای پروژه فعال باشد، ابتدا آن را تأیید کن و سپس از صفحه ورود وارد شو.",
      "success"
    );
    setLoading(false);
  } catch (error) {
    console.error(error);
    showMessage(readableError(error), "error");
    setLoading(false);
  }
});
