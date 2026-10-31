# -*- coding: utf-8 -*-
"""
eva 驾驶员终端 v2.2 -> v2.3
APP-07 小卖部：365 件货表 + 分类/翻页 移植进现有 UI
保留：贩卖机画布场景 / ペンペン店長对话 / 隐藏设定长票 / MAGI 表决 / 卡纸 / PNG 保存
"""
import io, os, re, collections

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
OUT_DIR = os.path.join(BASE_DIR, 'build')
if not os.path.isdir(OUT_DIR):
    os.makedirs(OUT_DIR)

SRC = os.path.join(BASE_DIR, 'base', 'eva驾驶员终端_v2.2.html')
DST = os.path.join(OUT_DIR, 'eva驾驶员终端_v2.3.html')
ITEMS_FILE = os.path.join(BASE_DIR, 'mart_items_365.txt')
items_txt = io.open(ITEMS_FILE, encoding='utf-8').read()
# 统计每个分类的真实条目数
cnt = collections.OrderDict() if False else collections.OrderedDict()
for line in items_txt.splitlines():
    m = re.search(r"c:'(\w+)'", line)
    if m:
        cnt[m.group(1)] = cnt.get(m.group(1), 0) + 1
n_all = sum(cnt.values())
print('== 货表统计 ==')
for k, v in cnt.items():
    print('   %-8s %d' % (k, v))
print('   合计      %d' % n_all)

s = io.open(SRC, encoding='utf-8').read()
orig_len = len(s)

NEW_PANEL = """    <!-- APP-07 小卖部 v2 ▸ 365 種 ▸ 两层折叠 ▸ 分类两行 -->
    <div class="panel" id="panel-mart">
      <label class="fl">▸ NERV 売店（第3新東京市 · 地下第1層）</label>
      <button class="foldbar" id="martFold" type="button"><span id="foldArrow">▸</span><span>商品货架 ▸ 点此展开</span><span class="fi" id="foldInfo">已选 0 件 · ¥0</span></button>
      <div id="martBody">
      <div class="chips" id="martChips"></div>
      <div class="shelf" id="martShelf"></div>
      <div class="irow" id="martPager" style="display:none;justify-content:center;align-items:center;gap:10px">
        <button class="mainbtn ghostbtn" id="pgPrev" style="flex:0 0 auto;width:104px">◀ 上一页</button>
        <span id="pgLabel" style="font-family:'Courier New',monospace;font-size:11px;color:#6E6E6E">1 / 1</span>
        <button class="mainbtn ghostbtn" id="pgNext" style="flex:0 0 auto;width:104px">下一页 ▶</button>
      </div>
      <div class="cartbar">
        <span id="cartInfo">已选 0 件</span>
        <span>合计 <b id="cartTotal">¥0</b></span>
      </div>
      <div id="martLot">MAGI 伝動 ▸ 満 ¥500 で抽選権利</div>
      <div class="avhint">※ 货架默认收起 ▸ 点上方折叠条展开选购。<br>※ 结算需 <b>MAGI 三贤人多数决</b>，CASPER 有约 18% 概率因「女人的一时兴起」投否定。<br>※ 满 <b>¥500</b> 触发 MAGI 传动抽奖：扭蛋机会先滚 3 圈，开盖弹蛋「恭喜中奖」，奖品从取物口出货；通过后有 <b>10%</b> 概率收银机卡纸，点 RETRY 重新出票。<br>※ 画面左侧贩卖机显示当前页前 8 件，可直接点击；右边小水戳一下换台词。<br>※ 每日随机上架约 <b>45 種</b>（全庫 365 種轮换），每个分类保底 2 件，隔天进货自动换血。</div>
      </div>
      <div class="btnrow">
        <button class="mainbtn" id="martPay">投币 ▸ 去收银台</button>
        <button class="mainbtn ghostbtn" id="martClr">清空</button>
      </div>
      <div class="btnrow"><button class="mainbtn" id="martPng" disabled>保存小票 ▸ PNG</button></div>
      <div id="martJam">
        <div class="jt">⚠ PAPER JAM ▸ 收银机卡纸</div>
        打印纸卡住了 ▸ 已呼叫技师<br>鈴原東治（维修中…）<br>※ 已成交商品不受影响 ▸ 点 RETRY 重新出票
        <div class="btnrow"><button class="mainbtn" id="martRetry">重新打印 ▸ RETRY</button></div>
      </div>
      <div id="rcpt"></div>
    </div>
"""

p0 = s.index('    <!-- APP-07 小卖部 -->')
p1 = s.index('    <!-- APP-08 都市地图 -->', p0)
old_panel = s[p0:p1]
s = s[:p0] + NEW_PANEL + '\n' + s[p1:]
print('== panel-mart HTML replaced (%d -> %d bytes)' % (len(old_panel), len(NEW_PANEL)))

JS_START = "/* ---------- APP-07 小卖部（ペンペン店長"
NEW_JS = r'''/* ---------- APP-07 小卖部 v2 ▸ 365種 ▸ 分類+翻頁 ▸ ペンペン店長 ▸ 隐藏设定小票 ---------- */
var martApp = (function(){
  var W = 1080, H = 1080;
  var RED = C.red, ORG = C.orange, YEL = C.yellow, GRN = C.green;
  var view = 'SHOP';
  var cart = [], total = 0, flash = '';
  var receipt = null, rcDirty = false;
  var GX0 = 64, GY0 = 420, GW = 128, GH = 176, GPX = 16, GPY = 20;
  var BX = 700, BY = 340, BW = 340, BH = 560;
  var PAGE = 30, cat = 'all', page = 0;

  var CATS = [
    { id:'all',   nm:'全部' },      { id:'drink', nm:'饮品' },
    { id:'snack', nm:'零食' },      { id:'hot',   nm:'热食' },
    { id:'cold',  nm:'冷藏' },      { id:'nerv',  nm:'NERV周边' },
    { id:'pilot', nm:'适格者限定' }, { id:'angel', nm:'使徒主题' },
    { id:'magi',  nm:'MAGI科技' },  { id:'egg',   nm:'彩蛋区' }
  ];
  var CATSTYLE = {
    drink:{ cl:'#5A8CF0', sp:'btl' },  snack:{ cl:'#F5A623', sp:'bar' },
    hot:  { cl:'#FF6A2B', sp:'cup' },  cold: { cl:'#33FF66', sp:'can' },
    nerv: { cl:'#F5C400', sp:'can' },  pilot:{ cl:'#D42027', sp:'tri' },
    angel:{ cl:'#B9B9B9', sp:'boom' }, magi: { cl:'#33FF66', sp:'bar' },
    egg:  { cl:'#C77DFF', sp:'tri' }
  };

  var ITEMS = [
__ITEMS__  ];

  /* ---- 每日精选 ▸ 按日期确定性抽样，每天自动换一批 ---- */
  var DAILY_N = 42;
  var DAILY = (function(){
    var seed = (function(){ var d = new Date(); return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate(); })();
    function rnd(){ seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }
    var byCat = {}, ids = ['drink','snack','hot','cold','nerv','pilot','angel','magi','egg'], i, j, t, out = [];
    for (i = 0; i < ITEMS.length; i++){ (byCat[ITEMS[i].c] = byCat[ITEMS[i].c] || []).push(ITEMS[i]); }
    ids.forEach(function(id){
      var arr = byCat[id].slice(), n;
      for (j = arr.length - 1; j > 0; j--){ var k = Math.floor(rnd() * (j + 1)); t = arr[j]; arr[j] = arr[k]; arr[k] = t; }
      n = Math.max(2, Math.round(arr.length * DAILY_N / ITEMS.length));
      out = out.concat(arr.slice(0, Math.min(n, arr.length)));
    });
    return out;
  })();

  var LOST = [
    'UN-0001 ▸ SONY 随身听（磁带卡在25/26循环）',
    'UN-0002 ▸ 黑框眼镜（左镜片裂痕，碇司令的）',
    'UN-0003 ▸ 白色绷带×数卷（带血迹，已消毒）',
    'UN-0004 ▸ 红色发绳 ×2',
    'UN-0005 ▸ 名牌太阳镜（镜片有LCL痕迹）',
    'UN-0006 ▸ 加持种的西瓜（整只，完好）',
    'UN-0007 ▸ 香水×1瓶（已用1/3，薄荷味）',
    'UN-0008 ▸ 暴走的铝棒（推测是东治的）',
    'UN-0009 ▸ 插花剪×1（保存状态极好）',
    'UN-0010 ▸ 渚薰的毛巾（白色，气味：无）',
    'UN-0011 ▸ PEN PEN玩偶（温泉同款，微热）',
    'UN-0012 ▸ 十字架项链×1（弹痕完好）',
    'UN-0013 ▸ 人类补完计划申请书（已作废）'
  ];
  var EXP = [
    { id:'EXP-0001', t:'朗基奴斯枪复制版回旋镖测试失败', d:'穿透三面防爆墙和两个咖啡机', s:'已修复（保险柜文件碳化）', r:'战术作战部实习特工' },
    { id:'EXP-0002', t:'S²机关微缩模型过载启动', d:'产生0.5秒微型黑洞，吸入半杯咖啡及口红一支', s:'已修复（口红除外）', r:'技术开发部第一课' },
    { id:'EXP-0003', t:'A.T.力场生成器校准错误', d:'食堂展开橙色力场，包裹吃拉面实习生15分钟', s:'已解除（实习生轻微头晕）', r:'特殊监督部' },
    { id:'EXP-0004', t:'EVA插入栓模拟连接故障', d:'舱门提前弹射，假人射穿天花板', s:'已取出（假人身穿2号机驱动服）', r:'适格者训练中心' },
    { id:'EXP-0005', t:'MAGI三贤人投票死机', d:'咖啡机预算案YES/NO/WAIT分歧，死机10分钟', s:'手动重启（咖啡机未购）', r:'系统维护部' },
    { id:'EXP-0006', t:'朗基奴斯枪（真品）轨道偏离', d:'吸收过量太阳能自行加速，脱离地球轨道', s:'漂浮于小行星带（SEELE震怒）', r:'战术作战部（司令默许）' },
    { id:'EXP-0007', t:'EVA初号机暴走试验（微型）', d:'1:100模型发出咆哮声波，震碎全部玻璃器皿', s:'已清理（含律子博士咖啡杯）', r:'E计划开发组' },
    { id:'EXP-0008', t:'使徒核心样本辐射泄漏', d:'植物3秒内完成种子→枯萎全程', s:'样本已转移高安保区', r:'生物研究部' },
    { id:'EXP-0009', t:'NERV标志投影灯故障', d:'半枫叶标志投射云层2分钟，市民恐慌', s:'已澄清（明日报纸头条）', r:'公共关系部' },
    { id:'EXP-0010', t:'A10神经连接插头误插', d:'新人与2号机短暂同步，空中完成后空翻', s:'已断开（新人称像坐过山车）', r:'适格者训练中心' }
  ];
  var THANKS = [
    '感谢您参与人类补完计划 ▸ 全员融合愉快',
    '今日のシンクロ率：97% ▸ 明日も宜しく',
    '危险：请勿将小票靠近 A.T. FIELD',
    'A.T. FIELD 保持营业中',
    'WILLE：本店与 SEELE 无关',
    'HAPPY END 不出售，抱歉'
  ];
  var PRIZES = [
    { w:1,  name:'★ 事故纪念品 ▸ 律子博士咖啡杯碎片（已拼合）', star:true },
    { w:3,  name:'朗基奴斯枪（尼龙回旋镖版）', star:true },
    { w:12, name:'渚薰的同款香皂', star:false },
    { w:12, name:'明日香骂人语音卡（德日双语）', star:false },
    { w:23, name:'MAGI 三贤人扭蛋（随机一位贤人）', star:false },
    { w:25, name:'绫波丽味噌汤料包 ×1', star:false },
    { w:24, name:'LCL 饮用补充液（5ml 试管装）', star:false }
  ];
  var LINES = {
    idle: [
      { j: 'いらっしゃい ▸ NERV 売店へようこそ',                 c: '欢迎光临 NERV 小卖部，今日上架 ' + DAILY.length + ' 種，明早自动换货。' },
      { j: '棚は分類とページで切り替わる。左の自販機も同じ頁だ。', c: '货架按分类翻页，左边贩卖机跟着同一页走。' },
      { j: '清算は MAGI 三賢人の多数決だ。CASPER に気を付けろ。', c: '结算要过 MAGI 三贤人表决，小心 CASPER。' },
      { j: '¥500 以上買えば、MAGI 伝動の抽選権利が付く。',       c: '满 ¥500 触发 MAGI 传动抽奖。' },
      { j: 'レシートは下のボタンで PNG に保存できる。記念にどうぞ。', c: '小票可以存成 PNG 带走。' },
      { j: '今日も安全第一。……何の安全かは、聞くな。',           c: '今天也安全第一。别问是什么安全。' },
      { j: '彩蛋区の品は、たいてい誰かの私物だ。',               c: '彩蛋区的东西，八成是谁的私物。' },
      { j: '当たり外れのある値段は、MAGI が勝手に決めた。',       c: '那些离谱的标价，是 MAGI 自己定的。' }
    ],
    add: [
      { j: 'いい選択だ。',                                       c: '好眼光。' },
      { j: 'それ、葛城少佐の好物だぞ。',                          c: '那是葛城少佐的最爱。' },
      { j: '……また増えたな。',                                   c: '……又加了一件。' }
    ],
    rare: [
      { j: 'それ、何故そこにあった？……まあ、いい。',             c: '那玩意怎么会在货架上？……算了。' },
      { j: '値札は気にするな。付いている値段が正解だ。',           c: '别在意标价，标多少就是多少。' }
    ],
    empty: [
      { j: '何も選んでいないぞ。棚を見ろ。',                      c: '你还没挑东西，看货架。' }
    ],
    deny: [
      { j: 'CASPER が否決した。あの女、今日は機嫌が悪い。',        c: 'CASPER 否决了，那女人今天心情不好。' },
      { j: '否決 ▸ 金は返ってきている。もう一度行くか？',         c: '已退款，要不要再来一次？' }
    ],
    pass: [
      { j: 'MAGI 通過 ▸ いい買い物だった。',                      c: 'MAGI 通过。不错的采购。' }
    ],
    jam: [
      { j: '紙が詰まったか。東治を呼べ。……蹴れば直る。',         c: '卡纸了。去叫东治来踹一脚。' }
    ],
    retry: [
      { j: '東治が蹴った。直ったぞ。',                            c: '东治踹了一脚，好了。' }
    ],
    win: [
      { j: '当たりだ。……珍しい。',                               c: '中奖了。……稀奇。' }
    ],
    ssr: [
      { j: 'これは律子博士のコーヒーカップの破片だ。黙って持って行け。', c: '这是律子博士的咖啡杯碎片。别说出去。' }
    ]
  };
  var bubble = { t0: 0, kind: 'idle', idx: 0, line: LINES.idle[0], nextAt: 0 };
  var el = {
    shelf: document.getElementById('martShelf'),
    chips: document.getElementById('martChips'),
    pager: document.getElementById('martPager'),
    prev: document.getElementById('pgPrev'),
    next: document.getElementById('pgNext'),
    pgLabel: document.getElementById('pgLabel'),
    info: document.getElementById('cartInfo'),
    total: document.getElementById('cartTotal'),
    pay: document.getElementById('martPay'),
    clr: document.getElementById('martClr'),
    png: document.getElementById('martPng'),
    jam: document.getElementById('martJam'),
    retry: document.getElementById('martRetry'),
    lot: document.getElementById('martLot'),
    rcpt: document.getElementById('rcpt'),
    body: document.getElementById('martBody'),
    fold: document.getElementById('martFold'),
    foldArrow: document.getElementById('foldArrow'),
    foldInfo: document.getElementById('foldInfo')
  };
  function setFold(open){
    if (el.body){ el.body.classList.toggle('on', !!open); }
    if (el.foldArrow){ el.foldArrow.textContent = open ? '▾' : '▸'; }
    if (el.fold){
      var lb = el.fold.querySelectorAll('span')[1];
      if (lb){ lb.textContent = open ? '商品货架 ▸ 点此收起' : '商品货架 ▸ 点此展开'; }
    }
  }
  function jumpCanvas(){
    setFold(false);
    var pv = cv.parentNode;
    if (pv && pv.scrollIntoView){ try{ pv.scrollIntoView({ behavior: 'smooth', block: 'center' }); }catch(err){ pv.scrollIntoView(); } }
  }

  function pickW(pool){
    var t = 0, i;
    for (i = 0; i < pool.length; i++){ t += pool[i].w; }
    var r = Math.random() * t;
    for (i = 0; i < pool.length; i++){ r -= pool[i].w; if (r <= 0){ return pool[i]; } }
    return pool[pool.length - 1];
  }
  function pickN(arr, n){
    var cp = arr.slice(), out = [], i;
    for (i = 0; i < n && cp.length; i++){ out.push(cp.splice(Math.floor(Math.random() * cp.length), 1)[0]); }
    return out;
  }
  function itemByNm(nm){
    var i;
    for (i = 0; i < ITEMS.length; i++){ if (ITEMS[i].nm === nm){ return ITEMS[i]; } }
    return { nm: nm, pr: 0 };
  }
  function styleOf(it){ return CATSTYLE[it.c] || { cl: '#B9B9B9', sp: 'can' }; }
  function isRare(it){ return it.pr >= 2000 || it.pr === 0 || it.st.indexOf('限定') >= 0; }
  function catName(){
    var i;
    for (i = 0; i < CATS.length; i++){ if (CATS[i].id === cat){ return CATS[i].nm; } }
    return '全部';
  }
  function pool(){
    if (cat === 'all'){ return DAILY; }
    var r = [], i;
    for (i = 0; i < DAILY.length; i++){ if (DAILY[i].c === cat){ r.push(DAILY[i]); } }
    return r;
  }
  function pages(){ return Math.max(1, Math.ceil(pool().length / PAGE)); }
  function pageItems(){
    var f = pool(), s = page * PAGE, e = Math.min(f.length, s + PAGE), out = [], i;
    for (i = s; i < e; i++){ out.push(f[i]); }
    return out;
  }
  function machineGoods(){
    var f = pool(), s = page * PAGE, out = [], i;
    for (i = 0; i < 8; i++){ if (s + i < f.length){ out.push(f[s + i]); } }
    return out;
  }
  function setLine(kind){
    var p = LINES[kind] || LINES.idle, idx = 0;
    if (p.length > 1){
      idx = Math.floor(Math.random() * p.length);
      if (idx === bubble.idx && kind === bubble.kind){ idx = (idx + 1) % p.length; }
    }
    bubble.kind = kind; bubble.idx = idx; bubble.line = p[idx];
    bubble.t0 = Date.now();
    bubble.nextAt = bubble.t0 + bubble.line.j.length * 105 + bubble.line.c.length * 80 + 4200;
  }
  function wrapCJK(text, per){
    var out = [], line = '', i;
    for (i = 0; i < text.length; i++){
      line += text.charAt(i);
      if (line.length >= per){ out.push(line); line = ''; }
    }
    if (line){ out.push(line); }
    return out;
  }
  function typeOut(text, dt, ms){
    var n = Math.floor(dt / ms);
    if (n < 0){ n = 0; }
    if (n > text.length){ n = text.length; }
    return text.slice(0, n);
  }
  function refresh(){
    if (el.info){ el.info.textContent = '已选 ' + cart.length + ' 件 ▸ 在庫 ' + ITEMS.length + ' 種'; }
    if (el.total){ el.total.textContent = '¥' + total; }
    if (el.foldInfo){ el.foldInfo.textContent = '已选 ' + cart.length + ' 件 · ¥' + total; }
    if (el.lot){
      var okk = total >= 500;
      el.lot.textContent = okk ? 'MAGI 伝動 ▸ READY ✓ ▸ 満額達成 ▸ 抽選権利獲得' :
                                ('MAGI 伝動 ▸ LOCK ▸ 还差 ¥' + (500 - total) + ' 触发抽奖');
      el.lot.className = okk ? 'ok' : '';
    }
    if (el.pgLabel){ el.pgLabel.textContent = (page + 1) + ' / ' + pages() + ' ▸ ' + pool().length + ' 種'; }
    if (el.pager){ el.pager.style.display = (pool().length > PAGE) ? 'flex' : 'none'; }
    if (el.prev){ el.prev.disabled = (page <= 0); }
    if (el.next){ el.next.disabled = (page >= pages() - 1); }
  }
  function backToShop(){
    view = 'SHOP'; receipt = null; rcDirty = false;
    if (el.png){ el.png.disabled = true; }
    if (el.jam){ el.jam.classList.remove('on'); }
    if (el.rcpt){ el.rcpt.classList.remove('on'); }
    cv.width = W; cv.height = H;
  }
  function addItem(it){
    if (view !== 'SHOP'){ backToShop(); }
    cart.push(it); total += it.pr;
    SFX.click();
    if (isRare(it)){ setLine('rare'); }
    else if (Math.random() < 0.3){ setLine('add'); }
    refresh();
  }
  function renderShelf(){
    var list = pageItems(), base = page * PAGE, h = '', i;
    for (i = 0; i < list.length; i++){
      h += '<div class="item" data-i="' + (base + i) + '">' +
           '<div class="em">' + list[i].em + '</div>' +
           '<div class="nm">' + list[i].nm + '</div>' +
           '<div class="pr">¥' + list[i].pr + '</div>' +
           '<div class="stock">' + list[i].st + '</div></div>';
    }
    el.shelf.innerHTML = h;
    el.shelf.querySelectorAll('.item').forEach(function(node){
      node.addEventListener('click', function(){
        var f = pool(), idx = +node.getAttribute('data-i');
        if (f[idx]){ addItem(f[idx]); }
      });
    });
    refresh();
  }

  /* ---- ペンペン店長：对话气泡 + 企鹅 ---- */
  function drawBubble(now){
    var bx = 140, by = 120, bw = 860, bh = 190, L = bubble.line;
    ctx.save();
    ctx.fillStyle = 'rgba(6,2,3,.92)';
    rr(bx, by, bw, bh, 16); ctx.fill();
    ctx.strokeStyle = RED; ctx.lineWidth = 3;
    rr(bx, by, bw, bh, 16); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(828, by + bh - 3); ctx.lineTo(880, by + bh + 22); ctx.lineTo(792, by + bh - 3);
    ctx.closePath();
    ctx.fillStyle = 'rgba(6,2,3,.92)'; ctx.fill(); ctx.stroke();
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillStyle = RED; ctx.font = mono(20, '700');
    ctx.fillText('水天使小水 ▸ 売店店員', bx + 22, by + 20);
    var dt = now - bubble.t0;
    if (dt < 0){ dt = 0; }
    var jl = wrapCJK(typeOut(L.j, dt, 46), 26);
    ctx.fillStyle = '#fff'; ctx.font = cn(30, '700');
    var i, yy = by + 50;
    for (i = 0; i < jl.length && i < 2; i++){ ctx.fillText(jl[i], bx + 22, yy); yy += 40; }
    var delay = L.j.length * 46 + 240;
    if (dt > delay){
      var cl = wrapCJK(typeOut(L.c, dt - delay, 52), 30);
      yy += 6;
      ctx.fillStyle = 'rgba(255,255,255,.92)'; ctx.font = cn(27, '700');
      for (i = 0; i < cl.length && i < 2; i++){ ctx.fillText(cl[i], bx + 22, yy); yy += 34; }
    }
    if (Math.floor(now / 420) % 2 === 0){
      ctx.fillStyle = RED; ctx.font = mono(22, '700');
      ctx.textAlign = 'right';
      ctx.fillText('▸', bx + bw - 24, by + 20);
    }
    ctx.restore();
  }
  function drawBoss(now){
    var bob = Math.sin(now / 760) * 3;
    ctx.save();
    ctx.fillStyle = 'rgba(212,32,39,.055)'; rr(BX, BY, BW, BH, 12); ctx.fill();
    ctx.strokeStyle = 'rgba(212,32,39,.34)'; ctx.lineWidth = 2; rr(BX, BY, BW, BH, 12); ctx.stroke();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(255,255,255,.16)'; ctx.font = mono(22, '700');
    ctx.fillText('WATER ANGEL', BX + BW / 2, BY + 34);
    ctx.translate(0, bob);
    var cx = 870, cy = 600;
    /* 小水 ▸ 水天使 Q 版：黑圆球 + 水滴白脸 + 火柴四肢 + 金色 NERV 制服 */
    var GOLD = '#E0A62D', GOLD2 = '#F5C400';
    /* 手臂（火柴, 深灰可见, 画在身体后面） */
    function limb(x1, y1, x2, y2, wOut, wIn){
      ctx.strokeStyle = '#585858'; ctx.lineWidth = wOut;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      ctx.strokeStyle = '#101010'; ctx.lineWidth = wIn;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    }
    var wave = Math.sin(now / 700) * 8;
    limb(cx - 88, cy + 10, cx - 132, cy + 52 + wave, 12, 6);
    limb(cx - 132, cy + 52 + wave, cx - 142, cy + 40 + wave, 9, 4);
    limb(cx - 132, cy + 52 + wave, cx - 148, cy + 58 + wave, 9, 4);
    limb(cx - 132, cy + 52 + wave, cx - 136, cy + 68 + wave, 9, 4);
    limb(cx + 88, cy + 10, cx + 132, cy + 52 - wave, 12, 6);
    limb(cx + 132, cy + 52 - wave, cx + 142, cy + 40 - wave, 9, 4);
    limb(cx + 132, cy + 52 - wave, cx + 148, cy + 58 - wave, 9, 4);
    limb(cx + 132, cy + 52 - wave, cx + 136, cy + 68 - wave, 9, 4);
    /* 腿脚 */
    limb(cx - 40, cy + 88, cx - 48, cy + 140, 13, 7);
    limb(cx - 48, cy + 140, cx - 60, cy + 148, 9, 4);
    limb(cx - 48, cy + 140, cx - 46, cy + 156, 9, 4);
    limb(cx - 48, cy + 140, cx - 32, cy + 150, 9, 4);
    limb(cx + 40, cy + 88, cx + 52, cy + 140, 13, 7);
    limb(cx + 52, cy + 140, cx + 42, cy + 150, 9, 4);
    limb(cx + 52, cy + 140, cx + 58, cy + 156, 9, 4);
    limb(cx + 52, cy + 140, cx + 68, cy + 148, 9, 4);
    ctx.lineCap = 'butt';
    /* 黑圆球身体 */
    ctx.strokeStyle = '#303030'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(cx, cy, 96, 0, Math.PI * 2); ctx.fillStyle = '#0B0B0B'; ctx.fill(); ctx.stroke();
    /* 金色 NERV 工作围裙（球体下半） */
    ctx.beginPath();
    ctx.moveTo(cx - 84, cy + 26);
    ctx.quadraticCurveTo(cx - 72, cy + 112, cx, cy + 118);
    ctx.quadraticCurveTo(cx + 72, cy + 112, cx + 84, cy + 26);
    ctx.quadraticCurveTo(cx, cy + 62, cx - 84, cy + 26);
    ctx.closePath();
    ctx.fillStyle = GOLD; ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,.4)'; ctx.lineWidth = 3; ctx.stroke();
    /* 围裙背带 */
    ctx.strokeStyle = GOLD2; ctx.lineWidth = 11;
    ctx.beginPath();
    ctx.moveTo(cx - 52, cy - 44); ctx.lineTo(cx - 66, cy + 40);
    ctx.moveTo(cx + 52, cy - 44); ctx.lineTo(cx + 66, cy + 40);
    ctx.stroke();
    /* 胸前 NERV 白标（避开脸尖, 贴围裙下摆） */
    ctx.fillStyle = '#F5F5F0'; rr(cx - 32, cy + 66, 64, 30, 6); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 2; rr(cx - 32, cy + 66, 64, 30, 6); ctx.stroke();
    ctx.fillStyle = '#111'; ctx.font = mono(18, '700');
    ctx.fillText('NERV', cx, cy + 81);
    /* 水滴白脸（顶部圆 + 底部收尖） */
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath(); ctx.arc(cx, cy - 34, 58, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx - 44, cy - 6);
    ctx.quadraticCurveTo(cx - 20, cy + 44, cx, cy + 78);
    ctx.quadraticCurveTo(cx + 20, cy + 44, cx + 44, cy - 6);
    ctx.closePath(); ctx.fill();
    /* 眼睛（黑豆） */
    ctx.fillStyle = '#111';
    ctx.beginPath(); ctx.arc(cx - 22, cy - 44, 8, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + 26, cy - 46, 9, 0, Math.PI * 2); ctx.fill();
    /* 腮红 */
    ctx.fillStyle = 'rgba(240,110,110,.65)';
    ctx.beginPath(); ctx.ellipse(cx - 40, cy - 24, 5, 9, -0.35, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx - 30, cy - 21, 5, 9, -0.35, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx + 44, cy - 26, 5, 9, 0.35, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx + 34, cy - 23, 5, 9, 0.35, 0, Math.PI * 2); ctx.fill();
    /* 金色工作帽 */
    ctx.fillStyle = GOLD2;
    ctx.beginPath(); ctx.arc(cx, cy - 92, 34, Math.PI, 0); ctx.closePath(); ctx.fill();
    ctx.fillStyle = GOLD;
    rr(cx - 44, cy - 96, 88, 10, 5); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,.3)';
    ctx.fillRect(cx - 34, cy - 92, 68, 4);
    /* 头顶水滴呆毛 */
    ctx.fillStyle = '#7EC8F0';
    ctx.beginPath();
    ctx.moveTo(cx + 26, cy - 122);
    ctx.quadraticCurveTo(cx + 38, cy - 142, cx + 30, cy - 156);
    ctx.quadraticCurveTo(cx + 22, cy - 140, cx + 18, cy - 124);
    ctx.closePath(); ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#160608'; rr(BX + 22, 796, BW - 44, 84, 8); ctx.fill();
    ctx.strokeStyle = RED; ctx.lineWidth = 3; rr(BX + 22, 796, BW - 44, 84, 8); ctx.stroke();
    ctx.fillStyle = '#1E0508'; rr(BX + 40, 802, BW - 80, 20, 6); ctx.fill();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(255,255,255,.42)'; ctx.font = mono(20, '700');
    ctx.fillText('水天使小水 ▸ MIZUNO', BX + BW / 2, 840);
    ctx.fillStyle = 'rgba(255,255,255,.2)'; ctx.font = mono(15, '700');
    ctx.fillText('touch me ▸ 戳一下換台詞', BX + BW / 2, 864);
  }

  /* ---- 自动贩卖机（显示当前页前 8 件） ---- */
  function drawGoodShape(sp, col, cx, cy){
    ctx.fillStyle = col; ctx.strokeStyle = 'rgba(0,0,0,.45)'; ctx.lineWidth = 3;
    if (sp === 'cup'){
      rr(cx - 30, cy - 40, 60, 80, 6); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.5)'; rr(cx - 34, cy - 46, 68, 14, 4); ctx.fill();
    } else if (sp === 'btl'){
      rr(cx - 23, cy - 52, 46, 96, 11); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.fillRect(cx - 12, cy - 44, 24, 22);
      ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(cx - 23, cy - 4, 46, 10);
    } else if (sp === 'bar'){
      rr(cx - 36, cy - 30, 72, 60, 4); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = 'rgba(0,0,0,.4)'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(cx - 12, cy - 30); ctx.lineTo(cx - 12, cy + 30); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx + 8, cy - 30); ctx.lineTo(cx + 8, cy + 30); ctx.stroke();
    } else if (sp === 'tri'){
      ctx.beginPath(); ctx.moveTo(cx, cy - 48); ctx.lineTo(cx + 40, cy + 42); ctx.lineTo(cx - 40, cy + 42); ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(cx - 14, cy + 8, 28, 28);
    } else if (sp === 'boom'){
      ctx.strokeStyle = col; ctx.lineWidth = 8;
      ctx.beginPath(); ctx.moveTo(cx - 38, cy - 32); ctx.lineTo(cx + 38, cy + 4); ctx.lineTo(cx - 38, cy + 40); ctx.stroke();
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.arc(cx + 38, cy + 4, 7, 0, Math.PI * 2); ctx.fill();
    } else {
      rr(cx - 26, cy - 46, 52, 92, 9); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.fillRect(cx - 17, cy - 38, 34, 20);
      ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(cx - 26, cy - 4, 52, 11);
    }
  }
  function cartCount(it){
    var n = 0, i;
    for (i = 0; i < cart.length; i++){ if (cart[i] === it){ n++; } }
    return n;
  }
  function drawMachine(now){
    var mx = 40, my = 340, mw = 620, mh = 560;
    var p = (now % 1600) / 1600;
    var goods = machineGoods(), k;
    ctx.fillStyle = '#120406'; rr(mx, my, mw, mh, 10); ctx.fill();
    ctx.strokeStyle = RED; ctx.lineWidth = 6; rr(mx, my, mw, mh, 10); ctx.stroke();
    ctx.fillStyle = '#050505'; ctx.fillRect(mx + 12, my + 16, mw - 24, 44);
    ctx.fillStyle = (p < 0.5) ? YEL : '#5a4a00';
    ctx.fillRect(mx + 26, my + 30, 22, 16); ctx.fillRect(mx + mw - 48, my + 30, 22, 16);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff'; ctx.font = mono(23, '700');
    drawSpaced('NERV MART ▸ 営業中', mx + mw / 2, my + 38, 3, 'center');
    ctx.fillStyle = 'rgba(255,255,255,.78)'; ctx.font = mono(16, '700'); ctx.textAlign = 'left';
    ctx.fillText(catName() + ' ' + (page + 1) + '/' + pages(), mx + 56, my + 38);
    ctx.textAlign = 'right'; ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.font = mono(14, '700');
    ctx.fillText('全庫 ' + ITEMS.length + ' 種 ▸ 今日上架 ' + DAILY.length, mx + mw - 56, my + 38);
    ctx.strokeStyle = 'rgba(255,255,255,.1)'; ctx.lineWidth = 2;
    ctx.strokeRect(mx + 12, my + 70, mw - 24, mh - 82);
    for (k = 0; k < 8; k++){
      var g = goods[k];
      var c2 = k % 4, row = Math.floor(k / 4);
      var x = GX0 + c2 * (GW + GPX), y = GY0 + row * (GH + GPY);
      if (!g){
        ctx.fillStyle = '#040404'; ctx.fillRect(x, y, GW, GH);
        ctx.strokeStyle = 'rgba(255,255,255,.04)'; ctx.lineWidth = 2; ctx.strokeRect(x, y, GW, GH);
        continue;
      }
      var st2 = styleOf(g), sel = cartCount(g);
      ctx.fillStyle = '#050505'; ctx.fillRect(x, y, GW, GH);
      ctx.strokeStyle = '#3a3a3a'; ctx.lineWidth = 3; ctx.strokeRect(x, y, GW, GH);
      ctx.strokeStyle = 'rgba(255,255,255,.09)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x + 14, y + 132); ctx.lineTo(x + GW - 14, y + 132); ctx.stroke();
      /* 图标与货架统一 ▸ emoji + 分类色圆环 */
      ctx.globalAlpha = 0.5;
      ctx.strokeStyle = st2.cl; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(x + GW / 2, y + 62, 45, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = '50px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif';
      ctx.fillText(g.em, x + GW / 2, y + 64);
      ctx.fillStyle = '#ccc'; ctx.font = cn(19, '900');
      ctx.fillText(g.nm.length > 7 ? g.nm.slice(0, 6) + '…' : g.nm, x + GW / 2, y + 150);
      ctx.fillStyle = YEL; ctx.font = mono(19, '700');
      ctx.fillText('¥' + g.pr, x + GW / 2, y + 172);
      if (sel){
        ctx.strokeStyle = YEL; ctx.lineWidth = 5; ctx.strokeRect(x, y, GW, GH);
        ctx.fillStyle = YEL; ctx.font = mono(22, '700');
        ctx.fillText('×' + sel, x + GW / 2, y + 22);
      }
      if (isRare(g)){
        ctx.fillStyle = RED; ctx.font = mono(13, '700'); ctx.textAlign = 'right';
        ctx.fillText('限定', x + GW - 8, y + GH - 10);
        ctx.textAlign = 'center';
      }
    }
    var py = mh + my - 92;
    ctx.fillStyle = '#050505'; ctx.fillRect(mx + 20, py, mw - 40, 74);
    ctx.strokeStyle = RED; ctx.lineWidth = 3; ctx.strokeRect(mx + 20, py, mw - 40, 74);
    ctx.textAlign = 'left';
    ctx.fillStyle = GRN; ctx.font = mono(30, '700');
    ctx.fillText('CREDIT ▸ ¥' + total, mx + 36, py + 26);
    ctx.textAlign = 'right';
    ctx.fillStyle = (total >= 500 && p < 0.5) ? YEL : '#6E6E6E'; ctx.font = mono(19, '700');
    ctx.fillText('MAGI 伝動 ' + (total >= 500 ? 'READY ✓' : 'LOCK'), mx + mw - 36, py + 24);
    ctx.fillStyle = RED; rr(mx + 36, py + 42, 92, 24, 6); ctx.fill();
    ctx.fillStyle = '#0F0F0F'; ctx.font = mono(15, '700'); ctx.textAlign = 'center';
    ctx.fillText('投币口', mx + 82, py + 55);
    ctx.fillStyle = 'rgba(255,255,255,.28)'; ctx.font = mono(15, '700');
    ctx.fillText('PUSH ▸ 取物口', mx + mw / 2, py + 66);
  }
  function drawFooter(now){
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = GRN; ctx.font = mono(44, '700');
    ctx.fillText('CREDIT ▸ ¥' + total, W / 2 - 80, 948);
    ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.font = mono(24, '700');
    ctx.fillText(cart.length + ' ITEM' + (cart.length === 1 ? '' : 'S'), W / 2 + 210, 952);
    ctx.globalAlpha = cart.length ? (0.55 + 0.45 * Math.sin(now / 160)) : 1;
    ctx.fillStyle = cart.length ? GRN : 'rgba(255,255,255,.72)'; ctx.font = mono(26);
    ctx.fillText(cart.length ? '▸ 請至收銀台投幣' : '▸ 請選購商品', W / 2, 1000);
    ctx.globalAlpha = 1;
    ctx.fillStyle = RED; ctx.fillRect(0, 1030, W, 32);
    ctx.fillStyle = '#fff'; ctx.font = cn(24, '900');
    drawSpaced('A.T. FIELD 保持营业中', W / 2, 1046, 4, 'center');
  }
  function drawStore(now){
    var p = (now % 2600) / 2600, i;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#0A0303'; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(212,32,39,.15)'; ctx.lineWidth = 2;
    for (i = 0; i <= W; i += 60){ ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, H); ctx.stroke(); }
    for (i = 0; i <= H; i += 60){ ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(W, i); ctx.stroke(); }
    ctx.fillStyle = RED; ctx.fillRect(0, 0, W, 18); ctx.fillRect(0, H - 18, W, 18);
    ctx.fillStyle = RED; ctx.font = cn(58, '900');
    ctx.fillText('NERV 売店', W / 2, 60);
    ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.font = mono(22);
    drawSpaced('SUPPLY STORE ▸ LEVEL B1 ▸ 今日上架 ' + DAILY.length + ' 種', W / 2, 104, 3, 'center');
    drawBubble(now);
    drawMachine(now);
    drawBoss(now);
    drawFooter(now);
    finish(W, H, p, 0);
  }

  /* ---- 卡纸 ---- */
  function drawJam(now){
    cv.width = 1080; cv.height = 760;
    ctx.fillStyle = C.darkred; ctx.fillRect(0, 0, 1080, 760);
    drawStripes(0, 0, 1080, 44, (now % 1000) / 1000);
    drawStripes(0, 716, 1080, 44, (now % 1000) / 1000);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff'; ctx.font = cn(74, '900');
    ctx.fillText('⚠ PAPER JAM', 540, 320);
    ctx.fillStyle = '#ff9b8a'; ctx.font = mono(28, '700');
    ctx.fillText('打印纸卡住了 ▸ 已呼叫技师', 540, 424);
    ctx.fillText('鈴原東治（维修中…）', 540, 470);
    ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.font = mono(21, '700');
    ctx.fillText('▸ 右側 Red Panel の RETRY を押せ', 540, 540);
  }

  /* ---- 长小票（隐藏设定） ---- */
  function drawReceipt(){
    if (!receipt){ return; }
    var R = receipt, PW = 680, x = (W - PW) / 2, y = 60, LH = 46, i;
    function cText(t, size, monoF, bold, col){
      ctx.fillStyle = col || '#111';
      ctx.font = monoF ? mono(size, bold ? '700' : '400') : cn(size, bold ? '900' : '700');
      ctx.textAlign = 'center';
      ctx.fillText(t, x + PW / 2, y);
      y += LH;
    }
    function cTextL(t, size, bold, col){
      ctx.fillStyle = col || '#111';
      ctx.font = cn(size, bold ? '900' : '700');
      ctx.textAlign = 'left';
      ctx.fillText(t, x + 36, y);
      y += LH;
    }
    function line(){
      ctx.fillStyle = '#999'; ctx.fillRect(x + 30, y, PW - 60, 2);
      y += LH * 0.7;
    }
    var TH = 1252 + R.rows * 46 + (R.lottery ? 138 : 0) + (R.exp ? 230 : 0);
    cv.width = W; cv.height = Math.max(1200, TH);
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#141414'; ctx.fillRect(0, 0, W, cv.height);
    var grad = ctx.createLinearGradient(x, 0, x + PW, 0);
    grad.addColorStop(0, '#E8E8E2'); grad.addColorStop(0.5, '#F5F5F0'); grad.addColorStop(1, '#E8E8E2');
    ctx.fillStyle = grad; ctx.fillRect(x, 20, PW, cv.height - 40);
    ctx.fillStyle = 'rgba(0,0,0,0.06)';
    for (i = 20; i < cv.height - 20; i += 5){ ctx.fillRect(x, i, PW, 1); }
    y = 92;
    cText('NERV MART', 46, true, true, '#111');
    cText('士官小卖部 ▸ 第3新東京市 1号店', 26, false, false, '#333');
    cText("GOD'S IN HIS HEAVEN.", 18, true, false, '#666');
    cText("ALL'S RIGHT WITH THE WORLD.", 18, true, false, '#666');
    line();
    R.items.forEach(function(it){
      ctx.fillStyle = '#111'; ctx.font = cn(26, '700');
      ctx.textAlign = 'left'; ctx.fillText(it.name, x + 36, y);
      ctx.textAlign = 'right'; ctx.fillText('×' + it.qty, x + PW - 200, y);
      ctx.font = mono(26, '700'); ctx.fillText('¥' + (it.price * it.qty), x + PW - 36, y);
      y += LH;
    });
    if (R.tail){ cTextL('ほか ' + R.tail + ' 件 ▸ 省略', 18, false, '#888'); }
    line();
    ctx.textAlign = 'left'; ctx.fillStyle = '#111'; ctx.font = cn(30, '900');
    ctx.fillText('合　計', x + 36, y);
    ctx.textAlign = 'right'; ctx.font = mono(34, '700');
    ctx.fillText('¥' + R.total, x + PW - 36, y);
    y += LH;
    ctx.textAlign = 'left'; ctx.fillStyle = '#666'; ctx.font = cn(18, '700');
    ctx.fillText('（内 税込）', x + 36, y);
    y += LH;
    cText('MAGI 表决 ' + R.vote + ' …… 通过', 26, false, true, RED);
    cText('レシート発行 ▸ PER VEND No.001', 18, true, false, '#666');
    line();
    if (R.lottery){
      cText('▼ MAGI 伝動抽選槽 ▼', 26, false, true, RED);
      cText(R.lottery.star ? R.lottery.name : '中奖：' + R.lottery.name, 24, false, true, R.lottery.star ? RED : '#111');
      cText('（奖品已投入取物口）', 18, false, false, '#666');
      line();
    } else {
      cText('（満 ¥500 で抽選権利）', 20, false, false, '#888');
      line();
    }
    cText('— 本店失物招领公告 —', 24, false, true, '#111');
    R.losts.forEach(function(l){ cTextL(l, 18, false, '#333'); });
    line();
    if (R.exp){
      cText('▸ 本周异常报告', 26, false, true, RED);
      cTextL(R.exp.id + ' ▸ ' + R.exp.t, 20, true, RED);
      cTextL('事故：' + R.exp.d, 18, false, '#333');
      cTextL('状态：' + R.exp.s, 18, false, '#333');
      cTextL('责任：' + R.exp.r, 18, false, '#333');
      line();
    }
    var bcSeed = R.code, s2 = 0;
    for (i = 0; i < bcSeed.length; i++){ s2 = (s2 * 31 + bcSeed.charCodeAt(i)) >>> 0; }
    var bx2 = x + 90;
    while (bx2 < x + PW - 90){
      var bw2 = 3 + (s2 % 4); s2 = (s2 * 1664525 + 1013904223) >>> 0;
      if (s2 % 100 > 32){ ctx.fillStyle = '#111'; ctx.fillRect(bx2, y, bw2, 90); }
      bx2 += bw2 + 3 + (s2 % 4);
    }
    y += 120;
    cText(R.code + ' ▸ ' + R.time + ' ▸ ' + R.date, 18, true, false, '#666');
    line();
    cText(R.thanks, 24, false, true, '#111');
    y += 20;
    cText('PER VEND · 收款机 No.001 · 技术支持：赤木律子', 16, true, false, '#666');
    cText('担当：水天使小水 ▸ NERV 厚生部 · 全庫 ' + ITEMS.length + ' 種', 16, true, false, '#666');
    ctx.fillStyle = '#141414';
    for (i = 0; i < PW; i += 34){
      ctx.beginPath();
      ctx.moveTo(x + i, 20); ctx.lineTo(x + i + 17, 40); ctx.lineTo(x + i + 34, 20);
      ctx.closePath(); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x + i, cv.height - 20); ctx.lineTo(x + i + 17, cv.height - 40); ctx.lineTo(x + i + 34, cv.height - 20);
      ctx.closePath(); ctx.fill();
    }
  }

  function ticket(){
    var h = '<h4>NERV 売店 ▸ 領収書</h4>';
    receipt.items.forEach(function(it){
      var nm = it.name;
      h += nm + ' ×' + it.qty + ' ' + new Array(Math.max(6, 16 - nm.length * 2)).join('.') +
           ' ¥' + (it.price * it.qty) + '<br>';
    });
    if (receipt.tail){ h += 'ほか ' + receipt.tail + ' 件<br>'; }
    h += '<div class="cut">合計 ¥' + receipt.total + '<br>MAGI 表決 ▸ ' + receipt.vote + '<br>';
    if (receipt.lottery){ h += '抽選 ▸ ' + receipt.lottery.name + '<br>'; }
    h += '取引番号 ▸ TR-' + receipt.code + '<br>時刻 ▸ ' + receipt.time + '<br>';
    receipt.losts.forEach(function(l){ h += '<span style="color:#777">' + l + '</span><br>'; });
    if (receipt.exp){ h += '<span style="color:#a33">▸ ' + receipt.exp.id + ' ' + receipt.exp.t + '</span><br>'; }
    h += 'Keep out of reach of Angels.</div><div class="rc-foot">第 3 新東京市 · NERV 厚生部</div>';
    el.rcpt.innerHTML = h;
    el.rcpt.classList.add('on');
  }
  function makeReceipt(sum, snapshot){
    var counts = {}, order = [], lines = [], k, nm, rows = 0, tail = 0;
    for (k = 0; k < snapshot.length; k++){ counts[snapshot[k].nm] = (counts[snapshot[k].nm] || 0) + 1; }
    for (nm in counts){
      if (counts.hasOwnProperty(nm)){ order.push({ name: nm, qty: counts[nm], price: itemByNm(nm).pr }); }
    }
    for (k = 0; k < order.length; k++){
      if (rows < 26){ lines.push(order[k]); rows++; }
      else { tail += order[k].qty; }
    }
    var T = timeStrings();
    receipt = {
      items: lines, rows: rows, tail: tail, total: sum, vote: flash,
      lottery: (sum >= 500) ? pickW(PRIZES) : null,
      losts: pickN(LOST, 3),
      exp: (Math.random() < 0.2) ? pickN(EXP, 1)[0] : null,
      thanks: pickN(THANKS, 1)[0],
      code: 'NM-' + rand(10000, 99999),
      time: T.cd, date: T.date
    };
  }
  /* ---- 扭蛋机：満 ¥500 抽奖时, 先滚 3 圈再出货 ---- */
  var GACHA_T = 4100;
  var gacha = { t0: 0, f: {}, prize: null };
  function startGacha(){
    gacha.t0 = Date.now(); gacha.f = {};
    gacha.prize = receipt ? receipt.lottery : null;
    view = 'GACHA';
    jumpCanvas();
    if (el.rcpt){ el.rcpt.classList.remove('on'); }
    el.png.disabled = true;
  }
  function afterGacha(){
    gacha.f = {};
    if (Math.random() < 0.10){
      view = 'JAM';
      el.jam.classList.add('on');
      el.png.disabled = true;
      if (el.rcpt){ el.rcpt.classList.remove('on'); }
      setLine('jam'); SFX.deny();
      if (el.jam.scrollIntoView){
        setTimeout(function(){ try{ el.jam.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }catch(err){ el.jam.scrollIntoView(); } }, 120);
      }
      toast('⚠ PAPER JAM ▸ 收银机卡纸');
    } else {
      showReceipt();
    }
  }
  function gFired(k){
    if (gacha.f[k]){ return false; }
    gacha.f[k] = true; return true;
  }
  function gEgg(x, y, r, col, rot){
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot || 0);
    ctx.beginPath(); ctx.ellipse(0, 0, r * 0.86, r, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#F2F2EA'; ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,.4)'; ctx.lineWidth = 2.5; ctx.stroke();
    ctx.save();
    ctx.beginPath(); ctx.ellipse(0, 0, r * 0.86, r, 0, 0, Math.PI * 2); ctx.clip();
    ctx.fillStyle = col; ctx.fillRect(-r, -r, r * 2, r * 0.55);
    ctx.strokeStyle = 'rgba(0,0,0,.28)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-r * 0.86, -r + r * 0.55); ctx.lineTo(r * 0.86, -r + r * 0.55); ctx.stroke();
    ctx.restore();
    ctx.fillStyle = 'rgba(255,255,255,.5)';
    ctx.beginPath(); ctx.ellipse(-r * 0.3, -r * 0.4, r * 0.16, r * 0.26, -0.5, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  function drawGacha(now){
    var t = now - gacha.t0, i;
    cv.width = W; cv.height = H;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#0A0303'; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(212,32,39,.15)'; ctx.lineWidth = 2;
    for (i = 0; i <= W; i += 60){ ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, H); ctx.stroke(); }
    for (i = 0; i <= H; i += 60){ ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(W, i); ctx.stroke(); }
    ctx.fillStyle = RED; ctx.fillRect(0, 0, W, 18); ctx.fillRect(0, H - 18, W, 18);
    ctx.fillStyle = RED; ctx.font = cn(52, '900');
    ctx.fillText('MAGI 伝動 ▸ 抽選槽', W / 2, 64);
    ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.font = mono(20, '700');
    drawSpaced('GACHA ▸ 満 ¥500 ▸ 一回限り', W / 2, 108, 3, 'center');
    var cx = 540, baseY = 648, R = 200;
    var shaking = t > 600 && t < 2150;
    var shake = shaking ? Math.sin(t / 24) * 5 : 0;
    ctx.save(); ctx.translate(shake, 0);
    /* 玻璃罩 */
    ctx.beginPath();
    ctx.moveTo(cx - R, baseY);
    ctx.arc(cx, baseY, R, Math.PI, 0);
    ctx.closePath();
    ctx.fillStyle = 'rgba(140,190,230,.10)'; ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 5; ctx.stroke();
    /* 罩内彩蛋堆 */
    var EC = ['#D42027', '#5A8CF0', '#F5C400', '#33CC66', '#C77DFF', '#F5F5F0'];
    var sd = 7;
    function gr(){ sd = (sd * 1664525 + 1013904223) >>> 0; return sd / 4294967296; }
    var nEgg = t < 2150 ? 12 : 10;
    for (i = 0; i < nEgg; i++){
      var ex = cx + (gr() * 2 - 1) * 120, ey = baseY - 24 - gr() * 130;
      var jit = shaking ? -Math.abs(Math.sin(t / 55 + i * 1.7)) * 16 : Math.sin(now / 900 + i) * 2;
      gEgg(ex, ey + jit, 30 + gr() * 12, EC[i % EC.length], (gr() - 0.5) * 0.8);
      sd = (sd * 1664525 + 1013904223) >>> 0;
    }
    /* 主角蛋: 开盖后抛物线跳进取物口（绘制在机座之后, 避免被遮挡） */
    var pcol = (gacha.prize && gacha.prize.w <= 3) ? '#D42027' : '#F5C400';
    var px, py, k;
    if (t < 2150){
      gEgg(cx, baseY - 150 + (shaking ? Math.sin(t / 40) * 10 : 0), 46, pcol, Math.sin(t / 500) * 0.3);
    } else if (t < 2650){
      k = (t - 2150) / 500;
      px = cx + k * 30; py = baseY - 150 - Math.sin(k * Math.PI) * 190 + k * 200;
      gEgg(px, py, 46, pcol, k * 6);
    }
    /* 机座 */
    ctx.fillStyle = RED; rr(cx - 236, baseY, 472, 118, 12); ctx.fill();
    ctx.strokeStyle = '#F5C400'; ctx.lineWidth = 4; rr(cx - 236, baseY, 472, 118, 12); ctx.stroke();
    ctx.fillStyle = '#050505'; rr(cx - 120, baseY + 20, 240, 76, 8); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.lineWidth = 2; rr(cx - 120, baseY + 20, 240, 76, 8); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.font = mono(15, '700');
    ctx.fillText('PUSH ▸ 取物口', cx, baseY + 84);
    /* 主角蛋停在取物口（t > 2650） */
    if (t > 2650){
      gEgg(cx, baseY + 52, 46, pcol, 0);
      ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.font = mono(17, '700');
      ctx.fillText('GET ▸ ' + (gacha.prize ? gacha.prize.name.slice(0, 12) : ''), cx, baseY + 132);
    }
    /* 旋钮手柄 */
    var ang = (t > 600 && t < 2150) ? (t - 600) / 46 : 0;
    ctx.save(); ctx.translate(cx + 268, baseY - 40); ctx.rotate(ang);
    ctx.fillStyle = '#F5C400'; ctx.beginPath(); ctx.arc(0, 0, 26, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,.5)'; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = '#050505'; rr(-5, -34, 10, 40, 5); ctx.fill();
    ctx.restore();
    ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.font = mono(14, '700');
    ctx.fillText('KNOB ▸ 回転', cx + 268, baseY + 2);
    /* 状态字 */
    if (shaking && Math.floor(t / 300) % 2 === 0){
      ctx.fillStyle = YEL; ctx.font = mono(30, '700');
      ctx.fillText('ROLLING…', cx, baseY - R - 60);
    }
    ctx.restore();
    /* 恭喜中奖 */
    if (t > 2650){
      var star = gacha.prize && gacha.prize.w <= 3;
      var i2, cN = 46;
      for (i2 = 0; i2 < cN; i2++){
        var fx = ((i2 * 197) % W), fy = ((i2 * 131 + t * (0.14 + (i2 % 5) * 0.05)) % (H + 80)) - 40;
        ctx.save(); ctx.translate(fx, fy); ctx.rotate((i2 + t / 400) % Math.PI);
        ctx.fillStyle = EC[i2 % EC.length];
        ctx.fillRect(-9, -4, 18, 8);
        ctx.restore();
      }
      var pulse = 1 + Math.sin(t / 130) * 0.03;
      ctx.save(); ctx.translate(W / 2, 288); ctx.scale(pulse, pulse);
      ctx.fillStyle = star ? '#F5C400' : '#fff'; ctx.font = cn(74, '900');
      ctx.fillText(star ? '★ SSR 当選 ★' : '恭喜中奖', 0, 0);
      ctx.restore();
      ctx.fillStyle = '#fff'; ctx.font = cn(34, '900');
      ctx.fillText(gacha.prize ? gacha.prize.name : '', W / 2, 378);
      ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.font = mono(20, '700');
      ctx.fillText('奖品已投入取物口 ▸ 小票打印中…', W / 2, 428);
    }
    /* 音效时间轴 */
    if (t > 40 && gFired('coin')){ SFX.click(); }
    if (t > 600 && gFired('knob')){ SFX.beep(); }
    if (t > 980 && gFired('r1')){ SFX.stamp(true); }
    if (t > 1360 && gFired('r2')){ SFX.stamp(true); }
    if (t > 1740 && gFired('r3')){ SFX.stamp(true); }
    if (t > 2100 && gFired('r4')){ SFX.stamp(false); }
    if (t > 2150 && gFired('open')){ SFX.beep(); SFX.stamp(true); }
    if (t > 2650 && gFired('win')){
      SFX.grant(); SFX.scan();
      if (gacha.prize && gacha.prize.w <= 3){ setTimeout(function(){ SFX.grant(); SFX.stamp(true); }, 260); }
    }
  }
  function showReceipt(){
    view = 'RECEIPT'; rcDirty = true;
    el.jam.classList.remove('on');
    ticket();
    el.png.disabled = false;
    SFX.print();
    if (el.rcpt && el.rcpt.scrollIntoView){
      setTimeout(function(){ try{ el.rcpt.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }catch(err){ el.rcpt.scrollIntoView(); } }, 120);
    }
    if (receipt.lottery && receipt.lottery.w <= 3){ setLine('ssr'); toast('★★ 稀有奖品命中 ▸ 悄声拿走'); }
    else if (receipt.lottery){ setLine('win'); toast('★ 抽奖命中 ▸ 奖品已投入取物口'); }
    toast('✓ 购买成功 ▸ 小票已打印');
  }

  function bind(){
    var h = '', i;
    for (i = 0; i < CATS.length; i++){
      h += '<button class="chip" data-c="' + CATS[i].id + '">' + CATS[i].nm + '</button>';
    }
    el.chips.innerHTML = h;
    el.chips.querySelectorAll('.chip').forEach(function(c){
      c.addEventListener('click', function(){
        el.chips.querySelectorAll('.chip').forEach(function(z){ z.classList.remove('active'); });
        c.classList.add('active');
        cat = c.getAttribute('data-c'); page = 0;
        SFX.click(); renderShelf();
      });
    });
    el.prev.addEventListener('click', function(){ if (page > 0){ page--; SFX.click(); renderShelf(); } });
    el.next.addEventListener('click', function(){ if (page < pages() - 1){ page++; SFX.click(); renderShelf(); } });
    if (el.fold){
      el.fold.addEventListener('click', function(){
        var open = !el.body.classList.contains('on');
        setFold(open); SFX.click();
        if (open){ renderShelf(); refresh(); }
      });
    }
    el.clr.addEventListener('click', function(){
      if (view === 'GACHA'){ return; }
      cart = []; total = 0; flash = '';
      backToShop(); SFX.beep(); setLine('idle');
      refresh(); toast('已清空购物篮');
    });
    el.retry.addEventListener('click', function(){
      if (view !== 'JAM'){ return; }
      SFX.beep(); setLine('retry'); showReceipt();
    });
    el.png.addEventListener('click', function(){
      var b = this;
      if (busy || view !== 'RECEIPT' || !receipt){ return; }
      busy = true; b.disabled = true; b.textContent = '生成中…';
      drawReceipt();
      setTimeout(function(){
        cv.toBlob(function(blob){
          if (blob){ downloadBlob(blob, fileName('NERV小票', 'png')); toast('小票已保存 ▸ PNG'); }
          else { toast('生成失败，请重试'); }
          busy = false; b.disabled = false; b.textContent = '保存小票 ▸ PNG';
        }, 'image/png');
      }, 60);
    });
    el.pay.addEventListener('click', function(){
      if (!cart.length){ SFX.deny(); setLine('empty'); toast('EMPTY ▸ 请先选购商品'); return; }
      if (el.pay.disabled || busy){ return; }
      var snapshot = cart.slice(), sum = total;
      el.pay.disabled = true;
      jumpCanvas();
      magiVote.run('PURCHASE', 'CODE:258<br>FILE:STORE.SYS<br>金額: ¥' + sum + '<br>件数: ' + snapshot.length, function(pass, v){
        el.pay.disabled = false;
        var okN = v.filter(function(z){ return z === 'ok'; }).length;
        flash = okN + ':' + (3 - okN) + (pass ? ' ▸ 通過' : ' ▸ 否決');
        if (!pass){
          flash = ''; SFX.deny(); setLine('deny');
          toast('✕ MAGI 否决 ▸ 款项已退回');
          return;
        }
        SFX.grant(); setLine('pass');
        cart = snapshot; total = sum;
        makeReceipt(sum, snapshot);
        cart = []; total = 0;
        setTimeout(refresh, 30);
        if (receipt.lottery){ startGacha(); }
        else { afterGacha(); }
      });
    });
  }
  cv.addEventListener('click', function(e){
    if (currentApp !== martApp || view !== 'SHOP' || busy){ return; }
    var r = cv.getBoundingClientRect();
    var x = (e.clientX - r.left) / r.width * W;
    var y = (e.clientY - r.top) / r.height * H;
    var goods = machineGoods(), i, hit = false;
    for (i = 0; i < 8; i++){
      if (!goods[i]){ continue; }
      var col = i % 4, row = Math.floor(i / 4);
      var gx = GX0 + col * (GW + GPX), gy = GY0 + row * (GH + GPY);
      if (x >= gx - 10 && x <= gx + GW + 10 && y >= gy - 10 && y <= gy + GH + 10){
        addItem(goods[i]); hit = true;
      }
    }
    if (!hit && x >= BX && x <= BX + BW && y >= BY && y <= BY + BH){
      setLine('idle'); SFX.beep();
    }
  });

  return {
    activate: function(){
      cv.width = W; cv.height = H;
      cart = []; total = 0; flash = ''; receipt = null; rcDirty = false;
      view = 'SHOP'; cat = 'all'; page = 0;
      if (el.png){ el.png.disabled = true; el.png.textContent = '保存小票 ▸ PNG'; }
      bind();
      el.chips.querySelectorAll('.chip').forEach(function(z, k){ z.classList.toggle('active', k === 0); });
      setLine('idle');
      renderShelf(); backToShop();
    },
    tick: function(now){
      if (busy){ return; }
      if (view === 'SHOP'){
        cv.width = W; cv.height = H;
        if (now > bubble.nextAt && bubble.kind !== 'jam' && bubble.kind !== 'deny'){ setLine('idle'); }
        drawStore(now);
      } else if (view === 'RECEIPT'){
        if (rcDirty){ drawReceipt(); rcDirty = false; }
      } else if (view === 'GACHA'){
        cv.width = W; cv.height = H;
        drawGacha(now);
        if (now - gacha.t0 > GACHA_T){ afterGacha(); }
      } else {
        drawJam(now);
      }
    }
  };
})();
'''

NEW_JS = NEW_JS.replace('__ITEMS__', items_txt.rstrip() + '\n')
if NEW_JS.count('__ITEMS__'):
    raise SystemExit('items placeholder not substituted')

# ---------- APP-01 / APP-02 MAGI 表决 ▸ 三六边形样式（图片2） ----------
def must(old, new):
    global s
    n = s.count(old)
    assert n == 1, 'anchor hit %d times: %r' % (n, old[:70])
    s = s.replace(old, new)

# ---- CSS ▸ 货架两层折叠 + 分类条两行 ----
must("#martJam .jt{color:#D42027;font-weight:700;font-size:14px;letter-spacing:.15em}",
"""#martJam .jt{color:#D42027;font-weight:700;font-size:14px;letter-spacing:.15em}
.foldbar{display:flex;align-items:center;gap:8px;width:100%;margin-top:10px;padding:10px 12px;background:#000;border:2px solid #444;border-radius:6px;font-size:13px;font-weight:700;color:#F5C400;cursor:pointer;letter-spacing:.1em;text-align:left;font-family:inherit;transition:border-color .15s}
.foldbar:hover{border-color:#D42027}
.foldbar .fi{margin-left:auto;color:#ddd;font-family:'Courier New',monospace;font-size:12px;font-weight:400}
#martBody{display:none}
#martBody.on{display:block}
.chips{flex-wrap:wrap;overflow-x:visible}
.chip{white-space:nowrap}
.chips{display:grid !important;grid-template-columns:repeat(5,1fr);gap:7px}
.chip{display:flex;align-items:center;justify-content:center;height:34px;padding:0 2px;font-size:12px;border-radius:17px}""")

# ---- 安卓/手机端适配 ▸ 整体响应式 ----
must("</style>", """
/* ============ 機密記事：11 個分頁橫滑 + 內文滾動 ============ */
/* !important 是必需的：全局 .chips 有 .chips{display:grid !important}，常規宣告壓不住 */
#nbTabs{display:flex !important;flex-wrap:nowrap;gap:6px;overflow-x:auto;overflow-y:hidden;
  scrollbar-width:none;padding:0 0 7px;margin-top:10px;-webkit-overflow-scrolling:touch;
  -webkit-mask-image:linear-gradient(90deg,#000 0,#000 calc(100% - 20px),transparent 100%);
  mask-image:linear-gradient(90deg,#000 0,#000 calc(100% - 20px),transparent 100%)}
#nbTabs::-webkit-scrollbar{display:none;height:0}
#nbTabs .chip{flex:0 0 auto;white-space:nowrap;padding:0 15px;height:34px;line-height:32px;
  font-size:12px;letter-spacing:.08em}
#nbBody{max-height:54vh;overflow-y:auto;overscroll-behavior:contain;
  scrollbar-width:thin;scrollbar-color:rgba(var(--ac-rgb),.5) transparent}
#nbBody::-webkit-scrollbar{width:3px}
#nbBody::-webkit-scrollbar-thumb{background:rgba(var(--ac-rgb),.5)}
.nbRow{padding:7px 0}
.nbRow b{font-size:11px;letter-spacing:.1em;margin-bottom:3px}
.nbRow.mask{color:#6E6E6E}

/* ============ 图标网格兜底（APP 数量非 3 的倍数时） ============ */
/* 最后一行只剩一个图标（第 3n+1 个且是最后一个）→ 居中放第 2 列，不左挂 */
#iconGrid > .aicon:last-child:nth-child(3n+1){grid-column:2}
/* 参数板 chips 是 5 列网格：只剩一个时居中到第 3 列（如 6 个相纸规格） */
.chips > .chip:last-child:nth-child(5n+1){grid-column:3}
/* 点按反馈：按钮按下提亮，chip / 折叠条再缩一下 */
button:active,a:active{filter:brightness(1.22)}
.chip:active,.foldbar:active,.item:active{transform:scale(.95)}
button,.chip,.foldbar{transition:transform .08s ease, filter .08s ease}

/* ============ 手机端适配（≤600px 竖屏） ============ */
@media (max-width:600px){
  /* 用 clip 而非 hidden：hidden 会让 body 变成滚动容器，position:sticky 直接失效（APP-11 预览台吸顶依赖它） */
  html,body{overflow-x:clip;-webkit-text-size-adjust:100%;touch-action:manipulation}
  body{font-size:14px;line-height:1.45}
  #iconGrid{grid-template-columns:repeat(3,1fr);gap:10px;padding:13% 12px 38px}
  .aicon{padding:14px 2px 10px;border-radius:16px}
  .aicon .gl{font-size:24px}
  .aicon .lb{font-size:11px}
  .aicon .no2{font-size:8px;letter-spacing:.12em}
  #appview{padding:0 8px 18px}
  .preview{max-width:100%;margin:10px auto 0;padding:6px}
  .panel{padding:0 2px}
  .fl{font-size:14px;letter-spacing:.1em}
  .btnrow{gap:8px;margin-top:12px}
  .mainbtn{height:50px;font-size:14px;border-radius:8px}
  .ghostbtn{height:50px}
  .irow{margin-top:6px}
  input.txt,input.loc{font-size:14px;padding:11px;border-radius:6px}
  .shelf{grid-template-columns:repeat(3,1fr);gap:7px;margin-top:10px}
  .item{padding:8px 3px 6px;border-radius:7px}
  .item .em{font-size:22px}
  .item .nm{font-size:11px;letter-spacing:.04em}
  .item .pr{font-size:10px}
  .chips{grid-template-columns:repeat(5,1fr);gap:6px}
  .chip{height:30px;font-size:11px;border-radius:15px}
  .cartbar{font-size:11px;padding:8px 10px}
  .cartbar b{font-size:14px}
  .foldbar{font-size:12px;padding:10px 12px;border-radius:7px}
  .avhint{font-size:11px;line-height:1.7;margin-top:10px}
  .mapLegend{font-size:9px;gap:8px}
  #mapMsg{font-size:11px;line-height:1.7;min-height:48px}
  .nbLog{font-size:10px;height:74px}
  #nbBody{font-size:11px;padding:10px}
  .nbSec{font-size:11px}
  .dt-jp{font-size:22px;left:30%;right:4%;top:40%}
  .dt-bottom{font-size:16px}
  #bootCv{width:100%;max-width:340px}
  .nbAuth{padding:8px}
  #martLot{font-size:10px}
  #homeBtn{height:46px;font-size:13px}
  .mapLegend{margin-top:6px}
}
@media (max-width:380px){
  #iconGrid{padding:9% 8px 34px;gap:8px}
  .aicon .gl{font-size:22px}
  .shelf{gap:6px}
  .chips{gap:5px}
  .chip{height:28px;font-size:10px}
}
</style>""")

# ---------- APP 扩展注册表（v2.4 接口） ----------
# 第三方 APP 一律放进 ext_apps/ 目录（.js 文件，按文件名排序注入）。
# 新增 APP 只需丢一个 .js 进来，不用改本脚本。
import os, glob
EXT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'ext_apps')
_ext_files = sorted(glob.glob(os.path.join(EXT_DIR, '*.js')))
_ext_chunks = []
for _fp in _ext_files:
    with io.open(_fp, encoding='utf-8') as _fh:
        _src = _fh.read()
    _name = os.path.basename(_fp)
    assert '"""' not in _src, '扩展 APP 源码不能包含三引号: ' + _name
    _ext_chunks.append('/* ==== 外部 APP 文件: %s ==== */\n%s' % (_name, _src))
    print('[ext] 载入 %s (%.1f KB)' % (_name, len(_src) / 1024.0))
EXT_APPS = '\n'.join(_ext_chunks) if _ext_chunks else '/* （无外部 APP） */'

# 注册表定义 + 内置 9 个 APP 登记 + 接入点，注入到 function loop(){ 之前
APP_REGISTRY = r"""
/* ===== EVA APP 扩展注册表（v2.4 接口） ===== */
var APPS = APPS || {};
function registerApp(meta, appObj){
  var id = meta.id;
  if (!document.getElementById('panel-' + id) && meta.panel){
    var pd = document.createElement('div');
    pd.className = 'panel'; pd.id = 'panel-' + id; pd.innerHTML = meta.panel;
    document.getElementById('appview').appendChild(pd);
  }
  if (!document.querySelector('#iconGrid .aicon[data-app="' + id + '"]')){
    var b = document.createElement('button');
    b.className = 'aicon'; b.setAttribute('data-app', id);
    b.style.borderColor = meta.color || '#888';
    b.innerHTML = '<span class="gl" style="color:' + (meta.color || '#888') + '">' + (meta.glyph || '★') + '</span>'
                + '<span class="no2">' + (meta.no || '') + '</span>'
                + '<span class="lb">' + (meta.label || id) + '</span>';
    document.getElementById('iconGrid').appendChild(b);
    b.addEventListener('click', function(){ openApp(id); });
  }
  appObj = appObj || {};
  appObj.id = id; appObj.meta = meta;
  APPS[id] = appObj;
  return appObj;
}
window.EVA = window.EVA || {
  registerApp: registerApp, APPS: APPS, C: C, SFX: SFX, cv: cv, ctx: ctx,
  helpers: { rr: rr, cn: cn, mono: mono, ser: ser, sans: sans,
    drawSpaced: drawSpaced, measureSpaced: measureSpaced, fitLines: fitLines,
    toast: toast, downloadBlob: downloadBlob, fileName: fileName, val: val,
    rand: rand, pick: pick, pad: pad, drawCorners: drawCorners, drawEmblem: drawEmblem,
    showSavePreview: showSavePreview, downloadBlob: downloadBlob }
};
window.EVA.showSavePreview = showSavePreview;
/* 登记内置 9 个 APP（图标/参数板已在 HTML 中，registerApp 会自动跳过创建） */
registerApp({ id:'alert', glyph:'警', no:'APP-01', label:'使徒警报', color:'#33FF66' }, alertApp);
registerApp({ id:'magi', glyph:'賢', no:'APP-02', label:'MAGI占卜', color:'#5A8CF0' }, magiApp);
registerApp({ id:'title', glyph:'題', no:'APP-03', label:'标题字卡', color:'#888' }, titleApp);
registerApp({ id:'license', glyph:'証', no:'APP-04', label:'ID CARD', color:'#D42027' }, licenseApp);
registerApp({ id:'atfield', glyph:'場', no:'APP-05', label:'AT力场', color:'#FF6A2B' }, atfieldApp);
registerApp({ id:'emergency', glyph:'襲', no:'APP-06', label:'袭来倒计时', color:'#5A8CF0' }, emergencyApp);
registerApp({ id:'mart', glyph:'売', no:'APP-07', label:'小卖部', color:'#F5C400' }, martApp);
registerApp({ id:'map', glyph:'圖', no:'APP-08', label:'都市地图', color:'#B3261E', v2:true }, mapApp);
registerApp({ id:'notebook', glyph:'書', no:'APP-09', label:'机密记事', color:'#D42027', v2:true }, notebookApp);
""" + EXT_APPS + r"""
/* ==== 在此之上追加新 APP 的 registerApp({...}, {...}) 调用（EXT_APPS 变量） ==== */"""

must("function loop(){", APP_REGISTRY + "\nfunction loop(){")

# openApp 改用注册表分派（替换手写三元 + body.v2 硬编码）
must("""  currentApp = (id === 'alert') ? alertApp :
               (id === 'magi') ? magiApp :
               (id === 'license') ? licenseApp :
               (id === 'atfield') ? atfieldApp :
               (id === 'emergency') ? emergencyApp :
               (id === 'mart') ? martApp :
               (id === 'map') ? mapApp :
               (id === 'notebook') ? notebookApp : titleApp;""",
"""  currentApp = APPS[id] || APPS['title'] || titleApp;""")
must("  document.body.classList.toggle('v2', id === 'map' || id === 'notebook');",
"""  document.body.classList.toggle('v2', !!(APPS[id] && APPS[id].meta && APPS[id].meta.v2));""")

# ---- APP-03 标题字卡：两行时收字号 + 拉开行距 + 整块下移（原实现两行仍吃满 130px 上限，
#      行距只有 1.25，两行几乎贴在一起，上沿还压到 560 的分隔线）----
must("""    var fit = fitLines(t, 760, 130, 72, t.length > 5);
    ctx.fillStyle = C.white; ctx.font = cn(fit.size);
    var lh = fit.size * 1.25;
    if (fit.lines.length === 1){ ctx.fillText(fit.lines[0], W / 2, 700); }
    else { ctx.fillText(fit.lines[0], W / 2, 700 - lh / 2); ctx.fillText(fit.lines[1], W / 2, 700 + lh / 2); }""",
"""    var two = t.length > 5;
    var fit = fitLines(t, 760, two ? 104 : 130, two ? 60 : 72, two);
    ctx.fillStyle = C.white; ctx.font = cn(fit.size);
    var isTwo = fit.lines.length === 2;
    var lh = fit.size * (isTwo ? 1.46 : 1.25);
    var by = isTwo ? 728 : 700;
    if (!isTwo){ ctx.fillText(fit.lines[0], W / 2, by); }
    else { ctx.fillText(fit.lines[0], W / 2, by - lh / 2); ctx.fillText(fit.lines[1], W / 2, by + lh / 2); }""")

# ---- 保存：安卓装成 PWA（standalone）后 a[download] 会被静默拦截（没提示、没文件）。
#      改成三层：① Web Share Level 2（可直接存相册）② a[download] ③ 预览层长按保存 ----
SAVE_FN = r"""
/* 保存兜底预览层：图片直接铺出来，可长按保存 / 再分享 / 再下载 */
function showSavePreview(blob, name){
  var old = document.getElementById('evaSaveWrap');
  if (old && old.parentNode){ old.parentNode.removeChild(old); }
  var url = URL.createObjectURL(blob);
  var w = document.createElement('div');
  w.id = 'evaSaveWrap';
  w.style.cssText = 'position:fixed;left:0;top:0;right:0;bottom:0;z-index:99999;background:rgba(0,0,0,.95);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:16px 14px 22px';
  w.innerHTML =
    '<div style="display:flex;align-items:center;width:100%;max-width:460px;gap:8px">'
    + '<div style="flex:1;font-size:13px;font-weight:900;color:#F5C400;letter-spacing:.08em">▸ 長按圖片 ▸ 選「保存圖片」</div>'
    + '<button id="evaSaveX" class="mainbtn ghostbtn" style="height:44px;min-width:44px;padding:0 12px;flex:0 0 auto">✕</button>'
    + '</div>'
    + '<img id="evaSaveImg" src="' + url + '" style="max-width:100%;max-height:58vh;border:2px solid #D42027;box-shadow:0 0 26px rgba(212,32,39,.45);background:#0F0F0F">'
    + '<div style="font-family:\'Courier New\',monospace;font-size:11px;color:#6E6E6E">' + name + '</div>'
    + '<div style="display:flex;gap:8px;width:100%;max-width:460px">'
    + '<button id="evaSaveShare" class="mainbtn" style="flex:1">分享 / 存相册</button>'
    + '<button id="evaSaveDl" class="mainbtn ghostbtn" style="flex:1">下載</button>'
    + '</div>';
  document.body.appendChild(w);
  function close(){
    if (w.parentNode){ w.parentNode.removeChild(w); }
    setTimeout(function(){ URL.revokeObjectURL(url); }, 500);
  }
  document.getElementById('evaSaveX').addEventListener('click', close);
  document.getElementById('evaSaveDl').addEventListener('click', function(){
    try{
      var a = document.createElement('a');
      a.href = url; a.download = name; a.rel = 'noopener';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      toast('已觸發下載 ▸ 若仍無檔案請長按圖片保存');
    }catch(e){ toast('請長按圖片保存'); }
  });
  document.getElementById('evaSaveShare').addEventListener('click', function(){
    var f = null;
    try{ f = new File([blob], name, { type: blob.type || 'image/png' }); }catch(e){ f = null; }
    if (f && navigator.canShare && navigator.share && navigator.canShare({ files: [f] })){
      try{ navigator.share({ files: [f], title: name })['catch'](function(){ toast('請長按圖片保存'); }); }
      catch(e2){ toast('請長按圖片保存'); }
    }else{
      toast('此瀏覽器不支援分享 ▸ 請長按圖片保存');
    }
  });
}
function downloadBlob(blob, name){
  busy = false;   /* 兜底：走到這裡說明編碼已完成，避免 busy 卡死後續按鈕 */
  var standalone = false;
  try{
    var modes = ['standalone','fullscreen','minimal-ui'], mi;
    for (mi = 0; mi < modes.length; mi++){
      if (window.matchMedia && window.matchMedia('(display-mode: ' + modes[mi] + ')').matches){ standalone = true; }
    }
    if (window.navigator.standalone === true){ standalone = true; }
  }catch(e){}
  function anchor(){
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = name; a.rel = 'noopener';
    document.body.appendChild(a);
    try{ a.click(); }catch(e){}
    document.body.removeChild(a);
    setTimeout(function(){ URL.revokeObjectURL(url); }, 5000);
  }
  var file = null;
  try{ file = new File([blob], name, { type: blob.type || 'image/png' }); }catch(e){ file = null; }
  var canShare = false;
  try{ canShare = !!(file && navigator.canShare && navigator.share && navigator.canShare({ files: [file] })); }catch(e){ canShare = false; }

  /* 只有装成 PWA 的窗口才先走分享：普通标签页维持原来的直接下载，避免无故弹系统分享面板 */
  if (standalone && canShare){
    try{
      navigator.share({ files: [file], title: name }).then(function(){
        toast('已打開分享 ▸ 選「保存圖片」');
      })['catch'](function(err){
        if (err && err.name === 'AbortError'){ return; }
        anchor();
        if (standalone){ showSavePreview(blob, name); }
      });
      return;
    }catch(e){}
  }
  anchor();
  if (standalone){ showSavePreview(blob, name); }
}
"""
must("""function downloadBlob(blob, name){
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a);
  setTimeout(function(){ URL.revokeObjectURL(url); }, 3000);
}""", SAVE_FN.strip())

# 主循环：busy 卡死超过 6s 自动释放（防止某次编码异常后所有保存按钮永久无效）
must("""function loop(){
  if (currentApp && !busy && !document.hidden){ currentApp.tick(Date.now()); }""",
"""var __busySince = 0;
function loop(){
  var __now = Date.now();
  if (busy){
    if (!__busySince){ __busySince = __now; }
    else if (__now - __busySince > 6000){ busy = false; __busySince = 0; }
  } else { __busySince = 0; }
  if (currentApp && !busy && !document.hidden){ currentApp.tick(__now); }""")

# ---- 全局点按反馈：任意按钮 / chip / 图标 / 折叠条点击都出声（事件委托 + 45ms 去重）----
must("  var sirenTimer=null, sirenNodes=null;",
"""  var sirenTimer=null, sirenNodes=null;
  var __lastClick=0;""")

must("    click:function(){ tone('triangle',720,520,0.045,0.12); },",
"""    click:function(){
      var t=Date.now();
      if (t - __lastClick < 45){ return; }   /* 去重：全局委托与 APP 自身调用只出声一次 */
      __lastClick = t;
      tone('triangle',720,520,0.045,0.12);
    },""")

must("document.addEventListener('pointerdown',function(){ SFX.ctx(); },{passive:true});",
"""document.addEventListener('pointerdown',function(){ SFX.ctx(); },{passive:true});
/* 全局点按反馈：任何按钮 / chip / 图标 / 折叠条点击都出声，APP 不用逐个加 */
document.addEventListener('click',function(e){
  var n=e.target, guard=0;
  while (n && n!==document.body && guard++<6){
    /* data-nosfx：APP 自带更贴切的音效（如拨号 DTMF 双音）时，跳过通用 click */
    if (n.getAttribute && n.getAttribute('data-nosfx')){ return; }
    var tag=n.tagName;
    var cls=(n.className && n.className.baseVal!==undefined)?n.className.baseVal:(n.className||'');
    if (tag==='BUTTON' || tag==='A' || /(^|\\s)(chip|aicon|foldbar|item|tab)(\\s|$)/.test(cls)){ SFX.click(); return; }
    n=n.parentNode;
  }
},true);""")

HEXFN = """  function hexP(cx, cy, R){
    var a, ang, px, py;
    ctx.beginPath();
    for (a = 0; a < 6; a++){
      ang = Math.PI / 180 * (60 * a - 90);
      px = cx + R * Math.cos(ang); py = cy + R * Math.sin(ang);
      if (a === 0){ ctx.moveTo(px, py); } else { ctx.lineTo(px, py); }
    }
    ctx.closePath();
  }"""

# ---- APP-01 ▸ drawC 三栏 → 三六边形 ----
must("""    var colW = 352, gap = 4, y0 = 196, y1 = 950;
    var names = ['A-801 MELCHIOR', 'B-242 BALTHASAR', 'C-321 CASPER'];
    var yesN = 0, noN = 0, waitN = 0, i;
    for (i = 0; i < 3; i++){
      var cx0 = 8 + i * (colW + gap);
      var cxc = cx0 + colW / 2;
      ctx.fillStyle = 'rgba(255,255,255,0.04)'; ctx.fillRect(cx0, y0, colW, y1 - y0);
      ctx.strokeStyle = 'rgba(255,255,255,0.07)'; ctx.lineWidth = 1;
      var gx, gy;
      for (gx = cx0 + 44; gx < cx0 + colW; gx += 44){ ctx.beginPath(); ctx.moveTo(gx, y0); ctx.lineTo(gx, y1); ctx.stroke(); }
      for (gy = y0 + 44; gy < y1; gy += 44){ ctx.beginPath(); ctx.moveTo(cx0, gy); ctx.lineTo(cx0 + colW, gy); ctx.stroke(); }
      ctx.save();
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = C.green;
      ctx.fillRect(cx0 + 8, y0 + p * (y1 - y0), colW - 16, 3);
      ctx.restore();
      var v = R.v[i];
      if (v === 'YES'){ yesN++; } else if (v === 'NO'){ noN++; } else { waitN++; }
      var col = (v === 'YES') ? C.green : (v === 'NO') ? C.red : C.yellow;
      ctx.fillStyle = C.red; ctx.font = mono(28);
      drawSpaced(names[i], cxc, y0 + 60, 2, 'center');
      var vs = 120;
      ctx.font = cn(vs);
      while (vs > 60 && ctx.measureText(v).width > colW - 60){ vs -= 4; ctx.font = cn(vs); }
      ctx.fillStyle = col; ctx.font = cn(vs);
      ctx.fillText(v, cxc - 14, 560);
      if (blink(p)){ ctx.fillRect(cxc + ctx.measureText(v).width / 2 - 4, 516, 14, vs * 0.82); }
      ctx.beginPath(); ctx.arc(cxc, 650, 13, 0, Math.PI * 2);
      ctx.fillStyle = col; ctx.fill();
      ctx.beginPath(); ctx.arc(cxc, 650, 20, 0, Math.PI * 2);
      ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.stroke();
      var dots = 1 + Math.floor(p * 3);
      var s = 'MEASURING';
      var k;
      for (k = 0; k < dots; k++){ s += '.'; }
      ctx.fillStyle = C.gray; ctx.font = mono(22);
      drawSpaced(s, cxc, 890, 3, 'center');
    }""", """    var HXC = [[540, 330], [270, 640], [810, 640]], HR = 128;
    var names = ['A-801 MELCHIOR', 'B-242 BALTHASAR', 'C-321 CASPER'];
    var shorts = ['MELCHIOR-1', 'BALTHASAR-2', 'CASPER-3'];
    var yesN = 0, noN = 0, waitN = 0, i;
    """ + HEXFN + """
    ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 1;
    var gx, gy;
    for (gx = 54; gx < 1080; gx += 54){ ctx.beginPath(); ctx.moveTo(gx, 180); ctx.lineTo(gx, 950); ctx.stroke(); }
    for (gy = 240; gy < 950; gy += 54){ ctx.beginPath(); ctx.moveTo(8, gy); ctx.lineTo(1072, gy); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(51,255,102,.4)'; ctx.lineWidth = 3;
    for (i = 0; i < 3; i++){
      ctx.beginPath(); ctx.moveTo(HXC[i][0], HXC[i][1]); ctx.lineTo(HXC[(i + 1) % 3][0], HXC[(i + 1) % 3][1]); ctx.stroke();
    }
    ctx.fillStyle = C.red; ctx.font = mono(34, '700');
    drawSpaced('MAGI', 540, 545, 10, 'center');
    for (i = 0; i < 3; i++){
      var cx0 = HXC[i][0], cy0 = HXC[i][1];
      var v = R.v[i];
      if (v === 'YES'){ yesN++; } else if (v === 'NO'){ noN++; } else { waitN++; }
      var lab = (v === 'YES') ? '承認' : (v === 'NO') ? '否定' : '保留';
      var col = (v === 'YES') ? C.green : (v === 'NO') ? C.red : C.yellow;
      ctx.fillStyle = 'rgba(4,10,5,0.9)';
      hexP(cx0, cy0, HR); ctx.fill();
      ctx.save();
      ctx.globalAlpha = 0.6 + 0.4 * (0.5 + 0.5 * Math.sin(p * Math.PI * 2));
      ctx.strokeStyle = col; ctx.lineWidth = 5;
      hexP(cx0, cy0, HR); ctx.stroke();
      ctx.restore();
      ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 2;
      hexP(cx0, cy0, HR - 12); ctx.stroke();
      ctx.fillStyle = C.red; ctx.font = mono(14, '700');
      drawSpaced(names[i], cx0, cy0 - 52, 1, 'center');
      ctx.fillStyle = col; ctx.font = mono(19, '700');
      drawSpaced(shorts[i], cx0, cy0 - 28, 2, 'center');
      ctx.strokeStyle = col; ctx.lineWidth = 3;
      ctx.strokeRect(cx0 - 72, cy0 + 2, 144, 62);
      ctx.fillStyle = col; ctx.font = cn(40, '700');
      ctx.fillText(lab, cx0, cy0 + 34);
      if (blink(p) && v === 'WAIT'){
        ctx.fillStyle = col; ctx.fillRect(cx0 + 56, cy0 + 10, 8, 46);
      }
    }""")

# ---- APP-02 ▸ 节点坐标 + MAGI 中心标 + drawColumn → 六边形 ----
must("  var NODES = [[180, 800], [532, 800], [884, 800]];",
     "  var NODES = [[540, 430], [270, 780], [810, 780]];")

must("""      ctx.globalAlpha = 0.35 * vis;
      ctx.beginPath(); ctx.arc(a[0] + (b[0] - a[0]) * t2, a[1] + (b[1] - a[1]) * t2, 3, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }""", """      ctx.globalAlpha = 0.35 * vis;
      ctx.beginPath(); ctx.arc(a[0] + (b[0] - a[0]) * t2, a[1] + (b[1] - a[1]) * t2, 3, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
    ctx.fillStyle = C.red; ctx.font = mono(38, '700');
    drawSpaced('MAGI', 540, 668, 10, 'center');
  }""")

must("""  function drawColumn(i, now){
    var colW = 344, gap = 4, x0 = 8 + i * (colW + gap);
    var y0 = 300, y1 = 1080;
    var cxc = x0 + colW / 2;
    ctx.fillStyle = 'rgba(255,255,255,0.04)'; ctx.fillRect(x0, y0, colW, y1 - y0);
    ctx.strokeStyle = 'rgba(255,255,255,0.07)'; ctx.lineWidth = 1;
    var gx, gy;
    for (gx = x0 + 43; gx < x0 + colW; gx += 43){ ctx.beginPath(); ctx.moveTo(gx, y0); ctx.lineTo(gx, y1); ctx.stroke(); }
    for (gy = y0 + 43; gy < y1; gy += 43){ ctx.beginPath(); ctx.moveTo(x0, gy); ctx.lineTo(x0 + colW, gy); ctx.stroke(); }
    ctx.fillStyle = C.red; ctx.font = mono(26);
    drawSpaced(NAMES[i], cxc, y0 + 52, 2, 'center');
    var el2 = now - spinStart;
    if (state === 'spin' && el2 < 500){
      var bh = (el2 / 500) * (y1 - y0);
      ctx.fillStyle = 'rgba(51,255,102,0.10)'; ctx.fillRect(x0, y1 - bh, colW, bh);
      ctx.fillStyle = 'rgba(51,255,102,0.55)'; ctx.fillRect(x0, y1 - bh, colW, 3);
    }
    var v, locked = false;
    if (state === 'idle'){ v = '----'; }
    else if (state === 'spin'){
      if (el2 >= STOP[i]){ v = answer[i]; locked = true; }
      else { v = POOL[(Math.floor(el2 / 90) * 7 + i * 3 + 1) % POOL.length]; }
    } else { v = answer[i]; locked = true; }
    var col = (v === 'YES') ? C.green : (v === 'NO') ? C.red : (v === 'WAIT') ? C.orange : C.gray;
    var vs = 150;
    ctx.font = cn(vs);
    while (vs > 60 && ctx.measureText(v).width > colW - 50){ vs -= 6; ctx.font = cn(vs); }
    ctx.fillStyle = col; ctx.font = cn(vs);
    ctx.fillText(v, cxc, 660);
    if (state === 'spin' && !locked){
      ctx.save();
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = C.green;
      ctx.fillRect(x0 + 8, y0 + ((now % 900) / 900) * (y1 - y0), colW - 16, 4);
      ctx.restore();
    }
    if (locked && state === 'spin' && (el2 - STOP[i]) < 160){
      ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(x0, y0, colW, y1 - y0);
    }
    var lampOn = state === 'idle' ? false : locked;
    ctx.beginPath(); ctx.arc(cxc, 800, 13, 0, Math.PI * 2);
    ctx.fillStyle = lampOn ? col : '#2a2a2a'; ctx.fill();
    ctx.beginPath(); ctx.arc(cxc, 800, 20, 0, Math.PI * 2);
    ctx.strokeStyle = lampOn ? col : C.gray; ctx.lineWidth = 2; ctx.stroke();
    if (lampOn){
      ctx.save();
      ctx.globalAlpha = 0.35 + 0.3 * (0.5 + 0.5 * Math.sin((now % 1600) / 1600 * Math.PI * 2));
      ctx.beginPath(); ctx.arc(cxc, 800, 30, 0, Math.PI * 2);
      ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.stroke();
      ctx.restore();
    }
    var st = (state === 'idle') ? 'STANDBY' : (state === 'spin') ? (locked ? 'LOCKED' : 'MEASURING…') : 'COMPLETE';
    ctx.fillStyle = C.gray; ctx.font = mono(20);
    drawSpaced(st, cxc, 1010, 3, 'center');
  }""", """  """ + HEXFN + """
  function drawColumn(i, now){
    var cx0 = NODES[i][0], cy0 = NODES[i][1], HR = 148;
    var el2 = now - spinStart;
    var v, locked = false;
    if (state === 'idle'){ v = '----'; }
    else if (state === 'spin'){
      if (el2 >= STOP[i]){ v = answer[i]; locked = true; }
      else { v = POOL[(Math.floor(el2 / 90) * 7 + i * 3 + 1) % POOL.length]; }
    } else { v = answer[i]; locked = true; }
    var lab = (v === 'YES') ? '承認' : (v === 'NO') ? '否定' : (v === 'WAIT') ? '保留' : '待機';
    var col = (v === 'YES') ? C.green : (v === 'NO') ? C.red : (v === 'WAIT') ? C.orange : C.gray;
    ctx.fillStyle = 'rgba(4,10,5,0.9)';
    hexP(cx0, cy0, HR); ctx.fill();
    if (state === 'idle'){
      ctx.strokeStyle = 'rgba(255,255,255,0.14)'; ctx.lineWidth = 4;
      hexP(cx0, cy0, HR); ctx.stroke();
    } else {
      ctx.save();
      ctx.globalAlpha = 0.55 + 0.45 * (0.5 + 0.5 * Math.sin(now / 300));
      ctx.strokeStyle = col; ctx.lineWidth = 6;
      hexP(cx0, cy0, HR); ctx.stroke();
      ctx.restore();
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 2;
    hexP(cx0, cy0, HR - 14); ctx.stroke();
    ctx.fillStyle = C.red; ctx.font = mono(18, '700');
    drawSpaced(NAMES[i], cx0, cy0 - 66, 1, 'center');
    ctx.strokeStyle = col; ctx.lineWidth = 4;
    ctx.strokeRect(cx0 - 78, cy0 - 24, 156, 84);
    ctx.fillStyle = col; ctx.font = cn(52, '700');
    ctx.fillText(lab, cx0, cy0 + 20);
    var st = (state === 'idle') ? 'STANDBY' : (state === 'spin') ? (locked ? 'LOCKED' : 'MEASURING…') : 'COMPLETE';
    ctx.fillStyle = C.gray; ctx.font = mono(20);
    drawSpaced(st, cx0, cy0 + HR + 34, 3, 'center');
    if (state === 'spin' && locked && (el2 - STOP[i]) < 160){
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      hexP(cx0, cy0, HR); ctx.fill();
    }
  }""")

print('== MAGI hexagon replacements applied')

j0 = s.index(JS_START)
j1 = s.index('/* ---------- APP-08 都市地图 ---------- */', j0)
old_js = s[j0:j1]
s = s[:j0] + NEW_JS + '\n' + s[j1:]
print('== martApp replaced (%d -> %d bytes)' % (len(old_js), len(NEW_JS)))

# ========== 皮膚系統：把主色抽成 CSS 變數 + 注入主題引擎 ==========
_css0 = s.index('<style>') + len('<style>')
_css1 = s.index('</style>', _css0)
_css = s[_css0:_css1]
n_ac = _css.count('#D42027')

_css = _css.replace('#D42027', 'var(--ac)')
_css = _css.replace('rgba(212,32,39,', 'rgba(var(--ac-rgb),')
_css = _css.replace('#8B0009', 'var(--ac-dk)')
_css = _css.replace('#0F0F0F', 'var(--bg)')
_css = _css.replace('#050505', 'var(--bg2)')
# 主色底上的文字改用 --ac-on（浅色皮肤如三號機需要深字）
_css = _css.replace('background:var(--ac);color:#fff', 'background:var(--ac);color:var(--ac-on)')
# 淡主色底上，文字用主色本身（深底浅底都可读）
_css = _css.replace('.chip.active{border-color:var(--ac);color:#fff',
                    '.chip.active{border-color:var(--ac);color:var(--ac)')
# ghost 按钮是「黑底 + 主色描边」，文字必须用主色本身：
# 它继承了 .mainbtn 的 --ac-on，浅色皮肤（三號機）下会变成黑底黑字
_css = _css.replace('.ghostbtn{background:#000;border:2px solid var(--ac);font-size:14px}',
                    '.ghostbtn{background:#000;border:2px solid var(--ac);color:var(--ac);font-size:14px}')
_css = _css.replace('justify-content:center;gap:14px;background:var(--ac);text-align:center;padding:32px}',
                    'justify-content:center;gap:14px;background:var(--ac);color:var(--ac-on);text-align:center;padding:32px}')

# ---------- 桌面背景跟随皮肤 ----------
_css = _css.replace("""  background:
  radial-gradient(ellipse 70% 42% at 52% 58%, rgba(255,130,35,.5), rgba(230,70,25,.15) 55%, transparent 72%),
  linear-gradient(155deg,#9c1116 0%,#c0201c 38%,#d94f22 62%,#7c0d12 100%);}""",
"""  background:
  radial-gradient(ellipse 70% 42% at 52% 58%, rgba(var(--ac-rgb),.42), rgba(var(--ac-dk-rgb),.16) 55%, transparent 72%),
  linear-gradient(155deg,var(--dt1) 0%,var(--dt2) 38%,var(--dt3) 62%,var(--dt4) 100%);}""")
_n_desk = 1 if 'var(--dt1)' in _css else 0
# 桌面上压在背景上的深色字：黑银皮肤下必须变亮，否则整片看不见
_css = _css.replace('font-size:28px;color:#0A0303;transform:skewX(-10deg)',
                    'font-size:28px;color:var(--dt-ink);transform:skewX(-10deg)')
_css = _css.replace(".dt-rain{position:absolute;top:11%;left:8%;font-size:36px;color:#111;",
                    ".dt-rain{position:absolute;top:11%;left:8%;font-size:36px;color:var(--dt-ink);")
_css = _css.replace(".dt-love{position:absolute;top:33.5%;left:36%;font-size:19px;color:#111;",
                    ".dt-love{position:absolute;top:33.5%;left:36%;font-size:19px;color:var(--dt-ink);")
print('== theme: 桌面背景已变量化 (%d)' % _n_desk)

_root = (
    ':root{\n'
    '  --ac:#D42027; --ac-rgb:212,32,39; --ac-on:#FFFFFF; --ac-dk:#8B0009; --ac-dk-rgb:139,0,9;\n'
    '  --bg:#0F0F0F; --bg2:#050505;\n'
    '  --dt1:#9c1116; --dt2:#c0201c; --dt3:#d94f22; --dt4:#7c0d12; --dt-ink:#0A0303;\n'
    '}\n'
    '/* 換膚只過渡顏色，不動佈局 */\n'
    '#desktop{transition:background .35s ease}\n'
    '.dt-logo,.dt-rain,.dt-love{transition:color .3s ease}\n'
    'body,.mainbtn,.chip,.foldbar,.aicon,input.txt,.shelfitem{'
    'transition:background-color .24s ease,border-color .24s ease,color .24s ease}\n'
)
s = s[:_css0] + _root + _css + s[_css1:]
print('== theme: CSS 主色变量化 %d 处' % n_ac)

THEME_JS = """var THEMES = {
  nerv:  {id:'nerv',  name:'NERV 標準', sub:'汎用 ▸ 赤',   ac:'#D42027', rgb:'212,32,39',  on:'#FFFFFF', dk:'#8B0009', dkrgb:'139,0,9', bg:'#0F0F0F', bg2:'#050505',
          dt:['#9c1116','#c0201c','#d94f22','#7c0d12'], ink:'#0A0303'},
  unit01:{id:'unit01',name:'初號機',     sub:'紫 × 螢光綠', ac:'#8A5CF0', rgb:'138,92,240', on:'#FFFFFF', dk:'#4A2A8A', dkrgb:'74,42,138', bg:'#0B0913', bg2:'#050308',
          dt:['#241046','#3E1F7A','#5A3A9A','#160830'], ink:'#E6DCFF'},
  unit02:{id:'unit02',name:'貳號機',     sub:'朱紅 × 橙',   ac:'#E8412A', rgb:'232,65,42',  on:'#FFFFFF', dk:'#8E1A0E', dkrgb:'142,26,14', bg:'#120606', bg2:'#080303',
          dt:['#A51208','#D8321E','#F07020','#6E0A05'], ink:'#2A0602'},
  unit03:{id:'unit03',name:'三號機',     sub:'黑 × 銀',     ac:'#D0D0D0', rgb:'208,208,208',on:'#0A0A0A', dk:'#6E6E6E', dkrgb:'110,110,110', bg:'#0A0A0A', bg2:'#000000',
          dt:['#1C1C1C','#2A2A2A','#414141','#0A0A0A'], ink:'#EDEDED'}
};
var THEME_ORDER = ['nerv','unit01','unit02','unit03'];
var curTheme = 'nerv';
function applyTheme(id, persist){
  var t = THEMES[id] || THEMES.nerv, k, st = document.documentElement.style;
  curTheme = t.id;
  st.setProperty('--ac', t.ac);
  st.setProperty('--ac-rgb', t.rgb);
  st.setProperty('--ac-on', t.on);
  st.setProperty('--ac-dk', t.dk);
  st.setProperty('--ac-dk-rgb', t.dkrgb);
  st.setProperty('--bg', t.bg);
  st.setProperty('--bg2', t.bg2);
  /* 桌面背景也跟着机体走 */
  st.setProperty('--dt1', t.dt[0]);
  st.setProperty('--dt2', t.dt[1]);
  st.setProperty('--dt3', t.dt[2]);
  st.setProperty('--dt4', t.dt[3]);
  st.setProperty('--dt-ink', t.ink);
  C.red = t.ac; C.darkred = t.dk; C.black = t.bg;
  if (persist !== false){ try{ localStorage.setItem('eva_theme', t.id); }catch(e){} }
  /* 皮肤变了，让当前 APP 重新走一遍 activate：脏标记型 APP（写真冲印）才会重绘 */
  try{
    if (typeof APPS === 'object' && APPS[currentApp] && APPS[currentApp].activate){ APPS[currentApp].activate(); }
  }catch(e){}
  return t;
}
/* 开机前先恢复上次的皮肤，避免先闪一下默认红 */
try{
  var __th = localStorage.getItem('eva_theme');
  if (__th && THEMES[__th]){ applyTheme(__th, false); }
}catch(e){}
"""
must("""var C = {
  red:'#D42027', darkred:'#8B0009', orange:'#FF6A2B',
  yellow:'#F5C400', black:'#0F0F0F', white:'#FFFFFF',
  green:'#33FF66', gray:'#6E6E6E'
};""",
"""var C = {
  red:'#D42027', darkred:'#8B0009', orange:'#FF6A2B',
  yellow:'#F5C400', black:'#0F0F0F', white:'#FFFFFF',
  green:'#33FF66', gray:'#6E6E6E'
};
/* ============ 皮膚系統 ▸ EVA 機體配色 ============ */
""" + THEME_JS)

# 把 theme 相關能力掛到 window.EVA 頂層（APP 用 EVA.THEMES / EVA.applyTheme 取）
must("""  registerApp: registerApp, APPS: APPS, C: C, SFX: SFX, cv: cv, ctx: ctx,""",
"""  registerApp: registerApp, APPS: APPS, C: C, SFX: SFX, cv: cv, ctx: ctx,
  THEMES: THEMES, THEME_ORDER: THEME_ORDER, applyTheme: applyTheme,
  getTheme: function(){ return THEMES[curTheme]; },""")

# ========== 桌面重构：挂件区（时钟/天气/记事）+ 底部 Dock ==========
must('    <div id="iconGrid">',
'''    <div id="dtWidgets">
      <div class="dtw" id="dtClock">
        <div class="dtw-h"><span class="dtw-dot"></span><span id="ckSync">SYNC</span></div>
        <div class="dtw-time" id="ckTime">--:--</div>
        <div class="dtw-sub" id="ckDate">—</div>
      </div>
      <div class="dtw-row">
        <div class="dtw" id="dtWx">
          <div class="dtw-h">WEATHER</div>
          <div class="dtw-big" id="wxTemp">--&deg;</div>
          <div class="dtw-sub" id="wxTxt">—</div>
          <div class="dtw-sub" id="wxCity">東京-3</div>
        </div>
        <div class="dtw" id="dtNote">
          <div class="dtw-h">MEMO</div>
          <div class="dtw-note" id="ntBody">—</div>
          <div class="dtw-sub" id="ntMore">—</div>
        </div>
      </div>
    </div>
    <div id="iconGrid">''')

must('''    </div>
  </div>

  <!-- ============ APP 视图 ============ -->''',
'''    </div>
    <div id="dtDock"></div>
  </div>

  <!-- ============ APP 视图 ============ -->''')
print('== desktop: 挂件区 + Dock 已插入')

# ---- 桌面新布局 CSS（在 </style> 前追加，此时 CSS 变量已就绪）----
_DT_CSS = """
/* ============ 桌面重构：挂件 + Docker ============ */
#desktop{display:flex;flex-direction:column}
.dt-art{opacity:.64}
#dtWidgets{position:relative;z-index:2;display:flex;flex-direction:column;gap:7px;padding:13px 12px 0;flex:0 0 auto}
.dtw{background:rgba(5,2,3,.86);border:1px solid rgba(255,255,255,.15);border-radius:12px;
  padding:9px 11px;backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px);min-width:0}
.dtw-h{display:flex;align-items:center;gap:5px;font-family:'Courier New',monospace;font-size:8px;
  letter-spacing:.18em;color:rgba(255,255,255,.52);white-space:nowrap;overflow:hidden}
.dtw-dot{width:5px;height:5px;border-radius:50%;background:var(--ac);box-shadow:0 0 7px var(--ac);
  animation:lamp 1.6s steps(2,start) infinite;flex:0 0 auto}
.dtw-time{font-family:'Courier New',monospace;font-size:40px;font-weight:700;line-height:1.02;
  letter-spacing:.01em;color:#fff;margin:1px 0 0}
.dtw-sub{font-family:'Courier New',monospace;font-size:9px;color:rgba(255,255,255,.60);
  letter-spacing:.08em;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dtw-row{display:grid;grid-template-columns:1fr 1fr;gap:7px}
.dtw-big{font-family:'Courier New',monospace;font-size:25px;font-weight:700;color:#fff;line-height:1.15;margin-top:2px}
.dtw-note{font-size:10px;color:rgba(255,255,255,.80);line-height:1.5;margin-top:3px;min-height:30px;
  display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
#iconGrid{flex:1 1 auto;overflow-y:auto;align-content:space-evenly;gap:8px;padding:10px 12px 96px}
#iconGrid>#iconGrid{scrollbar-width:none}
#iconGrid::-webkit-scrollbar{display:none;width:0}
#iconGrid .aicon{padding:8px 3px 6px;border-radius:11px;background:rgba(8,2,3,.74)}
#iconGrid .aicon .gl{font-size:19px}
#iconGrid .aicon .no2{font-size:6.5px;margin-top:0}
#iconGrid .aicon .lb{font-size:9.5px;margin-top:1px;letter-spacing:.04em}
#dtDock{position:absolute;left:0;right:0;bottom:0;z-index:6;display:grid;
  grid-template-columns:repeat(4,1fr);gap:7px;padding:14px 12px 15px;
  background:linear-gradient(180deg,rgba(0,0,0,0),rgba(0,0,0,.80) 42%)}
.dicon{background:rgba(10,3,4,.74);border:1px solid rgba(255,255,255,.22);border-radius:15px;
  padding:9px 2px 8px;text-align:center;color:#fff;font-family:inherit;cursor:pointer;
  display:flex;flex-direction:column;align-items:center;gap:1px;
  box-shadow:0 4px 14px rgba(0,0,0,.45);transition:transform .1s,background-color .2s}
.dicon .gl{font-size:21px;font-weight:900;line-height:1.15}
.dicon .lb{font-size:9.5px;font-weight:700;letter-spacing:.06em}
.dicon:active{transform:scale(.92);background:rgba(20,6,8,.9)}
@media (max-width:600px){
  #dtWidgets{padding:11px 10px 0;gap:6px}
  .dtw{padding:8px 10px;border-radius:11px}
  .dtw-time{font-size:36px}
  .dtw-row{gap:6px}
  #iconGrid{gap:9px;padding:9px 10px 94px}
  #dtDock{gap:6px;padding:12px 10px 13px}
}
"""
_si = s.index('</style>')
s = s[: _si] + _DT_CSS + s[_si:]
print('== desktop: 新布局 CSS 已注入')

# ---- registerApp 支持 meta.dock：装进底部 Dock 而不是图标网格 ----
must('''  if (!document.querySelector('#iconGrid .aicon[data-app="' + id + '"]')){
    var b = document.createElement('button');
    b.className = 'aicon'; b.setAttribute('data-app', id);
    b.style.borderColor = meta.color || '#888';
    b.innerHTML = '<span class="gl" style="color:' + (meta.color || '#888') + '">' + (meta.glyph || '★') + '</span>'
                + '<span class="no2">' + (meta.no || '') + '</span>'
                + '<span class="lb">' + (meta.label || id) + '</span>';
    document.getElementById('iconGrid').appendChild(b);
    b.addEventListener('click', function(){ openApp(id); });
  }''',
'''  var _dock = !!meta.dock;
  var _host = document.getElementById(_dock ? 'dtDock' : 'iconGrid');
  var _sel = (_dock ? '#dtDock .dicon' : '#iconGrid .aicon') + '[data-app="' + id + '"]';
  if (_host && !document.querySelector(_sel)){
    var b = document.createElement('button');
    b.className = _dock ? 'dicon' : 'aicon'; b.setAttribute('data-app', id);
    b.style.borderColor = _dock ? 'var(--ac)' : (meta.color || '#888');
    b.innerHTML = '<span class="gl" style="color:' + (meta.color || '#888') + '">' + (meta.glyph || '★') + '</span>'
                + (_dock ? '' : '<span class="no2">' + (meta.no || '') + '</span>')
                + '<span class="lb">' + (meta.label || id) + '</span>';
    _host.appendChild(b);
    b.addEventListener('click', function(){ openApp(id); });
  }''')
print('== desktop: registerApp 支持 dock')

# ---- 挂件逻辑（时钟同步 / 天气 / 记事） ----
must('window.EVA.showSavePreview = showSavePreview;',
'''window.EVA.showSavePreview = showSavePreview;

/* ============ 桌面挂件：时钟 / 天气 / 记事 ============ */
(function(){
  var P2 = function(n){ return (n < 10 ? '0' : '') + n; };
  var DAY = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
  var WX = [['晴れ',5],['晴れ',5],['薄曇り',10],['曇り',25],['曇り',20],['雨',70],
            ['雨',65],['曇り',35],['晴れ',10],['晴れ',5],['薄曇り',10],['曇り',30]];
  var lastSlot = -1;
  function upd(){
    var d = new Date(), h = d.getHours(), m = d.getMinutes();
    var eT = document.getElementById('ckTime');
    if (eT){ eT.textContent = P2(h) + ':' + P2(m); }
    var eD = document.getElementById('ckDate');
    if (eD){ eD.textContent = d.getFullYear() + '.' + P2(d.getMonth() + 1) + '.' + P2(d.getDate()) + ' ▸ ' + DAY[d.getDay()]; }
    var eS = document.getElementById('ckSync');
    if (eS){ eS.textContent = 'SYNC ' + P2(h) + ':' + P2(m) + ':' + P2(d.getSeconds()); }
    /* 天气每 10 分钟重算一次，不用每秒打扰 */
    var slot = Math.floor((h * 60 + m) / 10);
    if (slot !== lastSlot){
      lastSlot = slot;
      var temp = Math.round(22 + 7 * Math.sin(((h + m / 60) - 9) / 24 * 6.283185));
      var w = WX[h % WX.length];
      var e1 = document.getElementById('wxTemp'), e2 = document.getElementById('wxTxt');
      if (e1){ e1.textContent = temp + '°'; }
      if (e2){ e2.textContent = w[0] + ' ▸ ' + w[1] + '%'; }
    }
  }
  upd();
  setInterval(upd, 1000);
  /* 记事：优先读 localStorage.eva_memo，没有就用内置条目 */
  function memo(){
    var list = null;
    try{ var raw = localStorage.getItem('eva_memo'); if (raw){ list = JSON.parse(raw); } }catch(e){}
    if (!list || !list.length){
      list = ['明日 09:00 中央ドグマ ▸ 同步率檢測',
              'LCL 更換 ▸ 零號機 CAGE',
              '報告書 ▸ 作戦部一課 提出'];
    }
    var el = document.getElementById('ntBody'), mo = document.getElementById('ntMore');
    if (el){ el.textContent = list[0]; }
    if (mo){ mo.textContent = '待辦 ' + list.length + ' 項 ▸ 點擊開啟'; }
  }
  memo();
  var ck = document.getElementById('dtClock');
  if (ck){ ck.addEventListener('click', function(){ upd(); toast('時刻同期 ▸ 完了'); }); }
  var nt = document.getElementById('dtNote');
  if (nt){ nt.addEventListener('click', function(){ openApp('notebook'); }); }
  var wx = document.getElementById('dtWx');
  if (wx){ wx.addEventListener('click', function(){ toast('気象観測 ▸ 第3新東京市 全天'); }); }
})();''')
print('== desktop: 挂件逻辑已注入')

# ---------- APP-09 機密記事：資料庫擴充（5 分頁 → 11 分頁）+ 分頁橫滑 ----------
# 資料寫在 nb_data.js，這裡按「起訖標記」整段替換源文件裡的 DATA / TABS / cur。
_nb_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'nb_data.js')
_nb_src = io.open(_nb_path, encoding='utf-8').read()
_nb_start = "  var DATA = {"
_nb_end = "  var cur = 'overview';"
assert s.count(_nb_start) == 1, 'notebook DATA 起始锚点不唯一'
assert s.count(_nb_end) == 1, 'notebook cur 锚点不唯一'
_i = s.index(_nb_start)
_j = s.index(_nb_end, _i) + len(_nb_end)
s = s[: _i] + _nb_src.rstrip('\n') + s[_j:]

must("""    var h = '<div class="chips" id="nbTabs">';""",
     """    var h = '<div class="chips nbTabs" id="nbTabs">';""")
print('== notebook: 資料庫 11 分頁已注入')

io.open(DST, 'w', encoding='utf-8').write(s)
print('written -> %s (%d bytes, was %d)' % (DST, len(s), orig_len))