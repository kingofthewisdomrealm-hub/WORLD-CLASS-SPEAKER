import type { Metadata } from "next"

import { RouteExplorer } from "@/components/human-state-os/route-explorer"

export const metadata: Metadata = {
	title: "Human State OS — Route Explorer",
	description:
		"Read-only explorer for STATE → PROBLEM → SCALE → FRAMEWORK over the Ruler of Wisdom table.",
	robots: { index: false, follow: false },
}

export default function HumanStateOsPage() {
	return (
		<main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
			<header className="mb-8">
				<p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
					Human State OS · phase 1
				</p>
				<h1 className="mt-1 font-serif text-3xl">Route Explorer</h1>
				<p className="mt-2 max-w-2xl text-sm text-muted-foreground">
					State, then problem, then scale, then a framework — with the arithmetic
					shown so you can disagree with it. Nothing here writes, senses, or
					measures anyone.
				</p>
			</header>
			<RouteExplorer />
		</main>
	)
}
