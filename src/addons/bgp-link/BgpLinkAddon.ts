/**
 * Modifed from xterm.js WebLinkAddon. Original license:
 * Copyright (c) 2019 The xterm.js authors. All rights reserved.
 * @license MIT
 */

import { Terminal, ITerminalAddon, IDisposable } from 'xterm';
import { BgpLinkProvider } from './BgpLinkProvider';
import { BgpObjectType } from './BgpObjectType';

function openLink(url: string) {
    const newWindow = window.open();
    if (newWindow) {
        newWindow.opener = null;
        newWindow.location.href = url;
    } else {
        console.warn('Opening link blocked as opener could not be cleared');
    }
}

function handleBgpLink(event: MouseEvent, type: BgpObjectType, target: string): void {
    switch (type) {
        case BgpObjectType.Asn:
        case BgpObjectType.Prefix4:
        case BgpObjectType.Prefix6:
            openLink(`https://bgp.he.net/search?search%5Bsearch%5D=${target}`);
            break;
        case BgpObjectType.Command:
            openLink(`${window.location.pathname}#${window.encodeURIComponent(target)}`);
            break;
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