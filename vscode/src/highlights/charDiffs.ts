import diff from 'fast-diff';
import { Range, Position } from "vscode";

//TODO: smth to consider... onChangeTextDocument basically tells you where the change is down to the character
// function to get charecter level diffs
export function getModifiedCharRangesFastDiff(lineNum: number, oldStr: string, newStr: string) {
    const diffs = diff(oldStr, newStr);

    let currentIndex = 0;
    const ranges: Range[] = [];

    diffs.forEach(([type, text]) => {
        const length = text.length;
        if (type === 1) {
            ranges.push( new Range(
            new Position(lineNum, currentIndex),
            new Position(lineNum, currentIndex + length),
            ));
        // Added
        currentIndex += length;
        } else if (type === -1) {
            // Removed
        } else {
            // Unchanged
            currentIndex += length;
        }
  });

  return ranges;
}
