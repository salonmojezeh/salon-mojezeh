"use strict";
/* =====================================================
   supabase.js — لایه دسترسی به دادهٔ سالن معجزه
   همه صفحات از همین توابع استفاده می‌کنند.
   ===================================================== */

const SUPABASE_URL = "https://erfzhyvraenceykiwlci.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_uRbq30GBNHcXwGrinzhx1Q_5-egxs5_";
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.sb = sb;

const TABLES = {
  reservations: "reservations",
  barbers: "barbers",
  services: "services",
  customers: "customers",
  availability_blocks: "availability_blocks",
  user_profiles: "user_profiles",
  booking_settings: "booking_settings"
};
window.TABLES = TABLES;

/* ---------- ابزارهای مشترک ---------- */
const NormPhone = v => {
  let p = String(v || "").replace(/\D/g, "");
  if (p.startsWith("98")) p = "0" + p.slice(2);
  if (p.length === 10 && p.startsWith("9")) p = "0" + p;
  return p;
};
window.NormPhone = NormPhone;

const TodayStr = (off = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + off);
  return d.toLocaleDateString("sv-SE");
};
window.TodayStr = TodayStr;

const DateFa = s => {
  if (!s) return "—";
  try { return new Date(s + "T00:00:00").toLocaleDateString("fa-IR"); }
  catch { return s; }
};
window.DateFa = DateFa;

const HHmm = t => String(t || "").slice(0, 5);
window.HHmm = HHmm;

/* ---------- تنظیمات سالن ---------- */
async function getBookingSettings() {
  try {
    const { data } = await sb.from(TABLES.booking_settings).select("*").limit(1).maybeSingle();
    return Object.assign(
      { opening_time: "09:00", closing_time: "21:00", slot_interval: 30, booking_days_ahead: 30 },
      data || {}
    );
  } catch {
    return { opening_time: "09:00", closing_time: "21:00", slot_interval: 30, booking_days_ahead: 30 };
  }
}
window.getBookingSettings = getBookingSettings;

/* ---------- خدمات و آرایشگران ---------- */
async function getServices(activeOnly = true) {
  let q = sb.from(TABLES.services).select("*").order("id");
  const { data, error } = await q;
  if (error) return [];
  return activeOnly ? (data || []).filter(s => s.active !== false) : (data || []);
}
window.getServices = getServices;

async function getServiceByKey(key) {
  const { data } = await sb.from(TABLES.services).select("*").eq("service_key", key).maybeSingle();
  return data;
}
window.getServiceByKey = getServiceByKey;

async function getBarbers(activeOnly = true) {
  const { data, error } = await sb.from(TABLES.barbers).select("*").order("id");
  if (error) return [];
  return activeOnly ? (data || []).filter(b => b.active !== false) : (data || []);
}
window.getBarbers = getBarbers;

/* ---------- حساب کاربری ---------- */
async function signUpCustomer({ name, phone, password, birthDate }) {
  const p = NormPhone(phone);
  const email = p + "@salon-mojezeh.ir";
  const { data, error } = await sb.auth.signUp({
    email, password,
    options: { data: { name, phone: p, birth_date: birthDate || null } }
  });
  return { data, error };
}
window.signUpCustomer = signUpCustomer;

async function signInCustomer(phone, password) {
  const p = NormPhone(phone);
  return await sb.auth.signInWithPassword({ email: p + "@salon-mojezeh.ir", password });
}
window.signInCustomer = signInCustomer;

async function signOutUser() { await sb.auth.signOut(); }
window.signOutUser = signOutUser;

async function getCurrentUser() {
  const { data } = await sb.auth.getUser();
  return data ? data.user : null;
}
window.getCurrentUser = getCurrentUser;

async function getUserProfile(userId) {
  let r = await sb.from(TABLES.user_profiles).select("*").eq("user_id", userId).maybeSingle();
  if (!r.data) r = await sb.from(TABLES.user_profiles).select("*").eq("auth_id", userId).maybeSingle();
  return r.data;
}
window.getUserProfile = getUserProfile;

/* ---------- مشتریان ---------- */
async function getCustomerByPhone(phone) {
  const { data } = await sb.from(TABLES.customers).select("*").eq("phone", NormPhone(phone)).maybeSingle();
  return data;
}
window.getCustomerByPhone = getCustomerByPhone;

async function getAllCustomers() {
  const { data } = await sb.from(TABLES.customers).select("*").order("name");
  return data || [];
}
window.getAllCustomers = getAllCustomers;

async function createCustomer(payload) {
  return await sb.from(TABLES.customers).insert(payload).select().single();
}
window.createCustomer = createCustomer;

async function updateCustomer(id, patch) {
  return await sb.from(TABLES.customers).update(patch).eq("id", id);
}
window.updateCustomer = updateCustomer;

async function updateCustomerByPhone(phone, patch) {
  return await sb.from(TABLES.customers).update(patch).eq("phone", NormPhone(phone));
}
window.updateCustomerByPhone = updateCustomerByPhone;

/* ---------- رزروها ---------- */
async function createReservation(payload) {
  return await sb.from(TABLES.reservations).insert(payload).select().single();
}
window.createReservation = createReservation;

async function getReservationsByPhone(phone) {
  const { data, error } = await sb.from(TABLES.reservations)
    .select("*").eq("phone", NormPhone(phone)).order("date").order("time");
  return error ? [] : (data || []);
}
window.getReservationsByPhone = getReservationsByPhone;

async function getReservationsByDate(date) {
  const { data, error } = await sb.from(TABLES.reservations).select("*").eq("date", date).order("time");
  return error ? [] : (data || []);
}
window.getReservationsByDate = getReservationsByDate;

async function setReservationStatus(id, status) {
  return await sb.from(TABLES.reservations).update({ status }).eq("id", id);
}
window.setReservationStatus = setReservationStatus;

async function cancelReservation(id) {
  return await setReservationStatus(id, "cancelled");
}
window.cancelReservation = cancelReservation;

async function editReservation(id, patch) {
  /* ثبت نسخهٔ اصلی فقط در اولین ویرایش */
  const { data: cur } = await sb.from(TABLES.reservations).select("date,time,original_date").eq("id", id).maybeSingle();
  const full = Object.assign({}, patch);
  if (cur && !cur.original_date) {
    full.original_date = cur.date;
    full.original_time = HHmm(cur.time);
  }
  return await sb.from(TABLES.reservations).update(full).eq("id", id);
}
window.editReservation = editReservation;

/* ---------- بازه‌های بسته (تعطیلی/مرخصی) ---------- */
async function getAvailabilityBlocks(date, barberId) {
  let q = sb.from(TABLES.availability_blocks).select("*").eq("block_date", date).eq("active", true);
  if (barberId) q = q.or(`barber_id.is.null,barber_id.eq.${barberId}`);
  else q = q.is("barber_id", null);
  const { data, error } = await q;
  return error ? { data: [], error } : { data: data || [], error: null };
}
window.getAvailabilityBlocks = getAvailabilityBlocks;

async function getAllAvailabilityBlocks() {
  const { data, error } = await sb.from(TABLES.availability_blocks)
    .select("*").gte("block_date", TodayStr(0)).order("block_date");
  return error ? { data: [], error } : { data: data || [], error: null };
}
window.getAllAvailabilityBlocks = getAllAvailabilityBlocks;

async function createAvailabilityBlock(payload) {
  return await sb.from(TABLES.availability_blocks).insert(payload).select().single();
}
window.createAvailabilityBlock = createAvailabilityBlock;

async function deleteAvailabilityBlock(id) {
  return await sb.from(TABLES.availability_blocks).delete().eq("id", id);
}
window.deleteAvailabilityBlock = deleteAvailabilityBlock;

async function toggleAvailabilityBlock(id, active) {
  return await sb.from(TABLES.availability_blocks).update({ active }).eq("id", id);
}
window.toggleAvailabilityBlock = toggleAvailabilityBlock;