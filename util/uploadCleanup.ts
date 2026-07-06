import {del, list} from '@vercel/blob';
import {UserFileUploadModel} from '@util/models';
import {decodePathname, isValidUploadUrl, normalizePathFromUrl} from '@util/blobPaths';

export async function deleteBlobUrl(url: string): Promise<void> {
    if (!isValidUploadUrl(url)) return;
    try {
        await del(url);
    } catch (error: unknown) {
        console.error('Error deleting blob:', url, error);
        throw error;
    }
}

export async function deleteUploadRecord(
    fileUpload: Pick<UserFileUploadModel, 'id' | 'url' | 'user_id'>
): Promise<void> {
    if (isValidUploadUrl(fileUpload.url)) {
        await deleteBlobUrl(fileUpload.url);
    }
    await UserFileUploadModel.destroy({
        where: {
            id: fileUpload.id,
            user_id: fileUpload.user_id,
        },
    });
}

export type BlobEntry = {
    pathname: string;
    url?: string;
    downloadUrl?: string;
};

export async function listBlobsUnder(prefix?: string): Promise<BlobEntry[]> {
    type ListResult = {
        blobs: Array<{ pathname?: string; url?: string; downloadUrl?: string }>;
        cursor?: string;
        hasMore: boolean;
    };
    const results: BlobEntry[] = [];
    let cursor: string | undefined;
    let hasMore = true;
    while (hasMore) {
        const page: ListResult = await list({cursor, prefix} as Parameters<typeof list>[0]);
        for (const b of page.blobs) {
            if (!b.pathname) continue;
            results.push({
                pathname: b.pathname,
                url: b.url,
                downloadUrl: b.downloadUrl,
            });
        }
        cursor = page.cursor;
        hasMore = page.hasMore;
    }
    return results;
}

export function buildDbPathSet(rows: Array<Pick<UserFileUploadModel, 'url'>>): Set<string> {
    const dbPathSet = new Set<string>();
    for (const row of rows) {
        if (!isValidUploadUrl(row.url)) continue;
        const path = normalizePathFromUrl(row.url);
        if (path) dbPathSet.add(path);
    }
    return dbPathSet;
}

export function buildBlobPathMap(blobs: BlobEntry[]): Map<string, BlobEntry> {
    const blobByPath = new Map<string, BlobEntry>();
    for (const blob of blobs) {
        const path = decodePathname(blob.pathname).replace(/^\//, '');
        if (path.startsWith('uploads/')) {
            blobByPath.set(path, {...blob, pathname: path});
        }
    }
    return blobByPath;
}
