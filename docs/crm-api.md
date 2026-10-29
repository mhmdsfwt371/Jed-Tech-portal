# ماي أفاقي — المسارات والحقول التي تبني عليها البوابة

مستخلص من التقاط حيّ لجلسة مدير في ٢٨ أكتوبر ٢٠٢٦ (التقرير الكامل محفوظ خارج المستودع لأنه يحمل أسماء موظفين
وعملاء — المستودع عام). كل ما هنا رُصد في طلبات التطبيق نفسه، لا شيء مستنتج من اسم شاشة.

## الاتصال
- الواجهة `https://crmbackend.afaqy.sa`، والمصادقة `Authorization: Bearer <JWT>` في الترويسة.
- ترويسات يرسلها التطبيق مع كل طلب: `X-Timezone-Offset: -180`، و`X-Client-Id`، و`lang`.
- الغلاف الموحد `{ data, status, message, success, actualError }`، والشبكات `data.data` مع `listCount` و`totalPages`.
- الخادم لا يقبل طلبات من أصل غير `https://myafaqy.com` و`http://localhost:*` (القرار 0002).

## المهام
| الغرض | الطلب |
|---|---|
| طوابير المهام المتاحة للمستخدم | `GET /Task/GetUsersTasksGroups` — `100000` مهامي، `100001` كل المهام، وأرقام الأقسام |
| شبكة المهام | `POST /Task/GetMyTasksGrid` — ثلاثة أوعية `toDo` و`open` و`done` تُصفَّح كلٌّ وحده |
| حالات المهمة | `POST /Task/GetTaskStatusDropDown` — ١ To Do، ٢ Open، ٣ Done |
| أنواع المهام | `POST /Task/GetTaskTypeDropDown` — ١٢٣ نوعًا، معرّفها هو `taskSettingId` |
| تفاصيل مهمة وسجلها | `GET /Task/GetTask/{id}` — السجل في `data.activities[]` (١ إنشاء، ٧ إعادة إسناد، ٨ بدء، ١١ إنجاز) |

**مرشحات الشبكة على الخادم:** `agent` (المسؤول)، و`statusIds`، و`assignedOn`، و`completedOn` — والأخير يحترمه الخادم
فعلًا (تحقّق بالعدّ). **لا مرشح للفرع ولا لتاريخ الإنشاء.** يوم سعودي يبدأ عند `21:00Z` من اليوم السابق في صيغة التطبيق.

## الحقول — وما لا يُستعمل
| المطلوب | الحقل | ملاحظة |
|---|---|---|
| وقت الإنشاء | `createdOn` | بلا علامة منطقة، وهو **UTC** — تحقّق في ٢٩ أكتوبر ٢٠٢٦: مهمة تظهر ١٢:٣٠ ظهرًا رجعت `09:30:41` |
| وقت الإنجاز | `closeDate` | **لا** `dateOfCompletion` (فارغ دائمًا) |
| المسؤول | `assigneeId` | الاسم من قائمة المستخدمين لا من نص الصف |
| مهمة من بريد عميل | `moduleId == 146` | **لا** `isAutomaticTask` (يتناقض بين الشبكة والتفاصيل)، و**لا** المنشئ: حساب النظام ينشئ مهام أوامر العمل أيضًا |
| الإلغاء | `isCancelled` | |
| مسندة لمجموعة | — | لا علامة لها في الصف |
| من أنجز | — | في سجل كل مهمة وحدها؛ البوابة تنسب للمسؤول |

## الأشخاص والفرق
- `POST /Security/GetAllHierarchyUsersDropDown` — المعرّف والاسمان، وهو نفس فضاء `assigneeId`. لا فرع ولا بريد.
- `POST /Teams/GetAllTeams` ثم `GET /Teams/GetTeamById/{id}` — أعضاء كل فريق بمعرّفاتهم، و`branchCode` الفريق.
  هذا هو الطريق الوحيد من المهمة إلى الفرع. جدة = `"2"`.
- انتبه: `EmployeeIC/GetAllEmployeesGrid` فضاء معرّفات **آخر** — لا يُربط بالمهام.

## مؤشرات جاهزة في ماي أفاقي — مرشحة للمؤشرات القادمة
| الشاشة | الطلب | ما فيه |
|---|---|---|
| لوحة إحصاءات الخادم | `POST /ActivityWorkTime/GetCompletedTasksGrid` | زمن أول استجابة والوقت المسجّل لكل مهمة منجزة |
| | `POST /ActivityWorkTime/GetTaskStatusReport` | عدد المهام بكل حالة لكل موظف، ويقبل الفرع |
| لوحة ما بعد البيع | `POST /AfterSalesBoardReport/GetAfterSalesAgentsGrid` | تذاكر كل موظف بالفترة والفرع |
| نقاط الفنيين | `POST /TechnicianReport/GetTechnicianReportStatic` | ٣١ حقلًا لكل فني شهريًّا بالفرع |

## أوامر العمل
جدول الوحدات من `POST /PerformanceTracker/GetTransactionStatusChart`: ١٧٩ طلبات تركيب، ١٧٣ تركيبات، ١٧٥ صيانة،
١٨٧ إيقاف خدمة، ١٨٨ إعادة خدمة، ١٩٨ إعادة خدمة عن بعد، ١٩٠ نقل وحدات. شبكة الصيانة تفترض آخر ٩٠ يومًا ما لم يُرسل
`isSearchFilter: true` مع `dateRangeIntialDaysCount: 0`، ولا تحمل وقت الإنجاز.

## ما حسمه اكتشاف ٢٩ أكتوبر ٢٠٢٦
- **«مهامي» (`100000`) = المسندة للمستخدم فقط** — صفر صفوف بمسؤول غيره، وصفر صفوف أنشأها هو لغيره.
- **حجم الصفحة:** الخادم يقبل ما يُطلب (١٠٠ و٥٠٠ أعادا ١٠٠ و٥٠٠ صفًّا)، والأوعية الثلاثة مستقلة.
- **الأوقات UTC** بلا علامة منطقة (انظر جدول الحقول).

### أوامر العمل — اثنتا عشرة شاشة
كلها `POST` بغلاف الشبكة القياسي، ومرشح التاريخ الوحيد `dateRangeIntialDaysCount` (آخر N يوم). الشاشات: طلب التسليم
`DeliveryRequest/GetAllDeliveryRequests`، مذكرة التسليم `Delivery/GetAllDeliveryNotes`، الإرجاع `DeliveryReturn/GetAllDeliveryReturns`،
الصيانة `Maintenance/GetAllMaintenanceRequests`، الإيقاف `StopService/GetAllStopServiceTransactionsGrid`، إعادة الخدمة
`Reservice/GetAllReServiceTransactionsGrid`، النقل `TransferServerUnit/GetAllTransferServerUnits`، الدخول والخروج
`Maintenance/GetAllInOutTransaction`، إعادة الخدمة عن بعد `ReserviceRemotely/GetAllReserviceRemotelyGrid`، التعليق وفكّه
`HoldService/GetHoldServiceGrid` و`UnHoldService/GetUnHoldServiceGrid`، تفعيل الذكاء الاصطناعي `AiActivation/GetGrid`.
- **الفنيون أسماء لا معرّفات** (`technicians` مصفوفة نصوص)، و**لا تاريخ إغلاق** في إحدى عشرة شاشة منها — لذلك لا يُبنى منها
  مؤشر لكل فني؛ تقرير «نقاط الفنيين» يغطي العمل الميداني بمعرّف الفني.
- الوحدات من صفوف المهام: ١٧٥ صيانة، ١٧٩ طلب تسليم (تركيب)، ١٨٧ إيقاف، ١٨٨ إعادة خدمة، ١٤٦ و١٧٠ بريد العميل.

### تقارير لكل موظف
| التقرير | الطلب | الفترة · الفرع | الحقول |
|---|---|---|---|
| نقاط الفنيين | `POST TechnicianReport/GetTechnicianReportStatic` | `yearId`/`quarterId`/`monthId` و`requestDate` (أول الشهر وآخره `T00:00:00.000Z`) · `branchIds` | ٣١ حقلًا: التركيب والصيانة والإصلاح وإعادة الخدمة والإيقاف للأجهزة والملحقات، والتركيب الجماعي، والأعمال الإضافية، والمخالفات، والنقاط، و`technicianId` |
| لوحة ما بعد البيع | `POST AfterSalesBoardReport/GetAfterSalesAgentsGrid` | `createDate` (حدود اليوم السعودي بـUTC) · `branch` | `id`، `afterSalesName`، والمفتوحة والمعلّقة والمنجزة والإجمالي |
| المهام المنجزة | `POST ActivityWorkTime/GetCompletedTasksGrid` | `durationReference` (٠ = اليوم؛ الباقي غير مثبت) · لا فرع | `firstResponseTime` بالدقائق (مثبت على الشاشة)، `trackedTime` |
| حالات المهام | `POST ActivityWorkTime/GetTaskStatusReport` | `durationReference` · `branchCode` | أعداد فقط |

تقرير نقاط الفنيين فيه قيم مكافآت وأرقام هواتف وتقييمات — **لا تُنقل أبدًا** (القاعدة ١٩ في الحارس).

### سجل الأنشطة = التذاكر (تأكّد بالصور ٢٩ أكتوبر ٢٠٢٦)
في «حسابات ما بعد البيع» لكل عميل مهندس ما بعد بيع مسؤول ومندوب مبيعات، وزر «Add Ticket» يفتح فورم اسمه «Activity»:
تصنيف (دعم العملاء، مشاكل برمجية، API، ربط حكومي)، حالة، وضع، وصف، ومرفقات، واختيار «إنشاء مهمة». تظهر كلها في شاشة
التذاكر `ActivityLog/GetTicketsGrid` — الصفوف من الأحدث — بحقول: `ticketId`، `taskId`، `customerId`، `categoryId/category`،
`caseId/case`، `statusId/status`، `createdById`، `createDate`. الحالات المرئية: Open وDone.
**لم يُلتقط بعد:** طلب شاشة «حسابات ما بعد البيع» (المهندس المسؤول عن كل حساب) — مطلوب لمؤشر تغطية الحسابات.

### الطوابير
`Task/GetUsersTasksGroups`: يدوية ٣، تشغيل ٥، مالية ٧، ما بعد البيع ٨، **البحث والتطوير ١٢**، DVR ١٤، ومهامي ١٠٠٠٠٠،
وكل المهام ١٠٠٠٠١. لا طابور للبري سيلز.

### البريد
لا شاشة في ماي أفاقي لرسائل العملاء الواردة — البريد يظهر مهامَّ «نشاط بريد العميل» فقط، بلا رابط لرسالة. شاشة التذاكر
`ActivityLog/GetTicketsGrid` تربط التذكرة بمهمتها لكنها ليست بريدًا.

## مجهول حتى الآن
مسار تسجيل الدخول ورمز التحقق، وقيم `durationReference` بعد الصفر، ووحدة `trackedTime` (مستنتجة دقائق، غير مثبتة)، وشاشات
الوحدات ١٧٣ و١٩٠ و١٩٨.
