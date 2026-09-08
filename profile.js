/* ==========================================
   Salon Mojezeh
   Smart Profile System
========================================== */

"use strict";


import {

    supabase,

    RESERVATION_STATUS,

    getCurrentUser,

    getCurrentUserProfile,

    signOutUser

} from "./supabase.js";



/* ==========================================
   Elements
========================================== */

const loader =
    document.getElementById(
        "profileLoader"
    );


const profileName =
    document.getElementById(
        "profileName"
    );


const profileSubtitle =
    document.getElementById(
        "profileSubtitle"
    );


const profileBadge =
    document.getElementById(
        "profileBadge"
    );


const profileAvatarIcon =
    document.getElementById(
        "profileAvatarIcon"
    );


const customerDashboard =
    document.getElementById(
        "customerDashboard"
    );


const barberDashboard =
    document.getElementById(
        "barberDashboard"
    );


const adminDashboard =
    document.getElementById(
        "adminDashboard"
    );


const logoutBtn =
    document.getElementById(
        "logoutBtn"
    );


const themeToggle =
    document.getElementById(
        "themeToggle"
    );


const themeIcon =
    document.getElementById(
        "themeIcon"
    );



/* ==========================================
   Theme System
========================================== */

function loadTheme() {


    const savedTheme =
        localStorage.getItem(
            "salon-theme"
        );


    if (
        savedTheme === "light"
    ) {

        document.body.classList.add(
            "light-mode"
        );


        themeIcon.className =
            "fa-solid fa-sun";

    }

}


function toggleTheme() {


    document.body.classList.toggle(
        "light-mode"
    );


    const isLight =
        document.body.classList.contains(
            "light-mode"
        );


    localStorage.setItem(

        "salon-theme",

        isLight
            ? "light"
            : "dark"

    );


    themeIcon.className =
        isLight
            ? "fa-solid fa-sun"
            : "fa-solid fa-moon";

}


loadTheme();


themeToggle.addEventListener(

    "click",

    toggleTheme

);




/* ==========================================
   Reservation Status Helpers
========================================== */

function getStatusInfo(
    status
) {


    const statuses = {


        [RESERVATION_STATUS.RESERVED]: {

            label:
                "رزرو شده",

            className:
                "status-reserved"

        },


        [RESERVATION_STATUS.COMPLETED]: {

            label:
                "انجام شده",

            className:
                "status-completed"

        },


        [RESERVATION_STATUS.CANCELLED]: {

            label:
                "لغو شده",

            className:
                "status-cancelled"

        },


        [RESERVATION_STATUS.NO_SHOW]: {

            label:
                "عدم مراجعه",

            className:
                "status-no-show"

        }


    };


    return (

        statuses[status]

        ||

        {

            label:
                status || "نامشخص",

            className:
                "status-no-show"

        }

    );

}



/* ==========================================
   Date Helper
========================================== */

function getTodayDate() {


    const today =
        new Date();


    const year =
        today.getFullYear();


    const month =
        String(
            today.getMonth() + 1
        ).padStart(
            2,
            "0"
        );


    const day =
        String(
            today.getDate()
        ).padStart(
            2,
            "0"
        );


    return `${year}-${month}-${day}`;

}



/* ==========================================
   Full Name Helper
========================================== */

function getCustomerFullName(
    customer
) {


    if (
        !customer
    ) {

        return "";

    }


    return [

        customer.first_name,

        customer.last_name

    ]

        .filter(Boolean)

        .join(" ")

        .trim();

}



/* ==========================================
   Hide All Dashboards
========================================== */

function hideAllDashboards() {


    customerDashboard.classList.add(
        "hidden"
    );


    barberDashboard.classList.add(
        "hidden"
    );


    adminDashboard.classList.add(
        "hidden"
    );

}



/* ==========================================
   Render Error
========================================== */

function showProfileError(
    message
) {


    profileName.textContent =
        "خطا در دریافت اطلاعات";


    profileSubtitle.textContent =
        message;


    profileBadge.textContent =
        "خطا";


    profileAvatarIcon.className =
        "fa-solid fa-triangle-exclamation";

}



/* ==========================================
   Main Profile Loader
========================================== */

async function loadProfile() {


    try {


        hideAllDashboards();


        // ================================
        // Get Auth User
        // ================================

        const user =
            await getCurrentUser();


        if (
            !user
        ) {

            window.location.href =
                "login.html";

            return;

        }


        // ================================
        // Get User Profile
        // ================================

        let profile =
            await getCurrentUserProfile();


        /*
            اگر user_profiles وجود نداشت
            کاربر همچنان می‌تواند وارد شود.
            به عنوان مشتری عمومی نمایش داده می‌شود.
        */

        if (
            !profile
        ) {

            await loadGuestCustomerProfile(
                user
            );

            return;

        }


        console.log(
            "USER:",
            user
        );


        console.log(
            "PROFILE:",
            profile
        );


        // ================================
        // Inactive User
        // ================================

        if (
            profile.active === false
        ) {

            throw new Error(
                "این حساب کاربری غیرفعال شده است."
            );

        }


        // ================================
        // Admin
        // ================================

        if (
            profile.is_admin === true
        ) {

            await loadAdminProfile(
                profile,
                user
            );

            return;

        }


        // ================================
        // Barber
        // ================================

        if (

            profile.role === "barber"

            &&

            profile.barber_id

        ) {

            await loadBarberProfile(
                profile,
                user
            );

            return;

        }


        // ================================
        // Customer
        // ================================

        await loadCustomerProfile(
            profile,
            user
        );


    }

    catch (
        error
    ) {


        console.error(
            "Profile Error:",
            error
        );


        showProfileError(
            error.message ||
            "خطایی در دریافت اطلاعات رخ داد."
        );


    }

    finally {


        loader.style.display =
            "none";


    }

}



/* ==========================================
   Fallback Customer
========================================== */

async function loadGuestCustomerProfile(
    user
) {


    customerDashboard.classList.remove(
        "hidden"
    );


    profileAvatarIcon.className =
        "fa-solid fa-user";


    profileBadge.textContent =
        "مشتری سالن";


    profileName.textContent =
        user.email ||
        "مشتری سالن معجزه";


    profileSubtitle.textContent =
        "پروفایل کاربری";


    document.getElementById(
        "customerFullName"
    ).textContent =
        "اطلاعات تکمیل نشده";


    document.getElementById(
        "customerPhone"
    ).textContent =
        "---";


    document.getElementById(
        "customerReservations"
    ).innerHTML = `

        <div class="empty-state">

            <i class="fa-solid fa-user-plus"></i>

            <p>

                هنوز اطلاعات مشتری شما به پروفایل متصل نشده است.

            </p>

        </div>

    `;


}



/* ==========================================
   CUSTOMER PROFILE
========================================== */

async function loadCustomerProfile(
    profile,
    user
) {


    customerDashboard.classList.remove(
        "hidden"
    );


    profileAvatarIcon.className =
        "fa-solid fa-user";


    profileBadge.textContent =
        "مشتری سالن";


    profileSubtitle.textContent =
        "پروفایل مشتری";


    let customer =
        null;


    // ================================
    // Get Customer by customer_id
    // ================================

    if (
        profile.customer_id
    ) {


        const {

            data,

            error

        } = await supabase

            .from("customers")

            .select("*")

            .eq(
                "id",
                profile.customer_id
            )

            .maybeSingle();


        if (
            error
        ) {

            console.error(
                "Customer load error:",
                error
            );

        }


        customer =
            data || null;


    }


    // ================================
    // Profile Name
    // ================================

    if (
        customer
    ) {


        const fullName =
            getCustomerFullName(
                customer
            );


        profileName.textContent =

            fullName ||

            user.email ||

            "مشتری سالن معجزه";


        document.getElementById(
            "customerFullName"
        ).textContent =

            fullName || "---";


        document.getElementById(
            "customerPhone"
        ).textContent =

            customer.phone || "---";


        document.getElementById(
            "customerVisits"
        ).textContent =

            customer.visit_count || 0;


        document.getElementById(
            "customerLastVisit"
        ).textContent =

            customer.last_visit || "---";


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

    else {


        profileName.textContent =
            user.email ||
            "مشتری سالن معجزه";


    }


    // ================================
    // Club Data
    // ================================

    if (
        customer
    ) {


        const {

            data: club,

            error: clubError

        } = await supabase

            .from("club_members")

            .select("*")

            .eq(
                "customer_id",
                customer.id
            )

            .maybeSingle();


        if (
            clubError
        ) {

            console.warn(
                "Club data unavailable:",
                clubError
            );

        }


        if (
            club
        ) {


            document.getElementById(
                "customerPoints"
            ).textContent =

                club.points || 0;


            document.getElementById(
                "customerGift"
            ).textContent =

                club.available_gift
                    ? "آماده 🎁"
                    : "ندارد";


        }


    }


    // ================================
    // Customer Reservations
    // ================================

    if (
        customer
    ) {


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
                    ascending: false
                }
            )

            .order(
                "time",
                {
                    ascending: false
                }
            );


        if (
            error
        ) {

            console.error(
                "Customer reservations error:",
                error
            );


            renderReservations(

                "customerReservations",

                []

            );


        }

        else {


            renderReservations(

                "customerReservations",

                reservations || []

            );


        }


    }

    else {


        renderReservations(

            "customerReservations",

            []

        );


    }


}



/* ==========================================
   BARBER PROFILE
========================================== */

async function loadBarberProfile(
    profile,
    user
) {


    barberDashboard.classList.remove(
        "hidden"
    );


    profileAvatarIcon.className =
        "fa-solid fa-user-scissors";


    profileBadge.textContent =
        "آرایشگر سالن";


    profileSubtitle.textContent =
        "پنل شخصی آرایشگر";


    // ================================
    // Get Barber
    // ================================

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

        .maybeSingle();


    if (
        barberError
    ) {

        throw barberError;

    }


    profileName.textContent =

        barber?.name ||

        user.email ||

        "آرایشگر سالن";


    // ================================
    // Get Reservations
    // ================================

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
                ascending: false
            }
        )

        .order(
            "time",
            {
                ascending: false
            }
        );


    if (
        reservationError
    ) {

        throw reservationError;

    }


    const allReservations =
        reservations || [];


    const today =
        getTodayDate();


    // ================================
    // Statistics
    // ================================

    const todayReservations =

        allReservations.filter(

            item =>

                item.date === today

                &&

                item.status ===
                RESERVATION_STATUS.RESERVED

        );


    const completed =

        allReservations.filter(

            item =>

                item.status ===
                RESERVATION_STATUS.COMPLETED

        );


    const uniqueCustomerIds =

        [

            ...new Set(

                allReservations

                    .filter(
                        item => item.customer_id
                    )

                    .map(
                        item => item.customer_id
                    )

            )

        ];


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
        uniqueCustomerIds.length;


    document.getElementById(
        "barberCompleted"
    ).textContent =
        completed.length;


    // ================================
    // Render Reservations
    // ================================

    renderReservations(

        "barberReservations",

        allReservations

    );


    // ================================
    // Get Customers
    // ================================

    if (
        uniqueCustomerIds.length > 0
    ) {


        const {

            data: customers,

            error: customerError

        } = await supabase

            .from("customers")

            .select("*")

            .in(
                "id",
                uniqueCustomerIds
            );


        if (
            customerError
        ) {

            console.error(
                customerError
            );

        }


        renderCustomers(
            customers || []
        );


    }

    else {


        document.getElementById(
            "barberCustomerList"
        ).innerHTML = `

            <div class="empty-state">

                <i class="fa-solid fa-users"></i>

                <p>

                    هنوز مشتری ثبت نشده است.

                </p>

            </div>

        `;


    }


}



/* ==========================================
   ADMIN PROFILE
========================================== */

async function loadAdminProfile(
    profile,
    user
) {


    adminDashboard.classList.remove(
        "hidden"
    );


    profileAvatarIcon.className =
        "fa-solid fa-crown";


    profileBadge.textContent =
        "مدیر سالن";


    profileSubtitle.textContent =
        "دسترسی کامل مدیریت";


    profileName.textContent =
        user.email ||
        "مدیر سالن";


    // ================================
    // Optional Barber Name
    // ================================

    if (
        profile.barber_id
    ) {


        const {

            data: barber

        } = await supabase

            .from("barbers")

            .select("name")

            .eq(
                "id",
                profile.barber_id
            )

            .maybeSingle();


        if (
            barber?.name
        ) {

            profileName.textContent =
                barber.name;

        }


    }


    // ================================
    // Reservations
    // ================================

    const {

        data: reservations,

        error: reservationsError

    } = await supabase

        .from("reservations")

        .select("*")

        .order(
            "created_at",
            {
                ascending: false
            }
        );


    if (
        reservationsError
    ) {

        throw reservationsError;

    }


    const allReservations =
        reservations || [];


    const today =
        getTodayDate();


    const todayCount =

        allReservations.filter(

            item =>

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


    // ================================
    // Customers Count
    // ================================

    const {

        count: customerCount,

        error: customerCountError

    } = await supabase

        .from("customers")

        .select(

            "*",

            {

                count: "exact",

                head: true

            }

        );


    if (
        customerCountError
    ) {

        console.error(
            customerCountError
        );

    }


    document.getElementById(
        "adminTotalCustomers"
    ).textContent =
        customerCount || 0;


    // ================================
    // Active Barbers Count
    // ================================

    const {

        count: barberCount,

        error: barberCountError

    } = await supabase

        .from("barbers")

        .select(

            "*",

            {

                count: "exact",

                head: true

            }

        )

        .eq(
            "active",
            true
        );


    if (
        barberCountError
    ) {

        console.error(
            barberCountError
        );

    }


    document.getElementById(
        "adminTotalBarbers"
    ).textContent =
        barberCount || 0;


    // ================================
    // Latest Reservations
    // ================================

    renderReservations(

        "adminReservations",

        allReservations.slice(0, 15)

    );


}



/* ==========================================
   Render Reservations
========================================== */

function renderReservations(
    containerId,
    reservations
) {


    const container =
        document.getElementById(
            containerId
        );


    if (
        !container
    ) {

        return;

    }


    // ================================
    // Empty
    // ================================

    if (
        !reservations ||
        reservations.length === 0
    ) {


        container.innerHTML = `

            <div class="empty-state">

                <i class="fa-solid fa-calendar-xmark"></i>

                <p>

                    هنوز رزروی ثبت نشده است.

                </p>

            </div>

        `;


        return;

    }


    container.innerHTML =
        "";


    reservations.forEach(
        item => {


            const statusInfo =
                getStatusInfo(
                    item.status
                );


            const fullName =

                [

                    item.first_name,

                    item.last_name

                ]

                    .filter(Boolean)

                    .join(" ")

                    .trim()

                ||

                "مشتری";


            const dateText =

                item.display_date ||

                item.date ||

                "---";


            const barberText =

                item.barber_name ||

                "---";


            const serviceText =

                item.service ||

                "---";


            const div =
                document.createElement(
                    "div"
                );


            div.className =
                "reservation-item";


            div.innerHTML = `

                <div class="reservation-main">

                    <h4>

                        ${escapeHtml(fullName)}

                    </h4>


                    <p>

                        ✂️
                        ${escapeHtml(serviceText)}

                    </p>


                    <p>

                        📅
                        ${escapeHtml(dateText)}

                        |

                        🕒
                        ${escapeHtml(item.time || "---")}

                    </p>


                    <p>

                        👤
                        ${escapeHtml(barberText)}

                    </p>

                </div>


                <span
                    class="
                        reservation-status
                        ${statusInfo.className}
                    "
                >

                    ${statusInfo.label}

                </span>

            `;


            container.appendChild(
                div
            );


        }

    );


}



/* ==========================================
   Render Customers
========================================== */

function renderCustomers(
    customers
) {


    const container =
        document.getElementById(
            "barberCustomerList"
        );


    if (
        !container
    ) {

        return;

    }


    if (
        !customers ||
        customers.length === 0
    ) {


        container.innerHTML = `

            <div class="empty-state">

                <i class="fa-solid fa-users"></i>

                <p>

                    مشتری پیدا نشد.

                </p>

            </div>

        `;


        return;

    }


    container.innerHTML =
        "";


    customers.forEach(
        customer => {


            const fullName =
                getCustomerFullName(
                    customer
                );


            const div =
                document.createElement(
                    "div"
                );


            div.className =
                "customer-item";


            div.innerHTML = `

                <h4>

                    ${escapeHtml(
                        fullName || "مشتری"
                    )}

                </h4>


                <p>

                    📞
                    ${escapeHtml(
                        customer.phone || "---"
                    )}

                </p>


                <p>

                    ✂️ تعداد مراجعات:

                    ${customer.visit_count || 0}

                </p>


                <p>

                    آخرین مراجعه:

                    ${escapeHtml(
                        customer.last_visit || "---"
                    )}

                </p>

            `;


            container.appendChild(
                div
            );


        }

    );


}



/* ==========================================
   Security Helper
========================================== */

function escapeHtml(
    value
) {


    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        String(value ?? "");


    return div.innerHTML;

}



/* ==========================================
   Logout
========================================== */

logoutBtn.addEventListener(

    "click",

    async () => {


        const confirmLogout =
            confirm(
                "آیا مطمئن هستید که می‌خواهید از حساب خود خارج شوید؟"
            );


        if (
            !confirmLogout
        ) {

            return;

        }


        try {


            logoutBtn.disabled =
                true;


            await signOutUser();


            window.location.href =
                "index.html";


        }

        catch (
            error
        ) {


            console.error(
                "Logout error:",
                error
            );


            alert(
                "خطایی در خروج از حساب رخ داد."
            );


        }

        finally {


            logoutBtn.disabled =
                false;


        }


    }

);




/* ==========================================
   Start
========================================== */

loadProfile();
