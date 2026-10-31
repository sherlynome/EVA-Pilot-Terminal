/* ===== APP-14 相冊（12 枚 ▸ 全部程序生成 ▸ 可保存 PNG） ===== */
var ALB_CSS = '<style>' +
  '.albStrip{display:flex;flex-wrap:nowrap;gap:7px;overflow-x:auto;padding:6px 2px 10px;' +
    'scrollbar-width:none;-webkit-overflow-scrolling:touch}' +
  '.albStrip::-webkit-scrollbar{display:none;height:0}' +
  '.albTh{flex:0 0 auto;width:74px;height:56px;border-radius:4px;border:1px solid #333;cursor:pointer;' +
    'position:relative;overflow:hidden;padding:0;background:#050505}' +
  '.albTh.active{border-color:var(--ac);box-shadow:0 0 12px rgba(var(--ac-rgb),.42)}' +
  '.albTh i{position:absolute;left:3px;bottom:2px;font-family:"Courier New",monospace;font-size:8px;' +
    'font-style:normal;color:#fff;text-shadow:0 0 4px #000,0 0 3px #000;font-weight:700;z-index:2}' +
  '.albTh b{position:absolute;left:0;right:0;top:0;bottom:0;z-index:1}' +
  '#panel-album{padding-bottom:14px}' +
  '</style>';

var ALB_PANEL = ALB_CSS +
  '<label class="fl">▸ 12 枚 ▸ 點選切換</label>' +
  '<div class="albStrip" id="albStrip"></div>' +
  '<div class="btnrow">' +
    '<button class="mainbtn" id="albSave">保存這張 ▸ PNG</button>' +
  '</div>' +
  '<div class="avhint" id="albInfo">—</div>';

var albumApp = (function(){
  var W = 1080, H = 1080;
  var idx = 0, bound = false, cache = {};
  var ALBUM = [
    { t:'第3新東京市 ▸ 全景', loc:'TOKYO-3 ▸ SURFACE', d:'2026.07.14 18:22', mode:0, seed:17,
      css:'linear-gradient(160deg,#12203F 0%,#2C3F6E 42%,#F5A623 78%,#D42027 100%)' },
    { t:'十字架之光', loc:'CENTRAL DOGMA', d:'2026.07.14 18:41', mode:1, seed:93,
      css:'radial-gradient(circle at 50% 40%,#FF6A2B 0%,#8B0009 34%,#0A0A0A 78%)' },
    { t:'AT力場 ▸ 展開', loc:'ENCOUNTER ▸ 4TH', d:'2026.07.15 03:12', mode:2, seed:41,
      css:'radial-gradient(circle at 50% 50%,rgba(255,106,43,.55) 0%,#0F0F0F 62%)' },
    { t:'LCL ▸ 注入', loc:'ENTRY PLUG ▸ UNIT-01', d:'2026.07.15 05:30', mode:3, seed:7,
      css:'linear-gradient(180deg,#C4560F 0%,#F5A623 46%,#7A2A06 100%)' },
    { t:'MAGI ▸ 三賢人', loc:'MATERIALS CENTER', d:'2026.07.15 09:18', mode:4, seed:61,
      css:'linear-gradient(120deg,#06120C 0%,#14361F 50%,#33FF66 100%)' },
    { t:'地下都市 ▸ 第7層', loc:'GEOFRONT', d:'2026.07.16 01:07', mode:5, seed:29,
      css:'linear-gradient(180deg,#03110A 0%,#0C2A1A 58%,#1F5C33 100%)' },
    { t:'零號機 ▸ 整備中', loc:'CAGE ▸ UNIT-00', d:'2026.07.16 04:44', mode:2, seed:113,
      css:'radial-gradient(circle at 42% 46%,#7FD8E8 0%,#123A4A 40%,#050D12 100%)' },
    { t:'月 ▸ 沉默', loc:'OLD TOKYO ▸ REMAINS', d:'2026.07.16 22:51', mode:5, seed:71,
      css:'linear-gradient(180deg,#060912 0%,#131B33 62%,#2A3455 100%)' },
    { t:'插入栓 ▸ ENTRY PLUG', loc:'CAGE ▸ 起動試驗', d:'2026.07.17 07:15', mode:3, seed:131,
      css:'linear-gradient(180deg,#2A0A05 0%,#C4560F 48%,#F5C400 100%)' },
    { t:'NERV 本部 ▸ 走廊', loc:'HQ ▸ B1F', d:'2026.07.17 11:33', mode:4, seed:53,
      css:'linear-gradient(180deg,#0A0A0A 0%,#1A0607 60%,#5A0A10 100%)' },
    { t:'橙色的海', loc:'PACIFIC ▸ COAST', d:'2026.07.17 17:49', mode:1, seed:101,
      css:'linear-gradient(180deg,#F5C400 0%,#FF6A2B 34%,#8B0009 100%)' },
    { t:'星空 ▸ 永遠', loc:'ORBIT ▸ MOON', d:'2026.07.18 02:00', mode:5, seed:191,
      css:'radial-gradient(circle at 62% 32%,#3A4A8A 0%,#080C1A 62%,#000 100%)' }
  ];

  /* 确定性随机（Lehmer） */
  function rng(seed){
    var s = seed % 2147483647;
    if (s <= 0){ s += 2147483646; }
    return function(){ s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
  }
  function pad2(n){ return (n < 10 ? '0' : '') + n; }

  /* ---------- 场景绘制（全部走传入的 ctx，不碰全局） ---------- */
  function scene(g, i, w, h){
    var it = ALBUM[i], R = rng(it.seed), j, k;
    g.save();
    g.beginPath(); g.rect(0, 0, w, h); g.clip();
    /* 底色 */
    var bg = g.createLinearGradient(0, 0, w * 0.3, h);
    if (it.mode === 0){ bg.addColorStop(0, '#0E1A33'); bg.addColorStop(0.55, '#2C3F6E'); bg.addColorStop(1, '#F5A623'); }
    else if (it.mode === 1){ bg.addColorStop(0, '#120302'); bg.addColorStop(0.6, '#3A0708'); bg.addColorStop(1, '#0A0202'); }
    else if (it.mode === 2){ bg.addColorStop(0, '#080808'); bg.addColorStop(1, '#180506'); }
    else if (it.mode === 3){ bg.addColorStop(0, '#8E2E06'); bg.addColorStop(0.5, '#E07A12'); bg.addColorStop(1, '#3A0A02'); }
    else if (it.mode === 4){ bg.addColorStop(0, '#050D08'); bg.addColorStop(1, '#0C2418'); }
    else { bg.addColorStop(0, '#04060C'); bg.addColorStop(1, '#0B1120'); }
    g.fillStyle = bg; g.fillRect(0, 0, w, h);

    if (it.mode === 0){
      /* 城市天际线 */
      g.fillStyle = '#F5C400';
      g.globalAlpha = 0.75;
      g.beginPath(); g.arc(w * 0.72, h * 0.34, w * 0.075, 0, Math.PI * 2); g.fill();
      g.globalAlpha = 1;
      var base = h * 0.72;
      for (j = 0; j < 26; j++){
        var bw = w * (0.022 + R() * 0.04);
        var bx = (j / 26) * w + R() * 8;
        var bh = h * (0.05 + R() * 0.30);
        g.fillStyle = 'rgba(6,10,20,' + (0.72 + R() * 0.24).toFixed(2) + ')';
        g.fillRect(bx, base - bh, bw, bh + h);
        /* 窗灯 */
        g.fillStyle = 'rgba(245,196,0,' + (0.15 + R() * 0.45).toFixed(2) + ')';
        var wy, wx;
        for (wy = base - bh + 12; wy < base - 10; wy += 16){
          for (wx = bx + 5; wx < bx + bw - 5; wx += 11){
            if (R() > 0.62){ g.fillRect(wx, wy, 3, 5); }
          }
        }
      }
      g.fillStyle = '#05070C'; g.fillRect(0, base, w, h - base);
    }
    else if (it.mode === 1){
      /* 十字光柱 */
      var cw = w * 0.085;
      var lg = g.createLinearGradient(0, 0, 0, h);
      lg.addColorStop(0, 'rgba(255,106,43,0)');
      lg.addColorStop(0.28, 'rgba(255,106,43,.88)');
      lg.addColorStop(0.7, 'rgba(245,196,0,.62)');
      lg.addColorStop(1, 'rgba(255,106,43,0)');
      g.fillStyle = lg; g.fillRect(w / 2 - cw / 2, 0, cw, h);
      var hg = g.createLinearGradient(0, h * 0.42, w, h * 0.42);
      hg.addColorStop(0, 'rgba(245,196,0,0)');
      hg.addColorStop(0.5, 'rgba(255,220,140,.72)');
      hg.addColorStop(1, 'rgba(245,196,0,0)');
      g.fillStyle = hg; g.fillRect(0, h * 0.42 - h * 0.035, w, h * 0.07);
      g.globalCompositeOperation = 'lighter';
      for (j = 0; j < 90; j++){
        var px = w / 2 + (R() - 0.5) * w * 0.5;
        var py = R() * h;
        g.fillStyle = 'rgba(255,220,150,' + (0.10 + R() * 0.55).toFixed(2) + ')';
        g.fillRect(px, py, 2 + R() * 3, 2 + R() * 3);
      }
      g.globalCompositeOperation = 'source-over';
    }
    else if (it.mode === 2){
      /* AT 力场：同心八边形 */
      var oct = function(cx, cy, r, col, lw){
        g.beginPath();
        for (k = 0; k < 8; k++){
          var a = Math.PI / 8 + k * Math.PI / 4;
          var px2 = cx + Math.cos(a) * r, py2 = cy + Math.sin(a) * r;
          if (k === 0){ g.moveTo(px2, py2); } else { g.lineTo(px2, py2); }
        }
        g.closePath();
        g.strokeStyle = col; g.lineWidth = lw; g.stroke();
      };
      var cx = w * 0.5, cy = h * 0.48;
      for (j = 0; j < 7; j++){
        oct(cx, cy, w * (0.09 + j * 0.055), 'rgba(255,106,43,' + (0.62 - j * 0.07).toFixed(2) + ')', 2.5);
      }
      g.fillStyle = 'rgba(255,106,43,.18)';
      g.beginPath(); g.arc(cx, cy, w * 0.075, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#FF6A2B';
      g.beginPath(); g.arc(cx, cy, w * 0.028, 0, Math.PI * 2); g.fill();
    }
    else if (it.mode === 3){
      /* LCL 液面 */
      var hz = h * 0.52;
      for (j = 0; j < 16; j++){
        g.fillStyle = 'rgba(245,196,0,' + (0.04 + R() * 0.11).toFixed(2) + ')';
        var yy = hz + j * (h - hz) / 16;
        g.fillRect(0, yy, w, (h - hz) / 32);
      }
      g.strokeStyle = 'rgba(255,255,255,.30)'; g.lineWidth = 2;
      g.beginPath(); g.moveTo(0, hz); g.lineTo(w, hz); g.stroke();
      /* 气泡 */
      g.globalCompositeOperation = 'lighter';
      for (j = 0; j < 34; j++){
        var bx2 = R() * w, by2 = hz + R() * (h - hz);
        var br = 2 + R() * 9;
        g.beginPath(); g.arc(bx2, by2, br, 0, Math.PI * 2);
        g.fillStyle = 'rgba(255,235,180,' + (0.10 + R() * 0.35).toFixed(2) + ')';
        g.fill();
      }
      g.globalCompositeOperation = 'source-over';
    }
    else if (it.mode === 4){
      /* 走廊透视 */
      var vx = w * 0.5, vy = h * 0.46;
      g.strokeStyle = 'rgba(255,255,255,.10)'; g.lineWidth = 1.5;
      for (j = 0; j < 22; j++){
        var ang = (j / 22) * Math.PI * 2;
        g.beginPath(); g.moveTo(vx, vy);
        g.lineTo(vx + Math.cos(ang) * w, vy + Math.sin(ang) * h);
        g.stroke();
      }
      for (j = 1; j < 9; j++){
        var rr2 = Math.pow(j / 9, 2.1) * w * 0.9;
        g.strokeStyle = 'rgba(255,106,43,' + (0.55 - j * 0.045).toFixed(2) + ')';
        g.lineWidth = 2;
        g.strokeRect(vx - rr2 * 0.62, vy - rr2 * 0.42, rr2 * 1.24, rr2 * 0.84);
      }
      g.fillStyle = 'rgba(255,255,255,.85)';
      g.beginPath(); g.arc(vx, vy, 5, 0, Math.PI * 2); g.fill();
    }
    else {
      /* 星空 / 月 */
      g.globalCompositeOperation = 'lighter';
      for (j = 0; j < 220; j++){
        var sx = R() * w, sy = R() * h;
        var ss = R();
        g.fillStyle = 'rgba(200,220,255,' + (0.10 + ss * 0.85).toFixed(2) + ')';
        g.fillRect(sx, sy, ss * 2.4 + 0.6, ss * 2.4 + 0.6);
      }
      var nb = g.createRadialGradient(w * 0.66, h * 0.30, 0, w * 0.66, h * 0.30, w * 0.4);
      nb.addColorStop(0, 'rgba(120,150,255,.20)');
      nb.addColorStop(1, 'rgba(120,150,255,0)');
      g.fillStyle = nb; g.fillRect(0, 0, w, h);
      g.globalCompositeOperation = 'source-over';
      /* 月 */
      g.fillStyle = 'rgba(232,236,255,.92)';
      g.beginPath(); g.arc(w * 0.24, h * 0.26, w * 0.085, 0, Math.PI * 2); g.fill();
      g.fillStyle = 'rgba(150,158,180,.30)';
      g.beginPath(); g.arc(w * 0.215, h * 0.245, w * 0.024, 0, Math.PI * 2); g.fill();
      g.beginPath(); g.arc(w * 0.268, h * 0.285, w * 0.015, 0, Math.PI * 2); g.fill();
    }
    /* 统一：暗角 + 扫描线 */
    var vg = g.createRadialGradient(w / 2, h / 2, h * 0.28, w / 2, h / 2, h * 0.82);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,.62)');
    g.fillStyle = vg; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(0,0,0,.14)';
    for (j = 0; j < h; j += 4){ g.fillRect(0, j, w, 1.6); }
    g.restore();
  }
  function photo(i){
    if (cache[i]){ return cache[i]; }
    var c = document.createElement('canvas');
    c.width = 960; c.height = 640;
    scene(c.getContext('2d'), i, 960, 640);
    cache[i] = c;
    return c;
  }
  function renderThumbs(){
    var box = document.getElementById('albStrip');
    if (!box){ return; }
    var h = '', i;
    for (i = 0; i < ALBUM.length; i++){
      h += '<button class="albTh' + (i === idx ? ' active' : '') + '" data-i="' + i + '">' +
             '<b style="background:' + ALBUM[i].css + '"></b><i>' + pad2(i + 1) + '</i></button>';
    }
    box.innerHTML = h;
    var bs = box.querySelectorAll('.albTh');
    for (i = 0; i < bs.length; i++){
      (function(b){
        b.addEventListener('click', function(){
          idx = parseInt(b.getAttribute('data-i'), 10) || 0;
          SFX.click();
          renderThumbs();
          updInfo();
        });
      })(bs[i]);
    }
  }
  function updInfo(){
    var el = document.getElementById('albInfo');
    if (!el){ return; }
    var it = ALBUM[idx];
    el.innerHTML = '<b style="color:var(--ac)">' + pad2(idx + 1) + ' / ' + pad2(ALBUM.length) + '</b> ▸ ' +
                   it.t + ' ▸ ' + it.loc + ' ▸ ' + it.d;
  }
  function saveCurrent(){
    var c = photo(idx);
    try{
      c.toBlob(function(b){
        if (b){ downloadBlob(b, fileName('相冊_' + pad2(idx + 1), 'png')); toast('已保存 PNG'); SFX.grant(); }
        else { toast('生成失敗'); SFX.deny(); }
      }, 'image/png');
    }catch(e){ SFX.deny(); toast('匯出失敗'); }
  }
  function bindOnce(){
    var s = document.getElementById('albSave');
    if (s){ s.addEventListener('click', saveCurrent); }
    renderThumbs();
    updInfo();
  }
  function render(now){
    ctx.fillStyle = C.black; ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = C.red; ctx.font = mono(22, '700');
    ctx.fillText('PHOTO ARCHIVE ▸ APP-14', 60, 72);
    ctx.textAlign = 'right'; ctx.fillStyle = C.gray; ctx.font = mono(16);
    ctx.fillText('NERV ▸ CLASSIFIED', W - 60, 72);

    /* 大图 */
    var px = 60, py = 120, pw = 960, ph = 640;
    ctx.fillStyle = '#000';
    ctx.fillRect(px - 4, py - 4, pw + 8, ph + 8);
    try{ ctx.drawImage(photo(idx), px, py, pw, ph); }catch(e){}
    ctx.strokeStyle = C.red; ctx.lineWidth = 2;
    ctx.strokeRect(px - 4, py - 4, pw + 8, ph + 8);

    /* 图注 */
    var it = ALBUM[idx];
    ctx.textAlign = 'left';
    ctx.fillStyle = C.white; ctx.font = cn(38, '700');
    ctx.fillText(it.t, 60, 806);
    ctx.fillStyle = C.gray; ctx.font = mono(18);
    drawSpaced(it.loc + '  ▸  ' + it.d, 60, 842, 3, 'left');

    /* 缩略条 */
    var n = ALBUM.length, tw = 68, gap = 9;
    var totalW = n * tw + (n - 1) * gap;
    var sx = (W - totalW) / 2;
    var i;
    for (i = 0; i < n; i++){
      var tx = sx + i * (tw + gap);
      try{ ctx.drawImage(photo(i), 0, 0, 960, 640, tx, 878, tw, 48); }catch(e){}
      if (i === idx){
        ctx.strokeStyle = C.red; ctx.lineWidth = 3;
        ctx.strokeRect(tx - 2, 876, tw + 4, 52);
        ctx.fillStyle = C.red; ctx.fillRect(tx - 2, 924, tw + 4, 3);
      }else{
        ctx.strokeStyle = 'rgba(255,255,255,.22)'; ctx.lineWidth = 1;
        ctx.strokeRect(tx - 0.5, 877.5, tw + 1, 49);
      }
    }
    /* 计数 */
    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = C.gray; ctx.font = mono(15);
    drawSpaced(pad2(idx + 1) + ' / ' + pad2(n), W / 2, 966, 4, 'center');

    /* 扫描光标 */
    var scan = 878 + (now / 26) % 48;
    ctx.fillStyle = 'rgba(' + rgbOf(C.red) + ',.55)';
    ctx.fillRect(sx, scan, totalW, 1.5);
    drawCorners(W, H);
  }
  function rgbOf(h){
    h = h.replace('#', '');
    if (h.length === 3){ h = h.charAt(0) + h.charAt(0) + h.charAt(1) + h.charAt(1) + h.charAt(2) + h.charAt(2); }
    return parseInt(h.substring(0, 2), 16) + ',' + parseInt(h.substring(2, 4), 16) + ',' + parseInt(h.substring(4, 6), 16);
  }
  return {
    activate: function(){
      cv.width = W; cv.height = H;
      if (!bound){ bound = true; bindOnce(); }
      renderThumbs(); updInfo();
    },
    tick: function(now){ render(now); }
  };
})();

registerApp({
  id: 'album',
  glyph: '寫',
  no: 'APP-14',
  label: '相冊',
  color: '#F5C400',
  dock: true,
  panel: ALB_PANEL
}, albumApp);
