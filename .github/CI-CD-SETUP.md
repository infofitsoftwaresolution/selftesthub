# CI/CD Pipeline Setup Guide

## Overview
This project uses GitHub Actions for Continuous Integration and Continuous Deployment (CI/CD). The pipeline automatically:
- Runs linting and tests on every push to `main` and `develop` branches
- Builds Docker images
- Deploys to production server (13.201.50.33)

## Workflow Files
- `.github/workflows/ci-cd.yml` - Main CI/CD pipeline

## Prerequisites

### 1. Server Setup
Ensure your production server (13.201.50.33) has the following installed:
```bash
# Ubuntu/Debian based systems
sudo apt-get update
sudo apt-get install -y nodejs npm nginx curl

# Or using NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18

# Install PM2 globally
npm install -g pm2

# Start NGINX
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 2. SSH Key Setup
Generate an SSH key for deployments:
```bash
# On your local machine
ssh-keygen -t ed25519 -C "github-actions-deploy"

# Copy the private key content
cat ~/.ssh/id_ed25519

# Add the public key to the server
# On the server (13.201.50.33)
echo "$(your-public-key-content)" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

## GitHub Secrets Configuration

### Required Secrets
Add these secrets to your GitHub repository settings (Settings → Secrets and variables → Actions):

| Secret Name | Description | Example |
|---|---|---|
| `DEPLOY_HOST` | IP address of production server | `13.201.50.33` |
| `DEPLOY_USER` | SSH user for deployment | `ubuntu` |
| `DEPLOY_SSH_KEY` | Private SSH key (entire contents) | (multi-line private key) |
| `DEPLOY_PORT` | SSH port (optional) | `22` |
| `JWT_SECRET` | JWT secret for authentication | `your-secret-key-here` |
| `DATABASE_URL` | Database connection string | `postgresql://user:pass@host/db` |
| `EMAIL_USER` | Email service username | `your-email@gmail.com` |
| `EMAIL_PASS` | Email service password/app-password | `app-specific-password` |

### Optional Secrets
| Secret Name | Description |
|---|---|
| `SERVER_DOMAIN` | Domain name (if not using IP) |
| `USE_IP_ONLY` | Set to `true` to use only IP address |

## Setting Up Secrets

### Using GitHub CLI
```bash
gh secret set DEPLOY_SSH_KEY < ~/.ssh/id_ed25519
gh secret set JWT_SECRET -b "your-jwt-secret"
gh secret set DATABASE_URL -b "postgresql://..."
```

### Manual Setup via GitHub Web UI
1. Go to your repository
2. Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Add each secret individually

## Workflow Stages

### 1. Frontend Tests & Lint
- Installs frontend dependencies
- Runs linting (if configured)
- Builds the Vite application
- Sets `VITE_API_URL` to the deployment server

### 2. Backend Tests & Lint
- Installs backend dependencies
- Runs linting (if configured)
- Checks for security vulnerabilities
- Runs backend tests (if configured)

### 3. Build Docker Images (Optional)
- Builds frontend Docker image
- Builds backend Docker image
- Pushes to GitHub Container Registry

### 4. Deploy to Production
- Creates deployment package
- Transfers to production server via SCP
- Executes deployment script on remote server
- Configures NGINX as reverse proxy
- Starts backend with PM2
- Runs health checks

## Manual Deployment

If you need to deploy manually without triggering CI/CD:

```bash
# On your local machine
cd selftesthub

# Build frontend
cd frontend && npm run build && cd ..

# Create deployment package
mkdir -p deploy
cp -r backend deploy/
cp -r frontend/dist deploy/frontend-dist
tar -czf deploy.tar.gz deploy/

# Transfer to server
scp -i ~/.ssh/deploy_key deploy.tar.gz ubuntu@13.201.50.33:/tmp/

# SSH into server and run deployment
ssh -i ~/.ssh/deploy_key ubuntu@13.201.50.33 << 'EOF'
tar -xzf /tmp/deploy.tar.gz -C /tmp
# Continue with the deployment steps...
EOF
```

## Accessing the Application

After successful deployment:
- **Frontend**: http://13.201.50.33
- **API**: http://13.201.50.33/api
- **Backend (Direct)**: http://13.201.50.33:5001

## Monitoring

### View Deployment Logs
```bash
# SSH into production server
ssh -i ~/.ssh/deploy_key ubuntu@13.201.50.33

# View backend logs
pm2 logs selftesthub-backend

# View NGINX logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

### PM2 Commands
```bash
pm2 status                    # Show process status
pm2 logs selftesthub-backend  # View logs
pm2 restart selftesthub-backend  # Restart backend
pm2 delete selftesthub-backend   # Stop and remove
pm2 stop selftesthub-backend     # Stop process
```

### Health Check
```bash
# Check backend
curl http://13.201.50.33:5001/api/health

# Check frontend
curl http://13.201.50.33/
```

## Troubleshooting

### SSH Connection Issues
```bash
# Test SSH connection
ssh -i ~/.ssh/deploy_key -v ubuntu@13.201.50.33

# Check if SSH key has correct permissions
chmod 600 ~/.ssh/deploy_key
```

### Deployment Package Not Transferring
```bash
# Manually check the target directory
ssh ubuntu@13.201.50.33 "ls -la /tmp/deploy.tar.gz"

# Check disk space
ssh ubuntu@13.201.50.33 "df -h"
```

### Backend Not Starting
```bash
# Check PM2 logs
ssh ubuntu@13.201.50.33 "pm2 logs selftesthub-backend"

# Check for port conflicts
ssh ubuntu@13.201.50.33 "sudo lsof -i :5001"

# Check Node version
ssh ubuntu@13.201.50.33 "node --version"
```

### NGINX Issues
```bash
# Test NGINX configuration
ssh ubuntu@13.201.50.33 "sudo nginx -t"

# View NGINX error logs
ssh ubuntu@13.201.50.33 "sudo tail -20 /var/log/nginx/error.log"

# Reload NGINX
ssh ubuntu@13.201.50.33 "sudo systemctl reload nginx"
```

## Environment Variables

### Frontend
- `VITE_API_URL` - API endpoint (set by CI/CD to http://13.201.50.33/api)

### Backend
- `NODE_ENV` - Set to `production`
- `PORT` - Backend port (5001)
- `JWT_SECRET` - JWT signing secret
- `FRONTEND_URL` - Frontend URL for CORS
- `API_URL` - API base URL
- `ALLOWED_ORIGINS` - Comma-separated list of allowed origins
- `DATABASE_URL` - Database connection string
- `EMAIL_USER` - Email service username
- `EMAIL_PASS` - Email service password

## Security Best Practices

1. **SSH Keys**: Use ed25519 keys instead of RSA for better security
2. **Secrets**: Never commit secrets to GitHub, always use GitHub Secrets
3. **JWT Secret**: Generate a strong JWT secret using: `openssl rand -base64 32`
4. **Database**: Use strong passwords and restrict database access
5. **Network**: Use security groups/firewall to restrict port access
6. **HTTPS**: Consider setting up SSL certificates with Let's Encrypt

## SSL/HTTPS Setup

For production deployment with HTTPS:

```bash
# On the server
sudo apt-get install certbot python3-certbot-nginx

# Generate certificate (replace with your domain)
sudo certbot certonly --nginx -d yourdomain.com

# Update NGINX configuration in the deployment script
```

## Rollback

To rollback to a previous version:

```bash
ssh ubuntu@13.201.50.33

# Check PM2 process history
pm2 status

# Stop current version
pm2 stop selftesthub-backend

# Navigate to previous deployment
cd /home/ubuntu/selftesthub-deploy/backup/previous-version
pm2 start backend

# Or using git
cd /path/to/code
git revert <commit-hash>
npm install
pm2 restart selftesthub-backend
```

## Useful Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [PM2 Documentation](https://pm2.keymetrics.io/)
- [NGINX Documentation](https://nginx.org/en/docs/)
- [Node.js Best Practices](https://nodejs.org/en/docs/guides/)

## Support

For issues with the CI/CD pipeline, check:
1. GitHub Actions logs in the "Actions" tab
2. Server logs using SSH connection
3. Application logs with `pm2 logs`
