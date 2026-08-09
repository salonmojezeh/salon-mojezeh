/*======================================
    Salon Mojezeh
    reserve-script.js
    FINAL VERSION
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
    DOM Elements
======================================*/

const reserveForm = document.getElementById("reserveForm");

const step1 = document.getElementById("step1");
const step2 = document.getElementById("step2");
const step3 = document.getElementById("step3");
const step4 = document.getElementById("step4");

const nextBtn = document.getElementById("nextBtn");
const prevBtn = document.getElementById("prevBtn");

const submitBtn = document.getElementById("submitBtn");

const progressBar = document.getElementById("progressBar");

const daysContainer = document.getElementById("daysContainer");
const timesContainer = document.getElementById("timesContainer");

const successModal = document.getElementById("successModal");
const successDetails = document.getElementById("successDetails");


/*======================================
    Current Step
======================================*/

let currentStep = 1;

const totalSteps = 4;


/*======================================
    Reservation Data
======================================*/

const reservationData = {

    firstName: "",
    lastName: "",
    phone: "",
    service: "",
    date: "",
    time: ""

};


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
        step4
    ];

    steps.forEach(step => {

        if (step) {
            step.classList.remove("active");
        }

    });

    const selectedStep = steps[stepNumber - 1];

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

    const percentage =
        (currentStep / totalSteps) * 100;

    if (progressBar) {

        progressBar.style.width =
            `${percentage}%`;

    }

}


/*======================================
    Buttons
======================================*/

function updateButtons() {

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
    Step 1 Validation
======================================*/

function validateStep1() {

    const firstNameInput =
        document.getElementById("firstName");

    const lastNameInput =
        document.getElementById("lastName");

    const phoneInput =
        document.getElementById("phone");


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


    const phonePattern =
        /^09\d{9}$/;


    if (!phonePattern.test(phone)) {

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
    Step 2 Validation
======================================*/

function validateStep2() {

    const selectedService =
        document.querySelector(
            'input[name="service"]:checked'
        );


    if (!selectedService) {

        alert("لطفاً یک خدمت را انتخاب کنید.");

        return false;

    }


    reservationData.service =
        selectedService.value;


    return true;

}


/*======================================
    Step 3 Validation
======================================*/

function validateStep3() {

    if (!reservationData.date) {

        alert("لطفاً یک روز را انتخاب کنید.");

        return false;

    }

    return true;

}


/*======================================
    Step 4 Validation
======================================*/

function validateStep4() {

    if (!reservationData.date) {

        alert("لطفاً ابتدا روز مورد نظر خود را انتخاب کنید.");

        showStep(3);

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

    daysContainer.innerHTML = "";

    const today = new Date();

    today.setHours(0, 0, 0, 0);


    for (let i = 0; i < 30; i++) {

        const date = new Date(today);

        date.setDate(
            today.getDate() + i
        );


        const year =
            date.getFullYear();

        const month =
            String(date.getMonth() + 1)
                .padStart(2, "0");

        const day =
            String(date.getDate())
                .padStart(2, "0");


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

        dayCard.className = "day-card";

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
                    .querySelectorAll(".day-card")
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


                reservationData.time = "";


                timesContainer.innerHTML = "";


                console.log(
                    "Selected date:",
                    reservationData.date
                );

            }
        );


        daysContainer.appendChild(
            dayCard
        );

    }

}


/*======================================
    Check Reserved Times
======================================*/

async function getReservedTimes(date) {

    try {

        const reservationsRef =
            collection(db, "reservations");


        const q =
            query(
                reservationsRef,
                where("date", "==", date),
                where("status", "==", "reserved")
            );


        const snapshot =
            await getDocs(q);


        const reservedTimes = [];


        snapshot.forEach(doc => {

            const data = doc.data();


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

    timesContainer.innerHTML = "";


    if (!reservationData.date) {

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
            reservationData.date
        );


    timesContainer.innerHTML = "";


    timeSlots.forEach(time => {

        const timeCard =
            document.createElement("button");


        timeCard.type = "button";

        timeCard.className = "time-card";

        timeCard.dataset.time =
            time;


        timeCard.textContent =
            time;


        /*----------------------------------
            Already Reserved
        ----------------------------------*/

        if (
            reservedTimes.includes(time)
        ) {

            timeCard.classList.add(
                "booked"
            );

            timeCard.disabled = true;

            timeCard.innerHTML = `

                <i class="fa-solid fa-lock"
                   style="margin-left:8px">
                </i>

                ${time}

            `;

            timesContainer.appendChild(
                timeCard
            );

            return;

        }


        /*----------------------------------
            Select Time
        ----------------------------------*/

        timeCard.addEventListener(
            "click",
            () => {

                document
                    .querySelectorAll(".time-card")
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


                console.log(
                    "Selected time:",
                    reservationData.time
                );

            }
        );


        timesContainer.appendChild(
            timeCard
        );

    });


    /*----------------------------------
        No Available Time
    ----------------------------------*/

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
    Save Reservation To Firebase
======================================*/

async function saveReservation() {

    const reservation = {

        firstName:
            reservationData.firstName,

        lastName:
            reservationData.lastName,

        name:
            `${reservationData.firstName} ${reservationData.lastName}`,

        phone:
            reservationData.phone,

        service:
            reservationData.service,

        duration:
            services[
                reservationData.service
            ]?.duration || 30,

        date:
            reservationData.date,

        time:
            reservationData.time,

        status:
            "reserved",

        createdAt:
            serverTimestamp()

    };


    try {

        submitBtn.disabled = true;

        submitBtn.innerHTML = `

            <i class="fa-solid fa-spinner fa-spin"></i>

            در حال ثبت رزرو...

        `;


        /*----------------------------------
            Final Duplicate Check
        ----------------------------------*/

        const reservationsRef =
            collection(db, "reservations");


        const q =
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
                    "status",
                    "==",
                    "reserved"
                )
            );


        const snapshot =
            await getDocs(q);


        if (!snapshot.empty) {

            alert(
                "این ساعت همین الان توسط مشتری دیگری رزرو شده است. لطفاً ساعت دیگری انتخاب کنید."
            );


            submitBtn.disabled = false;

            submitBtn.innerHTML = `

                <i class="fa-solid fa-check"></i>

                ثبت رزرو

            `;


            await generateTimeSlots();

            return false;

        }


        /*----------------------------------
            Save
        ----------------------------------*/

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

        submitBtn.disabled = false;

        submitBtn.innerHTML = `

            <i class="fa-solid fa-check"></i>

            ثبت رزرو

        `;

    }

}


/*======================================
    Persian Date For Success
======================================*/

function getPersianDate(dateString) {

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
    Show Success
======================================*/

function showSuccess() {

    const persianDate =
        getPersianDate(
            reservationData.date
        );


    const duration =
        services[
            reservationData.service
        ]?.duration || 30;


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
            <strong>خدمت:</strong>
            ${reservationData.service}
        </div>

        <div>
            <strong>مدت خدمت:</strong>
            ${duration} دقیقه
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
    Submit Reservation
======================================*/

reserveForm.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        if (!validateStep4()) {

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
    Next Button
======================================*/

nextBtn.addEventListener(
    "click",
    async () => {

        /*----------------------------------
            Step 1 → Step 2
        ----------------------------------*/

        if (currentStep === 1) {

            if (!validateStep1()) {

                return;

            }

            showStep(2);

            return;

        }


        /*----------------------------------
            Step 2 → Step 3
        ----------------------------------*/

        if (currentStep === 2) {

            if (!validateStep2()) {

                return;

            }

            showStep(3);

            return;

        }


        /*----------------------------------
            Step 3 → Step 4
        ----------------------------------*/

        if (currentStep === 3) {

            if (!validateStep3()) {

                return;

            }

            showStep(4);

            await generateTimeSlots();

            return;

        }

    }
);


/*======================================
    Previous Button
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
    Initial Setup
======================================*/

generateDays();

showStep(1);


console.log(
    "Salon Mojezeh reservation system ready."
);
