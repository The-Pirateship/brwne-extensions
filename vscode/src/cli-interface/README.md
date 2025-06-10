# cli-interface

This module provides the interface between a local development extension (e.g., a VS Code extension) and an external local server through JSON-RPC over HTTP. It is responsible for exchanging file-related state and version control data with the external environment. This enables functionalities like change tracking, file syncing, and working copy introspection.

## Overview

Each file in this folder implements a specific communication task between the extension and a local HTTP server (typically running at `localhost:<LOCAL_SERVER_PORT>/extcomms`), using standardized JSON-RPC 2.0 messages.

These JSON-RPC sync operations are invoked by the `EditorTracker` class in the `triggers` module, which in turn is initialized during extension activation (`extension.ts`). This allows automatic syncing of file states and working changes as the user navigates and edits files.

---

## Modules

### [`getChangesToHighlight.ts`](./getChangesToHighlight.ts)

**Purpose:**  
Periodically polls for change highlights for a given file. It sends a `ChangesRequest` via JSON-RPC every 5 seconds and logs the response.

**Exports:**

- `startPollingForChanges(filepath: string): NodeJS.Timeout`  
  Starts polling the server for changes to the specified file and returns the interval timer. This should be used to initiate and maintain a live sync with changes relevant to the file.

**Key Implementation Notes:**

- Uses `setInterval` to repeatedly fetch changes every 5 seconds.
- Logs errors and results to the console for debugging.

---

### [`UploadFileState.ts`](./UploadFileState.ts)

**Purpose:**  
Sends the full current state of a file to the server via a `FileUpdate` JSON-RPC request. This is a one-time operation and is not recurring.

**Exports:**

- `uploadFileState(file: string): Promise<void>`  
  Uploads the current state of the given file to the external server. Skips the operation if the file path is missing.

**Key Implementation Notes:**

- Makes a single HTTP POST request to `/extcomms` with the file payload.
- Appropriate warnings are logged in the case of errors or invalid input.

---

### [`uploadWorkingChanges.ts`](./uploadWorkingChanges.ts)

**Purpose:**  
Synchronizes the current working commit state with the server. This includes extracting the commit ID from a Just/`jj`-based version control system and sending it as a `WorkingChangeUpdate` via JSON-RPC.

**Exports:**

- `uploadWorkingChanges(): Promise<void>`  
  Retrieves the current working commit ID from `jj` and sends it to the server.

- `getWorkingCommitID(): Promise<string | null>`  
  A debounced version of `WorkingCommitID` that waits for 1 second of inactivity before resolving with the latest commit ID.

**Internal Helpers:**

- `WorkingCommitID(): string | null`  
  Synchronously extracts the current commit ID using `jj log -r @`.

**Key Implementation Notes:**

- Relies on VS Code workspace context (`vscode.workspace.workspaceFolders`) to determine the repo path.
- Includes robust error handling and fallback messaging when `jj` is not installed or the workspace is not initialized.

---

## Requirements

- A local HTTP server must be running at `http://localhost:$LOCAL_SERVER_PORT/extcomms`.
- The version control system [`jj`](https://github.com/martinvonz/jj) should be installed and available in the extension's shell environment.
- Environment variable `LOCAL_SERVER_PORT` must be defined in the process context.

---

## Example Use Cases

- Auto-refresh code highlights as the user works on a file.
- Push working directory changes (e.g., diffs from the VCS) to an external analysis service.
- Update remote services with the current file state for sync or collaboration purposes.

---

