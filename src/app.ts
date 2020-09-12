import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import LocalEchoController from './3rdparty/local-echo/LocalEchoController';
import 'xterm/css/xterm.css';
import './css/style.css';

let tryBlock: boolean = false;
let blocked: boolean = true;
let ready: boolean = false;
let serverBuffer: string = '';

let resolveMore: () => void = function() {};

let more = function() {
    blocked = true;
    let p = new Promise<void>((res, _) => {
        resolveMore = function() {
            res();
            blocked = false;
            console.log('input unblocked.');
        };
    });
    if (!tryBlock) resolveMore();
    if (tryBlock) console.log('blocked input.');
    return p;
}

async function reader() {
    while (ready) {
        try {
            await more();
            await (function () {
                let p = localEcho.read('rs> ', '> ');
                if (serverBuffer != '') {
                    localEcho.handleTermData(serverBuffer);
                }
                return p;
            })();
        } catch (e) {
            console.warn(`abort cli: ${e}`);
        }
    }
}

function attach() {
    ws.onmessage = (message) => {
        var msg = message.data as string;
        console.log(`in: "${msg}"`);

        let resMatch = msg.match(/rs> ([^\n]*)$/);
        console.log(resMatch);

        if (resMatch) {
            serverBuffer = resMatch[1];
        }

        if (tryBlock && resMatch) {
            if (blocked) {
                msg = msg.replace(/rs> /g, '');
                tryBlock = false;
                resolveMore();
            }
        }

        if (!msg.includes('rs> ')) {
            tryBlock = true;
        }

        if (!msg.includes('\n') || msg == '\n') return;
        if (msg == '\r\n') return;
        msg = msg.replace(/\?/g, '');

        if (msg.includes('--More--')) {
            localEcho.abortRead('--More-- block');
            tryBlock = true;
        }

        console.log(`blocked: ${blocked}`);
        if (!ready) msg = msg.replace('rs> ', '');

        if (!ready) {
            ready = true;
            reader();
        }

        term.write(msg);
    }

    term.onData((data) => {
        if (data.length < 0) return;
        if (data[0] == '?') localEcho._input = localEcho._input.replace(/\?/g, '');
        ws.send(data);
        console.log(`out: "${data}"`);
    });
}

let ws = new WebSocket('wss://wsrs.nat.moe/rs');
//let ws = new WebSocket('ws://127.0.0.1:8080/rs');

const term = new Terminal();

const fitAddon = new FitAddon();
term.loadAddon(fitAddon);

const localEcho = new LocalEchoController();
term.loadAddon(localEcho);

term.open(document.getElementById('terminal'));
fitAddon.fit();

window.onresize = () => fitAddon.fit();
ws.onopen = () => attach();
ws.onerror = () => {
    ready = false;
    term.write('Error connecting to rs.\r\n');
}
ws.onclose = () => {
    ready = false;
    term.write('Disconnected.\r\n');
}
