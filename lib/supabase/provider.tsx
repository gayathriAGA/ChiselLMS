"use client"

import type React from "react"

import { createContext, useContext, useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { SupabaseClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/lib/database.types"

type SupabaseContext = {
  supabase: SupabaseClient<Database> | null
  isSupabaseAvailable: boolean
}

const Context = createContext<SupabaseContext | undefined>(undefined)

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  // Check if Supabase environment variables are available
  const isSupabaseAvailable =
    typeof process.env.NEXT_PUBLIC_SUPABASE_URL === "string" &&
    typeof process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === "string"

  const [supabase, setSupabase] = useState<SupabaseClient<Database> | null>(null)

  useEffect(() => {
    if (isSupabaseAvailable) {
      const client = createClientComponentClient<Database>({
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        options: {
          realtime: {
            params: {
              eventsPerSecond: 10,
            },
          },
        },
      })

      setSupabase(client)

      // Set up auth state change listener
      const {
        data: { subscription },
      } = client.auth.onAuthStateChange(() => {
        // Refresh the page on auth state change
      })

      return () => {
        subscription.unsubscribe()
      }
    }
  }, [isSupabaseAvailable])

  return <Context.Provider value={{ supabase, isSupabaseAvailable }}>{children}</Context.Provider>
}

export const useSupabase = () => {
  const context = useContext(Context)
  if (context === undefined) {
    throw new Error("useSupabase must be used inside SupabaseProvider")
  }
  return context
}
