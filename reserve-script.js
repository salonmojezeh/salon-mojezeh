// ==========================================
// سالن معجزه
// reserve-script.js
// نسخه نهایی
// ==========================================

import { db } from "./firebase.js";

import {

collection,
query,
where,
getDocs,
addDoc,
Timestamp

}

from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";



// ==========================================
// تنظیمات
// ==========================================

const START_HOUR = 9;

const END_HOUR = 21;

const DAYS_TO_SHOW = 30;



// ==========================================
// اطلاعات رزرو
// ==========================================

const reserveData = {

firstName: "",

lastName: "",

phone: "",

service: "",

date: "",

time: ""

};



// ==========================================
// وضعیت مراحل
// ==========================================

let currentStep = 1;

const totalSteps = 4;

let reservedTimes = [];



// ==========================================
// عناصر صفحه
// ==========================================

const form = document.getElementById("reserveForm");

const progressFill = document.getElementById("progressFill");

const nextBtn = document.getElementById("nextBtn");

const prevBtn = document.getElementById("prevBtn");

const submitBtn = document.getElementById("submitBtn");

const calendar = document.getElementById("calendar");

const timesGrid = document.getElementById("timesGrid");

const loadingBox = document.getElementById("loadingBox");

const successModal = document.getElementById("successModal");

const successDetails = document.getElementById("successDetails");



// ==========================================
// شروع برنامه
// ==========================================

document.addEventListener("DOMContentLoaded", () => {

generateCalendar();

setupServiceCards();

setupForm();

updateStep();

});
// ==========================================
// بروزرسانی مراحل
// ==========================================

function updateStep() {

    // مخفی کردن همه مراحل
    document.querySelectorAll(".steps").forEach(step => {

        step.classList.remove("active");

    });

    // نمایش مرحله فعلی
    document
        .getElementById(`step${currentStep}`)
        .classList.add("active");


    // Progress Bar
    progressFill.style.width =
        `${(currentStep / totalSteps) * 100}%`;


    // دکمه قبلی
    prevBtn.disabled = currentStep === 1;


    // دکمه بعدی یا ثبت
    if (currentStep === totalSteps) {

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


    saveCurrentStep();


    // وقتی وارد مرحله ساعت می‌شویم
    if (currentStep === 3) {

        showLoading(true);

        await loadReservedTimes();

        createTimeButtons();

        showLoading(false);

    }


    if (currentStep < totalSteps) {

        currentStep++;

        updateStep();

    }

};



// ==========================================
// مرحله قبل
// ==========================================

window.prevStep = function () {

    if (currentStep === 1) return;

    currentStep--;

    updateStep();

};
// ==========================================
// اعتبارسنجی مراحل
// ==========================================

function validateCurrentStep() {

    switch (currentStep) {

        case 1:

            if (
                document
                .getElementById("firstName")
                .value
                .trim() === ""
            ) {

                alert("نام را وارد کنید.");

                return false;

            }

            if (
                document
                .getElementById("lastName")
                .value
                .trim() === ""
            ) {

                alert("نام خانوادگی را وارد کنید.");

                return false;

            }

            const phone =
                document
                .getElementById("phone")
                .value
                .trim();

            if (!/^09\d{9}$/.test(phone)) {

                alert("شماره موبایل صحیح نیست.");

                return false;

            }

            return true;



        case 2:

            if (reserveData.service === "") {

                alert("لطفاً یک خدمت انتخاب کنید.");

                return false;

            }

            return true;



        case 3:

            if (reserveData.date === "") {

                alert("لطفاً یک روز انتخاب کنید.");

                return false;

            }

            return true;



        case 4:

            if (reserveData.time === "") {

                alert("لطفاً یک ساعت انتخاب کنید.");

                return false;

            }

            return true;

    }

    return true;

}



// ==========================================
// ذخیره اطلاعات مرحله
// ==========================================

function saveCurrentStep() {

    switch (currentStep) {

        case 1:

            reserveData.firstName =
                document
                .getElementById("firstName")
                .value
                .trim();

            reserveData.lastName =
                document
                .getElementById("lastName")
                .value
                .trim();

            reserveData.phone =
                document
                .getElementById("phone")
                .value
                .trim();

        break;



        case 2:

            const service = document.querySelector(

                'input[name="service"]:checked'

            );

            reserveData.service =

                service ? service.value : "";

        break;



        case 3:

            const date = document.querySelector(

                'input[name="date"]:checked'

            );

            reserveData.date =

                date ? date.value : "";

        break;



        case 4:

            const time = document.querySelector(

                'input[name="time"]:checked'

            );

            reserveData.time =

                time ? time.value : "";

        break;

    }

}
// ==========================================
// ساخت تقویم ۳۰ روز آینده
// ==========================================

function generateCalendar() {

    calendar.innerHTML = "";

    const today = new Date();

    for (let i = 0; i < DAYS_TO_SHOW; i++) {

        const date = new Date(today);

        date.setDate(today.getDate() + i);

        const value =
            date.toISOString().split("T")[0];

        const weekDay =
            date.toLocaleDateString("fa-IR", {
                weekday: "short"
            });

        const day =
            date.toLocaleDateString("fa-IR", {
                day: "numeric",
                month: "numeric"
            });

        const label =
            document.createElement("label");

        label.className = "day-option";

        label.innerHTML = `

            <input
                type="radio"
                name="date"
                value="${value}">

            <span>

                ${weekDay}

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

                reserveData.date = input.value;

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

}



// ==========================================
// انتخاب خدمت
// ==========================================

function setupServiceCards() {

    document
        .querySelectorAll('input[name="service"]')
        .forEach(input => {

            input.addEventListener("change", () => {

                reserveData.service = input.value;

                document
                    .querySelectorAll(".service-option")
                    .forEach(item =>
                        item.classList.remove("selected")
                    );

                input
                    .closest(".service-option")
                    .classList.add("selected");

            });

        });

}



// ==========================================
// نمایش Loading
// ==========================================

function showLoading(show) {

    if (show) {

        loadingBox.classList.add("show");

    } else {

        loadingBox.classList.remove("show");

    }

}
// ==========================================
// دریافت ساعت‌های رزرو شده از Firebase
// ==========================================

async function loadReservedTimes() {

    reservedTimes = [];

    if (reserveData.date === "") return;

    try {

        const q = query(

            collection(db, "reservations"),

            where("date", "==", reserveData.date)

        );

        const snapshot = await getDocs(q);

        snapshot.forEach(doc => {

            reservedTimes.push(doc.data().time);

        });

    }

    catch (error) {

        console.error(error);

    }

}



// ==========================================
// ساخت ساعت‌ها
// ==========================================

function createTimeButtons() {

    timesGrid.innerHTML = "";

    for (

        let hour = START_HOUR;

        hour <= END_HOUR;

        hour++

    ) {

        const time =

            String(hour).padStart(2, "0") + ":00";



        const reserved =

            reservedTimes.includes(time);



        const label =

            document.createElement("label");



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

                reserveData.time = input.value;



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
// ثبت رزرو
// ==========================================

async function saveReservation(e) {

    e.preventDefault();

    if (!validateCurrentStep()) return;

    showLoading(true);

    try {

        // بررسی دوباره رزرو نبودن ساعت
        await loadReservedTimes();

        if (reservedTimes.includes(reserveData.time)) {

            showLoading(false);

            alert("این ساعت چند لحظه قبل رزرو شده است.");

            createTimeButtons();

            return;

        }

        await addDoc(

            collection(db, "reservations"),

            {

                name:
                    reserveData.firstName +
                    " " +
                    reserveData.lastName,

                phone: reserveData.phone,

                service: reserveData.service,

                date: reserveData.date,

                time: reserveData.time,

                status: "reserved",

                createdAt: Timestamp.now()

            }

        );

        showLoading(false);

        showSuccess();

    }

    catch(error){

        showLoading(false);

        console.error(error);

        alert("ثبت رزرو انجام نشد.");

    }

}



// ==========================================
// پیام موفقیت
// ==========================================

function showSuccess(){

    successDetails.innerHTML = `

    <strong>

    ${reserveData.firstName}
    ${reserveData.lastName}

    </strong>

    <br><br>

    خدمت :

    ${reserveData.service}

    <br>

    تاریخ :

    ${reserveData.date}

    <br>

    ساعت :

    ${reserveData.time}

    `;

    successModal.classList.add("show");

}



// ==========================================
// فرم
// ==========================================

function setupForm(){

    form.addEventListener(

        "submit",

        saveReservation

    );

}



// ==========================================
// دکمه های مودال
// ==========================================

window.goHome = function(){

    location.href="index.html";

}

window.contactSalon = function(){

    location.href="tel:09380449987";

}



// ==========================================
// منوی سه خطی
// ==========================================

window.openSidebar=function(){

    document

    .getElementById("sidebar")

    .classList.add("active");

    document

    .getElementById("overlay")

    .classList.add("active");

}



window.closeSidebar=function(){

    document

    .getElementById("sidebar")

    .classList.remove("active");

    document

    .getElementById("overlay")

    .classList.remove("active");

}



// ==========================================
// پایان فایل
// ==========================================
