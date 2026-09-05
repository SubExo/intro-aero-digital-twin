/**
 * Stage 4 feature: "Live Cm-alpha relationship and trim".
 * Reads the required earlier capability (loads.pitch.component-sum) only
 * through capabilityContext / runtimeContext.capabilities, and delegates
 * all equations to the pure physics module. No equations are repeated here.
 *
 * NOTE ON INTERFACE SHAPE: the exact method/property shape of
 * capabilityContext and runtimeContext is not specified in the provided
 * specification. hasRequiredCapability() below checks several common
 * shapes defensively (method-based lookups, or a capabilities map) and
 * fails safe (treats the capability as unconfirmed) if none match, rather
 * than assuming it is always present. This is an interface-wiring
 * assumption only; it does not alter or invent any engineering behavior.
 */
import {
  computeCmAtAlpha,
  computeTrimAngleDeg,
  computeDeltaCm,
  isTrimmed,
  classifyDisturbanceTendency,
  generateCmAlphaCurve
} from "../physics/trim-response.js";

const REQUIRED_CAPABILITY = { id: "loads.pitch.component-sum", version: 1 };

function hasRequiredCapability(input) {
  if (!input) return false;
  if (typeof input.hasCapability === "function") {
    return Boolean(input.hasCapability(REQUIRED_CAPABILITY.id, REQUIRED_CAPABILITY.version));
  }
  if (typeof input.isAvailable === "function") {
    return Boolean(input.isAvailable(REQUIRED_CAPABILITY.id, REQUIRED_CAPABILITY.version));
  }
  if (typeof input.get === "function") {
    const capability = input.get(REQUIRED_CAPABILITY.id);
    return Boolean(capability) && Number(capability.version ?? 0) >= REQUIRED_CAPABILITY.version;
  }
  const capabilitiesMap = input.capabilities ?? input;
  const capability = capabilitiesMap ? capabilitiesMap[REQUIRED_CAPABILITY.id] : undefined;
  if (capability === undefined) return false;
  const version = typeof capability === "object" ? capability.version : capability;
  return Number(version) >= REQUIRED_CAPABILITY.version;
}

export const feature = {
  contractVersion: 4,
  id: "trim-response",
  title: "Live Cm–alpha relationship and trim",
  description:
    "Evaluates whether the selected angle of attack is trimmed and whether a small disturbance produces a restoring, neutral, or destabilizing pitching-moment tendency.",
  category: "Stability · Student feature",
  learningMode: "concept",
  topicId: "stability",
  inputKeys: ["cm0", "cmAlphaPerRad", "angleOfAttackDeg", "disturbanceAlphaDeg"],
  requiresCapabilities: [{ id: "loads.pitch.component-sum", version: 1 }],
  providesCapabilities: [{ id: "stability.pitch.cm-alpha", version: 1 }],
  assumptions: [
    "The Cm-alpha relationship is linear over the investigated range.",
    "The model is quasi-static and represents a small disturbance about the selected condition.",
    "Cm0 and Cm_alpha represent the same aircraft configuration and flight condition.",
    "Sign convention: positive nose-up pitching moment and positive nose-up angle of attack."
  ],
  validityLimits: [
    "Do not use at stall, at large angle of attack, or where coefficients are strongly nonlinear.",
    "Does not calculate a time history, damping, control motion, or handling quality.",
    "A restoring tendency is not proof of acceptable safety, controllability, or flightworthiness.",
    "The calculated trim angle is meaningful only where the linear model remains valid at that angle."
  ],
  simulation: {
    display: "analysis-only",
    durationS: 1,
    initialState: {},
    controls: {},
    disturbance: {}
  },

  analyze(aircraft, capabilityContext) {
    const { cm0, cmAlphaPerRad, angleOfAttackDeg, disturbanceAlphaDeg } = aircraft;

    const capabilityConfirmed = hasRequiredCapability(capabilityContext);

    const cmAtAlpha = computeCmAtAlpha(cm0, cmAlphaPerRad, angleOfAttackDeg);
    const trimAngleDeg = computeTrimAngleDeg(cm0, cmAlphaPerRad);
    const deltaCm = computeDeltaCm(cmAlphaPerRad, disturbanceAlphaDeg);
    const trimmed = isTrimmed(cmAtAlpha);
    const tendency = classifyDisturbanceTendency(disturbanceAlphaDeg, deltaCm);
    const curve = generateCmAlphaCurve(cm0, cmAlphaPerRad, angleOfAttackDeg);

    const results = [
      {
        id: "cmAtAlpha",
        label: "Cm(alpha)",
        value: cmAtAlpha,
        unit: "",
        precision: 6,
        emphasis: true
      },
      {
        id: "trimAngleDeg",
        label: "Trim angle",
        value: trimAngleDeg === null ? "not available" : trimAngleDeg,
        unit: trimAngleDeg === null ? "" : "deg",
        precision: 4
      },
      {
        id: "deltaCm",
        label: "Delta Cm",
        value: deltaCm,
        unit: "",
        precision: 6
      },
      {
        id: "trimmedStatus",
        label: "Trimmed?",
        value: trimmed ? "trimmed" : "not trimmed",
        unit: "",
        precision: 0
      },
      {
        id: "disturbanceTendency",
        label: "Disturbance tendency",
        value: tendency,
        unit: "",
        precision: 0
      }
    ];

    const verificationCases = [
      {
        id: "numerical-case-9-1",
        description: "Reference numerical case (Section 9.1): Cm0=0.04, Cm_alpha=-0.8 1/rad, alpha=2.86 deg, delta_alpha=+2.00 deg",
        passed:
          Math.abs(computeCmAtAlpha(0.04, -0.8, 2.86) - 0.00006686672) <= 1e-6 &&
          Math.abs(computeDeltaCm(-0.8, 2.0) - -0.027925268) <= 1e-6 &&
          Math.abs((computeTrimAngleDeg(0.04, -0.8) ?? Number.NaN) - 2.8648) <= 1e-4 &&
          isTrimmed(computeCmAtAlpha(0.04, -0.8, 2.86)) === true &&
          classifyDisturbanceTendency(2.0, computeDeltaCm(-0.8, 2.0)) === "restoring"
      },
      {
        id: "behavioral-case-9-2",
        description: "Increasing disturbanceAlphaDeg to 3.00 deg changes only delta_Cm, to approximately -0.0419 (Section 9.2)",
        passed:
          Math.abs(computeDeltaCm(-0.8, 3.0) - -0.0418879) <= 1e-4 &&
          computeCmAtAlpha(0.04, -0.8, 2.86) === computeCmAtAlpha(0.04, -0.8, 2.86) &&
          computeTrimAngleDeg(0.04, -0.8) === computeTrimAngleDeg(0.04, -0.8)
      },
      {
        id: "boundary-case-9-3",
        description: "Zero Cm_alpha yields trim angle not available, delta_Cm = 0, not trimmed, neutral tendency (Section 9.3)",
        passed:
          computeTrimAngleDeg(0.04, 0) === null &&
          computeDeltaCm(0, 2.0) === 0 &&
          isTrimmed(computeCmAtAlpha(0.04, 0, 2.86)) === false &&
          classifyDisturbanceTendency(2.0, computeDeltaCm(0, 2.0)) === "neutral"
      }
    ];

    let interpretation;
    if (!capabilityConfirmed) {
      interpretation =
        "Required capability loads.pitch.component-sum (version 1) could not be confirmed; these results should be treated as provisional.";
    } else if (trimmed && tendency === "restoring") {
      interpretation =
        "The selected condition is trimmed and a small disturbance produces a restoring moment tendency under this linear model.";
    } else if (trimmed) {
      interpretation = `The selected condition is trimmed, but the disturbance tendency is ${tendency} rather than restoring under this linear model.`;
    } else {
      interpretation =
        "The selected condition is not trimmed under this linear model; the reported disturbance tendency describes only the local slope, not the trim state.";
    }

    const status = !capabilityConfirmed
      ? "caution"
      : trimmed && tendency === "restoring"
      ? "pass"
      : trimmed || tendency === "restoring"
      ? "caution"
      : "neutral";

    return {
      results,
      verificationCases,
      decision: {
        question:
          "At the selected angle of attack, is the simplified pitching-moment model trimmed, and does a small angle-of-attack disturbance create a restoring moment tendency?",
        interpretation,
        status
      },
      plots: [
        {
          id: "cm-alpha-plot",
          title: "Cm vs angle of attack",
          xLabel: "Angle of attack (deg)",
          yLabel: "Cm (dimensionless)",
          series: [
            {
              id: "cm-curve",
              label: "Cm(alpha)",
              points: curve.map((p) => ({ x: p.angleOfAttackDeg, y: p.cm }))
            }
          ],
          regions: [],
          referenceLines: [{ id: "trim-line", value: 0, axis: "y", label: "Cm = 0 (trim line)" }]
        }
      ],
      scene: null
    };
  }
};

export const model = {
  kind: "derived",
  evaluate(runtimeContext) {
    // Interface-shape assumption (see note above the feature object):
    // aircraft inputs are read from runtimeContext.aircraft when present,
    // falling back to runtimeContext itself; capability status is read
    // through runtimeContext directly, which hasRequiredCapability()
    // resolves via a .capabilities map if present.
    const source = (runtimeContext && runtimeContext.aircraft) || runtimeContext || {};
    const { cm0, cmAlphaPerRad, angleOfAttackDeg, disturbanceAlphaDeg } = source;

    const cmAtAlpha = computeCmAtAlpha(cm0, cmAlphaPerRad, angleOfAttackDeg);
    const trimAngleDeg = computeTrimAngleDeg(cm0, cmAlphaPerRad);
    const deltaCm = computeDeltaCm(cmAlphaPerRad, disturbanceAlphaDeg);

    return {
      values: {
        cmAtAlpha,
        trimAngleDeg,
        deltaCm,
        trimmed: isTrimmed(cmAtAlpha),
        disturbanceTendency: classifyDisturbanceTendency(disturbanceAlphaDeg, deltaCm),
        capabilityConfirmed: hasRequiredCapability(runtimeContext)
      }
    };
  }
};