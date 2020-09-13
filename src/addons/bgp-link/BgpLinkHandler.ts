import { Terminal } from "xterm";
import { BgpObjectType } from "./BgpObjectType";

export class BgpLinkHandler {
    private _element: HTMLElement | undefined;
   
    public constructor(private readonly _terminal: Terminal) {

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
        console.log(`hover: ${target}`);

        if (this._element) {
            console.warn('link hover: last element not removed.');
            return;
        }

        this._element = document.createElement('div');
        this._element.classList.add('xterm-hover');
        this._element.classList.add('tooltip');
        
        switch(type) {
            case BgpObjectType.Asn:
            case BgpObjectType.Prefix4:
            case BgpObjectType.Prefix6:
                this._element.innerText = 'Open in bgp.he.net.';
                break;
            case BgpObjectType.Command:
                this._element.innerText = 'Run command in new window.';
                break;
        }
        
        this._element.style.left = `${event.clientX}px`;
        this._element.style.top = `${event.clientY}px`;
        console.log(this._element);

        this._terminal.element.appendChild(this._element);
    }
    
    public handleBgpLinkLeave(event: MouseEvent, type: BgpObjectType, target: string): void {
        console.log(`leave: ${target}`);
        if (!this._element) return;

        this._element?.remove();
        this._element = undefined;
    }
};