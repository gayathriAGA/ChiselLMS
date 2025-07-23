/**
 * Parses code output based on language and problem type
 */
export function parseCodeOutput(output: string, language: string, problemType?: string): any {
  try {
    // Remove any language-specific output formatting
    let cleanedOutput = output.trim()

    // Handle language-specific output formats
    switch (language) {
      case "javascript":
        // Remove console.log formatting
        cleanedOutput = cleanedOutput.replace(/^console\.log$$(.*)$$;?$/m, "$1")
        break
      case "python":
        // Remove print formatting
        cleanedOutput = cleanedOutput.replace(/^print$$(.*)$$$/m, "$1")
        break
      case "java":
        // Remove System.out.println formatting
        cleanedOutput = cleanedOutput.replace(/^System\.out\.println$$(.*)$$;?$/m, "$1")
        break
      case "cpp":
        // Remove cout formatting
        cleanedOutput = cleanedOutput.replace(/^cout\s*<<\s*(.*)\s*<<\s*endl;?$/m, "$1")
        break
    }

    // Try to parse as JSON if it looks like JSON
    if (
      (cleanedOutput.startsWith("[") && cleanedOutput.endsWith("]")) ||
      (cleanedOutput.startsWith("{") && cleanedOutput.endsWith("}"))
    ) {
      try {
        return JSON.parse(cleanedOutput)
      } catch (e) {
        // If parsing fails, return as string
        return cleanedOutput
      }
    }

    // Handle specific problem types
    if (problemType === "array") {
      // Try to parse array-like strings: "[1, 2, 3]" or "1, 2, 3"
      if (cleanedOutput.startsWith("[") && cleanedOutput.endsWith("]")) {
        cleanedOutput = cleanedOutput.substring(1, cleanedOutput.length - 1)
      }

      // Split by comma and parse each element
      return cleanedOutput.split(",").map((item) => {
        const trimmed = item.trim()
        // Try to parse as number if possible
        const num = Number(trimmed)
        return isNaN(num) ? trimmed : num
      })
    }

    // For numeric outputs, try to parse as number
    if (/^-?\d+(\.\d+)?$/.test(cleanedOutput)) {
      return Number(cleanedOutput)
    }

    // For boolean outputs
    if (cleanedOutput.toLowerCase() === "true" || cleanedOutput.toLowerCase() === "false") {
      return cleanedOutput.toLowerCase() === "true"
    }

    // Default: return as string
    return cleanedOutput
  } catch (error) {
    console.error("Error parsing code output:", error)
    return output // Return original output if parsing fails
  }
}

/**
 * Normalizes output for comparison
 */
export function normalizeOutput(output: string, language: string): string {
  // Remove whitespace and make case-insensitive for string comparison
  let normalized = output.trim()

  // Handle array outputs
  if (normalized.startsWith("[") && normalized.endsWith("]")) {
    try {
      // Parse the array
      const array = JSON.parse(normalized)
      // Sort the array if it contains only numbers or strings
      if (array.every((item: any) => typeof item === "number" || typeof item === "string")) {
        array.sort()
      }
      // Convert back to string
      return JSON.stringify(array)
    } catch (e) {
      // If parsing fails, continue with string normalization
    }
  }

  // Remove all whitespace
  normalized = normalized.replace(/\s+/g, "")

  // Make lowercase for case-insensitive comparison
  normalized = normalized.toLowerCase()

  return normalized
}

/**
 * Compares expected and actual outputs
 */
export function compareOutputs(expected: string, actual: string): { passed: boolean; diff?: string } {
  if (expected === actual) {
    return { passed: true }
  }

  // Generate a diff for better feedback
  let diff = "Differences found:\n"

  // If they're both JSON-like, try to compare as objects
  if ((expected.startsWith("{") && expected.endsWith("}")) || (expected.startsWith("[") && expected.endsWith("]"))) {
    try {
      const expectedObj = JSON.parse(expected)
      const actualObj = JSON.parse(actual)

      // Compare arrays
      if (Array.isArray(expectedObj) && Array.isArray(actualObj)) {
        if (expectedObj.length !== actualObj.length) {
          diff += `- Array length mismatch: expected ${expectedObj.length}, got ${actualObj.length}\n`
        }

        // Find missing or extra elements
        const expectedSet = new Set(expectedObj.map((item) => JSON.stringify(item)))
        const actualSet = new Set(actualObj.map((item) => JSON.stringify(item)))

        const missing = [...expectedSet].filter((item) => !actualSet.has(item))
        const extra = [...actualSet].filter((item) => !expectedSet.has(item))

        if (missing.length > 0) {
          diff += `- Missing elements: ${missing.join(", ")}\n`
        }

        if (extra.length > 0) {
          diff += `- Extra elements: ${extra.join(", ")}\n`
        }
      } else {
        // For objects, compare keys
        diff += "Objects differ\n"
      }
    } catch (e) {
      // If parsing fails, fall back to string comparison
      diff += `- Expected: ${expected}\n- Actual: ${actual}\n`
    }
  } else {
    // Simple string comparison
    diff += `- Expected: ${expected}\n- Actual: ${actual}\n`

    // Check for common issues
    if (expected.length !== actual.length) {
      diff += `- Length mismatch: expected ${expected.length}, got ${actual.length}\n`
    }

    // Find the first differing character
    for (let i = 0; i < Math.min(expected.length, actual.length); i++) {
      if (expected[i] !== actual[i]) {
        diff += `- First difference at position ${i}: expected '${expected[i]}', got '${actual[i]}'\n`
        break
      }
    }
  }

  return { passed: false, diff }
}

/**
 * Checks if the output is within acceptable time and memory limits
 */
export function checkPerformanceLimits(
  executionTime: number,
  memoryUsed: number,
  timeLimit: number,
  memoryLimit: number,
): { passed: boolean; reason?: string } {
  if (executionTime > timeLimit) {
    return {
      passed: false,
      reason: `Time limit exceeded: ${executionTime.toFixed(2)}s (limit: ${timeLimit.toFixed(2)}s)`,
    }
  }

  if (memoryUsed > memoryLimit) {
    return {
      passed: false,
      reason: `Memory limit exceeded: ${memoryUsed.toFixed(2)}MB (limit: ${memoryLimit.toFixed(2)}MB)`,
    }
  }

  return { passed: true }
}
