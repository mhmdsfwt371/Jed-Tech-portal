# 0142 — Register and study in one step, and never by itself toward a place nobody agreed to

Date: 20 November 2026 · Version 9.71 · Builds on ADR-0137 and ADR-0141 · Program version 3.5

## Context
The register already took a tender from its email (ADR-0127, ADR-0130), and the card already handed the tender's documents to
the Tender Analyzer on the same computer and took the study back (ADR-0137). They were two steps: drop the mail, then open the
card and press «Study it with the Analyzer». The manager asked for one: «register what arrived, study it, and bring it out with
its questions and details». Two things stood in the way of simply pressing the button for the user:

- ADR-0141: where the text of the documents is studied is said under the button before anything is sent. A study that starts by
  itself skips that sentence.
- Program 3.5 reports a third place, `engine: "api"` — the Claude service reached with the user's own key. The portal read every
  unknown word as `local`, so on that route the card said the text stayed on the computer. That was false.

## Decision
- **One switch, on the register's mail box:** «Study every new tender with the Analyzer as soon as it is registered». It is off
  until the user turns it on, and it is kept in this browser only.
- **Turned on in front of the program.** The switch asks the program's hello first. No answer: it stays off and the page says so.
  With an answer, the switch remembers the place the program named (`local`, `cloud` or `api`) and the line under it says where
  the text goes, in the same words as the card's notes.
- **A study starts by itself only toward that place or the computer itself** (`analyzerAuto()`): the program answers now, the
  tender has documents to send, and the place it names now is `local` or the one agreed to. Any other place, the copy-and-paste
  way (`bridge`), or a closed program leaves the tender registered with the card's own button and note, and the page says why.
  A closed program is not opened behind the user's back.
- **Only tenders the mail has just registered**, one after the other — the program runs one study at a time. A reply linked to
  a tender already in the register starts nothing.
- **`api` is kept as said** by `parseAnalyzerHello()`, and the card shows `an_note_api` in the warning style of the cloud note.
- The door does not change: `http://127.0.0.1:47615` through `anCall()` only. What leaves the computer is still the program's
  doing, said by the program at every hello; a file with a security marking is never sent on a job from the portal.

## Consequences
- One drop registers and studies; the study, the inquiries and the dates land on the card as before (ADR-0126, ADR-0131).
- A user who switches the program to another place after agreeing gets no silent study; turning the box off and on again is the
  new agreement.
- The switch is per browser: a second computer starts with it off.

## Tests
`tests/core.test.mjs` «v9.71» (the rule, the cleaned preference, the notes, three languages) — failed on 9.70 first.
`tests/browser/analyzerlink.py` B1–B7: the switch, a program that does not answer, the one-step study with a stand-in program,
the move to the cloud that starts nothing, and the switch after a reload.
