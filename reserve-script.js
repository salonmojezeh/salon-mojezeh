/*==========================================
    Salon Mojezeh
    reserve-script.js
    Version 1.0 Final
==========================================*/

"use strict";

/*==========================================
    Firebase
==========================================*/

import {
    db
} from "./firebase.js";

import {
    collection,
    addDoc,
    getDocs,
    query,
    where,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
    SERVICES,
    WORKING_HOURS
} from "./data/config.js";

/*==========================================
    Elements
==========================================*/

const reserveForm = document.getElementById("reserveForm");

const progressFill = document.getElementById("progressFill");

const nextBtn = document.getElementById("nextBtn");

const prevBtn = document.getElementById("prevBtn");

const submitBtn = document.getElementById("submitBtn");

const successModal = document.getElementById("successModal");

const successDetails = document.getElementById("successDetails");

const firstNameInput = document.getElementById("firstName");

const lastNameInput = document.getElementById("lastName");

const phoneInput = document.getElementById("phone");

const calendar = document.getElementById("calendar");

const timesGrid = document.getElementById("timesGrid");

/*==========================================
    Steps
==========================================*/

const steps = document.querySelectorAll(".steps");

let currentStep = 1;

const totalSteps = 4;

/*==========================================
    Reservation Data
==========================================*/

let selectedService = null;

let selectedDate = null;

let selectedTime = null;

/*==========================================
    Firebase Data
==========================================*/

let reservations = [];

/*==========================================
    Persian Week Days
==========================================*/

const weekDays = [

    "یکشنبه",

    "دوشنبه",

    "سه‌شنبه",

    "چهارشنبه",

    "پنجشنبه",

    "جمعه",

    "شنبه"

];

/*==========================================
    Persian Months
==========================================*/

const months = [

    "فروردین",

    "اردیبهشت",

    "خرداد",

    "تیر",

    "مرداد",

    "شهریور",

    "مهر",

    "آبان",

    "آذر",

    "دی",

    "بهمن",

    "اسفند"

];

/*==========================================
    Phone Validation
==========================================*/

function isValidPhone(phone) {

    const regex = /^09\d{9}$/;

    return regex.test(phone);

}

/*==========================================
    Loader
==========================================*/

function showLoading() {

    submitBtn.disabled = true;

    submitBtn.innerHTML = `

        <i class="fa-solid fa-spinner fa-spin"></i>

        در حال ثبت...

    `;

}

function hideLoading() {

    submitBtn.disabled = false;

    submitBtn.innerHTML = `

        <i class="fa-solid fa-check"></i>

        ثبت رزرو

    `;

}

/*==========================================
    Progress Bar
==========================================*/

function updateProgress() {

    const percent =

        ((currentStep - 1) / (totalSteps - 1)) * 100;

    progressFill.style.width = percent + "%";

}

console.log("Reserve Script Loaded");
/* =========================================================
   PART 2
   ساخت ۳۰ روز آینده و انتخاب روز
========================================================= */

function createCalendar() {

    calendar.innerHTML = "";

    const today = new Date();

    for (let i = 0; i < 30; i++) {

        const date = new Date(today);
        date.setDate(today.getDate() + i);

        const weekday = weekDays[date.getDay()];

        const day = date.toLocaleDateString("fa-IR-u-nu-latn", {
            day: "numeric"
        });

        const month = date.toLocaleDateString("fa-IR-u-nu-latn", {
            month: "long"
        });

        const year = date.toLocaleDateString("fa-IR-u-nu-latn", {
            year: "numeric"
        });

        const item = document.createElement("label");

        item.className = "day-option";

        item.innerHTML = `
            <input
                type="radio"
                name="day"
                value="${year}/${month}/${day}"
            >

            <div class="day-week">
                ${weekday}
            </div>

            <div class="day-date">
                ${day}
            </div>

            <div class="day-month">
                ${month}
            </div>

            <div class="day-year">
                ${year}
            </div>
        `;

        calendar.appendChild(item);
    }

    document.querySelectorAll(".day-option").forEach(card => {

        card.addEventListener("click", function () {

            document
                .querySelectorAll(".day-option")
                .forEach(c => c.classList.remove("selected"));

            this.classList.add("selected");

            booking.day =
                this.querySelector("input").value;

        });

    });

}

/* =========================================================
   ساخت ساعت‌های کاری
========================================================= */

function createTimes() {

    timesGrid.innerHTML = "";

    for (let hour = 9; hour <= 21; hour++) {

        const text =
            String(hour).padStart(2, "0") + ":00";

        const card = document.createElement("label");

        card.className = "time-option available";

        card.innerHTML = `
            <input
                type="radio"
                name="time"
                value="${text}"
            >

            <span>${text}</span>
        `;

        timesGrid.appendChild(card);

    }

    document.querySelectorAll(".time-option").forEach(card => {

        card.addEventListener("click", function () {

            if (
                this.classList.contains("booked") ||
                this.classList.contains("holiday")
            ) return;

            document
                .querySelectorAll(".time-option")
                .forEach(c => c.classList.remove("selected"));

            this.classList.add("selected");

            booking.time =
                this.querySelector("input").value;

        });

    });

}
/* ==========================================
   ساخت روزهای قابل رزرو (30 روز آینده)
========================================== */

function generateDays() {

    const calendar = document.getElementById("calendar");
    calendar.innerHTML = "";

    const weekDays = [
        "یکشنبه",
        "دوشنبه",
        "سه شنبه",
        "چهارشنبه",
        "پنجشنبه",
        "جمعه",
        "شنبه"
    ];

    for (let i = 0; i < 30; i++) {

        const date = new Date();
        date.setDate(date.getDate() + i);

        const dayName = weekDays[date.getDay()];

        const day = date.getDate();

        const month = date.toLocaleDateString("fa-IR", {
            month: "long"
        });

        const year = date.toLocaleDateString("fa-IR", {
            year: "numeric"
        });

        const card = document.createElement("div");
        card.className = "day-card";

        card.innerHTML = `
            <div class="day-name">${dayName}</div>
            <div class="day-date">${day}</div>
            <div class="day-month">${month}</div>
            <div class="day-year">${year}</div>
        `;

        card.onclick = () => {

            document
                .querySelectorAll(".day-card")
                .forEach(item => item.classList.remove("selected"));

            card.classList.add("selected");

            booking.date = `${day} ${month} ${year}`;

        };

        calendar.appendChild(card);

    }

}


/* ==========================================
   ساخت ساعت‌های کاری
========================================== */

function generateTimes() {

    const grid = document.getElementById("timesGrid");

    grid.innerHTML = "";

    for (let hour = 9; hour <= 21; hour++) {

        const card = document.createElement("div");

        card.className = "time-card available";

        const label = `${hour}:00`;

        card.innerHTML = label;

        card.onclick = () => {

            if (card.classList.contains("booked")) return;

            document
                .querySelectorAll(".time-card")
                .forEach(item => item.classList.remove("selected"));

            card.classList.add("selected");

            booking.time = label;

        };

        grid.appendChild(card);

    }

}
/* ==========================================
   بارگذاری ساعت‌های رزرو شده
========================================== */

async function loadBookedTimes() {

    if (!booking.date) return;

    const snapshot = await db
        .collection("reservations")
        .where("date", "==", booking.date)
        .get();

    const booked = [];

    snapshot.forEach(doc => {
        booked.push(doc.data().time);
    });

    document.querySelectorAll(".time-card").forEach(card => {

        card.classList.remove("booked");

        if (booked.includes(card.innerText)) {

            card.classList.remove("available");
            card.classList.add("booked");

        }

    });

}


/* ==========================================
   ثبت رزرو
========================================== */

reserveForm.addEventListener("submit", async (e) => {

    e.preventDefault();

    if (!booking.firstName ||
        !booking.lastName ||
        !booking.phone ||
        !booking.service ||
        !booking.date ||
        !booking.time) {

        alert("تمام مراحل را تکمیل کنید.");
        return;

    }

    try {

        nextBtn.disabled = true;
        submitBtn.disabled = true;

        await db.collection("reservations").add({

            firstName: booking.firstName,
            lastName: booking.lastName,
            phone: booking.phone,

            service: booking.service,

            date: booking.date,

            time: booking.time,

            createdAt: firebase.firestore.FieldValue.serverTimestamp()

        });

        document.getElementById("successDetails").innerHTML = `

            <strong>نام:</strong>
            ${booking.firstName} ${booking.lastName}
            <br><br>

            <strong>خدمت:</strong>
            ${booking.service}
            <br><br>

            <strong>روز:</strong>
            ${booking.date}
            <br><br>

            <strong>ساعت:</strong>
            ${booking.time}

        `;

        successModal.classList.add("show");

        reserveForm.reset();

        booking = {};

        currentStep = 1;

        showStep(1);

        generateDays();

        generateTimes();

    } catch (err) {

        console.error(err);

        alert("خطا در ثبت رزرو.");

    } finally {

        nextBtn.disabled = false;
        submitBtn.disabled = false;

    }

});


/* ==========================================
   دکمه‌های پنجره موفقیت
========================================== */

function goHome() {

    window.location.href = "index.html";

}

function contactSalon() {

    window.location.href = "tel:09XXXXXXXXX";

}


/* ==========================================
   شروع برنامه
========================================== */

generateDays();

generateTimes();

updateProgress();

showStep(1);
