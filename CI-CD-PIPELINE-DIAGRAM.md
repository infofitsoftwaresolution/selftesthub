# SelfTestHub CI/CD Pipeline Visualization

## 🔄 Automated Deployment Workflow

The following diagram illustrates how your code travels from your local machine to your professional **Amazon Linux** server.

```text
┌────────────────────────┐      ┌──────────────────────────┐      ┌──────────────────────────┐
│   Local Machine        │      │    GitHub Actions        │      │   Amazon EC2 (AWS)       │
│  (git push main)       │─────▶│   (Runner: Ubuntu)       │─────▶│   (Amazon Linux 2023)    │
└────────────────────────┘      └────────────┬─────────────┘      └────────────┬─────────────┘
                                             │                                 │
                                    ┌────────▼────────┐               ┌────────▼────────┐
                                    │ 1. TEST WORKER  │               │ 3. PRODUCTION   │
                                    ├─────────────────┤               ├─────────────────┤
                                    │ • Python Lint   │               │ • Python 3.11   │
                                    │ • Frontend Build│               │ • FastAPI/Uvicorn│
                                    │ • Env Injection │               │ • Systemd Service│
                                    └────────┬────────┘               └────────┬────────┘
                                             │                                 │
                                    ┌────────▼────────┐               ┌────────▼────────┐
                                    │ 2. PKG TRANSFER │               │ 4. REVERSE PROXY│
                                    ├─────────────────┤               ├─────────────────┤
                                    │ • Create tar.gz │               │ • NGINX (HTTPS) │
                                    │ • SSH Connection│               │ • Let's Encrypt │
                                    │ • SCP Transfer  │               │ • SPA Routing   │
                                    └─────────────────┘               └─────────────────┘

```

## 📊 Live Architecture

Once deployed, your application lives in this secure, high-performance environment:

```text
       USER BROWSER
             │
             │ (HTTPS: Port 443)
             ▼
      ┌──────────────┐
      │    NGINX     │◀────▶ [ SSL CERTS: Let's Encrypt ]
      └──────┬───────┘
             │
      ┌──────┴──────┬──────────────┐
      │             │              │
      ▼             ▼              ▼
 [ FRONTEND ]   [ BACKEND ]    [ DATABASE ]
  React App      FastAPI        AWS RDS
  (Static)       (Systemd)      (PostgreSQL)
```

## 🔐 The Pipeline Journey

1.  **Code Push**: You push to GitHub.
2.  **Lint & Build**: GitHub Runner builds the React app and injects the `https://selftesthub.com` URL.
3.  **Transfer**: The code is securely transferred via SSH to your `ec2-user` directory.
4.  **Database Migration**: The pipeline runs `alembic upgrade head` to keep your PostgreSQL schema in sync.
5.  **Service Restart**: The **Systemd** service (`selftesthub-backend`) is restarted to load the new code.
6.  **Health Check**: The pipeline pings the domain to ensure the site is live.

---
**Status**: ✅ Fully Aligned with Amazon Linux & Python FastAPI Architecture
