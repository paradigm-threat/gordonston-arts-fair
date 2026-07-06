import dotenv from 'dotenv';
import {Op} from 'sequelize';
import {ensureDatabase} from '@util/database';
import {UserFileUploadModel, UserModel} from '@util/models';
import {UserStatus} from '@types';
import {isValidUploadUrl, normalizePathFromUrl} from '@util/blobPaths';
import {
    buildBlobPathMap,
    buildDbPathSet,
    deleteBlobUrl,
    deleteUploadRecord,
    listBlobsUnder,
} from '@util/uploadCleanup';

dotenv.config({path: ['.env', '.env.local', '../.env', '../.env.local'], override: true});

const RETAINED_UPLOAD_STATUSES: UserStatus[] = ['imported'];
const RESET_STATUS_STATUSES: UserStatus[] = [
    'declined',
    'standby',
    'submitted',
    'registered',
    'approved',
    'unregistered',
    'paid',
];

interface CLIOptions {
    commit: boolean;
    skipReconcile: boolean;
    reconcileOnly: boolean;
}

function parseArgs(argv: string[]): CLIOptions {
    const opts: CLIOptions = {commit: false, skipReconcile: false, reconcileOnly: false};
    for (let i = 2; i < argv.length; i++) {
        const arg = argv[i];
        if (arg === '--commit') opts.commit = true;
        else if (arg === '--dry-run') opts.commit = false;
        else if (arg === '--skip-reconcile') opts.skipReconcile = true;
        else if (arg === '--reconcile-only') opts.reconcileOnly = true;
    }
    return opts;
}

interface PhaseSummary {
    paidToImported: number;
    uploadsDeleted: number;
    statusesReset: number;
    orphanBlobsDeleted: number;
    staleDbRowsRemoved: number;
    errors: string[];
}

async function transitionPaidToImported(commit: boolean, summary: PhaseSummary) {
    const paidUsers = await UserModel.findAll({where: {status: 'paid'}});
    console.log(`\n=== Phase 1: paid → imported (${paidUsers.length} users) ===`);
    for (const user of paidUsers) {
        console.log(`  user ${user.id} (${user.email}): paid → imported`);
        if (commit) {
            await user.update({status: 'imported'});
        }
        summary.paidToImported++;
    }
}

async function deleteNonRetainedUploads(commit: boolean, summary: PhaseSummary) {
    const users = await UserModel.findAll({
        where: {
            type: 'user',
            status: {[Op.notIn]: RETAINED_UPLOAD_STATUSES},
        },
    });
    console.log(`\n=== Phase 2: delete uploads for non-retained users (${users.length} users) ===`);
    for (const user of users) {
        const uploads = await UserFileUploadModel.findAll({where: {user_id: user.id}});
        if (uploads.length === 0) continue;
        console.log(`  user ${user.id} (${user.email}, ${user.status}): ${uploads.length} upload(s)`);
        for (const upload of uploads) {
            if (commit) {
                try {
                    await deleteUploadRecord(upload);
                } catch (e: unknown) {
                    const msg = `Failed to delete upload ${upload.id} for user ${user.id}: ${e}`;
                    console.error(msg);
                    summary.errors.push(msg);
                }
            }
            summary.uploadsDeleted++;
        }
    }
}

async function resetNonRetainedStatuses(commit: boolean, summary: PhaseSummary) {
    const users = await UserModel.findAll({
        where: {
            status: {[Op.in]: RESET_STATUS_STATUSES},
            type: 'user',
        },
    });
    console.log(`\n=== Phase 3: reset statuses to registered (${users.length} users) ===`);
    for (const user of users) {
        console.log(`  user ${user.id} (${user.email}): ${user.status} → registered`);
        if (commit) {
            await user.update({status: 'registered'});
        }
        summary.statusesReset++;
    }
}

async function reconcileOrphans(commit: boolean, summary: PhaseSummary) {
    console.log('\n=== Phase 4: orphan blob + stale DB link reconciliation ===');

    const allBlobs = (await listBlobsUnder()).filter(b => b.pathname.startsWith('uploads/'));
    const blobByPath = buildBlobPathMap(allBlobs);
    const allRows = await UserFileUploadModel.findAll();
    const dbPathSet = buildDbPathSet(allRows);

    const orphanBlobPaths: string[] = [];
    for (const path of blobByPath.keys()) {
        if (!dbPathSet.has(path)) orphanBlobPaths.push(path);
    }

    console.log(`  orphan blobs in storage: ${orphanBlobPaths.length}`);
    for (const path of orphanBlobPaths) {
        const blob = blobByPath.get(path)!;
        const blobUrl = blob.url || blob.downloadUrl;
        console.log(`  - delete orphan blob: ${path}`);
        if (commit && blobUrl) {
            try {
                await deleteBlobUrl(blobUrl);
                summary.orphanBlobsDeleted++;
            } catch (e: unknown) {
                const msg = `Failed to delete orphan blob ${path}: ${e}`;
                console.error(msg);
                summary.errors.push(msg);
            }
        } else if (!commit) {
            summary.orphanBlobsDeleted++;
        }
    }

    const staleRows: UserFileUploadModel[] = [];
    for (const row of allRows) {
        if (!isValidUploadUrl(row.url)) {
            staleRows.push(row);
            continue;
        }
        const path = normalizePathFromUrl(row.url);
        if (!path || !blobByPath.has(path)) {
            staleRows.push(row);
        }
    }

    console.log(`  stale DB upload rows: ${staleRows.length}`);
    for (const row of staleRows) {
        console.log(`  - remove stale DB row id=${row.id} user=${row.user_id} url=${row.url || '(empty)'}`);
        if (commit) {
            try {
                if (isValidUploadUrl(row.url)) {
                    await deleteBlobUrl(row.url);
                }
                await UserFileUploadModel.destroy({where: {id: row.id}});
                summary.staleDbRowsRemoved++;
            } catch (e: unknown) {
                const msg = `Failed to remove stale DB row ${row.id}: ${e}`;
                console.error(msg);
                summary.errors.push(msg);
            }
        } else {
            summary.staleDbRowsRemoved++;
        }
    }
}

function printSummary(summary: PhaseSummary, commit: boolean) {
    console.log('\n=== Summary ===');
    console.log(`Mode: ${commit ? 'COMMIT' : 'DRY RUN'}`);
    console.log(`paid → imported: ${summary.paidToImported}`);
    console.log(`uploads deleted (phase 2): ${summary.uploadsDeleted}`);
    console.log(`statuses reset to registered: ${summary.statusesReset}`);
    console.log(`orphan blobs deleted: ${summary.orphanBlobsDeleted}`);
    console.log(`stale DB rows removed: ${summary.staleDbRowsRemoved}`);
    if (summary.errors.length) {
        console.log(`errors: ${summary.errors.length}`);
        for (const err of summary.errors) console.log(`  ${err}`);
    }
}

async function main() {
    const {commit, skipReconcile, reconcileOnly} = parseArgs(process.argv);
    const summary: PhaseSummary = {
        paidToImported: 0,
        uploadsDeleted: 0,
        statusesReset: 0,
        orphanBlobsDeleted: 0,
        staleDbRowsRemoved: 0,
        errors: [],
    };

    await ensureDatabase();

    if (!reconcileOnly) {
        await transitionPaidToImported(commit, summary);
        await deleteNonRetainedUploads(commit, summary);
        await resetNonRetainedStatuses(commit, summary);
    }

    if (!skipReconcile) {
        await reconcileOrphans(commit, summary);
    }

    printSummary(summary, commit);

    if (!commit) {
        console.log('\nNo changes made. Re-run with --commit to apply.');
    }
}

(async () => {
    try {
        await main();
    } catch (err) {
        console.error('Reset cycle failed:', err);
        process.exitCode = 1;
    }
})();
