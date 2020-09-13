/**
 * Modifed from xterm.js WebLinkAddon. Original license:
 * Copyright (c) 2019 The xterm.js authors. All rights reserved.
 * @license MIT
 */

import { Terminal, ITerminalAddon, IDisposable } from 'xterm';
import { BgpLinkProvider } from './BgpLinkProvider';
import { BgpObjectType } from './BgpObjectType';

function handleBgpLink(event: MouseEvent, type: BgpObjectType, target: string): void {
    const newWindow = window.open();
    if (newWindow) {
        newWindow.opener = null;
        newWindow.location.href = `https://bgp.he.net/search?search%5Bsearch%5D=${target}`;
    } else {
        console.warn('Opening link blocked as opener could not be cleared');
    }
}

export class BgpLinkAddon implements ITerminalAddon {
    private _terminal: Terminal | undefined;
    private _linkProvider: IDisposable | undefined;

    constructor(
        private _handler: (event: MouseEvent, type: BgpObjectType, target: string) => void = handleBgpLink,
    ) {
    }

    public activate(terminal: Terminal): void {
        this._terminal = terminal;
        this._linkProvider = this._terminal.registerLinkProvider(new BgpLinkProvider(this._terminal, this._handler));
    }

    public dispose(): void {
        if (this._linkProvider) this._linkProvider.dispose();
    }
}