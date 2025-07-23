import { createServerSupabaseClient } from "@/lib/supabase/server"
import { RealTimeLeaderboard } from "@/components/real-time-leaderboard"
import { updateLeaderboardRankings } from "@/lib/code-execution-service"
import { prisma } from "@/lib/prisma"

// No need for frequent revalidation since we're using real-time updates
export const revalidate = 3600 // Fallback revalidation every hour

export default async function LeaderboardPage() {
  const supabase = createServerSupabaseClient()

  // Update leaderboard rankings on page load
  await updateLeaderboardRankings()

  // Replace Supabase queries with Prisma:
  const topUsers = await prisma.userStatistics.findMany({
    include: {
      profile: {
        select: {
          username: true,
          fullName: true,
          avatarUrl: true,
          country: true,
          rating: true,
        },
      },
    },
    orderBy: { totalXp: "desc" }, // Changed from total_points
    take: 50,
  })

  const topSolvers = await prisma.userStatistics.findMany({
    include: {
      profile: {
        select: {
          username: true,
          fullName: true,
          avatarUrl: true,
          country: true,
          rating: true,
        },
      },
    },
    orderBy: { problemsSolved: "desc" }, // Changed from problems_solved
    take: 50,
  })

  const topStreaks = await prisma.userStatistics.findMany({
    include: {
      profile: {
        select: {
          username: true,
          fullName: true,
          avatarUrl: true,
          country: true,
          rating: true,
        },
      },
    },
    orderBy: { streak: "desc" },
    take: 10,
  })

  // Update badge counts query:
  const badgeCounts: Record<string, number> = {}
  if (topUsers) {
    for (const user of topUsers) {
      const count = await prisma.userBadge.count({
        where: { userId: user.userId },
      })
      badgeCounts[user.userId] = count
    }
  }

  return (
    <RealTimeLeaderboard
      initialTopUsers={topUsers || []}
      initialTopSolvers={topSolvers || []}
      initialTopStreaks={topStreaks || []}
      initialBadgeCounts={badgeCounts}
    />
  )
}
