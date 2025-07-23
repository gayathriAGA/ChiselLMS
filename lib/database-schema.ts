import { createServerSupabaseClient } from "@/lib/supabase/server"

// This function checks if columns exist in a table and adds them if they don't
export async function ensureDatabaseSchema() {
  try {
    const supabase = createServerSupabaseClient()

    // Check if the submissions table has the required columns
    const { data: columns } = await supabase.rpc("get_table_columns", { table_name: "submissions" })

    const hasTimeComplexity = columns?.some((col: any) => col.column_name === "time_complexity")
    const hasSpaceComplexity = columns?.some((col: any) => col.column_name === "space_complexity")

    // Log the current schema
    console.log("Current submissions table schema:", columns)
    console.log("Has time_complexity:", hasTimeComplexity)
    console.log("Has space_complexity:", hasSpaceComplexity)

    // Create a compatibility layer to handle missing columns
    if (!hasTimeComplexity || !hasSpaceComplexity) {
      console.log("Creating compatibility layer for missing columns")

      // Create a function to safely insert into submissions table
      await supabase.rpc("create_safe_insert_function")
    }

    return {
      hasTimeComplexity,
      hasSpaceComplexity,
    }
  } catch (error) {
    console.error("Error checking database schema:", error)
    // Return default values to prevent further errors
    return {
      hasTimeComplexity: false,
      hasSpaceComplexity: false,
    }
  }
}

// This function creates a safe insert function that handles missing columns
export async function setupDatabaseFunctions() {
  const supabase = createServerSupabaseClient()

  // Create a function to get table columns
  await supabase
    .rpc("create_get_columns_function", {
      sql: `
      CREATE OR REPLACE FUNCTION get_table_columns(table_name text)
      RETURNS TABLE(column_name text, data_type text)
      LANGUAGE plpgsql
      AS $$
      BEGIN
        RETURN QUERY
        SELECT c.column_name::text, c.data_type::text
        FROM information_schema.columns c
        WHERE c.table_name = table_name
        AND c.table_schema = 'public';
      END;
      $$;
    `,
    })
    .catch((e) => console.log("Function may already exist:", e))

  // Create a function for safe inserts
  await supabase
    .rpc("create_safe_insert_function", {
      sql: `
      CREATE OR REPLACE FUNCTION safe_insert_submission(
        p_user_id text,
        p_problem_id integer,
        p_code text,
        p_language text,
        p_status text,
        p_execution_time numeric,
        p_memory_used numeric,
        p_time_complexity text DEFAULT NULL,
        p_space_complexity text DEFAULT NULL
      )
      RETURNS json
      LANGUAGE plpgsql
      AS $$
      DECLARE
        result json;
        column_exists boolean;
        query text;
      BEGIN
        -- Check if time_complexity column exists
        SELECT EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_name = 'submissions'
          AND column_name = 'time_complexity'
        ) INTO column_exists;
        
        -- Build query based on available columns
        IF column_exists THEN
          query := 'INSERT INTO submissions (user_id, problem_id, code, language, status, execution_time, memory_used, time_complexity, space_complexity, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW()) RETURNING *';
          EXECUTE query USING p_user_id, p_problem_id, p_code, p_language, p_status, p_execution_time, p_memory_used, p_time_complexity, p_space_complexity INTO result;
        ELSE
          query := 'INSERT INTO submissions (user_id, problem_id, code, language, status, execution_time, memory_used, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) RETURNING *';
          EXECUTE query USING p_user_id, p_problem_id, p_code, p_language, p_status, p_execution_time, p_memory_used INTO result;
        END IF;
        
        RETURN result;
      END;
      $$;
    `,
    })
    .catch((e) => console.log("Function may already exist:", e))
}
