import {signUpCustomer,normalizeDigits} from "./supabase.js";
const form=document.getElementById("signupForm"),message=document.getElementById("formMessage"),button=document.getElementById("signupSubmit"),phone=document.getElementById("phone");
phone.addEventListener("input",()=>phone.value=normalizeDigits(phone.value).replace(/\D/g,"").slice(0,11));
form.addEventListener("submit",async e=>{e.preventDefault();message.textContent="";message.className="form-message";
const firstName=document.getElementById("firstName").value.trim(),lastName=document.getElementById("lastName").value.trim(),email=document.getElementById("email").value.trim(),password=document.getElementById("password").value,confirm=document.getElementById("confirmPassword").value,birthDate=document.getElementById("birthDate").value;
if(password!==confirm){message.textContent="رمز عبور و تکرار آن یکسان نیستند.";return;}
button.disabled=true;button.textContent="در حال ساخت حساب...";
try{const result=await signUpCustomer({firstName,lastName,phone:phone.value,email,password,birthDate});message.className="form-message success";
if(result?.session){message.textContent="ثبت‌نام انجام شد. در حال انتقال به پروفایل...";setTimeout(()=>location.href="profile.html",700);}
else{message.textContent="درخواست ثبت‌نام ارسال شد. اگر تأیید پیامکی در Supabase فعال است، کد تأیید را تکمیل کنید؛ سپس وارد حساب شوید.";}}
catch(err){console.error(err);message.textContent=err.message||"ثبت‌نام انجام نشد. تنظیمات احراز هویت Supabase را بررسی کنید.";}
finally{button.disabled=false;button.textContent="ثبت‌نام";}});
