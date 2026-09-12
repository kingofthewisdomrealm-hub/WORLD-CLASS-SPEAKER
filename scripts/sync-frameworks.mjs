/**
 * Pull the Ruler of Wisdom table into a committed, versioned snapshot.
 *
 * WHY A SNAPSHOT AND NOT A LIVE FETCH
 * A build that reaches the network is a build that can fail for reasons that
 * have nothing to do with the code. The table changes when Josias edits it —
 * a few times a month, not a few times a second — so the right shape is a
 * file in git that a human ran a command to update, with the hash of what
 * they pulled sitting next to it. Reviewable in a diff, reproducible offline.
 *
 * WHY THIS SCRIPT DOES NO MAPPING
 * Payload → graph lives in `src/lib/human-state-os/source.ts`, which is typed
 * and tested. This script only fetches, checks the shape, hashes, and writes.
 * Two implementations of the mapping would be one too many.
 *
 *   node scripts/sync-frameworks.mjs
 *   node scripts/sync-frameworks.mjs --from ../RULEROFWISDOM/payload.json
 */

import { createHash } from "node:crypto"
import { readFile, writeFile } from "node:fs/promises"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const HERE = dirname(fileURLToPath(import.meta.url))
const OUT = resolve(HERE, "../src/lib/human-state-os/framework-snapshot.json")
const DEFAULT_SOURCE = "https://rulerofwisdom.com/agents/frameworks.json"

const REQUIRED_ARRAYS = ["groups", "periods", "frameworks", "bonds", "seminars"]

function fail(message) {
	console.error(`\n  sync:frameworks — ${message}\n`)
	process.exit(1)
}

function argValue(flag) {
	const i = process.argv.indexOf(flag)
	return i === -1 ? null : process.argv[i + 1]
}

async function load(source) {
	if (/^https?:\/\//.test(source)) {
		const res = await fetch(source, { headers: { accept: "application/json" } })
		if (!res.ok) fail(`${source} returned HTTP ${res.status}.`)
		return res.json()
	}
	return JSON.parse(await readFile(resolve(process.cwd(), source), "utf8"))
}

function check(payload) {
	for (const key of REQUIRED_ARRAYS) {
		if (!Array.isArray(payload[key]) || payload[key].length === 0) {
			if (key === "bonds") {
				fail(
					"the payload has no `bonds`. The bonds are the edges of the graph.\n" +
						"  Ruler of Wisdom publishes them only after its agents door is deployed —\n" +
						"  double-click SHIP.command in the RULER OF WISDOM folder, then re-run this.",
				)
			}
			fail(`the payload has no \`${key}\`. Refusing to write a broken snapshot.`)
		}
	}
	const slugs = new Set(payload.frameworks.map((f) => f.slug))
	if (slugs.size !== payload.frameworks.length) fail("duplicate framework slugs upstream.")

	const missing = []
	for (const b of payload.bonds) {
		if (!slugs.has(b.a)) missing.push(b.a)
		if (!slugs.has(b.b)) missing.push(b.b)
	}
	for (const s of payload.seminars) {
		for (const slug of s.frameworks) if (!slugs.has(slug)) missing.push(slug)
	}
	if (missing.length > 0) {
		fail(`bonds or seminars point at frameworks that are not on the table: ${[...new Set(missing)].join(", ")}.`)
	}
}

async function previous() {
	try {
		return JSON.parse(await readFile(OUT, "utf8"))
	} catch {
		return null
	}
}

const source = argValue("--from") ?? DEFAULT_SOURCE
const payload = await load(source)
check(payload)

const sourceVersion = createHash("sha256")
	.update(JSON.stringify(payload))
	.digest("hex")
	.slice(0, 16)

const before = await previous()
if (before?.sourceVersion === sourceVersion) {
	console.log(`\n  sync:frameworks — already current (${sourceVersion}). Nothing written.\n`)
	process.exit(0)
}

const snapshot = {
	sourceUrl: payload.resourceUrl ?? source,
	fetchedAt: new Date().toISOString(),
	sourceVersion,
	payload,
}

await writeFile(OUT, `${JSON.stringify(snapshot, null, "\t")}\n`, "utf8")

const oldSlugs = new Set((before?.payload.frameworks ?? []).map((f) => f.slug))
const newSlugs = new Set(payload.frameworks.map((f) => f.slug))
const added = [...newSlugs].filter((s) => !oldSlugs.has(s))
const removed = [...oldSlugs].filter((s) => !newSlugs.has(s))

console.log(`
  sync:frameworks
  ---------------
  source      ${source}
  version     ${before ? `${before.sourceVersion} -> ` : ""}${sourceVersion}
  frameworks  ${payload.frameworks.length}
  bonds       ${payload.bonds.length}
  seminars    ${payload.seminars.length}${added.length ? `\n  added       ${added.join(", ")}` : ""}${removed.length ? `\n  removed     ${removed.join(", ")}` : ""}

  Written to src/lib/human-state-os/framework-snapshot.json — commit it.
`)
