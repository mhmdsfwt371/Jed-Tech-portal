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
