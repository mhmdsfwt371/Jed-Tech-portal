# ADR-0029 — Email replies from the manager's own inbox (Microsoft sign-in, read-only)

| | |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-10-30 |
| **Version** | v8.24 |

## Context
The manager wants, from the admin page and without anyone else's involvement, how many emails each person answered per day,
week, month and quarter, and what kind (hard or easy). Engineers reply from their own addresses and reply-all, so every
customer message and every reply reaches the manager's inbox.

## Decision
- The manager registers a single-tenant SPA app ("AFAQY Jeddah Portal") in Azure himself, with delegated **Mail.Read** only,
  and pastes its client and tenant IDs on the admin page (kept on the device; neither is a secret).
- Sign-in uses the authorization-code flow with **PKCE (S256)** and **no client secret**. The code is exchanged on return,
  the address bar is cleaned at once, the inbox is read (last 95 days, paged), and the access token is dropped in `finally`.
  No refresh token is requested.
- Each message becomes a row `{ i, t, c, w, k }`: message-id hash, time, conversation hash, who (a scope person id matched by
  display name, `x` for another colleague, `ext` for a customer), and the category for customer messages. **Subject and preview
  are read only to classify and are never stored; no address is stored.**
- Categories by words (English and Arabic): integration and new request = hard; technical issue = medium; inquiry and the rest = easy.
  A thread takes its hardest customer message's category. Per person: replies and share, threads, hard share, median first reply.
- The section is isolated between markers; guard rule 26 allows only `login.microsoftonline.com` and `graph.microsoft.com`,
  requires the exact read-only scope and PKCE, forbids secrets, write/send scopes, refresh, a stored token, and any other row field.
- Admin link only; the rows ride in the full backup (rule 24).

## Limits
Words are an approximate rule. Replies to threads where the customer wrote only to one engineer (not reply-all) are not seen.
