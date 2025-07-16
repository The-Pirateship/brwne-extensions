import { exec } from 'child_process';
import * as util from 'util';
import { workspace } from 'vscode';
import { brcmd } from '../constants';

const execAsync = util.promisify(exec);

/**
 * Runs a brwne CLI command and returns the parsed JSON result.
 * @param args Array of CLI arguments (e.g., ['working-changes'])
 */
export async function runBrwneCommand(args: string[]): Promise<any | null> {
    const workspaceRoot = workspace.workspaceFolders?.[0].uri.fsPath;
    if (!workspaceRoot) {
        console.error("❌ No workspace root found.");
        return null;
    }

    try {
        const { stdout } = await execAsync(`${brcmd} ${args.join(' ')}`, {
            cwd: workspaceRoot,
        });
        // Find the first valid JSON line
        const jsonLine = stdout.trim().split('\n').find(line => {
            try {
                JSON.parse(line);
                return true;
            } catch {
                return false;
            }
        });

        if (!jsonLine) throw new Error("❌ CLI did not return valid JSON");

        const result = JSON.parse(jsonLine);
        return result;
    } catch (err: any) {
        console.error("❌ Brwne CLI command failed:", err.stderr || err.message);
        return null;
    }
}
