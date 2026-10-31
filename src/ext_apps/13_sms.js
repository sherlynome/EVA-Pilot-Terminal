/* ===== APP-13 短信（NERV 通信 ▸ 会話 ▸ 自動返信） ===== */
var SMS_CSS = '<style>' +
  '#panel-sms{padding-bottom:14px}' +
  '.smsRow{display:flex;align-items:center;gap:10px;min-height:58px;padding:9px 11px;margin-top:6px;' +
    'border:1px solid #2E2E2E;border-radius:6px;background:#070707;cursor:pointer}' +
  '.smsRow:active{background:#130708;border-color:var(--ac)}' +
  '.smsRow .av{width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;' +
    'font-size:15px;font-weight:900;flex:0 0 auto;background:#050505}' +
  '.smsRow .mid{flex:1;min-width:0}' +
  '.smsRow .nm{font-size:13px;font-weight:700;color:#E8E0D6;letter-spacing:.04em}' +
  '.smsRow .pv{font-size:11px;color:#7A7A7A;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
  '.smsRow .rt{font-family:"Courier New",monospace;font-size:10px;color:#5E5E5E;flex:0 0 auto;align-self:flex-start;margin-top:2px}' +
  '.smsBg{display:inline-block;min-width:17px;height:17px;line-height:17px;text-align:center;border-radius:9px;' +
    'background:var(--ac);color:var(--ac-on);font-family:"Courier New",monospace;font-size:10px;font-weight:700;margin-left:6px}' +
  '.smsTop{display:flex;align-items:center;gap:10px;min-height:46px;padding:4px 2px 8px;border-bottom:1px solid #2A2A2A;margin-bottom:8px}' +
  '.smsTop .who{flex:1;min-width:0}' +
  '.smsTop .who b{display:block;font-size:13px;color:#E8E0D6;letter-spacing:.04em}' +
  '.smsTop .who i{display:block;font-family:"Courier New",monospace;font-size:9px;color:#5E5E5E;font-style:normal;letter-spacing:.12em;margin-top:2px}' +
  '.smsBack{height:40px;padding:0 12px;border-radius:5px;background:#050505;border:1px solid #3B3B3B;' +
    'color:#B4ACA2;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;flex:0 0 auto}' +
  '.smsSend{height:46px;flex:0 0 78px;border-radius:5px;background:var(--ac);color:var(--ac-on);border:none;' +
    'font-size:13px;font-weight:900;letter-spacing:.08em;cursor:pointer;font-family:inherit}' +
  '.smsSend:disabled{opacity:.4}' +
  '#panel-sms input.txt{height:46px}' +
  '</style>';

var SMS_PANEL = SMS_CSS +
  '<div id="smsListWrap"></div>' +
  '<div id="smsChatWrap" style="display:none">' +
    '<div class="smsTop">' +
      '<button class="smsBack" id="smsBack">◀ 一覧</button>' +
      '<div class="who"><b id="smsWho">—</b><i id="smsRole">—</i></div>' +
    '</div>' +
    '<div class="irow" style="margin-top:0;flex-wrap:nowrap">' +
      '<input class="txt" id="smsInput" placeholder="輸入訊息…" maxlength="80">' +
      '<button class="smsSend" id="smsSend">送信</button>' +
    '</div>' +
    '<div class="avhint">▸ 送信後約 2 秒自動回信 ▸ 日文原文 + 中文翻譯 ▸ 會話自動保存</div>' +
  '</div>';

var smsApp = (function(){
  var W = 1080, H = 1000;
  var KEY = 'eva_sms_v1';
  var view = 'list', cur = null, bound = false, pending = null, dirty = true;
  var replyIdx = {};

  var SEED = [
    { id:'ritsuko', name:'赤木律子', jp:'赤木リツコ', role:'技術開発部 博士 / 技术开发部 博士', col:'#8A5CF0', msgs:[
      { s:'in', t:'初号機のシンクロ率、計測を始めます。', c:'初号机的同步率，开始计测。', at:'21:04' },
      { s:'out', t:'了解。', c:'明白。', at:'21:05' },
      { s:'in', t:'数値に異常なし。ただ……精神波形にノイズがあるわ。', c:'数值无异常。只是……精神波形里有噪声。', at:'21:09' },
      { s:'in', t:'明日 09:00、中央ドグマ。遅れないで。', c:'明天 9:00，中央教条区。别迟到。', at:'21:10' }
    ]},
    { id:'misato', name:'葛城美里', jp:'葛城ミサト', role:'作戦部一課 部長 / 作战部一课 部长', col:'#E8412A', msgs:[
      { s:'in', t:'シンジ君、今日の作戦は中止。ゆっくり休んで。', c:'真嗣，今天的作战取消了。好好休息。', at:'19:22' },
      { s:'out', t:'わかりました。', c:'我知道了。', at:'19:31' },
      { s:'in', t:'冷蔵庫のビール、飲まないでよ？', c:'冰箱里的啤酒，不许喝哦？', at:'19:33' },
      { s:'in', t:'……あ、それ私の。', c:'……啊，那是我的。', at:'19:33' }
    ]},
    { id:'rei', name:'绫波丽', jp:'綾波レイ', role:'零号機パイロット / 零号机驾驶员', col:'#7FD8E8', msgs:[
      { s:'in', t:'……あなたは、死ぬの？', c:'……你，会死吗？', at:'02:14' },
      { s:'out', t:'死なないよ。', c:'不会死的。', at:'02:15' },
      { s:'in', t:'嘘。みんな死ぬ。', c:'骗人。大家都会死。', at:'02:16' },
      { s:'in', t:'でも、私は記録する。', c:'但是，我会记录下来。', at:'02:16' }
    ]},
    { id:'shinji', name:'碇真嗣', jp:'碇シンジ', role:'初号機パイロット / 初号机驾驶员', col:'#5FD35F', msgs:[
      { s:'in', t:'エントリープラグ、怖いんだ。', c:'插入栓，我很害怕。', at:'23:40' },
      { s:'out', t:'大丈夫。俺もだ。', c:'没事。我也一样。', at:'23:42' },
      { s:'in', t:'……逃げちゃダメだ、って言い聞かせてる。', c:'……我一直在告诉自己，不能逃。', at:'23:43' }
    ]},
    { id:'kaji', name:'加持良治', jp:'加持リョウジ', role:'調査部 / 调查部', col:'#F5C400', msgs:[
      { s:'in', t:'スイカ、届けておいたよ。', c:'西瓜，我给你送过去了。', at:'17:02' },
      { s:'in', t:'それと、これを読んだら消して。', c:'还有，看完这个就删掉。', at:'17:03' },
      { s:'out', t:'なにこれ？', c:'这是什么？', at:'17:06' },
      { s:'in', t:'大人の事情、ってやつさ。', c:'就是所谓「大人的事情」。', at:'17:07' }
    ]},
    { id:'asuka', name:'明日香', jp:'惣流・アスカ・ラングレー', role:'弐号機パイロット / 二号机驾驶员', col:'#F5A623', msgs:[
      { s:'in', t:'ちょっと、あんたバカ？', c:'喂，你是白痴吗？', at:'20:11' },
      { s:'in', t:'同期率で負けたら承知しないからね。', c:'要是同步率输给我，我可不饶你。', at:'20:12' },
      { s:'out', t:'わかった。', c:'知道了。', at:'20:14' },
      { s:'in', t:'……一人で平気よ。ずっとそうしてきたんだから。', c:'……一个人也没关系。我一直都是这样过来的。', at:'20:41' }
    ]},
    { id:'kaworu', name:'渚薰', jp:'渚カヲル', role:'第5適格者 / 第17使徒', col:'#C9A8FF', msgs:[
      { s:'in', t:'やあ、碇君。歌はいいね。歌は心を潤す。', c:'你好，碇君。歌真好啊。歌能滋润心灵。', at:'23:58' },
      { s:'in', t:'僕は君と会う為に生まれてきたんだね。', c:'我大概是为了与你相遇才出生的。', at:'23:59' },
      { s:'out', t:'どうして、そんなことが言えるの？', c:'你为什么能说出这种话？', at:'00:01' },
      { s:'in', t:'人の心はガラスでできている。特に君の心は、とても繊細で……', c:'人的心是玻璃做的。尤其是你的心，非常纤细……', at:'00:02' }
    ]},
    { id:'hikki', name:'洞木光', jp:'洞木ヒカリ', role:'2年A組 委員長 / 班长', col:'#F0C8D8', msgs:[
      { s:'in', t:'明日香ちゃん、今日も元気ないね。', c:'明日香，今天也没什么精神呢。', at:'18:20' },
      { s:'in', t:'委員長として、見逃せません！', c:'作为班长，我可不能坐视不管！', at:'18:21' },
      { s:'out', t:'ありがとう。', c:'谢谢。', at:'18:30' },
      { s:'in', t:'みんなでお弁当、食べようよ。', c:'大家一起来吃便当吧。', at:'18:31' }
    ]}
  ];
  var REPLY = {
    ritsuko:[['……データは嘘をつきません。','……数据不会说谎。'],['了解。記録しておくわ。','明白了。我会记录。'],['その質問には答えられない。','这个问题我无法回答。']],
    misato:[['了解！じゃ、あとでね。','了解！那就待会儿见。'],['ビール、冷やしておいて。','啤酒，帮我冰着。'],['……真面目な話、無理はしないで。','……说正经的，别勉强自己。']],
    rei:[['……そう。','……是吗。'],['私は、ここにいる。','我，在这里。'],['あなたの声、記録した。','你的声音，我记下了。']],
    shinji:[['……うん。','……嗯。'],['ごめん、ちょっと考えさせて。','抱歉，让我想一想。'],['逃げちゃダメだ……よね。','不能逃……对吧。']],
    kaji:[['大人の事情、ってやつさ。','就是所谓「大人的事情」。'],['いい質問だ。','好问题。'],['……そのうちわかる。','……你迟早会明白的。']],
    asuka:[['あんたバカ？','你是白痴吗？'],['あたしに任せなさいよ。全部。','全都交给我吧。'],['……ま、いっか。あとで話すわ。','……算了。之后再说。']],
    kaworu:[['また会えるよ、碇君。','还会再见的，碇君。'],['生と死は同じだ。死は唯一の絶対的自由だ。','生与死是一样的。死是唯一的绝对自由。'],['君の声は、とても綺麗だ。','你的声音，很好听。']],
    hikki:[['無理しなくていいんだよ。','不用勉强的。'],['みんなでお弁当、食べようよ。','大家一起来吃便当吧。'],['委員長として、見逃せません！','作为班长，我可不能坐视不管！']]
  };
  var CONTACTS = [];

  function stamp(){
    var d = new Date();
    var h = d.getHours(), m = d.getMinutes();
    return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
  }
  function load(){
    var raw = null;
    try{ raw = localStorage.getItem(KEY); }catch(e){}
    if (raw){
      try{
        var j = JSON.parse(raw);
        if (j && j.length === SEED.length){ CONTACTS = j; return; }
      }catch(e){}
    }
    CONTACTS = JSON.parse(JSON.stringify(SEED));
  }
  function save(){
    try{ localStorage.setItem(KEY, JSON.stringify(CONTACTS)); }catch(e){}
  }
  function byId(id){
    var i;
    for (i = 0; i < CONTACTS.length; i++){ if (CONTACTS[i].id === id){ return CONTACTS[i]; } }
    return null;
  }
  function lastOf(c){
    if (!c.msgs.length){ return { t:'（無会話 / 无对话）', at:'--:--' }; }
    var m = c.msgs[c.msgs.length - 1];
    return { t: (m.c || m.t), at: m.at, out: (m.s === 'out') };
  }
  /* ---- 列表渲染（DOM，可点） ---- */
  function renderList(){
    var box = document.getElementById('smsListWrap');
    if (!box) return;
    var h = '', i;
    for (i = 0; i < CONTACTS.length; i++){
      var c = CONTACTS[i], lm = lastOf(c);
      var un = c.unread || 0;
      h += '<div class="smsRow" data-c="' + c.id + '">' +
             '<div class="av" style="border:1px solid ' + c.col + ';color:' + c.col + '">' + c.name.charAt(0) + '</div>' +
             '<div class="mid">' +
               '<div class="nm">' + c.name + (un ? '<span class="smsBg">' + un + '</span>' : '') + '</div>' +
               '<div class="pv">' + (lm.out ? '▸ ' : '') + lm.t + '</div>' +
             '</div>' +
             '<div class="rt">' + lm.at + '</div>' +
           '</div>';
    }
    box.innerHTML = h;
    var rows = box.querySelectorAll('.smsRow');
    for (i = 0; i < rows.length; i++){
      (function(r){
        r.addEventListener('click', function(){ enter(r.getAttribute('data-c')); });
      })(rows[i]);
    }
  }
  function showView(v){
    view = v;
    var l = document.getElementById('smsListWrap'), c = document.getElementById('smsChatWrap');
    if (l){ l.style.display = (v === 'list') ? 'block' : 'none'; }
    if (c){ c.style.display = (v === 'chat') ? 'block' : 'none'; }
    dirty = true;
  }
  function enter(id){
    var c = byId(id);
    if (!c) return;
    cur = id;
    c.unread = 0;
    save();
    var who = document.getElementById('smsWho'), role = document.getElementById('smsRole');
    if (who){ who.textContent = c.name; }
    if (role){ role.textContent = c.role + ' ▸ ENCRYPTED'; }
    showView('chat');
    renderList();
    var inp = document.getElementById('smsInput');
    if (inp){ inp.value = ''; }
  }
  function send(){
    if (!cur){ return; }
    var inp = document.getElementById('smsInput');
    if (!inp) return;
    var t = (inp.value || '').replace(/^\s+|\s+$/g, '');
    if (!t){ SFX.deny(); toast('請輸入內容'); return; }
    var c = byId(cur);
    if (!c) return;
    c.msgs.push({ s:'out', t:t, c:'', at:stamp() });
    inp.value = '';
    save();
    dirty = true;
    SFX.stamp();
    renderList();
    /* 自动回复：交给 tick 计时，切走再回来也能触发 */
    var pool = REPLY[cur] || [['……','……']];
    var idx = replyIdx[cur] || 0;
    replyIdx[cur] = (idx + 1) % pool.length;
    var pr = pool[idx];
    pending = { at: new Date().getTime() + 1500 + Math.random() * 1400, who: cur, text: pr[0], cn: pr[1] };
  }
  function bindOnce(){
    var b = document.getElementById('smsBack');
    if (b){ b.addEventListener('click', function(){
      cur = null; pending = null;
      showView('list'); renderList();
    }); }
    var s = document.getElementById('smsSend');
    if (s){ s.addEventListener('click', send); }
    var inp = document.getElementById('smsInput');
    if (inp){
      inp.addEventListener('keydown', function(e){
        if (e.key === 'Enter' || e.keyCode === 13){ e.preventDefault(); send(); }
      });
    }
    renderList();
  }
  /* ---- 文字折行 ---- */
  function wrap(text, maxW, font){
    var out = [], line = '', i, ch;
    ctx.font = font;
    for (i = 0; i < text.length; i++){
      ch = text.charAt(i);
      if (ch === '\n'){ out.push(line); line = ''; continue; }
      if (line && ctx.measureText(line + ch).width > maxW){ out.push(line); line = ch; }
      else { line += ch; }
    }
    if (line){ out.push(line); }
    return out.length ? out : [''];
  }
  /* ---- 画布 ---- */
  function renderListCanvas(now){
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = C.red; ctx.font = mono(22, '700');
    ctx.fillText('NERV 通信 ▸ APP-13', 84, 84);
    ctx.textAlign = 'right'; ctx.fillStyle = C.gray; ctx.font = mono(16);
    ctx.fillText('SECURE CHANNEL', W - 84, 84);
    ctx.textAlign = 'left';
    ctx.fillStyle = C.white; ctx.font = cn(84, '900');
    drawSpaced('短信', 84, 230, 14, 'left');
    ctx.fillStyle = C.gray; ctx.font = mono(18);
    drawSpaced('MESSAGES ▸ ' + CONTACTS.length + ' THREADS', 84, 272, 5, 'left');

    /* 头像网格 */
    var cols = 3, cw = (W - 168) / cols, chh = 210, i;
    for (i = 0; i < CONTACTS.length; i++){
      var c = CONTACTS[i];
      var cx = 84 + (i % cols) * cw + cw / 2;
      var cy = 380 + Math.floor(i / cols) * chh;
      var un = c.unread || 0;
      ctx.beginPath(); ctx.arc(cx, cy, 52, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fill();
      ctx.strokeStyle = c.col; ctx.lineWidth = 3; ctx.stroke();
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = c.col; ctx.font = cn(46, '700');
      ctx.fillText(c.name.charAt(0), cx, cy + 2);
      ctx.fillStyle = C.gray; ctx.font = mono(15, '700');
      ctx.fillText(c.name.length > 6 ? c.name.substring(0, 6) : c.name, cx, cy + 86);
      if (un){
        ctx.beginPath(); ctx.arc(cx + 40, cy - 40, 16, 0, Math.PI * 2);
        ctx.fillStyle = C.red; ctx.fill();
        ctx.fillStyle = C.white; ctx.font = mono(16, '700');
        ctx.textBaseline = 'middle';
        ctx.fillText('' + un, cx + 40, cy - 40);
      }
    }
    /* 底部统计 */
    var total = 0, unread = 0;
    for (i = 0; i < CONTACTS.length; i++){ total += CONTACTS[i].msgs.length; unread += (CONTACTS[i].unread || 0); }
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.strokeStyle = 'rgba(' + rgb(C.red) + ',.4)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(84, H - 190); ctx.lineTo(W - 84, H - 190); ctx.stroke();
    ctx.fillStyle = C.gray; ctx.font = mono(16);
    drawSpaced('TOTAL ' + total + ' MSG ▸ UNREAD ' + unread, 84, H - 148, 3, 'left');
    var blink = (Math.sin(now / 520) > 0) ? 1 : 0.28;
    ctx.globalAlpha = blink;
    ctx.fillStyle = C.red; ctx.font = mono(15, '700');
    ctx.textAlign = 'right';
    drawSpaced('▸ SELECT THREAD BELOW', W - 84, H - 148, 3, 'right');
    ctx.globalAlpha = 1;
  }
  function renderChatCanvas(now){
    var c = byId(cur);
    if (!c){ renderListCanvas(now); return; }
    /* 顶部 */
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = c.col; ctx.font = mono(19, '700');
    drawSpaced(c.name + ' ▸ ' + (c.jp || ''), 84, 76, 2, 'left');
    ctx.fillStyle = C.gray; ctx.font = mono(14);
    drawSpaced('NERV 通信 ▸ APP-13 ▸ ENCRYPTED', 84, 108, 2, 'left');
    ctx.strokeStyle = 'rgba(' + rgb(C.red) + ',.35)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(84, 130); ctx.lineTo(W - 84, 130); ctx.stroke();

    /* 气泡：从底部往上排 */
    var msgs = c.msgs;
    var start = Math.max(0, msgs.length - 6);
    var vis = msgs.slice(start);
    var maxW = W * 0.58;
    var lh = 34, lh2 = 27, padX = 26, padY = 16;
    var bottom = H - 130;
    var y = bottom, i;
    var laid = [];
    for (i = vis.length - 1; i >= 0; i--){
      var m = vis[i];
      var font = cn(26), fcn = cn(21);
      var lines = wrap(m.t, maxW - padX * 2, font);
      var cls = m.c ? wrap(m.c, maxW - padX * 2, fcn) : [];
      var wid = 0, k;
      for (k = 0; k < lines.length; k++){
        ctx.font = font;
        wid = Math.max(wid, ctx.measureText(lines[k]).width);
      }
      for (k = 0; k < cls.length; k++){
        ctx.font = fcn;
        wid = Math.max(wid, ctx.measureText(cls[k]).width);
      }
      wid += padX * 2;
      var bh = lines.length * lh + (cls.length ? cls.length * lh2 + 6 : 0) + padY * 2 - 8;
      y -= bh;
      laid.unshift({ m:m, lines:lines, cls:cls, w:wid, h:bh, y:y });
      y -= 16;
    }
    /* 绘制 */
    for (i = 0; i < laid.length; i++){
      var b = laid[i], x, isOut = (b.m.s === 'out');
      if (isOut){ x = W - 84 - b.w; }
      else { x = 84; }
      /* 气泡体 */
      ctx.beginPath();
      roundRect(x, b.y, b.w, b.h, 14);
      if (isOut){
        ctx.fillStyle = 'rgba(' + rgb(C.red) + ',.22)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(' + rgb(C.red) + ',.85)'; ctx.lineWidth = 2; ctx.stroke();
      }else{
        ctx.fillStyle = 'rgba(255,255,255,.055)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.lineWidth = 1.5; ctx.stroke();
      }
      /* 文字 */
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillStyle = isOut ? C.white : '#DCD4CA';
      ctx.font = cn(26);
      for (k = 0; k < b.lines.length; k++){
        ctx.fillText(b.lines[k], x + padX, b.y + padY + k * lh + lh / 2 - 4);
      }
      /* 中文译文：日文原文下面一行，小一号、压暗 */
      if (b.cls.length){
        ctx.font = cn(21);
        ctx.fillStyle = isOut ? '#E6D4D0' : '#B6AEA4';
        for (k = 0; k < b.cls.length; k++){
          ctx.fillText(b.cls[k], x + padX, b.y + padY + b.lines.length * lh + 4 + k * lh2);
        }
      }
      /* 时间 */
      ctx.fillStyle = C.gray; ctx.font = mono(13);
      ctx.textAlign = isOut ? 'right' : 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText((isOut ? '送信 ' : '') + b.m.at, isOut ? (x + b.w) : x, b.y + b.h + 20);
    }
    /* 待回复提示 */
    if (pending){
      var dp = Math.abs(Math.sin(now / 320));
      ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = 'rgba(' + rgb(c.col) + ',' + (0.35 + dp * 0.55).toFixed(2) + ')';
      ctx.font = mono(15, '700');
      drawSpaced('相手 ▸ 入力中 …', 84, H - 76, 3, 'left');
    }
    ctx.textAlign = 'left';
  }
  function roundRect(x, y, w, h, r){
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  function rgb(h){
    h = h.replace('#', '');
    if (h.length === 3){ h = h.charAt(0) + h.charAt(0) + h.charAt(1) + h.charAt(1) + h.charAt(2) + h.charAt(2); }
    return parseInt(h.substring(0, 2), 16) + ',' + parseInt(h.substring(2, 4), 16) + ',' + parseInt(h.substring(4, 6), 16);
  }
  function render(now){
    ctx.fillStyle = C.black; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = C.black; ctx.fillRect(0, 0, W, H);
    var g = ctx.createLinearGradient(0, H * 0.35, 0, H);
    g.addColorStop(0, 'rgba(' + rgb(C.darkred) + ',0)');
    g.addColorStop(1, 'rgba(' + rgb(C.darkred) + ',0.20)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(' + rgb(C.red) + ',.07)'; ctx.lineWidth = 1;
    var i;
    for (i = 0; i <= H; i += 80){ ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(W, i); ctx.stroke(); }
    if (view === 'list'){ renderListCanvas(now); } else { renderChatCanvas(now); }
    drawCorners(W, H);
  }
  load();
  return {
    activate: function(){
      cv.width = W; cv.height = H;
      if (!bound){ bound = true; bindOnce(); }
      if (cur){
        var c = byId(cur);
        if (c){
          var who = document.getElementById('smsWho'), role = document.getElementById('smsRole');
          if (who){ who.textContent = c.name; }
          if (role){ role.textContent = c.role + ' ▸ ENCRYPTED'; }
        }
        showView('chat');
      }else{ showView('list'); }
      renderList();
      dirty = true;
    },
    tick: function(now){
      if (pending && now >= pending.at){
        var c = byId(pending.who);
        if (c){ c.msgs.push({ s:'in', t:pending.text, c:pending.cn || '', at:stamp() }); save(); }
        pending = null;
        dirty = true;
        SFX.grant();
        renderList();
      }
      render(now);
    }
  };
})();

registerApp({
  id: 'sms',
  glyph: '信',
  no: 'APP-13',
  label: '短信',
  color: '#7FD8E8',
  dock: true,
  panel: SMS_PANEL
}, smsApp);
