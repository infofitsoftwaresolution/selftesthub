# SelfTestHub CI/CD - Technical Setup Guide

## 🛠️ Architecture Overview

The SelfTestHub deployment pipeline is designed for high-availability on **Amazon Linux**. It ensures that your code is tested locally (on GitHub) before being securely deployed to your AWS production environment.

### Core Components
- **GitHub Actions**: Orchestrates the build, test, and deployment phases.
- **NGINX**: Acts as a high-performance reverse proxy and entry point for all traffic.
- **Python/FastAPI**: The core application logic running in a secure virtual environment.
- **Systemd**: The native Linux service manager that controls the backend lifecycle.
- **Certbot**: Automated SSL certificate management for [https://selftesthub.com](https://selftesthub.com).

---

## 🏗️ Server Prerequisites

Your **Amazon EC2** instance must have the following configuration:

### 1. Security Groups (AWS Console)
Ensure your EC2 Security Group allows:
- **Port 22 (SSH)**: For deployment and administration.
- **Port 80 (HTTP)**: For initial requests and SSL verification.
- **Port 443 (HTTPS)**: For secure production traffic.

### 2. Software Requirements
Amazon Linux 2023 comes with most tools, but you can verify them with:
```bash
sudo yum update -y
sudo yum install -y nginx python3-pip
```

---

## 🔄 Deployment Logic

### Backend Lifecycle (Systemd)
We do not use PM2 or nohup. Instead, we use a standard Linux Service file at `/etc/systemd/system/selftesthub-backend.service`.

- **To Check Logs**: `sudo journalctl -u selftesthub-backend -f`
- **To Restart manually**: `sudo systemctl restart selftesthub-backend`

### Frontend Lifecycle (Nginx)
The React frontend is built on GitHub and transferred to `/home/ec2-user/selftesthub/frontend-dist`. Nginx serves these files directly for maximum speed.

---

## 🔐 SSL/HTTPS Implementation

SSL is managed by **Certbot**. The pipeline handles the installation and renewal automatically. 

- **Config Location**: `/etc/nginx/conf.d/selftesthub.conf`
- **Certificate Path**: `/etc/letsencrypt/live/selftesthub.com/`

If you ever need to manually renew or check the certificate status, run:
```bash
sudo /opt/certbot/bin/certbot certificates
```

---

## 🆘 Troubleshooting

### 1. Site shows "Not Secure"
- **Reason**: Usually a "Mixed Content" error. Ensure your `VITE_API_URL` in GitHub Secrets is set to `https://selftesthub.com/api/v1`.
- **Fix**: Re-push the code after checking the secret.

### 2. Backend is not starting
- **Reason**: Database connection failure or port conflict.
- **Check**: Run `sudo journalctl -u selftesthub-backend -n 50` to see the exact Python error.

### 3. DNS Issues
- **Reason**: Domain is not pointing to IP `13.201.50.33`.
- **Check**: Run `nslookup selftesthub.com` on your local machine.

---
**Status**: ✅ Technical Documentation Aligned with Amazon Linux & Python Infrastructure
