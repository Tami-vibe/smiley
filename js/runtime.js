import { MS, sectorIcon, railIcons, setAutoBodyIcons } from './sector-icons.js';
import { readSiteData, writeSiteData, onSiteDataChange, applyStateToDocument, createDeferredWrite } from './storage.js';

/* =========================================================
   PANDINO RUNTIME: DECLARATIVE DATA-MAPPER ENGINE (DAISYUI 5)
   Zero procedural createElement/innerHTML DOM generators.
   Direct attribute and reactive state mapping over static slots.
   Isolated Canvas Context & Semantic DaisyUI Controls.
   ========================================================= */

// --- 1. Section Identifiers and Aliases ---
export const ID_ALIASES = {
    repairs: 'solutions',
    trust: 'trust-bar',
    'final-cta': 'cta',
    cookie: 'cookieBanner'
};

export function getCanvasDocument() {
    const frame = document.getElementById('templateCanvasFrame') || document.querySelector('.kit-canvas-frame iframe');
    if (frame) {
        try {
            const doc = frame.contentDocument || frame.contentWindow?.document;
            if (doc && doc.body) return doc;
        } catch (e) {
            // cross-origin or sandbox fallback
        }
    }
    return document;
}

export function getCanvasTargets() {
    const frame = document.getElementById('templateCanvasFrame') || document.querySelector('.kit-canvas-frame iframe');
    if (frame) {
        try {
            const doc = frame.contentDocument || frame.contentWindow?.document;
            if (doc && doc.documentElement) return [doc.documentElement];
        } catch (e) {}
        return [];
    }
    return [document.documentElement];
}

export function getCanvasBodyTargets() {
    const frame = document.getElementById('templateCanvasFrame') || document.querySelector('.kit-canvas-frame iframe');
    if (frame) {
        try {
            const doc = frame.contentDocument || frame.contentWindow?.document;
            if (doc && doc.body) return [doc.body];
        } catch (e) {}
        return [];
    }
    return [document.body];
}

let lastCanvasHeight = 0;
export function syncCanvasHeight() {
    const frame = document.getElementById('templateCanvasFrame') || document.querySelector('.kit-canvas-frame iframe');
    if (!frame) return;
    try {
        const doc = frame.contentDocument || frame.contentWindow?.document;
        if (doc && doc.body) {
            const h = Math.max(doc.body.scrollHeight, doc.documentElement.scrollHeight, 700);
            if (Math.abs(h - lastCanvasHeight) > 15 && h < 25000) {
                lastCanvasHeight = h;
                frame.style.height = `${h}px`;
            }
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
    if (!id) return '';
    const map = {
        solutions: 'repairs',
        'trust-bar': 'trust',
        cta: 'final-cta',
        cookieBanner: 'cookie'
    };
    return map[id] || id;
}

export const SEC_NAMES = {
    header: 'Header',
    hero: 'Hero',
    services: 'Services',
    repairs: 'Solutions',
    about: 'About',
    trust: 'Trust',
    reviews: 'Reviews',
    quote: 'Quote',
    faq: 'FAQ',
    promo: 'Promo',
    contact: 'Contact',
    'final-cta': 'Call to Action',
    footer: 'Footer',
    cookie: 'Cookie Banner'
};

export function heroSections() {
    const doc = getCanvasDocument();
    return [...doc.querySelectorAll('main.heroes-container > .hero')];
}

// --- 2. Color System & OKLCH Ramp Generator ---
function hexToRgb(hex) {
    const m = /^#?([0-9a-f]{6})$/i.exec(String(hex).trim());
    if (!m) return null;
    const n = parseInt(m[1], 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function rgbToOklch(r, g, b) {
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

function oklchToHex(L, C, H) {
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

const SHADE_STEPS = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];
const L_T = { 50: 0.976, 100: 0.947, 200: 0.899, 300: 0.832, 400: 0.742, 500: 0.670, 600: 0.587, 700: 0.511, 800: 0.433, 900: 0.377, 950: 0.257 };
const C_T = { 50: 0.015, 100: 0.036, 200: 0.069, 300: 0.110, 400: 0.151, 500: 0.175, 600: 0.177, 700: 0.163, 800: 0.136, 900: 0.112, 950: 0.077 };

function rampFromHex(hex) {
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

export function applyBrandPalette(hex) {
    if (!hex) return;
    const ramp = rampFromHex(hex);
    if (!ramp) return;
    const targets = getCanvasTargets();

    // Relative luminance calculation for intelligent text contrast
    const rgb = hexToRgb(hex);
    let contrastFg = '#ffffff';
    if (rgb) {
        const lum = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
        contrastFg = lum > 0.62 ? '#17191c' : '#ffffff';
    }

    targets.forEach(root => {
        SHADE_STEPS.forEach(step => {
            if (ramp[step]) {
                root.style.setProperty(`--active-${step}`, ramp[step]);
                root.style.setProperty(`--primary-${step}`, ramp[step]);
            }
        });
        const p500 = ramp['500'] || hex;
        root.style.setProperty('--color-primary', p500);
        root.style.setProperty('--primary-color', p500);
        root.style.setProperty('--active-500', p500);
        root.style.setProperty('--p', p500);
        root.style.setProperty('--pill-accent', p500);
        root.style.setProperty('--tone-mid', ramp['700'] || p500);
        root.style.setProperty('--brand-ink', hex);
        root.style.setProperty('--brand-contrast-fg', contrastFg);
        root.style.setProperty('--color-primary-content', contrastFg);
    });

    state.brandColor = hex;
    try { writeSiteData(state); } catch (e) {}

    // Update Brand Shade Swatch in UI
    const bshadeSwatch = document.getElementById('bshadeSwatch');
    if (bshadeSwatch) {
        bshadeSwatch.style.background = hex;
        bshadeSwatch.style.color = contrastFg;
    }
    const bshadeHex = document.getElementById('bshadeHex');
    if (bshadeHex) bshadeHex.textContent = hex;
    const bshadeContrast = document.getElementById('bshadeContrast');
    if (bshadeContrast) bshadeContrast.textContent = contrastFg === '#ffffff' ? 'White text' : 'Dark text';
}

export function applyColorScheme(scheme) {
    if (!scheme) return;
    state.scheme = scheme;
    try { writeSiteData(state); } catch (e) {}
    const roots = getCanvasTargets();
    const bodies = getCanvasBodyTargets();

    const isLight = (scheme === 'white');
    const themeName = isLight ? 'light' : 'dark';

    roots.forEach(r => {
        r.setAttribute('data-scheme', scheme);
        r.setAttribute('data-theme', themeName);
    });

    bodies.forEach(b => {
        if (!b) return;
        b.classList.remove('scheme-white', 'scheme-dark', 'scheme-brand');
        b.classList.add(`scheme-${scheme}`);
        b.setAttribute('data-theme', themeName);
    });

    const canvasFrame = document.querySelector('.kit-canvas-frame');
    if (canvasFrame) {
        canvasFrame.setAttribute('data-theme', themeName);
    }

    document.querySelectorAll('[data-scheme]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.scheme === scheme);
    });
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
    const targets = getCanvasTargets();
    targets.forEach(root => {
        root.style.setProperty('--headline-font', fonts.headline);
        root.style.setProperty('--body-font', fonts.body);
    });

    const sel = document.getElementById('typographySelect');
    if (sel && sel.value !== tier) sel.value = tier;
    document.querySelectorAll('[data-tier]').forEach(b => {
        const active = b.dataset.tier === tier;
        b.classList.toggle('active', active);
        b.classList.toggle('btn-primary', active);
        b.setAttribute('aria-pressed', String(active));
    });

    state.typographyTier = tier;
    try { writeSiteData(state); } catch (e) {}
}

// --- 4. Reactive State Model ---
const state = {
    heroIndex: 0,
    headerStyle: 'standard',
    headerAlign: 'left',
    headerSticky: false,
    reviews: 'white',
    ctas: 2,
    panel: 'bottom',
    panelStyle: 'solid',
    brandColor: '#16a34a',
    theme: 'dark',
    painsLook: 'a',
    painsAlign: 'center',
    accountName: '',
    accountEmail: ''
};

let isSyncing = false;
export function safeWriteSiteData() {
    if (isSyncing) return;
    try {
        writeSiteData(state);
    } catch (e) {}
}

// --- 5. Hero Data-Mapper ---
const LAYOUT_HINTS = {
    0: 'Best for a short, direct offer.',
    1: 'Best for a strong photo or video.',
    2: 'Best for a short, direct offer.',
    3: 'Best when the work itself sells.',
    4: 'Best for a short, direct offer.',
    5: 'Best when the work itself sells.'
};

export function setHeroIndex(idx) {
    const heroes = heroSections();
    if (!heroes.length) return;
    idx = Math.max(0, Math.min(idx, heroes.length - 1));
    state.heroIndex = idx;
    safeWriteSiteData();

    heroes.forEach((hero, i) => {
        const on = i === idx;
        hero.classList.toggle('is-live-hero', on);
        hero.hidden = !on;
        if (on) {
            hero.id = 'hero';
            // Sync live headline to promise input
            const promiseInput = document.getElementById('hero-promise');
            const h1 = hero.querySelector('.hero-content h1');
            if (promiseInput && h1 && !promiseInput.value) {
                promiseInput.value = h1.textContent.trim();
            }
        } else if (hero.id === 'hero') {
            hero.removeAttribute('id');
        }
    });

    // Update layout buttons
    document.querySelectorAll('[data-hmhero]').forEach(b => {
        const on = Number(b.dataset.hmhero) === idx;
        b.classList.toggle('active', on);
        b.classList.toggle('btn-primary', on);
        b.setAttribute('aria-checked', String(on));
        b.closest('.pit-look')?.classList.toggle('is-selected', on);
    });

    const hint = document.getElementById('hero-layout-hint');
    if (hint) hint.textContent = LAYOUT_HINTS[idx] || '';

    // Update layout showroom buttons if present
    document.querySelectorAll('[data-layout]').forEach(b => {
        b.classList.toggle('active', Number(b.dataset.layout) === idx);
    });

    syncCanvasHeight();
}

export function applyReviews(style) {
    state.reviews = style;
    try { writeSiteData(state); } catch (e) {}
    getCanvasBodyTargets().forEach(b => {
        if (!b) return;
        b.classList.toggle('reviews-on', style !== 'off');
        b.classList.toggle('reviews-white', style === 'white');
        b.classList.toggle('reviews-black', style === 'black');
    });
    document.querySelectorAll('[data-rev]').forEach(b => {
        const on = b.dataset.rev === style;
        b.classList.toggle('active', on);
        b.classList.toggle('btn-primary', on);
    });
}

export function applyHeroPanel(pos) {
    state.panel = pos;
    try { writeSiteData(state); } catch (e) {}
    const canvasBodies = getCanvasBodyTargets();
    ['off', 'bottom', 'left', 'right'].forEach(v => {
        canvasBodies.forEach(b => b.classList.toggle('panel-' + v, pos === v));
    });
    document.querySelectorAll('[data-panel]').forEach(b => {
        const on = b.dataset.panel === pos;
        b.classList.toggle('active', on);
        b.classList.toggle('btn-primary', on);
    });
    const doc = getCanvasDocument();
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
    syncCanvasHeight();
}

export function applyHeroPanelStyle(style) {
    state.panelStyle = style;
    try { writeSiteData(state); } catch (e) {}
    getCanvasBodyTargets().forEach(b => {
        if (!b) return;
        b.classList.toggle('panel-solid', style === 'solid');
        b.classList.toggle('panel-outline', style === 'outline');
    });
    document.querySelectorAll('[data-pstyle]').forEach(b => {
        const on = b.dataset.pstyle === style;
        b.classList.toggle('active', on);
        b.classList.toggle('btn-primary', on);
    });
}

export function applyCtaCount(count) {
    state.ctas = count;
    try { writeSiteData(state); } catch (e) {}
    heroSections().forEach(hero => {
        const primary = hero.querySelector('.cta-primary:not(.cta-second)');
        const second = hero.querySelector('.cta-second');
        if (primary) primary.style.display = count >= 1 ? '' : 'none';
        if (second) second.style.display = count >= 2 ? '' : 'none';
    });
    document.querySelectorAll('[data-ctacount]').forEach(b => {
        const on = Number(b.dataset.ctacount) === count;
        b.classList.toggle('active', on);
        b.classList.toggle('btn-primary', on);
    });
    if (state.painsCtas === undefined) {
        applyPainsCtaCount(count, false);
    }
    syncCanvasHeight();
}

export function applyPainsCtaCount(count, persist = true) {
    state.painsCtas = count;
    if (persist) { try { writeSiteData(state); } catch (e) {} }
    const doc = getCanvasDocument();
    const pains = doc?.getElementById('pains') || doc?.querySelector('.ks-pains');
    if (pains) {
        const ctas = pains.querySelector('.pains-ctas');
        const primary = pains.querySelector('.pains-cta-primary, .cta-primary:not(.cta-second)');
        const second = pains.querySelector('.pains-cta-second, .cta-second');
        if (ctas) {
            ctas.style.display = count > 0 ? 'flex' : 'none';
            ctas.setAttribute('data-pains-ctas', String(count));
        }
        if (primary) primary.style.display = count >= 1 ? '' : 'none';
        if (second) second.style.display = count >= 2 ? '' : 'none';
    }
    document.querySelectorAll('[data-pains-ctacount]').forEach(b => {
        const on = Number(b.dataset.painsCtacount) === count;
        b.classList.toggle('active', on);
        b.classList.toggle('btn-primary', on);
    });
    syncCanvasHeight();
}

// --- 6. Navigation & Header Data-Mapper ---
export function setHeaderSticky(sticky) {
    state.headerSticky = !!sticky;
    try { writeSiteData(state); } catch (e) {}
    getCanvasBodyTargets().forEach(b => {
        if (!b) return;
        b.classList.toggle('is-sticky-header', state.headerSticky);
        b.dataset.stickyHeader = String(state.headerSticky);
    });
    document.querySelectorAll('[data-prop="headerSticky"] button, [data-opt="sticky"]').forEach(b => {
        if (b.type === 'checkbox') {
            b.checked = state.headerSticky;
        } else {
            b.classList.toggle('active', (b.dataset.val === 'on') === state.headerSticky);
        }
    });
}

export function setHeaderStyle(style) {
    state.headerStyle = style;
    try { writeSiteData(state); } catch (e) {}
    const doc = getCanvasDocument();
    [doc, document].forEach(d => {
        d.querySelectorAll('.site-header').forEach(h => {
            h.setAttribute('data-type', style);
        });
    });
    document.querySelectorAll('[data-prop="headerStyle"] button, [data-opt="type"]').forEach(b => {
        b.classList.toggle('active', (b.dataset.val || b.dataset.opt) === style);
    });
}

export function scrollToCanvasSection(secId) {
    if (!secId) return;
    const doc = getCanvasDocument();
    const alias = ID_ALIASES[secId];
    const target = doc.getElementById(secId) || (alias ? doc.getElementById(alias) : null);
    if (!target) return;

    if (target.hidden) {
        target.hidden = false;
        syncCanvasHeight();
    }

    // Highlight target section inside canvas
    try {
        doc.querySelectorAll('.is-canvas-selected').forEach(el => el.classList.remove('is-canvas-selected'));
        target.classList.add('is-canvas-selected');
    } catch (e) {}

    const scroller = document.querySelector('.kit-canvas-scroll');
    const frame = document.getElementById('templateCanvasFrame') || document.querySelector('.kit-canvas-frame iframe');
    
    if (scroller && frame) {
        const scrollerRect = scroller.getBoundingClientRect();
        const frameRect = frame.getBoundingClientRect();
        const frameTop = frameRect.top - scrollerRect.top + scroller.scrollTop;
        const targetTopInFrame = target.getBoundingClientRect().top + (doc.defaultView?.scrollY || doc.documentElement.scrollTop || 0);
        const targetScroll = frameTop + targetTopInFrame - 24;
        scroller.scrollTo({
            top: Math.max(0, targetScroll),
            behavior: 'smooth'
        });
    } else {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// --- 7. Inspector Tabs & In-Place Accordion Data-Mapper ---
export function activateTab(tabId, opts = {}) {
    if (!tabId) return;
    let cleanId = String(tabId).replace(/^(tab-|rail-|acc-)/, '').toLowerCase();
    
    // Normalization mapping
    const sectionMap = {
        'type': 'typography',
        'font': 'typography',
        'fonts': 'typography',
        'color': 'colors',
        'colours': 'colors',
        'brand': 'colors',
        'repairs': 'solutions',
        'trust-bar': 'trust',
        'final-cta': 'cta',
        'cta-final': 'cta'
    };
    if (sectionMap[cleanId]) cleanId = sectionMap[cleanId];

    // Find the accordion element in left sidebar
    const targetAcc = document.getElementById('acc-' + cleanId) || 
                      document.querySelector(`.more-row[data-sec="${cleanId}"]`) ||
                      document.getElementById(tabId);

    if (targetAcc) {
        // Open parent bucket if enclosed
        const bucket = targetAcc.closest('.kit-bucket');
        if (bucket) bucket.open = true;

        // Open target accordion if it's a details element
        if (targetAcc.tagName.toLowerCase() === 'details') {
            targetAcc.open = true;
        }

        // Smooth scroll to the target controls inside left sidebar
        targetAcc.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // Highlight ring animation to visually guide user
        targetAcc.classList.add('ring-2', 'ring-primary');
        setTimeout(() => targetAcc.classList.remove('ring-2', 'ring-primary'), 1400);
    }

    // Set active states on buttons/tabs
    document.querySelectorAll('.cfg-tab').forEach(t => {
        const tid = t.id.replace(/^(tab-|rail-)/, '');
        const on = (t.id === tabId || tid === cleanId || t.dataset.sec === cleanId);
        t.classList.toggle('is-active', on);
        t.setAttribute('aria-selected', String(on));
    });

    // Scroll canvas to target section if not initiated from canvas click
    if (!opts.fromCanvas) {
        let canvasTarget = cleanId;
        if (['header', 'colors', 'typography'].includes(cleanId)) {
            canvasTarget = cleanId === 'header' ? 'header' : 'hero';
        }
        scrollToCanvasSection(canvasTarget);
    }
}

// --- 8. Event Listener Initializations ---
function initHeroListeners() {
    // Layout switcher
    document.querySelectorAll('[data-hmhero]').forEach(b => {
        b.addEventListener('click', () => setHeroIndex(Number(b.dataset.hmhero)));
    });

    // Headline input live mapping
    const promise = document.getElementById('hero-promise');
    if (promise) {
        const deferredHeroPromise = createDeferredWrite(() => {
            state.heroPromise = promise.value;
            try { writeSiteData(state); } catch (e) {}
        }, 150);
        promise.addEventListener('input', e => {
            const val = e.target.value;
            const doc = getCanvasDocument();
            const hero = doc.querySelector('main.heroes-container > .hero.is-live-hero') || doc.querySelector('main.heroes-container > .hero');
            const h1 = hero?.querySelector('.hero-content h1');
            if (h1) h1.textContent = val;
            state.heroPromise = val;
            deferredHeroPromise();
        });
    }

    // Reviews buttons
    document.querySelectorAll('[data-rev]').forEach(b => {
        b.addEventListener('click', () => applyReviews(b.dataset.rev));
    });

    // Alignment buttons
    document.querySelectorAll('[data-halign]').forEach(b => {
        b.addEventListener('click', () => {
            const align = b.dataset.halign;
            state.halign = align;
            try { writeSiteData(state); } catch (e) {}
            const canvasBodies = getCanvasBodyTargets();
            ['left', 'center', 'right'].forEach(a => {
                canvasBodies.forEach(b => b.classList.toggle('hero-halign-' + a, a === align));
            });
            document.querySelectorAll('[data-halign]').forEach(btn => btn.classList.toggle('active', btn === b));
        });
    });

    // CTA buttons count
    document.querySelectorAll('[data-ctacount]').forEach(b => {
        b.addEventListener('click', () => applyCtaCount(Number(b.dataset.ctacount)));
    });

    // Pains & Problems CTA buttons count
    document.querySelectorAll('[data-pains-ctacount]').forEach(b => {
        b.addEventListener('click', () => applyPainsCtaCount(Number(b.dataset.painsCtacount)));
    });

    // Panel position & style
    document.querySelectorAll('[data-panel]').forEach(b => {
        b.addEventListener('click', () => applyHeroPanel(b.dataset.panel));
    });
    document.querySelectorAll('[data-pstyle]').forEach(b => {
        b.addEventListener('click', () => applyHeroPanelStyle(b.dataset.pstyle));
    });

    // Secondary Hero Toggles
    const toggleHeroMarquee = document.getElementById('toggleHeroMarquee');
    if (toggleHeroMarquee) {
        toggleHeroMarquee.addEventListener('change', () => {
            state.heroMarquee = toggleHeroMarquee.checked;
            try { writeSiteData(state); } catch (e) {}
            const doc = getCanvasDocument();
            const ls = doc.getElementById('logostrip');
            if (ls) ls.hidden = !toggleHeroMarquee.checked;
            syncCanvasHeight();
        });
    }

    const toggleHeroReveal = document.getElementById('toggleHeroReveal');
    if (toggleHeroReveal) {
        toggleHeroReveal.addEventListener('change', () => {
            state.heroReveal = toggleHeroReveal.checked;
            try { writeSiteData(state); } catch (e) {}
            const doc = getCanvasDocument();
            doc.querySelectorAll('.hero').forEach(h => {
                h.classList.toggle('hm-reveal', toggleHeroReveal.checked);
            });
        });
    }

    const toggleHeroBlur = document.getElementById('toggleHeroBlur');
    if (toggleHeroBlur) {
        toggleHeroBlur.addEventListener('change', () => {
            state.heroBlur = toggleHeroBlur.checked;
            try { writeSiteData(state); } catch (e) {}
            const doc = getCanvasDocument();
            doc.querySelectorAll('.hero-content').forEach(hc => {
                hc.classList.toggle('backdrop-blur-md', toggleHeroBlur.checked);
            });
        });
    }

    const toggleHeroLogostrip = document.getElementById('toggleHeroLogostrip');
    if (toggleHeroLogostrip) {
        toggleHeroLogostrip.addEventListener('change', () => {
            state.heroMarquee = toggleHeroLogostrip.checked;
            try { writeSiteData(state); } catch (e) {}
            const doc = getCanvasDocument();
            const ls = doc.getElementById('logostrip');
            if (ls) ls.hidden = !toggleHeroLogostrip.checked;
            syncCanvasHeight();
        });
    }

    // Hero guide accordion (if guide triggers exist)
    document.querySelectorAll('.hero-guide-trigger').forEach(trigger => {
        trigger.addEventListener('click', () => {
            const guide = trigger.closest('.hero-guide');
            const wasActive = guide?.classList.contains('is-active');
            document.querySelectorAll('.hero-guide').forEach(g => {
                g.classList.remove('is-active');
                g.querySelector('.hero-guide-trigger')?.setAttribute('aria-expanded', 'false');
            });
            if (!wasActive && guide) {
                guide.classList.add('is-active');
                trigger.setAttribute('aria-expanded', 'true');
            }
        });
    });
}

function initDrawerAndRailListeners() {
    // Initialize explicit panel display states
    document.querySelectorAll('.cfg-panel').forEach(p => {
        p.style.display = p.hidden ? 'none' : 'flex';
    });

    // In-place section accordions toggle listener
    document.querySelectorAll('.kit-bucket details').forEach(d => {
        d.addEventListener('toggle', () => {
            if (d.open) {
                const sec = d.dataset.sec || d.id.replace(/^acc-/, '');
                if (sec) {
                    let canvasSec = sec;
                    if (['colors', 'typography'].includes(canvasSec)) canvasSec = 'hero';
                    scrollToCanvasSection(canvasSec);
                }
            }
        });
    });

    // Drawer tabs
    document.querySelectorAll('.cfg-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.stopPropagation();
            activateTab(tab.id);
        });
    });

    // Full row clickability for sidebar items (except eyes)
    document.querySelectorAll('.kit-row').forEach(row => {
        row.addEventListener('click', (e) => {
            if (e.target.closest('.kit-eye') || e.target.closest('input[type="checkbox"]')) return;
            const btn = row.querySelector('.cfg-tab');
            if (btn) activateTab(btn.id || row.dataset.sec);
        });
    });

    // Controls collapse button
    const collapseBtn = document.getElementById('cfgCollapse');
    if (collapseBtn) {
        collapseBtn.addEventListener('click', () => {
            const cfg = document.getElementById('cfg');
            const isCol = cfg?.classList.toggle('is-collapsed');
            collapseBtn.setAttribute('aria-expanded', String(!isCol));
            collapseBtn.dataset.tip = isCol ? 'Show controls' : 'Hide controls';
            collapseBtn.setAttribute('aria-label', isCol ? 'Show controls' : 'Hide controls');
            const lbl = document.getElementById('cfgCollapseLabel');
            if (lbl) {
                lbl.textContent = isCol ? 'Show' : 'Hide controls';
            }
            const ic = collapseBtn.querySelector('.material-symbols-outlined');
            if (ic) ic.textContent = isCol ? 'visibility' : 'visibility_off';
        });
    }

    // Rail toggle button
    const railToggle = document.getElementById('kitRailToggle');
    if (railToggle) {
        railToggle.addEventListener('click', () => {
            const drawer = document.getElementById('kit-drawer');
            const open = drawer?.dataset.kitRail === 'open';
            if (drawer) drawer.dataset.kitRail = open ? 'closed' : 'open';
            railToggle.setAttribute('aria-expanded', String(!open));
        });
    }

    // Section visibility toggle eyes
    document.querySelectorAll('.kit-eye').forEach(eye => {
        eye.addEventListener('click', e => {
            e.stopPropagation();
            const row = eye.closest('.kit-row');
            const secId = row?.dataset.sec;
            const targetSec = byId(secId);
            if (targetSec) {
                targetSec.hidden = !targetSec.hidden;
                const on = !targetSec.hidden;
                eye.setAttribute('aria-pressed', String(on));
                row?.classList.toggle('is-off', !on);
                const glyph = eye.querySelector('.ms');
                if (glyph) glyph.textContent = on ? 'visibility' : 'visibility_off';
                const chk = eye.querySelector('input[type="checkbox"]');
                if (chk) chk.checked = on;
                syncCanvasHeight();
            }
        });
    });

    // Theme toggle (Dark / Light)
    const themeInput = document.querySelector('#kitTheme input');
    if (themeInput) {
        themeInput.addEventListener('change', () => {
            const theme = themeInput.checked ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', theme);
            document.getElementById('kit-drawer')?.setAttribute('data-theme', theme);
            const canvasDoc = getCanvasDocument();
            if (canvasDoc && canvasDoc.documentElement) {
                canvasDoc.documentElement.setAttribute('data-theme', theme);
                if (canvasDoc.body) canvasDoc.body.setAttribute('data-theme', theme);
            }
            const canvasFrame = document.querySelector('.kit-canvas-frame');
            if (canvasFrame) canvasFrame.setAttribute('data-theme', theme);
            state.theme = theme;
            try { writeSiteData(state); } catch (e) {}
        });
    }

    // Device preview buttons
    document.querySelectorAll('[data-dev]').forEach(btn => {
        btn.addEventListener('click', () => {
            const dev = btn.dataset.dev;
            document.querySelectorAll('[data-dev]').forEach(b => {
                const on = b === btn;
                b.setAttribute('aria-pressed', String(on));
                b.classList.toggle('active', on);
            });
            const scroller = document.querySelector('.kit-canvas-scroll');
            const frame = document.querySelector('.kit-canvas-frame');
            const deviceWrapper = document.querySelector('.kit-canvas-device');
            if (scroller) scroller.dataset.device = dev;
            if (deviceWrapper) {
                deviceWrapper.dataset.device = dev;
                if (dev === 'desktop') {
                    deviceWrapper.style.maxWidth = '';
                    deviceWrapper.style.width = '100%';
                } else if (dev === 'tablet') {
                    deviceWrapper.style.maxWidth = '768px';
                    deviceWrapper.style.width = '768px';
                } else if (dev === 'phone') {
                    deviceWrapper.style.maxWidth = '390px';
                    deviceWrapper.style.width = '390px';
                }
            }
            if (frame) {
                frame.dataset.device = dev;
                if (dev === 'desktop') {
                    frame.style.maxWidth = '';
                    frame.style.width = '100%';
                } else if (dev === 'tablet') {
                    frame.style.maxWidth = '768px';
                    frame.style.width = '768px';
                } else if (dev === 'phone') {
                    frame.style.maxWidth = '390px';
                    frame.style.width = '390px';
                }
            }
            setTimeout(syncCanvasHeight, 150);
        });
    });

    // Settings modal & AccountStudio wiring
    const settingsBtn = document.getElementById('kitSettings');
    const accountView = document.getElementById('kit-account');
    if (settingsBtn && accountView) {
        // Load initial persisted values
        try {
            const rawAcct = localStorage.getItem('pandino_account');
            if (rawAcct) {
                const acct = JSON.parse(rawAcct);
                if (acct.name) state.accountName = acct.name;
                if (acct.email) state.accountEmail = acct.email;
            }
        } catch (e) {}

        const populateAccountFields = () => {
            const nameInput = document.getElementById('kitAccountName');
            const emailInput = document.getElementById('kitAccountEmail');
            const teamName = document.getElementById('kitTeamMemberName');
            const teamEmail = document.getElementById('kitTeamMemberEmail');
            if (nameInput) nameInput.value = state.accountName || '';
            if (emailInput) emailInput.value = state.accountEmail || '';
            if (teamName) teamName.textContent = state.accountName || 'Workspace Owner';
            if (teamEmail) teamEmail.textContent = state.accountEmail || 'Owner (Admin)';
        };

        populateAccountFields();

        const openSettings = () => {
            accountView.hidden = false;
            settingsBtn.setAttribute('aria-pressed', 'true');
            populateAccountFields();
            const firstInput = document.getElementById('kitAccountName');
            if (firstInput) setTimeout(() => firstInput.focus(), 100);
        };

        const closeSettings = () => {
            accountView.hidden = true;
            settingsBtn.setAttribute('aria-pressed', 'false');
            settingsBtn.focus();
        };

        settingsBtn.addEventListener('click', () => {
            if (accountView.hidden) openSettings();
            else closeSettings();
        });

        document.querySelector('.kit-account-back')?.addEventListener('click', closeSettings);

        // Escape key to exit settings view
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape' && !accountView.hidden) {
                closeSettings();
            }
        });

        // Tab Navigation
        const tabs = accountView.querySelectorAll('#kitAccountNav [data-acct-tab]');
        const panes = accountView.querySelectorAll('[data-acct-pane]');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const target = tab.dataset.acctTab;
                tabs.forEach(t => {
                    const on = t === tab;
                    t.classList.toggle('active', on);
                    t.setAttribute('aria-selected', String(on));
                });
                panes.forEach(pane => {
                    pane.hidden = pane.dataset.acctPane !== target;
                });
            });
        });

        // Account persistence function
        const persistAccount = (showToast = true) => {
            const nameInput = document.getElementById('kitAccountName');
            const emailInput = document.getElementById('kitAccountEmail');
            const name = nameInput?.value?.trim() || '';
            const email = emailInput?.value?.trim() || '';
            state.accountName = name;
            state.accountEmail = email;

            const teamName = document.getElementById('kitTeamMemberName');
            const teamEmail = document.getElementById('kitTeamMemberEmail');
            if (teamName) teamName.textContent = name || 'Workspace Owner';
            if (teamEmail) teamEmail.textContent = email || 'Owner (Admin)';

            try {
                localStorage.setItem('pandino_account', JSON.stringify({ name, email, updatedAt: Date.now() }));
                writeSiteData(state);
            } catch (e) {}

            if (showToast) {
                const toast = document.getElementById('cfgToast');
                if (toast) {
                    toast.textContent = 'Account profile updated';
                    toast.classList.remove('hidden');
                    setTimeout(() => toast.classList.add('hidden'), 2500);
                }
            }
        };

        // Explicit Save Changes button
        document.getElementById('kitAccountSave')?.addEventListener('click', () => {
            persistAccount(true);
        });

        // Auto-save on input and blur
        document.getElementById('kitAccountName')?.addEventListener('input', () => persistAccount(false));
        document.getElementById('kitAccountEmail')?.addEventListener('input', () => persistAccount(false));
    }

    // Mobile menu toggle
    const mobileClose = document.getElementById('shClose');
    const mobileMenu = document.getElementById('shMobile');
    if (mobileClose && mobileMenu) {
        mobileClose.addEventListener('click', () => {
            mobileMenu.setAttribute('aria-hidden', 'true');
        });
    }
}

function initColorListeners() {
    // Custom hex apply
    const hexInput = document.getElementById('brandHex');
    const hexPick = document.getElementById('brandHexPick');
    const hexApply = document.getElementById('brandHexApply');

    const updateFromHex = val => {
        if (!val) return;
        applyBrandPalette(val);
        state.brandColor = val;
    };

    if (hexPick) {
        hexPick.addEventListener('input', () => {
            if (hexInput) hexInput.value = hexPick.value;
            updateFromHex(hexPick.value);
        });
    }
    if (hexApply && hexInput) {
        hexApply.addEventListener('click', () => updateFromHex(hexInput.value));
    }
    if (hexInput) {
        hexInput.addEventListener('keydown', e => {
            if (e.key === 'Enter') {
                e.preventDefault();
                updateFromHex(hexInput.value);
            }
        });
    }

    // Palette strip buttons
    document.querySelectorAll('[data-color].color-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            document.querySelectorAll('[data-color].color-btn').forEach(b => {
                b.classList.remove('active', 'border-2', 'border-white', 'ring-2', 'ring-primary', 'shadow-xs');
                b.classList.add('border', 'border-white/20');
            });
            btn.classList.remove('border', 'border-white/20');
            btn.classList.add('active', 'border-2', 'border-white', 'ring-2', 'ring-primary', 'shadow-xs');
            let hex = null;
            const style = btn.getAttribute('style') || '';
            const m = style.match(/#([0-9a-fA-F]{6})/);
            if (m) {
                hex = '#' + m[1];
            } else {
                const comp = window.getComputedStyle(btn).backgroundColor;
                const rgbM = comp.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
                if (rgbM) {
                    const r = parseInt(rgbM[1], 10).toString(16).padStart(2, '0');
                    const g = parseInt(rgbM[2], 10).toString(16).padStart(2, '0');
                    const b = parseInt(rgbM[3], 10).toString(16).padStart(2, '0');
                    hex = '#' + r + g + b;
                }
            }
            if (hex) {
                applyBrandPalette(hex);
                state.brandColor = hex;
                const sumBrand = document.getElementById('sum-brand');
                if (sumBrand && btn.dataset.color) {
                    sumBrand.textContent = btn.dataset.color.charAt(0).toUpperCase() + btn.dataset.color.slice(1);
                }
            }
        });
    });

    // Scheme buttons
    document.querySelectorAll('[data-scheme]').forEach(btn => {
        btn.addEventListener('click', () => {
            applyColorScheme(btn.dataset.scheme);
        });
    });

    // Contrast Mode buttons (Adaptive / Monochrome)
    document.querySelectorAll('[data-contrast-mode]').forEach(btn => {
        btn.addEventListener('click', () => {
            const mode = btn.dataset.contrastMode;
            document.querySelectorAll('[data-contrast-mode]').forEach(b => b.classList.toggle('active', b === btn));
            getCanvasBodyTargets().forEach(b => {
                if (!b) return;
                b.setAttribute('data-contrast-mode', mode);
            });
        });
    });

    // Button Shade dropdown
    const btnShade = document.getElementById('btnShade');
    if (btnShade) {
        btnShade.addEventListener('change', () => {
            const val = btnShade.value;
            const targetColor = val === 'auto' ? 'var(--active-500)' : `var(--active-${val})`;
            getCanvasTargets().forEach(root => {
                if (!root) return;
                root.style.setProperty('--btn-bg', targetColor);
            });
        });
    }
}

function initServicesListeners() {
    // Columns dropdown
    const colsSel = document.getElementById('svcCols');
    if (colsSel) {
        colsSel.addEventListener('change', () => {
            const doc = getCanvasDocument();
            const grid = doc.querySelector('.svc-grid');
            if (grid) {
                grid.style.gridTemplateColumns = `repeat(${colsSel.value}, minmax(0, 1fr))`;
                syncCanvasHeight();
            }
        });
    }

    // Card style (fill vs outline)
    document.querySelectorAll('[data-svc="card"]').forEach(btn => {
        btn.addEventListener('click', () => {
            const style = btn.dataset.v;
            document.querySelectorAll('[data-svc="card"]').forEach(b => b.classList.toggle('active', b === btn));
            const doc = getCanvasDocument();
            doc.querySelectorAll('.svc-card').forEach(card => {
                if (style === 'outline') {
                    card.classList.add('border', 'border-base-300');
                    card.classList.remove('shadow-sm');
                } else {
                    card.classList.remove('border', 'border-base-300');
                    card.classList.add('shadow-sm');
                }
            });
        });
    });

    // Toggle icons
    const toggleIcons = document.getElementById('toggleSvcShowIcon');
    if (toggleIcons) {
        toggleIcons.addEventListener('change', () => {
            const doc = getCanvasDocument();
            doc.querySelectorAll('.svc-ic').forEach(ic => {
                ic.style.display = toggleIcons.checked ? '' : 'none';
            });
        });
    }

    // Toggle card images
    const toggleImg = document.getElementById('toggleSvcImg');
    if (toggleImg) {
        toggleImg.addEventListener('change', () => {
            const doc = getCanvasDocument();
            doc.querySelectorAll('.svc').forEach(s => {
                s.setAttribute('data-img', toggleImg.checked ? 'on' : 'off');
            });
        });
    }
}

function initHeaderListeners() {
    // Header Type (classic bar vs floating pill)
    document.querySelectorAll('[data-opt="type"]').forEach(btn => {
        btn.addEventListener('click', () => {
            setHeaderStyle(btn.dataset.val);
        });
    });

    // Bar Surface style
    document.querySelectorAll('[data-opt="style"]').forEach(btn => {
        btn.addEventListener('click', () => {
            const val = btn.dataset.val;
            state.headerSurface = val;
            try { writeSiteData(state); } catch (e) {}
            document.querySelectorAll('[data-opt="style"]').forEach(b => b.classList.toggle('active', b === btn));
            const doc = getCanvasDocument();
            doc.querySelectorAll('.site-header').forEach(h => {
                h.setAttribute('data-style', val);
            });
        });
    });

    // Links count
    document.querySelectorAll('[data-opt="count"]').forEach(btn => {
        btn.addEventListener('click', () => {
            const count = Number(btn.dataset.val);
            document.querySelectorAll('[data-opt="count"]').forEach(b => b.classList.toggle('active', b === btn));
            const doc = getCanvasDocument();
            doc.querySelectorAll('.site-header nav a, .site-header .sh-links a').forEach((a, i) => {
                a.style.display = i < count ? '' : 'none';
            });
        });
    });

    // Call to Action Buttons
    document.querySelectorAll('[data-opt="buttons"]').forEach(btn => {
        btn.addEventListener('click', () => {
            const val = btn.dataset.val;
            document.querySelectorAll('[data-opt="buttons"]').forEach(b => b.classList.toggle('active', b === btn));
            const doc = getCanvasDocument();
            doc.querySelectorAll('.site-header .sh-cta, .site-header .sh-actions').forEach(el => {
                el.style.display = val === 'none' ? 'none' : 'flex';
            });
        });
    });
}

function initTypographyListeners() {
    const sel = document.getElementById('typographySelect');
    if (sel) {
        sel.addEventListener('change', () => applyTypographyPreset(sel.value));
    }
    document.querySelectorAll('[data-tier]').forEach(btn => {
        btn.addEventListener('click', () => applyTypographyPreset(btn.dataset.tier));
    });
    const typeSave = document.getElementById('typeSave');
    if (typeSave) {
        typeSave.addEventListener('click', () => {
            const note = document.getElementById('typeNote');
            if (note) {
                note.textContent = 'Saved!';
                setTimeout(() => { note.textContent = ''; }, 2000);
            }
        });
    }
    const typeReset = document.getElementById('typeReset');
    if (typeReset) {
        typeReset.addEventListener('click', () => applyTypographyPreset('tier1'));
    }
}

function initFooterListeners() {
    const btnSave = document.getElementById('btnSave');
    const btnReset = document.getElementById('btnReset');

    if (btnSave) {
        btnSave.addEventListener('click', () => {
            const typeSel = document.getElementById('typographySelect');
            if (typeSel) state.typographyTier = typeSel.value;

            const promiseInput = document.getElementById('hero-promise');
            if (promiseInput && promiseInput.value) {
                state.heroPromise = promiseInput.value;
            }

            try {
                writeSiteData(state);
            } catch (e) {}

            const btnSaveIcon = document.getElementById('btnSaveIcon');
            const btnSaveText = document.getElementById('btnSaveText');
            const toast = document.getElementById('cfgToast');

            if (btnSaveText) btnSaveText.textContent = 'Saved!';
            if (btnSaveIcon) btnSaveIcon.textContent = 'check';
            btnSave.classList.add('btn-success');

            if (toast) {
                toast.textContent = 'Configuration saved';
                toast.classList.remove('hidden');
                setTimeout(() => toast.classList.add('hidden'), 2000);
            }

            setTimeout(() => {
                if (btnSaveText) btnSaveText.textContent = 'Save';
                if (btnSaveIcon) btnSaveIcon.textContent = 'save';
                btnSave.classList.remove('btn-success');
            }, 2000);
        });
    }

    if (btnReset) {
        btnReset.addEventListener('click', () => {
            applyTypographyPreset('tier1');
            applyBrandPalette('azure');
            applyColorScheme('brand');
            setHeroIndex(0);
            applyPainsLook('a');

            const promiseInput = document.getElementById('hero-promise');
            if (promiseInput) promiseInput.value = '';

            try {
                writeSiteData(state);
            } catch (e) {}

            syncCanvasState();

            const btnResetText = document.getElementById('btnResetText');
            const btnResetIcon = document.getElementById('btnResetIcon');
            if (btnResetText) btnResetText.textContent = 'Reset!';
            if (btnResetIcon) btnResetIcon.textContent = 'check';

            setTimeout(() => {
                if (btnResetText) btnResetText.textContent = 'Reset';
                if (btnResetIcon) btnResetIcon.textContent = 'restart_alt';
            }, 1500);
        });
    }
}

function initToggleListeners() {
    // Header Show Toggle
    const toggleHeaderShow = document.getElementById('toggleHeaderShow');
    if (toggleHeaderShow) {
        toggleHeaderShow.addEventListener('change', () => {
            const doc = getCanvasDocument();
            doc.querySelectorAll('.site-header, #header').forEach(h => {
                h.hidden = !toggleHeaderShow.checked;
            });
            syncCanvasHeight();
        });
    }

    // Header Sticky Toggle
    const toggleHeaderSticky = document.getElementById('toggleHeaderSticky');
    if (toggleHeaderSticky) {
        toggleHeaderSticky.addEventListener('change', () => {
            setHeaderSticky(toggleHeaderSticky.checked);
        });
    }

    // Go to buttons in #panel-more
    document.querySelectorAll('.more-row .more-go').forEach(btn => {
        btn.addEventListener('click', () => {
            const row = btn.closest('.more-row');
            const secId = row?.dataset.sec;
            if (secId) scrollToCanvasSection(secId);
        });
    });

    // Section Visibility Toggles in #panel-more
    document.querySelectorAll('.more-row [data-more="show"]').forEach(toggle => {
        toggle.addEventListener('change', () => {
            const row = toggle.closest('.more-row');
            const secId = row?.dataset.sec;
            const targetSec = byId(secId);
            if (targetSec) {
                targetSec.hidden = !toggle.checked;
                // Sync eye in left rail
                const eye = document.querySelector(`.kit-row[data-sec="${secId}"] .kit-eye input`);
                if (eye) eye.checked = toggle.checked;
                syncCanvasHeight();
            }
        });
    });

    // Section scheme selector in #panel-more
    document.querySelectorAll('.more-row [data-more="scheme"]').forEach(btn => {
        btn.addEventListener('click', () => {
            const row = btn.closest('.more-row');
            const scheme = btn.dataset.v;
            row?.querySelectorAll('[data-more="scheme"]').forEach(b => b.classList.toggle('active', b === btn));
            const secId = row?.dataset.sec;
            const targetSec = byId(secId);
            if (targetSec) {
                targetSec.setAttribute('data-scheme', scheme);
                if (scheme === 'brand') {
                    targetSec.style.backgroundColor = 'var(--active-950, #0f172a)';
                    targetSec.style.color = '#ffffff';
                } else if (scheme === 'white') {
                    targetSec.style.backgroundColor = '#ffffff';
                    targetSec.style.color = '#17191c';
                } else if (scheme === 'dark') {
                    targetSec.style.backgroundColor = '#17191c';
                    targetSec.style.color = '#ffffff';
                } else {
                    targetSec.style.backgroundColor = '';
                    targetSec.style.color = '';
                }
            }
        });
    });

    // Section shade selector
    document.querySelectorAll('.more-row select.more-shade').forEach(sel => {
        sel.addEventListener('change', () => {
            const row = sel.closest('.more-row');
            const secId = row?.dataset.sec;
            if (!state.sectionShades) state.sectionShades = {};
            if (secId) {
                state.sectionShades[secId] = sel.value;
                try { writeSiteData(state); } catch (e) {}
            }
            const targetSec = byId(secId);
            if (targetSec) {
                targetSec.style.setProperty('--sec-shade', `var(--active-${sel.value})`);
            }
        });
    });

    // Customer Pains layout selector (3 Cards vs Split Comparison)
    document.querySelectorAll('#painsLayoutJoin [data-pains-look]').forEach(btn => {
        btn.addEventListener('click', () => {
            applyPainsLook(btn.dataset.painsLook);
        });
    });

    // Customer Pains card content alignment selector (Left, Center, Right)
    document.querySelectorAll('#painsAlignJoin [data-pains-align]').forEach(btn => {
        btn.addEventListener('click', () => {
            applyPainsAlignment(btn.dataset.painsAlign);
        });
    });
}

// --- 8b. Customer Pains Layout Switcher ---
export function applyPainsLook(look = 'a') {
    const targetLook = look === 'b' ? 'b' : 'a';
    state.painsLook = targetLook;
    
    const frame = document.getElementById('templateCanvasFrame') || document.querySelector('.kit-canvas-frame iframe');
    const doc = frame?.contentDocument || frame?.contentWindow?.document;
    const pains = doc?.getElementById('pains') || doc?.querySelector('.ks-pains') || byId('pains');
    if (pains) {
        pains.setAttribute('data-look', targetLook);
    }
    
    document.querySelectorAll('#painsLayoutJoin [data-pains-look]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.painsLook === targetLook);
    });
    
    const badge = document.getElementById('painsBadge');
    if (badge) {
        badge.textContent = targetLook === 'b' ? 'Split' : '3 Cards';
    }
    
    try {
        writeSiteData(state);
    } catch (e) {}
    syncCanvasHeight();
}

// --- 8c. Customer Pains Card Content Alignment ---
export function applyPainsAlignment(align = 'center', persist = true) {
    const valid = ['left', 'center', 'right'].includes(align) ? align : 'center';
    state.painsAlign = valid;

    const frame = document.getElementById('templateCanvasFrame') || document.querySelector('.kit-canvas-frame iframe');
    const doc = frame?.contentDocument || frame?.contentWindow?.document;
    const pains = doc?.getElementById('pains') || doc?.querySelector('.ks-pains') || byId('pains');
    if (pains) {
        pains.setAttribute('data-card-align', valid);
        pains.classList.remove('pains-align-left', 'pains-align-center', 'pains-align-right');
        pains.classList.add(`pains-align-${valid}`);
    }

    document.querySelectorAll('#painsAlignJoin [data-pains-align]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.painsAlign === valid);
    });

    if (persist) {
        try {
            writeSiteData(state);
        } catch (e) {}
    }
}

// --- 8c. Synchronize Canvas Layer Labels with Schema/Headings ---
export function syncCanvasLayerLabels() {
    const frame = document.getElementById('templateCanvasFrame') || document.querySelector('.kit-canvas-frame iframe');
    const doc = frame?.contentDocument || frame?.contentWindow?.document;
    if (!doc) return;

    const sectionMap = {
        'trust-bar': 'trust',
        'final-cta': 'cta',
        'cta-final': 'cta',
        'repairs': 'solutions'
    };

    doc.querySelectorAll('section[id], header[id], footer[id]').forEach(sec => {
        let secId = sec.id;
        if (!secId) return;
        const cleanId = sectionMap[secId] || secId;

        // Extract editorial title from schema / heading
        const heading = sec.querySelector('[id$="-title"], h2, h1, h3, .sec-title');
        const titleText = heading?.textContent?.trim();
        if (!titleText) return;

        // Update matching sidebar layer node
        const sidebarNode = document.getElementById('acc-' + cleanId) || 
                            document.getElementById('acc-' + secId) ||
                            document.querySelector(`.more-row[data-sec="${cleanId}"]`) ||
                            document.querySelector(`.more-row[data-sec="${secId}"]`);
        
        const label = sidebarNode?.querySelector('.cfg-name, span.font-bold');
        if (label) {
            label.textContent = titleText;
        }

        // Also update any matching row in panel-more
        document.querySelectorAll(`.more-row[data-sec="${cleanId}"] span.font-bold, .more-row[data-sec="${secId}"] span.font-bold`).forEach(el => {
            el.textContent = titleText;
        });
    });
}

// --- 9. Synchronize Full Canvas State ---
export function syncCanvasState() {
    isSyncing = true;
    try {
        setHeroIndex(state.heroIndex || 0);
        applyReviews(state.reviews || 'white');
        applyHeroPanel(state.panel || 'bottom');
        applyHeroPanelStyle(state.panelStyle || 'solid');
        applyCtaCount(state.ctas !== undefined ? state.ctas : 2);
        applyPainsCtaCount(state.painsCtas !== undefined ? state.painsCtas : (state.ctas !== undefined ? state.ctas : 2), false);
        if (state.brandColor) applyBrandPalette(state.brandColor);
        applyColorScheme(state.scheme || 'dark');
        if (state.theme) {
            document.documentElement.setAttribute('data-theme', state.theme);
            const canvasFrame = document.querySelector('.kit-canvas-frame');
            if (canvasFrame) canvasFrame.setAttribute('data-theme', state.theme);
            const canvasDoc = getCanvasDocument();
            if (canvasDoc && canvasDoc.documentElement) {
                canvasDoc.documentElement.setAttribute('data-theme', state.theme);
                if (canvasDoc.body) canvasDoc.body.setAttribute('data-theme', state.theme);
            }
        }
        const typePreset = state.typographyTier || document.getElementById('typographySelect')?.value || 'tier1';
        applyTypographyPreset(typePreset);
        applyPainsLook(state.painsLook || 'a');
        applyPainsAlignment(state.painsAlign || 'center', false);

        // Declarative mapping over canvas document
        const doc = getCanvasDocument();
        if (doc) {
            applyStateToDocument(doc, state);
        }

        if (state.heroPromise) {
            const promiseInput = document.getElementById('hero-promise');
            if (promiseInput && document.activeElement !== promiseInput) {
                promiseInput.value = state.heroPromise;
            }
        }

        if (state.halign) {
            const canvasBodies = getCanvasBodyTargets();
            ['left', 'center', 'right'].forEach(a => {
                canvasBodies.forEach(b => b.classList.toggle('hero-halign-' + a, a === state.halign));
            });
            document.querySelectorAll('[data-halign]').forEach(btn => btn.classList.toggle('active', btn.dataset.halign === state.halign));
        }

        if (state.headerSticky !== undefined) {
            setHeaderSticky(state.headerSticky);
        }
        if (state.headerStyle) {
            setHeaderStyle(state.headerStyle);
        }
        if (state.headerSurface) {
            if (doc) {
                doc.querySelectorAll('.site-header').forEach(h => {
                    h.setAttribute('data-style', state.headerSurface);
                });
            }
            document.querySelectorAll('[data-opt="style"]').forEach(b => b.classList.toggle('active', b.dataset.val === state.headerSurface));
        }

        if (state.heroMarquee !== undefined) {
            if (doc) {
                const ls = doc.getElementById('logostrip');
                if (ls) ls.hidden = !state.heroMarquee;
            }
            const toggleHeroMarquee = document.getElementById('toggleHeroMarquee');
            if (toggleHeroMarquee) toggleHeroMarquee.checked = !!state.heroMarquee;
            const toggleHeroLogostrip = document.getElementById('toggleHeroLogostrip');
            if (toggleHeroLogostrip) toggleHeroLogostrip.checked = !!state.heroMarquee;
        }

        if (state.heroBlur !== undefined) {
            if (doc) {
                doc.querySelectorAll('.hero-content').forEach(hc => {
                    hc.classList.toggle('backdrop-blur-md', !!state.heroBlur);
                });
            }
            const toggleHeroBlur = document.getElementById('toggleHeroBlur');
            if (toggleHeroBlur) toggleHeroBlur.checked = !!state.heroBlur;
        }

        if (state.heroReveal !== undefined) {
            if (doc) {
                doc.querySelectorAll('.hero').forEach(h => {
                    h.classList.toggle('hm-reveal', !!state.heroReveal);
                });
            }
            const toggleHeroReveal = document.getElementById('toggleHeroReveal');
            if (toggleHeroReveal) toggleHeroReveal.checked = !!state.heroReveal;
        }

        if (state.sectionShades && typeof state.sectionShades === 'object') {
            Object.entries(state.sectionShades).forEach(([secId, shadeVal]) => {
                const targetSec = byId(secId);
                if (targetSec) {
                    targetSec.style.setProperty('--sec-shade', `var(--active-${shadeVal})`);
                }
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
    // 1. Typography Controls
    const tier = state.typographyTier || 'tier1';
    const sel = document.getElementById('typographySelect');
    if (sel && sel.value !== tier) sel.value = tier;
    document.querySelectorAll('[data-tier]').forEach(b => {
        const active = b.dataset.tier === tier;
        b.classList.toggle('active', active);
        b.classList.toggle('btn-primary', active);
        b.setAttribute('aria-pressed', String(active));
    });

    // 2. Brand Color Controls
    if (state.brandColor) {
        const hex = state.brandColor.toLowerCase();
        document.querySelectorAll('[data-color].color-btn').forEach(btn => {
            const style = btn.getAttribute('style') || '';
            const m = style.match(/#([0-9a-fA-F]{6})/);
            const isMatch = m ? ('#' + m[1].toLowerCase() === hex) : false;
            btn.classList.toggle('active', isMatch);
            btn.classList.toggle('border-2', isMatch);
            btn.classList.toggle('border-white', isMatch);
            btn.classList.toggle('ring-2', isMatch);
            btn.classList.toggle('ring-primary', isMatch);
            btn.classList.toggle('shadow-xs', isMatch);
            if (isMatch) btn.classList.remove('border-white/20');
        });
        const hexInput = document.getElementById('brandHex');
        if (hexInput && document.activeElement !== hexInput) hexInput.value = state.brandColor;
        const hexPick = document.getElementById('brandHexPick');
        if (hexPick) hexPick.value = state.brandColor;
        const bshadeSwatch = document.getElementById('bshadeSwatch');
        if (bshadeSwatch) bshadeSwatch.style.background = state.brandColor;
        const bshadeHex = document.getElementById('bshadeHex');
        if (bshadeHex) bshadeHex.textContent = state.brandColor;
        const sumBrand = document.getElementById('sum-brand');
        if (sumBrand) {
            const matchingBtn = document.querySelector(`[data-color].color-btn[style*="${state.brandColor}"]`);
            if (matchingBtn && matchingBtn.dataset.color) {
                sumBrand.textContent = matchingBtn.dataset.color.charAt(0).toUpperCase() + matchingBtn.dataset.color.slice(1);
            } else {
                sumBrand.textContent = state.brandColor;
            }
        }
    }

    // 3. Scheme Controls
    if (state.scheme) {
        document.querySelectorAll('[data-scheme]').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.scheme === state.scheme);
        });
    }

    // 4. Hero Controls
    if (state.heroIndex !== undefined) {
        document.querySelectorAll('[data-hmhero]').forEach(b => {
            const on = Number(b.dataset.hmhero) === state.heroIndex;
            b.classList.toggle('active', on);
            b.classList.toggle('btn-primary', on);
            b.setAttribute('aria-checked', String(on));
            b.closest('.pit-look')?.classList.toggle('is-selected', on);
        });
        const hint = document.getElementById('hero-layout-hint');
        if (hint) hint.textContent = LAYOUT_HINTS[state.heroIndex] || '';
    }

    if (state.heroPromise) {
        const promiseInput = document.getElementById('hero-promise');
        if (promiseInput && document.activeElement !== promiseInput) {
            promiseInput.value = state.heroPromise;
        }
    }

    if (state.reviews) {
        document.querySelectorAll('[data-rev]').forEach(b => {
            const on = b.dataset.rev === state.reviews;
            b.classList.toggle('active', on);
            b.classList.toggle('btn-primary', on);
        });
    }

    if (state.halign) {
        document.querySelectorAll('[data-halign]').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.halign === state.halign);
        });
    }

    if (state.panel) {
        document.querySelectorAll('[data-panel]').forEach(b => {
            const on = b.dataset.panel === state.panel;
            b.classList.toggle('active', on);
            b.classList.toggle('btn-primary', on);
        });
    }

    if (state.panelStyle) {
        document.querySelectorAll('[data-pstyle]').forEach(b => {
            const on = b.dataset.pstyle === state.panelStyle;
            b.classList.toggle('active', on);
            b.classList.toggle('btn-primary', on);
        });
    }

    if (state.ctas !== undefined) {
        document.querySelectorAll('[data-ctacount]').forEach(b => {
            const on = Number(b.dataset.ctacount) === state.ctas;
            b.classList.toggle('active', on);
            b.classList.toggle('btn-primary', on);
        });
    }

    // 5. Header Controls
    if (state.headerStyle) {
        document.querySelectorAll('[data-prop="headerStyle"] button, [data-opt="type"]').forEach(b => {
            b.classList.toggle('active', (b.dataset.val || b.dataset.opt) === state.headerStyle);
        });
    }

    if (state.headerSurface) {
        document.querySelectorAll('[data-opt="style"]').forEach(b => {
            b.classList.toggle('active', b.dataset.val === state.headerSurface);
        });
    }

    if (state.headerSticky !== undefined) {
        document.querySelectorAll('[data-prop="headerSticky"] button, [data-opt="sticky"]').forEach(b => {
            if (b.type === 'checkbox') {
                b.checked = state.headerSticky;
            } else {
                b.classList.toggle('active', (b.dataset.val === 'on') === state.headerSticky);
            }
        });
    }

    // 6. Customer Pains Layout
    const painsLook = state.painsLook || 'a';
    document.querySelectorAll('#painsLayoutJoin [data-pains-look]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.painsLook === painsLook);
    });
    const badge = document.getElementById('painsBadge');
    if (badge) {
        badge.textContent = painsLook === 'b' ? 'Split' : '3 Cards';
    }

    // 6b. Customer Pains Alignment
    const painsAlign = state.painsAlign || 'center';
    document.querySelectorAll('#painsAlignJoin [data-pains-align]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.painsAlign === painsAlign);
    });
}

export function initCanvasSectionClicks() {
    const frame = document.getElementById('templateCanvasFrame') || document.querySelector('.kit-canvas-frame iframe');
    if (!frame) return;

    function attachIframeListeners() {
        try {
            const doc = frame.contentDocument || frame.contentWindow?.document;
            if (!doc || !doc.body) return;

            doc.removeEventListener('click', onIframeClick, true);
            doc.addEventListener('click', onIframeClick, true);
        } catch (e) {}
    }

    function onIframeClick(e) {
        if (e.target.closest('input, textarea, select')) return;

        const sec = e.target.closest('section, header, footer');
        if (!sec) return;

        let secId = sec.id;
        if (!secId) {
            const tag = sec.tagName.toLowerCase();
            if (tag === 'header') secId = 'header';
            else if (tag === 'footer') secId = 'footer';
            else if (sec.classList.contains('hero')) secId = 'hero';
            else if (sec.classList.contains('svc')) secId = 'services';
            else if (sec.classList.contains('rc')) secId = 'solutions';
            else if (sec.classList.contains('ks-about-timeline')) secId = 'about';
            else if (sec.classList.contains('ks-pains')) secId = 'pains';
            else if (sec.classList.contains('ks-trust')) secId = 'trust';
            else if (sec.classList.contains('ks-reviews')) secId = 'reviews';
            else if (sec.classList.contains('ks-quote')) secId = 'quote';
            else if (sec.classList.contains('ks-faq')) secId = 'faq';
            else if (sec.classList.contains('ks-promo')) secId = 'promo';
            else if (sec.classList.contains('ks-contact')) secId = 'contact';
            else if (sec.classList.contains('ks-final')) secId = 'cta';
        }

        if (secId) {
            const doc = frame.contentDocument || frame.contentWindow?.document;
            doc?.querySelectorAll('.is-canvas-selected').forEach(el => el.classList.remove('is-canvas-selected'));
            sec.classList.add('is-canvas-selected');

            activateTab(secId, { fromCanvas: true });
        }
    }

    frame.addEventListener('load', attachIframeListeners);
    if (frame.contentDocument?.readyState === 'complete') {
        attachIframeListeners();
    }
}

// --- 10. Bootstrapping & Storage Sync ---
export function initRuntime() {
    // 0. Ensure host document is purged of any leaked template inline styles
    const hostRoot = document.documentElement;
    const legacyProps = [
        '--color-primary', '--primary-color', '--p', '--active-500',
        '--brand-ink', '--brand-contrast-fg', '--color-primary-content',
        '--headline-font', '--body-font', '--btn-bg'
    ];
    legacyProps.forEach(prop => hostRoot.style.removeProperty(prop));
    SHADE_STEPS.forEach(step => {
        hostRoot.style.removeProperty(`--active-${step}`);
        hostRoot.style.removeProperty(`--primary-${step}`);
    });

    // 1. Read persistent state from storage.js if available
    const saved = readSiteData();
    if (saved) {
        Object.assign(state, saved);
    }

    // Sync palette summary label in sidebar
    const sumBrand = document.getElementById('sum-brand');
    if (sumBrand && state.brandColor) {
        const matchingBtn = document.querySelector(`[data-color].color-btn[style*="${state.brandColor}"]`);
        if (matchingBtn && matchingBtn.dataset.color) {
            sumBrand.textContent = matchingBtn.dataset.color.charAt(0).toUpperCase() + matchingBtn.dataset.color.slice(1);
        }
    }

    // 2. Bind listeners
    initHeroListeners();
    initDrawerAndRailListeners();
    initColorListeners();
    initServicesListeners();
    initHeaderListeners();
    initTypographyListeners();
    initFooterListeners();
    initToggleListeners();
    initCanvasSectionClicks();

    // 3. Connect Canvas Iframe Lifecycle
    const frame = document.getElementById('templateCanvasFrame') || document.querySelector('.kit-canvas-frame iframe');
    if (frame) {
        let resizeRaf = null;
        frame.addEventListener('load', () => {
            try {
                const doc = frame.contentDocument || frame.contentWindow?.document;
                if (doc && doc.body) {
                    const ro = new ResizeObserver(() => {
                        if (resizeRaf) cancelAnimationFrame(resizeRaf);
                        resizeRaf = requestAnimationFrame(() => syncCanvasHeight());
                    });
                    ro.observe(doc.body);
                }
            } catch (e) {}
            syncCanvasState();
            syncBuilderUiControls();
        });

        // If iframe is already ready
        if (frame.contentDocument?.readyState === 'complete') {
            syncCanvasState();
            syncBuilderUiControls();
        }
    }

    // 3b. Real-Time Pub/Sub Synchronization (BroadcastChannel & storage events)
    onSiteDataChange((updatedData) => {
        if (updatedData) {
            Object.assign(state, updatedData);
            syncCanvasState();
            syncBuilderUiControls();
        }
    });

    // Live Preview click listener bound to window execution
    document.getElementById('kitWin')?.addEventListener('click', (e) => {
        e.preventDefault();
        try {
            state.typographyTier = document.getElementById('typographySelect')?.value || state.typographyTier || 'tier1';
            writeSiteData(state);
        } catch (err) {}
        window.open('./template.html', '_blank');
    });

    // 4. Initial state mappings
    syncCanvasState();
    syncBuilderUiControls();

    // 6. Expose global hooks for backward compatibility
    window.__heroMedia = {
        get cur() { return state.heroIndex; },
        setHeroIndex
    };
    window.__applyHeroPanel = applyHeroPanel;
    window.__kitPresetRefresh = () => {};
    window.__kitFilterPage = () => {};
    window.activateTab = activateTab;
    window.syncCanvasLayerLabels = syncCanvasLayerLabels;
    window.applyPainsLook = applyPainsLook;
    window.applyPainsAlignment = applyPainsAlignment;
}

// Auto-run when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initRuntime);
} else {
    initRuntime();
}
