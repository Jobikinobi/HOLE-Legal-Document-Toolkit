# Creating a Cloudflare Access Service Token

## What is a Service Token?

A **Service Token** allows your MCP server to access the API without browser-based authentication. It bypasses the Cloudflare Access login page for automated tools.

## Important: This is Different from API Tokens

| Token Type | Purpose | Where Used |
|------------|---------|------------|
| **API Token** | Deploy Workers, manage Cloudflare | wrangler CLI |
| **Service Token** | Bypass Access login for automation | MCP server, rclone |

You have an API token (`KGk4dFlCf8Ciop73uBgkkcuHrdGltXQhKw1_xRj`) which is used by wrangler.
Now you need a **Service Token** for the MCP server.

---

## Step-by-Step: Create Service Token

### 1. Go to Service Auth Page

Visit: https://dash.cloudflare.com/1a25a792e801e687b9fe4932030cf6a6/zero-trust/access/service-auth

### 2. Create New Service Token

Click **"Create Service Token"**

### 3. Configure Token

```
Name: Legal Exhibits MCP Server

Duration:
  - Non-expiring (recommended for MCP server)
  - Or 1 year if you prefer periodic rotation
```

Click **"Generate token"**

### 4. Save Credentials Immediately

⚠️ **CRITICAL: You can only see these ONCE!**

You'll see two values:
```
Client ID: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.access
Client Secret: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Copy both values immediately** - you cannot view them again!

### 5. Store in Cloudflare Secrets

```bash
cd /Volumes/HOLE-RAID-DRIVE/Projects/hole-websites/HOLE-Legal-Document-Toolkit/cloudflare-worker

# Store Client ID
npx wrangler secret put MCP_SERVICE_TOKEN_ID
# Paste the Client ID when prompted

# Store Client Secret
npx wrangler secret put MCP_SERVICE_TOKEN_SECRET
# Paste the Client Secret when prompted
```

### 6. Configure for Local Use

Create `.env` file (gitignored):

```bash
# /Volumes/HOLE-RAID-DRIVE/Projects/hole-websites/HOLE-Legal-Document-Toolkit/.env

# Service Token for MCP Server
CF_ACCESS_CLIENT_ID=your_client_id_here.access
CF_ACCESS_CLIENT_SECRET=your_client_secret_here

# API URL
LEGAL_EXHIBITS_API_URL=https://legal-exhibits.theholetruth.org
```

---

## Testing the Service Token

### Test 1: Direct API Access

```bash
# Should return API response (not redirect to login)
curl -H "CF-Access-Client-Id: YOUR_CLIENT_ID" \
     -H "CF-Access-Client-Secret: YOUR_CLIENT_SECRET" \
     https://legal-exhibits.theholetruth.org

# Expected output:
{"name":"Legal Exhibits Toolkit API","version":"1.0.0","status":"healthy"...}
```

### Test 2: Upload File

```bash
curl -H "CF-Access-Client-Id: YOUR_CLIENT_ID" \
     -H "CF-Access-Client-Secret: YOUR_CLIENT_SECRET" \
     -F "file=@test.pdf" \
     https://legal-exhibits.theholetruth.org/upload
```

### Test 3: rclone with Service Token

Update rclone config to include headers:

```bash
rclone copy \
  --header "CF-Access-Client-Id: YOUR_CLIENT_ID" \
  --header "CF-Access-Client-Secret: YOUR_CLIENT_SECRET" \
  file.pdf legal-exhibits-r2:legal-exhibits/
```

---

## Update MCP Server Configuration

Once you have the service token, update your MCP server to use it:

### Option 1: Environment Variables

```bash
# Add to ~/.zshrc or ~/.bash_profile
export CF_ACCESS_CLIENT_ID="your_client_id.access"
export CF_ACCESS_CLIENT_SECRET="your_client_secret"
export LEGAL_EXHIBITS_API_URL="https://legal-exhibits.theholetruth.org"
```

### Option 2: .env File (Recommended)

Create `.env` in project root:

```bash
# /Volumes/HOLE-RAID-DRIVE/Projects/hole-websites/HOLE-Legal-Document-Toolkit/.env
CF_ACCESS_CLIENT_ID=your_client_id.access
CF_ACCESS_CLIENT_SECRET=your_client_secret
LEGAL_EXHIBITS_API_URL=https://legal-exhibits.theholetruth.org
```

This file is already in `.gitignore` and won't be committed.

---

## Using Service Token with Scripts

### Example: Upload Script

```bash
#!/bin/bash
# Upload PDF to secure API using service token

source .env  # Load environment variables

curl -H "CF-Access-Client-Id: $CF_ACCESS_CLIENT_ID" \
     -H "CF-Access-Client-Secret: $CF_ACCESS_CLIENT_SECRET" \
     -F "file=@$1" \
     $LEGAL_EXHIBITS_API_URL/upload
```

### Example: rclone with Token

```bash
#!/bin/bash
# scripts/upload-to-r2-secure.sh

source .env

rclone copy "$@" \
  --header "CF-Access-Client-Id: $CF_ACCESS_CLIENT_ID" \
  --header "CF-Access-Client-Secret: $CF_ACCESS_CLIENT_SECRET" \
  legal-exhibits-r2:legal-exhibits/
```

---

## Security Best Practices

### ✅ DO:
- Store service token in `.env` (gitignored)
- Use Cloudflare Secrets for Worker access
- Rotate tokens periodically (annually)
- Revoke old tokens when creating new ones
- Monitor service token usage in Access logs

### ❌ DON'T:
- Commit service tokens to git
- Share tokens via email/Slack
- Use the same token across multiple projects
- Leave expired tokens active
- Store in plaintext config files

---

## Token Management

### View Active Service Tokens

Go to: https://dash.cloudflare.com/1a25a792e801e687b9fe4932030cf6a6/zero-trust/access/service-auth

You'll see:
- Token name
- Created date
- Last used
- Expiration (if set)

### Revoke a Token

If compromised or no longer needed:
1. Find token in Service Auth list
2. Click "..." menu
3. Select "Revoke"
4. Confirm

**Token is immediately invalid** - no waiting period.

### Rotate Tokens

**Every 12 months (recommended):**
1. Create new service token
2. Update `.env` and Cloudflare Secrets
3. Test with new token
4. Revoke old token
5. Update documentation

---

## Troubleshooting

### "Access Denied" with Service Token

**Causes:**
- Token not added to Access application
- Token expired
- Token revoked
- Headers incorrectly formatted

**Fix:**
1. Verify token is active in Service Auth
2. Check headers match exactly:
   - `CF-Access-Client-Id` (capital CF, hyphens)
   - `CF-Access-Client-Secret`
3. Ensure token has `.access` suffix in Client ID
4. Test with curl before using in scripts

### Token Not Working After Creation

**Wait 30-60 seconds** after creating token for propagation.

### Service Token Not Bypassing Login

Verify the Access application includes service auth:
1. Go to Access application settings
2. Check "Service Auth" is not explicitly blocked
3. Ensure application domain matches exactly

---

## Quick Reference

### Token Types Summary

```
API Token (wrangler):
  • KGk4dFlCf8Ciop73uBgkkcuHrdGltXQhKw1_xRj
  • For: Deploying Workers, managing resources
  • Used by: wrangler CLI
  • ❌ Cannot access API

Service Token (MCP server):
  • Client ID: xxxxx.access
  • Client Secret: xxxxxxxxxxxxxxx
  • For: Bypassing Cloudflare Access login
  • Used by: MCP server, rclone, automation
  • ✅ Required for API access
```

### Create Service Token Checklist

- [ ] Go to Zero Trust > Access > Service Auth
- [ ] Click "Create Service Token"
- [ ] Name: "Legal Exhibits MCP Server"
- [ ] Duration: Non-expiring or 1 year
- [ ] **Copy Client ID and Secret immediately**
- [ ] Store in `.env` file
- [ ] Add to Cloudflare Secrets (optional)
- [ ] Test with curl
- [ ] Update MCP server configuration
- [ ] Test file upload
- [ ] Document token creation date

---

## Next Steps After Creating Token

1. ✅ Create service token (dashboard)
2. ✅ Save credentials to `.env`
3. ✅ Test with curl
4. ✅ Update rclone configuration
5. ✅ Test file upload workflow
6. ✅ Update MCP server tools
7. ✅ Document token details

---

**Need Help?**
- Service Auth Dashboard: https://dash.cloudflare.com/1a25a792e801e687b9fe4932030cf6a6/zero-trust/access/service-auth
- Access Logs: https://dash.cloudflare.com/1a25a792e801e687b9fe4932030cf6a6/zero-trust/logs/access
- Documentation: docs/SECRETS-MANAGEMENT.md
