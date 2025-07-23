import { createServerSupabaseClient } from "@/lib/supabase/server"
import ProblemsList from "@/components/problems-list"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { AlertTriangle } from "lucide-react"

export const revalidate = 3600 // Revalidate at most every hour

export default async function ProblemsPage({
  searchParams,
}: {
  searchParams: { difficulty?: string; category?: string; search?: string }
}) {
  const supabase = createServerSupabaseClient()

  // Get filter parameters
  const difficulty = searchParams.difficulty
  const category = searchParams.category
  const search = searchParams.search

  // Fetch categories for filter
  const { data: categories, error: categoriesError } = await supabase.from("categories").select("id, name")

  // Build query for problems
  let query = supabase.from("problems").select("id, title, difficulty, category, tags").eq("is_active", true)

  // Apply filters
  if (difficulty) {
    query = query.eq("difficulty", difficulty)
  }

  if (category) {
    query = query.eq("category", category)
  }

  if (search) {
    query = query.ilike("title", `%${search}%`)
  }

  // Execute query
  const { data: problems, error } = await query

  // Check if there are any problems in the database
  const isEmpty = !problems || problems.length === 0

  // Get difficulty counts
  const { data: easyCount } = await supabase
    .from("problems")
    .select("id", { count: "exact", head: true })
    .eq("is_active", true)
    .eq("difficulty", "easy")

  const { data: mediumCount } = await supabase
    .from("problems")
    .select("id", { count: "exact", head: true })
    .eq("is_active", true)
    .eq("difficulty", "medium")

  const { data: hardCount } = await supabase
    .from("problems")
    .select("id", { count: "exact", head: true })
    .eq("is_active", true)
    .eq("difficulty", "hard")

  const difficultyMap = {
    easy: { count: easyCount || 0, color: "bg-green-500" },
    medium: { count: mediumCount || 0, color: "bg-yellow-500" },
    hard: { count: hardCount || 0, color: "bg-red-500" },
  }

  return (
    <div className="container py-8">
      <div className="flex flex-col space-y-4">
        <h1 className="text-3xl font-bold">Coding Problems</h1>
        <p className="text-muted-foreground">Practice your coding skills with our collection of problems</p>

        {isEmpty ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                No Problems Available
              </CardTitle>
              <CardDescription>
                There are currently no coding problems in the database. Let's add some sample problems.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>
                To get started with the platform, you need to add some coding problems to the database. You can add
                problems manually through the Supabase dashboard or use the button below to add some sample problems.
              </p>
            </CardContent>
            <CardFooter>
              <Button asChild>
                <Link href="/admin/add-sample-problems">Add Sample Problems</Link>
              </Button>
            </CardFooter>
          </Card>
        ) : (
          <ProblemsList
            problems={problems || []}
            categories={categories || []}
            difficultyMap={difficultyMap}
            currentDifficulty={difficulty}
            currentCategory={category}
            currentSearch={search}
          />
        )}
      </div>
    </div>
  )
}
