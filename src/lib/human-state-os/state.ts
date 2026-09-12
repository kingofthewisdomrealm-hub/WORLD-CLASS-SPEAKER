/**
 * Human State OS — the state layer.
 *
 * WHY THIS FILE EXISTS
 * Spec §5 lists sixteen state dimensions and §7 asks one question the router
 * cannot answer on its own: must the room be stabilised before any thinking
 * tool is worth handing out? A tired, threatened room does not need a better
 * framework. It needs a break.
 *
 * WHAT THIS FILE DELIBERATELY DOES NOT DO
 * It does not infer state. Every value arrives from a named source — someone
 * said it, or a facilitator judged it. There is no sensor path, no biometric,
 * and no guessing from behaviour. Spec §17 makes that a hard constraint and
 * acceptance criterion 9 restates it, so it is enforced by the type: a value
 * without a `source` will not compile.
 *
 * State affects routing in exactly two ways, both of them explainable out loud:
 *   1. `stabiliseFirst` — a boundary, not a score. It is never outranked.
 *   2. `burden` — a tired room gets heavy tools pushed down the list.
 * Anything cleverer than that is a hypothesis, and hypotheses belong in the
 * research doc until they are tested.
 */

export type StateDimension =
	| "energy"
	| "focus"
	| "arousal"
	| "valence"
	| "connection"
	| "fatigue"
	| "confidence"
	| "stress"
	| "safety_threat"
	| "curiosity"
	| "reflection"
	| "motivation"
	| "agency"
	| "competence"
	| "pain"
	| "cognitive_load"

export const STATE_DIMENSIONS: readonly StateDimension[] = [
	"energy",
	"focus",
	"arousal",
	"valence",
	"connection",
	"fatigue",
	"confidence",
	"stress",
	"safety_threat",
	"curiosity",
	"reflection",
	"motivation",
	"agency",
	"competence",
	"pain",
	"cognitive_load",
]

/**
 * Where a reading came from. Spec §5.1: every value keeps its measurement
 * source. `sensor` is in the union because the spec names it, and it is
 * rejected by `assertNoSensorInput` until a consent review exists.
 */
export type StateSource =
	| "self_report"
	| "facilitator"
	| "behavior"
	| "sensor"
	| "aggregate"

export interface StateObservation {
	dimension: StateDimension
	/** 0–1 within the named instrument. Not comparable across scaleIds. */
	value: number
	/** Identifies the actual question asked. "0–1" alone is not a scale. */
	scaleId: string
	source: StateSource
	observedAt: string
	/** 0–1. How much the reporter trusts their own reading. */
	confidence?: number
}

/** A reduced view: latest value per dimension. What the router consumes. */
export type StateReading = Partial<Record<StateDimension, number>>

/**
 * Dimensions that, when high, mean the room is not ready for a thinking tool.
 *
 * Chosen because each one is a documented brake on the work rather than a
 * mood: threat narrows what a person will say out loud, fatigue and cognitive
 * load remove the working memory a framework needs, and pain outranks
 * everything. Data, not a branch — add a dimension here and the check follows.
 */
export const STABILISE_TRIGGERS: readonly {
	dimension: StateDimension
	atOrAbove: number
	because: string
}[] = [
	{
		dimension: "safety_threat",
		atOrAbove: 0.7,
		because: "A threatened room will not say the true thing a framework needs.",
	},
	{
		dimension: "fatigue",
		atOrAbove: 0.8,
		because: "Past this, more structure is noise. Rest first.",
	},
	{
		dimension: "cognitive_load",
		atOrAbove: 0.8,
		because: "No working memory left to hold a new set of parts.",
	},
	{
		dimension: "pain",
		atOrAbove: 0.6,
		because: "Discomfort outranks insight. Handle the body first.",
	},
]

export interface StabiliseCheck {
	stabiliseFirst: boolean
	reasons: string[]
}

export function checkStabiliseFirst(state: StateReading): StabiliseCheck {
	const reasons = STABILISE_TRIGGERS.filter((t) => {
		const value = state[t.dimension]
		return typeof value === "number" && value >= t.atOrAbove
	}).map((t) => t.because)

	return { stabiliseFirst: reasons.length > 0, reasons }
}

/**
 * How much capacity the room has for a heavy tool, 0–1 where 1 is "empty".
 *
 * Fatigue and cognitive load are taken at their worst rather than averaged:
 * a room that is wide awake but already holding too much is still full.
 */
export function burdenLoad(state: StateReading): number {
	const fatigue = state.fatigue ?? 0
	const load = state.cognitive_load ?? 0
	return Math.min(1, Math.max(fatigue, load))
}

/**
 * Guard for acceptance criterion 9. Call it at any boundary that accepts
 * observations from outside this module.
 */
export function assertNoSensorInput(observations: StateObservation[]): void {
	const sensed = observations.filter((o) => o.source === "sensor")
	if (sensed.length > 0) {
		throw new Error(
			`Human State OS: sensor-sourced observations are not permitted before a consent and reliability review (spec §17). Rejected: ${sensed
				.map((o) => o.dimension)
				.join(", ")}`,
		)
	}
}

/** Latest-wins reduction from an observation log to the router's input. */
export function toStateReading(observations: StateObservation[]): StateReading {
	assertNoSensorInput(observations)
	const latest = new Map<StateDimension, StateObservation>()
	for (const o of observations) {
		const current = latest.get(o.dimension)
		if (!current || o.observedAt >= current.observedAt) latest.set(o.dimension, o)
	}
	const reading: StateReading = {}
	for (const [dimension, o] of latest) reading[dimension] = o.value
	return reading
}
