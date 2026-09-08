// ==========================================
// Salon Mojezeh
// Login System
// ==========================================

"use strict";


import {

    signIn,

    getCurrentUserProfile

} from "./supabase.js";



// ==========================================
// Elements
// ==========================================

const loginForm =
    document.getElementById("loginForm");


const emailInput =
    document.getElementById("email");


const passwordInput =
    document.getElementById("password");


const loginBtn =
    document.getElementById("loginBtn");


const loginMessage =
    document.getElementById("loginMessage");


const passwordToggle =
    document.getElementById("passwordToggle");


const passwordToggleIcon =
    document.getElementById("passwordToggleIcon");


const themeToggle =
    document.getElementById("themeToggle");


const themeIcon =
    document.getElementById("themeIcon");



// ==========================================
// Theme
// ==========================================

function loadTheme() {


    const savedTheme =
        localStorage.getItem(
            "salon-theme"
        );


    if (
        savedTheme === "light"
    ) {

        document.body.classList.add(
            "light-mode"
        );

        themeIcon.className =
            "fa-solid fa-sun";

    }

}


function toggleTheme() {


    document.body.classList.toggle(
        "light-mode"
    );


    const isLight =
        document.body.classList.contains(
            "light-mode"
        );


    localStorage.setItem(

        "salon-theme",

        isLight
            ? "light"
            : "dark"

    );


    themeIcon.className =
        isLight
            ? "fa-solid fa-sun"
            : "fa-solid fa-moon";

}


loadTheme();


themeToggle.addEventListener(

    "click",

    toggleTheme

);



// ==========================================
// Password Toggle
// ==========================================

passwordToggle.addEventListener(

    "click",

    () => {


        const isPassword =

            passwordInput.type ===
            "password";


        passwordInput.type =

            isPassword
                ? "text"
                : "password";


        passwordToggleIcon.className =

            isPassword
                ? "fa-solid fa-eye-slash"
                : "fa-solid fa-eye";


    }

);



// ==========================================
// Show Message
// ==========================================

function showMessage(
    message,
    type = "error"
) {


    loginMessage.textContent =
        message;


    loginMessage.className =
        "login-message";


    if (
        type === "success"
    ) {

        loginMessage.classList.add(
            "success"
        );

    }

}



// ==========================================
// Set Loading
// ==========================================

function setLoading(
    loading
) {


    loginBtn.disabled =
        loading;


    if (
        loading
    ) {

        loginBtn.innerHTML = `

            <i class="fa-solid fa-spinner fa-spin"></i>

            <span>

                در حال ورود...

            </span>

        `;

    }

    else {

        loginBtn.innerHTML = `

            <i class="fa-solid fa-right-to-bracket"></i>

            <span>

                ورود به حساب

            </span>

        `;

    }

}



// ==========================================
// Login Submit
// ==========================================

loginForm.addEventListener(

    "submit",

    async (event) => {


        event.preventDefault();


        const email =

            emailInput.value
                .trim()
                .toLowerCase();


        const password =

            passwordInput.value;


        // Validation

        if (
            !email ||
            !password
        ) {

            showMessage(
                "لطفاً ایمیل و رمز عبور را وارد کنید."
            );

            return;

        }


        try {


            setLoading(
                true
            );


            showMessage(
                ""
            );


            // ==================================
            // Sign In
            // ==================================

            const result =

                await signIn(
                    email,
                    password
                );


            if (
                !result ||
                !result.user
            ) {

                throw new Error(
                    "ورود به حساب انجام نشد."
                );

            }


            // ==================================
            // Get Profile
            // ==================================

            const profile =

                await getCurrentUserProfile();


            // اگر هنوز پروفایل ساخته نشده
            // ورود موفق است ولی پروفایل باید
            // در صفحه پروفایل مدیریت شود

            console.log(
                "Login user:",
                result.user
            );


            console.log(
                "User profile:",
                profile
            );


            showMessage(

                "ورود موفق بود. در حال انتقال...",

                "success"

            );


            // ==================================
            // Redirect
            // ==================================

            setTimeout(

                () => {


                    window.location.href =
                        "profile.html";


                },

                700

            );


        }

        catch (
            error
        ) {


            console.error(
                "Login error:",
                error
            );


            let message =
                "خطا در ورود به حساب.";


            const errorText =
                error.message || "";


            if (

                errorText.includes(
                    "Invalid login credentials"
                )

            ) {

                message =
                    "ایمیل یا رمز عبور اشتباه است.";

            }


            else if (

                errorText.includes(
                    "Email not confirmed"
                )

            ) {

                message =
                    "ایمیل هنوز تأیید نشده است.";

            }


            else if (

                errorText.includes(
                    "User not found"
                )

            ) {

                message =
                    "کاربری با این اطلاعات پیدا نشد.";

            }


            else if (
                errorText
            ) {

                message =
                    errorText;

            }


            showMessage(
                message
            );


        }

        finally {


            setLoading(
                false
            );


        }


    }

);
