# `triggers`

The `triggers` module is responsible for monitoring user activity within the VS Code editor and triggering appropriate side effects such as file syncing, change highlighting, and working state uploads. It serves as the real-time glue between editor events and external state syncing mechanisms.

This module is designed to ensure the rest of the system remains up to date with what the user is actively editing or modifying.

---

## 📦 Module

### [`EditorTracker.ts`](./EditorTracker.ts)

**Purpose:**
Watches for changes in the active editor and the contents of open files, and dispatches these events to sync functions (e.g., file uploads, working change detection, and highlight refresh).

**Key Exports:**

* `EditorTracker.getInstance(context: vscode.ExtensionContext): EditorTracker`
  Singleton accessor that returns the initialized `EditorTracker` instance for use during extension activation.

* `dispose(): void`
  Cleans up all active listeners and disposables to ensure proper shutdown or reload handling.

---

## ⚙️ Responsibilities

* **Track Active File Changes**
  When the user switches between files, the tracker automatically:

  * Stops polling for the previous file
  * Starts polling for the new file via `startPollingForChanges`

* **Track Content Changes**
  On every document save, the tracker triggers `uploadWorkingChanges` to keep the backend or CLI aware of recent modifications.

* **Initial Bootstrapping**
  Upon activation, it immediately:

  * Identifies the currently open file
  * Starts polling for external changes with `startPollingForChanges`

---

## 🔗 Integrated Systems

* [`cli-interface/uploadWorkingChanges`](../cli-interface/uploadWorkingChanges.ts)
  Sends working commit info when file content changes.

* [`cli-interface/getChangesToHighlight`](../cli-interface/getChangesToHighlight.ts)
  Starts polling the external service for new changes that need to be highlighted.

---

## 🧠 Design Notes

* **Singleton Design**
  `EditorTracker` uses a singleton pattern to avoid multiple conflicting listeners in the extension lifecycle.

* **Disposable Management**
  All registered listeners are stored in a `disposables` list and properly cleaned up via the `dispose` method, ensuring no memory leaks or redundant triggers.

* **Extensibility**
  This pattern can be extended to support additional editor events such as file save, file rename, or diagnostics.

---

## 📚 Example Use Cases

* Uploading the current file’s state to a collaborative server as the user navigates between files.
* Triggering background sync of edits for a real-time multi-user editing experience.
* Debouncing and polling for changes from an external service to keep the local editor in sync.
