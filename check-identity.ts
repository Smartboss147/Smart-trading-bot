import { GoogleAuth } from "google-auth-library";

async function checkIdentity() {
  const auth = new GoogleAuth();
  const client = await auth.getClient();
  const credentials = await auth.getCredentials();
  console.log("Client Email:", (client as any).email || "No email found");
  console.log("Credentials:", JSON.stringify(credentials, null, 2));
}

checkIdentity();
