/**
 * The Framework Router. STATE → PROBLEM → SCALE → FRAMEWORK.
 *
 * WHY THIS IS ARITHMETIC AND NOT A MODEL
 * Spec §8.5 is explicit: keep the first version interpretable and
 * deterministic. A facilitator has to be able to say out loud why the room
 * is being handed SCARF and not Cynefin, and be argued out of it. A model
 * that returns a good answer nobody can question is worse here than a simple
 * one that shows its working — you cannot improve what you cannot inspect.
 *
 * HOW THE PIECES EARN THEIR PLACE
 *   problem_fit        the column the tool lives in, or the column it reaches
 *                      through a bond Josias wrote
 *   scale_fit          the row, with near rows worth a little
 *   sequence_fit       what usually follows the tool just used
 *   evidence_fit       ALWAYS ZERO TODAY. There is no evidence table yet.
 *                      It stays in the breakdown, visibly empty, so nobody
 *                      mistakes an unmeasured system for a measured one.
 *   facilitator        the human's thumb on the scale, named as such
 *  -burden_penalty     a tired room should not be handed a nine-part tool
 *  -uncertainty        when we are unsure of the family, the family bonus
 *                      shrinks, so alternatives surface instead of hiding
 *
 * HARD EXCLUSIONS ARE NOT SCORED
 * Acceptance criterion 5: an exclusion cannot be beaten by a high score. So
 * excluded frameworks are removed before any arithmetic happens. A penalty
 * large enough to "always win" is a bug waiting for a bigger bonus.
 */

import { burdenLoad, checkStabiliseFirst, type StateReading, type StabiliseCheck } from "./state"
import { neighboursOf, nodesById, nodesBySlug } from "./graph"
import type { EdgeType, FrameworkGraph, FrameworkNode, ProblemFamily, Scale } from "./types"

export const ROUTE_WEIGHTS = {
	problem: 3,
	scale: 2,
	sequence: 1.5,
	evidence: 1,
	facilitator: 1.5,
	burden: 1,
	uncertainty: 1,
} as const

/**
 * What a near-miss row is worth. Data, not a formula, because the distance
 * between "one moment" and "a whole life" is editorial, not arithmetic.
 */
export const SCALE_DISTANCE_FIT: Readonly<Record<number, number>> = {
	0: 1,
	1: 0.4,
	2: 0.15,
	3: 0.05,
}

/** What the tool just used says about what comes next. */
const SEQUENCE_FIT: Readonly<Partial<Record<EdgeType, number>>> = {
	leads_to: 1,
	useful_before: 1,
	prerequisite_for: 0.8,
	pairs_with: 0.6,
	alternative_to: 0.2,
}

export interface RouteQuery {
	problem: ProblemFamily
	/** 0–1. How sure the problem router is. Low confidence flattens the ranking. */
	problemConfidence?: number
	scale: Scale
	state?: StateReading
	/** Slug of the framework just used, if any. */
	after?: string
	/** Slugs the facilitator wants surfaced. */
	prefer?: string[]
	/** Slugs that must not appear, whatever they score. */
	exclude?: string[]
	limit?: number
}

export interface RouteComponents {
	problemFit: number
	scaleFit: number
	sequenceFit: number
	evidenceFit: number
	facilitatorPreference: number
	burdenPenalty: number
	uncertaintyPenalty: number
}

export interface Route {
	node: FrameworkNode
	total: number
	components: RouteComponents
	/** Plain sentences. What the facilitator reads, and argues with. */
	explanation: string[]
}

export interface RouteResponse {
	query: Required<Pick<RouteQuery, "problem" | "scale">> & { problemConfidence: number }
	stabilise: StabiliseCheck
	routes: Route[]
	alternatives: { reason: string; route: Route }[]
	excluded: { slug: string; reason: string }[]
	/** Questions the router cannot answer for itself. */
	unresolved: string[]
	weights: typeof ROUTE_WEIGHTS
}

function round(value: number): number {
	return Math.round(value * 1000) / 1000
}

export function routeFrameworks(graph: FrameworkGraph, query: RouteQuery): RouteResponse {
	const confidence = query.problemConfidence ?? 1
	const state = query.state ?? {}
	const prefer = new Set(query.prefer ?? [])
	const exclude = new Set(query.exclude ?? [])
	const limit = query.limit ?? 5

	const bySlug = nodesBySlug(graph)
	const byId = nodesById(graph)
	const scaleByIdFn = new Map(graph.scales.map((s) => [s.id, s]))
	const askedPeriod = scaleByIdFn.get(query.scale)?.period ?? 0
	const familyLabel =
		graph.families.find((f) => f.id === query.problem)?.label ?? query.problem

	// Hard exclusions first, before anything is scored.
	const excluded: { slug: string; reason: string }[] = []
	const candidates = graph.nodes.filter((node) => {
		if (exclude.has(node.slug)) {
			excluded.push({ slug: node.slug, reason: "Excluded by the facilitator." })
			return false
		}
		if (query.after && node.slug === query.after) {
			excluded.push({ slug: node.slug, reason: "Just used." })
			return false
		}
		return true
	})

	const sizes = candidates.map((n) => n.n)
	const minN = Math.min(...sizes)
	const maxN = Math.max(...sizes)
	const load = burdenLoad(state)

	const afterNode = query.after ? bySlug.get(query.after) : undefined
	const sequenceFrom = afterNode
		? neighboursOf(graph, afterNode.id).filter((n) => n.outbound || n.edge.type === "useful_after")
		: []

	/**
	 * The two fits, with nothing else mixed in.
	 *
	 * Kept pure and state-free because the alternatives below are answers to
	 * "did I read the PROBLEM wrong?" — a question about the problem, not about
	 * how tired anyone is. Scoring them with the full total let the burden
	 * penalty change which family got nominated, so the diagnostic question
	 * moved when only fatigue moved. It must not.
	 */
	const problemFitOf = (node: FrameworkNode): number =>
		node.primaryProblem === query.problem
			? 1
			: node.secondaryProblems.includes(query.problem)
				? 0.35
				: 0

	const scaleFitOf = (node: FrameworkNode): number => {
		const period = scaleByIdFn.get(node.primaryScale)?.period ?? 0
		return SCALE_DISTANCE_FIT[Math.abs(period - askedPeriod)] ?? 0
	}

	const routes: Route[] = candidates.map((node) => {
		const explanation: string[] = []

		// problem_fit
		const problemFit = problemFitOf(node)
		if (node.primaryProblem === query.problem) {
			explanation.push(`${familyLabel} is its own column on the table.`)
		} else if (problemFit > 0) {
			const bridge = neighboursOf(graph, node.id).find(
				(n) => n.node.primaryProblem === query.problem,
			)
			explanation.push(
				bridge
					? `Reaches ${familyLabel.toLowerCase()} through its bond with ${bridge.node.name}.`
					: `Reaches ${familyLabel.toLowerCase()} through its bonds.`,
			)
		}

		// scale_fit
		const period = scaleByIdFn.get(node.primaryScale)?.period ?? 0
		const distance = Math.abs(period - askedPeriod)
		const scaleFit = scaleFitOf(node)
		if (distance === 0) {
			explanation.push(`Built for ${node.unit}.`)
		} else if (scaleFit > 0) {
			explanation.push(`Built for ${node.unit}, one row off what you asked for.`)
		}

		// sequence_fit
		let sequenceFit = 0
		if (afterNode) {
			for (const neighbour of sequenceFrom) {
				if (neighbour.node.id !== node.id) continue
				const fit = SEQUENCE_FIT[neighbour.edge.type] ?? 0
				if (fit > sequenceFit) {
					sequenceFit = fit
					explanation.push(neighbour.edge.rationale)
				}
			}
		}

		// evidence_fit — see the header. Zero until an evidence table exists.
		const evidenceFit = 0

		const facilitatorPreference = prefer.has(node.slug) ? 1 : 0
		if (facilitatorPreference) explanation.push("You asked for this one.")

		// burden
		const size = maxN === minN ? 0 : (node.n - minN) / (maxN - minN)
		const burdenPenalty = load * size
		if (burdenPenalty > 0.2) {
			explanation.push(
				`${node.n} parts to hold, and the room is running low. Heavy for right now.`,
			)
		}

		const uncertaintyPenalty = (1 - confidence) * problemFit
		if (uncertaintyPenalty > 0.2) {
			explanation.push(
				`Only ${Math.round(confidence * 100)}% sure this is a ${familyLabel.toLowerCase()} problem, so that advantage is discounted.`,
			)
		}

		const components: RouteComponents = {
			problemFit: round(problemFit),
			scaleFit: round(scaleFit),
			sequenceFit: round(sequenceFit),
			evidenceFit,
			facilitatorPreference,
			burdenPenalty: round(burdenPenalty),
			uncertaintyPenalty: round(uncertaintyPenalty),
		}

		const total =
			ROUTE_WEIGHTS.problem * problemFit +
			ROUTE_WEIGHTS.scale * scaleFit +
			ROUTE_WEIGHTS.sequence * sequenceFit +
			ROUTE_WEIGHTS.evidence * evidenceFit +
			ROUTE_WEIGHTS.facilitator * facilitatorPreference -
			ROUTE_WEIGHTS.burden * burdenPenalty -
			ROUTE_WEIGHTS.uncertainty * uncertaintyPenalty

		return { node, total: round(total), components, explanation }
	})

	// Deterministic: score, then slug. Never insertion order.
	routes.sort((a, b) => b.total - a.total || a.node.slug.localeCompare(b.node.slug))

	const top = routes.slice(0, limit)
	const byNodeId = new Map(routes.map((r) => [r.node.id, r]))

	/**
	 * Pick the best route among a candidate set, ranked by a state-free score.
	 * Deterministic and independent of `limit` — a display cutoff must never
	 * decide which alternative the facilitator is shown.
	 */
	const bestBy = (
		eligible: (node: FrameworkNode) => boolean,
		score: (node: FrameworkNode) => number,
	): Route | undefined => {
		let best: { route: Route; score: number } | undefined
		for (const node of candidates) {
			if (!eligible(node)) continue
			const value = score(node)
			const route = byNodeId.get(node.id)
			if (!route) continue
			if (
				!best ||
				value > best.score ||
				(value === best.score && node.slug.localeCompare(best.route.node.slug) < 0)
			) {
				best = { route, score: value }
			}
		}
		return best?.route
	}

	const alternatives: { reason: string; route: Route }[] = []

	// "Did I read the problem wrong?" — the best tool in another family,
	// preferring one that still reaches the family you asked about.
	const otherFamily = bestBy(
		(node) => node.primaryProblem !== query.problem,
		(node) =>
			ROUTE_WEIGHTS.scale * scaleFitOf(node) + ROUTE_WEIGHTS.problem * problemFitOf(node),
	)
	if (otherFamily) {
		const label =
			graph.families.find((f) => f.id === otherFamily.node.primaryProblem)?.label ??
			otherFamily.node.primaryProblem
		alternatives.push({
			reason: `If this is really a ${label.toLowerCase()} problem, not a ${familyLabel.toLowerCase()} one.`,
			route: otherFamily,
		})
	}

	// "Did I read the scale wrong?" — same idea, one axis over.
	const otherScale = bestBy(
		(node) =>
			node.primaryScale !== query.scale && node.id !== otherFamily?.node.id,
		(node) => ROUTE_WEIGHTS.problem * problemFitOf(node),
	)
	if (otherScale) {
		alternatives.push({
			reason: `If the real unit is ${otherScale.node.unit}, not what you picked.`,
			route: otherScale,
		})
	}

	const unresolved: string[] = []
	if (confidence < 0.6) {
		const runnerUp = graph.families.find(
			(f) => f.id === alternatives[0]?.route.node.primaryProblem,
		)
		unresolved.push(
			runnerUp
				? `Ask the room first: "${runnerUp.question}" — the family is not settled.`
				: "The problem family is not settled. Ask before handing out a tool.",
		)
	}
	if (byId.size !== graph.nodes.length) {
		unresolved.push("Duplicate node ids in the graph; run the graph validator.")
	}

	return {
		query: { problem: query.problem, scale: query.scale, problemConfidence: confidence },
		stabilise: checkStabiliseFirst(state),
		routes: top,
		alternatives,
		excluded,
		unresolved,
		weights: ROUTE_WEIGHTS,
	}
}
