// ==========================================
// Salon Mojezeh
// firebase.js
// FINAL FIREBASE / FIRESTORE
// ==========================================

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
    getFirestore,
    collection,
    doc,
    query,
    where,
    getDocs,
    getDoc,
    runTransaction,
    setDoc,
    updateDoc,
    increment,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// ==========================================
// Firebase Configuration
// ==========================================

const firebaseConfig = {

    apiKey:
        "AIzaSyCeDSU7d3JyNgny0MWjEpYYY4QrMTMDngs",

    authDomain:
        "salon-mojezeh.firebaseapp.com",

    projectId:
        "salon-mojezeh",

    storageBucket:
        "salon-mojezeh.firebasestorage.app",

    messagingSenderId:
        "1023073696440",

    appId:
        "1:1023073696440:web:98f95b75e36408d990124d"

};


// ==========================================
// Initialize Firebase
// ==========================================

const app =
    initializeApp(firebaseConfig);


// ==========================================
// Firestore
// ==========================================

const db =
    getFirestore(app);


// ==========================================
// Collections
// ==========================================

const reservationsRef =
    collection(
        db,
        "reservations"
    );


const customersRef =
    collection(
        db,
        "customers"
    );


const barbersRef =
    collection(
        db,
        "barbers"
    );


// ==========================================
// Default Barbers
// ==========================================

const defaultBarbers = {

    artin: {

        id: "artin",

        name: "آرتین",

        role: "آرایشگر",

        active: true

    },

    barber2: {

        id: "barber2",

        name: "آرایشگر دوم",

        role: "آرایشگر",

        active: true

    }

};


// ==========================================
// Default Services
// ==========================================

const services = {

    haircut: {

        id: "haircut",

        name: "اصلاح سر و صورت",

        duration: 60

    },

    style: {

        id: "style",

        name: "حالت مو",

        duration: 30

    },

    line: {

        id: "line",

        name: "خط و سایه",

        duration: 30

    },

    beard: {

        id: "beard",

        name: "سایه ریش",

        duration: 30

    }

};


// ==========================================
// Working Hours
// ==========================================

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


// ==========================================
// Create Reservation Key
// ==========================================

function createReservationKey(
    barberId,
    date,
    time
) {

    return `${barberId}_${date}_${time}`;

}


// ==========================================
// Get Booked Times
// بدون نیاز به Composite Index
// ==========================================

async function loadBookedTimes(
    barberId,
    date
) {

    const reservationsQuery =
        query(

            reservationsRef,

            where(
                "barberId",
                "==",
                barberId
            ),

            where(
                "date",
                "==",
                date
            )

        );


    const snapshot =
        await getDocs(
            reservationsQuery
        );


    const bookedTimes = [];


    snapshot.forEach(
        reservation => {

            const data =
                reservation.data();


            if (
                data.status === "reserved" &&
                data.time &&
                !bookedTimes.includes(
                    data.time
                )
            ) {

                bookedTimes.push(
                    data.time
                );

            }

        }
    );


    return bookedTimes;

}


// ==========================================
// ADD RESERVATION
// ==========================================

async function addReservation(
    reservationData
) {

    /*
        شناسه ثابت برای هر:
        آرایشگر + روز + ساعت

        مثال:

        artin_2026-08-11_15:00

        این باعث می‌شود یک ساعت مشخص
        برای یک آرایشگر دوبار ثبت نشود.
    */

    const reservationKey =
        createReservationKey(

            reservationData.barberId,

            reservationData.date,

            reservationData.time

        );


    const reservationDocument =
        doc(
            db,
            "reservations",
            reservationKey
        );


    /*
        Transaction

        اگر دو نفر همزمان بخواهند
        یک ساعت را رزرو کنند،
        فقط اولین درخواست قبول می‌شود.
    */

    const result =
        await runTransaction(
            db,
            async transaction => {

                const existing =
                    await transaction.get(
                        reservationDocument
                    );


                if (existing.exists()) {

                    const error =
                        new Error(
                            "این ساعت قبلاً رزرو شده است."
                        );


                    error.code =
                        "already-exists";


                    throw error;

                }


                const reservation = {

                    /*
                        Customer
                    */

                    firstName:
                        reservationData.firstName,

                    lastName:
                        reservationData.lastName,

                    phone:
                        reservationData.phone,


                    /*
                        Barber
                    */

                    barberId:
                        reservationData.barberId,

                    barberName:
                        reservationData.barberName,


                    /*
                        Service
                    */

                    service:
                        reservationData.service,

                    serviceDuration:
                        Number(
                            reservationData.serviceDuration
                        ),


                    /*
                        Date
                    */

                    date:
                        reservationData.date,

                    displayDate:
                        reservationData.displayDate,


                    /*
                        Time
                    */

                    time:
                        reservationData.time,


                    /*
                        Status
                    */

                    status:
                        "reserved",


                    /*
                        Source
                    */

                    source:
                        "website",


                    /*
                        Created
                    */

                    createdAt:
                        serverTimestamp()

                };


                transaction.set(
                    reservationDocument,
                    reservation
                );


                return reservationKey;

            }
        );


    return result;

}


// ==========================================
// SAVE / UPDATE CUSTOMER
// ==========================================

async function saveCustomer(
    reservationData
) {

    /*
        شماره موبایل را به عنوان
        شناسه پایدار مشتری استفاده می‌کنیم.

        مثال:

        customers/09380449987
    */

    const customerDocument =
        doc(
            db,
            "customers",
            reservationData.phone
        );


    const existing =
        await getDoc(
            customerDocument
        );


    /*
        مشتری جدید
    */

    if (!existing.exists()) {

        const customer = {

            firstName:
                reservationData.firstName,

            lastName:
                reservationData.lastName,

            phone:
                reservationData.phone,

            visitCount:
                1,

            createdAt:
                serverTimestamp(),

            lastVisit:
                reservationData.date,

            lastBarberId:
                reservationData.barberId,

            lastBarberName:
                reservationData.barberName,

            lastService:
                reservationData.service,

            favoriteModel:
                "",

            freeGift:
                false,

            note:
                ""

        };


        await setDoc(
            customerDocument,
            customer
        );


        return reservationData.phone;

    }


    /*
        مشتری قبلاً وجود دارد.
        فقط اطلاعات آخرین مراجعه
        به‌روزرسانی می‌شود.
    */

    await updateDoc(
        customerDocument,
        {

            firstName:
                reservationData.firstName,

            lastName:
                reservationData.lastName,

            lastVisit:
                reservationData.date,

            lastBarberId:
                reservationData.barberId,

            lastBarberName:
                reservationData.barberName,

            lastService:
                reservationData.service,

            visitCount:
                increment(1)

        }
    );


    return reservationData.phone;

}


// ==========================================
// Get Reservations For Barber
// ==========================================

async function getBarberReservations(
    barberId,
    startDate,
    endDate
) {

    const reservationsQuery =
        query(

            reservationsRef,

            where(
                "barberId",
                "==",
                barberId
            ),

            where(
                "date",
                ">=",
                startDate
            ),

            where(
                "date",
                "<=",
                endDate
            )

        );


    const snapshot =
        await getDocs(
            reservationsQuery
        );


    const reservations = [];


    snapshot.forEach(
        reservation => {

            reservations.push({

                id:
                    reservation.id,

                ...reservation.data()

            });

        }
    );


    /*
        مرتب‌سازی بر اساس روز و ساعت
    */

    reservations.sort(
        (a, b) => {

            const first =
                `${a.date} ${a.time}`;

            const second =
                `${b.date} ${b.time}`;


            return first.localeCompare(
                second
            );

        }
    );


    return reservations;

}


// ==========================================
// Get All Reservations
// ==========================================

async function getAllReservations(
    startDate,
    endDate
) {

    const reservationsQuery =
        query(

            reservationsRef,

            where(
                "date",
                ">=",
                startDate
            ),

            where(
                "date",
                "<=",
                endDate
            )

        );


    const snapshot =
        await getDocs(
            reservationsQuery
        );


    const reservations = [];


    snapshot.forEach(
        reservation => {

            reservations.push({

                id:
                    reservation.id,

                ...reservation.data()

            });

        }
    );


    reservations.sort(
        (a, b) => {

            const first =
                `${a.date} ${a.time}`;

            const second =
                `${b.date} ${b.time}`;


            return first.localeCompare(
                second
            );

        }
    );


    return reservations;

}


// ==========================================
// Get Customer
// ==========================================

async function getCustomer(
    phone
) {

    const customerDocument =
        doc(
            db,
            "customers",
            phone
        );


    const snapshot =
        await getDoc(
            customerDocument
        );


    if (!snapshot.exists()) {

        return null;

    }


    return {

        id:
            snapshot.id,

        ...snapshot.data()

    };

}


// ==========================================
// Get All Customers
// ==========================================

async function getAllCustomers() {

    const snapshot =
        await getDocs(
            customersRef
        );


    const customers = [];


    snapshot.forEach(
        customer => {

            customers.push({

                id:
                    customer.id,

                ...customer.data()

            });

        }
    );


    return customers;

}


// ==========================================
// Get Barbers
// ==========================================

async function getBarbers() {

    const snapshot =
        await getDocs(
            barbersRef
        );


    /*
        اگر هنوز collection باربرها
        ساخته نشده باشد، آرایشگرهای
        پیش‌فرض را برمی‌گردانیم.
    */

    if (snapshot.empty) {

        return Object.values(
            defaultBarbers
        );

    }


    const barbers = [];


    snapshot.forEach(
        barber => {

            const data =
                barber.data();


            if (
                data.active !== false
            ) {

                barbers.push({

                    id:
                        barber.id,

                    ...data

                });

            }

        }
    );


    return barbers;

}


// ==========================================
// Get Services
// ==========================================

function getServices() {

    return Object.values(
        services
    );

}


// ==========================================
// Get Working Hours
// ==========================================

function getWorkingHours() {

    return [
        ...workingHours
    ];

}


// ==========================================
// Cancel Reservation
// ==========================================

async function cancelReservation(
    reservationId
) {

    const reservationDocument =
        doc(
            db,
            "reservations",
            reservationId
        );


    await updateDoc(
        reservationDocument,
        {

            status:
                "cancelled",

            cancelledAt:
                serverTimestamp()

        }
    );


    return true;

}


// ==========================================
// Export
// ==========================================

export {

    db,

    loadBookedTimes,

    addReservation,

    saveCustomer,

    getBarberReservations,

    getAllReservations,

    getCustomer,

    getAllCustomers,

    getBarbers,

    getServices,

    getWorkingHours,

    cancelReservation

};


// ==========================================
// Firebase Ready
// ==========================================

console.log(
    "Firebase / Firestore سیستم سالن معجزه آماده است."
);
