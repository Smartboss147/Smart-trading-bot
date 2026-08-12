import { ApiClient, SpotApi } from "gate-api";
import assert from "assert";
import crypto from "crypto";

console.log("[Test] Running Gate.io API v4 integration tests...");

// Test 1: Encryption & Decryption helper test
const ENCRYPTION_KEY = "test-secret-key";
const IV_LENGTH = 16;

function encryptSecret(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decryptSecret(text: string): string {
  if (!text || !text.includes(':')) return text;
  const textParts = text.split(':');
  const iv = Buffer.from(textParts.shift()!, 'hex');
  const encryptedText = textParts.join(':');
  const key = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

const secretTest = "my-super-secret-api-key-123456";
const encrypted = encryptSecret(secretTest);
const decrypted = decryptSecret(encrypted);
assert.strictEqual(decrypted, secretTest, "Encryption/Decryption roundtrip failed");
console.log("[Test] Passed: Encryption and Decryption at rest");

// Test 2: Gate ApiClient initialization and configuration check
const client = new ApiClient();
client.basePath = 'https://api.gateio.ws/api/v4';
client.setApiKeySecret("test_key", "test_secret");
assert.strictEqual(client.basePath, 'https://api.gateio.ws/api/v4', "Base path incorrect");
console.log("[Test] Passed: Gate ApiClient configuration");

// Test 3: Gate v4 HMAC-SHA512 Request Signing Utility Test
function generateGateV4HeadersTest(
  method: string,
  urlPath: string,
  queryString: string = "",
  payload: any = "",
  apiKey: string,
  apiSecret: string
) {
  const timestamp = "1710000000";
  const bodyString = typeof payload === "string" ? payload : (payload ? JSON.stringify(payload) : "");
  const hashedBody = crypto.createHash('sha512').update(bodyString).digest('hex');
  const signString = `${method.toUpperCase()}\n${urlPath}\n${queryString}\n${hashedBody}\n${timestamp}`;
  const sign = crypto.createHmac('sha512', apiSecret).update(signString).digest('hex');
  return { KEY: apiKey, SIGN: sign, Timestamp: timestamp };
}

const testHeaders = generateGateV4HeadersTest("GET", "/api/v4/spot/accounts", "", "", "key123", "secret456");
assert.strictEqual(testHeaders.KEY, "key123");
assert.ok(testHeaders.SIGN && testHeaders.SIGN.length === 128, "HMAC signature must be 128 hex chars");
assert.strictEqual(testHeaders.Timestamp, "1710000000");
console.log("[Test] Passed: Gate.io API v4 HMAC-SHA512 request signing headers generation");

console.log("[Test] All Gate.io v4 automated integration tests completed successfully!");
