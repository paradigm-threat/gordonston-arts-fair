'use client';

import React, { useState } from 'react';
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
    Typography
} from '@mui/material';
import type { AlertColor } from '@mui/material/Alert';
import { useRouter } from 'next/navigation';
import { SelectField, TextField } from '@components/FormFields';
import { TransactionType, transactionTypes, UserStatus } from '@types';
import { snakeCaseToTitleCase } from '@util/format';

interface ManualTransactionAdminProps {
    userID: number;
    addManualTransaction(
        userID: number,
        type: TransactionType,
        amount: number,
        provider: string,
        provider_id: string,
        newStatus?: UserStatus
    ): Promise<{ status: string; message: string }>;
}

const providers = ['Stripe', 'PayPal', 'Square', 'Check', 'Cash', 'Other'];
const statusOptions: UserStatus[] = ['paid', 'submitted'];

export default function ManualTransactionAdmin({
    userID,
    addManualTransaction
}: ManualTransactionAdminProps) {
    const [message, setMessage] = useState<[AlertColor, string]>(['info', '']);
    const [type, setType] = useState<TransactionType>('charge.succeeded');
    const [amount, setAmount] = useState<string>('0.00');
    const [provider, setProvider] = useState<string>('Stripe');
    const [providerId, setProviderId] = useState<string>('');
    const [newStatus, setNewStatus] = useState<UserStatus | ''>('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setMessage(['info', 'Adding transaction...']);

        try {
            const result = await addManualTransaction(
                userID,
                type,
                parseFloat(amount),
                provider,
                providerId,
                newStatus || undefined
            );

            if (result.status === 'success') {
                setMessage(['success', result.message]);
                setAmount('0.00');
                setProviderId('');
                setNewStatus('');
                router.refresh();
            } else {
                setMessage(['error', result.message]);
            }
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            setMessage(['error', msg || 'An error occurred']);
        } finally {
            setLoading(false);
        }
    }

    return (
        <Box className="flex flex-col min-w-full m-auto p-6 rounded-2xl border-2 border-[#ccca]">
            <Typography component="h2" variant="h6" gutterBottom>
                Add Manual Transaction
            </Typography>

            {message[1] && (
                <Alert severity={message[0]} sx={{ mb: 2 }}>
                    {message[1]}
                </Alert>
            )}

            <form onSubmit={handleSubmit}>
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow className="bg-blue-700 [&_th]:bold [&_th]:text-white [&_th]:px-4 [&_th]:py-2">
                                <TableCell colSpan={2}>Transaction Details</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            <TableRow>
                                <TableCell component="th" scope="row" sx={{ width: '30%' }}>
                                    Type
                                </TableCell>
                                <TableCell>
                                    <SelectField
                                        name="type"
                                        fullWidth
                                        value={type}
                                        onChange={(e) => setType(e.target.value as TransactionType)}
                                    >
                                        {transactionTypes.map((t) => (
                                            <MenuItem key={t} value={t}>
                                                {snakeCaseToTitleCase(t)}
                                            </MenuItem>
                                        ))}
                                    </SelectField>
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell component="th" scope="row">
                                    Provider
                                </TableCell>
                                <TableCell>
                                    <SelectField
                                        name="provider"
                                        fullWidth
                                        value={provider}
                                        onChange={(e) => setProvider(e.target.value as string)}
                                    >
                                        {providers.map((p) => (
                                            <MenuItem key={p} value={p}>
                                                {p}
                                            </MenuItem>
                                        ))}
                                    </SelectField>
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell component="th" scope="row">
                                    Transaction ID / Reference
                                </TableCell>
                                <TableCell>
                                    <TextField
                                        fullWidth
                                        value={providerId}
                                        onChange={(e) => setProviderId(e.target.value)}
                                        placeholder="e.g. ch_123... or PayPal ID"
                                        required
                                    />
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell component="th" scope="row">
                                    Amount
                                </TableCell>
                                <TableCell>
                                    <TextField
                                        fullWidth
                                        type="number"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        inputProps={{ step: '0.01' }}
                                        required
                                    />
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell component="th" scope="row">
                                    Update User Status (Optional)
                                </TableCell>
                                <TableCell>
                                    <SelectField
                                        name="newStatus"
                                        fullWidth
                                        value={newStatus}
                                        onChange={(e) => setNewStatus(e.target.value as UserStatus)}
                                        displayEmpty
                                    >
                                        <MenuItem value="">
                                            <em>No change</em>
                                        </MenuItem>
                                        {statusOptions.map((status) => (
                                            <MenuItem key={status} value={status}>
                                                {snakeCaseToTitleCase(status)}
                                            </MenuItem>
                                        ))}
                                    </SelectField>
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell colSpan={2} align="right">
                                    <Button
                                        type="submit"
                                        variant="contained"
                                        color="primary"
                                        disabled={loading}
                                    >
                                        {loading ? 'Processing...' : 'Add Transaction'}
                                    </Button>
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </TableContainer>
            </form>
        </Box>
    );
}
