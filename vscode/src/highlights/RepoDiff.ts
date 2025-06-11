interface Lines {
    OldStart: number;
    OldLineCount: number;
    NewStart: number;
    NewLineCount: number;
}

interface HunkData {
    PleasePull: boolean;
    Lines: Lines;
    ContentOld: string;
    ContentNew: string;
    Author: string;
    Branch: string;
}

export interface FileDiff {
    filename: string;
    hunks: HunkData[];
}

export interface RepoDiff {
    [filename: string]: FileDiff;
}
