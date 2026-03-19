# GitHub Secrets Reference Guide

To enable the automated deployment pipeline, you must add these 7 secrets to your GitHub repository under **Settings → Secrets and variables → Actions**.

## 🔑 Required Secrets

| Secret Name | Purpose | Example Value |
| :--- | :--- | :--- |
| **`DEPLOY_HOST`** | The IP address of your AWS EC2 instance. | `13.201.50.33` |
| **`DEPLOY_USER`** | The SSH username for your server. | `ec2-user` |
| **`DEPLOY_SSH_KEY`** | The entire content of your private key file. | `-----BEGIN RSA PRIVATE KEY-----...` |
| **`DB_PASSWORD`** | The password for your AWS RDS PostgreSQL instance. | `your_db_password` |
| **`SECRET_KEY`** | A long random string for JWT authentication security. | `shhh_this_is_secret_12345` |
| **`SMTP_USER`** | Your Gmail or SMTP email address (for OTPs). | `your_email@gmail.com` |
| **`SMTP_PASSWORD`** | Your 16-character Google "App Password" (no spaces). | `abcd efgh ijkl mnop` |

---

## 🛡️ Step-by-Step Configuration

### 1. The SSH Key (`DEPLOY_SSH_KEY`)
This is your `.pem` file. To copy it correctly:
1.  Open your `.pem` file in a text editor (like Notepad++ or VS Code).
2.  Select **everything** (including the `-----BEGIN...` and `-----END...` lines).
3.  Paste it into the GitHub Secret value box.

### 2. The Database Password (`DB_PASSWORD`)
Just the raw password you chose when creating the RDS instance. The CI/CD pipeline automatically combines this with your AWS endpoint to create the secure `postgresql://` connection string.

### 3. The Email App Password (`SMTP_PASSWORD`)
**Important**: Do NOT use your regular Gmail password. 
1.  Go to your Google Account settings.
2.  Enable **2-Step Verification**.
3.  Search for **"App Passwords"**.
4.  Create a new one for "Mail" on "Other (Custom Name: SelfTestHub)".
5.  Copy the 16-digit code and paste it into GitHub.

---

## 🔄 How to Update a Secret
If you ever change your password or your IP address:
1.  Go to the **Actions Secrets** page in GitHub.
2.  Click the **Pencil icon (Edit)** next to the secret name.
3.  Enter the new value and Save.
4.  **Note**: You must `git push` again or "Re-run" a job for the new secret to take effect on the server.

---
**Status**: ✅ Fully Aligned with Amazon Linux & Python FastAPI Architecture
