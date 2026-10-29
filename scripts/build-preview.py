# Bundle the portal into one self-contained HTML (modules inlined, assets as data URIs) for a preview link.
import re, base64, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
html = (root/'index.html').read_text(encoding='utf-8')
def strip(src):
    src = re.sub(r"^import[\s\S]*?from\s+'[^']+';\s*$", '', src, flags=re.M)
    return re.sub(r'^export\s+(const|function|async function|let)\s', r'\1 ', src, flags=re.M)
js = '\n'.join(strip((root/f).read_text(encoding='utf-8')) for f in ['config.js', 'core.js', 'app.js'])
# core's t() becomes tr() — the name app.js already imports it under
core = strip((root/'core.js').read_text(encoding='utf-8'))
core = core.replace('function t(lang, key', 'function tr(lang, key').replace("t(lang, 'hours'", "tr(lang, 'hours'").replace("t(lang, 'days'", "tr(lang, 'days'")
js = '\n'.join([strip((root/'config.js').read_text(encoding='utf-8')), core, strip((root/'app.js').read_text(encoding='utf-8'))])
def uri(path, mime): return f"data:{mime};base64," + base64.b64encode((root/path).read_bytes()).decode()
for f, m in [('assets/afaqy-logo-reverse.png', 'image/png'), ('assets/favicon.png', 'image/png'), ('assets/apple-touch-icon.png', 'image/png'),
             ('assets/fonts/NotoSansArabic-Regular.ttf', 'font/ttf'), ('assets/fonts/NotoSansArabic-Bold.ttf', 'font/ttf')]:
    html = html.replace(f, uri(f, m))
# the preview has no version.json beside it, so it carries this version's notes inside
import json
release = json.loads((root/'version.json').read_text(encoding='utf-8'))
assert js.count('let release = null;') == 1
js = js.replace('let release = null;', 'let release = ' + json.dumps(release, ensure_ascii=False) + ';')
html = html.replace('<script type="module" src="app.js"></script>', '<script type="module">\n' + js + '\n</script>')
(root/'dist').mkdir(exist_ok=True)
(root/'dist/portal-preview.html').write_text(html, encoding='utf-8')
print('bundle', round(len(html)/1024), 'KB')
