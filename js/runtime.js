import { MS, sectorIcon, railIcons, setAutoBodyIcons } from "./sector-icons.js";
import { readSiteData, writeSiteData, onSiteDataChange, applyStateToDocument, createDeferredWrite } from "./storage.js";

/* =========================================================
   PANDINO RUNTIME: DECLARATIVE DATA-MAPPER ENGINE (DAISYUI 5)
   ========================================================= */

// --- 1. Canvas Target Resolution & Aliases ---
export const ID_ALIASES = { repairs: "solutions", trust: "trust-bar", "final-cta": "cta", cookie: "cookieBanner" };

export function getCanvasDocument() {
    const frame = document.getElementById("templateCanvasFrame") || document.querySelector(".kit-canvas-frame iframe");
    return frame?.contentDocument || frame?.contentWindow?.document || document;
}

export function getCanvasTargets() {
    const doc = getCanvasDocument();
    return doc?.documentElement ? [doc.documentElement] : [document.documentElement];
}

export function getCanvasBodyTargets() {
    const doc = getCanvasDocument();
    return doc?.body ? [doc.body] : [document.body];
}

let lastCanvasHeight = 0;
export function syncCanvasHeight() {
    const frame = document.getElementById("templateCanvasFrame") || document.querySelector(".kit-canvas-frame iframe");
    if (!frame) return;
    try {
        const doc = getCanvasDocument();
        const h = Math.max(doc?.body?.scrollHeight || 0, doc?.documentElement?.scrollHeight || 0, 700);
        if (Math.abs(h - lastCanvasHeight) > 15 && h < 25000) {
            lastCanvasHeight = h;
            frame.style.height = `${h}px`;
        }
    } catch (e) {}
}
window.__syncCanvasHeight = syncCanvasHeight;

export function byId(id) {
    if (!id) return null;
    const doc = getCanvasDocument();
    const alias = ID_ALIASES[id];
    return doc.getElementById(id) || (alias ? doc.getElementById(alias) : null) || document.getElementById(id) || (alias ? document.getElementById(alias) : null);
}

export function normalizeSecId(id) {
    return { solutions: "repairs", "trust-bar": "trust", cta: "final-cta", cookieBanner: "cookie" }[id] || id || "";
}

export const SEC_NAMES = {
    header: "Header", hero: "Hero", services: "Services", repairs: "Solutions", about: "About",
    trust: "Trust", reviews: "Reviews", quote: "Quote", faq: "FAQ", promo: "Promo",
    contact: "Contact", "final-cta": "Call to Action", footer: "Footer", cookie: "Cookie Banner"
};

export function heroSections() {
    return [...getCanvasDocument().querySelectorAll("main.heroes-container > .hero")];
}

// --- 2. Color System & OKLCH Ramp Generator ---
function hexToRgb(hex) {
    const m = /^#?([0-9a-f]{6})$/i.exec(String(hex).trim());
    return m ? { r: parseInt(m[1].slice(0, 2), 16), g: parseInt(m[1].slice(2, 4), 16), b: parseInt(m[1].slice(4, 6), 16) } : null;
}

function rgbToOklch(r, g, b) {
    const [R, G, B] = [r, g, b].map(v => (v /= 255) <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4);
    const l = 0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B;
    const m = 0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B;
    const s = 0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B;
    const [l_, m_, s_] = [Math.cbrt(l), Math.cbrt(m), Math.cbrt(s)];
    const [L, a, bb] = [0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_, 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_, 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_];
    const H = Math.atan2(bb, a) * 180 / Math.PI;
    return { L, C: Math.sqrt(a * a + bb * bb), H: H < 0 ? H + 360 : H };
}

function oklchToHex(L, C, H) {
    const [a, b] = [C * Math.cos(H * Math.PI / 180), C * Math.sin(H * Math.PI / 180)];
    const [l_, m_, s_] = [L + 0.3963377774 * a + 0.2158037573 * b, L - 0.1055613458 * a - 0.0638541728 * b, L - 0.0894841775 * a - 1.2914855480 * b];
    const [l, m, s] = [l_ ** 3, m_ ** 3, s_ ** 3];
    const toS = v => (v = Math.min(1, Math.max(0, v))) <= 0.0031308 ? 12.92 * v : 1.055 * (v ** (1 / 2.4)) - 0.055;
    const hx = n => Math.round(toS(n) * 255).toString(16).padStart(2, "0");
    return "#" + hx(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s) + hx(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s) + hx(-0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s);
}

const SHADE_STEPS = ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900", "950"];
const L_T = { 50: 0.976, 100: 0.947, 200: 0.899, 300: 0.832, 400: 0.742, 500: 0.670, 600: 0.587, 700: 0.511, 800: 0.433, 900: 0.377, 950: 0.257 };
const C_T = { 50: 0.015, 100: 0.036, 200: 0.069, 300: 0.110, 400: 0.151, 500: 0.175, 600: 0.177, 700: 0.163, 800: 0.136, 900: 0.112, 950: 0.077 };

function rampFromHex(hex) {
    const rgb = hexToRgb(hex);
    if (!rgb) return null;
    const { L, C, H } = rgbToOklch(rgb.r, rgb.g, rgb.b);
    let lock = "500", best = 99;
    SHADE_STEPS.forEach(n => {
        const d = Math.abs(L - L_T[n]);
        if (d < best) { best = d; lock = String(n); }
    });
    const out = {};
    SHADE_STEPS.forEach(n => {
        if (String(n) === lock) { out[n] = hex.toLowerCase(); return; }
        const c = C < 0.045 ? Math.min(0.04, C_T[n] * (C / 0.028)) : Math.min(0.37, C * (C_T[n] / Math.max(0.02, C_T[Number(lock)])));
        out[n] = oklchToHex(L_T[n], c, H);
    });
    return out;
}

export function applyBrandPalette(hex) {
    if (!hex) return;
    const ramp = rampFromHex(hex);
    if (!ramp) return;
    const rgb = hexToRgb(hex);
    const contrastFg = rgb && ((0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255 > 0.62) ? "#17191c" : "#ffffff";

    getCanvasTargets().forEach(root => {
        SHADE_STEPS.forEach(step => {
            if (ramp[step]) {
                root.style.setProperty(`--active-${step}`, ramp[step]);
                root.style.setProperty(`--primary-${step}`, ramp[step]);
            }
        });
        const p500 = ramp["500"] || hex;
        ["--color-primary", "--primary-color", "--active-500", "--p", "--pill-accent"].forEach(p => root.style.setProperty(p, p500));
        root.style.setProperty("--tone-mid", ramp["700"] || p500);
        root.style.setProperty("--brand-ink", hex);
        root.style.setProperty("--brand-contrast-fg", contrastFg);
        root.style.setProperty("--color-primary-content", contrastFg);
    });

    state.brandColor = hex;
    safeWriteSiteData();

    const swatch = document.getElementById("bshadeSwatch"); if (swatch) { swatch.style.background = hex; swatch.style.color = contrastFg; }
    const hexEl = document.getElementById("bshadeHex"); if (hexEl) hexEl.textContent = hex;
    const contrastEl = document.getElementById("bshadeContrast"); if (contrastEl) contrastEl.textContent = contrastFg === "#ffffff" ? "White text" : "Dark text";

    const hexNorm = hex.toLowerCase();
    document.querySelectorAll("[data-color].color-btn").forEach(btn => {
        const m = (btn.getAttribute("style") || "").match(/#([0-9a-fA-F]{6})/);
        const on = m ? ("#" + m[1].toLowerCase() === hexNorm) : false;
        ["active", "border-2", "border-white", "ring-2", "ring-primary", "shadow-xs"].forEach(c => btn.classList.toggle(c, on));
        btn.classList.toggle("border-white/20", !on);
    });
}

export function applyColorScheme(scheme) {
    if (!scheme) return;
    state.scheme = scheme;
    safeWriteSiteData();
    const theme = scheme === "white" ? "light" : "dark";
    getCanvasTargets().forEach(r => { r.setAttribute("data-scheme", scheme); r.setAttribute("data-theme", theme); });
    getCanvasBodyTargets().forEach(b => {
        b.classList.remove("scheme-white", "scheme-dark", "scheme-brand");
        b.classList.add(`scheme-${scheme}`);
    });
    syncActiveGroup("[data-scheme]", "data-scheme", scheme);
}

// --- 3. Typography Preset System ---
export const FONT_TIERS = {
    tier1: { headline: "'Syne', sans-serif", body: "'Manrope', sans-serif" },
    tier2: { headline: "'DM Serif Display', serif", body: "'Manrope', sans-serif" },
    tier3: { headline: "'Montserrat', sans-serif", body: "'Inter', sans-serif" },
    tier4: { headline: "'Playfair Display', serif", body: "'Inter', sans-serif" },
    tier5: { headline: "'Poppins', sans-serif", body: "'Poppins', sans-serif" }
};

export function applyTypographyPreset(tier) {
    const fonts = FONT_TIERS[tier] || FONT_TIERS.tier1;
    getCanvasTargets().forEach(root => {
        root.style.setProperty("--headline-font", fonts.headline);
        root.style.setProperty("--body-font", fonts.body);
    });
    const sel = document.getElementById("typographySelect");
    if (sel && sel.value !== tier) sel.value = tier;
    syncActiveGroup("[data-tier]", "data-tier", tier);
    state.typographyTier = tier;
    safeWriteSiteData();
}

// --- 4. Reactive State & Dispatch Helper ---
const state = {
    heroIndex: 0, headerStyle: "standard", headerAlign: "left", headerSticky: false,
    reviews: "white", ctas: 2, panel: "bottom", panelStyle: "solid",
    brandColor: "#16a34a", theme: "dark", painsLook: "a", painsAlign: "center",
    accountName: "", accountEmail: ""
};

let isSyncing = false;
export function safeWriteSiteData() {
    if (!isSyncing) try { writeSiteData(state); } catch (e) {}
}

function syncActiveGroup(selector, attr, activeVal) {
    document.querySelectorAll(selector).forEach(btn => {
        const on = btn.getAttribute(attr) === String(activeVal);
        btn.classList.toggle("active", on);
        btn.classList.toggle("btn-primary", on);
        btn.setAttribute("aria-pressed", String(on));
    });
}

// --- 5. Hero Data-Mapper ---
const LAYOUT_HINTS = {
    0: "Best for a short, direct offer.", 1: "Best for a strong photo or video.",
    2: "Best for a short, direct offer.", 3: "Best when the work itself sells.",
    4: "Best for a short, direct offer.", 5: "Best when the work itself sells."
};

export function setHeroIndex(idx) {
    const heroes = heroSections();
    if (!heroes.length) return;
    idx = Math.max(0, Math.min(idx, heroes.length - 1));
    state.heroIndex = idx;
    safeWriteSiteData();

    heroes.forEach((hero, i) => {
        const on = i === idx;
        hero.classList.toggle("is-live-hero", on);
        hero.hidden = !on;
        if (on) {
            hero.id = "hero";
            const input = document.getElementById("hero-promise");
            const h1 = hero.querySelector(".hero-content h1");
            if (input && h1 && !input.value) input.value = h1.textContent.trim();
        } else if (hero.id === "hero") {
            hero.removeAttribute("id");
        }
    });

    syncActiveGroup("[data-hmhero]", "data-hmhero", idx);
    const hint = document.getElementById("hero-layout-hint");
    if (hint) hint.textContent = LAYOUT_HINTS[idx] || "";
    syncCanvasHeight();
}

export function applyReviews(style) {
    state.reviews = style;
    safeWriteSiteData();
    getCanvasBodyTargets().forEach(b => ["on", "white", "black"].forEach(k => b.classList.toggle("reviews-" + k, k === "on" ? style !== "off" : style === k)));
    syncActiveGroup("[data-rev]", "data-rev", style);
}

export function applyHeroPanel(pos) {
    state.panel = pos;
    safeWriteSiteData();
    getCanvasBodyTargets().forEach(b => ["off", "bottom", "left", "right"].forEach(v => b.classList.toggle("panel-" + v, pos === v)));
    syncActiveGroup("[data-panel]", "data-panel", pos);
    getCanvasDocument().querySelectorAll(".biz-panel, .hb-info").forEach(panel => {
        panel.hidden = (pos === "off");
        panel.classList.toggle("self-end", pos === "bottom");
    });
    getCanvasDocument().querySelectorAll(".hero").forEach(hero => hero.setAttribute("data-panel", pos));
    syncCanvasHeight();
}

export function applyHeroPanelStyle(style) {
    state.panelStyle = style;
    safeWriteSiteData();
    getCanvasBodyTargets().forEach(b => ["solid", "outline"].forEach(k => b.classList.toggle("panel-" + k, style === k)));
    syncActiveGroup("[data-pstyle]", "data-pstyle", style);
}

export function applyCtaCount(count) {
    state.ctas = count;
    safeWriteSiteData();
    heroSections().forEach(hero => {
        const primary = hero.querySelector(".cta-primary:not(.cta-second)");
        const second = hero.querySelector(".cta-second");
        if (primary) primary.style.display = count >= 1 ? "" : "none";
        if (second) second.style.display = count >= 2 ? "" : "none";
    });
    syncActiveGroup("[data-ctacount]", "data-ctacount", count);
    if (state.painsCtas === undefined) applyPainsCtaCount(count, false);
    syncCanvasHeight();
}

export function applyPainsCtaCount(count, persist = true) {
    state.painsCtas = count;
    if (persist) safeWriteSiteData();
    const pains = byId("pains");
    if (pains) {
        const ctas = pains.querySelector(".pains-ctas");
        const primary = pains.querySelector(".pains-cta-primary, .cta-primary:not(.cta-second)");
        const second = pains.querySelector(".pains-cta-second, .cta-second");
        if (ctas) ctas.style.display = count > 0 ? "flex" : "none";
        if (primary) primary.style.display = count >= 1 ? "" : "none";
        if (second) second.style.display = count >= 2 ? "" : "none";
    }
    syncActiveGroup("[data-pains-ctacount]", "data-pains-ctacount", count);
    syncCanvasHeight();
}

// --- 6. Navigation & Header ---
export function setHeaderSticky(sticky) {
    state.headerSticky = !!sticky;
    safeWriteSiteData();
    getCanvasBodyTargets().forEach(b => {
        b.classList.toggle("is-sticky-header", state.headerSticky);
        b.dataset.stickyHeader = String(state.headerSticky);
    });
    const chk = document.getElementById("toggleHeaderSticky");
    if (chk) chk.checked = state.headerSticky;
}

export function setHeaderStyle(style) {
    state.headerStyle = style;
    safeWriteSiteData();
    getCanvasDocument().querySelectorAll(".site-header").forEach(h => h.setAttribute("data-type", style));
    syncActiveGroup('[data-opt="type"]', "data-val", style);
}

export function scrollToCanvasSection(secId) {
    if (!secId) return;
    const doc = getCanvasDocument();
    const alias = ID_ALIASES[secId];
    const target = doc.getElementById(secId) || (alias ? doc.getElementById(alias) : null);
    if (!target) return;
    if (target.hidden) { target.hidden = false; syncCanvasHeight(); }
    doc.querySelectorAll(".is-canvas-selected").forEach(el => el.classList.remove("is-canvas-selected"));
    target.classList.add("is-canvas-selected");

    const scroller = document.querySelector(".kit-canvas-scroll");
    const frame = document.getElementById("templateCanvasFrame") || document.querySelector(".kit-canvas-frame iframe");
    if (scroller && frame) {
        const frameTop = frame.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop;
        const targetTop = target.getBoundingClientRect().top + (doc.defaultView?.scrollY || doc.documentElement.scrollTop || 0);
        scroller.scrollTo({ top: Math.max(0, frameTop + targetTop - 24), behavior: "smooth" });
    } else {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
}

// --- 7. In-Place Accordion & Tabs ---
export function activateTab(tabId, opts = {}) {
    if (!tabId) return;
    let cleanId = String(tabId).replace(/^(tab-|rail-|acc-)/, "").toLowerCase();
    const map = { type: "typography", font: "typography", color: "colors", brand: "colors", repairs: "solutions", "trust-bar": "trust", "final-cta": "cta" };
    if (map[cleanId]) cleanId = map[cleanId];

    const targetAcc = document.getElementById("acc-" + cleanId) || document.querySelector(`.more-row[data-sec="${cleanId}"]`) || document.getElementById(tabId);
    if (targetAcc) {
        const bucket = targetAcc.closest(".kit-bucket");
        if (bucket) bucket.open = true;
        if (targetAcc.tagName.toLowerCase() === "details") targetAcc.open = true;
        targetAcc.scrollIntoView({ behavior: "smooth", block: "center" });
        targetAcc.classList.add("ring-2", "ring-primary");
        setTimeout(() => targetAcc.classList.remove("ring-2", "ring-primary"), 1400);
    }

    document.querySelectorAll(".cfg-tab").forEach(t => {
        const tid = t.id.replace(/^(tab-|rail-)/, "");
        const on = (t.id === tabId || tid === cleanId || t.dataset.sec === cleanId);
        t.classList.toggle("is-active", on);
        t.setAttribute("aria-selected", String(on));
    });

    if (!opts.fromCanvas) {
        scrollToCanvasSection(["header", "colors", "typography"].includes(cleanId) ? (cleanId === "header" ? "header" : "hero") : cleanId);
    }
}

// --- 8. Customer Pains Layout & Alignment ---
export function applyPainsLook(look = "a") {
    state.painsLook = look === "b" ? "b" : "a";
    const pains = byId("pains");
    if (pains) pains.setAttribute("data-look", state.painsLook);
    syncActiveGroup("#painsLayoutJoin [data-pains-look]", "data-pains-look", state.painsLook);
    const badge = document.getElementById("painsBadge");
    if (badge) badge.textContent = state.painsLook === "b" ? "Split" : "3 Cards";
    safeWriteSiteData();
    syncCanvasHeight();
}

export function applyPainsAlignment(align = "center", persist = true) {
    state.painsAlign = ["left", "center", "right"].includes(align) ? align : "center";
    const pains = byId("pains");
    if (pains) {
        pains.setAttribute("data-card-align", state.painsAlign);
        pains.classList.remove("pains-align-left", "pains-align-center", "pains-align-right");
        pains.classList.add(`pains-align-${state.painsAlign}`);
    }
    syncActiveGroup("#painsAlignJoin [data-pains-align]", "data-pains-align", state.painsAlign);
    if (persist) safeWriteSiteData();
}

export function syncCanvasLayerLabels() {
    const doc = getCanvasDocument();
    if (!doc) return;
    const map = { "trust-bar": "trust", "final-cta": "cta", repairs: "solutions" };
    doc.querySelectorAll("section[id], header[id], footer[id]").forEach(sec => {
        const cleanId = map[sec.id] || sec.id;
        const heading = sec.querySelector('[id$="-title"], h2, h1, h3, .sec-title');
        const titleText = heading?.textContent?.trim();
        if (titleText) {
            const node = document.getElementById("acc-" + cleanId) || document.querySelector(`.more-row[data-sec="${cleanId}"]`);
            const label = node?.querySelector(".cfg-name, span.font-bold");
            if (label) label.textContent = titleText;
        }
    });
}

// --- 9. Unified Data-Dispatch Pattern & Sync ---
export function syncCanvasState() {
    isSyncing = true;
    try {
        setHeroIndex(state.heroIndex || 0);
        applyReviews(state.reviews || "white");
        applyHeroPanel(state.panel || "bottom");
        applyHeroPanelStyle(state.panelStyle || "solid");
        applyCtaCount(state.ctas !== undefined ? state.ctas : 2);
        applyPainsCtaCount(state.painsCtas !== undefined ? state.painsCtas : (state.ctas !== undefined ? state.ctas : 2), false);
        if (state.brandColor) applyBrandPalette(state.brandColor);
        applyColorScheme(state.scheme || "dark");
        if (state.theme) {
            document.documentElement.setAttribute("data-theme", state.theme);
            const canvasFrame = document.querySelector(".kit-canvas-frame");
            if (canvasFrame) canvasFrame.setAttribute("data-theme", state.theme);
            const canvasDoc = getCanvasDocument();
            if (canvasDoc?.documentElement) {
                canvasDoc.documentElement.setAttribute("data-theme", state.theme);
                if (canvasDoc.body) canvasDoc.body.setAttribute("data-theme", state.theme);
            }
        }
        applyTypographyPreset(state.typographyTier || document.getElementById("typographySelect")?.value || "tier1");
        applyPainsLook(state.painsLook || "a");
        applyPainsAlignment(state.painsAlign || "center", false);

        const doc = getCanvasDocument();
        if (doc) applyStateToDocument(doc, state);

        const promiseInput = document.getElementById("hero-promise");
        if (promiseInput && state.heroPromise && document.activeElement !== promiseInput) {
            promiseInput.value = state.heroPromise;
        }

        if (state.halign) {
            getCanvasBodyTargets().forEach(cb => ["left", "center", "right"].forEach(a => cb.classList.toggle("hero-halign-" + a, a === state.halign)));
            syncActiveGroup("[data-halign]", "data-halign", state.halign);
        }

        if (state.headerSticky !== undefined) setHeaderSticky(state.headerSticky);
        if (state.headerStyle) setHeaderStyle(state.headerStyle);
        if (state.headerSurface) {
            if (doc) doc.querySelectorAll(".site-header").forEach(h => h.setAttribute("data-style", state.headerSurface));
            syncActiveGroup('[data-opt="style"]', "data-val", state.headerSurface);
        }

        if (state.heroMarquee !== undefined) {
            const ls = doc?.getElementById("logostrip"); if (ls) ls.hidden = !state.heroMarquee;
            ["toggleHeroMarquee", "toggleHeroLogostrip"].forEach(id => { const t = document.getElementById(id); if (t) t.checked = !!state.heroMarquee; });
        }
        if (state.heroBlur !== undefined) {
            doc?.querySelectorAll(".hero-content").forEach(hc => hc.classList.toggle("backdrop-blur-md", !!state.heroBlur));
            const tb = document.getElementById("toggleHeroBlur"); if (tb) tb.checked = !!state.heroBlur;
        }
        if (state.heroReveal !== undefined) {
            doc?.querySelectorAll(".hero").forEach(h => h.classList.toggle("hm-reveal", !!state.heroReveal));
            const tr = document.getElementById("toggleHeroReveal"); if (tr) tr.checked = !!state.heroReveal;
        }

        if (state.sectionShades && typeof state.sectionShades === "object") {
            Object.entries(state.sectionShades).forEach(([secId, shadeVal]) => {
                const targetSec = byId(secId);
                if (targetSec) targetSec.style.setProperty("--sec-shade", `var(--active-${shadeVal})`);
                const sel = document.querySelector(`.more-row[data-sec="${secId}"] select.more-shade`);
                if (sel) sel.value = shadeVal;
            });
        }

        syncCanvasLayerLabels();
        syncCanvasHeight();
    } finally {
        isSyncing = false;
    }
}

export function syncBuilderUiControls() {
    syncCanvasState();
}

function setDevicePreview(dev) {
    syncActiveGroup("[data-dev]", "data-dev", dev);
    const scroller = document.querySelector(".kit-canvas-scroll");
    const frame = document.querySelector(".kit-canvas-frame");
    if (scroller) scroller.dataset.device = dev;
    if (frame) {
        frame.dataset.device = dev;
        frame.style.width = dev === "desktop" ? "100%" : (dev === "tablet" ? "768px" : "390px");
        frame.style.maxWidth = dev === "desktop" ? "" : (dev === "tablet" ? "768px" : "390px");
    }
    setTimeout(syncCanvasHeight, 150);
}

// --- 10. Unified Global Event Dispatcher ---
function initGlobalDispatchListeners() {
    document.addEventListener("click", e => {
        const btn = e.target.closest("button, [data-opt], .cfg-tab, .color-btn, .kit-row");
        if (!btn) return;

        if (btn.dataset.hmhero !== undefined) return setHeroIndex(Number(btn.dataset.hmhero));
        if (btn.dataset.rev) return applyReviews(btn.dataset.rev);
        if (btn.dataset.panel) return applyHeroPanel(btn.dataset.panel);
        if (btn.dataset.pstyle) return applyHeroPanelStyle(btn.dataset.pstyle);
        if (btn.dataset.ctacount) return applyCtaCount(Number(btn.dataset.ctacount));
        if (btn.dataset.painsCtacount) return applyPainsCtaCount(Number(btn.dataset.painsCtacount));
        if (btn.dataset.scheme) return applyColorScheme(btn.dataset.scheme);
        if (btn.dataset.tier) return applyTypographyPreset(btn.dataset.tier);
        if (btn.dataset.painsLook) return applyPainsLook(btn.dataset.painsLook);
        if (btn.dataset.painsAlign) return applyPainsAlignment(btn.dataset.painsAlign);
        if (btn.dataset.dev) return setDevicePreview(btn.dataset.dev);

        if (btn.dataset.halign) {
            state.halign = btn.dataset.halign;
            safeWriteSiteData();
            getCanvasBodyTargets().forEach(cb => ["left", "center", "right"].forEach(a => cb.classList.toggle("hero-halign-" + a, a === state.halign)));
            return syncActiveGroup("[data-halign]", "data-halign", state.halign);
        }

        if (btn.dataset.contrastMode) {
            const mode = btn.dataset.contrastMode;
            syncActiveGroup("[data-contrast-mode]", "data-contrast-mode", mode);
            return getCanvasBodyTargets().forEach(b => b?.setAttribute("data-contrast-mode", mode));
        }

        if (btn.dataset.opt === "type") return setHeaderStyle(btn.dataset.val);
        if (btn.dataset.opt === "style") {
            state.headerSurface = btn.dataset.val; safeWriteSiteData();
            syncActiveGroup('[data-opt="style"]', "data-val", state.headerSurface);
            return getCanvasDocument().querySelectorAll(".site-header").forEach(h => h.setAttribute("data-style", state.headerSurface));
        }
        if (btn.dataset.opt === "count") {
            const count = Number(btn.dataset.val);
            syncActiveGroup('[data-opt="count"]', "data-val", count);
            return getCanvasDocument().querySelectorAll(".site-header nav a").forEach((a, i) => a.style.display = i < count ? "" : "none");
        }
        if (btn.dataset.opt === "buttons") {
            const val = btn.dataset.val;
            syncActiveGroup('[data-opt="buttons"]', "data-val", val);
            return getCanvasDocument().querySelectorAll(".site-header .sh-cta, .site-header .sh-actions").forEach(el => el.style.display = val === "none" ? "none" : "flex");
        }

        if (btn.classList.contains("color-btn")) {
            e.stopPropagation();
            let hex = null;
            const style = btn.getAttribute("style") || "";
            const m = style.match(/#([0-9a-fA-F]{6})/);
            if (m) hex = "#" + m[1];
            else {
                const comp = window.getComputedStyle(btn).backgroundColor;
                const rgbM = comp.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
                if (rgbM) hex = "#" + [1, 2, 3].map(i => parseInt(rgbM[i], 10).toString(16).padStart(2, "0")).join("");
            }
            if (hex) {
                applyBrandPalette(hex);
                const sum = document.getElementById("sum-brand");
                if (sum && btn.dataset.color) sum.textContent = btn.dataset.color.charAt(0).toUpperCase() + btn.dataset.color.slice(1);
            }
            return;
        }

        if (btn.dataset.svc === "card") {
            const style = btn.dataset.v;
            syncActiveGroup('[data-svc="card"]', "data-v", style);
            return getCanvasDocument().querySelectorAll(".svc-card").forEach(c => {
                c.classList.toggle("border", style === "outline");
                c.classList.toggle("border-base-300", style === "outline");
                c.classList.toggle("shadow-sm", style !== "outline");
            });
        }

        if (btn.classList.contains("cfg-tab")) {
            e.stopPropagation();
            return activateTab(btn.id);
        }

        if (btn.classList.contains("kit-row")) {
            const tabBtn = btn.querySelector(".cfg-tab");
            if (tabBtn) return activateTab(tabBtn.id || btn.dataset.sec);
        }

        if (btn.closest(".more-row") && btn.dataset.more === "scheme") {
            const row = btn.closest(".more-row");
            const scheme = btn.dataset.v;
            row.querySelectorAll('[data-more="scheme"]').forEach(b => b.classList.toggle("active", b === btn));
            const sec = byId(row.dataset.sec);
            if (sec) {
                sec.setAttribute("data-scheme", scheme);
                sec.style.backgroundColor = scheme === "brand" ? "var(--active-950, #0f172a)" : (scheme === "white" ? "#ffffff" : (scheme === "dark" ? "#17191c" : ""));
                sec.style.color = (scheme === "brand" || scheme === "dark") ? "#ffffff" : (scheme === "white" ? "#17191c" : "");
            }
            return;
        }

        if (btn.id === "shClose") {
            document.getElementById("shMobile")?.setAttribute("aria-hidden", "true");
        }
    });

    const onEvt = (id, ev, fn) => { const el = document.getElementById(id); if (el) el.addEventListener(ev, () => fn(el)); };

    // Form inputs and throttled inputs
    const promise = document.getElementById("hero-promise");
    if (promise) {
        const deferred = createDeferredWrite(() => { state.heroPromise = promise.value; safeWriteSiteData(); }, 150);
        promise.addEventListener("input", e => {
            const hero = getCanvasDocument().querySelector("main.heroes-container > .hero.is-live-hero") || getCanvasDocument().querySelector("main.heroes-container > .hero");
            const h1 = hero?.querySelector(".hero-content h1");
            if (h1) h1.textContent = e.target.value;
            state.heroPromise = e.target.value;
            deferred();
        });
    }

    onEvt("typographySelect", "change", el => applyTypographyPreset(el.value));
    onEvt("btnShade", "change", el => getCanvasTargets().forEach(r => r?.style.setProperty("--btn-bg", el.value === "auto" ? "var(--active-500)" : `var(--active-${el.value})`)));
    onEvt("svcCols", "change", el => { const g = getCanvasDocument().querySelector(".svc-grid"); if (g) { g.style.gridTemplateColumns = `repeat(${el.value}, minmax(0, 1fr))`; syncCanvasHeight(); } });
    onEvt("toggleSvcShowIcon", "change", el => getCanvasDocument().querySelectorAll(".svc-ic").forEach(ic => ic.style.display = el.checked ? "" : "none"));
    onEvt("toggleSvcImg", "change", el => getCanvasDocument().querySelectorAll(".svc").forEach(s => s.setAttribute("data-img", el.checked ? "on" : "off")));
    onEvt("toggleHeaderShow", "change", el => { getCanvasDocument().querySelectorAll(".site-header, #header").forEach(h => h.hidden = !el.checked); syncCanvasHeight(); });
    onEvt("toggleHeaderSticky", "change", el => setHeaderSticky(el.checked));

    document.querySelectorAll('.more-row [data-more="show"]').forEach(toggle => {
        toggle.addEventListener("change", () => {
            const row = toggle.closest(".more-row");
            const sec = byId(row?.dataset.sec);
            if (sec) { sec.hidden = !toggle.checked; syncCanvasHeight(); }
        });
    });

    document.querySelectorAll(".more-row select.more-shade").forEach(s => {
        s.addEventListener("change", () => {
            const row = s.closest(".more-row");
            if (!state.sectionShades) state.sectionShades = {};
            if (row?.dataset.sec) { state.sectionShades[row.dataset.sec] = s.value; safeWriteSiteData(); }
            const sec = byId(row?.dataset.sec);
            if (sec) sec.style.setProperty("--sec-shade", `var(--active-${s.value})`);
        });
    });

    // Color hex controls
    const hexInput = document.getElementById("brandHex");
    const hexPick = document.getElementById("brandHexPick");
    const hexApply = document.getElementById("brandHexApply");
    const updHex = v => { if (v) { applyBrandPalette(v); state.brandColor = v; } };
    if (hexPick) hexPick.addEventListener("input", () => { if (hexInput) hexInput.value = hexPick.value; updHex(hexPick.value); });
    if (hexApply && hexInput) hexApply.addEventListener("click", () => updHex(hexInput.value));
    if (hexInput) hexInput.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); updHex(hexInput.value); } });

    // Hero secondary toggles
    ["toggleHeroMarquee", "toggleHeroLogostrip"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener("change", () => {
            state.heroMarquee = el.checked; safeWriteSiteData();
            const ls = getCanvasDocument().getElementById("logostrip"); if (ls) ls.hidden = !el.checked;
            syncCanvasHeight();
        });
    });
    onEvt("toggleHeroReveal", "change", el => {
        state.heroReveal = el.checked; safeWriteSiteData();
        getCanvasDocument().querySelectorAll(".hero").forEach(h => h.classList.toggle("hm-reveal", el.checked));
    });
    onEvt("toggleHeroBlur", "change", el => {
        state.heroBlur = el.checked; safeWriteSiteData();
        getCanvasDocument().querySelectorAll(".hero-content").forEach(hc => hc.classList.toggle("backdrop-blur-md", el.checked));
    });

    // Theme toggle
    const themeInput = document.querySelector("#kitTheme input");
    if (themeInput) themeInput.addEventListener("change", () => {
        const theme = themeInput.checked ? "light" : "dark";
        document.documentElement.setAttribute("data-theme", theme);
        document.getElementById("kit-drawer")?.setAttribute("data-theme", theme);
        const canvasDoc = getCanvasDocument();
        if (canvasDoc?.documentElement) {
            canvasDoc.documentElement.setAttribute("data-theme", theme);
            if (canvasDoc.body) canvasDoc.body.setAttribute("data-theme", theme);
        }
        const canvasFrame = document.querySelector(".kit-canvas-frame");
        if (canvasFrame) canvasFrame.setAttribute("data-theme", theme);
        state.theme = theme;
        safeWriteSiteData();
    });

    // Controls collapse & rail toggle
    onEvt("cfgCollapse", "click", btn => {
        const isCol = document.getElementById("cfg")?.classList.toggle("is-collapsed");
        btn.setAttribute("aria-expanded", String(!isCol));
        btn.dataset.tip = isCol ? "Show controls" : "Hide controls";
        const lbl = document.getElementById("cfgCollapseLabel"); if (lbl) lbl.textContent = isCol ? "Show" : "Hide controls";
        const ic = btn.querySelector(".material-symbols-outlined"); if (ic) ic.textContent = isCol ? "visibility" : "visibility_off";
    });
    onEvt("kitRailToggle", "click", btn => {
        const d = document.getElementById("kit-drawer");
        const open = d?.dataset.kitRail === "open";
        if (d) d.dataset.kitRail = open ? "closed" : "open";
        btn.setAttribute("aria-expanded", String(!open));
    });

    // Save & Reset buttons
    onEvt("btnSave", "click", btnSave => {
        const typeSel = document.getElementById("typographySelect"); if (typeSel) state.typographyTier = typeSel.value;
        const pInput = document.getElementById("hero-promise"); if (pInput?.value) state.heroPromise = pInput.value;
        safeWriteSiteData();
        const ic = document.getElementById("btnSaveIcon"); const txt = document.getElementById("btnSaveText");
        const toast = document.getElementById("cfgToast");
        if (txt) txt.textContent = "Saved!"; if (ic) ic.textContent = "check";
        btnSave.classList.add("btn-success");
        if (toast) { toast.textContent = "Configuration saved"; toast.classList.remove("hidden"); setTimeout(() => toast.classList.add("hidden"), 2000); }
        setTimeout(() => { if (txt) txt.textContent = "Save"; if (ic) ic.textContent = "save"; btnSave.classList.remove("btn-success"); }, 2000);
    });

    onEvt("btnReset", "click", () => {
        applyTypographyPreset("tier1"); applyBrandPalette("azure"); applyColorScheme("brand"); setHeroIndex(0); applyPainsLook("a");
        const pInput = document.getElementById("hero-promise"); if (pInput) pInput.value = "";
        safeWriteSiteData(); syncCanvasState();
        const txt = document.getElementById("btnResetText"); const ic = document.getElementById("btnResetIcon");
        if (txt) txt.textContent = "Reset!"; if (ic) ic.textContent = "check";
        setTimeout(() => { if (txt) txt.textContent = "Reset"; if (ic) ic.textContent = "restart_alt"; }, 1500);
    });

    // Account settings modal
    const settingsBtn = document.getElementById("kitSettings");
    const accountView = document.getElementById("kit-account");
    if (settingsBtn && accountView) {
        try { Object.assign(state, JSON.parse(localStorage.getItem("pandino_account") || "{}")); } catch (e) {}
        const populate = () => {
            const { accountName: n = "", accountEmail: em = "" } = state;
            const elN = document.getElementById("kitAccountName"); if (elN) elN.value = n;
            const elEm = document.getElementById("kitAccountEmail"); if (elEm) elEm.value = em;
            const tn = document.getElementById("kitTeamMemberName"); if (tn) tn.textContent = n || "Workspace Owner";
            const te = document.getElementById("kitTeamMemberEmail"); if (te) te.textContent = em || "Owner (Admin)";
        };
        populate();
        const toggleSettings = open => {
            accountView.hidden = !open;
            settingsBtn.setAttribute("aria-pressed", String(open));
            if (open) { populate(); setTimeout(() => document.getElementById("kitAccountName")?.focus(), 100); } else settingsBtn.focus();
        };
        settingsBtn.addEventListener("click", () => toggleSettings(accountView.hidden));
        document.querySelector(".kit-account-back")?.addEventListener("click", () => toggleSettings(false));
        document.addEventListener("keydown", e => { if (e.key === "Escape" && !accountView.hidden) toggleSettings(false); });
        accountView.querySelectorAll("#kitAccountNav [data-acct-tab]").forEach(tab => tab.addEventListener("click", () => {
            accountView.querySelectorAll("#kitAccountNav [data-acct-tab]").forEach(t => { t.classList.toggle("active", t === tab); t.setAttribute("aria-selected", String(t === tab)); });
            accountView.querySelectorAll("[data-acct-pane]").forEach(p => p.hidden = p.dataset.acctPane !== tab.dataset.acctTab);
        }));
        const persistAcct = (toast = true) => {
            state.accountName = document.getElementById("kitAccountName")?.value?.trim() || "";
            state.accountEmail = document.getElementById("kitAccountEmail")?.value?.trim() || "";
            populate();
            try { localStorage.setItem("pandino_account", JSON.stringify({ name: state.accountName, email: state.accountEmail, updatedAt: Date.now() })); safeWriteSiteData(); } catch (e) {}
            const tEl = document.getElementById("cfgToast");
            if (toast && tEl) { tEl.textContent = "Account profile updated"; tEl.classList.remove("hidden"); setTimeout(() => tEl.classList.add("hidden"), 2500); }
        };
        onEvt("kitAccountSave", "click", () => persistAcct(true));
        onEvt("kitAccountName", "input", () => persistAcct(false));
        onEvt("kitAccountEmail", "input", () => persistAcct(false));
    }
}

// --- 11. Iframe Click-to-Inspect ---
export function initCanvasSectionClicks() {
    const frame = document.getElementById("templateCanvasFrame") || document.querySelector(".kit-canvas-frame iframe");
    if (!frame) return;

    function attach() {
        try {
            const doc = frame.contentDocument || frame.contentWindow?.document;
            if (!doc?.body) return;
            doc.removeEventListener("click", onClick, true);
            doc.addEventListener("click", onClick, true);
        } catch (e) {}
    }

    function onClick(e) {
        if (e.target.closest("input, textarea, select")) return;
        const sec = e.target.closest("section, header, footer");
        if (!sec) return;
        let secId = sec.id;
        if (!secId) {
            const tag = sec.tagName.toLowerCase();
            if (tag === "header" || tag === "footer") secId = tag;
            else {
                const clsMap = { hero: "hero", svc: "services", rc: "solutions", "ks-about-timeline": "about", "ks-pains": "pains", "ks-trust": "trust", "ks-reviews": "reviews", "ks-quote": "quote", "ks-faq": "faq", "ks-promo": "promo", "ks-contact": "contact", "ks-final": "cta" };
                for (const [cls, id] of Object.entries(clsMap)) { if (sec.classList.contains(cls)) { secId = id; break; } }
            }
        }
        if (secId) {
            const doc = frame.contentDocument || frame.contentWindow?.document;
            doc?.querySelectorAll(".is-canvas-selected").forEach(el => el.classList.remove("is-canvas-selected"));
            sec.classList.add("is-canvas-selected");
            activateTab(secId, { fromCanvas: true });
        }
    }

    frame.addEventListener("load", attach);
    if (frame.contentDocument?.readyState === "complete") attach();
}

// --- 12. Bootstrapping & Storage Sync ---
export function initRuntime() {
    const hostRoot = document.documentElement;
    ["--color-primary", "--primary-color", "--p", "--active-500", "--brand-ink", "--brand-contrast-fg", "--color-primary-content", "--headline-font", "--body-font", "--btn-bg"].forEach(p => hostRoot.style.removeProperty(p));
    SHADE_STEPS.forEach(step => { hostRoot.style.removeProperty(`--active-${step}`); hostRoot.style.removeProperty(`--primary-${step}`); });

    const saved = readSiteData();
    if (saved) Object.assign(state, saved);

    const sumBrand = document.getElementById("sum-brand");
    if (sumBrand && state.brandColor) {
        const matchingBtn = document.querySelector(`[data-color].color-btn[style*="${state.brandColor}"]`);
        if (matchingBtn?.dataset.color) sumBrand.textContent = matchingBtn.dataset.color.charAt(0).toUpperCase() + matchingBtn.dataset.color.slice(1);
    }

    initGlobalDispatchListeners();
    initCanvasSectionClicks();

    const frame = document.getElementById("templateCanvasFrame") || document.querySelector(".kit-canvas-frame iframe");
    if (frame) {
        let resizeRaf = null;
        frame.addEventListener("load", () => {
            try {
                const doc = frame.contentDocument || frame.contentWindow?.document;
                if (doc?.body) {
                    const ro = new ResizeObserver(() => {
                        if (resizeRaf) cancelAnimationFrame(resizeRaf);
                        resizeRaf = requestAnimationFrame(() => syncCanvasHeight());
                    });
                    ro.observe(doc.body);
                }
            } catch (e) {}
            syncCanvasState();
        });
        if (frame.contentDocument?.readyState === "complete") syncCanvasState();
    }

    onSiteDataChange(updatedData => {
        if (updatedData) {
            Object.assign(state, updatedData);
            syncCanvasState();
        }
    });

    document.getElementById("kitWin")?.addEventListener("click", e => {
        e.preventDefault();
        try {
            state.typographyTier = document.getElementById("typographySelect")?.value || state.typographyTier || "tier1";
            writeSiteData(state);
        } catch (err) {}
        window.open("./template.html", "_blank");
    });

    syncCanvasState();

    Object.assign(window, {
        __heroMedia: { get cur() { return state.heroIndex; }, setHeroIndex },
        __applyHeroPanel: applyHeroPanel,
        __kitPresetRefresh: () => {},
        __kitFilterPage: () => {},
        activateTab,
        syncCanvasLayerLabels,
        applyPainsLook,
        applyPainsAlignment
    });
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initRuntime);
} else {
    initRuntime();
}
