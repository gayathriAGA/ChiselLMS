"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { normalizeOutput, compareOutputs, checkPerformanceLimits, detectPlagiarism } from "@/lib/validation-utils"
import { executeCode as runCodeInLanguage, formatOutput } from "@/lib/language-executors"
import { analyzeCodeComplexity } from "@/lib/code-analyzer"
import { prisma } from "@/lib/prisma"

// Debug flag - set to true to enable detailed logging
const DEBUG = true

// Log function that only logs when DEBUG is true
function debugLog(...args: any[]) {
  if (DEBUG) {
    console.log("[Execution]", ...args)
  }
}

type ExecutionResult = {
  success: boolean
  output: string
  executionTime: number
  memoryUsed: number
  testCasesPassed: number
  totalTestCases: number
  testCaseResults: TestCaseResult[]
  errorMessage?: string
  compilationError?: boolean
  timeComplexity?: string
  spaceComplexity?: string
  potentialPlagiarism?: boolean
  plagiarismScore?: number
}

type TestCaseResult = {
  input: string
  expectedOutput: string
  actualOutput: string
  passed: boolean
  executionTime?: number
  errorMessage?: string
  diff?: string
  visualDiff?: {
    expected: any
    actual: any
    differences: any[]
  }
}

type SubmissionResult = {
  success: boolean
  submission?: any
  executionResult?: ExecutionResult
  message?: string
  pointsEarned?: number
  badgesEarned?: any[]
  feedback?: string[]
  improvementSuggestions?: string[]
}

// Function to sanitize code to prevent malicious execution
function sanitizeCode(code: string, language: string): string {
  debugLog("Sanitizing code for language:", language)

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

  return sanitized
}

// Function to compile code (for compiled languages)
async function compileCode(code: string, language: string): Promise<{ success: boolean; error?: string }> {
  debugLog("Compiling code for language:", language)

  // In a real implementation, you would send the code to a secure compilation service
  // For this demo, we'll simulate compilation for compiled languages

  if (language === "javascript" || language === "python") {
    // Interpreted languages don't need compilation
    debugLog("Interpreted language, skipping compilation")
    return { success: true }
  }

  // Simulate compilation delay
  await new Promise((resolve) => setTimeout(resolve, 500))

  // Check for common compilation errors based on language
  if (language === "java") {
    if (!code.includes("class") || !code.includes("public static void main")) {
      debugLog("Java compilation error: missing main method")
      return {
        success: false,
        error: "error: missing 'public static void main' method\n  public class must contain a main method",
      }
    }

    // Check for missing semicolons (common Java error)
    const lines = code.split("\n")
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      if (
        line &&
        !line.endsWith("{") &&
        !line.endsWith("}") &&
        !line.endsWith(";") &&
        !line.startsWith("//") &&
        !line.startsWith("/*") &&
        !line.endsWith("*/") &&
        !line.startsWith("package") &&
        !line.startsWith("import")
      ) {
        return {
          success: false,
          error: `error: ';' expected\n  at line ${i + 1}: ${line}`,
        }
      }
    }
  } else if (language === "cpp") {
    if (!code.includes("main(") && !code.includes("main (")) {
      debugLog("C++ compilation error: missing main function")
      return {
        success: false,
        error: "error: 'main' function not found\n  program must contain a main function",
      }
    }

    // Check for missing semicolons (common C++ error)
    const lines = code.split("\n")
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      if (
        line &&
        !line.endsWith("{") &&
        !line.endsWith("}") &&
        !line.endsWith(";") &&
        !line.startsWith("//") &&
        !line.startsWith("/*") &&
        !line.endsWith("*/") &&
        !line.includes("#include")
      ) {
        return {
          success: false,
          error: `error: expected ';' at end of declaration\n  at line ${i + 1}: ${line}`,
        }
      }
    }
  }

  debugLog("Compilation successful")
  return { success: true }
}

// Function to execute code against a single test case
async function executeTestCase(
  code: string,
  language: string,
  testCase: any,
  problemId: number,
  problemType: string,
  timeLimit: number,
  memoryLimit: number,
): Promise<TestCaseResult> {
  debugLog("Executing test case for problem:", problemId, "type:", problemType)
  debugLog("Test case input:", testCase.input)
  debugLog("Expected output:", testCase.expected_output)

  try {
    // Parse the input
    const input = testCase.input
    const expectedOutput = testCase.expected_output

    // Sanitize and prepare the code
    const sanitizedCode = sanitizeCode(code, language)

    // Execute the code with the input
    const startTime = performance.now()
    const executionResult = runCodeInLanguage(sanitizedCode, language, input, problemType)
    const endTime = performance.now()
    const executionTime = endTime - startTime

    debugLog("Raw execution result:", executionResult)

    // Check for runtime errors
    if (executionResult.error) {
      debugLog("Runtime error:", executionResult.error)
      return {
        input,
        expectedOutput,
        actualOutput: "",
        passed: false,
        executionTime,
        errorMessage: executionResult.error,
      }
    }

    // Check for time limit exceeded
    const performanceCheck = checkPerformanceLimits(executionTime, 0, timeLimit, memoryLimit)
    if (!performanceCheck.passed) {
      debugLog("Performance check failed:", performanceCheck.reason)
      return {
        input,
        expectedOutput,
        actualOutput: executionResult.output,
        passed: false,
        executionTime,
        errorMessage: performanceCheck.reason,
      }
    }

    // Format the output based on problem type
    const formattedOutput = formatOutput(executionResult.output, language, problemType)
    debugLog("Formatted output:", formattedOutput)

    // Normalize both outputs for comparison
    const normalizedExpected = normalizeOutput(expectedOutput, language, problemType)
    const normalizedActual = normalizeOutput(formattedOutput, language, problemType)

    debugLog("Normalized expected:", normalizedExpected)
    debugLog("Normalized actual:", normalizedActual)

    // Compare the outputs
    const comparisonResult = compareOutputs(normalizedExpected, normalizedActual, problemType)
    debugLog("Comparison result:", comparisonResult)

    return {
      input,
      expectedOutput,
      actualOutput: formattedOutput,
      passed: comparisonResult.passed,
      executionTime,
      diff: comparisonResult.diff,
      visualDiff: comparisonResult.visualDiff,
    }
  } catch (error) {
    console.error("Test case execution error:", error)

    return {
      input: testCase.input,
      expectedOutput: testCase.expected_output,
      actualOutput: "Error executing test case",
      passed: false,
      errorMessage: error instanceof Error ? error.message : String(error),
    }
  }
}

// Function to validate test cases against code output
async function validateTestCases(
  problemId: number,
  code: string,
  language: string,
): Promise<{
  testCasesPassed: number
  totalTestCases: number
  results: TestCaseResult[]
  isOptimal: boolean
  compilationError: boolean
  compilationErrorMessage?: string
  timeComplexity?: string
  spaceComplexity?: string
  potentialPlagiarism?: boolean
  plagiarismScore?: number
  feedback?: string[]
}> {
  debugLog("Validating test cases for problem:", problemId, "language:", language)

  const supabase = createServerSupabaseClient()

  // First, compile the code (for compiled languages)
  const compilationResult = await compileCode(code, language)

  if (!compilationResult.success) {
    debugLog("Compilation failed:", compilationResult.error)
    return {
      testCasesPassed: 0,
      totalTestCases: 0,
      results: [],
      isOptimal: false,
      compilationError: true,
      compilationErrorMessage: compilationResult.error,
      feedback: [
        "Your code failed to compile. Check the error message for details.",
        "Make sure all syntax is correct for the chosen language.",
      ],
    }
  }

  // Fetch problem details
  // Replace this line:
  // const { data: problem } = await supabase.from("problems").select("*").eq("id", problemId).single()
  const problem = await prisma.problem.findUnique({
    where: { id: problemId },
  })

  if (!problem) {
    debugLog("Problem not found:", problemId)
    return {
      testCasesPassed: 0,
      totalTestCases: 0,
      results: [],
      isOptimal: false,
      compilationError: false,
      feedback: ["Problem not found"],
    }
  }

  // Fetch test cases for the problem
  // Replace:
  // const { data: testCases } = await supabase.from("test_cases").select("*").eq("problem_id", problemId).order("id", { ascending: true })
  const testCases = await prisma.testCase.findMany({
    where: { problemId },
    orderBy: { id: "asc" },
  })

  if (!testCases || testCases.length === 0) {
    debugLog("No test cases found for problem:", problemId)
    return {
      testCasesPassed: 0,
      totalTestCases: 0,
      results: [],
      isOptimal: false,
      compilationError: false,
      feedback: ["No test cases found for this problem"],
    }
  }

  // Determine problem type and constraints
  const problemType = problem.code || "general"
  const timeLimit = problem.time_limit || 2000 // ms
  const memoryLimit = problem.memory_limit || 128 // MB

  debugLog("Problem type:", problemType, "Time limit:", timeLimit, "Memory limit:", memoryLimit)

  // Execute each test case
  const results: TestCaseResult[] = await Promise.all(
    testCases.map(async (testCase) => {
      return executeTestCase(code, language, testCase, problemId, problemType, timeLimit, memoryLimit)
    }),
  )

  const testCasesPassed = results.filter((r) => r.passed).length
  debugLog("Test cases passed:", testCasesPassed, "of", testCases.length)

  // Analyze code complexity
  const complexityAnalysis = analyzeCodeComplexity(code, language, problemType)

  // Check for plagiarism
  const plagiarismCheck = await detectPlagiarism(code, language, problemId)
  debugLog("Plagiarism check:", plagiarismCheck)

  // Generate feedback based on results
  const feedback = generateFeedback(results, testCasesPassed, testCases.length, complexityAnalysis, problem)
  debugLog("Generated feedback:", feedback)

  // Determine if the solution is optimal based on complexity and execution time
  const isOptimal =
    testCasesPassed === testCases.length &&
    complexityAnalysis.isOptimal &&
    results.every((r) => r.executionTime && r.executionTime < timeLimit * 0.5) // Using 50% of time limit as threshold

  debugLog("Is optimal solution:", isOptimal)

  return {
    testCasesPassed,
    totalTestCases: testCases.length,
    results,
    isOptimal,
    compilationError: false,
    timeComplexity: complexityAnalysis.timeComplexity,
    spaceComplexity: complexityAnalysis.spaceComplexity,
    potentialPlagiarism: plagiarismCheck.isPlagiarized,
    plagiarismScore: plagiarismCheck.score,
    feedback,
  }
}

// Generate feedback based on test results
function generateFeedback(
  results: TestCaseResult[],
  passed: number,
  total: number,
  complexity: any,
  problem: any,
): string[] {
  const feedback: string[] = []

  // Overall performance feedback
  if (passed === total) {
    feedback.push("Great job! All test cases passed.")

    if (complexity.isOptimal) {
      feedback.push("Your solution has optimal time and space complexity.")
    } else {
      feedback.push(
        `Your solution works correctly, but could be optimized. The expected time complexity is ${problem.time_complexity}.`,
      )
    }
  } else if (passed === 0) {
    feedback.push("Your solution didn't pass any test cases. Review the problem statement carefully.")
  } else {
    feedback.push(`Your solution passed ${passed} out of ${total} test cases.`)
  }

  // Analyze failed test cases for patterns
  const failedResults = results.filter((r) => !r.passed)
  if (failedResults.length > 0) {
    // Check for common error patterns
    const hasRuntimeErrors = failedResults.some((r) => r.errorMessage && !r.errorMessage.includes("Time Limit"))
    const hasTimeLimitExceeded = failedResults.some((r) => r.errorMessage && r.errorMessage.includes("Time Limit"))

    if (hasRuntimeErrors) {
      feedback.push(
        "Your code has runtime errors on some test cases. Check for edge cases like empty arrays or null values.",
      )
    }

    if (hasTimeLimitExceeded) {
      feedback.push(
        `Your solution exceeds the time limit. Try to optimize your algorithm to meet the expected ${problem.time_complexity} time complexity.`,
      )
    }
  }

  return feedback
}

// Function to execute code
export async function executeCode(code: string, language: string, problemId: number): Promise<ExecutionResult> {
  debugLog("Executing code for problem:", problemId, "language:", language)

  try {
    // Record execution start time
    const startTime = Date.now()

    // Validate against test cases
    const testCaseResults = await validateTestCases(problemId, code, language)

    // If there was a compilation error, return early
    if (testCaseResults.compilationError) {
      debugLog("Compilation error:", testCaseResults.compilationErrorMessage)
      return {
        success: false,
        output: `Compilation Error: ${testCaseResults.compilationErrorMessage}`,
        executionTime: 0,
        memoryUsed: 0,
        testCasesPassed: 0,
        totalTestCases: testCaseResults.totalTestCases,
        testCaseResults: [],
        errorMessage: testCaseResults.compilationErrorMessage,
        compilationError: true,
      }
    }

    // Calculate execution time
    const executionTime = (Date.now() - startTime) / 1000

    // Simulate memory usage between 5-15 MB
    const memoryUsed = Math.random() * 10 + 5

    // Generate a sample output based on the language
    let output = ""
    switch (language) {
      case "javascript":
        output = `// JavaScript execution\n${code.substring(0, 100)}...\n\n> Executed successfully`
        break
      case "python":
        output = `# Python execution\n${code.substring(0, 100)}...\n\n> Executed successfully`
        break
      case "java":
        output = `// Java execution\n${code.substring(0, 100)}...\n\n> Compiled and executed successfully`
        break
      case "cpp":
        output = `// C++ execution\n${code.substring(0, 100)}...\n\n> Compiled and executed successfully`
        break
      default:
        output = `Execution for ${language} is not supported yet.`
    }

    // If any test case failed, include error information
    const failedTestCases = testCaseResults.results.filter((tc) => !tc.passed)
    if (failedTestCases.length > 0) {
      output += "\n\nTest case failures:"
      failedTestCases.forEach((tc, index) => {
        output += `\n\nTest Case ${index + 1}:`
        output += `\nInput: ${tc.input}`
        output += `\nExpected: ${tc.expectedOutput}`
        output += `\nActual: ${tc.actualOutput}`
        if (tc.errorMessage) {
          output += `\nError: ${tc.errorMessage}`
        }
        if (tc.diff) {
          output += `\nDifference: ${tc.diff}`
        }
      })
    }

    // Add complexity analysis if available
    if (testCaseResults.timeComplexity) {
      output += `\n\nTime Complexity: ${testCaseResults.timeComplexity}`
    }
    if (testCaseResults.spaceComplexity) {
      output += `\nSpace Complexity: ${testCaseResults.spaceComplexity}`
    }

    // Add plagiarism warning if detected
    if (testCaseResults.potentialPlagiarism) {
      output += `\n\nWarning: Your solution has a high similarity (${Math.round(testCaseResults.plagiarismScore! * 100)}%) with existing solutions. Please ensure your work is original.`
    }

    debugLog("Execution completed. Success:", testCaseResults.testCasesPassed === testCaseResults.totalTestCases)

    return {
      success: testCaseResults.testCasesPassed === testCaseResults.totalTestCases,
      output,
      executionTime,
      memoryUsed,
      testCasesPassed: testCaseResults.testCasesPassed,
      totalTestCases: testCaseResults.totalTestCases,
      testCaseResults: testCaseResults.results,
      timeComplexity: testCaseResults.timeComplexity,
      spaceComplexity: testCaseResults.spaceComplexity,
      potentialPlagiarism: testCaseResults.potentialPlagiarism,
      plagiarismScore: testCaseResults.plagiarismScore,
    }
  } catch (error) {
    console.error("Code execution error:", error)
    return {
      success: false,
      output: `Error executing code: ${error instanceof Error ? error.message : String(error)}`,
      executionTime: 0,
      memoryUsed: 0,
      testCasesPassed: 0,
      totalTestCases: 0,
      testCaseResults: [],
      errorMessage: error instanceof Error ? error.message : String(error),
    }
  }
}

// Submit solution
export async function submitSolution(
  userId: string,
  problemId: number,
  code: string,
  language: string,
): Promise<SubmissionResult> {
  debugLog("Submitting solution for problem:", problemId, "user:", userId, "language:", language)

  try {
    const supabase = createServerSupabaseClient()

    // Get problem details
    // Replace problem query:
    const problem = await prisma.problem.findUnique({
      where: { id: problemId },
      select: { difficulty: true, timeLimit: true, memoryLimit: true },
    })

    if (!problem) {
      throw new Error("Problem not found")
    }

    const timeLimit = problem.timeLimit || 2000 // ms
    const memoryLimit = problem.memoryLimit || 128 // MB

    // Execute the code first
    const executionResult = await executeCode(code, language, problemId)

    // If there was a compilation error, handle it
    if (executionResult.compilationError) {
      debugLog("Compilation error during submission")

      // Save submission with compilation error status - handle missing columns
      try {
        // First, check if the time_complexity and space_complexity columns exist
        const { error: schemaError } = await supabase.from("submissions").select("time_complexity").limit(1)

        // If there's an error, it likely means the column doesn't exist
        if (schemaError) {
          debugLog("Database schema missing time_complexity column, using basic insert")
          // Use basic insert without those columns
          await supabase.from("submissions").insert({
            user_id: userId,
            problem_id: problemId,
            code: code,
            language: language,
            status: "Compilation Error",
            execution_time: 0,
            memory_used: 0,
            created_at: new Date().toISOString(),
          })
        } else {
          // Columns exist, use full insert
          await supabase.from("submissions").insert({
            user_id: userId,
            problem_id: problemId,
            code: code,
            language: language,
            status: "Compilation Error",
            execution_time: 0,
            memory_used: 0,
            time_complexity: null,
            space_complexity: null,
            created_at: new Date().toISOString(),
          })
        }
      } catch (dbError) {
        console.error("Database error during submission insert:", dbError)
        // Fallback to minimal insert
        await supabase.from("submissions").insert({
          user_id: userId,
          problem_id: problemId,
          code: code,
          language: language,
          status: "Compilation Error",
          execution_time: 0,
          memory_used: 0,
          created_at: new Date().toISOString(),
        })
      }

      return {
        success: false,
        executionResult,
        message: "Compilation Error: " + executionResult.errorMessage,
      }
    }

    // Check for plagiarism
    if (executionResult.potentialPlagiarism && executionResult.plagiarismScore! > 0.8) {
      debugLog("High plagiarism detected:", executionResult.plagiarismScore)
      return {
        success: false,
        executionResult,
        message: `Potential plagiarism detected with ${Math.round(executionResult.plagiarismScore! * 100)}% similarity to existing solutions. Please submit your own work.`,
      }
    }

    // Determine status based on test cases
    let status = "Wrong Answer"
    if (executionResult.testCasesPassed === executionResult.totalTestCases) {
      status = "Accepted"
    } else if (executionResult.testCaseResults.some((r) => r.errorMessage?.includes("Time Limit"))) {
      status = "Time Limit Exceeded"
    } else if (executionResult.testCaseResults.some((r) => r.errorMessage && !r.errorMessage.includes("Time Limit"))) {
      status = "Runtime Error"
    }

    debugLog("Submission status:", status)

    // Calculate points earned
    const xpEarned = status === "Accepted" ? 100 : 0 // Simplified for this fix

    // Generate improvement suggestions
    const improvementSuggestions = generateImprovementSuggestions(executionResult, problem, language)
    debugLog("Improvement suggestions:", improvementSuggestions)

    // Save submission to database - handle missing columns
    // Update submission insert:
    const submission = await prisma.submission.create({
      data: {
        userId,
        problemId,
        code,
        language,
        status,
        executionTime: executionResult.executionTime,
        memoryUsed: executionResult.memoryUsed,
      },
    })

    // Save solution if accepted
    // Update solution insert for accepted solutions:
    if (status === "Accepted") {
      await prisma.solution.create({
        data: {
          userId,
          problemId,
          code,
          language,
          status,
          executionTime: executionResult.executionTime,
          memoryUsed: executionResult.memoryUsed,
          xpEarned: xpEarned, // Changed from pointsEarned
          isOptimal: true,
        },
      })
    }

    // Update user statistics
    try {
      await updateUserStatistics(userId, status, problem.difficulty, xpEarned)
    } catch (error) {
      console.error("Error updating user statistics:", error)
      // Non-critical error, continue
    }

    // Update leaderboard rankings
    try {
      await updateLeaderboardRankings()
    } catch (error) {
      console.error("Error updating leaderboard rankings:", error)
      // Non-critical error, continue
    }

    debugLog("Submission successful")

    return {
      success: true,
      submission: submission,
      executionResult,
      pointsEarned: xpEarned,
      improvementSuggestions,
    }
  } catch (error) {
    console.error("Submission error:", error)
    return {
      success: false,
      message: `Failed to submit solution: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

// Update user statistics
async function updateUserStatistics(
  userId: string,
  status: string,
  difficulty: string,
  xpEarned: number,
): Promise<void> {
  debugLog("Updating user statistics for user:", userId, "status:", status, "points:", xpEarned)

  const supabase = createServerSupabaseClient()
  const now = new Date()
  const today = now.toISOString().split("T")[0]

  // Get current user statistics
  // Replace Supabase queries with Prisma:
  const stats = await prisma.userStatistics.findUnique({
    where: { userId },
  })

  if (!stats) {
    await prisma.userStatistics.create({
      data: {
        userId,
        problemsSolved: status === "Accepted" ? 1 : 0,
        totalSubmissions: 1,
        acceptedSubmissions: status === "Accepted" ? 1 : 0,
        wrongSubmissions: status === "Wrong Answer" ? 1 : 0,
        compilationErrors: status === "Compilation Error" ? 1 : 0,
        runtimeErrors: status === "Runtime Error" ? 1 : 0,
        timeLimitExceeded: status === "Time Limit Exceeded" ? 1 : 0,
        easySolved: status === "Accepted" && difficulty === "easy" ? 1 : 0,
        mediumSolved: status === "Accepted" && difficulty === "medium" ? 1 : 0,
        hardSolved: status === "Accepted" && difficulty === "hard" ? 1 : 0,
        totalXp: xpEarned, // Changed from totalPoints
        streak: 1,
        lastSolvedDate: new Date(),
      },
    })
    return
  } else {
    // Update existing stats
    await prisma.userStatistics.update({
      where: { userId },
      data: {
        totalSubmissions: (stats.totalSubmissions || 0) + 1,
        acceptedSubmissions: (stats.acceptedSubmissions || 0) + 1,
        wrongSubmissions: (stats.wrongSubmissions || 0) + 1,
        compilationErrors: (stats.compilationErrors || 0) + 1,
        runtimeErrors: (stats.runtimeErrors || 0) + 1,
        timeLimitExceeded: (stats.timeLimitExceeded || 0) + 1,
        easySolved:
          status === "Accepted" && difficulty === "easy" ? (stats.easySolved || 0) + 1 : stats.easySolved || 0,
        mediumSolved:
          status === "Accepted" && difficulty === "medium" ? (stats.mediumSolved || 0) + 1 : stats.mediumSolved || 0,
        hardSolved:
          status === "Accepted" && difficulty === "hard" ? (stats.hardSolved || 0) + 1 : stats.hardSolved || 0,
        totalXp: (stats.totalXp || 0) + xpEarned, // Changed from totalPoints
        streak: (stats.streak || 0) + 1,
        lastSolvedDate: new Date(),
      },
    })
  }
}

// Generate improvement suggestions based on execution results
function generateImprovementSuggestions(executionResult: ExecutionResult, problem: any, language: string): string[] {
  const suggestions: string[] = []

  // If all tests passed but solution is not optimal
  if (executionResult.success && executionResult.timeComplexity !== problem.time_complexity) {
    suggestions.push(
      `Your solution works correctly, but could be optimized to ${problem.time_complexity} time complexity.`,
    )

    // Add language-specific optimization tips
    if (language === "javascript") {
      suggestions.push("Consider using hash maps (Objects or Maps) for O(1) lookups instead of nested loops.")
    } else if (language === "python") {
      suggestions.push("Consider using dictionaries for O(1) lookups instead of nested loops.")
    } else if (language === "java") {
      suggestions.push("Consider using HashMaps for O(1) lookups instead of nested loops.")
    } else if (language === "cpp") {
      suggestions.push("Consider using unordered_map for O(1) lookups instead of nested loops.")
    }
  }

  // If some tests failed
  if (!executionResult.success) {
    // Check for common error patterns
    const failedTests = executionResult.testCaseResults.filter((r) => !r.passed)

    // Check for edge cases
    const hasEmptyArrayFailures = failedTests.some(
      (t) => t.input.includes("[]") || t.input.includes("{}") || t.input.includes("''") || t.input.includes('""'),
    )

    if (hasEmptyArrayFailures) {
      suggestions.push("Check how your code handles empty arrays or collections.")
    }

    // Check for off-by-one errors
    const hasOffByOneErrors = failedTests.some(
      (t) => t.diff && (t.diff.includes("off by 1") || t.diff.includes("index") || t.diff.includes("boundary")),
    )

    if (hasOffByOneErrors) {
      suggestions.push("Check for off-by-one errors in your array indexing or loop conditions.")
    }
  }

  // Add general suggestions if list is empty
  if (suggestions.length === 0) {
    suggestions.push("Keep practicing to improve your problem-solving skills!")
    suggestions.push("Try solving this problem using a different approach or algorithm.")
  }

  return suggestions
}

// Get supported languages
export async function getSupportedLanguages(): Promise<any[]> {
  const supabase = createServerSupabaseClient()
  try {
    // const { data } = await supabase
    //   .from("problem_languages")
    //   .select("*")
    //   .eq("is_active", true)
    //   .order("id", { ascending: true })
    const languages = await prisma.problemLanguage.findMany({
      where: { isActive: true },
      orderBy: { id: "asc" },
    })

    return languages || []
  } catch (error) {
    console.error("Error fetching supported languages:", error)
    // Return default languages if database query fails
    return [
      { id: 1, name: "javascript", display_name: "JavaScript", version: "ES2020", is_active: true },
      { id: 2, name: "python", display_name: "Python", version: "3.10", is_active: true },
      { id: 3, name: "java", display_name: "Java", version: "17", is_active: true },
      { id: 4, name: "cpp", display_name: "C++", version: "17", is_active: true },
    ]
  }
}

// Get user's solution for a problem
export async function getUserSolution(userId: string, problemId: number): Promise<any> {
  const supabase = createServerSupabaseClient()
  try {
    // const { data } = await supabase
    //   .from("solutions")
    //   .select("*")
    //   .eq("user_id", userId)
    //   .eq("problem_id", problemId)
    //   .order("created_at", { ascending: false })
    //   .limit(1)
    //   .single()
    const solution = await prisma.solution.findFirst({
      where: { userId, problemId },
      orderBy: { createdAt: "desc" },
    })

    return solution
  } catch (error) {
    console.error("Error fetching user solution:", error)
    return null
  }
}

// Get language-specific keywords and functions for autocomplete
export async function getLanguageKeywords(language: string): Promise<string[]> {
  debugLog("Getting keywords for language:", language)

  // In a real implementation, this would come from a database
  // For this demo, we'll return a static list

  switch (language) {
    case "javascript":
      return [
        "function",
        "return",
        "const",
        "let",
        "var",
        "if",
        "else",
        "for",
        "while",
        "switch",
        "case",
        "break",
        "continue",
        "try",
        "catch",
        "throw",
        "new",
        "this",
        "class",
        "extends",
        "Map",
        "Set",
        "Array",
        "Object",
        "String",
        "Number",
        "Boolean",
        "null",
        "undefined",
        "parseInt",
        "parseFloat",
        "Math.max",
        "Math.min",
        "Math.floor",
        "Math.ceil",
        "Math.round",
        "Array.isArray",
        "Object.keys",
        "Object.values",
        "JSON.stringify",
        "JSON.parse",
        "map",
        "filter",
        "reduce",
        "forEach",
        "find",
        "some",
        "every",
        "includes",
        "indexOf",
      ]
    case "python":
      return [
        "def",
        "return",
        "if",
        "elif",
        "else",
        "for",
        "while",
        "in",
        "not",
        "is",
        "and",
        "or",
        "try",
        "except",
        "finally",
        "raise",
        "with",
        "as",
        "import",
        "from",
        "class",
        "self",
        "list",
        "dict",
        "set",
        "tuple",
        "str",
        "int",
        "float",
        "bool",
        "None",
        "True",
        "False",
        "len",
        "range",
        "enumerate",
        "zip",
        "map",
        "filter",
        "sorted",
        "reversed",
        "sum",
        "min",
        "max",
        "append",
        "extend",
        "insert",
        "remove",
        "pop",
        "clear",
        "index",
        "count",
        "sort",
        "keys",
        "values",
        "items",
      ]
    case "java":
      return [
        "public",
        "private",
        "protected",
        "static",
        "final",
        "void",
        "int",
        "long",
        "double",
        "float",
        "boolean",
        "char",
        "String",
        "class",
        "interface",
        "extends",
        "implements",
        "new",
        "this",
        "super",
        "if",
        "else",
        "for",
        "while",
        "do",
        "switch",
        "case",
        "break",
        "continue",
        "return",
        "try",
        "catch",
        "throw",
        "throws",
        "finally",
        "import",
        "package",
        "null",
        "true",
        "false",
        "ArrayList",
        "HashMap",
        "HashSet",
        "LinkedList",
        "Arrays",
        "Collections",
        "Math",
        "System",
        "add",
        "remove",
        "get",
        "set",
        "size",
        "isEmpty",
        "contains",
        "put",
        "containsKey",
        "length",
      ]
    case "cpp":
      return [
        "int",
        "long",
        "double",
        "float",
        "char",
        "bool",
        "void",
        "auto",
        "const",
        "static",
        "struct",
        "class",
        "namespace",
        "template",
        "typename",
        "public",
        "private",
        "protected",
        "if",
        "else",
        "for",
        "while",
        "do",
        "switch",
        "case",
        "break",
        "continue",
        "return",
        "try",
        "catch",
        "throw",
        "new",
        "delete",
        "this",
        "nullptr",
        "true",
        "false",
        "vector",
        "map",
        "unordered_map",
        "set",
        "unordered_set",
        "queue",
        "stack",
        "pair",
        "string",
        "push_back",
        "pop_back",
        "front",
        "back",
        "size",
        "empty",
        "begin",
        "end",
        "find",
        "insert",
        "erase",
      ]
    default:
      return []
  }
}

// Get common algorithms and data structures for the given problem type
export async function getProblemHints(problemId: number): Promise<string[]> {
  debugLog("Getting hints for problem:", problemId)

  const supabase = createServerSupabaseClient()

  try {
    // Get problem details
    const { data: problem } = await supabase.from("problems").select("code, difficulty").eq("id", problemId).single()

    if (!problem) return []

    // Generate hints based on problem type
    const hints: string[] = []

    if (problem.code === "two-sum") {
      hints.push("Consider using a hash map to store values you've seen so far")
      hints.push("For each number, check if target - number exists in your hash map")
      hints.push("Remember that array indices are 0-based")
      hints.push("Be careful not to use the same element twice")
    } else {
      // Generic hints
      hints.push("Break down the problem into smaller steps")
      hints.push("Consider edge cases like empty inputs or boundary conditions")
      hints.push("Think about the time and space complexity of your solution")
    }

    // Add difficulty-specific hints
    if (problem.difficulty === "easy") {
      hints.push("Focus on a straightforward approach first")
    } else if (problem.difficulty === "medium") {
      hints.push("Consider optimizing your solution after getting a working version")
    } else if (problem.difficulty === "hard") {
      hints.push("This problem might require multiple techniques or a non-obvious approach")
    }

    return hints
  } catch (error) {
    console.error("Error fetching problem hints:", error)
    return [
      "Consider using a hash map for O(1) lookups",
      "Break down the problem into smaller steps",
      "Test your solution with edge cases",
    ]
  }
}

// Update leaderboard rankings
export async function updateLeaderboardRankings(): Promise<void> {
  debugLog("Updating leaderboard rankings")

  // const supabase = createServerSupabaseClient()

  // try {
  //   // Get all users ordered by total points
  //   const { data: users, error } = await supabase
  //     .from("user_statistics")
  //     .select("user_id, total_points")
  //     .order("total_points", { ascending: false })

  //   if (error) {
  //     console.error("Error fetching users for leaderboard:", error)
  //     return
  //   }

  //   if (!users || users.length === 0) {
  //     debugLog("No users found for leaderboard")
  //     return
  //   }

  //   debugLog(`Updating ranks for ${users.length} users`)

  //   // Update rank for each user
  //   for (let i = 0; i < users.length; i++) {
  //     const { error: updateError } = await supabase
  //       .from("user_statistics")
  //       .update({ rank: i + 1 })
  //       .eq("user_id", users[i].user_id)

  //     if (updateError) {
  //       console.error(`Error updating rank for user ${users[i].user_id}:`, updateError)
  //     }
  //   }

  //   debugLog("Leaderboard rankings updated successfully")
  // } catch (error) {
  //   console.error("Error updating leaderboard rankings:", error)
  // }
  const users = await prisma.userStatistics.findMany({
    select: { userId: true, totalXp: true }, // Changed from totalPoints
    orderBy: { totalXp: "desc" }, // Changed from totalPoints
  })

  // Update ranks
  for (let i = 0; i < users.length; i++) {
    await prisma.userStatistics.update({
      where: { userId: users[i].userId },
      data: { rank: i + 1 },
    })
  }
}
