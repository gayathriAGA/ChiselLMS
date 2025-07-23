/**
 * Enhanced validation utilities for accurate code execution results
 */

// Debug flag - set to true to enable detailed logging
const DEBUG = true

// Log function that only logs when DEBUG is true
function debugLog(...args: any[]) {
  if (DEBUG) {
    console.log("[Validation]", ...args)
  }
}

// Normalize output for comparison
export function normalizeOutput(output: string, language: string, problemType: string): string {
  debugLog("Normalizing output:", output, "for language:", language, "problem type:", problemType)

  if (!output) {
    debugLog("Empty output, returning empty string")
    return ""
  }

  try {
    // Handle different problem types
    switch (problemType) {
      case "two-sum":
        return normalizeTwoSumOutput(output)
      case "array":
        return normalizeArrayOutput(output)
      case "string":
        return normalizeStringOutput(output)
      default:
        // Generic normalization
        return normalizeGenericOutput(output)
    }
  } catch (error) {
    debugLog("Error during normalization:", error)
    // If normalization fails, return the original output
    return output.trim()
  }
}

// Normalize Two Sum problem output
function normalizeTwoSumOutput(output: string): string {
  debugLog("Normalizing Two Sum output:", output)

  try {
    // Try to parse as JSON
    if (output.includes("[") && output.includes("]")) {
      // Extract array-like structure from the output
      const match = output.match(/\[\s*\d+\s*,\s*\d+\s*\]/)
      if (match) {
        const arrayStr = match[0]
        debugLog("Found array-like structure:", arrayStr)

        // Parse the array
        const array = JSON.parse(arrayStr)

        // For two-sum, sort the indices for consistent comparison
        if (Array.isArray(array) && array.length === 2 && array.every((item) => typeof item === "number")) {
          array.sort((a, b) => a - b)
          debugLog("Sorted array:", array)
          return JSON.stringify(array)
        }

        return arrayStr
      }
    }

    // Handle comma-separated values without brackets
    if (output.includes(",")) {
      const values = output.split(",").map((v) => v.trim())

      // Try to convert to numbers if possible
      const parsedValues = values.map((v) => {
        const num = Number(v)
        return isNaN(num) ? v : num
      })

      // Sort if it's a two-element array of numbers (for two-sum)
      if (parsedValues.length === 2 && parsedValues.every((item) => typeof item === "number")) {
        parsedValues.sort((a: any, b: any) => a - b)
      }

      debugLog("Parsed comma-separated values:", parsedValues)
      return JSON.stringify(parsedValues)
    }

    // If we can't parse it as an array, normalize as generic output
    return normalizeGenericOutput(output)
  } catch (error) {
    debugLog("Error normalizing Two Sum output:", error)
    return normalizeGenericOutput(output)
  }
}

// Normalize array outputs
function normalizeArrayOutput(output: string): string {
  debugLog("Normalizing array output:", output)

  try {
    // Handle array-like outputs
    if (output.startsWith("[") && output.endsWith("]")) {
      // Parse the array
      const array = JSON.parse(output)

      // Convert back to string
      return JSON.stringify(array)
    }

    // Handle comma-separated values without brackets
    if (output.includes(",")) {
      const values = output.split(",").map((v) => v.trim())

      // Try to convert to numbers if possible
      const parsedValues = values.map((v) => {
        const num = Number(v)
        return isNaN(num) ? v : num
      })

      debugLog("Parsed comma-separated values:", parsedValues)
      return JSON.stringify(parsedValues)
    }
  } catch (e) {
    // If parsing fails, continue with generic normalization
    debugLog("Error normalizing array output:", e)
  }

  // Default: remove all whitespace and make lowercase
  return output.replace(/\s+/g, "").toLowerCase()
}

// Normalize string outputs
function normalizeStringOutput(output: string): string {
  debugLog("Normalizing string output:", output)

  // Remove quotes if present
  let normalized = output.trim()
  if (
    (normalized.startsWith('"') && normalized.endsWith('"')) ||
    (normalized.startsWith("'") && normalized.endsWith("'"))
  ) {
    normalized = normalized.substring(1, normalized.length - 1)
  }

  // Remove all whitespace and make lowercase for case-insensitive comparison
  return normalized.replace(/\s+/g, "").toLowerCase()
}

// Generic normalization for any output
function normalizeGenericOutput(output: string): string {
  debugLog("Normalizing generic output:", output)

  // Remove all whitespace
  let normalized = output.replace(/\s+/g, "")

  // Make lowercase for case-insensitive comparison
  normalized = normalized.toLowerCase()

  return normalized
}

// Compare expected and actual outputs
export function compareOutputs(
  expected: string,
  actual: string,
  problemType: string,
): { passed: boolean; diff?: string; visualDiff?: any } {
  debugLog("Comparing outputs for problem type:", problemType)
  debugLog("Expected:", expected)
  debugLog("Actual:", actual)

  // For Two Sum problems, use specialized comparison
  if (problemType === "two-sum") {
    return compareTwoSumOutputs(expected, actual)
  }

  // For other problem types, use generic comparison
  if (expected === actual) {
    debugLog("Outputs match exactly")
    return { passed: true }
  }

  // Generate a diff for better feedback
  let diff = "Differences found:\n"
  diff += `- Expected: ${expected}\n- Actual: ${actual}\n`

  // Check for length difference
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

  debugLog("Comparison failed with diff:", diff)

  return {
    passed: false,
    diff,
    visualDiff: {
      expected,
      actual,
      differences: [{ type: "string", expected, actual }],
    },
  }
}

// Compare Two Sum outputs
function compareTwoSumOutputs(expected: string, actual: string): { passed: boolean; diff?: string; visualDiff?: any } {
  debugLog("Comparing Two Sum outputs")

  try {
    // Try to parse both as JSON
    const expectedArray = JSON.parse(expected)
    let actualArray

    try {
      actualArray = JSON.parse(actual)
    } catch (e) {
      // If actual can't be parsed as JSON, try to extract array-like structure
      const match = actual.match(/\[\s*\d+\s*,\s*\d+\s*\]/)
      if (match) {
        actualArray = JSON.parse(match[0])
      } else {
        throw new Error("Could not parse actual output as array")
      }
    }

    debugLog("Parsed expected:", expectedArray)
    debugLog("Parsed actual:", actualArray)

    // Check if both are arrays
    if (!Array.isArray(expectedArray) || !Array.isArray(actualArray)) {
      const diff = `Expected an array, but got ${Array.isArray(actualArray) ? "an array" : typeof actualArray}`
      debugLog(diff)
      return {
        passed: false,
        diff,
        visualDiff: { expected: expectedArray, actual: actualArray },
      }
    }

    // For Two Sum, we expect arrays of length 2 with indices
    if (
      expectedArray.length === 2 &&
      expectedArray.every((item) => typeof item === "number") &&
      actualArray.length === 2 &&
      actualArray.every((item) => typeof item === "number")
    ) {
      // Sort both arrays for consistent comparison
      const sortedExpected = [...expectedArray].sort((a, b) => a - b)
      const sortedActual = [...actualArray].sort((a, b) => a - b)

      // Check if the sorted arrays are equal
      if (sortedExpected[0] === sortedActual[0] && sortedExpected[1] === sortedActual[1]) {
        debugLog("Two Sum indices match after sorting")
        return { passed: true }
      }

      // Generate detailed diff for Two Sum
      const diff = `Expected indices [${expectedArray.join(", ")}], got [${actualArray.join(", ")}]`
      debugLog("Two Sum comparison failed:", diff)

      return {
        passed: false,
        diff: `Missing elements: ${sortedExpected[0] !== sortedActual[0] ? sortedExpected[0] : sortedExpected[1]}\nExpected indices [${expectedArray.join(", ")}], got [${actualArray.join(", ")}]`,
        visualDiff: {
          expected: expectedArray,
          actual: actualArray,
          differences: [{ type: "array", expected: expectedArray, actual: actualArray }],
        },
      }
    }

    // For other arrays, compare elements
    if (JSON.stringify(expectedArray) === JSON.stringify(actualArray)) {
      debugLog("Arrays match exactly")
      return { passed: true }
    }

    // Generate diff for arrays
    const diff = `Arrays do not match:\nExpected: ${JSON.stringify(expectedArray)}\nActual: ${JSON.stringify(actualArray)}`
    debugLog(diff)

    return {
      passed: false,
      diff,
      visualDiff: {
        expected: expectedArray,
        actual: actualArray,
        differences: [{ type: "array", expected: expectedArray, actual: actualArray }],
      },
    }
  } catch (e) {
    // If parsing fails, fall back to string comparison
    debugLog("Error comparing Two Sum outputs:", e)

    if (expected === actual) {
      return { passed: true }
    }

    return {
      passed: false,
      diff: `Could not parse outputs as arrays:\nExpected: ${expected}\nActual: ${actual}\nError: ${e.message}`,
      visualDiff: {
        expected,
        actual,
        differences: [{ type: "string", expected, actual }],
      },
    }
  }
}

// Check if the output is within acceptable time and memory limits
export function checkPerformanceLimits(
  executionTime: number,
  memoryUsed: number,
  timeLimit: number,
  memoryLimit: number,
): { passed: boolean; reason?: string } {
  debugLog("Checking performance limits:", { executionTime, memoryUsed, timeLimit, memoryLimit })

  if (executionTime > timeLimit) {
    debugLog("Time limit exceeded")
    return {
      passed: false,
      reason: `Time limit exceeded: ${executionTime.toFixed(2)}ms (limit: ${timeLimit.toFixed(2)}ms)`,
    }
  }

  if (memoryUsed > memoryLimit) {
    debugLog("Memory limit exceeded")
    return {
      passed: false,
      reason: `Memory limit exceeded: ${memoryUsed.toFixed(2)}MB (limit: ${memoryLimit.toFixed(2)}MB)`,
    }
  }

  debugLog("Performance check passed")
  return { passed: true }
}

// Extract actual output from console logs or return values
export function extractActualOutput(output: string, language: string, problemType: string): string {
  // This function extracts the actual output from the execution result
  // For example, if the output contains debug statements or other noise

  // Split by lines
  const lines = output.split("\n")

  // Try to find the actual output line
  // This is a simplified approach - in a real system, you'd have more robust parsing
  for (const line of lines) {
    // Skip empty lines and common debug/log patterns
    if (
      !line.trim() ||
      line.includes("console.log") ||
      line.includes("print(") ||
      line.startsWith("//") ||
      line.startsWith("#")
    ) {
      continue
    }

    // This might be our output line
    return line.trim()
  }

  // If we couldn't find a clear output line, return the whole thing
  return output.trim()
}

// Detect potential plagiarism by comparing with existing solutions
export async function detectPlagiarism(
  code: string,
  language: string,
  problemId: number,
): Promise<{ isPlagiarized: boolean; score: number; similarSolution?: any }> {
  debugLog("Checking for plagiarism:", { language, problemId })

  // Normalize the code by removing comments, whitespace, and variable names
  const normalizedCode = normalizeCodeForPlagiarismCheck(code, language)

  // In a real implementation, you would compare with existing solutions
  // For this demo, we'll return a low plagiarism score
  return {
    isPlagiarized: false,
    score: 0.1,
  }
}

// Normalize code for plagiarism detection
function normalizeCodeForPlagiarismCheck(code: string, language: string): string {
  debugLog("Normalizing code for plagiarism check")

  // Remove comments
  let normalized = code

  if (language === "javascript" || language === "java" || language === "cpp") {
    // Remove single-line comments
    normalized = normalized.replace(/\/\/.*$/gm, "")
    // Remove multi-line comments
    normalized = normalized.replace(/\/\*[\s\S]*?\*\//g, "")
  } else if (language === "python") {
    // Remove single-line comments
    normalized = normalized.replace(/#.*$/gm, "")
    // Remove multi-line string literals that might be used as comments
    normalized = normalized.replace(/'''[\s\S]*?'''/g, "")
    normalized = normalized.replace(/"""[\s\S]*?"""/g, "")
  }

  // Remove all whitespace
  normalized = normalized.replace(/\s+/g, "")

  // Convert to lowercase
  normalized = normalized.toLowerCase()

  debugLog("Normalized code length:", normalized.length)
  return normalized
}
