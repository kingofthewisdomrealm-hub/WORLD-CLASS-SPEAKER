# Human State OS — decisions

One entry per decision that would be expensive to reverse. Newest last.

---

## D1 — The framework table is read, not re-authored

**Date:** 2026-09-12
**Status:** Accepted
**Supersedes:** Spec §19 Phase 0, "extract the 36 framework nodes … into reviewed structured data"

### Context

The spec's Phase 0 assumed the 36 frameworks existed only as public web pages
and had to be extracted into structured data before anything could be built.

That turned out not to be true. The table already exists as reviewed,
typed data in the sister repository:

- `RULEROFWISDOM/src/lib/frameworks.ts` — 36 frameworks, 68 typed bonds,
  10 seminars, 7 groups, 4 periods
- published for machines at `https://rulerofwisdom.com/agents/frameworks.json`
  with a JSON schema alongside it

It also matches the spec exactly, which is the part worth writing down. The
spec's seven problem families are the table's `group` ids, and the spec's four
scales are the table's periods 1–4 — all 36 frameworks fall in the same square
in both documents. The spec was written from the live site by someone reading
carefully, and the code agrees with it.

### Decision

Frameworks are **edited in RULEROFWISDOM and read here**. Speaker OS never
holds an editable copy.

- `scripts/sync-frameworks.mjs` pulls the published JSON into a committed
  snapshot with a sha256 version.
- `src/lib/human-state-os/source.ts` is the only file that knows the upstream
  shape. Everything else sees the graph types.
- One additive change was needed upstream: the agents door published the
  elements but not the bonds. `src/lib/agents.ts` in RULEROFWISDOM now
  publishes `bonds` too. No page, route, or nav changed.

### Consequences

**Good.** There is one place a framework can be wrong. Phase 0 disappears and
Phase 1 gets roughly half as long. A framework edit reaches this app by
running one command, and arrives as a reviewable diff rather than a silent
change.

**The cost.** This app is now downstream of a repo it does not control. If
the endpoint's shape changes, `source.ts` breaks loudly — which is the
intended failure, but it is still a break. Mitigated by the snapshot: a
broken upstream never takes the app down, it only stops updates.

**The rule this sets.** Anything editorial — names, laws, stories, bonds,
seminars — belongs upstream. Anything about routing, state, or experience
design belongs here. When in doubt, ask which repo a human would open to fix
it.

### Not decided here

Interventions, evidence claims, and safety notes have no upstream home yet.
They are declared in the node type and left empty rather than invented. When
they are authored, the same question comes back: whose repo owns them?
