import type {IProfileStatus} from '@util/profile';
import {describeSourceFileError, describeConvertedFileError} from '@util/uploadValidation';

export type UploadFileResult = {
    result: IProfileStatus;
    message: string;
};

export type ProcessImageUploadsResult = {
    ok: number;
    failed: {name: string; message: string}[];
    lastStatus?: IProfileStatus;
};

const TRANSIENT_UPLOAD_ERROR = /load failed|failed to fetch|networkerror|network error|fetch failed|server components render|timeout|aborterror|upload failed\. please try again/i;

export function isTransientUploadError(error: unknown): boolean {
    const name = error instanceof Error ? error.name : '';
    if (name === 'AbortError' || name === 'TimeoutError') return true;
    const message = error instanceof Error ? error.message : String(error ?? '');
    return TRANSIENT_UPLOAD_ERROR.test(message);
}

export function friendlyUploadError(error: unknown, label: string): string {
    if (isTransientUploadError(error)) {
        return `Could not reach the server for "${label}". Please try that photo again.`;
    }
    return error instanceof Error ? error.message : `Could not upload ${label}.`;
}

function wait(ms: number) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

async function uploadWithRetries(
    upload: (file: File) => Promise<UploadFileResult>,
    file: File,
    label: string,
    onProgress: (message: string) => void,
    attempts = 3,
): Promise<UploadFileResult> {
    let lastError: unknown;
    for (let attempt = 1; attempt <= attempts; attempt += 1) {
        try {
            if (attempt > 1) {
                onProgress(`Retrying ${label} (attempt ${attempt} of ${attempts})`);
            }
            return await upload(file);
        } catch (error: unknown) {
            lastError = error;
            if (!isTransientUploadError(error) || attempt === attempts) {
                throw error;
            }
            await wait(400 * attempt);
        }
    }
    throw lastError instanceof Error ? lastError : new Error(`Could not upload ${label}.`);
}

/**
 * Convert then upload one photo at a time so a single failure cannot
 * cancel the rest of a multi-select, and so progress text stays accurate.
 */
export async function processImageUploads(
    files: File[],
    deps: {
        convert(file: File): Promise<File>;
        upload(file: File): Promise<UploadFileResult>;
        onProgress(message: string): void;
    },
): Promise<ProcessImageUploadsResult> {
    const failed: {name: string; message: string}[] = [];
    let ok = 0;
    let lastStatus: IProfileStatus | undefined;
    const total = files.length;

    for (let i = 0; i < files.length; i += 1) {
        const file = files[i];
        const label = file.name || `image ${i + 1}`;
        try {
            const sourceError = describeSourceFileError(file);
            if (sourceError) throw new Error(sourceError);

            deps.onProgress(`Converting ${i + 1} of ${total}: ${label}`);
            const converted = await deps.convert(file);
            const convertedError = describeConvertedFileError(converted);
            if (convertedError) throw new Error(convertedError);

            deps.onProgress(`Uploading ${i + 1} of ${total}: ${label}`);
            const uploadResult = await uploadWithRetries(
                deps.upload,
                converted,
                label,
                deps.onProgress,
            );
            lastStatus = uploadResult.result;
            ok += 1;
        } catch (error: unknown) {
            failed.push({name: label, message: friendlyUploadError(error, label)});
        }
    }

    return {ok, failed, lastStatus};
}

export function summarizeImageUploads({ok, failed}: ProcessImageUploadsResult): {
    severity: 'success' | 'warning' | 'error';
    message: string;
} {
    if (ok === 0 && failed.length === 0) {
        return {severity: 'error', message: 'No images were selected.'};
    }
    if (failed.length === 0) {
        return {
            severity: 'success',
            message: `${ok} file${ok === 1 ? ' has' : 's have'} been uploaded`,
        };
    }
    const failText = failed.map((item) => item.message).join(' ');
    if (ok === 0) {
        return {severity: 'error', message: failText || 'There was an error uploading your files.'};
    }
    return {
        severity: 'warning',
        message: `${ok} uploaded. ${failed.length} could not be uploaded. ${failText}`,
    };
}
