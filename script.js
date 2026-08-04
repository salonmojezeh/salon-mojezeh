/*======================================
 Salon Mojezeh
 script.js
======================================*/

"use strict";

/*======================================
Elements
======================================*/

const body = document.body;

const sidebar = document.getElementById("sidebar");

const overlay = document.getElementById("overlay");

const menuBtn = document.getElementById("menuBtn");

const closeSidebar = document.getElementById("closeSidebar");

const themeToggle = document.getElementById("themeToggle");

const loader = document.getElementById("loader");

/*======================================
Loader
======================================*/

window.addEventListener("load", () => {

    setTimeout(() => {

        loader.style.opacity = "0";

        loader.style.pointerEvents = "none";

        setTimeout(() => {

            loader.remove();

        }, 500);

    }, 700);

});

/*======================================
Sidebar
======================================*/

function openSidebar() {

    sidebar.classList.add("active");

    overlay.classList.add("active");

    body.style.overflow = "hidden";

}

function hideSidebar() {

    sidebar.classList.remove("active");

    overlay.classList.remove("active");

    body.style.overflow = "";

}

menuBtn.addEventListener("click", openSidebar);

closeSidebar.addEventListener("click", hideSidebar);

overlay.addEventListener("click", hideSidebar);

/*======================================
Close Sidebar After Click Link
======================================*/

document.querySelectorAll("#sidebar a").forEach(link => {

    link.addEventListener("click", () => {

        hideSidebar();

    });

});
/*======================================
Theme (Dark / Light)
======================================*/

const savedTheme = localStorage.getItem("theme");

if (savedTheme === "dark") {

    body.classList.add("dark");

    themeToggle.innerHTML = '<i class="fa-solid fa-sun"></i>';

} else {

    body.classList.remove("dark");

    themeToggle.innerHTML = '<i class="fa-solid fa-moon"></i>';

}

themeToggle.addEventListener("click", () => {

    body.classList.toggle("dark");

    const darkMode = body.classList.contains("dark");

    if (darkMode) {

        localStorage.setItem("theme", "dark");

        themeToggle.innerHTML = '<i class="fa-solid fa-sun"></i>';

    } else {

        localStorage.setItem("theme", "light");

        themeToggle.innerHTML = '<i class="fa-solid fa-moon"></i>';

    }

});

/*======================================
Smooth Scroll
======================================*/

document.querySelectorAll('a[href^="#"]').forEach(link => {

    link.addEventListener("click", function (e) {

        const target = this.getAttribute("href");

        if (target === "#") return;

        const section = document.querySelector(target);

        if (!section) return;

        e.preventDefault();

        section.scrollIntoView({

            behavior: "smooth",

            block: "start"

        });

    });

});

/*======================================
Header Shadow
======================================*/

window.addEventListener("scroll", () => {

    const header = document.getElementById("header");

    if (window.scrollY > 40) {

        header.style.boxShadow = "0 8px 25px rgba(0,0,0,.12)";

    } else {

        header.style.boxShadow = "none";

    }

});
/*======================================
 Scroll Animation
======================================*/

const animatedItems = document.querySelectorAll(

`
.hero,
.quick-card,
.service-card,
.about-card,
.stat-card,
.club-preview,
.gallery-item,
.product-card,
.contact-card
`

);

const observer = new IntersectionObserver(

(entries)=>{

entries.forEach(entry=>{

if(entry.isIntersecting){

entry.target.style.opacity="1";

entry.target.style.transform="translateY(0)";

}

});

},

{

threshold:.15

}

);

animatedItems.forEach(item=>{

item.style.opacity="0";

item.style.transform="translateY(40px)";

item.style.transition="all .7s ease";

observer.observe(item);

});

/*======================================
 Google Map
======================================*/

const googleMapBtn=document.getElementById("googleMapBtn");
const googleMap=document.getElementById("googleMap");

const googleURL="https://maps.google.com/";

if(googleMapBtn){

googleMapBtn.addEventListener("click",(e)=>{

e.preventDefault();

window.open(googleURL,"_blank");

});

}

if(googleMap){

googleMap.addEventListener("click",(e)=>{

e.preventDefault();

window.open(googleURL,"_blank");

});

}

/*======================================
 Neshan
======================================*/

const neshanBtn=document.getElementById("neshanBtn");
const neshanMap=document.getElementById("neshanMap");

const neshanURL="https://neshan.org/maps";

if(neshanBtn){

neshanBtn.addEventListener("click",(e)=>{

e.preventDefault();

window.open(neshanURL,"_blank");

});

}

if(neshanMap){

neshanMap.addEventListener("click",(e)=>{

e.preventDefault();

window.open(neshanURL,"_blank");

});

}

/*======================================
 Balad
======================================*/

const baladBtn=document.getElementById("baladBtn");
const baladMap=document.getElementById("baladMap");

const baladURL="https://balad.ir/";

if(baladBtn){

baladBtn.addEventListener("click",(e)=>{

e.preventDefault();

window.open(baladURL,"_blank");

});

}

if(baladMap){

baladMap.addEventListener("click",(e)=>{

e.preventDefault();

window.open(baladURL,"_blank");

});

}
/*======================================
 Service Worker
======================================*/

if ("serviceWorker" in navigator) {

    window.addEventListener("load", () => {

        navigator.serviceWorker
            .register("service-worker.js")
            .then(() => {

                console.log("Service Worker Registered");

            })
            .catch((error) => {

                console.error(error);

            });

    });

}

/*======================================
 Active Menu
======================================*/

const currentPage = window.location.pathname.split("/").pop();

document.querySelectorAll("#sidebar a").forEach(link => {

    const href = link.getAttribute("href");

    if (href === currentPage) {

        link.classList.add("active");

    }

});

/*======================================
 Disable Empty Links
======================================*/

document.querySelectorAll('a[href="#"]').forEach(link => {

    link.addEventListener("click", e => {

        e.preventDefault();

    });

});

/*======================================
 Future Modules
======================================*/

// Firebase
// Club
// Reservation
// Gallery
// Products
// Admin
// Customer Profile
// Notifications

console.log("Salon Mojezeh Loaded Successfully");

/*======================================
 End Of File
======================================*/
