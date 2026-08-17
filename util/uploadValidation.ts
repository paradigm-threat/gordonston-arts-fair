export const MAX_SOURCE_BYTES = 40 * 1024 * 1024;
export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

const IMAGE_EXTENSIONS = /(\.jpe?g|\.png|\.webp|\.gif|\.heic|\.heif|\.svg)+$/ig;
const BLOCKED_TYPE = /svg|html|xml|javascript|pdf|text\//i;
const BLOCKED_NAME = /\.(svg|html?|xml|js|mjs|pdf|php|exe|sh)(\.|$)/i;

export function getMaxImageWidth(): number {
    const parsed = parseInt(process.env.NEXT_PUBLIC_MAX_IMAGE_WIDTH || '1024', 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 1024;
}

export function stripImageExtension(name: string): string {
    return `${name || ''}`.replace(IMAGE_EXTENSIONS, '').trim();
}

export function jpgFileName(originalName: string): string {
    const leaf = `${originalName || ''}`.replace(/\\/g, '/').split('/').pop() || '';
    const base = stripImageExtension(leaf) || 'image';
    return `${base}.jpg`;
}

export function sanitizeUploadFilename(originalName: string): string {
    const jpg = jpgFileName(originalName);
    const safe = jpg
        .replace(/[^a-zA-Z0-9._-]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^[.-]+/, '')
        .replace(/\.jpg$/i, '')
        .replace(/-+$/g, '')
        .slice(0, 120);
    return `${safe || 'image'}.jpg`;
}

export function isBlockedUploadType(type?: string, name?: string): boolean {
    if (type && BLOCKED_TYPE.test(type)) return true;
    if (name && BLOCKED_NAME.test(name)) return true;
    return false;
}

export function describeSourceFileError(file: File): string | null {
    if (!file || file.size <= 0) return `"${file?.name || 'file'}" is empty.`;
    if (isBlockedUploadType(file.type, file.name)) {
        return `"${file.name}" is not a photo. Please choose a JPEG, PNG, WebP, or GIF.`;
    }
    if (file.size > MAX_SOURCE_BYTES) {
        return `"${file.name}" is too large. Please choose a smaller photo.`;
    }
    return null;
}

export function describeConvertedFileError(file: File): string | null {
    if (!file || file.size <= 0) return 'The converted image was empty.';
    if (file.size > MAX_UPLOAD_BYTES) return 'The converted image is still too large to upload.';
    if (isBlockedUploadType(file.type, file.name)) return 'Please upload a photo (JPEG, PNG, WebP, or GIF).';
    return null;
}
