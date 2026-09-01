// ==========================================
// Salon Mojezeh
// reserve-script.js
// Supabase Reservation System
// ==========================================

import {

    getBarbers,
    getServices,
    loadBookedTimes,
    addReservation,
    saveCustomer

} from "./supabase.js";


// ==========================================
// DOM
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

const barbersContainer =
    document.querySelector(".barbers-grid");

const servicesContainer =
    document.querySelector(".services-grid");


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
// Working Hours
// ==========================================

const workingHours = [

    "09:00",
    "09:30",
    "10:00",
    "10:30",
    "11:00",
    "11:30",
    "12:00",
    "12:30",
    "13:00",
    "13:30",
    "14:00",
    "14:30",
    "15:00",
    "15:30",
    "16:00",
    "16:30",
    "17:00",
    "17:30",
    "18:00",
    "18:30",
    "19:00",
    "19:30",
    "20:00",
    "20:30",
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
// Retry
// ==========================================

const RETRY_COUNT = 3;
const RETRY_DELAY = 800;


function sleep(ms) {

    return new Promise(
        resolve =>
            setTimeout(
                resolve,
                ms
            )
    );

}


async function retryRequest(
    requestFunction,
    retries = RETRY_COUNT
) {

    let lastError;

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
// Start
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    initializeReservation
);


// ==========================================
// Initialize
// ==========================================

async function initializeReservation() {

    showStep(1);

    setupPhoneInput();

    try {

        await loadDynamicData();

    }

    catch (error) {

        console.error(
            "Initialization error:",
            error
        );

        alert(
            "خطا در دریافت اطلاعات رزرو از سامانه."
        );

    }

}


// ==========================================
// Load Barbers + Services
// ==========================================

async function loadDynamicData() {

    const [
        barbers,
        services
    ] = await Promise.all([

        retryRequest(
            getBarbers
        ),

        retryRequest(
            getServices
        )

    ]);


    renderBarbers(
        barbers
    );


    renderServices(
        services
    );

}


// ==========================================
// Render Barbers
// ==========================================

function renderBarbers(
    barbers
) {

    if (!barbersContainer) {
        return;
    }


    barbersContainer.innerHTML = "";


    if (!barbers.length) {

        barbersContainer.innerHTML = `

            <div class="time-message">

                آرایشگری برای رزرو فعال نیست.

            </div>

        `;

        return;

    }


    barbers.forEach(
        barber => {

            const label =
                document.createElement(
                    "label"
                );


            label.className =
                "barber-card";


            const image =
                barber.image_url ||
                "images/barbers/default.jpg";


            label.innerHTML = `

                <input
                    type="radio"
                    name="barber"
                    value="${escapeHTML(barber.id)}"
                >

                <div class="barber-image">

                    <img
                        src="${escapeHTML(image)}"
                        alt="${escapeHTML(barber.name)}"
                    >

                </div>

                <div class="barber-info">

                    <h4>
                        ${escapeHTML(barber.name)}
                    </h4>

                    <span>
                        ${escapeHTML(barber.role || "آرایشگر")}
                    </span>

                </div>

            `;


            const input =
                label.querySelector(
                    'input[name="barber"]'
                );


            input.addEventListener(
                "change",
                () => {

                    reservationData.barberId =
                        barber.id;

                    reservationData.barberName =
                        barber.name;


                    reservationData.date =
                        "";

                    reservationData.displayDate =
                        "";

                    reservationData.time =
                        "";


                    createDays();


                    if (
                        currentStep === 5
                    ) {

                        createTimes();

                    }

                }
            );


            barbersContainer.appendChild(
                label
            );

        }
    );

}


// ==========================================
// Render Services
// ==========================================

function renderServices(
    services
) {

    if (!servicesContainer) {
        return;
    }


    servicesContainer.innerHTML = "";


    if (!services.length) {

        servicesContainer.innerHTML = `

            <div class="time-message">

                خدمتی برای رزرو فعال نیست.

            </div>

        `;

        return;

    }


    services.forEach(
        service => {

            const label =
                document.createElement(
                    "label"
                );


            label.className =
                "service-card";


            const image =
                service.image_url ||
                `images/services/${service.service_key}.jpg`;


            label.innerHTML = `

                <input
                    type="radio"
                    name="service"
                    value="${escapeHTML(service.id)}"
                >

                <img
                    src="${escapeHTML(image)}"
                    alt="${escapeHTML(service.name)}"
                >

                <h4>
                    ${escapeHTML(service.name)}
                </h4>

                <span class="service-duration">
                    ${Number(service.duration)} دقیقه
                </span>

            `;


            const input =
                label.querySelector(
                    'input[name="service"]'
                );


            input.addEventListener(
                "change",
                () => {

                    reservationData.serviceId =
                        service.id;

                    reservationData.service =
                        service.name;

                    reservationData.serviceDuration =
                        Number(service.duration);

                    reservationData.time =
                        "";

                }
            );


            servicesContainer.appendChild(
                label
            );

        }
    );

}


// ==========================================
// Show Step
// ==========================================

function showStep(
    stepNumber
) {

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
        currentStep === 4
    ) {

        createDays();

    }


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


    progressBar.style.width =
        `${(currentStep / 5) * 100}%`;

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


    nextBtn.style.display =
        currentStep === 5
            ? "none"
            : "flex";


    submitBtn.style.display =
        currentStep === 5
            ? "flex"
            : "none";

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
// Validation
// ==========================================

function validateCurrentStep() {

    switch (
        currentStep
    ) {

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
// Customer
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
// Phone
// ==========================================

function setupPhoneInput() {

    const phone =
        document.getElementById(
            "phone"
        );


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
// Barber Validation
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
// Service Validation
// ==========================================

function validateService() {

    if (
        !reservationData.serviceId
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
        i < 30;
        i++
    ) {

        const date =
            new Date(today);


        date.setDate(
            today.getDate() + i
        );


        const isoDate =
            formatISODate(date);


        const displayDate =
            formatPersianDate(date);


        const dayCard =
            document.createElement(
                "div"
            );


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
                        card =>
                            card.classList.remove(
                                "selected"
                            )
                    );


                dayCard.classList.add(
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


        daysContainer.appendChild(
            dayCard
        );

    }

}


// ==========================================
// Date Validation
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
// =========================================        timesContainer.innerHTML = `

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


    if (
        !reservationData.serviceId
    ) {

        showTimeMessage(
            "ابتدا خدمت مورد نظر را انتخاب کنید."
        );

        return;

    }


    timesContainer.innerHTML = `

        <div class="time-loading">

            <i class="fa-solid fa-spinner fa-spin"></i>

            در حال بررسی ساعت‌های آزاد...

        </div>

    `;


    let bookedReservations = [];


    try {

        bookedReservations =
            await retryRequest(
                () =>
                    loadBookedTimes(
                        reservationData.barberId,
                        reservationData.date
                    )
            );

    }

    catch (error) {

        console.error(
            "Load booked times error:",
            error
        );


        timesContainer.innerHTML = `

            <div class="time-message">

                <i class="fa-solid fa-triangle-exclamation"></i>

                <br><br>

                اتصال به سامانه رزرو برقرار نشد.

                <br>

                لطفاً دوباره تلاش کنید.

            </div>

        `;

        return;

    }


    timesContainer.innerHTML = "";


    /*
     * اینجا مدت واقعی هر خدمت را
     * هم در نظر می‌گیریم.
     *
     * مثلاً:
     *
     * رزرو 09:00 با مدت 60 دقیقه
     *
     * باعث می‌شود 09:00 و 09:30
     * برای رزرو جدید قابل انتخاب نباشند.
     */


    workingHours.forEach(
        time => {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "time-card";


            card.dataset.time =
                time;


            const isBooked =
                isTimeBlocked(
                    time,
                    bookedReservations
                );


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
                        ${time}
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


            card.innerHTML = `

                <i class="fa-regular fa-clock"></i>

                <span>
                    ${time}
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


            timesContainer.appendChild(
                card
            );

        }
    );

}


// ==========================================
// Time Blocking
// ==========================================

function isTimeBlocked(
    candidateTime,
    bookedReservations
) {

    const candidateStart =
        timeToMinutes(
            candidateTime
        );


    const candidateDuration =
        Number(
            reservationData.serviceDuration || 30
        );


    const candidateEnd =
        candidateStart +
        candidateDuration;


    return bookedReservations.some(
        reservation => {

            const bookedStart =
                timeToMinutes(
                    String(
                        reservation.time
                    ).slice(0, 5)
                );


            const bookedDuration =
                Number(
                    reservation.service_duration || 30
                );


            const bookedEnd =
                bookedStart +
                bookedDuration;


            /*
             * بررسی تداخل دو بازه
             */

            return (
                candidateStart < bookedEnd &&
                candidateEnd > bookedStart
            );

        }
    );

}


// ==========================================
// Time To Minutes
// ==========================================

function timeToMinutes(
    time
) {

    const [
        hour,
        minute
    ] =
        time
            .split(":")
            .map(Number);


    return (
        hour * 60 +
        minute
    );

}


// ==========================================
// Time Message
// ==========================================

function showTimeMessage(
    message
) {

    if (!timesContainer) return;


    timesContainer.innerHTML = `

        <div class="time-message">

            ${escapeHTML(message)}

        </div>

    `;

}


// ==========================================
// Time Validation
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
// Submit
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

            const reservationId =
                await retryRequest(
                    () =>
                        addReservation(
                            finalData
                        )
                );


            /*
             * ذخیره مشتری
             * عملیات جانبی است.
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

                console.warn(
                    "Customer save failed:",
                    customerError
                );

            }


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


            if (
                error.code ===
                "already-exists"
            ) {

                alert(
                    "متأسفانه این ساعت همین الان توسط شخص دیگری رزرو شد. لطفاً ساعت دیگری انتخاب کنید."
                );


                reservationData.time =
                    "";


                showStep(5);

                return;

            }


            alert(
                "خطا در ثبت رزرو:\n\n" +
                "Code: " +
                (
                    error.code ||
                    "unknown"
                ) +
                "\n\n" +
                "Message: " +
                (
                    error.message ||
                    "خطای نامشخص"
                )
            );

        }

        finally {

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
// Success
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
            <strong>نام مشتری:</strong>
            ${escapeHTML(data.firstName)}
            ${escapeHTML(data.lastName)}
        </div>

        <div>
            <strong>شماره موبایل:</strong>
            ${escapeHTML(data.phone)}
        </div>

        <div>
            <strong>آرایشگر:</strong>
            ${escapeHTML(data.barberName)}
        </div>

        <div>
            <strong>خدمت:</strong>
            ${escapeHTML(data.service)}
        </div>

        <div>
            <strong>مدت خدمت:</strong>
            ${escapeHTML(data.serviceDuration)}
            دقیقه
        </div>

        <div>
            <strong>روز:</strong>
            ${escapeHTML(data.displayDate)}
        </div>

        <div>
            <strong>ساعت:</strong>
            ${escapeHTML(data.time)}
        </div>

        <div>
            <strong>کد رزرو:</strong>
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

function escapeHTML(
    value
) {

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

function formatISODate(
    date
) {

    const year =
        date.getFullYear();


    const month =
        String(
            date.getMonth() + 1
        )
        .padStart(
            2,
            "0"
        );


    const day =
        String(
            date.getDate()
        )
        .padStart(
            2,
            "0"
        );


    return `${year}-${month}-${day}`;

}


// ==========================================
// Persian Date
// ==========================================

function formatPersianDate(
    date
) {

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
// Prevent Refresh
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
    "Salon Mojezeh reservation system ready."
);
