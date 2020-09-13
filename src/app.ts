import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { AttachAddon } from 'xterm-addon-attach';
import { BgpLinkAddon } from './addons/bgp-link/BgpLinkAddon';
import 'xterm/css/xterm.css';
import './css/style.css';

//const url = 'ws://127.0.0.1:8080/rs';
const url = 'wss://wsrs.nat.moe/rs';

let ws = new WebSocket(url);
const term = new Terminal({
    fontFamily: 'PT Mono',
    theme: {
        foreground: '#C5C8C6',
        background: '#1D1F21',
        cursor: '#C5C8C6',
        cursorAccent: '#C5C8C6',
        selection: null,
        black: '#373B41',
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

const attachAddon = new AttachAddon(ws);
term.loadAddon(attachAddon);

const bgpLinkAddon = new BgpLinkAddon();
term.loadAddon(bgpLinkAddon);

term.open(document.getElementById('terminal'));
fitAddon.fit();

term.write(`Trying ${url}...\r\n`);
window.onresize = () => fitAddon.fit();
ws.onopen = () => term.write(`Connected to ${url}.\r\n`)
ws.onerror = () => term.write('Connection reset.\r\n');
ws.onclose = () => term.write('Connection closed by foreign host.\r\n');