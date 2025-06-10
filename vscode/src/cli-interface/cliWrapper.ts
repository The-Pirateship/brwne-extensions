import { exec } from 'child_process';
import * as util from 'util';

const execAsync = util.promisify(exec);

/**
 * Runs a brwne CLI command and returns the parsed JSON result.
 * @param args Array of CLI arguments (e.g., ['working-changes', '--commit', 'abc123'])
 */
export async function runBrwneCommand(args: string[]): Promise<any | null> {
    try {
        const { stdout } = await execAsync(`brwne ${args.join(' ')}`);
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
