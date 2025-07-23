"use client"

import { useState, useEffect } from "react"
import { useSupabase } from "@/lib/supabase/provider"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Trophy, Medal, Award } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

type UserWithProfile = {
  user_id: string
  totalXp: number
  problemsSolved: number
  acceptedSubmissions: number
  totalSubmissions: number
  streak: number
  rank: number
  profiles: {
    username: string
    full_name: string | null
    avatar_url: string | null
    country: string | null
    rating: number | null
  }
}

type BadgeCounts = Record<string, number>

export function RealTimeLeaderboard({
  initialTopUsers,
  initialTopSolvers,
  initialTopStreaks,
  initialBadgeCounts,
}: {
  initialTopUsers: UserWithProfile[]
  initialTopSolvers: UserWithProfile[]
  initialTopStreaks: UserWithProfile[]
  initialBadgeCounts: BadgeCounts
}) {
  const { supabase } = useSupabase()
  const [topUsers, setTopUsers] = useState<UserWithProfile[]>(initialTopUsers || [])
  const [topSolvers, setTopSolvers] = useState<UserWithProfile[]>(initialTopSolvers || [])
  const [topStreaks, setTopStreaks] = useState<UserWithProfile[]>(initialTopStreaks || [])
  const [badgeCounts, setBadgeCounts] = useState<BadgeCounts>(initialBadgeCounts || {})
  const [loading, setLoading] = useState(false)

  // Function to fetch updated leaderboard data
  const fetchLeaderboardData = async () => {
    if (!supabase) return

    setLoading(true)

    try {
      // Fetch top users by points
      const { data: pointsData } = await supabase
        .from("user_statistics")
        .select(`
          *,
          profiles:user_id (
            username,
            full_name,
            avatar_url,
            country,
            rating
          )
        `)
        .order("totalXp", { ascending: false })
        .limit(50)

      if (pointsData) {
        setTopUsers(pointsData)
      }

      // Fetch top solvers
      const { data: solversData } = await supabase
        .from("user_statistics")
        .select(`
          *,
          profiles:user_id (
            username,
            full_name,
            avatar_url,
            country,
            rating
          )
        `)
        .order("problemsSolved", { ascending: false })
        .limit(50)

      if (solversData) {
        setTopSolvers(solversData)
      }

      // Fetch top streaks
      const { data: streaksData } = await supabase
        .from("user_statistics")
        .select(`
          *,
          profiles:user_id (
            username,
            full_name,
            avatar_url,
            country,
            rating
          )
        `)
        .order("streak", { ascending: false })
        .limit(10)

      if (streaksData) {
        setTopStreaks(streaksData)
      }

      // Update badge counts for new users
      const newBadgeCounts = { ...badgeCounts }
      const allUsers = new Set([
        ...(pointsData?.map((u) => u.user_id) || []),
        ...(solversData?.map((u) => u.user_id) || []),
        ...(streaksData?.map((u) => u.user_id) || []),
      ])

      for (const userId of allUsers) {
        if (!newBadgeCounts[userId]) {
          const { data, count } = await supabase
            .from("user_badges")
            .select("*", { count: "exact" })
            .eq("user_id", userId)

          newBadgeCounts[userId] = count || 0
        }
      }

      setBadgeCounts(newBadgeCounts)
    } catch (error) {
      console.error("Error fetching leaderboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!supabase) return

    // Set up real-time subscription to user_statistics table
    const subscription = supabase
      .channel("leaderboard-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_statistics",
        },
        (payload) => {
          console.log("Leaderboard change detected:", payload)
          // Refresh the leaderboard data when changes are detected
          fetchLeaderboardData()
        },
      )
      .subscribe()

    // Also set up subscription for user_badges to update badge counts
    const badgesSubscription = supabase
      .channel("badge-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_badges",
        },
        (payload) => {
          console.log("Badge change detected:", payload)
          fetchLeaderboardData()
        },
      )
      .subscribe()

    // Clean up subscriptions when component unmounts
    return () => {
      subscription.unsubscribe()
      badgesSubscription.unsubscribe()
    }
  }, [supabase])

  if (!supabase) {
    return <LeaderboardSkeleton />
  }

  return (
    <div className="container py-8">
      <div className="flex flex-col space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Leaderboard</h1>
            <p className="text-muted-foreground">Top performers ranked by points and problems solved</p>
          </div>
          {loading && <div className="text-sm text-muted-foreground animate-pulse">Updating...</div>}
        </div>

        <Tabs defaultValue="points">
          <TabsList>
            <TabsTrigger value="points">Points</TabsTrigger>
            <TabsTrigger value="problems">Problems Solved</TabsTrigger>
            <TabsTrigger value="streaks">Longest Streaks</TabsTrigger>
          </TabsList>

          <TabsContent value="points">
            <Card>
              <CardHeader>
                <CardTitle>Global Rankings</CardTitle>
                <CardDescription>Users with the most points earned</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-12 gap-4 font-medium text-muted-foreground py-2 border-b">
                    <div className="col-span-1">Rank</div>
                    <div className="col-span-5">User</div>
                    <div className="col-span-2 text-center">Points</div>
                    <div className="col-span-2 text-center">Problems</div>
                    <div className="col-span-2 text-center">Badges</div>
                  </div>

                  {topUsers && topUsers.length > 0 ? (
                    topUsers.map((user, index) => {
                      const acceptanceRate =
                        user.totalSubmissions > 0
                          ? Math.round((user.acceptedSubmissions / user.totalSubmissions) * 100)
                          : 0

                      return (
                        <div
                          key={user.user_id}
                          className={`grid grid-cols-12 gap-4 items-center py-4 border-b last:border-0 ${
                            index < 3 ? "bg-primary/5" : ""
                          }`}
                        >
                          <div className="col-span-1 font-bold flex items-center">
                            {index === 0 ? (
                              <Trophy className="h-5 w-5 text-yellow-500 mr-1" />
                            ) : index === 1 ? (
                              <Medal className="h-5 w-5 text-gray-400 mr-1" />
                            ) : index === 2 ? (
                              <Medal className="h-5 w-5 text-amber-600 mr-1" />
                            ) : (
                              index + 1
                            )}
                          </div>
                          <div className="col-span-5">
                            <Link
                              href={`/profile/${user.profiles?.username}`}
                              className="flex items-center gap-3 hover:underline"
                            >
                              <Avatar className="h-8 w-8">
                                <AvatarImage
                                  src={user.profiles?.avatar_url || undefined}
                                  alt={user.profiles?.username || "User"}
                                />
                                <AvatarFallback>
                                  {user.profiles?.username?.charAt(0).toUpperCase() || "U"}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">
                                  {user.profiles?.full_name || user.profiles?.username || "User"}
                                </div>
                                <div className="text-xs text-muted-foreground flex items-center gap-1">
                                  @{user.profiles?.username}
                                  {user.profiles?.country && <span>• {user.profiles.country}</span>}
                                </div>
                              </div>
                            </Link>
                          </div>
                          <div className="col-span-2 text-center font-medium">{user.totalXp || 0}</div>
                          <div className="col-span-2 text-center">
                            <Badge variant={acceptanceRate >= 70 ? "default" : "outline"}>
                              {user.problemsSolved || 0}
                            </Badge>
                          </div>
                          <div className="col-span-2 text-center">
                            <div className="flex items-center justify-center">
                              <Award className="h-4 w-4 mr-1 text-primary" />
                              <span>{badgeCounts[user.user_id] || 0}</span>
                            </div>
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No users found</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="problems">
            <Card>
              <CardHeader>
                <CardTitle>Problem Solvers</CardTitle>
                <CardDescription>Users who have solved the most problems</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-12 gap-4 font-medium text-muted-foreground py-2 border-b">
                    <div className="col-span-1">Rank</div>
                    <div className="col-span-5">User</div>
                    <div className="col-span-2 text-center">Problems</div>
                    <div className="col-span-2 text-center">Acceptance</div>
                    <div className="col-span-2 text-center">Points</div>
                  </div>

                  {topSolvers && topSolvers.length > 0 ? (
                    topSolvers.map((user, index) => {
                      const acceptanceRate =
                        user.totalSubmissions > 0
                          ? Math.round((user.acceptedSubmissions / user.totalSubmissions) * 100)
                          : 0

                      return (
                        <div
                          key={user.user_id}
                          className={`grid grid-cols-12 gap-4 items-center py-4 border-b last:border-0 ${
                            index < 3 ? "bg-primary/5" : ""
                          }`}
                        >
                          <div className="col-span-1 font-bold">
                            {index === 0 ? (
                              <Trophy className="h-5 w-5 text-yellow-500" />
                            ) : index === 1 ? (
                              <Medal className="h-5 w-5 text-gray-400" />
                            ) : index === 2 ? (
                              <Medal className="h-5 w-5 text-amber-600" />
                            ) : (
                              index + 1
                            )}
                          </div>
                          <div className="col-span-5">
                            <Link
                              href={`/profile/${user.profiles?.username}`}
                              className="flex items-center gap-3 hover:underline"
                            >
                              <Avatar className="h-8 w-8">
                                <AvatarImage
                                  src={user.profiles?.avatar_url || undefined}
                                  alt={user.profiles?.username || "User"}
                                />
                                <AvatarFallback>
                                  {user.profiles?.username?.charAt(0).toUpperCase() || "U"}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">
                                  {user.profiles?.full_name || user.profiles?.username || "User"}
                                </div>
                                <div className="text-xs text-muted-foreground flex items-center gap-1">
                                  @{user.profiles?.username}
                                  {user.profiles?.country && <span>• {user.profiles.country}</span>}
                                </div>
                              </div>
                            </Link>
                          </div>
                          <div className="col-span-2 text-center font-medium">{user.problemsSolved || 0}</div>
                          <div className="col-span-2 text-center">
                            <Badge variant={acceptanceRate >= 70 ? "default" : "outline"}>{acceptanceRate}%</Badge>
                          </div>
                          <div className="col-span-2 text-center font-medium">{user.totalXp || 0}</div>
                        </div>
                      )
                    })
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No users found</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="streaks">
            <Card>
              <CardHeader>
                <CardTitle>Longest Streaks</CardTitle>
                <CardDescription>Users with the longest problem-solving streaks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-12 gap-4 font-medium text-muted-foreground py-2 border-b">
                    <div className="col-span-1">Rank</div>
                    <div className="col-span-5">User</div>
                    <div className="col-span-2 text-center">Streak</div>
                    <div className="col-span-2 text-center">Problems</div>
                    <div className="col-span-2 text-center">Points</div>
                  </div>

                  {topStreaks && topStreaks.length > 0 ? (
                    topStreaks.map((user, index) => (
                      <div
                        key={user.user_id}
                        className={`grid grid-cols-12 gap-4 items-center py-4 border-b last:border-0 ${
                          index < 3 ? "bg-primary/5" : ""
                        }`}
                      >
                        <div className="col-span-1 font-bold">
                          {index === 0 ? (
                            <Trophy className="h-5 w-5 text-yellow-500" />
                          ) : index === 1 ? (
                            <Medal className="h-5 w-5 text-gray-400" />
                          ) : index === 2 ? (
                            <Medal className="h-5 w-5 text-amber-600" />
                          ) : (
                            index + 1
                          )}
                        </div>
                        <div className="col-span-5">
                          <Link
                            href={`/profile/${user.profiles?.username}`}
                            className="flex items-center gap-3 hover:underline"
                          >
                            <Avatar className="h-8 w-8">
                              <AvatarImage
                                src={user.profiles?.avatar_url || undefined}
                                alt={user.profiles?.username || "User"}
                              />
                              <AvatarFallback>{user.profiles?.username?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">
                                {user.profiles?.full_name || user.profiles?.username || "User"}
                              </div>
                              <div className="text-xs text-muted-foreground flex items-center gap-1">
                                @{user.profiles?.username}
                                {user.profiles?.country && <span>• {user.profiles.country}</span>}
                              </div>
                            </div>
                          </Link>
                        </div>
                        <div className="col-span-2 text-center">
                          <Badge className="bg-primary">{user.streak || 0} days</Badge>
                        </div>
                        <div className="col-span-2 text-center font-medium">{user.problemsSolved || 0}</div>
                        <div className="col-span-2 text-center font-medium">{user.totalXp || 0}</div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No users found</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

function LeaderboardSkeleton() {
  return (
    <div className="container py-8">
      <div className="flex flex-col space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Leaderboard</h1>
          <p className="text-muted-foreground">Top performers ranked by points and problems solved</p>
        </div>

        <Tabs defaultValue="points">
          <TabsList>
            <TabsTrigger value="points">Points</TabsTrigger>
            <TabsTrigger value="problems">Problems Solved</TabsTrigger>
            <TabsTrigger value="streaks">Longest Streaks</TabsTrigger>
          </TabsList>

          <TabsContent value="points">
            <Card>
              <CardHeader>
                <CardTitle>Global Rankings</CardTitle>
                <CardDescription>Users with the most points earned</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-12 gap-4 font-medium text-muted-foreground py-2 border-b">
                    <div className="col-span-1">Rank</div>
                    <div className="col-span-5">User</div>
                    <div className="col-span-2 text-center">Points</div>
                    <div className="col-span-2 text-center">Problems</div>
                    <div className="col-span-2 text-center">Badges</div>
                  </div>

                  {Array(5)
                    .fill(0)
                    .map((_, i) => (
                      <div key={i} className="grid grid-cols-12 gap-4 items-center py-4 border-b">
                        <div className="col-span-1">
                          <Skeleton className="h-6 w-6" />
                        </div>
                        <div className="col-span-5 flex items-center gap-3">
                          <Skeleton className="h-8 w-8 rounded-full" />
                          <div className="space-y-1">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-3 w-16" />
                          </div>
                        </div>
                        <div className="col-span-2 text-center">
                          <Skeleton className="h-4 w-12 mx-auto" />
                        </div>
                        <div className="col-span-2 text-center">
                          <Skeleton className="h-6 w-10 mx-auto" />
                        </div>
                        <div className="col-span-2 text-center">
                          <Skeleton className="h-4 w-8 mx-auto" />
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
