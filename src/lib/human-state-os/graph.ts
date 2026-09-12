/**
 * Graph queries and the validator.
 *
 * WHY THE VALIDATOR LIVES IN THE APP AND NOT ONLY IN THE TEST
 * Acceptance criterion 8 asks for tests over graph references, symmetric-edge
 * rules and source URLs. Those same checks are the ones you want to run
 * against a freshly synced snapshot before shipping, so they are an exported
 * function the tests call — not assertions buried in a test file.
 *
 * A validator that returns problems rather than throwing keeps the failure
 * readable: you get every broken edge at once instead of the first one.
 */

import type {
	EdgeType,
	FrameworkEdge,
	FrameworkGraph,
	FrameworkNode,
	ProblemFamily,
	Scale,
} from "./types"
import { SYMMETRIC_EDGES } from "./types"

/** Editorial home of every framework page. Enforced, not assumed. */
export const CANONICAL_ORIGIN = "https://rulerofwisdom.com"

export interface GraphProblem {
	kind:
		| "missing_node"
		| "self_edge"
		| "duplicate_symmetric_edge"
		| "bad_source_url"
		| "bad_confidence"
		| "unknown_family"
		| "unknown_scale"
		| "orphan_node"
	detail: string
}

export function validateGraph(graph: FrameworkGraph): GraphProblem[] {
	const problems: GraphProblem[] = []
	const ids = new Set(graph.nodes.map((n) => n.id))
	const families = new Set<ProblemFamily>(graph.families.map((f) => f.id))
	const scales = new Set<Scale>(graph.scales.map((s) => s.id))

	for (const node of graph.nodes) {
		if (!node.sourceUrl.startsWith(`${CANONICAL_ORIGIN}/`)) {
			problems.push({
				kind: "bad_source_url",
				detail: `${node.slug} points at ${node.sourceUrl}, which is not on ${CANONICAL_ORIGIN}.`,
			})
		}
		if (!families.has(node.primaryProblem)) {
			problems.push({
				kind: "unknown_family",
				detail: `${node.slug} has family "${node.primaryProblem}", which is not in the table's groups.`,
			})
		}
		if (!scales.has(node.primaryScale)) {
			problems.push({
				kind: "unknown_scale",
				detail: `${node.slug} has scale "${node.primaryScale}", which is not in the table's periods.`,
			})
		}
	}

	const symmetricSeen = new Map<string, string>()
	for (const edge of graph.edges) {
		if (!ids.has(edge.fromId) || !ids.has(edge.toId)) {
			problems.push({
				kind: "missing_node",
				detail: `${edge.id} joins ${edge.fromId} → ${edge.toId}; one of them is not on the table.`,
			})
			continue
		}
		if (edge.fromId === edge.toId) {
			problems.push({ kind: "self_edge", detail: `${edge.id} joins ${edge.fromId} to itself.` })
		}
		if (edge.confidence < 0 || edge.confidence > 1) {
			problems.push({
				kind: "bad_confidence",
				detail: `${edge.id} has confidence ${edge.confidence}, outside 0–1.`,
			})
		}
		if (SYMMETRIC_EDGES.includes(edge.type)) {
			const key = [edge.type, ...[edge.fromId, edge.toId].sort()].join("::")
			const first = symmetricSeen.get(key)
			if (first) {
				problems.push({
					kind: "duplicate_symmetric_edge",
					detail: `${edge.type} between ${edge.fromId} and ${edge.toId} is stored twice (${first} and ${edge.id}).`,
				})
			} else {
				symmetricSeen.set(key, edge.id)
			}
		}
	}

	const connected = new Set<string>()
	for (const edge of graph.edges) {
		connected.add(edge.fromId)
		connected.add(edge.toId)
	}
	for (const node of graph.nodes) {
		if (!connected.has(node.id)) {
			problems.push({
				kind: "orphan_node",
				detail: `${node.slug} has no bonds. It is on the table but not in the graph.`,
			})
		}
	}

	return problems
}

export function nodesBySlug(graph: FrameworkGraph): Map<string, FrameworkNode> {
	return new Map(graph.nodes.map((n) => [n.slug, n]))
}

export function nodesById(graph: FrameworkGraph): Map<string, FrameworkNode> {
	return new Map(graph.nodes.map((n) => [n.id, n]))
}

export interface Neighbour {
	node: FrameworkNode
	edge: FrameworkEdge
	/** True when the edge runs from the asked-about node outward. */
	outbound: boolean
}

export function neighboursOf(
	graph: FrameworkGraph,
	nodeId: string,
	types?: readonly EdgeType[],
): Neighbour[] {
	const byId = nodesById(graph)
	const out: Neighbour[] = []
	for (const edge of graph.edges) {
		if (types && !types.includes(edge.type)) continue
		const otherId =
			edge.fromId === nodeId ? edge.toId : edge.toId === nodeId ? edge.fromId : null
		if (!otherId) continue
		const node = byId.get(otherId)
		if (node) out.push({ node, edge, outbound: edge.fromId === nodeId })
	}
	return out
}
