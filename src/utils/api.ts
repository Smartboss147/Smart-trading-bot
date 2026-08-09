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
        jsonBody = await res.json();
      } catch {
        // Failed to parse JSON
      }
    } else {
      const text = await res.text();
      if (text.trim().startsWith("<")) {
        return {
          ok: false,
          status: res.status,
          error: `Backend API endpoint returned HTML (${res.status} ${res.statusText}) instead of JSON. Ensure Vercel serverless functions or API server are configured.`
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
    return {
      ok: false,
      error: e?.message || "Network request failed. Please check connection."
    };
  }
}
