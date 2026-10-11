1. Dynamic Typography
Variable Names on :root: When selecting a font tier in Global Settings, the system updates --headline-font and --body-font on document.documentElement (:root). The variables --font-primary and --font-heading do not exist in the codebase.
JS Wiring: In 

js/runtime.js
 (imported into app.js via runtime chain), font switching is handled by updateTier():
javascript
// js/runtime.js:2986-2988
root.style.setProperty('--headline-font', "'Syne', sans-serif");
root.style.setProperty('--body-font', "'Manrope', sans-serif");
Inheritance on Elements:
Title: Inherits var(--headline-font) via global heading rules:
css
/* css/tokens-base.css:161 */
h1, h2 { font-family: var(--headline-font); }
Label (eyebrow): Explicitly inherits var(--body-font):
css
/* css/tokens-base.css:430-432 */
.hero .label {
    font-family: var(--body-font);
    font-size: var(--fs-label);
Subtext: Inherits var(--body-font) via global paragraph inheritance:
css
/* css/tokens-base.css:163 */
p, button, a { font-family: var(--body-font); }
2. Color Wiring
Token Existence: --color-accent does not exist anywhere in tokens-base.css. --color-primary does not exist on :root; it is scoped locally inside specific components as a daisyUI compatibility bridge:
css
/* css/tokens-base.css:578-581 */
.hero {
    --cta-bg: var(--tone-mid); --cta-fg: #ffffff;
    --color-primary: var(--cta-bg);
    --color-primary-content: var(--cta-fg);
}
Brand Palette Definition: The active brand palette is defined in :root via shade ramps (--active-50 through --active-950) and tone aliases (--tone-mid: var(--active-700);, --brand-500: var(--active-500);) at 

css/tokens-base.css:78–89
.
Wiring vs. Static Styles:
Component actions wire through intermediate semantic aliases (e.g., .hero .cta-btn wires to --cta-bg at line 578; .svc wires to --svc-accent: var(--active-500); at line 2904; .rc wires to --rc-accent: var(--active-500); at line 3479).
However, numerous interactive states, button variants, and borders rely on isolated static styles:
css
/* css/tokens-base.css:2170-2174 */
body.header-btn-dark:not(.header-btn-outline) .site-header .sh-btn {
    --hb-bg: #17191c;
    --hb-fg: #ffffff;
}
/* css/tokens-base.css:2257-2260 */
body.site-btn-fill.site-btn-dark :is(.btn, .ks-btn, .cta-btn, .svc-all-btn, .final-ctas .btn):not(.sh-btn):not(.btn-outline):not(.btn-link) {
    background: #17191c !important;
    color: #ffffff !important;
}
3. Spacing System
Predictable Scale: There is no standardized scale (e.g., --space-1 through --space-8 or fixed 4px/8px rem multipliers) in tokens-base.css.
Root Spacing Tokens: Spacing is driven by fluid clamp() tokens:
css
/* css/tokens-base.css:125-131 */
/* Fluid spacing */
--pad-x: clamp(1rem, 4vw, 2.5rem);          /* 16 → 40px */
--pad-y: clamp(3.5rem, 8vh, 5rem);          /* 56 → 80px */
--gap-label: clamp(0.75rem, 1vw, 1.25rem);  /* label → title */
--gap-title: clamp(1rem, 2vw, 1.5rem);      /* title → subtext */
--gap-sub:   clamp(1.75rem, 3vw, 2.5rem);   /* subtext → button */
Section Padding & Gaps: Individual sections use hardcoded pixel or independent clamp formulas:
Line 119: --section-pad-block: 50px;
Line 2908: .svc { padding: clamp(4rem, 8vw, 7rem) var(--pad-x); --svc-gap: 20px; }
Line 3478: .rc { padding: clamp(4rem, 8vw, 7rem) var(--pad-x); }
Line 3747: .ks { padding: clamp(3.5rem, 7vw, 6rem) var(--pad-x); }
4. Section Alignment
Default 1-Column Desktop Alignment: The base CSS enforces centered alignment by default on .hero-content:
css
/* css/tokens-base.css:388-397 */
.hero-content {
    position: relative;
    z-index: 10;
    width: 100%;
    max-width: var(--measure-title);
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
}
Override Classes: The CSS does not expose element utility classes like .align-left or .align-right. Instead, overrides are scoped through body-level modifier classes:
css
/* css/tokens-base.css:401-417 */
body.hero-halign-left .hero:is(.hero-gradient, .hero-fullbleed, .hero-centered, .hero-framed, .hero-aerial, .hero-business) .hero-content {
    align-items: flex-start;
    text-align: left;
    margin-inline: 0 auto;
}
body.hero-halign-center .hero:is(.hero-gradient, .hero-fullbleed, .hero-centered, .hero-framed, .hero-aerial, .hero-business) .hero-content {
    align-items: center;
    text-align: center;
    margin-inline: auto;
}
body.hero-halign-right .hero:is(.hero-gradient, .hero-fullbleed, .hero-centered, .hero-framed, .hero-aerial, .hero-business) .hero-content {
    align-items: flex-end;
    text-align: right;
    margin-inline: auto 0;
}
Sidebar Connection: These body classes are directly toggled by the builder's horizontal alignment controls in 

js/runtime.js
:
javascript
// js/runtime.js:3753, 3757
['left', 'center', 'right'].forEach(a => document.body.classList.toggle('hero-halign-' + a, v === a));
document.body.classList.add('hero-halign-center');
