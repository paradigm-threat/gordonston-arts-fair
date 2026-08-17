'use server';

import {Op} from 'sequelize';
import {ensureDatabase} from '@util/database';
import {UserFileUploadModel, UserModel} from '@util/models';
import {validateAdminSession} from '@util/session';
import {addUserUserLogModel} from '@util/logActions';
import {HttpError} from '@util/exception/httpError';
import {displayArtistName, displayUploadTitle} from '@util/format';

export type FeaturedArtworkItem = {
    id: number;
    title: string;
    description: string;
    url: string;
    width: number;
    height: number;
    artistName: string;
};

export type FeaturedRequestItem = FeaturedArtworkItem & {
    userId: number;
    email: string;
    artistStatus: string;
    approved: boolean;
    declined: boolean;
    updatedAt: string | null;
};

function serializeArtwork(row: UserFileUploadModel): FeaturedArtworkItem {
    const user = row.user;
    return {
        id: row.id,
        title: displayUploadTitle(row.title),
        description: `${row.description || ''}`.trim(),
        url: row.url,
        width: row.width || 1,
        height: row.height || 1,
        artistName: displayArtistName(user),
    };
}

function serializeRequest(row: UserFileUploadModel): FeaturedRequestItem {
    const user = row.user;
    return {
        ...serializeArtwork(row),
        userId: row.user_id || user?.id || 0,
        email: `${user?.email || ''}`.toLowerCase(),
        artistStatus: `${user?.status || ''}`,
        approved: Boolean(row.featureApproved),
        declined: Boolean(row.featureDeclined),
        updatedAt: row.updatedAt ? new Date(row.updatedAt).toISOString() : null,
    };
}

const artistInclude = {
    model: UserModel,
    required: true,
    attributes: ['id', 'first_name', 'last_name', 'company_name', 'email', 'status'],
};

/** Public homepage: only photos the artist requested and an admin approved. */
export async function fetchApprovedFeaturedArtwork(): Promise<FeaturedArtworkItem[]> {
    await ensureDatabase();
    const rows = await UserFileUploadModel.findAll({
        where: {
            feature: true,
            featureApproved: true,
            url: {[Op.ne]: ''},
        },
        include: [artistInclude],
        order: [['updatedAt', 'DESC']],
    });
    return rows.map(serializeArtwork);
}

export async function fetchFeaturedPhotoQueue(): Promise<{
    pending: FeaturedRequestItem[];
    approved: FeaturedRequestItem[];
    declined: FeaturedRequestItem[];
}> {
    await validateAdminSession();
    await ensureDatabase();
    const requested = await UserFileUploadModel.findAll({
        where: {
            feature: true,
            url: {[Op.ne]: ''},
        },
        include: [artistInclude],
        order: [['updatedAt', 'DESC']],
    });
    const declinedRows = await UserFileUploadModel.findAll({
        where: {
            featureDeclined: true,
            featureApproved: false,
            url: {[Op.ne]: ''},
        },
        include: [artistInclude],
        order: [['updatedAt', 'DESC']],
    });
    const pending: FeaturedRequestItem[] = [];
    const approved: FeaturedRequestItem[] = [];
    requested.forEach((row) => {
        const item = serializeRequest(row);
        if (item.approved) approved.push(item);
        else pending.push(item);
    });
    return {
        pending,
        approved,
        declined: declinedRows.map(serializeRequest),
    };
}

export async function reviewFeaturedUpload(
    uploadId: number,
    action: 'approve' | 'decline' | 'unpublish',
): Promise<{message: string}> {
    await validateAdminSession();
    await ensureDatabase();

    const fileUpload = await UserFileUploadModel.findByPk(uploadId, {
        include: [artistInclude],
    });
    if (!fileUpload) throw HttpError.NotFound(`File ID not found: ${uploadId}`);

    const title = displayUploadTitle(fileUpload.title);
    if (action === 'approve') {
        await fileUpload.update({feature: true, featureApproved: true, featureDeclined: false});
        await addUserUserLogModel(
            fileUpload.user_id,
            'message',
            `Featured photo approved: ${title}`.slice(0, 256),
        );
        return {message: `Approved "${title}" for the home page.`};
    }
    if (action === 'unpublish') {
        await fileUpload.update({featureApproved: false, featureDeclined: false});
        await addUserUserLogModel(
            fileUpload.user_id,
            'message',
            `Featured photo removed from home page: ${title}`.slice(0, 256),
        );
        return {message: `Removed "${title}" from the home page. The artist's request is still pending.`};
    }
    await fileUpload.update({feature: false, featureApproved: false, featureDeclined: true});
    await addUserUserLogModel(
        fileUpload.user_id,
        'message',
        `Featured photo request declined: ${title}`.slice(0, 256),
    );
    return {message: `Declined the request for "${title}".`};
}
