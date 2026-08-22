// ==========================================
// Salon Mojezeh
// supabase.js
// Supabase Reservation System
// ==========================================

"use strict";

const SUPABASE_URL = "https://erfzhyvraenceykiwlci.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_uRbq30GBNHcXwGrinzh1Q_5-egxs5_";

const RESERVATIONS_TABLE = "reservations";


// ==========================================
// Request Helper
// ==========================================

async function supabaseRequest(
    endpoint,
    options = {}
) {

    const response = await fetch(
        `${SUPABASE_URL}/rest/v1/${endpoint}`,
        {
            ...options,

            headers: {

                "apikey": SUPABASE_KEY,

                "Authorization":
                    `Bearer ${SUPABASE_KEY}`,

                "Content-Type":
                    "application/json",

                "Prefer":
                    "return=representation",

                ...(options.headers || {})

            }

        }
    );


    if (!response.ok) {

        const errorText =
            await response.text();

        const error =
            new Error(
                errorText ||
                `Supabase error: ${response.status}`
            );

        error.code =
            String(response.status);

        throw error;

    }


    const text =
        await response.text();


    return text
        ? JSON.parse(text)
        : null;

}


// ==========================================
// Get Booked Times
// ==========================================

async function loadBookedTimes(
    barberId,
    date
) {

    const params =
        new URLSearchParams({

            select:
                "time,status",

            barber_id:
                `eq.${barberId}`,

            date:
                `eq.${date}`,

            status:
                "eq.reserved"

        });


    const data =
        await supabaseRequest(
            `${RESERVATIONS_TABLE}?${params.toString()}`,
            {
                method: "GET"
            }
        );


    if (!Array.isArray(data)) {

        return [];

    }


    return data
        .map(item => item.time)
        .filter(Boolean);

}


// ==========================================
// Add Reservation
// ==========================================

async function addReservation(
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
            "reserved",

        source:
            "website"

    };


    /*
     * اول بررسی می‌کنیم که
     * این ساعت قبلاً رزرو نشده باشد.
     */

    const checkParams =
        new URLSearchParams({

            select:
                "id",

            barber_id:
                `eq.${reservation.barber_id}`,

            date:
                `eq.${reservation.date}`,

            time:
                `eq.${reservation.time}`,

            status:
                "eq.reserved"

        });


    const existing =
        await supabaseRequest(
            `${RESERVATIONS_TABLE}?${checkParams.toString()}`,
            {
                method: "GET"
            }
        );


    if (
        Array.isArray(existing) &&
        existing.length > 0
    ) {

        const error =
            new Error(
                "این ساعت قبلاً رزرو شده است."
            );

        error.code =
            "already-exists";

        throw error;

    }


    /*
     * ثبت رزرو
     */

    const result =
        await supabaseRequest(
            RESERVATIONS_TABLE,
            {
                method: "POST",

                body:
                    JSON.stringify(
                        reservation
                    )
            }
        );


    if (
        !Array.isArray(result) ||
        !result.length
    ) {

        throw new Error(
            "رزرو در Supabase ثبت نشد."
        );

    }


    return String(
        result[0].id
    );

}


// ==========================================
// Save Customer
// ==========================================
//
// فعلاً این قسمت را خالی نگه می‌داریم.
// بعداً جدول customers را می‌سازیم.
//

async function saveCustomer(
    reservationData
) {

    console.log(
        "Customer save pending:",
        reservationData.phone
    );

    return reservationData.phone;

}


// ==========================================
// Cancel Reservation
// ==========================================

async function cancelReservation(
    reservationId
) {

    const params =
        new URLSearchParams({

            id:
                `eq.${reservationId}`

        });


    await supabaseRequest(
        `${RESERVATIONS_TABLE}?${params.toString()}`,
        {
            method: "PATCH",

            body:
                JSON.stringify({

                    status:
                        "cancelled",

                    cancelled_at:
                        new Date().toISOString()

                })
        }
    );


    return true;

}


// ==========================================
// Get All Reservations
// برای پنل مدیریت
// ==========================================

async function getAllReservations(
    startDate = null,
    endDate = null
) {

    const params =
        new URLSearchParams({

            select:
                "*",

            order:
                "date.asc,time.asc"

        });


    if (startDate) {

        params.set(
            "date",
            `gte.${startDate}`
        );

    }


    if (endDate) {

        params.set(
            "date",
            `lte.${endDate}`
        );

    }


    return await supabaseRequest(
        `${RESERVATIONS_TABLE}?${params.toString()}`,
        {
            method: "GET"
        }
    );

}


// ==========================================
// Export
// ==========================================

export {

    loadBookedTimes,

    addReservation,

    saveCustomer,

    cancelReservation,

    getAllReservations

};


// ==========================================
// Ready
// ==========================================

console.log(
    "Supabase / Salon Mojezeh آماده است."
);
