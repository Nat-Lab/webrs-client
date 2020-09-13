import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { AttachAddon } from 'xterm-addon-attach';
import 'xterm/css/xterm.css';
import './css/style.css';

//const url = 'ws://127.0.0.1:8080/rs';
const url = 'wss://wsrs.nat.moe/rs';

let ws = new WebSocket(url);
const term = new Terminal();

const fitAddon = new FitAddon();
term.loadAddon(fitAddon);

const attachAddon = new AttachAddon(ws);
term.loadAddon(attachAddon);

term.open(document.getElementById('terminal'));
fitAddon.fit();

term.write(`Trying ${url}...\r\n`);
window.onresize = () => fitAddon.fit();
ws.onopen = () => term.write(`Connected to ${url}.\r\n`)
ws.onerror = () => term.write('Connection reset.\r\n');
ws.onclose = () => term.write('Connection closed by foreign host.\r\n');