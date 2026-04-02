import express from "express";
import { createServer as createViteServer } from "vite";
import * as admin from "firebase-admin";
import fs from "fs";
import path from "path";

// Initialize Firebase Admin
let db: admin.firestore.Firestore | null = null;

try {
  const serviceAccountPath = path.resolve(process.cwd(), 'service-account.json');
  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    db = admin.firestore();
    console.log("Firebase Admin initialized successfully.");
  } else {
    console.warn("service-account.json not found. Firebase Admin is not initialized.");
  }
} catch (error) {
  console.error("Failed to initialize Firebase Admin:", error);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- API ROUTES ---
  
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", databaseConnected: !!db });
  });

  // Example: Save a diagnosis result
  app.post("/api/diagnoses", async (req, res) => {
    try {
      if (!db) {
        return res.status(503).json({ error: "Database not initialized" });
      }
      const data = req.body;
      const docRef = await db.collection("diagnoses").add({
        ...data,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
      res.json({ success: true, id: docRef.id });
    } catch (error: any) {
      console.error("Error saving diagnosis:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Example: Get diagnosis history
  app.get("/api/diagnoses", async (req, res) => {
    try {
      if (!db) {
        return res.status(503).json({ error: "Database not initialized" });
      }
      const snapshot = await db.collection("diagnoses").orderBy("timestamp", "desc").limit(20).get();
      const diagnoses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.json({ success: true, data: diagnoses });
    } catch (error: any) {
      console.error("Error fetching diagnoses:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // User Profile Routes
  app.get("/api/profile", async (req, res) => {
    try {
      if (!db) {
        return res.status(503).json({ error: "Database not initialized" });
      }
      // Hardcoded user ID for demo purposes. In a real app, use auth token.
      const userId = "default_user_123"; 
      const doc = await db.collection("users").doc(userId).get();
      
      if (doc.exists) {
        res.json({ success: true, data: doc.data() });
      } else {
        // Return default profile if not found
        const defaultProfile = {
          name: 'Ramesh Kumar',
          address: 'Karnataka, India',
          phone: '+91 98765 43210',
          size: '5 Acres',
          crops: 'Tomato, Corn, Potato',
          soilType: 'Red Loamy',
          irrigation: 'Drip Irrigation'
        };
        res.json({ success: true, data: defaultProfile });
      }
    } catch (error: any) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/profile", async (req, res) => {
    try {
      if (!db) {
        return res.status(503).json({ error: "Database not initialized" });
      }
      const userId = "default_user_123";
      const profileData = req.body;
      
      await db.collection("users").doc(userId).set({
        ...profileData,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error saving profile:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // --- VITE MIDDLEWARE ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
