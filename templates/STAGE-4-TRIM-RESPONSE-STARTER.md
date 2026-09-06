# Stage 4 Starter Specification: Live Cm–Alpha Relationship and Trim

Student name: `[YOUR NAME]`

Complete only the boxes marked **STUDENT COMPLETES**. The instructor-provided engineering scope and the implementation contract must not be edited. When the specification is complete and approved, attach this one file to ChatGPT.

## Learning Mode

`concept`

Topic ID: `stability`

## 1. Engineering Question

At the selected angle of attack, is the simplified pitching-moment model trimmed, and does a small angle-of-attack disturbance create a restoring moment tendency?

## 2. Physics Model

Use the linear, quasi-static pitching-moment model:

```text
alpha_rad = alpha_deg * pi / 180
Cm(alpha) = Cm0 + Cm_alpha * alpha_rad
alpha_trim_rad = -Cm0 / Cm_alpha                when Cm_alpha is not zero
delta_alpha_rad = delta_alpha_deg * pi / 180
delta_Cm = Cm_alpha * delta_alpha_rad
```

Where:

- `Cm0` is the pitching-moment coefficient at zero angle of attack;
- `Cm_alpha` is the pitching-moment coefficient slope per radian;
- `alpha` is the selected angle of attack; and
- `delta_alpha` is a small angle-of-attack disturbance about the selected condition.

Use positive pitching moment and positive angle of attack as nose-up. Convert every angle supplied in degrees to radians before applying `Cm_alpha`, because its unit is per radian.

Classify the disturbance by the sign of `delta_alpha_rad * delta_Cm`:

- negative: restoring tendency;
- positive: destabilizing tendency; and
- zero: neutral tendency.

Treat the selected condition as trimmed when `abs(Cm(alpha)) <= 1e-6`. Otherwise it is not trimmed. When `Cm_alpha` is zero, no unique trim angle can be calculated. Report that trim angle as not available rather than dividing by zero.

Required earlier capability:

- ID: `loads.pitch.component-sum`
- Minimum version: `1`
- Purpose here: Stage 4 must remain locked until the earlier longitudinal moment-contribution capability is installed. Do not import or repeat an earlier stage's equations.

The exercise repository already contains the completed Stage 1–3 modules and the installed-but-locked Stage 5–14 modules. Creating Stage 4 must complete that existing dependency chain. Do not create, regenerate, or edit files for any other stage.

Capability provided by this feature:

- ID: `stability.pitch.cm-alpha`
- Version: `1`

## 3. Inputs and Units

Use exactly these canonical aircraft inputs:

| Input | Meaning | Unit |
| --- | --- | --- |
| `cm0` | zero-angle pitching-moment coefficient | dimensionless |
| `cmAlphaPerRad` | pitching-moment coefficient slope | 1/rad |
| `angleOfAttackDeg` | selected angle of attack | deg |
| `disturbanceAlphaDeg` | small angle-of-attack disturbance | deg |

Do not add a second local copy of these inputs and do not request new aircraft fields.

## 4. Outputs and Units

Display:

- pitching-moment coefficient at the selected angle, `Cm(alpha)`, dimensionless;
- trim angle, in degrees, or a short `not available` result when no unique trim angle exists;
- disturbance moment-coefficient change, `delta_Cm`, dimensionless;
- whether the selected condition is trimmed; and
- restoring, neutral, or destabilizing disturbance tendency.

Also make the calculated values available through the provided `stability.pitch.cm-alpha` capability for later stages.

## 5. Assumptions

- The `Cm`–alpha relationship is linear over the investigated range.
- The model is quasi-static and represents a small disturbance about the selected condition.
- `Cm0` and `Cm_alpha` represent the same aircraft configuration and flight condition.
- The assigned sign convention is positive nose-up pitching moment and positive nose-up angle of attack.

## 6. Validity Limits

- Do not use this linear relationship at stall, at large angle of attack, or where aerodynamic coefficients are strongly nonlinear.
- This model does not calculate a time history, damping, control motion, or handling quality.
- A restoring tendency in this model is not proof of acceptable safety, controllability, or flightworthiness.
- The calculated trim angle is meaningful only when the linear model remains valid at that angle.

## 7. Expected Physical Behavior — STUDENT COMPLETES

Before asking ChatGPT for code, complete each prediction in your own words.

1. If `Cm_alpha < 0` and the angle-of-attack disturbance is positive, `delta_Cm` should be `[COMPLETE]` because `[COMPLETE]`.
2. If `Cm_alpha > 0` and the angle-of-attack disturbance is positive, the response should be `[COMPLETE]` because `[COMPLETE]`.
3. If `Cm_alpha = 0`, changing angle of attack should `[COMPLETE]`.
4. If `Cm0` is fixed and the magnitude of a nonzero `Cm_alpha` increases, the trim angle magnitude should `[COMPLETE]`.
5. Doubling `disturbanceAlphaDeg` while holding `Cm_alpha` fixed should `[COMPLETE]`.

## 8. Reference Calculation — STUDENT COMPLETES

Use the assigned class values or values approved by your instructor. Show the substitution, degree-to-radian conversion, calculation, sign, and units. Do not paste an AI-generated calculation.

```text
Inputs:
Cm0 = [COMPLETE]
Cm_alpha = [COMPLETE] 1/rad
alpha = [COMPLETE] deg
delta_alpha = [COMPLETE] deg

Angle conversion:
alpha_rad = [SHOW WORK]
delta_alpha_rad = [SHOW WORK]

Current pitching-moment coefficient:
Cm(alpha) = [SHOW WORK]

Trim angle:
alpha_trim_rad = [SHOW WORK]
alpha_trim_deg = [SHOW WORK]

Disturbance response:
delta_Cm = [SHOW WORK]

Expected classifications:
selected condition = [trimmed / not trimmed]
disturbance tendency = [restoring / neutral / destabilizing]
```

## 9. Verification Cases — STUDENT COMPLETES

Define all three cases before implementation. Include exact inputs, expected outputs or relationships, units, and a justified numerical tolerance where relevant.

### 9.1 Numerical case

Use your Section 8 reference calculation.

```text
[COMPLETE]
```

### 9.2 Behavioral case

Change one input and state the exact trend or sign that must result.

```text
[COMPLETE]
```

### 9.3 Boundary or sanity case

Use an informative boundary such as zero slope, zero disturbance, or the trim condition. State the exact behavior expected and why division by zero or a false physical claim must not occur.

```text
[COMPLETE]
```

## 10. Feature Requirements

The dashboard must display all outputs in Section 4 and a qualified engineering interpretation based only on this model.

Include one `Cm`–alpha plot:

- x-axis: angle of attack in degrees;
- y-axis: pitching-moment coefficient, dimensionless;
- series: values calculated from the physics function, not typed display values;
- range: -10 deg through +10 deg, including the selected angle of attack; and
- reference line: `Cm = 0`, labeled as the trim line.

Do not add a 3D overlay.

Use an analysis-only Version 4 module. The values and plot update when aircraft inputs change, but this quasi-static model must not claim to predict a time response.

## 11. Files to Create

Create or replace exactly these three student files:

- `src/student/physics/trim-response.js`
- `src/student/features/trim-response.feature.js`
- `tests/student/trim-response.test.js`

Feature ID: `trim-response`

Do not modify any file outside these three student paths.

## 12. Engineering Decision Enabled — STUDENT COMPLETES

In one or two sentences, state what decision the completed feature will support and what it cannot establish.

```text
[COMPLETE]
```

---

# Fixed AI Implementation Contract — Do Not Edit

This interaction has two mandatory phases. Do not skip Phase 1 even if the student asks for code immediately.

## Phase 1 — Engineering interpretation and approval

On the first response, do not generate code, pseudocode, file contents, or implementation snippets. Respond only with a complete `## Implementation Interpretation` containing:

1. the exact engineering question;
2. every governing equation with every symbol defined;
3. unit conversions, sign conventions, tolerances, special cases, and classifications;
4. all inputs and units;
5. all outputs and units;
6. expected physical behavior;
7. assumptions and validity limits;
8. the three student-defined verification cases;
9. required and provided capability IDs and versions; and
10. exactly the three paths in Section 11.

End with:

```text
No code has been generated yet.
Reply exactly `APPROVE ENGINEERING INTERPRETATION` to authorize code generation, or describe the engineering correction needed.
```

Use only this completed specification. Do not silently repair, complete, or invent missing engineering information. If a section still contains `[COMPLETE]`, `[SHOW WORK]`, a conflict, or insufficient detail, identify the issue and state that approval cannot proceed.

If the student requests a correction, return a complete revised Implementation Interpretation and request approval again. Do not generate code in the correction response.

## Phase 2 — Code generation after approval

Generate code only after the student replies with the exact phrase `APPROVE ENGINEERING INTERPRETATION` in the same conversation. Approval authorizes implementation of the displayed interpretation only; it is not evidence that the model is correct or valid.

After approval, provide the complete contents of exactly the three student files in Section 11 (complete replacements when they already exist), each in a separately labeled code block. Do not provide patches, partial snippets, extra files, package changes, terminal commands, or edits outside those three student paths.

## Application contract

Adapter contract revision: `stage4-adapter-2026-09-06`. This entire fixed contract must accompany the completed engineering sections when sent to ChatGPT.

- The application uses Vite, React, plain JavaScript, and Vitest.
- Put all engineering equations in `src/student/physics/trim-response.js` as exported pure functions.
- The physics file has no React imports, browser dependencies, or mutable shared state.
- Use SI units internally. Convert degree inputs to radians where required and reject obviously invalid numeric inputs.
- Concisely comment input units, output units, sign conventions, and important assumptions.
- Do not add dependencies or modify files outside the three paths in Section 11. Regeneration replaces those same three files; never create backup copies ending in `.feature.js` inside the feature directory.
- The application automatically discovers `src/student/features/*.feature.js`.
- The feature file contains no React, JSX, HTML, CSS, class names, inline styles, or imported shared UI components. The application formats structured data automatically.
- Do not request repository files. This specification contains the stable contract needed for this feature.

The shared `aircraft` object contains the four required canonical fields:

```javascript
{
  cm0,
  cmAlphaPerRad,
  angleOfAttackDeg,
  disturbanceAlphaDeg
}
```

## Feature adapter contract — exact shapes

The adapter connects the approved physics to the application. It must not invent engineering equations, reference answers, or missing verification cases. All calculations belong in the pure physics file. Generate every helper referenced below; helper names are illustrative, but application field names and context access are exact.

### Capability access: two different arguments

The application calls `feature.analyze(aircraft, capabilityMap)`. The second argument IS the map. It is not an array and has no `.capabilities` wrapper. A registered entry has `{ id, version, values, ... }`.

The application calls `model.evaluate(runtimeContext)`. This argument contains `.aircraft` and `.capabilities`.

Use this exact helper and these call patterns:

```javascript
function requireStage3(capabilityMap) {
  const source = capabilityMap?.["loads.pitch.component-sum"];
  if (!source || !(source.version >= 1)) {
    throw new TypeError("Stage 3 loads.pitch.component-sum capability v1 is required.");
  }
  return source;
}

// Inside feature:
analyze(aircraft, capabilityMap) {
  requireStage3(capabilityMap);
  // Call generated helpers that use only the approved pure physics functions.
  // Each helper below must be implemented, not left as a placeholder.
  const output = calculateOutputs(aircraft);
  return {
    results: buildResults(output),
    verificationCases: buildVerificationCases(),
    decision: buildDecision(output),
    plots: [buildCmAlphaPlot(aircraft)],
    scene: null,
  };
}

// Separate named export in the SAME feature file:
export const model = {
  kind: "derived",
  evaluate(runtimeContext) {
    requireStage3(runtimeContext.capabilities);
    const output = calculateOutputs(runtimeContext.aircraft);
    return { values: buildRuntimeValues(output) };
  },
};
```

Never wrap the argument to `analyze` in a made-up object in tests. Never return empty results, empty verification, or empty model values to conceal a missing prerequisite. Throw a descriptive error; the core converts an analysis exception into a visible failure.

### Feature metadata

Export `feature` and `model` from `src/student/features/trim-response.feature.js`. Keep this metadata exactly:

```javascript
{
  contractVersion: 4,
  id: "trim-response",
  title: "Live Cm–alpha relationship and trim",
  category: "Stability · Student feature",
  learningMode: "concept",
  topicId: "stability",
  inputKeys: ["cm0", "cmAlphaPerRad", "angleOfAttackDeg", "disturbanceAlphaDeg"],
  requiresCapabilities: [{ id: "loads.pitch.component-sum", version: 1 }],
  providesCapabilities: [{ id: "stability.pitch.cm-alpha", version: 1 }],
  simulation: {
    display: "analysis-only", durationS: 1,
    initialState: {}, controls: {}, disturbance: {}
  }
}
```

Also supply `description`, `assumptions`, `validityLimits`, and `analyze` from the approved specification. Do not import earlier student stages. There is no time-response model or new core file.

### Results and runtime values

`buildResults(output)` returns one nonempty array containing every Section 4 output. Each item follows this shape (variables stand for calculated or approved content):

```javascript
{
  label: descriptiveLabel,
  value: finiteNumberOrText,
  unit: unitString,
  precision: nonNegativeInteger,
  emphasis: isPrimaryResult
}
```

- Result `value` must be a finite number or string, never Boolean, `null`, `undefined`, `NaN`, or infinity.
- Render a Boolean trim calculation as `trimmed ? "trimmed" : "not trimmed"`.
- Render an unavailable trim angle as `"not available"`, with unit `""`; available trim angles use `"deg"`.
- Use `""` for dimensionless units, and emphasize only the primary result.
- `buildRuntimeValues(output)` returns a nonempty, flat object of finite numbers, descriptive strings, or Booleans. No arrays, nested objects, `null`, `undefined`, or nonfinite numbers are allowed in `values`.
- If a pure function uses `null` for unavailable trim, convert it to `"not available"` BEFORE returning runtime values as well as display results.
- Do not mutate the supplied aircraft or context.

### Verification and engineering decision

`buildVerificationCases()` calculates all three approved Section 9 cases using the pure physics functions and returns:

```javascript
[
  { label: "Numerical case", passed: numericalComparison },
  { label: "Behavioral case", passed: behavioralComparison },
  { label: "Boundary or sanity case", passed: boundaryComparison }
]
```

Each comparison must be computed, Boolean, and use the approved inputs and justified tolerances. Use `label`, not `title`. Do not hard-code passes. If Section 9 is unfinished, stop before generating files; empty verification arrays are not a substitute.

`buildDecision(output)` returns `{ question, interpretation, status }`, where text reflects Sections 1 and 12 and the current calculated outputs. Status is `"pass"`, `"caution"`, or `"neutral"` and does not assert real-world safety.

Treat trim status and disturbance tendency as independent outputs. Handle every combination explicitly. In particular, an untrimmed condition may still have a restoring tendency; it must not fall through to a neutral description. Check the interpretation against the displayed classifications for the approved reference, behavioral, and boundary cases.

### Plot

`buildCmAlphaPlot(aircraft)` must use this exact structure:

```javascript
{
  id: "cm-alpha",
  title: "Cm–alpha relationship",
  xLabel: "Angle of attack (deg)",
  yLabel: "Pitching-moment coefficient, Cm",
  currentX: aircraft.angleOfAttackDeg,
  series: [{ label: "Cm(alpha)", points: calculatedPoints }],
  regions: [],
  referenceLines: [{ axis: "y", value: 0, label: "Cm = 0" }]
}
```

`calculatedPoints` is a nonempty array of `{ x: angleInDegrees, y: calculatedCm }` with finite numbers, calculated using the pure physics functions over Section 10's range. Include the selected angle when it is in range and sort points by x. Do not use `xAxis`, `yAxis`, `xUnit`, `yUnit`, or top-level `points`; the renderer does not read them.

## Test contract

- Use Vitest in `tests/student/trim-response.test.js`.
- Import pure functions directly from `../../src/student/physics/trim-response.js`.
- Implement the completed numerical, behavioral, and boundary/sanity cases from Section 9.
- Use justified tolerances for floating-point comparisons.
- Do not test React components or copy equations into the expected-value side of a test when a pre-calculated reference number is available.
- Do not claim that passing tests proves model validity, safety, or real-world validation.

### Integration checks already supplied by the course

The repository's normal `npm test` includes `tests/core/stage4-integration.test.js`. It uses the installed feature and real runtime; it does not install a mock Stage 4. Before Stage 4 exists, its installed-feature checks are skipped. After installation, they check the default aircraft, zero slope, zero disturbance, display values, runtime values, verification, and normalized plots. These are interface checks, not engineering reference answers or proof of model validity.

Do not edit, delete, skip, or weaken instructor checks. If a check fails, repair only the three student files against this contract. The student physics tests must still implement all three approved Section 9 cases, and should also check that decision text agrees with calculated trim and tendency. Physics tests alone do not verify dashboard integration.

## Required response format

Before approval, return only the engineering interpretation and no code. After approval, briefly state that the approved interpretation is being implemented, then provide the complete contents of the three files in separately labeled code blocks. If missing or conflicting information becomes apparent, stop and return a revised interpretation for approval instead of inventing a model.
