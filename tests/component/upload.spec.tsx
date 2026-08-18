import {test, expect} from '@playwright/experimental-ct-react';
import {
    jpgFileName,
    sanitizeUploadFilename,
    isBlockedUploadType,
    describeSourceFileError,
    isJpegBytes,
    describeJpegBytesError,
} from '@util/uploadValidation';
import {processImageUploads, summarizeImageUploads, isTransientUploadError} from '@util/uploadBatch';
import type {IProfileStatus} from '@util/profile';
import {ConvertProbe} from './ConvertProbe';

test.describe('upload filename hardening', () => {
    test('strips stacked image extensions instead of appending .jpg', () => {
        expect(jpgFileName('photo.jpeg')).toBe('photo.jpg');
        expect(jpgFileName('photo.jpeg.jpg')).toBe('photo.jpg');
        expect(jpgFileName('My_Art.PNG')).toBe('My_Art.jpg');
    });

    test('keeps blob paths inside the uploads folder', () => {
        expect(sanitizeUploadFilename('../../etc/passwd.png')).toBe('passwd.jpg');
        expect(sanitizeUploadFilename('my photo (1).jpeg')).toBe('my-photo-1.jpg');
        expect(sanitizeUploadFilename('')).toBe('image.jpg');
    });

    test('rejects SVG and script-like uploads', () => {
        expect(isBlockedUploadType('image/svg+xml', 'art.svg')).toBe(true);
        expect(isBlockedUploadType('text/html', 'photo.html')).toBe(true);
        expect(isBlockedUploadType('image/jpeg', 'booth.jpg')).toBe(false);
        expect(describeSourceFileError(new File([], 'empty.jpg', {type: 'image/jpeg'})))
            .toMatch(/empty/i);
        expect(isJpegBytes(Uint8Array.from([0xff, 0xd8, 0xff, 0xe0]))).toBe(true);
        expect(describeJpegBytesError(Uint8Array.from([0x89, 0x50, 0x4e, 0x47])))
            .toMatch(/not a JPEG/i);
    });
});

test.describe('multi-upload batch', () => {
    const profileStatus: IProfileStatus = {
        status: 'registered',
        message: 'ok',
        complete: true,
        formFilled: true,
    };

    test('continues after one file fails', async () => {
        const result = await processImageUploads([
            new File([new Uint8Array([1])], 'bad.svg', {type: 'image/svg+xml'}),
            new File([new Uint8Array([1, 2, 3])], 'good.png', {type: 'image/png'}),
        ], {
            convert: async (file) => file,
            upload: async (file) => ({result: profileStatus, message: file.name}),
            onProgress: () => undefined,
        });

        expect(result.ok).toBe(1);
        expect(result.failed).toHaveLength(1);
        expect(result.failed[0].name).toBe('bad.svg');
        const summary = summarizeImageUploads(result);
        expect(summary.severity).toBe('warning');
        expect(summary.message).toMatch(/1 uploaded/);
    });

    test('reports success in the same wording as before', async () => {
        const result = await processImageUploads([
            new File([new Uint8Array([1, 2, 3])], 'one.png', {type: 'image/png'}),
        ], {
            convert: async (file) => file,
            upload: async () => ({result: profileStatus, message: 'ok'}),
            onProgress: () => undefined,
        });
        expect(summarizeImageUploads(result).message).toBe('1 file has been uploaded');
    });

    test('retries a dropped server-action fetch then succeeds', async () => {
        let attempts = 0;
        const result = await processImageUploads([
            new File([new Uint8Array([1, 2, 3])], 'booth.png', {type: 'image/png'}),
        ], {
            convert: async (file) => file,
            upload: async () => {
                attempts += 1;
                if (attempts < 3) throw new TypeError('Load failed');
                return {result: profileStatus, message: 'ok'};
            },
            onProgress: () => undefined,
        });
        expect(attempts).toBe(3);
        expect(result.ok).toBe(1);
        expect(result.failed).toHaveLength(0);
    });

    test('does not retry invalid source files', async () => {
        let uploads = 0;
        const result = await processImageUploads([
            new File([new Uint8Array([1])], 'art.svg', {type: 'image/svg+xml'}),
        ], {
            convert: async (file) => file,
            upload: async () => {
                uploads += 1;
                return {result: profileStatus, message: 'ok'};
            },
            onProgress: () => undefined,
        });
        expect(uploads).toBe(0);
        expect(result.ok).toBe(0);
        expect(result.failed[0].message).toMatch(/not a photo/i);
        expect(isTransientUploadError(new TypeError('Load failed'))).toBe(true);
        expect(isTransientUploadError(new Error('Could not read that image. Please try a JPEG or PNG.'))).toBe(false);
    });
});

test.describe('JPEG conversion', () => {
    test('converts a PNG without stacking extensions', async ({mount, page}) => {
        await mount(<ConvertProbe />);
        await expect(page.getByText('studio.jpg image/jpeg ok')).toBeVisible();
    });
});
