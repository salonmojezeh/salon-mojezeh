// ==========================================
// Salon Mojezeh
// supabase.js
// Final Supabase Client & Booking API
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
// Create Supabase Client
// ==========================================

const supabase =
    createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
    );


// ==========================================
// Table Names
// ==========================================

const TABLES = {

    BARBERS: "barbers",

    SERVICES: "services",

    CUSTOMERS: "customers",

    RESERVATIONS: "reservations",

    BOOKING_SETTINGS: "booking_settings"

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

        .from(TABLES.BARBERS)

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

        .from(TABLES.SERVICES)

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

        .from(TABLES.BOOKING_SETTINGS)

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

        throw error;

    }


    /*
     * تنظیمات پیش‌فرض اضطراری
     *
     * اگر بعداً مشکلی در دیتابیس
     * پیش آمد، سیستم کاملاً خراب نمی‌شود.
     */

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

        .from(TABLES.CUSTOMERS)

        .select("*")

        .eq(
            "phone",
            phone
        )

        .maybeSingle();


    if (error) {

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

            .from(TABLES.CUSTOMERS)

            .insert({

                first_name:
                    customerData.firstName,

                last_name:
                    customerData.lastName,

                phone:
                    customerData.phone,

                visit_count:
                    0,

                favorite_model:
                    "",

                free_gift:
                    false,

                note:
                    "",

                last_visit:
                    null,

                last_barber_id:
                    null,

                last_barber_name:
                    "",

                last_service:
                    ""

            })

            .select("id")

            .single();


        if (error) {

            throw error;

        }


        return data.id;

    }


    // ======================================
    // Existing Customer
    // ======================================

    const {

        error

    } = await supabase

        .from(TABLES.CUSTOMERS)

        .update({

            first_name:
                customerData.firstName,

            last_name:
                customerData.lastName

        })

        .eq(
            "id",
            existingCustomer.id
        );


    if (error) {

        throw error;

    }


    return existingCustomer.id;

}


// ==========================================
// Get Booked Reservations
// ==========================================

async function getBookedReservations(
    barberId,
    date
) {

    const {

        data,
        error

    } = await supabase

        .from(TABLES.RESERVATIONS)

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


        // Barber

        barber_id:
            reservationData.barberId,

        barber_name:
            reservationData.barberName,


        // Service

        service_id:
            reservationData.serviceId,

        service:
            reservationData.service,

        service_duration:
            Number(
                reservationData.serviceDuration
            ),


        // Date & Time

        date:
            reservationData.date,

        display_date:
            reservationData.displayDate,

        time:
            reservationData.time,


        // Status

        status:
            RESERVATION_STATUS.RESERVED,

        source:
            "website"

    };


    const {

        data,
        error

    } = await supabase

        .from(TABLES.RESERVATIONS)

        .insert(payload)

        .select("id")

        .single();


    if (error) {

        /*
         * PostgreSQL Duplicate Error
         */

        if (error.code === "23505") {

            const duplicateError =
                new Error(
                    "این زمان قبلاً رزرو شده است."
                );

            duplicateError.code =
                "already-exists";

            throw duplicateError;

        }


        throw error;

    }


    return data;

}


// ==========================================
// Update Customer After Reservation
// ==========================================

async function updateCustomerAfterReservation(
    customerId,
    reservationData
) {

    const existingCustomer =
        await supabase

            .from(TABLES.CUSTOMERS)

            .select(
                "visit_count"
            )

            .eq(
                "id",
                customerId
            )

            .single();


    if (existingCustomer.error) {

        throw existingCustomer.error;

    }


    const currentVisitCount =
        Number(
            existingCustomer.data.visit_count || 0
        );


    const {

        error

    } = await supabase

        .from(TABLES.CUSTOMERS)

        .update({

            visit_count:
                currentVisitCount + 1,

            last_visit:
                reservationData.date,

            last_barber_id:
                reservationData.barberId,

            last_barber_name:
                reservationData.barberName,

            last_service:
                reservationData.service

        })

        .eq(
            "id",
            customerId
        );


    if (error) {

        throw error;

    }


    return true;

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

        .from(TABLES.RESERVATIONS)

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

        .from(TABLES.RESERVATIONS)

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
// Get Reservations
// Admin / Future Panel
// ==========================================

async function getReservations({

    startDate = null,

    endDate = null,

    barberId = null,

    status = null

} = {}) {

    let query =

        supabase

            .from(TABLES.RESERVATIONS)

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
// Get All Customers
// Future Admin Panel
// ==========================================

async function getAllCustomers() {

    const {

        data,
        error

    } = await supabase

        .from(TABLES.CUSTOMERS)

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


    return data || [];

}


// ==========================================
// Export
// ==========================================

export {

    supabase,

    TABLES,

    RESERVATION_STATUS,


    // Dynamic Booking Data

    getBarbers,

    getServices,

    getBookingSettings,


    // Customers

    getCustomerByPhone,

    saveCustomer,

    updateCustomerAfterReservation,


    // Reservations

    getBookedReservations,

    createReservation,

    getReservations,

    cancelReservation,

    completeReservation,


    // Admin

    getAllCustomers

};


console.log(
    "Salon Mojezeh Supabase system ready."
);
