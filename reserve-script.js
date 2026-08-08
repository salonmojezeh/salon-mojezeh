/*======================================
    Salon Mojezeh
    reserve-script.js
    Part 1
======================================*/

"use strict";

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
    Progress Bar
======================================*/

function updateProgress() {

    const percentage =
        (currentStep / totalSteps) * 100;

    progressBar.style.width =
        `${percentage}%`;

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
    Initial State
======================================*/

showStep(1);

console.log("Reservation system initialized.");
/*======================================
    Validation - Step 1
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


    /*----------------------------------
        نام
    ----------------------------------*/

    if (!firstName) {

        alert("لطفاً نام خود را وارد کنید.");

        firstNameInput.focus();

        return false;

    }


    /*----------------------------------
        نام خانوادگی
    ----------------------------------*/

    if (!lastName) {

        alert("لطفاً نام خانوادگی خود را وارد کنید.");

        lastNameInput.focus();

        return false;

    }


    /*----------------------------------
        شماره موبایل
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
        Save Customer Data
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
    Validate Step 2
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
    Next Button
======================================*/

nextBtn.addEventListener("click", () => {


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

        if (!reservationData.date) {

            alert("لطفاً ابتدا یک روز را انتخاب کنید.");

            return;

        }

        showStep(4);

        return;

    }

});


/*======================================
    Previous Button
======================================*/

prevBtn.addEventListener("click", () => {


    if (currentStep <= 1) {

        return;

    }


    showStep(currentStep - 1);

});
/*======================================
    Step 3 - Generate Days
======================================*/

function generateDays() {

    daysContainer.innerHTML = "";

    const today = new Date();

    for (let i = 0; i < 30; i++) {

        const date = new Date(today);

        date.setDate(today.getDate() + i);

        /*----------------------------------
            Date Values
        ----------------------------------*/

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


        /*----------------------------------
            Persian Day Name
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
            Day Card
        ----------------------------------*/

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


        /*----------------------------------
            Selected Day
        ----------------------------------*/

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


                /*----------------------------------
                    Reset Previous Time
                ----------------------------------*/

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
    Generate Days
======================================*/

generateDays();
/*======================================
    Step 4 - Time Slots
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
    Generate Time Slots
======================================*/

function generateTimeSlots() {

    timesContainer.innerHTML = "";

    if (!reservationData.date) {

        return;

    }


    timeSlots.forEach(time => {

        const timeCard =
            document.createElement("button");

        timeCard.type = "button";

        timeCard.className = "time-card";

        timeCard.dataset.time = time;

        timeCard.textContent = time;


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

}


/*======================================
    Generate Times When Entering Step 4
======================================*/

const originalShowStep = showStep;

showStep = function(stepNumber) {

    originalShowStep(stepNumber);


    if (stepNumber === 4) {

        generateTimeSlots();

    }

};


/*======================================
    Time Validation
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
