// config.js — the only file to edit when a tool is added or moves.
export const PORTAL_VERSION = '8.19';   // stamped by scripts/bump.mjs — never edit by hand

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
export const SYSTEM_CATEGORIES = [{"id": "afaqy", "name": {"ar": "أنظمة أفاقي", "en": "Afaqy systems", "ur": "آفاقی سسٹمز"}}, {"id": "projects", "name": {"ar": "المشاريع ونسك", "en": "Projects and Nusuk", "ur": "پروجیکٹس اور نسک"}}, {"id": "rafed", "name": {"ar": "أنظمة رافد", "en": "Rafed systems", "ur": "رافد سسٹمز"}}, {"id": "vendors", "name": {"ar": "بوابات الموردين والأجهزة", "en": "Vendors and device portals", "ur": "سپلائرز اور ڈیوائس پورٹلز"}}, {"id": "work", "name": {"ar": "العمل والتعلم والدعم", "en": "Work, learning and support", "ur": "کام، تربیت اور معاونت"}}];
export const SYSTEMS = [{"id": "myafaqy", "category": "afaqy", "url": "https://myafaqy.com/", "name": {"ar": "MyAFAQY", "en": "MyAFAQY", "ur": "MyAFAQY"}}, {"id": "pro", "category": "afaqy", "url": "https://afaqy.pro/", "name": {"ar": "AFAQY PRO", "en": "AFAQY PRO", "ur": "AFAQY PRO"}}, {"id": "legacy", "category": "afaqy", "url": "https://afaqy.in/", "name": {"ar": "AFAQY Legacy", "en": "AFAQY Legacy", "ur": "AFAQY Legacy"}}, {"id": "api_docs", "category": "afaqy", "url": "https://api.afaqy.sa/docs/", "name": {"ar": "AFAQY API Documentation", "en": "AFAQY API Documentation", "ur": "AFAQY API Documentation"}}, {"id": "vss", "category": "afaqy", "url": "https://vss.afaqy.pro/", "name": {"ar": "VSS", "en": "VSS", "ur": "VSS"}}, {"id": "camera", "category": "afaqy", "url": "https://camera.afaqy.pro/", "name": {"ar": "Camera", "en": "Camera", "ur": "Camera"}}, {"id": "cms", "category": "afaqy", "url": "https://cms.afaqy.pro/", "name": {"ar": "CMS", "en": "CMS", "ur": "CMS"}}, {"id": "senseware", "category": "afaqy", "url": "https://senseware.afaqy.pro/auth/login", "name": {"ar": "SenseWare", "en": "SenseWare", "ur": "SenseWare"}}, {"id": "mardam", "category": "projects", "url": "https://makkah.mardam.afaqy.pro/", "name": {"ar": "Makkah Mardam", "en": "Makkah Mardam", "ur": "Makkah Mardam"}}, {"id": "nusukcard", "category": "projects", "url": "https://nusukcard.net/", "name": {"ar": "Nusuk Card", "en": "Nusuk Card", "ur": "Nusuk Card"}}, {"id": "nusukreaders", "category": "projects", "url": "https://nusukreaders.net/", "name": {"ar": "Nusuk Readers", "en": "Nusuk Readers", "ur": "Nusuk Readers"}}, {"id": "nusuk_ip", "category": "projects", "url": "https://vpn-address-removed.invalid:18443/login.html", "name": {"ar": "OpenVPN — نسك", "en": "OpenVPN — Nusuk", "ur": "اوپن وی پی این — نسک"}}, {"id": "ods", "category": "rafed", "url": "https://ods.rafedsa.com/#/batch_devices", "name": {"ar": "Rafed ODS", "en": "Rafed ODS", "ur": "Rafed ODS"}}, {"id": "ets", "category": "rafed", "url": "https://ets.rafedsa.com/", "name": {"ar": "Rafed ETS", "en": "Rafed ETS", "ur": "Rafed ETS"}}, {"id": "xirgo_help", "category": "vendors", "url": "https://it.help.xirgo.com/", "name": {"ar": "Xirgo Help", "en": "Xirgo Help", "ur": "Xirgo Help"}}, {"id": "xgfleet", "category": "vendors", "url": "https://login.xgfleet.eu/", "name": {"ar": "XG Fleet", "en": "XG Fleet", "ur": "XG Fleet"}}, {"id": "teltonika_fota", "category": "vendors", "url": "https://fota.teltonika.lt/", "name": {"ar": "Teltonika FOTA", "en": "Teltonika FOTA", "ur": "Teltonika FOTA"}}, {"id": "teltonika_partners", "category": "vendors", "url": "https://partners.teltonika-iot-group.com/", "name": {"ar": "Teltonika Partners", "en": "Teltonika Partners", "ur": "Teltonika Partners"}}, {"id": "milesight", "category": "vendors", "url": "https://account.milesight.com/enterprise", "name": {"ar": "Milesight Enterprise", "en": "Milesight Enterprise", "ur": "Milesight Enterprise"}}, {"id": "mail", "category": "work", "url": "https://outlook.office.com/mail/", "name": {"ar": "Outlook", "en": "Outlook", "ur": "Outlook"}}, {"id": "onedrive", "category": "work", "url": "https://www.office.com/launch/onedrive", "name": {"ar": "OneDrive", "en": "OneDrive", "ur": "OneDrive"}}, {"id": "learn", "category": "work", "url": "https://learn.afaqy.pro/", "name": {"ar": "AFAQY Learn", "en": "AFAQY Learn", "ur": "AFAQY Learn"}}, {"id": "service_desk", "category": "work", "url": "https://afaqy.atlassian.net/servicedesk/customer/portal/3/user/login?", "name": {"ar": "AFAQY Service Desk", "en": "AFAQY Service Desk", "ur": "AFAQY Service Desk"}}];

// Everything else. status: 'live' or 'soon'.
export const MORE = [
  { id: 'nusuk', status: 'live', module: true, url: 'https://mhmdsfwt371.github.io/Project-survey/',
    name: { ar: 'قارئات أفاقي — المسح الميداني', en: 'Afaqy readers — field survey', ur: 'آفاقی ریڈرز — فیلڈ سروے' } },   // the tool's own name
  { id: 'calibration', status: 'live', module: true, url: 'https://mhmdsfwt371.github.io/sensor-displacment-tool/certificates.html',
    name: { ar: 'شهادات المعايرة', en: 'Calibration certificates', ur: 'کیلیبریشن سرٹیفکیٹس' } },  // on Lovable, not on the portal's address — so it opens in a new tab (decision 0007: modules come from MODULE_ORIGIN only)
  { id: 'hunt', status: 'live', url: 'https://afaqy-hunt.lovable.app/',
    name: { ar: 'أفاقي هنت — محرك الاستهداف', en: 'AFAQY Hunt — prospecting engine', ur: 'آفاقی ہنٹ — پراسپیکٹنگ انجن' } },
];

