/* ==========================================
   Salon Mojezeh
   Unified Smart Profile
========================================== */

"use strict";


import {

    supabase,

    RESERVATION_STATUS,

    getCurrentUser,

    getCurrentUserProfile,

    signOutUser,

    completeReservation,

    cancelReservation,

    markReservationNoShow

} from "./supabase.js";


/* ==========================================
   Elements
========================================== */

const profileLoader =
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
   State
========================================== */

let currentUser = null;

let currentProfile = null;

let currentRole = null;

let currentBarberId = null;


/* ==========================================
   Helpers
========================================== */

function getTodayDate() {

    const now = new Date();

    const y =
        now.getFullYear();

    const m =
        String(
            now.getMonth() + 1
        ).padStart(2, "0");

    const d =
        String(
            now.getDate()
        ).padStart(2, "0");

    return `${y}-${m}-${d}`;

}


function escapeHtml(value) {

    const div =
        document.createElement("div");

    div.textContent =
        String(value ?? "");

    return div.innerHTML;

}


function getCustomerFullName(customer) {

    return [

        customer?.first_name,

        customer?.last_name

    ]

        .filter(Boolean)

        .join(" ")

        .trim();

}


function formatDate(date) {

    if (!date) {
        return "---";
    }

    try {

        return new Intl.DateTimeFormat(
            "fa-IR-u-ca-persian",
            {
                year: "numeric",
                month: "long",
                day: "numeric"
            }
        ).format(
            new Date(`${date}T12:00:00`)
        );

    } catch {

        return date;

    }

}


function getStatusInfo(status) {

    const statuses = {

        [RESERVATION_STATUS.RESERVED]: {

            label: "رزرو شده",

            className: "status-reserved"

        },

        [RESERVATION_STATUS.COMPLETED]: {

            label: "انجام شده",

            className: "status-completed"

        },

        [RESERVATION_STATUS.CANCELLED]: {

            label: "لغو شده",

            className: "status-cancelled"

        },

        [RESERVATION_STATUS.NO_SHOW]: {

            label: "عدم مراجعه",

            className: "status-no-show"

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


function showMessage(element, message, type = "") {

    if (!element) {
        return;
    }

    element.textContent = message;

    element.className =
        `form-message ${type}`.trim();

}


function hideAllDashboards() {

    customerDashboard?.classList.add("hidden");

    barberDashboard?.classList.add("hidden");

    adminDashboard?.classList.add("hidden");

}


/* ==========================================
   Availability helpers
========================================== */

const availabilityTypeLabels = {

    closed: "تعطیلی کامل",

    busy: "ساعت شلوغ / بسته",

    holiday: "تعطیلی مناسبتی",

    leave: "مرخصی"

};


function getAvailabilityLabel(type) {

    return (

        availabilityTypeLabels[type]

        ||

        "محدودیت"

    );

}


function formatAvailabilityTime(item) {

    if (!item.start_time || !item.end_time) {

        return "کل روز";

    }

    return `${item.start_time} تا ${item.end_time}`;

}


function isWholeDayAvailability(item) {

    return !item.start_time &&
        !item.end_time;

}


/* ==========================================
   Load Profile
========================================== */

async function loadProfile() {

    try {

        hideAllDashboards();


        currentUser =
            await getCurrentUser();


        if (!currentUser) {

            window.location.href =
                "login.html";

            return;

        }


        currentProfile =
            await getCurrentUserProfile();


        if (!currentProfile) {

            await loadFallbackCustomer();

            return;

        }


        if (
            currentProfile.active === false
        ) {

            throw new Error(
                "این حساب کاربری غیرفعال شده است."
            );

        }


        if (
            currentProfile.is_admin === true
        ) {

            currentRole =
                "admin";

            await loadAdminProfile();

            return;

        }


        if (
            currentProfile.role === "barber"

            &&

            currentProfile.barber_id
        ) {

            currentRole =
                "barber";

            currentBarberId =
                currentProfile.barber_id;

            await loadBarberProfile();

            return;

        }


        currentRole =
            "customer";

        await loadCustomerProfile();

    }

    catch (error) {

        console.error(
            "Profile Error:",
            error
        );

        showProfileError(
            error?.message
            ||
            "خطایی در دریافت اطلاعات رخ داد."
        );

    }

    finally {

        if (profileLoader) {

            profileLoader.style.display =
                "none";

        }

    }

}


/* ==========================================
   Error
========================================== */

function showProfileError(message) {

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
   Fallback
========================================== */

async function loadFallbackCustomer() {

    customerDashboard
        ?.classList.remove("hidden");

    profileAvatarIcon.className =
        "fa-solid fa-user";

    profileBadge.textContent =
        "مشتری سالن";

    profileName.textContent =
        currentUser.user_metadata?.full_name
        ||
        currentUser.email
        ||
        "مشتری سالن معجزه";

    profileSubtitle.textContent =
        "پروفایل کاربری";


    document.getElementById(
        "customerFullName"
    ).textContent =
        currentUser.user_metadata?.full_name
        ||
        "اطلاعات تکمیل نشده";


    document.getElementById(
        "customerPhone"
    ).textContent =
        currentUser.phone
        ||
        "---";


    document.getElementById(
        "customerEmail"
    ).textContent =
        currentUser.email
        ||
        "---";


    renderReservations(
        "customerReservations",
        []
    );

}


/* ==========================================
   Customer
========================================== */

async function loadCustomerProfile() {

    customerDashboard
        ?.classList.remove("hidden");


    profileAvatarIcon.className =
        "fa-solid fa-user";

    profileBadge.textContent =
        "مشتری سالن";

    profileSubtitle.textContent =
        "پروفایل مشتری";


    let customer = null;


    if (currentProfile?.customer_id) {

        const {
            data,
            error
        } = await supabase

            .from("customers")

            .select("*")

            .eq(
                "id",
                currentProfile.customer_id
            )

            .maybeSingle();


        if (error) {

            console.error(
                "Customer error:",
                error
            );

        }

        customer =
            data || null;

    }


    if (!customer) {

        await loadFallbackCustomer();

        return;

    }


    const fullName =
        getCustomerFullName(customer);


    profileName.textContent =
        fullName
        ||
        currentUser.user_metadata?.full_name
        ||
        currentUser.email
        ||
        "مشتری سالن معجزه";


    document.getElementById(
        "customerFullName"
    ).textContent =
        fullName || "---";


    document.getElementById(
        "customerPhone"
    ).textContent =
        customer.phone || currentUser.phone || "---";


    document.getElementById(
        "customerEmail"
    ).textContent =
        currentUser.email || "---";


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
        customer.favorite_model
        ||
        "ثبت نشده";


    document.getElementById(
        "customerLastBarber"
    ).textContent =
        customer.last_barber_name
        ||
        "---";


    /*
       club_members عمداً حذف شده.
       چون وجود این جدول در پروژه تأیید نشده.
    */

    document.getElementById(
        "customerPoints"
    ).textContent =
        customer.club_points
        ??
        customer.points
        ??
        0;


    document.getElementById(
        "customerGift"
    ).textContent =
        customer.available_gift
        ? "آماده 🎁"
        : "ندارد";


    await loadCustomerReservations(
        customer.id
    );

}


/* ==========================================
   Customer Reservations
========================================== */

async function loadCustomerReservations(
    customerId
) {

    const {
        data,
        error
    } = await supabase

        .from("reservations")

        .select("*")

        .eq(
            "customer_id",
            customerId
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


    if (error) {

        console.error(
            "Customer reservations:",
            error
        );

        renderReservations(
            "customerReservations",
            []
        );

        return;

    }


    renderReservations(
        "customerReservations",
        data || [],
        {
            customer: true
        }
    );

}


/* ==========================================
   Barber
========================================== */

async function loadBarberProfile() {

    barberDashboard
        ?.classList.remove("hidden");


    profileAvatarIcon.className =
        "fa-solid fa-user-scissors";

    profileBadge.textContent =
        "آرایشگر سالن";

    profileSubtitle.textContent =
        "پنل شخصی آرایشگر";


    const {
        data: barber,
        error: barberError
    } = await supabase

        .from("barbers")

        .select("*")

        .eq(
            "id",
            currentBarberId
        )

        .maybeSingle();


    if (barberError) {

        throw barberError;

    }


    profileName.textContent =
        barber?.name
        ||
        currentUser.user_metadata?.full_name
        ||
        "آرایشگر سالن";


    await loadBarberReservations();

    await loadBarberAvailability();

    await loadBarberCustomers();

}


/* ==========================================
   Barber Reservations
========================================== */

async function loadBarberReservations() {

    const {
        data,
        error
    } = await supabase

        .from("reservations")

        .select("*")

        .eq(
            "barber_id",
            currentBarberId
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


    if (error) {

        throw error;

    }


    const reservations =
        data || [];


    const today =
        getTodayDate();


    const todayReservations =
        reservations.filter(

            item =>

                item.date === today

                &&

                item.status ===
                RESERVATION_STATUS.RESERVED

        );


    const completed =
        reservations.filter(

            item =>

                item.status ===
                RESERVATION_STATUS.COMPLETED

        );


    const customerIds = [

        ...new Set(

            reservations

                .filter(
                    item =>
                        item.customer_id
                )

                .map(
                    item =>
                        item.customer_id
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
        reservations.length;


    document.getElementById(
        "barberCustomers"
    ).textContent =
        customerIds.length;


    document.getElementById(
        "barberCompleted"
    ).textContent =
        completed.length;


    renderReservations(
        "barberReservations",
        reservations,
        {
            staff: true
        }
    );

}


/* ==========================================
   Barber Customers
========================================== */

async function loadBarberCustomers() {

    const {
        data: reservations,
        error
    } = await supabase

        .from("reservations")

        .select("customer_id")

        .eq(
            "barber_id",
            currentBarberId
        );


    if (error) {

        console.error(error);

        return;

    }


    const ids = [

        ...new Set(

            (reservations || [])

                .map(
                    item =>
                        item.customer_id
                )

                .filter(Boolean)

        )

    ];


    if (!ids.length) {

        renderCustomers([]);

        return;

    }


    const {
        data: customers,
        error: customerError
    } = await supabase

        .from("customers")

        .select("*")

        .in(
            "id",
            ids
        );


    if (customerError) {

        console.error(
            customerError
        );

        renderCustomers([]);

        return;

    }


    renderCustomers(
        customers || []
    );

}


/* ==========================================
   Admin
========================================== */

async function loadAdminProfile() {

    adminDashboard
        ?.classList.remove("hidden");


    profileAvatarIcon.className =
        "fa-solid fa-crown";

    profileBadge.textContent =
        "مدیر سالن";

    profileSubtitle.textContent =
        "دسترسی کامل مدیریت";


    profileName.textContent =
        currentUser.user_metadata?.full_name
        ||
        currentUser.email
        ||
        "مدیر سالن";


    await loadAdminReservations();

    await loadAdminAvailability();

    await loadAdminBarbers();

    await loadAdminCounts();

}


/* ==========================================
   Admin Reservations
========================================== */

async function loadAdminReservations() {

    const {
        data,
        error
    } = await supabase

        .from("reservations")

        .select("*")

        .order(
            "created_at",
            {
                ascending: false
            }
        );


    if (error) {

        throw error;

    }


    const reservations =
        data || [];


    const today =
        getTodayDate();


    document.getElementById(
        "adminTodayReservations"
    ).textContent =

        reservations.filter(
            item =>
                item.date === today
        ).length;


    document.getElementById(
        "adminTotalReservations"
    ).textContent =
        reservations.length;


    renderReservations(
        "adminReservations",
        reservations.slice(0, 30),
        {
            staff: true
        }
    );

}


/* ==========================================
   Admin Counts
========================================== */

async function loadAdminCounts() {

    const {
        count: customerCount
    } = await supabase

        .from("customers")

        .select(
            "id",
            {
                count: "exact",
                head: true
            }
        );


    document.getElementById(
        "adminTotalCustomers"
    ).textContent =
        customerCount || 0;


    const {
        count: barberCount
    } = await supabase

        .from("barbers")

        .select(
            "id",
            {
                count: "exact",
                head: true
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

}


/* ==========================================
   Admin Barbers
========================================== */

async function loadAdminBarbers() {

    const {
        data,
        error
    } = await supabase

        .from("barbers")

        .select(
            "id,name,active"
        )

        .eq(
            "active",
            true
        )

        .order(
            "name"
        );


    if (error) {

        console.error(
            "Barbers:",
            error
        );

        return;

    }


    const select =
        document.getElementById(
            "adminAvailabilityBarber"
        );


    if (!select) {
        return;
    }


    select.innerHTML = `

        <option value="">
            کل سالن
        </option>

    `;


    (data || []).forEach(
        barber => {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                barber.id;

            option.textContent =
                barber.name;

            select.appendChild(
                option
            );

        }
    );

}


/* ==========================================
   Availability - Barber
========================================== */

async function loadBarberAvailability() {

    const {
        data,
        error
    } = await supabase

        .from("availability_blocks")

        .select("*")

        .eq(
            "barber_id",
            currentBarberId
        )

        .eq(
            "active",
            true
        )

        .gte(
            "block_date",
            getTodayDate()
        )

        .order(
            "block_date",
            {
                ascending: true
            }
        )

        .order(
            "start_time",
            {
                ascending: true
            }
        );


    if (error) {

        console.error(
            "Barber availability:",
            error
        );

        renderAvailability(
            "barberAvailabilityList",
            []
        );

        return;

    }


    renderAvailability(
        "barberAvailabilityList",
        data || [],
        {
            barber: true
        }
    );

}


/* ==========================================
   Availability - Admin
========================================== */

async function loadAdminAvailability() {

    const {
        data,
        error
    } = await supabase

        .from("availability_blocks")

        .select(
            `
                *,
                barbers (
                    name
                )
            `
        )

        .eq(
            "active",
            true
        )

        .gte(
            "block_date",
            getTodayDate()
        )

        .order(
            "block_date",
            {
                ascending: true
            }
        )

        .order(
            "start_time",
            {
                ascending: true
            }
        );


    if (error) {

        console.error(
            "Admin availability:",
            error
        );

        renderAvailability(
            "adminAvailabilityList",
            []
        );

        return;

    }


    renderAvailability(
        "adminAvailabilityList",
        data || [],
        {
            admin: true
        }
    );

}


/* ==========================================
   Render Availability
========================================== */

function renderAvailability(
    containerId,
    items,
    options = {}
) {

    const container =
        document.getElementById(
            containerId
        );


    if (!container) {
        return;
    }


    if (!items.length) {

        container.innerHTML = `

            <div class="empty-state">

                <i class="fa-solid fa-calendar-check"></i>

                <p>
                    هنوز محدودیتی ثبت نشده است.
                </p>

            </div>

        `;

        return;

    }


    container.innerHTML = "";


    items.forEach(
        item => {

            const div =
                document.createElement(
                    "div"
                );


            div.className =
                "availability-item";


            const barberName =
                item.barbers?.name
                ||
                (
                    item.barber_id
                        ? "آرایشگر"
                        : "کل سالن"
                );


            const title =
                item.title
                ||
                getAvailabilityLabel(
                    item.block_type
                );


            const reason =
                item.reason
                ||
                "";


            const activeBadge =
                item.active
                    ? ""
                    : `
                        <span
                            class="availability-badge inactive"
                        >
                            غیرفعال
                        </span>
                    `;


            div.innerHTML = `

                <div class="availability-item-top">

                    <div class="availability-info">

                        <h4>
                            ${escapeHtml(title)}
                        </h4>

                        <p>
                            📅
                            ${escapeHtml(
                                formatDate(
                                    item.block_date
                                )
                            )}
                        </p>

                        <p>
                            🕒
                            ${escapeHtml(
                                formatAvailabilityTime(
                                    item
                                )
                            )}
                        </p>

                        <p>
                            👤
                            ${escapeHtml(
                                barberName
                            )}
                        </p>

                        ${
                            reason
                                ? `
                                    <p>
                                        📝
                                        ${escapeHtml(reason)}
                                    </p>
                                `
                                : ""
                        }

                    </div>


                    <div class="availability-badges">

                        <span
                            class="
                                availability-badge
                                ${escapeHtml(
                                    item.block_type
                                )}
                            "
                        >
                            ${escapeHtml(
                                getAvailabilityLabel(
                                    item.block_type
                                )
                            )}
                        </span>

                        ${activeBadge}

                    </div>

                </div>


                <div class="availability-controls">

                    <button
                        type="button"
                        class="availability-control"
                        data-availability-edit="${item.id}"
                    >
                        <i class="fa-solid fa-pen"></i>
                        ویرایش
                    </button>


                    <button
                        type="button"
                        class="availability-control"
                        data-availability-toggle="${item.id}"
                        data-active="${item.active ? "true" : "false"}"
                    >
                        <i class="fa-solid fa-power-off"></i>

                        ${
                            item.active
                                ? "غیرفعال کردن"
                                : "فعال کردن"
                        }

                    </button>


                    <button
                        type="button"
                        class="
                            availability-control
                            danger
                        "
                        data-availability-delete="${item.id}"
                    >
                        <i class="fa-solid fa-trash"></i>
                        حذف
                    </button>

                </div>

            `;


            container.appendChild(
                div
            );

        }
    );


    if (options.barber) {

        attachAvailabilityEvents(
            container,
            false
        );

    }


    if (options.admin) {

        attachAvailabilityEvents(
            container,
            true
        );

    }

}


/* ==========================================
   Availability Events
========================================== */

function attachAvailabilityEvents(
    container,
    isAdmin
) {

    container
        .querySelectorAll(
            "[data-availability-edit]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        editAvailability(
                            button.dataset.availabilityEdit,
                            isAdmin
                        );

                    }
                );

            }
        );


    container
        .querySelectorAll(
            "[data-availability-toggle]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        toggleAvailability(
                            button.dataset.availabilityToggle,
                            button.dataset.active === "true",
                            isAdmin
                        );

                    }
                );

            }
        );


    container
        .querySelectorAll(
            "[data-availability-delete]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        deleteAvailability(
                            button.dataset.availabilityDelete,
                            isAdmin
                        );

                    }
                );

            }
        );

}


/* ==========================================
   Get Availability By ID
========================================== */
            
