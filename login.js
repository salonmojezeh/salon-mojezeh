import {
    signIn,
    getCurrentProfile
} from "./supabase.js";


const loginForm = document.getElementById("loginForm");
const identifierInput = document.getElementById("identifier");
const passwordInput = document.getElementById("password");
const loginBtn = document.getElementById("loginBtn");
const loginMessage = document.getElementById("loginMessage");
const togglePassword = document.getElementById("togglePassword");


/* =========================================
   Message
   ========================================= */

function showMessage(message, type = "error") {
    loginMessage.textContent = message;
    loginMessage.className = `login-message show ${type}`;
}


function clearMessage() {
    loginMessage.textContent = "";
    loginMessage.className = "login-message";
}


/* =========================================
   Loading
   ========================================= */

function setLoading(isLoading) {
    loginBtn.disabled = isLoading;

    if (isLoading) {
        loginBtn.innerHTML = `
            <i class="fa-solid fa-spinner fa-spin"></i>
            <span>در حال ورود...</span>
        `;
    } else {
        loginBtn.innerHTML = `
            <span class="login-btn-text">ورود</span>
            <i class="fa-solid fa-arrow-left"></i>
        `;
    }
}


/* =========================================
   Password visibility
   ========================================= */

togglePassword?.addEventListener("click", () => {

    const isPassword = passwordInput.type === "password";

    passwordInput.type = isPassword ? "text" : "password";

    togglePassword.innerHTML = isPassword
        ? `<i class="fa-solid fa-eye-slash"></i>`
        : `<i class="fa-solid fa-eye"></i>`;

    togglePassword.setAttribute(
        "aria-label",
        isPassword ? "مخفی کردن رمز عبور" : "نمایش رمز عبور"
    );
});


/* =========================================
   Enter key / validation
   ========================================= */

function validateForm() {

    const identifier = identifierInput.value.trim();
    const password = passwordInput.value;

    if (!identifier) {
        showMessage("لطفاً شماره موبایل یا ایمیل خود را وارد کنید.");
        identifierInput.focus();
        return false;
    }

    if (!password) {
        showMessage("لطفاً رمز عبور خود را وارد کنید.");
        passwordInput.focus();
        return false;
    }

    if (password.length < 6) {
        showMessage("رمز عبور باید حداقل ۶ کاراکتر باشد.");
        passwordInput.focus();
        return false;
    }

    return true;
}


/* =========================================
   Supabase error handling
   ========================================= */

function getLoginErrorMessage(error) {

    const message = String(error?.message || "").toLowerCase();

    if (
        message.includes("invalid login credentials") ||
        message.includes("invalid credentials")
    ) {
        return "شماره موبایل/ایمیل یا رمز عبور اشتباه است.";
    }

    if (
        message.includes("email not confirmed") ||
        message.includes("email_not_confirmed")
    ) {
        return "ایمیل هنوز تأیید نشده است.";
    }

    if (
        message.includes("phone not confirmed") ||
        message.includes("phone_not_confirmed")
    ) {
        return "شماره موبایل هنوز تأیید نشده است.";
    }

    if (
        message.includes("phone provider") ||
        message.includes("phone sign-ins are disabled")
    ) {
        return "ورود با شماره موبایل در تنظیمات Supabase فعال نشده است.";
    }

    if (
        message.includes("email provider") ||
        message.includes("email sign-ins are disabled")
    ) {
        return "ورود با ایمیل در تنظیمات Supabase فعال نشده است.";
    }

    if (
        message.includes("rate limit") ||
        message.includes("too many requests")
    ) {
        return "تعداد تلاش‌های ورود زیاد است. کمی بعد دوباره امتحان کنید.";
    }

    if (
        message.includes("network") ||
        message.includes("fetch")
    ) {
        return "ارتباط با سرور برقرار نشد. اتصال اینترنت را بررسی کنید.";
    }

    return "ورود انجام نشد. لطفاً اطلاعات واردشده را بررسی کنید.";
}


/* =========================================
   Login
   ========================================= */

loginForm?.addEventListener("submit", async (event) => {

    event.preventDefault();

    clearMessage();

    if (!validateForm()) {
        return;
    }

    const identifier = identifierInput.value.trim();
    const password = passwordInput.value;

    setLoading(true);

    try {

        await signIn(identifier, password);

        /*
         * Profile is read after successful authentication.
         * This also confirms that the user's profile is available.
         */
        let profile = null;

        try {
            profile = await getCurrentProfile();
        } catch (profileError) {
            console.warn(
                "Profile could not be loaded immediately:",
                profileError
            );
        }

        showMessage("ورود با موفقیت انجام شد.", "success");

        /*
         * Small delay so the success message can be seen.
         */
        setTimeout(() => {

            /*
             * All authenticated users enter the unified profile page.
             * profile.html decides whether the user is customer,
             * barber or admin.
             */
            window.location.href = "profile.html";

        }, 450);

    } catch (error) {

        console.error("Login error:", error);

        showMessage(getLoginErrorMessage(error));

        setLoading(false);
    }
});


/* =========================================
   Clear message while typing
   ========================================= */

identifierInput?.addEventListener("input", clearMessage);
passwordInput?.addEventListener("input", clearMessage);
