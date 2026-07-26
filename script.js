// ======================================================
// سالن معجزه
// Main Script
// Version 3.0
// ======================================================

"use strict";

// ======================
// عناصر اصلی
// ======================

const body = document.body;

const sidebar = document.getElementById("sidebar");
const overlay = document.getElementById("overlay");

const menuBtn = document.querySelector(".menu-btn");
const closeBtn = document.querySelector(".close-btn");

const backToTop = document.getElementById("backToTop");


// ======================
// شروع سایت
// ======================

window.addEventListener("load", () => {

    body.classList.add("loaded");

    window.scrollTo({
        top: 0,
        behavior: "instant"
    });

});


// ======================
// باز کردن منو
// ======================

function openSidebar() {

    if (!sidebar) return;

    sidebar.classList.add("active");
    overlay.classList.add("active");

    body.style.overflow = "hidden";

}


// ======================
// بستن منو
// ======================

function closeSidebar() {

    if (!sidebar) return;

    sidebar.classList.remove("active");
    overlay.classList.remove("active");

    body.style.overflow = "";

}


// ======================
// رویدادهای منو
// ======================

if (menuBtn) {

    menuBtn.addEventListener("click", openSidebar);

}

if (closeBtn) {

    closeBtn.addEventListener("click", closeSidebar);

}

if (overlay) {

    overlay.addEventListener("click", closeSidebar);

}


// ======================
// بستن منو بعد از کلیک روی لینک
// ======================

document.querySelectorAll(".nav-link").forEach(link => {

    link.addEventListener("click", () => {

        closeSidebar();

    });

});


// ======================
// اسکرول نرم
// ======================

document.querySelectorAll('a[href^="#"]').forEach(anchor => {

    anchor.addEventListener("click", function (e) {

        const target = document.querySelector(this.getAttribute("href"));

        if (!target) return;

        e.preventDefault();

        target.scrollIntoView({

            behavior: "smooth",
            block: "start"

        });

    });

});
// ======================================================
// دکمه بازگشت به بالا
// ======================================================

window.addEventListener("scroll", () => {

    if (!backToTop) return;

    if (window.scrollY > 500) {

        backToTop.classList.add("show");

    } else {

        backToTop.classList.remove("show");

    }

});

if (backToTop) {

    backToTop.addEventListener("click", () => {

        window.scrollTo({

            top: 0,
            behavior: "smooth"

        });

    });

}


// ======================================================
// انیمیشن ظاهر شدن بخش‌ها
// ======================================================

const observer = new IntersectionObserver((entries) => {

    entries.forEach(entry => {

        if (entry.isIntersecting) {

            entry.target.classList.add("show");

        }

    });

}, {

    threshold: 0.15

});

document.querySelectorAll(".fade-section").forEach(section => {

    observer.observe(section);

});


// ======================================================
// فعال شدن لینک منو هنگام اسکرول
// ======================================================

const sections = document.querySelectorAll("section[id]");

window.addEventListener("scroll", () => {

    let currentSection = "";

    sections.forEach(section => {

        const sectionTop = section.offsetTop - 120;

        if (window.scrollY >= sectionTop) {

            currentSection = section.getAttribute("id");

        }

    });

    document.querySelectorAll(".nav-link").forEach(link => {

        link.classList.remove("active");

        const href = link.getAttribute("href");

        if (href === "#" + currentSection) {

            link.classList.add("active");

        }

    });

});


// ======================================================
// آماده برای توسعه‌های بعدی
// ======================================================

const SalonMojezeh = {

    customer: null,

    reservation: null,

    settings: {},

    version: "3.0"

};

window.SalonMojezeh = SalonMojezeh;
// ======================================================
// مسیرهای سالن
// ======================================================

// آدرس‌ها را بعداً فقط اینجا تغییر می‌دهیم.
const SalonLinks = {

    googleMap: "#",

    neshan: "#",

    balad: "#",

    instagram: "#",

    phone: "tel:+989123456789"

};

window.SalonLinks = SalonLinks;


// ======================================================
// باز کردن لینک‌ها
// ======================================================

function openGoogleMap() {

    window.open(SalonLinks.googleMap, "_blank");

}

function openNeshan() {

    window.open(SalonLinks.neshan, "_blank");

}

function openBalad() {

    window.open(SalonLinks.balad, "_blank");

}

function openInstagram() {

    window.open(SalonLinks.instagram, "_blank");

}

function callSalon() {

    window.location.href = SalonLinks.phone;

}


// ======================================================
// آماده برای QR Code
// ======================================================

function openReservationPage() {

    window.location.href = "reserve.html";

}


// ======================================================
// ثبت Service Worker (PWA)
// ======================================================

if ("serviceWorker" in navigator) {

    window.addEventListener("load", () => {

        navigator.serviceWorker
            .register("./service-worker.js")
            .then(() => {

                console.log("Service Worker فعال شد.");

            })
            .catch(error => {

                console.log("خطا در Service Worker", error);

            });

    });

}


// ======================================================
// بررسی وضعیت اینترنت
// ======================================================

window.addEventListener("offline", () => {

    console.log("اینترنت قطع شد.");

});

window.addEventListener("online", () => {

    console.log("اینترنت وصل شد.");

});


// ======================================================
// پایان بارگذاری سایت
// ======================================================

document.addEventListener("DOMContentLoaded", () => {

    console.log("Salon Mojezeh Ready");

});
