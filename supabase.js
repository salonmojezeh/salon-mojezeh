// ==========================================
// Salon Mojezeh
// supabase.js
// Central Database Layer
// ==========================================

"use strict";

import { createClient } from
    "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";


// ==========================================
// Supabase Configuration
// ==========================================

const SUPABASE_URL =
    "https://erfzhyvraenceykiwlci.supabase.co";

const SUPABASE_ANON_KEY =
    "کلید publishable خودت را اینجا قرار بده";


// ==========================================
// Supabase Client
// ==========================================

export const supabase =
    createClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY,
        {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true
            }
        }
    );


// ==========================================
// Table Names
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

export const RESERVATION_STATUS = {

    RESERVED: "reserved",

    CANCELLED: "cancelled",

    COMPLETED: "completed",

    NO_SHOW: "no_show"

};


// ==========================================
// Working Hours
// ==========================================

export const WORKING_HOURS = [

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
// Services
// ==========================================

export const DEFAULT_SERVICES = [

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

];


// ==========================================
// Default Barbers
// ==========================================

export const DEFAULT_BARBERS = [

    {
        id: "artin",
        name: "آرتین",
        role: "آرایشگر",
        active: true
    },

    {
        id: "barber2",
        name: "آرایشگر دوم",
        role: "آرایشگر",
        active: true
    }

];


// ==========================================
// Utility
// ==========================================

function throwIfError(error) {

    if (error) {

        console.error(
            "Supabase Error:",
            error
        );

        throw error;

    }

}


// ==========================================
// Test Connection
// ==========================================

export async function testSupabaseConnection() {

    const { error } =
        await supabase
            .from(TABLES.reservations)
            .select("id")
            .limit(1);

    throwIfError(error);

    return true;

}


// ==========================================
// GET BOOKINGS FOR BARBER + DATE
// ==========================================

export async function getReservationsForDate(
    barberId,
    date
) {

    const { data, error } =
        await supabase
            .from(TABLES.reservations)
            .select(`
                id,
                first_name,
                last_name,
                phone,
                barber_id,
                barber_name,
                service,
                service_duration,
                date,
                display_date,
                time,
                status,
                source,
                created_at,
                cancelled_at
            `)
            .eq(
                "barber_id",
                barberId
            )
            .eq(
                "date",
                date
            )
            .order(
                "time",
                {
                    ascending: true
                }
            );

    throwIfError(error);

    return data || [];

}


// ==========================================
// GET BOOKED TIMES
// ==========================================

export async function loadBookedTimes(
    barberId,
    date
) {

    const reservations =
        await getReservationsForDate(
            barberId,
            date
        );


    return reservations

        .filter(
            reservation =>
                reservation.status ===
                RESERVATION_STATUS.RESERVED
        )

        .map(
            reservation =>
                reservation.time
        );

}


// ==========================================
// GET ALL RESERVATIONS
// ==========================================

export async function getAllReservations(
    startDate = null,
    endDate = null
) {

    let query =
        supabase
            .from(TABLES.reservations)
            .select("*")
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


    const { data, error } =
        await query;


    throwIfError(error);

    return data || [];

}


// ==========================================
// GET SINGLE RESERVATION
// ==========================================

export async function getReservation(
    reservationId
) {

    const { data, error } =
        await supabase
            .from(TABLES.reservations)
            .select("*")
            .eq(
                "id",
                reservationId
            )
            .maybeSingle();

    throwIfError(error);

    return data || null;

}


// ==========================================
// ADD RESERVATION
// ==========================================

export async function addReservation(
    reservationData
) {

    const reservation = {

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


    /*
     * قبل از ثبت، یک بررسی اولیه انجام می‌دهیم.
     *
     * این بررسی برای UX است.
     * جلوگیری قطعی از دوباره‌رزرو باید
     * در خود دیتابیس نیز enforce شود.
     */

    const existing =
        await supabase
            .from(TABLES.reservations)
            .select("id,status")
            .eq(
                "barber_id",
                reservation.barber_id
            )
            .eq(
                "date",
                reservation.date
            )
            .eq(
                "time",
                reservation.time
            )
            .eq(
                "status",
                RESERVATION_STATUS.RESERVED
            )
            .limit(1);


    throwIfError(existing.error);


    if (
        existing.data &&
        existing.data.length > 0
    ) {

        const error =
            new Error(
                "این ساعت قبلاً رزرو شده است."
            );

        error.code =
            "already-exists";

        throw error;

    }


    const { data, error } =
        await supabase
            .from(TABLES.reservations)
            .insert(
                reservation
            )
            .select()
            .single();


    /*
     * اگر در دیتابیس برای
     * آرایشگر + تاریخ + ساعت
     * Unique Constraint بسازیم،
     * خطای duplicate نیز اینجا
     * قابل تشخیص خواهد بود.
     */

    if (error) {

        const message =
            String(
                error.message || ""
            ).toLowerCase();


        if (
            error.code === "23505" ||
            message.includes(
                "duplicate"
            ) ||
            message.includes(
                "unique"
            )
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


    return data;

}


// ==========================================
// CANCEL RESERVATION
// ==========================================

export async function cancelReservation(
    reservationId
) {

    const { data, error } =
        await supabase
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
            )
            .select()
            .single();


    throwIfError(error);

    return data;

}


// ==========================================
// COMPLETE RESERVATION
// ==========================================

export async function completeReservation(
    reservationId
) {

    const { data, error } =
        await supabase
            .from(TABLES.reservations)
            .update({

                status:
                    RESERVATION_STATUS.COMPLETED

            })
            .eq(
                "id",
                reservationId
            )
            .select()
            .single();


    throwIfError(error);

    return data;

}


// ==========================================
// MARK NO-SHOW
// ==========================================

export async function markReservationNoShow(
    reservationId
) {

    const { data, error } =
        await supabase
            .from(TABLES.reservations)
            .update({

                status:
                    RESERVATION_STATUS.NO_SHOW

            })
            .eq(
                "id",
                reservationId
            )
            .select()
            .single();


    throwIfError(error);

    return data;

}


// ==========================================
// CUSTOMER
// ==========================================

export async function getCustomer(
    phone
) {

    const { data, error } =
        await supabase
            .from(TABLES.customers)
            .select("*")
            .eq(
                "phone",
                phone
            )
            .maybeSingle();


    throwIfError(error);

    return data || null;

}


// ==========================================
// SAVE CUSTOMER
// ==========================================

export async function saveCustomer(
    reservationData
) {

    const existing =
        await getCustomer(
            reservationData.phone
        );


    /*
     * فعلاً ساختار را با
     * ستون‌های پایه نگه می‌داریم.
     *
     * وقتی جدول customers را نهایی کردیم،
     * فیلدهای باشگاه مشتریان را نیز
     * به همین تابع اضافه می‌کنیم.
     */


    if (!existing) {

        const customer = {

            first_name:
                reservationData.firstName,

            last_name:
                reservationData.lastName,

            phone:
                reservationData.phone

        };


        const { data, error } =
            await supabase
                .from(TABLES.customers)
                .insert(
                    customer
                )
                .select()
                .single();


        throwIfError(error);

        return data;

    }


    const { data, error } =
        await supabase
            .from(TABLES.customers)
            .update({

                first_name:
                    reservationData.firstName,

                last_name:
                    reservationData.lastName

            })
            .eq(
                "phone",
                reservationData.phone
            )
            .select()
            .single();


    throwIfError(error);

    return data;

}


// ==========================================
// GET ALL CUSTOMERS
// ==========================================

export async function getAllCustomers() {

    const { data, error } =
        await supabase
            .from(TABLES.customers)
            .select("*")
            .order(
                "created_at",
                {
                    ascending: false
                }
            );


    throwIfError(error);

    return data || [];

}


// ==========================================
// BARBERS
// ==========================================

export async function getBarbers() {

    const { data, error } =
        await supabase
            .from(TABLES.barbers)
            .select("*")
            .eq(
                "active",
                true
            );


    /*
     * اگر جدول barbers هنوز ساخته
     * یا populated نشده باشد،
     * فعلاً آرایشگرهای پیش‌فرض
     * سیستم استفاده می‌شوند.
     */

    if (
        error
    ) {

        console.warn(
            "Barbers table unavailable. Using defaults."
        );

        return [
            ...DEFAULT_BARBERS
        ];

    }


    if (
        !data ||
        data.length === 0
    ) {

        return [
            ...DEFAULT_BARBERS
        ];

    }


    return data;

}


// ==========================================
// SERVICES
// ==========================================

export async function getServices() {

    const { data, error } =
        await supabase
            .from(TABLES.services)
            .select("*")
            .eq(
                "active",
                true
            );


    if (
        error
    ) {

        console.warn(
            "Services table unavailable. Using defaults."
        );

        return [
            ...DEFAULT_SERVICES
        ];

    }


    if (
        !data ||
        data.length === 0
    ) {

        return [
            ...DEFAULT_SERVICES
        ];

    }


    return data;

}


// ==========================================
// GET BARBER RESERVATIONS
// ==========================================

export async function getBarberReservations(
    barberId,
    startDate,
    endDate
) {

    const { data, error } =
        await supabase
            .from(TABLES.reservations)
            .select("*")
            .eq(
                "barber_id",
                barberId
            )
            .gte(
                "date",
                startDate
            )
            .lte(
                "date",
                endDate
            )
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


    throwIfError(error);

    return data || [];

}


// ==========================================
// ADMIN HELPERS
// ==========================================

export async function updateReservationStatus(
    reservationId,
    status
) {

    const allowedStatuses = [

        RESERVATION_STATUS.RESERVED,

        RESERVATION_STATUS.CANCELLED,

        RESERVATION_STATUS.COMPLETED,

        RESERVATION_STATUS.NO_SHOW

    ];


    if (
        !allowedStatuses.includes(
            status
        )
    ) {

        throw new Error(
            "وضعیت رزرو معتبر نیست."
        );

    }


    const updateData = {

        status

    };


    if (
        status ===
        RESERVATION_STATUS.CANCELLED
    ) {

        updateData.cancelled_at =
            new Date().toISOString();

    }


    const { data, error } =
        await supabase
            .from(TABLES.reservations)
            .update(
                updateData
            )
            .eq(
                "id",
                reservationId
            )
            .select()
            .single();


    throwIfError(error);

    return data;

}


// ==========================================
// Export Tables
// ==========================================

export {
    TABLES
};


// ==========================================
// Ready
// ==========================================

console.log(
    "Salon Mojezeh - Supabase database layer loaded."
);
