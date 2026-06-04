// ============================================================
// 视图渲染：所有模块的页面渲染函数
// ============================================================

const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

// ============ 通用 helper ============

// 需求2001-二：统计/列表的默认时间区间 = 当年 1月1日 ~ 今日
window.defaultYearRange = function(){
    const d = new Date();
    const y = d.getFullYear();
    const mm = String(d.getMonth()+1).padStart(2,'0');
    const dd = String(d.getDate()).padStart(2,'0');
    return { from: `${y}-01-01`, to: `${y}-${mm}-${dd}` };
};

// 二级页面：标题/描述区按需求(图1红框)删除；右上 actions 暂存，由下方 toolbar 自动渲染(图3红框)
window.__pendingPageActions = '';
function pageHeader(title, desc, actions){
    window.__pendingPageActions = actions || '';
    return '';
}
// hub/看板类页面(非"二级数据模块")保留完整标题区
function pageHeaderKeep(title, desc, actions){
    return `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;padding:0 4px;flex-wrap:wrap;gap:12px">
            <div>
                <h1 style="margin:0;font-size:26px;font-weight:800;letter-spacing:-0.03em;background:linear-gradient(135deg, var(--primary-2), var(--primary));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">${title}</h1>
                <div style="font-size:14.5px;color:var(--text-2);margin-top:6px;font-weight:500">${desc || ''}</div>
            </div>
            <div style="display:flex;gap:8px;flex-wrap:wrap">${actions || ''}</div>
        </div>`;
}

function statRow(items){
    return `<div class="stat-grid">${items.map(it => `
        <div class="stat-card ${it.c||''}">
            <div class="l">${it.l}</div>
            <div class="v">${it.v}${it.unit?`<span style="font-size:16px;font-weight:600;color:var(--text-2);margin-left:3px">${it.unit}</span>`:''}</div>
            ${it.t ? `<div class="t">${it.t}</div>` : ''}
        </div>`).join('')}</div>`;
}

// 通用：无限滚动列表（支持时间倒序、分批加载）
// opts: { source: array, pageSize, render: (item)=>html, container: id, onLoaded?: (count)=>void, filter?: fn }
window.InfiniteList = {
    bind(opts){
        const root = document.getElementById(opts.container);
        if (!root) return;
        const items = (opts.filter ? opts.source.filter(opts.filter) : opts.source.slice());
        let cursor = 0;
        const total = items.length;
        const pageSize = opts.pageSize || 12;
        const isTbody = root.tagName === 'TBODY';

        // loader 必须放在合法位置：tbody 不能容纳 div，只能容纳 tr
        const loader = document.createElement('div');
        loader.className = 'inf-loader';
        loader.innerHTML = `<span class="spinner"></span>滚动加载更多…`;
        if (isTbody) {
            const wrap = root.closest('.table-wrap') || root.closest('table');
            wrap.parentNode.insertBefore(loader, wrap.nextSibling);
        } else {
            root.appendChild(loader);
        }

        function loadMore(){
            if (cursor >= total) {
                loader.classList.add('end');
                loader.innerHTML = `· 已经到底了 · 共 ${total} 条 ·`;
                return;
            }
            const next = items.slice(cursor, cursor + pageSize);
            const html = next.map(opts.render).join('');
            if (isTbody) {
                root.insertAdjacentHTML('beforeend', html);
            } else {
                const frag = document.createElement('div');
                frag.innerHTML = html;
                while (frag.firstChild) root.insertBefore(frag.firstChild, loader);
            }
            cursor += next.length;
            if (cursor >= total) {
                loader.classList.add('end');
                loader.innerHTML = `· 已经到底了 · 共 ${total} 条 ·`;
            }
            opts.onLoaded && opts.onLoaded(cursor);
        }

        loadMore();
        loadMore();

        // 需求1301-1：表格内容滚动容器优先使用 .table-wrap（横向滚动条固定在页面底端）
        const tableScroller = isTbody ? root.closest('.table-wrap') : null;
        const pageScroller = $('#pages');
        function onScrollAt(el){
            if (el.scrollTop + el.clientHeight + 240 >= el.scrollHeight) loadMore();
        }
        if (tableScroller) tableScroller.onscroll = () => onScrollAt(tableScroller);
        pageScroller.onscroll = () => onScrollAt(pageScroller);
    }
};

// 角色级数据过滤：按当前角色 scope 过滤数据
// type: 'mine' (按 owner/user 过滤) | 'all'
window.filterByRole = function(items, ownerFields){
    const role = ROLES.find(r=>r.id===State.role);
    if (!role) return items;
    if (['全局','Global'].includes(role.scope) || ['全局','Global'].includes(role.scopeEn||role.scope)) return items;
    const me = (window.ROLE_USERS && ROLE_USERS[State.role]) || '';
    const fields = ownerFields || ['owner','user'];
    if (role.scope === '个人') {
        return items.filter(it => fields.some(f => (it[f]||'').includes(me) || me.includes(it[f]||'')));
    }
    if (role.scope === '部门' || role.scope === '组') {
        // 部门 / 组：模拟取约 60% 数据
        return items.filter((_, i) => i % 5 < 3);
    }
    return items;
};

// 表格外壳：cols=[{key,label,w?,align?,render?}]
window.tableShell = function(cols, tbodyId){
    const ths = cols.map(c => {
        const styles = [];
        if (c.w) styles.push('width:'+c.w);
        if (c.align) styles.push('text-align:'+c.align);
        return `<th${styles.length?` style="${styles.join(';')}"`:''}>${c.label}</th>`;
    }).join('');
    return `<div class="table-wrap"><table class="data-table">
        <thead><tr>${ths}</tr></thead>
        <tbody id="${tbodyId}"></tbody>
    </table></div>`;
};
window.tableRow = function(cols){
    return (it, i) => `<tr>${cols.map(c => {
        const val = c.render ? c.render(it, i) : (it[c.key] != null ? it[c.key] : '');
        return `<td${c.align?` style="text-align:${c.align}"`:''}>${val}</td>`;
    }).join('')}</tr>`;
};
// 需求1301-2.3 / 3.5：父子行展开式渲染（多标段项目可展开为标段行；单标段项目作为普通行）
// cols 中可标记 expandCol: true（默认首列），lotCols 为标段行使用的列定义
// opts.minLots：触发展开的最小子行数（默认 2，项目列表外协合同传 1）
// opts.lotLabel：子行计数 label（默认 "标段"，可改 "外协合同"）
window.tableRowExpandable = function(cols, lotCols, opts){
    opts = opts || {};
    const minLots = opts.minLots || 2;
    const lotLabel = opts.lotLabel || '标段';
    const expandIdx = cols.findIndex(c => c.expandCol);
    const colIdx = expandIdx >= 0 ? expandIdx : 0;
    return (it, i) => {
        const lots = it.lots || [];
        const multi = lots.length >= minLots;
        const rid = 'exp_' + (it.id || i) + '_' + i;
        const parentCells = cols.map((c, ci) => {
            let val;
            if (ci === colIdx && multi) {
                const inner = c.render ? c.render(it, i) : (it[c.key] != null ? it[c.key] : '');
                val = `<span class="exp-toggle" data-target="${rid}"><span class="material-symbols-rounded exp-icon">chevron_right</span>${inner}<span class="exp-count">· ${lots.length}${lotLabel}</span></span>`;
            } else {
                val = c.render ? c.render(it, i) : (it[c.key] != null ? it[c.key] : '');
            }
            return `<td${c.align?` style="text-align:${c.align}"`:''}>${val}</td>`;
        }).join('');
        const parentTr = `<tr class="exp-parent${multi?' has-children':''}" data-rid="${rid}">${parentCells}</tr>`;
        if (!multi) return parentTr;
        const _lotCols = lotCols || cols;
        const subRows = lots.map((lot, li) => {
            const tds = _lotCols.map((c, ci) => {
                const val = c.lotRender ? c.lotRender(lot, li, it) : (lot[c.key] != null ? lot[c.key] : '');
                return `<td${c.align?` style="text-align:${c.align}"`:''}>${ci===colIdx?`<span class="lot-prefix">└</span> ${val}`:val}</td>`;
            }).join('');
            return `<tr class="exp-child" data-parent="${rid}" style="display:none">${tds}</tr>`;
        }).join('');
        return parentTr + subRows;
    };
};
// 行展开点击处理（事件代理 — 全局一次绑定）
document.addEventListener('click', function(e){
    const t = e.target.closest && e.target.closest('.exp-toggle');
    if (!t) return;
    const rid = t.dataset.target;
    if (!rid) return;
    const parent = document.querySelector(`tr.exp-parent[data-rid="${rid}"]`);
    if (!parent) return;
    const open = parent.classList.toggle('open');
    document.querySelectorAll(`tr.exp-child[data-parent="${rid}"]`).forEach(r => {
        r.style.display = open ? '' : 'none';
    });
});
// 通用操作列按钮
window.actBtns = function(buttons){
    return `<span class="row-acts">${buttons.map(b=>`<button class="btn-icon" title="${b.title||''}"${b.color?` style="color:${b.color}"`:''}><span class="material-symbols-rounded">${b.icon}</span></button>`).join('')}</span>`;
};

// 通用工具条：filters → 单个下拉(图2红框)；右侧自动接 pageHeader 暂存的 actions(图3红框)
function toolbar(opts){
    let html = '<div class="toolbar">';
    // 多个分类时合并为单个下拉(图2红框)；只剩"全部"则不渲染
    const realFilters = (opts.filters || []).filter(f => !(f.value==='all' || f.value==='全部' || /^all$/i.test(f.value)));
    if (realFilters.length >= 1) {
        const list = [{ value:'all', label:(State&&State.lang==='en'?'All':'全部'), active:true }, ...realFilters];
        const activeOrig = (opts.filters || []).find(f=>f.active);
        const activeVal = activeOrig ? activeOrig.value : 'all';
        const allLabel = (State&&State.lang==='en'?'All':'全部');
        const phLabel = State&&State.lang==='en'?'Filter':'筛选';
        html += `<div class="ipt filter-select"><span class="material-symbols-rounded" style="font-size:16px;color:var(--text-3)">filter_list</span>
            <select class="tb-filter" aria-label="${phLabel}">
                ${list.map(f=>{
                    const lbl = (f.value==='all' || f.value==='全部') ? allLabel : f.label;
                    const cnt = f.count!=null ? ` (${f.count})` : '';
                    return `<option value="${f.value}"${f.value===activeVal?' selected':''}>${lbl}${cnt}</option>`;
                }).join('')}
            </select></div>`;
    }
    if (opts.search !== false) {
        html += `<div class="ipt"><span class="material-symbols-rounded" style="font-size:16px;color:var(--text-3)">search</span><input placeholder="${opts.searchPh || (State&&State.lang==='en'?'Search…':'搜索…')}"/></div>`;
    }
    // 需求1901-三：数据列表 时间搜索 前移到搜索框后（紧贴搜索框，无 spacer 分隔）
    // 判断 opts.right 是否包含日期筛选 (.date-filter / type="date")，是则前移
    const rightHtml = opts.right || '';
    const isDateRight = rightHtml && (rightHtml.indexOf('date-filter') !== -1 || rightHtml.indexOf('type="date"') !== -1);
    if (isDateRight) html += rightHtml;
    html += '<div class="spacer"></div>';
    // 合并 非日期 的 opts.right + pageHeader 暂存的 actions(图3红框：右上动作下移)
    const merged = (isDateRight ? '' : rightHtml) + (window.__pendingPageActions || '');
    window.__pendingPageActions = '';
    if (merged) html += `<div class="tb-actions">${merged}</div>`;
    html += '</div>';
    return html;
}

// ============ 首页：综合数据看板 (按需求2/3 · 一次性瀑布流 + 时间选择器 + 月历入口 + 平台动态) ============
let _wfState = { cursor: 0, done: false };
// 时间范围状态：today / week / month / quarter / year / custom
window._dbState = Object.assign({ range: 'year' }, defaultYearRange());
const RANGE_PRESETS = {
    today:   { label: '今日', mult: 1/30,  prevLabel: '昨日', icon: 'today' },
    week:    { label: '本周', mult: 7/30,  prevLabel: '上周', icon: 'view_week' },
    month:   { label: '本月', mult: 1,     prevLabel: '上月', icon: 'calendar_view_month' },
    quarter: { label: '本季', mult: 3,     prevLabel: '上季', icon: 'date_range' },
    year:    { label: '本年', mult: 12,    prevLabel: '去年', icon: 'event_note' },
    custom:  { label: '自定义', mult: 1,    prevLabel: '上期', icon: 'tune' }
};
function _dbScale(){
    const r = _dbState.range;
    if (r === 'custom' && _dbState.from && _dbState.to) {
        const days = Math.max(1, Math.round((new Date(_dbState.to) - new Date(_dbState.from)) / 86400000) + 1);
        return { mult: days / 30, label: `${_dbState.from} ~ ${_dbState.to}`, prevLabel: '上期', shortLabel: `${days}天` };
    }
    const p = RANGE_PRESETS[r] || RANGE_PRESETS.month;
    return { mult: p.mult, label: p.label, prevLabel: p.prevLabel, shortLabel: p.label };
}
// 范围切换 → 重渲染瀑布流（数据动态加载）
function _dbApplyRange(r){
    _dbState.range = r;
    if (r !== 'custom') { _dbState.from = null; _dbState.to = null; }
    _dbRenderRangeBar();
    _dbRenderWaterfall();
}
function _dbApplyCustom(from, to){
    if (!from || !to) return;
    _dbState.range = 'custom';
    _dbState.from = from;
    _dbState.to = to;
    _dbRenderRangeBar();
    _dbRenderWaterfall();
}
function _dbRenderRangeBar(){
    const bar = $('#dbRange'); if (!bar) return;
    bar.innerHTML = ['today','week','month','quarter','year','custom'].map(k => {
        const p = RANGE_PRESETS[k];
        return `<button class="db-r ${_dbState.range===k?'active':''}" data-r="${k}">
            <span class="material-symbols-rounded" style="font-size:15px">${p.icon}</span>${p.label}
        </button>`;
    }).join('');
    $$('.db-r', bar).forEach(b => b.onclick = () => {
        const r = b.dataset.r;
        if (r === 'custom') {
            $('#dbRangePop').classList.toggle('open');
        } else {
            $('#dbRangePop').classList.remove('open');
            _dbApplyRange(r);
        }
    });
    // 当前范围标签
    const sc = _dbScale();
    const lbl = $('#dbRangeLabel');
    if (lbl) {
        lbl.innerHTML = `<span class="material-symbols-rounded">data_usage</span>当前范围：<strong>${sc.label}</strong>`;
    }
}
function _dbRenderWaterfall(){
    const wf = $('#wf'); if (!wf) return;
    wf.innerHTML = '';
    _wfState.cursor = 0;
    _wfState.done = false;
    const loader = $('#wfLoader');
    if (loader) {
        loader.classList.remove('end');
        loader.innerHTML = `<span class="spinner"></span>按"${_dbScale().label}"动态加载…`;
    }
    const pg = $('#pages');
    const total = DASHBOARD_CARDS.length;
    function batch(){
        if (_wfState.cursor >= total) {
            if (loader) {
                loader.classList.add('end');
                loader.innerHTML = `· 全部 ${total} 张卡片已加载完成（按"${_dbScale().label}"） ·`;
            }
            _wfState.done = true;
            if (pg) pg.onscroll = null;
            return;
        }
        appendWF(2);
        setTimeout(batch, 220);
    }
    setTimeout(batch, 60);
    if (pg) pg.onscroll = () => {
        if (_wfState.done) return;
        if (pg.scrollTop + pg.clientHeight + 200 >= pg.scrollHeight) appendWF(2);
    };
}

function renderHomeBoard(){
    const pg = $('#pages');
    pg.innerHTML = `
        <div style="display:flex;justify-content:flex-end;margin-bottom:14px;flex-wrap:wrap;gap:12px;position:relative">
            <div class="db-range" id="dbRange"></div>
            <div class="db-range-pop" id="dbRangePop">
                <span class="db-pop-lbl">起</span>
                <input type="date" id="dbStart" value="${_dbState.from || ''}"/>
                <span class="db-pop-sep">~</span>
                <span class="db-pop-lbl">止</span>
                <input type="date" id="dbEnd" value="${_dbState.to || ''}"/>
                <button class="btn primary db-pop-apply" id="dbApply"><span class="material-symbols-rounded" style="font-size:16px">check</span>应用</button>
            </div>
        </div>
        <div class="db-range-label" id="dbRangeLabel"></div>
        <div class="waterfall" id="wf"></div>
        <div class="wf-loader" id="wfLoader"><span class="spinner"></span>加载综合数据看板…</div>`;

    _dbRenderRangeBar();
    // 自定义 apply
    const apply = $('#dbApply');
    if (apply) apply.onclick = () => {
        const f = $('#dbStart').value, t = $('#dbEnd').value;
        if (!f || !t) return;
        if (new Date(f) > new Date(t)) { alert('起始日期不能晚于结束日期'); return; }
        $('#dbRangePop').classList.remove('open');
        _dbApplyCustom(f, t);
    };
    _dbRenderWaterfall();
}
function appendWF(n){
    const wf = $('#wf'); if (!wf) return;
    n = n || 2;
    const total = DASHBOARD_CARDS.length;
    const out = [];
    for (let i = 0; i < n && _wfState.cursor < total; i++, _wfState.cursor++) {
        out.push(renderWFCard(DASHBOARD_CARDS[_wfState.cursor], _wfState.cursor));
    }
    wf.insertAdjacentHTML('beforeend', out.join(''));
    $$('.wf-card .actions [data-act="close"]', wf).forEach(b => {
        if (b.dataset.bound) return; b.dataset.bound = '1';
        b.addEventListener('click', e => e.target.closest('.wf-card').remove());
    });
    const calBtn = $('#wfBtnOpenCalendar', wf);
    if (calBtn && !calBtn.dataset.bound) {
        calBtn.dataset.bound = '1';
        calBtn.addEventListener('click', openCalendarBoard);
    }
    const pfMore = $('#wfPfMore', wf);
    if (pfMore && !pfMore.dataset.bound) {
        pfMore.dataset.bound = '1';
        pfMore.addEventListener('click', e => {
            e.preventDefault();
            if (typeof window.go === 'function') window.go('system/log', 'sys_log', '日志管理');
        });
    }
    requestAnimationFrame(() => {
        $$('.wf-card', wf).forEach(card => {
            if (card.dataset.shown) return;
            card.dataset.shown = '1';
            card.classList.add('wf-show');
        });
    });
}

// ============ 看板辅助：金额 / 环形 / 迷你折线 / 饼图 ============
function _wfFmt(v){ return Number(v).toLocaleString('en-US'); }
function _wfRing(percent, color, label, sub){
    color = color || 'var(--primary)';
    const r = 32, c = 2 * Math.PI * r, dash = c * Math.min(percent, 100) / 100;
    return `<div class="wf-ring">
        <svg viewBox="0 0 80 80" width="80" height="80">
            <circle cx="40" cy="40" r="${r}" fill="none" stroke="var(--glass-bg-2)" stroke-width="8"/>
            <circle cx="40" cy="40" r="${r}" fill="none" stroke="${color}" stroke-width="8" stroke-linecap="round"
                stroke-dasharray="${dash} ${c}" transform="rotate(-90 40 40)"/>
        </svg>
        <div class="ring-c"><div class="v">${label}</div>${sub?`<div class="s">${sub}</div>`:''}</div>
    </div>`;
}
function _wfMini(values, color){
    color = color || 'var(--primary)';
    const w = 240, h = 44, n = values.length;
    const min = Math.min.apply(null, values), max = Math.max.apply(null, values);
    const range = (max - min) || 1;
    const pts = values.map((v, i) => {
        const x = (i / (n - 1)) * (w - 6) + 3;
        const y = h - 4 - ((v - min) / range) * (h - 10);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    const path = 'M ' + pts.join(' L ');
    const area = `M 3,${h-2} L ${pts.join(' L ')} L ${w-3},${h-2} Z`;
    const last = pts[pts.length - 1].split(',');
    return `<svg class="wf-mini-line" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">
        <path d="${area}" fill="${color}" fill-opacity="0.16"/>
        <path d="${path}" stroke="${color}" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="${last[0]}" cy="${last[1]}" r="3.2" fill="#fff" stroke="${color}" stroke-width="2"/>
    </svg>`;
}
function _wfPie(items){
    let acc = 0; const stops = [];
    items.forEach(it => {
        stops.push(`${it.color} ${acc}% ${acc + it.pct}%`);
        acc += it.pct;
    });
    return `conic-gradient(${stops.join(',')})`;
}
function _wfCalSummary(){
    const cal = window.MOCK_CALENDAR;
    const counts = { trip:0, visit:0, bid:0, other:0 };
    let total = 0;
    Object.values(cal.events).forEach(arr => arr.forEach(e => {
        counts[e.type] = (counts[e.type] || 0) + 1;
        total++;
    }));
    return { counts, total };
}
function _wfCalMiniGrid(){
    const cal = window.MOCK_CALENDAR;
    const first = new Date(cal.year, cal.month - 1, 1);
    const startCol = (first.getDay() + 6) % 7;
    const days = new Date(cal.year, cal.month, 0).getDate();
    const cells = [];
    for (let i = 0; i < startCol; i++) cells.push('<div class="mc empty"></div>');
    for (let d = 1; d <= days; d++) {
        const k = `${cal.year}-${String(cal.month).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        const evs = cal.events[k] || [];
        const types = Array.from(new Set(evs.map(e => e.type)));
        const dots = types.map(t => `<i class="mc-dot mc-${t}"></i>`).join('');
        cells.push(`<div class="mc${evs.length?' has':''}"><span class="d">${d}</span><div class="mc-dots">${dots}</div></div>`);
    }
    while (cells.length % 7 !== 0) cells.push('<div class="mc empty"></div>');
    return `<div class="cal-mini-week">${['一','二','三','四','五','六','日'].map(w=>`<span>${w}</span>`).join('')}</div>
        <div class="cal-mini-grid">${cells.join('')}</div>`;
}

function iconClassOf(type){
    // 渐变色 4 档：default(蓝)/s(绿)/a(粉)/w(橙)
    if (['kpi','gantt','mile','disp','bid_total','project_total','headcount_total'].includes(type)) return '';
    if (['pie','heat','rank','outs','contract_total','bid_rate','assets_total','platform_logs'].includes(type)) return 's';
    if (['bidstat','expense','cash','payback_total','productivity_total','cal_open'].includes(type)) return 'a';
    return 'w';
}
// 按当前范围缩放数值（用于会计性 / 期间性指标）
function _dbVal(base){ return Math.round(base * _dbScale().mult); }
// 简单环比 delta（依赖范围 + 卡片基准 yoy 略调）
function _dbMomDelta(yoyHint){
    const m = _dbScale().mult;
    const base = (yoyHint != null ? yoyHint : 5);
    const n = (base * 0.4 + (m - 1) * 1.5).toFixed(1);
    return Number(n);
}
// 卡片头部范围标签 + 环比
function _dbRangePill(yoyHint){
    const sc = _dbScale();
    const mom = _dbMomDelta(yoyHint);
    const sign = mom >= 0 ? '+' : '';
    const cls = mom >= 0 ? 'up' : 'down';
    return `<div class="wf-range-pill"><span class="rp-range">${sc.shortLabel}</span><span class="rp-mom ${cls}">${sc.prevLabel} ${sign}${mom}%</span></div>`;
}
function renderWFCard(c, idx){
    let body = '';
    switch (c.type) {
        case 'kpi': body = `<div class="kpi-grid">
            <div class="kpi"><div class="v">28</div><div class="l">在建项目</div><div class="t">↑ 12%</div></div>
            <div class="kpi"><div class="v">¥1.2亿</div><div class="l">本月签约</div><div class="t">↑ 8.4%</div></div>
            <div class="kpi"><div class="v">86.3%</div><div class="l">填报率</div><div class="t d">↓ 1.2%</div></div>
            <div class="kpi"><div class="v">11</div><div class="l">待审批</div><div class="t">↑ 3</div></div>
        </div>`; break;
        case 'gantt': body = `<div style="display:flex;flex-direction:column;gap:8px">${
            ['某市政务云一期','轨交调度系统','医院信息化','工业互联网','智慧水务','档案数字化'].map((n,i) => `
                <div style="display:grid;grid-template-columns:110px 1fr 36px;gap:10px;align-items:center;font-size:12px">
                    <span style="color:var(--text-2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${n}</span>
                    <div style="height:20px;background:var(--glass-bg-2);border-radius:10px;position:relative;border:1px solid var(--glass-border);overflow:hidden">
                        <div style="position:absolute;left:${i*8}%;width:${30+i*8}%;height:100%;background:linear-gradient(90deg,var(--primary),var(--accent));border-radius:10px;display:flex;align-items:center;padding-left:8px;color:#fff;font-size:10px;font-weight:600">${30+i*8}%</div>
                    </div>
                    <span style="color:var(--text-3)">P${i+1}</span>
                </div>`).join('')
        }</div>`; break;
        case 'pie': body = `<div style="display:flex;align-items:center;gap:14px">
            <div style="width:120px;height:120px;border-radius:50%;background:conic-gradient(var(--primary) 0 35%, var(--emerald) 35% 60%, var(--amber) 60% 78%, var(--sky) 78% 92%, var(--accent) 92% 100%);box-shadow:0 8px 24px rgba(96,165,250,0.30);position:relative">
                <div style="position:absolute;inset:22px;background:var(--glass-bg-3);backdrop-filter:blur(10px);border-radius:50%;display:grid;place-items:center;border:1px solid var(--glass-border)"><div style="text-align:center"><div style="font-size:18px;font-weight:700;letter-spacing:-0.02em">86</div><div style="font-size:9px;color:var(--text-3);text-transform:uppercase">项目</div></div></div>
            </div>
            <div style="flex:1;display:flex;flex-direction:column;gap:4px;font-size:11.5px">
                ${[['政务','35','var(--primary)'],['交通','25','var(--emerald)'],['医疗','18','var(--amber)'],['工业','14','var(--sky)'],['其它','8','var(--accent)']].map(([n,v,col]) => `
                    <div style="display:flex;align-items:center;gap:6px"><span style="width:8px;height:8px;border-radius:2px;background:${col}"></span>${n}<span style="margin-left:auto;color:var(--text-2)">${v}</span></div>`).join('')}
            </div>
        </div>`; break;
        case 'bidstat': body = `<div style="display:flex;align-items:flex-end;gap:6px;height:80px;padding:6px;background:var(--glass-bg-2);border-radius:10px;border:1px solid var(--glass-border)">
            ${[40,55,38,72,60,85,45,68,50,90,62,75].map(h => `<div style="flex:1;height:${h}%;background:linear-gradient(180deg,var(--primary),var(--accent));border-radius:4px 4px 0 0;box-shadow:0 4px 8px rgba(96,165,250,0.30)"></div>`).join('')}
        </div>
        <div style="display:flex;justify-content:space-between;font-size:11.5px;color:var(--text-2);margin-top:8px"><span>报名 24</span><span>中标 9</span><span>胜率 37.5%</span></div>`; break;
        case 'todo': body = `${MOCK_TODOS.slice(0,6).map(t => `<div class="row"><span class="chip ${t.tag}">${t.cat}</span><span class="lbl">${t.title}</span><span class="v">${t.due}</span></div>`).join('')}`; break;
        case 'heat':
            body = `<div id="hg-${_wfState.count}-${idx}" style="display:grid;grid-template-columns:repeat(35, 1fr);gap:2px"></div>
                <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text-3);margin-top:8px"><span>2026 年</span><span>少 ▏▎▍▌ 多</span></div>`;
            setTimeout(() => {
                const h = document.getElementById(`hg-${_wfState.count-1}-${idx}`);
                if (h) h.innerHTML = Array.from({length: 35*7}, () => {
                    const l = Math.floor(Math.random()*5);
                    const colors = ['var(--glass-bg-2)','rgba(20,184,166,0.30)','rgba(20,184,166,0.55)','rgba(20,184,166,0.80)','var(--teal)'];
                    return `<div style="aspect-ratio:1;border-radius:3px;background:${colors[l]}"></div>`;
                }).join('');
            }, 0);
            break;
        case 'trend': body = `<svg viewBox="0 0 300 80" preserveAspectRatio="none" style="width:100%;height:70px">
            <defs><linearGradient id="gg-${_wfState.count}-${idx}" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="#60A5FA" stop-opacity="0.5"/><stop offset="100%" stop-color="#93C5FD" stop-opacity="0"/></linearGradient></defs>
            <path d="M0 50 L50 35 L100 45 L150 22 L200 30 L250 15 L300 25 L300 80 L0 80 Z" fill="url(#gg-${_wfState.count}-${idx})"/>
            <path d="M0 50 L50 35 L100 45 L150 22 L200 30 L250 15 L300 25" stroke="#60A5FA" stroke-width="2.5" fill="none"/>
            ${[0,50,100,150,200,250,300].map((x,i) => `<circle cx="${x}" cy="${[50,35,45,22,30,15,25][i]}" r="3.5" fill="#fff" stroke="#93C5FD" stroke-width="2"/>`).join('')}
        </svg>`; break;
        case 'fulfil': body = `${[['今日','某医院HIS验收','s','check_circle'],['3天后','轨交里程碑','w','schedule'],['逾期2天','工业互联网','d','warning'],['12天后','水务验收','p','event'],['18天后','档案数字化','p','event']].map(([d,t,c,i])=>`<div class="row"><span class="chip ${c}"><span class="material-symbols-rounded" style="font-size:13px">${i}</span>${d}</span><span class="lbl">${t}</span></div>`).join('')}`; break;
        case 'notice': body = `${[['system','工天数据已同步','刚刚'],['campaign','假期值班通知','2h前'],['notifications','3 条待办','3h前'],['shield','登录异常 0 起','12h前']].map(([i,c,d])=>`<div class="row"><span class="material-symbols-rounded" style="font-size:18px;color:var(--primary)">${i}</span><div class="lbl"><div style="font-weight:500">${c}</div><div style="font-size:11px;color:var(--text-3)">${d}</div></div></div>`).join('')}`; break;
        case 'rank': body = `${['李明','张华','王芳','赵磊','陈静'].map((n,i)=>`<div class="row"><span class="chip ${i<3?'p':''}">#${i+1}</span><span class="lbl">${n}</span><div class="bar" style="width:80px"><i style="width:${95-i*10}%"></i></div><span class="v">${95-i*10}</span></div>`).join('')}`; break;
        case 'risk': body = `<div style="background:linear-gradient(135deg,rgba(244,63,94,0.18),rgba(244,63,94,0.08));border:1px solid rgba(244,63,94,0.30);padding:12px;border-radius:12px;margin-bottom:8px"><div style="font-weight:600;color:#BE123C">⚠ 紧急 · 1 项</div><div style="font-size:12px;color:var(--text-2);margin-top:4px">工业互联网逾期 2 天</div></div>
            <div style="background:linear-gradient(135deg,rgba(245,158,11,0.18),rgba(251,191,36,0.10));border:1px solid rgba(245,158,11,0.30);padding:12px;border-radius:12px"><div style="font-weight:600;color:#B45309">⚠ 警告 · 3 项</div><div style="font-size:12px;color:var(--text-2);margin-top:4px">3 个项目接近交付</div></div>`; break;
        case 'expense': body = `${[['¥18,500','差旅 · 王芳','d'],['¥3,200','招待 · 李明','p'],['¥6,800','物料 · 赵磊','p'],['¥12,000','差旅 · 张华','d']].map(([a,b,c])=>`<div class="row"><span class="lbl"><strong style="font-size:14px">${a}</strong> <span style="color:var(--text-3);font-size:12px">${b}</span></span><span class="chip ${c}">${c==='d'?'≥1万':'普通'}</span></div>`).join('')}`; break;
        case 'outs': body = `${['北京华信','深圳鹏海','上海智算','南京数研','广州联科'].map((n,i)=>`<div class="row"><span class="lbl">${n}</span><div class="bar s" style="width:80px"><i style="width:${90-i*8}%"></i></div><span class="v">${90-i*8}</span></div>`).join('')}`; break;
        case 'disp': body = `<div style="font-size:32px;font-weight:700;letter-spacing:-0.03em;background:linear-gradient(135deg,var(--primary),var(--accent));-webkit-background-clip:text;-webkit-text-fill-color:transparent">12 <span style="font-size:13px;font-weight:400;color:var(--text-3);-webkit-text-fill-color:var(--text-3)">个任务包</span></div><div style="font-size:12px;color:var(--text-2);margin-bottom:10px">5 个项目 · 8 名作业员</div>${['项目A · 设备调试','项目B · 文档','项目C · 实施'].map(t=>`<div class="row"><span class="lbl">${t}</span><span class="chip s">活跃</span></div>`).join('')}`; break;
        case 'cash': body = `<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
            <div style="padding:12px;background:linear-gradient(135deg,rgba(16,185,129,0.18),rgba(20,184,166,0.10));border:1px solid rgba(16,185,129,0.20);border-radius:12px"><div style="font-size:11px;color:#0F766E">收入</div><div style="font-size:22px;font-weight:700;background:linear-gradient(135deg,var(--emerald),var(--teal));-webkit-background-clip:text;-webkit-text-fill-color:transparent">¥4.6M</div></div>
            <div style="padding:12px;background:linear-gradient(135deg,rgba(244,63,94,0.18),rgba(244,63,94,0.08));border:1px solid rgba(244,63,94,0.20);border-radius:12px"><div style="font-size:11px;color:#BE123C">支出</div><div style="font-size:22px;font-weight:700;background:linear-gradient(135deg,var(--rose),#FB7185);-webkit-background-clip:text;-webkit-text-fill-color:transparent">¥3.2M</div></div>
        </div>
        <div style="margin-top:10px;padding:12px;background:linear-gradient(135deg,rgba(96,165,250,0.18),rgba(59,130,246,0.10));border:1px solid rgba(96,165,250,0.20);border-radius:12px"><div style="font-size:11px;color:#1E3A8A">净流入</div><div style="font-size:22px;font-weight:700;background:linear-gradient(135deg,var(--primary),var(--primary-2));-webkit-background-clip:text;-webkit-text-fill-color:transparent">¥1.4M</div></div>`; break;
        case 'mile': body = `${[['05-02','某市政务云终验','p'],['05-08','轨交联调','p'],['05-15','HIS上线','s'],['05-22','工业整改','w'],['06-01','档案移交','p'],['06-12','水务中验','p']].map(([d,t,c])=>`<div class="row"><span class="chip ${c}">${d}</span><span class="lbl">${t}</span></div>`).join('')}`; break;

        // ===== 1. 年度累计中标总额（招投标 / 非招投标分源 + 年度目标进度） =====
        case 'bid_total': {
            const d = MOCK_DASHBOARD.bid;
            const a = d.sources[0], b = d.sources[1];
            const sum = a.value + b.value;
            const total = _dbVal(d.total);
            const av = _dbVal(a.value), bv = _dbVal(b.value);
            const target = d.targetTotal; // 目标固定为年度目标
            const finishedPct = Math.min(100, Math.round(total / target * 100));
            const remain = Math.max(0, target - total);
            body = `<div class="wf-amount">¥<span class="num">${_wfFmt(total)}</span><span class="unit">${d.unit}</span></div>
                <div class="wf-sub">同比 <span class="up">+${d.yoy}%</span> · 年度完成度 <strong>${finishedPct}%</strong></div>
                <div class="wf-stack">
                    <div class="seg" style="flex:${a.value};background:linear-gradient(135deg,var(--primary),var(--primary-2))" title="${a.name} ¥${av} 万"></div>
                    <div class="seg" style="flex:${b.value};background:linear-gradient(135deg,var(--emerald),var(--teal))" title="${b.name} ¥${bv} 万"></div>
                </div>
                <div class="wf-legend">
                    <span><i style="background:var(--primary)"></i>${a.name} ¥${_wfFmt(av)} 万 · ${Math.round(a.value/sum*100)}%</span>
                    <span><i style="background:var(--emerald)"></i>${b.name} ¥${_wfFmt(bv)} 万 · ${Math.round(b.value/sum*100)}%</span>
                </div>
                <div class="wf-progress">
                    <div class="t">年度目标 ¥${_wfFmt(target)} 万</div>
                    <div class="bar"><i style="width:${finishedPct}%"></i></div>
                    <div class="b"><span>进度 ${finishedPct}%</span><span>剩 ¥${_wfFmt(remain)} 万</span></div>
                </div>`;
            break;
        }
        // ===== 2. 年度累计签约合同总额（A端/B端 + 收入结构环图） =====
        case 'contract_total': {
            const d = MOCK_DASHBOARD.contract;
            const a = d.sides[0], b = d.sides[1];
            const sum = a.value + b.value;
            const ringPct = Math.round(a.value / sum * 100);
            const total = _dbVal(d.total);
            const av = _dbVal(a.value), bv = _dbVal(b.value);
            body = `<div class="wf-amount">¥<span class="num">${_wfFmt(total)}</span><span class="unit">${d.unit}</span></div>
                <div class="wf-sub">同比 <span class="up">+${d.yoy}%</span></div>
                <div class="wf-flex">
                    ${_wfRing(ringPct, 'var(--primary)', `<strong>${ringPct}%</strong>`, '甲方占比')}
                    <div class="wf-legend col">
                        ${d.struct.map(s => `<span><i style="background:${s.color}"></i>${s.name} <strong>${s.pct}%</strong></span>`).join('')}
                    </div>
                </div>
                <div class="wf-cells2">
                    <div class="cell"><div class="num">¥${_wfFmt(av)}</div><div class="lbl">${a.name}</div></div>
                    <div class="cell"><div class="num">¥${_wfFmt(bv)}</div><div class="lbl">${b.name}</div></div>
                </div>`;
            break;
        }
        // ===== 3. 年度累计回款 + 整体回款率 + 逾期预警 =====
        case 'payback_total': {
            const d = MOCK_DASHBOARD.payback;
            const total = _dbVal(d.total);
            const received = _dbVal(d.received);
            const receivable = _dbVal(d.receivable);
            const overdueAmt = _dbVal(d.overdue.amount);
            body = `<div class="wf-amount">¥<span class="num">${_wfFmt(total)}</span><span class="unit">${d.unit}</span></div>
                <div class="wf-sub">同比 <span class="up">+${d.yoy}%</span></div>
                <div class="wf-flex">
                    ${_wfRing(d.rate, 'var(--rose)', `<strong>${d.rate}%</strong>`, '回款率')}
                    <div class="wf-rinfo">
                        <div class="rkv"><span>已回款</span><strong>¥${_wfFmt(received)} 万</strong></div>
                        <div class="rkv"><span>应回款</span><strong>¥${_wfFmt(receivable)} 万</strong></div>
                        <div class="rkv"><span>未回款</span><strong>¥${_wfFmt(receivable-received)} 万</strong></div>
                    </div>
                </div>
                <div class="wf-warn">
                    <span class="material-symbols-rounded">warning</span>
                    <div>
                        <div class="w-t">逾期应收 <strong>¥${overdueAmt} 万</strong></div>
                        <div class="w-d">${d.overdue.projects} 个项目 · 最长 ${d.overdue.maxDays} 天</div>
                    </div>
                </div>`;
            break;
        }
        // ===== 4. 年度累计成本支出（外包/人工/HW-SW/四费 + 饼图） =====
        case 'cost_total': {
            const d = MOCK_DASHBOARD.cost;
            const total = _dbVal(d.total);
            const items = d.items.map(it => ({ ...it, value: _dbVal(it.value) }));
            body = `<div class="wf-amount">¥<span class="num">${_wfFmt(total)}</span><span class="unit">${d.unit}</span></div>
                <div class="wf-sub">同比 <span class="up">+${d.yoy}%</span></div>
                <div class="wf-flex">
                    <div class="wf-pie" style="background:${_wfPie(items)}"><div class="hole"><div class="hv">${total}</div><div class="hl">总成本(${d.unit})</div></div></div>
                    <div class="wf-legend col">
                        ${items.map(it => `<span><i style="background:${it.color}"></i>${it.name} <strong>${it.pct}%</strong> · ¥${_wfFmt(it.value)}</span>`).join('')}
                    </div>
                </div>`;
            break;
        }
        // ===== 6. 在建项目 + 重点管控 + 合规率 =====
        case 'project_total': {
            const d = MOCK_DASHBOARD.project;
            body = `<div class="wf-cells2">
                    <div class="cell"><div class="num">${d.active}</div><div class="lbl">在建项目</div></div>
                    <div class="cell"><div class="num">${d.key}</div><div class="lbl">重点管控</div></div>
                </div>
                <div class="wf-flex">
                    ${_wfRing(d.compliance, 'var(--emerald)', `<strong>${d.compliance}%</strong>`, '合规率')}
                    <div class="wf-rinfo">
                        <div class="rkv"><span>需关注</span><strong>${d.attention} 项</strong></div>
                        <div class="rkv"><span>整改中</span><strong>${d.fixing} 项</strong></div>
                        <div class="rkv"><span>已合规</span><strong>${d.active - d.attention} 项</strong></div>
                    </div>
                </div>`;
            break;
        }
        // ===== 7. 年度整体中标率 + 月度迷你折线 =====
        case 'bid_rate': {
            const d = MOCK_DASHBOARD.bidRate;
            const signed = _dbVal(d.signed);
            const won = _dbVal(d.won);
            // 中标率 = 中标 / 投标，因为我们等比例缩放故仍保持百分比
            body = `<div class="wf-amount"><span class="num">${d.rate}</span><span class="unit">%</span></div>
                <div class="wf-sub">同比 <span class="up">+${d.deltaPp}pp</span> · 投标 ${signed} · 中标 ${won}</div>
                ${_wfMini(d.monthly, 'var(--emerald)')}
                <div class="wf-mini-x">${['1','2','3','4','5','6','7','8','9','10','11','12'].map(m=>`<span>${m}月</span>`).join('')}</div>`;
            break;
        }
        // ===== 8. 公司在职人员 + 核心岗位留存 + 月新增/流失 =====
        case 'headcount_total': {
            const d = MOCK_DASHBOARD.headcount;
            // 在职/留存为存量(不缩放)；新增/离职是流量(按时间范围缩放)
            const monthIn = _dbVal(d.monthIn);
            const monthOut = _dbVal(d.monthOut);
            const sc = _dbScale();
            body = `<div class="wf-cells2">
                    <div class="cell"><div class="num">${d.total}</div><div class="lbl">在职人员</div></div>
                    <div class="cell"><div class="num">${d.coreRetention}%</div><div class="lbl">核心留存</div></div>
                </div>
                <div class="wf-row2">
                    <div class="r-cell"><span class="material-symbols-rounded" style="color:var(--emerald);font-size:18px">trending_up</span>${sc.shortLabel}新增 <strong>+${monthIn}</strong></div>
                    <div class="r-cell"><span class="material-symbols-rounded" style="color:var(--rose);font-size:18px">trending_down</span>${sc.shortLabel}离职 <strong>-${monthOut}</strong></div>
                </div>`;
            break;
        }
        // ===== 9. 公司核心资产总额（HW-SW + 外协 + 知识产权） =====
        case 'assets_total': {
            const d = MOCK_DASHBOARD.assets;
            body = `<div class="wf-amount">¥<span class="num">${_wfFmt(d.total)}</span><span class="unit">${d.unit}</span></div>
                <div class="wf-sub">硬件 + 软件 + 外协 + 知识产权</div>
                <div class="wf-asset-list">
                    ${d.items.map(it => `<div class="ai">
                        <div class="lbl">${it.name}</div>
                        <div class="bar"><i style="width:${it.pct*2}%;background:linear-gradient(90deg,${it.color},${it.color})"></i></div>
                        <div class="v">¥${_wfFmt(it.value)}</div>
                    </div>`).join('')}
                </div>`;
            break;
        }
        // ===== 11. 月日历事项看板入口（参考图1） =====
        case 'cal_open': {
            const sum = _wfCalSummary();
            const cal = window.MOCK_CALENDAR;
            body = `<div class="wf-cal-summary">
                    <div class="cs-month">${cal.year}<span class="op">/</span>${String(cal.month).padStart(2,'0')}</div>
                    <div class="cs-stat">本月共 <strong>${sum.total}</strong> 项事项</div>
                </div>
                <div class="wf-cal-mini">${_wfCalMiniGrid()}</div>
                <div class="wf-cal-legend">
                    <span class="cl"><i class="cl-trip"></i>出差 ${sum.counts.trip||0}</span>
                    <span class="cl"><i class="cl-visit"></i>拜访 ${sum.counts.visit||0}</span>
                    <span class="cl"><i class="cl-bid"></i>投标 ${sum.counts.bid||0}</span>
                    <span class="cl"><i class="cl-other"></i>其他 ${sum.counts.other||0}</span>
                </div>
                <button class="btn primary wf-cal-btn" id="wfBtnOpenCalendar">
                    <span class="material-symbols-rounded" style="font-size:16px">open_in_full</span>
                    打开月历事项看板
                </button>`;
            break;
        }
        // ===== 12. 平台动态（系统操作日志 · 时间流） =====
        case 'platform_logs': {
            const logs = (window.MOCK_LOGS || []).slice(0, 8);
            const total = (window.MOCK_LOGS || []).length;
            const counts = (window.MOCK_LOGS || []).reduce((m, l) => {
                m[l.typeC] = (m[l.typeC] || 0) + 1; return m;
            }, {});
            body = `<div class="wf-pf-stat">
                    <span class="pf-st"><i class="dot p"></i>项目 ${counts.p||0}</span>
                    <span class="pf-st"><i class="dot w"></i>合同 ${counts.w||0}</span>
                    <span class="pf-st"><i class="dot s"></i>审批 ${counts.s||0}</span>
                    <span class="pf-st"><i class="dot d"></i>资料 ${counts.d||0}</span>
                    <span class="pf-st"><i class="dot a"></i>账户 ${counts.a||0}</span>
                </div>
                <div class="wf-timeline">
                    ${logs.map(l => `<div class="ti">
                        <div class="t-time">${(l.time||'').slice(5)}</div>
                        <div class="t-bar"><span class="t-dot t-${l.typeC||'p'}"><span class="material-symbols-rounded" style="font-size:12px">${l.typeIcon||'bolt'}</span></span></div>
                        <div class="t-body">
                            <div class="t-head">
                                <strong>${l.user}</strong>
                                <span class="t-tag tt-${l.typeC||'p'}">${l.type}</span>
                                <span class="t-status ${l.status==='失败'?'fail':'ok'}">${l.status}</span>
                            </div>
                            <div class="t-op">${l.op}<span class="t-tgt">· ${l.target}</span></div>
                        </div>
                    </div>`).join('')}
                </div>
                <a class="wf-more-link" id="wfPfMore">查看全部 ${total} 条平台动态 <span class="material-symbols-rounded" style="font-size:14px">arrow_forward</span></a>`;
            break;
        }
        default: body = `<p style="color:var(--text-3)">${c.title}</p>`;
    }
    const iconMap = {gantt:'view_timeline',pie:'pie_chart',heat:'grid_view',trend:'trending_up',kpi:'analytics',bidstat:'campaign',todo:'task_alt',fulfil:'event',notice:'notifications',rank:'leaderboard',risk:'warning',expense:'receipt_long',outs:'group_work',disp:'assignment_ind',cash:'payments',mile:'flag',
        bid_total:'campaign', contract_total:'description', payback_total:'payments', cost_total:'savings',
        project_total:'work', bid_rate:'analytics', headcount_total:'group',
        productivity_total:'trending_up', assets_total:'inventory', cal_open:'calendar_month',
        platform_logs:'history'};
    // 头部范围标签：绝对存量型(资产/在职/在建)与日历入口/平台动态隐藏标签，仅显示环比
    const noRangePill = ['cal_open','platform_logs'].includes(c.type);
    const yoyMap = { bid_total:12.4, contract_total:8.6, payback_total:8.1, cost_total:6.2, project_total:4, bid_rate:5, headcount_total:3, productivity_total:7, assets_total:5 };
    const pill = noRangePill ? '' : _dbRangePill(yoyMap[c.type]);
    return `
        <div class="wf-card wf-slot" data-id="${c.id}">
            <div class="h">
                <div class="t">
                    <div class="ico ${iconClassOf(c.type)}"><span class="material-symbols-rounded" style="font-size:14px">${iconMap[c.type]||'insert_chart'}</span></div>
                    ${c.title}
                </div>
                <div class="actions">
                    <button class="icon-btn" title="刷新"><span class="material-symbols-rounded">refresh</span></button>
                    <button class="icon-btn" title="设置"><span class="material-symbols-rounded">tune</span></button>
                    <button class="icon-btn" data-act="close" title="移除"><span class="material-symbols-rounded">close</span></button>
                </div>
            </div>
            ${pill}
            ${body}
        </div>`;
}

// ============ 月历事项看板（按需求2 · 图1 风格 · 复用通用弹窗） ============
let _calState = { year: 0, month: 0, dept: 'all', member: 'all', kw: '', selectedKey: null };
function openCalendarBoard(){
    const cal = window.MOCK_CALENDAR;
    if (!_calState.year) { _calState.year = cal.year; _calState.month = cal.month; }
    if (!_calState.selectedKey) {
        // 默认选择当月第一天有事项的日期
        _calState.selectedKey = `${_calState.year}-${String(_calState.month).padStart(2,'0')}-${String(cal.month === MOCK_CALENDAR.month ? new Date().getDate() : 1).padStart(2,'0')}`;
    }
    openModal('月日历事项看板', _renderCalendarBody(), { width:'1280px', height:'760px' });
    setTimeout(_bindCalendarEvents, 30);
}
window.openCalendarBoard = openCalendarBoard;

function _renderCalendarBody(){
    const cal = window.MOCK_CALENDAR;
    const y = _calState.year, m = _calState.month;
    return `<div class="cal-board cal-board-split">
        <div class="cal-board-main">
            <div class="cal-toolbar">
                <div class="ct-left">
                    <button class="btn cal-nav" data-nav="prev"><span class="material-symbols-rounded" style="font-size:18px">chevron_left</span></button>
                    <div class="ct-month">${y}<span class="sep">年</span>${String(m).padStart(2,'0')}<span class="sep">月</span></div>
                    <button class="btn cal-nav" data-nav="next"><span class="material-symbols-rounded" style="font-size:18px">chevron_right</span></button>
                    <button class="btn cal-nav" data-nav="today">本月</button>
                </div>
                <div class="ct-mid">
                    <div class="ipt"><span class="material-symbols-rounded" style="font-size:16px;color:var(--text-3)">apartment</span>
                        <select id="calDept">
                            <option value="all">全部部门</option>
                            ${cal.depts.map(d => `<option value="${d}">${d}</option>`).join('')}
                        </select>
                    </div>
                    <div class="ipt"><span class="material-symbols-rounded" style="font-size:16px;color:var(--text-3)">person</span>
                        <select id="calMember">
                            <option value="all">全部人员</option>
                            ${cal.members.map(p => `<option value="${p}">${p}</option>`).join('')}
                        </select>
                    </div>
                    <div class="ipt"><span class="material-symbols-rounded" style="font-size:16px;color:var(--text-3)">search</span>
                        <input id="calKw" placeholder="支持助记码检索"/>
                    </div>
                </div>
                <div class="ct-right">
                    <!-- 需求060101-三.1：事项类型整合（软硬件设备/项目进度/人员投入/业务培训/沟通协调/待解决问题 → 日常工作记录） -->
                    <span class="cal-tag tg-meeting">会议</span>
                    <span class="cal-tag tg-visit">来访</span>
                    <span class="cal-tag tg-trip">出差</span>
                    <span class="cal-tag tg-onsite">驻场</span>
                    <span class="cal-tag tg-payment">回款</span>
                    <span class="cal-tag tg-daily">日常工作记录</span>
                </div>
            </div>
            <div class="cal-weeks">${['一','二','三','四','五','六','日'].map(w=>`<span>${w}</span>`).join('')}</div>
            <div class="cal-grid">${_renderCalendarGrid(y, m)}</div>
        </div>
        <div class="cal-side" id="calSide">${_renderCalendarSide()}</div>
    </div>`;
}
function _renderCalendarSide(){
    const cal = window.MOCK_CALENDAR;
    const k = _calState.selectedKey;
    if (!k) return `<div class="cal-side-empty"><span class="material-symbols-rounded">event_available</span><div>请点击日期查看当日事项</div></div>`;
    const [yy, mm, dd] = k.split('-').map(Number);
    const date = new Date(yy, mm - 1, dd);
    const weekDays = ['星期日','星期一','星期二','星期三','星期四','星期五','星期六'];
    const evs = (cal.events[k] || []).filter(_calFilter);
    const hol = cal.holidays[k];
    const lun = cal.lunar[k] || '';
    const isToday = (() => {
        const t = new Date();
        return t.getFullYear() === yy && (t.getMonth()+1) === mm && t.getDate() === dd;
    })();
    // 需求060101-三.1：事项类型整合 — 软硬件设备 / 项目进度 / 人员投入 / 业务培训 / 沟通协调 / 待解决问题 全部归入 日常工作记录
    const dailyTypeSet = new Set(['equip','progress','staff','training','comm','issue','daily']);
    const dailySubLabel = { equip:'软硬件设备', progress:'项目进度', staff:'人员投入', training:'业务培训', comm:'沟通协调', issue:'待解决问题' };
    const groups = { meeting:[], visit:[], trip:[], onsite:[], payment:[], daily:[] };
    evs.forEach(e => {
        if (dailyTypeSet.has(e.type)) groups.daily.push(e);
        else (groups[e.type] || groups.daily).push(e);
    });
    const typeLabel = { meeting:'会议', visit:'来访', trip:'出差', onsite:'驻场', payment:'回款', daily:'日常工作记录' };
    const sections = ['meeting','visit','trip','onsite','payment','daily'].filter(t => groups[t].length).map(t => `
        <div class="cs-group">
            <div class="cs-group-h">
                <span class="cs-tag cs-tag-${t}"></span>
                <span class="cs-group-title">${typeLabel[t]}</span>
                <span class="cs-group-count">${groups[t].length} 项</span>
            </div>
            ${groups[t].map(e => {
                const subLabel = (t === 'daily' && dailySubLabel[e.type]) ? `<span class="cs-sub-label">${dailySubLabel[e.type]}</span>` : '';
                return `<div class="cs-item evt-${e.type}">
                    <div class="cs-time"><span class="material-symbols-rounded">schedule</span>${e.time||'全天'}${subLabel}</div>
                    <div class="cs-title">${e.title}</div>
                    ${e.member?`<div class="cs-meta"><span class="material-symbols-rounded">person</span>${e.member}</div>`:''}
                    ${e.location?`<div class="cs-meta"><span class="material-symbols-rounded">location_on</span>${e.location}</div>`:''}
                    ${e.note?`<div class="cs-note">${e.note}</div>`:''}
                </div>`;
            }).join('')}
        </div>`).join('');
    return `<div class="cs-head">
            <div class="cs-date">
                <div class="cs-d-num">${String(dd).padStart(2,'0')}<span class="${isToday?'cs-today':''}">${isToday?'今日':''}</span></div>
                <div class="cs-d-meta">
                    <div class="cs-d-week">${yy}年${String(mm).padStart(2,'0')}月 · ${weekDays[date.getDay()]}</div>
                    ${hol?`<div class="cs-d-hol">${hol}</div>`:''}
                    ${lun?`<div class="cs-d-lun">${lun}</div>`:''}
                </div>
            </div>
            <div class="cs-summary">本日共 <strong>${evs.length}</strong> 项事项</div>
        </div>
        <div class="cs-body">
            ${evs.length ? sections : `<div class="cal-side-empty"><span class="material-symbols-rounded">event_busy</span><div>当日无事项</div></div>`}
        </div>
        <!-- 需求060101-三.1.(3)：新增事项按钮 移至 右侧详情侧边栏下方居中 -->
        <div class="cs-foot">
            <button class="btn primary" id="calNewEvent"><span class="material-symbols-rounded" style="font-size:16px">add</span>新增事项</button>
        </div>`;
}
function _renderCalendarGrid(year, month){
    const cal = window.MOCK_CALENDAR;
    const first = new Date(year, month - 1, 1);
    const startCol = (first.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month, 0).getDate();
    const prevDays = new Date(year, month - 1, 0).getDate();
    const cells = [];
    const today = new Date();
    function dateKey(yy, mm, dd){
        return `${yy}-${String(mm).padStart(2,'0')}-${String(dd).padStart(2,'0')}`;
    }
    function makeCell(yy, mm, dd, faded){
        const k = dateKey(yy, mm, dd);
        const evs = (cal.events[k] || []).filter(_calFilter);
        const hol = cal.holidays[k];
        const lun = cal.lunar[k] || '';
        const isToday = today.getFullYear() === yy && (today.getMonth()+1) === mm && today.getDate() === dd;
        const more = evs.length > 3 ? `<div class="cal-more">+${evs.length - 3} 项</div>` : '';
        const head = `<div class="cal-h">
                <span class="d ${isToday?'today':''}">${dd}</span>
                ${hol ? `<span class="hol">${hol}</span>` : (lun ? `<span class="lun">${lun}</span>` : '')}
            </div>`;
        return `<div class="cal-cell${faded?' faded':''}${isToday?' is-today':''}" data-k="${k}">
            ${head}
            <div class="cal-evts">${evs.slice(0,3).map(e => `<div class="cal-evt evt-${e.type}" title="${e.title} ${e.time}">
                <span class="dot"></span><span class="t">${e.time !== '全天' ? e.time + ' ' : ''}${e.title}</span>
            </div>`).join('')}${more}</div>
        </div>`;
    }
    for (let i = startCol - 1; i >= 0; i--) {
        const d = prevDays - i;
        const pm = month === 1 ? 12 : month - 1;
        const py = month === 1 ? year - 1 : year;
        cells.push(makeCell(py, pm, d, true));
    }
    for (let d = 1; d <= daysInMonth; d++) cells.push(makeCell(year, month, d, false));
    while (cells.length < 42) {
        const d = cells.length - startCol - daysInMonth + 1;
        const nm = month === 12 ? 1 : month + 1;
        const ny = month === 12 ? year + 1 : year;
        cells.push(makeCell(ny, nm, d, true));
    }
    return cells.join('');
}
function _calFilter(e){
    if (_calState.member !== 'all' && !e.title.includes(_calState.member)) return false;
    if (_calState.kw && !e.title.toLowerCase().includes(_calState.kw.toLowerCase())) return false;
    return true;
}
function _bindCalendarEvents(){
    const root = $('#modalBody'); if (!root) return;
    const refresh = () => {
        $('#modalBody').innerHTML = _renderCalendarBody();
        _bindCalendarEvents();
    };
    $$('.cal-nav', root).forEach(b => b.onclick = () => {
        const nav = b.dataset.nav;
        if (nav === 'prev') {
            if (_calState.month === 1) { _calState.year--; _calState.month = 12; } else _calState.month--;
        } else if (nav === 'next') {
            if (_calState.month === 12) { _calState.year++; _calState.month = 1; } else _calState.month++;
        } else if (nav === 'today') {
            _calState.year = MOCK_CALENDAR.year; _calState.month = MOCK_CALENDAR.month;
        }
        // 切月时清空选中以默认展示当日
        _calState.selectedKey = null;
        refresh();
    });
    const dept = $('#calDept', root);
    const mem = $('#calMember', root);
    const kw = $('#calKw', root);
    if (dept) { dept.value = _calState.dept; dept.onchange = () => { _calState.dept = dept.value; refresh(); }; }
    if (mem)  { mem.value  = _calState.member; mem.onchange  = () => { _calState.member = mem.value; refresh(); }; }
    if (kw)   { kw.value   = _calState.kw; kw.oninput   = () => { _calState.kw = kw.value; refresh(); }; }
    // 侧边栏内"新增事项"按钮绑定（侧边栏每次重渲染都需要重新绑定）
    const _bindCalSideBtn = () => {
        const newBtn = $('#calNewEvent', root);
        if (newBtn) newBtn.onclick = () => openModal('新增事项', calEventFormModal(_calState.selectedKey), { width:'620px', height:'520px' });
    };
    // 点击日期 → 仅刷新右侧面板，不重渲染整个看板
    $$('.cal-cell', root).forEach(cell => {
        cell.onclick = (e) => {
            const k = cell.dataset.k;
            if (!k) return;
            _calState.selectedKey = k;
            // 切换选中样式
            $$('.cal-cell', root).forEach(c => c.classList.toggle('selected', c.dataset.k === k));
            const side = $('#calSide', root);
            if (side) { side.innerHTML = _renderCalendarSide(); _bindCalSideBtn(); }
        };
    });
    // 默认日期高亮
    if (_calState.selectedKey) {
        const sel = root.querySelector(`.cal-cell[data-k="${_calState.selectedKey}"]`);
        if (sel) sel.classList.add('selected');
    }
    // 需求060101-三.1.(3)：新增事项按钮 — 侧边栏下方居中
    _bindCalSideBtn();
}

// 需求060101-三.1：事项类型整合为 6 类；日常工作记录 含 6 种子类型
window.calEventFormModal = function(dateKey){
    const today = dateKey || new Date().toISOString().slice(0,10);
    const types = [
        { v:'meeting', l:'会议' },
        { v:'visit',   l:'来访' },
        { v:'trip',    l:'出差' },
        { v:'onsite',  l:'驻场' },
        { v:'payment', l:'回款' },
        { v:'daily',   l:'日常工作记录' }
    ];
    // 日常工作记录 子类型
    const dailySubs = [
        { v:'equip',    l:'软硬件设备' },
        { v:'progress', l:'项目进度' },
        { v:'staff',    l:'人员投入' },
        { v:'training', l:'业务培训' },
        { v:'comm',     l:'沟通协调' },
        { v:'issue',    l:'待解决问题' }
    ];
    return `
    <div class="bf-form" data-cal-evt-form>
        <div class="bf-section">事项信息</div>
        <div class="bf-grid">
            <div class="bf-cell"><label>事项类型 <i>*</i></label>
                <select class="bf-ipt" id="calEvtType">${types.map(t => `<option value="${t.v}">${t.l}</option>`).join('')}</select>
            </div>
            <div class="bf-cell" id="calEvtSubCell" style="display:none"><label>记录子类型 <i>*</i></label>
                <select class="bf-ipt" id="calEvtSub">${dailySubs.map(s => `<option value="${s.v}">${s.l}</option>`).join('')}</select>
            </div>
            <div class="bf-cell"><label>日期 <i>*</i></label>
                <input class="bf-ipt" type="date" value="${today}"/>
            </div>
            <div class="bf-cell"><label>时间</label>
                <input class="bf-ipt" type="time" value="09:00"/>
            </div>
            <div class="bf-cell"><label>负责人 <i>*</i></label>
                <input class="bf-ipt" placeholder="姓名"/>
            </div>
            <div class="bf-cell bf-span-2"><label>事项标题 <i>*</i></label>
                <input class="bf-ipt" placeholder="例：与XX单位项目对接会议"/>
            </div>
            <div class="bf-cell bf-span-2"><label>地点 / 项目</label>
                <input class="bf-ipt" placeholder="地点或关联项目"/>
            </div>
            <div class="bf-cell bf-span-2"><label>备注</label>
                <textarea class="bf-ipt" rows="3" placeholder="补充说明..."></textarea>
            </div>
        </div>
        <div class="bf-foot">
            <button class="btn" onclick="closeModal()">取消</button>
            <button class="btn primary" onclick="closeModal()"><span class="material-symbols-rounded" style="font-size:16px">save</span>保存</button>
        </div>
    </div>`;
};
// 事项类型 = 日常工作记录 时显示子类型
document.addEventListener('change', function(e){
    if (e.target && e.target.id === 'calEvtType') {
        const cell = document.getElementById('calEvtSubCell');
        if (cell) cell.style.display = (e.target.value === 'daily') ? '' : 'none';
    }
});

// ============ 首页：我的待办 ============
function renderHomeTodo(){
    const pg = $('#pages');
    const urgent = MOCK_TODOS.filter(x => x.urgency === '紧急').length;
    const high   = MOCK_TODOS.filter(x => x.urgency === '高').length;
    const due    = MOCK_TODOS.filter(x => x.due === '今天' || x.due.includes('今天')).length;
    const cols = [
        { key:'id',      label: t('common.id'),       w:'90px',  render: x=>`<span class="cell-id">${x.id}</span>` },
        { key:'cat',     label: t('common.cat'),      w:'90px',  render: x=>`<span class="chip ${x.tag}">${tt(x.cat)}</span>` },
        { key:'title',   label: t('common.title'),    render: x=>`<span style="display:inline-flex;align-items:center;gap:8px"><span class="material-symbols-rounded" style="font-size:16px;color:var(--primary)">${x.icon}</span>${x.title}</span>` },
        { key:'due',     label: t('common.due'),      w:'120px', render: x=>x.due },
        { key:'urgency', label: t('common.urgency'),  w:'80px',  render: x=>`<span class="chip ${x.urgency==='紧急'?'d':x.urgency==='高'?'w':'p'}">${tt(x.urgency)}</span>` },
        { key:'_act',    label: t('common.action'),   w:'120px', render: x=>actBtns([{icon:'visibility',title:t('btn.view')},{icon:'check_circle',title:t('btn.approve'),color:'var(--emerald)'}]) }
    ];
    pg.innerHTML = `
        ${pageHeader(State.lang==='en'?'My Tasks':'我的待办', t('page.totalCount',{n:MOCK_TODOS.length})+` · ${tt('紧急')} ${urgent} · ${State.lang==='en'?'Today':'今日'} ${due}`, `
            <button class="btn"><span class="material-symbols-rounded" style="font-size:16px">filter_alt</span>${t('btn.filter')}</button>
            <button class="btn primary"><span class="material-symbols-rounded" style="font-size:16px">add</span>${t('btn.new')}</button>`)}
        ${statRow([
            { l: State.lang==='en'?'Tasks':'待办总数', v: MOCK_TODOS.length, c:'p' },
            { l: tt('紧急'), v: urgent, c:'d' },
            { l: State.lang==='en'?'High':'高优先', v: high, c:'w' },
            { l: State.lang==='en'?'Today':'今日到期', v: due, c:'a' }
        ])}
        ${toolbar({
            filters: [
                { value:'all', label: t('common.all'), active:true, count: MOCK_TODOS.length },
                { value:'urgent', label: tt('紧急'), count: urgent },
                { value:'high', label: State.lang==='en'?'High':'高优先', count: high },
                { value:'today', label: State.lang==='en'?'Today':'今日', count: due }
            ],
            searchPh: State.lang==='en'?'Search tasks…':'搜索待办…'
        })}
        ${tableShell(cols, 'todoBody')}`;
    InfiniteList.bind({ source: MOCK_TODOS, pageSize: 12, container:'todoBody', render: tableRow(cols) });
}

// ============ 招投标：首页（可视化 · 按需求 0903 改造） ============
// 按需求 0903：
//  - 删除原"招投标管理-总览"标题红框（保留 actions 区域）
//  - 删除"新建投标"按钮
//  - "月报"切换 → 6 档时间选择器（today/week/month/quarter/year/custom）
//  - 数据按时间范围动态加载
window._bhState = Object.assign({ range: 'year' }, defaultYearRange());
const BH_RANGE_PRESETS = {
    today:   { label: '今日', mult: 1/30,  icon: 'today' },
    week:    { label: '本周', mult: 7/30,  icon: 'view_week' },
    month:   { label: '本月', mult: 1,     icon: 'calendar_view_month' },
    quarter: { label: '本季', mult: 3,     icon: 'date_range' },
    year:    { label: '本年', mult: 12,    icon: 'event_note' },
    custom:  { label: '自定义', mult: 1,    icon: 'tune' }
};
function _bhScale(){
    const r = _bhState.range;
    if (r === 'custom' && _bhState.from && _bhState.to) {
        const days = Math.max(1, Math.round((new Date(_bhState.to) - new Date(_bhState.from)) / 86400000) + 1);
        return { mult: days / 30, label: `${_bhState.from} ~ ${_bhState.to}`, shortLabel: `${days}天` };
    }
    const p = BH_RANGE_PRESETS[r] || BH_RANGE_PRESETS.month;
    return { mult: p.mult, label: p.label, shortLabel: p.label };
}
function _bhVal(base){ return Math.round(base * _bhScale().mult); }
function renderBiddingHome(){
    const pg = $('#pages');
    pg.innerHTML = `
        <div class="bh-toolbar">
            <div class="db-range" id="bhRange"></div>
            <div class="db-range-pop" id="bhRangePop">
                <span class="db-pop-lbl">起</span>
                <input type="date" id="bhStart" value="${_bhState.from || ''}"/>
                <span class="db-pop-sep">~</span>
                <span class="db-pop-lbl">止</span>
                <input type="date" id="bhEnd" value="${_bhState.to || ''}"/>
                <button class="btn primary db-pop-apply" id="bhApply"><span class="material-symbols-rounded" style="font-size:16px">check</span>应用</button>
            </div>
        </div>
        <div class="db-range-label" id="bhRangeLabel"></div>
        <div id="bhContent"></div>`;
    _bhRenderRangeBar();
    const apply = $('#bhApply');
    if (apply) apply.onclick = () => {
        const f = $('#bhStart').value, t = $('#bhEnd').value;
        if (!f || !t) return;
        if (new Date(f) > new Date(t)) { alert('起始日期不能晚于结束日期'); return; }
        $('#bhRangePop').classList.remove('open');
        _bhState.range = 'custom';
        _bhState.from = f; _bhState.to = t;
        _bhRenderRangeBar();
        _bhRenderContent();
    };
    _bhRenderContent();
}
function _bhRenderRangeBar(){
    const bar = $('#bhRange'); if (!bar) return;
    bar.innerHTML = ['today','week','month','quarter','year','custom'].map(k => {
        const p = BH_RANGE_PRESETS[k];
        return `<button class="db-r ${_bhState.range===k?'active':''}" data-r="${k}">
            <span class="material-symbols-rounded" style="font-size:15px">${p.icon}</span>${p.label}
        </button>`;
    }).join('');
    $$('.db-r', bar).forEach(b => b.onclick = () => {
        const r = b.dataset.r;
        if (r === 'custom') {
            $('#bhRangePop').classList.toggle('open');
        } else {
            $('#bhRangePop').classList.remove('open');
            _bhState.range = r;
            _bhState.from = null; _bhState.to = null;
            _bhRenderRangeBar();
            _bhRenderContent();
        }
    });
    const lbl = $('#bhRangeLabel');
    if (lbl) lbl.innerHTML = `<span class="material-symbols-rounded">data_usage</span>当前范围：<strong>${_bhScale().label}</strong>`;
}
function _bhRenderContent(){
    const wrap = $('#bhContent'); if (!wrap) return;
    const bids = MOCK_BIDS;
    const sc = _bhScale();
    const won = bids.filter(b => b.stage === '已中标');
    const reg = bids.filter(b => ['已报名','已开标','已中标','未中标'].includes(b.stage));
    const winrate = (won.length / Math.max(reg.length,1) * 100).toFixed(1);
    // 流量类按倍数缩放，比率/胜率不变
    const scaledReg = _bhVal(reg.length);
    const scaledWon = _bhVal(won.length);
    const total = _bhVal(won.reduce((s,b) => s + parseFloat(b.amount), 0)).toLocaleString('en-US');
    wrap.innerHTML = `
        ${statRow([
            { l:`${sc.shortLabel}报名`, v: scaledReg, c:'p', t:'<span class="delta">↑ 12.5%</span><span>较上期</span>' },
            { l:`${sc.shortLabel}中标`, v: scaledWon, c:'s', t:'<span class="delta">↑ 8.0%</span><span>较上期</span>' },
            { l:'中标率',   v: winrate, unit:'%', c:'w', t:'<span class="delta d">↓ 2.1%</span><span>近6月平均</span>' },
            { l:`${sc.shortLabel}中标金额（万）`, v: total, c:'d', t:'<span class="delta">↑ 15.3%</span><span>较上期</span>' }
        ])}
        <div style="display:grid;grid-template-columns:2fr 1fr;gap:16px;margin-bottom:16px">
            <div class="card">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
                    <h3 style="margin:0;font-size:15px;font-weight:600">趋势 · 报名 vs 中标（${sc.label}）</h3>
                    <span style="font-size:11.5px;color:var(--text-3)">按所选范围动态加载</span>
                </div>
                <svg viewBox="0 0 600 220" style="width:100%;height:220px">
                    <defs><linearGradient id="bidGrad" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="#60A5FA" stop-opacity="0.6"/><stop offset="100%" stop-color="#93C5FD" stop-opacity="0"/></linearGradient></defs>
                    ${(()=>{
                        const months=['12月','1月','2月','3月','4月','5月'];
                        const m = sc.mult;
                        const rgs=[18,16,28,24,32,22].map(v=>Math.max(1, Math.round(v*m)));
                        const wn=[7,5,12,9,14,8].map(v=>Math.max(1, Math.round(v*m)));
                        const w=600,h=220,pad=30;
                        const max=Math.max(...rgs)*1.1;
                        const x=i => pad + i*(w-2*pad)/(months.length-1);
                        const y=v => h-pad - v*(h-2*pad)/max;
                        let svg='';
                        for(let i=0;i<5;i++){const yy=pad+i*(h-2*pad)/4; svg += `<line x1="${pad}" x2="${w-pad}" y1="${yy}" y2="${yy}" stroke="rgba(0,0,0,0.06)"/>`;}
                        rgs.forEach((v,i)=> svg += `<rect x="${x(i)-14}" y="${y(v)}" width="28" height="${h-pad-y(v)}" fill="url(#bidGrad)" rx="6"/>`);
                        const path = wn.map((v,i)=> `${i?'L':'M'} ${x(i)} ${y(v)}`).join(' ');
                        svg += `<path d="${path}" stroke="#10B981" stroke-width="3" fill="none"/>`;
                        wn.forEach((v,i)=> svg += `<circle cx="${x(i)}" cy="${y(v)}" r="5" fill="#fff" stroke="#10B981" stroke-width="2.5"/>`);
                        months.forEach((mm,i)=> svg += `<text x="${x(i)}" y="${h-8}" text-anchor="middle" font-size="11" fill="rgba(0,0,0,0.5)">${mm}</text>`);
                        return svg;
                    })()}
                </svg>
                <div style="display:flex;gap:18px;justify-content:center;margin-top:8px;font-size:12px;color:var(--text-2)">
                    <span style="display:inline-flex;align-items:center;gap:6px"><span style="width:14px;height:14px;background:linear-gradient(180deg,var(--primary),var(--accent));border-radius:3px"></span>报名数</span>
                    <span style="display:inline-flex;align-items:center;gap:6px"><span style="width:14px;height:3px;background:var(--emerald);border-radius:99px"></span>中标数</span>
                </div>
            </div>
            <div class="card">
                <h3 style="margin:0 0 14px;font-size:15px;font-weight:600">行业分布</h3>
                <div style="display:flex;justify-content:center;margin-bottom:14px">
                    <div style="width:140px;height:140px;border-radius:50%;background:conic-gradient(var(--primary) 0 35%, var(--emerald) 35% 60%, var(--amber) 60% 78%, var(--sky) 78% 92%, var(--accent) 92% 100%);box-shadow:0 12px 30px rgba(96,165,250,0.30);position:relative">
                        <div style="position:absolute;inset:24px;background:var(--glass-bg-3);backdrop-filter:blur(10px);border-radius:50%;display:grid;place-items:center;border:1px solid var(--glass-border)"><div style="text-align:center"><div style="font-size:20px;font-weight:700">${scaledReg}</div><div style="font-size:10px;color:var(--text-3);text-transform:uppercase">总数</div></div></div>
                    </div>
                </div>
                ${[['政务','35%','var(--primary)'],['交通','25%','var(--emerald)'],['医疗','18%','var(--amber)'],['工业','14%','var(--sky)'],['其它','8%','var(--accent)']].map(([n,v,col])=>`
                    <div class="row"><span style="width:10px;height:10px;border-radius:3px;background:${col}"></span><span class="lbl">${n}</span><span class="v">${v}</span></div>`).join('')}
            </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px">
            <div class="card">
                <h3 style="margin:0 0 14px;font-size:15px;font-weight:600">阶段漏斗</h3>
                ${(()=>{
                    const stages = ['待报名','已报名','已开标','已中标'];
                    const counts = stages.map(s => _bhVal(bids.filter(b => b.stage === s).length));
                    const max = Math.max(...counts);
                    return stages.map((s,i) => `
                        <div style="display:grid;grid-template-columns:80px 1fr 50px;gap:12px;align-items:center;padding:8px 0">
                            <span style="font-size:12.5px;color:var(--text-2)">${s}</span>
                            <div style="height:24px;background:var(--glass-bg-2);border-radius:12px;overflow:hidden;border:1px solid var(--glass-border)"><div style="height:100%;width:${counts[i]/max*100}%;background:linear-gradient(90deg,var(--primary),var(--accent));display:flex;align-items:center;padding-left:10px;color:#fff;font-size:11.5px;font-weight:700">${counts[i]}</div></div>
                            <span style="color:var(--text-3);font-size:11.5px;text-align:right">${(counts[i]/(_bhVal(bids.length)||1)*100).toFixed(1)}%</span>
                        </div>`).join('');
                })()}
            </div>
            <div class="card">
                <h3 style="margin:0 0 14px;font-size:15px;font-weight:600">商务排行 · TOP 8</h3>
                ${['李明','张华','王芳','赵磊','陈静','吴强','刘洋','周婷'].map((n,i) => `
                    <div style="display:grid;grid-template-columns:36px 70px 1fr 70px;gap:12px;align-items:center;padding:7px 0;border-bottom:1px dashed var(--glass-border)">
                        <span class="chip ${i<3?'p':''}">#${i+1}</span>
                        <span style="font-weight:500">${n}</span>
                        <div class="bar"><i style="width:${95-i*10}%"></i></div>
                        <span style="color:var(--text-2);font-weight:500;font-size:11.5px">${_bhVal(15-i)}/${_bhVal(10-Math.floor(i/2))}</span>
                    </div>`).join('')}
            </div>
        </div>`;
}

// ============ 招投标：投标历史 ============
window._bhistState = Object.assign({}, defaultYearRange());
function renderBiddingHistory(){
    const pg = $('#pages');
    const today = new Date().toISOString().slice(0,10);
    // 需求1301-3.3：数据列表不出现"已报名"数据
    let past = filterByRole(MOCK_BIDS.filter(b => (b.opentime || '').slice(0,10) < today && (b.projectStatus||b.stage) !== '已报名'), ['owner']);
    if (_bhistState.from) past = past.filter(b => (b.opentime||'').slice(0,10) >= _bhistState.from);
    if (_bhistState.to)   past = past.filter(b => (b.opentime||'').slice(0,10) <= _bhistState.to);
    past.sort((a,b) => (b.opentime||'').localeCompare(a.opentime||''));
    const stat = (s) => past.filter(b => (b.projectStatus||b.stage) === s).length;
    const bidCnt = past.length;
    const wonCnt = stat('已中标');
    const lostCnt = stat('未中标');
    // 需求1301-3.2：第四张卡仅"废标" — 仅统计进站时废标数量（流标），删除"已弃/流标"副文
    const abanCnt = stat('流标') + stat('废标');
    // 需求1301-3.1：统计卡说明数据时间范围
    const rangeText = _bhistState.from || _bhistState.to
        ? `${_bhistState.from||'起始'} ~ ${_bhistState.to||today}`
        : `截至 ${today}`;
    // 需求1301-3.4：隐藏项目编号；3.5：父子行展开
    const cols = [
        { key:'name',     label:'项目名称', expandCol:true, render: b=>b.name,
          lotRender: (lot) => lot.name },
        { key:'party',    label:'甲方名称', w:'180px', render: b=>`<span class="cell-mute">${b.party || b.source || '—'}</span>`,
          lotRender: () => `<span class="cell-mute">—</span>` },
        { key:'amount',   label:'项目金额(万)', w:'115px', align:'right', render: b=>`<span class="cell-amount">¥${(+b.amount).toLocaleString('zh-CN')}</span>`,
          lotRender: (lot) => `<span class="cell-amount">¥${(+lot.amount).toLocaleString('zh-CN')}</span>` },
        { key:'opentime', label:'开标时间', w:'160px', render: b=>`<span class="cell-mute">${b.opentime}</span>`,
          lotRender: (lot) => `<span class="cell-mute">${lot.opentime}</span>` },
        { key:'owner',    label:'报名负责人', w:'100px', render: b=>b.owner,
          lotRender: (lot) => lot.owner },
        { key:'projectStatus', label:'项目现状', w:'100px', render: b=>{
            const c = b.projectStatusColor || b.stageColor || '#6B7280';
            const s = b.projectStatus || b.stage || '—';
            return `<span class="chip" style="background:${c}28;color:${c};border-color:${c}40">${s}</span>`;
        }, lotRender: () => `` },
        { key:'region',   label:'区域',     w:'90px',  render: b=>`<span class="cell-mute">${b.region || '总公司'}</span>`,
          lotRender: () => `` },
        { key:'_act',     label:'操作',     w:'130px', render: b=>`<span class="row-acts"><button class="btn-icon" title="查看详情" onclick="openModal('投标历史详情 · ${b.id}', biddingDetailModal('${b.id}'))"><span class="material-symbols-rounded">visibility</span></button><button class="btn-icon" title="编辑" onclick="openModal('编辑投标历史 · ${b.id}', biddingFormModal('${b.id}'),{width:'1080px',height:'780px'})"><span class="material-symbols-rounded">edit</span></button><button class="btn-icon" title="导出"><span class="material-symbols-rounded">file_download</span></button></span>`,
          lotRender: () => `` }
    ];
    const dateFilter = `
        <div class="ipt date-filter" style="gap:6px">
            <span class="material-symbols-rounded" style="font-size:16px;color:var(--text-3)">event</span>
            <input type="date" id="bhistFrom" value="${_bhistState.from||''}" style="border:none;background:transparent;font:inherit;color:var(--text-1);width:130px"/>
            <span style="color:var(--text-3)">~</span>
            <input type="date" id="bhistTo"   value="${_bhistState.to  ||''}" style="border:none;background:transparent;font:inherit;color:var(--text-1);width:130px"/>
            <button class="btn-icon" id="bhistClear" title="清空时间"><span class="material-symbols-rounded" style="font-size:15px">close</span></button>
        </div>`;
    pg.innerHTML = `
        ${pageHeader('投标历史', `共 ${past.length} 条 · 已过开标时间项目`, `
            <button class="btn"><span class="material-symbols-rounded" style="font-size:16px">filter_alt</span>筛选</button>
            <button class="btn"><span class="material-symbols-rounded" style="font-size:16px">file_download</span>导出</button>`)}
        <div class="stat-range-hint"><span class="material-symbols-rounded" style="font-size:14px">event_note</span>统计数据时间范围：<b>${rangeText}</b></div>
        ${statRow([
            { l:'投标',    v: bidCnt,  c:'p', t:'<span class="delta">投标总数</span>' },
            { l:'已中标',  v: wonCnt,  c:'s', t:'<span class="delta">中标项目</span>' },
            { l:'未中标',  v: lostCnt, c:'w', t:'<span class="delta d">未中标</span>' },
            { l:'废标',    v: abanCnt, c:'d', t:'<span class="delta d">进站时废标</span>' }
        ])}
        ${toolbar({
            filters:[
                { value:'all',  label:'全部',   active:true, count: past.length },
                { value:'won',  label:'已中标', count: stat('已中标') },
                { value:'lost', label:'未中标', count: stat('未中标') },
                { value:'aban', label:'废标',   count: abanCnt }
            ],
            searchPh:'搜索项目 / 编号 / 甲方…',
            right: dateFilter
        })}
        ${tableShell(cols, 'bidHistBody')}`;
    InfiniteList.bind({ source: past, pageSize: 14, container:'bidHistBody', render: tableRowExpandable(cols) });
    const fromIp = $('#bhistFrom'), toIp = $('#bhistTo'), clr = $('#bhistClear');
    if (fromIp) fromIp.onchange = () => { _bhistState.from = fromIp.value || null; renderBiddingHistory(); };
    if (toIp)   toIp.onchange   = () => { _bhistState.to   = toIp.value   || null; renderBiddingHistory(); };
    if (clr)    clr.onclick     = () => { _bhistState.from = null; _bhistState.to = null; renderBiddingHistory(); };
}

// ============ 招投标：信息列表 ============
window._biState = Object.assign({}, defaultYearRange());
function renderBiddingInfo(){
    const pg = $('#pages');
    // 仅展示"已报名"状态
    let bids = filterByRole(MOCK_BIDS.filter(b => (b.projectStatus||b.stage) === '已报名'), ['owner']);
    if (_biState.from) bids = bids.filter(b => (b.opentime||'').slice(0,10) >= _biState.from);
    if (_biState.to)   bids = bids.filter(b => (b.opentime||'').slice(0,10) <= _biState.to);
    // 需求1301-2.2/2.4：隐藏 项目编号 与 项目现状 字段
    // 需求1301-2.3：父子行展开式 — 项目名称作为展开列；标段独立金额/开标时间/负责人
    const cols = [
        { key:'name',     label:'项目名称', expandCol:true,            render: b=>b.name,
          lotRender: (lot) => lot.name },
        { key:'projState',label:'项目状态', w:'95px',  render: b=>`<span class="chip ${b.projState==='正式公告'?'p':b.projState==='意向'?'w':'a'}">${b.projState}</span>`,
          lotRender: () => `<span class="cell-mute" style="font-size:11px">—</span>` },
        { key:'party',    label:'甲方名称', w:'170px', render: b=>`<span class="cell-mute">${b.party || '—'}</span>`,
          lotRender: () => `<span class="cell-mute">—</span>` },
        // 需求060101-一.1：删除"报名方式"字段
        { key:'bidType',  label:'投标类型', w:'80px',  render: b=>`<span class="chip ${b.bidType==='民标'?'p':'w'}" style="font-size:11px">${b.bidType}</span>`,
          lotRender: () => `` },
        { key:'amount',   label:'项目金额(万)', w:'115px', align:'right', render: b=>`<span class="cell-amount">¥${(+b.amount).toLocaleString('zh-CN')}</span>`,
          lotRender: (lot) => `<span class="cell-amount">¥${(+lot.amount).toLocaleString('zh-CN')}</span>` },
        { key:'opentime', label:'开标时间', w:'160px', render: b=>`<span class="cell-mute">${b.opentime}</span>`,
          lotRender: (lot) => `<span class="cell-mute">${lot.opentime}</span>` },
        { key:'owner',    label:'报名负责人', w:'100px', render: b=>b.owner,
          lotRender: (lot) => lot.owner },
        { key:'region',   label:'区域',     w:'80px',  render: b=>`<span class="cell-mute">${b.region || '总公司'}</span>`,
          lotRender: () => `` },
        { key:'notice',   label:'招标公告', w:'100px', render: b=>b.notice ? `<a class="cell-link" title="${b.notice}"><span class="material-symbols-rounded" style="font-size:14px;vertical-align:-2px">attach_file</span> 已上传</a>` : '<span class="cell-mute">—</span>',
          lotRender: () => `` },
        { key:'_act',     label:'操作',     w:'130px', render: b=>`<span class="row-acts"><button class="btn-icon" title="详情" onclick="openModal('招投标详情 · ${b.id}', biddingDetailModal('${b.id}'))"><span class="material-symbols-rounded">visibility</span></button><button class="btn-icon" title="编辑" onclick="openModal('编辑招投标 · ${b.id}', biddingFormModal('${b.id}'),{width:'920px',height:'720px'})"><span class="material-symbols-rounded">edit</span></button><button class="btn-icon btn-abandon" title="弃标" onclick="abandonBid('${b.id}')"><span class="material-symbols-rounded">block</span></button></span>`,
          lotRender: () => `` }
    ];
    const dateFilter = `
        <div class="ipt date-filter" style="gap:6px">
            <span class="material-symbols-rounded" style="font-size:16px;color:var(--text-3)">event</span>
            <input type="date" id="biFrom" value="${_biState.from||''}" style="border:none;background:transparent;font:inherit;color:var(--text-1);width:130px"/>
            <span style="color:var(--text-3)">~</span>
            <input type="date" id="biTo"   value="${_biState.to  ||''}" style="border:none;background:transparent;font:inherit;color:var(--text-1);width:130px"/>
            <button class="btn-icon" id="biClear" title="清空时间"><span class="material-symbols-rounded" style="font-size:15px">close</span></button>
        </div>`;
    pg.innerHTML = `
        ${pageHeader('投标报名信息', `共 ${bids.length} 条 · 仅展示已报名 · 按开标日期倒序`, `
            <button class="btn" id="btnBiCalendar"><span class="material-symbols-rounded" style="font-size:16px">calendar_month</span>招投标看板</button>
            <button class="btn"><span class="material-symbols-rounded" style="font-size:16px">filter_alt</span>筛选</button>
            <button class="btn"><span class="material-symbols-rounded" style="font-size:16px">file_download</span>导出</button>
            <button class="btn primary" onclick="openModal('新增招投标',biddingFormModal(),{width:'920px',height:'720px'})"><span class="material-symbols-rounded" style="font-size:16px">add</span>新增</button>`)}
        ${toolbar({
            filters:[
                { value:'reg',  label:tt('已报名'), active:true, count: bids.length }
            ],
            searchPh:'搜索项目 / 编号 / 甲方…',
            right: dateFilter
        })}
        ${tableShell(cols, 'bidBody')}`;
    InfiniteList.bind({ source: bids, pageSize: 14, container:'bidBody', render: tableRowExpandable(cols) });
    const fromIp = $('#biFrom'), toIp = $('#biTo'), clr = $('#biClear');
    if (fromIp) fromIp.onchange = () => { _biState.from = fromIp.value || null; renderBiddingInfo(); };
    if (toIp)   toIp.onchange   = () => { _biState.to   = toIp.value   || null; renderBiddingInfo(); };
    if (clr)    clr.onclick     = () => { _biState.from = null; _biState.to = null; renderBiddingInfo(); };
    const calBtn = $('#btnBiCalendar');
    if (calBtn) calBtn.onclick = () => openBiddingCalendar();
}

// 招投标看板：日历视图（按图 2 设计）
// 需求060101-一.2：默认选中今日 / 右侧侧边栏 / 点击日期切换
window._biCalState = (function(){
    const now = new Date();
    const todayKey = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
    return {
        year: now.getFullYear(),
        month: now.getMonth() + 1,
        filters: new Set(['noPay','paid','hist','f3','f46','f7','aban','won']),
        selectedDate: todayKey,
        sideCollapsed: false
    };
})();
function openBiddingCalendar(){
    const st = _biCalState;
    openModal('招投标看板', _biCalContent(), { width:'92vw', height:'88vh', onOpen: () => _biCalBind() });
}
function _biCalContent(){
    const st = _biCalState;
    const monthLabel = `${st.year}年${String(st.month).padStart(2,'0')}月${String(new Date().getDate()).padStart(2,'0')}日`;
    const filterChips = [
        { k:'noPay', l:'未缴纳保证金项目', color:'#fff', border:'1px solid var(--glass-border)' },
        { k:'paid',  l:'已缴纳保证金项目', color:'#fff', border:'1px solid var(--glass-border)' },
        { k:'hist',  l:'历史',             color:'#4F46E5' },
        { k:'f3',    l:'未来3日',          color:'#DC2626' },
        { k:'f46',   l:'未来4-6日',        color:'#F59E0B' },
        { k:'f7',    l:'未来7日及以上',    color:'#10B981' },
        { k:'aban',  l:'已弃标',           color:'#9CA3AF' },
        { k:'won',   l:'已中标',           color:'#16A34A' }
    ];
    const grid = _biCalGrid();
    return `
    <div class="bi-cal">
        <div class="bi-cal-head">
            <div class="bi-cal-month">
                <span class="bi-cal-m-text">${monthLabel}</span>
                <button class="bi-cal-nav" data-d="-1" title="上个月"><span class="material-symbols-rounded">expand_less</span></button>
                <button class="bi-cal-nav" data-d="1"  title="下个月"><span class="material-symbols-rounded">expand_more</span></button>
            </div>
            <div class="bi-cal-filters">
                ${filterChips.map(c => {
                    const checked = st.filters.has(c.k);
                    if (c.k === 'noPay' || c.k === 'paid') {
                        return `<label class="bi-cal-chip" data-k="${c.k}"><input type="checkbox" ${checked?'checked':''}/><span>${c.l}</span></label>`;
                    }
                    return `<label class="bi-cal-chip dot" data-k="${c.k}"><span class="bi-cal-dot" style="background:${c.color}"></span><span>${c.l}</span></label>`;
                }).join('')}
            </div>
        </div>
        <div class="bi-cal-main">
            <div class="bi-cal-body">
                <div class="bi-cal-week">
                    ${['日','一','二','三','四','五','六'].map(w => `<div class="bi-cal-w">${w}</div>`).join('')}
                </div>
                <div class="bi-cal-grid">${grid}</div>
            </div>
            <div class="bi-cal-side" data-collapsed="${st.sideCollapsed?'true':'false'}">
                ${_biCalSide(st.selectedDate)}
            </div>
        </div>
    </div>`;
}
// 当日详情侧边栏内容
function _biCalSide(dateKey){
    if (!dateKey) return '';
    const dt = new Date(dateKey + 'T00:00:00');
    const weekNames = ['星期日','星期一','星期二','星期三','星期四','星期五','星期六'];
    const headTxt = `${dt.getFullYear()}年${String(dt.getMonth()+1).padStart(2,'0')}月${String(dt.getDate()).padStart(2,'0')}日 ${weekNames[dt.getDay()]}`;
    // 同一日所有开标项目（含已报名、已开标等）
    const dayBids = (window.MOCK_BIDS || []).filter(b => {
        const d = (b.opentime || '').slice(0,10);
        return d === dateKey;
    });
    let bodyHtml;
    if (!dayBids.length) {
        bodyHtml = `<div class="bi-cal-side-empty">
            <span class="material-symbols-rounded">event_busy</span>
            <span>今日无招投标相关事项</span>
        </div>`;
    } else {
        bodyHtml = dayBids.map(b => {
            const lotNames = (b.lots && b.lots.length) ? b.lots.map(l => l.name).join('、') : (b.name || '—');
            // 派生 开标地点：基于 region + 固定地点列表
            const locArr = ['公共资源交易中心 3F','招投标中心 2号会议室','财务大厦 8F 多功能厅','科技园 A栋 5F','政务服务中心 1F'];
            const locIdx = Math.abs(parseInt(String(b.id||'0').replace(/\D/g,'').slice(-2)||'0')) % locArr.length;
            const openLoc = `${b.region||'总公司'} · ${locArr[locIdx]}`;
            return `<div class="bi-cal-side-item">
                <div class="t">${b.name||'—'}</div>
                <div class="f"><b>标段</b><span>${lotNames}</span></div>
                <div class="f"><b>业主名称</b><span>${b.party||'—'}</span></div>
                <div class="f"><b>开标地点</b><span>${openLoc}</span></div>
                <div class="acts">
                    <button class="btn primary bi-cal-side-detail" data-bid="${b.id}">
                        <span class="material-symbols-rounded" style="font-size:14px">visibility</span>查看详情
                    </button>
                </div>
            </div>`;
        }).join('');
    }
    return `
        <div class="bi-cal-side-head">
            <span class="material-symbols-rounded">today</span>
            <span>${headTxt}</span>
        </div>
        <div class="bi-cal-side-body">${bodyHtml}</div>
    `;
}
function _biCalGrid(){
    const st = _biCalState;
    const firstDay = new Date(st.year, st.month - 1, 1);
    const startCol = firstDay.getDay();
    const totalDays = new Date(st.year, st.month, 0).getDate();
    const today = new Date();
    const todayKey = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
    // 从招投标数据中提取已报名项目，按开标日期分组到日期
    const evMap = {};
    MOCK_BIDS.filter(b => (b.projectStatus||b.stage) === '已报名').forEach(b => {
        const d = (b.opentime || '').slice(0,10);
        if (!d) return;
        const dt = new Date(d);
        if (dt.getFullYear() !== st.year || (dt.getMonth()+1) !== st.month) return;
        if (!evMap[d]) evMap[d] = [];
        evMap[d].push(b);
    });
    // 渲染前一月尾、当月、下月头
    const cells = [];
    const prevMonthDays = new Date(st.year, st.month - 1, 0).getDate();
    for (let i = startCol - 1; i >= 0; i--) {
        const day = prevMonthDays - i;
        const prevM = st.month === 1 ? 12 : st.month - 1;
        const prevY = st.month === 1 ? st.year - 1 : st.year;
        const k = `${prevY}-${String(prevM).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
        cells.push({ key:k, day, dim:true });
    }
    for (let d = 1; d <= totalDays; d++) {
        const k = `${st.year}-${String(st.month).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        cells.push({ key:k, day:d, dim:false, isToday:k===todayKey });
    }
    while (cells.length % 7 !== 0) {
        const last = cells[cells.length-1];
        const lastDt = new Date(last.key);
        lastDt.setDate(lastDt.getDate()+1);
        const ny = lastDt.getFullYear(), nm = lastDt.getMonth()+1, nd = lastDt.getDate();
        const k = `${ny}-${String(nm).padStart(2,'0')}-${String(nd).padStart(2,'0')}`;
        cells.push({ key:k, day:nd, dim:true });
    }
    return cells.map(c => {
        const evs = evMap[c.key] || [];
        const eventChips = evs.slice(0,3).map(e => {
            // 颜色按时间距离
            const dt = new Date(c.key);
            const days = Math.round((dt - today) / 86400000);
            let color = '#4F46E5'; // 历史(默认 蓝紫)
            if (days < 0) color = '#4F46E5';            // 历史
            else if (days <= 3) color = '#DC2626';      // 未来3日
            else if (days <= 6) color = '#F59E0B';      // 未来4-6日
            else color = '#10B981';                     // 未来7日及以上
            if ((e.projectStatus||e.stage) === '已中标') color = '#16A34A';
            if ((e.projectStatus||e.stage) === '已弃标') color = '#9CA3AF';
            const short = (e.name||'').length > 6 ? (e.name||'').slice(0,6)+'…' : (e.name||'');
            return `<div class="bi-cal-ev" style="background:${color}" title="${e.name||''} · ¥${e.amount||''}万">${short || '投标'}</div>`;
        }).join('');
        const more = evs.length > 3 ? `<div class="bi-cal-more">+${evs.length-3}</div>` : '';
        const isSel = !st.sideCollapsed && (c.key === st.selectedDate);
        return `<div class="bi-cal-cell${c.dim?' dim':''}${c.isToday?' today':''}${isSel?' selected':''}" data-date="${c.key}">
            <div class="bi-cal-date">${c.key}</div>
            <div class="bi-cal-events">${eventChips}${more}</div>
        </div>`;
    }).join('');
}
function _biCalBind(){
    $$('.bi-cal-nav').forEach(btn => btn.onclick = () => {
        const d = parseInt(btn.dataset.d);
        _biCalState.month += d;
        if (_biCalState.month < 1) { _biCalState.month = 12; _biCalState.year--; }
        if (_biCalState.month > 12) { _biCalState.month = 1; _biCalState.year++; }
        $('#modalBody').innerHTML = _biCalContent();
        _biCalBind();
    });
    $$('.bi-cal-chip').forEach(chip => chip.onclick = (e) => {
        if (e.target.tagName === 'INPUT') return;
        const k = chip.dataset.k;
        if (_biCalState.filters.has(k)) _biCalState.filters.delete(k);
        else _biCalState.filters.add(k);
        chip.classList.toggle('off', !_biCalState.filters.has(k));
    });
    // 需求060101-一.2：点击单元格刷新侧边栏 / 点击已选日期折叠 / 再次点击展开
    $$('.bi-cal-cell').forEach(cell => cell.onclick = () => {
        const d = cell.dataset.date;
        if (!d) return;
        if (d === _biCalState.selectedDate && !_biCalState.sideCollapsed) {
            _biCalState.sideCollapsed = true;
        } else {
            _biCalState.selectedDate = d;
            _biCalState.sideCollapsed = false;
        }
        // 刷新整个看板（包含单元格 selected 状态与侧边栏内容）
        const mb = $('#modalBody'); if (mb) { mb.innerHTML = _biCalContent(); _biCalBind(); }
    });
    // 侧边栏 - 查看详情
    $$('.bi-cal-side-detail').forEach(btn => btn.onclick = () => {
        const bid = btn.dataset.bid;
        if (bid && typeof window.biddingDetailModal === 'function') {
            openModal('招投标详情 · ' + bid, window.biddingDetailModal(bid));
        }
    });
}

// 新增 / 编辑招投标 弹窗（按需求 0903 表 1：13 个字段）
// 需求1301-2.3：新增/编辑招投标 — 支持多标段批量提交
window.biddingFormModal = function(id){
    const b = id ? MOCK_BIDS.find(x=>x.id===id) : null;
    const v = (k, def='') => (b && b[k] != null) ? String(b[k]).replace(/"/g,'&quot;') : def;
    const sel = (val, opts) => opts.map(o => `<option value="${o}"${o===val?' selected':''}>${o}</option>`).join('');
    // 需求2001-三.1：投标类型 / 报名方式 选中态使用淡蓝色（.bf-radio.on）
    const radio = (name, val, opts) => opts.map(o => `<label class="bf-radio${o===val?' on':''}"><input type="radio" name="${name}"${o===val?' checked':''}/><span>${o}</span></label>`).join('');
    const psList = [
        { s:'已中标', c:'#16A34A' }, { s:'已投标', c:'#CA8A04' },
        { s:'已弃标', c:'#9333EA' }, { s:'已报名', c:'#DC2626' },
        { s:'封标',   c:'#2563EB' }, { s:'流标',   c:'#6B7280' }
    ];
    const curPS = (b && b.projectStatus) || '已报名';
    const projName = v('name');
    const lots = (b && b.lots && b.lots.length) ? b.lots : [
        { name: projName ? projName + ' 1标段' : '', amount:'', opentime:'', owner:'', registType:'线上' }
    ];
    // 需求1901-四.3：报名方式 / 报名负责人 上移到项目级（标段卡只保留 标段金额 / 开标时间）
    const lotHtml = (lot, i) => `
        <div class="lot-card" data-lot-idx="${i}">
            <div class="lot-card-head">
                <span class="lot-card-tag">标段 ${i+1}</span>
                <input class="bf-ipt lot-name" placeholder="标段名称（默认 项目名 + N标段）" value="${(lot.name||'').replace(/"/g,'&quot;')}"/>
                <button class="btn-icon lot-del" title="删除该标段"${i===0?' style="visibility:hidden"':''}><span class="material-symbols-rounded">close</span></button>
            </div>
            <div class="bf-grid lot-grid">
                <div class="bf-cell"><label>标段金额（万元） <i>*</i></label>
                    <input class="bf-ipt" type="number" placeholder="0.00" value="${lot.amount||''}"/>
                </div>
                <div class="bf-cell"><label>开标时间 <i>*</i></label>
                    <input class="bf-ipt" type="datetime-local" value="${(lot.opentime||'').replace(' ','T')}"/>
                </div>
            </div>
        </div>`;
    return `
    <div class="bf-form">
        <div class="bf-section">项目信息</div>
        <div class="bf-grid">
            <div class="bf-cell"><label>项目编号 <i>*</i></label><input class="bf-ipt" placeholder="自动生成 / 手动填写" value="${v('id','BID' + new Date().getTime().toString().slice(-7))}"/></div>
            <div class="bf-cell"><label>项目状态 <i>*</i></label>
                <select class="bf-ipt">${sel(v('projState','正式公告'), ['正式公告','意向','公开意向'])}</select>
            </div>
            <div class="bf-cell bf-span-2"><label>项目名称 <i>*</i></label><input class="bf-ipt" id="bf-project-name" placeholder="请输入项目名称" value="${projName}"/></div>
            <div class="bf-cell bf-span-2"><label>甲方名称 <i>*</i></label><input class="bf-ipt" placeholder="请输入甲方/招标方名称" value="${v('party')}"/></div>
            <div class="bf-cell"><label>投标类型 <i>*</i></label>
                <div class="bf-radio-row">${radio('bidType', v('bidType','非民标'), ['非民标','民标'])}</div>
            </div>
            <div class="bf-cell"><label>报名方式 <i>*</i></label>
                <div class="bf-radio-row">${radio('registType', v('registType','线上'), ['线上','线下'])}</div>
            </div>
            <div class="bf-cell"><label>报名负责人 <i>*</i></label>
                <input class="bf-ipt" placeholder="姓名" value="${v('owner')}"/>
            </div>
            <!-- 需求2001-三.2：编辑面板也删除 项目现状 字段（新增已删） -->
            <div class="bf-cell"><label>区域选择 <i>*</i></label>
                <select class="bf-ipt">${sel(v('region','总公司'), ['总公司','分公司'])}</select>
            </div>
            <div class="bf-cell"><label>招标公告</label>
                <div class="bf-upload">
                    <span class="material-symbols-rounded" style="font-size:16px;color:var(--primary)">upload_file</span>
                    <span class="bf-upload-txt">${b && b.notice ? b.notice : '点击或拖拽上传 (PDF / Word / 图片)'}</span>
                    <button class="btn" style="padding:4px 10px;font-size:11.5px">浏览…</button>
                </div>
            </div>
            <div class="bf-cell bf-span-2"><label>备注</label>
                <textarea class="bf-ipt" rows="3" placeholder="补充说明…">${v('note')}</textarea>
            </div>
        </div>

        <div class="bf-section">
            <span>标段列表</span>
            <button class="btn primary lot-add-btn" id="bf-lot-add" style="margin-left:auto;padding:4px 12px;font-size:12px"><span class="material-symbols-rounded" style="font-size:14px">add</span>新增标段</button>
        </div>
        <div class="lot-list" id="bf-lot-list">${lots.map(lotHtml).join('')}</div>

        <div class="bf-foot">
            <button class="btn" onclick="closeModal()">取消</button>
            <button class="btn primary" onclick="closeModal()"><span class="material-symbols-rounded" style="font-size:16px">save</span>批量保存</button>
        </div>
    </div>`;
};
// 弹窗内：新增标段 / 删除标段 / 项目名同步
document.addEventListener('click', function(e){
    if (e.target.closest && e.target.closest('#bf-lot-add')) {
        e.preventDefault();
        const list = document.getElementById('bf-lot-list'); if (!list) return;
        const i = list.querySelectorAll('.lot-card').length;
        const pName = (document.getElementById('bf-project-name')||{}).value || '';
        const div = document.createElement('div');
        div.innerHTML = `
        <div class="lot-card" data-lot-idx="${i}">
            <div class="lot-card-head">
                <span class="lot-card-tag">标段 ${i+1}</span>
                <input class="bf-ipt lot-name" placeholder="标段名称" value="${pName ? pName + ' ' + (i+1) + '标段' : ''}"/>
                <button class="btn-icon lot-del" title="删除该标段"><span class="material-symbols-rounded">close</span></button>
            </div>
            <div class="bf-grid lot-grid">
                <div class="bf-cell"><label>标段金额（万元） <i>*</i></label><input class="bf-ipt" type="number" placeholder="0.00"/></div>
                <div class="bf-cell"><label>开标时间 <i>*</i></label><input class="bf-ipt" type="datetime-local"/></div>
            </div>
        </div>`;
        list.appendChild(div.firstElementChild);
        return;
    }
    const del = e.target.closest && e.target.closest('.lot-del');
    if (del) {
        const card = del.closest('.lot-card');
        const list = card && card.parentElement;
        if (card && list && list.querySelectorAll('.lot-card').length > 1) {
            card.remove();
            // 重排标段序号 + 重命名"标段 N"
            list.querySelectorAll('.lot-card').forEach((c, idx) => {
                c.dataset.lotIdx = idx;
                const tag = c.querySelector('.lot-card-tag'); if (tag) tag.textContent = '标段 ' + (idx+1);
            });
        }
    }
});
document.addEventListener('input', function(e){
    if (e.target && e.target.id === 'bf-project-name') {
        const pName = e.target.value || '';
        document.querySelectorAll('.lot-card').forEach((card, idx) => {
            const nameInput = card.querySelector('.lot-name');
            if (nameInput && (!nameInput.dataset.touched)) {
                nameInput.value = pName ? pName + ' ' + (idx+1) + '标段' : '';
            }
        });
    }
    if (e.target && e.target.classList && e.target.classList.contains('lot-name')) {
        e.target.dataset.touched = '1';
    }
});

// 招投标详情弹窗内容
window.biddingDetailModal = function(id){
    const b = MOCK_BIDS.find(x => x.id === id); if (!b) return '<div>未找到</div>';
    // 需求1901-四.2：项目节点（必须严格按以下顺序、名称，不允许新增/修改/调换）
    const baseDay = new Date(b.opentime || '2026-05-01'); baseDay.setHours(0,0,0,0);
    const addDays = (d, n) => { const t = new Date(d); t.setDate(t.getDate()+n); return t.toISOString().slice(0,10); };
    const stageRank = { '已报名':0, '封标':1, '已投标':2, '已中标':3, '已弃标':-1, '流标':-1, '废标':-1 };
    const rank = stageRank[b.projectStatus||b.stage] != null ? stageRank[b.projectStatus||b.stage] : 0;
    // 节点完成状态：rank 越高代表流程推进越远
    // 已中标 → 项目创建段开始进入；未中标 → 节点全部未达成
    const isWon = (b.projectStatus||b.stage) === '已中标';
    const nodeGroups = [
        { title:'项目创建', date: isWon ? addDays(baseDay, 5)  : '', steps:['中标通知书上传','立项审批通过'] },
        { title:'合同签订', date: isWon ? addDays(baseDay, 18) : '', steps:['合同原件归档'] },
        { title:'项目开工', date: isWon ? addDays(baseDay, 25) : '', steps:[] },
        { title:'项目完工', date: '', steps:[] },
        { title:'项目结项', date: '', steps:['完工自检','甲方验收','项目正式结项'] },
        { title:'合同完成', date: '', steps:['尾款到账','合同正式终止'] },
        { title:'合同外',   date: '', steps:['合同变更申请','合同外款项到账'] }
    ];
    // 已中标项目：前 3 节点视为已完成；其余依赖业务驱动
    nodeGroups.forEach((g, i) => {
        if (isWon && i < 3) g.state = 'done';
        else if (isWon && i === 3) g.state = 'doing';
        else g.state = 'todo';
    });
    const stIcon = (s) => s === 'done' ? 'check' : (s === 'doing' ? 'pending' : 'remove');
    const stText = (s) => s === 'done' ? '已完成' : (s === 'doing' ? '进行中' : '未开始');
    const tlHtml = nodeGroups.map(g => `
        <div class="node-tl-item ${g.state}">
            <div class="node-tl-dot"><span class="material-symbols-rounded" style="font-size:14px">${stIcon(g.state)}</span></div>
            <div class="node-tl-body">
                <div class="node-tl-title">${g.title}<span class="node-st">${stText(g.state)}</span></div>
                <div class="node-tl-meta">
                    ${g.date ? `<span><b>完成日期</b> ${g.date}</span>` : `<span style="color:var(--text-3)">待办</span>`}
                </div>
                ${g.steps.length ? `<div class="node-tl-steps">${g.steps.map(s => `<span class="node-tl-step ${g.state==='done'?'s':(g.state==='doing'?'p':'')}"><span class="material-symbols-rounded" style="font-size:13px;vertical-align:-2px">${g.state==='done'?'check_circle':'radio_button_unchecked'}</span>${s}</span>`).join('')}</div>` : ''}
            </div>
        </div>`).join('');
    return `
        <div style="display:flex;align-items:center;gap:14px;margin-bottom:18px">
            <div style="width:48px;height:48px;border-radius:14px;background:linear-gradient(135deg,${b.stageColor},${b.stageColor}AA);display:grid;place-items:center;color:#fff"><span class="material-symbols-rounded" style="font-size:22px">gavel</span></div>
            <div style="flex:1"><div style="font-size:18px;font-weight:700;letter-spacing:-0.01em">${b.name}</div><div style="font-size:12px;color:var(--text-3)">${b.id} · ${b.source}</div></div>
            <span class="chip" style="background:${b.stageColor}28;color:${b.stageColor};border-color:${b.stageColor}40">${b.stage}</span>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px 20px;font-size:13px">
            <div><div style="color:var(--text-3);font-size:11px">投标金额</div><div style="font-weight:700;font-size:16px;margin-top:2px">¥${b.amount} 万</div></div>
            <div><div style="color:var(--text-3);font-size:11px">开标时间</div><div style="font-weight:600;margin-top:2px">${b.opentime}</div></div>
            <div><div style="color:var(--text-3);font-size:11px">负责人</div><div style="margin-top:2px">${b.owner}</div></div>
            <div><div style="color:var(--text-3);font-size:11px">意向程度</div><div style="margin-top:2px">${b.intent}</div></div>
            <div style="grid-column:span 2"><div style="color:var(--text-3);font-size:11px">招标平台</div><div style="margin-top:2px">${b.source}</div></div>
        </div>
        <div style="margin-top:18px;padding-top:14px;border-top:1px solid var(--glass-border)">
            <h4 style="margin:0 0 12px;font-size:13px;font-weight:600;display:flex;align-items:center;gap:6px"><span class="material-symbols-rounded" style="font-size:16px;color:var(--primary)">timeline</span>项目节点</h4>
            <div class="node-timeline">${tlHtml}</div>
        </div>
    `;
};

// 需求1901-四.4：弃标 — 数据移到投标历史（更改项目现状为已弃标）
window.abandonBid = function(id){
    const b = MOCK_BIDS.find(x => x.id === id); if (!b) return;
    if (!confirm('确认弃标该项目？\n该项目将从"投标报名信息"移除并归档到"投标历史"。')) return;
    b.projectStatus = '已弃标';
    b.stage = '已弃标';
    b.projectStatusColor = '#9333EA';
    b.stageColor = '#9333EA';
    // 重渲染列表
    if (typeof renderBiddingInfo === 'function') renderBiddingInfo();
};

// ============ 招投标：中标管理 ============
window._bcState = Object.assign({}, defaultYearRange());
function renderBiddingCash(){
    const pg = $('#pages');
    let won = filterByRole(MOCK_BIDS.filter(b => (b.projectStatus||b.stage) === '已中标'), ['owner']);
    if (_bcState.from) won = won.filter(b => (b.opentime||'').slice(0,10) >= _bcState.from);
    if (_bcState.to)   won = won.filter(b => (b.opentime||'').slice(0,10) <= _bcState.to);
    const totalAmount = won.reduce((s,b)=>s+parseFloat(b.amount),0).toFixed(0);
    const unsigned = Math.floor(won.length*0.3);
    // 需求1301-4：隐藏 项目编号 + 项目现状
    const cols = [
        { key:'projState',label:'项目状态', w:'95px',  render: b=>`<span class="chip ${b.projState==='正式公告'?'p':b.projState==='意向'?'w':'a'}">${b.projState}</span>` },
        { key:'name',     label:'项目名称',            render: b=>b.name },
        { key:'party',    label:'甲方名称', w:'170px', render: b=>`<span class="cell-mute">${b.party || '—'}</span>` },
        { key:'_ht',      label:'合同号',    w:'140px', render: b=>`<span class="cell-mute">HT-2026-${String((parseInt(b.id.slice(-3))||0)%100).padStart(2,'0')}</span>` },
        { key:'bidType',  label:'投标类型', w:'80px',  render: b=>`<span class="chip ${b.bidType==='民标'?'p':'w'}" style="font-size:11px">${b.bidType}</span>` },
        { key:'amount',   label:'项目金额(万)', w:'105px', align:'right', render: b=>`<span class="cell-amount">¥${b.amount}</span>` },
        { key:'_act',     label:'操作',     w:'120px', render: b=>`<span class="row-acts"><button class="btn-icon" title="详情" onclick="openModal('中标项目', biddingDetailModal('${b.id}'))"><span class="material-symbols-rounded">visibility</span></button><button class="btn-icon" title="关联合同"><span class="material-symbols-rounded">link</span></button></span>` }
    ];
    const dateFilter = `
        <div class="ipt date-filter" style="gap:6px">
            <span class="material-symbols-rounded" style="font-size:16px;color:var(--text-3)">event</span>
            <input type="date" id="bcFrom" value="${_bcState.from||''}" style="border:none;background:transparent;font:inherit;color:var(--text-1);width:130px"/>
            <span style="color:var(--text-3)">~</span>
            <input type="date" id="bcTo"   value="${_bcState.to  ||''}" style="border:none;background:transparent;font:inherit;color:var(--text-1);width:130px"/>
            <button class="btn-icon" id="bcClear" title="清空时间"><span class="material-symbols-rounded" style="font-size:15px">close</span></button>
        </div>`;
    pg.innerHTML = `
        ${pageHeader('中标管理', `共 ${won.length} 条 · 累计 ¥${totalAmount} 万`, `
            <button class="btn"><span class="material-symbols-rounded" style="font-size:16px">file_download</span>导出</button>`)}
        ${statRow([
            { l:'中标',          v: won.length,    c:'s' },
            { l:'中标金额（万）', v: totalAmount,   c:'p' },
            { l:'未签合同',       v: unsigned,      c:'w' }
        ])}
        ${toolbar({
            filters:[
                { value:'all',     label:'全部', active:true, count: won.length },
                { value:'signed',  label:'已签合同', count: Math.floor(won.length*0.7) },
                { value:'unsigned',label:'未签合同', count: unsigned }
            ],
            searchPh:'搜索中标项目 / 编号 / 甲方…',
            right: dateFilter
        })}
        ${tableShell(cols, 'cashBody')}`;
    InfiniteList.bind({ source: won, pageSize: 14, container:'cashBody', render: tableRow(cols) });
    const fromIp = $('#bcFrom'), toIp = $('#bcTo'), clr = $('#bcClear');
    if (fromIp) fromIp.onchange = () => { _bcState.from = fromIp.value || null; renderBiddingCash(); };
    if (toIp)   toIp.onchange   = () => { _bcState.to   = toIp.value   || null; renderBiddingCash(); };
    if (clr)    clr.onclick     = () => { _bcState.from = null; _bcState.to = null; renderBiddingCash(); };
}

// ============ 招投标：绩效管理（按需求 0903 图 2 重构） ============
window._pfState = { year:'all', signYear:'all', cat:'all', kw:'', expanded:{} };
function renderBiddingPerf(){
    const pg = $('#pages');
    const allWon = filterByRole(MOCK_BIDS.filter(b => (b.projectStatus||b.stage) === '已中标'), ['owner']);
    // 派生绩效数据
    const perf = allWon.map((b,i) => {
        const cat   = ['工程类','服务类','设备类','咨询类'][i%4];
        const decYear = (2024 + (i%3));
        const sigYear = (2024 + ((i+1)%3));
        const amount = +b.amount;                            // 合同金额（万）
        const other  = +(amount * (0.05 + (i%5)*0.01)).toFixed(2);  // 其他花费
        const recv1  = +(amount * 0.4).toFixed(2);
        const recv2  = +(amount * 0.3).toFixed(2);
        const w      = +(0.6 + (i%5)*0.06).toFixed(2);       // 绩效权值
        const real   = +(amount - other).toFixed(2);          // 实际产值
        const ctrPerf = +(real * w).toFixed(2);              // 合同绩效
        const recvPerf= +((recv1 + recv2) * w).toFixed(2);   // 回款绩效
        const setPerf = +(ctrPerf * 0.7).toFixed(2);         // 结算绩效
        // 投标人员（多人）
        const team = ['李明','张华','王芳','赵磊','陈静','吴强','刘洋','周婷']
            .filter((_,j) => (i + j) % 4 === 0)
            .slice(0, 1 + (i%3));
        const teamData = team.map((nm, idx) => {
            const memW = +((1/team.length) * (0.8 + (idx%3)*0.1)).toFixed(2);
            return { idx: idx+1, name: nm, w: memW, perf: +(ctrPerf * memW).toFixed(2) };
        });
        return {
            id: b.id, decYear, type: cat, sigYear,
            ctrName: 'HT-2026-' + String((parseInt(b.id.slice(-3))||0)%100).padStart(2,'0'),
            name: b.name, amount, other, recv1, recv2, w, real, ctrPerf, recvPerf, setPerf,
            bidders: team.join('、') || '—',
            owner: b.owner,
            team: teamData
        };
    });
    let filtered = perf.slice();
    if (_pfState.year   !== 'all') filtered = filtered.filter(p => p.decYear == _pfState.year);
    if (_pfState.signYear !== 'all') filtered = filtered.filter(p => p.sigYear == _pfState.signYear);
    if (_pfState.cat    !== 'all') filtered = filtered.filter(p => p.type === _pfState.cat);
    if (_pfState.kw)               filtered = filtered.filter(p => (p.name+p.ctrName+p.id+p.bidders).includes(_pfState.kw));

    const yearOpts = ['all', 2024, 2025, 2026];
    const catOpts  = ['all', '工程类', '服务类', '设备类', '咨询类'];

    const filterBar = `
        <div class="pf-filterbar">
            <div class="pf-fld"><label>申报年度</label>
                <select id="pfYear">${yearOpts.map(y => `<option value="${y}"${_pfState.year==y?' selected':''}>${y==='all'?'全部':y+'年'}</option>`).join('')}</select>
            </div>
            <div class="pf-fld"><label>合同签订年度</label>
                <select id="pfSignYear">${yearOpts.map(y => `<option value="${y}"${_pfState.signYear==y?' selected':''}>${y==='all'?'全部':y+'年'}</option>`).join('')}</select>
            </div>
            <div class="pf-fld"><label>类别</label>
                <select id="pfCat">${catOpts.map(c => `<option value="${c}"${_pfState.cat===c?' selected':''}>${c==='all'?'全部':c}</option>`).join('')}</select>
            </div>
            <div class="pf-fld pf-kw"><label>关键词</label>
                <input id="pfKw" type="text" placeholder="项目 / 合同 / 投标人员…" value="${_pfState.kw||''}"/>
            </div>
            <div class="pf-actions">
                <button class="btn primary" id="pfQuery"><span class="material-symbols-rounded" style="font-size:16px">search</span>查询</button>
                <button class="btn" id="pfReset"><span class="material-symbols-rounded" style="font-size:16px">refresh</span>重置</button>
                <button class="btn" id="pfNew"><span class="material-symbols-rounded" style="font-size:16px">add</span>新增</button>
                <button class="btn" id="pfExport"><span class="material-symbols-rounded" style="font-size:16px">file_download</span>导出</button>
            </div>
        </div>`;

    pg.innerHTML = `
        ${pageHeader('绩效管理', `共 ${filtered.length} 条 · 中标项目绩效池`, '')}
        ${filterBar}
        <div class="card pf-tablewrap">
            <div class="pf-table-scroll">
                <table class="pf-table">
                    <thead>
                        <tr>
                            <th style="width:36px"></th>
                            <th style="width:90px">申报年度</th>
                            <th style="width:90px">项目类型</th>
                            <th style="width:120px">合同签订年度</th>
                            <th style="width:160px">合同名称</th>
                            <th style="min-width:200px">项目名称</th>
                            <th style="width:110px">合同金额(万)</th>
                            <th style="width:110px">其他花费(万)</th>
                            <th style="width:110px">回款金额①(万)</th>
                            <th style="width:110px">回款金额②(万)</th>
                            <th style="width:90px">绩效权值</th>
                            <th style="width:110px">实际产值(万)</th>
                            <th style="width:110px">合同绩效(万)</th>
                            <th style="width:110px">回款绩效(万)</th>
                            <th style="width:110px">结算绩效(万)</th>
                            <th style="width:160px">投标人员</th>
                            <th style="width:90px">负责人</th>
                            <th style="width:120px">操作</th>
                        </tr>
                    </thead>
                    <tbody id="perfBody">
                        ${filtered.map(p => _renderPerfRow(p)).join('')}
                    </tbody>
                </table>
            </div>
        </div>`;

    // 绑定筛选交互
    const apply = () => { renderBiddingPerf(); };
    $('#pfQuery').onclick = apply;
    $('#pfReset').onclick = () => { _pfState = { year:'all', signYear:'all', cat:'all', kw:'', expanded:{} }; renderBiddingPerf(); };
    $('#pfYear').onchange     = e => _pfState.year     = e.target.value;
    $('#pfSignYear').onchange = e => _pfState.signYear = e.target.value;
    $('#pfCat').onchange      = e => _pfState.cat      = e.target.value;
    $('#pfKw').oninput        = e => _pfState.kw       = e.target.value;
    $('#pfKw').onkeydown      = e => { if (e.key === 'Enter') apply(); };
    $('#pfNew').onclick    = () => openModal('新增绩效项目', perfNewModal(), { width:'820px', height:'620px' });
    $('#pfExport').onclick = () => alert('已导出当前筛选结果（演示）');

    // 绑定展开/收起 + 投标人员新增
    $$('.pf-expand', pg).forEach(btn => btn.onclick = () => {
        const id = btn.dataset.id;
        _pfState.expanded[id] = !_pfState.expanded[id];
        renderBiddingPerf();
    });
    $$('.pf-add-bidder', pg).forEach(btn => btn.onclick = () => alert('打开"新增投标人员"表单（演示）'));
}

function _renderPerfRow(p){
    const expanded = _pfState.expanded[p.id];
    let html = `
        <tr class="pf-row${expanded?' pf-row-on':''}">
            <td><button class="pf-expand" data-id="${p.id}" title="${expanded?'收起':'展开'}"><span class="material-symbols-rounded" style="font-size:18px;transition:transform .2s;${expanded?'transform:rotate(90deg)':''}">chevron_right</span></button></td>
            <td>${p.decYear}</td>
            <td><span class="chip ${p.type==='工程类'?'p':p.type==='服务类'?'s':p.type==='设备类'?'a':'w'}" style="font-size:11px">${p.type}</span></td>
            <td>${p.sigYear}</td>
            <td><span class="cell-mute">${p.ctrName}</span></td>
            <td>${p.name}</td>
            <td style="text-align:right"><span class="cell-amount">¥${p.amount.toFixed(2)}</span></td>
            <td style="text-align:right">${p.other.toFixed(2)}</td>
            <td style="text-align:right">${p.recv1.toFixed(2)}</td>
            <td style="text-align:right">${p.recv2.toFixed(2)}</td>
            <td style="text-align:right"><strong>${p.w.toFixed(2)}</strong></td>
            <td style="text-align:right">${p.real.toFixed(2)}</td>
            <td style="text-align:right;color:var(--primary);font-weight:600">¥${p.ctrPerf.toFixed(2)}</td>
            <td style="text-align:right;color:var(--emerald);font-weight:600">¥${p.recvPerf.toFixed(2)}</td>
            <td style="text-align:right;color:var(--amber);font-weight:600">¥${p.setPerf.toFixed(2)}</td>
            <td><select class="pf-bidder-sel">${p.team.map(t=>`<option>${t.name}</option>`).join('') || '<option>—</option>'}</select></td>
            <td>${p.owner}</td>
            <td><span class="row-acts"><button class="btn-icon" title="查看"><span class="material-symbols-rounded">visibility</span></button><button class="btn-icon" title="编辑" style="color:var(--primary)"><span class="material-symbols-rounded">edit</span></button><button class="btn-icon" title="删除"><span class="material-symbols-rounded">delete</span></button></span></td>
        </tr>`;
    if (expanded) {
        html += `
        <tr class="pf-sub">
            <td></td>
            <td colspan="17">
                <div class="pf-sub-wrap">
                    <div class="pf-sub-head">
                        <h4>投标人员明细</h4>
                        <button class="btn primary pf-add-bidder" data-id="${p.id}"><span class="material-symbols-rounded" style="font-size:16px">person_add</span>新增投标人员</button>
                    </div>
                    <table class="pf-sub-table">
                        <thead><tr><th style="width:60px">序号</th><th>投标人员</th><th style="width:120px">绩效权值</th><th style="width:140px">成员绩效（万）</th><th style="width:140px">操作</th></tr></thead>
                        <tbody>
                            ${p.team.length ? p.team.map(m => `
                                <tr>
                                    <td>${m.idx}</td>
                                    <td>${m.name}</td>
                                    <td><strong>${m.w.toFixed(2)}</strong></td>
                                    <td style="color:var(--primary);font-weight:600">¥${m.perf.toFixed(2)}</td>
                                    <td><span class="row-acts"><button class="btn-icon" title="编辑" style="color:var(--primary)"><span class="material-symbols-rounded">edit</span></button><button class="btn-icon" title="删除"><span class="material-symbols-rounded">delete</span></button></span></td>
                                </tr>`).join('')
                            : '<tr><td colspan="5" style="text-align:center;color:var(--text-3);padding:20px">暂无投标人员，点击右上角"新增投标人员"添加</td></tr>'}
                        </tbody>
                    </table>
                </div>
            </td>
        </tr>`;
    }
    return html;
}

window.perfNewModal = function(){
    return `
    <div class="bf-form">
        <div class="bf-grid">
            <div class="bf-cell"><label>申报年度 <i>*</i></label><select class="bf-ipt"><option>2026</option><option>2025</option><option>2024</option></select></div>
            <div class="bf-cell"><label>项目类型 <i>*</i></label><select class="bf-ipt"><option>工程类</option><option>服务类</option><option>设备类</option><option>咨询类</option></select></div>
            <div class="bf-cell"><label>合同签订年度 <i>*</i></label><select class="bf-ipt"><option>2026</option><option>2025</option><option>2024</option></select></div>
            <div class="bf-cell"><label>合同名称 <i>*</i></label><input class="bf-ipt" placeholder="HT-XXXX-XX"/></div>
            <div class="bf-cell bf-span-2"><label>项目名称 <i>*</i></label><input class="bf-ipt" placeholder="请输入项目名称"/></div>
            <div class="bf-cell"><label>合同金额（万）<i>*</i></label><input class="bf-ipt" type="number" placeholder="0.00"/></div>
            <div class="bf-cell"><label>其他花费（万）</label><input class="bf-ipt" type="number" placeholder="0.00"/></div>
            <div class="bf-cell"><label>回款金额①（万）</label><input class="bf-ipt" type="number" placeholder="0.00"/></div>
            <div class="bf-cell"><label>回款金额②（万）</label><input class="bf-ipt" type="number" placeholder="0.00"/></div>
            <div class="bf-cell"><label>绩效权值 <i>*</i></label><input class="bf-ipt" type="number" step="0.01" placeholder="如：0.85"/></div>
            <div class="bf-cell"><label>负责人 <i>*</i></label><input class="bf-ipt" placeholder="姓名"/></div>
            <div class="bf-cell bf-span-2"><label>投标人员</label>
                <input class="bf-ipt" placeholder="多个姓名以、分隔（明细可在列表中展开后录入）"/>
            </div>
        </div>
        <div class="bf-foot">
            <button class="btn" onclick="closeModal()">取消</button>
            <button class="btn primary" onclick="closeModal()"><span class="material-symbols-rounded" style="font-size:16px">save</span>保存</button>
        </div>
    </div>`;
};

// ============ 合同管理：客户合同 ============
window._ccState = Object.assign({}, defaultYearRange());
function renderContractCustomer(){
    const pg = $('#pages');
    let items = filterByRole(MOCK_CONTRACTS_CUSTOMER, ['owner']);
    if (_ccState.from) items = items.filter(c => (c.sign||'') >= _ccState.from);
    if (_ccState.to)   items = items.filter(c => (c.sign||'') <= _ccState.to);
    const totalAmount = items.reduce((s,c)=>s+ +c.amount, 0);
    const bidCount = items.filter(c=>c.source==='招投标').length;
    // 需求1301-5.1：隐藏 项目类型 / 价格类型 / 合同归属
    const cols = [
        { key:'id',        label:'合同编号', w:'150px', render: c=>`<span class="cell-id">${c.id}</span>` },
        { key:'name',      label:'合同名称', render: c=>c.name },
        { key:'party',     label:'业主名称', w:'140px', render: c=>c.ownerName || c.party },
        { key:'amount',    label:'合同额(万)', w:'110px', align:'right', render: c=>`<span class="cell-amount">¥${(+c.amount).toLocaleString('zh-CN')}</span>` },
        { key:'sign',      label:'签订时间', w:'110px', render: c=>`<span class="cell-mute">${c.sign}</span>` },
        { key:'_dur',      label:'合同工期', w:'170px', render: c=>`<span class="cell-mute">${(c.durStart||c.sign).slice(5)} ~ ${(c.durEnd||c.end).slice(5)}</span>` },
        { key:'sales',     label:'商务联络人', w:'100px', render: c=>c.sales || c.owner },
        { key:'vp',        label:'主管副总', w:'90px',  render: c=>c.vp || '—' },
        { key:'status',    label:'状态', w:'90px',  render: c=>`<span class="chip ${c.status==='履约中'?'s':c.status==='变更中'?'w':c.status==='已完成'?'a':'p'}">${tt(c.status)}</span>` },
        { key:'_act',      label:'操作', w:'120px', render: c=>`<span class="row-acts"><button class="btn-icon" title="详情" onclick="openModal('客户合同详情 · ${c.id}', customerContractFormModal('${c.id}',true),{width:'1080px',height:'780px'})"><span class="material-symbols-rounded">visibility</span></button><button class="btn-icon" title="编辑" onclick="openModal('编辑客户合同 · ${c.id}', customerContractFormModal('${c.id}'),{width:'1080px',height:'780px'})"><span class="material-symbols-rounded">edit</span></button><button class="btn-icon" title="附件"><span class="material-symbols-rounded">attach_file</span></button></span>` }
    ];
    const dateFilter = `
        <div class="ipt date-filter" style="gap:6px">
            <span class="material-symbols-rounded" style="font-size:16px;color:var(--text-3)">event</span>
            <input type="date" id="ccFrom" value="${_ccState.from||''}" style="border:none;background:transparent;font:inherit;color:var(--text-1);width:130px"/>
            <span style="color:var(--text-3)">~</span>
            <input type="date" id="ccTo"   value="${_ccState.to  ||''}" style="border:none;background:transparent;font:inherit;color:var(--text-1);width:130px"/>
            <button class="btn-icon" id="ccClear" title="清空时间"><span class="material-symbols-rounded" style="font-size:15px">close</span></button>
        </div>`;
    // 需求1301-5.3：统计卡说明数据时间
    const ccRangeText = _ccState.from || _ccState.to
        ? `${_ccState.from||'起始'} ~ ${_ccState.to||new Date().toISOString().slice(0,10)}`
        : `截至 ${new Date().toISOString().slice(0,10)}`;
    // 需求1901-五.1：年度统计 — 近 5 年签约合同数 + 金额
    const curYear = new Date().getFullYear();
    const yearStats = [];
    for (let y = curYear; y >= curYear - 4; y--) {
        const yItems = items.filter(c => (c.sign||'').slice(0,4) === String(y));
        const yAmt = yItems.reduce((s,c) => s + (+c.amount), 0);
        yearStats.push({ y, cnt: yItems.length, amt: yAmt });
    }
    const yearStatHtml = yearStats.map(s => `
        <div class="year-stat-row">
            <span class="ys-year">${s.y}</span>
            <span class="ys-cnt">${s.cnt} 份</span>
            <span class="ys-amt">¥${(s.amt/10000).toFixed(2)} 亿</span>
        </div>`).join('');
    pg.innerHTML = `
        ${pageHeader('客户合同', `我们作为乙方 · 共 ${items.length} 条`, `
            <div class="year-stat-pop" id="ccYearPop">
                <button class="btn" id="ccYearBtn"><span class="material-symbols-rounded">insights</span>年度统计</button>
                <div class="year-stat-menu" id="ccYearMenu" style="display:none">
                    <div class="ys-head">近 5 年签约统计</div>
                    ${yearStatHtml}
                </div>
            </div>
            <button class="btn"><span class="material-symbols-rounded">file_download</span>导出</button>
            <button class="btn primary" onclick="openCustomerContractAddChooser()"><span class="material-symbols-rounded">add</span>新增</button>
        `)}
        <div class="stat-range-hint"><span class="material-symbols-rounded" style="font-size:14px">event_note</span>签订时间统计范围：<b>${ccRangeText}</b></div>
        ${statRow([
            { l:'合同总数', v: items.length, c:'p' },
            { l:'合同总额', v: (totalAmount/10000).toFixed(2), unit:'亿', c:'a' },
            { l:'招投标来源', v: bidCount, c:'s', t:`${items.length?(bidCount/items.length*100).toFixed(1):0}%` },
            { l:'非招投标', v: items.length-bidCount, c:'w', t:`${items.length?((items.length-bidCount)/items.length*100).toFixed(1):0}%` }
        ])}
        ${toolbar({
            searchPh:'搜索合同号 / 业主 / 名称…',
            right: dateFilter
        })}
        ${tableShell(cols, 'hcBody')}`;
    // 需求060101-二.1：用户通过两步式新增添加的"目录"节点 — 仅显示目录名称
    window._ccDirectories = window._ccDirectories || [];
    const rowRender = tableRow(cols);
    const customRender = (it, i) => {
        if (it && it.isDir) {
            return `<tr class="cc-dir-row">
                <td colspan="${cols.length}" style="padding:10px 14px;background:linear-gradient(135deg,rgba(96,165,250,0.07),rgba(96,165,250,0.02));">
                    <span class="material-symbols-rounded" style="font-size:18px;vertical-align:-4px;color:var(--primary);margin-right:6px">folder</span>
                    <span style="font-weight:600;color:var(--text-1);font-size:13px">${it.name||'未命名目录'}</span>
                    <span style="margin-left:10px;font-size:11.5px;color:var(--text-3)">目录</span>
                </td>
            </tr>`;
        }
        return rowRender(it, i);
    };
    const allItems = window._ccDirectories.concat(items);
    InfiniteList.bind({ source: allItems, pageSize: 14, container:'hcBody', render: customRender });
    const fromIp = $('#ccFrom'), toIp = $('#ccTo'), clr = $('#ccClear');
    if (fromIp) fromIp.onchange = () => { _ccState.from = fromIp.value || null; renderContractCustomer(); };
    if (toIp)   toIp.onchange   = () => { _ccState.to   = toIp.value   || null; renderContractCustomer(); };
    if (clr)    clr.onclick     = () => { _ccState.from = null; _ccState.to = null; renderContractCustomer(); };
    // 年度统计 弹出
    const yBtn = $('#ccYearBtn'), yMenu = $('#ccYearMenu');
    if (yBtn && yMenu) {
        yBtn.onclick = (e) => { e.stopPropagation(); yMenu.style.display = (yMenu.style.display === 'none' ? 'block' : 'none'); };
        document.addEventListener('click', (e) => {
            const pop = document.getElementById('ccYearPop');
            if (pop && !pop.contains(e.target)) yMenu.style.display = 'none';
        }, { once: true });
    }
}

// ===== 需求060101-二.1：新增合同 两步式流程 =====
window.openCustomerContractAddChooser = function(){
    const body = `
    <div class="cc-add-chooser" style="padding:18px 8px 6px;">
        <div style="font-size:14px;color:var(--text-1);line-height:1.7;padding:12px 0 22px;">
            请问创建合同还是目录？
        </div>
        <div style="display:flex;justify-content:flex-end;gap:10px;padding-top:14px;border-top:1px solid var(--glass-border);">
            <button class="btn" id="ccAddDir"><span class="material-symbols-rounded" style="font-size:16px">folder</span>目录</button>
            <button class="btn primary" id="ccAddCtr"><span class="material-symbols-rounded" style="font-size:16px">description</span>合同</button>
        </div>
    </div>`;
    openModal('新增合同', body, { width:'460px', height:'auto' });
    setTimeout(() => {
        const ctr = document.getElementById('ccAddCtr');
        const dir = document.getElementById('ccAddDir');
        if (ctr) ctr.onclick = () => {
            closeModal();
            openModal('新增客户合同', window.customerContractFormModal(), { width:'1080px', height:'780px' });
        };
        if (dir) dir.onclick = () => {
            closeModal();
            openCustomerContractAddDir();
        };
    }, 0);
};
window.openCustomerContractAddDir = function(){
    const body = `
    <div class="bf-form" style="padding:6px;">
        <div class="bf-grid">
            <div class="bf-cell bf-span-2">
                <label>目录名称 <i>*</i></label>
                <input class="bf-ipt" id="ccDirNameIpt" placeholder="请输入目录名称" autocomplete="off"/>
            </div>
        </div>
        <div class="bf-foot">
            <button class="btn" id="ccDirCancel">取消</button>
            <button class="btn primary" id="ccDirSubmit">提交</button>
        </div>
    </div>`;
    openModal('新增合同 · 目录', body, { width:'460px', height:'auto' });
    setTimeout(() => {
        const ipt = document.getElementById('ccDirNameIpt');
        const ok  = document.getElementById('ccDirSubmit');
        const no  = document.getElementById('ccDirCancel');
        if (ipt) ipt.focus();
        if (no) no.onclick = () => closeModal();
        if (ok) ok.onclick = () => {
            const name = (ipt && ipt.value || '').trim();
            if (!name) { if (ipt) ipt.focus(); return; }
            window._ccDirectories = window._ccDirectories || [];
            window._ccDirectories.unshift({ isDir:true, name, id:'DIR-'+Date.now() });
            closeModal();
            if (typeof renderContractCustomer === 'function') renderContractCustomer();
        };
        if (ipt) ipt.addEventListener('keydown', e => { if (e.key === 'Enter' && ok) ok.click(); });
    }, 0);
};

// 新增 / 编辑 / 详情 客户合同 弹窗（按表 1：24 个字段）
// 需求1901-五.2：合同编号 自动生成 = 年份 + 第几个项目（如 202601）
// 需求1901-五.3：删除 项目类型 字段
// 需求1901-五.4：新增面板默认仅显示 合同名称 + "归类合同" 开关；开启时展开全部字段
window.customerContractFormModal = function(id, readonly){
    const c = id ? MOCK_CONTRACTS_CUSTOMER.find(x => x.id === id) : null;
    const isNew = !c;
    const v = (k, def='') => (c && c[k] != null) ? String(c[k]).replace(/"/g,'&quot;') : def;
    const sel = (val, opts) => opts.map(o => `<option value="${o}"${o===val?' selected':''}>${o}</option>`).join('');
    const ro = readonly ? 'disabled' : '';
    // 合同编号 自动生成（年份 + 当年第几个项目，例如 202601）
    const curYear = new Date().getFullYear();
    const yearCount = (MOCK_CONTRACTS_CUSTOMER || []).filter(x => (x.sign||'').startsWith(String(curYear))).length;
    const seq = String(yearCount + 1).padStart(2, '0');
    const autoId = `${curYear}${seq}`;
    // 新增模式：默认折叠（仅显示 合同名称 + 归类合同 开关）
    const archived = c && c.archived;
    const collapsed = isNew && !archived;
    return `
    <div class="bf-form" data-cc-form>
        <div class="bf-section">基础信息</div>
        <div class="bf-grid cc-base-grid">
            <div class="bf-cell bf-span-2"><label>合同名称 <i>*</i></label>
                <input class="bf-ipt" ${ro} placeholder="录入合同官方全称" value="${v('name')}"/>
            </div>
            <div class="bf-cell bf-span-2"><label>归类合同 <span class="bf-hint">（开启后展开完整合同字段）</span></label>
                <label class="bf-switch"><input type="checkbox" id="ccArchToggle" ${archived?'checked':''} ${ro}/><span class="bf-switch-slider"></span><span class="bf-switch-txt" id="ccArchTxt">${archived?'已归类':'未归类'}</span></label>
            </div>
        </div>
        <div class="cc-detail-wrap" id="ccDetailWrap" style="${collapsed?'display:none':''}">
        <div class="bf-grid">
            <div class="bf-cell"><label>合同编号 <i>*</i></label>
                <input class="bf-ipt" ${ro} readonly placeholder="自动生成" value="${v('id', autoId)}"/>
            </div>
            <div class="bf-cell"><label>关联招标信息</label>
                <div class="bf-search-input"><span class="material-symbols-rounded">search</span><input class="bf-ipt" ${ro} placeholder="搜索招标项目编号 / 名称" value="${v('linkedBid')}"/></div>
            </div>
            <div class="bf-cell"><label>关联项目</label>
                <div class="bf-search-input"><span class="material-symbols-rounded">search</span><input class="bf-ipt" ${ro} placeholder="搜索项目台账" value="${v('linkedProject')}"/></div>
            </div>
            <div class="bf-cell"><label>隶属主合同</label>
                <div class="bf-search-input"><span class="material-symbols-rounded">search</span><input class="bf-ipt" ${ro} placeholder="子/分包合同需绑定上级主合同" value="${v('parentContract')}"/></div>
            </div>
            <div class="bf-cell"><label>合同归属 <i>*</i></label>
                <select class="bf-ipt" ${ro}>${sel(v('belong','本部'), ['本部','一分公司','二分公司','三分公司','华东分公司'])}</select>
            </div>
            <div class="bf-cell"><label>价格类型 <i>*</i></label>
                <!-- 需求060101-二.2：价格类型只保留 总价包干合同 / 单价合同 -->
                <select class="bf-ipt" ${ro}>${sel(v('priceType','总价包干合同'), ['总价包干合同','单价合同'])}</select>
            </div>
            <div class="bf-cell"><label>项目规模</label>
                <input class="bf-ipt" ${ro} placeholder="项目体量 / 工程量" value="${v('scale')}"/>
            </div>
            <div class="bf-cell"><label>合同工期 <i>*</i></label>
                <div class="bf-date-range">
                    <input class="bf-ipt" type="date" ${ro} value="${v('durStart')}"/>
                    <span class="bf-date-sep">~</span>
                    <input class="bf-ipt" type="date" ${ro} value="${v('durEnd')}"/>
                </div>
            </div>
            <div class="bf-cell"><label>签订时间 <i>*</i></label>
                <input class="bf-ipt" type="date" ${ro} value="${v('sign')}"/>
            </div>
            <div class="bf-cell bf-span-2"><label>合同工期说明</label>
                <input class="bf-ipt" ${ro} placeholder="工期特殊约定 / 补充备注" value="${v('durNote')}"/>
            </div>
        </div>

        <div class="bf-section">甲方信息</div>
        <div class="bf-grid">
            <div class="bf-cell"><label>业主名称</label>
                <input class="bf-ipt" ${ro} placeholder="招标方 / 甲方单位全称" value="${v('ownerName',v('party'))}"/>
            </div>
            <div class="bf-cell"><label>分管科室</label>
                <input class="bf-ipt" ${ro} placeholder="业主方对接科室" value="${v('depart')}"/>
            </div>
            <div class="bf-cell"><label>甲方联系人 <i>*</i></label>
                <input class="bf-ipt" ${ro} placeholder="姓名" value="${v('partyContact')}"/>
            </div>
            <div class="bf-cell"><label>甲方联系人电话 <i>*</i></label>
                <input class="bf-ipt" ${ro} placeholder="手机 / 座机" value="${v('partyPhone')}"/>
            </div>
        </div>

        <div class="bf-section">我方对接</div>
        <div class="bf-grid">
            <div class="bf-cell"><label>商务联络人 <i>*</i></label>
                <div class="bf-search-input"><span class="material-symbols-rounded">search</span><input class="bf-ipt" ${ro} placeholder="对应商务经理 / 编标负责人" value="${v('sales')}"/></div>
            </div>
            <div class="bf-cell"><label>主管副总 <i>*</i></label>
                <select class="bf-ipt" ${ro}>${sel(v('vp','李副总'), ['李副总','张副总','陈副总','吴副总'])}</select>
            </div>
            <div class="bf-cell"><label>文审负责人</label>
                <select class="bf-ipt" ${ro}>${sel(v('reviewer','林文审'), ['林文审','王文审','赵文审'])}</select>
            </div>
            <div class="bf-cell"><label>生产负责人</label>
                <div class="bf-search-input"><span class="material-symbols-rounded">search</span><input class="bf-ipt" ${ro} placeholder="项目生产负责人" value="${v('producer')}"/></div>
            </div>
            <div class="bf-cell"><label>归属年份</label>
                <input class="bf-ipt" type="number" ${ro} placeholder="如：2026" value="${v('year','2026')}"/>
            </div>
            <div class="bf-cell"><label>合同额（万）</label>
                <input class="bf-ipt" type="number" ${ro} placeholder="0.00" value="${v('amount')}"/>
            </div>
        </div>

        <div class="bf-section">附件</div>
        <div class="bf-grid">
            <div class="bf-cell bf-span-2"><label>合同附件（仅 PDF）</label>
                <div class="bf-upload">
                    <span class="material-symbols-rounded" style="font-size:16px;color:var(--primary)">upload_file</span>
                    <span class="bf-upload-txt">点击或拖拽上传正式签署合同 PDF · 文件名需与合同内容一致</span>
                    <button class="btn" style="padding:4px 10px;font-size:11.5px" ${ro}>浏览…</button>
                </div>
            </div>
            <div class="bf-cell bf-span-2"><label>附件材料</label>
                <div class="bf-upload">
                    <span class="material-symbols-rounded" style="font-size:16px;color:var(--primary)">folder_zip</span>
                    <span class="bf-upload-txt">验收意见 / 成果资料 / 验收报告 等支撑文件</span>
                    <button class="btn" style="padding:4px 10px;font-size:11.5px" ${ro}>浏览…</button>
                </div>
            </div>
        </div>
        </div><!-- /.cc-detail-wrap -->

        <div class="bf-foot">
            <button class="btn" onclick="closeModal()">取消</button>
            ${readonly ? '' : `<button class="btn primary" onclick="closeModal()"><span class="material-symbols-rounded" style="font-size:16px">save</span>保存</button>`}
        </div>
    </div>`;
};
// 客户合同 归类开关 — 委托事件（弹窗内 innerHTML 不会执行 <script>，故用全局委托）
document.addEventListener('change', function(e){
    if (e.target && e.target.id === 'ccArchToggle') {
        const wrap = document.getElementById('ccDetailWrap');
        const txt = document.getElementById('ccArchTxt');
        if (wrap) wrap.style.display = e.target.checked ? '' : 'none';
        if (txt)  txt.textContent = e.target.checked ? '已归类' : '未归类';
    }
    // 需求2001-三.1：投标 radio 选中态切换 .on（淡蓝色）
    if (e.target && e.target.matches('.bf-radio-row input[type="radio"]')) {
        const name = e.target.name;
        document.querySelectorAll(`.bf-radio-row input[type="radio"][name="${name}"]`).forEach(r => {
            const lbl = r.closest('.bf-radio');
            if (lbl) lbl.classList.toggle('on', r.checked);
        });
    }
});

// ============ 合同管理：外协合同 ============
window._coState = Object.assign({}, defaultYearRange());
function renderContractOutsource(){
    const pg = $('#pages');
    let items = filterByRole(MOCK_CONTRACTS_OUTSOURCE, ['owner']);
    if (_coState.from) items = items.filter(c => (c.sign||'') >= _coState.from);
    if (_coState.to)   items = items.filter(c => (c.sign||'') <= _coState.to);
    const cnt = (t)=>items.filter(c=>c.type===t).length;
    const cols = [
        { key:'id',           label:'合同编号', w:'150px', render: c=>`<span class="cell-id">${c.id}</span>` },
        { key:'party',        label:'外协单位', w:'140px', render: c=>c.party },
        { key:'name',         label:'外协合同名称', render: c=>c.name },
        { key:'mainProject',  label:'主项目名称', w:'180px', render: c=>`<span class="cell-mute">${c.mainProject||'—'}</span>` },
        { key:'actualProject',label:'实际项目', w:'130px', render: c=>`<span class="cell-mute">${c.actualProject||'—'}</span>` },
        { key:'partyBContact',label:'乙方联系人', w:'100px', render: c=>c.partyBContact || c.owner },
        { key:'partyBPhone',  label:'联系电话',   w:'130px', render: c=>`<span class="cell-mute">${c.partyBPhone || '—'}</span>` },
        { key:'amount',       label:'合同额(万)', w:'110px', align:'right', render: c=>`<span class="cell-amount">¥${(+c.amount).toLocaleString('zh-CN')}</span>` },
        { key:'sign',         label:'签订日期', w:'110px', render: c=>`<span class="cell-mute">${c.sign}</span>` },
        { key:'status',       label:'状态', w:'90px',  render: c=>`<span class="chip ${c.status==='履约中'?'s':c.status==='已完成'?'a':c.status==='结算中'?'w':'p'}">${tt(c.status)}</span>` },
        { key:'payment',      label:'付款', w:'90px',  render: c=>`<span class="chip ${c.payment==='已付清'?'s':c.payment==='未支付'?'d':'w'}">${tt(c.payment)}</span>` },
        { key:'_act',         label:'操作', w:'120px', render: c=>`<span class="row-acts"><button class="btn-icon" title="详情" onclick="openModal('外协合同详情 · ${c.id}', outsourceContractFormModal('${c.id}',true),{width:'960px',height:'700px'})"><span class="material-symbols-rounded">visibility</span></button><button class="btn-icon" title="编辑" onclick="openModal('编辑外协合同 · ${c.id}', outsourceContractFormModal('${c.id}'),{width:'960px',height:'700px'})"><span class="material-symbols-rounded">edit</span></button><button class="btn-icon" title="付款"><span class="material-symbols-rounded">payments</span></button></span>` }
    ];
    const dateFilter = `
        <div class="ipt date-filter" style="gap:6px">
            <span class="material-symbols-rounded" style="font-size:16px;color:var(--text-3)">event</span>
            <input type="date" id="coFrom" value="${_coState.from||''}" style="border:none;background:transparent;font:inherit;color:var(--text-1);width:130px"/>
            <span style="color:var(--text-3)">~</span>
            <input type="date" id="coTo"   value="${_coState.to  ||''}" style="border:none;background:transparent;font:inherit;color:var(--text-1);width:130px"/>
            <button class="btn-icon" id="coClear" title="清空时间"><span class="material-symbols-rounded" style="font-size:15px">close</span></button>
        </div>`;
    // 需求1301-6.2：外协合同统计卡说明数据时间
    const coRangeText = _coState.from || _coState.to
        ? `${_coState.from||'起始'} ~ ${_coState.to||new Date().toISOString().slice(0,10)}`
        : `截至 ${new Date().toISOString().slice(0,10)}`;
    pg.innerHTML = `
        ${pageHeader('外协合同', `我们作为甲方 · 共 ${items.length} 条`, `
            <button class="btn"><span class="material-symbols-rounded">file_download</span>导出</button>
            <button class="btn primary" onclick="openModal('新增外协合同', outsourceContractFormModal(),{width:'960px',height:'700px'})"><span class="material-symbols-rounded">add</span>新增</button>
        `)}
        <div class="stat-range-hint"><span class="material-symbols-rounded" style="font-size:14px">event_note</span>签订时间统计范围：<b>${coRangeText}</b></div>
        ${statRow([
            { l:'合同总数', v: items.length, c:'p' },
            { l:'采购合同', v: cnt('采购合同'), c:'a' },
            { l:'服务合同', v: cnt('服务合同'), c:'s' },
            { l:'外协合同', v: cnt('外协合同'), c:'w' }
        ])}
        ${toolbar({
            searchPh:'搜索合同号 / 外协单位 / 名称…',
            right: dateFilter
        })}
        ${tableShell(cols, 'hoBody')}`;
    InfiniteList.bind({ source: items, pageSize: 14, container:'hoBody', render: tableRow(cols) });
    const fromIp = $('#coFrom'), toIp = $('#coTo'), clr = $('#coClear');
    if (fromIp) fromIp.onchange = () => { _coState.from = fromIp.value || null; renderContractOutsource(); };
    if (toIp)   toIp.onchange   = () => { _coState.to   = toIp.value   || null; renderContractOutsource(); };
    if (clr)    clr.onclick     = () => { _coState.from = null; _coState.to = null; renderContractOutsource(); };
}

// 新增 / 编辑 / 详情 外协合同 弹窗（按表 2：12 个字段）
window.outsourceContractFormModal = function(id, readonly){
    const c = id ? MOCK_CONTRACTS_OUTSOURCE.find(x => x.id === id) : null;
    const v = (k, def='') => (c && c[k] != null) ? String(c[k]).replace(/"/g,'&quot;') : def;
    const sel = (val, opts) => opts.map(o => `<option value="${o}"${o===val?' selected':''}>${o}</option>`).join('');
    const ro = readonly ? 'disabled' : '';
    const vendors = ['北京华信','深圳鹏海','上海智算','南京数研','广州联科','杭州云图','武汉科软','成都光合','天津数联','西安智成'];
    const projects = ['某市政务云平台项目','智慧水务监测项目','轨道交通调度项目','医院信息化升级项目','工业互联网平台项目','智慧园区物联网项目'];
    const subProjs = ['一期主体','二期扩建','调试运维','数据采集','平台开发','配套部署'];
    return `
    <div class="bf-form">
        <div class="bf-section">基础信息</div>
        <div class="bf-grid">
            <div class="bf-cell"><label>合同编号 <i>*</i></label>
                <input class="bf-ipt" ${ro} placeholder="自动生成 / 手动填写" value="${v('id','HT-O-' + new Date().getTime().toString().slice(-5))}"/>
            </div>
            <div class="bf-cell"><label>外协单位名称</label>
                <div class="bf-search-input"><span class="material-symbols-rounded">search</span>
                    <select class="bf-ipt" ${ro}>${sel(v('party',vendors[0]), vendors)}</select>
                </div>
            </div>
            <div class="bf-cell"><label>合同编号（系统）</label>
                <input class="bf-ipt" ${ro} placeholder="可手动输入 / 系统自动生成" value="${v('id')}"/>
            </div>
            <div class="bf-cell"><label>主项目名称 <i>*</i></label>
                <select class="bf-ipt" ${ro}>${sel(v('mainProject',projects[0]), projects)}</select>
            </div>
            <div class="bf-cell bf-span-2"><label>外协合同名称 <i>*</i></label>
                <input class="bf-ipt" ${ro} placeholder="录入外协合同官方全称" value="${v('name')}"/>
            </div>
            <div class="bf-cell"><label>外协合同额（万元）<i>*</i></label>
                <input class="bf-ipt" type="number" ${ro} placeholder="0.00" value="${v('amount')}"/>
            </div>
            <div class="bf-cell"><label>签订日期 <i>*</i></label>
                <input class="bf-ipt" type="date" ${ro} value="${v('sign')}"/>
            </div>
            <div class="bf-cell"><label>实际项目 <i>*</i></label>
                <select class="bf-ipt" ${ro}>${sel(v('actualProject',subProjs[0]), subProjs)}</select>
            </div>
        </div>

        <div class="bf-section">乙方信息</div>
        <div class="bf-grid">
            <div class="bf-cell"><label>乙方联系人 <i>*</i></label>
                <input class="bf-ipt" ${ro} placeholder="对接人姓名" value="${v('partyBContact')}"/>
            </div>
            <div class="bf-cell"><label>乙方联系人电话 <i>*</i></label>
                <input class="bf-ipt" ${ro} placeholder="手机 / 座机" value="${v('partyBPhone')}"/>
            </div>
        </div>

        <div class="bf-section">工作内容 & 附件</div>
        <div class="bf-grid">
            <div class="bf-cell bf-span-2"><label>工作内容及工作量</label>
                <textarea class="bf-ipt" rows="4" ${ro} placeholder="详细描述外协工作范围、工程量、交付标准…">${v('workContent')}</textarea>
            </div>
            <div class="bf-cell bf-span-2"><label>合同附件</label>
                <div class="bf-upload">
                    <span class="material-symbols-rounded" style="font-size:16px;color:var(--primary)">upload_file</span>
                    <span class="bf-upload-txt">点击或拖拽上传外协合同扫描件 / 电子版（PDF / 图片）</span>
                    <button class="btn" style="padding:4px 10px;font-size:11.5px" ${ro}>浏览…</button>
                </div>
            </div>
        </div>

        <div class="bf-foot">
            <button class="btn" onclick="closeModal()">取消</button>
            ${readonly ? '' : `<button class="btn primary" onclick="closeModal()"><span class="material-symbols-rounded" style="font-size:16px">save</span>保存</button>`}
        </div>
    </div>`;
};

// ============ 项目管理：项目列表（需求1301-5 改造） ============
// 需求1301-5.1 / 5.2：筛选条件 + 两种创建模式 + 列表字段 + 信息填报 + 周报
// 需求1901-六.1：删除 项目类型 筛选，新增 生产部门 筛选（6 个部门）
window._prjState = { dept:'all', name:'', year:'all', status:'未完成', mine:false };
window._prjDepartments = ['遥感事业部','采集事业部','编辑事业部','制图事业部','软件研发事业部','工程测量项目组'];
function renderProjectList(){
    const pg = $('#pages');
    let items = filterByRole(MOCK_PROJECTS, ['owner']);
    // 应用筛选
    if (_prjState.dept !== 'all') items = items.filter(p => p.department === _prjState.dept);
    if (_prjState.name) items = items.filter(p => (p.name||'').includes(_prjState.name));
    if (_prjState.year !== 'all') items = items.filter(p => String(p.year) === String(_prjState.year));
    if (_prjState.status === '未完成') items = items.filter(p => p.status !== '已完成');
    else if (_prjState.status !== 'all') items = items.filter(p => p.status === _prjState.status);
    if (_prjState.mine) items = items.filter(p => p.mine);

    const yearOpts = ['all', 2024, 2025, 2026];
    // 项目状态：默认"未完成"（即生产中项目）
    const statusOpts = ['未完成','实施中','初验中','终验中','已完成','已暂停','all'];
    const statusLabel = (s) => s==='all' ? '全部' : (s==='未完成' ? '未完成（生产中）' : s);

    const filterBar = `
        <div class="pf-filterbar prj-filterbar">
            <div class="pf-fld"><label>生产部门</label>
                <select id="prjDept">
                    <option value="all"${_prjState.dept==='all'?' selected':''}>全部部门</option>
                    ${_prjDepartments.map(d => `<option value="${d}"${_prjState.dept===d?' selected':''}>${d}</option>`).join('')}
                </select>
            </div>
            <div class="pf-fld"><label>项目名称</label>
                <input id="prjName" type="text" placeholder="项目名称" value="${_prjState.name||''}"/>
            </div>
            <div class="pf-fld"><label>年度</label>
                <select id="prjYear">${yearOpts.map(y => `<option value="${y}"${String(_prjState.year)===String(y)?' selected':''}>${y==='all'?'全部年度':y+'年'}</option>`).join('')}</select>
            </div>
            <div class="pf-fld"><label>项目状态</label>
                <select id="prjStatus">${statusOpts.map(s => `<option value="${s}"${_prjState.status===s?' selected':''}>${statusLabel(s)}</option>`).join('')}</select>
            </div>
            <div class="pf-actions">
                <button class="btn primary" id="prjQuery"><span class="material-symbols-rounded" style="font-size:16px">search</span>搜索</button>
                <label class="prj-mine"><input type="checkbox" id="prjMine"${_prjState.mine?' checked':''}/><span>我的项目</span></label>
            </div>
        </div>`;

    // 需求060101-三.2：将【外协进度】信息整合至项目列表 — 每个项目挂载若干外协合同作为父子展开行
    const _ospPhases = ['前期沟通','合同签订','开工实施','中期验收','收尾交付'];
    const _itemsWithOsp = items.map((p, gi) => {
        const idx = gi;
        // 仅部分项目带有外协合同（依据 id 末位决定），保持父子行的稀疏度
        const lastDigit = parseInt((p.id||'').replace(/\D/g,'').slice(-1) || '0', 10);
        const ctrCount = (lastDigit % 3); // 0~2 个外协合同，0 时无展开
        const lots = [];
        for (let k = 0; k < ctrCount; k++) {
            const vendorIdx = (idx + k) % ((window.MOCK_VENDORS && window.MOCK_VENDORS.length) || 1);
            const vendor = (window.MOCK_VENDORS && window.MOCK_VENDORS[vendorIdx]) ? window.MOCK_VENDORS[vendorIdx] : { name:'示例外协 ' + (vendorIdx+1) };
            const totalDays = 60 + ((idx + k) * 13) % 90;
            const usedDays  = Math.min(totalDays, 5 + ((idx + k * 7) % totalDays));
            const phase = _ospPhases[(idx + k) % _ospPhases.length];
            lots.push({
                _isOsp: true,
                ctrId: `WX-${(p.id||'').slice(-4)}-${String(k+1).padStart(2,'0')}`,
                vendor: vendor.name,
                amount: (50 + ((idx + k * 17) % 500)).toFixed(2),
                start: p.startDate || p.start || '2026-03-01',
                phase, totalDays, usedDays,
                progress: Math.round(usedDays / totalDays * 100),
                producer: p.producer || p.owner || '—'
            });
        }
        return Object.assign({}, p, { lots });
    });

    // 需求1301-5.3：列表字段 — 按图6 / 需求060101-三.2：项目名称为父子展开列，子行展示外协合同
    const cols = [
        { key:'_idx',   label:'序号',         w:'56px',  align:'center', render:(p,i)=>`<span class="cell-mute">${i+1}</span>`,
          lotRender: () => `` },
        { key:'_fill',  label:'信息填报',     w:'110px', render: p=>`<button class="btn btn-fill" data-prj-fill="${p.id}"><span class="material-symbols-rounded" style="font-size:14px">edit_note</span>信息填报</button>`,
          lotRender: () => `` },
        { key:'name',   label:'项目名称', expandCol:true, render: p=>p.name,
          lotRender: (lot, li, parent) => `<span class="cell-mute" style="font-size:12px">外协合同 · ${lot.ctrId}</span>` },
        { key:'ownerName', label:'业主名称',  w:'140px', render: p=>`<span class="cell-mute">${p.ownerName||'—'}</span>`,
          lotRender: (lot) => `<span class="chip w" style="font-size:11px">外协单位</span> ${lot.vendor}` },
        { key:'amount', label:'合同额(万)',    w:'100px', align:'right', render: p=>p.linkedContract ? `<span class="cell-amount">¥${p.amount}</span>` : `<span class="cell-mute">—</span>`,
          lotRender: (lot) => `<span class="cell-amount">¥${lot.amount}</span>` },
        { key:'producer', label:'生产负责人', w:'100px', render: p=>p.producer || p.owner || '—',
          lotRender: (lot) => lot.producer },
        { key:'businessContact', label:'商务联络人', w:'110px', render: p=>p.businessContact || '—',
          lotRender: (lot) => `<span class="chip ${lot.phase==='收尾交付'?'s':(lot.phase==='中期验收'?'a':'w')}" style="font-size:11px">${lot.phase}</span>` },
        { key:'startDate', label:'项目开工日期', w:'120px', render: p=>`<span class="cell-mute">${p.startDate||p.start||'—'}</span>`,
          lotRender: (lot) => `<span class="cell-mute">${lot.start}</span>` },
        { key:'_dur', label:'合同约定工期',    w:'110px', align:'right', render: p=>`<span class="cell-mute">${p.durDays||'—'} 天</span>`,
          lotRender: (lot) => `<div style="display:flex;align-items:center;gap:6px">
                <div class="prog" style="flex:1"><div class="bar ${lot.progress>=100?'s':(lot.progress>=80?'a':'p')}" style="width:${lot.progress}%"></div></div>
                <span style="font-size:11px;color:var(--text-2);min-width:50px;text-align:right">${lot.usedDays}/${lot.totalDays}</span>
            </div>` },
        { key:'_act', label:'操作', w:'180px', render: p=>`<span class="row-acts">
            <button class="btn btn-sm" data-prj-detail="${p.id}"><span class="material-symbols-rounded" style="font-size:14px">apartment</span>项目详情</button>
            <button class="btn btn-sm btn-warn prj-op-btn" data-prj-op="${p.id}"><span class="material-symbols-rounded" style="font-size:14px">tune</span>操作<span class="material-symbols-rounded" style="font-size:14px">expand_more</span></button>
        </span>`,
          lotRender: () => `` }
        // 需求2001-五.4：删除项目列表数据列表操作栏的 "添加事项" 按钮（事项已迁移至月日历看板）
    ];

    pg.innerHTML = `
        ${pageHeader('项目列表', '', `
            <button class="btn primary" id="prjBtnNew"><span class="material-symbols-rounded">add_business</span>新增项目</button>
            <button class="btn" id="prjBtnWeekly"><span class="material-symbols-rounded">summarize</span>周报</button>
        `)}
        <!-- 需求060101-三.3：将"项目创建"重命名为"项目列表" -->
        <div class="prj-section-title"><span class="ps-bar"></span><span>项目列表</span></div>
        ${filterBar}
        ${tableShell(cols, 'prjBody')}`;
    InfiniteList.bind({ source: _itemsWithOsp, pageSize: 14, container:'prjBody', render: tableRowExpandable(cols, null, { minLots:1, lotLabel:'外协合同' }) });

    // 绑定筛选
    $('#prjDept').onchange   = e => _prjState.dept   = e.target.value;
    $('#prjName').oninput    = e => _prjState.name   = e.target.value;
    $('#prjName').onkeydown  = e => { if (e.key === 'Enter') renderProjectList(); };
    $('#prjYear').onchange   = e => _prjState.year   = e.target.value;
    $('#prjStatus').onchange = e => _prjState.status = e.target.value;
    $('#prjMine').onchange   = e => { _prjState.mine = e.target.checked; renderProjectList(); };
    $('#prjQuery').onclick   = () => renderProjectList();

    // 顶部按钮
    $('#prjBtnNew').onclick    = () => openModal('新增项目', projectFormModal(), { width:'960px', height:'720px' });
    $('#prjBtnWeekly').onclick = () => openModal('项目周报模板', weeklyReportModal(), { width:'920px', height:'720px' });

    // 行内按钮（事件代理）
    pg.addEventListener('click', _prjListClick);
}
function _prjListClick(e){
    const fillBtn = e.target.closest && e.target.closest('[data-prj-fill]');
    if (fillBtn) {
        // 需求1301-5.3：信息填报 → 打开月日历事项看板（含"项目回款信息"类别）
        openCalendarBoard();
        return;
    }
    const detailBtn = e.target.closest && e.target.closest('[data-prj-detail]');
    if (detailBtn) {
        const id = detailBtn.dataset.prjDetail;
        openModal('项目详情 · ' + id, projectDetailModal(id), { width:'920px', height:'680px' });
        return;
    }
    // 需求1901-六.4：添加事项
    const addItemBtn = e.target.closest && e.target.closest('[data-prj-additem]');
    if (addItemBtn) {
        const id = addItemBtn.dataset.prjAdditem;
        openModal('添加事项 · ' + id, projectItemFormModal(id), { width:'720px', height:'620px' });
        return;
    }
    const opBtn = e.target.closest && e.target.closest('[data-prj-op]');
    if (opBtn) {
        e.stopPropagation();
        const id = opBtn.dataset.prjOp;
        _showPrjOpMenu(opBtn, id);
        return;
    }
}
function _showPrjOpMenu(anchor, id){
    document.querySelectorAll('.prj-op-menu').forEach(m => m.remove());
    const r = anchor.getBoundingClientRect();
    const menu = document.createElement('div');
    menu.className = 'prj-op-menu';
    menu.style.cssText = `position:fixed;top:${r.bottom+4}px;left:${r.left}px;z-index:300;background:var(--glass-bg-3);backdrop-filter:blur(18px) saturate(140%);border:1px solid var(--glass-border);border-radius:10px;box-shadow:var(--glass-shadow-2);padding:4px;min-width:130px`;
    menu.innerHTML = `
        <div class="prj-op-item" data-act="edit"><span class="material-symbols-rounded">edit</span>修改项目</div>
        <div class="prj-op-item" data-act="del"><span class="material-symbols-rounded">delete</span>删除项目</div>
        <div class="prj-op-item" data-act="archive"><span class="material-symbols-rounded">inventory_2</span>项目归档</div>`;
    document.body.appendChild(menu);
    const close = () => { menu.remove(); document.removeEventListener('click', close); };
    setTimeout(() => document.addEventListener('click', close), 0);
    menu.querySelectorAll('.prj-op-item').forEach(it => it.onclick = (ev) => {
        ev.stopPropagation();
        const act = it.dataset.act;
        close();
        if (act === 'edit')    openModal('修改项目 · ' + id, projectFormModal(id), { width:'960px', height:'720px' });
        else if (act === 'del') confirm('确认删除项目 ' + id + ' ？（演示）');
        else if (act === 'archive') alert('已归档项目 ' + id + ' （演示）');
    });
}

// ============ 项目管理：已完成项目（需求1901-六.1：用 生产部门 替换 项目类型） ============
window._prjDoneState = { dept:'all', name:'', year:'all', producer:'all' };
function renderProjectDone(){
    const pg = $('#pages');
    let items = filterByRole(MOCK_PROJECTS.filter(p=>p.status==='已完成'), ['owner']);
    if (_prjDoneState.dept !== 'all') items = items.filter(p => p.department === _prjDoneState.dept);
    if (_prjDoneState.name) items = items.filter(p => (p.name||'').includes(_prjDoneState.name));
    if (_prjDoneState.year !== 'all') items = items.filter(p => String(p.year) === String(_prjDoneState.year));
    if (_prjDoneState.producer !== 'all') items = items.filter(p => (p.producer||p.owner) === _prjDoneState.producer);

    const yearOpts = ['all', 2024, 2025, 2026];
    const producerOpts = ['all', ...Array.from(new Set(MOCK_PROJECTS.map(p => p.producer || p.owner)))];

    const filterBar = `
        <div class="pf-filterbar prj-filterbar">
            <div class="pf-fld"><label>生产部门</label>
                <select id="prjdDept">
                    <option value="all"${_prjDoneState.dept==='all'?' selected':''}>全部部门</option>
                    ${(_prjDepartments||[]).map(d => `<option value="${d}"${_prjDoneState.dept===d?' selected':''}>${d}</option>`).join('')}
                </select>
            </div>
            <div class="pf-fld"><label>项目名称</label>
                <input id="prjdName" type="text" placeholder="项目名称" value="${_prjDoneState.name||''}"/>
            </div>
            <div class="pf-fld"><label>年度</label>
                <select id="prjdYear">${yearOpts.map(y => `<option value="${y}"${String(_prjDoneState.year)===String(y)?' selected':''}>${y==='all'?'全部年度':y+'年'}</option>`).join('')}</select>
            </div>
            <div class="pf-fld"><label>生产负责人</label>
                <select id="prjdProducer">${producerOpts.map(p => `<option value="${p}"${_prjDoneState.producer===p?' selected':''}>${p==='all'?'全部负责人':p}</option>`).join('')}</select>
            </div>
            <div class="pf-actions">
                <button class="btn primary" id="prjdQuery"><span class="material-symbols-rounded" style="font-size:16px">search</span>搜索</button>
            </div>
        </div>`;

    // 需求1301-5.6：列表字段同图6
    const cols = [
        { key:'_idx',   label:'序号',         w:'56px',  align:'center', render:(p,i)=>`<span class="cell-mute">${i+1}</span>` },
        { key:'_fill',  label:'信息填报',     w:'110px', render: p=>`<button class="btn btn-fill" data-prj-fill="${p.id}"><span class="material-symbols-rounded" style="font-size:14px">edit_note</span>信息填报</button>` },
        { key:'name',   label:'项目名称',      render: p=>p.name },
        { key:'ownerName', label:'业主名称',  w:'140px', render: p=>`<span class="cell-mute">${p.ownerName||'—'}</span>` },
        { key:'amount', label:'合同额(万)',    w:'100px', align:'right', render: p=>p.linkedContract ? `<span class="cell-amount">¥${p.amount}</span>` : `<span class="cell-mute">—</span>` },
        { key:'producer', label:'生产负责人', w:'100px', render: p=>p.producer || p.owner || '—' },
        { key:'businessContact', label:'商务联络人', w:'110px', render: p=>p.businessContact || '—' },
        { key:'startDate', label:'项目开工日期', w:'120px', render: p=>`<span class="cell-mute">${p.startDate||p.start||'—'}</span>` },
        { key:'_dur', label:'合同约定工期',    w:'110px', align:'right', render: p=>`<span class="cell-mute">${p.durDays||'—'} 天</span>` },
        { key:'_act', label:'操作', w:'160px', render: p=>`<span class="row-acts">
            <button class="btn btn-sm" data-prj-detail="${p.id}"><span class="material-symbols-rounded" style="font-size:14px">apartment</span>项目详情</button>
            <button class="btn btn-sm" data-prj-archive="${p.id}"><span class="material-symbols-rounded" style="font-size:14px">archive</span>档案</button>
        </span>` }
    ];

    pg.innerHTML = `
        ${pageHeader('已完成项目', '', `
            <button class="btn"><span class="material-symbols-rounded">file_download</span>导出</button>
        `)}
        ${filterBar}
        ${tableShell(cols, 'prjDoneBody')}`;
    InfiniteList.bind({ source: items, pageSize: 14, container:'prjDoneBody', render: tableRow(cols) });

    $('#prjdDept').onchange     = e => _prjDoneState.dept     = e.target.value;
    $('#prjdName').oninput      = e => _prjDoneState.name     = e.target.value;
    $('#prjdName').onkeydown    = e => { if (e.key === 'Enter') renderProjectDone(); };
    $('#prjdYear').onchange     = e => _prjDoneState.year     = e.target.value;
    $('#prjdProducer').onchange = e => _prjDoneState.producer = e.target.value;
    $('#prjdQuery').onclick     = () => renderProjectDone();
    pg.addEventListener('click', _prjListClick);
}

// ====== 新增 / 编辑 项目 弹窗（需求1301-5.2：关联合同开关 → 两种模式） ======
window.projectFormModal = function(id){
    const p = id ? MOCK_PROJECTS.find(x => x.id === id) : null;
    const v = (k, def='') => (p && p[k] != null) ? String(p[k]).replace(/"/g,'&quot;') : def;
    const sel = (val, opts) => opts.map(o => `<option value="${o}"${o===val?' selected':''}>${o}</option>`).join('');
    const linked = p ? !!p.linkedContract : true;  // 默认开启关联合同
    const departments = ['遥感事业部','采集事业部','编辑事业部','制图事业部','软件研发事业部','工程测量项目组'];
    const vps = ['李副总','张副总','陈副总','吴副总'];
    const producers = ['李明','张华','王芳','赵磊','陈静','吴强','刘洋','周婷'];
    const members = ['王明','刘洋','周婷','吴强','陈静','赵磊','张华','王芳','李明','李志刚','马满庄'];
    return `
    <div class="bf-form" id="prj-form" data-linked="${linked?'1':'0'}">
        <div class="bf-section prj-mode-row">
            <span>项目模式</span>
            <label class="bf-switch prj-link-switch" style="margin-left:auto">
                <input type="checkbox" id="prj-link" ${linked?'checked':''}/>
                <span class="bf-switch-slider"></span>
                <span class="bf-switch-txt">关联合同（开启则从合同自动同步）</span>
            </label>
        </div>

        <div class="bf-section">基础信息</div>
        <div class="bf-grid">
            <div class="bf-cell prj-only-linked"><label>合同编号 <i>*</i></label>
                <div class="bf-search-input"><span class="material-symbols-rounded">search</span>
                    <input class="bf-ipt" id="prj-contract" placeholder="搜索关联合同（如 HT-C-26101）" value="${v('contractId')}"/>
                </div>
            </div>
            <div class="bf-cell"><label>项目名称 <i>*</i></label>
                <input class="bf-ipt prj-auto-name" placeholder="${linked?'从合同自动带出，不可修改':'手动输入项目名称'}" value="${v('name')}" ${linked?'readonly':''}/>
            </div>
            <div class="bf-cell"><label>项目编码</label>
                <input class="bf-ipt" placeholder="自动生成 / 手动输入" value="${v('id','PRJ' + new Date().getTime().toString().slice(-6))}"/>
            </div>
            <div class="bf-cell"><label>负责部门 <i>*</i></label>
                <select class="bf-ipt">${sel(v('department','遥感事业部'), departments)}</select>
            </div>
            <div class="bf-cell prj-only-linked"><label>业主名称 <i>*</i></label>
                <input class="bf-ipt prj-auto-owner" placeholder="从合同自动带出，不可修改" value="${v('ownerName')}" readonly/>
            </div>
            <div class="bf-cell prj-only-manual" style="${linked?'display:none':''}"><label>业主名称 <i>*</i></label>
                <input class="bf-ipt" placeholder="手动输入业主名称" value="${v('ownerName')}"/>
            </div>
            <div class="bf-cell"><label>商务联络人 <i>*</i></label>
                <input class="bf-ipt prj-auto-bizc" placeholder="${linked?'从合同自动带出，可修改':'手动输入'}" value="${v('businessContact')}"/>
            </div>
            <div class="bf-cell"><label>项目类型 <i>*</i></label>
                <select class="bf-ipt">${sel(v('type','A'), ['A','B','C'])}</select>
            </div>
            <div class="bf-cell"><label>合同约定工期</label>
                <input class="bf-ipt prj-auto-dur" type="number" placeholder="${linked?'从合同自动带出，可修改':'天数'}" value="${v('durDays')}"/>
            </div>
            <div class="bf-cell"><label>项目开工日期 <i>*</i></label>
                <input class="bf-ipt" type="date" value="${v('startDate', v('start'))}"/>
            </div>
            <div class="bf-cell"><label>生产负责人 <i>*</i></label>
                <select class="bf-ipt prj-auto-producer">${sel(v('producer','李明'), producers)}</select>
            </div>
            <div class="bf-cell"><label>主管副总</label>
                <select class="bf-ipt">${sel(v('vp','李副总'), vps)}</select>
            </div>
            <div class="bf-cell bf-span-2"><label>参与人员</label>
                <div class="bf-search-input"><span class="material-symbols-rounded">group</span>
                    <input class="bf-ipt" placeholder="选择参与人员（演示：以 、 分隔）" value="${v('team')}"/>
                </div>
            </div>
        </div>

        <div class="bf-section prj-only-linked">关联合同概览</div>
        <div class="bf-grid prj-only-linked prj-contract-summary">
            <div class="bf-cell"><label>合同额（万）</label>
                <input class="bf-ipt" value="${v('amount')}" readonly/>
            </div>
            <div class="bf-cell"><label>归属年份</label>
                <input class="bf-ipt" value="${v('year','2026')}" readonly/>
            </div>
            <div class="bf-cell bf-span-2"><label>合同摘要</label>
                <textarea class="bf-ipt" rows="2" readonly>合同 ${v('contractId','—')} · ${v('ownerName','—')} · ${v('amount','—')} 万 · 签订于 ${v('startDate','—')}</textarea>
            </div>
        </div>

        <div class="bf-foot">
            <button class="btn" onclick="closeModal()">取消</button>
            <button class="btn primary" onclick="closeModal()"><span class="material-symbols-rounded" style="font-size:16px">save</span>保存</button>
        </div>
    </div>`;
};
// 关联合同开关：联动显示/隐藏字段
document.addEventListener('change', function(e){
    if (e.target && e.target.id === 'prj-link') {
        const form = document.getElementById('prj-form'); if (!form) return;
        const linked = e.target.checked;
        form.dataset.linked = linked ? '1' : '0';
        form.querySelectorAll('.prj-only-linked').forEach(el => el.style.display = linked ? '' : 'none');
        form.querySelectorAll('.prj-only-manual').forEach(el => el.style.display = linked ? 'none' : '');
        // 切换"自动带出/手动输入"提示
        const name = form.querySelector('.prj-auto-name'); if (name) { name.placeholder = linked ? '从合同自动带出，不可修改' : '手动输入项目名称'; if (linked) name.setAttribute('readonly',''); else name.removeAttribute('readonly'); }
        const bizc = form.querySelector('.prj-auto-bizc'); if (bizc) bizc.placeholder = linked ? '从合同自动带出，可修改' : '手动输入';
        const dur  = form.querySelector('.prj-auto-dur');  if (dur)  dur.placeholder  = linked ? '从合同自动带出，可修改' : '天数';
    }
});

// ====== 项目详情弹窗（精简版 + 项目节点进度） ======
window.projectDetailModal = function(id){
    const p = MOCK_PROJECTS.find(x => x.id === id); if (!p) return '<div style="padding:40px;text-align:center">未找到项目</div>';
    // 需求1901-六.3：项目详情显示节点进度（与投标查看一致：7 个固定节点）
    const isDone = p.status === '已完成';
    const isInProgress = p.status === '实施中' || p.status === '初验中' || p.status === '终验中';
    const baseDay = new Date(p.startDate || p.start || '2026-01-01');
    const addDays = (d, n) => { const t = new Date(d); t.setDate(t.getDate()+n); return t.toISOString().slice(0,10); };
    const nodeGroups = [
        { title:'项目创建', date: addDays(baseDay, -20), steps:['中标通知书上传','立项审批通过'] },
        { title:'合同签订', date: addDays(baseDay, -10), steps:['合同原件归档'] },
        { title:'项目开工', date: addDays(baseDay, 0),   steps:[] },
        { title:'项目完工', date: isDone ? addDays(baseDay, (+p.durDays||120)) : '', steps:[] },
        { title:'项目结项', date: isDone ? addDays(baseDay, (+p.durDays||120)+15) : '', steps:['完工自检','甲方验收','项目正式结项'] },
        { title:'合同完成', date: isDone ? addDays(baseDay, (+p.durDays||120)+45) : '', steps:['尾款到账','合同正式终止'] },
        { title:'合同外',   date: '', steps:['合同变更申请','合同外款项到账'] }
    ];
    nodeGroups.forEach((g, i) => {
        if (isDone && i < 6) g.state = 'done';
        else if (isDone) g.state = 'todo';
        else if (i < 3) g.state = 'done';
        else if (i === 3 && isInProgress) g.state = 'doing';
        else g.state = 'todo';
    });
    const stIcon = (s) => s === 'done' ? 'check' : (s === 'doing' ? 'pending' : 'remove');
    const stText = (s) => s === 'done' ? '已完成' : (s === 'doing' ? '进行中' : '未开始');
    const tlHtml = nodeGroups.map(g => `
        <div class="node-tl-item ${g.state}">
            <div class="node-tl-dot"><span class="material-symbols-rounded" style="font-size:14px">${stIcon(g.state)}</span></div>
            <div class="node-tl-body">
                <div class="node-tl-title">${g.title}<span class="node-st">${stText(g.state)}</span></div>
                <div class="node-tl-meta">
                    ${g.date ? `<span><b>完成日期</b> ${g.date}</span>` : `<span style="color:var(--text-3)">待办</span>`}
                </div>
                ${g.steps.length ? `<div class="node-tl-steps">${g.steps.map(s => `<span class="node-tl-step ${g.state==='done'?'s':(g.state==='doing'?'p':'')}"><span class="material-symbols-rounded" style="font-size:13px;vertical-align:-2px">${g.state==='done'?'check_circle':'radio_button_unchecked'}</span>${s}</span>`).join('')}</div>` : ''}
            </div>
        </div>`).join('');
    // 需求2001-五.3：项目详情字段按表 1 严格调整（14 个字段）
    const signDate = p.signDate || (p.start ? new Date(p.start).toISOString().slice(0,10) : '—');
    const endDate  = p.endDate  || (p.startDate ? new Date(new Date(p.startDate).getTime() + (+p.durDays||120)*86400000).toISOString().slice(0,10) : '—');
    const dateRange = `${p.startDate||p.start||'—'} ~ ${endDate}`;
    return `
    <div style="display:flex;align-items:center;gap:14px;margin-bottom:18px">
        <div style="width:48px;height:48px;border-radius:14px;background:linear-gradient(135deg,var(--primary),var(--primary-2));display:grid;place-items:center;color:#fff"><span class="material-symbols-rounded" style="font-size:22px">apartment</span></div>
        <div style="flex:1"><div style="font-size:18px;font-weight:700">${p.name}</div><div style="font-size:12px;color:var(--text-3)">${p.id} · ${p.ownerName||'—'}</div></div>
        <span class="chip ${p.statusColor}">${p.status}</span>
    </div>
    <div class="bf-grid">
        <div class="bf-cell bf-span-2"><label>项目名称</label><input class="bf-ipt" value="${p.name||'—'}" readonly/></div>
        <div class="bf-cell"><label>项目编码</label><input class="bf-ipt" value="${p.id||'—'}" readonly/></div>
        <div class="bf-cell"><label>项目类型</label><input class="bf-ipt" value="${p.type||'A'}" readonly/></div>
        <div class="bf-cell"><label>业主联系人</label><input class="bf-ipt" value="${p.ownerContact||p.businessContact||'—'}" readonly/></div>
        <div class="bf-cell"><label>合同编号</label><input class="bf-ipt" value="${p.contractId||'—'}" readonly/></div>
        <div class="bf-cell"><label>合同额（万）</label><input class="bf-ipt" value="${p.amount}" readonly/></div>
        <div class="bf-cell"><label>合同签订时间</label><input class="bf-ipt" value="${signDate}" readonly/></div>
        <div class="bf-cell"><label>负责部门</label><input class="bf-ipt" value="${p.department||'—'}" readonly/></div>
        <div class="bf-cell"><label>项目负责人</label><input class="bf-ipt" value="${p.producer||p.owner||'—'}" readonly/></div>
        <div class="bf-cell"><label>商务联络人</label><input class="bf-ipt" value="${p.businessContact||'—'}" readonly/></div>
        <div class="bf-cell"><label>主管 / 副总</label><input class="bf-ipt" value="${p.vp||'—'}" readonly/></div>
        <div class="bf-cell bf-span-2"><label>参与人员</label><input class="bf-ipt" value="${p.team||'—'}" readonly/></div>
        <div class="bf-cell"><label>合同约订工期</label><input class="bf-ipt" value="${p.durDays} 天" readonly/></div>
        <div class="bf-cell bf-span-2"><label>工期起止时间</label><input class="bf-ipt" value="${dateRange}" readonly/></div>
    </div>
    <div style="margin-top:18px;padding-top:14px;border-top:1px solid var(--glass-border)">
        <h4 style="margin:0 0 12px;font-size:13px;font-weight:600;display:flex;align-items:center;gap:6px"><span class="material-symbols-rounded" style="font-size:16px;color:var(--primary)">timeline</span>项目节点</h4>
        <div class="node-timeline">${tlHtml}</div>
    </div>
    <div class="bf-foot"><button class="btn primary" onclick="closeModal()">关闭</button></div>`;
};

// 需求1901-六.4：项目 添加事项 弹窗（5 种类别 → 不同字段）
window.projectItemFormModal = function(prjId){
    const itemCats = ['项目回款','项目变更','项目验收','项目暂停','项目其他事项'];
    const sel = (val, opts) => opts.map(o => `<option value="${o}"${o===val?' selected':''}>${o}</option>`).join('');
    // 不同类别字段配置：
    // 项目回款：回款时间 / 回款金额 / 回款类型 / 备注
    // 项目变更：变更时间 / 变更金额 / 变更原因 / 备注
    // 项目验收：验收类型 / 验收时间 / 验收结论 / 备注
    // 项目暂停：暂停时间 / 预计恢复时间 / 暂停原因 / 备注
    // 项目其他事项：事项时间 / 事项标题 / 事项描述 / 备注
    return `
    <div class="bf-form" id="item-form">
        <div class="bf-section">事项信息</div>
        <div class="bf-grid">
            <div class="bf-cell"><label>关联项目</label>
                <input class="bf-ipt" value="${prjId}" readonly/>
            </div>
            <div class="bf-cell"><label>事项类别 <i>*</i></label>
                <select class="bf-ipt" id="itemCat">${sel('项目回款', itemCats)}</select>
            </div>
        </div>
        <div class="bf-grid item-form-grid" id="itemFieldsWrap">
            ${itemFieldsFor('项目回款')}
        </div>
        <div class="bf-foot">
            <button class="btn" onclick="closeModal()">取消</button>
            <button class="btn primary" onclick="closeModal()"><span class="material-symbols-rounded" style="font-size:16px">save</span>保存事项</button>
        </div>
    </div>`;
};
function itemFieldsFor(cat){
    if (cat === '项目回款') return `
        <div class="bf-cell"><label>回款时间 <i>*</i></label><input class="bf-ipt" type="date" value="${new Date().toISOString().slice(0,10)}"/></div>
        <div class="bf-cell"><label>回款金额（万） <i>*</i></label><input class="bf-ipt" type="number" placeholder="0.00"/></div>
        <div class="bf-cell"><label>回款类型 <i>*</i></label>
            <select class="bf-ipt"><option>预付款</option><option>进度款</option><option>验收款</option><option>尾款</option></select>
        </div>
        <div class="bf-cell"><label>回款方</label><input class="bf-ipt" placeholder="付款方单位名称"/></div>
        <div class="bf-cell bf-span-2"><label>备注</label><textarea class="bf-ipt" rows="2" placeholder="补充说明"></textarea></div>`;
    if (cat === '项目变更') return `
        <div class="bf-cell"><label>变更时间 <i>*</i></label><input class="bf-ipt" type="date" value="${new Date().toISOString().slice(0,10)}"/></div>
        <div class="bf-cell"><label>变更金额（万）</label><input class="bf-ipt" type="number" placeholder="0.00 / 0 表示无金额变化"/></div>
        <div class="bf-cell bf-span-2"><label>变更类型 <i>*</i></label>
            <select class="bf-ipt"><option>工期变更</option><option>金额变更</option><option>范围变更</option><option>其它变更</option></select>
        </div>
        <div class="bf-cell bf-span-2"><label>变更原因 <i>*</i></label><textarea class="bf-ipt" rows="3" placeholder="变更说明"></textarea></div>`;
    if (cat === '项目验收') return `
        <div class="bf-cell"><label>验收类型 <i>*</i></label>
            <select class="bf-ipt"><option>初验</option><option>终验</option><option>专项验收</option></select>
        </div>
        <div class="bf-cell"><label>验收时间 <i>*</i></label><input class="bf-ipt" type="date" value="${new Date().toISOString().slice(0,10)}"/></div>
        <div class="bf-cell"><label>验收结论 <i>*</i></label>
            <select class="bf-ipt"><option>通过</option><option>有条件通过</option><option>未通过</option></select>
        </div>
        <div class="bf-cell"><label>验收方</label><input class="bf-ipt" placeholder="甲方/第三方机构名称"/></div>
        <div class="bf-cell bf-span-2"><label>验收意见</label><textarea class="bf-ipt" rows="2" placeholder="验收意见与整改要求"></textarea></div>`;
    if (cat === '项目暂停') return `
        <div class="bf-cell"><label>暂停时间 <i>*</i></label><input class="bf-ipt" type="date" value="${new Date().toISOString().slice(0,10)}"/></div>
        <div class="bf-cell"><label>预计恢复时间</label><input class="bf-ipt" type="date"/></div>
        <div class="bf-cell bf-span-2"><label>暂停类型 <i>*</i></label>
            <select class="bf-ipt"><option>甲方原因</option><option>乙方原因</option><option>政策原因</option><option>不可抗力</option><option>其它</option></select>
        </div>
        <div class="bf-cell bf-span-2"><label>暂停原因 <i>*</i></label><textarea class="bf-ipt" rows="3" placeholder="暂停事由与影响范围"></textarea></div>`;
    // 项目其他事项
    return `
        <div class="bf-cell"><label>事项时间 <i>*</i></label><input class="bf-ipt" type="date" value="${new Date().toISOString().slice(0,10)}"/></div>
        <div class="bf-cell"><label>事项标题 <i>*</i></label><input class="bf-ipt" placeholder="一句话概述事项"/></div>
        <div class="bf-cell bf-span-2"><label>事项描述 <i>*</i></label><textarea class="bf-ipt" rows="4" placeholder="详细说明该事项"></textarea></div>`;
}
// 事项类别 切换 → 动态替换字段（委托 change 事件）
document.addEventListener('change', function(e){
    if (e.target && e.target.id === 'itemCat') {
        const wrap = document.getElementById('itemFieldsWrap');
        if (wrap) wrap.innerHTML = itemFieldsFor(e.target.value);
    }
});

// ====== 周报模板弹窗（需求1301-5.4） ======
window.weeklyReportModal = function(prjId){
    const p = prjId ? MOCK_PROJECTS.find(x => x.id === prjId) : MOCK_PROJECTS[0];
    // 周期：当前周
    const today = new Date();
    const monday = new Date(today); monday.setDate(today.getDate() - ((today.getDay()+6)%7));
    const sunday = new Date(monday); sunday.setDate(monday.getDate()+6);
    const fmt = d => `${d.getFullYear()}年${String(d.getMonth()+1).padStart(2,'0')}月${String(d.getDate()).padStart(2,'0')}日`;
    const totalDone = 86, weekDone = 12;
    const progressPct = Math.min(100, Math.round((totalDone) / (totalDone+24) * 100));
    return `
    <div class="wr-form">
        <!-- (1) 周报周期 -->
        <div class="wr-block wr-period">
            <div class="wr-block-h"><span class="wr-num">1</span><span class="wr-label">周报周期</span><span class="wr-hint">根据日报看板自动获取日期</span></div>
            <div class="wr-period-val">${fmt(monday)} - ${fmt(sunday)}</div>
        </div>

        <!-- (2) 项目详情固定信息区 -->
        <div class="wr-block">
            <div class="wr-block-h"><span class="wr-num">2</span><span class="wr-label">项目详情固定信息</span><span class="wr-hint">系统自动同步，无需重复填写</span></div>
            <div class="wr-grid">
                <div class="wr-cell"><label>项目名称</label><div class="wr-val">${p.name}</div></div>
                <div class="wr-cell"><label>项目类型</label><div class="wr-val">${p.type}</div></div>
                <div class="wr-cell"><label>项目负责人</label><div class="wr-val">${p.producer||p.owner}</div></div>
                <div class="wr-cell"><label>负责部门</label><div class="wr-val">${p.department||'—'}</div></div>
                <div class="wr-cell"><label>合同金额</label><div class="wr-val">¥ ${p.amount} 万</div></div>
                <div class="wr-cell"><label>工期起止时间</label><div class="wr-val">${p.startDate||p.start} ~ ${p.end}</div></div>
                <div class="wr-cell"><label>商务联络人</label><div class="wr-val">${p.businessContact||'—'}</div></div>
                <div class="wr-cell"><label>项目编号</label><div class="wr-val">${p.id}</div></div>
            </div>
            <div class="wr-milestone">
                <div class="wr-mile-label">项目进度里程碑时间轴</div>
                <div class="wr-mile-track">
                    <div class="wr-mile-step done"><span class="dot"></span><div class="lbl">项目创建</div><div class="dt">${p.start||'—'}</div></div>
                    <div class="wr-mile-step done"><span class="dot"></span><div class="lbl">合同签订</div><div class="dt">${p.startDate||p.start||'—'}</div></div>
                    <div class="wr-mile-step active"><span class="dot"></span><div class="lbl">项目结项</div><div class="dt">${p.end||'—'}</div></div>
                    <div class="wr-mile-step"><span class="dot"></span><div class="lbl">合同完成</div><div class="dt">—</div></div>
                    <div class="wr-mile-step"><span class="dot"></span><div class="lbl">合同外</div><div class="dt">—</div></div>
                </div>
            </div>
        </div>

        <!-- (3) 周报核心填报 -->
        <div class="wr-block">
            <div class="wr-block-h"><span class="wr-num">3</span><span class="wr-label">本周填报内容</span><span class="wr-hint">按周更新</span></div>
            <div class="wr-progress">
                <label>项目进度</label>
                <div class="wr-bar"><div class="wr-bar-fill" style="width:${progressPct}%"></div></div>
                <span class="wr-bar-pct">${progressPct}%</span>
                <span class="wr-bar-meta">总体 ${totalDone} · 本周 +${weekDone}</span>
            </div>
            <div class="wr-grid">
                <div class="wr-cell"><label>总体完成数量</label><input class="bf-ipt" type="number" value="${totalDone}"/></div>
                <div class="wr-cell"><label>本周完成数量</label><input class="bf-ipt" type="number" value="${weekDone}"/></div>
                <div class="wr-cell"><label>全部人员数量</label><input class="bf-ipt" type="number" value="${p.members||5}"/></div>
                <div class="wr-cell"><label>新增人员数量</label><input class="bf-ipt" type="number" value="1"/></div>
                <div class="wr-cell"><label>业务培训数量</label><input class="bf-ipt" type="number" value="2"/></div>
                <div class="wr-cell"><label>沟通协调次数</label><input class="bf-ipt" type="number" value="6"/></div>
                <div class="wr-cell bf-span-2"><label>业务培训内容</label><textarea class="bf-ipt" rows="2" placeholder="逐条填写">1. 数据采集规范培训\n2. 安全操作流程</textarea></div>
                <div class="wr-cell bf-span-2"><label>沟通协调内容</label><textarea class="bf-ipt" rows="2" placeholder="逐条填写">1. 与业主对接验收节点\n2. 协调外协单位现场进场</textarea></div>
                <div class="wr-cell"><label>待解决问题数量</label><input class="bf-ipt" type="number" value="1"/></div>
                <div class="wr-cell"><label>问题等级</label><select class="bf-ipt"><option>普通</option><option>紧急</option><option>严重</option></select></div>
                <div class="wr-cell bf-span-2"><label>待解决问题详情</label><textarea class="bf-ipt" rows="2" placeholder="逐条填写">现场网络环境不稳定，待业主信息中心协助处理</textarea></div>
            </div>
        </div>

        <div class="bf-foot">
            <button class="btn" onclick="closeModal()">取消</button>
            <button class="btn primary" onclick="closeModal()"><span class="material-symbols-rounded" style="font-size:16px">save</span>保存周报</button>
        </div>
    </div>`;
};

// ============ 费用报销：出差费用报销（需求1401-2 改造） ============
// 人民币金额转中文大写（精度到 元 / 角 / 分；零元保留"零元整"提示）
function amountToChineseRMB(amount){
    const n = Math.abs(+amount || 0);
    if (n === 0) return '零元整';
    const digits = ['零','壹','贰','叁','肆','伍','陆','柒','捌','玖'];
    const innerUnits = ['','拾','佰','仟'];
    const sectionUnits = ['','万','亿','兆'];
    const yuan = Math.floor(n);
    const fenTotal = Math.round((n - yuan) * 100);
    let s = '';
    if (yuan > 0) {
        const str = String(yuan);
        const sections = [];
        let rest = str;
        while (rest.length) { sections.unshift(rest.slice(-4)); rest = rest.slice(0, -4); }
        for (let si = 0; si < sections.length; si++) {
            const sec = sections[si];
            let secStr = '';
            let pendingZero = false;
            for (let i = 0; i < sec.length; i++) {
                const d = +sec[i];
                if (d === 0) { pendingZero = secStr.length > 0; }
                else {
                    if (pendingZero) { secStr += '零'; pendingZero = false; }
                    secStr += digits[d] + innerUnits[sec.length - 1 - i];
                }
            }
            if (secStr) s += secStr + sectionUnits[sections.length - 1 - si];
            else if (s && !s.endsWith('零')) s += '零';
        }
        s = s.replace(/零+$/, '');
    }
    s += '元';
    if (fenTotal === 0) { s += '整'; }
    else {
        const j = Math.floor(fenTotal / 10), f = fenTotal % 10;
        if (j) s += digits[j] + '角';
        if (f) s += digits[f] + '分';
        else if (j) s += '整';
    }
    return s;
}
window.amountToChineseRMB = amountToChineseRMB;

function renderExpenseTrip(){
    const pg = $('#pages');
    // 需求1901-8.2：差旅报销 费用类型仅 项目出差 / 公务出差
    const tripTypes = ['项目出差','公务出差'];
    const items = filterByRole(MOCK_TRIP, ['user']).map((x,i)=>({...x, type: tripTypes[i%2]}));
    const cntType = (ty) => items.filter(c=>c.type===ty).length;
    const cols = [
        { key:'type',          label: State.lang==='en'?'Expense Type':'费用类型', w:'110px', render: x=>`<span class="chip ${x.type==='项目出差'?'p':'a'}">${tt(x.type)}</span>` },
        { key:'project',       label: State.lang==='en'?'Project':'项目名称', render: x=>x.project ? x.project : `<span class="cell-mute">无需填写项目</span>` },
        { key:'reimburseDate', label: State.lang==='en'?'Reimburse Date':'报销日期', w:'120px', render: x=>`<span class="cell-mute">${x.reimburseDate||x.start}</span>` },
        { key:'amount',        label: State.lang==='en'?'Amount':'报销金额', w:'120px', align:'right', render: x=>`<span class="cell-amount">¥${(+x.amount).toLocaleString('zh-CN')}</span>` },
        { key:'reviewer',      label: State.lang==='en'?'Reviewer':'审核人', w:'100px', render: x=>x.reviewer||'—' },
        { key:'members',       label: State.lang==='en'?'Reimbursers':'报销人员', render: x=>`<span class="cell-tags">${(x.members||[]).map(m=>`<span class="cell-tag">${m}</span>`).join('')}</span>` },
        { key:'status',        label: t('common.status'),   w:'90px',  render: x=>`<span class="chip ${x.statusC}">${tt(x.status)}</span>` },
        { key:'_act',          label: t('common.action'),   w:'100px', render: x=>`<span class="row-acts"><button class="btn-icon" data-trip-detail="${x.id}" title="${t('btn.detail')}"><span class="material-symbols-rounded">visibility</span></button>${x.status==='待审批'?'<button class="btn-icon" title="'+t('btn.approve')+'" style="color:var(--emerald)"><span class="material-symbols-rounded">check_circle</span></button>':''}</span>` }
    ];
    pg.innerHTML = `
        ${pageHeader(State.lang==='en'?'Travel Reimbursement':'差旅报销', `${t('page.totalCount',{n:items.length})}`, `
            <button class="btn"><span class="material-symbols-rounded">file_download</span>${t('btn.export')}</button>
            <button class="btn primary" id="tripBtnNew"><span class="material-symbols-rounded">add</span>${t('btn.new')}</button>
        `)}
        ${statRow([
            { l: tt('项目出差'), v: cntType('项目出差'), c:'p' },
            { l: tt('公务出差'), v: cntType('公务出差'), c:'a' }
        ])}
        ${toolbar({
            filters:[
                { value:'all',     label:t('common.all'),      active:true, count: items.length },
                { value:'项目出差', label:tt('项目出差'), count: cntType('项目出差') },
                { value:'公务出差', label:tt('公务出差'), count: cntType('公务出差') }
            ],
            searchPh: State.lang==='en'?'Search project / reviewer…':'搜索项目 / 审核人 / 报销人员…'
        })}
        ${tableShell(cols, 'tripBody')}`;
    InfiniteList.bind({ source: items, pageSize: 14, container:'tripBody', render: tableRow(cols) });
    $('#tripBtnNew').onclick = () => openModal('新增差旅报销', tripFormModal(), { width:'920px', height:'620px' });
}
function pickTypeColor(t){
    return t==='管理费用'?'p':t==='市场费用'?'a':t==='研发费用'?'s':'w';
}

// 需求1401-2.1 新增 出差费用报销 表单
window.tripFormModal = function(id){
    const x = id ? MOCK_TRIP.find(t => t.id === id) : null;
    const v = (k, d='') => (x && x[k] != null) ? String(x[k]).replace(/"/g,'&quot;') : d;
    const reviewers = ['李副总','张副总','陈副总','吴副总'];
    // 需求1901-8.2：差旅报销 费用类型为 项目出差 / 公务出差
    const expTypes  = ['项目出差','公务出差'];
    const members = (x && x.members) || ['admin'];
    const totalDefault = x ? +x.amount : 0;
    return `
    <div class="bf-form" id="trip-form">
        <!-- 顶部提示 -->
        <div class="bf-notice bf-notice-warn">
            <span class="material-symbols-rounded">priority_high</span>
            <span>报销单填写金额须与纸质报销单保持一致，且已经过财务审批方可发起线上报销！</span>
        </div>

        <!-- (2) 基本信息区 -->
        <div class="bf-section">基本信息</div>
        <div class="bf-grid">
            <div class="bf-cell"><label>费用类型 <i>*</i></label>
                <select class="bf-ipt"><option value="">请选择费用类型</option>${expTypes.map(o=>`<option ${v('type')===o?'selected':''}>${o}</option>`).join('')}</select>
            </div>
            <div class="bf-cell"><label>项目名称</label>
                <input class="bf-ipt" placeholder="无需填写项目" value="${v('project')}"/>
            </div>
            <div class="bf-cell bf-span-2"><label>起止时间</label>
                <div class="bf-date-range">
                    <input class="bf-ipt" type="date" value="${v('start')}"/>
                    <span class="bf-date-sep">-</span>
                    <input class="bf-ipt" type="date" value="${v('end')}"/>
                </div>
            </div>
            <div class="bf-cell"><label>报销日期 <i>*</i></label>
                <input class="bf-ipt" type="date" placeholder="请输入报销日期" value="${v('reimburseDate')}"/>
            </div>
            <div class="bf-cell"><label>交通费 (元)</label>
                <input class="bf-ipt trip-num" data-k="traffic" type="number" min="0" placeholder="请输入交通费" value="${v('traffic')}"/>
            </div>
            <div class="bf-cell"><label>住宿费 (元)</label>
                <input class="bf-ipt trip-num" data-k="accommodation" type="number" min="0" placeholder="请输入住宿费" value="${v('accommodation')}"/>
            </div>
            <div class="bf-cell"><label>其它费用 (元)</label>
                <input class="bf-ipt trip-num" data-k="other" type="number" min="0" placeholder="请输入其它费用" value="${v('other')}"/>
            </div>
            <div class="bf-cell"><label>出差补助 (元) <i>*</i></label>
                <div class="bf-stepper">
                    <button class="bf-step-btn" type="button" data-step="-">−</button>
                    <input class="bf-ipt trip-num bf-step-ipt" data-k="subsidy" type="number" min="0" step="50" placeholder="请输入出差补助" value="${v('subsidy')}"/>
                    <button class="bf-step-btn" type="button" data-step="+">+</button>
                </div>
            </div>
            <div class="bf-cell bf-span-2"><label>总金额 <i>*</i></label>
                <div class="bf-amount-row">
                    <input class="bf-ipt" id="trip-total" type="number" placeholder="请输入总金额" value="${totalDefault}"/>
                    <div class="bf-amount-cn" id="trip-total-cn">${amountToChineseRMB(totalDefault)}</div>
                </div>
            </div>
        </div>

        <!-- (3) 人员信息区 -->
        <div class="bf-section">人员信息</div>
        <div class="bf-notice bf-notice-info">
            <span class="material-symbols-rounded">policy</span>
            <span><b>制度提示：</b>根据财务报销制度要求，所有员工报销需先经副总审核，特别情况需总经理复审者，须副总批准后由副总转呈总经理。</span>
        </div>
        <div class="bf-grid">
            <div class="bf-cell"><label>经办人 <i>*</i></label>
                <input class="bf-ipt" value="admin" readonly/>
            </div>
            <div class="bf-cell"><label>审核人 <i>*</i></label>
                <select class="bf-ipt"><option value="">请选择审核人</option>${reviewers.map(r=>`<option ${v('reviewer')===r?'selected':''}>${r}</option>`).join('')}</select>
            </div>
            <div class="bf-cell bf-span-2"><label>报销人员 <i>*</i></label>
                <div class="bf-tag-input" id="trip-members">
                    ${members.map(m => `<span class="bf-tag-chip">${m}<button class="bf-tag-x" data-rm="${m}" type="button">×</button></span>`).join('')}
                    <input class="bf-tag-ipt" placeholder="输入人员名，回车添加"/>
                </div>
            </div>
        </div>

        <!-- (4) 其他字段区 -->
        <div class="bf-section">其他字段</div>
        <div class="bf-grid">
            <div class="bf-cell bf-span-2"><label>出差事由</label>
                <textarea class="bf-ipt" rows="3" placeholder="请输入出差事由">${v('reason')}</textarea>
            </div>
        </div>

        <!-- (5) 底部操作按钮 -->
        <div class="bf-foot">
            <button class="btn" onclick="closeModal()">取消</button>
            <button class="btn primary" onclick="closeModal()"><span class="material-symbols-rounded" style="font-size:16px">save</span>保存</button>
        </div>
    </div>`;
};

// ============ 费用报销：费用报销（需求1401-3 改造） ============
function renderExpenseBaoxiao(){
    const pg = $('#pages');
    const items = filterByRole(MOCK_BAOXIAO, ['user']);
    const cntType = (ty) => items.filter(c=>c.type===ty).length;
    const totalAmount = items.reduce((s,b)=>s + b.amount, 0);
    // 需求1401-3.2 列表字段：费用类型 / 项目名称 / 报销日期 / 报销金额 / 审核人 / 报销人员
    const cols = [
        { key:'type',          label: t('common.type'),   w:'110px', render: b=>`<span class="chip ${pickTypeColor(b.type)}">${tt(b.type)}</span>` },
        { key:'project',       label: State.lang==='en'?'Project':'项目名称', render: b=>b.project ? b.project : `<span class="cell-mute">无需填写项目</span>` },
        { key:'reimburseDate', label: State.lang==='en'?'Reimburse Date':'报销日期', w:'120px', render: b=>`<span class="cell-mute">${b.reimburseDate||b.time}</span>` },
        { key:'amount',        label: State.lang==='en'?'Amount':'报销金额', w:'140px', align:'right', render: b=>`<span class="cell-amount" style="color:${b.amount>=10000?'var(--rose)':'inherit'}">¥${b.amount.toLocaleString('zh-CN')}${b.amount>=10000?` <span style="font-size:10px;color:var(--rose)">${State.lang==='en'?'≥10K':'≥1万'}</span>`:''}</span>` },
        { key:'reviewer',      label: State.lang==='en'?'Reviewer':'审核人', w:'100px', render: b=>b.reviewer||'—' },
        { key:'members',       label: State.lang==='en'?'Reimbursers':'报销人员', render: b=>`<span class="cell-tags">${(b.members||[]).map(m=>`<span class="cell-tag">${m}</span>`).join('')}</span>` },
        { key:'status',        label: t('common.status'), w:'90px',  render: b=>`<span class="chip ${b.statusC}">${tt(b.status)}</span>` },
        { key:'_act',          label: t('common.action'), w:'120px', render: b=>`<span class="row-acts"><button class="btn-icon" data-bx-detail="${b.id}" title="${t('btn.detail')}"><span class="material-symbols-rounded">visibility</span></button>${b.status==='待审批'?'<button class="btn-icon" title="'+t('btn.approve')+'" style="color:var(--emerald)"><span class="material-symbols-rounded">check_circle</span></button><button class="btn-icon" title="'+t('btn.reject')+'" style="color:var(--rose)"><span class="material-symbols-rounded">cancel</span></button>':''}</span>` }
    ];
    pg.innerHTML = `
        ${pageHeader(State.lang==='en'?'Reimbursement':'费用报销', `${t('page.totalCount',{n:items.length})}`, `
            <button class="btn"><span class="material-symbols-rounded">file_download</span>${t('btn.export')}</button>
            <button class="btn primary" id="bxBtnNew"><span class="material-symbols-rounded">add</span>${t('btn.new')}</button>
        `)}
        ${statRow([
            { l: State.lang==='en'?'Total':'报销总数', v: items.length, c:'p' },
            { l: State.lang==='en'?'Total Amount':'累计金额', v: (totalAmount/10000).toFixed(2), unit:State.lang==='en'?'10K':'万', c:'a' },
            { l: tt('待审批'),   v: items.filter(b=>b.status==='待审批').length, c:'w' },
            { l: tt('已支付'),   v: items.filter(b=>b.status==='已支付').length, c:'s' }
        ])}
        ${toolbar({
            filters:[
                { value:'all', label:t('common.all'), active:true, count: items.length },
                { value:'管理费用', label:tt('管理费用'), count: cntType('管理费用') },
                { value:'市场费用', label:tt('市场费用'), count: cntType('市场费用') },
                { value:'研发费用', label:tt('研发费用'), count: cntType('研发费用') },
                { value:'项目报销', label:tt('项目报销'), count: cntType('项目报销') }
            ],
            searchPh: State.lang==='en'?'Search project / reviewer…':'搜索项目 / 审核人 / 报销人员…'
        })}
        ${tableShell(cols, 'bxBody')}`;
    InfiniteList.bind({ source: items, pageSize: 14, container:'bxBody', render: tableRow(cols) });
    $('#bxBtnNew').onclick = () => openModal('新增费用报销', baoxiaoFormModal(), { width:'880px', height:'660px' });
}

// 需求1401-3.1 新增 费用报销 表单
window.baoxiaoFormModal = function(id){
    const b = id ? MOCK_BAOXIAO.find(t => t.id === id) : null;
    const v = (k, d='') => (b && b[k] != null) ? String(b[k]).replace(/"/g,'&quot;') : d;
    const reviewers = ['李副总','张副总','陈副总','吴副总'];
    const expTypes  = ['管理费用','市场费用','研发费用','项目报销'];
    const members = (b && b.members) || ['admin'];
    const amountDefault = b ? +b.amount : 0;
    return `
    <div class="bf-form" id="bx-form">
        <div class="bf-notice bf-notice-warn">
            <span class="material-symbols-rounded">priority_high</span>
            <span>报销单填写金额须与纸质报销单保持一致，且已经过财务审批方可发起线上报销！</span>
        </div>

        <div class="bf-section">基本信息</div>
        <div class="bf-grid">
            <div class="bf-cell"><label>费用类型 <i>*</i></label>
                <select class="bf-ipt"><option value="">请选择费用类型</option>${expTypes.map(o=>`<option ${v('type')===o?'selected':''}>${o}</option>`).join('')}</select>
            </div>
            <div class="bf-cell"><label>项目名称</label>
                <input class="bf-ipt" placeholder="无需填写项目" value="${v('project')}"/>
            </div>
            <div class="bf-cell"><label>报销日期 <i>*</i></label>
                <input class="bf-ipt" type="date" placeholder="请输入报销日期" value="${v('reimburseDate')}"/>
            </div>
            <div class="bf-cell"><label>报销金额 <i>*</i></label>
                <div class="bf-amount-row">
                    <input class="bf-ipt" id="bx-amount" type="number" min="0" placeholder="请输入报销金额" value="${amountDefault}"/>
                    <div class="bf-amount-cn" id="bx-amount-cn">${amountToChineseRMB(amountDefault)}</div>
                </div>
            </div>
        </div>

        <div class="bf-section">人员信息</div>
        <div class="bf-notice bf-notice-info">
            <span class="material-symbols-rounded">policy</span>
            <span><b>制度提示：</b>根据财务报销制度要求，所有员工报销需先经副总审核，特别情况需总经理复审者，须副总批准后由副总转呈总经理。</span>
        </div>
        <div class="bf-grid">
            <div class="bf-cell"><label>经办人 <i>*</i></label>
                <input class="bf-ipt" value="admin" readonly/>
            </div>
            <div class="bf-cell"><label>审核人 <i>*</i></label>
                <select class="bf-ipt"><option value="">请选择审核人</option>${reviewers.map(r=>`<option ${v('reviewer')===r?'selected':''}>${r}</option>`).join('')}</select>
            </div>
            <div class="bf-cell bf-span-2"><label>报销人员 <i>*</i></label>
                <div class="bf-tag-input" id="bx-members">
                    ${members.map(m => `<span class="bf-tag-chip">${m}<button class="bf-tag-x" data-rm="${m}" type="button">×</button></span>`).join('')}
                    <input class="bf-tag-ipt" placeholder="输入人员名，回车添加"/>
                </div>
            </div>
        </div>

        <div class="bf-section">其他字段</div>
        <div class="bf-grid">
            <div class="bf-cell bf-span-2"><label>用途说明</label>
                <textarea class="bf-ipt" rows="3" placeholder="请输入报销资金用途">${v('usage')}</textarea>
            </div>
        </div>

        <div class="bf-foot">
            <button class="btn" onclick="closeModal()">取消</button>
            <button class="btn primary" onclick="closeModal()"><span class="material-symbols-rounded" style="font-size:16px">save</span>保存</button>
        </div>
    </div>`;
};

// 出差/报销 表单的交互：总金额自动求和、人员标签增删、出差补助加减号、金额→大写
document.addEventListener('input', function(e){
    // 出差表单：四项费用合计 + 大写
    if (e.target && e.target.classList && e.target.classList.contains('trip-num')) {
        const form = document.getElementById('trip-form'); if (!form) return;
        const sum = ['traffic','accommodation','other','subsidy'].reduce((s,k) => {
            const el = form.querySelector(`.trip-num[data-k="${k}"]`);
            return s + (+(el && el.value) || 0);
        }, 0);
        const total = form.querySelector('#trip-total');
        const cn    = form.querySelector('#trip-total-cn');
        if (total) total.value = sum;
        if (cn)    cn.textContent = amountToChineseRMB(sum);
    }
    if (e.target && e.target.id === 'trip-total') {
        const cn = document.getElementById('trip-total-cn');
        if (cn) cn.textContent = amountToChineseRMB(+e.target.value || 0);
    }
    if (e.target && e.target.id === 'bx-amount') {
        const cn = document.getElementById('bx-amount-cn');
        if (cn) cn.textContent = amountToChineseRMB(+e.target.value || 0);
    }
});
// 出差补助 ± 按钮
document.addEventListener('click', function(e){
    const stepBtn = e.target && e.target.closest && e.target.closest('.bf-step-btn');
    if (stepBtn) {
        const wrap = stepBtn.closest('.bf-stepper'); if (!wrap) return;
        const ipt = wrap.querySelector('.bf-step-ipt'); if (!ipt) return;
        const step = +(ipt.step || 50);
        const cur = +ipt.value || 0;
        ipt.value = Math.max(0, cur + (stepBtn.dataset.step === '+' ? step : -step));
        ipt.dispatchEvent(new Event('input', { bubbles:true }));
    }
    // 报销人员标签删除
    const rm = e.target && e.target.closest && e.target.closest('.bf-tag-x');
    if (rm) {
        const chip = rm.closest('.bf-tag-chip'); if (chip) chip.remove();
    }
});
// 报销人员标签：回车添加
document.addEventListener('keydown', function(e){
    if (e.target && e.target.classList && e.target.classList.contains('bf-tag-ipt') && e.key === 'Enter') {
        e.preventDefault();
        const val = e.target.value.trim(); if (!val) return;
        const chip = document.createElement('span');
        chip.className = 'bf-tag-chip';
        chip.innerHTML = `${val}<button class="bf-tag-x" data-rm="${val}" type="button">×</button>`;
        e.target.parentNode.insertBefore(chip, e.target);
        e.target.value = '';
    }
});

// ============ 外协管理：外协单位库（需求1401-4 改造） ============
// 证书到期状态：红≤1月 / 橙≤2月 / 黄≤3月 / 灰已过期 / 绿正常
function certExpiryStatus(expiry){
    if (!expiry) return { color:'mute', label:'—', days:null };
    const now = new Date();
    const exp = new Date(expiry);
    const days = Math.floor((exp - now) / 86400000);
    if (days < 0)   return { color:'gray',   label:`已过期 ${Math.abs(days)} 天`, days };
    if (days <= 30) return { color:'red',    label:`${days} 天后到期`, days };
    if (days <= 60) return { color:'orange', label:`${days} 天后到期`, days };
    if (days <= 90) return { color:'yellow', label:`${days} 天后到期`, days };
    return                  { color:'green',  label:`${days} 天后到期`, days };
}
// 需求1901-九.2：删除 编号 / 专业领域 / 证书类型 / 证书编号 / 证书到期 / 等级 / 信用评级 / 合作次数
// 需求1901-九.3：统计卡 → "外协总数" + 合作中 + 黑名单（删除"A 级"）
// 需求1901-九.4：删除 证书到期 4 色筛选条
window._vendorState = { kw:'' };
function renderOutsourceLibrary(){
    const pg = $('#pages');
    let items = filterByRole(MOCK_VENDORS, ['owner']);
    if (_vendorState.kw) {
        const kw = _vendorState.kw.toLowerCase();
        items = items.filter(v => (v.name||'').toLowerCase().includes(kw) || (v.contact||'').toLowerCase().includes(kw));
    }
    const all = filterByRole(MOCK_VENDORS, ['owner']);

    // 列表字段：仅保留 类型 / 名称 / 联系人 / 联系电话 / 主营业务 / 评分 / 状态 / 操作
    const cols = [
        { key:'kind',        label:'类型',                  w:'70px',  render: v=>`<span class="chip ${v.kind==='单位'?'p':'a'}">${v.kind}</span>` },
        { key:'name',        label:'单位/个人名称',                   render: v=>v.name },
        { key:'contact',     label:'联系人',                 w:'90px',  render: v=>v.contact||'—' },
        { key:'phone',       label: t('common.phone'),      w:'130px', render: v=>`<span class="cell-mute">${v.phone}</span>` },
        { key:'tag',         label:'主营业务',                w:'130px', render: v=>v.tag },
        { key:'score',       label: t('common.score'),      w:'80px', align:'right', render: v=>`<span style="color:var(--amber)">${v.score} ★</span>` },
        { key:'status',      label: t('common.status'),     w:'90px',  render: v=>`<span class="chip ${v.status==='合作中'?'s':v.status==='黑名单'?'d':'w'}">${tt(v.status)}</span>` },
        { key:'_act',        label: t('common.action'),     w:'100px', render: v=>`<span class="row-acts"><button class="btn-icon" data-vendor-detail="${v.id}" title="${t('btn.detail')}"><span class="material-symbols-rounded">visibility</span></button><button class="btn-icon" data-vendor-edit="${v.id}" title="编辑"><span class="material-symbols-rounded">edit</span></button></span>` }
    ];

    // 顶部：搜索 + 右侧动作按钮（导出 / 新增） — 需求060101-四：新增"新增"按钮入口
    const headerActs = `
        <button class="btn"><span class="material-symbols-rounded">file_download</span>${t('btn.export')}</button>
        <button class="btn primary" id="vendorBtnNew"><span class="material-symbols-rounded">add</span>${t('btn.add')}</button>`;
    const topBar = `
        <div class="vendor-topbar">
            <div class="vendor-search">
                <span class="material-symbols-rounded">search</span>
                <input id="vendorKw" placeholder="按单位 / 个人名称查询" value="${_vendorState.kw||''}"/>
            </div>
            <div class="vendor-topbar-acts">${headerActs}</div>
        </div>`;

    pg.innerHTML = `
        ${pageHeader(State.lang==='en'?'Vendor Library':'外协单位库', `${t('page.totalCount',{n:items.length})}`)}
        ${statRow([
            { l: State.lang==='en'?'Total':'外协总数', v: all.length, c:'p' },
            { l: tt('合作中'),   v: all.filter(v=>v.status==='合作中').length, c:'a' },
            { l: tt('黑名单'),   v: all.filter(v=>v.status==='黑名单').length, c:'d' }
        ])}
        ${topBar}
        ${tableShell(cols, 'vendorBody')}`;
    InfiniteList.bind({ source: items, pageSize: 14, container:'vendorBody', render: tableRow(cols) });

    $('#vendorKw').oninput   = e => _vendorState.kw = e.target.value;
    $('#vendorKw').onkeydown = e => { if (e.key === 'Enter') renderOutsourceLibrary(); };
    $('#vendorBtnNew').onclick = () => openModal('新增外协单位 / 个人', vendorFormModal(), { width:'780px', height:'620px' });
    pg.addEventListener('click', _vendorListClick);
}
function _vendorListClick(e){
    const detail = e.target.closest && e.target.closest('[data-vendor-detail]');
    if (detail) {
        const v = MOCK_VENDORS.find(x => x.id === detail.dataset.vendorDetail);
        if (v) openModal('外协详情 · ' + v.id, vendorFormModal(v.id, true), { width:'960px', height:'720px' });
        return;
    }
    const edit = e.target.closest && e.target.closest('[data-vendor-edit]');
    if (edit) {
        openModal('修改外协 · ' + edit.dataset.vendorEdit, vendorFormModal(edit.dataset.vendorEdit), { width:'960px', height:'720px' });
    }
}

// 需求060101-四：外协 新增/编辑 表单（重构 — 按图2字段一比一）
window.vendorFormModal = function(id, readonly){
    const v = id ? MOCK_VENDORS.find(x => x.id === id) : null;
    const val = (k, d='') => (v && v[k] != null) ? String(v[k]).replace(/"/g,'&quot;') : d;
    const kind = (v && v.kind) || '单位';
    const isUnit = kind === '单位';
    const ro = readonly ? 'readonly' : '';
    const natureOpts  = ['国有企业','民营企业','合资企业','个体工商户','事业单位','个人'];
    const qualifyOpts = ['甲级','乙级','丙级','无资质要求'];
    return `
    <div class="bf-form" id="vendor-form" data-kind="${kind}">
        <div class="bf-section vendor-kind-row">
            <span>外协类型</span>
            <label class="bf-radio${isUnit?' on':''}"><input type="radio" name="vendor-kind" value="单位" ${isUnit?'checked':''} ${ro}/><span>单位</span></label>
            <label class="bf-radio${isUnit?'':' on'}"><input type="radio" name="vendor-kind" value="个人" ${isUnit?'':'checked'} ${ro}/><span>个人</span></label>
        </div>

        <div class="bf-section">基本信息</div>
        <div class="bf-grid">
            <div class="bf-cell"><label>单位/个人名称 <i>*</i></label>
                <input class="bf-ipt" placeholder="请输入单位/个人名称" value="${val('name')}" ${ro}/>
            </div>
            <div class="bf-cell"><label>性质 <i>*</i></label>
                <select class="bf-ipt" ${ro?'disabled':''}>${natureOpts.map(o=>`<option ${val('nature')===o?'selected':''}>${o}</option>`).join('')}</select>
            </div>
            <div class="bf-cell"><label>单位账号 <i>*</i></label>
                <input class="bf-ipt" placeholder="请输入银行账号" value="${val('bankAccount')}" ${ro}/>
            </div>
            <div class="bf-cell"><label>开户行 <i>*</i></label>
                <input class="bf-ipt" placeholder="请输入开户行名称" value="${val('bankName')}" ${ro}/>
            </div>
            <div class="bf-cell"><label>资质</label>
                <select class="bf-ipt" ${ro?'disabled':''}><option value="">请选择资质</option>${qualifyOpts.map(o=>`<option ${val('qualify')===o?'selected':''}>${o}</option>`).join('')}</select>
            </div>
            <div class="bf-cell"><label>联系人</label>
                <input class="bf-ipt" placeholder="请输入联系人姓名" value="${val('contact')}" ${ro}/>
            </div>
            <div class="bf-cell"><label>联系电话</label>
                <input class="bf-ipt" placeholder="请输入联系电话" value="${val('phone')}" ${ro}/>
            </div>
            <div class="bf-cell"><label>联系人职务</label>
                <input class="bf-ipt" placeholder="请输入联系人职务" value="${val('contactTitle')}" ${ro}/>
            </div>
            <div class="bf-cell bf-span-2"><label>特长描述</label>
                <textarea class="bf-ipt" rows="3" placeholder="请输入特长描述（专业方向、过往合作业绩等）" ${ro}>${val('specialty')}</textarea>
            </div>
        </div>

        <div class="bf-section">证照资料</div>
        <div class="bf-grid">
            <div class="bf-cell bf-span-2 vendor-upload-row">
                <label>资质证书</label>
                <div class="vendor-upload-line">
                    <label class="bf-upload">
                        <span class="material-symbols-rounded">upload_file</span>
                        <span class="vendor-upload-fname">${val('qualifyCertFile')||'选择文件…'}</span>
                        <input type="file" style="display:none" ${ro?'disabled':''}/>
                    </label>
                    <div class="vendor-upload-expiry">
                        <label class="vu-lbl">过期时间</label>
                        <input type="date" class="bf-ipt" value="${val('qualifyCertExpiry')}" ${ro}/>
                    </div>
                </div>
            </div>
            <div class="bf-cell bf-span-2 vendor-upload-row">
                <label>营业执照</label>
                <div class="vendor-upload-line">
                    <label class="bf-upload">
                        <span class="material-symbols-rounded">upload_file</span>
                        <span class="vendor-upload-fname">${val('licenseFile')||'选择文件…'}</span>
                        <input type="file" style="display:none" ${ro?'disabled':''}/>
                    </label>
                    <div class="vendor-upload-expiry">
                        <label class="vu-lbl">过期时间</label>
                        <input type="date" class="bf-ipt" value="${val('licenseExpiry')}" ${ro}/>
                    </div>
                </div>
            </div>
            <div class="bf-cell bf-span-2 vendor-upload-row">
                <label>质量体系证书</label>
                <div class="vendor-upload-line">
                    <label class="bf-upload">
                        <span class="material-symbols-rounded">upload_file</span>
                        <span class="vendor-upload-fname">${val('qualityCertFile')||'选择文件…'}</span>
                        <input type="file" style="display:none" ${ro?'disabled':''}/>
                    </label>
                    <div class="vendor-upload-expiry">
                        <label class="vu-lbl">过期时间</label>
                        <input type="date" class="bf-ipt" value="${val('qualityCertExpiry')}" ${ro}/>
                    </div>
                </div>
            </div>
        </div>

        <div class="bf-foot">
            <button class="btn" onclick="closeModal()">${readonly?'关闭':'取消'}</button>
            ${readonly?'':'<button class="btn primary" onclick="closeModal()"><span class="material-symbols-rounded" style="font-size:16px">save</span>保存</button>'}
        </div>
    </div>`;
};
// 外协表单：单位/个人 单选按钮高亮（需求060101-四：基本信息字段已统一，无需切换隐藏）
document.addEventListener('change', function(e){
    if (e.target && e.target.name === 'vendor-kind') {
        const form = document.getElementById('vendor-form'); if (!form) return;
        form.dataset.kind = e.target.value;
        form.querySelectorAll('.bf-radio').forEach(r => r.classList.toggle('on', r.querySelector('input').checked));
    }
});
// 外协表单：上传控件 — 显示已选文件名
document.addEventListener('change', function(e){
    if (e.target && e.target.type === 'file' && e.target.closest && e.target.closest('.bf-upload')) {
        const wrap = e.target.closest('.bf-upload');
        const fname = wrap && wrap.querySelector('.vendor-upload-fname');
        if (fname && e.target.files && e.target.files[0]) fname.textContent = e.target.files[0].name;
    }
});

// ============ 外协管理：专家管理 ============
// 需求1901-十.1：专家管理 — 删除 编号 / 等级 / 参与次数 / 评分 列
function renderOutsourceExpert(){
    const pg = $('#pages');
    const items = MOCK_EXPERTS;
    const cols = [
        { key:'name',   label: t('common.name'),   w:'150px', render: e=>`<span class="user-pill"><span class="ava">${e.name[0]}</span>${e.name}</span>` },
        { key:'title',  label: t('common.grade'),  w:'130px', render: e=>e.title },
        { key:'org',    label: t('common.org'),    w:'150px', render: e=>e.org },
        { key:'field',  label: t('common.field'),  render: e=>e.field },
        { key:'phone',  label: t('common.phone'),  w:'140px', render: e=>`<span class="cell-mute">${e.phone}</span>` },
        { key:'_act',   label: t('common.action'), w:'100px', render: e=>actBtns([{icon:'visibility',title:t('btn.detail')},{icon:'call',title:State.lang==='en'?'Contact':'联系'}]) }
    ];
    pg.innerHTML = `
        ${pageHeader(State.lang==='en'?'Experts':'专家管理', `${t('page.totalCount',{n:items.length})}`, `
            <button class="btn"><span class="material-symbols-rounded">file_download</span>${t('btn.export')}</button>
            <button class="btn primary"><span class="material-symbols-rounded">add</span>${t('btn.add')}</button>
        `)}
        ${statRow([
            { l: State.lang==='en'?'Total':'专家总数', v: items.length, c:'p' },
            { l: '机构覆盖',  v: new Set(items.map(e=>e.org)).size,   c:'s' },
            { l: '专业领域',  v: new Set(items.map(e=>e.field)).size, c:'a' }
        ])}
        ${toolbar({
            searchPh: State.lang==='en'?'Search expert / field…':'搜索专家姓名 / 领域…'
        })}
        ${tableShell(cols, 'expertBody')}`;
    InfiniteList.bind({ source: items, pageSize: 14, container:'expertBody', render: tableRow(cols) });
}

// 需求1901-九.1：外协进度 — 父子表（项目 → 外协合同 → 进度阶段）
window._ospExpand = {};
function renderOutsourceProgress(){
    const pg = $('#pages');
    // 数据：从 MOCK_PROJECTS 派生若干项目，每个项目下挂若干外协合同
    const projects = filterByRole(MOCK_PROJECTS, ['owner']).slice(0, 20);
    const ospRows = projects.map((p, i) => {
        const ctrCount = 1 + (i % 3); // 每个项目 1~3 个外协合同
        const ctrs = [];
        for (let k = 0; k < ctrCount; k++) {
            const idx = (i + k) % (MOCK_VENDORS ? MOCK_VENDORS.length : 1);
            const vendor = MOCK_VENDORS ? MOCK_VENDORS[idx] : { name: '示例外协' + (idx+1) };
            const totalDays = 60 + ((i + k) * 13) % 90;
            const usedDays  = Math.min(totalDays, 5 + ((i + k * 7) % totalDays));
            const phases = ['前期沟通','合同签订','开工实施','中期验收','收尾交付'];
            const phase = phases[(i + k) % phases.length];
            ctrs.push({
                ctrId: `WX-${p.id.slice(-4)}-${String(k+1).padStart(2,'0')}`,
                vendor: vendor.name,
                amount: (50 + ((i + k * 17) % 500)).toFixed(2),
                start: p.startDate || p.start || '2026-03-01',
                phase, totalDays, usedDays,
                progress: Math.round(usedDays / totalDays * 100),
                producer: p.producer || p.owner || '—'
            });
        }
        return { project: p, ctrs };
    });
    const totalCtrs = ospRows.reduce((s,r) => s + r.ctrs.length, 0);
    const totalAmt = ospRows.reduce((s,r) => s + r.ctrs.reduce((ss,c) => ss + +c.amount, 0), 0);

    pg.innerHTML = `
        ${pageHeader('外协进度', `共 ${ospRows.length} 个项目 · ${totalCtrs} 条外协合同`, `
            <button class="btn"><span class="material-symbols-rounded">file_download</span>导出</button>
        `)}
        ${statRow([
            { l:'项目总数',     v: ospRows.length, c:'p' },
            { l:'外协合同数',   v: totalCtrs,      c:'s' },
            { l:'累计金额（万）', v: totalAmt.toFixed(2),  c:'a' }
        ])}
        ${toolbar({
            filters:[
                { value:'all', label:'全部', active:true, count: ospRows.length },
                { value:'inprogress', label:'进行中', count: ospRows.length }
            ],
            searchPh:'搜索项目 / 外协单位…'
        })}
        <div class="card-shell">
        <table class="osp-tbl">
            <thead>
                <tr>
                    <th style="width:32px"></th>
                    <th style="width:120px">项目编号</th>
                    <th>项目 / 外协合同</th>
                    <th style="width:140px">外协单位</th>
                    <th style="width:110px;text-align:right">金额（万）</th>
                    <th style="width:120px">阶段</th>
                    <th style="width:200px">进度</th>
                    <th style="width:100px">生产负责人</th>
                </tr>
            </thead>
            <tbody id="ospBody">
                ${ospRows.map((row, ri) => {
                    const open = _ospExpand[row.project.id] !== false; // 默认展开
                    const parent = `
                    <tr class="osp-parent" data-prj="${row.project.id}">
                        <td><span class="material-symbols-rounded osp-toggle ${open?'open':''}">chevron_right</span></td>
                        <td><span class="cell-id">${row.project.id}</span></td>
                        <td><b>${row.project.name}</b></td>
                        <td><span class="cell-mute">—</span></td>
                        <td style="text-align:right"><span class="cell-amount">¥${row.ctrs.reduce((s,c)=>s+ +c.amount,0).toFixed(2)}</span></td>
                        <td><span class="cell-mute">合计 ${row.ctrs.length} 项</span></td>
                        <td><span class="cell-mute">—</span></td>
                        <td>${row.project.producer || row.project.owner || '—'}</td>
                    </tr>`;
                    const subs = row.ctrs.map(c => `
                    <tr class="osp-sub" data-parent="${row.project.id}" style="${open?'':'display:none'}">
                        <td></td>
                        <td><span class="cell-id" style="font-size:11px">${c.ctrId}</span></td>
                        <td><span class="cell-mute" style="padding-left:14px">└─ ${row.project.name} · 外协 ${c.ctrId.slice(-2)}</span></td>
                        <td>${c.vendor}</td>
                        <td style="text-align:right"><span class="cell-amount">¥${c.amount}</span></td>
                        <td><span class="chip ${c.phase==='收尾交付'?'s':(c.phase==='中期验收'?'a':'w')}" style="font-size:11px">${c.phase}</span></td>
                        <td>
                            <div style="display:flex;align-items:center;gap:8px">
                                <div class="prog" style="flex:1"><div class="bar ${c.progress>=100?'s':(c.progress>=80?'a':'p')}" style="width:${c.progress}%"></div></div>
                                <span style="font-size:11px;color:var(--text-2);min-width:60px;text-align:right">${c.usedDays}/${c.totalDays}</span>
                            </div>
                        </td>
                        <td>${c.producer}</td>
                    </tr>`).join('');
                    return parent + subs;
                }).join('')}
            </tbody>
        </table>
        </div>
    `;
    // 行展开/收起
    pg.querySelectorAll('.osp-parent').forEach(tr => {
        tr.onclick = () => {
            const id = tr.dataset.prj;
            const cur = _ospExpand[id] !== false;
            _ospExpand[id] = !cur;
            const toggle = tr.querySelector('.osp-toggle');
            if (toggle) toggle.classList.toggle('open', !cur);
            pg.querySelectorAll(`.osp-sub[data-parent="${id}"]`).forEach(s => s.style.display = (!cur ? '' : 'none'));
        };
    });
}

// ============================================================
// 需求2701-二：工天管理 模块（项目管理 / 工序管理 / 人员分配 /
//              日报填写 / 日报管理 / 审批管理 / 工天核算）
// ============================================================

// ---------- MOCK 数据 ----------
window.MOCK_WL_PROJECTS = window.MOCK_WL_PROJECTS || (function(){
    const out = [{ id:'wpj_test', name:'测试项目', type:'生产类', owner:'陈金鸽', createdAt:'2026-05-19 08:37:55' }];
    const types  = ['生产类','研发类','服务类'];
    const owners = ['陈金鸽','王佩','刘恒柯','张育超','李明'];
    for (let i=1; i<=6; i++) {
        const m = ((i*2)%12)+1, d = ((i*3)%27)+1, hh = (8+i)%23, mm = (15+i*4)%60, ss = (10+i*7)%60;
        out.push({
            id: 'wpj_' + (1000 + i),
            name: ['航测项目','地理信息采集','测量监测项目','遥感影像分析','区域规划项目','地图编制项目'][i-1],
            type: types[i%types.length],
            owner: owners[i%owners.length],
            createdAt: `2026-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')} ${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}:${String(ss).padStart(2,'0')}`
        });
    }
    return out;
})();

window.MOCK_WL_PROCESSES = window.MOCK_WL_PROCESSES || [
    { id:'wp_1', projectId:'wpj_test', name:'航拍2', content:'航拍2', start:'2026-05-21 00:00:00', end:'2026-05-29 00:00:00', owner:'王佩' },
    { id:'wp_2', projectId:'wpj_test', name:'航拍',  content:'航拍1', start:'2026-05-19 00:00:00', end:'2026-05-22 00:00:00', owner:'陈金鸽' }
];

window.MOCK_WL_SUBPROCESSES = window.MOCK_WL_SUBPROCESSES || [
    { id:'wsp_1', processId:'wp_1', name:'搬桌子', type:'非生产子工序' },
    { id:'wsp_2', processId:'wp_2', name:'一查',  type:'生产子工序' },
    { id:'wsp_3', processId:'wp_2', name:'二查',  type:'生产子工序' },
    { id:'wsp_4', processId:'wp_2', name:'其他',  type:'非生产子工序' }
];

window.MOCK_WL_ASSIGNS = window.MOCK_WL_ASSIGNS || [
    { id:'wa_1', subProcessId:'wsp_1', sheetNo:'', user:'王佩',   start:'', end:'', assignQty:1, doneQty:1 },
    { id:'wa_2', subProcessId:'wsp_1', sheetNo:'', user:'刘恒柯', start:'', end:'', assignQty:1, doneQty:0 },
    { id:'wa_3', subProcessId:'wsp_1', sheetNo:'', user:'张育超', start:'', end:'', assignQty:1, doneQty:0 },
    { id:'wa_4', subProcessId:'wsp_1', sheetNo:'', user:'负责人', start:'', end:'', assignQty:1, doneQty:0 }
];

window.MOCK_WL_TASKS = window.MOCK_WL_TASKS || [
    { id:'wt_1',  process:'航拍2', sub:'搬桌子', user:'王佩',   sheetNo:'',  qty:1,   status:'已完成' },
    { id:'wt_2',  process:'航拍',  sub:'其他',   user:'刘恒柯', sheetNo:'',  qty:1,   status:'已完成' },
    { id:'wt_3',  process:'航拍',  sub:'二查',   user:'刘恒柯', sheetNo:'1', qty:1,   status:'已完成' },
    { id:'wt_4',  process:'航拍',  sub:'其他',   user:'张育超', sheetNo:'',  qty:0.5, status:'未开始' },
    { id:'wt_5',  process:'航拍',  sub:'一查',   user:'王佩',   sheetNo:'6', qty:0.5, status:'未开始' },
    { id:'wt_6',  process:'航拍2', sub:'搬桌子', user:'刘恒柯', sheetNo:'',  qty:0,   status:'未开始' },
    { id:'wt_7',  process:'航拍2', sub:'搬桌子', user:'负责人', sheetNo:'',  qty:0,   status:'未开始' },
    { id:'wt_8',  process:'航拍2', sub:'搬桌子', user:'张育超', sheetNo:'',  qty:0,   status:'未开始' },
    { id:'wt_9',  process:'航拍',  sub:'二查',   user:'陈金鸽', sheetNo:'1', qty:0,   status:'未开始' },
    { id:'wt_10', process:'航拍',  sub:'二查',   user:'王佩',   sheetNo:'1', qty:0,   status:'未开始' },
    { id:'wt_11', process:'航拍',  sub:'二查',   user:'张育超', sheetNo:'1', qty:0,   status:'未开始' }
];

window.MOCK_WL_APPROVALS = window.MOCK_WL_APPROVALS || [];

window._wlDepartments = window._wlDepartments || ['遥感事业部','采集事业部','编辑事业部','制图事业部','软件研发事业部','工程测量项目组'];

// 跨子页面共享：当前选中的项目 / 工序 / 子工序
window._wlSel = window._wlSel || { projectId:'wpj_test', processId:'wp_1', subProcessId:'wsp_1' };

// ---------- 公共：行内文字链接 ----------
function _wlLink(text, color, attrs){
    const c = color || 'var(--primary)';
    return `<a class="wl-link" style="color:${c};cursor:pointer;font-weight:600;margin-right:10px;text-decoration:none"${attrs||''}>${text}</a>`;
}

// ---------- 公共：项目列表侧栏 ----------
function _wlProjectSide(activePid){
    const items = MOCK_WL_PROJECTS;
    return `<aside class="wl-side glass" style="width:240px;padding:16px;border-radius:var(--r);overflow:auto">
        <div style="font-weight:700;font-size:15px;color:var(--text);margin-bottom:12px">项目列表</div>
        ${items.map(p => `<div class="wl-side-item" data-pid="${p.id}" style="padding:8px 10px;border-radius:8px;cursor:pointer;font-size:13.5px;${p.id===activePid?'background:rgba(96,165,250,0.16);color:var(--primary);font-weight:700':'color:var(--text-1)'}">${p.name}</div>`).join('')}
    </aside>`;
}

// ---------- 公共：项目工序树侧栏 ----------
function _wlProjectTreeSide(activeId){
    const projects = MOCK_WL_PROJECTS;
    return `<aside class="wl-side glass" style="width:260px;padding:16px;border-radius:var(--r);overflow:auto">
        <div style="font-weight:700;font-size:15px;color:var(--text);margin-bottom:12px">项目工序树</div>
        ${projects.map(p => {
            const procs = MOCK_WL_PROCESSES.filter(x => x.projectId === p.id);
            const expanded = p.id === _wlSel.projectId;
            return `<div class="wl-tree-prj" data-pid="${p.id}" style="margin-bottom:4px">
                <div class="wl-tree-row" style="padding:6px 8px;border-radius:6px;cursor:pointer;display:flex;align-items:center;gap:6px;font-size:13.5px;color:var(--text-1);font-weight:600">
                    <span class="material-symbols-rounded" style="font-size:14px;color:var(--text-3);transform:${expanded?'rotate(90deg)':'none'};transition:transform .15s">chevron_right</span>${p.name}
                </div>
                ${expanded ? `<div class="wl-tree-children" style="margin-left:14px">${procs.map(pr => {
                    const subs = MOCK_WL_SUBPROCESSES.filter(s => s.processId === pr.id);
                    const exp2 = pr.id === _wlSel.processId;
                    return `<div data-pp="${pr.id}">
                        <div class="wl-tree-row" data-pp-row="${pr.id}" style="padding:5px 8px;border-radius:6px;cursor:pointer;display:flex;align-items:center;gap:6px;font-size:13px;color:var(--text-1)">
                            <span class="material-symbols-rounded" style="font-size:13px;color:var(--text-3);transform:${exp2?'rotate(90deg)':'none'};transition:transform .15s">chevron_right</span>${pr.name}
                        </div>
                        ${exp2 ? `<div style="margin-left:14px">${subs.map(s => `
                            <div class="wl-tree-sub" data-sp="${s.id}" style="padding:4px 8px 4px 22px;border-radius:6px;cursor:pointer;font-size:13px;${s.id===activeId?'background:rgba(96,165,250,0.18);color:var(--primary);font-weight:700':'color:var(--text-1)'}">${s.name}</div>
                        `).join('')}</div>` : ''}
                    </div>`;
                }).join('')}</div>` : ''}
            </div>`;
        }).join('')}
    </aside>`;
}

// ============================================================
// 需求2701-二.1：项目管理（图 1）
// ============================================================
window._wlPjState = { name:'', type:'', owner:'' };
function renderWorkloadProject(){
    const pg = $('#pages');
    let items = MOCK_WL_PROJECTS.slice();
    if (_wlPjState.name)  items = items.filter(p => p.name.includes(_wlPjState.name));
    if (_wlPjState.type)  items = items.filter(p => p.type === _wlPjState.type);
    if (_wlPjState.owner) items = items.filter(p => p.owner === _wlPjState.owner);
    const types  = [...new Set(MOCK_WL_PROJECTS.map(p => p.type))];
    const owners = [...new Set(MOCK_WL_PROJECTS.map(p => p.owner))];

    const cols = [
        { key:'name',     label:'项目名称',            render: p => p.name },
        { key:'type',     label:'项目类型', w:'160px',  render: p => p.type },
        { key:'owner',    label:'总负责人', w:'130px',  render: p => p.owner },
        { key:'createdAt',label:'创建时间', w:'200px',  render: p => `<span class="cell-mute">${p.createdAt}</span>` },
        { key:'_act',     label:'操作',     w:'120px',  render: p => `${_wlLink('编辑','var(--primary)',' data-wpj-edit="'+p.id+'"')}${_wlLink('删除','var(--rose)',' data-wpj-del="'+p.id+'"')}` }
    ];

    pg.innerHTML = `
        <div class="pf-filterbar" style="margin-bottom:14px">
            <div class="pf-fld"><label>项目名称</label>
                <input id="wpjName" type="text" placeholder="请输入项目名称" value="${_wlPjState.name||''}"/>
            </div>
            <div class="pf-fld"><label>项目类型</label>
                <select id="wpjType"><option value="">全部</option>${types.map(t=>`<option value="${t}"${_wlPjState.type===t?' selected':''}>${t}</option>`).join('')}</select>
            </div>
            <div class="pf-fld"><label>总负责人</label>
                <select id="wpjOwner"><option value="">全部</option>${owners.map(o=>`<option value="${o}"${_wlPjState.owner===o?' selected':''}>${o}</option>`).join('')}</select>
            </div>
            <div class="pf-actions">
                <button class="btn primary" id="wpjQuery"><span class="material-symbols-rounded" style="font-size:16px">search</span>查询</button>
                <button class="btn" id="wpjReset">重置</button>
            </div>
        </div>
        ${tableShell(cols, 'wpjBody')}`;
    InfiniteList.bind({ source: items, pageSize: 20, container:'wpjBody', render: tableRow(cols) });

    $('#wpjName').oninput  = e => _wlPjState.name  = e.target.value;
    $('#wpjType').onchange = e => _wlPjState.type  = e.target.value;
    $('#wpjOwner').onchange= e => _wlPjState.owner = e.target.value;
    $('#wpjQuery').onclick = () => renderWorkloadProject();
    $('#wpjReset').onclick = () => { _wlPjState = { name:'', type:'', owner:'' }; renderWorkloadProject(); };

    pg.addEventListener('click', _wlProjectActs);
}
function _wlProjectActs(e){
    const ed = e.target.closest('[data-wpj-edit]');
    if (ed) { openModal('编辑项目', _wlProjectForm(ed.dataset.wpjEdit), { width:'520px', height:'360px' }); return; }
    const dl = e.target.closest('[data-wpj-del]');
    if (dl) { if (confirm('确认删除该项目？')) { window.MOCK_WL_PROJECTS = MOCK_WL_PROJECTS.filter(p => p.id !== dl.dataset.wpjDel); renderWorkloadProject(); } return; }
}
function _wlProjectForm(pid){
    const p = MOCK_WL_PROJECTS.find(x => x.id === pid) || { name:'', type:'生产类', owner:'' };
    const types = ['生产类','研发类','服务类'];
    const owners = ['陈金鸽','王佩','刘恒柯','张育超','李明'];
    return `<div class="bf-form"><div class="bf-grid">
        <div class="bf-cell bf-span-2"><label>项目名称 <i>*</i></label><input class="bf-ipt" value="${p.name}"/></div>
        <div class="bf-cell"><label>项目类型 <i>*</i></label><select class="bf-ipt">${types.map(t=>`<option${t===p.type?' selected':''}>${t}</option>`).join('')}</select></div>
        <div class="bf-cell"><label>总负责人 <i>*</i></label><select class="bf-ipt">${owners.map(o=>`<option${o===p.owner?' selected':''}>${o}</option>`).join('')}</select></div>
    </div>
    <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:18px;padding-top:14px;border-top:1px solid var(--glass-border)">
        <button class="btn" onclick="closeModal()">取消</button>
        <button class="btn primary" onclick="closeModal()">确认</button>
    </div></div>`;
}

// ============================================================
// 需求2701-二.2：工序管理（图 2）
// ============================================================
window._wlProcState = { name:'', expanded: { 'wp_1': true } };
function renderWorkloadProcess(){
    const pg = $('#pages');
    const pid = _wlSel.projectId;
    const project = MOCK_WL_PROJECTS.find(p => p.id === pid);
    let processes = MOCK_WL_PROCESSES.filter(p => p.projectId === pid);
    if (_wlProcState.name) processes = processes.filter(p => p.name.includes(_wlProcState.name));

    pg.innerHTML = `
        <div style="display:flex;gap:14px;height:100%;min-height:0">
            ${_wlProjectSide(pid)}
            <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:14px;min-height:0">
                <div class="pf-filterbar" style="margin:0">
                    <div class="pf-fld"><label>工序名称</label>
                        <input id="wpName" type="text" placeholder="请输入工序名称" value="${_wlProcState.name||''}"/>
                    </div>
                    <div class="pf-actions">
                        <button class="btn primary" id="wpQuery"><span class="material-symbols-rounded" style="font-size:16px">search</span>查询</button>
                        <button class="btn" id="wpReset">重置</button>
                    </div>
                </div>
                <div class="glass" style="padding:18px;border-radius:var(--r);flex:1;min-height:0;overflow:auto">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
                        <div style="font-weight:700;font-size:15px;color:var(--text)">工序列表</div>
                        <button class="btn primary" id="wpAddNew"><span class="material-symbols-rounded" style="font-size:16px">add</span>新增工序</button>
                    </div>
                    ${_wlProcessTable(processes, project ? project.name : '')}
                </div>
            </div>
        </div>`;

    $('#wpName').oninput  = e => _wlProcState.name = e.target.value;
    $('#wpQuery').onclick = () => renderWorkloadProcess();
    $('#wpReset').onclick = () => { _wlProcState.name = ''; renderWorkloadProcess(); };
    $('#wpAddNew').onclick = () => openModal('新增工序', _wlProcessForm(), { width:'560px', height:'420px' });

    $$('.wl-side-item', pg).forEach(el => el.onclick = () => {
        _wlSel.projectId = el.dataset.pid;
        renderWorkloadProcess();
    });

    pg.addEventListener('click', _wlProcessActs);
}
function _wlProcessTable(processes, projectName){
    return `<table class="data-table">
        <thead><tr>
            <th style="width:36px"></th>
            <th>工序名称</th>
            <th>工序内容</th>
            <th style="width:160px">开始时间 <span class="material-symbols-rounded" style="font-size:14px;vertical-align:middle">unfold_more</span></th>
            <th style="width:160px">结束时间 <span class="material-symbols-rounded" style="font-size:14px;vertical-align:middle">unfold_more</span></th>
            <th style="width:340px">操作</th>
        </tr></thead>
        <tbody>${processes.map(p => {
            const exp = !!_wlProcState.expanded[p.id];
            const subs = MOCK_WL_SUBPROCESSES.filter(s => s.processId === p.id);
            return `<tr data-wp-row="${p.id}">
                <td><span class="material-symbols-rounded wp-chev" data-wp-toggle="${p.id}" style="font-size:18px;color:var(--text-3);cursor:pointer;transform:${exp?'rotate(90deg)':'none'};transition:transform .15s">chevron_right</span></td>
                <td>${p.name}</td>
                <td>${p.content}</td>
                <td>${p.start}</td>
                <td>${p.end}</td>
                <td>${_wlLink('编辑','var(--primary)',' data-wp-edit="'+p.id+'"')}${_wlLink('新增子工序','var(--emerald)',' data-wp-addsub="'+p.id+'"')}${_wlLink('上传excel','var(--emerald)',' data-wp-upload="'+p.id+'"')}${_wlLink('导出excel','var(--accent)',' data-wp-export="'+p.id+'"')}${_wlLink('删除','var(--rose)',' data-wp-del="'+p.id+'"')}</td>
            </tr>
            ${exp ? `<tr><td colspan="6" style="padding:0;background:rgba(96,165,250,0.04)"><div style="padding:14px 18px">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
                    <div style="font-weight:700;color:var(--text);font-size:14px">子工序列表</div>
                    <button class="btn primary" data-wp-addsub2="${p.id}"><span class="material-symbols-rounded" style="font-size:16px">add</span>新增子工序</button>
                </div>
                <table class="data-table" style="width:100%">
                    <thead><tr><th>子工序名称</th><th style="width:200px">子工序类型</th><th style="width:180px">操作</th></tr></thead>
                    <tbody>${subs.length ? subs.map(s => `<tr>
                        <td>${s.name}</td>
                        <td>${s.type}</td>
                        <td>${_wlLink('编辑','var(--primary)',' data-wsp-edit="'+s.id+'"')}${_wlLink('删除','var(--rose)',' data-wsp-del="'+s.id+'"')}</td>
                    </tr>`).join('') : '<tr><td colspan="3" style="text-align:center;color:var(--text-3);padding:18px">暂无数据</td></tr>'}</tbody>
                </table>
                <div style="text-align:center;color:var(--text-3);font-size:12.5px;padding:10px 0 0">已加载全部</div>
            </div></td></tr>` : ''}`;
        }).join('')}</tbody>
    </table>
    <div style="text-align:center;color:var(--text-3);font-size:12.5px;padding:14px 0 0">— 已加载全部 —</div>`;
}
function _wlProcessActs(e){
    const t = e.target.closest('[data-wp-toggle]');
    if (t) { const id = t.dataset.wpToggle; _wlProcState.expanded[id] = !_wlProcState.expanded[id]; renderWorkloadProcess(); return; }
    const ed = e.target.closest('[data-wp-edit]');
    if (ed) { openModal('编辑工序', _wlProcessForm(ed.dataset.wpEdit), { width:'560px', height:'420px' }); return; }
    const as = e.target.closest('[data-wp-addsub], [data-wp-addsub2]');
    if (as) { openModal('新增子工序', _wlSubProcessForm(), { width:'480px', height:'320px' }); return; }
    const up = e.target.closest('[data-wp-upload]');
    if (up) { alert('上传 Excel 工作量数据'); return; }
    const ex = e.target.closest('[data-wp-export]');
    if (ex) { alert('导出 Excel 工作量数据'); return; }
    const dl = e.target.closest('[data-wp-del]');
    if (dl) { if (confirm('确认删除该工序？')) { window.MOCK_WL_PROCESSES = MOCK_WL_PROCESSES.filter(p => p.id !== dl.dataset.wpDel); renderWorkloadProcess(); } return; }
    const sed = e.target.closest('[data-wsp-edit]');
    if (sed) { openModal('编辑子工序', _wlSubProcessForm(sed.dataset.wspEdit), { width:'480px', height:'320px' }); return; }
    const sdl = e.target.closest('[data-wsp-del]');
    if (sdl) { if (confirm('确认删除该子工序？')) { window.MOCK_WL_SUBPROCESSES = MOCK_WL_SUBPROCESSES.filter(s => s.id !== sdl.dataset.wspDel); renderWorkloadProcess(); } return; }
}
function _wlProcessForm(pid){
    const p = MOCK_WL_PROCESSES.find(x => x.id === pid) || { name:'', content:'', start:'', end:'' };
    return `<div class="bf-form"><div class="bf-grid">
        <div class="bf-cell bf-span-2"><label>工序名称 <i>*</i></label><input class="bf-ipt" value="${p.name}"/></div>
        <div class="bf-cell bf-span-2"><label>工序内容</label><textarea class="bf-ipt" rows="3">${p.content}</textarea></div>
        <div class="bf-cell"><label>开始时间</label><input class="bf-ipt" type="datetime-local" value="${(p.start||'').replace(' ','T').slice(0,16)}"/></div>
        <div class="bf-cell"><label>结束时间</label><input class="bf-ipt" type="datetime-local" value="${(p.end||'').replace(' ','T').slice(0,16)}"/></div>
    </div>
    <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:18px;padding-top:14px;border-top:1px solid var(--glass-border)">
        <button class="btn" onclick="closeModal()">取消</button>
        <button class="btn primary" onclick="closeModal()">确认</button>
    </div></div>`;
}
function _wlSubProcessForm(sid){
    const s = MOCK_WL_SUBPROCESSES.find(x => x.id === sid) || { name:'', type:'生产子工序' };
    return `<div class="bf-form"><div class="bf-grid">
        <div class="bf-cell bf-span-2"><label>子工序名称 <i>*</i></label><input class="bf-ipt" value="${s.name}"/></div>
        <div class="bf-cell bf-span-2"><label>子工序类型 <i>*</i></label>
            <select class="bf-ipt">
                <option${s.type==='生产子工序'?' selected':''}>生产子工序</option>
                <option${s.type==='非生产子工序'?' selected':''}>非生产子工序</option>
            </select>
        </div>
    </div>
    <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:18px;padding-top:14px;border-top:1px solid var(--glass-border)">
        <button class="btn" onclick="closeModal()">取消</button>
        <button class="btn primary" onclick="closeModal()">确认</button>
    </div></div>`;
}

// ============================================================
// 需求2701-二.3：人员分配（图 3）
// ============================================================
window._wlAssState = { sheetNo:'', user:'' };
function renderWorkloadAssign(){
    const pg = $('#pages');
    let assigns = MOCK_WL_ASSIGNS.filter(a => a.subProcessId === _wlSel.subProcessId);
    if (_wlAssState.sheetNo) assigns = assigns.filter(a => (a.sheetNo||'').includes(_wlAssState.sheetNo));
    if (_wlAssState.user)    assigns = assigns.filter(a => a.user === _wlAssState.user);
    const users = [...new Set(MOCK_WL_ASSIGNS.map(a => a.user))];

    const cols = [
        { key:'sheetNo',  label:'图幅号',  render: a => a.sheetNo || '' },
        { key:'user',     label:'分配人员', w:'120px', render: a => a.user },
        { key:'start',    label:'开始时间 <span class="material-symbols-rounded" style="font-size:14px;vertical-align:middle">unfold_more</span>', w:'170px', render: a => a.start || '' },
        { key:'end',      label:'结束时间 <span class="material-symbols-rounded" style="font-size:14px;vertical-align:middle">unfold_more</span>', w:'170px', render: a => a.end || '' },
        { key:'assignQty',label:'分配数量', w:'110px', render: a => a.assignQty },
        { key:'doneQty',  label:'完成工作量', w:'110px', render: a => a.doneQty },
        { key:'_act',     label:'操作', w:'120px', render: a => `${_wlLink('查看','var(--primary)',' data-wa-view="'+a.id+'"')}${_wlLink('删除','var(--rose)',' data-wa-del="'+a.id+'"')}` }
    ];

    pg.innerHTML = `
        <div style="display:flex;gap:14px;height:100%;min-height:0">
            ${_wlProjectTreeSide(_wlSel.subProcessId)}
            <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:14px;min-height:0">
                <div class="glass" style="padding:18px;border-radius:var(--r);flex:1;min-height:0;display:flex;flex-direction:column;gap:14px">
                    <div style="display:flex;justify-content:space-between;align-items:center">
                        <div style="font-weight:700;font-size:15px;color:var(--text)">子工序人员分配</div>
                        <button class="btn primary" id="waAddNew"><span class="material-symbols-rounded" style="font-size:16px">add</span>新增分配</button>
                    </div>
                    <div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap">
                        <input class="bf-ipt" id="waSheet" placeholder="请输入图幅号" value="${_wlAssState.sheetNo||''}" style="width:200px"/>
                        <select class="bf-ipt" id="waUser" style="width:200px"><option value="">请选择作业员</option>${users.map(u=>`<option value="${u}"${_wlAssState.user===u?' selected':''}>${u}</option>`).join('')}</select>
                        <button class="btn primary" id="waQuery"><span class="material-symbols-rounded" style="font-size:16px">search</span>查询</button>
                        <button class="btn" id="waReset">重置</button>
                    </div>
                    <div style="flex:1;min-height:0;overflow:auto">
                        ${tableShell(cols, 'waBody')}
                    </div>
                </div>
            </div>
        </div>`;
    InfiniteList.bind({ source: assigns, pageSize: 20, container:'waBody', render: tableRow(cols) });

    $('#waSheet').oninput   = e => _wlAssState.sheetNo = e.target.value;
    $('#waUser').onchange   = e => _wlAssState.user    = e.target.value;
    $('#waQuery').onclick   = () => renderWorkloadAssign();
    $('#waReset').onclick   = () => { _wlAssState = { sheetNo:'', user:'' }; renderWorkloadAssign(); };
    $('#waAddNew').onclick  = () => openModal('新增人员分配', _wlAssignForm(), { width:'560px', height:'440px' });

    $$('.wl-tree-prj > .wl-tree-row', pg).forEach(el => el.onclick = () => {
        const pid = el.parentElement.dataset.pid;
        _wlSel.projectId = pid;
        const firstProc = MOCK_WL_PROCESSES.find(p => p.projectId === pid);
        _wlSel.processId = firstProc ? firstProc.id : null;
        const firstSub = firstProc ? MOCK_WL_SUBPROCESSES.find(s => s.processId === firstProc.id) : null;
        _wlSel.subProcessId = firstSub ? firstSub.id : null;
        renderWorkloadAssign();
    });
    $$('[data-pp-row]', pg).forEach(el => el.onclick = () => {
        const pid = el.dataset.ppRow;
        _wlSel.processId = (_wlSel.processId === pid) ? null : pid;
        const firstSub = MOCK_WL_SUBPROCESSES.find(s => s.processId === _wlSel.processId);
        _wlSel.subProcessId = firstSub ? firstSub.id : null;
        renderWorkloadAssign();
    });
    $$('.wl-tree-sub', pg).forEach(el => el.onclick = () => {
        _wlSel.subProcessId = el.dataset.sp;
        renderWorkloadAssign();
    });

    pg.addEventListener('click', _wlAssignActs);
}
function _wlAssignActs(e){
    const v = e.target.closest('[data-wa-view]');
    if (v) { openModal('查看分配', _wlAssignForm(v.dataset.waView, true), { width:'560px', height:'440px' }); return; }
    const d = e.target.closest('[data-wa-del]');
    if (d) { if (confirm('确认删除该分配？')) { window.MOCK_WL_ASSIGNS = MOCK_WL_ASSIGNS.filter(a => a.id !== d.dataset.waDel); renderWorkloadAssign(); } return; }
}
function _wlAssignForm(aid, readonly){
    const a = MOCK_WL_ASSIGNS.find(x => x.id === aid) || { sheetNo:'', user:'王佩', start:'', end:'', assignQty:1 };
    const users = ['王佩','刘恒柯','张育超','负责人','陈金鸽','李明'];
    const dis = readonly ? ' disabled' : '';
    return `<div class="bf-form"><div class="bf-grid">
        <div class="bf-cell"><label>图幅号</label><input class="bf-ipt" value="${a.sheetNo}"${dis}/></div>
        <div class="bf-cell"><label>作业员 <i>*</i></label><select class="bf-ipt"${dis}>${users.map(u=>`<option${u===a.user?' selected':''}>${u}</option>`).join('')}</select></div>
        <div class="bf-cell"><label>开始时间</label><input class="bf-ipt" type="date" value="${(a.start||'').slice(0,10)}"${dis}/></div>
        <div class="bf-cell"><label>结束时间</label><input class="bf-ipt" type="date" value="${(a.end||'').slice(0,10)}"${dis}/></div>
        <div class="bf-cell bf-span-2"><label>分配数量 <i>*</i></label><input class="bf-ipt" type="number" value="${a.assignQty}"${dis}/></div>
    </div>
    <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:18px;padding-top:14px;border-top:1px solid var(--glass-border)">
        <button class="btn" onclick="closeModal()">${readonly?'关闭':'取消'}</button>
        ${readonly?'':'<button class="btn primary" onclick="closeModal()">确认</button>'}
    </div></div>`;
}

// ============================================================
// 需求2701-二.4：日报填写（图 4）
// ============================================================
window._wlDfState = { tab:'tasks', status:'', projectId:'wpj_test', mineOnly:false };
function renderWorkloadDailyFill(){
    const pg = $('#pages');
    let tasks = MOCK_WL_TASKS.slice();
    if (_wlDfState.status) tasks = tasks.filter(t => t.status === _wlDfState.status);
    pg.innerHTML = `
        <div style="display:flex;flex-direction:column;gap:14px;height:100%;min-height:0">
            <div style="display:flex;justify-content:space-between;align-items:center;gap:14px;flex-wrap:wrap">
                <div style="display:flex;gap:0;background:var(--glass-bg-2);padding:4px;border-radius:10px">
                    <button class="wl-tab ${_wlDfState.tab==='tasks'?'active':''}" data-tab="tasks" style="padding:8px 18px;border:0;border-radius:8px;background:${_wlDfState.tab==='tasks'?'var(--primary)':'transparent'};color:${_wlDfState.tab==='tasks'?'#fff':'var(--text-1)'};font-weight:600;cursor:pointer">任务列表</button>
                    <button class="wl-tab ${_wlDfState.tab==='history'?'active':''}" data-tab="history" style="padding:8px 18px;border:0;border-radius:8px;background:${_wlDfState.tab==='history'?'var(--primary)':'transparent'};color:${_wlDfState.tab==='history'?'#fff':'var(--text-1)'};font-weight:600;cursor:pointer">历史日报</button>
                </div>
                <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
                    <select class="bf-ipt" id="wdfStatus" style="min-width:140px"><option value="">状态筛选</option><option value="未开始"${_wlDfState.status==='未开始'?' selected':''}>未开始</option><option value="进行中"${_wlDfState.status==='进行中'?' selected':''}>进行中</option><option value="已完成"${_wlDfState.status==='已完成'?' selected':''}>已完成</option></select>
                    <select class="bf-ipt" id="wdfPrj" style="min-width:200px"><option value="">选择项目</option>${MOCK_WL_PROJECTS.map(p=>`<option value="${p.id}"${_wlDfState.projectId===p.id?' selected':''}>${p.name}</option>`).join('')}</select>
                    <button class="btn primary" id="wdfMine"><span class="material-symbols-rounded" style="font-size:16px">person</span>查看本人任务</button>
                </div>
            </div>
            <div class="glass" style="flex:1;min-height:0;padding:18px;border-radius:var(--r);overflow:auto">
                ${_wlDfState.tab==='tasks' ? _wlDfTaskTable(tasks) : _wlDfHistoryTable()}
            </div>
        </div>`;

    $$('.wl-tab', pg).forEach(el => el.onclick = () => { _wlDfState.tab = el.dataset.tab; renderWorkloadDailyFill(); });
    $('#wdfStatus').onchange = e => { _wlDfState.status = e.target.value; renderWorkloadDailyFill(); };
    $('#wdfPrj').onchange    = e => { _wlDfState.projectId = e.target.value; renderWorkloadDailyFill(); };
    $('#wdfMine').onclick    = () => { _wlDfState.mineOnly = !_wlDfState.mineOnly; renderWorkloadDailyFill(); };

    pg.addEventListener('click', _wlDfActs);
}
function _wlDfTaskTable(tasks){
    return `<table class="data-table">
        <thead><tr>
            <th>工序名称</th>
            <th>子工序名称</th>
            <th style="width:120px">作业员</th>
            <th style="width:120px">图幅号</th>
            <th style="width:160px">完成工作量 <span class="material-symbols-rounded" style="font-size:14px;vertical-align:middle">unfold_more</span></th>
            <th style="width:100px">状态</th>
            <th style="width:200px">操作</th>
        </tr></thead>
        <tbody>${tasks.map(t => `<tr>
            <td>${t.process}</td>
            <td>${t.sub}</td>
            <td>${t.user}</td>
            <td>${t.sheetNo}</td>
            <td>${t.qty}</td>
            <td>${t.status==='已完成' ? '<span class="chip s">已完成</span>' : t.status==='进行中' ? '<span class="chip a">进行中</span>' : '<span class="chip" style="background:rgba(148,163,184,0.15);color:var(--text-2)">未开始</span>'}</td>
            <td>${_wlLink('开始任务','var(--primary)',' data-wdf-start="'+t.id+'"')}${_wlLink('结束任务','var(--emerald)',' data-wdf-end="'+t.id+'"')}</td>
        </tr>`).join('')}</tbody>
    </table>
    <div style="text-align:center;color:var(--text-3);font-size:12.5px;padding:14px 0 0">— 已加载全部 —</div>`;
}
function _wlDfHistoryTable(){
    const dailies = (window.MOCK_DAILIES || []).slice(0, 10);
    return `<table class="data-table">
        <thead><tr>
            <th style="width:120px">日期</th>
            <th style="width:120px">填报人</th>
            <th>工序 / 子工序</th>
            <th style="width:120px">完成工作量</th>
            <th style="width:120px">状态</th>
            <th style="width:160px">操作</th>
        </tr></thead>
        <tbody>${dailies.length ? dailies.map(d => `<tr>
            <td>${d.date||''}</td>
            <td>${d.user||''}</td>
            <td>${d.content||''}</td>
            <td>${d.hours||0}</td>
            <td><span class="chip ${d.status==='已确认'?'s':d.status==='已退回'?'d':'a'}">${d.status}</span></td>
            <td>${_wlLink('查看','var(--primary)','')}${_wlLink('删除','var(--rose)','')}</td>
        </tr>`).join('') : '<tr><td colspan="6" style="text-align:center;color:var(--text-3);padding:30px">暂无数据</td></tr>'}</tbody>
    </table>`;
}
function _wlDfActs(e){
    const s = e.target.closest('[data-wdf-start]');
    if (s) {
        const t = MOCK_WL_TASKS.find(x => x.id === s.dataset.wdfStart);
        if (t && t.status === '未开始') { t.status = '进行中'; renderWorkloadDailyFill(); }
        return;
    }
    const en = e.target.closest('[data-wdf-end]');
    if (en) {
        openModal('结束任务 · 填写完成工作量', _wlDfEndForm(en.dataset.wdfEnd), { width:'480px', height:'320px' });
    }
}
function _wlDfEndForm(tid){
    return `<div class="bf-form" data-wdf-end-tid="${tid}"><div class="bf-grid">
        <div class="bf-cell bf-span-2"><label>完成工作量 <i>*</i></label><input class="bf-ipt" type="number" step="0.5" value="1" data-wdf-qty/></div>
        <div class="bf-cell bf-span-2"><label>备注</label><textarea class="bf-ipt" rows="3"></textarea></div>
    </div>
    <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:18px;padding-top:14px;border-top:1px solid var(--glass-border)">
        <button class="btn" onclick="closeModal()">取消</button>
        <button class="btn primary" data-wdf-end-confirm>确认</button>
    </div></div>`;
}
document.addEventListener('click', function(e){
    const btn = e.target.closest('[data-wdf-end-confirm]');
    if (!btn) return;
    const form = btn.closest('[data-wdf-end-tid]');
    if (!form) return;
    const tid = form.dataset.wdfEndTid;
    const qty = parseFloat(form.querySelector('[data-wdf-qty]').value) || 0;
    const task = (window.MOCK_WL_TASKS || []).find(x => x.id === tid);
    if (task) { task.qty = qty; task.status = '已完成'; }
    closeModal();
    if (typeof renderWorkloadDailyFill === 'function' && document.querySelector('#pages')) renderWorkloadDailyFill();
});

// ============================================================
// 需求2701-二.5：日报管理（图 5）
// ============================================================
window._wlDmState = { tab:'tasks', status:'', projectId:'wpj_test' };
function renderWorkloadDaily(){
    const pg = $('#pages');
    let tasks = MOCK_WL_TASKS.slice();
    if (_wlDmState.status) tasks = tasks.filter(t => t.status === _wlDmState.status);
    if (_wlSel.processId) {
        const proc = MOCK_WL_PROCESSES.find(p => p.id === _wlSel.processId);
        if (proc) tasks = tasks.filter(t => t.process === proc.name);
    }

    pg.innerHTML = `
        <div style="display:flex;gap:14px;height:100%;min-height:0">
            ${_wlProjectTreeSide(_wlSel.subProcessId)}
            <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:14px;min-height:0">
                <div style="display:flex;justify-content:space-between;align-items:center;gap:14px;flex-wrap:wrap">
                    <div style="display:flex;gap:0;background:var(--glass-bg-2);padding:4px;border-radius:10px">
                        <button class="wl-tab ${_wlDmState.tab==='tasks'?'active':''}" data-tab="tasks" style="padding:8px 18px;border:0;border-radius:8px;background:${_wlDmState.tab==='tasks'?'var(--primary)':'transparent'};color:${_wlDmState.tab==='tasks'?'#fff':'var(--text-1)'};font-weight:600;cursor:pointer">任务列表</button>
                        <button class="wl-tab ${_wlDmState.tab==='history'?'active':''}" data-tab="history" style="padding:8px 18px;border:0;border-radius:8px;background:${_wlDmState.tab==='history'?'var(--primary)':'transparent'};color:${_wlDmState.tab==='history'?'#fff':'var(--text-1)'};font-weight:600;cursor:pointer">历史日报</button>
                    </div>
                    <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
                        <select class="bf-ipt" id="wdmStatus" style="min-width:140px"><option value="">状态筛选</option><option value="未开始"${_wlDmState.status==='未开始'?' selected':''}>未开始</option><option value="进行中"${_wlDmState.status==='进行中'?' selected':''}>进行中</option><option value="已完成"${_wlDmState.status==='已完成'?' selected':''}>已完成</option></select>
                        <select class="bf-ipt" id="wdmPrj" style="min-width:200px"><option value="">选择项目</option>${MOCK_WL_PROJECTS.map(p=>`<option value="${p.id}"${_wlDmState.projectId===p.id?' selected':''}>${p.name}</option>`).join('')}</select>
                        <button class="btn primary" id="wdmMine"><span class="material-symbols-rounded" style="font-size:16px">person</span>查看本人任务</button>
                    </div>
                </div>
                <div class="glass" style="flex:1;min-height:0;padding:18px;border-radius:var(--r);overflow:auto">
                    ${_wlDmState.tab==='tasks' ? _wlDfTaskTable(tasks) : _wlDfHistoryTable()}
                </div>
            </div>
        </div>`;

    $$('.wl-tab', pg).forEach(el => el.onclick = () => { _wlDmState.tab = el.dataset.tab; renderWorkloadDaily(); });
    $('#wdmStatus').onchange = e => { _wlDmState.status = e.target.value; renderWorkloadDaily(); };
    $('#wdmPrj').onchange    = e => { _wlDmState.projectId = e.target.value; renderWorkloadDaily(); };
    $('#wdmMine').onclick    = () => renderWorkloadDaily();

    $$('.wl-tree-prj > .wl-tree-row', pg).forEach(el => el.onclick = () => {
        const pid = el.parentElement.dataset.pid;
        _wlSel.projectId = pid;
        const firstProc = MOCK_WL_PROCESSES.find(p => p.projectId === pid);
        _wlSel.processId = firstProc ? firstProc.id : null;
        renderWorkloadDaily();
    });
    $$('[data-pp-row]', pg).forEach(el => el.onclick = () => {
        const pid = el.dataset.ppRow;
        _wlSel.processId = (_wlSel.processId === pid) ? null : pid;
        renderWorkloadDaily();
    });
    $$('.wl-tree-sub', pg).forEach(el => el.onclick = () => {
        _wlSel.subProcessId = el.dataset.sp;
        renderWorkloadDaily();
    });
    pg.addEventListener('click', _wlDfActs);
}

// ============================================================
// 需求2701-二.6：审批管理（图 6）
// ============================================================
window._wlApState = { projectId:'' };
function renderWorkloadApproval(){
    const pg = $('#pages');
    let items = MOCK_WL_APPROVALS.slice();
    if (_wlApState.projectId) items = items.filter(x => x.projectId === _wlApState.projectId);

    const cols = [
        { key:'applicant', label:'申请人', w:'120px', render: x => x.applicant },
        { key:'project',   label:'所属项目', render: x => x.project },
        { key:'origEnd',   label:'原结束时间 <span class="material-symbols-rounded" style="font-size:14px;vertical-align:middle">unfold_more</span>', w:'180px', render: x => x.origEnd },
        { key:'applyEnd',  label:'申请结束时间 <span class="material-symbols-rounded" style="font-size:14px;vertical-align:middle">unfold_more</span>', w:'180px', render: x => x.applyEnd },
        { key:'reason',    label:'申请原因', render: x => x.reason },
        { key:'note',      label:'备注', render: x => x.note || '' },
        { key:'status',    label:'审批状态', w:'120px', render: x => `<span class="chip ${x.status==='已通过'?'s':x.status==='已驳回'?'d':'a'}">${x.status}</span>` },
        { key:'_act',      label:'操作', w:'160px', render: x => `${_wlLink('批准','var(--emerald)',' data-wap-pass="'+x.id+'"')}${_wlLink('驳回','var(--rose)',' data-wap-reject="'+x.id+'"')}` }
    ];

    pg.innerHTML = `
        <div style="display:flex;flex-direction:column;gap:14px;height:100%;min-height:0">
            <div style="display:flex;align-items:center;gap:12px;background:var(--glass-bg);backdrop-filter:blur(16px);border:1px solid var(--glass-border);border-radius:var(--r);padding:14px 18px">
                <span style="font-size:14px;color:var(--text-1);font-weight:600">选择项目：</span>
                <select class="bf-ipt" id="wapPrj" style="min-width:240px"><option value="">选择项目</option>${MOCK_WL_PROJECTS.map(p=>`<option value="${p.id}"${_wlApState.projectId===p.id?' selected':''}>${p.name}</option>`).join('')}</select>
            </div>
            <div class="glass" style="flex:1;min-height:0;padding:18px;border-radius:var(--r);overflow:auto">
                ${items.length ? tableShell(cols, 'wapBody') : `<table class="data-table">
                    <thead><tr>${cols.map(c=>`<th${c.w?` style="width:${c.w}"`:''}>${c.label}</th>`).join('')}</tr></thead>
                    <tbody><tr><td colspan="${cols.length}" style="text-align:center;color:var(--text-3);padding:60px">暂无数据</td></tr></tbody>
                </table>`}
            </div>
        </div>`;

    if (items.length) InfiniteList.bind({ source: items, pageSize: 20, container:'wapBody', render: tableRow(cols) });

    $('#wapPrj').onchange = e => { _wlApState.projectId = e.target.value; renderWorkloadApproval(); };
    pg.addEventListener('click', _wlApprovalActs);
}
function _wlApprovalActs(e){
    const p = e.target.closest('[data-wap-pass]');
    if (p) { const a = MOCK_WL_APPROVALS.find(x => x.id === p.dataset.wapPass); if (a) { a.status = '已通过'; renderWorkloadApproval(); } return; }
    const r = e.target.closest('[data-wap-reject]');
    if (r) { const a = MOCK_WL_APPROVALS.find(x => x.id === r.dataset.wapReject); if (a) { a.status = '已驳回'; renderWorkloadApproval(); } return; }
}

// ============================================================
// 需求2701-二.7：工天核算（图 7 + 图 8/9/10 弹窗）
// ============================================================
window._wlAcState = { name:'' };
function renderWorkloadAccounting(){
    const pg = $('#pages');
    const pid = _wlSel.projectId;
    const project = MOCK_WL_PROJECTS.find(p => p.id === pid);
    let processes = MOCK_WL_PROCESSES.filter(p => p.projectId === pid);
    if (_wlAcState.name) processes = processes.filter(p => p.name.includes(_wlAcState.name));

    pg.innerHTML = `
        <div style="display:flex;gap:14px;height:100%;min-height:0">
            ${_wlProjectSide(pid)}
            <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:14px;min-height:0">
                <div style="display:flex;justify-content:space-between;align-items:center;background:var(--glass-bg);backdrop-filter:blur(16px);border:1px solid var(--glass-border);border-radius:var(--r);padding:14px 18px;flex-wrap:wrap;gap:14px">
                    <div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap">
                        <span style="font-size:14px;color:var(--text-1);font-weight:600">工序名称</span>
                        <input class="bf-ipt" id="wacName" placeholder="请输入工序名称" value="${_wlAcState.name||''}" style="width:200px"/>
                        <button class="btn primary" id="wacQuery"><span class="material-symbols-rounded" style="font-size:16px">search</span>查询</button>
                        <button class="btn" id="wacReset">重置</button>
                    </div>
                    <div style="display:flex;gap:8px;flex-wrap:wrap">
                        <button class="btn primary" id="wacExport"><span class="material-symbols-rounded" style="font-size:16px">file_download</span>导出工作量统计</button>
                        <button class="btn primary" id="wacImport"><span class="material-symbols-rounded" style="font-size:16px">file_upload</span>导入工作量统计</button>
                        <button class="btn" id="wacCalc" style="background:linear-gradient(135deg,#F59E0B,#EA580C);color:#fff;border-color:transparent"><span class="material-symbols-rounded" style="font-size:16px">calculate</span>工天核算</button>
                    </div>
                </div>
                <div class="glass" style="padding:18px;border-radius:var(--r);flex:1;min-height:0;overflow:auto">
                    <div style="font-weight:700;font-size:15px;color:var(--text);margin-bottom:14px">${project ? project.name : ''} - 工序列表</div>
                    <table class="data-table">
                        <thead><tr>
                            <th>工序名称</th>
                            <th>工序内容</th>
                            <th style="width:110px">负责人</th>
                            <th style="width:170px">开始时间 <span class="material-symbols-rounded" style="font-size:14px;vertical-align:middle">unfold_more</span></th>
                            <th style="width:170px">结束时间 <span class="material-symbols-rounded" style="font-size:14px;vertical-align:middle">unfold_more</span></th>
                            <th style="width:280px">操作</th>
                        </tr></thead>
                        <tbody>${processes.map(p => `<tr>
                            <td>${p.name}</td>
                            <td>${p.content}</td>
                            <td>${p.owner||''}</td>
                            <td>${p.start}</td>
                            <td>${p.end}</td>
                            <td>${_wlLink('编辑','var(--primary)',' data-wac-edit="'+p.id+'"')}${_wlLink('导出工作量','var(--emerald)',' data-wac-exp="'+p.id+'"')}${_wlLink('导入工作量','var(--accent)',' data-wac-imp="'+p.id+'"')}${_wlLink('删除','var(--rose)',' data-wac-del="'+p.id+'"')}</td>
                        </tr>`).join('')}</tbody>
                    </table>
                    <div style="text-align:center;color:var(--text-3);font-size:12.5px;padding:14px 0 0">— 已加载全部 —</div>
                </div>
            </div>
        </div>`;

    $$('.wl-side-item', pg).forEach(el => el.onclick = () => { _wlSel.projectId = el.dataset.pid; renderWorkloadAccounting(); });

    $('#wacName').oninput  = e => _wlAcState.name = e.target.value;
    $('#wacQuery').onclick = () => renderWorkloadAccounting();
    $('#wacReset').onclick = () => { _wlAcState.name = ''; renderWorkloadAccounting(); };
    $('#wacExport').onclick = () => openModal('导出工作量统计', _wlAcExportModal(), { width:'560px', height:'520px' });
    $('#wacImport').onclick = () => openModal('导入工作量统计', _wlAcImportModal(), { width:'560px', height:'480px' });
    $('#wacCalc').onclick   = () => openModal('工天核算',     _wlAcCalcModal(),   { width:'560px', height:'480px' });

    pg.addEventListener('click', _wlAccountingActs);
}
function _wlAccountingActs(e){
    const ed = e.target.closest('[data-wac-edit]');
    if (ed) { openModal('编辑工序', _wlProcessForm(ed.dataset.wacEdit), { width:'560px', height:'420px' }); return; }
    const exp = e.target.closest('[data-wac-exp]');
    if (exp) { openModal('导出工作量统计', _wlAcExportModal(), { width:'560px', height:'520px' }); return; }
    const imp = e.target.closest('[data-wac-imp]');
    if (imp) { openModal('导入工作量统计', _wlAcImportModal(), { width:'560px', height:'480px' }); return; }
    const dl = e.target.closest('[data-wac-del]');
    if (dl) { if (confirm('确认删除该工序？')) { window.MOCK_WL_PROCESSES = MOCK_WL_PROCESSES.filter(p => p.id !== dl.dataset.wacDel); renderWorkloadAccounting(); } return; }
}

// ---------- 图 8：导出工作量统计 ----------
function _wlAcExportModal(){
    const depts = _wlDepartments;
    const projects = MOCK_WL_PROJECTS;
    return `<div class="bf-form"><div class="bf-grid">
        <div class="bf-cell bf-span-2"><label><i>*</i> 开始时间</label><input class="bf-ipt" type="date" placeholder="选择开始时间"/></div>
        <div class="bf-cell bf-span-2"><label><i>*</i> 结束时间</label><input class="bf-ipt" type="date" placeholder="选择结束时间"/></div>
        <div class="bf-cell bf-span-2"><label>项目</label>
            <select class="bf-ipt" multiple style="height:auto;min-height:42px"><option value="">请选择项目（可多选）</option>${projects.map(p=>`<option value="${p.id}">${p.name}</option>`).join('')}</select>
        </div>
        <div class="bf-cell bf-span-2"><label><i>*</i> 部门</label>
            <select class="bf-ipt"><option value="">请选择部门</option>${depts.map(d=>`<option>${d}</option>`).join('')}</select>
        </div>
        <div class="bf-cell bf-span-2"><label>过滤</label>
            <div style="display:flex;flex-direction:column;gap:10px;padding-top:6px">
                <label class="bf-radio" style="display:inline-flex;align-items:center;gap:8px;cursor:pointer"><input type="radio" name="wlExpFilter" value="state"/><span>按子工序完成状态统计</span></label>
                <label class="bf-radio on" style="display:inline-flex;align-items:center;gap:8px;cursor:pointer;color:var(--primary);font-weight:600"><input type="radio" name="wlExpFilter" value="ddl" checked/><span>按照日报提交截止时间统计</span></label>
            </div>
        </div>
    </div>
    <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:18px;padding-top:14px;border-top:1px solid var(--glass-border)">
        <button class="btn" onclick="closeModal()">取消</button>
        <button class="btn primary" onclick="closeModal()">确认导出</button>
    </div></div>`;
}

// ---------- 图 9：导入工作量统计 ----------
function _wlAcImportModal(){
    const depts = _wlDepartments;
    const projects = MOCK_WL_PROJECTS;
    return `<div class="bf-form"><div class="bf-grid">
        <div class="bf-cell bf-span-2"><label><i>*</i> 开始时间</label><input class="bf-ipt" type="date" placeholder="选择开始时间"/></div>
        <div class="bf-cell bf-span-2"><label><i>*</i> 结束时间</label><input class="bf-ipt" type="date" placeholder="选择结束时间"/></div>
        <div class="bf-cell bf-span-2"><label>项目</label>
            <select class="bf-ipt" multiple style="height:auto;min-height:42px"><option value="">请选择项目（可多选）</option>${projects.map(p=>`<option value="${p.id}">${p.name}</option>`).join('')}</select>
        </div>
        <div class="bf-cell bf-span-2"><label><i>*</i> 部门</label>
            <select class="bf-ipt"><option value="">请选择部门</option>${depts.map(d=>`<option>${d}</option>`).join('')}</select>
        </div>
        <div class="bf-cell bf-span-2"><label>导入文件</label>
            <div style="display:flex;align-items:center;gap:10px"><button class="btn primary" type="button" onclick="this.nextElementSibling.click()">选择Excel文件</button><input type="file" accept=".xlsx,.xls" style="display:none"/></div>
            <div style="font-size:12px;color:var(--text-3);margin-top:6px">文件名格式：部门名称_开始时间_结束时间.xlsx</div>
        </div>
    </div>
    <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:18px;padding-top:14px;border-top:1px solid var(--glass-border)">
        <button class="btn" onclick="closeModal()">取消</button>
        <button class="btn primary" onclick="closeModal()">确认导入</button>
    </div></div>`;
}

// ---------- 图 10：工天核算 ----------
function _wlAcCalcModal(){
    const depts = _wlDepartments;
    return `<div class="bf-form"><div class="bf-grid">
        <div class="bf-cell bf-span-2"><label>部门</label>
            <select class="bf-ipt"><option value="">请选择部门</option>${depts.map(d=>`<option>${d}</option>`).join('')}</select>
        </div>
        <div class="bf-cell bf-span-2"><label>核算周期</label>
            <select class="bf-ipt" id="wlAcCycle"><option value="">选择时间范围</option><option value="month">本月</option><option value="quarter">本季</option><option value="year">本年</option><option value="custom">自定义</option></select>
        </div>
        <div class="bf-cell bf-span-2"><label>开始时间</label><input class="bf-ipt" id="wlAcStart" type="date"/></div>
        <div class="bf-cell bf-span-2"><label>结束时间</label><input class="bf-ipt" id="wlAcEnd"   type="date"/></div>
    </div>
    <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:18px;padding-top:14px;border-top:1px solid var(--glass-border);flex-wrap:wrap">
        <button class="btn" onclick="closeModal()">关闭</button>
        <button class="btn primary" onclick="closeModal()" style="background:linear-gradient(135deg,#3B82F6,#2563EB)">导出月度汇总表</button>
        <button class="btn primary" onclick="closeModal()" style="background:linear-gradient(135deg,#10B981,#059669)">导出项目工天详细表</button>
        <button class="btn primary" onclick="closeModal()" style="background:linear-gradient(135deg,#10B981,#059669)">导出部门工天详细表</button>
    </div></div>`;
}

// ============ 资料管理：公司资料库 ============
function renderDocsCompany(){
    const pg = $('#pages');
    const items = MOCK_DOCS;
    const cats = [...new Set(items.map(d=>d.cat))];
    const cols = [
        { key:'id',     label: t('common.id'),     w:'110px', render: d=>`<span class="cell-id">${d.id}</span>` },
        { key:'name',   label: t('common.name'),   render: d=>`<span style="display:inline-flex;align-items:center;gap:8px"><span class="material-symbols-rounded" style="font-size:18px;color:var(--primary)">${d.catIcon}</span>${d.name}</span>` },
        { key:'cat',    label: t('common.cat'),    w:'120px', render: d=>d.cat },
        { key:'type',   label: t('common.type'),   w:'70px',  render: d=>`<span class="cell-mute">${d.type}</span>` },
        { key:'size',   label: t('common.size'),   w:'90px', align:'right', render: d=>`<span class="cell-mute">${d.size}</span>` },
        { key:'version',label: t('common.version'),w:'70px',  render: d=>d.version },
        { key:'owner',  label: t('common.owner'),  w:'90px',  render: d=>d.owner },
        { key:'updated',label: t('common.last'),   w:'110px', render: d=>`<span class="cell-mute">${d.updated}</span>` },
        { key:'level',  label: t('common.level'),  w:'90px',  render: d=>`<span class="chip ${d.level==='机密'?'d':d.level==='内部'?'w':'s'}">${tt(d.level)}</span>` },
        { key:'_act',   label: t('common.action'), w:'120px', render: d=>actBtns([{icon:'visibility',title:State.lang==='en'?'Preview':'预览'},{icon:'download',title:State.lang==='en'?'Download':'下载'},{icon:'share',title:State.lang==='en'?'Share':'分享'}]) }
    ];
    pg.innerHTML = `
        ${pageHeader(State.lang==='en'?'Qualification Docs':'资质材料', `${t('page.totalCount',{n:items.length})}`, `
            <button class="btn"><span class="material-symbols-rounded">file_download</span>${t('btn.download')}</button>
            <button class="btn primary"><span class="material-symbols-rounded">upload</span>${t('btn.upload')}</button>
        `)}
        ${statRow([
            { l: State.lang==='en'?'Total':'文档总数', v: items.length, c:'p' },
            { l: State.lang==='en'?'Licenses':'公司证照', v: items.filter(d=>d.cat==='公司证照').length, c:'a' },
            { l: State.lang==='en'?'Qualifications':'公司资质', v: items.filter(d=>d.cat==='公司资质').length, c:'s' },
            { l: tt('机密'),   v: items.filter(d=>d.level==='机密').length, c:'d' }
        ])}
        ${toolbar({
            filters: [{ value:'all', label:t('common.all'), active:true, count: items.length }, ...cats.map(c=>({ value:c, label:tt(c), count: items.filter(d=>d.cat===c).length }))],
            searchPh: State.lang==='en'?'Search doc / type…':'搜索文档名称 / 类型…'
        })}
        ${tableShell(cols, 'docBody')}`;
    InfiniteList.bind({ source: items, pageSize: 14, container:'docBody', render: tableRow(cols) });
}

// =====================================================================
// 需求1901-十二：资料管理 — 6 个新二级页面
// 共用：每项资料 = 一行 + 上传/查看/编辑/删除 操作
// =====================================================================

// ---------- 1. 资信材料管理 ----------
window.MOCK_DOCS_CREDIT = window.MOCK_DOCS_CREDIT || (function(){
    const out = [];
    const cats = ['ISO9001质量管理体系','ISO27001信息安全','ISO14001环境管理','OHSAS18001职业健康','CMMI 5级认证','CCRC 信息安全集成'];
    const issuers = ['中国质量认证中心','国家信息安全测评中心','TÜV 莱茵','SGS 通标','华夏认证'];
    for (let i = 0; i < 12; i++) {
        const expire = new Date(); expire.setDate(expire.getDate() + (i*30) - 90);
        out.push({
            id: 'CRD' + String(2026001 + i).padStart(7,'0'),
            name: cats[i%cats.length] + ' 认证',
            type: cats[i%cats.length],
            no: 'ZX-' + String(50000 + i).padStart(6,'0'),
            issuer: issuers[i%issuers.length],
            issueDate: '2024-' + String(((i%12)+1)).padStart(2,'0') + '-15',
            expire: expire.toISOString().slice(0,10),
            file: '资信材料_' + i + '.pdf',
            owner: ['李明','张华','王芳','赵磊'][i%4]
        });
    }
    return out;
})();
function renderDocsCredit(){
    const pg = $('#pages');
    const items = MOCK_DOCS_CREDIT;
    const cols = [
        { key:'no',     label:'证书编号', w:'130px', render: d=>`<span class="cell-id">${d.no}</span>` },
        { key:'name',   label:'证书名称',           render: d=>d.name },
        { key:'type',   label:'证书类型', w:'200px', render: d=>d.type },
        { key:'issuer', label:'发证机关', w:'160px', render: d=>d.issuer },
        { key:'issueDate', label:'发证日期', w:'110px', render: d=>`<span class="cell-mute">${d.issueDate}</span>` },
        { key:'expire', label:'到期日期', w:'120px', render: d=>{
            const s = certExpiryStatus(d.expire);
            return `<span class="cert-pill cert-${s.color}"><span class="cert-dot"></span>${d.expire}</span>`;
        } },
        { key:'owner',  label:'负责人',   w:'80px',  render: d=>d.owner },
        { key:'_act',   label:'操作',     w:'130px', render: d=>actBtns([{icon:'visibility',title:'预览'},{icon:'download',title:'下载'},{icon:'edit',title:'编辑'}]) }
    ];
    pg.innerHTML = `
        ${pageHeader('资质资信材料', `共 ${items.length} 份资质资信证书`, `
            <button class="btn"><span class="material-symbols-rounded">file_download</span>导出</button>
            <button class="btn primary" id="credBtnNew"><span class="material-symbols-rounded">add</span>新增</button>
        `)}
        ${toolbar({ searchPh:'搜索证书名称 / 编号 / 类型…' })}
        ${tableShell(cols, 'credBody')}`;
    InfiniteList.bind({ source: items, pageSize: 14, container:'credBody', render: tableRow(cols) });
    $('#credBtnNew').onclick = () => openModal('新增 资信材料', docCreditFormModal(), { width:'720px', height:'620px' });
}
window.docCreditFormModal = function(){
    return `
    <div class="bf-form">
        <div class="bf-section">资信材料</div>
        <div class="bf-grid">
            <div class="bf-cell bf-span-2"><label>证书名称 <i>*</i></label><input class="bf-ipt" placeholder="如 ISO9001质量管理体系认证"/></div>
            <div class="bf-cell"><label>证书类型 <i>*</i></label>
                <select class="bf-ipt"><option>质量管理</option><option>信息安全</option><option>环境管理</option><option>职业健康</option><option>能力成熟度</option><option>行业资质</option></select>
            </div>
            <div class="bf-cell"><label>证书编号 <i>*</i></label><input class="bf-ipt" placeholder="证书编号"/></div>
            <div class="bf-cell"><label>发证机关 <i>*</i></label><input class="bf-ipt" placeholder="如 中国质量认证中心"/></div>
            <div class="bf-cell"><label>负责人 <i>*</i></label><input class="bf-ipt" placeholder="姓名"/></div>
            <div class="bf-cell"><label>发证日期 <i>*</i></label><input class="bf-ipt" type="date"/></div>
            <div class="bf-cell"><label>到期日期 <i>*</i></label><input class="bf-ipt" type="date"/></div>
            <div class="bf-cell bf-span-2"><label>证书附件 <i>*</i></label>
                <div class="bf-upload"><span class="material-symbols-rounded" style="color:var(--primary)">upload_file</span><span class="bf-upload-txt">上传证书扫描件 (PDF / 图片)</span><button class="btn">浏览…</button></div>
            </div>
            <div class="bf-cell bf-span-2"><label>备注</label><textarea class="bf-ipt" rows="2" placeholder="补充说明"></textarea></div>
        </div>
        <div class="bf-foot">
            <button class="btn" onclick="closeModal()">取消</button>
            <button class="btn primary" onclick="closeModal()"><span class="material-symbols-rounded" style="font-size:16px">save</span>保存</button>
        </div>
    </div>`;
};

// ---------- 2. 知识产权管理 (4 sub-tabs / 需求060101-五：升级为三级菜单) ----------
window._ipTab = 'product';
function renderDocsIp(tabKey){
    const pg = $('#pages');
    const tabs = [
        { k:'product',  l:'软件产品证书' },
        { k:'copyright',l:'软件著作权' },
        { k:'patent',   l:'专利证书' },
        { k:'evaluate', l:'软件评测' }
    ];
    // 需求060101-五：从三级菜单进入时通过参数指定 tab；保留点击 tab 切换（同时也保留二级"知识产权管理"入口的兼容）
    if (tabKey && tabs.some(t => t.k === tabKey)) _ipTab = tabKey;
    const data = {
        product:   [{id:'IP-P-001',name:'电子档案管理软件',no:'GR-2024-0876',version:'V3.0',issuer:'工信部',date:'2024-05-12',owner:'张华'}],
        copyright: [{id:'IP-C-001',name:'城市数字孪生平台',no:'软著登字第8345621号',type:'自主开发',version:'V2.1',date:'2023-11-08',owner:'王芳'}],
        patent:    [{id:'IP-T-001',name:'一种基于大数据的智能调度方法',certNo:'ZS-2024-0001',patentNo:'ZL202210123456.7',type:'发明专利',applyDate:'2022-01-15',grantDate:'2024-08-20',grantNo:'CN12345678B',owner:'李明'}],
        evaluate:  [{id:'IP-E-001',name:'综合管控平台',no:'PJ-2024-0231',org:'中国软件评测中心',date:'2024-07-15',owner:'赵磊'}]
    };
    // 多个示例
    for (let i = 1; i <= 5; i++) {
        data.product.push({   id:'IP-P-00'+(i+1), name:'示例软件产品 '+i,    no:'GR-2024-088'+i, version:'V'+(i+1)+'.0', issuer:'工信部', date:'2024-0'+(i+1)+'-12', owner:['张华','王芳','李明'][i%3] });
        data.copyright.push({ id:'IP-C-00'+(i+1), name:'软著作品 '+i,         no:'软著登字第834562'+i+'号', type:'自主开发', version:'V'+i+'.0', date:'2024-0'+(i+1)+'-08', owner:['张华','王芳','李明'][i%3] });
        data.patent.push({    id:'IP-T-00'+(i+1), name:'专利方法 '+i,         certNo:'ZS-2024-000'+(i+1), patentNo:'ZL20221012345'+i+'.7', type:i%2?'发明专利':'实用新型', applyDate:'2022-0'+((i%9)+1)+'-15', grantDate:'2024-0'+(i+1)+'-20', grantNo:'CN1234567'+i+'B', owner:['张华','王芳','李明'][i%3] });
        data.evaluate.push({  id:'IP-E-00'+(i+1), name:'评测项目 '+i,         no:'PJ-2024-023'+i, org:'中国软件评测中心', date:'2024-0'+(i+1)+'-15', owner:['张华','王芳','李明'][i%3] });
    }
    const cur = _ipTab;
    const tabBar = `<div class="ip-tabs">${tabs.map(t => `<div class="ip-tab ${cur===t.k?'on':''}" data-iptab="${t.k}">${t.l}</div>`).join('')}</div>`;
    const items = data[cur];
    let cols;
    if (cur === 'product') {
        // 需求060101-五.1：软件产品证书数据列表删除"负责人"字段
        cols = [
            { key:'no',      label:'证书编号',  w:'140px', render: r=>`<span class="cell-id">${r.no}</span>` },
            { key:'name',    label:'产品名称',           render: r=>r.name },
            { key:'version', label:'版本号',    w:'90px',  render: r=>r.version },
            { key:'issuer',  label:'发证机关',  w:'120px', render: r=>r.issuer },
            { key:'date',    label:'发证日期',  w:'110px', render: r=>`<span class="cell-mute">${r.date}</span>` },
            { key:'_act',    label:'操作',      w:'120px', render: r=>actBtns([{icon:'visibility',title:'预览'},{icon:'download',title:'下载'},{icon:'edit',title:'编辑'}]) }
        ];
    } else if (cur === 'copyright') {
        // 需求060101-五.2：软件著作权数据列表删除"负责人"字段
        cols = [
            { key:'no',      label:'登记号',    w:'200px', render: r=>`<span class="cell-id">${r.no}</span>` },
            { key:'name',    label:'软件名称',           render: r=>r.name },
            { key:'type',    label:'开发方式',  w:'100px', render: r=>r.type },
            { key:'version', label:'版本号',    w:'90px',  render: r=>r.version },
            { key:'date',    label:'登记日期',  w:'110px', render: r=>`<span class="cell-mute">${r.date}</span>` },
            { key:'_act',    label:'操作',      w:'120px', render: r=>actBtns([{icon:'visibility',title:'预览'},{icon:'download',title:'下载'},{icon:'edit',title:'编辑'}]) }
        ];
    } else if (cur === 'patent') {
        // 需求060101-五.3：专利证书只显示8个字段并删除查看按钮
        cols = [
            { key:'name',      label:'名称',          render: r=>r.name },
            { key:'type',      label:'类型',         w:'110px', render: r=>`<span class="chip ${r.type==='发明专利'?'p':'s'}">${r.type}</span>` },
            { key:'certNo',    label:'证书号',       w:'140px', render: r=>`<span class="cell-id">${r.certNo}</span>` },
            { key:'patentNo',  label:'专利号',       w:'170px', render: r=>`<span class="cell-id">${r.patentNo}</span>` },
            { key:'owner',     label:'发明人',       w:'90px',  render: r=>r.owner },
            { key:'applyDate', label:'申请日期',     w:'110px', render: r=>`<span class="cell-mute">${r.applyDate}</span>` },
            { key:'grantDate', label:'授权公告日期', w:'120px', render: r=>`<span class="cell-mute">${r.grantDate}</span>` },
            { key:'grantNo',   label:'授权公告号',   w:'150px', render: r=>`<span class="cell-id">${r.grantNo}</span>` }
        ];
    } else {
        cols = [
            { key:'no',      label:'评测编号',  w:'140px', render: r=>`<span class="cell-id">${r.no}</span>` },
            { key:'name',    label:'产品名称',           render: r=>r.name },
            { key:'org',     label:'评测机构',  w:'180px', render: r=>r.org },
            { key:'date',    label:'评测日期',  w:'110px', render: r=>`<span class="cell-mute">${r.date}</span>` },
            { key:'owner',   label:'负责人',    w:'80px',  render: r=>r.owner },
            { key:'_act',    label:'操作',      w:'120px', render: r=>actBtns([{icon:'visibility',title:'预览'},{icon:'download',title:'下载'},{icon:'edit',title:'编辑'}]) }
        ];
    }
    pg.innerHTML = `
        ${pageHeader('知识产权管理', `共 ${items.length} 项 · ${tabs.find(t=>t.k===cur).l}`, `
            <button class="btn"><span class="material-symbols-rounded">file_download</span>导出</button>
            <button class="btn primary" id="ipBtnNew"><span class="material-symbols-rounded">add</span>新增</button>
        `)}
        ${tabBar}
        ${toolbar({ searchPh:'搜索名称 / 编号…' })}
        ${tableShell(cols, 'ipBody')}`;
    InfiniteList.bind({ source: items, pageSize: 14, container:'ipBody', render: tableRow(cols) });
    pg.querySelectorAll('.ip-tab').forEach(t => t.onclick = () => { _ipTab = t.dataset.iptab; renderDocsIp(); });
    $('#ipBtnNew').onclick = () => openModal('新增 ' + tabs.find(t=>t.k===cur).l, docIpFormModal(cur), { width:'720px', height:'620px' });
}
window.docIpFormModal = function(tab){
    if (tab === 'product') return `
    <div class="bf-form">
        <div class="bf-section">软件产品证书</div>
        <div class="bf-grid">
            <div class="bf-cell bf-span-2"><label>产品名称 <i>*</i></label><input class="bf-ipt" placeholder="产品全称"/></div>
            <div class="bf-cell"><label>证书编号 <i>*</i></label><input class="bf-ipt"/></div>
            <div class="bf-cell"><label>版本号 <i>*</i></label><input class="bf-ipt" placeholder="如 V3.0"/></div>
            <div class="bf-cell"><label>发证机关 <i>*</i></label><input class="bf-ipt" placeholder="如 工信部"/></div>
            <div class="bf-cell"><label>发证日期 <i>*</i></label><input class="bf-ipt" type="date"/></div>
            <div class="bf-cell"><label>负责人 <i>*</i></label><input class="bf-ipt"/></div>
            <div class="bf-cell"><label>有效期</label><input class="bf-ipt" placeholder="如 长期 / 至2027-12"/></div>
            <div class="bf-cell bf-span-2"><label>证书附件 <i>*</i></label><div class="bf-upload"><span class="material-symbols-rounded" style="color:var(--primary)">upload_file</span><span class="bf-upload-txt">上传证书扫描件</span><button class="btn">浏览…</button></div></div>
        </div>
        <div class="bf-foot"><button class="btn" onclick="closeModal()">取消</button><button class="btn primary" onclick="closeModal()"><span class="material-symbols-rounded">save</span>保存</button></div>
    </div>`;
    if (tab === 'copyright') return `
    <div class="bf-form">
        <div class="bf-section">软件著作权</div>
        <div class="bf-grid">
            <div class="bf-cell bf-span-2"><label>软件名称 <i>*</i></label><input class="bf-ipt"/></div>
            <div class="bf-cell"><label>登记号 <i>*</i></label><input class="bf-ipt" placeholder="软著登字第XXX号"/></div>
            <div class="bf-cell"><label>版本号 <i>*</i></label><input class="bf-ipt"/></div>
            <div class="bf-cell"><label>开发方式 <i>*</i></label><select class="bf-ipt"><option>自主开发</option><option>合作开发</option><option>委托开发</option></select></div>
            <div class="bf-cell"><label>权利取得方式</label><select class="bf-ipt"><option>原始取得</option><option>继受取得</option></select></div>
            <div class="bf-cell"><label>登记日期 <i>*</i></label><input class="bf-ipt" type="date"/></div>
            <div class="bf-cell"><label>负责人 <i>*</i></label><input class="bf-ipt"/></div>
            <div class="bf-cell bf-span-2"><label>证书附件 <i>*</i></label><div class="bf-upload"><span class="material-symbols-rounded" style="color:var(--primary)">upload_file</span><span class="bf-upload-txt">上传证书扫描件</span><button class="btn">浏览…</button></div></div>
        </div>
        <div class="bf-foot"><button class="btn" onclick="closeModal()">取消</button><button class="btn primary" onclick="closeModal()"><span class="material-symbols-rounded">save</span>保存</button></div>
    </div>`;
    if (tab === 'patent') return `
    <div class="bf-form">
        <div class="bf-section">专利证书</div>
        <div class="bf-grid">
            <div class="bf-cell bf-span-2"><label>专利名称 <i>*</i></label><input class="bf-ipt"/></div>
            <div class="bf-cell"><label>专利号 <i>*</i></label><input class="bf-ipt" placeholder="ZL202210123456.7"/></div>
            <div class="bf-cell"><label>专利类型 <i>*</i></label><select class="bf-ipt"><option>发明专利</option><option>实用新型专利</option><option>外观设计专利</option></select></div>
            <div class="bf-cell"><label>申请日期 <i>*</i></label><input class="bf-ipt" type="date"/></div>
            <div class="bf-cell"><label>授权日期 <i>*</i></label><input class="bf-ipt" type="date"/></div>
            <div class="bf-cell"><label>发明人 <i>*</i></label><input class="bf-ipt"/></div>
            <div class="bf-cell"><label>专利权人</label><input class="bf-ipt"/></div>
            <div class="bf-cell bf-span-2"><label>证书附件 <i>*</i></label><div class="bf-upload"><span class="material-symbols-rounded" style="color:var(--primary)">upload_file</span><span class="bf-upload-txt">上传证书扫描件</span><button class="btn">浏览…</button></div></div>
        </div>
        <div class="bf-foot"><button class="btn" onclick="closeModal()">取消</button><button class="btn primary" onclick="closeModal()"><span class="material-symbols-rounded">save</span>保存</button></div>
    </div>`;
    return `
    <div class="bf-form">
        <div class="bf-section">软件评测</div>
        <div class="bf-grid">
            <div class="bf-cell bf-span-2"><label>产品名称 <i>*</i></label><input class="bf-ipt"/></div>
            <div class="bf-cell"><label>评测编号 <i>*</i></label><input class="bf-ipt"/></div>
            <div class="bf-cell"><label>评测机构 <i>*</i></label><input class="bf-ipt" placeholder="如 中国软件评测中心"/></div>
            <div class="bf-cell"><label>评测类型 <i>*</i></label><select class="bf-ipt"><option>登记测试</option><option>验收测试</option><option>鉴定测试</option></select></div>
            <div class="bf-cell"><label>评测日期 <i>*</i></label><input class="bf-ipt" type="date"/></div>
            <div class="bf-cell"><label>负责人 <i>*</i></label><input class="bf-ipt"/></div>
            <div class="bf-cell bf-span-2"><label>评测报告 <i>*</i></label><div class="bf-upload"><span class="material-symbols-rounded" style="color:var(--primary)">upload_file</span><span class="bf-upload-txt">上传评测报告</span><button class="btn">浏览…</button></div></div>
        </div>
        <div class="bf-foot"><button class="btn" onclick="closeModal()">取消</button><button class="btn primary" onclick="closeModal()"><span class="material-symbols-rounded">save</span>保存</button></div>
    </div>`;
};

// ---------- 3. 人员资料管理 ----------
window.MOCK_DOCS_STAFF = window.MOCK_DOCS_STAFF || (function(){
    const out = [];
    // 需求2001-七：包含 身份证 / 职称证 两类 + 其它常规资料
    const docs = ['身份证','职称证','学历证书','学位证书','劳动合同','社保证明','职业资格证'];
    const owners = ['李明','张华','王芳','赵磊','陈静','吴强','刘洋','周婷'];
    for (let i = 0; i < 24; i++) {
        out.push({
            id: 'STF' + String(2026001 + i).padStart(7,'0'),
            staff: owners[i%owners.length],
            dept: ['信息化部','工程部','项目一部','项目二部'][i%4],
            type: docs[i%docs.length],
            no: 'DOC-' + String(10000 + i).padStart(5,'0'),
            uploaded: '2024-' + String(((i%12)+1)).padStart(2,'0') + '-' + String(((i%28)+1)).padStart(2,'0'),
            file: docs[i%docs.length] + '.pdf'
        });
    }
    return out;
})();
// 需求2001-七：人员资料管理 接收 filter 参数支持三级目录（身份证/职称证）+ 新增目录 按钮
function renderDocsStaff(opts){
    const pg = $('#pages');
    const filter = opts && opts.filter;
    const items = filter ? MOCK_DOCS_STAFF.filter(d => (d.type||'').includes(filter)) : MOCK_DOCS_STAFF;
    const title = filter ? `人员资料管理 · ${filter}` : '人员资料管理';
    const cols = [
        { key:'staff', label:'员工姓名', w:'100px', render: d=>`<span class="user-pill"><span class="ava">${d.staff[0]}</span>${d.staff}</span>` },
        { key:'dept',  label:'所属部门', w:'120px', render: d=>d.dept },
        { key:'type',  label:'资料类型',           render: d=>d.type },
        { key:'no',    label:'资料编号', w:'140px', render: d=>`<span class="cell-id">${d.no}</span>` },
        { key:'uploaded', label:'上传日期', w:'120px', render: d=>`<span class="cell-mute">${d.uploaded}</span>` },
        { key:'file', label:'附件', w:'180px', render: d=>`<a class="cell-link"><span class="material-symbols-rounded" style="font-size:14px">attach_file</span> ${d.file}</a>` },
        { key:'_act',  label:'操作',     w:'130px', render: d=>actBtns([{icon:'visibility',title:'预览'},{icon:'download',title:'下载'},{icon:'edit',title:'编辑'}]) }
    ];
    const newCatBtn = !filter ? `<button class="btn" id="stfBtnNewCat"><span class="material-symbols-rounded">create_new_folder</span>新增目录</button>` : '';
    pg.innerHTML = `
        ${pageHeader(title, `共 ${items.length} 份资料`, `
            <button class="btn"><span class="material-symbols-rounded">file_download</span>导出</button>
            ${newCatBtn}
            <button class="btn primary" id="stfBtnNew"><span class="material-symbols-rounded">add</span>新增</button>
        `)}
        ${toolbar({ searchPh:'搜索员工 / 资料类型…' })}
        ${tableShell(cols, 'stfBody')}`;
    InfiniteList.bind({ source: items, pageSize: 14, container:'stfBody', render: tableRow(cols) });
    $('#stfBtnNew').onclick = () => openModal('新增 人员资料', docStaffFormModal(filter), { width:'720px', height:'580px' });
    const nc = $('#stfBtnNewCat');
    if (nc) nc.onclick = () => openModal('新增目录', docStaffNewCatModal(), { width:'520px', height:'360px' });
}
window.docStaffNewCatModal = function(){
    return `
    <div class="bf-form">
        <div class="bf-section">新增目录</div>
        <div class="bf-grid">
            <div class="bf-cell bf-span-2"><label>目录名称 <i>*</i></label>
                <input class="bf-ipt" placeholder="例：身份证、职称证、学历证书..."/>
            </div>
            <div class="bf-cell bf-span-2"><label>目录描述</label>
                <textarea class="bf-ipt" rows="3" placeholder="补充说明该目录的用途"></textarea>
            </div>
        </div>
        <div class="bf-foot">
            <button class="btn" onclick="closeModal()">取消</button>
            <button class="btn primary" onclick="closeModal()"><span class="material-symbols-rounded">save</span>保存</button>
        </div>
    </div>`;
};
window.docStaffFormModal = function(presetType){
    const types = ['身份证','职称证','学历证书','学位证书','劳动合同','社保证明','职业资格证','其它'];
    const opts = types.map(t => `<option${t===presetType?' selected':''}>${t}</option>`).join('');
    return `
    <div class="bf-form">
        <div class="bf-section">人员资料</div>
        <div class="bf-grid">
            <div class="bf-cell"><label>员工姓名 <i>*</i></label>
                <div class="bf-search-input"><span class="material-symbols-rounded">search</span><input class="bf-ipt" placeholder="搜索员工"/></div>
            </div>
            <div class="bf-cell"><label>所属部门</label><input class="bf-ipt" placeholder="自动带出，可修改"/></div>
            <div class="bf-cell"><label>资料类型 <i>*</i></label>
                <select class="bf-ipt">${opts}</select>
            </div>
            <div class="bf-cell"><label>资料编号</label><input class="bf-ipt"/></div>
            <div class="bf-cell bf-span-2"><label>资料附件 <i>*</i></label>
                <div class="bf-upload"><span class="material-symbols-rounded" style="color:var(--primary)">upload_file</span><span class="bf-upload-txt">上传资料 (PDF / 图片)</span><button class="btn">浏览…</button></div>
            </div>
            <div class="bf-cell bf-span-2"><label>备注</label><textarea class="bf-ipt" rows="2"></textarea></div>
        </div>
        <div class="bf-foot"><button class="btn" onclick="closeModal()">取消</button><button class="btn primary" onclick="closeModal()"><span class="material-symbols-rounded">save</span>保存</button></div>
    </div>`;
};

// ---------- 4. 荣誉材料管理 ----------
window.MOCK_DOCS_HONOR = window.MOCK_DOCS_HONOR || (function(){
    const out = [];
    const projects = ['智慧城市综合管控平台','数字孪生应用系统','城市数据中台','政务一体化平台','应急指挥系统','遥感影像处理平台','测绘地理信息平台','档案数字化管理系统'];
    const awardTypes = ['科技进步奖','技术创新奖','优秀工程奖','质量管理奖','示范工程','优秀产品奖','标杆案例','行业贡献奖'];
    const levels = ['国家级','省级','市级','行业级'];
    const issuers = ['住建部','工信部','市场监管局','省政府','市政府','中国测绘学会','行业协会','市科委'];
    const members = ['李明','张华','王芳','赵磊','刘强','陈静'];
    const ranks = ['一等奖','二等奖','三等奖','金奖','银奖','铜奖','优秀奖'];
    const medalOrCert = ['奖牌','证书'];
    for (let i = 0; i < 12; i++) {
        out.push({
            id: 'HNR' + String(2026001 + i).padStart(7,'0'),
            seq: i + 1,
            medalOrCert: medalOrCert[i%2],
            projectName: projects[i%projects.length],
            awardType: awardTypes[i%awardTypes.length],
            level: levels[i%levels.length],
            rank: ranks[i%ranks.length],
            publishDate: '2023-' + String(((i%12)+1)).padStart(2,'0') + '-' + String(((i%28)+1)).padStart(2,'0'),
            no: 'HR-' + String(50000 + i),
            issuer: issuers[i%issuers.length],
            member: members[i%members.length] + (i%3===0 ? '、' + members[(i+1)%members.length] : '')
        });
    }
    return out;
})();
function renderDocsHonor(){
    const pg = $('#pages');
    const items = MOCK_DOCS_HONOR;
    // 需求060101-六：数据列表只展示 10 个字段
    const cols = [
        { key:'seq',         label:'序号',           w:'56px',  align:'center', render:(d,i)=>`<span class="cell-mute">${i+1}</span>` },
        { key:'medalOrCert', label:'奖牌or证书',     w:'100px', render: d=>`<span class="chip ${d.medalOrCert==='奖牌'?'a':'p'}">${d.medalOrCert}</span>` },
        { key:'projectName', label:'获奖项目名称',              render: d=>d.projectName },
        { key:'awardType',   label:'获奖类型',       w:'120px', render: d=>d.awardType },
        { key:'level',       label:'级别',           w:'90px',  render: d=>`<span class="chip ${d.level==='国家级'?'d':d.level==='省级'?'a':d.level==='市级'?'p':'s'}">${d.level}</span>` },
        { key:'rank',        label:'获奖名次',       w:'90px',  render: d=>d.rank },
        { key:'publishDate', label:'发布时间',       w:'110px', render: d=>`<span class="cell-mute">${d.publishDate}</span>` },
        { key:'no',          label:'文件编号',       w:'110px', render: d=>`<span class="cell-id">${d.no}</span>` },
        { key:'issuer',      label:'发奖单位',       w:'140px', render: d=>d.issuer },
        { key:'member',      label:'人员',           w:'140px', render: d=>d.member }
    ];
    pg.innerHTML = `
        ${pageHeader('荣誉材料管理', `共 ${items.length} 项荣誉`, `
            <button class="btn"><span class="material-symbols-rounded">file_download</span>导出</button>
            <button class="btn primary" id="honorBtnNew"><span class="material-symbols-rounded">add</span>新增</button>
        `)}
        ${toolbar({ searchPh:'搜索荣誉名称 / 颁发机关…' })}
        ${tableShell(cols, 'honorBody')}`;
    InfiniteList.bind({ source: items, pageSize: 14, container:'honorBody', render: tableRow(cols) });
    $('#honorBtnNew').onclick = () => openModal('新增 荣誉材料', docHonorFormModal(), { width:'720px', height:'600px' });
}
window.docHonorFormModal = function(){
    return `
    <div class="bf-form">
        <div class="bf-section">荣誉材料</div>
        <div class="bf-grid">
            <div class="bf-cell bf-span-2"><label>荣誉名称 <i>*</i></label><input class="bf-ipt" placeholder="如 高新技术企业证书"/></div>
            <div class="bf-cell"><label>荣誉编号 <i>*</i></label><input class="bf-ipt"/></div>
            <div class="bf-cell"><label>级别 <i>*</i></label>
                <select class="bf-ipt"><option>国家级</option><option>省级</option><option>市级</option><option>行业级</option></select>
            </div>
            <div class="bf-cell"><label>颁发机关 <i>*</i></label><input class="bf-ipt"/></div>
            <div class="bf-cell"><label>颁发日期 <i>*</i></label><input class="bf-ipt" type="date"/></div>
            <div class="bf-cell"><label>有效期</label><input class="bf-ipt" placeholder="如 长期 / 至2027"/></div>
            <!-- 需求2001-八：删除 负责人 字段 -->
            <div class="bf-cell bf-span-2"><label>证书附件 <i>*</i></label>
                <div class="bf-upload"><span class="material-symbols-rounded" style="color:var(--primary)">upload_file</span><span class="bf-upload-txt">上传证书扫描件</span><button class="btn">浏览…</button></div>
            </div>
            <div class="bf-cell bf-span-2"><label>备注</label><textarea class="bf-ipt" rows="2"></textarea></div>
        </div>
        <div class="bf-foot"><button class="btn" onclick="closeModal()">取消</button><button class="btn primary" onclick="closeModal()"><span class="material-symbols-rounded">save</span>保存</button></div>
    </div>`;
};

// ---------- 5. 分支机构管理 ----------
window.MOCK_DOCS_BRANCH = window.MOCK_DOCS_BRANCH || (function(){
    const out = [];
    const brs = ['一分公司','二分公司','三分公司','华东分公司','华南分公司','西部分公司','北方办事处','长三角办事处'];
    const cities = ['南京','上海','广州','成都','北京','深圳','武汉','西安'];
    for (let i = 0; i < 8; i++) {
        out.push({
            id: 'BRC' + String(2026001 + i).padStart(7,'0'),
            name: brs[i],
            type: i < 6 ? '分公司' : '办事处',
            city: cities[i],
            address: cities[i] + '市某某区某某路 ' + (100+i) + ' 号',
            leader: ['李分总','张分总','王分总','陈分总'][i%4],
            phone: '025-' + String(80000000 + i*123).slice(0,8),
            staff: 10 + i*4,
            establish: '202' + (i%6) + '-' + String(((i%12)+1)).padStart(2,'0') + '-15'
        });
    }
    return out;
})();
function renderDocsBranch(){
    const pg = $('#pages');
    const items = MOCK_DOCS_BRANCH;
    const cols = [
        { key:'id',      label:'机构编号', w:'120px', render: d=>`<span class="cell-id">${d.id}</span>` },
        { key:'name',    label:'机构名称', w:'130px', render: d=>d.name },
        { key:'type',    label:'类型',     w:'80px',  render: d=>`<span class="chip ${d.type==='分公司'?'p':'a'}">${d.type}</span>` },
        { key:'city',    label:'所在城市', w:'90px',  render: d=>d.city },
        { key:'address', label:'详细地址',           render: d=>`<span class="cell-mute">${d.address}</span>` },
        { key:'leader',  label:'负责人',   w:'80px',  render: d=>d.leader },
        { key:'phone',   label:'联系电话', w:'130px', render: d=>`<span class="cell-mute">${d.phone}</span>` },
        { key:'staff',   label:'人员数',   w:'80px',  align:'right', render: d=>d.staff },
        { key:'establish', label:'成立日期', w:'110px', render: d=>`<span class="cell-mute">${d.establish}</span>` },
        { key:'_act',    label:'操作',     w:'130px', render: d=>actBtns([{icon:'visibility',title:'详情'},{icon:'edit',title:'编辑'},{icon:'delete',title:'删除'}]) }
    ];
    pg.innerHTML = `
        ${pageHeader('分支机构管理', `共 ${items.length} 个分支机构`, `
            <button class="btn"><span class="material-symbols-rounded">file_download</span>导出</button>
            <button class="btn primary" id="brcBtnNew"><span class="material-symbols-rounded">add</span>新增</button>
        `)}
        ${toolbar({ searchPh:'搜索机构名称 / 城市…' })}
        ${tableShell(cols, 'brcBody')}`;
    InfiniteList.bind({ source: items, pageSize: 14, container:'brcBody', render: tableRow(cols) });
    $('#brcBtnNew').onclick = () => openModal('新增 分支机构', docBranchFormModal(), { width:'780px', height:'620px' });
}
window.docBranchFormModal = function(){
    return `
    <div class="bf-form">
        <div class="bf-section">分支机构</div>
        <div class="bf-grid">
            <div class="bf-cell bf-span-2"><label>机构名称 <i>*</i></label><input class="bf-ipt" placeholder="如 华东分公司"/></div>
            <div class="bf-cell"><label>机构类型 <i>*</i></label>
                <select class="bf-ipt"><option>分公司</option><option>子公司</option><option>办事处</option><option>项目部</option></select>
            </div>
            <div class="bf-cell"><label>所在城市 <i>*</i></label><input class="bf-ipt"/></div>
            <div class="bf-cell"><label>负责人 <i>*</i></label><input class="bf-ipt"/></div>
            <div class="bf-cell"><label>联系电话 <i>*</i></label><input class="bf-ipt"/></div>
            <div class="bf-cell"><label>人员数</label><input class="bf-ipt" type="number" placeholder="0"/></div>
            <div class="bf-cell"><label>成立日期 <i>*</i></label><input class="bf-ipt" type="date"/></div>
            <div class="bf-cell bf-span-2"><label>详细地址 <i>*</i></label><input class="bf-ipt"/></div>
            <div class="bf-cell bf-span-2"><label>备注</label><textarea class="bf-ipt" rows="2"></textarea></div>
        </div>
        <div class="bf-foot"><button class="btn" onclick="closeModal()">取消</button><button class="btn primary" onclick="closeModal()"><span class="material-symbols-rounded">save</span>保存</button></div>
    </div>`;
};

// ---------- 6. 共享文档管理 ----------
window.MOCK_DOCS_SHARE = window.MOCK_DOCS_SHARE || (function(){
    const out = [];
    const folders = ['投标模板','项目模板','合同模板','技术方案','培训资料','制度文件'];
    const names = ['投标书模板.docx','项目立项申请书.docx','客户合同范本.pdf','技术方案模板.docx','员工手册.pdf','质量管理制度.pdf'];
    for (let i = 0; i < 16; i++) {
        out.push({
            id: 'SHR' + String(2026001 + i).padStart(7,'0'),
            folder: folders[i%folders.length],
            name: names[i%names.length],
            type: names[i%names.length].split('.').pop().toUpperCase(),
            size: ((i*0.3+0.5).toFixed(1)) + ' MB',
            uploader: ['李明','张华','王芳','赵磊'][i%4],
            uploaded: '2024-' + String(((i%12)+1)).padStart(2,'0') + '-' + String(((i%28)+1)).padStart(2,'0'),
            access: ['全员可见','部门可见','指定人员'][i%3]
        });
    }
    return out;
})();
function renderDocsShare(){
    const pg = $('#pages');
    const items = MOCK_DOCS_SHARE;
    const cols = [
        { key:'folder', label:'所在目录', w:'110px', render: d=>`<span class="chip p">${d.folder}</span>` },
        { key:'name',   label:'文档名称',           render: d=>`<span style="display:inline-flex;align-items:center;gap:8px"><span class="material-symbols-rounded" style="font-size:18px;color:var(--primary)">${d.type==='PDF'?'picture_as_pdf':(d.type==='DOCX'?'description':'article')}</span>${d.name}</span>` },
        { key:'type',   label:'类型',     w:'70px',  render: d=>`<span class="cell-mute">${d.type}</span>` },
        { key:'size',   label:'大小',     w:'80px',  align:'right', render: d=>`<span class="cell-mute">${d.size}</span>` },
        { key:'uploader', label:'上传人',  w:'80px',  render: d=>d.uploader },
        { key:'uploaded', label:'上传日期', w:'110px', render: d=>`<span class="cell-mute">${d.uploaded}</span>` },
        { key:'access', label:'访问权限', w:'100px', render: d=>`<span class="chip ${d.access==='全员可见'?'s':d.access==='部门可见'?'a':'w'}">${d.access}</span>` },
        { key:'_act',   label:'操作',     w:'150px', render: d=>actBtns([{icon:'visibility',title:'预览'},{icon:'download',title:'下载'},{icon:'share',title:'分享'},{icon:'delete',title:'删除'}]) }
    ];
    pg.innerHTML = `
        ${pageHeader('共享文档管理', `共 ${items.length} 份共享文档`, `
            <button class="btn"><span class="material-symbols-rounded">create_new_folder</span>新建目录</button>
            <button class="btn primary" id="shrBtnNew"><span class="material-symbols-rounded">upload</span>上传文档</button>
        `)}
        ${toolbar({
            filters:[
                { value:'all', label:'全部', active:true, count: items.length },
                ...[...new Set(items.map(d=>d.folder))].map(f => ({ value:f, label:f, count: items.filter(d=>d.folder===f).length }))
            ],
            searchPh:'搜索文档名称 / 上传人…'
        })}
        ${tableShell(cols, 'shrBody')}`;
    InfiniteList.bind({ source: items, pageSize: 14, container:'shrBody', render: tableRow(cols) });
    $('#shrBtnNew').onclick = () => openModal('上传 共享文档', docShareFormModal(), { width:'720px', height:'560px' });
}
window.docShareFormModal = function(){
    return `
    <div class="bf-form">
        <div class="bf-section">上传共享文档</div>
        <div class="bf-grid">
            <div class="bf-cell"><label>所属目录 <i>*</i></label>
                <select class="bf-ipt"><option>投标模板</option><option>项目模板</option><option>合同模板</option><option>技术方案</option><option>培训资料</option><option>制度文件</option></select>
            </div>
            <div class="bf-cell"><label>访问权限 <i>*</i></label>
                <select class="bf-ipt"><option>全员可见</option><option>部门可见</option><option>指定人员</option></select>
            </div>
            <div class="bf-cell bf-span-2"><label>文档名称 <i>*</i></label><input class="bf-ipt" placeholder="自动从上传文件读取，可修改"/></div>
            <div class="bf-cell bf-span-2"><label>文档说明</label><textarea class="bf-ipt" rows="2" placeholder="一句话描述这份文档的用途"></textarea></div>
            <div class="bf-cell bf-span-2"><label>选择文件 <i>*</i></label>
                <div class="bf-upload"><span class="material-symbols-rounded" style="color:var(--primary)">upload_file</span><span class="bf-upload-txt">点击或拖拽上传 (单次最多 100MB)</span><button class="btn">浏览…</button></div>
            </div>
        </div>
        <div class="bf-foot"><button class="btn" onclick="closeModal()">取消</button><button class="btn primary" onclick="closeModal()"><span class="material-symbols-rounded">cloud_upload</span>上传</button></div>
    </div>`;
};

// ============ 设备管理：软件管理 ============
function renderDeviceSoftware(){
    const pg = $('#pages');
    const items = MOCK_SOFTWARE;
    const self = items.filter(s=>s.kind==='自研');
    const buy  = items.filter(s=>s.kind==='采购');
    const cols = [
        { key:'id',     label: t('common.id'),     w:'110px', render: s=>`<span class="cell-id">${s.id}</span>` },
        { key:'name',   label: t('common.name'),   render: s=>s.name },
        { key:'kind',   label: t('common.kind'),   w:'80px',  render: s=>`<span class="chip ${s.kind==='自研'?'s':'a'}">${tt(s.kind)}</span>` },
        { key:'version',label: t('common.version'),w:'90px',  render: s=>s.version },
        { key:'_src',   label: State.lang==='en'?'Source':'来源', w:'130px', render: s=>s.kind==='自研'?(State.lang==='en'?'Internal':'内部')+(s.lang?' · '+s.lang:''):s.vendor },
        { key:'_users', label: t('common.users'),  w:'80px', align:'right', render: s=>s.kind==='自研'?s.users:`${s.used}/${s.licenses}` },
        { key:'_date',  label: State.lang==='en'?'Date':'日期', w:'110px', render: s=>`<span class="cell-mute">${s.kind==='自研'?s.release:s.expire}</span>` },
        { key:'_cost',  label: State.lang==='en'?'Cost':'年费', w:'90px', align:'right', render: s=>s.kind==='自研'?'<span class="cell-mute">—</span>':`¥${s.cost}${State.lang==='en'?'':'万'}` },
        { key:'status', label: t('common.status'), w:'100px', render: s=>`<span class="chip s">${s.kind==='自研'?tt(s.status||'正常运行'):(State.lang==='en'?'Active':'生效')}</span>` },
        { key:'_act',   label: t('common.action'), w:'80px',  render: s=>actBtns([{icon:'visibility',title:t('btn.detail')}]) }
    ];
    pg.innerHTML = `
        ${pageHeader(State.lang==='en'?'Software':'软件管理', `${tt('自研')} ${self.length} · ${tt('采购')} ${buy.length}`, `
            <button class="btn"><span class="material-symbols-rounded">file_download</span>${t('btn.export')}</button>
            <button class="btn primary"><span class="material-symbols-rounded">add</span>${t('btn.add')}</button>
        `)}
        ${statRow([
            { l: State.lang==='en'?'Total':'软件总数', v: items.length, c:'p' },
            { l: tt('自研'), v: self.length, c:'s' },
            { l: tt('采购'), v: buy.length, c:'a' },
            { l: t('common.licenses'), v: buy.reduce((s,b)=>s+(b.licenses||0),0), c:'w' }
        ])}
        ${toolbar({
            filters:[
                { value:'all', label:t('common.all'), active:true, count: items.length },
                { value:'自研', label:tt('自研'), count: self.length },
                { value:'采购', label:tt('采购'), count: buy.length }
            ],
            searchPh: State.lang==='en'?'Search software / vendor…':'搜索软件 / 厂商…'
        })}
        ${tableShell(cols, 'swBody')}`;
    InfiniteList.bind({ source: items, pageSize: 14, container:'swBody', render: tableRow(cols) });
}

// ============ 设备管理：硬件管理 ============
function renderDeviceHardware(){
    const pg = $('#pages');
    const items = MOCK_HARDWARE;
    const cats = ['计算机','服务器','测绘工具','无人机'];
    const cols = [
        { key:'id',     label: t('common.id'),     w:'120px', render: h=>`<span class="cell-id">${h.id}</span>` },
        { key:'cat',    label: t('common.cat'),    w:'100px', render: h=>`<span class="chip ${h.cat==='计算机'?'p':h.cat==='服务器'?'a':h.cat==='测绘工具'?'s':'w'}">${tt(h.cat)}</span>` },
        { key:'name',   label: t('common.name'),   render: h=>{
            const ico = h.cat==='计算机'?'computer':h.cat==='服务器'?'dns':h.cat==='测绘工具'?'precision_manufacturing':'flight';
            return `<span style="display:inline-flex;align-items:center;gap:6px"><span class="material-symbols-rounded" style="font-size:16px;color:var(--primary)">${ico}</span>${h.name}</span>`;
        } },
        { key:'spec',   label: t('common.spec'),   render: h=>`<span class="cell-mute">${h.spec}</span>` },
        { key:'user',   label: t('common.user'),   w:'100px', render: h=>h.user },
        { key:'dept',   label: t('common.dept'),   w:'110px', render: h=>h.dept },
        { key:'buy',    label: t('common.buy'),    w:'110px', render: h=>`<span class="cell-mute">${h.buy}</span>` },
        { key:'status', label: t('common.status'), w:'100px', render: h=>`<span class="chip ${h.status==='在用'||h.status==='运行中'||h.status==='在线'?'s':h.status==='维修中'||h.status==='维护中'||h.status==='检定中'?'w':'a'}">${tt(h.status)}</span>` },
        { key:'_act',   label: t('common.action'), w:'100px', render: h=>actBtns([{icon:'visibility',title:t('btn.detail')},{icon:'build',title:State.lang==='en'?'Maintenance':'维护记录'}]) }
    ];
    pg.innerHTML = `
        ${pageHeader(State.lang==='en'?'Hardware':'硬件管理', `${t('page.totalCount',{n:items.length})}`, `
            <button class="btn"><span class="material-symbols-rounded">file_download</span>${t('btn.export')}</button>
            <button class="btn primary"><span class="material-symbols-rounded">add</span>${t('btn.add')}</button>
        `)}
        ${statRow(cats.map((c,i)=>{
            const list = items.filter(h=>h.cat===c);
            return { l: tt(c), v: list.length, c: ['p','a','s','w'][i] };
        }))}
        ${toolbar({
            filters:[
                { value:'all', label:t('common.all'), active:true, count: items.length },
                ...cats.map(c=>({ value:c, label:tt(c), count: items.filter(h=>h.cat===c).length }))
            ],
            searchPh: State.lang==='en'?'Search device / id / user…':'搜索设备名 / 编号 / 使用人…'
        })}
        ${tableShell(cols, 'hwBody')}`;
    InfiniteList.bind({ source: items, pageSize: 14, container:'hwBody', render: tableRow(cols) });
}

// ============ AI 助手 ============
function renderAiAssistant(){
    const pg = $('#pages');
    pg.innerHTML = `
        ${pageHeaderKeep('天润 AI 助手', '已接入项目数据 · 智能问答 · 任务自动化', `
            <button class="btn"><span class="material-symbols-rounded">history</span>历史会话</button>
            <button class="btn primary" id="btnOpenAi"><span class="material-symbols-rounded">launch</span>展开侧边栏</button>
        `)}
        <div class="ai-grid">
            <div class="ai-card">
                <div class="ai-card-h"><span class="material-symbols-rounded">tips_and_updates</span><div class="t">智能能力总览</div></div>
                <div class="ai-card-b">
                    <ul class="ai-list">
                        <li><span class="material-symbols-rounded">analytics</span>实时项目数据分析与解读</li>
                        <li><span class="material-symbols-rounded">forum</span>自然语言查询任意业务数据</li>
                        <li><span class="material-symbols-rounded">bolt</span>跨模块任务自动编排（生成报告 / 周报 / 月度小结）</li>
                        <li><span class="material-symbols-rounded">edit_note</span>文档智能生成（投标书框架 / 项目方案 / 周报）</li>
                        <li><span class="material-symbols-rounded">notifications_active</span>关键节点风险提醒（延期 / 超支 / 流标）</li>
                    </ul>
                </div>
            </div>
            <div class="ai-card">
                <div class="ai-card-h"><span class="material-symbols-rounded">insights</span><div class="t">本周 AI 调用统计</div></div>
                <div class="ai-card-b">
                    <div class="ai-stat-row"><span>总调用次数</span><b>1,284</b></div>
                    <div class="ai-stat-row"><span>独立用户</span><b>32 人</b></div>
                    <div class="ai-stat-row"><span>报告自动生成</span><b>87 份</b></div>
                    <div class="ai-stat-row"><span>平均响应时间</span><b>1.4 s</b></div>
                    <div class="ai-stat-row"><span>满意度</span><b style="color:var(--emerald)">96.4%</b></div>
                </div>
            </div>
            <div class="ai-card">
                <div class="ai-card-h"><span class="material-symbols-rounded">history</span><div class="t">最近问询</div></div>
                <div class="ai-card-b">
                    <div class="ai-his">"本月有哪些项目可能延期？"<span>5 分钟前</span></div>
                    <div class="ai-his">"帮我生成上周日报汇总"<span>2 小时前</span></div>
                    <div class="ai-his">"哪些合同即将到期？"<span>昨天</span></div>
                    <div class="ai-his">"统计本季度费用支出"<span>昨天</span></div>
                    <div class="ai-his">"投标量同比环比怎么样"<span>05-04</span></div>
                </div>
            </div>
            <div class="ai-card">
                <div class="ai-card-h"><span class="material-symbols-rounded">extension</span><div class="t">已接入数据源</div></div>
                <div class="ai-card-b">
                    <div class="ai-src"><span class="dot s"></span>项目管理库 · 60 项目</div>
                    <div class="ai-src"><span class="dot s"></span>合同库 · 110 合同</div>
                    <div class="ai-src"><span class="dot s"></span>招投标库 · 80 条</div>
                    <div class="ai-src"><span class="dot s"></span>工天数据 · 实时</div>
                    <div class="ai-src"><span class="dot s"></span>费用 / 报销 · 实时</div>
                    <div class="ai-src"><span class="dot a"></span>知识库 · 1,236 文档</div>
                </div>
            </div>
        </div>
    `;
    const open = $('#btnOpenAi');
    if (open) open.onclick = ()=>{
        const panel = $('#aiPanel'); if (panel) panel.classList.add('open');
    };
}

// ============ 系统设置：人员管理 ============
function renderSysUser(){
    const pg = $('#pages');
    const items = MOCK_USERS;
    const cols = [
        { key:'id',    label: State.lang==='en'?'Emp ID':'工号', w:'110px', render: u=>`<span class="cell-id">${u.id}</span>` },
        { key:'name',  label: t('common.name'),  w:'130px', render: u=>`<span class="user-pill"><span class="ava">${u.name[0]}</span>${u.name}</span>` },
        { key:'dept',  label: t('common.dept'),  w:'120px', render: u=>u.dept },
        { key:'title', label: t('common.grade'), w:'130px', render: u=>u.title },
        { key:'role',  label: t('common.role'),  w:'100px', render: u=>{
            const role = ROLES.find(r=>r.id===u.role) || { name:'-', nameEn:'-' };
            return `<span class="chip p">${roleName(role)}</span>`;
        } },
        { key:'phone', label: t('common.phone'), w:'130px', render: u=>`<span class="cell-mute">${u.phone}</span>` },
        { key:'mail',  label: t('common.email'), render: u=>`<span class="cell-mute">${u.mail}</span>` },
        { key:'join',  label: State.lang==='en'?'Joined':'入职',  w:'110px', render: u=>`<span class="cell-mute">${u.join}</span>` },
        { key:'status',label: t('common.status'),w:'90px',  render: u=>`<span class="chip ${u.status==='在职'?'s':u.status==='离职'?'d':'w'}">${tt(u.status)}</span>` },
        { key:'_act',  label: t('common.action'),w:'100px', render: u=>actBtns([{icon:'edit',title:t('btn.edit')},{icon:'key',title:State.lang==='en'?'Reset Pwd':'重置密码'}]) }
    ];
    pg.innerHTML = `
        ${pageHeader(State.lang==='en'?'Users':'人员管理', `${t('page.totalCount',{n:items.length})}`, `
            <button class="btn"><span class="material-symbols-rounded">file_download</span>${t('btn.export')}</button>
            <button class="btn primary"><span class="material-symbols-rounded">person_add</span>${t('btn.add')}</button>
        `)}
        ${statRow([
            { l: State.lang==='en'?'Total':'员工总数', v: items.length, c:'p' },
            { l: tt('在职'),     v: items.filter(u=>u.status==='在职').length, c:'s' },
            { l: tt('请假'),     v: items.filter(u=>u.status==='请假').length, c:'w' },
            { l: tt('离职'),     v: items.filter(u=>u.status==='离职').length, c:'d' }
        ])}
        ${toolbar({
            filters:[ { value:'all', label:t('common.all'), active:true, count: items.length } ],
            searchPh: State.lang==='en'?'Search name / id / dept…':'搜索姓名 / 工号 / 部门…'
        })}
        ${tableShell(cols, 'userBody')}`;
    InfiniteList.bind({ source: items, pageSize: 14, container:'userBody', render: tableRow(cols) });
}

// ============ 系统设置：部门管理 ============
function renderSysDept(){
    const pg = $('#pages');
    const tree = buildDeptTree(MOCK_DEPTS);
    pg.innerHTML = `
        ${pageHeader('部门管理', '依据部门查看人员 / 项目 / 软硬件使用情况', `
            <button class="btn"><span class="material-symbols-rounded">file_download</span>导出</button>
            <button class="btn primary"><span class="material-symbols-rounded">add</span>新增部门</button>
        `)}
        ${toolbar({ searchPh:'搜索部门 / 负责人…' })}
        <div class="dept-layout">
            <div class="dept-tree-panel">
                <div class="panel-h">部门结构</div>
                <div class="dept-tree">${renderDeptTreeHtml(tree, 0)}</div>
            </div>
            <div class="dept-detail-panel" id="deptDetail">
                ${deptDetailHtml(MOCK_DEPTS[1])}
            </div>
        </div>`;
    $$('.dept-node').forEach(node => {
        node.onclick = (e) => {
            e.stopPropagation();
            const id = node.dataset.id;
            const dept = MOCK_DEPTS.find(d=>d.id===id);
            $$('.dept-node').forEach(n=>n.classList.remove('active'));
            node.classList.add('active');
            $('#deptDetail').innerHTML = deptDetailHtml(dept);
        };
    });
}
function buildDeptTree(list){
    const map = {}; list.forEach(d=>map[d.id]={...d, children:[]});
    list.forEach(d=>{ if (d.parent && map[d.parent]) map[d.parent].children.push(map[d.id]); });
    return list.filter(d=>!d.parent).map(d=>map[d.id]);
}
function renderDeptTreeHtml(nodes, depth){
    return nodes.map(n => `
        <div class="dept-node" data-id="${n.id}" style="padding-left:${12 + depth*16}px">
            <span class="material-symbols-rounded" style="font-size:16px;color:var(--primary)">${n.children.length?'folder':'description'}</span>
            <span class="n">${n.name}</span>
            <span class="t">${n.staff}人</span>
        </div>
        ${n.children.length ? renderDeptTreeHtml(n.children, depth+1) : ''}
    `).join('');
}
function deptDetailHtml(d){
    const users = MOCK_USERS.filter(u=>u.dept.includes(d.name) || d.name.includes(u.dept)).slice(0,8);
    const projects = MOCK_PROJECTS.filter((_,i)=>i%3 === MOCK_DEPTS.indexOf(d)%3).slice(0,5);
    const hw = MOCK_HARDWARE.filter(h=>h.dept===d.name).slice(0,5);
    return `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
            <div>
                <h2 style="margin:0;font-size:18px;color:var(--text-1)">${d.name}</h2>
                <div style="font-size:12px;color:var(--text-3);margin-top:2px">部门负责人：${d.leader} · 编制 ${d.staff} 人</div>
            </div>
            <button class="btn"><span class="material-symbols-rounded">edit</span>编辑</button>
        </div>
        ${statRow([
            { l:'部门人员', v: d.staff, c:'p' },
            { l:'承接项目', v: projects.length, c:'a' },
            { l:'设备使用', v: hw.length, c:'s' },
            { l:'本月工时', v: d.staff*120, unit:'h', c:'w' }
        ])}
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:14px">
            <div class="dept-block">
                <div class="dept-bh"><span class="material-symbols-rounded">groups</span>部门人员</div>
                <div class="dept-bb">${users.map(u=>`<div class="dept-row"><span class="user-pill"><span class="ava">${u.name[0]}</span>${u.name}</span><span style="font-size:12px;color:var(--text-3)">${u.title}</span></div>`).join('') || '<div style="color:var(--text-3);font-size:12px;text-align:center;padding:20px">暂无人员</div>'}</div>
            </div>
            <div class="dept-block">
                <div class="dept-bh"><span class="material-symbols-rounded">folder_special</span>承接项目</div>
                <div class="dept-bb">${projects.map(p=>`<div class="dept-row"><span style="font-size:13px">${p.name}</span><span class="chip ${p.statusColor}">${p.status}</span></div>`).join('') || '<div style="color:var(--text-3);font-size:12px;text-align:center;padding:20px">暂无项目</div>'}</div>
            </div>
            <div class="dept-block" style="grid-column:1/-1">
                <div class="dept-bh"><span class="material-symbols-rounded">devices</span>软硬件使用情况</div>
                <div class="dept-bb">${hw.length ? hw.map(h=>`<div class="dept-row"><span style="font-size:13px"><span class="material-symbols-rounded" style="vertical-align:-4px;font-size:16px;color:var(--primary)">${h.cat==='计算机'?'computer':h.cat==='服务器'?'dns':h.cat==='测绘工具'?'precision_manufacturing':'flight'}</span> ${h.name}</span><span style="font-size:12px;color:var(--text-2)">${h.user} · ${h.spec}</span></div>`).join('') : '<div style="color:var(--text-3);font-size:12px;text-align:center;padding:20px">暂无设备</div>'}</div>
            </div>
        </div>`;
}

// ============ 系统设置：角色管理 ============
function renderSysRole(){
    const pg = $('#pages');
    const cols = [
        { key:'id',    label: State.lang==='en'?'Role ID':'角色 ID', w:'90px',  render: r=>`<span class="cell-id"><span style="display:inline-block;width:10px;height:10px;border-radius:3px;background:${r.color};vertical-align:-1px;margin-right:6px"></span>${r.id}</span>` },
        { key:'name',  label: State.lang==='en'?'Role Name':'角色名称', w:'150px', render: r=>`<b>${roleName(r)}</b>` },
        { key:'tag',   label: State.lang==='en'?'Tag':'标签',  w:'130px', render: r=>roleTag(r) },
        { key:'scope', label: t('top.role.scope'), w:'110px', render: r=>`<span class="chip p">${roleScope(r)}</span>` },
        { key:'_perm', label: State.lang==='en'?'Modules':'权限模块', render: r=>{
            const list = (PERMISSIONS && PERMISSIONS[r.id]) || [];
            return list.length>=11 ? (State.lang==='en'?'All modules':'全部模块') : list.length+' '+(State.lang==='en'?'modules':'个模块');
        } },
        { key:'_users',label: State.lang==='en'?'Users':'已分配人数', w:'110px', align:'right', render: r=>MOCK_USERS.filter(u=>u.role===r.id).length },
        { key:'_act',  label: t('common.action'), w:'100px', render: r=>actBtns([{icon:'key',title:State.lang==='en'?'Permissions':'权限'},{icon:'edit',title:t('btn.edit')}]) }
    ];
    pg.innerHTML = `
        ${pageHeader(State.lang==='en'?'Roles':'角色管理', `${ROLES.length} ${State.lang==='en'?'built-in roles':'个内置角色'}`, `
            <button class="btn primary"><span class="material-symbols-rounded">add</span>${t('btn.add')}</button>
        `)}
        ${toolbar({ searchPh: State.lang==='en'?'Search role…':'搜索角色名称…' })}
        <div class="table-wrap"><table class="data-table">
            <thead><tr>${cols.map(c=>{const styles=[]; if(c.w)styles.push('width:'+c.w); if(c.align)styles.push('text-align:'+c.align); return `<th${styles.length?` style="${styles.join(';')}"`:''}>${c.label}</th>`;}).join('')}</tr></thead>
            <tbody>${ROLES.map(tableRow(cols)).join('')}</tbody>
        </table></div>`;
}

// ============ 系统设置：字典管理 ============
function renderSysDict(){
    const pg = $('#pages');
    const cols = [
        { key:'id',    label: t('common.id'),     w:'100px', render: d=>`<span class="cell-id">${d.id}</span>` },
        { key:'code',  label: State.lang==='en'?'Code':'编码',     w:'170px', render: d=>`<span class="chip p">${d.code}</span>` },
        { key:'name',  label: t('common.name'),   w:'150px', render: d=>`<b>${d.name}</b>` },
        { key:'items', label: State.lang==='en'?'Values':'字典项', render: d=>`<div style="display:flex;flex-wrap:wrap;gap:4px">${d.items.map(i=>`<span class="chip a" style="font-size:11px">${tt(i)}</span>`).join('')}</div>` },
        { key:'_cnt',  label: State.lang==='en'?'Count':'项数',     w:'80px', align:'right', render: d=>d.items.length },
        { key:'_act',  label: t('common.action'), w:'80px', render: d=>actBtns([{icon:'edit',title:t('btn.edit')}]) }
    ];
    pg.innerHTML = `
        ${pageHeader(State.lang==='en'?'Dictionaries':'字典管理', `${MOCK_DICTS.length} ${State.lang==='en'?'data dictionaries':'个数据字典'}`, `
            <button class="btn primary"><span class="material-symbols-rounded">add</span>${t('btn.add')}</button>
        `)}
        ${toolbar({ searchPh: State.lang==='en'?'Search dictionary…':'搜索字典名称 / 编码…' })}
        <div class="table-wrap"><table class="data-table">
            <thead><tr>${cols.map(c=>{const styles=[]; if(c.w)styles.push('width:'+c.w); if(c.align)styles.push('text-align:'+c.align); return `<th${styles.length?` style="${styles.join(';')}"`:''}>${c.label}</th>`;}).join('')}</tr></thead>
            <tbody>${MOCK_DICTS.map(tableRow(cols)).join('')}</tbody>
        </table></div>`;
}

// ============ 系统设置：菜单管理 ============
function renderSysMenu(){
    const pg = $('#pages');
    pg.innerHTML = `
        ${pageHeader(State.lang==='en'?'Menus':'菜单管理', `${MENU.length} ${State.lang==='en'?'top-level':'一级菜单'} · ${MENU.reduce((s,m)=>s+m.children.length,0)} ${State.lang==='en'?'sub':'二级菜单'}`, `
            <button class="btn primary"><span class="material-symbols-rounded">add</span>${t('btn.add')}</button>
        `)}
        ${toolbar({ searchPh: State.lang==='en'?'Search menu…':'搜索菜单名称…' })}
        <div class="table-wrap"><table class="data-table">
            <thead><tr><th style="width:160px">${State.lang==='en'?'Key':'菜单 Key'}</th><th style="width:60px">${State.lang==='en'?'Icon':'图标'}</th><th>${State.lang==='en'?'Menu Name':'菜单名称'}</th><th style="width:80px">${State.lang==='en'?'Level':'层级'}</th><th style="width:160px">${State.lang==='en'?'View':'视图'}</th><th style="width:60px">${State.lang==='en'?'Order':'排序'}</th><th style="width:80px">${t('common.status')}</th><th style="width:80px">${t('common.action')}</th></tr></thead>
            <tbody>
                ${MENU.map((m, idx) => `
                    <tr style="background:var(--primary-soft)">
                        <td><span class="cell-id">${m.key}</span></td>
                        <td><span class="material-symbols-rounded" style="color:var(--primary)">${m.icon}</span></td>
                        <td><b>${menuTitle(m)}</b></td>
                        <td><span class="chip p">${State.lang==='en'?'L1':'一级'}</span></td>
                        <td><span class="cell-mute">—</span></td>
                        <td>${idx+1}</td>
                        <td><span class="chip s">${tt('启用')}</span></td>
                        <td>${actBtns([{icon:'edit',title:t('btn.edit')}])}</td>
                    </tr>
                    ${m.children.map((c, i)=>`
                    <tr>
                        <td style="padding-left:32px"><span class="cell-mute">${c.key}</span></td>
                        <td><span class="material-symbols-rounded" style="color:var(--text-3)">${c.icon}</span></td>
                        <td>${menuTitle(c)}</td>
                        <td><span class="chip a">${State.lang==='en'?'L2':'二级'}</span></td>
                        <td><code style="font-size:11px;color:var(--text-2)">${c.view}</code></td>
                        <td>${i+1}</td>
                        <td><span class="chip s">${tt('启用')}</span></td>
                        <td>${actBtns([{icon:'edit',title:t('btn.edit')}])}</td>
                    </tr>
                    `).join('')}
                `).join('')}
            </tbody>
        </table></div>`;
}

// ============ 系统设置：日志管理 ============
function renderSysLog(){
    const pg = $('#pages');
    const items = MOCK_LOGS;
    const cols = [
        { key:'id',    label: t('common.id'),     w:'130px', render: l=>`<span class="cell-id">${l.id}</span>` },
        { key:'time',  label: t('common.date'),   w:'150px', render: l=>`<span class="cell-mute">${l.time}</span>` },
        { key:'user',  label: t('common.user'),   w:'130px', render: l=>`<span class="user-pill"><span class="ava">${l.user[0]}</span>${l.user}</span>` },
        { key:'op',    label: State.lang==='en'?'Operation':'操作', render: l=>l.op },
        { key:'type',  label: t('common.type'),   w:'90px',  render: l=>`<span class="chip ${l.typeC}"><span class="material-symbols-rounded" style="font-size:12px;vertical-align:-2px">${l.typeIcon}</span> ${tt(l.type)}</span>` },
        { key:'target',label: State.lang==='en'?'Target':'目标', w:'160px', render: l=>`<code style="font-size:12px;color:var(--text-2)">${l.target}</code>` },
        { key:'ip',    label: 'IP',               w:'110px', render: l=>`<span class="cell-mute">${l.ip}</span>` },
        { key:'status',label: t('common.status'), w:'80px',  render: l=>l.status==='成功'?`<span class="chip s">${t('status.success')}</span>`:`<span class="chip d">${t('status.fail')}</span>` }
    ];
    pg.innerHTML = `
        ${pageHeader(State.lang==='en'?'Logs':'日志管理', `${t('page.totalCount',{n:items.length})}`, `
            <button class="btn"><span class="material-symbols-rounded">file_download</span>${t('btn.export')}</button>
        `)}
        ${statRow([
            { l: State.lang==='en'?'Total':'日志总数', v: items.length, c:'p' },
            { l: tt('登录'),     v: items.filter(l=>l.type==='登录').length, c:'a' },
            { l: tt('修改'),     v: items.filter(l=>l.type==='修改').length, c:'w' },
            { l: State.lang==='en'?'Failures':'失败次数', v: items.filter(l=>l.status==='失败').length, c:'d' }
        ])}
        ${toolbar({
            filters:[
                { value:'all', label:t('common.all'), active:true, count: items.length },
                { value:'登录', label:tt('登录') }, { value:'修改', label:tt('修改') }, { value:'新增', label:tt('新增') },
                { value:'删除', label:tt('删除') }, { value:'审批', label:tt('审批') }, { value:'导出', label:tt('导出') }
            ],
            searchPh: State.lang==='en'?'Search op / user / target…':'搜索操作 / 用户 / 目标…'
        })}
        ${tableShell(cols, 'logBody')}`;
    InfiniteList.bind({ source: items, pageSize: 16, container:'logBody', render: tableRow(cols) });
}

// ============ 消息中心：列表 + 详情 ============
let _msgState = { current: 'm1', filter: 'all' };

function renderMessageCenter(){
    const pg = $('#pages');
    pg.innerHTML = `
        ${pageHeaderKeep('消息中心', '项目群 / 系统通知 / 审批 / 私聊 · 一站式入口', `
            <button class="btn"><span class="material-symbols-rounded">done_all</span>全部已读</button>
            <button class="btn primary"><span class="material-symbols-rounded">edit_note</span>新建</button>
        `)}
        <div class="cs-layout">
            <div class="msg-list-panel" id="msgListPanel">
                <div style="padding:10px 14px;border-bottom:1px solid var(--glass-border)">
                    <div class="tab-bar" id="msgTabs" style="margin-bottom:0;width:100%">
                        <div class="tab active" data-f="all">全部</div>
                        <div class="tab" data-f="project">项目群</div>
                        <div class="tab" data-f="appr">审批</div>
                        <div class="tab" data-f="bid">招投标</div>
                        <div class="tab" data-f="p2p">私聊</div>
                    </div>
                </div>
                <div class="msg-list" id="msgList"></div>
            </div>
            <div class="msg-detail-panel" id="msgDetail"></div>
        </div>`;
    renderMsgList();
    renderMsgDetail(_msgState.current);
    $$('#msgTabs .tab').forEach(t => t.onclick = () => {
        $$('#msgTabs .tab').forEach(x=>x.classList.remove('active'));
        t.classList.add('active');
        _msgState.filter = t.dataset.f;
        renderMsgList();
    });
}

function renderMsgList(){
    const list = $('#msgList');
    if (!list) return;
    let items = CONVERSATIONS;
    if (_msgState.filter !== 'all') items = items.filter(c=>c.type === _msgState.filter);
    list.innerHTML = items.map(c => `
        <div class="msg-row ${c.id===_msgState.current?'active':''}" data-id="${c.id}">
            <div class="ava ${c.ava}">${c.avaText}</div>
            <div class="info">
                <div class="row1">
                    <div class="name">${c.name}</div>
                    <div class="time">${c.time}</div>
                </div>
                <div class="row2">
                    <div class="last">${c.mention?'<span class="mt">[@] </span>':''}${c.last}</div>
                    ${c.unread>0?`<div class="cnt">${c.unread}</div>`:''}
                </div>
            </div>
        </div>`).join('') || '<div class="msg-empty"><span class="material-symbols-rounded">inbox</span><div class="t">无消息</div></div>';
    $$('.msg-row').forEach(el => el.onclick = () => {
        _msgState.current = el.dataset.id;
        $$('.msg-row').forEach(x=>x.classList.remove('active'));
        el.classList.add('active');
        renderMsgDetail(_msgState.current);
    });
}

function renderMsgDetail(id){
    const detail = $('#msgDetail');
    if (!detail) return;
    const c = CONVERSATIONS.find(x=>x.id===id);
    if (!c) {
        detail.innerHTML = '<div class="msg-empty"><span class="material-symbols-rounded">forum</span><div class="t">选择一个会话</div></div>';
        return;
    }
    detail.innerHTML = `
        <div class="head">
            <div class="ava ${c.ava}">${c.avaText}</div>
            <div class="ti">
                <div class="n">${c.name}</div>
                <div class="s">${c.kind==='group'?'群组':c.kind==='system'?'系统通知':'私聊'} · ${c.messages.length} 条消息</div>
            </div>
            <div class="acts">
                <button class="btn-icon" title="搜索"><span class="material-symbols-rounded">search</span></button>
                <button class="btn-icon" title="设置"><span class="material-symbols-rounded">tune</span></button>
                <button class="btn-icon" title="更多"><span class="material-symbols-rounded">more_horiz</span></button>
            </div>
        </div>
        <div class="body">
            ${c.messages.map(m => `
                <div class="msg-bubble ${m.me?'me':''}">
                    <div class="ava-sm ${m.avaCol||'p'}">${m.avaText||m.from[0]}</div>
                    <div class="bubble-wrap">
                        <div class="from ${m.me?'me':''}">${m.from} · ${m.t}</div>
                        <div class="bubble ${m.mention?'mention':''}">${m.body}</div>
                    </div>
                </div>
            `).join('')}
        </div>
        <div class="actions-bar">
            <input placeholder="输入消息..." style="flex:1;padding:8px 14px;border-radius:10px;border:1px solid var(--glass-border);background:var(--glass-bg-2);outline:none;font-size:13px"/>
            <button class="btn-icon" title="附件"><span class="material-symbols-rounded">attach_file</span></button>
            <button class="btn-icon" title="表情"><span class="material-symbols-rounded">mood</span></button>
            <button class="btn primary"><span class="material-symbols-rounded">send</span>发送</button>
        </div>
    `;
}

// ============ 通用弹窗 ============
window.openModal = function(title, bodyHtml, opts){
    const overlay = $('#modalOverlay');
    const win = $('#modalWindow');
    $('#modalTitle').textContent = title;
    $('#modalBody').innerHTML = bodyHtml;
    overlay.classList.add('open');
    win.classList.add('open');
    if (opts && opts.width)  win.style.width  = opts.width;
    if (opts && opts.height) win.style.height = opts.height;
    if (opts && opts.onOpen) opts.onOpen($('#modalBody'));
};

window.closeModal = function(){
    $('#modalOverlay').classList.remove('open');
    $('#modalWindow').classList.remove('open');
};

