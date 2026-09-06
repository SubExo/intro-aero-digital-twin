import { normalizeCapabilities } from "../capabilities/capabilityContract.js";
import { rk4Step } from "./integrator.js";

export const FIXED_STEP_S = 0.02;
const ZERO_VECTOR = Object.freeze({ x: 0, y: 0, z: 0 });

export function resolvePitchRamp(scenario = {}, aircraft = {}) {
  const ramp = scenario.disturbance?.pitchRamp;
  if (ramp == null) return null;
  if (typeof ramp !== "object") throw new TypeError("Pitch ramp configuration must be an object.");
  const durationS = ramp.durationS;
  if (!Number.isFinite(durationS) || durationS <= 0) throw new TypeError("Pitch ramp duration must be positive.");
  const targetDeg = Number.isFinite(ramp.targetDeg)
    ? ramp.targetDeg
    : aircraft[ramp.targetDegAircraftKey];
  if (!Number.isFinite(targetDeg)) throw new TypeError("Pitch ramp needs a finite target angle in degrees.");
  return { durationS, targetRad: targetDeg * Math.PI / 180, label: ramp.label || "Disturbance released" };
}

export function prescribedPitchState(state, timeS, scenario = {}, aircraft = {}) {
  const ramp = resolvePitchRamp(scenario, aircraft);
  if (!ramp || timeS > ramp.durationS) return null;
  const initialPitchRad = scenario.initialState?.pitchRad ?? 0;
  const progress = Math.min(Math.max(timeS / ramp.durationS, 0), 1);
  const angleFraction = 0.5 * (1 - Math.cos(Math.PI * progress));
  const pitchRad = initialPitchRad + (ramp.targetRad - initialPitchRad) * angleFraction;
  const pitchRateRadS = (ramp.targetRad - initialPitchRad)
    * 0.5 * Math.PI / ramp.durationS * Math.sin(Math.PI * progress);
  return { ...state, pitchRad, pitchRateRadS };
}

function addVector(target, candidate, label) {
  if (candidate == null) return target;
  const vector = { x: candidate.x ?? 0, y: candidate.y ?? 0, z: candidate.z ?? 0 };
  if (![vector.x, vector.y, vector.z].every(Number.isFinite)) throw new TypeError(`${label} must contain finite x, y, and z values.`);
  return { x: target.x + vector.x, y: target.y + vector.y, z: target.z + vector.z };
}

function mergeFinite(target, values, label) {
  if (values == null) return;
  if (typeof values !== "object") throw new TypeError(`${label} must be an object.`);
  Object.entries(values).forEach(([key, value]) => {
    if (!Number.isFinite(value) && typeof value !== "string" && typeof value !== "boolean") {
      throw new TypeError(`${label}.${key} must be finite or descriptive text.`);
    }
    target[key] = value;
  });
}

export function evaluateModels(entries, aircraft, state, timeS, scenario = {}) {
  const context = {
    aircraft,
    state,
    timeS,
    controls: scenario.controls || {},
    disturbance: scenario.disturbance || {},
    derived: {},
    capabilities: {},
    forcesBodyN: { ...ZERO_VECTOR },
    momentsBodyNm: { ...ZERO_VECTOR },
  };
  const derivatives = {};
  const diagnostics = [];

  entries.forEach((entry) => {
    const result = entry.model.evaluate(context) || {};
    if (entry.model.kind === "derived") mergeFinite(context.derived, result.values, `${entry.feature.id} values`);
    if (entry.model.kind === "load") {
      context.forcesBodyN = addVector(context.forcesBodyN, result.forcesBodyN, `${entry.feature.id} forcesBodyN`);
      context.momentsBodyNm = addVector(context.momentsBodyNm, result.momentsBodyNm, `${entry.feature.id} momentsBodyNm`);
      mergeFinite(context.derived, result.values, `${entry.feature.id} values`);
    }
    if (entry.model.kind === "state-model") {
      if (!result.derivatives || typeof result.derivatives !== "object") throw new TypeError(`${entry.feature.id} must return derivatives.`);
      Object.entries(result.derivatives).forEach(([key, value]) => {
        if (!Number.isFinite(value)) throw new TypeError(`${entry.feature.id} derivative ${key} must be finite.`);
        derivatives[key] = (derivatives[key] ?? 0) + value;
      });
    }
    if (Array.isArray(result.diagnostics)) diagnostics.push(...result.diagnostics.map(String));
    normalizeCapabilities(entry.feature.providesCapabilities, `Feature ${entry.feature.id} provided`).forEach(({ id, version }) => {
      // Preserve calculation fields while exposing the registered metadata to consumers.
      context.capabilities[id] = { ...result, id, version };
    });
  });

  if (Object.hasOwn(state, "pitchRad") && derivatives.pitchRad == null) derivatives.pitchRad = state.pitchRateRadS ?? 0;
  if (Object.hasOwn(state, "pitchRateRadS") && derivatives.pitchRateRadS == null) {
    const inertia = aircraft.pitchInertiaKgM2;
    if (!Number.isFinite(inertia) || inertia <= 0) throw new TypeError("Pitch inertia must be positive for the core pitch kernel.");
    derivatives.pitchRateRadS = context.momentsBodyNm.y / inertia;
  }
  if (Object.hasOwn(state, "rollRad") && derivatives.rollRad == null) derivatives.rollRad = state.rollRateRadS ?? 0;
  if (Object.hasOwn(state, "yawRad") && derivatives.yawRad == null) derivatives.yawRad = state.yawRateRadS ?? 0;

  return { ...context, derivatives, diagnostics };
}

function sample(session, evaluation) {
  return {
    timeS: Number(session.timeS.toFixed(10)),
    ...session.state,
    forceXBodyN: evaluation.forcesBodyN.x,
    forceYBodyN: evaluation.forcesBodyN.y,
    forceZBodyN: evaluation.forcesBodyN.z,
    rollMomentNm: evaluation.momentsBodyNm.x,
    pitchMomentNm: evaluation.momentsBodyNm.y,
    yawMomentNm: evaluation.momentsBodyNm.z,
  };
}

export function createSimulationSession({ entries = [], aircraft, scenario = {} }) {
  const initialState = {
    pitchRad: 0,
    pitchRateRadS: aircraft.pitchRateRadS ?? 0,
    rollRad: (aircraft.bankAngleDeg ?? 0) * Math.PI / 180,
    rollRateRadS: aircraft.rollRateRadS ?? 0,
    yawRad: 0,
    yawRateRadS: aircraft.yawRateRadS ?? 0,
    ...(scenario.initialState || {}),
  };
  const durationS = Number.isFinite(scenario.durationS) ? scenario.durationS : aircraft.simulationDurationS;
  if (!Number.isFinite(durationS) || durationS <= 0) throw new TypeError("Simulation duration must be positive.");
  const pitchRamp = resolvePitchRamp(scenario, aircraft);
  if (pitchRamp && pitchRamp.durationS >= durationS) throw new TypeError("Pitch ramp must end before the simulation duration.");
  const plotStateKeys = Array.isArray(scenario.plotStateKeys) ? scenario.plotStateKeys.map(String) : null;
  const events = pitchRamp ? [{ timeS: pitchRamp.durationS, label: pitchRamp.label }] : [];
  const session = { timeS: 0, durationS, state: initialState, history: [], events, plotStateKeys, status: "paused", error: null };
  const evaluation = evaluateModels(entries, aircraft, initialState, 0, scenario);
  session.history.push(sample(session, evaluation));
  return session;
}

export function advanceSimulationSession(session, { entries = [], aircraft, scenario = {}, stepS = FIXED_STEP_S }) {
  if (session.timeS >= session.durationS) return { ...session, status: "complete" };
  const actualStep = Math.min(stepS, session.durationS - session.timeS);
  const derivative = (state, timeS) => evaluateModels(entries, aircraft, state, timeS, scenario).derivatives;
  const nextTimeS = session.timeS + actualStep;
  const ramp = resolvePitchRamp(scenario, aircraft);
  let state;
  if (ramp && session.timeS < ramp.durationS) {
    const prescribedEndS = Math.min(nextTimeS, ramp.durationS);
    state = prescribedPitchState(session.state, prescribedEndS, scenario, aircraft);
    if (nextTimeS > ramp.durationS) {
      state = rk4Step(derivative, state, ramp.durationS, nextTimeS - ramp.durationS);
    }
  } else {
    state = rk4Step(derivative, session.state, session.timeS, actualStep);
  }
  const next = { ...session, timeS: nextTimeS, state, status: "paused", error: null };
  const evaluation = evaluateModels(entries, aircraft, state, next.timeS, scenario);
  next.history = [...session.history, sample(next, evaluation)];
  if (next.timeS >= next.durationS) next.status = "complete";
  return next;
}

export function runSimulation({ entries = [], aircraft, scenario = {}, stepS = FIXED_STEP_S }) {
  let session = createSimulationSession({ entries, aircraft, scenario });
  const maxSteps = Math.ceil(session.durationS / stepS) + 1;
  for (let index = 0; index < maxSteps && session.status !== "complete"; index += 1) {
    session = advanceSimulationSession(session, { entries, aircraft, scenario, stepS });
  }
  return session;
}

export function capabilityContext(entries, aircraft, scenario = {}) {
  const state = scenario.initialState || { pitchRad: 0, pitchRateRadS: aircraft.pitchRateRadS ?? 0 };
  const evaluation = evaluateModels(entries, aircraft, state, 0, scenario);
  return { ...evaluation.capabilities, derived: evaluation.derived, forcesBodyN: evaluation.forcesBodyN, momentsBodyNm: evaluation.momentsBodyNm };
}
