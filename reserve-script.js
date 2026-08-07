/*======================================
    Salon Mojezeh
    reserve-script.js
    Final Reservation System
    Part 1 / 4
======================================*/

"use strict";

/*
|--------------------------------------------------------------------------
| Imports
|--------------------------------------------------------------------------
*/

import { db } from "./firebase.js";

import RESERVATION_CONFIG from "./data/config.js";

import {
    collection,
    query,
    where,
    getDocs,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


/*
|--------------------------------------------------------------------------
| Configuration
|--------------------------------------------------------------------------
*/

const CONFIG = RESERVATION_CONFIG;

const SERVICES = CONFIG.services;

const WORKING_HOURS = CONFIG.workingHours;

const CALENDAR_CONFIG = CONFIG.calendar;

const BOOKING_CONFIG = CONFIG.booking;


/*
|--------------------------------------------------------------------------
| DOM Elements
|--------------------------------------------------------------------------
*/

const reserveForm = document.getElementById("reserveForm");

const firstNameInput = document.getElementById("firstName");

const lastNameInput = document.getElementById("lastName");

const phoneInput = document.getElementById("phone");

const progressBar = document.getElementById("progressBar");

const daysContainer = document.getElementById("daysContainer");

const timesContainer = document.getElementById("timesContainer");

const prevBtn = document.getElementById("prevBtn");

const nextBtn = document.getElementById("nextBtn");

const submitBtn = document.getElementById("submitBtn");

const successModal = document.getElementById("successModal");

const successDetails = document.getElementById("successDetails");


/*
|--------------------------------------------------------------------------
| Reservation State
|--------------------------------------------------------------------------
*/

let currentStep = 1;

const totalSteps = 4;

let selectedService = null;

let selectedDay = null;

let selectedTime = null;

let bookedTimes = new Set();

let isSubmitting = false;


/*
|--------------------------------------------------------------------------
| Calendar State
|--------------------------------------------------------------------------
*/

let calendarDays = [];


/*
|--------------------------------------------------------------------------
| Utility: Persian Digits
|--------------------------------------------------------------------------
*/

function toPersianDigits(value) {

    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replace(/0/g, "۰")
        .replace(/1/g, "۱")
        .replace(/2/g, "۲")
        .replace(/3/g, "۳")
        .replace(/4/g, "۴")
        .replace(/5/g, "۵")
        .replace(/6/g, "۶")
        .replace(/7/g, "۷")
        .replace(/8/g, "۸")
        .replace(/9/g, "۹");
}


/*
|--------------------------------------------------------------------------
| Utility: English Digits
|--------------------------------------------------------------------------
*/

function toEnglishDigits(value) {

    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replace(/[۰-۹]/g, digit => {

            return String(
                "۰۱۲۳۴۵۶۷۸۹".indexOf(digit)
            );

        })
        .replace(/[٠-٩]/g, digit => {

            return String(
                "٠١٢٣٤٥٦٧٨٩".indexOf(digit)
            );

        });
}


/*
|--------------------------------------------------------------------------
| Utility: Normalize Phone
|--------------------------------------------------------------------------
*/

function normalizePhone(value) {

    let phone = toEnglishDigits(value);

    phone = phone
        .replace(/\s+/g, "")
        .replace(/-/g, "")
        .replace(/\(/g, "")
        .replace(/\)/g, "");

    if (phone.startsWith("+98")) {

        phone = "0" + phone.substring(3);

    }

    if (phone.startsWith("0098")) {

        phone = "0" + phone.substring(4);

    }

    return phone;
}


/*
|--------------------------------------------------------------------------
| Utility: Validate Iranian Mobile
|--------------------------------------------------------------------------
*/

function isValidIranianMobile(value) {

    const phone = normalizePhone(value);

    return /^09\d{9}$/.test(phone);

}


/*
|--------------------------------------------------------------------------
| Utility: Escape HTML
|--------------------------------------------------------------------------
*/

function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


/*
|--------------------------------------------------------------------------
| Utility: Convert Time To Minutes
|--------------------------------------------------------------------------
*/

function timeToMinutes(time) {

    const parts = String(time).split(":");

    const hours = Number(parts[0]);

    const minutes = Number(parts[1]);

    return (hours * 60) + minutes;

}


/*
|--------------------------------------------------------------------------
| Utility: Minutes To Time
|--------------------------------------------------------------------------
*/

function minutesToTime(totalMinutes) {

    const hours = Math.floor(totalMinutes / 60);

    const minutes = totalMinutes % 60;

    return String(hours).padStart(2, "0")
        + ":"
        + String(minutes).padStart(2, "0");

}


/*
|--------------------------------------------------------------------------
| Generate Daily Time Slots
|--------------------------------------------------------------------------
*/

function generateTimeSlots() {

    const slots = [];

    const start = timeToMinutes(
        WORKING_HOURS.start
    );

    const lastBooking = timeToMinutes(
        WORKING_HOURS.lastBookingTime
    );

    const interval = Number(
        WORKING_HOURS.interval
    );

    if (
        !Number.isFinite(start) ||
        !Number.isFinite(lastBooking) ||
        !Number.isFinite(interval) ||
        interval <= 0
    ) {

        console.error(
            "تنظیمات ساعت کاری در config.js صحیح نیست."
        );

        return slots;

    }

    for (
        let minutes = start;
        minutes <= lastBooking;
        minutes += interval
    ) {

        slots.push(
            minutesToTime(minutes)
        );

    }

    return slots;

}


/*
|--------------------------------------------------------------------------
| All Available Time Slots
|--------------------------------------------------------------------------
*/

const ALL_TIME_SLOTS = generateTimeSlots();


/*
|--------------------------------------------------------------------------
| Get Service By ID
|--------------------------------------------------------------------------
*/

function getServiceById(serviceId) {

    return SERVICES.find(
        service => service.id === serviceId
    ) || null;

}


/*
|--------------------------------------------------------------------------
| Get Service By Name
|--------------------------------------------------------------------------
*/

function getServiceByName(serviceName) {

    return SERVICES.find(
        service => service.name === serviceName
    ) || null;

}


/*
|--------------------------------------------------------------------------
| Find Selected Service From HTML
|--------------------------------------------------------------------------
*/

function readSelectedService() {

    const selectedInput = document.querySelector(
        'input[name="service"]:checked'
    );

    if (!selectedInput) {

        return null;

    }

    const serviceById = getServiceById(
        selectedInput.value
    );

    if (serviceById) {

        return serviceById;

    }

    return getServiceByName(
        selectedInput.value
    );

}


/*
|--------------------------------------------------------------------------
| Initialize Services
|--------------------------------------------------------------------------
*/

function initializeServices() {

    const serviceInputs = document.querySelectorAll(
        'input[name="service"]'
    );

    serviceInputs.forEach(input => {

        input.addEventListener("change", () => {

            const service = getServiceById(
                input.value
            ) || getServiceByName(
                input.value
            );

            selectedService = service;

            clearSelectedTime();

        });

    });

}


/*
|--------------------------------------------------------------------------
| Clear Selected Time
|--------------------------------------------------------------------------
*/

function clearSelectedTime() {

    selectedTime = null;

    document
        .querySelectorAll(".time-card.selected")
        .forEach(card => {

            card.classList.remove("selected");

        });

}


/*
|--------------------------------------------------------------------------
| Clear Selected Day
|--------------------------------------------------------------------------
*/

function clearSelectedDay() {

    selectedDay = null;

    document
        .querySelectorAll(".day-card.selected")
        .forEach(card => {

            card.classList.remove("selected");

        });

    clearSelectedTime();

}


/*
|--------------------------------------------------------------------------
| Initial State
|--------------------------------------------------------------------------
*/

function initializeState() {

    selectedService = readSelectedService();

    updateStepUI();

}


/*
|--------------------------------------------------------------------------
| DOM Ready
|--------------------------------------------------------------------------
*/

document.addEventListener("DOMContentLoaded", () => {

    initializeServices();

    initializeState();

});


/*
|--------------------------------------------------------------------------
| End Of Part 1
|--------------------------------------------------------------------------
*/
/*======================================
    Salon Mojezeh
    reserve-script.js
    Final Reservation System
    Part 2 / 4
======================================*/


/*
|--------------------------------------------------------------------------
| Step UI
|--------------------------------------------------------------------------
*/

function updateStepUI() {

    document
        .querySelectorAll(".step")
        .forEach(step => {

            step.classList.remove("active");

        });

    const currentStepElement =
        document.getElementById(
            `step${currentStep}`
        );

    if (currentStepElement) {

        currentStepElement.classList.add("active");

    }


    /*
    |--------------------------------------------------------------------------
    | Progress Bar
    |--------------------------------------------------------------------------
    */

    const progressPercent =
        (currentStep / totalSteps) * 100;

    if (progressBar) {

        progressBar.style.width =
            `${progressPercent}%`;

    }


    /*
    |--------------------------------------------------------------------------
    | Previous Button
    |--------------------------------------------------------------------------
    */

    if (prevBtn) {

        if (currentStep === 1) {

            prevBtn.style.display = "none";

        } else {

            prevBtn.style.display = "inline-flex";

        }

    }


    /*
    |--------------------------------------------------------------------------
    | Next / Submit Buttons
    |--------------------------------------------------------------------------
    */

    if (nextBtn && submitBtn) {

        if (currentStep === totalSteps) {

            nextBtn.style.display = "none";

            submitBtn.style.display = "inline-flex";

        } else {

            nextBtn.style.display = "inline-flex";

            submitBtn.style.display = "none";

        }

    }

}


/*
|--------------------------------------------------------------------------
| Show Temporary Message
|--------------------------------------------------------------------------
*/

function showMessage(message) {

    /*
    پیام ساده و هماهنگ با صفحه رزرو
    بدون نیاز به اضافه کردن HTML جدید
    */

    let messageBox =
        document.getElementById(
            "reserveMessage"
        );


    if (!messageBox) {

        messageBox =
            document.createElement("div");

        messageBox.id =
            "reserveMessage";

        messageBox.style.cssText = `
            position:fixed;
            top:90px;
            right:50%;
            transform:translateX(50%);
            z-index:10000;
            max-width:90%;
            padding:15px 22px;
            border-radius:14px;
            background:var(--card);
            color:var(--text);
            border:1px solid var(--border);
            box-shadow:var(--shadow);
            font-family:inherit;
            font-size:15px;
            font-weight:600;
            text-align:center;
        `;

        document.body.appendChild(
            messageBox
        );

    }


    messageBox.textContent = message;

    messageBox.style.display = "block";


    clearTimeout(
        messageBox._timeout
    );


    messageBox._timeout =
        setTimeout(() => {

            messageBox.style.display =
                "none";

        }, 3500);

}


/*
|--------------------------------------------------------------------------
| Validate Step 1
|--------------------------------------------------------------------------
*/

function validateStep1() {

    const firstName =
        firstNameInput?.value.trim() || "";

    const lastName =
        lastNameInput?.value.trim() || "";

    const phone =
        phoneInput?.value.trim() || "";


    /*
    |--------------------------------------------------------------------------
    | First Name
    |--------------------------------------------------------------------------
    */

    if (firstName.length < 2) {

        showMessage(
            "لطفاً نام خود را به‌درستی وارد کنید."
        );

        firstNameInput?.focus();

        return false;

    }


    /*
    |--------------------------------------------------------------------------
    | Last Name
    |--------------------------------------------------------------------------
    */

    if (lastName.length < 2) {

        showMessage(
            "لطفاً نام خانوادگی خود را به‌درستی وارد کنید."
        );

        lastNameInput?.focus();

        return false;

    }


    /*
    |--------------------------------------------------------------------------
    | Mobile
    |--------------------------------------------------------------------------
    */

    if (!isValidIranianMobile(phone)) {

        showMessage(
            "لطفاً شماره موبایل معتبر وارد کنید. مثال: 09123456789"
        );

        phoneInput?.focus();

        return false;

    }


    /*
    |--------------------------------------------------------------------------
    | Normalize Phone In Input
    |--------------------------------------------------------------------------
    */

    if (phoneInput) {

        phoneInput.value =
            normalizePhone(phone);

    }


    return true;

}


/*
|--------------------------------------------------------------------------
| Validate Step 2
|--------------------------------------------------------------------------
*/

function validateStep2() {

    selectedService =
        readSelectedService();


    if (!selectedService) {

        showMessage(
            "لطفاً یکی از خدمات را انتخاب کنید."
        );

        return false;

    }


    return true;

}


/*
|--------------------------------------------------------------------------
| Validate Step 3
|--------------------------------------------------------------------------
*/

function validateStep3() {

    if (!selectedDay) {

        showMessage(
            "لطفاً یک روز را انتخاب کنید."
        );

        return false;

    }


    return true;

}


/*
|--------------------------------------------------------------------------
| Validate Step 4
|--------------------------------------------------------------------------
*/

function validateStep4() {

    if (!selectedDay) {

        showMessage(
            "لطفاً ابتدا روز مورد نظر را انتخاب کنید."
        );

        return false;

    }


    if (!selectedTime) {

        showMessage(
            "لطفاً ساعت مورد نظر را انتخاب کنید."
        );

        return false;

    }


    return true;

}


/*
|--------------------------------------------------------------------------
| Validate Current Step
|--------------------------------------------------------------------------
*/

function validateCurrentStep() {

    switch (currentStep) {

        case 1:

            return validateStep1();


        case 2:

            return validateStep2();


        case 3:

            return validateStep3();


        case 4:

            return validateStep4();


        default:

            return false;

    }

}


/*
|--------------------------------------------------------------------------
| Next Step
|--------------------------------------------------------------------------
*/

async function goToNextStep() {

    if (!validateCurrentStep()) {

        return;

    }


    /*
    |--------------------------------------------------------------------------
    | Step 2 → Step 3
    |--------------------------------------------------------------------------
    */

    if (currentStep === 2) {

        selectedService =
            readSelectedService();

    }


    /*
    |--------------------------------------------------------------------------
    | Step 3 → Step 4
    |--------------------------------------------------------------------------
    */

    if (currentStep === 3) {

        await loadAvailableTimes();

    }


    if (currentStep < totalSteps) {

        currentStep++;

        updateStepUI();

        window.scrollTo({

            top: 0,

            behavior: "smooth"

        });

    }

}


/*
|--------------------------------------------------------------------------
| Previous Step
|--------------------------------------------------------------------------
*/

function goToPreviousStep() {

    if (currentStep <= 1) {

        return;

    }


    currentStep--;

    updateStepUI();


    /*
    |--------------------------------------------------------------------------
    | وقتی از مرحله ساعت برمی‌گردیم
    |--------------------------------------------------------------------------
    */

    if (currentStep === 3) {

        clearSelectedTime();

    }


    window.scrollTo({

        top: 0,

        behavior: "smooth"

    });

}


/*
|--------------------------------------------------------------------------
| Day Name
|--------------------------------------------------------------------------
*/

const PERSIAN_DAY_NAMES = [

    "یکشنبه",

    "دوشنبه",

    "سه‌شنبه",

    "چهارشنبه",

    "پنجشنبه",

    "جمعه",

    "شنبه"

];


/*
|--------------------------------------------------------------------------
| Persian Month Names
|--------------------------------------------------------------------------
*/

const PERSIAN_MONTH_NAMES = [

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


/*
|--------------------------------------------------------------------------
| Gregorian To Jalali
|--------------------------------------------------------------------------
*/

function gregorianToJalali(
    gy,
    gm,
    gd
) {

    const gDaysInMonth = [

        31,
        28,
        31,
        30,
        31,
        30,
        31,
        31,
        30,
        31,
        30,
        31

    ];


    const jDaysInMonth = [

        31,
        31,
        31,
        31,
        31,
        31,
        30,
        30,
        30,
        30,
        30,
        29

    ];


    let gy2 = gy - 1600;

    let gm2 = gm - 1;

    let gd2 = gd - 1;


    let gDayNo =
        365 * gy2
        + Math.floor(
            (gy2 + 3) / 4
        )
        - Math.floor(
            (gy2 + 99) / 100
        )
        + Math.floor(
            (gy2 + 399) / 400
        );


    for (
        let i = 0;
        i < gm2;
        i++
    ) {

        gDayNo +=
            gDaysInMonth[i];

    }


    if (
        gm2 > 1 &&
        (
            gy % 4 === 0 &&
            (
                gy % 100 !== 0 ||
                gy % 400 === 0
            )
        )
    ) {

        gDayNo++;

    }


    gDayNo += gd2;


    let jDayNo =
        gDayNo - 79;


    const jNp =
        Math.floor(
            jDayNo / 12053
        );


    jDayNo %= 12053;


    let jy =
        979 +
        33 * jNp +
        4 *
        Math.floor(
            jDayNo / 1461
        );


    jDayNo %= 1461;


    if (jDayNo >= 366) {

        jy +=
            Math.floor(
                (jDayNo - 1) / 365
            );

        jDayNo =
            (jDayNo - 1) % 365;

    }


    let jm = 0;


    for (
        let i = 0;
        i < 11 &&
        jDayNo >= jDaysInMonth[i];
        i++
    ) {

        jDayNo -=
            jDaysInMonth[i];

        jm++;

    }


    const jd =
        jDayNo + 1;


    jm += 1;


    return {

        year: jy,

        month: jm,

        day: jd

    };

}


/*
|--------------------------------------------------------------------------
| Format Jalali Date
|--------------------------------------------------------------------------
*/

function formatJalaliDate(date) {

    const jalali =
        gregorianToJalali(
            date.getFullYear(),
            date.getMonth() + 1,
            date.getDate()
        );


    return {

        year: jalali.year,

        month: jalali.month,

        day: jalali.day,

        monthName:
            PERSIAN_MONTH_NAMES[
                jalali.month - 1
            ],

        formatted:
            `${toPersianDigits(jalali.year)}/${toPersianDigits(jalali.month)}/${toPersianDigits(jalali.day)}`

    };

}


/*
|--------------------------------------------------------------------------
| Create Date Key
|--------------------------------------------------------------------------
*/

function createDateKey(date) {

    const year =
        date.getFullYear();

    const month =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            date.getDate()
        ).padStart(2, "0");


    return `${year}-${month}-${day}`;

}


/*
|--------------------------------------------------------------------------
| Generate Next 30 Days
|--------------------------------------------------------------------------
*/

function generateCalendarDays() {

    const days = [];

    const today =
        new Date();


    today.setHours(
        0,
        0,
        0,
        0
    );


    const daysToShow =
        Number(
            CALENDAR_CONFIG.daysToShow
        ) || 30;


    for (
        let i = 0;
        i < daysToShow;
        i++
    ) {

        const date =
            new Date(today);


        date.setDate(
            today.getDate() + i
        );


        const jalali =
            formatJalaliDate(date);


        days.push({

            date,

            dateKey:
                createDateKey(date),

            dayName:
                PERSIAN_DAY_NAMES[
                    date.getDay()
                ],

            jalaliYear:
                jalali.year,

            jalaliMonth:
                jalali.month,

            jalaliDay:
                jalali.day,

            jalaliMonthName:
                jalali.monthName,

            jalaliFormatted:
                jalali.formatted

        });

    }


    return days;

}


/*
|--------------------------------------------------------------------------
| End Of Part 2
|--------------------------------------------------------------------------
*/
/*=========================================================
  SALON MOJEZEH
  reserve-script.js
  FINAL VERSION
  PART 3
=========================================================*/


/*=========================================================
  STEP 3 — LOAD DAYS
=========================================================*/

function renderDays() {

    if (!daysContainer) return;

    daysContainer.innerHTML = "";

    selectedDay = null;
    selectedTime = null;

    timesContainer.innerHTML = "";

    const today = new Date();

    /*
      ساخت ۳۰ روز آینده
      تاریخ میلادی برای محاسبات داخلی نگهداری می‌شود
      و تاریخ شمسی برای نمایش به کاربر استفاده می‌شود.
    */

    for (let i = 0; i < 30; i++) {

        const date = new Date(today);

        date.setHours(0, 0, 0, 0);

        date.setDate(today.getDate() + i);

        const jalali = gregorianToJalali(
            date.getFullYear(),
            date.getMonth() + 1,
            date.getDate()
        );

        const dateKey =
            `${jalali.jy}/${pad(jalali.jm)}/${pad(jalali.jd)}`;

        const dayCard = document.createElement("button");

        dayCard.type = "button";

        dayCard.className = "day-card";

        dayCard.dataset.date = dateKey;

        dayCard.dataset.gregorian =
            formatGregorianDate(date);

        dayCard.innerHTML = `

            <span class="day-name">
                ${getPersianDayName(date)}
            </span>

            <span class="day-date">
                ${toPersianDigits(
                    `${jalali.jy}/${pad(jalali.jm)}/${pad(jalali.jd)}`
                )}
            </span>

        `;

        dayCard.addEventListener("click", async () => {

            await selectDay(
                dayCard,
                dateKey,
                date
            );

        });

        daysContainer.appendChild(dayCard);

    }

}


/*=========================================================
  SELECT DAY
=========================================================*/

async function selectDay(card, dateKey, date) {

    document
        .querySelectorAll(".day-card")
        .forEach(item => {

            item.classList.remove("selected");

        });

    card.classList.add("selected");

    selectedDay = {

        key: dateKey,

        date: date,

        gregorian: formatGregorianDate(date)

    };

    selectedTime = null;

    timesContainer.innerHTML = "";

    await renderTimes();

}


/*=========================================================
  STEP 4 — RENDER TIMES
=========================================================*/

async function renderTimes() {

    if (!timesContainer || !selectedDay) return;

    timesContainer.innerHTML = "";

    showTimesLoading();

    try {

        const bookedTimes =
            await getBookedTimes(
                selectedDay.key
            );

        const today = new Date();

        const selectedDate =
            new Date(selectedDay.date);

        const isToday =
            sameDate(today, selectedDate);

        TIME_SLOTS.forEach(time => {

            const timeCard =
                document.createElement("button");

            timeCard.type = "button";

            timeCard.className = "time-card";

            timeCard.dataset.time = time;

            timeCard.textContent =
                toPersianDigits(time);

            /*
              اگر ساعت قبلاً رزرو شده باشد
              قرمز و غیرقابل انتخاب می‌شود.
            */

            if (bookedTimes.has(time)) {

                timeCard.classList.add("booked");

                timeCard.disabled = true;

                timeCard.title =
                    "این ساعت قبلاً رزرو شده است";

                timeCard.innerHTML = `
                    <i class="fa-solid fa-lock"></i>
                    ${toPersianDigits(time)}
                `;

                timesContainer.appendChild(timeCard);

                return;

            }


            /*
              اگر امروز باشد،
              ساعت‌های گذشته قابل انتخاب نیستند.
            */

            if (
                isToday &&
                isPastTime(time)
            ) {

                timeCard.classList.add("disabled");

                timeCard.disabled = true;

                timeCard.title =
                    "این ساعت گذشته است";

                timesContainer.appendChild(timeCard);

                return;

            }


            /*
              ساعت آزاد
            */

            timeCard.addEventListener(
                "click",
                () => {

                    selectTime(
                        timeCard,
                        time
                    );

                }
            );

            timesContainer.appendChild(timeCard);

        });

        if (
            !timesContainer.children.length
        ) {

            showNoTimes();

        }

    }
    catch (error) {

        console.error(
            "خطا در دریافت ساعت‌های رزرو:",
            error
        );

        showTimesError();

    }

}


/*=========================================================
  SELECT TIME
=========================================================*/

function selectTime(card, time) {

    document
        .querySelectorAll(".time-card")
        .forEach(item => {

            item.classList.remove("selected");

        });

    card.classList.add("selected");

    selectedTime = time;

}


/*=========================================================
  FIRESTORE — GET BOOKED TIMES
=========================================================*/

async function getBookedTimes(dateKey) {

    const bookedTimes = new Set();

    const q = query(
        collection(db, BOOKINGS_COLLECTION),
        where("dateKey", "==", dateKey)
    );

    const snapshot =
        await getDocs(q);

    snapshot.forEach(docSnap => {

        const data =
            docSnap.data();

        if (
            data &&
            data.time
        ) {

            bookedTimes.add(
                normalizeTime(data.time)
            );

        }

    });

    return bookedTimes;

}


/*=========================================================
  FIRESTORE — CHECK SINGLE SLOT
=========================================================*/

async function isTimeBooked(
    dateKey,
    time
) {

    const normalizedTime =
        normalizeTime(time);

    const q = query(
        collection(db, BOOKINGS_COLLECTION),
        where("dateKey", "==", dateKey),
        where("time", "==", normalizedTime)
    );

    const snapshot =
        await getDocs(q);

    return !snapshot.empty;

}


/*=========================================================
  FINAL REAL-TIME AVAILABILITY CHECK
=========================================================*/

async function checkSelectedSlot() {

    if (
        !selectedDay ||
        !selectedTime
    ) {

        return false;

    }

    try {

        return await isTimeBooked(
            selectedDay.key,
            selectedTime
        );

    }
    catch (error) {

        console.error(
            "خطا در بررسی زمان:",
            error
        );

        return true;

    }

}


/*=========================================================
  FORM VALIDATION
=========================================================*/

function validateCustomerInfo() {

    const firstName =
        firstNameInput.value.trim();

    const lastName =
        lastNameInput.value.trim();

    const phone =
        normalizePhone(
            phoneInput.value
        );


    if (!firstName) {

        showMessage(
            "لطفاً نام خود را وارد کنید."
        );

        firstNameInput.focus();

        return false;

    }


    if (firstName.length < 2) {

        showMessage(
            "نام وارد شده صحیح نیست."
        );

        firstNameInput.focus();

        return false;

    }


    if (!lastName) {

        showMessage(
            "لطفاً نام خانوادگی خود را وارد کنید."
        );

        lastNameInput.focus();

        return false;

    }


    if (lastName.length < 2) {

        showMessage(
            "نام خانوادگی وارد شده صحیح نیست."
        );

        lastNameInput.focus();

        return false;

    }


    if (!/^09\d{9}$/.test(phone)) {

        showMessage(
            "شماره موبایل باید به صورت ۰۹۱۲۳۴۵۶۷۸۹ باشد."
        );

        phoneInput.focus();

        return false;

    }


    return true;

}


/*=========================================================
  SERVICE VALIDATION
=========================================================*/

function validateService() {

    const service =
        getSelectedService();

    if (!service) {

        showMessage(
            "لطفاً یک خدمت را انتخاب کنید."
        );

        return false;

    }

    return true;

}


/*=========================================================
  DAY VALIDATION
=========================================================*/

function validateDay() {

    if (!selectedDay) {

        showMessage(
            "لطفاً یک روز را انتخاب کنید."
        );

        return false;

    }

    return true;

}


/*=========================================================
  TIME VALIDATION
=========================================================*/

async function validateTime() {

    if (!selectedTime) {

        showMessage(
            "لطفاً یک ساعت را انتخاب کنید."
        );

        return false;

    }


    /*
      بررسی مجدد از Firebase
      تا اگر کاربر دیگری همین لحظه
      ساعت را رزرو کرده باشد،
      رزرو تکراری ثبت نشود.
    */

    const alreadyBooked =
        await checkSelectedSlot();

    if (alreadyBooked) {

        showMessage(
            "این ساعت همین الان توسط شخص دیگری رزرو شد. لطفاً ساعت دیگری انتخاب کنید."
        );

        await renderTimes();

        return false;

    }


    return true;

}


/*=========================================================
  STEP VALIDATION
=========================================================*/

async function validateStep(step) {

    switch (step) {

        case 1:

            return validateCustomerInfo();

        case 2:

            return validateService();

        case 3:

            return validateDay();

        case 4:

            return await validateTime();

        default:

            return false;

    }

}


/*=========================================================
  SHOW STEP
=========================================================*/

function showStep(step) {

    currentStep = step;


    document
        .querySelectorAll(".step")
        .forEach(item => {

            item.classList.remove("active");

        });


    const target =
        document.getElementById(
            `step${step}`
        );


    if (target) {

        target.classList.add("active");

    }


    updateProgress();

    updateButtons();


    window.scrollTo({

        top: 0,

        behavior: "smooth"

    });

}


/*=========================================================
  NEXT BUTTON
=========================================================*/

nextBtn.addEventListener(
    "click",
    async () => {

        const valid =
            await validateStep(
                currentStep
            );

        if (!valid) return;


        if (currentStep < TOTAL_STEPS) {

            showStep(
                currentStep + 1
            );

        }

    }
);


/*=========================================================
  PREVIOUS BUTTON
=========================================================*/

prevBtn.addEventListener(
    "click",
    () => {

        if (currentStep > 1) {

            showStep(
                currentStep - 1
            );

        }

    }
);


/*=========================================================
  PHONE INPUT
=========================================================*/

phoneInput.addEventListener(
    "input",
    () => {

        let value =
            normalizePhone(
                phoneInput.value
            );

        value =
            value.replace(
                /\D/g,
                ""
            );

        if (
            value.length > 11
        ) {

            value =
                value.slice(0, 11);

        }

        phoneInput.value =
            toPersianDigits(value);

    }
);


/*=========================================================
  ENTER KEY CONTROL
=========================================================*/

reserveForm.addEventListener(
    "keydown",
    event => {

        if (
            event.key !== "Enter"
        ) {

            return;

        }

        /*
          جلوگیری از ارسال ناخواسته فرم
          هنگام حرکت بین مراحل.
        */

        if (
            currentStep <
            TOTAL_STEPS
        ) {

            event.preventDefault();

            nextBtn.click();

        }

    }
);


/*=========================================================
  SUBMIT — START
=========================================================*/

reserveForm.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        if (
            isSubmitting
        ) {

            return;

        }


        const validCustomer =
            validateCustomerInfo();

        if (!validCustomer) {

            showStep(1);

            return;

        }


        if (!validateService()) {

            showStep(2);

            return;

        }


        if (!validateDay()) {

            showStep(3);

            return;

        }


        const validTime =
            await validateTime();

        if (!validTime) {

            showStep(4);

            return;

        }


        await submitReservation();

    }
);


/*=========================================================
  SUBMIT RESERVATION
=========================================================*/

async function submitReservation() {

    if (isSubmitting) return;

    isSubmitting = true;

    setSubmitLoading(true);


    try {

        /*
          اطلاعات نهایی فرم
        */

        const firstName =
            firstNameInput.value.trim();

        const lastName =
            lastNameInput.value.trim();

        const phone =
            normalizePhone(
                phoneInput.value
            );

        const service =
            getSelectedService();


        /*
          بررسی دوباره اطلاعات
        */

        if (
            !firstName ||
            !lastName ||
            !/^09\d{9}$/.test(phone) ||
            !service ||
            !selectedDay ||
            !selectedTime
        ) {

            throw new Error(
                "اطلاعات رزرو کامل نیست."
            );

        }


        /*
          مهم:
          قبل از ثبت نهایی دوباره Firebase
          بررسی می‌شود.
        */

        const booked =
            await isTimeBooked(
                selectedDay.key,
                selectedTime
            );


        if (booked) {

            showMessage(
                "متأسفانه این ساعت در همین لحظه رزرو شده است. لطفاً ساعت دیگری انتخاب کنید."
            );

            await renderTimes();

            showStep(4);

            return;

        }


        /*
          ساخت اطلاعات رزرو
        */

        const bookingData = {

            firstName,

            lastName,

            phone,

            service,

            dateKey:
                selectedDay.key,

            date:
                selectedDay.key,

            gregorianDate:
                selectedDay.gregorian,

            time:
                normalizeTime(
                    selectedTime
                ),

            status:
                "confirmed",

            createdAt:
                serverTimestamp()

        };


        /*
          ثبت در Firestore
        */

        const docRef =
            await addDoc(
                collection(
                    db,
                    BOOKINGS_COLLECTION
                ),
                bookingData
            );


        /*
          ذخیره شناسه رزرو
        */

        currentBookingId =
            docRef.id;


        /*
          نمایش نتیجه موفقیت
        */

        showSuccessModal(
            bookingData
        );


    }
    catch (error) {

        console.error(
            "خطا در ثبت رزرو:",
            error
        );


        showMessage(
            "ثبت رزرو انجام نشد. لطفاً اتصال اینترنت و اطلاعات را بررسی کنید و دوباره تلاش کنید."
        );

    }
    finally {

        isSubmitting = false;

        setSubmitLoading(false);

    }

}


/*=========================================================
  SUBMIT LOADING
=========================================================*/

function setSubmitLoading(
    loading
) {

    if (!submitBtn) return;


    if (loading) {

        submitBtn.disabled = true;

        submitBtn.dataset.originalText =
            submitBtn.innerHTML;

        submitBtn.innerHTML = `

            <i class="fa-solid fa-spinner fa-spin"></i>

            در حال ثبت رزرو...

        `;

    }
    else {

        submitBtn.disabled = false;

        if (
            submitBtn.dataset.originalText
        ) {

            submitBtn.innerHTML =
                submitBtn.dataset.originalText;

        }

    }

}


/*=========================================================
  SUCCESS MODAL
=========================================================*/

function showSuccessModal(
    booking
) {

    if (!successModal) return;


    successDetails.innerHTML = `

        <div>
            <strong>نام:</strong>
            ${escapeHTML(
                booking.firstName
            )}
            ${escapeHTML(
                booking.lastName
            )}
        </div>

        <div>
            <strong>شماره موبایل:</strong>
            ${toPersianDigits(
                booking.phone
            )}
        </div>

        <div>
            <strong>خدمت:</strong>
            ${escapeHTML(
                booking.service
            )}
        </div>

        <div>
            <strong>تاریخ:</strong>
            ${toPersianDigits(
                booking.date
            )}
        </div>

        <div>
            <strong>ساعت:</strong>
            ${toPersianDigits(
                booking.time
            )}
        </div>

    `;


    successModal.classList.add(
        "active"
    );


    document.body.style.overflow =
        "hidden";

}


/*=========================================================
  MESSAGE
=========================================================*/

function showMessage(
    message
) {

    /*
      اگر مرورگر قابلیت alert دارد،
      پیام را بدون وابستگی به CSS
      نمایش می‌دهیم.
    */

    window.alert(message);

}


/*=========================================================
  LOADING TIMES
=========================================================*/

function showTimesLoading() {

    timesContainer.innerHTML = `

        <div class="time-loading">

            <i class="fa-solid fa-spinner fa-spin"></i>

            <span>
                در حال بررسی ساعت‌های آزاد...
            </span>

        </div>

    `;

}


/*=========================================================
  NO TIMES
=========================================================*/

function showNoTimes() {

    timesContainer.innerHTML = `

        <div class="time-empty">

            <i class="fa-solid fa-calendar-xmark"></i>

            <p>
                برای این روز ساعت آزادی باقی نمانده است.
            </p>

        </div>

    `;

}


/*=========================================================
  TIME ERROR
=========================================================*/

function showTimesError() {

    timesContainer.innerHTML = `

        <div class="time-empty">

            <i class="fa-solid fa-triangle-exclamation"></i>

            <p>
                دریافت ساعت‌ها با مشکل مواجه شد.
            </p>

            <button
                type="button"
                id="retryTimesBtn"
                class="secondary-btn">

                تلاش مجدد

            </button>

        </div>

    `;


    const retry =
        document.getElementById(
            "retryTimesBtn"
        );


    if (retry) {

        retry.addEventListener(
            "click",
            renderTimes
        );

    }

}


/*=========================================================
  INITIALIZE RESERVATION PAGE
=========================================================*/

function initializeReservation() {

    currentStep = 1;

    selectedDay = null;

    selectedTime = null;

    currentBookingId = null;

    renderDays();

    showStep(1);

}


/*=========================================================
  START
=========================================================*/

initializeReservation();


/*=========================================================
  END OF PART 3
=========================================================*/

/*=========================================================
  SALON MOJEZEH
  reserve-script.js
  FINAL VERSION
  PART 4 — FINAL
=========================================================*/


/*=========================================================
  HELPER FUNCTIONS
=========================================================*/

/*
  تبدیل اعداد انگلیسی و فارسی به یک فرمت واحد
*/
function normalizeDigits(value) {

    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replace(/[۰-۹]/g, digit => {

            return String(
                "۰۱۲۳۴۵۶۷۸۹".indexOf(digit)
            );

        })
        .replace(/[٠-٩]/g, digit => {

            return String(
                "٠١٢٣٤٥٦٧٨٩".indexOf(digit)
            );

        });

}


/*=========================================================
  NORMALIZE PHONE
=========================================================*/

function normalizePhone(value) {

    let phone =
        normalizeDigits(value)
            .replace(/\s/g, "")
            .replace(/-/g, "")
            .replace(/\(/g, "")
            .replace(/\)/g, "");

    /*
      تبدیل 0098xxxxxxxxxx
      به 09xxxxxxxxx
    */

    if (phone.startsWith("0098")) {

        phone =
            "0" +
            phone.substring(4);

    }

    /*
      تبدیل +98xxxxxxxxxx
      به 09xxxxxxxxx
    */

    if (phone.startsWith("+98")) {

        phone =
            "0" +
            phone.substring(3);

    }

    return phone;

}


/*=========================================================
  NORMALIZE TIME
=========================================================*/

function normalizeTime(time) {

    if (!time) return "";

    let value =
        normalizeDigits(time)
            .trim();

    /*
      9:00 → 09:00
    */

    const parts =
        value.split(":");

    if (
        parts.length === 2
    ) {

        const hour =
            parts[0].padStart(2, "0");

        const minute =
            parts[1].padStart(2, "0");

        return `${hour}:${minute}`;

    }

    return value;

}


/*=========================================================
  PERSIAN DIGITS
=========================================================*/

function toPersianDigits(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }

    return String(value).replace(
        /\d/g,
        digit => "۰۱۲۳۴۵۶۷۸۹"[digit]
    );

}


/*=========================================================
  PAD
=========================================================*/

function pad(number) {

    return String(number)
        .padStart(2, "0");

}


/*=========================================================
  GREGORIAN DATE FORMAT
=========================================================*/

function formatGregorianDate(date) {

    if (!(date instanceof Date)) {

        return "";

    }

    return [

        date.getFullYear(),

        pad(
            date.getMonth() + 1
        ),

        pad(
            date.getDate()
        )

    ].join("-");

}


/*=========================================================
  SAME DATE
=========================================================*/

function sameDate(
    first,
    second
) {

    return (

        first.getFullYear() ===
        second.getFullYear()

        &&

        first.getMonth() ===
        second.getMonth()

        &&

        first.getDate() ===
        second.getDate()

    );

}


/*=========================================================
  CHECK PAST TIME
=========================================================*/

function isPastTime(time) {

    const normalized =
        normalizeTime(time);

    const parts =
        normalized.split(":");

    if (
        parts.length !== 2
    ) {

        return false;

    }

    const hour =
        Number(parts[0]);

    const minute =
        Number(parts[1]);

    const now =
        new Date();

    const currentHour =
        now.getHours();

    const currentMinute =
        now.getMinutes();


    if (
        hour < currentHour
    ) {

        return true;

    }


    if (
        hour === currentHour &&
        minute <= currentMinute
    ) {

        return true;

    }


    return false;

}


/*=========================================================
  DAY NAME
=========================================================*/

function getPersianDayName(date) {

    const days = [

        "یکشنبه",

        "دوشنبه",

        "سه‌شنبه",

        "چهارشنبه",

        "پنجشنبه",

        "جمعه",

        "شنبه"

    ];

    return days[
        date.getDay()
    ];

}


/*=========================================================
  GET SELECTED SERVICE
=========================================================*/

function getSelectedService() {

    const selected =
        document.querySelector(
            'input[name="service"]:checked'
        );

    if (!selected) {

        return "";

    }

    return selected.value.trim();

}


/*=========================================================
  ESCAPE HTML
=========================================================*/

function escapeHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }

    return String(value)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}


/*=========================================================
  JALALI CONVERSION
=========================================================*/

/*
  تبدیل تاریخ میلادی به شمسی
  بدون نیاز به کتابخانه خارجی
*/

function gregorianToJalali(
    gy,
    gm,
    gd
) {

    const g_d_m = [

        0,

        31,

        59,

        90,

        120,

        151,

        181,

        212,

        243,

        273,

        304,

        334

    ];


    let jy;


    if (gy > 1600) {

        jy = 979;

        gy -= 1600;

    }
    else {

        jy = 0;

        gy -= 621;

    }


    const gy2 =
        gm > 2
            ? gy + 1
            : gy;


    let days =
        365 * gy

        +

        Math.floor(
            (gy2 + 3) / 4
        )

        -

        Math.floor(
            (gy2 + 99) / 100
        )

        +

        Math.floor(
            (gy2 + 399) / 400
        )

        -

        80

        +

        gd

        +

        g_d_m[
            gm - 1
        ];


    jy +=
        33 *
        Math.floor(
            days / 12053
        );


    days %= 12053;


    jy +=
        4 *
        Math.floor(
            days / 1461
        );


    days %= 1461;


    if (
        days > 365
    ) {

        jy +=
            Math.floor(
                (days - 1) / 365
            );

        days =
            (days - 1) % 365;

    }


    let jm;


    if (
        days < 186
    ) {

        jm =
            1 +
            Math.floor(
                days / 31
            );

    }
    else {

        jm =
            7 +
            Math.floor(
                (days - 186) / 30
            );

    }


    const jd =
        1 +

        (

            days < 186

                ?

                days % 31

                :

                (days - 186) % 30

        );


    return {

        jy,

        jm,

        jd

    };

}


/*=========================================================
  CLOSE SUCCESS MODAL
=========================================================*/

function closeSuccessModal() {

    if (!successModal) return;

    successModal.classList.remove(
        "active"
    );

    document.body.style.overflow =
        "";

}


/*=========================================================
  MODAL CLICK OUTSIDE
=========================================================*/

if (successModal) {

    successModal.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                successModal
            ) {

                closeSuccessModal();

            }

        }
    );

}


/*=========================================================
  ESC KEY
=========================================================*/

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Escape" &&
            successModal &&
            successModal.classList.contains(
                "active"
            )
        ) {

            closeSuccessModal();

        }

    }
);


/*=========================================================
  FIRESTORE ERROR HANDLER
=========================================================*/

window.addEventListener(
    "unhandledrejection",
    event => {

        console.error(
            "Unhandled Promise Error:",
            event.reason
        );

    }
);


/*=========================================================
  PREVENT DOUBLE CLICK
=========================================================*/

document.addEventListener(
    "click",
    event => {

        const button =
            event.target.closest(
                "button"
            );

        if (!button) return;

        if (
            button.disabled
        ) {

            event.preventDefault();

        }

    }
);


/*=========================================================
  REFRESH AVAILABILITY WHEN PAGE RETURNS
=========================================================*/

document.addEventListener(
    "visibilitychange",
    async () => {

        if (
            document.visibilityState !==
            "visible"
        ) {

            return;

        }


        /*
          اگر کاربر دوباره به صفحه برگشت،
          ساعت‌های روز انتخاب‌شده
          از Firebase دوباره خوانده می‌شوند.
        */

        if (
            selectedDay &&
            currentStep === 4
        ) {

            try {

                await renderTimes();

            }
            catch (error) {

                console.error(
                    "خطا در به‌روزرسانی ساعت‌ها:",
                    error
                );

            }

        }

    }
);


/*=========================================================
  AUTO REFRESH AVAILABLE TIMES
=========================================================*/

/*
  هر ۳۰ ثانیه ساعت‌های انتخاب‌شده
  دوباره از Firebase بررسی می‌شوند.

  این کار باعث می‌شود اگر مشتری دیگری
  در همان صفحه یک ساعت را رزرو کرد،
  وضعیت صفحه سریع‌تر به‌روز شود.
*/

setInterval(
    async () => {

        if (
            document.visibilityState !==
            "visible"
        ) {

            return;

        }


        if (
            !selectedDay ||
            currentStep !== 4
        ) {

            return;

        }


        try {

            await renderTimes();

        }
        catch (error) {

            console.error(
                "Availability refresh error:",
                error
            );

        }

    },
    30000
);


/*=========================================================
  INITIAL UI STATE
=========================================================*/

updateProgress();

updateButtons();


/*=========================================================
  FINAL CONSOLE MESSAGE
=========================================================*/

console.log(
    "Salon Mojezeh Reservation System Ready"
);


/*=========================================================
  END OF reserve-script.js
=========================================================*/
