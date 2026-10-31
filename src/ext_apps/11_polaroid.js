/* ============================================================
   APP-11 寫眞沖印（寫眞膠卷沖印機）
   來源：外部 AI 依《EVA驾驶员终端_APP开发规范与接入指南》§5 交付
   維護者改動（接入必需，均已驗證）：
     1) no 由 APP-10 改 APP-11（APP-10 已被音楽室佔用）
     2) rr() / drawCorners() 用的是框架全局 ctx（主畫布），v2 模式下會畫到
        隱藏的主畫布上 → 圓角相框底板整個消失、四角裝飾不顯示。
        改為本 APP 私有 roundRect() / cornerMarks()，全部走面板自己的 ctx
     3) 選中態 class 由 'on' 改 'active'（框架 CSS 只有 .chip.active）
   ============================================================ */

/* ---------- 面板私有样式：预览台吸顶 + 参数横条 ---------- */
var PLD_CSS = '<style>' +
  '#pldStage{position:sticky;top:0;z-index:30;background:#080808;padding:6px 0 8px;margin:0 -2px 8px;border-bottom:1px solid #2A2A2A;box-shadow:0 10px 22px rgba(0,0,0,.78)}' +
  '#pldCv{display:block;margin:0 auto;width:auto;height:auto;max-width:100%;max-height:38vh;background:#0F0F0F;border:1px solid #333}' +
  '.pldStrip{display:flex;flex-wrap:nowrap;gap:8px;overflow-x:auto;overflow-y:hidden;padding:4px 2px 10px;-webkit-overflow-scrolling:touch}' +
  '.pldStrip::-webkit-scrollbar{height:4px}' +
  '.pldStrip::-webkit-scrollbar-thumb{background:#D42027;border-radius:2px}' +
  '.pldStrip .chip{flex:0 0 auto;white-space:nowrap}' +
  /* —— 选项标签：编号 + 方角 + 选中发光 —— */
  '#panel-polaroid .pldStrip{gap:7px;padding:6px 2px 10px}' +
  '#panel-polaroid .pldStrip{scrollbar-width:none;' +
    '-webkit-mask-image:linear-gradient(90deg,#000 0,#000 calc(100% - 20px),transparent 100%)}' +
  '#panel-polaroid .pldStrip::-webkit-scrollbar{display:none;height:0}' +
  '#panel-polaroid .pldStrip .chip{height:40px;padding:0 12px;gap:8px;border-radius:5px;' +
    'background:#0B0708;border:1px solid #3B3B3B;color:#C4BCB2;' +
    'font-family:"Courier New",monospace;font-size:12px;font-weight:700;letter-spacing:0}' +
  '#panel-polaroid .pldStrip .chip .pldNo{font-style:normal;font-size:9px;color:#5E5E5E;letter-spacing:.06em;line-height:1}' +
  '#panel-polaroid .pldStrip .chip.active{border-color:#D42027;color:#fff;' +
    'background:linear-gradient(180deg,rgba(212,32,39,.26),rgba(212,32,39,.06));' +
    'box-shadow:0 0 14px rgba(212,32,39,.3),inset 0 0 0 1px rgba(212,32,39,.4)}' +
  '#panel-polaroid .pldStrip .chip.active .pldNo{color:#FF6A6A}' +
  /* —— 小节标题：左侧红条 + 字距拉开 —— */
  '#panel-polaroid label.fl{color:#E4DCD0;font-size:11.5px;font-weight:700;letter-spacing:.16em;' +
    'margin:16px 0 0;padding-left:11px;position:relative}' +
  '#panel-polaroid label.fl:before{content:"";position:absolute;left:0;top:50%;width:4px;height:11px;' +
    'margin-top:-5.5px;background:#D42027}' +
  '</style>';

var pldApp = (function(){
  var W = 1080, H = 1311;
  var cv = null, ctx = null;
  var inited = false, dirty = true;
  var fileInput = null, targetSlot = 0;

  /* ---------- 狀態 ---------- */
  var spec = 'polaroid';
  var split = {n:1};
  var frameIdx = 0, filterIdx = 0;
  var imgs = [null,null,null,null];
  var labels = ['','','',''];
  var caption = '';

  /* ---------- 相紙規格（1080 邏輯座標，含拍立得真實留邊比例） ---------- */
  var SPECS = {
    mini:    {name:'MINI豎卡', w:1080, h:1720, pl:80,  pr:80,  pt:80,  pb:400},
    square:  {name:'SQUARE',   w:1080, h:1290, pl:76,  pr:76,  pt:76,  pb:284},
    wide:    {name:'WIDE寬幅', w:1080, h:861,  pl:45,  pr:45,  pt:45,  pb:193},
    polaroid:{name:'POLAROID', w:1080, h:1311, pl:58,  pr:58,  pt:58,  pb:317},
    go:      {name:'GO',       w:1080, h:1335, pl:72,  pr:72,  pt:72,  pb:336},
    round:   {name:'圓窗',     w:1080, h:1311, pl:108, pr:108, pt:108, pb:252}
  };
  var SPEC_ORDER = ['mini','square','wide','polaroid','go','round'];
  var SPLITS = {
    mini:[{n:1},{n:2,v:'v'},{n:4}],
    square:[{n:1},{n:2,v:'h'},{n:2,v:'v'},{n:4}],
    wide:[{n:1},{n:2,v:'h'},{n:3,v:'h'},{n:4}],
    polaroid:[{n:1},{n:2,v:'h'},{n:4}],
    go:[{n:1},{n:4}],
    round:[{n:1}]
  };

  /* ---------- 三十種相框（配色遵守調色板 + 註明新增色） ---------- */
  /* 新增色僅用於相框質感（EVA 熒光青 #7FFFD4 / 洋紅 #FF3DF2 / 青 #00B8D4 等，
     均為低飽和底色或描邊，不影響主 UI 調色板） */
  var FRAMES = [
    {n:'① NERV制式',   bg:'#0D0507', border:'#D42027', bw:4, glow:1, winBg:'#050202', cap:'#FF5040', capFont:'mono', extra:'emblem', corners:1},
    {n:'② PATTERN BLUE',bg:'#120404', border:'#7A0E0E', bw:4, winBg:'#0A0202', cap:'#FF5040', capBg:'#1C0505', capFont:'mono', extra:'pblueTop', corners:1},
    {n:'③ 初號機',     bg:'#1A1030', border:'#5FD35F', bw:4, glow:1, cap:'#5FD35F', capFont:'mono'},
    {n:'④ 貳號機',     bgGrad:['#3A0505','#7A0E0E'], border:'#FF3018', bw:4, cap:'#FFD2CC', capFont:'mono', filter:'saturate(1.2) contrast(1.05)'},
    {n:'⑤ 零號機',     bg:'#EFEAE0', border:'#E07820', bw:8, cap:'#B05A10', capFont:'mono', filter:'saturate(0.92) brightness(1.03)'},
    {n:'⑥ MAGI系統',   bg:'#08150F', border:'#7FFFD4', bw:3, glow:1, cap:'#7FFFD4', capFont:'mono'},
    {n:'⑦ CRT終端',    bg:'#010A03', border:'#1F5C33', bw:3, glow:1, cap:'#33FF66', capFont:'mono', filter:'sepia(0.35) hue-rotate(62deg) saturate(2.6) contrast(1.12) brightness(0.88)', ov:'scan', ovScope:'cell'},
    {n:'⑧ 警戒紋',     pattern:'hazard', capBg:'#111111', cap:'#F5C400', capFont:'mono'},
    {n:'⑨ LCL橙',      bg:'#F3E3C2', cap:'#7A4A12', capFont:'cn', filter:'sepia(0.45) saturate(1.55) contrast(1.05)'},
    {n:'⑩ A.T.FIELD',  bg:'#0A0602', border:'#F5A623', bw:3, glow:1, cap:'#F5A623', capFont:'mono', ov:'atf', ovScope:'bg'},
    {n:'⑪ 使徒格紋',   bg:'#0A0A12', cap:'#9FE8D8', capFont:'mono', ov:'angels', ovScope:'bg'},
    {n:'⑫ 微縮檔案',   bg:'#E8E4DA', cap:'#333333', capFont:'mono', extra:'archive'},
    {n:'⑬ 緊急速報',   bg:'#F2EFE8', border:'#C41E1E', bw:12, capBg:'#C41E1E', cap:'#FFFFFF', capFont:'mono'},
    {n:'⑭ 第3新東京夜',bgGrad:['#0A0F2A','#141B3C'], border:'#3D4E8A', bw:3, glow:1, cap:'#8FA8FF', capFont:'mono'},
    {n:'⑮ 綾波白',     bgGrad:['#F0F0F6','#D8DCF0'], border:'#9FA8D8', bw:3, cap:'#5A639A', capFont:'cn', filter:'saturate(0.82) brightness(1.04)'},
    {n:'⑯ 全息青',     bg:'#05080D', border:'#00B8D4', bw:3, glow:1, cap:'#7FE9FF', capFont:'mono', corners:1},
    {n:'⑰ 全息洋紅',   bg:'#0B0510', border:'#C724B8', bw:3, glow:1, cap:'#FF9DF5', capFont:'mono', corners:1},
    {n:'⑱ 賽博紫',     bgGrad:['#2A0A4A','#0A0620'], border:'#9B5CFF', bw:3, glow:1, cap:'#C9A8FF', capFont:'mono', filter:'saturate(1.15) contrast(1.06)', corners:1},
    {n:'⑲ 霓虹粉青',   bg:'#0A0A14', border:'#FF3DF2', bw:3, glow:1, cap:'#3DF2FF', capFont:'mono'},
    {n:'⑳ 電磁藍',     bg:'#020A1E', border:'#2E7CFF', bw:3, glow:1, cap:'#6FA8FF', capFont:'mono'},
    {n:'㉑ 故障藝術',   bg:'#050505', cap:'#00F0FF', capFont:'mono', filter:'contrast(1.3) saturate(1.3)', ov:'glitch', ovScope:'cell'},
    {n:'㉒ 掃描線',     bg:'#02090C', border:'#14424A', bw:3, cap:'#4FD8E8', capFont:'mono', ov:'scanCyan', ovScope:'cell'},
    {n:'㉓ 暗房紅',     bg:'#1A0202', cap:'#C43A3A', capFont:'mono', filter:'sepia(1) hue-rotate(-30deg) saturate(3.2) contrast(1.1) brightness(0.85)'},
    {n:'㉔ 熱成像',     bg:'#0A0306', cap:'#FF7A00', capFont:'mono', filter:'grayscale(1) sepia(1) hue-rotate(-18deg) saturate(6) contrast(1.35) brightness(0.95)'},
    {n:'㉕ 藍曬圖',     bg:'#0D3B66', border:'#CFE8FF', bw:6, cap:'#CFE8FF', capFont:'mono', filter:'grayscale(1) sepia(1) hue-rotate(175deg) saturate(4) contrast(1.05) brightness(0.95)'},
    {n:'㉖ 鈦金屬',     bgGrad:['#C8CDD4','#8E96A2'], cap:'#3A424E', capFont:'mono'},
    {n:'㉗ 啞光黑',     bg:'#101014', radius:30, cap:'#8A8A94', capFont:'mono'},
    {n:'㉘ 啞光白',     bg:'#FBFBF8', radius:30, cap:'#4A4A50', capFont:'cn'},
    {n:'㉙ 霓虹網格',   bgGrad:['#12062E','#1E0A3E'], border:'#E0489E', bw:3, glow:1, cap:'#FF7AC8', capFont:'mono', ov:'grid', ovScope:'bg'},
    {n:'㉚ 電路板',     bg:'#04120A', border:'#1F7A44', bw:3, cap:'#3FCC7A', capFont:'mono', ov:'circuit', ovScope:'bg'}
  ];

  /* ---------- 二十種濾鏡（ctx.filter 字串） ---------- */
  var FILTERS = [
    {n:'原圖',f:''},
    {n:'黑白',f:'grayscale(1) contrast(1.1)'},
    {n:'銀鹽黑白',f:'grayscale(1) contrast(1.4) brightness(0.92)'},
    {n:'懷舊棕',f:'sepia(0.7) contrast(0.95) brightness(1.02)'},
    {n:'褪色',f:'saturate(0.55) contrast(0.85) brightness(1.08) sepia(0.15)'},
    {n:'冷調',f:'hue-rotate(15deg) saturate(0.85) brightness(1.02)'},
    {n:'暖調',f:'sepia(0.3) saturate(1.25) hue-rotate(-10deg)'},
    {n:'高對比',f:'contrast(1.45) saturate(1.15)'},
    {n:'低飽和',f:'saturate(0.4) contrast(1.05)'},
    {n:'反轉負片',f:'invert(1) hue-rotate(180deg)'},
    {n:'復古膠片',f:'sepia(0.35) saturate(1.2) contrast(1.1) brightness(1.03)'},
    {n:'賽博紫',f:'hue-rotate(220deg) saturate(1.6) contrast(1.15)'},
    {n:'熒光綠',f:'hue-rotate(80deg) saturate(2.2) contrast(1.2) brightness(0.95)'},
    {n:'藍調憂鬱',f:'sepia(1) hue-rotate(180deg) saturate(1.4) contrast(1.05)'},
    {n:'蜜糖金',f:'sepia(0.5) saturate(1.4) hue-rotate(-15deg) brightness(1.05)'},
    {n:'曝光過度',f:'brightness(1.45) contrast(1.2) saturate(1.3)'},
    {n:'夜間壓暗',f:'brightness(0.72) contrast(1.25) saturate(1.1)'},
    {n:'漫畫高反差',f:'grayscale(1) contrast(2.2) brightness(1.05)'},
    {n:'X光片',f:'grayscale(1) invert(1) contrast(1.3) brightness(1.1)'},
    {n:'熔岩紅',f:'sepia(1) hue-rotate(-45deg) saturate(4) contrast(1.2)'}
  ];

  /* ---------- 私有工具（全部用本 APP 的 ctx，不碰框架全局 ctx） ---------- */
  function pad2(n){ return (n<10?'0':'')+''+n; }
  function fileNo(){ return 'FILE No.'+pad2(rand(10,99))+'-'+pad2(rand(10,99))+' ▸ 第3新東京市'; }
  function gridOf(s){ if(s.n===1)return[1,1]; if(s.n===4)return[2,2]; return s.v==='h'?[s.n,1]:[1,s.n]; }
  function splitLabel(s){ return s.n===1?'1圖':(s.n===4?'4格':(s.n+'圖'+(s.v==='h'?'·橫':'·豎'))); }
  function setFilter(str){ try{ ctx.filter = str||'none'; }catch(e){} }

  /* 圓角矩形路徑：框架 rr() 寫死用全局 ctx，v2 模式下會畫到隱藏的主畫布 */
  function roundRect(x,y,w,h,r){
    ctx.beginPath();
    ctx.moveTo(x+r,y);
    ctx.arcTo(x+w,y,x+w,y+h,r);
    ctx.arcTo(x+w,y+h,x,y+h,r);
    ctx.arcTo(x,y+h,x,y,r);
    ctx.arcTo(x,y,x+w,y,r);
    ctx.closePath();
  }
  /* 四角裝飾：同上，框架 drawCorners() 也是畫在全局 ctx（m=24, L=64, t=8） */
  function cornerMarks(){
    var m=24, L=64, t=8;
    ctx.fillStyle=C.white;
    ctx.fillRect(m,m,L,t);          ctx.fillRect(m,m,t,L);
    ctx.fillRect(W-m-L,m,L,t);      ctx.fillRect(W-m-t,m,t,L);
    ctx.fillRect(m,H-m-t,L,t);      ctx.fillRect(m,H-m-L,t,L);
    ctx.fillRect(W-m-L,H-m-t,L,t);  ctx.fillRect(W-m-t,H-m-L,t,L);
  }

  function bgFill(f){
    if(f.bgGrad){
      var g = ctx.createLinearGradient(0,0,0,H);
      g.addColorStop(0,f.bgGrad[0]); g.addColorStop(1,f.bgGrad[1]);
      return g;
    }
    return f.bg||'#0F0F0F';
  }
  function drawHazard(c1,c2){
    ctx.fillStyle=c2; ctx.fillRect(0,0,W,H);
    ctx.fillStyle=c1;
    var s=54;
    for(var x=-H; x<W+H; x+=s*2){
      ctx.beginPath();
      ctx.moveTo(x,0); ctx.lineTo(x+s,0); ctx.lineTo(x+s-H,H); ctx.lineTo(x-H,H);
      ctx.closePath(); ctx.fill();
    }
  }
  function drawBgOv(f){
    if(!f.ov || f.ovScope!=='bg') return;
    ctx.save(); ctx.lineWidth=2; var i,x,y;
    if(f.ov==='grid'||f.ov==='circuit'){
      var step=(f.ov==='grid')?44:52;
      ctx.strokeStyle=(f.ov==='grid')?'rgba(224,72,158,0.10)':'rgba(63,204,122,0.10)';
      for(x=step;x<W;x+=step){ ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
      for(y=step;y<H;y+=step){ ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }
    }else if(f.ov==='atf'){
      ctx.strokeStyle='rgba(245,166,35,0.10)';
      for(x=-H;x<W;x+=34){ ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x+H,H); ctx.stroke(); }
      for(x=0;x<W+H;x+=34){ ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x-H,H); ctx.stroke(); }
    }else if(f.ov==='angels'){
      ctx.strokeStyle='rgba(127,255,212,0.09)';
      for(y=28;y<H;y+=28){ ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }
      for(x=-H;x<W;x+=42){ ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x+H,H); ctx.stroke(); }
      for(x=0;x<W+H;x+=42){ ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x-H,H); ctx.stroke(); }
    }
    ctx.restore();
  }
  function drawCover(img,x,y,w,h){
    var ir=img.width/img.height, r=w/h, sw,sh,sx,sy;
    if(ir>r){ sh=img.height; sw=sh*r; sx=(img.width-sw)/2; sy=0; }
    else{ sw=img.width; sh=sw/r; sx=0; sy=(img.height-sh)/2; }
    ctx.drawImage(img,sx,sy,sw,sh,x,y,w,h);
  }
  function cellOv(f,x,y,w,h){
    if(!f.ov || f.ovScope!=='cell') return;
    ctx.save(); ctx.beginPath(); ctx.rect(x,y,w,h); ctx.clip();
    var yy;
    if(f.ov==='scan'){ ctx.fillStyle='rgba(0,0,0,0.32)'; for(yy=y;yy<y+h;yy+=8){ ctx.fillRect(x,yy,w,4); } }
    else if(f.ov==='scanCyan'){ ctx.fillStyle='rgba(79,216,232,0.09)'; for(yy=y;yy<y+h;yy+=8){ ctx.fillRect(x,yy,w,4); } }
    else if(f.ov==='glitch'){
      ctx.fillStyle='rgba(255,0,80,0.14)';  for(yy=y;yy<y+h;yy+=28){ ctx.fillRect(x,yy,w,6); }
      ctx.fillStyle='rgba(0,240,255,0.12)'; for(yy=y+14;yy<y+h;yy+=28){ ctx.fillRect(x,yy,w,4); }
    }
    ctx.restore();
  }
  function drawCell(f,i,x,y,w,h,flt,round){
    ctx.save();
    if(round){
      ctx.beginPath(); ctx.arc(x+w/2,y+h/2,Math.min(w,h)/2,0,Math.PI*2); ctx.clip();
    }
    ctx.fillStyle=f.winBg||'#111111';
    ctx.fillRect(x,y,w,h);
    var img=imgs[i];
    if(img){
      setFilter(flt);
      drawCover(img,x,y,w,h);
      setFilter('');
      cellOv(f,x,y,w,h);
      if(labels[i]){
        ctx.fillStyle='rgba(0,0,0,0.55)';
        ctx.fillRect(x,y+h-52,w,52);
        ctx.fillStyle='#EDEAE0';
        ctx.font=mono(30,'400'); ctx.textAlign='left'; ctx.textBaseline='middle';
        ctx.save(); ctx.beginPath(); ctx.rect(x+12,y+h-52,w-24,52); ctx.clip();
        ctx.fillText(labels[i],x+16,y+h-26);
        ctx.restore();
      }
    }else{
      ctx.strokeStyle='#555555'; ctx.lineWidth=3; ctx.setLineDash([14,10]);
      ctx.strokeRect(x+18,y+18,w-36,h-36); ctx.setLineDash([]);
      ctx.fillStyle='#666666'; ctx.font=mono(56,'400');
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText('＋',x+w/2,y+h/2);
    }
    ctx.restore();
  }

  /* ---------- 全量重繪 ---------- */
  function render(){
    if(!ctx) return;
    var sp=SPECS[spec];
    W=sp.w; H=sp.h;
    cv.width=W; cv.height=H;
    var f=FRAMES[frameIdx];
    /* 底色 / 花紋 */
    ctx.save();
    if(f.pattern==='hazard'){ drawHazard('#F5C400','#111111'); }
    else if(f.radius){ roundRect(0,0,W,H,f.radius); ctx.fillStyle=bgFill(f); ctx.fill(); }
    else{ ctx.fillStyle=bgFill(f); ctx.fillRect(0,0,W,H); }
    drawBgOv(f);
    ctx.restore();
    /* 相片窗 */
    var wx=sp.pl, wy=sp.pt, ww=W-sp.pl-sp.pr, wh=H-sp.pt-sp.pb;
    var g=gridOf(split), gap=28;
    var cw=(ww-gap*(g[0]-1))/g[0], ch=(wh-gap*(g[1]-1))/g[1];
    var flt=((f.filter||'')+' '+(FILTERS[filterIdx].f||'')).replace(/^\s+|\s+$/g,'');
    var r,c,i;
    for(r=0;r<g[1];r++) for(c=0;c<g[0];c++){
      i=r*g[0]+c;
      drawCell(f,i,wx+c*(cw+gap),wy+r*(ch+gap),cw,ch,flt,spec==='round');
    }
    if(spec==='round'&&f.border){
      ctx.strokeStyle=f.border; ctx.lineWidth=f.bw||4;
      ctx.beginPath(); ctx.arc(wx+ww/2,wy+wh/2,Math.min(ww,wh)/2,0,Math.PI*2); ctx.stroke();
    }
    /* 底部標注帶 */
    var cy0=H-sp.pb;
    if(f.capBg){ ctx.fillStyle=f.capBg; ctx.fillRect(0,cy0,W,sp.pb); }
    var textY=cy0+sp.pb/2;
    if(f.extra==='emblem'){
      drawEmblem(ctx,W/2,cy0+sp.pb*0.30,100,f.cap||'#FF5040');
      textY=cy0+sp.pb*0.72;
    }
    if(caption){
      var fs=56;
      ctx.font=(f.capFont==='cn')?cn(fs):mono(fs,'700');
      while(ctx.measureText(caption).width>W-160 && fs>22){
        fs-=4; ctx.font=(f.capFont==='cn')?cn(fs):mono(fs,'700');
      }
      ctx.fillStyle=f.cap; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(caption,W/2,textY);
    }
    /* 裝飾層 */
    if(f.extra==='pblueTop'){
      var bh=36;
      ctx.save(); ctx.beginPath(); ctx.rect(0,0,W,bh); ctx.clip();
      ctx.fillStyle='#1A0505'; ctx.fillRect(0,0,W,bh);
      ctx.fillStyle='#C41E1E';
      for(var x0=-bh;x0<W+bh;x0+=44){
        ctx.beginPath();
        ctx.moveTo(x0,0); ctx.lineTo(x0+20,0); ctx.lineTo(x0+20-bh,bh); ctx.lineTo(x0-bh,bh);
        ctx.closePath(); ctx.fill();
      }
      ctx.restore();
    }
    if(f.extra==='archive'){
      ctx.fillStyle='#999999'; ctx.font=mono(30,'400');
      ctx.textAlign='right'; ctx.textBaseline='middle';
      ctx.fillText('▸ ARCHIVE',W-44,54);
    }
    if(f.border){
      ctx.save();
      var lw=f.bw||4;
      if(f.glow){ ctx.shadowColor=f.border; ctx.shadowBlur=30; }
      ctx.strokeStyle=f.border; ctx.lineWidth=lw;
      if(f.radius){ roundRect(lw/2,lw/2,W-lw,H-lw,f.radius); ctx.stroke(); }
      else{ ctx.strokeRect(lw/2,lw/2,W-lw,H-lw); }
      ctx.restore();
    }
    if(f.corners){ ctx.strokeStyle=f.cap; ctx.lineWidth=4; cornerMarks(); }
  }

  /* ---------- UI（只在首次 activate 綁定一次） ---------- */
  function chipBtn(label,on,fn,num){
    var b=document.createElement('button');
    b.type='button';
    b.className='chip'+(on?' active':'');   /* 框架 CSS 用 .chip.active，不是 .on */
    if(num){
      var k=document.createElement('i');
      k.className='pldNo'; k.textContent=num;
      b.appendChild(k);
    }
    var t=document.createElement('span');
    t.className='pldTxt'; t.textContent=label;
    b.appendChild(t);
    b.addEventListener('click',function(){ SFX.click(); fn(); });
    return b;
  }
  function refreshChips(){
    var sc=document.getElementById('pldSpec'); sc.innerHTML='';
    for(var i=0;i<SPEC_ORDER.length;i++){
      (function(key){
        sc.appendChild(chipBtn(SPECS[key].name, key===spec, function(){
          spec=key;
          var ok=false, arr=SPLITS[key], j;
          for(j=0;j<arr.length;j++){ if(arr[j].n===split.n&&arr[j].v===split.v){ ok=true; } }
          if(!ok) split={n:arr[0].n, v:arr[0].v};
          dirty=true; refreshChips();
        }, pad2(i+1)));
      })(SPEC_ORDER[i]);
    }
    var pc=document.getElementById('pldSplit'); pc.innerHTML='';
    var arr=SPLITS[spec];
    for(var k=0;k<arr.length;k++){
      (function(sp){
        pc.appendChild(chipBtn(splitLabel(sp), sp.n===split.n&&sp.v===split.v, function(){
          split={n:sp.n, v:sp.v}; dirty=true; refreshChips();
        }, pad2(k+1)));
      })(arr[k]);
    }
    var fc=document.getElementById('pldFrames'); fc.innerHTML='';
    for(var m=0;m<FRAMES.length;m++){
      (function(idx){
        fc.appendChild(chipBtn(FRAMES[idx].n.replace(/^[\u2460-\u2473\u3251-\u325f]\s*/,''), idx===frameIdx, function(){
          frameIdx=idx; dirty=true; refreshChips();
        }, pad2(idx+1)));
      })(m);
    }
    var lc=document.getElementById('pldFilters'); lc.innerHTML='';
    for(var q=0;q<FILTERS.length;q++){
      (function(idx){
        lc.appendChild(chipBtn(FILTERS[idx].n, idx===filterIdx, function(){
          filterIdx=idx; dirty=true; refreshChips();
        }, pad2(idx+1)));
      })(q);
    }
    centerActive('pldSpec'); centerActive('pldSplit');
    centerActive('pldFrames'); centerActive('pldFilters');
  }
  /* 横滑条里把当前选中项滚到可视中间，省得来回找 */
  function centerActive(id){
    var box=document.getElementById(id); if(!box){ return; }
    var act=box.querySelector('.chip.active'); if(!act){ return; }
    box.scrollLeft = Math.max(0, act.offsetLeft - box.clientWidth/2 + act.offsetWidth/2);
  }
  function refreshSlots(){
    for(var i=0;i<4;i++){
      var b=document.getElementById('pldUp'+i);
      if(b) b.textContent = imgs[i] ? ('圖'+(i+1)+' ✓') : ('圖'+(i+1));
    }
  }
  function initUI(){
    /* 隱藏檔案輸入 */
    fileInput=document.createElement('input');
    fileInput.type='file'; fileInput.accept='image/*'; fileInput.style.display='none';
    document.body.appendChild(fileInput);
    fileInput.addEventListener('change',function(e){
      var t=e.target.files&&e.target.files[0];
      if(!t) return;
      var im=new Image();
      im.onload=function(){ imgs[targetSlot]=im; dirty=true; refreshSlots(); };
      im.src=URL.createObjectURL(t);
      fileInput.value='';
    });
    for(var i=0;i<4;i++){
      (function(i){
        var b=document.getElementById('pldUp'+i);
        b.addEventListener('click',function(){ SFX.click(); targetSlot=i; fileInput.click(); });
      })(i);
    }
    for(var j=0;j<4;j++){
      (function(j){
        var ip=document.getElementById('pldLab'+j);
        ip.addEventListener('input',function(){ labels[j]=ip.value; dirty=true; });
      })(j);
    }
    var ci=document.getElementById('pldCap');
    ci.addEventListener('input',function(){ caption=ci.value; dirty=true; });
    /* 按鈕 */
    var noBtn=document.getElementById('pldNo');
    noBtn.addEventListener('click',function(){
      SFX.click();
      for(var i=0;i<4;i++){ if(!labels[i]){ labels[i]=fileNo(); document.getElementById('pldLab'+i).value=labels[i]; } }
      if(!caption){ caption=fileNo(); document.getElementById('pldCap').value=caption; }
      dirty=true;
    });
    var clrBtn=document.getElementById('pldClear');
    clrBtn.addEventListener('click',function(){
      SFX.click();
      imgs=[null,null,null,null]; labels=['','','','']; caption='';
      for(var i=0;i<4;i++){ document.getElementById('pldLab'+i).value=''; }
      document.getElementById('pldCap').value='';
      dirty=true; refreshSlots(); toast('已清空');
    });
    var goBtn=document.getElementById('pldGo');
    goBtn.addEventListener('click',function(){
      if(busy) return;
      busy=true; goBtn.disabled=true;
      var old=goBtn.textContent; goBtn.textContent='沖印中…';
      dirty=true; render();
      setTimeout(function(){
        cv.toBlob(function(blob){
          if(blob){ downloadBlob(blob, fileName('寫眞沖印','png')); toast('已保存 PNG'); SFX.grant(); }
          else{ toast('生成失敗，請重試'); SFX.deny(); }
          busy=false; goBtn.disabled=false; goBtn.textContent=old;
        },'image/png');
      },60);
    });
    refreshChips(); refreshSlots();
  }

  return {
    activate: function(){
      cv=document.getElementById('pldCv');
      if(cv&&!ctx){ ctx=cv.getContext('2d'); }
      if(!inited&&cv){ inited=true; initUI(); }
      dirty=true;
    },
    tick: function(now){
      if(dirty){ dirty=false; render(); }  /* 靜態畫面：僅狀態變化時重繪 */
    }
  };
})();

registerApp({
  id: 'polaroid',
  glyph: '寫',
  no: 'APP-11',
  label: '寫眞沖印',
  color: '#D42027',
  v2: true,
  panel: PLD_CSS +
    '<div id="pldStage"><canvas id="pldCv"></canvas></div>' +
    '<label class="fl">▸ 相紙規格</label><div class="pldStrip" id="pldSpec"></div>' +
    '<label class="fl">▸ 佈局分格</label><div class="pldStrip" id="pldSplit"></div>' +
    '<label class="fl">▸ 邊框樣式 ×30 ▸ 左右滑動</label><div class="pldStrip" id="pldFrames"></div>' +
    '<label class="fl">▸ 濾鏡 ×20 ▸ 左右滑動</label><div class="pldStrip" id="pldFilters"></div>' +
    '<label class="fl">▸ 上傳照片</label>' +
    '<div class="irow">' +
      '<button class="mainbtn ghostbtn" id="pldUp0" style="flex:1">圖1</button>' +
      '<button class="mainbtn ghostbtn" id="pldUp1" style="flex:1">圖2</button>' +
      '<button class="mainbtn ghostbtn" id="pldUp2" style="flex:1">圖3</button>' +
      '<button class="mainbtn ghostbtn" id="pldUp3" style="flex:1">圖4</button>' +
    '</div>' +
    '<label class="fl">▸ 相片小標注</label>' +
    '<div class="irow"><input class="txt" id="pldLab0" placeholder="圖1標注" style="flex:1"><input class="txt" id="pldLab1" placeholder="圖2標注" style="flex:1"></div>' +
    '<div class="irow"><input class="txt" id="pldLab2" placeholder="圖3標注" style="flex:1"><input class="txt" id="pldLab3" placeholder="圖4標注" style="flex:1"></div>' +
    '<label class="fl">▸ 相紙底部標注</label>' +
    '<div class="irow"><input class="txt" id="pldCap" placeholder="底部手寫標注" style="flex:1"></div>' +
    '<div class="btnrow">' +
      '<button class="mainbtn" id="pldGo">沖印 ▸ PNG</button>' +
      '<button class="mainbtn ghostbtn" id="pldNo">編號標注</button>' +
      '<button class="mainbtn ghostbtn" id="pldClear">清空</button>' +
    '</div>' +
    '<div class="avhint">▸ 點「圖N」上傳照片，畫布實時預覽；規格/佈局/邊框/濾鏡即點即生效；空白格沖印時留黑。</div>'
}, pldApp);
