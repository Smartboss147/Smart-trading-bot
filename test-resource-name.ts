import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

async function test() {
  console.log("Testing Firestore Admin (Resource Name DB ID)...");
  try {
    const app = initializeApp({ projectId: "prefab-polymer-gj1d7" });
    const db = getFirestore(app, "apexquant-db");
    console.log("Attempting read...");
    const snap = await db.collection("settings").limit(1).get();
    console.log("SUCCESS!");
  } catch (e: any) {
    console.error("FAILED:", e.message);
  }
}

test();
