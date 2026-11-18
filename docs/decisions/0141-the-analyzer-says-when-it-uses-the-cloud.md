# 0141 — The Analyzer says when a study goes to the cloud, and the card repeats it

Date: 18 November 2026 · Version 9.69 · Builds on ADR-0137 · Program version 3.4

## Context
ADR-0137 gave the portal one door to the Tender Analyzer on the same computer, and the card under the button said: «no file goes
out to the internet». That was true while the program had one free route, the model on the computer. On a laptop without a
graphics card that route was measured at about fifteen tokens a second: a study of six rounds took an hour and a half. The
manager asked for a way that is practical and still free, with no key and no subscription. Program 3.4 adds it: the same Ollama
on the computer passes the rounds to Ollama's own servers («Ollama cloud», the free plan). The text of the documents then leaves
the computer — and the card's sentence would be false.

## Decision
- **The portal's door does not change.** It still reaches `http://127.0.0.1:47615` only, through `anCall()` only, and sends the
  files to the program on the same computer and nowhere else (guard 30 stands).
- **The program says where a study would run, at every hello.** `engine` is `local`, `bridge` or `cloud`; the program reads its
  settings at the moment of asking, because the switch in its window can change while it runs.
- **The card repeats it.** `parseAnalyzerHello()` keeps the word; `analyzerNote()` picks the note. On `cloud` the card shows a
  notice in place of the plain note, from the hello on — before a file is sent: the text of the documents goes to Ollama's
  servers, a file with a security marking is studied on the computer, and how to keep everything on the computer.
- **The plain note promises only what the portal itself does.** It no longer says «no file goes out to the internet»; it says
  the portal sends the files to the Analyzer on this computer and nowhere else, and that a notice appears if the cloud is on.
- **Consent is taken where the choice is made:** in the program's window, by a yes to exactly what is sent and where, before the
  switch turns on. The portal asks nothing more; it informs.

## Consequences
- An older program (before 3.4) never says `cloud` and has no cloud route: its card reads as before, in the new wording.
- A word the portal does not know is read as `local` and shows the plain note, which is now safe to show for any engine.
- The portal still stores nothing about the engine: the notice lives while the study runs in this tab.

## Not decided here
Whether the cloud is allowed for a given tender is the manager's decision per tender; the program enforces only the security
marking. The paid plans of Ollama are not used and not offered anywhere.
