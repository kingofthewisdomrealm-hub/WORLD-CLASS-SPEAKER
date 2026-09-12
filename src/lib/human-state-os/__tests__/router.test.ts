/**
 * Router fixtures — acceptance criteria 3, 4, 5.
 *
 * The three example chains in spec §8.6 are the fixtures. If a change to the
 * weights stops SCARF answering "the room is defensive", the weights are
 * wrong, not the fixture.
 */

import { describe, expect, it } from "vitest"

import { routeFrameworks } from "../router"
import { FRAMEWORK_GRAPH } from "../snapshot"

const graph = FRAMEWORK_GRAPH
const slugs = (response: ReturnType<typeof routeFrameworks>) =>
	response.routes.map((r) => r.node.slug)

describe("ranking", () => {
	it("answers a defensive room with SCARF (spec §8.6)", () => {
		const response = routeFrameworks(graph, { problem: "needs", scale: "room" })
		expect(slugs(response)[0]).toBe("scarf")
	})

	it("answers an unclear environment with Cynefin (spec §8.6)", () => {
		const response = routeFrameworks(graph, { problem: "decision", scale: "room" })
		expect(slugs(response)[0]).toBe("cynefin")
	})

	it("explains every route it returns", () => {
		const response = routeFrameworks(graph, { problem: "fears", scale: "person" })
		for (const route of response.routes) {
			expect(route.explanation.length).toBeGreaterThan(0)
			expect(Object.keys(route.components)).toHaveLength(7)
		}
	})

	it("is deterministic", () => {
		const query = { problem: "time", scale: "life" } as const
		expect(routeFrameworks(graph, query)).toEqual(routeFrameworks(graph, query))
	})

	it("prefers the asked-for row over a neighbouring one", () => {
		const response = routeFrameworks(graph, { problem: "identity", scale: "room" })
		expect(response.routes[0].node.primaryScale).toBe("room")
	})
})

describe("sequence", () => {
	it("lifts what follows the framework just used", () => {
		const cold = routeFrameworks(graph, { problem: "decision", scale: "room", limit: 36 })
		const after = routeFrameworks(graph, {
			problem: "decision",
			scale: "room",
			after: "cynefin",
			limit: 36,
		})
		const rank = (r: ReturnType<typeof routeFrameworks>, slug: string) =>
			r.routes.findIndex((x) => x.node.slug === slug)
		const followers = graph.edges
			.filter((e) => e.fromId === "fw_cynefin" && e.type === "leads_to")
			.map((e) => e.toId.replace("fw_", ""))
		expect(followers.length).toBeGreaterThan(0)
		const moved = followers.some((slug) => rank(after, slug) < rank(cold, slug))
		expect(moved).toBe(true)
	})

	it("never re-offers the framework just used", () => {
		const response = routeFrameworks(graph, {
			problem: "decision",
			scale: "room",
			after: "cynefin",
		})
		expect(slugs(response)).not.toContain("cynefin")
		expect(response.excluded.some((e) => e.slug === "cynefin")).toBe(true)
	})
})

describe("hard exclusions", () => {
	it("cannot be outranked, even by a facilitator preference", () => {
		const response = routeFrameworks(graph, {
			problem: "needs",
			scale: "room",
			exclude: ["scarf"],
			prefer: ["scarf"],
			limit: 36,
		})
		expect(slugs(response)).not.toContain("scarf")
		expect(response.excluded[0]).toEqual({
			slug: "scarf",
			reason: "Excluded by the facilitator.",
		})
	})
})

describe("uncertainty", () => {
	it("offers an alternative family and a question when the family is unsettled", () => {
		const response = routeFrameworks(graph, {
			problem: "needs",
			scale: "room",
			problemConfidence: 0.4,
		})
		expect(response.alternatives.length).toBeGreaterThan(0)
		expect(response.unresolved.length).toBeGreaterThan(0)
		expect(response.unresolved[0]).toMatch(/\?/)
	})

	it("flattens the family advantage rather than removing it", () => {
		const sure = routeFrameworks(graph, { problem: "needs", scale: "room" })
		const unsure = routeFrameworks(graph, {
			problem: "needs",
			scale: "room",
			problemConfidence: 0.3,
		})
		expect(unsure.routes[0].total).toBeLessThan(sure.routes[0].total)
		expect(unsure.routes[0].components.problemFit).toBe(sure.routes[0].components.problemFit)
	})
})

describe("alternatives", () => {
	// Regression, 2026-09-12: the diagnostic question moved from "Where does the
	// time go?" to "What's it all for?" when only fatigue changed. Alternatives
	// answer "did I read the PROBLEM wrong?" — the room's state has no business
	// in that answer.
	it("does not change what it asks when only the room's state changes", () => {
		const ask = (state: Record<string, number>) =>
			routeFrameworks(graph, {
				problem: "needs",
				scale: "room",
				problemConfidence: 0.3,
				state,
			})
		const rested = ask({})
		const spent = ask({ fatigue: 1 })
		const wiped = ask({ cognitive_load: 1, fatigue: 0.8 })

		expect(spent.unresolved).toEqual(rested.unresolved)
		expect(wiped.unresolved).toEqual(rested.unresolved)
		expect(spent.alternatives.map((a) => a.route.node.slug)).toEqual(
			rested.alternatives.map((a) => a.route.node.slug),
		)
	})

	it("does not depend on how many routes are shown", () => {
		const at = (limit: number) =>
			routeFrameworks(graph, {
				problem: "needs",
				scale: "room",
				problemConfidence: 0.3,
				limit,
			}).alternatives.map((a) => a.route.node.slug)
		expect(at(3)).toEqual(at(6))
		expect(at(6)).toEqual(at(36))
	})

	it("offers a different family and a different scale", () => {
		const response = routeFrameworks(graph, { problem: "needs", scale: "room" })
		const [family, scale] = response.alternatives
		expect(family.route.node.primaryProblem).not.toBe("needs")
		expect(scale.route.node.primaryScale).not.toBe("room")
		expect(family.route.node.id).not.toBe(scale.route.node.id)
	})
})

describe("state", () => {
	it("calls for stabilising before tools when the room is threatened", () => {
		const response = routeFrameworks(graph, {
			problem: "needs",
			scale: "room",
			state: { safety_threat: 0.9 },
		})
		expect(response.stabilise.stabiliseFirst).toBe(true)
		expect(response.stabilise.reasons.length).toBeGreaterThan(0)
	})

	it("pushes heavy tools down when the room is spent", () => {
		// Two tools in the same square, so the only thing separating them is
		// how many parts the room has to hold.
		const square = [...graph.nodes]
			.filter((n) => n.primaryProblem === "needs" && n.primaryScale === "person")
			.sort((a, b) => a.n - b.n)
		const light = square[0]
		const heavy = square[square.length - 1]
		expect(heavy.n).toBeGreaterThan(light.n)

		const gap = (state?: { fatigue: number }) => {
			const r = routeFrameworks(graph, {
				problem: "needs",
				scale: "person",
				state,
				limit: 36,
			})
			const total = (slug: string) =>
				r.routes.find((x) => x.node.slug === slug)?.total ?? 0
			return total(light.slug) - total(heavy.slug)
		}

		expect(gap()).toBe(0)
		expect(gap({ fatigue: 1 })).toBeGreaterThan(0)
	})

	it("leaves the ranking alone when no state is reported", () => {
		const a = routeFrameworks(graph, { problem: "skill", scale: "moment" })
		const b = routeFrameworks(graph, { problem: "skill", scale: "moment", state: {} })
		expect(slugs(a)).toEqual(slugs(b))
	})
})

describe("evidence", () => {
	it("reports zero evidence fit until an evidence table exists", () => {
		const response = routeFrameworks(graph, { problem: "meaning", scale: "life" })
		for (const route of response.routes) expect(route.components.evidenceFit).toBe(0)
	})
})
