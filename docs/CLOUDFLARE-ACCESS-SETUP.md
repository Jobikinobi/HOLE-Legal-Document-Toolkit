# Cloudflare Access Setup Guide

This guide walks you through securing the Legal Exhibits API with Cloudflare Access.

## Why Cloudflare Access?

Cloudflare Access provides zero-trust security for your Worker API:
- Authenticate users before they can access legal exhibits
- Integrate with identity providers (Google, Microsoft, GitHub, etc.)
- Audit logs of all access attempts
- No VPN required - secure from anywhere

## Setup Steps

### 1. Enable Cloudflare Access

1. Go to the Cloudflare dashboard: https://dash.cloudflare.com/1a25a792e801e687b9fe4932030cf6a6
2. Navigate to **Zero Trust** > **Access** > **Applications**
3. Click **Add an application**

### 2. Configure Application

**Application Configuration:**
- **Application name:** Legal Exhibits API
- **Session duration:** 24 hours (or your preference)
- **Application domain:** `legal-exhibits-api.joe-1a2.workers.dev`
- **Type:** Self-hosted application

**Path Configuration:**
- **Path:** `/*` (protect all endpoints)

### 3. Set Up Authentication

**Add an Access Policy:**

1. **Policy Name:** The HOLE Foundation Team
2. **Action:** Allow
3. **Configure rules:**
   - **Include:**
     - Email domain: `theholetruth.org`
     - OR specific emails: `joe@theholetruth.org` (add others as needed)

**Optional - Add additional policies:**
- Guest access for specific exhibits
- Time-based access restrictions
- Location-based restrictions

### 4. Identity Provider Setup

If not already configured, add an identity provider:

1. Go to **Zero Trust** > **Settings** > **Authentication**
2. Add your preferred provider:
   - **Google Workspace** (recommended for @theholetruth.org)
   - **Microsoft Azure AD**
   - **GitHub**
   - **One-time PIN** (for guest access)

### 5. Test Access

1. Visit: https://legal-exhibits-api.joe-1a2.workers.dev
2. You should be redirected to the Cloudflare Access login
3. Authenticate with your identity provider
4. After authentication, you'll be granted access to the API

### 6. API Token for Automated Access

For the MCP server to upload files automatically:

1. Go to **Zero Trust** > **Access** > **Service Auth**
2. Create a **Service Token**:
   - Name: `Legal Exhibits MCP Server`
   - Copy the Client ID and Client Secret
3. Use these credentials in API requests:
   ```bash
   curl -H "CF-Access-Client-Id: YOUR_CLIENT_ID" \
        -H "CF-Access-Client-Secret: YOUR_CLIENT_SECRET" \
        https://legal-exhibits-api.joe-1a2.workers.dev/upload
   ```

### 7. Configure the MCP Server

Add the service token to your environment variables:

```bash
# ~/.bash_profile or ~/.zshrc
export LEGAL_EXHIBITS_API_URL="https://legal-exhibits-api.joe-1a2.workers.dev"
export CF_ACCESS_CLIENT_ID="your_client_id"
export CF_ACCESS_CLIENT_SECRET="your_client_secret"
```

## Access Policies Examples

### Policy 1: Full Admin Access
- **Emails:** `joe@theholetruth.org`
- **Paths:** `/*`
- **Action:** Allow

### Policy 2: Read-only Access
- **Email domain:** `theholetruth.org`
- **Paths:** `/files/*` (GET only)
- **Action:** Allow

### Policy 3: Guest Access (specific cases)
- **One-time PIN** to email
- **Paths:** `/files/specific-case/*`
- **Duration:** 1 hour
- **Action:** Allow

## Audit Logging

View all access attempts:
1. Go to **Zero Trust** > **Logs** > **Access**
2. Filter by application: Legal Exhibits API
3. Export logs for compliance

## Additional Security Measures

### Rate Limiting
Add rate limiting to prevent abuse:
```bash
wrangler r8 create \
  --name legal-exhibits-rate-limit \
  --zone joe-1a2.workers.dev \
  --period 60s \
  --requests 100
```

### CORS Configuration
Update `src/index.ts` to restrict CORS origins if needed:
```typescript
app.use("*", cors({
  origin: ['https://yourdomain.com'],
  allowMethods: ['GET', 'POST', 'DELETE'],
}));
```

### Data Retention
Configure R2 lifecycle policies:
1. Go to Cloudflare Dashboard > R2 > legal-exhibits
2. Add lifecycle rules:
   - Auto-delete old uploads after 90 days
   - Move to cheaper storage class after 30 days

## Troubleshooting

### "Access Denied" Errors
- Check if your email is in the allow list
- Verify identity provider is configured
- Clear browser cookies and try again

### Service Token Not Working
- Ensure headers are correctly formatted
- Check token hasn't expired
- Verify token has access to the application

### MCP Server Upload Fails
- Confirm environment variables are set
- Test with curl first to isolate the issue
- Check Worker logs: `wrangler tail`

## Support Resources

- Cloudflare Access Docs: https://developers.cloudflare.com/cloudflare-one/applications/
- Zero Trust Dashboard: https://dash.cloudflare.com/1a25a792e801e687b9fe4932030cf6a6/zero-trust
- Worker Logs: `wrangler tail --name legal-exhibits-api`
