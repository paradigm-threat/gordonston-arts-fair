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
import {convertImageToJPG} from "@util/convertImg";
import {logClientError} from '@util/logActions';

interface ProfileUploadsProps {
    adminMode?: boolean,
    userUploads: UserFileUploadModel[],

    uploadFile(file: File): Promise<{ result: IProfileStatus, message: string }>;

    updateFile(file: InferAttributes<UserFileUploadModel>): Promise<{
        result: IProfileStatus, message: string
    }>

    deleteFile(fileID: number): Promise<{ result: IProfileStatus, message: string }>
}

export function ProfileUploads({
                                   userUploads,
                                   uploadFile,
                                   updateFile,
                                   deleteFile,
                                   adminMode = false,
                               }: ProfileUploadsProps) {
    const fileUploadCount = userUploads.length;
    // const [status, setStatus] = useState<'ready' | 'unsaved' | 'updating' | 'error'>('ready');
    const [message, setMessage] = useState<[AlertColor, string]>(['success', '']);
    const [showModal, setShowModal] = useState<'none' | IProfileStatusAction>('none');
    const uploadFilesRef = useRef<HTMLInputElement>(null);
    // const hasTriggeredUpload = useRef(false);

    const router = useRouter();
    const handleUserProfileUpdate = useCallback((newStatus: IProfileStatus) => {
        const {
            // complete: isUpdatedProfileComplete,
            action
        } = newStatus;
        if (action) {
            setShowModal(action);
        }
    }, []);

    // useEffect(() => {
    //   setTimeout(() => {
    //     if (fileUploadCount === 0 && !hasTriggeredUpload.current) {
    //       hasTriggeredUpload.current = true;
    //       uploadFilesRef.current?.click();
    //     }
    //   }, 1000);
    // }, [fileUploadCount]);

    return (
        <>
            <Box className="flex flex-col min-w-full gap-2 mx-auto p-3 border border-gray-300 rounded">

                <Typography component="h2">
                    Upload new images
                </Typography>

                <Stack spacing={2}>
                    <label htmlFor="file-upload-multiple">
                        <Button
                            variant="outlined"
                            component="span"
                            color="secondary"
                        >
                            Click here to Upload multiple images
                        </Button>
                        <input
                            ref={uploadFilesRef}
                            style={{display: 'none'}}
                            id="file-upload-multiple"
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={async (e) => {
                                e.stopPropagation();
                                const input = e.target;
                                if (input && input.files) {
                                    let count = 0;
                                    const errorCount = 0;
                                    // setStatus('updating');
                                    setMessage(['info', `Uploading ${input.files.length} files...`]);
                                    let lastStatus: IProfileStatus | undefined;
                                    try {
                                        await Promise.all(Array.from(input.files).map(async (file) => {
                                            let convertedFile = file;
                                            // if (file.size > 1024 * 1024 * 5) {
                                            setMessage(['info', `Converting ${file.name} to JPG...`]);
                                            convertedFile = await convertImageToJPG(file);
                                            // }
                                            setMessage(['info', `Uploading ${file.name}...`]);
                                            const uploadResult = await uploadFile(convertedFile);
                                            lastStatus = uploadResult.result;
                                            count += 1;
                                            // } else {
                                            //   errorCount += 1;
                                            //   setMessage(['error', `File ${file.name} must be less than 5MB. Skipping ${file.name}`]);
                                            // }
                                        }));
                                    } catch (error: unknown) {
                                        const statusMessage = error instanceof Error
                                            ? error.message
                                            : 'There was an error uploading your files.';
                                        // eslint-disable-next-line no-console
                                        console.error('Error uploading files', error);
                                        setMessage(['error', statusMessage]);
                                        await logClientError(`Upload failed: ${statusMessage}`);
                                        return;
                                    }
                                    // setStatus('ready');
                                    e.target.value = '';
                                    if (count === 0) {
                                        setMessage(['error', 'There was an error uploading your files.']);
                                        return;
                                    }
                                    if (errorCount > 0) {
                                        setMessage(['info', 'There was an error uploading some of your files.']);
                                    } else {
                                        setMessage(['success', `${count} file${count === 1 ? ' has been' : 's have been'} uploaded`]);
                                    }

                                    if (lastStatus) handleUserProfileUpdate(lastStatus);

                                    router.refresh();
                                    // if (updatedUserProfile) {
                                    //   setUserProfileClient((oldProfile) => ({
                                    //     ...oldProfile,
                                    //     ...updatedUserProfile
                                    //   }));
                                    // }
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
                {message && message[1] && (
                    <Alert severity={message[0]}>
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
                                    // uploadHooks={formUploadList}
                                    deleteFile={deleteFile}
                                    updateFile={updateFile}
                                    adminMode={adminMode}
                                    // onUpdate={handleUserProfileUpdate}
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
