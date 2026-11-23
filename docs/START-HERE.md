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
| `docs/decisions/0000-template.md` | قالب سجل قرار |
| `docs/decisions/0001-static-no-firebase.md` | بوابة ثابتة بلا فايربيز |
| `docs/decisions/0002-crm-through-claude-in-chrome.md` | بيانات ماي أفاقي عبر كلود كروم |
| `docs/decisions/0003-fixed-exchange-format.md` | صيغة تبادل نملكها |
| `docs/decisions/0004-data-on-device.md` | البيانات على الجهاز |
| `docs/decisions/0005-languages-and-manual.md` | ثلاث لغات بالمعنى، ودليل لكل نسخة |
| `docs/decisions/0006-factor1-on-the-capture.md` | المؤشر الأول على ما يحمله ماي أفاقي فعلًا |
| `docs/decisions/0007-modules.md` | الأدوات وحدات داخل البوابة، لا روابط |
| `docs/decisions/0008-side-menu.md` | قائمة جانبية على نسق برج تحكم البحث والتطوير |
| `docs/decisions/0009-service-management-design.md` | نظام تصميم «إدارة الخدمات» بدل برج التحكم |
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
| `docs/decisions/0024-animated-my-kpis-tour.md` | المتصفح التجريبي المتحرك في دليل «مؤشراتي» |
| `docs/decisions/0024-system-categories.md` | 0024 — تصنيف روابط الأنظمة |
| `docs/decisions/0025-published-weights-and-task-breakdown.md` | نقاط كل مهندس من الأوزان المعتمدة ونشر مراجعات المدير |
| `docs/decisions/0025-shared-system-links.md` | 0025 — إدارة روابط الأنظمة المشتركة |
| `docs/decisions/0026-manager-dual-ingestion.md` | طريقان لسحب بيانات الفريق: شبه أوتوماتيكي ويدوي |
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
| `docs/decisions/0037-management-reports.md` | Management reports: branded PDF and interactive HTML |
| `docs/decisions/0038-board-tabs-today-card.md` | Board in tabs; two report files; the Today card |
| `docs/decisions/0039-projects-from-mail.md` | My projects from email — imported, device only |
| `docs/decisions/0040-development-page.md` | «التطوير» — quarter development plans in one page |
| `docs/decisions/0041-performance.md` | Performance: remembered results, partial redraws, paged lists, WOFF2 |
| `docs/decisions/0042-view-as.md` | «اعرض كـ» — the manager sees one person's page as they see it |
| `docs/decisions/0043-control-room.md` | «غرفة المتابعة» — the manager's first page |
| `docs/decisions/0044-person-file.md` | «ملف الموظف» — superseded by 0070: a person's month opens in his row on the board |
| `docs/decisions/0045-points-rules-and-my-page.md` | Editable scoring rules; the manager's «مؤشراتي» is his own |
| `docs/decisions/0046-clarity-and-phone.md` | Clarity and phone pass, measured |
| `docs/decisions/0047-extra-rules-and-or.md` | Extra rules with AND / OR |
| `docs/decisions/0048-three-methods.md` | Three clear methods per task type; «against the usual time» in steps |
| `docs/decisions/0049-weights-cards-on-phone.md` | Weights tables as cards on a phone |
| `docs/decisions/0050-own-methods.md` | The manager's own calculation methods |
| `docs/decisions/0051-tool-descriptions.md` | Tool descriptions on hover |
| `docs/decisions/0052-where-you-stand.md` | The engineer's rank, records, achievements and level |
| `docs/decisions/0053-team-types-bookmark.md` | «أنواع الفرق» — update the task-type list from myafaqy |
| `docs/decisions/0054-personal-rank-links.md` | Personal rank links — each engineer's rank sent by his manager |
| `docs/decisions/0055-simpler-data-page.md` | A simpler data page and KPI setup |
| `docs/decisions/0056-plain-weights-page.md` | A plain weights page — points typed directly |
| `docs/decisions/0057-reading-sources.md` | Every reading says where it comes from |
| `docs/decisions/0058-mail-from-pst.md` | Mail from a PST file — senders and three kinds |
| `docs/decisions/0059-easier-portal-clearer-numbers.md` | An easier portal and clearer numbers (study results) |
| `docs/decisions/0060-team-from-myafaqy-hierarchy.md` | The team from MyAFAQY's own hierarchy (employee list) |
| `docs/decisions/0061-branch-from-the-account.md` | The pull's branch from the manager's own MyAFAQY row |
| `docs/decisions/0062-sync-extension.md` | The sync extension: the same pull as the bookmark, by itself or in one click |
| `docs/decisions/0063-overtime-and-fresh-updates.md` | Overtime from task times; updates fetch fresh files; every unit test runs |
| `docs/decisions/0064-flexible-weights-and-honest-overtime.md` | Weights as fields with a counting period; overtime for the whole team, marked as a minimum |
| `docs/decisions/0065-every-task-counts-once.md` | Every task counts once across overlapping pulls |
| `docs/decisions/0066-tasks-per-person.md` | Tasks per person by month or quarter, with manual and email closing averages |
| `docs/decisions/0067-one-source-definition-and-the-task-dashboard.md` | One source definition, one engine, the tasks dashboard, and where each number lives |
| `docs/decisions/0068-one-pst-place-and-a-guard-that-reports-last.md` | One place to read a PST; every page named; the guard reports last |
| `docs/decisions/0069-team-table-titles-in-both-languages.md` | The team table: both titles editable, real people only, aligned cells |
| `docs/decisions/0070-one-monthly-place-for-every-employee.md` | One monthly place for every employee; no number in two places |
| `docs/decisions/0071-team-planner-on-the-managers-device.md` | «Team plans» on his device only (its cut revised by 0072) |
| `docs/decisions/0072-my-kpis-and-team-kpis.md` | «My KPIs» = me, «Team KPIs» = the team without me, one personal view; the structure file shown as uploaded |
| `docs/decisions/0073-sixteen-old-suites-and-what-they-found.md` | The old failing suites: stale vs real; four faults fixed (preview, ✕ language, «me» known late, open work) |
| `docs/decisions/0074-month-or-quarter-on-both-kpi-pages.md` | Month or quarter on «My KPIs» and «Team KPIs», each compared with the one before |
| `docs/decisions/0075-rd-column-and-mail-counted-once.md` | R&D column back («—» when unknown); a PST counts each e-mail once; the mail page says how it counts |
| `docs/decisions/0076-mail-rules-visible-before-the-file.md` | The mail page shows its rules and how it counts before any file is chosen |
| `docs/decisions/0077-mail-categories-are-the-managers.md` | Mail categories: add, name, reorder, remove in the portal; carried by the backup |
| `docs/decisions/0078-weekly-message-phone-link-and-flag.md` | Weekly message and phone link (his month and week, no setup); ⚑ «this number looks wrong» |
| `docs/decisions/0079-live-bento-look.md` | «Live bento» look: asphalt and AFAQY green, bento summaries with real-number visuals, Cairo type, motion that answers |
| `docs/decisions/0080-one-place-for-the-mail-file.md` | The mail file has one place (the menu); the card on «Data» is gone |
| `docs/decisions/0081-tender-register.md` | Tender register: tender mails once (from a.ibrahim or «كراسة الشروط»), his status and dates, month/quarter/year, Excel |
| `docs/decisions/0082-tender-register-three-ways-in.md` | Tender register: a pull period, a bookmark for Claude in Chrome, a PST read on the device, and by hand |
| `docs/decisions/0083-tender-lifecycle.md` | Tender lifecycle: stages with reasons, Etimad dates and figures, countdown, calendar file, the period's numbers |
| `docs/decisions/0084-tender-alerts-and-weekly-management-message.md` | Tender alerts on the control room; the weekly management message |
| `docs/decisions/0085-tender-register-compact-and-phone-cards.md` | Tender register: compact pull bar; cards on a phone |
| `docs/decisions/0086-light-moving-lines-and-the-tender-pipeline.md` | The tender pipeline (counts, running lines, red pulse, click to filter); title lines, page sweep, glows |
| `docs/decisions/0087-phone-audit-my-kpis-and-data.md` | Phone audit: no false «month before» on the phone link; all columns on screen; numbers first; «Data» on a phone |
| `docs/decisions/0088-tender-register-any-assistant.md` | Tender register with any assistant (Claude or ChatGPT): paste the result |
| `docs/decisions/0089-readable-fields-and-arabic-order.md` | Fields in the portal's colours; softer night text; Arabic phrases that keep their order |
| `docs/decisions/0090-number-windows-and-authorship.md` | Control-room numbers open detail windows (bars, list, Excel); authorship marks, not ownership |
| `docs/decisions/0091-pointer-light-and-credit-wording.md` | Pointer light on everything you can press; one credit wording |
| `docs/decisions/0092-tender-register-feeds-my-projects.md` | Tenders submitted/won/lost count in «My projects», once; closest-match rule |
| `docs/decisions/0093-three-mail-pulls-said-plainly.md` | The three mail pulls: what each answers, where it goes in, where it shows |
| `docs/decisions/0094-team-pulse-and-full-history.md` | Team pulse on the control room; About's whole history; one Close per window |
| `docs/decisions/0095-large-pst-extractor-and-manager-inbox-indicator.md` | Large PSTs through the local extractor; «Email Activity — Manager Inbox» indicator |
| `docs/decisions/0096-big-pst-goes-to-the-extractor.md` | A PST too big for the browser goes straight to the extractor |
| `docs/decisions/0097-browser-pst-up-to-5gb-and-extractor-path-fix.md` | Browser reads a PST up to 5 GB from the disk; extractor 1.0.2 opens any Windows path |
| `docs/decisions/0098-light-on-touch-always-and-pst-lock-named.md` | Light under mouse and finger, always (a design rule, guarded); a PST locked by Outlook is named |
| `docs/decisions/0099-mail-kept-own-words-search-alias.md` | Mail reads kept and built on; classified by the sender's own words; search; aliases |
| `docs/decisions/0100-person-dashboard-and-booklet-from-anyone.md` | Person KPIs as an interactive dashboard; a booklet from anyone, even a forward |
| `docs/decisions/0101-tooltip-policy-and-project-imports.md` | **The tooltip policy (design rule)**; «My projects» imports in four kinds; the projects pull |
| `docs/decisions/0102-cards-filter-one-place-per-number.md` | Every card filters (mouse and finger); one place per number; the chart's MTTR strip |
| `docs/decisions/0103-sync-my-devices.md` | Sync the laptop and the phone: an encrypted file through the share sheet, merged on arrival |
| `docs/decisions/0104-sync-extension-says-why-it-waits.md` | «Update now»: the extension waits for the sign-in and says why it waits |
| `docs/decisions/0105-page-help-steps-after-sales.md` | Each after-sales page's «?» gives its numbered steps |
| `docs/decisions/0106-review-vendored-excel-a11y-touch-tooltips.md` | The 2026-11 review: Excel library current and local, accessibility guard, touch tooltips; what is left for a decision |
| `docs/decisions/0107-publish-only-the-app.md` | The website publishes the app's files only (docs, tests, scripts stay private); the Mail Extractor downloads from the site |
| `docs/decisions/0108-myafaqy-key-renewal.md` | The MyAFAQY pulls wait for a valid key and renew on a rejection (extension 1.0.2) |
| `docs/decisions/0109-outlook-box-removed-actions-node24.md` | The Outlook box and its Microsoft sign-in removed; workflows on Node 24 actions |
| `docs/decisions/0110-team-pull-for-any-account.md` | The team pull works for any MyAFAQY account: only the tasks list is essential (extension 1.0.3) |
| `docs/decisions/0111-monthly-readings.md` | «Monthly readings»: the proposal's measurement basis for any pulled month; the workbook correction; the lost working environment and `tests/browser/` |
| `docs/decisions/0112-engineer-page-and-readings-clarity.md` | The walk-through as an engineer and a team lead: the wrong rank, the phone layout, the wording; what was left for a later decision |
| `docs/decisions/0113-team-median-on-the-engineers-tiles.md` | The team's median beside the engineer's own numbers; who counts as his team; the three-person floor; state of the recovered suites |
| `docs/decisions/0114-direction-d-on-the-engineers-page.md` | Direction D: now → month against the median → next step → rhythm calendar; motion; open-task ages counted to the data's date |
| `docs/decisions/0115-whose-device-on-the-manager-link.md` | A pull names its account; the manager link shows that person, not the team-file manager; uploads never change the owner; «This is my account» |
| `docs/decisions/0116-the-team-follows-the-owner.md` | The team pages show the people under the device's owner (MyAFAQY's employees list, else the team file); an engineer's pull survives a refused R&D queue |
| `docs/design.md` | ألوان الهوية ودرجاتها، فاتح وداكن |
| `docs/crm-api.md` | مسارات ماي أفاقي وحقوله وما لا يُستعمل منها — من التقاط ٢٨ أكتوبر |
| `scripts/check-commit-title.mjs` | فحص عنوان الالتزام |
| `scripts/check-links.mjs` | كل أداة تفتح وما زالت هي نفسها — على جيتهب و`npm run links` |
| `scripts/build-preview.py` | ملف واحد للمعاينة في `dist/` |
| `tests/core.test.mjs` | اختبارات المنطق |
| `tests/browser/` و`scripts/browser-suites.mjs` | اختبارات المتصفح كلها بأمر واحد: `npm run test:browser` — ومنها `audit.py` الذي يفتح كل نوافذ البوابة (القرار 0129) |
| `docs/qa-policy.md` | سياسة الجودة: ما معنى «تم»، وما الذي يُفحص مع كل تعديل، وكيف يُكتب التقرير |
| `.githooks/` · `.github/workflows/verify.yml` | البوابة محليًّا وعلى جيتهب |
| `docs/decisions/` | سجل القرارات |
| `docs/decisions/0117-tender-register-email-files.md` | Outlook messages, deadlines and files in the Tender Register |
| `docs/decisions/0118-project-followup-reports.md` | Separate project execution, local history and a common filtered report snapshot |
| `docs/decisions/0118-tender-document-evidence.md` | Local document excerpts, table previews, file categories and deadline sources |
| `docs/decisions/0119-long-windows-turn-into-pages.md` | Any window with more than 1.5 screens of content opens in pages; nothing is cut between pages; short windows unchanged |
| `docs/decisions/0120-after-sales-accounts-board.md` | The Team page shows MyAFAQY’s whole Jeddah accounts list: totals, segments, accounts per engineer, and systems by customer from two server lists joined by exact address |
| `docs/decisions/0121-tasks-per-day-and-start-limit.md` | Control room table per day: arrived, closed same day / later, not started, past the manager’s start limit (working-hour clock), started and open, cancelled |
| `docs/decisions/0122-tender-details-in-a-window.md` | Tender details open in a window; fields the stage needs are marked «to fill»; site visit and bid opening read like the other two dates |
| `docs/decisions/0123-sections-as-cards.md` | A long page’s secondary sections become cards that open in one window; started on Team KPIs |
| `docs/decisions/0124-first-start-times.md` | The manager pull reads each recent task’s activity log for its first start; the daily table shows «started after the limit» where known |
| `docs/decisions/0125-projects-lines-and-delete-all.md` | My projects split into tenders / upselling / not sorted; «Delete all shown» with a backup first and a restore |
| `docs/decisions/0126-tender-analyzer-study-file.md` | The Tender Analyzer writes `afaqy-tender-study/v1`; the register fills empty fields from it with evidence (format: `docs/tender-study-format.md`) |
| `docs/decisions/0127-tender-flow-by-files.md` | Drop anything anywhere: mail registers, study fills and moves the stage, one-file final offer makes it ready; default owner; Undo for every automatic move |
| `docs/decisions/0128-manual-tender-fields-optional.md` | Nothing the manager fills by hand blocks a tender’s stage; closed tenders ask for nothing |
| `docs/decisions/0129-audit-and-qa-policy.md` | The audit of 9.55: defects found in windows, dark mode, reloads and repeats; the tender page rebuilt around drop-or-choose; the backup reminder; the QA policy |
| `docs/decisions/0131-tender-card-and-follow-up.md` | A tender’s window as one card (tiles, dates line, missing, folds); the hand-over date to the tenders team; «missed the deadline»; inquiries; the team message; the year report |
| `docs/decisions/0132-etimad-radar.md` | The Etimad radar: the pull tool’s file read on the device; Etimad sets the platform’s dates and fee; exact linking or a suggestion; a Hijri date in a study checked before it is taken (format: `docs/etimad-radar-format.md`) |
| `docs/decisions/0133-etimad-market-and-result.md` | A tender’s own result from Etimad (offers ranked, our rank, the winner), the outcome offered for the manager to record, similar awarded tenders, AFAQY’s own bids, and the followed numbers copied back to the pull tool |
| `docs/decisions/0134-execution-archive-funnel.md` | Etimad’s work start on a won tender and the way to its execution in My projects; the archive of closed tenders; the year report’s funnel from publication to winning |
| `docs/decisions/0145-the-tender-mail-folder.md` | The tender mail folder: Power Automate saves each tender mail as an eml file in OneDrive; the register reads the folder (read only, File System Access) every minute and on return, quietly, ten at a time (`mailDirNew()`); a private window keeps it for the visit only |
| `docs/decisions/0146-checking-the-mail-folder.md` | «Check the folder»: every mail file said against the register, a mail that failed kept with its reason, the card saying why it is locked; an Etimad booklet's Hijri dates table read; the inquiries' upload day and deadline as one notice (v9.76) |
| `docs/decisions/0147-reading-the-booklets-again.md` | «Read the booklets again»: every open tender's files read again with today's reader, what changed said, typed dates untouched (v9.77) |
| `docs/decisions/0148-one-card-per-tender-and-moving-a-reminder.md` | The strip: one card per tender on its nearest date, every day a column, a reminder dragged (or picked) onto another day without touching the platform's date (v9.78) |
| `docs/decisions/0149-the-backup-as-a-zip-of-files.md` | The backup and the sync file as a ZIP of files, never one string of the whole register (the 512 MB text limit), old files still read (v9.79) |
| `docs/decisions/0150-little-scrolling.md` | Little scrolling: no table scrolls sideways (end columns fold into a «+» per row), long pages fold into their titles (guide, weights, the analyzer page), the program window fits the screen |
| `docs/decisions/0151-the-analyzer-on-the-users-subscriptions.md` | The Tender Analyzer on the user's own subscriptions (Gemini, Claude, ChatGPT through their vendors' tools), every date read twice by a second model, the card's green and red tags |
| `docs/decisions/0152-the-offer-handover-read-from-the-mail.md` | The offer hand-over read from the mail: a branch mail with the deck and the priced BOQ joins its tender under any subject, marks the hand-over and moves the tender to «Submitted»; older stray cards are moved in; the Sent Items flow (step 8) |
| `docs/decisions/0153-the-history-by-the-mails-own-times.md` | A tender's history by the mails' own times and writers, oldest first (lines saved before are read right, not rewritten); today's mails counted; «Excel from a date» with what each tender's mails say |
| `docs/decisions/0154-only-tenders-each-once.md` | The register holds tenders only: a mail opens a tender only when something in it says «tender» (`mailIsTender()`), mails find their tender by the Etimad reference read from subject, file names or text (`mailEtimadRef()`), and the manager tidies what is already there — non-tenders removed, repeated entries merged — in one window (`tenderCleanup()`, `tenderMerge()`, `tdCleanup()`) |
| `docs/decisions/0144-the-tender-desk-and-one-window-frame.md` | The register in the order of the work (command card, agenda, summary band, list bar, list), «More» as a menu, the row colour by stage, and one frame for every window of the register: title, tools and «Close» on one pinned row (`twHead()`), a pinned foot (`twFoot()`), three widths |
| `docs/decisions/0143-one-agenda-for-every-tender-date.md` | «Upcoming dates»: every date of every open tender on one strip, with the internal dates worked out from the platform's (`tenderMilestones()`, `tenderAgenda()`), a notice on this device and one calendar file |
| `docs/decisions/0142-register-and-study-in-one-step.md` | Register and study in one step: a new tender's mail goes to the Analyzer by itself, never toward a place nobody agreed to (`analyzerAuto()`) |
| `docs/decisions/0141-the-analyzer-says-when-it-uses-the-cloud.md` | The Analyzer says in every `hello` when a study goes to the cloud or to the user's own API key, and the card repeats it |
| `docs/decisions/0140-market-window-on-one-screen.md` | «Market analysis» as one screen (an exception to the pager of ADR-0119): a date range beside the periods, numbers and names that open their own window, and a search in every list, including the shared list window. |
| `docs/decisions/0139-industrial-iot-is-a-field-of-its-own.md` | Industrial IoT as a field beside AFAQY's in «Market analysis»: six lines read from the title by `etimadIiot()`, maintenance in and spare parts out, nothing stored; the Etimad tool carries the same rule. |
| `docs/decisions/0138-a-pull-is-written-onto-what-is-kept.md` | A new Etimad pull is merged onto the kept one field by field: the later reading wins, an empty value erases nothing, nothing kept is removed (`radarMerge()`) |
| `docs/decisions/0137-tender-analyzer-in-the-card.md` | The Tender Analyzer inside the card: the page hands a tender's documents to the program on the same computer (`http://127.0.0.1:47615`, one function, our own protocol — `docs/analyzer-link-format.md`), follows the study and takes its files back; the tender remembers its study |
| `docs/decisions/0136-market-study-window.md` | «Market analysis»: the whole pull kept and read for a period, a field of work, a region and a status; complete lists of tenders, winners, entities, activities, bidders and AFAQY's bids; Excel of what is shown (`marketStats()`, `marketPeriod()`) |
| `docs/decisions/0135-etimad-is-a-market-study.md` | The Etimad pull is a market study every three or six months: it never changes a tender’s data (the mail files and the study are the reference); the card mentions the differences; what 9.60–9.61 replaced is put back |
| `docs/decisions/0130-tender-correspondence-timeline.md` | A tender’s mail thread read into its messages (writer, time, own words), the summary with full working days, the manager’s hand-over mark, copy as text, and the summary window |

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
