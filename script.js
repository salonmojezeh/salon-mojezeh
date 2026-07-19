// اتصال به Firebase

import { db } from "./firebase.js";

import {
collection,
addDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";



let selectedTime = "";



// انتخاب ساعت

document.querySelectorAll(".time").forEach(button => {

    button.addEventListener("click", () => {


        document.querySelectorAll(".time").forEach(btn => {

            btn.classList.remove("selected");

        });



        button.classList.add("selected");


        selectedTime = button.innerText;



    });

});




// ثبت رزرو

window.reserve = async function(){



    const service =
    document.getElementById("service").value;



    const date =
    document.getElementById("date").value;



    const name =
    document.getElementById("name").value;



    const phone =
    document.getElementById("phone").value;




    if(service === "" ||
       date === "" ||
       selectedTime === "" ||
       name === "" ||
       phone === ""){


        alert("لطفاً همه اطلاعات را کامل کنید");

        return;

    }





    try {



        await addDoc(
            collection(db,"reservations"),
            {

                service: service,

                date: date,

                time: selectedTime,

                name: name,

                phone: phone,

                status:"reserved"


            }

        );



        alert("رزرو شما با موفقیت ثبت شد");



    } catch(error){


        console.log(error);


        alert("خطا در ثبت رزرو");


    }


}
