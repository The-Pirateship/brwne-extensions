// editorTracker.ts
import * as vscode from "vscode";
import { uploadWorkingChanges } from "../cli-interface/uploadWorkingChanges";
import {
    startPollingForChanges,
    stopPollingForChanges,
} from "../cli-interface/getChangesToHighlight";

export class EditorTracker {
    private static instance: EditorTracker;
    private disposables: vscode.Disposable[] = [];
    private context: vscode.ExtensionContext | undefined;
    private currentFile: string | undefined;

    private constructor() {
        this.initializeListeners();
    }

    public static getInstance(context: vscode.ExtensionContext): EditorTracker {
        if (!EditorTracker.instance) {
            EditorTracker.instance = new EditorTracker();
            EditorTracker.instance.context = context;
        }
        return EditorTracker.instance;
    }

    private getRelativePath(uri: vscode.Uri): string {
        return vscode.workspace.asRelativePath(uri, false);
    }

    private initializeListeners(): void {
        // 🔄 track active editor changes
        this.disposables.push(
            vscode.window.onDidChangeActiveTextEditor((editor) => {
                if (!editor) {
                    console.log(
                        "Editor is null for a brief moment before changing to different file."
                    );
                    return;
                }
                const newRelPath = this.getRelativePath(editor.document.uri);
                if (this.currentFile !== newRelPath) {
                    stopPollingForChanges(this.currentFile!);
                    this.currentFile = newRelPath;
                    if (this.context) {
                        startPollingForChanges(this.currentFile, this.context);
                    }
                }
            })
        );

        // ⌨️ track content changes on file save
        this.disposables.push(
            vscode.workspace.onDidSaveTextDocument(async (event) => {
                uploadWorkingChanges();
            })
        );
        // 🚀 get initial state
        const activeEditor = vscode.window.activeTextEditor;
        if (activeEditor) {
            this.currentFile = this.getRelativePath(activeEditor.document.uri);
            if (this.context) {
                startPollingForChanges(this.currentFile, this.context);
            }
        }
    }

    public dispose(): void {
        this.disposables.forEach((d) => d.dispose());
    }
}
