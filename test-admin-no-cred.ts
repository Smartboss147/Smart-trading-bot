import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";

async function test() {
  console.log("Testing Firestore Admin (Explicit Project, No Credential)...");
  try {
    const config = JSON.parse(fs.readFileSync("firebase-applet-config.json", "utf-8"));
    const app = initializeApp({ projectId: config.projectId });
    const db = getFirestore(app, config.firestoreDatabaseId);
    console.log(`Project: ${config.projectId}, Database: ${config.firestoreDatabaseId}`);
    console.log("Attempting read...");
    const snap = await db.collection("settings").limit(1).get();
    console.log("SUCCESS!");
  } catch (e: any) {
    console.error("FAILED:", e.message);
  }
}

test();
