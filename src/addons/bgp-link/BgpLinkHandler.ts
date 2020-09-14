import { IDisposable, Terminal } from "xterm";
import { BgpObjectType } from "./BgpObjectType";
import { RipeApi } from "./RipeApi";

export class BgpLinkHandler {
    private _element: HTMLElement | undefined;
    private readonly _ripeApi: RipeApi;
   
    public constructor(private readonly _terminal: Terminal) {
        this._ripeApi = new RipeApi();
    }

    private static _openLink(url: string) {
        const newWindow = window.open();
        if (newWindow) {
            newWindow.opener = null;
            newWindow.location.href = url;
        } else {
            console.warn('Opening link blocked as opener could not be cleared');
        }
    }

    private _moveToolTip = (event: MouseEvent) => {
        if (!this._element) return;
        this._element.style.left = `${event.clientX + 5}px`;
        this._element.style.top = `${event.clientY + 5}px`;
    }

    private async _loadTooltipAsnName(asn: string) {
        let asNames = await this._ripeApi.getAsNames([asn]);
        let el = document.getElementById('as-name');
        if (el) {
            let asName: string | undefined = asNames[asn.replace('AS', '')];
            el.innerText = asName ? asName : 'Error looking up as-name.';
            el.classList.remove('loading');
        }
    }

    public handleBgpLink(event: MouseEvent, type: BgpObjectType, target: string): void {
        switch (type) {
            case BgpObjectType.Asn:
            case BgpObjectType.Prefix4:
            case BgpObjectType.Prefix6:
                BgpLinkHandler._openLink(`https://bgp.he.net/search?search%5Bsearch%5D=${target}`);
                break;
            case BgpObjectType.Command:
                BgpLinkHandler._openLink(`${window.location.pathname}#${window.encodeURIComponent(target)}`);
                break;
        }
    }
    
    public handleBgpLinkHover(event: MouseEvent, type: BgpObjectType, target: string): void {
        const asNameHtml = '<div class="as-name loading" id="as-name">as-name loading...</div><div class="muted">Click to view on bgp.he.net.</div>';

        if (this._element) {
            console.warn('link hover: last element not removed.');
            return;
        }

        this._element = document.createElement('div');
        this._element.classList.add('xterm-hover');
        this._element.classList.add('tooltip');
        
        switch(type) {
            case BgpObjectType.Asn: {
                this._element.innerHTML = asNameHtml;
                this._loadTooltipAsnName(target);
                break;
            }
            case BgpObjectType.Prefix4: this._element.innerText = 'Lookup IPv4 prefix on bgp.he.net.'; break;
            case BgpObjectType.Prefix6: this._element.innerText = 'Lookup IPv6 prefix on bgp.he.net.'; break;
            case BgpObjectType.Command: this._element.innerText = 'Run command in new window.'; break;
        }

        this._moveToolTip(event);
        this._terminal.element.addEventListener('mousemove', this._moveToolTip);
        this._terminal.element.appendChild(this._element);
    }
    
    public handleBgpLinkLeave(event: MouseEvent, type: BgpObjectType, target: string): void {
        if (!this._element) return;

        this._element?.remove();
        this._element = undefined;
        this._terminal.element.removeEventListener('mousemove', this._moveToolTip);
    }

};