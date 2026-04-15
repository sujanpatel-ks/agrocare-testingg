# AgroCare AI: System Architecture Explanation

This document provides a detailed breakdown of the AgroCare AI system architecture. Use this as a blueprint for creating visual diagrams (e.g., in Lucidchart, Miro, or Mermaid).

---

## 1. High-Level Overview
AgroCare AI is a **Full-Stack AI-Powered Web Application** designed for farmers. It follows a modern Single Page Application (SPA) architecture with real-time AI capabilities and serverless backend integration.

### Core Pillars:
- **Client-Side Intelligence:** Gemini AI integration directly in the browser.
- **Serverless Persistence:** Firebase for Auth and Data.
- **Real-Time Interaction:** Low-latency voice via Gemini Live API.

---

## 2. Architectural Layers

### A. Presentation Layer (Frontend)
- **Framework:** React 18+ with TypeScript.
- **Build Tool:** Vite (for fast development and optimized production builds).
- **Styling:** Tailwind CSS (utility-first styling) + Framer Motion (animations).
- **State Management:** React Context API (Auth state) and standard React Hooks.
- **Routing:** Conditional rendering based on `activeScreen` state (SPA pattern).

### B. Integration Layer (AI & Services)
- **Gemini Vision API (`gemini-3-flash-preview`):** Processes crop images for disease diagnosis.
- **Gemini Live API (`gemini-3.1-flash-live-preview`):** Handles real-time, low-latency voice conversations using Web Audio API (PCM 16k).
- **Gemini TTS (`gemini-2.5-flash-preview-tts`):** Converts diagnostic text results into spoken audio for accessibility.

### C. Backend & Persistence Layer (Firebase)
- **Firebase Authentication:** Google Sign-In provider for secure user identification.
- **Cloud Firestore:** NoSQL database for storing:
    - User Profiles (`/users/{uid}`)
    - Diagnostic History (Planned)
    - Community Posts (Planned)
- **Security Rules:** Granular Firestore rules ensuring users only access their own data.

### D. Server Layer (Node.js/Express)
- **Role:** Primarily serves the static SPA files and acts as a middleware for Vite during development.
- **Environment:** Hosted on Cloud Run (Containerized).

---

## 3. Data Flow Diagrams

### Flow 1: Crop Diagnosis
1. **User** uploads/captures image via `FileUploader` or `CameraDiagnosis`.
2. **Frontend** sends base64 image data to `gemini-3-flash-preview`.
3. **Gemini** returns a structured JSON diagnosis (Disease, Severity, Treatment).
4. **Frontend** displays results and optionally triggers **TTS** to read the summary.

### Flow 2: Voice Conversation
1. **User** clicks "Talk to AI".
2. **Frontend** establishes a WebSocket connection to `gemini-3.1-flash-live-preview`.
3. **Microphone** captures audio -> Encoded to PCM -> Sent to Gemini.
4. **Gemini** processes audio + Context (Diagnosis) -> Returns Audio Chunks.
5. **Frontend** decodes and plays audio via `AudioContext`.

---

## 4. Component Hierarchy (Simplified)
```text
App (Root)
├── AuthProvider (Context)
├── Navigation (Sidebar/BottomBar)
├── Screens
│   ├── Dashboard (Weather, Tasks)
│   ├── Market (Crop Prices, Sorting)
│   ├── Diagnosis (Vision Results, Voice Trigger)
│   │   └── LiveAudioChat (Live API Session)
│   ├── Community (Posts, Schemes)
│   └── Profile (User Data, Logout)
└── Shared UI (Buttons, Modals, Loaders)
```

---

## 5. Security Architecture
- **API Keys:** Managed via environment variables (`GEMINI_API_KEY`).
- **Client-Side Safety:** Gemini API is called from the frontend as per platform guidelines, but keys are protected by the hosting environment.
- **Database Security:** Firestore Security Rules enforce that `request.auth.uid == resource.data.uid`.

---

## 6. Suggested Visual Symbols for Drawing
- **User/Farmer:** Actor icon.
- **Browser/Mobile:** Device frame.
- **Firebase:** Flame logo or Cloud Database icon.
- **Gemini AI:** Sparkle/AI brain icon.
- **API/WebSocket:** Lightning bolt or bi-directional arrows.
