/* Tabbed Showcase: 5000ms autoplay and manual tab clicks. */
export function mountShowcase() {
            const host = document.getElementById('svcShowcase');
            if (!host) return;
            const INTERVAL = 5000;
            const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
            const PHOTOS = [
                'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&w=800&q=70',
                'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=70',
                'https://images.unsplash.com/photo-1565043589221-1a6fd9ae45c7?auto=format&fit=crop&w=800&q=70',
                'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=70'
            ];
            const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
            const iconName = s => String(s || '').toLowerCase().replace(/[^a-z0-9_]/g, '') || 'verified';
            const safeSrc = src => {
                const s = String(src || '').trim();
                if (/^data:image\/(png|jpe?g|webp|gif);/i.test(s)) return s;
                try {
                    const u = new URL(s);
                    if (u.username || u.password) return '';
                    if (u.protocol === 'http:' || u.protocol === 'https:') return s;
                } catch (e) { return ''; }
                return '';
            };
            const shot = i => PHOTOS[i % PHOTOS.length];
            const seed = () => ({
                eyebrow: 'Our services',
                headline: 'Everything your car needs after an accident.',
                note: 'One team handles the repair, the paperwork, and the handoff.',
                icon: 'verified',
                tabs: [
                    { name: 'Body', cols: 4, cards: [
                        { src: shot(0), caption: 'Collision repair' },
                        { src: shot(1), caption: 'Frame and suspension' },
                        { src: shot(2), caption: 'Dent removal' },
                        { src: shot(3), caption: 'Panel fit' }
                    ]},
                    { name: 'Paint', cols: 4, cards: [
                        { src: shot(1), caption: 'Colour match' },
                        { src: shot(2), caption: 'Refinishing' },
                        { src: shot(3), caption: 'Clear coat' },
                        { src: shot(0), caption: 'Blend panels' }
                    ]},
                    { name: 'Glass', cols: 3, cards: [
                        { src: shot(2), caption: 'Windshield' },
                        { src: shot(3), caption: 'Chip repair' },
                        { src: shot(0), caption: 'Side glass' }
                    ]},
                    { name: 'Mechanical', cols: 4, cards: [
                        { src: shot(3), caption: 'Battery and electrics' },
                        { src: shot(0), caption: 'Wheels and tyres' },
                        { src: shot(1), caption: 'Alignment' },
                        { src: shot(2), caption: 'Diagnostics' }
                    ]},
                    { name: 'Support', cols: 3, cards: [
                        { src: shot(0), caption: 'Insurance claims' },
                        { src: shot(1), caption: '24/7 towing' },
                        { src: shot(2), caption: 'Courtesy car' }
                    ]}
                ]
            });
            const sanitize = raw => {
                const base = seed();
                const tabs = (Array.isArray(raw.tabs) ? raw.tabs : []).slice(0, 8).map(t => {
                    const cards = (Array.isArray(t && t.cards) ? t.cards : []).slice(0, 8).map(c => ({
                        src: safeSrc(c && c.src),
                        caption: String(c && c.caption || '').slice(0, 120)
                    }));
                    if (!cards.length) cards.push({ src: '', caption: 'New item' });
                    return { name: String(t && t.name || 'Tab').slice(0, 32), cols: Number(t && t.cols) === 3 ? 3 : 4, cards };
                }).filter(t => t.name);
                if (!tabs.length) return base;
                return {
                    eyebrow: String(raw.eyebrow || base.eyebrow).slice(0, 48),
                    headline: String(raw.headline || base.headline).slice(0, 140),
                    note: String(raw.note || base.note).slice(0, 180),
                    icon: iconName(raw.icon || base.icon),
                    tabs
                };
            };
            const load = () => {
                try {
                    const raw = JSON.parse(localStorage.getItem('svcShowcase') || 'null');
                    if (raw && Array.isArray(raw.tabs)) return sanitize(raw);
                } catch (e) {}
                return seed();
            };
            let state = load();
            state.index = 0;
            let timer = 0;
            let running = false;
            let saveT = 0;
            const save = () => {
                clearTimeout(saveT);
                saveT = setTimeout(() => {
                    try {
                        localStorage.setItem('svcShowcase', JSON.stringify({
                            eyebrow: state.eyebrow, headline: state.headline, note: state.note, icon: state.icon, tabs: state.tabs
                        }));
                    } catch (e) {}
                }, 250);
            };
            const readImage = file => new Promise(res => {
                const rd = new FileReader();
                rd.onload = () => {
                    const pic = new Image();
                    pic.onload = () => {
                        const max = 800;
                        const scale = Math.min(1, max / Math.max(pic.width, pic.height));
                        const canvas = document.createElement('canvas');
                        canvas.width = Math.max(1, Math.round(pic.width * scale));
                        canvas.height = Math.max(1, Math.round(pic.height * scale));
                        const ctx = canvas.getContext('2d');
                        if (!ctx) { res(String(rd.result || '')); return; }
                        ctx.drawImage(pic, 0, 0, canvas.width, canvas.height);
                        res(canvas.toDataURL('image/jpeg', 0.72));
                    };
                    pic.onerror = () => res('');
                    pic.src = String(rd.result || '');
                };
                rd.onerror = () => res('');
                rd.readAsDataURL(file);
            });
            const cardHtml = card => {
                const src = safeSrc(card.src);
                const cap = esc(card.caption);
                const img = src ? '<img alt="' + cap + '" src="' + esc(src) + '">' : '';
                return '<figure class="showcase-card"><div class="showcase-media">' + img + '</div><figcaption class="showcase-caption">' + cap + '</figcaption></figure>';
            };
            const applyCols = tabEl => {
                const grid = host.querySelector('.showcase-grid');
                if (!grid || !tabEl) return;
                const variable = tabEl.style.getPropertyValue('--col-count').trim();
                const cols = (variable || tabEl.dataset.cols) === '3' ? 3 : 4;
                grid.style.setProperty('--col-count', String(cols));
            };
            const fillGrid = i => {
                const grid = host.querySelector('.showcase-grid');
                const tab = state.tabs[i];
                if (!grid || !tab) return;
                let figs = grid.querySelectorAll('.showcase-card');
                if (figs.length !== tab.cards.length) {
                    grid.innerHTML = tab.cards.map(cardHtml).join('');
                    figs = grid.querySelectorAll('.showcase-card');
                }
                tab.cards.forEach((card, n) => {
                    const fig = figs[n];
                    if (!fig) return;
                    const cap = fig.querySelector('.showcase-caption');
                    if (cap) cap.textContent = card.caption;
                    const media = fig.querySelector('.showcase-media');
                    const src = safeSrc(card.src);
                    let img = media.querySelector('img');
                    if (!src) { if (img) img.remove(); return; }
                    if (!img) { img = document.createElement('img'); media.appendChild(img); }
                    if (img.getAttribute('src') !== src) img.setAttribute('src', src);
                    img.alt = card.caption;
                });
            };
            const render = () => {
                const n = state.tabs.length;
                const tabs = state.tabs.map((t, i) => {
                    const cols = t.cols === 3 ? 3 : 4;
                    return '<button type="button" class="showcase-tab" role="tab" id="svc-tab-' + i + '" aria-selected="false" aria-controls="svc-showcase-panel" data-cols="' + cols + '" style="--col-count:' + cols + '"><span class="showcase-tab-label">' + esc(t.name) + '</span><span class="tab-track"><span class="tab-progress"></span></span></button>';
                }).join('');
                host.innerHTML = '<div class="showcase-head"><p class="showcase-eyebrow">' + esc(state.eyebrow) + '</p><h2 class="showcase-title" id="svc-showcase-title">' + esc(state.headline) + '</h2></div>'
                    + '<div class="showcase-tabs" role="tablist" style="--tab-count:' + n + '">' + tabs + '</div>'
                    + '<div class="showcase-grid" id="svc-showcase-panel" role="tabpanel" tabindex="0"></div>'
                    + '<div class="showcase-note"><span class="material-symbols-outlined" aria-hidden="true">' + iconName(state.icon) + '</span><p>' + esc(state.note) + '</p></div>';
            };
            const patch = () => {
                const eye = host.querySelector('.showcase-eyebrow');
                const title = host.querySelector('.showcase-title');
                if (eye) eye.textContent = state.eyebrow;
                if (title) title.textContent = state.headline;
                host.querySelectorAll('.showcase-tab').forEach((btn, i) => {
                    const tab = state.tabs[i];
                    if (!tab) return;
                    const cols = tab.cols === 3 ? 3 : 4;
                    btn.dataset.cols = String(cols);
                    btn.style.setProperty('--col-count', String(cols));
                    const lab = btn.querySelector('.showcase-tab-label');
                    if (lab) lab.textContent = tab.name;
                });
                const active = host.querySelectorAll('.showcase-tab')[state.index];
                if (active) applyCols(active);
                fillGrid(state.index);
                const icon = host.querySelector('.showcase-note .material-symbols-outlined');
                const note = host.querySelector('.showcase-note p');
                if (icon) icon.textContent = iconName(state.icon);
                if (note) note.textContent = state.note;
            };
            const stop = () => { clearTimeout(timer); timer = 0; running = false; };
            const go = i => {
                const tabs = [...host.querySelectorAll('.showcase-tab')];
                if (!tabs.length) return;
                state.index = ((i % tabs.length) + tabs.length) % tabs.length;
                tabs.forEach((tab, n) => {
                    const bar = tab.querySelector('.tab-progress');
                    const on = n === state.index;
                    tab.classList.toggle('is-active', on);
                    tab.setAttribute('aria-selected', on ? 'true' : 'false');
                    bar.style.transition = 'none';
                    bar.style.width = n < state.index ? '100%' : '0%';
                });
                const current = tabs[state.index];
                applyCols(current);
                fillGrid(state.index);
                const panel = host.querySelector('.showcase-grid');
                if (panel) panel.setAttribute('aria-labelledby', 'svc-tab-' + state.index);
                const bar = current.querySelector('.tab-progress');
                if (reduceMotion.matches) bar.style.width = '100%';
                else {
                    void bar.offsetWidth;
                    bar.style.transition = 'width ' + INTERVAL + 'ms linear';
                    bar.style.width = '100%';
                }
                clearTimeout(timer);
                timer = setTimeout(() => go(state.index + 1), INTERVAL);
                running = true;
            };
            const commitLive = () => { save(); if (host.querySelector('.showcase-tabs')) patch(); };
            const commitStructure = () => { save(); render(); go(state.index); };
            host.addEventListener('click', e => {
                const tab = e.target.closest('.showcase-tab');
                if (!tab || !host.contains(tab)) return;
                const i = [...host.querySelectorAll('.showcase-tab')].indexOf(tab);
                if (i < 0) return;
                stop();
                go(i);
            });
            const show = () => {
                const sec = document.getElementById('services');
                host.hidden = false;
                if (!host.querySelector('.showcase-tabs')) render();
                if (sec) {
                    sec.dataset.layout = 'showcase';
                    sec.setAttribute('aria-labelledby', 'svc-showcase-title');
                }
                if (!running) go(state.index || 0);
            };
            const hide = () => {
                stop();
                host.hidden = true;
                const sec = document.getElementById('services');
                if (sec) sec.setAttribute('aria-labelledby', 'svc-title');
            };
            const reset = () => {
                state = seed();
                state.index = 0;
                try { localStorage.removeItem('svcShowcase'); } catch (e) {}
                render();
                go(0);
                const panel = document.getElementById('panel-services');
                if (panel && panel.classList.contains('mode-content')) paintCopy(panel);
            };
            const field = (parent, name, value, onInput, opts) => {
                const lab = document.createElement('label');
                lab.className = 'kit-span-2';
                const cap = document.createElement('span');
                cap.className = 'kit-field-name';
                cap.textContent = name;
                const el = opts && opts.grow ? document.createElement('textarea') : document.createElement('input');
                if (opts && opts.grow) { el.className = 'kit-grow'; el.rows = 2; }
                if (opts && opts.max) el.maxLength = opts.max;
                el.value = value;
                el.addEventListener('input', () => {
                    onInput(el.value);
                    if (opts && opts.grow) {
                        el.style.height = 'auto';
                        el.style.height = Math.max(44, el.scrollHeight) + 'px';
                    }
                });
                lab.append(cap, el);
                parent.appendChild(lab);
                return el;
            };
            const mini = (label, onClick) => {
                const b = document.createElement('button');
                b.type = 'button';
                b.className = 'tier-btn';
                b.textContent = label;
                b.addEventListener('click', onClick);
                return b;
            };
            function paintCopy(panel) {
                let box = panel.querySelector(':scope > .kit-copy');
                if (!box) {
                    box = document.createElement('div');
                    box.className = 'kit-copy';
                    panel.appendChild(box);
                }
                box.replaceChildren();
                if (!host.querySelector('.showcase-tabs')) render();
                field(box, 'Eyebrow tag', state.eyebrow, v => { state.eyebrow = v; commitLive(); }, { max: 48 });
                field(box, 'Section headline', state.headline, v => { state.headline = v; commitLive(); }, { grow: true, max: 140 });
                const head = document.createElement('div');
                head.className = 'sc-row';
                const tabsLab = document.createElement('span');
                tabsLab.className = 'kit-field-name';
                tabsLab.textContent = 'Tab names';
                head.append(tabsLab, mini('Add tab', () => {
                    if (state.tabs.length >= 8) return;
                    state.tabs.push({ name: 'New tab', cols: 4, cards: [{ src: '', caption: 'New item' }] });
                    state.index = state.tabs.length - 1;
                    commitStructure();
                    paintCopy(panel);
                }));
                box.appendChild(head);
                state.tabs.forEach((tab, ti) => {
                    const block = document.createElement('div');
                    block.className = 'sc-tab-block';
                    field(block, 'Tab name', tab.name, v => { tab.name = v; commitLive(); }, { max: 32 });
                    const cols = document.createElement('div');
                    cols.className = 'sc-row';
                    const colsLab = document.createElement('span');
                    colsLab.className = 'kit-field-name';
                    colsLab.textContent = 'Columns';
                    cols.appendChild(colsLab);
                    [3, 4].forEach(n => {
                        const b = mini(String(n), () => {
                            tab.cols = n;
                            cols.querySelectorAll('.tier-btn').forEach(x => {
                                const on = x.textContent === String(n);
                                x.classList.toggle('active', on);
                                x.setAttribute('aria-pressed', String(on));
                            });
                            commitLive();
                        });
                        b.classList.toggle('active', tab.cols === n);
                        b.setAttribute('aria-pressed', String(tab.cols === n));
                        cols.appendChild(b);
                    });
                    block.appendChild(cols);
                    const row = document.createElement('div');
                    row.className = 'sc-row';
                    row.append(mini('Add card', () => {
                        if (tab.cards.length >= 8) return;
                        tab.cards.push({ src: '', caption: 'New item' });
                        if (state.index === ti) commitLive(); else save();
                        paintCopy(panel);
                    }));
                    if (state.tabs.length > 1) row.append(mini('Remove tab', () => {
                        state.tabs.splice(ti, 1);
                        state.index = Math.min(state.index, state.tabs.length - 1);
                        commitStructure();
                        paintCopy(panel);
                    }));
                    block.appendChild(row);
                    tab.cards.forEach((card, ci) => {
                        const cardBox = document.createElement('div');
                        cardBox.className = 'sc-card-block';
                        field(cardBox, 'Subtitle', card.caption, v => {
                            card.caption = v;
                            if (state.index === ti) commitLive(); else save();
                        }, { max: 120 });
                        const url = field(cardBox, 'Image URL', String(card.src).startsWith('data:') ? '' : card.src, v => {
                            card.src = safeSrc(v);
                            if (state.index === ti) commitLive(); else save();
                        }, { max: 2000 });
                        url.placeholder = String(card.src).startsWith('data:') ? 'Uploaded image' : 'https://';
                        url.spellcheck = false;
                        const drop = document.createElement('label');
                        drop.className = 'kit-drop';
                        drop.append(document.createTextNode('Upload image'));
                        const file = document.createElement('input');
                        file.type = 'file';
                        file.accept = 'image/*';
                        file.addEventListener('change', () => {
                            const f = file.files && file.files[0];
                            if (!f) return;
                            readImage(f).then(src => {
                                if (!src) return;
                                card.src = src;
                                url.value = '';
                                url.placeholder = 'Uploaded image';
                                if (state.index === ti) commitLive(); else save();
                                file.value = '';
                            });
                        });
                        drop.appendChild(file);
                        cardBox.appendChild(drop);
                        if (tab.cards.length > 1) {
                            const rm = document.createElement('div');
                            rm.className = 'sc-row';
                            rm.append(mini('Remove card', () => {
                                tab.cards.splice(ci, 1);
                                if (state.index === ti) commitLive(); else save();
                                paintCopy(panel);
                            }));
                            cardBox.appendChild(rm);
                        }
                        block.appendChild(cardBox);
                    });
                    box.appendChild(block);
                });
                field(box, 'Qualifier note', state.note, v => { state.note = v; commitLive(); }, { max: 180 });
                field(box, 'Qualifier icon', state.icon, v => { state.icon = iconName(v); commitLive(); }, { max: 40 });
            }
            window.__svcShowcase = { show, hide, reset, paintCopy };
        }
