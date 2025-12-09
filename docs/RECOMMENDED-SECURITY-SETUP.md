# Recommended Security Setup for Legal Exhibits API

## Architecture: Private Hostname with Cloudflare Access

For a legal document management system handling sensitive case materials, use this secure architecture:

```
┌─────────────────────────────────────────────────────────┐
│         Cloudflare Access (Zero Trust)                  │
│  • Authentication required before access                │
│  • Identity provider (Google/Microsoft)                 │
│  • MFA enforcement                                      │
│  • Session management                                   │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│    Private Hostname: legal-exhibits-api.joe-1a2...      │
│  • Not publicly accessible                              │
│  • Auth required for all endpoints                      │
│  • Audit logging enabled                                │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│           Cloudflare Worker + R2 Storage                │
│  • Stores legal exhibits                                │
│  • Processes uploads/downloads                          │
│  • Tracks access in KV                                  │
└─────────────────────────────────────────────────────────┘
```

## Step-by-Step Setup

### 1. Configure Cloudflare Access Application

**Go to:** https://dash.cloudflare.com/1a25a792e801e687b9fe4932030cf6a6/zero-trust/access/apps

#### Application Settings
- **Name:** Legal Exhibits API
- **Type:** Self-hosted
- **Application Domain:** `legal-exhibits-api.joe-1a2.workers.dev`
- **Session Duration:** 8 hours (or your preference)
- **Enable Automatic HTTPS Rewrites:** Yes

#### Path Configuration
Protect all endpoints:
- **Path:** `/*`
- **Include all subpaths:** Yes

### 2. Create Access Policies

#### Policy 1: The HOLE Foundation Team (Recommended)
```
Name: HOLE Foundation Team Access
Action: Allow
Decision: Allow

Include:
  - Email domain is: theholetruth.org

Require (optional but recommended):
  - MFA (Multi-factor authentication)
```

This allows anyone with `@theholetruth.org` email to access after authentication.

#### Policy 2: Specific Users (More Restrictive)
```
Name: Authorized Legal Staff
Action: Allow

Include:
  - Emails:
    - joe@theholetruth.org
    - [other authorized users]

Require:
  - MFA
```

Use this if you want to explicitly control who has access.

#### Policy 3: Service Token for MCP Server
```
Name: MCP Server Automated Access
Action: Service Auth

Purpose: Allow the local MCP server to upload files automatically
```

Create service token separately (see below).

### 3. Set Up Identity Provider

**Go to:** Zero Trust > Settings > Authentication

#### Recommended: Google Workspace
If using @theholetruth.org with Google:
1. Add **One-time PIN** as fallback
2. Add **Google** as primary IdP
3. Configure email domain: `theholetruth.org`

#### Alternative: Microsoft Azure AD
If using Microsoft 365:
1. Add Azure AD integration
2. Configure tenant ID
3. Map to theholetruth.org domain

### 4. Create Service Token for MCP Server

**Go to:** Zero Trust > Access > Service Auth

```
Name: Legal Exhibits MCP Server
Service Token Duration: Does not expire (or 1 year)

Applications: Legal Exhibits API
```

**Save these credentials securely:**
- Client ID: `CF-Access-Client-Id`
- Client Secret: `CF-Access-Client-Secret`

#### Store as Cloudflare Secrets
```bash
cd cloudflare-worker

npx wrangler secret put MCP_ACCESS_CLIENT_ID
npx wrangler secret put MCP_ACCESS_CLIENT_SECRET
```

### 5. Update MCP Server to Use Service Token

Create `.env` file (gitignored):
```bash
# MCP Server Configuration
LEGAL_EXHIBITS_API_URL=https://legal-exhibits-api.joe-1a2.workers.dev
CF_ACCESS_CLIENT_ID=your_client_id_here
CF_ACCESS_CLIENT_SECRET=your_client_secret_here
```

Update rclone to include service token:
```bash
rclone copy --header "CF-Access-Client-Id: YOUR_CLIENT_ID" \
           --header "CF-Access-Client-Secret: YOUR_CLIENT_SECRET" \
           file.pdf legal-exhibits-r2:legal-exhibits/
```

## Access Patterns

### Pattern 1: Browser Access (Manual)
```
User → Browser → Cloudflare Access Login → Identity Provider → Worker API
```

1. User visits: https://legal-exhibits-api.joe-1a2.workers.dev
2. Redirected to Cloudflare Access login
3. Authenticates with Google/Microsoft
4. MFA prompt (if enabled)
5. Access granted + session cookie set
6. Can now access all endpoints

**Session duration:** 8 hours (configurable)

### Pattern 2: MCP Server Access (Automated)
```
MCP Server → Service Token Headers → Worker API
```

```bash
# Example: Upload via MCP server
curl -H "CF-Access-Client-Id: $CLIENT_ID" \
     -H "CF-Access-Client-Secret: $CLIENT_SECRET" \
     -F "file=@exhibit.pdf" \
     https://legal-exhibits-api.joe-1a2.workers.dev/upload
```

### Pattern 3: Guest Access (Temporary)
```
Guest → One-time PIN → Specific Exhibit Only
```

Create a temporary access policy:
```
Name: Case 123 Exhibit Access
Duration: 24 hours
Paths: /files/cases/case-123/*
Method: One-time PIN to email
Email: opposing-counsel@example.com
```

## Security Features

### ✅ Enabled by Default
- **Authentication required** for all access
- **Audit logging** of all requests
- **Session management** with expiration
- **MFA support** (optional but recommended)
- **IP-based restrictions** (optional)
- **Device posture checks** (optional)

### 🔒 Access Control Levels

| Level | Who | What They Can Access | How |
|-------|-----|---------------------|-----|
| **Admin** | joe@theholetruth.org | All endpoints | Email + MFA |
| **Team** | *@theholetruth.org | All endpoints | Email + MFA |
| **Service** | MCP Server | Upload/list only | Service token |
| **Guest** | Case-specific | Single exhibit | One-time PIN |
| **Public** | No one | Nothing | ❌ Blocked |

## Audit and Compliance

### View Access Logs
**Go to:** Zero Trust > Logs > Access

Filter by:
- **Application:** Legal Exhibits API
- **User:** Specific email
- **Action:** Allow/Block
- **Date range:** Custom

**Export for compliance:**
- Download as CSV
- Integrate with SIEM
- Store for legal requirements

### What's Logged
- ✅ Who accessed (email/identity)
- ✅ When (timestamp)
- ✅ What endpoint (URL path)
- ✅ From where (IP address, country)
- ✅ Result (allowed/denied)
- ✅ Session ID

## Testing the Setup

### Test 1: Verify Access Protection
```bash
# Should redirect to login (HTTP 302)
curl -I https://legal-exhibits-api.joe-1a2.workers.dev

# Expected: Redirect to Cloudflare Access login page
```

### Test 2: Service Token Authentication
```bash
# Should work with service token
curl -H "CF-Access-Client-Id: $CLIENT_ID" \
     -H "CF-Access-Client-Secret: $CLIENT_SECRET" \
     https://legal-exhibits-api.joe-1a2.workers.dev/

# Expected: {"name":"Legal Exhibits Toolkit API","status":"healthy"...}
```

### Test 3: Browser Access
1. Open browser (incognito mode)
2. Visit: https://legal-exhibits-api.joe-1a2.workers.dev
3. Should see Cloudflare Access login
4. Authenticate with @theholetruth.org email
5. Complete MFA if enabled
6. Should see API response

## Advanced Configurations

### IP Restrictions
Restrict to office/VPN IP:
```
Policy: Office Access Only
Include:
  - Email domain: theholetruth.org
Require:
  - IP ranges: 203.0.113.0/24 (your office IP)
```

### Device Posture Checks
Require managed devices:
```
Require:
  - Device Posture: Corporate-managed
  - OS Version: macOS 13+ or Windows 11+
  - Disk Encryption: Enabled
```

### Time-Based Access
Business hours only:
```
Policy: Business Hours Only
Include:
  - Email domain: theholetruth.org
Require:
  - Time: Monday-Friday, 8am-6pm PST
```

### Per-Case Access Control
Create separate policies per case:
```
Policy: Case-123 Access
Paths: /files/cases/case-123/*
Include:
  - Emails: case-123-team@theholetruth.org
```

## Cost

**Cloudflare Access Pricing:**
- **Free tier:** Up to 50 users
- **Teams Standard:** $7/user/month (if over 50 users)
- **Teams Enterprise:** Custom pricing

For The HOLE Foundation (likely under 50 users):
- **Cost:** $0/month with free tier ✅

## Migration Plan

### Phase 1: Set Up Access (Day 1)
1. Create Cloudflare Access application
2. Add policy for @theholetruth.org domain
3. Set up Google as identity provider
4. Test browser access

### Phase 2: Service Tokens (Day 1)
1. Create service token for MCP server
2. Store in Cloudflare Secrets
3. Update rclone configuration
4. Test automated uploads

### Phase 3: Enable MFA (Week 1)
1. Add MFA requirement to policies
2. Notify team members
3. Provide setup instructions
4. Monitor compliance

### Phase 4: Audit Setup (Week 2)
1. Configure log retention
2. Set up alerts for suspicious activity
3. Export test logs
4. Document procedures

## Troubleshooting

### "Access Denied" Error
**Cause:** Email not in allowlist or MFA failed

**Fix:**
1. Verify email matches policy (exact domain)
2. Check MFA device is working
3. Review Access logs for denial reason
4. Clear browser cookies and retry

### Service Token Not Working
**Cause:** Token expired or headers incorrect

**Fix:**
```bash
# Verify token exists
npx wrangler secret list

# Check header format (note the specific header names)
curl -H "CF-Access-Client-Id: xxx" \
     -H "CF-Access-Client-Secret: xxx" \
     https://legal-exhibits-api.joe-1a2.workers.dev
```

### Can't Access from Mobile
**Cause:** Session cookie not set properly

**Fix:**
1. Use browser (not in-app browser)
2. Clear cookies
3. Re-authenticate
4. Save session

## Summary

### ✅ Recommended Setup
```
Private Hostname: legal-exhibits-api.joe-1a2.workers.dev
Access Control: Cloudflare Access
Authentication: Google Workspace (@theholetruth.org)
MFA: Enabled (recommended)
Service Token: For MCP server automated access
Audit Logging: Enabled
Cost: Free (under 50 users)
```

### 🔒 Security Benefits
- ✅ No public access
- ✅ Authentication required
- ✅ MFA support
- ✅ Complete audit trail
- ✅ Temporary guest access
- ✅ Service token for automation
- ✅ Per-case access control
- ✅ Compliance-ready

### 📊 What This Protects
- Sensitive legal documents
- Client information
- Case materials
- Privileged communications
- Personal identifiable information (PII)
- Work product

---

**Next Steps:**
1. Follow the setup steps above
2. Test browser access with your email
3. Create service token for MCP server
4. Enable MFA for team
5. Review audit logs regularly

For detailed setup instructions, see [CLOUDFLARE-ACCESS-SETUP.md](./CLOUDFLARE-ACCESS-SETUP.md)
