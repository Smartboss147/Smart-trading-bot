import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";

async function testCombination(projectId: string, databaseId: string) {
  console.log(`\nTesting combination: Project=${projectId}, DB=${databaseId}`);
  try {
    const apps = getApps();
    await Promise.all(apps.map(app => app.delete()));
    
    const app = initializeApp({ projectId });
    const db = getFirestore(app, databaseId);
    
    console.log("Attempting read...");
    const snap = await db.collection("settings").limit(1).get();
    console.log(`SUCCESS! Found ${snap.size} docs.`);
    return true;
  } catch (e: any) {
    console.log(`FAILED: ${e.message}`);
    return false;
  }
}

async function main() {
  const config = JSON.parse(fs.readFileSync("firebase-applet-config.json", "utf-8"));
  
  const projects = ["prefab-polymer-gj1d7", "ais-europe-west2-75d1a0695ed04"];
  const databases = ["apexquant-db", config.firestoreDatabaseId, "(default)"];

  for (const p of projects) {
    for (const d of databases) {
      if (d) await testCombination(p, d);
    }
  }
}

main();
