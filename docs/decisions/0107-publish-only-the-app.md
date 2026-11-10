# ADR-0107 — The website publishes the app's own files only; the Mail Extractor downloads from the site

| | |
|---|---|
| **Status** | Accepted (found on 2026-11-10 while preparing to move the browser suites into the repository) |
| **Date** | 2026-11-10 |
| **Version** | v9.27 |

## What was found
- GitHub Pages built from the whole branch (`legacy`, source `main /`), so every file in the repository was served on the public
  address although the repository is private: 267 files under `docs/`, the tests, scripts, tools, release notes and the root
  Markdown files. Six decision records (0066, 0067, 0070, 0073, 0074, 0078) name an engineer beside his month's task counts and
  close times. Moving the suites in — with their data — would have published that data too.
- «Download the Mail Extractor» opened the private repository's releases page: 404 to anyone not signed in to the owner's account.
- The About window counted versions and decisions by downloading `CHANGELOG.md` and `docs/START-HERE.md`.

## Decision
- `.github/workflows/pages.yml` builds `_site/` with `scripts/build-site.mjs` and deploys it with GitHub's Pages actions
  (`build_type: workflow`). The builder copies the app's files only — never `docs/`, `tests/`, `scripts/`, `tools/`, `release/`,
  `extension/`, `.github/` or any Markdown file — and fails the publish if any file the app needs (the offline shell in `sw.js`, the
  local imports, `src`/`href`/`fetch` references) is missing, or any private file is present.
- The same workflow downloads the latest `extractor-v*` release, checks its SHA-256, and puts it at
  `assets/extractor/AFAQY-Mail-Extractor-win64.zip`; the three download links point there and download directly.
- The About counts travel in `version.json` (`counts`), written by `scripts/bump.mjs` and recomputed by the site builder.
- Reversible: setting Pages back to «Deploy from a branch» restores the old behaviour at once.

## What it does not undo
Anything already fetched from the public address (by a person, a crawler or an archive) before the switch may persist. `team.json`
(names, positions, myafaqy ids) is loaded by the app and stays public by design.

## Tests
Seven suites run against the built `_site/` instead of the repository (control room, number windows, pulse and About, mail
indicator, large PST, page help, extension): all pass. Full run on the repository after the change.
