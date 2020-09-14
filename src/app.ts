import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { AttachAddon } from 'xterm-addon-attach';
import { BgpLinkAddon } from './addons/bgp-link/BgpLinkAddon';
import 'xterm/css/xterm.css';
import './css/style.css';
const pkg: any = require('../package.json');

//const url = 'ws://127.0.0.1:8080/rs';
const url = 'wss://wsrs.nat.moe/rs';

const term = new Terminal({
    theme: {
        foreground: '#C5C8C6',
        background: '#1D1F21',
        cursor: '#C5C8C6',
        cursorAccent: '#C5C8C6',
        black: '#555555',
        red: '#CC6666',
        green: '#B5BD68',
        yellow: '#F0C674',
        blue: '#81A2BE',
        magenta: '#B294BB',
        cyan: '#8ABEB7',
        white: '#C5C8C6'
        // TODO: add "bright" colors
    }
});

const fitAddon = new FitAddon();
term.loadAddon(fitAddon);

const handleSizeChange = function() {
    let dim = fitAddon.proposeDimensions();
    fitAddon.fit();
    if (ws.readyState == 1) {
        ws.send(`\t\r\n\ttermsz;${dim.rows},${dim.cols}`);
    }
};

const bgpLinkAddon = new BgpLinkAddon();
term.loadAddon(bgpLinkAddon);

term.open(document.getElementById('terminal'));
term.write(`\x1b[0;30mnato webrs client ${pkg.version} ready.\x1b[0m\r\n`);

if (window.visualViewport) { // fucking iOS Safari
    document.documentElement.addEventListener('touchmove', e => e.preventDefault(), { passive: false });
    window.visualViewport.onresize = function() {
        document.documentElement.style.height = `${this.height}px`;
        handleSizeChange();
    };
} else window.onresize = () => handleSizeChange();

term.write(`\x1b[0;30mTrying ${url}...\x1b[0m\r\n`);

let ws = new WebSocket(`${url}/`);
const attachAddon = new AttachAddon(ws);
term.loadAddon(attachAddon);

ws.onopen = () => {
    handleSizeChange();
    term.write(`\x1b[0;30mConnected to ${url}.\x1b[0m\r\n`);
    term.focus();

    let hash = window.location.hash;

    if (hash != '') {
        ws.send(`${window.decodeURIComponent(hash.replace('#', ''))}\r`);
    }
}
ws.onerror = () => term.write('\x1b[0;30mConnection reset.\x1b[0m\r\n');
ws.onclose = () => term.write('\x1b[0;30mConnection closed by foreign host.\x1b[0m\r\n');