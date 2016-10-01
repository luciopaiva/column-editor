var ColumnEditorApp = (function () {
    function ColumnEditorApp(textAreaId) {
        var _this = this;
        this.inputBox = document.getElementById(textAreaId);
        this.lastDecodedInput = null;
        this.undoHistory = [];
        this.undoIndex = 0;
        this.pos2d = { line: 0, column: 0 };
        this.inputBox.onpaste = function (ev) { _this.parse(ev); };
        // ToDo implement undo/redo
        // this.inputBox.onkeydown = (ev: KeyboardEvent) => { this.handleKeyDown(ev); };
    }
    ColumnEditorApp.prototype.handleKeyDown = function (ev) {
        var isRedo = (ev.ctrlKey || ev.metaKey) && ev.keyCode == 89;
        var isUndo = (ev.ctrlKey || ev.metaKey) && ev.keyCode == 90;
        if (isUndo) {
            ev.preventDefault();
            if (this.undoIndex > 0) {
                this.undoIndex--;
                this.inputBox.value = this.undoHistory[this.undoIndex];
            }
        }
        else if (isRedo) {
            ev.preventDefault();
            console.info('Redo!');
        }
        else {
            this.undoHistory[this.undoIndex] = this.inputBox.value;
            this.undoIndex++;
        }
    };
    /**
     * Translate 1D to 2D.
     *
     * @param text string where to search for line breaks
     * @param currentCaretPos current caret position in 1 dimension
     * @returns Pos2D a zero-based, 2d coordinate [line, column]
     */
    ColumnEditorApp.prototype.getCaretPosition2D = function (text, currentCaretPos) {
        var line = 0;
        var lastLineBreakAt = -1;
        var len = Math.min(currentCaretPos, text.length);
        for (var i = 0; i < len; i++) {
            if (text.charCodeAt(i) == 10) {
                lastLineBreakAt = i;
                line++;
            }
        }
        this.pos2d.line = line;
        this.pos2d.column = currentCaretPos - lastLineBreakAt - 1;
        return this.pos2d;
    };
    /**
     * Translate 2D to 1D.
     *
     * @param text
     * @param currentCaretPos
     */
    ColumnEditorApp.getCaretPosition1D = function (text, currentCaretPos) {
        var curPos = 0;
        var curLine = 0;
        var curColumn = 0;
        var pos1d = 0;
        while (curPos < text.length && curLine != currentCaretPos.line && curColumn != currentCaretPos.column) {
            if (text.charCodeAt(pos1d) == 10) {
                curLine++;
                curColumn = 0;
            }
            else {
                curColumn++;
            }
            pos1d++;
        }
        return pos1d;
    };
    ColumnEditorApp.prototype.parse = function (ev) {
        ev.preventDefault();
        var existingText = this.inputBox.value.split('\n');
        var currentPosition = this.getCaretPosition2D(this.inputBox.value, this.inputBox.selectionStart);
        var toBePasted = ev.clipboardData.getData("text/plain").split('\n');
        var toBePastedWidth = toBePasted.map(function (l) { return l.length; }).reduce(function (acc, cur) { return Math.max(acc, cur); }, 0);
        var merged = [];
        // final line count is the union of old and new line sets, with new lines being displaced starting from cur line
        var numLines = Math.max(existingText.length, currentPosition.line + toBePasted.length);
        for (var l = 0; l < numLines; l++) {
            var lineStr = '';
            var existingBefore = '';
            var existingAfter = '';
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
                var toBePastedLine = toBePasted[l - currentPosition.line];
                while (toBePastedLine.length < toBePastedWidth) {
                    toBePastedLine += ' ';
                }
                lineStr += toBePastedLine;
            }
            else {
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
    };
    return ColumnEditorApp;
}());
new ColumnEditorApp('text');
