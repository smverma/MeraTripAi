# MeraTripAi — AI Travel Planner (Frontend + Backend)

This repository contains a minimal, deployable demo of MeraTripAi: an AI-powered travel itinerary generator with voice support (Hindi + English), PDF export, and Supabase storage for shareable PDF links.

## What you get
- React frontend (Vite) in /frontend
- Node/Express backend in /backend
  - POST /api/itinerary — generates itinerary via OpenAI
  - POST /api/upload-pdf — uploads PDF to Supabase Storage and returns public URL

---

## Quick setup (local)

### 1) Supabase
1. Create a Supabase project at https://app.supabase.com/
2. Create a Storage bucket (e.g., public) and set it to public or use public object URLs.
3. From project settings → API, get:
   - SUPABASE_URL
   - SUPABASE_SERVICE_ROLE_KEY (for uploads from server) or SUPABASE_ANON_KEY (less recommended)

### 2) OpenAI API Key
Get an API key from https://platform.openai.com/

### 3) Configure env vars for backend
Create a .env file in /backend (Render/Production will use platform env vars):

OPENAI_API_KEY=sk-...
SUPABASE_URL=https://xyzcompany.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_BUCKET=public

### 4) Run locally
# backend
cd backend
npm install
node index.js
# frontend
cd ../frontend
npm install
npm run dev

Open the frontend (Vite) URL and update VITE_API_URL in Vercel (for production) to point to your deployed backend.

---

## Deployment (production-ready)

### Frontend (Vercel)
1. Push repo to GitHub.
2. Import project in Vercel → select /frontend as root.
3. Set build command npm run build and output directory dist.
4. Add Environment Variable:
   - VITE_API_URL = https://<your-backend-domain>
5. Deploy.

### Backend (Render / Railway)
1. Import repo to Render / Railway and select /backend as root.
2. Set start command: npm start
3. Add environment variables (on the platform):
   - OPENAI_API_KEY
   - SUPABASE_URL
   - SUPABASE_SERVICE_ROLE_KEY
   - SUPABASE_BUCKET (e.g., public)

Render will give you an HTTPS endpoint like https://meratripai-backend.onrender.com. Use that as VITE_API_URL.

---

## Notes & Security
- Do not expose OPENAI_API_KEY or SUPABASE_SERVICE_ROLE_KEY publicly. Use platform env vars.
- For public file links we used Supabase public object path. If you want privacy, implement signed URLs.
- Add rate-limiting / authentication to avoid abuse.

---

## Next steps I can help with
- Add user accounts (Supabase Auth)
- Save/retrieve saved itineraries
- Add images and maps to itinerary cards
- Deploy a GitHub Actions CI/CD pipeline and render.yaml / vercel.json

Enjoy — MeraTripAi 🚀
