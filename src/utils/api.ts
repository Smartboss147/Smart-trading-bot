export async function safeFetchJson<T = any>(
  url: string,
  options?: RequestInit
): Promise<{ ok: boolean; data?: T; error?: string; status?: number }> {
  try {
    // Ensure URL is absolute for better Safari compatibility and to avoid redirects
    const fullUrl = url.startsWith("/") 
      ? `${window.location.origin}${url}` 
      : url;

    // Safari can be picky about headers and methods
    const fetchOptions: RequestInit = {
      ...options,
      headers: new Headers(options?.headers || {}),
    };

    const res = await fetch(fullUrl, fetchOptions);
    const contentType = res.headers.get("content-type") || "";

    let jsonBody: any = null;
    let text = "";

    try {
      text = await res.text();
    } catch (readErr: any) {
      console.warn(`[API] Could not read response text for ${url}:`, readErr.message);
    }

    if (contentType.includes("application/json") && text) {
      try {
        jsonBody = JSON.parse(text);
      } catch (parseErr) {
        console.error(`[API] JSON parse error for ${url}:`, text.substring(0, 100));
        // Fallback: if it's not JSON but was supposed to be
      }
    } else if (text && !text.trim().startsWith("<")) {
      // If it's plain text and not HTML
      try {
        jsonBody = JSON.parse(text);
      } catch {
        jsonBody = { error: text };
      }
    }

    if (!res.ok) {
      if (text.trim().startsWith("<!DOCTYPE html") || text.trim().startsWith("<html")) {
        return {
          ok: false,
          status: res.status,
          error: `Backend error (${res.status}): Server returned HTML. This may mean the API route is missing or crashed.`
        };
      }

      const errorMsg =
        jsonBody?.error ||
        jsonBody?.message ||
        jsonBody?.label ||
        (text && text.length < 200 ? text : `Server error (${res.status} ${res.statusText})`);
      
      return { ok: false, status: res.status, data: jsonBody, error: errorMsg };
    }

    return { ok: true, status: res.status, data: jsonBody };
  } catch (e: any) {
    console.error(`[API] Fetch error for ${url}:`, e.message);
    // Specific check for Safari's "The string did not match the expected pattern"
    let userFriendlyError = e.message;
    if (e.message === "The string did not match the expected pattern") {
      userFriendlyError = "Browser rejected the request format. This can happen in Safari due to invalid characters in keys or a blocked connection.";
    }
    
    return {
      ok: false,
      error: userFriendlyError || "Network request failed. Please check connection."
    };
  }
}
