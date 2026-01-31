import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

(async () => {
  try {
    // Fetch Firebase config from backend
    const configRes = await fetch("/api/firebase-config", { cache: "no-store" });
    if (!configRes.ok) throw new Error("Failed to fetch Firebase config");

    const firebaseConfig = await configRes.json();

    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);

    const signupForm = document.getElementById("signupForm");
    const signinForm = document.getElementById("signinForm");
    const errorEl = document.getElementById("error");

    // SIGN UP
    if (signupForm) {
      signupForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;
        const university = document.getElementById("university").value;

        try {
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          const token = await userCredential.user.getIdToken();

          const res = await fetch("/api/user/profile", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ university })
          });

          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Failed to save profile");

          window.location.href = "/cards.html";

        } catch (err) {
          errorEl.textContent = err.message;
        }
      });
    }

    // SIGN IN
    if (signinForm) {
      signinForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;

        try {
          await signInWithEmailAndPassword(auth, email, password);
          window.location.href = "/cards.html";
        } catch (err) {
          errorEl.textContent = "Invalid email or password";
        }
      });
    }

  } catch (err) {
    console.error("Failed to initialize Firebase:", err);
  }
})();
