# 0118 — Project follow-up and scoped report snapshots

Date: 2026-11-14

## Context

My projects exports previously ignored the visible filters. Tender outcome, execution and cash collection need separate meanings. Existing project and tender data must remain usable.

## Decision

Keep follow-up in an additive browser-local document keyed by stable project and tender references. Do not rewrite the tender outcome when execution starts. Only won projects can enter execution. Weighted milestones determine progress; unknown amounts stay null. A successful IndexedDB transaction records before/after values and notes. Revision comparison prevents stale tabs overwriting current work. Backup restore keeps current local fields and merges unique history. No authenticated author or tamper-proof audit is claimed.

All exports consume one immutable report snapshot built from the visible cohort, selected projects and additional filters. Date bounds apply to events in Saudi time; current statuses, balances and open actions are explicitly labelled as a snapshot. Excel exports six typed sheets; PDF uses the browser print route; standalone HTML embeds escaped JSON and filters all sections without network calls. File indexes do not embed attachments. The tender stage history is reused without inventing missing older events.

## Validation

Pure model and DOM integration tests cover identity, execution gates, weighted progress, nullable values, Saudi boundary dates, stale tabs, quota failures, backup compatibility, visible scope, workbook contents, HTML interaction, malicious text and team-view isolation. Native Urdu review remains a team acceptance step.
