import * as vscode from 'vscode';
import { execSync } from 'child_process';
import { runBrwneCommand } from './cliWrapper';

export async function uploadWorkingChanges() {
  const commitID = await getWorkingCommitID();
  if (!commitID) return;

  const result = await runBrwneCommand(['working-changes', '--commit', commitID]);

  if (result?.status === 'ok') {
    console.log(`📤 Synced working commit: ${commitID}`);
  } else {
    console.warn("⚠️ Failed to sync working commit");
  }
}

let lastCommitID: string | null = null;
let debounceTimer: NodeJS.Timeout | null = null;
let pendingResolve: ((id: string | null) => void) | null = null;

function WorkingCommitID(): string | null {
  try {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      vscode.window.showErrorMessage("No workspace folder found.");
      return null;
    }

    const workspacePath = workspaceFolders[0].uri.fsPath;
    const stdout = execSync('jj log -r @ -T commit_id --limit 1 --no-graph', { cwd: workspacePath });
    return stdout.toString().trim();
  } catch (error) {
    console.error("Error finding working commit ID:", error);
    vscode.window.showErrorMessage("Failed to find commitID. Make sure you have JJ installed.");
    return null;
  }
}

/**
 * Debounced async version — returns latest commitID after a 1s pause in calls.
 */
export function getWorkingCommitID(): Promise<string | null> {
  return new Promise((resolve) => {
    if (debounceTimer) clearTimeout(debounceTimer);

    pendingResolve = resolve;

    debounceTimer = setTimeout(() => {
      const id = WorkingCommitID();
      lastCommitID = id;
      if (pendingResolve) {
        pendingResolve(id);
        pendingResolve = null;
      }
    }, 1000); // 1s debounce window
  });
}
