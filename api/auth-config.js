export default async function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return response.status(405).json({ error: "Method not allowed." });
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  if (!supabaseUrl || !supabaseAnonKey) {
    return response.status(500).json({
      error: "Supabase auth is not configured. Add SUPABASE_URL and SUPABASE_ANON_KEY in Vercel."
    });
  }

  return response.status(200).json({
    supabaseUrl,
    supabaseAnonKey
  });
}
