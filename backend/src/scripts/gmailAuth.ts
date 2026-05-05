import dotenv from 'dotenv';
import { OAuth2Client } from 'google-auth-library';

dotenv.config();

const getArg = (name: string) => {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : '';
};

const clientId = getArg('--client-id') || process.env.GMAIL_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || '';
const clientSecret = getArg('--client-secret') || process.env.GMAIL_CLIENT_SECRET || '';
const redirectUri = getArg('--redirect-uri') || process.env.GMAIL_REDIRECT_URI || 'https://developers.google.com/oauthplayground';
const code = getArg('--code');

if (!clientId || !clientSecret) {
  console.error('Missing Gmail OAuth credentials. Provide --client-id and --client-secret or set GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET.');
  process.exit(1);
}

const client = new OAuth2Client(clientId, clientSecret, redirectUri);

async function main() {
  if (!code) {
    const url = client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: ['https://www.googleapis.com/auth/gmail.send'],
    });
    console.log('Open this URL, approve Gmail send access, then rerun this command with --code:');
    console.log(url);
    return;
  }

  const { tokens } = await client.getToken(code);
  if (!tokens.refresh_token) {
    console.error('Google did not return a refresh token. Rerun without --code, open the URL again, and make sure prompt=consent is present.');
    process.exit(1);
  }

  console.log('GMAIL_REFRESH_TOKEN=' + tokens.refresh_token);
}

main().catch((error) => {
  console.error('Failed to complete Gmail OAuth flow:', error?.message || error);
  process.exit(1);
});
