// ==========================================
// Salon Mojezeh
// supabase.js
// Final Reservation Database Layer
// ==========================================

"use strict";

import { createClient } from
    "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";


// ==========================================
// Supabase Configuration
// ==========================================

const SUPABASE_URL =
    "https://erfzhyvraenceykiwlci.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_uRbq30GBNHcXwGrinzhx1Q_5-egxs5_";


// ==========================================
// Supabase Client
// ==========================================

const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);


// ==========================================
// Table Names
// ==========================================

const TABLES = {

    barbers: "barbers",

    services: "services",

    customers: "customers",

    reservations: "reservations",

    bookingSettings: "booking_settings"

};


// ==========================================
// Reservation Status
// ==========================================

const RESERVATION_STATUS = {

    RESERVED: "reserved",

    CANCELLED: "cancelled",

    COMPLETED: "completed",

    NO_SHOW: "no_show"

};


// ==========================================
// Get Active Barbers
// ==========================================

async function getBarbers() {

    const {
        data,
        error
    } = await supabase

        .from(TABLES.barbers)

        .select(`
            id,
            name,
            role,
            image_url,
            active,
            created_at
        `)

        .eq(
            "active",
            true
        )

        .order(
            "created_at",
            {
                ascending: true
            }
        );


    if (error) {

        console.error(
            "getBarbers error:",
            error
        );

        throw error;

    }


    return data || [];

}


// ==========================================
// Get Active Services
// ==========================================

async function getServices() {

    const {
        data,
        error
    } = await supabase

        .from(TABLES.services)

        .select(`
            id,
            service_key,
            name,
            duration,
            image_url,
            active,
            created_at
        `)

        .eq(
            "active",
            true
        )

        .order(
            "created_at",
            {
                ascending: true
            }
        );


    if (error) {

        console.error(
            "getServices error:",
            error
        );

        throw error;

    }


    return data || [];

}


// ==========================================
// Get Booking Settings
// ==========================================

async function getBookingSettings() {

    const {
        data,
        error
    } = await supabase

        .from(TABLES.bookingSettings)

        .select(`
            id,
            opening_time,
            closing_time,
            slot_interval,
            booking_days_ahead,
            active
        `)

        .eq(
            "active",
            true
        )

        .limit(1)

        .maybeSingle();


    if (error) {

        console.error(
            "getBookingSettings error:",
            error
        );

        throw error;

    }


    // تنظیمات پیش‌فرض در صورت مشکل
    if (!data) {

        return {

            opening_time: "09:00:00",

            closing_time: "21:00:00",

            slot_interval: 30,

            booking_days_ahead: 30,

            active: true

        };

    }


    return data;

}


// ==========================================
// Get Customer By Phone
// ==========================================

async function getCustomerByPhone(phone) {

    const {
        data,
        error
    } = await supabase

        .from(TABLES.customers)

        .select("*")

        .eq(
            "phone",
            phone
        )

        .maybeSingle();


    if (error) {

        console.error(
            "getCustomerByPhone error:",
            error
        );

        throw error;

    }


    return data || null;

}


// ==========================================
// Create Or Update Customer
// ==========================================

async function saveCustomer(customerData) {

    const existingCustomer =
        await getCustomerByPhone(
            customerData.phone
        );


    // ======================================
    // New Customer
    // ======================================

    if (!existingCustomer) {

        const {
            data,
            error
        } = await supabase

            .from(TABLES.customers)

            .insert({

                first_name:
                    customerData.firstName,

                last_name:
                    customerData.lastName,

                phone:
                    customerData.phone,

                visit_count: 0,

                favorite_model: "",

                free_gift: false,

                note: "",

                last_visit:
                    customerData.date || null,

                last_barber_id:
                    customerData.barberId || null,

                last_barber_name:
                    customerData.barberName || null,

                last_service:
                    customerData.service || null

            })

            .select("id")

            .single();


        if (error) {

            console.error(
                "Create customer error:",
                error
            );

            throw error;

        }


        return data.id;

    }


    // ======================================
    // Existing Customer
    // ======================================

    const {
        data,
        error
    } = await supabase

        .from(TABLES.customers)

        .update({

            first_name:
                customerData.firstName,

            last_name:
                customerData.lastName,

            last_visit:
                customerData.date || null,

            last_barber_id:
                customerData.barberId || null,

            last_barber_name:
                customerData.barberName || null,

            last_service:
                customerData.service || null,

            updated_at:
                new Date().toISOString()

        })

        .eq(
            "id",
            existingCustomer.id
        )

        .select("id")

        .single();


    if (error) {

        console.error(
            "Update customer error:",
            error
        );

        throw error;

    }


    return data.id;

}


// ==========================================
// Get Reservations Of Barber And Date
// ==========================================

async function getBarberDayReservations(
    barberId,
    date
) {

    const {
        data,
        error
    } = await supabase

        .from(TABLES.reservations)

        .select(`
            id,
            time,
            service_duration,
            status
        `)

        .eq(
            "barber_id",
            barberId
        )

        .eq(
            "date",
            date
        )

        .eq(
            "status",
            RESERVATION_STATUS.RESERVED
        );


    if (error) {

        console.error(
            "getBarberDayReservations error:",
            error
        );

        throw error;

    }


    return data || [];

}


// ==========================================
// Create Reservation
// ==========================================

async function createReservation(
    reservationData
) {

    const payload = {

        customer_id:
            reservationData.customerId,

        first_name:
            reservationData.firstName,

        last_name:
            reservationData.lastName,

        phone:
            reservationData.phone,

        barber_id:
            reservationData.barberId,

        barber_name:
            reservationData.barberName,

        service_id:
            reservationData.serviceId,

        service:
            reservationData.service,

        service_duration:
            Number(
                reservationData.serviceDuration
            ),

        date:
            reservationData.date,

        display_date:
            reservationData.displayDate,

        time:
            reservationData.time,

        status:
            RESERVATION_STATUS.RESERVED,

        source:
            "website"

    };


    const {
        data,
        error
    } = await supabase

        .from(TABLES.reservations)

        .insert(payload)

        .select("id")

        .single();


    if (error) {

        console.error(
            "createReservation error:",
            error
        );


        // Duplicate / Conflict
        if (
            error.code === "23505"
        ) {

            const conflictError =
                new Error(
                    "این ساعت قبلاً رزرو شده است."
                );

            conflictError.code =
                "reservation-conflict";

            throw conflictError;

        }


        throw error;

    }


    return data.id;

}


// ==========================================
// Get All Reservations
// ==========================================

async function getReservations({

    startDate = null,

    endDate = null,

    barberId = null,

    status = null

} = {}) {

    let query = supabase

        .from(TABLES.reservations)

        .select("*");


    if (startDate) {

        query =
            query.gte(
                "date",
                startDate
            );

    }


    if (endDate) {

        query =
            query.lte(
                "date",
                endDate
            );

    }


    if (barberId) {

        query =
            query.eq(
                "barber_id",
                barberId
            );

    }


    if (status) {

        query =
            query.eq(
                "status",
                status
            );

    }


    const {
        data,
        error
    } = await query

        .order(
            "date",
            {
                ascending: true
            }
        )

        .order(
            "time",
            {
                ascending: true
            }
        );


    if (error) {

        throw error;

    }


    return data || [];

}


// ==========================================
// Cancel Reservation
// ==========================================

async function cancelReservation(
    reservationId
) {

    const {
        error
    } = await supabase

        .from(TABLES.reservations)

        .update({

            status:
                RESERVATION_STATUS.CANCELLED,

            cancelled_at:
                new Date().toISOString()

        })

        .eq(
            "id",
            reservationId
        );


    if (error) {

        throw error;

    }


    return true;

}


// ==========================================
// Complete Reservation
// ==========================================

async function completeReservation(
    reservationId
) {

    const {
        error
    } = await supabase

        .from(TABLES.reservations)

        .update({

            status:
                RESERVATION_STATUS.COMPLETED,

            completed_at:
                new Date().toISOString()

        })

        .eq(
            "id",
            reservationId
        );


    if (error) {

        throw error;

    }


    return true;

}

// ==========================================
// Authentication
// ==========================================

// دریافت کاربر وارد شده

async function getCurrentUser() {

    const {
        data,
        error
    } = await supabase.auth.getUser();


    if (error) {

        console.error(
            "getCurrentUser error:",
            error
        );

        return null;

    }


    return data.user || null;

}



// ==========================================
// دریافت پروفایل کاربر
// ==========================================

async function getCurrentUserProfile() {

    const user =
        await getCurrentUser();


    if (!user) {

        return null;

    }


    const {
        data,
        error
    } = await supabase

        .from("user_profiles")

        .select(`
            id,
            role,
            is_admin,
            barber_id,
            customer_id,
            active,
            created_at,
            updated_at
        `)

        .eq(
            "id",
            user.id
        )

        .maybeSingle();


    if (error) {

        console.error(
            "getCurrentUserProfile error:",
            error
        );

        throw error;

    }


    if (!data) {

        return null;

    }


    return {

        ...data,

        user

    };

}



// ==========================================
// دریافت اطلاعات آرایشگر فعلی
// ==========================================

async function getCurrentBarber() {

    const profile =
        await getCurrentUserProfile();


    if (
        !profile ||
        !profile.barber_id
    ) {

        return null;

    }


    const {
        data,
        error
    } = await supabase

        .from(TABLES.barbers)

        .select("*")

        .eq(
            "id",
            profile.barber_id
        )

        .maybeSingle();


    if (error) {

        console.error(
            "getCurrentBarber error:",
            error
        );

        throw error;

    }


    return data || null;

}



// ==========================================
// خروج از حساب
// ==========================================

async function signOutUser() {

    const {
        error
    } = await supabase.auth.signOut();


    if (error) {

        console.error(
            "signOut error:",
            error
        );

        throw error;

    }


    return true;

}
// ==========================================
// Export
// ==========================================
export {

    // Supabase
    supabase,

    // Constants
    TABLES,

    RESERVATION_STATUS,


    // Authentication
    getCurrentUser,

    getCurrentUserProfile,

    getCurrentBarber,

    signOutUser,


    // Barbers
    getBarbers,


    // Services
    getServices,


    // Settings
    getBookingSettings,


    // Customers
    getCustomerByPhone,

    saveCustomer,


    // Reservations
    getBarberDayReservations,

    createReservation,

    getReservations,

    cancelReservation,

    completeReservation

};
