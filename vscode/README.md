# Brwne VS Code Extension

This is the main entry point of the Brwne VS Code extension. It orchestrates extension initialization, environment setup, lifecycle management, and integration of subsystems like tracking, highlighting, and syncing.

---

## 📁 File: [`extension.ts`](./extension.ts)

### Purpose

The `extension.ts` module defines the activation and deactivation hooks for the Brwne extension. It serves as the central bootstrapping logic that:

* Loads environment configuration.
* Detects development vs production mode.
* Enables auto-save.
* Initializes file tracking and highlighting.
* Signals connection to the CLI

---

## ⚡ Activation Flow

### `activate(context: vscode.ExtensionContext): Promise<void>`

Called automatically by VS Code when the extension is activated.

**Responsibilities:**

1. **Identify Extension Mode**
   Determines whether the extension is running in development (`pirateship-dev.brwne-dev`) or production (`pirateship.brwne`) based on the extension ID and `BRWNE_MODE` environment variable.

2. **Load Environment Configuration**
   Loads `.env` or `.env.dev` using `dotenv`, depending on mode.

3. **Enable Auto-Save**
   Ensures VS Code is set to auto-save after a 1-second delay using `enableAutoSaveWithDelay()`.

4. **Initialize File and Editor Tracking**
   Calls `EditorTracker.getInstance()` to start watching file and editor changes.

5. **Trigger Initial Highlighting**
   Initializes highlighting system and calls `startPollingForChanges()` on the active file.

6. **Check CLI Availability**
   Executes `brd --version` to confirm Brwne CLI is available. Warns the user if not.

---

## 📴 Deactivation

### `deactivate(): void`

Cleans up persistent listeners related to highlighting using `cleanupHighlightListeners()`.

---

## ⚙️ Environment Setup

* `.env` or `.env.dev` files are expected in the root directory above `dist/`.
* Environment files are loaded conditionally depending on `BRWNE_MODE`.

---

## 🔗 Integrated Modules

This file coordinates functionality from several key subsystems:

* [`utils/enableAutoSave`](./utils/enableAutoSave.ts) — sets up 1-second auto-save delay.
* [`triggers/editorTracker`](./triggers/editorTracker.ts) — listens for file switches and content edits.
* [`highlights/highlightChanges`](./highlights/highlightChanges.ts) — renders inline and gutter-based highlights.
* [`cli-interface/getChangesToHighlight`](./cli-interface/getChangesToHighlight.ts) — starts polling for external changes.

---

## 📚 Example Use Case

When the Brwne extension activates:

1. It reads the correct `.env` config.
2. Sets VS Code to auto-save every 1 second.
3. Tracks user file activity to sync state.
4. Highlights edits and collaborative changes in real-time.
5. Notifies the user upon successful initialization or shows an error if CLI is missing.
