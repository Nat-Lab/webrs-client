/**
 * Modifed from xterm.js WebLinkAddon. Original license:
 * Copyright (c) 2019 The xterm.js authors. All rights reserved.
 * @license MIT
 */

import { ILinkProvider, ILink, Terminal } from 'xterm';
import { BgpObjectType } from './BgpObjectType';

export class BgpLinkProvider implements ILinkProvider {
    private readonly _regexAs = /AS[1-9]+[0-9]*/g;

    // bad cidr part, but whatever
    private readonly _regexPrefix4 = /((?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\/[0-9]{1,2})/;
    private readonly _regexPrefix6 = /((([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))\/[0-9]{0,3})/;
    

    constructor(
        private readonly _terminal: Terminal,
        private readonly _handler: (event: MouseEvent, type: BgpObjectType, target: string) => void
    ) {

    }

    public provideLinks(y: number, cb: (links: ILink[] | undefined) => void): void {
        let results: ILink[] = [];
        results = results.concat(LinkComputer.computeLink(y, this._regexAs, this._terminal, BgpObjectType.Asn, this._handler));
        results = results.concat(LinkComputer.computeLink(y, this._regexPrefix4, this._terminal, BgpObjectType.Prefix4, this._handler));
        results = results.concat(LinkComputer.computeLink(y, this._regexPrefix6, this._terminal, BgpObjectType.Prefix6, this._handler));
        cb(results);
    }
}

export class LinkComputer {
    public static computeLink(y: number, regex: RegExp, terminal: Terminal, type: BgpObjectType, handler: (event: MouseEvent, type: BgpObjectType, target: string) => void): ILink[] {
        const rex = new RegExp(regex);

        const [line, startLineIndex] = LinkComputer._translateBufferLineToStringWithWrap(y - 1, false, terminal);

        let match;
        let stringIndex = -1;
        const result: ILink[] = [];

        while ((match = rex.exec(line)) !== null) {
            const text = match[0];
            if (!text) {
                // something matched but does not comply with the given matchIndex
                // since this is most likely a bug the regex itself we simply do nothing here
                console.log('match found without corresponding matchIndex');
                break;
            }

            // Get index, match.index is for the outer match which includes negated chars
            // therefore we cannot use match.index directly, instead we search the position
            // of the match group in text again
            // also correct regex and string search offsets for the next loop run
            stringIndex = line.indexOf(text, stringIndex + 1);
            rex.lastIndex = stringIndex + text.length;
            if (stringIndex < 0) {
                // invalid stringIndex (should not have happened)
                break;
            }

            let endX = stringIndex + text.length;
            let endY = startLineIndex + 1;

            while (endX > terminal.cols) {
                endX -= terminal.cols;
                endY++;
            }

            const range = {
                start: {
                    x: stringIndex + 1,
                    y: startLineIndex + 1
                },
                end: {
                    x: endX,
                    y: endY
                }
            };

            result.push({ range, text, activate: (event: MouseEvent, target: string) => handler(event, type, target) });
        }

        return result;
    }

    /**
     * Gets the entire line for the buffer line
     * @param line The line being translated.
     * @param trimRight Whether to trim whitespace to the right.
     * @param terminal The terminal
     */
    private static _translateBufferLineToStringWithWrap(lineIndex: number, trimRight: boolean, terminal: Terminal): [string, number] {
        let lineString = '';
        let lineWrapsToNext: boolean;
        let prevLinesToWrap: boolean;

        do {
            const line = terminal.buffer.active.getLine(lineIndex);
            if (!line) {
                break;
            }

            if (line.isWrapped) {
                lineIndex--;
            }

            prevLinesToWrap = line.isWrapped;
        } while (prevLinesToWrap);

        const startLineIndex = lineIndex;

        do {
            const nextLine = terminal.buffer.active.getLine(lineIndex + 1);
            lineWrapsToNext = nextLine ? nextLine.isWrapped : false;
            const line = terminal.buffer.active.getLine(lineIndex);
            if (!line) {
                break;
            }
            lineString += line.translateToString(!lineWrapsToNext && trimRight).substring(0, terminal.cols);
            lineIndex++;
        } while (lineWrapsToNext);

        return [lineString, startLineIndex];
    }
}