# SelfTestHub CI/CD Documentation

## 🎯 Overview

This folder contains the complete CI/CD setup for the **SelfTestHub** application. The pipeline is custom-built for **Amazon Linux** to ensure high-performance hosting of your **Python (FastAPI)** backend and **React** frontend.

## 📁 Files in This Directory

| File | Purpose |
| :--- | :--- |
| **`workflows/ci-cd.yml`** | The actual automation engine (deployment logic). |
| **`QUICK-START.md`** | The 5-minute setup guide for developers. |
| **`CI-CD-SETUP.md`** | Deep technical details on Nginx, SSL, and Systemd. |
| **`GITHUB-SECRETS.md`** | Reference guide for all required environment keys. |

## 🚀 Key Automation Stages

1.  **Backend Verification**: Checks your Python syntax and installs requirements.
2.  **Frontend Build**: Compiles your React app into high-performance static files.
3.  **Secure Deployment**: Packages the app and transfers it to your EC2 instance via SSH.
4.  **Database Sync**: Automatically runs Alembic migrations on your AWS RDS instance.
5.  **Service Management**: Restarts the **Systemd** backend service and ensures **SSL (HTTPS)** is active.

## 🌐 Production Environment
- **Server Address**: [https://selftesthub.com](https://selftesthub.com)
- **Deployment User**: `ec2-user`
- **Backend Service**: `selftesthub-backend.service`

## 📋 Getting Started
1.  Read [QUICK-START.md](QUICK-START.md).
2.  Configure your secrets as described in [GITHUB-SECRETS.md](GITHUB-SECRETS.md).
3.  Push your code to the `main` branch to trigger a live deployment.

---
**Status**: ✅ Optimized for Amazon Linux & Python FastAPI Architecture
