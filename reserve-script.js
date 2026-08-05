// ======================================================
// سالن معجزه - Reserve Script (Part 1)
// ======================================================

import { db } from "./firebase.js";

import {
collection,
addDoc,
serverTimestamp,
query,
where,
getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// ==================== متغیرها ====================

let currentStep = 1;
const totalSteps = 4;

let reserveData = {
firstName: "",
lastName: "",
phone: "",
birthday: "",
service: "",
date: "",
time: ""
};


// ==================== تغییر مرحله ====================

function updateStep(step){

document.querySelectorAll(".steps").forEach(stepBox=>{
stepBox.classList.remove("active");
});

document.getElementById(`step${step}`).classList.add("active");

const percent=(step/totalSteps)*100;

document.getElementById("progressFill").style.width=percent+"%";

document.getElementById("prevBtn").disabled=(step===1);

document.getElementById("nextBtn").style.display=
step===totalSteps?"none":"flex";

document.getElementById("submitBtn").style.display=
step===totalSteps?"block":"none";

window.scrollTo({
top:0,
behavior:"smooth"
});

}


// ==================== مرحله بعد ====================

async function nextStep(){

if(!validateStep(currentStep)){
return;
}

saveStepData(currentStep);

if(currentStep===3){

await generateTimes();

}

if(currentStep<totalSteps){

currentStep++;

updateStep(currentStep);

}

}


// ==================== مرحله قبل ====================

function prevStep(){

if(currentStep>1){

currentStep--;

updateStep(currentStep);

}

}


// ==================== اعتبارسنجی ====================

function validateStep(step){

switch(step){

case 1:

const firstName=document.getElementById("firstName").value.trim();

const lastName=document.getElementById("lastName").value.trim();

const phone=document.getElementById("phone").value.trim();

const birthday=document.getElementById("birthday").value;

if(firstName===""){
alert("نام را وارد کنید");
return false;
}

if(lastName===""){
alert("نام خانوادگی را وارد کنید");
return false;
}

if(!/^09\d{9}$/.test(phone)){
alert("شماره موبایل صحیح نیست");
return false;
}

reserveData.birthday=birthday;

return true;


case 2:

if(!document.querySelector('input[name="service"]:checked')){
alert("یک خدمت انتخاب کنید");
return false;
}

return true;


case 3:

if(!document.querySelector('input[name="date"]:checked')){
alert("یک روز انتخاب کنید");
return false;
}

return true;


case 4:

if(!document.querySelector('input[name="time"]:checked')){
alert("یک ساعت انتخاب کنید");
return false;
}

return true;

}

return true;

}


// ==================== ذخیره اطلاعات ====================

function saveStepData(step){

switch(step){

case 1:

reserveData.firstName=document.getElementById("firstName").value;

reserveData.lastName=document.getElementById("lastName").value;

reserveData.phone=document.getElementById("phone").value;

reserveData.birthday=document.getElementById("birthday").value;

break;


case 2:

reserveData.service=document.querySelector('input[name="service"]:checked').value;

break;


case 3:

reserveData.date=document.querySelector('input[name="date"]:checked').value;

break;


case 4:

reserveData.time=document.querySelector('input[name="time"]:checked').value;

break;

}

}// ==================== ساخت تقویم ====================

function generateCalendar() {

const calendar = document.getElementById("calendar");

calendar.innerHTML = "";

const today = new Date();

for(let i=0;i<30;i++){

const date=new Date();

date.setDate(today.getDate()+i);

const value=date.toISOString().split("T")[0];

const week=["یکشنبه","دوشنبه","سه شنبه","چهارشنبه","پنجشنبه","جمعه","شنبه"];

const item=document.createElement("label");

item.className="day-option";

item.innerHTML=`

<input type="radio" name="date" value="${value}">

<span>

${week[date.getDay()]}<br>

${date.getDate()}

</span>

`;

item.onclick=()=>{

document.querySelectorAll(".day-option").forEach(x=>x.classList.remove("selected"));

item.classList.add("selected");

};

calendar.appendChild(item);

}

}



// ==================== تولید ساعت ها ====================

async function generateTimes(){

const grid=document.getElementById("timesGrid");

grid.innerHTML="";

const selected=document.querySelector('input[name="date"]:checked');

if(!selected){

return;

}

const selectedDate=selected.value;


// گرفتن رزروهای همان روز

const q=query(

collection(db,"reservations"),

where("date","==",selectedDate)

);

const snapshot=await getDocs(q);

const booked=[];

snapshot.forEach(doc=>{

booked.push(doc.data().time);

});


// ساعت های کاری

const hours=[

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

hours.forEach(time=>{

const busy=booked.includes(time);

const label=document.createElement("label");

label.className="time-option";

if(busy){

label.classList.add("booked");

}

label.innerHTML=`

<input

type="radio"

name="time"

value="${time}"

${busy?"disabled":""}

>

<span>${time}</span>

`;

if(!busy){

label.onclick=()=>{

document.querySelectorAll(".time-option").forEach(x=>x.classList.remove("selected"));

label.classList.add("selected");

};

}

grid.appendChild(label);

});

}



// ==================== ثبت رزرو ====================

async function submitReserve(e){

e.preventDefault();

if(!validateStep(4)){

return;

}

saveStepData(4);


// جلوگیری از ثبت رزرو تکراری

const check=query(

collection(db,"reservations"),

where("date","==",reserveData.date),

where("time","==",reserveData.time)

);

const exist=await getDocs(check);

if(!exist.empty){

alert("این ساعت قبلاً رزرو شده است.");

return;

}
await addDoc(collection(db,"reservations"),{

firstName:reserveData.firstName,

lastName:reserveData.lastName,

phone:reserveData.phone,

birthday:reserveData.birthday,

service:reserveData.service,

date:reserveData.date,

time:reserveData.time,

status:"pending",

createdAt:serverTimestamp()

});


showSuccessMessage();

}



// ==================== پیام موفقیت ====================

function showSuccessMessage(){

const details=document.getElementById("successDetails");

details.innerHTML=`

<b>نام:</b>

${reserveData.firstName} ${reserveData.lastName}

<br><br>

<b>شماره موبایل:</b>

${reserveData.phone}

<br><br>

<b>خدمت:</b>

${reserveData.service}

<br><br>

<b>روز:</b>

${reserveData.date}

<br><br>

<b>ساعت:</b>

${reserveData.time}

`;

document.getElementById("successModal").classList.add("show");

}



// ==================== دکمه ها ====================

function goHome(){

location.href="index.html";

}

function contactSalon(){

location.href="tel:09xxxxxxxxx";

}



// ==================== منوی کناری ====================

function openSidebar(){

document.getElementById("sidebar").classList.add("active");

document.getElementById("overlay").classList.add("active");

document.body.style.overflow="hidden";

}

function closeSidebar(){

document.getElementById("sidebar").classList.remove("active");

document.getElementById("overlay").classList.remove("active");

document.body.style.overflow="auto";

}



// ==================== شروع برنامه ====================

document.addEventListener("DOMContentLoaded",()=>{

generateCalendar();

generateTimes();

updateStep(1);

document.getElementById("reserveForm").addEventListener("submit",submitReserve);

document.querySelectorAll(".service-option").forEach(item=>{

item.onclick=()=>{

document.querySelectorAll(".service-option").forEach(x=>x.classList.remove("selected"));

item.classList.add("selected");

item.querySelector("input").checked=true;

};

});

});



// ==================== برای استفاده در HTML ====================

window.nextStep=nextStep;

window.prevStep=prevStep;

window.openSidebar=openSidebar;

window.closeSidebar=closeSidebar;

window.goHome=goHome;

window.contactSalon=contactSalon;
