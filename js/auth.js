/**
 * DAWF v5 Authentication & Access Control
 */

document.addEventListener("DOMContentLoaded", () => {
    const authGateModal = document.getElementById("authGateModal");
    const authPasscodeField = document.getElementById("authPasscodeField");
    const btnSubmitAuthPasscode = document.getElementById("btnSubmitAuthPasscode");
    const authErrorMsg = document.getElementById("authErrorMsg");
    
    // Default credentials
    const DEFAULT_PASSCODE = "HMG2025";

    // Tab switching logic
    const authTabDemoBtn = document.getElementById("authTabDemoBtn");
    const authTabLicenseBtn = document.getElementById("authTabLicenseBtn");
    const authDemoPanel = document.getElementById("authDemoPanel");
    const authLicensePanel = document.getElementById("authLicensePanel");

    if (authTabDemoBtn && authTabLicenseBtn) {
        authTabDemoBtn.addEventListener("click", () => {
            authDemoPanel.classList.remove("hidden");
            authLicensePanel.classList.add("hidden");
            authTabDemoBtn.classList.add("text-violet-700", "border-violet-600");
            authTabLicenseBtn.classList.remove("text-violet-700", "border-violet-600");
            authTabLicenseBtn.classList.add("text-slate-400", "border-transparent");
        });

        authTabLicenseBtn.addEventListener("click", () => {
            authLicensePanel.classList.remove("hidden");
            authDemoPanel.classList.add("hidden");
            authTabLicenseBtn.classList.add("text-violet-700", "border-violet-600");
            authTabDemoBtn.classList.remove("text-violet-700", "border-violet-600");
            authTabDemoBtn.classList.add("text-slate-400", "border-transparent");
        });
    }

    // Handle Login
    if (btnSubmitAuthPasscode) {
        btnSubmitAuthPasscode.addEventListener("click", () => {
            const enteredPasscode = authPasscodeField.value;
            if (enteredPasscode === DEFAULT_PASSCODE) {
                // Success - hide modal and save session
                authGateModal.classList.add("hidden");
                sessionStorage.setItem("dawf_authenticated", "true");
                console.log("Authentication successful.");
            } else {
                // Failure
                authErrorMsg.classList.remove("hidden");
                authPasscodeField.classList.add("border-red-500", "bg-red-50");
                setTimeout(() => {
                    authErrorMsg.classList.add("hidden");
                    authPasscodeField.classList.remove("border-red-500", "bg-red-50");
                }, 3000);
            }
        });

        // Also allow Enter key
        authPasscodeField.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                btnSubmitAuthPasscode.click();
            }
        });
    }

    // Check existing session
    if (sessionStorage.getItem("dawf_authenticated") === "true") {
        if (authGateModal) authGateModal.classList.add("hidden");
    }

    // Enterprise License Verification (Mock)
    const btnSubmitLicense = document.getElementById("btnSubmitLicense");
    if (btnSubmitLicense) {
        btnSubmitLicense.addEventListener("click", () => {
            const licenseKey = document.getElementById("licenseKeyField").value;
            const licenseSuccessMsg = document.getElementById("licenseSuccessMsg");
            const licenseErrorMsg = document.getElementById("licenseErrorMsg");

            if (licenseKey.length > 20) {
                licenseSuccessMsg.classList.remove("hidden");
                licenseErrorMsg.classList.add("hidden");
                setTimeout(() => {
                    authGateModal.classList.add("hidden");
                    sessionStorage.setItem("dawf_authenticated", "true");
                    sessionStorage.setItem("dawf_tier", "Enterprise");
                    updateUIForTier("Enterprise");
                }, 1500);
            } else {
                licenseErrorMsg.classList.remove("hidden");
                licenseSuccessMsg.classList.add("hidden");
            }
        });
    }
});

function updateUIForTier(tier) {
    const badge = document.getElementById("licenseBadge");
    if (badge) {
        badge.innerText = tier + " Tier";
        badge.classList.remove("bg-slate-800", "text-slate-400");
        badge.classList.add("bg-violet-600", "text-white");
    }
}
