# Pocket Poll

Full-stack electronic voting platform with real-time analytics, countdown timer locking, and MongoDB support.

## Structure (Single Layer – Vercel Ready)

```
Pocket-Poll/
├── api/                  ← Vercel serverless API entry
│   └── index.ts
├── src/                  ← React frontend
│   └── components/
├── models/
├── routes/
├── middleware/
├── db.js
├── pollService.js
├── server.ts             ← Local development server
├── index.html
├── package.json
├── vite.config.ts
├── vercel.json
├── .env.example
└── README.md
```

## Local Development

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Deploy on Vercel (Important)

1. Push this folder to GitHub
2. Go to vercel.com → **Add New Project** → Import the repo
3. **Root Directory**: Select the root of this project (do NOT select any subfolder)
4. Framework Preset: **Other**
5. Build Command: `npm run build`
6. Output Directory: `dist`
7. Install Command: `npm install`
8. Add Environment Variables (optional):
   - `MONGODB_URI` = your MongoDB Atlas connection string
9. Click **Deploy**

After deploy, admin login works with:
- Username: `nazeer`
- Password: `nazeer`

## Features

- 100 pre-seeded voters (CAN-001 … CAN-100)
- 5 candidates
- One-person-one-vote
- 100-minute global countdown + manual admin bypass
- Full admin dashboard (voters, candidates, timer, analytics)
- Works with or without MongoDB (memory fallback)
