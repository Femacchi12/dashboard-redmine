import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDBmVNRqmjy_bt2UovRtmZVNpKrCTyNjLU",
  authDomain: "dashboards-fibrazo.firebaseapp.com",
  projectId: "dashboards-fibrazo",
  storageBucket: "dashboards-fibrazo.firebasestorage.app",
  messagingSenderId: "926517595208",
  appId: "1:926517595208:web:c1ae62107ee8bacad51c7d"
};

const ALLOWED_DOMAIN = "@fibrazo.com";
const ALLOWED_EMAILS = new Set(["fernandoemacchi@gmail.com"]);

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: "select_account" });

const authTitle = document.getElementById("authTitle");
const authMessage = document.getElementById("authMessage");
const signInButton = document.getElementById("googleSignInBtn");
const changeAccountButton = document.getElementById("changeAccountBtn");
const signOutButton = document.getElementById("signOutBtn");
const headerAccount = document.getElementById("headerAccount");
const signedInEmail = document.getElementById("signedInEmail");

let dashboardLoaded = false;

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function isAuthorizedEmail(value) {
  const email = normalizeEmail(value);
  return email.endsWith(ALLOWED_DOMAIN) || ALLOWED_EMAILS.has(email);
}

function showLogin(message = "Inicia sesión con tu cuenta autorizada para continuar.") {
  document.body.classList.remove("auth-authorized", "auth-denied");
  document.body.classList.add("auth-pending");
  authTitle.textContent = "Dashboard TKs Redmine";
  authMessage.textContent = message;
  signInButton.hidden = false;
  changeAccountButton.hidden = true;
  headerAccount.hidden = true;
}

function showDenied(email) {
  document.body.classList.remove("auth-pending", "auth-authorized");
  document.body.classList.add("auth-denied");
  authTitle.textContent = "Acceso denegado";
  authMessage.textContent = email
    ? `La cuenta ${email} no está autorizada para ver este dashboard.`
    : "Esta cuenta no está autorizada para ver este dashboard.";
  signInButton.hidden = true;
  changeAccountButton.hidden = false;
  headerAccount.hidden = true;
}

function loadDashboard() {
  if (dashboardLoaded) return;
  dashboardLoaded = true;
  const script = document.createElement("script");
  script.src = "app.js?v=93";
  script.defer = true;
  script.onerror = () => {
    dashboardLoaded = false;
    showLogin("No fue posible cargar el dashboard. Actualiza la página e inténtalo nuevamente.");
  };
  document.body.appendChild(script);
}

function showDashboard(user) {
  document.body.classList.remove("auth-pending", "auth-denied");
  document.body.classList.add("auth-authorized");
  signedInEmail.textContent = normalizeEmail(user.email);
  headerAccount.hidden = false;
  loadDashboard();
}

async function startGoogleSignIn() {
  signInButton.disabled = true;
  authMessage.textContent = "Abriendo Google para validar tu cuenta…";
  try {
    await signInWithPopup(auth, provider);
  } catch (error) {
    const popupFallbackCodes = new Set([
      "auth/popup-blocked",
      "auth/cancelled-popup-request",
      "auth/web-storage-unsupported",
      "auth/operation-not-supported-in-this-environment"
    ]);
    if (popupFallbackCodes.has(error.code)) {
      await signInWithRedirect(auth, provider);
      return;
    }
    if (error.code !== "auth/popup-closed-by-user") {
      console.error("Error de autenticación:", error);
      showLogin("No fue posible iniciar sesión. Verifica la configuración de Google en Firebase e inténtalo nuevamente.");
    } else {
      showLogin();
    }
  } finally {
    signInButton.disabled = false;
  }
}

signInButton.addEventListener("click", startGoogleSignIn);
changeAccountButton.addEventListener("click", async () => {
  await signOut(auth);
  await startGoogleSignIn();
});
signOutButton.addEventListener("click", async () => {
  await signOut(auth);
  showLogin("Sesión cerrada. Inicia sesión para volver a entrar.");
});

try {
  await getRedirectResult(auth);
} catch (error) {
  console.error("Error al completar la redirección:", error);
  showLogin("No fue posible completar el inicio de sesión. Inténtalo nuevamente.");
}

onAuthStateChanged(auth, async user => {
  if (!user) {
    showLogin();
    return;
  }

  if (!isAuthorizedEmail(user.email)) {
    const deniedEmail = normalizeEmail(user.email);
    await signOut(auth);
    showDenied(deniedEmail);
    return;
  }

  showDashboard(user);
});
