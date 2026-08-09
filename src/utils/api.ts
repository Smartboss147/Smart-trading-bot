export async function safeFetchJson<T = any>(
  url: string,
  options?: RequestInit
): Promise<{ ok: boolean; data?: T; error?: string; status?: number }> {
  try {
    const res = await fetch(url, options);
    const contentType = res.headers.get("content-type") || "";

    let jsonBody: any = null;

    if (contentType.includes("application/json")) {
      try {
        const text = await res.text();
        try {
          jsonBody = JSON.parse(text);
        } catch (parseErr) {
          console.error(`[API] Failed to parse JSON from ${url}:`, text.substring(0, 100));
          return {
            ok: false,
            status: res.status,
            error: `Invalid JSON response from server. Body: ${text.substring(0, 50)}...`
          };
        }
      } catch (readErr: any) {
        console.error(`[API] Failed to read response body from ${url}:`, readErr.message);
      }
    } else {
      const text = await res.text();
      if (text.trim().startsWith("<")) {
        return {
          ok: false,
          status: res.status,
          error: `Backend API endpoint returned HTML (${res.status}) instead of JSON. This usually means a server error or a missing API route on Vercel.`
        };
      }
      if (text) {
        jsonBody = { error: text };
      }
    }

    if (!res.ok) {
      const errorMsg =
        jsonBody?.error ||
        jsonBody?.message ||
        `Server error (${res.status} ${res.statusText})`;
      return { ok: false, status: res.status, data: jsonBody, error: errorMsg };
    }

    return { ok: true, status: res.status, data: jsonBody };
  } catch (e: any) {
    console.error(`[API] Fetch error for ${url}:`, e.message);
    return {
      ok: false,
      error: e?.message || "Network request failed. Please check connection."
    };
  }
}
