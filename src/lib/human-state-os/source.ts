/**
 * The adapter. The only file that knows what Ruler of Wisdom's JSON looks like.
 *
 * WHY THIS FILE EXISTS
 * The spec's Phase 0 said "extract the 36 framework pages into structured
 * data". That work was already done — it lives in the RULEROFWISDOM repo as
 * `src/lib/frameworks.ts` and ships to the public at
 * `https://rulerofwisdom.com/agents/frameworks.json`. Re-authoring it here
 * would give us a second copy that disagrees with the site the first time
 * Josias edits a framework.
 *
 * So: frameworks are EDITED in one place and READ in this one. Everything
 * upstream-shaped stops at this file. If the endpoint moves, changes shape,
 * or is replaced by a database, this is the only file that changes — the
 * graph, the router, the tests and the UI never learn what upstream looks
 * like. That is the escape hatch, and it is the reason the module is bounded.
 *
 * WHAT IS DERIVED HERE, AND WHY THAT IS SAFE
 * `secondaryProblems` is computed from the bonds, not hand-written. A tool
 * "reaches" another family when Josias bonded it to a tool in that family.
 * That is his editorial judgement travelling through the graph rather than
 * ours being invented on top of it.
 */

import type {
	EdgeType,
	FrameworkChain,
	FrameworkEdge,
	FrameworkGraph,
	FrameworkNode,
	ProblemFamily,
	ProblemFamilyMeta,
	Scale,
	ScaleMeta,
} from "./types"
import { SYMMETRIC_EDGES } from "./types"

/** The upstream payload, exactly as `/agents/frameworks.json` serves it. */
export interface RulerOfWisdomPayload {
	name: string
	url: string
	resourceUrl: string
	groups: { id: string; label: string; question: string }[]
	periods: { n: number; label: string; grain: string }[]
	frameworks: {
		slug: string
		z: number
		symbol: string
		name: string
		source: string
		group: string
		period: number
		n: number
		law: string
		story: string
		unit: string
		status: string
		complement: string
		url: string
		parts: { key: string; label: string; depth: string }[]
	}[]
	bonds: { a: string; b: string; kind: string; law: string }[]
	seminars: {
		slug: string
		name: string
		hook: string
		when: string
		law: string
		frameworks: string[]
		url: string
	}[]
}

export interface Snapshot {
	sourceUrl: string
	fetchedAt: string
	/** sha256 of the payload. Two snapshots with one hash are one table. */
	sourceVersion: string
	payload: RulerOfWisdomPayload
}

/**
 * Bond kind → edge type.
 *
 * Upstream names the relationship the way a chemist would; the spec names it
 * the way a facilitator would. This table is the whole translation, and a new
 * bond kind upstream fails loudly in `toGraph` rather than being dropped on
 * the floor.
 */
export const BOND_KIND_TO_EDGE: Readonly<Record<string, EdgeType>> = {
	complements: "pairs_with",
	tensions: "pushes_against",
	feeds: "leads_to",
	precedes: "useful_before",
}

/** Upstream table status → review status. `known` means it is live on the site. */
const TABLE_STATUS: Readonly<Record<string, FrameworkNode["status"]>> = {
	known: "published",
	writing: "proposed",
	gap: "proposed",
}

const FAMILIES: readonly ProblemFamily[] = [
	"needs",
	"fears",
	"meaning",
	"decision",
	"identity",
	"time",
	"skill",
]

/**
 * Period number → scale id. The labels come from upstream; this map only
 * turns "Moment" into the spec's `moment` key so both documents agree.
 */
const PERIOD_TO_SCALE: Readonly<Record<number, Scale>> = {
	1: "moment",
	2: "person",
	3: "life",
	4: "room",
}

export function nodeId(slug: string): string {
	return `fw_${slug}`
}

function isFamily(value: string): value is ProblemFamily {
	return (FAMILIES as readonly string[]).includes(value)
}

/** Unordered key, so a symmetric edge is stored once however it arrived. */
function symmetricKey(a: string, b: string, type: EdgeType): string {
	return [type, ...[a, b].sort()].join("::")
}

export class SourceError extends Error {}

/**
 * Turn one upstream payload into the graph.
 *
 * Loud on anything unexpected. A silently dropped framework or bond is worse
 * than a failed sync: the router would keep answering, just wrongly.
 */
export function toGraph(snapshot: Snapshot): FrameworkGraph {
	const { payload, sourceVersion, fetchedAt } = snapshot

	if (!Array.isArray(payload.bonds)) {
		throw new SourceError(
			"Payload has no `bonds`. The bonds are the edges — without them this is a list, not a graph. Deploy the Ruler of Wisdom agents door, then re-run `npm run sync:frameworks`.",
		)
	}

	const families: ProblemFamilyMeta[] = payload.groups.map((g) => {
		if (!isFamily(g.id)) {
			throw new SourceError(`Unknown problem family upstream: "${g.id}".`)
		}
		return { id: g.id, label: g.label, question: g.question }
	})

	const scales: ScaleMeta[] = payload.periods.map((p) => {
		const id = PERIOD_TO_SCALE[p.n]
		if (!id) throw new SourceError(`Unknown period upstream: ${p.n}.`)
		return { id, label: p.label, period: p.n, grain: p.grain }
	})

	const nodes: FrameworkNode[] = payload.frameworks.map((f) => {
		if (!isFamily(f.group)) {
			throw new SourceError(`Framework "${f.slug}" has unknown group "${f.group}".`)
		}
		const scale = PERIOD_TO_SCALE[f.period]
		if (!scale) {
			throw new SourceError(`Framework "${f.slug}" has unknown period ${f.period}.`)
		}
		const status = TABLE_STATUS[f.status]
		if (!status) {
			throw new SourceError(`Framework "${f.slug}" has unknown status "${f.status}".`)
		}
		return {
			id: nodeId(f.slug),
			slug: f.slug,
			name: f.name,
			symbol: f.symbol,
			teacher: f.source,
			sourceUrl: f.url,
			sourceVersion,
			summary: f.law,
			story: f.story,
			unit: f.unit,
			primaryProblem: f.group,
			primaryScale: scale,
			secondaryProblems: [],
			variables: f.parts,
			n: f.n,
			steps: [],
			usefulWhen: [],
			notUsefulWhen: [],
			evidenceClaimIds: [],
			safetyNotes: [],
			status,
		}
	})

	const byId = new Map(nodes.map((n) => [n.id, n]))
	const edges: FrameworkEdge[] = []
	const seen = new Set<string>()

	const push = (edge: Omit<FrameworkEdge, "id">) => {
		if (!byId.has(edge.fromId) || !byId.has(edge.toId)) {
			throw new SourceError(
				`Edge points at a framework that is not on the table: ${edge.fromId} → ${edge.toId}.`,
			)
		}
		if (edge.fromId === edge.toId) return
		const key = SYMMETRIC_EDGES.includes(edge.type)
			? symmetricKey(edge.fromId, edge.toId, edge.type)
			: [edge.type, edge.fromId, edge.toId].join("::")
		if (seen.has(key)) return
		seen.add(key)
		edges.push({ id: `e${edges.length + 1}_${key.replace(/[^a-z0-9]+/gi, "_")}`, ...edge })
	}

	// 1. The bonds. Josias wrote these by hand and each carries its law.
	for (const b of payload.bonds) {
		const type = BOND_KIND_TO_EDGE[b.kind]
		if (!type) throw new SourceError(`Unknown bond kind upstream: "${b.kind}".`)
		push({
			fromId: nodeId(b.a),
			toId: nodeId(b.b),
			type,
			rationale: b.law,
			source: { kind: "editor", ref: `${payload.resourceUrl}#bonds` },
			confidence: 0.9,
			status: "reviewed",
		})
	}

	// 2. The 1:1 complement on each element. Mostly already a bond; the
	//    dedupe above keeps whichever arrived first and its law.
	for (const f of payload.frameworks) {
		if (!f.complement) continue
		push({
			fromId: nodeId(f.slug),
			toId: nodeId(f.complement),
			type: "pairs_with",
			rationale: `${f.name} is the element across from ${f.complement} on the table.`,
			source: { kind: "framework_page", ref: f.url },
			confidence: 0.8,
			status: "reviewed",
		})
	}

	// 3. Seminars are sitting order — a chain of leads_to. Weaker than a
	//    bond: the order is one good rundown, not a claim about every room.
	const chains: FrameworkChain[] = payload.seminars.map((s) => {
		for (let i = 0; i < s.frameworks.length - 1; i++) {
			push({
				fromId: nodeId(s.frameworks[i]),
				toId: nodeId(s.frameworks[i + 1]),
				type: "leads_to",
				rationale: `Sitting order in the "${s.name}" seminar.`,
				source: { kind: "framework_page", ref: s.url },
				confidence: 0.6,
				status: "proposed",
			})
		}
		return {
			slug: s.slug,
			name: s.name,
			hook: s.hook,
			when: s.when,
			law: s.law,
			nodeIds: s.frameworks.map(nodeId),
			sourceUrl: s.url,
		}
	})

	// 4. Reach: the families a tool touches through its neighbours.
	for (const node of nodes) {
		const reached = new Set<ProblemFamily>()
		for (const e of edges) {
			const otherId =
				e.fromId === node.id ? e.toId : e.toId === node.id ? e.fromId : null
			if (!otherId) continue
			const other = byId.get(otherId)
			if (other && other.primaryProblem !== node.primaryProblem) {
				reached.add(other.primaryProblem)
			}
		}
		node.secondaryProblems = [...reached].sort()
	}

	return {
		sourceUrl: payload.resourceUrl,
		sourceVersion,
		fetchedAt,
		families,
		scales,
		nodes,
		edges,
		chains,
	}
}
