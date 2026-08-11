import firebase from "firebase/compat/app";
import "firebase/compat/firestore";
import fs from "fs";

async function test() {
  console.log("Testing Firestore COMPAT Client SDK on Server...");
  try {
    const config = JSON.parse(fs.readFileSync("firebase-applet-config.json", "utf-8"));
    
    firebase.initializeApp(config);
    const db = firebase.firestore(firebase.app());

    console.log(`Project: ${config.projectId}, Database: ${config.firestoreDatabaseId}`);
    
    console.log("Attempting read on 'settings'...");
    const snap = await db.collection("settings").limit(1).get();
    console.log(`SUCCESS! Found ${snap.size} docs.`);
    process.exit(0);
  } catch (e: any) {
    console.error("Test FAILED:", e.message);
    process.exit(1);
  }
}

test();
