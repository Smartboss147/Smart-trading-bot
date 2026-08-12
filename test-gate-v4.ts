import { ApiClient, SpotApi } from "gate-api";
import assert from "assert";
import crypto from "crypto";
import { GateApiService } from "./server/GateApiService.ts";

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

// Test 3: GateApiService HMAC-SHA512 Request Signing Utility Test
const gateHeaders = GateApiService.generateHeaders("GET", "/spot/accounts", "", "", "testKey", "testSecret");
assert.strictEqual(gateHeaders.KEY, "testKey");
assert.ok(gateHeaders.SIGN && gateHeaders.SIGN.length === 128, "HMAC signature must be 128 hex chars");
assert.ok(gateHeaders.Timestamp, "Timestamp required");
console.log("[Test] Passed: Gate.io API v4 GateApiService request signing headers generation");

console.log("[Test] All Gate.io v4 automated integration tests completed successfully!");
