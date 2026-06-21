/**
 * DAWF v5 Brand Customizer Sync helper
 * Automatically applies active brand colors and accents to all physical HTML pages.
 */

const DEFAULT_BRAND = {
    name: "DAWF v5 Ultimate",
    tagline: "Learning Deliberately. Teaching Authentically.",
    logo: "📊",
    color: "#7c3aed"
};

async function applyGlobalBranding() {
    try {
        const stored = await StateDB.get("brand_config");
        const config = stored || DEFAULT_BRAND;
        
        // Apply names
        const titleElements = document.querySelectorAll(".brand-name-text");
        titleElements.forEach(el => el.innerText = config.name);
        
        const taglineElements = document.querySelectorAll(".brand-tagline-text");
        taglineElements.forEach(el => el.innerText = config.tagline);
        
        const logoElements = document.querySelectorAll(".brand-logo-container");
        logoElements.forEach(el => el.innerHTML = config.logo);
        
        // Inject color properties
        document.documentElement.style.setProperty('--primary-accent', config.color);

        // Enterprise Dark Mode Check
        const isDark = await StateDB.get("dark_mode");
        if (isDark) {
            document.documentElement.classList.add('dark');
        }
    } catch (e) {
        console.error("Error applying brand theme configurations:", e);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    applyGlobalBranding();
});
