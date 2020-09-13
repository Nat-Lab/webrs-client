/**
 * Modifed from xterm.js WebLinkAddon. Original license:
 * Copyright (c) 2019 The xterm.js authors. All rights reserved.
 * @license MIT
 */

import { Terminal, ITerminalAddon, IDisposable } from 'xterm';
import { BgpLinkProvider } from './BgpLinkProvider';
import { BgpLinkHandler } from './BgpLinkHandler';

export class BgpLinkAddon implements ITerminalAddon {
    private _terminal: Terminal | undefined;
    private _linkProvider: IDisposable | undefined;
    private _bgpLinkHandler: BgpLinkHandler | undefined;

    public activate(terminal: Terminal): void {
        this._terminal = terminal;
        this._bgpLinkHandler = new BgpLinkHandler(this._terminal);
        this._linkProvider = this._terminal.registerLinkProvider(
            new BgpLinkProvider(
                this._terminal,
                this._bgpLinkHandler.handleBgpLink.bind(this._bgpLinkHandler),
                this._bgpLinkHandler.handleBgpLinkHover.bind(this._bgpLinkHandler),
                this._bgpLinkHandler.handleBgpLinkLeave.bind(this._bgpLinkHandler)));
    }

    public dispose(): void {
        this._linkProvider?.dispose();
    }
}