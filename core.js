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
    brand: 'أفاقي', portal: 'بوابة الفريق التقني — جدة',
    nav_tools: 'الأدوات', nav_data: 'البيانات', nav_kpi: 'المؤشرات',
    tools_title: 'أدوات الفريق', tools_sub: 'كل أداة تعمل داخل البوابة، بحسابها المعتاد.',
    primary: 'الأدوات الأساسية', systems: 'أنظمة الشركة', more: 'أدوات أخرى', soon: 'قريبًا',
    open: 'فتح',
    data_title: 'بيانات المؤشرات', data_sub: 'البيانات تُسحب من ماي أفاقي بواسطة كلود كروم، ثم تُرفع هنا. تبقى على هذا الجهاز فقط.',
    step1: 'اختر الفترة', step2: 'انسخ الأمر إلى كلود كروم', step3: 'ارفع النتيجة',
    block_size: 'طول الفترة', blocks_back: 'عدد الفترات',
    m3: 'ربع سنة', m6: 'نصف سنة', m12: 'سنة',
    branch: 'الفرع في ماي أفاقي',
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
    g_data_b: 'البوابة لا تقرأ ماي أفاقي بنفسها، لأن خادمه لا يقبل طلبات من موقع خارجي. لذلك يسحب كلود كروم البيانات من داخل ماي أفاقي ويعيدها بصيغة ثابتة. اختر طول الفترة وعددها، وانسخ الأمر بجانب كل فترة، والصقه في كلود كروم وأنت داخل ماي أفاقي، ثم الصق رده هنا أو ارفعه كملف.',
    g_parts_h: 'الرد الطويل والفترة الناقصة',
    g_parts_b: 'إذا قسّم كلود كروم الرد إلى أجزاء، ارفعها كلها؛ تُدمج بحسب رقم المهمة. تبقى الفترة «ناقصة» حتى يساوي عدد المهام العدد الذي أعلنه ماي أفاقي نفسه، وتظهر فوق أرقامها علامة تحذير.',
    g_kpi_h: 'المؤشرات',
    g_kpi_b: 'اختر الفترة من القائمة. الجدول يعرض لكل موظف ما أُسند إليه وما أنجزه ونسبة الإنجاز ومدة الإنجاز وما هو مفتوح الآن، ثم إجمالي الفريق. الفريق المحسوب يُحدَّد تلقائيًّا من فرق فرع جدة في ماي أفاقي، ويمكن تعديله من «الفريق المحسوب في المؤشرات». وإذا رُفعت أكثر من فترة تظهر المقارنة بينها. طريقة حساب كل رقم مكتوبة أسفل الصفحة.',
    g_privacy_h: 'أين تُحفظ البيانات',
    g_privacy_b: 'على هذا الجهاز وفي هذا المتصفح فقط، ولا يُرسل منها شيء لأي جهة. لنقلها إلى جهاز آخر أو الاحتفاظ بنسخة استخدم «تصدير نسخة احتياطية» ثم «استعادة نسخة». مسح بيانات المتصفح يمسحها.',
    def_5: '«المفتوحة الآن» صورة لحظة السحب، أيًّا كان تاريخ إنشاء المهمة.',
    team_title: 'الفريق المحسوب في المؤشرات',
    team_count: '{n} من {total}',
    team_jeddah: 'فرق فرع جدة',
    team_all: 'الكل',
    team_hint: 'يُحدَّد تلقائيًّا من فرق ماي أفاقي المسجّلة على فرع جدة، ويمكن تعديله. يُحفظ على هذا الجهاز.',
    back_tools: 'كل الأدوات',
    open_tab: 'فتح في نافذة مستقلة',
    module_loading: 'جارٍ فتح الأداة…',
    in_portal: 'تعمل داخل البوابة',
    systems_note: 'تفتح في نافذة جديدة — أنظمة الشركة لا تسمح بعرضها داخل صفحة أخرى.',
    side_modules: 'الوحدات',
    side_portal: 'البوابة',
    menu: 'القائمة',
    nav_home: 'الرئيسية',
    kpi_board: 'لوحة المؤشرات',
    lang_label: 'اللغة',
    theme_dark: 'الوضع الداكن',
    theme_light: 'الوضع الفاتح',
    nav_me: 'مؤشراتي',
    me_title: 'مؤشراتي',
    me_sub: 'مؤشرات عملك أنت وحدك، من «مهامي» في ماي أفاقي وبدخولك أنت. لا يراها غيرك، وتبقى على جهازك.',
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
    me_who: '{name} — آخر تحديث {date}',
    me_wait: 'في انتظار مهامك من ماي أفاقي…',
    me_loaded: 'وصلت مؤشراتك: {n} مهمة',
    me_q: 'الربع',
    me_partial: 'جزء منه',
    me_refresh_h: 'التحديث والإعداد',
    me_refresh: 'للتحديث: افتح ماي أفاقي واضغط الإشارة مرة أخرى.',
    me_forget: 'حذف مؤشراتي من هذا الجهاز',
    g_me_h: 'مؤشراتي',
    g_me_b: 'كل موظف يرى مؤشراته هو فقط، بلا حساب جديد ولا كلمة مرور: إشارة في المتصفح تعمل داخل ماي أفاقي بدخوله هو، تقرأ «مهامي» لآخر اثني عشر شهرًا — وماي أفاقي نفسه لا يعطي فيها إلا مهام صاحب الدخول — ثم تفتح هذه الصفحة بالأرقام. تُقرأ أرقام المهام وأوقاتها وحالاتها فقط، بلا عناوين ولا عملاء ولا رمز الدخول، ولا يُرسل شيء لأي خادم. الإعداد مرة واحدة من صفحة «مؤشراتي»: سحب الزر إلى شريط الإشارات على الكمبيوتر، أو حفظه يدويًّا على الجوال.',
    col_self: 'سجّلها لنفسه',
    def_6: '«سجّلها لنفسه» من المسندة: مهام فتحها الموظف وأسندها لنفسه، لا من البريد — وهي عند الفريق الطلبات التي تصل بالواتساب أو بالمكالمات. ماي أفاقي يسجّل منشئ المهمة لا قناتها، فلا يُفصل الواتساب عن المكالمة. تُقرأ مع بقية الأعمدة: تُظهر من أين جاء الحمل، لا جودة العمل.',
  },
  en: {
    brand: 'Afaqy', portal: 'Technical team portal — Jeddah',
    nav_tools: 'Tools', nav_data: 'Data', nav_kpi: 'KPIs',
    tools_title: 'Team tools', tools_sub: 'Each tool works inside the portal, with its usual sign-in.',
    primary: 'Core tools', systems: 'Company systems', more: 'More tools', soon: 'Coming soon',
    open: 'Open',
    data_title: 'KPI data', data_sub: 'Data is pulled from myafaqy by Claude in Chrome, then uploaded here. It stays on this device only.',
    step1: 'Choose the period', step2: 'Copy the prompt to Claude in Chrome', step3: 'Upload the result',
    block_size: 'Period length', blocks_back: 'Number of periods',
    m3: 'Quarter', m6: 'Half year', m12: 'Year',
    branch: 'Branch in myafaqy',
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
    g_data_b: 'The portal does not read myafaqy itself, because its server refuses calls from another website. Claude in Chrome pulls the data from inside myafaqy and returns it in a fixed format. Choose the period length and count, copy the prompt next to each period, paste it into Claude in Chrome while signed in to myafaqy, then paste its reply here or upload it as a file.',
    g_parts_h: 'Long replies and incomplete periods',
    g_parts_b: 'If Claude in Chrome splits its reply into parts, upload them all; they merge by task id. A period stays “incomplete” until its task count equals the total myafaqy itself reported, and its figures carry a warning.',
    g_kpi_h: 'KPIs',
    g_kpi_b: 'Choose the period from the list. The table shows, per employee, what was assigned, what was completed, the completion rate, the time to complete and what is open now, then the team total. The team counted is set automatically from the Jeddah-branch teams in myafaqy and can be changed under “The team counted in the KPIs”. With more than one period uploaded, a comparison appears. How each figure is calculated is written at the bottom.',
    g_privacy_h: 'Where the data is kept',
    g_privacy_b: 'On this device and in this browser only; nothing is sent anywhere. To move it to another device or keep a copy, use “Export a backup” then “Restore a backup”. Clearing the browser’s data clears it.',
    def_5: '“Open now” is a snapshot at the moment of extraction, whatever the task’s creation date.',
    team_title: 'The team counted in the KPIs',
    team_count: '{n} of {total}',
    team_jeddah: 'Jeddah branch teams',
    team_all: 'Everyone',
    team_hint: 'Set automatically from the myafaqy teams registered to the Jeddah branch, and can be changed. Kept on this device.',
    back_tools: 'All tools',
    open_tab: 'Open in its own tab',
    module_loading: 'Opening the tool…',
    in_portal: 'Works inside the portal',
    systems_note: 'Open in a new tab — the company systems do not allow being shown inside another page.',
    side_modules: 'Modules',
    side_portal: 'Portal',
    menu: 'Menu',
    nav_home: 'Home',
    kpi_board: 'KPI board',
    lang_label: 'Language',
    theme_dark: 'Dark mode',
    theme_light: 'Light mode',
    nav_me: 'My KPIs',
    me_title: 'My KPIs',
    me_sub: 'Your own work KPIs, from “My Tasks” in myafaqy, with your own sign-in. Nobody else sees them, and they stay on your device.',
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
    me_who: '{name} — last refreshed {date}',
    me_wait: 'Waiting for your tasks from myafaqy…',
    me_loaded: 'Your KPIs arrived: {n} tasks',
    me_q: 'Quarter',
    me_partial: 'partial',
    me_refresh_h: 'Refresh and setup',
    me_refresh: 'To refresh: open myafaqy and press the bookmark again.',
    me_forget: 'Remove my KPIs from this device',
    g_me_h: 'My KPIs',
    g_me_b: 'Each employee sees only their own KPIs, with no new account or password: a browser bookmark runs inside myafaqy with their own sign-in, reads “My Tasks” for the last twelve months — where myafaqy itself returns only the signed-in person’s tasks — and opens this page with the figures. Only task numbers, times and states are read: no titles, no customers, no sign-in token, and nothing is sent to any server. Setup is once, from the “My KPIs” page: drag the button onto the bookmarks bar on a computer, or save it by hand on a phone.',
    col_self: 'Self-logged',
    def_6: '“Self-logged”, among the assigned: tasks the employee opened and assigned to himself, not from email — in this team, the requests that arrive by WhatsApp or by phone. myafaqy records who created a task, not its channel, so WhatsApp and calls cannot be separated. Read it with the other columns: it shows where the load came from, not the quality of the work.',
  },
  ur: {
    brand: 'آفاقی', portal: 'تکنیکی ٹیم کا پورٹل — جدہ',
    nav_tools: 'ٹولز', nav_data: 'ڈیٹا', nav_kpi: 'کارکردگی کے اشاریے',
    tools_title: 'ٹیم کے ٹولز', tools_sub: 'ہر ٹول پورٹل کے اندر، اپنے معمول کے اکاؤنٹ سے چلتا ہے۔',
    primary: 'بنیادی ٹولز', systems: 'کمپنی کے سسٹمز', more: 'دیگر ٹولز', soon: 'جلد آ رہا ہے',
    open: 'کھولیں',
    data_title: 'اشاریوں کا ڈیٹا', data_sub: 'ڈیٹا مائی آفاقی سے کلاڈ کروم کے ذریعے نکالا جاتا ہے اور پھر یہاں اپ لوڈ کیا جاتا ہے۔ یہ صرف اسی ڈیوائس پر محفوظ رہتا ہے۔',
    step1: 'مدت منتخب کریں', step2: 'ہدایت کاپی کر کے کلاڈ کروم میں دیں', step3: 'نتیجہ اپ لوڈ کریں',
    block_size: 'مدت کی لمبائی', blocks_back: 'مدتوں کی تعداد',
    m3: 'سہ ماہی', m6: 'ششماہی', m12: 'سال',
    branch: 'مائی آفاقی میں برانچ',
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
    g_data_b: 'پورٹل مائی آفاقی کو خود نہیں پڑھتا، کیونکہ اس کا سرور کسی دوسری ویب سائٹ سے آنے والی درخواستیں قبول نہیں کرتا۔ اس لیے کلاڈ کروم مائی آفاقی کے اندر سے ڈیٹا نکال کر ایک مقررہ فارمیٹ میں واپس کرتا ہے۔ مدت کی لمبائی اور تعداد منتخب کریں، ہر مدت کے سامنے والی ہدایت کاپی کریں، مائی آفاقی میں لاگ اِن ہو کر اسے کلاڈ کروم میں پیسٹ کریں، پھر اس کا جواب یہاں پیسٹ کریں یا فائل کے طور پر اپ لوڈ کریں۔',
    g_parts_h: 'لمبے جوابات اور نامکمل مدتیں',
    g_parts_b: 'اگر کلاڈ کروم اپنا جواب کئی حصوں میں تقسیم کرے تو تمام حصے اپ لوڈ کریں؛ یہ ٹاسک نمبر کے حساب سے آپس میں جڑ جاتے ہیں۔ کوئی مدت اس وقت تک «نامکمل» رہتی ہے جب تک اس کے ٹاسکس کی تعداد مائی آفاقی کی بتائی ہوئی کل تعداد کے برابر نہ ہو جائے، اور اس کے اعداد پر انتباہ دکھائی دیتا ہے۔',
    g_kpi_h: 'کارکردگی کے اشاریے',
    g_kpi_b: 'فہرست سے مدت منتخب کریں۔ جدول ہر ملازم کے لیے دکھاتا ہے کہ اسے کیا تفویض ہوا، اس نے کیا مکمل کیا، تکمیل کی شرح، تکمیل کا وقت اور اس وقت کیا کھلا ہے؛ پھر ٹیم کا مجموعہ۔ شامل ٹیم مائی آفاقی میں جدہ برانچ کی ٹیموں سے خود بخود منتخب ہوتی ہے اور «اشاریوں میں شامل ٹیم» سے بدلی جا سکتی ہے۔ ایک سے زیادہ مدتیں اپ لوڈ ہوں تو ان کا موازنہ ظاہر ہوتا ہے۔ ہر عدد کا حساب کیسے ہوتا ہے، یہ صفحے کے نیچے لکھا ہے۔',
    g_privacy_h: 'ڈیٹا کہاں محفوظ رہتا ہے',
    g_privacy_b: 'صرف اسی ڈیوائس اور اسی براؤزر میں؛ کہیں بھی کچھ نہیں بھیجا جاتا۔ کسی دوسری ڈیوائس پر منتقل کرنے یا نقل رکھنے کے لیے «بیک اپ برآمد کریں» اور پھر «بیک اپ بحال کریں» استعمال کریں۔ براؤزر کا ڈیٹا صاف کرنے سے یہ بھی مٹ جاتا ہے۔',
    def_5: '«اس وقت کھلے» ڈیٹا نکالنے کے لمحے کی تصویر ہے، ٹاسک کسی بھی تاریخ کو بنا ہو۔',
    team_title: 'اشاریوں میں شامل ٹیم',
    team_count: '{total} میں سے {n}',
    team_jeddah: 'جدہ برانچ کی ٹیمیں',
    team_all: 'سب',
    team_hint: 'مائی آفاقی میں جدہ برانچ پر درج ٹیموں سے خود بخود منتخب ہوتی ہے، اور بدلی جا سکتی ہے۔ اسی ڈیوائس پر محفوظ رہتی ہے۔',
    back_tools: 'تمام ٹولز',
    open_tab: 'الگ ٹیب میں کھولیں',
    module_loading: 'ٹول کھل رہا ہے…',
    in_portal: 'پورٹل کے اندر چلتا ہے',
    systems_note: 'نئی ٹیب میں کھلتے ہیں — کمپنی کے سسٹمز کسی دوسرے صفحے کے اندر دکھائے جانے کی اجازت نہیں دیتے۔',
    side_modules: 'ماڈیولز',
    side_portal: 'پورٹل',
    menu: 'مینو',
    nav_home: 'ہوم',
    kpi_board: 'اشاریوں کا بورڈ',
    lang_label: 'زبان',
    theme_dark: 'تاریک انداز',
    theme_light: 'روشن انداز',
    nav_me: 'میرے اشاریے',
    me_title: 'میرے اشاریے',
    me_sub: 'آپ کے اپنے کام کے اشاریے، مائی آفاقی کے «میرے ٹاسک» سے، آپ ہی کے لاگ اِن سے۔ انہیں آپ کے سوا کوئی نہیں دیکھتا، اور یہ آپ کی ڈیوائس پر رہتے ہیں۔',
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
    me_who: '{name} — آخری بار تازہ {date}',
    me_wait: 'مائی آفاقی سے آپ کے ٹاسک کا انتظار…',
    me_loaded: 'آپ کے اشاریے آ گئے: {n} ٹاسک',
    me_q: 'سہ ماہی',
    me_partial: 'جزوی',
    me_refresh_h: 'تازہ کاری اور ترتیب',
    me_refresh: 'تازہ کرنے کے لیے: مائی آفاقی کھولیں اور بک مارک دوبارہ دبائیں۔',
    me_forget: 'میرے اشاریے اس ڈیوائس سے ہٹائیں',
    g_me_h: 'میرے اشاریے',
    g_me_b: 'ہر ملازم صرف اپنے اشاریے دیکھتا ہے، بغیر کسی نئے اکاؤنٹ یا پاس ورڈ کے: براؤزر کا ایک بک مارک مائی آفاقی کے اندر اسی کے لاگ اِن سے چلتا ہے، پچھلے بارہ مہینوں کے «میرے ٹاسک» پڑھتا ہے — جہاں مائی آفاقی خود صرف لاگ اِن والے شخص کے ٹاسک دیتا ہے — اور یہ صفحہ اعداد کے ساتھ کھولتا ہے۔ صرف ٹاسک کے نمبر، اوقات اور حالتیں پڑھی جاتی ہیں: نہ عنوان، نہ کسٹمر، نہ لاگ اِن ٹوکن، اور کچھ بھی کسی سرور کو نہیں بھیجا جاتا۔ ترتیب ایک بار ہوتی ہے، «میرے اشاریے» کے صفحے سے: کمپیوٹر پر بٹن کو بک مارکس بار پر کھینچیں، یا موبائل پر اسے ہاتھ سے محفوظ کریں۔',
    col_self: 'خود درج کیے',
    def_6: '«خود درج کیے»، تفویض شدہ میں سے: وہ ٹاسک جو ملازم نے خود کھولے اور خود کو تفویض کیے، ای میل سے نہیں — اس ٹیم میں وہ درخواستیں جو واٹس ایپ یا کال سے آتی ہیں۔ مائی آفاقی ٹاسک بنانے والے کو درج کرتا ہے، اس کا ذریعہ نہیں، اس لیے واٹس ایپ اور کال کو الگ نہیں کیا جا سکتا۔ اسے باقی کالموں کے ساتھ پڑھیں: یہ بتاتا ہے کہ کام کا بوجھ کہاں سے آیا، کام کا معیار نہیں۔',
  },
};

// The user guide: one list, read by the page (Guide tab) and by scripts/build-manual.mjs, so they can never differ.
export const GUIDE = [['g_tools_h', 'g_tools_b'], ['g_me_h', 'g_me_b'], ['g_data_h', 'g_data_b'], ['g_parts_h', 'g_parts_b'], ['g_kpi_h', 'g_kpi_b'], ['g_privacy_h', 'g_privacy_b']];
export const DEFINITIONS = ['def_1', 'def_2', 'def_3', 'def_4', 'def_5', 'def_6'];

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
   Page size: the app sends 20. You may send 100 once; use 100 only if that bucket's "pageSize" comes back as 100, otherwise keep 20.
a. DONE IN THE PERIOD: set "completedOn": ["${fromZ}", "${toZ}"]. Record done.listCount as "doneInRangeTotal". Walk the whole done bucket.${later ? `
b. CREATED IN THE PERIOD, DONE LATER: set "completedOn": ["${toZ}", "${nowZ}"]. Walk the done bucket and keep only rows whose createdOn falls inside the period.` : ''}
${later ? 'c' : 'b'}. OPEN NOW: send "completedOn": []. Walk the toDo and open buckets completely (ignore done here). Record toDo.listCount + open.listCount as "openTotal".

TIMES: createdOn and closeDate carry no time zone. Check once whether they are Saudi local time: open one task on screen and compare the time it shows with createdOn in the response. Write every time in your answer with the offset you established (normally +03:00) and state it in "notes".

DO NOT USE: "dateOfCompletion" (always null), "isAutomaticTask" (contradicts itself between the grid and the detail), the "createdBy" / "assignee" name strings (unreliable — names come from step 1), "type" and "priorty" (always null).

WHAT TO RETURN
Return ONLY one JSON code block, exactly in this format and nothing else around it:

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
  "notes": ["<the time offset you established, anything the app now sends differently, filters you could not apply>"]
}

MAPPING
- "state": "cancelled" when isCancelled is true; otherwise "done" when statusId is 3; otherwise "open".
- "people": only users who appear in "tasks" as assignee or creator.
- If the JSON is too long for one message, split it into parts: the same format in every part with an added field "part": "1/3", "2/3", "3/3", each holding a different slice of "tasks" (put "people" in part 1). I will upload all parts.`;
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
 * CRM times carry no zone. Without one, JavaScript reads them in the zone of whatever machine opens the page —
 * three hours apart between Riyadh and UTC. A time with no zone is therefore read as Saudi time, always.
 */
export function toIso(v) {
  if (v == null || v === '') return null;
  let s = String(v).trim();
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/.test(s)) s += TZ_OFFSET;
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
      people, tasks,
    },
    skipped,
  };
}

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
export function defaultTeam(people, tasks) {
  const jeddah = (people || []).filter((p) => p.branchCode === JEDDAH_BRANCH).map((p) => p.id);
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
    if (!rows.has(id)) rows.set(id, { id, name, assigned: 0, done: 0, cohortDone: 0, open: 0, cancelled: 0, created: 0, fromEmail: 0, selfLogged: 0, durations: [] });
    const r = rows.get(id);
    if (name && (!r.name || r.name === r.id)) r.name = name;
    return r;
  };
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
      id: r.id, name: r.name, assigned: r.assigned, done: r.done, open: r.open, cancelled: r.cancelled, created: r.created, fromEmail: r.fromEmail, selfLogged: r.selfLogged,
      rate: counted > 0 ? r.cohortDone / counted : null,
      avgHours: mean(r.durations), medianHours: median(r.durations), timed: r.durations.length,
    };
  };
  const people = [...rows.values()].filter((r) => r.id !== GROUP && (r.assigned > 0 || r.created > 0 || r.done > 0 || r.open > 0)).map(finish)
    .sort((a, b) => b.done - a.done || b.assigned - a.assigned || String(a.name).localeCompare(String(b.name)));
  const group = rows.has(GROUP) ? finish(rows.get(GROUP)) : null;
  const all = { id: '__team__', name: '__team__', assigned: 0, done: 0, cohortDone: 0, open: 0, cancelled: 0, created: 0, fromEmail: 0, selfLogged: 0, durations: [] };
  for (const r of rows.values()) {
    all.assigned += r.assigned; all.done += r.done; all.cohortDone += r.cohortDone; all.open += r.open; all.cancelled += r.cancelled;
    all.fromEmail += r.fromEmail; all.selfLogged += r.selfLogged; all.created += r.created; all.durations.push(...r.durations);
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

// ===================== my KPIs: an engineer's own profile, read through their own myafaqy session =====================
// ADR-0010. A bookmark runs on myafaqy's page, reads «My Tasks» (taskGroupId 100000 — only the signed-in person's tasks,
// enforced by myafaqy itself) with the engineer's own sign-in, and hands the portal ONLY these fields, through the
// address fragment (never sent to any server). The sign-in token never leaves myafaqy's page.
export const ME_SCHEMA = 'afaqy-me/v1';
export const ME_MONTHS = 12;

/** The bookmark, as a javascript: address. portalUrl is where the portal lives (…/afaqy-portal/). */
export function buildBookmarklet(portalUrl, lang = 'ar') {
  const msg = {
    ar: ['افتح ماي أفاقي أولًا ثم اضغط الإشارة من هناك', 'سجّل دخولك في ماي أفاقي أولًا', 'جارٍ قراءة مهامك…', 'تعذّرت القراءة: '],
    en: ['Open myafaqy first, then press the bookmark there', 'Sign in to myafaqy first', 'Reading your tasks…', 'Could not read: '],
    ur: ['پہلے مائی آفاقی کھولیں، پھر وہاں بک مارک دبائیں', 'پہلے مائی آفاقی میں لاگ اِن کریں', 'آپ کے ٹاسک پڑھے جا رہے ہیں…', 'پڑھا نہیں جا سکا: '],
  }[lang] || [];
  const code = `(async()=>{const M=${JSON.stringify(msg)},P=${JSON.stringify(portalUrl)};
if(location.hostname!=='myafaqy.com'){alert(M[0]);return}
const tk=localStorage.getItem('token');if(!tk){alert(M[1]);return}
let w=window.open(P+'#me-wait','afaqy-portal');
const box=document.createElement('div');box.style.cssText='position:fixed;inset:auto 16px 16px auto;z-index:2147483647;background:#0F2231;color:#fff;padding:12px 16px;border-radius:10px;font:14px system-ui';box.textContent=M[2];document.body.append(box);
try{const u=JSON.parse(decodeURIComponent(escape(atob(tk.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')))));
const H={'Authorization':'Bearer '+tk,'Content-Type':'application/json','X-Timezone-Offset':'-180','X-Client-Id':localStorage.getItem('browser_client_id')||'','lang':'en'};
const day=86400000,now=Date.now(),sa=d=>new Date(Date.parse(new Date(d+3*3600000).toISOString().slice(0,10)+'T00:00:00+03:00')).toISOString();
const since=sa(now-${ME_MONTHS}*30.5*day),end=sa(now+day);
const base=(c,b,n,s)=>({donePageNumber:b==='done'?n:0,donePageSize:b==='done'?s:1,openPageNumber:b==='open'?n:0,openPageSize:b==='open'?s:1,toDoPageNumber:b==='toDo'?n:0,toDoPageSize:b==='toDo'?s:1,orderBy:1,taskGroupId:100000,searchKey:'',tasksGridStatusId:1,assignedBy:[],createdBy:[],agent:[],statusIds:[],type:[],priority:[],assignedOn:[],completedOn:c});
const ask=async b=>{const r=await fetch('https://crmbackend.afaqy.sa/Task/GetMyTasksGrid',{method:'POST',headers:H,body:JSON.stringify(b)});if(!r.ok)throw new Error('HTTP '+r.status);const j=await r.json();if(!j.success&&j.success!==undefined)throw new Error(j.message||'refused');return j.data};
const out=[];let n=0;
for(const[b,c]of[['done',[since,end]],['open',[]],['toDo',[]]]){let size=100,pg=0,total=null;
for(;;){const d=(await ask(base(c,b,pg,size)))[b];if(pg===0&&d.pageSize!==size)size=d.pageSize||20;total=d.listCount;
for(const x of d.data||[])out.push({i:String(x.id),c:x.createdOn,d:x.statusId===3&&!x.isCancelled?x.closeDate:null,s:x.isCancelled?'cancelled':x.statusId===3?'done':'open',m:x.moduleId,o:String(x.createUserId)===String(u.UserId),b});
n+=(d.data||[]).length;box.textContent=M[2]+' '+n;pg++;if(!d.data||!d.data.length||pg*size>=total)break;await new Promise(r=>setTimeout(r,250))}}
const doneTotal=out.filter(x=>x.b==='done').length;
const pay={schema:'${ME_SCHEMA}',user:{id:String(u.UserId),name:String(u.UserName||'')},extractedAt:new Date().toISOString(),since,months:${ME_MONTHS},tasks:out};
let data=JSON.stringify(pay),enc='j';
if(window.CompressionStream){const cs=new Blob([data]).stream().pipeThrough(new CompressionStream('gzip'));const buf=new Uint8Array(await new Response(cs).arrayBuffer());let bin='';for(const c of buf)bin+=String.fromCharCode(c);data=btoa(bin);enc='z'}else{data=btoa(unescape(encodeURIComponent(data)))}
const url=P+'#me-'+enc+'.'+data.replace(/\\+/g,'-').replace(/\\//g,'_').replace(/=+$/,'');
if(w&&!w.closed)w.location.href=url;else location.href=url;box.remove()}catch(e){box.textContent=M[3]+e.message;setTimeout(()=>box.remove(),8000)}})();`;
  return 'javascript:' + encodeURIComponent(code.replace(/\n/g, ''));
}

/** Read what the bookmark handed over (the part of the address after #me-). Returns { me } or { error }. */
export async function parseMe(fragment) {
  const m = String(fragment || '').match(/^([zj])\.([A-Za-z0-9_-]+)$/);
  if (!m) return { error: 'err_json' };
  try {
    const b64 = m[2].replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((m[2].length + 3) % 4);
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    let text;
    if (m[1] === 'z') {
      const ds = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
      text = await new Response(ds).text();
    } else text = new TextDecoder().decode(bytes);
    const raw = JSON.parse(text);
    if (raw.schema !== ME_SCHEMA || !raw.user || raw.user.id == null || !Array.isArray(raw.tasks)) return { error: 'err_schema', vars: { schema: ME_SCHEMA } };
    const uid = String(raw.user.id);
    const tasks = raw.tasks.filter((x) => x && x.i != null && toIso(x.c)).map((x) => {
      const state = ['open', 'done', 'cancelled'].includes(x.s) ? x.s : 'open';
      const moduleId = Number.isFinite(+x.m) && x.m !== null ? +x.m : null;
      return { id: String(x.i), state, createdAt: toIso(x.c), completedAt: state === 'done' ? toIso(x.d) : null,
        assigneeId: uid, assigneeName: '', createdById: null, createdByName: '', assignedToGroup: false,
        fromEmail: moduleId === EMAIL_MODULE, own: x.o === true, moduleId, bucket: x.b || null };
    });
    return { me: { schema: ME_SCHEMA, user: { id: uid, name: String(raw.user.name || '') }, extractedAt: toIso(raw.extractedAt), since: toIso(raw.since), tasks } };
  } catch { return { error: 'err_json' }; }
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
