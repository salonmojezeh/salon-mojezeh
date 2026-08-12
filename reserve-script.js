/* =========================================================
   Salon Mojezeh
   reserve-script.js
   نسخه نهایی سیستم رزرو 5 مرحله‌ای
========================================================= */

import {
    collection,
    query,
    where,
    getDocs,
    runTransaction,
    doc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { db } from "./firebase.js";


/* =========================================================
   تنظیمات
========================================================= */

const TOTAL_STEPS = 5;

// ساعت‌های کاری سالن
// هر ساعت یک نوبت است.
const BOOKING_TIMES = [
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

// تعداد روزهای قابل رزرو
const DAYS_AHEAD = 30;


/* =========================================================
   وضعیت رزرو
========================================================= */

let currentStep = 1;

let selectedDay = null;
let selectedTime = null;

let reservedTimes = new Set();

let isSubmitting = false;


/* =========================================================
   عناصر HTML
========================================================= */

const reserveForm = document.getElementById("reserveForm");

const nextBtn = document.getElementById("nextBtn");
const prevBtn = document.getElementById("prevBtn");

const submitBtn = document.getElementById("submitBtn");

const progressBar = document.getElementById("progressBar");

const daysContainer = document.getElementById("daysContainer");
const timesContainer = document.getElementById("timesContainer");

const successModal = document.getElementById("successModal");
const successDetails = document.getElementById("successDetails");


/* =========================================================
   شروع سیستم
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    if (!reserveForm) {
        console.error("reserveForm پیدا نشد.");
        return;
    }

    setupEvents();

    showStep(1);

});


/* =========================================================
   رویدادها
========================================================= */

function setupEvents() {

    nextBtn?.addEventListener("click", nextStep);

    prevBtn?.addEventListener("click", previousStep);

    reserveForm.addEventListener("submit", handleSubmit);

}


/* =========================================================
   نمایش مرحله
========================================================= */

function showStep(stepNumber) {

    currentStep = stepNumber;

    document.querySelectorAll(".step").forEach(step => {

        step.classList.remove("active");

    });

    const current = document.getElementById(`step${stepNumber}`);

    if (current) {
        current.classList.add("active");
    }


    /* نوار پیشرفت */

    const progress = (stepNumber / TOTAL_STEPS) * 100;

    if (progressBar) {
        progressBar.style.width = `${progress}%`;
    }


    /* دکمه قبلی */

    if (prevBtn) {

        if (stepNumber === 1) {
            prevBtn.style.display = "none";
        } else {
            prevBtn.style.display = "flex";
        }

    }


    updateFinalStepButtons();


    /* اگر مرحله روز است */

    if (stepNumber === 4) {

        generateDays();

    }


    /* اگر مرحله ساعت است */

    if (stepNumber === 5) {

        loadTimesForSelectedDay();

    }

}


/* =========================================================
   کنترل دکمه‌های مرحله آخر
========================================================= */

function updateFinalStepButtons() {

    if (!nextBtn || !submitBtn) {
        return;
    }


    if (currentStep === TOTAL_STEPS) {

        nextBtn.style.display = "none";

        submitBtn.style.display = "flex";

    } else {

        nextBtn.style.display = "flex";

        submitBtn.style.display = "none";

    }

}


/* =========================================================
   مرحله بعد
========================================================= */

async function nextStep() {

    if (!validateCurrentStep()) {
        return;
    }


    if (currentStep < TOTAL_STEPS) {

        currentStep++;

        showStep(currentStep);

    }

}


/* =========================================================
   مرحله قبل
========================================================= */

function previousStep() {

    if (currentStep > 1) {

        currentStep--;

        showStep(currentStep);

    }

}


/* =========================================================
   اعتبارسنجی مراحل
========================================================= */

function validateCurrentStep() {


    /* مرحله 1 */

    if (currentStep === 1) {

        const firstName =
            document.getElementById("firstName")?.value.trim();

        const lastName =
            document.getElementById("lastName")?.value.trim();

        const phone =
            document.getElementById("phone")?.value.trim();


        if (!firstName) {

            alert("لطفاً نام خود را وارد کنید.");

            return false;

        }


        if (!lastName) {

            alert("لطفاً نام خانوادگی خود را وارد کنید.");

            return false;

        }


        if (!/^09\d{9}$/.test(phone)) {

            alert("لطفاً شماره موبایل معتبر وارد کنید.");

            return false;

        }

    }


    /* مرحله 2 */

    if (currentStep === 2) {

        const barber =
            document.querySelector(
                'input[name="barber"]:checked'
            );


        if (!barber) {

            alert("لطفاً آرایشگر مورد نظر خود را انتخاب کنید.");

            return false;

        }

    }


    /* مرحله 3 */

    if (currentStep === 3) {

        const service =
            document.querySelector(
                'input[name="service"]:checked'
            );


        if (!service) {

            alert("لطفاً خدمت مورد نظر خود را انتخاب کنید.");

            return false;

        }

    }


    /* مرحله 4 */

    if (currentStep === 4) {

        if (!selectedDay) {

            alert("لطفاً یک روز را انتخاب کنید.");

            return false;

        }

    }


    /* مرحله 5 */

    if (currentStep === 5) {

        if (!selectedTime) {

            alert("لطفاً یک ساعت را انتخاب کنید.");

            return false;

        }

    }


    return true;

}


/* =========================================================
   گرفتن اطلاعات آرایشگر
========================================================= */

function getSelectedBarber() {

    const input =
        document.querySelector(
            'input[name="barber"]:checked'
        );

    if (!input) {
        return null;
    }


    return {

        id: input.value,

        name:
            input.dataset.name ||
            input.closest(".barber-card")
                ?.querySelector("h4")
                ?.textContent
                ?.trim() ||
            "آرایشگر"

    };

}


/* =========================================================
   گرفتن اطلاعات خدمت
========================================================= */

function getSelectedService() {

    const input =
        document.querySelector(
            'input[name="service"]:checked'
        );

    return input ? input.value : null;

}


/* =========================================================
   ساخت روزها
========================================================= */

function generateDays() {

    if (!daysContainer) {
        return;
    }


    daysContainer.innerHTML = "";


    const today = new Date();

    today.setHours(0, 0, 0, 0);


    for (let i = 0; i < DAYS_AHEAD; i++) {

        const date = new Date(today);

        date.setDate(today.getDate() + i);


        const dateKey = formatDateKey(date);


        const dayCard =
            document.createElement("button");

        dayCard.type = "button";

        dayCard.className = "day-card";


        if (selectedDay === dateKey) {
            dayCard.classList.add("selected");
        }


        const dayName =
            getPersianDayName(date);

        const dateText =
            getPersianDate(date);


        dayCard.innerHTML = `

            <span class="day-name">
                ${dayName}
            </span>

            <span class="day-date">
                ${dateText}
            </span>

        `;


        dayCard.addEventListener("click", () => {

            document
                .querySelectorAll(".day-card")
                .forEach(card =>
                    card.classList.remove("selected")
                );


            dayCard.classList.add("selected");


            selectedDay = dateKey;

            selectedTime = null;

        });


        daysContainer.appendChild(dayCard);

    }

}


/* =========================================================
   نام روز فارسی
========================================================= */

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


    return days[date.getDay()];

}


/* =========================================================
   تاریخ شمسی
========================================================= */

function getPersianDate(date) {

    try {

        return new Intl.DateTimeFormat(
            "fa-IR-u-ca-persian",
            {
                day: "numeric",
                month: "long",
                year: "numeric"
            }
        ).format(date);

    } catch (error) {

        return date.toLocaleDateString("fa-IR");

    }

}


/* =========================================================
   کلید تاریخ
   نمونه:
   2026-08-15
========================================================= */

function formatDateKey(date) {

    const year =
        date.getFullYear();

    const month =
        String(date.getMonth() + 1)
            .padStart(2, "0");

    const day =
        String(date.getDate())
            .padStart(2, "0");


    return `${year}-${month}-${day}`;

}


/* =========================================================
   بارگذاری ساعت‌های روز
========================================================= */

async function loadTimesForSelectedDay() {

    if (!timesContainer) {
        return;
    }


    if (!selectedDay) {

        timesContainer.innerHTML = `
            <p>
                ابتدا یک روز را انتخاب کنید.
            </p>
        `;

        return;

    }


    timesContainer.innerHTML = `
        <div class="loading-times">
            در حال بررسی ساعت‌های آزاد...
        </div>
    `;


    reservedTimes = new Set();


    const barber =
        getSelectedBarber();


    if (!barber) {

        timesContainer.innerHTML = `
            <p>
                ابتدا آرایشگر را انتخاب کنید.
            </p>
        `;

        return;

    }


    try {

        /*
          فقط رزروهای همان آرایشگر
          و همان روز را می‌خوانیم.
        */

        const reservationsRef =
            collection(db, "reservations");


        const q =
            query(

                reservationsRef,

                where(
                    "barberId",
                    "==",
                    barber.id
                ),

                where(
                    "date",
                    "==",
                    selectedDay
                )

            );


        const snapshot =
            await getDocs(q);


        snapshot.forEach(docSnapshot => {

            const data =
                docSnapshot.data();


            if (
                data.time &&
                data.status !== "cancelled"
            ) {

                reservedTimes.add(data.time);

            }

        });


        renderTimes();

    } catch (error) {

        console.error(
            "خطا در دریافت ساعت‌ها:",
            error
        );


        /*
          اگر دریافت رزروها شکست خورد،
          ساعت‌ها را به صورت آزاد نشان نمی‌دهیم.
          چون ممکن است یک ساعت واقعاً رزرو شده باشد.
        */

        timesContainer.innerHTML = `

            <div class="booking-error">

                <i class="fa-solid fa-wifi"></i>

                <p>
                    دریافت ساعت‌های رزرو شده با مشکل مواجه شد.
                </p>

                <button
                    type="button"
                    class="primary-btn"
                    id="retryTimesBtn">

                    تلاش دوباره

                </button>

            </div>

        `;


        document
            .getElementById("retryTimesBtn")
            ?.addEventListener(
                "click",
                loadTimesForSelectedDay
            );

    }

}


/* =========================================================
   نمایش ساعت‌ها
========================================================= */

function renderTimes() {

    if (!timesContainer) {
        return;
    }


    timesContainer.innerHTML = "";


    BOOKING_TIMES.forEach(time => {

        const isBooked =
            reservedTimes.has(time);


        const timeCard =
            document.createElement("button");


        timeCard.type = "button";

        timeCard.className = "time-card";


        if (isBooked) {

            /*
              ساعت رزروشده حذف نمی‌شود.
              قرمز و قفل می‌شود.
            */

            timeCard.classList.add("booked");

            timeCard.disabled = true;

            timeCard.innerHTML = `

                <i class="fa-solid fa-lock"></i>

                <span>
                    ${time}
                </span>

            `;

        } else {

            timeCard.innerHTML = `

                <i class="fa-regular fa-clock"></i>

                <span>
                    ${time}
                </span>

            `;


            if (selectedTime === time) {

                timeCard.classList.add("selected");

            }


            timeCard.addEventListener(
                "click",
                () => {

                    document
                        .querySelectorAll(".time-card")
                        .forEach(card =>
                            card.classList.remove(
                                "selected"
                            )
                        );


                    timeCard.classList.add(
                        "selected"
                    );


                    selectedTime = time;

                }
            );

        }


        timesContainer.appendChild(timeCard);

    });

}


/* =========================================================
   جمع‌آوری اطلاعات فرم
========================================================= */

function getReservationData() {

    const barber =
        getSelectedBarber();


    const service =
        getSelectedService();


    return {

        firstName:
            document
                .getElementById("firstName")
                ?.value
                ?.trim() || "",


        lastName:
            document
                .getElementById("lastName")
                ?.value
                ?.trim() || "",


        phone:
            document
                .getElementById("phone")
                ?.value
                ?.trim() || "",


        barberId:
            barber?.id || "",


        barberName:
            barber?.name || "",


        service:
            service || "",


        date:
            selectedDay || "",


        time:
            selectedTime || ""

    };

}


/* =========================================================
   ثبت رزرو
========================================================= */

async function handleSubmit(event) {

    event.preventDefault();


    if (isSubmitting) {
        return;
    }


    if (currentStep !== TOTAL_STEPS) {
        return;
    }


    if (!validateCurrentStep()) {
        return;
    }


    const reservation =
        getReservationData();


    isSubmitting = true;


    setSubmittingState(true);


    try {

        /*
          شناسه رزرو از ترکیب
          آرایشگر + تاریخ + ساعت ساخته می‌شود.

          این کار کمک می‌کند همان زمان
          برای یک آرایشگر دوباره ثبت نشود.
        */

        const reservationId = createReservationId(
            reservation.barberId,
            reservation.date,
            reservation.time
        );


        const reservationRef =
            doc(
                db,
                "reservations",
                reservationId
            );


        /*
          Transaction:
          ابتدا بررسی می‌کنیم زمان قبلاً گرفته نشده باشد.
          سپس رزرو را ثبت می‌کنیم.
        */

        await runTransaction(
            db,
            async transaction => {

                const existing =
                    await transaction.get(
                        reservationRef
                    );


                if (existing.exists()) {

                    throw new Error(
                        "TIME_ALREADY_BOOKED"
                    );

                }


                transaction.set(
                    reservationRef,
                    {

                        firstName:
                            reservation.firstName,


                        lastName:
                            reservation.lastName,


                        name:
                            `${reservation.firstName} ${reservation.lastName}`,


                        phone:
                            reservation.phone,


                        barberId:
                            reservation.barberId,


                        barberName:
                            reservation.barberName,


                        service:
                            reservation.service,


                        date:
                            reservation.date,


                        time:
                            reservation.time,


                        status:
                            "reserved",


                        createdAt:
                            serverTimestamp()

                    }
                );

            }
        );


        /*
          اگر ثبت موفق شد
        */

        showSuccess(reservation);


        /*
          برای اطمینان، وضعیت ساعت را
          در صفحه هم قرمز می‌کنیم.
        */

        reservedTimes.add(
            reservation.time
        );


        renderTimes();


    } catch (error) {

        console.error(
            "Reservation error:",
            error
        );


        if (
            error.message ===
            "TIME_ALREADY_BOOKED"
        ) {

            alert(
                "این ساعت همین الان توسط شخص دیگری رزرو شده است. لطفاً ساعت دیگری انتخاب کنید."
            );


            reservedTimes.add(
                reservation.time
            );


            selectedTime = null;


            renderTimes();

        } else {

            alert(
                "رزرو شما با مشکل مواجه شد. لطفاً اتصال اینترنت خود را بررسی کنید و دوباره تلاش کنید."
            );

        }


    } finally {

        isSubmitting = false;

        setSubmittingState(false);

    }

}


/* =========================================================
   ساخت ID رزرو
========================================================= */

function createReservationId(
    barberId,
    date,
    time
) {

    const safeBarber =
        String(barberId)
            .replace(/[^a-zA-Z0-9_-]/g, "");


    const safeDate =
        String(date)
            .replace(/[^0-9-]/g, "");


    const safeTime =
        String(time)
            .replace(/[^0-9]/g, "");


    return `${safeBarber}_${safeDate}_${safeTime}`;

}


/* =========================================================
   وضعیت دکمه ثبت
========================================================= */
function setSubmittingState(isLoading) {

    if (!submitBtn) {
        return;
    }


    submitBtn.disabled =
        isLoading;


    if (isLoading) {

        submitBtn.innerHTML = `

            <i class="fa-solid fa-spinner fa-spin"></i>

            در حال ثبت رزرو...

        `;

    } else {

        submitBtn.innerHTML = `

            <i class="fa-solid fa-check"></i>

            ثبت رزرو

        `;

    }

}


/* =========================================================
   صفحه موفقیت
========================================================= */

function showSuccess(reservation) {

    if (!successModal) {
        return;
    }


    if (successDetails) {

        successDetails.innerHTML = `

            <div>
                <strong>نام مشتری:</strong>
                ${escapeHTML(
                    reservation.firstName
                )}
                ${escapeHTML(
                    reservation.lastName
                )}
            </div>

            <div>
                <strong>شماره تماس:</strong>
                ${escapeHTML(
                    reservation.phone
                )}
            </div>

            <div>
                <strong>آرایشگر:</strong>
                ${escapeHTML(
                    reservation.barberName
                )}
            </div>

            <div>
                <strong>خدمت:</strong>
                ${escapeHTML(
                    reservation.service
                )}
            </div>

            <div>
                <strong>روز:</strong>
                ${escapeHTML(
                    formatPersianDateKey(
                        reservation.date
                    )
                )}
            </div>

            <div>
                <strong>ساعت:</strong>
                ${escapeHTML(
                    reservation.time
                )}
            </div>

        `;

    }


    successModal.classList.add(
        "active"
    );


    document.body.style.overflow =
        "hidden";

}


/* =========================================================
   تبدیل تاریخ ذخیره‌شده به تاریخ فارسی
========================================================= */

function formatPersianDateKey(dateKey) {

    try {

        const [year, month, day] =
            dateKey.split("-")
                .map(Number);


        const date =
            new Date(
                year,
                month - 1,
                day
            );


        return new Intl.DateTimeFormat(
            "fa-IR-u-ca-persian",
            {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric"
            }
        ).format(date);

    } catch (error) {

        return dateKey;

    }

}


/* =========================================================
   جلوگیری از HTML Injection
========================================================= */

function escapeHTML(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


/* =========================================================
   پایان فایل
========================================================= */
