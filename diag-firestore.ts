import * as admin from "firebase-admin";
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";

async function test() {
  console.log("Testing Firestore Connection...");
  try {
    const config = JSON.parse(fs.readFileSync("firebase-applet-config.json", "utf-8"));
    const projectId = config.projectId;
    const databaseId = config.firestoreDatabaseId;

    console.log(`Project: ${projectId}, Database: ${databaseId}`);

    const app = initializeApp({
      projectId: projectId,
      credential: applicationDefault()
    });

    const db = getFirestore(app, databaseId);
    
    console.log("Attempting write...");
    await db.collection("diag").doc("test").set({ time: Date.now() });
    console.log("Write SUCCESS!");

    console.log("Attempting read...");
    const doc = await db.collection("diag").doc("test").get();
    console.log("Read SUCCESS:", doc.data());
  } catch (e: any) {
    console.error("Test FAILED:", e.message);
    if (e.stack) console.error(e.stack);
  }
}

test();
