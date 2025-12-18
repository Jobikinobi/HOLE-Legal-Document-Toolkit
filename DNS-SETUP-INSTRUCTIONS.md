# DNS Setup for legal-exhibits.theholetruth.org

The Worker is deployed with the custom domain route, but DNS needs to be configured manually.

## Option 1: Automatic (Check First)

Cloudflare may have automatically created the DNS record. Check if it exists:

1. Go to: https://dash.cloudflare.com/1a25a792e801e687b9fe4932030cf6a6/theholetruth.org/dns/records
2. Look for a record named: `legal-exhibits`
3. If it exists, wait 1-2 minutes for DNS propagation
4. Test: `curl -I https://legal-exhibits.theholetruth.org`

## Option 2: Manual DNS Setup (If Needed)

If the DNS record doesn't exist, create it manually:

### Step 1: Add DNS Record

1. Go to: https://dash.cloudflare.com/1a25a792e801e687b9fe4932030cf6a6/theholetruth.org/dns/records

2. Click **Add record**

3. Configure:
   ```
   Type: CNAME
   Name: legal-exhibits
   Target: legal-exhibits-api.joe-1a2.workers.dev
   Proxy status: Proxied (orange cloud)
   TTL: Auto
   ```

4. Click **Save**

### Step 2: Wait for DNS Propagation

- Usually takes: 1-5 minutes
- Maximum: 24 hours (rare)

### Step 3: Test

```bash
# Test DNS resolution
dig legal-exhibits.theholetruth.org

# Test HTTPS access
curl -I https://legal-exhibits.theholetruth.org

# Expected: HTTP 200 with API response
```

## Option 3: Alternative - Use Workers Route Instead

If you prefer not to manage DNS, you can use a Workers route on an existing subdomain:

### Update wrangler.toml:

```toml
# Instead of custom_domain, use a route
routes = [
  { pattern = "theholetruth.org/legal-exhibits/*", zone_name = "theholetruth.org" }
]
```

Then access at: `https://theholetruth.org/legal-exhibits/`

## Next Steps After DNS is Working

Once `https://legal-exhibits.theholetruth.org` is accessible:

1. **Update Cloudflare Access:**
   - Go to: Zero Trust > Access > Applications
   - Edit "Legal Exhibits API" application
   - Change domain to: `legal-exhibits.theholetruth.org`
   - Save

2. **Test Access Protection:**
   ```bash
   # Should redirect to login (302)
   curl -I https://legal-exhibits.theholetruth.org
   ```

3. **Update all references:**
   - Documentation
   - MCP server configuration
   - Service tokens
   - rclone endpoints

## Troubleshooting

### DNS not resolving after 5 minutes

**Check Cloudflare settings:**
1. Ensure `theholetruth.org` is using Cloudflare nameservers
2. Check DNS records are proxied (orange cloud)
3. Verify no conflicting records

**Force DNS refresh:**
```bash
# Flush local DNS cache
sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder

# Check DNS propagation globally
https://dnschecker.org/#CNAME/legal-exhibits.theholetruth.org
```

### Certificate errors

Cloudflare automatically provisions SSL certificates for custom domains. If you see certificate errors:

1. Wait 5-10 minutes for certificate provisioning
2. Check SSL/TLS settings: Full (strict) mode recommended
3. Verify DNS is proxied (orange cloud)

---

**Current Status:**
- ✅ Worker deployed with custom domain route
- ⏳ DNS record needs to be created/verified
- ⏳ Access configuration pending DNS
