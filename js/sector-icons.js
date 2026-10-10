/* Central icon dictionary. Auto-body overrides live here, not in each card. */
export const MS = {
                brand: 'palette', header: 'toolbar', icons: 'interests', hero: 'web_asset',
                services: 'handyman', about: 'history_edu', repairs: 'healing', more: 'widgets', type: 'text_fields',
                assets: 'perm_media', plus: 'add', page: 'description', all: 'home',
                templates: 'dashboard_customize', privacy: 'shield', terms: 'gavel', cookie: 'cookie',
                trust: 'verified', reviews: 'star', quote: 'request_quote', faq: 'help',
                promo: 'sell', contact: 'map', 'final-cta': 'ads_click', footer: 'bottom_navigation', home: 'home',
                emergency: 'emergency'
            };

export const railIcons = { override: {} };

export function setAutoBodyIcons(on) {
    railIcons.override = on
        ? { services: 'car_crash', repairs: 'shield_with_heart', emergency: 'car_repair' }
        : {};
}

export function sectorIcon(id) {
    return railIcons.override[id] || MS[id] || 'description';
}
