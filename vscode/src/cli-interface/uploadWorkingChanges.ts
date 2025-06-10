import { runBrwneCommand } from './cliWrapper';

export async function uploadWorkingChanges() {
  const result = await runBrwneCommand(['working-changes']);

  if (result?.status === 'ok') {
    console.log(`📤 Synced working commit`);
  } else {
    console.warn("⚠️ Failed to sync working commit");
  }
}