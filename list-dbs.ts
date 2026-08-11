import { GoogleAuth } from "google-auth-library";
import fs from "fs";

async function listDatabases() {
  const auth = new GoogleAuth({
    scopes: "https://www.googleapis.com/auth/cloud-platform"
  });
  
  const client = await auth.getClient();
  const config = JSON.parse(fs.readFileSync("firebase-applet-config.json", "utf-8"));
  const projectId = config.projectId;

  console.log(`Checking databases for Project: ${projectId}`);
  
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases`;
  try {
    const res = await client.request({ url });
    console.log("Databases:", JSON.stringify(res.data, null, 2));
  } catch (e: any) {
    console.error("Failed to list databases:", e.message);
    if (e.response) {
      console.error("Response data:", e.response.data);
    }
  }
}

listDatabases();
