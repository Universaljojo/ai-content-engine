/* ============================================================
   Sunrise · KOS 短视频 Agent · v2 共享脚本
   - 三类内容(需求激发 / 险种种草 / 产品种草)
   - 编导审"内容偏好" / 合规审"行业红线"分工清晰
   - oii 范式:Agent 主动推 + 多 variant 让用户选
   - 批量维度:同主题 N 条钩子并发
   ============================================================ */

// ---------- 7 Agent 角色 ----------
// vibes: 拟人化等待文案,typing 时轮播展示
const AGENTS = {
  xiaocao:   { name: '小草',   role: '内容运营',     ava: 'assets/agents/xiaocao.svg', vibes: [] },
  director:  { name: '编导',   role: '选题 · 视觉 · 内容偏好', ava: 'assets/agents/director.svg',
    vibes: ['正在翻昨天的爆款本', '正在脑内放了一遍《巨人踩楼》', '正在画 storyboard 草图', '正在喝茶找网感'] },
  copy:      { name: '文案',   role: '脚本 · 台词 · 分镜',     ava: 'assets/agents/copy.svg',
    vibes: ['正在咬笔杆子', '正在念叨这句台词顺不顺', '正在反复推敲反差点', '正在数音节'] },
  biz:       { name: '业务校准', role: '产品事实匹配',          ava: 'assets/agents/biz.svg',
    vibes: ['正在翻产品条款 PDF', '正在比对责任表述', '正在核对现金价值表'] },
  compliance:{ name: '合规审核', role: '行业监管硬红线',         ava: 'assets/agents/compliance.svg',
    vibes: ['正在请红线词库小工具', '正在扫《广告法》第九条', '正在查近 90 天处罚案例', '正在逐句拎敏感词'] },
  brand:     { name: '品牌审核', role: '客户品牌护栏',          ava: 'assets/agents/brand.svg',
    vibes: ['正在对照客户品牌手册', '正在查 VI 用色规范'] },
  casting:   { name: '选角导演', role: '代理人形象 · 声纹',     ava: 'assets/agents/casting.svg',
    vibes: ['正在翻代理人形象池', '正在按"老年自如"打标筛人', '正在对声纹库'] },
  production:{ name: '制作组',   role: '场景 · 配音 · 合成 三步执行', ava: 'assets/agents/production.svg',
    vibes: ['渲染机房点了根烟', '正在烧 GPU', '正在排队等场景图出图', '正在合成 · 进度推进中'] },
  qa:        { name: '质检师',   role: '技术规格 · 50 条压测稳定性',  ava: 'assets/agents/qa.svg',
    vibes: ['正在排队跑 50 条压测', '正在量字幕同步偏移', '正在抽帧检主体清晰度', '正在出压测结论表'] },
};

// ---------- 制作组三步流水(TPL-004) ----------
const PRODUCTION_STEPS_TPL_004 = [
  { n: 1, name: '场景图',  desc: '客厅 · 暖光 · 沙发居中 · 9:16',          dur: '45s',  cost: '¥0.30', state: 'done' },
  { n: 2, name: '配音',    desc: '克隆 释磊 声纹 · 15s 台词',              dur: '20s',  cost: '¥0.30', state: 'done' },
  { n: 3, name: '合成',    desc: '场景 + 主角 + 配音 + 动作 → 15s 视频',   dur: '290s', cost: '¥3.20', state: 'done' },
];

// ---------- 质检 · 技术规格 5 维度(TPL-004) ----------
const QA_SPEC_TPL_004 = [
  { dim: '分辨率',     spec: '1080 × 1920',       result: '1080 × 1920',  sev: 'ok' },
  { dim: '时长精度',   spec: '15.0s ± 0.1s',      result: '14.98s',        sev: 'ok' },
  { dim: '字幕同步',   spec: '帧偏移 ≤ 80ms',     result: '帧偏移 42ms',   sev: 'ok' },
  { dim: '水印位置',   spec: '右下 + 品牌色',     result: '右下 + 阳光橙', sev: 'ok' },
  { dim: '文件大小',   spec: '上架推荐 ≤ 5 MB',   result: '6.2 MB',         sev: 'warn',
    revise: { from: '6.2 MB', to: '建议二压到 ≤ 5 MB(画质影响 < 3%)' } },
];

// ---------- 质检 · 50 条压测稳定性(TPL-004) ----------
// 用同模板换 50 组代理人/场景组合并发跑,看输出稳定性
const QA_STABILITY_TPL_004 = {
  total: 50,
  pass: 47,
  warn: 2,
  fail: 1,
  // 50 个测试案例,每个有状态
  cases: Array.from({ length: 50 }, (_, i) => {
    // 第 12 / 31 是 warn, 第 24 是 fail, 其他全过
    if (i === 11) return { id: i + 1, label: '王哥 / 户外篮球场', state: 'warn',  issue: '口型对齐偏移 95ms' };
    if (i === 23) return { id: i + 1, label: '林姐 / 餐厅包厢',   state: 'fail',  issue: '合成失败 · 主角面部遮挡' };
    if (i === 30) return { id: i + 1, label: '赵哥 / 高速公路',   state: 'warn',  issue: '背景动态干扰主体' };
    return { id: i + 1, label: '', state: 'ok', issue: '' };
  }),
  metrics: [
    { name: '口型对齐准确率',     value: '94.0%',  baseline: '≥ 90%', sev: 'ok' },
    { name: '字幕同步合格率',     value: '98.0%',  baseline: '≥ 95%', sev: 'ok' },
    { name: '画面主体清晰率',     value: '96.0%',  baseline: '≥ 95%', sev: 'ok' },
    { name: '合成完整率',         value: '98.0%',  baseline: '100%',  sev: 'warn' },
    { name: '上架适配率(总评)', value: '94.0%',  baseline: '≥ 90%', sev: 'ok' },
  ],
  conclusion: '47 / 50 通过(94.0%),1 条合成失败为代理人面部遮挡场景(可在好保 App 端通过拍摄引导规避),稳定性达上架门槛。建议直接上架。',
};

// ---------- 三类内容定义 ----------
const CONTENT_TYPES = {
  '需求激发': {
    tier: 'top',
    duration: '≤ 15s',
    funnelGoal: '私域互动 · 引起最浅层认知',
    color: '#d97706',
    directorPrefs: [
      '荒诞视觉比喻(画面像视觉奇观,有网感)',
      '代理人是正面主角,绝不在负面场景',
      '画面不标具象(怪兽身上不写"意外""疾病")',
      '台词不描述画面(画面讲不了的才用台词讲)',
      '台词不硬塞"保险"二字',
      '有强反差点(冲击观众的预期)',
      '台词口语化(避开广告腔,如"顷刻崩塌"那种)',
    ],
  },
  '险种种草': {
    tier: 'mid',
    duration: '1-2 min',
    funnelGoal: '为什么有必要买 X 险',
    color: '#2e5da6',
    directorPrefs: [
      '故事性叙事(真实场景代入)',
      '险种逻辑要讲清楚(为什么 / 给谁 / 给多少)',
      '可以出现行业资历(建立信任基础)',
      '避免具体产品价格 / 收益数字',
      '结尾留私域钩子(让用户来问)',
    ],
  },
  '产品种草': {
    tier: 'bottom',
    duration: '~3 min',
    funnelGoal: '深度测评 · 辅助产品决策',
    color: '#2f6b3f',
    directorPrefs: [
      '专业深度 + 客观对比',
      '产品条款引用要准确',
      '可以引用银保监公开数据',
      '横向同业对比时,只对比公开条款,不黑同业',
      '结尾给"做决定前先问代理人"的话术',
    ],
  },
};

// ---------- 行业合规规则(对所有视频都适用) ----------
const COMPLIANCE_RULES = [
  { law: '《广告法》第九条', desc: '禁止绝对化用语:最 / 绝对 / 唯一 / 第一 / 顶级' },
  { law: '《保险销售行为管理办法》第十条', desc: '禁止承诺:稳赚 / 保本 / 保收益 / 一定 / 必然' },
  { law: '银保监 2023 [12] 号', desc: '禁止将保险类比为存款 / 理财' },
  { law: '银保监 2023 [12] 号', desc: '禁止保证投资收益' },
  { law: '阳光红线词库 v2026.05', desc: '291 个公司级禁用词,实时同步' },
  { law: '行业舆情数据库', desc: '近 90 天处罚案例触发的延伸禁词' },
];

// ---------- 产品事实库(给业务校准用) ----------
const PRODUCT_FACTS = {
  '阳光人寿安心久久年金 v3.1': {
    type: '年金险',
    keys: ['现金价值保证条款', '按合同约定预定利率', '后半生稳定现金流'],
    forbidden: ['3.0% 复利', '本金保证', '稳赚不赔'],
  },
  '阳光臻爱重疾 v2.4': {
    type: '重疾险',
    keys: ['180 种重疾保障', '前 10 年保额提升 50%', '可附加身故责任'],
    forbidden: ['任何疾病都能赔', '一定能赔', '100% 通过'],
  },
};

// ---------- 12 条模板数据(跨三类) ----------
const TEMPLATES = [
  // === 需求激发 ===
  {
    id: 'TPL-001', type: 'normal', contentType: '需求激发', cover: '巨',
    title: '巨人踩楼', subtitle: '需求激发 · 15s · 反差结构标杆',
    stage: '已上架', state: 'published', published: '2026-05-10',
    haobaoReuse: 412, product: null,
    pitch: '巨人踩楼,脆楼塌、硬楼踩不动,巨人脚痛跳。隐喻:有保障的人生不怕风险砸。',
  },
  {
    id: 'TPL-002', type: 'normal', contentType: '需求激发', cover: '工',
    title: '工地掉落物', subtitle: '需求激发 · 15s · 弹开式反差',
    stage: '样片再审', state: 'review',
    pitch: '工地楼上掉东西,代理人戴头盔淡定磕瓜子,东西全弹开。最后挖掘机也被弹开。',
  },
  {
    id: 'TPL-003', type: 'normal', contentType: '需求激发', cover: '海',
    title: '给海啸递扫帚', subtitle: '需求激发 · 15s · 荒诞工具',
    stage: '编导审脚本', state: 'review-now',
    pitch: '海啸来袭,代理人不慌不忙递给海啸一把小扫帚,海啸尴尬扫地。',
  },
  {
    id: 'TPL-004', type: 'normal', contentType: '需求激发', cover: '沙',
    title: '老年人推沙发', subtitle: '需求激发 · 15s · 力量倒置(本次演示主线)',
    stage: '待你审核钩子方向', state: 'await-user', isDemo: true,
    pitch: '年轻人推沙发推不动,老年人轻推沙发飞出。隐喻:年金给后半生底气。',
    relatedProduct: '阳光人寿安心久久年金 v3.1',
  },

  // === 险种种草 ===
  {
    id: 'TPL-005', type: 'normal', contentType: '险种种草', cover: '意',
    title: '你的意外险,是给"明天"的礼物', subtitle: '险种种草 · 80s · 故事代入',
    stage: '合规审核', state: 'review-now',
    pitch: '从一家三口的早餐桌切入,讲意外险的核心价值不是"赔",而是"在最差的那天兜底"。',
  },
  {
    id: 'TPL-006', type: 'normal', contentType: '险种种草', cover: '重',
    title: '重疾险不是赌命,是赌"赌不起"', subtitle: '险种种草 · 95s · 概率反思',
    stage: '起稿中', state: 'now',
    pitch: '"如果不买,赔了就赔了,但赔不起。"重疾险的本质不是侥幸,是兜底。',
  },
  {
    id: 'TPL-007', type: 'custom', contentType: '险种种草', cover: '30',
    title: '30 岁的你,需要的不是高收益', subtitle: '险种种草 · 65s · 客户:华泰人寿',
    stage: '品牌审核(定制)', state: 'warn',
    pitch: '30 岁开始储蓄养老,首选不是收益高的,而是确定的。华泰品牌定制版。',
    customer: '华泰人寿',
  },
  {
    id: 'TPL-008', type: 'normal', contentType: '险种种草', cover: '钱',
    title: '年金险的钱去哪儿了', subtitle: '险种种草 · 75s · 资金流向解析',
    stage: '选角中', state: 'queue',
    pitch: '从用户最关心的"我交的钱去哪儿了"切入,讲清年金险的资金运作和现金价值机制。',
  },

  // === 产品种草 ===
  {
    id: 'TPL-009', type: 'custom', contentType: '产品种草', cover: '臻',
    title: '阳光臻爱重疾 v2.4 深度测评', subtitle: '产品种草 · 3 min · 客户:阳光人寿',
    stage: '业务校准(定制)', state: 'warn',
    pitch: '臻爱重疾 v2.4 的 5 大核心保障责任拆解 + 同业 3 款对比 + 适用人群分析。',
    customer: '阳光人寿', relatedProduct: '阳光臻爱重疾 v2.4',
  },
  {
    id: 'TPL-010', type: 'normal', contentType: '产品种草', cover: '安',
    title: '安心久久年金 vs 同业 5 款对比', subtitle: '产品种草 · 3 min · 横向对比',
    stage: '分镜中', state: 'now',
    pitch: '只对比公开条款 4 个维度:现金价值 / 灵活领取 / 减保规则 / 保单贷款。',
  },
  {
    id: 'TPL-011', type: 'normal', contentType: '产品种草', cover: '守',
    title: '守护一生重疾 完整保障责任拆解', subtitle: '产品种草 · 3 min · 条款细读',
    stage: '样片再审', state: 'review',
    pitch: '180 种重疾 / 100 种轻症 / 50 种中症 的具体责任拆解,附银保监公开数据。',
  },
  {
    id: 'TPL-012', type: 'normal', contentType: '产品种草', cover: '福',
    title: '阳光福满分养老 30 分钟试讲版', subtitle: '产品种草 · 3 min · 试讲版',
    stage: '起稿中', state: 'now',
    pitch: '把保司内训的 30 分钟讲解,浓缩成 3 分钟代理人朋友圈版本。',
  },
];

// ---------- 视觉比喻方向库(给 TPL-004 演示主线用) ----------
const HOOK_VARIANTS_TPL_004 = [
  {
    id: 'A',
    name: '老年人推沙发',
    contrast: '年轻人推不动 vs 老年人轻推飞出',
    metaphor: '年金底气支撑生活',
    actor: '老年人(代理人换脸)',
    selected: true,
  },
  {
    id: 'B',
    name: '飘车上坡',
    contrast: '旧车熄火 vs 新车上坡轻松',
    metaphor: '年金=换辆车,后半生轻松',
    actor: '开车人(代理人换脸)',
  },
  {
    id: 'C',
    name: '巨人弹簧床',
    contrast: '跳得越高 vs 落得越平稳',
    metaphor: '缴费=跳,年金=弹簧',
    actor: '巨人(代理人换脸)',
  },
];

// ---------- 脚本卡(TPL-004 老年人推沙发的真实脚本) ----------
const SCRIPT_TPL_004 = {
  direction: '年轻人在房间里推沙发,使尽全力,推不动几寸。老年人(代理人)走进来,轻轻一推,沙发飞了出去。年轻人目瞪口呆地看着老年人。老年人对镜头说出台词。',
  dialogue: '"嘿,这沙发不轻啊。可奇怪,我这把年纪,反而推得动了。养老就该这样,提前备一份年金,后半生才有底气。"',
  dialogue_revised: '"嘿,这沙发不轻啊。可奇怪,我这把年纪,反而推得动了。养老就该这样,提前备一份年金,后半生有个稳稳的依靠。"',
  shots: [
    { n: 1, dur: '1s', frame: '客厅,年轻人在推沙发',          action: '推动声、喘息' },
    { n: 2, dur: '2s', frame: '沙发纹丝不动,年轻人累瘫',       action: '"唉"' },
    { n: 3, dur: '2s', frame: '老年人(代理人)走进来',          action: '老年人脚步' },
    { n: 4, dur: '3s', frame: '老年人轻推沙发',                action: '"嗖!" 沙发飞出窗外(网感增强版)' },
    { n: 5, dur: '2s', frame: '年轻人惊讶',                    action: '静音' },
    { n: 6, dur: '5s', frame: '老年人对镜头微笑说台词',         action: '台词同步' },
  ],
  contrast: '年轻 vs 老年的力量倒置,隐喻"养老不是减负担,是有底气"',
};

// ---------- 编导内容偏好审核结果(TPL-004) ----------
const DIRECTOR_AUDIT_TPL_004 = [
  { rule: '荒诞视觉比喻 - 反差结构成立(年轻 vs 老年)', sev: 'ok' },
  { rule: '代理人定位 - 老年人是主角,不在受害者位',     sev: 'ok' },
  { rule: '画面不标具象 - 第 4 镜建议:别加"养老金"字幕', sev: 'warn',
    revise: { from: '镜头 4 字幕:"养老金"', to: '镜头 4 字幕去掉' } },
  { rule: '台词与画面隐喻 - 台词没描述画面动作',         sev: 'ok' },
  { rule: '台词口语化 - 短句、带情绪、避开广告腔',       sev: 'ok' },
  { rule: '网感反差冲击 - 沙发只是滑出,建议飞出窗外',     sev: 'warn',
    revise: { from: '第 4 镜:沙发滑出 2 米', to: '第 4 镜:沙发飞出窗外' } },
];

// ---------- 合规审核结果(TPL-004,行业硬红线) ----------
const COMPLIANCE_AUDIT_TPL_004 = [
  { law: '《广告法》第九条',                desc: '绝对化用语:未命中', sev: 'ok' },
  { law: '《保险销售行为管理办法》第十条', desc: '收益承诺:未命中', sev: 'ok' },
  { law: '银保监 2023 [12] 号',            desc: '类比存款/理财:未命中', sev: 'ok' },
  { law: '阳光红线词库 v2026.05',          desc: '"后半生才有底气"触及【收益隐喻】边界', sev: 'warn',
    revise: { from: '后半生才有底气', to: '后半生有个稳稳的依靠' } },
  { law: '行业舆情数据库',                  desc: '近 90 天处罚案例未命中', sev: 'ok' },
];

// ---------- 业务校准结果(TPL-004,产品事实库) ----------
const BIZ_AUDIT_TPL_004 = [
  { fact: '"养老就该这样" 与年金险定位', sev: 'ok' },
  { fact: '"提前备一份年金" 表述',       sev: 'ok' },
  { fact: '"稳稳的依靠" 与现金价值保证条款', sev: 'ok' },
  { fact: '关联产品:阳光人寿安心久久年金 v3.1', sev: 'ok' },
];

// ---------- 选角候选(TPL-004,老年人主角) ----------
const CASTING_TPL_004 = [
  { name: '释磊', born: 1962, style: '资深顾问感', used: 12, ava: 'assets/agents/director.svg' },
  { name: '华叔', born: 1958, style: '稳重慈和',   used: 4,  ava: 'assets/agents/compliance.svg' },
  { name: '李姐', born: 1965, style: '亲和邻家',   used: 6,  ava: 'assets/agents/brand.svg' },
  { name: '赵伯', born: 1960, style: '退伍军人感', used: 2,  ava: 'assets/agents/biz.svg' },
];

// ---------- 样片再审(TPL-004,三角色联审) ----------
const SAMPLE_REVIEW_TPL_004 = [
  { agent: 'director', dim: '视觉网感',
    items: [
      { rule: '反差点呈现 - 沙发飞出窗外冲击力到位',    sev: 'ok' },
      { rule: '代理人调性 - 释磊呈现"自如"感',          sev: 'ok' },
      { rule: '镜头 5 时长 - 年轻人惊讶反应可再停 0.5s', sev: 'warn' },
    ] },
  { agent: 'compliance', dim: '字幕 / 口播 / 画面 红线',
    items: [
      { rule: '字幕红线词 - 未命中',           sev: 'ok' },
      { rule: '口播语速 - 3.6 字/秒(符合)',   sev: 'ok' },
      { rule: '画面不标具象 - 无"养老金"字样', sev: 'ok' },
    ] },
  { agent: 'biz', dim: '画面字幕事实',
    items: [
      { rule: '字幕"年金"表述 - 与产品事实库一致',  sev: 'ok' },
      { rule: '无 "3.0%复利" 等敏感数字',             sev: 'ok' },
    ] },
];

// ============================================================
// STORY_BEATS · 可点击剧本状态机
// 每个 beat 由用户上一个 decision 触发,按以下顺序播放:
//   1. (可选) typing 状态:Agent 正在 xxx,展示 vibes 之一
//   2. messages 数组按时间逐条 append
//   3. (可选) canvas: 自动切换右侧画板焦点
//   4. (可选) decision: 渲染选项,等用户点
// 用户点选项 → 选项的 next 决定下一个 beat id
// ============================================================
const STORY_BEATS = {

  // ===== beat 0:入口引导(欢迎卡)=====
  'welcome': {
    type: 'guide',
    title: '嗨,小草 👋',
    subtitle: '今天想做哪一类内容?或者直接告诉我你的想法 →',
    options: [
      { id: 'need',  label: '需求激发',  sub: '15s 短视频 · 痛点钩子 · 私域引流',  next: 'pick-need-topic' },
      { id: 'cat',   label: '险种种草',  sub: '1-2 min · 险种科普 · 为什么有必要', next: 'placeholder-cat' },
      { id: 'prod',  label: '产品种草',  sub: '~3 min · 深度测评 · 决策辅助',      next: 'placeholder-prod' },
    ]
  },

  // ===== 险种种草 / 产品种草:演示先聚焦"需求激发" =====
  'placeholder-cat': {
    type: 'beat',
    sys: '🎬 险种种草 · 这条线在排版中',
    decision: {
      title: 'Demo 先聚焦"需求激发"完整跑通,要不要换一条?',
      options: [
        { id: 'back', label: '回到入口', primary: true, next: 'welcome' },
        { id: 'go',   label: '改去做需求激发',           next: 'pick-need-topic' },
      ]
    }
  },
  'placeholder-prod': {
    type: 'beat',
    sys: '🎬 产品种草 · 这条线在排版中',
    decision: {
      title: 'Demo 先聚焦"需求激发"完整跑通,要不要换一条?',
      options: [
        { id: 'back', label: '回到入口', primary: true, next: 'welcome' },
        { id: 'go',   label: '改去做需求激发',           next: 'pick-need-topic' },
      ]
    }
  },

  // ===== beat 1:编导加入 · 锚定痛点方向 =====
  'pick-need-topic': {
    type: 'beat',
    sys: '🎬 编导 加入群聊',
    typing: { who: 'director', dur: 1200 },
    messages: [
      { kind: 'msg', who: 'director', when: '14:02',
        text: `好嘞导演,15s 需求激发是我的拿手好戏。
我先把这一类视频的"内容偏好"摆出来:画面要做荒诞视觉比喻、代理人是正面主角、画面不标具象、台词不描述画面、有强反差点。这套打法我们手上已经有 4 条上架爆款验证过了。
那现在第一步,我们得先锚定一个"痛点方向"——也就是 3 秒内戳到代理人的目标客户的那个点。这季度银保代理人最常打的痛点我列了几个,你来点。` },
    ],
    decision: {
      title: '🎯 锚定痛点方向',
      options: [
        { id: 'pension', label: '养老金压力',   sub: '60+ 老年群体 / 中产养老焦虑', primary: true, next: 'hooks-pension' },
        { id: 'medical', label: '医疗费用',     sub: '突发医疗 / 重疾负担',           next: 'placeholder-topic' },
        { id: 'edu',     label: '教育金缺口',   sub: '中产家庭 / 子女留学规划',       next: 'placeholder-topic' },
        { id: 'custom',  label: '自定义...',    sub: '我自己输想法',                  next: 'placeholder-topic' },
      ]
    }
  },

  'placeholder-topic': {
    type: 'beat',
    sys: '🎬 这个痛点方向先占位 · Demo 主线走"养老金压力"',
    decision: {
      title: '回到主线?',
      options: [
        { id: 'go', label: '走"养老金压力"主线', primary: true, next: 'hooks-pension' },
      ]
    }
  },

  // ===== beat 2:编导思考 + 出 3 个钩子方向 =====
  'hooks-pension': {
    type: 'beat',
    user: { text: '锚定养老金压力,你给我 3 个钩子方向吧。', when: '14:03' },
    typing: { who: 'director', dur: 1800 },
    messages: [
      { kind: 'thinking', who: 'director', when: '14:03', title: '思考中',
        body: `好,养老金压力这个主题,我先在脑里过了一遍我们的"反差结构"标杆——《巨人踩楼》《工地掉落物》《给海啸递扫帚》,这三条都是用一个荒诞动作把"有保障"的状态视觉化出来,而不是直接说"养老金"。
这个主题的反差核心,我觉得是「无支撑 vs 有支撑」。年轻时候靠体力,老了靠什么?如果只靠子女、只靠运气,那是赌;如果有一份年金做底层,那就有"轻松感"。
我顺着这个思路,跑出了 3 个荒诞视觉比喻方向,每个都满足:代理人是正面主角、画面不标"养老金"具象、有反差点。已经推到右边画板上了,你点开看。` },
      { kind: 'msg', who: 'director', when: '14:04',
        text: `3 个方向都摆在右边了,A 是"老年人推沙发"(力量倒置)、B 是"飘车上坡"(机械倒置)、C 是"巨人弹簧床"(能量倒置)。
我个人最推 A,因为"力量倒置"在 15s 短视频里观众接收成本最低,1.5s 内就能 get 到反差。但你拍板,你也可以全做 / 只做 B 或 C / 让我换一批。`,
        action: 'showHookVariants',
        evidence: [
          { type: 'ev', text: '已检索标杆库 · 4 条历史爆款' },
          { type: 'ev', text: '已匹配 15s 内容偏好 v3' },
        ] },
    ],
    canvas: 'hook',
    decision: {
      title: '🎯 选钩子方向(也可以多选并发跑)',
      options: [
        { id: 'A',    label: 'A · 老年人推沙发',  sub: '力量倒置 · 接收成本最低',  primary: true, next: 'script-a' },
        { id: 'B',    label: 'B · 飘车上坡',      sub: '机械倒置',                next: 'placeholder-hook' },
        { id: 'C',    label: 'C · 巨人弹簧床',    sub: '能量倒置',                next: 'placeholder-hook' },
        { id: 'all',  label: '3 个都做(并发)',    sub: '复用同主题决策',           next: 'placeholder-hook' },
        { id: 'redo', label: '换一批',             sub: '重新让编导跑',            next: 'placeholder-hook' },
      ]
    }
  },

  'placeholder-hook': {
    type: 'beat',
    sys: '🎬 这个分支先占位 · Demo 主线走 A 老年人推沙发',
    decision: {
      title: '回到主线?',
      options: [
        { id: 'go', label: '走 A · 老年人推沙发', primary: true, next: 'script-a' },
      ]
    }
  },

  // ===== beat 3:文案起脚本 =====
  'script-a': {
    type: 'beat',
    user: { text: '先 A,跑通了再批量 B 和 C。', when: '14:04' },
    sys: '🎬 文案 加入群聊',
    typing: { who: 'copy', dur: 2000 },
    messages: [
      { kind: 'thinking', who: 'copy', when: '14:05', title: '思考中',
        body: `收到,A 方向"老年人推沙发"。
我先把核心情绪定下来——这条 15s 不是要"教育用户买年金",是要让用户在前 5 秒就被"咦?这老头怎么这么轻松"勾住,后 10 秒老头慢悠悠说出台词,留个钩子。
台词得避开三个坑:不要广告腔(像"顷刻崩塌"那种),不要描述画面(画面里能讲的就别用台词讲),不要硬塞"保险"二字。我打算用第一人称、口语化、3.5-4 字/秒的语速。
分镜按 6 格,15 秒精准卡。我顺手去产品事实库里捞了"安心久久年金 v3.1"的责任表述,确保台词里的"稳"字有产品事实背书。` },
      { kind: 'msg', who: 'copy', when: '14:05',
        text: `脚本 v1 写完推到右边了。
台词、6 格分镜、反差重点、关联产品 都齐了,你先看一遍。一会编导和合规会过来分别审"内容偏好"和"行业红线",你看完直接进下一步就行。`,
        action: 'showScript',
        evidence: [
          { type: 'ev', text: '已生成 6 格分镜' },
          { type: 'ev', text: '已检索产品事实 · 安心久久 v3.1' },
        ] },
    ],
    canvas: 'script',
    decision: {
      title: '📝 看完脚本,准备进入审核',
      options: [
        { id: 'go',   label: '让编导审一遍内容偏好', primary: true, next: 'director-audit' },
        { id: 'edit', label: '我自己先改改',                          next: 'placeholder-edit' },
      ]
    }
  },

  'placeholder-edit': {
    type: 'beat',
    sys: '✏️ 自由编辑模式 · Demo 主线走"让编导审"',
    decision: {
      title: '回到主线?',
      options: [
        { id: 'go', label: '让编导审一遍内容偏好', primary: true, next: 'director-audit' },
      ]
    }
  },

  // ===== beat 4:编导审"15s 内容偏好" =====
  'director-audit': {
    type: 'beat',
    typing: { who: 'director', dur: 1600 },
    messages: [
      { kind: 'msg', who: 'director', when: '14:08',
        text: `脚本我按"15s 需求激发"这一类的 6 条内容偏好审了一遍,4 过 2 提建议。
重点说两处:第 4 镜的字幕里有"养老金"三个字,这违反了我们这一类的"画面不标具象"原则,要去掉;另外这条沙发只是"滑出 2 米",网感不够冲,我建议改成"沙发飞出窗外",反差强度直接拉满。
具体的 diff 推到右边了,你审一下。提醒一下这里审的是"内容偏好"——监管硬红线下一步合规会独立走,我们不抢饭碗。`,
        action: 'showDirectorAudit',
        evidence: [
          { type: 'ev', text: '6 条偏好规则审过' },
          { type: 'ev warn', text: '2 处建议' },
        ] },
    ],
    canvas: 'director',
    decision: {
      title: '🎬 编导给了 2 处修改建议',
      options: [
        { id: 'accept', label: '采纳全部修改', sub: '画面 + 字幕 + 镜头都按编导改', primary: true, next: 'compliance-audit' },
        { id: 'self',   label: '我自己改',                                          next: 'placeholder-edit-2' },
        { id: 'keep',   label: '保留原稿',                                          next: 'placeholder-edit-2' },
      ]
    }
  },

  'placeholder-edit-2': {
    type: 'beat',
    sys: '✏️ 自由编辑模式 · Demo 主线走"采纳"',
    decision: {
      title: '回到主线?',
      options: [
        { id: 'go', label: '采纳并进入合规审', primary: true, next: 'compliance-audit' },
      ]
    }
  },

  // ===== beat 5:合规审"行业硬红线" =====
  'compliance-audit': {
    type: 'beat',
    sys: '🎬 合规审核 加入群聊',
    typing: { who: 'compliance', dur: 2200 },
    messages: [
      { kind: 'thinking', who: 'compliance', when: '14:10', title: '思考中',
        body: `好,我接手做行业监管硬红线那一关。
要说清楚我跟编导审的不是同一件事:编导审的是"15s 需求激发这一类视频的内容偏好",换成 3min 产品种草那条线,他的偏好就完全不同了;我审的是行业硬红线——《广告法》《保险销售行为管理办法》《银保监 2023 [12] 号》、还有阳光自己的红线词库——这些三类视频都要过、不可豁免。
我的扫描方式:把台词和字幕逐句拆,先匹配 291 个公司级禁词,再过 6 大类法规,最后查近 90 天的行业处罚案例做延伸禁词。整个过程会留法源引注。` },
      { kind: 'msg', who: 'compliance', when: '14:10',
        text: `审完了,5 大类全过,只有 1 处需要改写。
"后半生才有底气"这句,我判定它触及了【收益隐喻】的边界——监管口径上,"底气"虽然不是直接说"保收益",但语义已经在暗示"保障",有合规风险。我给的改写是"后半生有个稳稳的依靠",意思保留、隐喻拆掉。
具体法源引注 + diff 都在右边,你过一下。`,
        action: 'showComplianceAudit',
        evidence: [
          { type: 'ev law', text: '阳光红线词库 v2026.05' },
          { type: 'ev warn', text: '1 处建议' },
        ] },
    ],
    canvas: 'compliance',
    decision: {
      title: '🛡️ 合规要改 1 处',
      options: [
        { id: 'accept', label: '采纳改写', sub: '"才有底气" → "有个稳稳的依靠"', primary: true, next: 'biz-audit' },
        { id: 'self',   label: '我自己改',                                       next: 'placeholder-edit-3' },
        { id: 'reject', label: '退回起稿',                                       next: 'placeholder-edit-3' },
      ]
    }
  },

  'placeholder-edit-3': {
    type: 'beat',
    sys: '✏️ 自由编辑模式 · Demo 主线走"采纳改写"',
    decision: {
      title: '回到主线?',
      options: [
        { id: 'go', label: '采纳改写并进入业务校准', primary: true, next: 'biz-audit' },
      ]
    }
  },

  // ===== beat 6:业务校准(自动推进到制作)=====
  'biz-audit': {
    type: 'beat',
    sys: '🎬 业务校准 加入群聊',
    typing: { who: 'biz', dur: 1400 },
    messages: [
      { kind: 'msg', who: 'biz', when: '14:12',
        text: `我把脚本里所有跟产品有关的事实点都跟"安心久久年金 v3.1"的产品库对了一遍。
"养老就该这样"、"提前备一份年金"、"稳稳的依靠" 这三处,都跟 v3.1 的责任表述、现金价值条款一致。台词里没有出现"3.0% 复利"、"本金保证"这种被标禁词,可以放行。
4 项全过,无需改动。详情在右边,我直接交给制作组开跑了。`,
        action: 'showBizAudit',
        evidence: [
          { type: 'ev', text: '已校准 · 安心久久 v3.1' },
          { type: 'ev', text: '4 项全过' },
        ] },
    ],
    canvas: 'biz',
    decision: {
      title: '✅ 业务校准全过 · 进入制作',
      options: [
        { id: 'go', label: '让制作组开跑(场景图 → 配音 → 合成)', primary: true, next: 'production-step-1' },
      ]
    }
  },

  // ===== beat 7-1:制作组 · Step 1 出场景图(链式自动推进)=====
  // 注:模板生产阶段不锁定具体代理人,只用平台默认的"老年示例形象"做样片预览;
  // 上架后代理人在好保 App 端 try-on 自己的脸+声音,再经 50 条压测换 50 组并发跑稳定性。
  'production-step-1': {
    type: 'beat',
    sys: '🎬 制作组 加入群聊 · 三步流水(场景图 → 配音 → 合成)',
    typing: { who: 'production', dur: 1800 },
    messages: [
      { kind: 'msg', who: 'production', when: '14:15',
        text: `Step 1 场景图出了。
客厅、暖光、沙发居中、9:16 竖版构图。我已经把它推到右边了,你先验收一下场景的色调和构图。
样片阶段不绑定具体代理人,我用平台的"老年示例形象"(占位)做合成预览,上架后代理人在好保 App 端会换上自己的脸和声音。`,
        action: 'showScene',
        evidence: [
          { type: 'ev', text: '场景图 v1 · 1080×1920' },
        ] },
    ],
    canvas: 'scene',
    nextAuto: { next: 'production-step-2', delay: 1600 },
  },

  // ===== beat 7-2:制作组 · Step 2 出配音 =====
  'production-step-2': {
    type: 'beat',
    typing: { who: 'production', dur: 1800 },
    messages: [
      { kind: 'msg', who: 'production', when: '14:18',
        text: `Step 2 配音也好了。
用平台的"老年示例声纹"录了 14.8 秒,跟分镜的字幕对齐。语速 3.6 字/秒,情绪是"自如、有底气"。
配音波形在右边可以预听,这是验收用的预览音轨。`,
        action: 'showAudio',
        evidence: [
          { type: 'ev', text: '14.8s · 3.6 字/秒' },
        ] },
    ],
    canvas: 'audio',
    nextAuto: { next: 'production-step-3', delay: 1600 },
  },

  // ===== beat 7-3:制作组 · Step 3 合成最终样片 =====
  'production-step-3': {
    type: 'beat',
    typing: { who: 'production', dur: 2400 },
    messages: [
      { kind: 'msg', who: 'production', when: '14:21',
        text: `Step 3 合成完成,9:16 竖版 15.0s。
沙发飞出窗外那一段我用了第二轮做物理细节微调,镜头切换平滑。整条片子在右边可以播放预览。
看完进下一步——三方内容再审。`,
        action: 'showSample',
        evidence: [
          { type: 'ev', text: '15.0s · 9:16 · 6.2 MB' },
          { type: 'ev', text: '总耗 6 分 12 秒' },
        ] },
    ],
    canvas: 'sample',
    decision: {
      title: '🎬 样片完成 · 进入再审',
      options: [
        { id: 'go',   label: '让编导/合规/业务三方再审', primary: true, next: 'sample-review' },
        { id: 'redo', label: '请求重做',                                next: 'placeholder-edit-5' },
      ]
    }
  },

  'placeholder-edit-5': {
    type: 'beat',
    sys: '🎬 重做模式 · Demo 主线走"三方再审"',
    decision: {
      title: '回到主线?',
      options: [
        { id: 'go', label: '让三方再审', primary: true, next: 'sample-review' },
      ]
    }
  },

  // ===== beat 10:样片再审(三方联审)=====
  'sample-review': {
    type: 'beat',
    typing: { who: 'compliance', dur: 2400 },
    messages: [
      { kind: 'thinking', who: 'compliance', when: '14:22', title: '思考中',
        body: `脚本过审 ≠ 样片过审。这一关我跟编导、业务三个人独立联审——我看字幕/口播/画面里的红线词,编导看视觉网感,业务看画面字幕的事实点。
样片里可能引入新风险的几个点:画面字幕(可能突然冒出敏感字)、配音节奏(可能因为口型对齐被拉长拉短)、封面截帧(可能选到代理人不雅瞬间)。这些都是脚本阶段看不到的。` },
      { kind: 'msg', who: 'compliance', when: '14:22',
        text: `三方再审完成,2 处微调:编导那边觉得镜头 5 年轻人惊讶反应可以多停 0.5s 让笑点更冲;我和业务这边全过(字幕红线没命中、口播语速 3.6 字/秒符合、画面没有"养老金"具象、字幕用词跟产品库一致)。
具体清单在右边,你看完拍个板。`,
        action: 'showSampleReview',
        evidence: [
          { type: 'ev warn', text: '2 处微调' },
          { type: 'ev', text: '3 个维度联审' },
        ] },
    ],
    canvas: 'sampleReview',
    decision: {
      title: '🔁 样片再审给了 2 处微调',
      options: [
        { id: 'accept', label: '采纳并重生',         sub: '镜头 5 多停 0.5s',  primary: true, next: 'production-redo' },
        { id: 'keep',   label: '保留原片直接上架',                                              next: 'qa' },
      ]
    }
  },

  // ===== beat 11:重生(只重跑 Step 3 合成)=====
  'production-redo': {
    type: 'beat',
    sys: '⚙️ 制作组重生中 · 复用 Step 1/2 产物,只重跑 Step 3 合成',
    typing: { who: 'production', dur: 2400 },
    messages: [
      { kind: 'msg', who: 'production', when: '14:29',
        text: `样片 v2 出炉了,镜头 5 按要求多停了 0.5s,总时长 15.0s 守住了。
内容三方都打勾,Step 1/2 产物复用没重跑。下一步交给质检师做技术终审 + 50 条压测(同模板换 50 组代理人 / 场景并发跑),这是上架前的最后一关。`,
        action: 'showSample',
        evidence: [
          { type: 'ev', text: '✓ 内容三方全过' },
          { type: 'ev', text: 'Step 1/2 复用' },
        ] },
    ],
    canvas: 'sample',
    decision: {
      title: '🎬 v2 完成 · 进入质检',
      options: [
        { id: 'go', label: '让质检师做技术终审 + 压测', primary: true, next: 'qa' },
      ]
    }
  },

  // ===== beat 12:质检 =====
  'qa': {
    type: 'beat',
    sys: '🎬 质检师 加入群聊',
    typing: { who: 'qa', dur: 3200 },
    messages: [
      { kind: 'thinking', who: 'qa', when: '14:30', title: '思考中',
        body: `我这一关分两部分。
第一部分是技术规格 5 维度——分辨率、时长精度、字幕同步、水印、文件大小。这些都是上架到好保 App 必须达标的硬条件,不达标好保 App 列表会拒收。
第二部分是稳定性压测——这条片虽然过了,但代理人在好保 App 用同款的时候要换不同人脸 + 不同场景,我们要先在云端模拟 50 组并发,看模板的稳定性。这是 SaaS 视角的"上架前回归测试"。` },
      { kind: 'msg', who: 'qa', when: '14:33',
        text: `跑完了。
技术规格:5 项里 4 过 1 提醒——文件 6.2MB 比上架推荐 5MB 略大,我建议二压(画质损失 < 3%),也可以直接上架,好保 App 现在不强卡这条。
50 条压测:47 条通过(94%),2 条提醒(王哥/篮球场口型偏移 95ms、赵哥/高速公路背景动态干扰),1 条失败(林姐/餐厅包厢主角面部遮挡导致合成失败)。失败那条可以在好保 App 端通过拍摄引导规避,不影响上架。
结论:已达上架门槛,建议直接上架。详情在右边。`,
        action: 'showQA',
        evidence: [
          { type: 'ev', text: '5 维度 · 4 过 1 提醒' },
          { type: 'ev', text: '50 条压测 · 通过率 94%' },
        ] },
    ],
    canvas: 'qa',
    decision: {
      title: '🚀 准备上架到好保「需求激发」模板库',
      options: [
        { id: 'publish',  label: '确认上架',         primary: true, next: 'publish' },
        { id: 'compress', label: '先二压再上架',                    next: 'publish' },
        { id: 'hold',     label: '暂缓',                            next: 'placeholder-hold' },
      ]
    }
  },

  'placeholder-hold': {
    type: 'beat',
    sys: '⏸ 暂缓 · Demo 主线走"上架"',
    decision: {
      title: '回到主线?',
      options: [
        { id: 'go', label: '确认上架', primary: true, next: 'publish' },
      ]
    }
  },

  // ===== beat 13:上架(终点)=====
  'publish': {
    type: 'beat',
    canvas: 'publish',
    sys: '🎉 TPL-004 老年人推沙发 已上架到好保 · 需求激发模板库',
    messages: [
      { kind: 'msg', who: 'production', when: '14:35',
        text: `上架成功 🎉
代理人现在打开好保 App 「需求激发」模板库就能看到这条「老年人推沙发」,可以一键替换自己的脸 + 自己的声音生成属于自己的 15s 短视频。
本批次还有 B「飘车上坡」、C「巨人弹簧床」两条同主题,A 跑通了所有决策都可以复用,要不要批量?`,
        evidence: [
          { type: 'ev', text: '内容 hash a3f2c81e...' },
          { type: 'ev', text: '审计留痕已归档' },
        ] },
    ],
    decision: {
      title: '🎬 这一批接下来?',
      options: [
        { id: 'batch', label: '批量跑 B + C',  sub: '复用 A 的所有决策', primary: true, next: 'placeholder-batch' },
        { id: 'new',   label: '新开一批',                                               next: 'welcome' },
        { id: 'done',  label: '今天到此',                                              next: 'placeholder-done' },
      ]
    }
  },

  'placeholder-batch': {
    type: 'beat',
    sys: '⚡ B + C 已并发跑起来 · Demo 演示完毕',
    decision: {
      title: '回到入口?',
      options: [
        { id: 'go', label: '回到入口', primary: true, next: 'welcome' },
      ]
    }
  },

  'placeholder-done': {
    type: 'beat',
    sys: '🌅 今天辛苦啦,下次见 · Demo 演示完毕',
    decision: {
      title: '重新走一遍?',
      options: [
        { id: 'go', label: '回到入口', primary: true, next: 'welcome' },
      ]
    }
  },

};

// ---------- 完整对话流剧本(TPL-004 主线 + 批量背景)· 已被 STORY_BEATS 取代,保留兼容 ----------
const INITIAL_STREAM = [
  { kind: 'time', text: '今天 14:02' },
  { kind: 'sys', text: '🎬 编导 加入群聊' },
  { kind: 'msg', who: 'xiaocao', when: '14:02',
    text: '本周再做一批需求激发模板,主题"养老金压力",做 3 条同题不同钩子的批量。' },

  { kind: 'fold', who: 'director', when: '14:03', title: '思考完成',
    steps: [
      '检索标杆库 → 「巨人踩楼」「工地掉落物」是 15s 反差结构典型',
      '检索 15s 内容偏好 → 荒诞视觉比喻、代理人主角、画面不标具象',
      '分析"养老金压力"主题 → 适合"无支撑 vs 有支撑"反差',
      '生成 3 个荒诞视觉比喻方向',
    ] },

  { kind: 'msg', who: 'director', when: '14:03',
    text: '3 个钩子方向,反差结构都成立。我把方案推到右边了,你审一下。',
    action: { kind: 'showHookVariants' },
    evidence: [
      { type: 'ev', text: '已检索标杆库 · 4 条历史爆款' },
      { type: 'ev', text: '已匹配 15s 内容偏好 v3' },
    ] },

  { kind: 'decision', when: '14:04',
    title: '🎯 编导提了 3 个方向,要哪个?',
    options: [
      { id: 'all', label: '3 个都做(并发)', primary: true },
      { id: 'A', label: '只做 A 老年人推沙发' },
      { id: 'B', label: '只做 B 飘车上坡' },
      { id: 'C', label: '只做 C 巨人弹簧床' },
      { id: 'free', label: '换 3 个 / 自由输入' },
    ],
    answered: 'A',
    answerLabel: '先 A 老年人推沙发,跑通后再批量 B C',
  },

  { kind: 'msg', who: 'xiaocao', when: '14:04',
    text: '先 A 老年人推沙发,跑通后再批量 B C。' },

  { kind: 'sys', text: '🎬 文案 加入群聊' },

  { kind: 'fold', who: 'copy', when: '14:05', title: '思考完成',
    steps: [
      '收到方向:老年人推沙发 · 力量倒置反差',
      '检索 15s 台词风格 → 口语化、短句、有情绪',
      '检索产品事实库 → 安心久久年金 v3.1 责任表述',
      '起脚本 v1 · 台词 + 6 格分镜 + 反差重点',
    ] },

  { kind: 'msg', who: 'copy', when: '14:05',
    text: '脚本 v1 跑完了。台词、6 格分镜、反差重点都写好了,看右边 →',
    action: { kind: 'showScript', shotsCount: 6 },
    evidence: [
      { type: 'ev', text: '已生成 6 格分镜' },
      { type: 'ev', text: '已检索产品事实 · 安心久久 v3.1' },
    ] },

  { kind: 'msg', who: 'director', when: '14:08',
    text: '我把 v1 按 15s 内容偏好审了一遍,2 处建议改:画面字幕"养老金"去掉(不标具象),第 4 镜沙发飞出窗外(网感更冲)。改写已推到右边。',
    action: { kind: 'showDirectorAudit' },
    evidence: [
      { type: 'ev', text: '6 条偏好规则审过' },
      { type: 'ev warn', text: '2 处建议' },
    ] },

  { kind: 'decision', when: '14:09',
    title: '🎬 编导给了 2 处修改建议',
    options: [
      { id: 'accept-all', label: '采纳全部修改', primary: true },
      { id: 'self', label: '我自己改' },
      { id: 'keep', label: '保留原稿' },
    ],
    answered: 'accept-all',
    answerLabel: '采纳全部修改',
  },

  { kind: 'msg', who: 'xiaocao', when: '14:09', text: '采纳。' },

  { kind: 'sys', text: '🎬 合规审核 加入群聊' },

  { kind: 'fold', who: 'compliance', when: '14:10', title: '思考完成',
    steps: [
      '加载行业红线规则集 v2026.05 (6 大类)',
      '台词逐句扫描 → 绝对化用语 / 收益承诺 / 类比存款',
      '匹配红线词库 → 291 个公司级禁词',
      '检索近 90 天行业处罚案例',
    ] },

  { kind: 'msg', who: 'compliance', when: '14:10',
    text: '行业硬红线审完了,1 处建议改:"后半生才有底气" 触【收益隐喻】边界,我改成"后半生有个稳稳的依靠"。法源在右边。',
    action: { kind: 'showComplianceAudit' },
    evidence: [
      { type: 'ev law', text: '阳光红线词库 v2026.05' },
      { type: 'ev warn', text: '1 处建议' },
    ] },

  { kind: 'decision', when: '14:11',
    title: '🛡️ 合规审核要改 1 处',
    options: [
      { id: 'accept', label: '采纳改写', primary: true },
      { id: 'self', label: '我自己改' },
      { id: 'reject', label: '退回起稿' },
    ],
    answered: 'accept',
    answerLabel: '采纳改写',
  },

  { kind: 'msg', who: 'xiaocao', when: '14:11', text: '采纳。' },

  { kind: 'sys', text: '🎬 业务校准 加入群聊' },

  { kind: 'msg', who: 'biz', when: '14:12',
    text: '关联产品 安心久久年金 v3.1 的所有事实点核对完了,4 处全过,无需改动。',
    action: { kind: 'showBizAudit' },
    evidence: [
      { type: 'ev', text: '已校准产品事实 · 安心久久 v3.1' },
      { type: 'ev', text: '0 处需改写' },
    ] },

  { kind: 'sys', text: '🎬 选角导演 加入群聊' },

  { kind: 'msg', who: 'casting', when: '14:13',
    text: '老年人推沙发,主角是 60+ 老年人。从形象池筛了 4 位适合"老年自如"调性的代理人,你挑一个 →',
    action: { kind: 'showCasting' },
    evidence: [
      { type: 'ev', text: '4 位候选 · 形象池' },
    ] },

  { kind: 'decision', when: '14:14',
    title: '🎭 选角导演给了 4 位候选',
    options: [
      { id: '释磊', label: '释磊 1962 · 资深顾问感(已用 12 次)', primary: true },
      { id: '华叔', label: '华叔 1958 · 稳重慈和' },
      { id: '李姐', label: '李姐 1965 · 亲和邻家' },
      { id: '赵伯', label: '赵伯 1960 · 退伍军人感' },
    ],
    answered: '释磊',
    answerLabel: '释磊,复用率最高',
  },

  { kind: 'msg', who: 'xiaocao', when: '14:14', text: '用释磊,他复用率最高。' },

  { kind: 'sys', text: '🎬 制作组 加入群聊' },

  { kind: 'fold', who: 'production', when: '14:14', title: '准备三步流水',
    steps: [
      'Step 1 · 场景图 (~45s) · ¥0.30',
      'Step 2 · 配音克隆释磊声纹 (~20s) · ¥0.30',
      'Step 3 · 合成 15s 视频 (~290s) · ¥3.20',
      '总耗 ~6 分钟 · 总成本 ¥3.80',
    ] },

  { kind: 'msg', who: 'production', when: '14:14',
    text: '生成预算单推到右边了,你点确认就开跑。',
    action: { kind: 'showBudget' } },

  { kind: 'decision', when: '14:15',
    title: '💰 准备开跑 · 预算 ¥3.80 · 总耗 ~6 分钟',
    options: [
      { id: 'go', label: '开始生成', primary: true },
      { id: 'cancel', label: '再调调' },
    ],
    answered: 'go',
    answerLabel: '开始生成',
  },

  { kind: 'sys', text: '⚙️ 制作组执行中:Step 1 场景图 / Step 2 配音 / Step 3 合成' },

  { kind: 'msg', who: 'production', when: '14:21',
    text: '样片 v1 跑完了,15 秒、9:16、6.2 MB。三步全过,在右边看 →',
    action: { kind: 'showSample' },
    evidence: [
      { type: 'ev', text: '✓ Step 1 / 2 / 3' },
      { type: 'ev', text: '总耗 6 分 12 秒 · ¥3.80' },
    ] },

  { kind: 'msg', who: 'compliance', when: '14:22',
    text: '样片再审来了,编导 / 合规 / 业务三人联审内容侧。2 处小建议(镜头 5 多停 0.5s + 镜头 4 时长微调),其余全过。详情看右边。',
    action: { kind: 'showSampleReview' },
    evidence: [
      { type: 'ev warn', text: '2 处建议' },
      { type: 'ev', text: '3 个维度联审' },
    ] },

  { kind: 'decision', when: '14:23',
    title: '🔁 样片再审给了 2 处微调',
    options: [
      { id: 'accept', label: '采纳全部并重生', primary: true },
      { id: 'keep', label: '保留原片直接上架' },
    ],
    answered: 'accept',
    answerLabel: '采纳并重生',
  },

  { kind: 'sys', text: '⚙️ 制作组重生中... (Step 3 复用前两步产物)' },

  { kind: 'msg', who: 'production', when: '14:29',
    text: '样片 v2 跑完,内容三方再审全过。交给质检师做技术终审 →',
    action: { kind: 'showSample' },
    evidence: [
      { type: 'ev', text: '✓ 内容三方全过' },
    ] },

  { kind: 'sys', text: '🎬 质检师 加入群聊' },

  { kind: 'fold', who: 'qa', when: '14:30', title: '准备技术终审 + 压测',
    steps: [
      '技术规格 5 维度扫描(分辨率 / 时长精度 / 字幕同步 / 水印 / 文件大小)',
      '上架前稳定性压测:同模板换 50 组代理人 + 场景并发跑',
      '统计:口型对齐 / 字幕合格 / 主体清晰 / 合成完整 / 上架适配 5 项指标',
      '出具上架建议',
    ] },

  { kind: 'msg', who: 'qa', when: '14:33',
    text: '技术终审完成:5 维度有 1 处提醒(文件 6.2MB 建议二压);稳定性压测 47/50 通过(94%),1 条合成失败为面部遮挡场景。已达上架门槛,建议直接上架。详情看右边 →',
    action: { kind: 'showQA' },
    evidence: [
      { type: 'ev', text: '5 维度 · 4 过 1 提醒' },
      { type: 'ev', text: '50 条压测 · 通过率 94%' },
      { type: 'ev warn', text: '1 处建议二压' },
    ] },

  { kind: 'decision', when: '14:34',
    title: '🚀 准备上架到好保「需求激发」模板库',
    options: [
      { id: 'publish', label: '确认上架', primary: true },
      { id: 'compress', label: '先二压再上架' },
      { id: 'hold', label: '暂缓' },
    ],
  },
];

// ---------- 工具 ----------
function ic(kind, size = 12) {
  const m = {
    check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" width="${size}" height="${size}"><polyline points="20 6 9 17 4 12"/></svg>`,
    x:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="${size}" height="${size}"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
    chev:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" width="${size}" height="${size}"><polyline points="6 9 12 15 18 9"/></svg>`,
    send:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="${size}" height="${size}"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>`,
    bolt:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="${size}" height="${size}"><polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
    play:  `<svg viewBox="0 0 24 24" fill="currentColor" width="${size}" height="${size}"><polygon points="5 3 19 12 5 21 5 3"/></svg>`,
    arrow: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" width="${size}" height="${size}"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`,
  };
  return m[kind] || '';
}

function toast(text) {
  let host = document.querySelector('.toast-host');
  if (!host) {
    host = document.createElement('div'); host.className = 'toast-host';
    document.body.appendChild(host);
  }
  const el = document.createElement('div');
  el.className = 'toast success';
  el.innerHTML = `<span class="ic">${ic('check', 10)}</span>${text}`;
  host.appendChild(el);
  setTimeout(() => { el.style.transition='opacity .3s'; el.style.opacity='0'; setTimeout(()=>el.remove(), 300); }, 2400);
}

// ============================================================
// V2 增强版 · 用于 屏2-KOS·对话工作台-v2.html
// 包含:
//   - COMPLIANCE_SCAN_V2:360 杀毒风的扫描项序列
//   - COMPLIANCE_AUDIT_TPL_004_V2:补"不吉利内容"行业红线
//   - STORY_BEATS_V2:复用 V1 大部分,但
//       1) welcome 拆 4 类(需求激发分保险 + 泛娱乐 两支)
//       2) compliance-audit 替换为全屏扫描动画 beat
//       3) publish 后追加"数据回流"提示 beat
// ============================================================

// ---------- 360 杀毒风 · 扫描对象(9 个 · 对象主语)----------
// 杀毒软件:每个文件被扫 → 我们:每个内容对象被 6 类规则扫
// 朋友圈话术是合规重灾区(裸字 + 监管直接看),所以命中点放在 ⑧
const COMPLIANCE_SCAN_OBJECTS_V2 = [
  // 视频本体 5 个
  { id: 'o1', name: '台词文本',     file: 'script_v2.txt',           meta: '4,200 字符 · 6 镜头', dur: 700, sev: 'ok',   kind: 'text' },
  { id: 'o2', name: '字幕文件',     file: 'caption_zh.srt',          meta: '1,247 字节 · 6 时间码', dur: 600, sev: 'ok', kind: 'text' },
  { id: 'o3', name: '配音转写',     file: 'audio_transcript.json',    meta: '14.8 秒 · 释磊声纹', dur: 600, sev: 'ok',   kind: 'audio' },
  { id: 'o4', name: '抽帧画面',     file: 'frame_001~012.jpg',       meta: '12 帧 · 1080×1920', dur: 900, sev: 'ok',     kind: 'visual' },
  { id: 'o5', name: '封面图',       file: 'cover_9x16 + cover_1x1',  meta: '2 规格 · OCR + 配色', dur: 700, sev: 'ok',   kind: 'visual' },
  // 配套文字物料 4 个(重灾区)
  { id: 'o6', name: '视频标题',     file: 'title.txt',               meta: '13 字',                dur: 500, sev: 'ok',  kind: 'text' },
  { id: 'o7', name: '视频描述',     file: 'description.txt',          meta: '67 字 · 视频号正文', dur: 700, sev: 'ok',   kind: 'text' },
  { id: 'o8', name: '朋友圈话术',   file: 'friend_circle_copy.txt',  meta: '124 字 · 高危区',     dur: 1400, sev: 'warn', kind: 'text',
    hit: '"年金稳稳兜底,后半生有依靠" 触【收益隐喻】边界 · 建议改写为"年金给后半生有个稳稳的依靠"' },
  { id: 'o9', name: '平台标签集',   file: 'tags.json',                meta: '4 平台 · 18 个 hashtag', dur: 500, sev: 'ok', kind: 'meta' },
];

// 规则集(用于扫描每个对象时引用,作为扫描武器库展示在中心 widget / 日志中)
const COMPLIANCE_RULE_SET_V2 = [
  { id: 'R01', law: '《广告法》第九条',           short: '广告法',     desc: '绝对化用语' },
  { id: 'R02', law: '《保险销售管理办法》第十条', short: '销售办法',   desc: '收益承诺' },
  { id: 'R03', law: '银保监 2023 [12] 号',       short: '银保监',     desc: '类比 / 收益保证' },
  { id: 'R04', law: '阳光红线词库 v2026.05',     short: '阳光红线',   desc: '291 公司禁词' },
  { id: 'R05', law: '行业舆情数据库',            short: '舆情库',     desc: '90 天处罚案例延伸' },
  { id: 'R06', law: '行业潜规则 v3',             short: '不吉利',     desc: '意外/疾病/死亡场景' },
];

// 保留旧的 COMPLIANCE_SCAN_V2 兼容(指向新数据,有 hit 的对象)
const COMPLIANCE_SCAN_V2 = COMPLIANCE_SCAN_OBJECTS_V2;

// ---------- 合规审 V2:对象主语 · 9 对象 × 6 规则 · 朋友圈话术命中 ----------
const COMPLIANCE_AUDIT_TPL_004_V2 = [
  { law: '台词 + 字幕 + 配音(视频本体)',   desc: '3 个文本对象 × 6 类规则 = 18 次扫描 · 0 命中', sev: 'ok' },
  { law: '抽帧画面 + 封面图',              desc: 'OCR 字幕 + 不吉利场景 + 配色检测 · 0 命中', sev: 'ok' },
  { law: '视频标题',                       desc: '"我 65 了,这沙发推得动" · 0 命中', sev: 'ok' },
  { law: '视频描述',                       desc: '67 字描述 · 0 命中', sev: 'ok' },
  { law: '朋友圈话术 · 高危区',             desc: '触【阳光红线词库 第 158 条 收益隐喻】 · "年金稳稳兜底,后半生有依靠"', sev: 'warn',
    revise: { from: '年金稳稳兜底,后半生有依靠', to: '年金给后半生有个稳稳的依靠' } },
  { law: '4 平台标签集',                   desc: '视频号 / 朋友圈 / 小红书 / 抖音 共 18 个 hashtag · 0 命中', sev: 'ok' },
];

// ---------- STORY_BEATS V2 ----------
const STORY_BEATS_V2 = {

  // ===== beat 0:欢迎卡 V2 · 需求激发拆 2 支 =====
  'welcome': {
    type: 'guide',
    title: '嗨,小草 👋',
    subtitle: '今天想做哪一类内容?\n(需求激发分两条线:保险方向 = 人无我有的护城河;泛娱乐 = 跟随各平台爆款,养成代理人使用习惯)',
    options: [
      { id: 'need-insurance', label: '需求激发 · 保险方向',  sub: '15s · 痛点钩子 · 团队精雕 · 拉新',         next: 'pick-need-topic' },
      { id: 'need-fun',       label: '需求激发 · 泛娱乐方向', sub: '15s · 跨平台爆款快速跟随 · 留人',           next: 'placeholder-fun' },
      { id: 'cat',            label: '险种种草',             sub: '1-2 min · 险种科普 · 为什么有必要',         next: 'placeholder-cat' },
      { id: 'prod',           label: '产品种草',             sub: '~3 min · 深度测评 · 决策辅助',              next: 'placeholder-prod' },
    ]
  },

  // ===== 泛娱乐方向占位(显示概念,跳回主线)=====
  'placeholder-fun': {
    type: 'beat',
    sys: '🎬 切换到"泛娱乐 · 快速跟随"线 · 编导改去热点中心捞 Top 5 爆款',
    typing: { who: 'director', dur: 1600 },
    messages: [
      { kind: 'msg', who: 'director', when: '14:02',
        text: `泛娱乐这条线我的工作方式不一样:不再原创脚本,而是去热点中心捞最近 24h 跨平台爆款 Top 5,直接用换脸把代理人放进去。
这条线的目的不是卖保险,是给代理人朋友圈/视频号丢一个"会红"的同款,让她拿到点赞评论的正反馈,养成"开 Sunrise → 出片"的习惯。等她用顺了,再让她试保险方向的爆款。
Demo 主线我们先走保险方向(因为信息更完整),你可以体验完一遍再过来跑泛娱乐。` },
    ],
    decision: {
      title: '回到主线?',
      options: [
        { id: 'go',   label: '走保险方向 · 养老金压力主线', primary: true, next: 'pick-need-topic' },
        { id: 'back', label: '回到入口',                                  next: 'welcome' },
      ]
    }
  },

  'placeholder-cat':  { type: 'beat', sys: '🎬 险种种草这条线在排版中', decision: { title: 'Demo 先聚焦"需求激发 · 保险方向"', options: [ { id: 'go', label: '走主线', primary: true, next: 'pick-need-topic' }, { id: 'back', label: '回入口', next: 'welcome' } ] } },
  'placeholder-prod': { type: 'beat', sys: '🎬 产品种草这条线在排版中', decision: { title: 'Demo 先聚焦"需求激发 · 保险方向"', options: [ { id: 'go', label: '走主线', primary: true, next: 'pick-need-topic' }, { id: 'back', label: '回入口', next: 'welcome' } ] } },

  // ===== beat 1:锚定痛点 (复用 V1) =====
  'pick-need-topic': {
    type: 'beat',
    sys: '🎬 编导 加入群聊',
    typing: { who: 'director', dur: 1200 },
    messages: [
      { kind: 'msg', who: 'director', when: '14:02',
        text: `好嘞导演,15s 需求激发 · 保险方向是我们的护城河。
这一类视频的内容偏好我先摆出来:画面要做荒诞视觉比喻、代理人是正面主角(绝不在受害者位)、画面不标具象、台词不描述画面、有强反差点。手上已经有 4 条上架爆款验证过了。
第一步,锚定一个"痛点方向"——3 秒内戳到代理人目标客户的那个点。这季度银保代理人最常打的痛点我列了几个,你来点。` },
    ],
    decision: {
      title: '🎯 锚定痛点方向',
      options: [
        { id: 'pension', label: '养老金压力',   sub: '60+ 老年群体 / 中产养老焦虑', primary: true, next: 'hooks-pension' },
        { id: 'medical', label: '医疗费用',     sub: '突发医疗 / 重疾负担',           next: 'placeholder-topic' },
        { id: 'edu',     label: '教育金缺口',   sub: '中产家庭 / 子女留学规划',       next: 'placeholder-topic' },
        { id: 'custom',  label: '自定义...',    sub: '我自己输想法',                  next: 'placeholder-topic' },
      ]
    }
  },

  'placeholder-topic': { type: 'beat', sys: '🎬 这个痛点先占位 · Demo 主线走"养老金压力"', decision: { title: '回到主线?', options: [ { id: 'go', label: '走养老金压力', primary: true, next: 'hooks-pension' } ] } },

  // ===== beat 2:钩子方向 (复用 V1) =====
  'hooks-pension': {
    type: 'beat',
    user: { text: '锚定养老金压力,你给我 3 个钩子方向。', when: '14:03' },
    typing: { who: 'director', dur: 1800 },
    messages: [
      { kind: 'thinking', who: 'director', when: '14:03', title: '思考中',
        body: `养老金压力主题,我先在脑里过了我们的反差结构标杆——《巨人踩楼》《工地掉落物》《给海啸递扫帚》,核心都是用一个荒诞动作把"有保障"的状态视觉化,而不是直接说"养老金"。
这个主题的反差核心,我觉得是「无支撑 vs 有支撑」。年轻时候靠体力,老了靠什么?如果只靠子女、只靠运气,那是赌;如果有一份年金做底层,那就有"轻松感"。
顺着这个思路,跑出 3 个荒诞视觉比喻方向,每个都满足:代理人正面主角、画面不标"养老金"具象、有反差点。推到右边了。` },
      { kind: 'msg', who: 'director', when: '14:04',
        text: `3 个方向都在右边:A 是"老年人推沙发"(力量倒置)、B 是"飘车上坡"(机械倒置)、C 是"巨人弹簧床"(能量倒置)。
我个人最推 A,15s 短视频里"力量倒置"接收成本最低,1.5s 内 get 到反差。但你拍板,可以全做 / 只做 B 或 C / 让我换一批。`,
        action: 'showHookVariants',
        evidence: [ { type: 'ev', text: '已检索标杆库 · 4 条爆款' }, { type: 'ev', text: '已匹配 15s 内容偏好 v3' } ] },
    ],
    canvas: 'hook',
    decision: {
      title: '🎯 选钩子方向(也可以多选并发跑)',
      options: [
        { id: 'A',    label: 'A · 老年人推沙发',  sub: '力量倒置 · 接收成本最低',  primary: true, next: 'script-a' },
        { id: 'B',    label: 'B · 飘车上坡',      sub: '机械倒置',                next: 'placeholder-hook' },
        { id: 'C',    label: 'C · 巨人弹簧床',    sub: '能量倒置',                next: 'placeholder-hook' },
        { id: 'all',  label: '3 个都做(并发)',    sub: '复用同主题决策',           next: 'placeholder-hook' },
        { id: 'redo', label: '换一批',             sub: '重新让编导跑',            next: 'placeholder-hook' },
      ]
    }
  },

  'placeholder-hook': { type: 'beat', sys: '🎬 这个分支占位 · Demo 主线走 A', decision: { title: '回到主线?', options: [ { id: 'go', label: '走 A · 老年人推沙发', primary: true, next: 'script-a' } ] } },

  // ===== beat 3:文案起脚本 (复用 V1) =====
  'script-a': {
    type: 'beat',
    user: { text: '先 A,跑通了再批量 B 和 C。', when: '14:04' },
    sys: '🎬 文案 加入群聊',
    typing: { who: 'copy', dur: 2000 },
    messages: [
      { kind: 'thinking', who: 'copy', when: '14:05', title: '思考中',
        body: `收到,A 方向"老年人推沙发"。
我先把核心情绪定下来——这条 15s 不是要"教育用户买年金",是要让用户在前 5 秒就被"咦?这老头怎么这么轻松"勾住,后 10 秒老头慢悠悠说出台词。
但只起台词远远不够。代理人发出去的全套文字物料里,**朋友圈话术是真正的高危区**——监管抽查盯的是这一行字,不是视频本身。所以我这次一并起出全套文字:
台词 + 6 格分镜 + 视频标题 + 描述 + **朋友圈话术** + 4 平台标签。所有文字一次性合规扫,免得后面要打补丁。
台词避开广告腔/描述画面/硬塞"保险";朋友圈话术更克制,避开"稳赚/保本/复利"这类边界词。` },
      { kind: 'msg', who: 'copy', when: '14:05',
        text: `全套文字物料初稿出齐推到右边了:
台词 + 6 格分镜 + 反差重点 + 关联产品 + **视频标题 + 描述 + 朋友圈话术 + 4 平台标签**。
一会编导审"15s 内容偏好",合规一次性扫这 9 个对象(视频本体 5 + 配套文字 4)。`,
        action: 'showScript',
        evidence: [
          { type: 'ev', text: '已生成 6 格分镜' },
          { type: 'ev', text: '已检索产品事实 · 安心久久 v3.1' },
          { type: 'ev warn', text: '⚠ 朋友圈话术需重点过' },
        ] },
    ],
    canvas: 'script',
    decision: {
      title: '📝 看完整套文字,准备进入审核',
      options: [
        { id: 'go',   label: '让编导审一遍 15s 内容偏好', primary: true, next: 'director-audit' },
        { id: 'edit', label: '我自己先改改',                              next: 'placeholder-edit' },
      ]
    }
  },

  'placeholder-edit':   { type: 'beat', sys: '✏️ 自由编辑模式 · Demo 走"让编导审"', decision: { title: '回到主线?', options: [ { id: 'go', label: '让编导审', primary: true, next: 'director-audit' } ] } },
  'placeholder-edit-2': { type: 'beat', sys: '✏️ 自由编辑模式 · Demo 走"采纳"',     decision: { title: '回到主线?', options: [ { id: 'go', label: '采纳并进入合规审', primary: true, next: 'compliance-scan' } ] } },
  'placeholder-edit-3': { type: 'beat', sys: '✏️ 自由编辑模式 · Demo 走"采纳改写"', decision: { title: '回到主线?', options: [ { id: 'go', label: '采纳并进业务校准', primary: true, next: 'biz-audit' } ] } },
  'placeholder-edit-5': { type: 'beat', sys: '🎬 重做模式 · Demo 走"三方再审"',     decision: { title: '回到主线?', options: [ { id: 'go', label: '让三方再审', primary: true, next: 'sample-review' } ] } },

  // ===== beat 4:编导审 (复用 V1) =====
  'director-audit': {
    type: 'beat',
    typing: { who: 'director', dur: 1600 },
    messages: [
      { kind: 'msg', who: 'director', when: '14:08',
        text: `脚本按"15s 需求激发"这一类的 6 条内容偏好审了一遍,4 过 2 提建议。
重点两处:第 4 镜字幕里有"养老金"三个字,违反"画面不标具象",要去掉;另外沙发只是"滑出 2 米",网感不够冲,建议改成"沙发飞出窗外",反差直接拉满。
具体 diff 在右边。提醒:这里审的是"内容偏好",监管硬红线下一步合规独立走。`,
        action: 'showDirectorAudit',
        evidence: [ { type: 'ev', text: '6 条偏好规则审过' }, { type: 'ev warn', text: '2 处建议' } ] },
    ],
    canvas: 'director',
    decision: {
      title: '🎬 编导给了 2 处修改建议',
      options: [
        { id: 'accept', label: '采纳全部修改', primary: true, next: 'compliance-scan' },
        { id: 'self',   label: '我自己改',                    next: 'placeholder-edit-2' },
        { id: 'keep',   label: '保留原稿',                    next: 'placeholder-edit-2' },
      ]
    }
  },

  // ===== beat 5:【V2 新增】合规扫描 · 360 杀毒风 =====
  'compliance-scan': {
    type: 'beat',
    sys: '🛡️ 合规审核 加入群聊 · 启动深度扫描',
    typing: { who: 'compliance', dur: 1000 },
    messages: [
      { kind: 'msg', who: 'compliance', when: '14:09',
        text: `我接手做行业监管硬红线那一关。先说清楚跟编导的差别:编导审的是"这一类视频的内容偏好",我审的是行业硬红线——《广告法》《保险销售管理办法》《银保监 2023 [12] 号》、阳光红线词库、行业潜规则(不吉利内容)——三类视频都要过、不可豁免。
现在启动深度扫描,扫描过程我推到右边了,你可以看着 7 大类规则逐项跑完。` },
    ],
    canvas: 'complianceScan',       // 触发右栏 360 风扫描动画
    nextAuto: { next: 'compliance-result', delay: 7200 },  // 扫描 7 项加起来约 6s,留 1s 余量
  },

  // ===== beat 5b:合规扫描结果 =====
  'compliance-result': {
    type: 'beat',
    typing: { who: 'compliance', dur: 1200 },
    messages: [
      { kind: 'msg', who: 'compliance', when: '14:10',
        text: `扫描完成。
9 个内容对象 × 6 类规则 = 54 次比对,8 个对象绿色通过,1 个对象黄色命中,0 个对象红色拦截 · 整体可上架,只需 1 处改写。
命中那一处是 ⑧ **朋友圈话术**(代理人发朋友圈的那段文字,这是合规重灾区):"年金稳稳兜底,后半生有依靠" 触【收益隐喻】边界,我给的改写是 "年金给后半生有个稳稳的依靠"。
法源引注 + 改写 diff 都在右边详情卡,你过一下。`,
        action: 'showComplianceDetail',
        evidence: [
          { type: 'ev law', text: '54 比对 · 8 过 · 1 改' },
          { type: 'ev warn', text: '⑧ 朋友圈话术 高危区命中' },
        ] },
    ],
    canvas: 'complianceDetail',
    decision: {
      title: '🛡️ 朋友圈话术 命中改写 1 处',
      options: [
        { id: 'accept', label: '采纳改写', sub: '"稳稳兜底,后半生有依靠" → "给后半生有个稳稳的依靠"', primary: true, next: 'biz-audit' },
        { id: 'self',   label: '我自己改',                                       next: 'placeholder-edit-3' },
        { id: 'reject', label: '退回起稿',                                       next: 'placeholder-edit-3' },
      ]
    }
  },

  // ===== beat 6:业务校准 (复用 V1) =====
  'biz-audit': {
    type: 'beat',
    sys: '🎬 业务校准 加入群聊',
    typing: { who: 'biz', dur: 1400 },
    messages: [
      { kind: 'msg', who: 'biz', when: '14:12',
        text: `把脚本里所有跟产品有关的事实点都跟"安心久久年金 v3.1"的产品库对了一遍。
"养老就该这样"、"提前备一份年金"、"稳稳的依靠" 三处都跟 v3.1 一致;台词里没有"3.0% 复利"、"本金保证"这种被标禁词。
4 项全过,无需改动。详情在右边,我直接交给制作组开跑了。`,
        action: 'showBizAudit',
        evidence: [ { type: 'ev', text: '已校准 · 安心久久 v3.1' }, { type: 'ev', text: '4 项全过' } ] },
    ],
    canvas: 'biz',
    decision: {
      title: '✅ 业务校准全过 · 进入制作',
      options: [
        { id: 'go', label: '让制作组开跑(场景图 → 配音 → 合成)', primary: true, next: 'production-step-1' },
      ]
    }
  },

  // ===== beat 7-1/2/3:制作三步链 (复用 V1) =====
  'production-step-1': {
    type: 'beat',
    sys: '🎬 制作组 加入群聊 · 三步流水(场景图 → 配音 → 合成)',
    typing: { who: 'production', dur: 1800 },
    messages: [
      { kind: 'msg', who: 'production', when: '14:15',
        text: `Step 1 场景图出了。
客厅、暖光、沙发居中、9:16 竖版构图,在右边可以看。
样片阶段不绑定具体代理人,用平台的"老年示例形象"(占位)做合成预览,上架后代理人在好保 App 端会换上自己的脸和声音。`,
        action: 'showScene',
        evidence: [ { type: 'ev', text: '场景图 v1 · 1080×1920' } ] },
    ],
    canvas: 'scene',
    nextAuto: { next: 'production-step-2', delay: 1600 },
  },
  'production-step-2': {
    type: 'beat',
    typing: { who: 'production', dur: 1800 },
    messages: [
      { kind: 'msg', who: 'production', when: '14:18',
        text: `Step 2 配音也好了。
用平台"老年示例声纹"录了 14.8 秒,语速 3.6 字/秒,情绪是"自如、有底气"。
配音波形在右边可以预听,验收用占位音轨,代理人上架后会替换为本人声纹。`,
        action: 'showAudio',
        evidence: [ { type: 'ev', text: '14.8s · 3.6 字/秒' } ] },
    ],
    canvas: 'audio',
    nextAuto: { next: 'production-step-3', delay: 1600 },
  },
  'production-step-3': {
    type: 'beat',
    typing: { who: 'production', dur: 2400 },
    messages: [
      { kind: 'msg', who: 'production', when: '14:21',
        text: `Step 3 合成完成,9:16 竖版 15.0s。
沙发飞出窗外那段我用第二轮做物理细节微调,镜头切换平滑。整条片子在右边可以播放预览。
配套物料(标题/描述/朋友圈话术/标签)早在脚本阶段就跟着合规过了,所以这条片连同物料可以直接进三方再审。`,
        action: 'showSample',
        evidence: [ { type: 'ev', text: '15.0s · 9:16 · 6.2 MB' }, { type: 'ev', text: '总耗 6 分 12 秒' } ] },
    ],
    canvas: 'sample',
    decision: {
      title: '🎬 样片完成 · 进入三方再审',
      options: [
        { id: 'go',   label: '让编导/合规/业务三方再审', primary: true, next: 'sample-review' },
        { id: 'redo', label: '请求重做',                                  next: 'placeholder-edit-5' },
      ]
    }
  },
  // production-step-4-meta beat 已删 · 配套物料在 script-a 阶段一并产出 + 合规一次性扫

  // ===== beat 10/11/12:样片再审 + 重生 + 质检 (复用 V1) =====
  'sample-review': {
    type: 'beat',
    typing: { who: 'compliance', dur: 2400 },
    messages: [
      { kind: 'thinking', who: 'compliance', when: '14:22', title: '思考中',
        body: `脚本过审 ≠ 样片过审。这一关我跟编导、业务三个人独立联审——我看字幕/口播/画面里的红线词,编导看视觉网感,业务看画面字幕的事实点。
样片可能引入新风险:画面字幕(突然冒出敏感字)、配音节奏(口型对齐拉长拉短)、封面截帧(代理人不雅瞬间)。这些脚本阶段看不到。` },
      { kind: 'msg', who: 'compliance', when: '14:22',
        text: `三方再审完成,2 处微调:编导那边觉得镜头 5 年轻人惊讶反应可以多停 0.5s 让笑点更冲;合规和业务全过。
具体清单在右边,看完拍板。`,
        action: 'showSampleReview',
        evidence: [ { type: 'ev warn', text: '2 处微调' }, { type: 'ev', text: '3 个维度联审' } ] },
    ],
    canvas: 'sampleReview',
    decision: {
      title: '🔁 样片再审给了 2 处微调',
      options: [
        { id: 'accept', label: '采纳并重生', sub: '镜头 5 多停 0.5s', primary: true, next: 'production-redo' },
        { id: 'keep',   label: '保留原片直接上架',                                  next: 'qa' },
      ]
    }
  },

  'production-redo': {
    type: 'beat',
    sys: '⚙️ 制作组重生中 · 复用 Step 1/2 产物,只重跑 Step 3 合成',
    typing: { who: 'production', dur: 2400 },
    messages: [
      { kind: 'msg', who: 'production', when: '14:29',
        text: `样片 v2 出炉,镜头 5 按要求多停 0.5s,总时长 15.0s 守住。Step 1/2 复用没重跑。
下一步交给质检师做技术终审 + 50 条压测(同模板换 50 组代理人 / 场景并发跑)——这是上架前的最后一关。`,
        action: 'showSample',
        evidence: [ { type: 'ev', text: '✓ 内容三方全过' }, { type: 'ev', text: 'Step 1/2 复用' } ] },
    ],
    canvas: 'sample',
    decision: {
      title: '🎬 v2 完成 · 进入质检',
      options: [ { id: 'go', label: '让质检师做技术终审 + 压测', primary: true, next: 'qa' } ]
    }
  },

  'qa': {
    type: 'beat',
    sys: '🎬 质检师 加入群聊',
    typing: { who: 'qa', dur: 3200 },
    messages: [
      { kind: 'thinking', who: 'qa', when: '14:30', title: '思考中',
        body: `我这一关分两部分。
第一部分是技术规格 5 维度——分辨率、时长精度、字幕同步、水印、文件大小。不达标好保 App 列表会拒收。
第二部分是稳定性压测——代理人在好保 App 端 try-on 时要换不同人脸 + 不同场景,我们在云端先模拟 50 组并发,确保模板在真实环境稳。这是 SaaS 视角的"上架前回归测试"。` },
      { kind: 'msg', who: 'qa', when: '14:33',
        text: `跑完了。
技术规格 5 项里 4 过 1 提醒——文件 6.2MB 比上架推荐 5MB 略大,建议二压(画质损失 < 3%)。
50 条压测:47 条通过(94%),2 条提醒(王哥/篮球场口型偏移 95ms、赵哥/高速公路背景动态干扰),1 条失败(林姐/餐厅包厢主角面部遮挡)。失败那条可在好保 App 端通过拍摄引导规避,不影响上架。
结论:已达上架门槛,建议直接上架。详情在右边。`,
        action: 'showQA',
        evidence: [ { type: 'ev', text: '5 维度 · 4 过 1 提醒' }, { type: 'ev', text: '50 条压测 · 94%' } ] },
    ],
    canvas: 'qa',
    decision: {
      title: '🚀 准备上架到好保「需求激发」模板库',
      options: [
        { id: 'publish',  label: '确认上架',         primary: true, next: 'publish' },
        { id: 'compress', label: '先二压再上架',                    next: 'publish' },
      ]
    }
  },

  // ===== beat 13:上架(终点 · 数据回流交给数据看板)=====
  'publish': {
    type: 'beat',
    canvas: 'publish',
    sys: '🎉 TPL-004 老年人推沙发 已上架到好保 · 需求激发模板库',
    messages: [
      { kind: 'msg', who: 'production', when: '14:35',
        text: `上架成功 🎉
代理人打开好保 App 「需求激发」模板库就能看到这条「老年人推沙发」,可以一键 try-on 替换自己的脸 + 声音生成属于自己的 15s 短视频。
本批次还有 B「飘车上坡」、C「巨人弹簧床」两条同主题,A 跑通了所有决策都可以复用,要不要批量?`,
        evidence: [ { type: 'ev', text: '内容 hash a3f2c81e...' }, { type: 'ev', text: '审计留痕已归档' } ] },
    ],
    decision: {
      title: '🎬 这一批接下来?',
      options: [
        { id: 'batch', label: '批量跑 B + C',  sub: '复用 A 的所有决策', primary: true, next: 'placeholder-batch' },
        { id: 'new',   label: '新开一批',                                                next: 'welcome' },
        { id: 'done',  label: '今天到此',                                               next: 'placeholder-done' },
      ]
    }
  },

  'placeholder-batch': { type: 'beat', sys: '⚡ B + C 已并发跑起来 · Demo 演示完毕', decision: { title: '回到入口?', options: [ { id: 'go', label: '回入口', primary: true, next: 'welcome' } ] } },
  'placeholder-done':  { type: 'beat', sys: '🌅 今天辛苦啦,下次见 · Demo 演示完毕',  decision: { title: '重新走一遍?', options: [ { id: 'go', label: '回入口', primary: true, next: 'welcome' } ] } },

};

// ---------- 导出到 window ----------
window.SUNRISE = {
  AGENTS, CONTENT_TYPES, COMPLIANCE_RULES, PRODUCT_FACTS, TEMPLATES,
  HOOK_VARIANTS_TPL_004, SCRIPT_TPL_004,
  DIRECTOR_AUDIT_TPL_004, COMPLIANCE_AUDIT_TPL_004, BIZ_AUDIT_TPL_004,
  CASTING_TPL_004, SAMPLE_REVIEW_TPL_004,
  PRODUCTION_STEPS_TPL_004, QA_SPEC_TPL_004, QA_STABILITY_TPL_004,
  INITIAL_STREAM, STORY_BEATS, ic, toast,
  // V2 增强版
  COMPLIANCE_SCAN_V2, COMPLIANCE_SCAN_OBJECTS_V2, COMPLIANCE_RULE_SET_V2,
  COMPLIANCE_AUDIT_TPL_004_V2, STORY_BEATS_V2,
};
