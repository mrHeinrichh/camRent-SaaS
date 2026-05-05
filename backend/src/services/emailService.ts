import nodemailer from 'nodemailer';
import { env } from '../config/env';

let transporter: nodemailer.Transporter | null = null;
const SMTP_TIMEOUT_MS = 15_000;

export class EmailServiceError extends Error {
  constructor(
    message: string,
    public readonly publicMessage: string,
    public readonly statusCode = 500,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'EmailServiceError';
  }
}

function getTransporter() {
  if (transporter) return transporter;
  if (!env.smtpUser || !env.smtpPass) {
    return null;
  }
  transporter = nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpPort === 465,
    connectionTimeout: SMTP_TIMEOUT_MS,
    greetingTimeout: SMTP_TIMEOUT_MS,
    socketTimeout: SMTP_TIMEOUT_MS,
    dnsTimeout: SMTP_TIMEOUT_MS,
    auth: {
      user: env.smtpUser,
      pass: env.smtpPass,
    },
  });
  return transporter;
}

export async function sendOtpEmail(input: { to: string; code: string; expiresMinutes: number }) {
  const mailer = getTransporter();
  if (!mailer) {
    throw new EmailServiceError('SMTP is not configured', 'Email service is not configured on the server.', 503);
  }

  const from = env.smtpFrom || env.smtpUser;
  try {
    await mailer.sendMail({
      from,
      to: input.to,
      subject: 'CamRent PH Owner Verification Code',
      text: `Your CamRent PH verification code is ${input.code}. It expires in ${input.expiresMinutes} minutes.`,
      html: `<p>Your CamRent PH verification code is <strong>${input.code}</strong>.</p><p>This code expires in ${input.expiresMinutes} minutes.</p>`,
    });
  } catch (error: any) {
    throw new EmailServiceError('SMTP send failed', 'Email provider rejected the verification email. Check SMTP settings.', 502, {
      code: error?.code,
      command: error?.command,
      responseCode: error?.responseCode,
      response: error?.response,
    });
  }
}
