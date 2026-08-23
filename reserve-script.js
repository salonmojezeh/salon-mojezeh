// ==========================================
// Salon Mojezeh
// reserve-script.js
// SUPABASE RESERVATION SYSTEM
// 5 STEP BOOKING
// ==========================================

"use strict";

import {
    loadBookedTimes,
    addReservation,
    saveCustomer
} from "./supabase.js";


// ==========================================
// DOM Elements
// ==========================================

const reserveForm =
    document.getElementById("reserveForm");

const nextBtn =
    document.getElementById("nextBtn");

const prevBtn =
    document.getElementById("prevBtn");

const submitBtn =
    document.getElementById("submitBtn");

const progressBar =
    document.getElementById("progressBar");

const daysContainer =
    document.getElementById("daysContainer");

const timesContainer =
    document.getElementById("timesContainer");

const successModal =
    document.getElementById("successModal");

const successDetails =
    document.getElementById("successDetails");


// ==========================================
// Steps
// ==========================================

const steps = [
    document.getElementById("step1"),
    document.getElementById("step2"),
    document.getElementById("step3"),
    document.getElementById("step4"),
    document.getElementById("step5")
];

let currentStep = 1;


// ==========================================
// Reservation Data
// ==========================================

const reservationData = {

    firstName: "",
    lastName: "",
    phone: "",

    barberId: "",
    barberName: "",

    service: "",
    serviceDuration: 0,

    date: "",
    displayDate: "",

    time: ""

};


// ==========================================
// Configuration
// ==========================================

const RESERVATION_CONFIG = {

    daysToShow: 30,

    workingHours: {

        start: "10:00",

        end: "22:00",

        lastBookingTime: "21:00",

        interval: 60

    }

};


// ==========================================
// Services
// ==========================================

const serviceDurations = {

    "اصلاح سر و صورت": 60,

    "حالت مو": 30,

    "خط و سایه": 30,

    "سایه ریش": 30

};


// ==========================================
// Working Hours
// ==========================================

const workingHours = [

    "10:00",
    "11:00",
    "12:00",
    "13:00",
    "14:00",
    "15:00",
    "16:00",
    "17:00",
    "18:00",
    "19:00",
    "20:00",
    "21:00"

];


// ==========================================
// Persian Days
// ==========================================

const persianDays = [

    "یکشنبه",
    "دوشنبه",
    "سه‌شنبه",
    "چهارشنبه",
    "پنجشنبه",
    "جمعه",
    "شنبه"

];


// ==========================================
// Network Retry
// ==========================================

const RETRY_COUNT = 3;

const RETRY_DELAY = 800;


function sleep(ms) {

    return new Promise(
        resolve =>
            setTimeout(resolve, ms)
    );

}


async function retryRequest(
    requestFunction,
    retries = RETRY_COUNT
) {

    let lastError = null;

    for (
        let attempt = 1;
        attempt <= retries;
        attempt++
    ) {

        try {

            return await requestFunction();

        }

        catch (error) {

            lastError = error;

            console.warn(
                `Supabase attempt ${attempt}/${retries} failed`,
                error
            );

            if (
                attempt < retries
            ) {

                await sleep(
                    RETRY_DELAY * attempt
                );

            }

        }

    }

    throw lastError;

}


// ==========================================
// DOM Ready
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    initializeReservation
);


// ==========================================
// Initialize
// ==========================================

function initializeReservation() {

    showStep(1);

    createDays();

    updateButtons();

    setupBarberSelection();

    setupServiceSelection();

    setupPhoneInput();

    console.log(
        "Supabase reservation system initialized."
    );

}


// ==========================================
// Show Step
// ==========================================

function showStep(stepNumber) {

    currentStep =
        Math.max(
            1,
            Math.min(
                5,
                stepNumber
            )
        );


    steps.forEach(
        (step, index) => {

            if (!step) return;

            step.classList.toggle(
                "active",
                index + 1 === currentStep
            );

        }
    );


    updateProgress();

    updateButtons();


    if (
        currentStep === 5
    ) {

        createTimes();

    }


    window.scrollTo({

        top: 0,

        behavior: "smooth"

    });

}


// ==========================================
// Progress
// ==========================================

function updateProgress() {

    if (!progressBar) return;

    const percentage =
        (currentStep / steps.length) * 100;

    progressBar.style.width =
        `${percentage}%`;

}


// ==========================================
// Buttons
// ==========================================

function updateButtons() {

    if (
        !prevBtn ||
        !nextBtn ||
        !submitBtn
    ) {

        return;

    }


    prevBtn.style.display =
        currentStep === 1
            ? "none"
            : "flex";


    if (
        currentStep === 5
    ) {

        nextBtn.style.display =
            "none";

        submitBtn.style.display =
            "flex";

    }

    else {

        nextBtn.style.display =
            "flex";

        submitBtn.style.display =
            "none";

    }

}


// ==========================================
// Next
// ==========================================

nextBtn?.addEventListener(
    "click",
    () => {

        if (
            !validateCurrentStep()
        ) {

            return;

        }


        if (
            currentStep < 5
        ) {

            showStep(
                currentStep + 1
            );

        }

    }
);


// ==========================================
// Previous
// ==========================================

prevBtn?.addEventListener(
    "click",
    () => {

        if (
            currentStep > 1
        ) {

            showStep(
                currentStep - 1
            );

        }

    }
);


// ==========================================
// Validation Router
// ==========================================

function validateCurrentStep() {

    switch (currentStep) {

        case 1:
            return validateCustomer();

        case 2:
            return validateBarber();

        case 3:
            return validateService();

        case 4:
            return validateDate();

        case 5:
            return validateTime();

        default:
            return true;

    }

}


// ==========================================
// Customer Validation
// ==========================================

function validateCustomer() {

    const firstName =
        document
            .getElementById("firstName")
            ?.value
            .trim();

    const lastName =
        document
            .getElementById("lastName")
            ?.value
            .trim();

    const phone =
        document
            .getElementById("phone")
            ?.value
            .trim();


    if (!firstName) {

        alert(
            "لطفاً نام خود را وارد کنید."
        );

        return false;

    }


    if (!lastName) {

        alert(
            "لطفاً نام خانوادگی خود را وارد کنید."
        );

        return false;

    }


    if (
        !/^09\d{9}$/.test(phone)
    ) {

        alert(
            "شماره موبایل صحیح نیست."
        );

        return false;

    }


    reservationData.firstName =
        firstName;

    reservationData.lastName =
        lastName;

    reservationData.phone =
        phone;


    return true;

}


// ==========================================
// Phone Input
// ==========================================

function setupPhoneInput() {

    const phone =
        document.getElementById("phone");


    if (!phone) return;


    phone.addEventListener(
        "input",
        () => {

            phone.value =
                phone.value
                    .replace(/\D/g, "")
                    .slice(0, 11);

        }
    );

}


// ==========================================
// Barber Selection
// ==========================================

function setupBarberSelection() {

    const barberInputs =
        document.querySelectorAll(
            'input[name="barber"]'
        );


    barberInputs.forEach(
        input => {

            input.addEventListener(
                "change",
                () => {

                    reservationData.barberId =
                        input.value;

                    reservationData.barberName =
                        input.dataset.name ||
                        input
                            .closest(".barber-card")
                            ?.querySelector("h4")
                            ?.textContent
                            .trim() ||
                        input.value;


                    /*
                     * با تغییر آرایشگر
                     * روز و ساعت قبلی دیگر
                     * قابل اعتماد نیستند.
                     */

                    reservationData.date = "";

                    reservationData.displayDate = "";

                    reservationData.time = "";


                    createDays();


                    if (
                        currentStep === 5
                    ) {

                        createTimes();

                    }

                }
            );

        }
    );

}


// ==========================================
// Validate Barber
// ==========================================

function validateBarber() {

    if (
        !reservationData.barberId
    ) {

        alert(
            "لطفاً آرایشگر مورد نظر خود را انتخاب کنید."
        );

        return false;

    }


    return true;

}


// ==========================================
// Service Selection
// ==========================================

function setupServiceSelection() {

    const serviceInputs =
        document.querySelectorAll(
            'input[name="service"]'
        );


    serviceInputs.forEach(
        input => {

            input.addEventListener(
                "change",
                () => {

                    reservationData.service =
                        input.value;

                    reservationData.serviceDuration =
                        serviceDurations[
                            input.value
                        ] || 30;

                }
            );

        }
    );

}


// ==========================================
// Validate Service
// ==========================================

function validateService() {

    if (
        !reservationData.service
    ) {

        alert(
            "لطفاً خدمت مورد نظر خود را انتخاب کنید."
        );

        return false;

    }


    return true;

}


// ==========================================
// Create Days
// ==========================================

function createDays() {

    if (!daysContainer) return;


    daysContainer.innerHTML = "";


    const today =
        new Date();


    for (
        let i = 0;
        i < RESERVATION_CONFIG.daysToShow;
        i++
    ) {

        const date =
            new Date(today);


        date.setHours(
            0,
            0,
            0,
            0
        );


        date.setDate(
            today.getDate() + i
        );


        const isoDate =
            formatISODate(date);


        const displayDate =
            formatPersianDate(date);


        const dayCard =
            document.createElement("div");


        dayCard.className =
            "day-card";


        dayCard.dataset.date =
            isoDate;


        dayCard.innerHTML = `

            <span class="day-name">
                ${escapeHTML(
                    persianDays[
                        date.getDay()
                    ]
                )}
            </span>

            <span class="day-date">
                ${escapeHTML(
                    displayDate
                )}
            </span>

        `;


        if (
            reservationData.date ===
            isoDate
        ) {

            dayCard.classList.add(
                "selected"
            );

        }


        dayCard.addEventListener(
            "click",
            () => {

                document
                    .querySelectorAll(
                        ".day-card"
                    )
                    .forEach(
                        card => {

                            card.classList.remove(
                                "selected"
                            );

                        }
                    );


                dayCard.classList.add(
                    "selected"
                );


                reservationData.date =
                    isoDate;

                reservationData.displayDate =
                    displayDate;


                /*
                 * انتخاب روز جدید
                 * ساعت قبلی را پاک می‌کند.
                 */

                reservationData.time =
                    "";

            }
        );


        daysContainer.appendChild(
            dayCard
        );

    }

}


// ==========================================
// Validate Date
// ==========================================

function validateDate() {

    if (
        !reservationData.date
    ) {

        alert(
            "لطفاً روز مورد نظر خود را انتخاب کنید."
        );

        return false;

    }


    return true;

}


// ==========================================
// Create Times
// ==========================================

async function createTimes() {

    if (!timesContainer) return;


    timesContainer.innerHTML = "";


    if (
        !reservationData.barberId
    ) {

        showTimeMessage(
            "ابتدا آرایشگر را انتخاب کنید."
        );

        return;

    }


    if (
        !reservationData.date
    ) {

        showTimeMessage(
            "ابتدا روز مورد نظر را انتخاب کنید."
        );

        return;

    }


    timesContainer.innerHTML = `

        <div class="time-loading">

            <i class="fa-solid fa-spinner fa-spin"></i>

            در حال بررسی ساعت‌های آزاد...

        </div>

    `;


    let bookedTimes = [];


    try {

        bookedTimes =
            await retryRequest(
                () =>
                    loadBookedTimes(
                        reservationData.barberId,
                        reservationData.date
                    )
            );


        if (
            !Array.isArray(bookedTimes)
        ) {

            bookedTimes = [];

        }

    }

    catch (error) {

        console.error(
            "Supabase booked times error:",
            error
        );


        timesContainer.innerHTML = `

            <div class="time-message">

                <i class="fa-solid fa-triangle-exclamation"></i>

                <br><br>

                اتصال به سامانه رزرو برقرار نشد.

                <br>

                لطفاً اینترنت خود را بررسی کنید
                و دوباره وارد این مرحله شوید.

            </div>

        `;

        return;

    }


    timesContainer.innerHTML = "";


    workingHours.forEach(
        time => {

            const card =
                document.createElement("div");


            card.className =
                "time-card";


            card.dataset.time =
                time;


            const isBooked =
                bookedTimes.some(
                    bookedTime =>
                        String(
                            bookedTime
                        ) === time
                );


            // ==================================
            // Booked
            // ==================================

            if (isBooked) {

                card.classList.add(
                    "booked"
                );


                card.setAttribute(
                    "aria-disabled",
                    "true"
                );


                card.innerHTML = `

                    <i class="fa-solid fa-lock"></i>

                    <span>
                        ${escapeHTML(time)}
                    </span>

                    <small>
                        رزرو شده
                    </small>

                `;


                timesContainer.appendChild(
                    card
                );

                return;

            }


            // ==================================
            // Available
            // ==================================

            card.innerHTML = `

                <i class="fa-regular fa-clock"></i>

                <span>
                    ${escapeHTML(time)}
                </span>

            `;


            if (
                reservationData.time ===
                time
            ) {

                card.classList.add(
                    "selected"
                );

            }


            card.addEventListener(
                "click",
                () => {

                    document
                        .querySelectorAll(
                            ".time-card:not(.booked)"
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
                    );


                    reservationData.time =
                        time;

                }
            );


            timesContainer.appendChild(
                card
            );

        }
    );

}


// ==========================================
// Time Message
// ==========================================

function showTimeMessage(message) {

    if (!timesContainer) return;


    timesContainer.innerHTML = `

        <div class="time-message">

            ${escapeHTML(message)}

        </div>

    `;

}


// ==========================================
// Validate Time
// ==========================================

function validateTime() {

    if (
        !reservationData.time
    ) {

        alert(
            "لطفاً ساعت مورد نظر خود را انتخاب کنید."
        );

        return false;

    }


    return true;

}


// ==========================================
// FINAL SUBMIT
// ==========================================
  
reserveForm?.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        if (
            submitBtn?.disabled
        ) {

            return;

        }


        /*
         * آخرین Validation
         */

        if (
            !validateCustomer() ||
            !validateBarber() ||
            !validateService() ||
            !validateDate() ||
            !validateTime()
        ) {

            return;

        }


        /*
         * جلوگیری از تغییر اطلاعات
         * در زمان ارسال درخواست
         */

        const finalData = {

            ...reservationData

        };


        submitBtn.disabled =
            true;


        submitBtn.innerHTML = `

            <i class="fa-solid fa-spinner fa-spin"></i>

            در حال ثبت رزرو...

        `;


        try {

            /*
             * مرحله ۱:
             * ثبت رزرو در Supabase
             *
             * Unique Index دیتابیس
             * جلوی رزرو همزمان را می‌گیرد.
             */

            const reservationId =
                await retryRequest(
                    () =>
                        addReservation(
                            finalData
                        )
                );


            /*
             * مرحله ۲:
             * ثبت / بروزرسانی مشتری
             */

            try {

                await retryRequest(
                    () =>
                        saveCustomer(
                            finalData
                        )
                );

            }

            catch (customerError) {

                /*
                 * اگر پروفایل مشتری
                 * شکست خورد، رزرو اصلی
                 * همچنان موفق محسوب می‌شود.
                 */

                console.warn(
                    "Customer save failed:",
                    customerError
                );

            }


            /*
             * مرحله ۳:
             * نمایش موفقیت
             */

            showSuccess(
                finalData,
                reservationId
            );


            reserveForm.dataset.submitted =
                "true";

        }

        catch (error) {

            console.error(
                "Reservation failed:",
                error
            );


            /*
             * Unique Constraint
             *
             * اگر دو نفر همزمان
             * یک ساعت را بگیرند،
             * Supabase درخواست دوم
             * را Reject می‌کند.
             */

            if (
                isDuplicateReservationError(
                    error
                )
            ) {

                alert(
                    "متأسفانه این ساعت همین الان توسط شخص دیگری رزرو شد. لطفاً یک ساعت دیگر انتخاب کنید."
                );


                reservationData.time =
                    "";


                showStep(5);


                return;

            }


            /*
             * خطای شبکه
             */

            if (
                isNetworkError(error)
            ) {

                alert(
                    "ارتباط با سامانه رزرو برقرار نشد.\n\nلطفاً اینترنت خود را بررسی کنید و دوباره تلاش کنید."
                );

                return;

            }


            /*
             * خطای عمومی
             */

            alert(
                "خطایی هنگام ثبت رزرو رخ داد.\n\n" +
                "Code: " +
                (
                    error?.code ||
                    "unknown"
                ) +
                "\n\n" +
                "Message: " +
                (
                    error?.message ||
                    "خطای نامشخص"
                )
            );

        }

        finally {

            /*
             * اگر موفق نشده باشیم،
             * دکمه دوباره فعال می‌شود.
             */

            if (
                !reserveForm.dataset.submitted
            ) {

                submitBtn.disabled =
                    false;


                submitBtn.innerHTML = `

                    <i class="fa-solid fa-check"></i>

                    ثبت رزرو

                `;

            }

        }

    }
);


// ==========================================
// Duplicate Reservation Detection
// ==========================================

function isDuplicateReservationError(
    error
) {

    if (!error) return false;


    const code =
        String(
            error.code || ""
        ).toLowerCase();


    const message =
        String(
            error.message || ""
        ).toLowerCase();


    /*
     * PostgreSQL unique violation:
     *
     * 23505
     */

    return (

        code === "23505" ||

        code.includes("23505") ||

        message.includes(
            "duplicate"
        ) ||

        message.includes(
            "unique"
        ) ||

        message.includes(
            "reservations_active_slot_unique"
        )

    );

}


// ==========================================
// Network Error Detection
// ==========================================

function isNetworkError(error) {

    if (!error) {

        return false;

    }


    const code =
        String(
            error.code || ""
        ).toLowerCase();


    const message =
        String(
            error.message || ""
        ).toLowerCase();


    return (

        code.includes("network") ||

        code.includes("timeout") ||

        code.includes("unavailable") ||

        message.includes("network") ||

        message.includes("offline") ||

        message.includes("failed to fetch") ||

        message.includes("timeout") ||

        message.includes("fetch")

    );

}


// ==========================================
// Success Modal
// ==========================================

function showSuccess(
    data,
    reservationId
) {

    if (
        !successModal ||
        !successDetails
    ) {

        return;

    }


    successDetails.innerHTML = `

        <div>

            <strong>
                نام مشتری:
            </strong>

            ${escapeHTML(data.firstName)}
            ${escapeHTML(data.lastName)}

        </div>


        <div>

            <strong>
                شماره موبایل:
            </strong>

            ${escapeHTML(data.phone)}

        </div>


        <div>

            <strong>
                آرایشگر:
            </strong>

            ${escapeHTML(data.barberName)}

        </div>


        <div>

            <strong>
                خدمت:
            </strong>

            ${escapeHTML(data.service)}

        </div>


        <div>

            <strong>
                مدت خدمت:
            </strong>

            ${escapeHTML(
                data.serviceDuration
            )}

            دقیقه

        </div>


        <div>

            <strong>
                روز:
            </strong>

            ${escapeHTML(data.displayDate)}

        </div>


        <div>

            <strong>
                ساعت:
            </strong>

            ${escapeHTML(data.time)}

        </div>


        <div>

            <strong>
                کد رزرو:
            </strong>

            ${escapeHTML(reservationId)}

        </div>

    `;


    successModal.classList.add(
        "active"
    );


    document.body.style.overflow =
        "hidden";

}


// ==========================================
// Escape HTML
// ==========================================

function escapeHTML(value) {

    return String(
        value ?? ""
    )
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );

}


// ==========================================
// ISO Date
// ==========================================

function formatISODate(date) {

    const year =
        date.getFullYear();


    const month =
        String(
            date.getMonth() + 1
        ).padStart(
            2,
            "0"
        );


    const day =
        String(
            date.getDate()
        ).padStart(
            2,
            "0"
        );


    return `${year}-${month}-${day}`;

}


// ==========================================
// Persian Date
// ==========================================

function formatPersianDate(date) {

    try {

        return new Intl.DateTimeFormat(
            "fa-IR-u-ca-persian",
            {

                year: "numeric",

                month: "long",

                day: "numeric"

            }
        ).format(date);

    }

    catch {

        return date.toLocaleDateString(
            "fa-IR"
        );

    }

}


// ==========================================
// Prevent Accidental Refresh
// ==========================================

window.addEventListener(
    "beforeunload",
    event => {

        if (

            currentStep > 1 &&

            !successModal?.classList.contains(
                "active"
            ) &&

            !reserveForm?.dataset.submitted

        ) {

            event.preventDefault();

        }

    }
);


// ==========================================
// Final Log
// ==========================================

console.log(
    "Salon Mojezeh - Supabase reservation system ready."
);
