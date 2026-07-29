// ==========================================
// سالن معجزه
// reserve-script.js
// نسخه نهایی 3.0
// ==========================================

import { db } from "./firebase.js";

import {
    collection,
    addDoc,
    getDocs,
    query,
    where,
    Timestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// ==========================================
// تنظیمات
// ==========================================

const START_HOUR = 9;
const END_HOUR = 21;
const DAYS_TO_SHOW = 30;


// ==========================================
// متغیرهای اصلی
// ==========================================

let currentStep = 1;

let selectedService = "";
let selectedDate = "";
let selectedTime = "";

let reservedTimes = [];


// ==========================================
// عناصر صفحه
// ==========================================

const reserveForm = document.getElementById("reserveForm");

const progressFill = document.getElementById("progressFill");

const nextBtn = document.getElementById("nextBtn");

const prevBtn = document.getElementById("prevBtn");

const submitBtn = document.getElementById("submitBtn");

const calendar = document.getElementById("calendar");

const timesGrid = document.getElementById("timesGrid");

const successModal = document.getElementById("successModal");

const successDetails = document.getElementById("successDetails");


// ==========================================
// اطلاعات مشتری
// ==========================================

const firstNameInput = document.getElementById("firstName");

const lastNameInput = document.getElementById("lastName");

const phoneInput = document.getElementById("phone");


// ==========================================
// شروع برنامه
// ==========================================

document.addEventListener("DOMContentLoaded", () => {

    updateProgress();

    generateCalendar();

    setupServiceSelection();

    setupForm();

});


// ==========================================
// نوار پیشرفت
// ==========================================

function updateProgress() {

    progressFill.style.width = `${currentStep * 25}%`;

    document
        .querySelectorAll(".steps")
        .forEach(step => step.classList.remove("active"));

    document
        .getElementById(`step${currentStep}`)
        .classList.add("active");

    prevBtn.disabled = currentStep === 1;

    if (currentStep === 4) {

        nextBtn.style.display = "none";

        submitBtn.style.display = "block";

    } else {

        nextBtn.style.display = "flex";

        submitBtn.style.display = "none";

    }

}


// ==========================================
// مرحله بعد
// ==========================================

window.nextStep = async function () {

    if (!validateCurrentStep()) return;

    if (currentStep === 3) {

        await loadReservedTimes();

        createTimeButtons();

    }

    currentStep++;

    updateProgress();

};


// ==========================================
// مرحله قبل
// ==========================================

window.prevStep = function () {

    if (currentStep === 1) return;

    currentStep--;

    updateProgress();

};
// ==========================================
// اعتبارسنجی مراحل
// ==========================================

function validateCurrentStep() {

    switch (currentStep) {

        case 1:

            if (firstNameInput.value.trim() === "") {
                alert("نام را وارد کنید.");
                firstNameInput.focus();
                return false;
            }

            if (lastNameInput.value.trim() === "") {
                alert("نام خانوادگی را وارد کنید.");
                lastNameInput.focus();
                return false;
            }

            const phone = phoneInput.value.trim();

            if (!/^09\d{9}$/.test(phone)) {
                alert("شماره موبایل صحیح نیست.");
                phoneInput.focus();
                return false;
            }

            return true;


        case 2:

            if (selectedService === "") {
                alert("لطفاً یک خدمت انتخاب کنید.");
                return false;
            }

            return true;


        case 3:

            if (selectedDate === "") {
                alert("لطفاً یک روز انتخاب کنید.");
                return false;
            }

            return true;


        case 4:

            if (selectedTime === "") {
                alert("لطفاً یک ساعت انتخاب کنید.");
                return false;
            }

            return true;

    }

    return true;

}


// ==========================================
// انتخاب خدمت
// ==========================================

function setupServiceSelection() {

    const radios = document.querySelectorAll(
        'input[name="service"]'
    );

    radios.forEach(radio => {

        radio.addEventListener("change", () => {

            selectedService = radio.value;

            document
                .querySelectorAll(".service-option")
                .forEach(item => item.classList.remove("selected"));

            radio
                .closest(".service-option")
                .classList.add("selected");

        });

    });

}


// ==========================================
// تولید تقویم
// ==========================================

function generateCalendar() {

    calendar.innerHTML = "";

    const today = new Date();

    for (let i = 0; i < DAYS_TO_SHOW; i++) {

        const date = new Date(today);

        date.setDate(today.getDate() + i);

        const value = date.toISOString().split("T")[0];

        const weekday = date.toLocaleDateString(
            "fa-IR",
            { weekday: "short" }
        );

        const day = date.toLocaleDateString(
            "fa-IR",
            {
                day: "numeric",
                month: "numeric"
            }
        );

        const label = document.createElement("label");

        label.className = "day-option";

        label.innerHTML = `
            <input
                type="radio"
                name="date"
                value="${value}">
            <span>
                ${weekday}
                <br>
                ${day}
            </span>
        `;

        calendar.appendChild(label);

    }

    setupDateSelection();

}


// ==========================================
// انتخاب روز
// ==========================================

function setupDateSelection() {

    document
        .querySelectorAll('input[name="date"]')
        .forEach(input => {

            input.addEventListener("change", () => {

                selectedDate = input.value;

                document
                    .querySelectorAll(".day-option")
                    .forEach(item =>
                        item.classList.remove("selected")
                    );

                input
                    .closest(".day-option")
                    .classList.add("selected");

            });

        });

}// ==========================================
// دریافت ساعت‌های رزرو شده از Firebase
// ==========================================

async function loadReservedTimes() {

    reservedTimes = [];

    if (selectedDate === "") return;

    try {

        const q = query(
            collection(db, "reservations"),
            where("date", "==", selectedDate)
        );

        const snapshot = await getDocs(q);

        snapshot.forEach(doc => {

            const data = doc.data();

            reservedTimes.push(data.time);

        });

    } catch (error) {

        console.error("خطا در دریافت ساعت‌ها", error);

    }

}


// ==========================================
// ساخت ساعت‌ها
// ==========================================

function createTimeButtons() {

    timesGrid.innerHTML = "";

    for (let hour = START_HOUR; hour <= END_HOUR; hour++) {

        const time =
            String(hour).padStart(2, "0") + ":00";

        const label = document.createElement("label");

        const reserved =
            reservedTimes.includes(time);

        label.className =
            reserved
                ? "time-option booked"
                : "time-option available";

        label.innerHTML = `
            <input
                type="radio"
                name="time"
                value="${time}"
                ${reserved ? "disabled" : ""}
            >

            <span>${time}</span>
        `;

        timesGrid.appendChild(label);

    }

    setupTimeSelection();

}


// ==========================================
// انتخاب ساعت
// ==========================================

function setupTimeSelection() {

    document
        .querySelectorAll('input[name="time"]')
        .forEach(input => {

            input.addEventListener("change", () => {

                selectedTime = input.value;

                document
                    .querySelectorAll(".time-option")
                    .forEach(item =>
                        item.classList.remove("selected")
                    );

                input
                    .closest(".time-option")
                    .classList.add("selected");

            });

        });

}


// ==========================================
// آماده‌سازی فرم
// ==========================================

function setupForm() {

    reserveForm.addEventListener(
        "submit",
        saveReservation
    );

}
// ==========================================
// ثبت رزرو در Firebase
// ==========================================

async function saveReservation(e) {

    e.preventDefault();

    if (!validateCurrentStep()) return;

    try {

        // دوباره بررسی می‌کنیم که کسی همزمان همان ساعت را رزرو نکرده باشد

        await loadReservedTimes();

        if (reservedTimes.includes(selectedTime)) {

            alert("این ساعت توسط شخص دیگری رزرو شده است.");

            createTimeButtons();

            return;

        }

        await addDoc(collection(db, "reservations"), {

            firstName: firstNameInput.value.trim(),

            lastName: lastNameInput.value.trim(),

            phone: phoneInput.value.trim(),

            service: selectedService,

            date: selectedDate,

            time: selectedTime,

            status: "در انتظار",

            createdAt: Timestamp.now()

        });

        showSuccess();

    }

    catch (error) {

        console.error(error);

        alert("خطا در ثبت رزرو");

    }

}



// ==========================================
// نمایش پیام موفقیت
// ==========================================

function showSuccess() {

    successDetails.innerHTML = `

        <strong>

        ${firstNameInput.value}

        ${lastNameInput.value}

        </strong>

        <br><br>

        خدمت :

        ${selectedService}

        <br>

        تاریخ :

        ${selectedDate}

        <br>

        ساعت :

        ${selectedTime}

    `;

    successModal.classList.add("show");

}



// ==========================================
// بازگشت به صفحه اصلی
// ==========================================

window.goHome = function () {

    location.href = "index.html";

};



// ==========================================
// تماس با سالن
// ==========================================

window.contactSalon = function () {

    window.location.href = "tel:+989123456789";

};



// ==========================================
// منوی سه خط
// ==========================================

window.openSidebar = function () {

    document
        .getElementById("sidebar")
        .classList.add("active");

    document
        .getElementById("overlay")
        .classList.add("active");

};



window.closeSidebar = function () {

    document
        .getElementById("sidebar")
        .classList.remove("active");

    document
        .getElementById("overlay")
        .classList.remove("active");

};



// ==========================================
// پایان فایل
// ==========================================
