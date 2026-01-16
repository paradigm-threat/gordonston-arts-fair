'use client';

import {
    Alert,
    Box,
    Button,
    MenuItem,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField
} from '@mui/material';
import React, { useMemo, useRef, useState } from 'react';
import type { AlertColor } from '@mui/material/Alert';
import Mail from 'nodemailer/lib/mailer';
import { useRouter } from 'next/navigation';
import { templateList } from '@template/email';
import { UserModel } from '@util/models';
import { MailResult } from '@types';
import SelectField from '@components/FormFields/SelectField';
import { renderReactNodeToString } from "@util/emailClient";

interface SendEmailAdminProps {
    sendMail(options: Mail.Options): Promise<MailResult>,

    userProfile?: UserModel,
    initialEmails?: string
}

function parseEmails(input: string): { valid: string[]; invalid: string[] } {
    const raw = `${input || ''}`
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);
    const unique = Array.from(new Set(raw));
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const valid: string[] = [];
    const invalid: string[] = [];
    unique.forEach((e) => (emailRegex.test(e) ? valid.push(e) : invalid.push(e)));
    return { valid, invalid };
}

export default function SendEmailAdmin({
    sendMail,
    userProfile,
    initialEmails
}: SendEmailAdminProps) {
    const userEmail = userProfile?.email || initialEmails || '';
    const userStatus = userProfile?.status;
    const [status, setStatus] = useState<'ready' | 'submitting'>('ready');
    const [message, setMessage] = useState<[AlertColor, string]>(['info', '']);
    const [email, setEmail] = useState(userEmail);
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [sentSuccessful, setSentSuccessful] = useState(false);
    const formRef = useRef<HTMLFormElement>(null);
    const router = useRouter();

    const { valid: validRecipients, invalid: invalidRecipients } = useMemo(() => parseEmails(email), [email]);

    let buttonLabel = 'Send Email';
    if (status === 'submitting') buttonLabel = 'Sending…';
    else if (sentSuccessful) buttonLabel = 'Sent Successfully';

    return (
        <Box className="flex flex-col min-w-full m-auto p-6 rounded-2xl border-2 border-[#ccca]">
            <form
                method="post"
                ref={formRef}
                action={async () => {
                    setStatus('submitting');

                    try {
                        // Validate inputs
                        if (!subject.trim()) {
                            setMessage(['error', 'Subject is required.']);
                            return;
                        }
                        if (!body.trim()) {
                            setMessage(['error', 'Body is required.']);
                            return;
                        }

                        if (invalidRecipients.length > 0) {
                            setMessage(['error', `Invalid email addresses: ${invalidRecipients.join(', ')}`]);
                            return;
                        }
                        if (validRecipients.length === 0) {
                            setMessage(['error', 'Please provide at least one valid recipient email.']);
                            return;
                        }

                        const failed: { email: string; error: string }[] = [];
                        for (const to of validRecipients) {
                            try {
                                const { status: s, message: m } = await sendMail({
                                    to,
                                    // html: body,
                                    text: body,
                                    subject,
                                });
                                if (s !== 'success') failed.push({ email: to, error: m });
                            } catch (err: unknown) {
                                const errorMsg = err instanceof Error ? err.message : 'Unknown error';
                                failed.push({ email: to, error: errorMsg });
                            }
                        }

                        const successCount = validRecipients.length - failed.length;
                        if (failed.length === 0) {
                            setMessage(['success', `Sent ${successCount} email${successCount === 1 ? '' : 's'} successfully.`]);
                            setSentSuccessful(true);
                        } else if (successCount > 0) {
                            setMessage(['warning', `Sent ${successCount}/${validRecipients.length}. Failed: ${failed.map(f => `${f.email} (${f.error})`).join('; ')}`]);
                        } else {
                            setMessage(['error', `Failed to send emails to: ${failed.map(f => `${f.email} (${f.error})`).join('; ')}`]);
                        }
                    } catch (e: unknown) {
                        setMessage(['error', (e as Error).message]);
                    } finally {
                        setStatus('ready');
                        formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
                        router.refresh(); // Refresh the current page
                    }
                }}
            >
                {message && message[1] && (
                    <Alert severity={message[0]}>
                        {message[1]}
                    </Alert>
                )}

                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow className="bg-blue-700 [&_th]:bold [&_th]:text-white [&_th]:px-4 [&_th]:py-2">
                                <TableCell colSpan={2}>Send batched emails using templates</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            <TableRow>
                                <TableCell component="th" scope="row">
                                    Template
                                </TableCell>
                                <TableCell>
                                    <SelectField
                                        name="template"
                                        label="Template"
                                        fullWidth
                                        variant="outlined"
                                        value={userStatus || ''}
                                        disabled={status === 'submitting' || sentSuccessful}
                                        onChange={(e) => {
                                            setBody('');
                                            setSubject('');
                                            const templateID = e.target.value as number;
                                            if (templateList[templateID]) {
                                                const template = templateList[templateID];
                                                if (template) {
                                                    const { default: MDXComponent } = template;
                                                    // const emailOptions = getEmailInfo(userProfile.email, template);
                                                    setBody(renderReactNodeToString(
                                                        <MDXComponent />).text);
                                                    setSubject(`${template.subject}`);
                                                } else {
                                                    setMessage(['error', 'Invalid template ID. Please try again.']);
                                                }
                                            }
                                        }}
                                    >
                                        <MenuItem value="-1">Load a template</MenuItem>
                                        {templateList.map((template, i) => {
                                            return (
                                                <MenuItem
                                                    key={template.subject}
                                                    value={i}
                                                >
                                                    {template.subject}
                                                </MenuItem>
                                            );
                                        })}
                                    </SelectField>
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell component="th" scope="row">
                                    Send Email To
                                </TableCell>
                                <TableCell>
                                    <TextField
                                        name="email"
                                        label="Recipient email(s), comma-separated"
                                        fullWidth
                                        variant="outlined"
                                        value={email}
                                        disabled={status === 'submitting' || sentSuccessful}
                                        onChange={(e) => setEmail(e.target.value)}
                                        helperText={`${validRecipients.length} valid recipients${invalidRecipients.length ? `, ${invalidRecipients.length} invalid recipients` : ''}`}
                                        error={invalidRecipients.length > 0}
                                    />
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell component="th" scope="row">
                                    Subject
                                </TableCell>
                                <TableCell>
                                    <TextField
                                        name="subject"
                                        label="Email subject"
                                        fullWidth
                                        variant="outlined"
                                        value={subject}
                                        disabled={status === 'submitting' || sentSuccessful}
                                        onChange={(e) => setSubject(e.target.value)}
                                    />
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell component="th" scope="row">
                                    Body
                                </TableCell>
                                <TableCell>
                                    <TextField
                                        name="body"
                                        label="Email body"
                                        multiline
                                        minRows={8}
                                        fullWidth
                                        variant="outlined"
                                        value={body}
                                        disabled={status === 'submitting' || sentSuccessful}
                                        onChange={(e) => setBody(e.target.value)}
                                    />
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell align="right" colSpan={2}>
                                    <Button
                                        type="submit"
                                        variant="contained"
                                        color={sentSuccessful ? "success" : "primary"}
                                        disabled={status === 'submitting' || sentSuccessful}
                                    >
                                        {buttonLabel}
                                    </Button>
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </TableContainer>

                {message && message[1] && (
                    <Alert severity={message[0]}>
                        {message[1]}
                    </Alert>
                )}
            </form>
        </Box>
    );
}
