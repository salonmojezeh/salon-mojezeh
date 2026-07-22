import { db } from "./firebase.js";

import {

collection,
getDocs,
updateDoc,
doc

} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const tbody=document.getElementById("todayBookings");

const todayCount=document.getElementById("todayCount");

const monthCount=document.getElementById("monthCount");

const customerCount=document.getElementById("customerCount");

async function loadBookings(){

const snapshot=await getDocs(collection(db,"bookings"));

tbody.innerHTML="";

let today=0;

let month=0;

snapshot.forEach((booking)=>{

const data=booking.data();

const tr=document.createElement("tr");

tr.innerHTML=`

<td>${data.name}</td>

<td>${data.phone}</td>

<td>${data.date}</td>

<td>${data.time}</td>

<td>

<button class="done"

onclick="finishBooking('${booking.id}')">

انجام شد

</button>

</td>

`;

tbody.appendChild(tr);

today++;

month++;

});

todayCount.innerText=today;

monthCount.innerText=month;

customerCount.innerText=snapshot.size;

}

window.finishBooking=async(id)=>{

await updateDoc(doc(db,"bookings",id),{

status:"done"

});

alert("رزرو انجام شد");

loadBookings();

}

loadBookings();
