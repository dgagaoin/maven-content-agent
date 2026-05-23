import fs from 'node:fs';
import path from 'node:path';
import { google, drive_v3 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { log } from '../utils/logger.js';

// Reuses the shared Danny-OAuth token (drive.file scope) — same token Stella and
// Moneypenny use. Files created here are owned by Danny, bypassing service-account quota.

export interface DriveFileResult {
  fileId: string;
  name: string;
  mimeType: string;
  webUrl: string;
}

interface OAuthTokenJson {
  token: string;
  refresh_token: string;
  token_uri: string;
  client_id: string;
  client_secret: string;
  scopes: string[];
}

export class MavenDriveClient {
  private constructor(
    private readonly drive: drive_v3.Drive,
    private readonly folderId: string,
  ) {}

  static fromEnvironment(): MavenDriveClient | null {
    const folderId = process.env.MAVEN_DRIVE_FOLDER_ID;
    if (!folderId) {
      log.warn('MAVEN_DRIVE_FOLDER_ID not set — drive adapter disabled');
      return null;
    }
    const auth = buildOAuthClient();
    const drive = google.drive({ version: 'v3', auth });
    return new MavenDriveClient(drive, folderId);
  }

  async uploadMarkdown(name: string, content: string): Promise<DriveFileResult> {
    const res = await this.drive.files.create({
      requestBody: { name, parents: [this.folderId], mimeType: 'text/markdown' },
      media: { mimeType: 'text/markdown', body: content },
      fields: 'id,name,mimeType,webViewLink',
      supportsAllDrives: true,
    });
    return {
      fileId: res.data.id ?? '',
      name: res.data.name ?? '',
      mimeType: res.data.mimeType ?? '',
      webUrl: res.data.webViewLink ?? '',
    };
  }

  async listInFolder(pageSize = 25): Promise<Array<{ id: string; name: string; mimeType: string }>> {
    const res = await this.drive.files.list({
      q: `'${this.folderId}' in parents and trashed = false`,
      fields: 'files(id, name, mimeType)',
      pageSize,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });
    return (res.data.files ?? []).map((f) => ({
      id: f.id ?? '',
      name: f.name ?? '',
      mimeType: f.mimeType ?? '',
    }));
  }
}

function buildOAuthClient(): OAuth2Client {
  const tokenValue =
    process.env.MAVEN_DRIVE_OAUTH_TOKEN ||
    process.env.DRIVE_OAUTH_TOKEN ||
    process.env.STELLA_DRIVE_OAUTH_TOKEN ||
    process.env.MONEYPENNY_DRIVE_OAUTH_TOKEN ||
    defaultSharedTokenPath();
  if (!tokenValue) {
    throw new Error(
      'Set MAVEN_DRIVE_OAUTH_TOKEN (path or inline JSON), or place a refresh token at astraea/credentials/drive_oauth_token.json',
    );
  }
  const data = loadTokenJson(tokenValue);
  const auth = new google.auth.OAuth2(data.client_id, data.client_secret);
  // Skip stale access_token; library will refresh from refresh_token on first call.
  // The cached access_token in the JSON file expires after ~1 hour and the
  // auto-refresh path is unreliable for multipart media uploads.
  auth.setCredentials({
    refresh_token: data.refresh_token,
    scope: data.scopes.join(' '),
  });
  return auth;
}

function defaultSharedTokenPath(): string | undefined {
  const guess = path.resolve(
    process.cwd(),
    '..',
    '..',
    'astraea',
    'credentials',
    'drive_oauth_token.json',
  );
  return fs.existsSync(guess) ? guess : undefined;
}

function loadTokenJson(value: string): OAuthTokenJson {
  if (value.trim().startsWith('{')) return JSON.parse(value);
  if (!fs.existsSync(value)) throw new Error(`OAuth token file not found at ${value}`);
  return JSON.parse(fs.readFileSync(value, 'utf8'));
}
