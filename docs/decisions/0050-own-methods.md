# ADR-0050 — The manager's own calculation methods

| | |
|---|---|
| **Status** | Accepted (requested by the technical manager) |
| **Date** | 2026-11-02 |
| **Version** | v8.66 |

## Decision
- A method is a name plus steps against the type's usual time, in order — «up to X% → ×Y» — then «beyond the last step → ×Z».
  No steps = the point as it is. The three built-in methods are the same idea (speed: one step; against the usual: two).
- The weights admin makes up to 12 methods of up to 5 steps in «قواعد النقاط»; they publish with the weights (`rules.methods`,
  ids `m_…`) and appear in every type's method list with their steps described; the explanation and calculator show them.
- Names are required and steps must go up in order. Removing a method in use: the preview names the types that will count
  «on completion», and applying sets them so — nothing falls back silently. A type left on a missing method counts on completion.
- The guard accepts a type on an own method only when the same file defines it, and now derives each type's base from the file's
  own rules (factor importance and cut points) — before, publishing changed importance or cut points (possible since v8.61) would
  have failed the guard.
