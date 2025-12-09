# R2 Dashboard Setup

## Current Deployment

**R2 Explorer Dashboard:** https://exhibits.theholetruth.org

This is a basic file browser for the legal-exhibits R2 bucket.

### Features
- ✅ Browse files in R2 bucket
- ✅ View file sizes and upload dates
- ✅ Download files directly
- ✅ Search and filter
- ⚠️ **NOT YET PROTECTED** - Need to add to Cloudflare Access

## Securing the Dashboard

### Add to Cloudflare Access

1. Go to: https://dash.cloudflare.com/1a25a792e801e687b9fe4932030cf6a6/zero-trust/access/apps

2. Click **Add an application**

3. Configure:
   ```
   Name: Legal Exhibits Dashboard
   Application domain: exhibits.theholetruth.org
   Session duration: 24 hours
   ```

4. Add Allow Policy:
   ```
   Name: HOLE Team Access
   Include: Email domain is theholetruth.org
   ```

5. Save application

6. Test: Visit https://exhibits.theholetruth.org
   - Should redirect to login
   - After auth, see file browser

## Better Alternative: Custom Dashboard

The R2 Explorer is basic. For legal work, you might want a custom dashboard with:

### Enhanced Features
- **Case Organization** - Group exhibits by case number
- **Metadata** - Add descriptions, exhibit labels, Bates numbers
- **Access Control** - Per-case permissions
- **Search** - Full-text search across descriptions
- **Preview** - PDF thumbnail previews
- **Audit Trail** - Who viewed what, when
- **Annotations** - Add notes to exhibits

### Implementation Options

#### Option 1: React + PostgreSQL Full-Stack
Based on: https://github.com/cloudflare/templates/blob/main/react-postgres-fullstack-template

**Pros:**
- Custom UI tailored for legal exhibits
- Database for metadata (case info, descriptions, tags)
- User management and permissions
- Professional look and feel

**Tech Stack:**
- Frontend: React + TypeScript
- Backend: Cloudflare Worker
- Database: Postgres (or D1)
- Storage: R2 (existing bucket)
- Auth: Cloudflare Access

**What You'd Get:**
```
Dashboard Features:
├── Case Management
│   ├── List all cases
│   ├── View exhibits per case
│   └── Add case notes/descriptions
├── Exhibit Browser
│   ├── Thumbnail previews
│   ├── Metadata display (Bates #, date, type)
│   ├── Download with audit log
│   └── Full-text search
├── Upload Interface
│   ├── Drag & drop files
│   ├── Add descriptions/tags
│   ├── Auto-assign Bates numbers
│   └── Case association
└── Admin Panel
    ├── User management
    ├── Access logs
    ├── Storage usage
    └── Export reports
```

#### Option 2: Enhance R2 Explorer
Add custom metadata using R2 object metadata

**Simpler but limited:**
- Keep existing R2 Explorer
- Add metadata to R2 objects
- Extend with custom API endpoints

### Recommendation

For **professional legal document management**, I recommend building a custom dashboard:

**Phase 1 (Current):**
- ✅ R2 Explorer for quick file browsing
- ✅ Protect with Cloudflare Access

**Phase 2 (Next):**
- Build custom React dashboard
- Add D1 database for metadata
- Professional UI for case management
- Enhanced search and filtering

**Phase 3 (Future):**
- PDF annotations
- E-signature integration
- Automated Bates numbering
- Discovery production workflow

## MCP Server Integration

Your MCP server now has tools to query R2 files:

### Available Tools

1. **list_r2_files** - List files in bucket
2. **get_r2_file_info** - Get file metadata
3. **download_r2_file** - Download file locally
4. **get_r2_file_url** - Get download URL

### Usage in Claude Code

```
# List all files
> What files are in the R2 bucket?

# Search for specific exhibits
> Find all files with "sealed" in the name

# Download a file
> Download the file at uploads/S-A.pdf to my local machine

# Get file info
> Show me details about the master sealed exhibits file
```

### Environment Setup

The MCP server uses these environment variables from `.env`:

```bash
LEGAL_EXHIBITS_API_URL=https://legal-exhibits.theholetruth.org
CF_ACCESS_CLIENT_ID=79765cfff14db4bf63c4ec509ba2c2ee.access
CF_ACCESS_CLIENT_SECRET=5bd4e07a5f29268b1566811e87a1a0ebd45a41a8d423efe5b631a3c54ae3d2fb
```

## Next Steps

### Immediate (5 minutes)
1. Add exhibits.theholetruth.org to Cloudflare Access
2. Test dashboard with authentication
3. Try MCP server tools to query files

### Soon (1-2 hours)
1. Decide: Keep R2 Explorer or build custom dashboard?
2. If custom: Clone React template and customize
3. Add D1 database for metadata
4. Deploy custom dashboard

### Later (ongoing)
1. Organize files by case
2. Add descriptions and metadata
3. Build search functionality
4. Add team members with permissions

## Cost Comparison

### Option A: R2 Explorer (Current)
- **Cost:** $0/month (included)
- **Features:** Basic file browser
- **Setup time:** Done ✅

### Option B: Custom Dashboard
- **Cost:** $1-2/month (D1 database)
- **Features:** Full case management system
- **Setup time:** 2-3 hours
- **Value:** Professional legal document system

---

**Current Status:**
- ✅ R2 Explorer deployed
- ✅ Connected to legal-exhibits bucket
- ⏳ Needs Cloudflare Access protection
- ✅ MCP tools ready for file querying

**Recommendation:**
Start with R2 Explorer for now, plan custom dashboard as Phase 2.
