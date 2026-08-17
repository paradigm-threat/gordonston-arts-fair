'use client';

import React, {useEffect, useState} from 'react';
import {
    Alert,
    Box,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography
} from '@mui/material';
import {AdminSelect} from '@components/Admin/AdminSelect';
import type {AlertColor} from '@mui/material/Alert';

import {UserLogSearchParams} from '@util/logActions';
import {logTypes, LogType} from '@types';
import {snakeCaseToTitleCase} from '@util/format';
import {UserLogModel} from '@util/models';

interface UserLogProps {
    title?: string

    fetchUserLogs(args: UserLogSearchParams): Promise<UserLogModel[]>,
}

export default function UserLogView({fetchUserLogs, title}: UserLogProps) {
    const [message, setMessage] = useState<[AlertColor, string]>(['info', '']);
    const [data, setData] = useState<UserLogModel[]>([]);
    const [args, setArgs] = useState<UserLogSearchParams>({
        order: 'desc',
        orderBy: 'createdAt',
        // type: 'message',
    });

    useEffect(() => {
        setMessage(['info', 'Fetching user data...']);
        try {
            fetchUserLogs(args).then(setData);
            setMessage(['info', '']);
        } catch (e: unknown) {
            setMessage(['error', (e as Error).message]);
        }
    }, [args, fetchUserLogs]);

    return (
        <Box className="admin-panel">
            <Typography component="h2" gutterBottom>
                {title}
            </Typography>

            {message && message[1] && (
                <Alert severity={message[0]}>
                    {message[1]}
                </Alert>
            )}

            <div className="admin-toolbar">
                <AdminSelect
                    id="log-type-filter"
                    label="Log type"
                    value={args.type || 'all'}
                    onChange={(value) => setArgs({
                        ...args,
                        type: value === 'all' ? undefined : value as LogType,
                    })}
                    options={[
                        {value: 'all', label: 'All logs'},
                        ...logTypes.map((value) => ({
                            value,
                            label: snakeCaseToTitleCase(value),
                        })),
                    ]}
                />
            </div>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow className="admin-table-head">
                            <TableCell
                                className="cursor-pointer underline"
                                align="center"
                                onClick={() => setArgs({
                                    ...args,
                                    order: args.order === 'asc' ? 'desc' : 'asc'
                                })}
                            >
                                Date
                            </TableCell>
                            <TableCell align="center">Type</TableCell>
                            <TableCell align="center">Message</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {data.map(({
                                       id, type, message: logMessage, createdAt
                                   }) => (
                            <TableRow
                                key={id}
                                sx={{'&:last-child td, &:last-child th': {border: 0}}}
                            >
                                <TableCell align="center" scope="row">
                                    {createdAt ? createdAt.toLocaleString() : 'N/A'}
                                </TableCell>
                                <TableCell align="center">
                                    {type}
                                </TableCell>
                                <TableCell align="center">
                                    {logMessage}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
}
