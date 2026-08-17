import {jpgFileName, getMaxImageWidth, describeSourceFileError} from '@util/uploadValidation';

function loadImage(objectUrl: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Could not read that image. Please try a JPEG or PNG.'));
        img.src = objectUrl;
    });
}

function canvasToJpegBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (!blob) reject(new Error('Could not convert this image.'));
            else resolve(blob);
        }, 'image/jpeg', quality);
    });
}

function fitMaxWidth(width: number, height: number, maxWidth: number) {
    if (width <= maxWidth) return {width, height};
    return {
        width: maxWidth,
        height: Math.max(1, Math.floor(height * (maxWidth / width))),
    };
}

export async function convertImageToJPG(file: File, quality: number = 0.95): Promise<File> {
    const sourceError = describeSourceFileError(file);
    if (sourceError) throw new Error(sourceError);

    const objectUrl = URL.createObjectURL(file);
    try {
        const img = await loadImage(objectUrl);
        const {width, height} = fitMaxWidth(img.width, img.height, getMaxImageWidth());
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Could not convert this image.');
        ctx.drawImage(img, 0, 0, width, height);
        const blob = await canvasToJpegBlob(canvas, quality);
        return new File([blob], jpgFileName(file.name), {type: 'image/jpeg'});
    } finally {
        URL.revokeObjectURL(objectUrl);
    }
}
