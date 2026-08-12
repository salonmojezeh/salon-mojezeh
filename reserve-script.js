// ==========================================
// Salon Mojezeh
// reserve-script.js
// Final Reservation System
// 5 Steps
// ==========================================

import {
    loadBookedTimes,
    addReservation,
    saveCustomer
} from "./firebase.js";


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

    "09:00",
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
// Start
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        initializeReservation();

    }
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

}


// ==========================================
// Show Step
// ==========================================

function showStep(stepNumber) {

    currentStep = stepNumber;


    steps.forEach(
        (step, index) => {

            if (!step) return;

            step.classList.toggle(
                "active",
                index + 1 === stepNumber
            );

        }
    );


    updateProgress();

    updateButtons();


    /*
        وقتی وارد مرحله ساعت می‌شویم،
        ساعت‌های همان آرایشگر و روز
        دوباره بررسی می‌شوند.
    */

    if (stepNumber === 5) {

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
        (currentStep / 5) * 100;


    progressBar.style.width =
        `${percentage}%`;

}


// ==========================================
// Buttons
// ==========================================

function updateButtons() {

    if (!prevBtn ||
        !nextBtn ||
        !submitBtn) {

        return;

    }


    /*
        مرحله اول
    */

    if (currentStep === 1) {

        prevBtn.style.display =
            "none";

    } else {

        prevBtn.style.display =
            "flex";

    }


    /*
        مرحله پنجم
    */

    if (currentStep === 5) {

        nextBtn.style.display =
            "none";

        submitBtn.style.display =
            "flex";

    } else {

        nextBtn.style.display =
            "flex";

        submitBtn.style.display =
            "none";

    }

}


// ==========================================
// Next Button
// ==========================================

nextBtn.addEventListener(
    "click",
    () => {

        if (!validateCurrentStep()) {

            return;

        }


        if (currentStep < 5) {

            showStep(
                currentStep + 1
            );

        }

    }
);


// ==========================================
// Previous Button
// ==========================================

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


// ==========================================
// Validate Current Step
// ==========================================

function validateCurrentStep() {

    /*
        مرحله ۱
    */

    if (currentStep === 1) {

        return validateCustomer();

    }


    /*
        مرحله ۲
    */

    if (currentStep === 2) {

        return validateBarber();

    }


    /*
        مرحله ۳
    */

    if (currentStep === 3) {

        return validateService();

    }


    /*
        مرحله ۴
    */

    if (currentStep === 4) {

        return validateDate();

    }


    /*
        مرحله ۵
    */

    if (currentStep === 5) {

        return validateTime();

    }


    return true;

}


// ==========================================
// Customer Validation
// ==========================================

function validateCustomer() {

    const firstName =
        document
            .getElementById("firstName")
            .value
            .trim();

    const lastName =
        document
            .getElementById("lastName")
            .value
            .trim();

    const phone =
        document
            .getElementById("phone")
            .value
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


    if (!/^09\d{9}$/.test(phone)) {

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
                        input.closest(
                            ".barber-card"
                        )
                        ?.querySelector(
                            "h4"
                        )
                        ?.textContent
                        .trim() ||
                        input.value;


                    /*
                        با تغییر آرایشگر،
                        روز و ساعت قبلی پاک می‌شود.
                    */

                    reservationData.date =
                        "";

                    reservationData.displayDate =
                        "";

                    reservationData.time =
                        "";

                    createDays();

                }
            );

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

    if (!reservationData.service) {

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

                ${persianDays[date.getDay()]}

            </span>

            <span class="day-date">

                ${displayDate}

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
                    با تغییر روز،
                    ساعت قبلی پاک می‌شود.
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


    let bookedTimes = [];


    try {

        bookedTimes =
            await loadBookedTimes(
                reservationData.barberId,
                reservationData.date
            );

    }

    catch (error) {

        console.error(
            "Load booked times error:",
            error
        );


        timesContainer.innerHTML = `

            <div class="time-message">

                خطا در دریافت ساعت‌های آزاد.
                لطفاً دوباره تلاش کنید.

            </div>

        `;

        return;

    }


    timesContainer.innerHTML = "";


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
                bookedTimes.includes(
                    time
                );


            if (isBooked) {

                card.classList.add(
                    "booked"
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

function showTimeMessage(
    message
) {

    timesContainer.innerHTML = `

        <div class="time-message">

            ${message}

        </div>

    `;

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
// Final Submit
// ==========================================

reserveForm.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        /*
            آخرین بررسی
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
            جلوگیری از کلیک چندباره
        */

        submitBtn.disabled =
            true;


        submitBtn.innerHTML = `

            <i class="fa-solid fa-spinner fa-spin"></i>

            در حال ثبت رزرو...

        `;


        try {

            /*
                اطلاعات نهایی
            */

            const finalData = {

                ...reservationData

            };


            /*
                ثبت رزرو در Firestore
            */

            const reservationId =
                await addReservation(
                    finalData
                );


            /*
                ذخیره / ثبت مشتری
            */

            await saveCustomer(
                finalData
            );


            /*
                نمایش موفقیت
            */

            showSuccess(
                finalData,
                reservationId
            );

        }

        catch (error) {

            console.error(
                "Reservation failed:",
                error
            );


            /*
                اگر ساعت قبلاً توسط
                شخص دیگری رزرو شده باشد
            */

            if (
                error.code ===
                "already-exists"
            ) {

                alert(
                    "متأسفانه این ساعت همین الان توسط شخص دیگری رزرو شد. لطفاً یک ساعت دیگر انتخاب کنید."
                );


                reservationData.time =
                    "";


                showStep(5);

                return;

            }


            alert(
                "در ثبت رزرو مشکلی پیش آمد. لطفاً دوباره تلاش کنید."
            );

        }

        finally {

            submitBtn.disabled =
                false;


            submitBtn.innerHTML = `

                <i class="fa-solid fa-check"></i>

                ثبت رزرو

            `;

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
            ${data.serviceDuration}
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

function escapeHTML(value) {

    return String(value ?? "")
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
// Format ISO Date
// ==========================================

function formatISODate(
    date
) {

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

function formatPersianDate(
    date
) {

    /*
        نمایش فارسی ساده تاریخ.
        ساختار ذخیره Firebase همچنان
        ISO خواهد بود.
    */

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
// Prevent accidental refresh
// ==========================================

window.addEventListener(
    "beforeunload",
    event => {

        /*
            فقط اگر فرم در حال تکمیل باشد.
        */

        if (
            currentStep > 1 &&
            !successModal?.classList.contains(
                "active"
            )
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
