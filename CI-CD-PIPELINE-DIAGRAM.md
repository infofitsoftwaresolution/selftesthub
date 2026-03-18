# CI/CD Pipeline Visualization

## 🔄 Complete Workflow Diagram

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                         GitHub Repository                                     │
│                       (selftesthub project)                                   │
└──────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ git push origin main
                                    ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                      GitHub Actions Workflow                                  │
│                      (.github/workflows/ci-cd.yml)                            │
└──────────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
                    ▼               ▼               ▼
        ┌─────────────────┐  ┌─────────────────┐
        │ Frontend Tests  │  │ Backend Tests   │
        ├─────────────────┤  ├─────────────────┤
        │ • npm ci        │  │ • npm ci        │
        │ • lint          │  │ • lint          │
        │ • build         │  │ • audit         │
        │ • verify dist/  │  │ • test          │
        └────────┬────────┘  └────────┬────────┘
                 │                    │
                 └─────────┬──────────┘
                           │
                    ❌ Tests Failed? ─→ Notify & Stop
                           │
                    ✅ Tests Passed
                           │
                           ▼
        ┌─────────────────────────────────────┐
        │ Build Docker Images (if main)       │
        ├─────────────────────────────────────┤
        │ • Build frontend image              │
        │ • Build backend image               │
        │ • Push to registry                  │
        └─────────────────┬───────────────────┘
                          │
                   ❌ Build Failed? ─→ Notify & Stop
                          │
                   ✅ Build Complete
                          │
                          ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                    DEPLOYMENT STAGE                                           │
│                  (Only on main branch)                                        │
└──────────────────────────────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┴─────────────────┐
        │                                   │
        ▼                                   ▼
    ┌─ Build Frontend ─┐          ┌─ Prepare Backend ─┐
    │ • npm install    │          │ • npm install     │
    │ • npm run build  │          │ • Create .env     │
    │ • Output: dist/  │          │ • Secrets applied │
    └────────┬─────────┘          └────────┬──────────┘
             │                             │
             └────────────┬────────────────┘
                          │
                          ▼
        ┌─────────────────────────────────────┐
        │ Create Deployment Package           │
        ├─────────────────────────────────────┤
        │ • Copy backend/ folder              │
        │ • Copy frontend/dist/ folder        │
        │ • Include deploy scripts            │
        │ • Create tar.gz archive             │
        └────────────────┬────────────────────┘
                         │
                         ▼
        ┌─────────────────────────────────────┐
        │ SSH Test Connection                 │
        ├─────────────────────────────────────┤
        │ • Verify server reachable           │
        │ • Verify credentials                │
        │ • Get server info                   │
        └────────────────┬────────────────────┘
                         │
                ❌ Connection Failed? ─→ Stop
                         │
                ✅ Connection OK
                         │
                         ▼
        ┌─────────────────────────────────────┐
        │ Transfer to Server (13.201.50.33)  │
        ├─────────────────────────────────────┤
        │ • SCP deployment package            │
        │ • /tmp/deploy.tar.gz                │
        │ • Uses SSH key auth                 │
        └────────────────┬────────────────────┘
                         │
                ❌ Transfer Failed? ─→ Stop
                         │
                ✅ Transfer Complete
                         │
                         ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│              REMOTE EXECUTION ON SERVER (13.201.50.33)                       │
└──────────────────────────────────────────────────────────────────────────────┘
                         │
        ┌────────────────┴──────────────────┐
        │                                   │
        ▼                                   ▼
    ┌─ Extract Files ─┐           ┌─ Setup Backend ─┐
    │ • tar -xzf      │           │ • cd backend    │
    │ • Verify files  │           │ • npm install   │
    │ • Set perms     │           │ • Create .env   │
    └────────┬────────┘           └────────┬────────┘
             │                             │
             └────────────┬────────────────┘
                          │
                          ▼
        ┌─────────────────────────────────────┐
        │ Apply Environment Variables         │
        ├─────────────────────────────────────┤
        │ • NODE_ENV=production               │
        │ • PORT=5001                         │
        │ • JWT_SECRET=***                    │
        │ • DATABASE_URL=***                  │
        │ • FRONTEND_URL=http://13.201.50.33 │
        │ • API_URL=http://13.201.50.33/api  │
        └────────────────┬────────────────────┘
                         │
                         ▼
        ┌─────────────────────────────────────┐
        │ Start Backend with PM2              │
        ├─────────────────────────────────────┤
        │ • PORT=5001 pm2 start server.js     │
        │ • pm2 save (auto-restart)           │
        │ • Process monitoring enabled        │
        └────────────────┬────────────────────┘
                         │
                ❌ Backend Failed? ─→ Check logs
                         │
                ✅ Backend Running
                         │
                         ▼
        ┌─────────────────────────────────────┐
        │ Configure NGINX                     │
        ├─────────────────────────────────────┤
        │ • Generate nginx config             │
        │ • frontend @ /                      │
        │ • proxy /api → :5001                │
        │ • sudo systemctl reload nginx       │
        └────────────────┬────────────────────┘
                         │
                ❌ NGINX Failed? ─→ Check config
                         │
                ✅ NGINX Running
                         │
                         ▼
        ┌─────────────────────────────────────┐
        │ Verify Permissions & Ownership      │
        ├─────────────────────────────────────┤
        │ • chmod, chown frontend-dist/       │
        │ • Verify NGINX can read files       │
        │ • Check PM2 process owner           │
        └────────────────┬────────────────────┘
                         │
                         ▼
        ┌─────────────────────────────────────┐
        │ Wait for Services (8 seconds)       │
        └────────────────┬────────────────────┘
                         │
                         ▼
        ┌─────────────────────────────────────┐
        │ Health Checks                       │
        ├─────────────────────────────────────┤
        │ • Check backend: :5001/api/health   │
        │ • Check frontend: / via NGINX       │
        │ • Verify HTTP 200/304               │
        │ • View pm2 status & logs            │
        └────────────────┬────────────────────┘
                         │
             ┌──→ Check Issues ──→ Continue Anyway
             │
             ▼
        ┌─────────────────────────────────────┐
        │ DEPLOYMENT SUCCESS! 🎉              │
        ├─────────────────────────────────────┤
        │ App Live at:                        │
        │ • http://13.201.50.33               │
        │ • http://13.201.50.33/api           │
        └─────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│              Back to GitHub Actions                                           │
└──────────────────────────────────────────────────────────────────────────────┘
                         │
                         ▼
        ┌─────────────────────────────────────┐
        │ Send Notification                   │
        ├─────────────────────────────────────┤
        │ • Deployment Status: Success/Failed │
        │ • Application URL                   │
        │ • Useful commands                   │
        │ • Summary in GitHub UI              │
        └─────────────────────────────────────┘


```

## 📊 Service Architecture After Deployment

```
┌─────────────────────────────────────────────────────┐
│          Client Browser / API Consumer              │
└────────────────────────┬────────────────────────────┘
                         │
            ┌────────────▼────────────┐
            │  http://13.201.50.33    │
            │      Port 80 (HTTP)     │
            └────────────┬────────────┘
                         │
            ┌────────────▼────────────┐
            │  NGINX Reverse Proxy    │
            │  (/etc/nginx/conf.d/)   │
            └────┬──────────────┬─────┘
                 │              │
        ┌────────▼────┐  ┌──────▼─────────┐
        │   Root (/)  │  │   /api (path)  │
        │             │  │                │
        └──────┬──────┘  └────────┬───────┘
               │                  │
        ┌──────▼──────────┐      │
        │  Frontend Dist  │      │
        │  (React Bundle) │      │
        │                 │      │
        │ • index.html    │      │
        │ • assets/       │      │
        │ • components    │      │
        │                 │      │
        │ Port: Via NGINX │      │
        └──────────────────┘      │
                                 │
                        ┌────────▼────────┐
                        │  Backend PM2    │
                        │  (Node.js)      │
                        │                 │
                        │ • server.js     │
                        │ • .env          │
                        │ • node_modules  │
                        │                 │
                        │ Port: 5001      │
                        └────────┬────────┘
                                 │
                        ┌────────▼────────┐
                        │   Database      │
                        │   (Connection   │
                        │    via URL)     │
                        └─────────────────┘
```

## 📈 Request Flow Example

```
1. User visits http://13.201.50.33 in browser
   └─→ NGINX receives request on port 80
       └─→ Checks path = "/"
           └─→ Serves frontend-dist/index.html
               └─→ Browser loads React app ✅

2. Frontend makes API call to /api/quiz
   └─→ Browser sends: GET /api/quiz
       └─→ NGINX receives request on port 80
           └─→ Checks path = "/api/..."
               └─→ Proxies to http://localhost:5001/api/quiz
                   └─→ PM2 backend process handles request
                       └─→ Returns JSON response ✅
                           └─→ Response sent through NGINX
                               └─→ Frontend receives data ✅
```

## 🔐 Secrets Injection Flow

```
GitHub Repository
├─ Settings
│  └─ Secrets & Variables
│     ├─ DEPLOY_SSH_KEY
│     ├─ DEPLOY_USER
│     ├─ JWT_SECRET
│     ├─ DATABASE_URL
│     ├─ EMAIL_USER
│     └─ EMAIL_PASS
│        ↓ (during workflow execution)
│        ↓
├─ Workflow reads secrets
│  ├─ Uses DEPLOY_SSH_KEY for authentication
│  ├─ Uses DATABASE_URL in deployment script
│  ├─ Uses JWT_SECRET in .env file
│  ├─ Uses EMAIL_USER & EMAIL_PASS in .env file
│  └─ Logs never show secret values ✓
│
└─→ Creates .env on server with values
    └─→ Backend application reads .env
        └─→ Values available to Express app ✓
```

## 📋 File Transfer Process

```
GitHub Actions Machine          →          Production Server (13.201.50.33)
                                            
┌──────────────────┐                       ┌──────────────────┐
│ Build complete    │                      │ Ready to receive │
│ Created:          │                      │ SSH access ready │
│ deploy.tar.gz     │                      └──────────────────┘
│ (complete app)    │
└────────┬──────────┘
         │
         │ 1. Create SSH connection
         │    (using DEPLOY_SSH_KEY)
         │                              ──────→ SSH connection established
         │
         │ 2. Send deploy.tar.gz via SCP
         │    (base64 encoded)
         │                              ──────→ Receives /tmp/deploy.tar.gz
         │
         │ 3. Execute deployment script
         │    via SSH                  
         │                              ──────→ Extracts tar.gz
         │                              ──────→ Runs setup commands
         │                              ──────→ Starts services
         │                              ──────→ Returns status
         │
         └──────────────────────────────── Connection closed

```

## 🎯 Environment Variables Journey

```
User defines in GitHub
    │
    ├─ DEPLOY_SSH_KEY (private key)
    ├─ DEPLOY_USER (ubuntu)
    ├─ JWT_SECRET (random string)
    ├─ DATABASE_URL (connection string)
    ├─ EMAIL_USER (email)
    └─ EMAIL_PASS (password)
    
    │ (Workflow reads from GitHub Secrets)
    │
    ├─→ Uses for SSH auth (DEPLOY_SSH_KEY)
    ├─→ Uses SSH username (DEPLOY_USER)
    │
    ├─→ Creates script template with placeholders
    │   Replaces: {JWT_SECRET} → actual value
    │   Replaces: {DATABASE_URL} → actual value
    │   Replaces: {EMAIL_USER} → actual value
    │   Replaces: {EMAIL_PASS} → actual value
    │
    │ (Sends as part of deployment script)
    │
    └─→ On Server: Creates .env file with values
        │
        └─→ Backend Node.js app reads .env
            │
            └─→ Values available as process.env.*
                ├─ process.env.JWT_SECRET
                ├─ process.env.DATABASE_URL
                ├─ process.env.EMAIL_USER
                └─ process.env.EMAIL_PASS
```

## 🔄 GitHub Workflow Sequence

```
Time  Event                          Status
────  ──────────────────────────────────────────
  0s  Push to main branch            ⏳ Pending
  5s  Workflow triggered             ⏳ Running
 10s  Checkout code                  ✅ Done
 15s  Setup Node.js 18               ✅ Done
 30s  Frontend install deps          ⏳ Running
  1m  Frontend build                 ⏳ Building
  2m  Frontend build done            ✅ Done
      Backend install deps           ⏳ Running
  3m  Backend deps done              ✅ Done
      Docker build starts            ⏳ Building
  4m  Docker push                    ⏳ Uploading
  5m  Create deploy package          ⏳ Packing
  6m  Test SSH connection            ⏳ Connecting
  7m  Transfer deployment pkg        ⏳ Uploading (15-30 min)
 10m  SSH deployment starts          ⏳ Running
      Extract & setup                ⏳ Extracting
      Install backend deps           ⏳ Installing
      Start PM2                      ⏳ Starting
      Setup NGINX                    ⏳ Configuring
 15m  Health checks                  ⏳ Checking
 16m  Deployment success             ✅ Done
      Send notification              ✅ Sent
```

## 📊 Resource Usage During Deployment

```
GitHub Actions Machine:
├─ Disk: ~500MB (frontend build + backend)
├─ Memory: ~1GB (Node.js processes)
├─ CPU: ~50% (build tasks)
└─ Duration: 5-10 minutes

Production Server (13.201.50.33):
├─ Disk: ~300MB (application files)
├─ Memory: ~200-500MB (Node.js running)
├─ CPU: ~10-20% (normal operation)
└─ Uptime: Continuous (PM2 auto-restart)
```

## 🎯 Success Criteria After Deployment

```
✅ GitHub Actions Workflow:
   └─ All jobs completed successfully (no red ❌)
   
✅ Server Processes:
   └─ pm2 status shows selftesthub-backend running
   
✅ NGINX:
   └─ sudo systemctl status nginx shows active
   
✅ Frontend:
   └─ http://13.201.50.33 loads and displays app
   
✅ Backend:
   └─ http://13.201.50.33/api responds with data
   
✅ Health Checks:
   └─ Workflow logs show "✅ Health check passed"
```

---

This diagram represents the complete CI/CD pipeline from code push to live application!
