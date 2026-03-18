# CI/CD Implementation for SelfTestHub

## 🎯 Overview

This directory contains the complete CI/CD (Continuous Integration/Continuous Deployment) setup for the SelfTestHub application. The pipeline automatically:

1. **Tests** the application (frontend & backend)
2. **Builds** the application
3. **Deploys** to the production server (13.201.50.33)

## 📁 Files in This Directory

### Workflow Definition
- **`workflows/ci-cd.yml`** - Main GitHub Actions workflow file
  - Automatically triggered on `push` to `main` or `develop` branches
  - Runs on pull requests
  - Can be manually triggered via GitHub Actions UI

### Documentation
- **`QUICK-START.md`** - Start here! Step-by-step setup guide
- **`CI-CD-SETUP.md`** - Detailed technical documentation
- **`GITHUB-SECRETS.md`** - How to configure GitHub secrets
- **`README.md`** - This file

## 🚀 Quick Start (5 minutes)

**For the impatient:**

1. **Read**: [QUICK-START.md](QUICK-START.md) (seriously, read this first)
2. **Prepare**: SSH key and server access
3. **Configure**: Add secrets to GitHub (7 required)
4. **Push**: Commit code to `main` branch
5. **Monitor**: Check GitHub Actions tab
6. **Access**: http://13.201.50.33

## 📋 CI/CD Pipeline Stages

### 1️⃣ Frontend Tests & Lint
```
✅ Install dependencies
✅ Run linting (if configured)
✅ Build production bundle with Vite
✅ Verify build artifacts exist
```

### 2️⃣ Backend Tests & Lint
```
✅ Install dependencies
✅ Run linting (if configured)
✅ Security audit
✅ Run tests (if configured)
```

### 3️⃣ Build Docker Images
```
✅ Build frontend Docker image
✅ Build backend Docker image
✅ Push to GitHub Container Registry
```
*Note: Only runs on pushes to `main` branch*

### 4️⃣ Deploy to Production
```
✅ Build optimized frontend
✅ Create deployment package
✅ Transfer via SSH to server
✅ Extract and setup backend
✅ Configure NGINX reverse proxy
✅ Start backend with PM2
✅ Run health checks
✅ Verify accessibility
```
*Note: Only runs on pushes to `main` branch*

### 5️⃣ Send Notification
```
✅ Send deployment status
✅ Provide application URL
```

## 🔧 What's Included

### Automatic Processes

#### Frontend Build
- Installs dependencies from `package-lock.json`
- Sets environment variable: `VITE_API_URL=http://13.201.50.33/api`
- Builds optimized production bundle
- Outputs to `frontend/dist/`

#### Backend Setup
- Installs production dependencies
- Creates `.env` file with configuration
- Starts process with PM2 on port 5001
- Saves PM2 configuration for persistence

#### Reverse Proxy
- Configures NGINX to serve frontend
- Routes `/api/*` requests to backend on port 5001
- Proper headers for WebSockets support
- CORS-friendly configuration

#### Database & Email
- Reads from GitHub Secrets
- Applies to backend `.env` file
- Available to backend application immediately

## 🔐 Security Features

✅ **Secrets Management**
- All sensitive data stored in GitHub Secrets
- Never logged or exposed in CI/CD output
- Rotated regularly by your team

✅ **SSH Authentication**
- Uses SSH key pairs (ed25519 recommended)
- No passwords in logs or configurations
- Key-based access to production server

✅ **Isolated Deployments**
- Each deployment is independent
- Previous versions can be rolled back
- Clean environment for each build

✅ **Health Checks**
- Verifies backend is running
- Confirms frontend is accessible
- Reports any startup issues

## 📊 Branching Strategy

| Branch | CI/CD Behavior |
|--------|---|
| `main` | ✅ Tests → ✅ Build → ✅ Deploy to production |
| `develop` | ✅ Tests only (no deploy) |
| Feature branches | ✅ Tests only (no deploy) |
| `pull_request` | ✅ Tests only (prevents accidental deploys) |

## 🌐 Server Configuration

### Production Server Details
- **IP Address**: `13.201.50.33`
- **SSH User**: `ubuntu` (or configured via secret)
- **SSH Port**: `22` (or configured via secret)
- **Backend Port**: `5001` (hidden behind NGINX)
- **Frontend Port**: `80` (via NGINX)

### Server Requirements
- Ubuntu 20.04 LTS or newer
- Node.js 18+
- npm
- NGINX
- PM2 (installed globally)
- OpenSSL

## 📝 Configuration Files Generated

### On Build Machine (GitHub)
```
.github/
├── workflows/
│   └── ci-cd.yml           # This workflow
│
├── CI-CD-SETUP.md          # Detailed setup guide
├── GITHUB-SECRETS.md       # Secrets reference
├── QUICK-START.md          # Quick start guide
└── README.md               # This file
```

### On Server (13.201.50.33)
```
/home/ubuntu/selftesthub-deploy/
├── deploy/
│   ├── backend/            # Node.js backend
│   │   ├── .env            # Generated env file
│   │   ├── package.json
│   │   ├── server.js (or main.js)
│   │   └── ...
│   │
│   └── frontend-dist/      # Built React app
│       ├── index.html
│       ├── assets/
│       └── ...

/etc/nginx/conf.d/
└── selftesthub.conf        # NGINX configuration
```

## 🔍 Monitoring & Logs

### GitHub Actions Logs
1. Go to repository → **Actions** tab
2. Click on the workflow run
3. Expand each job to see logs

### Server Logs
```bash
# Backend logs
pm2 logs selftesthub-backend

# NGINX access logs
sudo tail -f /var/log/nginx/access.log

# NGINX error logs
sudo tail -f /var/log/nginx/error.log
```

### Health Monitoring
```bash
# Check processes
pm2 status

# Monitor in real-time
pm2 monit

# View detailed info
pm2 info selftesthub-backend
```

## 🚨 Troubleshooting Guide

### Deployment Failed?
1. Check GitHub Actions logs in the **Actions** tab
2. Look for red ❌ marks indicating failure point
3. Read the error message carefully
4. Check [CI-CD-SETUP.md](CI-CD-SETUP.md#troubleshooting) for solutions

### Can't Access Application?
1. Verify GitHub Actions deployment succeeded
2. Check server is accessible: `ssh -i key.pem ubuntu@13.201.50.33`
3. Verify PM2 process is running: `pm2 status`
4. Check NGINX: `sudo systemctl status nginx`
5. Test backend: `curl http://localhost:5001/api`

### Secrets Not Working?
1. Verify all secrets are added: **Settings → Secrets**
2. Check secret names match exactly (case-sensitive)
3. Verify secret values are correct
4. Re-added secrets take effect on next push

### SSH Connection Issues?
1. Verify `.pub` key is in server's `authorized_keys`
2. Check key permissions: `chmod 600 ~/.ssh/id_deploy`
3. Test manually: `ssh -i key.pem ubuntu@13.201.50.33`

For more troubleshooting, see [CI-CD-SETUP.md](CI-CD-SETUP.md#troubleshooting)

## 🔄 Deployment Workflow

```
┌─────────────────────────────────┐
│  Developer pushes to main       │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  GitHub receives push           │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Run Tests & Lint               │
│  • Frontend                      │
│  • Backend                       │
└────────┬────────────────────────┘
         │
         ├─ ❌ Tests fail → Notify developer
         │
         ▼
┌─────────────────────────────────┐
│  Build Docker Images            │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Build & Deploy                 │
│  • Build frontend               │
│  • Copy to server via SSH       │
│  • Setup backend                │
│  • Configure NGINX              │
│  • Start services               │
|  • Health checks                │
└────────┬────────────────────────┘
         │
         ├─ ❌ Deploy fails → Notify developer
         │
         ▼
┌─────────────────────────────────┐
│  ✅ Deployment Complete!        │
│  Application live at:           │
│  http://13.201.50.33            │
└─────────────────────────────────┘
```

## 📚 Documentation Roadmap

1. **[QUICK-START.md](QUICK-START.md)** ← Start here if you're new
   - 5-minute setup
   - Step-by-step instructions
   - Basic troubleshooting

2. **[GITHUB-SECRETS.md](GITHUB-SECRETS.md)**
   - How to add secrets to GitHub
   - Secret values reference
   - Security best practices

3. **[CI-CD-SETUP.md](CI-CD-SETUP.md)**
   - Comprehensive technical guide
   - Server setup instructions
   - Advanced troubleshooting
   - Monitoring and logging

4. **[workflows/ci-cd.yml](workflows/ci-cd.yml)**
   - The actual GitHub Actions workflow
   - Detailed comments explaining each step
   - All supported events and triggers

## ✅ Running Manual Tests

### Test Frontend Build Locally
```bash
cd frontend
npm install
npm run build
# Check that dist/ folder is created
ls -la dist/
```

### Test Backend Start Locally
```bash
cd backend
npm install
PORT=5001 npm start
# Should start on http://localhost:5001
```

### Test Docker Builds (if using Docker)
```bash
# Frontend
docker build -t selftesthub-frontend ./frontend

# Backend
docker build -t selftesthub-backend ./backend
```

## 🎯 Common Deployments

### Deploy New Feature
```bash
git checkout -b feature/new-feature
# ... make changes ...
git push origin feature/new-feature
# → Tests run (no deploy)

git checkout main
git merge feature/new-feature
git push origin main
# → Tests run + Deploy to production
```

### Hotfix Deployment
```bash
git checkout main
# ... make hotfix ...
git commit -m "Hotfix: ..."
git push origin main
# → Tests run + Deploy immediately
```

### Scheduled Deployment
You can also manually trigger via GitHub Actions UI:
1. Go to **Actions** → **CI/CD Pipeline**
2. Click "Run workflow"
3. Choose branch and click "Run workflow"

## 🔗 Integration Points

### GitHub
- **Actions**: Runs the CI/CD pipeline
- **Secrets**: Stores sensitive configuration
- **Container Registry**: Stores Docker images

### Production Server (13.201.50.33)
- **SSH**: Connect and deploy
- **PM2**: Manage Node.js process
- **NGINX**: Serve frontend and proxy API
- **File System**: Store application files

## 📈 Next Steps

After initial setup:

1. ✅ Add GitHub Secrets (see [GITHUB-SECRETS.md](GITHUB-SECRETS.md))
2. ✅ Test server access and PM2 setup
3. ✅ Push code to main and monitor deployment
4. ✅ Access application at http://13.201.50.33
5. ✅ Configure SSL/HTTPS (advanced)
6. ✅ Set up monitoring and alerts (advanced)

## 🤝 Contributing

When contributing to this project:

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make changes
3. Push and create a Pull Request
4. CI/CD will automatically test your changes
5. Merge to `main` to deploy
6. Application updates automatically

## 📞 Support & Help

### Quick Help
- **Secrets issues**: See [GITHUB-SECRETS.md](GITHUB-SECRETS.md)
- **Setup issues**: See [QUICK-START.md](QUICK-START.md)
- **Technical details**: See [CI-CD-SETUP.md](CI-CD-SETUP.md)

### Common Issues
- SSH connection fails → Check [CI-CD-SETUP.md#troubleshooting](CI-CD-SETUP.md#troubleshooting)
- Secrets not working → Verify in [GITHUB-SECRETS.md](GITHUB-SECRETS.md)
- Deployment hangs → Check server disk space
- Backend not starting → Check PM2 logs

## 📋 Checklist for Getting Started

- [ ] Read [QUICK-START.md](QUICK-START.md)
- [ ] Generate SSH key pair
- [ ] Prepare production server
- [ ] Add all 7 GitHub Secrets
- [ ] Test SSH connection manually
- [ ] Push code to `main` branch
- [ ] Monitor GitHub Actions
- [ ] Verify application is live
- [ ] Test all features
- [ ] Celebrate 🎉

## 📖 Additional Resources

- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [PM2 Getting Started](https://pm2.io/)
- [NGINX Beginner's Guide](https://nginx.org/en/docs/beginners_guide.html)
- [Node.js Best Practices](https://nodejs.dev/learn)

---

**Status**: ✅ CI/CD Ready  
**Last Updated**: 2024  
**IP Address**: 13.201.50.33  
**Application URL**: http://13.201.50.33

Created with ❤️ for automated, reliable deployments.
