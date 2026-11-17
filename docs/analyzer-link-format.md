# `afaqy-analyzer-link/v1` — the tender card and the Tender Analyzer on the same computer

The portal's tender card talks to the Tender Analyzer through a small service the program opens on the computer it runs on:
`http://127.0.0.1:47615`, never the network (ADR-0137). The program's side is `link.py` in the analyzer; the page's side is
`anCall()` in `app.js` with the checks in `core.js`. Every JSON reply carries `"schema": "afaqy-analyzer-link/v1"`.

| Request | Body | Reply |
|---|---|---|
| `GET /v1/hello` | — | `{ app: "TenderAnalyzer", version, engine: "local"\|"bridge", busy, job }` — `job` is the job running now, or null |
| `POST /v1/jobs` | `{ id, subject }` | the job's view (below). `id` is the tender's job name, `t-` and 16 hex digits (`analyzerJobId()`) |
| `PUT /v1/jobs/<job>/files/<name>` | the file itself | `{ name, size }`. A name is never a path; only document types are taken; 409 while the job runs |
| `POST /v1/jobs/<job>/start` | `{}` | the job's view; 409 `busy` when another study is running |
| `GET /v1/jobs/<job>` | — | the job's view; 404 when the program does not know it |
| `GET /v1/jobs/<job>/outputs/<name>` | — | the file |

The job's view: `{ job, subject, state, stage, progress, message, error, outputs: [{ name, size }] }`.
`state` is `waiting`, `running`, `done` or `failed` (anything else is read as failed). `progress` is 0 to 1. `message` is the
program's last line. `error` is the program's own reason when it failed; `closed` means the program was closed in the middle.

Rules the program keeps: it answers only a page whose Origin is the portal's (`https://mhmdsfwt371.github.io`, plus
`link_origins` in its settings); it writes only inside one folder per tender (`link_folder`, by default
`Documents\AFAQY Tenders`); it runs one study at a time; a job from the portal is studied by the free local model.

The address `afaqy-tender://open` opens the program when it is closed. Windows learns it, for the user only, the first time the
program is opened.
