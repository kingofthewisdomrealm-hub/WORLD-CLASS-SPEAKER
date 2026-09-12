# Human State OS

Human State OS is a proposed operating system for designing human experiences. It connects embodied and social state to the Ruler of Wisdom framework library, experiential interventions, learning, action, and feedback.

```text
HUMAN → STATE → PROBLEM → SCALE → FRAMEWORK → EXPERIENCE
      → ACTION → RESULT → FEEDBACK → REPEAT
```

## Connection to Ruler of Wisdom

The Ruler of Wisdom [Periodic Table of Frameworks](https://rulerofwisdom.com/forum/) is the cognitive/wisdom layer. Its 36 tools are organized by seven problem families—Needs, Fears, Meaning, Decision, Identity, Time, and Skill—and four scales: Moment, Person, Life, and Room.

Human State OS does not replace those pages. It adds routing and experience design around them:

- **Human State layer:** what condition is the person or room in?
- **Problem + Scale Routers:** what kind of problem is this, and where does it live?
- **Framework graph:** which Ruler of Wisdom tool or chain fits?
- **Intervention + Learning Engines:** what voluntary experience and practice should happen?
- **Feedback loop:** did state, learning, or behavior change, and for whom?

## Canonical documents

- [Human State OS Master Research](./HUMAN_STATE_OS_MASTER_RESEARCH.md) — research model, evidence distinctions, mechanisms, applications, hypotheses, safety, and open questions.
- [Human State OS System Specification](./HUMAN_STATE_OS_SYSTEM_SPEC.md) — product architecture, graph schema, engines, data model, Live Copilot, delivery phases, and acceptance criteria.

## Current status

**Phase 1 shipped: framework graph + read-only route explorer.** See
[DECISIONS.md](./DECISIONS.md) for why Phase 0 was dropped.

- Graph and router: `src/lib/human-state-os/`
- Explorer: `/human-state-os` (noindex, read-only)
- Refresh the table: `npm run sync:frameworks`
- Checks: `npm test` — 26 tests over graph references, symmetric edges,
  source URLs, and router fixtures

Still true of the pass below: no production redesign, no framework page
removed, no sensing of any kind.

This documentation pass intentionally makes no production redesign, removes no framework pages, and adds no large frontend. Claims remain labeled by evidence strength:

- 🟢 Strong
- 🟡 Moderate / promising
- 🟠 Emerging / mixed
- 🔴 Weak / unsupported
- ⚪ Product hypothesis / not yet tested

## Next priorities

1. ~~Extract and review the 36 live framework pages as versioned graph nodes.~~
   Done — read from upstream, not re-authored. See [D1](./DECISIONS.md).
2. ~~Encode typed relationships such as `leads_to`, `pairs_with`, `pushes_against`.~~
   Done — 68 bonds and 10 seminar chains, each carrying its rationale.
3. ~~Build a read-only route explorer for `STATE → PROBLEM → SCALE → FRAMEWORK`.~~
   Done — `/human-state-os`.
4. **Author `usefulWhen` / `notUsefulWhen` upstream.** The router can say which
   square a tool sits in; it cannot yet say when a tool is the wrong answer.
   This is the cheapest remaining accuracy gain and it is writing, not code.
5. Seed a small, low-risk, consent-aware intervention library.
6. Test the Predict → Experience → Measure → Explain → Apply → Teach loop
   before building a Live Copilot.

The near-term rule is simple: **preserve first, validate the graph second, build the flashy robot conductor later.**

