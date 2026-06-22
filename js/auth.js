/**
 * DAWF v5 Enhanced — Authentication, Access Control, Session Management
 */
const DEFAULT_PASSCODE = "HMG2025";
const SESSION_TIMEOUT_MIN = 30;

document.addEventListener("DOMContentLoaded", () => {
  const authGate = document.getElementById("authGateModal");
  const passField = document.getElementById("authPasscodeField");
  const btnSubmit = document.getElementById("btnSubmitAuthPasscode");
  const errMsg = document.getElementById("authErrorMsg");

  // Tab switching
  const tabDemo = document.getElementById("authTabDemoBtn");
  const tabLicense = document.getElementById("authTabLicenseBtn");
  const panelDemo = document.getElementById("authDemoPanel");
  const panelLicense = document.getElementById("authLicensePanel");

  if (tabDemo && tabLicense) {
    tabDemo.addEventListener("click", () => {
      panelDemo.classList.remove("hidden"); panelLicense.classList.add("hidden");
      tabDemo.classList.add("text-violet-700","border-violet-600"); tabDemo.classList.remove("text-slate-400","border-transparent");
      tabLicense.classList.remove("text-violet-700","border-violet-600"); tabLicense.classList.add("text-slate-400","border-transparent");
    });
    tabLicense.addEventListener("click", () => {
      panelLicense.classList.remove("hidden"); panelDemo.classList.add("hidden");
      tabLicense.classList.add("text-violet-700","border-violet-600"); tabLicense.classList.remove("text-slate-400","border-transparent");
      tabDemo.classList.remove("text-violet-700","border-violet-600"); tabDemo.classList.add("text-slate-400","border-transparent");
    });
  }

  // Login handler
  if (btnSubmit && passField) {
    btnSubmit.addEventListener("click", () => {
      if (passField.value === DEFAULT_PASSCODE) {
        if (authGate) authGate.classList.add("hidden");
        sessionStorage.setItem("dawf_authenticated", "true");
        sessionStorage.setItem("dawf_auth_time", Date.now());
        showToast("Workspace unlocked successfully", "success");
      } else {
        if (errMsg) errMsg.classList.remove("hidden");
        passField.classList.add("border-red-500","bg-red-50");
        showToast("Invalid passcode. Access denied.", "error");
        setTimeout(() => {
          if (errMsg) errMsg.classList.add("hidden");
          passField.classList.remove("border-red-500","bg-red-50");
        }, 3000);
      }
    });
    passField.addEventListener("keypress", (e) => { if (e.key === "Enter") btnSubmit.click(); });
  }

  // Check session
  const isAuthed = sessionStorage.getItem("dawf_authenticated") === "true";
  const authTime = parseInt(sessionStorage.getItem("dawf_auth_time") || "0");
  const expired = (Date.now() - authTime) > SESSION_TIMEOUT_MIN * 60 * 1000;
  if (isAuthed && !expired) {
    if (authGate) authGate.classList.add("hidden");
  } else if (expired) {
    sessionStorage.removeItem("dawf_authenticated");
    sessionStorage.removeItem("dawf_auth_time");
  }

  // License (mock) handler
  const btnLicense = document.getElementById("btnSubmitLicense");
  if (btnLicense) {
    btnLicense.addEventListener("click", () => {
      const key = document.getElementById("licenseKeyField")?.value || "";
      const successMsg = document.getElementById("licenseSuccessMsg");
      const errorMsg = document.getElementById("licenseErrorMsg");
      if (key.length > 20) {
        if (successMsg) successMsg.classList.remove("hidden");
        if (errorMsg) errorMsg.classList.add("hidden");
        setTimeout(() => {
          if (authGate) authGate.classList.add("hidden");
          sessionStorage.setItem("dawf_authenticated", "true");
          sessionStorage.setItem("dawf_tier", "Enterprise");
          updateTierUI("Enterprise");
          showToast("Enterprise tier activated", "success");
        }, 1200);
      } else {
        if (errorMsg) errorMsg.classList.remove("hidden");
        if (successMsg) successMsg.classList.add("hidden");
      }
    });
  }

  const tier = sessionStorage.getItem("dawf_tier") || "Free";
  updateTierUI(tier);
});

function updateTierUI(tier) {
  const badge = document.getElementById("licenseBadge");
  if (!badge) return;
  badge.innerText = tier + " Tier";
  if (tier !== "Free") {
    badge.classList.remove("bg-slate-800","text-slate-400");
    badge.classList.add("bg-violet-600","text-white");
  }
}
