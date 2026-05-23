// Verifies Maven can create a Drive file in her folder using the shared OAuth token.
// Run: npx tsx scripts/create_drive_test_doc.ts

import '../src/config.js';
import { MavenDriveClient } from '../src/storage/drive.js';

async function main(): Promise<void> {
  const client = MavenDriveClient.fromEnvironment();
  if (!client) {
    console.error('MAVEN_DRIVE_FOLDER_ID not set');
    process.exit(1);
  }
  const result = await client.uploadMarkdown(
    'Maven OAuth Write Test.md',
    '# Maven OAuth Write Test\n\nIf you can read this in Drive, the shared OAuth token works.\n',
  );
  console.log('Created file');
  console.log('  ID:  ', result.fileId);
  console.log('  URL: ', result.webUrl);

  console.log('\nFolder contents:');
  for (const f of await client.listInFolder()) {
    console.log(`  ${f.mimeType}  ${f.name}`);
  }
}

main().catch((e) => {
  console.error('Failed:', (e as Error).message);
  process.exit(1);
});
