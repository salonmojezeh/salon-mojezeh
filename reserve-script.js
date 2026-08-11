/*======================================
    Salon Mojezeh
    reserve-script.js
    Part 1 - Base + 5 Steps
======================================*/

"use strict";

/*======================================
    Firebase
======================================*/

import {
    db
} from "./firebase.js";

import {
    collection,
    query,
    where,
    getDocs,
    addDoc,
    doc,
    setDoc,
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

const step5 =
    document.getElementById("step5");


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
    Step Settings
======================================*/

const totalSteps = 5;

let currentStep = 1;


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

    serviceDuration: 0,

    date: "",

    displayDate: "",

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
    Step Elements
======================================*/

const steps = [

    step1,
    step2,
    step3,
    step4,
    step5

];


/*======================================
    Show Step
======================================*/

function showStep(stepNumber) {

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


    currentStep =
        stepNumber;


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
    Validate Step 1
======================================*/

function validateStep1() {

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

        document
            .getElementById("firstName")
            .focus();

        return false;

    }


    if (!lastName) {

        alert(
            "لطفاً نام خانوادگی خود را وارد کنید."
        );

        document
            .getElementById("lastName")
            .focus();

        return false;

    }


    if (!/^09\d{9}$/.test(phone)) {

        alert(
            "لطفاً شماره موبایل معتبر وارد کنید."
        );

        document
            .getElementById("phone")
            .focus();

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
    Validate Step 2
======================================*/

function validateStep2() {

    const selectedBarber =
        document.querySelector(
            'input[name="barber"]:checked'
        );


    if (!selectedBarber) {

        alert(
            "لطفاً آرایشگر مورد نظر خود را انتخاب کنید."
        );

        return false;

    }


    reservationData.barberId =
        selectedBarber.value;


    reservationData.barberName =
        selectedBarber.dataset.name;


    return true;

}


/*======================================
    Validate Step 3
======================================*/

function validateStep3() {

    const selectedService =
        document.querySelector(
            'input[name="service"]:checked'
        );


    if (!selectedService) {

        alert(
            "لطفاً خدمت مورد نظر خود را انتخاب کنید."
        );

        return false;

    }


    reservationData.service =
        selectedService.value;


    reservationData.serviceDuration =
        services[
            selectedService.value
        ]?.duration || 0;


    return true;

}


/*======================================
    Initial State
======================================*/

showStep(1);


/*======================================
    Debug
======================================*/

console.log(
    "Salon Mojezeh reservation system started."
);

console.log(
    "5-step reservation flow is ready."
);
/*======================================
    Step Navigation
======================================*/


/*======================================
    Next Button
======================================*/

nextBtn.addEventListener("click", async () => {

    let valid = true;


    /*----------------------------------
        Step 1
    ----------------------------------*/

    if (currentStep === 1) {

        valid = validateStep1();

    }


    /*----------------------------------
        Step 2
    ----------------------------------*/

    else if (currentStep === 2) {

        valid = validateStep2();

    }


    /*----------------------------------
        Step 3
    ----------------------------------*/

    else if (currentStep === 3) {

        valid = validateStep3();

    }


    /*----------------------------------
        Step 4
    ----------------------------------*/

    else if (currentStep === 4) {

        const selectedDay =
            document.querySelector(
                ".day-card.selected"
            );


        if (!selectedDay) {

            alert(
                "لطفاً ابتدا یک روز را انتخاب کنید."
            );

            return;

        }


        reservationData.date =
            selectedDay.dataset.date;


        reservationData.displayDate =
            selectedDay.dataset.displayDate;

    }


    /*----------------------------------
        Continue
    ----------------------------------*/

    if (!valid) {

        return;

    }


    /*----------------------------------
        Step 2 → Step 3
    ----------------------------------*/

    if (currentStep === 2) {

        showStep(3);

    }


    /*----------------------------------
        Step 3 → Step 4
    ----------------------------------*/

    else if (currentStep === 3) {

        createDays();

        showStep(4);

    }


    /*----------------------------------
        Step 4 → Step 5
    ----------------------------------*/

    else if (currentStep === 4) {

        await createTimes();

        showStep(5);

    }


    /*----------------------------------
        Step 1 → Step 2
    ----------------------------------*/

    else {

        showStep(
            currentStep + 1
        );

    }

});


/*======================================
    Previous Button
======================================*/

prevBtn.addEventListener("click", () => {

    if (currentStep <= 1) {

        return;

    }


    showStep(
        currentStep - 1
    );

});


/*======================================
    Phone Input
======================================*/

const phoneInput =
    document.getElementById("phone");


if (phoneInput) {

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


/*======================================
    Barber Selection
======================================*/

const barberInputs =
    document.querySelectorAll(
        'input[name="barber"]'
    );


barberInputs.forEach(input => {

    input.addEventListener(
        "change",
        () => {

            reservationData.barberId =
                input.value;


            reservationData.barberName =
                input.dataset.name || "";


            /*
                اگر آرایشگر عوض شد،
                روز و ساعت قبلی پاک می‌شود.
            */

            reservationData.date = "";

            reservationData.displayDate = "";

            reservationData.time = "";


            daysContainer.innerHTML = "";

            timesContainer.innerHTML = "";

        }
    );

});


/*======================================
    Service Selection
======================================*/

const serviceInputs =
    document.querySelectorAll(
        'input[name="service"]'
    );


serviceInputs.forEach(input => {

    input.addEventListener(
        "change",
        () => {

            const serviceName =
                input.value;


            reservationData.service =
                serviceName;


            reservationData.serviceDuration =
                services[
                    serviceName
                ]?.duration || 0;


            /*
                اگر خدمت تغییر کرد،
                ساعت انتخاب‌شده قبلی
                دیگر معتبر نیست.
            */

            reservationData.time = "";

            timesContainer.innerHTML = "";

        }
    );

});


/*======================================
    Form Submit Protection
======================================*/

reserveForm.addEventListener(
    "submit",
    event => {

        event.preventDefault();

        /*
            ثبت نهایی در قسمت‌های بعدی
            انجام خواهد شد.
        */

        console.log(
            "Reservation data:",
            reservationData
        );

    }
);
/*======================================
    Part 3
    30 Days Calendar
======================================*/


/*======================================
    Persian Date Helpers
======================================*/

/*
    برای نمایش تاریخ شمسی از Intl استفاده می‌کنیم.
    مقدار dataset.date همچنان میلادی و استاندارد
    باقی می‌ماند تا Firebase راحت‌تر بتواند آن را
    ذخیره و جستجو کند.
*/

function getPersianDate(date) {

    return new Intl.DateTimeFormat(
        "fa-IR-u-ca-persian",
        {
            year: "numeric",
            month: "long",
            day: "numeric"
        }
    ).format(date);

}


/*======================================
    Persian Day Name
======================================*/

function getPersianDayName(date) {

    return new Intl.DateTimeFormat(
        "fa-IR",
        {
            weekday: "long"
        }
    ).format(date);

}


/*======================================
    ISO Date
======================================*/

function getISODate(date) {

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


/*======================================
    Create 30 Days
======================================*/

function createDays() {

    if (!daysContainer) {

        return;

    }


    daysContainer.innerHTML = "";


    /*
        هر بار که وارد مرحله چهار می‌شویم
        ۳۰ روز آینده ساخته می‌شود.
    */

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


        const isoDate =
            getISODate(date);


        const persianDate =
            getPersianDate(date);


        const dayName =
            getPersianDayName(date);


        const dayCard =
            document.createElement("div");


        dayCard.className =
            "day-card";


        dayCard.dataset.date =
            isoDate;


        dayCard.dataset.displayDate =
            persianDate;


        /*
            نمایش کارت روز
        */

        dayCard.innerHTML = `

            <span class="day-name">

                ${dayName}

            </span>

            <span class="day-date">

                ${persianDate}

            </span>

        `;


        /*
            اگر روز قبلی انتخاب شده باشد،
            دوباره همان روز انتخاب شود.
        */

        if (
            reservationData.date ===
            isoDate
        ) {

            dayCard.classList.add(
                "selected"
            );

        }


        /*----------------------------------
            انتخاب روز
        ----------------------------------*/

        dayCard.addEventListener(
            "click",
            () => {

                /*
                    حذف انتخاب قبلی
                */

                document
                    .querySelectorAll(
                        ".day-card"
                    )
                    .forEach(card => {

                        card.classList.remove(
                            "selected"
                        );

                    });


                /*
                    انتخاب کارت جدید
                */

                dayCard.classList.add(
                    "selected"
                );


                /*
                    ذخیره اطلاعات روز
                */

                reservationData.date =
                    isoDate;


                reservationData.displayDate =
                    persianDate;


                /*
                    ساعت قبلی دیگر معتبر نیست
                */

                reservationData.time =
                    "";


                if (timesContainer) {

                    timesContainer.innerHTML =
                        "";

                }


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
    Initial Calendar
======================================*/

console.log(
    "30-day calendar module loaded."
);
/*======================================
    Part 4
    Time Selection - Step 5
======================================*/


/*======================================
    Working Hours
======================================*/

/*
    ساعت‌های کاری سالن
    فعلاً از 09:00 تا 21:00
    به فاصله یک ساعت
*/

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


/*======================================
    Create Time Cards
======================================*/

async function createTimes() {

    if (!timesContainer) {

        return;

    }


    timesContainer.innerHTML = "";


    /*
        اگر آرایشگر انتخاب نشده باشد
    */

    if (!reservationData.barberId) {

        timesContainer.innerHTML = `
            <div class="time-message">
                ابتدا آرایشگر را انتخاب کنید.
            </div>
        `;

        return;

    }


    /*
        اگر روز انتخاب نشده باشد
    */

    if (!reservationData.date) {

        timesContainer.innerHTML = `
            <div class="time-message">
                ابتدا روز مورد نظر را انتخاب کنید.
            </div>
        `;

        return;

    }


    /*
        دریافت ساعت‌های رزروشده
        برای آرایشگر و روز انتخاب‌شده
    */

    let bookedTimes = [];


    try {

        bookedTimes =
            await getBookedTimes(
                reservationData.barberId,
                reservationData.date
            );

    } catch (error) {

        console.error(
            "Error loading booked times:",
            error
        );

    }


    /*
        ساخت کارت ساعت‌ها
    */

    workingHours.forEach(
        time => {

            const timeCard =
                document.createElement(
                    "div"
                );


            timeCard.className =
                "time-card";


            timeCard.dataset.time =
                time;


            /*
                ساعت رزروشده
            */

            if (
                bookedTimes.includes(time)
            ) {

                timeCard.classList.add(
                    "booked"
                );


                timeCard.innerHTML = `

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


            /*
                ساعت آزاد
            */

            timeCard.innerHTML = `

                <i class="fa-regular fa-clock"></i>

                <span>
                    ${time}
                </span>

            `;


            /*
                اگر ساعت قبلاً انتخاب شده
            */

            if (
                reservationData.time ===
                time
            ) {

                timeCard.classList.add(
                    "selected"
                );

            }


            /*
                انتخاب ساعت
            */

            timeCard.addEventListener(
                "click",
                () => {

                    /*
                        حذف انتخاب قبلی
                    */

                    document
                        .querySelectorAll(
                            ".time-card"
                        )
                        .forEach(card => {

                            card.classList.remove(
                                "selected"
                            );

                        });


                    /*
                        انتخاب ساعت جدید
                    */

                    timeCard.classList.add(
                        "selected"
                    );


                    /*
                        ذخیره ساعت
                    */

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

        }
    );

}


/*======================================
    Get Booked Times
======================================*/

/*
    این تابع فعلاً از Firebase
    رزروهای موجود را می‌خواند.

    در قسمت Firebase نهایی،
    query دقیق آن را کامل می‌کنیم.
*/

async function getBookedTimes(
    barberId,
    date
) {

    try {

        /*
            اگر تابع Firebase در دسترس باشد
        */

        if (
            typeof loadBookedTimes ===
            "function"
        ) {

            return await loadBookedTimes(
                barberId,
                date
            );

        }


        /*
            فعلاً اگر تابع Firebase
            هنوز ساخته نشده باشد،
            هیچ ساعتی رزروشده نیست.
        */

        return [];

    } catch (error) {

        console.error(
            "Could not get booked times:",
            error
        );


        return [];

    }

}


/*======================================
    Step 5 Validation
======================================*/

function validateStep5() {

    if (
        !reservationData.time
    ) {

        alert(
            "لطفاً ابتدا یک ساعت را انتخاب کنید."
        );

        return false;

    }


    return true;

}


/*======================================
    Final Step Button
======================================*/

/*
    در مرحله پنجم، دکمه «مرحله بعد»
    تبدیل به «ثبت رزرو» می‌شود.
*/

function updateFinalStepButtons() {

    if (
        currentStep === 5
    ) {

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
/*======================================
    Part 5
    Step 5 + Final Validation
======================================*/


/*======================================
    Update Buttons
======================================*/

function updateFinalButtons() {

    /*
        مرحله ۵ = انتخاب ساعت
        در این مرحله دیگر دکمه
        «مرحله بعد» نداریم.
    */

    if (currentStep === 5) {

        nextBtn.style.display = "none";

        submitBtn.style.display = "flex";

    }

    else {

        nextBtn.style.display = "flex";

        submitBtn.style.display = "none";

    }


    /*
        مرحله اول دکمه قبلی ندارد.
    */

    if (currentStep === 1) {

        prevBtn.style.display = "none";

    }

    else {

        prevBtn.style.display = "flex";

    }

}


/*======================================
    Replace Button State
======================================*/

const originalShowStep =
    showStep;


/*
    هر بار که showStep اجرا شود،
    وضعیت دکمه‌ها هم بررسی می‌شود.
*/

showStep = function(stepNumber) {

    originalShowStep(stepNumber);

    updateFinalButtons();

};


/*======================================
    Final Reservation Validation
======================================*/

function validateFinalReservation() {

    /*
        اطلاعات مشتری
    */

    if (
        !reservationData.firstName ||
        !reservationData.lastName ||
        !reservationData.phone
    ) {

        alert(
            "اطلاعات مشتری کامل نیست."
        );

        showStep(1);

        return false;

    }


    /*
        آرایشگر
    */

    if (
        !reservationData.barberId ||
        !reservationData.barberName
    ) {

        alert(
            "لطفاً آرایشگر را انتخاب کنید."
        );

        showStep(2);

        return false;

    }


    /*
        خدمت
    */

    if (
        !reservationData.service
    ) {

        alert(
            "لطفاً خدمت مورد نظر را انتخاب کنید."
        );

        showStep(3);

        return false;

    }


    /*
        روز
    */

    if (
        !reservationData.date
    ) {

        alert(
            "لطفاً روز مورد نظر را انتخاب کنید."
        );

        showStep(4);

        return false;

    }


    /*
        ساعت
    */

    if (
        !reservationData.time
    ) {

        alert(
            "لطفاً ساعت مورد نظر را انتخاب کنید."
        );

        showStep(5);

        return false;

    }


    return true;

}


/*======================================
    Final Submit
======================================*/

reserveForm.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        /*
            بررسی کامل اطلاعات
        */

        const valid =
            validateFinalReservation();


        if (!valid) {

            return;

        }


        /*
            جلوگیری از چند بار کلیک
        */

        submitBtn.disabled = true;


        const oldText =
            submitBtn.innerHTML;


        submitBtn.innerHTML = `

            <i class="fa-solid fa-spinner fa-spin"></i>

            در حال ثبت رزرو...

        `;


        try {

            /*
                فعلاً فقط اطلاعات را
                در Console می‌بینیم.

                در قسمت بعدی اینجا
                ثبت واقعی Firebase
                قرار می‌گیرد.
            */

            console.log(
                "FINAL RESERVATION:",
                reservationData
            );


            /*
                موفقیت موقت
            */

            showSuccessPreview();


        }

        catch (error) {

            console.error(
                "Reservation error:",
                error
            );


            alert(
                "در ثبت رزرو مشکلی پیش آمد. لطفاً دوباره تلاش کنید."
            );

        }

        finally {

            submitBtn.disabled = false;

            submitBtn.innerHTML =
                oldText;

        }

    }
);


/*======================================
    Success Preview
======================================*/

function showSuccessPreview() {

    if (!successModal) {

        return;

    }


    successDetails.innerHTML = `

        <div>
            <strong>نام مشتری:</strong>
            ${escapeHTML(
                reservationData.firstName
            )}
            ${escapeHTML(
                reservationData.lastName
            )}
        </div>

        <div>
            <strong>شماره موبایل:</strong>
            ${escapeHTML(
                reservationData.phone
            )}
        </div>

        <div>
            <strong>آرایشگر:</strong>
            ${escapeHTML(
                reservationData.barberName
            )}
        </div>

        <div>
            <strong>خدمت:</strong>
            ${escapeHTML(
                reservationData.service
            )}
        </div>

        <div>
            <strong>مدت خدمت:</strong>
            ${reservationData.serviceDuration}
            دقیقه
        </div>

        <div>
            <strong>روز:</strong>
            ${escapeHTML(
                reservationData.displayDate
            )}
        </div>

        <div>
            <strong>ساعت:</strong>
            ${escapeHTML(
                reservationData.time
            )}
        </div>

    `;


    successModal.classList.add(
        "active"
    );


    document.body.style.overflow =
        "hidden";

}


/*======================================
    Escape HTML
======================================*/

function escapeHTML(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


/*======================================
    Start
======================================*/

updateFinalButtons();

console.log(
    "Final reservation validation ready."
);
