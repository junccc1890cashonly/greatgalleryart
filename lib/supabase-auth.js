import { createClient } from "@supabase/supabase-js";

export class AuthError extends Error {
  constructor(message) {
    super(message);
    this.name = "AuthError";
    this.status = 401;
  }
}

function getSupabaseEnv() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase auth is not configured on the server.");
  }

  return { supabaseUrl, supabaseAnonKey };
}

function getBearerToken(request) {
  const authHeader = request.headers.authorization || request.headers.Authorization || "";
  const match = String(authHeader).match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : "";
}

export async function requireAuthenticatedRequest(request) {
  const token = getBearerToken(request);
  if (!token) {
    throw new AuthError("You must sign in before performing this action.");
  }

  const { supabaseUrl, supabaseAnonKey } = getSupabaseEnv();
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) {
    throw new AuthError("Your session is no longer valid. Please sign in again.");
  }

  return data.user;
}
