/*======================================
    Salon Mojezeh
    data/config.js
    Reservation Configuration
======================================*/

"use strict";


const RESERVATION_CONFIG = {

    /*==================================
        ساعت کاری سالن
    ==================================*/

    workingHours: {

        /*
        شروع فعالیت سالن
        */

        start: "10:00",

        /*
        پایان فعالیت سالن
        */

        end: "22:00",

        /*
        آخرین ساعت قابل رزرو
        */

        lastBookingTime: "21:00",

        /*
        فاصله بین نوبت‌ها

        فعلاً طبق درخواست شما:
        هر ۱ ساعت یک نوبت
        */

        interval: 60

    },


    /*==================================
        تقویم
    ==================================*/

    calendar: {

        /*
        تعداد روزهایی که نمایش داده می‌شود
        */

        daysToShow: 30

    },


    /*==================================
        خدمات سالن
    ==================================*/

    services: [

        {
            id: "haircut",

            name: "اصلاح سر و صورت",

            duration: 60,

            image: "images/services/haircut.jpg"
        },


        {
            id: "style",

            name: "حالت مو",

            duration: 30,

            image: "images/services/style.jpg"
        },


        {
            id: "line",

            name: "خط و سایه",

            duration: 30,

            image: "images/services/line.jpg"
        },


        {
            id: "beard",

            name: "سایه ریش",

            duration: 30,

            image: "images/services/beard.jpg"
        }

    ],


    /*==================================
        تنظیمات رزرو
    ==================================*/

    booking: {

        /*
        چند روز آینده قابل رزرو باشد
        */

        futureDays: 30,


        /*
        جلوگیری از رزرو یک ساعت تکراری
        */

        preventDuplicate: true,


        /*
        بررسی ساعت‌های رزرو شده
        از Firestore
        */

        checkFirebase: true,


        /*
        نام مجموعه رزروها در Firestore

        این نام باید با reserve-script.js
        و بعداً admin.js یکسان باشد.
        */

        collection: "reservations"

    },


    /*==================================
        اطلاعات سالن
    ==================================*/

    salon: {

        name: "سالن معجزه",

        phone: "09380449987"

    }

};


/*======================================
    Export
======================================*/

export { RESERVATION_CONFIG };

export default RESERVATION_CONFIG;
