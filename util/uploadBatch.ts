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
            const uploadResult = await deps.upload(converted);
            lastStatus = uploadResult.result;
            ok += 1;
        } catch (error: unknown) {
            const message = error instanceof Error
                ? error.message
                : `Could not upload ${label}.`;
            failed.push({name: label, message});
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
