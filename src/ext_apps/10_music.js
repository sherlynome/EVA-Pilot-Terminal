/* ============================================================
   APP-10 音楽室（音樂播放器 ▸ 22 首原創 + 本地 MIDI）
   來源：外部 AI 依《EVA驾驶员终端_APP开发规范与接入指南》§5 交付
   維護者改動（僅三處，均為接入必需）：
     1) MUSIC_CSS / MUSIC_PANEL 提到 IIFE 外層，否則 registerApp 取不到
     2) bindOnce() 從 IIFE 立即執行改為 activate() 首次執行（panel 由
        registerApp 才創建，立即綁定會全部拿到 null）
     3) registerApp 的 panel 傳 MUSIC_PANEL
   ============================================================ */

/* ---------- 1) MIDI 解析器（容錯版 ▸ 全 ES5） ---------- */
function emuParseMIDI(buf){
  var v=new DataView(buf), N=v.byteLength;
  var D={size:N,headAt:-1,fmt:-1,ntrk:0,div:0,hex:'',notes:0,err:''};
  var i,h='';
  for(i=0;i<Math.min(16,N);i++){ var b0=v.getUint8(i).toString(16); h+=(b0.length<2?'0':'')+b0+' '; }
  D.hex=h.trim();
  for(i=0;i<Math.min(N-4,1024);i++){ if(v.getUint32(i)===0x4D546864){ D.headAt=i; break; } }
  if(D.headAt<0){ D.err='找不到 MThd 頭'; return {ok:false,D:D}; }
  var p=D.headAt+4;
  if(p+6>N){ D.err='檔案太短'; return {ok:false,D:D}; }
  var hlen=v.getUint32(p); p+=4;
  D.fmt=v.getUint16(p); p+=2; D.ntrk=v.getUint16(p); p+=2; D.div=v.getUint16(p); p+=2;
  if(hlen>6){ p+=(hlen-6); }
  var evs=[];
  for(var tr=0; tr<D.ntrk && p+8<=N; tr++){
    if(v.getUint32(p)!==0x4D54726B){
      var q=p, found=-1;
      while(q<Math.min(N-4,p+8192)){ if(v.getUint32(q)===0x4D54726B){ found=q; break; } q++; }
      if(found<0){ break; } p=found;
    }
    p+=4; var len=v.getUint32(p); p+=4;
    var end=(len>0&&p+len<=N)?(p+len):N;
    try{
      var tick=0, last=0, guard=0;
      while(p<end&&guard++<2000000){
        var x=0,b;
        do{ if(p>=end){ b=0; break; } b=v.getUint8(p++); x=(x<<7)|(b&0x7f); }while(b&0x80);
        tick+=x;
        if(p>=end){ break; }
        var st=v.getUint8(p);
        if(st<0x80){ if(!last){ continue; } } else { p++; if(st<0xF0){ last=st; } }
        if(st===0xFF){
          if(p>=end){ break; }
          var type=v.getUint8(p++), m=0,bb;
          do{ if(p>=end){ bb=0; break; } bb=v.getUint8(p++); m=(m<<7)|(bb&0x7f); }while(bb&0x80);
          if(type===0x51&&m===3&&p+3<=end){ evs.push({tick:tick,tempo:(v.getUint8(p)<<16)|(v.getUint8(p+1)<<8)|v.getUint8(p+2)}); }
          p+=m; last=0;
        }else if(st===0xF0||st===0xF7){
          var m2=0,b2;
          do{ if(p>=end){ b2=0; break; } b2=v.getUint8(p++); m2=(m2<<7)|(b2&0x7f); }while(b2&0x80);
          p+=m2; last=0;
        }else if(st>=0xF0){
          if(st===0xF2){ p+=2; } else if(st===0xF3){ p+=1; }
          last=0;
        }else{
          var hi=st&0xF0;
          if(hi===0x90||hi===0x80){
            if(p+2>end){ break; }
            var note=v.getUint8(p), vel=v.getUint8(p+1); p+=2;
            evs.push({tick:tick,note:note,vel:vel,on:(hi===0x90&&vel>0)});
            if(hi===0x90&&vel>0){ D.notes++; }
          }else if(hi===0xC0||hi===0xD0){ p+=1; } else { p+=2; }
        }
      }
    }catch(e2){}
    p=end;
  }
  if(!evs.length){ D.err='沒有音符事件'; return {ok:false,D:D}; }
  evs.sort(function(a,b){ return (a.tick-b.tick)||(a.tempo?-1:(b.tempo?1:0)); });
  var out=[], lt=0, ls=0, tempo=500000;
  var smpte=((D.div&0x8000)!==0), spt=0;
  if(smpte){ var fps=(D.div>>8)-256; spt=-1/(fps*(D.div&0xFF)); }
  for(i=0;i<evs.length;i++){
    var e=evs[i];
    if(smpte){ ls+=(e.tick-lt)*spt; }
    else{ ls+=(e.tick-lt)/((D.div&0x7FFF)||480)*(tempo/1000000); }
    lt=e.tick;
    if(e.tempo){ tempo=e.tempo; } else { out.push({t:ls,note:e.note,vel:e.vel,on:e.on}); }
  }
  return {ok:true,evs:out,D:D};
}

/* ---------- 2) 私有樣式 + 參數板（前綴 emu 防衝突） ---------- */
var MUSIC_CSS='<style>'+
  '.emuWrap{font-size:13px}'+
  '.emuLine{font-family:"Courier New",monospace;font-size:12px;color:#6E6E6E;padding:6px 2px;line-height:1.7}'+
  '.emuLine b{color:#D42027}'+
  '.emuTbtn{height:52px;min-width:52px;flex:1;border-radius:6px;border:2px solid #D42027;background:#0F0F0F;color:#D42027;font-size:18px;cursor:pointer;font-family:inherit;line-height:1}'+
  '.emuTbtn:active{transform:scale(.95)}'+
  '.emuTbig{flex:1.6;background:#D42027;color:#fff;box-shadow:0 0 14px rgba(212,32,39,.5)}'+
  '.emuTgray{border-color:#444;color:#6E6E6E}'+
  '.emuGrp{margin-top:6px;border:2px solid #333;border-radius:6px;background:#050505;overflow:hidden}'+
  '.emuGrpHead{display:flex;align-items:center;min-height:52px;padding:0 12px;cursor:pointer;background:#0A0607}'+
  '.emuGrpHead .gt{flex:1;font-size:13px;font-weight:900;color:#c9c0b8;letter-spacing:.06em}'+
  '.emuGrp.open .emuGrpHead .gt{color:#FF5040}'+
  '.emuGrpHead .gc{font-family:"Courier New",monospace;font-size:10px;color:#6E6E6E;margin-right:8px}'+
  '.emuGrpHead .ar{width:40px;text-align:center;color:#6E6E6E;transition:transform .2s}'+
  '.emuGrp.open .emuGrpHead .ar{transform:rotate(180deg);color:#D42027}'+
  '.emuGrpBody{display:none;padding:2px 6px 6px}'+
  '.emuGrp.open .emuGrpBody{display:block}'+
  '.emuTrk{display:flex;align-items:center;min-height:52px;padding:7px 10px;margin-top:4px;border:1px solid #3a3a3a;border-radius:5px;cursor:pointer;background:#050505}'+
  '.emuTrk .nm{font-size:12px;font-weight:700;color:#ddd}'+
  '.emuTrk .sb{font-family:"Courier New",monospace;font-size:10px;color:#6E6E6E;margin-top:2px}'+
  '.emuTrk.act{border-color:#D42027;background:#160608}'+
  '.emuTrk.act .nm{color:#FF5040}'+
  '</style>';

var MUSIC_PANEL=MUSIC_CSS+
  '<div class="emuWrap">'+
  '<div class="emuLine" id="emuNow">■ 待機中 ▸ 展開分組選擇曲目</div>'+
  '<div class="btnrow">'+
    '<button class="emuTbtn" id="emuPrev" title="上一首">◀◀</button>'+
    '<button class="emuTbtn emuTbig" id="emuPlay" title="播放/暫停">▶</button>'+
    '<button class="emuTbtn" id="emuNext" title="下一首">▶▶</button>'+
    '<button class="emuTbtn emuTgray" id="emuStop" title="停止">■</button>'+
  '</div>'+
  '<label class="fl">▸ 播放列表 ▸ 點分類標題折疊或展開</label>'+
  '<div id="emuList"></div>'+
  '<label class="fl">▸ 載入本地 MIDI ▸ 本機解析 ▸ 不上傳</label>'+
  '<div class="btnrow"><button class="mainbtn ghostbtn" id="emuMidiBtn">載入 .mid 檔案</button></div>'+
  '<input type="file" id="emuMidi" accept=".mid,.midi,audio/midi" style="display:none">'+
  '<div class="avhint" id="emuDiag" style="display:none"></div>'+
  '<div class="avhint">※ 播放器僅在本機解碼 ▸ 二十二首生成曲目均為本終端原創 ▸ 音色全部由程序即時合成</div>'+
  '</div>';

/* ---------- 3) APP 物件 ---------- */
var musicApp=(function(){
  var W=1080, H=760;
  var TRACKS={
    t9:{nm:'寧靜的早晨 −SHIZUKA ▸ 鋼琴',sub:'82 BPM ▸ Beautiful World 系'},
    t10:{nm:'再見的顏色 −SAYONARA ▸ 鋼琴',sub:'76 BPM ▸ One Last Kiss 系'},
    t11:{nm:'歡迎回來 −OKAERI ▸ 小提琴',sub:'68 BPM ▸ 卡農進行'},
    t12:{nm:'二十歲的逃亡 −TOGE ▸ 小提琴',sub:'104 BPM ▸ 逃不出去的那天'},
    t16:{nm:'滿月的誓言 −MANGETSU ▸ 小提琴',sub:'60 BPM ▸ 一把琴對月亮'},
    t14:{nm:'信 −TEGAMI ▸ 大提琴',sub:'80 BPM ▸ 寄不出去的信'},
    t8:{nm:'靜脈 −JOMYAKU ▸ 大提琴',sub:'72 BPM ▸ 暗流'},
    t19:{nm:'補完之海 −UMI ▸ 弦樂鋪底',sub:'54 BPM ▸ 橙色的海'},
    t13:{nm:'白色房間 −SHIROI ▸ 八音盒',sub:'66 BPM ▸ 白色房間的孤獨'},
    t20:{nm:'白月 −SHIROITSUKI ▸ 八音盒',sub:'60 BPM ▸ 終夜之後'},
    t15:{nm:'林蔭道 −NAMIKI ▸ 長笛',sub:'96 BPM ▸ 難得的好天氣'},
    t7:{nm:'鏡之湖 −KAGAMI ▸ 八音盒',sub:'84 BPM ▸ PATTERN BLUE'},
    t17:{nm:'最後的電話 −DENWA ▸ 管風琴',sub:'72 BPM ▸ 沒有接通的通話'},
    t18:{nm:'教條區 −KYODO ▸ 圣詠',sub:'56 BPM ▸ 十字架之下'},
    t21:{nm:'神化 −KAMIGAMI ▸ 圣詠×管風琴',sub:'92 BPM ▸ 合而為一的瞬間'},
    t22:{nm:'果實的流浪 −RUSR ▸ 八音盒×圣詠',sub:'50 BPM ▸ 星空中永遠的漂泊'},
    t4:{nm:'紅色警報 −KEIKAI ▸ 小提琴齊奏',sub:'132 BPM ▸ 緊急警報'},
    t5:{nm:'地下都市 −CHIKA ▸ 管風琴',sub:'96 BPM ▸ 最美也最致命'},
    t6:{nm:'對使徒兵器 −TAISHITO ▸ 銅管',sub:'140 BPM ▸ 発進準備'},
    t1:{nm:'決戰 −STUDY ▸ 鋼琴',sub:'150 BPM ▸ 脉冲低音×军鼓'},
    t2:{nm:'蟬鳴 −AMBIENT ▸ 環境曲',sub:'第3新東京市的夏天'},
    t3:{nm:'MAGI SYSTEM DRONE ▸ 機房',sub:'低鳴與數據雜音'}
  };
  var GROUPS=[
    {key:'ballad',nm:'抒情弦樂 ▸ BALLAD',ids:['t9','t10','t11','t12','t16','t14','t8','t19']},
    {key:'dream', nm:'夢幻音色 ▸ DREAM', ids:['t13','t20','t15','t7']},
    {key:'solemn',nm:'莊重與終章 ▸ REQUIEM',ids:['t17','t18','t21','t22']},
    {key:'action',nm:'戰鬥警報 ▸ ACTION',ids:['t4','t5','t6','t1']},
    {key:'amb',   nm:'環境異界 ▸ AMBIENT',ids:['t2','t3']},
    {key:'midi',  nm:'本地 MIDI ▸ FILE',ids:[]}
  ];
  var openGrp={ballad:true,dream:false,solemn:false,action:false,amb:false,midi:false};
  var bound=false;

  /* ---- 音頻引擎（獨立 AudioContext ▸ 不與框架 SFX 衝突） ---- */
  var ac=null, hub=null, an=null, fdata=null;
  var MP={evs:null,idx:0,t0:0,off:0,dur:0,timer:null,pauseFn:null,paused:false,pausedGen:false,name:'',mode:'',curId:null};

  function A(){
    if(!ac){
      try{ ac=new (window.AudioContext||window.webkitAudioContext)(); }catch(e){ return null; }
      hub=ac.createGain(); hub.gain.value=1;
      an=ac.createAnalyser(); an.fftSize=128; an.smoothingTimeConstant=0.8;
      fdata=new Uint8Array(an.frequencyBinCount);
      hub.connect(an); an.connect(ac.destination);
    }
    if(ac.state==='suspended'){ try{ ac.resume(); }catch(e){} }
    return ac;
  }
  function NOTE(n){ return 440*Math.pow(2,(n-69)/12); }
  function nmOf(id){
    if(id==='midi'){ return MP.name||'MIDI'; }
    return TRACKS[id]?TRACKS[id].nm:id;
  }
  function grpOf(id){
    for(var i=0;i<GROUPS.length;i++){ if(GROUPS[i].ids.indexOf(id)>=0){ return GROUPS[i].key; } }
    return id==='midi'?'midi':null;
  }
  function emuPiano(out,freq,t,vol,dur){
    var o1=ac.createOscillator(),o2=ac.createOscillator(),g=ac.createGain(),f=ac.createBiquadFilter();
    o1.type='triangle'; o1.frequency.value=freq;
    o2.type='sine'; o2.frequency.value=freq*2.01;
    f.type='lowpass'; f.frequency.setValueAtTime(freq*6,t);
    f.frequency.exponentialRampToValueAtTime(Math.max(200,freq*1.5),t+dur);
    g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(vol,t+0.01); g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
    o1.connect(f); o2.connect(f); f.connect(g); g.connect(out);
    o1.start(t); o2.start(t); o1.stop(t+dur+0.1); o2.stop(t+dur+0.1);
  }
  function emuNoise(out,t,vol,dur,fc){
    var len=Math.floor(ac.sampleRate*dur), buf=ac.createBuffer(1,len,ac.sampleRate);
    var d=buf.getChannelData(0),i;
    for(i=0;i<len;i++){ d[i]=(Math.random()*2-1)*Math.pow(1-i/len,2); }
    var s=ac.createBufferSource(); s.buffer=buf;
    var f=ac.createBiquadFilter(); f.type='bandpass'; f.frequency.value=fc;
    var g=ac.createGain(); g.gain.value=vol;
    s.connect(f); f.connect(g); g.connect(out); s.start(t);
  }
  function emuKick(out,t,vol){
    var o=ac.createOscillator(),g=ac.createGain();
    o.type='sine'; o.frequency.setValueAtTime(160,t);
    o.frequency.exponentialRampToValueAtTime(45,t+0.11);
    g.gain.setValueAtTime(vol,t); g.gain.exponentialRampToValueAtTime(0.0001,t+0.13);
    o.connect(g); g.connect(out); o.start(t); o.stop(t+0.15);
  }
  /* ---- 9 種程序合成音色 ---- */
  var VOICE={
    piano:function(out,freq,t,vol,dur){ emuPiano(out,freq,t,vol,dur); },
    violin:function(out,freq,t,vol,dur){
      var o=ac.createOscillator(),g=ac.createGain(),f=ac.createBiquadFilter();
      var lfo=ac.createOscillator(),lg=ac.createGain();
      o.type='sawtooth'; o.frequency.value=freq;
      f.type='lowpass'; f.frequency.value=Math.min(4000,freq*4);
      lfo.frequency.value=5.5; lg.gain.value=freq*0.006;
      lfo.connect(lg); lg.connect(o.frequency);
      g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(vol,t+0.12);
      g.gain.setValueAtTime(vol,t+Math.max(0.15,dur-0.12)); g.gain.linearRampToValueAtTime(0.0001,t+dur+0.08);
      o.connect(f); f.connect(g); g.connect(out);
      o.start(t); lfo.start(t); o.stop(t+dur+0.15); lfo.stop(t+dur+0.15);
    },
    cello:function(out,freq,t,vol,dur){
      var o=ac.createOscillator(),g=ac.createGain(),f=ac.createBiquadFilter();
      var lfo=ac.createOscillator(),lg=ac.createGain();
      o.type='sawtooth'; o.frequency.value=freq;
      f.type='lowpass'; f.frequency.value=Math.min(1100,freq*2.5);
      lfo.frequency.value=4.2; lg.gain.value=freq*0.008;
      lfo.connect(lg); lfo.connect(o.frequency);
      g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(vol,t+0.15);
      g.gain.setValueAtTime(vol,t+Math.max(0.2,dur-0.15)); g.gain.linearRampToValueAtTime(0.0001,t+dur+0.1);
      o.connect(f); f.connect(g); g.connect(out);
      o.start(t); lfo.start(t); o.stop(t+dur+0.15); lfo.stop(t+dur+0.15);
    },
    brass:function(out,freq,t,vol,dur){
      var o=ac.createOscillator(),g=ac.createGain(),f=ac.createBiquadFilter();
      o.type='sawtooth'; o.frequency.value=freq;
      f.type='lowpass';
      f.frequency.setValueAtTime(500,t);
      f.frequency.linearRampToValueAtTime(Math.min(5000,freq*5),t+0.06);
      f.frequency.linearRampToValueAtTime(Math.max(800,freq*2),t+dur);
      g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(vol,t+0.05); g.gain.linearRampToValueAtTime(0.0001,t+dur+0.05);
      o.connect(f); f.connect(g); g.connect(out); o.start(t); o.stop(t+dur+0.1);
    },
    celesta:function(out,freq,t,vol,dur){
      var o1=ac.createOscillator(),o2=ac.createOscillator(),g=ac.createGain();
      o1.type='sine'; o1.frequency.value=freq;
      o2.type='sine'; o2.frequency.value=freq*4;
      g.gain.setValueAtTime(0.0001,t);
      g.gain.linearRampToValueAtTime(vol,t+0.005);
      g.gain.exponentialRampToValueAtTime(0.0001,t+Math.min(dur,1.6));
      var g2=ac.createGain(); g2.gain.value=0.25;
      o1.connect(g); o2.connect(g2); g2.connect(g); g.connect(out);
      o1.start(t); o2.start(t); o1.stop(t+dur+0.1); o2.stop(t+dur+0.1);
    },
    flute:function(out,freq,t,vol,dur){
      var o=ac.createOscillator(),g=ac.createGain(),f=ac.createBiquadFilter();
      var lfo=ac.createOscillator(),lg=ac.createGain();
      o.type='sine'; o.frequency.value=freq;
      f.type='lowpass'; f.frequency.value=Math.min(3000,freq*3);
      lfo.frequency.value=5; lg.gain.value=freq*0.004;
      lfo.connect(lg); lg.connect(o.frequency);
      g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(vol,t+0.08);
      g.gain.setValueAtTime(vol,t+Math.max(0.12,dur-0.1)); g.gain.linearRampToValueAtTime(0.0001,t+dur+0.06);
      o.connect(f); f.connect(g); g.connect(out);
      o.start(t); lfo.start(t); o.stop(t+dur+0.1); lfo.stop(t+dur+0.1);
    },
    organ:function(out,freq,t,vol,dur){
      var g=ac.createGain();
      g.gain.setValueAtTime(0.0001,t);
      g.gain.linearRampToValueAtTime(vol,t+0.04);
      g.gain.setValueAtTime(vol,t+Math.max(0.08,dur-0.05));
      g.gain.linearRampToValueAtTime(0.0001,t+dur+0.04);
      var mult=[1,2,3], amp=[0.5,0.3,0.15];
      for(var i=0;i<3;i++){
        var o=ac.createOscillator(),og=ac.createGain();
        o.type='sine'; o.frequency.value=freq*mult[i]; og.gain.value=amp[i];
        o.connect(og); og.connect(g); o.start(t); o.stop(t+dur+0.1);
      }
      g.connect(out);
    },
    choir:function(out,freq,t,vol,dur){
      var f=ac.createBiquadFilter(),g=ac.createGain();
      f.type='lowpass'; f.frequency.value=1400;
      g.gain.setValueAtTime(0.0001,t);
      g.gain.linearRampToValueAtTime(vol,t+0.4);
      g.gain.setValueAtTime(vol,t+Math.max(0.5,dur-0.3));
      g.gain.linearRampToValueAtTime(0.0001,t+dur+0.3);
      var det=[0,1.005];
      for(var i=0;i<2;i++){
        var o=ac.createOscillator();
        o.type='triangle'; o.frequency.value=freq*det[i];
        o.connect(f); o.start(t); o.stop(t+dur+0.35);
      }
      f.connect(g); g.connect(out);
    },
    pluck:function(out,freq,t,vol,dur){
      var o=ac.createOscillator(),g=ac.createGain();
      o.type='triangle'; o.frequency.value=freq;
      g.gain.setValueAtTime(0.0001,t);
      g.gain.linearRampToValueAtTime(vol,t+0.004);
      g.gain.exponentialRampToValueAtTime(0.0001,t+Math.min(dur,0.5));
      o.connect(g); g.connect(out); o.start(t); o.stop(t+dur+0.1);
    }
  };
  function stopSched(){ if(MP.timer){ clearInterval(MP.timer); MP.timer=null; } }
  function stopAll(){
    stopSched();
    if(MP.pauseFn){ MP.pauseFn(); MP.pauseFn=null; }
    MP.paused=false; MP.pausedGen=false; MP.mode=''; MP.idx=0; MP.off=0;
    renderList(); updUI();
  }
  function fmt(s){ var m=Math.floor(s/60),x=Math.floor(s%60); return (m<10?'0':'')+m+':'+((x<10?'0':'')+x); }
  function setStatus(t){ var el=document.getElementById('emuNow'); if(el){ el.innerHTML=t; } updPlayBtn(); }
  function updPlayBtn(){
    var playing=(MP.mode==='gen'&&!MP.pausedGen)||(MP.mode==='midi'&&!MP.paused);
    var b=document.getElementById('emuPlay');
    if(b){ b.textContent=playing?'❚❚':'▶'; }
  }
  function updUI(){
    if(MP.mode==='midi'&&MP.dur){ setStatus('▶ <b>'+MP.name+'</b> ▸ '+fmt(Math.min(MP.off,MP.dur))+' / '+fmt(MP.dur)); }
    else if(MP.mode==='gen'){ setStatus('▶ <b>'+MP.name+'</b> ▸ ∞ 循環'); }
  }
  /* ---- 生成曲目數據（bass/mel 為 MIDI 音高，0=休止 ▸ drum: K k S h x） ---- */
  var GEN={
    t1:{bpm:150,db:0.22,dm:0.13,
      bass:[40,40,43,40,45,40,43,38,40,40,43,40,47,45,43,38],
      mel:[64,67,71,74,71,67,69,71,64,67,71,76,74,71,69,67],
      drum:'K.h.S.h.K.h.S.hh'},
    t9:{bpm:82,db:0.17,dm:0.11,lb:1.6,lm:2.2,
      bass:[41,0,0,0,41,0,0,0,40,0,0,0,40,0,0,0,38,0,0,0,38,0,0,0,36,0,0,0,36,0,0,0],
      mel:[60,0,65,0,69,0,72,0,59,0,64,0,67,0,71,0,57,0,62,0,65,0,69,0,55,0,60,0,64,0,67,0],
      drum:'k.x.x.x.k.x.x.x.k.x.x.x.k.x.x.x.',
      pads:[[53,57,60,64],[52,55,59,62],[50,53,57,60],[48,52,55,59]]},
    t10:{bpm:76,db:0.18,dm:0.12,lb:1.4,lm:2.4,
      bass:[45,0,0,45,0,0,45,0,41,0,0,41,0,0,41,0,48,0,0,48,0,0,48,0,43,0,0,43,0,0,43,0],
      mel:[76,0,0,0,74,0,72,0,72,0,0,0,69,0,72,0,74,0,0,0,72,0,71,0,67,0,69,0,71,0,72,0],
      drum:'k.x.S.x.k.x.S.x.k.x.S.x.k.x.S.x.',
      pads:[[45,48,52,55],[41,45,48,52],[48,52,55,59],[43,47,50,55]]},
    t11:{bpm:68,db:0.18,dm:0.11,lb:1.8,lm:3.4,vm:'violin',
      bass:[50,0,0,0,50,0,0,0,45,0,0,0,45,0,0,0,47,0,0,0,47,0,0,0,42,0,0,0,42,0,0,0,
            43,0,0,0,43,0,0,0,50,0,0,0,50,0,0,0,43,0,0,0,43,0,0,0,45,0,0,0,45,0,0,0],
      mel:[74,0,0,0,0,0,0,0,76,0,0,0,0,0,0,0,78,0,0,0,76,0,0,0,73,0,0,0,0,0,0,0,
           71,0,0,0,74,0,0,0,76,0,0,0,0,0,0,0,74,0,0,0,71,0,0,0,69,0,0,0,71,0,73,0],
      drum:'................x.x.x.x.x.x.x.x.k.x.x.x.k.x.x.x.K.x.S.x.K.x.S.x.',
      pads:[[50,54,57],[45,49,52],[47,50,54],[42,45,49],[43,47,50],[50,54,57],[43,47,50],[45,49,52]]},
    t12:{bpm:104,db:0.18,dm:0.12,lm:1.8,vm:'violin',
      bass:[45,0,0,52,0,0,45,0,41,0,0,48,0,0,41,0,48,0,0,55,0,0,48,0,43,0,0,50,0,0,43,0],
      mel:[69,0,71,72,74,0,72,71,69,0,67,69,0,0,0,0,72,0,74,76,77,0,76,74,72,0,71,0,0,0,0,0],
      drum:'k.x.x.x.k.x.x.x.k.x.x.x.k.x.x.x.',
      pads:[[45,48,52],[41,45,48],[48,52,55],[43,47,50]]},
    t16:{bpm:60,db:0.16,dm:0.13,lb:3,lm:5,vm:'violin',
      bass:[38,0,0,0,0,0,0,0,36,0,0,0,0,0,0,0],
      mel:[74,0,0,0,76,0,0,0,77,0,76,0,74,0,0,0,72,0,0,0,71,0,0,0,69,0,0,0,0,0,0,0],
      drum:'................................'},
    t14:{bpm:80,db:0.17,dm:0.12,lb:1.6,lm:2.2,vm:'cello',
      bass:[45,0,0,52,0,0,45,0,41,0,0,48,0,0,41,0,43,0,0,50,0,0,43,0,38,0,0,45,0,0,38,0],
      mel:[69,0,0,72,0,71,0,0,69,0,0,65,0,0,0,0,67,0,0,71,0,69,0,0,65,0,64,0,62,0,0,0],
      drum:'k...x...k...x...',
      pads:[[45,48,52],[41,45,48],[43,47,50],[38,41,45]]},
    t8:{bpm:72,db:0.18,dm:0.13,lb:3,lm:3.5,vm:'cello',
      bass:[33,0,0,0,0,0,0,0,31,0,0,0,0,0,0,0],
      mel:[57,0,0,60,0,0,59,0,0,0,55,0,57,0,0,0],
      drum:'................................',
      pads:[[33,36,40],[31,34,38]]},
    t19:{bpm:54,db:0.15,dm:0.11,lb:4,lm:5,vm:'cello',
      bass:[33,0,0,0,0,0,0,0,31,0,0,0,0,0,0,0],
      mel:[57,0,0,0,60,0,0,0,64,0,0,0,0,0,0,0,55,0,0,0,59,0,0,0,62,0,0,0,0,0,0,0],
      drum:'................................',
      pads:[[33,36,40,45],[31,34,38,43]]},
    t13:{bpm:66,db:0.14,dm:0.10,lm:2,vm:'celesta',
      bass:[48,0,0,0,0,0,0,0,52,0,0,0,0,0,0,0,48,0,0,0,0,0,0,0,45,0,0,0,0,0,0,0],
      mel:[76,0,0,74,0,0,71,0,0,72,0,0,74,0,0,0,76,0,0,79,0,0,76,0,74,0,0,0,0,0,0,0],
      drum:'................................'},
    t20:{bpm:60,db:0.13,dm:0.09,lm:2.4,vm:'celesta',
      bass:[43,0,0,0,0,0,0,0,48,0,0,0,0,0,0,0,40,0,0,0,0,0,0,0,36,0,0,0,0,0,0,0],
      mel:[79,0,0,76,0,0,74,0,72,0,74,0,76,0,0,0,74,0,0,72,0,0,71,0,72,0,0,0,0,0,0,0],
      drum:'................................',
      pads:[[43,47,50],[48,52,55],[40,43,47],[36,40,43]]},
    t15:{bpm:96,db:0.15,dm:0.10,lm:1.6,vm:'flute',vb:'pluck',
      bass:[48,0,55,0,48,0,55,0,45,0,52,0,45,0,52,0,41,0,48,0,41,0,48,0,43,0,50,0,43,0,50,0],
      mel:[72,0,74,76,79,0,76,74,72,0,69,72,0,0,0,0,76,0,77,79,81,0,79,77,76,0,72,0,0,0,0,0],
      drum:'k...x...k...x...'},
    t17:{bpm:72,db:0.16,dm:0.11,lb:2.5,lm:3,vm:'organ',
      bass:[41,0,0,0,48,0,0,0,40,0,0,0,47,0,0,0,38,0,0,0,45,0,0,0,36,0,0,0,43,0,0,0],
      mel:[65,0,0,64,0,0,60,0,64,0,0,65,0,0,69,0,62,0,0,60,0,0,57,0,60,0,0,0,0,0,0,0],
      drum:'................................',
      pads:[[41,44,48,53],[40,43,47,52],[38,41,45,50],[36,40,43,48]]},
    t18:{bpm:56,db:0.14,dm:0.10,lb:4,lm:4.5,vm:'choir',
      bass:[36,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,34,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      mel:[64,0,0,0,63,0,0,0,62,0,0,0,60,0,0,0,59,0,0,0,57,0,0,0,55,0,0,0,0,0,0,0],
      drum:'................................',
      pads:[[36,39,43,48],[34,38,41,46]]},
    t7:{bpm:84,db:0.14,dm:0.10,lm:1.4,vm:'celesta',
      bass:[36,0,0,0,0,0,0,0,35,0,0,0,0,0,0,0],
      mel:[72,0,74,0,76,0,78,0,79,0,78,0,76,0,74,0],
      drum:'x.......x.......'},
    t4:{bpm:132,db:0.20,dm:0.11,lm:0.9,vm:'violin',vb:'cello',
      bass:[45,45,45,45,43,43,43,43,41,41,41,41,40,40,40,40],
      mel:[69,72,76,72,69,72,76,72,67,71,74,71,64,68,71,68],
      drum:'K.h.S.h.K.h.S.hh'},
    t5:{bpm:96,db:0.18,dm:0.10,lb:2.5,lm:2,vm:'organ',vb:'cello',
      bass:[40,0,0,0,0,0,0,0,40,0,0,0,0,0,0,0,38,0,0,0,0,0,0,0,36,0,0,0,0,0,0,0],
      mel:[64,0,65,0,0,0,64,0,62,0,0,0,0,0,0,0,60,0,62,0,0,0,60,0,59,0,0,0,0,0,0,0],
      drum:'K.......h.......',
      pads:[[40,43,47],[38,41,45],[36,39,43]]},
    t6:{bpm:140,db:0.22,dm:0.11,lm:1.1,vm:'brass',vb:'cello',
      bass:[38,0,38,0,45,0,38,0,36,0,36,0,43,0,36,0,34,0,34,0,41,0,34,0,33,0,33,0,40,0,33,0],
      mel:[0,0,62,65,69,0,65,62,0,0,60,63,67,0,63,60,0,0,58,62,65,0,62,58,0,0,57,60,64,0,60,57],
      drum:'K.h.S.hK.h.S.hhK.h.S.hK.h.S.hh'},
    t21:{bpm:92,db:0.19,dm:0.12,lb:3,lm:4,vm:'choir',vb:'organ',
      bass:[33,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0, 34,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
            35,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0, 36,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      mel:[64,0,0,0,68,0,0,0,71,0,0,0,75,0,0,0, 65,0,0,0,69,0,0,0,72,0,0,0,76,0,0,0,
           66,0,0,0,70,0,0,0,73,0,0,0,77,0,0,0, 67,0,0,0,72,0,0,0,76,0,0,0,79,0,0,0],
      drum:'................................x...x...x...x...k...k...k...k...K...S...K...S...',
      pads:[[45,48,52,57],[46,49,53,58],[47,50,54,59],[48,52,55,60]]},
    t22:{bpm:50,db:0.14,dm:0.10,lb:5,lm:6,vm:'celesta',vb2:'choir',
      bass:[30,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0, 28,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      mel:[74,0,0,0,0,0,0,0,78,0,0,0,0,0,0,0, 76,0,0,0,0,0,0,0,73,0,0,0,0,0,0,0,
           71,0,0,0,0,0,0,0,74,0,0,0,0,0,0,0, 78,0,0,0,0,0,0,0,74,0,0,0,0,0,0,0],
      drum:'................................................................',
      pads:[[42,46,49,54],[40,44,47,52],[38,42,45,50],[40,44,47,52]]}
  };
  function playTrack(id){
    var a=A(); if(!a){ setStatus('請先觸摸螢幕解鎖聲音'); return; }
    stopAll();
    MP.curId=id; MP.pausedGen=false; MP.mode='gen';
    var out=ac.createGain(); out.gain.value=0.85; out.connect(hub);
    var on=true, nodes=[], iv=null;
    MP.pauseFn=function(){ on=false; if(iv){ clearInterval(iv); } nodes.forEach(function(n){ try{ n.stop(); }catch(e){} }); try{ out.gain.linearRampToValueAtTime(0.0001,ac.currentTime+0.25); }catch(e){} };
    if(id==='t2'){
      /* 蝉鳴 ▸ 環境曲 */
      var cLen=Math.floor(ac.sampleRate*2), cb=ac.createBuffer(1,cLen,ac.sampleRate);
      var cd=cb.getChannelData(0),i;
      for(i=0;i<cLen;i++){ cd[i]=(Math.random()*2-1); }
      var cs=ac.createBufferSource(); cs.buffer=cb; cs.loop=true;
      var cf=ac.createBiquadFilter(); cf.type='bandpass'; cf.frequency.value=7600; cf.Q.value=8;
      var cg=ac.createGain(); cg.gain.value=0.015;
      var lfo=ac.createOscillator(), lg=ac.createGain();
      lfo.frequency.value=11; lg.gain.value=0.012;
      lfo.connect(lg); lg.connect(cg.gain);
      cs.connect(cf); cf.connect(cg); cg.connect(out); cs.start(); lfo.start();
      nodes.push(cs,lfo);
      var chords=[[52,59,66,71,78],[50,57,64,69,76]], ci=0;
      function pad(){ if(!on){ return; } var t=ac.currentTime+0.05, ch=chords[ci%2]; ci++;
        ch.forEach(function(n){ var o=ac.createOscillator(),g=ac.createGain();
          o.type='sine'; o.frequency.value=NOTE(n);
          g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(0.035,t+2.5); g.gain.linearRampToValueAtTime(0.0001,t+7.5);
          o.connect(g); g.connect(out); o.start(t); o.stop(t+8); }); }
      pad(); iv=setInterval(pad,7000);
    }else if(id==='t3'){
      /* MAGI DRONE */
      var fr=[55,55.7,82.5];
      for(var k2=0;k2<fr.length;k2++){
        var o2=ac.createOscillator(),g2=ac.createGain();
        o2.type='sawtooth'; o2.frequency.value=fr[k2]; g2.gain.value=0.03;
        var fl=ac.createBiquadFilter(); fl.type='lowpass'; fl.frequency.value=300;
        o2.connect(fl); fl.connect(g2); g2.connect(out); o2.start(); nodes.push(o2);
      }
      iv=setInterval(function(){ if(!on){ return; } emuPiano(out,NOTE(76+Math.floor(Math.random()*12)),ac.currentTime,0.05,0.09); },170);
    }else{
      var d=GEN[id]; if(!d){ return; }
      var step=60/d.bpm/2, k=0, n=Math.max(d.bass.length,Math.max(d.mel.length,d.drum.length));
      var loop=function(){
        if(!on){ return; }
        var t=ac.currentTime, i=k%n;
        var b=d.bass[i%d.bass.length];
        if(b){ VOICE[d.vb||'piano'](out,NOTE(b),t,d.db,step*(d.lb||0.95)); }
        var m=d.mel[i%d.mel.length];
        if(m){ VOICE[d.vm||'piano'](out,NOTE(m),t,d.dm,step*(d.lm||1.4)); }
        if(d.vb2&&i%16===0){
          var ch2=d.pads[Math.floor(i/16)%d.pads.length];
          ch2.forEach(function(nn){ VOICE[d.vb2](out,NOTE(nn+12),t,0.05,step*16); });
        }
        if(d.pads&&i%8===0){
          var ch=d.pads[Math.floor(i/8)%d.pads.length];
          ch.forEach(function(nn){
            var o=ac.createOscillator(),g=ac.createGain();
            o.type='sine'; o.frequency.value=NOTE(nn);
            g.gain.setValueAtTime(0.0001,t);
            g.gain.linearRampToValueAtTime(0.03,t+1.2);
            g.gain.linearRampToValueAtTime(0.0001,t+step*8);
            o.connect(g); g.connect(out); o.start(t); o.stop(t+step*8+0.1);
          });
        }
        var c=d.drum[i%d.drum.length];
        if(c==='K'){ emuKick(out,t,0.26); }
        else if(c==='k'){ emuKick(out,t,0.13); }
        else if(c==='S'){ emuNoise(out,t,0.10,0.08,3000); }
        else if(c==='h'){ emuNoise(out,t,0.04,0.03,8000); }
        else if(c==='x'){ emuNoise(out,t,0.018,0.03,8000); }
        k++;
      };
      iv=setInterval(loop,step*1000); loop();
    }
    MP.name=nmOf(id);
    var gk=grpOf(id); if(gk){ openGrp[gk]=true; }
    setStatus('▶ <b>'+MP.name+'</b> ▸ ∞ 循環');
    renderList();
  }
  function midiTick(){
    if(!ac||!MP.evs){ return; }
    var nw=ac.currentTime, horizon=nw+0.2, t0=MP.t0;
    while(MP.idx<MP.evs.length){
      var e=MP.evs[MP.idx], et=t0+e.t;
      if(et>horizon){ break; }
      if(e.on&&et>=nw-0.02){ emuPiano(hub,NOTE(e.note),Math.max(et,nw),(e.vel/127)*0.30,1.4); }
      MP.idx++;
    }
    MP.off=nw-t0;
    if(MP.off>MP.dur+1.2){ stopAll(); setStatus('■ 播放完畢 ▸ '+MP.name); return; }
    setStatus('▶ <b>'+MP.name+'</b> ▸ '+fmt(Math.min(MP.off,MP.dur))+' / '+fmt(MP.dur));
  }
  function midiPlay(fresh){
    var a=A(); if(!a){ setStatus('請先觸摸螢幕解鎖聲音'); return; }
    if(!MP.evs){ setStatus('尚未載入 MIDI'); return; }
    stopSched();
    if(fresh){ MP.idx=0; MP.off=0; }
    MP.t0=ac.currentTime-MP.off;
    MP.paused=false; MP.mode='midi'; MP.curId='midi';
    MP.timer=setInterval(midiTick,50);
    midiTick(); renderList();
  }
  /* ---- 參數板 UI ▸ 折疊分組渲染 ---- */
  function renderList(){
    var box=document.getElementById('emuList');
    if(!box){ return; }
    var h='', gi;
    for(gi=0;gi<GROUPS.length;gi++){
      var grp=GROUPS[gi];
      var isOpen=!!openGrp[grp.key];
      var cnt=grp.key==='midi'?(MP.evs?'已載入':'空'):(grp.ids.length+' 首');
      h+='<div class="emuGrp'+(isOpen?' open':'')+'">';
      h+='<div class="emuGrpHead" data-grp="'+grp.key+'"><div class="gt">'+grp.nm+'</div><div class="gc">'+cnt+'</div><div class="ar">▾</div></div>';
      h+='<div class="emuGrpBody">';
      if(grp.key==='midi'){
        h+='<div class="emuTrk'+(MP.curId==='midi'?' act':'')+'" data-id="midi"><div><div class="nm">'+(MP.evs?('♪ '+MP.name):'（未載入 MIDI）')+'</div><div class="sb">'+(MP.evs?(Math.round(MP.dur)+' 秒 ▸ 點擊播放'):'點下方按鈕載入 .mid 檔案')+'</div></div></div>';
      }else{
        for(var ii=0;ii<grp.ids.length;ii++){
          var id=grp.ids[ii], it=TRACKS[id];
          if(!it){ continue; }
          h+='<div class="emuTrk'+(MP.curId===id?' act':'')+'" data-id="'+id+'"><div><div class="nm">'+it.nm+'</div><div class="sb">'+it.sub+'</div></div></div>';
        }
      }
      h+='</div></div>';
    }
    box.innerHTML=h;
    var heads=box.querySelectorAll('.emuGrpHead');
    for(var a1=0;a1<heads.length;a1++){
      heads[a1].addEventListener('click',function(){
        SFX.click();
        var key=this.getAttribute('data-grp');
        openGrp[key]=!openGrp[key];
        renderList();
      });
    }
    var trks=box.querySelectorAll('.emuTrk');
    for(var a2=0;a2<trks.length;a2++){
      trks[a2].addEventListener('click',function(){
        SFX.click();
        var id=this.getAttribute('data-id');
        if(id==='midi'){ if(MP.evs){ midiPlay(true); } else { document.getElementById('emuMidi').click(); } }
        else{ playTrack(id); }
      });
    }
  }
  /* ---- 控制按鈕 ▸ 首次 activate 時綁定（panel 由 registerApp 創建） ---- */
  function togglePlay(){
    SFX.click();
    if(MP.mode==='midi'&&!MP.paused){ stopSched(); MP.paused=true; setStatus('❚❚ 已暫停 ▸ '+fmt(MP.off)+' / '+fmt(MP.dur)); }
    else if(MP.mode==='midi'&&MP.paused){ midiPlay(false); }
    else if(MP.mode==='gen'&&!MP.pausedGen){ MP.pausedGen=true; if(MP.pauseFn){ MP.pauseFn(); } setStatus('❚❚ 已暫停 ▸ <b>'+MP.name+'</b> ▸ 按 ▶ 續播'); }
    else if(MP.mode==='gen'&&MP.pausedGen){ MP.pausedGen=false; playTrack(MP.curId); }
    else if(MP.evs){ midiPlay(true); }
    else{ playTrack('t9'); }
  }
  function skipTrack(dir){
    SFX.click();
    var ids=[];
    for(var i=0;i<GROUPS.length;i++){ if(GROUPS[i].key!=='midi'){ ids=ids.concat(GROUPS[i].ids); } }
    if(MP.mode==='midi'){ playTrack('t9'); return; }
    var ci=ids.indexOf(MP.curId);
    playTrack(ids[(ci<0?(dir>0?0:ids.length-1):(ci+dir+ids.length))%ids.length]);
  }
  function bindOnce(){
    var bp=document.getElementById('emuPlay');
    if(bp){ bp.addEventListener('click',togglePlay); }
    var bn=document.getElementById('emuNext');
    if(bn){ bn.addEventListener('click',function(){ skipTrack(1); }); }
    var bv=document.getElementById('emuPrev');
    if(bv){ bv.addEventListener('click',function(){ skipTrack(-1); }); }
    var bs=document.getElementById('emuStop');
    if(bs){ bs.addEventListener('click',function(){ SFX.click(); stopAll(); MP.curId=null; MP.name=''; setStatus('■ 已停止 ▸ 待機中'); }); }
    var bm=document.getElementById('emuMidiBtn');
    if(bm){ bm.addEventListener('click',function(){ SFX.click(); document.getElementById('emuMidi').click(); }); }
    var fi=document.getElementById('emuMidi');
    if(fi){
      fi.addEventListener('change',function(e){
        var f=e.target.files&&e.target.files[0];
        if(!f){ return; }
        var dg=document.getElementById('emuDiag');
        if(dg){ dg.style.display='block'; dg.textContent='解析中 ▸ '+f.name; }
        busy=true;
        var r=new FileReader();
        r.onload=function(ev){
          setTimeout(function(){
            var res=emuParseMIDI(ev.target.result);
            busy=false;
            if(res.ok){
              if(dg){ dg.style.display='none'; }
              stopAll();
              MP.evs=res.evs; MP.dur=res.evs[res.evs.length-1].t; MP.name=f.name;
              openGrp.midi=true;
              midiPlay(true);
              SFX.grant();
              toast('✓ MIDI 已載入 ▸ '+f.name);
            }else{
              if(dg){ dg.textContent='✕ 解析失敗 ▸ '+res.D.err+' ▸ 前16字節 '+res.D.hex; }
              SFX.deny();
            }
          },30);
        };
        r.readAsArrayBuffer(f);
        e.target.value='';
      });
    }
  }
  /* ---- 主畫布頻譜 ▸ 每幀全量重繪 ▸ EVA 視覺規範 ---- */
  function render(now){
    ctx.fillStyle=C.black; ctx.fillRect(0,0,W,H);
    var bg=ctx.createLinearGradient(0,0,0,H);
    bg.addColorStop(0,'#0B1226'); bg.addColorStop(0.55,'#0F0F0F'); bg.addColorStop(1,'#160608');
    ctx.fillStyle=bg; ctx.fillRect(0,0,W,H);
    ctx.strokeStyle='rgba(90,127,184,0.14)'; ctx.lineWidth=1;
    var i;
    for(i=0;i<=W;i+=60){ ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,H); ctx.stroke(); }
    for(i=0;i<=H;i+=60){ ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(W,i); ctx.stroke(); }
    ctx.fillStyle='#A9C6F0';
    for(i=0;i<26;i++){
      var sx=(i*173.3)%W, sy=(i*97.7)%(H*0.45);
      ctx.globalAlpha=0.2+0.3*Math.abs(Math.sin(now/900+i));
      ctx.fillRect(sx,sy,2,2);
    }
    ctx.globalAlpha=1;
    if(an){ an.getByteFrequencyData(fdata); }
    var N2=32, bw=W/N2, base=H-124;
    for(i=0;i<N2;i++){
      var vv=(an&&MP.mode)?fdata[i]/255:0;
      var bh=6+vv*(H-200);
      var grd=ctx.createLinearGradient(0,base-bh,0,base);
      grd.addColorStop(0,'#FF6A2B'); grd.addColorStop(0.45,'#D42027'); grd.addColorStop(1,'#2A4A8A');
      ctx.fillStyle=grd;
      ctx.fillRect(i*bw+4,base-bh,bw-8,bh);
      if(vv>0.55){
        ctx.fillStyle='rgba(212,32,39,'+((vv-0.55)*1.6)+')';
        ctx.fillRect(i*bw+4,base-bh-6,bw-8,4);
      }
    }
    drawCorners(W,H);
    ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillStyle=C.red; ctx.font=mono(22,'700');
    ctx.fillText('MAGI AUDIO SYSTEM ▸ APP-10',84,72);
    ctx.textAlign='right';
    ctx.fillStyle=MP.mode?C.green:C.gray; ctx.font=mono(18,'700');
    ctx.fillText(MP.mode?((MP.paused||MP.pausedGen)?'PAUSED':'PLAYING'):'STANDBY',W-84,72);
    ctx.textAlign='left';
    if(MP.mode==='midi'&&MP.dur){
      ctx.fillStyle='rgba(255,255,255,.15)'; ctx.fillRect(100,H-104,W-200,8);
      ctx.fillStyle=C.red; ctx.fillRect(100,H-104,(W-200)*Math.min(1,MP.off/MP.dur),8);
      ctx.fillStyle=C.gray; ctx.font=mono(16);
      ctx.fillText(fmt(MP.off)+' / '+fmt(MP.dur),100,H-56);
      ctx.textAlign='right'; ctx.fillStyle=C.white; ctx.font=mono(16,'700');
      ctx.fillText(MP.name,W-100,H-56); ctx.textAlign='left';
    }else if(MP.mode==='gen'){
      ctx.fillStyle=C.gray; ctx.font=mono(16);
      ctx.fillText('∞ LOOP ▸ '+MP.name,100,H-56);
    }else{
      ctx.textAlign='center'; ctx.fillStyle=C.gray; ctx.font=cn(30);
      ctx.fillText('音樂室 待機中',W/2,H/2+10);
      ctx.font=mono(15);
      ctx.fillText('展開下方分組選擇曲目 ▸ 或載入 MIDI',W/2,H/2+46);
      ctx.textAlign='left';
    }
  }
  return {
    activate:function(){
      cv.width=W; cv.height=H;
      if(!bound){ bound=true; bindOnce(); }
      renderList();
      setStatus(MP.name?('▶ <b>'+MP.name+'</b>'):'■ 待機中 ▸ 展開分組選擇曲目');
    },
    tick:function(now){ render(now); }
  };
})();

registerApp({
  id:'music',
  glyph:'音',
  no:'APP-10',
  label:'音楽室',
  color:'#D42027',
  panel:MUSIC_PANEL
}, musicApp);
