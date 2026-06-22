/**
 * DAWF v5 Enhanced — Brand Customizer Sync
 */
const DEFAULT_BRAND = {
  name: "DAWF v5 Enhanced",
  tagline: "Learning Deliberately. Teaching Authentically.",
  logo: "📊",
  color: "#7c3aed"
};

async function applyGlobalBranding() {
  try {
    const stored = await StateDB.get("brand_config");
    const config = stored || DEFAULT_BRAND;
    document.querySelectorAll(".brand-name-text").forEach(el => el.innerText = config.name);
    document.querySelectorAll(".brand-tagline-text").forEach(el => el.innerText = config.tagline);
    document.querySelectorAll(".brand-logo-container").forEach(el => el.innerText = config.logo);
    document.documentElement.style.setProperty('--primary-accent', config.color);
    const isDark = await StateDB.get("dark_mode");
    if (isDark) document.documentElement.classList.add('dark');
  } catch (e) { console.error("Branding error:", e); }
}

document.addEventListener("DOMContentLoaded", () => applyGlobalBranding());
