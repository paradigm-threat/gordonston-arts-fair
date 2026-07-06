export function decodePathname(pathname: string): string {
    const noLead = pathname.replace(/^\//, '');
    const parts = noLead.split('/').map(seg => {
        try {
            return decodeURIComponent(seg);
        } catch {
            return seg;
        }
    });
    return parts.join('/');
}

export function normalizePathFromUrl(url: string): string | null {
    if (!url || url === '#') return null;
    try {
        const u = new URL(url);
        const p = decodePathname(u.pathname);
        return p || null;
    } catch {
        return decodePathname(url) || null;
    }
}

export function parseUserIdFromPathname(pathname: string): number | null {
    const parts = pathname.split('/');
    if (parts.length < 2) return null;
    if (parts[0] !== 'uploads') return null;
    const id = parseInt(parts[1], 10);
    return Number.isFinite(id) ? id : null;
}

export function parseDimensionsFromPathname(pathname: string): {
    width?: number;
    height?: number;
    filename?: string;
} {
    const parts = pathname.split('/');
    if (parts.length >= 4) {
        const wh = parts[2];
        const [wStr, hStr] = (wh || '').split('-');
        const width = parseInt(wStr, 10);
        const height = parseInt(hStr, 10);
        const filename = parts.slice(3).join('/');
        return {
            width: Number.isFinite(width) ? width : undefined,
            height: Number.isFinite(height) ? height : undefined,
            filename,
        };
    }
    return {};
}

export function isValidUploadUrl(url: string | null | undefined): boolean {
    if (!url || url === '#') return false;
    const path = normalizePathFromUrl(url);
    return path != null && path.startsWith('uploads/');
}
