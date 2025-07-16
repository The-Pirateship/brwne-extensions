import { ExtensionContext, window } from 'vscode';
import { FileDiff, RepoDiff } from '../highlights/RepoDiff';
import { runBrwneCommand } from './cliWrapper';
import { highlightChanges } from '../highlights/highlightChanges';

let pollingIntervalMap: Map<string, NodeJS.Timeout> = new Map();

/**
 * Starts polling for changes for a specific file.
 */
export async function startPollingForChanges(filepath: string, context: ExtensionContext): Promise<any | null> {
  stopPollingForChanges(filepath); // Prevent duplicates

  const poll = async () => {
    try {
      const result = await runBrwneCommand(['changes-request', '--file', `"${filepath}"`]);
      if (result) {
        console.log("🔎 Received changes:", result);
        const fileDiff = convertDiff(result, filepath) as FileDiff
        highlightChanges(context, fileDiff);
      }
      return null;
    } catch (e) { 
      console.error("Polling error:", e);
      return null;
    }
  };

  // First result (return this!)
  const firstResult = await poll();

  // Then start interval
  const intervalId = setInterval(poll, 5000);
  pollingIntervalMap.set(filepath, intervalId);

  return firstResult;
}


/**
 * Stops polling for a specific file.
 */
export function stopPollingForChanges(filepath: string) {
  const interval = pollingIntervalMap.get(filepath);
  if (interval) {
    clearInterval(interval);
    pollingIntervalMap.delete(filepath);
    console.log(`🛑 Stopped polling for ${filepath}`);
  }
}


function convertDiff(diff: RepoDiff, file: string): FileDiff | null {
  if (!diff || typeof diff !== 'object') {
    console.warn("⚠️ Received no valid diff data from polling.");
    return null;
  }
  if (!diff[file]) {
    window.showInformationMessage("📦 No diffs available.");
    return null;
  }

  console.log("📦 Got diff:", diff);
  const fileDiff = diff[file];
  console.log("📄 Current file diff:", fileDiff);
  return fileDiff;
}
