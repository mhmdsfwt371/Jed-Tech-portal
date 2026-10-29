// core.js — pure logic. No DOM, no network, so tests/core.test.mjs runs it in Node.
// The portal never calls an Afaqy API. CRM data arrives as a file that Claude in Chrome produces from inside
// myafaqy, in the fixed format defined here (SCHEMA), so the portal never depends on the CRM's own field names.

export const SCHEMA = 'afaqy-crm-tasks/v2';   // v1 is still read (SCHEMAS below)
export const TZ_OFFSET = '+03:00';   // Saudi time, no daylight saving

// ===================== strings =====================
export const LANGS = ['ar', 'en', 'ur'];
export const dirOf = (lang) => (lang === 'en' ? 'ltr' : 'rtl');

export const STRINGS = {
  ar: {
    brand: 'أفاقي', portal: 'بوابة الفريق التقني — جدة', nav_data: 'البيانات', nav_kpi: 'المؤشرات',
    tools_title: 'أدوات الفريق', tools_sub: 'كل أداة تعمل داخل البوابة، بحسابها المعتاد.',
    primary: 'الأدوات الأساسية', systems: 'أنظمة الشركة', more: 'أدوات أخرى', soon: 'قريبًا',
    open: 'فتح',
    data_title: 'بيانات المؤشرات', data_sub: 'البيانات تُسحب من ماي أفاقي بواسطة كلود كروم، ثم تُرفع هنا. تبقى على هذا الجهاز فقط.',
    step1: 'اختر الفترة', step2: 'انسخ الأمر إلى كلود كروم', step3: 'ارفع النتيجة',
    block_size: 'طول الفترة', blocks_back: 'عدد الفترات',
    m3: 'ربع سنة', m6: 'نصف سنة', m12: 'سنة',
    block_partial: 'جارية',
    copy_prompt: 'نسخ الأمر', copied: 'نُسخ الأمر — الصقه في كلود كروم وأنت فاتح ماي أفاقي',
    step2_hint: 'افتح ماي أفاقي في كروم وسجّل دخولك، ثم افتح كلود كروم والصق الأمر. أمر لكل فترة.',
    step3_hint: 'الصق رد كلود كروم كما هو، أو اختر الملف الذي حفظته. يمكن رفع أكثر من جزء لنفس الفترة.',
    paste_here: 'الصق رد كلود كروم هنا', load_text: 'قراءة النص', choose_file: 'اختيار ملف',
    datasets: 'البيانات المرفوعة', none_yet: 'لم تُرفع بيانات بعد. ابدأ من الخطوة الأولى.',
    tasks_n: '{n} مهمة', complete: 'مكتملة', incomplete: 'ناقصة: {got} من {want}',
    remove: 'حذف', export_all: 'تصدير نسخة احتياطية', import_all: 'استعادة نسخة',
    sample: 'تحميل بيانات تجريبية', sample_note: 'بيانات تجريبية — ليست من ماي أفاقي',
    loaded: 'رُفعت {n} مهمة للفترة {range}',
    err_json: 'لم أجد بيانات صالحة في النص. الصق رد كلود كروم كاملًا كما هو.',
    err_schema: 'هذه البيانات ليست بالصيغة المطلوبة ({schema}). استخدم الأمر الصادر من هذه الصفحة.',
    err_range: 'الفترة في الملف غير صحيحة.',
    err_tasks: 'الملف لا يحتوي على قائمة مهام.',
    warn_rows: 'تُجوهلت {n} صفوف ناقصة البيانات.',
    kpi_title: 'المؤشرات', kpi_sub: 'Factor 1 — حمل المهام والإنجاز لكل مهندس، من مهام ماي أفاقي.',
    period: 'الفترة', no_data: 'لا توجد بيانات بعد. ارفع بيانات من صفحة البيانات.',
    col_person: 'الموظف', col_assigned: 'المُسندة', col_done: 'المنجزة', col_rate: 'نسبة الإنجاز',
    col_avg: 'متوسط مدة الإنجاز', col_median: 'الوسيط', col_open: 'المفتوحة الآن', col_created: 'أنشأها',
    col_email: 'من البريد', col_cancelled: 'الملغاة',
    hours: '{n} س', days: '{n} يوم',
    team: 'إجمالي الفريق', group_bucket: 'مُسندة لمجموعة ولم تُنجز',
    trend: 'المقارنة بين الفترات', definitions: 'طريقة الحساب',
    def_1: 'المهمة تُحسب للمسؤول عنها في ماي أفاقي.',
    def_2: '«المسندة» هي المهام التي أُنشئت داخل الفترة، و«المنجزة» هي التي أُغلقت داخل الفترة حتى لو أُنشئت قبلها — بنفس عدّ ماي أفاقي لفلتر تاريخ الإنجاز.',
    def_3: 'نسبة الإنجاز: من المهام التي أُنشئت في الفترة، كم أُنجز حتى وقت السحب، بلا الملغاة. والمدة من إنشاء المهمة حتى إغلاقها بالساعات الكاملة لما أُنجز في الفترة؛ والوسيط يُعرض لأن مهمة طويلة واحدة تشوّه المتوسط.',
    def_4: '«من البريد» هي مهام «نشاط بريد العميل» في ماي أفاقي — لا كل ما أنشأه حساب النظام، لأنه ينشئ مهام أوامر العمل أيضًا.',
    data_incomplete_warn: 'بيانات هذه الفترة ناقصة — الأرقام أقل من الحقيقة.',
    theme: 'المظهر', lang_next: 'English',
    nav_guide: 'الدليل',
    whats_new: 'ما الجديد في هذه النسخة',
    update_ready: 'نسخة أحدث متاحة — اضغط لتحديث الصفحة',
    close: 'إغلاق',
    g_title: 'دليل الاستخدام',
    g_version: 'هذا الدليل للنسخة v{v} — {date}',
    g_print: 'طباعة الدليل',
    g_tools_h: 'الأدوات',
    g_tools_b: 'القائمة الجانبية فيها كل شيء: «الرئيسية»، ثم مجموعة «الوحدات» — مخطط توزيع الحساسات، ومساعد الإنتجريشن، وكانفال، وقارئات أفاقي — ثم مجموعة «المؤشرات» بصفحتي البيانات ولوحة المؤشرات، ثم «أنظمة الشركة»، ثم «الدليل». المجموعة تُفتح وتُطوى بالضغط على اسمها، وتُفتح وحدها حين تكون فيها. اضغط وحدة فتفتح تحت الشريط العلوي وتبقى مفتوحة على حالها حين تنتقل لغيرها؛ و«فتح في نافذة مستقلة» في الشريط يفتحها وحدها. كل أداة تطلب الدخول بحسابها المعتاد. أنظمة الشركة — ماي أفاقي وأفاقي برو والبريد — تفتح في نافذة جديدة، لأنها لا تسمح بعرضها داخل صفحة أخرى. اللغة والوضع الداكن أسفل القائمة، وعلى الجوال تفتح القائمة من الزر أعلى الشاشة.',
    g_data_h: 'بيانات المؤشرات',
    g_data_b: 'لكل فترة أمران: «نسخ الأمر» يسحب مهام الفترة للمؤشر الأول، و«نسخ أمر التقارير» يسحب نقاط الفنيين وتذاكر ما بعد البيع للمؤشرين الثاني والثالث. كل أمر يسمّي بالاسم الطلبات المسموحة له ويمنع ما سواها، فلا يتغيّر شيء في ماي أفاقي. شغّل الأمر في كلود كروم وأنت داخل ماي أفاقي؛ يحفظ النتيجة ملفًّا على جهازك، فترفعه هنا من «اختيار ملف» — الصندوق نفسه يقبل النوعين. البوابة لا تقرأ ماي أفاقي بنفسها لأن خادمه لا يقبل طلبات من عنوان آخر.',
    g_parts_h: 'الرد الطويل والفترة الناقصة',
    g_parts_b: 'إذا قسّم كلود كروم الرد إلى أجزاء، ارفعها كلها؛ تُدمج بحسب رقم المهمة. تبقى الفترة «ناقصة» حتى يساوي عدد المهام العدد الذي أعلنه ماي أفاقي نفسه، وتظهر فوق أرقامها علامة تحذير.',
    g_kpi_h: 'المؤشرات',
    g_kpi_b: 'اختر الفترة من القائمة. المؤشر الأول يعرض لكل موظف ما أُسند إليه وما أنجزه ونسبة الإنجاز ومدة الإنجاز وما هو مفتوح الآن، بأشرطة وترتيب بالمنجزة أو الوسيط أو المفتوحة، ثم إجمالي الفريق والدوائر. تحته تذاكر ما بعد البيع لكل موظف، ثم المؤشر الرابع — سجل الأنشطة: ما سجّله كل مهندس مع العملاء في الفترة، وعدد العملاء، وكم صار مهمة، وتوزيع الحالات والتصنيفات — حين يُرفع ملف التقارير للفترة نفسها. نقاط الفنيين مطوية أسفل الصفحة لمن يحتاجها. الفريق المحسوب يُحدَّد تلقائيًّا من الفرق الفنية في جدة ويمكن تعديله، وإذا رُفعت أكثر من فترة تظهر المقارنة أعمدةً. طريقة حساب كل رقم مكتوبة أسفل الصفحة.',
    g_privacy_h: 'أين تُحفظ البيانات',
    g_privacy_b: 'على هذا الجهاز وفي هذا المتصفح فقط، ولا يُرسل منها شيء لأي جهة. لنقلها إلى جهاز آخر أو الاحتفاظ بنسخة استخدم «تصدير نسخة احتياطية» ثم «استعادة نسخة». مسح بيانات المتصفح يمسحها.',
    def_5: '«المفتوحة الآن» صورة لحظة السحب، أيًّا كان تاريخ إنشاء المهمة.',
    team_title: 'الفريق المحسوب في المؤشرات',
    team_count: '{n} من {total}',
    team_jeddah: 'فرق فرع جدة',
    team_all: 'الكل',
    team_hint: 'يُحدَّد تلقائيًّا من فرق ماي أفاقي المسجّلة على فرع جدة، ويمكن تعديله. يُحفظ على هذا الجهاز.',
    open_tab: 'فتح في نافذة مستقلة',
    module_loading: 'جارٍ فتح الأداة…',
    in_portal: 'تعمل داخل البوابة',
    systems_note: 'تفتح في نافذة جديدة — أنظمة الشركة لا تسمح بعرضها داخل صفحة أخرى.',
    side_modules: 'الوحدات',
    menu: 'القائمة',
    nav_home: 'الرئيسية',
    kpi_board: 'لوحة المؤشرات',
    lang_label: 'اللغة',
    theme_dark: 'الوضع الداكن',
    theme_light: 'الوضع الفاتح',
    nav_me: 'مؤشراتي',
    me_title: 'مؤشراتي',
    me_sub: 'ملفّك: شغلك وأرقامك ومقارنتها، وفريقك إن كان ماي أفاقي يضع أحدًا تحتك. من ماي أفاقي وبدخولك أنت، ويبقى على جهازك.',
    me_how_h: 'الإعداد مرة واحدة',
    me_bm: 'مؤشراتي من ماي أفاقي',
    me_step1: 'على الكمبيوتر: اسحب هذا الزر إلى شريط الإشارات في المتصفح.',
    me_drag: 'اسحب الزر إلى شريط الإشارات، ثم اضغطه من داخل ماي أفاقي.',
    me_step2: 'بعد ذلك: افتح ماي أفاقي وسجّل دخولك، ثم اضغط الإشارة. تُقرأ مهامك وتفتح هذه الصفحة بمؤشراتك. وللتحديث اضغطها مرة أخرى.',
    me_copy: 'نسخ رمز الإشارة',
    me_copied: 'نُسخ الرمز',
    me_copy_fail: 'تعذّر النسخ — اضغط مطوّلًا على الزر واختر نسخ الرابط',
    me_phones: 'على الجوال',
    me_android: 'أندرويد (كروم): انسخ رمز الإشارة، واحفظ أي صفحة في الإشارات، ثم عدّلها: الاسم «مؤشراتي» والعنوان هو الرمز المنسوخ. بعدها من داخل ماي أفاقي اكتب «مؤشراتي» في شريط العنوان واختر الإشارة من الاقتراحات — الضغط عليها من قائمة الإشارات لا يشغّلها.',
    me_ios: 'آيفون (سفاري): انسخ رمز الإشارة، واحفظ أي صفحة في الإشارات، ثم عدّل عنوانها بلصق الرمز. بعدها من داخل ماي أفاقي افتح الإشارات واضغطها.',
    me_privacy: 'ما يُقرأ: مهامك أنت فقط — رقمها، ووقت إنشائها وإغلاقها، وحالتها، ونوعها. لا العناوين ولا العملاء ولا رمز دخولك. لا يُرسل شيء إلى أي خادم، ولا يرى مؤشراتك أحد غيرك.',
    me_wait: 'في انتظار مهامك من ماي أفاقي…',
    me_loaded: 'وصلت مؤشراتك: {n} مهمة',
    me_q: 'الربع',
    me_partial: 'جزء منه',
    me_refresh_h: 'التحديث والإعداد',
    me_refresh: 'للتحديث: افتح ماي أفاقي واضغط الإشارة مرة أخرى.',
    me_forget: 'حذف مؤشراتي من هذا الجهاز',
    g_me_h: 'مؤشراتي',
    g_me_b: 'صفحة «مؤشراتي» ملفّك أنت. مرة واحدة: اسحب زر «مؤشراتي» إلى شريط الإشارات في المتصفح. ثم كلما أردت: افتح ماي أفاقي بحسابك واضغط الإشارة — تقرأ شغلك وتفتح البوابة عليه. تجد بياناتك وفرقك، ثم «شغلي المفتوح الآن» بعناوين مهامك وعمرها، ثم «هذا الشهر مقابل الشهر الماضي» على الأيام نفسها بأسهم تقول أين تحسّنت وأين تراجعت، ثم مقارنتك بمتوسط الفريق بلا أسماء، ثم تاريخك لآخر اثني عشر شهرًا. وإن كان ماي أفاقي يضع أشخاصًا تحتك في هيكله — قائد فريق أو مدير — يظهر قسم «فريقي» بأرقام كل واحد منهم. البوابة تعرض لك بالضبط ما يعرضه لك ماي أفاقي ولا شيء زائدًا. كل شيء يبقى على جهازك؛ لا يُنقل رمز الدخول ولا أسماء العملاء ولا عناوين مهام غيرك ولا عناوين المنجزة، وزر «حذف مؤشراتي» يمحوه من الجهاز.',
    col_self: 'سجّلها لنفسه',
    def_6: '«سجّلها لنفسه» من المسندة: مهام فتحها الموظف وأسندها لنفسه، لا من البريد — وهي عند الفريق الطلبات التي تصل بالواتساب أو بالمكالمات. ماي أفاقي يسجّل منشئ المهمة لا قناتها، فلا يُفصل الواتساب عن المكالمة. تُقرأ مع بقية الأعمدة: تُظهر من أين جاء الحمل، لا جودة العمل.',
    nav_pro: 'أفاقي برو',
    pro_sub: 'وحدات حسابك في أفاقي برو، من داخل البوابة — للقراءة فقط.',
    pro_signin_h: 'الدخول بحساب أفاقي برو',
    pro_user: 'اسم المستخدم',
    pro_pass: 'كلمة المرور',
    pro_signin: 'دخول',
    pro_signing: 'جارٍ الدخول…',
    pro_bad: 'اسم المستخدم أو كلمة المرور غير صحيحة.',
    pro_2fa: 'هذا الحساب يستخدم رمز تحقق، وأفاقي برو لا يسمح بإكمال الدخول بالرمز من خارج موقعه. استخدم «فتح موقع أفاقي برو».',
    pro_refused: 'رفض أفاقي برو الدخول: {why}',
    pro_net: 'تعذّر الوصول إلى أفاقي برو — تحقّق من الاتصال وأعد المحاولة.',
    pro_expired: 'انتهت جلسة أفاقي برو — ادخل مرة أخرى.',
    pro_privacy: 'كلمة المرور تُستعمل مرة واحدة للحصول على جلسة، ولا تُحفظ في أي مكان. الجلسة تبقى في هذا التبويب فقط وتنتهي بإغلاقه. لا يُكتب شيء في أفاقي برو.',
    pro_site: 'فتح موقع أفاقي برو',
    pro_loading: 'جارٍ تحميل الوحدات: {n} من {total}',
    pro_search: 'ابحث بالاسم أو IMEI',
    pro_refresh: 'تحديث',
    pro_out: 'خروج',
    pro_total: 'كل الوحدات',
    pro_live: 'أرسلت خلال ساعة',
    pro_day: 'خلال ٢٤ ساعة',
    pro_stale: 'أقدم من ٢٤ ساعة أو لم ترسل',
    pro_col_name: 'الوحدة',
    pro_col_id: 'IMEI',
    pro_col_last: 'آخر إرسال (بتوقيت السعودية)',
    pro_col_state: 'الحالة',
    pro_col_where: 'الموقع',
    pro_st_live: 'متصلة',
    pro_st_day: 'اليوم',
    pro_st_stale: 'متأخرة',
    pro_st_never: 'لم ترسل',
    pro_map: 'على الخريطة',
    pro_none: 'لا وحدات تطابق البحث.',
    pro_more: 'و{n} وحدة أخرى — ضيّق البحث لتظهر.',
    g_pro_h: 'أفاقي برو',
    g_pro_b: 'صفحة «أفاقي برو» تعرض وحدات حسابك من داخل البوابة: الاسم وIMEI وآخر إرسال بتوقيت السعودية والحالة والموقع على الخريطة، والضغط على أي وحدة يعرض كل بياناتها. ادخل باسم المستخدم وكلمة المرور؛ كلمة المرور لا تُحفظ، والجلسة تنتهي بإغلاق التبويب، ولا يُكتب شيء في أفاقي برو. الحسابات التي تستخدم رمز تحقق لا تكمل الدخول من هنا — أفاقي برو يمنع ذلك من خارج موقعه — فتفتح الموقع نفسه من الزر. ماي أفاقي لا يُعرض داخل البوابة ولا يسمح لها بقراءة بياناته، فيفتح في نافذة جديدة.',
    copy_reports: 'نسخ أمر التقارير',
    reports_loaded: 'وصلت تقارير {range}: {n} صف نقاط فنيين و{a} موظف ما بعد البيع',
    reports_meta: 'تقارير: {m} شهر نقاط فنيين، و{a} موظف ما بعد البيع',
    reports_none: 'لا تقارير لهذه الفترة بعد. من صفحة البيانات انسخ «أمر التقارير» للفترة نفسها، وشغّله في كلود كروم، وارفع الملف.',
    col_rd: 'بحث وتطوير',
    f2_title: 'المؤشر الثاني — نقاط الفنيين',
    f2_sub: 'من تقرير «نقاط الفنيين» في ماي أفاقي لفرع جدة، مجموع الأشهر: {months}.',
    f2_none: 'لا عمل ميداني مسجّل في هذه الفترة.',
    f2_name: 'الفني',
    f2_installed: 'تركيب أجهزة',
    f2_maint: 'صيانة أجهزة',
    f2_fix: 'إصلاح',
    f2_reservice: 'إعادة خدمة',
    f2_stop: 'إيقاف خدمة',
    f2_group: 'تركيب جماعي',
    f2_extra: 'أعمال إضافية',
    f2_viol: 'مخالفات',
    f2_points: 'النقاط',
    f3_title: 'المؤشر الثالث — تذاكر ما بعد البيع',
    f3_sub: 'من لوحة «ما بعد البيع» في ماي أفاقي لفرع جدة، للتذاكر التي أُنشئت في الفترة.',
    f3_none: 'لا تذاكر في هذه الفترة.',
    f3_name: 'الموظف',
    f3_open: 'مفتوحة',
    f3_pending: 'معلّقة',
    f3_done: 'منجزة',
    f3_total: 'الإجمالي',
    def_7: '«بحث وتطوير»: من المنجزة في الفترة، ما كان في طابور «مهام البحث والتطوير» في ماي أفاقي. يظهر حين يحمل ملف الفترة قائمة هذا الطابور.',
    def_8: 'المؤشر الثاني ينقل تقرير «نقاط الفنيين» كما يحسبه ماي أفاقي شهرًا شهرًا لفرع جدة، ويجمع أشهر الفترة لكل فني. لا تُنقل منه قيم المكافآت ولا أرقام الهواتف ولا التقييمات.',
    def_9: 'المؤشر الثالث ينقل لوحة «ما بعد البيع» لفرع جدة كما هي: لكل موظف تذاكره المفتوحة والمعلّقة والمنجزة، من التذاكر التي أُنشئت في الفترة.',
    me_open_h: 'شغلي المفتوح الآن ({n})',
    me_open_none: 'لا مهام مفتوحة عليك الآن.',
    me_untitled: 'مهمة بلا عنوان',
    mgr_bm: 'سحب كل بيانات الفريق {from} ← {to}',
    mgr_bm_intro: 'للمدير: إشارة واحدة تسحب كل بيانات الفترة — المهام والتقارير معًا — من داخل ماي أفاقي بضغطة واحدة، وتحفظ ملفين ترفعهما أدناه. بديل عن نسخ الأمرين. اسحب الزر إلى شريط الإشارات مرة واحدة.',
    g_mgr_h: 'إشارة المدير — سحب كل شيء بضغطة',
    g_mgr_b: 'في صفحة البيانات، إشارة واحدة للمدير تقرأ من داخل ماي أفاقي كل ما يقرأه الأمران: مهام الفترة كلها، وطابور البحث والتطوير، ونقاط الفنيين، وتذاكر ما بعد البيع — وتحفظها ملفين (مهام وتقارير) تُرفعان في البوابة. تعمل بدخول المدير نفسه، للقراءة فقط، بالطلبات الستة المسموحة نفسها، ولا يغادر رمز الدخول صفحة ماي أفاقي. هي بديل أسرع عن نسخ الأمرين وتشغيلهما في كلود كروم؛ وتبقى طريقة كلود كروم متاحة لمن يفضّلها.',
    me_updated: 'آخر تحديث {date}',
    me_scope: 'ماي أفاقي يعرض لك شغل {n} شخص',
    me_month_h: 'هذا الشهر مقابل الشهر الماضي — حتى يوم {d}',
    me_month_sub: 'من {a} إلى {b}، مقابل الأيام نفسها من الشهر الماضي ({c} إلى {d}) — مقارنة عادلة.',
    me_last_month: 'الشهر الماضي',
    me_avg_h: 'مقارنة بمتوسط الفريق',
    me_avg_sub: 'متوسط {n} شخص لهم شغل هذا الشهر، بلا أسماء.',
    me_avg_team: 'متوسط الفريق',
    me_avg_none: 'ماي أفاقي يعرض لك شغلك وحدك، فلا يُحسب هنا متوسط للفريق.',
    me_team_h: 'فريقي — {n} شخص',
    me_team_sub: 'من ماي أفاقي يضعهم تحتك في هيكله، بأرقام هذا الشهر حتى اليوم.',
    me_vs_last: 'المنجزة مقابل الشهر الماضي',
    me_history_h: 'تاريخي — آخر اثني عشر شهرًا بالربع',
    me_open_more: 'وعرض {n} مهمة أخرى',
    nav_team: 'الفريق',
    team_sub: 'من هنا تُكتب مناصب الفريق ومن يتبع من — بأرقام ماي أفاقي، فلا أسماء في الملف. الأسماء تأتي من ماي أفاقي مع الإشارة.',
    team_note: 'ما تكتبه هنا يبقى على هذا الجهاز. لكي يراه الفريق كله، نزّل الملف «team.json» وضعه في المستودع — فيه أرقام ومناصب فقط، لا أسماء.',
    team_download: 'تنزيل team.json',
    team_upload: 'رفع team.json',
    team_loaded: 'وصل ملف الفريق: {n} شخصًا',
    team_filled: '{n} من {m} لهم منصب أو قائد',
    team_col_name: 'الاسم — من ماي أفاقي',
    team_col_id: 'الرقم في ماي أفاقي',
    team_col_pos: 'المنصب',
    team_col_leader: 'يتبع لـ',
    team_no_leader: '— بلا قائد —',
    team_pos_ph: 'مثال: مهندس ما بعد البيع',
    team_none: 'لا أشخاص بعد — ارفع بيانات من صفحة البيانات أو اضغط إشارة «مؤشراتي».',
    me_leader: 'يتبع لـ {name}',
    me_sources_h: 'مصادر شغلي هذا الشهر',
    src_email: 'من البريد',
    src_self: 'سجّلها لنفسه',
    src_other: 'أسندها آخرون',
    kpi_dist_h: 'توزيع المنجزة على الفريق',
    kpi_src_h: 'مصادر المهام المنجزة',
    kpi_tickets_h: 'تذاكر ما بعد البيع',
    others: 'الباقون',
    g_team_h: 'الفريق — المناصب ومن يتبع من',
    g_team_b: 'في صفحة «الفريق» قسمان. الأول «تعيين ما بعد البيع على حسابات جدة»: إشارة تُفتح داخل ماي أفاقي بدخولك لوحةً تختار فيها المهندسين وترى تغطية حسابات جدة، وتجرّب على عشرة بجدول قبل/بعد، ثم تطبّق على الباقي وتنزّل السجل — بإضافة فقط، لا يُحذف أحد موجود، وعلى فرع جدة فقط، وهي الكتابة الوحيدة في البوابة كلها. الثاني «المناصب ومن يتبع من»: يكتب المدير منصب كل شخص ومن يتبع له أمام اسمه كما يأتي من ماي أفاقي؛ يُحفظ بأرقام ماي أفاقي لا بالأسماء، ويبقى على الجهاز، ولكي يراه الفريق كله يُنزَّل «team.json» ويوضع في المستودع. المنصب يظهر في بطاقة «مؤشراتي» والجداول واللوحة، و«يتبع لـ» يجعل القائد يرى من تحته في «فريقي».',
    me_period_month: 'هذا الشهر',
    me_period_quarter: 'هذا الربع',
    me_period_half: 'آخر ٦ أشهر',
    me_cmp_h_month: 'هذا الشهر مقابل الشهر الماضي — حتى يوم {d}',
    me_cmp_h_quarter: 'هذا الربع مقابل الربع الماضي — أول {d} يومًا',
    me_cmp_h_half: 'آخر ستة أشهر مقابل الستة قبلها',
    me_last_period: 'الفترة السابقة',
    me_update: 'تحديث من ماي أفاقي',
    me_refresh_hint: 'افتح ماي أفاقي واضغط الإشارة هناك — البوابة تتحدّث وحدها.',
    me_setup_again: 'إعداد الإشارة',
    alert_attention: 'يحتاج نظرة: {name} — {why}.',
    alert_improved: 'تحسّن واضح: {name} — ‎+{n}‎ منجزة عن الفترة السابقة على الأيام نفسها.',
    why_rate: 'نسبة إنجاز {r}',
    why_open: '{n} مهمة مفتوحة',
    why_median: 'وسيط {h} — أكثر من ضعف الفريق',
    kpi_table_sub: 'الشريط = المنجزة نسبةً إلى الأعلى في الفريق.',
    kpi_sort_done: 'بالمنجزة',
    kpi_sort_median: 'بالوسيط',
    kpi_sort_open: 'بالمفتوحة',
    trend_sub: 'إجمالي الفريق لكل فترة مرفوعة. العمود = المنجزة، وتحته نسبة الإنجاز والوسيط.',
    f4_title: 'المؤشر الرابع — سجل الأنشطة مع العملاء',
    f4_sub: 'ما يسجّله كل مهندس مع العميل في ماي أفاقي («تذكرة») حين لا يأتي العمل كمهمة. من شاشة التذاكر، للفترة، لفريقك.',
    f4_activities: 'الأنشطة',
    f4_customers: 'عملاء مختلفون',
    f4_with_task: 'صارت مهمة',
    f4_by_category: 'الأنشطة حسب التصنيف',
    f4_by_status: 'الأنشطة حسب الحالة',
    f4_none: 'لا أنشطة في ملف هذه الفترة — ملف تقارير أقدم من v7.4، أو لا أنشطة لفريقك فيها.',
    f2_show: 'نقاط الفنيين — عرض',
    def_10: 'المؤشر الرابع يعدّ لكل مهندس تذاكره في الفترة — كل تذكرة نشاط سجّله مع عميل — وعدد العملاء المختلفين، وكم منها صار مهمة، وتوزيعها بالحالة والتصنيف كما في ماي أفاقي. لا تُنقل أوصاف التذاكر ولا أسماء العملاء.',
    assign_h: 'تعيين ما بعد البيع على حسابات جدة',
    assign_sub: 'لوحة تُفتح داخل ماي أفاقي بدخولك: تختار المهندسين، وتزيل من غادر، وترى التغطية، وتجرّب على عشرة، ثم تطبّق على الباقي. لا يُزال أحد إلا من تعلّم عليه بنفسك، ولا يُترك حساب بلا أحد.',
    assign_s1: 'مرة واحدة: اسحب الزر إلى شريط الإشارات.',
    assign_s2: 'افتح ماي أفاقي واضغط الإشارة — تظهر اللوحة فوق الصفحة.',
    assign_s3: 'علّم على المهندسين، ومن غادر علّم عليه في «إزالة من كل الحسابات»، ثم «تجربة على ١٠» وراجع الجدول قبل/بعد.',
    assign_s4: '«تطبيق على الباقي» ثم نزّل السجل. وبعدها صدّر شيت الحسابات لتتأكد.',
    assign_bm: 'لوحة التعيين',
    assign_warn: 'هذه هي الكتابة الوحيدة في البوابة كلها: طلب واحد — تعيين ما بعد البيع — على فرع جدة فقط، ولا يُرسل إلا بضغطتك. الإزالة لمن تعلّم عليه فقط، وتبدأ فارغة في كل فتح. الحارس يرفض أي نسخة تتجاوز ذلك.',
    team_roster_h: 'المناصب ومن يتبع من',
    paste_empty: 'الخانة فارغة. مع إشارة المدير لا تحتاج للصق — اختر الملفين اللذين حفظتهما بزر «اختيار ملف».',
    f4_outside: 'لم يسجّل فريقك أي نشاط مع العملاء في هذه الفترة. في الفترة {n} نشاط، كلها من خارج الفريق: {who}.',
    f4_zero: 'لا أنشطة مع العملاء مسجّلة في هذه الفترة لأي أحد.',
    kpi_strip_note: 'المنجزة: ما أُغلق داخل الفترة، حتى لو أُنشئ قبلها — لذلك قد تزيد على المسندة. المسندة: ما أُنشئ داخل الفترة. نسبة الإنجاز: من المسندة، كم أُغلق. المفتوح الآن: ما زال مفتوحًا لحظة السحب.',
    team_by_myafaqy: 'فريق كما في ماي أفاقي:',
    nav_weights: 'الأوزان',
    weights_sub: 'نقاط كل نوع مهمة وكل نشاط مع العملاء — بمعايير معلنة، ويمكن تعديلها.',
    g_weights_h: 'الأوزان — نقاط كل نوع من العمل',
    g_weights_b: 'لكل نوع مهمة في ماي أفاقي وزن، ولكل تصنيف نشاط مع العملاء وزن. المهمة المنجزة في الفترة تُحسب لصاحبها بوزن نوعها، والنشاط يُحسب بوزن تصنيفه حين يصير «Done». الأوزان أربع فئات معلنة: ١ إجراء إداري سريع، ٢ تعامل مع العميل أو تشخيص، ٣ ربط بجهة خارجية أو تنسيق ميداني، ٥ عمل متعدد المراحل. النقاط تظهر بجانب عدد المنجزة في لوحة المؤشرات ولا تحل محله. يمكن تغيير وزن أي نوع من القائمة؛ التغيير يبقى على هذا الجهاز، ولكي يعتمده الجميع يُنزَّل «weights.json» ويوضع في المستودع. الأوزان تُراجع كل ربع بالبيانات.',
    tier_admin: 'إجراء إداري سريع',
    tier_admin_why: 'بلا تشخيص ولا طرف خارجي: إظهار مركبات، تفعيل، بيانات دخول، مهمة يدوية.',
    tier_customer: 'تعامل مع العميل أو تشخيص',
    tier_customer_why: 'رد على العميل، بلاغ صيانة، فحص كاميرات، مشكلة في التطبيق، استعلام ربط.',
    tier_integration: 'ربط بجهة خارجية أو تنسيق ميداني',
    tier_integration_why: 'وصل، مدينتي، رافد، نقابة، إيقاف بزيارة فني، فحص كونفيجريشن الأجهزة، قراءات CAN.',
    tier_multistage: 'عمل متعدد المراحل',
    tier_multistage_why: 'تدريب عميل، نقل أجهزة بين مركبات — تحضير وتنسيق وتنفيذ ومتابعة.',
    tier_none: 'بلا فئة — الوزن الافتراضي',
    wteam_aftersales: 'ما بعد البيع',
    wteam_rd: 'البحث والتطوير',
    wteam_both: 'الفريقان',
    wteam_other: 'فرق أخرى',
    weights_rules: 'قواعد: النقاط بجانب العدد لا بدله · الفئة والسبب معلنان لكل نوع · المهام المسجّلة للنفس تبقى ظاهرة · مراجعة كل ربع بالبيانات · أي تعديل يُعتمد بملف «weights.json» في المستودع.',
    weights_download: 'تنزيل weights.json',
    weights_upload: 'رفع weights.json',
    weights_reset: 'العودة لأوزان المستودع',
    weights_reviewed: 'آخر مراجعة: {d}',
    weights_loaded: 'وصل ملف الأوزان.',
    weights_tasks_h: 'أوزان أنواع المهام',
    weights_acts_h: 'أوزان أنشطة العملاء',
    w_col_type: 'نوع المهمة',
    w_col_team: 'الفريق',
    w_col_tier: 'الفئة',
    w_col_n: 'عدد آخر فترة',
    w_col_weight: 'الوزن',
    w_col_points: 'النقاط',
    w_col_category: 'تصنيف النشاط',
    weights_seen_note: 'الأعداد من أحدث فترة مرفوعة ({range}). نوع بلا وزن تظهر بجانبه نقطة ويأخذ الوزن الافتراضي.',
    col_points: 'النقاط الموزونة',
    kpi_sort_points: 'بالنقاط',
    help_weights_tasks: 'كل صف نوع مهمة كما يسمّيه ماي أفاقي، وفريقه، وفئته، وكم مرة جاء في آخر فترة، ووزنه، ونقاطه. غيّر الوزن من القائمة فتتغير النقاط في اللوحة فورًا. التغيير على هذا الجهاز حتى يُرفع ملف الأوزان للمستودع.',
    help_weights_acts: 'أنشطة العملاء تُسجَّل في ماي أفاقي من «حسابات ما بعد البيع ← Add Ticket». النشاط يُحسب بوزن تصنيفه حين تصير حالته «Done» فقط.',
    help_points: 'النقاط الموزونة = مجموع (المهام المنجزة في الفترة × وزن نوعها) + (الأنشطة المنجزة مع العملاء × وزن تصنيفها). الأوزان وسببها في صفحة «الأوزان».',
    help_f3: 'من لوحة «ما بعد البيع» في ماي أفاقي لفرع جدة: لكل موظف تذاكره المفتوحة والمعلّقة والمنجزة للفترة. يأتي مع ملف التقارير — إشارة المدير تسحبه تلقائيًّا.',
    help_f4: 'ما يسجّله كل مهندس مع العميل حين لا يأتي العمل كمهمة: عدد الأنشطة، والعملاء المختلفون، وكم صار مهمة، وتوزيعها بالحالة والتصنيف. إن لم يسجّل الفريق شيئًا يقولها صراحةً.',
    help_assign: 'لوحة تُفتح داخل ماي أفاقي بدخولك: تختار مهندسي ما بعد البيع في جدة فيُضافون على كل حسابات جدة، وتعلّم على من غادر فيُزال. تجربة على عشرة أولًا بجدول قبل/بعد، ثم الباقي، ثم سجل. لا يُحذف أحد إلا من تعلّم عليه بنفسك.',
    help_roster: 'اكتب منصب كل شخص واختر من يتبع له. يُحفظ بأرقام ماي أفاقي لا بالأسماء. يظهر المنصب في البطاقات والجداول، ومن يُكتب قائدًا يرى من تحته — بكل المستويات — في «فريقي».',
    install_app: 'تثبيت التطبيق',
    install_done: 'ثُبّت التطبيق — تجده على الشاشة الرئيسية.',
    install_ios: 'على الآيفون والآيباد من سفاري: اضغط زر المشاركة (المربع والسهم) أسفل الشاشة، ثم «إضافة إلى الشاشة الرئيسية»، ثم «إضافة». تفتح البوابة بعدها كتطبيق مستقل وتتحدّث وحدها.',
    install_android: 'على أندرويد من كروم: افتح القائمة (النقاط الثلاث أعلى الشاشة) واختر «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية». تفتح البوابة بعدها كتطبيق مستقل وتتحدّث وحدها.',
    install_desktop: 'على ويندوز من كروم أو إيدج: اضغط أيقونة التثبيت في شريط العنوان (شاشة بسهم)، أو من القائمة «تثبيت بوابة أفاقي». تظهر في قائمة ابدأ وتفتح كنافذة مستقلة وتتحدّث وحدها.',
    updated_to: 'تحدّثت البوابة إلى v{v} — اضغط رقم النسخة أسفل القائمة لترى الجديد.',
    team_scope_n: '{n} في النطاق — هم من يظهرون في اللوحة والمؤشرات',
    team_others: 'آخرون ظهروا في البيانات وليسوا في النطاق ({n}) — لإضافة أحدهم فقط',
    team_others_hint: 'لا يظهر أحد من هؤلاء في أي صفحة. اكتب منصبًا أو اختر قائدًا لمن تريد ضمّه إلى النطاق.',
    f4_outside_n: 'لم يسجّل فريقك أي نشاط مع العملاء في هذه الفترة. في الفترة {n} نشاط، كلها من خارج النطاق.',
    wteam_general: 'أنواع عامة في ماي أفاقي — غير مربوطة بفريق',
    w_types_n: '{n} نوعًا',
    w_from_myafaqy: 'القائمة من ماي أفاقي كما في آخر سحب',
    w_new_type: 'نوع جديد من ماي أفاقي بلا وزن بعد — يأخذ الوزن الافتراضي حتى يُحدَّد',
    w_col_editors: 'من يعدّل',
    w_admin_only: 'المدير فقط',
    w_grant: 'منح',
    w_grant_title: 'من يعدّل وزن «{type}»؟',
    w_grant_hint: 'علّم على من يستطيع تعديل هذا النوع. التعديل يبقى على جهازه حتى يرسل لك ملف الأوزان وتعتمده في المستودع.',
    w_is_admin: 'مدير — كل الأنواع',
    w_you_admin: 'أنت مدير الأوزان: تعدّل كل الأنواع وتمنح غيرك صلاحية على أنواع بعينها من عمود «من يعدّل».',
    w_you_some: 'لديك صلاحية تعديل {n} نوعًا — الباقي للقراءة. نزّل ملف الأوزان بعد تعديلك وأرسله للمدير ليعتمده.',
    w_you_none: 'الأوزان للقراءة فقط لك. من يملك صلاحية التعديل يُحدَّد في ملف الأوزان.',
    w_you_unknown: 'للتعديل اضغط إشارة «مؤشراتي» أولًا حتى تعرف البوابة من أنت — الصلاحيات برقم ماي أفاقي.',
    card_h: 'بطاقة الشهر',
    card_sub: 'نمط شغلك هذا الشهر مقارنة بفريقك — كل جملة معها رقمها. الشهر يُقفل تلقائيًّا بعد انتهائه ولا تتغير بطاقته.',
    card_live: 'جارٍ',
    card_points: 'نقطة موزونة',
    card_vs_prev: '{d} عن الشهر الماضي · {done} مهمة منجزة',
    card_quartile: '{q} · وسيط الفريق {med} نقطة',
    card_rank: 'المرتبة {r} من {n} · وسيط الفريق {med} نقطة',
    card_consistency: 'ثبات أسبوعي {pct}٪ على {w} أسابيع',
    card_radar: 'بصمة العمل: توزيع النقاط على الفئات الأربع مقارنة بالفريق',
    card_me: 'أنا',
    card_strengths: 'أكثر ما تميّزت به',
    card_development: 'ما يستحق التطوير',
    card_suggestions: 'اقتراحات للشهر القادم',
    card_none_yet: 'لا تميّز واضح بعد بالأعداد المتاحة — أقل من خمس مهام في كل نوع.',
    card_none_dev: 'لا إشارات تحتاج نظرة هذا الشهر.',
    card_none_sug: 'لا اقتراح بعد — الأعداد قليلة.',
    card_on_leave: 'في إجازة',
    card_team_h: 'بطاقات فريقك ({n})',
    card_print: 'طباعة البطاقة',
    card_closed: 'أُقفلت بطاقة {m} — لن تتغير بعد الآن.',
    card_arch: 'النمط',
    quartile_1: 'في الربع الأعلى من الفريق',
    quartile_2: 'فوق وسيط الفريق',
    quartile_3: 'تحت وسيط الفريق',
    quartile_4: 'في الربع الأدنى من الفريق',
    arch_field: 'المنفّذ الميداني',
    arch_field_why: 'الربط والتنسيق الميداني ومتعدد المراحل عندك أعلى من الفريق بثلث فأكثر.',
    arch_voice: 'صوت العميل',
    arch_voice_why: 'الرد على العملاء والتشخيص عندك أعلى من الفريق بثلث فأكثر.',
    arch_volume: 'محرّك الحجم',
    arch_volume_why: 'حجم فوق وسيط الفريق وبتركيز على الإجراءات السريعة.',
    arch_balanced: 'المتوازن',
    arch_balanced_why: 'توزيع عملك قريب من توزيع الفريق في الفئات الأربع.',
    arch_early: 'قليل للحكم',
    arch_early_why: 'أقل من عشر نقاط هذا الشهر — لا يُستخلص نمط من هذا القدر.',
    tier_short_admin: 'إداري',
    tier_short_customer: 'عميل',
    tier_short_integration: 'ربط',
    tier_short_multistage: 'مراحل',
    str_spec: 'تخصص في «{type}»: أنجزت {pct}٪ منها في الفريق ({n}) وأنت {my}٪ من حجم الفريق.',
    str_speed: 'أسرع الفريق في «{type}»: وسيطك {me} مقابل {team} للفريق.',
    str_initiative: 'مبادرة: سجّلت {n} نشاطًا مع {c} عميلًا خارج المهام.',
    dev_tierGap: 'فئة «{tier}» عند الفريق {team}٪ من العمل وعندك {mine}٪.',
    dev_slow: '«{type}»: وسيطك {me} مقابل {team} للفريق.',
    dev_self: '{pct}٪ من مهامك سجّلتها لنفسك — يُراجع مع القائد.',
    dev_aging: '{n} مهمة مفتوحة منذ أكثر من {days} أيام.',
    dev_rate: 'نسبة إنجاز ما أُسند إليك هذا الشهر {pct}٪.',
    sug_stretch: 'تمدّد: أسند له «{type}» (فئة {tier}) — الفريق يعمل منها {n} ولم يعمل هو إلا القليل.',
    sug_invest: 'استثمار: أكثر من «{type}» — هو أسرع الفريق فيها ({me} مقابل {team}).',
    sug_balanceUp: 'توازن: {pts} نقطة مقابل وسيط {med} — زِد له مهام سريعة مثل «{type}».',
    sug_balanceDeep: 'توازن: {pts} نقطة مقابل وسيط {med} — أسند له عملًا متعدد المراحل مثل «{type}» بدل الحجم.',
    heat_h: 'خريطة الفريق — {m}',
    heat_sub: 'النقاط الموزونة لكل شخص في كل فئة. الأغمق أكثر. تُظهر أين يتكدّس العمل وأين يفرغ.',
    plan_h: 'خطة الشهر القادم',
    plan_sub: 'بطاقة كل شخص مع اقتراحات التوزيع — بقاعدة معلنة وسبب مكتوب. للمدير والقادة.',
    plan_none: 'لا اقتراحات بعد — الأعداد قليلة.',
    help_card: 'بطاقة الشهر تصف نمط عملك من الأرقام: حجمك مقارنة بوسيط الفريق وربعك، وبصمتك على الفئات الأربع، وأكثر ما تميّزت به (تخصص، سرعة، مبادرة)، وما يستحق التطوير. كل جملة معها رقمها. الشهر المنتهي يُقفل ولا تتغير بطاقته. القادة يرون بطاقات من تحتهم مع اقتراحات التوزيع.',
    help_heat: 'كل صف شخص وكل عمود فئة؛ الرقم نقاطه الموزونة فيها والخلفية بقدرها. نظرة واحدة تقول أين يتركز الفريق وأين الفجوات.',
    help_plan: 'ثلاث قواعد تُولّد الاقتراحات: تمدّد (نوع من فئة أعلى يعمله الفريق)، استثمار (النوع الذي هو أسرع الفريق فيه)، توازن (تحت الوسيط: مهام سريعة؛ في الربع الأعلى: عمل متعدد المراحل). كل اقتراح معه سببه.',
    card_team_legend: 'الفريق',
    week_h: 'الأسبوع في لمحة',
    week_total: 'النقاط الموزونة: {p} هذا الأسبوع مقابل {q} الأسبوع الماضي',
    week_total_l: 'نقطة في آخر ٧ أيام · {q} في السبعة قبلها ({d})',
    week_movers: 'الأكثر تقدمًا',
    week_drops: 'نزول حاد',
    week_aging: 'مفتوح قديم',
    week_on_leave: 'في إجازة — لا يُحسب نزولًا: {who}',
    week_share: 'مشاركة',
    help_week: 'آخر سبعة أيام مقابل السبعة قبلها لمن في النطاق: من تقدّم أكثر، ومن نزل ٤٠٪ فأكثر (من عشر نقاط فأكثر)، ومن عنده مهام مفتوحة أقدم من سبعة أيام. من في إجازة لا يُعدّ نزولًا. «مشاركة» ترسل الملخص نصًّا عبر واتساب أو تيمز أو تنسخه.',
    f5_title: 'المؤشر الخامس — تغطية الحسابات',
    f5_sub: 'حسابات جدة: {n} حسابًا و{d} جهازًا · {u} حسابًا بلا أحد من النطاق · {z} حسابًا بلا أجهزة متصلة.',
    f5_accounts: 'الحسابات',
    f5_devices: 'الأجهزة',
    f5_solo: 'وحده عليها',
    f5_touched: 'لمسها في الفترة',
    f5_none: 'لا حسابات في ملف هذه الفترة — اسحب بإشارة المدير من v8.5.',
    help_f5: 'من شاشة «حسابات ما بعد البيع» في ماي أفاقي لفرع جدة: لكل مهندس كم حسابًا عليه، وكم جهازًا، وفي كم حساب هو وحده، وكم حسابًا لمسه في الفترة بنشاط مسجّل. يُحسب بأرقام الحسابات فقط، بلا أسماء العملاء.',
    meet_open: '📝 اللقاء الشهري',
    meet_edit: '📝 تعديل اللقاء',
    meet_title: 'لقاء {name} — {m}',
    meet_private: 'يُحفظ على هذا الجهاز فقط، ولا يدخل المستودع أبدًا. انقله لجهاز آخر بـ«تصدير اللقاءات».',
    meet_note: 'ملاحظات اللقاء',
    meet_note_ph: 'ما دار في اللقاء، وما لاحظته في البطاقة…',
    meet_agreed: 'ما اتفقنا عليه للشهر القادم',
    meet_agreed_ph: 'مثال: يأخذ ربط وصل أكثر، ويغلق المفتوح القديم.',
    meet_goals: 'أهداف الشهر',
    meet_add_goal: '+ هدف',
    meet_save: 'حفظ',
    meet_saved: 'حُفظ اللقاء.',
    meet_prev_agreed: 'اتفقنا الشهر الماضي:',
    meet_done: 'نُفّذ',
    meet_export: 'تصدير اللقاءات',
    meet_import: 'استيراد اللقاءات',
    meet_imported: 'وصلت اللقاءات.',
    goal_points: 'النقاط الموزونة',
    path_h: 'مسار النمط عبر الأشهر',
    path_soon: 'يظهر المسار من الشهر المقفول الثاني — كل شهر ينتهي يُضاف وحده.',
    help_path: 'لكل شهر مقفول: النمط والنقاط والربع. يُظهر كيف يتحرك عمل كل شخص — من «محرّك الحجم» إلى «المنفّذ الميداني» مثلًا — وهو ما يُقال في التقييم السنوي.',
  },
  en: {
    brand: 'Afaqy', portal: 'Technical team portal — Jeddah', nav_data: 'Data', nav_kpi: 'KPIs',
    tools_title: 'Team tools', tools_sub: 'Each tool works inside the portal, with its usual sign-in.',
    primary: 'Core tools', systems: 'Company systems', more: 'More tools', soon: 'Coming soon',
    open: 'Open',
    data_title: 'KPI data', data_sub: 'Data is pulled from myafaqy by Claude in Chrome, then uploaded here. It stays on this device only.',
    step1: 'Choose the period', step2: 'Copy the prompt to Claude in Chrome', step3: 'Upload the result',
    block_size: 'Period length', blocks_back: 'Number of periods',
    m3: 'Quarter', m6: 'Half year', m12: 'Year',
    block_partial: 'in progress',
    copy_prompt: 'Copy prompt', copied: 'Prompt copied — paste it into Claude in Chrome with myafaqy open',
    step2_hint: 'Open myafaqy in Chrome and sign in, then open Claude in Chrome and paste the prompt. One prompt per period.',
    step3_hint: 'Paste Claude in Chrome’s reply as it is, or choose the file you saved. Several parts of the same period can be uploaded.',
    paste_here: 'Paste Claude in Chrome’s reply here', load_text: 'Read text', choose_file: 'Choose file',
    datasets: 'Uploaded data', none_yet: 'No data uploaded yet. Start with step one.',
    tasks_n: '{n} tasks', complete: 'Complete', incomplete: 'Incomplete: {got} of {want}',
    remove: 'Remove', export_all: 'Export a backup', import_all: 'Restore a backup',
    sample: 'Load sample data', sample_note: 'Sample data — not from myafaqy',
    loaded: '{n} tasks loaded for {range}',
    err_json: 'No valid data found in the text. Paste Claude in Chrome’s whole reply as it is.',
    err_schema: 'This data is not in the required format ({schema}). Use the prompt produced by this page.',
    err_range: 'The period in the file is not valid.',
    err_tasks: 'The file has no task list.',
    warn_rows: '{n} rows with missing data were skipped.',
    kpi_title: 'KPIs', kpi_sub: 'Factor 1 — task load and completion per engineer, from myafaqy tasks.',
    period: 'Period', no_data: 'No data yet. Upload data from the Data page.',
    col_person: 'Employee', col_assigned: 'Assigned', col_done: 'Completed', col_rate: 'Completion rate',
    col_avg: 'Average time to complete', col_median: 'Median', col_open: 'Open now', col_created: 'Created',
    col_email: 'From email', col_cancelled: 'Cancelled',
    hours: '{n} h', days: '{n} d',
    team: 'Team total', group_bucket: 'Assigned to a group, not completed',
    trend: 'Comparison across periods', definitions: 'How it is calculated',
    def_1: 'A task counts for its assignee in myafaqy.',
    def_2: '“Assigned” are the tasks created within the period; “completed” are those closed within it, even if created earlier — the same count myafaqy gives for its completion-date filter.',
    def_3: 'Completion rate: of the tasks created in the period, how many were done by the time of extraction, cancelled ones excluded. Time runs from creation to closing in calendar hours, over the tasks completed in the period; the median is shown because one long task distorts the average.',
    def_4: '“From email” are myafaqy’s “Email Customer Activity” tasks — not everything the system account created, because it also creates the work-order tasks.',
    data_incomplete_warn: 'This period’s data is incomplete — the figures are lower than reality.',
    theme: 'Theme', lang_next: 'اردو',
    nav_guide: 'Guide',
    whats_new: 'What is new in this version',
    update_ready: 'A newer version is available — press to reload',
    close: 'Close',
    g_title: 'User guide',
    g_version: 'This guide is for version v{v} — {date}',
    g_print: 'Print the guide',
    g_tools_h: 'Tools',
    g_tools_b: 'The side menu holds everything: “Home”, then the “Modules” group — the sensor displacement tool, the API helper, canval and Afaqy readers — then the “KPIs” group with the Data page and the KPI board, then “Company systems”, then “Guide”. A group opens and folds when you press its name, and opens by itself when you are in it. Press a module and it opens under the top bar, staying open as it was while you move to another; “Open in its own tab” in the bar opens it on its own. Each tool asks for its usual sign-in. The company systems — myafaqy, Afaqy PRO and email — open in a new tab, because they do not allow being shown inside another page. Language and dark mode are at the foot of the menu; on a phone the menu opens from the button at the top of the screen.',
    g_data_h: 'KPI data',
    g_data_b: 'Each period has two prompts: “Copy the prompt” pulls the period’s tasks for Factor 1, and “Copy the reports prompt” pulls technician points and after-sales tickets for Factors 2 and 3. Each prompt names the requests it may make and forbids all others, so nothing changes in myafaqy. Run the prompt in Claude in Chrome while signed in to myafaqy; it saves the result as a file on your computer, which you upload here with “Choose file” — the same box takes both kinds. The portal does not read myafaqy itself because its server refuses requests from another address.',
    g_parts_h: 'Long replies and incomplete periods',
    g_parts_b: 'If Claude in Chrome splits its reply into parts, upload them all; they merge by task id. A period stays “incomplete” until its task count equals the total myafaqy itself reported, and its figures carry a warning.',
    g_kpi_h: 'KPIs',
    g_kpi_b: 'Choose the period from the list. Factor 1 shows, per employee, what was assigned, what was completed, the completion rate, the time to complete and what is open now, with bars and ordering by completed, median or open, then the team total and the donuts. Below it come after-sales tickets per employee, then Factor 4 — the activity log: what each engineer logged with customers in the period, the distinct customers, how many became tasks, and the spread by status and category — once the reports file for the same period is uploaded. Technician points are tucked at the bottom for whoever needs them. The team counted is set automatically from Jeddah’s technical teams and can be changed, and with more than one period uploaded the comparison appears as columns. How each figure is calculated is written at the bottom.',
    g_privacy_h: 'Where the data is kept',
    g_privacy_b: 'On this device and in this browser only; nothing is sent anywhere. To move it to another device or keep a copy, use “Export a backup” then “Restore a backup”. Clearing the browser’s data clears it.',
    def_5: '“Open now” is a snapshot at the moment of extraction, whatever the task’s creation date.',
    team_title: 'The team counted in the KPIs',
    team_count: '{n} of {total}',
    team_jeddah: 'Jeddah branch teams',
    team_all: 'Everyone',
    team_hint: 'Set automatically from the myafaqy teams registered to the Jeddah branch, and can be changed. Kept on this device.',
    open_tab: 'Open in its own tab',
    module_loading: 'Opening the tool…',
    in_portal: 'Works inside the portal',
    systems_note: 'Open in a new tab — the company systems do not allow being shown inside another page.',
    side_modules: 'Modules',
    menu: 'Menu',
    nav_home: 'Home',
    kpi_board: 'KPI board',
    lang_label: 'Language',
    theme_dark: 'Dark mode',
    theme_light: 'Light mode',
    nav_me: 'My KPIs',
    me_title: 'My KPIs',
    me_sub: 'Your profile: your work, your figures and how they compare, and your team if myafaqy places anyone below you. From myafaqy with your own sign-in; it stays on your device.',
    me_how_h: 'One-time setup',
    me_bm: 'My KPIs from myafaqy',
    me_step1: 'On a computer: drag this button onto the browser’s bookmarks bar.',
    me_drag: 'Drag the button onto the bookmarks bar, then press it from inside myafaqy.',
    me_step2: 'Then: open myafaqy and sign in, and press the bookmark. Your tasks are read and this page opens with your KPIs. To refresh, press it again.',
    me_copy: 'Copy the bookmark code',
    me_copied: 'Code copied',
    me_copy_fail: 'Could not copy — long-press the button and copy the link',
    me_phones: 'On a phone',
    me_android: 'Android (Chrome): copy the bookmark code, bookmark any page, then edit it: name it “My KPIs” and paste the code as its address. Then, inside myafaqy, type “My KPIs” in the address bar and pick the bookmark from the suggestions — tapping it in the bookmarks list does not run it.',
    me_ios: 'iPhone (Safari): copy the bookmark code, bookmark any page, then edit its address by pasting the code. Then, inside myafaqy, open your bookmarks and tap it.',
    me_privacy: 'What is read: your own tasks only — their number, when each was created and closed, its state and its type. Not titles, not customers, not your sign-in. Nothing is sent to any server, and nobody but you sees your KPIs.',
    me_wait: 'Waiting for your tasks from myafaqy…',
    me_loaded: 'Your KPIs arrived: {n} tasks',
    me_q: 'Quarter',
    me_partial: 'partial',
    me_refresh_h: 'Refresh and setup',
    me_refresh: 'To refresh: open myafaqy and press the bookmark again.',
    me_forget: 'Remove my KPIs from this device',
    g_me_h: 'My KPIs',
    g_me_b: 'The “My KPIs” page is your own profile. Once: drag the “My KPIs” button onto the browser’s bookmarks bar. Then whenever you want: open myafaqy with your account and press the bookmark — it reads your work and opens the portal on it. You find your details and teams, then “My open work now” with your tasks’ titles and age, then “This month against last month” over the same days with arrows showing where you improved and where you slipped, then your comparison with the team average without names, then your history over the last twelve months. If myafaqy places people below you in its hierarchy — a team leader or a manager — a “My team” section shows each of them with their figures. The portal shows you exactly what myafaqy shows you, nothing more. Everything stays on your device; the sign-in token, customer names, the titles of others’ tasks and of completed tasks are never carried, and “Remove my KPIs” erases it from the device.',
    col_self: 'Self-logged',
    def_6: '“Self-logged”, among the assigned: tasks the employee opened and assigned to himself, not from email — in this team, the requests that arrive by WhatsApp or by phone. myafaqy records who created a task, not its channel, so WhatsApp and calls cannot be separated. Read it with the other columns: it shows where the load came from, not the quality of the work.',
    nav_pro: 'Afaqy PRO',
    pro_sub: 'Your account’s units in Afaqy PRO, inside the portal — read only.',
    pro_signin_h: 'Sign in with your Afaqy PRO account',
    pro_user: 'Username',
    pro_pass: 'Password',
    pro_signin: 'Sign in',
    pro_signing: 'Signing in…',
    pro_bad: 'The username or password is not correct.',
    pro_2fa: 'This account uses a verification code, and Afaqy PRO does not allow completing a code sign-in from outside its own site. Use “Open the Afaqy PRO site”.',
    pro_refused: 'Afaqy PRO refused the sign-in: {why}',
    pro_net: 'Could not reach Afaqy PRO — check the connection and try again.',
    pro_expired: 'The Afaqy PRO session ended — sign in again.',
    pro_privacy: 'The password is used once to open a session and is not saved anywhere. The session lives in this tab only and ends when you close it. Nothing is written to Afaqy PRO.',
    pro_site: 'Open the Afaqy PRO site',
    pro_loading: 'Loading units: {n} of {total}',
    pro_search: 'Search by name or IMEI',
    pro_refresh: 'Refresh',
    pro_out: 'Sign out',
    pro_total: 'All units',
    pro_live: 'Reported within an hour',
    pro_day: 'Within 24 hours',
    pro_stale: 'Older than 24 hours or never',
    pro_col_name: 'Unit',
    pro_col_id: 'IMEI',
    pro_col_last: 'Last report (Saudi time)',
    pro_col_state: 'State',
    pro_col_where: 'Location',
    pro_st_live: 'Live',
    pro_st_day: 'Today',
    pro_st_stale: 'Late',
    pro_st_never: 'Never',
    pro_map: 'On the map',
    pro_none: 'No units match the search.',
    pro_more: 'And {n} more units — narrow the search to see them.',
    g_pro_h: 'Afaqy PRO',
    g_pro_b: 'The “Afaqy PRO” page shows your account’s units inside the portal: name, IMEI, last report in Saudi time, state and location on the map; pressing a unit shows all its data. Sign in with your username and password; the password is not saved, the session ends when the tab closes, and nothing is written to Afaqy PRO. Accounts that use a verification code cannot complete the sign-in here — Afaqy PRO forbids it from outside its own site — so they open the site itself from the button. myafaqy cannot be shown inside the portal and does not let it read its data, so it opens in a new tab.',
    copy_reports: 'Copy the reports prompt',
    reports_loaded: 'Reports for {range} arrived: {n} technician-point rows and {a} after-sales people',
    reports_meta: 'Reports: {m} months of technician points, {a} after-sales people',
    reports_none: 'No reports for this period yet. On the Data page copy the “reports prompt” for the same period, run it in Claude in Chrome, and upload the file.',
    col_rd: 'R&D',
    f2_title: 'Factor 2 — technician points',
    f2_sub: 'From myafaqy’s “Technicians Points” report for the Jeddah branch, summed over the months: {months}.',
    f2_none: 'No field work recorded in this period.',
    f2_name: 'Technician',
    f2_installed: 'Devices installed',
    f2_maint: 'Devices maintained',
    f2_fix: 'Repairs',
    f2_reservice: 'Re-service',
    f2_stop: 'Stop service',
    f2_group: 'Group installs',
    f2_extra: 'Additional work',
    f2_viol: 'Violations',
    f2_points: 'Points',
    f3_title: 'Factor 3 — after-sales tickets',
    f3_sub: 'From myafaqy’s “After Sales Board” for the Jeddah branch, for tickets created in the period.',
    f3_none: 'No tickets in this period.',
    f3_name: 'Employee',
    f3_open: 'Open',
    f3_pending: 'Pending',
    f3_done: 'Done',
    f3_total: 'Total',
    def_7: '“R&D”: of the tasks completed in the period, those in myafaqy’s “R&D Tasks” queue. It shows when the period’s file carries that queue’s list.',
    def_8: 'Factor 2 carries myafaqy’s “Technicians Points” report as myafaqy computes it, month by month for the Jeddah branch, and sums the period’s months per technician. Bonus values, phone numbers and evaluations are not carried.',
    def_9: 'Factor 3 carries the Jeddah branch’s “After Sales Board” as it is: per employee, their open, pending and done tickets, among tickets created in the period.',
    me_open_h: 'My open work now ({n})',
    me_open_none: 'You have no open tasks right now.',
    me_untitled: 'Untitled task',
    mgr_bm: 'Pull all team data {from} → {to}',
    mgr_bm_intro: 'For the manager: one bookmark pulls all of the period’s data — tasks and reports together — from inside myafaqy in one press, and saves two files to upload below. An alternative to copying the two prompts. Drag the button onto the bookmarks bar once.',
    g_mgr_h: 'The manager bookmark — everything in one press',
    g_mgr_b: 'On the Data page, one manager bookmark reads from inside myafaqy everything the two prompts read: all of the period’s tasks, the R&D queue, technician points and after-sales tickets — and saves them as two files (tasks and reports) to upload in the portal. It runs with the manager’s own sign-in, read-only, through the same six allowed requests, and the sign-in token never leaves the myafaqy page. It is a faster alternative to copying the two prompts and running them in Claude in Chrome; the Claude in Chrome way stays available for whoever prefers it.',
    me_updated: 'Last updated {date}',
    me_scope: 'myafaqy shows you the work of {n} people',
    me_month_h: 'This month against last month — up to day {d}',
    me_month_sub: 'From {a} to {b}, against the same days of last month ({c} to {d}) — a fair comparison.',
    me_last_month: 'Last month',
    me_avg_h: 'Against the team average',
    me_avg_sub: 'The average of {n} people with work this month, without names.',
    me_avg_team: 'Team average',
    me_avg_none: 'myafaqy shows you only your own work, so no team average is computed here.',
    me_team_h: 'My team — {n} people',
    me_team_sub: 'The people myafaqy places below you in its hierarchy, with this month’s figures so far.',
    me_vs_last: 'Done against last month',
    me_history_h: 'My history — the last twelve months by quarter',
    me_open_more: 'Show {n} more tasks',
    nav_team: 'Team',
    team_sub: 'Here the team’s positions and who reports to whom are set — by myafaqy ids, so no names in the file. Names arrive from myafaqy with the bookmark.',
    team_note: 'What you write here stays on this device. For the whole team to see it, download “team.json” and put it in the repository — it holds ids and positions only, no names.',
    team_download: 'Download team.json',
    team_upload: 'Upload team.json',
    team_loaded: 'The team file arrived: {n} people',
    team_filled: '{n} of {m} have a position or a leader',
    team_col_name: 'Name — from myafaqy',
    team_col_id: 'myafaqy id',
    team_col_pos: 'Position',
    team_col_leader: 'Reports to',
    team_no_leader: '— no leader —',
    team_pos_ph: 'e.g. After-sales engineer',
    team_none: 'No people yet — upload data from the Data page or press the “My KPIs” bookmark.',
    me_leader: 'Reports to {name}',
    me_sources_h: 'Where this month’s work came from',
    src_email: 'From e-mail',
    src_self: 'Self-logged',
    src_other: 'Assigned by others',
    kpi_dist_h: 'Completed work across the team',
    kpi_src_h: 'Sources of completed tasks',
    kpi_tickets_h: 'After-sales tickets',
    others: 'Others',
    g_team_h: 'Team — positions and who reports to whom',
    g_team_b: 'The “Team” page has two parts. First, “Assign after-sales to Jeddah accounts”: a bookmark that opens, inside myafaqy with your sign-in, a panel where you choose the engineers, see the coverage of Jeddah accounts, pilot on ten with a before/after table, then apply to the rest and download the log — add only, nobody already there is removed, Jeddah branch only, and it is the one write in the whole portal. Second, “Positions and who reports to whom”: the manager writes each person’s position and leader next to the name as it comes from myafaqy; it is saved by myafaqy ids, not names, stays on the device, and for the whole team to see it, “team.json” is downloaded and placed in the repository. The position shows on the “My KPIs” card, the tables and the board, and “reports to” lets a leader see their people in “My team”.',
    me_period_month: 'This month',
    me_period_quarter: 'This quarter',
    me_period_half: 'Last 6 months',
    me_cmp_h_month: 'This month against last month — up to day {d}',
    me_cmp_h_quarter: 'This quarter against last quarter — the first {d} days',
    me_cmp_h_half: 'The last six months against the six before',
    me_last_period: 'Previous period',
    me_update: 'Update from myafaqy',
    me_refresh_hint: 'Open myafaqy and press the bookmark there — the portal updates by itself.',
    me_setup_again: 'Bookmark setup',
    alert_attention: 'Needs a look: {name} — {why}.',
    alert_improved: 'Clear improvement: {name} — ‎+{n}‎ completed over the previous period on the same days.',
    why_rate: 'completion rate {r}',
    why_open: '{n} open tasks',
    why_median: 'median {h} — more than twice the team’s',
    kpi_table_sub: 'The bar is completed work relative to the team’s highest.',
    kpi_sort_done: 'By completed',
    kpi_sort_median: 'By median',
    kpi_sort_open: 'By open',
    trend_sub: 'The team total per uploaded period. The column is completed work; below it, the completion rate and the median.',
    f4_title: 'Factor 4 — the activity log with customers',
    f4_sub: 'What each engineer logs with a customer in myafaqy (a “ticket”) when the work does not arrive as a task. From the Tickets screen, for the period, for your team.',
    f4_activities: 'Activities',
    f4_customers: 'Distinct customers',
    f4_with_task: 'Became a task',
    f4_by_category: 'Activities by category',
    f4_by_status: 'Activities by status',
    f4_none: 'No activities in this period’s file — a reports file older than v7.4, or none by your team.',
    f2_show: 'Technician points — show',
    def_10: 'Factor 4 counts, per engineer, their tickets in the period — each an activity logged with a customer — the distinct customers, how many became tasks, and their spread by status and category as in myafaqy. Ticket descriptions and customer names are not carried.',
    assign_h: 'Assign after-sales to Jeddah accounts',
    assign_sub: 'A panel that opens inside myafaqy with your sign-in: choose the engineers, remove whoever left, see the coverage, pilot on ten, then apply to the rest. Nobody is removed unless you tick them yourself, and no account is left with nobody.',
    assign_s1: 'Once: drag the button onto the bookmarks bar.',
    assign_s2: 'Open myafaqy and press the bookmark — the panel appears over the page.',
    assign_s3: 'Tick the engineers, tick whoever left under “Remove from every account”, then “Pilot on 10” and review the before/after table.',
    assign_s4: '“Apply to the rest”, then download the log. Then export the accounts sheet to confirm.',
    assign_bm: 'Assignment panel',
    assign_warn: 'This is the one write in the whole portal: a single request — assign after-sales — on the Jeddah branch only, sent only by your press. Removal is only for whoever you tick, and starts empty on every open. The guard refuses any version that goes beyond it.',
    team_roster_h: 'Positions and who reports to whom',
    paste_empty: 'The box is empty. With the manager bookmark there is nothing to paste — choose the two files it saved with “Choose file”.',
    f4_outside: 'Your team logged no activity with customers in this period. The period has {n} activities, all from outside the team: {who}.',
    f4_zero: 'No activities with customers were logged in this period by anyone.',
    kpi_strip_note: 'Completed: closed inside the period, even if created before it — so it can exceed Assigned. Assigned: created inside the period. Completion rate: of the assigned, how many were closed. Open now: still open at the moment of the pull.',
    team_by_myafaqy: 'A team as myafaqy lists it:',
    nav_weights: 'Weights',
    weights_sub: 'Points for each task type and each activity with customers — by stated criteria, and adjustable.',
    g_weights_h: 'Weights — points for each kind of work',
    g_weights_b: 'Each task type in myafaqy has a weight, and so does each category of activity with customers. A task completed in the period counts for its assignee at its type’s weight; an activity counts at its category’s weight once it is “Done”. The weights fall into four stated tiers: 1 a quick administrative action, 2 dealing with the customer or diagnosing, 3 integration with an outside party or field coordination, 5 multi-stage work. The points show beside the completed count on the KPI board and never replace it. Any type’s weight can be changed from the list; the change stays on this device, and for everyone to use it, “weights.json” is downloaded and placed in the repository. The weights are reviewed every quarter against the data.',
    tier_admin: 'Quick administrative action',
    tier_admin_why: 'No diagnosis and no outside party: showing units, activation, sign-in details, a manual task.',
    tier_customer: 'Dealing with the customer or diagnosing',
    tier_customer_why: 'Replying to the customer, a maintenance report, checking cameras, an app issue, an integration inquiry.',
    tier_integration: 'Integration with an outside party or field coordination',
    tier_integration_why: 'WASL, Madinty, Rafed, Naqaba, a stop with a technician visit, checking device configuration, CAN readings.',
    tier_multistage: 'Multi-stage work',
    tier_multistage_why: 'Customer training, moving devices between vehicles — preparation, coordination, delivery and follow-up.',
    tier_none: 'No tier — the default weight',
    wteam_aftersales: 'After-sales',
    wteam_rd: 'R&D',
    wteam_both: 'Both teams',
    wteam_other: 'Other teams',
    weights_rules: 'Rules: points beside the count, never instead of it · each type’s tier and reason are stated · self-logged tasks stay visible · a review every quarter against the data · any change is adopted through “weights.json” in the repository.',
    weights_download: 'Download weights.json',
    weights_upload: 'Upload weights.json',
    weights_reset: 'Back to the repository’s weights',
    weights_reviewed: 'Last reviewed: {d}',
    weights_loaded: 'The weights file arrived.',
    weights_tasks_h: 'Weights of task types',
    weights_acts_h: 'Weights of customer activities',
    w_col_type: 'Task type',
    w_col_team: 'Team',
    w_col_tier: 'Tier',
    w_col_n: 'Count, latest period',
    w_col_weight: 'Weight',
    w_col_points: 'Points',
    w_col_category: 'Activity category',
    weights_seen_note: 'Counts are from the latest uploaded period ({range}). A type without a weight shows a dot and takes the default weight.',
    col_points: 'Weighted points',
    kpi_sort_points: 'By points',
    help_weights_tasks: 'Each row is a task type as myafaqy names it, its team, its tier, how often it came in the latest period, its weight and its points. Change the weight from the list and the board’s points change at once. The change stays on this device until the weights file goes into the repository.',
    help_weights_acts: 'Customer activities are logged in myafaqy from “After Sales Accounts → Add Ticket”. An activity counts at its category’s weight only once its status is “Done”.',
    help_points: 'Weighted points = the sum of (tasks completed in the period × their type’s weight) + (activities with customers done × their category’s weight). The weights and their reasons are on the “Weights” page.',
    help_f3: 'From myafaqy’s “After Sales Board” for the Jeddah branch: each employee’s open, pending and done tickets for the period. It comes with the reports file — the manager bookmark pulls it automatically.',
    help_f4: 'What each engineer logs with a customer when the work does not come as a task: the number of activities, the distinct customers, how many became tasks, and their spread by status and category. If the team logged nothing, it says so plainly.',
    help_assign: 'A panel that opens inside myafaqy with your sign-in: choose Jeddah’s after-sales engineers and they are added to every Jeddah account; tick whoever left and they are removed. A pilot on ten first with a before/after table, then the rest, then a log. Nobody is removed unless you tick them yourself.',
    help_roster: 'Write each person’s position and choose who they report to. It is saved by myafaqy ids, not names. The position shows on cards and tables, and whoever is named a leader sees everyone below them — at every level — in “My team”.',
    install_app: 'Install the app',
    install_done: 'The app is installed — you will find it on your home screen.',
    install_ios: 'On iPhone and iPad, from Safari: press the Share button (the square with the arrow) at the bottom, then “Add to Home Screen”, then “Add”. The portal then opens as its own app and updates itself.',
    install_android: 'On Android, from Chrome: open the menu (the three dots at the top) and choose “Install app” or “Add to Home screen”. The portal then opens as its own app and updates itself.',
    install_desktop: 'On Windows, from Chrome or Edge: press the install icon in the address bar (a screen with an arrow), or from the menu “Install the Afaqy portal”. It appears in the Start menu, opens in its own window and updates itself.',
    updated_to: 'The portal updated itself to v{v} — press the version number at the bottom of the menu to see what is new.',
    team_scope_n: '{n} in scope — the only people shown on the board and the KPIs',
    team_others: 'Others seen in the data and not in scope ({n}) — only to add someone',
    team_others_hint: 'None of these appears on any page. Write a position or choose a leader for whoever you want to bring into scope.',
    f4_outside_n: 'Your team logged no activity with customers in this period. The period has {n} activities, all from outside the scope.',
    wteam_general: 'General myafaqy types — not linked to a team',
    w_types_n: '{n} types',
    w_from_myafaqy: 'the list from myafaqy as of the latest pull',
    w_new_type: 'A new type from myafaqy with no weight yet — it takes the default until one is set',
    w_col_editors: 'Who may edit',
    w_admin_only: 'The admin only',
    w_grant: 'Grant',
    w_grant_title: 'Who may edit the weight of “{type}”?',
    w_grant_hint: 'Tick whoever may edit this type. Their change stays on their device until they send you the weights file and you adopt it in the repository.',
    w_is_admin: 'admin — every type',
    w_you_admin: 'You are the weights admin: you edit every type and grant others rights on specific types from the “Who may edit” column.',
    w_you_some: 'You may edit {n} types — the rest are read-only. Download the weights file after your change and send it to the manager to adopt.',
    w_you_none: 'The weights are read-only for you. Who may edit is set in the weights file.',
    w_you_unknown: 'To edit, press the “My KPIs” bookmark first so the portal knows who you are — rights go by myafaqy id.',
    card_h: 'The month’s card',
    card_sub: 'Your work pattern this month against your team — every line with its number. A month closes by itself once over, and its card never changes.',
    card_live: 'in progress',
    card_points: 'weighted points',
    card_vs_prev: '{d} vs last month · {done} tasks completed',
    card_quartile: '{q} · team median {med} points',
    card_rank: 'Rank {r} of {n} · team median {med} points',
    card_consistency: 'Weekly consistency {pct}% over {w} weeks',
    card_radar: 'Work fingerprint: points by the four tiers against the team',
    card_me: 'me',
    card_strengths: 'Where you stood out',
    card_development: 'What deserves development',
    card_suggestions: 'Suggestions for next month',
    card_none_yet: 'No clear strength yet at these numbers — fewer than five tasks per type.',
    card_none_dev: 'No signals needing a look this month.',
    card_none_sug: 'No suggestion yet — the numbers are small.',
    card_on_leave: 'On leave',
    card_team_h: 'Your team’s cards ({n})',
    card_print: 'Print the card',
    card_closed: 'The card for {m} is closed — it will not change again.',
    card_arch: 'Pattern',
    quartile_1: 'In the team’s top quarter',
    quartile_2: 'Above the team median',
    quartile_3: 'Below the team median',
    quartile_4: 'In the team’s bottom quarter',
    arch_field: 'The field executor',
    arch_field_why: 'Integration, field coordination and multi-stage work are a third or more above the team’s share.',
    arch_voice: 'The customer’s voice',
    arch_voice_why: 'Dealing with customers and diagnosing is a third or more above the team’s share.',
    arch_volume: 'The volume engine',
    arch_volume_why: 'Volume above the team median, concentrated on quick actions.',
    arch_balanced: 'The balanced one',
    arch_balanced_why: 'Your spread across the four tiers is close to the team’s.',
    arch_early: 'Too little to judge',
    arch_early_why: 'Fewer than ten points this month — no pattern is drawn from that little.',
    tier_short_admin: 'Admin',
    tier_short_customer: 'Customer',
    tier_short_integration: 'Integration',
    tier_short_multistage: 'Multi-stage',
    str_spec: 'Specialist in “{type}”: you completed {pct}% of the team’s ({n}) while being {my}% of its volume.',
    str_speed: 'Fastest in the team on “{type}”: your median {me} against the team’s {team}.',
    str_initiative: 'Initiative: you logged {n} activities with {c} customers outside tasks.',
    dev_tierGap: 'The “{tier}” tier is {team}% of the team’s work and {mine}% of yours.',
    dev_slow: '“{type}”: your median {me} against the team’s {team}.',
    dev_self: '{pct}% of your tasks were self-logged — to review with the leader.',
    dev_aging: '{n} tasks open for more than {days} days.',
    dev_rate: 'Completion of what was assigned to you this month: {pct}%.',
    sug_stretch: 'Stretch: assign “{type}” ({tier} tier) — the team did {n} of these and this person few.',
    sug_invest: 'Invest: more “{type}” — the team’s fastest on it ({me} against {team}).',
    sug_balanceUp: 'Balance: {pts} points against a median of {med} — add quick tasks such as “{type}”.',
    sug_balanceDeep: 'Balance: {pts} points against a median of {med} — assign multi-stage work such as “{type}” instead of volume.',
    heat_h: 'Team map — {m}',
    heat_sub: 'Weighted points per person per tier. Darker is more. It shows where work piles up and where it is empty.',
    plan_h: 'Next month’s plan',
    plan_sub: 'Each person’s card with assignment suggestions — by a stated rule with a written reason. For the manager and leaders.',
    plan_none: 'No suggestions yet — the numbers are small.',
    help_card: 'The month’s card describes your work pattern from the numbers: your volume against the team median and your quarter, your fingerprint across the four tiers, where you stood out (specialisation, speed, initiative) and what deserves development. Every line carries its number. A finished month is closed and its card never changes. Leaders see their people’s cards with assignment suggestions.',
    help_heat: 'Each row is a person and each column a tier; the number is their weighted points there and the shade its size. One look says where the team concentrates and where the gaps are.',
    help_plan: 'Three rules generate the suggestions: stretch (a type from a higher tier the team works), invest (the type this person is fastest at), balance (below median: quick tasks; top quarter: multi-stage work). Each suggestion carries its reason.',
    card_team_legend: 'team',
    week_h: 'The week at a glance',
    week_total: 'Weighted points: {p} this week against {q} last week',
    week_total_l: 'points in the last 7 days · {q} in the 7 before ({d})',
    week_movers: 'Biggest gains',
    week_drops: 'Sharp drops',
    week_aging: 'Work left open too long',
    week_on_leave: 'On leave — not counted as a drop: {who}',
    week_share: 'Share',
    help_week: 'The last seven days against the seven before, for the scope: who gained most, who dropped 40% or more (from ten points or more), and who has tasks open longer than seven days. Anyone on leave is not counted as a drop. “Share” sends the summary as text via WhatsApp or Teams, or copies it.',
    f5_title: 'Factor 5 — account coverage',
    f5_sub: 'Jeddah accounts: {n} accounts and {d} devices · {u} accounts with nobody from the scope · {z} accounts with no connected device.',
    f5_accounts: 'Accounts',
    f5_devices: 'Devices',
    f5_solo: 'Sole engineer',
    f5_touched: 'Touched in the period',
    f5_none: 'No accounts in this period’s file — pull with the manager bookmark from v8.5.',
    help_f5: 'From myafaqy’s “After Sales Accounts” screen for the Jeddah branch: for each engineer, how many accounts carry them, how many devices, on how many they are alone, and how many they touched in the period with a logged activity. Counted by account ids only, without customer names.',
    meet_open: '📝 Monthly one-to-one',
    meet_edit: '📝 Edit the one-to-one',
    meet_title: 'One-to-one with {name} — {m}',
    meet_private: 'Saved on this device only, never in the repository. Move it to another device with “Export one-to-ones”.',
    meet_note: 'Notes from the meeting',
    meet_note_ph: 'What was discussed, and what the card showed…',
    meet_agreed: 'What we agreed for next month',
    meet_agreed_ph: 'e.g. take more WASL links, and close the old open tasks.',
    meet_goals: 'The month’s goals',
    meet_add_goal: '+ goal',
    meet_save: 'Save',
    meet_saved: 'The one-to-one is saved.',
    meet_prev_agreed: 'Agreed last month:',
    meet_done: 'done',
    meet_export: 'Export one-to-ones',
    meet_import: 'Import one-to-ones',
    meet_imported: 'The one-to-ones arrived.',
    goal_points: 'Weighted points',
    path_h: 'The pattern’s path over the months',
    path_soon: 'The path appears from the second closed month — each month that ends is added by itself.',
    help_path: 'For each closed month: the pattern, the points and the quarter. It shows how each person’s work moves — from “volume engine” to “field executor”, say — which is what an annual review is about.',
  },
  ur: {
    brand: 'آفاقی', portal: 'تکنیکی ٹیم کا پورٹل — جدہ', nav_data: 'ڈیٹا', nav_kpi: 'کارکردگی کے اشاریے',
    tools_title: 'ٹیم کے ٹولز', tools_sub: 'ہر ٹول پورٹل کے اندر، اپنے معمول کے اکاؤنٹ سے چلتا ہے۔',
    primary: 'بنیادی ٹولز', systems: 'کمپنی کے سسٹمز', more: 'دیگر ٹولز', soon: 'جلد آ رہا ہے',
    open: 'کھولیں',
    data_title: 'اشاریوں کا ڈیٹا', data_sub: 'ڈیٹا مائی آفاقی سے کلاڈ کروم کے ذریعے نکالا جاتا ہے اور پھر یہاں اپ لوڈ کیا جاتا ہے۔ یہ صرف اسی ڈیوائس پر محفوظ رہتا ہے۔',
    step1: 'مدت منتخب کریں', step2: 'ہدایت کاپی کر کے کلاڈ کروم میں دیں', step3: 'نتیجہ اپ لوڈ کریں',
    block_size: 'مدت کی لمبائی', blocks_back: 'مدتوں کی تعداد',
    m3: 'سہ ماہی', m6: 'ششماہی', m12: 'سال',
    block_partial: 'جاری ہے',
    copy_prompt: 'ہدایت کاپی کریں', copied: 'ہدایت کاپی ہو گئی — مائی آفاقی کھول کر اسے کلاڈ کروم میں پیسٹ کریں',
    step2_hint: 'کروم میں مائی آفاقی کھولیں اور لاگ اِن کریں، پھر کلاڈ کروم کھول کر ہدایت پیسٹ کریں۔ ہر مدت کے لیے الگ ہدایت ہے۔',
    step3_hint: 'کلاڈ کروم کا جواب جیسا ہے ویسا یہاں پیسٹ کریں، یا محفوظ کی ہوئی فائل منتخب کریں۔ ایک ہی مدت کے کئی حصے اپ لوڈ کیے جا سکتے ہیں۔',
    paste_here: 'کلاڈ کروم کا جواب یہاں پیسٹ کریں', load_text: 'متن پڑھیں', choose_file: 'فائل منتخب کریں',
    datasets: 'اپ لوڈ شدہ ڈیٹا', none_yet: 'ابھی کوئی ڈیٹا اپ لوڈ نہیں ہوا۔ پہلے قدم سے شروع کریں۔',
    tasks_n: '{n} ٹاسک', complete: 'مکمل', incomplete: 'نامکمل: {want} میں سے {got}',
    remove: 'ہٹائیں', export_all: 'بیک اپ برآمد کریں', import_all: 'بیک اپ بحال کریں',
    sample: 'نمونہ ڈیٹا لوڈ کریں', sample_note: 'نمونہ ڈیٹا — مائی آفاقی سے نہیں',
    loaded: '{range} کے لیے {n} ٹاسک لوڈ ہو گئے',
    err_json: 'متن میں درست ڈیٹا نہیں ملا۔ کلاڈ کروم کا پورا جواب جیسا ہے ویسا پیسٹ کریں۔',
    err_schema: 'یہ ڈیٹا مطلوبہ فارمیٹ ({schema}) میں نہیں ہے۔ اسی صفحے سے بنائی گئی ہدایت استعمال کریں۔',
    err_range: 'فائل میں درج مدت درست نہیں ہے۔',
    err_tasks: 'فائل میں ٹاسکس کی فہرست موجود نہیں۔',
    warn_rows: 'ادھورے ڈیٹا والی {n} قطاریں چھوڑ دی گئیں۔',
    kpi_title: 'کارکردگی کے اشاریے', kpi_sub: 'Factor 1 — ہر انجینئر پر ٹاسکس کا بوجھ اور ان کی تکمیل، مائی آفاقی کے ٹاسکس سے۔',
    period: 'مدت', no_data: 'ابھی کوئی ڈیٹا نہیں۔ ڈیٹا کے صفحے سے ڈیٹا اپ لوڈ کریں۔',
    col_person: 'ملازم', col_assigned: 'تفویض شدہ', col_done: 'مکمل شدہ', col_rate: 'تکمیل کی شرح',
    col_avg: 'تکمیل کا اوسط وقت', col_median: 'درمیانی قدر', col_open: 'اس وقت کھلے', col_created: 'خود بنائے',
    col_email: 'ای میل سے', col_cancelled: 'منسوخ',
    hours: '{n} گھنٹے', days: '{n} دن',
    team: 'ٹیم کا مجموعہ', group_bucket: 'گروپ کو تفویض، ابھی مکمل نہیں',
    trend: 'مدتوں کا موازنہ', definitions: 'حساب کا طریقہ',
    def_1: 'ٹاسک اسی کے نام شمار ہوتا ہے جسے مائی آفاقی میں تفویض کیا گیا ہو۔',
    def_2: '«تفویض شدہ» وہ ٹاسک ہیں جو اس مدت میں بنائے گئے؛ «مکمل شدہ» وہ ہیں جو اس مدت میں بند ہوئے، چاہے پہلے بنائے گئے ہوں — بالکل وہی گنتی جو مائی آفاقی اپنے تکمیل کی تاریخ والے فلٹر میں دیتا ہے۔',
    def_3: 'تکمیل کی شرح: اس مدت میں بنائے گئے ٹاسکس میں سے کتنے ڈیٹا نکالنے کے وقت تک مکمل ہو چکے تھے، منسوخ شدہ کے بغیر۔ وقت ٹاسک بننے سے بند ہونے تک پورے گھنٹوں میں ناپا جاتا ہے، اس مدت میں مکمل ہونے والے ٹاسکس پر؛ درمیانی قدر اس لیے دکھائی جاتی ہے کہ ایک لمبا ٹاسک اوسط کو بگاڑ دیتا ہے۔',
    def_4: '«ای میل سے» مائی آفاقی کے «کسٹمر ای میل سرگرمی» والے ٹاسک ہیں — سسٹم اکاؤنٹ کا بنایا ہوا ہر ٹاسک نہیں، کیونکہ وہ ورک آرڈر کے ٹاسک بھی بناتا ہے۔',
    data_incomplete_warn: 'اس مدت کا ڈیٹا نامکمل ہے — اعداد اصل سے کم ہیں۔',
    theme: 'ظاہری انداز', lang_next: 'العربية',
    nav_guide: 'رہنما',
    whats_new: 'اس ورژن میں نیا کیا ہے',
    update_ready: 'نیا ورژن دستیاب ہے — صفحہ تازہ کرنے کے لیے دبائیں',
    close: 'بند کریں',
    g_title: 'استعمال کی رہنمائی',
    g_version: 'یہ رہنمائی ورژن v{v} کے لیے ہے — {date}',
    g_print: 'رہنمائی پرنٹ کریں',
    g_tools_h: 'ٹولز',
    g_tools_b: 'سائیڈ مینو میں سب کچھ ہے: «ہوم»، پھر «ماڈیولز» کا گروپ — سینسرز کی تقسیم کا نقشہ، انٹیگریشن ہیلپر، کینوال اور آفاقی ریڈرز — پھر «اشاریے» کا گروپ جس میں ڈیٹا کا صفحہ اور اشاریوں کا بورڈ ہے، پھر «کمپنی کے سسٹمز»، پھر «رہنما»۔ گروپ اپنے نام پر دبانے سے کھلتا اور بند ہوتا ہے، اور جب آپ اس کے اندر ہوں تو خود کھل جاتا ہے۔ کسی ماڈیول کو دبائیں تو وہ اوپر والی پٹی کے نیچے کھلتا ہے، اور جب آپ دوسرے پر جاتے ہیں تو اپنی حالت میں کھلا رہتا ہے؛ پٹی میں «الگ ٹیب میں کھولیں» اسے الگ کھولتا ہے۔ ہر ٹول اپنے معمول کے اکاؤنٹ سے لاگ اِن مانگتا ہے۔ کمپنی کے سسٹمز — مائی آفاقی، آفاقی پرو اور ای میل — نئی ٹیب میں کھلتے ہیں، کیونکہ وہ کسی دوسرے صفحے کے اندر دکھائے جانے کی اجازت نہیں دیتے۔ زبان اور تاریک انداز مینو کے نیچے ہیں؛ موبائل پر مینو اسکرین کے اوپر والے بٹن سے کھلتا ہے۔',
    g_data_h: 'اشاریوں کا ڈیٹا',
    g_data_b: 'ہر مدت کی دو ہدایات ہیں: «ہدایت کاپی کریں» پہلے اشاریے کے لیے مدت کے ٹاسک لاتی ہے، اور «رپورٹس کی ہدایت کاپی کریں» دوسرے اور تیسرے اشاریے کے لیے ٹیکنیشن پوائنٹس اور آفٹر سیلز ٹکٹس لاتی ہے۔ ہر ہدایت اپنی اجازت شدہ درخواستوں کے نام لیتی ہے اور باقی سب سے منع کرتی ہے، اس لیے مائی آفاقی میں کچھ نہیں بدلتا۔ مائی آفاقی میں لاگ اِن ہو کر ہدایت کلاڈ کروم میں چلائیں؛ یہ نتیجہ آپ کے کمپیوٹر پر فائل کے طور پر محفوظ کرتی ہے، جسے آپ یہاں «فائل منتخب کریں» سے اپ لوڈ کرتے ہیں — وہی خانہ دونوں قسمیں قبول کرتا ہے۔ پورٹل خود مائی آفاقی نہیں پڑھتا کیونکہ اس کا سرور کسی دوسرے پتے سے آنے والی درخواستیں قبول نہیں کرتا۔',
    g_parts_h: 'لمبے جوابات اور نامکمل مدتیں',
    g_parts_b: 'اگر کلاڈ کروم اپنا جواب کئی حصوں میں تقسیم کرے تو تمام حصے اپ لوڈ کریں؛ یہ ٹاسک نمبر کے حساب سے آپس میں جڑ جاتے ہیں۔ کوئی مدت اس وقت تک «نامکمل» رہتی ہے جب تک اس کے ٹاسکس کی تعداد مائی آفاقی کی بتائی ہوئی کل تعداد کے برابر نہ ہو جائے، اور اس کے اعداد پر انتباہ دکھائی دیتا ہے۔',
    g_kpi_h: 'کارکردگی کے اشاریے',
    g_kpi_b: 'فہرست سے مدت منتخب کریں۔ پہلا اشاریہ ہر ملازم کے لیے دکھاتا ہے کہ اسے کیا تفویض ہوا، اس نے کیا مکمل کیا، تکمیل کی شرح، تکمیل کا وقت اور اس وقت کیا کھلا ہے، بار کے ساتھ اور مکمل، وسط یا کھلے کے مطابق ترتیب، پھر ٹیم کا مجموعہ اور دائرے۔ اس کے نیچے ہر ملازم کے آفٹر سیلز ٹکٹ، پھر چوتھا اشاریہ — سرگرمیوں کا ریکارڈ: ہر انجینئر نے مدت میں گاہکوں کے ساتھ کیا درج کیا، مختلف گاہک، کتنے ٹاسک بنے، اور حالت اور زمرے کی تقسیم — جب اسی مدت کی رپورٹس فائل اپ لوڈ ہو۔ ٹیکنیشن پوائنٹس صفحے کے نیچے سمٹے ہوئے ہیں جسے ضرورت ہو۔ شامل ٹیم جدہ کی تکنیکی ٹیموں سے خود بخود منتخب ہوتی ہے اور بدلی جا سکتی ہے، اور ایک سے زیادہ مدتیں اپ لوڈ ہوں تو موازنہ کالموں کی صورت میں ظاہر ہوتا ہے۔ ہر عدد کا حساب کیسے ہوتا ہے، یہ صفحے کے نیچے لکھا ہے۔',
    g_privacy_h: 'ڈیٹا کہاں محفوظ رہتا ہے',
    g_privacy_b: 'صرف اسی ڈیوائس اور اسی براؤزر میں؛ کہیں بھی کچھ نہیں بھیجا جاتا۔ کسی دوسری ڈیوائس پر منتقل کرنے یا نقل رکھنے کے لیے «بیک اپ برآمد کریں» اور پھر «بیک اپ بحال کریں» استعمال کریں۔ براؤزر کا ڈیٹا صاف کرنے سے یہ بھی مٹ جاتا ہے۔',
    def_5: '«اس وقت کھلے» ڈیٹا نکالنے کے لمحے کی تصویر ہے، ٹاسک کسی بھی تاریخ کو بنا ہو۔',
    team_title: 'اشاریوں میں شامل ٹیم',
    team_count: '{total} میں سے {n}',
    team_jeddah: 'جدہ برانچ کی ٹیمیں',
    team_all: 'سب',
    team_hint: 'مائی آفاقی میں جدہ برانچ پر درج ٹیموں سے خود بخود منتخب ہوتی ہے، اور بدلی جا سکتی ہے۔ اسی ڈیوائس پر محفوظ رہتی ہے۔',
    open_tab: 'الگ ٹیب میں کھولیں',
    module_loading: 'ٹول کھل رہا ہے…',
    in_portal: 'پورٹل کے اندر چلتا ہے',
    systems_note: 'نئی ٹیب میں کھلتے ہیں — کمپنی کے سسٹمز کسی دوسرے صفحے کے اندر دکھائے جانے کی اجازت نہیں دیتے۔',
    side_modules: 'ماڈیولز',
    menu: 'مینو',
    nav_home: 'ہوم',
    kpi_board: 'اشاریوں کا بورڈ',
    lang_label: 'زبان',
    theme_dark: 'تاریک انداز',
    theme_light: 'روشن انداز',
    nav_me: 'میرے اشاریے',
    me_title: 'میرے اشاریے',
    me_sub: 'آپ کا پروفائل: آپ کا کام، آپ کے اعداد اور ان کا موازنہ، اور آپ کی ٹیم اگر مائی آفاقی کسی کو آپ کے نیچے رکھتا ہے۔ مائی آفاقی سے آپ کے اپنے لاگ اِن کے ساتھ؛ یہ آپ کے آلے پر رہتا ہے۔',
    me_how_h: 'ایک بار کی ترتیب',
    me_bm: 'مائی آفاقی سے میرے اشاریے',
    me_step1: 'کمپیوٹر پر: یہ بٹن کھینچ کر براؤزر کی بک مارکس بار پر چھوڑ دیں۔',
    me_drag: 'بٹن کو بک مارکس بار پر کھینچیں، پھر مائی آفاقی کے اندر سے اسے دبائیں۔',
    me_step2: 'اس کے بعد: مائی آفاقی کھولیں اور لاگ اِن کریں، پھر بک مارک دبائیں۔ آپ کے ٹاسک پڑھے جاتے ہیں اور یہ صفحہ آپ کے اشاریوں کے ساتھ کھلتا ہے۔ تازہ کرنے کے لیے اسے دوبارہ دبائیں۔',
    me_copy: 'بک مارک کا کوڈ کاپی کریں',
    me_copied: 'کوڈ کاپی ہو گیا',
    me_copy_fail: 'کاپی نہیں ہو سکا — بٹن کو دیر تک دبائیں اور لنک کاپی کریں',
    me_phones: 'موبائل پر',
    me_android: 'اینڈرائیڈ (کروم): بک مارک کا کوڈ کاپی کریں، کسی بھی صفحے کو بک مارک کریں، پھر اسے ایڈٹ کریں: نام «میرے اشاریے» اور پتے کی جگہ کاپی کیا ہوا کوڈ۔ پھر مائی آفاقی کے اندر ایڈریس بار میں «میرے اشاریے» لکھیں اور تجاویز میں سے بک مارک چنیں — بک مارکس کی فہرست سے دبانے پر یہ نہیں چلتا۔',
    me_ios: 'آئی فون (سفاری): بک مارک کا کوڈ کاپی کریں، کسی بھی صفحے کو بک مارک کریں، پھر اس کے پتے میں کوڈ پیسٹ کریں۔ پھر مائی آفاقی کے اندر بک مارکس کھولیں اور اسے دبائیں۔',
    me_privacy: 'کیا پڑھا جاتا ہے: صرف آپ کے اپنے ٹاسک — ان کا نمبر، ہر ایک کب بنا اور کب بند ہوا، اس کی حالت اور قسم۔ نہ عنوان، نہ کسٹمر، نہ آپ کا لاگ اِن۔ کچھ بھی کسی سرور کو نہیں بھیجا جاتا، اور آپ کے اشاریے آپ کے سوا کوئی نہیں دیکھتا۔',
    me_wait: 'مائی آفاقی سے آپ کے ٹاسک کا انتظار…',
    me_loaded: 'آپ کے اشاریے آ گئے: {n} ٹاسک',
    me_q: 'سہ ماہی',
    me_partial: 'جزوی',
    me_refresh_h: 'تازہ کاری اور ترتیب',
    me_refresh: 'تازہ کرنے کے لیے: مائی آفاقی کھولیں اور بک مارک دوبارہ دبائیں۔',
    me_forget: 'میرے اشاریے اس ڈیوائس سے ہٹائیں',
    g_me_h: 'میرے اشاریے',
    g_me_b: '«میرے اشاریے» کا صفحہ آپ کا اپنا پروفائل ہے۔ ایک بار: «میرے اشاریے» کا بٹن براؤزر کی بک مارکس بار پر کھینچیں۔ پھر جب چاہیں: اپنے اکاؤنٹ سے مائی آفاقی کھولیں اور بک مارک دبائیں — یہ آپ کا کام پڑھتا ہے اور پورٹل اسی پر کھولتا ہے۔ آپ کو اپنی تفصیلات اور ٹیمیں ملتی ہیں، پھر «میرا کھلا کام ابھی» آپ کے ٹاسکس کے عنوان اور عمر کے ساتھ، پھر انہی دنوں پر «یہ مہینہ بمقابلہ پچھلا مہینہ» تیروں کے ساتھ جو بتاتے ہیں کہاں بہتری آئی اور کہاں کمی، پھر ناموں کے بغیر ٹیم کی اوسط سے آپ کا موازنہ، پھر پچھلے بارہ مہینوں کی آپ کی تاریخ۔ اگر مائی آفاقی اپنے ڈھانچے میں کچھ افراد کو آپ کے نیچے رکھتا ہے — ٹیم لیڈر یا مینیجر — تو «میری ٹیم» کا حصہ ان میں سے ہر ایک کو ان کے اعداد کے ساتھ دکھاتا ہے۔ پورٹل آپ کو بالکل وہی دکھاتا ہے جو مائی آفاقی دکھاتا ہے، اس سے زیادہ کچھ نہیں۔ سب کچھ آپ کے آلے پر رہتا ہے؛ لاگ اِن ٹوکن، گاہکوں کے نام، دوسروں کے ٹاسکس کے عنوان اور مکمل شدہ ٹاسکس کے عنوان کبھی نہیں لائے جاتے، اور «میرے اشاریے حذف کریں» اسے آلے سے مٹا دیتا ہے۔',
    col_self: 'خود درج کیے',
    def_6: '«خود درج کیے»، تفویض شدہ میں سے: وہ ٹاسک جو ملازم نے خود کھولے اور خود کو تفویض کیے، ای میل سے نہیں — اس ٹیم میں وہ درخواستیں جو واٹس ایپ یا کال سے آتی ہیں۔ مائی آفاقی ٹاسک بنانے والے کو درج کرتا ہے، اس کا ذریعہ نہیں، اس لیے واٹس ایپ اور کال کو الگ نہیں کیا جا سکتا۔ اسے باقی کالموں کے ساتھ پڑھیں: یہ بتاتا ہے کہ کام کا بوجھ کہاں سے آیا، کام کا معیار نہیں۔',
    nav_pro: 'آفاقی پرو',
    pro_sub: 'آفاقی پرو میں آپ کے اکاؤنٹ کے یونٹس، پورٹل کے اندر — صرف پڑھنے کے لیے۔',
    pro_signin_h: 'اپنے آفاقی پرو اکاؤنٹ سے لاگ اِن کریں',
    pro_user: 'صارف نام',
    pro_pass: 'پاس ورڈ',
    pro_signin: 'لاگ اِن',
    pro_signing: 'لاگ اِن ہو رہا ہے…',
    pro_bad: 'صارف نام یا پاس ورڈ درست نہیں۔',
    pro_2fa: 'یہ اکاؤنٹ تصدیقی کوڈ استعمال کرتا ہے، اور آفاقی پرو اپنی سائٹ کے باہر سے کوڈ والا لاگ اِن مکمل کرنے کی اجازت نہیں دیتا۔ «آفاقی پرو کی سائٹ کھولیں» استعمال کریں۔',
    pro_refused: 'آفاقی پرو نے لاگ اِن رد کر دیا: {why}',
    pro_net: 'آفاقی پرو تک رسائی نہیں ہو سکی — کنکشن چیک کریں اور دوبارہ کوشش کریں۔',
    pro_expired: 'آفاقی پرو کا سیشن ختم ہو گیا — دوبارہ لاگ اِن کریں۔',
    pro_privacy: 'پاس ورڈ ایک بار سیشن کھولنے کے لیے استعمال ہوتا ہے اور کہیں محفوظ نہیں ہوتا۔ سیشن صرف اسی ٹیب میں رہتا ہے اور اسے بند کرنے پر ختم ہو جاتا ہے۔ آفاقی پرو میں کچھ نہیں لکھا جاتا۔',
    pro_site: 'آفاقی پرو کی سائٹ کھولیں',
    pro_loading: 'یونٹس لوڈ ہو رہے ہیں: {total} میں سے {n}',
    pro_search: 'نام یا IMEI سے تلاش کریں',
    pro_refresh: 'تازہ کریں',
    pro_out: 'لاگ آؤٹ',
    pro_total: 'تمام یونٹس',
    pro_live: 'ایک گھنٹے کے اندر رپورٹ',
    pro_day: '۲۴ گھنٹوں کے اندر',
    pro_stale: '۲۴ گھنٹوں سے پرانا یا کبھی نہیں',
    pro_col_name: 'یونٹ',
    pro_col_id: 'IMEI',
    pro_col_last: 'آخری رپورٹ (سعودی وقت)',
    pro_col_state: 'حالت',
    pro_col_where: 'مقام',
    pro_st_live: 'فعال',
    pro_st_day: 'آج',
    pro_st_stale: 'تاخیر',
    pro_st_never: 'کبھی نہیں',
    pro_map: 'نقشے پر',
    pro_none: 'تلاش سے کوئی یونٹ نہیں ملا۔',
    pro_more: 'اور {n} مزید یونٹس — انہیں دیکھنے کے لیے تلاش محدود کریں۔',
    g_pro_h: 'آفاقی پرو',
    g_pro_b: '«آفاقی پرو» کا صفحہ پورٹل کے اندر آپ کے اکاؤنٹ کے یونٹس دکھاتا ہے: نام، IMEI، سعودی وقت میں آخری رپورٹ، حالت اور نقشے پر مقام؛ کسی یونٹ کو دبانے سے اس کا سارا ڈیٹا دکھائی دیتا ہے۔ صارف نام اور پاس ورڈ سے لاگ اِن کریں؛ پاس ورڈ محفوظ نہیں ہوتا، ٹیب بند ہونے پر سیشن ختم ہو جاتا ہے، اور آفاقی پرو میں کچھ نہیں لکھا جاتا۔ تصدیقی کوڈ والے اکاؤنٹ یہاں سے لاگ اِن مکمل نہیں کر سکتے — آفاقی پرو اپنی سائٹ کے باہر سے اس کی اجازت نہیں دیتا — اس لیے وہ بٹن سے سائٹ ہی کھولتے ہیں۔ مائی آفاقی پورٹل کے اندر نہیں دکھایا جا سکتا اور اسے اپنا ڈیٹا پڑھنے نہیں دیتا، اس لیے یہ نئی ٹیب میں کھلتا ہے۔',
    copy_reports: 'رپورٹس کی ہدایت کاپی کریں',
    reports_loaded: '{range} کی رپورٹس آ گئیں: ٹیکنیشن پوائنٹس کی {n} قطاریں اور آفٹر سیلز کے {a} افراد',
    reports_meta: 'رپورٹس: ٹیکنیشن پوائنٹس کے {m} مہینے، آفٹر سیلز کے {a} افراد',
    reports_none: 'اس مدت کی رپورٹس ابھی نہیں۔ ڈیٹا کے صفحے سے اسی مدت کی «رپورٹس کی ہدایت» کاپی کریں، کلاڈ کروم میں چلائیں، اور فائل اپ لوڈ کریں۔',
    col_rd: 'تحقیق و ترقی',
    f2_title: 'دوسرا اشاریہ — ٹیکنیشن پوائنٹس',
    f2_sub: 'مائی آفاقی کی «ٹیکنیشن پوائنٹس» رپورٹ سے، جدہ برانچ کے لیے، ان مہینوں کا مجموعہ: {months}۔',
    f2_none: 'اس مدت میں کوئی فیلڈ کام درج نہیں۔',
    f2_name: 'ٹیکنیشن',
    f2_installed: 'نصب شدہ ڈیوائسز',
    f2_maint: 'مرمت شدہ ڈیوائسز',
    f2_fix: 'درستی',
    f2_reservice: 'دوبارہ سروس',
    f2_stop: 'سروس بندش',
    f2_group: 'اجتماعی تنصیب',
    f2_extra: 'اضافی کام',
    f2_viol: 'خلاف ورزیاں',
    f2_points: 'پوائنٹس',
    f3_title: 'تیسرا اشاریہ — آفٹر سیلز ٹکٹس',
    f3_sub: 'مائی آفاقی کے «آفٹر سیلز بورڈ» سے، جدہ برانچ کے لیے، اس مدت میں بنے ٹکٹس۔',
    f3_none: 'اس مدت میں کوئی ٹکٹ نہیں۔',
    f3_name: 'ملازم',
    f3_open: 'کھلے',
    f3_pending: 'زیر التوا',
    f3_done: 'مکمل',
    f3_total: 'کل',
    def_7: '«تحقیق و ترقی»: اس مدت میں مکمل ہونے والے ٹاسکس میں سے وہ جو مائی آفاقی کی «R&D Tasks» قطار میں تھے۔ یہ تب دکھائی دیتا ہے جب مدت کی فائل میں اس قطار کی فہرست ہو۔',
    def_8: 'دوسرا اشاریہ مائی آفاقی کی «ٹیکنیشن پوائنٹس» رپورٹ کو ویسے ہی لاتا ہے جیسے مائی آفاقی اسے جدہ برانچ کے لیے مہینہ بہ مہینہ حساب کرتا ہے، اور ہر ٹیکنیشن کے لیے مدت کے مہینے جمع کرتا ہے۔ بونس کی رقمیں، فون نمبر اور تشخیصات نہیں لائی جاتیں۔',
    def_9: 'تیسرا اشاریہ جدہ برانچ کا «آفٹر سیلز بورڈ» جیسا ہے ویسا لاتا ہے: ہر ملازم کے کھلے، زیر التوا اور مکمل ٹکٹ، اس مدت میں بنے ٹکٹس میں سے۔',
    me_open_h: 'میرا کھلا کام ابھی ({n})',
    me_open_none: 'اس وقت آپ پر کوئی کھلا ٹاسک نہیں۔',
    me_untitled: 'بے عنوان ٹاسک',
    mgr_bm: 'ٹیم کا سارا ڈیٹا کھینچیں {from} ← {to}',
    mgr_bm_intro: 'مینیجر کے لیے: ایک بک مارک مائی آفاقی کے اندر سے ایک دباؤ میں مدت کا سارا ڈیٹا — ٹاسک اور رپورٹس ایک ساتھ — کھینچتا ہے، اور دو فائلیں محفوظ کرتا ہے جو نیچے اپ لوڈ ہوتی ہیں۔ دونوں ہدایات کاپی کرنے کا متبادل۔ بٹن کو ایک بار بک مارکس بار پر کھینچیں۔',
    g_mgr_h: 'مینیجر بک مارک — ایک دباؤ میں سب کچھ',
    g_mgr_b: 'ڈیٹا کے صفحے پر، ایک مینیجر بک مارک مائی آفاقی کے اندر سے وہ سب پڑھتا ہے جو دونوں ہدایات پڑھتی ہیں: مدت کے تمام ٹاسک، R&D قطار، ٹیکنیشن پوائنٹس اور آفٹر سیلز ٹکٹس — اور انہیں دو فائلوں (ٹاسک اور رپورٹس) کے طور پر محفوظ کرتا ہے جو پورٹل میں اپ لوڈ ہوتی ہیں۔ یہ مینیجر کے اپنے لاگ اِن سے چلتا ہے، صرف پڑھنے کے لیے، انہی چھ اجازت شدہ درخواستوں کے ذریعے، اور لاگ اِن ٹوکن مائی آفاقی کے صفحے سے باہر نہیں جاتا۔ یہ دونوں ہدایات کاپی کر کے کلاڈ کروم میں چلانے کا تیز تر متبادل ہے؛ کلاڈ کروم والا طریقہ بھی دستیاب رہتا ہے۔',
    me_updated: 'آخری تازہ کاری {date}',
    me_scope: 'مائی آفاقی آپ کو {n} افراد کا کام دکھاتا ہے',
    me_month_h: 'یہ مہینہ بمقابلہ پچھلا مہینہ — دن {d} تک',
    me_month_sub: '{a} سے {b} تک، پچھلے مہینے کے انہی دنوں ({c} سے {d}) کے مقابلے میں — منصفانہ موازنہ۔',
    me_last_month: 'پچھلا مہینہ',
    me_avg_h: 'ٹیم کی اوسط کے مقابلے میں',
    me_avg_sub: 'اس مہینے کام والے {n} افراد کی اوسط، ناموں کے بغیر۔',
    me_avg_team: 'ٹیم کی اوسط',
    me_avg_none: 'مائی آفاقی آپ کو صرف آپ کا اپنا کام دکھاتا ہے، اس لیے یہاں ٹیم کی اوسط نہیں نکالی جاتی۔',
    me_team_h: 'میری ٹیم — {n} افراد',
    me_team_sub: 'وہ افراد جنہیں مائی آفاقی اپنے ڈھانچے میں آپ کے نیچے رکھتا ہے، اس مہینے کے اب تک کے اعداد کے ساتھ۔',
    me_vs_last: 'مکمل بمقابلہ پچھلا مہینہ',
    me_history_h: 'میری تاریخ — پچھلے بارہ مہینے سہ ماہی کے حساب سے',
    me_open_more: 'مزید {n} ٹاسک دکھائیں',
    nav_team: 'ٹیم',
    team_sub: 'یہاں ٹیم کے عہدے اور کون کس کے ماتحت ہے لکھا جاتا ہے — مائی آفاقی کی شناختوں سے، اس لیے فائل میں نام نہیں۔ نام بک مارک کے ساتھ مائی آفاقی سے آتے ہیں۔',
    team_note: 'آپ جو یہاں لکھتے ہیں وہ اسی آلے پر رہتا ہے۔ پوری ٹیم کو دکھانے کے لیے «team.json» ڈاؤن لوڈ کر کے ریپوزٹری میں رکھیں — اس میں صرف شناختیں اور عہدے ہیں، نام نہیں۔',
    team_download: 'team.json ڈاؤن لوڈ کریں',
    team_upload: 'team.json اپ لوڈ کریں',
    team_loaded: 'ٹیم کی فائل آ گئی: {n} افراد',
    team_filled: '{m} میں سے {n} کا عہدہ یا سربراہ ہے',
    team_col_name: 'نام — مائی آفاقی سے',
    team_col_id: 'مائی آفاقی شناخت',
    team_col_pos: 'عہدہ',
    team_col_leader: 'ماتحت',
    team_no_leader: '— کوئی سربراہ نہیں —',
    team_pos_ph: 'مثلاً: آفٹر سیلز انجینئر',
    team_none: 'ابھی کوئی فرد نہیں — ڈیٹا کے صفحے سے ڈیٹا اپ لوڈ کریں یا «میرے اشاریے» بک مارک دبائیں۔',
    me_leader: '{name} کے ماتحت',
    me_sources_h: 'اس مہینے کا کام کہاں سے آیا',
    src_email: 'ای میل سے',
    src_self: 'خود درج کیا',
    src_other: 'دوسروں نے تفویض کیا',
    kpi_dist_h: 'ٹیم میں مکمل کام کی تقسیم',
    kpi_src_h: 'مکمل ٹاسکس کے ذرائع',
    kpi_tickets_h: 'آفٹر سیلز ٹکٹس',
    others: 'باقی',
    g_team_h: 'ٹیم — عہدے اور کون کس کے ماتحت',
    g_team_b: '«ٹیم» کے صفحے کے دو حصے ہیں۔ پہلا «جدہ کے اکاؤنٹس پر آفٹر سیلز کی تفویض»: ایک بک مارک جو آپ کے لاگ اِن سے مائی آفاقی کے اندر ایک پینل کھولتا ہے جہاں آپ انجینئرز چنتے ہیں، جدہ کے اکاؤنٹس کی کوریج دیکھتے ہیں، پہلے/بعد کے جدول کے ساتھ دس پر آزماتے ہیں، پھر باقی پر لاگو کرتے اور لاگ ڈاؤن لوڈ کرتے ہیں — صرف اضافہ، جو موجود ہے ہٹایا نہیں جاتا، صرف جدہ برانچ، اور یہ پورے پورٹل میں واحد لکھائی ہے۔ دوسرا «عہدے اور کون کس کے ماتحت»: مینیجر ہر فرد کا عہدہ اور سربراہ اس نام کے سامنے لکھتا ہے جو مائی آفاقی سے آتا ہے؛ یہ ناموں سے نہیں، مائی آفاقی کی شناختوں سے محفوظ ہوتا ہے، آلے پر رہتا ہے، اور پوری ٹیم کو دکھانے کے لیے «team.json» ڈاؤن لوڈ کر کے ریپوزٹری میں رکھا جاتا ہے۔ عہدہ «میرے اشاریے» کے کارڈ، جدولوں اور بورڈ پر دکھائی دیتا ہے، اور «ماتحت» سربراہ کو «میری ٹیم» میں اس کے لوگ دکھاتا ہے۔',
    me_period_month: 'یہ مہینہ',
    me_period_quarter: 'یہ سہ ماہی',
    me_period_half: 'پچھلے ۶ ماہ',
    me_cmp_h_month: 'یہ مہینہ بمقابلہ پچھلا مہینہ — دن {d} تک',
    me_cmp_h_quarter: 'یہ سہ ماہی بمقابلہ پچھلی سہ ماہی — پہلے {d} دن',
    me_cmp_h_half: 'پچھلے چھ ماہ بمقابلہ ان سے پہلے کے چھ',
    me_last_period: 'پچھلی مدت',
    me_update: 'مائی آفاقی سے تازہ کریں',
    me_refresh_hint: 'مائی آفاقی کھولیں اور وہاں بک مارک دبائیں — پورٹل خود تازہ ہو جاتا ہے۔',
    me_setup_again: 'بک مارک کی ترتیب',
    alert_attention: 'توجہ درکار: {name} — {why}۔',
    alert_improved: 'واضح بہتری: {name} — ‎+{n}‎ مکمل، انہی دنوں پر پچھلی مدت سے زیادہ۔',
    why_rate: 'تکمیل کی شرح {r}',
    why_open: '{n} کھلے ٹاسک',
    why_median: 'وسط {h} — ٹیم سے دگنے سے زیادہ',
    kpi_table_sub: 'بار = ٹیم کے سب سے زیادہ کے نسبت مکمل کام۔',
    kpi_sort_done: 'مکمل کے مطابق',
    kpi_sort_median: 'وسط کے مطابق',
    kpi_sort_open: 'کھلے کے مطابق',
    trend_sub: 'ہر اپ لوڈ شدہ مدت کا ٹیم مجموعہ۔ کالم = مکمل کام؛ نیچے تکمیل کی شرح اور وسط۔',
    f4_title: 'چوتھا اشاریہ — گاہکوں کے ساتھ سرگرمیوں کا ریکارڈ',
    f4_sub: 'جو ہر انجینئر مائی آفاقی میں گاہک کے ساتھ درج کرتا ہے («ٹکٹ») جب کام ٹاسک کے طور پر نہ آئے۔ ٹکٹس کی اسکرین سے، اس مدت کے لیے، آپ کی ٹیم کے لیے۔',
    f4_activities: 'سرگرمیاں',
    f4_customers: 'مختلف گاہک',
    f4_with_task: 'ٹاسک بن گئیں',
    f4_by_category: 'زمرے کے مطابق سرگرمیاں',
    f4_by_status: 'حالت کے مطابق سرگرمیاں',
    f4_none: 'اس مدت کی فائل میں کوئی سرگرمی نہیں — v7.4 سے پرانی رپورٹس فائل، یا آپ کی ٹیم کی کوئی نہیں۔',
    f2_show: 'ٹیکنیشن پوائنٹس — دکھائیں',
    def_10: 'چوتھا اشاریہ ہر انجینئر کے لیے مدت میں اس کے ٹکٹ گنتا ہے — ہر ایک گاہک کے ساتھ درج کی گئی سرگرمی — مختلف گاہک، کتنے ٹاسک بنے، اور مائی آفاقی کے مطابق حالت اور زمرے کی تقسیم۔ ٹکٹ کی تفصیل اور گاہکوں کے نام نہیں لائے جاتے۔',
    assign_h: 'جدہ کے اکاؤنٹس پر آفٹر سیلز کی تفویض',
    assign_sub: 'ایک پینل جو آپ کے لاگ اِن سے مائی آفاقی کے اندر کھلتا ہے: انجینئرز چنیں، جو چھوڑ گئے انہیں ہٹائیں، کوریج دیکھیں، دس پر آزمائیں، پھر باقی پر لاگو کریں۔ جسے آپ خود نشان نہ لگائیں وہ نہیں ہٹایا جاتا، اور کوئی اکاؤنٹ کسی کے بغیر نہیں چھوڑا جاتا۔',
    assign_s1: 'ایک بار: بٹن کو بک مارکس بار پر کھینچیں۔',
    assign_s2: 'مائی آفاقی کھولیں اور بک مارک دبائیں — پینل صفحے کے اوپر آ جاتا ہے۔',
    assign_s3: 'انجینئرز پر نشان لگائیں، جو چھوڑ گئے انہیں «ہر اکاؤنٹ سے ہٹائیں» میں نشان لگائیں، پھر «دس پر آزمائیں» اور پہلے/بعد کا جدول دیکھیں۔',
    assign_s4: '«باقی پر لاگو کریں»، پھر لاگ ڈاؤن لوڈ کریں۔ پھر تصدیق کے لیے اکاؤنٹس کی شیٹ برآمد کریں۔',
    assign_bm: 'تفویض پینل',
    assign_warn: 'یہ پورے پورٹل میں واحد لکھائی ہے: ایک درخواست — آفٹر سیلز کی تفویض — صرف جدہ برانچ پر، اور صرف آپ کے دبانے سے بھیجی جاتی ہے۔ ہٹانا صرف اسی کا جسے آپ نشان لگائیں، اور ہر بار خالی شروع ہوتا ہے۔ گارڈ اس سے آگے جانے والے کسی نسخے کو مسترد کرتا ہے۔',
    team_roster_h: 'عہدے اور کون کس کے ماتحت',
    paste_empty: 'خانہ خالی ہے۔ مینیجر بک مارک کے ساتھ کچھ چسپاں کرنے کی ضرورت نہیں — اس کی محفوظ کردہ دونوں فائلیں «فائل منتخب کریں» سے چنیں۔',
    f4_outside: 'آپ کی ٹیم نے اس مدت میں گاہکوں کے ساتھ کوئی سرگرمی درج نہیں کی۔ مدت میں {n} سرگرمیاں ہیں، سب ٹیم کے باہر سے: {who}۔',
    f4_zero: 'اس مدت میں کسی نے بھی گاہکوں کے ساتھ کوئی سرگرمی درج نہیں کی۔',
    kpi_strip_note: 'مکمل: مدت کے اندر بند ہوئے، چاہے پہلے بنے ہوں — اس لیے تفویض شدہ سے زیادہ ہو سکتے ہیں۔ تفویض شدہ: مدت کے اندر بنے۔ تکمیل کی شرح: تفویض شدہ میں سے کتنے بند ہوئے۔ ابھی کھلے: کھینچنے کے لمحے بھی کھلے۔',
    team_by_myafaqy: 'مائی آفاقی کی ٹیم:',
    nav_weights: 'اوزان',
    weights_sub: 'ہر ٹاسک کی قسم اور گاہکوں کے ساتھ ہر سرگرمی کے پوائنٹس — واضح معیارات پر، اور قابلِ ترمیم۔',
    g_weights_h: 'اوزان — ہر قسم کے کام کے پوائنٹس',
    g_weights_b: 'مائی آفاقی میں ہر ٹاسک کی قسم کا ایک وزن ہے، اور گاہکوں کے ساتھ سرگرمی کے ہر زمرے کا بھی۔ مدت میں مکمل ہونے والا ٹاسک اپنے ذمہ دار کے لیے اپنی قسم کے وزن پر گنا جاتا ہے؛ سرگرمی «Done» ہونے پر اپنے زمرے کے وزن پر گنی جاتی ہے۔ اوزان چار واضح درجوں میں ہیں: ۱ تیز انتظامی کام، ۲ گاہک سے معاملہ یا تشخیص، ۳ بیرونی فریق سے ربط یا فیلڈ کوآرڈینیشن، ۵ کثیر مرحلہ کام۔ پوائنٹس اشاریوں کے بورڈ پر مکمل کی تعداد کے ساتھ دکھتے ہیں اور اس کی جگہ نہیں لیتے۔ کسی بھی قسم کا وزن فہرست سے بدلا جا سکتا ہے؛ تبدیلی اسی آلے پر رہتی ہے، اور سب کے لیے «weights.json» ڈاؤن لوڈ کر کے ریپوزٹری میں رکھا جاتا ہے۔ اوزان ہر سہ ماہی ڈیٹا کے ساتھ دیکھے جاتے ہیں۔',
    tier_admin: 'تیز انتظامی کام',
    tier_admin_why: 'نہ تشخیص نہ بیرونی فریق: گاڑیاں دکھانا، فعال کرنا، لاگ اِن کی معلومات، دستی ٹاسک۔',
    tier_customer: 'گاہک سے معاملہ یا تشخیص',
    tier_customer_why: 'گاہک کو جواب، مرمت کی شکایت، کیمروں کی جانچ، ایپ کا مسئلہ، ربط کی معلومات۔',
    tier_integration: 'بیرونی فریق سے ربط یا فیلڈ کوآرڈینیشن',
    tier_integration_why: 'وصل، مدینتی، رافد، نقابہ، ٹیکنیشن کے دورے کے ساتھ بندش، آلات کی کنفیگریشن کی جانچ، CAN ریڈنگز۔',
    tier_multistage: 'کثیر مرحلہ کام',
    tier_multistage_why: 'گاہک کی تربیت، گاڑیوں کے درمیان آلات کی منتقلی — تیاری، کوآرڈینیشن، تکمیل اور پیروی۔',
    tier_none: 'کوئی درجہ نہیں — طے شدہ وزن',
    wteam_aftersales: 'آفٹر سیلز',
    wteam_rd: 'تحقیق و ترقی',
    wteam_both: 'دونوں ٹیمیں',
    wteam_other: 'دوسری ٹیمیں',
    weights_rules: 'اصول: پوائنٹس تعداد کے ساتھ، اس کی جگہ نہیں · ہر قسم کا درجہ اور وجہ واضح · خود درج ٹاسک نظر آتے رہتے ہیں · ہر سہ ماہی ڈیٹا کے ساتھ جائزہ · کوئی بھی تبدیلی ریپوزٹری میں «weights.json» سے منظور ہوتی ہے۔',
    weights_download: 'weights.json ڈاؤن لوڈ کریں',
    weights_upload: 'weights.json اپ لوڈ کریں',
    weights_reset: 'ریپوزٹری کے اوزان پر واپس',
    weights_reviewed: 'آخری جائزہ: {d}',
    weights_loaded: 'اوزان کی فائل آ گئی۔',
    weights_tasks_h: 'ٹاسک کی اقسام کے اوزان',
    weights_acts_h: 'گاہکوں کی سرگرمیوں کے اوزان',
    w_col_type: 'ٹاسک کی قسم',
    w_col_team: 'ٹیم',
    w_col_tier: 'درجہ',
    w_col_n: 'آخری مدت کی تعداد',
    w_col_weight: 'وزن',
    w_col_points: 'پوائنٹس',
    w_col_category: 'سرگرمی کا زمرہ',
    weights_seen_note: 'تعداد آخری اپ لوڈ شدہ مدت ({range}) سے ہے۔ جس قسم کا وزن نہ ہو اس کے ساتھ نقطہ دکھتا ہے اور طے شدہ وزن لگتا ہے۔',
    col_points: 'وزنی پوائنٹس',
    kpi_sort_points: 'پوائنٹس کے مطابق',
    help_weights_tasks: 'ہر قطار مائی آفاقی کے نام سے ایک ٹاسک کی قسم ہے، اس کی ٹیم، اس کا درجہ، آخری مدت میں کتنی بار آئی، اس کا وزن اور پوائنٹس۔ فہرست سے وزن بدلیں تو بورڈ کے پوائنٹس فوراً بدل جاتے ہیں۔ تبدیلی اسی آلے پر رہتی ہے جب تک اوزان کی فائل ریپوزٹری میں نہ جائے۔',
    help_weights_acts: 'گاہکوں کی سرگرمیاں مائی آفاقی میں «After Sales Accounts ← Add Ticket» سے درج ہوتی ہیں۔ سرگرمی اپنے زمرے کے وزن پر صرف تب گنی جاتی ہے جب اس کی حالت «Done» ہو۔',
    help_points: 'وزنی پوائنٹس = (مدت میں مکمل ٹاسک × ان کی قسم کا وزن) + (گاہکوں کے ساتھ مکمل سرگرمیاں × ان کے زمرے کا وزن) کا مجموعہ۔ اوزان اور ان کی وجہ «اوزان» کے صفحے پر ہیں۔',
    help_f3: 'جدہ برانچ کے لیے مائی آفاقی کے «After Sales Board» سے: مدت کے لیے ہر ملازم کے کھلے، زیرِ التوا اور مکمل ٹکٹ۔ یہ رپورٹس فائل کے ساتھ آتا ہے — مینیجر بک مارک اسے خود کھینچتا ہے۔',
    help_f4: 'جو ہر انجینئر گاہک کے ساتھ درج کرتا ہے جب کام ٹاسک کے طور پر نہ آئے: سرگرمیوں کی تعداد، مختلف گاہک، کتنی ٹاسک بنیں، اور حالت اور زمرے کی تقسیم۔ اگر ٹیم نے کچھ درج نہ کیا ہو تو یہ صاف کہتا ہے۔',
    help_assign: 'ایک پینل جو آپ کے لاگ اِن سے مائی آفاقی کے اندر کھلتا ہے: جدہ کے آفٹر سیلز انجینئرز چنیں تو وہ جدہ کے ہر اکاؤنٹ میں شامل ہو جاتے ہیں؛ جو چلا گیا اسے نشان لگائیں تو ہٹ جاتا ہے۔ پہلے دس پر آزمائش پہلے/بعد کے جدول کے ساتھ، پھر باقی، پھر لاگ۔ کوئی نہیں ہٹتا جب تک آپ خود نشان نہ لگائیں۔',
    help_roster: 'ہر فرد کا عہدہ لکھیں اور چنیں کہ وہ کس کے ماتحت ہے۔ یہ ناموں سے نہیں، مائی آفاقی کی شناختوں سے محفوظ ہوتا ہے۔ عہدہ کارڈز اور جدولوں میں دکھتا ہے، اور جسے سربراہ لکھا جائے وہ «میری ٹیم» میں اپنے نیچے سب کو — ہر سطح پر — دیکھتا ہے۔',
    install_app: 'ایپ انسٹال کریں',
    install_done: 'ایپ انسٹال ہو گئی — آپ اسے ہوم اسکرین پر پائیں گے۔',
    install_ios: 'آئی فون اور آئی پیڈ پر، سفاری سے: نیچے شیئر بٹن (تیر والا مربع) دبائیں، پھر «Add to Home Screen»، پھر «Add»۔ اس کے بعد پورٹل الگ ایپ کی طرح کھلتا ہے اور خود تازہ ہوتا ہے۔',
    install_android: 'اینڈرائیڈ پر، کروم سے: مینو (اوپر تین نقطے) کھولیں اور «Install app» یا «Add to Home screen» چنیں۔ اس کے بعد پورٹل الگ ایپ کی طرح کھلتا ہے اور خود تازہ ہوتا ہے۔',
    install_desktop: 'ونڈوز پر، کروم یا ایج سے: ایڈریس بار میں انسٹال کا آئیکن (تیر والی اسکرین) دبائیں، یا مینو سے «Install». یہ اسٹارٹ مینو میں آتا ہے، الگ ونڈو میں کھلتا ہے اور خود تازہ ہوتا ہے۔',
    updated_to: 'پورٹل خود v{v} پر تازہ ہو گیا — نیا دیکھنے کے لیے مینو کے نیچے ورژن نمبر دبائیں۔',
    team_scope_n: '{n} دائرہ کار میں — صرف یہی بورڈ اور اشاریوں میں دکھتے ہیں',
    team_others: 'ڈیٹا میں نظر آنے والے دیگر جو دائرہ کار میں نہیں ({n}) — صرف کسی کو شامل کرنے کے لیے',
    team_others_hint: 'ان میں سے کوئی کسی صفحے پر نہیں دکھتا۔ جسے دائرہ کار میں لانا ہو اس کا عہدہ لکھیں یا سربراہ چنیں۔',
    f4_outside_n: 'آپ کی ٹیم نے اس مدت میں گاہکوں کے ساتھ کوئی سرگرمی درج نہیں کی۔ مدت میں {n} سرگرمیاں ہیں، سب دائرہ کار کے باہر سے۔',
    wteam_general: 'مائی آفاقی کی عام اقسام — کسی ٹیم سے منسلک نہیں',
    w_types_n: '{n} اقسام',
    w_from_myafaqy: 'فہرست مائی آفاقی سے آخری کھینچ کے مطابق',
    w_new_type: 'مائی آفاقی سے نئی قسم جس کا ابھی وزن نہیں — جب تک طے نہ ہو طے شدہ وزن لیتی ہے',
    w_col_editors: 'کون بدل سکتا ہے',
    w_admin_only: 'صرف ایڈمن',
    w_grant: 'دیں',
    w_grant_title: '«{type}» کا وزن کون بدل سکتا ہے؟',
    w_grant_hint: 'نشان لگائیں کون اس قسم کو بدل سکتا ہے۔ اس کی تبدیلی اس کے آلے پر رہتی ہے جب تک وہ آپ کو اوزان کی فائل بھیجے اور آپ اسے ریپوزٹری میں منظور کریں۔',
    w_is_admin: 'ایڈمن — تمام اقسام',
    w_you_admin: 'آپ اوزان کے ایڈمن ہیں: ہر قسم بدلتے ہیں اور «کون بدل سکتا ہے» کے کالم سے دوسروں کو مخصوص اقسام پر حق دیتے ہیں۔',
    w_you_some: 'آپ {n} اقسام بدل سکتے ہیں — باقی صرف پڑھنے کے لیے۔ تبدیلی کے بعد اوزان کی فائل ڈاؤن لوڈ کر کے منظوری کے لیے مینیجر کو بھیجیں۔',
    w_you_none: 'اوزان آپ کے لیے صرف پڑھنے کے لیے ہیں۔ کون بدل سکتا ہے، یہ اوزان کی فائل میں طے ہے۔',
    w_you_unknown: 'بدلنے کے لیے پہلے «میرے اشاریے» بک مارک دبائیں تاکہ پورٹل جانے کہ آپ کون ہیں — حقوق مائی آفاقی شناخت سے ہیں۔',
    card_h: 'مہینے کا کارڈ',
    card_sub: 'اس مہینے آپ کے کام کا انداز آپ کی ٹیم کے مقابلے میں — ہر سطر اپنے عدد کے ساتھ۔ مہینہ ختم ہونے پر خود بند ہو جاتا ہے اور اس کا کارڈ نہیں بدلتا۔',
    card_live: 'جاری',
    card_points: 'وزنی پوائنٹس',
    card_vs_prev: 'پچھلے مہینے سے {d} · {done} مکمل ٹاسک',
    card_quartile: '{q} · ٹیم کا وسط {med} پوائنٹس',
    card_rank: '{n} میں {r}واں درجہ · ٹیم کا وسط {med} پوائنٹس',
    card_consistency: '{w} ہفتوں پر {pct}٪ ہفتہ وار استحکام',
    card_radar: 'کام کا نقش: چار درجوں پر پوائنٹس کی تقسیم ٹیم کے مقابلے میں',
    card_me: 'میں',
    card_strengths: 'آپ کہاں نمایاں رہے',
    card_development: 'جو ترقی کا مستحق ہے',
    card_suggestions: 'اگلے مہینے کے لیے تجاویز',
    card_none_yet: 'ان اعداد پر ابھی کوئی واضح نمایاں بات نہیں — ہر قسم میں پانچ سے کم ٹاسک۔',
    card_none_dev: 'اس مہینے کوئی قابلِ توجہ اشارہ نہیں۔',
    card_none_sug: 'ابھی کوئی تجویز نہیں — اعداد کم ہیں۔',
    card_on_leave: 'چھٹی پر',
    card_team_h: 'آپ کی ٹیم کے کارڈ ({n})',
    card_print: 'کارڈ پرنٹ کریں',
    card_closed: '{m} کا کارڈ بند ہو گیا — اب نہیں بدلے گا۔',
    card_arch: 'انداز',
    quartile_1: 'ٹیم کے اوپری چوتھائی میں',
    quartile_2: 'ٹیم کے وسط سے اوپر',
    quartile_3: 'ٹیم کے وسط سے نیچے',
    quartile_4: 'ٹیم کے نچلے چوتھائی میں',
    arch_field: 'فیلڈ ایگزیکیوٹر',
    arch_field_why: 'ربط، فیلڈ کوآرڈینیشن اور کثیر مرحلہ کام ٹیم کے حصے سے ایک تہائی یا زیادہ۔',
    arch_voice: 'گاہک کی آواز',
    arch_voice_why: 'گاہکوں سے معاملہ اور تشخیص ٹیم کے حصے سے ایک تہائی یا زیادہ۔',
    arch_volume: 'حجم کا انجن',
    arch_volume_why: 'ٹیم کے وسط سے زیادہ حجم، تیز کاموں پر مرکوز۔',
    arch_balanced: 'متوازن',
    arch_balanced_why: 'چاروں درجوں میں آپ کی تقسیم ٹیم جیسی ہے۔',
    arch_early: 'فیصلے کے لیے کم',
    arch_early_why: 'اس مہینے دس سے کم پوائنٹس — اتنے سے کوئی انداز اخذ نہیں ہوتا۔',
    tier_short_admin: 'انتظامی',
    tier_short_customer: 'گاہک',
    tier_short_integration: 'ربط',
    tier_short_multistage: 'مراحل',
    str_spec: '«{type}» میں مہارت: ٹیم کے {pct}٪ ({n}) آپ نے مکمل کیے جبکہ آپ ٹیم کے حجم کا {my}٪ ہیں۔',
    str_speed: '«{type}» میں ٹیم میں سب سے تیز: آپ کا وسط {me} بمقابلہ ٹیم {team}۔',
    str_initiative: 'پہل: آپ نے ٹاسکس سے باہر {c} گاہکوں کے ساتھ {n} سرگرمیاں درج کیں۔',
    dev_tierGap: '«{tier}» درجہ ٹیم کے کام کا {team}٪ ہے اور آپ کے کام کا {mine}٪۔',
    dev_slow: '«{type}»: آپ کا وسط {me} بمقابلہ ٹیم {team}۔',
    dev_self: 'آپ کے {pct}٪ ٹاسک خود درج شدہ ہیں — لیڈر کے ساتھ جائزہ۔',
    dev_aging: '{n} ٹاسک {days} دن سے زیادہ کھلے ہیں۔',
    dev_rate: 'اس مہینے تفویض شدہ کام کی تکمیل {pct}٪۔',
    sug_stretch: 'توسیع: «{type}» ({tier} درجہ) تفویض کریں — ٹیم نے {n} کیے اور اس نے بہت کم۔',
    sug_invest: 'سرمایہ کاری: مزید «{type}» — ٹیم میں اس پر سب سے تیز ({me} بمقابلہ {team})۔',
    sug_balanceUp: 'توازن: {pts} پوائنٹس بمقابلہ وسط {med} — «{type}» جیسے تیز ٹاسک بڑھائیں۔',
    sug_balanceDeep: 'توازن: {pts} پوائنٹس بمقابلہ وسط {med} — حجم کے بجائے «{type}» جیسا کثیر مرحلہ کام دیں۔',
    heat_h: 'ٹیم کا نقشہ — {m}',
    heat_sub: 'ہر فرد کے ہر درجے میں وزنی پوائنٹس۔ گہرا زیادہ ہے۔ دکھاتا ہے کام کہاں جمع ہے اور کہاں خالی۔',
    plan_h: 'اگلے مہینے کا منصوبہ',
    plan_sub: 'ہر فرد کا کارڈ تفویض کی تجاویز کے ساتھ — واضح اصول اور لکھی ہوئی وجہ سے۔ مینیجر اور لیڈرز کے لیے۔',
    plan_none: 'ابھی کوئی تجویز نہیں — اعداد کم ہیں۔',
    help_card: 'مہینے کا کارڈ اعداد سے آپ کے کام کا انداز بیان کرتا ہے: ٹیم کے وسط کے مقابلے میں آپ کا حجم اور آپ کی چوتھائی، چار درجوں پر آپ کا نقش، آپ کہاں نمایاں رہے (مہارت، رفتار، پہل) اور کیا ترقی کا مستحق ہے۔ ہر سطر اپنا عدد رکھتی ہے۔ ختم شدہ مہینہ بند ہوتا ہے اور اس کا کارڈ نہیں بدلتا۔ لیڈر اپنے لوگوں کے کارڈ تفویض کی تجاویز کے ساتھ دیکھتے ہیں۔',
    help_heat: 'ہر قطار ایک فرد اور ہر کالم ایک درجہ؛ عدد وہاں اس کے وزنی پوائنٹس اور رنگ اس کی مقدار۔ ایک نظر بتاتی ہے ٹیم کہاں مرکوز ہے اور خلا کہاں۔',
    help_plan: 'تین اصول تجاویز بناتے ہیں: توسیع (اونچے درجے کی قسم جو ٹیم کرتی ہے)، سرمایہ کاری (وہ قسم جس میں یہ فرد سب سے تیز ہے)، توازن (وسط سے نیچے: تیز ٹاسک؛ اوپری چوتھائی: کثیر مرحلہ کام)۔ ہر تجویز اپنی وجہ کے ساتھ۔',
    card_team_legend: 'ٹیم',
    week_h: 'ہفتہ ایک نظر میں',
    week_total: 'وزنی پوائنٹس: اس ہفتے {p} بمقابلہ پچھلے ہفتے {q}',
    week_total_l: 'پوائنٹس پچھلے ۷ دنوں میں · اس سے پہلے کے ۷ میں {q} ({d})',
    week_movers: 'سب سے زیادہ بہتری',
    week_drops: 'تیز کمی',
    week_aging: 'بہت دیر سے کھلا کام',
    week_on_leave: 'چھٹی پر — کمی شمار نہیں: {who}',
    week_share: 'شیئر کریں',
    help_week: 'دائرہ کار کے لیے پچھلے سات دن بمقابلہ ان سے پہلے کے سات: کس نے سب سے زیادہ بہتری کی، کون ۴۰٪ یا زیادہ گرا (دس یا زیادہ پوائنٹس سے)، اور کس کے ٹاسک سات دن سے زیادہ کھلے ہیں۔ چھٹی والا کمی شمار نہیں ہوتا۔ «شیئر» خلاصہ متن کے طور پر واٹس ایپ یا ٹیمز سے بھیجتا یا کاپی کرتا ہے۔',
    f5_title: 'پانچواں اشاریہ — اکاؤنٹس کی کوریج',
    f5_sub: 'جدہ کے اکاؤنٹس: {n} اکاؤنٹس اور {d} آلات · {u} اکاؤنٹس جن پر دائرہ کار کا کوئی نہیں · {z} اکاؤنٹس بغیر جڑے آلے کے۔',
    f5_accounts: 'اکاؤنٹس',
    f5_devices: 'آلات',
    f5_solo: 'اکیلا انجینئر',
    f5_touched: 'مدت میں رابطہ',
    f5_none: 'اس مدت کی فائل میں اکاؤنٹس نہیں — v8.5 سے مینیجر بک مارک سے کھینچیں۔',
    help_f5: 'جدہ برانچ کے لیے مائی آفاقی کی «After Sales Accounts» اسکرین سے: ہر انجینئر پر کتنے اکاؤنٹس، کتنے آلات، کتنوں پر وہ اکیلا ہے، اور مدت میں درج سرگرمی سے کتنوں سے رابطہ کیا۔ صرف اکاؤنٹ شناختوں سے، گاہکوں کے ناموں کے بغیر۔',
    meet_open: '📝 ماہانہ ملاقات',
    meet_edit: '📝 ملاقات میں ترمیم',
    meet_title: '{name} سے ملاقات — {m}',
    meet_private: 'صرف اسی آلے پر محفوظ، کبھی ریپوزٹری میں نہیں۔ دوسرے آلے پر «ملاقاتیں برآمد کریں» سے منتقل کریں۔',
    meet_note: 'ملاقات کے نوٹس',
    meet_note_ph: 'ملاقات میں کیا بات ہوئی، اور کارڈ نے کیا دکھایا…',
    meet_agreed: 'اگلے مہینے کے لیے کیا طے ہوا',
    meet_agreed_ph: 'مثلاً: زیادہ وصل ربط لے، اور پرانے کھلے ٹاسک بند کرے۔',
    meet_goals: 'مہینے کے اہداف',
    meet_add_goal: '+ ہدف',
    meet_save: 'محفوظ کریں',
    meet_saved: 'ملاقات محفوظ ہو گئی۔',
    meet_prev_agreed: 'پچھلے مہینے طے ہوا:',
    meet_done: 'ہو گیا',
    meet_export: 'ملاقاتیں برآمد کریں',
    meet_import: 'ملاقاتیں درآمد کریں',
    meet_imported: 'ملاقاتیں آ گئیں۔',
    goal_points: 'وزنی پوائنٹس',
    path_h: 'مہینوں میں انداز کا سفر',
    path_soon: 'سفر دوسرے بند مہینے سے دکھتا ہے — ہر ختم ہونے والا مہینہ خود شامل ہوتا ہے۔',
    help_path: 'ہر بند مہینے کے لیے: انداز، پوائنٹس اور چوتھائی۔ یہ دکھاتا ہے ہر فرد کا کام کیسے بدلتا ہے — مثلاً «حجم کا انجن» سے «فیلڈ ایگزیکیوٹر» تک — جو سالانہ جائزے کا موضوع ہے۔',
  },
};

// The user guide: one list, read by the page (Guide tab) and by scripts/build-manual.mjs, so they can never differ.
export const GUIDE = [['g_tools_h', 'g_tools_b'], ['g_me_h', 'g_me_b'], ['g_team_h', 'g_team_b'], ['g_weights_h', 'g_weights_b'], ['g_mgr_h', 'g_mgr_b'], ['g_pro_h', 'g_pro_b'], ['g_data_h', 'g_data_b'], ['g_parts_h', 'g_parts_b'], ['g_kpi_h', 'g_kpi_b'], ['g_privacy_h', 'g_privacy_b']];
export const DEFINITIONS = ['def_1', 'def_2', 'def_3', 'def_4', 'def_5', 'def_6', 'def_7', 'def_8', 'def_9', 'def_10'];

export function t(lang, key, vars = {}) {
  const s = (STRINGS[lang] && STRINGS[lang][key]) ?? STRINGS.ar[key] ?? key;
  return String(s).replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? `{${k}}`));
}
export const L = (obj, lang) => (obj && (obj[lang] || obj.ar || obj.en)) || '';

// ===================== dates and period blocks =====================
const pad = (n) => String(n).padStart(2, '0');
export const ymd = (d) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;

/** "Today" in Saudi time, as a UTC-midnight date (so month arithmetic never drifts across a time zone). */
export function saudiToday(now = new Date()) {
  const s = new Date(now.getTime() + 3 * 3600000);
  return new Date(Date.UTC(s.getUTCFullYear(), s.getUTCMonth(), s.getUTCDate()));
}

/**
 * Calendar-aligned blocks of `months` (3 = quarters, 6 = halves, 12 = years), most recent first.
 * The current block ends today and is marked partial.
 */
export function periodBlocks(months, count, now = new Date()) {
  if (![3, 6, 12].includes(months)) throw new Error('months must be 3, 6 or 12');
  const today = saudiToday(now);
  const startMonth = Math.floor(today.getUTCMonth() / months) * months;
  let start = new Date(Date.UTC(today.getUTCFullYear(), startMonth, 1));
  const out = [];
  for (let i = 0; i < Math.max(1, Math.min(count, 12)); i++) {
    const nextStart = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + months, 1));
    const lastDay = new Date(nextStart.getTime() - 86400000);
    const partial = i === 0 && lastDay > today;
    out.push({ from: ymd(start), to: ymd(partial ? today : lastDay), months, partial, label: blockLabel(start, months) });
    start = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() - months, 1));
  }
  return out;
}

function blockLabel(start, months) {
  const y = start.getUTCFullYear();
  if (months === 12) return String(y);
  if (months === 6) return `H${start.getUTCMonth() < 6 ? 1 : 2} ${y}`;
  return `Q${Math.floor(start.getUTCMonth() / 3) + 1} ${y}`;
}

export const rangeKey = (r) => `${r.from}_${r.to}`;

// ===================== the prompt for Claude in Chrome =====================
// Endpoints, fields and pitfalls below come from the capture of 28 Oct 2026 (summarised in docs/crm-api.md) —
// every one was observed in the app's own traffic. Nothing here is inferred from a screen name.

/** The app's own filter convention: a Saudi calendar day starts at 21:00Z the day before. */
export function saudiBoundsZ(from, to) {
  const start = new Date(Date.parse(`${from}T00:00:00${TZ_OFFSET}`)).toISOString();
  const end = new Date(Date.parse(`${to}T00:00:00${TZ_OFFSET}`) + 86400000).toISOString();
  return [start, end];
}

export function buildPrompt({ from, to, today = null }) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to) || from > to) throw new Error('invalid range');
  const [fromZ, toZ] = saudiBoundsZ(from, to);
  const todayYmd = today || ymd(saudiToday());
  const [, nowZ] = saudiBoundsZ(todayYmd, todayYmd);
  const later = to < todayYmd;
  return `You are extracting task data from the myafaqy CRM (https://myafaqy.com, API at https://crmbackend.afaqy.sa) for a read-only KPI dashboard. I am signed in with my own manager account in this tab.

ABSOLUTE RULE — NOTHING MAY CHANGE IN MYAFAQY
- You may call ONLY these four endpoints, exactly as named:
    Security/GetAllHierarchyUsersDropDown · Teams/GetAllTeams · Teams/GetTeamById · Task/GetMyTasksGrid
- Never call anything else. Never call any endpoint whose name contains Add, Create, Insert, Edit, Update, Delete, Remove, Save, Assign, Reassign, Close, Complete, Approve, Reject, Sync, Send, Upload, Import, Change, Set, Mark, Read, Seen, Logout.
- Never press any button in the page. Never change any filter, sort, column or setting on screen.
- myafaqy uses POST to READ lists; that is expected. The four names above are reads.
- If anything is unclear, or the app now needs a different endpoint, STOP and ask me. Do not improvise.

PERIOD: ${from} to ${to}, Saudi time (UTC+3). In the app's own filter format that is:
  completedOn: ["${fromZ}", "${toZ}"]

STRICT RULES
1. READ-ONLY. Never press any button that writes or changes data (Save, Add, Create, Edit, Assign, Close, Complete, Approve, Delete, Sync, Send, Comment). Reading lists, opening details and paging are fine.
2. NEVER GUESS AN API PATH. The endpoints below were recorded from this app's own traffic on 28 Oct 2026. Before replaying any of them, open the screen that uses it once and confirm in the network traffic that the app still sends it the same way. If it differs, use what the app sends now and say so in "notes". Change only the date window, the page number and the page size.
3. Replaying an observed request from this page with your JavaScript tool is allowed: it is a read. Reuse the headers the app sends (Authorization, X-Timezone-Offset, X-Client-Id, lang). Wait 300 ms between calls.
4. Do NOT open tasks one by one. The completion time is in the grid row ("closeDate"); who completed a task is not needed.
5. Never put tokens, cookies, passwords, phone numbers, identity numbers or e-mail bodies in your answer.

STEP 1 — PEOPLE
a. POST https://crmbackend.afaqy.sa/Security/GetAllHierarchyUsersDropDown
   body {"pageSize":1000,"pageNumber":0,"searchCriteria":"","selectedId":[]} → id, nameEn, nameAr.
b. POST https://crmbackend.afaqy.sa/Teams/GetAllTeams with the standard grid body
   {"isSearchFilter":false,"searchKey":"","search":{},"pageSize":10,"pageNumber":0,"searchCriteria":"","dateRangeIntialDaysCount":0}
   (page through all pages), then GET https://crmbackend.afaqy.sa/Teams/GetTeamById/{id} for each team →
   groupUsersDto[].userId, the team's nameEn and branchCode.

STEP 2 — TASKS: POST https://crmbackend.afaqy.sa/Task/GetMyTasksGrid with "taskGroupId": 100001 (All Tasks), in the body the app sends:
   {"donePageNumber":0,"donePageSize":20,"openPageNumber":0,"openPageSize":20,"toDoPageNumber":0,"toDoPageSize":20,
    "orderBy":1,"taskGroupId":100001,"searchKey":"","tasksGridStatusId":1,
    "assignedBy":[],"createdBy":[],"agent":[],"statusIds":[],"type":[],"priority":[],"assignedOn":[],"completedOn":[]}
   The response has three buckets (toDo, open, done) that page INDEPENDENTLY: to walk one bucket, increment only its page number.
   Page size: send 500 (the server honoured 500 on 29 Oct 2026); if a bucket's "pageSize" comes back smaller, use what it returns.
a. DONE IN THE PERIOD: set "completedOn": ["${fromZ}", "${toZ}"]. Record done.listCount as "doneInRangeTotal". Walk the whole done bucket.${later ? `
b. CREATED IN THE PERIOD, DONE LATER: set "completedOn": ["${toZ}", "${nowZ}"]. Walk the done bucket and keep only rows whose createdOn falls inside the period.` : ''}
${later ? 'c' : 'b'}. OPEN NOW: send "completedOn": []. Walk the toDo and open buckets completely (ignore done here). Record toDo.listCount + open.listCount as "openTotal".
${later ? 'd' : 'c'}. THE R&D QUEUE: repeat ${later ? 'a and c' : 'a and b'} with "taskGroupId": 12 (R&D Tasks) instead of 100001, and list the ids of every task it returns as "rdTaskIds". Nothing else from these calls.

TIMES: createdOn and closeDate carry no time zone and are UTC (verified 29 Oct 2026: a task shown 12:30 PM on screen came back 09:30:41). Write every time as returned with "Z" added (for example 2026-10-29T09:30:41Z), and confirm the check on one task in "notes".

DO NOT USE: "dateOfCompletion" (always null), "isAutomaticTask" (contradicts itself between the grid and the detail), the "createdBy" / "assignee" name strings (unreliable — names come from step 1), "type" and "priorty" (always null).

WHAT TO RETURN
The result is one JSON document, exactly in this format:

{
  "schema": "${SCHEMA}",
  "range": { "from": "${from}", "to": "${to}" },
  "extractedAt": "<ISO date-time now>",
  "taskGroupId": 100001,
  "source": { "endpoint": "POST https://crmbackend.afaqy.sa/Task/GetMyTasksGrid", "doneInRangeTotal": <n>, "openTotal": <n>, "pageSize": <20 or 100> },
  "people": [
    { "id": "<user id>", "nameEn": "<nameEn>", "nameAr": "<nameAr>", "teams": ["<team nameEn>"], "branchCode": "<branch code of their team, or null>" }
  ],
  "tasks": [
    {
      "id": "<id>",
      "title": "<title>",
      "typeId": <taskSettingId>,
      "type": "<taskType>",
      "statusId": <statusId>,
      "state": "<open | done | cancelled>",
      "createdAt": "<createdOn with offset>",
      "createdById": "<createUserId>",
      "assigneeId": "<assigneeId>",
      "completedAt": "<closeDate with offset, only when state is done; otherwise null>",
      "moduleId": <moduleId>,
      "customer": "<customerTag or null>",
      "bucket": "<done | open | toDo>"
    }
  ],
  "rdTaskIds": ["<id of every task in the R&D queue (taskGroupId 12) from step 2>"],
  "notes": ["<the time offset you established, anything the app now sends differently, filters you could not apply>"]
}

MAPPING
- "state": "cancelled" when isCancelled is true; otherwise "done" when statusId is 3; otherwise "open".
- "people": only users who appear in "tasks" as assignee or creator.

THE RESULT — ONE FILE ON MY COMPUTER, NOT IN CHAT
Build the JSON in the page and save it as ONE file with a download (a Blob and an <a download> link) named afaqy-tasks-${from}_${to}.json. Do not paste it. Then reply with only four lines: the file name, the number of tasks in it, doneInRangeTotal, and "No write endpoint was called."
Only if a download is impossible: paste it instead, split into parts if needed — the same format in every part with an added field "part": "1/3", "2/3", "3/3", each holding a different slice of "tasks" (put "people" in part 1).`;
}

// ===================== reading what Claude in Chrome returns =====================
export const SCHEMAS = ['afaqy-crm-tasks/v1', SCHEMA];
const STATES = new Set(['open', 'done', 'cancelled']);
export const EMAIL_MODULE = 146;          // "Email Customer Activity" — the reliable e-mail marker (capture 28 Oct 2026)
export const JEDDAH_BRANCH = '2';

/** Pull the first JSON object out of free text (a code block, or a bare object). */
export function extractJson(text) {
  const s = String(text ?? '');
  const fenced = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : s;
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start < 0 || end <= start) return null;
  try { return JSON.parse(candidate.slice(start, end + 1)); } catch { return null; }
}

/**
 * myafaqy's raw times carry no zone mark and are UTC — verified 29 Oct 2026 against the screen on four tasks (shown
 * 12:30 PM, returned 09:30:41; X-Timezone-Offset -180). A zone-less time is therefore read as UTC, on any machine.
 * (Until v6.6 it was read as Saudi time: three hours late.) A time that carries its zone is respected as written.
 */
export function toIso(v) {
  if (v == null || v === '') return null;
  let s = String(v).trim();
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/.test(s)) s += 'Z';
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}
const idOf = (v) => (v == null || v === '' ? null : String(v));

/** The Saudi calendar day of an ISO instant, as YYYY-MM-DD. */
export const saudiDay = (iso) => (iso ? ymd(new Date(Date.parse(iso) + 3 * 3600000)) : null);

/**
 * Validate and normalise one uploaded part (v1 or v2). Returns { dataset, skipped } or { error, vars }.
 * Rows missing an id, a creation time or an assignee are skipped and counted, never invented.
 */
export function parseDataset(text) {
  const raw = typeof text === 'string' ? extractJson(text) : text;
  if (!raw || typeof raw !== 'object') return { error: 'err_json' };
  if (!SCHEMAS.includes(raw.schema)) return { error: 'err_schema', vars: { schema: SCHEMA } };
  const v2 = raw.schema === SCHEMA;
  const from = raw.range && raw.range.from, to = raw.range && raw.range.to;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from || '') || !/^\d{4}-\d{2}-\d{2}$/.test(to || '') || from > to) return { error: 'err_range' };
  if (!Array.isArray(raw.tasks)) return { error: 'err_tasks' };
  let skipped = 0;
  const tasks = [];
  for (const r of raw.tasks) {
    const createdAt = toIso(r && r.createdAt);
    if (!r || r.id == null || !createdAt || (r.assigneeId == null && !r.assigneeName)) { skipped++; continue; }
    const state = STATES.has(r.state) ? r.state : 'open';
    const moduleId = Number.isFinite(+r.moduleId) && r.moduleId !== null ? +r.moduleId : null;
    tasks.push({
      id: String(r.id), title: String(r.title || ''), type: String(r.type || ''),
      typeId: Number.isFinite(+r.typeId) && r.typeId !== null ? +r.typeId : null,
      state, createdAt, createdById: idOf(r.createdById), createdByName: String(r.createdByName || ''),
      assigneeId: idOf(r.assigneeId), assigneeName: String(r.assigneeName || ''),
      assignedToGroup: !v2 && r.assignedToGroup === true,
      completedAt: state === 'done' ? toIso(r.completedAt) : null,
      completedById: idOf(r.completedById), completedByName: String(r.completedByName || ''),
      // v2: the e-mail marker is the module, never the creator; v1 carried its own flag
      fromEmail: v2 ? moduleId === EMAIL_MODULE : (r.fromEmail === true ? true : r.fromEmail === false ? false : null),
      moduleId, customer: r.customer == null ? null : String(r.customer),
      bucket: ['done', 'open', 'toDo'].includes(r.bucket) ? r.bucket : null,
    });
  }
  const people = Array.isArray(raw.people) ? raw.people.filter((p) => p && p.id != null).map((p) => ({
    id: String(p.id), nameEn: String(p.nameEn || ''), nameAr: String(p.nameAr || ''),
    teams: Array.isArray(p.teams) ? p.teams.map(String) : [], branchCode: p.branchCode == null ? null : String(p.branchCode),
  })) : [];
  const num = (v) => (v != null && Number.isFinite(+v) ? +v : null);
  const src = raw.source || {};
  return {
    dataset: {
      key: (raw.sample === true ? 'sample:' : '') + rangeKey({ from, to }), schema: raw.schema, range: { from, to },
      extractedAt: toIso(raw.extractedAt), endpoint: String(src.endpoint || ''),
      doneInRangeTotal: v2 ? num(src.doneInRangeTotal) : null, openTotal: v2 ? num(src.openTotal) : null,
      crmTotal: v2 ? null : num(src.crmTotal),
      notes: Array.isArray(raw.notes) ? raw.notes.map(String).slice(0, 50) : [],
      part: typeof raw.part === 'string' ? raw.part : null, sample: raw.sample === true,
      people, tasks: markRd(tasks, raw.rdTaskIds),
      rdKnown: Array.isArray(raw.rdTaskIds),
      teamTypes: Object.fromEntries(Object.entries(raw.teamTypes && typeof raw.teamTypes === 'object' ? raw.teamTypes : {}).slice(0, 40)
        .map(([tm, arr]) => [String(tm).slice(0, 80), (Array.isArray(arr) ? arr : []).slice(0, 200).filter((x) => x && (x.nameEn || x.nameAr)).map((x) => ({ id: x.id == null ? null : String(x.id), nameEn: String(x.nameEn || '').slice(0, 80), nameAr: String(x.nameAr || '').slice(0, 80) }))])),
    },
    skipped,
  };
}

const markRd = (tasks, ids) => {
  if (!Array.isArray(ids)) return tasks;
  const set = new Set(ids.map(String));
  return tasks.map((x) => (set.has(x.id) ? { ...x, rd: true } : x));
};

/** Add a part to the stored datasets: same period → tasks and people merged by id (the newer copy wins). */
export function mergeDataset(list, incoming) {
  const out = (list || []).map((d) => ({ ...d }));
  const i = out.findIndex((d) => d.key === incoming.key);
  if (i < 0) { out.push({ ...incoming, people: incoming.people || [], parts: incoming.part ? [incoming.part] : [] }); }
  else {
    const byId = new Map(out[i].tasks.map((x) => [x.id, x]));
    for (const x of incoming.tasks) byId.set(x.id, x);
    const ppl = new Map((out[i].people || []).map((p) => [p.id, p]));
    for (const p of incoming.people || []) ppl.set(p.id, p);
    out[i] = {
      ...out[i], tasks: [...byId.values()], people: [...ppl.values()],
      crmTotal: incoming.crmTotal ?? out[i].crmTotal,
      doneInRangeTotal: incoming.doneInRangeTotal ?? out[i].doneInRangeTotal,
      openTotal: incoming.openTotal ?? out[i].openTotal,
      notes: [...new Set([...(out[i].notes || []), ...(incoming.notes || [])])],
      parts: [...new Set([...(out[i].parts || []), ...(incoming.part ? [incoming.part] : [])])],
      extractedAt: incoming.extractedAt || out[i].extractedAt,
      sample: out[i].sample && incoming.sample,
      teamTypes: incoming.teamTypes && Object.keys(incoming.teamTypes).length ? incoming.teamTypes : out[i].teamTypes,
      rdKnown: out[i].rdKnown || incoming.rdKnown,
    };
  }
  return out.sort((a, b) => (a.range.from < b.range.from ? 1 : -1));
}

const inRange = (iso, range) => {
  if (!range) return true;
  const d = saudiDay(iso);
  return d != null && d >= range.from && d <= range.to;
};

/**
 * Complete when what arrived matches what the CRM itself counted. v2 checks both the tasks completed in the
 * period and the open ones; v1 checks its single total. Unknown when the CRM gave no count.
 */
export function completeness(ds) {
  if (ds.schema === SCHEMA) {
    const checks = [];
    if (ds.doneInRangeTotal != null) checks.push([ds.tasks.filter((x) => x.state === 'done' && inRange(x.completedAt, ds.range)).length, ds.doneInRangeTotal]);
    if (ds.openTotal != null) checks.push([ds.tasks.filter((x) => x.state === 'open').length, ds.openTotal]);
    if (!checks.length) return { known: false, complete: null, got: ds.tasks.length, want: null };
    const got = checks.reduce((s, c) => s + c[0], 0), want = checks.reduce((s, c) => s + c[1], 0);
    return { known: true, complete: checks.every(([g, w]) => g >= w), got, want };
  }
  if (ds.crmTotal == null) return { known: false, complete: null, got: ds.tasks.length, want: null };
  return { known: true, complete: ds.tasks.length >= ds.crmTotal, got: ds.tasks.length, want: ds.crmTotal };
}

// ===================== people and the team =====================
/** Everyone the data mentions: the people list first, then any assignee or creator it does not name. */
export function peopleOf(datasets) {
  const map = new Map();
  for (const d of datasets || []) {
    for (const p of d.people || []) map.set(p.id, { ...(map.get(p.id) || {}), ...p });
    for (const x of d.tasks || []) {
      if (x.assignedToGroup) continue;
      if (x.assigneeId && !map.has(x.assigneeId)) map.set(x.assigneeId, { id: x.assigneeId, nameEn: x.assigneeName, nameAr: x.assigneeName, teams: [], branchCode: null });
    }
  }
  return [...map.values()];
}
export const nameOf = (p, lang) => (p ? ((lang === 'en' ? p.nameEn : p.nameAr) || p.nameEn || p.nameAr || p.id) : '');

/** The default team: everyone in a Jeddah-branch team; if the data names no branches, everyone assigned a task. */
// Teams that are not technical: left out of the default when they are a person's only teams (the manager can tick them).
export const NON_TECH_TEAMS = /^jeddah[- ]+(sales|collection) team$/i;
const inJeddah = (p) => p.branchCode === JEDDAH_BRANCH || (p.teams || []).some((t) => /jeddah|جدة/i.test(t));
const onlyNonTech = (p) => (p.teams || []).length > 0 && p.teams.every((t) => NON_TECH_TEAMS.test(String(t).trim()));
export function defaultTeam(people, tasks) {
  // Jeddah = a team on branch 2, or a team whose name says Jeddah (a person's own branch code follows only one of their
  // teams — on 29 Oct 2026 an after-sales engineer carried a Riyadh code through his second team)
  const jeddah = (people || []).filter((p) => inJeddah(p) && !onlyNonTech(p)).map((p) => p.id);
  if (jeddah.length) return jeddah;
  return [...new Set((tasks || []).filter((x) => !x.assignedToGroup).map((x) => x.assigneeId).filter(Boolean))];
}

// ===================== Factor 1 =====================
const median = (xs) => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b), m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
export const GROUP = '__group__';

/**
 * A task its assignee opened for himself — in this team, the requests that arrive by WhatsApp or by phone and get logged
 * by the engineer. myafaqy records who created a task but not the channel, so WhatsApp and calls cannot be told apart.
 * From the manager's file: creator id equals assignee id. From «My KPIs»: the bookmark's own flag (it never hands over ids).
 */
export const isSelfLogged = (x) => x.fromEmail !== true && (x.own === true || (x.createdById != null && x.createdById === x.assigneeId));

/**
 * Who a task counts for: its assignee. (The v1 format could mark a group task; it then counts for whoever completed
 * it, or stays on the group line. myafaqy rows carry no group flag — capture of 28 Oct 2026.)
 */
export function creditOf(task) {
  if (!task.assignedToGroup) return { id: task.assigneeId || task.assigneeName, name: task.assigneeName || task.assigneeId };
  if (task.state === 'done' && (task.completedById || task.completedByName)) return { id: task.completedById || task.completedByName, name: task.completedByName || task.completedById };
  return { id: GROUP, name: GROUP };
}

/**
 * Factor 1 for one period.
 *   received   tasks created in the period (the cohort)
 *   done       tasks completed in the period — what the CRM's own completedOn filter counts
 *   rate       share of the received cohort completed by the time of extraction, cancelled excluded
 *   avg/median creation → completion, over the tasks completed in the period
 *   open       open right now (a snapshot at extraction, whatever the creation date)
 * `team` (a list of ids) keeps only those people; without it everyone counts.
 */
export function factor1(tasks, { range = null, team = null } = {}) {
  const keep = team ? new Set(team) : null;
  const rows = new Map();
  const row = (id, name) => {
    if (!rows.has(id)) rows.set(id, { id, name, assigned: 0, done: 0, cohortDone: 0, open: 0, cancelled: 0, created: 0, fromEmail: 0, selfLogged: 0, rd: 0, durations: [] });
    const r = rows.get(id);
    if (name && (!r.name || r.name === r.id)) r.name = name;
    return r;
  };
  if (keep) for (const id of keep) row(id, id);
  for (const x of tasks || []) {
    const c = creditOf(x);
    if (keep && c.id !== GROUP && !keep.has(c.id)) continue;
    const received = inRange(x.createdAt, range);
    const doneHere = x.state === 'done' && (range ? inRange(x.completedAt, range) : true);
    if (!received && !doneHere && x.state !== 'open') continue;
    const r = row(c.id, c.name);
    if (received) {
      r.assigned++;
      if (x.state === 'done') r.cohortDone++;
      if (x.state === 'cancelled') r.cancelled++;
      if (x.fromEmail === true) r.fromEmail++;
      else if (isSelfLogged(x)) r.selfLogged++;
    }
    if (doneHere) {
      r.done++;
      if (x.rd === true) r.rd++;
      if (x.completedAt) {
        const h = (Date.parse(x.completedAt) - Date.parse(x.createdAt)) / 3600000;
        if (h >= 0) r.durations.push(h);
      }
    }
    if (x.state === 'open') r.open++;
  }
  // "created" is a separate view: who opened tasks in the period themselves (e-mail tasks excluded)
  for (const x of tasks || []) {
    if (x.fromEmail === true || !(x.createdById || x.createdByName) || !inRange(x.createdAt, range)) continue;
    const id = x.createdById || x.createdByName;
    // a creator becomes a row only if chosen in the team, or already holding tasks — so the CRM's system account
    // (which opens the work-order tasks) never appears as if it were an employee
    if (keep ? !keep.has(id) : !rows.has(id)) continue;
    row(id, x.createdByName).created++;
  }
  const finish = (r) => {
    const counted = r.assigned - r.cancelled;
    return {
      id: r.id, name: r.name, assigned: r.assigned, done: r.done, open: r.open, cancelled: r.cancelled, created: r.created, fromEmail: r.fromEmail, selfLogged: r.selfLogged, rd: r.rd,
      rate: counted > 0 ? r.cohortDone / counted : null,
      avgHours: mean(r.durations), medianHours: median(r.durations), timed: r.durations.length,
    };
  };
  const people = [...rows.values()].filter((r) => r.id !== GROUP && (r.assigned > 0 || r.created > 0 || r.done > 0 || r.open > 0 || (keep && keep.has(r.id)))).map(finish)
    .sort((a, b) => b.done - a.done || b.assigned - a.assigned || String(a.name).localeCompare(String(b.name)));
  const group = rows.has(GROUP) ? finish(rows.get(GROUP)) : null;
  const all = { id: '__team__', name: '__team__', assigned: 0, done: 0, cohortDone: 0, open: 0, cancelled: 0, created: 0, fromEmail: 0, selfLogged: 0, rd: 0, durations: [] };
  for (const r of rows.values()) {
    all.assigned += r.assigned; all.done += r.done; all.cohortDone += r.cohortDone; all.open += r.open; all.cancelled += r.cancelled;
    all.fromEmail += r.fromEmail; all.selfLogged += r.selfLogged; all.rd += r.rd; all.created += r.created; all.durations.push(...r.durations);
  }
  return { people, group, team: finish(all) };
}

/** Human duration: hours under two days, days above. */
export function formatHours(h, lang) {
  if (h == null) return '—';
  if (h < 48) return t(lang, 'hours', { n: Math.round(h * 10) / 10 });
  return t(lang, 'days', { n: Math.round((h / 24) * 10) / 10 });
}
export const formatRate = (r) => (r == null ? '—' : `${Math.round(r * 100)}%`);

// ===================== reports: technician points and after-sales tickets (ADR-0012) =====================
// Both are ready-made per-person reports inside myafaqy (capture of 29 Oct 2026). The technician report is monthly, so a
// period is pulled month by month; the after-sales board takes the period as a date window.
export const REPORTS_SCHEMA = 'afaqy-crm-reports/v1';
export const TECH_FIELDS = ['installedDeviceCount', 'maintainedDeviceCount', 'maintainedFixDeviceCount', 'reServiceDeviceCount', 'stopServiceDeviceCount',
  'installedAccessoriesCount', 'maintainedAccessoriesCount', 'maintainedFixAccessoriesCount', 'reServiceAccessoriesCount', 'stopServiceAccessoriesCount',
  'groupInstallationCount', 'additionalWorkCount', 'violationCount', 'totalPoint',
  'installedTransactionCount', 'maintainedTransactionCount', 'reServiceTransactionCount', 'stopServiceTransactionCount',
  'fridayWorkDaysCount', 'saturdayWorkDaysCount'];

/** The calendar months a period touches, each with the bounds the technician report expects. */
export function monthsOf(from, to) {
  const out = [];
  let y = +from.slice(0, 4), m = +from.slice(5, 7);
  while (`${y}-${pad(m)}` <= to.slice(0, 7)) {
    const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
    out.push({ key: `${y}-${pad(m)}`, yearId: y, quarterId: Math.floor((m - 1) / 3) + 1, monthId: m,
      requestDate: [`${y}-${pad(m)}-01T00:00:00.000Z`, `${y}-${pad(m)}-${pad(last)}T00:00:00.000Z`] });
    if (++m > 12) { m = 1; y++; }
  }
  return out;
}

export function buildReportsPrompt({ from, to, branch = JEDDAH_BRANCH }) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to) || from > to) throw new Error('invalid range');
  const [fromZ, toZ] = saudiBoundsZ(from, to);
  const months = monthsOf(from, to);
  const body = (mo) => JSON.stringify({ pageNumber: 1, pageSize: 100, searchKey: '', isSearchFilter: true,
    search: { yearId: mo.yearId, quarterId: mo.quarterId, monthId: mo.monthId, branchIds: branch, userIds: [], requestDate: mo.requestDate } });
  return `You are reading two per-employee reports from the myafaqy CRM (https://myafaqy.com, API at https://crmbackend.afaqy.sa) for a read-only KPI dashboard. I am signed in with my own manager account in this tab.

ABSOLUTE RULE — NOTHING MAY CHANGE IN MYAFAQY
- You may call ONLY these three endpoints, exactly as named:
    TechnicianReport/GetTechnicianReportStatic · AfterSalesBoardReport/GetAfterSalesAgentsGrid · ActivityLog/GetTicketsGrid
- Never call anything else. Never call any endpoint whose name contains Add, Create, Insert, Edit, Update, Delete, Remove, Save, Assign, Reassign, Close, Complete, Approve, Reject, Sync, Send, Upload, Import, Change, Set, Mark, Read, Seen, Logout.
- Never press any button in the page. Never change any filter, sort, column or setting on screen.
- myafaqy uses POST to READ these reports; that is expected. The two names above are reads.
- If anything is unclear, or the app now needs a different endpoint, STOP and ask me. Do not improvise.
- Never put tokens, cookies, passwords, phone numbers, identity numbers or any pay or bonus value in your answer.

PERIOD: ${from} to ${to}, Saudi time.

HOW
- Open Technicians → Technicians Points once, and Dashboards → After Sales Board once, and confirm in the network traffic that the app sends the two requests as below. If either differs, STOP and tell me what changed.
- Replay with your JavaScript tool, reusing the headers the app sends (Authorization, X-Timezone-Offset, X-Client-Id, lang). Wait 300 ms between calls. Change only what is written below.

STEP 1 — TECHNICIAN POINTS, one call per month (the report is monthly). POST https://crmbackend.afaqy.sa/TechnicianReport/GetTechnicianReportStatic with:
${months.map((mo) => `  ${mo.key}: ${body(mo)}`).join('\n')}
   The rows are in data.gridResult.data; page with pageNumber (it starts at 1) until listCount is reached.
   From each row keep ONLY: technicianId, employeeId, nameEn, nameAr, ${TECH_FIELDS.join(', ')}.
   Do NOT keep phoneNumber, bonusValue, fridayWorkDaysBonus, saturdayWorkDaysPoints, evaluation, leadEvaluation or branchPercentage.

STEP 2 — AFTER-SALES TICKETS, one call. POST https://crmbackend.afaqy.sa/AfterSalesBoardReport/GetAfterSalesAgentsGrid with:
  {"categoryId":null,"createDate":["${fromZ}","${toZ}"],"branch":"${branch}","afterSalesId":null}
   Keep every row: id, afterSalesName, openTickets, pendingTickets, doneTickets, totalTickets.

STEP 3 — ACTIVITY LOG (the Tickets screen: every activity an engineer logs with a customer). POST https://crmbackend.afaqy.sa/ActivityLog/GetTicketsGrid with:
  {"isSearchFilter":false,"searchKey":"","search":{},"pageSize":500,"pageNumber":0,"searchCriteria":"","dateRangeIntialDaysCount":0}
   Rows come newest first. Page with pageNumber (0, 1, 2 …) and STOP as soon as a whole page is older than ${from}. If "pageSize" comes back smaller than 500, use what it returns.
   Keep ONLY the rows whose createDate falls between ${from} and ${to} (Saudi days), and from each row ONLY: ticketId, taskId, customerId, categoryId, category, caseId, case, statusId, status, createdById, createDate.
   Do NOT keep customerNameAr, customerNameEn, createdBy, description, salesMan or isVIP.

THE RESULT — ONE FILE ON MY COMPUTER, NOT IN CHAT
Save this JSON as ONE file with a download (a Blob and an <a download> link) named afaqy-reports-${from}_${to}.json:

{
  "schema": "${REPORTS_SCHEMA}",
  "range": { "from": "${from}", "to": "${to}" },
  "branch": "${branch}",
  "extractedAt": "<ISO date-time now>",
  "techPoints": [ { "month": "<YYYY-MM>", "listCount": <n>, "rows": [ { "technicianId": <n>, "employeeId": <n>, "nameEn": "<…>", "nameAr": "<…>", ${TECH_FIELDS.map((f) => `"${f}": <n>`).join(', ')} } ] } ],
  "afterSales": { "rows": [ { "id": <n>, "name": "<afterSalesName>", "open": <n>, "pending": <n>, "done": <n>, "total": <n> } ] },
  "activities": { "rows": [ { "ticketId": <n>, "taskId": <n or null>, "customerId": <n>, "categoryId": <n>, "category": "<…>", "caseId": <n>, "case": "<…>", "statusId": <n>, "status": "<…>", "createdById": <n>, "createDate": "<as returned, with Z added>" } ] },
  "notes": ["<anything the app sends differently>"]
}

Then reply with only five lines: the file name, the number of technician rows per month, the number of after-sales rows, the number of activity rows, and "No write endpoint was called."`;
}

/** Read a reports file. Returns { reports } or { error, vars }. Pay fields are dropped even if present. */
export function parseReports(text) {
  const raw = typeof text === 'string' ? extractJson(text) : text;
  if (!raw || typeof raw !== 'object') return { error: 'err_json' };
  if (raw.schema !== REPORTS_SCHEMA) return { error: 'err_schema', vars: { schema: REPORTS_SCHEMA } };
  const from = raw.range && raw.range.from, to = raw.range && raw.range.to;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from || '') || !/^\d{4}-\d{2}-\d{2}$/.test(to || '') || from > to) return { error: 'err_range' };
  const n = (v) => (Number.isFinite(+v) ? +v : 0);
  const techPoints = (Array.isArray(raw.techPoints) ? raw.techPoints : []).filter((m) => m && /^\d{4}-\d{2}$/.test(m.month || '')).map((m) => ({
    month: m.month, listCount: n(m.listCount),
    rows: (Array.isArray(m.rows) ? m.rows : []).filter((r) => r && (r.technicianId != null || r.nameEn || r.nameAr)).map((r) => {
      const o = { technicianId: r.technicianId == null ? null : String(r.technicianId), employeeId: r.employeeId == null ? null : String(r.employeeId),
        nameEn: String(r.nameEn || ''), nameAr: String(r.nameAr || '') };
      for (const f of TECH_FIELDS) o[f] = n(r[f]);
      return o;
    }),
  }));
  const rows = (raw.afterSales && Array.isArray(raw.afterSales.rows) ? raw.afterSales.rows : []).filter((r) => r && r.id != null).map((r) => ({
    id: String(r.id), name: String(r.name || r.afterSalesName || ''), open: n(r.open ?? r.openTickets), pending: n(r.pending ?? r.pendingTickets),
    done: n(r.done ?? r.doneTickets), total: n(r.total ?? r.totalTickets) }));
  const activities = (raw.activities && Array.isArray(raw.activities.rows) ? raw.activities.rows : []).filter((r) => r && r.ticketId != null && toIso(r.createDate)).map((r) => ({
    ticketId: String(r.ticketId), taskId: r.taskId == null ? null : String(r.taskId), customerId: r.customerId == null ? null : String(r.customerId),
    categoryId: r.categoryId == null ? null : String(r.categoryId), category: String(r.category || '').slice(0, 60), caseId: r.caseId == null ? null : String(r.caseId), caseName: String(r.case || r.caseName || '').slice(0, 60),
    statusId: r.statusId == null ? null : String(r.statusId), status: String(r.status || '').slice(0, 40), createdById: r.createdById == null ? null : String(r.createdById), createdAt: toIso(r.createDate) }));
  const accounts = (raw.accounts && Array.isArray(raw.accounts.rows) ? raw.accounts.rows : []).filter((r) => r && r.c != null).slice(0, 20000)
    .map((r) => ({ c: String(r.c), a: (Array.isArray(r.a) ? r.a : []).map(String).slice(0, 40), d: Number(r.d) || 0, s: r.s == null ? null : String(r.s) }));
  return { reports: { key: rangeKey({ from, to }), schema: REPORTS_SCHEMA, range: { from, to }, branch: String(raw.branch || ''),
    extractedAt: toIso(raw.extractedAt), techPoints, afterSales: rows, activities, accounts, notes: Array.isArray(raw.notes) ? raw.notes.map(String).slice(0, 30) : [] } };
}

/** Factor 2: technician points over the period — the months summed per technician; people with no field work left out. */
export function techTotals(reports) {
  const by = new Map();
  for (const m of reports.techPoints || []) for (const r of m.rows) {
    const key = r.technicianId || r.nameEn || r.nameAr;
    if (!by.has(key)) by.set(key, { technicianId: r.technicianId, nameEn: r.nameEn, nameAr: r.nameAr, months: 0, ...Object.fromEntries(TECH_FIELDS.map((f) => [f, 0])) });
    const t = by.get(key); t.months++;
    for (const f of TECH_FIELDS) t[f] += r[f];
  }
  const work = (t) => t.installedDeviceCount + t.maintainedDeviceCount + t.maintainedFixDeviceCount + t.reServiceDeviceCount + t.stopServiceDeviceCount
    + t.groupInstallationCount + t.additionalWorkCount + t.installedAccessoriesCount + t.maintainedAccessoriesCount + t.violationCount + t.totalPoint;
  const rows = [...by.values()].filter((t) => work(t) > 0).sort((a, b) => b.totalPoint - a.totalPoint || b.installedDeviceCount - a.installedDeviceCount);
  const total = Object.fromEntries(TECH_FIELDS.map((f) => [f, rows.reduce((s, t) => s + t[f], 0)]));
  return { rows, total };
}

/** Factor 3: after-sales tickets per person, busiest first; people with no tickets left out. */
/** Factor 4: the activity log per person — activities, distinct customers, by status and by category; busiest first. */
export function activityTotals(reports, team = null) {
  const { from, to } = reports.range;
  const rows = (reports.activities || []).filter((a) => a.createdById && saudiDay(a.createdAt) >= from && saudiDay(a.createdAt) <= to && (!team || team.includes(a.createdById)));
  const statuses = [...new Set(rows.map((a) => a.status).filter(Boolean))];
  const categories = [...new Set(rows.map((a) => a.category).filter(Boolean))];
  const by = new Map();
  for (const a of rows) {
    if (!by.has(a.createdById)) by.set(a.createdById, { id: a.createdById, activities: 0, customers: new Set(), withTask: 0, byStatus: {}, byCategory: {} });
    const r = by.get(a.createdById); r.activities++; if (a.customerId) r.customers.add(a.customerId); if (a.taskId) r.withTask++;
    if (a.status) r.byStatus[a.status] = (r.byStatus[a.status] || 0) + 1;
    if (a.category) r.byCategory[a.category] = (r.byCategory[a.category] || 0) + 1;
  }
  const people = [...by.values()].map((r) => ({ ...r, customers: r.customers.size })).sort((a, b) => b.activities - a.activities || b.customers - a.customers);
  const total = { activities: rows.length, customers: new Set(rows.map((a) => a.customerId).filter(Boolean)).size, withTask: rows.filter((a) => a.taskId).length,
    byStatus: Object.fromEntries(statuses.map((st) => [st, rows.filter((a) => a.status === st).length])), byCategory: Object.fromEntries(categories.map((c) => [c, rows.filter((a) => a.category === c).length])) };
  return { people, total, statuses, categories };
}

/** Factor 5: account coverage. For each engineer: accounts carried, devices on them, and how many were touched in the period. */
export function coverageTotals(reports, team = null, tasks = []) {
  const acc = reports.accounts || []; if (!acc.length) return { people: [], total: { accounts: 0, devices: 0, uncovered: 0 } };
  const { from, to } = reports.range;
  const inR = (iso) => { const d = saudiDay(iso); return d && d >= from && d <= to; };
  const touched = new Map();
  for (const a of reports.activities || []) if (a.createdById && a.customerId && inR(a.createdAt)) (touched.get(a.createdById) || touched.set(a.createdById, new Set()).get(a.createdById)).add(String(a.customerId));
  const ids = team ? new Set(team) : new Set(acc.flatMap((r) => r.a).filter((x) => !x.startsWith('e')));
  const people = [...ids].map((id) => {
    const mine = acc.filter((r) => r.a.includes(id)); const tch = touched.get(id) || new Set();
    return { id, accounts: mine.length, devices: mine.reduce((s, r) => s + r.d, 0), touched: mine.filter((r) => tch.has(r.c)).length, solo: mine.filter((r) => r.a.length === 1).length };
  }).filter((p) => p.accounts > 0).sort((a, b) => b.accounts - a.accounts);
  const uncovered = acc.filter((r) => !r.a.some((x) => ids.has(x))).length;
  return { people, total: { accounts: acc.length, devices: acc.reduce((s, r) => s + r.d, 0), uncovered, zeroDevices: acc.filter((r) => !r.d).length } };
}

export function afterSalesTotals(reports) {
  const rows = (reports.afterSales || []).filter((r) => r.total > 0 || r.open > 0 || r.pending > 0 || r.done > 0)
    .sort((a, b) => b.total - a.total || b.done - a.done);
  const total = rows.reduce((s, r) => ({ open: s.open + r.open, pending: s.pending + r.pending, done: s.done + r.done, total: s.total + r.total }), { open: 0, pending: 0, done: 0, total: 0 });
  return { rows, total };
}

// ===================== my KPIs: an engineer's own profile, read through their own myafaqy session =====================
// ADR-0010. A bookmark runs on myafaqy's page, reads «My Tasks» (taskGroupId 100000 — only the signed-in person's tasks,
// enforced by myafaqy itself) with the engineer's own sign-in, and hands the portal ONLY these fields, through the
// address fragment (never sent to any server). The sign-in token never leaves myafaqy's page.
export const ME_SCHEMA = 'afaqy-me/v1';
export const ME_SCHEMA_V2 = 'afaqy-me/v2';   // v6.10: the person plus whatever myafaqy shows them (ADR-0014)
export const ME_MONTHS = 12;

/** The bookmark, as a javascript: address. portalUrl is where the portal lives (…/afaqy-portal/). */
/**
 * The manager bookmark. Runs on myafaqy with the manager's own sign-in and reads, for a period, everything the two
 * prompts read — all tasks, the R&D queue, technician points, after-sales tickets — then saves two files to download
 * (tasks + reports), the same files the Data page takes. Read-only; the token never leaves the page.
 */
export function buildManagerBookmarklet(from, to, branch = JEDDAH_BRANCH, lang = 'ar') {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to) || from > to) throw new Error('invalid range');
  const [fromZ, toZ] = saudiBoundsZ(from, to);
  const nowYmd = ymd(saudiToday());
  const [, nowZ] = saudiBoundsZ(nowYmd, nowYmd);
  const later = to < nowYmd;
  const months = monthsOf(from, to);
  const msg = {
    ar: ['افتح ماي أفاقي أولًا ثم اضغط الإشارة من هناك', 'سجّل دخولك في ماي أفاقي أولًا', 'جارٍ تحميل بيانات الفريق… ', 'تعذّر التحميل: ', 'تم — نزّل الملفين وارفعهما في البوابة'],
    en: ['Open myafaqy first, then press the bookmark there', 'Sign in to myafaqy first', 'Loading the team data… ', 'Could not load: ', 'Done — download both files and upload them in the portal'],
    ur: ['پہلے مائی آفاقی کھولیں، پھر وہاں بک مارک دبائیں', 'پہلے مائی آفاقی میں لاگ اِن کریں', 'ٹیم کا ڈیٹا لوڈ ہو رہا ہے… ', 'لوڈ نہیں ہو سکا: ', 'ہو گیا — دونوں فائلیں ڈاؤن لوڈ کر کے پورٹل میں اپ لوڈ کریں'],
  }[lang] || [];
  const code = `(async()=>{const M=${JSON.stringify(msg)},FROM=${JSON.stringify(from)},TO=${JSON.stringify(to)},BR=${JSON.stringify(String(branch))};
if(location.hostname!=='myafaqy.com'){alert(M[0]);return}
const tk=localStorage.getItem('token');if(!tk){alert(M[1]);return}
const box=document.createElement('div');box.style.cssText='position:fixed;inset:auto 16px 16px auto;z-index:2147483647;background:#0F2231;color:#fff;padding:12px 16px;border-radius:10px;font:14px system-ui;max-width:320px';box.textContent=M[2];document.body.append(box);
const H={'Authorization':'Bearer '+tk,'Content-Type':'application/json','X-Timezone-Offset':'-180','X-Client-Id':localStorage.getItem('browser_client_id')||'','lang':'en'};
const say=t=>{box.textContent=t};const wait=ms=>new Promise(r=>setTimeout(r,ms));
const post=async(path,body)=>{const r=await fetch('https://crmbackend.afaqy.sa/'+path,{method:'POST',headers:H,body:JSON.stringify(body)});if(!r.ok)throw new Error(path+' HTTP '+r.status);const j=await r.json();if(j&&j.success===false)throw new Error(j.message||path+' refused');return j};
const get=async(path)=>{const r=await fetch('https://crmbackend.afaqy.sa/'+path,{headers:H});if(!r.ok)throw new Error(path+' HTTP '+r.status);return r.json()};
const dl=(name,obj)=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(obj)],{type:'application/json'}));a.download=name;document.body.append(a);a.click();a.remove()};
const taskBody=(b,n,size,co,grp)=>({donePageNumber:b==='done'?n:0,donePageSize:b==='done'?size:1,openPageNumber:b==='open'?n:0,openPageSize:b==='open'?size:1,toDoPageNumber:b==='toDo'?n:0,toDoPageSize:b==='toDo'?size:1,orderBy:1,taskGroupId:grp,searchKey:'',tasksGridStatusId:1,assignedBy:[],createdBy:[],agent:[],statusIds:[],type:[],priority:[],assignedOn:[],completedOn:co});
try{
const U=await post('Security/GetAllHierarchyUsersDropDown',{pageSize:1000,pageNumber:0,searchCriteria:'',selectedId:[]});
const udata=(U.data&&(U.data.data||U.data))||[];const uname={};for(const p of udata)uname[String(p.id)]=p;
const people=[];const teamsSeen={};
for(let pg=0;;pg++){const T=await post('Teams/GetAllTeams',{isSearchFilter:false,searchKey:'',search:{},pageSize:50,pageNumber:pg,searchCriteria:'',dateRangeIntialDaysCount:0});const arr=(T.data&&(T.data.data||T.data))||[];for(const t of arr)teamsSeen[String(t.id)]=t;const tot=(T.data&&T.data.totalPages)||1;if(pg+1>=tot||!arr.length)break;await wait(200)}
const teamOf={};const teamTypes={};for(const id of Object.keys(teamsSeen)){const d=await get('Teams/GetTeamById/'+id);const td=(d&&d.data)||{};const bc=td.branchCode==null?null:String(td.branchCode);const jed=bc==='${branch}'||/jeddah/i.test(String(td.nameEn||td.name||''));if(jed){const tn=td.nameEn||td.name||id;for(const[k,v]of Object.entries(td))if(k!=='groupUsersDto'&&Array.isArray(v)&&v.length&&v.every(x=>x&&typeof x==='object'&&(x.nameEn||x.name)&&x.userId==null)){teamTypes[tn]=v.map(x=>({id:x.id??x.taskSettingId??null,nameEn:String(x.nameEn||x.name||''),nameAr:String(x.nameAr||'')}))}}for(const g of td.groupUsersDto||[]){const uid=String(g.userId);(teamOf[uid]=teamOf[uid]||{teams:[],branchCode:null,jeddah:false}).teams.push(td.nameEn||td.name||id);if(bc)teamOf[uid].branchCode=bc;if(jed)teamOf[uid].jeddah=true;if(!uname[uid]&&(g.nameEn||g.nameAr))uname[uid]={nameEn:g.nameEn,nameAr:g.nameAr}}await wait(150)}
const walk=async(grp,co,keepRd,buckets=['done','open','toDo'])=>{const out=[];const rd=[];say(M[2]+(keepRd?'R&D':'tasks'));for(const b of buckets){let size=500,pg=0,total=null;for(;;){const d=((await post('Task/GetMyTasksGrid',taskBody(b,pg,size,co,grp))).data||{})[b];if(!d)break;if(pg===0&&d.pageSize!==size)size=d.pageSize||20;total=d.listCount;for(const x of d.data||[]){if(keepRd){rd.push(String(x.id));continue;}out.push({i:String(x.id),title:x.title,taskType:x.taskType,taskSettingId:x.taskSettingId,statusId:x.statusId,isCancelled:x.isCancelled,createdOn:x.createdOn,closeDate:x.closeDate,createUserId:x.createUserId,assigneeId:x.assigneeId,moduleId:x.moduleId,customerTag:x.customerTag,bucket:b})}pg++;if(!d.data||!d.data.length||pg*size>=total)break;await wait(250)}}return{out,rd}};
const main=await walk(100001,[FROM&&'${fromZ}'||'',TO&&'${toZ}'||''],false,['done']);let tasks=main.out;const doneTotal=tasks.length;
const opn=await walk(100001,[],false,['open','toDo']);const seenO=new Set(tasks.map(t=>t.i));for(const t of opn.out)if(!seenO.has(t.i)){seenO.add(t.i);tasks.push(t)}const openTotal=opn.out.length;
${later ? `const late=await walk(100001,['${toZ}','${nowZ}'],false,['done']);const seen=new Set(tasks.map(t=>t.i));for(const t of late.out){const c=t.createdOn?t.createdOn+'Z':'';if(t.bucket==='done'&&!seen.has(t.i)&&c>='${fromZ}'&&c<'${toZ}')tasks.push(t)}` : ''}
const rdq=await walk(12,[FROM&&'${fromZ}'||'',TO&&'${toZ}'||''],true,['done']);const rdo=await walk(12,[],true,['open','toDo']);const rdIds=[...new Set([...rdq.rd,...rdo.rd])];
const mapTask=x=>{const uid=String(x.assigneeId||'');const tt=teamOf[uid]||{teams:[],branchCode:null};return{id:String(x.i),title:String(x.title||''),typeId:x.taskSettingId??null,type:String(x.taskType||''),statusId:x.statusId,state:x.isCancelled?'cancelled':x.statusId===3?'done':'open',createdAt:x.createdOn?x.createdOn+'Z':null,createdById:x.createUserId==null?null:String(x.createUserId),assigneeId:uid,completedAt:x.statusId===3&&!x.isCancelled&&x.closeDate?x.closeDate+'Z':null,moduleId:x.moduleId,customer:x.customerTag||null,bucket:x.bucket}};
const seenId=new Set();const taskRows=[];for(const x of tasks){if(seenId.has(x.i))continue;seenId.add(x.i);taskRows.push(mapTask(x))}
const pids=new Set();taskRows.forEach(t=>{if(t.assigneeId)pids.add(t.assigneeId);if(t.createdById)pids.add(t.createdById)});for(const[uid,tt]of Object.entries(teamOf))if(tt.jeddah)pids.add(uid);
for(const id of pids){const u=uname[id]||{};const tt=teamOf[id]||{teams:[],branchCode:null};people.push({id,nameEn:String(u.nameEn||''),nameAr:String(u.nameAr||''),teams:tt.teams,branchCode:tt.branchCode})}
const tasksFile={schema:'${SCHEMA}',range:{from:FROM,to:TO},extractedAt:new Date().toISOString(),taskGroupId:100001,source:{endpoint:'POST https://crmbackend.afaqy.sa/Task/GetMyTasksGrid',doneInRangeTotal:doneTotal,openTotal:openTotal,pageSize:500},people,tasks:taskRows,rdTaskIds:rdIds,teamTypes,notes:['manager bookmark; times UTC with Z added']};
say(M[2]+'reports');const techPoints=[];const MM=${JSON.stringify(months.map(m=>({month:m.key,yearId:m.yearId,quarterId:m.quarterId,monthId:m.monthId,rd:m.requestDate})))};
const KEEP=${JSON.stringify(TECH_FIELDS)};
for(const mo of MM){const rows=[];for(let pg=1;;pg++){const R=await post('TechnicianReport/GetTechnicianReportStatic',{pageNumber:pg,pageSize:100,searchKey:'',isSearchFilter:true,search:{yearId:mo.yearId,quarterId:mo.quarterId,monthId:mo.monthId,branchIds:BR,userIds:[],requestDate:mo.rd}});const g=(R.data&&R.data.gridResult)||{};const arr=g.data||[];for(const r of arr){const o={technicianId:r.technicianId,employeeId:r.employeeId,nameEn:r.nameEn,nameAr:r.nameAr};for(const f of KEEP)o[f]=r[f]||0;rows.push(o)}const tot=g.totalPages||1;if(pg>=tot||!arr.length)break;await wait(200)}techPoints.push({month:mo.month,listCount:rows.length,rows})}
say(M[2]+'activity log');const acts=[];for(let pg=0;pg<200;pg++){const R=await post('ActivityLog/GetTicketsGrid',{isSearchFilter:false,searchKey:'',search:{},pageSize:500,pageNumber:pg,searchCriteria:'',dateRangeIntialDaysCount:0});const arr=(R.data&&(R.data.data||R.data))||[];if(!arr.length)break;let older=0;for(const r of arr){const d=String(r.createDate||'').slice(0,10);if(d<FROM){older++;continue}if(d>TO)continue;acts.push({ticketId:r.ticketId,taskId:r.taskId??null,customerId:r.customerId??null,categoryId:r.categoryId??null,category:r.category||'',caseId:r.caseId??null,case:r.case||'',statusId:r.statusId??null,status:r.status||'',createdById:r.createdById??null,createDate:r.createDate?r.createDate+'Z':null})}if(older===arr.length||(R.data&&R.data.totalPages&&pg+1>=R.data.totalPages))break;await wait(250)}
say(M[2]+'accounts');const ENG=((await post('AfterSales/GetAllAfterSalesEngineers')).data||[]);const byName={};for(const[uid,u]of Object.entries(uname)){const n=String((u&&u.nameEn)||'').trim().toLowerCase();if(n)byName[n]=uid}const emp2uid={};for(const e of ENG){const u=byName[String(e.nameEn||'').trim().toLowerCase()];if(u)emp2uid[String(e.id)]=u}const accts=[];let asz=500;for(let pg=0;pg<60;pg++){const R=await post('AfterSales/GetAfterSalesRequestGrid',{isSearchFilter:false,searchKey:'',search:{},pageSize:asz,pageNumber:pg,searchCriteria:'',dateRangeIntialDaysCount:0});const d=R.data||{};const arr=d.data||[];if(pg===0&&d.pageSize&&d.pageSize<asz)asz=d.pageSize;for(const r of arr)if(String(r.branchCode)===BR)accts.push({c:String(r.customerId??r.id),a:(r.afterSalesManIds||[]).map(String).map(x=>emp2uid[x]||('e'+x)),d:+r.connectedDevices||0,s:r.segmentId??null});if(!arr.length||(pg+1)*asz>=(d.listCount||0))break;await wait(200)}
const AS=await post('AfterSalesBoardReport/GetAfterSalesAgentsGrid',{categoryId:null,createDate:['${fromZ}','${toZ}'],branch:BR,afterSalesId:null});
const asArr=(AS.data&&(AS.data.data||AS.data))||[];const afterSales={rows:asArr.map(r=>({id:r.id,name:r.afterSalesName,open:r.openTickets||0,pending:r.pendingTickets||0,done:r.doneTickets||0,total:r.totalTickets||0}))};
const repFile={schema:'${REPORTS_SCHEMA}',range:{from:FROM,to:TO},branch:BR,extractedAt:new Date().toISOString(),techPoints,afterSales,activities:{rows:acts},accounts:{rows:accts,unmatched:ENG.filter(e=>!emp2uid[String(e.id)]).length},notes:['manager bookmark']};
dl('afaqy-tasks-'+FROM+'_'+TO+'.json',tasksFile);await wait(400);dl('afaqy-reports-'+FROM+'_'+TO+'.json',repFile);
box.style.background='#0A5F67';say(M[4]+' ('+taskRows.length+' / '+techPoints.reduce((s,m)=>s+m.rows.length,0)+' / '+afterSales.rows.length+' / '+acts.length+' / '+accts.length+')');setTimeout(()=>box.remove(),12000);
}catch(e){box.style.background='#7a1f1f';say(M[3]+e.message);setTimeout(()=>box.remove(),12000)}})();`;
  return 'javascript:' + encodeURIComponent(code.replace(/\n/g, ''));
}

/**
 * The assignment panel (ADR-0018). A bookmark that opens a panel INSIDE myafaqy with the manager's own sign-in: pick the
 * after-sales engineers, see the Jeddah coverage, pilot on ten accounts, then apply to the rest. The only write in the
 * whole portal: POST AfterSales/AssignAfterSales, ADD mode (existing ∪ chosen), branchCode "2" only, by a button press.
 */
export function buildAssignBookmarklet(lang = 'ar', defaultNames = []) {
  const M = {
    ar: { only: 'افتح ماي أفاقي أولًا ثم اضغط الإشارة من هناك', login: 'سجّل دخولك في ماي أفاقي أولًا', title: 'تعيين ما بعد البيع على حسابات جدة', pick: 'اختر المهندسين الذين يكونون على كل حساب', loading: 'جارٍ قراءة الحسابات…',
      total: 'حسابات جدة', complete: 'مكتملة بالمختارين', toUpdate: 'ستُحدَّث', cover: 'التغطية الحالية لكل مهندس', pilot: 'تجربة على ١٠', rest: 'تطبيق على الباقي', refresh: 'إعادة القراءة', close: 'إغلاق',
      before: 'قبل', after: 'بعد', ok: 'تمام', bad: 'لم يُطبَّق', progress: 'جارٍ التطبيق', done: 'انتهى — مكتملة الآن', failed: 'لم تنجح', log: 'تنزيل السجل', teamOnly: 'فريق ما بعد البيع في جدة كما في ماي أفاقي', showAll: 'إظهار كل مهندسي ما بعد البيع', noTeam: 'لم أجد فريق ما بعد البيع في جدة — تُعرض القائمة كلها', mode: 'إضافة لمن تختارهم، وإزالة لمن تعلّم عليه في قسم الإزالة فقط', none: 'اختر مهندسًا واحدًا على الأقل أو علّم على من تزيله', removeH: 'إزالة من كل الحسابات — لمن غادر', removeHint: 'لا يُزال أحد إلا من تعلّم عليه هنا بنفسك. الرقم بجانب كل اسم = عدد حسابات جدة التي عليه.', unknown: 'ليس في قائمة المهندسين', toRemove: 'ستُزال منها' },
    en: { only: 'Open myafaqy first, then press the bookmark there', login: 'Sign in to myafaqy first', title: 'Assign after-sales to Jeddah accounts', pick: 'Choose the engineers who should be on every account', loading: 'Reading accounts…',
      total: 'Jeddah accounts', complete: 'complete with the chosen', toUpdate: 'to update', cover: 'Current coverage per engineer', pilot: 'Pilot on 10', rest: 'Apply to the rest', refresh: 'Re-read', close: 'Close',
      before: 'before', after: 'after', ok: 'ok', bad: 'not applied', progress: 'Applying', done: 'Done — complete now', failed: 'failed', log: 'Download the log', teamOnly: 'Jeddah’s after-sales team as myafaqy lists it', showAll: 'Show every after-sales engineer', noTeam: 'Jeddah’s after-sales team was not found — showing the whole list', mode: 'Adds whoever you choose; removes only whoever you tick in the removal section', none: 'Choose at least one engineer or tick someone to remove', removeH: 'Remove from every account — for those who left', removeHint: 'Nobody is removed unless you tick them here yourself. The number beside each name is how many Jeddah accounts carry them.', unknown: 'not in the engineers list', toRemove: 'to remove from' },
  }[lang] || {};
  const code = `(async()=>{const M=${JSON.stringify(M)},RTL=${lang === 'en' ? 'false' : 'true'};
if(location.hostname!=='myafaqy.com'){alert(M.only);return}
const tk=localStorage.getItem('token');if(!tk){alert(M.login);return}
const H={'Authorization':'Bearer '+tk,'Content-Type':'application/json','X-Timezone-Offset':'-180','X-Client-Id':localStorage.getItem('browser_client_id')||'','lang':'en'};
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const get=async(path)=>{const r=await fetch('https://crmbackend.afaqy.sa/'+path,{headers:H});const j=await r.json().catch(()=>({}));if(!r.ok||j.success===false)throw new Error(path+' '+(j.message||r.status));return j};
const post=async(path,body)=>{const r=await fetch('https://crmbackend.afaqy.sa/'+path,{method:'POST',headers:H,body:body===undefined?undefined:JSON.stringify(body)});const j=await r.json().catch(()=>({}));if(!r.ok||j.success===false)throw new Error(path+' '+(j.message||r.status));return j};
const old=document.getElementById('afaqy-assign');if(old)old.remove();
const box=document.createElement('div');box.id='afaqy-assign';box.dir=RTL?'rtl':'ltr';box.style.cssText='position:fixed;top:16px;left:50%;transform:translateX(-50%);width:min(760px,96vw);max-height:92vh;overflow:auto;z-index:2147483647;background:#FFFFFF;color:#0F2231;border:1px solid #C3CED7;border-radius:12px;box-shadow:0 12px 40px rgba(15,34,49,.25);font:14px/1.5 system-ui,sans-serif;padding:16px 18px';
const el=(t,a,...k)=>{const n=document.createElement(t);for(const[x,v]of Object.entries(a||{})){if(x==='text')n.textContent=v;else if(x.startsWith('on'))n.addEventListener(x.slice(2),v);else n.setAttribute(x,v)}for(const c of k.flat())if(c!=null)n.append(c.nodeType?c:String(c));return n};
const btn=(text,fn,primary)=>el('button',{type:'button',style:'font:inherit;padding:8px 14px;border-radius:8px;cursor:pointer;border:1px solid '+(primary?'#0E7C86':'#C3CED7')+';background:'+(primary?'#0E7C86':'#FFFFFF')+';color:'+(primary?'#FFFFFF':'#0F2231'),onclick:fn,text});
const status=el('div',{style:'margin:8px 0;color:#5A6B78'});const body=el('div');
box.append(el('div',{style:'display:flex;justify-content:space-between;align-items:center;gap:10px'},el('b',{style:'font-size:16px',text:M.title}),btn(M.close,()=>box.remove())),el('div',{style:'font-size:12px;color:#B45309;margin:4px 0 8px',text:M.mode}),status,body);document.body.append(box);
let teamNames=null,showAll=false,engineers=[],rows=[],chosen=new Set(JSON.parse(localStorage.getItem('afaqy-assign-chosen')||'[]')),removing=new Set();const DEF=${JSON.stringify(defaultNames.map((n) => String(n).trim().toLowerCase()))};
const say=t=>{status.textContent=t};
const readTeam=async()=>{if(teamNames!==null)return;teamNames=[];try{for(let pg=0;pg<20;pg++){const T=await post('Teams/GetAllTeams',{isSearchFilter:false,searchKey:'',search:{},pageSize:50,pageNumber:pg,searchCriteria:'',dateRangeIntialDaysCount:0});const arr=(T.data&&(T.data.data||T.data))||[];for(const t of arr){const n=String(t.nameEn||t.name||'').toLowerCase();if(n.includes('jeddah')&&/after\\s*-?\\s*sales/.test(n)){const d=await get('Teams/GetTeamById/'+t.id);for(const g of((d&&d.data&&d.data.groupUsersDto)||[]))if(g.nameEn)teamNames.push(String(g.nameEn).trim().toLowerCase())}}if(pg+1>=((T.data&&T.data.totalPages)||1)||!arr.length)break}}catch(e){teamNames=[]}};
const readAll=async()=>{say(M.loading);await readTeam();engineers=((await post('AfterSales/GetAllAfterSalesEngineers')).data||[]).map(e=>({id:String(e.id),name:e.nameEn||e.nameAr||String(e.id)}));
const want=[...new Set([...DEF,...(teamNames||[])])];if(!chosen.size&&want.length)for(const e of engineers)if(want.includes(String(e.name).trim().toLowerCase()))chosen.add(e.id);rows=[];let size=500;for(let pg=0;pg<100;pg++){const R=await post('AfterSales/GetAfterSalesRequestGrid',{isSearchFilter:false,searchKey:'',search:{},pageSize:size,pageNumber:pg,searchCriteria:'',dateRangeIntialDaysCount:0});const d=R.data||{};const arr=d.data||[];if(pg===0&&d.pageSize&&d.pageSize<size)size=d.pageSize;for(const r of arr)if(String(r.branchCode)==='2')rows.push({id:String(r.customerId??r.id),have:(r.afterSalesManIds||[]).map(String),devices:+r.connectedDevices||0});if(!arr.length||(pg+1)*size>=(d.listCount||0))break;await wait(200)}say('')};
const present=()=>{const c=new Map();for(const r of rows)for(const h of r.have)c.set(h,(c.get(h)||0)+1);return[...c.entries()].sort((a,b)=>b[1]-a[1])};
const need=()=>{const want=[...chosen];return rows.filter(r=>want.some(w=>!r.have.includes(w))||r.have.some(h=>removing.has(h)))};
const union=r=>[...new Set([...r.have,...chosen])].filter(x=>!removing.has(x));
let logRows=[];
const apply=async(list,label)=>{let n=0,bad=[];for(const r of list){say(M.progress+' '+(++n)+'/'+list.length);const before=r.have.slice();const next=union(r);if(!next.length){logRows.push([r.id,before.join('|'),'','skipped: would leave nobody']);continue}try{await post('AfterSales/AssignAfterSales',{customerId:+r.id,afterSalesIds:next.map(Number)});logRows.push([r.id,before.join('|'),next.join('|'),'sent'])}catch(e){bad.push(r.id);logRows.push([r.id,before.join('|'),next.join('|'),'error:'+e.message])}await wait(300)}return bad};
const verify=async(ids)=>{await readAll();const set=new Set(ids);return rows.filter(r=>set.has(r.id)).map(r=>({id:r.id,ok:[...chosen].every(w=>r.have.includes(w))&&!r.have.some(h=>removing.has(h)),have:r.have}))};
const dl=()=>{const csv=['customerId,before,after,result',...logRows.map(r=>r.map(x=>'"'+String(x).replace(/"/g,'""')+'"').join(','))].join('\\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));a.download='afaqy-assign-log-'+new Date().toISOString().slice(0,10)+'.csv';document.body.append(a);a.click();a.remove()};
const render=(extra)=>{const todo=need();const cov=engineers.map(e=>({e,n:rows.filter(r=>r.have.includes(e.id)).length})).sort((a,b)=>b.n-a.n);
body.replaceChildren(el('div',{style:'font-weight:700;margin:6px 0',text:M.pick}),el('div',{style:'display:flex;justify-content:space-between;align-items:center;gap:8px;font-size:12px;color:#5A6B78;margin-bottom:6px'},el('span',{text:(teamNames&&teamNames.length)?M.teamOnly+' ('+teamNames.length+')':M.noTeam}),(teamNames&&teamNames.length)?el('label',{style:'display:flex;gap:6px;align-items:center;cursor:pointer'},el('input',{type:'checkbox',...(showAll?{checked:''}:{}),onchange:ev=>{showAll=ev.target.checked;render()}}),M.showAll):null),el('div',{style:'display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:6px;margin-bottom:10px'},engineers.filter(e=>showAll||!teamNames||!teamNames.length||teamNames.includes(String(e.name).trim().toLowerCase())||chosen.has(e.id)).map(e=>el('label',{style:'display:flex;gap:8px;align-items:center;padding:6px 8px;border:1px solid #DBE2E8;border-radius:8px'},el('input',{type:'checkbox',...(chosen.has(e.id)?{checked:''}:{}),onchange:ev=>{if(ev.target.checked){chosen.add(e.id);removing.delete(e.id)}else chosen.delete(e.id);localStorage.setItem('afaqy-assign-chosen',JSON.stringify([...chosen]));render()}}),el('span',{text:e.name}),el('span',{style:'margin-inline-start:auto;color:#5A6B78;font-size:12px',text:String(rows.filter(r=>r.have.includes(e.id)).length)})))),
el('details',{style:'margin:6px 0 10px;padding:8px 10px;border:1px solid #F0C9C5;border-radius:8px;background:#FFF8F7',...(removing.size?{open:''}:{})},el('summary',{style:'cursor:pointer;font-weight:700;color:#B42318',text:M.removeH+(removing.size?' ('+removing.size+')':'')}),el('div',{style:'font-size:12px;color:#5A6B78;margin:4px 0 8px',text:M.removeHint}),el('div',{style:'display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:6px'},present().map(([id,n])=>{const e=engineers.find(x=>x.id===id);return el('label',{style:'display:flex;gap:8px;align-items:center;padding:6px 8px;border:1px solid #F0C9C5;border-radius:8px;background:#FFFFFF'},el('input',{type:'checkbox',...(removing.has(id)?{checked:''}:{}),onchange:ev=>{if(ev.target.checked){removing.add(id);chosen.delete(id);localStorage.setItem('afaqy-assign-chosen',JSON.stringify([...chosen]))}else removing.delete(id);render()}}),el('span',{text:e?e.name:('#'+id+' — '+M.unknown)}),el('span',{style:'margin-inline-start:auto;color:#5A6B78;font-size:12px',text:String(n)}))}))),
el('div',{style:'display:flex;gap:16px;flex-wrap:wrap;margin:8px 0;padding:10px 12px;background:#EEF1F4;border-radius:8px'},el('span',{},el('b',{text:String(rows.length)}),' '+M.total),el('span',{},el('b',{text:String(rows.length-todo.length)}),' '+M.complete),el('span',{style:'color:#B45309'},el('b',{text:String(todo.length)}),' '+M.toUpdate),removing.size?el('span',{style:'color:#B42318'},el('b',{text:String(rows.filter(r=>r.have.some(h=>removing.has(h))).length)}),' '+M.toRemove):null),
el('div',{style:'display:flex;gap:8px;flex-wrap:wrap'},btn(M.pilot,async()=>{if(!chosen.size&&!removing.size){say(M.none);return}const list=need().slice(0,10);const bad=await apply(list,'pilot');const v=await verify(list.map(r=>r.id));render(el('table',{style:'width:100%;border-collapse:collapse;margin-top:10px;font-size:13px'},el('tr',{},['customerId',M.before,M.after,''].map(h=>el('th',{style:'text-align:start;border-bottom:1px solid #DBE2E8;padding:4px',text:h}))),v.map(x=>{const lg=logRows.find(l=>l[0]===x.id)||[];return el('tr',{},el('td',{style:'padding:4px',text:x.id}),el('td',{style:'padding:4px;color:#5A6B78',text:lg[1]||''}),el('td',{style:'padding:4px',text:x.have.join('|')}),el('td',{style:'padding:4px;font-weight:700;color:'+(x.ok?'#15803D':'#B42318'),text:x.ok?M.ok:M.bad}))})))},true),btn(M.rest,async()=>{if(!chosen.size&&!removing.size){say(M.none);return}const list=need();const bad=await apply(list,'rest');await readAll();const left=need().length;render(el('div',{style:'margin-top:10px;padding:10px 12px;border-radius:8px;background:'+(left?'#FDF1E1':'#E6F4EA')},el('b',{text:M.done+': '+(rows.length-left)+'/'+rows.length}),bad.length?el('div',{text:M.failed+': '+bad.join(', ')}):null))},true),btn(M.refresh,async()=>{await readAll();render()}),logRows.length?btn(M.log,dl):null),...(extra?[extra]:[]))};
try{await readAll();render()}catch(e){say(e.message)}})();`;
  return 'javascript:' + encodeURIComponent(code.replace(/\n/g, ''));
}

export function buildBookmarklet(portalUrl, lang = 'ar') {
  const msg = {
    ar: ['افتح ماي أفاقي أولًا ثم اضغط الإشارة من هناك', 'سجّل دخولك في ماي أفاقي أولًا', 'جارٍ قراءة شغلك…', 'تعذّرت القراءة: ', 'اسمح لماي أفاقي بفتح النوافذ ثم اضغط الإشارة مرة أخرى'],
    en: ['Open myafaqy first, then press the bookmark there', 'Sign in to myafaqy first', 'Reading your work…', 'Could not read: ', 'Allow myafaqy to open windows, then press the bookmark again'],
    ur: ['پہلے مائی آفاقی کھولیں، پھر وہاں بک مارک دبائیں', 'پہلے مائی آفاقی میں لاگ اِن کریں', 'آپ کا کام پڑھا جا رہا ہے…', 'پڑھا نہیں جا سکا: ', 'مائی آفاقی کو ونڈوز کھولنے کی اجازت دیں، پھر بک مارک دوبارہ دبائیں'],
  }[lang] || [];
  const code = `(async()=>{const M=${JSON.stringify(msg)},P=${JSON.stringify(portalUrl)},PO=new URL(P).origin;
if(location.hostname!=='myafaqy.com'){alert(M[0]);return}
const tk=localStorage.getItem('token');if(!tk){alert(M[1]);return}
let w=window.open(P+'#me-wait','afaqy-portal');
const box=document.createElement('div');box.style.cssText='position:fixed;inset:auto 16px 16px auto;z-index:2147483647;background:#0F2231;color:#fff;padding:12px 16px;border-radius:10px;font:14px system-ui';box.textContent=M[2];document.body.append(box);
try{const u=JSON.parse(decodeURIComponent(escape(atob(tk.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')))));const me=String(u.UserId);
const H={'Authorization':'Bearer '+tk,'Content-Type':'application/json','X-Timezone-Offset':'-180','X-Client-Id':localStorage.getItem('browser_client_id')||'','lang':'en'};
const day=86400000,now=Date.now(),sa=d=>new Date(Date.parse(new Date(d+3*3600000).toISOString().slice(0,10)+'T00:00:00+03:00')).toISOString();
const since=sa(now-${ME_MONTHS}*30.5*day),end=sa(now+day);
const post=async(path,body)=>{const r=await fetch('https://crmbackend.afaqy.sa/'+path,{method:'POST',headers:H,body:JSON.stringify(body)});if(!r.ok)throw new Error(path+' HTTP '+r.status);const j=await r.json();if(j&&j.success===false)throw new Error(j.message||'refused');return j};
const get=async(path)=>{const r=await fetch('https://crmbackend.afaqy.sa/'+path,{headers:H});if(!r.ok)throw new Error(path+' HTTP '+r.status);return r.json()};
const soft=async f=>{try{return await f()}catch(e){return null}};
const base=(g,c,b,n,s)=>({donePageNumber:b==='done'?n:0,donePageSize:b==='done'?s:1,openPageNumber:b==='open'?n:0,openPageSize:b==='open'?s:1,toDoPageNumber:b==='toDo'?n:0,toDoPageSize:b==='toDo'?s:1,orderBy:1,taskGroupId:g,searchKey:'',tasksGridStatusId:1,assignedBy:[],createdBy:[],agent:[],statusIds:[],type:[],priority:[],assignedOn:[],completedOn:c});
const rows=new Map();let n=0;
for(const g of[100000,100001]){for(const[b,c]of[['done',[since,end]],['open',[]],['toDo',[]]]){let size=500,pg=0,total=null;
for(;;){const d=((await post('Task/GetMyTasksGrid',base(g,c,b,pg,size))).data||{})[b];if(!d)break;if(pg===0&&d.pageSize!==size)size=d.pageSize||20;total=d.listCount;
for(const x of d.data||[]){const id=String(x.id);if(rows.has(id))continue;const a=String(x.assigneeId==null?(g===100000?me:''):x.assigneeId);
rows.set(id,{i:id,c:x.createdOn,d:x.statusId===3&&!x.isCancelled?x.closeDate:null,s:x.isCancelled?'cancelled':x.statusId===3?'done':'open',m:x.moduleId,o:String(x.createUserId)===a,b,a,t:a===me&&b!=='done'?String(x.title||x.taskType||'').slice(0,80):undefined})}
n+=(d.data||[]).length;box.textContent=M[2]+' '+n;pg++;if(!d.data||!d.data.length||pg*size>=total)break;await new Promise(r=>setTimeout(r,250))}}}
const U=await soft(()=>post('Security/GetAllHierarchyUsersDropDown',{pageSize:1000,pageNumber:0,searchCriteria:'',selectedId:[]}));
const ud=(U&&U.data&&(U.data.data||U.data))||[];const nm={};for(const p of(Array.isArray(ud)?ud:[]))nm[String(p.id)]=p;
const tm={};await soft(async()=>{for(let pg=0;pg<20;pg++){const R=await post('Teams/GetAllTeams',{isSearchFilter:false,searchKey:'',search:{},pageSize:50,pageNumber:pg,searchCriteria:'',dateRangeIntialDaysCount:0});const arr=(R.data&&(R.data.data||R.data))||[];
for(const t of arr){const D=await soft(()=>get('Teams/GetTeamById/'+t.id));const td=(D&&D.data)||{};const bc=td.branchCode==null?null:String(td.branchCode);for(const x of td.groupUsersDto||[]){const k=String(x.userId);(tm[k]=tm[k]||{teams:[],branchCode:null}).teams.push(String(td.nameEn||t.nameEn||''));if(bc)tm[k].branchCode=bc}}
if(pg+1>=((R.data&&R.data.totalPages)||1)||!arr.length)break}});
const ids=new Set([me]);for(const r of rows.values())if(r.a)ids.add(r.a);
const people=[...ids].map(id=>{const p=nm[id]||{},q=tm[id]||{teams:[],branchCode:null};return{id,nameEn:String(p.nameEn||''),nameAr:String(p.nameAr||''),teams:q.teams,branchCode:q.branchCode,h:id!==me&&!!nm[id]}});
const pay={schema:'${ME_SCHEMA_V2}',user:{id:me,name:String(u.UserName||'')},extractedAt:new Date().toISOString(),since,months:${ME_MONTHS},people,tasks:[...rows.values()]};
let ok=false;const ack=e=>{if(e.origin===PO&&e.data&&e.data.type==='afaqy-me-ack')ok=true};window.addEventListener('message',ack);
if(w&&!w.closed){for(let k=0;k<60&&!ok;k++){try{w.postMessage({type:'afaqy-me',payload:pay},PO)}catch(e){}await new Promise(r=>setTimeout(r,500))}}
window.removeEventListener('message',ack);
if(ok){box.remove();return}
let data=JSON.stringify(pay),enc='j';
if(window.CompressionStream){const cs=new Blob([data]).stream().pipeThrough(new CompressionStream('gzip'));const buf=new Uint8Array(await new Response(cs).arrayBuffer());let bin='';for(const c of buf)bin+=String.fromCharCode(c);data=btoa(bin);enc='z'}else{data=btoa(unescape(encodeURIComponent(data)))}
const url=P+'#me-'+enc+'.'+data.replace(/\\\\+/g,'-').replace(/\\\\//g,'_').replace(/=+$/,'');
if(url.length>1800000){box.textContent=M[4];setTimeout(()=>box.remove(),10000);return}
location.href=url;box.remove()}catch(e){box.textContent=M[3]+e.message;setTimeout(()=>box.remove(),8000)}})();`;
  return 'javascript:' + encodeURIComponent(code.replace(/\n/g, ''));
}

/** Read what the bookmark handed over — an object (by message) or the part of the address after #me- (fallback). */
export async function parseMe(fragmentOrObject) {
  let raw = fragmentOrObject;
  if (typeof raw === 'string') {
    const m = raw.match(/^([zj])\.([A-Za-z0-9_-]+)$/);
    if (!m) return { error: 'err_json' };
    try {
      const b64 = m[2].replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((m[2].length + 3) % 4);
      const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
      let text;
      if (m[1] === 'z') text = await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).text();
      else text = new TextDecoder().decode(bytes);
      raw = JSON.parse(text);
    } catch { return { error: 'err_json' }; }
  }
  return parseMePayload(raw);
}

/** Validate and normalise a hand-over. Titles survive only on the person's own open tasks, whatever the payload says. */
export function parseMePayload(raw) {
  if (!raw || typeof raw !== 'object' || ![ME_SCHEMA, ME_SCHEMA_V2].includes(raw.schema) || !raw.user || raw.user.id == null || !Array.isArray(raw.tasks))
    return { error: 'err_schema', vars: { schema: ME_SCHEMA_V2 } };
  const uid = String(raw.user.id);
  const v2 = raw.schema === ME_SCHEMA_V2;
  const tasks = raw.tasks.filter((x) => x && x.i != null && toIso(x.c)).map((x) => {
    const state = ['open', 'done', 'cancelled'].includes(x.s) ? x.s : 'open';
    const moduleId = Number.isFinite(+x.m) && x.m !== null ? +x.m : null;
    const assigneeId = v2 ? String(x.a || '') : uid;
    const mine = assigneeId === uid;
    return { id: String(x.i), state, createdAt: toIso(x.c), completedAt: state === 'done' ? toIso(x.d) : null,
      title: mine && state !== 'done' ? String(x.t || '').slice(0, 80) : '', typeId: null, type: '',
      assigneeId, assigneeName: '', createdById: null, createdByName: '', assignedToGroup: !assigneeId,
      fromEmail: moduleId === EMAIL_MODULE, own: x.o === true, moduleId, bucket: x.b || null };
  });
  const people = v2 && Array.isArray(raw.people) ? raw.people.filter((p) => p && p.id != null).map((p) => ({
    id: String(p.id), nameEn: String(p.nameEn || '').slice(0, 80), nameAr: String(p.nameAr || '').slice(0, 80),
    teams: Array.isArray(p.teams) ? p.teams.map((t) => String(t).slice(0, 80)).slice(0, 12) : [],
    branchCode: p.branchCode == null ? null : String(p.branchCode), below: p.h === true && String(p.id) !== uid })) : [];
  if (!people.some((p) => p.id === uid)) people.push({ id: uid, nameEn: '', nameAr: '', teams: [], branchCode: null, below: false });
  return { me: { schema: raw.schema, user: { id: uid, name: String(raw.user.name || '') }, extractedAt: toIso(raw.extractedAt), since: toIso(raw.since), people, tasks } };
}

/** Bring a profile saved by an earlier version up to the current shape (a v6.9 device holds no people list). */
export function upgradeMe(me) {
  if (!me || !me.user || !Array.isArray(me.tasks)) return null;
  const uid = String(me.user.id);
  const people = Array.isArray(me.people) ? me.people : [];
  if (!people.some((p) => p.id === uid)) people.push({ id: uid, nameEn: '', nameAr: '', teams: [], branchCode: null, below: false });
  return { ...me, user: { id: uid, name: String(me.user.name || '') }, people, tasks: me.tasks.map((x) => ({ ...x, assigneeId: x.assigneeId || uid })) };
}

/** The open tasks a person has right now — their current work, newest first. Titles come through only for one's own tasks. */
export function openTasks(tasks, assigneeId = null) {
  return (tasks || []).filter((x) => x.state === 'open' && (!assigneeId || x.assigneeId === assigneeId))
    .map((x) => ({ id: x.id, title: x.title || '', type: x.type || '', typeId: x.typeId, createdAt: x.createdAt,
      customer: x.customer || null, fromEmail: x.fromEmail === true, ageHours: x.createdAt ? Math.max(0, (Date.now() - Date.parse(x.createdAt)) / 3600000) : null,
      bucket: x.bucket }))
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

// ===================== the team file: positions and leaders, by myafaqy id, never by name (ADR-0015) =====================
// team.json lives in the repository (public), so it holds ids, positions and who reports to whom — the names arrive from
// myafaqy with the bookmark. The manager fills it on the Team page; each device may also hold its own copy.
export const ROSTER_SCHEMA = 'afaqy-team/v1';
export function parseRoster(raw) {
  if (!raw || typeof raw !== 'object' || !raw.people || typeof raw.people !== 'object') return { v: 1, schema: ROSTER_SCHEMA, people: {} };
  const people = {};
  for (const [id, p] of Object.entries(raw.people)) {
    if (!p || typeof p !== 'object') continue;
    const o = { position: String(p.position || '').slice(0, 80), leaderId: p.leaderId == null || p.leaderId === '' ? null : String(p.leaderId) };
    if (p.positionEn) o.positionEn = String(p.positionEn).slice(0, 80);
    if (p.onLeave === true) o.onLeave = true;
    if (o.position || o.leaderId || o.positionEn || o.onLeave) people[String(id)] = o;
  }
  return { v: 1, schema: ROSTER_SCHEMA, people };
}
/** The device's own entries win over the repository's. */
export function mergeRoster(repo, device) {
  const a = parseRoster(repo), b = parseRoster(device);
  return { v: 1, schema: ROSTER_SCHEMA, people: { ...a.people, ...b.people } };
}
/** The scope: everyone in the team file. When the file has people, nobody else is counted or shown anywhere. */
export const scopeIds = (roster) => Object.keys((roster && roster.people) || {});
export const inScope = (roster, id) => { const ids = scopeIds(roster); return ids.length === 0 || ids.includes(String(id)); };
/** The scope applies to a set of people only when at least one of them is in it — a file of strangers shows everyone rather than nobody. */
export const scopeApplies = (roster, ids) => scopeIds(roster).length > 0 && (ids || []).some((id) => inScope(roster, id));
export const positionOf = (roster, id, lang = 'ar') => { const p = roster && roster.people && roster.people[String(id)]; return p ? ((lang === 'en' && p.positionEn) || p.position || '') : ''; };
export const leaderOf = (roster, id) => { const p = roster && roster.people && roster.people[String(id)]; return p && p.leaderId ? p.leaderId : null; };
export function descendantsOf(roster, rootId) {
  const out = new Set(), queue = [String(rootId)];
  while (queue.length) { const id = queue.shift(); for (const k of reportsOf(roster, id)) if (!out.has(k) && k !== String(rootId)) { out.add(k); queue.push(k); } }
  return [...out];
}
export const reportsOf = (roster, leaderId) => Object.entries((roster && roster.people) || {}).filter(([, p]) => p.leaderId === String(leaderId)).map(([id]) => id);

// ===================== weights: points per task type and per activity category (ADR-0019) =====================
export const WEIGHTS_SCHEMA = 'afaqy-weights/v1';
export const WEIGHT_STEPS = [0, 1, 2, 3, 5, 8];
export const TIERS = ['admin', 'customer', 'integration', 'multistage'];
/** A task type's key: its English part, lowercased — "WASL Link | الربط مع وصل" and "التشييك … | check for devices config." both work. */
export function typeKey(name) {
  const parts = String(name || '').split('|').map((x) => x.trim()).filter(Boolean);
  const latin = parts.find((x) => /[a-z]/i.test(x)) || parts[0] || '';
  return latin.toLowerCase().replace(/\s+/g, ' ').trim();
}
export function parseWeights(raw) {
  const out = { v: 1, schema: WEIGHTS_SCHEMA, reviewed: '', default: 1, tasks: {}, activities: {}, editors: {} };
  if (!raw || typeof raw !== 'object') return out;
  const num = (w) => { const n = Number(w); return Number.isFinite(n) && n >= 0 && n <= 20 ? n : null; };
  out.reviewed = String(raw.reviewed || '').slice(0, 10);
  if (num(raw.default) != null) out.default = num(raw.default);
  for (const [k, x] of Object.entries(raw.tasks || {})) {
    const w = num(x && typeof x === 'object' ? x.w : x); if (w == null) continue;
    out.tasks[typeKey(k)] = { w, tier: TIERS.includes(x && x.tier) ? x.tier : null, team: ['aftersales', 'rd', 'both', 'general'].includes(x && x.team) ? x.team : null };
  }
  for (const [k, x] of Object.entries(raw.activities || {})) { const w = num(x); if (w != null) out.activities[String(k).toLowerCase().trim()] = w; }
  out.card = {}; for (const [k, v] of Object.entries(raw.card || {})) if (k in CARD_DEFAULTS && Number.isFinite(Number(v))) out.card[k] = Number(v);
  out.editors = {};
  for (const [uid, list] of Object.entries(raw.editors || {})) if (/^\d+$/.test(uid) && Array.isArray(list)) out.editors[uid] = list.map((k) => (k === '*' ? '*' : typeKey(k))).filter(Boolean).slice(0, 100);
  return out;
}
/** The device's own entries win over the repository's, type by type. */
export function mergeWeights(repo, device) {
  const a = parseWeights(repo), b = parseWeights(device);
  return { ...a, default: device && device.default != null ? b.default : a.default, tasks: { ...a.tasks, ...b.tasks }, activities: { ...a.activities, ...b.activities }, editors: { ...a.editors, ...b.editors }, card: { ...a.card, ...b.card }, reviewed: b.reviewed || a.reviewed };
}
/** Editing rights: editors[userId] = ['*'] or a list of type keys; nobody else may change a weight on the page. */
export const canEditWeight = (wt, userId, key) => { const e = wt && wt.editors && wt.editors[String(userId)]; return !!(e && (e.includes('*') || e.includes(typeKey(key)) || e.includes(String(key).toLowerCase()))); };
export const isWeightsAdmin = (wt, userId) => { const e = wt && wt.editors && wt.editors[String(userId)]; return !!(e && e.includes('*')); };
export const taskWeight = (wt, typeName) => { const x = wt && wt.tasks[typeKey(typeName)]; return x ? x.w : (wt ? wt.default : 1); };
export const activityWeight = (wt, category) => { const x = wt && wt.activities[String(category || '').toLowerCase().trim()]; return x != null ? x : (wt ? wt.default : 1); };
/**
 * Weighted points per person in a period: completed tasks (closed in the period, credited to the assignee, cancelled
 * left out) × their type's weight, plus activities with customers marked Done in the period × their category's weight.
 * The raw counts stay beside the points — points never replace them.
 */
export function weightedPoints(tasks, activities, wt, { range, team = null } = {}) {
  const keep = team ? new Set(team) : null, by = new Map();
  const row = (id) => { if (!by.has(id)) by.set(id, { id, taskPoints: 0, activityPoints: 0, tasks: 0, activities: 0, byType: {} }); return by.get(id); };
  if (keep) for (const id of keep) row(id);
  const inR = (iso) => { const d = saudiDay(iso); return d && (!range || (d >= range.from && d <= range.to)); };
  for (const x of tasks || []) {
    if (x.state !== 'done' || !x.assigneeId || !inR(x.completedAt) || (keep && !keep.has(x.assigneeId))) continue;
    const w = taskWeight(wt, x.type), r = row(x.assigneeId), k = typeKey(x.type) || '—';
    r.taskPoints += w; r.tasks++; (r.byType[k] = r.byType[k] || { n: 0, points: 0 }); r.byType[k].n++; r.byType[k].points += w;
  }
  for (const a of activities || []) {
    if (!/^done$/i.test(a.status || '') || !a.createdById || !inR(a.createdAt) || (keep && !keep.has(a.createdById))) continue;
    const r = row(a.createdById); r.activityPoints += activityWeight(wt, a.category); r.activities++;
  }
  const people = [...by.values()].map((r) => ({ ...r, total: r.taskPoints + r.activityPoints })).sort((a, b) => b.total - a.total);
  return { people, total: people.reduce((s, r) => s + r.total, 0), byId: new Map(people.map((r) => [r.id, r])) };
}

// ===================== the monthly card (ADR-0020): a work pattern described from the numbers, every line with its "why" =====================
export const CARD_DEFAULTS = { minN: 5, spec: 1.5, speed: 0.3, selfLogged: 0.4, agingDays: 7, rate: 0.85, minPoints: 10, tierIdx: 1.3 };
export const ARCHETYPES = ['field', 'voice', 'volume', 'balanced', 'early'];
const monthOf = (iso) => (saudiDay(iso) || '').slice(0, 7);
export const monthRange = (ym) => { const [y, m] = ym.split('-').map(Number); const last = new Date(Date.UTC(y, m, 0)).getUTCDate(); return { from: `${ym}-01`, to: `${ym}-${pad(last)}` }; };
export const prevMonth = (ym) => { const [y, m] = ym.split('-').map(Number); return m === 1 ? `${y - 1}-12` : `${y}-${pad(m - 1)}`; };
const medianOf = (arr) => { const a = arr.filter((v) => v != null).sort((x, y) => x - y); return a.length ? a[Math.floor(a.length / 2)] : null; };
const hoursBetween = (a, b) => (a && b ? (Date.parse(b) - Date.parse(a)) / 3600000 : null);
const isoWeek = (iso) => { const d = new Date(Date.parse(iso) + 3 * 3600000); const day = (d.getUTCDay() + 6) % 7; d.setUTCDate(d.getUTCDate() - day + 3); const w1 = new Date(Date.UTC(d.getUTCFullYear(), 0, 4)); return `${d.getUTCFullYear()}-${pad(1 + Math.round(((d - w1) / 86400000 - 3 + ((w1.getUTCDay() + 6) % 7)) / 7))}`; };

/**
 * One person's card for a month, against their team. ctx = { tasks, activities, weights, team (ids), roster, now, thresholds }.
 * Nothing here is a verdict without its numbers: strengths, gaps and suggestions each carry the figures that produced them.
 */
export function monthCard(ctx, personId, ym) {
  const T = { ...CARD_DEFAULTS, ...((ctx.weights && ctx.weights.card) || {}), ...(ctx.thresholds || {}) };
  const wt = ctx.weights, team = ctx.team || [], range = monthRange(ym), prev = monthRange(prevMonth(ym));
  const inM = (iso, r) => { const d = saudiDay(iso); return d && d >= r.from && d <= r.to; };
  const doneIn = (r) => (ctx.tasks || []).filter((x) => x.state === 'done' && x.completedAt && inM(x.completedAt, r) && x.assigneeId);
  const done = doneIn(range), donePrev = doneIn(prev);
  const tierOf = (type) => { const x = wt && wt.tasks[typeKey(type)]; return (x && x.tier) || 'admin'; };
  const pts = (rows) => rows.reduce((s, x) => s + taskWeight(wt, x.type), 0);
  const mine = done.filter((x) => x.assigneeId === personId), minePrev = donePrev.filter((x) => x.assigneeId === personId);
  const teamRows = done.filter((x) => team.includes(x.assigneeId));
  // volume: points against the team's median, and the quartile band
  const perPerson = team.map((id) => ({ id, points: pts(done.filter((x) => x.assigneeId === id)), done: done.filter((x) => x.assigneeId === id).length }));
  const myPoints = pts(mine), teamMedian = medianOf(perPerson.map((p) => p.points)) || 0;
  const sorted = [...perPerson].sort((a, b) => b.points - a.points);
  const rank = sorted.findIndex((p) => p.id === personId) + 1;
  const quartile = rank ? Math.min(4, Math.ceil((rank / sorted.length) * 4)) : null;
  const prevPoints = pts(minePrev);
  // fingerprint: points by tier, mine against the team's
  const byTier = (rows) => { const o = { admin: 0, customer: 0, integration: 0, multistage: 0 }; for (const x of rows) o[tierOf(x.type)] += taskWeight(wt, x.type); return o; };
  const mineT = byTier(mine), teamT = byTier(teamRows);
  const share = (o) => { const tot = Object.values(o).reduce((a, b) => a + b, 0) || 1; return Object.fromEntries(Object.entries(o).map(([k, v]) => [k, v / tot])); };
  const ms = share(mineT), ts = share(teamT);
  const idx = Object.fromEntries(TIERS.map((k) => [k, ts[k] > 0 ? ms[k] / ts[k] : (ms[k] > 0 ? 2 : 1)]));
  let archetype = 'balanced';
  if (myPoints < T.minPoints) archetype = 'early';
  else if ((ms.integration + ms.multistage) / Math.max(0.01, ts.integration + ts.multistage) >= T.tierIdx) archetype = 'field';
  else if (idx.customer >= T.tierIdx) archetype = 'voice';
  else if (idx.admin >= T.tierIdx && myPoints >= teamMedian) archetype = 'volume';
  // strengths: specialisation (my share of the team's work on a type vs my share overall), speed, initiative
  const myShare = teamRows.length ? mine.length / teamRows.length : 0;
  const types = [...new Set(teamRows.map((x) => typeKey(x.type)))];
  const perType = types.map((k) => {
    const tm = teamRows.filter((x) => typeKey(x.type) === k), me = mine.filter((x) => typeKey(x.type) === k);
    const name = (me[0] || tm[0]).type;
    const myMed = medianOf(me.map((x) => hoursBetween(x.createdAt, x.completedAt))), tmMed = medianOf(tm.map((x) => hoursBetween(x.createdAt, x.completedAt)));
    return { key: k, name, team: tm.length, mine: me.length, teamShare: tm.length / Math.max(1, teamRows.length), spec: myShare > 0 && tm.length ? (me.length / tm.length) / myShare : 0, myMed, tmMed };
  });
  const strengths = [];
  for (const p of perType) if (p.mine >= T.minN && p.spec >= T.spec) strengths.push({ kind: 'spec', type: p.name, mine: p.mine, team: p.team, pct: Math.round((p.mine / p.team) * 100), myPct: Math.round(myShare * 100) });
  for (const p of perType) if (p.mine >= T.minN && p.myMed != null && p.tmMed != null && p.myMed <= p.tmMed * (1 - T.speed)) strengths.push({ kind: 'speed', type: p.name, myMed: p.myMed, teamMed: p.tmMed });
  const myActs = (ctx.activities || []).filter((a) => a.createdById === personId && /^done$/i.test(a.status || '') && inM(a.createdAt, range)).length;
  if (myActs > 0) strengths.push({ kind: 'initiative', n: myActs, customers: new Set((ctx.activities || []).filter((a) => a.createdById === personId && inM(a.createdAt, range)).map((a) => a.customerId)).size });
  // development: tier gaps, slow types, signals
  const development = [];
  for (const k of TIERS) if (ts[k] >= 0.10 && ms[k] <= ts[k] / 2 && myPoints >= T.minPoints) development.push({ kind: 'tierGap', tier: k, mine: Math.round(ms[k] * 100), team: Math.round(ts[k] * 100) });
  for (const p of perType) if (p.mine >= T.minN && p.myMed != null && p.tmMed != null && p.myMed >= p.tmMed * (1 + T.speed)) development.push({ kind: 'slow', type: p.name, myMed: p.myMed, teamMed: p.tmMed });
  const selfLogged = mine.filter((x) => !x.fromEmail && x.createdById && x.createdById === x.assigneeId).length;
  if (mine.length >= T.minN && selfLogged / mine.length > T.selfLogged) development.push({ kind: 'selfLogged', pct: Math.round((selfLogged / mine.length) * 100) });
  const nowIso = ctx.now ? ctx.now.toISOString() : new Date().toISOString();
  const aging = (ctx.tasks || []).filter((x) => x.assigneeId === personId && x.state === 'open' && x.createdAt && hoursBetween(x.createdAt, nowIso) > T.agingDays * 24).length;
  if (aging > 0) development.push({ kind: 'aging', n: aging, days: T.agingDays });
  const assigned = (ctx.tasks || []).filter((x) => x.assigneeId === personId && inM(x.createdAt, range) && x.state !== 'cancelled');
  const rate = assigned.length >= T.minN ? assigned.filter((x) => x.state === 'done').length / assigned.length : null;
  if (rate != null && rate < T.rate) development.push({ kind: 'rate', pct: Math.round(rate * 100) });
  // suggestions for the manager: stretch, invest, balance — each with its reason
  const suggestions = [];
  const myMainTier = TIERS.reduce((a, b) => (mineT[a] >= mineT[b] ? a : b));
  const upTier = TIERS[Math.min(TIERS.length - 1, TIERS.indexOf(myMainTier) + 1)];
  if (upTier !== myMainTier && myPoints >= T.minPoints) {
    const cand = perType.filter((p) => tierOf(p.name) === upTier && p.team >= T.minN).sort((a, b) => b.team - a.team)[0];
    if (cand) suggestions.push({ kind: 'stretch', type: cand.name, tier: upTier, teamN: cand.team, mine: cand.mine });
  }
  const fast = strengths.find((x) => x.kind === 'speed'); if (fast) suggestions.push({ kind: 'invest', type: fast.type, myMed: fast.myMed, teamMed: fast.teamMed });
  if (quartile === 4 && perPerson.length >= 3) { const quick = perType.filter((p) => tierOf(p.name) === 'admin' && p.team >= T.minN).sort((a, b) => b.team - a.team)[0]; if (quick) suggestions.push({ kind: 'balanceUp', type: quick.name }); }
  if (quartile === 1 && perPerson.length >= 3) { const deep = perType.filter((p) => tierOf(p.name) === 'multistage' && p.team >= 1).sort((a, b) => b.team - a.team)[0]; if (deep) suggestions.push({ kind: 'balanceDeep', type: deep.name }); }
  // consistency: points per week inside the month
  const weeks = {}; for (const x of mine) { const w = isoWeek(x.completedAt); weeks[w] = (weeks[w] || 0) + taskWeight(wt, x.type); }
  const wv = Object.values(weeks); const mean = wv.length ? wv.reduce((a, b) => a + b, 0) / wv.length : 0;
  const sd = wv.length > 1 ? Math.sqrt(wv.reduce((a, b) => a + (b - mean) ** 2, 0) / wv.length) : 0;
  const consistency = wv.length >= 3 && mean > 0 ? Math.max(0, Math.min(1, 1 - sd / mean)) : null;
  const onLeave = !!(ctx.roster && ctx.roster.people && ctx.roster.people[personId] && ctx.roster.people[personId].onLeave);
  return { month: ym, personId, onLeave, points: myPoints, done: mine.length, rank: rank || null, prevPoints, prevDone: minePrev.length, teamMedian, quartile, teamSize: perPerson.length,
    tiers: { mine: mineT, team: teamT, mineShare: ms, teamShare: ts }, archetype, strengths, development, suggestions, consistency, weeks: wv.length, activities: myActs, selfLoggedPct: mine.length ? Math.round((selfLogged / mine.length) * 100) : 0 };
}
/** The team's month: a card per person, the heat map (people × tiers) and the next month's plan from the suggestions. */
export function teamMonth(ctx, ym) {
  const cards = (ctx.team || []).map((id) => monthCard(ctx, id, ym));
  const heat = cards.map((c) => ({ id: c.id || c.personId, ...c.tiers.mine, total: c.points }));
  return { month: ym, cards, heat, plan: cards.filter((c) => c.suggestions.length).map((c) => ({ id: c.personId, suggestions: c.suggestions, archetype: c.archetype })) };
}
/** Months fully inside the data and already over: these get closed cards. */
export function closableMonths(ranges, now = new Date()) {
  const today = ymd(saudiToday(now)); const out = new Set();
  for (const r of ranges || []) { let ym = r.from.slice(0, 7); while (ym <= r.to.slice(0, 7)) { const m = monthRange(ym); if (m.from >= r.from && m.to <= r.to && m.to < today) out.add(ym); ym = ym === r.to.slice(0, 7) ? '9999-99' : (([y, mm]) => (mm === 12 ? `${y + 1}-01` : `${y}-${pad(mm + 1)}`))(ym.split('-').map(Number)); } }
  return [...out].sort();
}

// ===================== the week, goals and the pattern's path (ADR-0021) =====================
/** The last 7 days against the 7 before, per person in scope: points, the movers, sharp drops, and work left open too long. */
export function weeklyDigest(tasks, wt, team, now = new Date(), T = CARD_DEFAULTS) {
  const end = Date.parse(now.toISOString()), d7 = 7 * 86400000;
  const win = (x, a, b) => { const t0 = x.completedAt ? Date.parse(x.completedAt) : NaN; return t0 > a && t0 <= b; };
  const rows = (team || []).map((id) => {
    const mine = (tasks || []).filter((x) => x.assigneeId === id && x.state === 'done');
    const thisW = mine.filter((x) => win(x, end - d7, end)), lastW = mine.filter((x) => win(x, end - 2 * d7, end - d7));
    const p = thisW.reduce((s, x) => s + taskWeight(wt, x.type), 0), q = lastW.reduce((s, x) => s + taskWeight(wt, x.type), 0);
    const aging = (tasks || []).filter((x) => x.assigneeId === id && x.state === 'open' && x.createdAt && end - Date.parse(x.createdAt) > (T.agingDays || 7) * 86400000).length;
    return { id, points: p, prev: q, delta: p - q, done: thisW.length, aging };
  });
  const drops = rows.filter((r) => r.prev >= 10 && r.points <= r.prev * 0.6).sort((a, b) => a.delta - b.delta);
  const movers = [...rows].filter((r) => r.delta > 0).sort((a, b) => b.delta - a.delta).slice(0, 3);
  const aging = rows.filter((r) => r.aging > 0).sort((a, b) => b.aging - a.aging);
  return { rows, drops, movers, aging, total: rows.reduce((s, r) => s + r.points, 0), prevTotal: rows.reduce((s, r) => s + r.prev, 0), from: new Date(end - d7).toISOString(), to: now.toISOString() };
}
/** A month's goals for one person: each goal is a task type with a target count, or a points target; progress from that month's completed work. */
export function goalProgress(tasks, wt, personId, ym, goals) {
  const r = monthRange(ym);
  const mine = (tasks || []).filter((x) => x.assigneeId === personId && x.state === 'done' && x.completedAt && saudiDay(x.completedAt) >= r.from && saudiDay(x.completedAt) <= r.to);
  return (goals || []).map((g) => {
    const got = g.key === '__points__' ? mine.reduce((s, x) => s + taskWeight(wt, x.type), 0) : mine.filter((x) => typeKey(x.type) === g.key).length;
    return { ...g, got, pct: g.target > 0 ? Math.min(100, Math.round((got / g.target) * 100)) : 0, met: got >= g.target };
  });
}
/** The pattern's path: closed months in order, for one person — archetype, points, quartile. */
export function patternPath(closed, personId) {
  return Object.keys(closed || {}).sort().map((ym) => closed[ym][personId] ? { month: ym, archetype: closed[ym][personId].archetype, points: closed[ym][personId].points, quartile: closed[ym][personId].quartile } : null).filter(Boolean);
}

/** Parts of a whole as donut segments: each gets its share, and the SVG dash pair for a circle of radius r. */
export function donutParts(parts, r = 40) {
  const C = 2 * Math.PI * r;
  const total = parts.reduce((s, p) => s + Math.max(0, p.value || 0), 0);
  let offset = 0;
  return { total, parts: parts.filter((p) => p.value > 0).map((p) => {
    const share = total ? p.value / total : 0, len = share * C;
    const seg = { ...p, share, dasharray: `${len.toFixed(2)} ${(C - len).toFixed(2)}`, dashoffset: (-offset).toFixed(2) };
    offset += len; return seg;
  }) };
}

/** This month so far, and the same days of last month — a fair comparison (whole months would not be). */
export function monthWindows(now = new Date()) {
  const today = ymd(saudiToday(now));
  const [y, m, d] = today.split('-').map(Number);
  const py = m === 1 ? y - 1 : y, pm = m === 1 ? 12 : m - 1;
  const lastDay = new Date(Date.UTC(py, pm, 0)).getUTCDate();
  return { day: d, this: { from: `${y}-${pad(m)}-01`, to: today }, last: { from: `${py}-${pad(pm)}-01`, to: `${py}-${pad(pm)}-${pad(Math.min(d, lastDay))}` } };
}

/** A period so far against the same number of days before it: this month, this quarter, or the last six months. */
export function periodWindows(kind = 'month', now = new Date()) {
  if (kind === 'month') return { kind, ...monthWindows(now) };
  const today = ymd(saudiToday(now));
  const [y, m] = today.split('-').map(Number);
  const dayMs = 86400000, at = (d) => Date.parse(`${d}T00:00:00Z`), toYmd = (ms) => new Date(ms).toISOString().slice(0, 10);
  let start, prevStart;
  if (kind === 'quarter') {
    const qm = Math.floor((m - 1) / 3) * 3 + 1;
    start = `${y}-${pad(qm)}-01`;
    prevStart = qm === 1 ? `${y - 1}-10-01` : `${y}-${pad(qm - 3)}-01`;
  } else {               // 'half': the last six months against the six before — both inside the twelve months the bookmark reads
    start = toYmd(at(today) - 182 * dayMs);
    prevStart = toYmd(at(start) - 183 * dayMs);
  }
  const span = Math.round((at(today) - at(start)) / dayMs);
  const prevEnd = toYmd(at(prevStart) + span * dayMs);
  const lastCap = kind === 'quarter' ? toYmd(at(start) - dayMs) : toYmd(at(start) - dayMs);
  return { kind, day: span + 1, this: { from: start, to: today }, last: { from: prevStart, to: prevEnd < lastCap ? prevEnd : lastCap } };
}

/** Two things a leader looks for first: who needs a look, and who clearly improved — with the reasons. */
export function teamAlerts(below) {
  const rows = below.filter((r) => r.this.assigned >= 5 || r.this.done >= 5);
  if (!rows.length) return { attention: null, improved: null };
  const meds = rows.map((r) => r.this.medianHours).filter((v) => v != null).sort((a, b) => a - b);
  const teamMed = meds.length ? meds[Math.floor(meds.length / 2)] : null;
  const opens = rows.map((r) => r.this.open);
  const maxOpen = Math.max(...opens);
  let attention = null;
  for (const r of rows) {
    const why = [];
    if (r.this.rate != null && r.this.rate < 0.85) why.push({ k: 'rate', v: r.this.rate });
    if (r.this.open >= 8 && r.this.open === maxOpen) why.push({ k: 'open', v: r.this.open });
    if (teamMed && r.this.medianHours != null && r.this.medianHours > 2 * teamMed) why.push({ k: 'median', v: r.this.medianHours });
    const score = why.length + (why.some((w) => w.k === 'rate') ? 1 : 0);
    if (why.length && (!attention || score > attention.score)) attention = { id: r.id, why, score };
  }
  let improved = null;
  for (const r of rows) { const d = r.this.done - r.last.done; if (d >= 3 && (!improved || d > improved.delta)) improved = { id: r.id, delta: d }; }
  return { attention, improved };
}

/** Who the hand-over lets this person see: assignees in the data, the default team, and the people below them. */
export function scopeOf(me, roster = null) {
  const visible = [...new Set(me.tasks.filter((x) => x.assigneeId).map((x) => x.assigneeId))];
  const others = visible.filter((id) => id !== me.user.id);
  const applies = scopeApplies(roster, visible);
  const def = (applies ? scopeIds(roster) : defaultTeam(me.people, me.tasks)).filter((id) => visible.includes(id));
  const team = def.length > 1 ? def : (applies ? visible.filter((id) => inScope(roster, id)) : visible);
  const byMyafaqy = me.people.filter((p) => p.below && visible.includes(p.id)).map((p) => p.id);
  const byRoster = descendantsOf(roster, me.user.id).filter((id) => visible.includes(id) && id !== me.user.id);
  const below = [...new Set([...byMyafaqy, ...byRoster])].filter((id) => !applies || inScope(roster, id));
  return { visible, others, team, below };
}

/** The person's month against last month, the team average (no names) and the rows of the people below them. */
export function profileMonths(me, now = new Date(), roster = null, kind = 'month') {
  const w = periodWindows(kind, now);
  const zero = { assigned: 0, done: 0, rate: null, medianHours: null, open: 0, selfLogged: 0, fromEmail: 0 };
  const row = (range, id) => factor1(me.tasks, { range, team: [id] }).people[0] || { ...zero, id };
  const sc = scopeOf(me, roster);
  const mine = { this: row(w.this, me.user.id), last: row(w.last, me.user.id) };
  let average = null;
  if (sc.team.filter((id) => id !== me.user.id).length) {
    const rows = factor1(me.tasks, { range: w.this, team: sc.team }).people.filter((r) => r.assigned || r.done);
    if (rows.length > 1) {
      const mean = (k) => rows.reduce((s, r) => s + (r[k] || 0), 0) / rows.length;
      const rates = rows.map((r) => r.rate).filter((v) => v != null);
      const meds = rows.map((r) => r.medianHours).filter((v) => v != null).sort((a, b) => a - b);
      average = { n: rows.length, assigned: mean('assigned'), done: mean('done'), selfLogged: mean('selfLogged'), fromEmail: mean('fromEmail'),
        rate: rates.length ? rates.reduce((s, v) => s + v, 0) / rates.length : null,
        medianHours: meds.length ? (meds.length % 2 ? meds[(meds.length - 1) / 2] : (meds[meds.length / 2 - 1] + meds[meds.length / 2]) / 2) : null };
    }
  }
  const below = sc.below.map((id) => ({ id, this: row(w.this, id), last: row(w.last, id) }))
    .sort((a, b) => b.this.done - a.this.done || b.this.assigned - a.this.assigned);
  const doneThis = me.tasks.filter((x) => x.assigneeId === me.user.id && x.state === 'done' && x.completedAt && saudiDay(x.completedAt) >= w.this.from && saudiDay(x.completedAt) <= w.this.to);
  const sources = { email: doneThis.filter((x) => x.fromEmail).length, self: doneThis.filter((x) => !x.fromEmail && x.own === true).length };
  sources.other = doneThis.length - sources.email - sources.self;
  return { windows: w, scope: sc, mine, average, below, sources };
}

/** The profile: Factor 1 for this one person, per quarter, newest first, over what the bookmark read. */
export function myProfile(me, now = new Date()) {
  const quarters = periodBlocks(3, 5, now);
  const since = me.since ? saudiDay(me.since) : null;
  return quarters.filter((q) => !since || q.to >= since).map((q) => {
    const range = { from: since && q.from < since ? since : q.from, to: q.to };
    const f = factor1(me.tasks, { range, team: [me.user.id] });
    return { ...q, range, partial: q.partial || (since && q.from < since), row: f.people[0] || null };
  });
}

// ===================== sample data (clearly marked) =====================
/** A deterministic v2 sample so the dashboard can be seen before the first real pull. Marked sample:true. */
export function sampleDataset(range, seed = 7) {
  let s = seed;
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  const people = [['901', 'Engineer A', 'مهندس أ'], ['902', 'Engineer B', 'مهندس ب'], ['903', 'Engineer C', 'مهندس ج'], ['904', 'Engineer D', 'مهندس د'], ['905', 'Engineer E', 'مهندس هـ']];
  const from = Date.parse(`${range.from}T00:00:00${TZ_OFFSET}`), to = Date.parse(`${range.to}T23:59:00${TZ_OFFSET}`);
  const tasks = [];
  const n = 60 + Math.floor(rnd() * 40);
  for (let i = 0; i < n; i++) {
    const p = people[Math.floor(rnd() * people.length)];
    const created = from + rnd() * (to - from);
    const roll = rnd();
    const state = roll < 0.72 ? 'done' : roll < 0.8 ? 'cancelled' : 'open';
    const done = state === 'done' ? new Date(Math.min(created + (2 + rnd() * rnd() * 160) * 3600000, to)).toISOString() : null;
    const email = rnd() < 0.45;
    tasks.push({
      id: `S${range.from}-${i}`, title: 'مهمة تجريبية', typeId: email ? 62 : 16, type: email ? 'Email Customer Activity' : 'Prepare the visit',
      statusId: state === 'done' ? 3 : 2, state, createdAt: new Date(created).toISOString(),
      createdById: email ? '681' : people[Math.floor(rnd() * people.length)][0], assigneeId: p[0],
      completedAt: done, moduleId: email ? EMAIL_MODULE : 179, customer: null, bucket: state === 'open' ? 'open' : 'done',
    });
  }
  const doneIn = tasks.filter((x) => x.state === 'done').length;
  return { schema: SCHEMA, range, extractedAt: new Date().toISOString(), taskGroupId: 100001, sample: true,
    source: { endpoint: 'sample', doneInRangeTotal: doneIn, openTotal: tasks.filter((x) => x.state === 'open').length, pageSize: 20 },
    people: people.map(([id, en, ar]) => ({ id, nameEn: en, nameAr: ar, teams: ['Aftersales Jeddah'], branchCode: JEDDAH_BRANCH })),
    tasks, notes: [] };
}
