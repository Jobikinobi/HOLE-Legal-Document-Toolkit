# Versioning Guide

This project follows [Semantic Versioning](https://semver.org/) (SemVer).

## Version Format

**MAJOR.MINOR.PATCH** (e.g., 1.0.0)

- **MAJOR** - Incompatible API changes
- **MINOR** - New functionality (backwards compatible)
- **PATCH** - Bug fixes (backwards compatible)

## Current Version

**v1.0.0** (December 9, 2025)

See [CHANGELOG.md](CHANGELOG.md) for release history.

## When to Increment

### MAJOR Version (x.0.0)

Increment when making incompatible changes:
- Breaking API changes
- Removing features
- Changing authentication methods
- Major architectural changes
- Database schema breaking changes

**Examples:**
- 1.0.0 → 2.0.0: Change service token authentication method
- 2.0.0 → 3.0.0: Remove R2 Explorer, replace with custom dashboard

### MINOR Version (1.x.0)

Increment when adding new features (backwards compatible):
- New MCP tools
- New API endpoints
- New Worker features
- Enhanced dashboard features
- New documentation sections

**Examples:**
- 1.0.0 → 1.1.0: Add per-case access control
- 1.1.0 → 1.2.0: Add PDF annotation tools
- 1.2.0 → 1.3.0: Add custom dashboard UI

### PATCH Version (1.0.x)

Increment for backwards-compatible bug fixes:
- Security patches
- Bug fixes
- Documentation corrections
- Performance improvements
- Dependency updates (non-breaking)

**Examples:**
- 1.0.0 → 1.0.1: Fix service token expiration bug
- 1.0.1 → 1.0.2: Update documentation typos
- 1.0.2 → 1.0.3: Performance improvement in PDF optimization

## Release Process

### 1. Update Version Files

```bash
# Update package.json
npm version [major|minor|patch]

# Update VERSION file
echo "1.1.0" > VERSION
```

### 2. Update CHANGELOG.md

Add new section at the top:

```markdown
## [1.1.0] - YYYY-MM-DD

### Added
- New feature descriptions

### Changed
- Changed feature descriptions

### Fixed
- Bug fix descriptions

### Security
- Security update descriptions
```

### 3. Commit Changes

```bash
git add package.json VERSION CHANGELOG.md
git commit -m "chore: Bump version to 1.1.0"
```

### 4. Create Git Tag

```bash
git tag -a v1.1.0 -m "Release v1.1.0 - Brief description

Key changes:
- Feature 1
- Feature 2
- Fix 1"
```

### 5. Push to GitHub

```bash
git push origin <branch-name>
git push origin v1.1.0
```

### 6. Create GitHub Release

```bash
gh release create v1.1.0 \
  --title "v1.1.0 - Release Title" \
  --notes-file release-notes.md
```

Or manually at: https://github.com/Jobikinobi/HOLE-Legal-Document-Toolkit/releases/new

## Version Lifecycle

### Development
- Working branch: `claude/legal-exhibits-toolkit-*`
- Version: Development (unreleased)
- Status: Unstable

### Pre-release
- Tag: `v1.1.0-beta.1`, `v1.1.0-rc.1`
- Status: Testing
- Usage: Limited testing only

### Stable Release
- Tag: `v1.1.0`
- Status: Production ready
- Usage: Recommended for all users

### Maintenance
- Patch releases for critical bugs
- Security updates
- Documentation fixes

### Deprecated
- Announced in CHANGELOG
- Minimum 6 months notice before removal
- Migration guide provided

## Breaking Changes

When releasing breaking changes (MAJOR version):

1. **Announce in advance**
   - Add deprecation warnings
   - Update documentation
   - Provide migration guide

2. **Document thoroughly**
   - What changed
   - Why it changed
   - How to migrate
   - Code examples

3. **Provide migration path**
   - Step-by-step instructions
   - Scripts if possible
   - Support period

## Hotfix Process

For critical bugs in production:

1. **Create hotfix branch**
   ```bash
   git checkout -b hotfix/v1.0.1 v1.0.0
   ```

2. **Fix the bug**
   ```bash
   # Make fixes
   git commit -m "fix: Critical bug description"
   ```

3. **Bump patch version**
   ```bash
   npm version patch
   echo "1.0.1" > VERSION
   ```

4. **Update CHANGELOG**
   ```markdown
   ## [1.0.1] - YYYY-MM-DD

   ### Fixed
   - Critical bug description
   ```

5. **Release hotfix**
   ```bash
   git tag -a v1.0.1 -m "Hotfix v1.0.1"
   git push origin hotfix/v1.0.1
   git push origin v1.0.1
   ```

6. **Deploy immediately**
   ```bash
   cd cloudflare-worker
   npm run deploy
   ```

## Version Tags

### Tag Format

- **Stable:** `v1.0.0`
- **Pre-release:** `v1.1.0-beta.1`, `v1.1.0-rc.1`
- **Hotfix:** `v1.0.1`

### Tag Naming

- Always prefix with `v`
- Use semantic version format
- Annotated tags (not lightweight)
- Include release notes in tag message

## Component Versioning

### Monorepo Structure

```
legal-exhibits-toolkit (1.0.0)
├── mcp-server (1.0.0)
├── cloudflare-worker (1.0.0)
└── r2-explorer (1.0.0)
```

All components share the same version number for simplicity.

### Independent Versioning

If needed in the future, components can version independently:
- MCP server: `v1.2.0`
- Worker API: `v1.1.0`
- Dashboard: `v1.0.1`

## Changelog Guidelines

Follow [Keep a Changelog](https://keepachangelog.com/) format:

### Categories

- **Added** - New features
- **Changed** - Changes in existing functionality
- **Deprecated** - Soon-to-be removed features
- **Removed** - Removed features
- **Fixed** - Bug fixes
- **Security** - Security updates

### Example Entry

```markdown
## [1.1.0] - 2025-12-15

### Added
- Per-case access control in Cloudflare Access
- PDF annotation tools in MCP server
- Custom dashboard UI with React

### Changed
- Improved PDF optimization performance (30% faster)
- Updated Cloudflare Access policies

### Fixed
- Service token expiration handling
- R2 Explorer pagination bug

### Security
- Updated authentication token encryption
```

## Release Checklist

- [ ] All tests passing
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] VERSION file updated
- [ ] package.json version bumped
- [ ] Git tag created
- [ ] GitHub release created
- [ ] Deployed to production
- [ ] Tested in production
- [ ] Team notified

## Communication

### Release Announcements

After each release:
1. Create GitHub release with notes
2. Update team via Slack/email
3. Update documentation site (if applicable)
4. Announce breaking changes prominently

### Version Support

- **Latest stable:** Full support
- **Previous MAJOR:** Security fixes only (6 months)
- **Older versions:** Unsupported (upgrade recommended)

## Automation (Future)

Consider automating:
- Version bumping
- CHANGELOG generation
- GitHub release creation
- Deployment triggers
- Notification sending

Tools: GitHub Actions, semantic-release, standard-version

---

## Quick Reference

| Type | Version Change | Example | When |
|------|---------------|---------|------|
| **Breaking** | MAJOR | 1.0.0 → 2.0.0 | Incompatible changes |
| **Feature** | MINOR | 1.0.0 → 1.1.0 | New features (compatible) |
| **Bugfix** | PATCH | 1.0.0 → 1.0.1 | Bug fixes |
| **Hotfix** | PATCH | 1.0.0 → 1.0.1 | Critical fixes |

## Resources

- [Semantic Versioning](https://semver.org/)
- [Keep a Changelog](https://keepachangelog.com/)
- [GitHub Releases](https://docs.github.com/en/repositories/releasing-projects-on-github)
- [npm version](https://docs.npmjs.com/cli/v8/commands/npm-version)
