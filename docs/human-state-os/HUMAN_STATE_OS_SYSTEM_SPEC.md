# Human State OS — System Specification

> Version: 0.1 research architecture  
> Status: pre-implementation  
> Constraint: preserve the current Ruler of Wisdom framework pages and production experience. This document defines an additive system.

## 1. Product definition

Human State OS connects embodied state, problem diagnosis, Ruler of Wisdom frameworks, experiential interventions, learning, and feedback.

```text
HUMAN → STATE → PROBLEM → SCALE → FRAMEWORK → EXPERIENCE
      → ACTION → RESULT → FEEDBACK → REPEAT
```

The system is a decision-support and experience-design platform. It is not a mind-control system, medical device, diagnostic engine, or guarantee of transformation.

## 2. Architectural principles

1. **State before story:** evaluate relevant state and context before choosing content.
2. **Probabilities, not switches:** interventions alter conditions and probabilities; they do not mechanically create outcomes.
3. **Wisdom layer stays intact:** the Ruler of Wisdom forum remains the canonical human-readable framework library.
4. **Graph, not pile:** frameworks, problems, scales, mechanisms, and interventions are linked with typed relationships.
5. **Experience before claim:** participants predict, experience, measure, and interpret; the product does not manufacture certainty.
6. **Learning over intensity:** measure recall, application, and follow-through separately from excitement.
7. **Agency by default:** meaningful opt-out, alternatives, transparent reasoning, and facilitator override.
8. **Evidence is data:** claims retain source, population, limitations, and rating; marketing copy never overwrites evidence.
9. **Manual first:** begin with explicit input and facilitator judgment before automated sensing.
10. **Additive delivery:** do not redesign production or remove framework pages during the documentation and graph-foundation phase.

## 3. Context map

```text
Participant / Facilitator
          │
          ▼
Human Lab UI / State Mixer / Session Builder
          │
          ▼
Orchestration API
 ├─ Human State Layer
 ├─ Problem + Scale Routers
 ├─ Framework Graph + Router
 ├─ Intervention Engine
 ├─ State Transition Engine
 ├─ Learning Engine
 ├─ Evidence Engine
 ├─ Personalization Engine
 └─ Live Copilot
          │
          ▼
Event Store / Content Store / Analytics / Consent Ledger
          │
          ▼
Ruler of Wisdom framework pages (canonical editorial source)
```

## 4. Primary product surfaces

### 4.1 Human Lab

A participant-facing surface for Learn → Experiment → Use. It captures prediction, experience, self-report, interpretation, retrieval, application, and follow-up.

### 4.2 State Mixer

A facilitator design tool. It selects a target condition and explores candidate variables: lighting, sound, movement, speech, silence, breathing, social scale, synchrony, task demand, reflection, and recovery. Controls represent design intent, not precise biology.

### 4.3 Seminar Builder / Simulator

Creates a time-bounded state and learning journey. It detects monotony, excessive intensity, missing recovery, modality conflicts, accessibility risks, and unsupported claims.

### 4.4 Live Copilot

Provides low-latency recommendations during in-person or remote events, with confidence, rationale, evidence, safety constraints, and facilitator override.

### 4.5 Research Console

Maintains claims, sources, evidence ratings, limitations, versions, interventions, experiments, outcomes, and null/adverse results.

## 5. Human State Layer

### 5.1 State dimensions

Initial dimensions:

- energy
- focus
- arousal
- valence
- connection
- fatigue
- confidence
- stress
- safety/threat
- curiosity
- reflection
- motivation
- agency/control
- perceived competence
- pain/discomfort
- cognitive load

Dimensions are not assumed independent. They may be self-reported, facilitator-reported, behaviorally observed, or inferred. Every value must retain its measurement source.

### 5.2 State observation

```ts
type StateDimension =
  | "energy" | "focus" | "arousal" | "valence" | "connection"
  | "fatigue" | "confidence" | "stress" | "safety_threat"
  | "curiosity" | "reflection" | "motivation" | "agency"
  | "competence" | "pain" | "cognitive_load";

type StateObservation = {
  id: string;
  subjectId?: string;             // absent for anonymous/room aggregate
  sessionId: string;
  dimension: StateDimension;
  value: number;                  // normalized only within a named scale
  scaleId: string;                // identifies the actual instrument/question
  source: "self_report" | "facilitator" | "behavior" | "sensor" | "aggregate";
  confidence?: number;
  observedAt: string;
  context: Record<string, unknown>;
};
```

### 5.3 Baseline context

Capture only what is necessary and consented: sleep/rest, hunger/hydration, pain, recent exertion, stimulant use, illness, time zone/time of day, accessibility needs, sensory sensitivity, remote/in-person context, group familiarity, and prior stimulation. Sensitive fields require explicit purpose and retention rules.

### 5.4 Room state

Room state is an aggregate with uncertainty and dispersion, not an average person. Store response count, missingness, range/distribution, subgroup privacy threshold, and timestamp. Never infer unanimity from a mean.

## 6. Problem Router

The router classifies the user's primary question into the seven Ruler of Wisdom families.

| Key | Problem family | Diagnostic question | Example signal |
|---|---|---|---|
| `needs` | Needs | What are you hungry for? | unmet need, motivation, social condition |
| `fears` | Fears | What are you afraid of? | avoidance, threat, anticipated loss |
| `meaning` | Meaning | What's it all for? | purpose, values, why |
| `decision` | Decision | How do you decide? | uncertainty, prioritization, complexity |
| `identity` | Identity | Who are you being? | role, self-concept, relationship pattern |
| `time` | Time | Where does the time go? | focus, scheduling, overload, urgency |
| `skill` | Skill | How do you get better? | practice, consistency, feedback, mastery |

The router returns ranked candidates, not one asserted truth.

```ts
type ProblemRoute = {
  family: "needs" | "fears" | "meaning" | "decision" | "identity" | "time" | "skill";
  confidence: number;
  evidence: string[];             // phrases/answers that support the route
  alternatives: { family: string; confidence: number }[];
  clarificationQuestion?: string;
};
```

## 7. Scale Router

| Key | Scale | Definition |
|---|---|---|
| `moment` | Moment | Immediate situation, next move, or present interaction |
| `person` | Person | Individual or interpersonal pattern |
| `life` | Life | Long-horizon trajectory, role, or recurring system |
| `room` | Room | Team, audience, group, organization, or social environment |

A problem can span scales. Return primary and secondary scales, their rationale, and whether the immediate state must be stabilized before framework work.

## 8. Framework Router and knowledge graph

### 8.1 Canonical source

The public framework pages at `https://rulerofwisdom.com/forum/` remain the canonical editorial source. The application graph stores structured representations and source-version metadata. Graph extraction must not delete, relocate, or silently rewrite the pages.

### 8.2 Initial framework inventory

The live table exposes 36 tools across Moment, Person, Life, and Room. The first import must include:

- **Moment:** RICE, Drama Triangle, Five Whys, GROW, Four Agreements, Deep Work, JUDGE, Iceberg Model, OODA.
- **Person:** Six Human Needs, Two Fears, Three Lives, Assets and Liabilities, Six Archetypes, Eisenhower Matrix, Perception and Perspective, Five Love Languages.
- **Life:** Hierarchy of Needs, Attachment Styles, Dickens Process, WRAP, Cashflow Quadrant, Rapid Planning Method, Slight Edge, Ikigai, 7 Powers.
- **Room:** SCARF, Four Horsemen, Golden Circle, Six Thinking Hats, Five Dysfunctions, Tuckman, SADRAT, Cynefin, Business Model Canvas, Balanced Scorecard.

### 8.3 Node model

```ts
type FrameworkNode = {
  id: string;                     // immutable internal ID
  slug: string;                   // current public slug
  name: string;
  symbol?: string;
  sourceUrl: string;
  sourceVersion: string;
  summary: string;
  primaryProblem: ProblemRoute["family"];
  primaryScale: "moment" | "person" | "life" | "room";
  secondaryProblems: string[];
  secondaryScales: string[];
  variables: string[];
  steps: FrameworkStep[];
  usefulWhen: string[];
  notUsefulWhen: string[];
  outputs: string[];
  evidenceClaimIds: string[];
  safetyNotes: string[];
  status: "draft" | "reviewed" | "published" | "deprecated";
};
```

### 8.4 Relationship types

| Edge | Meaning | Directionality |
|---|---|---|
| `leads_to` | common next framework in a sequence | directed |
| `pairs_with` | complementary tools used together | usually symmetric |
| `pushes_against` | provides a counter-model or useful tension | usually symmetric |
| `prerequisite_for` | should normally be understood/applied first | directed |
| `alternative_to` | substitute for similar job/context | usually symmetric |
| `useful_after` | is useful following another framework/event | directed |
| `useful_before` | prepares for another framework/event | directed |
| `applies_to_scale` | maps framework to Moment/Person/Life/Room | framework → scale |
| `addresses_problem` | maps framework to a problem family | framework → problem |
| `mechanism` | connects framework/intervention to supported mechanism | entity → mechanism |

```ts
type FrameworkEdge = {
  id: string;
  fromId: string;
  toId: string;
  type: "leads_to" | "pairs_with" | "pushes_against" | "prerequisite_for"
      | "alternative_to" | "useful_after" | "useful_before"
      | "applies_to_scale" | "addresses_problem" | "mechanism";
  rationale: string;
  source: { kind: "framework_page" | "editor" | "research"; ref: string };
  confidence: number;
  status: "proposed" | "reviewed" | "published";
};
```

### 8.5 Routing score

Start interpretable and deterministic:

```text
route_score = problem_fit + scale_fit + state_eligibility + sequence_fit
            + evidence_fit + facilitator_preference
            - contraindication_penalty - burden_penalty - uncertainty_penalty
```

Return the top routes with component scores, explanation, alternatives, and unresolved questions. Do not hide the scoring behind an opaque model in MVP 1.

### 8.6 Example chains

- Room defensiveness → SCARF → identify threatened domains → restore agency/safety.
- Unclear environment → Cynefin → choose response mode → GROW → turn insight into action.
- Team conflict/decision → SCARF → Cynefin → Six Thinking Hats → GROW → Slight Edge.
- Long-term consistency gap → Slight Edge, unless state assessment indicates fatigue, threat, or unclear task as the primary blocker.

## 9. Intervention Engine

### 9.1 Intervention metadata

```ts
type Intervention = {
  id: string;
  slug: string;
  name: string;
  purpose: string;
  targetState: { dimension: StateDimension; direction: "increase" | "decrease" | "stabilize" }[];
  mechanisms: string[];
  duration: { minSeconds: number; maxSeconds: number };
  intensity: "low" | "medium" | "high";
  modality: ("visual" | "auditory" | "olfactory" | "gustatory" | "tactile"
    | "interoceptive" | "movement" | "social" | "cognitive" | "environmental")[];
  location: ("remote" | "in_person")[];
  socialFormat: ("individual" | "pair" | "group")[];
  evidenceStrength: "strong" | "moderate" | "emerging_mixed" | "weak" | "product_hypothesis";
  evidenceClaimIds: string[];
  contraindications: string[];
  bestBefore: string[];
  bestAfter: string[];
  recoveryRequired: boolean;
  recoveryPlan?: string;
  consent: {
    required: boolean;
    mode: "informed_opt_in" | "opt_out" | "general_participation";
    alternatives: string[];
  };
  accessibility: string[];
  measurementMethods: string[];
  facilitatorRequirements: string[];
  adverseEventProtocol?: string;
  version: string;
  status: "draft" | "safety_review" | "approved" | "paused" | "retired";
};
```

### 9.2 Eligibility

An intervention is eligible only if the target, format, available time, consent mode, accessibility, intensity ceiling, facilitator qualifications, and contraindications are compatible. No ranking score may override an exclusion.

### 9.3 Initial low-risk library

MVP candidates: silent reflection, written prediction, one-word check-in, structured pair teach-back, visual simplification, stretch/stand invitation with seated alternative, short break, one slow breath, retrieval question, scenario application, simultaneous chat response, voluntary wave/gesture, and implementation intention.

Exclude cold immersion, intense breathwork, pain, forced touch, flashing visuals, sleep restriction, humiliation, and high-intensity exertion from the initial library.

## 10. State Transition Engine

```text
CURRENT STATE → TARGET STATE → CONSTRAINTS → ELIGIBLE INTERVENTIONS
              → SELECTED EXPERIENCE → MEASUREMENT → FEEDBACK
```

### 10.1 Transition plan

```ts
type TransitionPlan = {
  id: string;
  currentState: StateObservation[];
  targetState: { dimension: StateDimension; targetBand: [number, number] }[];
  constraints: string[];
  candidates: { interventionId: string; score: number; rationale: string[] }[];
  selected?: string;
  predictedEffect: { dimension: StateDimension; direction: string; confidence: number }[];
  measurementPlan: string[];
  recoveryPlan?: string;
  stopConditions: string[];
};
```

### 10.2 Control loop

1. Observe current state and data quality.
2. Confirm target and purpose.
3. Apply hard safety/consent exclusions.
4. Rank eligible interventions.
5. Explain recommendation and uncertainty.
6. Facilitator/participant chooses.
7. Deliver or record the experience.
8. Measure immediate result and adverse effects.
9. Schedule learning/recovery/follow-up where relevant.
10. Update session model; never generalize beyond evidence automatically.

## 11. Specialized engines

### 11.1 Congruence Engine

Inputs: target state, content, lighting, sound, visuals, speech, movement, room design, social format, timing, and transition history. Output: aligned signals, contradictions, missing channels, accessibility conflicts, and suggested simplifications.

### 11.2 Contrast Engine

Tracks recent intensity, pace, modality, social scale, cognitive demand, movement, and silence. It flags habituation and proposes a bounded change. Contrast suggestions must remain compatible with the target state and safety constraints.

### 11.3 Prediction-Error Engine

```ts
type PredictionTrial = {
  prediction: string;
  expectedValue?: number;
  confidenceBefore: number;
  protocolId: string;
  observedValue?: number;
  confidenceAfter?: number;
  discrepancy?: number;
  participantInterpretation?: string;
  alternativeExplanations: string[];
  transferTestAt?: string;
};
```

The participant interprets the result before the system offers explanations. Large emotional discrepancy triggers debrief/recovery, not stronger persuasion.

### 11.4 Memory Engine

Creates a retrieval plan containing concept, cue, immediate reconstruction, application scenario, teach-back, spaced schedule, feedback, and mastery criteria. It tracks recall and use separately from attendance or satisfaction.

### 11.5 Personalization Engine

Begins with within-person descriptive patterns. Recommendations include sample size, contexts observed, uncertainty, contradictory observations, and last update. No diagnostic labels or claims like “your nervous system is X.”

### 11.6 Research Evidence Engine

```ts
type EvidenceClaim = {
  id: string;
  statement: string;
  rating: "strong" | "moderate" | "emerging_mixed" | "weak" | "product_hypothesis";
  mechanismIds: string[];
  sourceIds: string[];
  populations: string[];
  contexts: string[];
  outcomes: string[];
  effectSummary?: string;
  limitations: string[];
  replicationNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  supersedes?: string;
};
```

Evidence updates are append-only/auditable. Product copy references a claim version. Downgrading evidence must propagate a review warning to affected interventions and pages.

## 12. Learning Engine

### 12.1 Learning cycle

```text
PREDICTION → EXPERIENCE → EXPLANATION → RETRIEVAL → APPLICATION
           → TEACH-BACK → SPACED REPETITION → IMPLEMENTATION INTENTION
           → FOLLOW-UP
```

### 12.2 Learning object

```ts
type LearningObject = {
  id: string;
  frameworkId?: string;
  mechanismIds: string[];
  objectives: string[];
  predictionPrompt?: string;
  experienceId?: string;
  explanation: string;
  retrievalPrompts: string[];
  applicationScenarios: string[];
  teachBackRubric?: string[];
  spacingSchedule: string[];
  implementationPrompt?: string;
  masteryCriteria: string[];
};
```

### 12.3 Outcomes

Store immediate recall, delayed recall, application accuracy, teach-back quality, implementation completion, confidence calibration, and self-reported usefulness. Never collapse these into a single “transformation score.”

## 13. Live Copilot

### 13.1 Questions the copilot answers

- What state is the room currently in?
- What is the desired next state?
- Which intervention should happen next?
- Which Ruler of Wisdom framework fits the current problem and scale?
- Should stimulation increase, decrease, or stabilize?
- Is fatigue or cognitive load high?
- Is connection low or uneven?
- Has passive listening lasted too long?
- Is reflection or recovery needed?
- Is the experience congruent with the intended state?

### 13.2 Inputs

MVP: agenda/timeline, facilitator check-in, voluntary participant pulse checks, chat/poll activity counts, segment timing, recent interventions, constraints, and facilitator notes.

Later and only with consent: limited audio interaction metrics or sensor inputs. Do not launch facial-emotion recognition, covert physiological inference, or individual mental-state diagnosis.

### 13.3 Recommendation contract

```ts
type CopilotRecommendation = {
  id: string;
  observedAt: string;
  observation: string;
  dataQuality: "high" | "medium" | "low";
  targetState: string;
  recommendation: string;
  interventionId?: string;
  frameworkIds?: string[];
  rationale: string[];
  confidence: number;
  alternatives: string[];
  safetyFlags: string[];
  expiresAt: string;
};
```

Recommendations are time-limited because room state changes. The UI always exposes “ignore,” “not now,” and “show why.”

### 13.4 Zoom workflow

1. Host defines audience, objective, framework, and target state journey.
2. System creates segments with participation and recovery checks.
3. Participants receive consent/privacy notice and interaction alternatives.
4. Host launches the session timer.
5. Copilot watches declared signals and prompts low-friction pulse checks.
6. Host accepts, edits, postpones, or rejects suggestions.
7. Session closes with retrieval and an if–then action.
8. Learning Engine schedules follow-up.
9. Host receives aggregate timeline and a qualitative debrief.

## 14. Seminar Simulator

Inputs:

- duration and schedule
- audience size and familiarity
- remote/in-person/hybrid
- learning and behavioral objectives
- target state journey
- selected frameworks
- constraints and accessibility
- facilitator capacity
- allowed interventions and intensity ceiling
- required recovery and breaks

Outputs:

- minute-by-minute state/learning timeline
- framework chain and rationale
- intervention candidates
- modality and participation balance
- habituation/contrast warnings
- fatigue and recovery warnings
- consent/accessibility requirements
- measurement and follow-up plan
- evidence and product-hypothesis labels

## 15. Data model

Recommended bounded contexts/tables:

| Context | Entities |
|---|---|
| Framework graph | `frameworks`, `framework_steps`, `framework_edges`, `problem_families`, `scales` |
| Research | `mechanisms`, `evidence_claims`, `sources`, `claim_sources`, `reviews` |
| Interventions | `interventions`, `intervention_claims`, `contraindications`, `alternatives` |
| Experience design | `programs`, `sessions`, `segments`, `transition_plans` |
| State | `state_observations`, `room_aggregates`, `baselines` |
| Learning | `learning_objects`, `retrieval_attempts`, `application_attempts`, `implementation_plans` |
| Feedback | `predictions`, `outcomes`, `debriefs`, `adverse_events` |
| Governance | `consents`, `data_retention_rules`, `audit_events`, `content_versions` |

Prefer relational storage for auditable content and graph edges initially. A dedicated graph database is unnecessary until query patterns prove the need.

## 16. API outline

```text
GET    /api/frameworks
GET    /api/frameworks/:id
POST   /api/routes/frameworks
POST   /api/transitions/plan
POST   /api/sessions
POST   /api/sessions/:id/observations
POST   /api/sessions/:id/predictions
POST   /api/sessions/:id/outcomes
GET    /api/sessions/:id/timeline
POST   /api/learning/:id/retrieval
GET    /api/copilot/:sessionId/recommendation
POST   /api/copilot/:sessionId/decision
GET    /api/evidence/claims/:id
```

All write events carry actor, timestamp, content/model version, consent context where relevant, and idempotency key.

## 17. Safety and privacy architecture

### Hard constraints

- No forced touch, public disclosure, pain, sleep restriction, extreme breathwork, or sensory overload.
- No high-risk physical intervention without separate professional protocol and review.
- No automated mental-health diagnosis.
- No hidden biometric collection.
- No inference that an averaged room state describes every participant.
- No suggestion whose contraindication conflicts with known participant context.

### Consent ledger

Record consent scope, version, timestamp, collection purpose, expiration, withdrawal, and alternatives offered. Consent to attend is not consent to touch, record, analyze voice/video, or share individual results.

### Data minimization

MVP uses anonymous or pseudonymous pulse checks and aggregate timelines. Define retention before collection. Support export, correction, and deletion. Protect small subgroups from re-identification.

### Safety review states

Interventions move through `draft → safety_review → approved`. Any adverse event, evidence downgrade, or protocol change can move an intervention to `paused`. The runtime serves only approved versions.

## 18. Observability and evaluation

Track:

- route accepted/edited/rejected and why
- intervention eligibility exclusions
- planned versus actual segment time
- state observation coverage and missingness
- immediate and delayed learning outcomes
- participant opt-out and alternative use
- adverse events and near misses
- recommendation confidence calibration
- facilitator override rate
- evidence version used for each recommendation

Success metrics should prioritize safety, learning, usefulness, and voluntary follow-through over raw intensity or engagement time.

## 19. Delivery plan

### Phase 0 — preserve and model — **DROPPED as written, 2026-09-12**

The extraction step assumed the frameworks existed only as web pages. They
already exist as reviewed typed data upstream, so re-authoring them here
would have created a second copy that drifts. See
[DECISIONS.md → D1](./DECISIONS.md). What survives of this phase:

- These documents stay canonical. ✅
- Production navigation and framework pages unchanged. ✅
- Evidence and safety taxonomies: still to do. Nothing upstream carries them
  yet, so the node type declares them and leaves them empty.

### Phase 1 — manual Framework Router — **SHIPPED 2026-09-12**

- Typed framework dataset and graph validation. ✅ `src/lib/human-state-os/`
- Internal route explorer. ✅ `/human-state-os`, noindex, read-only
- Route explanations and alternatives. ✅ every route carries its component
  scores and plain-English reasons
- Low-risk interventions: **not started.** Deliberately — there is no
  intervention library yet and inventing one would put unreviewed
  instructions in front of a room.

### Phase 2 — Session Builder

- Build state journey timeline, State Mixer, intervention eligibility, and recovery checks.
- Export a facilitator run-of-show.

### Phase 3 — Human Lab loop

- Add prediction, experiment, outcome, explanation, retrieval, application, and follow-up.
- Add aggregate State Timeline and Personal Profile with uncertainty.

### Phase 4 — Live Copilot

- Begin with facilitator-entered and voluntary participant inputs.
- Run shadow-mode evaluations before showing live recommendations.
- Add automated signals only after consent, reliability, bias, privacy, and failure-mode review.

## 20. Acceptance criteria for the next implementation

1. All 36 live framework pages have stable nodes and source URLs.
2. Every edge has a type, rationale, source, confidence, and review state.
3. Router returns ranked results with problem/scale/state explanation.
4. At least one valid alternative appears when confidence is low.
5. Hard exclusions cannot be bypassed by ranking.
6. Every intervention displays evidence rating and consent requirements.
7. Current production framework pages and routes are unchanged.
8. Tests validate graph references, symmetric-edge rules, source URLs, and router fixtures.
9. No biometric or sensitive inference is required.
10. Documentation names research claims, working hypotheses, and product ideas distinctly.

## 21. Recommended next implementation step — **DONE 2026-09-12**

The step as written: a versioned framework-graph seed for the 36 Ruler of
Wisdom pages plus a read-only route explorer, kept as a bounded module. That
is what shipped, with one change of method — the seed is synced from
upstream rather than re-authored here ([D1](./DECISIONS.md)).

### What to do next, in order

1. **Author `usefulWhen` and `notUsefulWhen` upstream.** The router can rank
   by square, sequence and burden. It cannot yet say "not this one, not
   today". That is the largest accuracy gain available and it costs writing,
   not engineering.
2. **Run the router against real sessions on paper.** Before any UI is built
   on top of it, take ten rooms Josias has actually run, enter the state and
   problem by hand, and check whether the top route is the tool he reached
   for. Cheap, and it either validates the weights or kills them.
3. **Only then** the Session Builder in Phase 2.

Interventions, evidence claims and the Live Copilot stay where they are until
step 2 produces a number worth trusting.

