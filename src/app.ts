import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';
import './css/style.css';

let pendingDels: number = 0;

/*enum Direction {
    Left, Right
};

const revertMoveMap: string[] = [`\x1b[C`, `\x1b[D`];

let pendingMoves: Direction[] = [];*/

function attach() {
    term.reset();
    ws.onmessage = (message) => {
        let data = new Uint8Array(message.data);
        if (data.length < 1) return;

        let spaces = data[data.length - 1] == 0x20 ? 1 : 0; // means del event accepted
        let bells = data.filter(d => d == 0x07).length; // means any event rejected

        spaces = data.every(d => d == 0x20) ? data.length : spaces;
        bells = data.every(d => d == 0x07) ? data.length : bells;

        let space_omit: number = 0;

        if (pendingDels > 0) {
            space_omit = pendingDels >= spaces ? spaces : pendingDels - spaces;
            term.write('\x1b[D \x1b[D'.repeat(space_omit));
            pendingDels -= spaces;
            spaces = -pendingDels;
            pendingDels = pendingDels < 0 ? 0 : pendingDels;
        }

        if (pendingDels > 0) {
            pendingDels -= bells;
            bells -= pendingDels;
            pendingDels = pendingDels < 0 ? 0 : pendingDels;
        }

        /*if (bells > 0) {
            for (; bells > 0; bells--) {
                let d: Direction = pendingMoves.pop();
                term.write(revertMoveMap[d]);
            }
        }*/

        let i = 0;
        term.write(data.filter(v => { if (v == 0x20) i++; return v != 0x20 || i > space_omit; }));
        
    }
    term.onData((data) => {
        if (data.length < 0) return;
        //let local_echo: boolean = false;
        if (data == '\x7f') pendingDels++;
        //if (data == `\x1b[D`) { pendingMoves.push(Direction.Left); local_echo = true; }
        //if (data == `\x1b[C`) { pendingMoves.push(Direction.Right); local_echo = true; }
        //if (local_echo) term.write(data);
        if (data[0] < '\x20' && (data[0] != '\x0d')) return; // fuck it

        ws.send(data);
    });
}

let ws = new WebSocket('ws://127.0.0.1:8080');
const term = new Terminal();
const fitAddon = new FitAddon();
term.loadAddon(fitAddon);

term.open(document.getElementById('terminal'));
fitAddon.fit();

window.onresize = () => fitAddon.fit();
ws.binaryType = 'arraybuffer';
ws.onopen = () => attach();
ws.onerror = () => term.write('Error connecting to rs.\n');
ws.onclose = () => term.write('Disconnected.\n');
