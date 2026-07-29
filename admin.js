// ==========================================
// پنل مدیریت سالن معجزه
// admin.js
// Version 3.0
// ==========================================



// ================= Firebase =================

import { db } from "./firebase.js";

import {

collection,

getDocs,

query,

orderBy,

doc,

updateDoc,

deleteDoc

} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";



// ================= عناصر صفحه =================

const reservationList =
document.getElementById("reservationList");

const customerDetails =
document.getElementById("customerDetails");

const historyList =
document.getElementById("historyList");



const todayReservations =
document.getElementById("todayReservations");

const tomorrowReservations =
document.getElementById("tomorrowReservations");

const monthReservations =
document.getElementById("monthReservations");

const totalCustomers =
document.getElementById("totalCustomers");

const giftCustomers =
document.getElementById("giftCustomers");

const todayBirthdays =
document.getElementById("todayBirthdays");

const tomorrowBirthdays =
document.getElementById("tomorrowBirthdays");



let reservations = [];

let selectedReservation = null;



// ================= تاریخ امروز =================

const todayElement =
document.getElementById("todayDate");

todayElement.innerHTML =
new Date().toLocaleDateString("fa-IR",{

weekday:"long",

year:"numeric",

month:"long",

day:"numeric"

});



// ================= وضعیت =================

const STATUS = {

WAIT:"در انتظار",

DONE:"انجام شد",

CANCEL:"لغو شده"

};
// ==========================================
// دریافت رزروها از Firebase
// ==========================================

async function loadReservations() {

    reservationList.innerHTML = "در حال بارگذاری...";

    reservations = [];

    try {

        const q = query(
            collection(db, "reservations"),
            orderBy("createdAt", "desc")
        );

        const snapshot = await getDocs(q);

        reservationList.innerHTML = "";

        snapshot.forEach((document) => {

            const data = document.data();

            reservations.push({
                id: document.id,
                ...data
            });

        });

        calculateDashboard();

        renderReservations();

    }

    catch (error) {

        console.error(error);

        reservationList.innerHTML =
            "خطا در دریافت اطلاعات";

    }

}



// ==========================================
// محاسبه آمار داشبورد
// ==========================================

function calculateDashboard() {

    const today =
        new Date().toISOString().split("T")[0];

    const tomorrowDate = new Date();

    tomorrowDate.setDate(
        tomorrowDate.getDate() + 1
    );

    const tomorrow =
        tomorrowDate.toISOString().split("T")[0];



    let todayCount = 0;

    let tomorrowCount = 0;

    let monthCount = reservations.length;



    reservations.forEach(item => {

        if (item.date === today)
            todayCount++;

        if (item.date === tomorrow)
            tomorrowCount++;

    });



    todayReservations.innerText =
        todayCount;

    tomorrowReservations.innerText =
        tomorrowCount;

    monthReservations.innerText =
        monthCount;



    // فعلاً مقدار آزمایشی
    totalCustomers.innerText =
        reservations.length;

    giftCustomers.innerText = 0;

    todayBirthdays.innerText = 0;

    tomorrowBirthdays.innerText = 0;

}



// ==========================================
// نمایش رزروها
// ==========================================

function renderReservations() {

    reservationList.innerHTML = "";

    reservations.forEach(item => {

        const card =
            document.createElement("div");

        card.className =
            "reservation-item";



        let statusClass =
            "status-wait";

        if (item.status === STATUS.DONE)
            statusClass = "status-done";

        if (item.status === STATUS.CANCEL)
            statusClass = "status-cancel";



        card.innerHTML = `

            <div class="reservation-info">

                <h3>

                    ${item.firstName}
                    ${item.lastName}

                </h3>

                <p>

                    📞 ${item.phone}

                </p>

                <p>

                    ✂ ${item.service}

                </p>

                <p>

                    📅 ${item.date}

                </p>

                <p>

                    🕒 ${item.time}

                </p>

            </div>

            <div>

                <span class="reservation-status ${statusClass}">

                    ${item.status}

                </span>

            </div>

        `;



        card.onclick = () => {

            selectedReservation = item;

            showCustomer(item);

        };



        reservationList.appendChild(card);

    });

}
// ==========================================
// نمایش اطلاعات کامل مشتری
// ==========================================

function showCustomer(customer) {

    customerDetails.innerHTML = `

    <div class="customer-profile">

        <div class="profile-item">
            <h4>نام و نام خانوادگی</h4>
            <p>${customer.firstName} ${customer.lastName}</p>
        </div>

        <div class="profile-item">
            <h4>شماره موبایل</h4>
            <p>${customer.phone}</p>
        </div>

        <div class="profile-item">
            <h4>آخرین مراجعه</h4>
            <p>${customer.date}</p>
        </div>

        <div class="profile-item">
            <h4>ساعت</h4>
            <p>${customer.time}</p>
        </div>

        <div class="profile-item">
            <h4>خدمت</h4>
            <p>${customer.service}</p>
        </div>

        <div class="profile-item">
            <h4>وضعیت</h4>
            <p>${customer.status}</p>
        </div>

        <div class="profile-item">
            <h4>تعداد مراجعات</h4>
            <p>${customer.visitCount || 1}</p>
        </div>

        <div class="profile-item">
            <h4>هدیه رایگان</h4>
            <p>${customer.freeGift ? "🎁 آماده" : "❌ ندارد"}</p>
        </div>

        <div class="profile-item">
            <h4>تاریخ تولد</h4>
            <p>${customer.birthDate || "ثبت نشده"}</p>
        </div>

        <div class="profile-item">
            <h4>مدل موی همیشگی</h4>
            <p>${customer.favoriteModel || "ثبت نشده"}</p>
        </div>

        <div class="profile-item">
            <h4>یادداشت آرایشگر</h4>
            <p>${customer.note || "-"}</p>
        </div>

    </div>

    `;

    historyList.innerHTML = `

        <div class="history-item">

            <h4>${customer.date}</h4>

            <p>

                ${customer.service}

                |

                ${customer.time}

            </p>

        </div>

    `;

}



// ==========================================
// انجام شدن رزرو
// ==========================================

document
.getElementById("btnDone")
.onclick = async () => {

    if(!selectedReservation){

        alert("ابتدا یک رزرو را انتخاب کنید.");

        return;

    }

    await updateDoc(

        doc(
            db,
            "reservations",
            selectedReservation.id
        ),

        {
            status:STATUS.DONE
        }

    );

    loadReservations();

};



// ==========================================
// حذف رزرو
// ==========================================

document
.getElementById("btnDelete")
.onclick = async ()=>{

    if(!selectedReservation){

        alert("ابتدا یک رزرو را انتخاب کنید.");

        return;

    }

    if(!confirm("رزرو حذف شود؟"))

        return;

    await deleteDoc(

        doc(
            db,
            "reservations",
            selectedReservation.id
        )

    );

    customerDetails.innerHTML="";

    historyList.innerHTML="";

    loadReservations();

};



// ==========================================
// ثبت هدیه
// ==========================================

document
.getElementById("btnGift")
.onclick=()=>{

    if(!selectedReservation){

        alert("ابتدا مشتری را انتخاب کنید.");

        return;

    }

    alert(
        "در نسخه بعدی باشگاه مشتریان فعال خواهد شد."
    );

};



// ==========================================
// ویرایش رزرو
// ==========================================

document
.getElementById("btnEdit")
.onclick=()=>{

    if(!selectedReservation){

        alert("ابتدا یک رزرو را انتخاب کنید.");

        return;

    }

    alert(
        "بخش ویرایش در نسخه بعدی فعال می‌شود."
    );

};



// ==========================================
// شروع برنامه
// ==========================================

loadReservations();
