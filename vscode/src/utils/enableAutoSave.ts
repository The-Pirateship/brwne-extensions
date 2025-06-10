
import * as vscode from "vscode";

export function enableAutoSaveWithDelay() {
  // Obtain the 'files' configuration
  const filesConfig = vscode.workspace.getConfiguration('files');

  // Get current settings
  const currentAutoSave = filesConfig.get<string>('autoSave');
  const currentAutoSaveDelay = filesConfig.get<number>('autoSaveDelay');

  // Check if auto-save is already enabled with the desired delay
  if (currentAutoSave === 'afterDelay' && currentAutoSaveDelay === 1000) {
    return; // Do nothing if already set
  }

  // First, enable autoSave to "afterDelay"
  filesConfig.update('autoSave', 'afterDelay', vscode.ConfigurationTarget.Global)
    .then(() => {
      // Then, set the autoSaveDelay to 1000ms (1 second)
      return filesConfig.update('autoSaveDelay', 1000, vscode.ConfigurationTarget.Global);
    })
    .then(() => {
      vscode.window.showInformationMessage(
        'Auto-save after 1s delay has been enabled.'
      );
    });
}