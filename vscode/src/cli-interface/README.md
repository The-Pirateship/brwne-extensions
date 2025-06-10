# cli-interface

This module provides the interface between the Brwne VS Code extension and the Brwne CLI (a Go-based binary). It is responsible for invoking CLI commands that handle tasks like syncing file state, tracking working commit changes, and fetching highlightable diffs.

## Overview

Each file in this folder maps to a specific CLI task — for example, submitting working commit state, pushing file content snapshots, or polling for line-level changes.

The CLI is called via `child_process.exec()` and coordinated through a shared utility: [`cliWrapper.ts`](./cliWrapper.ts). This wrapper runs `brwne` commands, parses their `stdout` output, and returns structured results to the extension code.

These CLI invocations are triggered by the `EditorTracker` class in the `triggers` module, which is initialized during extension activation (`extension.ts`).

---

## Modules

### [`cliWrapper.ts`](./cliWrapper.ts)

**Purpose:**  
Centralized utility for executing CLI commands and safely parsing their output.

**Exports:**

- `runBrwneCommand(args: string[]): Promise<any | null>`  
  Runs a `brwne` CLI command (e.g., `['working-changes']`), extracts the first valid JSON line from stdout, and returns the parsed object. Returns `null` on failure or malformed output.

**Example:**

```ts
const result = await runBrwneCommand(['file-update', 'src/main.ts']);
```

---

### [`getChangesToHighlight.ts`](./getChangesToHighlight.ts)

**Purpose:**  
Periodically polls the CLI for change highlights for a specific file, using the `brwne changes-request` command.

**Exports:**

- `startPollingForChanges(filepath: string): NodeJS.Timeout`  
  Begins polling every 5 seconds and logs results to the console.

**CLI Equivalent:**

```bash
brwne changes-request --file "path/to/file.ts"
```

---

### [`uploadWorkingChanges.ts`](./uploadWorkingChanges.ts)

**Purpose:**  
Syncs the current working commit ID via the CLI's `working-changes` command.

**Exports:**

- `uploadWorkingChanges(): Promise<void>`  
  Runs `brwne working-changes` and logs success or failure.

**CLI Equivalent:**

```bash
brwne working-changes
```

---

## Requirements

- `brwne` CLI must be installed and available in your system `PATH`
- The version control system [`jj`](https://github.com/martinvonz/jj) must be installed
- All CLI commands must print **only valid JSON** to `stdout`
- All logs and debug messages from the CLI must go to `stderr` to avoid corrupting JSON parsing

---

## Example Use Cases

- Automatically highlighting lines in the editor that are out of sync or need pulling
- Keeping track of a user's current working commit state
- Uploading file snapshots to be diffed or tracked for changes

---

