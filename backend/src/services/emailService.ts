import nodemailer from 'nodemailer';
import { env } from '../config/env';

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (transporter) return transporter;
  if (!env.smtpUser || !env.smtpPass) {
    return null;
  }
  transporter = nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpPort === 465,
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
    throw new Error('SMTP is not configured');
  }

  const from = env.smtpFrom || env.smtpUser;
  await mailer.sendMail({
    from,
    to: input.to,
    subject: 'CamRent PH Owner Verification Code',
    text: `Your CamRent PH verification code is ${input.code}. It expires in ${input.expiresMinutes} minutes.`,
    html: `<p>Your CamRent PH verification code is <strong>${input.code}</strong>.</p><p>This code expires in ${input.expiresMinutes} minutes.</p>`,
  });
}
