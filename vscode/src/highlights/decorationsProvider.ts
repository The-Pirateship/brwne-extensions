import { Uri, window, TextEditorDecorationType, ExtensionContext } from "vscode";

export class DecorationsProvider {
    private static instance: DecorationsProvider | null = null; // Singleton instance

    public initialised: boolean = false;

    public gutterDecorationType: TextEditorDecorationType | null = null; // Set in constructor

    public pleasePullDecorationType: TextEditorDecorationType | null = null; // Set in constructor

    public inlineTextDecorationType = window.createTextEditorDecorationType({
        after: {
            backgroundColor: "#82b182",
            color: '#000000',
            margin: '0 0 0 8ch',
        },
    });

    public redConflictDecorationType = window.createTextEditorDecorationType({
        backgroundColor: 'rgba(255, 0, 0, 0.36)', // Dark red highlight
        isWholeLine: false,
    });

    private constructor(context: ExtensionContext) {
        this.gutterDecorationType = window.createTextEditorDecorationType({
            gutterIconPath: Uri.joinPath(context.extensionUri, 'assets/arrow.png'),
            gutterIconSize: 'cover',
        });

        this.pleasePullDecorationType = window.createTextEditorDecorationType({
            gutterIconPath: Uri.joinPath(context.extensionUri, 'assets/pleasepull.png'),
            gutterIconSize: 'cover'
        });


        this.initialised = true;
    }

    // Singleton accessor method
    public static getInstance(context: ExtensionContext): DecorationsProvider {
        if (!DecorationsProvider.instance) {
            DecorationsProvider.instance = new DecorationsProvider(context);
        }
        return DecorationsProvider.instance;
    }
}
