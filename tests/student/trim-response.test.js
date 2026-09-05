/**
 * Vitest tests for the Stage 4 trim-response physics functions.
 * Expected values below are the pre-calculated reference numbers from
 * Sections 8 and 9 of the specification, not re-derived from the
 * equations under test. Passing these tests demonstrates only that the
 * implementation matches the specified linear model within the stated
 * tolerances; it does not establish model validity, safety, or
 * real-world validation.
 */
import { describe, it, expect } from "vitest";
import {
  computeCmAtAlpha,
  computeTrimAngleDeg,
  computeDeltaCm,
  isTrimmed,
  classifyDisturbanceTendency,
  generateCmAlphaCurve
} from "../../src/student/physics/trim-response.js";

describe("Section 9.1 numerical case", () => {
  const cm0 = 0.04;
  const cmAlphaPerRad = -0.8;
  const angleOfAttackDeg = 2.86;
  const disturbanceAlphaDeg = 2.0;

  it("computes Cm(alpha) within +/-1e-6 of the reference value", () => {
    const cmAtAlpha = computeCmAtAlpha(cm0, cmAlphaPerRad, angleOfAttackDeg);
    expect(Math.abs(cmAtAlpha - 0.00006686672)).toBeLessThanOrEqual(1e-6);
  });

  it("computes the trim angle within +/-1e-4 deg of the reference value", () => {
    const trimAngleDeg = computeTrimAngleDeg(cm0, cmAlphaPerRad);
    expect(trimAngleDeg).not.toBeNull();
    expect(Math.abs(trimAngleDeg - 2.8648)).toBeLessThanOrEqual(1e-4);
  });

  it("computes delta_Cm within +/-1e-6 of the reference value", () => {
    const deltaCm = computeDeltaCm(cmAlphaPerRad, disturbanceAlphaDeg);
    expect(Math.abs(deltaCm - -0.027925268)).toBeLessThanOrEqual(1e-6);
  });

  it("classifies the selected condition as trimmed", () => {
    const cmAtAlpha = computeCmAtAlpha(cm0, cmAlphaPerRad, angleOfAttackDeg);
    expect(isTrimmed(cmAtAlpha)).toBe(true);
  });

  it("classifies the disturbance tendency as restoring", () => {
    const deltaCm = computeDeltaCm(cmAlphaPerRad, disturbanceAlphaDeg);
    expect(classifyDisturbanceTendency(disturbanceAlphaDeg, deltaCm)).toBe("restoring");
  });
});

describe("Section 9.2 behavioral case", () => {
  const cm0 = 0.04;
  const cmAlphaPerRad = -0.8;
  const angleOfAttackDeg = 2.86;

  it("changes delta_Cm to approximately -0.0419 when disturbanceAlphaDeg increases to 3.00 deg", () => {
    const deltaCm = computeDeltaCm(cmAlphaPerRad, 3.0);
    expect(Math.abs(deltaCm - -0.0418879)).toBeLessThanOrEqual(1e-4);
  });

  it("leaves Cm(alpha) and the trim angle unaffected by the change in disturbanceAlphaDeg", () => {
    const cmBefore = computeCmAtAlpha(cm0, cmAlphaPerRad, angleOfAttackDeg);
    const trimBefore = computeTrimAngleDeg(cm0, cmAlphaPerRad);
    // disturbanceAlphaDeg does not appear in either equation
    const cmAfter = computeCmAtAlpha(cm0, cmAlphaPerRad, angleOfAttackDeg);
    const trimAfter = computeTrimAngleDeg(cm0, cmAlphaPerRad);
    expect(cmAfter).toBe(cmBefore);
    expect(trimAfter).toBe(trimBefore);
  });
});

describe("Section 9.3 boundary/sanity case (zero slope)", () => {
  const cm0 = 0.04;
  const cmAlphaPerRad = 0;
  const angleOfAttackDeg = 2.86;
  const disturbanceAlphaDeg = 2.0;

  it("reports the trim angle as not available instead of dividing by zero", () => {
    expect(computeTrimAngleDeg(cm0, cmAlphaPerRad)).toBeNull();
  });

  it("computes delta_Cm as exactly zero", () => {
    expect(computeDeltaCm(cmAlphaPerRad, disturbanceAlphaDeg)).toBe(0);
  });

  it("classifies the condition as not trimmed because Cm(alpha) equals Cm0", () => {
    const cmAtAlpha = computeCmAtAlpha(cm0, cmAlphaPerRad, angleOfAttackDeg);
    expect(cmAtAlpha).toBe(cm0);
    expect(isTrimmed(cmAtAlpha)).toBe(false);
  });

  it("classifies the disturbance tendency as neutral", () => {
    const deltaCm = computeDeltaCm(cmAlphaPerRad, disturbanceAlphaDeg);
    expect(classifyDisturbanceTendency(disturbanceAlphaDeg, deltaCm)).toBe("neutral");
  });
});

describe("input validation", () => {
  it("rejects non-finite numeric inputs rather than silently computing", () => {
    expect(() => computeCmAtAlpha(NaN, -0.8, 2.86)).toThrow();
    expect(() => computeDeltaCm(-0.8, undefined)).toThrow();
    expect(() => computeTrimAngleDeg(0.04, Infinity)).toThrow();
  });
});

describe("Cm-alpha curve for plotting", () => {
  it("spans -10 to +10 deg and includes the selected angle of attack", () => {
    const curve = generateCmAlphaCurve(0.04, -0.8, 2.86);
    const degs = curve.map((p) => p.angleOfAttackDeg);
    expect(Math.min(...degs)).toBeLessThanOrEqual(-10);
    expect(Math.max(...degs)).toBeGreaterThanOrEqual(10);
    expect(degs).toContain(2.86);
  });

  it("computes each curve point using the physics function, not a typed display value", () => {
    const curve = generateCmAlphaCurve(0.04, -0.8, 2.86);
    for (const point of curve) {
      const expected = computeCmAtAlpha(0.04, -0.8, point.angleOfAttackDeg);
      expect(point.cm).toBeCloseTo(expected, 9);
    }
  });
});