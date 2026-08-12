// ==========================================
// Firebase Connection Test
// فقط برای تست - فایل اصلی را تغییر نده
// ==========================================

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
    getFirestore,
    collection,
    getDocs,
    limit,
    query
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// ==========================================
// Firebase Config
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
// Initialize
// ==========================================

const app =
    initializeApp(firebaseConfig);

const db =
    getFirestore(app);


// ==========================================
// Test Connection
// ==========================================

async function testFirebase() {

    console.log(
        "شروع تست اتصال Firebase..."
    );


    try {

        const q =
            query(
                collection(
                    db,
                    "reservations"
                ),
                limit(1)
            );


        const snapshot =
            await getDocs(q);


        console.log(
            "✅ اتصال به Firestore موفق بود."
        );

        console.log(
            "تعداد نتیجه:",
            snapshot.size
        );


        document.body.innerHTML = `

            <div style="
                direction:rtl;
                text-align:center;
                padding:40px;
                font-family:sans-serif;
            ">

                <h1 style="color:green;">
                    ✅ اتصال موفق است
                </h1>

                <p>
                    Firebase و Firestore
                    بدون مشکل در دسترس هستند.
                </p>

                <p>
                    تعداد اطلاعات دریافت شده:
                    ${snapshot.size}
                </p>

            </div>

        `;

    }

    catch (error) {

        console.error(
            "❌ Firebase Error:",
            error
        );


        document.body.innerHTML = `

            <div style="
                direction:rtl;
                text-align:center;
                padding:30px;
                font-family:sans-serif;
            ">

                <h1 style="color:red;">
                    ❌ اتصال ناموفق است
                </h1>

                <p>
                    اتصال به Firebase برقرار نشد.
                </p>

                <p style="
                    direction:ltr;
                    word-break:break-word;
                    background:#f5f5f5;
                    padding:15px;
                ">
                    ${error.code || "unknown-error"}
                </p>

                <p>
                    ${error.message || ""}
                </p>

            </div>

        `;

    }

}


testFirebase();
