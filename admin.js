import { db } from "./firebase.js";

import {
    collection,
    getDocs,
    query,
    orderBy,
    doc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const bookingList = document.getElementById("bookingList");

const todayBookings = document.getElementById("todayBookings");
const monthBookings = document.getElementById("monthBookings");
const customers = document.getElementById("customers");

async function loadDashboard() {

    bookingList.innerHTML = "در حال بارگذاری...";

    const q = query(
        collection(db, "reservations"),
        orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(q);

    bookingList.innerHTML = "";

    let todayCount = 0;
    let monthCount = 0;

    const phones = new Set();

    const today = new Date();

    snapshot.forEach((item) => {

        const data = item.data();

        // ثبت شماره مشتری
        if (data.phone) {
            phones.add(data.phone);
        }

        // شمارش رزروها
        if (data.date) {

            const reserveDate = new Date(data.date);

            if (reserveDate.toDateString() === today.toDateString()) {
                todayCount++;
            }

            const diff =
                (today - reserveDate) /
                (1000 * 60 * 60 * 24);

            if (diff <= 30 && diff >= 0) {
                monthCount++;
            }
        }

        const card = document.createElement("div");
        card.className = "booking-card";

        card.innerHTML = `

<h3>${data.firstName} ${data.lastName}</h3>

<p>📞 ${data.phone}</p>

<p>💇 ${data.service}</p>

<p>📅 ${data.date}</p>

<p>🕒 ${data.time}</p>

<p>
وضعیت :
<b>${data.status || "در انتظار"}</b>
</p>

<button class="doneBtn">
انجام شد
</button>

<hr>

`;

        bookingList.appendChild(card);

        card.querySelector(".doneBtn").onclick = async () => {

            await updateDoc(
                doc(db, "reservations", item.id),
                {
                    status: "انجام شد"
                }
            );

            loadDashboard();

        };

    });

    todayBookings.innerText = todayCount;

    monthBookings.innerText = monthCount;

    customers.innerText = phones.size;

}

loadDashboard();
