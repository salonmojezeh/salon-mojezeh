/* ==========================================
   Salon Mojezeh
   Smart Profile System
   profile.js
========================================== */

import {
    supabase
} from "./supabase.js";


/* ==========================================
   Elements
========================================== */

const loader =
document.getElementById("profileLoader");

const profileName =
document.getElementById("profileName");

const profileSubtitle =
document.getElementById("profileSubtitle");

const profileBadge =
document.getElementById("profileBadge");

const profileAvatarIcon =
document.getElementById("profileAvatarIcon");

const customerDashboard =
document.getElementById("customerDashboard");

const barberDashboard =
document.getElementById("barberDashboard");

const adminDashboard =
document.getElementById("adminDashboard");

const logoutBtn =
document.getElementById("logoutBtn");


/* ==========================================
   Status Helper
========================================== */

function getStatusClass(status){

    if(status === "انجام شد"){
        return "status-done";
    }

    if(status === "لغو شده"){
        return "status-cancel";
    }

    return "status-wait";

}


/* ==========================================
   Date Helper
========================================== */

function getTodayDate(){

    const today = new Date();

    return today.toISOString().split("T")[0];

}


/* ==========================================
   Load User Profile
========================================== */

async function loadProfile(){

    try{


        /* =========================
           Get Auth User
        ========================= */

        const {

            data: authData,
            error: authError

        } = await supabase.auth.getUser();


        if(authError){

            throw authError;

        }


        const user =
        authData.user;


        /* =========================
           User Not Logged In
        ========================= */

        if(!user){

            window.location.href =
            "index.html";

            return;

        }


        /* =========================
           Get User Profile
        ========================= */

        const {

            data: profile,
            error: profileError

        } = await supabase

        .from("user_profiles")

        .select("*")

        .eq("id", user.id)

        .single();


        if(profileError){

            throw profileError;

        }


        console.log(
            "USER PROFILE:",
            profile
        );


        /* =========================
           Admin
        ========================= */

        if(profile.is_admin === true){

            await loadAdminProfile(
                profile,
                user
            );

            return;

        }


        /* =========================
           Barber
        ========================= */

        if(
            profile.role === "barber"
            &&
            profile.barber_id
        ){

            await loadBarberProfile(
                profile,
                user
            );

            return;

        }


        /* =========================
           Customer
        ========================= */

        await loadCustomerProfile(
            profile,
            user
        );


    }

    catch(error){

        console.error(
            "Profile Error:",
            error
        );


        profileName.textContent =
        "خطا در دریافت اطلاعات";


        profileSubtitle.textContent =
        error.message;


    }

    finally{

        loader.style.display =
        "none";

    }

}



/* ==========================================
   CUSTOMER PROFILE
========================================== */

async function loadCustomerProfile(
    profile,
    user
){


    customerDashboard.classList
    .remove("hidden");


    profileAvatarIcon.className =
    "fa-solid fa-user";


    profileBadge.textContent =
    "مشتری سالن";


    profileSubtitle.textContent =
    "پروفایل مشتری";


    let customer = null;


    /* =========================
       Customer by ID
    ========================= */

    if(profile.customer_id){

        const {

            data

        } = await supabase

        .from("customers")

        .select("*")

        .eq(
            "id",
            profile.customer_id
        )

        .single();


        customer = data;

    }


    /* =========================
       Customer by phone/email
       fallback
    ========================= */

    if(!customer){

        profileName.textContent =
        user.email ||
        "مشتری سالن معجزه";

    }


    else{


        const fullName =
        `${customer.first_name || ""}
        ${customer.last_name || ""}`
        .trim();


        profileName.textContent =
        fullName ||
        "مشتری سالن معجزه";


        document.getElementById(
            "customerFullName"
        ).textContent =
        fullName;


        document.getElementById(
            "customerPhone"
        ).textContent =
        customer.phone ||
        "---";


        document.getElementById(
            "customerVisits"
        ).textContent =
        customer.visit_count || 0;


        document.getElementById(
            "customerLastVisit"
        ).textContent =
        customer.last_visit ||
        "---";


        document.getElementById(
            "customerFavoriteModel"
        ).textContent =
        customer.favorite_model ||
        "ثبت نشده";


        document.getElementById(
            "customerLastBarber"
        ).textContent =
        customer.last_barber_name ||
        "---";


    }


    /* =========================
       Club Data
    ========================= */

    if(customer){

        const {

            data: club

        } = await supabase

        .from("club_members")

        .select("*")

        .eq(
            "customer_id",
            customer.id
        )

        .single();


        if(club){

            document.getElementById(
                "customerPoints"
            ).textContent =
            club.points || 0;


            document.getElementById(
                "customerGift"
            ).textContent =
            club.available_gift
            ?
            "🎁 آماده"
            :
            "ندارد";

        }

    }


    /* =========================
       Customer Reservations
    ========================= */

    if(customer){

        const {

            data: reservations,
            error

        } = await supabase

        .from("reservations")

        .select("*")

        .eq(
            "customer_id",
            customer.id
        )

        .order(
            "date",
            {
                ascending:false
            }
        );


        if(error){

            console.error(error);

            return;

        }


        renderReservations(

            "customerReservations",

            reservations || []

        );

    }


}



/* ==========================================
   BARBER PROFILE
========================================== */

async function loadBarberProfile(
    profile,
    user
){


    barberDashboard.classList
    .remove("hidden");


    profileAvatarIcon.className =
    "fa-solid fa-user-scissors";


    profileBadge.textContent =
    "آرایشگر سالن";


    profileSubtitle.textContent =
    "پنل شخصی آرایشگر";


    /* =========================
       Get Barber
    ========================= */

    const {

        data: barber,
        error: barberError

    } = await supabase

    .from("barbers")

    .select("*")

    .eq(
        "id",
        profile.barber_id
    )

    .single();


    if(barberError){

        throw barberError;

    }


    profileName.textContent =
    barber.name;


    /* =========================
       Get Reservations
    ========================= */

    const {

        data: reservations,
        error: reservationError

    } = await supabase

    .from("reservations")

    .select("*")

    .eq(
        "barber_id",
        profile.barber_id
    )

    .order(
        "date",
        {
            ascending:false
        }
    );


    if(reservationError){

        throw reservationError;

    }


    const allReservations =
    reservations || [];


    const today =
    getTodayDate();


    /* =========================
       Statistics
    ========================= */

    const todayReservations =
    allReservations.filter(item =>
        item.date === today
    );


    const completed =
    allReservations.filter(item =>
        item.status === "انجام شد"
    );


    const uniqueCustomers =
    new Set(

        allReservations
        .filter(item =>
            item.customer_id
        )
        .map(item =>
            item.customer_id
        )

    );


    document.getElementById(
        "barberTodayReservations"
    ).textContent =
    todayReservations.length;


    document.getElementById(
        "barberTotalReservations"
    ).textContent =
    allReservations.length;


    document.getElementById(
        "barberCustomers"
    ).textContent =
    uniqueCustomers.size;


    document.getElementById(
        "barberCompleted"
    ).textContent =
    completed.length;


    /* =========================
       Render Reservations
    ========================= */

    renderReservations(

        "barberReservations",

        allReservations

    );


    /* =========================
       Get Customers
    ========================= */

    if(uniqueCustomers.size > 0){

        const customerIds =
        [...uniqueCustomers];


        const {

            data: customers,
            error: customerError

        } = await supabase

        .from("customers")

        .select("*")

        .in(
            "id",
            customerIds
        );


        if(customerError){

            console.error(customerError);

        }


        renderCustomers(
            customers || []
        );

    }

    else{

        document.getElementById(
            "barberCustomerList"
        ).innerHTML =
        "هنوز مشتری ثبت نشده است.";

    }


}



/* ==========================================
   ADMIN PROFILE
========================================== */

async function loadAdminProfile(
    profile,
    user
){


    adminDashboard.classList
    .remove("hidden");


    profileAvatarIcon.className =
    "fa-solid fa-crown";


    profileBadge.textContent =
    "مدیر سالن";


    profileSubtitle.textContent =
    "دسترسی کامل مدیریت";


    /* =========================
       Get Barber Name
    ========================= */

    if(profile.barber_id){

        const {

            data: barber

        } = await supabase

        .from("barbers")

        .select("*")

        .eq(
            "id",
            profile.barber_id
        )

        .single();


        if(barber){

            profileName.textContent =
            barber.name;

        }

    }


    if(!profileName.textContent){

        profileName.textContent =
        user.email;

    }


    /* =========================
       Load Reservations
    ========================= */

    const {

        data: reservations

    } = await supabase

    .from("reservations")

    .select("*")

    .order(
        "created_at",
        {
            ascending:false
        }
    );


    const allReservations =
    reservations || [];


    /* =========================
       Today
    ========================= */

    const today =
    getTodayDate();


    const todayCount =
    allReservations.filter(item =>
        item.date === today
    ).length;


    document.getElementById(
        "adminTodayReservations"
    ).textContent =
    todayCount;


    document.getElementById(
        "adminTotalReservations"
    ).textContent =
    allReservations.length;


    /* =========================
       Customers Count
    ========================= */

    const {

        count: customerCount

    } = await supabase

    .from("customers")

    .select(
        "*",
        {
            count:"exact",
            head:true
        }
    );


    document.getElementById(
        "adminTotalCustomers"
    ).textContent =
    customerCount || 0;


    /* =========================
       Barbers Count
    ========================= */

    const {

        count: barberCount

    } = await supabase

    .from("barbers")

    .select(
        "*",
        {
            count:"exact",
            head:true
        }
    )

    .eq(
        "active",
        true
    );


    document.getElementById(
        "adminTotalBarbers"
    ).textContent =
    barberCount || 0;


    /* =========================
       Render Latest Reservations
    ========================= */

    renderReservations(

        "adminReservations",

        allReservations.slice(0,15)

    );


}



/* ==========================================
   Render Reservations
========================================== */

function renderReservations(
    containerId,
    reservations
){


    const container =
    document.getElementById(
        containerId
    );


    if(!container){

        return;

    }


    if(!reservations.length){

        container.innerHTML = `

            <p style="color:#888">

                هنوز رزروی ثبت نشده است.

            </p>

        `;

        return;

    }


    container.innerHTML = "";


    reservations.forEach(item => {


        const statusClass =
        getStatusClass(
            item.status
        );


        const fullName =
        `${item.first_name || ""}
        ${item.last_name || ""}`
        .trim();


        const div =
        document.createElement("div");


        div.className =
        "reservation-item";


        div.innerHTML = `

            <div class="reservation-main">

                <h4>

                    ${fullName}

                </h4>


                <p>

                    ✂ ${item.service || "---"}

                </p>


                <p>

                    📅 ${item.date || "---"}

                    |

                    🕒 ${item.time || "---"}

                </p>


                <p>

                    👤 ${item.barber_name || ""}

                </p>

            </div>


            <span class="reservation-status ${statusClass}">

                ${item.status || "در انتظار"}

            </span>

        `;


        container.appendChild(div);


    });


}



/* ==========================================
   Render Barber Customers
========================================== */

function renderCustomers(customers){


    const container =
    document.getElementById(
        "barberCustomerList"
    );


    if(!container){

        return;

    }


    if(!customers.length){

        container.innerHTML =
        "مشتری پیدا نشد.";

        return;

    }


    container.innerHTML = "";


    customers.forEach(customer => {


        const div =
        document.createElement("div");


        div.className =
        "customer-item";


        div.innerHTML = `

            <h4>

                ${customer.first_name || ""}
                ${customer.last_name || ""}

            </h4>


            <p>

                📞 ${customer.phone || "---"}

            </p>


            <p>

                ✂ تعداد مراجعات:

                ${customer.visit_count || 0}

            </p>


            <p>

                آخرین مراجعه:

                ${customer.last_visit || "---"}

            </p>

        `;


        container.appendChild(div);


    });


}



/* ==========================================
   Logout
========================================== */

logoutBtn.addEventListener(
    "click",

    async () => {


        const confirmLogout =
        confirm(
            "آیا می‌خواهید از حساب خود خارج شوید؟"
        );


        if(!confirmLogout){

            return;

        }


        const {

            error

        } = await supabase.auth.signOut();


        if(error){

            alert(
                "خطا در خروج از حساب"
            );

            console.error(error);

            return;

        }


        window.location.href =
        "index.html";


    }

);



/* ==========================================
   Start
========================================== */

loadProfile();
