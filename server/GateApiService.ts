import crypto from "crypto";
import axios, { AxiosRequestConfig } from "axios";

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
  private static timeoutMs: number = parseInt(process.env.GATE_API_TIMEOUT_MS || "15000", 10);

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

    console.log(`[GateSign] Method: ${method.toUpperCase()} | Path: ${canonicalPath} | Timestamp: ${timestamp} | BodyHash: ${hashedBody.substring(0, 10)}... | Sign: ${sign.substring(0, 10)}...`);

    return {
      'KEY': apiKey.trim(),
      'SIGN': sign,
      'Timestamp': timestamp,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }

  /**
   * Executes an authenticated request to Gate.io API v4 with robust timeout, error handling, and diagnostics.
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
    const url = `${rootBase}${cleanEndpoint.startsWith('/api/v4') ? cleanEndpoint : `/api/v4${cleanEndpoint}`}${queryParams ? `?${queryParams}` : ""}`;

    try {
      const headers = this.generateHeaders(method, cleanEndpoint, queryParams, payload, apiKey, apiSecret);
      
      const config: AxiosRequestConfig = {
        method: method.toUpperCase(),
        url,
        headers,
        data: payload && method.toUpperCase() !== 'GET' ? payload : undefined,
        timeout: this.timeoutMs,
        validateStatus: () => true // Accept all status codes to inspect Gate error messages
      };

      console.log(`[GateApiService ${requestId}] Executing ${method.toUpperCase()} ${url}`);
      const response = await axios(config);

      console.log(`[GateApiService ${requestId}] Response status: ${response.status}`, response.data);

      if (response.status >= 200 && response.status < 300) {
        return {
          success: true,
          data: response.data,
          status: response.status,
          requestId,
          rawResponse: response.data
        };
      } else {
        const errorData = response.data;
        const errMessage = errorData?.message || errorData?.label || JSON.stringify(errorData) || "Gate.io API error";
        
        let errorCode = `GATE_HTTP_${response.status}`;
        if (response.status === 401) {
          errorCode = "GATE_AUTH_FAILED";
        } else if (response.status === 403) {
          const msgLower = errMessage.toLowerCase();
          if (msgLower.includes('ip') || msgLower.includes('whitelist')) {
            errorCode = "GATE_IP_RESTRICTED";
          } else {
            errorCode = "GATE_PERMISSION_DENIED";
          }
        } else if (response.status === 429) {
          errorCode = "GATE_RATE_LIMIT";
        } else if (response.status >= 500) {
          errorCode = "GATE_SERVER_ERROR";
        }

        return {
          success: false,
          error: errMessage,
          code: errorCode,
          status: response.status,
          requestId,
          rawResponse: errorData
        };
      }
    } catch (err: any) {
      console.error(`[GateApiService ${requestId}] Network/System error:`, err.message);
      return {
        success: false,
        error: err.message || "Network timeout or connection error",
        code: err.code === 'ECONNABORTED' ? 'GATE_TIMEOUT' : 'GATE_NETWORK_ERROR',
        status: 504,
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
      const res = await axios.get(`${this.baseURL}/spot/currencies`, { timeout: 5000 });
      return res.status === 200;
    } catch (e) {
      return false;
    }
  }
}
