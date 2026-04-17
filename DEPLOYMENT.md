# SentinelAI Deployment Guide

This guide describes how to deploy the SentinelAI Forensic Workbench to production using **Vercel** (Frontend) and **Render** (Backend).

## Prerequisites
- A [GitHub](https://github.com/) account with the SentinelAI repository pushed.
- A [Vercel](https://vercel.com/) account.
- A [Render](https://render.com/) account.

---

## 1. Backend Deployment (Render)

1. **Sign in to Render** and click **"New"** > **"Web Service"**.
2. **Connect your GitHub repository**.
3. **Configure the service settings**:
   - **Name**: `sentinel-ai-backend`
   - **Root Directory**: `backend` (Important!)
   - **Language**: `Python`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app`
4. **Environment Variables**:
   Click **"Advanced"** > **"Add Environment Variable"**:
   - `VITE_SUPABASE_URL`: (Your Supabase URL)
   - `VITE_SUPABASE_ANON_KEY`: (Your Supabase Anon Key)
   - `OPENAI_API_KEY`: (Your OpenAI Key for Playbooks)
   - `FRONTEND_URL`: (Wait until step 2 is complete to fill this in)
5. **Click "Deploy Web Service"**.
   - Note the provided URL (e.g., `https://sentinel-ai-backend.onrender.com`).

---

## 2. Frontend Deployment (Vercel)

1. **Sign in to Vercel** and click **"Add New" Project**.
2. **Import your GitHub repository**.
3. **Configure the project**:
   - **Framework Preset**: `Vite` (Should be auto-detected)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. **Environment Variables**:
   Add the following:
   - `VITE_SUPABASE_URL`: (Your Supabase URL)
   - `VITE_SUPABASE_ANON_KEY`: (Your Supabase Anon Key)
   - `VITE_API_URL`: (The URL of your Render backend from Step 1)
5. **Click "Deploy"**.
   - Note your Vercel URL (e.g., `https://sentinel-ai.vercel.app`).

---

## 3. Final Step: Handshake

Go back to your **Render (Backend)** settings and update the `FRONTEND_URL` environment variable with your new Vercel URL. This ensures CORS is properly restricted to your production site.

---

## 4. Operational Notes
- **Persistence**: Because the backend uses ephemeral storage, the `logs/sentinel.log` file will reset on every code push or restart. However, all incidents and forensic data are persistently stored in **Supabase**.
- **Cold Starts**: On Free tiers, the backend may take 30-50 seconds to "wake up" after inactivity.
