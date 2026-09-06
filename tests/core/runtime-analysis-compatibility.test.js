import { describe, expect, it } from "vitest";
import { createCapabilityRegistry, modelsForFeature, requirementsFor } from "../../src/core/capabilities/capabilityContract.js";
import { capabilityContext } from "../../src/core/simulation/runtime.js";
import { resolveFeatureAnalysis } from "../../src/core/features/featureContract.js";

// Synthetic interface fixtures only: no lesson equations or reference answers.
function fixtures(version = 2) {
  const output = Object.freeze({
    values: Object.freeze({ sample: 7 }),
    forcesBodyN: Object.freeze({ x: 1, y: 0, z: 0 }),
    momentsBodyNm: Object.freeze({ x: 0, y: 2, z: 0 }),
    id: "untrusted-result-id",
    version: 99,
  });
  const provider = {
    feature: {
      id: "source", contractVersion: 4, requiresCapabilities: [],
      providesCapabilities: [{ id: "test.source", version }, { id: "test.alias", version: 1 }],
    },
    model: { kind: "load", evaluate: () => output },
  };
  const analysis = Object.freeze({
    results: [{ label: "Sample", value: 7, unit: "" }],
    verificationCases: Object.freeze([
      Object.freeze({ name: "Calculated check", passed: true }),
      Object.freeze({ label: "Canonical label", name: "Unused alias", passed: false }),
    ]),
    decision: { question: "Available?", interpretation: "Synthetic check", status: "neutral" },
    plots: [{ title: "Sample", series: [{ points: [{ x: 0, y: 7 }] }] }],
  });
  const consumer = {
    feature: {
      id: "consumer", contractVersion: 4, learningMode: "concept", topicId: "test",
      requiresCapabilities: [{ id: "test.source", version: 2 }],
      providesCapabilities: [{ id: "test.consumer", version: 1 }],
      analyze(_aircraft, context) {
        if (!(context?.["test.source"]?.version >= 2)) throw new Error("Required source v2 unavailable");
        return analysis;
      },
    },
    model: {
      kind: "derived",
      evaluate(context) {
        const source = context.capabilities["test.source"];
        return { values: { observedVersion: source.version, observedSample: source.values.sample } };
      },
    },
  };
  return { output, analysis, provider, consumer };
}

function run(provider, consumer) {
  const registry = createCapabilityRegistry([consumer, provider]);
  const entries = modelsForFeature(consumer.feature.id, registry);
  // No dynamic state is needed for this analysis-only contract check.
  return { registry, context: capabilityContext(entries, {}, { initialState: {} }) };
}

describe("runtime to analysis compatibility", () => {
  it("preserves working consumers that read calculation fields without metadata checks", () => {
    const { provider, consumer, output } = fixtures();
    const canonical = Object.freeze({
      results: [{ label: "Existing result", value: 7, unit: "" }],
      verificationCases: [Object.freeze({ label: "Existing check", passed: true })],
      decision: { question: "Available?", interpretation: "Existing analysis", status: "neutral" },
    });
    consumer.feature.analyze = (_aircraft, context) => {
      const source = context["test.source"];
      expect(source.values).toBe(output.values);
      expect(source.forcesBodyN).toBe(output.forcesBodyN);
      expect(source.momentsBodyNm).toBe(output.momentsBodyNm);
      return canonical;
    };
    const { context } = run(provider, consumer);
    expect(resolveFeatureAnalysis(consumer.feature, {}, context)).toBe(canonical);
  });

  it("renders a version-checking feature and name-based verification cases through the real runtime", () => {
    const { output, analysis, provider, consumer } = fixtures();
    const { registry, context } = run(provider, consumer);
    expect(registry.issues).toEqual([]);
    expect(requirementsFor(consumer.feature, registry)[0].satisfied).toBe(true);
    expect(context["test.source"]).toEqual({ ...output, id: "test.source", version: 2 });
    expect(context["test.alias"].version).toBe(1);
    expect(context["test.source"].values).toBe(output.values);
    expect(context.forcesBodyN).toEqual(output.forcesBodyN);
    expect(context.momentsBodyNm).toEqual(output.momentsBodyNm);
    expect(context["test.consumer"].values).toEqual({ observedVersion: 2, observedSample: 7 });
    const rendered = resolveFeatureAnalysis(consumer.feature, {}, context);
    expect(rendered.results).toBe(analysis.results);
    expect(rendered.plots).toBe(analysis.plots);
    expect(rendered.verificationCases).toEqual([
      { name: "Calculated check", label: "Calculated check", passed: true },
      { label: "Canonical label", name: "Unused alias", passed: false },
    ]);
    expect(analysis.verificationCases[0]).not.toHaveProperty("label");
    expect(output.version).toBe(99);
  });

  it("does not disguise an installed version that is too old", () => {
    const { provider, consumer } = fixtures(1);
    const registry = createCapabilityRegistry([provider, consumer]);
    const context = capabilityContext([provider], {}, { initialState: {} });
    expect(registry.issues.some(({ type }) => type === "version-mismatch")).toBe(true);
    expect(requirementsFor(consumer.feature, registry)[0].satisfied).toBe(false);
    expect(context["test.source"].version).toBe(1);
    const result = resolveFeatureAnalysis(consumer.feature, {}, context);
    expect(result.results[0].note).toBe("Required source v2 unavailable");
    expect(result.verificationCases[0].passed).toBe(false);
  });

  it("does not fabricate a missing prerequisite", () => {
    const { consumer } = fixtures();
    const registry = createCapabilityRegistry([consumer]);
    expect(registry.issues.some(({ type }) => type === "missing-capability")).toBe(true);
    const context = capabilityContext([], {}, { initialState: {} });
    expect(context).not.toHaveProperty("test.source");
    expect(resolveFeatureAnalysis(consumer.feature, {}, context).results[0].note).toBe("Required source v2 unavailable");
  });
});
