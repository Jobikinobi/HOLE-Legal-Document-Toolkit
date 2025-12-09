# Secure the R2 Explorer Dashboard

## Quick Setup (5 minutes)

Your R2 Explorer dashboard is live at **https://exhibits.theholetruth.org** but currently **NOT PROTECTED**.

Anyone can access it right now. Let's fix that:

### Add to Cloudflare Access

1. **Go to:** https://dash.cloudflare.com/1a25a792e801e687b9fe4932030cf6a6/zero-trust/access/apps

2. **Click:** "Add an application"

3. **Configure Application:**
   ```
   Name: Legal Exhibits Dashboard

   Application domain:
   - Subdomain: exhibits
   - Domain: theholetruth.org
   - Path: (leave empty)

   Session Duration: 24 hours
   ```

4. **Click:** "Next"

5. **Add Policy:**
   ```
   Policy Name: HOLE Team Access
   Action: Allow

   Include:
   - Email domain is: theholetruth.org

   (or specific emails like joe@theholetruth.org)
   ```

6. **Click:** "Next" then "Add application"

7. **Wait 30-60 seconds** for changes to propagate

### Test Protection

```bash
# Should show 302 redirect to login
curl -I https://exhibits.theholetruth.org

# Expected:
HTTP/2 302
location: https://theholetruth.cloudflareaccess.com/...
```

### Access the Dashboard

1. Open browser (incognito recommended for first test)
2. Visit: https://exhibits.theholetruth.org
3. Should see Cloudflare Access login
4. Enter your @theholetruth.org email
5. Enter one-time PIN from email
6. See R2 file browser!

## What You Can Do

Once logged in, you can:

- **Browse files** - See all PDFs in R2 bucket
- **Search** - Filter by filename
- **Download** - Click to download any file
- **View details** - File size, upload date

## Current Files

You should see:
- `test/Master - Sealed Exhibits.pdf` (11.1 MB)
- `uploads/1765267354584_S-A.pdf` (690 KB)
- `test-upload.txt` (test file)

## Security Status After Setup

- ✅ Authentication required
- ✅ Only @theholetruth.org emails
- ✅ Session expires after 24 hours
- ✅ Audit logs enabled
- ✅ MFA support (if enabled in policy)

---

**Next:** Once secured, update your team on the new dashboard URL!
