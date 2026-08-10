/*======================================
    Salon Mojezeh
    reserve-script.js
    FINAL - 5 STEP BOOKING SYSTEM
======================================*/

"use strict";

/*======================================
    Firebase
======================================*/

import {
    collection,
    addDoc,
    getDocs,
    query,
    where,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { db } from "./firebase.js";


/*======================================
    DOM
======================================*/

const reserveForm = document.getElementById("reserveForm");

const step1 = document.getElementById("step1");
const step2 = document.getElementById("step2");
const step3 = document.getElementById("step3");
const step4 = document.getElementById("step4");
const step5 = document.getElementById("step5");

const nextBtn = document.getElementById("nextBtn");
const prevBtn = document.getElementById("prevBtn");
const submitBtn = document.getElementById("submitBtn");

const progressBar = document.getElementById("progressBar");

const daysContainer =
    document.getElementById("daysContainer");

const timesContainer =
    document.getElementById("timesContainer");

const successModal =
    document.getElementById("successModal");

const successDetails =
    document.getElementById("successDetails");


/*======================================
    Steps
======================================*/

let currentStep = 1;

const totalSteps = 5;


/*======================================
    Reservation Data
======================================*/

const reservationData = {

    firstName: "",
    lastName: "",
    phone: "",

    barberId: "",
    barberName: "",

    service: "",
    duration: 0,

    date: "",
    time: ""

};


/*======================================
    Barbers
======================================*/

const barbers = [

    {
        id: "barber-1",
        name: "آرایشگر اصلی"
    },

    {
        id: "barber-2",
        name: "آرایشگر دوم"
    }

];


/*======================================
    Services
======================================*/

const services = {

    "اصلاح سر و صورت": {
        duration: 60
    },

    "حالت مو": {
        duration: 30
    },

    "خط و سایه": {
        duration: 30
    },

    "سایه ریش": {
        duration: 30
    }

};


/*======================================
    Time Slots
======================================*/

const timeSlots = [

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


/*======================================
    Show Step
======================================*/

function showStep(stepNumber) {

    const steps = [
        step1,
        step2,
        step3,
        step4,
        step5
    ];

    steps.forEach(step => {

        if (step) {
            step.classList.remove("active");
        }

    });

    const selectedStep =
        steps[stepNumber - 1];

    if (selectedStep) {
        selectedStep.classList.add("active");
    }

    currentStep = stepNumber;

    updateProgress();

    updateButtons();

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


/*======================================
    Progress
======================================*/

function updateProgress() {

    if (!progressBar) return;

    const percentage =
        (currentStep / totalSteps) * 100;

    progressBar.style.width =
        `${percentage}%`;

}


/*======================================
    Buttons
======================================*/

function updateButtons() {

    if (!prevBtn || !nextBtn || !submitBtn) {
        return;
    }

    if (currentStep === 1) {

        prevBtn.style.display = "none";

    } else {

        prevBtn.style.display = "flex";

    }


    if (currentStep === totalSteps) {

        nextBtn.style.display = "none";

        submitBtn.style.display = "flex";

    } else {

        nextBtn.style.display = "flex";

        submitBtn.style.display = "none";

    }

}


/*======================================
    Step 1
    Customer Information
======================================*/

function validateStep1() {

    const firstNameInput =
        document.getElementById("firstName");

    const lastNameInput =
        document.getElementById("lastName");

    const phoneInput =
        document.getElementById("phone");


    if (!firstNameInput ||
        !lastNameInput ||
        !phoneInput) {

        alert("فیلدهای اطلاعات مشتری پیدا نشدند.");

        return false;

    }


    const firstName =
        firstNameInput.value.trim();

    const lastName =
        lastNameInput.value.trim();

    const phone =
        phoneInput.value.trim();


    if (!firstName) {

        alert("لطفاً نام خود را وارد کنید.");

        firstNameInput.focus();

        return false;

    }


    if (!lastName) {

        alert("لطفاً نام خانوادگی خود را وارد کنید.");

        lastNameInput.focus();

        return false;

    }


    if (!/^09\d{9}$/.test(phone)) {

        alert(
            "لطفاً شماره موبایل معتبر وارد کنید.\nمثال: 09123456789"
        );

        phoneInput.focus();

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


/*======================================
    Step 2
    Barber
======================================*/

function validateStep2() {

    const selectedBarber =
        document.querySelector(
            'input[name="barber"]:checked'
        );


    if (!selectedBarber) {

        alert("لطفاً آرایشگر مورد نظر خود را انتخاب کنید.");

        return false;

    }


    reservationData.barberId =
        selectedBarber.value;

    reservationData.barberName =
        selectedBarber.dataset.name || "";


    return true;

}


/*======================================
    Step 3
    Service
======================================*/

function validateStep3() {

    const selectedService =
        document.querySelector(
            'input[name="service"]:checked'
        );


    if (!selectedService) {

        alert("لطفاً خدمت خود را انتخاب کنید.");

        return false;

    }


    reservationData.service =
        selectedService.value;


    reservationData.duration =
        services[
            reservationData.service
        ]?.duration || 30;


    return true;

}


/*======================================
    Step 4
    Date
======================================*/

function validateStep4() {

    if (!reservationData.date) {

        alert("لطفاً روز مورد نظر خود را انتخاب کنید.");

        return false;

    }

    return true;

}


/*======================================
    Step 5
    Time
======================================*/

function validateStep5() {

    if (!reservationData.date) {

        alert("لطفاً ابتدا روز را انتخاب کنید.");

        showStep(4);

        return false;

    }


    if (!reservationData.time) {

        alert("لطفاً ساعت مورد نظر خود را انتخاب کنید.");

        return false;

    }


    return true;

}


/*======================================
    Generate Days
======================================*/

function generateDays() {

    if (!daysContainer) return;

    daysContainer.innerHTML = "";

    const today = new Date();

    today.setHours(
        0,
        0,
        0,
        0
    );


    /*
        امروز + 29 روز
        = 30 روز قابل رزرو
    */

    for (let i = 0; i < 30; i++) {

        const date =
            new Date(today);

        date.setDate(
            today.getDate() + i
        );


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


        const dateValue =
            `${year}-${month}-${day}`;


        const dayName =
            new Intl.DateTimeFormat(
                "fa-IR",
                {
                    weekday: "long"
                }
            ).format(date);


        const persianDate =
            new Intl.DateTimeFormat(
                "fa-IR",
                {
                    year: "numeric",
                    month: "long",
                    day: "numeric"
                }
            ).format(date);


        const dayCard =
            document.createElement("button");


        dayCard.type = "button";

        dayCard.className =
            "day-card";

        dayCard.dataset.date =
            dateValue;


        dayCard.innerHTML = `

            <span class="day-name">
                ${dayName}
            </span>

            <span class="day-date">
                ${persianDate}
            </span>

        `;


        dayCard.addEventListener(
            "click",
            () => {

                document
                    .querySelectorAll(
                        ".day-card"
                    )
                    .forEach(card => {

                        card.classList.remove(
                            "selected"
                        );

                    });


                dayCard.classList.add(
                    "selected"
                );


                reservationData.date =
                    dateValue;


                reservationData.time =
                    "";


                if (timesContainer) {

                    timesContainer.innerHTML = "";

                }

            }
        );


        daysContainer.appendChild(
            dayCard
        );

    }

}


/*======================================
    Get Reserved Times
    Per Barber + Date
======================================*/

async function getReservedTimes(
    date,
    barberId
) {

    try {

        const reservationsRef =
            collection(
                db,
                "reservations"
            );


        const q =
            query(

                reservationsRef,

                where(
                    "date",
                    "==",
                    date
                ),

                where(
                    "barberId",
                    "==",
                    barberId
                ),

                where(
                    "status",
                    "==",
                    "reserved"
                )

            );


        const snapshot =
            await getDocs(q);


        const reservedTimes = [];


        snapshot.forEach(doc => {

            const data =
                doc.data();


            if (data.time) {

                reservedTimes.push(
                    data.time
                );

            }

        });


        return reservedTimes;


    } catch (error) {

        console.error(
            "Error loading reserved times:",
            error
        );

        return [];

    }

}


/*======================================
    Generate Time Slots
======================================*/

async function generateTimeSlots() {

    if (!timesContainer) return;

    timesContainer.innerHTML = "";


    if (
        !reservationData.date ||
        !reservationData.barberId
    ) {

        return;

    }


    timesContainer.innerHTML = `

        <div style="
            grid-column:1/-1;
            text-align:center;
            padding:25px;
            color:var(--text-light);
        ">

            در حال بررسی ساعت‌های آزاد...

        </div>

    `;


    const reservedTimes =
        await getReservedTimes(

            reservationData.date,

            reservationData.barberId

        );


    timesContainer.innerHTML = "";


    timeSlots.forEach(time => {

        const timeCard =
            document.createElement("button");


        timeCard.type =
            "button";


        timeCard.className =
            "time-card";


        timeCard.dataset.time =
            time;


        timeCard.textContent =
            time;


        /*
            Reserved
        */

        if (
            reservedTimes.includes(time)
        ) {

            timeCard.classList.add(
                "booked"
            );


            timeCard.disabled =
                true;


            timeCard.innerHTML = `

                <i
                    class="fa-solid fa-lock"
                    style="margin-left:8px">
                </i>

                ${time}

            `;


            timesContainer.appendChild(
                timeCard
            );


            return;

        }


        /*
            Available
        */

        timeCard.addEventListener(
            "click",
            () => {

                document
                    .querySelectorAll(
                        ".time-card"
                    )
                    .forEach(card => {

                        card.classList.remove(
                            "selected"
                        );

                    });


                timeCard.classList.add(
                    "selected"
                );


                reservationData.time =
                    time;


            }
        );


        timesContainer.appendChild(
            timeCard
        );

    });


    if (
        timesContainer.children.length === 0
    ) {

        timesContainer.innerHTML = `

            <div style="
                grid-column:1/-1;
                text-align:center;
                padding:30px;
                color:var(--text-light);
            ">

                برای این روز ساعت آزادی وجود ندارد.

            </div>

        `;

    }

}


/*======================================
    Save Reservation
======================================*/

async function saveReservation() {

    const reservationsRef =
        collection(
            db,
            "reservations"
        );


    try {

        submitBtn.disabled = true;


        submitBtn.innerHTML = `

            <i class="fa-solid fa-spinner fa-spin"></i>

            در حال ثبت رزرو...

        `;


        /*
            Final duplicate check

            مهم:
            تاریخ + ساعت + آرایشگر
        */

        const duplicateQuery =
            query(

                reservationsRef,

                where(
                    "date",
                    "==",
                    reservationData.date
                ),

                where(
                    "time",
                    "==",
                    reservationData.time
                ),

                where(
                    "barberId",
                    "==",
                    reservationData.barberId
                ),

                where(
                    "status",
                    "==",
                    "reserved"
                )

            );


        const snapshot =
            await getDocs(
                duplicateQuery
            );


        if (!snapshot.empty) {

            alert(
                "این ساعت برای این آرایشگر قبلاً رزرو شده است. لطفاً ساعت دیگری انتخاب کنید."
            );


            await generateTimeSlots();


            return false;

        }


        /*
            Reservation Object
        */

        const reservation = {

            firstName:
                reservationData.firstName,

            lastName:
                reservationData.lastName,

            name:
                `${reservationData.firstName} ${reservationData.lastName}`,

            phone:
                reservationData.phone,

            barberId:
                reservationData.barberId,

            barberName:
                reservationData.barberName,

            service:
                reservationData.service,

            duration:
                reservationData.duration,

            date:
                reservationData.date,

            time:
                reservationData.time,

            status:
                "reserved",

            createdAt:
                serverTimestamp()

        };


        /*
            Save to Firestore
        */

        const docRef =
            await addDoc(

                reservationsRef,

                reservation

            );


        console.log(
            "Reservation saved:",
            docRef.id
        );


        return true;


    } catch (error) {

        console.error(
            "Firebase reservation error:",
            error
        );


        alert(
            "متأسفانه ثبت رزرو انجام نشد.\nلطفاً دوباره تلاش کنید."
        );


        return false;


    } finally {

        submitBtn.disabled =
            false;


        submitBtn.innerHTML = `

            <i class="fa-solid fa-check"></i>

            ثبت رزرو

        `;

    }

}


/*======================================
    Persian Date
======================================*/

function getPersianDate(
    dateString
) {

    if (!dateString) {
        return "";
    }


    const parts =
        dateString.split("-");


    const date =
        new Date(

            Number(parts[0]),

            Number(parts[1]) - 1,

            Number(parts[2])

        );


    return new Intl.DateTimeFormat(
        "fa-IR",
        {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric"
        }
    ).format(date);

}


/*======================================
    Success
======================================*/

function showSuccess() {

    if (
        !successModal ||
        !successDetails
    ) {

        alert(
            "رزرو با موفقیت ثبت شد."
        );

        return;

    }


    const persianDate =
        getPersianDate(
            reservationData.date
        );


    successDetails.innerHTML = `

        <div>
            <strong>نام مشتری:</strong>
            ${reservationData.firstName}
            ${reservationData.lastName}
        </div>

        <div>
            <strong>شماره موبایل:</strong>
            ${reservationData.phone}
        </div>

        <div>
            <strong>آرایشگر:</strong>
            ${reservationData.barberName}
        </div>

        <div>
            <strong>خدمت:</strong>
            ${reservationData.service}
        </div>

        <div>
            <strong>مدت خدمت:</strong>
            ${reservationData.duration}
            دقیقه
        </div>

        <div>
            <strong>روز:</strong>
            ${persianDate}
        </div>

        <div>
            <strong>ساعت:</strong>
            ${reservationData.time}
        </div>

    `;


    successModal.classList.add(
        "active"
    );


    document.body.style.overflow =
        "hidden";

}


/*======================================
    Submit
======================================*/

reserveForm.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        if (!validateStep5()) {

            return;

        }


        const saved =
            await saveReservation();


        if (!saved) {

            return;

        }


        showSuccess();

    }
);


/*======================================
    Next
======================================*/

nextBtn.addEventListener(
    "click",
    async () => {


        /*==============================
            Step 1 → Step 2
        ==============================*/

        if (currentStep === 1) {

            if (!validateStep1()) {
                return;
            }

            showStep(2);

            return;

        }


        /*==============================
            Step 2 → Step 3
        ==============================*/
if (currentStep === 2) {

            if (!validateStep2()) {
                return;
            }

            showStep(3);

            return;

        }


        /*==============================
            Step 3 → Step 4
        ==============================*/

        if (currentStep === 3) {

            if (!validateStep3()) {
                return;
            }

            showStep(4);

            return;

        }


        /*==============================
            Step 4 → Step 5
        ==============================*/

        if (currentStep === 4) {

            if (!validateStep4()) {
                return;
            }

            showStep(5);

            await generateTimeSlots();

            return;

        }

    }
);


/*======================================
    Previous
======================================*/

prevBtn.addEventListener(
    "click",
    () => {

        if (currentStep <= 1) {
            return;
        }

        showStep(
            currentStep - 1
        );

    }
);


/*======================================
    Initial
======================================*/

generateDays();

showStep(1);


console.log(
    "Salon Mojezeh - Final booking system ready."
);
