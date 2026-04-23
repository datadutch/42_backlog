# 42 Backlog — Kanban Board

A lightweight, real-time Kanban board with three lanes: **Backlog**, **In Progress**, and **Finished**. Tasks persist across devices via a backend API.

## Architecture

```
┌─────────────────────────────────────────┐
│              Browser (any device)        │
│                                         │
│  React + TypeScript + Vite (v0.4)       │
│  - Zustand (state management)           │
│  - @hello-pangea/dnd (drag & drop)      │
│  - Polls /api/state every 5 seconds     │
└──────────────────┬──────────────────────┘
                   │ HTTPS
                   ▼
┌─────────────────────────────────────────┐
│         Uberspace (shaula.uberspace.de) │
│                                         │
│  Apache  ──►  ~/html/        (frontend) │
│  Apache  ──►  /api → :3001   (proxy)   │
│                                         │
│  Express (server.js, port 3001)         │
│  - GET  /api/state  → read JSON file    │
│  - POST /api/state  → write JSON file   │
│  - Persists to ~/42_backlog/data/       │
│  - Managed by supervisord               │
└─────────────────────────────────────────┘
```

**Live URL:** `https://bcklg42.uber.space`

## Local Development

**Prerequisites:** Node.js 18+

```bash
git clone https://github.com/datadutch/42_backlog.git
cd 42_backlog
npm install
```

Start the frontend (Vite dev server):
```bash
npm run dev
# → http://localhost:3000
```

Start the backend (Express):
```bash
node server.js
# → listens on port 3001
```

> For local dev, change `API_URL` in `src/App.tsx` to `http://localhost:3001/api/state`.

## Deploy to Uberspace

### First-time setup (run once via SSH)

```bash
ssh bcklg42@shaula.uberspace.de

# Upload project files (no node_modules)
# Install backend dependencies
cd ~/42_backlog
npm install --omit=dev

# Create supervisord service
mkdir -p ~/etc/services.d
cat > ~/etc/services.d/42_backlog-api.ini << 'EOF'
[program:42_backlog-api]
command=node /home/bcklg42/42_backlog/server.js
autostart=yes
autorestart=yes
startsecs=60
EOF

supervisorctl reread
supervisorctl update

# Register the /api reverse proxy
uberspace web backend set /api --http --port 3001
```

### Deploying updates

Always build locally, then upload:

```bash
# Build frontend
npm run build

# Upload frontend
scp -r dist/* bcklg42@shaula.uberspace.de:~/html/

# Upload backend (if server.js changed)
scp server.js bcklg42@shaula.uberspace.de:~/42_backlog/
ssh bcklg42@shaula.uberspace.de "supervisorctl restart 42_backlog-api"
```

Or use the combined deploy script:
```bash
npm run deploy
```

## Project Structure

```
42_backlog/
├── src/
│   ├── App.tsx        # Main component, Zustand store, all UI
│   └── main.tsx       # React entry point
├── server.js          # Express backend (CRUD, JSON file persistence)
├── index.html         # Vite HTML entry
├── vite.config.ts     # Vite config (port 3000)
├── tsconfig.json
├── package.json
└── data/              # Created at runtime on server
    └── kanban-state.json
```

## Debugging (on Uberspace)

```bash
supervisorctl status                        # is backend running?
supervisorctl tail 42_backlog-api           # stdout logs
supervisorctl tail 42_backlog-api stderr    # error logs
uberspace web backend list                  # proxy status
```
