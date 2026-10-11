// Salon Mojezeh — Supabase client and shared data layer
"use strict";
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL = "https://erfzhyvraenceykiwlci.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_uRbq30GBNHcXwGrinzhx1Q_5-egxs5_";
export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
});
export const TABLES = {
  barbers: "barbers", services: "services", customers: "customers",
  reservations: "reservations", bookingSettings: "booking_settings",
  userProfiles: "user_profiles", availabilityBlocks: "availability_blocks"
};
export const RESERVATION_STATUS = { RESERVED:"reserved", CANCELLED:"cancelled", COMPLETED:"completed", NO_SHOW:"no_show" };

export function normalizeDigits(value="") {
  return String(value).replace(/[۰-۹]/g, d => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, d => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
}
export function normalizePhoneLocal(phone="") {
  let v = normalizeDigits(phone).trim().replace(/[^\d+]/g, "");
  if (v.startsWith("0098")) v = "0" + v.slice(4);
  else if (v.startsWith("+98")) v = "0" + v.slice(3);
  else if (v.startsWith("98") && !v.startsWith("980")) v = "0" + v.slice(2);
  else if (v.startsWith("9") && v.length === 10) v = "0" + v;
  return v;
}
export function normalizePhoneE164(phone="") {
  const p = normalizePhoneLocal(phone);
  return p.startsWith("09") && p.length === 11 ? "+98" + p.slice(1) : p;
}
function fail(error, where) { if (error) { console.error(where, error); throw error; } }
export async function signIn(identifier, password) {
  const value = String(identifier || "").trim();
  if (!value || !password) throw new Error("اطلاعات ورود ناقص است.");
  const credentials = value.includes("@")
    ? { email: value.toLowerCase(), password }
    : { phone: normalizePhoneE164(value), password };
  const { data, error } = await supabase.auth.signInWithPassword(credentials);
  fail(error, "signIn"); return data;
}
export async function signUpCustomer({firstName="", lastName="", phone="", email="", password="", birthDate=""}={}) {
  const normalizedPhone = normalizePhoneE164(phone);
  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (!/^\+989\d{9}$/.test(normalizedPhone)) throw new Error("شماره موبایل معتبر وارد کنید.");
  if (!normalizedEmail) throw new Error("ایمیل وارد کنید.");
  if (String(password).length < 8) throw new Error("رمز عبور باید حداقل ۸ کاراکتر باشد.");
  const { data, error } = await supabase.auth.signUp({
    phone: normalizedPhone, password,
    options: { data: { first_name:firstName.trim(), last_name:lastName.trim(), email:normalizedEmail,
      full_name:`${firstName} ${lastName}`.trim(), role:"customer", birth_date:birthDate || null } }
  });
  fail(error, "signUpCustomer"); return data;
}
export async function signOutUser() {
  const { error } = await supabase.auth.signOut(); fail(error, "signOutUser"); return true;
}
export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) { console.error("getCurrentUser", error); return null; } return data.user || null;
}
export async function getCurrentUserProfile() {
  const user = await getCurrentUser(); if (!user) return null;
  const { data, error } = await supabase.from(TABLES.userProfiles)
    .select("id,role,is_admin,barber_id,customer_id,active,created_at,updated_at").eq("id", user.id).maybeSingle();
  fail(error, "getCurrentUserProfile");
  return data ? {...data, user} : null;
}
export async function getCurrentProfile() {
  const user = await getCurrentUser(); if (!user) return {user:null, profile:null};
  return {user, profile:await getCurrentUserProfile()};
}
export async function getCurrentBarber() {
  const p = await getCurrentUserProfile(); if (!p?.barber_id) return null;
  const {data,error}=await supabase.from(TABLES.barbers).select("*").eq("id",p.barber_id).maybeSingle();
  fail(error,"getCurrentBarber"); return data || null;
}
export async function getCurrentCustomer() {
  const p = await getCurrentUserProfile(); if (!p?.customer_id) return null;
  const {data,error}=await supabase.from(TABLES.customers).select("*").eq("id",p.customer_id).maybeSingle();
  fail(error,"getCurrentCustomer"); return data || null;
}
export async function getBarbers() {
  const {data,error}=await supabase.from(TABLES.barbers).select("id,name,role,image_url,active,created_at")
    .eq("active",true).order("created_at",{ascending:true});
  fail(error,"getBarbers"); return data || [];
}
export async function getServices() {
  const {data,error}=await supabase.from(TABLES.services).select("id,service_key,name,duration,image_url,active,created_at")
    .eq("active",true).order("created_at",{ascending:true});
  fail(error,"getServices"); return data || [];
}
export async function getBookingSettings() {
  const {data,error}=await supabase.from(TABLES.bookingSettings)
    .select("id,opening_time,closing_time,slot_interval,booking_days_ahead,active").eq("active",true).limit(1).maybeSingle();
  fail(error,"getBookingSettings");
  return data || {opening_time:"09:00:00",closing_time:"21:00:00",slot_interval:30,booking_days_ahead:30,active:true};
}
export async function getCustomerByPhone(phone) {
  const raw=normalizeDigits(phone).trim(), local=normalizePhoneLocal(phone), e164=normalizePhoneE164(phone);
  const variants=[...new Set([raw,local,e164].filter(Boolean))];
  const {data,error}=await supabase.from(TABLES.customers).select("*").in("phone",variants).limit(1);
  fail(error,"getCustomerByPhone"); return data?.[0] || null;
}
export async function getCustomerById(id) {
  if (!id) return null;
  const {data,error}=await supabase.from(TABLES.customers).select("*").eq("id",id).maybeSingle();
  fail(error,"getCustomerById"); return data || null;
}
export async function saveCustomer(d={}) {
  const phone=normalizePhoneLocal(d.phone);
  const existing=await getCustomerByPhone(phone);
  const payload={
    first_name:d.firstName, last_name:d.lastName, phone,
    last_visit:d.date || null, last_barber_id:d.barberId || null,
    last_barber_name:d.barberName || null, last_service:d.service || null,
    updated_at:new Date().toISOString()
  };
  if (!existing) {
    Object.assign(payload,{visit_count:0,favorite_model:"",free_gift:false,note:""});
    const {data,error}=await supabase.from(TABLES.customers).insert(payload).select("id").single();
    fail(error,"saveCustomer insert"); return data.id;
  }
  const {data,error}=await supabase.from(TABLES.customers).update(payload).eq("id",existing.id).select("id").single();
  fail(error,"saveCustomer update"); return data.id;
}
export async function getBarberDayReservations(barberId,date) {
  const {data,error}=await supabase.from(TABLES.reservations).select("id,time,service_duration,status")
    .eq("barber_id",barberId).eq("date",date).eq("status",RESERVATION_STATUS.RESERVED);
  fail(error,"getBarberDayReservations"); return data || [];
}
export async function createReservation(d) {
  const payload={customer_id:d.customerId,first_name:d.firstName,last_name:d.lastName,phone:normalizePhoneLocal(d.phone),
    barber_id:d.barberId,barber_name:d.barberName,service_id:d.serviceId,service:d.service,
    service_duration:Number(d.serviceDuration),date:d.date,display_date:d.displayDate,time:d.time,
    status:RESERVATION_STATUS.RESERVED,source:"website"};
  const {data,error}=await supabase.from(TABLES.reservations).insert(payload).select("id").single();
  if (error?.code==="23505") { const e=new Error("این ساعت قبلاً رزرو شده است."); e.code="reservation-conflict"; throw e; }
  fail(error,"createReservation"); return data.id;
}
export async function getReservations({startDate=null,endDate=null,barberId=null,customerId=null,status=null}={}) {
  let q=supabase.from(TABLES.reservations).select("*");
  if(startDate) q=q.gte("date",startDate); if(endDate) q=q.lte("date",endDate);
  if(barberId) q=q.eq("barber_id",barberId); if(customerId) q=q.eq("customer_id",customerId); if(status) q=q.eq("status",status);
  const {data,error}=await q.order("date",{ascending:true}).order("time",{ascending:true});
  fail(error,"getReservations"); return data || [];
}
export async function getCurrentCustomerReservations() { const c=await getCurrentCustomer(); return c ? getReservations({customerId:c.id}) : []; }
export async function getCurrentBarberReservations() { const b=await getCurrentBarber(); return b ? getReservations({barberId:b.id}) : []; }
async function updateReservation(id,payload) {
  const {error}=await supabase.from(TABLES.reservations).update(payload).eq("id",id); fail(error,"updateReservation"); return true;
}
export async function cancelReservation(id) { return updateReservation(id,{status:RESERVATION_STATUS.CANCELLED,cancelled_at:new Date().toISOString()}); }
export async function completeReservation(id) { return updateReservation(id,{status:RESERVATION_STATUS.COMPLETED,completed_at:new Date().toISOString()}); }
export async function markReservationNoShow(id) { return updateReservation(id,{status:RESERVATION_STATUS.NO_SHOW}); }

export async function getAvailabilityBlocks({startDate=null,endDate=null,barberId=null,activeOnly=true}={}) {
  let q=supabase.from(TABLES.availabilityBlocks).select("*");
  if(startDate) q=q.gte("block_date",startDate); if(endDate) q=q.lte("block_date",endDate);
  if(activeOnly) q=q.eq("active",true);
  if(barberId) q=q.or(`barber_id.eq.${barberId},barber_id.is.null`);
  const {data,error}=await q.order("block_date",{ascending:true}).order("start_time",{ascending:true});
  fail(error,"getAvailabilityBlocks"); return data || [];
}
export async function createAvailabilityBlock(block) {
  const {data,error}=await supabase.from(TABLES.availabilityBlocks).insert(block).select("*").single();
  fail(error,"createAvailabilityBlock"); return data;
}
export async function updateAvailabilityBlock(id,patch) {
  const {data,error}=await supabase.from(TABLES.availabilityBlocks).update({...patch,updated_at:new Date().toISOString()})
    .eq("id",id).select("*").single();
  fail(error,"updateAvailabilityBlock"); return data;
}
export async function deleteAvailabilityBlock(id) {
  const {error}=await supabase.from(TABLES.availabilityBlocks).delete().eq("id",id); fail(error,"deleteAvailabilityBlock"); return true;
}
console.log("Salon Mojezeh Supabase system ready.");
