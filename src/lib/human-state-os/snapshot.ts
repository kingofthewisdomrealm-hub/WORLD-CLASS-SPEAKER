/**
 * The committed table. One import, no network, no surprises at build time.
 *
 * The JSON next to this file is written by `npm run sync:frameworks` and is
 * meant to be read in a pull request: if a framework changes upstream, the
 * diff shows exactly what changed before anything ships.
 */

import snapshotJson from "./framework-snapshot.json"
import type { Snapshot } from "./source"
import { toGraph } from "./source"
import type { FrameworkGraph } from "./types"

export const SNAPSHOT = snapshotJson as unknown as Snapshot

/** Built once at module load. 36 nodes — cheap enough not to need caching. */
export const FRAMEWORK_GRAPH: FrameworkGraph = toGraph(SNAPSHOT)
