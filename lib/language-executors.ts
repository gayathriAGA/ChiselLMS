/**
 * Enhanced language-specific code execution logic
 */

// Debug flag - set to true to enable detailed logging
const DEBUG = true

// Log function that only logs when DEBUG is true
function debugLog(...args: any[]) {
  if (DEBUG) {
    console.log("[Executor]", ...args)
  }
}

// JavaScript/Node.js executor
export function executeJavaScript(
  code: string,
  input: string,
  problemType: string,
): { output: string; error?: string } {
  debugLog("Executing JavaScript code for problem type:", problemType)
  debugLog("Input:", input)

  try {
    // In a real implementation, this would be done in a secure sandbox
    // For this demo, we'll simulate execution

    // Parse input based on problem type
    const parsedInput = parseInput(input, problemType)
    debugLog("Parsed input:", parsedInput)

    // Prepare a simulated execution environment
    let output = ""
    const consoleLogs: string[] = []

    // Check if the code is just a simple print statement (for debugging the validation system)
    if (code.trim().startsWith("console.log") || code.trim().startsWith("print")) {
      // Extract what's being printed
      const printMatch =
        code.match(/console\.log\s*$$\s*['"](.*)['"].*$$/) || code.match(/print\s*$$\s*['"](.*)['"].*$$/)

      if (printMatch) {
        output = printMatch[1]
        debugLog("Simple print detected, output:", output)
        return { output: `> ${output}` }
      }
    }

    // Simulate execution based on problem type
    if (problemType === "two-sum") {
      debugLog("Executing Two Sum problem")

      // For Two Sum, we need to extract the array and target
      let nums, target

      if (typeof parsedInput === "object" && parsedInput.nums && parsedInput.target) {
        nums = parsedInput.nums
        target = parsedInput.target
      } else {
        // Try to parse from the raw input
        const lines = input.trim().split("\n")
        try {
          nums = JSON.parse(lines[0])
          target = Number.parseInt(lines[1])
        } catch (e) {
          debugLog("Error parsing input:", e)
          return { output: "", error: "Invalid input format" }
        }
      }

      debugLog("Nums:", nums, "Target:", target)

      // Check if the code contains a function definition
      const hasFunctionDefinition = code.includes("function") || code.includes("=>")

      // If it's just a print statement with array-like output, extract it
      const printArrayMatch =
        code.match(/console\.log\s*$$\s*\[(.*)\]\s*$$/) || code.match(/print\s*$$\s*\[(.*)\]\s*$$/)

      if (printArrayMatch) {
        const arrayContent = printArrayMatch[1].split(",").map((s) => Number.parseInt(s.trim()))
        output = JSON.stringify(arrayContent)
        debugLog("Print array detected, output:", output)
        return { output }
      }

      // For demo purposes, generate a plausible output
      // In a real implementation, we would execute the actual code

      // Randomly decide if we'll return a correct or incorrect answer
      const returnCorrectAnswer = Math.random() > 0.3 // 70% chance of correct answer

      if (returnCorrectAnswer) {
        // Find the correct answer
        for (let i = 0; i < nums.length; i++) {
          for (let j = i + 1; j < nums.length; j++) {
            if (nums[i] + nums[j] === target) {
              output = JSON.stringify([i, j])
              debugLog("Correct answer:", output)
              return { output }
            }
          }
        }
      } else {
        // Generate a plausible but incorrect answer
        const i = Math.floor(Math.random() * nums.length)
        let j = Math.floor(Math.random() * nums.length)
        while (j === i) {
          j = Math.floor(Math.random() * nums.length)
        }
        output = JSON.stringify([i, j])
        debugLog("Incorrect answer:", output)
        return { output }
      }

      // If we couldn't find a solution
      return { output: "[]", error: "No solution found" }
    } else {
      // Generic simulation
      debugLog("Generic execution")
      output = "Execution completed successfully"
      return { output }
    }
  } catch (error) {
    debugLog("Execution error:", error)
    return {
      output: "",
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

// Python executor
export function executePython(code: string, input: string, problemType: string): { output: string; error?: string } {
  debugLog("Executing Python code for problem type:", problemType)
  debugLog("Input:", input)

  try {
    // In a real implementation, this would be done in a secure sandbox
    // For this demo, we'll simulate execution

    // Parse input based on problem type
    const parsedInput = parseInput(input, problemType)
    debugLog("Parsed input:", parsedInput)

    // Check if the code is just a simple print statement (for debugging the validation system)
    if (code.trim().startsWith("print")) {
      // Extract what's being printed
      const printMatch = code.match(/print\s*$$\s*['"](.*)['"].*$$/)

      if (printMatch) {
        const output = printMatch[1]
        debugLog("Simple print detected, output:", output)
        return { output: `> ${output}` }
      }

      // Check for print with array-like output
      const printArrayMatch = code.match(/print\s*$$\s*\[(.*)\]\s*$$/)

      if (printArrayMatch) {
        const arrayContent = printArrayMatch[1].split(",").map((s) => Number.parseInt(s.trim()))
        const output = JSON.stringify(arrayContent)
        debugLog("Print array detected, output:", output)
        return { output }
      }
    }

    // Simulate execution based on problem type
    if (problemType === "two-sum") {
      debugLog("Executing Two Sum problem")

      // For Two Sum, we need to extract the array and target
      let nums, target

      if (typeof parsedInput === "object" && parsedInput.nums && parsedInput.target) {
        nums = parsedInput.nums
        target = parsedInput.target
      } else {
        // Try to parse from the raw input
        const lines = input.trim().split("\n")
        try {
          nums = JSON.parse(lines[0])
          target = Number.parseInt(lines[1])
        } catch (e) {
          debugLog("Error parsing input:", e)
          return { output: "", error: "Invalid input format" }
        }
      }

      debugLog("Nums:", nums, "Target:", target)

      // For demo purposes, generate a plausible output
      // In a real implementation, we would execute the actual code

      // Randomly decide if we'll return a correct or incorrect answer
      const returnCorrectAnswer = Math.random() > 0.3 // 70% chance of correct answer

      if (returnCorrectAnswer) {
        // Find the correct answer
        for (let i = 0; i < nums.length; i++) {
          for (let j = i + 1; j < nums.length; j++) {
            if (nums[i] + nums[j] === target) {
              const output = JSON.stringify([i, j])
              debugLog("Correct answer:", output)
              return { output }
            }
          }
        }
      } else {
        // Generate a plausible but incorrect answer
        const i = Math.floor(Math.random() * nums.length)
        let j = Math.floor(Math.random() * nums.length)
        while (j === i) {
          j = Math.floor(Math.random() * nums.length)
        }
        const output = JSON.stringify([i, j])
        debugLog("Incorrect answer:", output)
        return { output }
      }

      // If we couldn't find a solution
      return { output: "[]", error: "No solution found" }
    } else {
      // Generic simulation
      debugLog("Generic execution")
      return { output: "Execution completed successfully" }
    }
  } catch (error) {
    debugLog("Execution error:", error)
    return {
      output: "",
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

// Java executor
export function executeJava(code: string, input: string, problemType: string): { output: string; error?: string } {
  debugLog("Executing Java code for problem type:", problemType)
  debugLog("Input:", input)

  try {
    // In a real implementation, this would compile and execute Java code
    // For this demo, we'll simulate execution

    // Check for compilation errors
    if (!code.includes("class") || !code.includes("public static void main")) {
      debugLog("Java compilation error: missing main method")
      return {
        output: "",
        error: "Compilation error: Missing class definition or main method",
      }
    }

    // Parse input based on problem type
    const parsedInput = parseInput(input, problemType)
    debugLog("Parsed input:", parsedInput)

    // Simulate execution based on problem type
    if (problemType === "two-sum") {
      debugLog("Executing Two Sum problem")

      // For Two Sum, we need to extract the array and target
      let nums, target

      if (typeof parsedInput === "object" && parsedInput.nums && parsedInput.target) {
        nums = parsedInput.nums
        target = parsedInput.target
      } else {
        // Try to parse from the raw input
        const lines = input.trim().split("\n")
        try {
          nums = JSON.parse(lines[0])
          target = Number.parseInt(lines[1])
        } catch (e) {
          debugLog("Error parsing input:", e)
          return { output: "", error: "Invalid input format" }
        }
      }

      debugLog("Nums:", nums, "Target:", target)

      // For demo purposes, generate a plausible output
      // In a real implementation, we would execute the actual code

      // Randomly decide if we'll return a correct or incorrect answer
      const returnCorrectAnswer = Math.random() > 0.3 // 70% chance of correct answer

      if (returnCorrectAnswer) {
        // Find the correct answer
        for (let i = 0; i < nums.length; i++) {
          for (let j = i + 1; j < nums.length; j++) {
            if (nums[i] + nums[j] === target) {
              const output = JSON.stringify([i, j])
              debugLog("Correct answer:", output)
              return { output }
            }
          }
        }
      } else {
        // Generate a plausible but incorrect answer
        const i = Math.floor(Math.random() * nums.length)
        let j = Math.floor(Math.random() * nums.length)
        while (j === i) {
          j = Math.floor(Math.random() * nums.length)
        }
        const output = JSON.stringify([i, j])
        debugLog("Incorrect answer:", output)
        return { output }
      }

      // If we couldn't find a solution
      return { output: "[]", error: "No solution found" }
    } else {
      // Generic simulation
      debugLog("Generic execution")
      return { output: "Execution completed successfully" }
    }
  } catch (error) {
    debugLog("Execution error:", error)
    return {
      output: "",
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

// C++ executor
export function executeCpp(code: string, input: string, problemType: string): { output: string; error?: string } {
  debugLog("Executing C++ code for problem type:", problemType)
  debugLog("Input:", input)

  try {
    // In a real implementation, this would compile and execute C++ code
    // For this demo, we'll simulate execution

    // Check for compilation errors
    if (!code.includes("main(") && !code.includes("main (")) {
      debugLog("C++ compilation error: missing main function")
      return {
        output: "",
        error: "Compilation error: Missing main function",
      }
    }

    // Parse input based on problem type
    const parsedInput = parseInput(input, problemType)
    debugLog("Parsed input:", parsedInput)

    // Simulate execution based on problem type
    if (problemType === "two-sum") {
      debugLog("Executing Two Sum problem")

      // For Two Sum, we need to extract the array and target
      let nums, target

      if (typeof parsedInput === "object" && parsedInput.nums && parsedInput.target) {
        nums = parsedInput.nums
        target = parsedInput.target
      } else {
        // Try to parse from the raw input
        const lines = input.trim().split("\n")
        try {
          nums = JSON.parse(lines[0])
          target = Number.parseInt(lines[1])
        } catch (e) {
          debugLog("Error parsing input:", e)
          return { output: "", error: "Invalid input format" }
        }
      }

      debugLog("Nums:", nums, "Target:", target)

      // For demo purposes, generate a plausible output
      // In a real implementation, we would execute the actual code

      // Randomly decide if we'll return a correct or incorrect answer
      const returnCorrectAnswer = Math.random() > 0.3 // 70% chance of correct answer

      if (returnCorrectAnswer) {
        // Find the correct answer
        for (let i = 0; i < nums.length; i++) {
          for (let j = i + 1; j < nums.length; j++) {
            if (nums[i] + nums[j] === target) {
              const output = JSON.stringify([i, j])
              debugLog("Correct answer:", output)
              return { output }
            }
          }
        }
      } else {
        // Generate a plausible but incorrect answer
        const i = Math.floor(Math.random() * nums.length)
        let j = Math.floor(Math.random() * nums.length)
        while (j === i) {
          j = Math.floor(Math.random() * nums.length)
        }
        const output = JSON.stringify([i, j])
        debugLog("Incorrect answer:", output)
        return { output }
      }

      // If we couldn't find a solution
      return { output: "[]", error: "No solution found" }
    } else {
      // Generic simulation
      debugLog("Generic execution")
      return { output: "Execution completed successfully" }
    }
  } catch (error) {
    debugLog("Execution error:", error)
    return {
      output: "",
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

// Execute code in the appropriate language
export function executeCode(
  code: string,
  language: string,
  input: string,
  problemType: string,
): { output: string; error?: string } {
  debugLog("Executing code in language:", language, "problem type:", problemType)

  switch (language.toLowerCase()) {
    case "javascript":
      return executeJavaScript(code, input, problemType)
    case "python":
      return executePython(code, input, problemType)
    case "java":
      return executeJava(code, input, problemType)
    case "cpp":
      return executeCpp(code, input, problemType)
    default:
      return {
        output: "",
        error: `Unsupported language: ${language}`,
      }
  }
}

// Parse input based on problem type
export function parseInput(input: string, problemType: string): any {
  debugLog("Parsing input for problem type:", problemType)

  try {
    if (problemType === "two-sum") {
      const lines = input.trim().split("\n")
      return {
        nums: JSON.parse(lines[0]),
        target: Number.parseInt(lines[1]),
      }
    }

    // Default parsing
    return input
  } catch (error) {
    debugLog("Error parsing input:", error)
    return input
  }
}

// Format output based on language and problem type
export function formatOutput(output: any, language: string, problemType: string): string {
  debugLog("Formatting output for language:", language, "problem type:", problemType)

  try {
    if (typeof output === "object") {
      return JSON.stringify(output)
    }

    return String(output)
  } catch (error) {
    debugLog("Error formatting output:", error)
    return String(output)
  }
}

// Provide a complete solution for the Two Sum problem
export function getTwoSumSolution(language: string): string {
  switch (language.toLowerCase()) {
    case "javascript":
      return `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
function twoSum(nums, target) {
    // Create a map to store values we've seen and their indices
    const seen = new Map();
    
    // Iterate through the array
    for (let i = 0; i < nums.length; i++) {
        // Calculate the complement we need to find
        const complement = target - nums[i];
        
        // Check if we've seen the complement before
        if (seen.has(complement)) {
            // Return the indices of the two numbers
            return [seen.get(complement), i];
        }
        
        // Store the current number and its index
        seen.set(nums[i], i);
    }
    
    // No solution found
    return [];
}

// Read input
const nums = JSON.parse(readline());
const target = parseInt(readline());

// Call the function and print the result
console.log(JSON.stringify(twoSum(nums, target)));`

    case "python":
      return `def two_sum(nums, target):
    """
    Find the indices of two numbers in the array that add up to the target.
    
    Args:
        nums: List of integers
        target: Integer target sum
        
    Returns:
        List of two indices
    """
    # Create a dictionary to store values we've seen and their indices
    seen = {}
    
    # Iterate through the array
    for i, num in enumerate(nums):
        # Calculate the complement we need to find
        complement = target - num
        
        # Check if we've seen the complement before
        if complement in seen:
            # Return the indices of the two numbers
            return [seen[complement], i]
        
        # Store the current number and its index
        seen[num] = i
    
    # No solution found
    return []

# Read input
import json
nums = json.loads(input())
target = int(input())

# Call the function and print the result
print(two_sum(nums, target))`

    case "java":
      return `import java.util.HashMap;
import java.util.Map;
import java.util.Scanner;

public class TwoSum {
    public static int[] twoSum(int[] nums, int target) {
        // Create a map to store values we've seen and their indices
        Map<Integer, Integer> seen = new HashMap<>();
        
        // Iterate through the array
        for (int i = 0; i < nums.length; i++) {
            // Calculate the complement we need to find
            int complement = target - nums[i];
            
            // Check if we've seen the complement before
            if (seen.containsKey(complement)) {
                // Return the indices of the two numbers
                return new int[] { seen.get(complement), i };
            }
            
            // Store the current number and its index
            seen.put(nums[i], i);
        }
        
        // No solution found
        return new int[0];
    }
    
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        
        // Read input
        String numsStr = scanner.nextLine();
        int target = Integer.parseInt(scanner.nextLine());
        
        // Parse the array
        String[] numsStrArray = numsStr.substring(1, numsStr.length() - 1).split(",");
        int[] nums = new int[numsStrArray.length];
        for (int i = 0; i < numsStrArray.length; i++) {
            nums[i] = Integer.parseInt(numsStrArray[i].trim());
        }
        
        // Call the function
        int[] result = twoSum(nums, target);
        
        // Print the result
        System.out.print("[");
        for (int i = 0; i < result.length; i++) {
            System.out.print(result[i]);
            if (i < result.length - 1) {
                System.out.print(",");
            }
        }
        System.out.println("]");
        
        scanner.close();
    }
}`

    case "cpp":
      return `#include <iostream>
#include <vector>
#include <unordered_map>
#include <string>
#include <sstream>

std::vector<int> twoSum(std::vector<int>& nums, int target) {
    // Create a map to store values we've seen and their indices
    std::unordered_map<int, int> seen;
    
    // Iterate through the array
    for (int i = 0; i < nums.size(); i++) {
        // Calculate the complement we need to find
        int complement = target - nums[i];
        
        // Check if we've seen the complement before
        if (seen.find(complement) != seen.end()) {
            // Return the indices of the two numbers
            return {seen[complement], i};
        }
        
        // Store the current number and its index
        seen[nums[i]] = i;
    }
    
    // No solution found
    return {};
}

// Helper function to parse the input array
std::vector<int> parseArray(const std::string& str) {
    std::vector<int> result;
    std::string trimmed = str.substr(1, str.length() - 2); // Remove [ and ]
    std::stringstream ss(trimmed);
    std::string item;
    
    while (std::getline(ss, item, ',')) {
        result.push_back(std::stoi(item));
    }
    
    return result;
}

int main() {
    // Read input
    std::string numsStr;
    std::getline(std::cin, numsStr);
    
    std::string targetStr;
    std::getline(std::cin, targetStr);
    
    // Parse input
    std::vector<int> nums = parseArray(numsStr);
    int target = std::stoi(targetStr);
    
    // Call the function
    std::vector<int> result = twoSum(nums, target);
    
    // Print the result
    std::cout << "[";
    for (size_t i = 0; i < result.size(); i++) {
        std::cout << result[i];
        if (i < result.size() - 1) {
            std::cout << ",";
        }
    }
    std::cout << "]" << std::endl;
    
    return 0;
}`

    default:
      return "// Language not supported"
  }
}
