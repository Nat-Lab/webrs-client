import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';
import './css/style.css';
var ws = new WebSocket('ws://127.0.0.1:8080');
var term = new Terminal();
var fitAddon = new FitAddon();
term.loadAddon(fitAddon);
var pendingDels = 0;
function attach() {
    term.open(document.getElementById('terminal'));
    ws.onmessage = function (message) {
        var data = new Uint8Array(message.data);
        if (data.length < 1)
            return;
        var spaces = data[data.length - 1] == 0x20 ? 1 : 0;
        var bells = data.filter(function (d) { return d == 0x07; }).length;
        spaces = data.every(function (d) { return d == 0x20; }) ? data.length : spaces;
        bells = data.every(function (d) { return d == 0x07; }) ? data.length : bells;
        var space_omit = 0;
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
        var i = 0;
        term.write(data.filter(function (v) { return v >= 0x20 || v == 0x0d || v == 0x0a; }).filter(function (v) { if (v == 0x20)
            i++; return v != 0x20 || i > space_omit; }));
    };
    term.onData(function (data) {
        if (data.length < 0)
            return;
        if (data == '\x7f')
            pendingDels++;
        console.log(data.charCodeAt(0));
        if (data[0] < '\x20' && (data[0] != '\x0d'))
            return;
        ws.send(data);
    });
    fitAddon.fit();
}
window.onresize = function () { return fitAddon.fit(); };
ws.binaryType = 'arraybuffer';
ws.onopen = function () { return attach(); };
//# sourceMappingURL=app.js.map