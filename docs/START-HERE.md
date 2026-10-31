# ابدأ من هنا — بوابة الفريق التقني

أول ما يقرؤه المطوّر المستلِم. بعد عشر دقائق منها تستطيع البناء والفحص والنشر، وتعرف أين كل شيء ولماذا هو هكذا.

## البوابة في سطرين
صفحة ثابتة على جيتهب بيجز: مدخل الفريق إلى أدواته، ولوحة مؤشرات للمدير تُحسب من مهام ماي أفاقي. البيانات تصل
ملفًّا يُنتجه كلود كروم من داخل ماي أفاقي، وتبقى في متصفح من رفعها.

## المفاهيم الستة
1. **لا خادم.** كل ما تفعله البوابة يحدث في المتصفح. لا فايربيز ولا قاعدة بيانات (القرار 0001).
2. **ماي أفاقي لا يُنادى من الصفحة.** خادمه يرفض المواقع الخارجية؛ كلود كروم يقرأ من الداخل (القرار 0002).
3. **صيغة التبادل ملكنا.** `afaqy-crm-tasks/v1` — البوابة لا تعرف أسماء خانات ماي أفاقي (القرار 0003، و`data-format.md`).
4. **البيانات على الجهاز.** IndexedDB، مع تصدير واستعادة (القرار 0004).
5. **تعريف واحد لكل رقم.** المؤشرات في `factor1()` وحدها، ومكتوبة في `kpi-factors.md` وفي أسفل صفحة المؤشرات.
6. **نسخة واحدة في كل مكان.** `scripts/bump.mjs` يختمها، والحارس يرفض أي اختلاف.
7. **ثلاث لغات بالمعنى، ودليل لكل نسخة.** كل نص بالعربية والإنجليزية والأردية من معناه لا بحرفه؛ ودليل المستخدم
   يُولَّد من نصوص الدليل نفسها عند كل نسخة (القرار 0005).

## خريطة المستودع
| المسار | ما فيه |
|---|---|
| `index.html` · `app.js` · `core.js` · `config.js` | البوابة |
| `sw.js` · `manifest.webmanifest` | التثبيت والعمل من الكاش — داخل هذا المجلد فقط |
| `version.json` · `release/next.json` · `CHANGELOG.md` | الإصدار |
| `scripts/check.mjs` | الحارس — عشر قواعد، لكلٍّ منها سبب مكتوب |
| `scripts/bump.mjs` | ختم النسخة وتوليد دليلها |
| `scripts/build-manual.mjs` | دليل المستخدم من نصوص الدليل — يُشغَّل وحده بعد تعديل نص |
| `docs/manual/` | دليل كل نسخة وفهرسها |
| `docs/decisions/0010-my-kpis-through-myafaqy.md` | «مؤشراتي» وضماناته واختبار قبوله |
| `docs/decisions/0011-afaqy-pro-in-the-portal.md` | صفحة أفاقي برو وحدودها وضماناتها |
| `docs/decisions/0012-reports-factors-2-and-3.md` | المؤشران الثاني والثالث وما أُغلق بالدليل |
| `docs/decisions/0013-work-list-and-manager-bookmark.md` | قائمة الشغل في «مؤشراتي» وإشارة المدير |
| `docs/decisions/0014-profile-scoped-by-myafaqy.md` | ملف الموظف وقائد الفريق والمدير، ومن يرى من |
| `docs/decisions/0015-team-file-and-donuts.md` | ملف الفريق بالأرقام والدوائر |
| `docs/decisions/0016-profile-and-board-as-designed.md` | تنفيذ التصميم المعتمد: الأزرار والأشرطة والتنبيهات والأعمدة |
| `docs/decisions/0017-activity-log-factor-4.md` | المؤشر الرابع — سجل الأنشطة، وطيّ نقاط الفنيين |
| `docs/decisions/0018-assignment-panel-the-one-write.md` | لوحة التعيين — الكتابة الوحيدة، داخل ماي أفاقي |
| `docs/decisions/0019-weights-install-auto-update-help.md` | الأوزان، التثبيت، التحديث التلقائي، علامات «؟» |
| `docs/kpi-weights-study.md` | دراسة الأوزان — المنهج والخريطة والحوكمة |
| `docs/decisions/0020-monthly-card.md` | بطاقة الشهر: النمط والتميّز والتطوير والاقتراحات، وقفل الشهر |
| `docs/decisions/0021-week-coverage-one-to-one.md` | الأسبوع، تغطية الحسابات، اللقاء الشهري والأهداف، مسار النمط |
| `docs/decisions/0022-repair-quality-from-pro.md` | جودة الإصلاح من برو — عاد للإرسال؟ |
| `docs/decisions/0023-review-fixes-data-design-card-speed.md` | إصلاحات المراجعة: النسخة الكاملة، التصميم، البطاقة، اللغات عند الحاجة |
| `docs/decisions/0027-no-internal-addresses-in-public.md` | لا عناوين داخلية في المستودع العام؛ روابطي الخاصة على الجهاز |
| `docs/decisions/0028-workload-share.md` | Each person’s share of the work by day/week/month/quarter |
| `docs/decisions/0029-outlook-replies-from-own-inbox.md` | Email replies per person from the manager’s inbox, read-only |
| `docs/decisions/0030-engineer-level.md` | Engineer level, trend, forecast; the plan is the manager’s |
| `docs/decisions/0031-points-basis.md` | Points basis: four factors, three methods (completion, speed, time) |
| `docs/decisions/0032-load-sustainability.md` | Load sustainability: early workload signals, manager only |
| `docs/decisions/0033-pull-override-and-period-picker.md` | Newer pull overrides older; pick the pull period |
| `docs/decisions/0034-my-kpis-dashboard.md` | My KPIs dashboard: tabs, folding tiles, detail windows, export |
| `docs/decisions/0035-average-only-and-dashboard-views.md` | Average only; type and points in My KPIs; board and list views |
| `docs/decisions/0036-publish-weights-and-card-order.md` | Publish weights from the portal; activities in points; card order |
| `docs/design.md` | ألوان الهوية ودرجاتها، فاتح وداكن |
| `docs/crm-api.md` | مسارات ماي أفاقي وحقوله وما لا يُستعمل منها — من التقاط ٢٨ أكتوبر |
| `scripts/check-commit-title.mjs` | فحص عنوان الالتزام |
| `scripts/check-links.mjs` | كل أداة تفتح وما زالت هي نفسها — على جيتهب و`npm run links` |
| `scripts/build-preview.py` | ملف واحد للمعاينة في `dist/` |
| `tests/core.test.mjs` | اختبارات المنطق |
| `.githooks/` · `.github/workflows/verify.yml` | البوابة محليًّا وعلى جيتهب |
| `docs/decisions/` | سجل القرارات |

## في عشر دقائق: ابنِ وافحص
```bash
git clone https://github.com/mhmdsfwt371/Jed-Tech-portal && cd Jed-Tech-portal
git config core.hooksPath .githooks
npm run verify
python3 -m http.server 8000      # ثم افتح http://localhost:8000
```
لا حزم تُثبَّت: Node 20 وحده.

## إضافة أداة
سطر في `config.js` (`PRIMARY` أو `SYSTEMS` أو `MORE`) بأسمائها الثلاثة ورابطها، ثم نسخة جديدة. الأدوات الأساسية
الثلاث لا تتغير إلا بقرار مكتوب في `docs/decisions/`.

## إضافة مؤشر (Factor 2 وما بعده)
1. عرّفه أولًا في `kpi-factors.md`: المصدر، والحساب، ومن يُنسب له، وما يُستبعد.
2. إن احتاج بيانات جديدة: أضفها إلى الصيغة برقم جديد (`v2`) وحدّث الأمر في `buildPrompt()`.
3. الدالة في `core.js` مع اختبار يفشل أولًا، ثم العرض في `app.js`، ثم الدليل، ثم نسخة.

## الإرشاد التفاعلي في «مؤشراتي» (v8.10)

- زر `#me-tour-open` موجود باستمرار في عنوان صفحة `#me`، سواء حُمّلت بيانات الملف أو لم تُحمّل.
- الحوار `#me-tour` يمر بخمس مراحل مع اختيار الكمبيوتر/أندرويد/آيفون، أزرار سابق/التالي وإغلاق دون التأثير على البيانات.
- الإجراءات الحقيقية في الشرح: نسخ رمز إشارة `buildBookmarklet()` أو سحبها إلى شريط إشارات الكمبيوتر، وفتح `https://myafaqy.com/` في تبويب. **لا يتصل الشرح بواجهة ماي أفاقي من البوابة.**
- تستعمل `tourState()` في `core.js` لضبط الخطوات، ومعها اختبار في `tests/core.test.mjs`. نصوص `tour_*` والدليل `g_me_b` متاحة بالعربية والإنجليزية والأردية.
- ظهور بيانات موجودة لا يعني إتمام عملية سحب جديدة؛ المرحلة الأخيرة توضّح حالة التخزين المحلي فقط.

## العرض المتحرك داخل «مؤشراتي» (v8.12)

- `tour-demo.js` يرسم نافذة متصفح تجريبية مختلفة لكل خطوة من الخمس، وللكمبيوتر أو أندرويد أو آيفون. لا يستعمل واجهات خارجيّة ولا ينفّذ إشارة سحب من داخل العرض.
- `tourDemoPlan(step,device)` من `core.js` يحدد بداية ونهاية المؤشر ونوع الحركة (`drag` على الكمبيوتر عند حفظ الإشارة، أو `click` في بقية المشاهد). منطقها مُختبر في `tests/core.test.mjs`.
- `index.html` يضم النافذة وتأثيرات CSS على حركة الماوس واللمسات ونتائج الضغط، مع احترام تفضيل تقليل الحركة. زر إعادة العرض يكرر الحركة داخل المشهد، ويظل الدليل قابلا لإعادة الفتح.
- تظل الروابط الفعلية إلى ماي أفاقي والإشارة البرمجية في `app.js` كما هي؛ العرض لا ينتحل متصفح المستخدم ولا يضغط على واجهة ماي أفاقي.
- ملف `tour-demo.js` ضمن موارد PWA المخزنة مسبقا في `sw.js` وخاضع للفحص النحوي في `scripts/check.mjs`.

## توزيع النقاط ونشر الأوزان للفريق (v8.13)

- منطق `taskPointBreakdown()` في `core.js` يجمع المهام المنجزة فقط حسب نوعها ووزنها، ويخزن `breakdown` مع بطاقة `monthCard()` التي تم إنشاؤها حديثًا. البطاقة المجمدة القديمة لا يُختلق لها تفصيل من الأوزان الحالية.
- `portalWeights(repo, draft, teamMode)` يُلزِم رابط الفريق `?portal=team` بالملف الرسمي `weights.json`، ويعرض رابط الإدارة المسودة المحلية `weightsDevice` للمراجعة فقط.
- `weightPublishDiff()` يحصي تغيرات المسودة، و`publishableWeights()` يصدر ملفًا صالحًا للنشر مع المحافظة على `tiers` والبيانات العامة الأخرى. نافذة «اعتماد وتجهيز النشر» تنسخ المحتوى وتفتح `https://github.com/mhmdsfwt371/Jed-Tech-portal/edit/main/weights.json`؛ الاعتماد النهائي هو GitHub Commit بحقوق كتابة، ولا تُرسل مفاتيح أو كلمات مرور من البوابة.
- `sw.js` يستخدم Network-first لملف `weights.json` داخل نطاق الموقع مع تحديث Offline Cache. يجلب `app.js` الملف عند بدء التشغيل وعند سحب «مؤشراتي»، وبذلك يصل التحديث للفريق بعد نشر الملف حتى دون ختم إصدار تطبيق جديد.
- `tests/core.test.mjs` يتأكد من حساب نقاط المهام، والأوزان الافتراضية، وعزل المسودة، والفرق بين المنشور والمحلي، والمحافظة على مستويات الأوزان عند التصدير.

## الاستيراد شبه الأوتوماتيكي لبيانات المدير مع بقاء اليدوي (v8.14)

- صفحة `#data` تعرض **خيارين**: الإشارة الجديدة المباشرة في `#mgr-auto-row`، والإشارة القديمة التي تنزّل ملفين في `#mgr-row`؛ أوامر كلود كروم والرفع اليدوي تحت الخيارين ما زالت متاحة.
- `buildManagerBookmarklet(from,to,branch,lang,'auto',portalHome())` تستعمل نفس طلبات MyAFAQY الموجودة أصلًا، ثم تفتح نافذة الإدارة **مع تشغيل الإشارة مباشرة** قبل أي انتظار حتى لا يحجب المتصفح النافذة. تمرر `?mgrImport=<nonce>#data` برمز عشوائي؛ لا يحمل العنوان بيانات الموظفين.
- بعد السحب تُرسل المهام والتقارير عبر `postMessage` مع `targetOrigin` الدقيق. تنتظر الإشارة رسالة `afaqy-manager-ready/v1` من نافذة الإدارة، وترسل كائن `afaqy-manager-import/v1`، وتنتظر `afaqy-manager-ack/v1`. إن انقطع الرابط ترجع الإشارة لتنزيل الملفين للرفع اليدوي.
- نافذة الإدارة تقبل الرسالة فقط إذا كان أصلها `https://myafaqy.com` ومصدرها `window.opener` والرمز مطابقًا للعنوان. `parseManagerTransfer()` تستدعي `parseDataset()` و`parseReports()` على نفس الصيغ القديمة، وترفض الفترة غير المطابقة قبل حفظ أي جزء.
- التخزين نفسه `IndexedDB` في متصفح المدير؛ لا حسابات جديدة ولا Backend أو Firebase ولا إرسال بيانات لملف عام، ولا انتقال من أجهزة المهندسين إلى المدير.
- الاختبار الآلي يغطي رفض الرمز أو الصيغ أو الفترة، واستمرار وجود الإشارة اليدوية. **قبول النقل داخل MyAFAQY الحقيقي يحتاج تجربة مدير فعلية**؛ إذا تغيّر سياق النافذة أو منع المتصفح `window.opener` يرجع إلى الملفين.

## روابط الأنظمة
تُعرَّف التصنيفات والروابط الخارجية في `config.js` وتظهر مرتبة في الرئيسية والقائمة الجانبية. تفتح الروابط في تبويب جديد؛ لا تطلب البوابة بيانات من هذه الأنظمة.

### إدارة الروابط المشتركة
زر إدارة روابط الأنظمة يفتح صفحة مستقلة. أنشئ مفتاح GitHub دقيق الصلاحيات للمستودع فقط بصلاحية Contents قراءة وكتابة. أدخله في الصفحة لتحميل الروابط، ثم أضف أو عدّل أو احذف واختر التصنيف واضغط حفظ ونشر. يمسح المفتاح بعد الحفظ ولا يخزن. تأكد من اكتمال نشر GitHub Pages قبل توقع ظهور التعديل لدى الفريق.
