# GitHub Secrets Configuration Template

## How to Add Secrets to GitHub

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret from the list below

---

## Required Secrets for CI/CD Pipeline

### 1. DEPLOY_HOST
**Purpose**: IP address or domain of the production server (13.201.50.33 in your case)

**Value**: Your server IP address or domain

**Example**: `13.201.50.33` (your production server IP)

**Note**: This is where your application will be deployed. Do NOT hardcode this in the workflow!

---

### 2. DEPLOY_SSH_KEY
**Purpose**: Private SSH key for authenticating to the production server

**How to generate**:
```bash
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/deploy_key -N ""
```

**Value to add**: Copy the entire contents of `~/.ssh/deploy_key` and paste the private key

**Test**:
```bash
ssh -i ~/.ssh/deploy_key ubuntu@$DEPLOY_HOST "echo 'SSH key works!'"
```

---

### 3. DEPLOY_USER
**Purpose**: SSH username for the production server

**Value**: `ubuntu` (or your actual username)

---

### 4. DEPLOY_PORT
**Purpose**: SSH port for the production server (optional, defaults to 22)

**Value**: `22` (or your custom SSH port)

---

### 5. JWT_SECRET
**Purpose**: Secret key for signing JWT tokens

**How to generate**:
```bash
openssl rand -base64 32
```

**Example output**: `eDmK3vP9nL2xQ5rW8jF4bH6gT1yU7sZ0vN4cB2xD5eE7gL9j=`

---

### 6. DATABASE_URL
**Purpose**: Database connection string for the backend

**Format** (PostgreSQL):
```
postgresql://username:password@hostname:5432/database_name
```

**Format** (MongoDB):
```
mongodb://username:password@hostname:27017/database_name
```

**Format** (MySQL):
```
mysql://username:password@hostname:3306/database_name
```

---

### 7. EMAIL_USER
**Purpose**: Email service username (for sending emails)

**Examples**:
- Gmail: `your-email@gmail.com`
- Outlook: `your-email@outlook.com`
- Custom SMTP: your-email@yourdomain.com

---

### 8. EMAIL_PASS
**Purpose**: Email service password or app-specific password

**For Gmail**:
1. Enable 2-factor authentication
2. Generate an [App Password](https://myaccount.google.com/apppasswords)
3. Use the 16-character password here (without spaces)

**For other services**: Contact your email provider for app-specific passwords

---

## Optional Secrets

### SERVER_DOMAIN
**Purpose**: Domain name for the application (if using domain instead of IP)

**Example**: `yourdomain.com`

**Note**: Leave empty if using IP address only

---

### USE_IP_ONLY
**Purpose**: Force deployment to use only IP address

**Value**: `true` or `false`

**Default**: `false`

---

## Quick Setup Script

If you have GitHub CLI installed, you can add all secrets at once:

```bash
#!/bin/bash

# Read SSH private key
SSH_KEY=$(cat ~/.ssh/deploy_key)

# Add all secrets
gh secret set DEPLOY_SSH_KEY -b "$SSH_KEY"
gh secret set DEPLOY_USER -b "ubuntu"
gh secret set DEPLOY_PORT -b "22"
gh secret set JWT_SECRET -b "$(openssl rand -base64 32)"
gh secret set DATABASE_URL -b "postgresql://user:password@localhost:5432/db"
gh secret set EMAIL_USER -b "your-email@gmail.com"
gh secret set EMAIL_PASS -b "your-app-password"

echo "✅ All secrets added successfully!"
```

---

## Verifying Secrets

To verify your secrets are set correctly (they won't show the values):

```bash
gh secret list
```

---

## SSH Key Setup on Server

Before adding the SSH key to GitHub Secrets, ensure it's authorized on the server:

```bash
# On your local machine - copy public key
cat ~/.ssh/deploy_key.pub

# On the server (13.201.50.33)
ssh ubuntu@13.201.50.33

# Add your public key
echo "your-public-key-content" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys

# Verify SSH works
exit

# Test from local machine
ssh -i ~/.ssh/deploy_key ubuntu@13.201.50.33 "echo 'Success!'"
```

---

## Security Best Practices

✅ **DO**:
- Use strong, randomly generated passwords
- Use app-specific passwords for email services
- Rotate secrets periodically
- Use ed25519 SSH keys
- Keep the deployment key secure

❌ **DON'T**:
- Commit secrets to GitHub
- Share secrets in messages or emails
- Use simple/weak passwords
- Reuse the same password across services
- Store secrets in environment files in the repo

---

## Troubleshooting

### Secret not working in pipeline?
1. Verify the secret exists: `gh secret list`
2. Check GitHub Actions logs for the actual error
3. Verify the secret name matches exactly (case-sensitive)
4. Try removing and re-adding the secret

### SSH connection fails?
```bash
# Test SSH connection manually
ssh -vvv -i ~/.ssh/deploy_key ubuntu@13.201.50.33

# Check SSH key permissions (must be 600)
ls -la ~/.ssh/deploy_key
chmod 600 ~/.ssh/deploy_key

# Check if key is authorized on server
ssh ubuntu@13.201.50.33 "cat ~/.ssh/authorized_keys"
```

### Email not sending?
1. Verify EMAIL_USER and EMAIL_PASS are correct
2. Check if 2FA is enabled (use app-specific password)
3. Verify the email service allows programmatic access
4. Check server logs: `pm2 logs selftesthub-backend`

---

## Secret Values Checklist

Use this checklist when setting up all secrets:

- [ ] DEPLOY_SSH_KEY - ✓ SSH private key added
- [ ] DEPLOY_USER - ✓ Set to `ubuntu` (or your username)
- [ ] DEPLOY_PORT - ✓ Set to `22` (or your SSH port)
- [ ] JWT_SECRET - ✓ Generated with `openssl rand -base64 32`
- [ ] DATABASE_URL - ✓ Database connection string configured
- [ ] EMAIL_USER - ✓ Email service username added
- [ ] EMAIL_PASS - ✓ Email service password/app-password added

---

## Next Steps

1. ✅ Add all required secrets to GitHub
2. ✅ Test SSH connection manually
3. ✅ Test database connection
4. ✅ Push a test commit to trigger CI/CD
5. ✅ Monitor the GitHub Actions tab for results
6. ✅ Check application at http://13.201.50.33

---

For more help, see [CI-CD-SETUP.md](CI-CD-SETUP.md)
