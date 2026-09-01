// ==========================================
// Salon Mojezeh
// supabase.js
// Central Supabase Client
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
// Create Client
// ==========================================

const supabase =
    createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
    );


// ==========================================
// Tables
// ==========================================

const TABLES = {

    reservations: "reservations",
    customers: "customers",
    barbers: "barbers",
    services: "services"

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
// Get Barbers
// ==========================================

async function getBarbers() {

    const {
        data,
        error
    } = await supabase

        .from(TABLES.barbers)

        .select(
            "id,name,role,image_url,active"
        )

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
// Get Services
// ==========================================

async function getServices() {

    const {
        data,
        error
    } = await supabase

        .from(TABLES.services)

        .select(
            "id,service_key,name,duration,image_url,active"
        )

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
// Get Booked Reservations
// ==========================================

async function loadBookedTimes(
    barberId,
    date
) {

    const {
        data,
        error
    } = await supabase

        .from(TABLES.reservations)

        .select(
            "time,service_duration"
        )

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
// Add Reservation
// ==========================================

async function addReservation(
    reservationData
) {

    const payload = {

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

        /*
         * PostgreSQL:
         * 23505 = duplicate key
         *
         * یعنی همان آرایشگر،
         * همان روز،
         * همان ساعت
         * قبلاً رزرو شده است.
         */

        if (
            error.code === "23505"
        ) {

            const duplicateError =
                new Error(
                    "این ساعت قبلاً رزرو شده است."
                );

            duplicateError.code =
                "already-exists";

            throw duplicateError;

        }


        throw error;

    }


    return data.id;

}


// ==========================================
// Find Customer
// ==========================================

async function getCustomer(
    phone
) {

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

        throw error;

    }


    return data || null;

}


// ==========================================
// Save Customer
// ==========================================

async function saveCustomer(
    reservationData
) {

    const existing =
        await getCustomer(
            reservationData.phone
        );


    // ======================================
    // New Customer
    // ======================================

    if (!existing) {

        const {
            data,
            error
        } = await supabase

            .from(TABLES.customers)

            .insert({

                first_name:
                    reservationData.firstName,

                last_name:
                    reservationData.lastName,

                phone:
                    reservationData.phone,

                visit_count:
                    1,

                favorite_model:
                    "",

                free_gift:
                    false,

                note:
                    "",

                last_visit:
                    reservationData.date,

                last_barber_id:
                    reservationData.barberId,

                last_barber_name:
                    reservationData.barberName,

                last_service:
                    reservationData.service

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

        .from(TABLES.customers)

        .update({

            first_name:
                reservationData.firstName,

            last_name:
                reservationData.lastName,

            last_visit:
                reservationData.date,

            last_barber_id:
                reservationData.barberId,

            last_barber_name:
                reservationData.barberName,

            last_service:
                reservationData.service,

            visit_count:
                Number(
                    existing.visit_count || 0
                ) + 1

        })

        .eq(
            "id",
            existing.id
        );


    if (error) {

        throw error;

    }


    return existing.id;

}


// ==========================================
// Get Reservations
// ==========================================

async function getReservations({

    startDate = null,
    endDate = null,
    barberId = null,
    status = null

} = {}) {

    let query =
        supabase

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
// Barber Reservations
// ==========================================

async function getBarberReservations(
    barberId,
    startDate,
    endDate
) {

    return getReservations({

        barberId,
        startDate,
        endDate

    });

}


// ==========================================
// All Reservations
// ==========================================

async function getAllReservations(
    startDate,
    endDate
) {

    return getReservations({

        startDate,
        endDate

    });

}


// ==========================================
// All Customers
// ==========================================

async function getAllCustomers() {

    const {
        data,
        error
    } = await supabase

        .from(TABLES.customers)

        .select("*")

        .order(
            "last_visit",
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
// Export
// ==========================================

export {

    supabase,

    TABLES,

    RESERVATION_STATUS,

    getBarbers,

    getServices,

    loadBookedTimes,

    addReservation,

    saveCustomer,

    getCustomer,

    getAllCustomers,

    getReservations,

    getBarberReservations,

    getAllReservations,

    cancelReservation,

    completeReservation

};


console.log(
    "Salon Mojezeh - Supabase Client Ready"
);
