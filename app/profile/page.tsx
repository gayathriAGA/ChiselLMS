import { createServerSupabaseClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { getUserBadges } from "@/lib/code-execution-service"
import { Award, Trophy, Star, Calendar, Flame, Zap } from "lucide-react"
import { prisma } from "@/lib/prisma"

export default async function ProfilePage() {
  const supabase = createServerSupabaseClient()

  // Get the current user
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  // Replace Supabase queries:
  const profile = await prisma.profile.findUnique({
    where: { id: session.user.id },
  })

  const stats = await prisma.userStatistics.findUnique({
    where: { userId: session.user.id },
  })

  const submissions = await prisma.submission.findMany({
    where: { userId: session.user.id },
    include: {
      problem: {
        select: { title: true, difficulty: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  })

  // Get user badges
  const badges = await getUserBadges(session.user.id)

  // Calculate submission statistics
  const totalSubmissions = stats?.totalSubmissions || 0
  const acceptedRate =
    totalSubmissions > 0 ? Math.round(((stats?.acceptedSubmissions || 0) / totalSubmissions) * 100) : 0

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  return (
    <div className="container py-8">
      <div className="flex flex-col space-y-8">
        {/* Profile header */}
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
          <Avatar className="h-24 w-24">
            <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.username || "User"} />
            <AvatarFallback className="text-2xl">
              {profile?.username?.charAt(0).toUpperCase() || session.user.email?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="space-y-2">
            <h1 className="text-3xl font-bold">{profile?.full_name || profile?.username || "User"}</h1>
            <div className="flex flex-wrap gap-2 items-center">
              <Badge variant="outline">@{profile?.username || "user"}</Badge>
              {stats?.rank && <Badge className="bg-primary">Rank #{stats.rank}</Badge>}
              {stats?.totalXp && <Badge variant="outline">{stats.totalXp} Points</Badge>}
              {profile?.country && <Badge variant="outline">{profile.country}</Badge>}
            </div>
            {profile?.bio && <p className="text-muted-foreground">{profile.bio}</p>}
            {profile?.institution && <p className="text-sm text-muted-foreground">{profile.institution}</p>}
          </div>
        </div>

        {/* Stats and submissions */}
        <Tabs defaultValue="stats">
          <TabsList>
            <TabsTrigger value="stats">Statistics</TabsTrigger>
            <TabsTrigger value="submissions">Recent Submissions</TabsTrigger>
            <TabsTrigger value="badges">Badges & Achievements</TabsTrigger>
          </TabsList>

          <TabsContent value="stats" className="space-y-6">
            {/* Problem solving stats */}
            <Card>
              <CardHeader>
                <CardTitle>Problem Solving</CardTitle>
                <CardDescription>Your coding progress and achievements</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Problems Solved</h3>
                    <div className="text-3xl font-bold">{stats?.problemsSolved || 0}</div>
                    <div className="grid grid-cols-3 gap-2 pt-2">
                      <div>
                        <div className="text-xs text-muted-foreground">Easy</div>
                        <div className="font-medium">{stats?.easySolved || 0}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Medium</div>
                        <div className="font-medium">{stats?.mediumSolved || 0}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Hard</div>
                        <div className="font-medium">{stats?.hardSolved || 0}</div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Submissions</h3>
                    <div className="text-3xl font-bold">{totalSubmissions}</div>
                    <div className="space-y-1 pt-2">
                      <div className="text-xs text-muted-foreground">Acceptance Rate</div>
                      <Progress value={acceptedRate} className="h-2" />
                      <div className="text-xs text-right">{acceptedRate}%</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Points & Streaks</h3>
                    <div className="text-3xl font-bold">{stats?.totalXp || 0}</div>
                    <div className="grid grid-cols-1 gap-2 pt-2">
                      <div className="flex justify-between">
                        <div className="text-sm flex items-center">
                          <Trophy className="h-4 w-4 mr-1 text-primary" />
                          <span>Rank</span>
                        </div>
                        <div className="font-medium">#{stats?.rank || "-"}</div>
                      </div>
                      <div className="flex justify-between">
                        <div className="text-sm flex items-center">
                          <Flame className="h-4 w-4 mr-1 text-primary" />
                          <span>Current Streak</span>
                        </div>
                        <div className="font-medium">{stats?.streak || 0} days</div>
                      </div>
                      <div className="flex justify-between">
                        <div className="text-sm flex items-center">
                          <Calendar className="h-4 w-4 mr-1 text-primary" />
                          <span>Last Solved</span>
                        </div>
                        <div className="font-medium">
                          {stats?.lastSolvedDate ? new Date(stats.lastSolvedDate).toLocaleDateString() : "Never"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="submissions">
            <Card>
              <CardHeader>
                <CardTitle>Recent Submissions</CardTitle>
                <CardDescription>Your most recent code submissions</CardDescription>
              </CardHeader>
              <CardContent>
                {submissions && submissions.length > 0 ? (
                  <div className="space-y-4">
                    {submissions.map((submission) => (
                      <div
                        key={submission.id}
                        className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border rounded-lg"
                      >
                        <div className="space-y-1">
                          <div className="font-medium">{submission.problem?.title}</div>
                          <div className="text-sm text-muted-foreground">{formatDate(submission.createdAt)}</div>
                        </div>
                        <div className="flex items-center gap-2 mt-2 sm:mt-0">
                          <Badge variant="outline">{submission.language}</Badge>
                          <Badge
                            className={
                              submission.status === "Accepted"
                                ? "bg-green-500"
                                : submission.status === "Wrong Answer"
                                  ? "bg-red-500"
                                  : "bg-yellow-500"
                            }
                          >
                            {submission.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No submissions yet. Start solving problems!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="badges">
            <Card>
              <CardHeader>
                <CardTitle>Badges & Achievements</CardTitle>
                <CardDescription>Badges you've earned through your coding journey</CardDescription>
              </CardHeader>
              <CardContent>
                {badges && badges.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {badges.map((badge) => (
                      <div key={badge.badge_id} className="border rounded-lg p-4 flex items-start space-x-4">
                        <div className="bg-primary/10 p-3 rounded-full">
                          {badge.badges.icon === "award" ? (
                            <Award className="h-6 w-6 text-primary" />
                          ) : badge.badges.icon === "star" ? (
                            <Star className="h-6 w-6 text-primary" />
                          ) : badge.badges.icon === "trophy" ? (
                            <Trophy className="h-6 w-6 text-primary" />
                          ) : badge.badges.icon === "flame" ? (
                            <Flame className="h-6 w-6 text-primary" />
                          ) : badge.badges.icon === "zap" ? (
                            <Zap className="h-6 w-6 text-primary" />
                          ) : (
                            <Award className="h-6 w-6 text-primary" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold">{badge.badges.name}</h4>
                          <p className="text-sm text-muted-foreground">{badge.badges.description}</p>
                          <div className="flex justify-between items-center mt-2">
                            <Badge variant="outline">+{badge.badges.points} pts</Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(badge.earned_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No badges earned yet. Keep solving problems to earn badges!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
