// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { enableAutoSaveWithDelay } from "./utils/enableAutoSave";
import { cleanupHighlightListeners, initializeHighlightListeners } from "./highlights/highlightChanges";
import { EditorTracker } from "./triggers/editorTracker";
import { execSync } from "child_process";
import { startPollingForChanges } from "./cli-interface/getChangesToHighlight";

// This method is called when the brwne extension is activated on VSCode
export async function activate(context: vscode.ExtensionContext) {
  console.log("🔌 brwne activated");
  enableAutoSaveWithDelay();
  // run when we connect to the brwne localServer (first time or after an interrupt),
  const activeEditor = vscode.window.activeTextEditor;

  EditorTracker.getInstance(context);

  //TODO: Is it undefined???
  const brcmd = process.env.BRWNE_MODE === 'prod' ? 'br' : 'brd';

  try {
    execSync(`${brcmd}`, { stdio: 'ignore' });
  } catch {
    vscode.window.showErrorMessage("Brwne CLI not found. Please install and add to PATH.");
  }

  //get the current file
  const currFileRelPath = vscode.workspace.asRelativePath(activeEditor!.document.uri, /* includeWorkspaceFolder */ false);

  //Initilise the Highlighters
  initializeHighlightListeners(context);

  // startt polling for changes now
  if (activeEditor) {
    startPollingForChanges(currFileRelPath, context)
  }
}

// This method is called when your extension is deactivated
export function deactivate() {
  cleanupHighlightListeners();
}
