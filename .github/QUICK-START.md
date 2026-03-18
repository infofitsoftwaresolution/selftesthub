# SelfTestHub CI/CD - Quick Start Guide

## 📋 Pre-Deployment Checklist

### Production Server Setup (13.201.50.33)
- [ ] SSH access configured
- [ ] Node.js 18+ installed
- [ ] npm installed
- [ ] NGINX installed and running
- [ ] PM2 installed globally
- [ ] Database configured (if applicable)
- [ ] Firewall allows HTTP (port 80) and HTTPS (port 443)

### GitHub Repository Setup
- [ ] Repository created and code pushed
- [ ] `.github/workflows/ci-cd.yml` file exists
- [ ] All 7 required secrets added:
  - [ ] DEPLOY_SSH_KEY
  - [ ] DEPLOY_USER
  - [ ] DEPLOY_PORT
  - [ ] JWT_SECRET
  - [ ] DATABASE_URL
  - [ ] EMAIL_USER
  - [ ] EMAIL_PASS

### Local Machine Setup
- [ ] SSH key pair generated (`ssh-keygen`)
- [ ] Public key added to server's `~/.ssh/authorized_keys`
- [ ] SSH connection tested successfully
- [ ] GitHub CLI installed (optional but recommended)

---

## 🚀 Step-by-Step Deployment Guide

### Step 1: Prepare SSH Key
```bash
# Generate SSH key if you don't have one
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/id_deploy -N ""

# Copy public key to clipboard
cat ~/.ssh/id_deploy.pub
```

### Step 2: Configure Server
```bash
# SSH into server
ssh ubuntu@13.201.50.33

# Create .ssh directory if needed
mkdir -p ~/.ssh

# Add your public key
echo "your-public-key-content" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys

# Install required packages
sudo apt-get update
sudo apt-get install -y nodejs npm nginx curl

# Install PM2
npm install -g pm2

# Start NGINX
sudo systemctl start nginx
sudo systemctl enable nginx

# Exit from server
exit
```

### Step 3: Test SSH Connection
```bash
# Replace with your actual server IP
SERVER_IP="13.201.50.33"  # Replace with your actual IP
ssh -i ~/.ssh/id_deploy ubuntu@$SERVER_IP "echo 'SSH works!'"
```

### Step 4: Add GitHub Secrets (8 Total)
```bash
# Copy the private key
cat ~/.ssh/id_deploy

# Go to GitHub repository Settings → Secrets and variables → Actions
# Add each secret (see GITHUB-SECRETS.md for details):
# 1. DEPLOY_HOST (13.201.50.33 - your server IP/domain)
# 2. DEPLOY_SSH_KEY (paste entire private key)
# 3. DEPLOY_USER (ubuntu)
# 4. DEPLOY_PORT (22)
# 5. JWT_SECRET (generate: openssl rand -base64 32)
# 6. DATABASE_URL (your database connection string)
# 7. EMAIL_USER (your email)
# 8. EMAIL_PASS (your email app password)
```

Or using GitHub CLI:
```bash
gh secret set DEPLOY_HOST -b "13.201.50.33"  # Replace with your IP
gh secret set DEPLOY_SSH_KEY < ~/.ssh/id_deploy
gh secret set DEPLOY_USER -b "ubuntu"
gh secret set DEPLOY_PORT -b "22"
gh secret set JWT_SECRET -b "$(openssl rand -base64 32)"
gh secret set DATABASE_URL -b "postgresql://..."
gh secret set EMAIL_USER -b "your-email@gmail.com"
gh secret set EMAIL_PASS -b "your-app-password"
```

### Step 5: Push Code and Trigger CI/CD
```bash
# Make a commit and push to main branch
git add .
git commit -m "Initial CI/CD setup"
git push origin main
```

### Step 6: Monitor Deployment
1. Go to GitHub repository → **Actions** tab
2. Watch the workflow execution
3. See deployment progress in real-time
4. Check for any errors in the logs

### Step 7: Verify Deployment
```bash
# Check if application is running
curl http://13.201.50.33

# Check backend API
curl http://13.201.50.33/api

# SSH into server and check logs
ssh ubuntu@13.201.50.33
pm2 logs selftesthub-backend
```

---

## 📊 Understanding the CI/CD Pipeline

### Workflow Stages

```
┌─────────────────────────────────────────────────────────────┐
│                    GitHub Push Event                          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐    ┌──────────────────┐               │
│  │  Frontend Tests  │    │  Backend Tests   │               │
│  │  & Lint          │    │  & Lint          │               │
│  └────────┬─────────┘    └────────┬─────────┘               │
│           │                        │                         │
│           └────────────┬───────────┘                         │
│                        │                                     │
│          ┌─────────────▼──────────────┐                     │
│          │  Build Docker Images      │                     │
│          │  (if on main branch)       │                     │
│          └─────────────┬──────────────┘                     │
│                        │                                     │
│          ┌─────────────▼──────────────┐                     │
│          │  Deploy to Production     │                     │
│          │  - Build frontend         │                     │
│          │  - Copy to server         │                     │
│          │  - Setup NGINX            │                     │
│          │  - Start backend (PM2)    │                     │
│          │  - Health checks          │                     │
│          └─────────────┬──────────────┘                     │
│                        │                                     │
│          ┌─────────────▼──────────────┐                     │
│          │  Send Notification        │                     │
│          │  (Success/Failure)         │                     │
│          └────────────────────────────┘                     │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔍 Monitoring Deployment

### View Logs in GitHub Actions
1. Go to repository → **Actions** tab
2. Click on the workflow run
3. Click on each job to see detailed logs

### View Logs on Server
```bash
# Login to server
ssh ubuntu@13.201.50.33

# View backend logs
pm2 logs selftesthub-backend

# View NGINX logs
sudo tail -f /var/log/nginx/error.log

# View all PM2 processes
pm2 status

# View specific process info
pm2 info selftesthub-backend
```

### Health Checks
```bash
# Frontend
curl -I http://13.201.50.33

# Backend
curl http://13.201.50.33:5001/api/health

# API through NGINX
curl -I http://13.201.50.33/api
```

---

## 🆘 Troubleshooting

### Issue: SSH connection fails
```bash
# Test connection with verbose output
ssh -vvv -i ~/.ssh/id_deploy ubuntu@13.201.50.33

# Check key permissions
chmod 600 ~/.ssh/id_deploy

# Check if key is authorized on server
ssh ubuntu@13.201.50.33 "cat ~/.ssh/authorized_keys | grep your-key"
```

### Issue: Deployment package not transferring
```bash
# Check available disk space
ssh ubuntu@13.201.50.33 "df -h"

# Check if can create files in /tmp
ssh ubuntu@13.201.50.33 "touch /tmp/test.txt && echo 'OK'"

# Manually test SCP
scp -i ~/.ssh/id_deploy local-file.tar.gz ubuntu@13.201.50.33:/tmp/
```

### Issue: Backend not starting
```bash
# SSH into server
ssh ubuntu@13.201.50.33

# Check PM2 logs
pm2 logs selftesthub-backend

# Try starting manually
cd /home/ubuntu/selftesthub-deploy/deploy/backend
npm install
PORT=5001 npm start

# Check for port conflicts
sudo lsof -i :5001
```

### Issue: NGINX not serving files
```bash
# SSH into server
ssh ubuntu@13.201.50.33

# Test NGINX configuration
sudo nginx -t

# Check NGINX error logs
sudo tail -20 /var/log/nginx/error.log

# Reload NGINX
sudo systemctl reload nginx

# Check NGINX is running
sudo systemctl status nginx
```

### Issue: Permissions denied errors
```bash
# SSH into server
ssh ubuntu@13.201.50.33

# Fix directory permissions
sudo chmod -R 755 /home/ubuntu/selftesthub-deploy/deploy/frontend-dist

# Fix ownership
sudo chown -R ubuntu:nginx /home/ubuntu/selftesthub-deploy/deploy/frontend-dist

# Fix NGINX ownership if needed
sudo chown -R ubuntu:www-data /home/ubuntu/selftesthub-deploy/deploy/frontend-dist
```

---

## 📝 Configuration Files

### Frontend (.env)
```javascript
// frontend/vite.config.ts
// VITE_API_URL is automatically set by CI/CD based on deployment target
```

### Backend (.env)
```bash
NODE_ENV=production
PORT=5001
JWT_SECRET=your-jwt-secret-here
FRONTEND_URL=http://13.201.50.33
API_URL=http://13.201.50.33/api
ALLOWED_ORIGINS=http://13.201.50.33,https://13.201.50.33,http://localhost,http://127.0.0.1
DATABASE_URL=postgresql://...
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

### NGINX Configuration
```nginx
server {
    listen 80;
    server_name 13.201.50.33;
    
    root /home/ubuntu/selftesthub-deploy/deploy/frontend-dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://localhost:5001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 🔄 Redeploying / Updating Application

### Automatic (Recommended)
1. Make changes locally
2. Commit and push to `main` branch
3. GitHub Actions automatically builds and deploys

### Manual Deployment
```bash
# Build frontend
cd frontend && npm run build && cd ..

# Create deployment package
mkdir -p deploy
cp -r backend deploy/
cp -r frontend/dist deploy/frontend-dist
tar -czf deploy.tar.gz deploy/

# Deploy to server
scp -i ~/.ssh/id_deploy deploy.tar.gz ubuntu@13.201.50.33:/tmp/
ssh -i ~/.ssh/id_deploy ubuntu@13.201.50.33 "cd /home/ubuntu/selftesthub-deploy && tar -xzf /tmp/deploy.tar.gz"

# Restart backend
ssh -i ~/.ssh/id_deploy ubuntu@13.201.50.33 "pm2 restart selftesthub-backend"
```

---

## 📊 Performance Monitoring

### Check Application Performance
```bash
# CPU and Memory Usage
ssh ubuntu@13.201.50.33 "pm2 monit"

# View detailed process info
ssh ubuntu@13.201.50.33 "pm2 show selftesthub-backend"

# View system resources
ssh ubuntu@13.201.50.33 "free -h && df -h"
```

### Check Request Performance
```bash
# Test response time
curl -w "Total time: %{time_total}s\n" http://13.201.50.33

# Test API endpoint
curl -w "Total time: %{time_total}s\n" http://13.201.50.33/api
```

---

## 🔐 Security Checklist

- [ ] SSH keys are 600 permissions
- [ ] Secrets are not committed to Git
- [ ] All required secrets are in GitHub
- [ ] Database password is strong
- [ ] JWT_SECRET is generated with `openssl rand -base64 32`
- [ ] Email password uses app-specific password
- [ ] Server firewall allows only necessary ports
- [ ] HTTPS is configured (optional but recommended)

---

## 🤝 Common Tasks

### Restart Backend
```bash
ssh -i ~/.ssh/id_deploy ubuntu@13.201.50.33 "pm2 restart selftesthub-backend"
```

### Stop Backend
```bash
ssh -i ~/.ssh/id_deploy ubuntu@13.201.50.33 "pm2 stop selftesthub-backend"
```

### Delete Old Deployments
```bash
ssh -i ~/.ssh/id_deploy ubuntu@13.201.50.33 "rm -rf /tmp/deploy*"
```

### View Application Logs
```bash
ssh -i ~/.ssh/id_deploy ubuntu@13.201.50.33 "pm2 logs selftesthub-backend --lines 100"
```

---

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [PM2 Documentation](https://pm2.keymetrics.io/)
- [NGINX Documentation](https://nginx.org/)
- [Node.js Best Practices](https://nodejs.dev/)

---

## ✅ Success Indicators

After deployment, you should see:
- ✅ Application accessible at http://13.201.50.33
- ✅ Frontend loads without errors
- ✅ API endpoints responding at http://13.201.50.33/api
- ✅ PM2 process running: `pm2 status`
- ✅ NGINX reverse proxy working
- ✅ No errors in pm2 logs: `pm2 logs selftesthub-backend`

---

## 📞 Support

For issues:
1. Check GitHub Actions logs
2. SSH into server and check PM2/NGINX logs
3. Review CI-CD-SETUP.md for detailed troubleshooting
4. Check GITHUB-SECRETS.md for secrets configuration

Happy deploying! 🚀
