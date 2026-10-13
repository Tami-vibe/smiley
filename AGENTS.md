# AGENT RULES: ZERO-SLOP & UI INTEGRITY

## 1. Zero-Slop & Blast Radius Limits
- **Max Change Budget:** Visual/CSS fixes must not exceed 10 lines of code. Do not rewrite surrounding architecture for targeted visual bugs.
- **In-Place Edits Only:** Never append new CSS overrides or duplicate selectors to the bottom of stylesheets. Locate the existing rule and edit it in place.
- **Strict Ban on `!important`:** Do NOT write `!important`. Resolve conflicts via correct selector specificity or class assignment, not override wars.
- **No Inline Styles:** Do NOT inject `style="..."` attributes into HTML templates (`index.html`, `template.html`). Use utility classes.
- **Syntax Verification:** Never leave unclosed CSS blocks, missing brackets, or truncated layers.

## 2. Component System & DaisyUI Enforcement
- **Strict daisyUI Primitives:** Use native daisyUI classes (`btn`, `btn-primary`, `btn-outline`, `card`, `card-body`, `collapse`, `tabs`).
- **No Class Soup or Wrapper Creep:** Do not invent custom button/card wrappers (e.g., `.ks-btn`, `.cta-btn`, custom border containers).
- **Theme Propagation:** Ensure daisyUI components rely on `data-theme` variable propagation rather than hardcoded hex colors.
- **Vanilla Only:** Static HTML/JS/CSS environment. Do not introduce npm build tools, framework scripts, or complex DOM observation loops for simple styling.

## 3. Layout, Alignment & Responsive Grid Discipline
- **Standardized Container Framing:** All template section content grids must nest inside the standardized container wrapper (`max-w-6xl mx-auto w-full px-4`) so cards optically center and align with section headers across all viewports.
- **Mandatory Mobile-First Grids:** Every grid must declare `grid-cols-1` as its mobile base, scaling up via responsive prefixes (e.g., `grid grid-cols-1 md:grid-cols-3 gap-5`). Never emit bare desktop-first grid classes like naked `grid-cols-3`.
- **Ban `@media (max-width)` Hacks:** Never write custom `@media (max-width: ...)` overrides in stylesheets or `<style>` blocks. Responsive scaling must strictly use Tailwind/daisyUI min-width modifiers (`sm:`, `md:`, `lg:`).

## 4. Execution Protocol & Pre-Commit Gates
- **Inspect First:** Search for existing classes and CSS custom properties before writing any new selector.
- **Fail Fast:** If an edit causes visual regressions or fails to solve alignment within 2 iterations, STOP and report the block to the user.
- **Pre-Commit Enforcement:** Every commit is validated by `.git/hooks/pre-commit`:
  * Zero `!important` declarations permitted in `css/tokens-base.css`.
  * All CSS files must pass PostCSS syntax parsing.
  * Total tracked CSS must remain strictly within the 2,000 LOC hard budget.
