# Cloudflare Access Troubleshooting Guide

## Issue: Worker Not Protected by Access

### Symptom
When visiting `https://legal-exhibits-api.joe-1a2.workers.dev`, you see the API response directly instead of being redirected to Cloudflare Access login:
```json
{"name":"Legal Exhibits Toolkit API","version":"1.0.0","status":"healthy"...}
```

This means the Worker is **publicly accessible** and Access is not protecting it.

---

## Common Causes & Solutions

### Cause 1: Access Application Not Properly Configured ⚠️ MOST COMMON

**Problem:** The Access application domain doesn't match the Worker URL exactly.

**Solution:**

1. Go to: https://dash.cloudflare.com/1a25a792e801e687b9fe4932030cf6a6/zero-trust/access/apps

2. Check your application configuration:
   - **Application domain** must be: `legal-exhibits-api.joe-1a2.workers.dev`
   - **NOT:** `*.workers.dev` (too broad)
   - **NOT:** `legal-exhibits-api` (missing subdomain)
   - **NOT:** Any other variant

3. Path must be:
   - **Subdomain:** `legal-exhibits-api`
   - **Domain:** `joe-1a2.workers.dev`
   - **Path:** (leave empty or use `/`)

4. Click **Save application**

5. Wait 30-60 seconds for propagation

6. Test in **incognito/private window**: https://legal-exhibits-api.joe-1a2.workers.dev

---

### Cause 2: workers.dev Domain Not in Access Settings

**Problem:** Cloudflare Access might not be enabled for `*.workers.dev` domains in your account.

**Solution:**

1. Go to: Zero Trust > Settings > Authentication > Login methods

2. Verify you have at least one identity provider configured:
   - **One-time PIN** (easiest to test)
   - **Google** (for @theholetruth.org)
   - **Microsoft Azure AD**
   - Or others

3. If no identity providers configured, add one:
   ```
   Add One-time PIN:
   - Name: Email OTP
   - Enabled: Yes
   ```

4. Go to: Zero Trust > Settings > Authentication > Device enrollment

5. Ensure device enrollment is not blocking Workers domains

---

### Cause 3: Access Policy Not Applied

**Problem:** Application created but no policy allowing access.

**Solution:**

1. Go to your Access application
2. Click **Edit** or **Policies**
3. Verify you have an **Allow** policy
4. Example policy:
   ```
   Name: Allow HOLE Team
   Action: Allow
   Include:
     - Email domain is: theholetruth.org
   ```

5. **Important:** Policy must be in "Include" section, not just "Require"

---

### Cause 4: Application Not Enabled

**Problem:** Application exists but is disabled.

**Solution:**

1. Go to Access applications list
2. Find "Legal Exhibits API"
3. Check the **Enabled** toggle is ON (not grayed out)
4. If disabled, click to enable

---

### Cause 5: DNS/Proxy Issues with workers.dev

**Problem:** Workers.dev domains sometimes bypass Access due to Cloudflare's internal routing.

**Solution - Use a Custom Domain (Recommended):**

#### Option A: Use Custom Subdomain (Best)

1. **Add custom route in wrangler.toml:**
   ```toml
   # cloudflare-worker/wrangler.toml

   # Add routes for custom domain
   routes = [
     { pattern = "legal-exhibits.theholetruth.org", custom_domain = true }
   ]
   ```

2. **Deploy the worker:**
   ```bash
   cd cloudflare-worker
   npm run deploy
   ```

3. **Set up Access for custom domain:**
   - Application domain: `legal-exhibits.theholetruth.org`
   - This will work with Access properly

4. **Update DNS:**
   - Cloudflare automatically creates DNS record
   - Or manually add CNAME: `legal-exhibits` → `legal-exhibits-api.joe-1a2.workers.dev`

#### Option B: Keep workers.dev but add Workers Routes

If you must use workers.dev:

1. Go to: Workers & Pages > legal-exhibits-api > Settings > Triggers

2. Check "Routes" section

3. Ensure no conflicting routes

---

## Step-by-Step: Complete Setup Verification

### Step 1: Verify Account Settings

```bash
# Check you're on the right account
npx wrangler whoami
# Should show: The HOLE Foundation (1a25a792e801e687b9fe4932030cf6a6)
```

### Step 2: Create Access Application (Fresh Start)

1. **Delete existing application** (if misconfigured):
   - Go to: Zero Trust > Access > Applications
   - Find "Legal Exhibits API"
   - Click "..." menu → Delete

2. **Create new application:**
   ```
   Name: Legal Exhibits API

   Application Configuration:
   - Session Duration: 24 hours
   - Application Type: Self-hosted

   Application Domain:
   - Subdomain: legal-exhibits-api
   - Domain: joe-1a2.workers.dev
   - Path: (leave empty)

   ✅ Click "Next"
   ```

3. **Add Allow Policy:**
   ```
   Policy Name: HOLE Team Access
   Action: Allow

   Configure Rules:
   - Include:
     - Rule type: Emails
     - Value: joe@theholetruth.org

   ✅ Click "Next"
   ✅ Click "Add application"
   ```

### Step 3: Configure Identity Provider

1. Go to: Zero Trust > Settings > Authentication

2. Add **One-time PIN** for testing:
   ```
   Name: Email OTP
   ✅ Enable
   ```

3. Add **Google** (optional but recommended):
   ```
   Name: Google Workspace
   App ID: (from Google Console)
   Client Secret: (from Google Console)
   ✅ Enable
   ```

### Step 4: Test Access Protection

**Wait 60 seconds** after saving, then:

1. **Open incognito/private browser window** (to avoid cached sessions)

2. **Visit:** https://legal-exhibits-api.joe-1a2.workers.dev

3. **Expected behavior:**
   - ✅ Redirected to Cloudflare Access login page
   - ✅ See "Legal Exhibits API" as the application name
   - ✅ Prompted to enter email

4. **If you still see JSON response:**
   - Clear all cookies
   - Try different browser
   - Wait another 60 seconds
   - Check application domain exactly matches

### Step 5: Test with Correct Email

1. Enter email: `joe@theholetruth.org` (or another from your policy)

2. Check email for one-time PIN

3. Enter PIN

4. Should now see the API response

5. **Verify session cookie set:**
   - Open browser DevTools (F12)
   - Go to: Application/Storage > Cookies
   - Look for: `CF_Authorization` cookie

---

## Debugging Commands

### Check Access Application Status
```bash
# List all Access applications
# (Must use dashboard, no CLI command available)
# Go to: https://dash.cloudflare.com/1a25a792e801e687b9fe4932030cf6a6/zero-trust/access/apps
```

### Check Worker Status
```bash
cd cloudflare-worker

# View worker details
npx wrangler status

# View live logs
npx wrangler tail

# Check if request headers show Access
# Look for: CF-Access-Client-Id, CF-Access-Authenticated-User-Email
```

### Test with curl
```bash
# Should return 302 redirect if Access is working
curl -I https://legal-exhibits-api.joe-1a2.workers.dev

# Expected output when Access is enabled:
# HTTP/2 302
# location: https://your-team.cloudflareaccess.com/...

# Current output (not protected):
# HTTP/2 200
# content-type: application/json
```

---

## Quick Fix: Use Custom Domain

If workers.dev Access isn't working, use a custom domain (most reliable):

### 1. Update wrangler.toml
```toml
# cloudflare-worker/wrangler.toml

name = "legal-exhibits-api"
main = "src/index.ts"
compatibility_date = "2024-01-01"
compatibility_flags = ["nodejs_compat"]
account_id = "1a25a792e801e687b9fe4932030cf6a6"

# Add custom domain route
routes = [
  { pattern = "legal-exhibits.theholetruth.org", custom_domain = true }
]

# ... rest of config
```

### 2. Deploy
```bash
cd cloudflare-worker
npm run deploy
```

### 3. Configure Access for Custom Domain
- Application domain: `legal-exhibits.theholetruth.org`
- Works perfectly with Access

### 4. Update all references
- MCP server: Use `https://legal-exhibits.theholetruth.org`
- Documentation: Update URLs
- Service tokens: Re-test with new domain

---

## Still Not Working?

### Nuclear Option: Complete Reset

1. **Delete Access application**
2. **Wait 5 minutes**
3. **Clear all browser caches**
4. **Create new application with exact settings above**
5. **Test in incognito**

### Contact Support

If still not working after all troubleshooting:

1. **Check Cloudflare Status:** https://www.cloudflarestatus.com/
2. **Open Support Ticket:**
   - Go to: Cloudflare Dashboard > Support > Contact Support
   - Subject: "Cloudflare Access not protecting workers.dev domain"
   - Include: Account ID, Worker name, Application ID

---

## Verification Checklist

Use this to verify your setup:

- [ ] Cloudflare Access application created
- [ ] Application domain exactly matches: `legal-exhibits-api.joe-1a2.workers.dev`
- [ ] At least one identity provider configured (One-time PIN minimum)
- [ ] Allow policy created with your email
- [ ] Application is **Enabled** (toggle ON)
- [ ] Waited 60+ seconds after saving
- [ ] Tested in incognito/private window
- [ ] Cleared all cookies before testing
- [ ] curl shows 302 redirect (not 200 OK)

If all checked and still not working → Use custom domain (most reliable solution)

---

## Recommended Solution

**For production use, always use a custom domain:**

```
✅ legal-exhibits.theholetruth.org
❌ legal-exhibits-api.joe-1a2.workers.dev
```

**Why?**
- More reliable with Cloudflare Access
- Professional appearance
- Better for SSL certificates
- Easier to remember
- No workers.dev routing quirks

**Cost:** $0 (if you already own theholetruth.org)
