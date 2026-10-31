/* ===== APP-16 起動実験（初号機 ▸ 插入栓第一視角 ▸ 同步率測試 ▸ 暴走不匹配實驗） =====
   交互：按住「同期保持」→ 同步率上升，但不匹配度同步累積；鬆手則同步率緩降、不匹配度回落。
   不匹配度破 100% → 初號機暴走（劇本演出）。同步率到 100% 前鬆手 → 正常完了 + 評級。 */
var SY_CSS = '<style>' +
  '#panel-synchro{padding-bottom:14px}' +
  /* --- 三视图切换 --- */
  '.syTabs{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:10px}' +
  '.syTab{height:42px;border-radius:5px;background:#0B0708;border:1px solid #3B3B3B;color:#A9A29A;' +
    'font-family:"Courier New",monospace;font-size:12px;font-weight:700;letter-spacing:.12em;cursor:pointer;padding:0}' +
  '.syTab.active{background:linear-gradient(180deg,rgba(var(--ac-rgb),.26),rgba(var(--ac-rgb),.06));' +
    'border-color:var(--ac);color:#fff;box-shadow:0 0 12px rgba(var(--ac-rgb),.28),inset 0 0 0 1px rgba(var(--ac-rgb),.4)}' +
  '.syView{display:none}.syView.on{display:block}' +
  /* --- 状态行 --- */
  '.syStat{font-family:"Courier New",monospace;font-size:11px;color:#7A7A7A;letter-spacing:.06em;' +
    'padding:9px 11px;background:#050505;border:1px solid #2A2A2A;border-radius:5px;margin-bottom:9px;' +
    'display:flex;justify-content:space-between;align-items:center;gap:8px;line-height:1.5}' +
  '.syStat b{color:var(--ac);font-size:15px}' +
  '.syStat .ok{color:#33FF66}.syStat .warn{color:#F5C400}.syStat .bad{color:#FF5040}' +
  /* --- 主按钮组 --- */
  '.syRow{display:grid;grid-template-columns:1.5fr 1fr;gap:7px}' +
  '.syRow3{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:7px}' +
  '.syStart{height:56px;border-radius:6px;background:var(--ac);color:var(--ac-on);border:none;' +
    'font-size:14px;font-weight:900;letter-spacing:.1em;cursor:pointer;font-family:inherit}' +
  '.syStart:disabled{opacity:.35;cursor:default}' +
  '.syAbort{height:56px;border-radius:6px;background:#170606;color:#FF5040;border:1px solid #5A1515;' +
    'font-size:13px;font-weight:900;cursor:pointer;font-family:inherit}' +
  '.syHold{height:74px;border-radius:8px;background:#050505;border:2px solid var(--ac);color:var(--ac);' +
    'font-size:16px;font-weight:900;letter-spacing:.14em;cursor:pointer;font-family:inherit;' +
    'width:100%;margin-top:9px;user-select:none;-webkit-user-select:none;touch-action:none;' +
    'transition:background .1s ease,box-shadow .1s ease}' +
  '.syHold:active,.syHold.on{background:linear-gradient(180deg,rgba(var(--ac-rgb),.42),rgba(var(--ac-rgb),.14));' +
    'color:#fff;box-shadow:0 0 22px rgba(var(--ac-rgb),.45),inset 0 0 16px rgba(var(--ac-rgb),.3)}' +
  '.syHold:disabled{opacity:.3;border-color:#3B3B3B;color:#5E5E5E;cursor:default;box-shadow:none}' +
  /* --- 装备卡 --- */
  '#syEq{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:4px}' +
  '.syEq{min-height:62px;border-radius:6px;background:#070707;border:1px solid #2E2E2E;padding:8px 10px;' +
    'cursor:pointer;text-align:left;font-family:inherit;color:#E0D8CE;position:relative}' +
  '.syEq b{display:block;font-size:12.5px;font-weight:700;letter-spacing:.03em}' +
  '.syEq i{display:block;font-family:"Courier New",monospace;font-size:9px;color:#5E5E5E;' +
    'font-style:normal;margin-top:3px;line-height:1.5}' +
  '.syEq.active{border-color:var(--ac);background:linear-gradient(180deg,rgba(var(--ac-rgb),.20),rgba(var(--ac-rgb),.04))}' +
  '.syEq.active b{color:#fff}.syEq.active i{color:#B8B0A6}' +
  /* --- 状态条 --- */
  '.syBars{margin-top:4px}' +
  '.syBar{display:flex;align-items:center;gap:9px;margin-top:7px;font-family:"Courier New",monospace;font-size:10px;color:#7A7A7A}' +
  '.syBar span:first-child{flex:0 0 62px;letter-spacing:.08em}' +
  '.syBar .track{flex:1;height:8px;background:#1A1A1A;border-radius:2px;overflow:hidden;border:1px solid #2A2A2A}' +
  '.syBar .fill{height:100%;background:var(--ac);transition:width .2s ease}' +
  '.syBar .fill.low{background:#FF5040}' +
  '.syBar .vv{flex:0 0 40px;text-align:right;color:#C8C8C8}' +
  /* --- 记录 --- */
  '.syRec{display:flex;align-items:center;gap:9px;min-height:44px;padding:5px 9px;margin-top:5px;' +
    'border:1px solid #2A2A2A;border-radius:5px;background:#070707;font-family:"Courier New",monospace;font-size:11px}' +
  '.syRec .rk{flex:0 0 34px;font-weight:700;font-size:14px;text-align:center}' +
  '.syRec .vv{flex:0 0 62px;color:#E4E4E4;font-size:13px;font-weight:700}' +
  '.syRec .ds{flex:1;min-width:0;color:#7A7A7A;font-size:9.5px;letter-spacing:.05em;' +
    'white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
  '.syRec.bers .vv{color:#FF5040}' +
  '.syBig{display:flex;gap:8px;margin:2px 0 8px}' +
  '.syBig div{flex:1;border:1px solid #2A2A2A;border-radius:5px;background:#050505;padding:9px 6px;text-align:center}' +
  '.syBig b{display:block;font-family:"Courier New",monospace;font-size:19px;color:var(--ac)}' +
  '.syBig span{display:block;font-size:9px;color:#5E5E5E;letter-spacing:.12em;margin-top:2px}' +
  '#syRecList{max-height:40vh;overflow-y:auto;scrollbar-width:thin}' +
  '</style>';

var SY_PANEL = SY_CSS +
  '<div class="syTabs" id="syTabs">' +
    '<button class="syTab active" data-v="run">実　験</button>' +
    '<button class="syTab" data-v="cage">整　備</button>' +
    '<button class="syTab" data-v="log">記　録</button>' +
  '</div>' +
  /* --- 实验 --- */
  '<div class="syView on" id="syViewRun">' +
    '<div class="syStat" id="syStat"><span>待機中 ▸ 按「起動」開始 LCL 注水</span><b>--</b></div>' +
    '<div class="syRow">' +
      '<button class="syStart" id="syStart">起　動 ▸ START</button>' +
      '<button class="syAbort" id="syAbort">中　止</button>' +
    '</div>' +
    '<button class="syHold" id="syHold" disabled>同 期 保 持 ▸ 按 住</button>' +
    '<div class="avhint">▸ 按住「同期保持」推進同步率，但 <b>不匹配度</b> 同時累積；鬆手會回落<br>' +
      '▸ 不匹配度破 100% → 初號機暴走（研究目的）▸ 同步率到 100% 前鬆手 → 正常完了</div>' +
  '</div>' +
  /* --- 整备 --- */
  '<div class="syView" id="syViewCage">' +
    '<label class="fl">▸ 裝　備 ▸ 影響同步增益與不匹配速度</label>' +
    '<div id="syEq"></div>' +
    '<label class="fl">▸ 機體狀態 ▸ EVA-01</label>' +
    '<div class="syBars" id="syBars"></div>' +
    '<div class="syRow3"><button class="mainbtn ghostbtn" id="syFix">整　備 ▸ 裝甲修復</button>' +
      '<button class="mainbtn ghostbtn" id="syReset">實驗體重置</button></div>' +
    '<div class="avhint">▸ 裝甲越低 ▸ 不匹配度增長越快 ▸ 暴走更容易發生</div>' +
  '</div>' +
  /* --- 记录 --- */
  '<div class="syView" id="syViewLog">' +
    '<div class="syBig" id="syBig"></div>' +
    '<div id="syRecList"></div>' +
    '<div class="btnrow"><button class="mainbtn ghostbtn" id="syRecClear">清空實驗記錄</button></div>' +
  '</div>';

var synchroApp = (function(){
  var W = 1080, H = 760;
  var KEY = 'eva_synchro_v1';
  var view = 'run';
  var phase = 'idle';           /* idle | fill | connect | sync | berserk | result */
  var phaseAt = 0, holding = false, bound = false;
  var sync = 0, mis = 0, lcl = 0, peak = 0;
  var lastNow = 0, shake = 0, lastStatAt = 0, launchEl = 0, hexLayer = null;
  var cur = null;               /* 当前台词 {who,jp,cn,at} */
  var said = {};                /* 台词去重 */
  var result = null;            /* {rank, sync, mis, berserk} */
  var log = [], stats = { runs:0, bers:0, best:0 };
  var eq = 'std';
  var armor = 100;

  var EQ = {
    std:    { nm:'標準装備',      sub:'SYNC ×1.00 ▸ MIS ×1.00',  s:1.00, m:1.00 },
    typeD:  { nm:'D型装備',       sub:'耐熱 ▸ SYNC ×0.90 ▸ MIS ×0.70', s:0.90, m:0.70 },
    posi:   { nm:'陽電子砲装備',   sub:'高火力 ▸ SYNC ×1.30 ▸ MIS ×1.45', s:1.30, m:1.45 },
    knife:  { nm:'高振動粒子刀',   sub:'近接 ▸ SYNC ×1.15 ▸ MIS ×0.95', s:1.15, m:0.95 }
  };
  var EQ_ORDER = ['std','typeD','posi','knife'];

  /* ---- 角色 ---- */
  var CAST = {
    misato: { n:'葛城美里', j:'葛城ミサト',  c:'#E8412A' },
    ritsuko:{ n:'赤木律子', j:'赤木リツコ',  c:'#8A5CF0' },
    maya:   { n:'伊吹玛雅', j:'伊吹マヤ',    c:'#7FD8E8' },
    gendo:  { n:'碇源堂',   j:'碇ゲンドウ',  c:'#D42027' },
    fuyu:   { n:'冬月耕造', j:'冬月コウゾウ',c:'#C8B898' },
    shinji: { n:'碇真嗣',   j:'碇シンジ',    c:'#5FD35F' }
  };

  /* ---- 剧本：按阶段推进，key 用于去重 ---- */
  var SCRIPT = {
    fill: [
      [300,  'maya',   'LCL 注水、開始します。', 'LCL 开始注入。'],
      [1300, 'maya',   'プラグ内圧、正常。', '插入栓内压，正常。'],
      [2200, 'shinji', '……これ、息できるの？', '……这个，能呼吸吗？'],
      [3100, 'ritsuko','LCL は酸素を直接肺に送ります。落ち着いて。', 'LCL 会把氧气直接送进肺里。放轻松。']
    ],
    connect: [
      [400,  'maya',   'A10 神経接続、開始。', 'A10 神经接续，开始。'],
      [1400, 'ritsuko','心拍モニター、異常なし。', '心拍监测，无异常。'],
      [2400, 'misato', 'シンジ君、リラックスして。', '真嗣，放松一点。'],
      [3100, 'shinji', '……はい。', '……好。']
    ],
    launch: [
      [300,  'maya',   '発進シークエンス、開始します。', '出击程序，开始。'],
      [1400, 'misato', 'エヴァ初号機、発進準備。', 'EVA 初号机，准备出击。'],
      [3200, 'ritsuko','パターン青。目標、確認。', '蓝色模式。目标确认。'],
      [5000, 'maya',   'カタパルト、ロック解除。', '弹射器，解锁。'],
      [6900, 'misato', '全扉、開放。', '全闸门，开启。'],
      [7900, 'shinji', '……う、うわあああっ！', '……呜、哇啊啊啊！']
    ],
    sync: [
      [600,  'ritsuko','シンクロ開始。数値、上がっていきます。', '同步开始。数值开始上升。'],
      [2600, 'ritsuko','20…… 35…… 順調ね。', '20……35……很顺利。'],
      [5200, 'maya',   '先輩、60% 超えました。', '前辈，超过 60% 了。'],
      [8200, 'ritsuko','……あれ？ 数値が跳ねてる。', '……咦？数值在跳。']
    ],
    berserk: [
      [200,  'maya',   '暴走……！ 制御不能です！', '暴走……！无法控制！'],
      [1000, 'ritsuko','パルス逆流！ 外部電源、遮断！', '脉搏逆流！外部电源，切断！'],
      [1900, 'misato', 'プラグ、緊急射出して！', '插入栓，紧急射出！'],
      [2800, 'shinji', 'やめて…… やめてよ……！', '住手……住手啊……！'],
      [3800, 'gendo',  '……最優先事項だ。', '……这是最优先事项。'],
      [4800, 'shinji', '……知らない天井だ。', '……陌生的天花板。']
    ]
  };
  /* 阈值触发的台词写在 update() 里（按 sync / mis 数值，不按时间） */

  /* ---- 存档 ---- */
  function load(){
    try{
      var raw = localStorage.getItem(KEY);
      if (raw){
        var o = JSON.parse(raw);
        log = o.log || []; stats = o.stats || { runs:0, bers:0, best:0 };
        armor = (typeof o.armor === 'number') ? o.armor : 100;
        if (o.eq && EQ[o.eq]){ eq = o.eq; }
      }
    }catch(e){}
  }
  function save(){
    try{ localStorage.setItem(KEY, JSON.stringify({ log:log.slice(0,24), stats:stats, armor:armor, eq:eq })); }catch(e){}
  }

  /* ---- 台词 ---- */
  function say(who, jp, cn, now){
    var c = CAST[who];
    if (!c){ return; }
    cur = { who:who, n:c.n, j:c.j, col:c.c, jp:jp, cn:cn, at:now };
  }
  function fire(list, elapsed, now){
    var i;
    for (i = 0; i < list.length; i++){
      var it = list[i], k = it[0];
      if (elapsed >= it[0] && !said[phase + ':' + k]){
        said[phase + ':' + k] = 1;
        say(it[1], it[2], it[3], now);
        if (SFX.beep){ SFX.beep(); }
      }
    }
  }

  /* ---- 阶段切换 ---- */
  function setPhase(p, now){
    phase = p; phaseAt = now; said = {}; lastStatAt = 0; updStat();
  }
  function start(now){
    if (phase !== 'idle' && phase !== 'result'){ return; }
    sync = 0; mis = 0; lcl = 0; peak = 0; result = null; cur = null;
    setPhase('fill', now);
    SFX.grant();
    updStat();
  }
  function abort(now){
    if (phase === 'idle' || phase === 'result'){ return; }
    finish(now, false);
  }
  function finish(now, berserk){
    var rank;
    if (berserk){ rank = 'BERS'; }
    else if (sync >= 99){ rank = 'S'; }
    else if (sync >= 80){ rank = 'A'; }
    else if (sync >= 60){ rank = 'B'; }
    else if (sync >= 40){ rank = 'C'; }
    else { rank = 'D'; }
    result = { rank:rank, sync:Math.round(sync * 10) / 10, mis:Math.round(mis), bers:!!berserk, ts:new Date().getTime() };
    setPhase('result', now);
    stats.runs++;
    if (berserk){ stats.bers++; armor = Math.max(0, armor - 22); }
    if (result.sync > stats.best){ stats.best = result.sync; }
    log.unshift(result);
    log = log.slice(0, 24);
    save();
    if (berserk){ SFX.deny(); } else { SFX.grant(); }
    renderLog(); renderCage(); updStat();
  }

  /* ---- 每帧更新 ---- */
  function update(now, dt){
    var el = now - phaseAt;
    if (now - lastStatAt > 160){ lastStatAt = now; updStat(); }

    if (phase === 'fill'){
      lcl = Math.min(1, el / 4000);
      fire(SCRIPT.fill, el, now);
      if (el >= 4200){ setPhase('connect', now); }
    }
    else if (phase === 'connect'){
      lcl = 1;
      fire(SCRIPT.connect, el, now);
      if (el >= 3600){ setPhase('launch', now); }
    }
    else if (phase === 'launch'){
      lcl = 1;
      fire(SCRIPT.launch, el, now);
      launchEl = el;
      if (el >= 8500){
        launchEl = 8500;
        setPhase('sync', now);
        shake = 7;
        if (SFX.stamp){ SFX.stamp(); }
      }
    }
    else if (phase === 'sync'){
      lcl = 1;
      fire(SCRIPT.sync, el, now);
      var e = EQ[eq], af = 1 + (100 - armor) / 100 * 0.8;
      if (holding){
        sync += 9.5 * e.s * dt;
        mis  += 12.5 * e.m * af * dt;
        shake = 1.6;
      }else{
        sync -= 1.6 * dt;
        mis  -= 19 * dt;
        shake *= 0.86;
      }
      sync = Math.max(0, Math.min(100, sync));
      mis = Math.max(0, Math.min(100, mis));
      if (sync > peak){ peak = sync; }

      /* 数值触发的台词 */
      if (mis >= 40 && !said['t_m40']){ said['t_m40'] = 1; say('misato', 'シンジ君、無理しないで。', '真嗣，别勉强自己。', now); }
      if (mis >= 62 && !said['t_m62']){ said['t_m62'] = 1; say('maya', '波形が乱れています！', '波形正在紊乱！', now); }
      if (mis >= 76 && !said['t_m76']){ said['t_m76'] = 1; say('ritsuko', 'シンクロ曲線、反転……!?', '同步曲线，反转过来了……！？', now); }
      if (mis >= 86 && !said['t_m86']){ said['t_m86'] = 1; say('gendo', '……続けろ。', '……继续。', now); }
      if (mis >= 94 && !said['t_m94']){ said['t_m94'] = 1; say('fuyu', '碇君、本当にいいのか。', '碇，你真的决定了吗。', now); }

      if (mis >= 100){ setPhase('berserk', now); shake = 6; SFX.sirenStart ? SFX.sirenStart() : SFX.deny(); }
      if (sync >= 99.9 && !holding){ finish(now, false); }
    }
    else if (phase === 'berserk'){
      lcl = 1;
      fire(SCRIPT.berserk, el, now);
      sync = Math.min(400, sync + 26 * dt * 8);
      mis = 100;
      shake = 5.5;
      if (el >= 5600){
        if (SFX.sirenStop){ SFX.sirenStop(); }
        finish(now, true);
      }
    }
    else if (phase === 'result'){
      shake *= 0.8;
    }
    updHold();
  }

  /* ---- 参数板 ---- */
  function setView(v){
    view = v;
    var ids = ['run', 'cage', 'log'], i;
    for (i = 0; i < ids.length; i++){
      var box = document.getElementById('syView' + ids[i].charAt(0).toUpperCase() + ids[i].slice(1));
      if (box){ box.className = 'syView' + (ids[i] === v ? ' on' : ''); }
    }
    var tabs = document.querySelectorAll('#syTabs .syTab');
    for (i = 0; i < tabs.length; i++){
      var on = (tabs[i].getAttribute('data-v') === v);
      tabs[i].className = 'syTab' + (on ? ' active' : '');
    }
    if (v === 'log'){ renderLog(); }
    if (v === 'cage'){ renderCage(); }
  }
  function updStat(){
    var el = document.getElementById('syStat');
    if (!el){ return; }
    var h = '', tag = '';
    if (phase === 'idle'){ h = '<span>待機中 ▸ 按「起動」開始 LCL 注水</span><b>--</b>'; }
    else if (phase === 'fill'){ h = '<span>LCL 注水中 ▸ 插入栓充填</span><b class="warn">' + Math.round(lcl * 100) + '%</b>'; }
    else if (phase === 'connect'){ h = '<span>A10 神經接續 ▸ 心拍監測</span><b class="warn">CONNECT</b>'; }
    else if (phase === 'launch'){
      var left = Math.max(0, 1 - launchEl / 8500);
      h = '<span>發進倒數 ▸ LAUNCH SEQUENCE</span><b class="warn">T-' + (left * 10).toFixed(1) + '</b>';
    }
    else if (phase === 'sync'){
      var cls = mis > 70 ? 'bad' : (mis > 40 ? 'warn' : 'ok');
      h = '<span>同步率 <b>' + sync.toFixed(1) + '%</b> ▸ 不匹配 <b class="' + cls + '">' + Math.round(mis) + '%</b></span>' +
          '<b class="' + cls + '">' + (holding ? 'HOLD' : '待機') + '</b>';
    }
    else if (phase === 'berserk'){ h = '<span>暴　走 ▸ 制御不能</span><b class="bad">' + Math.round(sync) + '%</b>'; }
    else if (phase === 'result' && result){
      tag = result.bers ? 'bad' : 'ok';
      h = '<span>實驗完了 ▸ ' + (result.bers ? '暴走（不匹配）' : '正常完了') + '</span><b class="' + tag + '">' + result.rank + '</b>';
    }
    el.innerHTML = h;
    var b = document.getElementById('syStart');
    if (b){ b.disabled = !(phase === 'idle' || phase === 'result'); }
  }
  function updHold(){
    var b = document.getElementById('syHold');
    if (!b){ return; }
    var on = (phase === 'sync');
    b.disabled = !on;
    b.className = 'syHold' + (holding && on ? ' on' : '');
  }
  function renderCage(){
    var box = document.getElementById('syEq');
    if (box){
      var h = '', i;
      for (i = 0; i < EQ_ORDER.length; i++){
        var k = EQ_ORDER[i], e = EQ[k];
        h += '<button class="syEq' + (k === eq ? ' active' : '') + '" data-eq="' + k + '">' +
               '<b>' + e.nm + '</b><i>' + e.sub + '</i></button>';
      }
      box.innerHTML = h;
      var bs = box.querySelectorAll('.syEq');
      for (i = 0; i < bs.length; i++){
        (function(b){
          b.addEventListener('click', function(){
            eq = b.getAttribute('data-eq'); save(); renderCage(); SFX.click();
            toast('装備 ▸ ' + EQ[eq].nm);
          });
        })(bs[i]);
      }
    }
    var bars = document.getElementById('syBars');
    if (bars){
      var hp = Math.max(0, Math.min(100, armor));
      var cls = hp < 40 ? ' low' : '';
      bars.innerHTML =
        '<div class="syBar"><span>裝　甲</span><div class="track"><div class="fill' + cls + '" style="width:' + hp + '%"></div></div><div class="vv">' + hp + '%</div></div>' +
        '<div class="syBar"><span>神經接續</span><div class="track"><div class="fill" style="width:100%"></div></div><div class="vv">100%</div></div>' +
        '<div class="syBar"><span>同步增益</span><div class="track"><div class="fill" style="width:' + Math.min(100, EQ[eq].s * 62) + '%"></div></div><div class="vv">×' + EQ[eq].s.toFixed(2) + '</div></div>' +
        '<div class="syBar"><span>不匹配係數</span><div class="track"><div class="fill' + (EQ[eq].m > 1.2 ? ' low' : '') + '" style="width:' + Math.min(100, EQ[eq].m * 62) + '%"></div></div><div class="vv">×' + EQ[eq].m.toFixed(2) + '</div></div>';
    }
  }
  function renderLog(){
    var big = document.getElementById('syBig');
    if (big){
      big.innerHTML =
        '<div><b>' + stats.best.toFixed(1) + '%</b><span>最高同步</span></div>' +
        '<div><b>' + stats.runs + '</b><span>實驗次數</span></div>' +
        '<div><b>' + stats.bers + '</b><span>暴走次數</span></div>';
    }
    var box = document.getElementById('syRecList');
    if (!box){ return; }
    var h = '', i;
    for (i = 0; i < log.length; i++){
      var r = log[i];
      var col = r.bers ? '#FF5040' : (r.rank === 'S' ? '#F5C400' : (r.rank === 'A' ? '#33FF66' : '#C8C8C8'));
      h += '<div class="syRec' + (r.bers ? ' bers' : '') + '">' +
             '<div class="rk" style="color:' + col + '">' + r.rank + '</div>' +
             '<div class="vv">' + r.sync.toFixed(1) + '%</div>' +
             '<div class="ds">' + (r.bers ? '同步曲線反轉 ▸ 不匹配 100%' : '正常完了 ▸ 不匹配 ' + r.mis + '%') + '</div>' +
           '</div>';
    }
    box.innerHTML = h || '<div class="avhint" style="text-align:center;margin-top:18px">▸ 尚無實驗記錄</div>';
  }

  /* ---- 绑定 ---- */
  function bindOnce(){
    var tabs = document.querySelectorAll('#syTabs .syTab');
    var i;
    for (i = 0; i < tabs.length; i++){
      (function(t){
        t.addEventListener('click', function(){ SFX.click(); setView(t.getAttribute('data-v')); });
      })(tabs[i]);
    }
    var st = document.getElementById('syStart');
    if (st){ st.addEventListener('click', function(){ start(performance.now()); }); }
    var ab = document.getElementById('syAbort');
    if (ab){ ab.addEventListener('click', function(){
      if (phase === 'idle' || phase === 'result'){ SFX.deny(); return; }
      abort(performance.now());
    }); }
    var hd = document.getElementById('syHold');
    if (hd){
      hd.addEventListener('pointerdown', function(e){
        if (phase !== 'sync'){ return; }
        e.preventDefault();
        holding = true;
        SFX.click();
      });
      hd.addEventListener('pointerup', function(){ holding = false; });
      hd.addEventListener('pointercancel', function(){ holding = false; });
      hd.addEventListener('pointerleave', function(){ holding = false; });
    }
    document.addEventListener('pointerup', function(){ holding = false; });
    var fx = document.getElementById('syFix');
    if (fx){ fx.addEventListener('click', function(){
      armor = 100; save(); renderCage(); SFX.grant(); toast('✓ 装甲 ▸ 修復完了');
    }); }
    var rs = document.getElementById('syReset');
    if (rs){ rs.addEventListener('click', function(){
      armor = 100; eq = 'std'; save(); renderCage(); SFX.click(); toast('實驗體 ▸ 重置');
    }); }
    var rc = document.getElementById('syRecClear');
    if (rc){ rc.addEventListener('click', function(){
      log = []; stats = { runs:0, bers:0, best:0 }; save(); renderLog(); SFX.deny(); toast('已清空實驗記錄');
    }); }
    renderCage(); renderLog();
  }

  /* ---- 主画布：插入栓第一视角 ---- */
  /* ================= 視覺層：蜂巢 / 綠色條紋 / 浮動窗口 ================= */
  function hexPathOn(c, cx, cy, r){
    c.beginPath();
    var i, a, x, y;
    for (i = 0; i < 6; i++){
      a = Math.PI / 180 * (60 * i - 90);
      x = cx + r * Math.cos(a);
      y = cy + r * Math.sin(a);
      if (i === 0){ c.moveTo(x, y); } else { c.lineTo(x, y); }
    }
    c.closePath();
  }
  /* 蜂巢：离屏画一次，之后只 drawImage + 改 globalAlpha（每帧省下 150 次 stroke） */
  function getHexLayer(){
    if (hexLayer){ return hexLayer; }
    hexLayer = document.createElement('canvas');
    hexLayer.width = W; hexLayer.height = H;
    var c2 = hexLayer.getContext('2d');
    var R = 46, hw = R * 1.7320508, vh = R * 1.5, row, col, cx, cy;
    c2.strokeStyle = 'rgba(51,255,102,1)';
    c2.lineWidth = 1;
    for (row = -1; row * vh < H + R * 2; row++){
      for (col = -1; col * hw < W + hw; col++){
        cx = col * hw + ((row % 2) ? hw / 2 : 0);
        cy = row * vh;
        hexPathOn(c2, cx, cy, R);
        c2.stroke();
      }
    }
    return hexLayer;
  }
  function drawHex(now, lvl){
    var lay = getHexLayer();
    ctx.save();
    ctx.globalAlpha = 0.16 + lvl * 0.46;
    ctx.drawImage(lay, 0, 0);
    ctx.restore();
    /* 暴走时局部格子亮起 */
    if (lvl > 0.55){
      var k;
      for (k = 0; k < 16; k++){
        var px = (k * 263 + 70) % W, py = (k * 157 + 90) % H;
        var on = Math.sin(now / 240 + k * 1.9);
        if (on > 0.35){
          hexPathOn(ctx, px, py, 46);
          ctx.fillStyle = 'rgba(51,255,102,' + (0.09 + 0.20 * (on - 0.35)).toFixed(3) + ')';
          ctx.fill();
          ctx.strokeStyle = 'rgba(51,255,102,' + (0.22 + 0.45 * (on - 0.35)).toFixed(3) + ')';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }
  }
  /* 綠色條紋波動：每條相位錯開，越亂越快 */
  function drawBands(now, lvl){
    if (lvl < 0.03){ return; }
    ctx.save();
    /* lighter 叠加：深红底上才有「绿色荧光条纹」的发光感 */
    ctx.globalCompositeOperation = 'lighter';
    var n = 22, i, y, a, ph, hh;
    for (i = 0; i < n; i++){
      ph = now / (260 + i * 19) + i * 0.85;
      a = (0.5 + 0.5 * Math.sin(ph)) * 0.34 * lvl;
      if (a < 0.010){ continue; }
      y = ((i * 71 + now / 30) % (H + 80)) - 40;
      hh = 6 + 16 * lvl;
      ctx.fillStyle = 'rgba(51,255,102,' + a.toFixed(3) + ')';
      ctx.fillRect(0, y, W, hh);
    }
    if (lvl > 0.35){
      ctx.fillStyle = 'rgba(51,255,102,' + (0.09 * lvl).toFixed(3) + ')';
      for (y = 0; y < H; y += 4){ ctx.fillRect(0, y, W, 1); }
    }
    ctx.restore();
  }
  /* 浮動小窗口 */
  function drawWin(x, y, w, h, title, val, col){
    ctx.save();
    ctx.fillStyle = 'rgba(2,6,4,.74)';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = col; ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    ctx.fillStyle = col;
    ctx.fillRect(x, y, 11, 2); ctx.fillRect(x, y, 2, 11);
    ctx.fillRect(x + w - 11, y + h - 2, 11, 2); ctx.fillRect(x + w - 2, y + h - 11, 2, 11);
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.font = mono(13, '700');
    drawSpaced(title, x + 9, y + 19, 1, 'left');
    ctx.font = mono(19, '700');
    ctx.fillStyle = '#E8E8E8';
    ctx.fillText(val, x + 9, y + 46);
    ctx.restore();
  }
  function drawWins(now){
    var b = (phase === 'berserk');
    var junk = ['ERR', '0x00', '-- --', '???'];
    var j = junk[Math.floor(now / 130) % 4];
    var w1 = 236, gp = 6, x0 = 88, y0 = 126, hh = 60, i;
    var list = [
      ['TARGET', b ? j : (phase === 'idle' ? 'NONE' : 'SACHIEL'), b ? '#FF5040' : '#33FF66'],
      ['PATTERN', b ? 'ERR' : 'BLUE', b ? '#FF5040' : '#33FF66'],
      ['POWER', b ? 'CUT' : 'EXT', b ? '#FF5040' : '#F5C400'],
      ['A10 NERVE', b ? 'LOST' : '100%', b ? '#FF5040' : (phase === 'idle' ? '#6E6E6E' : '#33FF66')]
    ];
    for (i = 0; i < 4; i++){
      var jit = b ? (Math.random() - 0.5) * 6 : 0;
      drawWin(x0 + i * (w1 + gp) + jit, y0, w1, hh, list[i][0], list[i][1], list[i][2]);
    }
  }
  /* 發進倒數：刻度環 + 進度環 + 大數字 + 彈射軌道 */
  function drawCountdown(now, el){
    var pct = Math.max(0, Math.min(1, el / 8500));
    var left = Math.max(0, Math.ceil((1 - pct) * 10));
    var cxx = W / 2, cyy = 300, R = 104;
    var i, a;
    ctx.save();
    /* 外圈刻度 */
    ctx.strokeStyle = 'rgba(51,255,102,.30)'; ctx.lineWidth = 2;
    for (i = 0; i < 60; i++){
      a = Math.PI / 180 * (i * 6 - 90);
      var r1 = R + 14, r2 = R + (i % 5 === 0 ? 28 : 21);
      ctx.beginPath();
      ctx.moveTo(cxx + r1 * Math.cos(a), cyy + r1 * Math.sin(a));
      ctx.lineTo(cxx + r2 * Math.cos(a), cyy + r2 * Math.sin(a));
      ctx.stroke();
    }
    /* 底环 + 进度环 */
    ctx.lineWidth = 7;
    ctx.strokeStyle = 'rgba(51,255,102,.16)';
    ctx.beginPath(); ctx.arc(cxx, cyy, R, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = '#33FF66';
    ctx.shadowColor = 'rgba(51,255,102,.85)'; ctx.shadowBlur = 22;
    ctx.beginPath();
    ctx.arc(cxx, cyy, R, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (1 - pct));
    ctx.stroke();
    ctx.shadowBlur = 0;
    /* 大数字（每跳一格轻弹一下） */
    var frac = ((1 - pct) * 10) % 1;
    var sc = 1 + 0.10 * (1 - frac);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.save();
    ctx.translate(cxx, cyy);
    ctx.scale(sc, sc);
    ctx.fillStyle = '#33FF66';
    ctx.font = mono(134, '700');
    ctx.fillText(left, 0, 4);
    ctx.restore();
    ctx.font = mono(14, '700');
    ctx.fillStyle = 'rgba(51,255,102,.9)';
    drawSpaced('L A U N C H   S E Q U E N C E', cxx, cyy + R + 62, 4, 'center');
    /* 弹射轨道进度 */
    ctx.strokeStyle = 'rgba(51,255,102,.34)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(cxx - 150, cyy + R + 84); ctx.lineTo(cxx + 150, cyy + R + 84); ctx.stroke();
    ctx.fillStyle = '#33FF66';
    ctx.fillRect(cxx - 150, cyy + R + 81, 300 * pct, 7);
    ctx.restore();
  }

  /* ---- 主画布：插入栓第一视角 ---- */
  function render(now){
    var el = now - phaseAt;
    var lvlHex = (phase === 'berserk') ? 1 : (phase === 'sync' ? 0.42 : (phase === 'result' ? 0.08 : 0.26));
    var lvlBand = (phase === 'berserk') ? 1 : (phase === 'sync' ? 0.42 : (phase === 'result' ? 0.06 : (phase === 'launch' ? 0.55 : 0.22)));

    ctx.save();
    if (shake > 0.3){
      ctx.translate((Math.random() - 0.5) * shake * 2, (Math.random() - 0.5) * shake * 2);
    }
    ctx.fillStyle = C.black; ctx.fillRect(-12, -12, W + 24, H + 24);

    /* 背景：舱内深处 */
    var bg = ctx.createRadialGradient(W / 2, H * 0.42, 60, W / 2, H * 0.5, W * 0.78);
    bg.addColorStop(0, 'rgba(' + hexRgb(C.darkred) + ',.28)');
    bg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    /* 蜂巢 + 绿色条纹（叠在底色之上、内容之下） */
    drawHex(now, lvlHex);
    drawBands(now, lvlBand);

    /* LCL 液面 */
    if (lcl > 0){
      var ly = H * (1 - lcl * 1.06);
      var lg = ctx.createLinearGradient(0, ly, 0, H);
      lg.addColorStop(0, 'rgba(255,106,43,.10)');
      lg.addColorStop(1, 'rgba(255,106,43,.26)');
      ctx.fillStyle = lg;
      ctx.fillRect(0, ly, W, H - ly);
      ctx.beginPath();
      var x;
      for (x = 0; x <= W; x += 12){
        var yy = ly + Math.sin((x / 90) + now / 620) * 4;
        if (x === 0){ ctx.moveTo(x, yy); } else { ctx.lineTo(x, yy); }
      }
      ctx.strokeStyle = 'rgba(255,140,80,.42)'; ctx.lineWidth = 2;
      ctx.stroke();
    }

    /* ---- 顶部 HUD ---- */
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = C.red; ctx.font = mono(22, '700');
    ctx.fillText('EVA-01 ▸ ENTRY PLUG', 88, 84);
    ctx.fillStyle = C.gray; ctx.font = mono(15, '700');
    drawSpaced('S Y N C H R O   T E S T', 88, 106, 2, 'left');
    var stt = phase === 'idle' ? 'STANDBY' : phase === 'fill' ? 'LCL FILL' : phase === 'connect' ? 'CONNECT' :
              phase === 'launch' ? 'LAUNCH' : phase === 'sync' ? 'SYNCHRO' :
              phase === 'berserk' ? 'BERSERK' : 'DONE';
    var stc = phase === 'berserk' ? '#FF3B2F' : (phase === 'result' ? C.green :
              (phase === 'launch' ? '#33FF66' : (phase === 'idle' ? C.gray : C.yellow)));
    ctx.textAlign = 'right'; ctx.fillStyle = stc; ctx.font = mono(20, '700');
    ctx.fillText(stt, W - 88, 84);
    ctx.beginPath(); ctx.arc(W - 103, 78, 5, 0, Math.PI * 2);
    ctx.globalAlpha = phase === 'berserk' ? (0.4 + 0.6 * Math.abs(Math.sin(now / 90))) : 0.9;
    ctx.fill(); ctx.globalAlpha = 1;
    ctx.textAlign = 'left';
    ctx.strokeStyle = 'rgba(' + hexRgb(C.red) + ',.34)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(88, 120); ctx.lineTo(W - 88, 120); ctx.stroke();

    /* ---- 四格浮動窗口 ---- */
    drawWins(now);

    /* ---- 中央：倒计时 / 同步率 ---- */
    var bigY = 330;
    var isB = (phase === 'berserk');
    if (phase === 'launch'){
      drawCountdown(now, el);
    }else{
      if (!isB){
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle = C.gray; ctx.font = mono(15, '700');
        drawSpaced('同 期 率 ▸ SYNCHRO RATIO', W / 2, 228, 4, 'center');
      }
      var disp = isB ? Math.round(sync) : (phase === 'idle' ? 0 : sync);
      var numStr = disp.toFixed(1);
      var ncol = isB ? '#FFE4DC' : (sync >= 80 ? C.yellow : (sync >= 40 ? C.white : C.gray));
      if (phase === 'idle' || phase === 'result'){
        ncol = phase === 'result' && result ? (result.bers ? '#FF3B2F' : C.green) : C.gray;
      }
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = ncol; ctx.font = mono(104, '700');
      var nw = ctx.measureText(numStr).width;
      ctx.fillText(numStr, W / 2 - 26, bigY);
      ctx.font = mono(38, '700');
      ctx.textAlign = 'left';
      ctx.fillText('%', W / 2 - 26 + nw / 2 + 12, bigY + 24);
      ctx.textAlign = 'center';

      /* 波形 */
      var wvY = 410, wvW = W - 320;
      ctx.strokeStyle = 'rgba(255,255,255,.10)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(W / 2 - wvW / 2, wvY); ctx.lineTo(W / 2 + wvW / 2, wvY); ctx.stroke();
      if (phase !== 'idle'){
        ctx.beginPath();
        var px;
        for (px = 0; px <= wvW; px += 4){
          var amp = (sync / 100) * (isB ? 1 : 0.7) + mis / 100 * 0.5;
          var yy2 = wvY + Math.sin(px / 26 + now / 190) * amp * 20 *
                    (1 + 0.6 * Math.sin(px / 9 + now / 90));
          if (px === 0){ ctx.moveTo(W / 2 - wvW / 2, yy2); } else { ctx.lineTo(W / 2 - wvW / 2 + px, yy2); }
        }
        ctx.strokeStyle = isB ? '#FF3B2F' : 'rgba(' + hexRgb(C.red) + ',.9)';
        ctx.lineWidth = 2; ctx.stroke();
      }
    }

    /* ---- 不匹配度条（倒计时阶段不显示） ---- */
    if (phase !== 'launch'){
      var mmY = 448;
      ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      ctx.font = mono(13, '700');
      ctx.fillStyle = C.gray;
      drawSpaced('不匹配度 ▸ MISMATCH', 88, mmY - 10, 3, 'left');
      ctx.textAlign = 'right';
      ctx.fillStyle = mis > 70 ? '#FF3B2F' : (mis > 40 ? C.yellow : '#C8C8C8');
      ctx.font = mono(18, '700');
      ctx.fillText(Math.round(mis) + '%', W - 88, mmY - 10);
      ctx.textAlign = 'left';
      ctx.fillStyle = 'rgba(255,255,255,.08)';
      ctx.fillRect(88, mmY, W - 176, 12);
      var mg = ctx.createLinearGradient(88, 0, W - 88, 0);
      mg.addColorStop(0, '#33FF66'); mg.addColorStop(0.45, C.yellow);
      mg.addColorStop(0.8, '#FF6A2B'); mg.addColorStop(1, '#FF3B2F');
      ctx.fillStyle = mg;
      ctx.fillRect(88, mmY, (W - 176) * (mis / 100), 12);
      ctx.strokeStyle = 'rgba(255,59,47,.8)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(W - 88, mmY - 3); ctx.lineTo(W - 88, mmY + 15); ctx.stroke();
    }

    /* ---- 通讯窗口 ---- */
    var cy = 498, ch = 166, cx0 = 88, cw = W - 176;
    ctx.fillStyle = (phase === 'berserk') ? 'rgba(0,0,0,.95)' : 'rgba(4,2,2,.88)';
    ctx.fillRect(cx0, cy, cw, ch);
    var bcol = cur ? cur.col : 'rgba(255,255,255,.18)';
    ctx.strokeStyle = bcol; ctx.lineWidth = 2;
    ctx.strokeRect(cx0 + 0.5, cy + 0.5, cw - 1, ch - 1);

    if (cur){
      ctx.beginPath(); ctx.arc(cx0 + 58, cy + 52, 28, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,0,0,.7)'; ctx.fill();
      ctx.strokeStyle = bcol; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = cur.col; ctx.font = cn(26, '700');
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(cur.n.charAt(0), cx0 + 58, cy + 53);

      ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = cur.col; ctx.font = mono(18, '700');
      drawSpaced(cur.n + ' ▸ ' + cur.j, cx0 + 98, cy + 44, 2, 'left');
      ctx.fillStyle = 'rgba(255,255,255,.26)'; ctx.font = mono(11);
      drawSpaced('▸ 通 信 ▸ 音声のみ', cx0 + 98, cy + 65, 2, 'left');

      var shown = Math.min(cur.jp.length, Math.floor((now - cur.at) / 26));
      var jpS = cur.jp.substring(0, shown);
      var cnS = cur.cn.substring(0, Math.max(0, shown - 4));
      ctx.fillStyle = C.white; ctx.font = cn(30);
      fitShow(jpS, cx0 + 30, cy + 114, cw - 60, 30);
      ctx.fillStyle = '#CFC7BC'; ctx.font = cn(22);
      fitShow(cnS, cx0 + 30, cy + 152, cw - 60, 22);
      if (shown < cur.jp.length && Math.floor(now / 300) % 2){
        ctx.fillStyle = C.red;
        ctx.fillRect(cx0 + 30, cy + 162, 10, 3);
      }
    }else{
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = '#4A4A4A'; ctx.font = mono(17);
      drawSpaced('▸ 通 信 待 機 ▸ 無 信 號', cx0 + cw / 2, cy + ch / 2, 3, 'center');
      ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    }

    /* ---- 结果页 ---- */
    if (phase === 'result' && result){
      ctx.fillStyle = 'rgba(0,0,0,.74)';
      ctx.fillRect(0, 0, W, H);
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      var rcol = result.bers ? '#FF3B2F' : (result.rank === 'S' ? C.yellow : C.green);
      ctx.fillStyle = C.gray; ctx.font = mono(18, '700');
      drawSpaced(result.bers ? '実 験 中 止 ▸ 暴 走' : '実 験 完 了 ▸ 正 常', W / 2, 200, 4, 'center');
      ctx.fillStyle = rcol; ctx.font = mono(150, '700');
      ctx.fillText(result.rank, W / 2, 330);
      ctx.fillStyle = C.white; ctx.font = mono(60, '700');
      drawSpaced(result.sync.toFixed(1) + '%', W / 2, 462, 4, 'center');
      ctx.fillStyle = C.gray; ctx.font = mono(17);
      drawSpaced(result.bers ? '不匹配度 100% ▸ 同步曲線反轉' : '不匹配度 ' + result.mis + '%', W / 2, 516, 2, 'center');
      ctx.fillStyle = 'rgba(255,255,255,.42)'; ctx.font = mono(15);
      drawSpaced('按「起動」再來一次 ▸ 或到「記錄」看歷史', W / 2, 570, 2, 'center');
      ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    }

    /* ---- 暴走特效：红屏 + 初号机眼睛 ---- */
    if (isB){
      var ba = 0.40 + 0.22 * Math.abs(Math.sin(now / 110));
      var vg = ctx.createRadialGradient(W / 2, H * 0.45, 180, W / 2, H * 0.45, W * 0.72);
      vg.addColorStop(0, 'rgba(255,20,10,0)');
      vg.addColorStop(0.55, 'rgba(255,20,10,' + (ba * 0.35).toFixed(3) + ')');
      vg.addColorStop(1, 'rgba(200,10,4,' + ba.toFixed(3) + ')');
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, W, H);
      var ey = 200, ein = 78, eout = 168, eh = 64;
      ctx.save();
      ctx.globalAlpha = 0.74 + 0.22 * Math.abs(Math.sin(now / 140));
      ctx.shadowColor = 'rgba(255,240,120,1)';
      ctx.shadowBlur = 58;
      ctx.fillStyle = '#FFF6B0';
      /* 左眼（杏仁形：外眼角 → 内眼角 → 下缘） */
      ctx.beginPath();
      ctx.moveTo(W / 2 - ein - eout, ey + 6);
      ctx.quadraticCurveTo(W / 2 - ein - eout * 0.35, ey - 10, W / 2 - ein, ey + eh / 2);
      ctx.quadraticCurveTo(W / 2 - ein - eout * 0.35, ey + eh + 10, W / 2 - ein - eout, ey + eh - 6);
      ctx.closePath(); ctx.fill();
      /* 右眼（镜像） */
      ctx.beginPath();
      ctx.moveTo(W / 2 + ein + eout, ey + 6);
      ctx.quadraticCurveTo(W / 2 + ein + eout * 0.35, ey - 10, W / 2 + ein, ey + eh / 2);
      ctx.quadraticCurveTo(W / 2 + ein + eout * 0.35, ey + eh + 10, W / 2 + ein + eout, ey + eh - 6);
      ctx.closePath(); ctx.fill();
      /* 瞳芯：更亮的一点 */
      ctx.shadowBlur = 26;
      ctx.fillStyle = '#FFFFFF';
      ctx.globalAlpha = 0.55 + 0.35 * Math.abs(Math.sin(now / 200));
      ctx.beginPath();
      ctx.ellipse(W / 2 - ein - eout * 0.55, ey + eh / 2, 26, 11, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath();
      ctx.ellipse(W / 2 + ein + eout * 0.55, ey + eh / 2, 26, 11, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }

    ctx.restore();
    drawCorners(W, H);
  }

  /* 单行超宽自动缩字号 */
  function fitShow(str, x, y, maxW, fs0){
    if (!str){ return; }
    var fs = fs0;
    while (ctx.measureText(str).width > maxW && fs > 14){
      fs -= 2;
      ctx.font = cn(fs);
    }
    ctx.fillText(str, x, y);
  }
  function hexRgb(h){
    h = h.replace('#', '');
    if (h.length === 3){ h = h.charAt(0) + h.charAt(0) + h.charAt(1) + h.charAt(1) + h.charAt(2) + h.charAt(2); }
    return parseInt(h.substring(0, 2), 16) + ',' + parseInt(h.substring(2, 4), 16) + ',' + parseInt(h.substring(4, 6), 16);
  }

  load();
  return {
    activate: function(){
      cv.width = W; cv.height = H;
      if (!bound){ bound = true; bindOnce(); }
      setView('run'); updStat(); updHold();
    },
    tick: function(now){
      var dt = lastNow ? Math.min(0.06, (now - lastNow) / 1000) : 0;
      lastNow = now;
      update(now, dt);
      render(now);
    }
  };
})();

registerApp({
  id: 'synchro',
  glyph: '挿',
  no: 'APP-16',
  label: '起動実験',
  color: '#8A5CF0',
  panel: SY_PANEL
}, synchroApp);
