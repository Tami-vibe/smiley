/* JSON save/restore for localStorage site_data. No other keys. */
const KEY = 'site_data';

export function readSiteData() {
    try {
        return JSON.parse(localStorage.getItem(KEY) || 'null');
    } catch (e) {
        return null;
    }
}

export function writeSiteData(data) {
    try {
        localStorage.setItem(KEY, JSON.stringify(data));
    } catch (e) { /* private mode */ }
}

/* Trailing debounce for a writer that reads the DOM: rapid input coalesces into one
   traversal. `run` must stay side-effect free until it fires, because the snapshot is
   taken when it fires, not when it was scheduled. `flush()` is the no-data-loss path. */
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
