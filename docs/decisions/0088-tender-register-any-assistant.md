# ADR-0088 — The tender register works with any assistant: paste the result

| | |
|---|---|
| **Status** | Accepted (the technical manager: when Claude's limit runs out, use ChatGPT — «اعملها») |
| **Date** | 2026-11-06 |
| **Version** | v9.06 |

## Context
Since 15 Oct 2026 the ChatGPT extension for Chrome has a Work mode that acts inside the user's tabs (successor to the Atlas browser,
shut down 9 Aug 2026). The register's instructions are plain text and work with any assistant that can read Outlook on the web,
but an assistant may answer in its chat instead of saving a file — and the register only took a file.

## Decision
- «📥 Paste the result»: paste the assistant's answer as it is; the portal finds the JSON (inside a ```json fence or with words
  around it), then the same import and checks. Text with no result is refused and nothing is added.
- The instructions now say: if you cannot save a file, print the same JSON in one code block.
- The wording speaks of «the assistant» (Claude in Chrome, or the ChatGPT extension in Work mode), and reminds to check IT policy
  before any assistant reads company mail. The PST path needs no assistant and has no limit.

## Tests
`harness/tenders.py` (35): a non-result paste refused; a chat answer with words and a ```json fence found, checked and added; the
instructions' fallback line; the renamed button. Full run clean. Not tested here: ChatGPT itself (no access from this environment).
