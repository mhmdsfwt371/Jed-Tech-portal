# سياسة الأمن — Security policy

## بالعربية
- **الإبلاغ عن ثغرة:** لا تفتح بلاغًا عامًّا. استعمل الإبلاغ الخاص عن الثغرات في جيتهب: تبويب *Security* في هذا
  المستودع ← *Report a vulnerability*. إن لم يظهر الزر، راسل مالك المستودع عبر ملفه على جيتهب.
- **ما نطلبه:** وصف الأثر، وخطوات إعادة الإنتاج، ورقم النسخة (أسفل كل صفحة). لا تُرفق بيانات أشخاص حقيقيين.
- **ما نلتزم به:** إقرار خلال ٥ أيام عمل، وإصلاح حسب الخطورة عبر دورة الإصدار المعتادة.
- **النطاق:** الصفحة (`index.html`، `app.js`، `core.js`، `config.js`)، وعامل الخدمة (`sw.js`)، وسير جيتهب.
  خارج النطاق: ماي أفاقي وأفاقي برو وكلود كروم وجيتهب نفسها.
- **بالتصميم:** المستودع عام ولا يحمل أسرارًا. البوابة لا تخزن كلمات سر ولا رموز دخول، ولا ترسل أي بيانات —
  ما يُرفع إليها يبقى في متصفح من رفعه.

## English
- **Reporting:** do not open a public issue. Use GitHub private vulnerability reporting: the *Security* tab →
  *Report a vulnerability*. If it is not visible, contact the owner through their GitHub profile.
- **Please include:** impact, reproduction steps and the version (bottom of every page). No real personal data.
- **Commitment:** acknowledgement within 5 working days; fixes ride the normal release cycle.
- **Scope:** the page (`index.html`, `app.js`, `core.js`, `config.js`), the service worker (`sw.js`) and the GitHub
  workflows. Out of scope: myafaqy, Afaqy PRO, Claude in Chrome and GitHub themselves.
- **By design:** the repository is public and holds no secrets. The portal stores no passwords or tokens and sends
  no data — whatever is uploaded stays in the uploader's browser.
