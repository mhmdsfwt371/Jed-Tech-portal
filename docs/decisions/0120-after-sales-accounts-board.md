# 0120 — The After-Sales Accounts board, with systems from two server lists

Date: 14 November 2026 · Version 9.44

## Context
The manager asked for a board of MyAFAQY's "After Sales Accounts" page: how many accounts, devices, how many on PRO and how many on
VSS, how many accounts each engineer carries — and for it to change after an assignment. The manager pull already read the accounts
grid (ADR-0070, factor 5), but only for the scope's people and with no system: the grid has none.

The system is shown per customer in Customer → Solutions → Server Accounts (`CustomerProfile/GetCustomerProfileAccountInfo`), one
request per customer: 2,201 requests for Jeddah. A capture on 14 November found a faster route in Server Management:

- `CustomerServerAccount/GetAllCustomerAccounts` — 8,095 rows, one per server account, with `customerId` (the same id the after-sales
  grid carries) and the server's address; its `system` field is always empty.
- `TechniqueSystem/GetGridServerIPs` — 33 rows naming the system behind each address.

All 100 rows checked from the first list matched an address in the second, exactly, port included.

## Decision
- The manager pull reads both lists after the accounts grid (about 17–81 requests instead of 2,201) and keeps, for each Jeddah
  account only, the list of `[system, status]` of its server accounts. Addresses are used for the match and never stored.
- The join and the address map are two functions in `core.js` (`attachSystems`, `serverIpMap`) embedded into the bookmark by
  their source, so the tests run the code that runs in MyAFAQY.
- A system is counted by customers: a customer on two VSS servers is one VSS customer. `vss_*` and `cms_*` get a family line
  listing exactly which names it adds up; no other grouping is assumed (for example, `route.afaqy.pro` is not folded into
  `afaqy.pro`).
- If the server-account list was not read to the end, no system figure is shown and the board says how many rows were read.
- Devices per system are not shown: neither list carries them. The board shows each account's connected devices, as the
  After Sales Accounts screen does.
- The board lives on the Team page under the assignment panel and uses the newest manager pull that carries accounts. After
  an assignment, the manager runs the pull again; the board follows. It does not listen to the panel directly.
- The new fields are optional in `afaqy-crm-reports/v1`; older files still read. Engineers not matched to a pulled person keep
  their names on the manager's device only (`accounts.eng`), never in the repository.
- The sync extension carries the same pull and moves to 1.0.5.

## Checked
The board's logic was run on the 14 November export of the After Sales Accounts screen: 2,201 Jeddah accounts, 101,060 devices,
785 with none, segments 2,033 / 122 / 23 / 23 and the per-engineer counts all matched the export. The system figures have not yet
been checked against a real pull.
