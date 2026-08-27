/**
 * Read a flash value from an Inertia page or flash event payload.
 * Inertia v2 stores one-time flash on `page.flash`; legacy shared flash lives in `page.props.flash`.
 *
 * @param {import('@inertiajs/core').Page | Record<string, unknown> | undefined} pageOrFlash
 * @param {string} key
 */
export function getInertiaFlashValue(pageOrFlash, key) {
    if (!pageOrFlash) {
        return undefined;
    }

    if (pageOrFlash[key] !== undefined && pageOrFlash[key] !== null) {
        return pageOrFlash[key];
    }

    const pageFlash = pageOrFlash.flash?.[key];
    if (pageFlash !== undefined && pageFlash !== null) {
        return pageFlash;
    }

    return pageOrFlash.props?.flash?.[key];
}
