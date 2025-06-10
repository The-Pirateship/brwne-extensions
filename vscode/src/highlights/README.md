# highlights

The `highlights` module is responsible for visually annotating active code editor windows in VS Code using a variety of decoration types. These decorations include gutter icons, inline annotations, and background highlights that indicate real-time collaboration states, merge conflicts, or repository sync status.

This system enables a live collaborative coding experience by tracking code diffs and visually signaling line-level activity in the editor.

---

## Overview

This module includes:

- **Inline decorations** — to annotate lines with active authors or pull suggestions.
- **Gutter icons** — for visually marking changed lines or alerts.
- **Conflict highlights** — red background spans to indicate merge conflicts or modified lines.
- **Cursor-aware dynamic updates** — inline annotations update as the cursor moves.
- **Debounced re-highlighting** — prevents redundant diff fetches when user rapidly edits or moves.


> 🔧 **Note**: 
- Currently relies on a Git server API (`getGitDiffFromGitServer`), but this is slated to transition to a CLI-based integration.
- `highlightChanges()` is directly invoked by the root `extension.ts` during activation to immediately annotate the active file, before user interaction begins.


---

## Modules

### [`decorationsProvider.ts`](./decorationsProvider.ts)

**Purpose:**  
Central singleton service that initializes and manages all `TextEditorDecorationType` instances used across the extension.

**Exports:**

- `DecorationsProvider.getInstance(context: ExtensionContext): DecorationsProvider`  
  Returns the singleton instance, creating it if necessary.

**Available Decorations:**

- `inlineTextDecorationType`: Inline annotations shown to the right of edited lines.
- `redConflictDecorationType`: Red background span for conflicting text ranges.
- `gutterDecorationType`: Arrow gutter icon for general changes.
- `pleasePullDecorationType`: Special icon for "please pull" warnings.

---

### [`charDiffs.ts`](./charDiffs.ts)

**Purpose:**  
Performs character-level diffing between two lines of text using the `fast-diff` library.

**Exports:**

- `getModifiedCharRangesFastDiff(lineNum: number, oldStr: string, newStr: string): Range[]`  
  Returns VS Code `Range` objects for inserted segments on a per-line basis.

---

### [`highlightChanges.ts`](./highlightChanges.ts)

**Purpose:**  
The heart of the visual diff system — fetches repo diffs and translates them into editor decorations in near real-time. It also manages persistent listeners to keep decorations in sync with user interactions.

**Key Exports:**

- `highlightChanges(context: ExtensionContext): Promise<void>`  
  Fetches diff info and applies inline/gutter/conflict decorations to the active editor.

- `initializeHighlightListeners(context: ExtensionContext): void`  
  Sets up persistent listeners for cursor movement and text changes to keep decorations current.

- `cleanupHighlightListeners(): void`  
  Tears down all highlight listeners and resets internal state.

**Key Logic:**

- Diffs are pulled using `getGitDiffFromGitServer()` (to be replaced with CLI).
- Inline messages like _"please pull, branch has updates"_ or _"@user is editing this line"_ are shown.
- Gutter icons and red highlight overlays reflect diff state and conflict regions.
- Cursor-aware logic ensures only relevant inline decorations are visible at a time.

---

## Design Notes

- **Debounced refreshes** are implemented via `HIGHLIGHT_DEBOUNCE_MS` to optimize performance.
- Decorations automatically adjust position on document edits to remain accurate.
- Inline messages include styling such as spacing and italics, and respect the longest line to maintain alignment.
- All decoration logic uses VS Code’s built-in `TextEditorDecorationType` system and `Range`/`Position` APIs.

---

## Requirements

- Currently depends on:
  - A Git server or diff provider (`getGitDiffFromGitServer`)
  - Editor context (`window.activeTextEditor`)
  - Merge base logic via `getMergeBaseSync()`

---

## Example Use Cases

- Displaying active edits from collaborators.
- Highlighting incoming changes on a tracked branch.
- Alerting users to out-of-sync lines that require a pull.
- Visually distinguishing merge conflicts for review and resolution.

