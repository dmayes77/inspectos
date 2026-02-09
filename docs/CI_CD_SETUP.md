# CI/CD Setup Guide

This document outlines the Continuous Integration and Continuous Deployment (CI/CD) workflow for InspectOS.

## Workflow Overview

```
Local Development → dev branch (testing) → main branch (production)
                     ↓                        ↓
                  Vercel Preview          Vercel Production
```

## Branch Strategy

### Development Branch (`dev`)
- **Purpose**: Integration and testing branch
- **Deployments**: Automatic preview deployments on Vercel
- **Protection**: CI checks must pass before merging to main
- **Usage**: All feature development and bug fixes

### Main Branch (`main`)
- **Purpose**: Production-ready code
- **Deployments**: Automatic production deployment on Vercel
- **Protection**: Requires passing CI checks and PR approval
- **Usage**: Stable releases only

## CI Pipeline

The CI pipeline runs automatically:
- **On every push to `dev`** - Validates all changes during development

That's it! No redundant checks on PRs or main since it's the same code that already passed on dev.

**How it works:**
1. Push to dev → CI validates the code
2. Create PR to main → No CI (code already validated)
3. Merge PR → Direct deployment

**Gate:** Branch protection on main requires the latest dev CI status to pass before allowing merge.

### Pipeline Stages

#### 1. Lint and Type Check
- **Duration**: ~2-3 minutes
- **Runs**: ESLint and TypeScript compiler checks
- **Packages checked**:
  - `shared` - Shared types, validations, and utilities
  - `auth` - Authentication utilities
  - `database` - Database client and types
  - `apps/web` - Next.js web application
  - `apps/server` - Next.js API server

**Command to run locally:**
```bash
pnpm -C shared type-check
pnpm -C auth type-check
pnpm -C database type-check
pnpm -C apps/web lint && pnpm -C apps/web type-check
pnpm -C apps/server lint && pnpm -C apps/server type-check
```

#### 2. Tests
- **Duration**: ~1-2 minutes
- **Runs**: Unit and integration tests
- **Coverage**: Web app tests with Vitest

**Command to run locally:**
```bash
pnpm -C apps/web test:run
```

#### 3. Build Check
- **Duration**: ~3-5 minutes
- **Runs**: Production build verification
- **Ensures**: Code compiles and builds successfully

**Command to run locally:**
```bash
pnpm -C shared build
pnpm -C auth build
pnpm -C database build
pnpm -C apps/web build
pnpm -C apps/server build
```

## Local Development Workflow

### 1. Feature Development

```bash
# Pull latest changes
git checkout dev
git pull origin dev

# Create feature branch (optional)
git checkout -b feature/your-feature-name

# Make changes and test locally
pnpm -C apps/web dev

# Run checks before committing
pnpm -C apps/web lint
pnpm -C apps/web type-check
pnpm -C apps/web test:run

# Commit changes
git add .
git commit -m "feat: your feature description"

# Push to dev for testing
git push origin dev  # or feature branch
```

### 2. Testing on Dev Branch

Every push to dev triggers:
- ✅ **CI pipeline** - Lint, type-check, test, build validation
- 🚀 **Vercel preview** - Automatic deployment with unique URL

**Workflow:**
1. Push to dev
2. Wait for CI to pass (watch GitHub Actions)
3. Review Vercel preview deployment
4. Test functionality in preview environment
5. If issues found, fix and push again to dev (CI runs again)
6. Once satisfied and CI green, ready to create PR to main

### 3. Merging to Main

```bash
# Ensure latest dev push passed CI
git log dev --oneline -1  # Check latest commit
gh run list --branch dev --limit 1  # Verify CI passed

# Create pull request from dev to main
gh pr create --base main --head dev --title "Release: [description]"

# After PR approval, merge (CI already passed on dev)
gh pr merge --squash

# Or merge via GitHub UI
```

**What happens:**
- No CI runs on PR creation (already validated on dev)
- Branch protection ensures latest dev CI passed before allowing merge
- PR is for code review and approval only
- Merge triggers production deployment on Vercel

## GitHub Actions Configuration

### Required Secrets

Set these in your GitHub repository settings:

**Repository Secrets** (`Settings → Secrets and variables → Actions`):
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (for server)
- `NEXT_PUBLIC_API_URL` - API server URL (optional, defaults to localhost:4000)

### Branch Protection Rules

#### For `main` branch (Required):

1. Go to `Settings → Branches → Add rule`
2. Branch name pattern: `main`
3. Enable:
   - ✅ Require a pull request before merging
   - ✅ Require approvals (1)
   - ✅ Require status checks to pass before merging
     - Select `CI Status Check` (this checks the dev branch CI status)
   - ✅ Require branches to be up to date before merging
   - ✅ Do not allow bypassing the above settings

**Important:** This ensures dev CI must pass before you can merge to main, even though CI doesn't run on the PR itself.

#### For `dev` branch (optional):

1. Branch name pattern: `dev`
2. Enable:
   - ✅ Require status checks to pass before merging
     - `CI Status Check`

## Vercel Integration

### Project Setup

1. **Web App** (`apps/web`)
   - **Production Branch**: `main`
   - **Preview Branches**: `dev`, feature branches
   - **Root Directory**: `apps/web`
   - **Build Command**: `pnpm build`
   - **Install Command**: `pnpm install`

2. **API Server** (`apps/server`)
   - **Production Branch**: `main`
   - **Preview Branches**: `dev`, feature branches
   - **Root Directory**: `apps/server`
   - **Build Command**: `pnpm build`
   - **Install Command**: `pnpm install`

### Environment Variables

**Production and Preview:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_DEFAULT_TENANT_ID`

## Common Issues and Solutions

### Pre-commit Hook Failures

If pre-commit hooks fail but local checks pass:

```bash
# Skip pre-commit hooks (use sparingly)
git commit --no-verify -m "your message"
```

**Note**: This bypasses local checks but CI will still catch issues.

### CI Failing on Type Checks

```bash
# Run type check locally
pnpm -C apps/web type-check
pnpm -C apps/server type-check

# Fix errors and commit
```

### Build Failures

```bash
# Test build locally
pnpm -C apps/web build

# Check for:
# - Missing environment variables
# - TypeScript errors
# - Import path issues
```

### Vercel Deployment Issues

1. **Check build logs** in Vercel dashboard
2. **Verify environment variables** are set correctly
3. **Ensure dependencies** are in package.json (not just devDependencies)
4. **Check build command** matches local build

## Best Practices

### Commits

- Use conventional commit format: `feat:`, `fix:`, `chore:`, `docs:`
- Write clear, descriptive commit messages
- Keep commits atomic and focused
- Reference issue numbers when applicable

### Pull Requests

- Provide clear PR description
- Link related issues
- Include testing steps
- Add screenshots for UI changes
- Ensure CI passes before requesting review

### Code Quality

- Run linting and type checks before pushing
- Write tests for new features
- Update documentation when changing behavior
- Keep PRs reasonably sized (< 500 lines when possible)

### Deployment

- Test thoroughly on `dev` preview before merging to `main`
- Monitor production deployment after merge
- Have rollback plan ready
- Communicate breaking changes to team

## Quick Reference Commands

```bash
# Install dependencies
pnpm install

# Run dev servers
pnpm -C apps/web dev          # Web app on :3000
pnpm -C apps/server dev       # API server on :4000

# Run checks
pnpm -C apps/web lint
pnpm -C apps/web type-check
pnpm -C apps/web test

# Build for production
pnpm -C apps/web build
pnpm -C apps/server build

# Git workflow
git checkout dev
git pull origin dev
# ... make changes ...
git add .
git commit -m "feat: description"
git push origin dev
```

## Support

For issues with CI/CD setup:
1. Check GitHub Actions logs
2. Review Vercel deployment logs
3. Consult this documentation
4. Create an issue in the repository
