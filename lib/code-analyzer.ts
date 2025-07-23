/**
 * Utilities for analyzing and sanitizing code
 */

// Sanitize code to prevent malicious execution
export function sanitizeCode(code: string, language: string): string {
  // In a real-world scenario, you'd implement more robust sanitization
  // This is a simple example to remove potentially harmful patterns
  const sanitized = code
    .replace(/process\.exit/g, "/* process.exit */")
    .replace(/require\s*$$\s*['"]child_process['"]\s*$$/g, '/* require("child_process") */')
    .replace(/exec\s*\(/g, "/* exec( */")
    .replace(/eval\s*\(/g, "/* eval( */")
    .replace(/Function\s*\(/g, "/* Function( */")
    .replace(/new\s+Function/g, "/* new Function */")
    .replace(/fs\./g, "/* fs. */")
    .replace(/require\s*$$\s*['"]fs['"]\s*$$/g, '/* require("fs") */')
    .replace(/process\./g, "/* process. */")
    .replace(/global\./g, "/* global. */")
    .replace(/window\./g, "/* window. */")
    .replace(/document\./g, "/* document. */")
    .replace(/XMLHttpRequest/g, "/* XMLHttpRequest */")
    .replace(/fetch\s*\(/g, "/* fetch( */")
    .replace(/import\s*\(/g, "/* import( */")
    .replace(/Deno\./g, "/* Deno. */")
    .replace(/Bun\./g, "/* Bun. */")

  // Language-specific sanitization
  if (language === "python") {
    return sanitized
      .replace(/import\s+os/g, "# import os")
      .replace(/import\s+sys/g, "# import sys")
      .replace(/import\s+subprocess/g, "# import subprocess")
      .replace(/import\s+shutil/g, "# import shutil")
      .replace(/open\s*\(/g, "# open(")
      .replace(/__import__/g, "# __import__")
      .replace(/exec\s*\(/g, "# exec(")
      .replace(/eval\s*\(/g, "# eval(")
  } else if (language === "java") {
    return sanitized
      .replace(/Runtime\./g, "/* Runtime. */")
      .replace(/ProcessBuilder/g, "/* ProcessBuilder */")
      .replace(/System\.exit/g, "/* System.exit */")
  } else if (language === "cpp") {
    return sanitized
      .replace(/system\s*\(/g, "/* system( */")
      .replace(/fork\s*\(/g, "/* fork( */")
      .replace(/exec[a-z]*\(/g, "/* exec*( */")
      .replace(/popen\s*\(/g, "/* popen( */")
      .replace(/fopen\s*\(/g, "/* fopen( */")
      .replace(/std::system/g, "/* std::system */")
  }

  return sanitized
}

// Extract code signature (function name, parameters, etc.)
export function extractCodeSignature(
  code: string,
  language: string,
): {
  functionName: string
  parameters: string[]
  returnType?: string
} {
  let functionName = ""
  let parameters: string[] = []
  let returnType = ""

  try {
    if (language === "javascript") {
      // Match function declarations like: function twoSum(nums, target) { ... }
      const functionMatch = code.match(/function\s+([a-zA-Z0-9_]+)\s*$$([^)]*)$$/)
      if (functionMatch) {
        functionName = functionMatch[1]
        parameters = functionMatch[2].split(",").map((p) => p.trim())
      } else {
        // Match arrow functions like: const twoSum = (nums, target) => { ... }
        const arrowMatch = code.match(/(?:const|let|var)\s+([a-zA-Z0-9_]+)\s*=\s*$$([^)]*)$$\s*=>/)
        if (arrowMatch) {
          functionName = arrowMatch[1]
          parameters = arrowMatch[2].split(",").map((p) => p.trim())
        }
      }
    } else if (language === "python") {
      // Match function declarations like: def twoSum(nums, target):
      const functionMatch = code.match(/def\s+([a-zA-Z0-9_]+)\s*$$([^)]*)$$/)
      if (functionMatch) {
        functionName = functionMatch[1]
        parameters = functionMatch[2].split(",").map((p) => p.trim())

        // Check for type hints
        parameters = parameters.map((p) => {
          const typeHintMatch = p.match(/([a-zA-Z0-9_]+)\s*:\s*([a-zA-Z0-9_[\]]+)/)
          return typeHintMatch ? typeHintMatch[1] : p
        })

        // Extract return type if present
        const returnTypeMatch = code.match(/def\s+[a-zA-Z0-9_]+\s*$$[^)]*$$\s*->\s*([a-zA-Z0-9_[\]]+)/)
        if (returnTypeMatch) {
          returnType = returnTypeMatch[1]
        }
      }
    } else if (language === "java") {
      // Match method declarations like: public int[] twoSum(int[] nums, int target) { ... }
      const methodMatch = code.match(
        /(?:public|private|protected)?\s+([a-zA-Z0-9_[\]<>]+)\s+([a-zA-Z0-9_]+)\s*$$([^)]*)$$/,
      )
      if (methodMatch) {
        returnType = methodMatch[1]
        functionName = methodMatch[2]

        // Parse parameters with types
        const paramString = methodMatch[3]
        if (paramString.trim()) {
          const paramPairs = paramString.split(",")
          parameters = paramPairs.map((pair) => {
            const parts = pair.trim().split(/\s+/)
            return parts[parts.length - 1] // Get the parameter name (last part)
          })
        }
      }
    } else if (language === "cpp") {
      // Match function declarations like: vector<int> twoSum(vector<int>& nums, int target) { ... }
      const functionMatch = code.match(/([a-zA-Z0-9_:]+(?:<[^>]+>)?(?:\s*\*)?)\s+([a-zA-Z0-9_]+)\s*$$([^)]*)$$/)
      if (functionMatch) {
        returnType = functionMatch[1]
        functionName = functionMatch[2]

        // Parse parameters with types
        const paramString = functionMatch[3]
        if (paramString.trim()) {
          const paramPairs = paramString.split(",")
          parameters = paramPairs.map((pair) => {
            const parts = pair.trim().split(/\s+/)
            return parts[parts.length - 1].replace(/[&*]/, "") // Get the parameter name (last part) and remove & or *
          })
        }
      }
    }
  } catch (error) {
    console.error("Error extracting code signature:", error)
  }

  return { functionName, parameters, returnType }
}

// Analyze code complexity
export function analyzeCodeComplexity(
  code: string,
  language: string,
  problemType: string,
): {
  timeComplexity: string
  spaceComplexity: string
  isOptimal: boolean
} {
  // In a real implementation, this would perform static analysis of the code
  // For this demo, we'll use heuristics based on common patterns

  let timeComplexity = "O(n)" // Default
  let spaceComplexity = "O(n)" // Default
  let isOptimal = false

  try {
    // Check for nested loops (O(n²) time complexity)
    const hasNestedLoops = (code.match(/for\s*\(/g) || []).length >= 2 || (code.match(/while\s*\(/g) || []).length >= 2

    // Check for hash map/dictionary usage (often O(n) time, O(n) space)
    const hasHashMap =
      code.includes("Map(") ||
      code.includes("Object.") ||
      code.includes("dict(") ||
      code.includes("HashMap") ||
      code.includes("unordered_map")

    // Check for binary search patterns (O(log n) time)
    const hasBinarySearch =
      code.includes("mid") &&
      (code.includes("left") || code.includes("right")) &&
      (code.includes("< mid") || code.includes("> mid"))

    // Determine complexity based on problem type and code patterns
    if (problemType === "two-sum") {
      if (hasNestedLoops && !hasHashMap) {
        timeComplexity = "O(n²)"
        spaceComplexity = "O(1)"
        isOptimal = false
      } else if (hasHashMap) {
        timeComplexity = "O(n)"
        spaceComplexity = "O(n)"
        isOptimal = true
      }
    } else if (problemType === "binary-search") {
      if (hasBinarySearch) {
        timeComplexity = "O(log n)"
        spaceComplexity = "O(1)"
        isOptimal = true
      } else {
        timeComplexity = "O(n)"
        spaceComplexity = "O(1)"
        isOptimal = false
      }
    } else if (problemType === "sorting") {
      if (code.includes("sort(") || code.includes(".sort(") || code.includes("Arrays.sort(")) {
        timeComplexity = "O(n log n)"
        spaceComplexity = "O(log n)"
        isOptimal = true
      } else if (hasNestedLoops) {
        timeComplexity = "O(n²)"
        spaceComplexity = "O(1)"
        isOptimal = false
      }
    } else {
      // Generic complexity analysis
      if (hasNestedLoops) {
        timeComplexity = "O(n²)"
        spaceComplexity = "O(n)"
      } else if (hasBinarySearch) {
        timeComplexity = "O(log n)"
        spaceComplexity = "O(1)"
      } else if (hasHashMap) {
        timeComplexity = "O(n)"
        spaceComplexity = "O(n)"
      }
    }
  } catch (error) {
    console.error("Error analyzing code complexity:", error)
  }

  return { timeComplexity, spaceComplexity, isOptimal }
}

// Check for common code smells and anti-patterns
export function detectCodeSmells(code: string, language: string): string[] {
  const codeSmells: string[] = []

  try {
    // Check for magic numbers
    const hasMagicNumbers =
      /\b[0-9]+\b/.test(code) &&
      !code.includes("= 0") &&
      !code.includes("= 1") &&
      !code.includes("< 0") &&
      !code.includes("> 0")

    if (hasMagicNumbers) {
      codeSmells.push("Magic numbers detected. Consider using named constants for better readability.")
    }

    // Check for long functions
    const lines = code.split("\n").filter((line) => line.trim() !== "")
    if (lines.length > 30) {
      codeSmells.push("Long function detected. Consider breaking it down into smaller, more focused functions.")
    }

    // Check for deep nesting
    const maxIndentation = lines.reduce((max, line) => {
      const indentation = line.search(/\S/)
      return indentation > max ? indentation : max
    }, 0)

    if (maxIndentation > 12) {
      // Assuming 2-space indentation, this means more than 6 levels
      codeSmells.push("Deep nesting detected. Consider refactoring to reduce complexity.")
    }

    // Language-specific checks
    if (language === "javascript") {
      if (code.includes("var ")) {
        codeSmells.push("Using 'var' is discouraged. Consider using 'const' or 'let' instead.")
      }

      if (code.includes("==") && !code.includes("===")) {
        codeSmells.push(
          "Using loose equality (==) can lead to unexpected behavior. Consider using strict equality (===).",
        )
      }
    } else if (language === "python") {
      if (code.includes("except:") && !code.includes("except ")) {
        codeSmells.push(
          "Bare 'except:' clause will catch all exceptions, including KeyboardInterrupt. Specify exception types.",
        )
      }
    }
  } catch (error) {
    console.error("Error detecting code smells:", error)
  }

  return codeSmells
}
