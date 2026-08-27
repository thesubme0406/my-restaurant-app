/**
 * Resolve Laravel route names for staff vs admin URL prefixes.
 *
 * @param {string} url - Current page URL (e.g. from usePage().url)
 * @param {Record<string, string>} suffixByKey - e.g. { inventoryStore: 'inventory.store' }
 * @returns {Record<string, string>} Full route names
 */
export function staffOrAdminRouteNames(url, suffixByKey) {
    const path = typeof url === 'string' ? url.split('?')[0] : '';
    const prefix = path.startsWith('/admin') ? 'admin' : 'staff';
    const routes = {};
    for (const [key, suffix] of Object.entries(suffixByKey)) {
        routes[key] = `${prefix}.${suffix}`;
    }
    return routes;
}

export function inventoryRouteNames(url) {
    return staffOrAdminRouteNames(url, {
        inventoryStore: 'inventory.store',
        inventoryUpdate: 'inventory.update',
        inventoryDestroy: 'inventory.destroy',
    });
}

export function purchaseRouteNames(url) {
    return staffOrAdminRouteNames(url, {
        purchaseStore: 'purchase.store',
    });
}

export function importRouteNames(url) {
    return staffOrAdminRouteNames(url, {
        importStore: 'import.store',
    });
}
