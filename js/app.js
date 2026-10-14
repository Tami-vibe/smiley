if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then(r => r.forEach(reg => reg.unregister()));
}
import { sectorIcon, MS, setAutoBodyIcons, railIcons, mountWarHero, initMapbox } from './runtime.js';
import { readSiteData, writeSiteData } from './storage.js';
export { sectorIcon, MS, setAutoBodyIcons, railIcons, readSiteData, writeSiteData, mountWarHero, initMapbox };
