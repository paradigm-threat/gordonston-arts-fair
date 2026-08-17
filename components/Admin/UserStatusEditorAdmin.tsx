'use client';

import {
  Alert,
  Box,
  Button,
  Checkbox,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import React, {useRef, useState} from 'react';
import {getStatusName} from '@util/profile';
import type {AlertColor} from '@mui/material/Alert';
import {useRouter} from 'next/navigation';
import {SelectField} from '@components/FormFields';
import {profileStatuses, UserStatus} from '@types';

interface UserStatusEditorAdminProps {
  userStatus: UserStatus,

  updateUserStatus(newStatus: UserStatus, sendEmailTemplate: boolean): Promise<{ message: string }>
}

const USER_LABEL = process.env.NEXT_PUBLIC_USER_LABEL || 'User';

export default function UserStatusEditorAdmin({
  userStatus, updateUserStatus
}: UserStatusEditorAdminProps) {
  const [sendEmailTemplate, setSendEmailTemplate] = useState(true);
  const [message, setMessage] = useState<[AlertColor, string]>(['info', '']);
  const [updatedUserStatus, setUpdatedUserStatus] = useState(userStatus);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  async function handleSubmit() {
    const { message: updateMessage } = await updateUserStatus(
      updatedUserStatus,
      sendEmailTemplate
    );
    setMessage(['success', updateMessage]);
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    router.refresh(); // Refresh the current page
  }

  return (
    <Box className="admin-panel">
      <form
        ref={formRef}
        method="POST"
      >
        {message && message[1] && (
        <Alert severity={message[0]}>
          {message[1]}
        </Alert>
        )}

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow className="admin-table-head">
                <TableCell colSpan={2}>
                  {`Manage ${USER_LABEL} Status`}
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell component="th" scope="row">
                  Status
                </TableCell>
                <TableCell>
                  <SelectField
                    name="status"
                    label="Select new status"
                    fullWidth
                    variant="outlined"
                    value={updatedUserStatus || ''}
                    onChange={(e) => {
                      const {value} = e.target as HTMLSelectElement;
                      if (value) setUpdatedUserStatus(value as UserStatus);
                    }}
                  >
                    {profileStatuses.map((status) => (
                      <MenuItem
                        key={status}
                        value={status}
                      >
                        {getStatusName(status)}
                      </MenuItem>
                    ))}
                  </SelectField>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell align="right">
                  Send Email Template?
                  <Checkbox
                    onClick={() => setSendEmailTemplate(!sendEmailTemplate)}
                    checked={sendEmailTemplate}
                    inputProps={{ 'aria-label': 'Send email template' }}
                  />
                </TableCell>
                <TableCell align="left">
                  <Button
                    onClick={() => handleSubmit()}
                    variant="contained"
                    color="primary"
                  >
                    Update Status
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
