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
// Network Retry
// ==========================================

const RETRY_COUNT = 3;

const RETRY_DELAY = 800;


function sleep(ms) {

    return new Promise(
        resolve => setTimeout(
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
                `Firebase attempt ${attempt}/${retries} failed`,
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


    // مرحله پنجم = ساخت ساعت‌ها
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
        (currentStep / 5) * 100;

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


    // مرحله اول
    if (
        currentStep === 1
    ) {

        prevBtn.style.display =
            "none";

    }

    else {

        prevBtn.style.display =
            "flex";

    }


    // مرحله پنجم
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
// Validate Current Step
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
                        input
                            .closest(".barber-card")
                            ?.querySelector("h4")
                            ?.textContent
                            .trim() ||
                        input.value;


                    // تغییر آرایشگر
                    // یعنی ساعت قبلی دیگر معتبر نیست

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


                // ساعت قبلی دیگر معتبر نیست
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

        /*
         * با retry کوتاه تلاش می‌کنیم
         * خطاهای موقتی شبکه باعث شکست
         * فوری نشوند.
         */

        bookedTimes =
            await retryRequest(
                () =>
                    loadBookedTimes(
                        reservationData.barberId,
                        reservationData.date
                    )
            );


        if (
            !Array.isArray(
                bookedTimes
            )
        ) {

            bookedTimes = [];

        }

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

                لطفاً اینترنت خود را بررسی کنید
                و دوباره وارد این مرحله شوید.

            </div>

        `;

        return;

    }


    timesContainer.innerHTML = "";


    /*
     * بسیار مهم:
     *
     * همه ساعت‌ها ساخته می‌شوند.
     *
     * ساعت رزروشده حذف نمی‌شود.
     * فقط کلاس booked می‌گیرد.
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
                bookedTimes.some(
                    bookedTime =>
                        String(
                            bookedTime
                        ) === time
                );


            // ==================================
            // رزرو شده
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
                        ${time}
                    </span>

                    <small>
                        رزرو شده
                    </small>

                `;


                /*
                 * عمداً هیچ click event
                 * برای این کارت ثبت نمی‌کنیم.
                 */

                timesContainer.appendChild(
                    card
                );

                return;

            }


            // ==================================
            // ساعت آزاد
            // ==================================

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

                    // فقط ساعت‌های آزاد
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
// Final Submit
// ==========================================

reserveForm?.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        // جلوگیری از ثبت دوباره
        if (
            submitBtn?.disabled
        ) {

            return;

        }


        /*
         * آخرین بررسی‌ها
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
         * اطلاعات نهایی را جدا می‌کنیم
         * تا در زمان request تغییر نکند.
         */

        const finalData = {
            ...reservationData
        };


        /*
         * جلوگیری از کلیک چندباره
         */

        submitBtn.disabled =
            true;


        submitBtn.innerHTML = `

            <i class="fa-solid fa-spinner fa-spin"></i>

            در حال ثبت رزرو...

        `;


        try {

            /*
             * ثبت اصلی رزرو
             *
             * این قسمت باید در firebase.js
             * با Transaction انجام شود.
             */

            const reservationId =
                await retryRequest(
                    () =>
                        addReservation(
                            finalData
                        )
                );


            /*
             * ذخیره مشتری یک عملیات جانبی است.
             *
             * اگر ذخیره customer شکست خورد،
             * رزرو اصلی را ناموفق اعلام نمی‌کنیم.
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
                    "Customer profile save failed:",
                    customerError
                );

            }


            /*
             * رزرو با موفقیت ثبت شده.
             */

            showSuccess(
                finalData,
                reservationId
            );


            /*
             * بعد از ثبت موفق،
             * اطلاعات رزرو را نگه می‌داریم
             * ولی دیگر اجازه ارسال مجدد نمی‌دهیم.
             */

            reserveForm.dataset.submitted =
                "true";

        }

        catch (error) {

            console.error(
                "Reservation failed:",
                error
            );


            /*
             * Conflict
             *
             * یعنی ساعت در همین فاصله
             * توسط فرد دیگری گرفته شده.
             */

            if (
                error?.code ===
                "already-exists"
            ) {

                alert(
                    "این ساعت همین الان توسط شخص دیگری رزرو شد. لطفاً ساعت دیگری انتخاب کنید."
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
                    "ارتباط با سامانه رزرو برقرار نشد. لطفاً اتصال اینترنت را بررسی کنید و دوباره تلاش کنید."
                );

                return;

            }


            /*
             * خطای عمومی
             */

            alert(
                "در ثبت رزرو مشکلی پیش آمد. لطفاً دوباره تلاش کنید."
            );

        }

        finally {

            /*
             * اگر موفق شده باشیم،
             * دکمه همچنان غیرفعال می‌ماند.
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
// Detect Network / Firebase Errors
// ==========================================

function isNetworkError(
    error
) {

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

        code.includes(
            "unavailable"
        ) ||

        code.includes(
            "network"
        ) ||

        code.includes(
            "deadline"
        ) ||

        code.includes(
            "failed-precondition"
        ) ||

        message.includes(
            "network"
        ) ||

        message.includes(
            "offline"
        ) ||

        message.includes(
            "failed to fetch"
        ) ||

        message.includes(
            "timeout"
        ) ||

        message.includes(
            "unavailable"
        )

    );

}


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
            ${escapeHTML(
                data.serviceDuration
            )}
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
// Prevent accidental refresh
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

     
