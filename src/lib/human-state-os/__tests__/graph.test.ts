/**
 * Acceptance criterion 8: graph references, symmetric-edge rules, source URLs.
 *
 * These run against the committed snapshot, so they are also the gate on a
 * `npm run sync:frameworks` that pulled something broken.
 */

import { describe, expect, it } from "vitest"

import { CANONICAL_ORIGIN, neighboursOf, nodesBySlug, validateGraph } from "../graph"
import { FRAMEWORK_GRAPH, SNAPSHOT } from "../snapshot"
import { BOND_KIND_TO_EDGE, nodeId } from "../source"
import { SYMMETRIC_EDGES } from "../types"

const graph = FRAMEWORK_GRAPH

describe("the snapshot", () => {
	it("carries a source version and a fetch time", () => {
		expect(SNAPSHOT.sourceVersion).toMatch(/^[a-f0-9]{16}$/)
		expect(Number.isNaN(Date.parse(SNAPSHOT.fetchedAt))).toBe(false)
	})

	it("holds every framework the table publishes", () => {
		expect(graph.nodes).toHaveLength(SNAPSHOT.payload.frameworks.length)
		expect(graph.nodes.length).toBeGreaterThanOrEqual(36)
	})

	it("keeps the seven families and four scales", () => {
		expect(graph.families.map((f) => f.id).sort()).toEqual([
			"decision",
			"fears",
			"identity",
			"meaning",
			"needs",
			"skill",
			"time",
		])
		expect(graph.scales.map((s) => s.id)).toEqual(["moment", "person", "life", "room"])
	})
})

describe("the graph", () => {
	it("has no structural problems", () => {
		expect(validateGraph(graph)).toEqual([])
	})

	it("gives every framework a stable id and a live source URL", () => {
		for (const node of graph.nodes) {
			expect(node.id).toBe(nodeId(node.slug))
			expect(node.sourceUrl.startsWith(`${CANONICAL_ORIGIN}/forum/`)).toBe(true)
			expect(node.sourceVersion).toBe(SNAPSHOT.sourceVersion)
		}
	})

	it("resolves every edge to a framework on the table", () => {
		const ids = new Set(graph.nodes.map((n) => n.id))
		for (const edge of graph.edges) {
			expect(ids.has(edge.fromId)).toBe(true)
			expect(ids.has(edge.toId)).toBe(true)
			expect(edge.rationale.length).toBeGreaterThan(0)
			expect(edge.confidence).toBeGreaterThan(0)
			expect(edge.confidence).toBeLessThanOrEqual(1)
		}
	})

	it("stores a symmetric edge once, whichever way it was written", () => {
		const keys = graph.edges
			.filter((e) => SYMMETRIC_EDGES.includes(e.type))
			.map((e) => [e.type, ...[e.fromId, e.toId].sort()].join("::"))
		expect(new Set(keys).size).toBe(keys.length)
	})

	it("carries every bond the table publishes", () => {
		for (const bond of SNAPSHOT.payload.bonds) {
			const type = BOND_KIND_TO_EDGE[bond.kind]
			expect(type).toBeDefined()
			const found = graph.edges.some(
				(e) =>
					e.type === type &&
					((e.fromId === nodeId(bond.a) && e.toId === nodeId(bond.b)) ||
						(SYMMETRIC_EDGES.includes(type) &&
							e.fromId === nodeId(bond.b) &&
							e.toId === nodeId(bond.a))),
			)
			expect(found, `${bond.a} ${bond.kind} ${bond.b}`).toBe(true)
		}
	})

	it("keeps every seminar chain pointing at real frameworks", () => {
		const ids = new Set(graph.nodes.map((n) => n.id))
		expect(graph.chains.length).toBeGreaterThan(0)
		for (const chain of graph.chains) {
			expect(chain.nodeIds.length).toBeGreaterThan(1)
			for (const id of chain.nodeIds) expect(ids.has(id)).toBe(true)
		}
	})

	it("derives reach from bonds, never from a framework's own family", () => {
		for (const node of graph.nodes) {
			expect(node.secondaryProblems).not.toContain(node.primaryProblem)
			for (const family of node.secondaryProblems) {
				const reached = neighboursOf(graph, node.id).some(
					(n) => n.node.primaryProblem === family,
				)
				expect(reached, `${node.slug} claims reach into ${family}`).toBe(true)
			}
		}
	})

	it("leaves unauthored fields empty rather than invented", () => {
		for (const node of graph.nodes) {
			expect(node.steps).toEqual([])
			expect(node.usefulWhen).toEqual([])
			expect(node.evidenceClaimIds).toEqual([])
		}
	})
})

describe("lookups", () => {
	it("finds a framework by its public slug", () => {
		const bySlug = nodesBySlug(graph)
		const scarf = bySlug.get("scarf")
		expect(scarf?.primaryScale).toBe("room")
		expect(scarf?.sourceUrl).toBe(`${CANONICAL_ORIGIN}/forum/scarf/`)
	})
})
