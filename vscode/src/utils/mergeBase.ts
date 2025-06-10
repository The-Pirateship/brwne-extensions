import * as vscode from 'vscode';
import { execSync } from 'child_process';

function getMergeBaseSync(): string | null {
    try {
        // Get the current workspace folder
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            vscode.window.showErrorMessage("No workspace folder found.");
            return null;
        }

        const workspacePath = workspaceFolders[0].uri.fsPath;

        // Run the `git merge-base` command synchronously
        const stdout = execSync('git merge-base HEAD origin/main', { cwd: workspacePath });

        // Trim the output to remove any extra whitespace or newlines
        const mergeBase = stdout.toString().trim();

        return mergeBase;
    } catch (error) {
        console.error("Error finding merge base:", error);
        vscode.window.showErrorMessage("Failed to find merge base. Make sure you have fetched the latest changes from origin/main.");
        return null;
    }
}

export default getMergeBaseSync;