// ADR-0156 — the tender register as Safwoot published it, read-only, for anyone with the link.
// The key is in the link after # and stays in this page; the sealed file is read from this site's own address only.
// Every text from the register is shown as text (textContent), never as markup.
import { parseViewLink, viewFileUrl, openView, viewGroups, tenderNext, VIEW_DATES } from './tenders-view-core.js';

const STR = {
  ar: {
    title: 'سجل المناقصات', refresh: 'تحديث', loading: 'جارٍ فتح السجل…', published: 'آخر نشر من صفووت: {t}', search: 'ابحث بالاسم أو الرقم المرجعي أو الجهة',
    running: 'جارية', submitted: 'قُدِّم عرضها', archive: 'الأرشيف', soon: 'لها موعد خلال ٧ أيام',
    empty: 'لا توجد مناقصات في هذه القائمة.', noMatch: 'لا توجد نتيجة لهذا البحث.',
    'no-key': 'هذا الرابط لا يحمل مفتاح الفتح. افتح الرابط كاملًا كما أُرسل إليك، دون حذف شيء من آخره.',
    'bad-key': 'مفتاح هذا الرابط ناقص أو تالف. افتح الرابط كاملًا كما أُرسل إليك.',
    'bad-repo': 'مكان النشر في هذا الرابط غير صالح. اطلب الرابط من جديد ممن أرسله.',
    missing: 'لا توجد نسخة منشورة بعد في المكان الذي يشير إليه الرابط. حين ينشر صفووت أول نسخة تظهر هنا.',
    net: 'تعذّر الوصول إلى النسخة المنشورة. تحقّق من الاتصال بالإنترنت ثم اضغط «تحديث».',
    key: 'مفتاح هذا الرابط لا يفتح النسخة المنشورة الآن، وغالبًا تغيّر الرابط. اطلب الرابط الجديد ممن أرسله إليك.',
    version: 'النسخة المنشورة بإصدار أحدث من هذه الصفحة. أعد تحميل الصفحة.', 'not-ours': 'الملف المنشور ليس سجل مناقصات من صفووت.',
    broken: 'الملف المنشور تالف ولا يمكن قراءته. سيصلح مع النشر القادم من صفووت.', invalid: 'الملف المنشور لا يطابق صيغة السجل، فلم يُعرض منه شيء.',
    'too-big': 'الملف المنشور أكبر من الحد المسموح، فلم يُفتح.',
    ref: 'الرقم المرجعي', entity: 'الجهة', status: 'الحالة', next: 'الموعد القادم', noNext: 'لا موعد قادم', allPast: 'انتهت كل مواعيدها',
    inquiries: 'آخر موعد للاستفسارات', submit: 'آخر موعد للتقديم', opening: 'فتح العروض', examination: 'فحص العروض', award: 'التاريخ المتوقع للترسية',
    today: 'اليوم', tomorrow: 'غدًا', in2: 'بعد يومين', inFew: 'بعد {n} أيام', inMany: 'بعد {n} يومًا',
    go: 'القرار: الدخول', 'no-go': 'القرار: عدم الدخول', pending: 'القرار: لم يُحسم بعد',
    stage_new: 'وصلت للدراسة', stage_working: 'قيد الدراسة', stage_submitted: 'قُدِّم العرض', stage_declined: 'لن نتقدم', stage_awarded: 'تمت الترسية', stage_cancelled: 'أُلغيت', stage_other: 'أخرى',
    dates: 'المواعيد', decision: 'القرار وسببه', summary: 'الخلاصة', etimad: 'التحقق من منصة اعتماد', timeline: 'تسلسل الأحداث', files: 'الملفات', changes: 'سجل التغييرات',
    src_workbook: 'ملف قسم اعتماد', src_pull: 'سحب منصة اعتماد', src_page: 'صفحة المنافسة على اعتماد',
    etimadSame: 'تحقّقنا من {src} في {t}: المواعيد مطابقة لما في السجل.', etimadDiff: 'تحقّقنا من {src} في {t}: يختلف {n} من المواعيد عما في السجل.',
    diffLine: '{field}: في السجل {ours}، وفي اعتماد {etimad}', none: '—', manager: 'المدير',
    kind_mail: 'بريد', kind_note: 'ملاحظة', kind_decision: 'قرار', kind_study: 'دراسة', kind_register: 'السجل',
    change: '{field}: «{old}» ← «{new}»', from: 'المصدر: {s}', close: 'إغلاق', count: '{n} مناقصة',
    foot: 'صفحة للقراءة فقط: تُنشر من تطبيق صفووت، ولا يُعدَّل منها شيء. كل من معه هذا الرابط يرى ما فيه، فلا تنشره إلا لمن يحق له.',
  },
  en: {
    title: 'Tender register', refresh: 'Refresh', loading: 'Opening the register…', published: 'Last published from Safwoot: {t}', search: 'Search by name, reference number or entity',
    running: 'In progress', submitted: 'Offer submitted', archive: 'Archive', soon: 'Have a date within 7 days',
    empty: 'There are no tenders in this list.', noMatch: 'Nothing matches this search.',
    'no-key': 'This link carries no key to open the register. Open the whole link exactly as it was sent to you, without cutting anything from its end.',
    'bad-key': 'The key in this link is incomplete or damaged. Open the whole link exactly as it was sent to you.',
    'bad-repo': 'The publishing place named in this link is not valid. Ask the sender for the link again.',
    missing: 'Nothing has been published yet at the place this link points to. The register appears here once Safwoot publishes its first copy.',
    net: 'The published copy could not be reached. Check the internet connection, then press «Refresh».',
    key: 'This link\'s key does not open the copy published now; most likely the link was changed. Ask the person who sent it for the new link.',
    version: 'The published copy uses a newer version than this page. Reload the page.', 'not-ours': 'The published file is not a tender register from Safwoot.',
    broken: 'The published file is damaged and cannot be read. It will be fixed by Safwoot\'s next publish.', invalid: 'The published file does not match the register\'s format, so nothing from it is shown.',
    'too-big': 'The published file is larger than allowed, so it was not opened.',
    ref: 'Reference number', entity: 'Entity', status: 'Status', next: 'Next date', noNext: 'No upcoming date', allPast: 'All its dates have passed',
    inquiries: 'Inquiries deadline', submit: 'Submission deadline', opening: 'Offers opening', examination: 'Offers examination', award: 'Expected award date',
    today: 'today', tomorrow: 'tomorrow', in2: 'in 2 days', inFew: 'in {n} days', inMany: 'in {n} days',
    go: 'Decision: bid', 'no-go': 'Decision: do not bid', pending: 'Decision: not made yet',
    stage_new: 'Received for study', stage_working: 'Under study', stage_submitted: 'Offer submitted', stage_declined: 'Not bidding', stage_awarded: 'Awarded', stage_cancelled: 'Cancelled', stage_other: 'Other',
    dates: 'Dates', decision: 'Decision and its reason', summary: 'Summary', etimad: 'Checked against the Etimad platform', timeline: 'Sequence of events', files: 'Files', changes: 'Change log',
    src_workbook: 'the Etimad section\'s file', src_pull: 'a pull from the Etimad platform', src_page: 'the tender\'s page on Etimad',
    etimadSame: 'Checked against {src} on {t}: the dates match the register.', etimadDiff: 'Checked against {src} on {t}: {n} of the dates differ from the register.',
    diffLine: '{field}: the register says {ours}, Etimad says {etimad}', none: '—', manager: 'manager',
    kind_mail: 'Email', kind_note: 'Note', kind_decision: 'Decision', kind_study: 'Study', kind_register: 'Register',
    change: '{field}: «{old}» → «{new}»', from: 'Source: {s}', close: 'Close', count: '{n} tenders',
    foot: 'A read-only page: it is published from the Safwoot app, and nothing can be changed from here. Anyone who has this link sees everything in it, so share it only with people who should.',
  },
  ur: {
    title: 'ٹینڈر رجسٹر', refresh: 'تازہ کریں', loading: 'رجسٹر کھولا جا رہا ہے…', published: 'صفووت سے آخری اشاعت: {t}', search: 'نام، حوالہ نمبر یا ادارے سے تلاش کریں',
    running: 'جاری', submitted: 'پیشکش جمع ہو چکی', archive: 'آرکائیو', soon: '7 دن کے اندر کوئی تاریخ ہے',
    empty: 'اس فہرست میں کوئی ٹینڈر نہیں ہے۔', noMatch: 'اس تلاش کا کوئی نتیجہ نہیں ملا۔',
    'no-key': 'اس لنک میں رجسٹر کھولنے کی کلید نہیں ہے۔ لنک کو بالکل ویسے ہی پورا کھولیں جیسے آپ کو بھیجا گیا تھا، اس کے آخر سے کچھ نہ کاٹیں۔',
    'bad-key': 'اس لنک کی کلید نامکمل یا خراب ہے۔ لنک کو بالکل ویسے ہی پورا کھولیں جیسے آپ کو بھیجا گیا تھا۔',
    'bad-repo': 'اس لنک میں اشاعت کی جگہ درست نہیں ہے۔ بھیجنے والے سے دوبارہ لنک مانگیں۔',
    missing: 'جس جگہ کی طرف یہ لنک اشارہ کرتا ہے وہاں ابھی تک کچھ شائع نہیں ہوا۔ جب صفووت پہلی کاپی شائع کرے گا تو رجسٹر یہاں نظر آئے گا۔',
    net: 'شائع شدہ کاپی تک رسائی نہیں ہو سکی۔ انٹرنیٹ کنکشن چیک کریں، پھر «تازہ کریں» دبائیں۔',
    key: 'اس لنک کی کلید اب شائع شدہ کاپی نہیں کھولتی؛ غالباً لنک بدل دیا گیا ہے۔ بھیجنے والے سے نیا لنک مانگیں۔',
    version: 'شائع شدہ کاپی اس صفحے سے نئے ورژن کی ہے۔ صفحہ دوبارہ لوڈ کریں۔', 'not-ours': 'شائع شدہ فائل صفووت کا ٹینڈر رجسٹر نہیں ہے۔',
    broken: 'شائع شدہ فائل خراب ہے اور پڑھی نہیں جا سکتی۔ صفووت کی اگلی اشاعت سے ٹھیک ہو جائے گی۔', invalid: 'شائع شدہ فائل رجسٹر کے فارمیٹ سے مطابقت نہیں رکھتی، اس لیے اس میں سے کچھ نہیں دکھایا گیا۔',
    'too-big': 'شائع شدہ فائل اجازت سے بڑی ہے، اس لیے نہیں کھولی گئی۔',
    ref: 'حوالہ نمبر', entity: 'ادارہ', status: 'حالت', next: 'اگلی تاریخ', noNext: 'کوئی آنے والی تاریخ نہیں', allPast: 'اس کی تمام تاریخیں گزر چکی ہیں',
    inquiries: 'سوالات کی آخری تاریخ', submit: 'جمع کرانے کی آخری تاریخ', opening: 'پیشکشیں کھلنے کی تاریخ', examination: 'پیشکشوں کی جانچ', award: 'ایوارڈ کی متوقع تاریخ',
    today: 'آج', tomorrow: 'کل', in2: '2 دن میں', inFew: '{n} دن میں', inMany: '{n} دن میں',
    go: 'فیصلہ: حصہ لیں گے', 'no-go': 'فیصلہ: حصہ نہیں لیں گے', pending: 'فیصلہ: ابھی نہیں ہوا',
    stage_new: 'مطالعے کے لیے موصول', stage_working: 'زیرِ مطالعہ', stage_submitted: 'پیشکش جمع ہو چکی', stage_declined: 'حصہ نہیں لیں گے', stage_awarded: 'ایوارڈ ہو چکا', stage_cancelled: 'منسوخ', stage_other: 'دیگر',
    dates: 'تاریخیں', decision: 'فیصلہ اور اس کی وجہ', summary: 'خلاصہ', etimad: 'اعتماد پلیٹ فارم سے تصدیق', timeline: 'واقعات کی ترتیب', files: 'فائلیں', changes: 'تبدیلیوں کا ریکارڈ',
    src_workbook: 'اعتماد سیکشن کی فائل', src_pull: 'اعتماد پلیٹ فارم سے حاصل کردہ ڈیٹا', src_page: 'اعتماد پر ٹینڈر کا صفحہ',
    etimadSame: '{t} کو {src} سے تصدیق کی: تاریخیں رجسٹر سے مطابقت رکھتی ہیں۔', etimadDiff: '{t} کو {src} سے تصدیق کی: {n} تاریخیں رجسٹر سے مختلف ہیں۔',
    diffLine: '{field}: رجسٹر میں {ours}، اعتماد میں {etimad}', none: '—', manager: 'مینیجر',
    kind_mail: 'ای میل', kind_note: 'نوٹ', kind_decision: 'فیصلہ', kind_study: 'مطالعہ', kind_register: 'رجسٹر',
    change: '{field}: «{old}» ← «{new}»', from: 'ماخذ: {s}', close: 'بند کریں', count: '{n} ٹینڈر',
    foot: 'صرف پڑھنے کا صفحہ: یہ صفووت ایپ سے شائع ہوتا ہے، اور یہاں سے کچھ تبدیل نہیں کیا جا سکتا۔ جس کے پاس بھی یہ لنک ہے وہ اس میں سب کچھ دیکھ سکتا ہے، اس لیے اسے صرف انہی سے شیئر کریں جنہیں اس کا حق ہے۔',
  },
};

const $ = (id) => document.getElementById(id);
let lang = 'ar', view = null, tab = 'running', shownRef = null, lastError = null, link = null;
try { const saved = localStorage.getItem('afaqy.tv.lang'); if (STR[saved]) lang = saved; } catch { /* a private window keeps the default */ }
const t = (key, vars = {}) => String(STR[lang][key] ?? STR.ar[key] ?? key).replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? ''));
function el(tag, props = {}, ...kids) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) { if (v === undefined || v === null || v === false) continue; if (k === 'text') n.textContent = v; else if (k === 'class') n.className = v; else n.setAttribute(k, v === true ? '' : v); }
  for (const k of kids.flat()) if (k !== null && k !== undefined && k !== false) n.append(k);
  return n;
}
// The Saudi wall clock now, written like the register's dates
const saudiNow = () => { const d = new Date(Date.now() + 3 * 3600000); return d.toISOString().slice(0, 16).replace('T', ' '); };
const fold = (s) => String(s || '').toLowerCase().replace(/[ً-ْـ]/g, '').replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه');
// A value inside a sentence keeps its own direction: a date or a number stays «2026-12-22 10:00» inside Arabic text
// (first-strong isolate: Arabic words inside stay right to left, digits left to right).
const iso = (v) => (v ? `\u2068${v}\u2069` : v);
function inDays(n) { return n === 0 ? t('today') : n === 1 ? t('tomorrow') : n === 2 ? t('in2') : n <= 10 ? t('inFew', { n }) : t('inMany', { n }); }

function say(key, bad = false) { const s = $('state'); s.textContent = key ? t(key) : ''; s.classList.toggle('bad', !!bad); }

async function load() {
  link = parseViewLink(location.hash);
  if (link.error) { lastError = link.error; view = null; say(link.error, true); $('board').hidden = true; return; }
  say('loading');
  let res;
  try { res = await fetch(`${viewFileUrl(link.repo)}?t=${Date.now()}`, { cache: 'no-store', credentials: 'omit', referrerPolicy: 'no-referrer' }); }
  catch { lastError = 'net'; say('net', true); return; }
  if (res.status === 404) { lastError = 'missing'; view = null; $('board').hidden = true; say('missing', true); return; }
  if (!res.ok) { lastError = 'net'; say('net', true); return; }
  const r = await openView(new Uint8Array(await res.arrayBuffer()), link.key);
  if (!r.ok) { lastError = r.reason; view = null; $('board').hidden = true; say(r.reason, true); return; }
  lastError = null; view = r.view; say('');
  render();
}

function chip(text, cls) { return el('span', { class: `pill ${cls}`, text }); }
function nextLine(tn) {
  const n = tenderNext(tn, saudiNow());
  if (n) return el('span', { class: 'next' }, el('span', { text: `${t(n.field)}: ${iso(n.at)}` }), el('span', { class: n.days <= 7 ? 'soon' : '', text: inDays(n.days) }), tn.decision ? chip(t(tn.decision.verdict), `v-${tn.decision.verdict}`) : null);
  const any = VIEW_DATES.some((k) => tn.dates[k]);
  return el('span', { class: 'next' }, el('span', { class: any && !['declined', 'awarded', 'cancelled'].includes(tn.stage) ? 'past' : '', text: any ? t('allPast') : t('noNext') }), tn.decision ? chip(t(tn.decision.verdict), `v-${tn.decision.verdict}`) : null);
}

function render() {
  if (!view) return;
  document.title = view.title || t('title');
  $('title').textContent = view.title || t('title');
  $('stamp').textContent = t('published', { t: iso(view.publishedAt) });
  const now = saudiNow(), g = viewGroups(view, now);
  const soon = view.tenders.filter((x) => { const n = tenderNext(x, now); return n && n.days <= 7 && !['declined', 'awarded', 'cancelled'].includes(x.stage); }).length;
  $('counts').replaceChildren(...[['running', g.running.length], ['submitted', g.submitted.length], ['archive', g.archive.length], ['soon', soon]]
    .map(([k, n]) => el('div', { class: 'tile' }, el('b', { text: String(n) }), el('span', { text: t(k) }))));
  $('tabs').replaceChildren(...['running', 'submitted', 'archive'].map((k) => {
    const b = el('button', { type: 'button', role: 'tab', 'aria-selected': String(k === tab), text: `${t(k)} (${g[k].length})` });
    b.onclick = () => { tab = k; render(); }; return b;
  }));
  const q = fold($('search').value.trim());
  const rows = g[tab].filter((x) => !q || fold(`${x.title} ${x.ref} ${x.entity} ${x.status}`).includes(q));
  $('list').replaceChildren(...(rows.length ? rows.map(item) : [el('p', { class: 'empty', text: g[tab].length ? t('noMatch') : t('empty') })]));
  $('board').hidden = false;
  if (shownRef && $('card').open) { const again = view.tenders.find((x) => x.ref === shownRef); if (again) fillCard(again); }
}

function item(tn) {
  const b = el('button', { type: 'button', class: 'item', 'data-ref': tn.ref },
    el('span', { class: 'row1' }, el('strong', { text: tn.title || tn.ref }), chip(t(`stage_${tn.stage}`), `s-${tn.stage}`)),
    el('span', { class: 'meta', text: [tn.entity, `${t('ref')}: ${iso(tn.ref)}`].filter(Boolean).join(' · ') }),
    nextLine(tn));
  b.onclick = () => openCard(tn);
  return b;
}

function section(titleKey, ...kids) { return [el('h3', { text: t(titleKey) }), ...kids]; }
function folded(titleKey, n, body) { return el('details', {}, el('summary', { text: `${t(titleKey)} (${n})` }), body); }

function fillCard(tn) {
  $('card-title').textContent = tn.title || tn.ref;
  const facts = el('div', { class: 'facts' },
    ...[['ref', tn.ref], ['entity', tn.entity], ['status', tn.status || t(`stage_${tn.stage}`)]].filter(([, v]) => v).map(([k, v]) => el('div', { class: 'fact' }, el('span', { text: t(k) }), el('b', { text: iso(v) }))));
  const dates = el('div', { class: 'facts' }, ...VIEW_DATES.map((k) => el('div', { class: 'fact' }, el('span', { text: t(k) }), el('b', { text: iso(tn.dates[k]) || t('none') }))));
  const body = [facts, ...section('dates', dates)];
  if (tn.etimad) {
    const src = t(`src_${tn.etimad.source}`), n = tn.etimad.diffs.length;
    body.push(...section('etimad', el('p', { class: `note ${n ? 'warn' : 'ok'}`, text: t(n ? 'etimadDiff' : 'etimadSame', { src, t: iso(tn.etimad.checkedAt), n }) }),
      n ? el('ul', { class: 'plain' }, ...tn.etimad.diffs.map((d) => el('li', { text: t('diffLine', { field: t(d.field), ours: iso(d.ours) || t('none'), etimad: iso(d.etimad) || t('none') }) }))) : null));
  }
  if (tn.decision) body.push(...section('decision', chip(t(tn.decision.verdict), `v-${tn.decision.verdict}`), tn.decision.reason ? el('p', { class: 'pre', text: tn.decision.reason }) : null, tn.decision.at ? el('p', { class: 'muted', text: iso(tn.decision.at) }) : null));
  if (tn.summary) body.push(...section('summary', el('p', { class: 'pre', text: tn.summary })));
  if (tn.timeline.length) body.push(folded('timeline', tn.timeline.length, el('ol', { class: 'tl' }, ...tn.timeline.map((x) => el('li', { class: x.mine ? 'mine' : '' },
    el('div', { class: 'when', text: [iso(x.at), t(`kind_${x.kind}`), [x.who, x.mine ? `(${t('manager')})` : ''].filter(Boolean).join(' ')].filter(Boolean).join(' · ') }),
    el('div', { class: 'txt', text: x.text }))))));
  if (tn.files.length) body.push(folded('files', tn.files.length, el('ul', { class: 'plain' }, ...tn.files.map((f) => el('li', { text: f.at ? `${iso(f.name)} — ${iso(f.at)}` : f.name })))));
  if (tn.changes.length) body.push(folded('changes', tn.changes.length, el('ol', { class: 'tl' }, ...tn.changes.map((c) => el('li', {},
    el('div', { class: 'when', text: [iso(c.at), c.source ? t('from', { s: c.source }) : ''].filter(Boolean).join(' · ') }),
    el('div', { class: 'txt', text: t('change', { field: VIEW_DATES.includes(c.field) ? t(c.field) : c.field, old: iso(c.old) || t('none'), new: iso(c.new) || t('none') }) }))))));
  $('card-body').replaceChildren(...body.filter(Boolean));
}
function openCard(tn) { shownRef = tn.ref; fillCard(tn); if (!$('card').open) $('card').showModal(); $('card-close').focus(); }

function translate() {
  document.documentElement.lang = lang; document.documentElement.dir = lang === 'en' ? 'ltr' : 'rtl';
  $('language').value = lang; $('refresh').textContent = t('refresh'); $('search').placeholder = t('search'); $('search').setAttribute('aria-label', t('search'));
  $('card-close').setAttribute('aria-label', t('close')); $('card-close').title = t('close'); $('foot').textContent = t('foot');
  if (!view) { $('title').textContent = t('title'); document.title = t('title'); }
  if (view) render(); else if (lastError) say(lastError, true);
}

$('language').onchange = () => { lang = $('language').value; try { localStorage.setItem('afaqy.tv.lang', lang); } catch { /* the choice lasts for this visit */ } translate(); };
$('refresh').onclick = () => load();
$('search').oninput = () => render();
$('card-close').onclick = () => $('card').close();
$('card').addEventListener('click', (e) => { if (e.target === $('card')) $('card').close(); });   // a click on the dark area around the window closes it
$('card').addEventListener('close', () => { shownRef = null; });
window.addEventListener('hashchange', () => load());
// updates arrive by themselves: read the published copy again every five minutes while the page is on screen
setInterval(() => { if (document.visibilityState === 'visible' && link && !link.error) load(); }, 5 * 60 * 1000);
translate(); load();
