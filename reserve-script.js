/*======================================
    Salon Mojezeh
    reserve-script.js
    FINAL VERSION
======================================*/

"use strict";

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


/*======================================
    CONFIG
======================================*/

const CONFIG = RESERVATION_CONFIG;

const SERVICES = CONFIG.services || [];

const WORKING_HOURS = CONFIG.workingHours || {};

const CALENDAR_CONFIG = CONFIG.calendar || {};

const BOOKING_CONFIG = CONFIG.booking || {};

const TOTAL_STEPS = 4;

/*
    نام Collection رزروها در Firebase

    اگر در firebase/admin پروژه‌ات Collection دیگری
    برای رزروها ساخته‌ای، فقط همین مقدار را تغییر بده.
*/
const BOOKINGS_COLLECTION = "bookings";


/*======================================
    DOM
======================================*/

const reserveForm =
    document.getElementById("reserveForm");

const firstNameInput =
    document.getElementById("firstName");

const lastNameInput =
    document.getElementById("lastName");

const phoneInput =
    document.getElementById("phone");

const progressBar =
    document.getElementById("progressBar");

const daysContainer =
    document.getElementById("daysContainer");

const timesContainer =
    document.getElementById("timesContainer");

const prevBtn =
    document.getElementById("prevBtn");

const nextBtn =
    document.getElementById("nextBtn");

const submitBtn =
    document.getElementById("submitBtn");

const successModal =
    document.getElementById("successModal");

const successDetails =
    document.getElementById("successDetails");


/*======================================
    STATE
======================================*/

let currentStep = 1;

let selectedService = null;

let selectedDay = null;

let selectedTime = null;

let isSubmitting = false;

let currentBookingId = null;


/*======================================
    DIGITS
======================================*/

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


function toPersianDigits(value) {

    if (value === null || value === undefined) {
        return "";
    }

    return String(value).replace(
        /\d/g,
        digit => "۰۱۲۳۴۵۶۷۸۹"[digit]
    );
}


/*======================================
    PHONE
======================================*/

function normalizePhone(value) {

    let phone = toEnglishDigits(value);

    phone = phone
        .replace(/\s+/g, "")
        .replace(/-/g, "")
        .replace(/\(/g, "")
        .replace(/\)/g, "");


    if (phone.startsWith("+98")) {

        phone =
            "0" +
            phone.substring(3);

    }


    if (phone.startsWith("0098")) {

        phone =
            "0" +
            phone.substring(4);

    }


    return phone;
}


function isValidIranianMobile(value) {

    const phone =
        normalizePhone(value);

    return /^09\d{9}$/.test(phone);

}


/*======================================
    HTML ESCAPE
======================================*/

function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


/*======================================
    TIME HELPERS
======================================*/

function timeToMinutes(time) {

    const parts =
        String(time).split(":");

    if (parts.length !== 2) {
        return NaN;
    }

    const hours =
        Number(parts[0]);

    const minutes =
        Number(parts[1]);

    return (
        hours * 60 +
        minutes
    );

}


function minutesToTime(totalMinutes) {

    const hours =
        Math.floor(
            totalMinutes / 60
        );

    const minutes =
        totalMinutes % 60;

    return (
        String(hours).padStart(2, "0") +
        ":" +
        String(minutes).padStart(2, "0")
    );

}


function normalizeTime(time) {

    if (!time) {
        return "";
    }

    const value =
        toEnglishDigits(time).trim();

    const parts =
        value.split(":");

    if (parts.length !== 2) {
        return value;
    }

    const hour =
        String(parts[0]).padStart(2, "0");

    const minute =
        String(parts[1]).padStart(2, "0");

    return `${hour}:${minute}`;

}


/*======================================
    GENERATE TIME SLOTS
======================================*/

function generateTimeSlots() {

    const slots = [];

    const start =
        timeToMinutes(
            WORKING_HOURS.start || "10:00"
        );

    const lastBooking =
        timeToMinutes(
            WORKING_HOURS.lastBookingTime ||
            "21:00"
        );

    /*
        طبق config.js:

        interval = 60

        یعنی هر یک ساعت یک نوبت.
    */

    const interval =
        Number(
            WORKING_HOURS.interval
        ) || 60;


    if (
        !Number.isFinite(start) ||
        !Number.isFinite(lastBooking) ||
        interval <= 0
    ) {

        console.error(
            "تنظیمات ساعت کاری صحیح نیست."
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


const TIME_SLOTS =
    generateTimeSlots();


/*======================================
    SERVICE HELPERS
======================================*/

function getServiceById(id) {

    return (
        SERVICES.find(
            service =>
                service.id === id
        ) || null
    );

}


function getServiceByName(name) {

    return (
        SERVICES.find(
            service =>
                service.name === name
        ) || null
    );

}


function getSelectedServiceObject() {

    const input =
        document.querySelector(
            'input[name="service"]:checked'
        );

    if (!input) {
        return null;
    }


    return (
        getServiceById(input.value) ||
        getServiceByName(input.value)
    );

}


/*======================================
    MESSAGE
======================================*/

function showMessage(message) {

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
            width:min(90%,500px);
            padding:15px 20px;
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


    messageBox.textContent =
        message;

    messageBox.style.display =
        "block";


    clearTimeout(
        messageBox._timer
    );


    messageBox._timer =
        setTimeout(() => {

            messageBox.style.display =
                "none";

        }, 3500);

}


/*======================================
    PROGRESS / BUTTONS
======================================*/

function updateProgress() {

    if (!progressBar) {
        return;
    }


    const percent =
        (
            currentStep /
            TOTAL_STEPS
        ) * 100;


    progressBar.style.width =
        `${percent}%`;

}


function updateButtons() {

    if (prevBtn) {

        prevBtn.style.display =
            currentStep === 1
                ? "none"
                : "inline-flex";

    }


    if (nextBtn) {

        nextBtn.style.display =
            currentStep === TOTAL_STEPS
                ? "none"
                : "inline-flex";

    }


    if (submitBtn) {

        submitBtn.style.display =
            currentStep === TOTAL_STEPS
                ? "inline-flex"
                : "none";

    }

}


function updateStepUI() {

    document
        .querySelectorAll(".step")
        .forEach(step => {

            step.classList.remove(
                "active"
            );

        });


    const activeStep =
        document.getElementById(
            `step${currentStep}`
        );


    if (activeStep) {

        activeStep.classList.add(
            "active"
        );

    }


    updateProgress();

    updateButtons();

}


/*======================================
    SHOW STEP
======================================*/

function showStep(step) {

    if (
        step < 1 ||
        step > TOTAL_STEPS
    ) {
        return;
    }


    currentStep = step;

    updateStepUI();


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


/*======================================
    STEP 1 VALIDATION
======================================*/

function validateStep1() {

    const firstName =
        firstNameInput?.value.trim() || "";

    const lastName =
        lastNameInput?.value.trim() || "";

    const phone =
        normalizePhone(
            phoneInput?.value || ""
        );


    if (firstName.length < 2) {

        showMessage(
            "لطفاً نام خود را به‌درستی وارد کنید."
        );

        firstNameInput?.focus();

        return false;

    }


    if (lastName.length < 2) {

        showMessage(
            "لطفاً نام خانوادگی خود را به‌درستی وارد کنید."
        );

        lastNameInput?.focus();

        return false;

    }


    if (
        !isValidIranianMobile(phone)
    ) {

        showMessage(
            "لطفاً شماره موبایل معتبر وارد کنید. مثال: 09123456789"
        );

        phoneInput?.focus();

        return false;

    }


    if (phoneInput) {

        phoneInput.value =
            toPersianDigits(phone);

    }


    return true;

}


/*======================================
    STEP 2 VALIDATION
======================================*/

function validateStep2() {

    selectedService =
        getSelectedServiceObject();


    if (!selectedService) {

        showMessage(
            "لطفاً یکی از خدمات را انتخاب کنید."
        );

        return false;

    }


    return true;

}


/*======================================
    STEP 3 VALIDATION
======================================*/

function validateStep3() {

    if (!selectedDay) {

        showMessage(
            "لطفاً یک روز را انتخاب کنید."
        );

        return false;

    }


    return true;

}


/*======================================
    STEP 4 VALIDATION
======================================*/

async function validateStep4() {

    if (!selectedTime) {

        showMessage(
            "لطفاً ساعت مورد نظر خود را انتخاب کنید."
        );

        return false;

    }


    const booked =
        await isTimeBooked(
            selectedDay.key,
            selectedTime
        );


    if (booked) {

        showMessage(
            "این ساعت دیگر آزاد نیست. لطفاً ساعت دیگری انتخاب کنید."
        );

        await renderTimes();

        return false;

    }


    return true;

}


/*======================================
    VALIDATE CURRENT STEP
======================================*/

async function validateCurrentStep() {

    switch (currentStep) {

        case 1:
            return validateStep1();

        case 2:
            return validateStep2();

        case 3:
            return validateStep3();

        case 4:
            return await validateStep4();

        default:
            return false;

    }

}


/*======================================
    NEXT
======================================*/

async function goNext() {

    if (
        isSubmitting
    ) {
        return;
    }


    const valid =
        await validateCurrentStep();


    if (!valid) {
        return;
    }


    if (currentStep === 1) {

        selectedService = null;

    }


    if (
        currentStep < TOTAL_STEPS
    ) {

        showStep(
            currentStep + 1
        );

    }

}


/*======================================
    PREVIOUS
======================================*/

function goPrevious() {

    if (currentStep <= 1) {
        return;
    }


    currentStep--;


    if (currentStep === 3) {

        selectedTime = null;

    }


    if (currentStep === 2) {

        selectedDay = null;

        selectedTime = null;

    }


    updateStepUI();


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


/*======================================
    DAY NAMES
======================================*/

const PERSIAN_DAY_NAMES = [

    "یکشنبه",
    "دوشنبه",
    "سه‌شنبه",
    "چهارشنبه",
    "پنجشنبه",
    "جمعه",
    "شنبه"

];


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


/*======================================
    GREGORIAN → JALALI
======================================*/

function gregorianToJalali(
    gy,
    gm,
    gd
) {

    const gDaysInMonth = [

        31, 28, 31, 30, 31, 30,
        31, 31, 30, 31, 30, 31

    ];


    const jDaysInMonth = [

        31, 31, 31, 31, 31, 31,
        30, 30, 30, 30, 30, 29

    ];


    let gy2 =
        gy - 1600;

    let gm2 =
        gm - 1;

    let gd2 =
        gd - 1;


    let gDayNo =
        365 * gy2
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


    gDayNo +=
        gd2;


    let jDayNo =
        gDayNo - 79;


    const jNp =
        Math.floor(
            jDayNo / 12053
        );


    jDayNo %=
        12053;


    let jy =
        979 +
        33 * jNp +
        4 *
        Math.floor(
            jDayNo / 1461
        );


    jDayNo %=
        1461;


    if (
        jDayNo >= 366
    ) {

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


/*======================================
    DATE HELPERS
======================================*/

function createDateKey(date) {

    return [

        date.getFullYear(),

        String(
            date.getMonth() + 1
        ).padStart(2, "0"),

        String(
            date.getDate()
        ).padStart(2, "0")

    ].join("-");

}


function formatGregorianDate(date) {

    return createDateKey(date);

}


function sameDate(first, second) {

    return (
        first.getFullYear() ===
        second.getFullYear() &&

        first.getMonth() ===
        second.getMonth() &&

        first.getDate() ===
        second.getDate()
    );

}


/*======================================
    RENDER DAYS
======================================*/

function renderDays() {

    if (!daysContainer) {
        return;
    }


    daysContainer.innerHTML = "";


    selectedDay = null;

    selectedTime = null;


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
            gregorianToJalali(
                date.getFullYear(),
                date.getMonth() + 1,
                date.getDate()
            );


        const jalaliText =
            `${jalali.year}/${String(
                jalali.month
            ).padStart(2, "0")}/${String(
                jalali.day
            ).padStart(2, "0")}`;


        const dayCard =
            document.createElement("button");


        dayCard.type =
            "button";


        dayCard.className =
            "day-card";


        dayCard.dataset.date =
            createDateKey(date);


        dayCard.innerHTML = `

            <span class="day-name">
                ${PERSIAN_DAY_NAMES[
                    date.getDay()
                ]}
            </span>

            <span class="day-date">
                ${toPersianDigits(
                    jalaliText
                )}
            </span>

        `;


        dayCard.addEventListener(
            "click",
            () => {

                selectDay(
                    dayCard,
                    date,
                    jalaliText
                );

            }
        );


        daysContainer.appendChild(
            dayCard
        );

    }

}


/*======================================
    SELECT DAY
======================================*/

async function selectDay(
    card,
    date,
    jalaliText
) {

    document
        .querySelectorAll(".day-card")
        .forEach(item => {

            item.classList.remove(
                "selected"
            );

        });


    card.classList.add(
        "selected"
    );


    selectedDay = {

        key:
            createDateKey(date),

        date,

        jalali:
            jalaliText,

        gregorian:
            formatGregorianDate(date)

    };


    selectedTime = null;


    await renderTimes();

}


/*======================================
    PAST TIME
======================================*/

function isPastTime(time) {

    const normalized =
        normalizeTime(time);

    const parts =
        normalized.split(":");


    if (parts.length !== 2) {
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


    if (hour < currentHour) {
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


/*======================================
    FIRESTORE — BOOKED TIMES
======================================*/

async function getBookedTimes(
    dateKey
) {

    const booked =
        new Set();


    if (
        BOOKING_CONFIG.checkFirebase === false
    ) {

        return booked;

    }


    const bookingsRef =
        collection(
            db,
            BOOKINGS_COLLECTION
        );


    const q =
        query(
            bookingsRef,
            where(
                "dateKey",
                "==",
                dateKey
            )
        );


    const snapshot =
        await getDocs(q);


    snapshot.forEach(
        documentSnapshot => {

            const data =
                documentSnapshot.data();


            if (
                data &&
                data.time
            ) {

                booked.add(
                    normalizeTime(
                        data.time
                    )
                );

            }

        }
    );


    return booked;

}


/*======================================
    FIRESTORE — CHECK ONE TIME
======================================*/

async function isTimeBooked(
    dateKey,
    time
) {

    if (
        BOOKING_CONFIG.checkFirebase === false
    ) {

        return false;

    }


    const normalized =
        normalizeTime(time);


    const q =
        query(
            collection(
                db,
                BOOKINGS_COLLECTION
            ),

            where(
                "dateKey",
                "==",
                dateKey
            ),

            where(
                "time",
                "==",
                normalized
            )
        );


    const snapshot =
        await getDocs(q);


    return !snapshot.empty;

}


/*======================================
    TIMES LOADING
======================================*/

function showTimesLoading() {

    if (!timesContainer) {
        return;
    }


    timesContainer.innerHTML = `

        <div class="time-loading">

            <i class="fa-solid fa-spinner fa-spin"></i>

            <span>
                در حال بررسی ساعت‌های آزاد...
            </span>

        </div>

    `;

}


/*======================================
    NO TIMES
======================================*/

function showNoTimes() {

    if (!timesContainer) {
        return;
    }


    timesContainer.innerHTML = `

        <div class="time-empty">

            <i class="fa-solid fa-calendar-xmark"></i>

            <p>
                برای این روز ساعت آزادی باقی نمانده است.
            </p>

        </div>

    `;

}


/*======================================
    TIME ERROR
======================================*/

function showTimesError() {

    if (!timesContainer) {
        return;
    }


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


    retry?.addEventListener(
        "click",
        renderTimes
    );

}


/*======================================
    RENDER TIMES
======================================*/

async function renderTimes() {

    if (
        !timesContainer ||
        !selectedDay
    ) {

        return;

    }


    timesContainer.innerHTML = "";

    showTimesLoading();


    try {

        const bookedTimes =
            await getBookedTimes(
                selectedDay.key
            );


        const today =
            new Date();


        const selectedDate =
            new Date(
                selectedDay.date
            );


        const isToday =
            sameDate(
                today,
                selectedDate
            );


        let availableCount = 0;


        TIME_SLOTS.forEach(
            time => {

                const card =
                    document.createElement(
                        "button"
                    );


                card.type =
                    "button";


                card.className =
                    "time-card";


                card.dataset.time =
                    time;


                card.textContent =
                    toPersianDigits(
                        time
                    );


                /*
                    قبلاً رزرو شده
                */

                if (
                    bookedTimes.has(time)
                ) {

                    card.classList.add(
                        "booked"
                    );

                    card.disabled =
                        true;

                    card.title =
                        "این ساعت قبلاً رزرو شده است";


                    card.innerHTML = `

                        <i class="fa-solid fa-lock"></i>

                        ${toPersianDigits(time)}

                    `;


                    timesContainer.appendChild(
                        card
                    );


                    return;

                }


                /*
                    ساعت گذشته
                */

                if (
                    isToday &&
                    isPastTime(time)
                ) {

                    card.classList.add(
                        "disabled"
                    );

                    card.disabled =
                        true;

                    card.title =
                        "این ساعت گذشته است";


                    timesContainer.appendChild(
                        card
                    );


                    return;

                }


                /*
                    ساعت آزاد
                */

                availableCount++;


                card.addEventListener(
                    "click",
                    () => {

                        selectTime(
                            card,
                            time
                        );

                    }
                );


                timesContainer.appendChild(
                    card
                );

            }
        );


        if (
            availableCount === 0
        ) {

            showNoTimes();

        }

    }
    catch (error) {

        console.error(
            "خطا در دریافت ساعت‌ها:",
            error
        );

        showTimesError();

    }

}


/*======================================
    SELECT TIME
======================================*/

function selectTime(
    card,
    time
) {

    document
        .querySelectorAll(".time-card")
        .forEach(item => {

            item.classList.remove(
                "selected"
            );

        });


    card.classList.add(
        "selected"
    );


    selectedTime =
        normalizeTime(time);

}


/*======================================
    SERVICE EVENTS
======================================*/

function initializeServices() {

    document
        .querySelectorAll(
            'input[name="service"]'
        )
        .forEach(input => {

            input.addEventListener(
                "change",
                () => {

                    selectedService =
                        getSelectedServiceObject();

                    selectedDay =
                        null;

                    selectedTime =
                        null;

                    if (timesContainer) {

                        timesContainer.innerHTML =
                            "";

                    }

                }
            );

        });

}


/
*======================================
    PHONE INPUT
======================================*/

function initializePhoneInput() {

    if (!phoneInput) {
        return;
    }


    phoneInput.addEventListener(
        "input",
        () => {

            let value =
                toEnglishDigits(
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
                    value.substring(
                        0,
                        11
                    );

            }


            phoneInput.value =
                toPersianDigits(value);

        }
    );

}


/*======================================
    FORM SUBMIT
======================================*/

async function submitReservation() {

    if (isSubmitting) {
        return;
    }


    isSubmitting = true;

    setSubmitLoading(true);


    try {

        const firstName =
            firstNameInput.value.trim();

        const lastName =
            lastNameInput.value.trim();

        const phone =
            normalizePhone(
                phoneInput.value
            );


        selectedService =
            getSelectedServiceObject();


        /*
            بررسی نهایی
        */

        if (
            firstName.length < 2 ||
            lastName.length < 2 ||
            !isValidIranianMobile(phone)
        ) {

            showStep(1);

            throw new Error(
                "اطلاعات مشتری کامل نیست."
            );

        }


        if (!selectedService) {

            showStep(2);

            throw new Error(
                "خدمت انتخاب نشده است."
            );

        }


        if (!selectedDay) {

            showStep(3);

            throw new Error(
                "روز انتخاب نشده است."
            );

        }


        if (!selectedTime) {

            showStep(4);

            throw new Error(
                "ساعت انتخاب نشده است."
            );

        }


        /*
            بررسی نهایی Firebase
        */

        const alreadyBooked =
            await isTimeBooked(
                selectedDay.key,
                selectedTime
            );


        if (alreadyBooked) {

            await renderTimes();

            showStep(4);

            showMessage(
                "این ساعت همین الان رزرو شده است. لطفاً ساعت دیگری انتخاب کنید."
            );

            return;

        }


        /*
            اطلاعات رزرو
        */

        const bookingData = {

            firstName,

            lastName,

            phone,

            service: {

                id:
                    selectedService.id,

                name:
                    selectedService.name,

                duration:
                    selectedService.duration || 60

            },

            serviceName:
                selectedService.name,

            serviceDuration:
                selectedService.duration || 60,

            dateKey:
                selectedDay.key,

            date:
                selectedDay.jalali,

            gregorianDate:
                selectedDay.gregorian,

            time:
                selectedTime,

            status:
                "confirmed",

            createdAt:
                serverTimestamp()

        };


        /*
            ثبت در Firebase
        */

        const documentReference =
            await addDoc(
                collection(
                    db,
                    BOOKINGS_COLLECTION
                ),
                bookingData
            );


        currentBookingId =
            documentReference.id;


        /*
            نمایش موفقیت
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


        /*
            خطاهای اعتبارسنجی که پیام خودشان
            قبلاً نمایش داده شده‌اند.
        */

        if (
            error.message ===
            "اطلاعات مشتری کامل نیست." ||

            error.message ===
            "خدمت انتخاب نشده است." ||

            error.message ===
            "روز انتخاب نشده است." ||

            error.message ===
            "ساعت انتخاب نشده است."
        ) {

            showMessage(
                "لطفاً اطلاعات رزرو را کامل کنید."
            );

            return;

        }


        showMessage(
            "ثبت رزرو انجام نشد. لطفاً اتصال اینترنت را بررسی کنید و دوباره تلاش کنید."
        );

    }
    finally {

        isSubmitting =
            false;

        setSubmitLoading(
            false
        );

    }

}


/*======================================
    SUBMIT LOADING
======================================*/

function setSubmitLoading(
    loading
) {

    if (!submitBtn) {
        return;
    }


    if (loading) {

        submitBtn.disabled =
            true;


        submitBtn.dataset.original =
            submitBtn.innerHTML;


        submitBtn.innerHTML = `

            <i class="fa-solid fa-spinner fa-spin"></i>

            در حال ثبت رزرو...

        `;

    }
    else {

        submitBtn.disabled =
            false;


        if (
            submitBtn.dataset.original
        ) {

            submitBtn.innerHTML =
                submitBtn.dataset.original;

        }

    }

}


/*======================================
    SUCCESS MODAL
======================================*/

function showSuccessModal(
    booking
) {

    if (
        !successModal ||
        !successDetails
    ) {

        return;

    }


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
                booking.serviceName
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


/*======================================
    CLOSE SUCCESS MODAL
======================================*/

function closeSuccessModal() {

    if (!successModal) {
        return;
    }


    successModal.classList.remove(
        "active"
    );


    document.body.style.overflow =
        "";

}


/*======================================
    MODAL EVENTS
======================================*/

function initializeModal() {

    if (!successModal) {
        return;
    }


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


/*======================================
    ENTER KEY
======================================*/

function initializeEnterKey() {

    if (!reserveForm) {
        return;
    }


    reserveForm.addEventListener(
        "keydown",
        event => {

            if (
                event.key !== "Enter"
            ) {

                return;

            }


            if (
                currentStep <
                TOTAL_STEPS
            ) {

                event.preventDefault();

                goNext();

            }

        }
    );

}


/*======================================
    BUTTON EVENTS
======================================*/

function initializeButtons() {

    nextBtn?.addEventListener(
        "click",
        goNext
    );


    prevBtn?.addEventListener(
        "click",
        goPrevious
    );


    reserveForm?.addEventListener(
        "submit",
        event => {

            event.preventDefault();

            submitReservation();

        }
    );

}


/*======================================
    VISIBILITY REFRESH
======================================*/

function initializeVisibilityRefresh() {

    document.addEventListener(
        "visibilitychange",
        async () => {

            if (
                document.visibilityState !==
                "visible"
            ) {

                return;

            }


            if (
                currentStep === 4 &&
                selectedDay
            ) {

                await renderTimes();

            }

        }
    );

}


/*======================================
    AUTO REFRESH TIMES
======================================*/

function initializeAutoRefresh() {

    setInterval(
        async () => {

            if (
                document.visibilityState !==
                "visible"
            ) {

                return;

            }


            if (
                currentStep !== 4 ||
                !selectedDay
            ) {

                return;

            }


            try {

                await renderTimes();

            }
            catch (error) {

                console.error(
                    "خطا در به‌روزرسانی ساعت‌ها:",
                    error
                );

            }

        },

        30000
    );

}


/*======================================
    INITIALIZE
======================================*/

function initializeReservation() {

    currentStep =
        1;

    selectedService =
        null;

    selectedDay =
        null;

    selectedTime =
        null;

    currentBookingId =
        null;

    renderDays();

    initializeServices();

    initializePhoneInput();

    initializeButtons();

    initializeEnterKey();

    initializeModal();

    initializeVisibilityRefresh();

    initializeAutoRefresh();

    updateStepUI();

}


/*======================================
    START
======================================*/

initializeReservation();


/*======================================
    READY
======================================*/

console.log(
    "Salon Mojezeh Reservation System Ready"
);
