import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import type { Database } from "@/lib/database.types"

export function createServerSupabaseClient() {
  // Check if Supabase environment variables are available
  const isSupabaseAvailable =
    typeof process.env.NEXT_PUBLIC_SUPABASE_URL === "string" &&
    typeof process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === "string"

  if (!isSupabaseAvailable) {
    // Return a mock client with empty data responses when Supabase isn't configured
    return {
      auth: {
        getSession: async () => ({ data: { session: null } }),
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            single: async () => ({ data: null, error: null }),
            limit: () => ({ data: [], error: null }),
            order: () => ({ data: [], error: null }),
            data: [],
            error: null,
          }),
          order: () => ({
            limit: () => ({ data: [], error: null }),
            data: [],
            error: null,
          }),
          limit: () => ({ data: [], error: null }),
          data: [],
          error: null,
        }),
        insert: () => ({ select: () => ({ single: async () => ({ data: null, error: null }) }) }),
        update: () => ({ eq: () => ({ data: null, error: null }) }),
      }),
    }
  }

  const cookieStore = cookies()
  return createServerComponentClient<Database>({ cookies: () => cookieStore })
}
