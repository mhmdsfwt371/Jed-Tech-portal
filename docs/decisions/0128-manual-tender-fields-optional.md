# 0128 — What the manager fills by hand is optional

Date: 14 November 2026 · Version 9.54 · Replaces the offer gate of ADR-0083 and the required reason

## Context
After ADR-0127 most of a tender fills itself. The manager decided (14 November) that what is left to him must never stop him
closing a record.

## Decision
- No stage is blocked: «ready», «submitted», «won», «lost» no longer need the technical and financial files; removing an offer
  file from a ready tender is allowed. `tenderCanAdvance()` stays as a fact («has its offer») and blocks nothing.
- The reason for «declined» and «lost» is asked, and may be left empty; only Cancel in the question keeps the old stage.
- `tenderNeeds()` asks nothing of a closed tender (won, lost, declined, cancelled); for open ones it is a reminder, shown as
  «empty · optional» in a quiet colour, not a warning.
