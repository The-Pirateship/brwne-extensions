# `cli-interface`

This module connects the Brwne VS Code extension to the Brwne CLI binary. It facilitates communication between the editor and backend tools by invoking CLI commands that return JSON-formatted results. These commands enable features such as diff highlighting, working commit synchronization, and file change polling.

---

## 📁 Overview

* **Entry point:** [`cliWrapper.ts`](./cliWrapper.ts)
* **Core function:** Runs CLI commands like `brwne working-changes`, `brwne file-update`, or `brwne changes-request` using `child_process.exec`, then parses and returns their JSON output.
* **Triggered by:** The extension’s [`EditorTracker`](../triggers/EditorTracker.ts) during activation and editor events.

---

## 📦 Modules

### [`cliWrapper.ts`](./cliWrapper.ts)

**Purpose:**
Encapsulates the execution of CLI commands and extracts the first valid JSON line from `stdout`.

**Exports:**

* `runBrwneCommand(args: string[]): Promise<any | null>`

  * Accepts CLI arguments (e.g., `['working-changes']`)
  * Runs `brd` in the workspace root directory
  * Extracts and parses the first valid JSON output
  * Logs CLI errors and returns `null` if parsing fails

**Example:**

```ts
const result = await runBrwneCommand(['changes-request', '--file', '"src/app.ts"']);
```

---

### [`getChangesToHighlight.ts`](./getChangesToHighlight.ts)

**Purpose:**
Polls for real-time changes to a file using the `brwne changes-request` CLI command.

**Exports:**

* `startPollingForChanges(filepath: string, context: ExtensionContext): Promise<any | null>`
  Begins polling the CLI every 5 seconds for the given file. The first result is returned immediately; all subsequent results are logged and passed to `highlightChanges`.

* `stopPollingForChanges(filepath: string): void`
  Clears the polling interval for the given file.

* Internally uses `convertDiff()` to extract `FileDiff` from a full `RepoDiff`.

**CLI Equivalent:**

```bash
brd changes-request --file "src/app.ts"
```

---

### [`uploadWorkingChanges.ts`](./uploadWorkingChanges.ts)

**Purpose:**
Pushes the current working commit’s state to the Brwne backend.

**Exports:**

* `uploadWorkingChanges(): Promise<void>`
  Runs `brd working-changes` and logs the result.

**CLI Equivalent:**

```bash
brd working-changes
```

---

## ✅ Requirements

Ensure the following are available:

* ✅ `brwne` CLI is installed and in your system `PATH`
* ✅ [Jujutsu (jj)](https://github.com/martinvonz/jj) version control system is installed
* ✅ All CLI commands must output **only valid JSON** to `stdout`
* ✅ All debug or logging output must go to `stderr` to avoid interfering with JSON parsing

---

## 💡 Use Cases

* 🖍️ Automatically highlight modified lines in the editor based on CLI diff output
* 📄 Keep the working commit state synchronized with the backend
* 🔁 Periodically fetch live changes to files for real-time collaboration or syncing
