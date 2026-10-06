import {
  supabase,
  getCurrentUser,
  getCurrentProfile,
  getCurrentBarber,
  getCurrentCustomer,
  getBarbers,
  getServices,
  getReservations,
  getCurrentCustomerReservations,
  getCurrentBarberReservations,
  cancelReservation,
  completeReservation,
  markReservationNoShow,
  signOutUser
} from "./supabase.js";

const $ = id => document.getElementById(id);
const state = { user:null, profile:null, role:"customer", barber:null, customer:null, barbers:[], services:[], reservations:[] };

function unwrap(x){ return Array.isArray(x) ? x : (x?.data || x?.items || []); }
function normalizeDigits(v=""){return String(v).replace(/[۰-۹]/g,d=>"۰۱۲۳۴۵۶۷۸۹".indexOf(d)).replace(/[٠-٩]/g,d=>"٠١٢٣٤٥٦٧٨٩".indexOf(d));}
function esc(v=""){return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));}
function money(v){const n=Number(v||0);return Number.isFinite(n)?n.toLocaleString("fa-IR")+" تومان":"—";}
function dateFa(v){if(!v)return"—";try{return new Intl.DateTimeFormat("fa-IR-u-ca-persian",{dateStyle:"medium"}).format(new Date(v+"T00:00:00"));}catch{return v;}}
function timeFa(v){return v?String(v).slice(0,5):"—";}
function statusInfo(s){const k=String(s||"reserved").toLowerCase();return {reserved:["رزرو شده","reserved"],completed:["تکمیل شده","completed"],cancelled:["لغو شده","cancelled"],no_show:["عدم مراجعه","no_show"]}[k]||[s||"نامشخص",k];}
function reservationDateTime(r){if(!r?.date)return null;const d=r.time?`${r.date}T${String(r.time).slice(0,5)}:00`:`${r.date}T23:59:59`;const x=new Date(d);return Number.isNaN(x.getTime())?null:x;}
function isPast(r){const d=reservationDateTime(r);return d?d.getTime()<Date.now():false;}
function serviceName(r){return r.service_name||r.service||state.services.find(s=>s.id===r.service_id)?.name||"خدمت"; }
function barberName(r){return r.barber_name||r.barber||state.barbers.find(b=>b.id===r.barber_id)?.name||"—"; }
function customerName(r){return r.customer_name||[r.first_name,r.last_name].filter(Boolean).join(" ")||"مشتری";}

function msg(text){const el=$("pageMessage");el.hidden=!text;el.textContent=text||"";}
function setStats(items){$("statsGrid").innerHTML=items.map(x=>`<article class="stat-card"><small>${esc(x.label)}</small><strong>${esc(x.value)}</strong></article>`).join("");}

function reservationActions(r){
  const status=String(r.status||"reserved").toLowerCase();
  if(status!=="reserved"||isPast(r)) return "";
  if(state.role==="customer") return `<button data-action="cancel" data-id="${esc(r.id)}">لغو</button>`;
  return `<button data-action="complete" data-id="${esc(r.id)}">تکمیل</button><button data-action="noshow" data-id="${esc(r.id)}">عدم مراجعه</button><button data-action="cancel" data-id="${esc(r.id)}">لغو</button>`;
}
function reservationCard(r){
  const [label,key]=statusInfo(r.status);
  return `<article class="reservation-card">
    <div class="res-time">${esc(timeFa(r.time||r.start_time))}<small>${esc(dateFa(r.date||r.reservation_date))}</small></div>
    <div class="res-main"><strong>${esc(state.role==="customer"?barberName(r):customerName(r))}</strong><span>${esc(serviceName(r))} · ${esc(barberName(r))}</span><span class="status ${esc(key)}">${esc(label)}</span></div>
    <div class="res-actions">${reservationActions(r)}</div>
  </article>`;
}
function renderReservations(id, rows){$(id).innerHTML=rows.length?rows.map(reservationCard).join(""):`<div class="empty-state">رزروی برای نمایش وجود ندارد.</div>`;}

async function handleReservationAction(action,id){
  try{
    if(action==="cancel") await cancelReservation(id);
    if(action==="complete") await completeReservation(id);
    if(action==="noshow") await markReservationNoShow(id);
    msg("وضعیت رزرو با موفقیت بروزرسانی شد.");
    await loadData();
  }catch(e){console.error(e);msg(e?.message||"عملیات رزرو انجام نشد.");}
}

function renderCustomers(){
  const rows=state.reservations.map(r=>({name:customerName(r),phone:r.customer_phone||r.phone||"—",last:r.date||"—"}));
  const unique=[...new Map(rows.map(x=>[x.name+x.phone,x])).values()].sort((a,b)=>String(b.last).localeCompare(String(a.last)));
  $("customersTable").innerHTML=unique.length?`<table class="data-table"><thead><tr><th>مشتری</th><th>تلفن</th><th>آخرین رزرو</th></tr></thead><tbody>${unique.map(x=>`<tr><td>${esc(x.name)}</td><td>${esc(x.phone)}</td><td>${esc(dateFa(x.last))}</td></tr>`).join("")}</tbody></table>`:`<div class="empty-state">اطلاعات مشتری وجود ندارد.</div>`;
}
function renderBarbers(){
  $("barbersTable").innerHTML=state.barbers.length?`<table class="data-table"><thead><tr><th>آرایشگر</th><th>وضعیت</th><th>رزروهای ثبت‌شده</th></tr></thead><tbody>${state.barbers.map(b=>{const n=state.reservations.filter(r=>r.barber_id===b.id).length;return `<tr><td>${esc(b.name||b.full_name||"آرایشگر")}</td><td>${b.active===false?"غیرفعال":"فعال"}</td><td>${n.toLocaleString("fa-IR")}</td></tr>`}).join("")}</tbody></table>`:`<div class="empty-state">آرایشگری ثبت نشده است.</div>`;
}
function renderReports(){
  const total=state.reservations.length, completed=state.reservations.filter(r=>String(r.status).toLowerCase()==="completed").length;
  const revenue=state.reservations.filter(r=>String(r.status).toLowerCase()==="completed").reduce((s,r)=>s+Number(r.total_price??r.price??r.amount??0),0);
  const services={};state.reservations.forEach(r=>services[serviceName(r)]=(services[serviceName(r)]||0)+1);
  const top=Object.entries(services).sort((a,b)=>b[1]-a[1])[0];
  $("reportsBox").innerHTML=`<div class="report-card">کل رزروها<b>${total.toLocaleString("fa-IR")}</b></div><div class="report-card">تکمیل‌شده<b>${completed.toLocaleString("fa-IR")}</b></div><div class="report-card">درآمد ثبت‌شده<b>${money(revenue)}</b></div><div class="report-card">پرتکرارترین خدمت<b>${esc(top?.[0]||"—")}</b></div>`;
}

async function loadAvailability(){
  if(!["admin","barber"].includes(state.role))return;
  let q=supabase.from("availability_blocks").select("*").eq("active",true).order("block_date",{ascending:true}).order("start_time",{ascending:true});
  if(state.role==="barber") q=q.or(`barber_id.eq.${state.barber.id},barber_id.is.null`);
  const {data,error}=await q;
  if(error){console.error(error);$("availabilityList").innerHTML=`<div class="empty-state">دریافت تعطیلی‌ها ممکن نشد.</div>`;return;}
  const rows=(data||[]).filter(x=>x.block_date>=new Date().toISOString().slice(0,10));
  $("availabilityList").innerHTML=rows.length?rows.map(b=>{
    const target=b.barber_id?state.barbers.find(x=>x.id===b.barber_id)?.name||"آرایشگر":"کل سالن";
    const editable=state.role==="admin"||b.barber_id===state.barber?.id;
    return `<article class="block-card"><div><strong>${esc(dateFa(b.block_date))} · ${esc(b.title||b.block_type)}</strong><small>${esc(target)} · ${b.start_time?esc(timeFa(b.start_time))+" تا "+esc(timeFa(b.end_time)):"کل روز"}${b.reason?" · "+esc(b.reason):""}</small></div><div class="block-actions">${editable?`<button data-block-edit="${esc(b.id)}">ویرایش</button><button data-block-delete="${esc(b.id)}">حذف</button>`:""}</div></article>`;
  }).join(""):`<div class="empty-state">هیچ تعطیلی یا بازه بسته‌ای ثبت نشده است.</div>`;
  $("blockBarber").innerHTML=state.role==="admin"?`<option value="">کل سالن</option>`+state.barbers.map(b=>`<option value="${esc(b.id)}">${esc(b.name||b.full_name||"آرایشگر")}</option>`).join(""):`<option value="${esc(state.barber?.id||"")}">${esc(state.barber?.name||"آرایشگر من")}</option>`;
  $("targetWrap").hidden=false;
  if(state.role==="barber"){ $("blockBarber").disabled=true; }
}
function resetBlockForm(){
  $("availabilityEditId").value="";$("blockDate").value="";$("blockStart").value="";$("blockEnd").value="";$("blockTitle").value="";$("blockReason").value="";$("blockType").value="closed";$("cancelEditBtn").hidden=true;$("saveBlockBtn").textContent="ثبت بازه بسته";
}
async function saveBlock(e){
  e.preventDefault();
  try{
    const date=$("blockDate").value,start=$("blockStart").value,end=$("blockEnd").value;
    if(!date)throw new Error("تاریخ را انتخاب کن.");
    if((start&&!end)||(!start&&end))throw new Error("برای بازه ساعتی، هر دو ساعت را وارد کن.");
    if(start&&end&&start>=end)throw new Error("ساعت پایان باید بعد از ساعت شروع باشد.");
    const barberId=state.role==="barber"?state.barber.id:($("blockBarber").value||null);
    const payload={barber_id:barberId,block_date:date,start_time:start||null,end_time:end||null,block_type:$("blockType").value,title:$("blockTitle").value.trim()||null,reason:$("blockReason").value.trim()||null,active:true,created_by:state.user.id};
    const editId=$("availabilityEditId").value;
    let result;
    if(editId) result=await supabase.from("availability_blocks").update(payload).eq("id",editId);
    else result=await supabase.from("availability_blocks").insert(payload);
    if(result.error)throw result.error;
    resetBlockForm();await loadAvailability();msg("بازه بسته با موفقیت ذخیره شد.");
  }catch(e){console.error(e);msg(e?.message||"ثبت بازه انجام نشد.");}
}
async function editBlock(id){
  const {data,error}=await supabase.from("availability_blocks").select("*").eq("id",id).single();
  if(error) return msg(error.message);
  $("availabilityEditId").value=data.id;$("blockDate").value=data.block_date;$("blockStart").value=data.start_time?String(data.start_time).slice(0,5):"";$("blockEnd").value=data.end_time?String(data.end_time).slice(0,5):"";$("blockType").value=data.block_type;$("blockTitle").value=data.title||"";$("blockReason").value=data.reason||"";$("blockBarber").value=data.barber_id||"";$("cancelEditBtn").hidden=false;$("saveBlockBtn").textContent="ذخیره تغییرات";$("availabilityManager").scrollIntoView({behavior:"smooth"});
}
async function deleteBlock(id){
  if(!confirm("این بازه بسته حذف شود؟"))return;
  const {error}=await supabase.from("availability_blocks").delete().eq("id",id);
  if(error)return msg(error.message);
  await loadAvailability();msg("بازه حذف شد.");
}

async function loadData(){
  state.user=await getCurrentUser();
  if(!state.user){location.href="login.html";return;}
  state.profile=await getCurrentProfile();
  state.role=state.profile?.is_admin?"admin":(state.profile?.role==="barber"&&state.profile?.barber_id?"barber":"customer");
  state.barber=state.role==="barber"?await getCurrentBarber():null;
  state.customer=state.role==="customer"?await getCurrentCustomer():null;
  state.barbers=unwrap(await getBarbers());
  state.services=unwrap(await getServices());

  if(state.role==="customer") state.reservations=unwrap(await getCurrentCustomerReservations());
  else if(state.role==="barber") state.reservations=unwrap(await getCurrentBarberReservations());
  else state.reservations=unwrap(await getReservations());

  $("profileApp").hidden=false;$("profileLoader").style.display="none";
  $("roleLabel").textContent=state.role==="admin"?"پنل مدیریت":state.role==="barber"?"پنل آرایشگر":"حساب مشتری";
  const name=state.role==="customer"?([state.customer?.first_name,state.customer?.last_name].filter(Boolean).join(" ")||"مشتری"):state.role==="barber"?(state.barber?.name||"آرایشگر"):(state.profile?.display_name||"مدیر سالن");
  $("welcomeName").textContent=`سلام ${name}`;
  $("accountLine").textContent=state.user.email||state.customer?.phone||state.barber?.phone||"حساب فعال";

  const total=state.reservations.length, upcoming=state.reservations.filter(r=>String(r.status).toLowerCase()==="reserved"&&!isPast(r)).length, completed=state.reservations.filter(r=>String(r.status).toLowerCase()==="completed").length;
  const revenue=state.reservations.filter(r=>String(r.status).toLowerCase()==="completed").reduce((s,r)=>s+Number(r.total_price??r.price??r.amount??0),0);
  setStats(state.role==="admin"?[
    {label:"کل رزروها",value:total.toLocaleString("fa-IR")},{label:"رزروهای باز",value:upcoming.toLocaleString("fa-IR")},{label:"تکمیل‌شده",value:completed.toLocaleString("fa-IR")},{label:"درآمد ثبت‌شده",value:money(revenue)}
  ]:state.role==="barber"?[
    {label:"کل رزروها",value:total.toLocaleString("fa-IR")},{label:"رزروهای باز",value:upcoming.toLocaleString("fa-IR")},{label:"تکمیل‌شده",value:completed.toLocaleString("fa-IR")},{label:"درآمد ثبت‌شده",value:money(revenue)}
  ]:[
    {label:"کل رزروها",value:total.toLocaleString("fa-IR")},{label:"نوبت‌های آینده",value:upcoming.toLocaleString("fa-IR")},{label:"مراجعه تکمیل‌شده",value:completed.toLocaleString("fa-IR")},{label:"وضعیت حساب",value:"فعال"}
  ]);

  $("customerDashboard").hidden=state.role!=="customer";$("barberDashboard").hidden=state.role!=="barber";$("adminDashboard").hidden=state.role!=="admin";$("availabilityManager").hidden=!["admin","barber"].includes(state.role);
  if(state.role==="customer")renderReservations("customerReservations",state.reservations);
  if(state.role==="barber")renderReservations("barberReservations",state.reservations);
  if(state.role==="admin"){renderReservations("adminReservations",state.reservations.slice(0,30));renderCustomers();renderBarbers();renderReports();}
  await loadAvailability();
  $("accountDetails").innerHTML=[
    ["ایمیل",state.user.email||"ثبت نشده"],["شماره موبایل",state.customer?.phone||state.barber?.phone||"—"],["نقش",state.role==="admin"?"مدیر":state.role==="barber"?"آرایشگر":"مشتری"],
    ["شناسه حساب",state.user.id],["آدرس سالن","مشهد، کوی امیرالمومنین، خیابان ولیعصر، ولیعصر ۱۶"],["تلفن سالن","۰۹۳۸۰۴۴۹۹۸۷"]
  ].map(x=>`<div class="account-item"><small>${esc(x[0])}</small><strong>${esc(x[1])}</strong></div>`).join("");
}

$("availabilityForm")?.addEventListener("submit",saveBlock);
$("cancelEditBtn")?.addEventListener("click",resetBlockForm);
$("refreshBtn")?.addEventListener("click",()=>loadData().catch(e=>msg(e.message)));
$("logoutBtn")?.addEventListener("click",async()=>{await signOutUser();location.href="index.html";});

document.addEventListener("click",e=>{
  const action=e.target.closest("[data-action]");if(action)handleReservationAction(action.dataset.action,action.dataset.id);
  const edit=e.target.closest("[data-block-edit]");if(edit)editBlock(edit.dataset.blockEdit);
  const del=e.target.closest("[data-block-delete]");if(del)deleteBlock(del.dataset.blockDelete);
  const scroll=e.target.closest("[data-scroll]");if(scroll)$(scroll.dataset.scroll)?.scrollIntoView({behavior:"smooth"});
});

loadData().catch(e=>{console.error(e);$("profileLoader").style.display="none";$("profileApp").hidden=false;msg(e?.message||"دریافت اطلاعات پنل انجام نشد.");});
