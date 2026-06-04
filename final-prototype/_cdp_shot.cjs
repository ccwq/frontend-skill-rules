// CDP screenshot helper. Drives the prototype via navigateTo().
const http = require('http');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

function get(p){ return new Promise((res, rej) => {
    http.get('http://127.0.0.1:9226' + p, r => {
        let d = ''; r.on('data', c => d += c); r.on('end', () => res(JSON.parse(d)));
    }).on('error', rej);
}); }

let _id = 1000;
function nextId(){ return ++_id; }

async function send(ws, method, params){
    const id = nextId();
    return new Promise((resolve, reject) => {
        const handler = (data) => {
            const m = JSON.parse(data);
            if (m.id === id) {
                ws.off('message', handler);
                if (m.error) reject(new Error(method + ': ' + m.error.message));
                else resolve(m.result);
            }
        };
        ws.on('message', handler);
        ws.send(JSON.stringify({ id, method, params: params || {} }));
    });
}

async function shoot(ws, outName){
    const r = await send(ws, 'Page.captureScreenshot', { format:'png' });
    const buf = Buffer.from(r.data, 'base64');
    fs.writeFileSync(outName, buf);
    console.log('saved:', path.basename(outName), buf.length, 'bytes');
}

async function evalJs(ws, expr){
    const r = await send(ws, 'Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
    return r.result ? r.result.value : null;
}

const wait = ms => new Promise(r => setTimeout(r, ms));

(async () => {
    const tabs = await get('/json');
    let tab = tabs.find(t => t.type === 'page' && t.url && t.url.indexOf('index.html') >= 0);
    if (!tab) tab = tabs.find(t => t.type === 'page');
    if (!tab) { console.error('No page tab found.'); process.exit(2); }
    console.log('attaching to:', tab.url);
    const ws = new WebSocket(tab.webSocketDebuggerUrl, { perMessageDeflate: false });
    await new Promise((res, rej) => { ws.on('open', res); ws.on('error', rej); });

    await send(ws, 'Page.enable');
    await send(ws, 'Runtime.enable');

    const outDir = 'D:/DEVELOP/work/work_2026/pmanage/_shots_0903';
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    // ========== 1. Dashboard ==========
    await evalJs(ws, `navigateTo('home/dashboard')`);
    await wait(2400);
    // Force more cards to load by scrolling pages
    await evalJs(ws, `window.scrollTo(0, document.body.scrollHeight)`);
    await wait(800);
    await evalJs(ws, `window.scrollTo(0, 0)`);
    await wait(400);
    await shoot(ws, path.join(outDir, '01_dashboard.png'));

    // ========== 2. Calendar split-view ==========
    // open calendar via the proper button or window.openCalendarBoard()
    const calOpened = await evalJs(ws, `(function(){
        if (typeof openCalendarBoard === 'function') { openCalendarBoard(); return 'fn'; }
        const btn = document.querySelector('#wfBtnOpenCalendar');
        if (btn) { btn.click(); return 'btn'; }
        return false;
    })()`);
    console.log('calOpened:', calOpened);
    await wait(900);
    // Click a day cell with events
    const dayClicked = await evalJs(ws, `(function(){
        const cells = Array.from(document.querySelectorAll('.cal-cell'));
        if (!cells.length) return 0;
        const withEvts = cells.find(c => c.querySelector('.cal-evt, .cal-evt-dot, [class*=\"evt-\"]')) || cells[14];
        if (withEvts) withEvts.click();
        return cells.length;
    })()`);
    console.log('cells:', dayClicked);
    await wait(700);
    await shoot(ws, path.join(outDir, '02_calendar_split.png'));
    await evalJs(ws, `(function(){if (typeof closeModal === 'function') closeModal();})()`);
    await wait(400);

    // ========== 3. Bidding Home (time picker) ==========
    await evalJs(ws, `navigateTo('bidding/home')`);
    await wait(1500);
    await shoot(ws, path.join(outDir, '03_bidding_home.png'));

    // ========== 4. Bidding Info (Table 1 columns + date filter) ==========
    await evalJs(ws, `navigateTo('bidding/info')`);
    await wait(1500);
    await shoot(ws, path.join(outDir, '04_bidding_info.png'));

    // ========== 5. Bidding Info — open new modal ==========
    await evalJs(ws, `(function(){
        const btns = Array.from(document.querySelectorAll('button'));
        const b = btns.find(b => /新增/.test(b.textContent) && b.className.includes('primary'));
        if (b) { b.click(); return true; } return false;
    })()`);
    await wait(800);
    await shoot(ws, path.join(outDir, '05_bidding_new_modal.png'));
    await evalJs(ws, `(function(){if (typeof closeModal === 'function') closeModal();})()`);
    await wait(400);

    // ========== 6. Bidding History (new menu) ==========
    await evalJs(ws, `navigateTo('bidding/history')`);
    await wait(1500);
    await shoot(ws, path.join(outDir, '06_bidding_history.png'));

    // ========== 7. Bidding Cash (won) — Table 1 cols ==========
    await evalJs(ws, `navigateTo('bidding/cash')`);
    await wait(1500);
    await shoot(ws, path.join(outDir, '07_bidding_cash.png'));

    // ========== 8. Bidding Perf — image 2 layout ==========
    await evalJs(ws, `navigateTo('bidding/perf')`);
    await wait(1500);
    await shoot(ws, path.join(outDir, '08_bidding_perf.png'));

    // ========== 9. Expand a perf row ==========
    await evalJs(ws, `(function(){const e = document.querySelector('.pf-expand'); if (e) e.click();})()`);
    await wait(700);
    await shoot(ws, path.join(outDir, '09_bidding_perf_expanded.png'));

    ws.close();
    console.log('done');
    process.exit(0);
})().catch(err => { console.error('FAIL:', err.message, err.stack); process.exit(1); });
