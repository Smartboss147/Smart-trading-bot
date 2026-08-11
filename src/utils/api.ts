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

    // Ensure URL is absolute for consistency in all environments
    const fullUrl = url.startsWith("/") ? `${origin}${url}` : url;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 seconds timeout

    const fetchOptions: RequestInit = {
      ...options,
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
      const errorMsg = jsonBody?.error || jsonBody?.message || `Server error (${res.status})`;
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
