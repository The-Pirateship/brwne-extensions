import { runBrwneCommand } from './cliWrapper';

export function startPollingForChanges(filepath: string) {
  const poll = async () => {
    const result = await runBrwneCommand(['changes-request', '--file', `"${filepath}"`]);
    if (result) {
      console.log("🔎 Received changes:", result);
      // Process changes if needed
    }
  };

  poll(); // immediate
  return setInterval(poll, 5000);
}