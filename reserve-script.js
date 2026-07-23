// ==========================================
// سالن معجزه
// نسخه 2.0
// برنامه نویس: ChatGPT
// ==========================================


// ================= Firebase =================

import { db } from "./firebase.js";

import {
    collection,
    addDoc,
    getDocs,
    query,
    where,
    Timestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";



// ================= متغیرهای اصلی =================

let currentStep = 1;

const totalSteps = 4;

const reserveData = {

    firstName: "",

    lastName: "",

    phone: "",

    service: "",

    date: "",

    time: "",

    status: "pending",

    customerId: "",

    createdAt: null

};



// ================= شروع برنامه =================

document.addEventListener("DOMContentLoaded", () => {

    generateCalendar();

    generateTimes();

    updateStep(1);

    setupServiceSelection();

    setupButtons();

});



// ================= دکمه ها =================

function setupButtons() {

    document
        .getElementById("nextBtn")
        .addEventListener("click", nextStep);

    document
        .getElementById("prevBtn")
        .addEventListener("click", prevStep);

    document
        .getElementById("reserveForm")
        .addEventListener("submit", submitReserve);

}



// ================= مراحل =================

function updateStep(step) {

    document.querySelectorAll(".steps").forEach(item => {

        item.classList.remove("active");

    });

    document
        .getElementById("step" + step)
        .classList.add("active");



    const percent = (step / totalSteps) * 100;

    document
        .getElementById("progressFill")
        .style.width = percent + "%";



    document
        .getElementById("prevBtn")
        .disabled = step === 1;



    if (step === totalSteps) {

        document.getElementById("nextBtn").style.display = "none";

        document.getElementById("submitBtn").style.display = "block";

    } else {

        document.getElementById("nextBtn").style.display = "flex";

        document.getElementById("submitBtn").style.display = "none";

    }



    window.scrollTo({

        top: 0,

        behavior: "smooth"

    });

}



// ================= مرحله بعد =================

function nextStep() {

    if (!validateStep(currentStep)) return;

    saveStepData(currentStep);

    currentStep++;

    updateStep(currentStep);

}



// ================= مرحله قبل =================

function prevStep() {

    if (currentStep === 1) return;

    currentStep--;

    updateStep(currentStep);

}



// ================= اعتبارسنجی =================

function validateStep(step) {

    switch (step) {

        case 1:

            const firstName = document
                .getElementById("firstName")
                .value
                .trim();

            const lastName = document
                .getElementById("lastName")
                .value
                .trim();

            const phone = document
                .getElementById("phone")
                .value
                .trim();



            if (firstName.length < 2) {

                alert("نام را وارد کنید.");

                return false;

            }



            if (lastName.length < 2) {

                alert("نام خانوادگی را وارد کنید.");

                return false;

            }



            if (!/^09\d{9}$/.test(phone)) {

                alert("شماره موبایل صحیح نیست.");

                return false;

            }



            return true;



        case 2:

            if (!document.querySelector('input[name="service"]:checked')) {

                alert("لطفاً خدمت را انتخاب کنید.");

                return false;

            }

            return true;



        case 3:

            if (!document.querySelector('input[name="date"]:checked')) {

                alert("لطفاً روز را انتخاب کنید.");

                return false;

            }

            return true;



        case 4:

            if (!document.querySelector('input[name="time"]:checked')) {

                alert("لطفاً ساعت را انتخاب کنید.");

                return false;

            }

            return true;

    }

    return true;

}// ===============================
// ساخت روزهای ۳۰ روز آینده
// ===============================

async function loadDays() {

    const calendar = document.getElementById("calendar");
    calendar.innerHTML = "";

    const today = new Date();

    for (let i = 0; i < 30; i++) {

        const date = new Date();
        date.setDate(today.getDate() + i);

        const value = date.toISOString().split("T")[0];

        const btn = document.createElement("button");

        btn.className = "dayBtn";

        btn.innerText =
            date.toLocaleDateString("fa-IR", {
                weekday: "long",
                day: "numeric",
                month: "long"
            });

        btn.onclick = () => {

            document.querySelectorAll(".dayBtn")
                .forEach(x => x.classList.remove("selected"));

            btn.classList.add("selected");

            reserve.date = value;

            loadTimes(value);

        };

        calendar.appendChild(btn);

    }

}






// ===============================
// خواندن ساعت‌های بسته
// ===============================

async function loadTimes(selectedDate) {

    const grid = document.getElementById("timesGrid");

    grid.innerHTML = "";

    const hours = [
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

    // خواندن ساعت‌های بسته از Firebase

    const snapshot = await getDocs(collection(db, "closedTimes"));

    let closed = [];

    snapshot.forEach(doc => {

        const data = doc.data();

        if (data.date == selectedDate) {

            closed.push(data.time);

        }

    });

    // خواندن رزروهای ثبت شده

    const reserveSnap = await getDocs(collection(db, "reservations"));

    let booked = [];

    reserveSnap.forEach(doc => {

        const data = doc.data();

        if (data.date == selectedDate) {

            booked.push(data.time);

        }

    });

    hours.forEach(hour => {

        const btn = document.createElement("button");

        btn.innerText = hour;

        if (closed.includes(hour) || booked.includes(hour)) {

            btn.disabled = true;

            btn.className = "timeClosed";

        } else {

            btn.className = "timeOpen";

            btn.onclick = () => {

                document.querySelectorAll(".timeOpen")
                    .forEach(x => x.classList.remove("selected"));

                btn.classList.add("selected");

                reserve.time = hour;

            };

        }

        grid.appendChild(btn);

    });

}// ===============================
// ثبت رزرو در Firebase
// ===============================

async function submitReserve(event) {

    event.preventDefault();

    // بررسی انتخاب ساعت
    if (!reserve.time) {
        alert("لطفاً ساعت رزرو را انتخاب کنید.");
        return;
    }

    try {

        // ثبت رزرو
        await addDoc(collection(db, "reservations"), {

            firstName: reserve.firstName,

            lastName: reserve.lastName,

            phone: reserve.phone,

            service: reserve.service,

            date: reserve.date,

            time: reserve.time,

            status: "pending",

            createdAt: serverTimestamp()

        });


        // بررسی وجود مشتری

        const customerQuery = query(
            collection(db, "customers"),
            where("phone", "==", reserve.phone)
        );

        const customerSnapshot = await getDocs(customerQuery);


        // اگر مشتری وجود نداشت

        if (customerSnapshot.empty) {

            await addDoc(collection(db, "customers"), {

                firstName: reserve.firstName,

                lastName: reserve.lastName,

                phone: reserve.phone,

                birthday: "",

                visits: 0,

                freeHaircut: false,

                favoriteStyle: "",

                createdAt: serverTimestamp()

            });

        }


        // نمایش پنجره موفقیت

        const successDetails = document.getElementById("successDetails");

        if (successDetails) {

            successDetails.innerHTML = `
                <strong>نام:</strong> ${reserve.firstName} ${reserve.lastName}<br>
                <strong>خدمت:</strong> ${reserve.service}<br>
                <strong>تاریخ:</strong> ${reserve.date}<br>
                <strong>ساعت:</strong> ${reserve.time}
            `;

        }

        document
            .getElementById("successModal")
            .classList.add("show");

    }

    catch (error) {

        console.error(error);

        alert("ثبت رزرو با خطا مواجه شد.");

    }

}



// ===============================
// بازگشت به صفحه اصلی
// ===============================

function goHome() {

    window.location.href = "index.html";

}



// ===============================
// تماس با سالن
// ===============================

function contactSalon() {

    window.location.href = "tel:+989123456789";

}// ===============================
// راه‌اندازی اولیه صفحه
// ===============================

document.addEventListener("DOMContentLoaded", async () => {

    // ساخت روزهای ۳۰ روز آینده
    await loadDays();

    // دکمه مرحله بعد
    const nextBtn = document.getElementById("nextBtn");

    if (nextBtn) {
        nextBtn.addEventListener("click", nextStep);
    }

    // دکمه مرحله قبل
    const prevBtn = document.getElementById("prevBtn");

    if (prevBtn) {
        prevBtn.addEventListener("click", prevStep);
    }

    // فرم رزرو
    const reserveForm = document.getElementById("reserveForm");

    if (reserveForm) {
        reserveForm.addEventListener("submit", submitReserve);
    }

    // مرحله اول
    updateStep(1);

});



// ===============================
// منوی کناری
// ===============================

function openSidebar() {

    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("overlay");

    if (sidebar) sidebar.classList.add("active");

    if (overlay) overlay.classList.add("active");

    document.body.style.overflow = "hidden";

}



function closeSidebar() {

    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("overlay");

    if (sidebar) sidebar.classList.remove("active");

    if (overlay) overlay.classList.remove("active");

    document.body.style.overflow = "auto";

}



// ===============================
// بستن منو با کلیک روی لینک‌ها
// ===============================

document.querySelectorAll(".nav-link").forEach(link => {

    link.addEventListener("click", () => {

        closeSidebar();

    });

});



// ===============================
// بستن پنجره موفقیت
// ===============================

function closeSuccessModal() {

    document
        .getElementById("successModal")
        .classList.remove("show");

}



// ===============================
// شروع رزرو جدید
// ===============================

function newReservation() {

    window.location.reload();

}
