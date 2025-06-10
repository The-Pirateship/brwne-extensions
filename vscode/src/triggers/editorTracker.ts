// editorTracker.ts
import * as vscode from 'vscode';
import { uploadWorkingChanges } from '../cli-interface/uploadWorkingChanges';
import { startPollingForChanges } from '../cli-interface/getChangesToHighlight';

export class EditorTracker {
    private static instance: EditorTracker;
    private disposables: vscode.Disposable[] = [];
    private context: vscode.ExtensionContext | undefined;
    private currentFile: string | undefined;

    // getting an instance of out Websocket manager singleton
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

    private initializeListeners(): void {

        // track active editor changes (user changes what file they are activly editing)
        this.disposables.push(
            vscode.window.onDidChangeActiveTextEditor(editor => {
                if (!editor) {
                    console.log("Editor is null for a brief moment before changing to different file.");
                    return;
                }
                const newFile = editor?.document.uri.fsPath;
                if (this.currentFile !== newFile) {
                    this.currentFile = newFile;
                    startPollingForChanges(this.currentFile!)
                }
            })
        );
        // track content changes (typing, deleting, etc.)
        this.disposables.push(
            vscode.workspace.onDidChangeTextDocument(async event => {
                // Ignore untitled or virtual docs
                if (event.document.isUntitled || event.document.uri.scheme !== 'file') {
                    return;
                }

                // Only send if there are actual content changes
                if (event.contentChanges.length === 0) {
                    return;
                }

                uploadWorkingChanges()
            })
        );

        // get initial state
        this.currentFile = vscode.window.activeTextEditor?.document.uri.fsPath;

        // send initial state
        startPollingForChanges(this.currentFile!)
    }

    public dispose(): void {
        this.disposables.forEach(d => d.dispose());
    }
}