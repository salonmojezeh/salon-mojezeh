// ==========================================
// Salon Mojezeh
// Login System
// ==========================================


"use strict";



import {

    signIn,

    getCurrentProfile

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
// Login Submit
// ==========================================


loginForm.addEventListener(

    "submit",

    async (event) => {


        event.preventDefault();


        const email =
            emailInput.value
                .trim();


        const password =
            passwordInput.value;


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


            loginBtn.disabled = true;


            loginBtn.innerHTML = `

                <i class="fa-solid fa-spinner fa-spin"></i>

                در حال ورود...

            `;


            showMessage(
                ""
            );


            // Login

            await signIn(
                email,
                password
            );


            // Get Profile

            const result =
                await getCurrentProfile();


            if (
                !result ||
                !result.profile
            ) {

                throw new Error(
                    "پروفایل کاربری پیدا نشد."
                );

            }


            showMessage(

                "ورود موفق بود. در حال انتقال...",

                "success"

            );


            // Redirect

            setTimeout(() => {


                window.location.href =
                    "profile.html";


            }, 700);


        } catch (error) {


            console.error(
                "Login error:",
                error
            );


            let message =
                "خطا در ورود به حساب.";


            if (
                error.message
                    .includes(
                        "Invalid login credentials"
                    )
            ) {

                message =
                    "ایمیل یا رمز عبور اشتباه است.";

            }


            if (
                error.message
                    .includes(
                        "Email not confirmed"
                    )
            ) {

                message =
                    "ایمیل هنوز تأیید نشده است.";

            }


            showMessage(
                message
            );


        } finally {


            loginBtn.disabled = false;


            loginBtn.innerHTML = `

                <i class="fa-solid fa-right-to-bracket"></i>

                ورود به حساب

            `;


        }


    }

);
