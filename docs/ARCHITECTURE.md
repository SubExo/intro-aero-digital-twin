# Architecture

The public application is a topic-agnostic aircraft capability shell. Stability, control, lift, drag, performance, and future topics use one canonical aircraft state and the same rendering, simulation, verification, and evidence infrastructure.

```text
Canonical aircraft + lesson defaults
                ↓
       Topic/module catalog
                ↓
  Version 1–3 analysis modules ──→ fixed analysis renderer
                │
  Version 4 capability modules
                ↓
      dependency/version resolver
                ↓
 derived values → body loads → reduced-order derivatives
                ↓
         fixed-step RK4 core
                ↓
  3D attitude + histories + evidence report
```

## Topic catalog and progression

`src/core/data/topicCatalog.js` contains public module metadata: topic, stage, title, purpose, expected feature ID, canonical inputs, and capability prerequisites. It contains no student equations, solution output, or private reference cases.

The curriculum builder merges this catalog with automatically discovered modules. A slot is shown as **Ready to build** when every requirement is installed, **Locked** when an earlier capability is absent or too old, **Installed analysis** for a legacy module, or **Installed · simulation ready** for a valid Version 4 module and its dependency closure.

Uncatalogued legacy modules remain under Foundations. A catalogued legacy module, such as the original lift analysis, appears in its matching topic.

## Student and core boundaries

- `src/core` owns canonical state, topic discovery, dependency resolution, RK4 integration, Three.js, plotting, run controls, error handling, and evidence export.
- `src/student/physics` owns pure SI-unit student calculations.
- `src/student/features` owns data-only analysis and Version 4 model adapters.
- `tests/student` verifies student physics directly.
- `student-work/specs` stores completed specifications.

An instructor core update never edits the three student-owned prefixes. The boundary is enforced by `.course/ownership.json`, local tests, and the core pull-request workflow.

## Version 4 capability modules

Version 4 retains the normal three-file workflow. The feature file exports `feature` plus `model`.

```javascript
export const feature = {
  contractVersion: 4,
  id: "unique-id",
  topicId: "stability",
  learningMode: "concept",
  inputKeys: [],
  requiresCapabilities: [{ id: "earlier.capability", version: 1 }],
  providesCapabilities: [{ id: "new.capability", version: 1 }],
  assumptions: [],
  validityLimits: [],
  analyze(aircraft, capabilityContext) {}
};

export const model = {
  kind: "derived",
  evaluate(runtimeContext) {}
};
```

Capability modules default to `simulation.display: "response"`. A module may use `"analysis-only"` when its model must remain available to downstream capability consumers but the lesson intentionally omits run controls, attitude animation, and response histories. Analysis-only modules still evaluate their capability at the selected condition.

Model kinds are deliberately small:

- `derived` returns `{ values }` such as loaded CG or static margin;
- `load` returns body-axis `{ forcesBodyN, momentsBodyNm, values? }`;
- `state-model` returns `{ derivatives }` for declared reduced-order states.

The core rejects invalid kinds, non-finite output, duplicate capability providers, version mismatches, missing requirements, and dependency cycles. Later modules receive earlier results in `runtimeContext.capabilities`; they do not copy or import earlier equations.

Each runtime capability entry contains the provider's calculation fields plus its registered `id` and `version`. For example, `capabilityContext["earlier.capability"]` in `analyze` and `runtimeContext.capabilities["earlier.capability"]` in `evaluate` both expose `{ values, id, version }` for a derived provider. Loads and derivatives remain available in their existing fields. The core supplies authoritative metadata from `providesCapabilities`; providers do not need to return it. The registry still enforces minimum versions and missing prerequisites.

Verification cases use `{ label, passed }`. For compatibility with generated features, the analysis adapter also accepts `name` as a fallback when `label` is absent, without changing the pass/fail result or mutating the feature's output.

Version 1–3 modules continue to receive `analyze(aircraft)` and remain analysis-only.

## Runtime and evidence

The runtime uses SI units, the standard right-handed aircraft body frame (`+x` forward, `+y` right wing, `+z` down), and deterministic fourth-order Runge–Kutta integration at `0.02 s`. Positive pitch and angle of attack are nose-up. The supplied pitch kernel converts a body-axis pitch moment to angular acceleration using the canonical pitch inertia. Student modules provide loads or complete reduced-order derivatives.

Run state is in memory. Refreshing the page restores lesson defaults; Git and GitHub Pages persist and publish student code. The report and exports must therefore be generated before refresh.

The report records aircraft/loading, flight condition, installed capabilities, run settings and traces, verification cases, assumptions, validity limits, warnings, and the current engineering decision. Every report labels the runtime as a reduced-order linear teaching model, not a validated nonlinear 6-DOF digital twin.

## Private instructor companion

Completed reference modules, solution tests, expected outputs, and lecture-preparation fixtures belong only in the private `intro-aero-digital-twin-instructor` repository. Its candidate modules use the same student-owned paths so a dry run exercises the exact public workflow. Only reusable core support and empty public catalog slots move upstream to this repository.
