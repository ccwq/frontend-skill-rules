// ============================================================
// 应用主控：初始化 / 路由 / 状态 / 交互（通知 / AI / 弹窗 / 拖拽）
// ============================================================

const State = {
    role: 'R2',
    page: 'home/board',
    tags: [{ key:'home/board', title:'综合数据看板', titleEn:'Dashboard' }],
    theme: 'light',
    sideCollapsed: false,
    dnd: false,
    lang: 'cn'
};

// =================== i18n helpers ===================
window.t = function(key, vars){
    const dict = (window.I18N && I18N[State.lang]) || {};
    let s = dict[key] != null ? dict[key] : key;
    if (vars) Object.keys(vars).forEach(k => { s = s.replace('{'+k+'}', vars[k]); });
    return s;
};
window.tt = function(zh){
    if (State.lang === 'cn') return zh;
    const map = (window.I18N_TERMS && I18N_TERMS.en) || {};
    return map[zh] != null ? map[zh] : zh;
};
window.menuTitle = function(item){
    return State.lang === 'en' && item.titleEn ? item.titleEn : item.title;
};
window.roleName = function(r){
    return State.lang === 'en' && r.nameEn ? r.nameEn : r.name;
};
window.roleTag = function(r){
    return State.lang === 'en' && r.tagEn ? r.tagEn : r.tag;
};
window.roleScope = function(r){
    return State.lang === 'en' && r.scopeEn ? r.scopeEn : r.scope;
};
function applyStaticI18n(){
    document.querySelectorAll('[data-i18n]').forEach(el => {
        el.textContent = t(el.dataset.i18n);
    });
    document.querySelectorAll('[data-i18n-ph]').forEach(el => {
        el.placeholder = t(el.dataset.i18nPh);
    });
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
        el.title = t(el.dataset.i18nTitle);
    });
}

// =================== 角色权限：可见菜单 ===================
function visibleMenu(){
    const allowed = (window.PERMISSIONS && PERMISSIONS[State.role]) || MENU.map(m=>m.key);
    return MENU.filter(m => allowed.includes(m.key));
}
function canAccess(menuKey){
    const allowed = (window.PERMISSIONS && PERMISSIONS[State.role]) || MENU.map(m=>m.key);
    return allowed.includes(menuKey);
}

// =================== 初始化 ===================
document.addEventListener('DOMContentLoaded', () => {
    renderSide1();
    renderSide2(getMenuByPage(State.page).key);
    renderTags();
    navigateTo(State.page, false);

    bindRoleMenu();
    bindNotifyMenu();
    bindAiPanel();
    bindModalDrag();
    bindWinControls();
    bindSearch();
    bindThemeToggle();
    bindLangToggle();
    bindCollapse();
    bindStatusbarActions();
    bindModalClose();
    bindZoom();
    applyStaticI18n();
    updateThemeIcon();
    setupWatermark();
});

// =================== 需求2701-一：全局水印 ===================
function setupWatermark(){
    let wm = document.getElementById('globalWatermark');
    if (!wm) {
        wm = document.createElement('div');
        wm.id = 'globalWatermark';
        document.body.appendChild(wm);
    }
    refreshWatermark();
    if (!window._wmTimer) {
        window._wmTimer = setInterval(refreshWatermark, 30 * 1000);
    }
}
function refreshWatermark(){
    const wm = document.getElementById('globalWatermark');
    if (!wm) return;
    const role = (window.ROLES || []).find(r => r.id === State.role);
    const name = (role && role.name) ? role.name : 'admin';
    const now = new Date();
    const pad = n => String(n).padStart(2,'0');
    const ts = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
    const text = `${name}  ${ts}`;
    const w = 300, h = 170;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><g transform="rotate(-45 ${w/2} ${h/2})"><text x="${w/2}" y="${h/2}" fill="rgba(110,120,140,0.18)" font-size="14" font-family="-apple-system,BlinkMacSystemFont,system-ui,sans-serif" text-anchor="middle" dominant-baseline="middle">${text}</text></g></svg>`;
    wm.style.backgroundImage = `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
}
window.refreshWatermark = refreshWatermark;

// =================== 页面缩放（需求1901-二） ===================
function bindZoom(){
    const btn = $('#btnZoom');
    const panel = $('#zoomSlider');
    const range = $('#zoomRange');
    const valEl = $('#zoomValue');
    if (!btn || !panel || !range) return;
    btn.onclick = (e) => {
        e.stopPropagation();
        panel.classList.toggle('open');
    };
    range.oninput = () => {
        const v = +range.value;
        valEl.textContent = v + '%';
        // 仅缩放主体区域(layout) + 标题栏(topbar)，不缩放 zoomSlider 自身
        document.querySelectorAll('.topbar, .layout, .statusbar, .ai-fab, .ai-panel, .modal-window').forEach(el => {
            el.style.zoom = (v / 100);
        });
    };
    // 点击空白关闭面板（不包括按钮 / 面板本身）
    document.addEventListener('click', (e) => {
        if (!panel.contains(e.target) && !btn.contains(e.target)) {
            panel.classList.remove('open');
        }
    });
}

// =================== 顶部菜单（一级） ===================
function renderSide1(){
    const side1 = $('#side1');
    const menus = visibleMenu();
    const curMenuKey = getMenuByPage(State.page).key;
    side1.innerHTML = menus.map(m => `
        <div class="s1-item ${curMenuKey===m.key?'active':''}" data-key="${m.key}">
            <span class="material-symbols-rounded">${m.icon}</span>
            <span class="s1-label">${menuTitle(m)}</span>
        </div>
    `).join('') + `
        <div class="s1-divider"></div>
        <div class="s1-item msg-primary" data-key="msg">
            <span class="material-symbols-rounded">chat</span>
            <span class="s1-label">${t('side.msg')}</span>
            <span class="s1-badge">5</span>
        </div>
    `;
    $$('#side1 .s1-item').forEach(el => el.onclick = () => {
        const k = el.dataset.key;
        if (k === 'msg') { openMessageCenter(); return; }
        const menu = MENU.find(m=>m.key===k);
        if (!menu) return;
        renderSide2(k);
        navigateTo(menu.defaultChild);
    });
}

function openMessageCenter(){
    State.page = 'msg/center';
    if (!State.tags.find(x=>x.key==='msg/center')) State.tags.push({ key:'msg/center', title:'消息中心', titleEn:'Messages' });
    renderTags();
    $$('#side1 .s1-item').forEach(el => el.classList.toggle('active', el.dataset.key==='msg'));
    $('#side2').innerHTML = '';
    $('#crumb').innerHTML = `<span>${t('crumb.home')}</span><span class="material-symbols-rounded sep">chevron_right</span><span class="cur">${t('side.msg')}</span>`;
    renderMessageCenter();
}

// =================== 二级菜单 ===================
function renderSide2(menuKey){
    const menu = MENU.find(m=>m.key===menuKey);
    if (!menu || !canAccess(menuKey)) { $('#side2').innerHTML = ''; return; }
    const side2 = $('#side2');
    // 需求2001-六：支持三级菜单（带 children 的节点渲染为可展开组）
    const renderChild = (c) => {
        const hasKids = c.children && c.children.length;
        if (!hasKids) {
            return `
            <div class="s2-item ${State.page===c.key?'active':''}" data-key="${c.key}">
                <span class="dot"></span>
                <span class="material-symbols-rounded" style="font-size:16px">${c.icon}</span>
                <span>${menuTitle(c)}</span>
            </div>`;
        }
        const childActive = c.children.some(g => State.page === g.key);
        const groupActive = State.page === c.key || childActive;
        return `
            <div class="s2-group ${groupActive?'expanded':''}" data-group="${c.key}">
                <div class="s2-item s2-item-group ${State.page===c.key?'active':''}" data-key="${c.key}">
                    <span class="dot"></span>
                    <span class="material-symbols-rounded" style="font-size:16px">${c.icon}</span>
                    <span style="flex:1">${menuTitle(c)}</span>
                    <span class="material-symbols-rounded s2-chev" style="font-size:18px">expand_more</span>
                </div>
                <div class="s2-subitems">
                    ${c.children.map(g => `
                        <div class="s2-item s2-item-sub ${State.page===g.key?'active':''}" data-key="${g.key}">
                            <span class="dot"></span>
                            <span class="material-symbols-rounded" style="font-size:14px">${g.icon}</span>
                            <span>${menuTitle(g)}</span>
                        </div>
                    `).join('')}
                </div>
            </div>`;
    };
    side2.innerHTML = `
        <div class="s2-title">
            <div class="ico"><span class="material-symbols-rounded">${menu.icon}</span></div>
            <div class="t">${menuTitle(menu)}</div>
        </div>
        ${menu.children.map(renderChild).join('')}`;
    $$('#side2 .s2-item').forEach(el => el.onclick = (e) => {
        e.stopPropagation();
        if (el.classList.contains('s2-item-group')) {
            const grp = el.closest('.s2-group');
            if (grp) grp.classList.toggle('expanded');
            // 一级父项无 view 时仅展开/收起；有 view 时同时导航
        }
        if (el.dataset.key) navigateTo(el.dataset.key);
    });
}

// =================== 标签栏 ===================
function renderTags(){
    const tags = $('#tags');
    tags.innerHTML = State.tags.map(tag => {
        const title = State.lang === 'en' && tag.titleEn ? tag.titleEn : tag.title;
        return `
        <div class="tag ${State.page===tag.key?'active':''}" data-key="${tag.key}">
            <span class="dot"></span>
            <span>${title}</span>
            ${State.tags.length>1?`<span class="material-symbols-rounded x" data-close="${tag.key}" style="font-size:14px">close</span>`:''}
        </div>`;
    }).join('') + `
        <div style="flex:1"></div>
        <button class="icon-btn" title="${t('tag.refresh')}" id="tagRefresh" style="width:28px;height:28px"><span class="material-symbols-rounded" style="font-size:16px">refresh</span></button>
        <button class="icon-btn" title="${t('tag.closeOther')}" id="tagCloseOther" style="width:28px;height:28px"><span class="material-symbols-rounded" style="font-size:16px">filter_none</span></button>`;
    $$('#tags .tag').forEach(el => {
        el.onclick = (e) => {
            if (e.target.dataset.close) {
                e.stopPropagation();
                const k = e.target.dataset.close;
                State.tags = State.tags.filter(t=>t.key!==k);
                if (State.page === k && State.tags.length) {
                    navigateTo(State.tags[State.tags.length-1].key, false);
                } else {
                    renderTags();
                }
                return;
            }
            if (el.dataset.key === 'msg/center') { openMessageCenter(); return; }
            navigateTo(el.dataset.key, false);
        };
    });
    const refresh = $('#tagRefresh');
    if (refresh) refresh.onclick = () => {
        if (State.page === 'msg/center') openMessageCenter();
        else navigateTo(State.page, false);
    };
    const closeOther = $('#tagCloseOther');
    if (closeOther) closeOther.onclick = () => {
        State.tags = State.tags.filter(t=>t.key===State.page);
        renderTags();
    };
}

// =================== 导航 ===================
function navigateTo(pageKey, pushTag=true){
    const found = findChild(pageKey);
    if (!found) return;
    if (!canAccess(found.menu.key)) {
        $('#pages').innerHTML = `<div style="padding:80px;text-align:center;color:var(--text-3)">
            <span class="material-symbols-rounded" style="font-size:64px;opacity:0.4">block</span>
            <div style="margin-top:14px;font-size:16px;font-weight:600;color:var(--text-2)">${t('role.permDenied')}</div>
            <div style="margin-top:6px;font-size:13px">${t('permission.tip')}</div>
        </div>`;
        return;
    }
    State.page = pageKey;

    if (pushTag) {
        const exists = State.tags.find(x=>x.key===pageKey);
        if (!exists) State.tags.push({ key: pageKey, title: found.child.title, titleEn: found.child.titleEn });
    }

    renderTags();
    $$('#side1 .s1-item').forEach(el => el.classList.toggle('active', el.dataset.key===found.menu.key));
    if (found.menu.key !== getMenuByPage(State.page).key || $('#side2').innerHTML === '' || !$('#side2').querySelector('.s2-item')) {
        renderSide2(found.menu.key);
    }
    $$('#side2 .s2-item').forEach(el => el.classList.toggle('active', el.dataset.key===pageKey));
    const crumbMid = found.parent ? `<span>${menuTitle(found.parent)}</span><span class="material-symbols-rounded sep">chevron_right</span>` : '';
    $('#crumb').innerHTML = `
        <span>${menuTitle(found.menu)}</span>
        <span class="material-symbols-rounded sep">chevron_right</span>
        ${crumbMid}
        <span class="cur">${menuTitle(found.child)}</span>`;

    renderView(found.child.view);
    const pages = $('#pages');
    if (pages) pages.scrollTop = 0;
}

function findChild(pageKey){
    for (const m of MENU) {
        for (const c of m.children) {
            if (c.key === pageKey) return { menu: m, child: c };
            // 需求060101-五 / 2001-六：支持三级菜单
            if (c.children && c.children.length) {
                for (const g of c.children) {
                    if (g.key === pageKey) return { menu: m, child: g, parent: c };
                }
            }
        }
    }
    return null;
}

function getMenuByPage(pageKey){
    const f = findChild(pageKey);
    return f ? f.menu : MENU[0];
}

// =================== 视图分发 ===================
function renderView(view){
    if (typeof window['renderView_'+view] === 'function') {
        window['renderView_'+view]();
        return;
    }
    const map = {
        home_board: renderHomeBoard,
        home_todo:  renderHomeTodo,
        bidding_info:    renderBiddingInfo,
        bidding_history: renderBiddingHistory,
        bidding_cash:    renderBiddingCash,
        bidding_perf:    renderBiddingPerf,
        contract_customer: renderContractCustomer,
        contract_outsource: renderContractOutsource,
        project_list: renderProjectList,
        project_done: renderProjectDone,
        expense_trip: renderExpenseTrip,
        expense_baoxiao: renderExpenseBaoxiao,
        outsource_library: renderOutsourceLibrary,
        outsource_progress: renderOutsourceProgress,
        outsource_expert: renderOutsourceExpert,
        docs_credit: renderDocsCredit,
        docs_ip: renderDocsIp,
        // 需求060101-五：4个三级菜单（复用 renderDocsIp，通过 tab 参数切换）
        docs_ip_product:   () => renderDocsIp('product'),
        docs_ip_copyright: () => renderDocsIp('copyright'),
        docs_ip_patent:    () => renderDocsIp('patent'),
        docs_ip_evaluate:  () => renderDocsIp('evaluate'),
        docs_staff: renderDocsStaff,
        docs_staff_id:    () => renderDocsStaff({ filter:'身份证' }),
        docs_staff_title: () => renderDocsStaff({ filter:'职称证' }),
        docs_honor: renderDocsHonor,
        docs_branch: renderDocsBranch,
        docs_share: renderDocsShare,
        workload_project: renderWorkloadProject,
        workload_process: renderWorkloadProcess,
        workload_assign: renderWorkloadAssign,
        workload_dailyfill: renderWorkloadDailyFill,
        workload_daily: renderWorkloadDaily,
        workload_approval: renderWorkloadApproval,
        workload_accounting: renderWorkloadAccounting,
        docs_company: renderDocsCompany,
        device_software: renderDeviceSoftware,
        device_hardware: renderDeviceHardware,
        ai_assistant: renderAiAssistant,
        sys_user: renderSysUser,
        sys_dept: renderSysDept,
        sys_role: renderSysRole,
        sys_dict: renderSysDict,
        sys_menu: renderSysMenu,
        sys_log:  renderSysLog
    };
    const fn = map[view];
    if (fn) fn();
    else {
        $('#pages').innerHTML = `<div style="padding:60px;text-align:center;color:var(--text-3)"><span class="material-symbols-rounded" style="font-size:48px;opacity:0.4">construction</span><div style="margin-top:12px">视图 <code>${view}</code> 待实现</div></div>`;
    }
}

// =================== 角色菜单 ===================
function bindRoleMenu(){
    const pill = $('#rolePill');
    const menu = $('#roleMenu');
    pill.onclick = (e) => {
        e.stopPropagation();
        $('#notifyMenu').classList.remove('open');
        renderRoleMenu();
        menu.classList.toggle('open');
    };
    document.addEventListener('click', (e) => {
        if (!menu.contains(e.target) && !pill.contains(e.target)) menu.classList.remove('open');
    });
}
function renderRoleMenu(){
    const menu = $('#roleMenu');
    menu.innerHTML = `
        <div style="padding:10px 12px;font-size:11px;color:var(--text-3);font-weight:700;letter-spacing:0.5px;text-transform:uppercase">${t('top.role.tip')}</div>
        ${ROLES.map(r => `
            <div class="item ${r.id===State.role?'active':''}" data-r="${r.id}">
                <div class="swatch" style="background:linear-gradient(135deg,${r.color},${r.color}88)"></div>
                <div class="info">
                    <div class="n">${roleName(r)}</div>
                    <div class="s">${r.id} · ${roleTag(r)} · ${t('top.role.scope')}: ${roleScope(r)}</div>
                </div>
                <span class="badge">${r.id}</span>
            </div>
        `).join('')}`;
    $$('#roleMenu .item').forEach(el => el.onclick = () => {
        State.role = el.dataset.r;
        applyRoleSwitch();
        $('#roleMenu').classList.remove('open');
    });
}

// 切换角色后：刷新 pill 显示 + 检查当前菜单是否还可访问 + 重新渲染侧栏 + 重新渲染当前视图
function applyRoleSwitch(){
    const role = ROLES.find(r=>r.id===State.role);
    $('#roleName').textContent = roleName(role);
    $('#roleTag').textContent = `${role.id} · ${roleTag(role)}`;
    $('#roleSwatch').style.background = `linear-gradient(135deg, ${role.color}, ${role.color}88)`;
    $('#sbUser').textContent = `${roleName(role)} · ${role.id}`;
    if (typeof refreshWatermark === 'function') refreshWatermark();

    // 当前页所属一级菜单是否可访问；不可访问则跳到该角色的第一个可见菜单
    const curMenuKey = getMenuByPage(State.page).key;
    if (!canAccess(curMenuKey)) {
        const firstMenu = visibleMenu()[0];
        if (firstMenu) {
            // 清理 tags 中无权限项
            State.tags = State.tags.filter(tag => {
                if (tag.key === 'msg/center') return true;
                const f = findChild(tag.key);
                return f && canAccess(f.menu.key);
            });
            renderSide1();
            navigateTo(firstMenu.defaultChild, true);
        }
    } else {
        // 当前页可访问 - 刷新侧栏并重渲染
        renderSide1();
        renderSide2(curMenuKey);
        if (State.page === 'msg/center') openMessageCenter();
        else navigateTo(State.page, false);
    }
}

// =================== 通知菜单 ===================
function bindNotifyMenu(){
    const btn = $('#btnNotify');
    const menu = $('#notifyMenu');
    btn.onclick = (e) => {
        e.stopPropagation();
        $('#roleMenu').classList.remove('open');
        renderNotifyMenu();
        menu.classList.toggle('open');
    };
    document.addEventListener('click', (e) => {
        if (!menu.contains(e.target) && !btn.contains(e.target)) menu.classList.remove('open');
    });
}
function renderNotifyMenu(){
    const menu = $('#notifyMenu');
    const unread = NOTIFICATIONS.filter(n=>n.unread).length;
    menu.innerHTML = `
        <div class="nm-head">
            <div class="t">通知中心<span class="sub">${unread} 未读</span></div>
            <div class="actions">
                <span class="a-btn">全部已读</span>
                <span class="a-btn" id="btnNmAll">查看全部</span>
            </div>
        </div>
        <div class="nm-list">
            ${NOTIFICATIONS.map(n => `
                <div class="nm-item ${n.unread?'unread':''}">
                    <div class="icn ${n.type}"><span class="material-symbols-rounded">${n.icon}</span></div>
                    <div style="flex:1;min-width:0">
                        <div style="font-weight:600;font-size:13px;color:var(--text-1)">${n.ti}</div>
                        <div style="font-size:12px;color:var(--text-2);margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${n.desc}</div>
                        <div style="font-size:10.5px;color:var(--text-3);margin-top:3px">${n.tm}</div>
                    </div>
                </div>
            `).join('')}
        </div>
        <div style="padding:10px 14px;border-top:1px solid var(--glass-border);display:flex;justify-content:flex-end;gap:6px">
            <button class="btn primary" style="padding:6px 14px;font-size:12px" id="btnOpenMsgCenter"><span class="material-symbols-rounded" style="font-size:14px">launch</span>打开消息中心</button>
        </div>
    `;
    const open = $('#btnOpenMsgCenter');
    if (open) open.onclick = () => { menu.classList.remove('open'); openMessageCenter(); };
}

// =================== AI 面板 ===================
function bindAiPanel(){
    const fab = $('#aiFab');
    const panel = $('#aiPanel');
    const body = $('#aiBody');
    const sugs = $('#aiSuggestions');
    const input = $('#aiInput');
    const send = $('#aiSend');

    const initialMessages = [
        { who:'ai', body:'你好，我是天润 AI 助手 ✨ 已接入项目数据，可以帮你查询项目 / 合同 / 工天 / 报销等信息。' }
    ];
    const suggestions = [
        '本月有哪些项目可能延期?',
        '帮我汇总本周日报',
        '哪些合同即将到期?',
        '统计本季度费用支出',
        '招投标中标率怎么样?'
    ];
    let messages = initialMessages.slice();

    function renderAiMessages(){
        body.innerHTML = messages.map(m => `
            <div class="ai-msg ${m.who}">
                <div class="ava-sm ${m.who}">${m.who==='ai'?'<span class="material-symbols-rounded">auto_awesome</span>':'我'}</div>
                <div class="bubble">${m.body}</div>
            </div>
        `).join('');
        body.scrollTop = body.scrollHeight;
    }
    function renderAiSugs(){
        sugs.innerHTML = suggestions.map(s => `<div class="sug">${s}</div>`).join('');
        $$('#aiSuggestions .sug').forEach(el => el.onclick = () => { input.value = el.textContent; sendMsg(); });
    }
    function sendMsg(){
        const v = input.value.trim();
        if (!v) return;
        messages.push({ who:'me', body: v });
        input.value = '';
        renderAiMessages();
        setTimeout(() => {
            messages.push({ who:'ai', body: aiReply(v) });
            renderAiMessages();
        }, 600);
    }
    function aiReply(q){
        if (/延期|风险|超期/.test(q)) return '本月有 3 个项目处于延期风险：①轨交调度 (滞后 4d)；②智慧水务二期 (滞后 2d)；③政务云一期 (滞后 1d)。建议查看 项目管理 → 项目列表。';
        if (/日报|周报/.test(q))    return '本周共收到 42 份日报，已确认 36 份，待确认 4 份，已退回 2 份。我已为你生成汇总文档，可在 工天管理 → 日报管理 中查看。';
        if (/合同|到期/.test(q))    return '近 30 天内将有 5 份合同到期：HT-039 续签待签批；HT-041 履约结束；HT-058 ~ HT-061 自动顺延。';
        if (/费用|报销|支出/.test(q)) return '本季度费用支出 ¥182.4 万，其中差旅 ¥48.2 万、招待 ¥18.6 万、办公 ¥7.5 万、研发 ¥98.1 万、其他 ¥10.0 万。';
        if (/招投标|中标/.test(q))  return '本月投标 12 项，中标 5 项，中标率 41.6%，金额合计 ¥3,820 万。同比 +18%，环比 +6%。';
        return '已收到你的问题，正在调取数据，请稍候…';
    }

    fab.onclick = () => { panel.classList.toggle('open'); if (panel.classList.contains('open')) { renderAiMessages(); renderAiSugs(); input.focus(); } };
    $('#aiClose').onclick  = () => panel.classList.remove('open');
    $('#aiMinify').onclick = () => panel.classList.remove('open');
    $('#aiClear').onclick  = () => { messages = initialMessages.slice(); renderAiMessages(); };
    send.onclick = sendMsg;
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg(); }
    });
}

// =================== 弹窗拖拽 ===================
function bindModalDrag(){
    const win = $('#modalWindow');
    const head = $('#modalHead');
    let dragging = false, sx=0, sy=0, ox=0, oy=0;
    head.onmousedown = (e) => {
        if (e.target.closest('.modal-btn')) return;
        dragging = true;
        sx = e.clientX; sy = e.clientY;
        const r = win.getBoundingClientRect();
        ox = r.left; oy = r.top;
        win.style.transform = 'none';
        win.style.left = ox + 'px';
        win.style.top  = oy + 'px';
        document.body.style.userSelect = 'none';
    };
    document.addEventListener('mousemove', (e) => {
        if (!dragging) return;
        win.style.left = (ox + (e.clientX - sx)) + 'px';
        win.style.top  = (oy + (e.clientY - sy)) + 'px';
    });
    document.addEventListener('mouseup', () => {
        dragging = false;
        document.body.style.userSelect = '';
    });
}

function bindModalClose(){
    $('#modalClose').onclick   = () => closeModal();
    $('#modalOverlay').onclick = (e) => { e.stopPropagation(); };
}

// =================== 窗口控件 ===================
function bindWinControls(){
    $$('.wc-btn').forEach((btn, i) => {
        btn.onclick = () => {
            if (i === 2) console.log('[窗口] 模拟关闭');
            else if (i === 1) console.log('[窗口] 模拟最大化');
            else console.log('[窗口] 模拟最小化');
        };
    });
}

// =================== 主题 / 折叠 / 搜索 / 状态栏 ===================
const THEME_CYCLE = ['light','dark','eye'];
const THEME_ICON = { light:'light_mode', dark:'dark_mode', eye:'visibility' };
function bindThemeToggle(){
    $('#btnTheme').onclick = () => {
        const idx = THEME_CYCLE.indexOf(State.theme);
        State.theme = THEME_CYCLE[(idx + 1) % THEME_CYCLE.length];
        if (State.theme === 'light') document.documentElement.removeAttribute('data-theme');
        else document.documentElement.setAttribute('data-theme', State.theme);
        updateThemeIcon();
    };
}
function updateThemeIcon(){
    const icon = $('#themeIcon');
    if (icon) icon.textContent = THEME_ICON[State.theme] || 'light_mode';
    const btn = $('#btnTheme');
    if (!btn) return;
    const idx = THEME_CYCLE.indexOf(State.theme);
    const next = THEME_CYCLE[(idx + 1) % THEME_CYCLE.length];
    btn.title = `${t('theme.next')} ${t('theme.' + next)} · ${t('theme.light')} → ${t('theme.dark')} → ${t('theme.eye')}`;
}

function bindLangToggle(){
    const btn = $('#btnLang');
    if (!btn) return;
    btn.onclick = () => {
        State.lang = State.lang === 'cn' ? 'en' : 'cn';
        const txt = $('#langText');
        if (txt) txt.textContent = State.lang === 'cn' ? 'EN' : '中';
        applyStaticI18n();
        // 刷新 pill 显示
        const role = ROLES.find(r=>r.id===State.role);
        if (role) {
            $('#roleName').textContent = roleName(role);
            $('#roleTag').textContent = `${role.id} · ${roleTag(role)}`;
            $('#sbUser').textContent = `${roleName(role)} · ${role.id}`;
        }
        renderSide1();
        renderSide2(getMenuByPage(State.page).key);
        if (State.page === 'msg/center') openMessageCenter();
        else navigateTo(State.page, false);
        updateThemeIcon();
    };
}

function bindCollapse(){
    $('#btnCollapse').onclick = () => {
        State.sideCollapsed = !State.sideCollapsed;
        document.body.classList.toggle('side-collapsed', State.sideCollapsed);
        $('#btnCollapse').classList.toggle('collapsed', State.sideCollapsed);
        const icon = $('#btnCollapse').querySelector('.material-symbols-rounded');
        if (icon) icon.textContent = State.sideCollapsed ? 'menu_open' : 'menu';
    };
}

function bindSearch(){ /* 顶栏搜索已移除 */ }

function bindStatusbarActions(){
    $('#sbNotify').onclick = () => $('#btnNotify').click();
    $('#sbDnd').onclick = () => {
        State.dnd = !State.dnd;
        $('#sbDndIcon').textContent = State.dnd ? 'notifications_off' : 'notifications_active';
        $('#sbDndText').textContent = State.dnd ? '勿扰开启' : '通知开启';
    };
}
