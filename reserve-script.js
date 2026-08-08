/*=========================================================
    SALON MOJEZEH
    reserve-script.js
    FINAL — Reservation System
=========================================================*/

"use strict";

/*=========================================================
  IMPORTS
=========================================================*/

import { db } from "./firebase.js";

import RESERVATION_CONFIG from "./data/config.js";

import {
    collection,
    query,
    where,
    getDocs,
    doc,
    runTransaction,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


/*=========================================================
  CONFIGURATION
=========================================================*/

const CONFIG = RESERVATION_CONFIG || {};

const TOTAL_STEPS = 4;

/*
  خدمات از config.js خوانده می‌شوند.
  اگر به هر دلیل config خدمات نداشت،
  خود HTML مرجع قرار می‌گیرد.
*/
const SERVICES_CONFIG =
    Array.isArray(CONFIG.services)
        ? CONFIG.services
        : [];


/*
  تنظیمات ساعت کاری
*/
const WORKING_HOURS =
    CONFIG.workingHours || {};


/*
  تنظیمات تقویم
*/
const CALENDAR_CONFIG =
    CONFIG.calendar || {};


/*
  تنظیمات رزرو
*/
const BOOKING_CONFIG =
    CONFIG.booking || {};


/*
  نام Collection رزروها

  اولویت:
  booking.collection
  booking.collectionName
  bookingsCollection
  در غیر این صورت:
  bookings
*/
const BOOKINGS_COLLECTION =
    BOOKING_CONFIG.collection ||
    BOOKING_CONFIG.collectionName ||
    CONFIG.bookingsCollection ||
    "bookings";


/*
  ساعت شروع
*/
const WORK_START =
    WORKING_HOURS.start || "09:00";


/*
  آخرین ساعت قابل رزرو
*/
const WORK_END =
    WORKING_HOURS.lastBookingTime ||
    WORKING_HOURS.end ||
    "21:00";


/*
  فاصله بین ساعت‌ها

  طبق درخواست فعلی:
  یک ساعت یک ساعت
*/
const WORK_INTERVAL =
    Number(
        WORKING_HOURS.interval
    ) > 0
        ? Number(WORKING_HOURS.interval)
        : 60;


/*
  تعداد روزهای قابل نمایش
*/
const DAYS_TO_SHOW =
    Number(
        CALENDAR_CONFIG.daysToShow
    ) > 0
        ? Number(CALENDAR_CONFIG.daysToShow)
        : 30;


/*=========================================================
  DOM
=========================================================*/

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


/*=========================================================
  STATE
=========================================================*/

let currentStep = 1;

let selectedService = null;

let selectedDay = null;

let selectedTime = null;

let isSubmitting = false;

let currentBookingId = null;


/*=========================================================
  DIGITS
=========================================================*/

function toEnglishDigits(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value)

        .replace(
            /[۰-۹]/g,
            digit =>
                String(
                    "۰۱۲۳۴۵۶۷۸۹"
                        .indexOf(digit)
                )
        )

        .replace(
            /[٠-٩]/g,
            digit =>
                String(
                    "٠١٢٣٤٥٦٧٨٩"
                        .indexOf(digit)
                )
        );
}


function toPersianDigits(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value).replace(
        /\d/g,
        digit =>
            "۰۱۲۳۴۵۶۷۸۹"[digit]
    );
}


/*=========================================================
  PHONE
=========================================================*/

function normalizePhone(value) {

    let phone =
        toEnglishDigits(value)
            .replace(/\s+/g, "")
            .replace(/-/g, "")
            .replace(/\(/g, "")
            .replace(/\)/g, "");


    if (
        phone.startsWith("+98")
    ) {

        phone =
            "0" +
            phone.substring(3);

    }


    if (
        phone.startsWith("0098")
    ) {

        phone =
            "0" +
            phone.substring(4);

    }


    return phone;
}


function isValidIranianMobile(value) {

    return /^09\d{9}$/.test(
        normalizePhone(value)
    );

}


/*=========================================================
  HTML ESCAPE
=========================================================*/

function escapeHTML(value) {

    return String(value ?? "")

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
  TIME HELPERS
=========================================================*/

function timeToMinutes(time) {

    const parts =
        String(time)
            .split(":");

    if (
        parts.length !== 2
    ) {

        return NaN;

    }

    const hours =
        Number(parts[0]);

    const minutes =
        Number(parts[1]);

    if (
        !Number.isFinite(hours) ||
        !Number.isFinite(minutes)
    ) {

        return NaN;

    }

    return (
        hours * 60 +
        minutes
    );

}


function minutesToTime(minutes) {

    const hours =
        Math.floor(
            minutes / 60
        );

    const mins =
        minutes % 60;

    return (
        String(hours)
            .padStart(2, "0")
        +
        ":"
        +
        String(mins)
            .padStart(2, "0")
    );

}


function normalizeTime(time) {

    if (!time) {

        return "";

    }

    const value =
        toEnglishDigits(time)
            .trim();

    const parts =
        value.split(":");

    if (
        parts.length !== 2
    ) {

        return value;

    }

    return (
        String(parts[0])
            .padStart(2, "0")
        +
        ":"
        +
        String(parts[1])
            .padStart(2, "0")
    );

}


/*=========================================================
  GENERATE TIME SLOTS
=========================================================*/

function generateTimeSlots() {

    const slots = [];

    const start =
        timeToMinutes(
            WORK_START
        );

    const end =
        timeToMinutes(
            WORK_END
        );

    const interval =
        WORK_INTERVAL;


    if (
        !Number.isFinite(start) ||
        !Number.isFinite(end) ||
        start >= end
    ) {

        console.error(
            "تنظیمات ساعت کاری صحیح نیست."
        );

        return slots;

    }


    for (
        let current = start;
        current <= end;
        current += interval
    ) {

        slots.push(
            minutesToTime(current)
        );

    }


    return slots;

}


const TIME_SLOTS =
    generateTimeSlots();


/*=========================================================
  SERVICES
=========================================================*/

function getServiceById(id) {

    return (
        SERVICES_CONFIG.find(
            service =>
                String(service?.id) ===
                String(id)
        )
        ||
        null
    );

}


function getServiceByName(name) {

    if (!name) {

        return null;

    }

    return (
        SERVICES_CONFIG.find(
            service =>
                String(service?.name)
                    .trim()
                ===
                String(name)
                    .trim()
        )
        ||
        null
    );

}


function getSelectedService() {

    const input =
        document.querySelector(
            'input[name="service"]:checked'
        );


    if (!input) {

        return null;

    }


    const serviceId =
        input.value;


    /*
      اگر config بر اساس ID باشد
    */
    const byId =
        getServiceById(
            serviceId
        );


    if (byId) {

        return byId;

    }


    /*
      اگر HTML نام فارسی داشته باشد
    */
    const byName =
        getServiceByName(
            serviceId
        );


    if (byName) {

        return byName;

    }


    /*
      اگر config هنوز خدمات را نداشته باشد،
      خود HTML را معتبر می‌دانیم.
    */
    return {

        id:
            serviceId,

        name:
            serviceId,

        duration:
            60

    };

}


/*=========================================================
  INITIALIZE SERVICES
=========================================================*/

function initializeServices() {

    const inputs =
        document.querySelectorAll(
            'input[name="service"]'
        );


    inputs.forEach(
        input => {

            input.addEventListener(
                "change",
                () => {

                    selectedService =
                        getSelectedService();

                    selectedTime =
                        null;

                    document
                        .querySelectorAll(
                            ".time-card.selected"
                        )
                        .forEach(
                            card =>
                                card.classList
                                    .remove(
                                        "selected"
                                    )
                        );

                }
            );

        }
    );

}


/*=========================================================
  DATE HELPERS
=========================================================*/

const PERSIAN_DAYS = [

    "یکشنبه",
    "دوشنبه",
    "سه‌شنبه",
    "چهارشنبه",
    "پنجشنبه",
    "جمعه",
    "شنبه"

];


const PERSIAN_MONTHS = [

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


/*=========================================================
  GREGORIAN → JALALI
=========================================================*/

function gregorianToJalali(
    gy,
    gm,
    gd
) {

    const gdm = [

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


    if (
        gy > 1600
    ) {

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

        gdm[gm - 1];


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
                ? days % 31
                : (days - 186) % 30
        );


    return {

        year: jy,
        month: jm,
        day: jd

    };

}


/*=========================================================
  DATE KEY
=========================================================*/

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


/*=========================================================
  GREGORIAN FORMAT
=========================================================*/

function formatGregorianDate(date) {

    return createDateKey(date);

}


/*=========================================================
  GENERATE CALENDAR
=========================================================*/

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


    for (
        let i = 0;
        i < DAYS_TO_SHOW;
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


        days.push({

            date,

            dateKey:
                createDateKey(date),

            dayName:
                PERSIAN_DAYS[
                    date.getDay()
                ],

            jalaliYear:
                jalali.year,

            jalaliMonth:
                jalali.month,

            jalaliDay:
                jalali.day,

            jalaliMonthName:
                PERSIAN_MONTHS[
                    jalali.month - 1
                ]

        });

    }


    return days;

}


/*=========================================================
  RENDER DAYS
=========================================================*/

function renderDays() {

    if (!daysContainer) {

        return;

    }


    daysContainer.innerHTML = "";


    selectedDay = null;

    selectedTime = null;


    const days =
        generateCalendarDays();


    days.forEach(
        day => {

            const button =
                document.createElement(
                    "button"
                );


            button.type =
                "button";


            button.className =
                "day-card";


            button.dataset.date =
                day.dateKey;


            button.innerHTML = `

                <span class="day-name">
                    ${escapeHTML(
                        day.dayName
                    )}
                </span>

                <span class="day-date">
                    ${toPersianDigits(
                        day.jalaliYear
                    )}
                    /
                    ${toPersianDigits(
                        String(
                            day.jalaliMonth
                        ).padStart(2, "0")
                    )}
                    /
                    ${toPersianDigits(
                        String(
                            day.jalaliDay
                        ).padStart(2, "0")
                    )}
                </span>

            `;


            button.addEventListener(
                "click",
                () => {

                    selectDay(
                        button,
                        day
                    );

                }
            );


            daysContainer.appendChild(
                button
            );

        }
    );

}


/*=========================================================
  SELECT DAY
=========================================================*/

async function selectDay(
    card,
    day
) {

    document
        .querySelectorAll(
            ".day-card"
        )
        .forEach(
            item =>
                item.classList
                    .remove(
                        "selected"
                    )
        );


    card.classList.add(
        "selected"
    );


    selectedDay = {

        key:
            day.dateKey,

        date:
            day.date,

        gregorian:
            formatGregorianDate(
                day.date
            ),

        jalali:
            `${day.jalaliYear}/` +
            `${String(
                day.jalaliMonth
            ).padStart(2, "0")}/` +
            `${String(
                day.jalaliDay
            ).padStart(2, "0")}`

    };


    selectedTime = null;


    if (timesContainer) {

        timesContainer.innerHTML = "";

    }


    /*
      وقتی روز انتخاب شد،
      ساعت‌های آن روز بررسی می‌شوند.
    */
    await renderTimes();

}


/*=========================================================
  FIRESTORE — BOOKED TIMES
=========================================================*/

async function getBookedTimes(
    dateKey
) {

    const booked =
        new Set();


    try {

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
                )
            );


        const snapshot =
            await getDocs(q);


        snapshot.forEach(
            docSnapshot => {

                const data =
                    docSnapshot.data();


                if (
                    data?.time
                ) {

                    booked.add(
                        normalizeTime(
                            data.time
                        )
                    );

                }

            }
        );


    }
    catch (error) {

        console.error(
            "خطا در دریافت رزروها:",
            error
        );

        /*
          خطا را به caller می‌دهیم
          تا UI وضعیت خطا را نشان دهد.
        */
        throw error;

    }


    return booked;

}


/*=========================================================
  PAST TIME
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


    const currentMinutes =
        now.getHours() * 60 +
        now.getMinutes();


    const slotMinutes =
        hour * 60 +
        minute;


    return (
        slotMinutes <=
        currentMinutes
    );

}


/*=========================================================
  RENDER TIMES
=========================================================*/

async function renderTimes() {

    if (
        !timesContainer ||
        !selectedDay
    ) {

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


    try {

        const bookedTimes =
            await getBookedTimes(
                selectedDay.key
            );


        timesContainer.innerHTML =
  
