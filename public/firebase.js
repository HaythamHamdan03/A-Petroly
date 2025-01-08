// Load Firebase from CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.16.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.16.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyA1yaz-iAgETeK6CAldsgK_Ep4nhDy5Jag",
  authDomain: "petroly-auth.firebaseapp.com",
  projectId: "petroly-auth",
  storageBucket: "petroly-auth.appspot.com",
  messagingSenderId: "161063934107",
  appId: "1:161063934107:web:50c6973e76a5737d2c8e3e",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Firebase Auth
export const auth = getAuth(app);
