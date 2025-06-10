// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from 'fs';
import { enableAutoSaveWithDelay } from "./utils/enableAutoSave";
import { cleanupHighlightListeners, highlightChanges } from "./highlights/highlightChanges";
import { EditorTracker } from "./triggers/editorTracker";

let statusBarItem: vscode.StatusBarItem;

// This method is called when the brwne extension is activated on VSCode
export async function activate(context: vscode.ExtensionContext) {
  console.log("🔌 brwne activated");
  const thisExtension = vscode.extensions.getExtension('pirateship.brwne') || vscode.extensions.getExtension('pirateship-dev.brwne-dev');
  if (!thisExtension) {
    console.error("⚠️ Could not detect extension ID");
    vscode.window.showErrorMessage("Failed to initialize Brwne: Extension not found");
    return;
  }

  //TODO: SHIFT TO ONLY INFISICAL LOGIN
  console.log("What is this extension", thisExtension);
  const isDev = thisExtension.id === 'pirateship-dev.brwne-dev';
  const extensionId = isDev ? 'pirateship-dev.brwne-dev' : 'pirateship.brwne';
  context.globalState.update('brwne.extensionId', extensionId);
  const envFile = process.env.BRWNE_MODE === 'prod' ? '../.env' : '../.env.dev';
  console.log("THIS IS THE EXTENSIONS", vscode.extensions.all.map(e => e.id));
  console.log(process.env.BRWNE_MODE);
  console.log(`🧩 Running brwne in ${isDev ? 'DEV' : 'PRODUCTION'} mode`);

  const envPath = path.join(__dirname, '..', envFile);

  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    console.log(`✅ Loaded env file from ${envPath}`);
  } else {
    console.warn(`⚠️ No env file found at ${envPath}`);
  }
  enableAutoSaveWithDelay();

  // run when we connect to the brwne localServer (first time or after an interrupt),
  const activeEditor = vscode.window.activeTextEditor;

  EditorTracker.getInstance(context);

  vscode.window.showInformationMessage('Connected to the brwne localSever!');

  // Call highlightChanges now, startt polling for changes now
  if (activeEditor) {
    await highlightChanges(context);
  }
}

// This method is called when your extension is deactivated
export function deactivate() {
  cleanupHighlightListeners();
}
