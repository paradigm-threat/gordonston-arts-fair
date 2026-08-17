'use client';

import React, { useEffect, useState } from 'react';
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
import { AdminSelect } from '@components/Admin/AdminSelect';
import type { AlertColor } from '@mui/material/Alert';
import { TransactionType, transactionTypes } from '@types';
import { snakeCaseToTitleCase } from '@util/format';
import { UserTransactionModel } from '@util/models';
import { UserTransactionSearchParams } from '@util/transActions';

interface AdminUserTransactionProps {
  fetchUserTransactions(
    args: UserTransactionSearchParams
  ): Promise<UserTransactionModel[]>,
  title: string
}

export default function UserTransactionView({
  fetchUserTransactions,
  title
}: AdminUserTransactionProps) {
  const [message, setMessage] = useState<[AlertColor, string]>(['info', '']);
  const [data, setData] = useState<UserTransactionModel[]>([]);
  const [args, setArgs] = useState<UserTransactionSearchParams>({
  });

  useEffect(() => {
    setMessage(['info', 'Fetching user logs...']);
    try {
      fetchUserTransactions(args).then(setData);
      setMessage(['info', '']);
    } catch (e: unknown) {
      setMessage(['error', (e as Error).message]);
    }
  }, [args, fetchUserTransactions]);

  return (
    <Box className="admin-panel">
      <Typography component="h2" sx={{ pb: 0 }} gutterBottom>
        {title}
      </Typography>

      {message && message[1] && (
        <Alert severity={message[0]}>
          {message[1]}
        </Alert>
      )}

      <div className="admin-toolbar">
        <AdminSelect
          id="transaction-type-filter"
          label="Transaction type"
          value={args.type || 'all'}
          onChange={(value) => setArgs({
            ...args,
            type: value === 'all' ? undefined : value as TransactionType,
          })}
          options={[
            { value: 'all', label: 'All transactions' },
            ...transactionTypes.map((value) => ({
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
                  orderBy: 'createdAt',
                  order: args.order === 'asc' ? 'desc' : 'asc'
                })}
              >
                Date
              </TableCell>
              <TableCell align="center">Type</TableCell>
              <TableCell align="center">Provider ID</TableCell>
              <TableCell align="center">Full Name</TableCell>
              <TableCell align="center">Email</TableCell>
              <TableCell align="center">Phone</TableCell>
              <TableCell align="center">Amount</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map(({
              createdAt, type, provider_id, full_name, email, phone, amount
            }) => (
              <TableRow
                key={createdAt?.toString() || Math.random().toString()}
                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
              >
                <TableCell align="center" scope="row">
                  {createdAt ? new Date(createdAt).toLocaleString() : 'N/A'}
                </TableCell>
                <TableCell align="center">
                  {type}
                </TableCell>
                <TableCell align="center">
                  {provider_id}
                </TableCell>
                <TableCell align="center">
                  {full_name}
                </TableCell>
                <TableCell align="center">
                  {email}
                </TableCell>
                <TableCell align="center">
                  {phone}
                </TableCell>
                <TableCell align="center">
                  {amount}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
