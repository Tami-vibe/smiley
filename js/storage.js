/* =========================================================
   PANDINO PERSISTENCE PIPELINE & CROSS-TAB STATE ENGINE
   Real-time BroadcastChannel & LocalStorage persistence.
   Declarative style token & layout variant synchronization.
   ========================================================= */
const KEY = 'site_data';
const CHANNEL_NAME = 'pandino_site_sync';
let syncChannel = null;
try {
    if (typeof BroadcastChannel !== 'undefined') {
        syncChannel = new BroadcastChannel(CHANNEL_NAME);
    }
} catch (e) {}
export function readSiteData() {
    try {
        return JSON.parse(localStorage.getItem(KEY) || 'null');
    } catch (e) {
        return null;
    }
}
export function writeSiteData(data) {
    if (!data) return;
    try {
        const serialized = JSON.stringify(data);
        localStorage.setItem(KEY, serialized);
        if (syncChannel) {
            syncChannel.postMessage({ type: 'SITE_DATA_SYNC', data, timestamp: Date.now() });
        }
    } catch (e) { /* private browsing quota guard */ }
}
export function onSiteDataChange(callback) {
    if (typeof callback !== 'function') return () => {};
    const onBroadcast = (e) => {
        if (e.data && e.data.type === 'SITE_DATA_SYNC' && e.data.data) {
            callback(e.data.data);
        }
    };
    const onStorage = (e) => {
        if (e.key === KEY && e.newValue) {
            try {
                callback(JSON.parse(e.newValue));
            } catch (err) {}
        }
    };
    if (syncChannel) {
        syncChannel.addEventListener('message', onBroadcast);
    }
    window.addEventListener('storage', onStorage);
    return () => {
        if (syncChannel) syncChannel.removeEventListener('message', onBroadcast);
        window.removeEventListener('storage', onStorage);
    };
}
/* Trailing debounce for high-frequency input (e.g., headline text input) */
export function createDeferredWrite(run, wait = 250) {
    let timer = 0;
    const fire = () => { timer = 0; run(); };
    const schedule = () => {
        if (timer) clearTimeout(timer);
        timer = setTimeout(fire, wait);
    };
    schedule.flush = () => {
        if (!timer) return;
        clearTimeout(timer);
        fire();
    };
    schedule.pending = () => timer !== 0;
    return schedule;
}
/* =========================================================
   DESIGN TOKENS: TYPOGRAPHY TIERS & OKLCH PALETTE GENERATOR
   ========================================================= */
export const FONT_TIERS = {
    tier1: { headline: "'Syne', sans-serif", body: "'Manrope', sans-serif" },
    tier2: { headline: "'DM Serif Display', serif", body: "'Manrope', sans-serif" },
    tier3: { headline: "'Montserrat', sans-serif", body: "'Inter', sans-serif" },
    tier4: { headline: "'Playfair Display', serif", body: "'Inter', sans-serif" },
    tier5: { headline: "'Poppins', sans-serif", body: "'Poppins', sans-serif" }
};
export function hexToRgb(hex) {
    const m = /^#?([0-9a-f]{6})$/i.exec(String(hex).trim());
    if (!m) return null;
    const n = parseInt(m[1], 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}
export function rgbToOklch(r, g, b) {
    let R = r / 255, G = g / 255, B = b / 255;
    R = R <= .04045 ? R / 12.92 : ((R + .055) / 1.055) ** 2.4;
    G = G <= .04045 ? G / 12.92 : ((G + .055) / 1.055) ** 2.4;
    B = B <= .04045 ? B / 12.92 : ((B + .055) / 1.055) ** 2.4;
    const l = 0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B;
    const m = 0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B;
    const s = 0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B;
    const l_ = Math.cbrt(l), m_ = Math.cbrt(m), s_ = Math.cbrt(s);
    const L = 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_;
    const a = 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_;
    const bb = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_;
    const C = Math.sqrt(a * a + bb * bb);
    let H = Math.atan2(bb, a) * 180 / Math.PI;
    if (H < 0) H += 360;
    return { L, C, H };
}
export function oklchToHex(L, C, H) {
    const h = H * Math.PI / 180;
    const a = C * Math.cos(h), b = C * Math.sin(h);
    const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
    const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
    const s_ = L - 0.0894841775 * a - 1.2914855480 * b;
    const l = l_ ** 3, m = m_ ** 3, s = s_ ** 3;
    let R = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
    let G = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
    let B = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;
    const toS = v => {
        v = Math.min(1, Math.max(0, v));
        return v <= 0.0031308 ? 12.92 * v : 1.055 * (v ** (1 / 2.4)) - 0.055;
    };
    const hex = n => Math.round(toS(n) * 255).toString(16).padStart(2, '0');
    return '#' + hex(R) + hex(G) + hex(B);
}
export const SHADE_STEPS = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];
export const L_T = { 50: 0.976, 100: 0.947, 200: 0.899, 300: 0.832, 400: 0.742, 500: 0.670, 600: 0.587, 700: 0.511, 800: 0.433, 900: 0.377, 950: 0.257 };
export const C_T = { 50: 0.015, 100: 0.036, 200: 0.069, 300: 0.110, 400: 0.151, 500: 0.175, 600: 0.177, 700: 0.163, 800: 0.136, 900: 0.112, 950: 0.077 };
export function rampFromHex(hex) {
    const rgb = hexToRgb(hex);
    if (!rgb) return null;
    const { L, C, H } = rgbToOklch(rgb.r, rgb.g, rgb.b);
    const h = String(hex).trim().replace(/^#/, '').toLowerCase();
    let lock = '500', best = 99;
    SHADE_STEPS.forEach(n => {
        const d = Math.abs(L - L_T[n]);
        if (d < best) { best = d; lock = String(n); }
    });
    const neutral = C < 0.045;
    const out = {};
    SHADE_STEPS.forEach(n => {
        const key = String(n);
        if (key === lock) { out[key] = '#' + h; return; }
        const c = neutral
            ? Math.min(0.04, C_T[n] * (C / 0.028))
            : Math.min(0.37, C * (C_T[n] / Math.max(0.02, C_T[Number(lock)])));
        out[key] = oklchToHex(L_T[n], c, H);
    });
    return out;
}
/* =========================================================
   DECLARATIVE DOCUMENT STATE MAPPER
   Applies full custom state model to target document.
   ========================================================= */
export function applyStateToDocument(doc, data) {
    if (!doc || !data) return;
    const root = doc.documentElement;
    const body = doc.body;
    if (!root || !body) return;
    // 1. Brand Palette & OKLCH Color Ramp
    if (data.brandColor) {
        const hex = data.brandColor;
        const ramp = rampFromHex(hex);
        const rgb = hexToRgb(hex);
        let contrastFg = '#ffffff';
        if (rgb) {
            const lum = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
            contrastFg = lum > 0.62 ? '#17191c' : '#ffffff';
        }
        const p500 = (ramp && ramp['500']) || hex;
        [root, body].forEach(target => {
            if (ramp) {
                SHADE_STEPS.forEach(step => {
                    if (ramp[step]) {
                        target.style.setProperty(`--active-${step}`, ramp[step]);
                        target.style.setProperty(`--primary-${step}`, ramp[step]);
                    }
                });
            }
            target.style.setProperty('--color-primary', p500);
            target.style.setProperty('--primary-color', p500);
            target.style.setProperty('--active-500', p500);
            target.style.setProperty('--p', p500);
            target.style.setProperty('--pill-accent', p500);
            target.style.setProperty('--tone-mid', (ramp && ramp['700']) || p500);
            target.style.setProperty('--brand-ink', hex);
            target.style.setProperty('--brand-contrast-fg', contrastFg);
            target.style.setProperty('--color-primary-content', contrastFg);
        });
    }
    // 2. Color Scheme & Theme Mode
    if (data.scheme) {
        const isLight = (data.scheme === 'white');
        const themeName = isLight ? 'light' : 'dark';
        root.setAttribute('data-scheme', data.scheme);
        root.setAttribute('data-theme', themeName);
        body.setAttribute('data-theme', themeName);
        body.classList.remove('scheme-white', 'scheme-dark', 'scheme-brand');
        body.classList.add(`scheme-${data.scheme}`);
        const frameContainer = document.querySelector('.kit-canvas-frame');
        if (frameContainer) frameContainer.setAttribute('data-theme', themeName);
    } else if (data.theme) {
        root.setAttribute('data-theme', data.theme);
        body.setAttribute('data-theme', data.theme);
        const frameContainer = document.querySelector('.kit-canvas-frame');
        if (frameContainer) frameContainer.setAttribute('data-theme', data.theme);
    }
    // 3. Typography Preset Model
    if (data.typographyTier) {
        const fonts = FONT_TIERS[data.typographyTier] || FONT_TIERS.tier1;
        [root, body].forEach(target => {
            target.style.setProperty('--headline-font', fonts.headline);
            target.style.setProperty('--body-font', fonts.body);
        });
        let dynStyle = doc.getElementById('pandino-dynamic-typography');
        if (!dynStyle) {
            dynStyle = doc.createElement('style');
            dynStyle.id = 'pandino-dynamic-typography';
            (doc.head || doc.body).appendChild(dynStyle);
        }
        dynStyle.textContent = `
            body { font-family: ${fonts.body} !important; }
            h1, h2, h3, h4, h5, h6, .hero-content h1, .title-wrap h1, .card-title, .sec-title {
                font-family: ${fonts.headline} !important;
            }
        `;
    }
    // 4. Hero Layout Formats (0: Soft center, 1: Full-screen, 2: Frame, 3: Side menu, 4: Bold line, 5: Split)
    if (data.heroIndex !== undefined) {
        const hero = doc.getElementById('hero') || doc.querySelector('main.heroes-container > .hero, .heroes-container > .hero, .hero');
        if (hero) {
            hero.dataset.layout = String(Number(data.heroIndex) + 1);
            hero.hidden = false;
            hero.classList.add('is-live-hero');
            const HERO_LABELS = [
                'Layout 1: Gradient Centered',
                'Layout 2: Full Bleed',
                'Layout 3: Centered Full',
                'Layout 4: Bottom sidebar menu',
                'Layout 5: Bold Minimal',
                'Layout 6: Business Info'
            ];
            const label = hero.querySelector('.hero-label');
            if (label && HERO_LABELS[data.heroIndex]) label.textContent = HERO_LABELS[data.heroIndex];
        }
    }
    // 5. Hero Panel Position (off, bottom, left, right) - Enforces Split hero variant
    if (data.panel) {
        const pos = data.panel;
        ['off', 'bottom', 'left', 'right'].forEach(v => {
            body.classList.toggle('panel-' + v, pos === v);
        });
        doc.querySelectorAll('.biz-panel, .hb-info').forEach(panel => {
            if (pos === 'off') {
                panel.setAttribute('hidden', '');
                panel.hidden = true;
            } else {
                panel.removeAttribute('hidden');
                panel.hidden = false;
            }
            panel.classList.toggle('self-end', pos === 'bottom');
        });
        doc.querySelectorAll('.hero').forEach(hero => {
            hero.setAttribute('data-panel', pos);
        });
    }
    // 6. Hero Panel Style (solid vs outline)
    if (data.panelStyle) {
        body.classList.toggle('panel-solid', data.panelStyle === 'solid');
        body.classList.toggle('panel-outline', data.panelStyle === 'outline');
    }
    // 7. Customer Pains Layout Variant (a: 3 Cards vs b: Split Comparison)
    if (data.painsLook) {
        const pains = doc.getElementById('pains') || doc.querySelector('.ks-pains');
        if (pains) {
            pains.setAttribute('data-look', data.painsLook);
        }
    }
    // 7b. Customer Pains Card Alignment (left | center | right)
    if (data.painsAlign) {
        const pains = doc.getElementById('pains') || doc.querySelector('.ks-pains');
        if (pains) {
            pains.setAttribute('data-card-align', data.painsAlign);
            pains.classList.remove('pains-align-left', 'pains-align-center', 'pains-align-right');
            pains.classList.add(`pains-align-${data.painsAlign}`);
        }
    }
    // 8. Hero Headline Pitch Text
    if (data.heroPromise) {
        const h1 = doc.querySelector('.hero.is-live-hero .hero-content h1, .hero#hero .hero-content h1') || doc.querySelector('.hero-content h1');
        if (h1) h1.textContent = data.heroPromise;
    }
    // 9. CTA Buttons Count (Hero & Sections)
    if (data.ctas !== undefined) {
        const heroes = doc.querySelectorAll('main.heroes-container > .hero, .heroes-container > .hero');
        heroes.forEach(hero => {
            const primary = hero.querySelector('.cta-primary:not(.cta-second)');
            const second = hero.querySelector('.cta-second');
            if (primary) primary.style.display = data.ctas >= 1 ? '' : 'none';
            if (second) second.style.display = data.ctas >= 2 ? '' : 'none';
        });
    }
    // 9b. Customer Pains Buttons Count
    const painsCtaCount = (data.painsCtas !== undefined) ? data.painsCtas : (data.ctas !== undefined ? data.ctas : 2);
    const painsSection = doc.getElementById('pains') || doc.querySelector('.ks-pains');
    if (painsSection) {
        const ctas = painsSection.querySelector('.pains-ctas');
        const primary = painsSection.querySelector('.pains-cta-primary, .cta-primary:not(.cta-second)');
        const second = painsSection.querySelector('.pains-cta-second, .cta-second');
        if (ctas) ctas.style.display = painsCtaCount > 0 ? 'flex' : 'none';
        if (primary) primary.style.display = painsCtaCount >= 1 ? '' : 'none';
        if (second) second.style.display = painsCtaCount >= 2 ? '' : 'none';
    }
    // 10. Reviews Trust Badge Style (off, white, black)
    if (data.reviews) {
        body.classList.toggle('reviews-on', data.reviews !== 'off');
        body.classList.toggle('reviews-white', data.reviews === 'white');
        body.classList.toggle('reviews-black', data.reviews === 'black');
    }
    // 11. Hero Text Alignment
    if (data.halign) {
        ['left', 'center', 'right'].forEach(a => {
            body.classList.toggle('hero-halign-' + a, a === data.halign);
        });
    }
    // 12. Header Sticky & Surface Style
    if (data.headerSticky !== undefined) {
        body.classList.toggle('is-sticky-header', !!data.headerSticky);
        body.dataset.stickyHeader = String(!!data.headerSticky);
    }
    if (data.headerStyle) {
        doc.querySelectorAll('.site-header').forEach(h => {
            h.setAttribute('data-type', data.headerStyle);
        });
    }
    if (data.headerSurface) {
        doc.querySelectorAll('.site-header').forEach(h => {
            h.setAttribute('data-style', data.headerSurface);
        });
    }
    // 13. Secondary Hero Toggles
    if (data.heroMarquee !== undefined) {
        const ls = doc.getElementById('logostrip');
        if (ls) ls.hidden = !data.heroMarquee;
    }
    if (data.heroBlur !== undefined) {
        doc.querySelectorAll('.hero-content').forEach(hc => {
            hc.classList.toggle('backdrop-blur-md', !!data.heroBlur);
        });
    }
    // 14. Section Custom Shades
    if (data.sectionShades && typeof data.sectionShades === 'object') {
        Object.entries(data.sectionShades).forEach(([secId, shadeVal]) => {
            const sec = doc.getElementById(secId);
            if (sec) {
                sec.style.setProperty('--sec-shade', `var(--active-${shadeVal})`);
            }
        });
    }
    // 15. Declarative Recipe System
    if (data.recipe) {
        applyRecipe(doc, data.recipe);
    }
}
export const RECIPES = {
  "one-page-lead": ["header", "hero", "pains", "services", "reviews", "quote", "footer"],
  "full-landing": ["header", "hero", "logostrip", "pains", "services", "about", "solutions", "trust", "reviews", "quote", "faq", "promo", "contact", "cta", "footer"],
  "claims-subpage": ["header", "solutions", "quote", "contact", "footer"]
};
export function applyRecipe(canvasDoc, recipeKey = "full-landing") {
  const activeSet = new Set(Array.isArray(recipeKey) ? recipeKey : (RECIPES[recipeKey] || RECIPES["full-landing"]));
  canvasDoc.querySelectorAll("header[id], section[id], footer[id]").forEach(el => {
    el.hidden = !activeSet.has(el.id);
  });
}
const SUB_RECIPE = ["header", "hero", "service-detail", "solutions", "trust", "quote", "contact", "footer"];
const MIN_RECIPE = ["header", "hero", "footer"];
export const ROUTES = {
  home: { tier: "full", kicker: "Step Into The Green", title: "Experience the Future of Mobility", desc: "Advanced technology meets stunning design. Premium automotive experience awaits you.", recipe: RECIPES["full-landing"], crumbs: ["Home"] },
  "collision-repair": { tier: "sub", kicker: "OEM Certified Repair", title: "Collision Repair", desc: "Frame and body restored to factory specs after any accident.", recipe: SUB_RECIPE, crumbs: ["Home", "Services", "Collision Repair"], badge: "OEM CERTIFIED", copy: "Complete structural repair using factory-certified alignment jigs, OEM panel replacements, and precision tolerance measurement.", points: ["Computerized laser chassis realignment", "Original OEM structural replacement panels", "Lifetime factory collision warranty certificate"], img: "./media/showcase/bodywork-door-repair.jpg" },
  "paint-refinishing": { tier: "sub", kicker: "Precision Color Match", title: "Paint & Refinishing", desc: "Computer colour matching and a showroom finish.", recipe: SUB_RECIPE, crumbs: ["Home", "Services", "Paint & Refinishing"], badge: "GLASURIT 100 LINE", copy: "Spectrophotometer computer color matching with downdraft climate-controlled spray booths ensuring factory sheen, depth, and UV durability.", points: ["Digital spectrophotometer color calibration", "Heated downdraft spray & baking booth", "Multi-stage clearcoat with lifetime gloss guarantee"], img: "./media/hero/hero-beast-mode-01.jpg" },
  "dent-removal": { tier: "sub", kicker: "PDR Specialists", title: "Dent Removal", desc: "Paintless repair for hail damage and parking dents.", recipe: SUB_RECIPE, crumbs: ["Home", "Services", "Dent Removal"], badge: "PDR MASTER CERTIFIED", copy: "Non-invasive paintless dent repair (PDR) gently massaging metal back into shape without compromising original factory clearcoat or paint layers.", points: ["Zero filler or repainting required", "Preserves factory warranty and vehicle resale value", "Same-day turnaround for hail and door dings"], img: "./media/showcase/workshop-bay.jpg" },
  "insurance-claims": { tier: "sub", kicker: "Direct Billing", title: "Insurance Claims", desc: "We handle the paperwork directly with your insurer.", recipe: SUB_RECIPE, crumbs: ["Home", "Services", "Insurance Claims"], badge: "DIRECT BILLING PARTNER", copy: "Comprehensive claim management directly with all major insurance providers. We handle damage appraisal, adjuster negotiations, and direct billing.", points: ["Direct billing with zero upfront cost on covered claims", "Official computerized damage appraisal report", "Dedicated claims manager from filing to car pickup"], img: "./media/showcase/service-authorization.jpg" },
  "towing": { tier: "sub", kicker: "24/7 Roadside Assistance", title: "24/7 Towing", desc: "Roadside pickup and transport to our workshop.", recipe: SUB_RECIPE, crumbs: ["Home", "Services", "24/7 Towing"], badge: "24/7 RAPID DISPATCH", copy: "Immediate emergency recovery and flatbed transport throughout Milan and surrounding provinces directly into our secure facility.", points: ["Flatbed transport preventing AWD & EV drivetrain wear", "Under 35-minute average urban arrival window", "Immediate courtesy vehicle dispatch on scene"], img: "./media/hero/highway-suv.jpg" },
  "windshield-glass": { tier: "sub", kicker: "ADAS Calibration", title: "Windshield & Glass", desc: "Chip repair and full windshield replacement.", recipe: SUB_RECIPE, crumbs: ["Home", "Services", "Windshield & Glass"], badge: "ADAS CERTIFIED", copy: "Stone chip resin repairs and OEM windshield replacements coupled with optical recalibration for lane departure and emergency braking cameras.", points: ["OEM acoustic and solar reflective glass replacement", "Digital ADAS camera & radar sensor recalibration", "Direct insurance glass coverage with no deductible"], img: "./media/hero/driver-cockpit.jpg" },
  "frame-suspension": { tier: "sub", kicker: "Laser Realignment", title: "Frame & Suspension", desc: "Alignment checks after impacts and potholes.", recipe: SUB_RECIPE, crumbs: ["Home", "Services", "Frame & Suspension"], badge: "LASER GEOMETRY", copy: "Millimeter-accurate 3D laser chassis alignment and suspension diagnostic load testing to ensure precise steering response and high-speed stability.", points: ["3D laser chassis bench measurement", "Subframe, control arm & strut replacement", "4-wheel laser alignment printout report"], img: "./media/hero/ev-lift-diagnostic.jpg" },
  "courtesy-car": { tier: "sub", kicker: "Zero Downtime", title: "Courtesy Car", desc: "Keep moving while we repair your vehicle.", recipe: SUB_RECIPE, crumbs: ["Home", "Services", "Courtesy Car"], badge: "FREE LOANER FLEET", copy: "Modern, fully insured replacement cars provided free of charge during the repair window so your daily routine remains completely uninterrupted.", points: ["Modern automatic, hybrid, and electric vehicle options", "Comprehensive insurance coverage with zero deductible", "Immediate vehicle handoff upon shop drop-off"], img: "./media/hero/hero-1.jpg" },
  "battery-electrics": { tier: "sub", kicker: "High-Voltage Diagnostics", title: "Battery & Electrics", desc: "Testing, replacement and electrical repairs.", recipe: SUB_RECIPE, crumbs: ["Home", "Services", "Battery & Electrics"], badge: "HIGH-VOLTAGE CERTIFIED", copy: "Certified technicians trained in high-voltage EV and hybrid battery safety protocols, wiring repairs, inverter testing, and computer diagnostics.", points: ["High-voltage battery isolation and module diagnosis", "OEM computer system scanning and clearing", "Charging port, BMS and wiring harness repair"], img: "./media/hero/diagnostic-scanner.jpg" },
  "wheels-tyres": { tier: "sub", kicker: "Wheel Precision", title: "Wheels & Tyres", desc: "Rim repair, tyre fitting and balancing.", recipe: SUB_RECIPE, crumbs: ["Home", "Services", "Wheels & Tyres"], badge: "HUNTER ROAD FORCE", copy: "Alloy rim diamond cutting, kerb rash restoration, CNC rim straightening, and dynamic road-force laser balancing for vibration-free driving.", points: ["CNC diamond-cut alloy rim cosmetic refurbishment", "Hydraulic rim straightening for pothole bends", "Premium tyre replacement and dynamic road-force balancing"], img: "./media/ai-images/tyres.jpg" },
  privacy: { tier: "minimal", kicker: "Compliance & GDPR", title: "Privacy Policy", desc: "Transparent terms regarding customer data processing and rights.", recipe: MIN_RECIPE, crumbs: ["Home", "Legal", "Privacy"] },
  warranty: { tier: "minimal", kicker: "Lifetime Coverage", title: "Lifetime Repair Warranty", desc: "Our workmanship and paint refinishing are backed by a lifetime guarantee.", recipe: MIN_RECIPE, crumbs: ["Home", "Legal", "Warranty"] },
  cookies: { tier: "minimal", kicker: "Cookie Preferences", title: "Cookie Policy", desc: "Information on cookies and local storage utilized for site functionality.", recipe: MIN_RECIPE, crumbs: ["Home", "Legal", "Cookies"] }
};
export function populateServiceDetail(doc, route) {
  const svc = doc?.getElementById("service-detail");
  if (!svc) return;
  if (route.tier === "sub" && route.copy) {
    svc.hidden = false;
    const img = doc.getElementById("svc-detail-img");
    if (img && route.img) { img.src = route.img; img.alt = route.title || "Service Detail"; }
    const badge = doc.getElementById("svc-detail-badge");
    if (badge) badge.textContent = route.badge || "OEM CERTIFIED";
    const kicker = doc.getElementById("svc-detail-kicker");
    if (kicker) kicker.textContent = route.kicker || "SERVICE SPEC";
    const title = doc.getElementById("svc-detail-title");
    if (title) title.textContent = route.title || "";
    const copy = doc.getElementById("svc-detail-copy");
    if (copy) copy.textContent = route.copy || "";
    const points = doc.getElementById("svc-detail-points");
    if (points && route.points) {
      points.innerHTML = route.points.map(p => `<li class="flex items-center gap-2"><svg class="w-4 h-4 text-primary shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg><span>${p}</span></li>`).join("");
    }
  } else {
    svc.hidden = true;
  }
}
