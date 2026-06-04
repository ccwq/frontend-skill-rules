// ============================================================
// 数据定义：角色、菜单（按需求重构）、各模块 Mock 数据
// ============================================================

// ---------- 角色 ----------
window.ROLES = [
    { id: 'R1', name: '董事长',         nameEn: 'Chairman',          tag: '战略', tagEn:'Strategy',   scope: '全局', scopeEn:'Global',   color: '#7C3AED' },
    { id: 'R2', name: '总经理',         nameEn: 'General Manager',   tag: '决策', tagEn:'Decision',   scope: '全局', scopeEn:'Global',   color: '#2563EB' },
    { id: 'R3', name: '副总经理',       nameEn: 'Deputy GM',         tag: '业务', tagEn:'Business',   scope: '全局', scopeEn:'Global',   color: '#0891B2' },
    { id: 'R4', name: '商务人员',       nameEn: 'Sales',             tag: '商务', tagEn:'Sales',      scope: '个人', scopeEn:'Personal', color: '#059669' },
    { id: 'R5', name: '经营人员',       nameEn: 'Operations',        tag: '经营', tagEn:'Ops',        scope: '全局', scopeEn:'Global',   color: '#16A34A' },
    { id: 'R6', name: '生产部作业员',   nameEn: 'Operator',          tag: '执行', tagEn:'Execution',  scope: '个人', scopeEn:'Personal', color: '#CA8A04' },
    { id: 'R7', name: '生产经营部部长', nameEn: 'Production Director', tag: '管理', tagEn:'Manage',    scope: '部门', scopeEn:'Dept',     color: '#EA580C' },
    { id: 'R8', name: '项目组长',       nameEn: 'Project Leader',    tag: '组长', tagEn:'Leader',     scope: '组',   scopeEn:'Group',    color: '#DC2626' }
];

// ---------- 角色权限：每个角色可访问的一级菜单 key ----------
window.PERMISSIONS = {
    R1: ['home','bidding','contract','project','expense','outsource','workload','docs','device','ai','user','system'],
    R2: ['home','bidding','contract','project','expense','outsource','workload','docs','device','ai','user','system'],
    R3: ['home','bidding','contract','project','expense','outsource','workload','docs','device','ai'],
    R4: ['home','bidding','contract','project','expense','docs','ai'],
    R5: ['home','bidding','contract','project','expense','outsource','workload','docs','device','ai'],
    R6: ['home','project','expense','workload','docs','ai'],
    R7: ['home','project','expense','outsource','workload','docs','device','ai'],
    R8: ['home','project','expense','workload','docs','ai']
};

// 各角色的「我」的姓名（用于按个人 / 组 / 部门过滤数据）
window.ROLE_USERS = {
    R1:'王董', R2:'王经理', R3:'李副总', R4:'张华',
    R5:'陈静', R6:'李明', R7:'吴强', R8:'赵磊'
};

// ---------- 一级菜单（严格按需求重构） ----------
window.MENU = [
    {
        key: 'home', icon: 'home', title: '首页', titleEn: 'Home',
        defaultChild: 'home/board',
        children: [
            { key: 'home/board', title: '综合数据看板', titleEn:'Dashboard',  view: 'home_board', icon: 'dashboard' },
            { key: 'home/todo',  title: '我的待办',     titleEn:'My Tasks',   view: 'home_todo',  icon: 'task_alt' }
        ]
    },
    {
        key: 'bidding', icon: 'gavel', title: '招投标管理', titleEn: 'Bidding',
        defaultChild: 'bidding/info',
        children: [
            { key: 'bidding/info',    title: '投标报名信息', titleEn:'Bid Registration', view: 'bidding_info',    icon: 'campaign' },
            { key: 'bidding/history', title: '投标历史',   titleEn:'Bid History',  view: 'bidding_history', icon: 'history_edu' },
            { key: 'bidding/cash',    title: '中标管理',   titleEn:'Awarded',      view: 'bidding_cash',    icon: 'workspace_premium' },
            { key: 'bidding/perf',    title: '绩效管理',   titleEn:'Performance',  view: 'bidding_perf',    icon: 'leaderboard' }
        ]
    },
    {
        key: 'contract', icon: 'description', title: '合同管理', titleEn: 'Contracts',
        defaultChild: 'contract/customer',
        children: [
            { key: 'contract/customer',  title: '客户合同', titleEn:'Customer',   view: 'contract_customer', icon: 'handshake' },
            { key: 'contract/outsource', title: '外协合同', titleEn:'Outsource',  view: 'contract_outsource', icon: 'inventory_2' }
        ]
    },
    {
        key: 'project', icon: 'folder_special', title: '项目管理', titleEn: 'Projects',
        defaultChild: 'project/list',
        children: [
            { key: 'project/list', title: '项目列表',   titleEn:'All Projects',  view: 'project_list', icon: 'list_alt' },
            { key: 'project/done', title: '已完成项目', titleEn:'Completed',     view: 'project_done', icon: 'task' }
        ]
    },
    {
        key: 'expense', icon: 'payments', title: '费用报销', titleEn: 'Reimbursement',
        defaultChild: 'expense/trip',
        children: [
            { key: 'expense/trip',    title: '差旅报销',  titleEn:'Travel Reimbursement', view: 'expense_trip',    icon: 'flight_takeoff' },
            { key: 'expense/baoxiao', title: '费用报销',  titleEn:'Reimbursement',        view: 'expense_baoxiao', icon: 'receipt_long' }
        ]
    },
    {
        key: 'outsource', icon: 'group_work', title: '外协管理', titleEn: 'Outsource',
        defaultChild: 'outsource/library',
        children: [
            { key: 'outsource/library',  title: '外协单位库', titleEn:'Vendors',   view: 'outsource_library',  icon: 'apartment' },
            { key: 'outsource/progress', title: '外协进度',   titleEn:'Progress',  view: 'outsource_progress', icon: 'pace' }
        ]
    },
    {
        key: 'workload', icon: 'schedule', title: '工天管理', titleEn: 'Workload',
        defaultChild: 'workload/project',
        children: [
            // 需求2701-二.1：新增二级菜单【项目管理】
            { key: 'workload/project',   title: '项目管理',   titleEn:'Projects',     view: 'workload_project',   icon: 'folder_special' },
            { key: 'workload/process',   title: '工序管理',   titleEn:'Processes',    view: 'workload_process',   icon: 'account_tree' },
            { key: 'workload/assign',    title: '人员分配',   titleEn:'Assignment',   view: 'workload_assign',    icon: 'groups' },
            // 需求2701-二.4：新增二级菜单【日报填写】
            { key: 'workload/dailyfill', title: '日报填写',   titleEn:'Daily Fill',   view: 'workload_dailyfill', icon: 'edit_note' },
            { key: 'workload/daily',     title: '日报管理',   titleEn:'Daily Logs',   view: 'workload_daily',     icon: 'assignment' },
            // 需求2701-二.6：新增二级菜单【审批管理】
            { key: 'workload/approval',  title: '审批管理',   titleEn:'Approvals',    view: 'workload_approval',  icon: 'fact_check' },
            // 需求2701-二.7：新增二级菜单【工天核算】
            { key: 'workload/accounting',title: '工天核算',   titleEn:'Accounting',   view: 'workload_accounting',icon: 'calculate' }
        ]
    },
    {
        key: 'docs', icon: 'folder_open', title: '资料管理', titleEn: 'Documents',
        defaultChild: 'docs/credit',
        children: [
            // 需求2001-六：资信材料管理 → 资质资信材料；公司资料库 → 资质材料 作为三级菜单
            { key: 'docs/credit',   title: '资质资信材料',   titleEn:'Credit Materials', view: 'docs_credit',   icon: 'verified_user',
              children: [
                  { key: 'docs/credit/company', title: '资质材料', titleEn:'Qualification', view: 'docs_company', icon: 'corporate_fare' }
              ]
            },
            // 需求060101-五：将 软件产品证书/软件著作权/专利证书/软件评测 升级为三级菜单
            { key: 'docs/ip',       title: '知识产权管理',   titleEn:'IP Management',   view: 'docs_ip',       icon: 'copyright',
              children: [
                  { key: 'docs/ip/product',   title: '软件产品证书', titleEn:'Product Cert',  view: 'docs_ip_product',   icon: 'verified' },
                  { key: 'docs/ip/copyright', title: '软件著作权',   titleEn:'Copyright',     view: 'docs_ip_copyright', icon: 'copyright' },
                  { key: 'docs/ip/patent',    title: '专利证书',     titleEn:'Patent',        view: 'docs_ip_patent',    icon: 'workspace_premium' },
                  { key: 'docs/ip/evaluate',  title: '软件评测',     titleEn:'Evaluation',    view: 'docs_ip_evaluate',  icon: 'fact_check' }
              ]
            },
            // 需求2001-七：人员资料管理 新增 身份证 / 职称证 三级目录
            { key: 'docs/staff',    title: '人员资料管理',   titleEn:'Staff Documents', view: 'docs_staff',    icon: 'badge',
              children: [
                  { key: 'docs/staff/id',    title: '身份证', titleEn:'ID Card',          view: 'docs_staff_id',    icon: 'badge' },
                  { key: 'docs/staff/title', title: '职称证', titleEn:'Title Certificate', view: 'docs_staff_title', icon: 'workspace_premium' }
              ]
            },
            { key: 'docs/honor',    title: '荣誉材料管理',   titleEn:'Honors',          view: 'docs_honor',    icon: 'military_tech' },
            { key: 'docs/branch',   title: '分支机构管理',   titleEn:'Branches',        view: 'docs_branch',   icon: 'account_balance' },
            { key: 'docs/share',    title: '共享文档管理',   titleEn:'Shared Docs',     view: 'docs_share',    icon: 'folder_shared' }
        ]
    },
    {
        key: 'device', icon: 'devices', title: '设备管理', titleEn: 'Devices',
        defaultChild: 'device/software',
        children: [
            { key: 'device/software', title: '软件管理', titleEn:'Software',  view: 'device_software', icon: 'apps' },
            { key: 'device/hardware', title: '硬件管理', titleEn:'Hardware',  view: 'device_hardware', icon: 'memory' }
        ]
    },
    {
        key: 'ai', icon: 'auto_awesome', title: 'AI 助手', titleEn: 'AI Assistant',
        defaultChild: 'ai/assistant',
        children: [
            { key: 'ai/assistant', title: '天润 AI 助手', titleEn:'Tirain AI', view: 'ai_assistant', icon: 'smart_toy' }
        ]
    },
    {
        key: 'user', icon: 'badge', title: '人员管理', titleEn: 'Users',
        defaultChild: 'user/list',
        children: [
            { key: 'user/list',   title: '员工管理', titleEn:'Staff',   view: 'sys_user',         icon: 'badge' },
            { key: 'user/expert', title: '专家管理', titleEn:'Experts', view: 'outsource_expert', icon: 'school' }
        ]
    },
    {
        key: 'system', icon: 'settings', title: '系统设置', titleEn: 'System',
        defaultChild: 'system/dept',
        children: [
            { key: 'system/dept', title: '部门管理', titleEn:'Departments', view: 'sys_dept', icon: 'account_tree' },
            { key: 'system/role', title: '角色管理', titleEn:'Roles',  view: 'sys_role', icon: 'admin_panel_settings' },
            { key: 'system/dict', title: '字典管理', titleEn:'Dictionaries', view: 'sys_dict', icon: 'menu_book' },
            { key: 'system/menu', title: '菜单管理', titleEn:'Menus',  view: 'sys_menu', icon: 'list' },
            { key: 'system/log',  title: '日志管理', titleEn:'Logs',   view: 'sys_log',  icon: 'history' }
        ]
    }
];

// ---------- i18n 字典：界面通用文本 ----------
window.LANG = 'cn';
window.I18N = {
    cn: {
        'app.title': '项目管理系统',
        'crumb.home': '首页',
        'top.search.ph': '搜索菜单 / 项目 / 人员…',
        'top.title.theme': '主题 (浅色/深色/护眼)',
        'top.title.lang': '语言切换',
        'top.title.collapse': '折叠 / 展开侧栏',
        'top.title.notify': '通知',
        'top.role.tip': '切换角色 · 不同角色看到不同范围数据',
        'top.role.scope': '数据范围',
        'side.msg': '消息中心',
        'tag.refresh': '刷新',
        'tag.closeOther': '关闭其他',
        'btn.export':'导出','btn.add':'新增','btn.new':'新建','btn.filter':'筛选',
        'btn.detail':'详情','btn.view':'查看','btn.edit':'编辑','btn.del':'删除',
        'btn.approve':'批准','btn.reject':'驳回','btn.assign':'分配','btn.history':'历史',
        'btn.month':'本月','btn.custom':'自定义','btn.addCard':'添加卡片','btn.batchDone':'批量完成',
        'btn.download':'批量下载','btn.upload':'上传文档','btn.related':'关联合同',
        'btn.batchFill':'批量填报','btn.fill':'立即填报','btn.viewDetail':'查看 →',
        'btn.fileDownload':'导出',
        'common.all':'全部','common.total':'合计','common.unit.cny':'元','common.unit.wan':'万','common.unit.day':'天','common.unit.h':'小时','common.unit.times':'次','common.unit.score':'分',
        'common.status':'状态','common.action':'操作','common.id':'编号','common.name':'名称','common.owner':'负责人','common.amount':'金额',
        'common.date':'日期','common.start':'开始','common.end':'结束','common.type':'类型','common.dept':'部门','common.user':'人员','common.project':'项目',
        'common.invoice':'发票','common.payment':'付款','common.progress':'进度','common.score':'评分','common.level':'等级','common.cat':'分类','common.size':'大小','common.version':'版本',
        'common.stage':'阶段','common.platform':'平台','common.intent':'意向','common.duration':'时长','common.location':'地点','common.reason':'事由','common.title':'标题','common.due':'截止',
        'common.urgency':'优先级','common.team':'团队','common.spec':'规格','common.buy':'购入日期','common.expire':'到期','common.licenses':'授权','common.users':'用户数','common.release':'发布',
        'common.note':'备注','common.kind':'类别','common.role':'角色','common.phone':'电话','common.email':'邮箱','common.field':'领域','common.org':'机构','common.grade':'职称','common.report':'本月签约',
        'common.last':'上次更新','common.tomorrow':'明日计划','common.today':'今日工作','common.hours':'工时','common.confirmed':'已确认','common.cooperated':'合作次数',
        'status.success':'成功','status.fail':'失败','status.pending':'待处理','status.done':'已完成',
        'page.scrollMore':'滚动加载更多',
        'page.totalCount':'共 {n} 条',
        'page.noData':'暂无数据',
        'role.permDenied':'无权限访问',
        'permission.tip':'当前角色无权访问该模块',
        'theme.light':'浅色','theme.dark':'深色','theme.eye':'护眼',
        'theme.next':'切换至',
        'lang.cn':'中文','lang.en':'English','lang.toggle':'EN'
    },
    en: {
        'app.title': 'Project Mgmt',
        'crumb.home': 'Home',
        'top.search.ph': 'Search menu / project / user…',
        'top.title.theme': 'Theme (Light/Dark/Eye)',
        'top.title.lang': 'Language',
        'top.title.collapse': 'Collapse / Expand sidebar',
        'top.title.notify': 'Notifications',
        'top.role.tip': 'Switch role · Each role sees its own data scope',
        'top.role.scope': 'Scope',
        'side.msg': 'Messages',
        'tag.refresh': 'Refresh',
        'tag.closeOther': 'Close others',
        'btn.export':'Export','btn.add':'Add','btn.new':'New','btn.filter':'Filter',
        'btn.detail':'Detail','btn.view':'View','btn.edit':'Edit','btn.del':'Delete',
        'btn.approve':'Approve','btn.reject':'Reject','btn.assign':'Assign','btn.history':'History',
        'btn.month':'Month','btn.custom':'Custom','btn.addCard':'Add Card','btn.batchDone':'Batch Done',
        'btn.download':'Batch DL','btn.upload':'Upload','btn.related':'Link Contract',
        'btn.batchFill':'Batch Fill','btn.fill':'Fill Now','btn.viewDetail':'View →',
        'btn.fileDownload':'Export',
        'common.all':'All','common.total':'Total','common.unit.cny':'CNY','common.unit.wan':'10K','common.unit.day':'days','common.unit.h':'h','common.unit.times':'x','common.unit.score':'pts',
        'common.status':'Status','common.action':'Action','common.id':'ID','common.name':'Name','common.owner':'Owner','common.amount':'Amount',
        'common.date':'Date','common.start':'Start','common.end':'End','common.type':'Type','common.dept':'Dept','common.user':'User','common.project':'Project',
        'common.invoice':'Invoice','common.payment':'Payment','common.progress':'Progress','common.score':'Score','common.level':'Level','common.cat':'Category','common.size':'Size','common.version':'Version',
        'common.stage':'Stage','common.platform':'Platform','common.intent':'Intent','common.duration':'Duration','common.location':'Location','common.reason':'Reason','common.title':'Title','common.due':'Due',
        'common.urgency':'Urgency','common.team':'Team','common.spec':'Spec','common.buy':'Bought','common.expire':'Expire','common.licenses':'Licenses','common.users':'Users','common.release':'Released',
        'common.note':'Note','common.kind':'Kind','common.role':'Role','common.phone':'Phone','common.email':'Email','common.field':'Field','common.org':'Org','common.grade':'Grade','common.report':'Monthly',
        'common.last':'Updated','common.tomorrow':'Tomorrow','common.today':'Today','common.hours':'Hours','common.confirmed':'Confirmed','common.cooperated':'Coop',
        'status.success':'Success','status.fail':'Fail','status.pending':'Pending','status.done':'Done',
        'page.scrollMore':'Scroll for more',
        'page.totalCount':'Total {n}',
        'page.noData':'No data',
        'role.permDenied':'No access',
        'permission.tip':'Current role has no access to this module',
        'theme.light':'Light','theme.dark':'Dark','theme.eye':'Eye-Care',
        'theme.next':'Switch to',
        'lang.cn':'中文','lang.en':'English','lang.toggle':'中'
    }
};

// 通用业务术语词典（数据值 / 状态 / 业务字段）
window.I18N_TERMS = {
    cn: {},
    en: {
        '已中标':'Won','已开标':'Opened','已报名':'Registered','待报名':'To Register','未中标':'Lost',
        '高':'High','中':'Mid','低':'Low','紧急':'Urgent','优先':'Priority',
        '履约中':'Active','已签约':'Signed','已完成':'Done','变更中':'Changing','结算中':'Settling',
        '已开':'Issued','部分开':'Partial','未开':'Pending','已付清':'Paid','部分支付':'Partial','未支付':'Unpaid',
        '实施中':'In Progress','初验中':'Pre-Acc.','终验中':'Final Acc.','已暂停':'Paused','立项中':'Initiating',
        '招投标':'Bid','非招投标':'Non-Bid','管理费用':'Admin','市场费用':'Market','研发费用':'R&D','项目报销':'Project Exp.',
        '采购合同':'Purchase','服务合同':'Service','外协合同':'Outsource',
        '待审批':'Pending','已批准':'Approved','已驳回':'Rejected','已报销':'Reimbursed','已支付':'Paid','待预审':'Pre-Review',
        '合作中':'Active','黑名单':'Blocked','观察中':'Watch',
        '特级':'Lvl S','一级':'Lvl 1','二级':'Lvl 2','A':'A','B':'B','C':'C',
        '进行中':'Active','待开始':'To Start','已逾期':'Overdue',
        '已提交':'Submitted','已确认':'Confirmed','已退回':'Returned',
        '在用':'In Use','在库':'In Stock','维修中':'Repair','维护中':'Maintain','检定中':'Calib.','在线':'Online','运行中':'Running','正常运行':'Normal',
        '自研':'Self-Dev','采购':'Purchased',
        '在职':'Active','请假':'On Leave','离职':'Left','试用':'Trial',
        '公开':'Public','内部':'Internal','机密':'Confidential',
        '计算机':'Computer','服务器':'Server','测绘工具':'Survey Tool','无人机':'Drone','网络设备':'Network',
        '登录':'Login','修改':'Modify','新增':'Add','删除':'Delete','审批':'Approve','导出':'Export',
        '群组':'Group','系统通知':'System','私聊':'Direct',
        '招投标':'Bidding','审批':'Approval','项目群':'Project','私聊':'Direct','系统':'System',
        '一级':'L1','二级':'L2','启用':'Enabled','禁用':'Disabled',
        '客户合同':'Customer','采购合同':'Purchase','服务合同':'Service','外协合同':'Outsource',
        '差旅费':'Travel','招待费':'Entertain','办公用品':'Office','设备物料':'Equipment','打印复印':'Printing','通讯费':'Telecom','培训费':'Training','材料费':'Material'
    }
};

// ---------- 工具：随机 / 日期 ----------
window.pick = function(arr, i){ return arr[((i % arr.length) + arr.length) % arr.length]; };
window.dateBefore = function(days){ const d = new Date('2026-05-07'); d.setDate(d.getDate() - days); return d.toISOString().slice(0,10); };
window.fmtMoney = function(v){ return '¥' + Number(v).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };

// ---------- Mock 数据：招投标（按需求 0903 表 1 字段扩充） ----------
window.MOCK_BIDS = (function(){
    const sources = ['全国电子招标投标公共服务平台','中国招标投标公共服务平台','中招联合招标采购平台','某省政府采购网','某市公共资源交易中心'];
    const owners  = ['李明','张华','王芳','赵磊','陈静','吴强','刘洋','周婷'];
    // 兼容旧字段：stage（向后兼容）
    const stages  = [
        { s:'已中标', c:'#16A34A' }, { s:'已开标', c:'#0891B2' },
        { s:'已报名', c:'#2563EB' }, { s:'待报名', c:'#CA8A04' }, { s:'未中标', c:'#DC2626' }
    ];
    // 项目现状（按需求 0903 表 1）：6 色
    const projectStatuses = [
        { s:'已中标', c:'#16A34A' },  // 绿
        { s:'已投标', c:'#CA8A04' },  // 黄
        { s:'已弃标', c:'#9333EA' },  // 紫
        { s:'已报名', c:'#DC2626' },  // 红
        { s:'封标',   c:'#2563EB' },  // 蓝
        { s:'流标',   c:'#6B7280' }   // 灰
    ];
    // 项目状态（按需求 0903 表 1：正式公告 / 意向 / 公开意向）
    const projStateOptions = ['正式公告','意向','公开意向'];
    // 报名方式 / 投标类型 / 区域
    const registTypes = ['线上','线下'];
    const bidTypes    = ['非民标','民标'];
    const regions     = ['总公司','分公司'];
    const projects = ['某市政务云平台','智慧水务监测','轨道交通调度系统','医院信息化升级','工业互联网平台','智慧园区物联网','政府办公OA','应急指挥中心','档案数字化','大数据分析平台','智慧交通信号','社区网格化','应急指挥','智慧农业','环保监测','水利监测'];
    const phases   = ['一期','二期','三期','改造','维护','建设','升级','试点'];
    const parties  = ['某市政府','某省交通厅','某医院集团','某工业集团','某水务局','某档案馆','某园区管委会','某应急办','某交易中心','某文旅局','某市国土局','某区数据局'];
    const out = [];
    for (let i = 0; i < 80; i++) {
        const day = new Date('2026-05-07'); day.setDate(day.getDate() - i * (1 + Math.floor(Math.random()*2)));
        const stage = stages[i % stages.length];
        const ps = projectStatuses[i % projectStatuses.length];
        const projectName = pick(projects, i) + pick(phases, i) + '项目';
        // 需求1301-2.3：父子行 — 部分项目包含多个标段
        const lotCount = (i % 7 === 0) ? 3 : (i % 5 === 0 ? 2 : 1);
        const lots = [];
        for (let k = 0; k < lotCount; k++) {
            const lotDay = new Date(day); lotDay.setHours(lotDay.getHours() + k);
            lots.push({
                name:    projectName + (lotCount > 1 ? ` ${k+1}标段` : ''),
                amount:  (parseFloat((Math.random()*4800 + 200).toFixed(2)) / Math.max(1, lotCount/1.1)).toFixed(2),
                opentime: lotDay.toISOString().slice(0,10) + ' ' + String(9+(i%6)+k).padStart(2,'0') + ':00',
                owner:   pick(owners, i + k * 3)
            });
        }
        const lotTotal = lots.reduce((s,l)=> s + parseFloat(l.amount), 0).toFixed(2);
        out.push({
            id:    'BID' + String(2026100 + 80 - i).padStart(7,'0'),
            name:  projectName,
            source: pick(sources, i),
            party: pick(parties, i),                 // 甲方名称
            amount: lotTotal,                        // 项目级合计金额
            opentime: lots[0].opentime,              // 项目级首个开标时间
            stage:  stage.s,                          // 兼容旧字段
            stageColor: stage.c,
            projState: pick(projStateOptions, i),     // 项目状态
            projectStatus: ps.s,                      // 项目现状
            projectStatusColor: ps.c,
            registType: pick(registTypes, i),         // 报名方式
            bidType:    pick(bidTypes, i),            // 投标类型
            region:     pick(regions, i),             // 区域选择
            owner:  lots[0].owner,
            intent: ['高','中','低'][i%3],
            notice: i%4===0 ? null : `招标公告_${pick(projects,i)}.pdf`, // 招标公告
            note:   i%5===0 ? '' : `${pick(parties, i)}独家发布；金额含增值税；评标方式：综合评分法。`,
            time:   day.toISOString().slice(0,10),
            timestamp: day.getTime(),
            lots                                     // 标段明细
        });
    }
    out.sort((a,b)=> b.timestamp - a.timestamp);
    return out;
})();

// ---------- Mock 数据：项目（按需求1301-5 扩展字段） ----------
window.MOCK_PROJECTS = (function(){
    const out = [];
    const names = ['政务云平台','智慧水务','轨道交通调度','医院信息化','工业互联网','档案数字化','智慧园区','应急指挥','大数据分析','智慧交通','智慧农业','环保监测','水利监测','社区网格','智慧文旅','智能制造'];
    const phases = ['一期','二期','三期','改造','升级','建设'];
    const owners = ['李明','张华','王芳','赵磊','陈静','吴强','刘洋','周婷'];
    // 需求1301-5.2 表2：项目类型固定为 A/B/C
    const projTypes = ['A','B','C'];
    const statuses = [
        { s:'实施中', c:'p', p:[20,90] }, { s:'初验中', c:'w', p:[60,90] },
        { s:'终验中', c:'a', p:[80,98] }, { s:'已完成', c:'s', p:[100,100] },
        { s:'已暂停', c:'d', p:[10,80] }
    ];
    const ownerNames = ['某市政府','某省交通厅','某医院集团','某工业集团','某水务局','某档案馆','某园区管委会','某应急办','某交易中心','某文旅局','某市国土局','某区数据局'];
    const businessContacts = ['唐健','马满庄','李志刚','王芳','张华','陈静','吴强','赵磊'];
    const departments = ['遥感事业部','采集事业部','编辑事业部','制图事业部','软件研发事业部','工程测量项目组'];
    const vps = ['李副总','张副总','陈副总','吴副总'];
    const teams = [
        ['王明','刘洋','周婷'],
        ['吴强','陈静'],
        ['赵磊','张华','王芳','李明'],
        ['李志刚','周婷']
    ];
    for (let i = 0; i < 60; i++) {
        const st = statuses[i % statuses.length];
        const start = dateBefore(180 + (i % 40) * 5);
        const end   = dateBefore(-30 + (i % 50));
        const progress = st.p[0] === st.p[1] ? 100 : st.p[0] + Math.floor(Math.random() * (st.p[1] - st.p[0]));
        const startDate = new Date(start);
        const endDate = new Date(end);
        const durDays = Math.max(30, Math.round((endDate - startDate) / 86400000));
        const linked = i % 3 !== 0; // 约 2/3 项目关联合同
        out.push({
            id: 'PRJ' + String(2026100 + 60 - i).padStart(6,'0'),
            name: pick(names, i) + pick(phases, i),
            owner: pick(owners, i),
            type: pick(projTypes, i),                              // 项目类型 A/B/C
            status: st.s, statusColor: st.c,
            start, end, progress,
            amount: (Math.random()*4500 + 500).toFixed(0),
            members: 4 + (i%8),
            risk: (i % 7 === 0) ? '高' : (i % 4 === 0) ? '中' : '低',
            // 需求1301-5：扩展字段
            year: 2024 + (i%3),                                    // 年度
            mine:  i % 3 === 0,                                    // 我的项目（演示数据）
            linkedContract: linked,                                // 是否关联合同
            contractId: linked ? ('HT-C-' + String(2026100 + 60 - i).padStart(5,'0')) : '',
            ownerName: pick(ownerNames, i),                        // 业主名称
            businessContact: pick(businessContacts, i),            // 商务联络人
            producer: pick(owners, i),                             // 生产负责人
            department: pick(departments, i),                      // 负责部门
            startDate: start,                                       // 项目开工日期
            durDays,                                                // 合同约定工期(天)
            vp: pick(vps, i),                                       // 主管副总
            team: teams[i % teams.length].join('、')                // 参与人员
        });
    }
    return out;
})();

// ---------- Mock 数据：合同 ----------
window.MOCK_CONTRACTS_CUSTOMER = (function(){
    const out = [];
    const customers = ['某市政府','某省交通厅','某医院集团','某工业集团','某水务局','某档案馆','某园区管委会','某应急办','某交易中心','某文旅局'];
    const owners = ['李明','张华','王芳','赵磊','陈静','吴强'];
    const projTypes = ['A','B','C'];
    const priceTypes = ['总价包干合同','单价合同','成本加酬金合同','工程量清单合同'];
    const belongs   = ['本部','一分公司','二分公司','三分公司','华东分公司'];
    const vps       = ['李副总','张副总','陈副总','吴副总'];
    const sales     = ['李明','张华','王芳','赵磊','陈静','吴强','刘洋','周婷'];
    const reviewers = ['林文审','王文审','赵文审'];
    const departs   = ['办公室','信息化处','工程科','采购科','技术部','规划处'];
    for (let i = 0; i < 50; i++) {
        const isBid = i % 3 !== 0;
        const dur  = 90 + (i%6)*30;
        const sign = dateBefore(i * 4 + 5);
        const startD = new Date(sign);
        const endD = new Date(startD); endD.setDate(endD.getDate() + dur);
        out.push({
            id: 'HT-C-' + String(2026100 + 50 - i).padStart(5,'0'),
            name: pick(customers, i) + ' · 信息化项目合同',
            party: pick(customers, i),
            owner: pick(owners, i),
            amount: (Math.random()*4500 + 200).toFixed(0),
            sign: sign,
            end:  endD.toISOString().slice(0,10),
            source: isBid ? '招投标' : '非招投标',
            status: pick(['履约中','已签约','已完成','变更中'], i),
            invoice: pick(['已开','部分开','未开'], i),
            // —— 表 1 字段扩展 ——
            archived: i % 5 === 0,
            linkedBid: isBid ? ('BID' + String(2026100 + 50 - i).padStart(7,'0')) : '',
            linkedProject: 'PRJ-2026-' + String(100 + i).padStart(3,'0'),
            parentContract: i%7===0 ? ('HT-C-' + String(2026100 + 50 - (i-1)).padStart(5,'0')) : '',
            belong: pick(belongs, i),
            projType: pick(projTypes, i),
            priceType: pick(priceTypes, i),
            scale: ['中型','小型','大型','特大型'][i%4] + ' · ' + (200 + i*15) + '人月',
            durStart: sign,
            durEnd:   endD.toISOString().slice(0,10),
            durNote:  i%4===0 ? '含 30 天调试期' : '',
            ownerName: pick(customers, i),
            depart:   pick(departs, i),
            partyContact: ['王主任','李科长','赵处长','陈总监','吴经理','刘部长'][i%6],
            partyPhone:   '138' + String(12345670 + i).padStart(8,'0'),
            sales:    pick(sales, i),
            vp:       pick(vps, i),
            reviewer: pick(reviewers, i),
            producer: pick(owners, i),
            year:     2024 + (i%3)
        });
    }
    return out;
})();

window.MOCK_CONTRACTS_OUTSOURCE = (function(){
    const out = [];
    const vendors = ['北京华信','深圳鹏海','上海智算','南京数研','广州联科','杭州云图','武汉科软','成都光合','天津数联','西安智成'];
    const types = [
        { t:'采购合同', c:'p' }, { t:'服务合同', c:'s' }, { t:'外协合同', c:'a' }
    ];
    const owners = ['李明','张华','王芳','赵磊','陈静','吴强'];
    const projects = ['某市政务云平台项目','智慧水务监测项目','轨道交通调度项目','医院信息化升级项目','工业互联网平台项目','智慧园区物联网项目'];
    const subProj  = ['一期主体','二期扩建','调试运维','数据采集','平台开发','配套部署'];
    const workDesc = ['软件开发外协','硬件设备采购','现场施工外协','测试与验收外协','数据整理外协','咨询服务外协'];
    for (let i = 0; i < 60; i++) {
        const ty = types[i % types.length];
        out.push({
            id: 'HT-O-' + String(2026100 + 60 - i).padStart(5,'0'),
            name: pick(vendors, i) + ' · ' + ty.t,
            party: pick(vendors, i),
            owner: pick(owners, i),
            amount: (Math.random()*1500 + 50).toFixed(0),
            sign: dateBefore(i * 3 + 2),
            end: dateBefore(-90 + i * 3),
            type: ty.t, typeC: ty.c,
            status: pick(['履约中','已签约','已完成','结算中'], i),
            payment: pick(['已付清','部分支付','未支付'], i),
            // —— 表 2 字段扩展 ——
            mainProject: pick(projects, i),
            actualProject: pick(subProj, i),
            partyB: pick(vendors, i),
            partyBContact: ['王经理','李工','张总','赵主任','陈经理','吴主任'][i%6],
            partyBPhone:   '139' + String(22345670 + i).padStart(8,'0'),
            workContent:   pick(workDesc, i) + '；交付周期 ' + (30 + i*3) + ' 天；含验收报告与发票'
        });
    }
    return out;
})();

// ---------- Mock 数据：费用 ----------
window.EXPENSE_TYPES = ['管理费用','市场费用','研发费用','项目报销'];
window.MOCK_TRIP = (function(){
    const out = [];
    const cities = ['北京','上海','深圳','广州','杭州','成都','南京','武汉','西安','重庆'];
    const reasons = ['客户拜访','项目实施','投标现场','需求调研','培训','技术交流'];
    const owners = ['李明','张华','王芳','赵磊','陈静','吴强','刘洋','周婷'];
    const reviewers = ['李副总','张副总','陈副总','吴副总'];
    const statuses = [
        { s:'待审批', c:'w' }, { s:'已批准', c:'s' }, { s:'已驳回', c:'d' }, { s:'已报销', c:'p' }
    ];
    for (let i = 0; i < 50; i++) {
        const st = statuses[i % statuses.length];
        const days = 1 + (i%5);
        const traffic = +(days * 280 + Math.random()*400).toFixed(0);
        const accommodation = +(days * 360 + Math.random()*200).toFixed(0);
        const other = +(Math.random()*300).toFixed(0);
        const subsidy = days * 150;
        const amount = traffic + accommodation + other + subsidy;
        const startDate = dateBefore(i*2 + 3);
        // 简单计算结束时间
        const sd = new Date(startDate);
        const ed = new Date(sd.getTime() + (days-1) * 86400000);
        const endDate = `${ed.getFullYear()}-${String(ed.getMonth()+1).padStart(2,'0')}-${String(ed.getDate()).padStart(2,'0')}`;
        const reimbDate = dateBefore(i*2);
        const memberPool = owners.slice();
        const members = ['admin', pick(memberPool, i), pick(memberPool, i+2)].filter((v,k,a)=>a.indexOf(v)===k);
        out.push({
            id: 'CC' + String(2026100 + 50 - i).padStart(5,'0'),
            user: pick(owners, i),
            from: pick(cities, i), to: pick(cities, i+3),
            reason: pick(reasons, i),
            type: pick(EXPENSE_TYPES, i),
            start: startDate,
            end: endDate,
            days,
            // 需求1401-2 新增表单字段
            traffic,
            accommodation,
            other,
            subsidy,
            amount,
            reimburseDate: reimbDate,
            reviewer: pick(reviewers, i),
            members,
            handler: 'admin',
            status: st.s, statusC: st.c,
            project: i % 4 === 0 ? null : '某市政务云一期'
        });
    }
    return out;
})();

window.MOCK_BAOXIAO = (function(){
    const out = [];
    const owners = ['李明','张华','王芳','赵磊','陈静','吴强','刘洋','周婷'];
    const reviewers = ['李副总','张副总','陈副总','吴副总'];
    const items = [
        { t:'差旅费', c:'flight' }, { t:'招待费', c:'restaurant' },
        { t:'办公用品', c:'inventory' }, { t:'设备物料', c:'devices_other' },
        { t:'打印复印', c:'print' }, { t:'通讯费', c:'phone' },
        { t:'培训费', c:'school' }, { t:'材料费', c:'inventory_2' }
    ];
    const usages = [
        '部门日常办公消耗，含纸张/墨盒/U盘',
        '客户接待午餐，含 3 人陪同',
        '专项培训学习资料采购',
        '设备维修配件采购',
        '通讯月度账单',
        '出差期间杂费报销',
        '招标会现场打印资料',
        '团队建设活动费用'
    ];
    const statuses = [
        { s:'待预审', c:'w' }, { s:'待审批', c:'p' },
        { s:'已批准', c:'s' }, { s:'已驳回', c:'d' }, { s:'已支付', c:'a' }
    ];
    for (let i = 0; i < 60; i++) {
        const it = items[i % items.length];
        const st = statuses[i % statuses.length];
        const amount = +(Math.random()*22000 + 200).toFixed(0);
        const memberPool = owners.slice();
        const members = ['admin', pick(memberPool, i)].filter((v,k,a)=>a.indexOf(v)===k);
        out.push({
            id: 'BX' + String(2026100 + 60 - i).padStart(5,'0'),
            user: pick(owners, i),
            item: it.t, itemIcon: it.c,
            type: pick(EXPENSE_TYPES, i),
            amount,
            time: dateBefore(i + 1),
            // 需求1401-3 新增表单字段
            reimburseDate: dateBefore(i + 1),
            reviewer: pick(reviewers, i),
            members,
            handler: 'admin',
            usage: usages[i % usages.length],
            status: st.s, statusC: st.c,
            invoices: 1 + (i%4),
            project: i % 3 === 0 ? null : '某市政务云一期'
        });
    }
    return out;
})();

// ---------- Mock 数据：外协单位 / 专家 ----------
window.MOCK_VENDORS = (function(){
    const out = [];
    const vendors = ['北京华信科技','深圳鹏海软件','上海智算云','南京数研院','广州联科','杭州云图','武汉科软','成都光合','天津数联','西安智成','长沙智达','沈阳软通'];
    const persons = ['赵建国','刘秉权','王立伟','张守仁','陈宏义','孙立群','周明远','吴清远','郑大伟','黄国华','钱建昆','马满庄'];
    const tags = ['软件开发','系统集成','测绘服务','数据采集','硬件供应','咨询服务'];
    const fields = ['信息化','大数据','人工智能','物联网','智慧交通','智慧政务','智慧医疗','工业互联网'];
    const certTypes = ['ISO9001质量管理','ISO27001信息安全','CMMI5','CCRC信息安全集成','ITSS信息技术服务','建筑工程总承包','测绘资质','涉密信息系统集成'];
    const certPersonTypes = ['注册测绘师','信息系统项目管理师','高级工程师','一级建造师','PMP','注册安全工程师','网络工程师'];
    const issuers = ['工信部','住建部','自然资源部','国家市场监管总局','中国信息安全测评中心','人社部'];
    const addrs  = ['北京市海淀区中关村','上海市浦东新区张江','深圳市南山区科技园','广州市天河区珠江新城','杭州市余杭区未来科技城','南京市江宁区','武汉市光谷','成都市高新区'];
    const today = new Date();
    // 证书到期日期：分布以匹配 4 色指示器（红≤1月 / 橙≤2月 / 黄≤3月 / 灰已过期 / 默认正常>3月）
    function pickCertExpiry(i){
        const r = i % 10;
        const days =
            r < 1 ? -45 - (i%30) :          // 已过期（灰）
            r < 3 ? 20 + (i%10) :           // 1月内（红）
            r < 5 ? 35 + (i%20) :           // 2月内（橙）
            r < 7 ? 65 + (i%25) :           // 3月内（黄）
                    180 + (i%500);          // 正常
        const d = new Date(today.getTime() + days * 86400000);
        return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    }
    for (let i = 0; i < 36; i++) {
        const isPerson = i % 4 === 0; // 1/4 为个人
        const name = isPerson ? pick(persons, i) : pick(vendors, i);
        const expiry = pickCertExpiry(i);
        const issueDate = (() => {
            const d = new Date(today.getTime() - (365 + (i%500)) * 86400000);
            return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
        })();
        out.push({
            id: 'V' + String(2026100 + 36 - i).padStart(5,'0'),
            kind: isPerson ? '个人' : '单位',                                   // 类型
            name,
            contact: isPerson ? name : pick(['唐健','王芳','陈静','张华','吴强','刘洋'], i), // 联系人
            phone: '139' + String(10000000 + i*173).padStart(8,'0').slice(0,8),
            idNo: isPerson ? ('1101'+String(19800000+i*97).slice(0,8)+'X'+String(i%10).repeat(3)) : '',
            regAddr: pick(addrs, i),                                             // 注册地址
            field: pick(fields, i),                                              // 专业领域
            tag: pick(tags, i),                                                  // 主营业务
            // 资质 / 证书 信息（需求1401-4 重点）
            certType: isPerson ? pick(certPersonTypes, i) : pick(certTypes, i),  // 证书类型
            certNo: (isPerson?'PRC-':'CERT-') + String(20260000 + i*37).slice(0,8),
            certIssuer: pick(issuers, i),                                        // 发证机关
            certIssueDate: issueDate,                                            // 发证日期
            certExpiry: expiry,                                                  // 证书到期日期
            // 既有字段
            owner: pick(['李明','张华','王芳','赵磊','陈静'], i),
            cooperated: 3 + (i%12),
            score: (3.8 + Math.random()*1.2).toFixed(1),
            amount: (Math.random()*1800 + 100).toFixed(0),
            status: pick(['合作中','合作中','合作中','黑名单','观察中'], i),
            level: pick(['A','A','B','B','C'], i),
            credit: pick(['AAA','AA','A','BBB','BB'], i),                         // 信用评级
            remark: ''
        });
    }
    return out;
})();

window.MOCK_EXPERTS = (function(){
    const out = [];
    const names = ['王志强','李文博','张守仁','陈宏义','刘秉权','赵子龙','孙立群','周明远','吴清远','郑大伟','黄国华','钱建昆'];
    const fields = ['信息化','大数据','人工智能','物联网','智慧交通','智慧政务','智慧医疗','工业互联网'];
    const titles = ['教授','研究员','高工','正高级工程师','首席科学家','博士'];
    for (let i = 0; i < 30; i++) {
        out.push({
            id: 'EX' + String(2026100 + 30 - i).padStart(5,'0'),
            name: pick(names, i),
            field: pick(fields, i),
            title: pick(titles, i),
            org: pick(['某高校','某研究院','某协会','某咨询机构'], i),
            times: 2 + (i%10),
            score: (4.2 + Math.random()*0.7).toFixed(1),
            phone: '136' + String(20000000 + i*271).padStart(8,'0').slice(0,8),
            level: pick(['特级','一级','一级','二级'], i)
        });
    }
    return out;
})();

// ---------- Mock 数据：工天（工序/分配/日报） ----------
window.MOCK_PROCESSES = (function(){
    const out = [];
    const stages = ['需求调研','方案设计','开发实施','单元测试','集成测试','部署上线','试运行','验收交付'];
    const projects = ['政务云一期','智慧水务二期','轨交调度','医院HIS','工业互联网','档案数字化','智慧园区','应急指挥'];
    for (let i = 0; i < 40; i++) {
        const total = 5 + (i%30);
        const used = Math.floor(total * (0.1 + Math.random()*0.8));
        out.push({
            id: 'WP' + String(2026100 + 40 - i).padStart(5,'0'),
            stage: pick(stages, i),
            project: pick(projects, i),
            owner: pick(['李明','张华','王芳','赵磊','陈静'], i),
            members: 2 + (i%8),
            totalDays: total,
            usedDays: used,
            start: dateBefore(20 + i*2),
            end: dateBefore(-10 + i*2),
            status: pick(['进行中','进行中','已完成','待开始'], i)
        });
    }
    return out;
})();

window.MOCK_ASSIGNS = (function(){
    const out = [];
    const tasks = ['接口开发','数据建模','现场调试','文档撰写','单元测试','需求确认','部署上线','培训交付'];
    for (let i = 0; i < 45; i++) {
        out.push({
            id: 'AS' + String(2026100 + 45 - i).padStart(5,'0'),
            user: pick(['李明','张华','王芳','赵磊','陈静','吴强','刘洋','周婷','郑威','钱琪'], i),
            task: pick(tasks, i),
            project: pick(['政务云一期','智慧水务二期','轨交调度','医院HIS','工业互联网'], i),
            stage: pick(['需求调研','开发实施','测试','部署','交付'], i),
            assignedDays: 1 + (i%10),
            usedDays: (i%6),
            status: pick(['进行中','进行中','已完成','待开始','已逾期'], i),
            start: dateBefore(15 + i),
            end: dateBefore(i - 5)
        });
    }
    return out;
})();

window.MOCK_DAILIES = (function(){
    const out = [];
    const tasks = ['完成接口开发','与客户确认需求','现场调试设备','撰写设计文档','执行联调测试','准备验收材料','配置测试环境','学习新框架'];
    for (let i = 0; i < 60; i++) {
        out.push({
            id: 'DR' + String(2026100 + 60 - i).padStart(5,'0'),
            user: pick(['李明','张华','王芳','赵磊','陈静','吴强','刘洋','周婷'], i),
            project: pick(['政务云一期','智慧水务二期','轨交调度','医院HIS','工业互联网','档案数字化'], i),
            date: dateBefore(i),
            hours: (4 + (i%5)),
            content: pick(tasks, i) + '，进度顺利。',
            tomorrow: pick(tasks, i+3),
            status: pick(['已提交','已提交','已确认','已退回'], i),
            confirmed: i % 4 !== 0
        });
    }
    return out;
})();

// ---------- Mock 数据：公司资料库 ----------
window.MOCK_DOCS = (function(){
    const out = [];
    const cats = [
        { c:'公司证照',  i:'verified' },
        { c:'公司资质',  i:'workspace_premium' },
        { c:'人员资质',  i:'badge' },
        { c:'制度规范',  i:'rule' },
        { c:'业绩材料',  i:'star' },
        { c:'技术白皮书',i:'menu_book' },
        { c:'宣传材料',  i:'campaign' },
        { c:'通用模板',  i:'description' }
    ];
    const names = ['营业执照','开户许可证','ISO 9001 认证','CMMI 5 认证','软件著作权','测绘资质甲级','信息系统集成资质','人员社保证明','档案管理制度','项目管理制度','智慧政务案例','智慧水务案例','技术架构白皮书','投标技术响应模板','市场宣传册'];
    for (let i = 0; i < 36; i++) {
        const cat = cats[i % cats.length];
        out.push({
            id: 'DOC' + String(2026100 + 36 - i).padStart(5,'0'),
            name: pick(names, i),
            cat: cat.c, catIcon: cat.i,
            type: pick(['PDF','DOCX','XLSX','PPTX','ZIP'], i),
            size: (Math.random()*15 + 0.2).toFixed(2) + ' MB',
            owner: pick(['李明','张华','王芳','赵磊','陈静'], i),
            updated: dateBefore(i*3 + 1),
            version: 'v' + (1 + (i%5)) + '.' + (i%10),
            level: pick(['公开','内部','机密'], i)
        });
    }
    return out;
})();

// ---------- Mock 数据：设备 - 软件 ----------
window.MOCK_SOFTWARE = (function(){
    const out = [];
    // 自研
    const selfNames = ['天润项目管理平台','天润工天系统','天润 BI 看板','天润 OA 流程','天润测绘助手','天润招投标系统','天润 AI 助手','天润移动端 App'];
    selfNames.forEach((n, i) => {
        out.push({
            id: 'SW-S-' + String(100 + i).padStart(4,'0'),
            name: n, kind: '自研',
            version: 'v' + (1 + (i%4)) + '.' + (i%10) + '.' + (i%5),
            owner: pick(['李明','张华','王芳'], i),
            users: 30 + i*8,
            status: '正常运行',
            lang: pick(['Java','Vue+Java','Python','Go','C#'], i),
            release: dateBefore(60 + i*30),
            note: '内部团队开发与维护'
        });
    });
    // 采购
    const buyNames = ['Microsoft Office','AutoCAD','ArcGIS','MATLAB','Adobe Creative Cloud','SolidWorks','Pix4Dmapper','南方 CASS','EPS 数据采集','Skyline','GIS 服务器','SQL Server'];
    buyNames.forEach((n, i) => {
        out.push({
            id: 'SW-B-' + String(200 + i).padStart(4,'0'),
            name: n, kind: '采购',
            version: '2024 版',
            vendor: pick(['微软','Autodesk','Esri','Adobe','南方测绘','北京山维','MathWorks'], i),
            licenses: 5 + i*3,
            used: 3 + (i%10),
            expire: dateBefore(-180 - i*30),
            cost: (Math.random()*8 + 1).toFixed(1),
            note: '集中采购统一授权'
        });
    });
    return out;
})();

// ---------- Mock 数据：设备 - 硬件 ----------
window.MOCK_HARDWARE = (function(){
    const out = [];
    // 计算机
    for (let i = 0; i < 12; i++) {
        out.push({
            id: 'HW-C-' + String(100 + i).padStart(4,'0'),
            name: pick(['Dell OptiPlex 7090','ThinkPad P15','MacBook Pro 14','HP ZBook G9','Dell Precision 5570','联想 P360'], i),
            cat: '计算机',
            user: pick(['李明','张华','王芳','赵磊','陈静','吴强'], i),
            dept: pick(['生产部','商务部','信息中心','测绘部','项目部'], i),
            spec: pick(['i7-12700/32G/1TB','i9-12900H/64G/2TB','M2 Pro/32G/1TB','i7-11800H/32G/512G'], i),
            buy: dateBefore(180 + i*40),
            status: pick(['在用','在用','在用','在库','维修中'], i)
        });
    }
    // 服务器
    for (let i = 0; i < 8; i++) {
        out.push({
            id: 'HW-S-' + String(200 + i).padStart(4,'0'),
            name: pick(['Dell PowerEdge R750','HPE ProLiant DL380','华为 FusionServer','浪潮 NF5280','联想 SR650'], i),
            cat: '服务器',
            user: '信息中心',
            dept: '信息中心',
            spec: pick(['2×Xeon 6338/256G/8TB','2×Xeon 6354/512G/16TB','2×Xeon 8380/1TB/32TB'], i),
            buy: dateBefore(280 + i*60),
            status: pick(['运行中','运行中','在线','维护中'], i)
        });
    }
    // 测绘工具
    for (let i = 0; i < 10; i++) {
        out.push({
            id: 'HW-M-' + String(300 + i).padStart(4,'0'),
            name: pick(['南方 RTK 银河6','中海达 V200','Trimble R10','徕卡 GS18','南方全站仪 NTS-960','哈苏 H6D','Pix4D 控制点靶标'], i),
            cat: '测绘工具',
            user: pick(['赵磊','陈静','吴强','刘洋'], i),
            dept: '测绘部',
            spec: pick(['GNSS 接收机','GNSS 接收机','全站仪','航空相机'], i),
            buy: dateBefore(150 + i*30),
            status: pick(['在用','在库','在用','检定中'], i)
        });
    }
    // 无人机
    for (let i = 0; i < 6; i++) {
        out.push({
            id: 'HW-D-' + String(400 + i).padStart(4,'0'),
            name: pick(['DJI 御3 RTK','DJI 经纬 M300','DJI Phantom 4 RTK','大疆 Matrice 30','禅思 P1','禅思 L2'], i),
            cat: '无人机',
            user: pick(['赵磊','陈静','吴强'], i),
            dept: '测绘部',
            spec: pick(['多光谱','RTK','激光雷达','可见光'], i),
            buy: dateBefore(120 + i*50),
            status: pick(['在用','在库','维修中'], i)
        });
    }
    return out;
})();

// ---------- Mock 数据：人员 / 部门 ----------
window.MOCK_DEPTS = [
    { id:'D01', name:'公司直管', parent:null, leader:'王总', staff:3 },
    { id:'D02', name:'生产经营部', parent:'D01', leader:'李部长', staff:18 },
    { id:'D03', name:'商务部',     parent:'D01', leader:'王经理', staff:8 },
    { id:'D04', name:'信息中心',   parent:'D01', leader:'张主任', staff:6 },
    { id:'D05', name:'测绘部',     parent:'D02', leader:'赵磊',  staff:9 },
    { id:'D06', name:'研发部',     parent:'D02', leader:'陈静',  staff:12 },
    { id:'D07', name:'实施部',     parent:'D02', leader:'吴强',  staff:14 },
    { id:'D08', name:'财务部',     parent:'D01', leader:'周婷',  staff:4 },
    { id:'D09', name:'人事部',     parent:'D01', leader:'刘洋',  staff:3 }
];
window.MOCK_USERS = (function(){
    const out = [];
    const names = ['李明','张华','王芳','赵磊','陈静','吴强','刘洋','周婷','郑威','钱琪','孙阳','马云','胡力','曾倩','谢琳','黄勇','韩冰','梁峰','宋雪','贾豪','杨珂','蒋博','蔡蒙','江南','秦风','严格','华亮','戴峰','沈青','彭亮','贺琦','陶然'];
    const titles = ['工程师','高级工程师','测绘工程师','项目经理','项目主管','部门主管','商务专员','开发工程师','测试工程师','实施工程师'];
    for (let i = 0; i < 32; i++) {
        out.push({
            id: 'U' + String(20260 + 32 - i).padStart(5,'0'),
            name: pick(names, i),
            dept: pick(['生产经营部','商务部','信息中心','测绘部','研发部','实施部','财务部','人事部'], i),
            title: pick(titles, i),
            role: pick(['R6','R6','R6','R8','R7','R4','R5','R3'], i),
            phone: '138' + String(50000000 + i*317).padStart(8,'0').slice(0,8),
            mail: pick(names, i) + '@trmap.cn',
            status: pick(['在职','在职','在职','在职','请假','离职'], i),
            join: dateBefore(180 + i*30)
        });
    }
    return out;
})();

// ---------- Mock 数据：日志 ----------
window.MOCK_LOGS = (function(){
    const out = [];
    const types = [
        { t:'登录', c:'p', i:'login' }, { t:'修改', c:'w', i:'edit' },
        { t:'新增', c:'s', i:'add' }, { t:'删除', c:'d', i:'delete' },
        { t:'审批', c:'a', i:'gavel' }, { t:'导出', c:'t', i:'download' }
    ];
    const ops = ['登录系统','修改项目信息','审批费用报销','新增合同','删除日报','导出报表','变更角色','重置密码','修改菜单','导入用户'];
    for (let i = 0; i < 80; i++) {
        const ty = types[i % types.length];
        const day = new Date('2026-05-07'); day.setHours(8 + (i%10), (i*7)%60, 0, 0); day.setDate(day.getDate() - Math.floor(i/8));
        out.push({
            id: 'L' + String(20261000 + 80 - i).padStart(8,'0'),
            user: pick(['李明','张华','王芳','赵磊','陈静','吴强','刘洋'], i),
            type: ty.t, typeC: ty.c, typeIcon: ty.i,
            op: pick(ops, i),
            target: pick(['BX2026-0421','HT-C-2026101','PRJ-202601','U2026008'], i),
            ip: '10.0.' + (i%6) + '.' + (10+i%200),
            time: day.toISOString().replace('T',' ').slice(0,16),
            status: i % 9 === 0 ? '失败' : '成功'
        });
    }
    return out;
})();

// ---------- Mock 数据：字典 ----------
window.MOCK_DICTS = [
    { id:'D001', code:'project_status',  name:'项目状态',     items:['立项中','实施中','初验中','终验中','已完成','已暂停'] },
    { id:'D002', code:'contract_type',   name:'合同类型',     items:['客户合同','采购合同','服务合同','外协合同'] },
    { id:'D003', code:'expense_type',    name:'费用类型',     items:['管理费用','市场费用','研发费用','项目报销'] },
    { id:'D004', code:'bid_stage',       name:'招投标阶段',   items:['待报名','已报名','已开标','已中标','未中标'] },
    { id:'D005', code:'device_category', name:'设备分类',     items:['计算机','服务器','测绘工具','无人机','网络设备'] },
    { id:'D006', code:'doc_level',       name:'资料密级',     items:['公开','内部','机密'] },
    { id:'D007', code:'user_status',     name:'人员状态',     items:['在职','试用','请假','离职'] },
    { id:'D008', code:'process_stage',   name:'工序阶段',     items:['需求调研','方案设计','开发实施','测试','部署','试运行','验收交付'] }
];

// ---------- Mock 数据：消息中心 ----------
window.CONVERSATIONS = [
    { id:'m1', kind:'group', name:'轨交调度系统-项目群',  ava:'p', avaText:'轨', last:'@王经理 工天数据已同步，辛苦确认下', time:'09:42', unread:3, mention:true,  type:'project',
      messages:[
          { from:'李工', avaText:'李', avaCol:'a', t:'09:35', body:'今天上午调度算法那块的工天我已经填了，差旅那部分需要您审一下。' },
          { from:'李工', avaText:'李', avaCol:'a', t:'09:36', body:'另外这周五的进度评审能不能挪到周六上午？周五我要去交付现场。' },
          { from:'王经理', avaText:'王', avaCol:'p', t:'09:38', body:'差旅我下午批，周五的会改不了，有客户来访。', me:true },
          { from:'李工', avaText:'李', avaCol:'a', t:'09:42', body:'@王经理 工天数据已同步，辛苦确认下', mention:true }
      ] },
    { id:'m2', kind:'system', name:'招投标提醒', ava:'b', avaText:'标', last:'某市政务云三期 · 投标截止还有 6 小时', time:'09:18', unread:1, mention:false, type:'bid',
      messages:[
          { from:'招投标系统', avaText:'标', avaCol:'b', t:'09:18', body:'某市政务云三期 · 投标截止还有 6 小时，请确认资质材料已上传。' },
          { from:'招投标系统', avaText:'标', avaCol:'b', t:'09:18', body:'当前状态：商务标 ✓ / 技术标 ✓ / 资质 ⚠ 缺一项 (社保证明)' }
      ] },
    { id:'m3', kind:'system', name:'审批中心', ava:'r', avaText:'批', last:'¥18,500 差旅报销 (王芳) 等待您的审批', time:'09:05', unread:2, mention:false, type:'appr',
      messages:[
          { from:'审批系统', avaText:'批', avaCol:'r', t:'09:05', body:'BX2026-0421 · 王芳 · 差旅 · ¥18,500 · 等待您的审批' },
          { from:'审批系统', avaText:'批', avaCol:'r', t:'09:05', body:'另有 1 笔 ≥1万 报销待审批 (BX2026-0420 张华 招待)' }
      ] },
    { id:'m4', kind:'p2p', name:'张华', ava:'g', avaText:'张', last:'好的，招待发票我下午补给您', time:'昨天', unread:0, mention:false, type:'p2p',
      messages:[
          { from:'王经理', avaText:'王', avaCol:'p', t:'昨天 17:20', body:'招待那 1.28w 的明细发票发我一下', me:true },
          { from:'张华',   avaText:'张', avaCol:'g', t:'昨天 17:24', body:'好的，招待发票我下午补给您' }
      ] },
    { id:'m5', kind:'group',  name:'医院信息化-项目群', ava:'t', avaText:'医', last:'里程碑 M3 完成，准备进入验收', time:'昨天', unread:0, mention:false, type:'project',
      messages:[
          { from:'刘项', avaText:'刘', avaCol:'t', t:'昨天 16:48', body:'里程碑 M3 完成，准备进入验收阶段。' }
      ] },
    { id:'m6', kind:'system', name:'系统通知', ava:'s', avaText:'统', last:'本周备份已完成 · 共 12.4GB', time:'周一', unread:0, mention:false, type:'sys',
      messages:[
          { from:'系统', avaText:'统', avaCol:'s', t:'周一 02:00', body:'本周备份已完成 · 共 12.4GB · 0 错误' }
      ] },
    { id:'m7', kind:'p2p', name:'陈静', ava:'a', avaText:'陈', last:'下周二的复核我已经安排了', time:'周一', unread:1, mention:false, type:'p2p',
      messages:[
          { from:'陈静', avaText:'陈', avaCol:'a', t:'周一 14:12', body:'下周二的复核我已经安排了' }
      ] },
    { id:'m8', kind:'group', name:'工业互联网-项目群', ava:'p', avaText:'工', last:'@王经理 设备到货延期 2 天', time:'04-29', unread:0, mention:true, type:'project',
      messages:[
          { from:'吴强', avaText:'吴', avaCol:'p', t:'04-29 11:08', body:'@王经理 设备到货延期 2 天，需要协调一下交付节点', mention:true }
      ] }
];

window.NOTIFICATIONS = [
    { id:1, type:'task', icon:'task',     ti:'工天审批待处理',   desc:'李工 提交了 4 月差旅工天，等待审批',     tm:'刚刚',     unread:true },
    { id:2, type:'bid',  icon:'gavel',    ti:'某市政务云三期 招标', desc:'投标截止还有 6 小时，资质 ⚠ 缺 1 项', tm:'5 分钟前', unread:true },
    { id:3, type:'appr', icon:'approval', ti:'高额报销待审批',   desc:'王芳 ¥18,500 差旅报销 (≥1万)',          tm:'12 分钟前', unread:true },
    { id:4, type:'task', icon:'forum',    ti:'@我的 · 项目群',   desc:'李工 在「轨交调度系统」中 @ 了你',      tm:'18 分钟前', unread:true },
    { id:5, type:'sys',  icon:'sync',     ti:'实时同步',         desc:'工天 / 合同数据已同步至最新',           tm:'2 小时前', unread:true },
    { id:6, type:'bid',  icon:'event',    ti:'开标提醒',         desc:'明日 9:00 智慧水务二期 开标',           tm:'5 小时前', unread:true },
    { id:7, type:'appr', icon:'approval', ti:'合同续签',         desc:'HT-039 等待您的签批',                  tm:'昨天 17:42', unread:true },
    { id:8, type:'sys',  icon:'shield',   ti:'登录异常 0 起',    desc:'本周登录均来自常用设备',                tm:'昨天 09:00', unread:false },
    { id:9, type:'task', icon:'inventory_2', ti:'本周备份已完成', desc:'共 12.4GB · 0 错误',                   tm:'周一 02:00', unread:false }
];

// ---------- 看板卡片定义 (按需求2 · 综合数据看板 10 张卡片 + 月历入口) ----------
window.DASHBOARD_CARDS = [
    { id:'bid',         title:'年度累计中标总额',    type:'bid_total' },        // 1
    { id:'contract',    title:'年度累计签约合同',    type:'contract_total' },   // 2
    { id:'payback',     title:'年度累计项目回款',    type:'payback_total' },    // 3
    { id:'cost',        title:'年度累计成本支出',    type:'cost_total' },       // 4
    { id:'project',     title:'在建项目 / 重点管控', type:'project_total' },    // 6 (无 5)
    { id:'bidrate',     title:'年度整体中标率',      type:'bid_rate' },         // 7
    { id:'headcount',   title:'公司在职人员',        type:'headcount_total' },  // 8
    { id:'assets',      title:'公司核心资产总额',    type:'assets_total' },     // 9
    { id:'platform',    title:'平台动态',            type:'platform_logs' },    // 系统操作日志时间流
    { id:'calendar',    title:'月日历事项看板',      type:'cal_open' }          // 10
];

// ---------- 综合数据看板 · 指标 mock ----------
window.MOCK_DASHBOARD = {
    bid: {
        total: 8650, unit:'万', yoy: 12.4,
        targetTotal: 12000, finishedPct: 72,
        sources: [
            { name:'招投标',   value: 6400, color:'var(--primary)' },
            { name:'非招投标', value: 2250, color:'var(--emerald)' }
        ]
    },
    contract: {
        total: 9820, unit:'万', yoy: 8.6,
        sides: [
            { name:'A 端 · 客户合同', value: 6900 },
            { name:'B 端 · 外协合同', value: 2920 }
        ],
        struct: [
            { name:'政企信息化', pct: 45, color:'var(--primary)' },
            { name:'智慧城市',   pct: 28, color:'var(--emerald)' },
            { name:'系统集成',   pct: 17, color:'var(--amber)'   },
            { name:'其它',       pct: 10, color:'var(--rose)'    }
        ]
    },
    payback: {
        total: 6420, unit:'万', yoy: 8.1,
        rate: 78.3, received: 6420, receivable: 8200,
        overdue: { amount: 420, projects: 5, maxDays: 86 }
    },
    cost: {
        total: 5260, unit:'万', yoy: 6.2,
        items: [
            { name:'外包费用',   value: 1830, pct: 35, color:'var(--primary)' },
            { name:'人工成本',   value: 1580, pct: 30, color:'var(--teal)'    },
            { name:'软硬件',     value: 1160, pct: 22, color:'var(--amber)'   },
            { name:'四项费用',   value:  690, pct: 13, color:'var(--rose)'    }
        ]
    },
    project: {
        active: 86, key: 12,
        compliance: 82, attention: 14, fixing: 6
    },
    bidRate: {
        rate: 62, deltaPp: 5, signed: 145, won: 90,
        monthly: [55, 60, 58, 64, 70, 62, 65, 68, 60, 63, 66, 62]
    },
    headcount: {
        total: 152,
        coreRetention: 94.2,
        monthIn: 8, monthOut: 3
    },
    productivity: {
        perOutput: 84.5, perProfit: 28.6, unit:'万',
        bench: { output: 67.6, profit: 23.0 }
    },
    assets: {
        total: 6580, unit:'万',
        items: [
            { name:'硬件设备', value: 2640, pct: 40, color:'var(--primary)' },
            { name:'软件资产', value: 1970, pct: 30, color:'var(--emerald)' },
            { name:'外协协议', value: 1180, pct: 18, color:'var(--amber)'   },
            { name:'知识产权', value:  790, pct: 12, color:'var(--purple)'  }
        ]
    }
};

// ---------- 月历事项看板 mock (参考需求2 · 图1) ----------
window.MOCK_CALENDAR = {
    year: 2026, month: 6,
    depts: ['生产经营部','项目交付部','市场开发部','技术研发部','综合管理部'],
    members: ['唐健','王芳','李明','张华','陈静','赵磊'],
    holidays: {
        '2026-06-01':'儿童节',
        '2026-06-06':'芒种',
        '2026-06-19':'端午节',
        '2026-06-21':'夏至',
        '2026-07-01':'建党节'
    },
    lunar: {
        '2026-06-01':'十六','2026-06-02':'十七','2026-06-03':'十八','2026-06-04':'十九','2026-06-05':'二十',
        '2026-06-06':'廿一','2026-06-07':'廿二','2026-06-08':'廿三','2026-06-09':'廿四','2026-06-10':'廿五',
        '2026-06-11':'廿六','2026-06-12':'廿七','2026-06-13':'廿八','2026-06-14':'廿九','2026-06-15':'五月',
        '2026-06-16':'初二','2026-06-17':'初三','2026-06-18':'初四','2026-06-19':'初五','2026-06-20':'初六',
        '2026-06-21':'初七','2026-06-22':'初八','2026-06-23':'初九','2026-06-24':'初十','2026-06-25':'十一',
        '2026-06-26':'十二','2026-06-27':'十三','2026-06-28':'十四','2026-06-29':'十五','2026-06-30':'十六'
    },
    events: {
        // 需求2001-五.2：事项类型为 meeting/visit/trip/onsite/payment/equip/daily 七类
        '2026-06-01': [{ type:'visit', title:'来访 · 工信厅 · 唐健', time:'10:00' }],
        '2026-06-02': [
            { type:'trip',    title:'出差 · 武汉 · 唐健',     time:'08:30' },
            { type:'meeting', title:'会议 · 政务云三期 投标准备',      time:'14:00' }
        ],
        '2026-06-03': [
            { type:'trip',   title:'出差 · 武汉 · 唐健', time:'全天' },
            { type:'onsite', title:'驻场 · 某医院HIS 实施', time:'全天', member:'李明' }
        ],
        '2026-06-04': [{ type:'visit', title:'来访 · 中铁建 · 王芳', time:'09:30' }],
        '2026-06-05': [
            { type:'meeting', title:'会议 · 智慧水务二期 评审',    time:'10:00' },
            { type:'payment', title:'回款 · 政务云一期 进度款 ¥120万', time:'14:00', member:'唐健', note:'按合同约定第二阶段进度款，待业主财务付款' },
            { type:'meeting', title:'会议 · 部门月度总结',    time:'15:00' }
        ],
        '2026-06-08': [
            { type:'visit', title:'来访 · 市政院 · 唐健', time:'10:30' },
            { type:'equip', title:'软硬件设备 · 服务器机房巡检', time:'14:00', member:'吴强' }
        ],
        '2026-06-09': [{ type:'trip',  title:'出差 · 长沙 · 李明',   time:'08:00' }],
        '2026-06-10': [
            { type:'trip',  title:'出差 · 长沙 · 李明',   time:'全天' },
            { type:'daily', title:'日常 · 团建部门聚餐',       time:'18:00' }
        ],
        '2026-06-11': [{ type:'meeting', title:'会议 · 档案数字化 投标评审',    time:'09:30' }],
        '2026-06-12': [
            { type:'visit',   title:'来访 · 政府客户 · 陈静',time:'14:00' },
            { type:'payment', title:'回款 · 智慧水务一期 尾款 ¥45万', time:'10:30', member:'王芳', note:'终验通过后 30 日内支付，本月内到账' }
        ],
        '2026-06-15': [
            { type:'meeting', title:'会议 · ISO 9001 内审复审', time:'09:00' },
            { type:'onsite',  title:'驻场 · 工业互联网项目', time:'全天', member:'赵磊' }
        ],
        '2026-06-16': [
            { type:'visit',   title:'来访 · 高校用户 · 张华', time:'10:00' },
            { type:'meeting', title:'会议 · 技术评审会',     time:'15:30' },
            { type:'equip',   title:'软硬件设备 · 客户机房上架', time:'09:00', member:'刘洋' }
        ],
        '2026-06-17': [{ type:'trip',  title:'出差 · 北京 · 唐健',   time:'08:00' }],
        '2026-06-18': [{ type:'trip',  title:'出差 · 北京 · 唐健',   time:'全天' }],
        '2026-06-19': [{ type:'daily', title:'日常 · 端午节调休',        time:'全天' }],
        '2026-06-22': [
            { type:'visit',  title:'来访 · 大客户 · 唐健', time:'10:00' },
            { type:'equip',  title:'软硬件设备 · 备件入库验收', time:'14:00', member:'吴强' }
        ],
        '2026-06-23': [{ type:'meeting', title:'会议 · 工业互联网二期 开标',time:'14:00' }],
        '2026-06-24': [
            { type:'meeting', title:'会议 · 季度复盘会',           time:'10:00' },
            { type:'daily',   title:'日常 · 周报汇总',             time:'17:00' }
        ],
        '2026-06-25': [
            { type:'trip',  title:'出差 · 上海 · 赵磊',   time:'09:00' },
            { type:'visit', title:'来访 · 合作伙伴 · 王芳',time:'14:00' }
        ],
        '2026-06-26': [
            { type:'trip',  title:'出差 · 上海 · 赵磊',   time:'全天' },
            { type:'onsite',title:'驻场 · 某档案馆数字化', time:'全天', member:'周婷' }
        ],
        '2026-06-29': [{ type:'meeting', title:'会议 · 月度经营分析会',       time:'09:30' }],
        '2026-06-30': [{ type:'visit', title:'来访 · 行业协会 · 唐健',time:'15:00' }]
    }
};

// ---------- 我的待办 ----------
window.MOCK_TODOS = [
    { id:'T1', icon:'gavel',     cat:'招投标', tag:'p', title:'某市政务云三期 · 资质材料补齐', due:'今天 18:00', urgency:'紧急' },
    { id:'T2', icon:'approval',  cat:'审批',   tag:'d', title:'王芳 ¥18,500 差旅报销 待审批',     due:'今天',       urgency:'紧急' },
    { id:'T3', icon:'description',cat:'合同',  tag:'w', title:'HT-039 合同续签 · 等待签批',       due:'明天',       urgency:'高' },
    { id:'T4', icon:'forum',     cat:'消息',   tag:'p', title:'轨交调度系统-项目群 · 3 条 @我的', due:'今天',       urgency:'中' },
    { id:'T5', icon:'edit_note', cat:'日报',   tag:'a', title:'本周日报需 5 人补报',              due:'本周五',     urgency:'中' },
    { id:'T6', icon:'inventory_2',cat:'外协',  tag:'s', title:'北京华信付款单 复核',              due:'下周一',     urgency:'低' },
    { id:'T7', icon:'event',     cat:'里程碑', tag:'w', title:'某医院HIS 验收 · 提前 3 天准备',  due:'05-12',      urgency:'高' },
    { id:'T8', icon:'shield',    cat:'安全',   tag:'p', title:'季度安全检查 · 提交检查表',        due:'05-15',      urgency:'低' },
    { id:'T9', icon:'people',    cat:'人员',   tag:'t', title:'新入职 2 名 · 角色分配',           due:'今天',       urgency:'中' },
    { id:'T10',icon:'campaign',  cat:'招投标', tag:'p', title:'智慧水务三期 · 投标方案评审',      due:'05-10',      urgency:'高' }
];
