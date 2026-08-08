/*======================================
    Salon Mojezeh
    reserve-script.js
    Final Reservation System
======================================*/

"use strict";

/*======================================
    Imports
======================================*/

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
    Configuration
======================================*/

const CONFIG = RESERVATION_CONFIG;

const SERVICES = CONFIG.services || [];

const WORKING_HOURS = CONFIG.workingHours || {};

const CALENDAR_CONFIG = CONFIG.calendar || {};

const BOOKING_CONFIG = CONFIG.booking || {};

const BOOKINGS_COLLECTION =
    BOOKING_CONFIG.collection || "reservations";

const TOTAL_STEPS = 4;


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
    State
======================================*/

let currentStep = 1;

let selectedService = null;

let selectedDay = null;

let selectedTime = null;

let isSubmitting = false;

let currentBookingId = null;


/*======================================
    Persian Digits
======================================*/

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


/*======================================
    English Digits
======================================*/

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
                    "۰۱۲۳۴۵۶۷۸۹".indexOf(digit)
                )
        )

        .replace(
            /[٠-٩]/g,
            digit =>
                String(
                    "٠١٢٣٤٥٦٧٨٩".indexOf(digit)
                )
        );
}


/*======================================
    Normalize Phone
======================================*/

function normalizePhone(value) {

    let phone =
        toEnglishDigits(value)
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


/*======================================
    Validate Mobile
======================================*/

function isValidIranianMobile(value) {

    return /^09\d{9}$/.test(
        normalizePhone(value)
    );

}


/*======================================
    Escape HTML
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
    Time To Minutes
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


/*======================================
    Minutes To Time
======================================*/

function minutesToTime(minutes) {

    const hours =
        Math.floor(minutes / 60);

    const mins =
        minutes % 60;

    return (
        String(hours).padStart(2, "0") +
        ":" +
        String(mins).padStart(2, "0")
    );

}


/*======================================
    Generate Time Slots
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
            WORKING_HOURS.end ||
            "21:00"
        );

    /*
      طبق تنظیمات فعلی:
      هر ۶۰ دقیقه یک نوبت
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
    Service Helpers
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
    Initialize Services
======================================*/

function initializeServices() {

    const inputs =
        document.querySelectorAll(
            'input[name="service"]'
        );


    inputs.forEach(input => {

        input.addEventListener(
            "change",
            () => {

                selectedService =
                    getSelectedServiceObject();

                selectedTime = null;

            }
        );

    });

}


/*======================================
    Persian Calendar
======================================*/

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


const PERSIAN_DAY_NAMES = [

    "یکشنبه",
    "دوشنبه",
    "سه‌شنبه",
    "چهارشنبه",
    "پنجشنبه",
    "جمعه",
    "شنبه"

];


/*======================================
    Gregorian To Jalali
======================================*/

function gregorianToJalali(
    gy,
    gm,
    gd
) {

    const gDays = [

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

        gDays[gm - 1];


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


    if (days > 365) {

        jy +=
            Math.floor(
                (days - 1) / 365
            );

        days =
            (days - 1) % 365;

    }


    let jm;


    if (days < 186) {

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

        jy,
        jm,
        jd

    };

}


/*======================================
    Format Gregorian
======================================*/

function formatGregorianDate(date) {

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


/*======================================
    Date Key
======================================*/

function createDateKey(date) {

    return formatGregorianDate(date);

}


/*======================================
    Same Date
======================================*/

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


/*======================================
    Generate Calendar
======================================*/

function generateCalendarDays() {

    const result = [];

    const today = new Date();

    today.setHours(
        0,
        0,
        0,
        0
    );


    const count =
        Number(
            CALENDAR_CONFIG.daysToShow
        ) || 30;


    for (
        let i = 0;
        i < count;
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


        result.push({

            date,

            dateKey:
                createDateKey(date),

            dayName:
                PERSIAN_DAY_NAMES[
                    date.getDay()
                ],

            jalaliYear:
                jalali.jy,

            jalaliMonth:
                jalali.jm,

            jalaliDay:
                jalali.jd,

            monthName:
                PERSIAN_MONTH_NAMES[
                    jalali.jm - 1
                ]

        });

    }


    return result;

}


/*======================================
    Render Days
======================================*/

function renderDays() {

    if (!daysContainer) {

        return;

    }


    daysContainer.innerHTML = "";

    selectedDay = null;

    selectedTime = null;


    const days =
        generateCalendarDays();


    days.forEach(day => {

        const card =
            document.createElement("button");


        card.type = "button";

        card.className =
            "day-card";


        card.dataset.date =
            day.dateKey;


        card.innerHTML = `

            <span class="day-name">
                ${escapeHTML(
                    day.dayName
                )}
            </span>

            <span class="day-date">
                ${toPersianDigits(
                    `${day.jalaliYear}/${String(
                        day.jalaliMonth
                    ).padStart(2, "0")}/${String(
                        day.jalaliDay
                    ).padStart(2, "0")}`
                )}
            </span>

        `;


        card.addEventListener(
            "click",
            () => {

                selectDay(
                    card,
                    day
                );

            }
        );


        daysContainer.appendChild(card);

    });

}


/*======================================
    Select Day
======================================*/

async function selectDay(
    card,
    day
) {

    document
        .querySelectorAll(
            ".day-card"
        )
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
            day.dateKey,

        date:
            day.date,

        gregorian:
            formatGregorianDate(
                day.date
            ),

        jalali:
            `${day.jalaliYear}/${String(
                day.jalaliMonth
            ).padStart(2, "0")}/${String(
                day.jalaliDay
            ).padStart(2, "0")}`

    };


    selectedTime = null;


    if (timesContainer) {

        timesContainer.innerHTML = "";

    }

}


/*======================================
    Normalize Time
======================================*/

function normalizeTime(time) {

    if (!time) {

        return "";

    }


    const value =
        toEnglishDigits(
            time
        ).trim();


    const parts =
        value.split(":");


    if (parts.length !== 2) {

        return value;

    }


    return (

        String(
            Number(parts[0])
        ).padStart(2, "0")

        +

        ":" +

        String(
            Number(parts[1])
        ).padStart(2, "0")

    );

}


/*======================================
    Is Past Time
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


/*======================================
    Firestore — Get Booked Times
======================================*/

async function getBookedTimes(
    dateKey
) {

    const result =
        new Set();


    if (
        BOOKING_CONFIG.checkFirebase === false
    ) {

        return result;

    }


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
                data &&
                data.time
            ) {

                result.add(
                    normalizeTime(
                        data.time
                    )
                );

            }

        }
    );


    return result;

}


/*======================================
    Check Single Time
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
                normalizeTime(time)
            )

        );


    const snapshot =
        await getDocs(q);


    return !snapshot.empty;

}


/*======================================
    Render Times
======================================*/

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


        timesContainer.innerHTML = "";


        TIME_SLOTS.forEach(
            time => {

                const card =
                    document.createElement(
                        "button"
                    );


                card.type = "button";

                card.className =
                    "time-card";


                card.dataset.time =
                    time;


                card.textContent =
                    toPersianDigits(
                        time
                    );


                /*------------------------------
                    رزرو شده
                ------------------------------*/

                if (
                    bookedTimes.has(time)
                ) {

                    card.classList.add(
                        "booked"
                    );

                    card.disabled =
                        true;

                    card.innerHTML = `

                        <i class="fa-solid fa-lock"></i>

                        ${toPersianDigits(
                            time
                        )}

                    `;

                    timesContainer.appendChild(
                        card
                    );

                    return;

                }


                /*------------------------------
                    ساعت گذشته
                ------------------------------*/

                if (
                    isToday &&
                    isPastTime(time)
                ) {

                    card.classList.add(
                        "disabled"
                    );

                    card.disabled =
                        true;

                    timesContainer.appendChild(
                        card
                    );

                    return;

                }


                /*------------------------------
                    ساعت آزاد
                ------------------------------*/

                card.addEventListener(
                    "click",
                    () => {

                        document
                            .querySelectorAll(
                                ".time-card"
                            )
                            .forEach(
                                item => {

                                    item.classList.remove(
                                        "selected"
                                    );

                                }
                            );


                        card.classList.add(
                            "selected"
  
