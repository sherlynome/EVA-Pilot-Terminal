/* ===== APP-12 撥號（NERV 専用回線 ▸ DTMF 双音 ▸ 電話帳 ▸ 台詞字幕） ===== */
/* v2 面板：三视图切换（鍵盤 / 電話帳 / 記錄），不再纵向堆满整屏 */
var PH_CSS = '<style>' +
  '#panel-phone{padding-bottom:14px}' +
  /* ---- 顶部三视图切换 ---- */
  '.phTabs{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:10px}' +
  '.phTab{height:42px;border-radius:5px;background:#0B0708;border:1px solid #3B3B3B;color:#A9A29A;' +
    'font-family:"Courier New",monospace;font-size:12px;font-weight:700;letter-spacing:.12em;cursor:pointer;padding:0}' +
  '.phTab.active{background:linear-gradient(180deg,rgba(var(--ac-rgb),.26),rgba(var(--ac-rgb),.06));' +
    'border-color:var(--ac);color:#fff;box-shadow:0 0 12px rgba(var(--ac-rgb),.28),inset 0 0 0 1px rgba(var(--ac-rgb),.4)}' +
  '.phView{display:none}' +
  '.phView.on{display:block}' +
  /* ---- 键盘视图 ---- */
  '.phNum{font-family:"Courier New",monospace;font-size:27px;font-weight:700;color:#fff;text-align:center;' +
    'letter-spacing:.05em;padding:12px 6px;min-height:54px;background:#050505;border:1px solid #2A2A2A;' +
    'border-radius:5px;margin-bottom:9px;overflow:hidden;white-space:nowrap;' +
    'box-sizing:border-box;display:flex;align-items:center;justify-content:center}' +
  '.phNum.empty{color:#4A4A4A;font-size:14px;letter-spacing:.24em;font-weight:400}' +
  '.phPad{display:grid;grid-template-columns:repeat(3,1fr);gap:7px}' +
  '.phK{height:58px;border-radius:6px;background:#0B0708;border:1px solid #3B3B3B;color:#E8E0D6;' +
    'font-family:"Courier New",monospace;font-size:23px;font-weight:700;cursor:pointer;' +
    'position:relative;line-height:1;padding:0}' +
  '.phK small{position:absolute;left:0;right:0;bottom:5px;font-size:8px;color:#5E5E5E;' +
    'letter-spacing:.16em;font-weight:400;font-family:"Courier New",monospace}' +
  '.phK:active{background:var(--ac);color:var(--ac-on);border-color:var(--ac)}' +
  '.phAct{display:grid;grid-template-columns:1fr 1.5fr 1fr;gap:7px;margin-top:9px}' +
  '.phCall{height:54px;border-radius:6px;background:var(--ac);color:var(--ac-on);border:none;' +
    'font-size:13px;font-weight:900;letter-spacing:.1em;cursor:pointer;font-family:inherit}' +
  '.phEnd{height:54px;border-radius:6px;background:#170606;color:#FF5040;border:1px solid #5A1515;' +
    'font-size:13px;font-weight:900;cursor:pointer;font-family:inherit}' +
  '.phDel{height:54px;border-radius:6px;background:#050505;color:#8A8A8A;border:1px solid #3B3B3B;' +
    'font-size:13px;font-weight:700;cursor:pointer;font-family:inherit}' +
  '.phCall:disabled{opacity:.35;cursor:default}' +
  /* ---- 电话簿视图 ---- */
  '.phSearch{width:100%;box-sizing:border-box;height:42px;padding:0 12px;margin-bottom:8px;background:#050505;' +
    'border:1px solid #3B3B3B;border-radius:5px;color:#E8E0D6;font-size:13px;font-family:inherit;outline:none}' +
  '.phSearch:focus{border-color:var(--ac)}' +
  '#phBook{max-height:48vh;overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;' +
    'scrollbar-width:thin;scrollbar-color:rgba(var(--ac-rgb),.5) transparent}' +
  '#phBook::-webkit-scrollbar{width:3px}' +
  '#phBook::-webkit-scrollbar-thumb{background:rgba(var(--ac-rgb),.5);border-radius:0}' +
  '.phGrp{position:sticky;top:0;z-index:2;background:#080606;font-family:"Courier New",monospace;font-size:10px;' +
    'color:var(--ac);letter-spacing:.18em;padding:7px 4px 5px;border-bottom:1px solid rgba(var(--ac-rgb),.28)}' +
  '.phRow{display:flex;align-items:center;gap:10px;min-height:54px;padding:7px 10px;margin-top:5px;' +
    'border:1px solid #2E2E2E;border-radius:5px;background:#070707;cursor:pointer}' +
  '.phRow:active{background:#130708;border-color:var(--ac)}' +
  '.phRow .av{width:32px;height:32px;border-radius:50%;display:flex;align-items:center;' +
    'justify-content:center;font-size:14px;font-weight:900;flex:0 0 auto;background:#050505;' +
    'font-family:inherit;box-shadow:inset 0 0 8px rgba(0,0,0,.8)}' +
  '.phRow .nm{flex:1;min-width:0}' +
  '.phRow .nm b{display:block;font-size:13px;font-weight:700;color:#E8E0D6;letter-spacing:.03em;' +
    'white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
  '.phRow .nm i{display:block;font-family:"Courier New",monospace;font-size:9px;color:#5E5E5E;' +
    'font-style:normal;letter-spacing:.06em;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
  '.phRow .no{font-family:"Courier New",monospace;font-size:12px;color:var(--ac);font-weight:700;flex:0 0 auto}' +
  '.phRow .call{font-size:15px;color:#33FF66;flex:0 0 auto;opacity:.8}' +
  '.phEmpty{padding:26px 8px;text-align:center;color:#5E5E5E;font-size:12px}' +
  /* ---- 记录视图 ---- */
  '#phLogList{max-height:44vh;overflow-y:auto}' +
  '.phLogRow{display:flex;align-items:center;gap:10px;min-height:50px;padding:6px 10px;margin-top:5px;' +
    'border:1px solid #2A2A2A;border-radius:5px;background:#070707;cursor:pointer}' +
  '.phLogRow:active{background:#130708;border-color:var(--ac)}' +
  '.phLogRow .idx{font-family:"Courier New",monospace;font-size:11px;color:#5E5E5E;flex:0 0 22px}' +
  '.phLogRow .who{flex:1;min-width:0;font-size:13px;font-weight:700;color:#E0D8CE;' +
    'white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
  '.phLogRow.miss .who{color:#C8C8C8}' +
  '.phLogRow .st{font-family:"Courier New",monospace;font-size:10px;color:#7A7A7A;flex:0 0 auto}' +
  '.phLogRow .du{font-family:"Courier New",monospace;font-size:11px;color:#E4E4E4;flex:0 0 auto;min-width:44px;text-align:right}' +
  '.phStat{display:flex;gap:8px;margin:10px 0 2px}' +
  '.phStat div{flex:1;border:1px solid #2A2A2A;border-radius:5px;background:#050505;padding:8px 6px;text-align:center}' +
  '.phStat b{display:block;font-family:"Courier New",monospace;font-size:17px;color:var(--ac)}' +
  '.phStat span{display:block;font-size:9px;color:#5E5E5E;letter-spacing:.12em;margin-top:2px}' +
  '</style>';

var PH_PANEL = PH_CSS +
  '<div class="phTabs" id="phTabs">' +
    '<button class="phTab active" data-v="pad">鍵　盤</button>' +
    '<button class="phTab" data-v="book">電話帳</button>' +
    '<button class="phTab" data-v="log">記　錄</button>' +
  '</div>' +
  /* --- 视图 1：键盘 --- */
  '<div class="phView on" id="phViewPad">' +
    '<div class="phNum empty" id="phNum">— 待 機 —</div>' +
    '<div class="phPad" id="phPad">' +
      '<button class="phK" data-k="1" data-nosfx="1">1<small>&nbsp;</small></button>' +
      '<button class="phK" data-k="2" data-nosfx="1">2<small>ABC</small></button>' +
      '<button class="phK" data-k="3" data-nosfx="1">3<small>DEF</small></button>' +
      '<button class="phK" data-k="4" data-nosfx="1">4<small>GHI</small></button>' +
      '<button class="phK" data-k="5" data-nosfx="1">5<small>JKL</small></button>' +
      '<button class="phK" data-k="6" data-nosfx="1">6<small>MNO</small></button>' +
      '<button class="phK" data-k="7" data-nosfx="1">7<small>PQRS</small></button>' +
      '<button class="phK" data-k="8" data-nosfx="1">8<small>TUV</small></button>' +
      '<button class="phK" data-k="9" data-nosfx="1">9<small>WXYZ</small></button>' +
      '<button class="phK" data-k="*" data-nosfx="1">＊<small>&nbsp;</small></button>' +
      '<button class="phK" data-k="0" data-nosfx="1">0<small>&nbsp;</small></button>' +
      '<button class="phK" data-k="#" data-nosfx="1">＃<small>&nbsp;</small></button>' +
    '</div>' +
    '<div class="phAct">' +
      '<button class="phDel" id="phDel">⌫ 削除</button>' +
      '<button class="phCall" id="phCall">発　信</button>' +
      '<button class="phEnd" id="phEnd">終　話</button>' +
    '</div>' +
    '<div class="avhint">▸ 撥通角色會出現台詞（日文 + 中文翻譯，無語音）▸ 記錄自動保存</div>' +
  '</div>' +
  /* --- 视图 2：电话簿 --- */
  '<div class="phView" id="phViewBook">' +
    '<input class="phSearch" id="phSearch" placeholder="搜尋姓名 / 分機 / 身份" autocomplete="off">' +
    '<div id="phBook"></div>' +
  '</div>' +
  /* --- 视图 3：记录 --- */
  '<div class="phView" id="phViewLog">' +
    '<div class="phStat" id="phStat"></div>' +
    '<div id="phLogList"></div>' +
    '<div class="btnrow"><button class="mainbtn ghostbtn" id="phLogClear">清空記錄</button></div>' +
  '</div>';

var phoneApp = (function(){
  var W = 1080, H = 760;
  var DTMF = {
    '1':[697,1209], '2':[697,1336], '3':[697,1477],
    '4':[770,1209], '5':[770,1336], '6':[770,1477],
    '7':[852,1209], '8':[852,1336], '9':[852,1477],
    '*':[941,1209], '0':[941,1336], '#':[941,1477]
  };
  /* ---- 角色電話帳（14 名 ▸ 撥通後播放台詞字幕，無語音） ----
     台詞取自 TV 版 / 劇場版名場面，日文原文 + 中文翻譯 */
  var BOOK = [
    { no:'0001', grp:'司令部 ▸ COMMAND', name:'碇源堂', jp:'碇ゲンドウ', role:'NERV 総司令 ▸ 总司令', col:'#D42027', lines:[
      ['……', '……'],
      ['最優先事項だ。', '这是最优先事项。'],
      ['所詮、人間の敵は人間だよ。', '说到底，人类的敌人还是人类。'],
      ['ぬるいな……', '太温了……'],
      ['死は何も生み出さない。', '死亡无法孕育出任何东西。'],
      ['進化の終着点は、自己崩壊だ。', '进化的终点，是自我毁灭。'],
      ['話すことはない。', '无话可说。'],
      ['……以上だ。', '……就这样。']
    ]},
    { no:'0002', grp:'司令部 ▸ COMMAND', name:'冬月耕造', jp:'冬月コウゾウ', role:'NERV 副司令 ▸ 副司令', col:'#C8B898', lines:[
      ['もしもし、冬月だ。', '喂，我是冬月。'],
      ['碇君の判断が、常に正しいとは限らんよ。', '碇的判断，未必总是正确的。'],
      ['人類は、自ら滅びへの道を選んだのかもしれん。', '人类或许是自己选择了走向毁灭的路。'],
      ['あの日から、私も変わってはいない。', '从那天起，我也没有变过。'],
      ['若い者には、まだ時間がある。', '年轻人还有时间。'],
      ['……難しい話は、酒でも飲みながらにしよう。', '……复杂的话题，还是边喝酒边聊吧。']
    ]},
    { no:'0301', grp:'技術局・作戦部 ▸ STAFF', name:'赤木律子', jp:'赤木リツコ', role:'技術開発部 博士 ▸ 技术开发部', col:'#8A5CF0', lines:[
      ['もしもし、赤木よ。', '喂，我是赤木。'],
      ['データは嘘をつきません。それが全て。', '数据不会说谎。那就是全部。'],
      ['男女の間に、論理はないのよ。', '男女之间，是没有逻辑的。'],
      ['進化の終わりは、死よ。', '进化的终点，是死。'],
      ['あなたの精神波形、少しノイズが混じってる。', '你的精神波形里，混进了一点噪声。'],
      ['感情は計算の外にある。だから厄介なの。', '感情在计算之外。所以才麻烦。'],
      ['……母と同じことを、繰り返しているだけかもしれない。', '……也许我只是在重复母亲做过的事。'],
      ['……無理はしないことね。', '……别太勉强自己。']
    ]},
    { no:'0302', grp:'技術局・作戦部 ▸ STAFF', name:'葛城美里', jp:'葛城ミサト', role:'作戦部一課 部長 ▸ 作战部一课', col:'#E8412A', lines:[
      ['はい、葛城です。', '喂，我是葛城。'],
      ['奇跡ってのは、起こしてこそ初めて価値がでるものよ。', '奇迹这种东西，只有被引发出来才有价值。'],
      ['生きていれば、どこだって天国よ。', '只要活着，哪里都是天堂。'],
      ['大人になれよ、シンジ。', '长大吧，真嗣。'],
      ['あら、どうしたの？ こんな時間に。', '哎呀，怎么了？这个时间打来。'],
      ['今日の作戦はもう終わり。ゆっくり休んでいいわよ。', '今天的作战结束了。好好休息吧。'],
      ['後悔するのは、生きてる人間の特権でしょ。', '后悔，是活着的人的特权吧。'],
      ['……冷蔵庫のビール、まだ残ってるわよ。', '……冰箱里的啤酒，还留着呢。']
    ]},
    { no:'0303', grp:'技術局・作戦部 ▸ STAFF', name:'伊吹玛雅', jp:'伊吹マヤ', role:'技術開発部 オペレーター ▸ 技术开发部', col:'#7FD8E8', lines:[
      ['はい、技術局です。', '喂，这里是技术局。'],
      ['パターン青、確認しました。', '已确认蓝色模式。'],
      ['データは正常値です。問題ありません。', '数据正常。没有问题。'],
      ['先輩、この数値……ちょっと変です。', '前辈，这个数值……有点奇怪。'],
      ['MAGI の演算、間に合いますか……？', 'MAGI 的运算，来得及吗……？'],
      ['……あ、すみません、今ちょっと手が離せなくて。', '……啊抱歉，我现在手上走不开。'],
      ['はい。それでは、失礼します。', '好。那么，先挂了。']
    ]},
    { no:'0304', grp:'技術局・作戦部 ▸ STAFF', name:'加持良治', jp:'加持リョウジ', role:'調査部 ▸ 调查部', col:'#F5C400', lines:[
      ['やあ。加持だ。', '哟，我是加持。'],
      ['辛いことを知ってる人間の方が、それだけ人に優しくできる。それは弱さと違うからな。', '知道痛苦的人，才更能对别人温柔。那和软弱不一样。'],
      ['葛城、真実はあなたと共にある。迷わず進みなさい。', '葛城，真实与你同在。别犹豫，往前走。'],
      ['大人の事情、ってやつさ。', '就是所谓「大人的事情」。'],
      ['スイカ、美味かっただろ？', '西瓜很好吃吧？'],
      ['最後の仕事は、血のように赤い。', '最后的工作，像血一样红。'],
      ['……その話は、電話じゃできないな。', '……那件事，电话里不方便说。'],
      ['ま、生きてればまた会える。', '嘛，活着就还能再见。']
    ]},
    { no:'0305', grp:'技術局・作戦部 ▸ STAFF', name:'日向诚', jp:'日向マコト', role:'作戦部 オペレーター ▸ 操作员', col:'#9FD8A0', lines:[
      ['はい、日向です。', '喂，我是日向。'],
      ['目標、第3新東京市に接近中！', '目标正在接近第三新东京市！'],
      ['エネルギー反応、まだ消えません。', '能量反应，仍未消失。'],
      ['ミサトさん、命令を！', '美里小姐，请下命令！'],
      ['……あの、報告だけです。お疲れ様です。', '……那个，只是汇报。辛苦了。']
    ]},
    { no:'0306', grp:'技術局・作戦部 ▸ STAFF', name:'青叶茂', jp:'青葉シゲル', role:'技術部 オペレーター ▸ 操作员', col:'#8FB8E8', lines:[
      ['青葉です。', '我是青叶。'],
      ['ハーモニクス、正常。', '谐波正常。'],
      ['パターン、解析できません……！', '模式解析不出来……！'],
      ['……静かですね。今日は。', '……今天真安静啊。'],
      ['了解。回線、維持します。', '明白。线路保持。']
    ]},
    { no:'0901', grp:'適格者・関係者 ▸ PILOTS', name:'碇真嗣', jp:'碇シンジ', role:'初号機 ▸ 初号机驾驶员', col:'#5FD35F', lines:[
      ['……もしもし。', '……喂。'],
      ['逃げちゃダメだ、逃げちゃダメだ、逃げちゃダメだ。', '不能逃，不能逃，不能逃。'],
      ['笑えばいいと思うよ。', '我觉得，笑一笑就好了。'],
      ['僕が、僕でいていいのかな。', '我，可以是我自己吗。'],
      ['みんな、僕を必要としてくれるのかな。', '大家，会需要我吗。'],
      ['わかってる。わかってるんだけど……', '我知道。我知道的，可是……'],
      ['……ごめん。少し、考えさせて。', '……抱歉。让我想一想。']
    ]},
    { no:'0902', grp:'適格者・関係者 ▸ PILOTS', name:'绫波丽', jp:'綾波レイ', role:'零号機 ▸ 零号机驾驶员', col:'#7FD8E8', lines:[
      ['……はい。', '……嗯。'],
      ['ごめんなさい。こういう時、どんな顔をすればいいのかわからないの。', '对不起。这种时候，我不知道该用什么表情。'],
      ['私が死んでも、代わりはいるもの。', '就算我死了，也会有替代品。'],
      ['死ぬことと、消えることは、違う。', '死和消失，是不一样的。'],
      ['私は、私。', '我就是我。'],
      ['心って、何？', '心，是什么？'],
      ['……あなたは、誰？', '……你是谁？'],
      ['……あなたの声、記録した。', '……你的声音，我记下了。']
    ]},
    { no:'0903', grp:'適格者・関係者 ▸ PILOTS', name:'明日香', jp:'惣流・アスカ・ラングレー', role:'弐号機 ▸ 二号机驾驶员', col:'#F5A623', lines:[
      ['もしもし？ アスカよ。', '喂？我是明日香。'],
      ['あんたバカ？', '你是白痴吗？'],
      ['あたしに任せなさいよ。全部。', '全都交给我吧。'],
      ['エリートは、愚民を引っ張る義務があるのよ。', '精英有义务拉愚民一把。'],
      ['一人で平気よ。ずっと、そうしてきたんだから。', '一个人也没关系。我一直都是这样过来的。'],
      ['……バカシンジ。', '……笨蛋真嗣。'],
      ['気持ち悪い。', '感觉真恶心。'],
      ['ま、いっか。あとで話すわ。', '算了。之后再说。']
    ]},
    { no:'0904', grp:'適格者・関係者 ▸ PILOTS', name:'渚薰', jp:'渚カヲル', role:'第5適格者 ▸ 第17使徒', col:'#C9A8FF', lines:[
      ['やあ。渚カヲルだ。', '你好。我是渚薰。'],
      ['僕は君と会う為に生まれてきたんだね。', '我大概是为了与你相遇才出生的。'],
      ['人の心は、ガラスでできているんだ。特に君の心は、とても繊細で……', '人的心是玻璃做的。尤其是你的心，非常纤细……'],
      ['人は、心と心が完全に理解し合うことはできない。', '人与人的心，无法完全理解彼此。'],
      ['僕にとって、生と死は同じだ。死は唯一の絶対的自由だ。', '对我来说，生与死是一样的。死是唯一的绝对自由。'],
      ['歌はいいね。歌は心を潤す。', '歌真好啊。歌能滋润心灵。'],
      ['また会えるよ、碇君。', '还会再见的，碇君。']
    ]},
    { no:'0905', grp:'適格者・関係者 ▸ PILOTS', name:'铃原东治', jp:'鈴原トウジ', role:'第4適格者 ▸ 三号机', col:'#E8B060', lines:[
      ['おう、東治だ。', '哦，我是东治。'],
      ['シンジ、元気か？', '真嗣，还好吗？'],
      ['妹の世話があんだよ、悪いな。', '我得照顾妹妹，抱歉啊。'],
      ['お前さ、もうちょい自分を大事にしろよ。', '你啊，稍微对自己好一点吧。'],
      ['……悪かったな。いろいろ。', '……抱歉啊。很多事情。']
    ]},
    { no:'0906', grp:'適格者・関係者 ▸ PILOTS', name:'洞木光', jp:'洞木ヒカリ', role:'2年A組 委員長 ▸ 班长', col:'#F0C8D8', lines:[
      ['はい、洞木です。', '喂，我是洞木。'],
      ['明日香ちゃん、今日も元気ないね。', '明日香，今天也没什么精神呢。'],
      ['委員長として、見逃せません！', '作为班长，我可不能坐视不管！'],
      ['みんなでお弁当、食べようよ。', '大家一起来吃便当吧。'],
      ['……無理しなくていいんだよ。', '……不用勉强的。']
    ]}
  ];

  var num = '', state = 'idle', dialAt = 0, talkAt = 0, hangDur = 0;
  var log = [], bound = false;
  var ac2 = null, ringTimer = null;
  var active = null, lineIdx = 0, lineAt = 0;
  var view = 'pad', kw = '';
  var LOG_KEY = 'eva_phone_log';

  function loadLog(){
    try{
      var raw = localStorage.getItem(LOG_KEY);
      if (raw){ log = JSON.parse(raw) || []; }
    }catch(e){ log = []; }
    if (!log.length){
      log = [
        {n:'作戦部一課', t:'通話', d:42, ts:0},
        {n:'技術開発部', t:'未接続', d:0,  ts:0},
        {n:'不明',       t:'通話', d:18, ts:0}
      ];
    }
  }
  function saveLog(){
    try{ localStorage.setItem(LOG_KEY, JSON.stringify(log.slice(0, 12))); }catch(e){}
  }
  function fmtNum(s){
    if (!s) return '';
    var out = '', i;
    for (i = 0; i < s.length; i++){
      out += s.charAt(i);
      if (i === 2 && s.length > 3) out += ' ';
      else if (i === 6 && s.length > 7) out += ' ';
    }
    return out;
  }
  function mmss(ms){
    var s = Math.max(0, Math.floor(ms / 1000));
    var m = Math.floor(s / 60), r = s % 60;
    return (m < 10 ? '0' : '') + m + ':' + (r < 10 ? '0' : '') + r;
  }
  function findBook(n){
    var i;
    for (i = 0; i < BOOK.length; i++){ if (BOOK[i].no === n){ return BOOK[i]; } }
    return null;
  }
  function dtmf(k){
    try{
      if (!ac2){ ac2 = new (window.AudioContext || window.webkitAudioContext)(); }
      if (ac2.state === 'suspended'){ ac2.resume(); }
      var f = DTMF[k]; if (!f) return;
      var t = ac2.currentTime, g = ac2.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.075, t + 0.006);
      g.gain.setValueAtTime(0.075, t + 0.085);
      g.gain.linearRampToValueAtTime(0.0001, t + 0.13);
      g.connect(ac2.destination);
      var i;
      for (i = 0; i < 2; i++){
        var o = ac2.createOscillator();
        o.type = 'sine';
        o.frequency.value = f[i];
        o.connect(g); o.start(t); o.stop(t + 0.15);
      }
    }catch(e){}
  }
  function ringStart(){
    try{
      if (!ac2){ ac2 = new (window.AudioContext || window.webkitAudioContext)(); }
      if (ac2.state === 'suspended'){ ac2.resume(); }
      ringStop();
      var beep = function(){
        try{
          var t = ac2.currentTime, g = ac2.createGain();
          g.gain.setValueAtTime(0.0001, t);
          g.gain.linearRampToValueAtTime(0.035, t + 0.03);
          g.gain.setValueAtTime(0.035, t + 0.72);
          g.gain.linearRampToValueAtTime(0.0001, t + 0.78);
          g.connect(ac2.destination);
          var o = ac2.createOscillator();
          o.type = 'sine'; o.frequency.value = 420;
          o.connect(g); o.start(t); o.stop(t + 0.8);
        }catch(e){}
      };
      beep();
      ringTimer = setInterval(beep, 1600);
    }catch(e){}
  }
  function ringStop(){
    if (ringTimer){ clearInterval(ringTimer); ringTimer = null; }
  }
  function setNumLine(){
    var el = document.getElementById('phNum');
    if (!el) return;
    if (state === 'talking' && active){
      el.className = 'phNum';
      el.textContent = active.name;
    }else if (num){
      el.className = 'phNum';
      el.textContent = fmtNum(num);
    }else{
      el.className = 'phNum empty';
      el.textContent = '— 待 機 —';
    }
    var c = document.getElementById('phCall');
    if (c){ c.disabled = (state !== 'idle'); }
  }
  function addDigit(k){
    if (state !== 'idle'){ SFX.deny(); toast('通話中 ▸ 請先終話'); return; }
    if (num.length >= 16){ SFX.deny(); return; }
    num += k;
    dtmf(k);
    setNumLine();
  }
  function dial(){
    if (state !== 'idle'){ return; }
    if (!num){ SFX.deny(); toast('請輸入號碼'); return; }
    state = 'dialing';
    dialAt = new Date().getTime();
    active = findBook(num);
    lineIdx = 0;
    ringStart();
    SFX.grant();
    setNumLine();
  }
  function hangup(){
    if (state === 'idle'){
      SFX.deny();
      if (num){ num = ''; setNumLine(); }
      return;
    }
    var now = new Date().getTime();
    var wasTalking = (state === 'talking');
    hangDur = wasTalking ? (now - talkAt) : 0;
    var label = active ? active.name : (num || '匿名');
    log.unshift({ n: label, t: wasTalking ? '通話' : '未接続', d: Math.floor(hangDur / 1000), ts: now });
    saveLog();
    ringStop();
    state = 'idle';
    num = '';
    active = null;
    lineIdx = 0;
    SFX.deny();
    toast(wasTalking ? '已終話' : '已切斷');
    setNumLine();
    renderLog();
  }
  function callBook(no){
    if (state !== 'idle'){ SFX.deny(); toast('通話中 ▸ 請先終話'); return; }
    num = no;
    setNumLine();
    setView('pad');
    dial();
  }
  /* ---- 三视图切换 ---- */
  function setView(v){
    view = v;
    var ids = ['pad', 'book', 'log'], i;
    for (i = 0; i < ids.length; i++){
      var box = document.getElementById('phView' + ids[i].charAt(0).toUpperCase() + ids[i].slice(1));
      if (box){ box.className = 'phView' + (ids[i] === v ? ' on' : ''); }
    }
    var tabs = document.querySelectorAll('#phTabs .phTab');
    for (i = 0; i < tabs.length; i++){
      var on = (tabs[i].getAttribute('data-v') === v);
      tabs[i].className = 'phTab' + (on ? ' active' : '');
    }
    if (v === 'log'){ renderLog(); }
  }
  /* ---- 电话簿（分组 + 搜索） ---- */
  function renderBook(){
    var box = document.getElementById('phBook');
    if (!box) return;
    var q = (kw || '').toLowerCase();
    var h = '', i, lastGrp = null, hit = 0;
    for (i = 0; i < BOOK.length; i++){
      var b = BOOK[i];
      if (q){
        var hay = (b.name + ' ' + b.jp + ' ' + b.no + ' ' + b.role).toLowerCase();
        if (hay.indexOf(q) < 0){ continue; }
      }
      if (b.grp !== lastGrp){
        h += '<div class="phGrp">' + b.grp + '</div>';
        lastGrp = b.grp;
      }
      h += '<div class="phRow" data-no="' + b.no + '">' +
             '<div class="av" style="border:1px solid ' + b.col + ';color:' + b.col + '">' + b.name.charAt(0) + '</div>' +
             '<div class="nm"><b>' + b.name + '</b><i>' + b.jp + ' ▸ ' + b.role + '</i></div>' +
             '<div class="no">' + b.no + '</div>' +
             '<div class="call">▸</div>' +
           '</div>';
      hit++;
    }
    box.innerHTML = hit ? h : '<div class="phEmpty">▸ 無符合的聯絡人<br>試試「赤木」「0301」「技術」</div>';
    var rows = box.querySelectorAll('.phRow');
    for (i = 0; i < rows.length; i++){
      (function(r){
        r.addEventListener('click', function(){ callBook(r.getAttribute('data-no')); });
      })(rows[i]);
    }
  }
  /* ---- 记录视图 ---- */
  function renderLog(){
    var box = document.getElementById('phLogList');
    var st = document.getElementById('phStat');
    if (!box) return;
    var total = 0, talk = 0, i;
    for (i = 0; i < log.length; i++){
      total += (log[i].d || 0);
      if (log[i].t === '通話'){ talk++; }
    }
    if (st){
      st.innerHTML =
        '<div><b>' + log.length + '</b><span>件數</span></div>' +
        '<div><b>' + talk + '</b><span>已接通</span></div>' +
        '<div><b>' + mmss(total * 1000) + '</b><span>累計通話</span></div>';
    }
    var h = '';
    for (i = 0; i < log.length; i++){
      var r = log[i];
      h += '<div class="phLogRow' + (r.t === '通話' ? '' : ' miss') + '" data-n="' + r.n + '">' +
             '<div class="idx">' + (i + 1 < 10 ? '0' : '') + (i + 1) + '</div>' +
             '<div class="who">' + r.n + '</div>' +
             '<div class="st">' + (r.t === '通話' ? '▸ 已接通' : '✕ 未接') + '</div>' +
             '<div class="du">' + mmss((r.d || 0) * 1000) + '</div>' +
           '</div>';
    }
    box.innerHTML = h || '<div class="phEmpty">▸ 尚無通話記錄</div>';
    var rows = box.querySelectorAll('.phLogRow');
    for (i = 0; i < rows.length; i++){
      (function(r){
        r.addEventListener('click', function(){
          var n = r.getAttribute('data-n'), k;
          for (k = 0; k < BOOK.length; k++){
            if (BOOK[k].name === n || BOOK[k].no === n){ callBook(BOOK[k].no); return; }
          }
          SFX.deny(); toast('該號碼不在電話帳內');
        });
      })(rows[i]);
    }
  }
  function bindOnce(){
    var pad = document.getElementById('phPad');
    var ks = pad ? pad.querySelectorAll('.phK') : [];
    var i;
    for (i = 0; i < ks.length; i++){
      (function(btn){
        btn.addEventListener('click', function(){ addDigit(btn.getAttribute('data-k')); });
      })(ks[i]);
    }
    var d = document.getElementById('phDel');
    if (d){ d.addEventListener('click', function(){
      if (state !== 'idle'){ return; }
      if (num){ num = num.substring(0, num.length - 1); SFX.click(); setNumLine(); }
    }); }
    var c = document.getElementById('phCall');
    if (c){ c.addEventListener('click', dial); }
    var e2 = document.getElementById('phEnd');
    if (e2){ e2.addEventListener('click', hangup); }
    /* 视图 tab */
    var tabs = document.querySelectorAll('#phTabs .phTab');
    for (i = 0; i < tabs.length; i++){
      (function(t){
        t.addEventListener('click', function(){ SFX.click(); setView(t.getAttribute('data-v')); });
      })(tabs[i]);
    }
    /* 搜索 */
    var s = document.getElementById('phSearch');
    if (s){
      s.addEventListener('input', function(){ kw = s.value || ''; renderBook(); });
    }
    /* 清空记录 */
    var cl = document.getElementById('phLogClear');
    if (cl){
      cl.addEventListener('click', function(){
        log = []; saveLog(); renderLog(); SFX.deny(); toast('已清空通話記錄');
      });
    }
    renderBook(); renderLog();
  }
  /* ---- 主画布 ---- */
  function render(now){
    ctx.fillStyle = C.black; ctx.fillRect(0, 0, W, H);
    var bg = ctx.createLinearGradient(0, H * 0.42, 0, H);
    bg.addColorStop(0, 'rgba(' + hexRgb(C.darkred) + ',0)');
    bg.addColorStop(1, 'rgba(' + hexRgb(C.darkred) + ',0.24)');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(' + hexRgb(C.red) + ',0.09)';
    ctx.lineWidth = 1;
    var i;
    for (i = 0; i <= W; i += 72){ ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, H); ctx.stroke(); }
    for (i = 0; i <= H; i += 72){ ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(W, i); ctx.stroke(); }

    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = C.red; ctx.font = mono(22, '700');
    ctx.fillText('NERV 専用回線 ▸ APP-12', 84, 72);
    var st = state === 'idle' ? 'STANDBY' : state === 'dialing' ? 'CONNECTING' : 'IN CALL';
    var stc = state === 'idle' ? C.gray : (state === 'dialing' ? C.yellow : C.green);
    ctx.textAlign = 'right'; ctx.fillStyle = stc; ctx.font = mono(18, '700');
    ctx.fillText(st, W - 84, 72);
    ctx.beginPath();
    ctx.arc(W - 96, 66, 5, 0, Math.PI * 2);
    ctx.fillStyle = stc;
    ctx.globalAlpha = (state === 'idle') ? 0.4 : (0.55 + 0.45 * Math.abs(Math.sin(now / 420)));
    ctx.fill(); ctx.globalAlpha = 1;

    var isTalk = (state === 'talking');

    if (isTalk){
      var N = 36, bw = 10, gap = (W - 200) / N;
      for (i = 0; i < N; i++){
        var amp = Math.abs(Math.sin(now / 180 + i * 0.55)) * 0.7 + 0.3;
        var hh = 8 + amp * 66 * (0.5 + 0.5 * Math.abs(Math.sin(now / 900 + i * 0.2)));
        ctx.fillStyle = (i % 2 === 0) ? C.red : C.orange;
        ctx.globalAlpha = 0.30 + amp * 0.45;
        ctx.fillRect(100 + i * gap, H * 0.175 - hh / 2, bw, hh);
      }
      ctx.globalAlpha = 1;
    }
    if (state === 'dialing'){
      var ph = ((now - dialAt) % 2000) / 2000;
      for (i = 0; i < 3; i++){
        var p = (ph + i / 3) % 1;
        ctx.beginPath();
        ctx.arc(W / 2, H * 0.17, 90 + p * 240, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(' + hexRgb(C.red) + ',' + (0.22 * (1 - p)).toFixed(3) + ')';
        ctx.lineWidth = 3;
        ctx.stroke();
      }
    }

    /* ===== 通话 / 拨号中：占满画布 ===== */
    if (state !== 'idle'){
      var big, bigFont, bigY;
      if (isTalk && active){
        big = active.name; bigFont = cn(58, '700'); bigY = H * 0.275;
      }else{
        big = fmtNum(num); bigFont = mono(96, '700'); bigY = H * 0.36;
      }
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = bigFont;
      var lim = (isTalk && active) ? W - 120 : W - 200;
      if (ctx.measureText(big).width > lim){
        var fs = (isTalk && active) ? 58 : 96;
        while (ctx.measureText(big).width > lim && fs > 34){
          fs -= 4; ctx.font = (isTalk && active) ? cn(fs, '700') : mono(fs, '700');
        }
      }
      ctx.fillStyle = C.white;
      drawSpaced(big, W / 2, bigY, (isTalk && active) ? 3 : 5, 'center');

      if (isTalk && active){
        ctx.fillStyle = active.col; ctx.font = mono(19, '700');
        drawSpaced(active.no + ' ▸ ' + active.jp + ' ▸ ' + active.role, W / 2, bigY + 50, 1, 'center');
        ctx.fillStyle = C.green; ctx.font = mono(32, '700');
        drawSpaced(mmss(now - talkAt), W / 2, bigY + 96, 6, 'center');
      }else{
        ctx.fillStyle = C.yellow; ctx.font = mono(22, '700');
        drawSpaced('接 続 中 …', W / 2, bigY + 108, 10, 'center');
      }

      /* ---- 台詞字幕 ---- */
      if (isTalk && active){
        var ly0 = bigY + 138;
        ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
        ctx.fillStyle = active.col; ctx.font = mono(15, '700');
        drawSpaced('▸ ' + active.name + ' ▸ 日文原文 + 中文字幕', 100, ly0, 2, 'left');
        var from = Math.max(0, lineIdx - 1), k, row = 0;
        for (k = from; k <= lineIdx; k++){
          var it2 = active.lines[k], newest = (k === lineIdx);
          var yy = ly0 + 44 + row * 92;
          ctx.globalAlpha = newest ? 1 : 0.40;
          ctx.fillStyle = newest ? C.white : '#B8B2AA';
          ctx.font = cn(newest ? 37 : 27);
          ctx.fillText(it2[0], 100, yy);
          ctx.fillStyle = newest ? '#D9D1C4' : '#8E8E8E';
          ctx.font = cn(newest ? 25 : 20);
          ctx.fillText(it2[1], 100, yy + (newest ? 34 : 26));
          ctx.globalAlpha = 1;
          row++;
        }
        ctx.strokeStyle = 'rgba(' + hexRgb(C.red) + ',.28)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(100, H - 92); ctx.lineTo(W - 100, H - 92); ctx.stroke();
        ctx.fillStyle = C.gray; ctx.font = mono(14);
        drawSpaced('LINE SECURED ▸ NERV PRIVATE NETWORK', 100, H - 58, 3, 'left');
        ctx.textAlign = 'right';
        ctx.fillStyle = 'rgba(' + hexRgb(active.col) + ',.75)';
        drawSpaced('SIGNAL ' + (3 + Math.floor(Math.abs(Math.sin(now / 700)) * 2)) + '/5', W - 100, H - 58, 2, 'right');
        ctx.textAlign = 'left';
        drawCorners(W, H);
        return;
      }
      drawCorners(W, H);
      return;
    }

    /* ===== 待机：按当前 tab 切换画布内容 ===== */
    if (view === 'pad'){
      var big2 = num ? fmtNum(num) : '待 機 中';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      var fsz = num ? 96 : 72;
      ctx.font = mono(fsz, '700');
      while (ctx.measureText(big2).width > W - 200 && fsz > 34){
        fsz -= 4; ctx.font = mono(fsz, '700');
      }
      ctx.fillStyle = num ? C.white : C.gray;
      drawSpaced(big2, W / 2, H * 0.36, 5, 'center');
      /* 提示：切换下方電話帳 */
      ctx.fillStyle = C.gray; ctx.font = mono(17);
      drawSpaced('▼ 下方切換 電話帳 / 記錄', W / 2, H * 0.36 + 96, 4, 'center');

      /* 最近一通 */
      if (log.length){
        var r0 = log[0];
        ctx.fillStyle = 'rgba(0,0,0,.62)';
        ctx.fillRect(120, H - 200, W - 240, 108);
        ctx.strokeStyle = 'rgba(' + hexRgb(C.red) + ',.30)'; ctx.lineWidth = 1;
        ctx.strokeRect(120.5, H - 199.5, W - 241, 107);
        ctx.textAlign = 'left';
        ctx.fillStyle = C.red; ctx.font = mono(15, '700');
        drawSpaced('LAST CALL ▸ 最近一通', 148, H - 164, 3, 'left');
        ctx.fillStyle = C.white; ctx.font = mono(30, '700');
        ctx.fillText(r0.n, 148, H - 118);
        ctx.textAlign = 'right';
        ctx.fillStyle = '#B8B8B8'; ctx.font = mono(18);
        ctx.fillText(r0.t + '  ' + mmss((r0.d || 0) * 1000), W - 148, H - 118);
        ctx.textAlign = 'left';
      }
    }else if (view === 'book'){
      /* 电话簿统计视图 */
      ctx.textAlign = 'left';
      ctx.fillStyle = C.gray; ctx.font = mono(16, '700');
      drawSpaced('ADDRESS BOOK ▸ NERV 内線', 100, 148, 4, 'left');
      ctx.fillStyle = C.white; ctx.font = mono(72, '700');
      ctx.fillText(pad2(BOOK.length), 100, 232);
      ctx.fillStyle = C.red; ctx.font = mono(20, '700');
      drawSpaced('名 登 録', 100 + ctx.measureText('00').width * 2.6, 232, 4, 'left');

      /* 按组列名字，两列 */
      var grps = {}, order = [], gi, bi;
      for (bi = 0; bi < BOOK.length; bi++){
        if (!grps[BOOK[bi].grp]){ grps[BOOK[bi].grp] = []; order.push(BOOK[bi].grp); }
        grps[BOOK[bi].grp].push(BOOK[bi]);
      }
      var colX = [100, W / 2 + 10], cx = 0, yy2 = 300;
      for (gi = 0; gi < order.length; gi++){
        var gname = order[gi], list = grps[gname];
        if (yy2 > H - 150){ cx = 1; yy2 = 300; }
        var px = colX[cx];
        ctx.fillStyle = C.red; ctx.font = mono(14, '700');
        drawSpaced(gname, px, yy2, 2, 'left');
        yy2 += 30;
        for (bi = 0; bi < list.length; bi++){
          ctx.fillStyle = list[bi].col; ctx.font = mono(13);
          ctx.fillText(list[bi].no, px, yy2);
          ctx.fillStyle = C.white; ctx.font = cn(24);
          ctx.fillText(list[bi].name, px + 62, yy2);
          ctx.fillStyle = C.gray; ctx.font = mono(13);
          ctx.fillText(list[bi].jp, px + 220, yy2);
          yy2 += 38;
        }
        yy2 += 12;
      }
    }else{
      /* 记录视图：完整列表 */
      ctx.textAlign = 'left';
      ctx.fillStyle = C.gray; ctx.font = mono(16, '700');
      drawSpaced('CALL LOG ▸ 通話記錄', 100, 148, 4, 'left');
      ctx.fillStyle = C.white; ctx.font = mono(56, '700');
      ctx.fillText(pad2(log.length), 100, 226);
      ctx.fillStyle = C.gray; ctx.font = mono(18);
      drawSpaced('件', 100 + 90, 226, 2, 'left');

      var n2 = Math.min(6, log.length), j;
      for (j = 0; j < n2; j++){
        var rr = log[j], ry = 300 + j * 56;
        if (j % 2 === 0){
          ctx.fillStyle = 'rgba(255,255,255,.035)';
          ctx.fillRect(88, ry - 34, W - 176, 48);
        }
        ctx.fillStyle = C.gray; ctx.font = mono(14);
        ctx.fillText(pad2(j + 1), 100, ry);
        ctx.fillStyle = (rr.t === '通話') ? C.white : '#B0B0B0'; ctx.font = mono(26, '700');
        ctx.fillText(rr.n, 150, ry);
        ctx.textAlign = 'right';
        ctx.fillStyle = (rr.t === '通話') ? C.green : C.red; ctx.font = mono(15);
        ctx.fillText(rr.t === '通話' ? '▸ 已接通' : '✕ 未接', W - 220, ry);
        ctx.fillStyle = '#D8D8D8'; ctx.font = mono(16);
        ctx.fillText(mmss((rr.d || 0) * 1000), W - 100, ry);
        ctx.textAlign = 'left';
      }
      if (!log.length){
        ctx.fillStyle = C.gray; ctx.font = cn(26);
        ctx.fillText('尚無通話記錄', 100, 320);
      }
    }
    drawCorners(W, H);
  }
  function pad2(n){ return (n < 10 ? '0' : '') + n; }
  function hexRgb(h){
    h = h.replace('#', '');
    if (h.length === 3){ h = h.charAt(0) + h.charAt(0) + h.charAt(1) + h.charAt(1) + h.charAt(2) + h.charAt(2); }
    return parseInt(h.substring(0, 2), 16) + ',' + parseInt(h.substring(2, 4), 16) + ',' + parseInt(h.substring(4, 6), 16);
  }
  loadLog();
  return {
    activate: function(){
      cv.width = W; cv.height = H;
      if (!bound){ bound = true; bindOnce(); }
      setNumLine();
      setView('pad');
    },
    tick: function(now){
      if (state === 'dialing' && (now - dialAt) > 2600){
        state = 'talking'; talkAt = new Date().getTime();
        ringStop(); SFX.grant();
        lineAt = now;
        setNumLine();
      }
      /* 台詞推进：每 2.6 秒一句，最后一句停住 */
      if (state === 'talking' && active && lineIdx < active.lines.length - 1){
        if (now - lineAt > 2600){
          lineIdx++;
          lineAt = now;
          SFX.beep();
        }
      }
      render(now);
    }
  };
})();

registerApp({
  id: 'phone',
  glyph: '電',
  no: 'APP-12',
  label: '撥號',
  color: '#33FF66',
  dock: true,
  panel: PH_PANEL
}, phoneApp);
