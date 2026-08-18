/* eslint-disable no-console */

'use server';

import {put} from '@vercel/blob';
import {ensureDatabase} from '@util/database';
import {addUserUserLogModel} from '@util/logActions';
import {imageDimensionsFromData} from 'image-dimensions';
import {UserFileUploadModel, UserModel} from '@util/models';
import {UserStatus} from '@types';
import {getProfileStatus} from '@util/profile';
import {InferAttributes} from 'sequelize';
import {validateSession} from '@util/session';
import {HttpError, UnauthorizedError} from '@util/exception/httpError';
import {currentUser} from '@clerk/nextjs/server';
import {getEmailInfoServer, sendMail} from '@util/emailActions';
import {deleteUploadRecord} from '@util/uploadCleanup';
import {displayUploadTitle} from '@util/format';
import {describeConvertedFileError, sanitizeUploadFilename} from '@util/uploadValidation';
import {
    ArtistApprovedTemplate,
    ArtistDeclinedTemplate,
    ArtistStandbyTemplate,
    ArtistSubmittedTemplate
} from "@template/email";

// For currentUser()

export async function fetchProfileByID(userID: number): Promise<UserModel> {
    await ensureDatabase();

    const userRow = await UserModel.findByPk(userID);
    if (!userRow) throw new Error(`User ID not found: ${userID}`);
    return userRow;
}

export async function fetchProfileFromSession(): Promise<UserModel> {
    await validateSession();
    const user = await currentUser();
    if (!user) {
        throw new UnauthorizedError(
            'No user was provided by Clerk. Please contact the site administrator to resolve this issue.'
        );
    }
    const email = `${user.primaryEmailAddress?.emailAddress}`.toLowerCase() || null;
    // const phone = `${user.primaryPhoneNumber?.phoneNumber}`.replace(/\D/g, '') || null;
    if (!email) {
        throw new UnauthorizedError(
            'No email was provided by Clerk. Please contact the site administrator to resolve this issue.'
        );
    }
    return fetchOrCreateProfileByEmail(email);
}

export async function fetchOwnApplicationStatusForAgent() {
    try {
        const userProfile = await fetchProfileFromSession();
        const {status, uploads} = await fetchProfileStatus(userProfile);
        const {fetchTransactions} = await import('@util/transActions');
        const {hasPaidRegistrationThisCycle} = await import('@util/payments');
        const transactions = await fetchTransactions(userProfile.id);
        return {
            loggedIn: true as const,
            email: userProfile.email,
            status: status.status,
            complete: status.complete,
            formFilled: status.formFilled,
            message: status.message,
            action: status.action || null,
            photoCount: uploads.length,
            paidRegistrationThisCycle: hasPaidRegistrationThisCycle(transactions, userProfile.status),
            nextUrl: status.action === 'upload-files'
                ? '/profile/upload'
                : status.action === 'pay-fee-registration'
                    ? '/payment/registration'
                    : '/profile',
        };
    } catch {
        return {
            loggedIn: false as const,
            nextUrl: '/apply#registration',
        };
    }
}

export async function fetchOrCreateProfileByEmail(email: string): Promise<UserModel> {
    await ensureDatabase();

    // if (email) {
    const userRow = await UserModel.findOne({
        where: {
            email
        }
    });
    if (userRow) return userRow;
    // } else if (phone) {
    //   const userRow = await UserModel.findOne({
    //     where: {
    //       phone
    //     }
    //   });
    //   if (userRow) return userRow;
    // } else {
    //   throw new UnauthorizedError(
    //     'No phone or email was provided by Clerk.
    //     Please contact the site administrator to resolve this issue.'
    //   );
    // }

    const newUser = await UserModel.create({
        email,
        // phone,
        type: 'user',
        status: 'registered',
        created_at: new Date(),
        updated_at: new Date(),
    });

    await addUserUserLogModel(newUser.id, 'register', 'User registered via Clerk');

    return newUser;
}

async function isAdmin(): Promise<boolean> {
    const user = await currentUser();
    const userType = user?.publicMetadata?.type as string | undefined;
    return userType === 'admin';
}

async function assertOwnerOrAdmin(targetUserID: number): Promise<UserModel> {
    await validateSession();
    const admin = await isAdmin();
    if (admin) {
        return fetchProfileByID(targetUserID);
    }
    const sessionUser = await fetchProfileFromSession();
    if (sessionUser.id !== targetUserID) {
        throw HttpError.Forbidden('You are not authorized to perform this action');
    }
    return sessionUser;
}

export async function updateProfile(userID: number, updatedUserRow: InferAttributes<UserModel>) {
    const userProfile = await assertOwnerOrAdmin(userID);

    const updatedUserRowDB = await userProfile.update({
        ...updatedUserRow,
        ...(userProfile.status === 'imported' && ({
            status: 'registered',
        })),
        phone: `${updatedUserRow.phone || ''}`.replace(/\D/g, ''),
        phone2: `${updatedUserRow.phone2 || ''}`.replace(/\D/g, ''),
    });
    const {
        status: profileStatus,
    } = await fetchProfileStatus(userProfile);
    return {
        message: 'Profile updated successfully.',
        result: profileStatus,
        updatedUserRow: updatedUserRowDB.toJSON(),
    };
}

export async function fetchProfileStatus(userProfile: UserModel) {
    const userUploads = await fetchUserFiles(userProfile.id);
    const profileStatus = getProfileStatus(userProfile, userUploads);
    return {
        status: profileStatus,
        uploads: userUploads,
    };
}

export async function uploadFile(userID: number, file: File) {
    const userProfile = await assertOwnerOrAdmin(userID);
    await ensureDatabase();

    const convertedError = describeConvertedFileError(file);
    if (convertedError) throw HttpError.BadRequest(convertedError);

    const imagePath = `uploads/${userProfile.id}`;
    const bytes = new Uint8Array(await file.arrayBuffer());
    const imageDimensions = imageDimensionsFromData(bytes);
    if (!imageDimensions) {
        throw HttpError.BadRequest('Could not read that image. Please try a JPEG or PNG.');
    }
    const {width, height} = imageDimensions;
    const safeName = sanitizeUploadFilename(file.name);
    const fileName = `${width}-${height}/${Date.now()}-${safeName}`;

    const created = await UserFileUploadModel.create({
        user_id: userProfile.id,
        title: displayUploadTitle(safeName),
        description: '',
        width,
        height,
        url: '',
        feature: false,
        featureApproved: false,
        featureDeclined: false,
    });

    console.log('Preparing to store file: ', fileName, width, height, 'db id=', created.id);

    try {
        const contentType = file.type?.startsWith('image/') ? file.type : 'image/jpeg';
        const putResult = await put(`${imagePath}/${fileName}`, Buffer.from(bytes), {
            access: 'public',
            contentType,
            allowOverwrite: true
        });
        await created.update({ url: putResult.url });
        console.log('Upload succeeded and DB updated for id=', created.id);
    } catch (err) {
        console.error('Upload failed for db id=', created.id, err);
        try {
            await UserFileUploadModel.destroy({
                where: {id: created.id, user_id: userProfile.id},
            });
        } catch (cleanupError) {
            console.error('Could not remove incomplete upload row', created.id, cleanupError);
        }
        throw new Error('Upload failed. Please try again.');
    }

    const {
        status: profileStatus,
    } = await fetchProfileStatus(userProfile);

    return {
        message: 'File uploaded successfully.',
        result: profileStatus,
    };
}

export async function deleteFile(userID: number, fileID: number) {
    const userProfile = await assertOwnerOrAdmin(userID);

    const fileUpload = await UserFileUploadModel.findOne({
        where: {
            id: fileID,
            user_id: userProfile.id,
        }
    });
    if (!fileUpload) throw new Error(`File ID not found: ${fileID}`);

    await deleteUploadRecord(fileUpload);

    const {
        status: profileStatus,
    } = await fetchProfileStatus(userProfile);
    return {
        message: 'File deleted successfully',
        result: profileStatus,
    };
}

export async function updateFile(userID: number, updatedFile: InferAttributes<UserFileUploadModel>) {
    const userProfile = await assertOwnerOrAdmin(userID);
    if (updatedFile.user_id && updatedFile.user_id !== userProfile.id) {
        throw HttpError.Forbidden('You are not authorized to update this file');
    }

    await ensureDatabase();

    const fileUpload = await UserFileUploadModel.findByPk(updatedFile.id);
    if (!fileUpload) throw new Error(`File ID not found: ${updatedFile.id}`);

    if (fileUpload.user_id !== userProfile.id) {
        throw HttpError.Forbidden('You are not authorized to update this file');
    }

    const requestedFeature = Boolean(updatedFile.feature);
    const wasRequested = Boolean(fileUpload.feature);
    const wasApproved = Boolean(fileUpload.featureApproved);
    if (requestedFeature && !wasRequested) {
        const {fetchTransactions} = await import('@util/transActions');
        const {canRequestWebsiteFeature} = await import('@util/payments');
        const transactions = await fetchTransactions(userProfile.id);
        if (!canRequestWebsiteFeature(transactions, userProfile.status)) {
            throw HttpError.Forbidden(
                'Home page featuring is for artists who exhibited at last year\'s Art Fair.'
            );
        }
    }

    await fileUpload.update({
        title: updatedFile.title,
        description: updatedFile.description,
        feature: requestedFeature,
        featureApproved: requestedFeature && wasRequested && wasApproved,
        featureDeclined: requestedFeature
            ? false
            : (wasRequested ? false : Boolean(fileUpload.featureDeclined)),
    });

    const {
        status: profileStatus,
    } = await fetchProfileStatus(userProfile);

    let message = 'File description updated successfully';
    if (!requestedFeature && wasRequested) {
        message = 'This photo will not appear on the home page.';
    } else if (requestedFeature && !wasApproved) {
        message = 'Your request to feature this photo is saved. It will not appear on the home page until we review it.';
    }

    return {
        message,
        result: profileStatus,
    };
}

export async function fetchUserFiles(userID: number) {
    await ensureDatabase();

    return UserFileUploadModel.findAll({
        where: {user_id: userID},
        order: [['createdAt', 'DESC']]
    });
}

export async function updateUserStatus(
    userID: number,
    newStatus: UserStatus,
    message: string,
    sendTemplate: boolean = true
) {
    await ensureDatabase();
    const userProfile = await fetchProfileByID(userID);
    await UserModel.update(
        {
            status: newStatus,
            updated_at: new Date()
        },
        {
            where: {id: userProfile.id}
        }
    );

    // Add a log entry
    await addUserUserLogModel(userID, 'status-change', message);

    if (sendTemplate && userProfile.email) {
        try {
            const Template = await getUserStatusTemplate(userID, newStatus);
            if (Template) {
                const emailResult = await sendMail(Template);
                await addUserUserLogModel(
                    userID,
                    emailResult.status === 'error' ? 'error' : 'message',
                    emailResult.message
                );
                return {
                    message: emailResult.status === 'error'
                        ? `Status updated successfully to ${newStatus}. ${emailResult.message}`
                        : `Status updated successfully to ${newStatus}. Email sent to artist.`,
                };
            }
            return {
                message: `Status updated successfully to ${newStatus}. No Email template is associate with status change.`,
            };
        } catch (error) {
            const errMessage = error instanceof Error ? error.message : 'Unknown email error';
            await addUserUserLogModel(userID, 'error', `Status updated to ${newStatus}, but email failed: ${errMessage}`);
            return {
                message: `Status updated successfully to ${newStatus}. Email failed: ${errMessage}`,
            };
        }
    }

    return {
        message: `Status updated successfully to ${newStatus}. No Email was sent`,
    };
}

export async function getUserStatusTemplate(userID: number, status: UserStatus) {
    await ensureDatabase();
    const userProfile = await fetchProfileByID(userID);
    switch (status) {
        case 'submitted':
            return getEmailInfoServer(userProfile.email, ArtistSubmittedTemplate);
        case 'approved':
            return getEmailInfoServer(userProfile.email, ArtistApprovedTemplate);
        case 'standby':
            return getEmailInfoServer(userProfile.email, ArtistStandbyTemplate);
        case 'declined':
            return getEmailInfoServer(userProfile.email, ArtistDeclinedTemplate);
        default:
            return null;
    }
}

export async function updateUsersStatusBulk(
    userIDs: number[],
    newStatus: UserStatus,
    sendTemplate: boolean = true
) {
    await ensureDatabase();
    const results: { userID: number; ok: boolean; message: string }[] = [];
    for (const userID of userIDs) {
        try {
            const res = await updateUserStatus(
                userID,
                newStatus,
                `${newStatus} set by admin bulk action`,
                sendTemplate
            );
            results.push({ userID, ok: true, message: res.message });
        } catch (e: any) {
            results.push({ userID, ok: false, message: e.message });
        }
    }
    const successCount = results.filter(r => r.ok).length;
    const failCount = results.length - successCount;
    return {
        message: `Updated ${successCount} users to ${newStatus}${sendTemplate ? ' with emails' : ''}${failCount ? `; ${failCount} failed` : ''}.`
    };
}
