/* Mode switch. Builder keeps the rail open at 333px. refresh skips a missing summary node. */
export function kitMode(area, home) {
    if (home === 'open') return 'builder';
    if (area === 'brand' || area === 'seo' || area === 'profile') return 'global';
    return 'editor';
}

export function clearDrawerWidth(drawer) {
    if (!drawer) return;
    drawer.id = 'kit-drawer';
    const drawerSide = drawer.querySelector(':scope > .drawer-side');
    const nodes = [drawer, document.getElementById('kit-head'), drawerSide, drawer.querySelector(':scope > .drawer-side > .cfg')];
    drawer.querySelectorAll('.cfg-panel').forEach(el => nodes.push(el));
    nodes.forEach(el => {
        if (!el) return;
        ['width', 'min-width', 'max-width', 'flex', 'flex-basis'].forEach(prop => el.style.removeProperty(prop));
    });
}

export function applyMode(mode, drawer, railToggle) {
    try {
        document.body.dataset.mode = mode;
        if (mode !== 'builder') return;
        if (drawer) {
            drawer.dataset.kitHome = 'open';
            drawer.dataset.kitRail = 'open';
            drawer.classList.remove('is-collapsed', 'is-slim', 'drawer-slim');
            drawer.querySelectorAll('.is-collapsed, .is-slim, .drawer-slim').forEach(el => {
                el.classList.remove('is-collapsed', 'is-slim', 'drawer-slim');
            });
        }
        if (railToggle) {
            railToggle.setAttribute('aria-expanded', 'true');
            railToggle.setAttribute('aria-label', 'Collapse navigation');
        }
    } catch (err) { /* a missing child must not abort the mode switch */ }
    if (mode === 'builder') clearDrawerWidth(drawer);
}

export function createRefresh(cfg) {
    const valueOf = g => {
        const act = g.querySelector('.tier-btn.active, .color-btn.active');
        if (g.classList.contains('duo-group')) { const d = g.querySelector('select'); return d && d.selectedOptions[0] ? d.selectedOptions[0].textContent : ''; }
        if (act) return act.classList.contains('color-btn') ? act.title : (act.textContent.trim() || act.title);
        const s = g.querySelector('select');
        return s && s.selectedOptions[0] ? s.selectedOptions[0].textContent : '';
    };
    const visible = g => getComputedStyle(g).display !== 'none';
    return function refresh() {
        try {
            if (!cfg) return;
            cfg.querySelectorAll('.cfg-panel').forEach(p => {
                try {
                    const key = p.id.replace('panel-', '');
                    const vals = [...p.querySelectorAll('.control-group:not(.pit-grid .control-group)')].filter(visible).map(valueOf).filter(Boolean);
                    const target = document.getElementById('sum-' + key);
                    if (target) target.textContent = vals.slice(0, 4).join(' · ');
                } catch (err) { /* one panel must not abort the others */ }
            });
        } catch (err) { /* refresh must not abort the mode switch */ }
    };
}
