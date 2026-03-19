# SelfTestHub CI/CD - Quick Start Guide

## 🚀 5-Minute Setup for Amazon Linux

This guide will get your automated deployment pipeline running on your **Amazon EC2** instance.

### Step 1: Prepare Your AWS Server
SSH into your server and ensure the basic requirements are met:
```bash
# Connect to your server
ssh -i "selftesthub.pem" ec2-user@13.201.50.33

# Install Nginx (if not already there)
sudo yum install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### Step 2: Configure GitHub Secrets
Go to your GitHub Repository → **Settings** → **Secrets and variables** → **Actions** and add these 7 keys:

1.  **`DEPLOY_HOST`**: `13.201.50.33`
2.  **`DEPLOY_USER`**: `ec2-user`
3.  **`DEPLOY_SSH_KEY`**: Paste the entire content of your `.pem` file.
4.  **`DB_PASSWORD`**: Your AWS RDS database password.
5.  **`SECRET_KEY`**: Any random string for JWT security.
6.  **`SMTP_USER`**: Your email address (for OTPs).
7.  **`SMTP_PASSWORD`**: Your email App Password.

### Step 3: Trigger the First Deployment
Simply push your code to the `main` branch:
```bash
git add .
git commit -m "Initialize professional CI/CD pipeline"
git push origin main
```

### Step 4: Monitor & Verify
1.  Open your browser and go to your **GitHub Actions** tab.
2.  Watch the "CI/CD Pipeline" workflow.
3.  Once it turns **green**, visit [https://selftesthub.com](https://selftesthub.com).

---

## 🛠️ Common Admin Commands

| Action | Command |
| :--- | :--- |
| **View Live Logs** | `sudo journalctl -u selftesthub-backend -f` |
| **Restart App** | `sudo systemctl restart selftesthub-backend` |
| **Check SSL** | `sudo /opt/certbot/bin/certbot certificates` |
| **Nginx Status** | `sudo systemctl status nginx` |

---
**Status**: ✅ Optimized for Amazon Linux & Python FastAPI Architecture
