# -*- coding: utf-8 -*-
"""
把 src/build/eva驾驶员终端_v2.3.html 生成为可安装的 PWA（仓库根 index.html）

做的事：
  1) 注入 manifest / theme-color / 图标 / apple-touch-icon
  2) 注入 Service Worker 注册
  3) 把 sw.js 的 CACHE 版本号 +1（否则已安装的客户端永远拿旧缓存）

用法：
  cd src
  python build_v23.py     # 先构建成品
  python make_pwa.py      # 再生成仓库根的 PWA 文件
"""
import io, os, re

BASE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(BASE)                      # 仓库根目录
SRC = os.path.join(BASE, 'build', 'eva驾驶员终端_v2.3.html')
DST_DIR = ROOT
DST = os.path.join(DST_DIR, 'index.html')
SW = os.path.join(DST_DIR, 'sw.js')

# 留空 = 无门禁环境（GitHub Pages）。填 'XXXX' 则所有资源请求都带上 ?sharecode=XXXX
SHARECODE = ''


def q(url):
    return url + ('?sharecode=' + SHARECODE if SHARECODE else '')


HEAD = '''<meta name="theme-color" content="#D42027">
<link rel="manifest" href="%s">
<link rel="apple-touch-icon" href="%s">
<link rel="icon" type="image/png" sizes="192x192" href="%s">''' % (
    q('manifest.webmanifest'), q('icon-192.png'), q('icon-192.png'))

SWREG = '''<script>
var _scm = location.search.match(/sharecode=([A-Za-z0-9]+)/);
var SC = _scm ? _scm[1] : '';
function __regSW(){
  if (!('serviceWorker' in navigator) || location.protocol.indexOf('http') !== 0) { return; }
  navigator.serviceWorker.register('sw.js' + (SC ? '?sharecode=' + SC : ''))['catch'](function(e){
    try { console.warn('[SW] register failed: ' + (e && e.name) + ' ' + (e && e.message)); } catch (_) {}
  });
}
/* 立即注册，不等 load：任何外链阻塞都会让 load 迟迟不来 */
__regSW();
if (document.readyState !== 'complete') { window.addEventListener('load', __regSW); }
</script>
</body>'''


FONT_LINK_OLD = ('<link rel="stylesheet" href="https://fonts.loli.net/css2?'
                 'family=Shippori+Mincho:wght@800&family=Noto+Serif+SC:wght@900&display=swap">')
FONT_LINK_NEW = ('<link rel="stylesheet" href="https://fonts.loli.net/css2?'
                 'family=Shippori+Mincho:wght@800&family=Noto+Serif+SC:wght@900&display=swap" '
                 'media="print" onload="this.media=\'all\'">')


def harden(html):
    """Web 版加固：
       1) gif.js / gif.worker.js 本地化（原来走 jsdelivr CDN，断网或慢网会挂）
       2) 字体样式表异步化（同步 <link> 会阻塞 load，导致 SW 迟迟不注册）
    """
    assert html.count('https://cdn.jsdelivr.net/npm/gif.js@0.2.0/dist/gif.js') == 1, \
        'gif.js 脚本引用数量异常'
    assert html.count('https://cdn.jsdelivr.net/npm/gif.js@0.2.0/dist/gif.worker.js') == 1, \
        'gif.worker.js 引用数量异常'
    html = html.replace('https://cdn.jsdelivr.net/npm/gif.js@0.2.0/dist/gif.js', 'vendor/gif.js')
    html = html.replace('https://cdn.jsdelivr.net/npm/gif.js@0.2.0/dist/gif.worker.js',
                        'vendor/gif.worker.js')

    assert html.count(FONT_LINK_OLD) == 1, '字体 link 锚点数量异常'
    html = html.replace(FONT_LINK_OLD, FONT_LINK_NEW)
    return html


def main():
    html = io.open(SRC, encoding='utf-8').read()

    vp = '<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">'
    n = html.count(vp)
    assert n == 1, 'viewport 锚点数量异常: %d' % n
    assert 'manifest.webmanifest' not in html, '源文件已含 PWA 标签，勿重复注入'

    html = html.replace(vp, vp + '\n' + HEAD)

    html = harden(html)

    assert html.count('</body>') == 1, 'body 闭合标签数量异常'
    html = html.replace('</body>', SWREG)

    io.open(DST, 'w', encoding='utf-8').write(html)

    # SW 缓存版本自增
    sw = io.open(SW, encoding='utf-8').read()
    m = re.search(r"var CACHE = 'eva-terminal-v(\d+)';", sw)
    assert m, 'sw.js 里找不到 CACHE 版本号'
    old = int(m.group(1))
    new = old + 1
    sw = sw.replace("var CACHE = 'eva-terminal-v%d';" % old,
                    "var CACHE = 'eva-terminal-v%d';" % new)
    io.open(SW, 'w', encoding='utf-8').write(sw)

    print('index.html 已生成 (%.1f KB)' % (len(html) / 1024.0))
    print('SW 缓存版本 v%d -> v%d' % (old, new))
    print('输出目录: %s' % DST_DIR)


if __name__ == '__main__':
    main()
