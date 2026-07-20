// ==================== متغیرهای سراسری ====================

let currentStep = 1;
const totalSteps = 4;
let reserveData = {
    firstName: '',
    lastName: '',
    phone: '',
    service: '',
    date: '',
    time: ''
};

// ==================== تابع تغییر مرحله ====================

function updateStep(step) {
    // مخفی کردن تمام مراحل
    document.querySelectorAll('.steps').forEach(s => s.classList.remove('active'));
    
    // نمایش مرحله جدید
    document.getElementById(`step${step}`).classList.add('active');
    
    // آپدیت Progress Bar
    const progress = (step / totalSteps) * 100;
    document.getElementById('progressFill').style.width = progress + '%';
    
    // آپدیت دکمه‌ها
    document.getElementById('prevBtn').disabled = step === 1;
    document.getElementById('nextBtn').style.display = step === totalSteps ? 'none' : 'flex';
    document.getElementById('submitBtn').style.display = step === totalSteps ? 'block' : 'none';
    
    // اسکرول به بالا
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function nextStep() {
    // چک کردن مرحله فعلی
    if (!validateStep(currentStep)) {
        return;
    }
    
    // ذخیره داده‌ها
    saveStepData(currentStep);
    
    if (currentStep < totalSteps) {
        currentStep++;
        updateStep(currentStep);
    }
}

function prevStep() {
    if (currentStep > 1) {
        currentStep--;
        updateStep(currentStep);
    }
}

// ==================== تابع چک کردن داده‌ها ====================

function validateStep(step) {
    switch(step) {
        case 1:
            const firstName = document.getElementById('firstName').value.trim();
            const lastName = document.getElementById('lastName').value.trim();
            const phone = document.getElementById('phone').value.trim();
            
            if (!firstName) {
                alert('لطفاً نام را وارد کنید');
                return false;
            }
            if (!lastName) {
                alert('لطفاً نام خانوادگی را وارد کنید');
                return false;
            }
            if (!phone) {
                alert('لطفاً شماره موبایل را وارد کنید');
                return false;
            }
            if (!phone.match(/^09\d{9}$/)) {
                alert('لطفاً شماره موبایل درست را وارد کنید');
                return false;
            }
            return true;
            
        case 2:
            const service = document.querySelector('input[name="service"]:checked');
            if (!service) {
                alert('لطفاً یک خدمت را انتخاب کنید');
                return false;
            }
            return true;
            
        case 3:
            const date = document.querySelector('input[name="date"]:checked');
            if (!date) {
                alert('لطفاً یک روز را انتخاب کنید');
                return false;
            }
            return true;
            
        case 4:
            const time = document.querySelector('input[name="time"]:checked');
            if (!time) {
                alert('لطفاً یک ساعت را انتخاب کنید');
                return false;
            }
            return true;
    }
    return true;
}

// ==================== تابع ذخیره داده‌ها ====================

function saveStepData(step) {
    switch(step) {
        case 1:
            reserveData.firstName = document.getElementById('firstName').value;
            reserveData.lastName = document.getElementById('lastName').value;
            reserveData.phone = document.getElementById('phone').value;
            break;
            
        case 2:
            reserveData.service = document.querySelector('input[name="service"]:checked').value;
            break;
            
        case 3:
            reserveData.date = document.querySelector('input[name="date"]:checked').value;
            break;
            
        case 4:
            reserveData.time = document.querySelector('input[name="time"]:checked').value;
            break;
    }
}

// ==================== تابع تولید تقویم شمسی ====================

function generateCalendar() {
    const calendarDiv = document.getElementById('calendar');
    calendarDiv.innerHTML = '';
    
    // تاریخ امروز
    const today = new Date();
    
    // ۳۰ روز آینده
    for (let i = 0; i < 30; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() + i);
        
        // تبدیل به تقویم شمسی (تقریبی)
        const jalali = gregorianToJalali(date);
        const dayName = getDayName(date.getDay());
        
        const label = `${dayName}\n${jalali.day} ${jalali.month}`;
        
        const dayDiv = document.createElement('label');
        dayDiv.className = 'day-option';
        dayDiv.innerHTML = `
            <input type="radio" name="date" value="${date.toISOString().split('T')[0]}">
            <span>${dayName}<br>${jalali.day}</span>
        `;
        
        dayDiv.addEventListener('click', function() {
            document.querySelectorAll('.day-option').forEach(d => d.classList.remove('selected'));
            this.classList.add('selected');
        });
        
        calendarDiv.appendChild(dayDiv);
    }
}

// ==================== تابع تبدیل تقویم ====================

function gregorianToJalali(d) {
    const gy = d.getFullYear();
    const gm = d.getMonth() + 1;
    const gd = d.getDate();

    let jy, jm, jd;
    const g_d_n = 365 * gy + Math.floor((gy + 3) / 4) - Math.floor((gy + 99) / 100) + Math.floor((gy + 399) / 400);

    for (jy = 0; jy <= gy; jy++) {
        if (jy > 0) {
            var j_d_n = 365 * jy + Math.floor(jy / 33) * 8 + Math.floor((jy % 33 + 3) / 4);
            if (g_d_n < j_d_n) {
                jy--;
                break;
            }
        }
    }

    const j_day_no = g_d_n - (365 * jy + Math.floor(jy / 33) * 8 + Math.floor((jy % 33 + 3) / 4));

    if (j_day_no < 186) {
        jm = 1 + Math.floor(j_day_no / 31);
        jd = 1 + (j_day_no % 31);
    } else {
        jm = 7 + Math.floor((j_day_no - 186) / 30);
        jd = 1 + ((j_day_no - 186) % 30);
    }

    const months = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];

    return {
        year: jy,
        month: months[jm - 1],
        day: jd
    };
}

function getDayName(day) {
    const days = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه', 'شنبه'];
    return days[day];
}

// ==================== تابع تولید ساعت‌ها ====================

function generateTimes() {
    const timesGrid = document.getElementById('timesGrid');
    timesGrid.innerHTML = '';
    
    // ساعت‌های ۹ صبح تا ۲۱ شب
    for (let hour = 9; hour <= 21; hour++) {
        const timeStr = String(hour).padStart(2, '0') + ':00';
        
        // تصادفی: ۳۰% ساعت‌ها رزرو شده
        const isBooked = Math.random() < 0.3;
        
        const timeDiv = document.createElement('label');
        timeDiv.className = `time-option ${isBooked ? 'booked' : 'available'}`;
        timeDiv.innerHTML = `
            <input type="radio" name="time" value="${timeStr}" ${isBooked ? 'disabled' : ''}>
            <span>${timeStr}</span>
        `;
        
        if (!isBooked) {
            timeDiv.addEventListener('click', function() {
                document.querySelectorAll('.time-option').forEach(t => t.classList.remove('selected'));
                this.classList.add('selected');
            });
        }
        
        timesGrid.appendChild(timeDiv);
    }
}

// ==================== تابع ثبت رزرو ====================

function submitReserve(e) {
    e.preventDefault();
    
    // چک کردن مرحله آخر
    if (!validateStep(4)) {
        return;
    }
    
    // ذخیره داده آخری
    saveStepData(4);
    
    // نمایش پیام موفقیت
    showSuccessMessage();
    
    // ذخیره در Firebase (اگر متصل باشد)
    if (typeof db !== 'undefined') {
        saveToFirebase();
    }
}

// ==================== تابع نمایش پیام موفقیت ====================

function showSuccessMessage() {
    const successDetails = document.getElementById('successDetails');
    successDetails.innerHTML = `
        <strong>نام:</strong> ${reserveData.firstName} ${reserveData.lastName}<br>
        <strong>موبایل:</strong> ${reserveData.phone}<br>
        <strong>خدمت:</strong> ${reserveData.service}<br>
        <strong>روز:</strong> ${reserveData.date}<br>
        <strong>ساعت:</strong> ${reserveData.time}
    `;
    
    document.getElementById('successModal').classList.add('show');
}

// ==================== توابع کمکی ====================

function goHome() {
    window.location.href = 'index.html';
}

function contactSalon() {
    window.location.href = 'tel:+989123456789';
}

// ==================== تابع ذخیره در Firebase ====================

function saveToFirebase() {
    try {
        db.collection('reserves').add({
            firstName: reserveData.firstName,
            lastName: reserveData.lastName,
            phone: reserveData.phone,
            service: reserveData.service,
            date: reserveData.date,
            time: reserveData.time,
            createdAt: new Date(),
            status: 'pending'
        }).then(() => {
            console.log('رزرو ثبت شد ✅');
        }).catch(error => {
            console.error('خطا در ثبت رزرو:', error);
        });
    } catch (error) {
        console.log('Firebase متصل نیست');
    }
}

// ==================== Event Listeners ====================

document.addEventListener('DOMContentLoaded', () => {
    // تولید تقویم
    generateCalendar();
    
    // تولید ساعت‌ها
    generateTimes();
    
    // Radio buttons برای خدمات
    document.querySelectorAll('.service-option input').forEach(radio => {
        radio.addEventListener('change', function() {
            document.querySelectorAll('.service-option').forEach(opt => opt.classList.remove('selected'));
            this.closest('.service-option').classList.add('selected');
        });
    });
    
    // ثبت فرم
    document.getElementById('reserveForm').addEventListener('submit', submitReserve);
    
    // مرحله اولیه
    updateStep(1);
});

// ==================== منوی کشویی (مثل صفحه اصلی) ====================

function openSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    
    sidebar.classList.add('active');
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    
    sidebar.classList.remove('active');
    overlay.classList.remove('active');
    document.body.style.overflow = 'auto';
}

document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
        closeSidebar();
    });
});
