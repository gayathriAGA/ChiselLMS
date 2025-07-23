"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Check, AlertTriangle } from "lucide-react"
import { useSupabase } from "@/lib/supabase/provider"

export default function AddSampleProblemsPage() {
  const router = useRouter()
  const { supabase, isSupabaseAvailable } = useSupabase()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  const handleAddSampleProblems = async () => {
    if (!supabase) {
      toast({
        title: "Supabase not configured",
        description: "Cannot add sample problems because Supabase is not configured.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // Add categories
      const categories = [
        { name: "Arrays", description: "Problems involving arrays and lists" },
        { name: "Strings", description: "String manipulation problems" },
        { name: "Dynamic Programming", description: "Problems solved using dynamic programming" },
        { name: "Graphs", description: "Graph theory problems" },
        { name: "Math", description: "Mathematical problems" },
      ]

      await supabase.from("categories").insert(categories)

      // Add sample problems
      const problems = [
        {
          title: "Two Sum",
          description: `<p>Given an array of integers <code>nums</code> and an integer <code>target</code>, return indices of the two numbers such that they add up to <code>target</code>.</p>
          <p>You may assume that each input would have exactly one solution, and you may not use the same element twice.</p>
          <p>You can return the answer in any order.</p>`,
          difficulty: "easy",
          code: "two-sum",
          constraints:
            "<p>2 <= nums.length <= 10^4</p><p>-10^9 <= nums[i] <= 10^9</p><p>-10^9 <= target <= 10^9</p><p>Only one valid answer exists.</p>",
          input_format:
            "<p>First line contains an array of integers separated by space.</p><p>Second line contains the target integer.</p>",
          output_format: "<p>Return indices of the two numbers that add up to target.</p>",
          sample_input: "[2,7,11,15]\n9",
          sample_output: "[0,1]",
          explanation: "<p>Because nums[0] + nums[1] == 9, we return [0, 1].</p>",
          solution_code:
            "function twoSum(nums, target) {\n  const map = new Map();\n  \n  for (let i = 0; i < nums.length; i++) {\n    const complement = target - nums[i];\n    \n    if (map.has(complement)) {\n      return [map.get(complement), i];\n    }\n    \n    map.set(nums[i], i);\n  }\n  \n  return [];\n}",
          time_limit: 1000,
          memory_limit: 128,
          is_active: true,
          tags: ["Array", "Hash Table"],
          hints: [
            "A really brute force way would be to search for all possible pairs of numbers.",
            "Try using a HashMap to store the elements you've seen so far.",
          ],
          category: "Arrays",
          time_complexity: "O(n)",
          space_complexity: "O(n)",
        },
        {
          title: "Valid Parentheses",
          description: `<p>Given a string <code>s</code> containing just the characters <code>'('</code>, <code>')'</code>, <code>'{'</code>, <code>'}'</code>, <code>'['</code> and <code>']'</code>, determine if the input string is valid.</p>
          <p>An input string is valid if:</p>
          <ol>
            <li>Open brackets must be closed by the same type of brackets.</li>
            <li>Open brackets must be closed in the correct order.</li>
            <li>Every close bracket has a corresponding open bracket of the same type.</li>
          </ol>`,
          difficulty: "easy",
          code: "valid-parentheses",
          constraints: "<p>1 <= s.length <= 10^4</p><p>s consists of parentheses only <code>'()[]{}'</code>.</p>",
          input_format: "<p>A string containing just the characters '(', ')', '{', '}', '[' and ']'.</p>",
          output_format: "<p>Return true if the input string is valid, otherwise return false.</p>",
          sample_input: "()[]{}",
          sample_output: "true",
          explanation: "<p>The brackets are properly matched and nested.</p>",
          solution_code:
            "function isValid(s) {\n  const stack = [];\n  const map = {\n    '(': ')',\n    '[': ']',\n    '{': '}'\n  };\n  \n  for (let i = 0; i < s.length; i++) {\n    const char = s[i];\n    \n    if (map[char]) {\n      stack.push(map[char]);\n    } else if (stack.pop() !== char) {\n      return false;\n    }\n  }\n  \n  return stack.length === 0;\n}",
          time_limit: 1000,
          memory_limit: 128,
          is_active: true,
          tags: ["String", "Stack"],
          hints: ["Think about using a stack data structure.", "The stack should contain expected closing brackets."],
          category: "Strings",
          time_complexity: "O(n)",
          space_complexity: "O(n)",
        },
        {
          title: "Fibonacci Number",
          description: `<p>The <b>Fibonacci numbers</b>, commonly denoted <code>F(n)</code> form a sequence, called the <b>Fibonacci sequence</b>, such that each number is the sum of the two preceding ones, starting from 0 and 1. That is,</p>
          <p>F(0) = 0, F(1) = 1</p>
          <p>F(n) = F(n - 1) + F(n - 2), for n > 1.</p>
          <p>Given <code>n</code>, calculate <code>F(n)</code>.</p>`,
          difficulty: "easy",
          code: "fibonacci-number",
          constraints: "<p>0 <= n <= 30</p>",
          input_format: "<p>An integer n.</p>",
          output_format: "<p>Return the nth Fibonacci number.</p>",
          sample_input: "4",
          sample_output: "3",
          explanation: "<p>F(4) = F(3) + F(2) = 2 + 1 = 3.</p>",
          solution_code:
            "function fib(n) {\n  if (n <= 1) return n;\n  \n  let a = 0;\n  let b = 1;\n  \n  for (let i = 2; i <= n; i++) {\n    const temp = a + b;\n    a = b;\n    b = temp;\n  }\n  \n  return b;\n}",
          time_limit: 1000,
          memory_limit: 128,
          is_active: true,
          tags: ["Math", "Dynamic Programming", "Recursion"],
          hints: ["Try solving it iteratively.", "You can optimize the recursive solution using memoization."],
          category: "Dynamic Programming",
          time_complexity: "O(n)",
          space_complexity: "O(1)",
        },
        {
          title: "Reverse Linked List",
          description: `<p>Given the <code>head</code> of a singly linked list, reverse the list, and return the reversed list.</p>`,
          difficulty: "medium",
          code: "reverse-linked-list",
          constraints: "<p>The number of nodes in the list is the range [0, 5000].</p><p>-5000 <= Node.val <= 5000</p>",
          input_format: "<p>A linked list represented as an array.</p>",
          output_format: "<p>Return the reversed linked list as an array.</p>",
          sample_input: "[1,2,3,4,5]",
          sample_output: "[5,4,3,2,1]",
          explanation: "<p>The linked list 1->2->3->4->5 is reversed to 5->4->3->2->1.</p>",
          solution_code:
            "function reverseList(head) {\n  let prev = null;\n  let current = head;\n  \n  while (current !== null) {\n    const next = current.next;\n    current.next = prev;\n    prev = current;\n    current = next;\n  }\n  \n  return prev;\n}",
          time_limit: 1000,
          memory_limit: 128,
          is_active: true,
          tags: ["Linked List", "Recursion"],
          hints: [
            "A linked list can be reversed iteratively or recursively.",
            "Try to visualize the reversal process.",
          ],
          category: "Linked List",
          time_complexity: "O(n)",
          space_complexity: "O(1)",
        },
        {
          title: "Maximum Subarray",
          description: `<p>Given an integer array <code>nums</code>, find the contiguous subarray (containing at least one number) which has the largest sum and return its sum.</p>
          <p>A <b>subarray</b> is a <b>contiguous</b> part of an array.</p>`,
          difficulty: "medium",
          code: "maximum-subarray",
          constraints: "<p>1 <= nums.length <= 10^5</p><p>-10^4 <= nums[i] <= 10^4</p>",
          input_format: "<p>An array of integers.</p>",
          output_format: "<p>Return the sum of the contiguous subarray with the largest sum.</p>",
          sample_input: "[-2,1,-3,4,-1,2,1,-5,4]",
          sample_output: "6",
          explanation: "<p>The contiguous subarray [4,-1,2,1] has the largest sum = 6.</p>",
          solution_code:
            "function maxSubArray(nums) {\n  let maxSum = nums[0];\n  let currentSum = nums[0];\n  \n  for (let i = 1; i < nums.length; i++) {\n    currentSum = Math.max(nums[i], currentSum + nums[i]);\n    maxSum = Math.max(maxSum, currentSum);\n  }\n  \n  return maxSum;\n}",
          time_limit: 1000,
          memory_limit: 128,
          is_active: true,
          tags: ["Array", "Divide and Conquer", "Dynamic Programming"],
          hints: ["Try using Kadane's algorithm.", "Keep track of the maximum sum ending at each position."],
          category: "Dynamic Programming",
          time_complexity: "O(n)",
          space_complexity: "O(1)",
        },
      ]

      await supabase.from("problems").insert(problems)

      // Add test cases for the problems
      const testCases = [
        {
          problem_id: 1, // Two Sum
          input: "[2,7,11,15]\n9",
          expected_output: "[0,1]",
          is_sample: true,
          is_hidden: false,
        },
        {
          problem_id: 1, // Two Sum
          input: "[3,2,4]\n6",
          expected_output: "[1,2]",
          is_sample: true,
          is_hidden: false,
        },
        {
          problem_id: 2, // Valid Parentheses
          input: "()",
          expected_output: "true",
          is_sample: true,
          is_hidden: false,
        },
        {
          problem_id: 2, // Valid Parentheses
          input: "()[]{}",
          expected_output: "true",
          is_sample: true,
          is_hidden: false,
        },
        {
          problem_id: 2, // Valid Parentheses
          input: "(]",
          expected_output: "false",
          is_sample: true,
          is_hidden: false,
        },
        {
          problem_id: 3, // Fibonacci Number
          input: "2",
          expected_output: "1",
          is_sample: true,
          is_hidden: false,
        },
        {
          problem_id: 3, // Fibonacci Number
          input: "3",
          expected_output: "2",
          is_sample: true,
          is_hidden: false,
        },
        {
          problem_id: 3, // Fibonacci Number
          input: "4",
          expected_output: "3",
          is_sample: true,
          is_hidden: false,
        },
        {
          problem_id: 4, // Reverse Linked List
          input: "[1,2,3,4,5]",
          expected_output: "[5,4,3,2,1]",
          is_sample: true,
          is_hidden: false,
        },
        {
          problem_id: 4, // Reverse Linked List
          input: "[1,2]",
          expected_output: "[2,1]",
          is_sample: true,
          is_hidden: false,
        },
        {
          problem_id: 5, // Maximum Subarray
          input: "[-2,1,-3,4,-1,2,1,-5,4]",
          expected_output: "6",
          is_sample: true,
          is_hidden: false,
        },
        {
          problem_id: 5, // Maximum Subarray
          input: "[1]",
          expected_output: "1",
          is_sample: true,
          is_hidden: false,
        },
        {
          problem_id: 5, // Maximum Subarray
          input: "[5,4,-1,7,8]",
          expected_output: "23",
          is_sample: true,
          is_hidden: false,
        },
      ]

      await supabase.from("test_cases").insert(testCases)

      toast({
        title: "Success",
        description: "Sample problems have been added to the database.",
      })

      setIsComplete(true)
      setTimeout(() => {
        router.push("/problems")
        router.refresh()
      }, 2000)
    } catch (error) {
      console.error("Error adding sample problems:", error)
      toast({
        title: "Error",
        description: "Failed to add sample problems. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container py-8">
      <div className="flex flex-col space-y-6 max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold">Add Sample Problems</h1>
        <p className="text-muted-foreground">
          This will add sample coding problems to the database to help you get started with the platform.
        </p>

        <Card>
          <CardHeader>
            <CardTitle>Sample Problems</CardTitle>
            <CardDescription>The following sample problems will be added to the database:</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-6 space-y-2">
              <li>Two Sum (Easy) - Find two numbers in an array that add up to a target</li>
              <li>Valid Parentheses (Easy) - Check if a string of brackets is valid</li>
              <li>Fibonacci Number (Easy) - Calculate the nth Fibonacci number</li>
              <li>Reverse Linked List (Medium) - Reverse a singly linked list</li>
              <li>Maximum Subarray (Medium) - Find the contiguous subarray with the largest sum</li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button
              onClick={handleAddSampleProblems}
              disabled={isLoading || isComplete || !isSupabaseAvailable}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding Sample Problems...
                </>
              ) : isComplete ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Sample Problems Added
                </>
              ) : (
                "Add Sample Problems"
              )}
            </Button>
          </CardFooter>
        </Card>

        {!isSupabaseAvailable && (
          <Card className="border-yellow-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                Supabase Not Configured
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>Supabase is not properly configured. Please make sure the environment variables are set correctly.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
