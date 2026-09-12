"use client"

/**
 * The route explorer. Read-only on purpose.
 *
 * WHY READ-ONLY
 * This screen exists to be argued with. A facilitator picks a problem, a
 * scale and the state of the room, and sees which thinking tool the graph
 * hands back AND the arithmetic that got it there. Nothing here writes, so
 * there is no session to corrupt while the routing is still being tuned.
 *
 * Everything on screen comes from the snapshot. There is no copy in this
 * file about any individual framework — names, laws and stories are the
 * table's words, fetched, not retyped.
 */

import { useMemo, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FRAMEWORK_GRAPH, SNAPSHOT } from "@/lib/human-state-os/snapshot"
import { type Route, routeFrameworks } from "@/lib/human-state-os/router"
import type { ProblemFamily, Scale } from "@/lib/human-state-os/types"
import type { StateDimension } from "@/lib/human-state-os/state"

const graph = FRAMEWORK_GRAPH

/** The dimensions that actually change a route today. The other twelve are
 *  recorded by the state layer but do not yet move the arithmetic, so putting
 *  them on screen would promise a precision the router does not have. */
const LIVE_DIMENSIONS: { id: StateDimension; label: string; hint: string }[] = [
	{ id: "safety_threat", label: "Threat", hint: "Will the room say the true thing?" },
	{ id: "fatigue", label: "Fatigue", hint: "How spent is the room?" },
	{ id: "cognitive_load", label: "Load", hint: "How much are they already holding?" },
	{ id: "pain", label: "Discomfort", hint: "Bodies before insight." },
]

function Meter({ route }: { route: Route }) {
	const { components } = route
	const bars: { label: string; value: number; negative?: boolean }[] = [
		{ label: "problem", value: components.problemFit },
		{ label: "scale", value: components.scaleFit },
		{ label: "sequence", value: components.sequenceFit },
		{ label: "evidence", value: components.evidenceFit },
		{ label: "chosen", value: components.facilitatorPreference },
		{ label: "burden", value: components.burdenPenalty, negative: true },
		{ label: "unsure", value: components.uncertaintyPenalty, negative: true },
	]
	return (
		<dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-4">
			{bars.map((bar) => (
				<div key={bar.label} className="flex items-center gap-2">
					<dt className="w-16 shrink-0 font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
						{bar.label}
					</dt>
					<dd className="flex flex-1 items-center gap-1.5">
						<div className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
							<div
								className={`h-full rounded-full ${bar.negative ? "bg-destructive" : "bg-primary"}`}
								style={{ width: `${Math.min(100, bar.value * 100)}%` }}
							/>
						</div>
						<span className="w-8 shrink-0 text-right font-mono text-[11px] text-muted-foreground">
							{bar.negative && bar.value > 0 ? "−" : ""}
							{bar.value.toFixed(2)}
						</span>
					</dd>
				</div>
			))}
		</dl>
	)
}

function RouteCard({ route, rank }: { route: Route; rank: number }) {
	const { node } = route
	return (
		<article className="rounded-lg border border-border bg-card p-4">
			<div className="flex items-start gap-3">
				<span className="flex size-10 shrink-0 items-center justify-center rounded border border-primary/30 bg-primary/10 font-mono text-sm font-medium text-primary">
					{node.symbol}
				</span>
				<div className="min-w-0 flex-1">
					<div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
						<h3 className="font-medium">
							<span className="text-muted-foreground">{rank}. </span>
							{node.name}
						</h3>
						<span className="text-xs text-muted-foreground">{node.teacher}</span>
						<span className="ml-auto font-mono text-sm text-primary">
							{route.total.toFixed(2)}
						</span>
					</div>
					<p className="mt-1 text-sm text-muted-foreground">{node.summary}</p>
					<div className="mt-2 flex flex-wrap gap-1.5">
						<Badge variant="secondary">{node.primaryProblem}</Badge>
						<Badge variant="outline">{node.primaryScale}</Badge>
						<Badge variant="outline">{node.n} parts</Badge>
					</div>
					<ul className="mt-3 space-y-1 text-sm">
						{route.explanation.map((line) => (
							<li key={line} className="flex gap-2 text-muted-foreground">
								<span aria-hidden className="text-primary">
									—
								</span>
								<span>{line}</span>
							</li>
						))}
					</ul>
					<Meter route={route} />
					<a
						className="mt-3 inline-block text-xs text-primary underline underline-offset-4"
						href={node.sourceUrl}
						target="_blank"
						rel="noreferrer"
					>
						Read the page on rulerofwisdom.com
					</a>
				</div>
			</div>
		</article>
	)
}

export function RouteExplorer() {
	const [problem, setProblem] = useState<ProblemFamily>("needs")
	const [scale, setScale] = useState<Scale>("room")
	const [confidence, setConfidence] = useState(1)
	const [after, setAfter] = useState("")
	const [state, setState] = useState<Partial<Record<StateDimension, number>>>({})
	const [exclude, setExclude] = useState<string[]>([])

	const response = useMemo(
		() =>
			routeFrameworks(graph, {
				problem,
				scale,
				problemConfidence: confidence,
				state,
				after: after || undefined,
				exclude,
				limit: 6,
			}),
		[problem, scale, confidence, after, state, exclude],
	)

	const family = graph.families.find((f) => f.id === problem)
	const sortedNodes = [...graph.nodes].sort((a, b) => a.name.localeCompare(b.name))

	return (
		<div className="grid gap-8 lg:grid-cols-[20rem_1fr]">
			<aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
				<fieldset>
					<legend className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
						Problem
					</legend>
					<div className="mt-2 flex flex-wrap gap-1.5">
						{graph.families.map((f) => (
							<Button
								key={f.id}
								size="sm"
								variant={f.id === problem ? "default" : "outline"}
								title={f.question}
								onClick={() => setProblem(f.id)}
							>
								{f.label}
							</Button>
						))}
					</div>
					{family ? (
						<p className="mt-2 text-sm text-muted-foreground">{family.question}</p>
					) : null}
				</fieldset>

				<fieldset>
					<legend className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
						Scale
					</legend>
					<div className="mt-2 flex flex-wrap gap-1.5">
						{graph.scales.map((s) => (
							<Button
								key={s.id}
								size="sm"
								variant={s.id === scale ? "default" : "outline"}
								title={s.grain}
								onClick={() => setScale(s.id)}
							>
								{s.label}
							</Button>
						))}
					</div>
				</fieldset>

				<fieldset>
					<legend className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
						How sure are you? {Math.round(confidence * 100)}%
					</legend>
					<input
						className="mt-2 w-full accent-primary"
						type="range"
						min={0.1}
						max={1}
						step={0.1}
						value={confidence}
						onChange={(e) => setConfidence(Number(e.target.value))}
					/>
					<p className="text-xs text-muted-foreground">
						Below 60% the router stops insisting and asks a question instead.
					</p>
				</fieldset>

				<fieldset>
					<legend className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
						State of the room
					</legend>
					<div className="mt-2 space-y-3">
						{LIVE_DIMENSIONS.map((d) => (
							<label key={d.id} className="block">
								<span className="flex justify-between text-sm">
									<span>{d.label}</span>
									<span className="font-mono text-xs text-muted-foreground">
										{((state[d.id] ?? 0) * 100).toFixed(0)}%
									</span>
								</span>
								<input
									className="w-full accent-primary"
									type="range"
									min={0}
									max={1}
									step={0.1}
									value={state[d.id] ?? 0}
									onChange={(e) =>
										setState((prev) => ({ ...prev, [d.id]: Number(e.target.value) }))
									}
								/>
								<span className="text-xs text-muted-foreground">{d.hint}</span>
							</label>
						))}
					</div>
					<p className="mt-2 text-xs text-muted-foreground">
						Someone says these out loud. Nothing here is measured or inferred.
					</p>
				</fieldset>

				<fieldset>
					<legend className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
						Just used
					</legend>
					<select
						className="mt-2 w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
						value={after}
						onChange={(e) => setAfter(e.target.value)}
					>
						<option value="">Nothing yet</option>
						{sortedNodes.map((n) => (
							<option key={n.slug} value={n.slug}>
								{n.name}
							</option>
						))}
					</select>
				</fieldset>

				<fieldset>
					<legend className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
						Off the table today
					</legend>
					<select
						className="mt-2 w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
						value=""
						onChange={(e) => {
							const slug = e.target.value
							if (slug && !exclude.includes(slug)) setExclude((prev) => [...prev, slug])
						}}
					>
						<option value="">Add an exclusion…</option>
						{sortedNodes.map((n) => (
							<option key={n.slug} value={n.slug}>
								{n.name}
							</option>
						))}
					</select>
					{exclude.length > 0 ? (
						<div className="mt-2 flex flex-wrap gap-1.5">
							{exclude.map((slug) => (
								<Button
									key={slug}
									size="sm"
									variant="secondary"
									onClick={() => setExclude((prev) => prev.filter((s) => s !== slug))}
								>
									{slug} ✕
								</Button>
							))}
						</div>
					) : null}
					<p className="mt-2 text-xs text-muted-foreground">
						An exclusion is removed before anything is scored. It cannot be outranked.
					</p>
				</fieldset>
			</aside>

			<section className="space-y-4">
				{response.stabilise.stabiliseFirst ? (
					<div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4">
						<h2 className="font-medium">Stabilise before you hand out a tool.</h2>
						<ul className="mt-2 space-y-1 text-sm text-muted-foreground">
							{response.stabilise.reasons.map((reason) => (
								<li key={reason}>{reason}</li>
							))}
						</ul>
					</div>
				) : null}

				{response.unresolved.map((question) => (
					<div key={question} className="rounded-lg border border-primary/30 bg-primary/5 p-4 text-sm">
						{question}
					</div>
				))}

				<div className="space-y-3">
					{response.routes.map((route, i) => (
						<RouteCard key={route.node.id} route={route} rank={i + 1} />
					))}
				</div>

				{response.alternatives.length > 0 ? (
					<div className="space-y-3">
						<h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
							Or you read the room wrong
						</h2>
						{response.alternatives.map((alt) => (
							<div key={alt.route.node.id}>
								<p className="mb-2 text-sm text-muted-foreground">{alt.reason}</p>
								<RouteCard route={alt.route} rank={0} />
							</div>
						))}
					</div>
				) : null}

				<footer className="border-t border-border pt-4 text-xs text-muted-foreground">
					<p>
						{graph.nodes.length} frameworks · {graph.edges.length} edges ·{" "}
						{graph.chains.length} seminars · snapshot{" "}
						<code className="font-mono">{SNAPSHOT.sourceVersion}</code> taken{" "}
						{SNAPSHOT.fetchedAt.slice(0, 10)}
					</p>
					<p className="mt-1">
						Edited at{" "}
						<a className="text-primary underline underline-offset-4" href={graph.sourceUrl}>
							rulerofwisdom.com
						</a>
						. Refresh with <code className="font-mono">npm run sync:frameworks</code>.
					</p>
				</footer>
			</section>
		</div>
	)
}
