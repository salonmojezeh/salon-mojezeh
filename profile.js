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
        
async function getAvailabilityById(id) {

    const {
        data,
        error
    } = await supabase

        .from("availability_blocks")

        .select("*")

        .eq(
            "id",
            id
        )

        .maybeSingle();


    if (error) {

        throw error;

    }


    return data;

}


/* ==========================================
   Edit Availability
========================================== */

async function editAvailability(
    id,
    isAdmin
) {

    try {

        const item =
            await getAvailabilityById(
                id
            );


        if (!item) {

            alert(
                "این محدودیت پیدا نشد."
            );

            return;

        }


        if (isAdmin) {

            document.getElementById(
                "adminAvailabilityId"
            ).value =
                item.id;

            document.getElementById(
                "adminAvailabilityBarber"
            ).value =
                item.barber_id || "";

            document.getElementById(
                "adminAvailabilityDate"
            ).value =
                item.block_date;

            document.getElementById(
                "adminAvailabilityType"
            ).value =
                item.block_type;

            document.getElementById(
                "adminAvailabilityStart"
            ).value =
                item.start_time || "";

            document.getElementById(
                "adminAvailabilityEnd"
            ).value =
                item.end_time || "";

            document.getElementById(
                "adminAvailabilityTitle"
            ).value =
                item.title || "";

            document.getElementById(
                "adminAvailabilityReason"
            ).value =
                item.reason || "";


            document.getElementById(
                "adminAvailabilityCancelEditBtn"
            ).classList.remove("hidden");


            showMessage(
                document.getElementById(
                    "adminAvailabilityMessage"
                ),
                "در حال ویرایش محدودیت...",
                ""
            );


            window.scrollTo({
                top:
                    document.getElementById(
                        "adminAvailabilityForm"
                    ).offsetTop - 120,
                behavior: "smooth"
            });


        } else {

            document.getElementById(
                "availabilityId"
            ).value =
                item.id;

            document.getElementById(
                "availabilityDate"
            ).value =
                item.block_date;

            document.getElementById(
                "availabilityType"
            ).value =
                item.block_type;

            document.getElementById(
                "availabilityStart"
            ).value =
                item.start_time || "";

            document.getElementById(
                "availabilityEnd"
            ).value =
                item.end_time || "";

            document.getElementById(
                "availabilityTitle"
            ).value =
                item.title || "";

            document.getElementById(
                "availabilityReason"
            ).value =
                item.reason || "";


            document.getElementById(
                "availabilityCancelEditBtn"
            ).classList.remove("hidden");


            showMessage(
                document.getElementById(
                    "availabilityMessage"
                ),
                "در حال ویرایش محدودیت...",
                ""
            );


            window.scrollTo({
                top:
                    document.getElementById(
                        "availabilityForm"
                    ).offsetTop - 120,
                behavior: "smooth"
            });

        }

    }

    catch (error) {

        console.error(error);

        alert(
            "دریافت اطلاعات محدودیت انجام نشد."
        );

    }

}


/* ==========================================
   Save Availability
========================================== */

async function saveAvailability(
    form,
    isAdmin
) {

    const prefix =
        isAdmin
            ? "admin"
            : "";


    const id =
        document.getElementById(
            `${prefix}AvailabilityId`
        ).value;


    const barberId =
        isAdmin
            ? (
                document.getElementById(
                    "adminAvailabilityBarber"
                ).value
                ||
                null
            )
            : currentBarberId;


    const date =
        document.getElementById(
            `${prefix}AvailabilityDate`
        ).value;


    const type =
        document.getElementById(
            `${prefix}AvailabilityType`
        ).value;


    const start =
        document.getElementById(
            `${prefix}AvailabilityStart`
        ).value
        ||
        null;


    const end =
        document.getElementById(
            `${prefix}AvailabilityEnd`
        ).value
        ||
        null;


    const title =
        document.getElementById(
            `${prefix}AvailabilityTitle`
        ).value.trim()
        ||
        null;


    const reason =
        document.getElementById(
            `${prefix}AvailabilityReason`
        ).value.trim()
        ||
        null;


    const message =
        document.getElementById(
            `${prefix}AvailabilityMessage`
        );


    if (!date) {

        showMessage(
            message,
            "لطفاً تاریخ را انتخاب کنید.",
            "error"
        );

        return;

    }


    if (
        start
        &&
        end
        &&
        start >= end
    ) {

        showMessage(
            message,
            "ساعت پایان باید بعد از ساعت شروع باشد.",
            "error"
        );

        return;

    }


    if (
        type === "closed"
        ||
        type === "holiday"
        ||
        type === "leave"
    ) {

        /*
           برای تعطیلی کامل بهتر است ساعت‌ها خالی باشند.
        */

        if (
            start
            ||
            end
        ) {

            showMessage(
                message,
                "برای تعطیلی کامل، مناسبتی یا مرخصی، ساعت‌ها را خالی بگذارید.",
                "error"
            );

            return;

        }

    }


    const payload = {

        barber_id:
            barberId,

        block_date:
            date,

        start_time:
            start,

        end_time:
            end,

        block_type:
            type,

        title:
            title,

        reason:
            reason,

        active:
            true

    };


    try {

        const saveButton =
            document.getElementById(
                `${prefix}AvailabilitySaveBtn`
            );


        saveButton.disabled =
            true;


        showMessage(
            message,
            "در حال ذخیره...",
            ""
        );


        let error = null;


        if (id) {

            const result =
                await supabase

                    .from("availability_blocks")

                    .update(
                        payload
                    )

                    .eq(
                        "id",
                        id
                    );


            error =
                result.error;

        } else {

            const result =
                await supabase

                    .from("availability_blocks")

                    .insert(
                        [
                            {
                                ...payload,

                                created_by:
                                    currentUser.id
                            }
                        ]
                    );


            error =
                result.error;

        }


        if (error) {

            throw error;

        }


        showMessage(
            message,
            "محدودیت با موفقیت ذخیره شد.",
            "success"
        );


        resetAvailabilityForm(
            isAdmin
        );


        if (isAdmin) {

            await loadAdminAvailability();

        } else {

            await loadBarberAvailability();

        }

    }

    catch (error) {

        console.error(
            "Save availability:",
            error
        );


        showMessage(
            message,
            mapAvailabilityError(
                error
            ),
            "error"
        );

    }

    finally {

        const saveButton =
            document.getElementById(
                `${prefix}AvailabilitySaveBtn`
            );


        if (saveButton) {

            saveButton.disabled =
                false;

        }

    }

}


/* ==========================================
   Availability Error
========================================== */
       
function mapAvailabilityError(error) {

    const message =
        error?.message
        ||
        "";


    if (
        message.includes(
            "duplicate"
        )
    ) {

        return "این محدودیت قبلاً ثبت شده است.";

    }


    if (
        message.includes(
            "row-level security"
        )
        ||
        message.includes(
            "permission denied"
        )
    ) {

        return "دسترسی ثبت این محدودیت مجاز نیست.";

    }


    return (
        message
        ||
        "ثبت محدودیت انجام نشد."
    );

}


/* ==========================================
   Reset Availability Form
========================================== */

function resetAvailabilityForm(
    isAdmin
) {

    const prefix =
        isAdmin
            ? "admin"
            : "";


    const form =
        document.getElementById(
            `${prefix}AvailabilityForm`
        );


    if (form) {

        form.reset();

    }


    document.getElementById(
        `${prefix}AvailabilityId`
    ).value =
        "";


    document.getElementById(
        `${prefix}AvailabilityCancelEditBtn`
    )?.classList.add(
        "hidden"
    );


    showMessage(
        document.getElementById(
            `${prefix}AvailabilityMessage`
        ),
        "",
        ""
    );

}


/* ==========================================
   Toggle Availability
========================================== */

async function toggleAvailability(
    id,
    currentlyActive,
    isAdmin
) {

    try {

        const {
            error
        } = await supabase

            .from("availability_blocks")

            .update({
                active:
                    !currentlyActive
            })

            .eq(
                "id",
                id
            );


        if (error) {

            throw error;

        }


        if (isAdmin) {

            await loadAdminAvailability();

        } else {

            await loadBarberAvailability();

        }

    }

    catch (error) {

        console.error(error);

        alert(
            "تغییر وضعیت محدودیت انجام نشد."
        );

    }

}


/* ==========================================
   Delete Availability
========================================== */

async function deleteAvailability(
    id,
    isAdmin
) {

    const confirmed =
        confirm(
            "آیا مطمئن هستید که می‌خواهید این محدودیت حذف شود؟"
        );


    if (!confirmed) {
        return;
    }


    try {

        const {
            error
        } = await supabase

            .from("availability_blocks")

            .delete()

            .eq(
                "id",
                id
            );


        if (error) {

            throw error;

        }


        if (isAdmin) {

            await loadAdminAvailability();

        } else {

            await loadBarberAvailability();

        }

    }

    catch (error) {

        console.error(error);

        alert(
            "حذف محدودیت انجام نشد."
        );

    }

}


/* ==========================================
   Render Reservations
========================================== */

function renderReservations(
    containerId,
    reservations,
    options = {}
) {

    const container =
        document.getElementById(
            containerId
        );


    if (!container) {
        return;
    }


    if (
        !reservations
        ||
        !reservations.length
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


    container.innerHTML = "";


    reservations.forEach(
        item => {

            const status =
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

                ||

                item.customer_name

                ||

                "مشتری";


            const service =
                item.service
                ||
                item.service_name
                ||
                "---";


            const barber =
                item.barber_name
                ||
                "---";


            const dateText =
                item.display_date
                ||
                formatDate(
                    item.date
                );


            const time =
                item.time
                ||
                "---";


            const div =
                document.createElement(
                    "div"
                );


            div.className =
                "reservation-item";


            const canManage =
                options.staff
                &&
                item.status ===
                    RESERVATION_STATUS.RESERVED;


            div.innerHTML = `

                <div class="reservation-main">

                    <h4>
                        ${escapeHtml(fullName)}
                    </h4>

                    <p>
                        ✂️
                        ${escapeHtml(service)}
                    </p>

                    <p>
                        📅
                        ${escapeHtml(dateText)}

                        |

                        🕒
                        ${escapeHtml(time)}
                    </p>

                    <p>
                        👤
                        ${escapeHtml(barber)}
                    </p>

                    ${
                        canManage
                            ? `

                                <div
                                    class="reservation-actions"
                                >

                                    <button
                                        type="button"
                                        class="
                                            reservation-action
                                            success
                                        "
                                        data-reservation-complete="${item.id}"
                                    >
                                        <i class="fa-solid fa-check"></i>
                                        انجام شد
                                    </button>


                                    <button
                                        type="button"
                                        class="
                                            reservation-action
                                            danger
                                        "
                                        data-reservation-cancel="${item.id}"
                                    >
                                        <i class="fa-solid fa-xmark"></i>
                                        لغو
                                    </button>


                                    <button
                                        type="button"
                                        class="reservation-action"
                                        data-reservation-noshow="${item.id}"
                                    >
                                        <i class="fa-solid fa-user-xmark"></i>
                                        عدم مراجعه
                                    </button>

                                </div>

                            `
                            : ""
                    }

                </div>


                <span
                    class="
                        reservation-status
                        ${status.className}
                    "
                >
                    ${escapeHtml(status.label)}
                </span>

            `;


            container.appendChild(
                div
            );

        }
    );


    if (options.staff) {

        attachReservationEvents(
            container
        );

    }


    if (options.customer) {

        attachCustomerReservationEvents(
            container
        );

    }

}


/* ==========================================
   Staff Reservation Actions
=
function attachReservationEvents(
    container
) {

    container
        .querySelectorAll(
            "[data-reservation-complete]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    async () => {

                        await reservationAction(
                            button.dataset.reservationComplete,
                            "complete"
                        );

                    }
                );

            }
        );


    container
        .querySelectorAll(
            "[data-reservation-cancel]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    async () => {

                        await reservationAction(
                            button.dataset.reservationCancel,
                            "cancel"
                        );

                    }
                );

            }
        );


    container
        .querySelectorAll(
            "[data-reservation-noshow]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    async () => {

                        await reservationAction(
                            button.dataset.reservationNoshow,
                            "no_show"
                        );

                    }
                );

            }
        );

}


/* ==========================================
   Customer Reservation Actions
========================================== */

function attachCustomerReservationEvents(
    container
) {

    /*
       مشتری فقط بتواند رزرو فعال آینده را لغو کند.
    */

    container
        .querySelectorAll(
            "[data-customer-cancel]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    async () => {

                        await reservationAction(
                            button.dataset.customerCancel,
                            "cancel"
                        );

                    }
                );

            }
        );

}


/* ==========================================
   Reservation Action
========================================== */

async function reservationAction(
    reservationId,
    action
) {

    let message =
        "";


    if (action === "complete") {

        message =
            "آیا این نوبت انجام شده است؟";

    }

    if (action === "cancel") {

        message =
            "آیا از لغو این نوبت مطمئن هستید؟";

    }

    if (action === "no_show") {

        message =
            "آیا مشتری در این نوبت مراجعه نکرده است؟";

    }


    if (!confirm(message)) {

        return;

    }


    try {

        if (action === "complete") {

            await completeReservation(
                reservationId
            );

        }

        else if (action === "cancel") {

            await cancelReservation(
                reservationId
            );

        }

        else if (action === "no_show") {

            await markReservationNoShow(
                reservationId
            );

        }


        if (currentRole === "admin") {

            await loadAdminReservations();

        }

        else if (currentRole === "barber") {

            await loadBarberReservations();

        }

        else if (currentRole === "customer") {

            const profile =
                await getCurrentUserProfile();

            if (
                profile?.customer_id
            ) {

                await loadCustomerReservations(
                    profile.customer_id
                );

            }

        }

    }

    catch (error) {

        console.error(
            "Reservation action:",
            error
        );

        alert(
            error?.message
            ||
            "عملیات روی رزرو انجام نشد."
        );

    }

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


    if (!container) {
        return;
    }


    if (!customers.length) {

        container.innerHTML = `

            <div class="empty-state">

                <i class="fa-solid fa-users"></i>

                <p>
                    هنوز مشتری ثبت نشده است.
                </p>

            </div>

        `;

        return;

    }


    container.innerHTML = "";


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
                    ✂️
                    تعداد مراجعات:
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
   Form Events
========================================== */

const availabilityForm =
    document.getElementById(
        "availabilityForm"
    );


availabilityForm?.addEventListener(
    "submit",
    event => {

        event.preventDefault();

        saveAvailability(
            availabilityForm,
            false
        );

    }
);


const adminAvailabilityForm =
    document.getElementById(
        "adminAvailabilityForm"
    );


adminAvailabilityForm?.addEventListener(
    "submit",
    event => {

        event.preventDefault();

        saveAvailability(
            adminAvailabilityForm,
            true
        );

    }
);


/* ==========================================
   Cancel Edit
========================================== */

document
    .getElementById(
        "availabilityCancelEditBtn"
    )
    ?.addEventListener(
        "click",
        () => {

            resetAvailabilityForm(
                false
            );

        }
    );


document
    .getElementById(
        "adminAvailabilityCancelEditBtn"
    )
    ?.addEventListener(
        "click",
        () => {

            resetAvailabilityForm(
                true
            );

        }
    );


/* ==========================================
   Refresh
========================================== */

document
    .getElementById(
        "availabilityRefreshBtn"
    )
    ?.addEventListener(
        "click",
        async () => {

            await loadBarberAvailability();

        }
    );


document
    .getElementById(
        "adminAvailabilityRefreshBtn"
    )
    ?.addEventListener(
        "click",
        async () => {

            await loadAdminAvailability();

        }
    );


document
    .getElementById(
        "barberRefreshBtn"
    )
    ?.addEventListener(
        "click",
        async () => {

            await loadBarberReservations();

            await loadBarberCustomers();

        }
    );


document
    .getElementById(
        "adminRefreshBtn"
    )
    ?.addEventListener(
        "click",
        async () => {

            await loadAdminReservations();

            await loadAdminCounts();

        }
    );


document
    .getElementById(
        "customerRefreshBtn"
    )
    ?.addEventListener(
        "click",
        async () => {

            if (
                currentProfile?.customer_id
            ) {

                await loadCustomerReservations(
                    currentProfile.customer_id
                );

            }

        }
    );


/* ==========================================
   Logout
========================================== */

logoutBtn?.addEventListener(
    "click",
    async () => {

        if (
            !confirm(
                "آیا مطمئن هستید که می‌خواهید از حساب خود خارج شوید؟"
            )
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

        catch (error) {

            console.error(
                "Logout:",
                error
            );

            alert(
                "خطایی در خروج از حساب رخ داد."
            );

            logoutBtn.disabled =
                false;

        }

    }
);


/* ==========================================
   Start
========================================== */

loadProfile();
