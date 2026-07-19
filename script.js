import { db } from "./firebase.js";
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


let selectedTime = "";


function selectTime(time) {

    selectedTime = time;

    alert("ساعت انتخاب شد: " + time);

}



async function reserve() {


    if (selectedTime === "") {

        alert("لطفاً ابتدا یک ساعت انتخاب کنید");

        return;

    }


    const name = document.getElementById("name").value;

    const phone = document.getElementById("phone").value;



    if (name === "" || phone === "") {

        alert("لطفاً نام و شماره تماس را وارد کنید");

        return;

    }



    try {


        await addDoc(collection(db, "reservations"), {


            name: name,

            phone: phone,

            time: selectedTime,

            status: "reserved",

            date: new Date().toLocaleDateString("fa-IR")


        });



        alert("رزرو شما با موفقیت ثبت شد");


    } catch(error) {


        alert("خطا در ثبت رزرو");

        console.log(error);


    }

}
