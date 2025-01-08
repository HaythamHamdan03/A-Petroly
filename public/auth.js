import {
  signInWithRedirect,
  getRedirectResult,
  OAuthProvider,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/9.16.0/firebase-auth.js";
import { auth } from "./firebase.js";

const microsoftProvider = new OAuthProvider("microsoft.com");

// Specify the tenant ID for KFUPM
microsoftProvider.setCustomParameters({
  tenant: "29b4b088-d27d-4129-b9f9-8637b59ea4b3", // Replace with your Tenant ID
});

console.log("auth.js is loaded!");

// Check if the user is already signed in after a redirect
getRedirectResult(auth)
  .then((result) => {
    if (result) {
      const user = result.user;

      // Update the UI to show the user's info
      const userInfoDiv = document.querySelector(".user-info");
      userInfoDiv.innerHTML = `
          <img src="${
            user.photoURL || "/images/user.webp"
          }" alt="User Icon" class="user-icon" />
          <span>${user.displayName || "User"}</span>
        `;

      // Check if redirect URL is stored (e.g., from the "Add Yours!" button)
      const redirectUrl = localStorage.getItem("redirectAfterLogin");
      if (redirectUrl) {
        localStorage.removeItem("redirectAfterLogin"); // Clear it after use
        window.location.href = redirectUrl; // Redirect the user
      }
    }
  })
  .catch((error) => {
    console.error("Error after redirect:", error);
  });

// Listen for auth state changes
onAuthStateChanged(auth, (user) => {
  const userInfoDiv = document.querySelector(".user-info");

  if (user) {
    // Store the user's email in localStorage for later use
    localStorage.setItem("userEmail", user.email);

    // User is signed in - update the UI
    userInfoDiv.innerHTML = `
            <img src="${
              user.photoURL || "/images/user.webp"
            }" alt="User Icon" class="user-icon" />
            <span>${user.displayName || "User"}</span>
          `;
    console.log("Auth state changed - User signed in:", user);
  } else {
    // User is not signed in - clear stored email
    localStorage.removeItem("userEmail");

    // Show Sign In button
    userInfoDiv.innerHTML = `<button id="auth-button">Sign In</button>`;
    document.getElementById("auth-button").addEventListener("click", () => {
      signInWithRedirect(auth, microsoftProvider);
    });
    console.log("Auth state changed - No user signed in.");
  }
});

// Add logic for the "Add Yours!" button
document.getElementById("add-files-btn").addEventListener("click", () => {
  if (auth.currentUser) {
    // User is signed in, take them to /add-files
    window.location.href = "/add-files"; // Match the route in server.js
  } else {
    // User is not signed in, store the redirect URL and take them to Sign In
    localStorage.setItem("redirectAfterLogin", "/add-files"); // Match the route
    signInWithRedirect(auth, microsoftProvider);
  }
});
