import { createClient } from "@supabase/supabase-js";

const rawUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
const rawKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";

export const isSupabaseConfigured = Boolean(
  rawUrl &&
  !rawUrl.includes("placeholder.supabase.co") &&
  rawUrl.startsWith("http") &&
  rawKey &&
  !rawKey.includes("placeholder") &&
  rawKey.length > 20
);

const supabaseUrl = isSupabaseConfigured ? rawUrl : "https://placeholder.supabase.co";
const supabaseServiceKey = isSupabaseConfigured ? rawKey : "placeholder-key-long-enough-for-client";

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const userCache = new Map<string, { user: any, timestamp: number }>();

export async function getUserFromToken(authHeader?: string) {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { id: "default_user", email: "guest@apexquant.io" };
  }
  const token = authHeader.split(" ")[1];
  if (!token || token === "undefined" || token === "null" || !isSupabaseConfigured) {
    return { id: "default_user", email: "guest@apexquant.io" };
  }

  const now = Date.now();
  const cached = userCache.get(token);
  if (cached && now - cached.timestamp < 60000) { // Cache for 60 seconds
    return cached.user;
  }

  try {
    const timeoutPromise = new Promise<{ data: { user: null }; error: Error }>((resolve) =>
      setTimeout(() => resolve({ data: { user: null }, error: new Error("Auth timeout") }), 2500)
    );
    const authPromise = supabaseAdmin.auth.getUser(token);
    authPromise.catch(() => {}); // Prevent unhandled rejection if timeout wins
    const result = await Promise.race([authPromise, timeoutPromise]);
    
    if (result.error || !result.data?.user) {
      return { id: "default_user", email: "guest@apexquant.io" };
    }
    
    userCache.set(token, { user: result.data.user, timestamp: now });
    return result.data.user;
  } catch (err) {
    return { id: "default_user", email: "guest@apexquant.io" };
  }
}

