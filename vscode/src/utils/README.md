# utils

The `utils` module contains helper utilities that support the rest of the extension by managing workspace configuration and executing Git-related queries. These are small, focused tools that abstract low-level logic and system operations into clean, reusable functions.

---

## Modules

### [`enableAutoSave.ts`](./enableAutoSave.ts)

**Purpose:**  
Programmatically enables VS Code's auto-save functionality with a 1-second delay. This ensures that changes made in the editor are automatically persisted to disk without requiring manual save actions.

**Exports:**

- `enableAutoSaveWithDelay(): void`  
  Updates the global workspace settings:
  - Sets `"files.autoSave"` to `"afterDelay"`.
  - Sets `"files.autoSaveDelay"` to `1000` milliseconds.

**Behavior:**

- If auto-save is already enabled with a 1s delay, the function does nothing.
- If updates are made, a toast notification confirms the configuration change.
- Uses `vscode.ConfigurationTarget.Global` to ensure changes persist globally across sessions.

---

### [`mergeBase.ts`](./mergeBase.ts)

**Purpose:**  
Synchronously retrieves the Git merge base between the current working `HEAD` and `origin/main`. This is useful for diffing purposes and computing upstream-related changes.

**Exports:**

- `getMergeBaseSync(): string | null`  
  Executes `git merge-base HEAD origin/main` and returns the resulting commit hash. Returns `null` if the command fails or the workspace context is invalid.

**Behavior:**

- Uses `execSync` to run the Git command.
- Displays an error message in the VS Code UI if no workspace is found or if the command fails.
- Assumes the user has fetched the latest commits from `origin/main`.

---

## Requirements

- Git must be installed and available in the system environment.
- A valid VS Code workspace must be open for Git commands to succeed.

---

## Example Use Cases

- **Auto-save utility**: Ensures a smoother collaborative editing experience by reducing unsaved state lag.
- **Git merge-base**: Supports diffing workflows such as:
  - Highlighting changes since divergence from the main branch.
  - Determining the common ancestor for three-way merge scenarios.

