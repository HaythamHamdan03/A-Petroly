// Load Firebase from CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.16.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.16.0/firebase-auth.js";

// Firebase configuration object
const firebaseConfig = {
  apiKey: "AIzaSyA1yaz-iAgETeK6CAldsgK_Ep4nhDy5Jag",  // Your API Key
  authDomain: "petroly-auth.firebaseapp.com",       // Your Auth Domain
  projectId: "petroly-auth",                        // Your Project ID
  storageBucket: "petroly-auth.appspot.com",        // Your Storage Bucket
  messagingSenderId: "161063934107",                // Your Sender ID
  appId: "1:161063934107:web:50c6973e76a5737d2c8e3e",  // Your App ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Firebase Auth
export const auth = getAuth(app);
