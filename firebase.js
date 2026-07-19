// اتصال Firebase سالن معجزه

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCeDSU7d3JyNgny0MWjEpYYY4QrMTMDngs",
  authDomain: "salon-mojezeh.firebaseapp.com",
  projectId: "salon-mojezeh",
  storageBucket: "salon-mojezeh.firebasestorage.app",
  messagingSenderId: "1023073696440",
  appId: "1:1023073696440:web:98f95b75e36408d990124d"
};


// راه اندازی Firebase
const app = initializeApp(firebaseConfig);


// اتصال به Firestore
const db = getFirestore(app);


console.log("Firebase و Firestore آماده اتصال هستند");
