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
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // Increased to 30 seconds for mobile/slow networks

    const fetchOptions: RequestInit = {
      ...options,
      credentials: "include", // Required for AI Studio authentication proxy
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        ...(isPostOrPut ? { 'Content-Type': 'application/json' } : {}),
        ...((options?.headers as Record<string, string>) || {})
      }
    };

    console.log(`[API] Fetching ${fullUrl}...`);
    let res: Response;
    try {
      res = await fetch(fullUrl, fetchOptions);
    } catch (fetchErr: any) {
      // Catch specific errors like AbortError or TypeError
      console.error(`[API] Native fetch failed for ${fullUrl}:`, fetchErr.name, fetchErr.message);
      throw fetchErr; 
    } finally {
      clearTimeout(timeoutId);
    }
    
    console.log(`[API] Response ${url}: ${res.status}`);
    
    const contentType = res.headers.get("content-type") || "";
    let jsonBody: any = null;
    let text = "";

    try {
      text = await res.text();
    } catch (e) {
      console.warn(`[API] Could not read text for ${url}`);
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
      const normalizedError = errorMsg.toLowerCase().trim();
      if (
        normalizedError.includes("server error") || 
        normalizedError.includes("has occurred") || 
        normalizedError.includes("load failed") ||
        res.status === 500 ||
        res.status === 504
      ) {
        errorMsg = "The connection failed due to a server timeout or temporary error. Please verify your API keys and try again in a few moments.";
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
