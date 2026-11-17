# 0137 — The Tender Analyzer inside the card: the page hands the tender to a program on the same computer

Date: 17 November 2026 · Version 9.64 · Builds on ADR-0126, 0127 (the analyzer's study in the register) and 0135

## Context
A tender's study was made outside the portal: the manager downloaded the tender's files from the card, ran the Tender Analyzer
on them, and dropped the study back on the card. He asked for the analyzer to be «in the heart of the portal»: after the mail is
uploaded and the tender is registered, one button on the web installs the program once, and then a button on each tender opens
the program, it does the work, and the study's files return to the web by themselves — with no service key anywhere, the result
coming from a free model, and a subscription only as an extra for whoever has one.

A page cannot run that model itself at a usable speed on the team's laptops (16 GB, no graphics card), and the analyzer's
builders of the study deck, the workbook and the letters are a program of their own. So the model and the builders stay in the
program (version 3: no key, the free local model, installed by itself), and the portal becomes its only screen.

## Decision
- **One new door, and only one.** The page may reach `http://127.0.0.1:47615` — the analyzer on this very computer — through
  one function (`anCall()`). It is not the network: nothing leaves the device, which keeps the rule «no server». The address
  lives in `core.js` (`ANALYZER`); guard rule 30 holds it to that address, that one function, and no other local address.
- **Our own protocol**, `afaqy-analyzer-link/v1` (`docs/analyzer-link-format.md`): hello · a job per tender · the tender's files
  in · start · where it stands · the study's files out. A reply that is not in it is not the program
  (`parseAnalyzerHello()`, `parseAnalyzerJob()`).
- **What is sent** is the tender's own documents only (`analyzerSend()`): the booklet, the bill of quantities, annexes. Not the
  mail, and not a study or an offer the program or we wrote.
- **What comes back** goes onto the card as files marked as the program's (`analyzer:<job>`), each with its kind
  (`analyzerOutputKind()`), and the register file the program writes (`*.tender-study.json`, else the study workbook) fills the
  card through the same import as a dropped study (ADR-0126): only empty fields, each value with its evidence, differences shown.
  A study done again replaces the program's own earlier files and nothing else.
- **The tender remembers** its study (`analyzer: { job, state, at, error, files }`), so a page closed while the local model
  works — it is slow — follows the study again when the card is reopened, and collects the files.
- **A program that is not there is said**, with the two ways out: «Open the Analyzer» (the address `afaqy-tender://open`, which
  Windows learns when the program is first opened) and «Download and install» (the analyzer's page).
- **The program answers the portal's page only** (it checks the page's Origin), keeps each tender in one folder under the
  user's documents, and studies one tender at a time. A job from the portal is always the free local model.
- **The subscription stays in the program's window.** Choosing devices with prices and datasheets needs a web search, which the
  chat app of a subscription does by copy and paste; that cannot run unattended from a web button.

## Consequences
- Chrome asks the user once before a public page reaches a program on the device (Local Network Access); the request says so
  (`targetAddressSpace: 'loopback'`). On the portal's real address that prompt has not been seen here; the tests ran on a local
  page, where no prompt is shown.
- The link works on the computer where the program is installed; on a phone the card says the program is not there.
- The reliability of the study is the local model's; the import's evidence rules and the Hijri check still stand between the
  model and the card.
