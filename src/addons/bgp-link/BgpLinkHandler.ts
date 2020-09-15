import { Terminal } from "xterm";
import { BgpObjectType } from "./BgpObjectType";
import { RipeApi } from "./RipeApi";

export class BgpLinkHandler {
    private _element: HTMLElement | undefined;
    private readonly _ripeApi: RipeApi | undefined;
    private readonly _touchMode: boolean | undefined;
   
    public constructor(private readonly _terminal: Terminal) {
        this._ripeApi = new RipeApi();
        this._touchMode = 'ontouchstart' in window;
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

        let cx = event.clientX;
        let cy = event.clientY;
        let winh = 'visualViewport' in window ? window.visualViewport.height : window.innerHeight;
        let winl = 'visualViewport' in window ? window.visualViewport.width : window.innerWidth;
        let ldir = cx <= winl/2 ? 'left' : 'right';
        let hdir = cy <= winh/2 ? 'top' : 'bottom';

        this._element.style[ldir] = `${cx <= winl/2 ? (cx + 5) : (winl - cx - 5)}px`;
        this._element.style[hdir] = `${cy <= winh/2 ? (cy + 5) : (winh - cy - 5)}px`;
        this._element.style.removeProperty(ldir == 'left' ? 'right' : 'left');
        this._element.style.removeProperty(hdir == 'top' ? 'bottom' : 'top');
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

    public handleBgpLink(event: MouseEvent | null, type: BgpObjectType, target: string, overrideOpen: boolean = false): void {
        if (this._touchMode && !overrideOpen) return;

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
        const verb = this._touchMode ? 'Tap here' : 'Click';
        const asNameHtml = `<div class="as-name loading" id="as-name">as-name loading...</div><div class="muted">${verb} to view on bgp.he.net.</div>`;

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
            case BgpObjectType.Prefix4: this._element.innerText = `${verb} to lookup IPv4 prefix on bgp.he.net.`; break;
            case BgpObjectType.Prefix6: this._element.innerText = `${verb} to lookup IPv6 prefix on bgp.he.net.`; break;
            case BgpObjectType.Command: this._element.innerText = `${verb} to run command in new window.`; break;
        }

        this._moveToolTip(event);

        if (!this._touchMode) this._terminal.element.addEventListener('mousemove', this._moveToolTip);
        else this._element.addEventListener('touchend', (e) => {
            this.handleBgpLink(null, type, target, true);
        });

        this._terminal.element.appendChild(this._element);
    }
    
    public handleBgpLinkLeave(event: MouseEvent, type: BgpObjectType, target: string): void {
        if (!this._element) return;

        this._element?.remove();
        this._element = undefined;
        if (!this._touchMode) this._terminal.element.removeEventListener('mousemove', this._moveToolTip);
    }

};