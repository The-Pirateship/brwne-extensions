import { runBrwneCommand } from './cliWrapper';

export async function uploadFileState(filepath: string) {
    if (!filepath) return;

    const result = await runBrwneCommand(['file-update', `"${filepath}"`]);

    if (result?.status === 'ok') {
        console.log(`📤 Synced file state: ${filepath}`);
    } else {
        console.warn("⚠️ Failed to sync file: ", filepath);
    }
}
