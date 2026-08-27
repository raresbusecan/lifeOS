import type {
  Task,
} from "./task.js";

import type {
  TestResult,
} from "./testing.js";

export type ScopeClassification =
  | "IN_SCOPE"
  | "OUT_OF_SCOPE";

export interface ScopeClassificationResult {
  classification: ScopeClassification;

  matchedFiles: string[];
  matchedComponents: string[];
  matchedBehavior: string[];

  excludedFiles: string[];
  excludedComponents: string[];
  excludedBehavior: string[];

  reasons: string[];
}

function normalize(
  value: string,
): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\\/g, "/");
}

function matches(
  value: string,
  scopeValue: string,
): boolean {
  const normalizedValue =
    normalize(value);

  const normalizedScope =
    normalize(scopeValue);

  if (
    normalizedValue ===
    normalizedScope
  ) {
    return true;
  }

  return (
    normalizedValue.includes(
      normalizedScope,
    ) ||
    normalizedScope.includes(
      normalizedValue,
    )
  );
}

function findMatches(
  values: string[],
  scopeValues: string[],
): string[] {
  return values.filter(
    (value) =>
      scopeValues.some(
        (scopeValue) =>
          matches(
            value,
            scopeValue,
          ),
      ),
  );
}

export function classifyTestResultScope(
  task: Task,
  result: TestResult,
): ScopeClassificationResult {
  const resultFiles =
    result.files ?? [];

  const resultComponents =
    result.components ?? [];

  const resultBehavior =
    [
      result.expectedBehavior,
      result.actualBehavior,
    ].filter(
      (
        value,
      ): value is string =>
        typeof value === "string" &&
        value.trim().length > 0,
    );

  const matchedFiles =
    findMatches(
      resultFiles,
      task.scope.files,
    );

  const matchedComponents =
    findMatches(
      resultComponents,
      task.scope.components,
    );

  const matchedBehavior =
    findMatches(
      resultBehavior,
      task.scope.behavior,
    );

  const excludedFiles =
    findMatches(
      resultFiles,
      task.scope.exclusions,
    );

  const excludedComponents =
    findMatches(
      resultComponents,
      task.scope.exclusions,
    );

  const excludedBehavior =
    findMatches(
      resultBehavior,
      task.scope.exclusions,
    );

  const reasons: string[] = [];

  if (
    matchedFiles.length > 0
  ) {
    reasons.push(
      "Affected files overlap the task scope.",
    );
  }

  if (
    matchedComponents.length > 0
  ) {
    reasons.push(
      "Affected components overlap the task scope.",
    );
  }

  if (
    matchedBehavior.length > 0
  ) {
    reasons.push(
      "Reported behavior overlaps the task scope.",
    );
  }

  if (
    excludedFiles.length > 0 ||
    excludedComponents.length > 0 ||
    excludedBehavior.length > 0
  ) {
    reasons.push(
      "The finding overlaps an explicitly excluded scope.",
    );
  }

  const hasScopeEvidence =
    matchedFiles.length > 0 ||
    matchedComponents.length > 0 ||
    matchedBehavior.length > 0;

  const hasExclusion =
    excludedFiles.length > 0 ||
    excludedComponents.length > 0 ||
    excludedBehavior.length > 0;

  const classification =
    hasExclusion
      ? "OUT_OF_SCOPE"
      : hasScopeEvidence
        ? "IN_SCOPE"
        : "OUT_OF_SCOPE";

  if (
    !hasScopeEvidence &&
    !hasExclusion
  ) {
    reasons.push(
      "No reported file, component, or behavior overlaps the task scope.",
    );
  }

  return {
    classification,
    matchedFiles,
    matchedComponents,
    matchedBehavior,
    excludedFiles,
    excludedComponents,
    excludedBehavior,
    reasons,
  };
}