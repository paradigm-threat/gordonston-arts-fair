'use server';
/* eslint-disable no-console */

import nodemailer from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';
import {MailResult} from '@types';
import {EmailTemplate} from "@template/email";
import {createElement} from "react";

const {
  SMTP_SERVER_HOST,
  SMTP_SERVER_USERNAME,
  SMTP_SERVER_PASSWORD,
  EMAIL_ADMIN,
  EMAIL_BCC
} = process.env;
const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: SMTP_SERVER_HOST,
  port: 587,
  secure: true,
  auth: {
    user: SMTP_SERVER_USERNAME,
    pass: SMTP_SERVER_PASSWORD,
  },
});

export async function sendMail(options: Mail.Options): Promise<MailResult> {
  const toValue = options.to;
  const subject = `${options.subject}`;
  if (!toValue) {
    return { status: 'error', message: `Invalid recipient email: ${JSON.stringify(options)}` };
  }
  if (!subject) {
    return { status: 'error', message: `Invalid subject: ${JSON.stringify(options)}` };
  }

  const testMode = process.env.TEST_MODE !== 'false';

  // Normalize recipients to an array of strings
  const recipients: string[] = Array.isArray(toValue)
    ? (toValue as string[])
    : `${toValue}`.split(',').map((s) => s.trim()).filter(Boolean);

  try {
    const isVerified = await transporter.verify();

    if (!testMode) {
      // Send a single email addressed to multiple recipients
      const info = await transporter.sendMail({
        from: EMAIL_ADMIN,
        bcc: EMAIL_BCC,
        ...options,
        to: recipients.join(', '),
      });
      console.log(JSON.stringify({
        event: 'email.sent',
        ts: new Date().toISOString(),
        subject,
        recipientCount: recipients.length,
        verified: isVerified,
        messageId: info.messageId,
      }));
    } else {
      console.log('TEST MODE: No actual mail was sent', subject, 'recipients:', recipients);
    }

    return {
      status: 'success',
      message: testMode
        ? `TEST MODE: ${subject} (to ${recipients.length} recipients)`
        : `Email sent: ${subject} (to ${recipients.length} recipients)`,
    };
  } catch (error) {
    const errMessage = error instanceof Error ? error.message : 'Unknown email error';
    console.error(JSON.stringify({
      event: 'email.failed',
      ts: new Date().toISOString(),
      subject,
      recipientCount: recipients.length,
      error: errMessage,
    }));
    return {
      status: 'error',
      message: `Email failed: ${errMessage}`.slice(0, 256),
    };
  }
}

// const LOGIN_EMAIL_REQUESTS: {
//   [email: string]: number;
// } = {};

// export async function loginEmailAction(email: string): Promise<ActionResponse> {
//   // const redisPasswordResetKey = `user:${email.toLowerCase()}:reset-password`;
//   // await redisClient.set(redisPasswordResetKey, resetCode, { EX: 60 * 15 });
//
//   const testMode = process.env.TEST_MODE !== 'false';
//   const twoFactorResult = await fetch2FACode('email', email.toLowerCase());
//   if (twoFactorResult) {
//     console.log('Email 2-Factor re-requested: ', email, twoFactorResult);
//     return {
//       status: 'success',
//       message: 'A code has been sent to your email. Please enter it to continue',
//       redirectURL: `/login/validate/email?email=${email}${
//         testMode ? `&code=${twoFactorResult.code}` : ''}`
//     };
//   }
//
//   const loginCode = randomInt(100000, 999999 + 1);
//
//   const validationURL = `${process.env.NEXT_PUBLIC_BASE_URL}/login/validate/email/?email=${email}&code=${loginCode}`;
//   try {
//     const emailTemplate = User2FactorEmailTemplate(email, loginCode, validationURL);
//     const emailResult = await sendMail(emailTemplate);
//     if (emailResult.status !== 'success') {
//       return {
//         status: 'error',
//         message: 'Unable to send email. Please try again later',
//       };
//     }
//     console.log('Sent email: ', emailTemplate.subject);
//   } catch (e: any) {
//     console.error('Unable to send email: ', e.message);
//     return {
//       status: 'error',
//       message: 'Unable to send email. Please try again later',
//     };
//   }
//
//   // Store validation code
//   await add2FACode('email', email.toLowerCase(), loginCode);
//
//   return {
//     status: 'success',
//     message: 'A code has been sent to your email. Please enter it to continue',
//     redirectURL: `/login/validate/email?email=${email}${
//       testMode ? `&code=${loginCode}` : ''}`,
//   };
// }
//
// export async function loginEmailValidationAction(
//   email: string,
//   code: number
// ): Promise<ActionResponse> {
//   const twoFactorResult = await fetch2FACode('email', email.toLowerCase());
//   if (!twoFactorResult || (twoFactorResult.code !== code)) {
//     // eslint-disable-next-line no-console
//     console.error('Invalid email login request:', email, code, twoFactorResult);
//     // Add an error log entry
//     await addUserUserLogModel(null, 'log-in-error', 'Invalid email login request');
//     return {
//       message: 'Invalid login request',
//       status: 'error',
//     };
//   }
//
//   // Delete Login Request
//   await delete2FACode('email', email.toLowerCase());
//
//   await ensureDatabase();
//   // Fetch user from the database
//   const user = await UserModel.findOne({
//     where: { email: email.toLowerCase() },
//     attributes: ['id']
//   });
//
//   let userID: number = -1;
//   if (user) {
//     // User already exists
//     userID = user.id;
//     // Add a log entry
//     await addUserUserLogModel(userID, 'log-in');
//   } else {
//     // Register a new user
//     const newUser = await UserModel.create({F
//       email: email.toLowerCase(),
//       type: 'user',
//       status: 'registered',
//       created_at: new Date()
//     });
//     userID = newUser.id;
//     console.log(`Registered a new user (${userID}): `, email);
//
//     // Add a log entry
//     await addUserUserLogModel(userID, 'register');
//
//     // Send the registration email
//     const loginURL = `${process.env.NEXT_PUBLIC_BASE_URL}/login`;
//     const emailTemplate = UserRegistrationEmailTemplate(email, loginURL);
//     const mailResult = await sendMail(emailTemplate);
//     await addUserUserLogModel(userID, mailResult.status === 'success' ? 'message' : 'message-error', mailResult.message);
//   }
//
//   await startSession(userID);
//
//   // eslint-disable-next-line no-console
//   console.info('User logged in by email: ', email);
//   return {
//     status: 'success',
//     message: 'Login successful. Redirecting...',
//     redirectURL: (await isAdmin(userID)) ? '/user' : '/profile'
//   };
// }
export async function getEmailInfoServer(to: string, template: EmailTemplate): Promise<Mail.Options> {
    const {
        default: MDXContent,
        subject
    } = template;
    const ReactDOMServer = (await import('react-dom/server')).default;

    const html = ReactDOMServer.renderToString(createElement(MDXContent));

    // Replace anchor tags with their href attribute
    const anchorReplaced = html.replace(
        /<a\s+[^>]*href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi,
        '$1'
    );
    // Remove all remaining HTML tags
    const plainText = anchorReplaced.replace(/<[^>]+>/g, '');
    // Trim and return
    const text = plainText.trim().replaceAll("\n", "\n\n");

    return {
        to,
        subject,
        html,
        text,
    };
}