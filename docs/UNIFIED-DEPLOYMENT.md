# Unified Deployment - Single URL for Dashboard & API

## The Solution

We've implemented smart routing at `https://legal-exhibits.theholetruth.org`:

### How It Works

**Same URL, Different Routes:**

```
Browser Access:
https://legal-exhibits.theholetruth.org
  → Shows R2 Explorer Dashboard (visual file browser)

API Access:
https://legal-exhibits.theholetruth.org/files
https://legal-exhibits.theholetruth.org/upload
  → JSON API responses for programmatic access
```

### Routes

| Path | Method | Purpose | Returns |
|------|--------|---------|---------|
| `/` | GET | Dashboard (browser) | HTML/Dashboard |
| `/` | GET | API info (Accept: application/json) | JSON status |
| `/upload` | POST | Upload file | JSON |
| `/files` | GET | List files | JSON |
| `/files/:key` | GET | Download file | PDF |
| `/merge` | POST | Merge PDFs | JSON |
| `/split` | POST | Split PDF | JSON |
| `/jobs/:id` | GET | Job status | JSON |

### Browser vs API Detection

**The Worker detects:**
1. **Accept header** - `application/json` → API response
2. **User Agent** - `curl`, `python` → API response
3. **Default** - Browser → Dashboard

### Testing

**Test API access:**
```bash
curl -H "Accept: application/json" \
     -H "CF-Access-Client-Id: YOUR_ID" \
     -H "CF-Access-Client-Secret: YOUR_SECRET" \
     https://legal-exhibits.theholetruth.org
```

**Test Browser access:**
```
Open in browser: https://legal-exhibits.theholetruth.org
Should show R2 Explorer dashboard after authentication
```

## Benefits

✅ **Single domain** - No confusion about which URL to use
✅ **Smart routing** - Automatically detects browser vs API
✅ **One Access policy** - Protect both dashboard and API
✅ **Simpler configuration** - No need for multiple Workers
✅ **Better UX** - Users just visit one URL

## Current Implementation

The combined Worker now serves:
- **Dashboard assets** at root path (for browsers)
- **API endpoints** at specific paths (for programmatic access)
- **Both protected** by the same Cloudflare Access policy

No need for separate `exhibits.theholetruth.org` domain!

---

**Deployment Status:** ✅ Live at https://legal-exhibits.theholetruth.org
