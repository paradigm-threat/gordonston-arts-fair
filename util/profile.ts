/* eslint-disable @typescript-eslint/naming-convention */
// export interface UserProfile {
//   email: string,
//   status: UserStatus,
//   info: UserProfileInfo,
//   uploads: {
//     [filename: string]: UserProfileUpload
//   }
//   created_at: number,
//   updated_at?: number,
//   isAdmin?: true,
//   // expiresAt: Date
// }
//
// export interface UserProfileInfo {
//   first_name?: string,
//   last_name?: string,
//   company_name?: string,
//   phone?: string,
//   phone2?: string,
//   website?: string,
//   address?: string,
//   city?: string,
//   state?: string,
//   zip?: string,
//   category?: string,
//   description?: string,
// }
//
// export interface UserProfileUpload {
//   title: string,
//   description?: string,
//   url?: string
//   // path: string
// }

import { UserFileUploadModel, UserModel } from '@util/models';
import { UserStatus } from '@types';
import { InferAttributes } from 'sequelize';

export type IProfileStatusAction = 'upload-files' | 'pay-fee-registration' | 'pay-fee-booth';

export interface IProfileStatus {
  status: UserStatus,
  complete: boolean,
  formFilled: boolean,
  message: string,
  action?: IProfileStatusAction
}

export function getProfileStatus(userRow: UserModel, userUploads: UserFileUploadModel[]): IProfileStatus {
  const {
    status,
  } = userRow;

  const variables: { [key in keyof InferAttributes<UserModel>]?: string } = {
    first_name: 'First Name',
    last_name: 'Last Name',
    phone: 'Phone Number',
    address: 'Address',
    city: 'City',
    state: 'State',
    zipcode: 'ZIP Code',
    category: 'Category',
    description: 'Description',
  };
  const returnValue = {
    status,
    complete: false,
    formFilled: false,
    message: 'Please complete your Artist Profile',
  };

  const fields = Object.keys(variables) as Array<keyof InferAttributes<UserModel>>;
  const missingFields = fields.filter((field) => !userRow[field]).length;
  if (missingFields >= Object.values(variables).length - 1) {
    return returnValue;
  }
  for (let i = 0; i < fields.length; i++) {
    const field = fields[i];
    if (!userRow[field]) {
      return {
        ...returnValue,
        message: `Please complete your ${variables[field]}`,
      };
    }
  }

  returnValue.formFilled = true;

  if (userUploads.length === 0) {
    return {
      ...returnValue,
      message: 'Please upload at least one file',
      action: 'upload-files'
    };
  }

  returnValue.complete = true;

  switch (status) {
    case 'imported':
    case 'registered':
      return {
        ...returnValue,
        message: 'Please pay your registration fee to submit your profile for approval.',
        action: 'pay-fee-registration'
      };
    case 'submitted':
      return {
        ...returnValue,
        message: 'Your profile is pending approval. Please wait for approval.',
      };
    case 'approved':
      return {
        ...returnValue,
        message: 'Your artist profile is approved. Please pay your booth fee to complete registration.',
        action: 'pay-fee-booth'
      };
    case 'standby':
      return {
        ...returnValue,
        message: 'Your artist profile is on standby. Please wait for approval.',
      };
    case 'declined':
      return {
        ...returnValue,
        message: 'Your artist profile has been declined. Please contact us for more information.',
      };
    case 'paid':
      return {
        ...returnValue,
        message: 'Your artist profile is paid and registered.',
      };
    default:
      return {
        ...returnValue,
        message: 'Your profile status is unknown. Please contact us for more information.',
      };
  }
}

export function getFullName(first_name?: string, last_name?: string) {
  if (first_name && last_name) return `${first_name} ${last_name}`;
  if (first_name) return first_name;
  if (last_name) return last_name;
  return 'N/A';
}

export function getStatusName(status?: UserStatus) {
  if (!status) return 'N/A';
  return status.charAt(0).toUpperCase() + status.slice(1);
}
