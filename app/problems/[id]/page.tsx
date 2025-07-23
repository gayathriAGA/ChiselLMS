import { createServerSupabaseClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import CodeEditor from "@/components/code-editor"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronLeft, ChevronRight, Info, Clock, Award, Users, BarChart } from "lucide-react"
import Link from "next/link"

export const revalidate = 3600 // Revalidate at most every hour

export default async function ProblemPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient()

  // Fetch problem details
  const { data: problem, error } = await supabase.from("problems").select("*").eq("id", params.id).single()

  if (error || !problem) {
    notFound()
  }

  // Fetch test cases
  const { data: testCases } = await supabase
    .from("test_cases")
    .select("*")
    .eq("problem_id", problem.id)
    .eq("is_sample", true)

  // Fetch problem topics
  const { data: problemTopics } = await supabase
    .from("problem_topics")
    .select(`
      topics:topic_id (
        id,
        name
      )
    `)
    .eq("problem_id", problem.id)

  // Fetch next and previous problems
  const { data: nextProblem } = await supabase
    .from("problems")
    .select("id, title")
    .eq("is_active", true)
    .gt("id", problem.id)
    .order("id", { ascending: true })
    .limit(1)
    .single()

  const { data: prevProblem } = await supabase
    .from("problems")
    .select("id, title")
    .eq("is_active", true)
    .lt("id", problem.id)
    .order("id", { ascending: false })
    .limit(1)
    .single()

  // Default starter code templates
  const starterCodeTemplates = {
    javascript: `function solution(nums, target) {
  // Create a map to store values and their indices
  const map = new Map();
  
  // Iterate through the array
  for (let i = 0; i < nums.length; i++) {
    // Calculate the complement
    const complement = target - nums[i];
    
    // Check if the complement exists in the map
    if (map.has(complement)) {
      // Return the indices of the two numbers
      return [map.get(complement), i];
    }
    
    // Store the current number and its index
    map.set(nums[i], i);
  }
  
  // No solution found
  return [];
}

// Example usage:
// const result = solution([2, 7, 11, 15], 9);
// console.log(result);`,
    python: `def solution(nums, target):
    # Create a dictionary to store values and their indices
    num_map = {}
    
    # Iterate through the array
    for i, num in enumerate(nums):
        # Calculate the complement
        complement = target - num
        
        # Check if the complement exists in the map
        if complement in num_map:
            # Return the indices of the two numbers
            return [num_map[complement], i]
        
        # Store the current number and its index
        num_map[num] = i
    
    # No solution found
    return []

# Example usage:
# result = solution([2, 7, 11, 15], 9)
# print(result)`,
    java: `import java.util.HashMap;
import java.util.Map;

public class Solution {
    public static int[] solution(int[] nums, int target) {
        // Create a map to store values and their indices
        Map<Integer, Integer> map = new HashMap<>();
        
        // Iterate through the array
        for (int i = 0; i < nums.length; i++) {
            // Calculate the complement
            int complement = target - nums[i];
            
            // Check if the complement exists in the map
            if (map.containsKey(complement)) {
                // Return the indices of the two numbers
                return new int[] { map.get(complement), i };
            }
            
            // Store the current number and its index
            map.put(nums[i], i);
        }
        
        // No solution found
        return new int[0];
    }
    
    public static void main(String[] args) {
        // Example usage
        // int[] result = solution(new int[] {2, 7, 11, 15}, 9);
        // System.out.println("[" + result[0] + ", " + result[1] + "]");
    }
}`,
    cpp: `#include <vector>
#include <unordered_map>
#include <iostream>

std::vector<int> solution(std::vector<int>& nums, int target) {
    // Create a map to store values and their indices
    std::unordered_map<int, int> map;
    
    // Iterate through the array
    for (int i = 0; i < nums.size(); i++) {
        // Calculate the complement
        int complement = target - nums[i];
        
        // Check if the complement exists in the map
        if (map.find(complement) != map.end()) {
            // Return the indices of the two numbers
            return {map[complement], i};
        }
        
        // Store the current number and its index
        map[nums[i]] = i;
    }
    
    // No solution found
    return {};
}

int main() {
    // Example usage
    // std::vector<int> nums = {2, 7, 11, 15};
    // int target = 9;
    // std::vector<int> result = solution(nums, target);
    // std::cout << "[" << result[0] << ", " << result[1] << "]" << std::endl;
    // return 0;
}`,
    rust: `use std::collections::HashMap;

fn solution(nums: Vec<i32>, target: i32) -> Vec<i32> {
    // Create a map to store values and their indices
    let mut map = HashMap::new();
    
    // Iterate through the array
    for (i, &num) in nums.iter().enumerate() {
        // Calculate the complement
        let complement = target - num;
        
        // Check if the complement exists in the map
        if let Some(&j) = map.get(&complement) {
            // Return the indices of the two numbers
            return vec![j as i32, i as i32];
        }
        
        // Store the current number and its index
        map.insert(num, i);
    }
    
    // No solution found
    vec![]
}

fn main() {
    // Example usage
    // let nums = vec![2, 7, 11, 15];
    // let target = 9;
    // let result = solution(nums, target);
    // println!("{:?}", result);
}`,
  }

  // Format success rate as percentage
  const successRate = problem.success_rate ? Math.round(problem.success_rate * 100) : 0

  return (
    <div className="container py-6">
      <div className="flex flex-col space-y-6">
        {/* Problem header */}
        <div className="flex flex-col space-y-2">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">{problem.title}</h1>
            <Badge
              className={
                problem.difficulty === "easy"
                  ? "bg-green-500"
                  : problem.difficulty === "medium"
                    ? "bg-yellow-500"
                    : "bg-red-500"
              }
            >
              {problem.difficulty}
            </Badge>
          </div>
          <div className="flex flex-wrap gap-2">
            {problem.tags?.map((tag: string, index: number) => (
              <Badge key={index} variant="outline">
                {tag}
              </Badge>
            ))}
            {problemTopics?.map((topic, index) => (
              <Badge key={index} variant="secondary">
                {topic.topics.name}
              </Badge>
            ))}
          </div>

          {/* Problem stats */}
          <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
            <div className="flex items-center">
              <Award className="h-4 w-4 mr-1" />
              <span>{problem.points} points</span>
            </div>
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-1" />
              <span>{problem.total_submissions || 0} submissions</span>
            </div>
            <div className="flex items-center">
              <BarChart className="h-4 w-4 mr-1" />
              <span>{successRate}% success rate</span>
            </div>
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              <span>{problem.time_limit ? `${problem.time_limit}ms` : "N/A"} time limit</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Problem description */}
          <div className="flex flex-col space-y-6">
            <Tabs defaultValue="description">
              <TabsList>
                <TabsTrigger value="description">Description</TabsTrigger>
                <TabsTrigger value="hints">Hints</TabsTrigger>
                {problem.editorial && <TabsTrigger value="editorial">Editorial</TabsTrigger>}
              </TabsList>
              <TabsContent value="description" className="space-y-4">
                <div className="prose dark:prose-invert max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: problem.description }} />
                </div>

                {problem.constraints && (
                  <div>
                    <h3 className="text-lg font-semibold">Constraints</h3>
                    <div className="prose dark:prose-invert max-w-none">
                      <div dangerouslySetInnerHTML={{ __html: problem.constraints }} />
                    </div>
                  </div>
                )}

                {problem.input_format && (
                  <div>
                    <h3 className="text-lg font-semibold">Input Format</h3>
                    <div className="prose dark:prose-invert max-w-none">
                      <div dangerouslySetInnerHTML={{ __html: problem.input_format }} />
                    </div>
                  </div>
                )}

                {problem.output_format && (
                  <div>
                    <h3 className="text-lg font-semibold">Output Format</h3>
                    <div className="prose dark:prose-invert max-w-none">
                      <div dangerouslySetInnerHTML={{ __html: problem.output_format }} />
                    </div>
                  </div>
                )}

                {(problem.sample_input || problem.sample_output) && (
                  <div>
                    <h3 className="text-lg font-semibold">Examples</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {problem.sample_input && (
                        <Card>
                          <CardContent className="p-4">
                            <h4 className="font-medium mb-2">Input</h4>
                            <pre className="bg-muted p-2 rounded-md overflow-x-auto">
                              <code>{problem.sample_input}</code>
                            </pre>
                          </CardContent>
                        </Card>
                      )}
                      {problem.sample_output && (
                        <Card>
                          <CardContent className="p-4">
                            <h4 className="font-medium mb-2">Output</h4>
                            <pre className="bg-muted p-2 rounded-md overflow-x-auto">
                              <code>{problem.sample_output}</code>
                            </pre>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </div>
                )}

                {testCases && testCases.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold">Test Cases</h3>
                    <div className="space-y-4">
                      {testCases.map((testCase, index) => (
                        <div key={testCase.id} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Card>
                            <CardContent className="p-4">
                              <h4 className="font-medium mb-2">Input {index + 1}</h4>
                              <pre className="bg-muted p-2 rounded-md overflow-x-auto">
                                <code>{testCase.input}</code>
                              </pre>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="p-4">
                              <h4 className="font-medium mb-2">Expected Output {index + 1}</h4>
                              <pre className="bg-muted p-2 rounded-md overflow-x-auto">
                                <code>{testCase.expected_output}</code>
                              </pre>
                            </CardContent>
                          </Card>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {problem.explanation && (
                  <div>
                    <h3 className="text-lg font-semibold">Explanation</h3>
                    <div className="prose dark:prose-invert max-w-none">
                      <div dangerouslySetInnerHTML={{ __html: problem.explanation }} />
                    </div>
                  </div>
                )}

                {(problem.time_complexity || problem.space_complexity) && (
                  <div>
                    <h3 className="text-lg font-semibold">Expected Complexity</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {problem.time_complexity && (
                        <div>
                          <h4 className="font-medium">Time Complexity</h4>
                          <p className="text-muted-foreground">{problem.time_complexity}</p>
                        </div>
                      )}
                      {problem.space_complexity && (
                        <div>
                          <h4 className="font-medium">Space Complexity</h4>
                          <p className="text-muted-foreground">{problem.space_complexity}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="hints">
                {problem.hints && problem.hints.length > 0 ? (
                  <div className="space-y-4">
                    {problem.hints.map((hint: string, index: number) => (
                      <Card key={index}>
                        <CardContent className="p-4 flex items-start gap-2">
                          <Info className="h-5 w-5 text-primary mt-0.5" />
                          <div>
                            <h3 className="font-medium">Hint {index + 1}</h3>
                            <p>{hint}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No hints available for this problem.</p>
                  </div>
                )}
              </TabsContent>

              {problem.editorial && (
                <TabsContent value="editorial">
                  <div className="prose dark:prose-invert max-w-none">
                    <div dangerouslySetInnerHTML={{ __html: problem.editorial }} />
                  </div>
                </TabsContent>
              )}
            </Tabs>

            {/* Navigation buttons */}
            <div className="flex justify-between">
              {prevProblem ? (
                <Button variant="outline" asChild>
                  <Link href={`/problems/${prevProblem.id}`}>
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Previous
                  </Link>
                </Button>
              ) : (
                <Button variant="outline" disabled>
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Previous
                </Button>
              )}

              {nextProblem ? (
                <Button variant="outline" asChild>
                  <Link href={`/problems/${nextProblem.id}`}>
                    Next
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              ) : (
                <Button variant="outline" disabled>
                  Next
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Code editor */}
          <div className="flex flex-col space-y-4">
            <CodeEditor problemId={problem.id} starterCodeTemplates={starterCodeTemplates} />
          </div>
        </div>
      </div>
    </div>
  )
}
