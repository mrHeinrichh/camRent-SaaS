import nodemailer from 'nodemailer';
import { OAuth2Client } from 'google-auth-library';
import { env } from '../config/env';

let transporter: nodemailer.Transporter | null = null;
let gmailClient: OAuth2Client | null = null;
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

function getGmailClient() {
  if (gmailClient) return gmailClient;
  if (!env.gmailClientId || !env.gmailClientSecret || !env.gmailRefreshToken) {
    return null;
  }
  gmailClient = new OAuth2Client(env.gmailClientId, env.gmailClientSecret);
  gmailClient.setCredentials({ refresh_token: env.gmailRefreshToken });
  return gmailClient;
}

function encodeBase64Url(input: string) {
  return Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function buildOtpMessage(input: { from: string; to: string; code: string; expiresMinutes: number }) {
  const html = `<p>Your CamRent PH verification code is <strong>${input.code}</strong>.</p><p>This code expires in ${input.expiresMinutes} minutes.</p>`;
  const text = `Your CamRent PH verification code is ${input.code}. It expires in ${input.expiresMinutes} minutes.`;
  const boundary = `camrent-${Date.now().toString(36)}`;
  const subject = 'CamRent PH Owner Verification Code';

  return [
    `From: ${input.from}`,
    `To: ${input.to}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: 7bit',
    '',
    text,
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    'Content-Transfer-Encoding: 7bit',
    '',
    html,
    '',
    `--${boundary}--`,
  ].join('\r\n');
}

async function sendWithGmailApi(input: { to: string; code: string; expiresMinutes: number }) {
  const client = getGmailClient();
  if (!client) {
    return false;
  }

  const accessToken = await client.getAccessToken();
  if (!accessToken.token) {
    throw new EmailServiceError('Gmail API access token unavailable', 'Email service is not configured on the server.', 503);
  }

  const from = env.gmailFrom || env.smtpFrom || env.smtpUser;
  if (!from) {
    throw new EmailServiceError('Gmail API sender is not configured', 'Email service is not configured on the server.', 503);
  }

  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      raw: encodeBase64Url(buildOtpMessage({ from, to: input.to, code: input.code, expiresMinutes: input.expiresMinutes })),
    }),
  });

  if (!response.ok) {
    let details: unknown = null;
    try {
      details = await response.json();
    } catch {
      details = await response.text();
    }
    throw new EmailServiceError('Gmail API send failed', 'Gmail API rejected the verification email. Check Gmail API settings.', 502, {
      status: response.status,
      details,
    });
  }

  return true;
}

export async function sendOtpEmail(input: { to: string; code: string; expiresMinutes: number }) {
  if (await sendWithGmailApi(input)) {
    return;
  }

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
