// scripts/config.js
// IMPORTANT: This uses Firebase v11/v12 module syntax compatible with CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAnhnV_mq9mm9U-H_P3LDQmGg1ljmiDezU",
  authDomain: "dashboard-89e93.firebaseapp.com",
  projectId: "dashboard-89e93",
  storageBucket: "dashboard-89e93.firebasestorage.app",
  messagingSenderId: "948892747094",
  appId: "1:948892747094:web:1525c239b9038182fbc2f7",
  measurementId: "G-YPML2RYH1X"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);