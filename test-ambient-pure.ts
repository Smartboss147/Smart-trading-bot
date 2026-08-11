import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

async function test() {
  console.log("Testing Ambient Firestore (No Project ID)...");
  try {
    const app = initializeApp();
    console.log("Ambient Project ID:", app.options.projectId);
    const db = getFirestore(app);
    console.log("Attempting read on (default)...");
    const snap = await db.collection("settings").limit(1).get();
    console.log("SUCCESS!");
  } catch (e: any) {
    console.error("FAILED:", e.message);
  }
}

test();
