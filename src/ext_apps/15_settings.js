/* ===== APP-15 設定（機體配色 ▸ 資料管理） ===== */
var SET_CSS = '<style>' +
  '.setGrid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px}' +
  '.setCard{border:1px solid #333;border-radius:6px;background:#070707;padding:0;overflow:hidden;' +
    'cursor:pointer;text-align:left;font-family:inherit}' +
  '.setCard.active{border-color:var(--ac);box-shadow:0 0 12px rgba(var(--ac-rgb),.35)}' +
  '.setCard b{display:block;height:34px;width:100%}' +
  '.setCard span{display:block;font-size:12px;font-weight:700;color:#E8E0D6;padding:7px 9px 0;letter-spacing:.04em}' +
  '.setCard i{display:block;font-family:"Courier New",monospace;font-size:9px;color:#6E6E6E;' +
    'font-style:normal;padding:2px 9px 8px;letter-spacing:.1em}' +
  '#panel-settings{padding-bottom:14px}' +
  '</style>';

var SET_PANEL = SET_CSS +
  '<label class="fl">▸ 機體配色 ▸ 立即生效</label>' +
  '<div class="setGrid" id="setThemes"></div>' +
  '<label class="fl">▸ 資料管理</label>' +
  '<div class="btnrow">' +
    '<button class="mainbtn ghostbtn" id="setClrPhone">清除通話記錄</button>' +
    '<button class="mainbtn ghostbtn" id="setClrSms">重置短信</button>' +
  '</div>' +
  '<div class="avhint">▸ 配色會記住 ▸ 下次開啟自動套用 ▸ 不影響任何 APP 的資料</div>';

var settingsApp = (function(){
  var W = 1080, H = 760;
  var bound = false, armed = '';

  function themes(){
    var E = window.EVA;
    if (E && E.THEMES && E.THEME_ORDER){ return { T:E.THEMES, O:E.THEME_ORDER }; }
    return { T:{ nerv:{ id:'nerv', name:'NERV 標準', sub:'汎用 ▸ 赤', ac:'#D42027', bg:'#0F0F0F' } }, O:['nerv'] };
  }
  function curId(){
    var E = window.EVA;
    if (E && E.getTheme){ return E.getTheme().id; }
    return 'nerv';
  }
  function renderCards(){
    var box = document.getElementById('setThemes');
    if (!box){ return; }
    var d = themes(), h = '', i;
    var cid = curId();
    for (i = 0; i < d.O.length; i++){
      var t = d.T[d.O[i]];
      var grad = 'linear-gradient(90deg,' + t.ac + ' 0%,' + t.ac + ' 48%,' + t.bg + ' 52%,' + t.bg + ' 100%)';
      h += '<button class="setCard' + (t.id === cid ? ' active' : '') + '" data-th="' + t.id + '">' +
             '<b style="background:' + grad + '"></b>' +
             '<span>' + t.name + '</span>' +
             '<i>' + t.sub + '</i>' +
           '</button>';
    }
    box.innerHTML = h;
    var bs = box.querySelectorAll('.setCard');
    for (i = 0; i < bs.length; i++){
      (function(b){
        b.addEventListener('click', function(){
          var id = b.getAttribute('data-th');
          if (window.EVA && window.EVA.applyTheme){ window.EVA.applyTheme(id); }
          SFX.grant();
          var nm = (themes().T[id] || {}).name || id;
          toast('已切換 ▸ ' + nm);
          renderCards();
        });
      })(bs[i]);
    }
  }
  function askClear(which){
    if (armed !== which){
      armed = which;
      toast('再點一次確認 ▸ ' + (which === 'phone' ? '清除通話記錄' : '重置短信'));
      SFX.beep();
      setTimeout(function(){ if (armed === which){ armed = ''; } }, 3200);
      return;
    }
    armed = '';
    try{
      if (which === 'phone'){ localStorage.removeItem('eva_phone_log'); }
      else { localStorage.removeItem('eva_sms_v1'); }
      toast('已清除 ▸ 重新進入該 APP 生效');
      SFX.grant();
    }catch(e){ toast('清除失敗'); SFX.deny(); }
  }
  function bindOnce(){
    renderCards();
    var p = document.getElementById('setClrPhone');
    if (p){ p.addEventListener('click', function(){ askClear('phone'); }); }
    var s = document.getElementById('setClrSms');
    if (s){ s.addEventListener('click', function(){ askClear('sms'); }); }
  }
  function render(now){
    ctx.fillStyle = C.black; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = C.black; ctx.fillRect(0, 0, W, H);
    var g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, 'rgba(' + rgbOf(C.darkred) + ',0)');
    g.addColorStop(1, 'rgba(' + rgbOf(C.darkred) + ',0.22)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    /* 网格 */
    ctx.strokeStyle = 'rgba(' + rgbOf(C.red) + ',.07)'; ctx.lineWidth = 1;
    var i;
    for (i = 0; i <= W; i += 80){ ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, H); ctx.stroke(); }
    for (i = 0; i <= H; i += 80){ ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(W, i); ctx.stroke(); }

    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = C.red; ctx.font = mono(22, '700');
    ctx.fillText('SYSTEM CONFIG ▸ APP-15', 60, 72);
    ctx.textAlign = 'right'; ctx.fillStyle = C.gray; ctx.font = mono(16);
    ctx.fillText('NERV ▸ TERMINAL SETUP', W - 60, 72);

    ctx.textAlign = 'left';
    ctx.fillStyle = C.white; ctx.font = cn(72, '900');
    drawSpaced('設定', 60, 178, 12, 'left');
    ctx.fillStyle = C.gray; ctx.font = mono(16);
    drawSpaced('UNIT COLOR ▸ DATA ▸ SYSTEM', 60, 210, 4, 'left');

    /* 四张皮肤卡 */
    var d = themes(), cid = curId();
    var cw = 470, chh = 190, i2;
    for (i2 = 0; i2 < d.O.length; i2++){
      var t = d.T[d.O[i2]];
      var col = i2 % 2, row = Math.floor(i2 / 2);
      var x = 60 + col * (cw + 20), y = 250 + row * (chh + 16);
      var sel = (t.id === cid);
      /* 卡底 */
      ctx.fillStyle = sel ? 'rgba(' + rgbOf(t.ac) + ',.14)' : 'rgba(0,0,0,.5)';
      ctx.fillRect(x, y, cw, chh);
      ctx.strokeStyle = sel ? t.ac : 'rgba(255,255,255,.18)';
      ctx.lineWidth = sel ? 3 : 1;
      ctx.strokeRect(x + 0.5, y + 0.5, cw - 1, chh - 1);
      /* 左侧色块 */
      ctx.fillStyle = t.ac;
      ctx.fillRect(x + 1, y + 1, 10, chh - 2);
      ctx.fillStyle = t.bg;
      ctx.fillRect(x + 11, y + 1, 6, chh - 2);
      /* 名称 */
      ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = sel ? C.white : '#B8B0A6';
      ctx.font = cn(46, '700');
      ctx.fillText(t.name, x + 38, y + 68);
      /* 副标题 */
      ctx.fillStyle = sel ? t.ac : C.gray;
      ctx.font = mono(20);
      drawSpaced(t.sub, x + 40, y + 106, 2, 'left');
      /* 色点 */
      ctx.fillStyle = t.ac;
      ctx.beginPath(); ctx.arc(x + 46, y + 146, 15, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = t.bg;
      ctx.beginPath(); ctx.arc(x + 86, y + 146, 15, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(x + 86, y + 146, 15, 0, Math.PI * 2); ctx.stroke();
      /* 选中标记 */
      ctx.textAlign = 'right';
      if (sel){
        ctx.fillStyle = t.ac; ctx.font = mono(16, '700');
        drawSpaced('ACTIVE', x + cw - 26, y + 56, 3, 'right');
        var pulse = 0.45 + 0.55 * Math.abs(Math.sin(now / 480));
        ctx.globalAlpha = pulse;
        ctx.fillStyle = t.ac;
        ctx.fillRect(x + cw - 26 - 74, y + 70, 74, 2);
        ctx.globalAlpha = 1;
      }else{
        ctx.fillStyle = 'rgba(255,255,255,.24)'; ctx.font = mono(15);
        drawSpaced('SELECT', x + cw - 26, y + 56, 3, 'right');
      }
    }
    /* 底部信息 */
    var apps = (window.EVA && window.EVA.APPS) ? Object.keys(window.EVA.APPS).length : 0;
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.strokeStyle = 'rgba(' + rgbOf(C.red) + ',.35)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(60, H - 96); ctx.lineTo(W - 60, H - 96); ctx.stroke();
    ctx.fillStyle = '#8E8E8E'; ctx.font = mono(18);
    drawSpaced('EVA TERMINAL ▸ v2.3 ▸ APPS ' + pad2(apps) + ' ▸ THEME ' + cid.toUpperCase(), 106, H - 48, 3, 'left');
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(255,255,255,.34)';
    drawSpaced('NERV 第3新東京市', W - 106, H - 48, 2, 'right');
    drawCorners(W, H);
  }
  function pad2(n){ return (n < 10 ? '0' : '') + n; }
  function rgbOf(h){
    h = h.replace('#', '');
    if (h.length === 3){ h = h.charAt(0) + h.charAt(0) + h.charAt(1) + h.charAt(1) + h.charAt(2) + h.charAt(2); }
    return parseInt(h.substring(0, 2), 16) + ',' + parseInt(h.substring(2, 4), 16) + ',' + parseInt(h.substring(4, 6), 16);
  }
  return {
    activate: function(){
      cv.width = W; cv.height = H;
      if (!bound){ bound = true; bindOnce(); }
      renderCards();
    },
    tick: function(now){ render(now); }
  };
})();

registerApp({
  id: 'settings',
  glyph: '設',
  no: 'APP-15',
  label: '設定',
  color: '#8A5CF0',
  dock: true,
  panel: SET_PANEL
}, settingsApp);
