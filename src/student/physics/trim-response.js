/**
 * Pure physics functions for Stage 4: "Live Cm-alpha relationship and trim".
 *
 * Model (linear, quasi-static):
 *   alpha_rad        = alpha_deg * pi / 180
 *   Cm(alpha)         = Cm0 + Cm_alpha * alpha_rad
 *   alpha_trim_rad    = -Cm0 / Cm_alpha        (undefined when Cm_alpha = 0)
 *   delta_alpha_rad   = delta_alpha_deg * pi / 180
 *   delta_Cm          = Cm_alpha * delta_alpha_rad
 *
 * Sign convention: positive pitching moment and positive angle of attack are
 * both nose-up. All angle inputs are in degrees and are converted to
 * radians internally, because Cm_alpha's unit is 1/rad.
 *
 * No React imports, no browser dependencies, no mutable shared state.
 *
 * Validity limits (not enforced numerically, documented for the caller):
 * not valid at stall, at large angle of attack, or where coefficients are
 * strongly nonlinear; does not predict time history, damping, control
 * motion, or handling quality; a restoring tendency here is not proof of
 * safety, controllability, or flightworthiness.
 */

/** Threshold (dimensionless) for treating a condition as trimmed. */
export const TRIM_TOLERANCE = 1e-4;

function assertFiniteNumber(value, label) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`trim-response: ${label} must be a finite number, got ${value}`);
  }
}

/** Convert an angle in degrees to radians. */
export function degreesToRadians(deg) {
  assertFiniteNumber(deg, "angle (deg)");
  return (deg * Math.PI) / 180;
}

/** Convert an angle in radians to degrees. */
export function radiansToDegrees(rad) {
  assertFiniteNumber(rad, "angle (rad)");
  return (rad * 180) / Math.PI;
}

/**
 * Cm(alpha) = Cm0 + Cm_alpha * alpha_rad
 * @param {number} cm0 dimensionless
 * @param {number} cmAlphaPerRad 1/rad
 * @param {number} angleOfAttackDeg deg
 * @returns {number} dimensionless
 */
export function computeCmAtAlpha(cm0, cmAlphaPerRad, angleOfAttackDeg) {
  assertFiniteNumber(cm0, "cm0");
  assertFiniteNumber(cmAlphaPerRad, "cmAlphaPerRad");
  const alphaRad = degreesToRadians(angleOfAttackDeg);
  return cm0 + cmAlphaPerRad * alphaRad;
}

/**
 * alpha_trim_rad = -Cm0 / Cm_alpha, converted to degrees.
 * Returns null (not a thrown error) when Cm_alpha is zero, since "trim
 * angle not available" is a valid engineering result, not an input error.
 * @param {number} cm0 dimensionless
 * @param {number} cmAlphaPerRad 1/rad
 * @returns {number|null} deg, or null when no unique trim angle exists
 */
export function computeTrimAngleDeg(cm0, cmAlphaPerRad) {
  assertFiniteNumber(cm0, "cm0");
  assertFiniteNumber(cmAlphaPerRad, "cmAlphaPerRad");
  if (cmAlphaPerRad === 0) {
    return null;
  }
  const alphaTrimRad = -cm0 / cmAlphaPerRad;
  return radiansToDegrees(alphaTrimRad);
}

/**
 * delta_Cm = Cm_alpha * delta_alpha_rad
 * @param {number} cmAlphaPerRad 1/rad
 * @param {number} disturbanceAlphaDeg deg
 * @returns {number} dimensionless
 */
export function computeDeltaCm(cmAlphaPerRad, disturbanceAlphaDeg) {
  assertFiniteNumber(cmAlphaPerRad, "cmAlphaPerRad");
  const deltaAlphaRad = degreesToRadians(disturbanceAlphaDeg);
  return cmAlphaPerRad * deltaAlphaRad;
}

/**
 * Trimmed when abs(Cm(alpha)) <= tolerance (default 1e-4).
 * @param {number} cmValue dimensionless
 * @param {number} [tolerance] dimensionless
 * @returns {boolean}
 */
export function isTrimmed(cmValue, tolerance = TRIM_TOLERANCE) {
  assertFiniteNumber(cmValue, "cmValue");
  assertFiniteNumber(tolerance, "tolerance");
  return Math.abs(cmValue) <= tolerance;
}

/**
 * Classify the disturbance by the sign of delta_alpha_rad * delta_Cm.
 * negative -> "restoring", positive -> "destabilizing", zero -> "neutral".
 * @param {number} disturbanceAlphaDeg deg
 * @param {number} deltaCm dimensionless
 * @returns {"restoring"|"neutral"|"destabilizing"}
 */
export function classifyDisturbanceTendency(disturbanceAlphaDeg, deltaCm) {
  assertFiniteNumber(deltaCm, "deltaCm");
  const deltaAlphaRad = degreesToRadians(disturbanceAlphaDeg);
  const product = deltaAlphaRad * deltaCm;
  if (product < 0) return "restoring";
  if (product > 0) return "destabilizing";
  return "neutral";
}

/**
 * Generate Cm(alpha) samples for plotting, from minDeg to maxDeg inclusive,
 * always including the selected angle of attack. Every point is computed
 * from computeCmAtAlpha, not a typed/display value.
 * @param {number} cm0 dimensionless
 * @param {number} cmAlphaPerRad 1/rad
 * @param {number} angleOfAttackDeg deg (selected angle, always included)
 * @param {{minDeg?: number, maxDeg?: number, stepDeg?: number}} [options]
 * @returns {{angleOfAttackDeg: number, cm: number}[]}
 */
export function generateCmAlphaCurve(cm0, cmAlphaPerRad, angleOfAttackDeg, options = {}) {
  assertFiniteNumber(angleOfAttackDeg, "angleOfAttackDeg");
  const minDeg = options.minDeg ?? -10;
  const maxDeg = options.maxDeg ?? 10;
  const stepDeg = options.stepDeg ?? 0.5;
  assertFiniteNumber(minDeg, "minDeg");
  assertFiniteNumber(maxDeg, "maxDeg");
  assertFiniteNumber(stepDeg, "stepDeg");
  if (stepDeg <= 0) {
    throw new Error("trim-response: stepDeg must be positive");
  }

  const angles = new Set();
  for (let deg = minDeg; deg <= maxDeg + 1e-9; deg += stepDeg) {
    angles.add(Number(deg.toFixed(6)));
  }
  angles.add(Number(angleOfAttackDeg.toFixed(6)));

  return Array.from(angles)
    .sort((a, b) => a - b)
    .map((deg) => ({
      angleOfAttackDeg: deg,
      cm: computeCmAtAlpha(cm0, cmAlphaPerRad, deg)
    }));
}