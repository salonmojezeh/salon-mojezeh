// ==========================================
// Salon Mojezeh
// reserve-script.js
// Final Dynamic Reservation System
// ==========================================

"use strict";


import {

    getBarbers,
    getServices,
    getBookingSettings,
    getBarberDayReservations,
    saveCustomer,
    createReservation

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

const barbersContainer =
    document.getElementById("barbersContainer");

const servicesContainer =
    document.getElementById("servicesContainer");

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

    serviceId: "",

    service: "",

    serviceDuration: 0,

    date: "",

    displayDate: "",

    time: ""

};


// ==========================================
// Dynamic Data
// ==========================================

let bookingSettings = {

    opening_time: "09:00:00",

    closing_time: "21:00:00",

    slot_interval: 30,

    booking_days_ahead: 30

};

let loadedBarbers = [];

let loadedServices = [];


// ==========================================
// Persian Day Names
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
// Initialize
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        showStep(1);

        setupPhoneInput();

        await initializeReservationSystem();

    }
);


// ==========================================
// Initialize Reservation System
// ==========================================

async function initializeReservationSystem() {

    try {

        showLoadingState();

        const results =
            await Promise.all([

                getBarbers(),

                getServices(),

                getBookingSettings()

            ]);


        loadedBarbers =
            results[0];

        loadedServices =
            results[1];

        bookingSettings =
            results[2];


        renderBarbers();

        renderServices();


        console.log(
            "Reservation system loaded successfully"
        );

    }

    catch (error) {

        console.error(
            "Reservation initialization error:",
            error
        );


        showSystemError();

    }

}


// ==========================================
// Loading State
// ==========================================

function showLoadingState() {

    if (barbersContainer) {

        barbersContainer.innerHTML = `

            <div class="time-loading">

                <i class="fa-solid fa-spinner fa-spin"></i>

                در حال دریافت آرایشگرها...

            </div>

        `;

    }


    if (servicesContainer) {

        servicesContainer.innerHTML = `

            <div class="time-loading">

                <i class="fa-solid fa-spinner fa-spin"></i>

                در حال دریافت خدمات...

            </div>

        `;

    }

}


// ==========================================
// System Error
// ==========================================

function showSystemError() {

    if (barbersContainer) {

        barbersContainer.innerHTML = `

            <div class="time-message">

                <i class="fa-solid fa-triangle-exclamation"></i>

                <br><br>

                خطا در دریافت اطلاعات.

                <br>

                لطفاً صفحه را دوباره بارگذاری کنید.

            </div>

        `;

    }


    if (servicesContainer) {

        servicesContainer.innerHTML = "";

    }

}


// ==========================================
// Render Barbers
// ==========================================

function renderBarbers() {

    if (!barbersContainer) return;


    barbersContainer.innerHTML = "";


    if (!loadedBarbers.length) {

        barbersContainer.innerHTML = `

            <div class="time-message">

                در حال حاضر آرایشگری برای رزرو فعال نیست.

            </div>

        `;

        return;

    }


    loadedBarbers.forEach(
        barber => {

            const card =
                document.createElement("label");


            card.className =
                "barber-card";


            const imagePath =
                barber.image_url ||
                "images/barbers/default.jpg";


            card.innerHTML = `

                <input
                    type="radio"
                    name="barber"
                    value="${escapeHTML(barber.id)}"
                >

                <div class="barber-image">

                    <img
                        src="${escapeHTML(imagePath)}"
                        alt="${escapeHTML(barber.name)}"
                    >

                </div>

                <div class="barber-info">

                    <h4>
                        ${escapeHTML(barber.name)}
                    </h4>

                    <span>
                        ${escapeHTML(
                            barber.role || "آرایشگر"
                        )}
                    </span>

                </div>

            `;


            const input =
                card.querySelector("input");


            input.addEventListener(
                "change",
                () => {

                    reservationData.barberId =
                        barber.id;

                    reservationData.barberName =
                        barber.name;


                    // Reset date and time

                    reservationData.date =
                        "";

                    reservationData.displayDate =
                        "";

                    reservationData.time =
                        "";


                    createDays();

                }
            );


            barbersContainer.appendChild(card);

        }
    );

}


// ==========================================
// Render Services
// ==========================================

function renderServices() {

    if (!servicesContainer) return;


    servicesContainer.innerHTML = "";


    if (!loadedServices.length) {

        servicesContainer.innerHTML = `

            <div class="time-message">

                در حال حاضر خدمتی برای رزرو فعال نیست.

            </div>

        `;

        return;

    }


    loadedServices.forEach(
        service => {

            const card =
                document.createElement("label");


            card.className =
                "service-card";


            const imagePath =
                service.image_url ||
                `images/services/${service.service_key}.jpg`;


            card.innerHTML = `

                <input
                    type="radio"
                    name="service"
                    value="${escapeHTML(service.id)}"
                >

                <div class="service-image">

                    <img
                        src="${escapeHTML(imagePath)}"
                        alt="${escapeHTML(service.name)}"
                    >

                </div>

                <h4>
                    ${escapeHTML(service.name)}
                </h4>

                <span class="service-duration">

                    ${Number(service.duration)}
                    دقیقه

                </span>

            `;


            const input =
                card.querySelector("input");


            input.addEventListener(
                "change",
                () => {

                    reservationData.serviceId =
                        service.id;

                    reservationData.service =
                        service.name;

                    reservationData.serviceDuration =
                        Number(service.duration);


                    // Reset time because duration changed

                    reservationData.time =
                        "";


                    if (currentStep === 5) {

                        createTimes();

                    }

                }
            );


            servicesContainer.appendChild(card);

        }
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


    if (currentStep === 4) {

        createDays();

    }


    if (currentStep === 5) {

        createTimes();

    }


    window.scrollTo({

        top: 0,

        behavior: "smooth"

    });

}


// ==========================================
// Update Progress
// ==========================================

function updateProgress() {

    if (!progressBar) return;


    const percent =
        (currentStep / 5) * 100;


    progressBar.style.width =
        `${percent}%`;

}


// ==========================================
// Update Buttons
// ==========================================

function updateButtons() {

    if (prevBtn) {

        prevBtn.style.display =
            currentStep === 1
                ? "none"
                : "flex";

    }


    if (nextBtn) {

        nextBtn.style.display =
            currentStep === 5
                ? "none"
                : "flex";

    }


    if (submitBtn) {

        submitBtn.style.display =
            currentStep === 5
                ? "flex"
                : "none";

    }

}


// ==========================================
// Next Button
// ==========================================

nextBtn?.addEventListener(
    "click",
    () => {

        if (!validateCurrentStep()) {

            return;

        }


        showStep(
            currentStep + 1
        );

    }
);


// ==========================================
// Previous Button
// ==========================================

prevBtn?.addEventListener(
    "click",
    () => {

        showStep(
            currentStep - 1
        );

    }
);


// ==========================================
// Validate Current Step
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
// Validate Customer
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
            "شماره موبایل را به صورت صحیح وارد کنید."
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

    const phoneInput =
        document.getElementById("phone");


    if (!phoneInput) return;


    phoneInput.addEventListener(
        "input",
        () => {

            phoneInput.value =
                phoneInput.value

                    .replace(/\D/g, "")

                    .slice(0, 11);

        }
    );

}


// ==========================================
// Validate Barber
// ==========================================

function validateBarber() {

    if (!reservationData.barberId) {

        alert(
            "لطفاً آرایشگر مورد نظر خود را انتخاب کنید."
        );

        return false;

    }


    return true;

}


// ==========================================
// Validate Service
// ==========================================

function validateService() {

    if (!reservationData.serviceId) {

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


    const daysAhead =
        Number(
            bookingSettings.booking_days_ahead || 30
        );


    const today =
        new Date();


    for (
        let i = 0;
        i < daysAhead;
        i++
    ) {

        const date =
            new Date();


        date.setDate(
            today.getDate() + i
        );


        const isoDate =
            formatISODate(date);


        const displayDate =
            formatPersianDate(date);


        const dayName =
            persianDays[
                date.getDay()
            ];


        const card =
            document.createElement("div");


        card.className =
            "day-card";


        if (
            reservationData.date === isoDate
        ) {

            card.classList.add("selected");

        }


        card.innerHTML = `

            <span class="day-name">

                ${dayName}

            </span>

            <span class="day-date">

                ${displayDate}

            </span>

        `;


        card.addEventListener(
            "click",
            () => {

                document
                    .querySelectorAll(".day-card")
                    .forEach(
                        item =>
                            item.classList.remove(
                                "selected"
                            )
                    );


                card.classList.add(
                    "selected"
                );


                reservationData.date =
                    isoDate;

                reservationData.displayDate =
                    displayDate;

                reservationData.time =
                    "";

            }
        );


        daysContainer.appendChild(card);

    }

}


// ==========================================
// Validate Date
// ==========================================

function validateDate() {

    if (!reservationData.date) {

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


    if (!reservationData.barberId) {

        showTimeMessage(
            "ابتدا آرایشگر را انتخاب کنید."
        );

        return;

    }


    if (!reservationData.serviceId) {

        showTimeMessage(
            "ابتدا خدمت مورد نظر را انتخاب کنید."
        );

        return;

    }


    if (!reservationData.date) {

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


    try {

        const reservations =
            await getBarberDayReservations(

                reservationData.barberId,

                reservationData.date

            );


        const timeSlots =
            generateTimeSlots();


        timesContainer.innerHTML = "";


        let availableCount = 0;


        timeSlots.forEach(
            time => {

                const card =
                    document.createElement("div");


                card.className =
                    "time-card";


                const blocked =
                    isTimeBlocked(
                        time,
                        reservations
                    );


                const past =
                    isPastTime(
                        reservationData.date,
                        time
                    );


                const exceedsClosing =
                    exceedsWorkingHours(
                        time
                    );


                if (
                    blocked ||
                    past ||
                    exceedsClosing
                ) {

                    card.classList.add(
                        "booked"
                    );


                    card.innerHTML = `

                        <i class="fa-solid fa-lock"></i>

                        <span>
                            ${time}
                        </span>

                        <small>

                            ${
                                past
                                    ? "گذشته"
                                    : "غیر قابل رزرو"
                            }

                        </small>

                    `;


                    timesContainer.appendChild(card);

                    return;

                }


                availableCount++;


                card.innerHTML = `

                    <i class="fa-regular fa-clock"></i>

                    <span>
                        ${time}
                    </span>

                `;


                if (
                    reservationData.time === time
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
                                item =>
                                    item.classList.remove(
                                        "selected"
                                    )
                            );


                        card.classList.add(
                            "selected"
                        );


                        reservationData.time =
                            time;

                    }
                );


                timesContainer.appendChild(card);

            }
        );


        if (availableCount === 0) {

            showTimeMessage(
                "برای این روز ساعت آزادی وجود ندارد."
            );

        }

    }

    catch (error) {

        console.error(
            "createTimes error:",
            error
        );


        showTimeMessage(
            "خطا در دریافت ساعت‌های رزرو."
        );

    }

}


// ==========================================
// Generate Time Slots
// ==========================================

function generateTimeSlots() {

    const slots = [];


    const interval =
        Number(
            bookingSettings.slot_interval || 30
        );


    const opening =
        normalizeTime(
            bookingSettings.opening_time
        );


    const closing =
        normalizeTime(
            bookingSettings.closing_time
        );


    let currentMinutes =
        timeToMinutes(opening);


    const closingMinutes =
        timeToMinutes(closing);


    while (
        currentMinutes < closingMinutes
    ) {

        slots.push(
            minutesToTime(currentMinutes)
        );


        currentMinutes += interval;

    }


    return slots;

}


// ==========================================
// Check Working Hours
// ==========================================

function exceedsWorkingHours(time) {

    const start =
        timeToMinutes(time);


    const duration =
        Number(
            reservationData.serviceDuration || 30
        );


    const end =
        start + duration;


    const closing =
        timeToMinutes(

            normalizeTime(
                bookingSettings.closing_time
            )

        );


    return end > closing;

}


// ==========================================
// Check Reservation Conflict
// ==========================================

function isTimeBlocked(
    candidateTime,
    reservations
) {

    const candidateStart =
        timeToMinutes(candidateTime);


    const candidateDuration =
        Number(
            reservationData.serviceDuration || 30
        );


    const candidateEnd =
        candidateStart + candidateDuration;


    return reservations.some(
        reservation => {

            const bookedStart =
                timeToMinutes(

                    normalizeTime(
                        reservation.time
                    )

                );


            const bookedDuration =
                Number(
                    reservation.service_duration || 30
                );


            const bookedEnd =
                bookedStart + bookedDuration;


            return (

                candidateStart < bookedEnd &&

                candidateEnd > bookedStart

            );

        }
    );

}


// ==========================================
// Check Past Time
// ==========================================

function isPastTime(
    selectedDate,
    time
) {

    const today =
        formatISODate(new Date());


    if (
        selectedDate !== today
    ) {

        return false;

    }


    const now =
        new Date();


    const currentMinutes =
        now.getHours() * 60 +
        now.getMinutes();


    const slotMinutes =
        timeToMinutes(time);


    return slotMinutes <= currentMinutes;

}


// ==========================================
// Validate Time
// ==========================================

function validateTime() {

    if (!reservationData.time) {

        alert(
            "لطفاً ساعت مورد نظر خود را انتخاب کنید."
        );

        return false;

    }


    return true;

}


// ==========================================
// Submit Reservation
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


        if (

            !validateCustomer() ||

            !validateBarber() ||

            !validateService() ||

            !validateDate() ||

            !validateTime()

        ) {

            return;

        }


        submitBtn.disabled = true;


        submitBtn.innerHTML = `

            <i class="fa-solid fa-spinner fa-spin"></i>

            در حال ثبت رزرو...

        `;


        try {

            // ==================================
            // Save Customer
            // ==================================

            const customerId =
                await saveCustomer({

                    firstName:
                        reservationData.firstName,

                    lastName:
                        reservationData.lastName,

                    phone:
                        reservationData.phone,

                    barberId:
                        reservationData.barberId,

                    barberName:
                        reservationData.barberName,

                    service:
                        reservationData.service,

                    date:
                        reservationData.date

                });


            // ==================================
            // Final Reservation Data
            // ==================================

            const finalData = {

                ...reservationData,

                customerId

            };


            // ==================================
            // Re-check Reservations
            // جلوگیری از رزرو همزمان
            // ==================================

            const latestReservations =
                await getBarberDayReservations(

                    finalData.barberId,

                    finalData.date

                );


            if (
                isTimeBlocked(
                    finalData.time,
                    latestReservations
                )
            ) {

                const conflictError =
                    new Error(
                        "این ساعت همین الان رزرو شده است."
                    );

                conflictError.code =
                    "reservation-conflict";

                throw conflictError;

            }


            // ==================================
            // Create Reservation
            // ==================================

            const reservationId =
                await createReservation(
                    finalData
                );


            showSuccess(
                finalData,
                reservationId
            );


            reserveForm.dataset.submitted =
                "true";

        }

        catch (error) {

            console.error(
                "Reservation submit error:",
                error
            );


            if (
                error.code ===
                "reservation-conflict"
            ) {

                alert(
                    "متأسفانه این ساعت توسط شخص دیگری رزرو شده است. لطفاً ساعت دیگری انتخاب کنید."
                );


                reservationData.time = "";


                showStep(5);

                return;

            }


            alert(
                "خطا در ثبت رزرو.\n\nلطفاً دوباره تلاش کنید."
            );

        }

        finally {

            if (
                !reserveForm.dataset.submitted
            ) {

                submitBtn.disabled = false;


                submitBtn.innerHTML = `

                    <i class="fa-solid fa-check"></i>

                    ثبت رزرو

                `;

            }

        }

    }
);


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
                مدت:
            </strong>

            ${escapeHTML(data.serviceDuration)}
            دقیقه

        </div>


        <div>

            <strong>
                تاریخ:
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
// Show Time Message
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
// Normalize Time
// ==========================================

function normalizeTime(time) {

    return String(time || "")

        .slice(0, 5);

}


// ==========================================
// Time To Minutes
// ==========================================

function timeToMinutes(time) {

    const parts =
        String(time)
            .slice(0, 5)
            .split(":");


    const hour =
        Number(parts[0]) || 0;


    const minute =
        Number(parts[1]) || 0;


    return hour * 60 + minute;

}


// ==========================================
// Minutes To Time
// ==========================================

function minutesToTime(minutes) {

    const hour =
        Math.floor(minutes / 60);


    const minute =
        minutes % 60;


    return (

        String(hour)
            .padStart(2, "0")

        +

        ":"

        +

        String(minute)
            .padStart(2, "0")

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
        ).padStart(2, "0");


    const day =
        String(
            date.getDate()
        ).padStart(2, "0");


    return `${year}-${month}-${day}`;

}


// ==========================================
// Persian Date
// ==========================================

function formatPersianDate(date) {

    return new Intl.DateTimeFormat(

        "fa-IR-u-ca-persian",

        {

            year: "numeric",

            month: "long",

            day: "numeric"

        }

    ).format(date);

}


// ==========================================
// Escape HTML
// ==========================================

function escapeHTML(value) {

    return String(value ?? "")

        .replaceAll("&", "&amp;")

        .replaceAll("<", "&lt;")

        .replaceAll(">", "&gt;")

        .replaceAll('"', "&quot;")

        .replaceAll("'", "&#039;");

}


// ==========================================
// Final Log
// ==========================================

console.log(
    "Salon Mojezeh final reservation system ready."
);
