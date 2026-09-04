import { describe, expect, it } from "vitest";
import { evaluateMissionLoading } from "../../src/student/physics/mission-loading.js";
import { feature as missionLoadingFeature } from "../../src/student/features/mission-loading.feature.js";
import { createCapabilityRegistry, modelsForFeature } from "../../src/core/capabilities/capabilityContract.js";
import { buildCurriculum } from "../../src/core/data/curriculum.js";
import { initialAircraft } from "../../src/core/data/aircraft.js";
import { featureEntries } from "../../src/core/features/index.js";
import { resolveFeatureAnalysis } from "../../src/core/features/featureContract.js";
import { capabilityContext, runSimulation } from "../../src/core/simulation/runtime.js";
const a = { massKg: 1.35, airframeCgM: .11, payloadKg: .25, initialPayloadPositionM: .1, missionPayloadPositionM: .24, neutralPointM: .16, meanChordM: .32, forwardCgLimitM: .09, aftCgLimitM: .16, minimumStaticMargin: .05 };
describe("mission loading", () => {
  it("moves CG aft and reduces margin when payload moves aft", () => { const r = evaluateMissionLoading(a); expect(r.cgShiftM).toBeGreaterThan(0); expect(r.missionStaticMargin).toBeLessThan(r.initialStaticMargin); });
  it("has zero shift when stations coincide and rejects reversed limits", () => { expect(evaluateMissionLoading({ ...a, missionPayloadPositionM: a.initialPayloadPositionM }).cgShiftM).toBe(0); expect(() => evaluateMissionLoading({ ...a, forwardCgLimitM: .2, aftCgLimitM: .1 })).toThrow(); });
  it("states a failed loading requirement in direct grammatical language", () => {
    const analysis = missionLoadingFeature.analyze(
      { ...a, missionPayloadPositionM: 0.5 },
      { "stability.pitch.cm-alpha": {} },
    );
    expect(analysis.decision.status).toBe("caution");
    expect(analysis.decision.interpretation).toContain("At least one modeled loading state does not satisfy");
    expect(analysis.decision.interpretation).not.toContain("Not both modeled loading states satisfy");
  });
});

const downstreamIds = ["static-margin", "tail-elevator-contribution", "stick-free-effect", "cg-loading", "lateral-static-stability", "pitch-dynamic-response", "longitudinal-modes", "dynamic-mode", "stability-trade-study", "mission-loading"];
const entriesWithoutStage4 = featureEntries.filter(({ feature }) => feature.id !== "trim-response");
const installedStage4 = featureEntries.find(({ feature }) => feature.id === "trim-response");

describe("Stage 4 activation boundary", () => {
  it("keeps every downstream stage runtime-locked while Stage 4 is absent", () => {
    const registry = createCapabilityRegistry(entriesWithoutStage4);
    const stability = buildCurriculum(entriesWithoutStage4, registry).find(({ id }) => id === "stability");
    expect(stability.modules.filter(({ feature }) => downstreamIds.includes(feature.id)).every(({ runtimeReady }) => !runtimeReady)).toBe(true);
    downstreamIds.forEach((id) => {
      const entry = entriesWithoutStage4.find(({ feature }) => feature.id === id);
      expect(resolveFeatureAnalysis(entry.feature, initialAircraft).results[0].label).toBe("Analysis unavailable");
    });
  });

  (installedStage4 ? it : it.skip)("activates and evaluates every downstream stage when the Stage 4 capability is installed", () => {
    const registry = createCapabilityRegistry(featureEntries);
    expect(registry.issues).toEqual([]);
    const stability = buildCurriculum(featureEntries, registry).find(({ id }) => id === "stability");
    expect(stability.modules.filter(({ feature }) => downstreamIds.includes(feature.id)).every(({ runtimeReady }) => runtimeReady)).toBe(true);
    downstreamIds.forEach((id) => {
      const models = modelsForFeature(id, registry);
      const context = capabilityContext(models, initialAircraft);
      const entry = featureEntries.find(({ feature }) => feature.id === id);
      const analysis = resolveFeatureAnalysis(entry.feature, initialAircraft, context);
      expect(analysis.results[0].label).not.toBe("Analysis unavailable");
      expect(analysis.verificationCases.every(({ passed }) => passed)).toBe(true);
    });
    const pitchEntries = modelsForFeature("pitch-dynamic-response", registry);
    const pitchRun = runSimulation({ entries: pitchEntries, aircraft: initialAircraft, scenario: { durationS: 0.4, initialState: { pitchRad: 0, pitchRateRadS: 0 } } });
    expect(pitchRun.status).toBe("complete");
    expect(Object.values(pitchRun.state).every(Number.isFinite)).toBe(true);
  });
});
