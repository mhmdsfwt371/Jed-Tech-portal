# ADR-0051 — What each tool does: a popup on hover, an ⓘ on a phone

| | |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-11-02 |
| **Version** | v8.67 |

## Decision
- Each link in systems.json may carry a description (`desc`: Arabic and/or English, up to 300 characters each); the validator checks it
  and the admin links page edits it beside the name and address.
- On «كل الأدوات والأنظمة», hovering (or focusing) a system or tool shows a popup with its description; on touch devices an ⓘ
  beside each system opens and closes it. Tool cards that already show their description have no ⓘ.
- A link with no description yet shows its group and address, inviting the admin to write one.
- Descriptions were written only where they can be stated with confidence (17 of 28): MyAFAQY, AFAQY PRO, the API documentation,
  the video platform (new and old), the Nusuk systems, Teltonika FOTA and partners, Milesight, AFAQY Learn, the service desk,
  Outlook and OneDrive. The others (e.g. SenseWare, AFAQY Robot, CMS, Rafed, Mardam, the vendor fleet portals) await the manager.
