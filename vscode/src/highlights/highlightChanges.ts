import { ExtensionContext, Range, window, workspace, Position, DecorationRangeBehavior, Disposable, Hover, MarkdownString, TextDocument, CancellationToken, HoverProvider } from "vscode";
import { DecorationsProvider } from "./DecorationsProvider";
import { getModifiedCharRangesFastDiff } from "./charDiffs";
import { FileDiff} from "./RepoDiff";

// Global state for persistent listeners and current decorations
let selectionChangeListener: Disposable | undefined;
let documentChangeListener: Disposable | undefined;
let lastHighlightCallTime = 0;
const HIGHLIGHT_DEBOUNCE_MS = 100;

// Current decoration state that listeners can access
let currentInlineDecorations: any[] = [];
let currentEditor: any = null;
let lastCursorLine = -1;
let globalContext: ExtensionContext;
let currentFileDiff: FileDiff | null = null;

// Hover provider
export class ChangesHoverProvider implements HoverProvider {
    provideHover(
        document: TextDocument,
        position: Position,
        token: CancellationToken
    ): Hover | undefined {
        if (!currentFileDiff || !currentFileDiff.hunks) {
            return;
        }

        const hoverLine = position.line;
        for (const hunk of currentFileDiff.hunks) {
            const startLine = hunk.Lines.OldStart - 1;
            const endLine = startLine + hunk.Lines.OldLineCount -1;

            if (hoverLine >= startLine && hoverLine <= endLine) {
                const oldLines = hunk.ContentOld.split('\n').filter(line => line);
                const newLines = hunk.ContentNew.split('\n').filter(line => line);

                let diff = '';
                if (oldLines.length > 0) {
                    diff += oldLines.map(line => `- ${line}`).join('\n');
                }
                if (newLines.length > 0) {
                    if (diff) diff += '\n';
                    diff += newLines.map(line => `+ ${line}`).join('\n');
                }
                
                const content = new MarkdownString();
                content.appendCodeblock(diff, 'diff');
                return new Hover(content, new Range(startLine, 0, endLine, 0));
            }
        }
    }
}

// Initialize persistent listeners - call this once during extension activation
export function initializeHighlightListeners(context: ExtensionContext) {
    // Store context globally
    globalContext = context;

    // Clean up any existing listeners first
    cleanupHighlightListeners();

    // Create persistent selection change listener
    selectionChangeListener = window.onDidChangeTextEditorSelection(event => {
        const editor = event.textEditor;
        if (!editor || editor !== currentEditor) return;

        const newCursorLine = editor.selection.active.line;
        if (newCursorLine !== lastCursorLine) {
            console.log("🔄 Cursor moved, updating inline decorations");
            updateInlineDecorations(editor);
            lastCursorLine = newCursorLine;
        }
    });

    // Create persistent document change listener
    documentChangeListener = workspace.onDidChangeTextDocument(event => {
        if (!currentEditor || event.document !== currentEditor.document || !event.contentChanges.length) {
            return;
        }

        // Update decoration positions when document changes
        event.contentChanges.forEach(change => {
            const startLine = change.range.start.line;
            const endLine = change.range.end.line;
            const lineChange = change.text.split('\n').length - (endLine - startLine + 1);

            // Adjust decoration positions
            currentInlineDecorations.forEach(decoration => {
                if (decoration.range.start.line > endLine) {
                    decoration.range = new Range(
                        decoration.range.start.line + lineChange,
                        decoration.range.start.character,
                        decoration.range.end.line + lineChange,
                        decoration.range.end.character
                    );
                } else if (startLine < decoration.range.end.line) {
                    decoration.range = new Range(
                        decoration.range.start.line,
                        decoration.range.start.character,
                        decoration.range.end.line + lineChange,
                        decoration.range.end.character
                    );
                }
            });
        });
    });

    // Add listeners to context for proper cleanup
    context.subscriptions.push(selectionChangeListener, documentChangeListener);
}

// Helper function to update inline decorations based on cursor position
function updateInlineDecorations(editor: any) {
    if (!editor || currentInlineDecorations.length === 0 || !globalContext) return;

    const decorations = DecorationsProvider.getInstance(globalContext);
    const cursorLine = editor.selection.active.line;

    const filteredDecorations = currentInlineDecorations.filter(decoration => {
        return decoration.range.start.line <= cursorLine && decoration.range.end.line >= cursorLine;
    });

    if (decorations.inlineTextDecorationType) {
        editor.setDecorations(decorations.inlineTextDecorationType, []);
        editor.setDecorations(decorations.inlineTextDecorationType, filteredDecorations);
    }
}

// the decor list is a MAP that persists the decorations that have been set
export async function highlightChanges(context: ExtensionContext, fileDiff: FileDiff) {
    // Debounce rapid successive calls
    const now = Date.now();
    if (now - lastHighlightCallTime < HIGHLIGHT_DEBOUNCE_MS) {
        console.log("🔄 Debouncing highlightChanges call");
        return;
    }
    lastHighlightCallTime = now;

    currentFileDiff = fileDiff;

    const decorations = DecorationsProvider.getInstance(context);

    // exiting if theres no active editor
    const editor = window.activeTextEditor;
    if (!editor) {
        window.showInformationMessage('Changes to highlight -> open a file first');
        return;
    }

    // Update global state
    currentEditor = editor;
    lastCursorLine = editor.selection.active.line;

    // func to get a list of lines in the users editor, from a start line num to an end line num (inclusive)
    const editorContentLines = async (start: number, end: number): Promise<string[]> => {
        const lastLine = editor.document.lineCount - 1;
        console.log(lastLine);
        const safeEnd = Math.min(end, lastLine);
        console.log(safeEnd);

        if (start > safeEnd) {
            console.warn("Start line is after end line. Returning empty array.");
            return [];
        }

        const text = editor.document.getText(
            new Range(
                new Position(start, 0),
                new Position(safeEnd, editor.document.lineAt(safeEnd).text.length)
            )
        );
        return text.split("\n");
    };

    try {
        // downloading the data from ice cream for which line ranges to highlight
        let LineRangesToHighlight: any[] = [];
        if (fileDiff && fileDiff.hunks) {
            LineRangesToHighlight = fileDiff.hunks;
        }

        console.log("theese are the line ranges: ", LineRangesToHighlight);

        let pleasePullRanges: Range[] = [];
        if (LineRangesToHighlight) {
            for (const item of LineRangesToHighlight) {
                console.log(item);
                if (item.PleasePull) {
                    const startLine = item.Lines.OldStart - 1; // Convert to 0-based index
                    var endLine = 0;
                    if (item.Lines.NewLineCount === item.Lines.OldLineCount) {
                        endLine = startLine + item.Lines.NewLineCount - 1;
                    }
                    else {
                        endLine = startLine + item.Lines.OldLineCount - item.Lines.NewLineCount - 1;
                    }
                    if (startLine < 0 || endLine >= editor.document.lineCount) {
                        console.error(`Invalid line range for pleasePull: ${startLine}-${endLine}`);
                        continue;
                    }

                    for (let line = startLine; line <= endLine; line++) {
                        const lineTextLength = editor.document.lineAt(line).text.length;
                        pleasePullRanges.push(new Range(line, 0, line, lineTextLength));
                        console.log("knnccb: ", pleasePullRanges);
                    }
                }
            }
        }


        // ### LOGIC FOR CONFLICT RANGES
        let conflictRanges: Range[] = [];
        if (LineRangesToHighlight) {
            for (const item of LineRangesToHighlight) {
                const startLine = item.Lines.OldStart - 1; // Convert to 0-based index
                var endLine = 0;
                if (item.Lines.NewLineCount === item.Lines.OldLineCount) {
                    endLine = startLine + item.Lines.NewLineCount - 1;
                }
                else {
                    endLine = startLine + item.Lines.OldLineCount - item.Lines.NewLineCount - 1;
                }
                console.log("this is my ednlien: ", endLine);

                // Fetch only the necessary lines from the editor
                const editorContent = await editorContentLines(startLine, endLine);
                console.log("this is the editor content: ", editorContent, startLine, endLine);
                const oldContentLines = item.ContentOld.split("\n");

                for (let i = 0; i < oldContentLines.length && i < editorContent.length; i++) {
                    const currLineNum = startLine + i;
                    const oldLine = oldContentLines[i];
                    const editorLine = editorContent[i];

                    if (editorLine !== oldLine) {
                        const newRanges = getModifiedCharRangesFastDiff(currLineNum, oldLine, editorLine);
                        conflictRanges.push(...newRanges);
                    }
                }

            }
        }

        console.log(conflictRanges, ": printed conflict ranges");

        // ### LOGIC FOR INLINE DECORATION RANGES
        let inlineDecorationOptionsLst = [];
        if (LineRangesToHighlight) {
            // iterating through each chunk of changes
            for (let index = 0; index < LineRangesToHighlight.length; index++) {

                const currentRange = LineRangesToHighlight[index];
                const lineNum = currentRange.Lines.OldStart - 1; // zero indexed
                const endLineNum = lineNum + currentRange.Lines.OldLineCount - 1;

                // calculating the max line length
                let maxLineLength = 0;
                for (let currLine = lineNum; currLine <= endLineNum; currLine++) {
                    const currLen = editor.document.lineAt(currLine).text.length;
                    if (currLen > maxLineLength) {
                        maxLineLength = currLen;
                    }
                }

                // creating a decoration for each line in this chunk
                for (let currLine = lineNum; currLine <= endLineNum; currLine++) {

                    const currLineLength = editor.document.lineAt(currLine).text.length;
                    if (currentRange.PleasePull) {
                        console.log("🏖️ decorating pp inline: ", currentRange);
                        inlineDecorationOptionsLst.push({
                            range: new Range(currLine, currLineLength, currLine, currLineLength),
                            renderOptions: {
                                rangeBehavior: DecorationRangeBehavior.OpenOpen,
                                after: {
                                    contentText: `\u00A0please pull, "${currentRange.Branch}" has updates\u00A0`,
                                    margin: `0 0 0 ${Math.max(1, maxLineLength - currLineLength)}ch`,
                                },
                            },
                        });
                    } else {
                        console.log("🏖️ decorating inline");
                        inlineDecorationOptionsLst.push({
                            range: new Range(currLine, currLineLength, currLine, currLineLength),
                            renderOptions: {
                                rangeBehavior: DecorationRangeBehavior.OpenOpen,
                                after: {
                                    contentText: `\u00A0@${currentRange.Author} is currently editing this line\u00A0`,
                                    margin: `0 0 0 ${Math.max(1, maxLineLength - currLineLength)}ch`,
                                    fontStyle: 'italic',
                                }
                            },
                        });
                    }
                }
            }
        }

        // Update global state with new decorations
        currentInlineDecorations = inlineDecorationOptionsLst;

        // ### LOGIC FOR GUTTER DECORATION RANGES
        let gutterDecorationRanges = [];
        if (LineRangesToHighlight) {
            for (const item of LineRangesToHighlight) {
                if (!item.PleasePull) {
                    console.log("this isnt a please pull: ", item);
                    const startLine = item.Lines.OldStart - 1; // Convert to 0-based index
                    var endLine = 0;
                    if (item.Lines.NewLineCount === item.Lines.OldLineCount) {
                        endLine = startLine + item.Lines.NewLineCount - 1;
                    }
                    else {
                        endLine = startLine + item.Lines.OldLineCount - item.Lines.NewLineCount;
                    }

                    if (startLine < 0 || endLine >= editor.document.lineCount) {
                        console.error(`Invalid line range: ${startLine}-${endLine}`);
                        continue;
                    }

                    for (let line = startLine; line <= endLine; line++) {
                        const lineTextLength = editor.document.lineAt(line).text.length;
                        gutterDecorationRanges.push(new Range(line, 0, line, lineTextLength));
                    }
                }
            }
        }

        console.log(gutterDecorationRanges, " these are the ones");

        // Apply all decorations
        if (decorations.gutterDecorationType) {
            editor.setDecorations(decorations.gutterDecorationType, []);
            editor.setDecorations(decorations.gutterDecorationType, gutterDecorationRanges);
        }

        if (decorations.redConflictDecorationType) {
            editor.setDecorations(decorations.redConflictDecorationType, []);
            editor.setDecorations(decorations.redConflictDecorationType, conflictRanges);
        }

        if (decorations.pleasePullDecorationType) {
            editor.setDecorations(decorations.pleasePullDecorationType, []);
            editor.setDecorations(decorations.pleasePullDecorationType, pleasePullRanges);
        }

        // Update inline decorations based on current cursor position
        updateInlineDecorations(editor);

    } catch (err) {
        console.error(err);
        window.showErrorMessage('Failed to highlight changes');
    }
}

// Function to clean up global listeners when extension deactivates
export function cleanupHighlightListeners() {
    if (selectionChangeListener) {
        selectionChangeListener.dispose();
        selectionChangeListener = undefined;
    }
    if (documentChangeListener) {
        documentChangeListener.dispose();
        documentChangeListener = undefined;
    }
    // Clear state
    currentInlineDecorations = [];
    currentEditor = null;
    lastCursorLine = -1;
}