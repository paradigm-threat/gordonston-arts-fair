import dotenv from 'dotenv';
import {ensureDatabase} from '@util/database';
import {UserFileUploadModel} from '@util/models';
import {
    decodePathname,
    normalizePathFromUrl,
    parseDimensionsFromPathname,
    parseUserIdFromPathname,
} from '@util/blobPaths';
import {listBlobsUnder} from '@util/uploadCleanup';

// Load env vars from .env then .env.local (local overrides)
dotenv.config({path: ['.env', '.env.local', '../.env', '../.env.local'], override: true});

/**
 * Audit Vercel Blob storage against PostgreSQL records for uploaded user images.
 *
 * Features:
 * - Lists all blobs under `uploads/` and groups them by user id (first path segment after `uploads/`).
 * - Cross-references each user's blobs with rows in `user_file_uploads`.
 * - Reports:
 *    • Blobs that exist in storage but have NO corresponding DB row (by URL path).
 *    • DB rows whose blob no longer exists in storage.
 * - When --commit is provided, missing DB rows will be INSERTED automatically.
 * - Optional --user=<id> flag to scope to a single user's folder in blob storage and DB queries.
 *
 * Matching rule:
 * - We normalize both the blob's URL and the DB's `url` to their pathname (without the leading '/'),
 *   e.g., `uploads/123/800-600/image.jpg`.
 *
 * Usage examples:
 * - tsx scripts/audit-blobs.ts --commit
 * - tsx scripts/audit-blobs.ts --id=123 --commit
 * - tsx scripts/audit-blobs.ts --id 123
 * - tsx scripts/audit-blobs.ts -id 123
 * - npm run audit:blobs -- --id 149
 */

interface CLIOptions {
    userId?: number;
    commit: boolean;
}

function parseArgs(argv: string[]): CLIOptions {
    const opts: CLIOptions = {commit: false};
    for (let i = 2; i < argv.length; i++) {
        const a = argv[i];
        if (a === '--commit') {
            opts.commit = true;
        } else if (a.startsWith('--id=')) {
            const v = parseInt(a.split('=')[1] || '', 10);
            if (!Number.isNaN(v)) opts.userId = v;
        } else if (a === '--id') {
            const v = parseInt(argv[i + 1] || '', 10);
            if (!Number.isNaN(v)) opts.userId = v;
            i++;
        } else if (a === '-id') {
            const v = parseInt(argv[i + 1] || '', 10);
            if (!Number.isNaN(v)) opts.userId = v;
            i++;
        } else if (a.startsWith('-id=')) {
            const v = parseInt(a.split('=')[1] || '', 10);
            if (!Number.isNaN(v)) opts.userId = v;
        }
    }
    return opts;
}

async function main() {
    const {userId, commit} = parseArgs(process.argv);

    await ensureDatabase();

    const prefix = userId != null ? `uploads/${userId}/` : undefined;
    const blobs = await listBlobsUnder(prefix);

    const uploadBlobs = blobs.filter(b => b.pathname.startsWith('uploads/'));

    const blobsByUser = new Map<number, Array<{ pathname: string; url?: string; downloadUrl?: string }>>();
    for (const b of uploadBlobs) {
        const decodedPath = decodePathname(b.pathname);
        const uid = parseUserIdFromPathname(decodedPath);
        if (uid == null) continue;
        if (userId != null && uid !== userId) continue;
        const arr = blobsByUser.get(uid) || [];
        arr.push({...b, pathname: decodedPath});
        blobsByUser.set(uid, arr);
    }

    if (blobsByUser.size === 0) {
        console.log(userId != null
            ? `No blobs found under uploads/${userId}/`
            : 'No blobs found under uploads/');
        return;
    }

    let totalMissingInDb = 0;
    let totalMissingInBlob = 0;
    const insertedIds: number[] = [];

    for (const [uid, userBlobs] of blobsByUser.entries()) {
        console.log(`\n=== User ${uid} ===`);
        const rows = await UserFileUploadModel.findAll({where: {user_id: uid}});

        const dbPathSet = new Set<string>();
        const dbByPath = new Map<string, typeof rows[number]>();
        for (const r of rows) {
            const p = normalizePathFromUrl(r.url);
            if (p) {
                dbPathSet.add(p);
                dbByPath.set(p, r);
            }
        }

        const blobPathSet = new Set<string>();
        const blobByPath = new Map<string, { pathname: string; url?: string; downloadUrl?: string }>();
        for (const b of userBlobs) {
            const p = b.pathname.replace(/^\//, '');
            blobPathSet.add(p);
            blobByPath.set(p, b);
        }

        const missingInDb: string[] = [];
        for (const p of blobPathSet) {
            if (!dbPathSet.has(p)) missingInDb.push(p);
        }

        const missingInBlob: string[] = [];
        for (const p of dbPathSet) {
            if (!blobPathSet.has(p)) missingInBlob.push(p);
        }

        if (missingInDb.length === 0 && missingInBlob.length === 0) {
            console.log('No discrepancies found.');
            continue;
        }

        if (missingInDb.length) {
            totalMissingInDb += missingInDb.length;
            console.log(`Blobs present in storage but NOT in DB (${missingInDb.length}):`);
            for (const p of missingInDb) console.log(`  + ${p}`);

            if (commit) {
                console.log('Inserting missing blobs into DB...');
                for (const p of missingInDb) {
                    try {
                        const b = blobByPath.get(p)!;
                        const dims = parseDimensionsFromPathname(p);
                        const title = decodeURIComponent(dims.filename || p.split('/').pop() || 'Untitled');
                        const width = dims.width ?? 0;
                        const height = dims.height ?? 0;
                        const url = b.url || b.downloadUrl || `/${p}`;

                        const created = await UserFileUploadModel.create({
                            user_id: uid,
                            title,
                            description: '',
                            width,
                            height,
                            url,
                            feature: false,
                            featureApproved: false,
                            featureDeclined: false,
                        } as Parameters<typeof UserFileUploadModel.create>[0]);
                        insertedIds.push(created.id);
                        console.log(`  inserted id=${created.id} path=${p}`);
                    } catch (e) {
                        console.error(`  failed to insert for path=${p}:`, e);
                    }
                }
            } else {
                console.log('(commit mode) Skipping inserts.');
            }
        }

        if (missingInBlob.length) {
            totalMissingInBlob += missingInBlob.length;
            console.log(`DB rows referencing blobs MISSING from storage (${missingInBlob.length}):`);
            for (const p of missingInBlob) {
                const row = dbByPath.get(p);
                console.log(`  - ${p}${row ? ` (db id=${row.id})` : ''}`);
            }
            console.log('Note: Reporting only; no action taken for missing blob files.');
        }
    }

    console.log('\n=== Summary ===');
    console.log(`Blobs present but not in DB: ${totalMissingInDb}`);
    console.log(`DB rows pointing to missing blobs: ${totalMissingInBlob}`);
    if (insertedIds.length) {
        console.log(`Inserted DB ids: ${insertedIds.join(', ')}`);
    }
}

(async () => {
    try {
        await main();
    } catch (err) {
        console.error('Audit failed:', err);
        process.exitCode = 1;
    }
})();
