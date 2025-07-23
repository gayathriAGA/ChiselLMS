"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Check, AlertTriangle } from "lucide-react"
import { useSupabase } from "@/lib/supabase/provider"
import { Progress } from "@/components/ui/progress"

export default function GenerateProblemsPage() {
  const router = useRouter()
  const { supabase, isSupabaseAvailable } = useSupabase()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentProblem, setCurrentProblem] = useState("")

  const handleGenerateProblems = async () => {
    if (!supabase) {
      toast({
        title: "Supabase not configured",
        description: "Cannot generate problems because Supabase is not configured.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    setProgress(0)

    try {
      // Get existing topics
      const { data: topics } = await supabase.from("topics").select("id, name")

      if (!topics || topics.length === 0) {
        throw new Error("No topics found. Please run the database setup first.")
      }

      // Create a mapping of topic names to IDs
      const topicMap = topics.reduce(
        (acc, topic) => {
          acc[topic.name] = topic.id
          return acc
        },
        {} as Record<string, number>,
      )

      // Generate 100 problems
      const problems = generateProblems(100)

      // Insert problems in batches to avoid timeouts
      const batchSize = 10
      const batches = Math.ceil(problems.length / batchSize)

      for (let i = 0; i < batches; i++) {
        const start = i * batchSize
        const end = Math.min(start + batchSize, problems.length)
        const batch = problems.slice(start, end)

        // Insert problems
        const { data: insertedProblems, error } = await supabase.from("problems").insert(batch).select("id, title")

        if (error) throw error

        // Update progress
        setProgress(Math.round((((i + 1) * batchSize) / problems.length) * 100))

        // Generate test cases for each problem
        for (const problem of insertedProblems) {
          setCurrentProblem(problem.title)

          // Generate 5-10 test cases per problem
          const testCaseCount = Math.floor(Math.random() * 6) + 5
          const testCases = []

          for (let j = 0; j < testCaseCount; j++) {
            testCases.push({
              problem_id: problem.id,
              input: generateTestCaseInput(problem.id),
              expected_output: generateTestCaseOutput(problem.id),
              is_sample: j < 2, // First 2 are sample test cases
              is_hidden: j >= 2, // Rest are hidden
            })
          }

          // Insert test cases
          await supabase.from("test_cases").insert(testCases)

          // Add problem topics (1-3 topics per problem)
          const problemTopics = []
          const topicCount = Math.floor(Math.random() * 3) + 1
          const availableTopics = [...topics]

          for (let j = 0; j < topicCount; j++) {
            if (availableTopics.length === 0) break

            const randomIndex = Math.floor(Math.random() * availableTopics.length)
            const topic = availableTopics.splice(randomIndex, 1)[0]

            problemTopics.push({
              problem_id: problem.id,
              topic_id: topic.id,
            })
          }

          // Insert problem topics
          if (problemTopics.length > 0) {
            await supabase.from("problem_topics").insert(problemTopics)
          }
        }
      }

      toast({
        title: "Success",
        description: "100 programming problems have been generated.",
      })

      setIsComplete(true)
      setTimeout(() => {
        router.push("/problems")
        router.refresh()
      }, 2000)
    } catch (error) {
      console.error("Error generating problems:", error)
      toast({
        title: "Error",
        description: "Failed to generate problems. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Function to generate random problems
  const generateProblems = (count: number) => {
    const difficulties = ["easy", "medium", "hard"]
    const categories = [
      "Arrays",
      "Strings",
      "Hash Tables",
      "Linked Lists",
      "Stacks",
      "Queues",
      "Trees",
      "Graphs",
      "Dynamic Programming",
      "Recursion",
      "Sorting",
      "Searching",
      "Greedy",
      "Backtracking",
      "Math",
      "Bit Manipulation",
    ]
    const problems = []

    // Problem templates
    const problemTemplates = [
      {
        title: "Two Sum",
        description:
          "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
        difficulty: "easy",
        category: "Arrays",
        tags: ["Array", "Hash Table"],
      },
      {
        title: "Reverse Linked List",
        description: "Given the head of a singly linked list, reverse the list, and return the reversed list.",
        difficulty: "easy",
        category: "Linked Lists",
        tags: ["Linked List", "Recursion"],
      },
      {
        title: "Valid Parentheses",
        description:
          "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.",
        difficulty: "easy",
        category: "Stacks",
        tags: ["String", "Stack"],
      },
      {
        title: "Maximum Subarray",
        description:
          "Given an integer array nums, find the contiguous subarray (containing at least one number) which has the largest sum and return its sum.",
        difficulty: "medium",
        category: "Dynamic Programming",
        tags: ["Array", "Divide and Conquer", "Dynamic Programming"],
      },
      {
        title: "Merge Intervals",
        description:
          "Given an array of intervals where intervals[i] = [starti, endi], merge all overlapping intervals, and return an array of the non-overlapping intervals that cover all the intervals in the input.",
        difficulty: "medium",
        category: "Arrays",
        tags: ["Array", "Sorting"],
      },
      {
        title: "LRU Cache",
        description: "Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.",
        difficulty: "medium",
        category: "Hash Tables",
        tags: ["Hash Table", "Linked List", "Design"],
      },
      {
        title: "Word Search",
        description:
          "Given an m x n grid of characters board and a string word, return true if word exists in the grid.",
        difficulty: "medium",
        category: "Backtracking",
        tags: ["Array", "Backtracking", "Matrix"],
      },
      {
        title: "Trapping Rain Water",
        description:
          "Given n non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.",
        difficulty: "hard",
        category: "Arrays",
        tags: ["Array", "Two Pointers", "Dynamic Programming", "Stack"],
      },
      {
        title: "Median of Two Sorted Arrays",
        description:
          "Given two sorted arrays nums1 and nums2 of size m and n respectively, return the median of the two sorted arrays.",
        difficulty: "hard",
        category: "Arrays",
        tags: ["Array", "Binary Search", "Divide and Conquer"],
      },
      {
        title: "Regular Expression Matching",
        description:
          "Given an input string s and a pattern p, implement regular expression matching with support for '.' and '*'.",
        difficulty: "hard",
        category: "Dynamic Programming",
        tags: ["String", "Dynamic Programming", "Recursion"],
      },
    ]

    // Generate problems
    for (let i = 0; i < count; i++) {
      // Select a random template
      const template = problemTemplates[Math.floor(Math.random() * problemTemplates.length)]

      // Generate a unique problem based on the template
      const problem = {
        title: `${template.title} ${i + 1}`,
        description: `<p>${template.description}</p><p>This is problem #${i + 1} in the series.</p>`,
        difficulty: template.difficulty,
        code: `${template.title.toLowerCase().replace(/\s+/g, "-")}-${i + 1}`,
        constraints: "<p>1 <= nums.length <= 10^5</p><p>-10^9 <= nums[i] <= 10^9</p>",
        input_format: "<p>The input format depends on the problem.</p>",
        output_format: "<p>The output format depends on the problem.</p>",
        sample_input: "Example input",
        sample_output: "Example output",
        explanation: "<p>Explanation of the example.</p>",
        solution_code: "// Solution code goes here",
        time_limit: 1000,
        memory_limit: 128,
        is_active: true,
        tags: template.tags,
        hints: ["Think about the problem carefully.", "Consider edge cases."],
        category: template.category,
        time_complexity: "O(n)",
        space_complexity: "O(n)",
        points: template.difficulty === "easy" ? 100 : template.difficulty === "medium" ? 200 : 300,
        languages: ["javascript", "python", "java", "cpp"],
      }

      problems.push(problem)
    }

    return problems
  }

  // Function to generate test case input
  const generateTestCaseInput = (problemId: number) => {
    return `[1, 2, 3, 4, 5]`
  }

  // Function to generate test case output
  const generateTestCaseOutput = (problemId: number) => {
    return `[5, 4, 3, 2, 1]`
  }

  return (
    <div className="container py-8">
      <div className="flex flex-col space-y-6 max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold">Generate Programming Problems</h1>
        <p className="text-muted-foreground">
          This will generate 100 programming problems with test cases to populate your platform.
        </p>

        <Card>
          <CardHeader>
            <CardTitle>Generate 100 Problems</CardTitle>
            <CardDescription>
              This will create a diverse set of programming problems across different difficulty levels and categories.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p>The generated problems will include:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>A mix of easy, medium, and hard difficulty levels</li>
                <li>Problems across various categories (arrays, strings, dynamic programming, etc.)</li>
                <li>5-10 test cases per problem</li>
                <li>Detailed problem descriptions and constraints</li>
                <li>Points based on difficulty level</li>
              </ul>

              {isLoading && (
                <div className="space-y-2 mt-4">
                  <div className="flex justify-between text-sm">
                    <span>Generating problems...</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                  {currentProblem && <p className="text-sm text-muted-foreground">Current: {currentProblem}</p>}
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button
              onClick={handleGenerateProblems}
              disabled={isLoading || isComplete || !isSupabaseAvailable}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Problems...
                </>
              ) : isComplete ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Problems Generated
                </>
              ) : (
                "Generate 100 Problems"
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
