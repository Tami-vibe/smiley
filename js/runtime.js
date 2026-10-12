import { MS, sectorIcon, railIcons, setAutoBodyIcons } from './sector-icons.js';
import { kitMode as kitModeCore, clearDrawerWidth as clearDrawerWidthCore, applyMode as applyModeCore, createRefresh } from './state-mode.js?v=hide-editor';
import { mountShowcase } from './showcase.js';
import { readSiteData, writeSiteData } from './storage.js';

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

export function syncCanvasHeight() {
    const frame = document.getElementById('templateCanvasFrame') || document.querySelector('.kit-canvas-frame iframe');
    if (!frame) return;
    try {
        const doc = frame.contentDocument || frame.contentWindow?.document;
        if (doc && doc.body) {
            const h = Math.max(doc.body.scrollHeight, doc.documentElement.scrollHeight, 700);
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
    const targets = [document.documentElement];
    const canvasDoc = getCanvasDocument();
    if (canvasDoc && canvasDoc.documentElement && canvasDoc !== document) {
        targets.push(canvasDoc.documentElement);
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
        root.style.setProperty('--brand-ink', hex);
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
    const targets = [document.documentElement];
    const canvasDoc = getCanvasDocument();
    if (canvasDoc && canvasDoc.documentElement && canvasDoc !== document) {
        targets.push(canvasDoc.documentElement);
    }
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
    theme: 'dark'
};

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
    const doc = getCanvasDocument();
    [doc.body, document.body].forEach(b => {
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
    const doc = getCanvasDocument();
    ['off', 'bottom', 'left', 'right'].forEach(v => {
        doc.body?.classList.toggle('panel-' + v, pos === v);
        document.body.classList.toggle('panel-' + v, pos === v);
    });
    document.querySelectorAll('[data-panel]').forEach(b => {
        const on = b.dataset.panel === pos;
        b.classList.toggle('active', on);
        b.classList.toggle('btn-primary', on);
    });
    doc.querySelectorAll('.biz-panel, .hb-info').forEach(panel => {
        panel.hidden = (pos === 'off');
        panel.classList.toggle('self-end', pos === 'bottom');
    });
    document.querySelectorAll('.biz-panel, .hb-info').forEach(panel => {
        panel.hidden = (pos === 'off');
        panel.classList.toggle('self-end', pos === 'bottom');
    });
    syncCanvasHeight();
}

export function applyHeroPanelStyle(style) {
    state.panelStyle = style;
    const doc = getCanvasDocument();
    [doc.body, document.body].forEach(b => {
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
    syncCanvasHeight();
}

// --- 6. Navigation & Header Data-Mapper ---
export function setHeaderSticky(sticky) {
    state.headerSticky = !!sticky;
    const doc = getCanvasDocument();
    [doc.body, document.body].forEach(b => {
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

// --- 7. Inspector Tabs & Drawer Rail Data-Mapper ---
export function activateTab(tabId) {
    const tabs = document.querySelectorAll('.cfg-tab');
    const panels = document.querySelectorAll('.cfg-panel');
    let matchedPanel = null;

    tabs.forEach(t => {
        const id = t.id.replace(/^(tab-|rail-)/, '');
        const on = (t.id === tabId || id === tabId || t.dataset.tab === tabId || t.dataset.sec === tabId);
        t.classList.toggle('is-active', on);
        t.setAttribute('aria-selected', String(on));
        if (on) {
            const ctrl = t.getAttribute('aria-controls') || t.dataset.kitPanel || ('panel-' + (t.dataset.tab || id));
            matchedPanel = document.getElementById(ctrl);
            if (!matchedPanel) {
                // Fallback resolution for sub-sections and aliases
                if (t.dataset.tab === 'more' || ['faq', 'pains', 'trust', 'reviews', 'quote', 'promo', 'final-cta', 'contact', 'footer', 'all'].includes(t.dataset.sec)) {
                    matchedPanel = document.getElementById('panel-more');
                } else if (t.dataset.tab === 'about' || t.dataset.sec === 'about') {
                    matchedPanel = document.getElementById('panel-hero');
                } else if (t.dataset.tab === 'repairs' || t.dataset.sec === 'repairs') {
                    matchedPanel = document.getElementById('panel-services');
                } else if (t.dataset.sec === 'assets') {
                    matchedPanel = document.getElementById('panel-icons');
                }
            }
        }
    });

    if (matchedPanel) {
        panels.forEach(p => {
            const isTarget = (p === matchedPanel);
            p.hidden = !isTarget;
            p.classList.toggle('hidden', !isTarget);
            p.style.display = isTarget ? 'flex' : 'none';
        });
        matchedPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
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
        promise.addEventListener('input', e => {
            const doc = getCanvasDocument();
            const hero = doc.querySelector('main.heroes-container > .hero.is-live-hero') || doc.querySelector('main.heroes-container > .hero');
            const h1 = hero?.querySelector('.hero-content h1');
            if (h1) h1.textContent = e.target.value;
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
            const doc = getCanvasDocument();
            ['left', 'center', 'right'].forEach(a => {
                doc.body?.classList.toggle('hero-halign-' + a, a === align);
                document.body.classList.toggle('hero-halign-' + a, a === align);
            });
            document.querySelectorAll('[data-halign]').forEach(btn => btn.classList.toggle('active', btn === b));
        });
    });

    // CTA buttons count
    document.querySelectorAll('[data-ctacount]').forEach(b => {
        b.addEventListener('click', () => applyCtaCount(Number(b.dataset.ctacount)));
    });

    // Panel position & style
    document.querySelectorAll('[data-panel]').forEach(b => {
        b.addEventListener('click', () => applyHeroPanel(b.dataset.panel));
    });
    document.querySelectorAll('[data-pstyle]').forEach(b => {
        b.addEventListener('click', () => applyHeroPanelStyle(b.dataset.pstyle));
    });

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

    // Drawer tabs
    document.querySelectorAll('.cfg-tab').forEach(tab => {
        tab.addEventListener('click', () => activateTab(tab.id));
    });

    // Controls collapse button
    const collapseBtn = document.getElementById('cfgCollapse');
    if (collapseBtn) {
        collapseBtn.addEventListener('click', () => {
            const cfg = document.getElementById('cfg');
            const isCol = cfg?.classList.toggle('is-collapsed');
            collapseBtn.setAttribute('aria-expanded', String(!isCol));
            collapseBtn.textContent = isCol ? 'Show controls' : 'Hide controls';
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
            }
            state.theme = theme;
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
            if (scroller) scroller.dataset.device = dev;
            if (frame) {
                frame.dataset.device = dev;
                if (dev === 'desktop') {
                    frame.style.maxWidth = '1024px';
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

    // Settings modal toggle
    const settingsBtn = document.getElementById('kitSettings');
    const accountView = document.getElementById('kit-account');
    if (settingsBtn && accountView) {
        settingsBtn.addEventListener('click', () => {
            accountView.hidden = !accountView.hidden;
        });
        document.querySelector('.kit-account-back')?.addEventListener('click', () => {
            accountView.hidden = true;
        });
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
            }
        });
    });

    // Scheme buttons
    document.querySelectorAll('[data-scheme]').forEach(btn => {
        btn.addEventListener('click', () => {
            const scheme = btn.dataset.scheme;
            document.querySelectorAll('[data-scheme]').forEach(b => b.classList.toggle('active', b === btn));
            const canvasDoc = getCanvasDocument();
            const root = canvasDoc.documentElement || document.documentElement;
            root.setAttribute('data-scheme', scheme);
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

    // Section Visibility Toggles in #panel-more
    document.querySelectorAll('.more-row [data-more="show"]').forEach(toggle => {
        toggle.addEventListener('change', () => {
            const row = toggle.closest('.more-row');
            const secId = row?.dataset.sec;
            const targetSec = byId(secId);
            if (targetSec) {
                targetSec.hidden = !toggle.checked;
                syncCanvasHeight();
            }
        });
    });

    // Section shade selector
    document.querySelectorAll('.more-row select.more-shade').forEach(sel => {
        sel.addEventListener('change', () => {
            const row = sel.closest('.more-row');
            const secId = row?.dataset.sec;
            const targetSec = byId(secId);
            if (targetSec) {
                targetSec.style.setProperty('--sec-shade', `var(--active-${sel.value})`);
            }
        });
    });
}

// --- 9. Synchronize Full Canvas State ---
export function syncCanvasState() {
    setHeroIndex(state.heroIndex || 0);
    applyReviews(state.reviews || 'white');
    applyHeroPanel(state.panel || 'bottom');
    applyHeroPanelStyle(state.panelStyle || 'solid');
    applyCtaCount(state.ctas !== undefined ? state.ctas : 2);
    if (state.brandColor) applyBrandPalette(state.brandColor);
    const canvasDoc = getCanvasDocument();
    if (canvasDoc && canvasDoc.documentElement) {
        canvasDoc.documentElement.setAttribute('data-theme', state.theme || 'dark');
    }
    const typePreset = document.getElementById('typographySelect')?.value || 'tier1';
    applyTypographyPreset(typePreset);
    syncCanvasHeight();
}

// --- 10. Bootstrapping & Storage Sync ---
export function initRuntime() {
    // 1. Read persistent state from storage.js if available
    const saved = readSiteData();
    if (saved) {
        Object.assign(state, saved);
    }

    // 2. Bind listeners
    initHeroListeners();
    initDrawerAndRailListeners();
    initColorListeners();
    initTypographyListeners();
    initToggleListeners();

    // 3. Connect Canvas Iframe Lifecycle
    const frame = document.getElementById('templateCanvasFrame') || document.querySelector('.kit-canvas-frame iframe');
    if (frame) {
        frame.addEventListener('load', () => {
            try {
                const doc = frame.contentDocument || frame.contentWindow?.document;
                if (doc && doc.body) {
                    const ro = new ResizeObserver(() => syncCanvasHeight());
                    ro.observe(doc.body);
                }
            } catch (e) {}
            syncCanvasState();
        });

        // If iframe is already ready
        if (frame.contentDocument?.readyState === 'complete') {
            syncCanvasState();
        }
    }

    // Live Preview click listener bound to window execution
    document.getElementById('kitWin')?.addEventListener('click', () => {
        const frame = document.getElementById('templateCanvasFrame');
        if (frame) {
            // Force target source synchronization
            frame.src = './template.html?v=' + Date.now();
        }
    });

    // 4. Initial state mappings
    syncCanvasState();

    // 5. Mount showcase if showcase container is present
    mountShowcase();

    // 6. Expose global hooks for backward compatibility
    window.__heroMedia = {
        get cur() { return state.heroIndex; },
        setHeroIndex
    };
    window.__applyHeroPanel = applyHeroPanel;
    window.__kitPresetRefresh = () => {};
    window.__kitFilterPage = () => {};
    window.activateTab = activateTab;
}

// Auto-run when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initRuntime);
} else {
    initRuntime();
}
