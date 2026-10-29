// config.js — the only file to edit when a tool is added or moves.
export const PORTAL_VERSION = '6.9';   // stamped by scripts/bump.mjs — never edit by hand

// MODULES open inside the portal (an embedded frame under the portal's header), stay alive while you switch between
// them, and keep their own code in their own repository. A module must live on the portal's own address
// (https://mhmdsfwt371.github.io/…) — the guard and the link check enforce it.
export const MODULE_ORIGIN = 'https://mhmdsfwt371.github.io';
// What a module may use inside the portal: the survey tool needs location and the camera; all copy to the clipboard.
export const MODULE_ALLOW = 'geolocation; camera; clipboard-read; clipboard-write; fullscreen';

// The three tools the team works with every day — shown first and largest. All three are modules.
export const PRIMARY = [
  { id: 'sensor', icon: 'heatmap', module: true, url: 'https://mhmdsfwt371.github.io/sensor-displacment-tool/',
    name: { ar: 'مخطط توزيع الحساسات', en: 'Sensor displacement tool', ur: 'سینسرز کی تقسیم کا نقشہ' },
    desc: { ar: 'خريطة حرارية لتوزيع حساسات الحرارة والرطوبة على موقع العميل.', en: 'Heat map for placing temperature and humidity sensors on a client site.', ur: 'کلائنٹ کی سائٹ پر درجۂ حرارت اور نمی کے سینسرز لگانے کے لیے حرارتی نقشہ۔' } },
  { id: 'apihelper', icon: 'api', module: true, url: 'https://mhmdsfwt371.github.io/Afaqy-API-Helper/',
    name: { ar: 'مساعد الإنتجريشن', en: 'API helper', ur: 'انٹیگریشن ہیلپر' },
    desc: { ar: 'شرح واجهات أفاقي البرمجية وتجهيز طلبات الربط للعملاء.', en: 'Afaqy API reference and integration requests for clients.', ur: 'آفاقی کے پروگرامنگ انٹرفیس کی وضاحت، اور کلائنٹس کے لیے انٹیگریشن کی درخواستوں کی تیاری۔' } },
  { id: 'canval', icon: 'can', module: true, url: 'https://mhmdsfwt371.github.io/canval-CAN/',
    name: { ar: 'كانفال', en: 'canval', ur: 'کینوال' },
    desc: { ar: 'هل تدعم المركبة قراءة كان باص؟ إجابة فورية بلا زيارة فني.', en: 'Does the vehicle support CAN bus reading? An instant answer without a site visit.', ur: 'کیا گاڑی کین بس پڑھنے کو سپورٹ کرتی ہے؟ ٹیکنیشن بھیجے بغیر فوری جواب۔' } },
];

// Company systems — links only: myafaqy forbids being shown inside another page (X-Frame-Options DENY) and Afaqy PRO
// allows only its own address (SAMEORIGIN) — checked 29 Oct 2026. They open in a new tab.
export const SYSTEMS = [
  { id: 'myafaqy', url: 'https://myafaqy.com/', name: { ar: 'ماي أفاقي', en: 'myafaqy', ur: 'myafaqy' } },
  { id: 'pro', url: 'https://afaqy.pro/', name: { ar: 'أفاقي برو', en: 'Afaqy PRO', ur: 'آفاقی پرو' } },
  { id: 'mail', url: 'https://outlook.office.com/mail/', name: { ar: 'البريد', en: 'Email', ur: 'ای میل' } },
];

// Everything else. status: 'live' or 'soon'.
export const MORE = [
  { id: 'nusuk', status: 'live', module: true, url: 'https://mhmdsfwt371.github.io/Project-survey/',
    name: { ar: 'قارئات أفاقي — المسح الميداني', en: 'Afaqy readers — field survey', ur: 'آفاقی ریڈرز — فیلڈ سروے' } },   // the tool's own name
  { id: 'calibration', status: 'soon', url: '',
    name: { ar: 'شهادات المعايرة', en: 'Calibration certificates', ur: 'کیلیبریشن سرٹیفکیٹس' } },
];

