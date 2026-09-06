import { describe, expect, it } from "vitest";
import { initialAircraft } from "../../src/core/data/aircraft.js";
import { featureEntries } from "../../src/core/features/index.js";
import { createCapabilityRegistry, modelsForFeature } from "../../src/core/capabilities/capabilityContract.js";
import { capabilityContext } from "../../src/core/simulation/runtime.js";
import { resolveFeatureAnalysis } from "../../src/core/features/featureContract.js";
import { normalizePlot } from "../../src/core/visualization/visualizationContract.js";

// Application-interface checks only. No lesson equations, reference outputs,
// completed solution, or substitute Stage 4 provider belongs in this file.
const installed = featureEntries.filter(({ feature }) => feature.id === "trim-response");
const whenInstalled = installed.length ? it : it.skip;
const hint = "Use the fixed adapter contract in templates/STAGE-4-TRIM-RESPONSE-STARTER.md; repair student files, not this check.";

function checkAnalysis(analysis) {
  expect(analysis.results[0]?.label, `${analysis.results[0]?.note || "Stage 4 analysis failed."} ${hint}`)
    .not.toBe("Analysis unavailable");
  expect(analysis.results.length, `Return calculated display results. ${hint}`).toBeGreaterThan(0);
  for (const result of analysis.results) {
    expect(typeof result.value === "string" || Number.isFinite(result.value), `Result '${result.label}' needs text or a finite number, never a Boolean or null. ${hint}`).toBe(true);
  }
  expect(analysis.verificationCases.length, `Implement all three approved Section 9 cases. ${hint}`).toBeGreaterThanOrEqual(3);
  for (const check of analysis.verificationCases) {
    expect(typeof check.label === "string" && check.label.trim().length > 0, `Verification cases need 'label', not 'title'. ${hint}`).toBe(true);
    expect(check.passed, `Verification '${check.label}' failed; review the approved calculation and tolerance. ${hint}`).toBe(true);
  }
  expect(typeof analysis.decision.interpretation === "string" && analysis.decision.interpretation.trim().length > 0).toBe(true);

  const plots = analysis.plots || [];
  expect(plots.length, `Return the required Cm–alpha plot. ${hint}`).toBeGreaterThan(0);
  const source = plots[0];
  expect(typeof source.xLabel === "string" && source.xLabel.trim().length > 0, `Plot needs xLabel (including units), not xAxis. ${hint}`).toBe(true);
  expect(typeof source.yLabel === "string" && source.yLabel.trim().length > 0, `Plot needs yLabel, not yAxis. ${hint}`).toBe(true);
  const plot = normalizePlot(source);
  expect(plot, `Plot needs series: [{ label, points: [{ x, y }] }]. ${hint}`).not.toBeNull();
  expect(plot.referenceLines.some(({ axis, value, label }) => axis === "y" && value === 0 && label.trim()), `Plot needs referenceLines: [{ axis: 'y', value: 0, label: 'Cm = 0' }]. ${hint}`).toBe(true);
}

function runInstalled(aircraft) {
  const registry = createCapabilityRegistry(featureEntries);
  expect(registry.issues, `Resolve capability registration errors. Do not add a mock Stage 4. ${hint}`).toEqual([]);
  const entries = modelsForFeature("trim-response", registry);
  let context;
  try {
    context = capabilityContext(entries, aircraft);
  } catch (error) {
    throw new Error(`Stage 4 runtime evaluation failed: ${error.message}. Return finite numbers or descriptive text (not null) in model.values. ${hint}`);
  }
  const values = context["stability.pitch.cm-alpha"]?.values;
  expect(values && Object.keys(values).length > 0, `Stage 4 model returned no calculated values. model.evaluate reads runtimeContext.capabilities as a map. ${hint}`).toBe(true);
  expect(context["loads.pitch.component-sum"]?.version).toBeGreaterThanOrEqual(1);
  const analysis = resolveFeatureAnalysis(installed[0].feature, aircraft, context);
  checkAnalysis(analysis);
  return analysis;
}

describe("Stage 4 installed adapter integration", () => {
  it("discovers at most one installed Stage 4 without injecting a mock provider", () => {
    expect(installed.length, "Keep only one trim-response feature file in src/student/features/.").toBeLessThanOrEqual(1);
  });
  whenInstalled("renders the installed Stage 4 using the actual runtime capability map", () => {
    runInstalled({ ...initialAircraft });
  });
  whenInstalled("keeps zero-slope unavailable values renderable through the runtime", () => {
    runInstalled({ ...initialAircraft, cmAlphaPerRad: 0 });
  });
  whenInstalled("keeps the zero-disturbance case renderable through the runtime", () => {
    runInstalled({ ...initialAircraft, disturbanceAlphaDeg: 0 });
  });
});

// Synthetic display data exercises the checker itself even before students
// install Stage 4. These fields carry no aircraft calculations or answers.
function displayFixture() {
  return {
    results: [{ label: "Sample", value: "available", unit: "" }],
    verificationCases: ["A", "B", "C"].map((label) => ({ label, passed: true })),
    decision: { interpretation: "Synthetic interface check." },
    plots: [{ xLabel: "Input", yLabel: "Output", series: [{ points: [{ x: 0, y: 0 }] }], referenceLines: [{ axis: "y", value: 0, label: "Reference" }] }],
  };
}

describe("Stage 4 integration diagnostic coverage", () => {
  it("accepts a complete synthetic display payload", () => {
    expect(() => checkAnalysis(displayFixture())).not.toThrow();
  });
  it.each([
    ["empty results", (a) => { a.results = []; }],
    ["Boolean result", (a) => { a.results[0].value = false; }],
    ["empty verification", (a) => { a.verificationCases = []; }],
    ["title-only verification", (a) => { a.verificationCases[0] = { title: "A", passed: true }; }],
    ["failed verification", (a) => { a.verificationCases[0].passed = false; }],
    ["nested plot axes", (a) => { a.plots[0].xAxis = { label: "Input" }; delete a.plots[0].xLabel; }],
    ["top-level plot points", (a) => { a.plots[0].points = [{ x: 0, y: 0 }]; delete a.plots[0].series; }],
    ["missing reference line", (a) => { a.plots[0].referenceLines = []; }],
  ])("rejects %s", (_name, mutate) => {
    const analysis = displayFixture();
    mutate(analysis);
    expect(() => checkAnalysis(analysis)).toThrow();
  });
});
