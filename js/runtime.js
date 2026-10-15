import { readSiteData, writeSiteData, onSiteDataChange, applyStateToDocument, createDeferredWrite, FONT_TIERS, hexToRgb, SHADE_STEPS, rampFromHex, ROUTES, applyRecipe, populateServiceDetail } from "./storage.js";
export const MS = { brand: 'palette', header: 'toolbar', icons: 'interests', hero: 'web_asset', services: 'handyman', about: 'history_edu', repairs: 'healing', more: 'widgets', type: 'text_fields', assets: 'perm_media', plus: 'add', page: 'description', all: 'home', templates: 'dashboard_customize', privacy: 'shield', terms: 'gavel', cookie: 'cookie', trust: 'verified', reviews: 'star', quote: 'request_quote', faq: 'help', promo: 'sell', contact: 'map', 'final-cta': 'ads_click', footer: 'bottom_navigation', home: 'home', emergency: 'emergency' };
export const railIcons = { override: {} }; export function setAutoBodyIcons(on) { railIcons.override = on ? { services: 'car_crash', repairs: 'shield_with_heart', emergency: 'car_repair' } : {}; }
export function sectorIcon(id) { return railIcons.override[id] || MS[id] || 'description'; } export function mountWarHero(root = document) {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches; root.querySelectorAll(".war-hero figure video").forEach(video => {
        video.loop = false; video.removeAttribute("loop"); if (reduce) { video.removeAttribute("autoplay"); video.pause(); return; } video.closest("figure")?.addEventListener("pointermove", () => {
            if (!video.paused && !video.ended) return; try { video.currentTime = 0; } catch (_) {} video.play()?.catch?.(() => {});
        });
    });
} mountWarHero(); export function getCanvasDocument() {
    const frame = document.getElementById("templateCanvasFrame") || document.querySelector(".kit-canvas-frame iframe"); return frame?.contentDocument || frame?.contentWindow?.document || document;
} export function getCanvasTargets() {
    const doc = getCanvasDocument(); return doc ? [doc.documentElement, doc.body].filter(Boolean) : [document.documentElement];
} export function getCanvasBodyTargets() {
    const doc = getCanvasDocument(); return doc?.body ? [doc.body] : [document.body];
} let lastCanvasHeight = 0; export function syncCanvasHeight() {
    const frame = document.getElementById("templateCanvasFrame") || document.querySelector(".kit-canvas-frame iframe"); if (!frame) return; try {
        const scroller = document.querySelector(".kit-canvas-scroll"); const dev = document.querySelector("[data-dev].active")?.dataset?.dev || "desktop";
        const h = dev === "desktop" ? Math.max((scroller?.clientHeight || 850) - 48, 750) : (dev === "tablet" ? 1024 : 844); frame.style.height = `${h}px`;
    } catch (e) {}
} window.__syncCanvasHeight = syncCanvasHeight; export function byId(id) {
    if (!id) return null; const doc = getCanvasDocument(); return doc?.getElementById(id) || document.getElementById(id);
} export function heroSections() {
    return [...getCanvasDocument().querySelectorAll("main.heroes-container > .hero")];
} export function setCanvasAttr(secId, attr, value) {
    const el = getCanvasDocument()?.getElementById(secId); if (!el) return; el.dataset[attr] = value; syncCanvasHeight();
} export function applyBrandPalette(hex) {
    if (!hex) return; const ramp = rampFromHex(hex); if (!ramp) return;
    const rgb = hexToRgb(hex), contrastFg = rgb && ((0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255 > 0.62) ? "#17191c" : "#ffffff"; getCanvasTargets().forEach(root => {
        SHADE_STEPS.forEach(step => { if (ramp[step]) { root.style.setProperty(`--active-${step}`, ramp[step]); root.style.setProperty(`--primary-${step}`, ramp[step]); } });
        const p500 = ramp["500"] || hex; ["--color-primary", "--primary-color", "--active-500", "--p", "--pill-accent"].forEach(p => root.style.setProperty(p, p500));
        root.style.setProperty("--tone-mid", ramp["700"] || p500); root.style.setProperty("--brand-ink", hex);
        root.style.setProperty("--brand-contrast-fg", contrastFg); root.style.setProperty("--color-primary-content", contrastFg);
    }); state.brandColor = hex; safeWriteSiteData();
    const swatch = document.getElementById("bshadeSwatch"), hexEl = document.getElementById("bshadeHex"), contrastEl = document.getElementById("bshadeContrast");
    if (swatch) { swatch.style.background = hex; swatch.style.color = contrastFg; } if (hexEl) hexEl.textContent = hex;
    if (contrastEl) contrastEl.textContent = contrastFg === "#ffffff" ? "White text" : "Dark text"; const hexNorm = hex.toLowerCase();
    document.querySelectorAll("[data-color].color-btn").forEach(btn => {
        const bHex = btn.dataset.hex?.toLowerCase() || (btn.getAttribute("style") || "").match(/#([0-9a-fA-F]{6})/)?.[0]?.toLowerCase(), on = bHex === hexNorm;
        ["active", "border-2", "border-white", "ring-2", "ring-primary", "shadow-xs"].forEach(c => btn.classList.toggle(c, on)); btn.classList.toggle("border-white/20", !on);
    });
} export function applyColorScheme(scheme) {
    if (!scheme) return; state.scheme = scheme; safeWriteSiteData(); const theme = scheme === "white" ? "light" : "dark";
    getCanvasTargets().forEach(r => { r.setAttribute("data-scheme", scheme); r.setAttribute("data-theme", theme); });
    getCanvasBodyTargets().forEach(b => { b.classList.remove("scheme-white", "scheme-dark", "scheme-brand"); b.classList.add(`scheme-${scheme}`); });
    syncActiveGroup("[data-scheme]", "data-scheme", scheme);
} export { FONT_TIERS }; export function applyTypographyPreset(tier) {
    const fonts = FONT_TIERS[tier] || FONT_TIERS.tier1;
    getCanvasTargets().forEach(root => { root.style.setProperty("--headline-font", fonts.headline); root.style.setProperty("--body-font", fonts.body); });
    const sel = document.getElementById("typographySelect"); if (sel && sel.value !== tier) sel.value = tier; syncActiveGroup("[data-tier]", "data-tier", tier);
    state.typographyTier = tier; safeWriteSiteData();
} const state = {
    heroIndex: 0, headerStyle: "standard", headerAlign: "left", headerSticky: false,
    reviews: "white", ctas: 2, panel: "bottom", panelStyle: "solid",
    brandColor: "#16a34a", theme: "dark", painsLook: "a", painsAlign: "center", painsActions: "end",
    accountName: "", accountEmail: ""
}; let isSyncing = false; export function safeWriteSiteData() { if (!isSyncing) try { writeSiteData(state); } catch (e) {} } function syncActiveGroup(selector, attr, activeVal) {
    document.querySelectorAll(selector).forEach(btn => {
        const on = btn.getAttribute(attr) === String(activeVal); btn.classList.toggle("active", on); btn.classList.toggle("btn-active", on); btn.classList.toggle("btn-primary", on);
        btn.setAttribute("aria-pressed", String(on));
    });
}
const LAYOUT_HINTS = { 0: "Best for a short, direct offer.", 1: "Best for a strong photo or video.", 2: "Best for a short, direct offer.", 3: "Best when the work itself sells.", 4: "Best for a short, direct offer.", 5: "Best when the work itself sells." };
const HERO_LABELS = ["Layout 1: Gradient Centered", "Layout 2: Full Bleed", "Layout 3: Centered Full", "Layout 4: Bottom sidebar menu", "Layout 5: Bold Minimal", "Layout 6: Business Info"];
export function setHeroIndex(idx) {
    idx = Math.max(0, Math.min(Number(idx) || 0, 5)); state.heroIndex = idx; safeWriteSiteData();
    const canvasDoc = getCanvasDocument(), heroSection = canvasDoc?.getElementById("hero") || canvasDoc?.querySelector(".hero"); if (heroSection) {
        heroSection.dataset.layout = String(idx + 1); const label = heroSection.querySelector(".hero-label"); if (label && HERO_LABELS[idx]) label.textContent = HERO_LABELS[idx];
        const input = document.getElementById("hero-promise"), h1 = heroSection.querySelector(".hero-content h1"); if (input && h1 && !input.value) input.value = h1.textContent.trim();
    } syncActiveGroup("[data-hmhero]", "data-hmhero", idx); const hint = document.getElementById("hero-layout-hint"); if (hint) hint.textContent = LAYOUT_HINTS[idx] || ""; syncCanvasHeight();
} export function applyReviews(style) {
    state.reviews = style; safeWriteSiteData();
    getCanvasBodyTargets().forEach(b => ["on", "white", "black"].forEach(k => b.classList.toggle("reviews-" + k, k === "on" ? style !== "off" : style === k)));
    syncActiveGroup("[data-rev]", "data-rev", style);
} export function applyHeroPanel(pos) {
    state.panel = pos; safeWriteSiteData(); getCanvasBodyTargets().forEach(b => ["off", "bottom", "left", "right"].forEach(v => b.classList.toggle("panel-" + v, pos === v)));
    syncActiveGroup("[data-panel]", "data-panel", pos);
    getCanvasDocument().querySelectorAll(".biz-panel, .hb-info").forEach(panel => { panel.hidden = (pos === "off"); panel.classList.toggle("self-end", pos === "bottom"); });
    getCanvasDocument().querySelectorAll(".hero").forEach(hero => { if (hero.id) setCanvasAttr(hero.id, "panel", pos); });
} export function applyHeroPanelStyle(style) {
    state.panelStyle = style; safeWriteSiteData(); getCanvasBodyTargets().forEach(b => ["solid", "outline"].forEach(k => b.classList.toggle("panel-" + k, style === k)));
    syncActiveGroup("[data-pvariant], [data-pstyle]", "data-pvariant", style); setCanvasAttr("hero", "panelStyle", style);
} export function applyCtaCount(count) {
    state.ctas = count; safeWriteSiteData(); heroSections().forEach(hero => {
        const primary = hero.querySelector(".cta-primary:not(.cta-second)"), second = hero.querySelector(".cta-second"); if (primary) primary.style.display = count >= 1 ? "" : "none";
        if (second) second.style.display = count >= 2 ? "" : "none";
    }); syncActiveGroup("[data-ctacount]", "data-ctacount", count); setCanvasAttr("hero", "ctas", count); if (state.painsCtas === undefined) applyPainsCtaCount(count, false);
} export function applyPainsCtaCount(count, persist = true) {
    state.painsCtas = count; if (persist) safeWriteSiteData(); const pains = byId("pains"); if (pains) {
        const ctas = pains.querySelector(".pains-ctas"), primary = pains.querySelector(".pains-cta-primary, .cta-primary:not(.cta-second)"), second = pains.querySelector(".pains-cta-second, .cta-second");
        if (ctas) ctas.style.display = count > 0 ? "flex" : "none"; if (primary) primary.style.display = count >= 1 ? "" : "none"; if (second) second.style.display = count >= 2 ? "" : "none";
    } syncActiveGroup("[data-pains-ctacount]", "data-pains-ctacount", count); setCanvasAttr("pains", "ctaCount", count);
} export function setHeaderSticky(sticky) {
    state.headerSticky = !!sticky; safeWriteSiteData();
    getCanvasBodyTargets().forEach(b => { b.classList.toggle("is-sticky-header", state.headerSticky); b.dataset.stickyHeader = String(state.headerSticky); });
    const chk = document.getElementById("toggleHeaderSticky"); if (chk) chk.checked = state.headerSticky;
} export function setHeaderStyle(style) {
    state.headerStyle = style; safeWriteSiteData(); getCanvasDocument().querySelectorAll(".site-header").forEach(h => h.setAttribute("data-type", style));
    syncActiveGroup('[data-opt="type"]', "data-val", style);
} export function scrollToCanvasSection(secId) {
    if (!secId) return; const doc = getCanvasDocument(), target = doc?.getElementById(secId); if (!target) return; if (target.hidden) { target.hidden = false; syncCanvasHeight(); }
    doc.querySelectorAll(".is-canvas-selected").forEach(el => el.classList.remove("is-canvas-selected")); target.classList.add("is-canvas-selected");
    const scroller = document.querySelector(".kit-canvas-scroll"), frame = document.getElementById("templateCanvasFrame") || document.querySelector(".kit-canvas-frame iframe");
    if (scroller && frame) {
        const frameTop = frame.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop;
        const targetTop = target.getBoundingClientRect().top + (doc.defaultView?.scrollY || doc.documentElement.scrollTop || 0);
        scroller.scrollTo({ top: Math.max(0, frameTop + targetTop - 24), behavior: "smooth" });
    } else {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
} export function activateTab(secKey, opts = {}) {
    if (!secKey) return; const cleanId = String(secKey).replace(/^(tab-|rail-|acc-)/, "").toLowerCase();
    const targetAcc = document.querySelector(`[data-sec="${cleanId}"]`) || document.getElementById(`acc-${cleanId}`); if (targetAcc) {
        const bucket = targetAcc.closest(".kit-bucket"); if (bucket) bucket.open = true; if (targetAcc.tagName.toLowerCase() === "details") targetAcc.open = true;
        targetAcc.scrollIntoView({ behavior: "smooth", block: "center" }); targetAcc.classList.add("ring-2", "ring-primary");
        setTimeout(() => targetAcc.classList.remove("ring-2", "ring-primary"), 1400);
    } document.querySelectorAll(".cfg-tab").forEach(t => {
        const tid = t.id.replace(/^(tab-|rail-)/, ""); const on = (t.id === secKey || tid === cleanId || t.dataset.sec === cleanId);
        t.classList.toggle("is-active", on); t.setAttribute("aria-selected", String(on));
    }); if (!opts.fromCanvas) scrollToCanvasSection(["colors", "typography"].includes(cleanId) ? "hero" : cleanId);
} export function applyPainsLook(look = "a") {
    state.painsLook = look === "b" ? "b" : "a"; setCanvasAttr("pains", "look", state.painsLook); syncActiveGroup("#painsLayoutJoin [data-pains-look]", "data-pains-look", state.painsLook);
    const badge = document.getElementById("painsBadge"); if (badge) badge.textContent = state.painsLook === "b" ? "Split" : "3 Cards"; safeWriteSiteData();
} export function applyPainsAlignment(align = "center", persist = true) {
    state.painsAlign = ["left", "center", "right"].includes(align) ? align : "center"; setCanvasAttr("pains", "cardAlign", state.painsAlign);
    syncActiveGroup("[data-pains-align]", "data-pains-align", state.painsAlign); if (persist) safeWriteSiteData();
} export function applyPainsActions(align = "end", persist = true) {
    state.painsActions = ["start", "center", "end"].includes(align) ? align : "end";
    getCanvasDocument()?.querySelectorAll("#pains .card-actions").forEach(el => el.dataset.actionAlign = state.painsActions);
    syncActiveGroup("[data-pains-actions]", "data-pains-actions", state.painsActions); if (persist) safeWriteSiteData();
} export function applyGalleryWidth(val = "boxed") {
    state.galleryWidth = val; const c = getCanvasDocument()?.getElementById("about-gallery-container"); if (c) {
        c.dataset.galleryWidth = val; const b = val === "boxed";
        c.classList.toggle("max-w-7xl", b); c.classList.toggle("mx-auto", b); c.classList.toggle("px-4", b); c.classList.toggle("px-0", !b); c.classList.toggle("w-full", true);
    } document.querySelectorAll("[data-gallery-width]").forEach(btn => btn.classList.toggle("btn-active", btn.dataset.galleryWidth === val)); safeWriteSiteData(); syncCanvasHeight();
} export function applyGalleryScale(val = "1", persist = true) {
    state.galleryScale = val; const lbl = byId("gallery-scale-val"), sld = byId("gallery-scale-slider"); if (lbl) lbl.textContent = `${val}x`; if (sld && sld.value !== String(val)) sld.value = val;
    getCanvasDocument()?.getElementById("about-gallery-container")?.style.setProperty("--gal-scale", val); if (persist) safeWriteSiteData(); syncCanvasHeight();
} export function syncCanvasLayerLabels() {
    const doc = getCanvasDocument(); if (!doc) return; const map = { "trust-bar": "trust", "final-cta": "cta", repairs: "solutions" };
    doc.querySelectorAll("section[id], header[id], footer[id]").forEach(sec => {
        const cleanId = map[sec.id] || sec.id, heading = sec.querySelector('[id$="-title"], h2, h1, h3, .sec-title'); const titleText = heading?.textContent?.trim(); if (titleText) {
            const node = document.getElementById("acc-" + cleanId) || document.querySelector(`.more-row[data-sec="${cleanId}"]`);
            const label = node?.querySelector(".cfg-name, span.font-bold"); if (label) label.textContent = titleText;
        }
    });
} export function initMapbox(doc = getCanvasDocument()) {
    const img = doc?.getElementById("mapbox-render"); if (!img) return;
    const mark = ok => { img.hidden = !ok; const f = byId("mapboxToken"); f?.classList.toggle("input-success", ok); f?.classList.toggle("input-error", !ok); };
    img.onerror = () => mark(false); img.onload = () => mark(true); if (img.getAttribute("src") && img.complete) mark(img.naturalWidth > 0);
} export function syncCanvasState() {
    isSyncing = true; try {
        setHeroIndex(state.heroIndex || 0); applyReviews(state.reviews || "white"); applyHeroPanel(state.panel || "bottom"); applyHeroPanelStyle(state.panelStyle || "solid");
        applyCtaCount(state.ctas !== undefined ? state.ctas : 2); applyPainsCtaCount(state.painsCtas !== undefined ? state.painsCtas : (state.ctas !== undefined ? state.ctas : 2), false);
        if (state.brandColor) applyBrandPalette(state.brandColor); applyColorScheme(state.scheme || "dark"); if (state.theme) {
            [document.documentElement, document.getElementById("kit-drawer"), getCanvasDocument()?.documentElement, getCanvasDocument()?.body, document.querySelector(".kit-canvas-frame")].forEach(el => el?.setAttribute("data-theme", state.theme));
        } applyTypographyPreset(state.typographyTier || document.getElementById("typographySelect")?.value || "tier1"); applyPainsLook(state.painsLook || "a");
        applyPainsAlignment(state.painsAlign || "center", false); applyPainsActions(state.painsActions || "end", false); applyGalleryWidth(state.galleryWidth || "boxed");
        applyGalleryScale(state.galleryScale || "1", false); const doc = getCanvasDocument(); if (doc) {
            applyStateToDocument(doc, state); initMapbox(doc); const animToggle = byId("toggle-animations");
            if (animToggle) doc.documentElement.dataset.animations = animToggle.checked ? "true" : "false";
        } const promiseInput = document.getElementById("hero-promise"); if (promiseInput && state.heroPromise && document.activeElement !== promiseInput) promiseInput.value = state.heroPromise;
        const mapInput = byId("mapboxToken"); if (mapInput && state.mapboxToken && document.activeElement !== mapInput) mapInput.value = state.mapboxToken; if (state.halign) {
            getCanvasBodyTargets().forEach(cb => ["left", "center", "right"].forEach(a => cb.classList.toggle("hero-halign-" + a, a === state.halign)));
            syncActiveGroup("[data-halign]", "data-halign", state.halign);
        } if (state.headerSticky !== undefined) setHeaderSticky(state.headerSticky); if (state.headerStyle) setHeaderStyle(state.headerStyle); if (state.headerSurface) {
            if (doc) doc.querySelectorAll(".site-header").forEach(h => h.setAttribute("data-style", state.headerSurface)); syncActiveGroup('[data-opt="style"]', "data-val", state.headerSurface);
        } if (state.heroMarquee !== undefined) {
            const ls = doc?.getElementById("logostrip"); if (ls) ls.hidden = !state.heroMarquee;
            ["toggleHeroMarquee", "toggleHeroLogostrip"].forEach(id => { const t = document.getElementById(id); if (t) t.checked = !!state.heroMarquee; });
        } if (state.heroBlur !== undefined) {
            doc?.querySelectorAll(".hero-content").forEach(hc => hc.classList.toggle("backdrop-blur-md", !!state.heroBlur));
            const tb = document.getElementById("toggleHeroBlur"); if (tb) tb.checked = !!state.heroBlur;
        } if (state.heroReveal !== undefined) {
            doc?.querySelectorAll(".hero").forEach(h => h.classList.toggle("hm-reveal", !!state.heroReveal));
            const tr = document.getElementById("toggleHeroReveal"); if (tr) tr.checked = !!state.heroReveal;
        } if (state.sectionShades && typeof state.sectionShades === "object") {
            Object.entries(state.sectionShades).forEach(([secId, shadeVal]) => {
                byId(secId)?.style.setProperty("--sec-shade", `var(--active-${shadeVal})`); const sel = document.querySelector(`.more-row[data-sec="${secId}"] select.more-shade`);
                if (sel) sel.value = shadeVal;
            });
        } syncCanvasLayerLabels(); syncCanvasHeight();
    } finally {
        isSyncing = false;
    }
} function setDevicePreview(dev) {
    syncActiveGroup("[data-dev]", "data-dev", dev); const scroller = document.querySelector(".kit-canvas-scroll"), frame = document.querySelector(".kit-canvas-frame");
    if (scroller) scroller.dataset.device = dev; if (frame) {
        frame.dataset.device = dev; frame.style.width = dev === "desktop" ? "100%" : (dev === "tablet" ? "772px" : "390px");
        frame.style.maxWidth = dev === "desktop" ? "" : (dev === "tablet" ? "772px" : "390px");
    } setTimeout(syncCanvasHeight, 150);
} const DISPATCH_MAP = {
    hmhero: v => setHeroIndex(Number(v)),
    rev: v => applyReviews(v),
    panel: v => applyHeroPanel(v),
    pvariant: v => applyHeroPanelStyle(v),
    pstyle: v => applyHeroPanelStyle(v),
    ctacount: v => applyCtaCount(Number(v)),
    painsCtacount: v => applyPainsCtaCount(Number(v)),
    scheme: v => applyColorScheme(v),
    tier: v => applyTypographyPreset(v),
    painsLook: v => applyPainsLook(v),
    painsAlign: v => applyPainsAlignment(v),
    painsActions: v => applyPainsActions(v),
    cardAlign: v => { state.svcCardAlign = v; safeWriteSiteData(); syncActiveGroup("[data-card-align]", "data-card-align", v); setCanvasAttr("services", "cardAlign", v); },
    actionAlign: v => { state.svcActionAlign = v; safeWriteSiteData(); syncActiveGroup("[data-action-align]", "data-action-align", v); setCanvasAttr("services", "actionAlign", v); },
    galleryFilter: v => { syncActiveGroup("[data-gallery-filter]", "data-gallery-filter", v); getCanvasDocument().querySelectorAll("#gallery-row-1 [data-tag], #gallery-row-2 [data-tag]").forEach(el => { const m = v === "all" || el.dataset.tag === v; el.style.opacity = m ? "1" : "0.2"; el.style.filter = m ? "none" : "grayscale(100%)"; }); },
    galleryWidth: v => applyGalleryWidth(v),
    galleryScale: v => applyGalleryScale(v),
    dev: v => setDevicePreview(v),
    halign: v => {
        state.halign = v; safeWriteSiteData(); getCanvasBodyTargets().forEach(cb => ["left", "center", "right"].forEach(a => cb.classList.toggle("hero-halign-" + a, a === v)));
        syncActiveGroup("[data-halign]", "data-halign", v);
    },
    contrastMode: v => { syncActiveGroup("[data-contrast-mode]", "data-contrast-mode", v); getCanvasBodyTargets().forEach(b => b?.setAttribute("data-contrast-mode", v)); },
    opt: (v, btn) => {
        const val = btn.dataset.val; if (v === "type") return setHeaderStyle(val);
        if (v === "surface" || v === "style") { state.headerSurface = val; safeWriteSiteData(); syncActiveGroup('[data-opt="surface"], [data-opt="style"]', "data-val", val); getCanvasDocument().querySelectorAll(".site-header, #header").forEach(h => { h.setAttribute("data-surface", val); h.setAttribute("data-style", val); }); }
        else if (v === "count") { const n = Number(val); syncActiveGroup('[data-opt="count"]', "data-val", n); getCanvasDocument().querySelectorAll(".site-header nav a").forEach((a, i) => a.style.display = i < n ? "" : "none"); }
        else if (v === "buttons") { syncActiveGroup('[data-opt="buttons"]', "data-val", val); getCanvasDocument().querySelectorAll(".site-header .sh-cta, .site-header .sh-actions").forEach(el => el.style.display = val === "none" ? "none" : "flex"); }
    },
    svc: (v, btn) => {
        if (v === "card") {
            const s = btn.dataset.v; syncActiveGroup('[data-svc="card"]', "data-v", s);
            getCanvasDocument().querySelectorAll(".svc-card").forEach(c => { c.classList.toggle("border", s === "outline"); c.classList.toggle("border-base-300", s === "outline"); c.classList.toggle("shadow-sm", s !== "outline"); });
        }
    },
    more: (v, btn) => {
        if (v === "scheme") {
            const row = btn.closest(".more-row"), s = btn.dataset.v; row?.querySelectorAll('[data-more="scheme"]').forEach(b => b.classList.toggle("active", b === btn));
            const sec = byId(row?.dataset.sec);
            if (sec) { sec.setAttribute("data-scheme", s); sec.style.backgroundColor = s === "brand" ? "var(--active-950, #0f172a)" : (s === "white" ? "#ffffff" : (s === "dark" ? "#17191c" : "")); sec.style.color = (s === "brand" || s === "dark") ? "#ffffff" : (s === "white" ? "#17191c" : ""); }
        }
    }
}; function initAccountSettings() {
    const settingsBtn = document.getElementById("kitSettings"), accountView = document.getElementById("kit-account"); if (!settingsBtn || !accountView) return;
    try { Object.assign(state, JSON.parse(localStorage.getItem("pandino_account") || "{}")); } catch (e) {} const populate = () => {
        const { accountName: n = "", accountEmail: em = "" } = state;
        const elN = document.getElementById("kitAccountName"), elEm = document.getElementById("kitAccountEmail"), tn = document.getElementById("kitTeamMemberName"), te = document.getElementById("kitTeamMemberEmail");
        if (elN) elN.value = n; if (elEm) elEm.value = em; if (tn) tn.textContent = n || "Workspace Owner"; if (te) te.textContent = em || "Owner (Admin)";
    }; populate();
    const toggle = open => { accountView.hidden = !open; settingsBtn.setAttribute("aria-pressed", String(open)); if (open) { populate(); setTimeout(() => document.getElementById("kitAccountName")?.focus(), 100); } else settingsBtn.focus(); };
    settingsBtn.addEventListener("click", () => toggle(accountView.hidden)); document.querySelector(".kit-account-back")?.addEventListener("click", () => toggle(false));
    document.addEventListener("keydown", e => { if (e.key === "Escape" && !accountView.hidden) toggle(false); });
    accountView.querySelectorAll("#kitAccountNav [data-acct-tab]").forEach(tab => tab.addEventListener("click", () => {
        accountView.querySelectorAll("#kitAccountNav [data-acct-tab]").forEach(t => { t.classList.toggle("active", t === tab); t.setAttribute("aria-selected", String(t === tab)); });
        accountView.querySelectorAll("[data-acct-pane]").forEach(p => p.hidden = p.dataset.acctPane !== tab.dataset.acctTab);
    })); const persistAcct = (toast = true) => {
        state.accountName = document.getElementById("kitAccountName")?.value?.trim() || ""; state.accountEmail = document.getElementById("kitAccountEmail")?.value?.trim() || ""; populate();
        try { localStorage.setItem("pandino_account", JSON.stringify({ name: state.accountName, email: state.accountEmail, updatedAt: Date.now() })); safeWriteSiteData(); } catch (e) {}
        const tEl = document.getElementById("cfgToast"); if (toast && tEl) { tEl.textContent = "Account profile updated"; tEl.classList.remove("hidden"); setTimeout(() => tEl.classList.add("hidden"), 2500); }
    }; document.getElementById("kitAccountSave")?.addEventListener("click", () => persistAcct(true));
    ["kitAccountName", "kitAccountEmail"].forEach(id => document.getElementById(id)?.addEventListener("input", () => persistAcct(false)));
} function setHeroMarquee(on) {
    state.heroMarquee = on; safeWriteSiteData(); const ls = getCanvasDocument().getElementById("logostrip"); if (ls) ls.hidden = !on; syncCanvasHeight();
} const PRE_CANVAS = {
    painsAlign: v => setCanvasAttr("pains", "cardAlign", v),
    painsActions: v => getCanvasDocument()?.querySelectorAll("#pains .card-actions").forEach(el => el.dataset.actionAlign = v)
}; const CLASS_CLICK = {
    "color-btn"(e, btn) {
        e.stopPropagation(); let hex = btn.dataset.hex || (btn.getAttribute("style") || "").match(/#([0-9a-fA-F]{6})/)?.[0]; if (!hex) {
            const comp = window.getComputedStyle(btn).backgroundColor, rgbM = comp.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
            if (rgbM) hex = "#" + [1, 2, 3].map(i => parseInt(rgbM[i], 10).toString(16).padStart(2, "0")).join("");
        } if (hex) {
            applyBrandPalette(hex); const sum = document.getElementById("sum-brand");
            if (sum && btn.dataset.color) sum.textContent = btn.dataset.color.charAt(0).toUpperCase() + btn.dataset.color.slice(1);
        }
    },
    "cfg-tab"(e, btn) { e.stopPropagation(); activateTab(btn.id); },
    "kit-row"(_e, btn) { activateTab(btn.querySelector(".cfg-tab")?.id || btn.dataset.sec); }
}; function initGlobalDispatchListeners() {
    document.addEventListener("click", e => {
        const link = e.target.closest("a"); if (link && (link.target === "_blank" || link.id === "kitWin")) return; const btn = e.target.closest("button, [data-opt], .cfg-tab, .color-btn, .kit-row");
        if (!btn) return; for (const k in PRE_CANVAS) if (btn.dataset[k]) PRE_CANVAS[k](btn.dataset[k]);
        for (const k in btn.dataset) { if (DISPATCH_MAP[k]) return DISPATCH_MAP[k](btn.dataset[k], btn); }
        for (const cls in CLASS_CLICK) if (btn.classList.contains(cls)) return CLASS_CLICK[cls](e, btn);
        if (btn.id === "shClose") document.getElementById("shMobile")?.setAttribute("aria-hidden", "true");
    }); const promise = document.getElementById("hero-promise"); if (promise) {
        const deferred = createDeferredWrite(() => { state.heroPromise = promise.value; safeWriteSiteData(); }, 150); promise.addEventListener("input", e => {
            const h1 = getCanvasDocument().querySelector("main.heroes-container > .hero.is-live-hero, main.heroes-container > .hero")?.querySelector(".hero-content h1");
            if (h1) h1.textContent = e.target.value; state.heroPromise = e.target.value; deferred();
        });
    } const CHANGE_MAP = {
        typographySelect: el => applyTypographyPreset(el.value),
        btnShade: el => getCanvasTargets().forEach(r => r?.style.setProperty("--btn-bg", el.value === "auto" ? "var(--active-500)" : `var(--active-${el.value})`)),
        svcCols: el => { const g = getCanvasDocument().querySelector(".svc-grid"); if (g) { g.style.gridTemplateColumns = `repeat(${el.value}, minmax(0, 1fr))`; syncCanvasHeight(); } },
        toggleSvcShowIcon: el => getCanvasDocument().querySelectorAll(".svc-ic").forEach(ic => ic.style.display = el.checked ? "" : "none"),
        toggleSvcImg: el => getCanvasDocument().querySelectorAll(".svc").forEach(s => s.setAttribute("data-img", el.checked ? "on" : "off")),
        toggleHeaderShow: el => { getCanvasDocument().querySelectorAll(".site-header, #header").forEach(h => h.hidden = !el.checked); syncCanvasHeight(); },
        toggleHeaderSticky: el => setHeaderSticky(el.checked),
        mapboxToken: el => { const v = el.value.trim(), ok = !v || /^pk\.[\w.-]+$/.test(v); el.classList.toggle("input-error", !ok); if (ok) { state.mapboxToken = v; safeWriteSiteData(); applyStateToDocument(getCanvasDocument(), state); } },
        toggleHeroReveal: el => { state.heroReveal = el.checked; safeWriteSiteData(); getCanvasDocument().querySelectorAll(".hero").forEach(h => h.classList.toggle("hm-reveal", el.checked)); },
        toggleHeroBlur: el => { state.heroBlur = el.checked; safeWriteSiteData(); getCanvasDocument().querySelectorAll(".hero-content").forEach(hc => hc.classList.toggle("backdrop-blur-md", el.checked)); },
        toggleHeroMarquee: el => setHeroMarquee(el.checked),
        toggleHeroLogostrip: el => setHeroMarquee(el.checked)
    }; const ROW_CHANGE = {
        show: t => { const sec = byId(t.closest(".more-row")?.dataset.sec); if (sec) { sec.hidden = !t.checked; syncCanvasHeight(); } },
        shade: t => { const sec = t.closest(".more-row")?.dataset.sec; if (sec) { (state.sectionShades ??= {})[sec] = t.value; safeWriteSiteData(); byId(sec)?.style.setProperty("--sec-shade", `var(--active-${t.value})`); } }
    }; document.addEventListener("change", e => {
        const t = e.target; if (CHANGE_MAP[t.id]) return CHANGE_MAP[t.id](t); if (t.matches('.more-row [data-more="show"]')) return ROW_CHANGE.show(t);
        if (t.matches(".more-row select.more-shade")) return ROW_CHANGE.shade(t); if (t.closest("#kitTheme")) {
            const theme = t.checked ? "light" : "dark";
            [document.documentElement, document.getElementById("kit-drawer"), getCanvasDocument()?.documentElement, getCanvasDocument()?.body, document.querySelector(".kit-canvas-frame")].forEach(el => el?.setAttribute("data-theme", theme));
            state.theme = theme; safeWriteSiteData();
        }
    }); const hexInput = document.getElementById("brandHex"), hexPick = document.getElementById("brandHexPick"); const updHex = v => { if (v) { applyBrandPalette(v); state.brandColor = v; } };
    hexPick?.addEventListener("input", () => { if (hexInput) hexInput.value = hexPick.value; updHex(hexPick.value); });
    document.getElementById("brandHexApply")?.addEventListener("click", () => updHex(hexInput?.value));
    hexInput?.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); updHex(hexInput.value); } });
    byId("toggle-animations")?.addEventListener("change", e => { const doc = getCanvasDocument(); if (doc) doc.documentElement.dataset.animations = e.target.checked ? "true" : "false"; });
    byId("gallery-scale-slider")?.addEventListener("input", e => applyGalleryScale(e.target.value)); initActionButtons(); initAccountSettings();
} function initActionButtons() {
    document.getElementById("cfgCollapse")?.addEventListener("click", e => {
        const btn = e.target.closest("button"), isCol = document.getElementById("cfg")?.classList.toggle("is-collapsed");
        btn?.setAttribute("aria-expanded", String(!isCol)); if (btn) btn.dataset.tip = isCol ? "Show controls" : "Hide controls";
        const lbl = document.getElementById("cfgCollapseLabel"), ic = btn?.querySelector(".material-symbols-outlined");
        if (lbl) lbl.textContent = isCol ? "Show" : "Hide controls"; if (ic) ic.textContent = isCol ? "visibility" : "visibility_off";
    }); document.getElementById("kitRailToggle")?.addEventListener("click", e => {
        const btn = e.target.closest("button"), d = document.getElementById("kit-drawer"), open = d?.dataset.kitRail === "open";
        if (d) d.dataset.kitRail = open ? "closed" : "open"; btn?.setAttribute("aria-expanded", String(!open));
    }); document.getElementById("btnSave")?.addEventListener("click", e => {
        const btnSave = e.target.closest("button"), typeSel = document.getElementById("typographySelect"), pInput = document.getElementById("hero-promise");
        if (typeSel) state.typographyTier = typeSel.value; if (pInput?.value) state.heroPromise = pInput.value; safeWriteSiteData();
        const ic = document.getElementById("btnSaveIcon"), txt = document.getElementById("btnSaveText"), toast = document.getElementById("cfgToast");
        if (txt) txt.textContent = "Saved!"; if (ic) ic.textContent = "check"; btnSave?.classList.add("btn-success");
        if (toast) { toast.textContent = "Configuration saved"; toast.classList.remove("hidden"); setTimeout(() => toast.classList.add("hidden"), 2000); }
        setTimeout(() => { if (txt) txt.textContent = "Save"; if (ic) ic.textContent = "save"; btnSave?.classList.remove("btn-success"); }, 2000);
    }); document.getElementById("btnReset")?.addEventListener("click", () => {
        applyTypographyPreset("tier1"); applyBrandPalette("azure"); applyColorScheme("brand"); setHeroIndex(0); applyPainsLook("a");
        const pInput = document.getElementById("hero-promise"); if (pInput) pInput.value = ""; safeWriteSiteData(); syncCanvasState();
        const txt = document.getElementById("btnResetText"), ic = document.getElementById("btnResetIcon");
        if (txt) txt.textContent = "Reset!"; if (ic) ic.textContent = "check"; setTimeout(() => { if (txt) txt.textContent = "Reset"; if (ic) ic.textContent = "restart_alt"; }, 1500);
    });
} export function initCanvasSectionClicks() {
    const frame = document.getElementById("templateCanvasFrame") || document.querySelector(".kit-canvas-frame iframe"); if (!frame) return; function attach() {
        try {
            const doc = frame.contentDocument || frame.contentWindow?.document; if (!doc?.body) return; doc.removeEventListener("click", onClick, true); doc.addEventListener("click", onClick, true);
        } catch (e) {}
    } function onClick(e) {
        if (e.target.closest("input, textarea, select")) return; const sec = e.target.closest("section, header, footer"); if (!sec) return;
        const secId = sec.id || (["header", "footer"].includes(sec.tagName.toLowerCase()) ? sec.tagName.toLowerCase() : null); if (secId) {
            const doc = frame.contentDocument || frame.contentWindow?.document; doc?.querySelectorAll(".is-canvas-selected").forEach(el => el.classList.remove("is-canvas-selected"));
            sec.classList.add("is-canvas-selected"); activateTab(secId, { fromCanvas: true });
        }
    } frame.addEventListener("load", attach); if (frame.contentDocument?.readyState === "complete") attach();
} export function initRuntime() {
    const hostRoot = document.documentElement;
    ["--color-primary", "--primary-color", "--p", "--active-500", "--brand-ink", "--brand-contrast-fg", "--color-primary-content", "--headline-font", "--body-font", "--btn-bg"].forEach(p => hostRoot.style.removeProperty(p));
    SHADE_STEPS.forEach(step => { hostRoot.style.removeProperty(`--active-${step}`); hostRoot.style.removeProperty(`--primary-${step}`); }); const saved = readSiteData();
    if (saved) Object.assign(state, saved); const sumBrand = document.getElementById("sum-brand"); if (sumBrand && state.brandColor) {
        const matchingBtn = document.querySelector(`[data-color].color-btn[data-hex="${state.brandColor}"]`) || document.querySelector(`[data-color].color-btn[style*="${state.brandColor}"]`);
        if (matchingBtn?.dataset.color) sumBrand.textContent = matchingBtn.dataset.color.charAt(0).toUpperCase() + matchingBtn.dataset.color.slice(1);
    } initGlobalDispatchListeners(); initCanvasSectionClicks(); const frame = document.getElementById("templateCanvasFrame") || document.querySelector(".kit-canvas-frame iframe"); if (frame) {
        const s = frame.getAttribute("src"); if (!s || s === "template" || s === "/template") frame.src = "./template.html"; let resizeRaf = null; frame.addEventListener("load", () => {
            try {
                const doc = frame.contentDocument || frame.contentWindow?.document; if (doc?.body) {
                    const ro = new ResizeObserver(() => {
                        if (resizeRaf) cancelAnimationFrame(resizeRaf); resizeRaf = requestAnimationFrame(() => syncCanvasHeight());
                    }); ro.observe(doc.body);
                } bindRouteDelegation(doc, frame.contentWindow); if (doc) initMapbox(doc);
            } catch (e) {} syncCanvasState(); if (window.location.hash) navigateRoute(window.location.hash);
        }); if (frame.contentDocument?.readyState === "complete") {
            const doc = frame.contentDocument || frame.contentWindow?.document; bindRouteDelegation(doc, frame.contentWindow); if (doc) initMapbox(doc); syncCanvasState();
        }
    } onSiteDataChange(updatedData => {
        if (updatedData) {
            Object.assign(state, updatedData); syncCanvasState();
        }
    }); bindRouteDelegation(document, window); syncCanvasState(); if (window.location.hash) navigateRoute(window.location.hash); Object.assign(window, {
        __heroMedia: { get cur() { return state.heroIndex; }, setHeroIndex }, __applyHeroPanel: applyHeroPanel, __applyBrandPalette: applyBrandPalette,
        __kitPresetRefresh: () => {}, __kitFilterPage: () => {}, activateTab, syncCanvasLayerLabels, applyPainsLook, applyPainsAlignment, applyGalleryWidth, navigateRoute
    });
} export function bindBlueprintColorInteractions(doc) {
    if (!doc) return; const pills = doc.getElementById("blueprint-brand-pills"), ramp = doc.getElementById("blueprint-oklch-ramp");
    if (pills && !pills._bpBound) { pills._bpBound = true; pills.addEventListener("click", e => { const b = e.target.closest("[data-hex]"); if (b) applyBrandPalette(b.dataset.hex); }); }
    if (ramp && !ramp._bpBound) { ramp._bpBound = true; ramp.addEventListener("click", e => { const c = e.target.closest("[data-step]"); if (c) getCanvasTargets().forEach(t => t.style.setProperty("--color-primary", `var(--active-${c.dataset.step})`)); }); }
} export function navigateRoute(routeKey) {
    const raw = routeKey || window.location.hash || "home"; const key = raw.replace(/^#?\/?(services\/|legal\/)?/, "") || "home"; const route = ROUTES[key] || ROUTES.home;
    const kitWin = byId("kitWin"); if (kitWin) kitWin.href = `./template.html?preview=1${window.location.hash || ""}`; const doc = getCanvasDocument(); const hero = doc?.getElementById("hero");
    if (hero) {
        hero.dataset.heroTier = route.tier; const crumbs = doc.getElementById("hero-breadcrumbs"); if (crumbs) {
            crumbs.classList.toggle("hidden", route.tier === "full" || !route.crumbs || route.crumbs.length <= 1);
            crumbs.innerHTML = route.crumbs?.length > 1 ? `<ul>${route.crumbs.map((c, i) => i === route.crumbs.length - 1 ? `<li>${c}</li>` : `<li><a href="#home" data-route="home">${c}</a></li>`).join("")}</ul>` : "";
        } const kicker = doc.getElementById("hero-kicker"), title = doc.getElementById("hero-title"), desc = doc.getElementById("hero-desc");
        if (kicker && route.kicker) kicker.textContent = route.kicker; if (title) { if (route.title) title.textContent = route.title; title.dataset.heroTier = route.tier; }
        const isBp = key === "theme-blueprint" || key === "sections-blueprint", isMin = route.tier === "minimal";
        const rev = hero.querySelector(".hero-reviews, [data-reviews]"), ctas = doc.getElementById("hero-ctas"); if (rev) rev.hidden = isMin;
        if (desc) { desc.hidden = false; if (route.desc) desc.textContent = route.desc; desc.classList.toggle("text-base-content/80", isBp); desc.classList.toggle("text-white/80", !isBp); }
        if (ctas) ctas.hidden = isMin; const car = hero.querySelector(".carousel"); if (car) car.hidden = isBp; hero.classList.toggle("bg-base-300", isBp); hero.classList.toggle("border-b", isBp);
        hero.classList.toggle("border-base-content/10", isBp); hero.querySelectorAll(".absolute.top-4.left-4").forEach(el => el.classList.toggle("hidden", isMin));
    } if (doc) {
        const isSpec = key === "sections-blueprint"; doc.documentElement[isSpec ? "setAttribute" : "removeAttribute"]("data-specimen", "true");
        populateServiceDetail(doc, isSpec ? ROUTES["collision-repair"] : route); if (isSpec && doc.getElementById("service-detail")) doc.getElementById("service-detail").hidden = false;
    } if (route.recipe && doc) applyRecipe(doc, route.recipe);
    [900, 800, 700, 600, 500, 400, 300, 200].forEach(s => { const c = doc?.getElementById("chip-" + s); if (c) c.style.backgroundColor = "var(--active-" + s + ")"; });
    bindBlueprintColorInteractions(doc); syncCanvasHeight();
} function bindRouteDelegation(targetDoc, targetWin) {
    targetDoc?.addEventListener("click", e => {
        const link = e.target.closest("a"); if (link && (link.target === "_blank" || link.id === "kitWin")) return; const routeLink = e.target.closest?.("[data-route]"); if (!routeLink) return;
        e.preventDefault(); const route = routeLink.dataset.route; const href = routeLink.getAttribute("href"); if (href && href.startsWith("#")) {
            window.location.hash = href; if (targetWin && targetWin !== window) targetWin.location.hash = href;
        } navigateRoute(route);
    }); targetWin?.addEventListener("hashchange", () => navigateRoute(targetWin.location.hash));
} if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initRuntime);
} else {
    initRuntime();
}
