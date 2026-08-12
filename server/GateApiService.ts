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
}

export class GateApiService {
  private static baseURL: string = process.env.GATE_API_BASE_URL || "https://api.gateio.ws/api/v4";
  private static timeoutMs: number = parseInt(process.env.GATE_API_TIMEOUT_MS || "10000", 10);

  /**
   * Generates official Gate.io API v4 authentication headers using HMAC-SHA512.
   * Canonical string format:
   * METHOD + "\n" + REQUEST_URL_PATH + "\n" + QUERY_STRING + "\n" + SHA512_REQUEST_BODY + "\n" + TIMESTAMP
   */
  public static generateHeaders(
    method: string,
    urlPath: string,
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
    
    const canonicalPath = urlPath.startsWith('/') ? urlPath : `/${urlPath}`;
    const signString = `${method.toUpperCase()}\n${canonicalPath}\n${queryString}\n${hashedBody}\n${timestamp}`;
    const sign = crypto.createHmac('sha512', apiSecret).update(signString).digest('hex');

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
    const fullPath = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${this.baseURL}${fullPath}${queryParams ? `?${queryParams}` : ""}`;

    try {
      const headers = this.generateHeaders(method, fullPath, queryParams, payload, apiKey, apiSecret);
      
      const config: AxiosRequestConfig = {
        method: method.toUpperCase(),
        url,
        headers,
        data: payload && method.toUpperCase() !== 'GET' ? payload : undefined,
        timeout: this.timeoutMs,
        validateStatus: () => true // Accept status codes to handle precise errors
      };

      console.log(`[GateApiService ${requestId}] Executing ${method.toUpperCase()} ${fullPath}`);
      const response = await axios(config);

      if (response.status >= 200 && response.status < 300) {
        return {
          success: true,
          data: response.data,
          status: response.status,
          requestId
        };
      } else {
        const errorMsg = response.data?.message || response.data?.label || JSON.stringify(response.data) || "Gate.io API error";
        console.error(`[GateApiService ${requestId}] Gate error status ${response.status}:`, errorMsg);
        return {
          success: false,
          error: errorMsg,
          code: `GATE_HTTP_${response.status}`,
          status: response.status,
          requestId
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
}
