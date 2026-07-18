let selectedTime = "";

function selectTime(time) {
    selectedTime = time;
    alert("ساعت انتخاب شد: " + time);
}

function reserve() {

    if (selectedTime === "") {
        alert("لطفاً ابتدا یک ساعت انتخاب کنید");
        return;
    }

    alert("رزرو شما برای ساعت " + selectedTime + " ثبت شد");
}