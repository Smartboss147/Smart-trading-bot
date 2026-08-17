import { supabase, isSupabaseConfigured } from '../lib/supabase';

let cachedToken: string = "";
let lastTokenFetch: number = 0;

export async function safeFetchJson<T = any>(
  url: string,
  options?: RequestInit
): Promise<{ ok: boolean; data?: T; error?: string; status?: number }> {
  try {
    const isPostOrPut = options?.method === 'POST' || options?.method === 'PUT';
    
    let origin = "";
    try {
      origin = window.location.origin;
      if (!origin || origin === "null") {
        origin = `${window.location.protocol}//${window.location.host}`;
      }
    } catch (e) {
      console.warn("[API] Could not determine window.location.origin");
    }

    const fullUrl = url.startsWith("/") ? `${origin}${url}` : url;
    
    // Get Supabase auth session token only if configured
    let token = "";
    if (isSupabaseConfigured) {
      const now = Date.now();
      if (now - lastTokenFetch < 10000 && cachedToken) {
        token = cachedToken;
      } else {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.access_token) {
            token = session.access_token;
            cachedToken = token;
            lastTokenFetch = now;
          }
        } catch (e) {
          console.warn("[API] Could not get Supabase session");
        }
      }
    }
    
    const baseFetchOptions: RequestInit = {
      ...options,
      credentials: "include", // Required for AI Studio authentication proxy
      headers: {
        'Accept': 'application/json',
        ...(isPostOrPut ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...((options?.headers as Record<string, string>) || {})
      }
    };

    console.log(`[API] Fetching ${fullUrl}...`);
    let res: Response;
    let attempts = 0;
    const maxAttempts = 2;

    while (true) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 seconds timeout
      try {
        attempts++;
        res = await fetch(fullUrl, {
          ...baseFetchOptions,
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        break;
      } catch (fetchErr: any) {
        clearTimeout(timeoutId);
        if (attempts >= maxAttempts) {
          console.error(`[API] Native fetch failed for ${fullUrl} after ${attempts} attempts:`, fetchErr.name, fetchErr.message);
          throw fetchErr;
        }
        console.warn(`[API] Transient fetch failure for ${fullUrl} (attempt ${attempts}): ${fetchErr.message}, retrying in 500ms...`);
        await new Promise(r => setTimeout(r, 500));
      }
    }
    
    console.log(`[API] Response ${fullUrl}: ${res.status}`);
    
    const contentType = res.headers.get("content-type") || "";
    let jsonBody: any = null;
    let text = "";

    try {
      text = await res.text();
    } catch (e) {
      console.warn(`[API] Could not read text for ${fullUrl}`);
    }

    if (contentType.includes("text/html") || (text && text.trim().startsWith("<"))) {
      console.warn(`[API] Received HTML response instead of JSON for ${fullUrl}. Cookie check redirect detected.`);
      return {
        ok: false,
        status: res.status,
        error: "Authentication session initializing. Please wait a moment."
      };
    }

    if (contentType.includes("application/json") && text) {
      try {
        jsonBody = JSON.parse(text);
      } catch (e) {
        console.error(`[API] JSON parse error for ${url}`);
      }
    } else if (text && !text.trim().startsWith("<")) {
      try {
        jsonBody = JSON.parse(text);
      } catch {
        jsonBody = { error: text };
      }
    }

    if (!res.ok) {
      let rawError = jsonBody?.error || jsonBody?.message || `Server error (${res.status})`;
      let errorMsg = typeof rawError === 'string' ? rawError : (rawError?.message || JSON.stringify(rawError));
      
      // Intercept unhelpful proxy/server generic errors
      const isGenericError = errorMsg === "A server error has occurred" || errorMsg === "Load failed";
      const isTimeout = res.status === 504 || (res.status === 401 && errorMsg.toLowerCase().includes("timeout"));
      const isGateError = jsonBody?.code && typeof jsonBody.code === 'string' && jsonBody.code.startsWith('GATE_');
      
      if ((isGenericError || isTimeout) && !isGateError) {
        errorMsg = "The connection failed due to a server timeout or temporary network error. Please verify your API keys and try again in a few moments.";
      }
      
      return { ok: false, status: res.status, data: jsonBody, error: errorMsg };
    }

    return { ok: true, status: res.status, data: jsonBody };
  } catch (e: any) {
    console.error(`[API] Error for ${url}:`, e.name, e.message);
    
    let errorMsg = `Connection failed: ${e.message}`;
    if (e.name === 'AbortError') {
      errorMsg = "Request timed out. The server might be slow or the connection was interrupted.";
    } else if (e.name === 'TypeError' && e.message === 'Load failed') {
      errorMsg = "Network request failed. This is often caused by CORS issues, ad-blockers, or the server being unreachable.";
    }

    return {
      ok: false,
      error: errorMsg
    };
  }
}
