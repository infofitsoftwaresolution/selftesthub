# SelfTestHub CI/CD Implementation Summary

Your application now features a professional, automated CI/CD pipeline tailored specifically for **Amazon Linux** and a **Python/FastAPI** backend with a **React** frontend.

## 🎯 Production Architecture
- **Server**: Amazon EC2 (Amazon Linux)
- **User**: `ec2-user`
- **Backend**: Python 3.9/3.11 with FastAPI & Uvicorn
- **Service Management**: **Systemd** (`selftesthub-backend.service`)
- **Database**: AWS RDS (PostgreSQL) with SSL Enforced
- **Reverse Proxy**: NGINX with Let's Encrypt SSL (HTTPS)
- **Domain**: [https://selftesthub.com](https://selftesthub.com)

## 📦 What Has Been Built

### 1. The Pipeline (`.github/workflows/ci-cd.yml`)
- **Automated Testing**: Lints and builds the React frontend and verifies Python syntax on every push.
- **Smart Deployment**: Automatically builds the frontend with the correct `VITE_API_URL` (HTTPS) and packages it for the server.
- **Server Sync**: Transfers files via SSH and restarts the backend service without zero downtime issues.

### 2. The Server Configuration
- **Systemd**: Replaced legacy `nohup` scripts with a proper Linux service that auto-restarts on failure.
- **SSL (HTTPS)**: Automatic Let's Encrypt setup and renewal using Certbot in a private Python environment.
- **NGINX**: Highly optimized reverse proxy that handles the domain traffic and redirects all HTTP traffic to HTTPS.

## 🔧 Required GitHub Secrets
To make the pipeline work, add these secrets to your repository settings:

| Secret Name | Description | Example |
| :--- | :--- | :--- |
| `DEPLOY_HOST` | Your EC2 Public IP | `13.201.50.33` |
| `DEPLOY_USER` | SSH Username | `ec2-user` |
| `DEPLOY_SSH_KEY` | Your `.pem` file content | `-----BEGIN RSA PRIVATE KEY-----...` |
| `DB_PASSWORD` | AWS RDS Password | `your_db_password` |
| `SECRET_KEY` | FastAPI Security Key | `any_long_random_string` |
| `SMTP_USER` | Email (for OTP) | `your_email@gmail.com` |
| `SMTP_PASSWORD` | App Password | `xxxx xxxx xxxx xxxx` |

## 🚀 Deployment Instructions
1. **Push Code**:
   ```bash
   git add .
   git commit -m "Your feature description"
   git push origin main
   ```
2. **Monitor**: Go to the **Actions** tab in GitHub to watch the live logs.
3. **Verify**: Once green, visit [https://selftesthub.com](https://selftesthub.com).

## 🛠️ Maintenance Commands
If you need to check the server manually:

- **Check Backend Logs**: `sudo journalctl -u selftesthub-backend -f`
- **Restart Backend**: `sudo systemctl restart selftesthub-backend`
- **Check NGINX Status**: `sudo systemctl status nginx`

---
**Status**: ✅ Fully Aligned with Amazon Linux & Python Workflow
