# Vercel Deployment Instructions for DealZone Frontend

This document explains how to deploy the **DealZone React 19 + Vite 8 SPA** to **Vercel**.

---

## 1. Prerequisites

- A [Vercel account](https://vercel.com).
- Access to the GitHub repository: `https://github.com/Dev-Mazen/DealZone`.
- Deployed MonsterASP.NET API URL (e.g. `https://dealzone-api.monsterasp.net`).

---

## 2. Monorepo Configuration on Vercel

DealZone is organized as a clean monorepo containing `backend/` and `frontend/`. When configuring Vercel, you must specify the **Root Directory** as `frontend`.

### Step-by-Step Vercel Import:

1. In the Vercel Dashboard, click **Add New...** > **Project**.
2. Select **Import Git Repository** and choose `Dev-Mazen/DealZone`.
3. In the **Configure Project** screen:
   - **Project Name:** `dealzone` (or custom name)
   - **Framework Preset:** `Vite` (automatically detected)
   - **Root Directory:** Click **Edit** and choose `frontend`
4. **Build & Development Settings:**
   - **Build Command:** `npm run build` (default)
   - **Output Directory:** `dist` (default)
   - **Install Command:** `npm install` (default)

---

## 3. Environment Variables Configuration

In the **Environment Variables** section on Vercel:

| Variable Name | Environment | Example Value | Description |
|---|---|---|---|
| `VITE_API_BASE_URL` | Production, Preview, Development | `https://dealzone-api.monsterasp.net/api/v1` | Base URL pointing to the MonsterASP.NET API |

> **Important:** Ensure the `/api/v1` prefix is included at the end of the URL.

---

## 4. SPA Routing & 404 Prevention

The repository contains `frontend/vercel.json`:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

This configuration ensures:
1. **Clean Client-Side Routing:** When a user refreshes or bookmarks deep links such as `/marketplace`, `/negotiations`, or `/deals/123`, Vercel serves `index.html` instead of a 404 error, allowing React Router to render the correct view.
2. **Asset Caching:** JavaScript and CSS chunks in `/assets/` are cached aggressively for fast reloads.

---

## 5. Deployment Verification

After deployment succeeds:

1. Click on the generated domain (e.g. `https://dealzone-xxx.vercel.app`).
2. Open DevTools (F12) > **Network** tab.
3. Test page navigation across:
   - `/marketplace`
   - `/rfqs`
   - `/deals`
   - `/login`
4. Confirm network calls are hitting `https://<monsterasp-domain>/api/v1/...` and responding with `200 OK` (no CORS errors).
5. If CORS errors appear, verify that your exact Vercel origin is registered in MonsterASP's `CorsSettings__AllowedOrigins__0`.
