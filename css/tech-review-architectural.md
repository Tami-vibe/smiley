Technical Review & Architectural Audit: Typography Hierarchy, Section Layout Defaults, and Builder Sidebar Controls
To: Engineering Team & Product
From: Senior Tech Lead
Subject: Technical Review & Standardization: Design Tokens, Layout Primitives, and Sidebar Control Bindings
Status: Complete Audit & Architectural Blueprint

1. Executive Summary & Architecture Overview
Our builder kit powers multi-layout automotive themes with dynamic customization via a left-hand inspector rail. While individual layouts look visually rich, our underlying CSS architecture and state bindings currently suffer from component fragmentation:

Token System: We rely on raw CSS Custom Properties in 

css/tokens-base.css
, alongside a DaisyUI 5.7 bridge. However, naming conventions are split (e.g., --fs-* vs. --type-*-size), and component rules often bypass defined spacing tokens for ad-hoc pixel values.
Missing Primitives: There is no reusable .header-group or .section-header primitive. Every section (.hero, .svc-head, .ks-final, .tow-hero-copy) implements its own heading stack with differing margin rules.
Alignment Binding Discrepancy: Alignment for .hero toggles classes on document.body (body.hero-halign-left|center|right), whereas alignment for all other sections injects inline styles (node.style.textAlign = val), leaving flex/grid child containers unaligned.
Section Heights: Aside from .hero (100svh), CTA blocks like .ks-final have no standard minimum height and collapse to content height. Furthermore, the left sidebar provides no height or padding controls.
Below is the complete technical review and the standardization specification.

2. Typographic Hierarchy & Vertical Rhythm
2.1 Font Size Token Verification
The required visual hierarchy is: $$\text{Header Title} > \text{Subtext} > \text{Body Text} > \text{Overline/Label}$$

Checking our active token definitions in 

tokens-base.css:96-124
 and 

tokens-base.css:7850-7918
:

Element	Active Design Token	Computed Desktop Value	Mobile Value (360px)	Conformance Status
Hero Title (h1)	--fs-title	clamp(2.25rem, 5vw + 1rem, 6rem) (36px → 96px)	36px (2.25rem)	Pass
Section Title (h2)	--type-title-size / .svc-head h2	clamp(1.75rem, 2.2vw + 1rem, 2.75rem) (28px → 44px)	28px (1.75rem)	Pass
Subtext / Lead (p)	--fs-sub / --type-sub-size	1.125rem (18px) [Hero: 18px–28px]	18px (1.125rem)	Pass (Strictly > Body)
Body Copy	--type-body-size	1rem (16px)	16px (1rem)	Pass
Overline / Label	--fs-label / --type-overline-size	0.75rem (12px), 0.12em tracking	12px (0.75rem)	Pass
NOTE

Requirement Verified: Subtext (1.125rem / 18px) is strictly larger than standard body copy (1rem / 16px). The relative hierarchy remains invariant across all viewport widths.

2.2 Vertical Spacing & Overline Attachment
The Current Issue
In 

tokens-base.css:139-141
:

css
--gap-label: clamp(0.75rem, 1vw, 1.25rem);  /* 12px → 20px */
--gap-title: clamp(1rem, 2vw, 1.5rem);      /* 16px → 24px */
--gap-sub:   clamp(1.75rem, 3vw, 2.5rem);   /* 28px → 40px */
Spacing is currently applied via child bottom margins:
.hero .label { margin-bottom: var(--gap-label); }
.hero h1 { margin-bottom: var(--gap-title); }
.hero p { margin-bottom: var(--gap-sub); }
At large desktop viewports (> 1400px), --gap-label scales up to 20px (1.25rem). At this distance, the overline visually detaches from the header title and floats in isolation.
The Standardized Specification
The overline must visually group with the title as a single perceptual unit (Gestalt Law of Proximity).

Label-to-Title Gap: Locked to a strict --space-2 (0.5rem / 8px) or tight fluid limit clamp(0.375rem, 0.4vw, 0.5rem).
Heading Wrapper: Encapsulate the title and label within a flex column using CSS gap rather than child bottom margins.
css
/* Standardized Vertical Rhythm Tokens */
:root {
    --gap-overline: 0.5rem;                        /* Strictly 8px: overline stays locked to title */
    --gap-title:    clamp(0.75rem, 1.5vw, 1.25rem); /* 12px → 20px: title → subtext */
    --gap-sub:      clamp(1.25rem, 2.5vw, 2rem);    /* 20px → 32px: subtext → CTA */
}
3. Component Abstraction: The .header-group Primitive
3.1 Current Component Fragmentation
Currently, each section invents its own heading stack:

Hero: .hero-content with direct .label, h1, p, .cta-group (child margins).
Services / Reviews / FAQ: .svc-head.ks-head in 

css/services-components.css:7-12
.
Final CTA (#cta): .final-inner (display: grid; gap: 0.8rem; justify-items: center;).
Subpage sheets: .tow-hero-copy, .rep-hero-copy, .ins-hero-copy.
3.2 Unified .header-group / .title-stack Specification
All single-column headers (whether in Hero, Feature, or CTA sections) must adopt a single atomic layout primitive:

css
/* Reusable Header Primitive */
.header-group,
.title-stack,
.svc-head {
    display: flex;
    flex-direction: column;
    align-items: center;          /* Default centered */
    text-align: center;           /* Default centered */
    gap: var(--gap-title);        /* Predictable gap between title block and subtext */
    max-width: var(--measure-title, 56rem);
    margin-inline: auto;
    width: 100%;
}
/* Tight Overline-Title Substack */
.header-group > .title-wrap,
.title-stack > .title-wrap {
    display: flex;
    flex-direction: column;
    align-items: inherit;
    gap: var(--gap-overline);     /* Tight 8px gap */
}
/* Typography styles inside the primitive */
.header-group .overline,
.title-stack .label {
    font-family: var(--body-font);
    font-size: var(--type-overline-size, 0.75rem);
    font-weight: 700;
    line-height: 1.2;
    letter-spacing: var(--type-overline-track, 0.12em);
    text-transform: uppercase;
    margin: 0;                    /* Zero margin, spacing handled by flex gap */
}
.header-group h1,
.header-group h2,
.title-stack h1,
.title-stack h2 {
    font-family: var(--headline-font);
    font-size: var(--type-title-size);
    font-weight: 700;
    line-height: 1.08;
    letter-spacing: -0.025em;
    text-wrap: balance;
    overflow-wrap: break-word;
    margin: 0;
}
.header-group .subtext,
.title-stack p {
    font-family: var(--body-font);
    font-size: var(--type-sub-size, 1.125rem);
    line-height: var(--type-sub-lh, 1.55);
    max-width: var(--measure-sub, 38rem);
    text-wrap: pretty;
    margin: 0;
    opacity: 0.88;
}
4. Default Alignment & Flex/Grid Behavior
4.1 Audit of Existing Alignment Implementation
Hero Component:
In 

css/tokens-base.css:412-428
, hero alignment relies on body classes: body.hero-halign-left, body.hero-halign-center, body.hero-halign-right.
Controls are bound in 

js/runtime.js:1320-1327
.
This works for Hero because the CSS explicitly adjusts:
.hero-content: align-items, text-align, and margin-inline: 0 auto | auto | auto 0.
.cta-group: justify-content: flex-start | center | flex-end.
Other Sections (Services, Reviews, CTA, About):
In 

js/runtime.js:1328-1333
:
javascript
node.style.textAlign = val;
node.querySelectorAll('.sec-title, .sec-desc, h1, h2, h3, .ks-head').forEach(el => {
    el.style.textAlign = val;
});
Architectural Failure:
Writing inline style.textAlign = val does not align flex/grid child containers.
Containers like .svc-head keep margin: 0 auto; (centered horizontally), but the text inside shifts to the left.
Button containers like .final-ctas keep justify-content: center; regardless of whether the user chose Left or Right alignment.
4.2 Standardized Alignment Specification
To avoid specificity wars and eliminate inline styles, section alignment must be governed by a uniform section-level data attribute: data-align="left" | "center" | "right".

css
/* =========================================================
   Universal Section Alignment (Clean Attribute System)
   ========================================================= */
/* Default: Center aligned */
.ks,
.hero,
.section-block {
    --sec-align-text: center;
    --sec-align-items: center;
    --sec-justify: center;
    --sec-margin-inline: auto;
}
[data-align="left"] {
    --sec-align-text: left;
    --sec-align-items: flex-start;
    --sec-justify: flex-start;
    --sec-margin-inline: 0 auto;
}
[data-align="center"] {
    --sec-align-text: center;
    --sec-align-items: center;
    --sec-justify: center;
    --sec-margin-inline: auto;
}
[data-align="right"] {
    --sec-align-text: right;
    --sec-align-items: flex-end;
    --sec-justify: flex-end;
    --sec-margin-inline: auto 0;
}
/* Propagation across containers and children */
[data-align] .header-group,
[data-align] .title-stack,
[data-align] .svc-head,
[data-align] .final-inner {
    text-align: var(--sec-align-text);
    align-items: var(--sec-align-items);
    margin-inline: var(--sec-margin-inline);
}
[data-align] .cta-group,
[data-align] .final-ctas,
[data-align] .btn-row {
    justify-content: var(--sec-justify);
}
Updated JS Binding in 

js/runtime.js
javascript
if (prop === 'align') {
    target.dataset.align = val;
    if (secId === 'hero') {
        ['left', 'center', 'right'].forEach(a =>
            document.body.classList.toggle('hero-halign-' + a, val === a));
    }
    // Clean up legacy inline styles:
    node.style.removeProperty('text-align');
    node.querySelectorAll('.sec-title, .sec-desc, h1, h2, h3, .ks-head').forEach(el => {
        el.style.removeProperty('text-align');
    });
}
5. Section Sizing & CTA Sections
5.1 Current Height Behavior
Hero (.hero): Enforces min-height: 100vh; min-height: 100svh; via CSS Grid with place-items: center;.
CTA Section (.ks-final / #cta):
Found at 

tokens-base.css:4119-4127
 and 

index.html:487-494
.
Has no minimum height constraint. It only inherits .ks { padding: clamp(3.5rem, 7vw, 6rem) var(--pad-x); }.
When text is concise, the CTA block measures under 260px in height, appearing cramped and lacking premium visual weight.
Subpage Hero Sheets: Hardcoded to min-height: 560px with no sidebar adjustment.
5.2 Required Standard Height & Vertical Centering
For CTA sections and standard stack blocks (Label + Title + Subtext + CTA Button):

Default Min-Height: min-height: clamp(420px, 50vh, 560px); with display: flex; flex-direction: column; justify-content: center; align-items: center;.
Content must center vertically within the section whenever height expands.
css
/* Standard CTA Section with Sensible Default Height */
.ks-final,
.section-cta {
    display: flex;
    flex-direction: column;
    justify-content: center;      /* Vertically center content */
    align-items: center;          /* Horizontally center by default */
    min-height: var(--sec-min-h, clamp(420px, 50vh, 560px));
    padding: var(--section-pad-y) var(--pad-x);
    position: relative;
    box-sizing: border-box;
}
.ks-final .final-inner {
    width: 100%;
    max-width: 820px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--gap-title);
}
5.3 Sidebar Height Controls: Schema & Presets
Currently, no height controls exist in the left sidebar. To give creators control over vertical presence, we must expose a data-prop="height" control in the Section Inspector (

index.html
).

Inspector UI Markup to add to panel-inspector:
html
<div class="control-group" data-context="section" data-prop="height">
  <label>Section Height</label>
  <div class="button-group" role="group" aria-label="Section height presets">
    <button type="button" class="tier-btn" data-val="compact" title="Compact (360px / 35vh)">Compact</button>
    <button type="button" class="tier-btn active" data-val="default" title="Default (480px / 50vh)">Default</button>
    <button type="button" class="tier-btn" data-val="tall" title="Tall (640px / 75vh)">Tall</button>
    <button type="button" class="tier-btn" data-val="full" title="Full Screen (100svh)">Full</button>
  </div>
</div>
CSS Preset Mapping in tokens-base.css:
css
/* Section Height Preset Mappings */
[data-height="compact"] {
    --sec-min-h: clamp(340px, 35vh, 420px);
    --section-pad-y: clamp(2rem, 4vw, 3.5rem);
}
[data-height="default"] {
    --sec-min-h: clamp(420px, 50vh, 560px);
    --section-pad-y: clamp(3.5rem, 6vw, 5rem);
}
[data-height="tall"] {
    --sec-min-h: clamp(580px, 75vh, 760px);
    --section-pad-y: clamp(4.5rem, 8vw, 7rem);
}
[data-height="full"] {
    --sec-min-h: 100svh;
    --section-pad-y: clamp(3.5rem, 8vh, 5rem);
}
6. Audit Questions & Action Items
1. Kit & Token Audit
System Type: Pure CSS Custom Properties with DaisyUI theme integration.
Token Consistency:
Typography scale is split between --fs-* and --type-*-size.
Spacing defines fixed --space-1 through --space-16 and fluid --pad-x, --pad-y, --gap-*, but components routinely use arbitrary hardcoded values (12px, 28px, 50px).
Recommendation: Standardize all typography to --type-* tokens and replace ad-hoc margins with standard --space-* / --gap-* variables.
2. Component Abstraction
Current State: Ad-hoc implementation. There is no shared primitive. Hero, Services, Reviews, CTA, and Subpage sheets each write custom CSS.
Recommendation: Adopt the unified .header-group and .title-stack primitives defined above.
3. Sidebar Schema & State Binding
Current State: Inconsistent hybrid:
Hero alignment sets body classes (body.hero-halign-*).
Non-hero alignment sets inline element.style.textAlign.
Colors toggle dataset (data-scheme) or CSS variables (--sec-shade).
Radius toggles body classes (btn-square, btn-rounded, btn-round) and CSS variables (--btn-radius).
Recommendation: Unify alignment to data-align="left|center|right" on the target section node, avoiding inline styles.
4. Best Practices & Mobile Responsiveness
Fluid Typography: Keep --type-title-size: clamp(1.75rem, 2.2vw + 1rem, 2.75rem) and --fs-title: clamp(2.25rem, 5vw + 1rem, 6rem).
Mobile Section Heights: Avoid rigid pixel heights like min-height: 560px on mobile viewports. Instead, use clamp(360px, 50vh, 560px) and 100svh to handle mobile dynamic toolbars smoothly.
Overline Attachment: Lock --gap-overline: 0.5rem so overlines never detach on desktop screens.
7. Next Steps & Implementation Roadmap
Step 1: CSS Standardization
Add the standardized .header-group primitive, --gap-overline token, and data-align / data-height rules into 

css/tokens-base.css
.
Step 2: Section Alignment Refactoring
Refactor applySectionProp(node, 'align', val) in 

js/runtime.js
 to set node.dataset.align = val and remove legacy inline style injection.
Step 3: Sidebar Height Controls
Add the Section Height preset buttons (Compact, Default, Tall, Full) to panel-inspector in 

index.html
 and bind them in applySectionProp(node, 'height', val).
Step 4: Regression Testing
Verify Live Preview and Builder Canvas across desktop and mobile breakpoints using Chrome DevTools.
Would you like to proceed with implementing these standardized changes in the codebase now?

11:23 AM
