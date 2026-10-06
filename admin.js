import {
  supabase,
  getCurrentUser,
  getCurrentUserProfile,
  getReservations,
  getBarbers,
  getServices,
  completeReservation,
  cancelReservation,
  markReservationNoShow,
  signOutUser
} from "./supabase.js";

const $ = (s) => document.querySelector(s);
let user=null, profile=null, reservations=[], customers=[], barbers=[], services=[], blocks=[];

const fa=n=>new Intl.NumberFormat("fa-IR").format(Number(n||0));
const esc=v=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
const today=()=>new Date().toISOString().slice(0,10);
const tm=v=>v?String(v).slice(0,5):"—";
const dateFa=v=>{if(!v)return"—";try{return new Intl.DateTimeFormat("fa-IR-u-ca-persian",{year:"numeric",month:"long",day:"numeric"}).format(new Date(`${v}T00:00:00`));}catch{return v;}};
const statusMap={reserved:["رزرو شده","reserved"],completed:["تکمیل شده","completed"],cancelled:["لغو شده","cancelled"],no_show:["عدم مراجعه","no_show"]};
const list=x=>Array.isArray(x)?x:(x?.data||[]);
const customerName=c=>[c?.first_name??c?.firstName,c?.last_name??c?.lastName].filter(Boolean).join(" ")||"مشتری";
const normalizeDigits=v=>String(v||"").replace(/[۰-۹]/g,d=>"۰۱۲۳۴۵۶۷۸۹".indexOf(d)).replace(/[٠-٩]/g,d=>"٠١٢٣٤٥٦٧٨٩".indexOf(d));

function showMessage(text,type="error",target="#adminMessage"){
  const el=$(target); if(!el)return;
  el.hidden=false; el.className=`admin-message ${type}`; el.textContent=text;
  setTimeout(()=>el.hidden=true,4500);
}
function barberName(id){return barbers.find(b=>b.id===id)?.name||"آرایشگر";}
function serviceName(id){return services.find(s=>s.id===id)?.name||"خدمت";}
function customerFor(r){return customers.find(c=>c.id===r.customer_id);}
function reservationName(r){return r.customer_name||[r.first_name,r.last_name].filter(Boolean).join(" ")||customerName(customerFor(r));}
function price(r){return Number(r?.price??r?.amount??r?.total_price??r?.service_price??0);}
function past(r){return r?.date?new Date(`${r.date}T${r.time||"23:59"}:00`)<new Date():false;}

function renderStats(){
  const todayRows=reservations.filter(r=>r.date===today());
  const upcoming=reservations.filter(r=>r.status==="reserved"&&!past(r)).length;
  const completed=reservations.filter(r=>r.status==="completed").length;
  const birthdays=customers.filter(c=>isBirthdayWithin(c,30)).length;
  const cards=[
    ["رزرو امروز",todayRows.length,"purple"],
    ["رزروهای آینده",upcoming,"green"],
    ["مشتریان",customers.length,"cyan"],
    ["تکمیل‌شده",completed,"gold"],
    ["تولدهای نزدیک",birthdays,"pink"]
  ];
  $("#statsGrid").innerHTML=cards.map(([a,b,c])=>`<div class="stat-card"><span><i class="dot" style="background:${c==="green"?"#11913b":c==="cyan"?"#159aaa":c==="gold"?"#b08b32":c==="pink"?"#ad4c79":"#6f2a91"}"></i>${a}</span><strong>${fa(b)}</strong></div>`).join("");
}

function reservationCard(r){
  const [label,cls]=statusMap[r.status]||[r.status||"—",""];
  const cname=reservationName(r);
  const bname=r.barber_name||barberName(r.barber_id);
  const sname=r.service_name||r.service||serviceName(r.service_id);
  const actions=r.status==="reserved"?`
    <button class="mini-btn success" data-action="complete" data-id="${esc(r.id)}">تکمیل</button>
    <button class="mini-btn" data-action="noshow" data-id="${esc(r.id)}">عدم مراجعه</button>
    <button class="mini-btn danger" data-action="cancel" data-id="${esc(r.id)}">لغو</button>`:"";
  return `<article class="reservation-card">
    <div class="reservation-top"><div><h3>${esc(cname)}</h3><div class="muted">${esc(sname)} · ${esc(bname)}</div></div><span class="status ${cls}">${esc(label)}</span></div>
    <div class="card-row muted"><span>${esc(dateFa(r.date))}</span><strong>${esc(tm(r.time||r.start_time))}</strong></div>
    <div class="muted">${r.phone?`موبایل: ${esc(r.phone)}`:""} ${price(r)?` · مبلغ: ${fa(price(r))} تومان`:""}</div>
    ${actions?`<div class="reservation-actions">${actions}</div>`:""}
  </article>`;
}

function renderReservations(){
  const date=$("#reservationDateFilter").value;
  const barber=$("#reservationBarberFilter").value;
  const status=$("#reservationStatusFilter").value;
  const q=normalizeDigits($("#reservationSearch").value.trim()).toLowerCase();

  let rows=reservations.filter(r=>{
    if(date&&r.date!==date)return false;
    if(barber&&r.barber_id!==barber)return false;
    if(status&&r.status!==status)return false;
    if(q){
      const text=[reservationName(r),r.phone,r.customer_phone,r.service_name,r.service,r.notes].filter(Boolean).join(" ").toLowerCase();
      if(!normalizeDigits(text).includes(q))return false;
    }
    return true;
  }).sort((a,b)=>`${a.date||""}${a.time||""}`.localeCompare(`${b.date||""}${b.time||""}`));

  $("#reservationsList").innerHTML=rows.length?rows.map(reservationCard).join(""):`<div class="empty">رزروی با این فیلتر پیدا نشد.</div>`;
  renderDaySchedule(date||today());
}

function renderDaySchedule(date){
  const rows=reservations.filter(r=>r.date===date).sort((a,b)=>tm(a.time||a.start_time).localeCompare(tm(b.time||b.start_time)));
  $("#daySchedule").innerHTML=`<div class="day-title">${esc(dateFa(date))} — ${fa(rows.length)} رزرو</div>`+(rows.length?rows.slice(0,12).map(r=>`<div class="mini-item"><strong>${esc(tm(r.time||r.start_time))} · ${esc(reservationName(r))}</strong><span>${esc(serviceName(r.service_id))} · ${esc(barberName(r.barber_id))}</span></div>`).join(""):`<div class="mini-item"><span>برای این روز رزروی ثبت نشده است.</span></div>`);
}

function renderToday(){
  const rows=reservations.filter(r=>r.date===today()).sort((a,b)=>tm(a.time||a.start_time).localeCompare(tm(b.time||b.start_time))).slice(0,8);
  $("#todayReservations").innerHTML=rows.length?rows.map(r=>`<div class="mini-item"><strong>${esc(tm(r.time||r.start_time))} · ${esc(reservationName(r))}</strong><span>${esc(serviceName(r.service_id))}</span></div>`).join(""):`<div class="empty">امروز رزروی ثبت نشده است.</div>`;
}

function getBirthDate(c){
  return c?.birth_date||c?.birthDate||c?.birthday||null;
}
function isBirthdayWithin(c,days){
  const raw=getBirthDate(c); if(!raw)return false;
  const d=new Date(`${raw}T00:00:00`); if(Number.isNaN(d.getTime()))return false;
  const now=new Date(); const target=new Date(now.getFullYear(),d.getMonth(),d.getDate());
  if(target<new Date(now.getFullYear(),now.getMonth(),now.getDate()))target.setFullYear(now.getFullYear()+1);
  return Math.ceil((target-new Date(now.getFullYear(),now.getMonth(),now.getDate()))/86400000)<=days;
}
function birthdayToday(c){
  const raw=getBirthDate(c); if(!raw)return false;
  const d=new Date(`${raw}T00:00:00`); const n=new Date();
  return d.getMonth()===n.getMonth()&&d.getDate()===n.getDate();
}

function renderBirthdays(){
  const rows=customers.filter(c=>isBirthdayWithin(c,30)).sort((a,b)=>getBirthDate(a).slice(5).localeCompare(getBirthDate(b).slice(5)));
  $("#birthdayPreview").innerHTML=rows.length?rows.slice(0,6).map(c=>`<div class="mini-item"><strong>${esc(customerName(c))}</strong><span>${esc(getBirthDate(c))}</span></div>`).join(""):`<div class="empty">تولد نزدیک ثبت نشده است.</div>`;
}

function renderCustomers(){
  const q=normalizeDigits($("#customerSearch").value.trim()).toLowerCase();
  const rows=customers.filter(c=>!q||normalizeDigits([customerName(c),c.phone,c.email].filter(Boolean).join(" ").toLowerCase()).includes(q));
  $("#customersList").innerHTML=rows.length?rows.map(c=>`<article class="customer-card" data-customer-id="${esc(c.id)}">
    <div class="card-row"><h3>${esc(customerName(c))}</h3><span class="tag">${fa(c.club_points??c.points??0)} امتیاز</span></div>
    <div class="muted">${esc(c.phone||"بدون موبایل")} · تولد: ${esc(getBirthDate(c)||"ثبت نشده")}</div>
  </article>`).join(""):`<div class="empty">مشتری‌ای پیدا نشد.</div>`;
}

function renderBarbers(){
  $("#barbersList").innerHTML=barbers.length?barbers.map(b=>{
    const count=reservations.filter(r=>r.barber_id===b.id&&r.status==="reserved"&&!past(r)).length;
    return `<article class="barber-card"><div class="card-row"><h3>${esc(b.name||"آرایشگر")}</h3><span class="tag">${b.active===false?"غیرفعال":"فعال"}</span></div><div class="muted">${esc(b.phone||"—")}</div><div class="muted">${fa(count)} نوبت آینده</div></article>`;
  }).join(""):`<div class="empty">آرایشگری ثبت نشده است.</div>`;
}

function renderClub(){
  let filter=$("#birthdayFilter").value;
  let rows=[...customers];
  if(filter==="today")rows=rows.filter(birthdayToday);
  if(filter==="30")rows=rows.filter(c=>isBirthdayWithin(c,30));
  rows.sort((a,b)=>customerName(a).localeCompare(customerName(b),"fa"));
  $("#clubList").innerHTML=rows.length?rows.map(c=>{
    const gift=Boolean(c.free_gift??c.freeGift??false);
    return `<article class="club-card">
      <div class="card-row"><h3>${esc(customerName(c))}</h3><span class="tag">${fa(c.club_points??c.points??0)} امتیاز</span></div>
      <div class="muted">موبایل: ${esc(c.phone||"—")}</div>
      <div class="muted">تولد: ${esc(getBirthDate(c)||"ثبت نشده")}</div>
      <div class="muted">هدیه تولد: ${gift?"فعال":"ثبت نشده"}</div>
      <div class="club-actions">
        <button class="mini-btn info" data-customer-id="${esc(c.id)}">مشاهده پرونده</button>
        ${gift?"":`<button class="mini-btn success" data-gift-id="${esc(c.id)}">ثبت هدیه</button>`}
      </div>
    </article>`;
  }).join(""):`<div class="empty">موردی برای نمایش وجود ندارد.</div>`;
}

function renderServices(){
  $("#servicesList").innerHTML=services.length?services.map(s=>`<article class="service-card">
    <div class="card-row"><h3>${esc(s.name||"خدمت")}</h3><span class="tag">${s.active===false?"غیرفعال":"فعال"}</span></div>
    <div class="muted">${s.price!=null?`${fa(s.price)} تومان`:"قیمت ثبت نشده"} ${s.duration?` · ${esc(s.duration)} دقیقه`:""}</div>
    <div class="muted">${esc(s.description||s.details||"")}</div>
  </article>`).join(""):`<div class="empty">خدمتی ثبت نشده است.</div>`;
}

function renderReports(){
  const revenue=reservations.filter(r=>r.status==="completed").reduce((a,r)=>a+price(r),0);
  const todayCount=reservations.filter(r=>r.date===today()).length;
  const cancel=reservations.filter(r=>r.status==="cancelled").length;
  const noShow=reservations.filter(r=>r.status==="no_show").length;
  $("#reportsGrid").innerHTML=[
    ["درآمد رزروهای تکمیل‌شده",`${fa(revenue)} تومان`],
    ["رزرو امروز",fa(todayCount)],
    ["لغوها",fa(cancel)],
    ["عدم مراجعه",fa(noShow)]
  ].map(([a,b])=>`<div class="report-card"><span>${a}</span><strong>${b}</strong></div>`).join("");
}

async function loadAvailability(){
  let q=supabase.from("availability_blocks").select("*").eq("active",true).gte("block_date",today()).order("block_date").order("start_time");
  const {data,error}=await q;
  if(error){$("#availabilityList").innerHTML=`<div class="empty">خطا: ${esc(error.message)}</div>`;return;}
  blocks=data||[];
  $("#availabilityList").innerHTML=blocks.length?blocks.map(b=>{
    const type=({closed:"بسته / تعطیل",busy:"مشغول",holiday:"تعطیلی مناسبتی",leave:"مرخصی"})[b.block_type]||b.block_type;
    const target=b.barber_id?barberName(b.barber_id):"کل سالن";
    const range=b.start_time&&b.end_time?`${tm(b.start_time)} تا ${tm(b.end_time)}`:"کل روز";
    return `<article class="availability-card"><div class="block-top"><strong class="block-type">${esc(type)}</strong><span class="tag">${esc(target)}</span></div><h3>${esc(dateFa(b.block_date))}</h3><div class="muted">${esc(range)}</div><div class="muted">${esc(b.title||"")} ${b.reason?`— ${esc(b.reason)}`:""}</div><div class="block-actions"><button class="mini-btn" data-block="edit" data-id="${esc(b.id)}">ویرایش</button><button class="mini-btn danger" data-block="delete" data-id="${esc(b.id)}">حذف</button></div></article>`;
  }).join(""):`<div class="empty">هیچ بازه بسته‌ای برای آینده ثبت نشده است.</div>`;
}

function fillBarberFilter(){
  $("#reservationBarberFilter").innerHTML=`<option value="">همه آرایشگران</option>`+barbers.map(b=>`<option value="${esc(b.id)}">${esc(b.name||"آرایشگر")}</option>`).join("");
  $("#blockBarber").innerHTML=`<option value="">کل سالن</option>`+barbers.map(b=>`<option value="${esc(b.id)}">${esc(b.name||"آرایشگر")}</option>`).join("");
}

function resetBlockForm(){
  $("#availabilityEditId").value="";$("#blockDate").value="";$("#blockType").value="closed";$("#blockStart").value="";$("#blockEnd").value="";$("#blockTitle").value="";$("#blockReason").value="";$("#cancelBlockEdit").hidden=true;
}
async function saveBlock(e){
  e.preventDefault();
  const id=$("#availabilityEditId").value,date=$("#blockDate").value,start=$("#blockStart").value,end=$("#blockEnd").value;
  if(!date)return showMessage("تاریخ را انتخاب کنید.");
  if((start&&!end)||(!start&&end))return showMessage("ساعت شروع و پایان را هر دو وارد کنید.");
  if(start&&end&&start>=end)return showMessage("ساعت پایان باید بعد از شروع باشد.");
  const payload={barber_id:$("#blockBarber").value||null,block_date:date,start_time:start||null,end_time:end||null,block_type:$("#blockType").value,title:$("#blockTitle").value.trim()||null,reason:$("#blockReason").value.trim()||null,active:true,updated_at:new Date().toISOString()};
  try{
    if(id){const {error}=await supabase.from("availability_blocks").update(payload).eq("id",id);if(error)throw error;}
    else{payload.created_by=user.id;const {error}=await supabase.from("availability_blocks").insert(payload);if(error)throw error;}
    showMessage("بازه با موفقیت ذخیره شد.","success");resetBlockForm();await loadAvailability();
  }catch(err){showMessage(err.message||"ذخیره انجام نشد.");}
}
async function editBlock(id){
  const {data,error}=await supabase.from("availability_blocks").select("*").eq("id",id).single();
  if(error)return showMessage(error.message);
  $("#availabilityEditId").value=data.id;$("#blockDate").value=data.block_date;$("#blockBarber").value=data.barber_id||"";$("#blockType").value=data.block_type;$("#blockStart").value=tm(data.start_time)==="—"?"":tm(data.start_time);$("#blockEnd").value=tm(data.end_time)==="—"?"":tm(data.end_time);$("#blockTitle").value=data.title||"";$("#blockReason").value=data.reason||"";$("#cancelBlockEdit").hidden=false;$("#availabilitySection").scrollIntoView({behavior:"smooth"});
}
async function deleteBlock(id){
  if(!confirm("این بازه حذف شود؟"))return;
  const {error}=await supabase.from("availability_blocks").delete().eq("id",id);
  if(error)return showMessage(error.message);
  await loadAvailability();
}

async function actionReservation(action,id){
  try{
    if(action==="cancel")await cancelReservation(id);
    if(action==="complete")await completeReservation(id);
    if(action==="noshow")await markReservationNoShow(id);
    await loadData();
    showMessage("عملیات با موفقیت انجام شد.","success");
  }catch(err){showMessage(err.message||"عملیات انجام نشد.");}
}

async function openCustomer(id){
  const c=customers.find(x=>x.id===id); if(!c)return;
  const history=reservations.filter(r=>r.customer_id===id).sort((a,b)=>`${b.date||""}${b.time||""}`.localeCompare(`${a.date||""}${a.time||""}`)).slice(0,12);
  $("#customerModalBody").innerHTML=`<h2>${esc(customerName(c))}</h2>
    <p class="muted">موبایل: ${esc(c.phone||"—")} · ایمیل: ${esc(c.email||"—")}</p>
    <p class="muted">تولد: ${esc(getBirthDate(c)||"ثبت نشده")} · امتیاز: ${fa(c.club_points??c.points??0)}</p>
    <hr>
    <h3>آخرین رزروها</h3>
    ${history.length?history.map(r=>`<div class="mini-item"><strong>${esc(dateFa(r.date))} ${esc(tm(r.time||r.start_time))}</strong><span>${esc(serviceName(r.service_id))} · ${esc(r.status||"—")}</span></div>`).join(""):`<div class="empty">سابقه‌ای ثبت نشده است.</div>`}`;
  $("#customerModal").hidden=false;
}

async function addGift(id){
  const c=customers.find(x=>x.id===id); if(!c)return;
  const field=Object.prototype.hasOwnProperty.call(c,"free_gift")?"free_gift":Object.prototype.hasOwnProperty.call(c,"freeGift")?"freeGift":null;
  if(!field)return showMessage("ستون هدیه در جدول customers وجود ندارد. ابتدا ستون free_gift را در Supabase اضافه کن.");
  const {error}=await supabase.from("customers").update({[field]:true}).eq("id",id);
  if(error)return showMessage(error.message);
  await loadData();showMessage("هدیه تولد برای مشتری ثبت شد.","success");
}

async function loadData(){
  const [r,c,b,s]=await Promise.all([
    getReservations(),
    supabase.from("customers").select("*").order("created_at",{ascending:false}).limit(500),
    getBarbers(),
    getServices()
  ]);
  reservations=list(r);customers=c.data||[];barbers=list(b);services=list(s);
  renderStats();renderToday();renderBirthdays();renderCustomers();renderBarbers();renderClub();renderServices();renderReports();fillBarberFilter();renderReservations();await loadAvailability();
  $("#settingsEmail").textContent=user?.email||"—";
}

function bind(){
  document.addEventListener("click",e=>{
    const target=e.target.closest("[data-target]");
    if(target){const el=$("#"+target.dataset.target);if(el){el.scrollIntoView({behavior:"smooth",block:"start");document.querySelectorAll(".admin-sidebar nav button").forEach(x=>x.classList.toggle("active",x.dataset.target===target.dataset.target));}}
    const action=e.target.closest("[data-action]");if(action)actionReservation(action.dataset.action,action.dataset.id);
    const cust=e.target.closest("[data-customer-id]");if(cust)openCustomer(cust.dataset.customerId);
    const gift=e.target.closest("[data-gift-id]");if(gift)addGift(gift.dataset.giftId);
    const block=e.target.closest("[data-block]");if(block)block.dataset.block==="edit"?editBlock(block.dataset.id):deleteBlock(block.dataset.id);
    const close=e.target.closest("[data-close-modal]");if(close)$("#"+close.dataset.closeModal).hidden=true;
  });

  $("#reservationDateFilter").addEventListener("change",renderReservations);
  $("#reservationBarberFilter").addEventListener("change",renderReservations);
  $("#reservationStatusFilter").addEventListener("change",renderReservations);
  $("#reservationSearch").addEventListener("input",renderReservations);
  $("#customerSearch").addEventListener("input",renderCustomers);
  $("#birthdayFilter").addEventListener("change",renderClub);
  $("#availabilityForm").addEventListener("submit",saveBlock);
  $("#cancelBlockEdit").addEventListener("click",resetBlockForm);
  $("#adminRefresh").addEventListener("click",loadData);
  $("#adminRefreshMobile").addEventListener("click",loadData);
  $("#quickReservation").addEventListener("click",()=>location.href="reserve.html");
  $("#mobileQuickAdd").addEventListener("click",()=>location.href="reserve.html");
  $("#adminLogout").addEventListener("click",async()=>{await signOutUser();location.replace("index.html");});
  $("#mobileMenuBtn").addEventListener("click",()=>$("#adminSidebar").classList.toggle("mobile-open"));
  $("#customerModal").addEventListener("click",e=>{if(e.target.id==="customerModal")e.currentTarget.hidden=true;});
}

function setupDefaults(){
  $("#reservationDateFilter").value=today();
  $("#blockDate").min=today();
  $("#todayLabel").textContent=new Intl.DateTimeFormat("fa-IR-u-ca-persian",{weekday:"long",year:"numeric",month:"long",day:"numeric"}).format(new Date());
}

async function boot(){
  user=await getCurrentUser();
  if(!user){location.replace("login.html");return;}
  profile=await getCurrentUserProfile();
  if(!profile?.is_admin && profile?.role!=="admin"){location.replace("profile.html");return;}
  const display=user?.user_metadata?.full_name||user?.email||"مدیر سالن";
  $("#adminName").textContent=display;$("#adminAvatar").textContent=display.charAt(0)||"م";
  $("#adminRole").textContent="مدیر سالن";
  setupDefaults();bind();await loadData();
  $("#adminLoader").classList.add("hidden");
}

boot().catch(err=>{console.error(err);showMessage(err.message||"پنل مدیریت بارگذاری نشد.");$("#adminLoader").classList.add("hidden");});
