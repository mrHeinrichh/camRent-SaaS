import nodemailer from 'nodemailer';
import { OAuth2Client } from 'google-auth-library';
import { env } from '../config/env';

let transporter: nodemailer.Transporter | null = null;
let gmailClient: OAuth2Client | null = null;
const SMTP_TIMEOUT_MS = 15_000;
const PLACEHOLDER_PATTERN = /(^your_|^paste_|^real_|placeholder|new_token|new_client|replace_me|example|\bhere\b)/i;

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

function safeFingerprint(value?: string | null) {
  if (!value) return null;
  const trimmed = value.trim();
  if (trimmed.length <= 10) {
    return `${trimmed.slice(0, 2)}...(${trimmed.length})`;
  }
  return `${trimmed.slice(0, 6)}...${trimmed.slice(-4)} (${trimmed.length})`;
}

function looksLikePlaceholder(value?: string | null) {
  return Boolean(value && PLACEHOLDER_PATTERN.test(value.trim()));
}

function emailConfigSnapshot() {
  return {
    gmailClientId: safeFingerprint(env.gmailClientId),
    gmailClientSecret: safeFingerprint(env.gmailClientSecret),
    gmailClientSecretLooksPlaceholder: looksLikePlaceholder(env.gmailClientSecret),
    gmailRefreshToken: safeFingerprint(env.gmailRefreshToken),
    gmailRefreshTokenLooksPlaceholder: looksLikePlaceholder(env.gmailRefreshToken),
    gmailUser: env.gmailUser ? safeFingerprint(env.gmailUser) : null,
    gmailFromConfigured: Boolean(env.gmailFrom),
    smtpHost: env.smtpHost,
    smtpPort: env.smtpPort,
    smtpUser: env.smtpUser ? safeFingerprint(env.smtpUser) : null,
    smtpPassConfigured: Boolean(env.smtpPass),
    smtpPassLooksPlaceholder: looksLikePlaceholder(env.smtpPass),
    smtpFromConfigured: Boolean(env.smtpFrom),
  };
}

function getGmailAuthorizationMessage(errorCode?: string) {
  if (errorCode === 'invalid_client') {
    return 'Gmail OAuth client ID or client secret is invalid. Check GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET.';
  }
  if (errorCode === 'invalid_grant') {
    return 'Gmail refresh token is invalid or expired. Regenerate GMAIL_REFRESH_TOKEN with the same Gmail OAuth client.';
  }
  return 'Gmail API authorization failed. Regenerate and update the Gmail refresh token in Render.';
}

function getTransporter() {
  if (transporter) return transporter;
  if (!env.smtpUser || !env.smtpPass) {
    console.warn('[email] SMTP config incomplete', emailConfigSnapshot());
    return null;
  }
  if (looksLikePlaceholder(env.smtpPass)) {
    console.error('[email] SMTP password looks like a placeholder', emailConfigSnapshot());
    throw new EmailServiceError(
      'SMTP password looks like a placeholder',
      'SMTP_PASS is a placeholder. Replace it with your real Gmail app password.',
      503,
      emailConfigSnapshot(),
    );
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
    console.warn('[email] Gmail API config incomplete, falling back to SMTP', emailConfigSnapshot());
    return null;
  }
  gmailClient = new OAuth2Client(env.gmailClientId, env.gmailClientSecret);
  gmailClient.setCredentials({ refresh_token: env.gmailRefreshToken });
  return gmailClient;
}

function encodeBase64Url(input: string) {
  return Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function buildEmailMessage(input: { from: string; to: string; subject: string; text: string; html: string }) {
  const boundary = `camrent-${Date.now().toString(36)}`;

  return [
    `From: ${input.from}`,
    `To: ${input.to}`,
    `Subject: ${input.subject}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: 7bit',
    '',
    input.text,
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    'Content-Transfer-Encoding: 7bit',
    '',
    input.html,
    '',
    `--${boundary}--`,
  ].join('\r\n');
}

async function sendWithGmailApi(input: { to: string; subject: string; text: string; html: string }) {
  const client = getGmailClient();
  if (!client) {
    return false;
  }
  const configSnapshot = emailConfigSnapshot();
  if (configSnapshot.gmailClientSecretLooksPlaceholder || configSnapshot.gmailRefreshTokenLooksPlaceholder) {
    console.error('[email] Gmail API credentials look like placeholders', configSnapshot);
    throw new EmailServiceError(
      'Gmail API credentials look like placeholders',
      'Gmail API credentials are placeholders. Replace GMAIL_CLIENT_SECRET and GMAIL_REFRESH_TOKEN with real Google values.',
      503,
      configSnapshot,
    );
  }

  let accessToken: { token?: string | null };
  try {
    console.info('[email] Gmail API token request start', configSnapshot);
    accessToken = await client.getAccessToken();
  } catch (error: any) {
    const responseData = error?.response?.data;
    const googleErrorCode = typeof responseData?.error === 'string' ? responseData.error : undefined;
    console.error('[email] Gmail API token request failed', {
      code: error?.code,
      status: error?.status,
      responseStatus: error?.response?.status,
      responseData,
      message: error?.message,
      config: configSnapshot,
    });
    throw new EmailServiceError('Gmail API access token request failed', getGmailAuthorizationMessage(googleErrorCode), 502, {
      code: error?.code,
      status: error?.status,
      responseStatus: error?.response?.status,
      responseData,
      message: error?.message,
      config: configSnapshot,
    });
  }
  if (!accessToken.token) {
    console.error('[email] Gmail API did not return an access token', configSnapshot);
    throw new EmailServiceError('Gmail API access token unavailable', 'Gmail API did not return an access token. Regenerate the Gmail refresh token in Render.', 503);
  }

  const from = env.gmailFrom || env.smtpFrom || env.gmailUser || env.smtpUser;
  if (!from) {
    console.error('[email] Gmail API sender is not configured', configSnapshot);
    throw new EmailServiceError('Gmail API sender is not configured', 'Email service is not configured on the server.', 503);
  }

  console.info('[email] Gmail API send request start', {
    to: safeFingerprint(input.to),
    fromConfigured: Boolean(from),
    subject: input.subject,
  });
  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      raw: encodeBase64Url(buildEmailMessage({ from, to: input.to, subject: input.subject, text: input.text, html: input.html })),
    }),
  });

  if (!response.ok) {
    let details: unknown = null;
    try {
      details = await response.json();
    } catch {
      details = await response.text();
    }
    console.error('[email] Gmail API send failed', {
      status: response.status,
      details,
    });
    throw new EmailServiceError('Gmail API send failed', 'Gmail API rejected the verification email. Check Gmail API settings.', 502, {
      status: response.status,
      details,
      config: configSnapshot,
    });
  }

  console.info('[email] Gmail API send succeeded', { to: safeFingerprint(input.to), subject: input.subject });
  return true;
}

export async function sendEmail(input: { to: string; subject: string; text: string; html: string }) {
  let gmailApiFailure: EmailServiceError | null = null;
  try {
    if (await sendWithGmailApi(input)) {
      return;
    }
  } catch (error) {
    if (error instanceof EmailServiceError) {
      gmailApiFailure = error;
      console.warn('[email] Gmail API delivery unavailable, trying SMTP fallback', {
        message: error.message,
        publicMessage: error.publicMessage,
        statusCode: error.statusCode,
        smtpConfigured: Boolean(env.smtpUser && env.smtpPass),
      });
    } else {
      throw error;
    }
  }

  const mailer = getTransporter();
  if (!mailer) {
    if (gmailApiFailure) {
      throw gmailApiFailure;
    }
    throw new EmailServiceError('SMTP is not configured', 'Email service is not configured on the server.', 503);
  }

  const from = env.smtpFrom || env.smtpUser;
  try {
    console.info('[email] SMTP send request start', {
      to: safeFingerprint(input.to),
      fromConfigured: Boolean(from),
      smtpHost: env.smtpHost,
      smtpPort: env.smtpPort,
      subject: input.subject,
    });
    await mailer.sendMail({
      from,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
    });
    console.info('[email] SMTP send succeeded', { to: safeFingerprint(input.to), subject: input.subject });
  } catch (error: any) {
    console.error('[email] SMTP send failed', {
      code: error?.code,
      command: error?.command,
      responseCode: error?.responseCode,
      response: error?.response,
      config: emailConfigSnapshot(),
    });
    throw new EmailServiceError('SMTP send failed', 'Email provider rejected the verification email. Check SMTP settings.', 502, {
      code: error?.code,
      command: error?.command,
      responseCode: error?.responseCode,
      response: error?.response,
      config: emailConfigSnapshot(),
    });
  }
}

export async function sendOtpEmail(input: { to: string; code: string; expiresMinutes: number }) {
  await sendEmail({
    to: input.to,
    subject: 'CamRent PH Verification Code',
    text: `Your CamRent PH verification code is ${input.code}. It expires in ${input.expiresMinutes} minutes.`,
    html: `<p>Your CamRent PH verification code is <strong>${input.code}</strong>.</p><p>This code expires in ${input.expiresMinutes} minutes.</p>`,
  });
}

export async function sendOwnerRegistrationNotification(input: {
  to?: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  storeName: string;
  storeAddress: string;
  storeId: string;
}) {
  const recipient = input.to || env.adminNotificationEmail;
  if (!recipient) return;

  const submittedAt = new Date().toLocaleString('en-PH', { timeZone: 'Asia/Manila' });
  await sendEmail({
    to: recipient,
    subject: `New CamRent PH shop owner registration: ${input.storeName}`,
    text: [
      'A new shop owner registered on CamRent PH.',
      '',
      `Store: ${input.storeName}`,
      `Store ID: ${input.storeId}`,
      `Address: ${input.storeAddress || '-'}`,
      `Owner: ${input.ownerName || '-'}`,
      `Email: ${input.ownerEmail}`,
      `Phone: ${input.ownerPhone || '-'}`,
      `Submitted: ${submittedAt}`,
      '',
      'Review this owner in the admin dashboard.',
    ].join('\n'),
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.5;color:#1f2937">
        <h2>New CamRent PH shop owner registration</h2>
        <p>A new shop owner registered and is pending review.</p>
        <table cellpadding="6" cellspacing="0" style="border-collapse:collapse">
          <tr><td><strong>Store</strong></td><td>${input.storeName}</td></tr>
          <tr><td><strong>Store ID</strong></td><td>${input.storeId}</td></tr>
          <tr><td><strong>Address</strong></td><td>${input.storeAddress || '-'}</td></tr>
          <tr><td><strong>Owner</strong></td><td>${input.ownerName || '-'}</td></tr>
          <tr><td><strong>Email</strong></td><td>${input.ownerEmail}</td></tr>
          <tr><td><strong>Phone</strong></td><td>${input.ownerPhone || '-'}</td></tr>
          <tr><td><strong>Submitted</strong></td><td>${submittedAt}</td></tr>
        </table>
        <p>Review this owner in the admin dashboard.</p>
      </div>
    `,
  });
}
