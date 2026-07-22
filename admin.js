import { db } from "./firebase.js";

import {
collection,
getDocs,
doc,
updateDoc,
query,
orderBy
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const reservationList = document.getElementById("reservationList");
const totalReservations = document.getElementById("totalReservations");
const todayReservations = document.getElementById("todayReservations");
const monthReservations = document.getElementById("monthReservations");

async function loadReservations() {

reservationList.innerHTML = "";

const q = query(
collection(db, "reservations"),
orderBy("createdAt", "desc")
);

const snapshot = await getDocs(q);

let total = 0;
let today = 0;
let month = 0;

const now = new Date();

snapshot.forEach(async (item) => {

const data = item.data();

total++;

if (data.date) {

const reserveDate = new Date(data.date);

if (
reserveDate.toDateString() === now.toDateString()
) {
today++;
}

if (
reserveDate.getMonth() === now.getMonth() &&
reserveDate.getFullYear() === now.getFullYear()
) {
month++;
}

}

const card = document.createElement("div");

card.className = "card";

card.innerHTML = `
<h3>${data.name}</h3>

<p>📞 ${data.phone}</p>

<p>📅 ${data.date}</p>

<p>🕒 ${data.time}</p>

<p>💇 ${data.service}</p>

<p>
وضعیت:
<b>${data.status || "در انتظار"}</b>
</p>

<button class="done">
انجام شد
</button>

<hr>
`;

reservationList.appendChild(card);

card.querySelector(".done").onclick = async () => {

await updateDoc(doc(db,"reservations",item.id),{

status:"انجام شد"

});

loadReservations();

};

});

totalReservations.innerText = total;

todayReservations.innerText = today;

monthReservations.innerText = month;

}

loadReservations();
