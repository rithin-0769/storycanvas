# Storycanvas

A full-stack visual world-building tool for novel authors.

## Stack
- **Frontend**: React + Vite + React Flow + React Router
- **Backend**: Node.js + Express + SQLite (better-sqlite3) + JWT
- **AI**: Claude API (streaming lore expansion)

No external database service needed — SQLite is a single file that lives inside the `server/db/` folder.

## Setup

### 1. Install dependencies
```bash
cd client && npm install
cd ../server && npm install
```

### 2. Configure environment variables

**server/.env**
```
PORT=3001
JWT_SECRET=your-secret-here
CLIENT_URL=http://localhost:5173
```

**client/.env**
```
VITE_API_URL=http://localhost:3001/api
```

### 3. Run locally
```bash
# Terminal 1 - Server
cd server && npm run dev

# Terminal 2 - Client
cd client && npm run dev
```

The SQLite file is created automatically at `server/db/storycanvas.db` on first run.

## Deploy

See `DEPLOYMENT_GUIDE.md` for full step-by-step instructions.

- **Frontend → Vercel**
- **Backend → Render**
