function assertAnalysis(analysis) {
  if (!analysis || typeof analysis !== "object") {
    throw new TypeError("analyze() must return an analysis object.");
  }
  if (!Array.isArray(analysis.results) || analysis.results.length === 0) {
    throw new TypeError("analysis.results must contain at least one result.");
  }
  if (!Array.isArray(analysis.verificationCases) || analysis.verificationCases.length === 0) {
    throw new TypeError("analysis.verificationCases must contain at least one case.");
  }
  if (!analysis.decision || typeof analysis.decision !== "object") {
    throw new TypeError("analysis.decision is required.");
  }

  analysis.results.forEach((result) => {
    const validValue = typeof result.value === "string" || Number.isFinite(result.value);
    if (!result.label || !validValue || typeof result.unit !== "string") {
      throw new TypeError("Every result needs a label, finite number or text value, and unit string.");
    }
  });

  const needsLabels = analysis.verificationCases.some((item) => !item.label && typeof item.name === "string");
  if (!needsLabels) return analysis;
  return {
    ...analysis,
    verificationCases: analysis.verificationCases.map((item) => (
      !item.label && typeof item.name === "string" ? { ...item, label: item.name } : item
    )),
  };
}

function failedAnalysis(feature, error) {
  return {
    results: [{
      label: "Analysis unavailable",
      value: "—",
      unit: "",
      emphasis: true,
      note: error instanceof Error ? error.message : "The feature returned invalid data.",
    }],
    verificationCases: [{ label: "Feature output follows the application contract", passed: false }],
    decision: {
      question: feature.engineeringQuestion || "What engineering decision does this analysis enable?",
      interpretation: "No engineering interpretation is available until the feature returns valid analysis data.",
      status: "caution",
    },
    plots: [],
    scene: null,
  };
}

export function resolveFeatureAnalysis(feature, aircraft, capabilityContext = {}) {
  try {
    const contractVersion = feature.contractVersion ?? 1;
    if (![1, 2, 3, 4].includes(contractVersion)) {
      throw new TypeError(`Unsupported feature contract version: ${contractVersion}.`);
    }
    if (contractVersion >= 3) {
      if (!["concept", "aircraft", "design"].includes(feature.learningMode)) {
        throw new TypeError("Version 3+ features require learningMode: concept, aircraft, or design.");
      }
      if (typeof feature.topicId !== "string" || feature.topicId.trim() === "") {
        throw new TypeError("Version 3+ features require a non-empty topicId.");
      }
    }
    if (typeof feature.analyze !== "function") {
      throw new TypeError("The feature must export an analyze(aircraft) function.");
    }
    if (contractVersion === 4) {
      if (!Array.isArray(feature.requiresCapabilities) || !Array.isArray(feature.providesCapabilities)) {
        throw new TypeError("Version 4 features require capability arrays.");
      }
    }
    return assertAnalysis(feature.analyze(aircraft, capabilityContext));
  } catch (error) {
    return failedAnalysis(feature, error);
  }
}

export function getFeatureInputKeys(feature) {
  return Array.isArray(feature.inputKeys) ? feature.inputKeys : null;
}
