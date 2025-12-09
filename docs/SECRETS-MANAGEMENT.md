# Secrets Management Guide

The Legal Exhibits Toolkit uses **Cloudflare Secrets** for secure credential management. API keys and credentials are never stored in files or version control.

## Why Cloudflare Secrets?

✅ **Never stored locally** - Credentials only exist in Cloudflare's secure vault
✅ **Authentication required** - Must log into Cloudflare to access
✅ **Audit logging** - Track who accesses secrets and when
✅ **Automatic rotation** - Easy to update without code changes
✅ **Environment isolation** - Different secrets for dev/staging/production

## Secrets Used

### Worker Secrets (Cloudflare-managed)

| Secret Name | Purpose | Scope |
|-------------|---------|-------|
| `R2_ACCESS_KEY_ID` | R2 bucket access | Worker only |
| `R2_SECRET_ACCESS_KEY` | R2 bucket access | Worker only |

These secrets are **only accessible to the Worker** and cannot be read via CLI for security.

### Local Development Secrets

For local development (rclone, testing), you have two options:

1. **Recommended:** Use `.dev.vars` file (gitignored, never committed)
2. **Alternative:** Configure rclone interactively when needed

## Setup Instructions

### 1. Store Secrets in Cloudflare (One-time setup)

```bash
cd cloudflare-worker

# Store R2 credentials as secrets
npx wrangler secret put R2_ACCESS_KEY_ID
# Paste: 6525460939c609aa32777d845ac305c9

npx wrangler secret put R2_SECRET_ACCESS_KEY
# Paste: 3b87f9a403ce41d74cc7b56d0860eef59095aaccef5087915f4f52942ee4a74a
```

**✅ Done!** Credentials are now stored securely in Cloudflare.

### 2. Configure Local Access

Run the configuration script:

```bash
./scripts/configure-r2-from-secrets.sh
```

This interactive script will guide you through three options:

#### Option 1: Worker Development (Recommended)
- Secrets automatically available during `wrangler dev`
- No local credential storage needed
- Best for testing Worker endpoints

```bash
cd cloudflare-worker
npx wrangler dev
# Secrets are injected automatically
```

#### Option 2: Local Development with .dev.vars
- Create `.dev.vars` file (gitignored)
- Use for local testing
- Never committed to git

```bash
# Script creates cloudflare-worker/.dev.vars template
# Edit and add credentials manually
```

#### Option 3: Configure rclone
- For command-line file operations
- Credentials entered interactively
- Stored in rclone config (gitignored)

```bash
# Script prompts for credentials
# Configures rclone automatically
```

## Accessing Secrets

### From Cloudflare Worker

Secrets are available as environment variables:

```typescript
export default {
  async fetch(request: Request, env: Env) {
    const accessKeyId = env.R2_ACCESS_KEY_ID;
    const secretAccessKey = env.R2_SECRET_ACCESS_KEY;

    // Use for R2 access, external APIs, etc.
  }
}
```

### From Local Development

**During `wrangler dev`:**
```bash
cd cloudflare-worker
npx wrangler dev

# Secrets automatically injected from Cloudflare
# No local .dev.vars needed
```

**With .dev.vars file:**
```bash
# cloudflare-worker/.dev.vars
R2_ACCESS_KEY_ID=your_key_here
R2_SECRET_ACCESS_KEY=your_secret_here

# wrangler reads .dev.vars automatically
npx wrangler dev --local
```

## Viewing Secrets

### List secrets (names only)
```bash
cd cloudflare-worker
npx wrangler secret list
```

Output:
```
Secret Name
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
```

### View secret values

Secret values **cannot be read via CLI** by design. This is a security feature.

To view/update secrets:
1. Go to Cloudflare Dashboard
2. Navigate to: Workers & Pages > legal-exhibits-api > Settings > Variables
3. Click "Reveal" (requires authentication)

## Updating Secrets

### Update a secret
```bash
npx wrangler secret put R2_ACCESS_KEY_ID
# Enter new value
```

### Delete a secret
```bash
npx wrangler secret delete R2_ACCESS_KEY_ID
```

### Rotate credentials

When rotating R2 credentials:

1. Generate new R2 token in Cloudflare Dashboard
2. Update secrets:
   ```bash
   npx wrangler secret put R2_ACCESS_KEY_ID
   npx wrangler secret put R2_SECRET_ACCESS_KEY
   ```
3. Update local rclone:
   ```bash
   ./scripts/configure-r2-from-secrets.sh
   # Choose Option 3 to reconfigure
   ```
4. Test the Worker:
   ```bash
   npx wrangler dev
   ```

## Security Best Practices

### ✅ DO

- ✅ Store ALL credentials in Cloudflare Secrets
- ✅ Use `.dev.vars` for local development (it's gitignored)
- ✅ Rotate secrets periodically (every 90 days)
- ✅ Use different secrets for production/staging
- ✅ Enable Cloudflare Access for production API
- ✅ Review audit logs regularly

### ❌ DON'T

- ❌ Commit `.dev.vars` to git
- ❌ Share secret values in Slack/email
- ❌ Store secrets in environment variables permanently
- ❌ Use the same secrets across multiple projects
- ❌ Hard-code credentials in source files
- ❌ Check in rclone config files

## Multi-Environment Setup

For staging/production isolation:

### Production Environment
```bash
cd cloudflare-worker

# Use production secrets
npx wrangler secret put R2_ACCESS_KEY_ID --env production
npx wrangler secret put R2_SECRET_ACCESS_KEY --env production

# Deploy to production
npx wrangler deploy --env production
```

### Staging Environment
```bash
# Use staging secrets
npx wrangler secret put R2_ACCESS_KEY_ID --env staging
npx wrangler secret put R2_SECRET_ACCESS_KEY --env staging

# Deploy to staging
npx wrangler deploy --env staging
```

Configure in `wrangler.toml`:
```toml
[env.production]
name = "legal-exhibits-api-prod"
vars = { ENVIRONMENT = "production" }

[env.staging]
name = "legal-exhibits-api-staging"
vars = { ENVIRONMENT = "staging" }
```

## Troubleshooting

### "Secret not found" error

**Problem:** Worker can't access secrets

**Solution:**
```bash
# Verify secrets exist
npx wrangler secret list

# Re-add if missing
npx wrangler secret put R2_ACCESS_KEY_ID
```

### Local rclone fails with "Access Denied"

**Problem:** Local rclone credentials outdated

**Solution:**
```bash
# Reconfigure rclone with current credentials
./scripts/configure-r2-from-secrets.sh
# Choose Option 3
```

### .dev.vars not working

**Problem:** Worker not reading .dev.vars

**Solution:**
```bash
# Make sure you're in cloudflare-worker directory
cd cloudflare-worker

# Use --local flag to read .dev.vars
npx wrangler dev --local

# Verify .dev.vars format (no quotes):
R2_ACCESS_KEY_ID=value_here
R2_SECRET_ACCESS_KEY=value_here
```

## Audit and Compliance

### View secret access logs

1. Go to Cloudflare Dashboard
2. Navigate to: Account > Audit Log
3. Filter by: "secrets" or "legal-exhibits-api"
4. Export for compliance records

### Secret rotation policy

Recommended schedule:
- **Every 90 days:** Rotate R2 credentials
- **After employee departure:** Rotate all secrets
- **After suspected breach:** Rotate immediately
- **Major version upgrade:** Audit and rotate as needed

## Alternative: Cloudflare Access Service Tokens

For even more security, use Cloudflare Access Service Tokens:

```bash
# Create service token for MCP server
# Dashboard: Zero Trust > Access > Service Auth

# Token is automatically rotated
# Can be revoked instantly
# Provides audit trail
```

See [CLOUDFLARE-ACCESS-SETUP.md](./CLOUDFLARE-ACCESS-SETUP.md) for details.

## Summary

| Aspect | Solution |
|--------|----------|
| **Worker secrets** | Cloudflare Secrets (wrangler CLI) |
| **Local development** | .dev.vars file (gitignored) |
| **rclone config** | Interactive setup, stored locally (gitignored) |
| **Rotation** | Update via wrangler CLI |
| **Audit** | Cloudflare Audit Log |
| **Access control** | Cloudflare authentication required |

---

**Security Note:** This approach ensures credentials are never committed to git, shared insecurely, or stored in plain text. Only authenticated Cloudflare users can access secrets.
