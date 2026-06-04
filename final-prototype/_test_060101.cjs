// 060101 needs test - automated screenshots for all modified modules
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

    // Force reload index.html (cache might be stale)
    await send(ws, 'Page.navigate', { url: 'http://127.0.0.1:8765/index.html?_cb=' + Date.now() });
    await wait(3000);

    const outDir = 'D:/DEVELOP/work/work_2026/pmanage/_shots_060101';
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    // ========== 1. 投标报名信息（删除"报名方式"字段） ==========
    await evalJs(ws, `navigateTo('bidding/info')`);
    await wait(1500);
    await shoot(ws, path.join(outDir, '1_bidding_info.png'));

    // ========== 2. 招投标看板（侧边栏） ==========
    await evalJs(ws, `(function(){ if (typeof openBiddingCalendar === 'function') openBiddingCalendar(); })()`);
    await wait(1500);
    await shoot(ws, path.join(outDir, '2_bidding_calendar.png'));

    // 点击侧边栏关闭按钮：点击当前选中日期再次收起
    await evalJs(ws, `(function(){
        const sel = document.querySelector('.bi-cal-cell.selected') || document.querySelector('.bi-cal-cell.today');
        if (sel) sel.click();
    })()`);
    await wait(800);
    await shoot(ws, path.join(outDir, '2b_bidding_calendar_collapsed.png'));

    // 关闭弹窗
    await evalJs(ws, `(function(){if (typeof closeModal === 'function') closeModal();})()`);
    await wait(400);

    // ========== 3. 客户合同（两步式新增流程） ==========
    await evalJs(ws, `navigateTo('contract/customer')`);
    await wait(1500);
    await shoot(ws, path.join(outDir, '3_contract_customer_list.png'));

    // 点击新增按钮 → 第一步问询
    await evalJs(ws, `(function(){ if (typeof openCustomerContractAddChooser === 'function') openCustomerContractAddChooser(); })()`);
    await wait(800);
    await shoot(ws, path.join(outDir, '3a_contract_add_chooser.png'));

    // 点击「目录」按钮 → 第二步输入
    await evalJs(ws, `(function(){
        const dir = document.getElementById('ccAddDir');
        if (dir) dir.click();
    })()`);
    await wait(600);
    await shoot(ws, path.join(outDir, '3b_contract_add_directory.png'));
    await evalJs(ws, `(function(){if (typeof closeModal === 'function') closeModal();})()`);
    await wait(400);

    // 点击「合同」按钮 → 详情面板
    await evalJs(ws, `(function(){ if (typeof openCustomerContractAddChooser === 'function') openCustomerContractAddChooser(); })()`);
    await wait(600);
    await evalJs(ws, `(function(){
        const ctr = document.getElementById('ccAddCtr');
        if (ctr) ctr.click();
    })()`);
    await wait(800);
    await shoot(ws, path.join(outDir, '3c_contract_full_form.png'));
    // 验证：开启"归类合同"开关以查看完整字段
    await evalJs(ws, `(function(){
        const tg = document.getElementById('ccArchToggle');
        if (tg) { tg.checked = true; tg.dispatchEvent(new Event('change', {bubbles:true})); }
    })()`);
    await wait(400);
    await shoot(ws, path.join(outDir, '3d_contract_full_form_expanded.png'));
    await evalJs(ws, `(function(){if (typeof closeModal === 'function') closeModal();})()`);
    await wait(400);

    // ========== 4. 项目列表（外协进度整合 / 项目创建→项目列表重命名） ==========
    await evalJs(ws, `navigateTo('project/list')`);
    await wait(1500);
    await shoot(ws, path.join(outDir, '4_project_list.png'));
    // 展开一个含外协的父子行
    await evalJs(ws, `(function(){
        const toggle = document.querySelector('.exp-toggle');
        if (toggle) toggle.click();
    })()`);
    await wait(600);
    await shoot(ws, path.join(outDir, '4b_project_list_expanded.png'));

    // ========== 5. 月日历事项看板（分类整合） ==========
    await evalJs(ws, `(function(){ if (typeof openCalendarBoard === 'function') openCalendarBoard(); })()`);
    await wait(1500);
    await shoot(ws, path.join(outDir, '5_calendar.png'));
    await evalJs(ws, `(function(){if (typeof closeModal === 'function') closeModal();})()`);
    await wait(400);

    // ========== 6. 外协单位库（新增按钮 + 表单） ==========
    await evalJs(ws, `navigateTo('outsource/library')`);
    await wait(1500);
    await shoot(ws, path.join(outDir, '6_vendor_library.png'));
    // 打开新增表单
    await evalJs(ws, `(function(){
        const btn = document.getElementById('vendorBtnNew');
        if (btn) btn.click();
    })()`);
    await wait(800);
    await shoot(ws, path.join(outDir, '6a_vendor_form.png'));
    await evalJs(ws, `(function(){if (typeof closeModal === 'function') closeModal();})()`);
    await wait(400);

    // ========== 7. 知识产权管理 - 软件产品证书 ==========
    await evalJs(ws, `navigateTo('docs/ip/product')`);
    await wait(1500);
    await shoot(ws, path.join(outDir, '7a_ip_product.png'));
    // 软件著作权
    await evalJs(ws, `navigateTo('docs/ip/copyright')`);
    await wait(1500);
    await shoot(ws, path.join(outDir, '7b_ip_copyright.png'));
    // 专利证书
    await evalJs(ws, `navigateTo('docs/ip/patent')`);
    await wait(1500);
    await shoot(ws, path.join(outDir, '7c_ip_patent.png'));
    // 软件评测
    await evalJs(ws, `navigateTo('docs/ip/evaluate')`);
    await wait(1500);
    await shoot(ws, path.join(outDir, '7d_ip_evaluate.png'));

    // ========== 8. 荣誉材料管理 ==========
    await evalJs(ws, `navigateTo('docs/honor')`);
    await wait(1500);
    await shoot(ws, path.join(outDir, '8_honor.png'));

    ws.close();
    console.log('done');
    process.exit(0);
})().catch(err => { console.error('FAIL:', err.message, err.stack); process.exit(1); });
