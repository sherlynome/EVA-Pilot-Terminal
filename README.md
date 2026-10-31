# EVA 驾驶员终端

一个跑在浏览器里的 EVA（新世纪福音战士）同人模拟终端。单文件、零依赖、可安装为 PWA，断网也能用。

点开像一台属于适格者的手机：开机要过门禁认证，桌面有时钟/天气/记事挂件，十六个 APP 各自是一套小系统。

> 同人作品，非商业用途。EVA / 新世纪福音战士相关设定与形象版权归 khara 所有。

---

## 直接玩

**方式一：在线**（GitHub Pages 开启后）

```
https://<你的用户名>.github.io/EVA-Pilot-Terminal/
```

**方式二：本地**

```bash
python -m http.server 8099
# 浏览器打开 http://127.0.0.1:8099/
```

不要直接双击 `index.html` —— `file://` 协议下 Service Worker 无法注册，装不了离线。

**方式三：装到手机桌面**

用手机浏览器打开上面的链接 → 菜单 → 「添加到主屏幕」。之后从桌面图标启动，全屏无地址栏，断网也能开。

> 更新后旧缓存不会自动切换：从后台完全划掉应用再重新打开。还不行就长按图标 → 应用信息 → 清除缓存。

---

## 十六个 APP

| # | APP | 内容 |
|---|-----|------|
| 01 | 警報 | 使徒来袭警报，红色扫描线 + 倒计时 |
| 02 | MAGI | 三贤者六边形表决，CASPER / BALTHASAR / MELCHIOR |
| 03 | 標題 | 标题字卡生成器，双行排版可调字号 |
| 04 | 免許 | 驾驶员执照，NERV 钢印 + 签名 |
| 05 | ATフィールド | AT 力场可视化，可调节强度与相位 |
| 06 | 緊急 | 紧急事态面板，多级红色告警 |
| 07 | 小売部 | ペンペン店長的小卖部，365 件商品、分类翻页、购物车、小票 |
| 08 | 地図 | 第三新東京市地图，目标点标记 |
| 09 | 機密 | 机密记事本，11 个分页的资料库，可搜索 |
| 10 | 音楽室 | 22 首内置曲目 + 本地 MIDI 文件解析播放 |
| 11 | 寫眞沖印 | 拍立得冲印，6 种规格 × 30 种边框 × 20 种滤镜，吸顶预览实时看效果 |
| 12 | 撥號 | 拨号键盘 + 电话簿 + 通话记录，14 位角色专属台词（日中双语字幕） |
| 13 | 短信 | 8 组会话，角色口吻的双语往来 |
| 14 | 相冊 | 12 张程序生成的图片，可查看可保存 |
| 15 | 設定 | 四套皮肤（NERV / 初号机 / 二号机 / 三号机），数据清理 |
| 16 | 起動実験 | 同步率测试：注水 → 接续 → 出击倒计时 → 同步保持 → 暴走，验收整备页与结局判定 |

桌面底部 Dock 常驻：撥號 / 短信 / 相冊 / 設定。

---

## 技术要点

全部塞在一个 HTML 里，没有框架、没有构建依赖运行时。

- **渲染**：原生 Canvas 2D + DOM。主画布负责动态场景，DOM 负责面板与文字。
- **音效**：WebAudio 实时合成，无音频文件。全局点按音效走事件委托，45ms 去重。
- **换肤**：CSS 变量（`--ac` / `--bg` / `--dt1..4`），改一处全站变色，桌面背景跟着换。
- **扩展 APP**：`registerApp({id, glyph, no, label, color, panel, v2, dock}, {activate, tick})`。`v2: true` 用面板自带 canvas，避免和主画布抢 ctx。
- **PWA**：Service Worker 全量预缓存，`CACHE` 版本号每次构建自增，靠它推动客户端换新。
- **保存兜底**：`navigator.share` → `<a download>` → 全屏长按层，三层逐级降级，安卓 standalone 下也能存图。

---

## 自己改

源码在 `src/`。`index.html` 是构建产物，不要直接改它 —— 下次重建会被覆盖。

```bash
cd src
python build_v23.py     # base/eva驾驶员终端_v2.2.html + must() 补丁 + ext_apps/*.js → build/
python make_pwa.py      # build/ → 仓库根 index.html（注入 manifest、SW 注册、本地化依赖）
```

`build_v23.py` 里所有对框架代码的改动都写成 `must(锚点, 替换内容)`，锚点必须唯一存在，否则构建直接报错。这样上游一变就能立刻发现补丁失效。

新增 APP 放进 `src/ext_apps/`，命名 `编号_标识.js`，构建时按文件名排序自动注入接入点。

给外部 AI 写 APP 用的接口规范在 [`docs/EVA驾驶员终端_APP开发规范与接入指南.md`](docs/EVA驾驶员终端_APP开发规范与接入指南.md)，包含 APP 契约、v2 模式注意事项、演出型 HUD 四件套、参数板分 tab、吸顶预览 + 横滑条这些踩过坑的地方。

### 目录

```
.
├── index.html                  # 构建产物（PWA 入口）
├── manifest.webmanifest
├── sw.js                       # Service Worker，CACHE 版本号由构建自增
├── icon-192.png / icon-512.png
├── vendor/                     # 本地化的第三方依赖（gif.js 及其 worker）
├── docs/                       # APP 开发规范
└── src/
    ├── build_v23.py            # 主构建脚本
    ├── make_pwa.py             # PWA 包装
    ├── base/                   # v2.2 基础源文件
    ├── ext_apps/               # 十个扩展 APP 的源码
    ├── nb_data.js              # 机密记事数据
    └── mart_items_365.txt      # 小卖部商品表
```

---

## 踩过的坑

留几条，省得下次重犯：

- `must()` 只校验锚点唯一，不校验 JS 语义。注入内容把注释写坏了会静默吞掉后面的函数，必须真跑一遍浏览器。
- `v2: true` 的 APP 不能用框架的 `rr()` / `drawCorners()`，它们写死全局主画布 ctx，画在面板 canvas 上什么都不显示，也不报错。
- DOM 绑定放在 `activate()` 里，用 `bound` 守卫。放 IIFE 顶层时元素还不存在，按钮会全死。
- `html, body { overflow-x: hidden }` 会让 body 变成滚动容器，`position: sticky` 直接失效。用 `overflow-x: clip`。
- 同步 `<link rel="stylesheet">` 加载外部字体会一直阻塞 `load`，Service Worker 就迟迟不注册。字体改成 `media="print" onload="this.media='all'"`，依赖能本地化就本地化。
- 安卓 standalone 模式会静默拦截 `a[download]`，保存必须做降级兜底。
