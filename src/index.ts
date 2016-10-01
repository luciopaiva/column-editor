
interface Pos2D {
    line: number;
    column: number;
}

class ColumnEditorApp {

    private inputBox: HTMLInputElement;
    private lastDecodedInput: string;
    private undoHistory: string[];
    private undoIndex: number;
    private pos2d: Pos2D;

    constructor (textAreaId: string) {
        this.inputBox = document.getElementById(textAreaId) as HTMLInputElement;
        this.lastDecodedInput = null;
        this.undoHistory = [];
        this.undoIndex = 0;
        this.pos2d = { line: 0, column: 0 };

        this.inputBox.onpaste = (ev: Event) => { this.parse(ev as ClipboardEvent); };

        // ToDo implement undo/redo
        // this.inputBox.onkeydown = (ev: KeyboardEvent) => { this.handleKeyDown(ev); };
    }

    private handleKeyDown(ev: KeyboardEvent) {
        let isRedo = (ev.ctrlKey || ev.metaKey) && ev.keyCode == 89;
        let isUndo = (ev.ctrlKey || ev.metaKey) && ev.keyCode == 90;

        if (isUndo) {
            ev.preventDefault();
            if (this.undoIndex > 0) {
                this.undoIndex--;
                this.inputBox.value = this.undoHistory[this.undoIndex];
            }
        } else if (isRedo) {
            ev.preventDefault();
            console.info('Redo!');
        } else {
            this.undoHistory[this.undoIndex] = this.inputBox.value;
            this.undoIndex++;
        }
    }

    /**
     * Translate 1D to 2D.
     *
     * @param text string where to search for line breaks
     * @param currentCaretPos current caret position in 1 dimension
     * @returns Pos2D a zero-based, 2d coordinate [line, column]
     */
    private getCaretPosition2D(text: string, currentCaretPos: number): Pos2D {
        let line = 0;
        let lastLineBreakAt = -1;
        let len = Math.min(currentCaretPos, text.length);

        for (let i = 0; i < len; i++) {
            if (text.charCodeAt(i) == 10) {
                lastLineBreakAt = i;
                line++;
            }
        }

        this.pos2d.line = line;
        this.pos2d.column = currentCaretPos - lastLineBreakAt - 1;
        return this.pos2d;
    }

    /**
     * Translate 2D to 1D.
     *
     * @param text
     * @param currentCaretPos
     */
    private static getCaretPosition1D(text: string, currentCaretPos: Pos2D): number {
        let curPos = 0;
        let curLine = 0;
        let curColumn = 0;
        let pos1d = 0;

        while (curPos < text.length && curLine != currentCaretPos.line && curColumn != currentCaretPos.column) {
            if (text.charCodeAt(pos1d) == 10) {
                curLine++;
                curColumn = 0;
            } else {
                curColumn++;
            }
            pos1d++;
        }

        return pos1d;
    }

    private parse(ev: ClipboardEvent) {
        ev.preventDefault();

        let existingText = this.inputBox.value.split('\n');
        let currentPosition = this.getCaretPosition2D(this.inputBox.value, this.inputBox.selectionStart);
        let toBePasted = ev.clipboardData.getData("text/plain").split('\n');
        let toBePastedWidth = toBePasted.map(l => l.length).reduce((acc, cur) => Math.max(acc, cur), 0);

        let merged = [];
        // final line count is the union of old and new line sets, with new lines being displaced starting from cur line
        let numLines = Math.max(existingText.length, currentPosition.line + toBePasted.length);

        for (let l = 0; l < numLines; l++) {
            let lineStr = '';
            let existingBefore = '';
            let existingAfter = '';

            // put original line, if there was one
            if (l < existingText.length) {
                existingBefore = existingText[l].substring(0, currentPosition.column);
                existingAfter = existingText[l].substring(currentPosition.column);
                lineStr += existingBefore;
            }

            // pad with spaces
            while (lineStr.length < currentPosition.column) {
                lineStr += ' ';
            }

            // add the new line, if there is one
            if (l >= currentPosition.line && l < (currentPosition.line + toBePasted.length)) {
                let toBePastedLine = toBePasted[l - currentPosition.line];
                while (toBePastedLine.length < toBePastedWidth) {
                    toBePastedLine += ' ';
                }
                lineStr += toBePastedLine;
            } else {
                while (lineStr.length < currentPosition.column + toBePastedWidth) {
                    lineStr += ' ';
                }
            }

            // add content that needed to be shifted to the right
            lineStr += existingAfter;

            merged.push(lineStr);
        }

        this.inputBox.value = merged.join('\n');
        this.inputBox.selectionStart = this.inputBox.selectionEnd =
            ColumnEditorApp.getCaretPosition1D(this.inputBox.value, currentPosition);
    }
}

new ColumnEditorApp('text');
