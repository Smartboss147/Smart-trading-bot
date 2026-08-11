import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, limit, query } from "firebase/firestore";
import fs from "fs";

async function test() {
  console.log("Testing Firestore Client SDK (Web SDK) on Server...");
  try {
    const config = JSON.parse(fs.readFileSync("firebase-applet-config.json", "utf-8"));
    
    const app = initializeApp(config);
    const db = getFirestore(app, config.firestoreDatabaseId);

    console.log(`Project: ${config.projectId}, Database: ${config.firestoreDatabaseId}`);
    
    console.log("Attempting read on 'settings'...");
    const q = query(collection(db, "settings"), limit(1));
    const snap = await getDocs(q);
    console.log(`SUCCESS! Found ${snap.size} docs.`);
  } catch (e: any) {
    console.error("Test FAILED:", e.message);
  }
}

test();
