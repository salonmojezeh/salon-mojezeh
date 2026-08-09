/*======================================
    Salon Mojezeh
    reserve-script.js
    Final Version
======================================*/

"use strict";

/*======================================
    Firebase
======================================*/

import { db } from "./firebase.js";

import {
    collection,
    query,
    where,
    getDocs,
    addDoc,
    updateDoc,
    doc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


/*======================================
    DOM Elements
======================================*/

const reserveForm =
    document.getElementById("reserveForm");

const step1 =
    document.getElementById("step1");

const step2 =
    document.getElementById("step2");

const step3 =
    document.getElementById("step3");

const step4 =
    document.getElementById("step4");

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


/*======================================
    Safety Check
======================================*/

if (
    !reserveForm ||
    !step1 ||
    !step2 ||
    !step3 ||
    !step4 ||
    !nextBtn ||
    !prevBtn ||
    !submitBtn ||
    !progressBar ||
    !daysContainer ||
    !timesContainer
) {

    console.error(
        "Reservation page elements were not found."
    );

}


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
    Persian Digits → English Digits
======================================*/

function normalizeDigits(value) {

    if (!value) {
        return "";
    }

    return value
        .replace(/[۰-۹]/g, digit =>
            String(
                "۰۱۲۳۴۵۶۷۸۹".indexOf(digit)
            )
        )
        .replace(/[٠-٩]/g, digit =>
            String(
                "٠١٢٣٤٥٦٧٨٩".indexOf(digit)
            )
        );

}


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


    const selectedStep =
        steps[stepNumber - 1];


    if (selectedStep) {

        selectedStep.classList.add("active");

    }


    currentStep = stepNumber;


    updateProgress();

    updateButtons();


    if (stepNumber === 3) {

        generateDays();

    }


    if (stepNumber === 4) {

        generateTimeSlots();

    }


    window.scrollTo({

        top: 0,

        behavior: "smooth"

    });

}


/*======================================
    Progress Bar
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
        normalizeDigits(
            phoneInput.value.trim()
        );


    /*----------------------------------
        First Name
    ----------------------------------*/

    if (!firstName) {

        alert(
            "لطفاً نام خود را وارد کنید."
        );

        firstNameInput.focus();

        return false;

    }


    /*----------------------------------
        Last Name
    ----------------------------------*/

    if (!lastName) {

        alert(
            "لطفاً نام خانوادگی خود را وارد کنید."
        );

        lastNameInput.focus();

        return false;

    }


    /*----------------------------------
        Phone
    ----------------------------------*/

    const phonePattern =
        /^09\d{9}$/;


    if (!phonePattern.test(phone)) {

        alert(
            "لطفاً شماره موبایل معتبر وارد کنید.\nمثال: 09123456789"
        );

        phoneInput.focus();

        return false;

    }


    /*----------------------------------
        Save Data
    ----------------------------------*/

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

        alert(
            "لطفاً یک خدمت را انتخاب کنید."
        );

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

        alert(
            "لطفاً ابتدا یک روز را انتخاب کنید."
        );

        return false;

    }


    return true;

}


/*======================================
    Step 4 Validation
======================================*/

function validateStep4() {

    if (!reservationData.date) {

        alert(
            "لطفاً ابتدا روز مورد نظر خود را انتخاب کنید."
        );

        showStep(3);

        return false;

    }


    if (!reservationData.time) {

        alert(
            "لطفاً ساعت مورد نظر خود را انتخاب کنید."
        );

        return false;

    }


    return true;

}


/*======================================
    Generate 30 Days
======================================*/

function generateDays() {

    daysContainer.innerHTML = "";


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
        i < 30;
        i++
    ) {

        const date =
            new Date(today);


        date.setDate(
            today.getDate() + i
        );


        /*----------------------------------
            Date Value
        ----------------------------------*/

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


        /*----------------------------------
            Persian Day
        ----------------------------------*/

        const dayName =
            new Intl.DateTimeFormat(
                "fa-IR",
                {
                    weekday: "long"
                }
            ).format(date);


        /*----------------------------------
            Persian Date
        ----------------------------------*/

        const persianDate =
            new Intl.DateTimeFormat(
                "fa-IR",
                {
                    year: "numeric",
                    month: "long",
                    day: "numeric"
                }
            ).format(date);


        /*----------------------------------
            Card
        ----------------------------------*/

        const dayCard =
            document.createElement("button");


        dayCard.type =
            "button";


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


        /*----------------------------------
            Restore Selected Day
        ----------------------------------*/

        if (
            reservationData.date ===
            dateValue
        ) {

            dayCard.classList.add(
                "selected"
            );

        }


        /*----------------------------------
            Click
        ----------------------------------*/

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


                timesContainer.innerHTML =
                    "";


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
    Get Booked Times From Firestore
======================================*/

async function getBookedTimes(date) {

    const bookedTimes = [];


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
                )
            );


        const snapshot =
            await getDocs(q);


        snapshot.forEach(
            reservationDoc => {

                const data =
                    reservationDoc.data();


                if (
                    data.status !==
                    "cancelled" &&
                    data.time
                ) {

                    bookedTimes.push(
                        data.time
                    );

                }

            }
        );


    } catch (error) {

        console.error(
            "Error loading booked times:",
            error
        );


        alert(
            "دریافت ساعت‌های رزروشده با مشکل مواجه شد."
        );

    }


    return bookedTimes;

}


/*======================================
    Check If Time Is In The Past
======================================*/

function isPastTime(dateString, timeString) {

    const today =
        new Date();


    const selectedDate =
        new Date(
            `${dateString}T${timeString}:00`
        );


    if (
        Number.isNaN(
            selectedDate.getTime()
        )
    ) {

        return false;

    }


    return selectedDate < today;

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

        <div
            style="
                grid-column:1/-1;
                text-align:center;
                padding:30px;
                color:var(--text);
            "
        >

            <i
                class="fa-solid fa-spinner fa-spin"
                style="margin-left:8px;"
            ></i>

            در حال بررسی ساعت‌های آزاد...

        </div>

    `;


    const bookedTimes =
        await getBookedTimes(
            reservationData.date
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


        /*----------------------------------
            Booked
        ----------------------------------*/

        if (
            bookedTimes.includes(time)
        ) {

            timeCard.classList.add(
                "booked"
            );


            timeCard.disabled =
                true;


            timeCard.innerHTML = `

                <i
                    class="fa-solid fa-lock"
                    style="margin-left:8px;"
                ></i>

                ${time}

            `;


            timesContainer.appendChild(
                timeCard
            );


            return;

        }


        /*----------------------------------
            Past
        ----------------------------------*/

        if (
            isPastTime(
                reservationData.date,
                time
            )
        ) {

            timeCard.classList.add(
                "disabled"
            );


            timeCard.disabled =
                true;


            timeCard.innerHTML = `

                <i
                    class="fa-solid fa-clock"
                    style="margin-left:8px;"
                ></i>

                ${time}

            `;


            timesContainer.appendChild(
                timeCard
            );


            return;

        }


        /*----------------------------------
            Available
        ----------------------------------*/

        timeCard.textContent =
            time;


        /*----------------------------------
            Restore Selected Time
        ----------------------------------*/

        if (
            reservationData.time ===
            time
        ) {

            timeCard.classList.add(
                "selected"
            );

        }


        /*----------------------------------
            Select Time
        ----------------------------------*/

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

}


/*======================================
    Final Double-Check
======================================*/

async function checkTimeStillAvailable() {

    if (
        !reservationData.date ||
        !reservationData.time
    ) {

        return false;

    }


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
                reservationData.date
            ),
            where(
                "time",
                "==",
                reservationData.time
            )
        );


    const snapshot =
        await getDocs(q);


    let alreadyBooked = false;


    snapshot.forEach(
        reservationDoc => {

            const data =
                reservationDoc.data();


            if (
                data.status !==
                "cancelled"
            ) {

                alreadyBooked = true;

            }

        }
    );


    return !alreadyBooked;

}


/*======================================
    Save / Update Customer
======================================*/

async function saveCustomer() {

    const customersRef =
        collection(
            db,
            "customers"
        );


    const q =
        query(
            customersRef,
            where(
                "phone",
                "==",
                reservationData.phone
            )
        );


    const snapshot =
        await getDocs(q);


    /*----------------------------------
        Existing Customer
    ----------------------------------*/

    if (!snapshot.empty) {

        const customerDoc =
            snapshot.docs[0];


        await updateDoc(
            doc(
                db,
                "customers",
                customerDoc.id
            ),
            {

                firstName:
                    reservationData.firstName,

                lastName:
                    reservationData.lastName,

                phone:
                    reservationData.phone,

                favoriteService:
                    reservationData.service,

                lastVisit:
                    reservationData.date,

                updatedAt:
                    serverTimestamp()

            }
        );


        return customerDoc.id;

    }


    /*----------------------------------
        New Customer
    ----------------------------------*/

    const newCustomer =
        await addDoc(
            customersRef,
            {

                firstName:
                    reservationData.firstName,

                lastName:
                    reservationData.lastName,

                phone:
                    reservationData.phone,

                favoriteService:
                    reservationData.service,

                visitCount:
                    1,

                freeGift:
                    false,

                note:
                    "",

                createdAt:
                    serverTimestamp(),

                updatedAt:
                    serverTimestamp()

            }
        );


    return newCustomer.id;

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


    const reservation =
        await addDoc(
            reservationsRef,
            {

                name:
                    `${reservationData.firstName} ${reservationData.lastName}`,

                firstName:
                    reservationData.firstName,

                lastName:
                    reservationData.lastName,

                phone:
                    reservationData.phone,

                service:
                    reservationData.service,

                duration:
                    services[
                        reservationData.service
                    ]?.duration || 60,

                date:
                    reservationData.date,

                time:
                    reservationData.time,

                status:
                    "reserved",

                createdAt:
                    serverTimestamp()

            }
        );


    return reservation.id;

}


/*======================================
    Persian Display Date
======================================*/

function getPersianDisplayDate(
    dateString
) {

    const date =
        new Date(
            `${dateString}T12:00:00`
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return dateString;

    }


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
    Show Success Modal
======================================*/

function showSuccessModal() {

    if (!successModal) {

        return;

    }


    const displayDate =
        getPersianDisplayDate(
            reservationData.date
        );


    const serviceDuration =
        services[
            reservationData.service
        ]?.duration || 60;


    if (successDetails) {

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
                ${serviceDuration}
                دقیقه
            </div>

            <div>
                <strong>روز:</strong>
                ${displayDate}
            </div>

            <div>
                <strong>ساعت:</strong>
                ${reservationData.time}
            </div>

        `;

    }


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


        /*----------------------------------
            Validate Everything
        ----------------------------------*/

        if (!validateStep1()) {

            showStep(1);

            return;

        }


        if (!validateStep2()) {

            showStep(2);

            return;

        }


        if (!validateStep3()) {

            showStep(3);

            return;

        }


        if (!validateStep4()) {

            showStep(4);

            return;

        }


        /*----------------------------------
            Disable Button
        ----------------------------------*/

        submitBtn.disabled =
            true;


        const originalText =
            submitBtn.innerHTML;


        submitBtn.innerHTML = `

            <i
                class="fa-solid fa-spinner fa-spin"
            ></i>

            در حال ثبت رزرو...

        `;


        try {

            /*----------------------------------
                Final Availability Check
            ----------------------------------*/

            const available =
                await checkTimeStillAvailable();


            if (!available) {

                alert(
                    "این ساعت همین الان توسط شخص دیگری رزرو شده است. لطفاً ساعت دیگری انتخاب کنید."
                );


                reservationData.time =
                    "";


                showStep(4);


                return;

            }


            /*----------------------------------
                Save Customer
            ----------------------------------*/

            await saveCustomer();


            /*----------------------------------
                Save Reservation
            ----------------------------------*/

            const reservationId =
                await saveReservation();


            console.log(
                "Reservation saved:",
                reservationId
            );


            /*----------------------------------
                Success
            ----------------------------------*/

            showSuccessModal();


        } catch (error) {

            console.error(
                "Reservation error:",
                error
            );


            alert(
                "متأسفانه ثبت رزرو انجام نشد. لطفاً دوباره تلاش کنید."
            );


        } finally {

            submitBtn.disabled =
                false;


            submitBtn.innerHTML =
                originalText;

        }

    }
);


/*======================================
    Next Button
======================================*/

nextBtn.addEventListener(
    "click",
    () => {

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
    Initial Days
======================================*/

generateDays();


/*======================================
    Initial State
======================================*/

showStep(1);


console.log(
    "Salon Mojezeh reservation system initialized."
);
