import crypto from "crypto";

export interface GateApiHeaders {
  KEY: string;
  SIGN: string;
  Timestamp: string;
  'Content-Type': string;
  'Accept': string;
  [key: string]: string;
}

export interface GateApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  status: number;
  requestId: string;
  rawResponse?: any;
}

export class GateApiService {
  private static baseURL: string = process.env.GATE_API_BASE_URL || "https://api.gateio.ws/api/v4";
  private static timeoutMs: number = parseInt(process.env.GATE_API_TIMEOUT_MS || "12000", 10);

  /**
   * Generates official Gate.io API v4 authentication headers using HMAC-SHA512.
   * Canonical string format:
   * METHOD + "\n" + REQUEST_URL_PATH + "\n" + QUERY_STRING + "\n" + SHA512_REQUEST_BODY + "\n" + TIMESTAMP
   * CRITICAL: REQUEST_URL_PATH must include /api/v4 prefix (e.g. /api/v4/spot/accounts).
   */
  public static generateHeaders(
    method: string,
    endpoint: string,
    queryString: string = "",
    payload: any = "",
    apiKey: string,
    apiSecret: string
  ): GateApiHeaders {
    if (!apiKey || !apiSecret) {
      throw new Error("GATE_CREDENTIALS_MISSING: API Key and Secret are required for signing.");
    }

    const timestamp = Math.floor(Date.now() / 1000).toString();
    const bodyString = typeof payload === "string" ? payload : (payload && Object.keys(payload).length > 0 ? JSON.stringify(payload) : "");
    const hashedBody = crypto.createHash('sha512').update(bodyString).digest('hex');
    
    // Ensure canonical path correctly includes /api/v4 prefix as required by Gate.io API v4 spec
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const canonicalPath = cleanEndpoint.startsWith('/api/v4') ? cleanEndpoint : `/api/v4${cleanEndpoint}`;

    const signString = `${method.toUpperCase()}\n${canonicalPath}\n${queryString}\n${hashedBody}\n${timestamp}`;
    const sign = crypto.createHmac('sha512', apiSecret.trim()).update(signString).digest('hex');

    return {
      'KEY': apiKey.trim(),
      'SIGN': sign,
      'Timestamp': timestamp,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }

  /**
   * Executes an authenticated request to Gate.io API v4 using native fetch with robust timeout and diagnostics.
   */
  public static async request(
    method: string,
    endpoint: string,
    queryParams: string = "",
    payload: any = null,
    apiKey: string,
    apiSecret: string
  ): Promise<GateApiResponse> {
    const requestId = `gate-req-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    
    // Ensure root URL is correct
    const rootBase = this.baseURL.replace(/\/api\/v4\/?$/, '');
    const canonicalPath = cleanEndpoint.startsWith('/api/v4') ? cleanEndpoint : `/api/v4${cleanEndpoint}`;
    const url = `${rootBase}${canonicalPath}${queryParams ? `?${queryParams}` : ""}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const headers = this.generateHeaders(method, cleanEndpoint, queryParams, payload, apiKey, apiSecret);
      const body = payload && method.toUpperCase() !== 'GET' 
        ? (typeof payload === 'string' ? payload : JSON.stringify(payload)) 
        : undefined;

      console.log(`[GateApiService ${requestId}] ${method.toUpperCase()} ${url}`);
      
      const response = await fetch(url, {
        method: method.toUpperCase(),
        headers,
        body,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const status = response.status;
      let data: any = null;
      const text = await response.text();
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = text;
      }

      console.log(`[GateApiService ${requestId}] Response status: ${status}`, data);

      if (status >= 200 && status < 300) {
        return {
          success: true,
          data,
          status,
          requestId,
          rawResponse: data
        };
      } else {
        const errorData = data;
        const errMessage = errorData?.message || errorData?.label || (typeof errorData === 'string' ? errorData : JSON.stringify(errorData)) || "Gate.io API error";
        const errLabel = errorData?.label || `GATE_HTTP_${status}`;
        
        let errorCode = errLabel;
        if (status === 401) {
          if (errLabel === "INVALID_KEY" || errMessage.toLowerCase().includes("invalid key")) {
            errorCode = "GATE_INVALID_KEY";
          } else if (errLabel === "INVALID_SIGNATURE" || errMessage.toLowerCase().includes("signature")) {
            errorCode = "GATE_INVALID_SIGNATURE";
          } else {
            errorCode = "GATE_AUTH_FAILED";
          }
        } else if (status === 403) {
          const msgLower = (errMessage + " " + errLabel).toLowerCase();
          if (msgLower.includes('ip') || msgLower.includes('whitelist') || msgLower.includes('forbidden')) {
            errorCode = "GATE_IP_RESTRICTED";
          } else {
            errorCode = "GATE_PERMISSION_DENIED";
          }
        } else if (status === 429) {
          errorCode = "GATE_RATE_LIMIT";
        } else if (status >= 500) {
          errorCode = "GATE_SERVER_ERROR";
        }

        return {
          success: false,
          error: errMessage,
          code: errorCode,
          status,
          requestId,
          rawResponse: errorData
        };
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      const isAbort = err.name === 'AbortError';
      console.error(`[GateApiService ${requestId}] Network/System error:`, err.message);
      return {
        success: false,
        error: isAbort ? "Gate.io API request timed out (12s). Please check your internet or retry." : (err.message || "Network connection error"),
        code: isAbort ? 'GATE_TIMEOUT' : 'GATE_NETWORK_ERROR',
        status: isAbort ? 504 : 502,
        requestId
      };
    }
  }

  /**
   * Validates credentials against Gate.io spot accounts endpoint.
   */
  public static async testConnection(apiKey: string, apiSecret: string): Promise<GateApiResponse> {
    return this.request('GET', '/spot/accounts', '', null, apiKey, apiSecret);
  }

  public static async checkConnectivity(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(`${this.baseURL}/spot/currencies`, { signal: controller.signal });
      clearTimeout(timeoutId);
      return res.status === 200;
    } catch (e) {
      return false;
    }
  }
}
