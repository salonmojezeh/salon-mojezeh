import { db } from "./firebase.js";

import {
    collection,
    addDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";



let selectedTime = "";



// انتخاب ساعت

const timeButtons = document.querySelectorAll(".time");


timeButtons.forEach(button => {


    button.addEventListener("click", function(){


        document.querySelectorAll(".time").forEach(btn => {

            btn.classList.remove("selected");

        });



        this.classList.add("selected");


        selectedTime = this.innerText;



    });


});





// ثبت رزرو

window.reserve = async function(){



    const service = document.getElementById("service").value;


    const date = document.getElementById("date").value;


    const name = document.getElementById("name").value;


    const phone = document.getElementById("phone").value;





    if(
        service === "" ||
        date === "" ||
        selectedTime === "" ||
        name === "" ||
        phone === ""
    ){


        alert("لطفاً همه اطلاعات را کامل کنید");


        return;


    }





    try {



        await addDoc(
            collection(db, "reservations"),
            {


                service: service,


                date: date,


                time: selectedTime,


                name: name,


                phone: phone,


                status: "reserved",


                createdAt: new Date()



            }
        );



        alert("رزرو شما با موفقیت ثبت شد");



        document.getElementById("name").value = "";

        document.getElementById("phone").value = "";



    }


    catch(error){


        console.log(error);


        alert("خطا در ثبت رزرو");


    }



};
