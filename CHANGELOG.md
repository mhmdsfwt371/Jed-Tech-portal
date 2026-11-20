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

## v9.75 — 2026-11-21

- إيميلات المناقصات تدخل السجل وحدها: يحفظ Power Automate كل إيميل مناقصة يصل ملفًا في فولدر على OneDrive، و«اربط فولدر الإيميلات» في بطاقة «اسحب المناقصات» يجعل البوابة تقرؤه وحدها وهي مفتوحة وتسجّل المناقصة. «إزاي؟» يعرض خطوات الـ Flow: نحو خمس دقائق، دون صلاحية أدمن، ولا يخرج شيء من جهازك.
- حين لا يرد محلل المناقصات وأنت تفعّل خانة «ادرس كل مناقصة جديدة بالمحلل»، صارت الرسالة تقول ما تفعل: افتح المحلل (run.bat) واتركه مفتوحًا ثم فعّل الخانة، واسمح لكروم إن سألك — بدل رسالة «لم تبدأ الدراسة».
- على الجوال صار رأس بطاقة المناقصة أقصر: المرحلة والجهة ورقم اعتماد تأخذ عرض البطاقة كله تحت العنوان.

<details><summary>English</summary>

- Tender mails reach the register by themselves: Power Automate saves every tender mail that arrives as a file in a OneDrive folder, and «Connect the mail folder» on the «Pull tenders» card has the portal read it by itself while it is open and register the tender. «How?» shows the flow's steps: about five minutes, no admin rights, and nothing leaves your computer.
- When the Tender Analyzer does not answer as you turn on «Study every new tender with the Analyzer», the message now says what to do: open the Analyzer (run.bat), leave it open, turn the box on, and allow Chrome if it asks — instead of «the study did not start».
- On a phone the tender card's head is shorter: the stage, the entity and the Etimad number take the card's whole width under the title.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- ٹینڈر ای میلیں خود رجسٹر تک پہنچتی ہیں: Power Automate ہر آنے والی ٹینڈر ای میل کو OneDrive کے ایک فولڈر میں فائل کے طور پر محفوظ کرتا ہے، اور «ٹینڈر لائیں» کارڈ پر «ای میل فولڈر جوڑیں» سے پورٹل کھلا ہو تو اسے خود پڑھتا ہے اور ٹینڈر درج کرتا ہے۔ «کیسے؟» فلو کے مراحل دکھاتا ہے: تقریباً پانچ منٹ، ایڈمن اجازت کے بغیر، اور آپ کے کمپیوٹر سے کچھ باہر نہیں جاتا۔
- جب آپ «ہر نئے ٹینڈر کا اندراج ہوتے ہی تجزیہ کار سے مطالعہ کریں» فعال کریں اور ٹینڈر تجزیہ کار جواب نہ دے، تو پیغام اب بتاتا ہے کہ کیا کرنا ہے: تجزیہ کار (run.bat) کھولیں، اسے کھلا رہنے دیں، خانہ فعال کریں، اور اگر Chrome پوچھے تو اجازت دیں — «مطالعہ شروع نہیں ہوا» کے بجائے۔
- فون پر ٹینڈر کارڈ کا سر چھوٹا ہو گیا ہے: مرحلہ، ادارہ اور اعتماد نمبر عنوان کے نیچے کارڈ کی پوری چوڑائی لیتے ہیں۔

</div>
</details>


## v9.74 — 2026-11-20

- صفحة سجل المناقصات بتصميم جديد يمشي بترتيب الشغل: أولًا بطاقة «اسحب المناقصات» تُسقط فيها الإيميل أو أي ملف وبجانبها رادار اعتماد وتحليل السوق، ثم «المواعيد القادمة»، ثم الأرقام ومراحل المناقصات، ثم القائمة.
- ما يُستعمل من وقت لآخر (إضافة مناقصة بيدك، وأمر المساعد، وملف PST، واستيراد الدراسة، ومسؤول الملف الافتراضي، ورسالة الإدارة الأسبوعية، وملخص المراسلات) صار في قائمة «المزيد» على البطاقة، تُغلق بضغطة خارجها أو بزر Escape.
- على طرف كل صف في القائمة لون مرحلته: البرتقالي لما ينتظر الفرز أو القرار، والأزرق لما يُحضَّر أو قُدِّم، والأخضر للفوز، والأحمر للخسارة أو فوات الموعد.
- كل نوافذ السجل صارت بإطار واحد: العنوان وأدوات النافذة وزر «إغلاق» في صف ثابت أعلاها، وأزرار الحفظ ثابتة أسفلها. وعلى الجوال يبقى «إغلاق» بجانب العنوان مهما طال، ولا تخرج قائمة طويلة عن عرض النافذة.
- بطاقة المناقصة: العنوان والمرحلة والجهة ورقم اعتماد والمسؤول ثابتة أعلى النافذة وأنت تتنقل بين صفحاتها، وأزرار العمل (ادرسها بالمحلل، والنسخ، والبريد، والتقويم) أول ما تراه، والنافذة تفتح على زر «إغلاق» حتى لا يغيّر سهم في لوحة المفاتيح المرحلة بالخطأ.
- في البطاقة الطويلة على الجوال أو الشاشة الصغيرة، «كل التسلسل» و«كل الملفات ونقاطها المهمة» تفتح الجزء المطلوب وتنقلك إلى صفحته مباشرة بدل أن تبقى على الصفحة الأولى.

<details><summary>English</summary>

- The tender register page has a new design that follows the order of the work: first the «Pull tenders» card, where you drop the email or any file, with the Etimad radar and the market analysis beside it; then «Upcoming dates»; then the numbers and the tender stages; then the list.
- What is used now and then (adding a tender by hand, the assistant's prompt, a PST file, importing a study, the default file owner, the weekly management message and the correspondence summary) is now in the «More» menu on that card, which closes with a click outside it or with Escape.
- Each row of the list carries its stage's colour on its edge: amber for what waits for screening or a decision, blue for what is being prepared or was submitted, green for a win, and red for a loss or a missed deadline.
- Every window of the register now has one frame: the title, the window's tools and «Close» on one row pinned at its top, and the save buttons pinned at its foot. On a phone «Close» stays beside the title however long it is, and a long list of names no longer stretches the window past the screen.
- The tender's card: the title, the stage, the entity, the Etimad number and the owner stay at the top of the window while you move through its pages, the working buttons (study it with the Analyzer, the copies, the mail, the calendar) are the first thing you see, and the window opens on «Close» so an arrow key cannot change the stage by mistake.
- In a long card on a phone or a small screen, «The whole timeline» and «All files and their key points» open their part and take you straight to its page, instead of leaving you on the first page.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- ٹینڈر رجسٹر کا صفحہ نئے ڈیزائن کے ساتھ جو کام کی ترتیب پر چلتا ہے: پہلے «ٹینڈر لائیں» کارڈ جس پر آپ ای میل یا کوئی بھی فائل چھوڑتے ہیں، اور اس کے ساتھ اعتماد ریڈار اور مارکیٹ کا تجزیہ؛ پھر «آنے والی تاریخیں»؛ پھر اعداد اور ٹینڈر کے مراحل؛ پھر فہرست۔
- جو چیزیں کبھی کبھار استعمال ہوتی ہیں (ہاتھ سے ٹینڈر شامل کرنا، اسسٹنٹ کا پرامپٹ، PST فائل، مطالعہ درآمد کرنا، فائل کا طے شدہ ذمہ دار، ہفتہ وار انتظامی پیغام اور خط و کتابت کا خلاصہ) اب اسی کارڈ پر «مزید» کی فہرست میں ہیں، جو اس سے باہر کلک کرنے یا Escape دبانے سے بند ہو جاتی ہے۔
- فہرست کی ہر قطار کے کنارے پر اس کے مرحلے کا رنگ ہے: نارنجی اس کے لیے جو جانچ یا فیصلے کا منتظر ہے، نیلا اس کے لیے جس کی تیاری ہو رہی ہے یا جو جمع ہو چکا، سبز جیت کے لیے، اور سرخ ہار یا گزری ہوئی آخری تاریخ کے لیے۔
- رجسٹر کی ہر کھڑکی کا اب ایک ہی فریم ہے: عنوان، کھڑکی کے اوزار اور «بند کریں» اوپر ایک قطار میں جو اپنی جگہ ٹھہری رہتی ہے، اور محفوظ کرنے کے بٹن نیچے ٹھہرے رہتے ہیں۔ فون پر «بند کریں» عنوان کتنا ہی لمبا ہو اس کے ساتھ رہتا ہے، اور ناموں کی لمبی فہرست اب کھڑکی کو اسکرین سے باہر نہیں پھیلاتی۔
- ٹینڈر کا کارڈ: عنوان، مرحلہ، ادارہ، اعتماد نمبر اور ذمہ دار کھڑکی کے اوپر نظر آتے رہتے ہیں جب آپ اس کے صفحات میں آگے پیچھے جاتے ہیں، کام کے بٹن (تجزیہ کار سے مطالعہ، نقلیں، میل، کیلنڈر) سب سے پہلے دکھتے ہیں، اور کھڑکی «بند کریں» پر کھلتی ہے تاکہ کی بورڈ کا کوئی تیر غلطی سے مرحلہ نہ بدل دے۔
- فون یا چھوٹی اسکرین پر لمبے کارڈ میں «پوری ترتیب» اور «تمام فائلیں اور ان کے اہم نکات» مطلوبہ حصہ کھولتے ہیں اور آپ کو سیدھا اس کے صفحے پر لے جاتے ہیں، پہلے صفحے پر نہیں چھوڑتے۔

</div>
</details>


## v9.73 — 2026-11-20

- «المواعيد القادمة» أعلى سجل المناقصات: شريط واحد بمواعيد كل المناقصات المفتوحة يومًا بيوم، ومعها المواعيد الداخلية المحسوبة لك: رفع الاستفسارات، وتكلفة الضمان إلى الرياض، والتسليم لفريق المنافسات. اضغط أي موعد لتفتح مناقصته.
- زر «نبّهني بالمواعيد»: تنبيه على جهازك لكل موعد بقي عليه يوم أو أقل ما دامت البوابة مفتوحة. ولتذكير يصلك على الجوال والبوابة مغلقة نزّل «كل المواعيد للتقويم» وافتحه في أوتلوك.
- خط المواعيد داخل بطاقة المناقصة صار يحمل الموعدين الداخليين الجديدين أيضًا، وما فات منهما يظهر بالأحمر.

<details><summary>English</summary>

- «Upcoming dates» at the top of the tender register: one strip with the dates of every open tender day by day, together with the internal dates worked out for you: uploading the inquiries, the guarantee's cost to Riyadh, and the hand-over to the tenders team. Press any date to open its tender.
- The «Notify me of the dates» button: a notice on your device for every date a day away or less while the portal is open. For a reminder that reaches your phone while the portal is closed, download «All dates for the calendar» and open it in Outlook.
- The line of dates inside the tender's card now carries the two new internal dates as well, and one that was missed shows in red.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- ٹینڈر رجسٹر کے اوپر «آنے والی تاریخیں»: ایک ہی پٹی جس میں ہر کھلے ٹینڈر کی تاریخیں دن بہ دن ہیں، اور ان کے ساتھ آپ کے لیے نکالی گئی اندرونی تاریخیں: استفسارات اپ لوڈ کرنا، ضمانت کی لاگت ریاض کو بھیجنا، اور ٹینڈر ٹیم کو حوالگی۔ کسی بھی تاریخ کو دبائیں تو اس کا ٹینڈر کھل جاتا ہے۔
- «مجھے تاریخوں کی اطلاع دیں» کا بٹن: جب تک پورٹل کھلا ہو، آپ کے آلے پر ہر اس تاریخ کی اطلاع جس میں ایک دن یا اس سے کم باقی ہو۔ پورٹل بند ہونے پر بھی فون تک پہنچنے والی یاد دہانی کے لیے «کیلنڈر کے لیے تمام تاریخیں» ڈاؤن لوڈ کریں اور اسے آؤٹ لک میں کھولیں۔
- ٹینڈر کے کارڈ کے اندر تاریخوں کی لکیر میں اب دونوں نئی اندرونی تاریخیں بھی شامل ہیں، اور جو گزر جائے وہ سرخ رنگ میں دکھائی دیتی ہے۔

</div>
</details>


## v9.72 — 2026-11-20

- زر «تحميل البرنامج» في صفحة محلل المناقصات صار يفتح ملف الإصدار 3.6: مع كل دراسة ملف «مرجع السوق» بالمنافسات المشابهة المرساة على اعتماد (الفائز، قيمة الترسية، عدد العروض، أقل عرض مطابق فنيًا)، وإيميل الإدارة يحمل مواعيد التسليم الداخلي للرياض.
- صفحة دليل المحلل صارت تقول أين تُدرس المستندات بدقة (على الجهاز، أو سحابة أولاما، أو خدمة كلود بمفتاحك)، وتشرح خطوة «سجّل وادرس» الواحدة.

<details><summary>English</summary>

- The «Download the program» button on the Tender Analyzer page now opens the file of version 3.6: every study comes with a «Market reference» file of similar tenders awarded on Etimad (the winner, the award value, the number of offers, the lowest technically compliant offer), and the email to management carries head office's internal hand-over deadlines.
- The Analyzer's guide page now says precisely where the documents are studied (on the computer, on Ollama cloud, or on the Claude service with your own key), and explains the single «register and study» step.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- ٹینڈر تجزیہ کار کے صفحے پر «پروگرام ڈاؤن لوڈ کریں» کا بٹن اب ورژن 3.6 کی فائل کھولتا ہے: ہر مطالعے کے ساتھ «مارکیٹ حوالہ» کی فائل آتی ہے جس میں اعتماد پر ایوارڈ ہونے والے ملتے جلتے ٹینڈر ہوتے ہیں (جیتنے والا، ایوارڈ کی رقم، پیشکشوں کی تعداد، فنی طور پر مطابق سب سے کم پیشکش)، اور انتظامیہ کی ای میل میں ریاض کو حوالگی کی اندرونی تاریخیں شامل ہوتی ہیں۔
- تجزیہ کار کی رہنمائی کا صفحہ اب ٹھیک ٹھیک بتاتا ہے کہ دستاویزات کا مطالعہ کہاں ہوتا ہے (کمپیوٹر پر، اولاما کلاؤڈ پر، یا آپ کی اپنی کلید کے ساتھ کلاڈ سروس پر)، اور «اندراج اور مطالعہ» کے ایک ہی قدم کی وضاحت کرتا ہے۔

</div>
</details>


## v9.71 — 2026-11-20

- خطوة واحدة من الإيميل إلى الدراسة: في سجل المناقصات خانة جديدة «ادرس كل مناقصة جديدة بالمحلل فور تسجيلها». فعّلها والمحلل مفتوح، ثم أسقط إيميل المناقصة: تُسجَّل، وتذهب مستنداتها إلى محلل المناقصات على جهازك، وترجع الدراسة والاستفسارات والمواعيد إلى بطاقتها دون ضغطة أخرى.
- الخانة تقول أين يُدرس نص المستندات وقت تفعيلها. وإن تغيّر المكان بعدها (مثلًا شُغّلت «سحابة أولاما» في المحلل) لا تبدأ دراسة وحدها، وتخبرك الصفحة لتوافق من جديد.
- بطاقة المحلل صارت تقول الحقيقة أيضًا حين يعمل المحلل على «عندي اشتراك»: نص المستندات يذهب إلى خدمة كلود بمفتاحك، والملف الذي عليه تصنيف أمني لا يُرسل أبدًا.

<details><summary>English</summary>

- One step from the email to the study: the tender register has a new box, «Study every new tender with the Analyzer as soon as it is registered». Turn it on while the Analyzer is open, then drop the tender's email: it is registered, its documents go to the Tender Analyzer on your computer, and the study, the inquiries and the dates come back to its card without another click.
- The box says where the text of the documents is studied at the moment you turn it on. If that place changes afterwards (for example «Ollama cloud» is switched on in the Analyzer), no study starts by itself, and the page tells you so that you can agree again.
- The Analyzer's card now also tells the truth when the Analyzer runs on «I have a subscription»: the text of the documents goes to the Claude service with your own key, and a file that carries a security marking is never sent.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- ای میل سے مطالعے تک ایک ہی قدم: ٹینڈر رجسٹر میں ایک نیا خانہ ہے، «ہر نئے ٹینڈر کا اندراج ہوتے ہی تجزیہ کار سے مطالعہ کریں»۔ اسے اس وقت فعال کریں جب تجزیہ کار کھلا ہو، پھر ٹینڈر کی ای میل چھوڑیں: اس کا اندراج ہو جاتا ہے، اس کی دستاویزات آپ کے کمپیوٹر پر موجود ٹینڈر تجزیہ کار کو جاتی ہیں، اور مطالعہ، استفسارات اور تاریخیں کسی اور کلک کے بغیر اس کے کارڈ پر واپس آ جاتی ہیں۔
- یہ خانہ بتاتا ہے کہ اسے فعال کرتے وقت دستاویزات کے متن کا مطالعہ کہاں ہوتا ہے۔ اگر بعد میں وہ جگہ بدل جائے (مثلاً تجزیہ کار میں «اولاما کلاؤڈ» چلا دیا جائے) تو کوئی مطالعہ خود بخود شروع نہیں ہوتا، اور صفحہ آپ کو بتا دیتا ہے تاکہ آپ دوبارہ اتفاق کر سکیں۔
- تجزیہ کار کا کارڈ اب اس وقت بھی سچ بتاتا ہے جب تجزیہ کار «میرے پاس سبسکرپشن ہے» پر چل رہا ہو: دستاویزات کا متن آپ کی اپنی کلید کے ساتھ کلاڈ سروس کو جاتا ہے، اور جس فائل پر حفاظتی درجہ بندی ہو وہ کبھی نہیں بھیجی جاتی۔

</div>
</details>


## v9.70 — 2026-11-18

- زر «تحميل البرنامج» في صفحة محلل المناقصات صار يفتح ملف الإصدار 3.4، وفيه مفتاح «سحابة أولاما» المجاني (دراسة في دقائق بلا مفتاح وبلا اشتراك) ومفتاح «نموذج سريع»، وقراءة أسرع للمنافسة على الجهاز.

<details><summary>English</summary>

- The «Download the program» button on the Tender Analyzer page now opens the file of version 3.4, which has the free «Ollama cloud» switch (a study in minutes with no key and no subscription), the «Fast model» switch, and faster reading of the tender on the computer.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- ٹینڈر تجزیہ کار کے صفحے پر «پروگرام ڈاؤن لوڈ کریں» کا بٹن اب ورژن 3.4 کی فائل کھولتا ہے، جس میں مفت «اولاما کلاؤڈ» کا سوئچ ہے (چند منٹ میں مطالعہ، بغیر کسی کلید اور بغیر سبسکرپشن کے)، «تیز ماڈل» کا سوئچ ہے، اور کمپیوٹر پر ٹینڈر کو پڑھنا پہلے سے تیز ہے۔

</div>
</details>


## v9.69 — 2026-11-18

- بطاقة «ادرسها بالمحلل» صارت تقول أين تجري الدراسة: إن كان محلل المناقصات (الإصدار 3.4 أو أحدث) يعمل على «سحابة أولاما» ظهر تحت الزر تنبيه واضح بأن نص المستندات يُرسل إلى خوادم أولاما، وأن الملف الذي عليه تصنيف أمني يُدرس على الجهاز ولا يُرسل، وكيف تُبقي كل شيء على الجهاز.
- الملاحظة العادية تحت زر المحلل صارت تعد بما تفعله البوابة نفسها فقط: ترسل الملفات إلى المحلل على هذا الجهاز ولا ترسلها إلى أي مكان آخر.

<details><summary>English</summary>

- The «Study it with the Analyzer» card now says where the study runs: if the Tender Analyzer (version 3.4 or later) is running on «Ollama cloud», a clear notice appears under the button saying that the text of the documents is sent to Ollama's servers, that a file with a security marking is studied on the computer and is not sent, and how to keep everything on the computer.
- The plain note under the Analyzer's button now promises only what the portal itself does: it sends the files to the Analyzer on this computer and sends them nowhere else.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- «تجزیہ کار سے مطالعہ کریں» والا کارڈ اب بتاتا ہے کہ مطالعہ کہاں ہو رہا ہے: اگر ٹینڈر تجزیہ کار (ورژن 3.4 یا اس کے بعد کا) «اولاما کلاؤڈ» پر چل رہا ہو تو بٹن کے نیچے ایک واضح تنبیہ ظاہر ہوتی ہے کہ دستاویزات کا متن اولاما کے سرورز کو بھیجا جا رہا ہے، کہ جس فائل پر حفاظتی درجہ بندی ہو اس کا مطالعہ کمپیوٹر پر ہی ہوتا ہے اور وہ نہیں بھیجی جاتی، اور سب کچھ کمپیوٹر پر کیسے رکھا جائے۔
- تجزیہ کار کے بٹن کے نیچے والا عام نوٹ اب صرف اسی بات کا وعدہ کرتا ہے جو پورٹل خود کرتا ہے: وہ فائلیں اسی کمپیوٹر پر موجود تجزیہ کار کو بھیجتا ہے اور کہیں اور نہیں بھیجتا۔

</div>
</details>


## v9.68 — 2026-11-18

- نافذة «تحليل السوق» صارت شاشة واحدة بلا صفحات: الاختيارات والأرقام ثابتة أمامك، والقائمة تتحرك داخل النافذة وتكمل وحدها كلما نزلت فيها، وزر يخفي الأرقام لتكبر القائمة.
- بجانب الفترة خانتان «من يوم» و«إلى يوم» لأي تاريخين تختارهما. الفترات الجاهزة باقية كما هي، واختيار واحدة منها يملأ الخانتين.
- كل رقم وكل اسم في تحليل السوق يُضغط فيفتح نافذة خاصة به فوق النافذة، فيها أرقامه وقائمته وزر الإكسل، وإغلاقها يعيدك إلى ما كنت فيه.
- بحث يعمل وأنت تكتب فوق كل قائمة: المنافسات باسمها أو رقمها أو الجهة أو الفائز أو النشاط، وقوائم الأسماء بالاسم. وكل نوافذ القوائم الأخرى في البوابة، مثل أرشيف المناقصات، صار فيها بحث بأي كلمة أو رقم.

<details><summary>English</summary>

- The «Market analysis» window is now one screen with no pages: the choices and the numbers stay in front of you, the list scrolls inside the window and carries on by itself as you go down it, and a button hides the numbers to give the list more room.
- Beside the period there are two fields, «From day» and «To day», for any two dates you choose. The ready periods are still there as they were, and choosing one of them fills the two fields.
- Every number and every name in the market analysis can be pressed: it opens a window of its own above the window, with its own numbers, its list and the Excel button, and closing it brings you back to where you were.
- A search that works as you type sits above every list: tenders by name, number, entity, winner or activity, and the lists of names by name. Every other list window in the portal, such as the tender archive, now has a search by any word or number.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- «مارکیٹ کا تجزیہ» کی ونڈو اب صفحات کے بغیر ایک ہی اسکرین ہے: انتخاب اور اعداد آپ کے سامنے رہتے ہیں، فہرست ونڈو کے اندر سرکتی ہے اور نیچے جاتے ہی خود آگے بڑھتی ہے، اور ایک بٹن اعداد چھپا دیتا ہے تاکہ فہرست کو زیادہ جگہ ملے۔
- مدت کے ساتھ دو خانے ہیں، «اس دن سے» اور «اس دن تک»، تاکہ آپ کوئی بھی دو تاریخیں چن سکیں۔ تیار مدتیں پہلے کی طرح موجود ہیں، اور ان میں سے کسی کو چننے پر دونوں خانے خود بھر جاتے ہیں۔
- مارکیٹ کے تجزیے میں ہر عدد اور ہر نام دبایا جا سکتا ہے: اس سے ونڈو کے اوپر اس کی اپنی ونڈو کھلتی ہے جس میں اس کے اپنے اعداد، اس کی فہرست اور ایکسل کا بٹن ہوتا ہے، اور اسے بند کرنے پر آپ وہیں واپس آ جاتے ہیں جہاں تھے۔
- ہر فہرست کے اوپر ایسی تلاش ہے جو لکھتے ہی کام کرتی ہے: ٹینڈر نام، نمبر، ادارے، جیتنے والے یا سرگرمی سے، اور ناموں کی فہرستیں نام سے۔ پورٹل کی باقی تمام فہرست والی ونڈوز میں بھی، جیسے ٹینڈر آرکائیو، اب کسی بھی لفظ یا نمبر سے تلاش موجود ہے۔

</div>
</details>


## v9.67 — 2026-11-18

- زر تحميل محلل المناقصات في صفحة دليله يفتح الآن ملف الإصدار 3.1 الجديد، وهو الذي ينزّل النموذج المحلي ويثبّته وحده ويرتبط بزر التحليل في بطاقة المناقصة.

<details><summary>English</summary>

- The download button for the Tender Analyzer on its guide page now opens the new version 3.1 file, the one that downloads and installs the local model by itself and links to the analyse button in the tender card.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- ٹینڈر اینالائزر کی رہنما صفحے پر ڈاؤن لوڈ کا بٹن اب نئے ورژن 3.1 کی فائل کھولتا ہے، وہی جو مقامی ماڈل خود ڈاؤن لوڈ اور انسٹال کرتا ہے اور ٹینڈر کارڈ کے تجزیے کے بٹن سے جڑتا ہے۔

</div>
</details>


## v9.66 — 2026-11-18

- في «تحليل السوق» مجال جديد: «إنترنت الأشياء الصناعي» — سكادا وأنظمة التحكم والمراقبة عن بعد، والعدادات الذكية، وقياس مستوى الخزانات والوقود، والرصد البيئي، وإدارة الطاقة، والمدن الذكية. اختره وحده أو مع مجال أفاقي لترى من فاز بكل منافسة وبكم.
- قائمة جديدة «الخطوط» تقسم منافسات إنترنت الأشياء الصناعي على خطوطها بعددها وما رُسّي منها وقيمته، والضغط على خط يعرض منافساته. وملف الإكسل فيه عمود الخط وورقة الخطوط.

<details><summary>English</summary>

- «Market analysis» has a new field of work: «Industrial IoT» — SCADA, control and remote monitoring systems, smart meters, tank and fuel level measurement, environmental monitoring, energy management and smart-city systems. Choose it alone or together with AFAQY's field to see who won each tender and for how much.
- A new «Lines» list splits the industrial IoT tenders across their lines, with the count, the awarded ones and their value; pressing a line shows its tenders. The Excel file has a line column and a lines sheet.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- «مارکیٹ کا تجزیہ» میں کام کا ایک نیا شعبہ ہے: «صنعتی انٹرنیٹ آف تھنگز» — سکاڈا، کنٹرول اور دور سے نگرانی کے نظام، سمارٹ میٹر، ٹینکوں اور ایندھن کی سطح کی پیمائش، ماحول کی نگرانی، توانائی کا انتظام اور سمارٹ سٹی کے نظام۔ اسے اکیلا یا آفاقی کے شعبے کے ساتھ چنیں تاکہ دیکھ سکیں کہ ہر ٹینڈر کس نے اور کتنے میں جیتا۔
- «لائنیں» کی نئی فہرست صنعتی انٹرنیٹ آف تھنگز کے ٹینڈروں کو ان کی لائنوں میں بانٹتی ہے، تعداد، دیے گئے ٹینڈر اور ان کی مالیت کے ساتھ؛ کسی لائن کو دبانے سے اس کے ٹینڈر دکھتے ہیں۔ ایکسل فائل میں لائن کا کالم اور لائنوں کی شیٹ ہے۔

</div>
</details>


## v9.65 — 2026-11-17

- رفع سحب جديد من اعتماد يكتب على المحفوظ ولا يحلّ محله: المنافسات الجديدة تُضاف، والموجودة تُحدَّث بما في القراءة الأحدث، ولا يُحذف شيء مما كان محفوظًا، والخانة الفارغة في السحب الجديد لا تمسح قيمة معروفة.
- رسالة الرفع تقول الآن كم منافسة أُضيفت وكم حُدّثت وكم صار المحفوظ. وملف قديم يُرفع بعد ملف أحدث لا يرجع بالبيانات إلى الوراء.

<details><summary>English</summary>

- Uploading a new Etimad pull writes onto what is kept and does not take its place: new tenders are added, the ones already there are updated with what the later reading holds, nothing that was kept is removed, and an empty field in the new pull never erases a known value.
- The upload message now says how many tenders were added, how many were updated and how many are kept. An old file uploaded after a newer one does not take the data back in time.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- اعتماد کا نیا ڈیٹا اپ لوڈ کرنے پر وہ محفوظ شدہ ڈیٹا کے اوپر لکھا جاتا ہے، اس کی جگہ نہیں لیتا: نئے ٹینڈر شامل ہوتے ہیں، موجود ٹینڈر تازہ تر مطالعے کے مطابق تازہ ہوتے ہیں، پہلے سے محفوظ کوئی چیز نہیں ہٹتی، اور نئے ڈیٹا کا خالی خانہ کسی معلوم قدر کو نہیں مٹاتا۔
- اپ لوڈ کا پیغام اب بتاتا ہے کہ کتنے ٹینڈر شامل ہوئے، کتنے تازہ ہوئے اور اب کتنے محفوظ ہیں۔ نئی فائل کے بعد اپ لوڈ کی گئی پرانی فائل معلومات کو پیچھے نہیں لے جاتی۔

</div>
</details>


## v9.64 — 2026-11-17

- جديد في بطاقة كل مناقصة: زر «🧠 ادرسها بالمحلل». يرسل ملفات المناقصة إلى برنامج محلل المناقصات على جهازك، فيدرسها النموذج المجاني بلا مفتاح خدمة ولا اشتراك، ثم ترجع ملفات الدراسة إلى البطاقة وحدها وتُملأ خاناتها.
- لا يخرج أي ملف من جهازك. إن كان البرنامج مغلقًا يفتحه الزر، وإن لم يكن مثبّتًا تدلّك البطاقة على تنزيله وتثبيته مرة واحدة. ويمكنك إغلاق الصفحة أثناء الدراسة ثم العودة لاستلام الملفات.
- صفحة «محلل المناقصات — تحميل ودليل» حُدّثت للإصدار ٣ من البرنامج: بلا مفتاح خدمة، وبنموذج مجاني يُنزَّل ويُثبَّت وحده، وبخطوات الربط مع البوابة.

<details><summary>English</summary>

- New on every tender's card: a «🧠 Study it with the Analyzer» button. It sends the tender's files to the Tender Analyzer program on your computer, the free model studies them with no service key and no subscription, then the study's files come back to the card by themselves and fill its fields.
- No file leaves your computer. If the program is closed the button opens it, and if it is not installed the card points you to downloading and installing it once. You may close the page while the study runs, then come back to collect the files.
- The page «Tender Analyzer — download and manual» was updated for version 3 of the program: no service key, a free model that downloads and installs by itself, and the steps of the link with the portal.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- ہر ٹینڈر کے کارڈ پر نیا: «🧠 تجزیہ کار سے مطالعہ کریں» کا بٹن۔ یہ ٹینڈر کی فائلیں آپ کے کمپیوٹر پر موجود ٹینڈر تجزیہ کار پروگرام کو بھیجتا ہے، مفت ماڈل کسی سروس کلید یا سبسکرپشن کے بغیر ان کا مطالعہ کرتا ہے، پھر مطالعے کی فائلیں خود بخود کارڈ پر واپس آتی ہیں اور اس کے خانے بھر دیتی ہیں۔
- کوئی فائل آپ کے کمپیوٹر سے باہر نہیں جاتی۔ اگر پروگرام بند ہو تو بٹن اسے کھول دیتا ہے، اور اگر انسٹال نہ ہو تو کارڈ اسے ایک بار ڈاؤن لوڈ اور انسٹال کرنے کی رہنمائی کرتا ہے۔ مطالعے کے دوران آپ صفحہ بند کر سکتے ہیں، پھر واپس آ کر فائلیں وصول کر سکتے ہیں۔
- صفحہ «ٹینڈر تجزیہ کار — ڈاؤن لوڈ اور گائیڈ» پروگرام کے ورژن 3 کے مطابق تازہ کیا گیا: سروس کلید کے بغیر، ایک مفت ماڈل جو خود ڈاؤن لوڈ اور انسٹال ہوتا ہے، اور پورٹل کے ساتھ ربط کے مراحل۔

</div>
</details>


## v9.63 — 2026-11-17

- جديد في سجل المناقصات: زر «📊 تحليل السوق» بجانب رادار اعتماد. يفتح نافذة تقرأ سحب اعتماد كله لكل المجالات، وتختار فيها الفترة (آخر ثلاثة أو ستة أشهر، السنة الحالية، سنة كاملة، ربع سنة، أو فترة تحددها) والمجال والمنطقة والحالة، فتظهر لوحة بعدد المنافسات المنشورة والمرسّاة ومجموع قيم الترسية والشركات الفائزة والجهات، ومعها القوائم كاملة: المنافسات، والشركات الفائزة، والجهات، والأنشطة، والمتقدمون، وعروض أفاقي.
- اضغط اسم أي شركة أو جهة في القوائم لتعرض منافساتها وحدها، وزر الإكسل ينزّل القائمة المعروضة أو كل القوائم بنفس الاختيار الذي عملته. المبالغ هي ما نشرته اعتماد فقط، والنافذة تقول على كم منافسة بُنيت.
- الرادار يحتفظ الآن بكل ما في ملف السحب وليس بمجال أفاقي وحده، حتى تكون دراسة السوق كاملة. وما زال السحب لا يغيّر بيانات أي مناقصة في السجل.

<details><summary>English</summary>

- New in the tender register: a «📊 Market analysis» button beside the Etimad radar. It opens a window that reads the whole Etimad pull, across every field of work. Choose the period (the last three or six months, this year, a whole year, a quarter, or a period you set), the field of work, the region and the status, and a dashboard shows how many tenders were published and awarded, the total award value, the winning companies and the entities, together with the complete lists: tenders, winning companies, entities, activities, bidders and AFAQY's bids.
- Press the name of any company or entity in the lists to show its tenders on their own. The Excel button downloads the list shown, or every list, with the same choice you made. The amounts are only what Etimad published, and the window says how many tenders they rest on.
- The radar now keeps everything in the pull file, not only AFAQY's field of work, so the market study is complete. The pull still changes no tender in the register.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- ٹینڈر رجسٹر میں نیا: اعتماد ریڈار کے ساتھ «📊 مارکیٹ کا تجزیہ» کا بٹن۔ یہ ایک ونڈو کھولتا ہے جو اعتماد کا پورا ڈیٹا، کام کے ہر شعبے کے لیے، پڑھتی ہے۔ مدت (پچھلے تین یا چھ مہینے، یہ سال، پورا ایک سال، ایک سہ ماہی، یا اپنی مقرر کردہ مدت)، کام کا شعبہ، علاقہ اور حالت منتخب کریں، تو ایک ڈیش بورڈ دکھاتا ہے کہ کتنے ٹینڈر شائع ہوئے اور کتنوں کا ایوارڈ ہوا، ایوارڈ کی کل مالیت، جیتنے والی کمپنیاں اور ادارے، اور ساتھ مکمل فہرستیں: ٹینڈر، جیتنے والی کمپنیاں، ادارے، سرگرمیاں، بولی دہندگان اور آفاقی کی بولیاں۔
- فہرستوں میں کسی بھی کمپنی یا ادارے کے نام کو دبائیں تاکہ صرف اسی کے ٹینڈر دکھائی دیں۔ ایکسل کا بٹن دکھائی گئی فہرست، یا تمام فہرستیں، اسی انتخاب کے ساتھ ڈاؤن لوڈ کرتا ہے جو آپ نے کیا۔ رقوم صرف وہی ہیں جو اعتماد نے شائع کیں، اور ونڈو بتاتی ہے کہ وہ کتنے ٹینڈروں پر مبنی ہیں۔
- ریڈار اب ڈیٹا فائل میں موجود سب کچھ رکھتا ہے، صرف آفاقی کا شعبہ نہیں، تاکہ مارکیٹ کا مطالعہ مکمل ہو۔ ڈیٹا اب بھی رجسٹر کے کسی ٹینڈر کو نہیں بدلتا۔

</div>
</details>


## v9.62 — 2026-11-17

- سحب اعتماد صار دراسة للسوق فقط، تُحدَّث كل ثلاثة أو ستة أشهر: لا يغيّر موعدًا ولا سعر كراسة في أي مناقصة. مرجع كل مناقصة ملفات الإيميل ودراسة المحلل وما تكتبه بيدك.
- إذا كان في السحب موعد أو سعر مختلف عن السجل، أو موجود والسجل فاضي، تذكره بطاقة المناقصة ملاحظةً بتاريخ السحب ولا تغيّر شيئًا.
- ما كان سحب اعتماد قد غيّره في النسختين السابقتين يرجع وحده إلى قيمة الإيميل أو الدراسة عند فتح البوابة، ويُكتب ذلك في سجل المناقصة.
- المنافسة التي تتابعها من الرادار تبدأ بما في السحب، ثم تحل محله مواعيد الإيميل والدراسة حين تصل.

<details><summary>English</summary>

- The Etimad pull is now a market study only, refreshed every three or six months: it changes no deadline and no booklet fee in any tender. Each tender’s reference is its mail files, the analyzer’s study and what you type.
- When the pull holds a deadline or a fee that differs from the register, or one the register lacks, the tender’s card mentions it as a note with the pull’s date and changes nothing.
- Whatever an Etimad pull changed in the two previous versions goes back by itself to the mail’s or the study’s value when the portal opens, and this is written in the tender’s history.
- A tender you follow from the radar starts with what the pull holds, and the mail’s and the study’s dates take its place when they arrive.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- اعتماد ڈیٹا اب صرف مارکیٹ کا مطالعہ ہے جو ہر تین یا چھ ماہ میں تازہ ہوتا ہے: یہ کسی ٹینڈر کی آخری تاریخ یا کتابچے کی قیمت نہیں بدلتا۔ ہر ٹینڈر کا معیار اس کی ای میل فائلیں، تجزیہ کار کا مطالعہ اور آپ کا لکھا ہوا ہے۔
- جب ڈیٹا میں رجسٹر سے مختلف آخری تاریخ یا قیمت ہو، یا ایسی ہو جو رجسٹر میں نہیں، تو ٹینڈر کا کارڈ اسے ڈیٹا کی تاریخ کے ساتھ ایک نوٹ کے طور پر ذکر کرتا ہے اور کچھ نہیں بدلتا۔
- پچھلے دو ورژنز میں اعتماد ڈیٹا نے جو کچھ بدلا تھا وہ پورٹل کھلنے پر خود بخود ای میل یا مطالعے کی قدر پر واپس آ جاتا ہے، اور یہ ٹینڈر کی تاریخ میں لکھا جاتا ہے۔
- جس ٹینڈر کی آپ ریڈار سے پیروی کریں وہ ڈیٹا کی معلومات سے شروع ہوتا ہے، اور ای میل اور مطالعے کی تاریخیں آنے پر ان کی جگہ لے لیتی ہیں۔

</div>
</details>


## v9.61 — 2026-11-17

- في بطاقة المناقصة المربوطة باعتماد طيّة جديدة «السوق والنتيجة»: العروض المنشورة لها بأسعارها وفحصها الفني وترتيب عرضنا، ومنافسات مشابهة أُعلنت ترسيتها بفائزها وقيمتها وعدد عروضها، ووسيط قيمة الترسية والأكثر فوزًا.
- إذا أعلنت اعتماد الفائز، تقول البطاقة النتيجة وتعرض تسجيلها بزر واحد مع السبب من بيانات اعتماد نفسها؛ لا يُسجَّل شيء دون ضغطتك.
- في رادار اعتماد: قسم «عروض آفاقي على اعتماد» بأسعارنا وفحصها الفني وترتيبنا والفائز، وزر «انسخ أرقام ما أتابعه» لتحديث هذه المناقصات وحدها من أداة السحب.
- المناقصة التي فزنا بها تقول في بطاقتها موعد بدء الأعمال كما تنشره اعتماد، وفيها زر «تابع التنفيذ في مشاريعي» حيث تُتابع القيمة والتحصيل والمراحل.
- زر «الأرشيف» في سجل المناقصات يجمع كل مناقصة أُغلقت بنتيجتها وسببها وقيمتها وملفاتها ورقمها على اعتماد، مع تصفية بالنتيجة والسنة وتنزيل إكسل. و«تقرير السنة» صار يبدأ بقمع: ما نُشر في نطاقنا بالمنطقة الغربية على اعتماد، وما وصل إلينا، وما قررنا فيه، وما قدّمناه، وما فزنا به.
- رادار اعتماد لا يعرض بين «المفتوحة» منافسة فات موعد تقديمها بعد السحب؛ تبقى ظاهرة تحت «الكل».

<details><summary>English</summary>

- A tender linked to Etimad has a new «Market and result» fold on its card: its published offers with their prices, technical result and our offer’s rank, and similar tenders with an announced award — winner, value, number of offers — with the median award value and who wins most.
- Once Etimad announces the winner, the card says so and offers to record it with one press, with the reason taken from Etimad’s own facts; nothing is recorded without your press.
- In the Etimad radar: a section «AFAQY’s offers on Etimad» with our prices, their technical result, our rank and the winner, and a «Copy the numbers I follow» button to refresh only those tenders from the pull tool.
- A tender we won shows on its card the work start date as Etimad publishes it, with a «Follow the execution in My projects» button, where the value, the collection and the milestones are followed.
- The «Archive» button in the tender register gathers every closed tender with its outcome, reason, value, files and Etimad number, filtered by outcome and year, with an Excel download. The «Year report» now opens with a funnel: what Etimad published within our scope in the Western Region, what reached us, what we decided on, what we submitted, and what we won.
- The Etimad radar no longer lists as «open» a tender whose submission deadline passed after the pull; it stays visible under «All of them».

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- اعتماد سے منسلک ٹینڈر کے کارڈ میں نیا حصہ «مارکیٹ اور نتیجہ»: اس کی شائع شدہ پیشکشیں ان کی قیمتوں، تکنیکی جانچ اور ہماری پیشکش کے درجے کے ساتھ، اور ملتے جلتے ٹینڈر جن کے ایوارڈ کا اعلان ہو چکا — جیتنے والا، قیمت، پیشکشوں کی تعداد — ایوارڈ کی درمیانی قیمت اور سب سے زیادہ جیتنے والوں کے ساتھ۔
- جب اعتماد جیتنے والے کا اعلان کرے تو کارڈ نتیجہ بتاتا ہے اور ایک بٹن سے اسے درج کرنے کی پیشکش کرتا ہے، وجہ اعتماد کی اپنی معلومات سے لی جاتی ہے؛ آپ کے دبائے بغیر کچھ درج نہیں ہوتا۔
- اعتماد ریڈار میں: «اعتماد پر آفاقی کی پیشکشیں» کا حصہ ہماری قیمتوں، تکنیکی جانچ، ہمارے درجے اور جیتنے والے کے ساتھ، اور «جن کی پیروی کرتا ہوں ان کے نمبر کاپی کریں» کا بٹن تاکہ ٹول صرف انہی ٹینڈروں کو تازہ کرے۔
- جو ٹینڈر ہم جیتے، اس کے کارڈ پر کام کے آغاز کی تاریخ ویسی ہی دکھائی جاتی ہے جیسی اعتماد شائع کرے، اور «میرے منصوبوں میں عمل درآمد کی پیروی کریں» کا بٹن ہے جہاں قیمت، وصولی اور مراحل کی پیروی ہوتی ہے۔
- ٹینڈر رجسٹر میں «آرکائیو» کا بٹن ہر بند ٹینڈر کو اس کے نتیجے، وجہ، قیمت، فائلوں اور اعتماد نمبر کے ساتھ جمع کرتا ہے، نتیجے اور سال کے فلٹر اور ایکسل ڈاؤن لوڈ کے ساتھ۔ اور «سال کی رپورٹ» اب ایک قیف سے شروع ہوتی ہے: مغربی علاقے میں ہمارے دائرۂ کار میں اعتماد پر کیا شائع ہوا، ہم تک کیا پہنچا، ہم نے کس پر فیصلہ کیا، کیا جمع کرایا، اور کیا جیتا۔
- اعتماد ریڈار اب ایسا ٹینڈر «کھلے» میں نہیں دکھاتا جس کی جمع کرانے کی آخری تاریخ ڈیٹا نکالنے کے بعد گزر چکی ہو؛ وہ «سب ٹینڈر» میں نظر آتا رہتا ہے۔

</div>
</details>


- جو ٹینڈر ہم جیتے، اس کے کارڈ پر کام کے آغاز کی تاریخ ویسی ہی دکھائی جاتی ہے جیسی اعتماد شائع کرے، اور «میرے منصوبوں میں عمل درآمد کی پیروی کریں» کا بٹن ہے جہاں قیمت، وصولی اور مراحل کی پیروی ہوتی ہے۔
- ٹینڈر رجسٹر میں «آرکائیو» کا بٹن ہر بند ٹینڈر کو اس کے نتیجے، وجہ، قیمت، فائلوں اور اعتماد نمبر کے ساتھ جمع کرتا ہے، نتیجے اور سال کے فلٹر اور ایکسل ڈاؤن لوڈ کے ساتھ۔ اور «سال کی رپورٹ» اب ایک قیف سے شروع ہوتی ہے: مغربی علاقے میں ہمارے دائرۂ کار میں اعتماد پر کیا شائع ہوا، ہم تک کیا پہنچا، ہم نے کس پر فیصلہ کیا، کیا جمع کرایا، اور کیا جیتا۔
## v9.60 — 2026-11-17

- رادار اعتماد في سجل المناقصات: ارفع ملف أداة سحب اعتماد (الإكسل أو ملف الرادار) فتظهر المنافسات المفتوحة في نطاق آفاقي بأقرب موعد، مع تصفية للمنطقة الغربية. «تابِعها» تضيفها إلى السجل بمواعيد المنصة، و«ليست لنا» تُخفيها.
- مواعيد المنصة وسعر الكراسة صارت تؤخذ من اعتماد: إذا عرف الرادار مناقصة في السجل ضبط موعد التقديم وساعته وآخر موعد للاستفسارات وسعر الكراسة كما على المنصة، وكتبت البطاقة ما صحّحه ومن أين جاء القديم. ما تكتبه بيدك لا يتغير.
- تحت موعد التقديم في بطاقة المناقصة يظهر مصدره: منصة اعتماد، أو دراسة المحلل من الكراسة، أو الإيميل، أو إدخال يدوي.
- تاريخ الكراسة المكتوب بالهجري يراجعه السجل بنفسه بتقويم أم القرى قبل أن يأخذه من دراسة المحلل؛ هذا ما جعل مناقصة الداش كام تظهر بموعد 19 نوفمبر بدل موعدها على المنصة.

<details><summary>English</summary>

- The Etimad radar in the tender register: upload the Etimad pull tool’s file (the Excel workbook or the radar file) to see the open tenders within AFAQY’s scope, nearest deadline first, with a Western Region filter. «Follow it» adds a tender to the register with the platform’s dates; «Not ours» hides it.
- The platform’s dates and the booklet fee now come from Etimad: when the radar knows a register tender, it sets the submission deadline and its hour, the inquiries deadline and the booklet fee as they are on the platform, and the card says what it corrected and where the old value came from. What you type yourself is never changed.
- Under the submission deadline on a tender’s card, its source is shown: the Etimad platform, the analyzer’s study of the booklet, the email, or typed by hand.
- A booklet date written in Hijri is now checked by the register itself, in the Umm al-Qura calendar, before it is taken from the analyzer’s study — this is what showed the dash-cam tender with a 19 November deadline instead of its date on the platform.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- ٹینڈر رجسٹر میں اعتماد ریڈار: اعتماد ٹول کی فائل (ایکسل یا ریڈار فائل) اپ لوڈ کریں تو آفاقی کے دائرۂ کار کے کھلے ٹینڈر قریب ترین آخری تاریخ کے ساتھ پہلے نظر آتے ہیں، مغربی علاقے کے فلٹر کے ساتھ۔ «اس کی پیروی کریں» ٹینڈر کو پلیٹ فارم کی تاریخوں کے ساتھ رجسٹر میں شامل کرتا ہے؛ «ہمارا نہیں» اسے چھپا دیتا ہے۔
- پلیٹ فارم کی تاریخیں اور کتابچے کی قیمت اب اعتماد سے لی جاتی ہیں: جب ریڈار رجسٹر کے کسی ٹینڈر کو پہچان لے تو جمع کرانے کی آخری تاریخ اور وقت، سوالات کی آخری تاریخ اور کتابچے کی قیمت پلیٹ فارم کے مطابق کر دیتا ہے، اور کارڈ بتاتا ہے کہ کیا درست ہوا اور پرانی قدر کہاں سے آئی تھی۔ جو آپ خود لکھیں وہ کبھی نہیں بدلتا۔
- ٹینڈر کارڈ میں جمع کرانے کی آخری تاریخ کے نیچے اس کا ماخذ دکھایا جاتا ہے: اعتماد پلیٹ فارم، کتابچے پر تجزیہ کار کا مطالعہ، ای میل، یا ہاتھ سے لکھا ہوا۔
- کتابچے میں ہجری میں لکھی تاریخ کو رجسٹر اب تجزیہ کار کے مطالعے سے لینے سے پہلے خود ام القریٰ کیلنڈر سے جانچتا ہے — اسی وجہ سے ڈیش کیم ٹینڈر پلیٹ فارم کی تاریخ کے بجائے 19 نومبر کی آخری تاریخ کے ساتھ نظر آ رہا تھا۔

</div>
</details>


## v9.59 — 2026-11-17

- إصلاح: الاستفسار الذي تكتبه في «الاستفسارات» كان يضيع إذا أعادت النافذة رسم نفسها قبل أن تضغط «أضف الاستفسار» (مثل انتهاء قراءة ملف في الخلفية) — الآن يبقى ما كتبته حتى تضيفه.

<details><summary>English</summary>

- Fixed: an inquiry being typed under «Inquiries» was lost if the window redrew itself before «Add the inquiry» was pressed (for example when a file finished reading in the background) — what you typed now stays until you add it.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- درستی: «سوالات» میں لکھا جا رہا سوال ضائع ہو جاتا تھا اگر «سوال شامل کریں» دبانے سے پہلے کھڑکی خود کو دوبارہ بناتی (مثلاً جب پس منظر میں کسی فائل کا پڑھنا مکمل ہوتا) — اب آپ کا لکھا ہوا شامل کرنے تک باقی رہتا ہے۔

</div>
</details>


## v9.58 — 2026-11-17

- نافذة المناقصة صارت «بطاقة» في صفحة واحدة: الجهة ورقم اعتماد والمسؤول، شريط المراحل، أربعة مربعات (موعد التقديم وما بقي عليه، موعد التسليم لفريق المنافسات، أيام العمل الكاملة المتاحة، القيمة)، كل المواعيد على خط واحد وعليه «الآن»، الخلاصة وآخر ثلاث رسائل، «الناقص» بخاناته تكتب فيها مباشرة، والملفات في سطر. وكل ما عدا ذلك في طيّات تُفتح عند الحاجة.
- موعد التسليم لفريق المنافسات صار موعدًا أساسيًّا: قبل الإغلاق بيومي عمل، بعدّ تنازلي، وتنبيه في غرفة التحكم إذا بقي عليه يوم أو فات.
- المناقصة التي تصل بمدة أقل من أسبوع عمل تُعلَّم في القائمة، وتنبّه غرفة التحكم إلى أنها تحتاج قرارًا اليوم.
- الخانات تظهر حسب المرحلة: عند الوصول بيانات الكراسة فقط، وخانات التقديم بعد التجهيز، والسبب عند الإغلاق. وأي خانة فيها قيمة تظهر دائمًا. وصور التواقيع من الإيميل مطوية معًا.
- نتيجة جديدة للمراحل: «فات موعد التقديم» بسببها.
- «الاستفسارات»: سجل لما رُفع للجهة ومتى ونص الرد، لأن الفرع لا يرى الاستفسارات على المنصة.
- «انسخ رسالة فريق المنافسات» أو «افتحها في البريد»: المواعيد، والمدة، والاستفسارات المطلوب رفعها، وما ينقصنا، ومعها اقتراح الاتفاق على جدول مختصر أو تمديد أو اعتذار إذا كانت المدة قصيرة. و«انسخ ملخص المناقصة» للصق في أي مكان.
- «تقرير السنة»: ما وصل، وما شاركنا فيه، وما قُدّم وفاز وخسر وفات، وأسباب كل ذلك، والقيمة، ومتوسط المدة، وهل وصلت العروض لفريق المنافسات في موعدها، حسب الشهر والجهة — في نافذة، وصفحة للطباعة، وإكسل.
- خانتان جديدتان: الجهة (تُملأ من دراسة المحلل إن كانت فارغة) وموقع التنفيذ، وتصدير الإكسل صار فيه الجهة وموعد التسليم وأيام العمل.

<details><summary>English</summary>

- A tender’s window is now a «card» on one page: the entity, the Etimad number and the owner; the stage strip; four tiles (the submission deadline and the time left, the hand-over date to the tenders team, the full working days available, the value); every date on one line with «Now» on it; the summary and the latest three messages; «Missing» with its fields to type into directly; and the files on one line. Everything else sits in folds that open when needed.
- The hand-over to the tenders team is now a deadline of its own: two working days before closing, with a countdown, and a control-room alert when it is a day away or already past.
- A tender that arrives with less than a working week is marked in the list, and the control room says it needs a decision today.
- Fields appear by stage: at arrival only the booklet’s facts, the submission fields once the offer is being prepared, and the reason when the tender closes. Any field that holds a value always shows. The signature pictures from the email are folded together.
- A new outcome among the stages: «Missed the deadline», with its reason.
- «Inquiries»: a record of what was raised to the entity, when, and the answer, because the branch cannot see the inquiries on the platform.
- «Copy the message to the tenders team» or «Open it in your mail»: the dates, the time given, the inquiries to raise and what we are missing, with a suggestion to agree on a short schedule, an extension or a withdrawal when the time is short. And «Copy the tender summary» to paste anywhere.
- «Year report»: what arrived, what we bid on, what was submitted, won, lost and missed, the reasons for each, the value, the average time given, and whether the offers reached the tenders team on time, by month and by entity — in a window, as a printable page, and in Excel.
- Two new fields: the entity (filled from the analyzer’s study when empty) and the site; the Excel export now carries the entity, the hand-over date and the working days.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- ٹینڈر کی کھڑکی اب ایک صفحے کا «کارڈ» ہے: ادارہ، اعتماد نمبر اور ذمہ دار؛ مراحل کی پٹی؛ چار خانے (جمع کرانے کی آخری تاریخ اور باقی وقت، ٹینڈر ٹیم کو حوالگی کی تاریخ، دستیاب پورے کاری دن، مالیت)؛ تمام تاریخیں ایک لکیر پر جس پر «ابھی» کا نشان ہے؛ خلاصہ اور تازہ ترین تین پیغام؛ «کمی» اپنے خانوں کے ساتھ جن میں سیدھا لکھا جا سکتا ہے؛ اور فائلیں ایک سطر میں۔ باقی سب کچھ تہوں میں ہے جو ضرورت پر کھلتی ہیں۔
- ٹینڈر ٹیم کو حوالگی اب اپنی الگ آخری تاریخ ہے: بند ہونے سے دو کاری دن پہلے، الٹی گنتی کے ساتھ، اور جب ایک دن رہ جائے یا گزر جائے تو کنٹرول روم میں انتباہ۔
- جو ٹینڈر ایک کاری ہفتے سے کم مدت کے ساتھ آئے وہ فہرست میں نشان زد ہوتا ہے، اور کنٹرول روم بتاتا ہے کہ اس پر آج فیصلہ درکار ہے۔
- خانے مرحلے کے مطابق دکھتے ہیں: آنے پر صرف دستاویز کی معلومات، پیشکش کی تیاری کے بعد جمع کرانے کے خانے، اور بند ہونے پر وجہ۔ جس خانے میں کوئی قیمت ہو وہ ہمیشہ دکھتا ہے۔ ای میل کی دستخطی تصاویر ایک ساتھ تہہ کی گئی ہیں۔
- مراحل میں ایک نیا نتیجہ: «آخری تاریخ گزر گئی»، اپنی وجہ کے ساتھ۔
- «سوالات»: اس کا ریکارڈ کہ ادارے کو کیا بھیجا گیا، کب، اور جواب کیا آیا، کیونکہ برانچ پلیٹ فارم پر سوالات نہیں دیکھ سکتی۔
- «ٹینڈر ٹیم کے لیے پیغام نقل کریں» یا «اسے میل میں کھولیں»: تاریخیں، دی گئی مدت، بھیجنے والے سوالات اور جو کمی ہے، اور اگر مدت کم ہو تو مختصر شیڈول، توسیع یا معذرت پر اتفاق کی تجویز۔ اور «ٹینڈر کا خلاصہ نقل کریں» کہیں بھی چسپاں کرنے کے لیے۔
- «سال کی رپورٹ»: کیا آیا، کس پر بولی دی، کیا جمع ہوا، جیتا، ہارا اور کیا رہ گیا، ہر ایک کی وجوہات، مالیت، اوسط دی گئی مدت، اور کیا پیشکشیں وقت پر ٹینڈر ٹیم تک پہنچیں، مہینے اور ادارے کے لحاظ سے — ایک کھڑکی میں، پرنٹ کے صفحے کے طور پر، اور ایکسل میں۔
- دو نئے خانے: ادارہ (اگر خالی ہو تو اینالائزر کے مطالعے سے بھرتا ہے) اور کام کی جگہ؛ ایکسل میں اب ادارہ، حوالگی کی تاریخ اور کاری دن بھی شامل ہیں۔

</div>
</details>


## v9.57 — 2026-11-17

- سجل المناقصات صار يقرأ سلسلة الإيميل نفسها: اسحب إيميل المناقصة (والأفضل آخر رد، لأنه يحمل كل ما قبله) فتظهر في نافذة المناقصة «تسلسل المراسلات» — كل رسالة بوقتها وكاتبها وخلاصة من كلامه هو، من الأقدم إلى الأحدث.
- تحت التسلسل خلاصته: عدد الرسائل والمرسلين، أول رسالة وآخر رسالة، موعد التقديم المسجل، وأيام العمل الكاملة بين أول رسالة والموعد (من الأحد إلى الخميس، دون يوم الوصول ويوم الإغلاق).
- علّم الرسالة التي سلّمت فيها العرض، فتحسب الصفحة كم سبقت الموعد أو تأخرت عنه. هذه العلامة منك أنت، والصفحة لا تخمّنها.
- «انسخ التسلسل» ينسخ التسلسل وخلاصته نصًّا جاهزًا للّصق في إيميل.
- زر «ملخص المراسلات» في الصفحة: جدول للمناقصات المعروضة التي قُرئت رسائلها — أول رسالة، الموعد وأيام العمل، عدد الرسائل وآخرها، وتسليم العرض — مع تصفية للمناقصات التي مدتها أقل من أسبوع عمل، وتنزيل إكسل.
- المناقصة التي تدخل السجل لأول مرة من رد تأخذ تاريخ أقدم رسالة في السلسلة لا تاريخ الرد، ويُكتب تحته مصدره. والمناقصة الموجودة من قبل يبقى تاريخها كما هو.
- لا شيء يُخمَّن ولا يُحفظ ما لا يلزم: الروابط وأرقام الهواتف والتواقيع لا تُحفظ، والرسالة المكررة في رد لاحق لا تتكرر، والوقت المكتوب بصيغة تحتمل قراءتين يُترك «غير مقروء». والإيميلات المحفوظة من قبل تُقرأ بزر «اقرأ التسلسل من الإيميلات المحفوظة».
- إصلاح داخلي: أحد الفحوص الآلية كان مربوطًا بتاريخ 15 نوفمبر 2026 فصار يفشل من اليوم التالي بلا أي تغيير في البوابة — صار لا يعتمد على تاريخ اليوم.

<details><summary>English</summary>

- The tender register now reads the email thread itself: drop the tender’s email (best of all the latest reply, because it carries everything before it) and the tender’s window shows «Correspondence timeline» — every message with its time, its writer and a summary in the writer’s own words, oldest first.
- Under the timeline is its summary: how many messages and writers, the first and the last message, the submission deadline on record, and the full working days between the first message and the deadline (Sunday to Thursday, without the day it arrived and the closing day).
- Mark the message in which you handed the offer over, and the page works out how long before the deadline it was sent, or how long after. That mark is yours alone; the page never guesses it.
- «Copy the timeline» copies the timeline and its summary as text ready to paste into an email.
- A «Correspondence summary» button on the page: a table of the tenders shown whose messages were read — first message, the deadline and working days, how many messages and the last, and the offer hand-over — with a filter for tenders that had less than a working week, and an Excel download.
- A tender that first enters the register through a reply takes the date of the oldest message in the thread, not the date of the reply, and its source is written under it. A tender already in the register keeps the date it has.
- Nothing is guessed and nothing unneeded is kept: links, phone numbers and signatures are not saved, a message repeated inside a later reply is not repeated, and a time written in a form with two readings is left «not readable». Emails saved earlier are read with «Read the timeline from the saved emails».
- Internal fix: one of the automatic checks was tied to the date 15 November 2026, so it began to fail the next day with no change to the portal — it no longer depends on today’s date.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- ٹینڈر رجسٹر اب ای میل کے سلسلے کو خود پڑھتا ہے: ٹینڈر کی ای میل ڈالیں (بہتر ہے کہ تازہ ترین جواب ہو، کیونکہ اس میں پہلے کے سب پیغام شامل ہوتے ہیں) تو ٹینڈر کی کھڑکی میں «خط و کتابت کی ترتیب» نظر آتی ہے — ہر پیغام اپنے وقت، لکھنے والے اور اسی کے الفاظ میں خلاصے کے ساتھ، پرانے سے نئے کی ترتیب میں۔
- ترتیب کے نیچے اس کا خلاصہ ہے: پیغامات اور لکھنے والوں کی تعداد، پہلا اور آخری پیغام، درج شدہ جمع کرانے کی آخری تاریخ، اور پہلے پیغام اور آخری تاریخ کے درمیان پورے کاری دن (اتوار سے جمعرات، آنے کے دن اور بند ہونے کے دن کے بغیر)۔
- جس پیغام میں آپ نے پیشکش حوالے کی اس پر نشان لگائیں، تو صفحہ بتاتا ہے کہ وہ آخری تاریخ سے کتنا پہلے یا کتنا بعد بھیجا گیا۔ یہ نشان صرف آپ لگاتے ہیں؛ صفحہ اس کا اندازہ نہیں لگاتا۔
- «ترتیب نقل کریں» ترتیب اور اس کا خلاصہ ایسے متن کی صورت میں نقل کرتا ہے جو ای میل میں چسپاں کیا جا سکے۔
- صفحے پر «خط و کتابت کا خلاصہ» کا بٹن: ان دکھائے گئے ٹینڈرز کی جدول جن کے پیغام پڑھے گئے — پہلا پیغام، آخری تاریخ اور کاری دن، پیغامات کی تعداد اور آخری پیغام، اور پیشکش حوالگی — ان ٹینڈرز کے فلٹر کے ساتھ جن کی مدت ایک کاری ہفتے سے کم تھی، اور ایکسل ڈاؤن لوڈ کے ساتھ۔
- جو ٹینڈر پہلی بار کسی جواب کے ذریعے رجسٹر میں آئے وہ جواب کی تاریخ کے بجائے سلسلے کے سب سے پرانے پیغام کی تاریخ لیتا ہے، اور اس کے نیچے اس کا ماخذ لکھا جاتا ہے۔ جو ٹینڈر پہلے سے رجسٹر میں ہے اس کی تاریخ وہی رہتی ہے۔
- کوئی اندازہ نہیں لگایا جاتا اور غیر ضروری چیز محفوظ نہیں کی جاتی: لنک، فون نمبر اور دستخط محفوظ نہیں ہوتے، کسی بعد کے جواب میں دہرایا گیا پیغام دوبارہ نہیں آتا، اور دو مطلب والی شکل میں لکھا وقت «پڑھا نہیں جا سکا» چھوڑ دیا جاتا ہے۔ پہلے سے محفوظ ای میلز «محفوظ ای میلز سے ترتیب پڑھیں» کے بٹن سے پڑھی جاتی ہیں۔
- اندرونی درستی: خودکار جانچوں میں سے ایک 15 نومبر 2026 کی تاریخ سے بندھی تھی، اس لیے اگلے ہی دن پورٹل میں کسی تبدیلی کے بغیر ناکام ہونے لگی — اب وہ آج کی تاریخ پر منحصر نہیں۔

</div>
</details>


## v9.56 — 2026-11-15

- إصلاح: في النوافذ الطويلة (مثل نافذة المناقصة) كان زر «التالي» و«السابق» وأرقام الصفحات لا تستجيب للضغط بالماوس، وكانت عجلة الماوس وحدها تقلّب الصفحات. الآن الأزرار تعمل، حتى لو كان في النافذة شيء يتغير باستمرار مثل إضافة تدقيق الكتابة.

<details><summary>English</summary>

- Fixed: in long windows (such as a tender’s window) «Next», «Previous» and the page numbers did not respond to a mouse click — only the mouse wheel turned the pages. The buttons now work, even when something in the window keeps changing, such as a writing-help browser extension.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- درستی: لمبی کھڑکیوں میں (جیسے ٹینڈر کی کھڑکی) «اگلا»، «پچھلا» اور صفحہ نمبر ماؤس کے کلک پر کام نہیں کرتے تھے — صرف ماؤس کا پہیہ صفحے پلٹتا تھا۔ اب یہ بٹن کام کرتے ہیں، چاہے کھڑکی میں کوئی چیز مسلسل بدل رہی ہو، جیسے لکھائی میں مدد دینے والی براؤزر ایکسٹینشن۔

</div>
</details>


## v9.55 — 2026-11-15

- سجل المناقصات صار يبدأ بما تفعله كل يوم: اسحب الإيميل أو الدراسة أو العرض النهائي، أو اضغط «أو اختر الملفات» (يعمل على الجوال). باقي طرق التسجيل ومسؤول الملف الافتراضي مطوية تحت سطر واحد، وشرح الصفحة صار سطرًا يُفتح عند الحاجة.
- إصلاح: موعد زيارة الموقع وفتح المظاريف المقروءان من كراسة مرفقة كانا يُقرآن ثم يضيعان — الآن يُحفظان في المناقصة.
- إصلاح: القيمة التقديرية وقيمة الكراسة إذا تُركتا فارغتين كانتا تتحولان إلى صفر بعد إعادة فتح الصفحة، فيختفي تنبيه «فارغ» وترفض الدراسة ملأهما — الآن الفارغ يبقى فارغًا.
- الملف له المعنى نفسه أينما أضفته: ملف الدراسة من نافذة المناقصة يملؤها، والملف المضاف أو المصنَّف «العرض النهائي» من النافذة يجعلها جاهزة (كان ذلك بالسحب فقط).
- الدراسة تُقرأ بتسامح أكثر وبلا تخمين: التاريخ والمبلغ المكتوبان نصًّا يُقبلان، وما لا يُقرأ يُترك فارغًا وتُسمّيه الصفحة لك. واستيراد الدراسة نفسها مرتين لا يكرر السطر في السجل الزمني.
- تنبيه النسخة الاحتياطية: السجل محفوظ على جهازك وحده، فإذا لم تُحفظ منه نسخة قط أو مضى أسبوع على آخر نسخة تقول الصفحة ذلك وتحفظ نسخة بضغطة. وصفحة البيانات تعرض تاريخ آخر نسخة.
- الوضع الداكن: نصوص كانت تكاد لا تُرى داخل النوافذ صارت واضحة (رقم الصفحة أسفل النافذة، الروابط بين صفحات البريد، الصفوف المتأخرة بالأحمر، أرقام خط سير المناقصات).
- الطباعة: الأقسام التي لم تصل إليها بالتمرير كانت تُطبع فارغة — الآن تُطبع كاملة.
- لمن يستخدم لوحة المفاتيح أو قارئ الشاشة: كل خانة صار لها اسم، والجداول العريضة على الجوال يمكن الوصول إليها وتمريرها من لوحة المفاتيح.
- جملة فيها اسم مناقصة عربي داخل نص إنجليزي كانت تظهر مقلوبة الترتيب — صارت تُقرأ صحيحة.
- مراجعة جودة شاملة: فحص جديد يفتح كل نوافذ البوابة بالوضعين الفاتح والداكن وباللغات الثلاث وعلى الجوال، ويعمل تلقائيًّا مع كل تعديل.

<details><summary>English</summary>

- The tender register now opens on what you do every day: drop the email, the study or the final offer, or press «Or choose the files» (this works on a phone). The other ways to register and the default file owner are folded under one line, and the page’s explanation is now a line that opens when you need it.
- Fixed: the site-visit deadline and the bid opening read from an attached booklet were worked out and then lost — they are now saved on the tender.
- Fixed: an estimated value or a booklet fee left empty turned into zero after the page was reopened, which hid the «empty» reminder and stopped the study from filling them — an empty amount now stays empty.
- A file means the same thing wherever you add it: a study workbook added from a tender’s own window fills it, and a file added or marked «final offer» in the window makes the tender ready (only a drop did that before).
- The study is read more tolerantly and still without guessing: a date and an amount written as text are accepted, and what cannot be read is left empty and named on the page. Importing the same study twice no longer repeats the line in the tender’s history.
- Backup reminder: the register lives on your device only, so when it has never been backed up, or a week has passed since the last backup, the page says so and saves one with a click. The Data page shows the date of the last backup.
- Dark mode: text that was barely visible inside windows is now clear (the page number at the foot of a window, the links between the mail pages, late rows in red, the numbers on the tender pipeline).
- Printing: sections you had not scrolled to yet were printed blank — they are now printed in full.
- For keyboard and screen-reader users: every field now has a name, and wide tables on a phone can be reached and scrolled from the keyboard.
- A sentence holding an Arabic tender name inside English text was shown back to front — it now reads correctly.
- A full quality review: a new check opens every window of the portal in light and dark mode, in the three languages and on a phone, and runs by itself with every change.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- ٹینڈر رجسٹر اب اسی کام سے کھلتا ہے جو آپ روز کرتے ہیں: ای میل، مطالعہ یا حتمی پیشکش یہاں ڈالیں، یا «یا فائلیں منتخب کریں» دبائیں (یہ فون پر بھی کام کرتا ہے)۔ اندراج کے باقی طریقے اور فائل کا طے شدہ ذمہ دار ایک سطر کے نیچے تہہ کر دیے گئے ہیں، اور صفحے کی وضاحت اب ایک سطر ہے جو ضرورت پڑنے پر کھلتی ہے۔
- درستی: منسلک دستاویز سے پڑھی گئی سائٹ وزٹ کی آخری تاریخ اور بولی کھلنے کی تاریخ نکالی جاتی تھیں مگر محفوظ نہیں ہوتی تھیں — اب وہ ٹینڈر میں محفوظ ہوتی ہیں۔
- درستی: خالی چھوڑی گئی تخمینی مالیت یا دستاویز کی فیس صفحہ دوبارہ کھلنے پر صفر بن جاتی تھی، جس سے «خالی» کی یاد دہانی چھپ جاتی اور مطالعہ انہیں بھر نہیں پاتا تھا — اب خالی رقم خالی ہی رہتی ہے۔
- فائل کا مطلب ہر جگہ ایک ہی ہے: ٹینڈر کی اپنی کھڑکی سے شامل کی گئی مطالعے کی ورک بک اسے بھرتی ہے، اور کھڑکی میں «حتمی پیشکش» کے طور پر شامل یا نشان زد کی گئی فائل ٹینڈر کو تیار کر دیتی ہے (پہلے یہ صرف فائل ڈالنے سے ہوتا تھا)۔
- مطالعہ اب زیادہ نرمی سے مگر بغیر اندازے کے پڑھا جاتا ہے: متن میں لکھی تاریخ اور رقم قبول ہوتی ہیں، اور جو پڑھا نہ جا سکے اسے خالی چھوڑ کر صفحے پر اس کا نام بتایا جاتا ہے۔ ایک ہی مطالعہ دو بار درآمد کرنے سے ٹینڈر کے تاریخچے میں سطر دہرائی نہیں جاتی۔
- بیک اپ کی یاد دہانی: رجسٹر صرف آپ کی ڈیوائس پر محفوظ ہے، اس لیے اگر کبھی بیک اپ نہیں لیا گیا یا آخری بیک اپ کو ایک ہفتہ گزر چکا ہے تو صفحہ یہ بتاتا ہے اور ایک کلک سے بیک اپ محفوظ کرتا ہے۔ ڈیٹا کا صفحہ آخری بیک اپ کی تاریخ دکھاتا ہے۔
- ڈارک موڈ: کھڑکیوں کے اندر جو متن مشکل سے نظر آتا تھا اب صاف ہے (کھڑکی کے نیچے صفحہ نمبر، میل کے صفحات کے درمیان لنک، تاخیر والی سرخ سطریں، اور ٹینڈر کے مراحل کی گنتی)۔
- پرنٹ: جن حصوں تک آپ نے ابھی سکرول نہیں کیا تھا وہ خالی چھپتے تھے — اب وہ مکمل چھپتے ہیں۔
- کی بورڈ اور اسکرین ریڈر استعمال کرنے والوں کے لیے: اب ہر خانے کا نام ہے، اور فون پر چوڑی جدولوں تک کی بورڈ سے پہنچ کر انہیں سکرول کیا جا سکتا ہے۔
- انگریزی متن کے اندر عربی نام والے ٹینڈر کا جملہ الٹی ترتیب میں دکھائی دیتا تھا — اب وہ درست پڑھا جاتا ہے۔
- معیار کا مکمل جائزہ: ایک نئی جانچ پورٹل کی ہر کھڑکی کو روشن اور ڈارک موڈ میں، تینوں زبانوں میں اور فون پر کھولتی ہے، اور ہر تبدیلی کے ساتھ خود چلتی ہے۔

</div>
</details>


## v9.54 — 2026-11-14

- سجل المناقصات: كل ما عليك صار اختياريًّا. تقفل المناقصة (فوز، خسارة، اعتذار، إلغاء) بلا ملفات عرض وبلا سبب، والخانات الفارغة تذكير فقط بلون هادئ، والمناقصة المقفولة لا تطلب شيئًا.

<details><summary>English</summary>

- Tender register: everything left to you is now optional. You close a tender (won, lost, declined, cancelled) without offer files and without a reason, empty fields are only a quiet reminder, and a closed tender asks for nothing.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- ٹینڈر رجسٹر: جو کچھ آپ کے ذمے تھا وہ اب اختیاری ہے۔ آپ ٹینڈر (جیت، ہار، معذرت، منسوخ) پیشکش کی فائلوں اور وجہ کے بغیر بند کر سکتے ہیں، خالی خانے صرف ہلکے رنگ کی یاد دہانی ہیں، اور بند ٹینڈر کچھ نہیں مانگتا۔

</div>
</details>


## v9.53 — 2026-11-14

- سجل المناقصات بأقل تدخل: اسحب أي ملف في أي مكان من الصفحة. الإيميل يسجّل المناقصة، وملف الدراسة يملأ بياناتها وينقلها إلى «قيد التحضير» أو يعتذر عنها بسبب الدراسة، والعرض النهائي يجعلها «جاهز». كل انتقال تلقائي معه زر «تراجع».
- ملف إكسل الدراسة نفسه يُقرأ إذا أضاف المحلل فيه ورقة باسم «tender-register»، ويبقى مرفقًا بمناقصته. والعرض الفني والمالي في ملف واحد صار كافيًا للانتقال إلى «جاهز».
- «مسؤول الملف الافتراضي»: اكتب اسمك مرة فيُملأ في كل مناقصة مفتوحة. والفوز والخسارة والتقديم تبقى يدوية.

<details><summary>English</summary>

- The tender register with the least touch: drop any file anywhere on the page. An email registers the tender, the study file fills its data and moves it to «In preparation» or declines it with the study’s reason, and the final offer makes it «Ready». Every automatic move comes with an «Undo» button.
- The study workbook itself is read when the analyzer adds a sheet named «tender-register» to it, and it stays attached to its tender. A technical and financial offer in one file is now enough to move to «Ready».
- «Default file owner»: type your name once and it is filled on every open tender. Won, lost and submitted stay manual.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- کم سے کم مداخلت کے ساتھ ٹینڈر رجسٹر: صفحے پر کہیں بھی کوئی بھی فائل ڈالیں۔ ای میل ٹینڈر درج کرتی ہے، مطالعے کی فائل اس کا ڈیٹا بھرتی ہے اور اسے «تیاری میں» لے جاتی ہے یا مطالعے کی وجہ کے ساتھ معذرت کر دیتی ہے، اور حتمی پیشکش اسے «تیار» کر دیتی ہے۔ ہر خودکار منتقلی کے ساتھ «واپس کریں» کا بٹن آتا ہے۔
- مطالعے کی ایکسل فائل خود پڑھی جاتی ہے جب تجزیہ کار اس میں «tender-register» نام کی شیٹ شامل کرے، اور وہ اپنے ٹینڈر کے ساتھ منسلک رہتی ہے۔ ایک ہی فائل میں تکنیکی اور مالی پیشکش اب «تیار» تک جانے کے لیے کافی ہے۔
- «فائل کا طے شدہ ذمہ دار»: اپنا نام ایک بار لکھیں تو وہ ہر کھلے ٹینڈر میں بھر جاتا ہے۔ جیت، ہار اور جمع کرانا دستی رہتے ہیں۔

</div>
</details>


## v9.52 — 2026-11-14

- سجل المناقصات: زر جديد «استيراد دراسة المحلل». محلل المناقصات يكتب ملفًا صغيرًا بجانب دراسته، والسجل يقرؤه ويملأ الخانات الفارغة: رقم اعتماد، وقيمة الكراسة، والضمان، والقيمة التقديرية، ومواعيد الاستفسارات وزيارة الموقع والتقديم وفتح العروض.
- بجانب كل خانة امتلأت «من المحلل» ومعها الصفحة والجملة التي جاءت منها. ما كتبته بيدك لا يتغير؛ والقيمة المختلفة تظهر في قائمة لتراجعها. وقرار الدراسة (ندخل / لا ندخل / يحتاج مراجعة) يظهر في نافذة المناقصة وفي ملف الإكسل.

<details><summary>English</summary>

- Tender register: a new «Import the analyzer’s study» button. The Tender Analyzer writes a small file beside its study, and the register reads it to fill the empty fields: Etimad number, booklet fee, guarantee, estimated value, and the inquiries, site-visit, submission and opening dates.
- Each filled field says «from the analyzer», with the page and sentence it came from. What you typed by hand never changes; a different value is listed for you to check. The study’s decision (bid / do not bid / needs review) shows in the tender’s window and in the Excel file.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- ٹینڈر رجسٹر: نیا بٹن «تجزیہ کار کا مطالعہ درآمد کریں»۔ ٹینڈر تجزیہ کار اپنے مطالعے کے ساتھ ایک چھوٹی فائل لکھتا ہے، اور رجسٹر اسے پڑھ کر خالی خانے بھرتا ہے: اعتماد نمبر، کتابچے کی قیمت، ضمانت، تخمینی مالیت، اور استفسارات، سائٹ کے دورے، جمع کرانے اور بولی کھلنے کی تاریخیں۔
- ہر بھرے گئے خانے کے ساتھ «تجزیہ کار سے» لکھا ہوتا ہے، اور وہ صفحہ اور جملہ جہاں سے آیا۔ جو آپ نے ہاتھ سے لکھا وہ کبھی نہیں بدلتا؛ مختلف قیمت آپ کے جائزے کے لیے فہرست میں آتی ہے۔ مطالعے کا فیصلہ (بولی دیں / نہ دیں / جائزہ درکار) ٹینڈر کی ونڈو اور ایکسل فائل میں دکھتا ہے۔

</div>
</details>


## v9.51 — 2026-11-14

- مشاريعي: تقسيم جديد أعلى كل صفحة: مناقصات وأبسيلنج (لعملاء حاليين) وغير مصنّف. التقسيم من إشارات واضحة فقط، وتختار مسار أي مشروع بنفسك من ✎ تعديل.
- زر «احذف كل المعروض» في صفحات الإيميل والعروض والمتابعة: يحذف ما تعرضه الصفحة فقط بعد التأكيد، ويحفظ قبلها ملف نسخة احتياطية ترفعه لإرجاع كل شيء. صفوف سجل المناقصات تُحذف من سجل المناقصات نفسه.

<details><summary>English</summary>

- My projects: a new split at the top of every page: tenders, upselling (existing customers) and not sorted. The split comes from clear signals only, and you choose any project’s line yourself in ✎ Edit.
- A «Delete all shown» button on the mail, bids and follow-up pages: it deletes only what the page shows, after you confirm, and first saves a backup file you can upload to put everything back. Rows from the tender register are deleted in the tender register itself.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- میرے پروجیکٹس: ہر صفحے کے اوپر نئی تقسیم: ٹینڈرز، اپ سیلنگ (موجودہ کسٹمرز) اور غیر درجہ بند۔ تقسیم صرف واضح علامات سے ہوتی ہے، اور کسی بھی پروجیکٹ کی لائن آپ خود ✎ ترمیم سے چنتے ہیں۔
- ای میل، بولیوں اور فالو اپ کے صفحات پر بٹن «دکھائے گئے سب حذف کریں»: یہ تصدیق کے بعد صرف وہی حذف کرتا ہے جو صفحہ دکھا رہا ہو، اور پہلے ایک بیک اپ فائل محفوظ کرتا ہے جسے اپ لوڈ کر کے سب واپس لایا جا سکتا ہے۔ ٹینڈر رجسٹر کی قطاریں ٹینڈر رجسٹر ہی میں حذف ہوتی ہیں۔

</div>
</details>


## v9.50 — 2026-11-14

- المهام يومًا بيوم: لآخر ٧ أيام صار يظهر عمود «بدأت بعد الحد»: كم مهمة بدأها أحد بعد الحد المسموح، من كل المهام التي عُرف وقت بدئها، ونافذة اليوم تعرض وقت البدء لكل مهمة.
- لذلك يقرأ سحب المدير سجل نشاط مهام آخر ٧ أيام من ماي أفاقي (قراءة فقط)، فيطول السحب دقيقة أو دقيقتين. إضافة المزامنة صارت 1.0.6.

<details><summary>English</summary>

- Tasks per day: for the last 7 days a «Started after the limit» column now shows how many tasks were started after the allowed time, out of those whose start is known, and the day’s window shows each task’s start time.
- For this the manager pull reads the activity log of the last 7 days’ tasks in MyAFAQY (read only), which adds a minute or two. The sync extension is now 1.0.6.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- روزانہ ٹاسک: آخری 7 دنوں کے لیے اب «حد کے بعد شروع ہوئے» کا کالم دکھاتا ہے کہ جن ٹاسکس کا شروع ہونے کا وقت معلوم ہے ان میں سے کتنے مقررہ وقت کے بعد شروع ہوئے، اور دن کی ونڈو ہر ٹاسک کا شروع ہونے کا وقت دکھاتی ہے۔
- اس کے لیے مینیجر کا پل مائی آفاقی میں آخری 7 دنوں کے ٹاسکس کا سرگرمی ریکارڈ پڑھتا ہے (صرف پڑھنا)، جس سے پل میں ایک دو منٹ بڑھ جاتے ہیں۔ ہم آہنگی کی ایکسٹینشن اب 1.0.6 ہے۔

</div>
</details>


## v9.49 — 2026-11-14

- صفحة الفريق: لوحة التعيين تبقى في الأعلى، والباقي بطاقات تفتح في نافذة: ملف الفريق، وحسابات ما بعد البيع، والمقارنة مع ماي أفاقي. تعديل الفريق يعمل داخل النافذة نفسها.
- صفحة الأوزان: الإعدادات المتقدمة صارت بطاقة تفتح في نافذة بدل قسم مطوي طويل.
- مؤشراتي: «تحديث أرقامي» و«طريقة الحساب» صارا بطاقتين. وزر «الإعداد من جديد» في الأعلى كان يفتح قسمًا فارغًا؛ صار يفتح خطوات الإعداد.

<details><summary>English</summary>

- Team page: the assignment panel stays on top, and the rest are cards that open in a window: the team file, the after-sales accounts, and the comparison with MyAFAQY. Editing the team works inside the window.
- Weights page: the advanced settings are now a card that opens in a window instead of a long fold.
- My KPIs: «Update my numbers» and «How it is calculated» are now cards. The «Set up again» button at the top used to open an empty section; it now opens the setup steps.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- ٹیم کا صفحہ: تفویض کا پینل اوپر رہتا ہے، اور باقی کارڈز ہیں جو ونڈو میں کھلتے ہیں: ٹیم فائل، آفٹر سیلز اکاؤنٹس، اور مائی آفاقی سے موازنہ۔ ٹیم میں ترمیم اسی ونڈو کے اندر ہوتی ہے۔
- اوزان کا صفحہ: تفصیلی ترتیبات اب ایک کارڈ ہیں جو ونڈو میں کھلتا ہے، لمبا تہہ شدہ حصہ نہیں۔
- میرے اشاریے: «میرے اعداد تازہ کریں» اور «حساب کا طریقہ» اب کارڈز ہیں۔ اوپر کا بٹن «دوبارہ سیٹ اپ» ایک خالی حصہ کھولتا تھا؛ اب وہ سیٹ اپ کے مراحل کھولتا ہے۔

</div>
</details>


## v9.48 — 2026-11-14

- مؤشرات الفريق: القسم الطويل «المزيد» تحت اللوحة صار بطاقات. كل بطاقة تعرض رقمها الأساسي، وبالضغط عليها يفتح القسم في نافذة بدل أن ينفرد في الصفحة وتضطر للنزول.
- التنبيه «مهام مفتوحة أكثر من ٧ أيام» وزر «تقارير الإدارة» في غرفة التحكم يفتحان الآن البطاقة المقصودة مباشرة.
- الجداول داخل النوافذ تظهر كاملة فورًا، بدل أن تبدأ باهتة وتظهر تدريجيًا.

<details><summary>English</summary>

- Team KPIs: the long «More» section under the board is now a set of cards. Each card shows its headline number, and clicking it opens the section in a window instead of unfolding it down the page.
- The control room’s «tasks open more than 7 days» alert and «Management reports» button now open the right card directly.
- Tables inside windows now show in full at once, instead of starting faded and appearing gradually.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- ٹیم کے اشاریے: بورڈ کے نیچے لمبا حصہ «مزید» اب کارڈز کا مجموعہ ہے۔ ہر کارڈ اپنا بنیادی عدد دکھاتا ہے، اور اس پر کلک کرنے سے وہ حصہ ایک ونڈو میں کھلتا ہے، صفحے میں نیچے تک نہیں پھیلتا۔
- کنٹرول روم کا انتباہ «7 دن سے زیادہ کھلے ٹاسک» اور بٹن «انتظامیہ کی رپورٹیں» اب سیدھا متعلقہ کارڈ کھولتے ہیں۔
- ونڈوز کے اندر جدول اب فوراً پورے دکھتے ہیں، دھندلے شروع ہو کر آہستہ آہستہ ظاہر نہیں ہوتے۔

</div>
</details>


## v9.47 — 2026-11-14

- سجل المناقصات: تفاصيل المناقصة تفتح الآن في نافذة فوق القائمة بدل أن تنفرد تحت الصف وتطوّل الصفحة.
- الخانات التي ما زالت تنقص في مرحلة المناقصة تُعلَّم «للتعبئة» بلون واضح، وعددها يظهر على الصف وفي أعلى النافذة، فتعرف ما عليك دون قراءة كل الخانات.
- موعد زيارة الموقع وتاريخ فتح العروض يُقرآن الآن من الإيميل والكراسة مثل موعد التقديم والاستفسارات، وبجانب كل تاريخ مقروء مصدره. ما تكتبه بيدك لا يُستبدل.
- نافذة مهام اليوم في غرفة التحكم: شريط الصفحات كان ينزل تحت حافة النافذة فلا يُرى. الآن يبقى ظاهرًا في أسفلها.

<details><summary>English</summary>

- Tender register: a tender’s details now open in a window over the list instead of unfolding under the row and making the page long.
- The fields a tender still needs at its stage are marked «to fill» in a clear colour, and their count shows on the row and at the top of the window, so you know what is yours without reading every field.
- The site-visit deadline and the bid opening date are now read from the email and the booklet like the submission and inquiries deadlines, and each date that was read says where it came from. What you type by hand is never replaced.
- The day’s tasks window in the control room: the page bar dropped below the window’s edge and could not be seen. It now stays visible at the bottom.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- ٹینڈر رجسٹر: ٹینڈر کی تفصیلات اب فہرست کے اوپر ایک ونڈو میں کھلتی ہیں، قطار کے نیچے پھیل کر صفحہ لمبا نہیں کرتیں۔
- جو خانے ٹینڈر کے مرحلے میں ابھی باقی ہیں ان پر واضح رنگ میں «بھرنا ہے» کا نشان آتا ہے، اور ان کی گنتی قطار پر اور ونڈو کے اوپر دکھتی ہے، تاکہ ہر خانہ پڑھے بغیر معلوم ہو کہ آپ کے ذمے کیا ہے۔
- سائٹ کے دورے کی آخری تاریخ اور بولی کھلنے کی تاریخ اب ای میل اور کتابچے سے اسی طرح پڑھی جاتی ہیں جیسے جمع کرانے اور استفسارات کی تاریخیں، اور ہر پڑھی گئی تاریخ کے ساتھ اس کا ماخذ لکھا ہوتا ہے۔ جو آپ ہاتھ سے لکھیں وہ کبھی نہیں بدلا جاتا۔
- کنٹرول روم میں دن کے ٹاسک کی ونڈو: صفحات کی پٹی ونڈو کے کنارے سے نیچے چلی جاتی تھی اور دکھتی نہیں تھی۔ اب وہ نیچے نظر آتی رہتی ہے۔

</div>
</details>


## v9.46 — 2026-11-14

- سجل المناقصات: عنوان المناقصة الطويل كان يخرج من خانته ويركب فوق «أول وصول». الآن ينزل على أكثر من سطر داخل خانته.

<details><summary>English</summary>

- Tender register: a long tender subject ran out of its cell and over the «First arrived» date. It now wraps onto more lines inside its own cell.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- ٹینڈر رجسٹر: لمبا ٹینڈر عنوان اپنے خانے سے نکل کر «پہلی آمد» کی تاریخ کے اوپر آ جاتا تھا۔ اب وہ اپنے ہی خانے کے اندر اگلی سطروں پر آ جاتا ہے۔

</div>
</details>


## v9.45 — 2026-11-14

- غرفة التحكم: جدول جديد «المهام يومًا بيوم»: كم مهمة وصلت كل يوم، وكم أُغلقت في اليوم نفسه أو بعده، وكم لم يبدأها أحد بعد، وكم منها تجاوز حد البدء. الحد: من الأحد إلى الخميس ساعة عمل (٩ص–٦م و٧م–١٠م)، والسبت ٣ ساعات (٩ص–٦م)، والجمعة إجازة. اضغط على اليوم لترى مهامه وتنزّلها إكسل.

<details><summary>English</summary>

- Control room: a new «Tasks per day» table: how many tasks arrived each day, how many closed the same day or later, how many nobody has started yet, and how many of those passed the start limit. The limit: Sunday to Thursday 1 working hour (09:00–18:00 and 19:00–22:00), Saturday 3 hours (09:00–18:00), Friday off. Click a day to see its tasks and export them to Excel.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- کنٹرول روم: نیا جدول «روزانہ ٹاسک»: ہر دن کتنے ٹاسک آئے، کتنے اسی دن یا بعد میں بند ہوئے، کتنے ابھی کسی نے شروع نہیں کیے، اور ان میں سے کتنے شروع کرنے کی حد سے آگے نکل گئے۔ حد: اتوار سے جمعرات ایک کام کا گھنٹہ (9 سے 6 اور 7 سے 10 بجے رات)، ہفتے کو 3 گھنٹے (9 سے 6)، جمعہ چھٹی۔ کسی دن پر کلک کریں تو اس کے ٹاسک دکھیں گے اور انہیں ایکسل میں اتار سکتے ہیں۔

</div>
</details>


## v9.44 — 2026-11-14

- صفحة الفريق: لوحة جديدة لحسابات ما بعد البيع تحت لوحة التعيين: عدد الحسابات والأجهزة، والشرائح، وكم حسابًا على كل مهندس، وكم عميلًا على كل نظام (مثل afaqy.pro أو أحد سيرفرات VSS). تُبنى من سحب المدير؛ بعد أي تعيين شغّل السحب مرة أخرى فتتحدّث.
- سحب المدير يقرأ الآن قائمتي السيرفرات في ماي أفاقي ليعرف نظام كل عميل، بدل فتح أكثر من ألفي عميل واحدًا واحدًا. إن لم تُقرأ القائمة كلها لا يظهر رقم للأنظمة. إضافة المزامنة صارت 1.0.5.

<details><summary>English</summary>

- Team page: a new after-sales accounts board under the assignment panel: accounts and devices, segments, how many accounts each engineer carries, and how many customers are on each system (for example afaqy.pro or one of the VSS servers). It is built from the manager pull; after any assignment, run the pull again and it updates.
- The manager pull now reads MyAFAQY’s two server lists to know each customer’s system, instead of opening more than two thousand customers one by one. If the list is not read to the end, no system figure is shown. The sync extension is now 1.0.5.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- ٹیم کا صفحہ: تفویض کے پینل کے نیچے آفٹر سیلز اکاؤنٹس کا نیا بورڈ: اکاؤنٹس اور ڈیوائسز، سیگمنٹس، ہر انجینئر کے پاس کتنے اکاؤنٹس ہیں، اور ہر سسٹم پر کتنے کسٹمرز ہیں (مثلاً afaqy.pro یا VSS کا کوئی سرور)۔ یہ مینیجر کے پل سے بنتا ہے؛ کسی بھی تفویض کے بعد پل دوبارہ چلائیں تو یہ اپ ڈیٹ ہو جائے گا۔
- مینیجر کا پل اب مائی آفاقی کی سرورز کی دو فہرستیں پڑھتا ہے تاکہ ہر کسٹمر کا سسٹم معلوم ہو، بجائے دو ہزار سے زیادہ کسٹمرز کو ایک ایک کر کے کھولنے کے۔ اگر فہرست آخر تک نہ پڑھی جائے تو سسٹمز کا کوئی عدد نہیں دکھایا جاتا۔ ہم آہنگی کی ایکسٹینشن اب 1.0.5 ہے۔

</div>
</details>


## v9.43 — 2026-11-14

- صفحة الأوزان: اسم نوع المهمة كان يتكرر مرتين في كل صف ويجبرك على التمرير يمينًا ويسارًا. الآن يظهر مرة واحدة بلغتك، والجداول كلها — البسيطة والمتقدمة — تبقى داخل الشاشة على الكمبيوتر والجوال.
- صفحة الفريق: من حالته في ماي أفاقي «On Leave» كان يُكتب عنه «غير نشط» كأنه ترك العمل. الآن يبقى من الفريق ويُذكر أنه في إجازة، ولا يُنبَّه إلا على من حالته تقول إنه لم يعد على رأس العمل، مع ذكر الحالة كما هي في ماي أفاقي.

<details><summary>English</summary>

- Weights page: each task type’s name was printed twice in every row and forced you to scroll sideways. It now appears once, in your language, and every table — the simple ones and the advanced ones — stays inside the screen on a computer and on a phone.
- Team page: a person whose status in MyAFAQY is «On Leave» was described as «inactive», as if he had left. He now stays on the team and is shown as on leave; only a status that says someone is no longer at work is flagged, quoting the status exactly as MyAFAQY writes it.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- اوزان کا صفحہ: ہر قطار میں ٹاسک کی قسم کا نام دو بار لکھا آتا تھا اور آپ کو دائیں بائیں اسکرول کرنا پڑتا تھا۔ اب نام ایک بار، آپ کی زبان میں آتا ہے، اور تمام جدول — سادہ بھی اور تفصیلی بھی — کمپیوٹر اور موبائل دونوں پر اسکرین کے اندر رہتے ہیں۔
- ٹیم کا صفحہ: جس شخص کی حالت مائی آفاقی میں «On Leave» تھی اسے «غیر فعال» لکھا جاتا تھا، گویا وہ کام چھوڑ گیا ہو۔ اب وہ ٹیم میں رہتا ہے اور چھٹی پر دکھایا جاتا ہے؛ صرف وہ حالت نمایاں ہوتی ہے جو بتائے کہ کوئی اب کام پر نہیں، اور حالت ویسے ہی لکھی جاتی ہے جیسے مائی آفاقی میں ہے۔

</div>
</details>


## v9.42 — 2026-11-14

- لوحة التعيين في ماي أفاقي كانت بتعدّ نفس الحساب كذا مرة (١٠٠٠٥ حساب بدل ٢٢٠١). دلوقتي كل حساب بيتعدّ مرة واحدة، وأرقام كل مهندس بقت صحيحة.
- بعد التجربة اللوحة بتكتب رد ماي أفاقي على كل حساب ومين اتضاف ومين اتشال بالاسم. لو حد اتشال من غير ما تعلّم عليه، «تطبيق على الباقي» بيتقفل. ولو ماي أفاقي رفض خمس حسابات ورا بعض بتوقف بدل ما تبعت الكل.
- لو الرد «not found»: علّم على اللي مشيوا (زي محمد إسماعيل) في قسم الإزالة وجرّب تاني. اسحب زرار اللوحة لشريط الإشارات من جديد علشان تاخد النسخة دي.

<details><summary>English</summary>

- The assignment panel in MyAFAQY was counting the same account several times (10,005 accounts instead of 2,201). Every account is now counted once, and each engineer’s number is right.
- After a pilot the panel writes MyAFAQY’s own reply for each account and names who was added and who was removed. If someone you did not tick was removed, «Apply to the rest» locks. If MyAFAQY refuses five accounts in a row, the panel stops instead of sending them all.
- If the reply is «not found», tick whoever left (such as an engineer who resigned) in the removal section and try again. Drag the panel button to the bookmarks bar again to get this version.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- مائی آفاقی میں تفویض کا پینل ایک ہی اکاؤنٹ کئی بار گن رہا تھا (2,201 کے بجائے 10,005 اکاؤنٹ)۔ اب ہر اکاؤنٹ ایک بار گنا جاتا ہے اور ہر انجینئر کی تعداد درست ہے۔
- آزمائش کے بعد پینل ہر اکاؤنٹ پر مائی آفاقی کا اپنا جواب لکھتا ہے اور نام سے بتاتا ہے کہ کون شامل ہوا اور کون ہٹا۔ اگر کوئی ایسا شخص ہٹ گیا جسے آپ نے نشان نہیں لگایا تو «باقی پر لاگو کریں» بند ہو جاتا ہے۔ مائی آفاقی لگاتار پانچ اکاؤنٹ رد کرے تو پینل سب بھیجنے کے بجائے رک جاتا ہے۔
- اگر جواب «not found» ہو تو جانے والوں (جیسے استعفیٰ دینے والا انجینئر) کو ہٹانے والے حصے میں نشان لگا کر دوبارہ آزمائیں۔ یہ ورژن لینے کے لیے پینل کا بٹن دوبارہ بُک مارکس بار پر گھسیٹیں۔

</div>
</details>


## v9.41 — 2026-11-14

- أي نافذة محتواها طويل بقت صفحات بدل الإسكرول: تحتها «السابق» و«التالي» وأرقام الصفحات، وعجلة الماوس أو السحب على الموبايل يقلب صفحة كاملة. مفيش صف ولا كارت بيتقطع بين صفحتين، وعنوان أعمدة الجدول بيفضل ظاهر فوق.
- النافذة القصيرة بتفضل زي ما هي. والصفحات بتتظبط لوحدها لو المحتوى زاد أو الفلتر اتغيّر، والجدول اللي كان له إسكرول لوحده جوه النافذة بقى جزء من نفس الصفحات.

<details><summary>English</summary>

- Any window with long content now opens in pages instead of a long scroll: «Previous», «Next» and page numbers sit at its foot, and the mouse wheel or a swipe on a phone turns a whole page. No row or card is cut between two pages, and a table’s column headings stay in view at the top.
- A short window stays exactly as it was. Pages are recounted by themselves when the content grows or a filter changes, and a table that used to scroll inside the window now flows into the same pages.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- لمبے مواد والی ہر ونڈو اب لمبے اسکرول کے بجائے صفحات میں کھلتی ہے: نیچے «پچھلا»، «اگلا» اور صفحات کے نمبر ہیں، اور ماؤس کا پہیہ یا موبائل پر انگلی سے کھینچنا پورا صفحہ پلٹتا ہے۔ کوئی قطار یا کارڈ دو صفحات کے درمیان نہیں کٹتا، اور جدول کے کالموں کے عنوان اوپر نظر آتے رہتے ہیں۔
- چھوٹی ونڈو بالکل پہلے جیسی رہتی ہے۔ مواد بڑھے یا فلٹر بدلے تو صفحات خود دوبارہ گنے جاتے ہیں، اور جو جدول ونڈو کے اندر الگ سے اسکرول ہوتا تھا وہ اب انہی صفحات میں شامل ہو جاتا ہے۔

</div>
</details>


## v9.40 — 2026-11-14

- متابعة المشاريع: المسؤول والخطوة القادمة والموعد والعوائق ومراحل تنفيذ موزونة مع سجل تغييرات وبدء التنفيذ بعد الفوز.
- تقارير المشاريع تتبع الفلاتر والمشاريع المختارة: Excel من ٦ صفحات وPDF وDashboard تفاعلية تعمل بلا اتصال. الترسية والتحصيل قيمتان منفصلتان.
- المتابعة محفوظة على الجهاز وتدخل في النسخة الاحتياطية. يمنع الحفظ من تبويب قديم الكتابة فوق تعديل أحدث.

<details><summary>English</summary>

- Project follow-up adds owners, next actions, deadlines, blockers and weighted milestones, with change history and execution after winning.
- Reports follow selected projects and filters: six-sheet Excel, PDF and an offline interactive dashboard. Award and collection amounts remain separate.
- Follow-up stays on the device and is included in backups. Saving from a stale tab cannot overwrite newer changes.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- منصوبوں کی پیروی میں ذمہ دار، اگلے کام، آخری تاریخ، رکاوٹیں اور وزنی مراحل شامل ہیں، ساتھ تبدیلیوں کا تاریخچہ اور جیتنے کے بعد عمل درآمد۔
- رپورٹیں منتخب منصوبوں اور فلٹر کے مطابق ہیں: چھ صفحات کا Excel، PDF اور آف لائن انٹرایکٹو ڈیش بورڈ۔ معاہدے اور وصولی کی رقوم الگ رہتی ہیں۔
- پیروی آلے پر محفوظ ہے اور بیک اپ میں شامل ہے۔ پرانے ٹیب سے محفوظ کرنے پر نئی تبدیلی مٹ نہیں سکتی۔

</div>
</details>


## v9.39 — 2026-11-13

- تحسين ثبات سجل المناقصات بعد اختبارات الاستيراد والمرفقات والمراحل والنسخ الاحتياطي. نتائج قراءة الملفات وتصنيفاتها اليدوية تبقى عند دمج نسخة أقدم.
- تظهر الرسائل المستوردة كمصدر بريد وتظهر ملفات PDF المختلطة بين نص وصور كقراءة جزئية. المقتطفات لا تضم الجملة التالية إلا إذا كانت تكملة عنوان.

<details><summary>English</summary>

- Tender Register reliability improved after import, attachment, lifecycle and backup tests. Extracted document information and manual file categories survive merging an older backup.
- Imported messages are labelled as email sources, and PDFs mixing text and image-only pages are marked as partial. Excerpts include the following line only when completing a heading.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- درآمد، منسلکات، مراحل اور بیک اپ کے امتحانات کے بعد ٹینڈر رجسٹر کا اعتبار بہتر بنایا گیا۔ پرانا بیک اپ ملانے پر فائلوں سے حاصل شدہ معلومات اور دستی قسمیں محفوظ رہتی ہیں۔
- درآمد شدہ پیغامات کا ماخذ ای میل دکھتا ہے اور متن اور تصویری صفحات والے PDF کا مطالعہ جزوی ظاہر ہوتا ہے۔ اقتباس میں اگلی سطر صرف تب شامل ہوتی ہے جب وہ عنوان کی تکمیل ہو۔

</div>
</details>


## v9.38 — 2026-11-13

- سجل المناقصات يقرأ النصوص المتاحة في ملفات الكراسة والدراسة والبنود ويعرض مقتطفات مهمة ومصدرها ومعاينة الجداول. الملفات المصورة أو المتعذرة تظل محفوظة وتظهر للمراجعة اليدوية.
- مواعيد الملفات تدخل المراجعة مع مواعيد البريد. يمكنك تعديل تصنيف المرفقات والبحث والفلترة بينها. حذف ملف يزيل معلوماته المستخرجة مع الحفاظ على المواعيد التي اخترتها يدويا.

<details><summary>English</summary>

- The Tender Register reads available text in terms, study and BOQ files, showing important source excerpts and table previews. Scanned or unreadable files remain saved and are marked for manual review.
- Document deadlines join the email date review. Change attachment categories or search and filter files. Removing a file removes its extracted evidence while keeping manually chosen dates.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- ٹینڈر رجسٹر شرائط، مطالعے اور بنود کی فائلوں کا دستیاب متن پڑھ کر اہم اصل اقتباسات اور جدولوں کا پیش منظر دکھاتا ہے۔ اسکین شدہ یا ناقابل مطالعہ فائلیں محفوظ رہتی ہیں اور دستی جائزے کے لیے واضح کی جاتی ہیں۔
- فائلوں کی تاریخیں ای میل کی تاریخوں کے ساتھ جائزے میں آتی ہیں۔ منسلکات کی قسم بدلیں یا فائلوں میں تلاش اور چھانٹی کریں۔ فائل ہٹانے سے اس کی حاصل کردہ معلومات ہٹتی ہیں جبکہ دستی منتخب تاریخیں برقرار رہتی ہیں۔

</div>
</details>


## v9.37 — 2026-11-13

- سجل المناقصات يستقبل رسائل Outlook ومرفقاتها ويقترح مواعيد التقديم والاستفسارات. أضف دراسة المناقصة والعرضين وراجع سجل النشاط من نفس الصفحة.

<details><summary>English</summary>

- The Tender Register imports Outlook messages and attachments and suggests submission and inquiry dates. Add the study and both offers and review the activity history on the same page.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- ٹینڈر رجسٹر آؤٹ لک کے پیغامات اور منسلکات درآمد کرتا ہے اور پیشکش اور سوالات کی تاریخیں تجویز کرتا ہے۔ اسی صفحے پر مطالعہ، دونوں پیشکشیں اور سرگرمیوں کی تفصیل دیکھیں۔

</div>
</details>


## v9.36 — 2026-11-13

- اللي بيسحب بحسابه من رابط المدير بيشوف في «مؤشرات الفريق» الناس اللي تحته هو بس: من قايمة الموظفين في ماي أفاقي لو السحبة فيها القايمة، وإلا من ملف الفريق. واللوحة مكتوب فيها فريق مين، وكام واحد، والقايمة جاية منين.
- لو في حد تحتك في ماي أفاقي واسمه ما اتطابقش مع حساب مهام، اسمه بيتكتب في نفس السطر بدل ما يختفي.
- تصحيح في سحب المهندس لنفسه: لو ماي أفاقي رفض قايمة البحث والتطوير للحساب، السحب بيكمل ويوصل بدل ما يقف. أعد سحب زر «مؤشراتي» لشريط الإشارات.

<details><summary>English</summary>

- Whoever pulls with his own account from the manager link now sees in «Team KPIs» only the people under him: from MyAFAQY's employees list when the pull carries it, otherwise from the team file. The board says whose team it is, how many, and where the list came from.
- If someone is under you in MyAFAQY and his name matches no task account, he is named in that same line instead of disappearing.
- A correction to the engineer's own pull: when MyAFAQY refuses the R&D queue to the account, the pull now finishes and arrives instead of stopping. Drag the «My KPIs» button to the bookmarks bar again.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- جو شخص مینیجر کے لنک سے اپنے اکاؤنٹ سے ڈیٹا حاصل کرتا ہے، وہ «ٹیم کے اشاریے» میں صرف اپنے ماتحت افراد دیکھتا ہے: مائی آفاقی کی ملازمین کی فہرست سے اگر وہ ڈیٹا میں ہو، ورنہ ٹیم فائل سے۔ بورڈ پر لکھا ہے کہ یہ کس کی ٹیم ہے، کتنے افراد ہیں اور فہرست کہاں سے آئی۔
- اگر مائی آفاقی میں آپ کے تحت کوئی ہے اور اس کا نام کسی ٹاسک اکاؤنٹ سے نہیں ملتا تو اس کا نام اسی سطر میں لکھا جاتا ہے، وہ غائب نہیں ہوتا۔
- انجینئر کے اپنے حصول میں درستی: اگر مائی آفاقی اس اکاؤنٹ کو تحقیق و ترقی کی فہرست نہ دے تو حصول رکنے کے بجائے مکمل ہو کر پہنچ جاتا ہے۔ «میرے اشاریے» کا بٹن دوبارہ بُک مارکس بار پر گھسیٹیں۔

</div>
</details>


## v9.35 — 2026-11-12

- تصحيح مهم: لما حد غير المدير يسحب بحسابه من رابط المدير (زي قائد الفريق)، «مؤشراتي» كانت بتعرض صفحة المدير. دلوقتي السحبة بتسجّل الحساب اللي سحب، والبوابة بتعرض صفحة صاحب الحساب وصلاحياته هو.
- في «البيانات المرفوعة» كل سحبة مكتوب تحتها بحساب مين. ولو رفعت ملف بإيدك وكان بحسابك، اضغط «ده حسابي» مرة واحدة.
- الإضافة بقت 1.0.4: نزّلها وحدّثها، وأعد سحب زر السحب لشريط الإشارات.

<details><summary>English</summary>

- An important correction: when someone other than the manager pulled with his own account from the manager link (a team lead, for one), «My KPIs» showed the manager's page. A pull now names the account that made it, and the portal shows that person's own page and gives him his own rights.
- In «Uploaded data» each pull says whose account made it. If you bring a file in by hand and it is from your account, press «This is my account» once.
- The extension is now 1.0.4: download and update it, and drag the pull button to the bookmarks bar again.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- اہم درستی: جب مینیجر کے علاوہ کوئی (مثلاً ٹیم لیڈ) مینیجر کے لنک سے اپنے اکاؤنٹ سے ڈیٹا حاصل کرتا تھا تو «میرے اشاریے» مینیجر کا صفحہ دکھاتا تھا۔ اب ہر حصول اپنے اکاؤنٹ کا نام درج کرتا ہے، اور پورٹل اسی شخص کا صفحہ اور اسی کے اختیارات دکھاتا ہے۔
- «اپ لوڈ شدہ ڈیٹا» میں ہر حصول کے نیچے لکھا ہے کہ کس اکاؤنٹ سے ہے۔ اگر آپ فائل ہاتھ سے لائیں اور وہ آپ کے اکاؤنٹ کی ہو تو ایک بار «یہ میرا اکاؤنٹ ہے» دبائیں۔
- ایکسٹینشن اب 1.0.4 ہے: اسے ڈاؤن لوڈ کر کے تازہ کریں، اور حصول کا بٹن دوبارہ بُک مارکس بار پر گھسیٹیں۔

</div>
</details>


## v9.34 — 2026-11-12

- صفحة المهندس بتصميم جديد: أول حاجة «المطلوب منك دلوقتي» (المهام المفتوحة)، وبعدها شهره مقابل وسيط فريقه في ٤ أرقام بأشرطة، وخطوته الجاية (المركز والفرق بالنقاط)، وتقويم الشهر: اضغط على أي يوم تشوف اللي اتقفل فيه.
- تصحيح: عمر المهمة المفتوحة بقى بيتحسب لحد تاريخ آخر تحديث للبيانات، مش لحد النهارده، والتاريخ مكتوب.

<details><summary>English</summary>

- The engineer's page in a new layout: first «Needed from you now» (his open tasks), then his month against his team's median in four numbers with bars, his next step (the rank and the gap in points), and the month as a calendar: press a day to see what was closed on it.
- A correction: an open task's age is now counted to the date of the data's last update, not to today, and that date is shown.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- انجینئر کا صفحہ نئے انداز میں: سب سے پہلے «ابھی آپ سے مطلوب» (کھلے ٹاسک)، پھر اس کا مہینہ ٹیم کے درمیانی کے مقابلے میں چار اعداد اور پٹیوں کے ساتھ، اس کا اگلا قدم (درجہ اور پوائنٹس کا فرق)، اور مہینے کا کیلنڈر: کسی دن کو دبائیں اور دیکھیں اس دن کیا بند ہوا۔
- درستی: کھلے ٹاسک کی عمر اب ڈیٹا کی آخری تازہ کاری کی تاریخ تک گنی جاتی ہے، آج تک نہیں، اور وہ تاریخ دکھائی جاتی ہے۔

</div>
</details>


## v9.33 — 2026-11-12

- صفحة المهندس: تحت كل رقم من أرقامه بقى مكتوب مكانه من وسيط فريقه (أعلى، أقل، أسرع، أبطأ) ومعاه قيمة الوسيط. الفريق هو اللي تحت نفس قائد الفريق، ومفيش اسم ولا رقم أي زميل بيتعرض.

<details><summary>English</summary>

- The engineer's page: under each of his numbers it now says where he stands against his team's median (above, below, faster, slower), with the median's value. His team is those under the same team lead; no colleague's name or own number is shown.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- انجینئر کا صفحہ: اس کے ہر عدد کے نیچے اب لکھا ہے کہ وہ اپنی ٹیم کے درمیانی کے مقابلے میں کہاں ہے (اوپر، نیچے، تیز، سست)، درمیانی قدر کے ساتھ۔ اس کی ٹیم وہ ہے جو ایک ہی ٹیم لیڈ کے تحت ہے؛ کسی ساتھی کا نام یا اپنا عدد نہیں دکھایا جاتا۔

</div>
</details>


## v9.32 — 2026-11-12

- تصحيح مهم في صفحة المهندس: الترتيب كان بيتحسب على الشهر الحالي في التقويم مش الشهر المعروض، فكان بيظهر «المركز ١» لكل الناس لو الشهر الحالي لسه ما اتسحبش. دلوقتي الترتيب للشهر اللي على الشاشة، ومكتوب اسمه.
- صفحة المهندس على الموبايل: ما بقتش أعرض من الشاشة، والمهام المفتوحة بقت قبل الرسم، وأسماء الرسم بتظهر كاملة، والتنبيهات اتقالت مرة واحدة وبكلام يناسبه.
- «قراءات الشهر»: ٣ مربعات عليها سطر بيشرح معنى الرقم، و«مفتوح» و«أكتر من ٧ أيام» بقوا عمودين، والمتأخر متعلّم.

<details><summary>English</summary>

- An important correction on the engineer's page: the rank was computed for today's calendar month, not the month on screen, so everyone read «Rank 1» whenever the current month was not pulled yet. The rank is now of the month shown, and names it.
- The engineer's page on a phone: no longer wider than the screen, open work comes before the chart, the chart's labels show in full, and notices are said once in words that fit him.
- «Monthly readings»: three tiles carry a line on what the number means; «Open» and «Over 7 days» are separate columns, and overdue is marked.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- انجینئر کے صفحے پر اہم درستی: درجہ کیلنڈر کے موجودہ مہینے کا نکالا جاتا تھا، اسکرین پر دکھائے گئے مہینے کا نہیں، اس لیے جب موجودہ مہینہ حاصل نہ ہوا ہو تو سب کو «درجہ 1» نظر آتا تھا۔ اب درجہ دکھائے گئے مہینے کا ہے اور اس کا نام لکھا ہے۔
- فون پر انجینئر کا صفحہ: اب اسکرین سے چوڑا نہیں، کھلے کام چارٹ سے پہلے ہیں، چارٹ کے نام پورے نظر آتے ہیں، اور اطلاعات ایک بار اور اس کے مطابق الفاظ میں ہیں۔
- «ماہانہ ریڈنگز»: تین خانوں پر ایک سطر بتاتی ہے کہ عدد کا مطلب کیا ہے؛ «کھلے» اور «7 دن سے زیادہ» الگ کالم ہیں اور تاخیر والے نشان زد ہیں۔

</div>
</details>


## v9.31 — 2026-11-12

- صفحة جديدة تحت المؤشرات: «قراءات الشهر» — قراءات أي شهر مسحوب بنفس تعريفات اقتراح جدة: المهام اللي وصلت واتقفلت، نسبة النوعين العامّين، مصدر الشغل، الوقت من الفتح للإغلاق، النقاط بمستوى الجهد، ومقارنة بهدف الدمام.
- الأعضاء بيظهروا بالأرقام، و«إظهار الأسماء» مقفول افتراضيًا علشان تعرضها بره الفرع. وفيها «تصدير إكسل» ومقارنة شهر بشهر.

<details><summary>English</summary>

- A new page under KPIs: «Monthly readings» — any pulled month by the definitions of the Jeddah proposal: tasks arrived and closed, the share of the two generic types, where work came from, time from open to close, points by effort tier, and the comparison with Dammam's target.
- Members are numbered, and «Show names» is off by default so the page can be shown outside the branch. It has «Export to Excel» and a month-by-month comparison.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- اشاریوں کے تحت نیا صفحہ: «ماہانہ ریڈنگز» — کوئی بھی حاصل شدہ مہینہ جدہ کی تجویز کی تعریفوں کے مطابق: آنے اور بند ہونے والے ٹاسک، دو عمومی اقسام کا حصہ، کام کہاں سے آیا، کھلنے سے بند ہونے کا وقت، محنت کی سطح کے پوائنٹس، اور دمام کے ہدف سے موازنہ۔
- اراکین نمبر سے دکھائے جاتے ہیں اور «نام دکھائیں» بطورِ طے شدہ بند ہے تاکہ صفحہ برانچ سے باہر دکھایا جا سکے۔ اس میں «ایکسل میں برآمد» اور ماہ بہ ماہ موازنہ ہے۔

</div>
</details>


## v9.30 — 2026-11-10

- السحب بقى بيشتغل لأي حساب على ماي أفاقي، مش حسابك بس: لو ماي أفاقي ما سمحش للحساب بقايمة مساعدة، السحب بيكمّل من غيرها، وبتظهر تحت بيانات الشهر في «البيانات المرفوعة» القوايم اللي اتعدّت.
- حدّث الإضافة لـ 1.0.3، واسحب زرار سحب الفريق من صفحة البيانات لشريط الإشارات تاني.

<details><summary>English</summary>

- The pull now works for any MyAFAQY account, not just the manager's: if MyAFAQY does not allow the account a supporting list, the pull carries on without it, and the month's row in «Uploaded data» names the lists it skipped.
- Update the extension to 1.0.3, and drag the team pull button from the Data page to your bookmarks bar again.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- حصول اب مائی آفاقی کے کسی بھی اکاؤنٹ سے چلتا ہے: اگر اکاؤنٹ کو کوئی معاون فہرست نہ ملے تو حصول اس کے بغیر جاری رہتا ہے، اور «اپ لوڈ شدہ ڈیٹا» میں مہینے کی سطر چھوڑی گئی فہرستیں بتاتی ہے۔
- ایکسٹینشن 1.0.3 پر اپ ڈیٹ کریں، اور ٹیم کے حصول کا بٹن ڈیٹا صفحے سے دوبارہ بُک مارکس بار میں گھسیٹیں۔

</div>
</details>


## v9.29 — 2026-11-10

- اتشال صندوق «أوتلوك» اللي كان بيطلب بيانات تطبيق أزور — الطريق ده اتلغى، والبريد بيتقرا من ملف PST. أي بيانات اتقرت قبل كده محفوظة.

<details><summary>English</summary>

- The «Outlook» box that asked for Azure app details is removed — that route was dropped, and mail is read from a PST file. Anything read before is kept.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- «آؤٹ لک» کا خانہ جو ایزور ایپ کی تفصیل مانگتا تھا ہٹا دیا گیا — وہ راستہ منسوخ ہو گیا، اور ای میل PST فائل سے پڑھی جاتی ہے۔ پہلے پڑھا گیا ڈیٹا محفوظ ہے۔

</div>
</details>


## v9.28 — 2026-11-10

- السحب من ماي أفاقي ما بقاش بيقف بخطأ HTTP 401: لو مفتاح الدخول منتهي، بيستنى لحد ما ماي أفاقي يجدده وبعدين يكمّل لوحده.
- حدّث الإضافة لـ 1.0.2 (البوابة هتديك الرابط)، واسحب أزرار ماي أفاقي من صفحة البيانات لشريط الإشارات تاني — الزرار القديم بيفضل بالكود القديم. والمهندسين يسحبوا زرار «مؤشراتي» تاني.

<details><summary>English</summary>

- Pulling from MyAFAQY no longer stops with HTTP 401: if the sign-in key has expired, the pull waits for MyAFAQY to renew it and carries on by itself.
- Update the extension to 1.0.2 (the portal gives the link), and drag the MyAFAQY buttons from the Data page to your bookmarks bar again — an old button keeps its old code. Engineers drag «My KPIs» again too.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- مائی آفاقی سے حصول اب HTTP 401 پر نہیں رکتا: سائن اِن کی کلید ختم ہو تو مائی آفاقی کے تجدید کرنے تک انتظار کر کے خود جاری رہتا ہے۔
- ایکسٹینشن 1.0.2 پر اپ ڈیٹ کریں، اور ڈیٹا صفحے سے مائی آفاقی کے بٹن دوبارہ بُک مارکس بار میں گھسیٹیں — پرانا بٹن پرانا کوڈ رکھتا ہے۔ انجینئر بھی «میرے اشاریے» دوبارہ گھسیٹیں۔

</div>
</details>


## v9.27 — 2026-11-10

- زرار «تنزيل مستخرج البريد» بقى بينزّل البرنامج على طول من البوابة نفسها — كان بيفتح صفحة على GitHub ما بتفتحش إلا لصاحب الحساب.
- الموقع بقى بينشر ملفات البوابة بس: ملفات التوثيق والاختبارات ما بقتش متاحة على العنوان العام.

<details><summary>English</summary>

- «Download the Mail Extractor» now downloads the app straight from the portal — it opened a GitHub page that only the account owner could open.
- The website now publishes the portal's own files only: the documentation and tests are no longer available on the public address.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- «میل ایکسٹریکٹر ڈاؤن لوڈ کریں» اب پروگرام سیدھا پورٹل سے ڈاؤن لوڈ کرتا ہے — پہلے یہ GitHub کا صفحہ کھولتا تھا جو صرف اکاؤنٹ کا مالک کھول سکتا تھا۔
- ویب سائٹ اب صرف پورٹل کی اپنی فائلیں شائع کرتی ہے: دستاویزات اور ٹیسٹ اب عوامی پتے پر دستیاب نہیں۔

</div>
</details>


## v9.26 — 2026-11-10

- مكتبة الإكسل اتحدثت لإصدار آمن وبقت جزء من البوابة نفسها: التصدير والاستيراد بيشتغلوا من غير إنترنت، والبوابة ما بقتش بتحمّل أي حاجة من موقع تاني.
- على الموبايل: تعريف المربع لما تلمسه بيفضل ظاهر لحد ما تلمسه تاني أو تلمس برا — كان ساعات بيختفي فورًا.
- سهولة الوصول: كل قايمة وخانة تاريخ ليها اسم لقارئ الشاشة، واسم الموظف في «مؤشرات الفريق» بقى زرار بيتفتح بالكيبورد.

<details><summary>English</summary>

- The Excel library is updated to a safe version and is now part of the portal itself: export and import work offline, and the portal no longer loads anything from another site.
- On a phone, a tile's definition now stays after you tap it until you tap it again or tap elsewhere — it could vanish at once.
- Accessibility: every dropdown and date field has a name for screen readers, and a name on «Team KPIs» is a button the keyboard can open.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- ایکسل لائبریری محفوظ ورژن پر اپ ڈیٹ ہو کر پورٹل کا حصہ بن گئی: برآمد اور درآمد آف لائن چلتے ہیں، اور پورٹل اب کسی دوسری سائٹ سے کچھ لوڈ نہیں کرتا۔
- فون پر: خانے کی تعریف ٹیپ کے بعد قائم رہتی ہے جب تک دوبارہ ٹیپ نہ کریں یا باہر ٹیپ نہ کریں۔
- رسائی: ہر فہرست اور تاریخ کے خانے کا نام ہے، اور «ٹیم اشاریے» میں نام کی بورڈ سے کھلنے والا بٹن ہے۔

</div>
</details>


## v9.25 — 2026-11-09

- علامة «?» في كل صفحة من صفحات ما بعد البيع بقت فيها «طريقة الاستخدام» خطوة بخطوة: مؤشراتي، غرفة المتابعة، مؤشرات الفريق، التطوير، ساعات العمل الإضافي، الفريق، البيانات، الأوزان، والأدوات — بالتلات لغات، وعلى رابط المهندس كمان.

<details><summary>English</summary>

- Each after-sales page's «?» now gives «How to use it», step by step: My KPIs, the control room, Team KPIs, Development, Overtime hours, Team, Data, Weights and Tools — in three languages, on the engineer's link too.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- آفٹر سیلز کے ہر صفحے کا «?» اب «استعمال کا طریقہ» قدم بہ قدم دیتا ہے — تینوں زبانوں میں، انجینئر کے لنک پر بھی۔

</div>
</details>


## v9.24 — 2026-11-09

- «حدّث دلوقتي» ما بقاش بيقف ساكت: لو ماي أفاقي محتاج تسجيل دخول، صفحة «البيانات» بتقولك سجّل في التبويب اللي اتفتح، والسحب بيبدأ لوحده أول ما تدخل. ولو فيه سحب شغال، أو السحب فشل، بيتقال بوضوح.
- إضافة المزامنة الجديدة 1.0.1: لو الإضافة اللي عندك أقدم، صفحة «البيانات» بتقولك ومعاها زرار التنزيل.

<details><summary>English</summary>

- «Update now» no longer stops in silence: if MyAFAQY needs a sign-in, «Data» tells you to sign in in the tab that opened, and the pull starts by itself once you are in. A pull already running, or a failed one, is said plainly.
- Sync extension 1.0.1: if the one in your browser is older, «Data» says so, with the download.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- «ابھی اپ ڈیٹ کریں» اب خاموشی سے نہیں رکتا: اگر مائی آفاقی کو سائن اِن چاہیے تو «ڈیٹا» بتاتا ہے، اور اندر آتے ہی حصول خود شروع ہوتا ہے۔
- ہم آہنگی ایکسٹینشن 1.0.1: پرانی ہو تو «ڈیٹا» ڈاؤن لوڈ کے ساتھ بتاتا ہے۔

</div>
</details>


## v9.23 — 2026-11-08

- مزامنة اللابتوب والموبايل: من «البيانات» ← «مزامنة أجهزتي»، اكتب كلمة سر واضغط «ابعت لجهازي التاني»، وعلى الجهاز التاني «استقبل» بنفس كلمة السر — الأرقام بتظهر على طول من غير سحب جديد. الملف مشفّر وصغير (شهر كامل حوالي ٨٠ ك.ب)، وبيتدمج من غير ما يمسح حاجة.
- الاستعادة بقت دمج حقيقي: المناقصات ونشاط البريد ومشاريعي بتتدمج حتى لو الجهاز فيه بيانات (المناقصة بتاخد المرحلة الأبعد).
- الدليل جوه البوابة فيه قسمين جداد: «مزامنة اللابتوب والموبايل» و«الكروت اللي بتفلتر».

<details><summary>English</summary>

- Sync the laptop and the phone: from «Data» → «Sync my devices», type a passphrase and press «Send to my other device»; on the other device press «Receive» with the same passphrase — the numbers show at once, no new pull. The file is encrypted and small (about 80 KB for a month), and merges without deleting anything.
- Restoring now truly merges: tenders, mail activity and my projects merge even when the device already has data (a tender keeps its further stage).
- The guide has two new sections: «Sync the laptop and the phone» and «Cards that filter».

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- لیپ ٹاپ اور فون کی ہم آہنگی: «ڈیٹا» ← «میرے آلات کی ہم آہنگی» سے پاس فریز لکھ کر «دوسرے آلے کو بھیجیں»، دوسرے آلے پر اسی پاس فریز سے «وصول کریں» — نئے حصول کے بغیر اعداد فوراً۔ فائل خفیہ اور چھوٹی ہے، اور کچھ حذف کیے بغیر ضم ہوتی ہے۔
- بحالی اب حقیقی انضمام ہے: ٹینڈر، میل سرگرمی اور میرے پروجیکٹس ضم ہوتے ہیں چاہے آلے پر ڈیٹا ہو۔
- رہنما میں دو نئے حصے: «لیپ ٹاپ اور فون کی ہم آہنگی» اور «فلٹر کرنے والے کارڈ»۔

</div>
</details>


## v9.22 — 2026-11-08

- على الموبايل، أي نافذة بقت بتملا الشاشة كلها، والخلفية ورا النوافذ بقت أغمق في كل الأجهزة — ما بقاش في كلام من الصفحة باين حوالين النافذة أو من وراها.

<details><summary>English</summary>

- On a phone every window now fills the whole screen, and the backdrop behind windows is darker on every device — no text of the page shows around or through a window any more.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- فون پر ہر ونڈو اب پوری اسکرین بھرتی ہے، اور ونڈو کے پیچھے کا پس منظر ہر آلے پر گہرا ہے — صفحے کا متن اب ونڈو کے گرد یا پیچھے نظر نہیں آتا۔

</div>
</details>


## v9.21 — 2026-11-08

- أي كارت في أي نافذة أو صفحة بقى فلتر: ضغطة أو لمسة بتعرض صفوفه بس وبيبقى أخضر، وضغطة تانية بتشيل الفلتر — في نوافذ غرفة المتابعة، وكروت سجل المناقصات، ومربعات مؤشرات الفريق. وضغطة على عمود أي موظف بتعرض شغله بس.
- كل رقم بقى في مكان واحد: اتشالت الجمل اللي كانت بتكرر المربعات في غرفة المتابعة ومؤشرات الفريق وسجل المناقصات، وبروفايل الموظف بقى المربعات والرسومات بس (وزرار ⚑ جوه كل مربع).
- رسم آخر الشهور: عدد المهام فوق ومكتوب على كل عمود، ومتوسط زمن الحل في لوحة لوحده تحت — مفيش نقطة بتتلخبط مع عمود.
- حقل «تاريخ اكتمال العرض» في سجل المناقصات كان ظاهر كود — اتصلح. والدائرة في مربع متوسط الإغلاق ما بقتش بتغطي الكلام على الموبايل.

<details><summary>English</summary>

- Every card in every window and page now filters: a click or tap shows only its rows and turns green, a second press clears it — in the control-room windows, the tender register's cards and the Team KPIs tiles. A press on a person's bar shows only their work.
- Each number now lives in one place: the sentences that repeated the tiles on the control room, Team KPIs and the tender register are gone, and a person's profile is the tiles and charts only (⚑ inside each tile).
- Recent-months chart: tasks on top with the numbers on each bar, the average time to resolve in its own strip below — no point confused with a bar.
- The «Offer ready on» field in the tender register showed a raw code — fixed. The ring on the average-to-close tile no longer covers its text on a phone.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- ہر ونڈو اور صفحے کا ہر کارڈ اب فلٹر ہے: کلک یا ٹیپ صرف اس کی قطاریں دکھاتا اور سبز ہوتا ہے، دوسرا دباؤ فلٹر ہٹاتا ہے۔
- ہر عدد اب ایک جگہ: خانوں کو دہرانے والے جملے ہٹا دیے گئے۔
- حالیہ مہینوں کا چارٹ: ٹاسک اوپر، اوسط وقت نیچے الگ پٹی میں۔
- ٹینڈر رجسٹر کا ایک خانہ کوڈ دکھا رہا تھا — درست؛ فون پر دائرہ اب متن نہیں ڈھانپتا۔

</div>
</details>


## v9.20 — 2026-11-08

- التلميحات بقت سياسة واحدة للبوابة كلها: تلميح واحد مُعتم ولونه مختلف عن الصفحة، فوق كل حاجة، جنب الحاجة اللي بيشرحها من غير ما يغطيها أو يخرج برا الشاشة — ما بقاش الكلام يطلع فوق الكلام. وعلى الموبايل لمسة بتظهر التعريف ولمسة تانية بتخفيه.
- «مشاريعي»: زرار الاستيراد بقى قايمة فيها ٤ اختيارات واضحة (سجل المشاريع، نتيجة المساعد ملف أو لصق، إكسل بعد التعديل)، وأي ملف مكانه مش هنا — زي الـ PST — بيقولك مكانه الصح.
- تعليمات «سحب جديد من البريد» اتحدثت: كراسة الشروط من أي حد حتى لو رد أو تحويل، والمناقصات اللي في السجل بتتحسب مرة واحدة، وتقدر تلزق رد المساعد لو ما حفظش ملف.

<details><summary>English</summary>

- Tooltips now follow one policy across the portal: a single opaque tooltip, clearly apart from the page, above everything, beside what it explains without covering it or leaving the screen — no more text over text. On a phone a tap shows a definition and a second tap hides it.
- «My projects»: the import button is now a menu of four clear kinds (project register, the assistant's result as a file or pasted, Excel after editing); a file that belongs elsewhere — like a PST — tells you where.
- «New pull from mail» instructions updated: the booklet counts from anyone, even on a reply or forward; tenders already in the register count once; you can paste the assistant's answer if it saved no file.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- ٹول ٹپس اب ایک پالیسی پر: ایک مبہم ٹپ، صفحے سے واضح الگ، سب سے اوپر، چیز کے ساتھ بغیر ڈھانپے۔ فون پر ٹیپ دکھاتا اور دوسرا ٹیپ چھپاتا ہے۔
- «میرے پروجیکٹس»: درآمد اب چار واضح اقسام کا مینو؛ غلط جگہ کی فائل اپنی جگہ بتاتی ہے۔
- «میل سے نیا حصول» کی ہدایات تازہ: کتابچہ کسی سے بھی، جواب یا فارورڈ میں بھی۔

</div>
</details>


## v9.19 — 2026-11-08

- تفاصيل كل موظف في «مؤشرات الفريق» و«مؤشراتي» بقت داشبورد تفاعلية: ست مربعات بمصطلحات المؤشرات (المهام المُنجزة، حجم العمل، نسبة الإغلاق، متوسط زمن الحل، النقاط الموزونة، المفتوح الآن)، كل واحد فيه التغير عن الشهر اللي قبله وخط آخر الشهور وتعريفه لما تعدّي بالماوس، وحلقة مصادر الشغل، ورسم آخر الشهور، وعمر المفتوح. والجدول لسه تحت.
- سجل المناقصات: أي إيميل فيه مرفق «كراسة الشروط» بيظهر — من شعراوي أو من أي حد، حتى لو رد أو تحويل — والمناقصة بتتحسب مرة واحدة بأول تاريخ.

<details><summary>English</summary>

- Each person's detail in «Team KPIs» and «My KPIs» is now an interactive dashboard: six tiles in KPI terms (Throughput, Workload, Closure rate, MTTR, Weighted points, Backlog), each with its change on the previous month, a recent-months line and its definition on hover, plus the work-intake ring, a recent-months chart and the age of open work. The table stays below.
- Tender register: any e-mail with a «كراسة الشروط» attachment shows — from Shaarawi or anyone, even a reply or a forward — and a tender counts once, on its first date.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- «ٹیم اشاریے» اور «میرے اشاریے» میں ہر شخص کی تفصیل اب انٹرایکٹو ڈیش بورڈ ہے: اشاریوں کی اصطلاحات میں چھ خانے، تبدیلی، رجحان اور ماؤس پر تعریف۔
- ٹینڈر رجسٹر: «كراسة الشروط» منسلک ہر ای میل ظاہر ہوتی ہے، کسی سے بھی، جواب یا فارورڈ بھی۔

</div>
</details>


## v9.18 — 2026-11-08

- ملف البريد اللي بيتقرا في المتصفح بقى بيتحفظ على جهازك وبيدخل مؤشر «نشاط البريد — صندوق المدير»، ومش هتحتاج تقراه تاني. والرسالة بتتحسب مرة واحدة سواء جت من المتصفح أو من «مستخرج البريد».
- التصنيف بقى بكلام المهندس نفسه في الرد مش بعنوان الإيميل: الرد الفني على «طلب عرض سعر» ما بقاش بيتحسب بيع إضافي.
- بحث بالاسم أو الإيميل في قايمة المرسلين مع «علّم على النتائج»، والمرسل من جوه الشركة بيظهر اسم حسابه، وجدول الرسايل بقى بيتحرك جوه صندوقه فالسكرول قريب.
- «مستخرج البريد» 1.0.4: بيقرا كلام الرد نفسه للتصنيف، وما بيسيبش ملفات .part لو اتوقف.

<details><summary>English</summary>

- A mail file read in the browser is now kept on your device and feeds «Email Activity — Manager Inbox» — no need to read it again. A message counts once whether it came from the browser or the «Mail Extractor».
- Classification now uses the engineer's own words in the reply, not the e-mail's subject: a technical reply to «quotation request» is no longer counted as upselling.
- Search the senders by name or e-mail with «Tick the matches»; internal senders show their account name; the messages table scrolls in its own box, so the sideways bar is close.
- «Mail Extractor» 1.0.4: reads the reply's own words for classification, and leaves no .part files when it stops.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- براؤزر میں پڑھی گئی میل فائل اب آپ کے آلے پر محفوظ رہتی ہے اور اشاریے میں جاتی ہے؛ پیغام ایک بار شمار ہوتا ہے۔
- زمرہ بندی اب جواب میں انجینئر کے اپنے الفاظ سے ہوتی ہے، عنوان سے نہیں۔
- نام یا ای میل سے تلاش؛ اندرونی بھیجنے والوں کا اکاؤنٹ نام؛ جدول اپنے خانے میں اسکرول ہوتا ہے۔
- «میل ایکسٹریکٹر» 1.0.4۔

</div>
</details>


## v9.17 — 2026-11-08

- أي حاجة بتتضغط بقت بتنوّر في كل الأجهزة: تحت الماوس، ولما تلمسها بصباعك على الموبايل أو شاشة اللمس، وحتى لو «إظهار الحركة» مقفول في ويندوز. وبقى ليها اختبار ثابت بيتأكد منها في كل إصدار.
- لو ملف البريد مفتوح في أوتلوك، صفحة نشاط البريد بتقولك كده صراحة وبتوريك تعمل إيه، ولأي سبب تاني بتعرض التفاصيل الفنية تنسخها.

<details><summary>English</summary>

- Everything you can press now lights on every device: under the mouse, when touched with a finger on a phone or touch screen, and even with Windows «Show animations» off — checked by a standing test in every release.
- If the mail file is open in Outlook, the Mail activity page says so plainly and shows what to do; for any other cause it shows the technical detail to copy.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- ہر دبائی جانے والی چیز اب ہر آلے پر روشن ہوتی ہے: ماؤس کے نیچے، انگلی سے چھونے پر، اور حرکت بند ہونے پر بھی — ہر ریلیز میں ٹیسٹ۔
- اگر میل فائل آؤٹ لک میں کھلی ہو تو صفحہ صاف بتاتا ہے؛ ورنہ تکنیکی تفصیل دکھاتا ہے۔

</div>
</details>


## v9.16 — 2026-11-08

- «مستخرج البريد» 1.0.3: لو ملف البريد مفتوح في أوتلوك (أوتلوك بيقفله)، البرنامج بيقولك كده بكلام واضح قبل ما يبدأ، ويوريك الطريقتين: تقفل أوتلوك أو تفصل الملف من «ملفات البيانات». ونفس التنبيه في المتصفح.

<details><summary>English</summary>

- «Mail Extractor» 1.0.3: if the mail file is open in Outlook (Outlook locks it), the app says so plainly before it starts and shows the two ways out: close Outlook, or detach the file under «Data Files». The browser says the same.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- «میل ایکسٹریکٹر» 1.0.3: اگر میل فائل آؤٹ لک میں کھلی ہے تو ایپ شروع کرنے سے پہلے صاف بتاتی ہے اور دو راستے دکھاتی ہے۔ براؤزر بھی یہی کہتا ہے۔

</div>
</details>


## v9.15 — 2026-11-08

- صفحة نشاط البريد وسجل المناقصات بقوا بيقروا ملف بريد لحد ٥ جيجا من جوه المتصفح: الملف ما بيتحمّلش كله، بيتقرا حتة حتة من الجهاز في الخلفية، والصفحة بتوريك التقدم وبتقولك اتقرا كام منه.
- «مستخرج البريد» 1.0.2: اتصلّح فتح الملفات اللي في اسمها مسافة أو اللي بيديها اختيار الملف بشرطة مايلة (زي E:/OCTOBER inbox.pst).

<details><summary>English</summary>

- The Mail activity page and the tender register now read a mail file up to 5 GB in the browser: the file is never loaded whole, it is read piece by piece from your device in the background, with live progress and how much was read.
- «Mail Extractor» 1.0.2: opening a file whose name has a space, or a path the file picker gives with forward slashes (like E:/OCTOBER inbox.pst), is fixed.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- میل سرگرمی اور ٹینڈر رجسٹر اب براؤزر میں 5 GB تک کی میل فائل پڑھتے ہیں: فائل پوری لوڈ نہیں ہوتی، پس منظر میں ٹکڑوں میں پڑھی جاتی ہے۔
- «میل ایکسٹریکٹر» 1.0.2: اسپیس یا سلیش والے راستے (جیسے E:/OCTOBER inbox.pst) کھولنا ٹھیک ہو گیا۔

</div>
</details>


## v9.14 — 2026-11-08

- لو اخترت ملف بريد أكبر من حوالي ١ جيجا في صفحة نشاط البريد، البوابة ما بتحاولش تقراه: بتعرضلك خطوات «مستخرج البريد» الأربعة وزرار التنزيل على طول، بدل رسالة الخطأ.

<details><summary>English</summary>

- If you choose a mail file over about 1 GB on the Mail activity page, the portal no longer tries to read it: it shows the four «Mail Extractor» steps and the download button at once, instead of an error.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- اگر آپ تقریباً 1 GB سے بڑی میل فائل چنیں تو پورٹل اسے پڑھنے کی کوشش نہیں کرتا: غلطی کی بجائے فوراً «میل ایکسٹریکٹر» کے چار مراحل اور ڈاؤن لوڈ بٹن دکھاتا ہے۔

</div>
</details>


## v9.13 — 2026-11-08

- «مستخرج البريد»: برنامج ويندوز بيقرا ملف بريد أوتلوك كامل مهما كان حجمه على جهازك، رسالة رسالة، من غير ما يرفع حاجة، وبيطلّع ملف صغير تستورده في صفحة نشاط البريد.
- مراجعة الهوية: الإيميل ما بيتحسبش لمهندس إلا بعد ما تأكّد انت إنه بتاعه، مرة واحدة. واستيراد نفس الفترة تاني بيحدّث من غير تكرار.
- مؤشر جديد منفصل «نشاط البريد — صندوق المدير» في مؤشرات الفريق وتفاصيل كل مهندس، بالتصنيفات والدليل وإكسل. ما بيدخلش النقاط، وأوزانه جاهزة بس مقفولة لحد اعتمادك.

<details><summary>English</summary>

- «Mail Extractor»: a Windows app that reads a whole Outlook mail file of any size on your computer, one message at a time, uploads nothing, and writes a small file you import on the Mail activity page.
- Identity review: a message counts for an engineer only once you confirm the address is theirs, once. Importing the same period again updates, never doubles.
- A new separate indicator «Email Activity — Manager Inbox» on Team KPIs and each engineer's detail, by category, with the evidence and Excel. It does not enter points; its weights are prepared but locked until you approve them.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- «میل ایکسٹریکٹر»: ونڈوز ایپ جو آپ کے کمپیوٹر پر کسی بھی سائز کی پوری آؤٹ لک میل فائل ایک ایک پیغام پڑھتی ہے، کچھ اپ لوڈ نہیں کرتی، اور ایک چھوٹی فائل بناتی ہے۔
- شناخت کا جائزہ: پیغام انجینئر کے لیے تبھی شمار ہوتا ہے جب آپ پتے کی تصدیق کریں۔ ایک ہی مدت دوبارہ درآمد کرنے سے دہرائی نہیں ہوتی۔
- نیا الگ اشاریہ «ای میل سرگرمی — مینیجر ان باکس»، زمروں، ثبوت اور ایکسل کے ساتھ۔ پوائنٹس میں شامل نہیں؛ وزن آپ کی منظوری تک مقفل۔

</div>
</details>


## v9.12 — 2026-11-08

- تصحيح: سطر «فكرة وتصميم وتطوير» في آخر كل صفحة كان بيظهر كلمة برمجية بدل الجملة — اتصلّح في اللغات التلاتة.

<details><summary>English</summary>

- Fix: the authorship line at the foot of every page showed a code word instead of its sentence — fixed in all three languages.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- درستگی: ہر صفحے کے آخر میں تصنیف کی سطر جملے کی جگہ کوڈ کا لفظ دکھاتی تھی — تینوں زبانوں میں ٹھیک۔

</div>
</details>


## v9.11 — 2026-11-08

- «نبض الفريق» في غرفة المتابعة: خط حي بيترسم بالمغلق كل يوم الشهر ده، والنهارده بينبض، والجمعة والسبت مظللين، واضغط أي يوم تشوف مهامه.
- «عن البوابة» بقت بتحكي التاريخ كامل: بدأ العمل في سبتمبر ٢٠٢٦ (الإصدارات ١ لـ٤ على فايربيز)، والبناء الحالي من v5.0.
- كل نافذة بقى فيها زرار «إغلاق» واحد بس.

<details><summary>English</summary>

- «Team pulse» on the control room: a live trace of what the team closed each day this month, today pulsing, Friday and Saturday shaded — click any day to see its tasks.
- «About» now tells the whole history: work started in September 2026 (versions 1–4 on Firebase), current build since v5.0.
- Every window has one Close button only.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- کنٹرول روم پر «ٹیم کی نبض»: اس مہینے روزانہ بند ٹاسک کی زندہ لکیر، آج دھڑکتا ہوا، جمعہ ہفتہ نمایاں؛ کسی دن پر کلک کریں۔
- «پورٹل کے بارے میں» اب پوری تاریخ بتاتا ہے: کام ستمبر 2026 میں شروع، موجودہ تعمیر v5.0 سے۔
- ہر کھڑکی میں ایک ہی «بند کریں»۔

</div>
</details>


## v9.10 — 2026-11-07

- كل سحبة من سحبات البريد التلاتة (نشاط البريد من PST، والمشاريع من البريد، وسجل المناقصات) بقى فوقها شريط بيقول: بتجاوب على إيه، وبترفعها منين، وبياناتها بتظهر فين، ومع روابط للاتنين التانيين.
- «مشاريعي» بتفتح بالمناقصات لوحدها حتى من غير سجل مشاريع.

<details><summary>English</summary>

- Each of the three mail pulls (mail activity from PST, projects from mail, the tender register) now opens with a strip: what it answers, where it goes in, where its data shows, with links to the other two.
- «My projects» opens with tenders alone, even with no projects register.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- تینوں میل پلز کے اوپر اب ایک پٹی: کیا بتاتا ہے، کہاں سے ڈالیں، کہاں دکھتا ہے، اور باقی دو کے لنک۔
- «میرے منصوبے» صرف ٹینڈرز سے بھی کھلتا ہے۔

</div>
</details>


## v9.09 — 2026-11-07

- «سجل المناقصات» بقى بيغذّي «مشاريعي»: أي مناقصة «تم التقديم» أو «فزنا» أو «خسرنا» بتتحسب هناك لوحدها، مرة واحدة، والخسارة بسببها، فنسبة الفوز بقت حقيقية.

<details><summary>English</summary>

- The «Tender register» now feeds «My projects»: a tender submitted, won or lost counts there on its own, once, a loss with its reason — so the win rate is real.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- «ٹینڈر رجسٹر» اب «میرے منصوبے» کو بھرتا ہے: جمع، جیت یا ہار والا ٹینڈر وہاں خود ایک بار شمار ہوتا ہے، ہار اپنی وجہ کے ساتھ۔

</div>
</details>


## v9.08 — 2026-11-07

- الماوس بقى بينوّر أي حاجة بتتضغط وهو واقف عليها (أزرار، وقايمة، وكروت، وصفوف جداول)، والصيغة الموحدة: «فكرة وتصميم وتطوير: محمد صفوت».

<details><summary>English</summary>

- The pointer now lights whatever you can press as it rests on it (buttons, menu, cards, table rows); one credit wording: «Powered by Mohamed Safwat — idea, design & build».

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- ماؤس اب ہر قابلِ کلک چیز کو روشن کرتا ہے؛ ایک ہی کریڈٹ: «Powered by محمد صفوت — خیال، ڈیزائن اور تیاری»۔

</div>
</details>


## v9.07 — 2026-11-07

- أرقام غرفة المتابعة بقت بتفتح نافذة تفاصيل: مربعات ملخص، وعمود لكل مهندس، والقايمة كاملة (المتأخر بالأحمر)، وتصدير إكسل.
- الخانات (ومنها التاريخ) بقت بلون البوابة وأيقونة التقويم غامقة في الليلي، والنص الثانوي أوضح، و«كراسة الشروط» بتظهر صح جوه الكلام الإنجليزي.
- «تصميم وتطوير: محمد صفوت» تحت القايمة وفي آخر كل صفحة، ونافذة «عن البوابة»، واسم المؤلف في خصائص كل ملف إكسل.

<details><summary>English</summary>

- Control-room numbers open a detail window: summary tiles, a bar per engineer, the full list (late ones in red) and Excel.
- Fields (dates included) take the portal's colours with a dark calendar at night, secondary text is easier to read, and «كراسة الشروط» shows in the right order inside English text.
- «Designed & built by Mohamed Safwat» under the menu and at the foot of every page, an «About» window, and the author in every Excel file's properties.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- کنٹرول روم کے اعداد اب تفصیل کی کھڑکی کھولتے ہیں: خلاصہ، فی انجینئر بار، مکمل فہرست اور ایکسل۔
- فیلڈز پورٹل کے رنگوں میں، رات کو گہرا کیلنڈر، ثانوی متن زیادہ واضح، اور «كراسة الشروط» انگریزی متن میں درست ترتیب سے۔
- مینو کے نیچے اور ہر صفحے کے آخر میں «ڈیزائن و تیاری: محمد صفوت»، «پورٹل کے بارے میں» کھڑکی، اور ہر ایکسل فائل میں مصنف کا نام۔

</div>
</details>


## v9.06 — 2026-11-07

- «سجل المناقصات» بيشتغل مع أي مساعد: زر «انسخ الأمر للمساعد» (كلود في كروم أو شات جي بي تي في وضع العمل)، وزر جديد «📥 الصق النتيجة» تلصق فيه رد المساعد زي ما هو، والبوابة تطلّع البيانات وتفحصها بنفس الشروط.

<details><summary>English</summary>

- The «Tender register» works with any assistant: «Copy the instructions for the assistant» (Claude in Chrome or ChatGPT in Work mode), and a new «📥 Paste the result» that takes the assistant's answer as it is, then checks it by the same rules.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- «ٹینڈر رجسٹر» اب کسی بھی اسسٹنٹ کے ساتھ: «اسسٹنٹ کے لیے ہدایات کاپی کریں» (Claude in Chrome یا ورک موڈ میں ChatGPT)، اور نیا «📥 نتیجہ پیسٹ کریں» جو جواب کو جیسا ہے لے کر انہی اصولوں سے جانچتا ہے۔

</div>
</details>


## v9.05 — 2026-11-06

- تصحيح مهم: رابط الموبايل للمهندس ما بقاش يقارن بشهر أو أسبوع مش متسحوب كامل — بيعرض «—» ويقول ليه، زي «مؤشرات الفريق» بالظبط.
- على الموبايل: جداول «مؤشراتي» بأعمدتها كلها (والتغيّر و⚑)، وكارت التعريف سطر واحد لما يبقى فيه أرقام، و«البيانات» بتخفي خطوات إضافة كروم (بتتعمل من الكمبيوتر).

<details><summary>English</summary>

- An important correction: the engineer's phone link no longer compares with a month or week that was not pulled whole — it shows «—» and says why, exactly as «Team KPIs» does.
- On a phone: «My KPIs» tables with every column (change and ⚑), the intro card as one line once there are numbers, and «Data» folding the Chrome-extension steps (done on a computer).

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- اہم درستگی: انجینئر کا فون لنک اب ایسے مہینے یا ہفتے سے موازنہ نہیں کرتا جو مکمل نہیں لایا گیا — «—» دکھاتا اور وجہ بتاتا ہے۔
- فون پر: «میرے اشاریے» کے جدول تمام کالموں کے ساتھ، اعداد ہوں تو تعارفی کارڈ ایک سطر، اور «ڈیٹا» کروم ایکسٹینشن کے مراحل چھپاتا ہے۔

</div>
</details>


## v9.04 — 2026-11-06

- «خط سير المناقصات» في السجل: كل محطة بعددها، والخطوط بينها بتجري لما فيه مناقصات ماشية، والمحطة اللي فيها حاجة واقفة أكتر من ٣ أيام بتنبض بالأحمر، وتضغط أي محطة يتفلتر الجدول عليها.
- حركة ونور: خط بألوان أفاقي بيترسم ويلمع تحت عنوان كل صفحة، وخط ضوء مع كل انتقال لصفحة، والعدّادات والتنبيهات الحمرا بتنبض، ولمعة على الأزرار، وضوء الماوس على الكروت. كله بيقف مع «تقليل الحركة».

<details><summary>English</summary>

- The «tender pipeline» on the register: each stage with its count, running lines where tenders move through, a red pulse where something waits over 3 days; click a stage to filter the table.
- Light and motion: a line in AFAQY's colours draws and shimmers under each page title, a light sweeps on every page change, red countdowns and alerts pulse, primary buttons shine, the pointer's light on more cards. All of it stops with reduced motion.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- رجسٹر پر «ٹینڈر پائپ لائن»: ہر مرحلہ اپنی تعداد کے ساتھ، چلتی لکیریں، 3 دن سے زیادہ انتظار پر سرخ دھڑکن؛ مرحلے پر کلک سے جدول فلٹر۔
- روشنی اور حرکت: ہر صفحے کے عنوان کے نیچے آفاقی رنگوں کی لکیر، صفحہ بدلنے پر روشنی، سرخ گنتیاں اور الرٹ دھڑکتے ہیں، بٹنوں پر چمک۔ کم حرکت کی ترتیب پر سب رک جاتا ہے۔

</div>
</details>


## v9.03 — 2026-11-06

- «سجل المناقصات» أوضح: جزء السحب بقى شريط مضغوط (الفترة وخمس زراير، والشرح تحت «إزاي؟»)، والجدول بيبدأ في أول شاشة. وعلى الموبايل كل مناقصة كارت فيه المحطة وواقفة من كام يوم والعدّاد، من غير سحب بالعرض.

<details><summary>English</summary>

- The «Tender register» is clearer: the pull section is a compact bar (the period and five buttons, the explanations under «How?»), and the table starts on the first screen. On a phone each tender is a card with its stage, days waiting and countdown — no sideways scrolling.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- «ٹینڈر رجسٹر» اب واضح: لانے کا حصہ ایک مختصر پٹی (مدت اور پانچ بٹن، وضاحت «کیسے؟» میں)، اور جدول پہلی اسکرین پر۔ فون پر ہر ٹینڈر ایک کارڈ — بغیر افقی اسکرول۔

</div>
</details>


## v9.02 — 2026-11-06

- غرفة المتابعة بتنبّهك للمناقصات: محتاج قرار (وأقدمها من كام يوم)، وموعد خلال ٧ أيام، وفات موعدها — حتى من غير سحب مهام، وكل تنبيه يفتح السجل.
- في «سجل المناقصات» زر «رسالة الإدارة الأسبوعية»: ملخص آخر ٧ أيام (وصل، قررنا، قدّمنا، فزنا، خسرنا وأسبابها، في الانتظار، مواعيد الأسبوع القادم، نسبة الفوز) تنسخه أو تبعته بالإيميل.

<details><summary>English</summary>

- The control room now warns about tenders: awaiting a decision (and the oldest wait), a date within 7 days, past deadline — even with no task pull; each alert opens the register.
- «Weekly management message» on the tender register: a summary of the last 7 days (arrived, decided, submitted, won, lost with reasons, waiting, next week’s dates, win rate) to copy or e-mail.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- کنٹرول روم اب ٹینڈرز کے الرٹ دیتا ہے: فیصلے کے منتظر، 7 دن میں تاریخ، تاریخ گزری — ہر الرٹ رجسٹر کھولتا ہے۔
- ٹینڈر رجسٹر پر «ہفتہ وار انتظامی پیغام»: گزشتہ 7 دنوں کا خلاصہ کاپی یا ای میل کریں۔

</div>
</details>


## v9.01 — 2026-11-06

- «سجل المناقصات» بقى دورة حياة كاملة: وصلت ← فرز أولي ← قرار المشاركة ← جاري الإعداد ← جاهزة ← تم التقديم ← فزنا/خسرنا (أو أُلغيت/اعتذرنا بسبب إلزامي)، مع «واقفة من كام يوم» وأقرب موعد بعدّاد ملوّن.
- اضغط أي مناقصة لتفاصيلها: رقم اعتماد، والقيمة، وقيمة الكراسة، والضمان، ومواعيد الاستفسارات والزيارة والتقديم وفتح المظاريف، والمسؤول، والدراسة، و«ضيف للتقويم» (ملف يفتح في أوتلوك). وأرقام الفترة: محتاج قرار، وشاركنا، وقدّمنا، وفزنا، ونسبة الفوز، ومتوسط أيام القرار، والتقديم في الوقت. والإكسل بكل الأعمدة.

<details><summary>English</summary>

- The «Tender register» is now a full lifecycle: arrived → screening → bid decision → in preparation → ready → submitted → won/lost (or cancelled/declined with a required reason), with days waiting and the nearest date as a coloured countdown.
- Click a tender for its details: the Etimad number, value, booklet fee, guarantee, the inquiries, site-visit, submission and opening dates, the owner, the study, and «Add to calendar» (a file that opens in Outlook). The period's numbers: awaiting a decision, joined, submitted, won, win rate, average decision days, on-time submission. Excel with every column.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- «ٹینڈر رجسٹر» اب مکمل سائیکل ہے: آئی ← جانچ ← شرکت کا فیصلہ ← تیاری ← تیار ← جمع ← جیت/ہار (یا منسوخ/معذرت لازمی وجہ کے ساتھ)، انتظار کے دن اور قریب ترین تاریخ رنگین گنتی کے ساتھ۔
- تفصیل کے لیے ٹینڈر پر کلک کریں: اعتماد نمبر، مالیت، فیس، ضمانت، تاریخیں، ذمہ دار، مطالعہ، اور «کیلنڈر میں شامل کریں»۔ مدت کے اعداد اور ہر کالم کے ساتھ ایکسل۔

</div>
</details>


## v9.00 — 2026-11-06

- «سجل المناقصات» بقى له ٣ طرق للإضافة بنفس الشروط: (١) فترة تختارها (من/إلى) وبوكمارك «📌 سحب المناقصات» يسأل عن الفترة وينسخ الأمر لكلود في كروم ويفتح أوتلوك؛ (٢) ملف بريد PST يتقرا على جهازك بس، مهما كان فيه إيميلات؛ (٣) «＋ مناقصة» بإيدك.

<details><summary>English</summary>

- The «Tender register» now has three ways in, by the same rules: (1) a period you choose and a «📌 Pull tenders» bookmark that asks it, copies the instructions for Claude in Chrome and opens Outlook; (2) a PST mail file read on your device only, however many mails it holds; (3) «＋ Tender» by hand.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- «ٹینڈر رجسٹر» میں اب انہی اصولوں سے تین طریقے: (1) آپ کی منتخب مدت اور «📌 ٹینڈر لائیں» بک مارک جو مدت پوچھتا، Claude in Chrome کی ہدایات کاپی کرتا اور آؤٹ لک کھولتا ہے؛ (2) PST میل فائل صرف آپ کے آلے پر؛ (3) ہاتھ سے «＋ ٹینڈر»۔

</div>
</details>


## v8.99 — 2026-11-06

- مربعات «سجل المناقصات» الأربعة بقت متساوية في سطر واحد (واتنين في السطر على الموبايل).

<details><summary>English</summary>

- The tender register's four counts are now equal tiles in one row (two per row on a phone).

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- ٹینڈر رجسٹر کے چاروں خانے اب ایک قطار میں برابر ہیں (فون پر دو فی قطار)۔

</div>
</details>


## v8.98 — 2026-11-06

- صفحة جديدة «سجل المناقصات» تحت «المؤشرات»: كل مناقصة وصلت بالبريد مرة واحدة (إيميل أصلي من أ. إبراهيم أو فيه «كراسة الشروط») بأول تاريخ وصول. السحب من أوتلوك بأمر جاهز لكلود في كروم، والبوابة بتتأكد من الشروط تاني.
- الحالة (جاهزة فني ومالي أو لسه) وتاريخ الجاهزية وآخر موعد للتقديم وآخر موعد لزيارة الموقع بإيدك، وفلتر شهر وربع وسنة، وتصدير إكسل بالسجل وملخص شهري.

<details><summary>English</summary>

- A new page, «Tender register», under «Indicators»: every tender that arrived by mail once (an original from A. Ibrahim or carrying «كراسة الشروط»), on its first date. Pulled from Outlook with ready instructions for Claude in Chrome; the portal checks the rules again.
- You set the status (ready: technical + financial, or not yet), the ready date, the submission and site-visit deadlines; filter by month, quarter or year; export to Excel with the register and a monthly summary.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- «اشاریے» کے تحت نیا صفحہ «ٹینڈر رجسٹر»: میل سے آنے والا ہر ٹینڈر ایک بار (اے ابراہیم سے اصل پیغام یا «كراسة الشروط» کے ساتھ)، پہلی تاریخ پر۔ آؤٹ لک سے Claude in Chrome کی تیار ہدایات کے ذریعے؛ پورٹل اصول دوبارہ جانچتا ہے۔
- حیثیت (تیار: تکنیکی + مالی، یا ابھی نہیں)، تیاری کی تاریخ، جمع کرانے اور سائٹ وزٹ کی آخری تاریخیں آپ طے کرتے ہیں؛ مہینے، سہ ماہی یا سال سے فلٹر؛ رجسٹر اور ماہانہ خلاصے کے ساتھ ایکسل برآمد۔

</div>
</details>


## v8.97 — 2026-11-06

- ملف بريد أوتلوك بقى له مكان واحد: «البريد من ملف PST» في القايمة. اتشال الكارت اللي كان في صفحة «البيانات».

<details><summary>English</summary>

- The Outlook mail file now has one place: «Mail from a PST file» in the menu. The card on «Data» is gone.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- آؤٹ لک میل فائل کی اب ایک ہی جگہ ہے: مینو میں «PST فائل سے میل»۔ «ڈیٹا» والا کارڈ ہٹا دیا گیا۔

</div>
</details>


## v8.96 — 2026-11-06

- شكل جديد للبوابة «البنتو الحي»: ملخصات بمربعات بأحجام مختلفة، والإجمالي معاه شريط بنسب مصادره الحقيقية، والمتوسط معاه دايرة «نسبة الإغلاق»، والنقاط إطارها بيلف.
- خط أفاقي على الويب «Cairo» للعربي (وAxiforma للإنجليزي والأرقام على الأجهزة اللي متسطب عليها)، وحركات: انتقال بين الصفحات، وشفق بألوان أفاقي، وظهور الأقسام وانت بتنزل، وميلان وضوء مع الماوس. الحركة بتقف لو الجهاز مضبوط على «تقليل الحركة».

<details><summary>English</summary>

- A new look, «Live bento»: summaries as tiles of different sizes; the total with a bar of its real sources, the average with a «Closed rate» ring, points with a turning edge.
- AFAQY's web type «Cairo» for Arabic (and Axiforma for Latin and digits where installed), and motion: page transitions, an aurora in AFAQY's colours, sections appearing as you scroll, tiles that lean and light under the pointer. Motion stops when the device asks for less.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- نیا انداز «لائیو بینٹو»: خلاصے مختلف سائز کے خانوں میں؛ کل کے ساتھ اس کے حقیقی ذرائع کی پٹی، اوسط کے ساتھ «بند ہونے کی شرح» کا دائرہ، پوائنٹس کا گھومتا کنارہ۔
- عربی کے لیے آفاقی کا ویب فونٹ «Cairo» (اور جہاں نصب ہو وہاں لاطینی اور اعداد کے لیے Axiforma)، اور حرکت: صفحات کی منتقلی، آفاقی کے رنگوں میں شفق، اسکرول پر حصوں کا ظاہر ہونا، ماؤس کے ساتھ جھکاؤ اور روشنی۔ کم حرکت کی ترتیب پر حرکت رک جاتی ہے۔

</div>
</details>


## v8.95 — 2026-11-05

- «رسائل الفريق» تحت «المزيد» في «مؤشرات الفريق»: لكل مهندس رسالة أسبوعه ورسالة مركزه الشهري بنفس الرابط. المهندس بيفتح الرابط مرة من موبايله فيشوف شهره وأسبوعه في «مؤشراتي» من غير أي إعداد.
- زرار «⚑ الرقم ده شكله غلط» جنب كل رقم شخصي: بيفتح بلاغ فيه الرقم ومصدره وتعريفه وتاريخ البيانات، وخانة لملاحظتك، وتنسخه أو تبعته بالإيميل.

<details><summary>English</summary>

- «Team messages» under «More» on «Team KPIs»: each engineer's week message and month rank message, with the same link. He opens it once on his phone and sees his month and week on «My KPIs» with no setup.
- «⚑ This number looks wrong» beside every personal number: a report with the number, where it comes from, its definition and the data date, a note, then copy or e-mail it.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- «ٹیم کے اشاریے» میں «مزید» کے نیچے «ٹیم کے پیغامات»: ہر انجینئر کا ہفتے کا پیغام اور مہینے کے درجے کا پیغام، ایک ہی لنک کے ساتھ۔ وہ فون پر ایک بار کھولے تو بغیر سیٹ اپ «میرے اشاریے» میں اپنا مہینہ اور ہفتہ دیکھے۔
- ہر ذاتی عدد کے ساتھ «⚑ یہ عدد غلط لگتا ہے»: عدد، اس کا ماخذ، تعریف اور ڈیٹا کی تاریخ کے ساتھ رپورٹ، ایک نوٹ، پھر کاپی کریں یا ای میل کریں۔

</div>
</details>


## v8.94 — 2026-11-05

- تصنيفات البريد بقت بتاعتك بالكامل من البوابة: تضيف تصنيف، وتسمّيه، وتكتب كلماته، وترتّب الأولوية بالأسهم، وتحذف. وجدول النتايج بيتبني من تصنيفاتك، والقواعد بقت بتتنقل مع النسخة الاحتياطية.

<details><summary>English</summary>

- Mail categories are now fully yours in the portal: add, name, give words, set priority with the arrows, remove. The results follow your categories, and the rules travel with the backup.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- میل کے زمرے اب پورٹل میں مکمل طور پر آپ کے ہیں: شامل کریں، نام رکھیں، الفاظ لکھیں، تیروں سے ترجیح طے کریں، ہٹائیں۔ نتائج آپ کے زمروں کے مطابق ہیں، اور اصول بیک اپ کے ساتھ منتقل ہوتے ہیں۔

</div>
</details>


## v8.93 — 2026-11-05

- صفحة «البريد من ملف PST» بقت بتعرض قواعد التصنيف وطريقة العدّ من أول ما تفتحها، قبل ما ترفع أي ملف. كانت بتظهر بعد الرفع بس فمكنتش بتتلاقي.

<details><summary>English</summary>

- The «Mail from a PST file» page now shows its classification rules and how it counts as soon as it opens, before any file is chosen. They used to appear only after a file was read, so they could not be found.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- «PST فائل سے میل» والا صفحہ اب کھلتے ہی زمرہ بندی کے اصول اور گنتی کا طریقہ دکھاتا ہے، فائل چننے سے پہلے۔ پہلے یہ فائل پڑھنے کے بعد ہی نظر آتے تھے، اس لیے ملتے نہیں تھے۔

</div>
</details>


## v8.92 — 2026-11-05

- عمود «بحث وتطوير» رجع في «مؤشرات الفريق» ومعاه بطاقة وتغيّرها عن الفترة اللي فاتت: عدد المهام اللي اتقفلت من طابور البحث والتطوير. لو السحبة قديمة ومش فيها قايمة الطابور، بيظهر «—» مع السبب، مش صفر.
- ملف البريد بقى يعدّ كل رسالة مرة واحدة حتى لو محفوظة في أكتر من مجلد، وبيقولك كام نسخة مكررة اتشالت. وصفحة البريد بقت تشرح إزاي بتعدّ، وإن أرقامها ما بتدخلش في المؤشرات ولا النقاط.

<details><summary>English</summary>

- The «R&D» column is back on «Team KPIs», with a tile and its change against the period before: tasks closed from the R&D queue. An older pull without the queue's list shows «—» with the reason, never 0.
- A PST now counts every e-mail once even when it is kept in several folders, and says how many copies were left out. The mail page explains how it counts, and that its numbers enter neither the KPIs nor the points.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- «آر اینڈ ڈی» کالم «ٹیم کے اشاریے» پر واپس آ گیا، ایک کارڈ اور پچھلے دور سے تبدیلی کے ساتھ: آر اینڈ ڈی قطار سے بند ہونے والے ٹاسک۔ قطار کی فہرست کے بغیر پرانا ڈیٹا «—» اور وجہ دکھاتا ہے، صفر کبھی نہیں۔
- PST فائل اب ہر ای میل ایک بار گنتی ہے چاہے کئی فولڈروں میں ہو، اور بتاتی ہے کتنی کاپیاں چھوڑی گئیں۔ میل والا صفحہ بتاتا ہے کیسے گنتا ہے، اور یہ کہ اس کے اعداد نہ اشاریوں میں جاتے ہیں نہ پوائنٹس میں۔

</div>
</details>


## v8.91 — 2026-11-05

- «مؤشراتي» و«مؤشرات الفريق» فيهم زرارين: «شهر» و«ربع». اختار شهر أو ربع، وكل رقم بيتقارن تلقائيًا بالشهر اللي فات أو بالربع اللي فات، ولما تضغط على أي شخص تفاصيله بتمشي على نفس الاختيار.

<details><summary>English</summary>

- «My KPIs» and «Team KPIs» have a «Month | Quarter» switch: pick a month or a quarter and every number is compared with the month or the quarter before; a person's details follow the same choice.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- «میرے اشاریے» اور «ٹیم کے اشاریے» میں «مہینہ | سہ ماہی» کا انتخاب ہے: مہینہ یا سہ ماہی چنیں، ہر عدد کا پچھلے مہینے یا پچھلی سہ ماہی سے موازنہ ہوتا ہے، اور کسی کی تفصیل بھی اسی انتخاب پر چلتی ہے۔

</div>
</details>


## v8.90 — 2026-11-05

- روابط المعاينة رجعت تشتغل: النسخة اللي بتجمع البوابة في ملف واحد كانت واقفة من 8.88.
- زرار «✕ إغلاق» في كل الحوارات بقى يتبع اللغة الحالية بدل أول لغة اتفتح بيها.
- المدير ما بقاش يظهر في «مؤشرات الفريق» ويختفي بعد شوية: البوابة بقت تعرف مين انت من أول لحظة.
- شغلك المفتوح بيظهر كله تاني، الأحدث الأول: ٦ ظاهرين والباقي في «المزيد»، في «مؤشراتي» وفي صف أي شخص.

<details><summary>English</summary>

- Preview links work again: the single-file build of the portal had stopped since 8.88.
- The «✕ Close» on every window now follows the current language instead of the first one it opened in.
- The manager no longer shows on «Team KPIs» and then vanishes: the portal knows who you are from the first moment.
- Your open work is listed in full again, newest first: six shown and the rest under «More», on «My KPIs» and in anyone's row.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- پیش نظارہ لنک دوبارہ کام کرتے ہیں: پورٹل کا ایک فائل والا نسخہ 8.88 سے رکا ہوا تھا۔
- ہر ونڈو کا «✕ بند کریں» اب موجودہ زبان کے مطابق ہے، نہ کہ پہلی زبان جس میں کھلا تھا۔
- مینیجر اب «ٹیم کے اشاریے» میں دکھ کر پھر غائب نہیں ہوتا: پورٹل پہلے لمحے سے جانتا ہے آپ کون ہیں۔
- آپ کا کھلا کام دوبارہ پورا دکھتا ہے، نیا پہلے: چھ نظر آتے ہیں اور باقی «مزید» میں، «میرے اشاریے» میں بھی اور کسی کی قطار میں بھی۔

</div>
</details>


## v8.89 — 2026-11-05

- صفحتين واضحتين: «مؤشراتي» فيها أرقامك انت بس، و«مؤشرات الفريق» فيها الفريق كله من غيرك. ولما تضغط على أي شخص في «مؤشرات الفريق» بيظهرلك نفس العرض بالظبط اللي بيشوفه هو في «مؤشراتي»: الشهر مقابل اللي قبله، وشغله المفتوح، وآخر ٦ شهور، وبنفس الأرقام.
- اتصلّح غلط قديم في تقسيم المصادر: «اعرض صفحته» و«مؤشراتي» بتاعة المدير كانوا بيعدّوا المهام اللي أسندها له غيره على إنها «عملها لنفسه».
- «خطط الفريق»: ترفع ملف الهيكل (صفحة HTML) ويظهر زي ما هو بالظبط، من غير فرز ومن غير ما تختار نفسك. والملف بيفضل على جهازك ومش بيظهر في رابط الفريق.

<details><summary>English</summary>

- Two clear pages: «My KPIs» holds your numbers only, «Team KPIs» the whole team without you. Clicking anyone on «Team KPIs» shows exactly the view he sees on his «My KPIs»: the month against the one before, his open work and the last six months, with the same numbers.
- An old error in the source split is fixed: «his page as he sees it» and the manager's «My KPIs» counted tasks others assigned as «opened by himself».
- «Team plans»: upload the structure file (an HTML page) and it shows exactly as it is — no cut, no picking yourself. It stays on your device and is not on the team link.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- دو واضح صفحے: «میرے اشاریے» میں صرف آپ کے اعداد، اور «ٹیم کے اشاریے» میں آپ کے بغیر پوری ٹیم۔ «ٹیم کے اشاریے» میں کسی پر بھی کلک کریں تو بالکل وہی منظر دکھتا ہے جو وہ اپنے «میرے اشاریے» میں دیکھتا ہے: مہینہ پچھلے کے مقابلے میں، اس کا کھلا کام اور آخری چھ مہینے، انہی اعداد کے ساتھ۔
- ذرائع کی تقسیم کی ایک پرانی غلطی درست: «اس کا صفحہ جیسا وہ دیکھتا ہے» اور مینیجر کے «میرے اشاریے» دوسروں کے دیے ہوئے ٹاسک کو «خود کھولے» گنتے تھے۔
- «ٹیم کے منصوبے»: ڈھانچے کی فائل (HTML صفحہ) اپ لوڈ کریں، بالکل جیسی ہے ویسی دکھے گی — نہ کٹائی، نہ خود کو چننا۔ فائل آپ کی ڈیوائس پر رہتی ہے اور ٹیم لنک پر نہیں۔

</div>
</details>


## v8.88 — 2026-11-05

- المؤشرات بقت المكان الوحيد لأرقام كل موظف في الشهر: تختار الشهر (سحبة الربع بتطلع ٣ شهور)، وتلاقي لكل موظف المهام اللي جات من الإيميل، واللي عملها لنفسه، واللي أسندها له غيره، والإجمالي، وأُغلق منها كام، ومتوسط وقت الإغلاق، والنقاط، ومقارنة تلقائية بالشهر اللي قبله.
- اضغط على أي موظف تفتح تفاصيله في مكانها: الشهر مقابل اللي قبله، وشغله المفتوح، وآخر ٦ شهور، وتقريره PDF، وخطته، وصفحته زي ما بيشوفها. صفحة «ملف الموظف» وصفحة «المهام: المصدر ووقت الإنجاز» اتدمجوا في المؤشرات، وروابطهم القديمة بتفتحها.
- اتشال التكرار: الأرقام بقت من حسبة واحدة في كل مكان، وصندوق Outlook انتقل لصفحة البريد، وحذف السحبات من صفحة البيانات بس، واتصلّح تعريف «من الإيميل» القديم اللي كان ظاهر في مؤشراتي والدليل.
- صفحة جديدة للمدير بس اسمها «خطط الفريق»: ترفع ملف مخطط الفريق زي ما وصلك، وتختار نفسك مرة واحدة، فيظهر بنفس شكله لكن لقسمك بس (التقني والمشاريع، والبحث والتطوير، وما بعد البيع). الملف بيفضل على جهازك ومش بيتنشر، ولو فضل فيه إيميل أو جوال لحد برّا قسمك بيترفض.
- في المؤشرات: منتقي واحد يفتح صفحة أي حد زي ما هو شايفها، حتى القادة والمديرين، وتحت اسم الموظف بيظهر بيتبع مين.

<details><summary>English</summary>

- KPIs is now the one place for every employee's month: pick a month (a quarter pull gives three) and see, per employee, the tasks from e-mail, opened by himself and assigned by others, the total, how many closed and how fast, and the points — compared automatically with the month before.
- Click any employee to open his details in place: this month against the last, his open work, the last six months, his PDF, his plan and his page as he sees it. The person file and the tasks-by-source page are merged into KPIs; their old links open it.
- Repetition removed: every page reads one calculation, the Outlook box moved to the mail page, pulls are deleted on the Data page only, and the old «from e-mail» definition still shown in My KPIs and the guide is corrected.
- A new manager-only page, «Team plans»: upload the team planner file as it came, pick yourself once, and it shows as it looks but only your part (Technical & Projects, R&D, After-Sales). The file stays on your device and is not published; it is refused if any e-mail or phone of someone outside your part remains.
- On KPIs: one picker opens anyone’s page as he sees it, leads and managers included, and an employee’s details show whom he reports to.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- اشاریے اب مہینے میں ہر ملازم کے اعداد کی واحد جگہ ہیں: مہینہ چنیں (سہ ماہی کا ڈیٹا تین مہینے دیتا ہے) اور ہر ملازم کے ای میل سے آئے، خود کھولے اور دوسروں کے دیے ہوئے ٹاسک، کل، کتنے بند ہوئے اور کتنی جلدی، اور پوائنٹس دیکھیں — پچھلے مہینے سے خودکار موازنے کے ساتھ۔
- کسی بھی ملازم پر کلک کریں تو تفصیل وہیں کھلتی ہے: یہ مہینہ پچھلے کے مقابلے میں، کھلا کام، آخری چھ مہینے، PDF، منصوبہ اور اس کا صفحہ جیسا وہ دیکھتا ہے۔ ملازم کی فائل اور ٹاسک بلحاظ ذریعہ والا صفحہ اشاریوں میں ضم ہو گئے؛ پرانے لنک اسے کھولتے ہیں۔
- تکرار ختم: ہر صفحہ ایک ہی حساب پڑھتا ہے، Outlook باکس میل والے صفحے پر چلا گیا، ڈیٹا صرف «ڈیٹا» صفحے سے حذف ہوتا ہے، اور «ای میل سے» کی پرانی تعریف جو «میرے اشاریے» اور رہنما میں دکھ رہی تھی درست کر دی گئی۔
- صرف مینیجر کے لیے نیا صفحہ «ٹیم کے منصوبے»: ٹیم پلانر فائل جیسی آئی اپ لوڈ کریں، ایک بار خود کو چنیں، اور وہ اسی شکل میں صرف آپ کے حصے (ٹیکنیکل اینڈ پروجیکٹس، آر اینڈ ڈی، آفٹر سیلز) کے ساتھ دکھے گی۔ فائل آپ کی ڈیوائس پر رہتی ہے اور شائع نہیں ہوتی؛ اگر آپ کے حصے سے باہر کسی کی ای میل یا فون باقی رہے تو رد ہو جاتی ہے۔
- اشاریوں میں: ایک ہی چناؤ سے کسی کا بھی صفحہ جیسا وہ دیکھتا ہے کھلتا ہے، لیڈز اور مینیجرز سمیت، اور ملازم کی تفصیل میں دکھتا ہے وہ کس کے ماتحت ہے۔

</div>
</details>


## v8.87 — 2026-11-04

- صفحة الفريق: عند «تعديل الفريق» صار لكل شخص خانتا مسمّى، بالعربي وبالإنجليزي، وتُحفظان معًا؛ والصفحة الإنجليزية تعرض المسمّى الإنجليزي.
- «إضافة» تختار شخصًا حقيقيًا من بيانات السحب بدل كتابة أي رقم، وأي رقم لا يطابق أحدًا يظهر بتنبيه أحمر لتحذفه. أعمدة الجدول صارت مستقيمة.

<details><summary>English</summary>

- Team page: in «Edit team» each person has two title fields, Arabic and English, both saved; the English page shows the English title.
- «Add» picks a real person from the pulled data instead of any typed number, and a number that matches no one is flagged in red so you can remove it. The table’s columns line up.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- ٹیم صفحہ: ہر فرد کے دو عہدے، عربی اور انگریزی، دونوں محفوظ۔
- «شامل کریں» کھینچے گئے ڈیٹا سے حقیقی فرد چنتا ہے؛ نامعلوم نمبر سرخ میں۔

</div>
</details>


## v8.86 — 2026-11-04

- ملف البريد PST يُرفع من مكان واحد: صفحة «البريد من ملف PST». صفحة «البيانات» فيها زر يفتحها، بدل زر رفع ثانٍ يفعل الشيء نفسه.
- إصلاح: شريط العنوان كان يكتب «undefined» في صفحة البريد.

<details><summary>English</summary>

- A PST mail file is uploaded in one place: the «Mail from a PST file» page. The Data page has a button that opens it, instead of a second upload button doing the same thing.
- Fix: the top bar read «undefined» on the mail page.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- PST میل فائل ایک ہی جگہ اپ لوڈ ہوتی ہے: «PST فائل سے میل» صفحہ۔
- درستی: میل صفحے پر اوپر «undefined» لکھا آتا تھا۔

</div>
</details>


## v8.85 — 2026-11-04

- لوحة «المهام: المصدر ووقت الإنجاز» تحت «المؤشرات»: لكل شخص وللفريق ما عمله لنفسه، وما جاء من الإيميل، وما أسنده له غيره، والكل — العدد ومتوسط وقت الإغلاق والوسيط — برسم تفاعلي (العدد أو الوقت، الترتيب، الضغط على شخص) وجدول وتنزيل CSV. طابقت تصدير ماي أفاقي بالدقيقة.
- تعريف واحد لمصدر المهمة في كل البوابة ومحرك واحد: أرقام اللوحة واللوحة الجديدة ومؤشراتي متطابقة. ساعات العمل الإضافي تفصل مهامها حسب المصدر، ومؤشراتي فيها مصادر مهامك ووقت إنجازها.

<details><summary>English</summary>

- The «Tasks: source and time to close» dashboard under KPIs: for each person and the team, tasks opened by themselves, from e-mail, assigned by others, and all — count, average time to close and median — with an interactive chart (count or time, sort, click a person), a table and a CSV. Matched MyAFAQY’s export to the minute.
- One definition of a task’s source across the portal and one engine: the board, the new dashboard and My KPIs agree. Overtime splits its tasks by source, and My KPIs shows where your tasks came from and how long they took.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- «کام: ماخذ اور بند ہونے کا وقت» ڈیش بورڈ: ہر فرد اور ٹیم کے خود کھولے، ای میل سے، دوسروں کے دیے، اور سب — تعداد، اوسط اور وسطانیہ؛ انٹرایکٹو چارٹ، جدول اور CSV۔
- پورے پورٹل میں ماخذ کی ایک تعریف اور ایک انجن؛ اوور ٹائم اور میرے اشاریے میں بھی ماخذ۔

</div>
</details>


## v8.84 — 2026-11-04

- صفحة «عدد المهام» تحت «المؤشرات»: الفريق تحت بعضه، لكل واحد عدد المهام التي أُسندت له في الشهر أو الربع وكم أنجز، ثم المهام اليدوية (العدد ومتوسط الإغلاق) ومهام الإيميل (العدد ومتوسط الإغلاق) والاثنتان معًا، مع الإجمالي وتنزيل CSV. العدّ بتاريخ الإسناد مثل تصدير ماي أفاقي، وطابق تصدير ماي أفاقي بالدقيقة.

<details><summary>English</summary>

- The «Tasks per person» page under KPIs: the team one under the other; for each person the tasks assigned in the month or quarter and how many were done, then manual tasks (count and average closing time), email tasks (count and average closing time) and both together, with totals and a CSV download. Counted by assignment date like MyAFAQY’s export, and matched against it to the minute.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- «فی کس کام» صفحہ: ہر فرد کے مہینے یا سہ ماہی کے کام، مکمل، دستی اور ای میل کاموں کی تعداد اور بند ہونے کا اوسط، اور دونوں ملا کر؛ CSV کے ساتھ۔

</div>
</details>


## v8.83 — 2026-11-04

- إصلاح مهم في الأرقام: عندما يتداخل سحبان (سنة ثم شهر، أو سحب الإضافة)، كانت المهام المشتركة تُعدّ مرتين في اللوحة وملف الشخص والترتيب والتطوير والساعات والأوزان. الآن كل مهمة تُعدّ مرة واحدة بحالتها الأحدث.

<details><summary>English</summary>

- An important fix to the numbers: when two pulls overlapped (a year then a month, or the extension's pull), shared tasks were counted twice on the board, the person file, ranks, development, overtime and the weights. Each task now counts once, in its newest status.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- اہم درستی: دو پل ایک دوسرے پر آئیں تو مشترک کام دو بار گنے جاتے تھے؛ اب ہر کام ایک بار اپنی تازہ حالت میں گنا جاتا ہے۔

</div>
</details>


## v8.82 — 2026-11-04

- الأوزان: عمود «المنجز في الفترة» يعدّ المهام المنجزة فقط في فترة تختارها (كل البيانات، هذا الشهر، الشهر الماضي، من — إلى) ويكتب مصدره. طريقة العدّ والوقت المعتاد صارا خانتين بجانب النقاط، ومعامل السرعة خانة فوق الجدول. أي طريقة جديدة تبدأ بلا وقت معتاد حتى تحدده أنت، والقيم المبدئية معلَّمة.
- ساعات العمل الإضافي: تشمل الفريق كله مع القادة والمديرين، والأيام التي قُفلت فيها المهام دفعة واحدة معلَّمة لأن ساعاتها أقل من الحقيقة؛ الساعات حد أدنى.

<details><summary>English</summary>

- Weights: «Completed in the period» counts only completed tasks in a period you choose (all data, this month, last month, from — to) and states its source. The method and the usual time are fields next to the points, and the speed bonus is a field above the table. A newly chosen method starts with no usual time until you set it; seeded values are marked.
- Overtime: covers the whole team including leads and managers; days whose tasks were closed in one batch are marked because their hours are less than the real work; hours are a minimum.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- اوزان: «مدت میں مکمل» صرف مکمل کام آپ کی چنی مدت میں گنتا ہے۔ طریقہ اور معمول کا وقت اب خانے ہیں۔
- اوور ٹائم: پوری ٹیم بشمول لیڈز؛ ایک ساتھ بند دن نشان زد۔

</div>
</details>


## v8.81 — 2026-11-04

- صفحة «ساعات العمل الإضافي» تحت «المؤشرات»: السبت من أول مهمة إلى آخر مهمة أُغلقت، ومن الأحد إلى الخميس بين السابعة مساءً ومنتصف الليل، لكل شخص وبالتفاصيل يومًا بيوم، مع تنزيل CSV. تقدير من أوقات المهام لأن ماي أفاقي لا يسجّل الساعات.
- إعداد إضافة المزامنة صار دليلًا تفاعليًا في صفحة «البيانات»: كل خطوة تتحول إلى علامة صح عند إتمامها، وزر الخطوة الحالية أمامك.
- إصلاح: بعد التحديث كانت بعض النصوص تظهر كأسماء مفاتيح (مثل ext_off) لأن ملف اللغة القديم بقي محفوظًا؛ التحديث يجلب الملفات الجديدة دائمًا الآن.

<details><summary>English</summary>

- The «Overtime hours» page under KPIs: Saturday from the first task to the last task closed, and Sunday to Thursday between 7 PM and midnight, per person with day-by-day details and a CSV download. An estimate from task times, since MyAFAQY records no hours.
- Setting up the sync extension is now an interactive guide on the Data page: each step turns green when done, with the current step’s button in front of you.
- Fix: after an update some texts showed as key names (such as ext_off) because the old language file stayed cached; updates now always fetch the new files.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- «اوور ٹائم گھنٹے» صفحہ: ہفتہ اور اتوار تا جمعرات شام 7 سے آدھی رات، فی فرد اور دن بہ دن، CSV کے ساتھ۔
- سنک ایکسٹینشن کا سیٹ اپ اب انٹرایکٹو گائیڈ ہے۔
- درستی: اپ ڈیٹ کے بعد بعض متن چابی کے ناموں کی صورت دکھتے تھے؛ اب اپ ڈیٹ ہمیشہ نئی فائلیں لاتا ہے۔

</div>
</details>


## v8.80 — 2026-11-04

- إضافة المزامنة لكروم: تُسحب البيانات وحدها عندما تفتح ماي أفاقي (مرة كل 12 ساعة على الأكثر)، أو بضغطة «حدّث الآن» في صفحة «البيانات» فتُفتح ماي أفاقي وتُغلق وحدها. البيانات تبقى في متصفحك.
- الإضافة تشغّل نفس كود زر السحب حرفيًا، وتقرأ فقط ولا تكتب شيئًا في ماي أفاقي. خطوات التثبيت ورابط التنزيل في صفحة «البيانات».

<details><summary>English</summary>

- The sync extension for Chrome: the data is pulled by itself when you open MyAFAQY (at most once every 12 hours), or with one click on «Update now» on the Data page, which opens MyAFAQY and closes it again. The data stays in your browser.
- The extension runs exactly the same code as the pull button, reads only and writes nothing in MyAFAQY. The install steps and the download are on the Data page.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- کروم کے لیے سنک ایکسٹینشن: مائی آفاقی کھولتے ہی ڈیٹا خود کھنچ جاتا ہے، یا ڈیٹا کے صفحے پر «ابھی تازہ کریں» سے ایک کلک میں۔
- ایکسٹینشن وہی کوڈ چلاتی ہے جو پل بٹن، صرف پڑھتی ہے۔

</div>
</details>


## v8.79 — 2026-11-04

- الفرع يأتي من ماي أفاقي: زر السحب و«أنواع الفرق» يأخذان الفرع من صف المدير في قائمة الموظفين، فمدير فرع آخر يسحب فرعه هو. صفحة «البيانات» تذكر الفرع ومصدره.
- إذا تغيّر الفرع بعد السحب، اسحب زر السحب إلى المفضلة من جديد مرة واحدة.

<details><summary>English</summary>

- The branch comes from MyAFAQY: the pull button and «Team types» take the branch from the manager’s own row in the employee list, so another branch’s manager pulls his own branch. The Data page states the branch and its source.
- If the branch changes after a pull, drag the pull button to your bookmarks again once.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- برانچ مائی آفاقی سے: پل بٹن اور «ٹیم کی اقسام» مینیجر کی اپنی قطار سے برانچ لیتے ہیں۔
- برانچ بدلے تو بٹن ایک بار پھر گھسیٹیں۔

</div>
</details>


## v8.78 — 2026-11-04

- «الفريق حسب ماي أفاقي»: اختصار السحب يقرأ الآن قائمة الموظفين (الاسم والقسم والمدير والفرع والحالة فقط، لا جوال ولا هوية)، وفي صفحة الفريق ترى من يتبع من حسب ماي أفاقي والفروق عن ملف الفريق، ومعاينة لما سيتغير قبل أن تعتمده.
- لا يتغير شيء من نفسه: الفريق المحسوب يبقى من ملف الفريق حتى تضغط «اعتمد هيكل ماي أفاقي». مدير بلا ملف فريق يأخذ فريقه من الهيكل مباشرة.
- الاختصار تغيّر: اسحبه من صفحة «البيانات» مرة واحدة من جديد.

<details><summary>English</summary>

- “Team from MyAFAQY”: the pull shortcut now reads the employee list (name, department, manager, branch and status only — never a phone or identity number). The Team page shows who reports to whom in MyAFAQY, the differences from the team file, and a preview of what would change before you use it.
- Nothing changes by itself: the counted team stays on the team file until you press “Use MyAFAQY’s hierarchy”. A manager with no team file takes his team from the hierarchy directly.
- The shortcut changed: drag it from the Data page once more.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- «مائی آفاقی کے مطابق ٹیم»: پل شارٹ کٹ اب ملازمین کی فہرست پڑھتا ہے (صرف نام، شعبہ، مینیجر، برانچ اور حیثیت)، اور ٹیم کے صفحے پر فرق اور پیش منظر نظر آتا ہے۔
- کچھ خود نہیں بدلتا؛ بٹن دبانے تک ٹیم فائل ہی چلتی ہے۔
- شارٹ کٹ بدل گیا ہے: ڈیٹا کے صفحے سے ایک بار پھر گھسیٹیں۔

</div>
</details>


## v8.77 — 2026-11-04

- «مؤشراتي» أقصر بالنصف: جملة واحدة بالجواب وبلاطاتك الست في أول شاشة الجوال، والإعداد والتفاصيل مطوية.
- لوحة المؤشرات أوضح: «أُغلقت في الفترة» و«جديدة في الفترة» ووحدة واحدة للوقت وخمسة أعمدة افتراضيًا. المديرون وقادة الفرق خارج أرقام الفريق افتراضيًا.
- غرفة المتابعة لا تعرض «0» لشهر غير موجود في السحب. صفحة الفريق للقراءة حتى تضغط «تعديل الفريق»، و«البيانات والإعدادات» في قائمة مستقلة.

<details><summary>English</summary>

- My KPIs is half as long: one answer sentence and your six tiles on the first phone screen; setup and details folded.
- A clearer KPI board: “Closed in period” and “New in period”, one time unit, five columns by default. Managers and team leads are out of team figures by default.
- The control room no longer shows “0” for a month the pull does not hold. The Team page reads until you press “Edit team”, and “Data and settings” has its own menu group.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- «میرے اشاریے» آدھا: ایک جملہ اور چھ ٹائلیں فون کی پہلی اسکرین پر۔
- کے پی آئی بورڈ زیادہ واضح؛ مینیجر اور ٹیم لیڈ پہلے سے ٹیم کے اعداد سے باہر۔
- کنٹرول روم غیر موجود مہینے کے لیے «0» نہیں دکھاتا؛ ٹیم کا صفحہ «ٹیم میں ترمیم» تک صرف پڑھنے کے لیے۔

</div>
</details>


## v8.76 — 2026-11-03

- صفحة «البيانات» فيها الآن صندوق واضح «بريد أوتلوك — ملف PST» بزر «ارفع ملف PST»: يُقرأ الملف على جهازك وتفتح نتيجة البريد وحدها.
- صندوق المصدر في «مؤشراتي» أدق: العدد في السحب هو كل ما يظهر لك في ماي أفاقي، والمؤشرات تُحسب من مهامك أنت فقط.

<details><summary>English</summary>

- The Data page now has a clear “Outlook mail — PST file” box with “Upload a PST file”: the file is read on your device and the mail result opens by itself.
- The source box on My KPIs is more precise: the count in the pull is everything MyAFAQY shows you, and the KPIs count your own tasks only.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- ڈیٹا کے صفحے پر اب «آؤٹ لک ای میل — پی ایس ٹی فائل» کا واضح ڈبہ ہے؛ فائل آپ کے آلے پر پڑھی جاتی ہے اور نتیجہ خود کھلتا ہے۔
- ماخذ کا ڈبہ زیادہ درست: اشاریے صرف آپ کے اپنے کاموں سے۔

</div>
</details>


## v8.75 — 2026-11-03

- صفحة جديدة «البريد من ملف PST» (للمدير): ضع ملف PST من أوتلوك فيُقرأ على جهازك ولا يُرفع — من أرسل كم رسالة، وتصنيف رسائل من تختارهم من عنوانها إلى عادي (وصل) أو متقدم (ربط وتكامل) أو بيع إضافي (طلب أو استفسار أو متطلب جديد).
- قواعد التصنيف تعدّلها بنفسك، ونتيجة لكل شخص، وقائمة الرسائل بتصنيفها، ونطاق تاريخ، وتصدير CSV.

<details><summary>English</summary>

- A new page, “Mail from a PST file” (manager): drop an Outlook PST and it is read on your device, never uploaded — who sent how many, and the chosen people’s messages sorted by subject into normal (WASL), advanced (integration) or upselling (a new request, inquiry or requirement).
- Editable classification rules, a result per person, the message list by kind, a date range and a CSV export.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- نیا صفحہ «پی ایس ٹی فائل سے ای میل» (مینیجر): آؤٹ لک کی پی ایس ٹی فائل آپ کے آلے پر پڑھی جاتی ہے — کس نے کتنی بھیجیں اور عنوان سے تین قسمیں۔
- قابلِ ترمیم قواعد، ہر شخص کا نتیجہ، تاریخ کی حد اور سی ایس وی۔

</div>
</details>


## v8.74 — 2026-11-03

- كل قراءة تقول مصدرها: صندوق في أعلى «مؤشراتي» يذكر بالخط العريض من أين جاءت الأرقام (سحبك بتاريخه وعدد مهامه)، وما يدخل في الحساب (المهام المكتملة فقط، بأنواعها وعدد كل نوع)، وما لا يدخل.
- كل بلاطة تفتح بسطر «المصدر:» يصف قراءتها بدقة: المهام التي أُغلقت بين تاريخين، النقاط من الأوزان المنشورة، المعدل، متوسط الساعات، المفتوحة الآن، الواردة من البريد.

<details><summary>English</summary>

- Every reading states its source: a box at the top of My KPIs says in bold where the numbers came from (your pull, its date and task count), what counts (completed tasks only, by type with counts), and what does not.
- Every tile opens with a “Source:” line describing its reading exactly: tasks closed between two dates, points from the published weights, the rate, average hours, open now, from email.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- ہر پڑھائی اپنا ماخذ بتاتی ہے: «میرے اشاریے» کے اوپر ایک ڈبہ جلی حروف میں بتاتا ہے کہ اعداد کہاں سے آئے، کیا شمار ہوتا ہے اور کیا نہیں۔
- ہر ٹائل «ماخذ:» کی سطر کے ساتھ کھلتی ہے۔

</div>
</details>


## v8.73 — 2026-11-03

- صفحة الأوزان أبسط بكثير: لكل نوع رقم تكتبه مباشرة، وعدد مهامه في البيانات، وسطر واحد عن طريقة حسابه. العوامل والطرق والإضافات والقواعد والحاسبة كلها تحت «إعدادات متقدمة» مغلقة.
- النوع الذي تكتب نقاطه مباشرة لم يعد مربوطًا بالعوامل الأربعة، ويظهر في الجدول المتقدم «نقاط محددة مباشرة».

<details><summary>English</summary>

- A far simpler weights page: per type, a number you type directly, how many of it in the data, and one line on how it counts. Factors, methods, extras, rules and the calculator sit under a closed “Advanced settings”.
- A type whose points you type directly is no longer tied to the four factors; the advanced table shows “points set directly”.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- اوزان کا صفحہ بہت آسان: ہر قسم کے لیے عدد براہِ راست لکھیں؛ باقی سب «اعلیٰ ترتیبات» کے نیچے۔
- براہِ راست لکھے پوائنٹس والی قسم اب چار عوامل سے بندھی نہیں۔

</div>
</details>


## v8.72 — 2026-11-02

- صفحة البيانات أبسط: الفترة وخطوتان وآخر سحب في صندوق واحد، وكل الطرق الأخرى والنسخ الاحتياطي تحت «طرق أخرى ونسخ احتياطي» تفتحها عند الحاجة.
- إعداد «مؤشراتي» خطوتان بجملة واحدة لكل خطوة؛ الجوال ونسخ الرمز تحت «على الجوال».

<details><summary>English</summary>

- A simpler data page: the period, two steps and the last pull in one box; every other way and the backup under “Other ways and backup”, opened when needed.
- The My KPIs setup is two one-sentence steps; phone notes and the copy-code under “On a phone”.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- ڈیٹا کا صفحہ آسان: مدت، دو قدم اور آخری ڈیٹا ایک ڈبے میں؛ باقی طریقے اور بیک اپ «دوسرے طریقے اور بیک اپ» کے نیچے۔
- «میرے اشاریے» کی ترتیب دو قدم، ہر قدم ایک جملہ۔

</div>
</details>


## v8.71 — 2026-11-02

- رابط المركز الشخصي يحمل المستوى أيضًا — نفس مستوى ملف الموظف — فيظهر للمهندس الذي لا يرى مهام زملائه مستواه وشريط التقدم وأقرب طريق للصعود، مكتوبًا «من مديرك».
- قبل وصول الرابط يقول مربع المستوى السبب الحقيقي بدل «بعد أول 10 نقاط».

<details><summary>English</summary>

- The personal rank link now carries the level too — the person file’s level — so an engineer who cannot see his colleagues’ tasks sees his level, the progress bar and the shortest way up, marked “from your manager”.
- Before a link arrives, the level box gives the real reason instead of “after the first 10 points”.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- ذاتی نمبر کا لنک اب سطح بھی لاتا ہے — ملازم کی فائل والی سطح — «آپ کے مینیجر سے» کے ساتھ۔
- لنک آنے سے پہلے سطح کا خانہ اصل وجہ بتاتا ہے۔

</div>
</details>


## v8.70 — 2026-11-02

- روابط المراكز الشخصية: في لوحة المؤشرات (تبويب الفريق) وملف الموظف، تنسخ لكل مهندس رسالة فيها رابط بمركزه هو فقط في فريقه، فيظهر في «مكانك وتقدمك» حتى لو لم يرَ مهام زملائه في ماي أفاقي.
- الرابط لا يحمل أسماء ولا أرقام غيره، ويُمسح من شريط العنوان فور فتحه، ولا يُنشر شيء.

<details><summary>English</summary>

- Personal rank links: from the KPI board (team tab) and the person file, copy each engineer a message with a link holding only his own rank in his team, so it shows in “Where you stand” even when he cannot see his colleagues’ tasks in MyAFAQY.
- The link carries no one else’s names or numbers, leaves the address bar as soon as it opens, and nothing is published.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- ذاتی نمبر کے لنکس: کے پی آئی بورڈ (ٹیم ٹیب) اور ملازم کی فائل سے ہر انجینئر کو صرف اس کے اپنے نمبر والا لنک بھیجیں۔
- لنک میں کسی اور کا نام یا عدد نہیں، کھلتے ہی ایڈریس بار سے ہٹ جاتا ہے، اور کچھ شائع نہیں ہوتا۔

</div>
</details>


## v8.69 — 2026-11-02

- «حدّث قائمة الأنواع» في صفحة الأوزان: اختصار خفيف «أنواع الفرق» تضغطه في ماي أفاقي فتعود قائمة أنواع فريقي ما بعد البيع والبحث والتطوير إلى البوابة خلال ثوانٍ — يقرأ الفرق وأنواعها فقط.
- الأنواع الجديدة التي لا وزن لها تظهر بأسمائها في الأوزان وفي «غرفة المتابعة».

<details><summary>English</summary>

- “Update the type list” on the weights page: a light “Team types” bookmark you press in MyAFAQY brings the after-sales and R&D type list back to the portal in seconds — it reads only the teams and their types.
- New types without a weight are named on the weights page and in the control room.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- اوزان کے صفحے پر «اقسام کی فہرست تازہ کریں»: مائی آفاقی میں «ٹیم کی اقسام» دبائیں اور فہرست چند سیکنڈ میں پورٹل پر واپس آ جاتی ہے۔
- بغیر وزن کی نئی اقسام اوزان اور کنٹرول روم میں ناموں کے ساتھ نظر آتی ہیں۔

</div>
</details>


## v8.68 — 2026-11-02

- للمهندس في «مؤشراتي»: بطاقة «مكانك وتقدمك» — ترتيبه في فريقه هذا الشهر («المركز ٣ من ٩») وكم نقطة يتبقى ليتخطى من قبله، وأرقامه القياسية، وإنجازاته، ومستواه وأقرب طريق للتحسن. لا تظهر أسماء الزملاء ولا أرقامهم.

<details><summary>English</summary>

- For the engineer in My KPIs: a “Where you stand” card — his rank in his team this month (“Rank 3 of 9”) and how many points to pass the one above, his records, achievements, and level with the shortest way up. Colleagues’ names and numbers are never shown.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- انجینئر کے لیے «میرے اشاریے» میں «آپ کہاں کھڑے ہیں» کارڈ — ٹیم میں اس ماہ کا نمبر، ریکارڈ، کامیابیاں اور سطح۔ ساتھیوں کے نام اور اعداد کبھی نہیں دکھائے جاتے۔

</div>
</details>


## v8.67 — 2026-11-02

- «كل الأدوات والأنظمة»: قف بالماوس على أي نظام أو أداة تظهر رسالة تقول ماذا يفعل — وعلى الجوال اضغط ⓘ بجانبه.
- صفحة إدارة الروابط فيها خانة وصف (عربي وإنجليزي) لكل رابط؛ كُتب وصف ١٧ نظامًا، والباقي ينتظر وصفك.

<details><summary>English</summary>

- “All tools and systems”: hover over any system or tool to see what it does — on a phone, tap the ⓘ beside it.
- The admin links page has a description field (Arabic and English) per link; 17 systems are described, the rest await your description.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- «تمام ٹولز اور سسٹمز»: کسی بھی سسٹم پر ماؤس رکھیں تو پیغام بتاتا ہے کہ وہ کیا کرتا ہے — فون پر ساتھ والے ⓘ کو دبائیں۔
- لنکس کے انتظامی صفحے میں ہر لنک کے لیے تفصیل کا خانہ۔

</div>
</details>


## v8.66 — 2026-11-02

- «طرقك الخاصة» في قواعد النقاط: اعمل طريقة حساب باسمك — خطوات بالنسبة للوقت المعتاد («لحد X% ← ×Y» بالترتيب) ثم «أكثر ← ×Z» — وتظهر في قائمة الطريقة لكل نوع بجانب الطرق الثلاث، مع شرح خطواتها.
- لو حذفت طريقة مستخدمة، المعاينة تذكر الأنواع التي ستُحسب «بالإنجاز» قبل التطبيق.

<details><summary>English</summary>

- “Your own methods” in the scoring rules: make a calculation method with your own name — steps against the usual time (“up to X% → ×Y” in order) then “more → ×Z” — and it appears in each type’s method list beside the three, with its steps explained.
- Removing a method in use: the preview names the types that will count “on completion” before you apply.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- پوائنٹس کے قواعد میں «آپ کے اپنے طریقے»: اپنے نام سے حساب کا طریقہ بنائیں — معمول کے وقت کے لحاظ سے مراحل — اور یہ ہر قسم کی فہرست میں نظر آتا ہے۔
- استعمال شدہ طریقہ حذف کرنے پر جائزہ بتاتا ہے کہ کون سی اقسام «تکمیل پر» شمار ہوں گی۔

</div>
</details>


## v8.65 — 2026-11-02

- صفحة الأوزان على الجوال: كل نوع مهمة صار بطاقة — اسمه كاملًا في الأعلى، وتحته العوامل والوزن والطريقة وشرحها والوقت المعتاد والعدد والنقاط، كلٌّ باسمه — بلا تمرير جانبي ولا أسماء مقطوعة.

<details><summary>English</summary>

- The weights page on a phone: each task type is now a card — its full name on top, then the factors, weight, method with its explanation, usual time, count and points, each labelled — no sideways scrolling, no cut names.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- فون پر اوزان کا صفحہ: ہر قسم اب ایک کارڈ ہے — اوپر پورا نام، نیچے ہر خانہ اپنے نام کے ساتھ — نہ سائیڈ اسکرول، نہ کٹے نام۔

</div>
</details>


## v8.64 — 2026-11-02

- لكل نوع مهمة ثلاث طرق واضحة: «بالإنجاز» (النقطة كاملة عند الإغلاق)، و«بالسرعة» (×١٫٥ في الوقت المعتاد)، و«بالمقارنة بالمعتاد» بثلاث خطوات: حتى نصف الوقت المعتاد ×١٫٥، حتى ضعفه ×١، أكثر ×٠٫٥ — وتحت كل طريقة جملة تشرحها.
- الوقت المعتاد تحدده لكل نوع، وبجانبه كم أخذ نصف مهامه فعلًا.
- طريقة «الوقت المبذول» أُلغيت لأنها تكافئ التأخير، وأنواعها الخمسة صارت «بالمقارنة بالمعتاد».

<details><summary>English</summary>

- Each task type has three clear methods: “On completion” (the full point on closing), “By speed” (×1.5 within the usual time), and “Against the usual time” in three steps: up to half the usual ×1.5, up to twice ×1, more ×0.5 — with a sentence under each explaining it.
- You set the usual time per type, and beside it how long half its tasks really took.
- The “time spent” method is retired because it rewards delay; its five types now use “against the usual time”.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- ہر قسم کے لیے تین واضح طریقے: «تکمیل پر»، «رفتار سے»، اور «معمول کے وقت سے موازنہ» تین مراحل میں۔
- معمول کا وقت آپ ہر قسم کے لیے طے کرتے ہیں، اور ساتھ دکھایا جاتا ہے کہ اس کے آدھے کام اصل میں کتنے وقت میں ہوئے۔
- «صرف شدہ وقت» کا طریقہ ختم؛ اس کی پانچ اقسام اب «موازنہ» استعمال کرتی ہیں۔

</div>
</details>


## v8.63 — 2026-11-02

- قواعد الإضافة في النقاط صارت بـ«و» و«أو»: كل قاعدة شرط أو أكثر (من البريد، خارج الدوام، يوم إجازة، في الوقت المعياري، شغل ميداني، جهة حكومية أو منصة، أثر تعاقدي) — «كل الشروط مع بعض» أو «أي شرط منها» — ونسبتها. لو انطبقت أكثر من قاعدة: تُجمع أو الأعلى فقط، بحد أقصى.

<details><summary>English</summary>

- Points extras now use AND and OR: each rule has one or more conditions (from email, outside hours, weekend, within standard time, field work, government or platform, contract impact) — “all together” or “any one” — and its percentage. When several match: add up or highest only, under a cap.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- پوائنٹس کے اضافے اب «اور» اور «یا» کے ساتھ: ہر قاعدے میں ایک یا زیادہ شرائط — «تمام ایک ساتھ» یا «کوئی ایک» — اور اس کی شرح۔

</div>
</details>


## v8.62 — 2026-11-02

- على الجوال: «مؤشراتي» للمدير صارت ٨ شاشات بدل ٢٥ (كروت الفريق خرجت منها إلى «التطوير» وملف الموظف)، و«التطوير» ٧ بدل ٢٣ (الاقتراحات والخريطة مطوية).
- كل زر ومربع اختيار صار سهل اللمس (٣٢ بكسل على الأقل)، ولا نص أصغر من ١٢ بكسل.
- صفحة الأدوات على رابط المدير اسمها «كل الأدوات والأنظمة» حتى لا تختلط بمجموعة «أدوات الفريق الفنية»، وأسماء المجموعات بالإنجليزية أوضح.

<details><summary>English</summary>

- On phones: the manager’s My KPIs is now 8 screens instead of 25 (the team’s cards moved to Development and the person file), and Development 7 instead of 23 (suggestions and the map are folded).
- Every button and checkbox is easy to tap (at least 32px), and no text is under 12px.
- On the manager link the tools page is “All tools and systems” so it is not confused with the “Team engineering tools” group, and English group names read more easily.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- فون پر: مینیجر کے میرے اشاریے اب ۲۵ کے بجائے ۸ اسکرینیں، اور ترقی ۲۳ کے بجائے ۷۔
- ہر بٹن اور چیک باکس چھونے میں آسان (کم از کم ۳۲ پکسل)، اور کوئی متن ۱۲ پکسل سے چھوٹا نہیں۔
- مینیجر لنک پر ٹولز کا صفحہ «تمام ٹولز اور سسٹمز»۔

</div>
</details>


## v8.61 — 2026-11-02

- «مؤشراتي» على رابط المدير صارت بياناتك فقط — بلا «فريقي» ولا التنبيهات (مكانها غرفة المتابعة واللوحة وملف الموظف) — وتُبنى من سحب الفريق إن لم يوجد اختصار، فتعمل على الجوال.
- صفحة الأوزان تبدأ بـ«كيف تُحسب النقاط»: الخطوات الأربع بالقيم الحالية، وحاسبة تجرّب عليها أي نوع مهمة.
- قواعد النقاط صارت قابلة للتعديل وتُنشر مع الأوزان: أهمية كل عامل، وحدود الأساس ١–٥، ومضاعف السرعة، وحدود الوقت، وإضافات اختيارية لمهام البريد وخارج الدوام — مع معاينة الأثر قبل التطبيق. القواعد الأصلية تعطي نفس الأرقام تمامًا.

<details><summary>English</summary>

- My KPIs on the manager link is now your data only — no team or alerts tabs (they live in the control room, the board and the person file) — and is drawn from the team pulls when there is no bookmark, so it works on a phone.
- The weights page opens with “How points are counted”: the four steps with the current values, and a calculator to try any task type.
- The scoring rules are now editable and publish with the weights: each factor’s importance, the base 1–5 limits, the speed multiplier, the time limits, and optional extras for email tasks and work outside hours — with a preview before applying. The original rules give exactly the same numbers.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- مینیجر لنک پر میرے اشاریے اب صرف آپ کا ڈیٹا ہے، اور بُک مارک نہ ہو تو ٹیم کے ڈیٹا سے بنتا ہے۔
- اوزان کا صفحہ «پوائنٹس کیسے گنے جاتے ہیں» سے شروع ہوتا ہے، ایک کیلکولیٹر کے ساتھ۔
- پوائنٹس کے قواعد اب قابل تدوین ہیں اور اوزان کے ساتھ شائع ہوتے ہیں — لاگو کرنے سے پہلے اثر کا جائزہ۔ اصل قواعد بالکل وہی اعداد دیتے ہیں۔

</div>
</details>


## v8.60 — 2026-11-01

- «ملف الموظف»: صفحة واحدة لكل موظف تجمع ما كان موزعًا على أربع صفحات — وظيفته ومن يتبع، وأداؤه هذا الشهر مقابل الماضي، ومستواه ومحاوره، وعبؤه ونصيبه من نقاط الفريق، وخطته للربعين، واجتماعاته، وشغله المفتوح — مع «اعرض صفحته كما يراها» وخطته وتقريره.
- اسم أي موظف في لوحة المؤشرات وصفحة الفريق صار رابطًا لملفه: الجداول تبقى للمقارنة، والتفاصيل في مكان واحد.

<details><summary>English</summary>

- “Person file”: one page per person gathering what was spread over four pages — role and leader, this month against last, level and axes, workload and share of the team’s points, both quarters’ plans, meetings and open work — with “View their page as they see it”, their plan and their report.
- Every person’s name on the KPI board and the team page now links to their file: the tables stay for comparing, the details live in one place.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- «فرد کی فائل»: ہر فرد کے لیے ایک صفحہ جو چار صفحوں پر بکھری چیزیں جمع کرتا ہے — عہدہ، کارکردگی، سطح، بوجھ، منصوبے، ملاقاتیں اور کھلا کام۔
- اشاریوں کے بورڈ اور ٹیم صفحے پر ہر نام اب اس کی فائل کا لنک ہے: جدولیں موازنے کے لیے، تفصیل ایک جگہ۔

</div>
</details>


## v8.59 — 2026-11-01

- «غرفة المتابعة» أول صفحة لرابط المدير: حداثة البيانات وزر سحب، وأرقام الشهر مقابل الماضي، و«محتاج انتباهك» (عبء حرج، خطط الربع القادم غير المعتمدة، المهام المفتوحة أكثر من ٧ أيام، الأسماء المنتظرة) — كل بند يفتح صفحته — واختصارات للمهام الأساسية.
- قائمة «المؤشرات» مرتبة حسب الشغل: لوحة المؤشرات، التطوير، الفريق، ثم البيانات والأوزان.

<details><summary>English</summary>

- “Control room” is the manager link’s first page: data freshness with a pull button, this month against last month, “Needs your attention” (critical workload, next quarter’s plans not agreed, tasks open over 7 days, pending names) — each item opens its page — and shortcuts to the main tasks.
- The indicators menu follows the work: KPI board, Development, Team, then Data and Weights.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- «کنٹرول روم» مینیجر لنک کا پہلا صفحہ: ڈیٹا کی تازگی اور کھینچنے کا بٹن، اس ماہ بمقابلہ پچھلا ماہ، «آپ کی توجہ درکار» — ہر نکتہ اپنا صفحہ کھولتا ہے — اور اہم کاموں کے شارٹ کٹس۔
- اشاریوں کا مینو کام کی ترتیب میں: بورڈ، ترقی، ٹیم، پھر ڈیٹا اور اوزان۔

</div>
</details>


## v8.58 — 2026-11-01

- كل صفحة فيها الآن سطر ظاهر تحت عنوانها يقول ما هي وماذا تفعل فيها — بدل الاكتفاء بزر «؟».
- جملة صفحة الفريق صارت واضحة: هذا هو الطلب الوحيد الذي تكتبه البوابة في ماي أفاقي.

<details><summary>English</summary>

- Every page now shows a line under its title saying what it is and what to do there — instead of relying on the “?” button alone.
- The Team page sentence is now clear: this is the only request the portal writes to MyAFAQY.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- اب ہر صفحے کے عنوان کے نیچے ایک سطر ہے جو بتاتی ہے کہ یہ کیا ہے اور یہاں کیا کرنا ہے۔
- ٹیم صفحے کا جملہ واضح: یہ واحد درخواست ہے جو پورٹل مائی آفاقی میں لکھتا ہے۔

</div>
</details>


## v8.57 — 2026-11-01

- «اعرض كـ» في «مؤشراتي» (رابط المدير): اختر موظفًا فترى صفحته كما يراها هو — بطاقة اليوم والمؤشرات الستة وشغله المفتوح — للقراءة فقط، مع شريط يوضح صفحة من وزر خروج. قائد الفريق يظهر بعرض فريقه.

<details><summary>English</summary>

- “View as” in My KPIs (manager link): pick a team member to see their page exactly as they see it — the Today card, the six indicators and their open work — read only, with a banner naming whose page it is and an exit. A team leader shows with his team view.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- «بطور دیکھیں» میرے اشاریوں میں (مینیجر لنک): کسی رکن کو منتخب کریں اور ان کا صفحہ ویسے ہی دیکھیں جیسا وہ دیکھتے ہیں — صرف پڑھنے کے لیے، اوپر پٹی اور باہر نکلنے کا بٹن۔

</div>
</details>


## v8.56 — 2026-11-01

- على الجوال (خاصة الآيفون): القائمة الجانبية تتمرر وحدها حتى آخرها — اللغة والوضع وتثبيت التطبيق — والصفحة خلفها ثابتة، وعند إغلاقها تعود الصفحة لمكانها.

<details><summary>English</summary>

- On phones (especially iPhone): the side menu scrolls on its own to the bottom — language, theme and install — while the page behind stays still, and closing it returns the page to where it was.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- فون پر (خاص طور پر آئی فون): سائیڈ مینو خود نیچے تک اسکرول ہوتا ہے — زبان، تھیم اور انسٹال — پیچھے کا صفحہ رکا رہتا ہے، اور بند کرنے پر صفحہ اپنی جگہ لوٹ آتا ہے۔

</div>
</details>


## v8.55 — 2026-11-01

- حُذف رابط «Mardam Makkah» المكرر من أنظمة أفاقي، ويبقى «Makkah Mardam» في المشاريع ونسك.
- ورقة تعريف الفريق بلا صفحات المدير: ست صفحات، ومعها مؤشرات «مؤشراتي» الستة.

<details><summary>English</summary>

- The duplicate “Mardam Makkah” link was removed from AFAQY systems; “Makkah Mardam” stays under Projects and Nusuk.
- The team overview leaves out the manager pages: six pages, plus the six indicators of My KPIs.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- دہرا «Mardam Makkah» لنک آفاقی سسٹمز سے ہٹا دیا؛ «Makkah Mardam» پروجیکٹس اور نسک میں رہتا ہے۔
- ٹیم تعارف میں مینیجر کے صفحات نہیں: چھ صفحات، اور میرے اشاریوں کے چھ اشاریے۔

</div>
</details>


## v8.54 — 2026-10-31

- أسرع: الحسابات الثقيلة (المستويات وعبء العمل وبطاقات الشهر) تُحسب مرة وتُحفظ حتى تتغير البيانات — بداتا سنة: إعادة فتح التطوير من ٠٫٦٥ ثانية إلى لحظي، ولوحة المؤشرات من ٠٫٣٩ إلى ٠٫١٦.
- تعديل هدف في التطوير صار فوريًّا (كان يجمّد الصفحة ثانية كاملة بداتا سنة).
- القوائم الطويلة تعرض ٢٠٠ صف وزر «عرض المزيد» بعدد المتبقي — بدل قطعها بصمت عند ٤٠٠.
- الخطوط أخف بنحو الثلث، وحُذف ملف غير مستخدم.

<details><summary>English</summary>

- Faster: the heavy computations (levels, workload, monthly cards) run once and are kept until the data changes — with a year of data, reopening Development went from 0.65 s to instant and the KPI board from 0.39 to 0.16 s.
- Editing a goal in Development is instant (it froze the page for a full second with a year of data).
- Long lists show 200 rows and a “show more” button with the count left — instead of silently cutting at 400.
- Fonts are about a third lighter, and an unused file was removed.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- تیز: بھاری حسابات (سطحیں، کام کا بوجھ، ماہانہ کارڈز) ایک بار ہو کر ڈیٹا بدلنے تک محفوظ رہتے ہیں۔
- ترقی میں ہدف کی ترمیم اب فوری ہے۔
- لمبی فہرستیں ۲۰۰ سطریں اور «مزید دکھائیں» بٹن باقی تعداد کے ساتھ دکھاتی ہیں۔
- فونٹس تقریباً ایک تہائی ہلکے، اور ایک غیر استعمال شدہ فائل حذف۔

</div>
</details>


## v8.53 — 2026-10-31

- ورقة التعريف على رابط الفريق نسخة للفريق بلا رابط المدير (بالعربية والإنجليزية)، ورابط المدير يبقى بالنسخة الكاملة.

<details><summary>English</summary>

- On the team link the overview is a team edition without the manager link (Arabic and English); the manager link keeps the full edition.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- ٹیم لنک پر تعارف ٹیم ایڈیشن ہے، مینیجر لنک کے بغیر (عربی اور انگریزی)؛ مینیجر لنک پر مکمل ایڈیشن۔

</div>
</details>


## v8.52 — 2026-10-31

- ورقة التعريف بالعربية والإنجليزية: «عرض» و«تحميل» يفتحان النسخة بلغة القارئ، والنسخة الأخرى بجانبهما.

<details><summary>English</summary>

- The overview in Arabic and English: “View” and “Download” open the reader’s language, with the other version beside them.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- تعارف عربی اور انگریزی میں: «دیکھیں» اور «ڈاؤن لوڈ» قاری کی زبان کھولتے ہیں، دوسرا ورژن ساتھ میں۔

</div>
</details>


## v8.51 — 2026-10-31

- «جديد على البوابة؟» — ورقة تعريف في صفحتين بزرّي عرض وتحميل، أعلى الرئيسية و«مؤشراتي» (حيث يفتح رابط الفريق) وفي «الدليل»، ويمكن إخفاؤها.
- صفحة إدارة الروابط: بعد «حفظ ونشر للجميع» تتابع البوابة الحية وتقول «✓ ظهرت للجميع» لحظة ظهور التعديل، بدل «قد يستغرق دقائق».

<details><summary>English</summary>

- “New to the portal?” — a two-page overview with View and Download, at the top of Home and My KPIs (where the team link opens) and in the Guide; it can be hidden.
- Manage links: after “Save and publish”, the page watches the live portal and says “✓ Live for everyone” the moment the change appears, instead of “may take minutes”.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- «پورٹل میں نئے ہیں؟» — دو صفحوں کا تعارف دیکھنے اور ڈاؤن لوڈ کے بٹنوں کے ساتھ، ہوم اور میرے اشاریوں کے اوپر اور گائیڈ میں؛ چھپایا جا سکتا ہے۔
- لنکس کا انتظام: «محفوظ اور شائع» کے بعد صفحہ لائیو پورٹل دیکھتا ہے اور تبدیلی ظاہر ہوتے ہی «✓ سب کے لیے لائیو» بتاتا ہے۔

</div>
</details>


## v8.50 — 2026-10-31

- صفحة «التطوير» تحت المؤشرات: خطة كل موظف للربع الجاي — خط أساس من شغله في الربع السابق، وأهداف مقترحة من شغله وأضعف محاوره، ومتابعة تلقائية من شغله الجاري، وزميل مرجع وإجراءات تطوير، واعتماد الخطة.
- الاجتماع الشهري واقتراحات الشهر وخريطة الفريق انتقلت إلى «التطوير» في مكان واحد، وروابط إليها من لوحة المؤشرات ومؤشراتي.
- تصدير خطط الفريق إكسل، وPDF لخطة كل موظف بخانات التوقيع.

<details><summary>English</summary>

- A “Development” page under the indicators: each person’s plan for next quarter — a baseline from their previous quarter, goals suggested from their work and weakest axes, automatic follow-up from current work, a reference colleague, development actions, and agreeing the plan.
- The monthly meeting, this month’s suggestions and the team map moved to “Development” in one place, with links from the KPI board and My KPIs.
- Team plans export to Excel, and each person’s plan to a PDF with signature lines.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- اشاریوں کے تحت «ترقی» کا صفحہ: اگلی سہ ماہی کے لیے ہر فرد کا منصوبہ — پچھلی سہ ماہی سے بنیاد، اس کے کام اور کمزور محور سے تجویز کردہ اہداف، جاری کام سے خودکار پیروی، حوالہ ساتھی اور منصوبے کی منظوری۔
- ماہانہ ملاقات، اس ماہ کی تجاویز اور ٹیم نقشہ «ترقی» میں ایک جگہ۔
- ٹیم منصوبے ایکسل میں، اور ہر فرد کا منصوبہ دستخط کے ساتھ PDF میں۔

</div>
</details>


## v8.49 — 2026-10-31

- جداول «مشاريعي» تتسع للشاشة: أعمدة بعرض ثابت والنص الطويل يلتف على سطرين — بلا تمرير يمين ويسار.
- كل نافذة في البوابة لها شريط علوي بزر ✕ يبقى ظاهرًا وأنت تمرر داخلها.

<details><summary>English</summary>

- The “My projects” tables fit the screen: fixed column widths and long text wraps — no sideways scrolling.
- Every window in the portal has a top bar with ✕ that stays visible as you scroll inside it.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- «میرے پروجیکٹس» کی جدولیں اسکرین میں سما جاتی ہیں: مقررہ چوڑائی اور لمبا متن لپٹ جاتا ہے — دائیں بائیں اسکرول نہیں۔
- پورٹل کی ہر کھڑکی میں اوپر ✕ والی پٹی جو اندر اسکرول کرتے ہوئے نظر آتی رہتی ہے۔

</div>
</details>


## v8.48 — 2026-10-31

- «مشاريعي» ثلاث صفحات: «المشاريع من البريد» تراجع فيها كل محادثة (✓ صحيح · ✎ تصحيح · 🔗 ضم · ✕ غلط)، و«قدّمنا عليها» بقيمتها في قسمين: عملاء — عروض تجارية، ومشاريع كبيرة ومناقصات، و«أين أقف»: قدّمنا وكسبنا ومعنا ونفّذنا وخسرنا.
- إكسل حقيقي بأربع أوراق: عدّل فيه واستورده فتُطبَّق التعديلات (واكتب «احذف» في الحالة للحذف).
- ملفات لكل مشروع: العرض الفني والمالي والصور — على جهازك وفي النسخة الاحتياطية.
- حالتان جديدتان بعد الكسب: «معنا — قيد التنفيذ» و«نفّذناه».

<details><summary>English</summary>

- “My projects” has three pages: “Projects from mail” to review every thread (✓ right · ✎ fix · 🔗 join · ✕ wrong), “What we bid on” with values in two groups — clients (commercial offers) and large projects and tenders — and “Where I stand”: bid, won, with us, delivered, lost.
- A real Excel file with four sheets: edit it and import it back to apply the changes (write “delete” as the status to delete).
- Files per project: technical and financial offers and photos — on your device and in the backup.
- Two new statuses after a win: “with us — in execution” and “delivered”.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- «میرے پروجیکٹس» تین صفحات: «میل سے پروجیکٹس» ہر گفتگو کا جائزہ (✓ درست · ✎ ترمیم · 🔗 جوڑیں · ✕ غلط)، «جن پر بولی دی» قدر کے ساتھ دو حصوں میں — گاہک اور بڑے پروجیکٹس و ٹینڈرز — اور «میں کہاں کھڑا ہوں»۔
- چار شیٹس والی حقیقی ایکسل فائل: ترمیم کر کے واپس درآمد کریں۔
- ہر پروجیکٹ کی فائلیں: تکنیکی و مالی پیشکش اور تصاویر — آپ کے آلے پر اور بیک اپ میں۔
- جیت کے بعد دو نئی حالتیں: «زیرِ عمل» اور «مکمل»۔

</div>
</details>


## v8.47 — 2026-10-31

- «مشاريعي» بطاقة واحدة تفتح طبقة كاملة: لوحة تفتح كل رقم فيها كروتًا للمشاريع خلفه، وقائمة بالسحب والإفلات وتعديل وحذف وربط لكل صف، والعملاء، وتصدير إكسل، وتقرير PDF يضع كل مشروع تحت حالته.
- أضف مشروعًا جديدًا أو عدّل أي مشروع (الاسم والعميل والحالة والقيمة والتاريخ والملاحظات)، وحالة «خسرناها» جديدة.
- «سحب جديد من البريد» ينسخ برومبت يبدأ من آخر سحب ويتجاوز ما جُمع، والملف الجديد يُدمج بلا تكرار.

<details><summary>English</summary>

- “My projects” is one card that opens a full layer: a dashboard where every figure opens the projects behind it as cards, a list with drag-and-drop and edit / delete / link per row, the clients, Excel export, and a PDF report that places each project under its status.
- Add a new project or edit any (name, client, status, value, date, notes); a new “Lost” status.
- “New pull from mail” copies a prompt that starts after the last pull and skips what is collected; the new file merges without duplicates.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- «میرے پروجیکٹس» ایک کارڈ جو پوری تہہ کھولتا ہے: ڈیش بورڈ جس کا ہر عدد اپنے پروجیکٹس کارڈز میں کھولتا ہے، فہرست میں گھسیٹ کر ترتیب اور ہر سطر پر ترمیم / حذف / جوڑ، گاہک، ایکسل برآمد اور PDF رپورٹ۔
- نیا پروجیکٹ شامل کریں یا کسی میں بھی ترمیم کریں؛ نئی حالت «ہارے»۔
- «میل سے نئی کھینچ» آخری کھینچ کے بعد سے پرامپٹ کاپی کرتا ہے اور جمع شدہ چھوڑ دیتا ہے؛ نئی فائل بغیر دہرائے ضم ہوتی ہے۔

</div>
</details>


## v8.46 — 2026-10-31

- «مشاريعي» بثلاث نوافذ: لوحة المعلومات (اشتغلت عليها ← درسناها ← قدّمنا عليها ← كسبناها، مع نسبة الفوز وقيمة المكسوب مقابل هدف السنة والمقدَّم قيد المتابعة) والقائمة (تصفية بالحالة وتصدير بموضوع البريد) والعملاء.
- سجل المشاريع ملف يُستورد على جهازك فقط — من عرض الإدارة ولوحة ما قبل البيع — ويُربط بمحادثات البريد تلقائيًّا.

<details><summary>English</summary>

- “My projects” has three views: Dashboard (worked on → studied → submitted → won, with the win rate, value won against the year target and the pipeline), List (status filters, export with the mail header) and Clients.
- The projects register is a file imported on your device only — from the management deck and the presales board — and is linked to the mail threads automatically.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- «میرے پروجیکٹس» تین منظر: ڈیش بورڈ (کام کیا ← مطالعہ ← جمع کرایا ← جیتا، جیت کی شرح اور سال کے ہدف کے ساتھ)، فہرست (حالت فلٹر، میل ہیڈر کے ساتھ برآمد) اور گاہک۔
- پروجیکٹس رجسٹر صرف آپ کے آلے پر درآمد ہونے والی فائل ہے اور خودبخود میل سے جڑتی ہے۔

</div>
</details>


## v8.45 — 2026-10-31

- «مشاريعي من البريد» في «مؤشراتي ← أنا»: استورد الملف الذي يُخرجه كلود في كروم من أوتلوك، فترى عدد المشاريع واللي اشتغلت عليها، ونشاطها شهريًّا، وبحثًا وتصفية وتصديرًا — على جهازك فقط.

<details><summary>English</summary>

- “My projects from email” under My KPIs → Me: import the file Claude in Chrome builds from Outlook to see the projects and those you worked on, activity per month, search, filters and export — on your device only.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- «میرے اشاریے ← میں» میں «ای میل سے میرے پروجیکٹس»: کروم میں کلاڈ کی آؤٹ لک سے بنائی فائل درآمد کریں — پروجیکٹس، جن پر کام کیا، ماہانہ سرگرمی، تلاش، فلٹر اور برآمد — صرف آپ کے آلے پر۔

</div>
</details>


## v8.44 — 2026-10-31

- دليل «محلل المناقصات» فيه الآن زر تحميل البرنامج (شيربوينت — بحساب آفاقي).

<details><summary>English</summary>

- The Tender Analyzer manual now has the program’s download button (SharePoint — AFAQY account).

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- «ٹینڈر تجزیہ کار» گائیڈ میں اب پروگرام کا ڈاؤن لوڈ بٹن ہے (شیئرپوائنٹ — آفاقی اکاؤنٹ)۔

</div>
</details>


## v8.43 — 2026-10-31

- لوحة المؤشرات صارت أربع تبويبات: نظرة عامة · الفريق · البريد · التقارير — بدل عشرة أقسام في تمرير واحد.
- تقارير الإدارة في تبويب «التقارير»: «ملخص الفريق — صفحتان» و«التقرير الكامل — كل موظف» والنسخة التفاعلية، و«PDF» بجانب كل اسم.
- بطاقة «اليوم» أعلى مؤشراتي للجميع: تحية، وسلسلة أيام الإنجاز، وأمس مقابل متوسطك، وأسبوعك مقابل أفضل أسبوع لك، وأقدم مفتوح تبدأ به، وهدف الفريق الأسبوعي.
- تنظيف: طريقة نشر واحدة للأوزان، ولا ذكر لأي مفتاح أو مستودع فيما يراه الفريق.

<details><summary>English</summary>

- The KPI board is four tabs — Overview · Team · Email · Reports — instead of ten sections in one scroll.
- Management reports live in the Reports tab: “Team summary — two pages”, “Full report — every employee” and the interactive version, with “PDF” beside each name.
- A “Today” card tops My KPIs for everyone: a greeting, your streak of completion days, yesterday against your average, this week against your best, the oldest open item to start with, and the team’s weekly goal.
- Clean-up: one publish path for weights, and nothing the team reads mentions a key or a repository.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- اشاریوں کا بورڈ اب چار ٹیبز: جائزہ · ٹیم · ای میل · رپورٹس۔
- انتظامیہ کی رپورٹس «رپورٹس» ٹیب میں: «ٹیم خلاصہ — دو صفحات»، «مکمل رپورٹ — ہر ملازم» اور تعاملی ورژن۔
- «آج» کارڈ سب کے لیے میرے اشاریوں کے اوپر: سلام، تکمیل کے دنوں کا سلسلہ، کل بمقابلہ اوسط، ہفتہ بمقابلہ بہترین، سب سے پرانا کھلا کام، اور ٹیم کا ہفتہ وار ہدف۔
- صفائی: اوزان کی اشاعت کا ایک راستہ، اور ٹیم کے سامنے کسی کلید یا ریپوزٹری کا ذکر نہیں۔

</div>
</details>


## v8.42 — 2026-10-31

- التقرير للإدارة أوضح للتقييم: تقييم عام لكل مهندس (يفوق التوقعات · يحقق · يحقق جزئيًّا · دون التوقعات) بمؤشر من ١٠٠، وكل رقم مقابل متوسط الفريق، ومصفوفة أداء (الحجم × الجودة)، وتوزيع التقييمات، وتوصيات. وعبء العمل بمسميات الشركة (متوازن · مرتفع — يُتابَع · حرج — يتطلب إجراء)، ومن في إجازة لا يُقيَّم.
- دليل استخدام «محلل المناقصات» صفحة في البوابة (في «أدوات أخرى»).
- إصلاح: عند تحديث الصفحة لم تعد تظهر لثوانٍ بالإنجليزية أو بأسماء الأزرار الخام.

<details><summary>English</summary>

- The management report reads more as an evaluation: an overall rating per engineer (Exceeds · Meets · Partially meets · Below expectations) with a 0–100 gauge, every figure against the team average, a performance matrix (volume × quality), the rating distribution, and recommendations. Workload in company wording (balanced · high — monitor · critical — action required), and anyone on leave is not rated.
- The Tender Analyzer user manual is a page in the portal (under “Other tools”).
- Fix: on refresh the page no longer flashes in English or with raw button labels.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- انتظامیہ کی رپورٹ اب جائزے جیسی: ہر انجینئر کا مجموعی درجہ (توقعات سے بڑھ کر · پورا · جزوی · کم) ۱۰۰ کے پیمانے پر، ہر عدد ٹیم اوسط کے مقابلے میں، کارکردگی میٹرکس، درجات کی تقسیم اور سفارشات۔ چھٹی پر کسی کو درجہ نہیں۔
- «ٹینڈر تجزیہ کار» کی گائیڈ پورٹل میں ایک صفحہ ہے («دیگر ٹولز» میں)۔
- درستی: صفحہ تازہ کرنے پر اب انگریزی یا خام بٹن نام نظر نہیں آتے۔

</div>
</details>


## v8.41 — 2026-10-31

- «تقارير للإدارة» في لوحة المؤشرات: اختر الفترة والأشخاص، ثم «تقرير الفريق — PDF» بهوية أفاقي (غلاف، ملخص تنفيذي، مقارنة، وصفحة لكل مهندس بمستواه ومحاوره ونقاطه وإيقاعه وحِمله)، أو «PDF» بجانب أي اسم لتقريره وحده، أو النسخة التفاعلية HTML للإرسال.
- صفحة إدارة الروابط تتذكر المفتاح على جهازك وتفتح وحدها.
- كل البطاقات تُرتَّب بالسحب: أدوات الرئيسية، مربعات مؤشراتي، بطاقات الفريق، البطاقات الشهرية، وبطاقات الخطة.

<details><summary>English</summary>

- “Reports for management” on the KPI board: choose the period and the people, then “Chosen team report — PDF” in AFAQY’s identity (cover, executive summary, comparison, and a page per engineer with level, axes, points, rhythm and load), “PDF” beside any name for that person alone, or the interactive HTML version to send.
- The links admin page remembers the key on your device and opens by itself.
- Every card list is ordered by drag: home tools, My KPIs tiles, team cards, monthly cards and plan cards.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- اشاریوں کے بورڈ پر «انتظامیہ کے لیے رپورٹس»: مدت اور افراد چنیں، پھر آفاقی کی شناخت میں «منتخب ٹیم کی رپورٹ — PDF»، کسی نام کے ساتھ «PDF» صرف اس کے لیے، یا بھیجنے کے لیے تعاملی HTML ورژن۔
- لنکس کا ایڈمن صفحہ آپ کے آلے پر کلید یاد رکھتا اور خود کھلتا ہے۔
- ہر کارڈ فہرست گھسیٹ کر ترتیب پاتی ہے۔

</div>
</details>


## v8.40 — 2026-10-31

- «نشر الأوزان للفريق» في صفحة الأوزان: يفتح صفحة الإدارة، تلصق المفتاح وتضغط «نشر الآن» — فتُحسب نقاط الجميع بأوزانك في اللوحة وكل الملفات الشخصية.
- النقاط في «مؤشراتي» تجمع المهام وأنشطة سجل الأنشطة معًا.
- بطاقات الفريق (في «فريقي» والبطاقات الشهرية) تُرتَّب بالسحب والإفلات، والترتيب يبقى على جهازك.
- «النقاط الموزونة» صارت «النقاط»، و«اللقاء» صار «الاجتماع الشهري». وتحت اسمك: «معايا: ما بعد البيع · ما قبل البيع · البحث والتطوير · المشاريع».

<details><summary>English</summary>

- “Publish the weights to the team” on the Weights page: it opens the admin page, you paste the key and press “Publish now” — everyone’s points follow your weights on the board and in every profile.
- Points in My KPIs count tasks and activity-log entries together.
- Team cards (in “My team” and the monthly cards) are ordered by drag and drop, and the order stays on your device.
- “Weighted points” are now “points”, and the one-to-one is “the monthly meeting”. Under your name: “With me: After-sales · Presales · R&D · Projects”.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- اوزان کے صفحے پر «اوزان ٹیم کے لیے شائع کریں»: ایڈمن صفحہ کھلتا ہے، کلید چسپاں کر کے «ابھی شائع کریں» — بورڈ اور ہر پروفائل میں سب کے پوائنٹس آپ کے اوزان سے۔
- «میرے اشاریے» میں پوائنٹس ٹاسکس اور سرگرمیوں کے لاگ کو ساتھ گنتے ہیں۔
- ٹیم کارڈز («میری ٹیم» اور ماہانہ کارڈز) گھسیٹ کر ترتیب دیے جاتے ہیں، ترتیب آپ کے آلے پر رہتی ہے۔
- «وزنی پوائنٹس» اب «پوائنٹس»، اور ملاقات اب «ماہانہ اجلاس»۔ آپ کے نام کے نیچے: «میرے ساتھ: بعد از فروخت · پری سیلز · تحقیق و ترقی · پروجیکٹس»۔

</div>
</details>


## v8.39 — 2026-10-31

- صفحة الفريق: زر ✕ بجانب كل شخص لحذفه من الفريق — يختفي من كل الصفحات ومن team.json الذي تنزّله.
- «الوحدات» صار اسمها «أدوات الفريق الفنية»، والأدوات الخمس في الرئيسية بطاقات فيها ما تفعله و«كيف يساعد» — ونفس الشرح عند المرور عليها في القائمة الجانبية.
- «⚙ إدارة الروابط» صار في آخر «أنظمة الشركة» في القائمة الجانبية (للمدير).
- فحص الروابط على GitHub يعيد المحاولة، ولا يعتبر موقعًا خارجيًّا لم يرد للحظة خطأً — فلا تصلك رسائل فشل بلا سبب.

<details><summary>English</summary>

- Team page: a ✕ beside each person removes them from the team — gone from every page and from the team.json you download.
- “Modules” is now “Team engineering tools”, and the five tools on the home page are cards with what they do and “How it helps” — the same text on hover in the side menu.
- “⚙ Manage links” now sits at the end of “Company systems” in the side menu (manager only).
- The link check on GitHub retries, and an outside site that misses one request is no longer a failure — no more failure emails without cause.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- ٹیم صفحہ: ہر فرد کے ساتھ ✕ اسے ٹیم سے ہٹاتا ہے — ہر صفحے اور آپ کی ڈاؤن لوڈ کردہ team.json سے غائب۔
- «ماڈیولز» اب «ٹیم کے فنی ٹولز» ہے، اور ہوم پیج پر پانچوں ٹولز کارڈز ہیں جن میں ان کا کام اور «کیسے مدد کرتا ہے» — سائیڈ مینو میں ماؤس لانے پر وہی متن۔
- «⚙ لنکس کا انتظام» اب سائیڈ مینو میں «کمپنی سسٹمز» کے آخر میں ہے (صرف مینیجر)۔
- GitHub پر لنکس کی جانچ دوبارہ کوشش کرتی ہے، اور ایک لمحے کو جواب نہ دینے والی بیرونی سائٹ اب ناکامی نہیں — بلاوجہ ناکامی کی ای میلز نہیں۔

</div>
</details>


## v8.38 — 2026-10-31

- «الوسيط» اختفى من البرنامج كله — مقياس الوقت الوحيد صار «متوسط مدة الإنجاز» في اللوحة والمؤشرات والجداول.
- مربعات «مؤشراتي» و«مؤشرات فريقي»: المنجزة · النقاط الموزونة · نسبة الإنجاز · متوسط مدة الإنجاز · المفتوحة الآن · من البريد.
- كل نافذة فيها عرضان: «لوحة المعلومات» (لكل شخص، حسب نوع المهمة، النقاط حسب النوع، حسب الأسبوع) و«القائمة» بالنوع والنقاط — مع التصدير.
- إشارة «مؤشراتي» تنقل نوع المهمة الآن — اسحبها من جديد.

<details><summary>English</summary>

- “Median” is gone from the whole program — the only time measure is now “Average duration”, on the board, in My KPIs and in the tables.
- The “My indicators” and “My team’s indicators” tiles: done · weighted points · completion · average duration · open now · from email.
- Every window has two views: “Information board” (per person, by task type, points by type, by week) and “The list” with type and points — with export.
- The My KPIs bookmark now carries the task type — drag it again.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- «درمیانی قدر» پورے پروگرام سے ہٹ گئی — وقت کا واحد پیمانہ اب «اوسط مدت» ہے، بورڈ، اشاریوں اور جدولوں میں۔
- «میرے اشاریے» اور «میری ٹیم کے اشاریے» کے خانے: مکمل · وزنی پوائنٹس · تکمیل کی شرح · اوسط مدت · ابھی کھلے · ای میل سے۔
- ہر ونڈو کے دو منظر: «معلوماتی بورڈ» (ہر فرد، ٹاسک کی قسم، قسم کے لحاظ سے پوائنٹس، ہفتہ وار) اور «فہرست» قسم اور پوائنٹس کے ساتھ — برآمد سمیت۔
- «میرے اشاریے» بک مارک اب ٹاسک کی قسم بھیجتا ہے — دوبارہ گھسیٹیں۔

</div>
</details>


## v8.37 — 2026-10-31

- مجموعة «التطوير» صار اسمها «النقابة».
- صفحة إدارة الروابط: بجانب كل رابط قائمة لنقله إلى أي مجموعة وسهمان ↑ ↓ لترتيبه — بلا سحب — وقلم ✎ بجانب كل مجموعة لتسميتها بنفسك. والسحب بالمقبض ⠿ ما زال متاحًا.
- صفحة الفريق: «بانتظار الظهور» — قائمة بالأسماء على جهازك، ويُضاف كل شخص للفريق تلقائيًّا بمنصبه وقائده أول ما يظهر في سحب.

<details><summary>English</summary>

- The “Development” group is now called “Naqaba”.
- Links admin page: beside each link, a list to move it to any group and ↑ ↓ to order it — no dragging — and a ✎ beside each group to name it yourself. Dragging by the ⠿ handle still works.
- Team page: “Waiting to appear” — a names list on your device; each person joins the team with their position and leader the first time they appear in a pull.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- «ڈویلپمنٹ» گروپ کا نام اب «نقابہ» ہے۔
- لنکس ایڈمن صفحہ: ہر لنک کے ساتھ کسی بھی گروپ میں منتقل کرنے کی فہرست اور ترتیب کے لیے ↑ ↓ — گھسیٹے بغیر — اور ہر گروپ کے ساتھ ✎ تاکہ خود نام دیں۔ ⠿ سے گھسیٹنا اب بھی کام کرتا ہے۔
- ٹیم صفحہ: «ظاہر ہونے کے منتظر» — آپ کے آلے پر ناموں کی فہرست؛ ہر فرد پہلی بار کھینچنے میں آتے ہی اپنے عہدے اور لیڈر کے ساتھ ٹیم میں شامل۔

</div>
</details>


## v8.36 — 2026-10-31

- «مؤشراتي» للقادة صارت لوحة بثلاث تبويبات: «أنا» و«فريقي» و«تنبيهات». في «أنا» و«فريقي» ستة مربعات تُطوى بسهم، وكل مربع يفتح نافذة فيها التفاصيل وزر تصدير. وفي «فريقي» بطاقة لكل شخص تفتح مربعاته وشغله.
- صفحة الفريق مقسّمة بالأقسام: الإدارة، ما بعد البيع، البحث والتطوير. ولوحة التعيين تعرض قسم ما بعد البيع فقط.

<details><summary>English</summary>

- “My KPIs” for leaders is a dashboard with three tabs: “Me”, “My team” and “Alerts”. In “Me” and “My team”, six tiles fold under an arrow, and every tile opens a window with the detail and an export button. In “My team”, a card per person opens their tiles and work.
- The Team page is grouped by department: management, after-sales, R&D. The assignment panel lists the after-sales department only.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- لیڈرز کے لیے «میرے اشاریے» اب تین ٹیبز والا ڈیش بورڈ ہے: «میں»، «میری ٹیم» اور «انتباہات»۔ «میں» اور «میری ٹیم» میں چھ خانے تیر سے تہہ ہوتے ہیں، اور ہر خانہ تفصیل اور برآمد بٹن والی ونڈو کھولتا ہے۔ «میری ٹیم» میں ہر فرد کا کارڈ اس کے خانے اور کام کھولتا ہے۔
- ٹیم صفحہ شعبوں میں تقسیم: انتظامیہ، بعد از فروخت، تحقیق و ترقی۔ تفویض پینل صرف بعد از فروخت شعبہ دکھاتا ہے۔

</div>
</details>


## v8.35 — 2026-10-31

- أُضيف «Nusuk Card — Live Feed» و«Nusuk Card — Test» إلى «المشاريع ونسك».

<details><summary>English</summary>

- “Nusuk Card — Live Feed” and “Nusuk Card — Test” are added under “Projects and Nusuk”.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- «Nusuk Card — Live Feed» اور «Nusuk Card — Test» «پروجیکٹس اور نسک» میں شامل کیے گئے۔

</div>
</details>


## v8.34 — 2026-10-31

- لوحة التعيين تعرض فريقك كما في البوابة، بلا أي اختيار مسبق — تختار بنفسك من تضيفه ومن تزيله.
- صفحة الفريق: اختفت قائمة «آخرون ظهروا في البيانات»، ومكانها خانة «إضافة للفريق برقم ماي أفاقي». وبجانب كل اسم ✎ لتصحيح الاسم على جهازك.
- مجموعة جديدة «التطوير» فيها بوابة دخول Transportic، وIOPGPS صار «AFAQY A1 — IOPGPS». وفي صفحة إدارة الروابط تسحب أي رابط وتفلته في مجموعته.
- عنوان الصفحة والإشارات يوضح لمن هي: «المدير — …» و«الفريق — …».

<details><summary>English</summary>

- The assignment panel lists your team as set in the portal, with nothing pre-ticked — you choose whom to add and whom to remove.
- Team page: the “others seen in the data” list is gone, replaced by “Add to the team by myafaqy id”. A ✎ beside each name corrects it on your device.
- A new “Development” group holds the Transportic sign-in console, and IOPGPS is now “AFAQY A1 — IOPGPS”. On the links admin page, drag any link and drop it into its group.
- The page title and the bookmarks say who they are for: “Manager — …” and “Team — …”.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- تفویض پینل پورٹل میں آپ کی ٹیم دکھاتا ہے، کچھ پہلے سے منتخب نہیں — آپ خود چنتے ہیں کسے شامل اور کسے ہٹانا ہے۔
- ٹیم صفحہ: «ڈیٹا میں نظر آنے والے دوسرے» کی فہرست ہٹ گئی، اس کی جگہ «مائی آفاقی آئی ڈی سے ٹیم میں شامل کریں»۔ ہر نام کے ساتھ ✎ اسے آپ کے آلے پر درست کرتا ہے۔
- نیا گروپ «ڈویلپمنٹ» میں Transportic سائن اِن کنسول، اور IOPGPS اب «AFAQY A1 — IOPGPS»۔ لنکس کے ایڈمن صفحے پر کوئی بھی لنک گھسیٹ کر اس کے گروپ میں چھوڑیں۔
- صفحے کا عنوان اور بک مارکس بتاتے ہیں کس کے لیے ہیں: «مینیجر — …» اور «ٹیم — …»۔

</div>
</details>


## v8.33 — 2026-10-31

- السحب الأحدث يحل محل الأقدم: لو سحبت الشهر يوم ١٥ ثم يوم ٢٠، تبقى فترة واحدة بآخر بيانات. وزر ✕ بجانب قائمة الفترات في اللوحة يحذف أي فترة لا تريدها.
- «فترة السحب» في صفحة البيانات: اختر هذا الشهر، أو أي ربع من آخر أربعة، أو سنة كاملة، أو تاريخين بنفسك — والإشارتان تتجهزان للفترة على الفور.

<details><summary>English</summary>

- A newer pull replaces the older: pull the month on the 15th and again on the 20th, and one period remains with the latest data. A ✕ beside the board’s period list deletes any period you don’t want.
- “Pull period” on the Data page: choose this month, any of the last four quarters, a full year, or two dates of your own — and both bookmarks are ready for that period at once.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- نیا کھینچا پرانے کی جگہ لیتا ہے: مہینہ ۱۵ کو اور پھر ۲۰ کو کھینچیں تو تازہ ڈیٹا کے ساتھ ایک ہی مدت رہتی ہے۔ بورڈ پر مدتوں کی فہرست کے ساتھ ✕ کوئی بھی ناپسند مدت حذف کرتا ہے۔
- ڈیٹا کے صفحے پر «کھینچنے کی مدت»: یہ مہینہ، پچھلی چار میں سے کوئی سہ ماہی، پورا سال، یا اپنی دو تاریخیں چنیں — اور دونوں بک مارکس فوراً اسی مدت کے لیے تیار۔

</div>
</details>


## v8.32 — 2026-10-31

- قائمة «أنظمة الشركة» الجانبية صارت منظمة: كل فئة مجموعة تُطوى وحدها (مغلقة افتراضيًّا، واحدة مفتوحة في كل مرة) وبجانبها عدد أنظمتها، والصفوف أصغر، وسهم الفتح بجانب الاسم، ورابط «كل الأنظمة في الرئيسية» في آخرها.

<details><summary>English</summary>

- The side menu’s “Company systems” is organised: each category is its own fold-away group (closed by default, one open at a time) with its count beside it, rows are tighter, the open-in-new-tab arrow sits beside the name, and “All systems on the home page” closes the list.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- سائیڈ مینو کا «کمپنی سسٹمز» منظم ہو گیا: ہر زمرہ اپنا تہہ ہونے والا گروپ ہے (طے شدہ طور پر بند، ایک وقت میں ایک کھلا) اور ساتھ اس کی تعداد، قطاریں چھوٹی، نیا ٹیب تیر نام کے ساتھ، اور آخر میں «ہوم پیج پر تمام سسٹمز»۔

</div>
</details>


## v8.31 — 2026-10-31

- أُضيف IOPGPS وبوابة دخول Transportic Online إلى «الموردون وبوابات الأجهزة».

<details><summary>English</summary>

- IOPGPS and the Transportic Online sign-in console are added under “Vendors and device portals”.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- IOPGPS اور Transportic Online کا سائن اِن کنسول «وینڈرز اور ڈیوائس پورٹلز» میں شامل کیے گئے۔

</div>
</details>


## v8.30 — 2026-10-31

- «استدامة الحِمل» على لوحة المؤشرات — للمدير فقط: إشارات مبكرة على الضغط قبل أن يتحول لإرهاق أو استقالة. لكل شخص في آخر ٤ أسابيع: نسبة شغله خارج الدوام، وفي الجمعة والسبت، وبعد ٩ مساءً، وهل يزيد؛ وحِمل المهندس مقارنة بزملائه. وحالة (مستدام، راقِب، يحتاج تدخلًا) ومقترح عملي: كم نقطة تُحوَّل ولمن، أو مراجعة ساعات العمل، أو تفويض القائد.

<details><summary>English</summary>

- “Load sustainability” on the KPI board — manager only: early signals of strain before it turns into burnout or resignation. For each person over the last 4 weeks: the share of work after hours, on Fri/Sat and after 9 pm, and whether it is rising; and an engineer’s load against peers. A status (sustainable, watch, needs action) and a practical suggestion: how many points to move and to whom, a review of working hours, or delegation for a leader.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- اشاریوں کے بورڈ پر «بوجھ کی پائیداری» — صرف مینیجر کے لیے: تھکن یا استعفے سے پہلے دباؤ کے ابتدائی اشارے۔ پچھلے ۴ ہفتوں میں ہر فرد کے لیے: اوقات کے بعد، جمعہ/ہفتہ اور رات ۹ کے بعد کام کا حصہ، اور کیا یہ بڑھ رہا ہے؛ اور انجینئر کا بوجھ ساتھیوں کے مقابلے میں۔ حالت (پائیدار، نظر رکھیں، کارروائی درکار) اور عملی تجویز: کتنے پوائنٹس کسے منتقل کریں، اوقاتِ کار کا جائزہ، یا لیڈر کے لیے تفویض۔

</div>
</details>


## v8.29 — 2026-10-31

- كل وزن صار له أساس مكتوب: أربعة معايير (العمق الفني، الطرف الخارجي، الشغل الميداني، الأثر) كلٌّ من ٠ إلى ٢، تعطي الأساس من ١ إلى ٥. وثلاث طرق للحساب: «إنجاز» للروتيني، «إنجاز + سرعة» (×١٫٥ لو قُفلت في الوقت المعياري)، و«وقت» للشغل الذي يختلف حجمه (بين النصف والضعف، بساعات العمل). كله يتعدّل من صفحة الأوزان، والأوقات المعيارية المعلّمة «تقدير» تحتاج مراجعتك.

<details><summary>English</summary>

- Every weight now has a written basis: four factors (technical depth, outside party, field work, impact), each 0 to 2, give the base from 1 to 5. And three methods: “On completion” for routine work, “Completion + speed” (×1.5 if closed within the standard time), and “By time” for work whose size varies (half to double, in working hours). All editable on the Weights page; standards marked “estimate” need your review.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- ہر وزن کی اب لکھی ہوئی بنیاد ہے: چار معیار (فنی گہرائی، بیرونی فریق، میدانی کام، اثر)، ہر ایک ۰ سے ۲، بنیاد ۱ سے ۵ دیتے ہیں۔ اور حساب کے تین طریقے: معمول کے کام کے لیے «تکمیل پر»، «تکمیل + رفتار» (معیاری وقت میں بند ہو تو ×۱٫۵)، اور بدلتے حجم والے کام کے لیے «وقت کے حساب سے» (آدھے سے دوگنا، کام کے گھنٹوں میں)۔ سب اوزان کے صفحے سے قابلِ ترمیم؛ «اندازہ» والے معیاری اوقات آپ کے جائزے کے منتظر۔

</div>
</details>


## v8.28 — 2026-10-31

- «مستواي» في مؤشراتي: لكل مهندس كل ربع سنة أربعة محاور مقارنة بزملائه تحت القائد نفسه — الحجم والصعوبة والسرعة والالتزام — ودرجة ومستوى (مبتدئ، ممارس، متخصص، مرجع) واتجاه وتوقّع. وعلى لوحة المؤشرات «مستوى الفريق» للمدير، ومعه خطة تطوير لكل مهندس لا يراها غيره.
- شيلنا الشرح الثابت من كل الصفحات؛ الشرح التفاعلي في زر «؟» و«إرشادي خطوة بخطوة».

<details><summary>English</summary>

- “My level” on My KPIs: each quarter, every engineer gets four axes against peers under the same leader — volume, difficulty, speed and reliability — with a score, a level (Starter, Practitioner, Specialist, Reference), a trend and a forecast. On the KPI board, “Team levels” for the manager, with a development plan per engineer that only he sees.
- Static explanations are gone from every page; the interactive help stays in the “?” button and the step-by-step guide.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- «میرے اشاریے» میں «میری سطح»: ہر سہ ماہی ہر انجینئر کو اسی لیڈر کے ساتھیوں کے مقابلے میں چار محور — حجم، مشکل، رفتار اور پابندی — نمبر، سطح (ابتدائی، عملی، ماہر، حوالہ)، رجحان اور پیش گوئی کے ساتھ۔ اشاریوں کے بورڈ پر مینیجر کے لیے «ٹیم کی سطحیں»، ہر انجینئر کے ترقی کے منصوبے کے ساتھ جو صرف وہ دیکھتا ہے۔
- ہر صفحے سے مستقل وضاحتیں ہٹا دی گئیں؛ تعاملی مدد «؟» بٹن اور مرحلہ وار رہنما میں ہے۔

</div>
</details>


## v8.27 — 2026-10-31

- «مؤشراتي» أخف: شيلنا الشرح والتطمينات (ما يُقرأ، والسطور تحت العناوين)، وخطوة الإعداد صارت سطرًا واحدًا. الشرح موجود لمن يريده في زر «؟».

<details><summary>English</summary>

- “My KPIs” is leaner: the explanations and reassurances (what is read, the lines under the headings) are gone, and the setup step is one line. The “?” button still explains for anyone who wants it.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- «میرے اشاریے» ہلکا ہو گیا: وضاحتیں اور یقین دہانیاں (کیا پڑھا جاتا ہے، عنوانوں کے نیچے کی سطریں) ہٹا دی گئیں، اور ترتیب کا قدم ایک سطر ہے۔ «؟» بٹن اب بھی جو چاہے اس کے لیے وضاحت کرتا ہے۔

</div>
</details>


## v8.26 — 2026-10-30

- أُضيف «روبوت أفاقي» إلى أنظمة أفاقي، و«سيرفر VPN مايل سايت — نسك» إلى المشاريع ونسك بموافقة المدير.

<details><summary>English</summary>

- “Afaqy Robot” is added under Afaqy systems, and “Milesight VPN server — Nusuk” under Projects and Nusuk, with the manager’s approval.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- «آفاقی روبوٹ» آفاقی سسٹمز میں، اور «مائل سائٹ VPN سرور — نسک» منصوبے اور نسک میں مینیجر کی منظوری سے شامل کیا گیا۔

</div>
</details>


## v8.25 — 2026-10-30

- سنة كاملة بأرباعها: «نصيب كل شخص» و«ردود الإيميل» فيهما الآن اختيار أي ربع من آخر أربعة، وعرض «سنة» يضع الأرباع الأربعة جنبًا إلى جنب لكل شخص. قراءة الصندوق تغطي آخر سنة. وربط وصل صار من الإيميلات السهلة، إلا إذا جاء معه كلام ربط برمجي حقيقي.

<details><summary>English</summary>

- A full year by quarter: “Each person’s share” and “Email replies” now let you pick any of the last four quarters, and a “Year” view puts the four quarters side by side for each person. The inbox read covers the last year. WASL linking now counts as an easy email, unless real integration words come with it.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- سہ ماہیوں کے ساتھ پورا سال: «ہر فرد کا حصہ» اور «ای میل جوابات» میں اب پچھلی چار میں سے کوئی بھی سہ ماہی چنیں، اور «سال» کا منظر ہر فرد کے لیے چاروں سہ ماہیاں ساتھ ساتھ رکھتا ہے۔ ان باکس پچھلے سال تک پڑھا جاتا ہے۔ وصل ربط اب آسان ای میل شمار ہوتا ہے، جب تک اس کے ساتھ حقیقی انضمام کے الفاظ نہ ہوں۔

</div>
</details>


## v8.24 — 2026-10-30

- «ردود الإيميل — من صندوقك» على لوحة المؤشرات: بتسجيل دخولك بحساب مايكروسوفت تقرأ البوابة صندوق الوارد عندك (قراءة فقط) وتعرض لكل شخص عدد ردوده ونصيبه، والمحادثات التي رد فيها، ونسبة الصعب منها (ربط وتكامل وطلبات جديدة)، ووسيط وقت أول رد — يوم أو أسبوع أو شهر أو ربع سنة. نص الإيميلات لا يُحفظ، ومفتاح الدخول لا يُحفظ.

<details><summary>English</summary>

- “Email replies — from your inbox” on the KPI board: sign in with your Microsoft account and the portal reads your inbox (read-only), then shows for each person their replies and share, the threads they answered, the hard share among them (integration, new requests), and the median time to the first reply — by day, week, month or quarter. Email text is never stored, and neither is the sign-in token.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- اشاریوں کے بورڈ پر «ای میل جوابات — آپ کے ان باکس سے»: اپنے مائیکروسافٹ اکاؤنٹ سے سائن اِن کریں تو پورٹل آپ کا ان باکس پڑھتا ہے (صرف پڑھنا)، پھر ہر فرد کے جوابات اور حصہ، جواب دی گئی گفتگو، ان میں مشکل کا حصہ (ربط، نئی درخواستیں)، اور پہلے جواب کا وسط وقت دکھاتا ہے — دن، ہفتہ، مہینہ یا سہ ماہی کے حساب سے۔ ای میل کا متن کبھی محفوظ نہیں ہوتا، نہ ہی سائن اِن ٹوکن۔

</div>
</details>


## v8.23 — 2026-10-30

- لوحة المؤشرات تبدأ الآن بـ«نصيب كل شخص من شغل الفريق»: نسبة كل واحد من المنجز، بفلتر يوم أو أسبوع (من الأحد للسبت) أو شهر أو ربع سنة — بالنقاط الموزونة أو بعدد المهام أو بمهام الإيميل وحدها، مع النصيب المتساوي وتمييز الأعلى والأقل منه بوضوح.

<details><summary>English</summary>

- The KPI board now opens with “Each person’s share of the team’s work”: everyone’s percentage of what was completed, filtered by day, week (Sunday to Saturday), month or quarter — by weighted points, by task count, or by email tasks alone, with the even share shown and those well above or below it marked.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- اشاریوں کا بورڈ اب «ٹیم کے کام میں ہر فرد کا حصہ» سے شروع ہوتا ہے: مکمل کام میں ہر ایک کا فیصد، دن، ہفتہ (اتوار سے ہفتہ)، مہینہ یا سہ ماہی کے فلٹر کے ساتھ — وزنی پوائنٹس، ٹاسک کی تعداد، یا صرف ای میل ٹاسک کے حساب سے، برابر حصہ دکھا کر اور اس سے بہت اوپر یا نیچے والوں کو نمایاں کر کے۔

</div>
</details>


## v8.22 — 2026-10-30

- الإنجليزية صارت اللغة الافتراضية للبوابة ولرابط الفريق. من اختار العربية أو الأردية من قبل تبقى لغته كما هي، والتغيير من قائمة اللغة في أسفل القائمة الجانبية.

<details><summary>English</summary>

- English is now the portal’s default language, for the admin and team links alike. Anyone who already chose Arabic or Urdu keeps their language; switch any time from the language list at the bottom of the side menu.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- انگریزی اب پورٹل اور ٹیم لنک دونوں کی طے شدہ زبان ہے۔ جس نے پہلے عربی یا اردو چنی تھی اس کی زبان وہی رہتی ہے؛ سائیڈ مینو کے نیچے زبان کی فہرست سے کسی بھی وقت بدلیں۔

</div>
</details>


## v8.21 — 2026-10-30

- أُزيل رابط دخول VPN لمشروع نسك من قائمة الأنظمة المنشورة — كان عنوانه الداخلي ظاهرًا في المستودع العام. والحارس يرفض الآن أي رابط منشور بعنوان IP أو اسم داخلي.
- «روابطي الخاصة» تحت أنظمة الشركة: للعناوين الداخلية مثل بوابات VPN وصفحات إدارة الأجهزة. تُحفظ على جهازك فقط ولا تُنشر أبدًا، وتنتقل مع النسخة الاحتياطية الكاملة.

<details><summary>English</summary>

- The Nusuk project’s VPN login link is removed from the published systems list — its internal address was visible in the public repository. The guard now refuses any published link with an IP address or an internal name.
- “My private links” under company systems: for internal addresses such as VPN portals and device admin pages. Kept on your device only, never published, and carried by the full backup.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- نسک منصوبے کا VPN لاگ اِن لنک شائع شدہ سسٹمز کی فہرست سے ہٹا دیا گیا — اس کا اندرونی پتہ عوامی ریپوزٹری میں نظر آ رہا تھا۔ گارڈ اب IP پتے یا اندرونی نام والا کوئی بھی شائع شدہ لنک رد کرتا ہے۔
- کمپنی سسٹمز کے نیچے «میرے نجی لنکس»: VPN پورٹلز اور آلات کے انتظامی صفحات جیسے اندرونی پتوں کے لیے۔ صرف آپ کے آلے پر، کبھی شائع نہیں، اور مکمل بیک اپ کے ساتھ منتقل۔

</div>
</details>


## v8.20 — 2026-10-30

- إدارة روابط الأنظمة وتصنيفاتها ونشرها للفريق من صفحة الإدارة باستخدام GitHub.

<details><summary>English</summary>

- Manage system links and categories and publish them to the team from an administration page using GitHub.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- انتظامی صفحے سے GitHub کے ذریعے سسٹم لنکس اور زمرے منظم کریں اور ٹیم کے لیے شائع کریں۔

</div>
</details>


## v8.19 — 2026-10-30

- توضيح اسم رابط OpenVPN ضمن المشاريع ونسك.

<details><summary>English</summary>

- Clarified the OpenVPN link name under Projects and Nusuk.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- پروجیکٹس اور نسک میں اوپن وی پی این لنک کا نام واضح کیا گیا ہے۔

</div>
</details>


## v8.18 — 2026-10-30

- إضافة رابط نظام نسك ضمن روابط المشاريع ونسك.

<details><summary>English</summary>

- Added the Nusuk system link under Projects and Nusuk.

</details>

<details><summary>اردو</summary>

<div dir="rtl">

- پروجیکٹس اور نسک کے زمرے میں نسک سسٹم کا لنک شامل کیا گیا ہے۔

</div>
</details>


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
