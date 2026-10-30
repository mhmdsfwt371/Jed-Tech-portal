# سجل الإصدارات | Changelog

رقم النسخة ظاهر أسفل كل صفحة في البوابة، وبالضغط عليه تظهر «ما الجديد».

> ## القاعدة الذهبية
> **كل تحديث للبوابة لازم يعمل الأربعة دول مع بعض:**
> 1. **يحدّث الدليل جوه البوابة** (نصوص `g_*` في `core.js`) بالتلات لغات — الميزة اللي مش في الدليل كأنها مش موجودة، لأن حد غيري مش هيعرف عنها
> 2. يكتب ملاحظات النسخة في `release/next.json` بالعربي والإنجليزي والأردو — كل لغة مكتوبة بمعناها، مش مترجمة حرفيًا
> 3. يشغّل `node scripts/bump.mjs <الرقم>` — بيختم الرقم في `config.js` و`sw.js` و`version.json` والسجل ده، **وبيطلّع دليل المستخدم بتاع النسخة** في `docs/manual/` من نفس نصوص الدليل
> 4. `npm run verify` أخضر، ويتأكد إن النشر على جيتهب خلص فعلًا على نفس الالتزام
>
> وأي نص أردو جديد يقراه مهندس من الفريق لغته الأم أردو قبل ما الفريق يعتمد عليه.
>
> نسخة من غير ملاحظات ودليل محدّثين = نسخة ناقصة، والحارس بيرفضها.

---

<!-- releases -->

## v8.17 — 2026-10-30

- جمع روابط الأنظمة والأدوات في مجموعات واضحة مع إضافة الروابط الجديدة.

<details><summary>English</summary>

- Organized system and tool links into clear groups and added the new links.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- سسٹمز اور ٹولز کے لنکس واضح گروپوں میں ترتیب دیے اور نئے لنکس شامل کیے۔

</div>
</details>


## v8.16 — 2026-10-30

- النسخة الاحتياطية صارت كاملة: تحمل كل ما على الجهاز — البيانات والتقارير والبطاقات المقفولة واللقاءات الشهرية وقائمة الإصلاح ومسودة الأوزان — والاستعادة تدمج ولا تمسح. والبوابة تطلب من المتصفح الاحتفاظ ببياناتها، وصفحة البيانات تقول إن وعد أم لا.
- ملف الفريق يصل لكل الأجهزة فور نشره — إضافة شخص لم تعد تنتظر إصدارًا جديدًا.
- البطاقة تحكم على أنواع الفريقين فقط: الأنواع الأخرى «شغل آخر» تُحسب في النقاط ولا تصنع تميّزًا وهميًّا. وأسماء الأنواع بلغتك.
- تصميم أوضح على الجوال: عناوين الرسمة العنكبوتية مقروءة، صفحة الفريق بعرض الشاشة، أزرار أكبر للمس، وروابط سريعة أعلى لوحة المؤشرات.
- البوابة أخف: كل لغة تُحمّل وحدها — القارئ العربي ينزّل أقل بالربع.

<details><summary>English</summary>

- The backup is now complete: it carries everything on the device — data, reports, closed cards, monthly one-to-ones, the repair list and the weights draft — and restoring merges rather than erases. The portal asks the browser to keep its data, and the Data page says whether it promised.
- The team file reaches every device as soon as it is published — adding a person no longer waits for a release.
- The card judges only the two teams’ types: other types are “other work”, counted in the points but never making a false strength. Type names appear in your language.
- Clearer on a phone: the radar’s labels are readable, the Team page fits the screen, touch targets are larger, and quick links sit at the top of the KPI board.
- The portal is lighter: each language loads on its own — an Arabic reader downloads a quarter less.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- بیک اپ اب مکمل ہے: آلے کا سب کچھ — ڈیٹا، رپورٹس، بند کارڈ، ماہانہ ملاقاتیں، مرمت کی فہرست اور اوزان کا مسودہ — اور بحالی ملاتی ہے، مٹاتی نہیں۔ پورٹل براؤزر سے اپنا ڈیٹا رکھنے کو کہتا ہے، اور ڈیٹا کا صفحہ بتاتا ہے کہ وعدہ ہوا یا نہیں۔
- ٹیم کی فائل شائع ہوتے ہی ہر آلے تک پہنچتی ہے — کسی کو شامل کرنا اب نئے ورژن کا انتظار نہیں کرتا۔
- کارڈ صرف دونوں ٹیموں کی اقسام پر فیصلہ کرتا ہے: دیگر اقسام «دیگر کام» ہیں، پوائنٹس میں شامل مگر جھوٹی نمایاں بات نہیں بناتیں۔ اقسام کے نام آپ کی زبان میں۔
- فون پر زیادہ واضح: ریڈار کے لیبل پڑھنے کے قابل، ٹیم کا صفحہ اسکرین کے برابر، چھونے کے بڑے بٹن، اور اشاریوں کے بورڈ پر فوری روابط۔
- پورٹل ہلکا ہے: ہر زبان الگ لوڈ ہوتی ہے — عربی قاری چوتھائی کم ڈاؤن لوڈ کرتا ہے۔

</div>
</details>


## v8.15 — 2026-10-30

- تصحيح فحص سلامة إشارة سحب المدير المباشر، بحيث يتم التحقق من كود الإشارة كما ينبغي دون أن يختلط بطلبات البوابة. الطريقتان، المباشرة واليدوية، متاحتان كما هما.

<details><summary>English</summary>

- Corrected the verification of the manager's direct-import bookmark so its myafaqy requests are not mistaken for portal requests. Both the direct and manual methods remain available unchanged.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- مینیجر کے براہ راست درآمد والے بک مارک کی حفاظتی جانچ درست کی گئی ہے تاکہ مائی آفاقی کے اندر ہونے والی درخواستیں پورٹل کی درخواستیں نہ سمجھی جائیں۔ براہ راست اور دستی دونوں طریقے پہلے کی طرح دستیاب ہیں۔

</div>
</details>


## v8.14 — 2026-10-30

- إضافة طريقتين واضحتين في صفحة بيانات الإدارة: السحب شبه الأوتوماتيكي من MyAFAQY مباشرة إلى نافذة الإدارة، والطريقة اليدوية القديمة لتنزيل ملفي المهام والتقارير ورفعهما، مع بقاء أوامر كلود كروم.
- السحب المباشر يتأكد من مصدر MyAFAQY وتطابق فترة الملفين قبل التخزين وفتح لوحة المؤشرات. إذا منع المتصفح الاتصال بالنافذة الجديدة تنزّل الإشارة الملفين تلقائيًا للرفع اليدوي. البيانات تظل على جهاز المدير ولا تنتقل تلقائيًا من أجهزة المهندسين.

<details><summary>English</summary>

- The admin Data page now offers both semi-automatic direct transfer from myafaqy to a dedicated admin tab and the original manual bookmark that downloads two files for upload. The Claude in Chrome prompts remain available.
- Direct transfer validates the myafaqy opener and the matching task/report periods before saving locally and opening the KPI board. If cross-tab transfer is blocked, the bookmark downloads both files for manual upload. Team members' device data is not automatically synced to the manager.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- انتظامی ڈیٹا کے صفحے پر اب دونوں طریقے واضح طور پر موجود ہیں: مائی آفاقی سے نئی انتظامی ٹیب میں نیم خودکار براہ راست ڈیٹا منتقل کرنا، اور پرانا دستی بک مارک جو کاموں اور رپورٹس کی دو فائلیں محفوظ کرتا ہے۔ کلاڈ کروم کی ہدایات بھی برقرار ہیں۔
- براہ راست ترسیل میں مائی آفاقی کی اصل کھولی ہوئی ونڈو اور دونوں فائلوں کی یکساں مدت کی جانچ کے بعد ڈیٹا مقامی طور پر محفوظ کر کے اشاریے کھولے جاتے ہیں۔ اگر براؤزر مختلف ٹیبوں کے درمیان رابطہ روک دے تو بک مارک دونوں فائلیں دستی اپ لوڈ کے لیے محفوظ کر دیتا ہے۔ ملازمین کے آلات کا ڈیٹا مینیجر کے آلے سے خودکار طور پر نہیں جڑتا۔

</div>
</details>


## v8.13 — 2026-10-30

- أضيف تفصيل النقاط في بطاقة «مؤشراتي»: عدد المهام المنجزة لكل نوع × وزنه، وإجمالي النقاط، وتنبيه للأنواع التي تستخدم الوزن الافتراضي. بطاقات الشهور المقفولة القديمة تحتفظ بأرقامها دون تخمين تفاصيل مفقودة.
- أوزان الموظفين تُقرأ من الملف المنشور رسميًا، بينما تعديلات المدير تبقى مسودة على جهازه. من صفحة الأوزان يمكن تجهيز ملف الاعتماد ونسخه وفتح محرر GitHub؛ النشر الفعلي يتطلب Commit هناك. ملف الأوزان المنشور يتحدث عند فتح البوابة أو إعادة السحب.

<details><summary>English</summary>

- My KPIs now displays task-point details: completed counts per task type, each type's weight, total points and warnings for unlisted types using the default weight. Older closed cards retain their original results without inventing missing breakdowns.
- Team members use only officially published weights. Management edits remain local drafts until committed on GitHub. The Weights page can prepare and copy the approved file and open the GitHub editor; publication requires a GitHub commit. The published weights file refreshes when the portal opens or personal tasks are imported.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- میرے اشاریوں کے ماہانہ کارڈ میں اب کام کے پوائنٹس کی تفصیل ہے: ہر قسم کے مکمل کاموں کی تعداد، وزن، مجموعی پوائنٹس اور ایسی اقسام کی تنبیہ جن کے لیے طے شدہ عمومی وزن استعمال ہوا ہے۔ پہلے سے بند ماہانہ کارڈ اپنے اصل اعداد برقرار رکھتے ہیں اور غیر موجود تفصیل نہیں بناتے۔
- ٹیم کے ارکان صرف مستودع میں منظور اور شائع شدہ اوزان استعمال کرتے ہیں۔ مینیجر کی مقامی تبدیلیاں GitHub پر Commit ہونے تک مسودہ رہتی ہیں۔ اوزان کے صفحے سے تیار فائل کاپی کی جا سکتی ہے اور GitHub ایڈیٹر کھولا جا سکتا ہے، لیکن اصل اشاعت کے لیے وہاں Commit کرنا ضروری ہے۔ پورٹل کھلنے یا ذاتی کام دوبارہ حاصل کرنے پر شائع شدہ وزن تازہ ہوتا ہے۔

</div>
</details>


## v8.12 — 2026-10-30

- بقى دليل «مؤشراتي» يعرض نافذة متصفح تجريبية متحركة، وفيها ماوس أو مؤشر لمس يوضح مكان الضغط، والسحب إلى شريط الإشارات، ثم فتح ماي أفاقي وإظهار النتيجة.
- زر «إعادة حركة الماوس» متاح في كل خطوة، مع شرح مختلف للكمبيوتر وأندرويد وآيفون. المحاكاة للشرح فقط ولا تتحكم في موقع ماي أفاقي الحقيقي.

<details><summary>English</summary>

- The My KPIs walkthrough now shows an animated sample browser with a moving mouse or touch indicator that demonstrates where to click, drag the bookmark onto the bookmarks bar, open myafaqy and view the result.
- Replay mouse movement is available at every step, with separate demonstrations for desktop, Android and iPhone. The animation is instructional only and cannot control the real myafaqy site.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- میرے اشاریوں کی رہنمائی میں اب ایک متحرک فرضی براؤزر ہے۔ اس میں ماؤس یا لمس کا نشان دکھاتا ہے کہ کہاں کلک کرنا ہے، بک مارک کو پٹی پر کیسے لے جانا ہے، مائی آفاقی کیسے کھولنا ہے اور نتیجہ کہاں ظاہر ہوتا ہے۔
- ہر مرحلے میں ماؤس کی حرکت دوبارہ دکھانے کا بٹن ہے، اور کمپیوٹر، اینڈرائیڈ اور آئی فون کے لیے علیحدہ طریقہ دکھایا جاتا ہے۔ یہ حرکت صرف سمجھانے کے لیے ہے اور اصل مائی آفاقی ویب سائٹ کو کنٹرول نہیں کرتی۔

</div>
</details>


## v8.11 — 2026-10-30

- إصلاح طريقة تحديد نصوص الخطوات المترجمة في الإرشاد التفاعلي لضمان عمله بشكل صحيح على رابط الفريق والإدارة.

<details><summary>English</summary>

- Fixed how the interactive walkthrough selects its translated step labels, so it works correctly in both the team and admin portals.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- تفاعلی رہنمائی کے ہر مرحلے کا ترجمہ منتخب کرنے کا طریقہ درست کیا گیا ہے، تاکہ یہ ٹیم اور انتظامی پورٹل دونوں میں صحیح کام کرے۔

</div>
</details>


## v8.10 — 2026-10-30

- أُضيف زر «إرشادي خطوة بخطوة» يظل ظاهرًا في صفحة «مؤشراتي» في كل مرة، سواء كانت بيانات المهندس موجودة أو لم تُسحب بعد.
- الشرح التفاعلي يوضح خمس خطوات بحسب الكمبيوتر أو أندرويد أو آيفون، ويتيح نسخ الإشارة وفتح ماي أفاقي والرجوع لأي خطوة وإعادة فتح الشرح دون التأثير على البيانات.

<details><summary>English</summary>

- The Step-by-step help button now stays visible on My KPIs at all times, whether the employee has already imported data or not.
- The interactive five-step walkthrough adapts to a computer, Android or iPhone. It supports copying the bookmark, opening myafaqy, returning to previous steps and reopening without affecting saved KPIs.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- قدم بہ قدم رہنمائی کا بٹن اب «میرے اشاریے» کے صفحے پر ہر وقت نظر آتا ہے، خواہ ملازم نے اپنا ڈیٹا پہلے حاصل کیا ہو یا ابھی نہ کیا ہو۔
- پانچ مرحلوں والی رہنمائی کمپیوٹر، اینڈرائیڈ اور آئی فون کے مطابق ہدایات دیتی ہے۔ اس میں بک مارک کا کوڈ کاپی کرنا، مائی آفاقی کھولنا، پچھلے مرحلے پر جانا اور محفوظ ڈیٹا بدلے بغیر رہنمائی دوبارہ کھولنا شامل ہے۔

</div>
</details>


## v8.9 — 2026-10-30

- أُضيف رابط مستقل للفريق يفتح «مؤشراتي» أولًا ويعرض الأدوات وأفاقي برو والدليل فقط، بينما رابط الإدارة الحالي يحتفظ بكل الصفحات.
- فصل الرابطين للعرض فقط وليس حماية؛ إشارة «مؤشراتي» تعيد الموظف إلى رابط الفريق بعد قراءة عمله من ماي أفاقي.

<details><summary>English</summary>

- A separate team link now opens My KPIs first and shows Tools, Afaqy PRO and Guide, while the existing admin link retains all pages.
- The links separate the presentation, not access security. The My KPIs bookmark returns the employee to the team URL after reading their own myafaqy work.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- ٹیم کا الگ لنک اب پہلے «میرے اشاریے» کھولتا ہے اور صرف ٹولز، آفاقی پرو اور رہنما دکھاتا ہے؛ موجودہ انتظامی لنک پر تمام صفحات موجود ہیں۔
- یہ لنکس صرف ظاہری ترتیب الگ کرتے ہیں، سیکیورٹی نہیں۔ «میرے اشاریے» بک مارک ملازم کا کام پڑھنے کے بعد ٹیم کے لنک پر واپس آتا ہے۔

</div>
</details>


## v8.8 — 2026-10-30

- أُضيف «أفاقي هنت — محرك الاستهداف» إلى «أدوات أخرى» في الصفحة الرئيسية. يفتح في نافذة جديدة لأنه على عنوان لوفابل لا على عنوان البوابة.

<details><summary>English</summary>

- “AFAQY Hunt — prospecting engine” is added to “Other tools” on the home page. It opens in a new window because it lives on Lovable’s address, not the portal’s.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- «آفاقی ہنٹ — پراسپیکٹنگ انجن» ہوم پیج پر «دیگر ٹولز» میں شامل کیا گیا۔ یہ نئی ونڈو میں کھلتا ہے کیونکہ یہ لوویبل کے پتے پر ہے، پورٹل کے پتے پر نہیں۔

</div>
</details>


## v8.7 — 2026-10-30

- أداة شهادات المعايرة صارت وحدة حقيقية داخل البوابة — من «الوحدات» — بدل «قريبًا».
- توقيعات شهادات المعايرة في صفحة «الفريق»: صورة توقيع فني تي زون وفني توب فلاي واسمه، تُحفظ مرة واحدة وتطبع على كل شهادة — سواء فُتحت الأداة من البوابة أو مباشرة. تبقى على الجهاز ولا تدخل المستودع العام، وتُنقل لجهاز زميل بالتصدير والاستيراد.

<details><summary>English</summary>

- The calibration certificates tool is now a real module inside the portal — under “Modules” — instead of “coming soon”.
- Signatures for calibration certificates on the “Team” page: the TZONE and TOPFLY technician’s signature image and name, saved once and printed on every certificate — whether the tool is opened from the portal or directly. They stay on the device, never enter the public repository, and move to a colleague’s device by export and import.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- کیلیبریشن سرٹیفکیٹس کا ٹول اب پورٹل کے اندر حقیقی ماڈیول ہے — «ماڈیولز» میں — «جلد» کے بجائے۔
- «ٹیم» کے صفحے پر کیلیبریشن سرٹیفکیٹس کے دستخط: ٹی زون اور ٹاپ فلائی ٹیکنیشن کے دستخط کی تصویر اور نام، ایک بار محفوظ اور ہر سرٹیفکیٹ پر چھپتے ہیں — ٹول پورٹل سے کھلے یا براہِ راست۔ آلے پر رہتے ہیں، عوامی ریپوزٹری میں کبھی نہیں، اور برآمد و درآمد سے ساتھی کے آلے پر جاتے ہیں۔

</div>
</details>


## v8.6 — 2026-10-30

- جودة الإصلاح في صفحة برو: «التحقق بعد الإصلاح» — ضع الأجهزة التي أُصلحت برقمها ووقت الإصلاح والمهندس، فتقول البوابة من برو لكل جهاز: عاد للإرسال، أو في المهلة (٤٨ ساعة)، أو لم يعد، أو غير موجود — ونسبة «عاد للإرسال» لكل مهندس، وتنزيل النتائج.
- يُحفظ ما كتبته فقط — الرقم والمهندس والوقت — ولا شيء مما يأتي من برو يبقى بعد الجلسة.

<details><summary>English</summary>

- Repair quality on the PRO page: “After the repair” — enter the repaired devices by number, repair time and engineer, and the portal says from PRO for each device: came back, within 48 hours, not back, or not in PRO — with each engineer’s “came back” rate and a download of the results.
- Only what you typed is kept — the number, the engineer and the time — and nothing from PRO stays past the session.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- برو کے صفحے پر مرمت کا معیار: «مرمت کے بعد جانچ» — مرمت شدہ آلات نمبر، مرمت کے وقت اور انجینئر کے ساتھ درج کریں، اور پورٹل برو سے ہر آلے کے لیے بتاتا ہے: واپس آیا، ۴۸ گھنٹوں کے اندر، نہیں آیا، یا برو میں نہیں — ہر انجینئر کی «واپس آیا» شرح اور نتائج کی ڈاؤن لوڈ کے ساتھ۔
- صرف وہی محفوظ ہوتا ہے جو آپ نے لکھا — نمبر، انجینئر اور وقت — اور برو کی کوئی چیز سیشن کے بعد نہیں رہتی۔

</div>
</details>


## v8.5 — 2026-10-29

- الأسبوع في لمحة على لوحة المؤشرات: آخر سبعة أيام مقابل السبعة قبلها — الأكثر تقدمًا، والنزول الحاد، والمفتوح القديم — ومن في إجازة لا يُعدّ نزولًا. وزر «مشاركة» يرسل الملخص لواتساب أو تيمز.
- المؤشر الخامس — تغطية الحسابات: لكل مهندس حساباته في جدة وأجهزتها وما هو وحده عليه وما لمسه في الفترة، وعدد الحسابات بلا أحد من الفريق. تسحبه إشارة المدير بأرقام فقط.
- اللقاء الشهري على بطاقة كل من تحتك: ملاحظات، وما اتفقتما عليه، وأهداف بنوع المهمة أو بالنقاط يُقاس تقدّمها من عمل الشهر — ويظهر الاتفاق الشهر التالي مع «نُفّذ». يبقى على جهازك فقط وتنقله بملف.
- مسار النمط عبر الأشهر: النمط والنقاط والربع لكل شهر مقفول — للتقييم السنوي.

<details><summary>English</summary>

- The week at a glance on the KPI board: the last seven days against the seven before — biggest gains, sharp drops and work left open too long — and anyone on leave is not counted as a drop. A “Share” button sends the summary to WhatsApp or Teams.
- Factor 5 — account coverage: for each engineer, their Jeddah accounts, the devices on them, where they are alone, and what they touched in the period, plus how many accounts have nobody from the team. The manager bookmark pulls it as numbers only.
- The monthly one-to-one on each of your people’s cards: notes, what you agreed, and goals by task type or by points whose progress is measured from the month’s work — and the agreement shows the next month with “done”. It stays on your device only and moves by file.
- The pattern’s path over the months: pattern, points and quarter for every closed month — for the annual review.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- اشاریوں کے بورڈ پر ہفتہ ایک نظر میں: پچھلے سات دن بمقابلہ ان سے پہلے کے سات — سب سے زیادہ بہتری، تیز کمی اور بہت دیر سے کھلا کام — اور چھٹی والا کمی شمار نہیں ہوتا۔ «شیئر» بٹن خلاصہ واٹس ایپ یا ٹیمز کو بھیجتا ہے۔
- پانچواں اشاریہ — اکاؤنٹس کی کوریج: ہر انجینئر کے لیے جدہ میں اس کے اکاؤنٹس، ان کے آلات، جہاں وہ اکیلا ہے، اور مدت میں کس سے رابطہ کیا، اور کتنے اکاؤنٹس پر ٹیم کا کوئی نہیں۔ مینیجر بک مارک اسے صرف اعداد کے طور پر کھینچتا ہے۔
- آپ کے ہر فرد کے کارڈ پر ماہانہ ملاقات: نوٹس، جو طے ہوا، اور ٹاسک کی قسم یا پوائنٹس کے اہداف جن کی پیش رفت مہینے کے کام سے ناپی جاتی ہے — اور اگلے مہینے طے شدہ بات «ہو گیا» کے ساتھ دکھتی ہے۔ صرف آپ کے آلے پر رہتی ہے اور فائل سے منتقل ہوتی ہے۔
- مہینوں میں انداز کا سفر: ہر بند مہینے کا انداز، پوائنٹس اور چوتھائی — سالانہ جائزے کے لیے۔

</div>
</details>


## v8.4 — 2026-10-29

- بطاقة الشهر في «مؤشراتي»: نمط عملك من الأرقام — حجمك مقابل وسيط الفريق وربعك، وبصمتك على الفئات الأربع برسمة عنكبوتية ولقب للنمط، وأكثر ما تميّزت به (تخصص، سرعة، مبادرة)، وما يستحق التطوير — كل جملة معها رقمها. والشهر المنتهي يُقفل تلقائيًّا ولا تتغير بطاقته.
- القادة والمدير يرون بطاقات من تحتهم بالمرتبة واقتراحات التوزيع للشهر القادم: تمدّد، استثمار، توازن — بقاعدة معلنة وسبب مكتوب. المهندس يرى ربعه لا مرتبته.
- في لوحة المؤشرات: خريطة الفريق (الأشخاص × الفئات) وخطة الشهر القادم. والبطاقة تُطبع صفحة واحدة للقاء الشهري.

<details><summary>English</summary>

- The month’s card on “My KPIs”: your work pattern from the numbers — volume against the team median and your quarter, your fingerprint across the four tiers as a radar with a pattern name, where you stood out (specialisation, speed, initiative) and what deserves development — every line with its number. A finished month closes by itself and its card never changes.
- Leaders and the manager see their people’s cards with rank and next month’s assignment suggestions: stretch, invest, balance — by a stated rule with a written reason. An engineer sees their quarter, not their rank.
- On the KPI board: the team map (people × tiers) and next month’s plan. The card prints on one page for the monthly one-to-one.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- «میرے اشاریے» پر مہینے کا کارڈ: اعداد سے آپ کے کام کا انداز — ٹیم کے وسط کے مقابلے میں حجم اور آپ کی چوتھائی، چار درجوں پر آپ کا نقش ریڈار اور انداز کے نام کے ساتھ، آپ کہاں نمایاں رہے (مہارت، رفتار، پہل) اور کیا ترقی کا مستحق ہے — ہر سطر اپنے عدد کے ساتھ۔ ختم شدہ مہینہ خود بند ہوتا ہے اور اس کا کارڈ نہیں بدلتا۔
- لیڈر اور مینیجر اپنے لوگوں کے کارڈ درجے اور اگلے مہینے کی تفویض کی تجاویز کے ساتھ دیکھتے ہیں: توسیع، سرمایہ کاری، توازن — واضح اصول اور لکھی وجہ سے۔ انجینئر اپنی چوتھائی دیکھتا ہے، درجہ نہیں۔
- اشاریوں کے بورڈ پر: ٹیم کا نقشہ (افراد × درجے) اور اگلے مہینے کا منصوبہ۔ کارڈ ماہانہ ون ٹو ون کے لیے ایک صفحے پر پرنٹ ہوتا ہے۔

</div>
</details>


## v8.3 — 2026-10-29

- الأوزان مربوطة بماي أفاقي: إشارة المدير تجلب مع المهام أنواع المهام المربوطة بكل فريق كما يعرّفها ماي أفاقي، فأي نوع جديد يظهر في صفحة «الأوزان» وحده معلَّمًا «بلا وزن» حتى يُحدَّد.
- الدراسة أُعيدت على الأنواع المربوطة بالفريقين فقط — ٢١ لما بعد البيع و٧ للبحث والتطوير — مع نوعين عامين يحملان ٦٠٪ من عمل ما بعد البيع. الدراسة كاملة في docs/kpi-weights-study.md.
- صلاحيات التعديل: المدير يعدّل كل الأوزان ويمنح أي شخص صلاحية على أنواع بعينها من عمود «من يعدّل»؛ من لا صلاحية له يرى الأوزان للقراءة. الصلاحيات برقم ماي أفاقي، وتُعتمد بملف weights.json.

<details><summary>English</summary>

- Weights linked to myafaqy: the manager bookmark brings, with the tasks, each team’s linked task types as myafaqy defines them, so any new type appears on the “Weights” page by itself, marked “no weight” until one is set.
- The study was redone on the two teams’ linked types only — 21 after-sales and 7 R&D — plus two general types carrying 60% of after-sales work. The full study is in docs/kpi-weights-study.md.
- Editing rights: the admin edits every weight and grants anyone rights on specific types from the “Who may edit” column; without rights the weights are read-only. Rights go by myafaqy id and are adopted through weights.json.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- اوزان مائی آفاقی سے منسلک: مینیجر بک مارک ٹاسکس کے ساتھ ہر ٹیم کی منسلک ٹاسک اقسام لاتا ہے جیسے مائی آفاقی انہیں بیان کرتا ہے، اس لیے کوئی بھی نئی قسم «اوزان» کے صفحے پر خود ظاہر ہوتی ہے، «بغیر وزن» کے نشان کے ساتھ جب تک طے نہ ہو۔
- مطالعہ صرف دونوں ٹیموں کی منسلک اقسام پر دوبارہ کیا گیا — آفٹر سیلز کی ۲۱ اور تحقیق و ترقی کی ۷ — دو عام اقسام کے ساتھ جو آفٹر سیلز کے ۶۰٪ کام کی حامل ہیں۔ مکمل مطالعہ docs/kpi-weights-study.md میں ہے۔
- ترمیم کے حقوق: ایڈمن ہر وزن بدلتا ہے اور «کون بدل سکتا ہے» کے کالم سے کسی کو بھی مخصوص اقسام پر حق دیتا ہے؛ حق کے بغیر اوزان صرف پڑھنے کے لیے ہیں۔ حقوق مائی آفاقی شناخت سے ہیں اور weights.json سے منظور ہوتے ہیں۔

</div>
</details>


## v8.2 — 2026-10-29

- النطاق: ملف الفريق صار يحدد من يظهر — فريق ما بعد البيع وفريق البحث والتطوير في جدة فقط. لا مبيعات ولا تحصيل ولا فروع أخرى في أي صفحة: اللوحة والأزرار والمتوسطات والجداول والدوائر. صفحة «الفريق» تعرض النطاق، ومن ظهر في البيانات من خارجه مطويًّا لإضافته فقط.
- ملف الفريق مكتمل من تصديرَي ماي أفاقي: مدير ما بعد البيع وقائدها ومهندسوها، وقائد البحث والتطوير ومهندساه — بالمناصب ومن يتبع من.
- أوزان أنواع مهام فريق البحث والتطوير السبعة كما في ماي أفاقي.

<details><summary>English</summary>

- Scope: the team file now decides who appears — Jeddah’s after-sales and R&D teams only. No sales, collection or other branches on any page: the board, its buttons, the averages, the tables and the donuts. The “Team” page shows the scope, with anyone seen in the data from outside it folded away, only to add them.
- The team file is complete from myafaqy’s two exports: the after-sales manager, leader and engineers, and the R&D leader and his two engineers — with positions and who reports to whom.
- Weights for the R&D team’s seven task types as myafaqy lists them.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- دائرہ کار: ٹیم کی فائل اب طے کرتی ہے کہ کون دکھے — صرف جدہ کی آفٹر سیلز اور تحقیق و ترقی کی ٹیمیں۔ کسی صفحے پر سیلز، کلیکشن یا دوسری برانچیں نہیں: بورڈ، اس کے بٹن، اوسط، جدول اور دائرے۔ «ٹیم» کا صفحہ دائرہ کار دکھاتا ہے، اور ڈیٹا میں نظر آنے والے باہر کے لوگ صرف شامل کرنے کے لیے سمٹے ہوئے۔
- ٹیم کی فائل مائی آفاقی کی دو برآمدات سے مکمل: آفٹر سیلز کا مینیجر، لیڈر اور انجینئرز، اور تحقیق و ترقی کا لیڈر اور اس کے دو انجینئر — عہدوں اور ماتحتی کے ساتھ۔
- تحقیق و ترقی کی ٹیم کی سات ٹاسک اقسام کے اوزان جیسے مائی آفاقی میں درج ہیں۔

</div>
</details>


## v8.1 — 2026-10-29

- الأوزان: لكل نوع مهمة ولكل تصنيف نشاط مع العملاء وزن بأربع فئات معلنة — ١ إداري سريع، ٢ تعامل مع العميل أو تشخيص، ٣ ربط بجهة خارجية أو تنسيق ميداني، ٥ عمل متعدد المراحل. «النقاط الموزونة» في لوحة المؤشرات بجانب العدد، والترتيب بها. صفحة «الأوزان» لتعديل أي وزن واعتماده بملف «weights.json».
- تثبيت التطبيق على أندرويد وآيفون وويندوز من زر «تثبيت التطبيق» أسفل القائمة.
- تحديث تلقائي: كل نسخة جديدة تصل وحدها وتعيد تحميل البوابة مرة واحدة — إلا إن كنت تكتب، فيظهر زر التحديث.
- علامة «؟» بجانب كل صفحة وكل قسم رئيسي تشرح ما هو وكيف يُستخدم، بلغتك.

<details><summary>English</summary>

- Weights: every task type and every category of activity with customers has a weight in four stated tiers — 1 quick administrative, 2 dealing with the customer or diagnosing, 3 outside integration or field coordination, 5 multi-stage work. “Weighted points” on the KPI board beside the count, and ordering by them. A “Weights” page to change any weight and adopt it through “weights.json”.
- Install the app on Android, iPhone and Windows from the “Install the app” button at the bottom of the menu.
- Automatic updates: every new version arrives by itself and reloads the portal once — unless you are typing, in which case the update button appears.
- A “?” beside every page and every main section explains what it is and how to use it, in your language.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- اوزان: ہر ٹاسک کی قسم اور گاہکوں کے ساتھ سرگرمی کے ہر زمرے کا وزن چار واضح درجوں میں — ۱ تیز انتظامی، ۲ گاہک سے معاملہ یا تشخیص، ۳ بیرونی ربط یا فیلڈ کوآرڈینیشن، ۵ کثیر مرحلہ کام۔ اشاریوں کے بورڈ پر تعداد کے ساتھ «وزنی پوائنٹس»، اور ان کے مطابق ترتیب۔ «اوزان» کا صفحہ کسی بھی وزن کو بدلنے اور «weights.json» سے منظور کرنے کے لیے۔
- مینو کے نیچے «ایپ انسٹال کریں» بٹن سے اینڈرائیڈ، آئی فون اور ونڈوز پر ایپ انسٹال کریں۔
- خودکار تازہ کاری: ہر نیا ورژن خود آتا ہے اور پورٹل کو ایک بار دوبارہ لوڈ کرتا ہے — سوائے اس کے کہ آپ لکھ رہے ہوں، تب تازہ کاری کا بٹن آتا ہے۔
- ہر صفحے اور ہر اہم حصے کے ساتھ «؟» بتاتا ہے کہ یہ کیا ہے اور کیسے استعمال ہوتا ہے، آپ کی زبان میں۔

</div>
</details>


## v8.0 — 2026-10-29

- أزرار الفرق في لوحة المؤشرات: «الفريق المحسوب» صار فيه زر لكل فريق في جدة كما في ماي أفاقي — ما بعد البيع، البحث والتطوير، الفيديو تيليماتكس… — ضغطة واحدة تحوّل اللوحة كلها لذلك الفريق.
- كل عضو في الفريق المختار يظهر في الجدول حتى لو لم تكن له أي مهمة — بأصفار — لأن غياب التسجيل نتيجة لا فجوة.
- إشارة المدير تضيف كل أعضاء فرق جدة إلى قائمة الأشخاص بأسمائهم من الفريق، حتى من لا مهام له.

<details><summary>English</summary>

- Team buttons on the KPI board: “the team counted” now has a button for each Jeddah team as myafaqy lists it — after-sales, R&D, video telematics… — one press switches the whole board to that team.
- Every member of the chosen team appears in the table even with no task at all — as zeros — because nothing logged is a finding, not a gap.
- The manager bookmark adds every member of Jeddah’s teams to the people list, named from the team, even those with no tasks.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- اشاریوں کے بورڈ پر ٹیموں کے بٹن: «شامل ٹیم» میں اب جدہ کی ہر ٹیم کا بٹن ہے جیسے مائی آفاقی میں ہے — آفٹر سیلز، تحقیق و ترقی، ویڈیو ٹیلی میٹکس… — ایک دباؤ پورے بورڈ کو اس ٹیم پر لے آتا ہے۔
- منتخب ٹیم کا ہر رکن جدول میں دکھائی دیتا ہے چاہے اس کا کوئی ٹاسک نہ ہو — صفر کے ساتھ — کیونکہ کچھ درج نہ ہونا نتیجہ ہے، خلا نہیں۔
- مینیجر بک مارک جدہ کی ٹیموں کے تمام ارکان کو افراد کی فہرست میں ٹیم کے ناموں کے ساتھ شامل کرتا ہے، ان کو بھی جن کا کوئی ٹاسک نہیں۔

</div>
</details>


## v7.9 — 2026-10-29

- تصحيح مهم في إشارة المدير: كانت تسحب المنجز فقط وتُسقط المهام المفتوحة الآن، فظهرت نسبة الإنجاز ١٠٠٪ والمفتوح صفرًا للجميع. صارت تسحب المفتوح، وتحتفظ بما أُنجز بعد الفترة فقط إن أُنشئ فيها، وتقرأ مفتوح البحث والتطوير. اسحب الفترة من جديد.
- لوحة التعيين تعرض فريق ما بعد البيع في جدة فقط كما في ماي أفاقي — مختارين مسبقًا، مع «إظهار كل المهندسين».
- الشكل: مربع المنجزة والزر المختار مقروءان في الوضع الداكن، والدوائر أوسع بأسماء في سطر واحد، وسطر يشرح لماذا قد تزيد المنجزة على المسندة، وتُخفى الأعمدة التي هي صفر للفريق كله.

<details><summary>English</summary>

- An important fix to the manager bookmark: it pulled completed tasks only and dropped the tasks open now, so every completion rate read 100% and open read zero. It now pulls the open tasks, keeps work completed after the period only if created inside it, and reads the open R&D tasks. Pull the period again.
- The assignment panel shows Jeddah’s after-sales team only, as myafaqy lists it — already chosen, with “show every engineer”.
- Design: the completed tile and the chosen button read clearly in dark mode, the donuts are wider with single-line names, a line explains why completed can exceed assigned, and columns that are zero for the whole team are hidden.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- مینیجر بک مارک میں اہم درستی: یہ صرف مکمل ٹاسک لاتا اور ابھی کھلے ٹاسک چھوڑ دیتا تھا، اس لیے ہر ایک کی تکمیل کی شرح ۱۰۰٪ اور کھلے صفر دکھتے تھے۔ اب یہ کھلے ٹاسک لاتا ہے، مدت کے بعد مکمل ہونے والے صرف تب رکھتا ہے جب مدت میں بنے ہوں، اور تحقیق و ترقی کے کھلے ٹاسک بھی پڑھتا ہے۔ مدت دوبارہ کھینچیں۔
- تفویض کا پینل صرف جدہ کی آفٹر سیلز ٹیم دکھاتا ہے جیسے مائی آفاقی میں ہے — پہلے سے منتخب، «تمام انجینئرز دکھائیں» کے ساتھ۔
- ڈیزائن: مکمل کا خانہ اور منتخب بٹن ڈارک موڈ میں صاف پڑھے جاتے ہیں، دائرے چوڑے اور نام ایک سطر میں، ایک سطر بتاتی ہے کہ مکمل تفویض شدہ سے کیوں زیادہ ہو سکتے ہیں، اور پوری ٹیم کے لیے صفر والے کالم چھپ جاتے ہیں۔

</div>
</details>


## v7.8 — 2026-10-29

- سجل الأنشطة يقول الحقيقة بوضوح: إذا لم يسجّل فريقك أي نشاط مع العملاء في الفترة يقولها صراحةً، ويذكر عدد الأنشطة في الفترة ومن سجّلها من خارج الفريق — بدل «لا أنشطة في الملف».
- زر «قراءة النص» على خانة فارغة يشرح أن إشارة المدير لا تحتاج لصقًا، وأن الملفين يُرفعان بزر «اختيار ملف».

<details><summary>English</summary>

- The activity log says the truth plainly: when your team logged no activity with customers in the period it says so, with how many activities the period has and who outside the team logged them — instead of “no activities in the file”.
- “Read text” on an empty box explains that the manager bookmark needs no pasting and that its two files are uploaded with “Choose file”.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- سرگرمیوں کا ریکارڈ صاف سچ بتاتا ہے: جب آپ کی ٹیم نے مدت میں گاہکوں کے ساتھ کوئی سرگرمی درج نہ کی ہو تو یہ صاف کہتا ہے، مدت کی سرگرمیوں کی تعداد اور ٹیم کے باہر کس نے درج کیں — «فائل میں کوئی سرگرمی نہیں» کے بجائے۔
- خالی خانے پر «متن پڑھیں» بتاتا ہے کہ مینیجر بک مارک کو چسپاں کرنے کی ضرورت نہیں اور اس کی دونوں فائلیں «فائل منتخب کریں» سے اپ لوڈ ہوتی ہیں۔

</div>
</details>


## v7.7 — 2026-10-29

- لوحة التعيين: قسم جديد «إزالة من كل الحسابات — لمن غادر». يعرض كل من على حسابات جدة وعدد حساباته — بالاسم، أو بالرقم إن لم يعد في قائمة المهندسين — ولا يُزال إلا من تعلّم عليه بيدك.
- القائمة تبدأ فارغة في كل فتح ولا تُحفظ، ولا يُترك حساب بلا أحد أبدًا. الحارس يفرض الثلاثة.

<details><summary>English</summary>

- Assignment panel: a new “Remove from every account — for those who left” section. It lists everyone on Jeddah accounts and how many accounts each carries — by name, or by id if no longer in the engineers list — and removes only whoever you tick.
- The list starts empty on every open and is never remembered, and no account is ever left with nobody. The guard enforces all three.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- تفویض پینل: نیا حصہ «ہر اکاؤنٹ سے ہٹائیں — جو چھوڑ گئے»۔ یہ جدہ کے اکاؤنٹس پر موجود ہر فرد اور اس کے اکاؤنٹس کی تعداد دکھاتا ہے — نام سے، یا شناخت سے اگر وہ انجینئرز کی فہرست میں نہ رہا ہو — اور صرف اسے ہٹاتا ہے جسے آپ نشان لگائیں۔
- فہرست ہر بار خالی شروع ہوتی ہے اور کبھی محفوظ نہیں ہوتی، اور کوئی اکاؤنٹ کبھی کسی کے بغیر نہیں چھوڑا جاتا۔ گارڈ تینوں کو نافذ کرتا ہے۔

</div>
</details>


## v7.6 — 2026-10-29

- هيكل الفريق مسجّل: فريق ما بعد البيع في جدة — ثمانية مهندسين يتبعون قائد الفريق، والقائد يتبع مديره، والمدير يتبع المدير التقني للمنطقة الغربية. يُحفظ بأرقام ماي أفاقي في «team.json»، بلا أسماء.
- «فريقي» صار يرى كل المستويات تحتك: المدير التقني يرى عشرة، ومدير القائد يرى تسعة، والقائد يرى ثمانية.
- لوحة التعيين تفتح والفريق مختار مسبقًا بالاسم — تراجع وتضغط.

<details><summary>English</summary>

- The team structure is recorded: Jeddah’s after-sales team — eight engineers reporting to the team leader, the leader to his manager, and that manager to the Western Technical Manager. Saved by myafaqy ids in “team.json”, without names.
- “My team” now sees every level below you: the technical manager sees ten, the leader’s manager nine, and the leader eight.
- The assignment panel opens with the team already chosen by name — review and press.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- ٹیم کا ڈھانچہ درج ہو گیا: جدہ کی آفٹر سیلز ٹیم — آٹھ انجینئر ٹیم لیڈر کے ماتحت، لیڈر اپنے مینیجر کے، اور وہ مینیجر مغربی علاقے کے تکنیکی مینیجر کے۔ «team.json» میں مائی آفاقی کی شناختوں سے محفوظ، ناموں کے بغیر۔
- «میری ٹیم» اب آپ کے نیچے ہر سطح دیکھتی ہے: تکنیکی مینیجر دس، لیڈر کا مینیجر نو، اور لیڈر آٹھ۔
- تفویض کا پینل ٹیم کو نام سے پہلے سے منتخب کر کے کھلتا ہے — دیکھیں اور دبائیں۔

</div>
</details>


## v7.5 — 2026-10-29

- لوحة تعيين ما بعد البيع على حسابات جدة — من صفحة «الفريق»: إشارة تُفتح داخل ماي أفاقي بدخولك، تختار المهندسين وترى التغطية، وتجرّب على عشرة بجدول قبل/بعد، ثم تطبّق على الباقي وتنزّل السجل. بإضافة فقط — لا يُحذف أحد موجود — وعلى فرع جدة فقط.
- هذه هي الكتابة الوحيدة في البوابة كلها، بقاعدة حارس خاصة: طلب واحد بالاسم، الاتحاد نصًّا، الفرع نصًّا، وخلف الزرين فقط. أُثبت أن الحارس يرفض الاستبدال وتسريب الفرع وأي طلب كتابة آخر.

<details><summary>English</summary>

- An after-sales assignment panel for Jeddah accounts — from the “Team” page: a bookmark opens it inside myafaqy with your sign-in; choose the engineers, see the coverage, pilot on ten with a before/after table, then apply to the rest and download the log. Add only — nobody already there is removed — and Jeddah branch only.
- This is the one write in the whole portal, under its own guard rule: one named request, the union verbatim, the branch verbatim, and only behind the two buttons. The guard was proven to refuse replace mode, a branch leak and any other write.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- جدہ کے اکاؤنٹس پر آفٹر سیلز تفویض کا پینل — «ٹیم» کے صفحے سے: ایک بک مارک اسے آپ کے لاگ اِن سے مائی آفاقی کے اندر کھولتا ہے؛ انجینئرز چنیں، کوریج دیکھیں، پہلے/بعد کے جدول کے ساتھ دس پر آزمائیں، پھر باقی پر لاگو کریں اور لاگ ڈاؤن لوڈ کریں۔ صرف اضافہ — جو موجود ہے ہٹایا نہیں جاتا — اور صرف جدہ برانچ۔
- یہ پورے پورٹل میں واحد لکھائی ہے، اپنے گارڈ اصول کے تحت: ایک نامزد درخواست، یونین بعینہ، برانچ بعینہ، اور صرف دو بٹنوں کے پیچھے۔ ثابت ہوا کہ گارڈ بدلنے کے انداز، برانچ کے رساؤ اور کسی بھی دوسری لکھائی کو مسترد کرتا ہے۔

</div>
</details>


## v7.4 — 2026-10-29

- المؤشر الرابع — سجل الأنشطة مع العملاء: لكل مهندس ما سجّله مع العملاء في الفترة (التذاكر)، وعدد العملاء المختلفين، وكم صار مهمة، وتوزيعها بالحالة والتصنيف — بجدول بأشرطة ودائرتين. تقرؤه إشارة المدير وأمر التقارير تلقائيًّا، بلا أوصاف ولا أسماء عملاء.
- نقاط الفنيين طُويت خلف «عرض» في اللوحة — الفريق مهندسون لا فنيون — وتبقى لمن يحتاجها.

<details><summary>English</summary>

- Factor 4 — the activity log with customers: per engineer, what they logged with customers in the period (tickets), the distinct customers, how many became tasks, and the spread by status and category — a table with bars and two donuts. The manager bookmark and the reports prompt read it automatically, without descriptions or customer names.
- Technician points are tucked behind “show” on the board — the team is engineers, not technicians — and stay there for whoever needs them.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- چوتھا اشاریہ — گاہکوں کے ساتھ سرگرمیوں کا ریکارڈ: ہر انجینئر کے لیے مدت میں گاہکوں کے ساتھ درج کی گئی سرگرمیاں (ٹکٹ)، مختلف گاہک، کتنے ٹاسک بنے، اور حالت اور زمرے کی تقسیم — بار والا جدول اور دو دائرے۔ مینیجر بک مارک اور رپورٹس کی ہدایت اسے خود بخود پڑھتی ہیں، بغیر تفصیل یا گاہکوں کے ناموں کے۔
- ٹیکنیشن پوائنٹس بورڈ پر «دکھائیں» کے پیچھے سمٹ گئے — ٹیم انجینئرز کی ہے، ٹیکنیشنز کی نہیں — اور جسے ضرورت ہو اس کے لیے وہیں رہتے ہیں۔

</div>
</details>


## v7.3 — 2026-10-29

- «مؤشراتي» كما في التصميم المعتمد: زر «تحديث من ماي أفاقي» فوق البطاقة، وأزرار الفترة — هذا الشهر، هذا الربع، آخر ستة أشهر — تقلب المقارنة كلها على الأيام نفسها من الفترة السابقة.
- «فريقي» بأشرطة للمنجزة، وتحته تنبيهان بقواعد معلنة: «يحتاج نظرة» مع أسبابه، و«تحسّن واضح».
- لوحة المؤشرات: شريط ستة أرقام، وترتيب الجدول بالمنجزة أو الوسيط أو المفتوحة، وأشرطة المنجزة، ومقارنة الفترات أعمدةً.

<details><summary>English</summary>

- “My KPIs” as in the approved design: an “Update from myafaqy” button above the card, and period buttons — this month, this quarter, the last six months — that switch the whole comparison over the same days of the previous period.
- “My team” with bars for completed work, and two alerts beneath it with stated rules: “Needs a look” with its reasons, and “Clear improvement”.
- The KPI board: a six-number strip, table ordering by completed, median or open, bars for completed work, and the period comparison as columns.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- «میرے اشاریے» منظور شدہ ڈیزائن کے مطابق: کارڈ کے اوپر «مائی آفاقی سے تازہ کریں» کا بٹن، اور مدت کے بٹن — یہ مہینہ، یہ سہ ماہی، پچھلے چھ ماہ — جو پوری موازنے کو پچھلی مدت کے انہی دنوں پر بدل دیتے ہیں۔
- «میری ٹیم» میں مکمل کام کے بار، اور اس کے نیچے واضح اصولوں والے دو انتباہات: «توجہ درکار» اس کی وجوہات کے ساتھ، اور «واضح بہتری»۔
- اشاریوں کا بورڈ: چھ اعداد کی پٹی، مکمل، وسط یا کھلے کے مطابق جدول کی ترتیب، مکمل کام کے بار، اور مدتوں کا موازنہ کالموں کی صورت میں۔

</div>
</details>


## v7.2 — 2026-10-29

- صفحة «الفريق»: المدير يكتب منصب كل شخص ومن يتبع له أمام اسمه كما يأتي من ماي أفاقي. يُحفظ بأرقام ماي أفاقي لا بالأسماء، ويُنزَّل «team.json» ليوضع في المستودع فيراه الفريق كله — بلا اسم واحد في الملف.
- المنصب يظهر في بطاقة «مؤشراتي» وجداول الفريق ولوحة المؤشرات، و«يتبع لـ» يجعل القائد يرى من تحته في «فريقي».
- دوائر بالهوية نفسها: مصادر شغل الشهر في «مؤشراتي»، وفي اللوحة توزيع المنجزة على الفريق ومصادر المهام وحالة تذاكر ما بعد البيع.

<details><summary>English</summary>

- A “Team” page: the manager writes each person’s position and who they report to, next to the name as it comes from myafaqy. It is saved by myafaqy ids, not names, and “team.json” is downloaded for the repository so the whole team sees it — with not one name in the file.
- The position shows on the “My KPIs” card, team tables and the KPI board, and “reports to” lets a leader see their people in “My team”.
- Donuts in the same identity: this month’s work sources on “My KPIs”; on the board, completed work across the team, task sources, and the state of after-sales tickets.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- «ٹیم» کا صفحہ: مینیجر ہر فرد کا عہدہ اور سربراہ اس نام کے سامنے لکھتا ہے جو مائی آفاقی سے آتا ہے۔ یہ ناموں سے نہیں، مائی آفاقی کی شناختوں سے محفوظ ہوتا ہے، اور «team.json» ریپوزٹری کے لیے ڈاؤن لوڈ ہوتا ہے تاکہ پوری ٹیم دیکھے — فائل میں ایک نام بھی نہیں۔
- عہدہ «میرے اشاریے» کے کارڈ، ٹیم کے جدولوں اور اشاریوں کے بورڈ پر دکھائی دیتا ہے، اور «ماتحت» سربراہ کو «میری ٹیم» میں اس کے لوگ دکھاتا ہے۔
- اسی شناخت میں دائرے: «میرے اشاریے» پر اس مہینے کے کام کے ذرائع؛ بورڈ پر ٹیم میں مکمل کام کی تقسیم، ٹاسکس کے ذرائع، اور آفٹر سیلز ٹکٹس کی حالت۔

</div>
</details>


## v7.1 — 2026-10-29

- مراجعة شاملة بعد يوم من أحد عشر إصدارًا: عُثر على عيب — ملف «مؤشراتي» المحفوظ من نسخة 6.9 كان يظهر فارغًا في 7.0 — وصُلح، وصار اختبارًا دائمًا حتى لا تُفقد بيانات أحد مع أي نسخة قادمة.
- شعار القائمة لم يكن ضمن ما يُحفظ للعمل بلا إنترنت؛ أُضيف، وصار الحارس يتأكد أن كل ما تستعمله الصفحة محفوظ. وحُذفت سبع عبارات من تصميمات قديمة لم تعد تُستعمل.
- فُحصت كل صفحة في اللغات الثلاث والوضعين الفاتح والداكن وعلى الحاسوب والهاتف — أربع وثمانون حالة بلا خطأ. وصفحة الانتظار لا تبقى معلّقة إن لم تصل البيانات.
- الدليل والمستندات تصف الآن نظامًا واحدًا: الطريق الأسرع للمدير، وملف الموظف ومن يرى من.

<details><summary>English</summary>

- A full review after a day of eleven releases: one defect found — a “My KPIs” profile saved under 6.9 showed an empty page under 7.0 — fixed, and now a permanent test so no future version can lose anyone’s data.
- The menu logo was not among what is kept for offline use; added, and the guard now checks that everything the page uses is kept. Seven leftover phrases from old layouts were removed.
- Every page was checked in the three languages, both light and dark, on desktop and phone — eighty-four cases without an error. The waiting page no longer hangs if the data never arrives.
- The guide and documents now describe one coherent system: the fastest path for the manager, and the employee profile with who sees whom.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- گیارہ اجراؤں کے ایک دن کے بعد مکمل جائزہ: ایک خرابی ملی — 6.9 میں محفوظ «میرے اشاریے» کا پروفائل 7.0 میں خالی صفحہ دکھاتا تھا — درست کر دی گئی، اور اب ایک مستقل ٹیسٹ ہے تاکہ کوئی آئندہ نسخہ کسی کا ڈیٹا ضائع نہ کرے۔
- مینو کا لوگو آف لائن کے لیے محفوظ چیزوں میں نہیں تھا؛ شامل کر دیا گیا، اور گارڈ اب جانچتا ہے کہ صفحہ جو کچھ استعمال کرتا ہے وہ سب محفوظ ہے۔ پرانے ڈیزائنوں کے سات بچے ہوئے جملے ہٹا دیے گئے۔
- ہر صفحہ تینوں زبانوں، روشن اور تاریک دونوں اندازوں میں، کمپیوٹر اور فون پر جانچا گیا — چوراسی صورتیں بغیر کسی خرابی کے۔ انتظار کا صفحہ اب معلق نہیں رہتا اگر ڈیٹا نہ پہنچے۔
- رہنما اور دستاویزات اب ایک ہم آہنگ نظام بیان کرتی ہیں: مینیجر کے لیے تیز ترین راستہ، اور ملازم کا پروفائل اور کون کسے دیکھتا ہے۔

</div>
</details>


## v7.0 — 2026-10-29

- «مؤشراتي» صارت ملفًّا كاملًا: بياناتك وفرقك، ثم «هذا الشهر مقابل الشهر الماضي» على الأيام نفسها بأسهم تقول أين تحسّنت وأين تراجعت، ثم شغلك المفتوح، ثم مقارنتك بمتوسط الفريق بلا أسماء، ثم تاريخك لاثني عشر شهرًا.
- قائد الفريق والمدير: قسم «فريقي» بأرقام كل من يضعه ماي أفاقي تحتك في هيكله، ومقارنة كل واحد بشهره الماضي. البوابة تعرض لكل شخص بالضبط ما يعرضه له ماي أفاقي — لا جدول صلاحيات يتقادم.
- البيانات تنتقل من ماي أفاقي إلى البوابة برسالة بين النافذتين بلا حدّ للحجم، مقصورة على عنوان البوابة. ولا تُنقل عناوين مهام غيرك ولا أسماء العملاء ولا رمز الدخول.

<details><summary>English</summary>

- “My KPIs” is now a full profile: your details and teams, then “This month against last month” over the same days with arrows showing where you improved and where you slipped, then your open work, then your comparison with the team average without names, then your twelve-month history.
- Team leaders and managers: a “My team” section with the figures of everyone myafaqy places below you in its hierarchy, each compared with their own last month. The portal shows each person exactly what myafaqy shows them — no permissions table to go stale.
- Data moves from myafaqy to the portal by a message between the two windows, with no size limit, addressed to the portal alone. The titles of others’ tasks, customer names and the sign-in token are never carried.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- «میرے اشاریے» اب ایک مکمل پروفائل ہے: آپ کی تفصیلات اور ٹیمیں، پھر انہی دنوں پر «یہ مہینہ بمقابلہ پچھلا مہینہ» تیروں کے ساتھ جو بتاتے ہیں کہاں بہتری آئی اور کہاں کمی، پھر آپ کا کھلا کام، پھر ناموں کے بغیر ٹیم کی اوسط سے آپ کا موازنہ، پھر بارہ مہینوں کی آپ کی تاریخ۔
- ٹیم لیڈر اور مینیجر: «میری ٹیم» کا حصہ ان سب کے اعداد کے ساتھ جنہیں مائی آفاقی اپنے ڈھانچے میں آپ کے نیچے رکھتا ہے، ہر ایک کا اپنے پچھلے مہینے سے موازنہ۔ پورٹل ہر شخص کو بالکل وہی دکھاتا ہے جو مائی آفاقی اسے دکھاتا ہے — کوئی اجازتوں کی فہرست نہیں جو پرانی ہو۔
- ڈیٹا مائی آفاقی سے پورٹل تک دونوں ونڈوز کے درمیان ایک پیغام کے ذریعے جاتا ہے، بغیر کسی حد کے، صرف پورٹل کے پتے پر۔ دوسروں کے ٹاسکس کے عنوان، گاہکوں کے نام اور لاگ اِن ٹوکن کبھی نہیں لائے جاتے۔

</div>
</details>


## v6.9 — 2026-10-29

- «مؤشراتي» صارت تبدأ بـ«شغلي المفتوح الآن»: مهامك المفتوحة بعناوينها ونوعها وعمرها، الأحدث أولًا — قائمة عملك الحالي من ضغطة واحدة على الإشارة في ماي أفاقي. عناوين المهام المنجزة وأسماء العملاء لا تُنقل كما كان.
- إشارة للمدير في صفحة البيانات: ضغطة واحدة من داخل ماي أفاقي تسحب كل بيانات الربع — المهام، وطابور البحث والتطوير، ونقاط الفنيين، وتذاكر ما بعد البيع — وتحفظ الملفين اللذين يُرفعان في البوابة. بديل أسرع عن تشغيل الأمرين في كلود كروم.
- الحارس صار يتأكد أن الإشارتين تعملان بعد ضغط أسطرهما، ولا يسمح إلا بالطلبات الستة للقراءة.

<details><summary>English</summary>

- “My KPIs” now opens with “My open work now”: your open tasks with their titles, type and age, newest first — your current work list from one press on the bookmark in myafaqy. Titles of completed tasks and customer names are still never carried.
- A manager bookmark on the Data page: one press inside myafaqy pulls all of the quarter’s data — tasks, the R&D queue, technician points and after-sales tickets — and saves the two files uploaded in the portal. A faster alternative to running the two prompts in Claude in Chrome.
- The guard now checks that both bookmarks run after their lines are joined, and allows only the six read requests.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- «میرے اشاریے» اب «میرا کھلا کام ابھی» سے شروع ہوتا ہے: آپ کے کھلے ٹاسک ان کے عنوان، قسم اور عمر کے ساتھ، نئے پہلے — مائی آفاقی میں بک مارک کے ایک دباؤ سے آپ کے موجودہ کام کی فہرست۔ مکمل شدہ ٹاسکس کے عنوان اور گاہکوں کے نام پہلے کی طرح نہیں لائے جاتے۔
- ڈیٹا کے صفحے پر مینیجر کا بک مارک: مائی آفاقی کے اندر ایک دباؤ سہ ماہی کا سارا ڈیٹا — ٹاسک، R&D قطار، ٹیکنیشن پوائنٹس اور آفٹر سیلز ٹکٹس — کھینچتا ہے اور پورٹل میں اپ لوڈ ہونے والی دونوں فائلیں محفوظ کرتا ہے۔ کلاڈ کروم میں دونوں ہدایات چلانے کا تیز تر متبادل۔
- گارڈ اب جانچتا ہے کہ دونوں بک مارک اپنی سطریں جوڑنے کے بعد چلتے ہیں، اور صرف چھ پڑھنے والی درخواستوں کی اجازت دیتا ہے۔

</div>
</details>


## v6.8 — 2026-10-29

- المؤشر الثاني — نقاط الفنيين: لكل فني في جدة التركيبات والصيانة والإصلاح وإعادة الخدمة والإيقاف والتركيب الجماعي والأعمال الإضافية والمخالفات والنقاط، من تقرير «نقاط الفنيين» في ماي أفاقي نفسه، مجموعة لأشهر الفترة.
- المؤشر الثالث — تذاكر ما بعد البيع: لكل موظف المفتوحة والمعلّقة والمنجزة، من لوحة «ما بعد البيع» في ماي أفاقي لفرع جدة.
- لكل فترة في صفحة البيانات أمر ثانٍ «نسخ أمر التقارير» يسحب المؤشرين بطلبين مسموحين فقط، ويحفظ ملفًّا يُرفع في الصندوق نفسه. ولا تُنقل قيم المكافآت ولا الهواتف ولا التقييمات أبدًا.
- عمود «بحث وتطوير» في المؤشر الأول: المنجز من طابور مهام البحث والتطوير. والسحب صار أسرع خمس مرات.

<details><summary>English</summary>

- Factor 2 — technician points: for every Jeddah technician, installations, maintenance, repairs, re-service, stop service, group installs, additional work, violations and points, from myafaqy’s own “Technicians Points” report, summed over the period’s months.
- Factor 3 — after-sales tickets: per employee, open, pending and done, from myafaqy’s “After Sales Board” for the Jeddah branch.
- Each period on the Data page has a second prompt, “Copy the reports prompt”, which pulls both factors with two allowed requests only and saves a file uploaded in the same box. Bonus values, phone numbers and evaluations are never carried.
- An “R&D” column in Factor 1: the completed tasks from the R&D queue. And pulling is five times faster.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- دوسرا اشاریہ — ٹیکنیشن پوائنٹس: جدہ کے ہر ٹیکنیشن کی تنصیبات، مرمت، درستی، دوبارہ سروس، بندش، اجتماعی تنصیب، اضافی کام، خلاف ورزیاں اور پوائنٹس، مائی آفاقی کی اپنی «ٹیکنیشن پوائنٹس» رپورٹ سے، مدت کے مہینوں کا مجموعہ۔
- تیسرا اشاریہ — آفٹر سیلز ٹکٹس: ہر ملازم کے کھلے، زیر التوا اور مکمل، جدہ برانچ کے لیے مائی آفاقی کے «آفٹر سیلز بورڈ» سے۔
- ڈیٹا کے صفحے پر ہر مدت کی دوسری ہدایت «رپورٹس کی ہدایت کاپی کریں» صرف دو اجازت شدہ درخواستوں سے دونوں اشاریے لاتی ہے اور فائل محفوظ کرتی ہے جو اسی خانے میں اپ لوڈ ہوتی ہے۔ بونس کی رقمیں، فون نمبر اور تشخیصات کبھی نہیں لائی جاتیں۔
- پہلے اشاریے میں «تحقیق و ترقی» کا کالم: R&D قطار کے مکمل شدہ ٹاسک۔ اور ڈیٹا لانا پانچ گنا تیز ہو گیا۔

</div>
</details>


## v6.7 — 2026-10-29

- تصحيح مهم في الأوقات: ماي أفاقي يرسل الأوقات بتوقيت غرينتش لا السعودية — ثبت ذلك بمقارنة الشاشة في أول سحب حقيقي. «مؤشراتي» كان سيؤخّر كل وقت ثلاث ساعات وينقل مهام ما بعد منتصف الليل لليوم والربع الخطأ؛ صُحّح. أرقام لوحة المؤشرات لم تتأثر.
- الفريق الافتراضي صار الفرق الفنية في جدة: يدخل من كان أحد فرقه في جدة ولو كان فريقه الآخر في فرع غيرها، ويخرج من كانت فرقه كلها مبيعات أو تحصيل. ويبقى التعديل اليدوي متاحًا.
- أمر كلود كروم في صفحة البيانات صار يحدّد بالاسم الطلبات الأربعة المسموحة ويمنع كل ما سواها، ويحفظ النتيجة ملفًّا على الجهاز بدل لصقها في المحادثة.

<details><summary>English</summary>

- An important time correction: myafaqy sends times in UTC, not Saudi time — proved against the screen on the first real pull. “My KPIs” would have shifted every time by three hours and moved after-midnight tasks to the wrong day and quarter; corrected. The KPI board’s figures were not affected.
- The default team is now Jeddah’s technical teams: a person is in if any of their teams is in Jeddah, even if another team is in a different branch, and out if all their teams are sales or collection. Manual adjustment stays available.
- The Claude in Chrome prompt on the Data page now names the four allowed requests and forbids everything else, and saves the result as a file on the computer instead of pasting it into the chat.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- اوقات میں ایک اہم درستی: مائی آفاقی اوقات سعودی وقت میں نہیں بلکہ UTC میں بھیجتا ہے — پہلی حقیقی کھینچائی میں اسکرین سے موازنہ کر کے ثابت ہوا۔ «میرے اشاریے» ہر وقت کو تین گھنٹے پیچھے کر دیتا اور آدھی رات کے بعد کے ٹاسک غلط دن اور سہ ماہی میں ڈال دیتا؛ درست کر دیا گیا۔ اشاریوں کے بورڈ کے اعداد متاثر نہیں ہوئے۔
- پہلے سے منتخب ٹیم اب جدہ کی تکنیکی ٹیمیں ہیں: جس کی کوئی ٹیم جدہ میں ہو وہ شامل ہے چاہے اس کی دوسری ٹیم کسی اور برانچ میں ہو، اور جس کی سب ٹیمیں سیلز یا وصولی کی ہوں وہ شامل نہیں۔ دستی تبدیلی بدستور ممکن ہے۔
- ڈیٹا کے صفحے پر کلاڈ کروم کی ہدایت اب چار اجازت شدہ درخواستوں کے نام لیتی ہے اور باقی سب سے منع کرتی ہے، اور نتیجہ چیٹ میں پیسٹ کرنے کے بجائے کمپیوٹر پر فائل کے طور پر محفوظ کرتی ہے۔

</div>
</details>


## v6.6 — 2026-10-29

- تفاصيل كل وحدة في «أفاقي برو» صارت تعرض أيضًا أمر العمل والمجموعات والعدادات — الأقسام الموثقة رسميًّا في أفاقي برو — لنرى إن كان أمر العمل يحمل من ركّب الجهاز ومتى.
- طوبقت صفحة أفاقي برو مع التوثيق الرسمي للربط: الدخول وطلب الوحدات كما هما بالحرف.

<details><summary>English</summary>

- Each unit’s detail in “Afaqy PRO” now also shows its job order, groups and counters — sections officially documented in Afaqy PRO — to see whether the job order records who installed the device and when.
- The Afaqy PRO page was checked against the official integration documentation: the sign-in and the units request match it exactly.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- «آفاقی پرو» میں ہر یونٹ کی تفصیل اب اس کا ورک آرڈر، گروپس اور کاؤنٹرز بھی دکھاتی ہے — آفاقی پرو میں سرکاری طور پر دستاویزی حصے — تاکہ دیکھا جا سکے کہ ورک آرڈر میں ڈیوائس لگانے والے اور وقت کا اندراج ہے یا نہیں۔
- آفاقی پرو کے صفحے کو انٹیگریشن کی سرکاری دستاویزات سے ملایا گیا: لاگ اِن اور یونٹس کی درخواست بالکل ویسی ہی ہیں۔

</div>
</details>


## v6.5 — 2026-10-29

- صفحة «أفاقي برو» داخل البوابة: الدخول باسم المستخدم وكلمة المرور، ثم وحدات الحساب كلها — آخر إرسال بتوقيت السعودية، والحالة، والموقع على الخريطة، والبحث بالاسم أو IMEI، وكل بيانات الوحدة بضغطة — دون مغادرة البوابة. للقراءة فقط.
- كلمة المرور لا تُحفظ في أي مكان، والجلسة تنتهي بإغلاق التبويب. الحسابات التي تستخدم رمز تحقق تفتح موقع أفاقي برو نفسه، لأنه يمنع إكمال الدخول بالرمز من خارجه.
- ماي أفاقي وموقع أفاقي برو لا يمكن عرضهما داخل البوابة — الشركة تمنع ذلك في خوادمها — فيفتحان في نافذة جديدة.

<details><summary>English</summary>

- An “Afaqy PRO” page inside the portal: sign in with your username and password, then see all the account’s units — last report in Saudi time, state, location on the map, search by name or IMEI, and all of a unit’s data with one press — without leaving the portal. Read only.
- The password is not saved anywhere, and the session ends when the tab closes. Accounts that use a verification code open the Afaqy PRO site itself, because it forbids completing a code sign-in from outside.
- myafaqy and the Afaqy PRO site cannot be shown inside the portal — the company forbids it on its servers — so they open in a new tab.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- پورٹل کے اندر «آفاقی پرو» کا صفحہ: صارف نام اور پاس ورڈ سے لاگ اِن کریں، پھر اکاؤنٹ کے تمام یونٹس دیکھیں — سعودی وقت میں آخری رپورٹ، حالت، نقشے پر مقام، نام یا IMEI سے تلاش، اور ایک دباؤ سے یونٹ کا سارا ڈیٹا — پورٹل چھوڑے بغیر۔ صرف پڑھنے کے لیے۔
- پاس ورڈ کہیں محفوظ نہیں ہوتا، اور ٹیب بند ہونے پر سیشن ختم ہو جاتا ہے۔ تصدیقی کوڈ والے اکاؤنٹ آفاقی پرو کی سائٹ ہی کھولتے ہیں، کیونکہ وہ باہر سے کوڈ والا لاگ اِن مکمل کرنے کی اجازت نہیں دیتی۔
- مائی آفاقی اور آفاقی پرو کی سائٹ پورٹل کے اندر نہیں دکھائی جا سکتیں — کمپنی اپنے سرورز پر اس سے منع کرتی ہے — اس لیے یہ نئی ٹیب میں کھلتی ہیں۔

</div>
</details>


## v6.4 — 2026-10-29

- عمود جديد «سجّلها لنفسه»: المهام التي فتحها الموظف وأسندها لنفسه، لا من البريد — أي الطلبات التي تصله بالواتساب أو بالمكالمات. يظهر في لوحة المؤشرات وفي «مؤشراتي»، فيتضح من أين جاء حمل كل موظف.
- هذه المهام كانت تُحسب له من قبل ضمن المسند والمنجز؛ الجديد أنها صارت مرئية كمصدر مستقل. ماي أفاقي لا يسجّل القناة، فلا يُفصل الواتساب عن المكالمة.

<details><summary>English</summary>

- A new “Self-logged” column: tasks the employee opened and assigned to himself, not from email — the requests that reach him by WhatsApp or by phone. It appears on the KPI board and in “My KPIs”, so it is clear where each person’s load came from.
- These tasks already counted for him among assigned and completed; what is new is that they are visible as their own source. myafaqy does not record the channel, so WhatsApp and calls cannot be separated.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- نیا کالم «خود درج کیے»: وہ ٹاسک جو ملازم نے خود کھولے اور خود کو تفویض کیے، ای میل سے نہیں — یعنی وہ درخواستیں جو اسے واٹس ایپ یا کال سے پہنچتی ہیں۔ یہ اشاریوں کے بورڈ اور «میرے اشاریے» میں دکھائی دیتا ہے، تاکہ واضح ہو کہ ہر شخص کا کام کہاں سے آیا۔
- یہ ٹاسک پہلے بھی اس کے تفویض شدہ اور مکمل شدہ میں شمار ہوتے تھے؛ نیا یہ ہے کہ اب یہ الگ ذریعے کے طور پر نظر آتے ہیں۔ مائی آفاقی ذریعہ درج نہیں کرتا، اس لیے واٹس ایپ اور کال کو الگ نہیں کیا جا سکتا۔

</div>
</details>


## v6.3 — 2026-10-29

- «مؤشراتي»: كل موظف يرى مؤشرات عمله هو لكل ربع — المسند والمنجز ونسبة الإنجاز والمدة والمفتوح الآن — بلا حساب جديد ولا كلمة مرور. إشارة في المتصفح تقرأ «مهامي» من ماي أفاقي بدخوله هو، فلا يرى زملاءه أبدًا، والأرقام تبقى على جهازه.
- الإعداد مرة واحدة من صفحة «مؤشراتي»: على الكمبيوتر يُسحب الزر إلى شريط الإشارات، وعلى الجوال يُحفظ يدويًّا بالخطوات المكتوبة.
- إصلاح: مجموعات القائمة الجانبية كانت تظهر كلها مفتوحة في نافذة جديدة؛ الآن تُفتح «الوحدات» وحدها، ومجموعة الصفحة الحالية.

<details><summary>English</summary>

- “My KPIs”: each employee sees their own work KPIs per quarter — assigned, completed, completion rate, time and open now — with no new account or password. A browser bookmark reads “My Tasks” from myafaqy with their own sign-in, so they never see colleagues, and the figures stay on their device.
- Setup is once, from the “My KPIs” page: on a computer the button is dragged onto the bookmarks bar; on a phone it is saved by hand following the written steps.
- Fix: the side-menu groups all showed open in a new tab; now only “Modules” opens, plus the current page’s group.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- «میرے اشاریے»: ہر ملازم ہر سہ ماہی کے لیے اپنے کام کے اشاریے دیکھتا ہے — تفویض شدہ، مکمل شدہ، تکمیل کی شرح، وقت اور اس وقت کھلے — بغیر کسی نئے اکاؤنٹ یا پاس ورڈ کے۔ براؤزر کا ایک بک مارک اسی کے لاگ اِن سے مائی آفاقی کے «میرے ٹاسک» پڑھتا ہے، اس لیے وہ اپنے ساتھیوں کو کبھی نہیں دیکھتا، اور اعداد اس کی ڈیوائس پر رہتے ہیں۔
- ترتیب ایک بار ہوتی ہے، «میرے اشاریے» کے صفحے سے: کمپیوٹر پر بٹن کو بک مارکس بار پر کھینچا جاتا ہے؛ موبائل پر لکھے ہوئے مراحل کے مطابق اسے ہاتھ سے محفوظ کیا جاتا ہے۔
- درستی: نئی ٹیب میں سائیڈ مینو کے سب گروپ کھلے دکھائی دیتے تھے؛ اب صرف «ماڈیولز» اور موجودہ صفحے کا گروپ کھلتا ہے۔

</div>
</details>


## v6.2 — 2026-10-29

- تصميم البوابة صار تصميم نظام إدارة الخدمات نفسه: قائمة جانبية داكنة بالشعار على لوح أبيض، ومجموعات تُطوى — الوحدات والمؤشرات وأنظمة الشركة — تُفتح واحدة في كل مرة، وعلامة على العنصر الحالي، وشريط علوي فيه الرئيسية وعنوان الصفحة.
- اللغة تُختار من قائمة أسفل القائمة الجانبية، ومعها زر الوضع الداكن؛ والوضع الداكن مأخوذ من ألوان النظام نفسها.
- على الجوال: الشريط العلوي بلون القائمة، والقائمة تنزلق من زر فيه.

<details><summary>English</summary>

- The portal now uses the Service Management system’s own design: a dark side menu with the logo on a white plate, folding groups — Modules, KPIs and Company systems — opening one at a time, a marker on the current item, and a top bar with Home and the page title.
- The language is chosen from a list at the foot of the side menu, next to the dark-mode button; dark mode is drawn from the system’s own colours.
- On a phone, the top bar takes the menu’s colour and the menu slides in from a button in it.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- پورٹل کا ڈیزائن اب سروس مینجمنٹ سسٹم کا اپنا ڈیزائن ہے: گہرا سائیڈ مینو جس میں لوگو سفید پلیٹ پر ہے، تہہ ہونے والے گروپس — ماڈیولز، اشاریے اور کمپنی کے سسٹمز — جو ایک وقت میں ایک کھلتے ہیں، موجودہ آئٹم پر نشان، اور اوپر والی پٹی جس میں ہوم اور صفحے کا عنوان ہے۔
- زبان سائیڈ مینو کے نیچے ایک فہرست سے چنی جاتی ہے، تاریک انداز کے بٹن کے ساتھ؛ تاریک انداز سسٹم کے اپنے رنگوں سے لیا گیا ہے۔
- موبائل پر اوپر والی پٹی مینو کے رنگ کی ہو جاتی ہے، اور مینو اس میں موجود بٹن سے کھلتا ہے۔

</div>
</details>


## v6.1 — 2026-10-29

- قائمة جانبية على نسق بوابة البحث والتطوير: الوحدات أولًا، ثم صفحات البوابة، ثم أنظمة الشركة، وما تضغطه يفتح بجانبها. القائمة يمينًا بالعربية والأردية ويسارًا بالإنجليزية، وعلى الجوال تنزلق من زر أعلى الشاشة.
- التصميم بألوان برج تحكم البحث والتطوير وخطه، في الوضعين الفاتح والداكن، ورأس كل صفحة على طريقته.

<details><summary>English</summary>

- A side menu in the style of the R&D portal: the modules first, then the portal pages, then the company systems, and what you press opens beside it. The menu sits on the right in Arabic and Urdu and on the left in English; on a phone it slides in from a button at the top of the screen.
- The design uses the colours and the typeface of the R&D Control Tower, in light and dark, with every page heading in its manner.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- تحقیق و ترقی کے پورٹل کے انداز میں سائیڈ مینو: پہلے ماڈیولز، پھر پورٹل کے صفحات، پھر کمپنی کے سسٹمز، اور جو آپ دباتے ہیں وہ اس کے ساتھ کھلتا ہے۔ مینو عربی اور اردو میں دائیں طرف اور انگریزی میں بائیں طرف ہوتا ہے؛ موبائل پر یہ اسکرین کے اوپر والے بٹن سے کھلتا ہے۔
- ڈیزائن تحقیق و ترقی کے کنٹرول ٹاور کے رنگوں اور فونٹ میں ہے، روشن اور تاریک دونوں انداز میں، اور ہر صفحے کی سرخی اسی کے طریقے پر ہے۔

</div>
</details>


## v6.0 — 2026-10-29

- الأدوات صارت وحدات داخل البوابة: مخطط الحساسات ومساعد الإنتجريشن وكانفال وقارئات أفاقي تعمل تحت شريط البوابة، وتبقى كل أداة مفتوحة على حالها حين تنتقل لغيرها، مع زر لفتحها وحدها.
- التصميم بألوان هوية أفاقي وحدها — ألوان القالب الرسمي — في الوضعين الفاتح والداكن، والتنبيهات بالألوان نفسها مع علامة بدل الأصفر والأحمر.
- ماي أفاقي وأفاقي برو والبريد تفتح في نافذة جديدة، لأن هذه الأنظمة لا تسمح بعرضها داخل صفحة أخرى.

<details><summary>English</summary>

- The tools are now modules inside the portal: the sensor tool, the API helper, canval and Afaqy readers work under the portal’s header, and each stays open as it was while you move to another, with a button to open it on its own.
- The design uses Afaqy’s identity colours only — the official template palette — in light and dark, and notices use the same colours with a sign instead of yellow and red.
- myafaqy, Afaqy PRO and email open in a new tab, because those systems do not allow being shown inside another page.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- ٹولز اب پورٹل کے اندر ماڈیول ہیں: سینسر ٹول، انٹیگریشن ہیلپر، کینوال اور آفاقی ریڈرز پورٹل کی پٹی کے نیچے چلتے ہیں، اور جب آپ دوسرے ٹول پر جاتے ہیں تو ہر ٹول اپنی حالت میں کھلا رہتا ہے؛ اسے الگ کھولنے کا بٹن بھی موجود ہے۔
- ڈیزائن صرف آفاقی کی شناخت کے رنگوں میں ہے — سرکاری ٹیمپلیٹ کے رنگ — روشن اور تاریک دونوں انداز میں، اور اطلاعات پیلے اور سرخ کے بجائے انہی رنگوں میں ایک نشان کے ساتھ دکھائی دیتی ہیں۔
- مائی آفاقی، آفاقی پرو اور ای میل نئی ٹیب میں کھلتے ہیں، کیونکہ یہ سسٹمز کسی دوسرے صفحے کے اندر دکھائے جانے کی اجازت نہیں دیتے۔

</div>
</details>


## v5.3 — 2026-10-29

- بطاقة أداة المسح الميداني صارت باسمها الحالي «قارئات أفاقي — المسح الميداني»، كما يظهر داخل الأداة نفسها.
- فحص آلي مع كل تحديث يتأكد أن كل أداة في البوابة ما زالت تفتح، وأنها ما زالت الأداة نفسها لا صفحة أخرى.

<details><summary>English</summary>

- The field survey tool’s card now carries its current name, “Afaqy readers — field survey”, as the tool itself shows it.
- An automatic check with every update confirms that every tool in the portal still opens, and is still the same tool rather than another page.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- فیلڈ سروے ٹول کا کارڈ اب اپنے موجودہ نام «آفاقی ریڈرز — فیلڈ سروے» سے دکھائی دیتا ہے، جیسا کہ ٹول خود دکھاتا ہے۔
- ہر اپ ڈیٹ کے ساتھ ایک خودکار جانچ تصدیق کرتی ہے کہ پورٹل کا ہر ٹول اب بھی کھلتا ہے، اور وہی ٹول ہے، کوئی دوسرا صفحہ نہیں۔

</div>
</details>


## v5.2 — 2026-10-29

- المؤشر الأول صار مبنيًّا على ما يسجّله ماي أفاقي فعلًا: «المنجزة» هي ما أُغلق داخل الفترة فيطابق عدد ماي أفاقي نفسه، و«المسندة» ما أُنشئ فيها، و«المفتوحة الآن» صورة لحظة السحب.
- المهام القادمة من بريد العملاء تُعرف الآن بنوعها في ماي أفاقي، لا بمن أنشأها — لأن حساب النظام ينشئ مهام أوامر العمل أيضًا.
- الفريق المحسوب يُحدَّد تلقائيًّا من فرق فرع جدة في ماي أفاقي، ويمكن تعديله من صفحة المؤشرات، والأسماء تظهر بلغة الصفحة.
- الأوقات تُقرأ بتوقيت السعودية دائمًا، فلا تنتقل مهمة إلى يوم أو شهر آخر مهما كانت إعدادات الجهاز.
- أمر كلود كروم الجديد يستعمل المسارات التي ثبتت في ماي أفاقي ويتجنب الحقول التي ثبت أنها فارغة أو متناقضة.

<details><summary>English</summary>

- Factor 1 is now built on what myafaqy actually records: “completed” is what was closed within the period, matching myafaqy’s own count; “assigned” is what was created in it; “open now” is a snapshot at the moment of extraction.
- Tasks that come from customer emails are now recognised by their type in myafaqy, not by who created them — the system account also creates the work-order tasks.
- The team counted is set automatically from the Jeddah-branch teams in myafaqy and can be changed on the KPIs page; names appear in the page’s language.
- Times are always read in Saudi time, so no task moves to another day or month whatever the device’s settings.
- The new Claude in Chrome prompt uses the paths proven in myafaqy and avoids the fields proven empty or contradictory.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- پہلا اشاریہ اب اس پر بنا ہے جو مائی آفاقی واقعی ریکارڈ کرتا ہے: «مکمل شدہ» وہ ہے جو مدت کے اندر بند ہوا، جو مائی آفاقی کی اپنی گنتی سے ملتا ہے؛ «تفویض شدہ» وہ ہے جو اس میں بنا؛ اور «اس وقت کھلے» ڈیٹا نکالنے کے لمحے کی تصویر ہے۔
- کسٹمر ای میل سے آنے والے ٹاسک اب مائی آفاقی میں اپنی قسم سے پہچانے جاتے ہیں، بنانے والے سے نہیں — کیونکہ سسٹم اکاؤنٹ ورک آرڈر کے ٹاسک بھی بناتا ہے۔
- شامل ٹیم مائی آفاقی میں جدہ برانچ کی ٹیموں سے خود بخود منتخب ہوتی ہے اور اشاریوں کے صفحے سے بدلی جا سکتی ہے؛ نام صفحے کی زبان میں دکھائی دیتے ہیں۔
- اوقات ہمیشہ سعودی وقت میں پڑھے جاتے ہیں، اس لیے ڈیوائس کی ترتیبات کچھ بھی ہوں کوئی ٹاسک دوسرے دن یا مہینے میں نہیں جاتا۔
- کلاڈ کروم کی نئی ہدایت مائی آفاقی میں ثابت شدہ راستے استعمال کرتی ہے اور ان خانوں سے بچتی ہے جو خالی یا متضاد ثابت ہوئے۔

</div>
</details>


## v5.1 — 2026-10-29

- الأردية مكتملة: كل نصوص البوابة وشرح كل صفحة كُتبت بالأردية من معناها كاملًا، بعد أن كانت مختصرة في النسخة السابقة حتى فقد بعضها معناه.
- دليل المستخدم لكل نسخة: تبويب «الدليل» يذكر رقم النسخة وتاريخها ويُطبع، ومع كل نسخة يصدر دليل كامل بالعربية والإنجليزية والأردية يُحفظ باسمها.
- شرح طريقة حساب المؤشرات صار جزءًا من الدليل أيضًا، وليس أسفل صفحة المؤشرات فقط.

<details><summary>English</summary>

- Urdu is complete: every text in the portal and the explanation of every page is now written in Urdu in full, after the previous version had cut some of it down until it lost its meaning.
- A user manual for every version: the Guide tab shows the version and its date and can be printed, and every version ships a full manual in Arabic, English and Urdu, kept under its own name.
- How each figure is calculated is now part of the guide as well, not only at the bottom of the KPIs page.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- اردو مکمل ہو گئی: پورٹل کی تمام عبارتیں اور ہر صفحے کی وضاحت اب پوری طرح اردو میں لکھی گئی ہے، جبکہ پچھلے ورژن میں کچھ حصے اتنے مختصر تھے کہ ان کا مطلب ہی نہیں رہا تھا۔
- ہر ورژن کی اپنی رہنمائی: «رہنما» ٹیب ورژن نمبر اور تاریخ دکھاتا ہے اور پرنٹ ہو سکتا ہے، اور ہر ورژن کے ساتھ عربی، انگریزی اور اردو میں مکمل رہنمائی جاری ہوتی ہے جو اسی کے نام سے محفوظ رہتی ہے۔
- اشاریوں کا حساب کیسے ہوتا ہے، یہ وضاحت اب رہنمائی کا حصہ بھی ہے، صرف اشاریوں کے صفحے کے نیچے نہیں۔

</div>
</details>


## v5.0 — 2026-10-29

- بوابة واحدة للفريق التقني بجدة: الأدوات الثلاث الأساسية أولًا — مخطط توزيع الحساسات ومساعد الإنتجريشن وكانفال — ثم أنظمة الشركة وبقية الأدوات.
- صفحة البيانات: أمر جاهز لكلود كروم لكل ربع سنة أو نصف سنة أو سنة، ورفع الرد بأجزائه، وعلامة «ناقصة» حين لا يطابق العدد ما أعلنه ماي أفاقي.
- صفحة المؤشرات: المؤشر الأول لكل مهندس — المسندة والمنجزة ونسبة الإنجاز ومدة الإنجاز — مع إجمالي الفريق والمقارنة بين الفترات.
- البيانات تبقى على هذا الجهاز فقط، مع نسخة احتياطية تُصدَّر وتُستعاد.

<details><summary>English</summary>

- One portal for the Jeddah technical team: the three core tools first — the sensor displacement tool, the API helper and canval — then the company systems and the other tools.
- Data page: a ready Claude in Chrome prompt per quarter, half year or year; replies uploaded in parts; a period is marked incomplete when its count does not match what myafaqy reported.
- KPIs page: Factor 1 per engineer — assigned, completed, completion rate and time to complete — with the team total and a comparison across periods.
- The data stays on this device only, with a backup that can be exported and restored.

</details>

### ما قبل v5.0

الإصدارات ١ إلى ٤ كانت على فايربيز (دخول، ومكتب خدمة بتذاكر، وجسر لحساب برو). اتشالت كلها في v5.0 لأن الفريق
بيشتغل على ماي أفاقي نفسه، والبوابة بقت تجمع شغله بس — السبب كامل في `docs/decisions/0001-static-no-firebase.md`.
