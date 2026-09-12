/**
 * Human State OS — the domain types.
 *
 * WHY THIS FILE EXISTS
 * The spec in `docs/human-state-os/` describes a graph, a state layer, and a
 * router. This file is the contract between them, and nothing else in the
 * module is allowed to invent a shape.
 *
 * THE ONE RULE
 * No type here names a framework. The moment anything reads
 * `if (node.slug === "scarf")` the graph is dead and we are back to 36
 * hand-written special cases. Frameworks are rows of data that arrive from
 * Ruler of Wisdom; the code only knows families, scales, and edge kinds.
 *
 * Fields the upstream table does not yet carry (steps, usefulWhen,
 * notUsefulWhen, evidence claims, safety notes) are declared here and left
 * empty on purpose. An empty array is an honest "not authored yet". Filling
 * them with guesses would put invented editorial into a system whose whole
 * point is that the editorial lives at rulerofwisdom.com.
 */

/** The seven problem families. Ids match `group` on the Ruler of Wisdom table. */
export type ProblemFamily =
	| "needs"
	| "fears"
	| "meaning"
	| "decision"
	| "identity"
	| "time"
	| "skill"

/** The four scales. Ids are derived from the table's periods 1–4. */
export type Scale = "moment" | "person" | "life" | "room"

/**
 * Edge kinds, from spec §8.4.
 *
 * `applies_to_scale`, `addresses_problem` and `mechanism` from the spec are
 * deliberately absent: the first two are fields on the node (primaryProblem,
 * primaryScale) and storing them twice invites drift; `mechanism` has no
 * mechanism table to point at yet.
 */
export type EdgeType =
	| "leads_to"
	| "pairs_with"
	| "pushes_against"
	| "prerequisite_for"
	| "alternative_to"
	| "useful_after"
	| "useful_before"

/** Edge kinds where direction carries no meaning. Enforced by the graph tests. */
export const SYMMETRIC_EDGES: readonly EdgeType[] = [
	"pairs_with",
	"pushes_against",
	"alternative_to",
]

export type ReviewStatus = "proposed" | "reviewed" | "published"

/** Where an edge came from. `ref` is a URL or a table field name, never prose. */
export interface EdgeSource {
	kind: "framework_page" | "editor" | "research"
	ref: string
}

export interface FrameworkPart {
	key: string
	label: string
	depth: string
}

export interface FrameworkNode {
	/** Immutable internal id. Survives a slug rename upstream. */
	id: string
	/** Current public slug on rulerofwisdom.com. */
	slug: string
	name: string
	symbol: string
	/** The teacher the tool came from. "Ruler of Wisdom" means it is Josias's. */
	teacher: string
	sourceUrl: string
	sourceVersion: string
	/** One sentence: what this set claims is complete. The table's `law`. */
	summary: string
	/** StoryBrand paragraph from the table. Display copy, never parsed. */
	story: string
	/** What you point the tool at — "a life", "a person", "the room". */
	unit: string
	primaryProblem: ProblemFamily
	primaryScale: Scale
	/**
	 * Families this tool reaches through its bonds, not through its own column.
	 * Derived, never hand-written — see `source.ts`.
	 */
	secondaryProblems: ProblemFamily[]
	/** The named parts of the set. The table's `parts`. */
	variables: FrameworkPart[]
	/** How many named parts. Completeness as a number. */
	n: number
	/** Not authored upstream yet. Empty is honest; do not seed with guesses. */
	steps: string[]
	usefulWhen: string[]
	notUsefulWhen: string[]
	evidenceClaimIds: string[]
	safetyNotes: string[]
	status: ReviewStatus
}

export interface FrameworkEdge {
	id: string
	fromId: string
	toId: string
	type: EdgeType
	/** Why these two relate. Shown to the facilitator, so it must read as English. */
	rationale: string
	source: EdgeSource
	confidence: number
	status: ReviewStatus
}

/** A seminar: one combination of frameworks in sitting order. */
export interface FrameworkChain {
	slug: string
	name: string
	hook: string
	when: string
	law: string
	nodeIds: string[]
	sourceUrl: string
}

export interface ProblemFamilyMeta {
	id: ProblemFamily
	label: string
	question: string
}

export interface ScaleMeta {
	id: Scale
	label: string
	/** The table's period number, 1–4. Kept so the ordering is upstream's. */
	period: number
	grain: string
}

export interface FrameworkGraph {
	sourceUrl: string
	sourceVersion: string
	fetchedAt: string
	families: ProblemFamilyMeta[]
	scales: ScaleMeta[]
	nodes: FrameworkNode[]
	edges: FrameworkEdge[]
	chains: FrameworkChain[]
}
