'use client';

import {InferAttributes} from 'sequelize';
import {UserFileUploadModel} from '@util/models';
import {IProfileStatus, IProfileStatusAction} from '@util/profile';
import React, {useCallback, useRef, useState} from 'react';
import {
    Alert,
    Box,
    Button,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography
} from '@mui/material';
import {ProfileUploadForm} from '@components/User/ProfileUploadForm';
import type {AlertColor} from '@mui/material/Alert';
import PaymentModal from '@components/Modal/PaymentModal';
import {useRouter} from 'next/navigation';
import {convertImageToJPG} from '@util/convertImg';
import {logClientError} from '@util/logActions';
import {processImageUploads, summarizeImageUploads} from '@util/uploadBatch';

interface ProfileUploadsProps {
    adminMode?: boolean,
    userUploads: UserFileUploadModel[],

    uploadFile(file: File): Promise<{ result: IProfileStatus, message: string }>;

    updateFile(file: InferAttributes<UserFileUploadModel>): Promise<{
        result: IProfileStatus, message: string
    }>

    deleteFile(fileID: number): Promise<{ result: IProfileStatus, message: string }>
    canRequestFeature?: boolean,
    lastFairYear?: number,
}

export function ProfileUploads({
                                   userUploads,
                                   uploadFile,
                                   updateFile,
                                   deleteFile,
                                   adminMode = false,
                                   canRequestFeature = false,
                                   lastFairYear,
                               }: ProfileUploadsProps) {
    const fileUploadCount = userUploads.length;
    const [message, setMessage] = useState<[AlertColor, string]>(['success', '']);
    const [showModal, setShowModal] = useState<'none' | IProfileStatusAction>('none');
    const [uploading, setUploading] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const uploadFilesRef = useRef<HTMLInputElement>(null);
    const uploadingRef = useRef(false);
    const router = useRouter();

    const handleUserProfileUpdate = useCallback((newStatus: IProfileStatus) => {
        const {action} = newStatus;
        if (action) {
            setShowModal(action);
        }
    }, []);

    const handleSelectedFiles = useCallback(async (fileList: FileList | File[]) => {
        const files = Array.from(fileList);
        if (files.length === 0 || uploadingRef.current) return;

        uploadingRef.current = true;
        setUploading(true);
        setMessage(['info', `Uploading ${files.length} file${files.length === 1 ? '' : 's'}...`]);
        try {
            const result = await processImageUploads(files, {
                convert: convertImageToJPG,
                upload: uploadFile,
                onProgress: (status) => setMessage(['info', status]),
            });
            const summary = summarizeImageUploads(result);
            setMessage([summary.severity, summary.message]);
            if (result.failed.length > 0) {
                await logClientError(`Upload issues: ${summary.message}`);
            }
            if (result.lastStatus) handleUserProfileUpdate(result.lastStatus);
            if (result.ok > 0) router.refresh();
        } catch (error: unknown) {
            const statusMessage = error instanceof Error
                ? error.message
                : 'There was an error uploading your files.';
            // eslint-disable-next-line no-console
            console.error('Error uploading files', error);
            setMessage(['error', statusMessage]);
            await logClientError(`Upload failed: ${statusMessage}`);
        } finally {
            uploadingRef.current = false;
            setUploading(false);
            if (uploadFilesRef.current) uploadFilesRef.current.value = '';
        }
    }, [handleUserProfileUpdate, router, uploadFile]);

    return (
        <>
            <Box
                className={`flex flex-col min-w-full gap-2 mx-auto p-3 border rounded ${
                    dragOver ? 'border-[color:var(--gold-color)] border-2' : 'border-gray-300'
                }`}
                onDragEnter={(e) => {
                    e.preventDefault();
                    if (!uploading) setDragOver(true);
                }}
                onDragOver={(e) => {
                    e.preventDefault();
                }}
                onDragLeave={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                }}
                onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    if (!uploading) {
                        handleSelectedFiles(e.dataTransfer.files).then();
                    }
                }}
            >

                <Typography component="h2">
                    Choose photos of your work
                </Typography>
                <Typography variant="body2">
                    JPG or phone photos are fine.
                </Typography>

                <Stack spacing={2}>
                    <label htmlFor="file-upload-multiple">
                        <Button
                            variant="outlined"
                            component="span"
                            color="secondary"
                            disabled={uploading}
                        >
                            {uploading ? 'Uploading…' : 'Click here to Upload multiple images'}
                        </Button>
                        <input
                            ref={uploadFilesRef}
                            style={{display: 'none'}}
                            id="file-upload-multiple"
                            type="file"
                            multiple
                            accept="image/*"
                            disabled={uploading}
                            onChange={(e) => {
                                e.stopPropagation();
                                if (e.target.files) {
                                    handleSelectedFiles(e.target.files).then();
                                }
                            }}
                        />
                    </label>
                </Stack>
            </Box>
            <Box className="flex flex-col min-w-full gap-2 mx-auto p-3 border border-gray-300 rounded">
                {adminMode && (
                    <Alert severity="warning">
                        Admin mode: You are editing these profile uploads on behalf of the user.
                    </Alert>
                )}
                {canRequestFeature && (
                    <Alert severity="info">
                        If you exhibited at the
                        {' '}
                        {lastFairYear}
                        {' '}
                        Art Fair, you can ask to feature a photo on the home page.
                        Checking the box and clicking Update Image sends a request. It will not
                        appear on the site until an organizer approves it.
                    </Alert>
                )}
                {adminMode && !canRequestFeature && (
                    <Alert severity="info">
                        This artist cannot request a home page feature (no last-year exhibition
                        payment or imported roster record).
                    </Alert>
                )}
                {message && message[1] && (
                    <Alert severity={message[0]} role="status">
                        {message[1]}
                    </Alert>
                )}

                <Typography component="h2">
                    Manage uploaded images
                </Typography>

                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow
                                className={`${fileUploadCount > 0 ? 'bg-green-700' : 'bg-amber-700'} [&_th]:bold [&_th]:text-white [&_th]:px-4 [&_th]:py-2`}
                            >
                                <TableCell colSpan={2}>
                                    File uploads:
                                    {' '}
                                    {fileUploadCount}
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {userUploads.map((fileUpload) => (
                                <ProfileUploadForm
                                    key={fileUpload.id}
                                    fileUpload={fileUpload}
                                    deleteFile={deleteFile}
                                    updateFile={updateFile}
                                    adminMode={adminMode}
                                    canRequestFeature={canRequestFeature}
                                    lastFairYear={lastFairYear}
                                />
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>

            <PaymentModal
                text={'Please pay the registration fee to submit your registration for review.'
                    + ' You will be notified when your registration is approved.'
                    + ' Profile details and images can still be changed after submission.'}
                title="Your Profile is complete."
                open={showModal === 'pay-fee-registration'}
                onClose={() => setShowModal('none')}
                onClick={() => {
                    setShowModal('none');
                    document.location.href = '/payment/registration';
                }}
            />
            <PaymentModal
                text="Please pay the booth fee to complete your registration."
                title="Your Artist Profile has been Approved."
                open={showModal === 'pay-fee-booth'}
                onClose={() => setShowModal('none')}
                onClick={() => {
                    setShowModal('none');
                    document.location.href = '/payment/booth';
                }}
            />
        </>
    );
}
