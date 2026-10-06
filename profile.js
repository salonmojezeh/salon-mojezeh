import {
  supabase,
  getCurrentUser,
  getCurrentUserProfile,
  getCurrentCustomer,
  getCurrentBarber,
  getBarbers,
  getServices,
  getCurrentCustomerReservations,
  getCurrentBarberReservations,
  getReservations,
  cancelReservation,
  completeReservation,
  markReservationNoShow,
  signOutUser
} from "./supabase.js";

const $ = (s) => document.querySelector(s);
let user = null, profile = null, role = "customer", customer = null, barber = null;
let barbers = [], services = [], reservationsCache = [];

const fa = (n) => new Intl.NumberFormat("fa-IR").format(Number(n || 0));
const esc = (v) => String(v ?? "").replace(/[&<>"']/g, m => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" }[m]));
const today = () => new Date().toISOString().slice(0,10);
const tm = (v) => v ? String(v).slice(0,5) : "—";
function dateFa(v){ if(!v)return"—"; try{return new Intl.DateTimeFormat("fa-IR-u-ca-persian",{year:"numeric",month:"long",day:"numeric"}).format(new Date(`${v}T00:00:00`));}catch{return v;} }
function past(r){ return r?.date ? new Date(`${r.date}T${r.time || "23:59"}:00`) < new Date() : false; }
function price(r){ return Number(r?.price ?? r?.amount ?? r?.total_price ?? r?.service_price ?? 0); }
function status(s){ return ({reserved:["رزرو شده","reserved"],completed:["تکمیل شده","completed"],cancelled:["لغو شده","cancelled"],no_show:["عدم مراجعه","no_show"]}[s] || [s || "—",""]); }
function listResult(x){ return Array.isArray(x) ? x : (x?.data || []); }

function nameOfCustomer(c = customer){
  return [c?.first_name ?? c?.firstName, c?.last_name ?? c?.lastName].filter(Boolean).join(" ") || "مشتری";
}
function barberName(id, fallback){ const b = barbers.find(x=>x.id===id); return fallback || b?.name || "آرایشگر"; }
function serviceName(id, fallback){ const s = services.find(x=>x.id===id); return fallback || s?.name || "خدمت"; }

function showMessage(text, type="error"){
  const el = $("#pageMessage"); if(!el)return;
  el.hidden = false; el.className = `page-message ${type}`; el.textContent = text;
  setTimeout(()=>{el.hidden=true;}, 4500);
}

async function loadRefs(){
  const [b,s] = await Promise.all([getBarbers(), getServices()]);
  barbers = listResult(b); services = listResult(s);
}

function setAccount(){
  const displayName = role === "customer" ? nameOfCustomer() : (barber?.name || user?.user_metadata?.full_name || user?.email || "کاربر");
  const roleText = role === "admin" ? "مدیر سالن" : role === "barber" ? "آرایشگر" : "مشتری";
  $("#profileName").textContent = displayName;
  $("#profileContact").textContent = user?.email || customer?.phone || barber?.phone || "حساب کاربری";
  $("#avatar").textContent = displayName.charAt(0) || "م";
  $("#roleBadge").textContent = roleText;

  $("#accountGrid").innerHTML = `
    <div><span>نام</span><strong>${esc(displayName)}</strong></div>
    <div><span>نقش</span><strong>${esc(roleText)}</strong></div>
    <div><span>موبایل</span><strong>${esc(customer?.phone || barber?.phone || "—")}</strong></div>
    <div><span>ایمیل</span><strong>${esc(user?.email || "—")}</strong></div>
    <div><span>تاریخ تولد</span><strong>${esc(customer?.birth_date || customer?.birthDate || "ثبت نشده")}</strong></div>
    <div><span>وضعیت حساب</span><strong>${profile?.active === false ? "غیرفعال" : "فعال"}</strong></div>
  `;
}

function renderStats(rows){
  const completed = rows.filter(r=>r.status==="completed").length;
  const upcoming = rows.filter(r=>r.status==="reserved" && !past(r)).length;
  const cancelled = rows.filter(r=>r.status==="cancelled").length;
  const cards = [
    ["کل رزروها", rows.length],
    ["نوبت‌های آینده", upcoming],
    ["تکمیل‌شده", completed],
    ["لغوشده", cancelled]
  ];
  $("#statsGrid").innerHTML = cards.map(([label,value])=>`<article><span>${label}</span><strong>${fa(value)}</strong></article>`).join("");
}

function reservationCard(r, canManage){
  const [label, cls] = status(r.status);
  const customerObj = customer && r.customer_id === customer.id ? customer : null;
  const cname = r.customer_name || [r.first_name,r.last_name].filter(Boolean).join(" ") || nameOfCustomer(customerObj);
  const bname = r.barber_name || barberName(r.barber_id);
  const sname = r.service_name || r.service || serviceName(r.service_id);
  const buttons = r.status === "reserved" ? (role === "customer"
    ? `<button class="mini-btn danger" data-action="cancel" data-id="${esc(r.id)}">لغو رزرو</button>`
    : canManage
      ? `<button class="mini-btn success" data-action="complete" data-id="${esc(r.id)}">تکمیل</button>
         <button class="mini-btn" data-action="noshow" data-id="${esc(r.id)}">عدم مراجعه</button>
         <button class="mini-btn danger" data-action="cancel" data-id="${esc(r.id)}">لغو</button>`
      : "") : "";

  return `<article class="reservation-card">
    <div class="reservation-top"><div><h3>${esc(cname)}</h3><div class="muted">${esc(sname)} · ${esc(bname)}</div></div><span class="status ${cls}">${esc(label)}</span></div>
    <div class="card-row muted"><span>${esc(dateFa(r.date))}</span><strong>${esc(tm(r.time || r.start_time))}</strong></div>
    ${price(r) ? `<div class="muted">مبلغ: ${fa(price(r))} تومان</div>` : ""}
    ${buttons ? `<div class="reservation-actions">${buttons}</div>` : ""}
  </article>`;
}

function renderReservations(rows, target, canManage=false){
  const box = $(target);
  if(!box)return;
  box.innerHTML = rows.length ? rows.map(r=>reservationCard(r,canManage)).join("") : `<div class="empty-state">رزروی برای نمایش وجود ندارد.</div>`;
}

async function loadReservations(){
  let result;
  if(role === "admin") result = await getReservations();
  else if(role === "barber") result = await getCurrentBarberReservations();
  else result = await getCurrentCustomerReservations();

  reservationsCache = listResult(result).sort((a,b)=>`${a.date||""}${a.time||""}`.localeCompare(`${b.date||""}${b.time||""}`));
  renderStats(reservationsCache);

  if(role === "customer") renderReservations(reservationsCache, "#reservationList", false);
  if(role === "barber") renderReservations(reservationsCache, "#barberReservationList", true);
  if(role === "admin") renderReservations(reservationsCache.slice(0,20), "#adminReservationList", true);
}

async function loadAdminTables(){
  const [{data:customers},{data:barbersData}] = await Promise.all([
    supabase.from("customers").select("*").order("created_at",{ascending:false}).limit(200),
    supabase.from("barbers").select("*").order("name")
  ]);

  $("#customersTable").innerHTML = customers?.length ? `<table class="simple-table"><thead><tr><th>نام</th><th>موبایل</th><th>تولد</th><th>امتیاز</th></tr></thead><tbody>${
    customers.map(c=>`<tr><td>${esc(nameOfCustomer(c))}</td><td>${esc(c.phone||"—")}</td><td>${esc(c.birth_date||c.birthDate||"—")}</td><td>${fa(c.club_points??c.points??0)}</td></tr>`).join("")
  }</tbody></table>` : `<div class="empty-state">مشتری‌ای ثبت نشده است.</div>`;

  $("#barbersTable").innerHTML = barbersData?.length ? `<table class="simple-table"><thead><tr><th>نام</th><th>تلفن</th><th>وضعیت</th></tr></thead><tbody>${
    barbersData.map(b=>`<tr><td>${esc(b.name||"آرایشگر")}</td><td>${esc(b.phone||"—")}</td><td>${b.active===false?"غیرفعال":"فعال"}</td></tr>`).join("")
  }</tbody></table>` : `<div class="empty-state">آرایشگری ثبت نشده است.</div>`;
}

async function fillBarbers(){
  const select = $("#blockBarber");
  if(!select)return;
  if(role === "barber"){
    select.innerHTML = `<option value="${esc(barber?.id||"")}">${esc(barber?.name||"آرایشگر")}</option>`;
    select.disabled = true;
    return;
  }
  select.disabled = false;
  select.innerHTML = `<option value="">کل سالن</option>` + barbers.map(b=>`<option value="${esc(b.id)}">${esc(b.name||"آرایشگر")}</option>`).join("");
}

function availabilityMessage(text,type="error"){
  const el=$("#availabilityMessage"); if(!el)return;
  el.hidden=false; el.className=`form-message show ${type}`; el.textContent=text;
  setTimeout(()=>{el.hidden=true;},4000);
}

async function loadAvailability(){
  let q = supabase.from("availability_blocks").select("*").eq("active",true).gte("block_date",today()).order("block_date").order("start_time");
  if(role==="barber") q=q.or(`barber_id.eq.${barber.id},barber_id.is.null`);
  const {data,error}=await q;
  if(error){ $("#availabilityList").innerHTML=`<div class="empty-state">مدیریت ساعات در دسترس نیست: ${esc(error.message)}</div>`; return; }

  $("#availabilityList").innerHTML = data?.length ? data.map(b=>{
    const target = b.barber_id ? barberName(b.barber_id) : "کل سالن";
    const range = b.start_time && b.end_time ? `${tm(b.start_time)} تا ${tm(b.end_time)}` : "کل روز";
    const type = ({closed:"تعطیل / بسته",busy:"مشغول",holiday:"تعطیلی مناسبتی",leave:"مرخصی"})[b.block_type] || b.block_type;
    const editable = role==="admin" || (role==="barber" && b.barber_id===barber.id);
    return `<article class="block-card">
      <div class="block-meta"><span class="block-type">${esc(type)}</span><strong>${esc(dateFa(b.block_date))}</strong></div>
      <div>${esc(range)} · ${esc(target)}</div>
      <div class="muted">${esc(b.title||"")} ${b.reason?`— ${esc(b.reason)}`:""}</div>
      ${editable?`<div class="block-actions"><button class="mini-btn" data-block="edit" data-id="${esc(b.id)}">ویرایش</button><button class="mini-btn danger" data-block="delete" data-id="${esc(b.id)}">حذف</button></div>`:""}
    </article>`;
  }).join("") : `<div class="empty-state">برای روزهای آینده بازه بسته‌ای ثبت نشده است.</div>`;
}

function resetAvailability(){
  $("#availabilityEditId").value="";
  $("#blockDate").value="";
  $("#blockType").value="closed";
  $("#startTime").value="";
  $("#endTime").value="";
  $("#blockTitle").value="";
  $("#blockReason").value="";
  $("#saveBlockBtn").textContent="ثبت بازه";
  $("#cancelEditBtn").hidden=true;
  if(role==="barber") $("#blockBarber").value=barber.id;
}

async function saveAvailability(e){
  e.preventDefault();
  const id=$("#availabilityEditId").value;
  const date=$("#blockDate").value;
  const start=$("#startTime").value;
  const end=$("#endTime").value;

  if(!date)return availabilityMessage("تاریخ را انتخاب کنید.");
  if((start&&!end)||(!start&&end))return availabilityMessage("ساعت شروع و پایان را هر دو وارد کنید.");
  if(start&&end&&start>=end)return availabilityMessage("ساعت پایان باید بعد از شروع باشد.");

  const payload={
    barber_id: role==="admin" ? ($("#blockBarber").value||null) : barber.id,
    block_date: date,
    start_time: start||null,
    end_time: end||null,
    block_type: $("#blockType").value,
    title: $("#blockTitle").value.trim()||null,
    reason: $("#blockReason").value.trim()||null,
    active: true,
    updated_at: new Date().toISOString()
  };

  try{
    if(id){
      const {error}=await supabase.from("availability_blocks").update(payload).eq("id",id);
      if(error)throw error;
    }else{
      payload.created_by=user.id;
      const {error}=await supabase.from("availability_blocks").insert(payload);
      if(error)throw error;
    }
    availabilityMessage("بازه با موفقیت ذخیره شد.","success");
    resetAvailability();
    await loadAvailability();
  }catch(err){ availabilityMessage(err.message||"ذخیره انجام نشد."); }
}

async function editBlock(id){
  const {data,error}=await supabase.from("availability_blocks").select("*").eq("id",id).single();
  if(error)return availabilityMessage(error.message);
  $("#availabilityEditId").value=data.id;
  $("#blockDate").value=data.block_date;
  $("#blockBarber").value=data.barber_id||"";
  $("#blockType").value=data.block_type;
  $("#startTime").value=data.start_time?tm(data.start_time):"";
  $("#endTime").value=data.end_time?tm(data.end_time):"";
  $("#blockTitle").value=data.title||"";
  $("#blockReason").value=data.reason||"";
  $("#saveBlockBtn").textContent="ذخیره ویرایش";
  $("#cancelEditBtn").hidden=false;
  $("#availabilityManager").classList.add("open");
  $("#availabilityManager").scrollIntoView({behavior:"smooth",block:"start"});
}

async function deleteBlock(id){
  if(!confirm("این بازه حذف شود؟"))return;
  const {error}=await supabase.from("availability_blocks").delete().eq("id",id);
  if(error)return availabilityMessage(error.message);
  await loadAvailability();
}

async function doReservationAction(action,id){
  try{
    if(action==="cancel") await cancelReservation(id);
    if(action==="complete") await completeReservation(id);
    if(action==="noshow") await markReservationNoShow(id);
    showMessage("عملیات با موفقیت انجام شد.","success");
    await loadReservations();
  }catch(err){ showMessage(err.message||"عملیات انجام نشد."); }
}

function bindSections(){
  document.addEventListener("click",e=>{
    const head=e.target.closest(".section-head");
    if(head) head.parentElement.classList.toggle("open");

    const scroll=e.target.closest("[data-scroll]");
    if(scroll){ const el=$("#"+scroll.dataset.scroll); if(el){el.classList.add("open");el.scrollIntoView({behavior:"smooth",block:"start"});} }

    const action=e.target.closest("[data-action]");
    if(action) doReservationAction(action.dataset.action,action.dataset.id);

    const block=e.target.closest("[data-block]");
    if(block){ if(block.dataset.block==="edit")editBlock(block.dataset.id); else deleteBlock(block.dataset.id); }
  });
}

async function boot(){
  user=await getCurrentUser();
  if(!user){location.replace("login.html");return;}
  profile=await getCurrentUserProfile();
  role=profile?.is_admin===true || profile?.role==="admin" ? "admin" : profile?.role==="barber" && profile?.barber_id ? "barber" : "customer";

  if(role==="customer") customer=await getCurrentCustomer();
  if(role==="barber") barber=await getCurrentBarber();

  await loadRefs();
  setAccount();

  document.querySelectorAll(".manager-only").forEach(el=>el.hidden=role==="customer");
  document.querySelectorAll(".admin-only").forEach(el=>el.hidden=role!=="admin");
  document.querySelectorAll(".customer-only").forEach(el=>el.hidden=role!=="customer");

  if(role!=="customer"){
    await fillBarbers();
    await loadAdminTables();
    await loadAvailability();
  }
  await loadReservations();

  $("#profileApp").hidden=false;
  $("#profileLoader").classList.add("hidden");
}

$("#availabilityForm")?.addEventListener("submit",saveAvailability);
$("#cancelEditBtn")?.addEventListener("click",resetAvailability);
$("#refreshBtn")?.addEventListener("click",()=>location.reload());
$("#logoutBtn")?.addEventListener("click",async()=>{await signOutUser();location.replace("index.html");});

bindSections();

(async()=>{
  try{await boot();}
  catch(err){
    console.error(err);
    $("#profileLoader").classList.add("hidden");
    $("#profileApp").hidden=false;
    showMessage(err.message||"بارگذاری پنل انجام نشد.");
  }
  setTimeout(()=>$("#loader")?.remove(),400);
})();
