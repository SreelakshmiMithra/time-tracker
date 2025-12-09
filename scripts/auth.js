// scripts/auth.js
import { auth } from "./config.js";
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    GoogleAuthProvider, 
    signInWithPopup 
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

// DOMContentLoaded ensures the HTML is fully loaded before JS runs
document.addEventListener("DOMContentLoaded", () => {
    
    // --- Elements ---
    const loginBtn = document.getElementById("loginBtn");
    const signupBtn = document.getElementById("signupBtn");
    const googleBtn = document.getElementById("googleLoginBtn");
    const emailInput = document.getElementById("email");
    const passInput = document.getElementById("password");

    // --- Helper Validation ---
    const getCredentials = () => {
        const email = emailInput.value.trim();
        const password = passInput.value;
        if (!email || !password) {
            alert("Please enter both email and password.");
            return null;
        }
        return { email, password };
    };

    // --- Login Handler ---
    if(loginBtn) {
        loginBtn.addEventListener("click", async () => {
            const creds = getCredentials();
            if(!creds) return;

            loginBtn.textContent = "Logging in...";
            try {
                await signInWithEmailAndPassword(auth, creds.email, creds.password);
                window.location.href = "dashboard.html";
            } catch (error) {
                console.error(error);
                alert("Login Failed: " + error.message);
                loginBtn.textContent = "Login";
            }
        });
    }

    // --- Signup Handler ---
    if(signupBtn) {
        signupBtn.addEventListener("click", async () => {
            const creds = getCredentials();
            if(!creds) return;

            if(creds.password.length < 6) {
                alert("Password must be at least 6 characters.");
                return;
            }

            signupBtn.textContent = "Creating...";
            try {
                await createUserWithEmailAndPassword(auth, creds.email, creds.password);
                alert("Account created! Redirecting...");
                window.location.href = "dashboard.html";
            } catch (error) {
                console.error(error);
                alert("Signup Failed: " + error.message);
                signupBtn.textContent = "Create Account";
            }
        });
    }

    // --- Google Handler ---
    if(googleBtn) {
        googleBtn.addEventListener("click", async () => {
            const provider = new GoogleAuthProvider();
            try {
                await signInWithPopup(auth, provider);
                window.location.href = "dashboard.html";
            } catch (error) {
                console.error(error);
                alert("Google Sign-In Error: " + error.message);
            }
        });
    }
});