# EVA 驾驶员终端 — APP 开发规范与接入指南

> 目标读者：**另一个 AI**。
> 你读完这份文档后，应能产出一个**可直接嵌入**的新 APP 代码块。
> 嵌入工作由本项目维护者（原 Agent）完成，你**不需要**改动原 HTML 文件。
> 请严格遵守本文的「接口契约」「视觉规范」「交付格式」，否则产出可能无法嵌入或风格不一致。

---

## 0. 项目是什么

一个**单文件自包含 HTML**（无外部依赖、无网络请求）的 EVA 同人「驾驶员终端」Web App，运行在手机/桌面浏览器。
开机动画 → 桌面（9~N 个 APP 图标）→ 点图标进入 APP（上方画布 + 下方参数板）。

- 画布是 **Canvas 2D 手绘**（不是图片素材），所有 UI 都用代码画。
- 音效是 **Web Audio 程序合成**（无音频文件）。
- 全部状态在内存 / localStorage，**无后端**。
- 目标设备：**安卓手机竖屏优先**（已做 ≤600px / ≤380px 响应式），桌面也能用。

---

## 1. APP 接口契约（最重要，必须遵守）

每个 APP 就是一个 JS 对象，通过一次 `registerApp(...)` 调用注册。

```js
registerApp(meta, appObj);
```

运行时：`openApp(id)` → 显示 `#panel-<id>` 参数板 → 调用 `appObj.activate()` →
之后每帧调用 `appObj.tick(Date.now())`（仅在 APP 可见、且 `busy=false`、页面非隐藏时）。

### 1.1 meta（APP 元信息）

```js
{
  id:    'mart',        // 必填，英文小写；用于 data-app / #panel-<id>；不可与现有 APP 重名
  glyph: '売',          // 桌面图标用的 1 个汉字（或 1~2 字符）
  no:    'APP-07',      // 编号标签
  label: '小卖部',       // 中文短名
  color: '#F5C400',     // 主题色（图标描边/主色），优先用调色板
  panel: '<div>...</div>', // 参数板 HTML 字符串；若参数板已写死在 HTML 里则传 null 或省略
  v2:    false          // 可选。true = 该 APP 隐藏主画布、使用自己面板内的 canvas（如地图/记事本）
}
```

**现有已占用的 id（不可重复）**：`alert` `magi` `title` `license` `atfield` `emergency` `mart` `map` `notebook` `music` `polaroid`。

### 1.2 appObj（APP 运行时）

```js
{
  activate: function(){ /* 进入 APP 时调用一次 */ },
  tick:     function(now){ /* 每帧调用，now = Date.now() 纪元毫秒 */ }
  // 可选：你自己需要的其它方法
}
```

**强制约定：**

1. **每个 APP 自己声明画布尺寸**：`activate()` 里必须 `cv.width = W; cv.height = H;`（逻辑分辨率，通常 1080 系）。
   `W / H` 在 APP 内部自己定义（如 `var W = 1080, H = 1080;`），**不是全局变量**。
2. `tick(now)` 必须能**重复安全执行**（每帧全量重绘，不要假设增量）。
3. `tick` 里**不要**做重活（不要联网、不要每帧创建大对象、不要每帧 `new Path2D`）。
4. 参数板的按钮/输入监听：**在 APP 内部绑定一次**（IIFE 里绑定即可，不要放进 `activate` 重复绑）。
5. 保存 PNG 等异步操作期间，置 `busy = true` 并在完成后置回 `false`（`busy` 为真时 `tick` 会被暂停）。
6. **不要**改写、覆盖、删除其它 APP 或框架的代码；只注册自己的东西。

### 1.3 最小可用模板（照抄这个结构）

```js
var myApp = (function(){
  var W = 1080, H = 1080;
  // 参数板按钮绑定一次
  var btn = document.getElementById('myGo');
  if (btn){
    btn.addEventListener('click', function(){
      SFX.click();
      toast('已生成');
    });
  }
  function render(now){
    ctx.fillStyle = C.black; ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = C.white;  ctx.font = cn(64, '900');
    ctx.fillText('我的 APP', W / 2, H / 2);
    drawCorners(W, H);
  }
  return {
    activate: function(){ cv.width = W; cv.height = H; },
    tick:     function(now){ render(now); }
  };
})();

registerApp({
  id: 'myapp', glyph: '新', no: 'APP-10', label: '我的APP', color: '#C77DFF',
  panel: '<label class="fl">▸ 参数</label>'
       + '<div class="irow"><input class="txt" id="myTxt" value="默认"></div>'
       + '<div class="btnrow"><button class="mainbtn" id="myGo">生成</button></div>'
}, myApp);
```

---

## 2. 可用 API（框架已提供，直接用，不要自己造）

| 名称 | 类型/签名 | 说明 |
|---|---|---|
| `cv` / `ctx` | canvas / 2d context | **主画布**。APP 之间共用，进入时自己设宽高 |
| `C` | 调色板对象 | `C.red` `C.darkred` `C.orange` `C.yellow` `C.black` `C.white` `C.green` `C.gray` |
| `busy` | boolean | 全局忙标志，置 true 会暂停 tick |
| `cn(size, w)` | 中文字体 | 返回 font 字符串；`w` 默认 `'900'`（明朝/宋体系） |
| `mono(size, w)` | 等宽字体 | `'Courier New'`，`w` 默认 `'400'` |
| `ser(size, w)` / `sans(size, w)` | 字体 | Times 系 / Arial Black 系 |
| `rr(x,y,w,h,r)` | 路径 | 圆角矩形路径（**只建路径**，需自行 `fill()`/`stroke()`） |
| `drawSpaced(text,x,y,ls,align)` | 绘制 | 带字距的标题字（EVA 味），`align:'center'/'left'/'right'` |
| `measureSpaced(text, ls)` | 测量 | 配合上面 |
| `fitLines(text,maxW,start,min,preferTwo)` | 排版 | 自动缩字号/折行 → `{lines:[...], size:Number}` |
| `drawCorners(W,H)` | 绘制 | 四角 HUD 直角标记 |
| `drawEmblem(ctx,cx,cy,w,color)` | 绘制 | NERV 半枫叶徽章（矢量化） |
| `val(id)` | 取输入值 | 按 id 取 input 值并 trim |
| `rand(min,max)` / `pick(arr)` / `pad(n)` | 工具 | 随机 / 随机取 / 补零 |
| `toast(msg)` | UI | 底部吐司提示 |
| `downloadBlob(blob,name)` / `fileName(prefix,ext)` | 导出 | 下载；文件名自动带时间戳 |
| `SFX` | 音效 | 见下表 |

### 2.1 音效 `SFX`（Web Audio 合成，无音频文件）

> **点按音效已全局托管**：框架用事件委托监听 `click`，任何 `<button>` / `.chip` / `.aicon` / `.foldbar` / `.item` 被点击都会自动 `SFX.click()`，并且 45ms 内去重（你顺手也调一次也只会响一声）。所以**普通按钮不用再自己绑 click 音**；只有语义不同的反馈（成功 `grant` / 失败 `deny` / 盖章 `stamp` / 打印 `print`）才需要你自己调。

| 方法 | 用途 |
|---|---|
| `SFX.click()` | 点击/确认 |
| `SFX.beep()` | 终端哔声 |
| `SFX.scan()` | 扫描上行音 |
| `SFX.grant()` | 成功/通过（上行双音） |
| `SFX.deny()` | 拒绝/否决（下行噪音） |
| `SFX.stamp(true/false)` | 盖章闷响（true=通过） |
| `SFX.print()` | 打印齿条声 |
| `SFX.sirenStart()` / `SFX.sirenStop()` | 警报双音循环（**离开 APP 务必 Stop**） |
| `SFX.toggle()` / `SFX.isMuted()` | 静音开关 |

> 音效必须由**用户手势**触发才响（浏览器策略）。开机首次交互后即解锁。

### 2.2 也可通过全局命名空间访问

```js
window.EVA.APPS          // 所有已注册 APP 的映射
window.EVA.C             // 调色板
window.EVA.SFX           // 音效
window.EVA.cv / window.EVA.ctx
window.EVA.helpers       // { rr, cn, mono, ser, sans, drawSpaced, measureSpaced, fitLines, toast, downloadBlob, fileName, val, rand, pick, pad, drawCorners, drawEmblem }
window.EVA.registerApp(meta, appObj)
```

---

## 3. 视觉规范（必须遵守，否则风格会跑偏）

### 3.1 调色板（只用这些，或明确给出新色）

| Token | 色值 | 用途 |
|---|---|---|
| `C.red` | `#D42027` | 主红：NERV、警告、边框强调 |
| `C.darkred` | `#8B0009` | 深红：底纹、次要 |
| `C.orange` | `#FF6A2B` | 橙：AT 力场、警告 |
| `C.yellow` | `#F5C400` | 黄：金额、高亮、抽奖 |
| `C.green` | `#33FF66` | 绿：通过、正常、终端文字 |
| `C.black` | `#0F0F0F` | 背景底 |
| `C.white` | `#FFFFFF` | 主文字 |
| `C.gray` | `#6E6E6E` | 次级说明文字 |

补充常用色：`#050505`（面板内底）、`#160608`（深红底）、`rgba(255,255,255,.1~.3)`（分隔线）。

### 3.2 字体约定

- **日文/中文标题**：`cn(size)` — 明朝/宋体系（默认 900 字重）
- **编号/英文/数值**：`mono(size, '700')` — Courier New，字距拉开（`drawSpaced(..., ls)`）
- **装饰性英文**：`sans(size)` — Arial Black
- **正文字号参考**（1080 逻辑画布下）：大标题 56~72px、区块标题 24~30px、正文 18~22px、注释 13~16px

### 3.3 画布构图规范

- 逻辑分辨率 **1080 基准**（1080×1080 方 / 1080×1350 竖 / 1080×1920 长图按内容选），CSS 自动缩放。
- 四周留 **安全边距 40~64px**；HUD 元素用 `drawCorners()`。
- 顶部通常有一行 mono 小字（部门/编号/日期），左下/右下放状态字。
- 卡片/格子：圆角 6~10px，描边 2~3px，配色用调色板。
- **不要**用外部图片/字体文件（必须自包含）。

### 3.4 参数板（DOM，在画布下方）

可用 class（直接写 HTML，样式已内置）：

| class | 用途 |
|---|---|
| `.fl` | 分区标题（`<label class="fl">▸ 标题</label>`） |
| `.irow` | 一行控件容器（flex） |
| `input.txt` / `input.loc` | 文本输入 |
| `.btnrow` | 按钮行（flex） |
| `.mainbtn` | 主按钮；加 `ghostbtn` 变次要 |
| `.chips` / `.chip` | 分类标签组（5 列网格，两层） |
| `.shelf` / `.item` | 卡片网格（3 列），`.item` 内含 `.em` 图标 / `.nm` 名 / `.pr` 价格 |
| `.cartbar` | 统计条 |
| `.avhint` | 灰色说明文字块 |
| `.foldbar` | **可折叠条**：把长内容收进 `#xxxBody`（默认隐藏，`.on` 展开） |

**长内容一律折叠**：参数板内容超过一屏时，用折叠条（收起态只留一行摘要），保持手机端短。

### 3.5 移动端（安卓竖屏）

- 已内置 `@media (max-width:600px)` 与 `(max-width:380px)` 响应式（字号/间距/画布全宽）。
- 新 APP 的 **DOM 不要再写死 px 宽高**（用 flex/grid + 百分比）。
- 画布内容按 1080 逻辑坐标画即可，缩放由 CSS 负责。
- 交互目标（按钮）高度 ≥ 46px。

---

## 4. 常见模式（可复用）

### 4.1 保存画布为 PNG（标准写法）

```js
btn.addEventListener('click', function(){
  if (busy){ return; }
  busy = true; btn.disabled = true; btn.textContent = '生成中…';
  render(Date.now());                 // 先画一次确保内容最新
  setTimeout(function(){
    cv.toBlob(function(blob){
      if (blob){ downloadBlob(blob, fileName('我的图', 'png')); toast('已保存 PNG'); }
      else { toast('生成失败，请重试'); }
      busy = false; btn.disabled = false; btn.textContent = '保存 PNG';
    }, 'image/png');
  }, 60);
});
```

### 4.2 需要自己 canvas 的 APP（`meta.v2 = true`）

如地图/记事本：把 `<canvas>` 放在 `meta.panel` 里，自己取 context 绘制，不要用全局 `cv`。

### 4.3 打字机 / 分行（小卖部内有现成实现）

`wrapCJK(text, per)` 按字数折行、`typeOut(text, dt, msPerChar)` 打字机效果——目前定义在小卖部模块内，需要时可复制一份到自己的 APP。

### 4.4 随机但可复现

需要「每天不同但当天一致」的随机：用日期做 seed 的 LCG（如 `YYYYMMDD`），不要纯 `Math.random()`。

---

### 4.6 参数很多时：吸顶预览 + 单行横滑条

选项一多（边框 30 个、滤镜 20 个），用 `.chips` 五列网格会把页面撑得很长，用户滑到下面时**已经看不到画布**，等于盲调。APP-11 寫眞沖印 的解法可以直接照抄：

```html
<!-- 1) 预览台吸顶：滚动时钉在顶部，改任何参数都能立刻看到 -->
<div id="myStage"><canvas id="myCv"></canvas></div>

<!-- 2) 参数用单行横滑条，不再纵向堆叠 -->
<label class="fl">▸ 邊框 ×30 ▸ 左右滑動</label>
<div class="myStrip" id="myFrames"></div>
```

```css
#myStage{position:sticky;top:0;z-index:30;background:#080808;padding:6px 0 8px;
         border-bottom:1px solid #2A2A2A;box-shadow:0 10px 22px rgba(0,0,0,.78)}
#myCv{display:block;margin:0 auto;width:auto;height:auto;max-width:100%;max-height:38vh}
.myStrip{display:flex;flex-wrap:nowrap;gap:8px;overflow-x:auto;padding:4px 2px 10px}
.myStrip .chip{flex:0 0 auto;white-space:nowrap}
```

三个细节：

- 画布给 `max-height:38vh`（40% 左右），剩下 60% 留给控件，预览与参数同屏
- 换选项后把选中项滚到横条中间，否则用户找不到自己选了什么：`box.scrollLeft = act.offsetLeft - box.clientWidth/2 + act.offsetWidth/2`
- **`position:sticky` 对祖先的 `overflow` 很敏感**。框架已把 `html,body` 的 `overflow-x` 从 `hidden` 改成 `clip`（`clip` 不创建滚动容器，sticky 才生效）。你自己的容器也不要去设 `overflow:hidden`，否则吸顶会静默失效。

**选项标签的样式（横滑条专用）**：框架默认 `.chip` 是 34px 高、左右 padding 只有 2px 的圆药丸，塞进横滑条会显得又挤又糊。APP-11 的做法是给每个标签加**两位编号 + 方角 + 选中发光**，观感直接上一个档次：

```js
/* 生成：<button class="chip active"><i class="pldNo">04</i><span>POLAROID</span></button> */
```

```css
#panel-x .myStrip .chip{height:40px;padding:0 12px;gap:8px;border-radius:5px;
  background:#0B0708;border:1px solid #3B3B3B;color:#C4BCB2;
  font-family:"Courier New",monospace;font-size:12px;font-weight:700}
#panel-x .myStrip .chip .pldNo{font-style:normal;font-size:9px;color:#5E5E5E}
#panel-x .myStrip .chip.active{border-color:#D42027;color:#fff;
  background:linear-gradient(180deg,rgba(212,32,39,.26),rgba(212,32,39,.06));
  box-shadow:0 0 14px rgba(212,32,39,.3),inset 0 0 0 1px rgba(212,32,39,.4)}
#panel-x .myStrip .chip.active .pldNo{color:#FF6A6A}
```

小节标题也别用默认灰字：加一条 4×11px 的红竖条 + 拉开字距，整套面板的气质就统一了。

---

### 4.4 演出型 APP：多层 HUD 的四种标配元素

做「场景演出」（驾驶舱、指挥室、警报）时，只有大数字是撑不住气氛的。APP-16 起動実験 的四个层次可以直接抄：

| 元素 | 做法 | 关键参数 |
|---|---|---|
| **蜂巢** | 六边形点阵铺满画布 | R=46，横向步长 `R×1.732`、纵向 `R×1.5`，奇偶行错开半格；**离屏画一次缓存成 canvas**，每帧只 `drawImage` + 改 `globalAlpha`，否则 150 个多边形每帧 stroke 会掉帧 |
| **绿色条纹** | 20+ 条横向条带，相位各自错开、向上流动 | 必须 `ctx.globalCompositeOperation = 'lighter'` —— 普通 `source-over` 在深红底上叠绿会变成脏黄色，`lighter` 才有荧光感 |
| **浮动窗口** | 4 个小方框挂四角，标题 13px / 数值 19px，角上画 L 形折角 | 暴走时数值换乱码 `ERR / 0x00 / ???`、色转 `#FF5040`、每帧随机 ±6px 抖动 |
| **倒计时环** | 外圈 60 格刻度 + 进度弧 + 中央大数字 + 底部轨道条 | 进度弧从 `-PI/2` 起画；数字每跳一格做 1.10 → 1.00 的缩放回落 |

两个坑：

- **满屏红色会把所有内容压死**。用**径向渐变**做边缘渐晕（中心 `rgba(...,0)` → 边缘 `rgba(...,0.6)`），中央留出来给文字和图形，压迫感反而更强
- 叠加层多的场景，通讯/字幕框底色要不透明度提到 `.95`，否则条纹穿过时字读不出来

---

### 4.45 参数板太长 → 分视图（tab）切换，别让它一直往下堆

电话 APP 一开始把「键盘 + 电话簿 + 记录」全竖着排，电话簿一多就再也看不到键盘了。**判断标准：参数板滚动高度超过 1.5 屏，就该拆 tab。** 做法：

```html
<div class="myTabs">
  <button class="myTab active" data-v="pad">鍵　盤</button>
  <button class="myTab" data-v="book">電話帳</button>
  <button class="myTab" data-v="log">記　錄</button>
</div>
<div class="myView on" id="myViewPad">…</div>
<div class="myView" id="myViewBook">…</div>
```

```css
.myTabs{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}
.myTab{height:42px;border-radius:5px;background:#0B0708;border:1px solid #3B3B3B;color:#A9A29A;
  font-family:"Courier New",monospace;font-size:12px;font-weight:700;letter-spacing:.12em}
.myTab.active{background:linear-gradient(180deg,rgba(var(--ac-rgb),.26),rgba(var(--ac-rgb),.06));
  border-color:var(--ac);color:#fff;box-shadow:0 0 12px rgba(var(--ac-rgb),.28)}
.myView{display:none} .myView.on{display:block}
```

三个要点：

- **列表要限高**：`#myBook{max-height:48vh;overflow-y:auto;overscroll-behavior:contain}`，否则 tab 切了也没用
- **主画布跟着 tab 变**：切到电话簿就画「N 名登録 + 分组名单」，切到记录就画完整 CALL LOG。不跟着变的话，用户会觉得切了没反应
- **动作要能跨视图**：点电话簿里的联系人 → 自动切回键盘视图再拨号（`setView('pad'); dial();`），否则用户看不到拨号过程

> **坑**：全局有 `.chips{display:grid !important}`（参数板统一五列网格）。想让某个容器变横滑条，`#myTabs{display:flex}` **压不住 `!important`**，必须写 `#myTabs{display:flex !important}`。同理记得 `flex:0 0 auto` + `white-space:nowrap`，否则 chip 会被压扁换行。

---

### 4.5 保存文件（务必走框架，不要自己写 a[download]）

安卓把页面「安装成 PWA」后，浏览器是 **standalone 窗口**，此时 `<a download>` + blob 会被静默拦截——不报错、不提示、也没有文件。框架里的 `downloadBlob(blob, name)` 已经处理好了三层兜底：

1. `display-mode: standalone/fullscreen/minimal-ui` 且支持 Web Share Level 2 → 先弹系统分享面板（可直接「保存图片」到相册）
2. 触发 `<a download>`
3. standalone 下再叠一层 `showSavePreview(blob, name)`：把图铺成全屏预览，提示「长按图片保存」，另给「分享/存相册」「下載」两个按钮

所以 APP 里只需要：

```js
cv.toBlob(function(blob){
  if (blob){ downloadBlob(blob, fileName('我的APP', 'png')); }  // 不要自己建 a 标签
  busy = false;
}, 'image/png');
```

另外：`window.EVA.showSavePreview(blob, name)` 也可以单独调用，用来给用户一个「看得见、能长按保存」的结果页。

---

## 5. 交付格式（给维护者的产出，必须这样交）

**只输出下面这两部分，不要输出完整 HTML，不要改动其它代码：**

```js
/* ===== APP-XX <中文名> ===== */
/* 1) 你需要的私有辅助函数（如有） */
function myHelper(a){ return a * 2; }

/* 2) APP 对象 + 一次注册调用 */
var myApp = (function(){
  var W = 1080, H = 1080;
  /* ... 绑定、render ... */
  return {
    activate: function(){ cv.width = W; cv.height = H; },
    tick:     function(now){ /* render */ }
  };
})();

registerApp({
  id: 'myapp', glyph: '新', no: 'APP-10', label: '我的APP', color: '#C77DFF',
  panel: '<label class="fl">▸ 参数</label>'
       + '<div class="irow"><input class="txt" id="myTxt" value="默认"></div>'
       + '<div class="btnrow"><button class="mainbtn" id="myGo">生成</button></div>'
}, myApp);
```

维护者会把这段代码**存成一个独立文件** `ext_apps/<编号>_<id>.js`（例如 `ext_apps/11_clock.js`），重新构建即可生效——**图标和参数板会自动注册，无需再改 HTML**。

> 构建时会按文件名排序，把 `ext_apps/` 下所有 `.js` 自动注入主脚本。所以一次交付 = 一个文件，互不干扰。

### 5.1 自查清单（交付前确认）

- [ ] `id` 不与现有 11 个冲突，全小写英文
- [ ] 只调用 `registerApp` 一次；没有直接操作其它 APP 的 DOM
- [ ] `activate()` 里设置了 `cv.width/height`（或使用自己的 canvas + `v2:true`）
- [ ] `tick` 是可重复全量重绘，不依赖上一帧残留状态
- [ ] 颜色只用调色板（新增色需在注释里写明用途）
- [ ] 无外部资源（图片/字体/音频/CDN）
- [ ] 参数板不写死宽度，长内容已折叠
- [ ] 所有 DOM id 带 APP 前缀（如 `myTxt`），避免与其它 APP 撞 id
- [ ] 演出型 APP 的叠加层用了 `lighter` 混合 / 离屏缓存 / 边缘渐晕（见 §4.4）\n- [ ] 保存走 `downloadBlob(blob, fileName(...))`，没有自己 `createElement('a')`
- [ ] 音效只在用户手势后触发；用了 `sirenStart` 的记得 `sirenStop`
- [ ] 代码是 **ES5 风格**为主（`var`、普通 function），不要用 ES6+ 语法（模块、`let/const`、箭头、class）——保证兼容性

**两个最容易翻车的点（APP-10 实际踩过）：**

1. **作用域**：`panel` 的 HTML 字符串必须定义在 **IIFE 外面**，否则 `registerApp({panel: XXX})` 取不到（`XXX` 在闭包里）。
2. **绑定时机**：参数板 DOM 是 `registerApp` 执行时才创建的，所以 **不要在 IIFE 里立即 `getElementById(...).addEventListener`**（全是 `null`）。把绑定放进 `activate()`，用 `var bound=false` 守卫只执行一次：

```js
activate: function(){
  cv.width = W; cv.height = H;
  if (!bound){ bound = true; bindOnce(); }   // 首次进入才绑定
  renderList();
}
```

3. **`v2: true` 的 APP 不能直接用框架的 `rr()` / `drawCorners()`**：这两个函数内部写死用的是**全局主画布 ctx**，而 v2 模式下主画布是隐藏的，画上去等于什么都没发生——圆角相框底板会整块消失、四角装饰不显示，而且**不报错**，最难查。自己写一份走本地 `ctx` 的版本：

```js
function roundRect(x,y,w,h,r){          // 替代框架 rr()
  ctx.beginPath();
  ctx.moveTo(x+r,y);
  ctx.arcTo(x+w,y,x+w,y+h,r);
  ctx.arcTo(x+w,y+h,x,y+h,r);
  ctx.arcTo(x,y+h,x,y,r);
  ctx.arcTo(x,y,x+w,y,r);
  ctx.closePath();
}
/* 四角装饰同理：按 m=24 / L=64 / t=8 自己 fillRect 一遍 */
```

4. **chip 的选中态 class 是 `active` 不是 `on`**（只有 `.chip.active` 才有红色高亮）。参数板 chips 是 5 列网格，只剩一个时会自动居中（框架内置，见维护流程第 5 条）。

---

## 6. 维护者侧的嵌入流程（供原 Agent 参考，非交付内容）

1. 把收到的代码块**存成文件** `ext_apps/<编号>_<id>.js`（不要改 `build_v23.py`——它已自动收集该目录所有 `.js`，按文件名排序注入）。
2. 运行 `python build_v23.py` → 产出 `deliverables/eva驾驶员终端_v2.x.html`；构建日志会打印 `[ext] 载入 xxx.js`。
3. `must()` 锚点会强制唯一命中，冲突直接报错（不会静默失败）。但 `must()` **只校验锚点唯一，不校验 JS 语义**——注入后必须实测。
4. CDP 实测：开机 → 逐个打开 APP → 检查 `#panel-<id>` 是否为 `on`、`window.EVA.APPS` 数量、控制台 `Runtime.exceptionThrown` 为空。
5. 新增 APP 后桌面可能是 3n+1 个图标：CSS 已内置规则让「最后一行只剩一个」居中（`:last-child:nth-child(3n+1)` 放第 2 列）。
6. 手机视口（420×900）复截一次图确认排版；注意参数板里的 `⏮⏸⏭⏵` 这类字符会被系统 emoji 字体接管，改用 `◀◀ ▶▶ ❚❚ ▶ ■` 纯符号。
7. 发版：`python make_pwa.py`（重新生成 `pwa/index.html` 并把 `sw.js` 缓存版本 +1）→ 再发布 `pwa/` 目录。
