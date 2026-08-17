import React from 'react';
import {
  Alert,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from '@mui/material';
import { getStatusName } from '@util/profile';
import { UploadThumbnailGrid } from '@components/User/UploadThumbnailGrid';
import Link from 'next/link';
import { formatPhone } from '@components/FormFields/formatting';
import { UserFileUploadModel, UserModel } from '@util/models';

interface ProfileViewProps {
  userProfile: UserModel
  userUploads: UserFileUploadModel[]
}

function ProfileView({
  userProfile,
  userUploads
}: ProfileViewProps) {
  const { status } = userProfile;

  const profileInfoLabels: {
    [key in keyof UserModel]?: string
  } = {
    first_name: 'First Name',
    last_name: 'Last Name',
    email: 'Email',
    phone: 'Primary Phone',
    phone2: 'Contact Phone',
    address: 'Address',
    city: 'City',
    state: 'State',
    zipcode: 'Zipcode',
    category: 'Category',
    description: 'Description',
  };
  const profileInfoFields = Object.keys(profileInfoLabels) as (keyof UserModel)[];

  function val(profileInfoField: keyof UserModel) {
    const value = userProfile[profileInfoField] as string;
    switch (profileInfoField) {
      case 'phone':
      case 'phone2':
        return value ? <Link href={`tel:${value}`}>{formatPhone(`${value}`)}</Link> : 'N/A';
      case 'email':
        return value ? <Link href={`mailto:${value}`} target="_blank">{`${value}`}</Link> : 'N/A';
      default:
        return value;
    }
  }

  return (
    <Box className="admin-panel">
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow className="admin-table-head">
              <TableCell colSpan={2}>
                Contact Information
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell component="th" scope="row">
                Status
              </TableCell>
              <TableCell>
                <Alert severity={status === 'paid' ? 'success' : 'info'}>
                  {getStatusName(status)}
                </Alert>
              </TableCell>
            </TableRow>
            {profileInfoFields.map((profileInfoField) => (
              <TableRow key={profileInfoField}>
                <TableCell component="th" scope="row">
                  {profileInfoLabels[profileInfoField]}
                </TableCell>
                <TableCell>
                  {val(profileInfoField)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Typography component="h2" id="step1">
        {`Uploaded files (${userUploads.length})`}
      </Typography>

      <UploadThumbnailGrid uploads={userUploads} />

    </Box>
  );
}

export default ProfileView;
